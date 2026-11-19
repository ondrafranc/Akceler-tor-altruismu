<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
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
  import {
    savePendingPartnerReturn,
    consumePendingPartnerReturn,
    readPendingPartnerRecord,
  } from "../lib/features/actions/services/partnerReturnService.js";
  import { cleanTitle } from "../lib/utils.js";
  import {
    safeGetItem,
    safeSetItem,
    AA_USER_TOPICS_KEY,
    AA_HOME_DECK_STATE_KEY,
  } from "../lib/storage/index.js";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import HeroSection from "../lib/features/home/HeroSection.svelte";
  import QuickStartSection from "../lib/features/home/QuickStartSection.svelte";
  import PathwaysBento from "../lib/features/home/PathwaysBento.svelte";
  import CityJumpStrip from "../lib/features/home/CityJumpStrip.svelte";
  import SanctuaryTeaser from "../lib/features/home/SanctuaryTeaser.svelte";
  import HopeCarousel from "../lib/features/home/HopeCarousel.svelte";
  import PortalsDrawer from "../lib/features/home/PortalsDrawer.svelte";
  import SwipeDeck from "../lib/features/actions/components/SwipeDeck.svelte";

  /** @type {Record<import('$lib/types').HomeEnergyMode, { icon: string, label: string, hint: string, desktopClaim: string, mobileClaim: string, timeBucket: string, mode: string, social: string, cost: string, commitment: string }>} */
  const HOME_MODES = {
    couch: {
      icon: "armchair",
      label: "Mám 2 min",
      hint: "Okamžitý mikro-skutek online · 0 Kč · bez registrace",
      desktopClaim: "Stačí 2 minuty dnes.",
      mobileClaim: "Jeden ověřený dobrý skutek na 2 minuty zdarma.",
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
      desktopClaim: "Stačí 15 minut dnes.",
      mobileClaim: "Smysluplný skutek na 15 minut z domova zdarma.",
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
      desktopClaim: "Stačí krátká procházka dnes.",
      mobileClaim: "Konkrétní dobrý skutek v tvém okolí bez obrazovek.",
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
      desktopClaim: "Stačí jeden krok s ostatními.",
      mobileClaim: "Dobrovolnictví a pomoc s lidmi ve tvém okolí.",
      timeBucket: "45",
      mode: "local",
      social: "group",
      cost: "free",
      commitment: "long_term",
    },
  };

  /** @type {Record<string, string>} */
  const ACTION_ALIASES = {
    "click-and-feed": "zvirata_utulek_online",
    click_and_feed: "zvirata_utulek_online",
    mapswipe: "missing_maps",
  };

  /** @type {import('$lib/types').HomeEnergyMode} */
  let energyMode = $state("couch");
  let suggestionIndex = $state(0);
  let lastQuickActionId = "";
  let excludeQuickId = $state("");
  let pinnedActionId = $state("");
  let hopeIdx = $state(0);
  /** @type {string[]} */
  let savedValues = $state([]);
  let usePersonalValues = $state(false);
  let hasMountedHome = false;
  let lastAppliedUrlKey = "";
  let isDeepLinkedSession = $state(false);

  let awaitingPartnerReturn = false;
  let partnerLeaveTimestamp = 0;
  let partnerReturnPromptVisible = $state(false);
  let justCompleted = $state(false);
  let copiedDirectLink = $state(false);
  /** @type {ReturnType<typeof setTimeout> | null} */
  let copyLinkTimer = null;
  let soundMuted = $state(false);

  /**
   * @param {unknown} val
   * @returns {val is Record<string, unknown>}
   */
  function isPlainRecord(val) {
    return Object.prototype.toString.call(val) === "[object Object]";
  }

  /**
   * @param {unknown} val
   * @returns {val is import('$lib/types').HomeEnergyMode}
   */
  function isHomeEnergyMode(val) {
    return (
      val === "couch" ||
      val === "focus" ||
      val === "walk" ||
      val === "people"
    );
  }

  /**
   * Filters the full scored list for each Home energy tab so counts reflect true subsets
   * (`couch`: 45 with 2-min online deeds ranked first; `focus`: 8; `walk`: 16; `people`: 9).
   * @param {import('$lib/types').MicroAction[]} ranked
   * @param {import('$lib/types').HomeEnergyMode} mode
   * @returns {import('$lib/types').MicroAction[]}
   */
  function filterHomeDeckPool(ranked, mode) {
    if (!Array.isArray(ranked) || ranked.length === 0) return [];
    if (mode === "focus") {
      return ranked.filter((a) => a.mode !== "local" && a.timeBucket === "15");
    }
    if (mode === "walk") {
      return ranked.filter((a) => a.mode === "local" && a.commitment === "one_off");
    }
    if (mode === "people") {
      return ranked.filter((a) => a.commitment === "long_term" || a.social === "group");
    }
    return ranked;
  }

  /**
   * @param {import('$lib/types').HomeEnergyMode} mode
   * @param {boolean} personalFilter
   * @param {string[]} values
   * @param {Array<{ id: string }>} completedList
   * @param {string} excludedId
   * @returns {import('$lib/types').MicroAction[]}
   */
  function buildQuickPool(
    mode,
    personalFilter,
    values,
    completedList,
    excludedId,
  ) {
    const cfg = HOME_MODES[mode] || HOME_MODES.couch;
    const ranked = recommendActions({
      values: personalFilter ? values : [],
      timeBucket: cfg.timeBucket,
      cost: cfg.cost,
      mode: cfg.mode,
      social: cfg.social,
      commitment: cfg.commitment,
      completedIds: (completedList || []).map((s) => s.id),
      excludeIds: excludedId ? [excludedId] : [],
      seed: `home:${mode}:0`,
    });
    const filtered = filterHomeDeckPool(ranked, mode);
    if (filtered.length > 0) return filtered;

    const fallbackRanked = recommendActions({
      values: [],
      timeBucket: cfg.timeBucket,
      cost: cfg.cost,
      mode: cfg.mode,
      social: cfg.social,
      commitment: cfg.commitment,
      completedIds: (completedList || []).map((s) => s.id),
      excludeIds: excludedId ? [excludedId] : [],
      seed: `home:${mode}:0`,
    });
    return filterHomeDeckPool(fallbackRanked, mode);
  }

  /**
   * @param {import('$lib/types').HomeDeckState} state
   */
  function saveHomeDeckState(state) {
    try {
      safeSetItem(AA_HOME_DECK_STATE_KEY, JSON.stringify(state), "session");
    } catch {}
  }

  function syncDeckPersistence() {
    const pool = buildQuickPool(
      energyMode,
      usePersonalValues,
      savedValues,
      $completedSteps || [],
      excludeQuickId,
    );
    const deck = pool.length > 0 ? pool : (MICRO_ACTIONS || []).slice(0, 5);
    const total = deck.length;
    const normalizedIdx =
      total > 0 ? ((suggestionIndex % total) + total) % total : 0;
    const activeAction = total > 0 ? deck[normalizedIdx] : null;
    if (activeAction?.id) {
      lastQuickActionId = activeAction.id;
    }
    saveHomeDeckState({
      energyMode,
      actionId: activeAction?.id || "",
      index: normalizedIdx,
      excludeQuickId,
      usePersonalValues,
    });
  }

  /**
   * Restores persisted home deck tab & deed position within the current browser session
   * when no URL deep link overrides it. Fresh browser sessions always enter on "couch".
   * @returns {boolean}
   */
  function restoreHomeDeckState() {
    try {
      const raw = safeGetItem(AA_HOME_DECK_STATE_KEY, "session");
      if (!raw || typeof raw !== "string") return false;
      /** @type {unknown} */
      const parsed = JSON.parse(raw);
      if (!isPlainRecord(parsed)) return false;

      const restoredMode = isHomeEnergyMode(parsed.energyMode)
        ? parsed.energyMode
        : "couch";
      const restoredPersonal =
        parsed.usePersonalValues === true && savedValues.length > 0;
      const rawExcludeId =
        typeof parsed.excludeQuickId === "string"
          ? parsed.excludeQuickId.trim()
          : "";
      let validExcludeId =
        rawExcludeId && MICRO_ACTIONS.some((a) => a.id === rawExcludeId)
          ? rawExcludeId
          : "";

      const rawActionId =
        typeof parsed.actionId === "string" ? parsed.actionId.trim() : "";

      let pool = buildQuickPool(
        restoredMode,
        restoredPersonal,
        savedValues,
        $completedSteps || [],
        validExcludeId,
      );
      let deck = pool.length > 0 ? pool : (MICRO_ACTIONS || []).slice(0, 5);

      let nextIndex = 0;
      if (rawActionId.length > 0) {
        const foundIdx = deck.findIndex((a) => a.id === rawActionId);
        if (foundIdx !== -1) {
          nextIndex = foundIdx;
        } else {
          validExcludeId = "";
          pool = buildQuickPool(
            restoredMode,
            restoredPersonal,
            savedValues,
            $completedSteps || [],
            "",
          );
          deck = pool.length > 0 ? pool : (MICRO_ACTIONS || []).slice(0, 5);
          nextIndex = 0;
        }
      } else if (
        typeof parsed.index === "number" &&
        Number.isInteger(parsed.index) &&
        parsed.index >= 0 &&
        deck.length > 0
      ) {
        nextIndex = parsed.index < deck.length ? parsed.index : 0;
      }

      energyMode = restoredMode;
      usePersonalValues = restoredPersonal;
      excludeQuickId = validExcludeId;
      pinnedActionId = "";
      suggestionIndex = nextIndex;
      if (deck[nextIndex]?.id) {
        lastQuickActionId = deck[nextIndex].id;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @param {string | null | undefined} rawParam
   * @returns {import('$lib/types').MicroAction | null}
   */
  function resolveActionFromParam(rawParam) {
    if (!rawParam) return null;
    const cleaned = String(rawParam)
      .trim()
      .replace(/^[#?]+/, "");
    if (!cleaned) return null;
    const normalizedKey = cleaned.toLowerCase();
    const aliased = Object.hasOwn(ACTION_ALIASES, normalizedKey)
      ? ACTION_ALIASES[normalizedKey]
      : cleaned;
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

  /**
   * @param {{ commitment?: string, mode?: string, timeMinutes?: number | string } | null | undefined} action
   * @returns {import('$lib/types').HomeEnergyMode}
   */
  function inferEnergyModeForAction(action) {
    if (!action) return "couch";
    if (action.commitment === "long_term") return "people";
    if (action.mode === "local") return "walk";
    if (Number(action.timeMinutes) > 2) return "focus";
    return "couch";
  }

  /**
   * @param {URL} [targetUrl]
   * @param {boolean} [preferHash=false]
   * @returns {boolean}
   */
  function applyUrlDeepLink(targetUrl, preferHash = false) {
    try {
      const url =
        targetUrl instanceof URL
          ? targetUrl
          : typeof window !== "undefined"
            ? new URL(window.location.href)
            : null;
      if (!url) return false;
      const intentParam = url.searchParams.get("intent");
      const hasValidIntent = isHomeEnergyMode(intentParam);
      if (hasValidIntent) {
        energyMode = intentParam;
        excludeQuickId = "";
        suggestionIndex = 0;
      }

      const queryAction = url.searchParams.get("action");
      const rawHash =
        (targetUrl instanceof URL ? targetUrl.hash : "") ||
        (typeof window !== "undefined" ? window.location.hash : "") ||
        "";
      /** @type {string | null} */
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
        : queryAction || hashAction;
      if (actionParam) {
        const matched = resolveActionFromParam(actionParam);
        isDeepLinkedSession = Boolean(matched);
        if (matched) {
          energyMode = inferEnergyModeForAction(matched);
          excludeQuickId = "";
          pinnedActionId = matched.id;
          lastQuickActionId = matched.id;
          suggestionIndex = 0;
          awaitingPartnerReturn = false;
          partnerReturnPromptVisible = false;
          justCompleted = false;
          const pending = readPendingPartnerRecord();
          if (pending && pending.id !== matched.id) {
            consumePendingPartnerReturn(0, { surfacePrefix: "home", allowEmptySurface: true });
          }
          return true;
        }
        pinnedActionId = "";
        suggestionIndex = 0;
        return true;
      }

      isDeepLinkedSession = false;
      pinnedActionId = "";
      return hasValidIntent;
    } catch {
      return false;
    }
  }

  /**
   * @param {URL | undefined} pageUrl
   */
  function syncPageUrlChange(pageUrl) {
    const urlKey = pageUrl
      ? `${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}`
      : "";
    if (pageUrl && urlKey !== lastAppliedUrlKey) {
      lastAppliedUrlKey = urlKey;
      const hadDeepLink = applyUrlDeepLink(pageUrl);
      if (!hadDeepLink && hasMountedHome) {
        if (!restoreHomeDeckState()) {
          energyMode = "couch";
          excludeQuickId = "";
          suggestionIndex = 0;
        }
      }
    }
  }

  $effect(() => {
    syncPageUrlChange(page.url);
  });

  onMount(() => {
    try {
      const raw = safeGetItem(AA_USER_TOPICS_KEY, "local");
      if (raw) {
        /** @type {unknown} */
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleanTopics = parsed.filter(
            /** @param {unknown} v @returns {v is string} */
            (v) => typeof v === "string" && v.length > 0,
          );
          if (cleanTopics.length > 0) {
            savedValues = cleanTopics;
          }
        }
      }
    } catch {}

    const hasExplicitUrlTarget = applyUrlDeepLink();
    if (!hasExplicitUrlTarget) {
      restoreHomeDeckState();
    }
    hasMountedHome = true;
    soundMuted = isSoundMuted();

    /** @type {ReturnType<typeof setTimeout> | null} */
    let returnDelayTimer = null;
    const handleHashChange = () => {
      const hadHashTarget = applyUrlDeepLink(undefined, true);
      if (!hadHashTarget && hasMountedHome) {
        if (!restoreHomeDeckState()) {
          energyMode = "couch";
          excludeQuickId = "";
          suggestionIndex = 0;
        }
      }
    };

    const triggerPartnerReturnIfReady = () => {
      if (justCompleted || partnerReturnPromptVisible) return;
      if (returnDelayTimer) {
        clearTimeout(returnDelayTimer);
        returnDelayTimer = null;
      }
      const elapsedMem = awaitingPartnerReturn
        ? Date.now() - partnerLeaveTimestamp
        : 0;
      const persisted = consumePendingPartnerReturn(3000, {
        surfacePrefix: "home",
        allowEmptySurface: true,
      });
      if (elapsedMem >= 3000 || persisted) {
        if (awaitingPartnerReturn && !persisted) {
          consumePendingPartnerReturn(0, {
            surfacePrefix: "home",
            allowEmptySurface: true,
          });
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

  const quickPool = $derived(
    buildQuickPool(
      energyMode,
      usePersonalValues,
      savedValues,
      $completedSteps || [],
      excludeQuickId,
    ),
  );

  const pinnedAction = $derived(
    pinnedActionId
      ? MICRO_ACTIONS.find((a) => a.id === pinnedActionId) || null
      : null,
  );
  const quickDeckActions = $derived(
    pinnedAction
      ? [pinnedAction, ...quickPool.filter((a) => a.id !== pinnedAction.id)]
      : quickPool.length > 0
        ? quickPool
        : (MICRO_ACTIONS || []).slice(0, 5),
  );
  const currentQuickAction = $derived(
    pinnedAction ||
      (quickDeckActions && quickDeckActions.length > 0
        ? quickDeckActions[
            ((suggestionIndex % quickDeckActions.length) +
              quickDeckActions.length) %
              quickDeckActions.length
          ]
        : null),
  );
  $effect(() => {
    if (currentQuickAction?.id) {
      lastQuickActionId = currentQuickAction.id;
    }
  });
  const isCurrentStarted = $derived(
    Boolean(
      currentQuickAction?.id &&
        Array.isArray($startedActionIds) &&
        $startedActionIds.includes(currentQuickAction.id),
    ),
  );

  function clearDeepLinkUrlParam() {
    isDeepLinkedSession = false;
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const hasQueryAction = url.searchParams.has("action");
      const hasHashAction = url.hash.includes("action=");
      if (!hasQueryAction && !hasHashAction) return;
      if (hasQueryAction) url.searchParams.delete("action");
      if (hasHashAction) url.hash = "";
      const nextKey = `${url.pathname}${url.search}${url.hash}`;
      lastAppliedUrlKey = nextKey;
      goto(nextKey, { replaceState: true, noScroll: true, keepFocus: true });
    } catch {}
  }

  /**
   * @param {import('$lib/types').HomeEnergyMode} mode
   */
  function setEnergyMode(mode) {
    if (energyMode === mode) {
      nextQuickIdea();
      return;
    }
    clearDeepLinkUrlParam();
    pinnedActionId = "";
    awaitingPartnerReturn = false;
    partnerReturnPromptVisible = false;
    justCompleted = false;
    excludeQuickId = lastQuickActionId;
    energyMode = mode;
    suggestionIndex = 0;
    syncDeckPersistence();
    trackEvent("aa_home_energy_mode", { mode });
    trackFunnel("intent_selected", { surface: "home_instant", mode });
    trackFunnel("recommendation_shown", {
      surface: "home_instant",
      mode,
      index: 0,
    });
  }

  function nextQuickIdea() {
    clearDeepLinkUrlParam();
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
    syncDeckPersistence();
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
    clearDeepLinkUrlParam();
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
    syncDeckPersistence();
    trackEvent("aa_home_prev_idea", {
      mode: energyMode,
      index: suggestionIndex,
    });
  }

  function reopenQuickSession() {
    clearDeepLinkUrlParam();
    const prevId = currentQuickAction?.id || lastQuickActionId;
    const wasPinned = Boolean(pinnedActionId);
    pinnedActionId = "";
    awaitingPartnerReturn = false;
    partnerReturnPromptVisible = false;
    justCompleted = false;

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

    syncDeckPersistence();
    trackEvent("aa_home_session_reopened", {
      mode: energyMode,
      index: suggestionIndex,
    });
  }

  function handleTogglePersonalValues() {
    const wasDeepLinked = isDeepLinkedSession;
    clearDeepLinkUrlParam();
    pinnedActionId = "";
    awaitingPartnerReturn = false;
    partnerReturnPromptVisible = false;
    justCompleted = false;
    usePersonalValues = !usePersonalValues;
    suggestionIndex = 0;
    if (!wasDeepLinked) {
      syncDeckPersistence();
    }
    trackEvent("aa_home_personal_filter", {
      enabled: usePersonalValues,
    });
  }

  function handleToggleSound() {
    soundMuted = toggleSoundMuted();
    trackEvent("aa_sound_toggle", { muted: soundMuted });
  }

  /**
   * @param {import('$lib/types').MicroAction | null | undefined} action
   */
  function handleStartQuickAction(action) {
    if (!action) return;
    awaitingPartnerReturn = true;
    partnerLeaveTimestamp = Date.now();
    partnerReturnPromptVisible = false;
    justCompleted = false;
    if (!pinnedActionId && !isDeepLinkedSession) {
      syncDeckPersistence();
    }
    savePendingPartnerReturn(action);
    markActionStarted(action.id, "home_instant");
    trackEvent("aa_clickout", { surface: "home_instant", id: action.id });
  }

  /**
   * @param {import('$lib/types').MicroAction | null | undefined} action
   */
  function completeQuickAction(action) {
    if (!action) return;
    pinnedActionId = action.id;
    suggestionIndex = 0;
    justCompleted = true;
    awaitingPartnerReturn = false;
    partnerReturnPromptVisible = false;
    consumePendingPartnerReturn(0, {
      surfacePrefix: "home",
      allowEmptySurface: true,
    });
    if (!isDeepLinkedSession) {
      saveHomeDeckState({
        energyMode,
        actionId: "",
        index: 0,
        excludeQuickId: "",
        usePersonalValues,
      });
    }
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

  /**
   * @param {import('$lib/types').MicroAction | null | undefined} action
   */
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
  <HeroSection
    microActionsCount={MICRO_ACTIONS.length}
    desktopClaimSerif={HOME_MODES[energyMode].desktopClaim}
    mobileClaim={HOME_MODES[energyMode].mobileClaim}
  >
    <QuickStartSection id="quick-start-area">
      <div class="instant-card" id="dnesni-skutek">
        <div class="studio-head">
          <span class="studio-label">
            <span>Chci pomoct právě teď:</span>
          </span>
          <button
            type="button"
            class="cycle-link cycle-btn"
            onclick={nextQuickIdea}
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
            role="tab"
            aria-selected={energyMode === "couch"}
            class="energy-tab"
            class:active={energyMode === "couch"}
            onclick={() => setEnergyMode("couch")}
          >
            <span class="tab-icon tab-icon-couch" aria-hidden="true">
              <AppIcon name={HOME_MODES.couch.icon} size={14} strokeWidth={2.1} />
            </span>
            <span>{HOME_MODES.couch.label}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={energyMode === "focus"}
            class="energy-tab"
            class:active={energyMode === "focus"}
            onclick={() => setEnergyMode("focus")}
          >
            <span class="tab-icon tab-icon-focus" aria-hidden="true">
              <AppIcon name={HOME_MODES.focus.icon} size={14} strokeWidth={2.1} />
            </span>
            <span>{HOME_MODES.focus.label}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={energyMode === "walk"}
            class="energy-tab"
            class:active={energyMode === "walk"}
            onclick={() => setEnergyMode("walk")}
          >
            <span class="tab-icon tab-icon-walk" aria-hidden="true">
              <AppIcon name={HOME_MODES.walk.icon} size={14} strokeWidth={2.1} />
            </span>
            <span>{HOME_MODES.walk.label}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={energyMode === "people"}
            class="energy-tab"
            class:active={energyMode === "people"}
            onclick={() => setEnergyMode("people")}
          >
            <span class="tab-icon tab-icon-people" aria-hidden="true">
              <AppIcon name={HOME_MODES.people.icon} size={14} strokeWidth={2.1} />
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
            {copiedDirectLink}
            {savedValues}
            {usePersonalValues}
            ignoreClosedSession={Boolean(pinnedAction)}
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
            onTogglePersonalValues={handleTogglePersonalValues}
            onNextIdea={nextQuickIdea}
            onPrevIdea={prevQuickIdea}
            onCloseSession={() => {
              clearDeepLinkUrlParam();
              pinnedActionId = "";
              justCompleted = false;
              trackEvent("aa_home_session_closed", {});
            }}
            onExitDeepLink={() => {
              clearDeepLinkUrlParam();
              pinnedActionId = "";
              awaitingPartnerReturn = false;
              partnerReturnPromptVisible = false;
              justCompleted = false;
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
    background:
      linear-gradient(180deg, var(--bg-canvas, #f6f7f3) 0px, rgba(246, 247, 243, 0) 96px),
      radial-gradient(56% 420px at 14% 210px, rgba(230, 240, 234, 0.72) 0%, transparent 72%),
      radial-gradient(56% 420px at 86% 230px, rgba(254, 246, 232, 0.55) 0%, transparent 72%);
  }

  /* INSTANT CARD */
  .instant-card {
    position: relative;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    background: linear-gradient(180deg, var(--bg-surface, #ffffff) 0%, var(--bohemian-sage, #eef5f0) 100%);
    color: var(--ink-primary, #14281d);
    border: 1px solid var(--border-forest, #c5d9cd);
    border-radius: 22px;
    padding: 1.1rem 1.35rem 0.95rem;
    box-shadow:
      var(--shadow-lg, 0 14px 32px -10px rgba(18, 42, 30, 0.11), 0 4px 10px rgba(18, 42, 30, 0.04)),
      0 2px 8px rgba(27, 94, 66, 0.06);
    scroll-margin-top: 2rem;
  }

  @media (min-width: 681px) {
    .instant-card {
      border-radius: 26px;
      padding: 1.14rem 1.42rem 0.98rem;
    }
  }

  @media (min-width: 681px) and (max-width: 919px) {
    .instant-card {
      max-width: 660px;
      margin-inline: auto;
    }
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

  .cycle-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    border: 1px solid var(--border-forest, #c5d9cd);
    background: var(--bohemian-sage, #eef5f0);
    color: var(--accent-primary, #1b5e42);
    font-family: var(--font-sans);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    min-height: 44px;
    min-width: 44px;
    margin: -5px 0;
    padding: 0.36rem 0.72rem;
    box-sizing: border-box;
    border-radius: 999px;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease,
      color 0.16s ease,
      transform 0.14s ease;
  }

  .cycle-link:hover {
    background: var(--bohemian-mist, #e6f0ea);
    border-color: var(--border-forest-strong, #a7c4b3);
    color: var(--czech-forest-hover, #164932);
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
    background: var(--bohemian-sage, #eef5f0);
    border: 1px solid var(--border-forest, #c5d9cd);
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
    transition: background-color 0.18s var(--ease-gentle), color 0.18s var(--ease-gentle), box-shadow 0.18s ease;
  }

  .tab-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .tab-icon-couch {
    color: var(--accent-warm-ink, #8f4b0e);
  }

  .tab-icon-focus {
    color: var(--forest-brook-ink, #1d4f5f);
  }

  .tab-icon-walk {
    color: var(--rowan-ink, #8a3b2c);
  }

  .tab-icon-people {
    color: var(--accent-primary, #1b5e42);
  }

  .energy-tab:hover {
    color: var(--ink-primary, #14281d);
    background: rgba(255, 255, 255, 0.72);
  }

  .energy-tab.active {
    background: linear-gradient(135deg, var(--czech-forest-hover, #164932) 0%, var(--czech-forest, #1d5c40) 100%);
    color: #ffffff;
    box-shadow:
      0 4px 12px rgba(20, 40, 29, 0.18),
      inset 0 1px 0 rgba(254, 243, 199, 0.22);
  }

  .energy-tab.active .tab-icon-couch {
    color: var(--hero-dawn, #fef3c7);
  }

  .energy-tab.active .tab-icon-focus {
    color: #cde4ea;
  }

  .energy-tab.active .tab-icon-walk {
    color: #f7d6cf;
  }

  .energy-tab.active .tab-icon-people {
    color: #d8ebe0;
  }

  @media (min-width: 920px) and (max-width: 1024px) {
    .instant-card {
      padding: 0.96rem 1.05rem 0.88rem;
    }

    .energy-tabs {
      display: flex;
      align-items: stretch;
      justify-content: space-between;
      gap: 0.14rem;
      padding: 0.18rem;
    }

    .energy-tab {
      flex: 1 1 auto;
      font-size: 0.72rem;
      padding: 0.34rem 0.32rem;
      gap: 0.2rem;
      letter-spacing: -0.01em;
    }

    .energy-tab .tab-icon :global(svg) {
      width: 13px;
      height: 13px;
    }
  }

  @media (max-width: 1024px) {
    .cycle-link {
      min-height: 44px;
      min-width: 44px;
      margin: -2px 0;
      padding: 0.36rem 0.72rem;
    }
  }

  @media (max-width: 680px) {
    .home-sections {
      padding-inline: 0.75rem;
    }

    .instant-card {
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      padding: 0.46rem 0.74rem 0.5rem;
      border-radius: 22px;
      margin-top: 0;
      scroll-margin-top: 0.5rem;
      box-shadow:
        0 14px 30px -12px rgba(14, 39, 27, 0.18),
        0 3px 8px rgba(27, 94, 66, 0.06);
    }

    .studio-head {
      margin-bottom: 0.28rem;
      padding-bottom: 0;
    }

    .studio-label {
      font-size: 0.79rem;
    }

    .cycle-link {
      min-height: 44px;
      min-width: 44px;
      margin: 0;
      padding: 0.34rem 0.64rem;
      font-size: 0.77rem;
      border-color: var(--border-forest, #c5d9cd);
      background: var(--bohemian-sage, #eef5f0);
    }

    .energy-tabs {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      gap: 0.14rem;
      padding: 0.16rem;
      margin-bottom: 0.28rem;
      border-radius: 999px;
      background: var(--bohemian-sage, #eef5f0);
      border-color: var(--border-forest, #c5d9cd);
      width: 100%;
    }

    .energy-tab {
      min-height: 44px;
      min-width: 0;
      padding: 0.24rem 0.18rem;
      gap: 0.18rem;
      font-size: 0.71rem;
      font-weight: 700;
      white-space: nowrap;
      border-radius: 999px;
      letter-spacing: -0.015em;
    }
  }

  @media (max-width: 440px) {
    .energy-tabs {
      display: flex;
      align-items: stretch;
      justify-content: space-between;
      border-radius: 999px;
      gap: 0.24rem;
      padding: 0.2rem;
      margin-bottom: 0.2rem;
    }

    .energy-tab {
      flex: 1 1 auto;
      padding: 0.22rem 0.34rem;
      gap: 0.18rem;
      font-size: 0.66rem;
      min-height: 44px;
    }

    .energy-tab .tab-icon :global(svg) {
      width: 12px;
      height: 12px;
    }
  }

  @media (max-width: 368px) {
    .energy-tabs {
      gap: 0.16rem;
      padding: 0.16rem;
    }

    .energy-tab {
      padding: 0.22rem 0.24rem;
      gap: 0.14rem;
      font-size: 0.645rem;
    }
  }

  @media (max-width: 359px) {
    .energy-tab {
      padding: 0.22rem 0.18rem;
      font-size: 0.63rem;
      gap: 0;
    }

    .energy-tab .tab-icon {
      display: none;
    }
  }
</style>
