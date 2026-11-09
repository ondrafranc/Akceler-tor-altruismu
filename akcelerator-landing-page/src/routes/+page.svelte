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
  import {
    isSoundMuted,
    toggleSoundMuted,
    isAnimalAction,
    getActionEffectMeta,
    startHoldSpark,
    playPayoffAsmr,
    savePendingPartnerReturn,
    consumePendingPartnerReturn,
    getPendingPartnerReturnRemainingMs,
    impactCanvas,
    triggerCanvasBurst,
    fetchAmbientPulse,
    describeAmbientPulse,
  } from "../lib/sensoryEngine.js";
  import { notifyMollySpark } from "../lib/mollyStore.js";
  import { cleanTitle, stripLeadingEmoji, safeGetItem } from "../lib/utils.js";
  import HeroSection from "../lib/features/home/HeroSection.svelte";
  import QuickStartSection from "../lib/features/home/QuickStartSection.svelte";
  import PathwaysBento from "../lib/features/home/PathwaysBento.svelte";
  import CityJumpStrip from "../lib/features/home/CityJumpStrip.svelte";
  import SanctuaryTeaser from "../lib/features/home/SanctuaryTeaser.svelte";
  import HopeCarousel from "../lib/features/home/HopeCarousel.svelte";
  import PortalsDrawer from "../lib/features/home/PortalsDrawer.svelte";
  import ActionCard from "../lib/features/actions/components/ActionCard.svelte";

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
  let soundMuted = false;
  let kibbleGrams = 0;
  let showEffectPreview = true;
  let sparkBoosted = false;
  let cardCanvasNode = null;
  /** @type {any} */
  let ambientPulse = null;
  // Pozn.: reaktivní text pulsu je až POD `currentQuickAction` (viz níže). Kdyby stál tady,
  // Svelte by kvůli závislosti spočítal kartu dřív, než deep-link (?action=) nastaví pinnedActionId.
  let stopHoldSpark = null;

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
    if (Number(action.timeMinutes) > 2) return "focus";
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
      const raw = safeGetItem("aa_values", "local");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedValues = parsed;
        }
      }
    } catch {}

    applyUrlDeepLink();
    soundMuted = isSoundMuted();

    let returnDelayTimer = null;
    const handleHashChange = () => applyUrlDeepLink(undefined, true);

    const triggerPartnerReturnIfReady = () => {
      if (partnerReturnPromptVisible || justCompleted) return;
      if (returnDelayTimer) {
        clearTimeout(returnDelayTimer);
        returnDelayTimer = null;
      }
      const elapsedMem = awaitingPartnerReturn
        ? Date.now() - partnerLeaveTimestamp
        : 0;
      const persisted = consumePendingPartnerReturn(3000);
      if (elapsedMem >= 3000 || persisted) {
        if (awaitingPartnerReturn && !persisted) {
          consumePendingPartnerReturn(0);
        }
        if (persisted?.id) {
          const matched = resolveActionFromParam(persisted.id);
          if (matched) {
            energyMode = inferEnergyModeForAction(matched);
            pinnedActionId = matched.id;
            lastQuickActionId = matched.id;
          }
        }
        awaitingPartnerReturn = false;
        partnerReturnPromptVisible = true;
        const elapsed = persisted?.elapsedMs || elapsedMem;
        try {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(40);
          }
        } catch {}
        trackEvent("aa_partner_return_prompt", {
          id: persisted?.id || currentQuickAction?.id || lastQuickActionId,
          elapsedMs: elapsed,
        });
      } else {
        const remPersisted = getPendingPartnerReturnRemainingMs(3000);
        const remMem =
          awaitingPartnerReturn && elapsedMem > 0
            ? Math.max(0, 3000 - elapsedMem)
            : 0;
        const rem = Math.max(remPersisted, remMem);
        if (rem > 0) {
          returnDelayTimer = setTimeout(triggerPartnerReturnIfReady, rem + 30);
        }
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

    triggerPartnerReturnIfReady();

    const pulseTimer = setTimeout(async () => {
      const pulse = await fetchAmbientPulse();
      ambientPulse = pulse;
    }, 250);

    window.addEventListener("hashchange", handleHashChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pageshow", handleWindowFocus);

    return () => {
      handlePrimaryPointerEnd(false);
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pageshow", handleWindowFocus);
      clearTimeout(pulseTimer);
      if (returnDelayTimer) clearTimeout(returnDelayTimer);
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
  $: ambientPulseText = describeAmbientPulse(ambientPulse, { inCard: true, actionId: currentQuickAction?.id });
  $: isCurrentStarted = Boolean(
    currentQuickAction?.id &&
      Array.isArray($startedActionIds) &&
      $startedActionIds.includes(currentQuickAction.id),
  );

  $: activeHope = HOPE_FACTS[hopeIdx % HOPE_FACTS.length];

  function setEnergyMode(mode) {
    handlePrimaryPointerEnd(false);
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
    handlePrimaryPointerEnd(false);
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

  function handleToggleSound() {
    soundMuted = toggleSoundMuted();
    trackEvent("aa_sound_toggle", { muted: soundMuted });
  }

  function handlePrimaryPointerDown(e) {
    if (e.button && e.button !== 0) return;
    if (stopHoldSpark) stopHoldSpark(false);
    stopHoldSpark = startHoldSpark(e.currentTarget, () => {
      trackEvent("aa_hold_spark_ready", { id: currentQuickAction?.id });
    });
  }

  function handlePrimaryPointerEnd(released = false) {
    if (stopHoldSpark) {
      stopHoldSpark(released);
      stopHoldSpark = null;
    }
  }

  const handleWeightUpdate = (g) => {
    kibbleGrams = g;
  };

  function triggerHomeEffectSpark() {
    showEffectPreview = true;
    sparkBoosted = true;
    notifyMollySpark(currentQuickAction, { surface: "home" });
    if (cardCanvasNode) {
      triggerCanvasBurst(cardCanvasNode, true);
    } else {
      playPayoffAsmr(currentQuickAction);
    }
    trackEvent("aa_effect_preview_toggle", {
      id: currentQuickAction?.id,
      open: true,
    });
  }

  function handleStartQuickAction(action) {
    if (!action) return;
    handlePrimaryPointerEnd(true);
    awaitingPartnerReturn = true;
    partnerLeaveTimestamp = Date.now();
    partnerReturnPromptVisible = false;
    justCompleted = false;
    savePendingPartnerReturn(action);
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
      silent: true,
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

  function getSavedValueLabels(ids) {
    return VALUES.filter((v) => ids.includes(v.key || v.id))
      .map((v) => stripLeadingEmoji(v.label))
      .slice(0, 2)
      .join(", ");
  }
</script>

<div class="home-page">
  <!-- =====================================================================
       1. CALM CINEMATIC HERO + MINIMALIST INSTANT ACTION CARD
       ===================================================================== -->
  <HeroSection microActionsCount={MICRO_ACTIONS.length} fireflies={FIREFLIES}>
    <!-- CLEAN, BREATHABLE INSTANT CARD (ZERO NESTED BOXES) -->
    <QuickStartSection id="quick-start-area">
      <div class="instant-card" id="dnesni-skutek">
      <div class="card-halo" aria-hidden="true"></div>

      <div class="studio-head">
        <span class="studio-label">Chci pomoct právě teď:</span>
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
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          <span>Jiný tip</span>
        </button>
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
        <ActionCard
          action={currentQuickAction}
          isStarted={isCurrentStarted}
          {justCompleted}
          {partnerReturnPromptVisible}
          {ambientPulse}
          {soundMuted}
          {showEffectPreview}
          {copiedDirectLink}
          {savedValues}
          {usePersonalValues}
          onStart={handleStartQuickAction}
          onComplete={completeQuickAction}
          onShare={shareDirectActionLink}
          onReportBroken={(act) =>
            openBrokenLinkReport({
              id: act.id,
              title: cleanTitle(act.title),
              org: act.org,
              url: act.url,
            })}
          onToggleSound={handleToggleSound}
          onTogglePersonalValues={() => {
            pinnedActionId = "";
            usePersonalValues = !usePersonalValues;
            suggestionIndex = 0;
            trackEvent("aa_home_personal_filter", {
              enabled: usePersonalValues,
            });
          }}
          onNextIdea={nextQuickIdea}
        />
      {/if}
      </div>
    </QuickStartSection>
  </HeroSection>

  <PathwaysBento>
    <CityJumpStrip />
  </PathwaysBento>

  <SanctuaryTeaser />

  <section
    class="content-wrap closing-section"
    aria-label="Dobré zprávy a další možnosti"
  >
    <HopeCarousel hopeIndex={hopeIdx} onNextHope={() => (hopeIdx += 1)} />
    <PortalsDrawer />
  </section>
</div>

<style>
  .home-page {
    padding-bottom: 1.5rem;
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
    scroll-margin-top: 2rem;
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

  @media (max-width: 680px) {
    .instant-card {
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      padding: 1.15rem 1.1rem;
      border-radius: 24px;
      margin-top: 0.35rem;
      scroll-margin-top: 1.5rem;
      box-shadow:
        0 24px 48px -12px rgba(3, 12, 8, 0.52),
        0 0 0 1px rgba(255, 255, 255, 0.75);
    }

    .studio-head {
      margin-bottom: 0.5rem;
      padding-bottom: 0.25rem;
    }

    .studio-label {
      font-size: 0.82rem;
    }

    .cycle-link {
      padding: 0.25rem 0.52rem;
      font-size: 0.78rem;
    }

    .energy-tabs {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      gap: 0.25rem;
      padding: 0.25rem;
      margin-bottom: 0.75rem;
      border-radius: 999px;
      background: #eef3ef;
      width: 100%;
    }

    .energy-tabs::-webkit-scrollbar {
      display: none;
    }

    .energy-tab {
      min-height: 44px;
      padding: 0.35rem 0.55rem;
      font-size: 0.78rem;
      font-weight: 700;
      white-space: nowrap;
      flex: 1 1 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      border-radius: 999px;
      letter-spacing: -0.01em;
    }
  }
</style>
