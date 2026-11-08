<script>
  import { onMount } from "svelte";
  import {
    trackEvent,
    trackFunnel,
    startedActionIds,
    markActionStarted,
    openBrokenLinkReport,
  } from "../../../lib/analytics.js";
  import {
    VALUES,
    CZECH_CITIES,
    CURATED_FALLBACK_PLACES,
    EVIDENCE_TIERS,
    EVIDENCE_METHODOLOGY,
    MICRO_ACTIONS,
    recommendActions,
    buildFirstContactTemplate,
  } from "../../../lib/data/czech-actions.js";
  import { recordSmallWin, completedSteps } from "../../../lib/progress.js";
  import {
    isSoundMuted,
    toggleSoundMuted,
    holdSpark,
    impactCanvas,
    getActionEffectMeta,
    playPayoffAsmr,
    savePendingPartnerReturn,
    consumePendingPartnerReturn,
    getPendingPartnerReturnRemainingMs,
    triggerCanvasBurst,
    fetchAmbientPulse,
    describeAmbientPulse,
  } from "../../../lib/sensoryEngine.js";
  import { notifyMollySpark } from "../../../lib/mollyStore.js";
  import { haversineKm } from "../../../lib/security.js";
  import {
    cleanTitle,
    cleanMeta,
    safeGetItem,
    safeSetItem,
  } from "../../../lib/utils.js";

  const SITUATIONS = [
    {
      id: "couch",
      emoji: "🛋️",
      title: "2 minuty z domova",
      sub: "Rychlý skutek z mobilu",
      timeBucket: "5",
      mode: "online",
      social: "solo",
      cost: "free",
    },
    {
      id: "focus",
      emoji: "💻",
      title: "15 minut u počítače",
      sub: "Mapování nebo věda z domova",
      timeBucket: "15",
      mode: "online",
      social: "solo",
      cost: "free",
    },
    {
      id: "walk",
      emoji: "🌿",
      title: "Při procházce venku",
      sub: "Užitečná věc cestou v okolí",
      timeBucket: "15",
      mode: "local",
      social: "solo",
      cost: "free",
    },
    {
      id: "people",
      emoji: "🤝",
      title: "Mezi lidmi v partě",
      sub: "Společná akce ve městě či přírodě",
      timeBucket: "45",
      mode: "local",
      social: "group",
      cost: "free",
    },
    {
      id: "donate",
      emoji: "💚",
      title: "Poslat drobný dar",
      sub: "Od 50 Kč přímo na pomoc",
      timeBucket: "5",
      mode: "online",
      social: "solo",
      cost: "donation",
    },
  ];

  let activeSituationId = "couch";
  /** @type {string[]} */
  let selectedTopics = [];
  let cityId = "praha";
  let rotationSeed = 0;
  let lastShownActionId = "";
  let excludePrevId = "";
  let openTemplateId = null;
  let copiedTemplateId = null;
  let planFlash = false;
  let localDrawerOpen = false;
  let soundMuted = false;
  let showGuidedEffect = true;
  let guidedSparkBoosted = false;
  let guidedCanvasNode = null;
  let guidedEffectMetric = 0;
  let guidedReturnAction = null;
  let guidedReturnMetric = 0;
  let awaitingGuidedAction = null;
  let guidedLeaveTimestamp = 0;
  let copiedDirectLink = false;
  /** @type {any} */
  let ambientPulse = null;

  // Adaptivní parametry průvodce (sekce 4.2 + 5.2)
  let commitment = "any"; // 'any' | 'one_off' | 'long_term'
  let contactLevel = "any"; // 'any' | 'anonymous' | 'contact_ok'
  let recipientMacro = "any"; // 'any' | 'people' | 'animals' | 'nature'
  let socialOverride = "any"; // 'any' | 'solo' | 'group'
  let modeOverride = "any"; // 'any' | 'online' | 'local'
  let costOverride = "any"; // 'any' | 'free' | 'donation'
  let evidenceTier = "any"; // 'any' | 'A' | 'B' | 'C'

  $: activeSituation =
    SITUATIONS.find((s) => s.id === activeSituationId) || SITUATIONS[0];
  $: localDrawerOpen =
    activeSituationId === "walk" || activeSituationId === "people";
  $: completedIds = ($completedSteps || []).map((s) => s.id);

  $: effectiveCost =
    costOverride !== "any" ? costOverride : activeSituation.cost;
  $: effectiveMode =
    modeOverride !== "any" ? modeOverride : activeSituation.mode;
  $: effectiveSocial =
    socialOverride !== "any" ? socialOverride : activeSituation.social;

  $: recommendations = recommendActions({
    values: selectedTopics,
    timeBucket: activeSituation.timeBucket,
    cost: effectiveCost,
    mode: effectiveMode,
    social: effectiveSocial,
    commitment,
    contactLevel,
    recipientMacro,
    evidenceTier,
    completedIds,
    excludeIds: excludePrevId ? [excludePrevId] : [],
    seed: `${activeSituationId}:${selectedTopics.join(",")}:${commitment}:${contactLevel}:${recipientMacro}:${evidenceTier}:${rotationSeed}`,
  });

  $: bestAction = recommendations[0] || null;
  // Až pod bestAction — reaktivní pořadí jinak předběhne nastavení parametrů z URL / sessionu
  $: ambientPulseText = describeAmbientPulse(ambientPulse, { inCard: true, actionId: bestAction?.id });
  $: if (bestAction?.id) {
    lastShownActionId = bestAction.id;
  }
  $: isBestStarted = Boolean(
    bestAction?.id &&
      Array.isArray($startedActionIds) &&
      $startedActionIds.includes(bestAction.id),
  );

  $: sideAlternatives = recommendations.slice(1, 4);
  $: activeCity = CZECH_CITIES.find((c) => c.id === cityId) || CZECH_CITIES[0];

  $: targetMapKinds = (() => {
    const s = new Set();
    for (const vKey of selectedTopics) {
      const found = VALUES.find((v) => v.key === vKey);
      if (found?.mapKinds) {
        for (const mk of found.mapKinds) s.add(mk);
      }
    }
    return s.size ? Array.from(s) : ["animals", "food", "community", "ngo"];
  })();

  $: localMatches = (() => {
    const withDist = CURATED_FALLBACK_PLACES.map((p) => ({
      ...p,
      distKm:
        Math.round(
          haversineKm(activeCity.lat, activeCity.lon, p.lat, p.lon) * 10,
        ) / 10,
      kindMatch: targetMapKinds.includes(p.kind) ? 1 : 0,
    }));

    const nearby = withDist.filter((p) => p.distKm <= 32);
    const pool = nearby.length >= 2 ? nearby : withDist;

    return pool
      .sort((a, b) => {
        if (b.kindMatch !== a.kindMatch) return b.kindMatch - a.kindMatch;
        return a.distKm - b.distKm;
      })
      .slice(0, 3);
  })();

  $: nearUrl = `/near?lat=${activeCity.lat}&lon=${activeCity.lon}&r=10&kinds=${encodeURIComponent(targetMapKinds.join(","))}`;

  function selectSituation(id) {
    if (activeSituationId === id) {
      cycleRecommendation();
      return;
    }
    excludePrevId = lastShownActionId;
    activeSituationId = id;
    rotationSeed = 0;
    triggerPlanPulse();
    persistPrefs();
    trackEvent("aa_guided_situation", { situation: id });
    trackFunnel("intent_selected", { surface: "guided", situation: id });
    trackFunnel("recommendation_shown", { surface: "guided", situation: id });
  }

  function toggleTopic(key) {
    excludePrevId = lastShownActionId;
    if (key === "all") {
      selectedTopics = [];
    } else if (selectedTopics.includes(key)) {
      selectedTopics = selectedTopics.filter((x) => x !== key);
    } else {
      selectedTopics = [...selectedTopics, key].slice(-2);
    }
    rotationSeed = 0;
    triggerPlanPulse();
    persistPrefs();
    trackEvent("aa_guided_topic_toggle", { topics: selectedTopics.join(",") });
    trackFunnel("intent_selected", {
      surface: "guided_topic",
      topics: selectedTopics.join(","),
    });
  }

  function applyAdaptiveFilter(updateFn, filterName = "param") {
    excludePrevId = "";
    rotationSeed = 0;
    updateFn();
    triggerPlanPulse();
    trackFunnel("intent_selected", { surface: "guided_adaptive", filterName });
    trackFunnel("recommendation_shown", {
      surface: "guided_adaptive",
      filterName,
    });
  }

  function cycleRecommendation() {
    excludePrevId = lastShownActionId;
    rotationSeed += 1;
    triggerPlanPulse();
    trackEvent("aa_guided_cycle_tip", {
      seed: rotationSeed,
      situation: activeSituationId,
    });
    trackFunnel("recommendation_shown", {
      surface: "guided",
      situation: activeSituationId,
      seed: rotationSeed,
    });
  }

  function promoteAlternative(altAction) {
    excludePrevId = "";
    const idx = recommendations.findIndex((r) => r.id === altAction.id);
    if (idx > 0) {
      rotationSeed += idx;
    } else {
      rotationSeed += 1;
    }
    triggerPlanPulse();
    const el = document.getElementById("personal-plan");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function triggerPlanPulse() {
    planFlash = true;
    setTimeout(() => {
      planFlash = false;
    }, 500);
  }

  function persistPrefs() {
    try {
      safeSetItem("aa_values", JSON.stringify(selectedTopics), "local");
      safeSetItem(
        "aa_guided_values_v2",
        JSON.stringify(selectedTopics),
        "local",
      );
      safeSetItem(
        "aa_prefs_near",
        JSON.stringify({ situation: activeSituationId, cityId }),
        "local",
      );
    } catch {}
  }

  async function copyTemplate(place) {
    try {
      const tpl = buildFirstContactTemplate(place);
      await navigator.clipboard.writeText(tpl.body);
      copiedTemplateId = place.id;
      setTimeout(() => {
        if (copiedTemplateId === place.id) copiedTemplateId = null;
      }, 2500);
    } catch {}
  }

  function isDone(id) {
    return ($completedSteps || []).some((s) => s.id === id);
  }

  onMount(() => {
    let guidedReturnTimer = null;
    soundMuted = isSoundMuted();
    try {
      const sp = new URLSearchParams(window.location.search);
      const topicParam = sp.get("topic");
      if (topicParam && VALUES.some((v) => v.key === topicParam)) {
        selectedTopics = [topicParam];
        safeSetItem("aa_values", JSON.stringify(selectedTopics), "local");
      } else {
        const s = JSON.parse(
          safeGetItem("aa_values", "local") ||
            safeGetItem("aa_guided_values_v2", "local") ||
            "[]",
        );
        if (Array.isArray(s) && s.length) {
          selectedTopics = s
            .filter((k) => VALUES.some((v) => v.key === k))
            .slice(0, 2);
        }
      }
      const nearSaved = JSON.parse(
        safeGetItem("aa_prefs_near", "local") || "{}",
      );
      if (
        nearSaved?.cityId &&
        CZECH_CITIES.some((c) => c.id === nearSaved.cityId)
      ) {
        cityId = nearSaved.cityId;
      }
    } catch {}

    const checkGuidedReturn = () => {
      if (guidedReturnAction) return;
      if (guidedReturnTimer) {
        clearTimeout(guidedReturnTimer);
        guidedReturnTimer = null;
      }
      const elapsedMem = awaitingGuidedAction
        ? Date.now() - guidedLeaveTimestamp
        : 0;
      const persisted = consumePendingPartnerReturn(3000);
      if (elapsedMem >= 3000 || persisted) {
        if (awaitingGuidedAction && !persisted) {
          consumePendingPartnerReturn(0);
        }
        const targetId = persisted?.id || awaitingGuidedAction?.id;
        const matched =
          MICRO_ACTIONS.find((a) => a.id === targetId) ||
          awaitingGuidedAction ||
          bestAction;
        if (matched) {
          guidedReturnAction = matched;
          guidedReturnMetric = 0;
          awaitingGuidedAction = null;
          playPayoffAsmr(matched);
          trackEvent("aa_partner_return_prompt", {
            surface: "guided",
            id: matched.id,
          });
        }
      } else {
        const remPersisted = getPendingPartnerReturnRemainingMs(3000);
        const remMem =
          awaitingGuidedAction && elapsedMem > 0
            ? Math.max(0, 3000 - elapsedMem)
            : 0;
        const rem = Math.max(remPersisted, remMem);
        if (rem > 0) {
          guidedReturnTimer = setTimeout(checkGuidedReturn, rem + 30);
        }
      }
    };

    const onVis = () => {
      if (document.visibilityState === "visible") checkGuidedReturn();
    };
    checkGuidedReturn();

    const pulseTimer = setTimeout(async () => {
      const pulse = await fetchAmbientPulse();
      ambientPulse = pulse;
    }, 300);

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", checkGuidedReturn);
    window.addEventListener("pageshow", checkGuidedReturn);

    return () => {
      clearTimeout(pulseTimer);
      if (guidedReturnTimer) clearTimeout(guidedReturnTimer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", checkGuidedReturn);
      window.removeEventListener("pageshow", checkGuidedReturn);
    };
  });

  function handleToggleSound() {
    soundMuted = toggleSoundMuted();
    trackEvent("aa_sound_toggle", { surface: "guided", muted: soundMuted });
  }

  function triggerGuidedEffectSpark() {
    if (!bestAction) return;
    showGuidedEffect = true;
    guidedSparkBoosted = true;
    notifyMollySpark(bestAction, { surface: "guided" });
    if (guidedCanvasNode) {
      triggerCanvasBurst(guidedCanvasNode, true);
    } else {
      playPayoffAsmr(bestAction);
    }
    trackEvent("aa_effect_preview_toggle", {
      surface: "guided",
      id: bestAction.id,
      open: true,
    });
  }

  function handleStartGuidedAction(action, surfaceLabel = "guided_best") {
    if (!action) return;
    awaitingGuidedAction = action;
    guidedLeaveTimestamp = Date.now();
    guidedReturnAction = null;
    savePendingPartnerReturn(action, surfaceLabel);
    markActionStarted(action.id, surfaceLabel);
    trackEvent("aa_clickout", {
      surface: surfaceLabel,
      id: action.id,
    });
  }

  async function shareGuidedDirectLink(action) {
    if (!action || typeof window === "undefined") return;
    const directUrl = `${window.location.origin}/?action=${encodeURIComponent(action.id)}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(directUrl);
        copiedDirectLink = true;
        setTimeout(() => (copiedDirectLink = false), 2500);
      } else if (navigator.share) {
        await navigator.share({
          title: cleanTitle(action.title),
          url: directUrl,
        });
      }
      trackEvent("aa_share_direct_action", { surface: "guided", id: action.id });
    } catch {}
  }
</script>

<svelte:head>
  <title>Průvodce dobrými skutky — Akcelerátor altruismu</title>
</svelte:head>

<div class="page">
  <header class="subpage-hero header">
    <div class="hero-kicker">PRŮVODCE NA MÍRU</div>
    <h1 class="title">
      Jak chceš dneska <span class="serif-accent">pomoct</span>?
    </h1>
    <p class="subtitle">
      Zvol si, kolik máš zrovna času a jaké téma ti je blízké — hned uvidíš
      jeden konkrétní, ověřený skutek.
    </p>
  </header>

  <div class="guided-workspace">
    <!-- LEFT: 2 CALM FOUNDATIONAL CHOICES -->
    <section class="compass-shell compass-foundations" aria-label="Nastavení průvodce">
      <div class="step-block">
        <div class="block-label">1. Kolik máš zrovna času?</div>

        <div
          class="situation-grid"
          role="radiogroup"
          aria-label="Dnešní situace a kapacita"
        >
          {#each SITUATIONS as s}
            <button
              type="button"
              class="situation-card"
              class:active={activeSituationId === s.id}
              aria-pressed={activeSituationId === s.id}
              on:click={() => selectSituation(s.id)}
            >
              <span class="sit-emoji">{s.emoji}</span>
              <div class="sit-copy">
                <span class="sit-title">{s.title}</span>
                <span class="sit-sub">{s.sub}</span>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <div class="divider"></div>

      <div class="step-block">
        <div class="block-label">
          2. Blízké téma <span class="opt-tag">(volitelné)</span>
        </div>

        <div class="topic-pills" role="group" aria-label="Výběr tématu pomoci">
          <button
            type="button"
            class="topic-pill"
            class:selected={selectedTopics.length === 0}
            on:click={() => toggleTopic("all")}
          >
            ✨ Cokoliv
          </button>
          {#each VALUES as v}
            <button
              type="button"
              class="topic-pill"
              class:selected={selectedTopics.includes(v.key)}
              on:click={() => toggleTopic(v.key)}
            >
              {v.shortLabel || v.label}
            </button>
          {/each}
        </div>
      </div>
    </section>

    {#if bestAction}
      <div class="mobile-guided-preview-bar" role="region" aria-label="Náhled doporučeného kroku">
        <span class="mgp-title">🎯 Doporučení: {cleanTitle(bestAction.title)}</span>
        <button
          type="button"
          class="mgp-btn"
          on:click={() =>
            document.getElementById("personal-plan")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })}
        >
          Zobrazit krok ↓
        </button>
      </div>
    {/if}

    <!-- RIGHT: CLEAN FOCUSED RECOMMENDATION (STANDARDIZED 6-PART GOODACTION CARD) -->
    <section
      id="personal-plan"
      class="plan-section recommendation-section"
      class:flash={planFlash}
      aria-live="polite"
    >
      {#if bestAction}
        <div class="card highlight-card">
          <div class="rec-top-row">
            <div class="rec-meta-line">
              <span class="rec-quick-tags"
                >{bestAction.quickTagsLabel || "2 min · Zdarma · Online"}</span
              >
              <span>·</span>
              <span
                class="rec-evidence-pill tier-{bestAction.impactEvidence ||
                  'B'}"
                title={EVIDENCE_TIERS[bestAction.impactEvidence || "B"]?.desc}
              >
                Důkazy {bestAction.impactEvidence || "B"} · {EVIDENCE_TIERS[
                  bestAction.impactEvidence || "B"
                ]?.shortLabel}
              </span>
              {#if isDone(bestAction.id)}
                <span class="done-inline">· ✓ Splněno</span>
              {/if}
            </div>

            <div class="rec-top-actions">
              <button
                type="button"
                class="btn-cycle-inline"
                on:click={cycleRecommendation}
              >
                ↻ Jiný nápad
              </button>
            </div>
          </div>

          {#if guidedReturnAction}
            <div
              class="return-dopamine-strip"
              role="status"
              aria-live="polite"
              data-scene={getActionEffectMeta(guidedReturnAction, guidedReturnMetric).scene}
            >
              <div class="return-dopamine-head">
                <span class="return-dopamine-title">
                  ✨ Vítej zpět! Povedlo se?
                </span>
                <span class="impact-payoff-badge">
                  {getActionEffectMeta(guidedReturnAction, guidedReturnMetric, {
                    isReturnStrip: true,
                  }).badge}
                </span>
              </div>
              <canvas
                class="impact-payoff-canvas"
                width="320"
                height="118"
                aria-label="Fyzikální vizualizace dopadu dobrého skutku"
                use:impactCanvas={{
                  action: guidedReturnAction,
                  climax: true,
                  onProgress: (v) => {
                    guidedReturnMetric = v;
                  },
                }}
              ></canvas>
              <div class="return-dopamine-actions">
                <button
                  type="button"
                  class="btn-return-complete"
                  on:click={() => {
                    const done = guidedReturnAction;
                    guidedReturnAction = null;
                    recordSmallWin({
                      id: done.id,
                      title: done.title,
                      surface: "guided",
                    });
                  }}
                >
                  ✓ Hotovo – rozsvítit stopu
                </button>
                <button
                  type="button"
                  class="btn-return-dismiss"
                  on:click={() => (guidedReturnAction = null)}
                >
                  Později
                </button>
              </div>
            </div>
          {/if}

          <h2 class="rec-title">{cleanTitle(bestAction.title)}</h2>
          <p class="rec-desc">{bestAction.desc}</p>

          <div class="rec-impact-block">
            <p class="rec-impact-line">
              <strong>Přínos ({bestAction.impactBasis || "doložený"}):</strong>
              {bestAction.concreteImpact || bestAction.selfBenefit}
            </p>
            <div class="rec-partner-line">
              <span
                >{bestAction.registrationRequired
                  ? "Krátká registrace u partnera"
                  : "Bez registrace na našem webu"}</span
              >
              <span>·</span>
              <span>Aktivita probíhá u <strong>{bestAction.org}</strong></span>
            </div>
          </div>

          {#if bestAction.steps?.length}
            <details class="how-toggle">
              <summary
                >Jak se zapojit ({bestAction.steps.length}
                {bestAction.steps.length === 1
                  ? "krok"
                  : bestAction.steps.length < 5
                    ? "kroky"
                    : "kroků"}) a řetězec dopadu</summary
              >
              <ol class="clean-steps">
                {#each bestAction.steps as step}
                  <li>{step}</li>
                {/each}
              </ol>

              {#if bestAction.impactChain}
                <div class="rec-impact-chain">
                  <span
                    ><strong>Aktivita:</strong>
                    {bestAction.impactChain.activity}</span
                  >
                  <span class="chain-sep">→</span>
                  <span
                    ><strong>Výsledek:</strong>
                    {bestAction.impactChain.immediateOutput}</span
                  >
                  <span class="chain-sep">→</span>
                  <span
                    ><strong>Skutečný dopad:</strong>
                    {bestAction.impactChain.realImpact}</span
                  >
                </div>
              {/if}
            </details>
          {/if}

          {#if showGuidedEffect && !guidedReturnAction}
            <div
              class="card-effect-stage"
              data-scene={getActionEffectMeta(bestAction, guidedEffectMetric).scene}
            >
              <div class="card-effect-head">
                <span class="impact-payoff-badge">
                  {getActionEffectMeta(bestAction, guidedEffectMetric).badge}
                </span>
                <div class="card-effect-controls">
                  <button
                    type="button"
                    class="effect-spark-btn"
                    class:active={guidedSparkBoosted}
                    aria-pressed={guidedSparkBoosted}
                    on:click={triggerGuidedEffectSpark}
                    title="Spustit vlnu dopadu na plátně"
                  >
                    ✨ Impuls
                  </button>
                  <button
                    type="button"
                    class="sound-mute-btn"
                    on:click={handleToggleSound}
                    aria-pressed={soundMuted}
                    aria-label={soundMuted ? "Zapnout jemné zvuky" : "Ztlumit zvuky"}
                    title={soundMuted ? "Zapnout jemné zvuky" : "Ztlumit zvuky"}
                  >
                    {soundMuted ? "🔇" : "🔊"}
                  </button>
                </div>
              </div>
              <canvas
                bind:this={guidedCanvasNode}
                class="impact-payoff-canvas"
                width="320"
                height="118"
                aria-label="Fyzikální vizualizace dopadu dobrého skutku"
                use:impactCanvas={{
                  action: bestAction,
                  climax: false,
                  onProgress: (v) => {
                    guidedEffectMetric = v;
                  },
                }}
              ></canvas>
            </div>
          {/if}

          <div class="cta-row">
            <a
              class="btn-gold-action"
              data-molly-guide="true"
              href={bestAction.url}
              target="_blank"
              rel="noopener noreferrer"
              use:holdSpark={{ id: bestAction.id, surface: "guided_best" }}
              on:click={() => handleStartGuidedAction(bestAction, "guided_best")}
            >
              <span>Začít pomáhat</span>
              <span>↗</span>
            </a>

            <button
              type="button"
              class="btn-done-action"
              class:initiated={isBestStarted}
              on:click={() =>
                recordSmallWin({
                  id: bestAction.id,
                  title: bestAction.title,
                  surface: "guided",
                })}
            >
              {isBestStarted ? "✓ Dokončeno" : "✓ Hotovo"}
            </button>
          </div>

          <div class="guided-pulse-row">
            <div class="ambient-pulse-pill" role="status" aria-live="off">
              <span class="pulse-dot-live" aria-hidden="true"></span>
              <span class="pulse-msg-text">{ambientPulseText}</span>
            </div>
          </div>

          <div class="rec-verify-footer">
            <span>
              Ověřeno: <strong>{bestAction.verifiedLabel}</strong>
              · Zdroj:
              <a
                href={bestAction.sourceUrl || bestAction.url}
                target="_blank"
                rel="noopener noreferrer"
                class="rec-source-link"
              >
                {bestAction.org} ↗
              </a>
            </span>
            <div class="rec-footer-btns">
              <button
                type="button"
                class="rec-broken-btn"
                on:click={() => shareGuidedDirectLink(bestAction)}
              >
                {copiedDirectLink ? "✓ Odkaz zkopírován" : "🔗 Sdílet odkaz"}
              </button>
              <button
                type="button"
                class="rec-broken-btn"
                on:click={() =>
                  openBrokenLinkReport({
                    id: bestAction.id,
                    title: cleanTitle(bestAction.title),
                    org: bestAction.org,
                    url: bestAction.url,
                  })}
              >
                Nahlásit chybu
              </button>
            </div>
          </div>
        </div>
      {/if}

      {#if sideAlternatives.length}
        <details class="calm-drawer alts-drawer">
          <summary>
            <span
              >Další {sideAlternatives.length} nápady pro tohle nastavení</span
            >
          </summary>
          <div class="alts-grid">
            {#each sideAlternatives as alt (alt.id)}
              <article class="alt-card">
                <div class="alt-meta">
                  {alt.quickTagsLabel || cleanMeta(alt.metaLabel)} · Důkazy {alt.impactEvidence ||
                    "B"} · Ověřeno: {alt.verifiedLabel}
                </div>
                <h4>{cleanTitle(alt.title)}</h4>
                <p>{alt.desc}</p>
                <div class="alt-impact-note">
                  <strong>Přínos ({alt.impactBasis || "doložený"}):</strong>
                  {alt.concreteImpact}
                </div>
                <div class="alt-actions">
                  <a
                    href={alt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="alt-open"
                    use:holdSpark={{ id: alt.id, surface: "guided_alt" }}
                    on:click={() => handleStartGuidedAction(alt, "guided_alt")}
                  >
                    Začít pomáhat ↗
                  </a>
                  <button
                    type="button"
                    class="alt-detail"
                    on:click={() => promoteAlternative(alt)}
                  >
                    Detail ↑
                  </button>
                </div>
              </article>
            {/each}
          </div>
        </details>
      {/if}

      <!-- 5.1 & 5.2 OVĚŘENÁ ÚČINNOST A METODIKA DOPADU -->
      <details class="calm-drawer methodology-drawer">
        <summary>
          <span
            >⚖️ Jak poznáme, že pomoc skutečně pomohla? (Hodnocení důkazů A / B
            / C)</span
          >
        </summary>
        <div class="methodology-body">
          <p class="meth-intro">{EVIDENCE_METHODOLOGY.intro}</p>

          <div class="meth-tiers">
            {#each Object.values(EVIDENCE_TIERS) as tier}
              <div class="meth-tier-item">
                <strong>Důkazy {tier.tier} — {tier.label}:</strong>
                <span>{tier.desc}</span>
              </div>
            {/each}
          </div>

          <div class="meth-table-wrap">
            <table class="meth-table">
              <thead>
                <tr>
                  <th>Aktivita</th>
                  <th>Možný přínos</th>
                  <th>Co u dopadu rozlišujeme</th>
                </tr>
              </thead>
              <tbody>
                {#each EVIDENCE_METHODOLOGY.comparisonRows as row}
                  <tr>
                    <td><strong>{row.activity}</strong></td>
                    <td>{row.benefit}</td>
                    <td>{row.distinction}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <div class="meth-links">
            <span>Další zdroje k efektivnímu altruismu a evaluaci dopadu:</span>
            {#each EVIDENCE_METHODOLOGY.sources as src}
              <a href={src.url} target="_blank" rel="noopener noreferrer"
                >{src.label} ↗</a
              >
            {/each}
          </div>
        </div>
      </details>
    </section>

    <!-- LEFT ROW 2 (Desktop) / REFINEMENT (Mobile): STEP 3 & CONSOLIDATED PARAMETERS DRAWER -->
    <section class="compass-shell adaptive-step-block" aria-label="Upřesňující volby">
      {#if selectedTopics.length === 0 && recipientMacro === "any"}
        <div class="block-label">
          3. Komu chceš dnes nejvíc pomoct? <span class="opt-tag"
            >(nepovinné)</span
          >
        </div>
        <div class="topic-pills">
          <button
            type="button"
            class="topic-pill"
            class:selected={recipientMacro === "people"}
            on:click={() =>
              applyAdaptiveFilter(() => (recipientMacro = "people"), "recipient")}
          >
            👥 Lidem
          </button>
          <button
            type="button"
            class="topic-pill"
            class:selected={recipientMacro === "animals"}
            on:click={() =>
              applyAdaptiveFilter(
                () => (recipientMacro = "animals"),
                "recipient",
              )}
          >
            🐾 Zvířatům
          </button>
          <button
            type="button"
            class="topic-pill"
            class:selected={recipientMacro === "nature"}
            on:click={() =>
              applyAdaptiveFilter(() => (recipientMacro = "nature"), "recipient")}
          >
            🌿 Přírodě
          </button>
        </div>
      {:else if activeSituationId === "couch" || activeSituationId === "focus"}
        <div class="block-label">
          3. Chceš zůstat úplně anonymní? <span class="opt-tag"
            >(nepovinné)</span
          >
        </div>
        <div class="topic-pills">
          <button
            type="button"
            class="topic-pill"
            class:selected={contactLevel === "any"}
            on:click={() =>
              applyAdaptiveFilter(() => (contactLevel = "any"), "contact")}
          >
            Nezáleží
          </button>
          <button
            type="button"
            class="topic-pill"
            class:selected={contactLevel === "anonymous"}
            on:click={() =>
              applyAdaptiveFilter(
                () => (contactLevel = "anonymous"),
                "contact",
              )}
          >
            🔒 Zcela anonymně
          </button>
          <button
            type="button"
            class="topic-pill"
            class:selected={contactLevel === "contact_ok"}
            on:click={() =>
              applyAdaptiveFilter(
                () => (contactLevel = "contact_ok"),
                "contact",
              )}
          >
            👋 Nevadí mi kontakt
          </button>
        </div>
      {:else}
        <div class="block-label">
          3. Jednorázově, nebo dlouhodobě? <span class="opt-tag"
            >(nepovinné)</span
          >
        </div>
        <div class="topic-pills">
          <button
            type="button"
            class="topic-pill"
            class:selected={commitment === "any"}
            on:click={() =>
              applyAdaptiveFilter(() => (commitment = "any"), "commitment")}
          >
            Nezáleží
          </button>
          <button
            type="button"
            class="topic-pill"
            class:selected={commitment === "one_off"}
            on:click={() =>
              applyAdaptiveFilter(
                () => (commitment = "one_off"),
                "commitment",
              )}
          >
            ⚡ Jednorázově
          </button>
          <button
            type="button"
            class="topic-pill"
            class:selected={commitment === "long_term"}
            on:click={() =>
              applyAdaptiveFilter(
                () => (commitment = "long_term"),
                "commitment",
              )}
          >
            🌱 Dlouhodobě
          </button>
        </div>
      {/if}

      <details class="adaptive-params-drawer">
        <summary>⚙️ Upřesnit další volby (anonymita, čas, důkazy)</summary>
        <div class="adaptive-params-grid">
          <div class="ap-group">
            <span class="ap-label">Závazek:</span>
            <div class="ap-pills">
              <button
                type="button"
                class:active={commitment === "any"}
                on:click={() =>
                  applyAdaptiveFilter(() => (commitment = "any"), "commitment")}
                >Vše</button
              >
              <button
                type="button"
                class:active={commitment === "one_off"}
                on:click={() =>
                  applyAdaptiveFilter(
                    () => (commitment = "one_off"),
                    "commitment",
                  )}>Jednorázově</button
              >
              <button
                type="button"
                class:active={commitment === "long_term"}
                on:click={() =>
                  applyAdaptiveFilter(
                    () => (commitment = "long_term"),
                    "commitment",
                  )}>Dlouhodobě</button
              >
            </div>
          </div>

          <div class="ap-group">
            <span class="ap-label">Anonymita:</span>
            <div class="ap-pills">
              <button
                type="button"
                class:active={contactLevel === "any"}
                on:click={() =>
                  applyAdaptiveFilter(() => (contactLevel = "any"), "contact")}
                >Vše</button
              >
              <button
                type="button"
                class:active={contactLevel === "anonymous"}
                on:click={() =>
                  applyAdaptiveFilter(
                    () => (contactLevel = "anonymous"),
                    "contact",
                  )}>Anonymně</button
              >
              <button
                type="button"
                class:active={contactLevel === "contact_ok"}
                on:click={() =>
                  applyAdaptiveFilter(
                    () => (contactLevel = "contact_ok"),
                    "contact",
                  )}
                >Nevadí kontakt</button
              >
            </div>
          </div>

          <div class="ap-group">
            <span class="ap-label">Komu pomoci:</span>
            <div class="ap-pills">
              <button
                type="button"
                class:active={recipientMacro === "any"}
                on:click={() =>
                  applyAdaptiveFilter(
                    () => (recipientMacro = "any"),
                    "recipient",
                  )}>Všem</button
              >
              <button
                type="button"
                class:active={recipientMacro === "people"}
                on:click={() =>
                  applyAdaptiveFilter(
                    () => (recipientMacro = "people"),
                    "recipient",
                  )}>Lidem</button
              >
              <button
                type="button"
                class:active={recipientMacro === "animals"}
                on:click={() =>
                  applyAdaptiveFilter(
                    () => (recipientMacro = "animals"),
                    "recipient",
                  )}>Zvířatům</button
              >
              <button
                type="button"
                class:active={recipientMacro === "nature"}
                on:click={() =>
                  applyAdaptiveFilter(
                    () => (recipientMacro = "nature"),
                    "recipient",
                  )}>Přírodě</button
              >
            </div>
          </div>

          <div class="ap-group">
            <span class="ap-label">Sám / s lidmi:</span>
            <div class="ap-pills">
              <button
                type="button"
                class:active={socialOverride === "any"}
                on:click={() =>
                  applyAdaptiveFilter(() => (socialOverride = "any"), "social")}
                >Podle situace</button
              >
              <button
                type="button"
                class:active={socialOverride === "solo"}
                on:click={() =>
                  applyAdaptiveFilter(() => (socialOverride = "solo"), "social")}
                >Sám</button
              >
              <button
                type="button"
                class:active={socialOverride === "group"}
                on:click={() =>
                  applyAdaptiveFilter(
                    () => (socialOverride = "group"),
                    "social",
                  )}
                >S ostatními</button
              >
            </div>
          </div>

          <div class="ap-group">
            <span class="ap-label">Prostředí:</span>
            <div class="ap-pills">
              <button
                type="button"
                class:active={modeOverride === "any"}
                on:click={() =>
                  applyAdaptiveFilter(() => (modeOverride = "any"), "mode")}
                >Podle situace</button
              >
              <button
                type="button"
                class:active={modeOverride === "online"}
                on:click={() =>
                  applyAdaptiveFilter(() => (modeOverride = "online"), "mode")}
                >Z domova</button
              >
              <button
                type="button"
                class:active={modeOverride === "local"}
                on:click={() =>
                  applyAdaptiveFilter(() => (modeOverride = "local"), "mode")}
                >Venku</button
              >
            </div>
          </div>

          <div class="ap-group">
            <span class="ap-label">Finanční náročnost:</span>
            <div class="ap-pills">
              <button
                type="button"
                class:active={costOverride === "any"}
                on:click={() =>
                  applyAdaptiveFilter(() => (costOverride = "any"), "cost")}
                >Podle situace</button
              >
              <button
                type="button"
                class:active={costOverride === "free"}
                on:click={() =>
                  applyAdaptiveFilter(() => (costOverride = "free"), "cost")}
                >Bez peněz (0 Kč)</button
              >
              <button
                type="button"
                class:active={costOverride === "donation"}
                on:click={() =>
                  applyAdaptiveFilter(
                    () => (costOverride = "donation"),
                    "cost",
                  )}
                >Mohu darovat</button
              >
            </div>
          </div>

          <div class="ap-group">
            <span class="ap-label">Třída důkazů účinnosti:</span>
            <div class="ap-pills">
              <button
                type="button"
                class:active={evidenceTier === "any"}
                on:click={() =>
                  applyAdaptiveFilter(
                    () => (evidenceTier = "any"),
                    "evidence",
                  )}>Vše (A–C)</button
              >
              <button
                type="button"
                class:active={evidenceTier === "A"}
                on:click={() =>
                  applyAdaptiveFilter(() => (evidenceTier = "A"), "evidence")}
                >A · Silné důkazy</button
              >
              <button
                type="button"
                class:active={evidenceTier === "B"}
                on:click={() =>
                  applyAdaptiveFilter(() => (evidenceTier = "B"), "evidence")}
                >B · Doložený přínos</button
              >
              <button
                type="button"
                class:active={evidenceTier === "C"}
                on:click={() =>
                  applyAdaptiveFilter(() => (evidenceTier = "C"), "evidence")}
                >C · Komunitní smysl</button
              >
            </div>
          </div>
        </div>
      </details>
    </section>
  </div>

  <!-- LOCAL PLACES IN YOUR CITY — AUTO-OPENED ONLY FOR WALK / PEOPLE -->
  <details class="calm-drawer local-drawer" bind:open={localDrawerOpen}>
    <summary>
      <span>📍 Místa pro osobní zapojení v okolí města {activeCity.name}</span>
    </summary>

    <section class="local-section" aria-label="Místa v okolí">
      <div class="local-head">
        <h2>Kam se ozvat nebo zajít poblíž města</h2>

        <div class="city-picker-wrap">
          <label for="guided-city-select">Město:</label>
          <select
            id="guided-city-select"
            name="city"
            autocomplete="off"
            bind:value={cityId}
            on:change={persistPrefs}
            class="city-select"
          >
            {#each CZECH_CITIES as c}
              <option value={c.id}>{c.name}</option>
            {/each}
          </select>
          <a href={nearUrl} class="map-jump-link">Celá mapa →</a>
        </div>
      </div>

      <div class="local-grid">
        {#each localMatches as place (place.id)}
          {@const tpl = buildFirstContactTemplate(place)}
          <article class="local-card">
            <div class="lc-top">
              <span>{place.subcategory || "Místo pomoci"}</span>
              <span class="lc-dist">~{place.distKm} km ({activeCity.name})</span
              >
            </div>
            <h3>{place.name}</h3>
            <p class="lc-desc">{place.quickMission || place.description}</p>
            {#if place.address}
              <div class="lc-addr">📍 {place.address}</div>
            {/if}

            <div class="lc-actions">
              {#if place.website}
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="lc-btn primary"
                  use:holdSpark={{ id: place.id, surface: "guided_local" }}
                  on:click={() =>
                    handleStartGuidedAction(
                      {
                        id: place.id,
                        title: place.name,
                        category: place.kind,
                        subcategory: place.subcategory,
                      },
                      "guided_local",
                    )}
                >
                  Web ↗
                </a>
              {/if}
              <button
                type="button"
                class="lc-btn ghost"
                on:click={() =>
                  (openTemplateId =
                    openTemplateId === place.id ? null : place.id)}
              >
                💬 Vzor zprávy
              </button>
            </div>

            {#if openTemplateId === place.id}
              <div class="tpl-drawer">
                <pre>{tpl.body}</pre>
                <div class="tpl-btns">
                  <button type="button" on:click={() => copyTemplate(place)}>
                    {copiedTemplateId === place.id
                      ? "✓ Zkopírováno"
                      : "📋 Zkopírovat"}
                  </button>
                  {#if tpl.mailtoUrl}
                    <a href={tpl.mailtoUrl}>✉️ E-mail</a>
                  {/if}
                </div>
              </div>
            {/if}
          </article>
        {/each}
      </div>
    </section>
  </details>
</div>

<style>
  .page {
    max-width: 1140px;
    margin: 0 auto;
    padding: 0.45rem 1.25rem 5rem;
  }

  .subpage-hero.header {
    text-align: center;
    padding: 1.05rem 1.4rem !important;
    margin-bottom: 0.65rem !important;
  }

  .hero-kicker {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #fde68a;
    margin-bottom: 0.25rem;
  }

  .title {
    font-family: var(--font-sans);
    font-weight: 800;
    color: #ffffff;
    font-size: clamp(1.75rem, 3vw, 2.35rem);
    margin: 0;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .title .serif-accent {
    color: #fde68a;
    font-weight: 400;
  }

  .subtitle {
    color: rgba(236, 248, 241, 0.9);
    margin: 0.35rem auto 0;
    max-width: 54ch;
    font-size: 0.9rem;
    line-height: 1.48;
  }

  .guided-workspace {
    display: grid;
    grid-template-columns: 0.88fr 1.12fr;
    gap: 1.5rem;
    align-items: start;
  }

  /* COMPASS SHELL */
  .compass-shell {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(22, 82, 56, 0.1);
    border-radius: 24px;
    padding: 1.15rem 1.25rem;
    box-shadow: var(--shadow-sm);
  }

  .compass-shell.compass-foundations {
    grid-column: 1;
    grid-row: 1;
  }

  .compass-shell.adaptive-step-block {
    grid-column: 1;
    grid-row: 2;
  }

  .block-label {
    font-size: 0.82rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .opt-tag {
    font-weight: 600;
    color: var(--text-muted);
  }

  .situation-grid {
    display: flex;
    flex-direction: column;
    gap: 0.36rem;
  }

  .situation-card {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    text-align: left;
    padding: 0.54rem 0.8rem;
    border-radius: 13px;
    background: transparent;
    border: 1px solid rgba(22, 82, 56, 0.09);
    cursor: pointer;
    font-family: var(--font-sans);
    transition: all 0.16s ease;
  }

  .situation-card:hover {
    background: #f5faf7;
    border-color: rgba(16, 185, 129, 0.35);
  }

  .situation-card.active {
    background: #0f3022;
    border-color: #0f3022;
    color: #ffffff;
    box-shadow: 0 8px 18px -8px rgba(9, 29, 20, 0.3);
  }

  .sit-emoji {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .sit-copy {
    display: flex;
    flex-direction: column;
    gap: 0.06rem;
  }

  .sit-title {
    font-weight: 700;
    font-size: 0.88rem;
    color: inherit;
  }

  .sit-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .situation-card.active .sit-sub {
    color: rgba(167, 243, 208, 0.88);
  }

  .divider {
    height: 1px;
    background: rgba(22, 82, 56, 0.08);
    margin: 0.8rem 0;
  }

  .topic-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .topic-pill {
    padding: 0.42rem 0.82rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 82, 56, 0.12);
    background: #f6faf7;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .topic-pill:hover {
    border-color: rgba(16, 185, 129, 0.4);
    background: #ffffff;
  }

  .topic-pill.selected {
    background: #0f3022;
    border-color: #0f3022;
    color: #fde68a;
  }

  .adaptive-params-drawer {
    margin-top: 0.85rem;
    font-size: 0.8rem;
  }

  .adaptive-params-drawer summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--emerald-600);
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.65rem;
    border-radius: 12px;
    background: rgba(22, 82, 56, 0.05);
    border: 1px solid rgba(22, 82, 56, 0.1);
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .adaptive-params-drawer summary:hover {
    background: rgba(22, 82, 56, 0.09);
    border-color: rgba(22, 82, 56, 0.2);
  }

  .adaptive-params-drawer summary::-webkit-details-marker {
    display: none;
  }

  .adaptive-params-drawer summary::after {
    content: "▾";
    font-size: 0.85rem;
    color: var(--forest-600);
    transition: transform 0.2s ease;
  }

  .adaptive-params-drawer[open] summary::after {
    transform: rotate(180deg);
  }

  .adaptive-params-grid {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .ap-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .ap-label {
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .ap-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .ap-pills button {
    border: 1px solid rgba(22, 82, 56, 0.12);
    background: #f6faf7;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.3rem 0.65rem;
    border-radius: 999px;
    cursor: pointer;
  }

  .ap-pills button.active {
    background: #0f3022;
    border-color: #0f3022;
    color: #fde68a;
  }

  .rec-quick-tags {
    font-weight: 800;
    color: #0d2e20;
  }

  .rec-evidence-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.14rem 0.52rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.75rem;
    background: #ecfdf5;
    color: #047857;
  }

  .rec-evidence-pill.tier-C {
    background: #f8fafc;
    color: #334155;
  }

  .rec-impact-block {
    margin: 0 0 1rem;
    padding-top: 0.55rem;
    border-top: 1px solid rgba(22, 82, 56, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .rec-partner-line {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .rec-impact-chain {
    margin: 0.6rem 0 0;
    padding-top: 0.55rem;
    border-top: 1px dashed rgba(22, 82, 56, 0.14);
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .chain-sep {
    color: var(--emerald-600);
    font-weight: 800;
  }

  .rec-verify-footer {
    margin-top: 0.85rem;
    padding-top: 0.65rem;
    border-top: 1px solid rgba(22, 82, 56, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.76rem;
    color: var(--text-muted);
  }

  .rec-top-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .guided-pulse-row {
    margin-top: 0.65rem;
  }

  .rec-footer-btns {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .rec-source-link {
    color: var(--forest-800);
    font-weight: 700;
    text-decoration: none;
  }

  .rec-source-link:hover {
    color: var(--emerald-600);
    text-decoration: underline;
  }

  .rec-broken-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }

  .rec-broken-btn:hover {
    color: #b45309;
  }

  .alt-impact-note {
    font-size: 0.78rem;
    color: var(--text-secondary);
    margin: 0 0 0.55rem;
  }

  .methodology-drawer {
    margin-top: 0.85rem;
  }

  .methodology-body {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.55;
  }

  .meth-intro {
    margin: 0;
  }

  .meth-tiers {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .meth-tier-item strong {
    color: var(--forest-850);
  }

  .meth-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    max-width: 100%;
    margin: 0.75rem 0;
    border-radius: 12px;
    border: 1px solid rgba(22, 82, 56, 0.08);
  }

  .meth-table {
    width: 100%;
    min-width: 460px;
    border-collapse: collapse;
    font-size: 0.8rem;
  }

  .meth-table th,
  .meth-table td {
    text-align: left;
    padding: 0.45rem 0.6rem;
    border-bottom: 1px solid rgba(22, 82, 56, 0.1);
  }

  .meth-table th {
    font-weight: 800;
    color: var(--forest-850);
  }

  .meth-links {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
  }

  .meth-links a {
    color: var(--emerald-600);
    font-weight: 700;
    text-decoration: none;
  }

  .meth-links a:hover {
    text-decoration: underline;
  }

  /* CLEAN PERSONAL RECOMMENDATION CARD */
  .plan-section {
    grid-column: 2;
    grid-row: 1 / span 2;
    position: sticky;
    top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .plan-section.flash .highlight-card {
    box-shadow:
      0 22px 44px -14px rgba(16, 185, 129, 0.24),
      0 0 0 2px rgba(16, 185, 129, 0.42);
  }

  .highlight-card {
    background: rgba(255, 255, 255, 0.97);
    color: var(--text-primary);
    border-radius: 26px;
    padding: 2rem;
    border: 1px solid rgba(22, 82, 56, 0.11);
    box-shadow: var(--shadow-md);
    transition: box-shadow 0.25s ease;
  }

  .rec-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.65rem;
  }

  .rec-meta-line {
    display: flex;
    align-items: center;
    gap: 0.42rem;
    flex-wrap: wrap;
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .done-inline {
    color: #047857;
    font-weight: 700;
  }

  .btn-cycle-inline {
    border: none;
    background: transparent;
    color: var(--emerald-600);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    padding: 0.2rem 0.45rem;
    border-radius: 8px;
  }

  .btn-cycle-inline:hover {
    background: rgba(16, 185, 129, 0.09);
    color: var(--forest-850);
  }

  .rec-title {
    margin: 0 0 0.55rem;
    font-size: clamp(1.35rem, 2.3vw, 1.7rem);
    font-weight: 800;
    color: #0b2419;
    line-height: 1.22;
    letter-spacing: -0.02em;
  }

  .rec-desc {
    font-size: 0.96rem;
    line-height: 1.62;
    color: var(--text-secondary);
    margin: 0 0 0.95rem;
  }

  .rec-impact-line {
    margin: 0 0 0.3rem;
    padding-left: 0.85rem;
    border-left: 2.5px solid #10b981;
    font-size: 0.88rem;
    line-height: 1.52;
    color: #164230;
    font-weight: 600;
  }

  .how-toggle {
    margin: 0 0 1.15rem 0;
    font-size: 0.85rem;
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

  .clean-steps {
    margin: 0.55rem 0 0;
    padding-left: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.86rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .cta-row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .btn-gold-action {
    flex: 1;
    min-width: 160px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.86rem 1.25rem;
    border-radius: 14px;
    background: linear-gradient(135deg, #0f3626 0%, #17523a 100%);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.92rem;
    text-decoration: none;
    box-shadow: 0 10px 22px -6px rgba(15, 54, 38, 0.35);
    transition: transform 0.18s ease;
  }

  .btn-gold-action:hover {
    transform: translateY(-2px);
  }

  .btn-done-action {
    padding: 0.86rem 1.1rem;
    border-radius: 14px;
    border: 1px solid rgba(5, 150, 105, 0.28);
    background: #eef7f1;
    color: #065f46;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .btn-done-action:hover {
    background: #059669;
    color: #ffffff;
  }

  /* ALTERNATIVES */
  .alts-drawer {
    margin-top: 0.9rem;
  }

  .alts-drawer .alts-grid {
    margin-top: 0.85rem;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .alt-card {
    background: #ffffff;
    border: 1px solid rgba(22, 82, 56, 0.09);
    border-radius: 16px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }

  .alt-meta {
    font-size: 0.73rem;
    font-weight: 700;
    color: var(--emerald-600);
    margin-bottom: 0.25rem;
  }

  .alt-card h4 {
    margin: 0 0 0.35rem;
    font-size: 0.92rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .alt-card p {
    margin: 0 0 0.75rem;
    font-size: 0.81rem;
    color: var(--text-secondary);
    line-height: 1.46;
    flex: 1;
  }

  .alt-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.45rem;
  }

  .alt-open {
    font-size: 0.8rem;
    font-weight: 800;
    color: #0f3626;
    text-decoration: none;
  }

  .alt-detail {
    border: none;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
  }

  .alt-detail:hover {
    color: var(--text-primary);
  }

  /* LOCAL PLACES */
  .local-drawer {
    margin-top: 1.35rem;
  }

  .local-section {
    margin-top: 1rem;
    padding-top: 0.9rem;
    border-top: 1px solid rgba(22, 82, 56, 0.09);
  }

  .local-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .local-head h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .city-picker-wrap {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .city-picker-wrap label {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .city-select {
    padding: 0.45rem 0.8rem;
    border-radius: 10px;
    border: 1px solid rgba(22, 82, 56, 0.16);
    background: #ffffff;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--text-primary);
    cursor: pointer;
  }

  .map-jump-link {
    font-size: 0.84rem;
    font-weight: 800;
    color: #059669;
    text-decoration: none;
  }

  .local-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .local-card {
    padding: 1.15rem;
    border-radius: 18px;
    background: #ffffff;
    border: 1px solid rgba(22, 82, 56, 0.09);
    display: flex;
    flex-direction: column;
  }

  .lc-top {
    display: flex;
    justify-content: space-between;
    gap: 0.4rem;
    font-size: 0.74rem;
    font-weight: 700;
    color: #059669;
    margin-bottom: 0.3rem;
  }

  .lc-dist {
    color: var(--text-muted);
  }

  .local-card h3 {
    margin: 0 0 0.35rem;
    font-size: 0.98rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .lc-desc {
    margin: 0 0 0.55rem;
    font-size: 0.83rem;
    color: var(--text-secondary);
    line-height: 1.48;
    flex: 1;
  }

  .lc-addr {
    font-size: 0.76rem;
    color: var(--text-muted);
    margin-bottom: 0.7rem;
  }

  .lc-actions {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .lc-btn {
    padding: 0.45rem 0.78rem;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    font-family: var(--font-sans);
  }

  .lc-btn.primary {
    background: #123828;
    color: #fde68a;
    border: none;
  }

  .lc-btn.ghost {
    background: #f5f9f6;
    border: 1px solid rgba(22, 82, 56, 0.12);
    color: var(--text-primary);
  }

  .tpl-drawer {
    margin-top: 0.65rem;
    padding-top: 0.65rem;
    border-top: 1px solid rgba(22, 82, 56, 0.09);
  }

  .tpl-drawer pre {
    white-space: pre-wrap;
    font-family: var(--font-sans);
    font-size: 0.76rem;
    color: var(--text-secondary);
    margin: 0 0 0.5rem;
    line-height: 1.42;
  }

  .tpl-btns {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .tpl-btns button,
  .tpl-btns a {
    padding: 0.35rem 0.68rem;
    border-radius: 8px;
    border: none;
    background: #065f46;
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
  }

  @media (max-width: 980px) {
    .guided-workspace {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .compass-shell.compass-foundations {
      order: 1;
    }
    .mobile-guided-preview-bar {
      order: 2;
    }
    .plan-section {
      order: 3;
      position: static;
    }
    .compass-shell.adaptive-step-block {
      order: 4;
    }
    .alts-drawer .alts-grid,
    .local-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .compass-shell,
    .highlight-card {
      padding: 1.35rem 1.2rem;
    }
  }

  .mobile-guided-preview-bar {
    display: none;
  }

  @media (max-width: 680px) {
    .page {
      padding: 0.35rem 0.65rem 4.2rem;
    }

    .subpage-hero.header {
      padding: 0.55rem 0.85rem;
      margin-bottom: 0.45rem;
      border-radius: 16px;
    }

    .header .hero-kicker,
    .header .subtitle {
      display: none !important;
    }

    .header .title {
      font-size: 1.18rem;
      line-height: 1.18;
      margin: 0;
    }

    .guided-workspace {
      gap: 0.55rem;
    }

    .compass-shell,
    .plan-section {
      min-width: 0;
      max-width: 100%;
    }

    .compass-shell,
    .highlight-card {
      padding: 0.68rem 0.78rem;
      border-radius: 18px;
    }

    .block-label {
      font-size: 0.78rem;
      margin-bottom: 0.42rem;
    }

    .situation-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.34rem;
    }

    .situation-card {
      padding: 0.4rem 0.5rem;
      border-radius: 12px;
      gap: 0.35rem;
    }

    .situation-card:last-child {
      grid-column: 1 / -1;
      justify-content: center;
    }

    .sit-emoji {
      font-size: 0.95rem;
    }

    .sit-sub {
      display: none !important;
    }

    .sit-title {
      font-size: 0.74rem;
      line-height: 1.15;
    }

    .divider {
      margin: 0.42rem 0;
    }

    .compass-foundations .topic-pills {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      gap: 0.28rem;
      padding: 0.05rem 1.1rem 0.15rem 0.02rem;
      mask-image: linear-gradient(to right, black 0%, black calc(100% - 24px), transparent 100%);
      -webkit-mask-image: linear-gradient(to right, black 0%, black calc(100% - 24px), transparent 100%);
    }

    .compass-foundations .topic-pills::-webkit-scrollbar {
      display: none;
    }

    .topic-pills {
      gap: 0.28rem;
    }

    .topic-pill {
      flex: 0 0 auto;
      white-space: nowrap;
      padding: 0.28rem 0.56rem;
      font-size: 0.72rem;
    }

    .rec-title {
      font-size: 1.08rem;
      margin-bottom: 0.28rem;
    }

    .rec-desc {
      font-size: 0.8rem;
      line-height: 1.38;
      margin-bottom: 0.45rem;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .rec-impact-block {
      margin-bottom: 0.45rem;
    }

    .rec-impact-line {
      font-size: 0.76rem;
      line-height: 1.35;
      margin-bottom: 0.18rem;
    }

    .rec-partner-line {
      font-size: 0.7rem;
    }

    .how-toggle {
      margin-bottom: 0.5rem;
      font-size: 0.76rem;
    }

    .card-effect-stage {
      padding: 0.36rem 0.5rem;
      margin-bottom: 0.5rem;
    }

    .highlight-card :global(.impact-payoff-canvas) {
      height: 54px;
    }

    .btn-gold-action,
    .btn-done-action {
      padding: 0.62rem 0.9rem;
      font-size: 0.84rem;
    }

    .mobile-guided-preview-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      padding: 0.44rem 0.7rem;
      border-radius: 14px;
      background: rgba(15, 48, 34, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(253, 230, 138, 0.4);
      color: #f8faf8;
      box-shadow: 0 10px 24px rgba(6, 22, 15, 0.28);
    }

    .mgp-title {
      font-size: 0.76rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }

    .mgp-btn {
      appearance: none;
      border: none;
      border-radius: 999px;
      padding: 0.36rem 0.68rem;
      background: linear-gradient(135deg, #fde68a 0%, #6ee7b7 100%);
      color: #062015;
      font-family: inherit;
      font-size: 0.74rem;
      font-weight: 800;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
    }
  }
</style>
