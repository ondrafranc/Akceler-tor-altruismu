<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import {
    MICRO_ACTIONS,
    HOPE_FACTS,
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
  import { isSoundMuted, toggleSoundMuted } from "../lib/audio/audioContext.js";
  import { playCelebrationChord } from "../lib/audio/presets.js";
  import {
    savePendingPartnerReturn,
    consumePendingPartnerReturn,
  } from "../lib/features/actions/services/partnerReturnService.js";
  import { cleanTitle } from "../lib/utils.js";
  import { safeGetItem, AA_USER_TOPICS_KEY } from "../lib/storage/index.js";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import HeroSection from "../lib/features/home/HeroSection.svelte";
  import QuickStartSection from "../lib/features/home/QuickStartSection.svelte";
  import PathwaysBento from "../lib/features/home/PathwaysBento.svelte";
  import CityJumpStrip from "../lib/features/home/CityJumpStrip.svelte";
  import SanctuaryTeaser from "../lib/features/home/SanctuaryTeaser.svelte";
  import HopeCarousel from "../lib/features/home/HopeCarousel.svelte";
  import PortalsDrawer from "../lib/features/home/PortalsDrawer.svelte";
  import SwipeDeck from "../lib/features/actions/components/SwipeDeck.svelte";

  const HOME_MODES = {
    couch: {
      icon: "armchair",
      label: "Mám 2 min",
      hint: "Okamžitý mikro-skutek online · 0 Kč · bez registrace",
      timeBucket: "5",
      mode: "online",
      social: "solo",
      cost: "free",
      commitment: "one_off",
    },
    focus: {
      icon: "telescope",
      label: "Mám 15 min",
      hint: "Občanská věda, fotopasti nebo humanitární mapování z domova",
      timeBucket: "15",
      mode: "online",
      social: "solo",
      cost: "free",
      commitment: "any",
    },
    walk: {
      icon: "map-pin",
      label: "Osobně",
      hint: "Konkrétní pomoc venku v tvém okolí bez obrazovek",
      timeBucket: "15",
      mode: "local",
      social: "solo",
      cost: "free",
      commitment: "any",
    },
    people: {
      icon: "sprout",
      label: "Dlouhodobě",
      hint: "Smysluplné dobrovolnictví, dárcovství nebo pravidelná pomoc s lidmi",
      timeBucket: "45",
      mode: "local",
      social: "group",
      cost: "free",
      commitment: "long_term",
    },
  };

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
  let showEffectPreview = false;

  function resolveActionFromParam(rawParam) {
    if (!rawParam) return null;
    const cleaned = String(rawParam)
      .trim()
      .replace(/^[#?]+/, "");
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

      const actionParam = preferHash
        ? hashAction || queryAction
        : hashAction || queryAction;
      if (actionParam) {
        const matched = resolveActionFromParam(actionParam);
        if (matched) {
          energyMode = inferEnergyModeForAction(matched);
          pinnedActionId = matched.id;
          lastQuickActionId = matched.id;
          suggestionIndex = 0;
          awaitingPartnerReturn = false;
          partnerReturnPromptVisible = false;
          justCompleted = false;
          consumePendingPartnerReturn(0);
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
      const raw = safeGetItem(AA_USER_TOPICS_KEY, "local");
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
      if (justCompleted || partnerReturnPromptVisible) return;
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
        let matched = null;
        if (persisted?.id) {
          matched = resolveActionFromParam(persisted.id);
          if (matched) {
            energyMode = inferEnergyModeForAction(matched);
            pinnedActionId = matched.id;
            lastQuickActionId = matched.id;
            suggestionIndex = 0;
          }
        }
        awaitingPartnerReturn = false;
        partnerReturnPromptVisible = true;
        justCompleted = false;
        const elapsed = persisted?.elapsedMs || elapsedMem;
        trackEvent("aa_partner_return_prompt_shown", {
          id: persisted?.id || currentQuickAction?.id || lastQuickActionId,
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

    triggerPartnerReturnIfReady();

    window.addEventListener("hashchange", handleHashChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pageshow", handleWindowFocus);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pageshow", handleWindowFocus);
      if (returnDelayTimer) clearTimeout(returnDelayTimer);
      if (copyLinkTimer) clearTimeout(copyLinkTimer);
    };
  });

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
    seed: `home:${energyMode}:0`,
  });

  $: pinnedAction = pinnedActionId
    ? MICRO_ACTIONS.find((a) => a.id === pinnedActionId) || null
    : null;
  $: quickDeckActions = pinnedAction
    ? [pinnedAction, ...quickPool.filter((a) => a.id !== pinnedAction.id)]
    : quickPool.length > 0
      ? quickPool
      : (MICRO_ACTIONS || []).slice(0, 5);
  $: currentQuickAction =
    pinnedAction ||
    (quickDeckActions && quickDeckActions.length > 0
      ? quickDeckActions[
          ((suggestionIndex % quickDeckActions.length) +
            quickDeckActions.length) %
            quickDeckActions.length
        ]
      : null);
  $: if (currentQuickAction?.id) {
    lastQuickActionId = currentQuickAction.id;
  }
  $: isCurrentStarted = Boolean(
    currentQuickAction?.id &&
      Array.isArray($startedActionIds) &&
      $startedActionIds.includes(currentQuickAction.id),
  );

  function setEnergyMode(mode) {
    if (energyMode === mode) {
      nextQuickIdea();
      return;
    }
    pinnedActionId = "";
    awaitingPartnerReturn = false;
    partnerReturnPromptVisible = false;
    justCompleted = false;
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
    const prevId = currentQuickAction?.id || lastQuickActionId;
    const wasPinned = Boolean(pinnedActionId);
    pinnedActionId = "";
    awaitingPartnerReturn = false;
    partnerReturnPromptVisible = false;
    justCompleted = false;
    if (wasPinned) {
      const completedSet = new Set(($completedSteps || []).map((s) => s.id));
      const nextUncompletedIdx = quickPool.findIndex(
        (a) => a.id !== prevId && !completedSet.has(a.id),
      );
      suggestionIndex =
        nextUncompletedIdx !== -1
          ? nextUncompletedIdx
          : quickPool[0]?.id === prevId
            ? 1
            : 0;
    } else if (quickDeckActions.length > 0) {
      suggestionIndex = (suggestionIndex + 1) % quickDeckActions.length;
    } else {
      suggestionIndex += 1;
    }
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

  function prevQuickIdea() {
    const wasPinned = Boolean(pinnedActionId);
    pinnedActionId = "";
    awaitingPartnerReturn = false;
    partnerReturnPromptVisible = false;
    justCompleted = false;
    if (wasPinned) {
      suggestionIndex = Math.max(0, quickPool.length - 1);
    } else if (suggestionIndex > 0) {
      suggestionIndex -= 1;
    } else if (quickDeckActions.length > 0) {
      suggestionIndex = quickDeckActions.length - 1;
    }
    trackEvent("aa_home_prev_idea", {
      mode: energyMode,
      index: suggestionIndex,
    });
  }

  function reopenQuickSession() {
    const prevId = currentQuickAction?.id || lastQuickActionId;
    const wasPinned = Boolean(pinnedActionId);
    pinnedActionId = "";
    awaitingPartnerReturn = false;
    partnerReturnPromptVisible = false;
    justCompleted = false;
    showEffectPreview = false;

    const targetPool = wasPinned
      ? quickPool.length > 0
        ? quickPool
        : (MICRO_ACTIONS || []).slice(0, 5)
      : quickDeckActions;
    const completedSet = new Set(($completedSteps || []).map((s) => s.id));
    const startedSet = new Set(
      Array.isArray($startedActionIds) ? $startedActionIds : [],
    );

    const freshIdx = targetPool.findIndex(
      (a) => a.id !== prevId && !completedSet.has(a.id) && !startedSet.has(a.id),
    );
    const uncompletedIdx =
      freshIdx !== -1
        ? freshIdx
        : targetPool.findIndex((a) => a.id !== prevId && !completedSet.has(a.id));

    if (uncompletedIdx !== -1) {
      suggestionIndex = uncompletedIdx;
    } else if (targetPool.length > 1) {
      const candidate = wasPinned
        ? targetPool[0]?.id === prevId
          ? 1
          : 0
        : (suggestionIndex + 1) % targetPool.length;
      suggestionIndex =
        targetPool[candidate]?.id === prevId
          ? (candidate + 1) % targetPool.length
          : candidate;
    } else {
      suggestionIndex = 0;
    }

    trackEvent("aa_home_session_reopened", {
      mode: energyMode,
      index: suggestionIndex,
    });
  }

  function handleToggleSound() {
    soundMuted = toggleSoundMuted();
    trackEvent("aa_sound_toggle", { muted: soundMuted });
  }

  function handleStartQuickAction(action) {
    if (!action) return;
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
    pinnedActionId = action.id;
    suggestionIndex = 0;
    justCompleted = true;
    awaitingPartnerReturn = false;
    partnerReturnPromptVisible = false;
    consumePendingPartnerReturn(0);
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
    } catch {}
    playCelebrationChord();
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
</script>

<div class="home-page">
  <!-- =====================================================================
       1. EDITORIAL DAYLIGHT HERO + MINIMALIST INSTANT ACTION CARD
       ===================================================================== -->
  <HeroSection microActionsCount={MICRO_ACTIONS.length}>
    <QuickStartSection id="quick-start-area">
      <div class="instant-card" id="dnesni-skutek">
        <div class="studio-head">
          <span class="studio-label">
            <span class="studio-ready-dot" aria-hidden="true"></span>
            <span>Chci pomoct právě teď:</span>
          </span>
          <button
            type="button"
            class="cycle-link cycle-btn"
            on:click={nextQuickIdea}
            title="Ukázat další ověřenou příležitost"
          >
            <AppIcon name="refresh-cw" size={14} strokeWidth={2.2} />
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
            <span class="tab-icon" aria-hidden="true">
              <AppIcon name={HOME_MODES.couch.icon} size={14} strokeWidth={2} />
            </span>
            <span>{HOME_MODES.couch.label}</span>
          </button>
          <button
            type="button"
            class="energy-tab"
            class:active={energyMode === "focus"}
            on:click={() => setEnergyMode("focus")}
          >
            <span class="tab-icon" aria-hidden="true">
              <AppIcon name={HOME_MODES.focus.icon} size={14} strokeWidth={2} />
            </span>
            <span>{HOME_MODES.focus.label}</span>
          </button>
          <button
            type="button"
            class="energy-tab"
            class:active={energyMode === "walk"}
            on:click={() => setEnergyMode("walk")}
          >
            <span class="tab-icon" aria-hidden="true">
              <AppIcon name={HOME_MODES.walk.icon} size={14} strokeWidth={2} />
            </span>
            <span>{HOME_MODES.walk.label}</span>
          </button>
          <button
            type="button"
            class="energy-tab"
            class:active={energyMode === "people"}
            on:click={() => setEnergyMode("people")}
          >
            <span class="tab-icon" aria-hidden="true">
              <AppIcon name={HOME_MODES.people.icon} size={14} strokeWidth={2} />
            </span>
            <span>{HOME_MODES.people.label}</span>
          </button>
        </div>

        {#if currentQuickAction}
          <SwipeDeck
            actions={quickDeckActions}
            currentIndex={pinnedAction ? 0 : suggestionIndex}
            isStarted={isCurrentStarted}
            {justCompleted}
            {partnerReturnPromptVisible}
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
              awaitingPartnerReturn = false;
              partnerReturnPromptVisible = false;
              justCompleted = false;
              usePersonalValues = !usePersonalValues;
              suggestionIndex = 0;
              trackEvent("aa_home_personal_filter", {
                enabled: usePersonalValues,
              });
            }}
            onNextIdea={nextQuickIdea}
            onPrevIdea={prevQuickIdea}
            onCloseSession={() => {
              trackEvent("aa_home_session_closed", {});
            }}
            onReopenSession={reopenQuickSession}
          />
        {/if}
      </div>
    </QuickStartSection>
  </HeroSection>

  <div class="home-sections">
    <PathwaysBento>
      <CityJumpStrip />
    </PathwaysBento>

    <SanctuaryTeaser />

    <section
      class="content-wrap closing-section"
      aria-label="Dobré zprávy a další možnosti"
    >
      <HopeCarousel
        hopeIndex={hopeIdx}
        onNextHope={() => (hopeIdx = (hopeIdx + 1) % HOPE_FACTS.length)}
      />
      <PortalsDrawer />
    </section>
  </div>
</div>

<style>
  .home-page {
    padding-bottom: 1.5rem;
  }

  .home-sections {
    padding-inline: 1.25rem;
    box-sizing: border-box;
  }

  /* EDITORIAL DAYLIGHT INSTANT CARD */
  .instant-card {
    position: relative;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 22px;
    padding: 1.1rem 1.35rem 0.95rem;
    box-shadow: var(--shadow-md, 0 8px 20px -6px rgba(18, 42, 30, 0.08));
    scroll-margin-top: 2rem;
  }

  .studio-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    min-width: 0;
    gap: 0.5rem;
    margin-bottom: 0.55rem;
  }

  .studio-label {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--ink-secondary, #3f574a);
    letter-spacing: -0.005em;
  }

  .studio-ready-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-primary, #1b5e42);
    flex-shrink: 0;
  }

  .cycle-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    font-family: var(--font-sans);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    min-height: 34px;
    padding: 0.24rem 0.68rem;
    box-sizing: border-box;
    border-radius: 999px;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease,
      color 0.16s ease,
      transform 0.14s ease;
  }

  .cycle-link:hover {
    background: #e1eae4;
    border-color: var(--accent-primary, #1b5e42);
    color: var(--accent-primary-hover, #144732);
  }

  .cycle-link:active {
    transform: scale(0.97);
  }

  .energy-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.24rem;
    padding: 0.24rem;
    border-radius: 999px;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    margin-bottom: 0.68rem;
  }

  .energy-tab {
    border: none;
    border-radius: 999px;
    min-height: 44px;
    min-width: 0;
    padding: 0.44rem 0.42rem;
    gap: 0.28rem;
    background: transparent;
    color: var(--ink-secondary, #3f574a);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    box-sizing: border-box;
    transition: background-color 0.18s var(--ease-gentle), color 0.18s var(--ease-gentle);
  }

  .tab-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .energy-tab:hover {
    color: var(--ink-primary, #14281d);
    background: rgba(255, 255, 255, 0.72);
  }

  .energy-tab.active {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  @media (max-width: 680px) {
    .home-sections {
      padding-inline: 0.75rem;
    }

    .instant-card {
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      padding: 0.55rem 0.75rem 0.65rem;
      border-radius: 18px;
      margin-top: 0;
      scroll-margin-top: 0.5rem;
      box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
    }

    .studio-head {
      margin-bottom: 0.55rem;
      padding-bottom: 0;
    }

    .studio-label {
      font-size: 0.78rem;
    }

    .cycle-link {
      min-height: 44px;
      min-width: 44px;
      margin: -6px -4px -6px 0;
      padding: 0.4rem 0.6rem;
      font-size: 0.77rem;
      border-color: transparent;
      background: transparent;
    }

    .energy-tabs {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      gap: 0.14rem;
      padding: 0.18rem;
      margin-bottom: 0.3rem;
      border-radius: 999px;
      background: var(--bg-subtle, #edf2ee);
      width: 100%;
    }

    .energy-tab {
      min-height: 44px;
      min-width: 0;
      padding: 0.28rem 0.2rem;
      gap: 0.2rem;
      font-size: 0.72rem;
      font-weight: 700;
      white-space: nowrap;
      border-radius: 999px;
      letter-spacing: -0.015em;
    }
  }

  @media (max-width: 440px) {
    .energy-tab .tab-icon {
      display: none;
    }
    .energy-tab {
      padding: 0.28rem 0.18rem;
      font-size: 0.71rem;
    }
  }
</style>
