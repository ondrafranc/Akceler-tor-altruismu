<script module>
  /** @type {string | null} */
  let lastInstantPreviewActionId = null;
  let lastInstantPreviewUnmountAt = 0;
  let lastUserGestureAt = 0;
  let gestureListenersAttached = false;

  function ensurePreviewGestureListeners() {
    if (gestureListenersAttached || typeof window === "undefined") return;
    gestureListenersAttached = true;
    const markGesture = () => {
      lastUserGestureAt = Date.now();
    };
    window.addEventListener("pointerdown", markGesture, {
      capture: true,
      passive: true,
    });
    window.addEventListener("keydown", markGesture, {
      capture: true,
      passive: true,
    });
  }
</script>

<script>
  import { onDestroy } from "svelte";
  import { getActionEffectMeta } from "../../../../lib/sensory/catalog/catalogResolver.js";
  import { impactCanvas } from "../../../../lib/sensory/canvas/impactCanvasAction.js";
  import { triggerCanvasBurst } from "../../../../lib/sensory/canvas/controllerRegistry.js";
  import {
    playPayoffAsmr,
    playCelebrationChord,
  } from "../../../../lib/audio/presets.js";
  import {
    safeVibrate,
    prefersReducedMotion,
  } from "../../../../lib/core/device.js";
  import { startHoldSpark } from "../../../../lib/sensory/interaction/holdSpark.js";
  import {
    trackEvent,
    openBrokenLinkReport,
  } from "../../../../lib/analytics.js";
  import {
    notifyMollySpark,
  } from "../../../../lib/mollyStore.js";
  import { cleanTitle, stripLeadingEmoji } from "../../../../lib/utils.js";
  import { VALUES } from "../../../data/values.js";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import EvidenceBadge from "./EvidenceBadge.svelte";

  /** @typedef {(typeof VALUES)[number] & { id?: string }} ValueTopic */

  /**
   * @type {{
   *   action?: (import('$lib/types').MicroAction & Record<string, unknown>) | null,
   *   isStarted?: boolean,
   *   isCompleted?: boolean,
   *   justCompleted?: boolean,
   *   partnerReturnPromptVisible?: boolean,
   *   soundMuted?: boolean,
   *   copiedDirectLink?: boolean,
   *   savedValues?: string[],
   *   usePersonalValues?: boolean,
   *   variant?: 'instant' | 'directory' | 'compact',
   *   spotlight?: boolean,
   *   idleLure?: boolean,
   *   className?: string,
   *   onStart?: ((action: import('$lib/types').MicroAction) => void) | null,
   *   onComplete?: ((action: import('$lib/types').MicroAction) => void) | null,
   *   onShare?: ((action: import('$lib/types').MicroAction) => void) | null,
   *   onReportBroken?: ((action: import('$lib/types').MicroAction) => void) | null,
   *   onToggleSound?: (() => void) | null,
   *   onTogglePersonalValues?: (() => void) | null,
   *   onNextIdea?: (() => void) | null,
   *   onDismissReturn?: (() => void) | null,
   *   onCloseSession?: (() => void) | null
   * }}
   */
  let {
    action = null,
    isStarted = false,
    isCompleted = false,
    justCompleted = false,
    partnerReturnPromptVisible = false,
    soundMuted = false,
    copiedDirectLink = false,
    savedValues = [],
    usePersonalValues = false,
    variant = "instant",
    spotlight = false,
    idleLure = true,
    className = "",
    onStart = null,
    onComplete = null,
    onShare = null,
    onReportBroken = null,
    onToggleSound = null,
    onTogglePersonalValues = null,
    onNextIdea = null,
    onDismissReturn = null,
    onCloseSession = null,
  } = $props();

  let kibbleGrams = $state(0);
  let sparkBoosted = $state(false);
  /** @type {HTMLDetailsElement | null} */
  let detailsEl = $state(null);
  /** @type {HTMLCanvasElement | null} */
  let cardCanvasNode = $state(null);
  /** @type {HTMLAnchorElement | null} */
  let primaryBtnNode = $state(null);

  let prevJustCompleted = false;
  /** @type {((rel?: boolean) => void) | null} */
  let stopHoldSpark = null;
  /** @type {string | null} */
  let lastHoldActionId = null;
  /** @type {string | null} */
  let lastCelebratedActionId = null;

  // Interactive anticipation diorama state (zero-reflow cached bounds)
  const IDLE_FIRST_DELAY_MS = 3800;
  const IDLE_REPEAT_DELAY_MS = 14000;
  const CARD_SWITCH_WINDOW_MS = 600;

  /** @type {HTMLDivElement | null} */
  let stageNode = $state(null);
  let stageVisible = $state(true);
  /** @type {DOMRect | null} */
  let previewBounds = null;
  let previewHovered = $state(false);
  let ctaHovered = $state(false);
  let ctaFocused = $state(false);
  let previewNudged = $state(false);
  let previewTeased = $state(false);
  /** @type {'idle' | 'details' | 'switch' | 'visibility' | null} */
  let previewTeaseReason = $state(null);
  /** @type {ReturnType<typeof setTimeout> | null} */
  let previewNudgeTimer = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let previewTeaseTimer = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let previewSwitchTimer = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let previewIdleTimer = null;
  let hasIdleTeasedOnce = false;
  let wasDocumentHidden = false;
  let spotX = $state(50);
  let spotY = $state(34);

  function clearPreviewTimers() {
    if (previewNudgeTimer) {
      clearTimeout(previewNudgeTimer);
      previewNudgeTimer = null;
    }
    if (previewTeaseTimer) {
      clearTimeout(previewTeaseTimer);
      previewTeaseTimer = null;
    }
    if (previewSwitchTimer) {
      clearTimeout(previewSwitchTimer);
      previewSwitchTimer = null;
    }
    if (previewIdleTimer) {
      clearTimeout(previewIdleTimer);
      previewIdleTimer = null;
    }
  }

  function clearIdleTimer() {
    if (previewIdleTimer) {
      clearTimeout(previewIdleTimer);
      previewIdleTimer = null;
    }
  }

  /**
   * @param {'idle' | 'details' | 'switch' | 'visibility'} reason
   * @param {number} [durationMs]
   */
  function triggerPreviewTease(reason, durationMs = 2400) {
    if (typeof window === "undefined") return;
    if (!showStage || stageMode !== "preview") return;
    if (reason !== "details" && prefersReducedMotion()) return;
    if (previewHovered || ctaHovered || ctaFocused || previewNudged) return;

    clearIdleTimer();
    if (previewTeaseTimer) {
      clearTimeout(previewTeaseTimer);
      previewTeaseTimer = null;
    }
    if (reason === "idle") {
      hasIdleTeasedOnce = true;
    }
    previewTeaseReason = reason;
    previewTeased = true;
    previewTeaseTimer = setTimeout(() => {
      previewTeaseTimer = null;
      previewTeased = false;
      previewTeaseReason = null;
    }, durationMs);
  }

  /** @param {number} delayMs */
  function scheduleIdleTease(delayMs) {
    clearIdleTimer();
    if (typeof window === "undefined") return;
    if (!showStage || stageMode !== "preview" || !stageVisible) return;
    if (typeof document !== "undefined" && document.hidden) return;
    if (prefersReducedMotion()) return;
    if (
      previewHovered ||
      ctaHovered ||
      ctaFocused ||
      previewNudged ||
      previewTeased
    ) {
      return;
    }

    previewIdleTimer = setTimeout(() => {
      previewIdleTimer = null;
      if (
        showStage &&
        stageMode === "preview" &&
        stageVisible &&
        typeof document !== "undefined" &&
        !document.hidden &&
        !previewHovered &&
        !ctaHovered &&
        !ctaFocused &&
        !previewNudged &&
        !previewTeased
      ) {
        triggerPreviewTease("idle", 2500);
      }
    }, delayMs);
  }

  function endHoldSpark(released = false) {
    if (stopHoldSpark) {
      stopHoldSpark(released);
      stopHoldSpark = null;
    } else if (primaryBtnNode) {
      primaryBtnNode.style.setProperty("--spark-charge", "0");
      primaryBtnNode.classList.remove("spark-ready");
    }
  }

  /** @param {PointerEvent & { currentTarget: HTMLAnchorElement }} e */
  function handlePrimaryPointerDown(e) {
    if (e.button && e.button !== 0) return;
    endHoldSpark(false);
    stopHoldSpark = startHoldSpark(e.currentTarget, () => {
      trackEvent("aa_hold_spark_ready", { id: action?.id, surface: variant });
    });
  }

  function invalidatePreviewBounds() {
    previewBounds = null;
  }

  /** @param {PointerEvent & { currentTarget: HTMLDivElement }} e */
  function handlePreviewPointerEnter(e) {
    if (e.pointerType === "touch") return;
    previewBounds = e.currentTarget.getBoundingClientRect();
    previewHovered = true;
  }

  /** @param {PointerEvent & { currentTarget: HTMLDivElement }} e */
  function handlePreviewPointerMove(e) {
    if (e.pointerType !== "touch") {
      previewHovered = true;
    }
    if (!previewBounds) {
      previewBounds = e.currentTarget.getBoundingClientRect();
    }
    const nx = Math.max(
      0,
      Math.min(
        1,
        (e.clientX - previewBounds.left) / Math.max(1, previewBounds.width),
      ),
    );
    const ny = Math.max(
      0,
      Math.min(
        1,
        (e.clientY - previewBounds.top) / Math.max(1, previewBounds.height),
      ),
    );
    spotX = Math.round(nx * 100);
    spotY = Math.round(ny * 100);
  }

  function handlePreviewPointerLeave() {
    previewHovered = false;
    previewBounds = null;
    spotX = 50;
    spotY = 34;
  }

  function handlePreviewNudge() {
    previewNudged = false;
    previewTeased = false;
    previewTeaseReason = null;
    clearIdleTimer();
    if (previewTeaseTimer) {
      clearTimeout(previewTeaseTimer);
      previewTeaseTimer = null;
    }
    if (previewNudgeTimer) clearTimeout(previewNudgeTimer);
    // Re-trigger nudge pulse cleanly even on repeated taps
    if (prefersReducedMotion()) {
      previewNudged = true;
    } else {
      requestAnimationFrame(() => {
        previewNudged = true;
      });
    }
    previewNudgeTimer = setTimeout(() => {
      previewNudgeTimer = null;
      previewNudged = false;
    }, 1600);
  }

  /** @param {Event & { currentTarget: HTMLDetailsElement }} e */
  function handleDetailsToggle(e) {
    if (e.currentTarget.open && stageMode === "preview") {
      if (previewNudgeTimer) {
        clearTimeout(previewNudgeTimer);
        previewNudgeTimer = null;
      }
      previewNudged = false;
      triggerPreviewTease("details", 2400);
    }
  }

  $effect(() => {
    ensurePreviewGestureListeners();
    const currentId = action?.id || null;
    if (currentId !== lastHoldActionId) {
      const hadPreviousAction = lastHoldActionId !== null;
      const now = typeof window !== "undefined" ? Date.now() : 0;
      const recentUserGesture =
        lastUserGestureAt > 0 && now - lastUserGestureAt <= 1200;
      const remountedFromCardSwitch =
        typeof window !== "undefined" &&
        variant === "instant" &&
        !hadPreviousAction &&
        lastInstantPreviewActionId !== null &&
        lastInstantPreviewActionId !== currentId &&
        now - lastInstantPreviewUnmountAt <= CARD_SWITCH_WINDOW_MS;

      if (typeof window !== "undefined" && variant === "instant" && currentId) {
        lastInstantPreviewActionId = currentId;
      }

      lastHoldActionId = currentId;
      lastCelebratedActionId = null;
      kibbleGrams = 0;
      sparkBoosted = false;
      if (hadPreviousAction && detailsEl) {
        detailsEl.open = false;
      }
      endHoldSpark(false);
      clearPreviewTimers();
      previewHovered = false;
      previewBounds = null;
      spotX = 50;
      spotY = 34;
      previewNudged = false;
      previewTeased = false;
      previewTeaseReason = null;
      ctaHovered = false;
      ctaFocused = false;
      hasIdleTeasedOnce = false;

      if (
        typeof window !== "undefined" &&
        variant === "instant" &&
        stageMode === "preview" &&
        recentUserGesture &&
        (hadPreviousAction || remountedFromCardSwitch) &&
        !prefersReducedMotion()
      ) {
        previewSwitchTimer = setTimeout(() => {
          previewSwitchTimer = null;
          triggerPreviewTease("switch", 2200);
        }, 220);
      }
    }
  });

  $effect(() => {
    if (typeof window === "undefined") return;
    if (!showStage || stageMode !== "preview" || !stageNode) {
      stageVisible = true;
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      stageVisible = true;
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        stageVisible = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.35 },
    );
    observer.observe(stageNode);
    return () => {
      observer.disconnect();
    };
  });

  $effect(() => {
    if (typeof document === "undefined") return;
    if (!showStage || stageMode !== "preview") {
      wasDocumentHidden = false;
      return;
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        wasDocumentHidden = true;
        clearIdleTimer();
      } else if (document.visibilityState === "visible" && wasDocumentHidden) {
        wasDocumentHidden = false;
        if (stageVisible && stageMode === "preview") {
          triggerPreviewTease("visibility", 2400);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  });

  $effect(() => {
    const activePreview = showStage && stageMode === "preview";
    const direct = previewHovered || ctaHovered || ctaFocused || previewNudged;
    const teased = previewTeased;
    const visible = stageVisible;
    // Rodič smí samovolnou pobídku podržet, dokud sám kartami listuje (vstupní prohlídka na `/`).
    const lureAllowed = idleLure;

    if (!activePreview) {
      clearIdleTimer();
      if (previewTeaseTimer) {
        clearTimeout(previewTeaseTimer);
        previewTeaseTimer = null;
      }
      if (previewTeased) {
        previewTeased = false;
        previewTeaseReason = null;
      }
      return;
    }

    if (direct) {
      clearIdleTimer();
      if (previewTeaseTimer) {
        clearTimeout(previewTeaseTimer);
        previewTeaseTimer = null;
      }
      if (previewTeased) {
        previewTeased = false;
        previewTeaseReason = null;
      }
      return;
    }

    if (!teased && visible && lureAllowed) {
      scheduleIdleTease(
        hasIdleTeasedOnce ? IDLE_REPEAT_DELAY_MS : IDLE_FIRST_DELAY_MS,
      );
    } else if (!visible || !lureAllowed) {
      clearIdleTimer();
    }
  });

  $effect(() => {
    const completedNow = justCompleted;
    if (completedNow !== prevJustCompleted) {
      prevJustCompleted = completedNow;
      if (completedNow) {
      } else {
        lastCelebratedActionId = null;
      }
    }
  });

  $effect(() => {
    if (justCompleted && action && action.id !== lastCelebratedActionId) {
      lastCelebratedActionId = action.id;
      try {
        safeVibrate(40);
        playCelebrationChord();
      } catch {}
    }
  });

  $effect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("scroll", invalidatePreviewBounds, {
      passive: true,
    });
    window.addEventListener("resize", invalidatePreviewBounds, {
      passive: true,
    });
    return () => {
      window.removeEventListener("scroll", invalidatePreviewBounds);
      window.removeEventListener("resize", invalidatePreviewBounds);
    };
  });

  onDestroy(() => {
    if (typeof window !== "undefined" && variant === "instant") {
      lastInstantPreviewUnmountAt = Date.now();
    }
    endHoldSpark(false);
    clearPreviewTimers();
  });

  /** @param {number} g */
  function handleWeightUpdate(g) {
    kibbleGrams = g;
  }

  /** @param {string[]} ids */
  function getSavedValueLabels(ids) {
    if (!ids || !ids.length) return "";
    return VALUES.filter((/** @type {ValueTopic} */ v) =>
      ids.includes(/** @type {string} */ (v.key || v.id)),
    )
      .map((v) => stripLeadingEmoji(v.label))
      .slice(0, 2)
      .join(", ");
  }

  function triggerEffectSpark() {
    if (!action) return;
    sparkBoosted = true;
    notifyMollySpark(action, { surface: variant });
    if (cardCanvasNode) {
      triggerCanvasBurst(cardCanvasNode, true);
    } else {
      playPayoffAsmr(action);
    }
    trackEvent("aa_effect_preview_toggle", {
      id: action.id,
      open: true,
      surface: variant,
    });
  }

  /**
   * @param {import('$lib/types').MicroAction | null | undefined} act
   * @param {string} [scene]
   * @returns {{ label: string, shortLabel: string, theme: string } | null}
   */
  function getCategoryAura(act, scene = "") {
    if (!act) return null;
    const element = act.element || "";
    const id = act.id || "";
    const values = act.values || [];

    // 1. Přesné určení podle scény a primárního elementu (před fallbackem na sekundární values,
    // aby se např. občanská věda Zooniverse neoznačovala jako „Útulek“)
    if (
      scene === "kibble" ||
      scene === "shelter_care" ||
      id.includes("utulek") ||
      id.includes("utulky") ||
      id.includes("feed")
    ) {
      return {
        label: "Útulek a zvířata",
        shortLabel: "Útulek",
        theme: "animals",
      };
    }
    if (
      scene === "wildlife_rescue" ||
      scene === "birds_glass" ||
      scene === "birds_song" ||
      scene === "butterfly_lens" ||
      element === "animals"
    ) {
      return {
        label: "Ptáci a volná příroda",
        shortLabel: "Volná příroda",
        theme: "wildlife",
      };
    }
    if (element === "knowledge" || element === "science") {
      return {
        label: "Věda a poznání",
        shortLabel: "Poznání",
        theme: "science",
      };
    }
    if (element === "nature") {
      return {
        label: "Příroda a krajina",
        shortLabel: "Příroda",
        theme: "nature",
      };
    }
    if (element === "community") {
      return {
        label: "Blízkost a komunita",
        shortLabel: "Komunita",
        theme: "community",
      };
    }
    if (element === "care") {
      return {
        label: "Zdraví a přímá opora",
        shortLabel: "Péče a opora",
        theme: "care",
      };
    }

    // 2. Fallback pro vlastní nebo minimální záznamy bez elementu
    if (values.includes("animals") || id.includes("zvirata")) {
      return {
        label: "Pomoc zvířatům",
        shortLabel: "Zvířata",
        theme: "animals",
      };
    }
    if (
      values.includes("environment") ||
      values.includes("nature") ||
      values.includes("climate") ||
      id.includes("strom") ||
      id.includes("priroda") ||
      id.includes("ptaci") ||
      id.includes("studank") ||
      id.includes("uklid")
    ) {
      return {
        label: "Příroda a krajina",
        shortLabel: "Příroda",
        theme: "nature",
      };
    }
    if (
      values.includes("science") ||
      values.includes("education") ||
      id.includes("maps") ||
      id.includes("veda") ||
      id.includes("wiki") ||
      id.includes("digital")
    ) {
      return {
        label: "Věda a poznání",
        shortLabel: "Poznání",
        theme: "science",
      };
    }
    if (
      values.includes("community") ||
      values.includes("elderly") ||
      id.includes("knihobudka") ||
      id.includes("senior") ||
      id.includes("soused")
    ) {
      return {
        label: "Blízkost a komunita",
        shortLabel: "Komunita",
        theme: "community",
      };
    }
    if (
      values.includes("health") ||
      values.includes("poverty") ||
      id.includes("zachranka") ||
      id.includes("jidlo") ||
      id.includes("ryze")
    ) {
      return {
        label: "Zdraví a přímá opora",
        shortLabel: "Péče a opora",
        theme: "care",
      };
    }
    return { label: "Dobrý skutek", shortLabel: "Skutek", theme: "default" };
  }

  /** @type {Record<string, { promise: string, status: string }>} */
  const PREVIEW_CUE_BY_ID = {
    zvirata_utulek_online: {
      promise: "Zdarma · přes 1 068 tun krmiva útulkům",
      status: "Připraveno k naplnění",
    },
    donio_utulky: {
      promise: "100 % daru přímo útulku či projektu",
      status: "Bez poplatků · QR platba",
    },
    birdlife_ptaci_pasti: {
      promise: "Bezpečné sklo pro ptáky v tvém okolí",
      status: "Čiré sklo čeká",
    },
    strnadi_nareci: {
      promise: "15 s zpěvu strnada pro české vědce",
      status: "Větev zatím tichá",
    },
    zvire_v_nouzi: {
      promise: "Linka 774 155 155 · 34 stanic v ČR",
      status: "Pohotovost v kapse",
    },
    aplikace_zachranka: {
      promise: "Přesná GPS a mapa AED v kapse",
      status: "Maják připraven",
    },
    darovani_krve: {
      promise: "1 odběr krve pomůže až 3 životům",
      status: "3 srdce čekají",
    },
    kostni_dren: {
      promise: "Zápis do registru dárců kostní dřeně",
      status: "Hledá se shoda",
    },
    daruj_vlasy: {
      promise: "Pramen vlasů na paruku pro pacienty",
      status: "Pramen připraven",
    },
    nevypusť_dusi: {
      promise: "5 kroků první psychické opory",
      status: "Klubko k rozpletení",
    },
    opatruj_se_nudz: {
      promise: "5 min vědecky ověřeného zklidnění mysli",
      status: "Poupě na hladině",
    },
    s_barvou_ven: {
      promise: "Bezpečná opora a přijetí bez předsudků",
      status: "Paprsek před hranolem",
    },
    wikipedie_cz: {
      promise: "1 zpřesněný článek pro tisíce čtenářů",
      status: "Chybí ověřený fakt",
    },
    amnesty_apel: {
      promise: "1 podpis na obranu nespravedlivě vězněných",
      status: "Hlas za svobodu",
    },
    cesko_digital_micro: {
      promise: "Zapojení dovedností do otevřených projektů",
      status: "Uzly před spojením",
    },
    missing_maps: {
      promise: "10 zmapovaných střech pro záchranáře",
      status: "Nezmapované území",
    },
    freerice_ryze: {
      promise: "10 zrnek rýže OSN za každou odpověď",
      status: "Miska OSN čeká",
    },
    zooniverse_veda: {
      promise: "5 snímků z fotopastí a vesmíru pro vědu",
      status: "Hledáček před ostřením",
    },
    ucime_online: {
      promise: "Doučování školáka online z domova",
      status: "Žárovka čeká na jiskru",
    },
    doucujte_cvt: {
      promise: "Pravidelná opora dítěti ve vzdělávání",
      status: "Sešit čeká na tah",
    },
    letters_seniors: {
      promise: "Dopis či rozhovor proti samotě seniorů",
      status: "Zapečetěná obálka",
    },
    moudra_sovicka_mobil: {
      promise: "Trpělivá digitální rada pro seniora",
      status: "Displej bez štítu",
    },
    pamet_naroda_vzpominka: {
      promise: "Příběhy pamětníků, na které se nezapomene",
      status: "Tichý archivní pás",
    },
    knihobudka_kniha: {
      promise: "1 přečtená kniha poslaná dál sousedům",
      status: "Police čeká na knihu",
    },
    nevyhazujto_sousedum: {
      promise: "Druhý život funkční věci zdarma v okolí",
      status: "Balíček u dveří",
    },
    trash_hero_uklid: {
      promise: "5 sebraných odpadků na procházce venku",
      status: "Stezka před úklidem",
    },
    remobil_telefon: {
      promise: "Starý mobil = suroviny + 10 Kč charitě",
      status: "Mobil v šuplíku",
    },
    mapko_kompost: {
      promise: "Slupky z kuchyně zpět do živé půdy",
      status: "Půda čeká na živiny",
    },
    sazime_budoucnost: {
      promise: "Výsadba a péče o stromy v české krajině",
      status: "Sazenička na holině",
    },
    na_ovoce_strom: {
      promise: "Volně rostoucí ovocné stromy bez plýtvání",
      status: "Sad čeká na záznam",
    },
    inaturalist_priroda: {
      promise: "Záznam druhu do mapy české biodiverzity",
      status: "Lupa před ostřením",
    },
    brontosaurus_vikend: {
      promise: "Víkendovka pro přírodu a památky v ČR",
      status: "Ohniště před jiskrou",
    },
    inex_workcamp_cr: {
      promise: "Mezinárodní dobrovolnický miniprojekt v ČR",
      status: "Břehy před spojením",
    },
    estudanky_pramen: {
      promise: "Péče o lesní studánku v národním registru",
      status: "Pramen pod listím",
    },
    potravinova_banka: {
      promise: "Zachráněné porce jídla pro rodiny v nouzi",
      status: "Regál čeká na zásoby",
    },
    nadeje_jidlo: {
      promise: "Teplá polévka a noc v teple pro lidi v nouzi",
      status: "Chladná ulička",
    },
    zachran_jidlo_recept: {
      promise: "Chutná večeře ze surovin bez plýtvání",
      status: "Suroviny na lince",
    },
    nesnezeno_porce: {
      promise: "Zachráněná porce z pekárny či bistra v okolí",
      status: "Před zavíračkou",
    },
    kola_pro_afriku: {
      promise: "Darované kolo zkrátí dětem cestu do školy",
      status: "Kolo čeká ve stínu",
    },
    chodci_sobe: {
      promise: "Nahlášení nebezpečného přechodu či bariéry",
      status: "Bariéra na chodníku",
    },
    epp_pohybem: {
      promise: "Chůze a běh proměněné v body pro projekty",
      status: "Dráha čeká na krok",
    },
    krabice_od_bot: {
      promise: "Vánoční dárek v krabici pro dítě v nouzi",
      status: "Zavázaná krabice",
    },
    dobry_andel: {
      promise: "100 % daru do posledního haléře rodinám",
      status: "Váhy před vyrovnáním",
    },
    charita_dar: {
      promise: "Podpora domácí hospicové a terénní péče",
      status: "Zhasnuté okénko",
    },
    znesnaze21_pribeh: {
      promise: "100 % daru na ověřený příběh člověka",
      status: "Most před spojením",
    },
  };

  /**
   * @param {import('$lib/types').MicroAction | null | undefined} act
   * @param {{ label?: string } | null | undefined} meta
   * @returns {{ promise: string, status: string }}
   */
  function buildPreviewCue(act, meta) {
    if (!act) return { promise: "", status: "" };
    const id = act.id || "";
    const custom = PREVIEW_CUE_BY_ID[id];
    if (custom) return custom;

    const promise = meta?.label || "Ověřený dobrý skutek";
    let status = "Ověřeno · bez účtu";
    if (act.mode === "online" && act.cost === "free") {
      status = "Připraveno · 0 Kč";
    } else if (act.mode === "local") {
      status = "Ověřeno · v okolí";
    }
    return { promise, status };
  }

  /** @param {string | undefined} theme */
  function getCategoryIcon(theme) {
    switch (theme) {
      case "animals":
        return "paw";
      case "wildlife":
        return "bird";
      case "science":
        return "compass";
      case "community":
        return "users";
      case "care":
        return "heart";
      default:
        return "leaf";
    }
  }

  /** @param {string | undefined} theme */
  function getCtaIcon(theme) {
    switch (theme) {
      case "animals":
        return "paw";
      case "wildlife":
        return "bird";
      case "nature":
        return "leaf";
      case "care":
        return "heart";
      default:
        return "sparkles";
    }
  }

  const effectMeta = $derived(
    action
      ? getActionEffectMeta(action, kibbleGrams, {
          isReturnStrip: partnerReturnPromptVisible,
        })
      : null,
  );
  const categoryAura = $derived(getCategoryAura(action, effectMeta?.scene));
  const previewCue = $derived(buildPreviewCue(action, effectMeta));
  const stageMode = $derived(
    justCompleted || partnerReturnPromptVisible
      ? "payoff"
      : isStarted
        ? "active"
        : "preview",
  );
  const showStage = $derived(variant === "instant" || stageMode !== "preview");
  const isDirectPrimed = $derived(
    stageMode === "preview" &&
      (previewHovered || ctaHovered || ctaFocused || previewNudged),
  );
  const isStageTeased = $derived(
    stageMode === "preview" && !isDirectPrimed && previewTeased,
  );
  const previewLureState = $derived(
    stageMode !== "preview"
      ? "inactive"
      : previewNudged
        ? "tap"
        : previewHovered || ctaHovered
          ? "hover"
          : ctaFocused
            ? "focus"
            : previewTeased && previewTeaseReason
              ? previewTeaseReason
              : "rest",
  );
  const actionTitle = $derived(action ? cleanTitle(action.title) : "");
</script>

{#if action}
  <article
    id={action ? `online-card-${action.id}` : undefined}
    class="action-card card instant-body {className}"
    class:directory-card={variant === "directory"}
    class:has-preview-stage={showStage && stageMode === "preview"}
    class:spotlight
    class:done-card={isCompleted}
    class:is-done={isCompleted}
    data-category-theme={categoryAura?.theme || "default"}
  >
    <!-- 1. Standardizovaná hlavička: Kategorie · Čas · Cena · Režim -->
    <div class="action-meta-line card-meta-top">
      {#if categoryAura}
        <span
          class="category-aura-chip category-aura-{categoryAura.theme}"
          aria-label="Kategorie: {categoryAura.label}"
        >
          <span class="category-aura-icon" aria-hidden="true">
            <AppIcon
              name={getCategoryIcon(categoryAura.theme)}
              size={12}
              strokeWidth={2.1}
            />
          </span>
          <span class="category-aura-label">{categoryAura.shortLabel}</span>
        </span>
      {/if}
      <span class="quick-tags-pill quick-tags-inline">
        {action.quickTagsLabel || "2 min · Zdarma · Online"}
      </span>
      {#if isCompleted}
        <span class="done-dot done-inline">
          <AppIcon name="check" size={12} strokeWidth={2.4} />
          <span>Splněno</span>
        </span>
      {/if}
    </div>

    {#if savedValues && savedValues.length > 0 && onTogglePersonalValues}
      <div class="card-personal-row">
        <button
          type="button"
          class="personal-values-pill"
          class:active={usePersonalValues}
          onclick={onTogglePersonalValues}
          title="Přizpůsobit podle témat vybraných v průvodci"
        >
          <AppIcon
            name={usePersonalValues ? "sparkles" : "target"}
            size={13}
            strokeWidth={2}
          />
          <span>
            {usePersonalValues
              ? `Tvoje témata (${getSavedValueLabels(savedValues)})`
              : "Moje témata"}
          </span>
        </button>
      </div>
    {/if}

    <!-- 2.–3. Název příležitosti a jasné vysvětlení jednoho konkrétního skutku.
         Obal drží na `/` stálou výšku textu, aby scéna a CTA pod ním neskákaly mezi kartami. -->
    <div class="action-copy">
      <h2 class="action-title card-title rec-title">{actionTitle}</h2>
      <p class="action-desc card-desc rec-desc">{action.desc}</p>
    </div>

    <!-- 3b. Jednotná živá scéna proměny Před -> Po (preview -> active -> payoff bez skoku layoutu) -->
    {#if showStage}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        bind:this={stageNode}
        class="deed-stage"
        class:deed-preview-stage={stageMode === "preview"}
        class:card-effect-stage={stageMode === "active"}
        class:is-payoff={stageMode === "payoff"}
        class:is-primed={isDirectPrimed}
        class:is-teased={isStageTeased}
        class:is-nudged={stageMode === "preview" && previewNudged}
        data-stage-mode={stageMode}
        data-preview-lure={previewLureState}
        data-scene={effectMeta?.scene || "default"}
        style={stageMode === "preview"
          ? `--spot-x: ${spotX}%; --spot-y: ${spotY}%;`
          : undefined}
        onpointerenter={(e) => {
          if (stageMode === "preview") handlePreviewPointerEnter(e);
        }}
        onpointermove={(e) => {
          if (stageMode === "preview") handlePreviewPointerMove(e);
        }}
        onpointerleave={() => {
          if (stageMode === "preview") handlePreviewPointerLeave();
        }}
        onpointercancel={() => {
          if (stageMode === "preview") handlePreviewPointerLeave();
        }}
        onclick={() => {
          if (stageMode === "preview") handlePreviewNudge();
        }}
      >
        {#if stageMode === "preview"}
          <div class="preview-hud">
            <span class="preview-promise-pill">
              <AppIcon
                name={effectMeta?.icon || "sparkles"}
                size={13}
                strokeWidth={2.1}
                class="preview-promise-spark"
              />
              <span>{previewCue.promise}</span>
            </span>
            <span
              class="preview-status-pill"
              class:nudged={previewNudged}
              class:primed-hint={isDirectPrimed && !previewNudged}
              class:teased={isStageTeased}
            >
              <span class="preview-status-dot" aria-hidden="true"></span>
              {#if previewNudged}
                <AppIcon name="arrow-down" size={12} strokeWidth={2.2} />
                <span>Klikni níže — scéna ožije</span>
              {:else if isDirectPrimed}
                <span>Po splnění scéna ožije</span>
              {:else if isStageTeased}
                <span>Po akci se scéna promění</span>
              {:else}
                <span>{previewCue.status}</span>
              {/if}
            </span>
          </div>
        {:else if stageMode === "active"}
          <div class="card-effect-head">
            {#if effectMeta?.badge}
              <span class="impact-payoff-badge">
                <AppIcon
                  name={effectMeta?.icon || "sparkles"}
                  size={13}
                  strokeWidth={2.1}
                />
                <span>{effectMeta.badge}</span>
              </span>
            {/if}
            <div class="card-effect-controls">
              <button
                type="button"
                class="effect-spark-btn"
                class:active={sparkBoosted}
                onclick={triggerEffectSpark}
                aria-pressed={sparkBoosted}
                aria-label="Jemná vizualizace proměny dopadu"
                title="Přehrát vizualizaci proměny"
              >
                <AppIcon name="sparkles" size={13} strokeWidth={2.1} />
                <span>Přehrát</span>
              </button>
              {#if onToggleSound}
                <button
                  type="button"
                  class="sound-mute-btn"
                  onclick={onToggleSound}
                  aria-pressed={soundMuted}
                  aria-label={soundMuted
                    ? "Zapnout jemné zvuky"
                    : "Ztlumit zvuky"}
                  title={soundMuted ? "Zapnout jemné zvuky" : "Ztlumit zvuky"}
                >
                  <AppIcon
                    name={soundMuted ? "volume-x" : "volume-2"}
                    size={15}
                    strokeWidth={2.1}
                  />
                </button>
              {/if}
            </div>
          </div>
        {:else}
          <div class="card-effect-head payoff-head">
            <span class="payoff-kicker">
              <AppIcon name="sparkles" size={13} strokeWidth={2.1} />
              <span>
                {justCompleted
                  ? "Skvělá práce! Dobrý skutek je hotový"
                  : "Vítej zpět! Povedlo se ti dokončit skutek u partnera?"}
              </span>
            </span>
            {#if justCompleted ? effectMeta?.badge : effectMeta?.returnBadge || effectMeta?.badge}
              <span class="impact-payoff-badge">
                <AppIcon
                  name={effectMeta?.icon || "sparkles"}
                  size={13}
                  strokeWidth={2.1}
                />
                <span>
                  {justCompleted
                    ? effectMeta?.badge
                    : effectMeta?.returnBadge || effectMeta?.badge}
                </span>
              </span>
            {/if}
          </div>
        {/if}

        <canvas
          bind:this={cardCanvasNode}
          class="stage-canvas"
          class:preview-diorama-canvas={stageMode === "preview"}
          class:impact-payoff-canvas={stageMode !== "preview"}
          width="380"
          height="92"
          use:impactCanvas={{
            action,
            preview: stageMode === "preview",
            primed: isDirectPrimed,
            teased: isStageTeased,
            climax: stageMode === "payoff",
            silent: stageMode === "preview",
            onWeightUpdate: handleWeightUpdate,
          }}
          aria-hidden={stageMode === "preview" ? "true" : undefined}
          aria-label={stageMode !== "preview"
            ? "Fyzikální vizualizace dopadu dobrého skutku"
            : undefined}
        ></canvas>
      </div>
    {/if}

    <!-- 4. Přínos (v katalogu viditelný přímo; na instant kartě výhradně v detailu bez duplicity) -->
    {#if variant === "directory"}
      <div class="action-impact-summary card-impact-box rec-impact-block">
        <div class="impact-benefit-line card-benefit-line rec-impact-line">
          <strong>Co to přinese:</strong>
          <span>{action.concreteImpact || action.selfBenefit}</span>
        </div>
      </div>
    {/if}

    <!-- 5. Sekundární metadata výhradně v rozbalovacím detailu -->
    <details
      class="how-toggle steps-inline"
      bind:this={detailsEl}
      ontoggle={handleDetailsToggle}
    >
      <summary>
        <AppIcon
          name="chevron-right"
          size={14}
          strokeWidth={2.3}
          class="how-toggle-chevron"
        />
        <AppIcon name="info" size={14} strokeWidth={2.1} />
        <span
          >Jak to funguje ({action.steps?.length
            ? `${action.steps.length} ${action.steps.length === 1 ? "krok" : action.steps.length < 5 ? "kroky" : "kroků"}`
            : "důkazy a partner"})</span
        >
      </summary>
      <div class="how-details-content">
        <div class="detail-evidence-line">
          <EvidenceBadge
            tier={action.impactEvidence || "B"}
            variant={variant === "directory" ? "card" : "pill"}
            className="card-evidence-badge rec-evidence-pill evidence-pill"
          />
        </div>
        <div class="partner-trust-line card-partner-line rec-partner-line">
          <span>
            {action.registrationRequired
              ? "Krátká registrace u partnera"
              : "Bez registrace na našem webu"}
          </span>
          <span>·</span>
          <span>Aktivita probíhá u <strong>{action.org}</strong></span>
        </div>
        {#if variant !== "directory"}
          <div class="impact-benefit-line detail-impact-line">
            <strong>Co to přinese:</strong>
            <span>{action.concreteImpact || action.selfBenefit}</span>
          </div>
        {/if}
        {#if action.steps?.length}
          <ol class="how-steps clean-steps">
            {#each action.steps as step}
              <li>{step}</li>
            {/each}
          </ol>
        {/if}
        {#if action.impactChain}
          <div class="impact-chain-row rec-impact-chain card-chain-line">
            <span><strong>Aktivita:</strong> {action.impactChain.activity}</span
            >
            <span class="chain-arrow chain-sep" aria-hidden="true">
              <AppIcon name="arrow-right" size={12} strokeWidth={2.2} />
            </span>
            <span
              ><strong>Výsledek:</strong>
              {action.impactChain.immediateOutput}</span
            >
            <span class="chain-arrow chain-sep" aria-hidden="true">
              <AppIcon name="arrow-right" size={12} strokeWidth={2.2} />
            </span>
            <span
              ><strong>Skutečný dopad:</strong>
              {action.impactChain.realImpact}</span
            >
          </div>
        {/if}
        <div
          class="action-verify-footer card-verify-footer rec-verify-footer mobile-details-extra"
        >
          <span class="verify-meta mde-verify">
            Ověřeno: <strong>{action.verifiedLabel}</strong> · Zdroj:
            <a
              href={action.sourceUrl || action.url}
              target="_blank"
              rel="noopener noreferrer"
              class="verify-source-link card-source-link rec-source-link"
            >
              <span>{action.org}</span>
              <AppIcon name="arrow-up-right" size={12} strokeWidth={2.2} />
            </a>
          </span>
          <div
            class="verify-footer-actions card-footer-actions rec-footer-btns mde-row"
          >
            {#if onShare}
              <button
                type="button"
                class="direct-link-share-btn mde-share-btn card-broken-btn rec-broken-btn"
                onclick={() => onShare(action)}
                title="Zkopírovat přímý odkaz na tento skutek pro sdílení v diskuzi nebo zprávě"
              >
                <AppIcon
                  name={copiedDirectLink ? "check" : "share-2"}
                  size={13}
                  strokeWidth={2.1}
                />
                <span
                  >{copiedDirectLink
                    ? "Odkaz zkopírován"
                    : "Sdílet odkaz"}</span
                >
              </button>
            {/if}
            <button
              type="button"
              class="broken-link-btn mde-broken-btn card-broken-btn rec-broken-btn"
              onclick={() => {
                if (onReportBroken) onReportBroken(action);
                else
                  openBrokenLinkReport({
                    id: action.id,
                    title: actionTitle,
                    org: action.org,
                    url: action.url,
                  });
              }}
            >
              Nahlásit chybu
            </button>
          </div>
        </div>
      </div>
    </details>

    <!-- 6. In-situ oslava a odměna po dokončení nebo návratu od partnera (bez duplicitního plátna a nadpisu) -->
    {#if justCompleted}
      <div
        class="celebration-card inline-celebration-card in-situ-celebration"
        role="status"
        aria-live="polite"
        data-scene={effectMeta?.scene || "default"}
      >
        <div class="in-situ-affirmation">
          <AppIcon
            name="sparkles"
            size={14}
            strokeWidth={2.1}
            class="affirmation-icon"
          />
          <span>
            <strong>Dnes už tvůj dobrý skutek pomáhá.</strong> Můžeš pokračovat dalším
            drobným skutkem, nebo si pro dnešek s klidem odpočinout.
          </span>
        </div>
        <div class="molly-celebration-note">
          <AppIcon
            name="paw"
            size={13}
            class="badge-paw-svg molly-note-paw-svg"
          />
          <strong>Molly děkuje.</strong> Tvůj skutek teď svítí v <a href="/svet" class="molly-svet-inline-link">Krajině dobra</a>.
        </div>
        <div class="return-dopamine-actions in-situ-actions">
          {#if onCloseSession}
            <button
              type="button"
              class="return-dopamine-btn btn-session-close"
              onclick={onCloseSession}
              aria-label="Pro dnešek hotovo — odpočinout si"
            >
              <AppIcon name="leaf" size={14} strokeWidth={2.1} />
              <span>Pro dnešek hotovo</span>
            </button>
          {/if}
          {#if onNextIdea}
            <button
              type="button"
              class="return-dopamine-btn btn-next-deed inline-celebration-next"
              onclick={onNextIdea}
              aria-label="Ukázat další doporučený skutek"
            >
              <span>Další dobrý skutek</span>
              <AppIcon name="arrow-right" size={14} strokeWidth={2.2} />
            </button>
          {/if}
        </div>
      </div>
    {:else if partnerReturnPromptVisible}
      <div
        class="return-dopamine-strip in-situ-strip"
        role="status"
        aria-live="polite"
        data-scene={effectMeta?.scene || "default"}
      >
        <div class="in-situ-affirmation">
          <AppIcon
            name="leaf"
            size={14}
            strokeWidth={2.1}
            class="affirmation-icon"
          />
          <span>Každý drobný krok má skutečný význam.</span>
        </div>
        <div class="return-dopamine-actions in-situ-actions">
          <button
            type="button"
            class="return-dopamine-btn btn-return-complete"
            onclick={() => onComplete && onComplete(action)}
          >
            <AppIcon name="check" size={14} strokeWidth={2.4} />
            <span>Ano, mám hotovo</span>
          </button>
          {#if onCloseSession}
            <button
              type="button"
              class="btn-session-close return-dopamine-svet-link"
              onclick={onCloseSession}
              aria-label="Pro dnešek hotovo — odpočinout si"
            >
              <AppIcon name="leaf" size={14} strokeWidth={2.1} />
              <span>Pro dnešek hotovo</span>
            </button>
          {:else if onDismissReturn}
            <button
              type="button"
              class="btn-return-dismiss return-dopamine-svet-link"
              onclick={onDismissReturn}
            >
              Později
            </button>
          {/if}
        </div>
      </div>
    {/if}

    {#if !justCompleted}
      <div class="instant-actions actions-row cta-row">
        <a
          bind:this={primaryBtnNode}
          href={action.url}
          target={action.url?.startsWith("tel:") ||
          action.url?.startsWith("mailto:")
            ? undefined
            : "_blank"}
          rel={action.url?.startsWith("tel:") ||
          action.url?.startsWith("mailto:")
            ? undefined
            : "noopener noreferrer"}
          class="btn-studio-primary btn-gold-action cta primary"
          class:cta-nudged={previewNudged}
          data-hold-spark="true"
          data-molly-guide="true"
          onpointerenter={(e) => {
            if (e.pointerType !== "touch") ctaHovered = true;
          }}
          onfocus={(e) => {
            if (e.currentTarget.matches?.(":focus-visible")) ctaFocused = true;
          }}
          onblur={() => {
            ctaFocused = false;
          }}
          onpointerdown={handlePrimaryPointerDown}
          onpointerup={() => endHoldSpark(true)}
          onpointerleave={() => {
            ctaHovered = false;
            endHoldSpark(false);
          }}
          onpointercancel={() => {
            ctaHovered = false;
            endHoldSpark(false);
          }}
          onclick={() => {
            endHoldSpark(true);
            if (onStart) onStart(action);
          }}
        >
          <AppIcon
            name={getCtaIcon(categoryAura?.theme)}
            size={16}
            strokeWidth={2.1}
            class="cta-lead-icon"
          />
          <span
            >{action.id === "zvirata_utulek_online"
              ? "Nakrmit útulek teď"
              : action.cta || "Začít pomáhat"}</span
          >
          <AppIcon
            name="arrow-up-right"
            size={15}
            strokeWidth={2.3}
            class="cta-arrow-icon"
          />
        </a>

        {#if isStarted && !partnerReturnPromptVisible}
          <button
            type="button"
            class="btn-studio-done btn-done-action cta secondary done-btn"
            class:initiated={isStarted}
            onclick={() => onComplete && onComplete(action)}
          >
            <AppIcon name="check" size={15} strokeWidth={2.5} />
            <span>{action.doneCta || "Mám hotovo"}</span>
          </button>
        {/if}
      </div>
    {/if}
  </article>
{/if}

<style>
  .instant-body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    max-width: 100%;
  }

  .action-card.directory-card {
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-forest, #c5d9cd);
    border-radius: 20px;
    padding: 1.15rem 1.1rem;
    box-shadow:
      0 2px 10px -2px rgba(20, 40, 29, 0.06),
      0 1px 3px rgba(20, 40, 29, 0.04);
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease;
  }

  .action-card.directory-card:hover {
    border-color: var(--border-forest-strong, #a7c4b3);
    box-shadow:
      0 10px 24px -8px rgba(20, 40, 29, 0.12),
      0 2px 6px rgba(27, 94, 66, 0.06);
  }

  .action-card.directory-card.spotlight {
    border-color: var(--accent-warm, #b8651b);
    box-shadow:
      0 0 0 3px rgba(184, 101, 27, 0.2),
      0 12px 26px -8px rgba(20, 40, 29, 0.14);
  }

  /* =========================================================================
     ŽIVÁ SCÉNA OČEKÁVÁNÍ (UNIFIED RADIANT SANCTUARY DIORAMA + NON-OVERLAPPING HUD)
     ========================================================================= */
  .deed-preview-stage {
    --spot-x: 50%;
    --spot-y: 34%;
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: auto;
    margin: 0.2rem 0 0.55rem 0;
    border-radius: 14px;
    overflow: hidden;
    cursor: default;
    user-select: none;
    background: radial-gradient(
        82% 88% at 50% 24%,
        rgba(246, 231, 193, 0.08) 0%,
        rgba(37, 111, 78, 0.14) 44%,
        transparent 74%
      ),
      linear-gradient(180deg, #1b362b 0%, #132920 56%, #0c1d16 100%);
    border: 1px solid rgba(197, 217, 205, 0.32);
    box-shadow:
      0 2px 10px -4px rgba(10, 29, 20, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
    transition:
      border-color 0.24s ease,
      box-shadow 0.24s ease,
      transform 0.22s ease;
  }

  .deed-preview-stage::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: radial-gradient(
      165px 110px at var(--spot-x) var(--spot-y),
      rgba(253, 230, 138, 0.22) 0%,
      rgba(251, 191, 36, 0.08) 48%,
      transparent 100%
    );
    opacity: 0;
    transition: opacity 0.24s ease;
  }

  .deed-preview-stage.is-primed {
    border-color: rgba(253, 230, 138, 0.54);
    box-shadow:
      0 6px 18px -6px rgba(180, 120, 16, 0.22),
      0 0 0 1px rgba(251, 191, 36, 0.2),
      inset 0 1px 0 rgba(254, 243, 199, 0.24);
  }

  .deed-preview-stage.is-primed::after {
    opacity: 1;
  }

  .deed-preview-stage.is-teased:not(.is-primed) {
    border-color: rgba(246, 231, 193, 0.44);
    box-shadow:
      0 4px 14px -6px rgba(180, 120, 16, 0.16),
      inset 0 1px 0 rgba(254, 243, 199, 0.18);
  }

  .deed-preview-stage.is-nudged {
    transform: scale(0.994);
  }

  @media (prefers-reduced-motion: reduce) {
    .deed-preview-stage,
    .deed-preview-stage::after,
    .preview-status-pill,
    .preview-status-dot {
      transition: none;
    }

    .deed-preview-stage.is-nudged {
      transform: none;
    }
  }

  .preview-hud {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.55rem;
    padding: 0.44rem 0.72rem 0.34rem;
    background: transparent;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    pointer-events: none;
  }

  .preview-promise-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.34rem;
    min-width: 0;
    max-width: 66%;
    padding: 0;
    border-radius: 0;
    background: transparent;
    border: none;
    color: #f6e7c1;
    font-size: 0.74rem;
    font-weight: 600;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview-promise-pill > span:last-child,
  .preview-status-pill > span:last-child,
  .personal-values-pill > span:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .deed-preview-stage :global(.preview-promise-spark) {
    color: #e6c686;
    flex-shrink: 0;
  }

  .preview-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    flex-shrink: 0;
    min-width: 0;
    max-width: 52%;
    padding: 0;
    border-radius: 0;
    background: transparent;
    border: none;
    color: #d6e4dc;
    font-size: 0.7rem;
    font-weight: 600;
    line-height: 1.25;
    white-space: nowrap;
    transition: color 0.22s ease;
  }

  .preview-status-pill.nudged,
  .preview-status-pill.primed-hint,
  .preview-status-pill.teased {
    background: transparent;
    border: none;
    color: #f6e7c1;
  }

  .preview-status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #a7c4b3;
    box-shadow: none;
    flex-shrink: 0;
    transition: background-color 0.22s ease, box-shadow 0.22s ease;
  }

  .preview-status-pill.nudged .preview-status-dot,
  .preview-status-pill.primed-hint .preview-status-dot,
  .preview-status-pill.teased .preview-status-dot {
    background: #f6e7c1;
    box-shadow: 0 0 6px rgba(246, 231, 193, 0.55);
  }

  .preview-diorama-canvas {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    height: 92px;
    background: transparent;
    pointer-events: none;
  }

  /* =========================================================================
     HLAVIČKA KARTY A OBSAH
     ========================================================================= */
  .action-meta-line {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: nowrap;
    overflow: hidden;
    font-size: 0.78rem;
    color: var(--ink-muted, #516659);
    margin-bottom: 0.38rem;
  }

  .card-personal-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 0.38rem;
  }

  .quick-tags-pill {
    display: block;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: var(--bohemian-sage, #eef5f0);
    border: 1px solid var(--border-forest, #c5d9cd);
    color: var(--accent-primary, #1b5e42);
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 0.005em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .directory-card .action-meta-line {
    gap: 0.24rem;
  }

  .directory-card .category-aura-chip {
    padding: 0.15rem 0.42rem;
    font-size: 0.67rem;
    letter-spacing: 0;
  }

  .directory-card .quick-tags-pill {
    padding: 0.14rem 0.36rem;
    font-size: 0.65rem;
    letter-spacing: 0;
  }

  .done-dot {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    color: var(--accent-primary, #1b5e42);
    font-weight: 700;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .category-aura-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.26rem;
    padding: 0.2rem 0.58rem;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.01em;
    line-height: 1.2;
    white-space: nowrap;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .category-aura-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    flex-shrink: 0;
  }

  .category-aura-animals {
    background: var(--accent-warm-tint, #fef6e8);
    border: 1px solid rgba(184, 101, 27, 0.32);
    color: var(--accent-warm-ink, #8f4b0e);
  }

  .category-aura-wildlife {
    background: var(--bohemian-mist, #e6f0ea);
    border: 1px solid var(--border-forest, #c5d9cd);
    color: var(--czech-forest, #1d5c40);
  }

  .category-aura-nature {
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-strong, #c2cec5);
    color: var(--accent-primary, #1b5e42);
  }

  .category-aura-science {
    background: var(--forest-brook-tint, #eaf2f4);
    border: 1px solid var(--forest-brook-border, #b8cfd6);
    color: var(--forest-brook-ink, #1d4f5f);
  }

  .category-aura-community {
    background: var(--moss-olive-tint, #f2f5e9);
    border: 1px solid var(--moss-olive-border, #cad4b0);
    color: var(--moss-olive-ink, #4a5926);
  }

  .category-aura-care {
    background: var(--rowan-tint, #fbf0ed);
    border: 1px solid var(--rowan-border, #e5c1b8);
    color: var(--rowan-ink, #8a3b2c);
  }

  .category-aura-default {
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    color: var(--accent-primary, #1b5e42);
  }

  .personal-values-pill {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    font-family: var(--font-sans);
    font-size: 0.76rem;
    font-weight: 700;
    min-height: 44px;
    min-width: 44px;
    padding: 0.35rem 0.78rem;
    gap: 0.32rem;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    cursor: pointer;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease,
      color 0.16s ease;
  }

  .personal-values-pill.active {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    border-color: var(--accent-primary, #1b5e42);
  }

  .action-copy {
    --copy-title-size: 1.28rem;
    --copy-title-leading: 1.24;
    --copy-title-gap: 0.4rem;
    --copy-desc-size: 0.93rem;
    --copy-desc-leading: 1.54;
    --copy-desc-gap: 0.5rem;
    display: flow-root;
    min-width: 0;
  }

  .action-title {
    font-weight: 800;
    font-size: var(--copy-title-size);
    line-height: var(--copy-title-leading);
    letter-spacing: -0.022em;
    color: var(--ink-primary, #14281d);
    margin: 0 0 var(--copy-title-gap) 0;
  }

  .action-desc {
    color: var(--ink-secondary, #3f574a);
    font-size: var(--copy-desc-size);
    line-height: var(--copy-desc-leading);
    margin: 0 0 var(--copy-desc-gap) 0;
  }

  /* Karta vedle hero textu (desktop, tablet na šířku): text karty má na `/` vyhrazené
     místo pro dvouřádkový nadpis a třířádkový popis. Scéna, CTA i stránkování pod ním
     tak stojí na místě, ať se karta vymění ručně, nebo při vstupní prohlídce režimů. */
  @media (min-width: 920px) {
    :global(.instant-card) .action-copy {
      min-height: calc(
        2 * var(--copy-title-leading) * var(--copy-title-size) + var(--copy-title-gap) + 3 *
          var(--copy-desc-leading) * var(--copy-desc-size) + var(--copy-desc-gap)
      );
    }
  }

  .action-impact-summary {
    margin: 0 0 0.75rem 0;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-subtle, #dce3dd);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.84rem;
    line-height: 1.48;
  }

  .directory-card .action-impact-summary {
    margin: 0 0 0.65rem 0;
    padding: 0.48rem 0.65rem;
    border-radius: 12px;
    background: var(--bohemian-sage, #eef5f0);
    border: 1px solid var(--border-forest, #c5d9cd);
  }

  .impact-benefit-line {
    color: var(--ink-primary, #14281d);
  }

  .impact-benefit-line strong {
    color: var(--accent-primary, #1b5e42);
    margin-right: 0.25rem;
  }

  .detail-evidence-line {
    margin-bottom: 0.15rem;
  }

  .detail-impact-line {
    font-size: 0.79rem;
    line-height: 1.42;
    padding: 0.42rem 0.6rem;
    border-radius: 10px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
  }

  .partner-trust-line {
    display: block;
    font-size: 0.78rem;
    line-height: 1.44;
    color: var(--ink-muted, #516659);
  }

  .partner-trust-line > span + span {
    margin-left: 0.25rem;
  }

  .partner-trust-line strong {
    color: var(--ink-primary, #14281d);
    font-weight: 700;
  }

  .how-toggle {
    margin: 0 0 0.45rem 0;
    font-size: 0.83rem;
    color: var(--ink-secondary, #3f574a);
  }

  .how-toggle summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--accent-primary, #1b5e42);
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.35rem 0.25rem;
    box-sizing: border-box;
    border-radius: 8px;
    transition: color 0.16s ease;
  }

  .how-toggle summary:hover {
    color: var(--accent-primary-hover, #144732);
  }

  .how-toggle summary::-webkit-details-marker {
    display: none;
  }

  .how-toggle summary :global(.how-toggle-chevron) {
    color: var(--accent-primary, #1b5e42);
    transition: transform 0.18s ease;
  }

  .how-toggle[open] summary :global(.how-toggle-chevron) {
    transform: rotate(90deg);
  }

  .how-steps {
    margin: 0.35rem 0 0 1.2rem;
    padding: 0;
    line-height: 1.5;
    color: var(--ink-secondary, #3f574a);
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
  }

  .impact-chain-row {
    margin-top: 0.45rem;
    padding-top: 0.45rem;
    border-top: 1px dashed var(--border-strong, #c2cec5);
    display: block;
    font-size: 0.78rem;
    line-height: 1.48;
    color: var(--ink-secondary, #3f574a);
  }

  .chain-arrow {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    margin: 0 0.22rem;
    color: var(--accent-primary, #1b5e42);
  }

  .how-details-content {
    display: flex;
    flex-direction: column;
    gap: 0.48rem;
    margin-top: 0.35rem;
    padding: 0.7rem 0.8rem;
    border-radius: 14px;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    font-size: 0.8rem;
    line-height: 1.42;
  }

  /* =========================================================================
     PRIMÁRNÍ AKČNÍ TLAČÍTKO A HOLD-TO-SPARK ODEZVA
     ========================================================================= */
  .instant-actions {
    display: flex;
    gap: 0.55rem;
    align-items: center;
    padding-top: 0.15rem;
  }

  .btn-studio-primary {
    --spark-charge: 0;
    position: relative;
    overflow: hidden;
    isolation: isolate;
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 48px;
    padding: 0.8rem 1.15rem;
    box-sizing: border-box;
    border-radius: 14px;
    background: linear-gradient(
      135deg,
      var(--czech-forest-hover, #164932) 0%,
      var(--accent-primary, #1b5e42) 52%,
      var(--czech-forest, #1d5c40) 100%
    );
    border: 1px solid rgba(216, 235, 224, 0.34);
    color: #ffffff;
    font-weight: 800;
    font-size: 0.95rem;
    letter-spacing: -0.01em;
    text-decoration: none;
    box-shadow:
      0 10px 24px -6px rgba(14, 56, 38, 0.38),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease,
      transform 0.16s ease,
      box-shadow 0.18s ease;
  }

  .btn-studio-primary::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(
      90deg,
      rgba(37, 111, 78, 0.42),
      rgba(251, 191, 36, 0.42)
    );
    transform-origin: left center;
    transform: scaleX(var(--spark-charge, 0));
    transition: transform 0.06s linear;
    pointer-events: none;
  }

  .btn-studio-primary:hover {
    transform: translateY(-1.5px);
    border-color: rgba(251, 191, 36, 0.58);
    box-shadow:
      0 14px 30px -6px rgba(14, 56, 38, 0.48),
      0 0 0 1px rgba(251, 191, 36, 0.36),
      inset 0 1px 0 rgba(255, 255, 255, 0.24);
  }

  .btn-studio-primary:active {
    transform: scale(0.985);
  }

  .btn-studio-primary.cta-nudged,
  :global(.btn-studio-primary.spark-ready) {
    box-shadow:
      0 14px 28px -4px rgba(27, 94, 66, 0.34),
      0 0 0 3px rgba(184, 101, 27, 0.55);
  }

  .btn-studio-primary :global(.cta-lead-icon) {
    color: var(--hero-dawn, #fef3c7);
    flex-shrink: 0;
  }

  .btn-studio-primary :global(.cta-arrow-icon) {
    color: #d8ebe0;
    flex-shrink: 0;
    transition:
      transform 0.18s ease,
      color 0.18s ease;
  }

  .btn-studio-primary:hover :global(.cta-arrow-icon) {
    transform: translate(2px, -2px);
    color: var(--hero-dawn, #fef3c7);
  }

  .btn-studio-done {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.38rem;
    min-height: 48px;
    padding: 0.8rem 1rem;
    box-sizing: border-box;
    border-radius: 14px;
    border: 1px solid var(--accent-primary, #1b5e42);
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    transition:
      background-color 0.18s ease,
      color 0.18s ease;
  }

  .btn-studio-done.initiated {
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    border: 1.5px solid var(--accent-primary, #1b5e42);
  }

  .btn-studio-done:hover {
    background: var(--bohemian-mist, #e6f0ea);
    color: var(--ink-primary, #14281d);
    border-color: var(--accent-primary, #1b5e42);
  }

  /* =========================================================================
     FYZIKÁLNÍ SCÉNA DOPADU A IN-SITU OSLAVA (DAYLIGHT EDITORIAL)
     ========================================================================= */
  .card-effect-stage,
  .deed-stage.is-payoff {
    position: relative;
    margin: 0 0 0.65rem 0;
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
    background: linear-gradient(180deg, #1b362b 0%, #132920 56%, #0c1d16 100%);
    border: 1px solid rgba(197, 217, 205, 0.36);
    color: #f6f7f3;
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.08));
  }

  .card-effect-head {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    padding: 0.26rem 0.56rem;
    background: rgba(10, 26, 19, 0.44);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .payoff-head {
    flex-wrap: wrap;
    padding: 0.36rem 0.62rem 0.3rem;
    background: rgba(10, 26, 19, 0.42);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .payoff-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    color: #f6e7c1;
  }

  .card-effect-controls {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
  }

  .deed-stage .impact-payoff-badge {
    background: rgba(254, 243, 199, 0.14);
    color: #fef3c7;
    border: 1px solid rgba(254, 243, 199, 0.3);
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .effect-spark-btn,
  .sound-mute-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.26rem;
    padding: 0.34rem 0.72rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    border-radius: 999px;
    border: 1px solid rgba(254, 243, 199, 0.3);
    background: rgba(255, 255, 255, 0.12);
    color: #fef3c7;
    font-family: var(--font-sans);
    font-size: 0.73rem;
    font-weight: 700;
    line-height: 1.2;
    cursor: pointer;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease,
      color 0.16s ease;
    white-space: nowrap;
  }

  .effect-spark-btn:hover,
  .effect-spark-btn.active,
  .sound-mute-btn:hover {
    background: rgba(254, 243, 199, 0.24);
    color: #ffffff;
    border-color: rgba(254, 243, 199, 0.56);
  }

  .deed-stage .stage-canvas {
    display: block;
    width: 100%;
    max-width: 100%;
    height: 92px;
    border: none;
    border-radius: 0;
  }

  .deed-stage .impact-payoff-canvas {
    background: #14281d;
    cursor: pointer;
    touch-action: manipulation;
  }

  .celebration-card,
  .return-dopamine-strip {
    display: flex;
    flex-direction: column;
    gap: 0.42rem;
    margin-top: 0.35rem;
    margin-bottom: 0.25rem;
    padding: 0;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    color: var(--ink-primary, #14281d);
    font-size: 0.84rem;
    line-height: 1.4;
    scroll-margin-top: 75px;
    scroll-margin-bottom: 75px;
  }

  .directory-card .celebration-card,
  .directory-card .return-dopamine-strip {
    padding-top: 0.35rem;
    border-top: 1px solid var(--border-subtle, #dce3dd);
  }

  .directory-card > .instant-actions {
    order: 4;
    margin-top: auto;
    padding-top: 0.45rem;
  }

  .directory-card > .deed-stage {
    order: 5;
    margin: 0.35rem 0 0;
  }

  .directory-card > .celebration-card,
  .directory-card > .return-dopamine-strip {
    order: 6;
  }

  .impact-payoff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 0.18rem 0.52rem;
    border-radius: 999px;
    background: var(--accent-warm-tint, #fef6e8);
    border: 1px solid rgba(184, 101, 27, 0.28);
    color: var(--accent-warm-ink, #8f4b0e);
  }

  .molly-celebration-note :global(.badge-paw-svg),
  .molly-celebration-note :global(.molly-note-paw-svg) {
    color: var(--accent-warm-ink, #8f4b0e);
    display: inline-block;
    vertical-align: -2px;
    margin-right: 0.2rem;
  }

  .in-situ-affirmation,
  .molly-svet-inline-link {
    color: var(--accent-primary, #1b5e42);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .molly-celebration-note {
    font-size: 0.82rem;
    color: var(--ink-primary, #14281d);
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 10px;
    padding: 0.5rem 0.75rem;
    margin: 0.25rem 0;
    line-height: 1.42;
  }

  .in-situ-affirmation {
    display: flex;
    align-items: flex-start;
    gap: 0.42rem;
  }

  .in-situ-affirmation :global(.affirmation-icon) {
    color: var(--accent-primary, #1b5e42);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .return-dopamine-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-top: 0.45rem;
  }

  .return-dopamine-btn {
    appearance: none;
    border: 1px solid var(--accent-primary, #1b5e42);
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    cursor: pointer;
    text-decoration: none;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.36rem;
    box-sizing: border-box;
    scroll-margin-top: 75px;
    scroll-margin-bottom: 75px;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease;
  }

  .return-dopamine-btn:hover {
    background: var(--accent-primary-hover, #144732);
    border-color: var(--accent-primary-hover, #144732);
  }

  .btn-session-close {
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
  }

  .btn-session-close:hover {
    background: var(--bohemian-mist, #e6f0ea);
    border-color: var(--accent-primary, #1b5e42);
  }

  .return-dopamine-svet-link {
    color: var(--ink-primary, #14281d);
    font-size: 0.82rem;
    font-weight: 700;
    text-decoration: none;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
    box-sizing: border-box;
    cursor: pointer;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-strong, #c2cec5);
    border-radius: 999px;
    padding: 0.45rem 0.9rem;
  }

  .inline-celebration-next {
    border: 1px solid var(--accent-primary, #1b5e42);
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    padding: 0.5rem 1rem;
    font-family: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  /* =========================================================================
     OVĚŘOVACÍ PATIČKA (V DETAILU „JAK TO FUNGUJE“)
     ========================================================================= */
  .how-details-content .action-verify-footer,
  .action-verify-footer,
  .mobile-details-extra {
    margin-top: 0.45rem;
    padding-top: 0.45rem;
    border-top: 1px dashed var(--border-strong, #c2cec5);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.38rem 0.5rem;
    flex-wrap: wrap;
    font-size: 0.73rem;
    line-height: 1.4;
    color: var(--ink-muted, #516659);
    text-align: left;
  }

  .verify-meta,
  .mde-verify {
    display: inline-block;
    min-width: 0;
    max-width: 100%;
    font-size: 0.73rem;
    line-height: 1.4;
    color: var(--ink-muted, #516659);
    text-align: left;
    overflow-wrap: anywhere;
  }

  .verify-meta strong,
  .mde-verify strong {
    color: var(--ink-primary, #14281d);
    font-weight: 700;
  }

  .verify-source-link {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    gap: 0.18rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.2rem 0.25rem;
    box-sizing: border-box;
    color: var(--accent-primary, #1b5e42);
    font-weight: 700;
    text-decoration: none;
  }

  .verify-source-link:hover {
    color: var(--accent-primary-hover, #144732);
    text-decoration: underline;
  }

  .verify-footer-actions,
  .mde-row {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .direct-link-share-btn,
  .mde-share-btn {
    appearance: none;
    background: none;
    border: none;
    padding: 0.2rem 0.25rem;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    box-sizing: border-box;
    color: var(--accent-primary, #1b5e42);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .broken-link-btn,
  .mde-broken-btn {
    appearance: none;
    border: none;
    background: transparent;
    padding: 0.2rem 0.25rem;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    color: var(--ink-muted, #516659);
    font-family: var(--font-sans);
    font-size: 0.74rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }

  .broken-link-btn:hover {
    color: var(--accent-warm-ink, #8f4b0e);
  }

  @media (max-width: 680px) {
    .mde-share-btn,
    .mde-broken-btn {
      min-height: 44px;
      min-width: 44px;
      padding: 0.25rem 0.35rem;
    }
    .card.directory-card {
      gap: 0.22rem;
      padding: 0.75rem 0.85rem;
      border-radius: 16px;
    }

    .directory-card .action-impact-summary {
      margin: 0 0 0.26rem 0;
      padding: 0.4rem 0.58rem;
      border-radius: 10px;
      background: var(--bohemian-sage, #eef5f0);
      border: 1px solid var(--border-forest, #c5d9cd);
    }

    .instant-body {
      gap: 0.14rem;
    }

    .deed-stage,
    .deed-preview-stage,
    .card-effect-stage {
      height: auto;
      margin: 0 0 0.18rem 0;
      border-radius: 14px;
      box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
    }

    .preview-hud {
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      min-height: 28px;
      padding: 0.3rem 0.56rem 0.24rem;
      gap: 0.12rem;
      box-sizing: border-box;
    }

    .preview-promise-pill {
      display: flex;
      align-items: center;
      flex: 0 0 auto;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      padding: 0;
      font-size: 0.7rem;
      line-height: 1.22;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
    }

    .preview-promise-pill > span:last-child,
    .preview-status-pill > span:last-child {
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
    }

    .preview-status-pill,
    .preview-status-pill.nudged,
    .preview-status-pill.primed-hint,
    .preview-status-pill.teased {
      display: inline-flex;
      flex-shrink: 0;
      max-width: 100%;
      padding: 0;
      font-size: 0.65rem;
      line-height: 1.2;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
    }

    .deed-stage .stage-canvas,
    .stage-canvas,
    .preview-diorama-canvas,
    .impact-payoff-canvas {
      height: 84px;
    }

    .action-meta-line {
      font-size: 0.74rem;
      gap: 0.28rem 0.34rem;
      margin-bottom: 0.1rem;
      flex-wrap: wrap;
      overflow: visible;
    }

    .card-personal-row {
      margin-bottom: 0.14rem;
    }

    .category-aura-chip {
      padding: 0.15rem 0.48rem;
      font-size: 0.69rem;
      gap: 0.2rem;
    }

    .quick-tags-pill {
      padding: 0.16rem 0.5rem;
      font-size: 0.72rem;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      line-height: 1.3;
    }

    .personal-values-pill {
      min-height: 44px;
      padding: 0.3rem 0.65rem;
      font-size: 0.72rem;
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .action-title {
      font-size: 1.12rem;
      line-height: 1.22;
      margin: 0.06rem 0 0.18rem 0;
      overflow-wrap: break-word;
    }

    .action-desc {
      font-size: 0.9rem;
      line-height: 1.42;
      margin: 0 0 0.22rem 0;
      overflow-wrap: break-word;
    }

    .action-impact-summary {
      margin: 0 0 0.14rem 0;
      padding-top: 0.28rem;
      gap: 0.14rem;
      font-size: 0.78rem;
      line-height: 1.34;
    }

    .partner-trust-line {
      font-size: 0.73rem;
    }

    .how-toggle {
      margin: 0;
      padding: 0;
      border-radius: 10px;
    }

    .how-toggle summary {
      font-size: 0.78rem;
      min-height: 44px;
      padding: 0.24rem 0.2rem;
      box-sizing: border-box;
    }

    .celebration-card,
    .return-dopamine-strip {
      padding: 0;
      margin-top: 0.06rem;
      margin-bottom: 0.06rem;
      gap: 0.2rem;
    }

    .in-situ-affirmation,
    .molly-celebration-note {
      padding: 0.25rem 0.52rem;
      margin: 0;
      font-size: 0.73rem;
      line-height: 1.26;
      border-color: var(--border-forest, #c5d9cd);
    }

    .celebration-card .in-situ-affirmation {
      background: var(--bohemian-sage, #eef5f0);
      border-bottom: none;
      border-radius: 12px 12px 0 0;
      padding-bottom: 0.22rem;
    }

    .celebration-card .molly-celebration-note {
      background: var(--bg-surface, #ffffff);
      border-top: 1px dashed var(--border-forest, #c5d9cd);
      border-radius: 0 0 12px 12px;
      margin-top: -0.2rem;
      padding-top: 0.22rem;
    }

    .return-dopamine-actions {
      margin-top: 0.14rem;
      gap: 0.38rem;
    }

    .return-dopamine-btn {
      font-size: 0.82rem;
      padding: 0.45rem 0.85rem;
    }

    .card-effect-head {
      min-height: 44px;
      padding: 0.06rem 0.42rem;
      box-sizing: border-box;
    }

    .payoff-head {
      min-height: 0;
      padding: 0.2rem 0.5rem 0.16rem;
      gap: 0.12rem 0.38rem;
    }

    .payoff-kicker {
      font-size: 0.69rem;
      line-height: 1.2;
    }

    .deed-stage.is-payoff .stage-canvas {
      height: 68px;
    }

    .deed-stage .impact-payoff-badge {
      font-size: 0.64rem;
      padding: 0.12rem 0.42rem;
    }

    .effect-spark-btn,
    .sound-mute-btn {
      font-size: 0.69rem;
      min-height: 44px;
      min-width: 44px;
      padding: 0.25rem 0.55rem;
    }

    .instant-actions {
      flex-direction: column;
      align-items: stretch;
      padding-top: 0.04rem;
      gap: 0.3rem;
    }

    .btn-studio-primary {
      width: 100%;
      box-sizing: border-box;
      min-height: 46px;
      padding: 0.62rem 1rem;
      font-size: 0.94rem;
      border-radius: 14px;
    }

    .btn-studio-done {
      width: 100%;
      box-sizing: border-box;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.44rem 0.68rem;
      font-size: 0.82rem;
      border-radius: 12px;
    }
  }

  @media (max-width: 680px) and (max-height: 819px) {
    .action-title {
      margin: 0.02rem 0 0.12rem 0;
    }

    .action-desc {
      line-height: 1.36;
      margin: 0 0 0.14rem 0;
    }

    .deed-stage,
    .deed-preview-stage,
    .card-effect-stage {
      margin-bottom: 0.12rem;
    }

    .deed-stage .stage-canvas,
    .stage-canvas,
    .preview-diorama-canvas,
    .impact-payoff-canvas {
      height: 78px;
    }
  }

  @media (max-width: 680px) and (max-height: 700px) {
    .deed-stage,
    .deed-preview-stage,
    .card-effect-stage {
      margin-bottom: 0.14rem;
    }

    .preview-hud {
      min-height: 26px;
      padding: 0.24rem 0.5rem 0.2rem;
      gap: 0.08rem;
    }

    .preview-promise-pill {
      padding: 0;
      font-size: 0.67rem;
    }

    .preview-status-pill,
    .preview-status-pill.nudged,
    .preview-status-pill.primed-hint,
    .preview-status-pill.teased {
      font-size: 0.63rem;
    }

    .deed-stage .stage-canvas,
    .stage-canvas,
    .preview-diorama-canvas,
    .impact-payoff-canvas {
      height: 79px;
    }
  }
</style>
