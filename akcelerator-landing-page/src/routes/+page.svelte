<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import {
    PORTALS,
    MICRO_ACTIONS,
    CZECH_CITIES,
    HOPE_FACTS,
    EVIDENCE_TIERS,
    VALUES,
    recommendActions,
  } from "../lib/data/czech-actions.js";
  import { recordSmallWin, completedSteps } from "../lib/progress.js";
  import {
    trackEvent,
    trackFunnel,
    markActionStarted,
    startedActionIds,
    openBrokenLinkReport,
  } from "../lib/analytics.js";

  const HOME_MODES = {
    couch: {
      label: "🛋️ Mám 2 min",
      hint: "Okamžitý mikro-skutek online · 0 Kč · bez registrace",
      timeBucket: "5",
      mode: "online",
      social: "solo",
      cost: "free",
      commitment: "one_off",
    },
    focus: {
      label: "🔬 Mám 15 min",
      hint: "Občanská věda, fotopasti nebo humanitární mapování z domova",
      timeBucket: "15",
      mode: "online",
      social: "solo",
      cost: "free",
      commitment: "any",
    },
    walk: {
      label: "📍 Osobně",
      hint: "Konkrétní pomoc venku v tvém okolí bez obrazovek",
      timeBucket: "15",
      mode: "local",
      social: "solo",
      cost: "free",
      commitment: "any",
    },
    people: {
      label: "🌱 Dlouhodobě",
      hint: "Smysluplné dobrovolnictví, dárcovství nebo pravidelná pomoc s lidmi",
      timeBucket: "45",
      mode: "local",
      social: "group",
      cost: "free",
      commitment: "long_term",
    },
  };

  const QUICK_CITIES = CZECH_CITIES.slice(0, 8);

  const ACTION_ALIASES = {
    "click-and-feed": "zvirata_utulek_online",
    click_and_feed: "zvirata_utulek_online",
    mapswipe: "missing_maps",
  };

  let energyMode = "couch";
  let suggestionIndex = 0;
  let lastQuickActionId = "";
  let excludeQuickId = "";
  let pinnedActionId = "";
  let hopeIdx = 0;
  let savedValues = [];
  let usePersonalValues = false;

  let awaitingPartnerReturn = false;
  let partnerLeaveTimestamp = 0;
  let partnerReturnPromptVisible = false;
  let justCompleted = false;
  let copiedDirectLink = false;
  let copyLinkTimer = null;

  function resolveActionFromParam(rawParam) {
    if (!rawParam) return null;
    const cleaned = String(rawParam).trim().replace(/^[#?]+/, "");
    if (!cleaned) return null;
    const aliased = ACTION_ALIASES[cleaned.toLowerCase()] || cleaned;
    const normalizedUnderscore = aliased.replace(/-/g, "_").toLowerCase();
    const normalizedHyphen = aliased.replace(/_/g, "-").toLowerCase();
    return (
      MICRO_ACTIONS.find(
        (a) =>
          a.id === aliased ||
          a.id.toLowerCase() === normalizedUnderscore ||
          a.id.toLowerCase().replace(/_/g, "-") === normalizedHyphen,
      ) || null
    );
  }

  function inferEnergyModeForAction(action) {
    if (!action) return "couch";
    if (action.commitment === "long_term") return "people";
    if (action.mode === "local") return "walk";
    if (Number(action.timeMinutes) > 5) return "focus";
    return "couch";
  }

  function applyUrlDeepLink(targetUrl, preferHash = false) {
    try {
      const url =
        targetUrl instanceof URL
          ? targetUrl
          : typeof window !== "undefined"
            ? new URL(window.location.href)
            : null;
      if (!url) return;
      const intentParam = url.searchParams.get("intent");
      if (intentParam && HOME_MODES[intentParam]) {
        energyMode = intentParam;
      }

      const queryAction = url.searchParams.get("action");
      const rawHash =
        (targetUrl instanceof URL ? targetUrl.hash : "") ||
        (typeof window !== "undefined" ? window.location.hash : "") ||
        "";
      let hashAction = null;
      if (rawHash) {
        const hashRaw = rawHash.replace(/^#/, "");
        if (hashRaw.startsWith("action=")) {
          hashAction = decodeURIComponent(hashRaw.slice("action=".length));
        } else if (hashRaw.includes("action=")) {
          const hashParams = new URLSearchParams(hashRaw);
          hashAction = hashParams.get("action");
        }
      }

      const actionParam = preferHash ? (hashAction || queryAction) : (hashAction || queryAction);
      if (actionParam) {
        const matched = resolveActionFromParam(actionParam);
        if (matched) {
          energyMode = inferEnergyModeForAction(matched);
          pinnedActionId = matched.id;
          lastQuickActionId = matched.id;
        }
      } else {
        pinnedActionId = "";
      }
    } catch {}
  }

  $: if ($page?.url) {
    applyUrlDeepLink($page.url);
  }

  onMount(() => {
    try {
      const raw = localStorage.getItem("aa_values");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedValues = parsed;
        }
      }
    } catch {}

    applyUrlDeepLink();

    const handleHashChange = () => applyUrlDeepLink(undefined, true);

    const triggerPartnerReturnIfReady = () => {
      if (!awaitingPartnerReturn || partnerReturnPromptVisible || justCompleted) return;
      const elapsed = Date.now() - partnerLeaveTimestamp;
      if (elapsed >= 3000) {
        awaitingPartnerReturn = false;
        partnerReturnPromptVisible = true;
        try {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(40);
          }
        } catch {}
        trackEvent("aa_partner_return_prompt", {
          id: currentQuickAction?.id || lastQuickActionId,
          elapsedMs: elapsed,
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerPartnerReturnIfReady();
      }
    };

    const handleWindowFocus = () => {
      triggerPartnerReturnIfReady();
    };

    window.addEventListener("hashchange", handleHashChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      if (copyLinkTimer) clearTimeout(copyLinkTimer);
    };
  });

  const FIREFLIES = [
    { left: "8%", top: "24%", size: 5, delay: "0s", dur: "7.5s", gold: true },
    {
      left: "19%",
      top: "68%",
      size: 4,
      delay: "1.4s",
      dur: "8.8s",
      gold: false,
    },
    {
      left: "34%",
      top: "20%",
      size: 5,
      delay: "2.6s",
      dur: "7.2s",
      gold: true,
    },
    {
      left: "48%",
      top: "74%",
      size: 6,
      delay: "0.8s",
      dur: "9.1s",
      gold: true,
    },
    {
      left: "64%",
      top: "18%",
      size: 5,
      delay: "1.9s",
      dur: "8.3s",
      gold: false,
    },
    {
      left: "81%",
      top: "22%",
      size: 7,
      delay: "2.2s",
      dur: "9.4s",
      gold: true,
    },
    {
      left: "90%",
      top: "60%",
      size: 5,
      delay: "1.5s",
      dur: "7.1s",
      gold: false,
    },
  ];

  $: activeModeCfg = HOME_MODES[energyMode] || HOME_MODES.couch;

  $: quickPool = recommendActions({
    values: usePersonalValues ? savedValues : [],
    timeBucket: activeModeCfg.timeBucket,
    cost: activeModeCfg.cost,
    mode: activeModeCfg.mode,
    social: activeModeCfg.social,
    commitment: activeModeCfg.commitment,
    completedIds: ($completedSteps || []).map((s) => s.id),
    excludeIds: excludeQuickId ? [excludeQuickId] : [],
    seed: `home:${energyMode}:${suggestionIndex}`,
  });

  $: pinnedAction = pinnedActionId
    ? MICRO_ACTIONS.find((a) => a.id === pinnedActionId) || null
    : null;
  $: currentQuickAction =
    pinnedAction || (quickPool.length ? quickPool[0] : null);
  $: if (currentQuickAction?.id) {
    lastQuickActionId = currentQuickAction.id;
  }
  $: isCurrentStarted = Boolean(
    currentQuickAction?.id &&
      Array.isArray($startedActionIds) &&
      $startedActionIds.includes(currentQuickAction.id),
  );

  $: activeHope = HOPE_FACTS[hopeIdx % HOPE_FACTS.length];

  function setEnergyMode(mode) {
    pinnedActionId = "";
    awaitingPartnerReturn = false;
    partnerReturnPromptVisible = false;
    justCompleted = false;
    if (energyMode === mode) {
      nextQuickIdea();
      return;
    }
    excludeQuickId = lastQuickActionId;
    energyMode = mode;
    suggestionIndex = 0;
    trackEvent("aa_home_energy_mode", { mode });
    trackFunnel("intent_selected", { surface: "home_instant", mode });
    trackFunnel("recommendation_shown", {
      surface: "home_instant",
      mode,
      index: 0,
    });
  }

  function nextQuickIdea() {
    pinnedActionId = "";
    awaitingPartnerReturn = false;
    partnerReturnPromptVisible = false;
    justCompleted = false;
    excludeQuickId = lastQuickActionId;
    suggestionIndex += 1;
    trackEvent("aa_home_next_idea", {
      mode: energyMode,
      index: suggestionIndex,
    });
    trackFunnel("recommendation_shown", {
      surface: "home_instant",
      mode: energyMode,
      index: suggestionIndex,
    });
  }

  function handleStartQuickAction(action) {
    if (!action) return;
    awaitingPartnerReturn = true;
    partnerLeaveTimestamp = Date.now();
    partnerReturnPromptVisible = false;
    justCompleted = false;
    markActionStarted(action.id, "home_instant");
    trackEvent("aa_clickout", { surface: "home_instant", id: action.id });
  }

  function completeQuickAction(action) {
    if (!action) return;
    justCompleted = true;
    awaitingPartnerReturn = false;
    partnerReturnPromptVisible = false;
    recordSmallWin({
      id: action.id,
      title: action.title,
      surface: "home_instant",
    });
    trackEvent("aa_small_win_done", {
      surface: "home_instant",
      id: action.id,
      initiated: isCurrentStarted,
    });
  }

  async function shareDirectActionLink(action) {
    if (!action || typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/?action=${encodeURIComponent(action.id)}`;
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      }
    } catch {}
    if (!copied && typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: cleanTitle(action.title),
          url: shareUrl,
        });
        copied = true;
      } catch {}
    }
    copiedDirectLink = true;
    if (copyLinkTimer) clearTimeout(copyLinkTimer);
    copyLinkTimer = setTimeout(() => {
      copiedDirectLink = false;
    }, 2600);
    trackEvent("aa_share_direct_action", { id: action.id });
  }

  function cleanTitle(str) {
    return (
      String(str || "")
        .replace(
          /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D\u2640\u2642\s]+/u,
          "",
        )
        .trim() || str
    );
  }

  function getSavedValueLabels(ids) {
    return VALUES.filter((v) => ids.includes(v.key || v.id))
      .map((v) =>
        v.label
          .replace(
            /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D\u2640\u2642\s]+/u,
            "",
          )
          .trim(),
      )
      .slice(0, 2)
      .join(", ");
  }
</script>

<div class="home-page">
  <!-- =====================================================================
       1. CALM CINEMATIC HERO + MINIMALIST INSTANT ACTION CARD
       ===================================================================== -->
  <section class="hero-stage">
    <div class="hero-painted-backdrop" aria-hidden="true"></div>
    <div class="hero-aurora" aria-hidden="true"></div>
    <div class="fireflies-layer" aria-hidden="true">
      {#each FIREFLIES as f}
        <span
          class="firefly"
          class:gold={f.gold}
          style="left:{f.left}; top:{f.top}; width:{f.size}px; height:{f.size}px; animation-delay:{f.delay}; animation-duration:{f.dur};"
        ></span>
      {/each}
    </div>

    <div class="hero-inner">
      <div class="hero-copy">
        <div class="hero-overline">
          <span class="live-dot"></span>
          <span
            >Zdarma a bez účtu · {MICRO_ACTIONS.length} ověřených cest v Česku</span
          >
        </div>

        <h1 class="hero-title">
          Pomáhat může být lehké.
          <span class="hero-serif">Stačí jeden dobrý skutek dnes.</span>
        </h1>

        <p class="hero-lead">
          Zvol si, kolik máš zrovna času, najdi místo pomoci ve svém okolí nebo
          si na minutu vydechni v <strong>Krajině dobra</strong>.
        </p>

        <div class="hero-ctas">
          <a
            href="/near"
            class="hero-btn primary"
            on:click={() => trackEvent("aa_launch", { from: "hero_map" })}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.3"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path
                d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
              /><circle cx="12" cy="10" r="3" /></svg
            >
            <span>Mapa pomoci v okolí</span>
            <span class="arrow">→</span>
          </a>

          <a
            href="/svet"
            class="hero-btn sanctuary-hero-btn"
            on:click={() => trackEvent("aa_launch", { from: "hero_svet" })}
          >
            <span>✨ Krajina dobra</span>
          </a>
        </div>
      </div>

      <!-- CLEAN, BREATHABLE INSTANT CARD (ZERO NESTED BOXES) -->
      <div class="instant-card">
        <div class="card-halo" aria-hidden="true"></div>

        <div class="studio-head">
          <span class="studio-label">Chci pomoct právě teď:</span>
          <div class="studio-head-actions">
            {#if savedValues.length > 0}
              <button
                type="button"
                class="personal-values-pill"
                class:active={usePersonalValues}
                on:click={() => {
                  pinnedActionId = "";
                  usePersonalValues = !usePersonalValues;
                  suggestionIndex = 0;
                  trackEvent("aa_home_personal_filter", {
                    enabled: usePersonalValues,
                  });
                }}
                title="Přizpůsobit podle témat, která sis dříve vybral/a v průvodci"
              >
                {usePersonalValues
                  ? `✦ Tvoje témata (${getSavedValueLabels(savedValues)})`
                  : "🎯 Podle mých témat"}
              </button>
            {/if}
            <button
              type="button"
              class="cycle-link cycle-btn"
              on:click={nextQuickIdea}
              title="Ukázat další ověřenou příležitost"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.3"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path
                  d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                /><path d="M3 3v5h5" /><path
                  d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
                /><path d="M16 16h5v5" /></svg
              >
              <span>Jiný tip</span>
            </button>
          </div>
        </div>

        <div
          class="energy-tabs"
          role="tablist"
          aria-label="Praktický výběr dnešní příležitosti"
        >
          <button
            type="button"
            class="energy-tab"
            class:active={energyMode === "couch"}
            on:click={() => setEnergyMode("couch")}
          >
            🛋️ Mám 2 min
          </button>
          <button
            type="button"
            class="energy-tab"
            class:active={energyMode === "focus"}
            on:click={() => setEnergyMode("focus")}
          >
            🔬 Mám 15 min
          </button>
          <button
            type="button"
            class="energy-tab"
            class:active={energyMode === "walk"}
            on:click={() => setEnergyMode("walk")}
          >
            📍 Osobně
          </button>
          <button
            type="button"
            class="energy-tab"
            class:active={energyMode === "people"}
            on:click={() => setEnergyMode("people")}
          >
            🌱 Dlouhodobě
          </button>
        </div>

        {#if currentQuickAction}
          <div class="instant-body">
            <!-- 1. Standardizovaná hlavička: Čas · Cena · Režim + Třída důkazů A/B/C -->
            <div class="action-meta-line">
              <span class="quick-tags-pill"
                >{currentQuickAction.quickTagsLabel ||
                  "2 min · Zdarma · Online"}</span
              >
              <span>·</span>
              <span
                class="evidence-pill tier-{currentQuickAction.impactEvidence ||
                  'B'}"
                title={EVIDENCE_TIERS[currentQuickAction.impactEvidence || "B"]
                  ?.desc}
              >
                Důkazy {currentQuickAction.impactEvidence || "B"} · {EVIDENCE_TIERS[
                  currentQuickAction.impactEvidence || "B"
                ]?.shortLabel}
              </span>
            </div>

            <!-- 2. Název příležitosti -->
            <h2 class="action-title">{cleanTitle(currentQuickAction.title)}</h2>

            <!-- 3. Jasné vysvětlení jednoho konkrétního skutku -->
            <p class="action-desc">{currentQuickAction.desc}</p>

            <!-- 4. Přínos + Partner & Bez registrace -->
            <div class="action-impact-summary">
              <div class="impact-benefit-line">
                <strong
                  >Přínos ({currentQuickAction.impactBasis ||
                    "doložený"}):</strong
                >
                <span>{currentQuickAction.concreteImpact}</span>
              </div>
              <div class="partner-trust-line">
                <span
                  >{currentQuickAction.registrationRequired
                    ? "Krátká registrace u partnera"
                    : "Bez registrace na našem webu"}</span
                >
                <span>·</span>
                <span
                  >Aktivita probíhá u <strong>{currentQuickAction.org}</strong
                  ></span
                >
              </div>
            </div>

            {#if currentQuickAction.steps?.length}
              <details class="how-toggle">
                <summary
                  >Jak se zapojit ({currentQuickAction.steps.length}
                  {currentQuickAction.steps.length === 1
                    ? "krok"
                    : currentQuickAction.steps.length < 5
                      ? "kroky"
                      : "kroků"}) a řetězec dopadu</summary
                >
                <ol class="how-steps">
                  {#each currentQuickAction.steps as step}
                    <li>{step}</li>
                  {/each}
                </ol>
                {#if currentQuickAction.impactChain}
                  <div class="impact-chain-row">
                    <span
                      ><strong>Aktivita:</strong>
                      {currentQuickAction.impactChain.activity}</span
                    >
                    <span class="chain-arrow">→</span>
                    <span
                      ><strong>Výsledek:</strong>
                      {currentQuickAction.impactChain.immediateOutput}</span
                    >
                    <span class="chain-arrow">→</span>
                    <span
                      ><strong>Skutečný dopad:</strong>
                      {currentQuickAction.impactChain.realImpact}</span
                    >
                  </div>
                {/if}
              </details>
            {/if}

            <!-- 5. Primární akce (Začít pomáhat) + potvrzení dokončení -->
            {#if partnerReturnPromptVisible && !justCompleted}
              <div class="return-dopamine-strip" role="status" aria-live="polite">
                <div class="return-dopamine-text">
                  ✨ <strong>Vítej zpět! Povedlo se?</strong> Klikni na „✓ Hotovo“ a rozsviť svou lucernu v Krajině dobra.
                </div>
                <div class="return-dopamine-actions">
                  <button
                    type="button"
                    class="return-dopamine-btn"
                    on:click={() => completeQuickAction(currentQuickAction)}
                  >
                    ✨ Hotovo – rozsvítit stopu
                  </button>
                  <a
                    href={`/svet?ritual=lantern&seed=${encodeURIComponent(currentQuickAction.id)}&title=${encodeURIComponent(cleanTitle(currentQuickAction.title))}`}
                    class="return-dopamine-svet-link"
                  >
                    Do Krajiny dobra →
                  </a>
                </div>
              </div>
            {/if}

            <div class="instant-actions">
              <a
                href={currentQuickAction.url}
                target="_blank"
                rel="noopener noreferrer"
                class="btn-studio-primary"
                on:click={() => handleStartQuickAction(currentQuickAction)}
              >
                <span>Začít pomáhat</span>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10" /></svg
                >
              </a>

              <button
                type="button"
                class="btn-studio-done done-btn"
                class:initiated={isCurrentStarted || partnerReturnPromptVisible}
                on:click={() => completeQuickAction(currentQuickAction)}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="20 6 9 17 4 12" /></svg
                >
                <span>{isCurrentStarted ? "Dokončeno" : "Hotovo"}</span>
              </button>
            </div>

            <!-- 6. Transparentní patička ověření + přímý odkaz + nahlášení nefunkčního odkazu -->
            <div class="action-verify-footer">
              <span class="verify-meta">
                Ověřeno: <strong
                  >{currentQuickAction.lastVerifiedAt || "11/2026"}</strong
                >
                · Zdroj:
                <a
                  href={currentQuickAction.sourceUrl || currentQuickAction.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="verify-source-link"
                >
                  {currentQuickAction.org} ↗
                </a>
              </span>
              <div class="verify-footer-actions">
                <button
                  type="button"
                  class="direct-link-share-btn"
                  on:click={() => shareDirectActionLink(currentQuickAction)}
                  title="Zkopírovat přímý odkaz na tento skutek pro sdílení v diskuzi nebo zprávě"
                >
                  {copiedDirectLink
                    ? "✓ Odkaz zkopírován"
                    : "🔗 Zkopírovat přímý odkaz na tento skutek"}
                </button>
                <button
                  type="button"
                  class="broken-link-btn"
                  on:click={() =>
                    openBrokenLinkReport({
                      id: currentQuickAction.id,
                      title: cleanTitle(currentQuickAction.title),
                      org: currentQuickAction.org,
                      url: currentQuickAction.url,
                    })}
                >
                  Nahlásit nefunkční odkaz
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="hero-wave" aria-hidden="true">
      <svg viewBox="0 0 1440 76" preserveAspectRatio="none">
        <path
          d="M0,34 C340,80 700,-4 1080,42 C1260,64 1370,50 1440,32 L1440,76 L0,76 Z"
          fill="var(--surface-page)"
        />
      </svg>
    </div>
  </section>

  <!-- =====================================================================
       2. THREE CLEAN PATHWAYS + QUIET CITY JUMP STRIP
       ===================================================================== -->
  <section class="content-wrap paths-section" aria-label="Tři cesty k pomoci">
    <div class="section-header">
      <span class="section-overline">JAK SE ZAPOJIT</span>
      <h2>
        Vyber si cestu, která ti <span class="serif-accent">dneska sedí</span>
      </h2>
    </div>

    <div class="bento-paths">
      <a href="/near" class="bento-card">
        <div class="bento-icon-wrap emerald">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.1"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle
              cx="12"
              cy="10"
              r="3"
            /></svg
          >
        </div>
        <h3>Pomoc kousek od tebe</h3>
        <p class="bento-desc">
          Útulky, potravinové banky, knihobudky a sousedská místa na mapě ČR — i
          s připravenou zprávou na oslovení.
        </p>
        <span class="bento-cta">Otevřít mapu v okolí →</span>
      </a>

      <a href="/app/guided" class="bento-card">
        <div class="bento-icon-wrap amber">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.1"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><circle cx="12" cy="12" r="10" /><polygon
              points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
            /></svg
          >
        </div>
        <h3>Průvodce podle situace</h3>
        <p class="bento-desc">
          Nevíš, kde začít? Zvol si čas a blízké téma — ukážeme ti jeden
          konkrétní skutek na míru.
        </p>
        <span class="bento-cta">Spustit průvodce →</span>
      </a>

      <a href="/app/online" class="bento-card">
        <div class="bento-icon-wrap forest">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.1"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg
          >
        </div>
        <h3>Drobné skutky na dálku</h3>
        <p class="bento-desc">
          Rychlá pomoc z mobilu či počítače: naplnění misky v útulku, mapování
          pro Lékaře bez hranic nebo dopis seniorovi.
        </p>
        <span class="bento-cta">Prohlédnout online tipy →</span>
      </a>
    </div>

    <div class="city-strip" aria-label="Rychlý skok do města na mapě">
      <span class="city-strip-lbl">📍 Rychle na mapu:</span>
      <div class="city-strip-links">
        {#each QUICK_CITIES as city}
          <a
            href={`/near?lat=${city.lat}&lon=${city.lon}&r=${Math.round(city.radius / 1000)}`}
            on:click={() => trackEvent("aa_home_city_jump", { city: city.id })}
          >
            {city.name}
          </a>
        {/each}
        <a href="/near" class="all-cities-link">Všechny obce →</a>
      </div>
    </div>
  </section>

  <!-- =====================================================================
       3. KRAJINA DOBRA PORTAL (/svet)
       ===================================================================== -->
  <section
    class="content-wrap sanctuary-portal-section"
    aria-label="Krajina dobra a dechové zastavení"
  >
    <div class="sanctuary-portal-card">
      <div class="sanctuary-copy">
        <span class="stage-kicker">✨ KRAJINA DOBRA · SKUTKY A KLIDNÝ DECH</span
        >
        <h2>
          Podívej se, jak drobné skutky <span class="serif-gold"
            >rozsvěcují krajinu</span
          >
        </h2>
        <p>
          Interaktivní malovaná tůň, kde každá hvězda na obloze i lucerna na
          hladině představuje skutečnou pomoc. Klikni na světla pro inspiraci,
          rozsviť svůj dnešní skutek nebo si dopřej minutu klidného dechu.
        </p>

        <div class="sanctuary-cta-row">
          <a
            href="/svet"
            class="sanctuary-open-btn"
            on:click={() => trackEvent("aa_home_portal_svet")}
          >
            <span>✨ Vstoupit do Krajiny dobra</span>
            <span>→</span>
          </a>
          <a href="/svet#dech" class="sanctuary-breath-link">
            🌊 Dechové zastavení
          </a>
        </div>
      </div>

      <a
        href="/svet"
        class="sanctuary-preview-window"
        aria-label="Otevřít Krajinu dobra"
      >
        <img
          src="/art/sanctuary-dawn.jpg"
          alt="Malovaná česká krajina ve zlatém svítání se světly dobrých skutků"
          loading="lazy"
        />
        <span class="spw-enter">Vyzkoušet živou krajinu →</span>
      </a>
    </div>
  </section>

  <!-- =====================================================================
       4. QUIET EDITORIAL HOPE MOMENT + COLLAPSED PORTALS + SUBMIT LINK
       ===================================================================== -->
  <section
    class="content-wrap closing-section"
    aria-label="Dobré zprávy a další možnosti"
  >
    {#if activeHope}
      <div class="quiet-hope">
        <span class="section-overline"
          >DOBRÁ ZPRÁVA Z ČESKA · OVĚŘENO {activeHope.verifiedAt ||
            "11/2026"}</span
        >
        <div class="qh-stat">{activeHope.stat}</div>
        <p class="qh-text">
          <strong>{activeHope.title}.</strong>
          {activeHope.detail}
        </p>
        {#if activeHope.sourceUrl}
          <div class="qh-source-row">
            <span>Primární zdroj ({activeHope.verifiedAt || "11/2026"}):</span>
            <a
              href={activeHope.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="qh-source-link"
            >
              {activeHope.sourceLabel || "Oficiální statistika"} ↗
            </a>
          </div>
        {/if}
        <div class="qh-actions">
          <a href={activeHope.actionHref} class="qh-link"
            >{activeHope.actionLabel}</a
          >
          <span class="qh-sep">·</span>
          <button type="button" class="qh-next" on:click={() => (hopeIdx += 1)}>
            ↻ Další číslo naděje
          </button>
        </div>
      </div>
    {/if}

    <details class="calm-drawer home-portals-drawer">
      <summary
        >Hledáš dlouhodobější dobrovolnictví? 8 ověřených českých platforem</summary
      >
      <p class="drawer-lead">
        Osvědčené české dobrovolnické a komunitní projekty, kde si vybereš
        zapojení podle oboru nebo regionu.
      </p>
      <div class="portals-grid">
        {#each PORTALS as p}
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            class="portal-card"
            on:click={() =>
              trackEvent("aa_clickout", { surface: "home_portal", id: p.id })}
          >
            <div class="portal-top">
              <h3>{p.title}</h3>
              <span class="ext-icon">↗</span>
            </div>
            <p>{p.desc}</p>
          </a>
        {/each}
      </div>
    </details>

    <div class="submit-whisper-row">
      <span>Víš o útulku, knihobudce nebo sousedské akci ve svém městě?</span>
      <a href="/submit">Přidat tip na společnou mapu →</a>
    </div>
  </section>
</div>

<style>
  .home-page {
    padding-bottom: 1.5rem;
  }

  /* ==========================================================================
     1. CALM CINEMATIC HERO STAGE
     ========================================================================== */
  .hero-stage {
    position: relative;
    margin-top: -5.4rem;
    padding: 8.2rem 1.25rem 6rem;
    background: radial-gradient(
        90% 88% at 78% 24%,
        rgba(28, 108, 73, 0.82) 0%,
        transparent 62%
      ),
      radial-gradient(
        65% 70% at 15% 15%,
        rgba(251, 191, 36, 0.18) 0%,
        transparent 58%
      ),
      linear-gradient(160deg, #0b261b 0%, #123a29 50%, #174934 100%);
    color: #f8faf8;
    overflow: hidden;
  }

  .hero-painted-backdrop {
    position: absolute;
    inset: 0;
    background: url("/art/sanctuary-dawn.jpg") center 42% / cover no-repeat;
    opacity: 0.36;
    mask-image: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.24) 0%,
      rgba(0, 0, 0, 0.8) 58%,
      rgba(0, 0, 0, 0.94) 100%
    );
    -webkit-mask-image: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.24) 0%,
      rgba(0, 0, 0, 0.8) 58%,
      rgba(0, 0, 0, 0.94) 100%
    );
    pointer-events: none;
  }

  .hero-aurora {
    position: absolute;
    inset: -20% -10% 0 -10%;
    background: radial-gradient(
        circle at 72% 38%,
        rgba(52, 211, 153, 0.2) 0%,
        transparent 42%
      ),
      radial-gradient(
        circle at 62% 24%,
        rgba(251, 191, 36, 0.15) 0%,
        transparent 34%
      );
    filter: blur(28px);
    pointer-events: none;
  }

  .fireflies-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .firefly {
    position: absolute;
    border-radius: 50%;
    background: #6ee7b7;
    box-shadow: 0 0 14px 3px rgba(52, 211, 153, 0.55);
    animation: floatFirefly 8s ease-in-out infinite;
  }

  .firefly.gold {
    background: #fde68a;
    box-shadow: 0 0 16px 4px rgba(251, 191, 36, 0.62);
  }

  .hero-inner {
    position: relative;
    z-index: 2;
    max-width: 1140px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
    gap: 2.8rem;
    align-items: center;
  }

  .hero-copy {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .hero-overline {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    color: #a7f3d0;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    margin-bottom: 1rem;
  }

  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 10px #34d399;
  }

  .hero-title {
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: clamp(2.4rem, 4.4vw, 3.85rem);
    line-height: 1.07;
    letter-spacing: -0.035em;
    margin: 0 0 1.15rem 0;
    color: #ffffff;
  }

  .hero-serif {
    display: block;
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: clamp(2.45rem, 4.6vw, 4.05rem);
    line-height: 1.05;
    letter-spacing: 0;
    background: linear-gradient(120deg, #fde68a 0%, #6ee7b7 62%, #fbbf24 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-top: 0.2rem;
  }

  .hero-lead {
    color: rgba(230, 245, 236, 0.86);
    font-size: 1.06rem;
    line-height: 1.65;
    max-width: 48ch;
    margin: 0 0 1.75rem 0;
  }

  .hero-lead strong {
    color: #fde68a;
    font-weight: 700;
  }

  .hero-ctas {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .hero-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.88rem 1.35rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.94rem;
    text-decoration: none;
    transition: all 0.22s var(--ease-gentle);
  }

  .hero-btn.primary {
    background: linear-gradient(135deg, #34d399 0%, #fde68a 100%);
    color: #051810;
    box-shadow: 0 14px 32px -6px rgba(52, 211, 153, 0.42);
  }

  .hero-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 36px -6px rgba(52, 211, 153, 0.55);
  }

  .hero-btn.primary .arrow {
    transition: transform 0.2s ease;
  }

  .hero-btn.primary:hover .arrow {
    transform: translateX(3px);
  }

  .sanctuary-hero-btn {
    background: rgba(255, 255, 255, 0.1);
    color: #fde68a;
    border: 1px solid rgba(253, 230, 138, 0.36);
    backdrop-filter: blur(10px);
  }

  .sanctuary-hero-btn:hover {
    background: rgba(253, 230, 138, 0.2);
    color: #ffffff;
    transform: translateY(-2px);
  }

  /* MINIMALIST STUDIO CARD (ZERO CLUTTER) */
  .instant-card {
    position: relative;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.97);
    color: var(--text-primary);
    border-radius: 28px;
    padding: 1.65rem 1.7rem;
    box-shadow:
      0 30px 60px -14px rgba(3, 12, 8, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.6);
  }

  .card-halo {
    position: absolute;
    inset: -1.5px;
    border-radius: 30px;
    background: linear-gradient(
      135deg,
      rgba(52, 211, 153, 0.45),
      rgba(251, 191, 36, 0.35),
      transparent 65%
    );
    z-index: -1;
    pointer-events: none;
  }

  .studio-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    min-width: 0;
    gap: 0.5rem;
    margin-bottom: 0.65rem;
  }

  .studio-label {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .cycle-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: none;
    background: transparent;
    color: var(--emerald-600);
    font-family: var(--font-sans);
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    border-radius: 8px;
    transition:
      background 0.16s ease,
      color 0.16s ease;
  }

  .cycle-link:hover {
    background: rgba(16, 185, 129, 0.1);
    color: var(--forest-850);
  }

  .energy-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.3rem;
    padding: 0.28rem;
    border-radius: 999px;
    background: #eef3ef;
    margin-bottom: 1.25rem;
  }

  .energy-tab {
    border: none;
    border-radius: 999px;
    padding: 0.5rem 0.35rem;
    background: transparent;
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s var(--ease-gentle);
  }

  .energy-tab:hover {
    color: var(--text-primary);
  }

  .energy-tab.active {
    background: #0d281d;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(9, 29, 20, 0.18);
  }

  .action-meta-line {
    display: flex;
    align-items: center;
    gap: 0.42rem;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-bottom: 0.45rem;
  }

  .studio-head-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .personal-values-pill {
    border: 1px solid rgba(16, 185, 129, 0.25);
    background: rgba(236, 253, 245, 0.8);
    color: #065f46;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .personal-values-pill.active {
    background: #065f46;
    color: #ffffff;
    border-color: #065f46;
  }

  .quick-tags-pill {
    font-weight: 800;
    color: #0d2e20;
  }

  .evidence-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.14rem 0.5rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.74rem;
    background: #ecfdf5;
    color: #047857;
  }

  .evidence-pill.tier-A {
    background: #ecfdf5;
    color: #065f46;
  }

  .evidence-pill.tier-B {
    background: #f0fdfa;
    color: #0f766e;
  }

  .evidence-pill.tier-C {
    background: #f8fafc;
    color: #334155;
  }

  .action-impact-summary {
    margin: 0 0 0.85rem 0;
    padding-top: 0.55rem;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.84rem;
    line-height: 1.48;
  }

  .impact-benefit-line {
    color: #091d14;
  }

  .impact-benefit-line strong {
    color: #047857;
    margin-right: 0.25rem;
  }

  .partner-trust-line {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .partner-trust-line strong {
    color: var(--text-secondary);
    font-weight: 700;
  }

  .impact-chain-row {
    margin-top: 0.6rem;
    padding-top: 0.5rem;
    border-top: 1px dashed rgba(22, 66, 48, 0.14);
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: var(--text-secondary);
  }

  .chain-arrow {
    color: var(--emerald-600);
    font-weight: 800;
  }

  .btn-studio-done.initiated {
    background: #059669;
    color: #ffffff;
    border-color: #059669;
  }

  .action-verify-footer {
    margin-top: 0.75rem;
    padding-top: 0.6rem;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .verify-source-link {
    color: var(--forest-800);
    font-weight: 700;
    text-decoration: none;
  }

  .verify-source-link:hover {
    color: var(--emerald-600);
    text-decoration: underline;
  }

  .broken-link-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 0.74rem;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }

  .broken-link-btn:hover {
    color: #b45309;
  }

  .qh-source-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin: -0.25rem 0 0.75rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .qh-source-link {
    color: var(--forest-800);
    font-weight: 700;
    text-decoration: underline;
  }

  .qh-source-link:hover {
    color: var(--emerald-600);
  }

  .action-title {
    font-weight: 800;
    font-size: 1.34rem;
    line-height: 1.25;
    letter-spacing: -0.02em;
    color: #091d14;
    margin: 0 0 0.5rem 0;
  }

  .action-desc {
    color: var(--text-secondary);
    font-size: 0.94rem;
    line-height: 1.6;
    margin: 0 0 0.95rem 0;
  }

  .how-toggle {
    margin: 0 0 1.05rem 0;
    font-size: 0.84rem;
    color: var(--text-secondary);
  }

  .how-toggle summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--forest-800);
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .how-toggle summary::-webkit-details-marker {
    display: none;
  }

  .how-toggle summary::before {
    content: "▸";
    color: var(--emerald-600);
    transition: transform 0.18s ease;
  }

  .how-toggle[open] summary::before {
    transform: rotate(90deg);
  }

  .how-steps {
    margin: 0.55rem 0 0 1.2rem;
    padding: 0;
    line-height: 1.52;
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .instant-actions {
    display: flex;
    gap: 0.55rem;
    align-items: center;
    padding-top: 0.25rem;
  }

  .btn-studio-primary {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.84rem 1.15rem;
    border-radius: 14px;
    background: linear-gradient(135deg, #0d2e20 0%, #1b573e 100%);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.92rem;
    text-decoration: none;
    box-shadow: 0 10px 22px -6px rgba(13, 46, 32, 0.38);
    transition: all 0.2s var(--ease-gentle);
  }

  .btn-studio-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px -6px rgba(13, 46, 32, 0.52);
  }

  .btn-studio-done {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    padding: 0.84rem 1rem;
    border-radius: 14px;
    border: 1px solid rgba(5, 150, 105, 0.28);
    background: #eef7f1;
    color: #065f46;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .btn-studio-done:hover {
    background: #059669;
    color: #ffffff;
  }

  .hero-wave {
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    line-height: 0;
    pointer-events: none;
  }

  .hero-wave svg {
    width: 100%;
    height: 58px;
    display: block;
  }

  /* ==========================================================================
     SHARED LAYOUT
     ========================================================================== */
  .content-wrap {
    max-width: 1140px;
    margin: 0 auto;
    padding: 3.4rem 1.25rem 0;
  }

  .section-header {
    text-align: center;
    margin: 0 auto 2rem;
  }

  .section-overline {
    display: block;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: var(--emerald-600);
    margin-bottom: 0.45rem;
  }

  .section-header h2 {
    font-size: clamp(1.75rem, 3vw, 2.45rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.14;
    color: #091d14;
    margin: 0;
  }

  .section-header h2 .serif-accent {
    font-size: 1.12em;
    color: #145338;
  }

  /* ==========================================================================
     2. THREE CLEAN PATHWAYS
     ========================================================================== */
  .bento-paths {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.2rem;
  }

  .bento-card {
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(22, 66, 48, 0.09);
    border-radius: 24px;
    padding: 1.7rem;
    box-shadow: var(--shadow-sm);
    text-decoration: none;
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    transition:
      transform 0.24s var(--ease-gentle),
      box-shadow 0.24s var(--ease-gentle);
  }

  .bento-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }

  .bento-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .bento-icon-wrap.emerald {
    background: rgba(16, 185, 129, 0.12);
    color: #047857;
  }
  .bento-icon-wrap.amber {
    background: rgba(245, 158, 11, 0.14);
    color: #b45309;
  }
  .bento-icon-wrap.forest {
    background: rgba(13, 46, 32, 0.09);
    color: #0d2e20;
  }

  .bento-card h3 {
    font-size: 1.24rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #091d14;
    margin: 0 0 0.5rem 0;
  }

  .bento-desc {
    color: var(--text-secondary);
    font-size: 0.93rem;
    line-height: 1.6;
    margin: 0 0 1.2rem 0;
    flex: 1;
  }

  .bento-cta {
    font-size: 0.9rem;
    font-weight: 800;
    color: var(--forest-800);
  }

  .bento-card:hover .bento-cta {
    color: var(--emerald-600);
  }

  .city-strip {
    margin-top: 1.35rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    font-size: 0.85rem;
  }

  .city-strip-lbl {
    color: var(--text-muted);
    font-weight: 600;
  }

  .city-strip-links {
    display: flex;
    align-items: center;
    gap: 0.35rem 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .city-strip-links a {
    color: var(--forest-800);
    text-decoration: none;
    font-weight: 700;
    transition: color 0.15s ease;
  }

  .city-strip-links a:hover {
    color: var(--emerald-600);
    text-decoration: underline;
  }

  .city-strip-links .all-cities-link {
    color: var(--emerald-600);
  }

  /* ==========================================================================
     3. KRAJINA DOBRA PORTAL BANNER (/svet)
     ========================================================================== */
  .sanctuary-portal-card {
    border-radius: 30px;
    padding: 2.25rem 2.4rem;
    background: radial-gradient(
        80% 100% at 88% 20%,
        rgba(251, 191, 36, 0.22) 0%,
        transparent 58%
      ),
      radial-gradient(
        75% 90% at 12% 85%,
        rgba(52, 211, 153, 0.2) 0%,
        transparent 55%
      ),
      linear-gradient(145deg, #071d14 0%, #103525 55%, #174933 100%);
    color: #f8faf8;
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    align-items: center;
    gap: 2.2rem;
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(110, 231, 183, 0.2);
  }

  .stage-kicker {
    display: inline-block;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #6ee7b7;
    margin-bottom: 0.45rem;
  }

  .sanctuary-copy h2 {
    margin: 0 0 0.65rem 0;
    font-size: clamp(1.65rem, 2.8vw, 2.3rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.14;
    color: #ffffff;
  }

  .serif-gold {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: 1.14em;
    color: #fde68a;
  }

  .sanctuary-copy p {
    margin: 0 0 1.4rem 0;
    color: rgba(224, 242, 232, 0.88);
    font-size: 0.96rem;
    line-height: 1.64;
    max-width: 54ch;
  }

  .sanctuary-cta-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .sanctuary-open-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.88rem 1.4rem;
    border-radius: 999px;
    background: linear-gradient(135deg, #fde68a 0%, #34d399 100%);
    color: #051810;
    font-weight: 800;
    font-size: 0.94rem;
    text-decoration: none;
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.28);
    transition: transform 0.2s ease;
  }

  .sanctuary-open-btn:hover {
    transform: translateY(-2px);
  }

  .sanctuary-breath-link {
    display: inline-flex;
    align-items: center;
    padding: 0.86rem 1.2rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.09);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #ecfdf5;
    font-weight: 700;
    font-size: 0.88rem;
    text-decoration: none;
    transition: background 0.2s ease;
  }

  .sanctuary-breath-link:hover {
    background: rgba(255, 255, 255, 0.16);
  }

  .sanctuary-preview-window {
    position: relative;
    display: block;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(253, 230, 138, 0.38);
    box-shadow: 0 22px 44px -12px rgba(2, 10, 6, 0.6);
    aspect-ratio: 16 / 10;
    text-decoration: none;
    transition: transform 0.28s var(--ease-gentle);
  }

  .sanctuary-preview-window:hover {
    transform: translateY(-3px) scale(1.015);
  }

  .sanctuary-preview-window img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .spw-enter {
    position: absolute;
    right: 0.85rem;
    bottom: 0.85rem;
    padding: 0.38rem 0.82rem;
    border-radius: 999px;
    background: rgba(6, 24, 16, 0.82);
    backdrop-filter: blur(8px);
    color: #fde68a;
    font-size: 0.78rem;
    font-weight: 700;
  }

  /* ==========================================================================
     4. QUIET EDITORIAL HOPE + PORTALS DRAWER
     ========================================================================== */
  .closing-section {
    display: flex;
    flex-direction: column;
    gap: 1.65rem;
  }

  .quiet-hope {
    text-align: center;
    max-width: 640px;
    margin: 0 auto 0.5rem;
    padding: 0.5rem 0;
  }

  .qh-stat {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: clamp(2.4rem, 4vw, 3.3rem);
    line-height: 1.05;
    color: #0d3b28;
    margin-bottom: 0.45rem;
  }

  .qh-text {
    margin: 0 0 0.85rem;
    color: var(--text-secondary);
    font-size: 0.98rem;
    line-height: 1.62;
  }

  .qh-text strong {
    color: var(--text-primary);
  }

  .qh-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: center;
    font-size: 0.88rem;
  }

  .qh-link {
    color: var(--emerald-600);
    font-weight: 800;
    text-decoration: none;
  }

  .qh-link:hover {
    text-decoration: underline;
  }

  .qh-sep {
    color: var(--text-muted);
  }

  .qh-next {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.86rem;
    cursor: pointer;
    padding: 0;
  }

  .qh-next:hover {
    color: var(--text-primary);
  }

  .drawer-lead {
    margin: 0.6rem 0 1rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .portals-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .portal-card {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(22, 66, 48, 0.09);
    border-radius: 18px;
    padding: 1.15rem;
    text-decoration: none;
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    transition: all 0.2s var(--ease-gentle);
  }

  .portal-card:hover {
    transform: translateY(-2px);
    border-color: #10b981;
    box-shadow: var(--shadow-sm);
  }

  .portal-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.4rem;
    margin-bottom: 0.35rem;
  }

  .portal-top h3 {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 800;
    color: #091d14;
  }

  .ext-icon {
    color: #059669;
    font-weight: 800;
  }

  .portal-card p {
    margin: 0;
    font-size: 0.83rem;
    line-height: 1.5;
    color: var(--text-secondary);
  }

  .submit-whisper-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    flex-wrap: wrap;
    text-align: center;
    font-size: 0.9rem;
    color: var(--text-secondary);
    padding-top: 0.25rem;
  }

  .submit-whisper-row a {
    color: var(--forest-800);
    font-weight: 800;
    text-decoration: none;
  }

  .submit-whisper-row a:hover {
    color: var(--emerald-600);
    text-decoration: underline;
  }

  .return-dopamine-strip {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-bottom: 0.55rem;
    padding: 0.65rem 0.85rem;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(254, 243, 199, 0.92), rgba(209, 250, 229, 0.92));
    border: 1px solid rgba(217, 119, 6, 0.35);
    color: #064e3b;
    font-size: 0.84rem;
    line-height: 1.38;
    animation: returnPulse 0.35s ease-out;
  }

  @keyframes returnPulse {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .return-dopamine-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .return-dopamine-btn {
    appearance: none;
    border: 1px solid rgba(5, 150, 105, 0.38);
    background: #059669;
    color: #ffffff;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 800;
    padding: 0.42rem 0.78rem;
    border-radius: 999px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.24);
  }

  .return-dopamine-svet-link {
    color: #065f46;
    font-size: 0.78rem;
    font-weight: 800;
    text-decoration: underline;
  }

  .verify-footer-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .direct-link-share-btn {
    appearance: none;
    background: none;
    border: none;
    padding: 0;
    color: #047857;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .direct-link-share-btn:hover {
    color: #064e3b;
  }

  @media (max-width: 1024px) {
    .hero-inner,
    .sanctuary-portal-card {
      grid-template-columns: minmax(0, 1fr);
      gap: 2rem;
    }
    .bento-paths,
    .portals-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 680px) {
    .hero-stage {
      margin-top: -3.2rem;
      padding: 3.45rem 0.65rem 0.9rem;
    }

    .hero-inner {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.32rem;
    }

    .hero-copy {
      min-width: 0;
      max-width: 100%;
    }

    .hero-overline,
    .hero-lead,
    .hero-ctas {
      display: none !important;
    }

    .hero-title {
      font-size: 1.05rem;
      line-height: 1.15;
      margin: 0 0 0.08rem 0;
      letter-spacing: -0.02em;
      overflow-wrap: break-word;
    }

    .hero-serif {
      display: block;
      font-size: 1.08rem;
      line-height: 1.15;
      margin-top: 0.04rem;
    }

    .instant-card {
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      padding: 0.64rem 0.74rem;
      border-radius: 20px;
    }

    .studio-head {
      margin-bottom: 0.26rem;
      padding-bottom: 0.16rem;
    }

    .studio-label {
      font-size: 0.76rem;
    }

    .cycle-link {
      padding: 0.2rem 0.42rem;
      font-size: 0.73rem;
    }

    .energy-tabs {
      display: flex;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      overflow-x: auto;
      flex-wrap: nowrap;
      gap: 0.22rem;
      padding: 0.18rem;
      margin-bottom: 0.34rem;
      border-radius: 14px;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }

    .energy-tabs::-webkit-scrollbar {
      display: none;
    }

    .energy-tab {
      flex: 0 0 auto;
      padding: 0.3rem 0.46rem;
      font-size: 0.72rem;
      white-space: nowrap;
      border-radius: 10px;
    }

    .instant-body {
      min-width: 0;
      max-width: 100%;
      gap: 0.24rem;
    }

    .action-meta-line {
      font-size: 0.69rem;
      gap: 0.22rem;
      margin-bottom: 0.22rem;
    }

    .quick-tags-pill,
    .evidence-pill {
      padding: 0.1rem 0.38rem;
      font-size: 0.67rem;
    }

    .action-title {
      font-size: 1.02rem;
      line-height: 1.18;
      margin: 0.04rem 0 0.18rem 0;
    }

    .action-desc {
      font-size: 0.78rem;
      line-height: 1.28;
      margin: 0 0 0.26rem 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .action-impact-summary {
      margin: 0 0 0.3rem 0;
      padding: 0.28rem 0.45rem;
      gap: 0.1rem;
      border-radius: 12px;
    }

    .impact-benefit-line {
      font-size: 0.74rem;
      line-height: 1.24;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .partner-trust-line {
      font-size: 0.68rem;
      line-height: 1.16;
    }

    .how-toggle {
      margin: 0 0 0.3rem 0;
      padding: 0.2rem 0.4rem;
      border-radius: 10px;
    }

    .how-toggle summary {
      font-size: 0.72rem;
    }

    .return-dopamine-strip {
      margin-bottom: 0.32rem;
      padding: 0.45rem 0.62rem;
      font-size: 0.75rem;
      gap: 0.32rem;
    }

    .instant-actions {
      padding-top: 0.08rem;
      gap: 0.35rem;
    }

    .btn-studio-primary {
      padding: 0.56rem 0.78rem;
      font-size: 0.85rem;
      border-radius: 12px;
    }

    .btn-studio-done {
      padding: 0.56rem 0.68rem;
      font-size: 0.79rem;
      border-radius: 12px;
    }

    .action-verify-footer {
      margin-top: 0.32rem;
      padding-top: 0.24rem;
      font-size: 0.66rem;
      gap: 0.2rem;
    }

    .direct-link-share-btn,
    .broken-link-btn {
      font-size: 0.67rem;
    }

    .sanctuary-portal-card {
      padding: 1.65rem 1.35rem;
    }
    .bento-paths,
    .portals-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
