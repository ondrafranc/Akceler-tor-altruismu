<script>
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import {
    completedSteps,
    unplantedSteps,
    sanctuaryWishes,
    SANCTUARY_ELEMENTS,
    HOPE_PROOFS,
    inferStepElement,
    recordSmallWin,
    plantStepLight,
    addSanctuaryWish,
    clearSanctuaryWishes,
    saveStepReflection,
    createProgressBackupCode,
    restoreProgressFromBackupCode,
  } from "../../lib/progress.js";
  import { MICRO_ACTIONS } from "../../lib/data/czech-actions.js";
  import { trackEvent } from "../../lib/analytics.js";
  import {
    playMollyPurr,
    playMollyMeow,
    playSanctuaryChime,
  } from "../../lib/audio/presets.js";
  import {
    isSoundMuted,
    toggleSoundMuted,
  } from "../../lib/audio/audioContext.js";
  import {
    isLowPowerDevice,
    getCanvasDprCap,
    optimizeCanvasContext,
    frameStep,
  } from "../../lib/core/device.js";
  import {
    petMolly,
    setMollyMood,
  } from "../../lib/mollyStore.js";
  import { cleanTitle, isInAppBrowser } from "../../lib/utils.js";
  import DeedInspectorModal from "$lib/features/sanctuary/components/DeedInspectorModal.svelte";
  import RitualBar from "$lib/features/sanctuary/components/RitualBar.svelte";
  import BreathingPacer from "$lib/features/sanctuary/components/BreathingPacer.svelte";
  import ProgressDashboard from "$lib/features/sanctuary/components/ProgressDashboard.svelte";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import { resolveIconKey } from "$lib/icons/iconRegistry.js";
  import {
    drawLakeMist,
    drawBreathingPondAura,
    drawStarLakeReflection,
    drawWaterRipples,
    drawLanternWaterReflection,
  } from "$lib/features/sanctuary/services/sanctuaryLakeRenderer.js";

  /** @typedef {import('$lib/types/deed').MicroAction} MicroAction */
  /** @typedef {import('$lib/types/progress').LightType} LightType */

  /**
   * @typedef {{
   *   actionId: string,
   *   element: string,
   *   x: number,
   *   y: number,
   *   zone: 'sky' | 'water',
   *   lightType: LightType
   * }} DeedSeed
   */

  /**
   * @typedef {{
   *   uid: string,
   *   id: string,
   *   title: string,
   *   element: string,
   *   fromUrlFallback?: boolean
   * }} PlantableSeed
   */

  /**
   * @typedef {{
   *   x: number,
   *   y: number,
   *   lightType?: LightType
   * }} LightPlacement
   */

  /** @typedef {import('$lib/types/progress').QuickDeed} QuickDeed */

  /** @type {Record<string, typeof SANCTUARY_ELEMENTS[0]>} */
  const ELEMENT_MAP = Object.fromEntries(
    SANCTUARY_ELEMENTS.map((e) => [e.key, e]),
  );
  /** @type {Record<string, typeof MICRO_ACTIONS[0]>} */
  const ACTION_BY_ID = Object.fromEntries(MICRO_ACTIONS.map((a) => [a.id, a]));

  // =========================================================================
  // ALWAYS 100% FULL BEAUTY — CONNECTED TO REAL GOOD DEEDS
  // =========================================================================
  /** @type {'dawn' | 'night'} */
  let atmosphereMode = $state("dawn");
  let hasActivatedNight = $state(false);
  const dawnLayerOpacity = $derived(atmosphereMode === "dawn" ? 0.88 : 0);

  // 8 living deed lights seeded across the sky & lake — each linked to a real Czech micro-action
  // 3 semantic light types: lantern (Osobní skutek), star (Inspirace), wave (Pomoc druhému)
  /** @type {DeedSeed[]} */
  const INSPIRING_DEED_SEEDS = [
    {
      actionId: "zvirata_utulek_online",
      element: "animals",
      x: 0.32,
      y: 0.67,
      zone: "water",
      lightType: "lantern",
    },
    {
      actionId: "missing_maps",
      element: "care",
      x: 0.2,
      y: 0.21,
      zone: "sky",
      lightType: "star",
    },
    {
      actionId: "knihobudka_kniha",
      element: "community",
      x: 0.46,
      y: 0.74,
      zone: "water",
      lightType: "wave",
    },
    {
      actionId: "birdlife_ptaci_pasti",
      element: "nature",
      x: 0.41,
      y: 0.15,
      zone: "sky",
      lightType: "star",
    },
    {
      actionId: "estudanky_pramen",
      element: "nature",
      x: 0.66,
      y: 0.66,
      zone: "water",
      lightType: "lantern",
    },
    {
      actionId: "remobil_telefon",
      element: "nature",
      x: 0.62,
      y: 0.23,
      zone: "sky",
      lightType: "star",
    },
    {
      actionId: "letters_seniors",
      element: "community",
      x: 0.72,
      y: 0.26,
      zone: "sky",
      lightType: "star",
    },
    {
      actionId: "trash_hero_uklid",
      element: "nature",
      x: 0.81,
      y: 0.72,
      zone: "water",
      lightType: "wave",
    },
  ];

  /** @type {'water' | 'sky' | 'wave'} */
  let ritualMode = $state("water");
  let ritualInput = $state("");
  let gentleToast = $state("");
  let gentleToastPaw = $state(false);
  /** @type {ReturnType<typeof setTimeout> | null} */
  let toastTimer = null;

  /**
   * @param {string} msg
   * @param {boolean} [withPaw]
   */
  function showGentleToast(msg, withPaw = false) {
    gentleToast = msg;
    gentleToastPaw = withPaw;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      gentleToast = "";
      gentleToastPaw = false;
    }, 4400);
  }

  // =========================================================================
  // POLYPHONIC HARMONIC SOUNDSCAPE (SHARED AUDIO ENGINE)
  // =========================================================================
  let soundEnabled = $state(false);
  let lastHoverChimeAt = 0;

  function toggleSound() {
    const nextEnabled = !soundEnabled;
    if (nextEnabled && isSoundMuted()) {
      toggleSoundMuted();
    } else if (!nextEnabled && !isSoundMuted()) {
      toggleSoundMuted();
    }
    soundEnabled = nextEnabled;
    if (soundEnabled) {
      playChime("water");
    }
  }

  /**
   * Lush polyphonic pentatonic synthesis delegated to the shared AudioContext
   * (playSanctuaryChime(freq, dur, wave, delay)).
   * @param {'sky' | 'water' | 'breath_in' | 'breath_out' | 'hover'} type
   */
  function playChime(type) {
    if (!soundEnabled) return;
    const pick = (/** @type {number[]} */ arr) =>
      arr[Math.floor(Math.random() * arr.length)];
    if (type === "hover") {
      playSanctuaryChime(
        pick([880, 987.77, 1046.5, 1174.66, 1318.51]),
        0.55,
        "sine",
        0,
      );
    } else if (type === "sky") {
      // Arpeggiated celesta / harp triad
      const base = pick([523.25, 587.33, 659.25]);
      [1, 1.25, 1.5, 2].forEach((mult, idx) => {
        playSanctuaryChime(
          base * mult,
          2.4,
          idx === 3 ? "triangle" : "sine",
          idx * 0.065,
        );
      });
    } else if (type === "water") {
      // Warm singing bowl + water harmonic overtone
      const base = pick([261.63, 293.66, 329.63, 392.0]);
      [1, 1.5, 2.01].forEach((mult, idx) => {
        playSanctuaryChime(
          base * mult,
          2.8 - idx * 0.35,
          idx === 0 ? "triangle" : "sine",
          0,
        );
      });
    } else if (type === "breath_in" || type === "breath_out") {
      const freqs = type === "breath_in" ? [261.63, 392.0] : [220.0, 329.63];
      freqs.forEach((f) => playSanctuaryChime(f, 3.1, "sine", 0));
    }
  }

  // =========================================================================
  let breathingActive = $state(false);
  let breathScale = 1;
  let targetBreathScale = 1;

  // =========================================================================
  // ONE QUIET GOOD NEWS WHISPER
  // =========================================================================
  let proofIndex = $state(0);
  const currentProof = $derived(HOPE_PROOFS[proofIndex % HOPE_PROOFS.length]);

  /** @type {Record<string, string>} */
  const ACTION_ALIASES = {
    "click-and-feed": "zvirata_utulek_online",
    click_and_feed: "zvirata_utulek_online",
    mapswipe: "missing_maps",
  };

  /**
   * @param {string} rawSeed
   * @returns {MicroAction | null}
   */
  function resolveActionFromSeed(rawSeed) {
    if (!rawSeed) return null;
    const cleaned = String(rawSeed).trim();
    if (!cleaned) return null;
    const aliased = ACTION_ALIASES[cleaned.toLowerCase()] || cleaned;
    if (ACTION_BY_ID[aliased]) return ACTION_BY_ID[aliased];
    const normUnder = aliased.replace(/-/g, "_").toLowerCase();
    const normHyphen = aliased.replace(/_/g, "-").toLowerCase();
    return (
      MICRO_ACTIONS.find(
        (a) =>
          a.id.toLowerCase() === normUnder ||
          a.id.toLowerCase().replace(/_/g, "-") === normHyphen,
      ) || null
    );
  }

  let urlSeedPlanted = $state(false);
  let lastUrlSeedKey = "";

  const rawUrlSeed = $derived(page?.url?.searchParams?.get("seed") || "");
  const rawUrlTitle = $derived(page?.url?.searchParams?.get("title") || "");
  const currentUrlSeedKey = $derived(`${rawUrlSeed}::${rawUrlTitle}`);
  $effect(() => {
    if (currentUrlSeedKey !== lastUrlSeedKey) {
      lastUrlSeedKey = currentUrlSeedKey;
      urlSeedPlanted = false;
    }
  });

  /**
   * @param {string} raw
   * @returns {string}
   */
  function humanizeSeedFallback(raw) {
    const trimmed = cleanTitle(raw);
    if (!trimmed || /^(true|false|\d+|step|seed|custom)$/i.test(trimmed)) {
      return "Dobrý skutek ze dneška";
    }
    const spaced = trimmed
      .replace(/[_-]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (!spaced) return "Dobrý skutek ze dneška";
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  const urlSeedFallback = $derived.by(() => {
    if (urlSeedPlanted || (!rawUrlSeed && !rawUrlTitle)) return null;
    const matched = resolveActionFromSeed(rawUrlSeed);
    const baseTitle = rawUrlTitle
      ? cleanTitle(rawUrlTitle)
      : matched?.title
        ? cleanTitle(matched.title)
        : humanizeSeedFallback(rawUrlSeed);
    const resolvedTitle = String(baseTitle || "")
      .slice(0, 110)
      .trim();
    if (!resolvedTitle) return null;
    const resolvedId = matched?.id || rawUrlSeed || "step";
    return {
      uid: `url-seed-${resolvedId}`,
      id: resolvedId,
      title: resolvedTitle,
      element: inferStepElement(
        matched || { id: resolvedId, title: resolvedTitle },
      ),
      fromUrlFallback: true,
    };
  });

  const latestStep = $derived(
    ($completedSteps || [])[($completedSteps || []).length - 1] || null,
  );
  const nextSeedToPlant = $derived.by(() => {
    const unplanted = $unplantedSteps || [];
    if (urlSeedFallback) {
      const matchingUnplanted = unplanted.find(
        (s) => s.id === urlSeedFallback.id,
      );
      if (matchingUnplanted) {
        return rawUrlTitle
          ? { ...matchingUnplanted, title: urlSeedFallback.title }
          : matchingUnplanted;
      }
      return urlSeedFallback;
    }
    return unplanted[0] || null;
  });
  const completedActionIds = $derived(
    new Set(($completedSteps || []).map((s) => s.id)),
  );

  /**
   * @param {PlantableSeed | null} seed
   * @param {LightPlacement} pos
   */
  function plantActiveSeed(seed, pos) {
    if (!seed) return;
    urlSeedPlanted = true;
    if (seed.fromUrlFallback) {
      const entry = recordSmallWin({
        id: seed.id,
        title: seed.title,
        element: seed.element,
        surface: "svet_seed_url",
        silent: true,
      });
      if (entry) {
        plantStepLight(entry.uid, pos);
      }
    } else {
      plantStepLight(seed.uid, pos);
    }
  }

  /**
   * @param {number} index
   * @param {string} elementKey
   * @returns {{ x: number, y: number, zone: 'water' | 'sky', lightType?: LightType }}
   */
  function deterministicPos(index, elementKey) {
    const golden = (index * 0.61803398875 + 0.17) % 1;
    const x = 0.14 + golden * 0.72;
    const prefersWater =
      elementKey === "community" ||
      (elementKey === "animals" && index % 2 === 1);
    const y = prefersWater
      ? 0.61 + ((index * 0.29) % 0.2)
      : 0.14 + ((index * 0.23 + 0.07) % 0.28);
    return { x, y, zone: prefersWater ? "water" : "sky" };
  }

  /**
   * Safely resolves and narrows a zone coordinate to 'water' | 'sky'.
   * @param {unknown} [zone]
   * @param {number} [y]
   * @returns {'water' | 'sky'}
   */
  function resolveSanctuaryZone(zone, y = 0) {
    if (zone === "water" || zone === "sky") return zone;
    return typeof y === "number" && y >= 0.53 ? "water" : "sky";
  }

  const seededDeedLights = $derived(
    /** @type {LightItem[]} */ (
      INSPIRING_DEED_SEEDS.filter(
        (seed) => !completedActionIds.has(seed.actionId),
      )
        .map(/** @returns {LightItem | null} */ (seed) => {
          const action = ACTION_BY_ID[seed.actionId];
          if (!action) return null;
          return {
            uid: `seed-${seed.actionId}`,
            actionId: seed.actionId,
            action,
            title: action.title,
            note: "",
            concreteImpact:
              action.concreteImpact || action.whyItMatters || action.desc,
            orgName: action.org || "",
            minutes: action.timeMinutes || 0,
            url: action.url || "",
            element: seed.element,
            x: seed.x,
            y: seed.y,
            zone: resolveSanctuaryZone(seed.zone, seed.y),
            lightType:
              seed.lightType || (seed.zone === "sky" ? "star" : "lantern"),
            isMine: false,
          };
        })
        .filter(Boolean)
    ),
  );

  /** @type {LightItem[]} */
  const userLights = $derived([
    ...($completedSteps || [])
      .filter((s) => !s.awaitingPlant || s.plantedPos)
      .map((s, idx) => {
        const pos = s.plantedPos || deterministicPos(idx, s.element);
        const linked = ACTION_BY_ID[s.id] || null;
        const zone = resolveSanctuaryZone(pos.zone, pos.y);
        return {
          uid: s.uid,
          actionId: s.id,
          action: linked,
          title: s.title,
          note: s.note || "",
          concreteImpact:
            s.concreteImpact ||
            linked?.concreteImpact ||
            linked?.whyItMatters ||
            "",
          orgName: linked?.org || "",
          minutes: linked?.timeMinutes || 0,
          url: linked?.url || "",
          element: s.element || "care",
          x: pos.x,
          y: pos.y,
          zone,
          lightType:
            s.lightType ||
            pos.lightType ||
            (zone === "sky" ? "star" : "lantern"),
          isMine: true,
        };
      }),
    ...($sanctuaryWishes || []).map((w) => {
      const zone = resolveSanctuaryZone(w.zone, w.y);
      return {
        uid: w.uid,
        actionId: "",
        action: null,
        title: w.title,
        note: "",
        concreteImpact: "Dobrý skutek přidaný do tvé Krajiny dobra.",
        orgName: "",
        minutes: 0,
        url: "",
        element: w.element || "care",
        x: w.x,
        y: w.y,
        zone,
        lightType:
          w.lightType ||
          (w.kind === "wave" ? "wave" : zone === "sky" ? "star" : "lantern"),
        isMine: true,
      };
    }),
  ]);

  const activeLights = $derived([...seededDeedLights, ...userLights]);
  const myDeedsCount = $derived(userLights.length);

  /** @typedef {import('$lib/types/progress').SanctuaryLight} LightItem */

  /** @type {LightItem | null} */
  let selectedLight = $state(null);
  /** @type {LightItem | null} */
  let hoveredLight = $state(null);

  // =========================================================================
  // SPECTACULAR 60FPS INTERACTIVE VISUAL EFFECTS ENGINE
  // =========================================================================
  /** @type {HTMLCanvasElement | null} */
  let canvasEl = $state(null);
  /** @type {HTMLDivElement | null} */
  let stageWrapEl = $state(null);
  /** @type {HTMLDivElement | null} */
  let parallaxEl = $state(null);
  let pointer = { x: 0.5, y: 0.62, active: false, smoothX: 0.5, smoothY: 0.62 };
  let lastRippleAt = 0;
  let lastTrailAt = 0;
  let inAppBrowserDetected = $state(false);

  /** @type {Array<{ x: number, y: number, vx: number, vy: number, r: number, alpha: number, color: string, life: number, maxLife: number, gravity: number, twinkle: number }>} */
  let burstParticles = [];
  /** @type {Array<{ x: number, y: number, rx: number, maxRx: number, speed: number, alpha: number, color: string, lineWidth: number }>} */
  let waterRipples = [];
  /** @type {Array<{ x: number, y: number, r: number, maxR: number, alpha: number, color: string, isWater: boolean }>} */
  let shockwaves = [];
  /** @type {Array<{ sx: number, sy: number, cx: number, cy: number, tx: number, ty: number, progress: number, speed: number, color: string, isWater: boolean }>} */
  let activeComets = [];
  /** @type {Array<{ x1: number, y1: number, x2: number, y2: number, progress: number, alpha: number, color: string }>} */
  let constellationPulses = [];
  /** @type {Array<{ x: number, y: number, vx: number, vy: number, len: number, life: number, maxLife: number }>} */
  let meteors = [];
  /** @type {Record<string, number>} */
  let hoverScales = {};

  // Patronka Molly u lesní tůně v Krajině dobra (nx = 0.24, ny = 0.72)
  const MOLLY_SANCTUARY_POS = { x: 0.24, y: 0.72 };

  // Trajektorie břehu tůně: nx ≈ 0.20 až 0.44, ny ≈ 0.72 + (nx - 0.24) * 0.04
  /**
   * @param {number} nx
   * @returns {number}
   */
  function getLakeshoreY(nx) {
    return 0.72 + (nx - 0.24) * 0.04;
  }

  // Stavový automat chodící Molly: 'SIT_HOME' | 'WALK_PATROL' | 'WATCH_LAKE' | 'GROOM' | 'JOY'
  let mollyPos = { x: 0.24, y: 0.72 };
  let mollyTargetX = 0.24;
  let mollyBehavior = "SIT_HOME";
  let mollyStateTimer = 1.6;
  let mollyFacing = -1; // -1 = doleva domů, 1 = doprava k tůni
  let mollyWalkCycle = 0;

  /** @type {Array<{ sx: number, sy: number, cx: number, cy: number, tx: number, ty: number, progress: number, color: string }>} */
  let mollyLightArcs = [];
  /** @type {Array<{ x: number, y: number, vx: number, vy: number, alpha: number, color: string }>} */
  let mollyLakeHearts = [];
  let mollyJoyTimer = 0;

  function launchSanctuaryLightArc(
    fromNx = 0.48,
    fromNy = 0.34,
    color = "#fbbf24",
  ) {
    const tx = mollyPos.x;
    const ty = mollyPos.y - 0.02;
    if (mollyLightArcs.length >= 12) {
      mollyLightArcs.shift();
    }
    mollyLightArcs.push({
      sx: fromNx,
      sy: fromNy,
      cx: (fromNx + tx) * 0.5,
      cy: Math.max(0.08, Math.min(fromNy, ty) - 0.18),
      tx,
      ty,
      progress: 0,
      color,
    });
  }

  /** Pohlazení Molly u tůně: radostný poskok, srdíčka a vlnka na hladině. */
  function petSanctuaryMolly() {
    petMolly("Mrrr… u lesní tůně v Krajině dobra je s tebou klidně a hezky.");
    mollyJoyTimer = 1.8;
    mollyBehavior = "JOY";
    for (let i = 0; i < 7; i++) {
      mollyLakeHearts.push({
        x: mollyPos.x + (Math.random() - 0.5) * 0.04,
        y: mollyPos.y - 0.03 - Math.random() * 0.02,
        vx: (Math.random() - 0.5) * 0.001,
        vy: -0.0012 - Math.random() * 0.001,
        alpha: 1,
        color: i % 2 === 0 ? "#fbbf24" : "#f472b6",
      });
    }
    if (mollyLakeHearts.length > 32) {
      mollyLakeHearts.splice(0, mollyLakeHearts.length - 32);
    }
    waterRipples.push({
      x: mollyPos.x,
      y: mollyPos.y + 0.03,
      rx: 6,
      maxRx: 95,
      speed: 1.15,
      alpha: 0.72,
      color: "#fde68a",
      lineWidth: 2.0,
    });
    showGentleToast("Patronka Molly spokojeně přede u břehu tůně.", true);
  }

  /**
   * @param {boolean} isInhale
   */
  function spawnBreathWave(isInhale) {
    targetBreathScale = isInhale ? 1.32 : 0.82;
    waterRipples.push({
      x: 0.5,
      y: 0.68,
      rx: isInhale ? 12 : 24,
      maxRx: 260,
      speed: isInhale ? 1.05 : 0.72,
      alpha: 0.55,
      color: isInhale ? "#6ee7b7" : "#fde68a",
      lineWidth: 2.2,
    });
    shockwaves.push({
      x: 0.5,
      y: 0.58,
      r: 14,
      maxR: 210,
      alpha: 0.32,
      color: isInhale ? "#6ee7b7" : "#fde68a",
      isWater: true,
    });
  }

  /**
   * Full cinematic bloom + comet/lantern ceremony
   * @param {number} nx
   * @param {number} ny
   * @param {string} [color]
   * @param {boolean} [isWater]
   * @param {boolean} [withLaunchArc]
   */
  function triggerLightBloom(
    nx,
    ny,
    color = "#fde68a",
    isWater = false,
    withLaunchArc = false,
  ) {
    if (withLaunchArc) {
      const startX = Math.max(
        0.12,
        Math.min(0.88, nx + (Math.random() - 0.5) * 0.18),
      );
      const startY = isWater ? 0.92 : 0.56;
      const ctrlX = (startX + nx) * 0.5 + (Math.random() - 0.5) * 0.14;
      const ctrlY = isWater
        ? Math.min(startY, ny) - 0.12
        : Math.min(startY, ny) - 0.08;
      activeComets.push({
        sx: startX,
        sy: startY,
        cx: ctrlX,
        cy: ctrlY,
        tx: nx,
        ty: ny,
        progress: 0,
        speed: isWater ? 0.036 : 0.028,
        color,
        isWater,
      });
      launchSanctuaryLightArc(nx, ny, color || "#fbbf24");
    }

    detonateBloomAt(nx, ny, color, isWater, withLaunchArc ? 0.55 : 1);
  }

  /**
   * @param {number} nx
   * @param {number} ny
   * @param {string} [color]
   * @param {boolean} [isWater]
   * @param {number} [intensity]
   */
  function detonateBloomAt(
    nx,
    ny,
    color = "#fde68a",
    isWater = false,
    intensity = 1,
  ) {
    const count = Math.round((isWater ? 58 : 72) * intensity);
    const palette = isWater
      ? [color, "#fef3c7", "#6ee7b7", "#fed7aa"]
      : [color, "#ffffff", "#fde68a", "#6ee7b7"];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      const speed =
        (0.0012 + Math.random() * 0.0056) * (0.7 + intensity * 0.35);
      const upwardLift = isWater ? -(0.0008 + Math.random() * 0.0022) : -0.0002;
      burstParticles.push({
        x: nx,
        y: ny,
        vx: Math.cos(angle) * speed * (isWater ? 0.85 : 1),
        vy: Math.sin(angle) * speed * (isWater ? 0.55 : 1) + upwardLift,
        r: 1.6 + Math.random() * 3.8,
        alpha: 0.98,
        color: palette[i % palette.length],
        life: 0,
        maxLife: 68 + Math.random() * 58,
        gravity: isWater ? -0.000022 : 0.000018,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    // Multi-ring luminous shockwave halos
    shockwaves.push({
      x: nx,
      y: ny,
      r: 4,
      maxR: isWater ? 145 : 175,
      alpha: 0.85 * intensity,
      color: "#ffffff",
      isWater,
    });
    shockwaves.push({
      x: nx,
      y: ny,
      r: 10,
      maxR: isWater ? 210 : 240,
      alpha: 0.62 * intensity,
      color,
      isWater,
    });

    // If sky star, connect glowing constellation filaments to nearest stars + reflect on pond
    if (!isWater) {
      const skyPeers = activeLights
        .filter(
          (l) => l.zone === "sky" && Math.hypot(l.x - nx, l.y - ny) > 0.02,
        )
        .sort(
          (a, b) =>
            Math.hypot(a.x - nx, a.y - ny) - Math.hypot(b.x - nx, b.y - ny),
        )
        .slice(0, 3);

      for (const peer of skyPeers) {
        constellationPulses.push({
          x1: nx,
          y1: ny,
          x2: peer.x,
          y2: peer.y,
          progress: 0,
          alpha: 0.9,
          color,
        });
      }

      // Mirror ripple on the lake below the lit star
      const mirrorY = 0.61 + (0.48 - Math.min(0.46, ny)) * 0.42;
      waterRipples.push({
        x: nx,
        y: mirrorY,
        rx: 5,
        maxRx: 95,
        speed: 1.15,
        alpha: 0.55,
        color,
        lineWidth: 1.6,
      });
    }

    // Lush concentric water waves
    if (isWater || ny >= 0.5) {
      const wy = Math.max(0.57, ny);
      const waveColors = ["#ffffff", color, "#6ee7b7", "#fde68a"];
      waveColors.forEach((wc, idx) => {
        setTimeout(() => {
          waterRipples.push({
            x: nx,
            y: wy,
            rx: 4 + idx * 3,
            maxRx: 135 + idx * 28,
            speed: 1.35 - idx * 0.14,
            alpha: (0.86 - idx * 0.14) * intensity,
            color: wc,
            lineWidth: 2.3 - idx * 0.35,
          });
        }, idx * 140);
      });
    }
  }

  function openRandomInspiringDeed() {
    const pool = seededDeedLights.length > 0 ? seededDeedLights : activeLights;
    if (pool.length === 0) return;
    const currentIdx = pool.findIndex((l) => l?.uid === selectedLight?.uid);
    const next = pool[(currentIdx + 1) % pool.length];
    if (!next) return;
    selectedLight = next;
    triggerLightBloom(
      next.x,
      next.y,
      ELEMENT_MAP[next.element]?.softColor || "#fde68a",
      next.zone === "water",
      false,
    );
    playChime(next.zone === "water" ? "water" : "sky");
  }

  /**
   * @param {LightItem | null} light
   */
  function markDeedLightDone(light) {
    if (!light) return;
    const semanticType =
      light.lightType || (light.zone === "sky" ? "star" : "lantern");
    if (light.action) {
      const entry = recordSmallWin({
        id: light.action.id,
        title: light.action.title,
        surface: "svet_landscape",
        element: light.element,
        lightType: semanticType,
        concreteImpact: light.concreteImpact,
        silent: true,
      });
      if (entry) {
        plantStepLight(entry.uid, {
          x: light.x,
          y: light.y,
          lightType: semanticType,
        });
      }
    } else {
      addSanctuaryWish({
        x: light.x,
        y: light.y,
        kind: semanticType === "wave" ? "wave" : "deed",
        lightType: semanticType,
        title: light.title,
        element: light.element || "care",
      });
    }
    triggerLightBloom(
      light.x,
      light.y,
      "#fde68a",
      light.zone === "water",
      true,
    );
    playChime(light.zone === "water" ? "water" : "sky");
    selectedLight = { ...light, isMine: true };
    showGentleToast(
      `Dnes se ti povedlo něco dobrého. Nemusíš dělat nic dalšího. Můžeš si chvíli odpočinout.`,
    );
  }

  /**
   * @param {QuickDeed} deed
   */
  function addQuickOfflineDeed(deed) {
    const isWater =
      ritualMode === "water" ||
      ritualMode === "wave" ||
      deed.lightType === "wave";
    const semanticType =
      ritualMode === "wave"
        ? "wave"
        : ritualMode === "sky"
          ? "star"
          : deed.lightType || "lantern";
    const nx = 0.16 + Math.random() * 0.68;
    const ny = isWater
      ? 0.61 + Math.random() * 0.19
      : 0.14 + Math.random() * 0.26;
    const saved = addSanctuaryWish({
      x: nx,
      y: ny,
      kind: semanticType === "wave" ? "wave" : "deed",
      lightType: semanticType,
      title: deed.title,
      element: deed.element,
    });
    selectedLight = null;
    triggerLightBloom(
      saved.x,
      saved.y,
      ELEMENT_MAP[deed.element]?.softColor || "#fde68a",
      isWater,
      true,
    );
    playChime(isWater ? "water" : "sky");
    showGentleToast(
      `Dnes se ti povedlo něco dobrého. Nemusíš dělat nic dalšího. Můžeš si chvíli odpočinout.`,
    );
  }

  /**
   * @param {number} nx
   * @param {number} ny
   * @param {number} widthOrAspect
   * @param {number} [height]
   * @returns {LightItem | null}
   */
  function findClosestLight(nx, ny, widthOrAspect, height) {
    let width = widthOrAspect;
    let h = height;
    if (h === undefined) {
      const rect = stageWrapEl?.getBoundingClientRect();
      width = rect?.width || 800;
      h = width * (widthOrAspect || 0.6);
    }
    let closest = null;
    let minDist = Math.max(34, 0.055 * width);
    for (const l of activeLights) {
      const dx = (l.x - nx) * width;
      const dy = (l.y - ny) * h;
      let d = Math.hypot(dx, dy);
      if (l.actionId === "letters_seniors") {
        const dLegacy = Math.hypot((0.79 - nx) * width, (0.18 - ny) * h);
        if (dLegacy < d) d = dLegacy;
      }
      if (d < minDist) {
        minDist = d;
        closest = l;
      }
    }
    return closest;
  }

  /**
   * @param {PointerEvent} e
   */
  function handlePointerMove(e) {
    if (!stageWrapEl) return;
    const rect = stageWrapEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    pointer.x = nx;
    pointer.y = ny;
    pointer.active = true;

    const nearLight = findClosestLight(nx, ny, rect.width, rect.height);
    if (nearLight?.uid !== hoveredLight?.uid) {
      hoveredLight = nearLight;
      const now = performance.now();
      if (nearLight && now - lastHoverChimeAt > 240) {
        lastHoverChimeAt = now;
        playChime("hover");
      }
    }

    const now = performance.now();
    // Fluid bioluminescent wake on the lake
    if (ny > 0.55 && now - lastRippleAt > 110) {
      lastRippleAt = now;
      waterRipples.push({
        x: nx,
        y: ny,
        rx: 2.5,
        maxRx: 58,
        speed: 0.92,
        alpha: 0.36,
        color: atmosphereMode === "night" ? "#6ee7b7" : "#fde68a",
        lineWidth: 1.35,
      });
    }

    // Delicate stardust wake in the air & over the water
    if (now - lastTrailAt > 42 && burstParticles.length < 220) {
      lastTrailAt = now;
      burstParticles.push({
        x: nx + (Math.random() - 0.5) * 0.008,
        y: ny + (Math.random() - 0.5) * 0.008,
        vx: (Math.random() - 0.5) * 0.0005,
        vy: -0.00035 - Math.random() * 0.0005,
        r: 1.1 + Math.random() * 1.9,
        alpha: 0.72,
        color: ny > 0.54 ? "#6ee7b7" : "#fde68a",
        life: 0,
        maxLife: 34 + Math.random() * 24,
        gravity: -0.00001,
        twinkle: Math.random() * 6.28,
      });
    }
  }

  function handlePointerLeave() {
    pointer.active = false;
    hoveredLight = null;
  }

  /**
   * @param {MouseEvent} e
   */
  function handleStageClick(e) {
    if (!stageWrapEl) return;
    const rect = stageWrapEl.getBoundingClientRect();
    const nx = Math.max(
      0.06,
      Math.min(0.94, (e.clientX - rect.left) / rect.width),
    );
    const ny = Math.max(
      0.07,
      Math.min(0.88, (e.clientY - rect.top) / rect.height),
    );

    // Přímé pohlazení / nakrmení patronky Molly na břehu tůně:
    // Podporuje jak stálou domovskou zónu (0.24 * w, 0.72 * h) pro 100% testovací kompatibilitu,
    // tak dynamickou polohu Molly při procházce podél břehu
    const homePxX = MOLLY_SANCTUARY_POS.x * rect.width;
    const homePxY = MOLLY_SANCTUARY_POS.y * rect.height;
    const curPxX = mollyPos.x * rect.width;
    const curPxY = mollyPos.y * rect.height;
    const clickPxX = e.clientX - rect.left;
    const clickPxY = e.clientY - rect.top;
    const distHome = Math.hypot(clickPxX - homePxX, clickPxY - homePxY);
    const distCur = Math.hypot(clickPxX - curPxX, clickPxY - curPxY);
    if (!selectedLight && (distHome < 48 || distCur < 48)) {
      petSanctuaryMolly();
      return;
    }

    const closest = findClosestLight(nx, ny, rect.width, rect.height);

    if (closest && selectedLight && closest.uid === selectedLight.uid) {
      selectedLight = null;
      return;
    }

    if (closest && !nextSeedToPlant && !ritualInput.trim()) {
      selectedLight = closest;
      triggerLightBloom(
        closest.x,
        closest.y,
        ELEMENT_MAP[closest.element]?.softColor || "#fde68a",
        closest.zone === "water",
        false,
      );
      playChime(closest.zone === "water" ? "water" : "sky");
      return;
    }

    if (selectedLight) {
      selectedLight = null;
      return;
    }

    if (nextSeedToPlant) {
      const elMeta =
        ELEMENT_MAP[nextSeedToPlant.element] || SANCTUARY_ELEMENTS[0];
      const isWater = ny >= 0.53;
      const semanticType = !isWater
        ? "star"
        : ritualMode === "wave"
          ? "wave"
          : "lantern";
      plantActiveSeed(nextSeedToPlant, {
        x: nx,
        y: ny,
        lightType: semanticType,
      });
      triggerLightBloom(nx, ny, elMeta.softColor, isWater, true);
      playChime(isWater ? "water" : "sky");
      showGentleToast(
        "Dnes se ti povedlo něco dobrého. Nemusíš dělat nic dalšího. Můžeš si chvíli odpočinout.",
      );
      return;
    }

    const text = ritualInput.trim();
    if (!text) {
      triggerLightBloom(
        nx,
        ny,
        ny >= 0.53 ? "#fed7aa" : "#fde68a",
        ny >= 0.53,
        false,
      );
      playChime(ny >= 0.53 ? "water" : "sky");
      return;
    }

    const clickedWater = ny >= 0.53;
    const semanticType = !clickedWater
      ? "star"
      : ritualMode === "wave"
        ? "wave"
        : "lantern";
    const yClamped = clickedWater ? Math.max(0.58, ny) : Math.min(0.46, ny);
    const saved = addSanctuaryWish({
      x: nx,
      y: yClamped,
      kind: semanticType === "wave" ? "wave" : "deed",
      lightType: semanticType,
      title: text,
      element: clickedWater ? "community" : "care",
    });
    ritualInput = "";
    selectedLight = null;
    triggerLightBloom(
      saved.x,
      saved.y,
      clickedWater ? "#fed7aa" : "#fde68a",
      clickedWater,
      true,
    );
    playChime(clickedWater ? "water" : "sky");
    showGentleToast(
      "Dnes se ti povedlo něco dobrého. Nemusíš dělat nic dalšího. Můžeš si chvíli odpočinout.",
    );
  }

  function submitRitualBar() {
    const isWater = ritualMode === "water" || ritualMode === "wave";
    const semanticType =
      ritualMode === "wave"
        ? "wave"
        : ritualMode === "sky"
          ? "star"
          : "lantern";
    const nx = 0.18 + Math.random() * 0.64;
    const ny = isWater
      ? 0.62 + Math.random() * 0.18
      : 0.15 + Math.random() * 0.25;
    const text = ritualInput.trim();
    const saved = addSanctuaryWish({
      x: nx,
      y: ny,
      kind: semanticType === "wave" ? "wave" : "deed",
      lightType: semanticType,
      title: text || "Drobný dobrý skutek ze dneška",
      element: isWater ? "community" : "care",
    });
    ritualInput = "";
    selectedLight = null;
    triggerLightBloom(
      saved.x,
      saved.y,
      semanticType === "wave" ? "#6ee7b7" : isWater ? "#fed7aa" : "#fde68a",
      isWater,
      true,
    );
    playChime(isWater ? "water" : "sky");
    showGentleToast(
      "Dnes se ti povedlo něco dobrého. Nemusíš dělat nic dalšího. Můžeš si chvíli odpočinout.",
    );
  }

  onMount(() => {
    let rafId = 0;
    inAppBrowserDetected = isInAppBrowser();
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lowPower = isLowPowerDevice();
    const fireflies = Array.from({ length: lowPower ? 30 : 54 }, (_, i) => ({
      x: Math.random(),
      y: 0.36 + Math.random() * 0.58,
      vx: (Math.random() - 0.5) * 0.00042,
      vy: (Math.random() - 0.5) * 0.00028,
      phase: i * 1.37,
      size: 1.5 + (i % 4) * 0.85,
      gold: i % 3 !== 0,
    }));

    const ambientStars = Array.from({ length: 78 }, (_, i) => ({
      x: ((i * 73 + 19) % 97) / 97,
      y: ((i * 41 + 5) % 45) / 100 + 0.02,
      r: 0.55 + (i % 3) * 0.48,
      twinkle: i * 0.91,
    }));

    const mistClouds = [
      { x: 0.22, y: 0.57, w: 0.38, h: 0.065, speed: 0.00018, phase: 0.4 },
      { x: 0.68, y: 0.61, w: 0.44, h: 0.075, speed: -0.00014, phase: 2.1 },
      { x: 0.45, y: 0.66, w: 0.5, h: 0.06, speed: 0.00012, phase: 4.0 },
    ];

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nextMeteorAt = 2.5;
    // Adaptivní kvalita: když průměrný snímek trvá déle než ~24 ms, snížíme rozlišení plátna
    // (méně pixelů = plynulejší animace na slabších telefonech a v in-app prohlížečích)
    let dprCap = getCanvasDprCap();
    let slowFrameAvg = 16.7;
    let renderWorkAvg = 0;
    let qualityCheckAt = 0;
    let lastRenderMs = 0;
    /** @type {CanvasRenderingContext2D | null} */
    let ctxCache = null;
    let lastParallax = "";
    let sanctuaryMollyMarked = false;

    // Předrenderované sprity světlušek: 1× gradient místo 54 nových gradientů v každém snímku
    /**
     * @param {string} inner
     * @param {string} mid
     * @returns {HTMLCanvasElement}
     */
    function makeGlowSprite(inner, mid) {
      const size = 64;
      const sprite = document.createElement("canvas");
      sprite.width = size;
      sprite.height = size;
      const sctx = sprite.getContext("2d");
      if (sctx) {
        const g = sctx.createRadialGradient(
          size / 2,
          size / 2,
          0.5,
          size / 2,
          size / 2,
          size / 2,
        );
        g.addColorStop(0, inner);
        g.addColorStop(0.42, mid);
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        sctx.fillStyle = g;
        sctx.fillRect(0, 0, size, size);
      }
      return sprite;
    }
    const goldFireflySprite = makeGlowSprite(
      "rgba(254, 243, 199, 1)",
      "rgba(251, 191, 36, 0.45)",
    );
    const greenFireflySprite = makeGlowSprite(
      "rgba(209, 250, 229, 1)",
      "rgba(52, 211, 153, 0.45)",
    );

    function resize() {
      if (!canvasEl || !stageWrapEl) return;
      const rect = stageWrapEl.getBoundingClientRect();
      width = Math.max(320, rect.width);
      height = Math.max(320, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvasEl.width = Math.round(width * dpr);
      canvasEl.height = Math.round(height * dpr);
      // Změna rozměru resetuje stav kontextu; instanci si ponecháme (shadowBlur override drží na objektu)
      ctxCache = ctxCache || optimizeCanvasContext(canvasEl.getContext("2d"));
    }

    resize();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (ro && stageWrapEl) ro.observe(stageWrapEl);

    // Gentle entrance shimmer when user enters /svet (especially after completing a deed!)
    try {
      const sp = new URLSearchParams(window.location.search);
      const ritualParam = sp.get("ritual");
      if (ritualParam === "lantern" || ritualParam === "water")
        ritualMode = "water";
      else if (ritualParam === "star" || ritualParam === "sky")
        ritualMode = "sky";
      else if (ritualParam === "wave") ritualMode = "wave";

      if (sp.get("just_lit") === "1" && !reducedMotion) {
        setTimeout(() => {
          triggerLightBloom(0.48, 0.26, "#fde68a", false, true);
        }, 280);
      }
    } catch {}

    const handleHashScroll = () => {
      try {
        if (typeof window !== "undefined" && window.location.hash === "#dech") {
          setTimeout(() => {
            const el = document.getElementById("dech");
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 320);
        }
      } catch {}
    };

    handleHashScroll();
    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", handleHashScroll);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} sx
     * @param {number} sy
     * @param {number} outerR
     * @param {number} innerR
     * @param {number} [rot]
     */
    function drawStarSpikes(ctx, sx, sy, outerR, innerR, rot = 0) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(rot);
      ctx.beginPath();
      for (let p = 0; p < 4; p++) {
        const a = (p * Math.PI) / 2;
        const aMid = a + Math.PI / 4;
        const rTip = p % 2 === 0 ? outerR * 1.18 : outerR * 0.92;
        if (p === 0) ctx.moveTo(Math.cos(a) * rTip, Math.sin(a) * rTip);
        else ctx.lineTo(Math.cos(a) * rTip, Math.sin(a) * rTip);
        ctx.lineTo(Math.cos(aMid) * innerR, Math.sin(aMid) * innerR);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /**
     * @param {number} nowMs
     */
    function render(nowMs) {
      const workStart = performance.now();
      const t = nowMs * 0.001;
      const rawDt = lastRenderMs ? nowMs - lastRenderMs : 16.7;
      lastRenderMs = nowMs;
      // k = 1 při 60 fps; fyzika (mlha, částice, vlny, Molly) tak běží stejně rychle na 60/120 Hz i při poklesu FPS
      const k = frameStep(rawDt);

      breathScale +=
        ((breathingActive ? targetBreathScale : 1) - breathScale) * 0.04 * k;

      // Adaptivní kvalita (jen směrem dolů, max. 1× za 2 s, ignoruje návrat ze skryté záložky).
      // Snižujeme jen když jsou snímky pomalé A zároveň je drahé samotné kreslení — úsporné režimy
      // (iOS Low Power Mode, Android spořič baterie) omezují rAF na 30 fps i u lehké scény, a tam by
      // snížení rozlišení jen zbytečně rozmazalo obraz.
      if (rawDt < 250) {
        slowFrameAvg = slowFrameAvg * 0.94 + rawDt * 0.06;
        if (
          nowMs > qualityCheckAt &&
          slowFrameAvg > 24 &&
          renderWorkAvg > 9 &&
          dprCap > 1
        ) {
          qualityCheckAt = nowMs + 2000;
          const prevDpr = Math.min(window.devicePixelRatio || 1, dprCap);
          dprCap = Math.max(1, dprCap - 0.5);
          slowFrameAvg = 16.7;
          // Přealokace plátna jen pokud se efektivní rozlišení opravdu změní (DPR 1 monitor nic nezíská)
          if (Math.min(window.devicePixelRatio || 1, dprCap) !== prevDpr)
            resize();
        }
      }

      // Smooth pointer parallax for painted backdrop layers
      const targetPX = pointer.active
        ? pointer.x
        : 0.5 + Math.sin(t * 0.25) * 0.08;
      const targetPY = pointer.active
        ? pointer.y
        : 0.5 + Math.cos(t * 0.2) * 0.06;
      const ease = 1 - Math.pow(0.94, k);
      pointer.smoothX += (targetPX - pointer.smoothX) * ease;
      pointer.smoothY += (targetPY - pointer.smoothY) * ease;
      if (!reducedMotion && parallaxEl) {
        const tx = ((0.5 - pointer.smoothX) * 12).toFixed(1);
        const ty = ((0.5 - pointer.smoothY) * 8).toFixed(1);
        const tf = `scale(1.032) translate3d(${tx}px, ${ty}px, 0)`;
        if (tf !== lastParallax) {
          lastParallax = tf;
          parallaxEl.style.transform = tf;
        }
      }

      if (canvasEl && width > 0 && height > 0) {
        const ctx =
          ctxCache ||
          (ctxCache = optimizeCanvasContext(canvasEl.getContext("2d")));
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, width, height);

          const isNight = atmosphereMode === "night";

          // 1A. DAWN MODE: Soft Feathered Volumetric Golden God-Rays (Zero Hard Polygon Edges)
          if (!isNight) {
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            for (let r = 0; r < 4; r++) {
              const sway = Math.sin(t * 0.32 + r * 1.4) * 0.045;
              const originX = width * (0.48 + r * 0.095);
              const originY = -height * 0.08;
              const angle = 0.24 - r * 0.09 + sway;
              const halfBeamW = width * (0.068 + (r % 2) * 0.022);
              const beamLen = height * 0.96;

              ctx.save();
              ctx.translate(originX, originY);
              ctx.rotate(angle);

              // Feathered perpendicular gradient so left & right edges melt invisibly into the sky
              const perpGrad = ctx.createLinearGradient(
                -halfBeamW,
                0,
                halfBeamW,
                0,
              );
              const peakAlpha = 0.095 - r * 0.012;
              perpGrad.addColorStop(0, "rgba(254, 243, 199, 0)");
              perpGrad.addColorStop(
                0.28,
                `rgba(253, 230, 138, ${(peakAlpha * 0.52).toFixed(3)})`,
              );
              perpGrad.addColorStop(
                0.5,
                `rgba(255, 251, 235, ${peakAlpha.toFixed(3)})`,
              );
              perpGrad.addColorStop(
                0.72,
                `rgba(253, 230, 138, ${(peakAlpha * 0.52).toFixed(3)})`,
              );
              perpGrad.addColorStop(1, "rgba(254, 243, 199, 0)");

              ctx.fillStyle = perpGrad;
              ctx.fillRect(-halfBeamW, 0, halfBeamW * 2, beamLen);
              ctx.restore();
            }
            ctx.restore();
          }

          // 1B. SILKY NORTHERN LIGHTS AURORA CURTAINS (Organic Sine Top & Bottom, Zero Flat Seams)
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          const auroraBase = isNight ? 0.28 : 0.075;
          for (let band = 0; band < 3; band++) {
            const baseY = height * (0.1 + band * 0.062);
            const curtainH = height * (0.13 - band * 0.015);
            const ag = ctx.createLinearGradient(
              0,
              baseY - 26,
              0,
              baseY + curtainH + 22,
            );
            ag.addColorStop(0, "rgba(52, 211, 153, 0)");
            ag.addColorStop(
              0.26,
              `rgba(52, 211, 153, ${(auroraBase * (1 - band * 0.16)).toFixed(3)})`,
            );
            ag.addColorStop(
              0.56,
              `rgba(56, 189, 248, ${(auroraBase * 0.72).toFixed(3)})`,
            );
            ag.addColorStop(
              0.78,
              `rgba(192, 132, 252, ${(isNight ? auroraBase * 0.36 : 0).toFixed(3)})`,
            );
            ag.addColorStop(1, "rgba(192, 132, 252, 0)");
            ctx.fillStyle = ag;

            ctx.beginPath();
            for (let sx = 0; sx <= width + 32; sx += 32) {
              const wave =
                Math.sin(sx * 0.0055 + t * (0.48 + band * 0.11) + band * 1.7) *
                  15 +
                Math.cos(sx * 0.01 - t * 0.32 + band) * 7;
              if (sx === 0) ctx.moveTo(0, baseY + wave - 18);
              else ctx.lineTo(sx, baseY + wave - 18);
            }
            for (let sx = width + 32; sx >= 0; sx -= 32) {
              const wave =
                Math.sin(sx * 0.0055 + t * (0.48 + band * 0.11) + band * 1.7) *
                  15 +
                Math.cos(sx * 0.01 - t * 0.32 + band) * 7;
              ctx.lineTo(sx, baseY + wave + curtainH + 18);
            }
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();

          // 2. Spontaneous Shooting Stars in Starry Night Mode
          if (isNight && !reducedMotion && t > nextMeteorAt) {
            nextMeteorAt = t + 4.2 + Math.random() * 4.5;
            const fromRight = Math.random() > 0.4;
            meteors.push({
              x: fromRight
                ? 0.65 + Math.random() * 0.28
                : 0.08 + Math.random() * 0.28,
              y: 0.05 + Math.random() * 0.14,
              vx: fromRight
                ? -(0.009 + Math.random() * 0.005)
                : 0.009 + Math.random() * 0.005,
              vy: 0.0038 + Math.random() * 0.0025,
              len: 68 + Math.random() * 45,
              life: 0,
              maxLife: 46,
            });
          }

          for (let m = meteors.length - 1; m >= 0; m--) {
            const mt = meteors[m];
            mt.life += k;
            mt.x += mt.vx * k;
            mt.y += mt.vy * k;
            const p = mt.life / mt.maxLife;
            if (p >= 1) {
              meteors.splice(m, 1);
              continue;
            }
            const alpha = Math.sin(p * Math.PI) * 0.92;
            const mx = mt.x * width;
            const my = mt.y * height;
            const angle = Math.atan2(mt.vy * height, mt.vx * width);
            const tx = mx - Math.cos(angle) * mt.len;
            const ty = my - Math.sin(angle) * mt.len;
            const mg = ctx.createLinearGradient(mx, my, tx, ty);
            mg.addColorStop(0, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
            mg.addColorStop(
              0.3,
              `rgba(253, 230, 138, ${(alpha * 0.7).toFixed(3)})`,
            );
            mg.addColorStop(1, "rgba(253, 230, 138, 0)");
            ctx.strokeStyle = mg;
            ctx.lineWidth = 2.1;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(tx, ty);
            ctx.stroke();
          }

          // 3. Twinkling Celestial Background Stars
          const starVis = isNight ? 0.9 : 0.34;
          for (const st of ambientStars) {
            const tw = 0.35 + 0.65 * Math.sin(t * 1.65 + st.twinkle);
            ctx.fillStyle = `rgba(255, 251, 235, ${(tw * starVis).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(st.x * width, st.y * height, st.r, 0, Math.PI * 2);
            ctx.fill();
          }

          // 4. Drifting Lake Mist Over the Mirror Pond (Modular Lake Renderer)
          drawLakeMist(ctx, {
            mistClouds,
            width,
            height,
            t,
            k,
            isNight,
            reducedMotion,
          });

          // 5. Breathing Sanctuary Aura on the Pond (Modular Lake Renderer)
          if (breathingActive) {
            drawBreathingPondAura(ctx, { width, height, breathScale });
          }

          // 6. Living Deed Constellation & Animated Filament Pulses
          const lights = activeLights;
          const skyLights = lights.filter((l) => l.zone === "sky");
          const waterLights = lights.filter((l) => l.zone === "water");

          if (skyLights.length >= 2) {
            ctx.save();
            ctx.strokeStyle = isNight
              ? "rgba(253, 230, 138, 0.34)"
              : "rgba(253, 230, 138, 0.24)";
            ctx.lineWidth = 1.25;
            ctx.setLineDash([4, 7]);
            ctx.beginPath();
            for (let i = 0; i < skyLights.length - 1; i++) {
              ctx.moveTo(skyLights[i].x * width, skyLights[i].y * height);
              ctx.lineTo(
                skyLights[i + 1].x * width,
                skyLights[i + 1].y * height,
              );
            }
            ctx.stroke();
            ctx.restore();
          }

          for (let c = constellationPulses.length - 1; c >= 0; c--) {
            const cp = constellationPulses[c];
            cp.progress += 0.024 * k;
            if (cp.progress >= 1.25) {
              constellationPulses.splice(c, 1);
              continue;
            }
            const headP = Math.min(1, cp.progress);
            const tailP = Math.max(0, cp.progress - 0.35);
            const xA = (cp.x1 + (cp.x2 - cp.x1) * tailP) * width;
            const yA = (cp.y1 + (cp.y2 - cp.y1) * tailP) * height;
            const xB = (cp.x1 + (cp.x2 - cp.x1) * headP) * width;
            const yB = (cp.y1 + (cp.y2 - cp.y1) * headP) * height;
            const lg = ctx.createLinearGradient(xA, yA, xB, yB);
            lg.addColorStop(0, "rgba(253, 230, 138, 0)");
            lg.addColorStop(
              1,
              `rgba(253, 230, 138, ${(cp.alpha * (1 - cp.progress / 1.25)).toFixed(3)})`,
            );
            ctx.strokeStyle = lg;
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(xA, yA);
            ctx.lineTo(xB, yB);
            ctx.stroke();
          }

          // 7. Ascending Launch Comets
          for (let c = activeComets.length - 1; c >= 0; c--) {
            const cm = activeComets[c];
            cm.progress += cm.speed * k;
            const p = Math.min(1, cm.progress);
            const inv = 1 - p;
            const cx =
              (inv * inv * cm.sx + 2 * inv * p * cm.cx + p * p * cm.tx) * width;
            const cy =
              (inv * inv * cm.sy + 2 * inv * p * cm.cy + p * p * cm.ty) *
              height;

            // Shed sparkling wake embers
            for (let s = 0; s < 2; s++) {
              burstParticles.push({
                x: cx / width + (Math.random() - 0.5) * 0.008,
                y: cy / height + (Math.random() - 0.5) * 0.008,
                vx: (Math.random() - 0.5) * 0.0008,
                vy: 0.0004 + Math.random() * 0.0008,
                r: 1.5 + Math.random() * 2.4,
                alpha: 0.92,
                color: s === 0 ? "#ffffff" : cm.color,
                life: 0,
                maxLife: 28 + Math.random() * 18,
                gravity: 0.00001,
                twinkle: Math.random() * 6.28,
              });
            }

            ctx.save();
            ctx.globalCompositeOperation = "screen";
            const cg = ctx.createRadialGradient(cx, cy, 1, cx, cy, 24);
            cg.addColorStop(0, "#ffffff");
            cg.addColorStop(0.35, cm.color);
            cg.addColorStop(1, "rgba(253, 230, 138, 0)");
            ctx.fillStyle = cg;
            ctx.beginPath();
            ctx.arc(cx, cy, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (cm.progress >= 1) {
              activeComets.splice(c, 1);
              detonateBloomAt(cm.tx, cm.ty, cm.color, cm.isWater, 0.95);
            }
          }

          // 8. Draw Sky Deed Stars + Shimmering Lake Reflections
          for (let i = 0; i < skyLights.length; i++) {
            const st = skyLights[i];
            const sx = st.x * width;
            const sy = st.y * height;
            const meta = ELEMENT_MAP[st.element] || SANCTUARY_ELEMENTS[3];
            const isSelected = selectedLight?.uid === st.uid;
            const isHovered = hoveredLight?.uid === st.uid;

            const prevScale = hoverScales[st.uid] || 1;
            const targetScale = isHovered || isSelected ? 1.42 : 1;
            const hScale = prevScale + (targetScale - prevScale) * 0.16;
            hoverScales[st.uid] = hScale;

            const pulse = (1 + 0.13 * Math.sin(t * 2.2 + i * 1.4)) * hScale;

            ctx.save();
            ctx.globalCompositeOperation = "screen";
            const haloR = (st.isMine ? 34 : 26) * pulse;
            const halo = ctx.createRadialGradient(sx, sy, 0.5, sx, sy, haloR);
            halo.addColorStop(0, "rgba(255, 255, 255, 0.95)");
            halo.addColorStop(0.2, meta.glow);
            halo.addColorStop(0.55, "rgba(253, 230, 138, 0.16)");
            halo.addColorStop(1, "rgba(253, 230, 138, 0)");
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (st.isMine || isSelected || isHovered) {
              ctx.strokeStyle =
                isSelected || isHovered
                  ? "rgba(255, 255, 255, 0.92)"
                  : "rgba(253, 230, 138, 0.68)";
              ctx.lineWidth = isSelected || isHovered ? 1.8 : 1.25;
              ctx.beginPath();
              ctx.arc(sx, sy, 15 * pulse, 0, Math.PI * 2);
              ctx.stroke();
            }

            // 8-point celestial diffraction starflare
            const flare = (st.isMine ? 13 : 10.5) * pulse;
            ctx.fillStyle = "#ffffff";
            drawStarSpikes(ctx, sx, sy, flare, 2.2 * hScale, 0);
            ctx.fillStyle = "rgba(254, 243, 199, 0.72)";
            drawStarSpikes(
              ctx,
              sx,
              sy,
              flare * 0.62,
              1.3 * hScale,
              Math.PI / 4,
            );

            // Shimmering water-stroke column reflection on the pond (Modular Lake Renderer)
            drawStarLakeReflection(ctx, {
              sx,
              height,
              t,
              i,
              hScale,
              starY: st.y,
            });
          }

          // 9. Concentric Bioluminescent Water Ripples (Modular Lake Renderer)
          drawWaterRipples(ctx, { waterRipples, width, height, k });

          // 10. Draw Floating Paper Lanterns on the Mirror Pond
          for (let i = 0; i < waterLights.length; i++) {
            const wl = waterLights[i];
            const isSelected = selectedLight?.uid === wl.uid;
            const isHovered = hoveredLight?.uid === wl.uid;

            const prevScale = hoverScales[wl.uid] || 1;
            const targetScale = isHovered || isSelected ? 1.36 : 1;
            const hScale = prevScale + (targetScale - prevScale) * 0.16;
            hoverScales[wl.uid] = hScale;

            // Gentle rocking when a water ripple passes underneath!
            let rippleTilt = 0;
            let rippleBob = 0;
            for (const rp of waterRipples) {
              const distPx = Math.hypot(
                (wl.x - rp.x) * width,
                (wl.y - rp.y) * height * 2.6,
              );
              const diff = Math.abs(distPx - rp.rx);
              if (diff < 18) {
                const amp = (1 - diff / 18) * (1 - rp.rx / rp.maxRx);
                rippleBob -= amp * 4.5;
                rippleTilt += Math.sin(distPx * 0.3) * amp * 0.14;
              }
            }

            const bobX = wl.x * width + Math.sin(t * 0.85 + i * 1.7) * 5.5;
            const bobY =
              wl.y * height + Math.cos(t * 1.25 + i * 2.1) * 2.4 + rippleBob;
            const meta = ELEMENT_MAP[wl.element] || SANCTUARY_ELEMENTS[2];
            const flicker = 0.94 + 0.06 * Math.sin(t * 7.5 + i * 2.3);

            const depthScale = Math.max(
              0.76,
              Math.min(1.18, 0.78 + (wl.y - 0.58) * 1.15),
            );
            const totalScale = hScale * depthScale;

            // Soft translucent warm underwater reflection pool & shimmering strokes (Modular Lake Renderer)
            const poolR = (wl.isMine ? 40 : 32) * totalScale * flicker;
            drawLanternWaterReflection(ctx, {
              bobX,
              bobY,
              poolR,
              totalScale,
              t,
              i,
              meta,
            });

            if (wl.lightType === "wave") {
              // Semantic Wave ("Vlna · Pomoc druhému"): 3 expanding concentric bioluminescent pond rings + droplet core
              ctx.save();
              ctx.translate(bobX, bobY);
              ctx.scale(totalScale, totalScale);

              for (let ringIdx = 0; ringIdx < 3; ringIdx++) {
                const phase = (t * 0.55 + i * 0.37 + ringIdx * 0.33) % 1;
                const rx = 6 + phase * (wl.isMine ? 24 : 20);
                const ry = rx * 0.38;
                const ringAlpha =
                  (1 - phase) *
                  (wl.isMine || isSelected || isHovered ? 0.78 : 0.48);
                ctx.strokeStyle =
                  ringIdx % 2 === 0
                    ? `rgba(110, 231, 183, ${ringAlpha.toFixed(3)})`
                    : `rgba(253, 230, 138, ${ringAlpha.toFixed(3)})`;
                ctx.lineWidth = isSelected || isHovered ? 1.85 : 1.3;
                ctx.beginPath();
                ctx.ellipse(0, 2, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
              }

              // Luminous water droplet core
              const dropAura = ctx.createRadialGradient(0, 0, 0.5, 0, 0, 10);
              dropAura.addColorStop(0, "rgba(209, 250, 229, 0.92)");
              dropAura.addColorStop(0.5, "rgba(52, 211, 153, 0.42)");
              dropAura.addColorStop(1, "rgba(16, 185, 129, 0)");
              ctx.fillStyle = dropAura;
              ctx.beginPath();
              ctx.arc(0, 0, 10, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(0, 0, 2.6 * flicker, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            } else {
              // Gentle water ring around lantern base
              ctx.strokeStyle =
                wl.isMine || isSelected || isHovered
                  ? "rgba(253, 230, 138, 0.72)"
                  : "rgba(253, 230, 138, 0.32)";
              ctx.lineWidth = isSelected || isHovered ? 1.6 : 1.05;
              ctx.beginPath();
              ctx.ellipse(
                bobX,
                bobY + 4.5 * totalScale,
                (wl.isMine ? 16 : 13) * totalScale +
                  Math.sin(t * 1.9 + i) * 1.5,
                3.8 * totalScale,
                0,
                0,
                Math.PI * 2,
              );
              ctx.stroke();

              // Crafted glowing paper lantern silhouette (Tōrō / lotus lantern)
              ctx.save();
              ctx.translate(bobX, bobY);
              ctx.rotate(Math.sin(t * 1.1 + i) * 0.04 + rippleTilt);
              ctx.scale(totalScale, totalScale);

              const lw = wl.isMine ? 13 : 11;
              const lh = wl.isMine ? 16 : 13.5;

              // Warm outer candle aura around the paper body
              const aura = ctx.createRadialGradient(
                0,
                -lh * 0.4,
                1,
                0,
                -lh * 0.4,
                lw * 1.6,
              );
              aura.addColorStop(0, "rgba(254, 243, 199, 0.55)");
              aura.addColorStop(1, "rgba(251, 146, 60, 0)");
              ctx.fillStyle = aura;
              ctx.beginPath();
              ctx.arc(0, -lh * 0.4, lw * 1.6, 0, Math.PI * 2);
              ctx.fill();

              // Floating wooden lotus base
              ctx.fillStyle = "rgba(62, 35, 16, 0.9)";
              ctx.beginPath();
              ctx.ellipse(0, 3.2, lw * 0.86, 2.4, 0, 0, Math.PI * 2);
              ctx.fill();

              // Glowing warm paper lantern body
              const bodyGrad = ctx.createLinearGradient(0, -lh + 3, 0, 3.2);
              bodyGrad.addColorStop(0, "#fde68a");
              bodyGrad.addColorStop(0.5, "#fffbeb");
              bodyGrad.addColorStop(1, "#fb923c");
              ctx.fillStyle = bodyGrad;
              ctx.beginPath();
              ctx.roundRect(-lw * 0.54, -lh + 3, lw * 1.08, lh, 4);
              ctx.fill();

              // Delicate top wooden cap & subtle vertical ribs
              ctx.strokeStyle = "rgba(120, 66, 24, 0.42)";
              ctx.lineWidth = 0.85;
              ctx.beginPath();
              ctx.moveTo(-lw * 0.22, -lh + 3.5);
              ctx.lineTo(-lw * 0.22, 2.8);
              ctx.moveTo(lw * 0.22, -lh + 3.5);
              ctx.lineTo(lw * 0.22, 2.8);
              ctx.stroke();

              ctx.fillStyle = "rgba(78, 44, 18, 0.82)";
              ctx.fillRect(-lw * 0.48, -lh + 2.4, lw * 0.96, 1.6);

              // Bright inner candle flame core
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.ellipse(
                0,
                -2.2 * flicker,
                2.3,
                3.9 * flicker,
                0,
                0,
                Math.PI * 2,
              );
              ctx.fill();

              ctx.restore();
            }
          }

          // 11. Expanding Luminous Shockwaves
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          for (let s = shockwaves.length - 1; s >= 0; s--) {
            const sw = shockwaves[s];
            sw.r += ((sw.maxR - sw.r) * 0.065 + 1.4) * k;
            const p = sw.r / sw.maxR;
            if (p >= 0.98) {
              shockwaves.splice(s, 1);
              continue;
            }
            const a = sw.alpha * (1 - p) * (1 - p);
            ctx.globalAlpha = Math.max(0, Math.min(1, a));
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = 2.4 * (1 - p * 0.6);
            ctx.beginPath();
            if (sw.isWater) {
              ctx.ellipse(
                sw.x * width,
                sw.y * height,
                sw.r,
                sw.r * 0.36,
                0,
                0,
                Math.PI * 2,
              );
            } else {
              ctx.arc(sw.x * width, sw.y * height, sw.r, 0, Math.PI * 2);
            }
            ctx.stroke();
          }
          ctx.restore();

          // 12. Ambient Fireflies (Gently Drawn Toward Warm Cursor!)
          for (const ff of fireflies) {
            if (!reducedMotion) {
              if (pointer.active) {
                const dx = pointer.x - ff.x;
                const dy = pointer.y - ff.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0.02 && dist < 0.24) {
                  ff.vx += (dx / dist) * 0.000018 * k;
                  ff.vy += (dy / dist) * 0.000018 * k;
                }
              }
              const damp = Math.pow(0.992, k);
              ff.vx *= damp;
              ff.vy *= damp;
              ff.x += (ff.vx + Math.sin(t * 0.7 + ff.phase) * 0.00022) * k;
              ff.y += (ff.vy + Math.cos(t * 0.85 + ff.phase) * 0.00016) * k;
              if (ff.x < 0.02) ff.x = 0.98;
              if (ff.x > 0.98) ff.x = 0.02;
              if (ff.y < 0.3) ff.vy = Math.abs(ff.vy) + 0.0001;
              if (ff.y > 0.95) ff.vy = -Math.abs(ff.vy) - 0.0001;
            }

            const breathSync = breathingActive
              ? 0.55 + (breathScale - 0.86) * 0.9
              : 1;
            const glowPulse =
              (0.3 + 0.7 * Math.max(0, Math.sin(t * 2.0 + ff.phase))) *
              breathSync;
            const fx = ff.x * width;
            const fy = ff.y * height;
            const fr = ff.size * 5.6;
            ctx.globalAlpha = Math.max(0, Math.min(1, glowPulse));
            ctx.drawImage(
              ff.gold ? goldFireflySprite : greenFireflySprite,
              fx - fr,
              fy - fr,
              fr * 2,
              fr * 2,
            );
          }
          ctx.globalAlpha = 1;

          // 12B. Sanctuary Molly — Stavový automat a animace chodící patronky po břehu tůně
          if (mollyJoyTimer > 0) {
            mollyBehavior = "JOY";
            mollyJoyTimer = Math.max(0, mollyJoyTimer - 0.02 * k);
            if (mollyJoyTimer === 0) {
              mollyBehavior =
                Math.abs(mollyPos.x - 0.24) < 0.03 ? "SIT_HOME" : "WALK_PATROL";
              mollyStateTimer = 4.0 + Math.random() * 2.5;
              if (mollyBehavior === "WALK_PATROL") {
                mollyTargetX = 0.24;
              }
            }
          } else if (!reducedMotion) {
            mollyStateTimer -= 0.016 * k;

            if (mollyBehavior === "SIT_HOME") {
              mollyFacing = -1;
              if (mollyStateTimer <= 0) {
                mollyBehavior = "WALK_PATROL";
                mollyTargetX = 0.32 + Math.random() * 0.11;
                mollyFacing = 1;
                mollyStateTimer = 14.0;
              }
            } else if (mollyBehavior === "WALK_PATROL") {
              const dx = mollyTargetX - mollyPos.x;
              const step = 0.00038 * k;
              mollyFacing = dx >= 0 ? 1 : -1;
              mollyWalkCycle += 0.16 * k;

              if (Math.abs(dx) <= step || mollyStateTimer <= 0) {
                mollyPos.x = mollyTargetX;
                mollyPos.y = getLakeshoreY(mollyPos.x);
                if (Math.abs(mollyPos.x - 0.24) < 0.02) {
                  mollyBehavior = "SIT_HOME";
                  mollyFacing = -1;
                  mollyStateTimer = 5.0 + Math.random() * 4.0;
                } else {
                  mollyBehavior = Math.random() < 0.65 ? "WATCH_LAKE" : "GROOM";
                  mollyFacing = 1;
                  mollyStateTimer = 3.5 + Math.random() * 3.0;
                }
              } else {
                mollyPos.x += Math.sign(dx) * step;
                mollyPos.y = getLakeshoreY(mollyPos.x);
                if (
                  Math.sin(mollyWalkCycle) > 0.96 &&
                  waterRipples.length < 18
                ) {
                  waterRipples.push({
                    x: mollyPos.x,
                    y: mollyPos.y + 0.024,
                    rx: 3,
                    maxRx: 28,
                    speed: 0.65,
                    alpha: 0.32,
                    color: "#fde68a",
                    lineWidth: 1.2,
                  });
                }
              }
            } else if (mollyBehavior === "WATCH_LAKE") {
              mollyFacing = 1;
              if (mollyStateTimer <= 0) {
                if (Math.random() < 0.45) {
                  mollyBehavior = "GROOM";
                  mollyStateTimer = 3.0 + Math.random() * 2.5;
                } else {
                  mollyBehavior = "WALK_PATROL";
                  mollyTargetX =
                    Math.random() < 0.7 ? 0.24 : 0.2 + Math.random() * 0.22;
                  mollyStateTimer = 14.0;
                }
              }
            } else if (mollyBehavior === "GROOM") {
              if (mollyStateTimer <= 0) {
                mollyBehavior = "WALK_PATROL";
                mollyTargetX = 0.24;
                mollyStateTimer = 14.0;
              }
            }
          } else {
            mollyBehavior = "SIT_HOME";
            mollyPos.x = 0.24;
            mollyPos.y = 0.72;
            mollyFacing = -1;
          }

          const mx = mollyPos.x * width;
          const my = mollyPos.y * height;
          const homeX = MOLLY_SANCTUARY_POS.x * width;
          const homeY = MOLLY_SANCTUARY_POS.y * height;
          const mollyScale = Math.min(1.18, Math.max(0.88, width / 800));

          // Světelné oblouky, které po rozsvícení skutku doletí ke břehu k Molly
          for (let a = mollyLightArcs.length - 1; a >= 0; a--) {
            const arc = mollyLightArcs[a];
            arc.progress = Math.min(
              1,
              arc.progress + (reducedMotion ? 0.25 : 0.032) * k,
            );
            const p = arc.progress;
            const u = 1 - p;
            const ax =
              (u * u * arc.sx + 2 * u * p * arc.cx + p * p * arc.tx) * width;
            const ay =
              (u * u * arc.sy + 2 * u * p * arc.cy + p * p * arc.ty) * height;

            ctx.save();
            ctx.globalCompositeOperation = "screen";
            ctx.strokeStyle = arc.color || "#fbbf24";
            ctx.globalAlpha = 0.55 * (1 - p * 0.35);
            ctx.lineWidth = 2.0;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(arc.sx * width, arc.sy * height);
            ctx.quadraticCurveTo(arc.cx * width, arc.cy * height, ax, ay);
            ctx.stroke();

            const tg = ctx.createRadialGradient(ax, ay, 1, ax, ay, 18);
            tg.addColorStop(0, "#ffffff");
            tg.addColorStop(0.4, arc.color || "#fbbf24");
            tg.addColorStop(1, "rgba(251, 191, 36, 0)");
            ctx.fillStyle = tg;
            ctx.beginPath();
            ctx.arc(ax, ay, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (p >= 1) {
              mollyJoyTimer = Math.max(mollyJoyTimer, 1.5);
              waterRipples.push({
                x: arc.tx,
                y: arc.ty + 0.035,
                rx: 5,
                maxRx: 82,
                speed: 1.1,
                alpha: 0.65,
                color: "#fde68a",
                lineWidth: 1.8,
              });
              mollyLightArcs.splice(a, 1);
            }
          }

          // Dynamický vodní odraz chodící Molly v hladině tůně
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          const reflGlow = ctx.createRadialGradient(
            mx,
            my + 24,
            2,
            mx,
            my + 24,
            42 + (mollyJoyTimer > 0 ? 16 : 0),
          );
          reflGlow.addColorStop(0, "rgba(253, 230, 138, 0.36)");
          reflGlow.addColorStop(0.5, "rgba(245, 158, 11, 0.16)");
          reflGlow.addColorStop(1, "rgba(245, 158, 11, 0)");
          ctx.fillStyle = reflGlow;
          ctx.beginPath();
          ctx.ellipse(mx, my + 24, 42, 14, 0, 0, Math.PI * 2);
          ctx.fill();

          for (let rRow = 0; rRow < 5; rRow++) {
            const ry = my + 12 + rRow * 5.2;
            const rxOff = Math.sin(t * 2.7 + rRow * 1.3) * (2.5 + rRow * 0.9);
            const rw = 18 - rRow * 2.5;
            ctx.strokeStyle =
              rRow % 2 === 0
                ? `rgba(245, 158, 11, ${(0.34 - rRow * 0.05).toFixed(3)})`
                : `rgba(190, 242, 100, ${(0.28 - rRow * 0.04).toFixed(3)})`;
            ctx.lineWidth = 1.6;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(mx + rxOff - rw, ry);
            ctx.lineTo(mx + rxOff + rw, ry);
            ctx.stroke();
          }
          ctx.restore();

          // Mechový pobřežní kámen pod Molly; jeho levý okraj sahá kousek za její místo
          const bx = (MOLLY_SANCTUARY_POS.x - 0.05) * width;
          ctx.save();
          const stoneGrad = ctx.createLinearGradient(
            bx - 18,
            homeY - 4,
            homeX + 28,
            homeY + 14,
          );
          stoneGrad.addColorStop(0, "rgba(20, 42, 31, 0.92)");
          stoneGrad.addColorStop(0.5, "rgba(31, 61, 45, 0.95)");
          stoneGrad.addColorStop(1, "rgba(15, 33, 24, 0.92)");
          ctx.fillStyle = stoneGrad;
          ctx.strokeStyle = "rgba(110, 231, 183, 0.35)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(
            (homeX + bx) * 0.5 + 4,
            homeY + 5,
            Math.abs(homeX - bx) * 0.65 + 24,
            9.5,
            -0.04,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Animace a proporce těla Molly
          const isWalking = mollyBehavior === "WALK_PATROL" && !reducedMotion;
          const isGrooming = mollyBehavior === "GROOM" && !reducedMotion;
          const isJoyful = mollyBehavior === "JOY" || mollyJoyTimer > 0;
          const isWatching = mollyBehavior === "WATCH_LAKE";

          const joyJump = isJoyful ? Math.abs(Math.sin(t * 9)) * -6.5 : 0;
          const walkBob = isWalking
            ? Math.abs(Math.sin(mollyWalkCycle * 2)) * -2.2
            : 0;
          const idleBreathe =
            !isWalking && !isJoyful ? Math.sin(t * 1.8) * 0.8 : 0;
          const mcy = my + joyJump + walkBob + idleBreathe;

          const legSwingA = isWalking ? Math.sin(mollyWalkCycle) * 4.5 : 0;
          const legSwingB = isWalking ? -Math.sin(mollyWalkCycle) * 4.5 : 0;
          const legLiftA = isWalking
            ? Math.max(0, -Math.cos(mollyWalkCycle)) * 2.2
            : 0;
          const legLiftB = isWalking
            ? Math.max(0, Math.cos(mollyWalkCycle)) * 2.2
            : 0;
          const groomPaw = isGrooming ? Math.sin(t * 6.5) * 3.5 : 0;
          const groomLift = isGrooming ? 8.0 + Math.abs(groomPaw) : 0;
          const headTilt = isGrooming ? Math.sin(t * 3.2) * 0.12 : 0;
          const watchHeadNod = isWatching ? Math.sin(t * 1.4) * 0.05 : 0;

          if (isJoyful) {
            const joyHalo = ctx.createRadialGradient(
              mx,
              mcy - 10,
              2,
              mx,
              mcy - 10,
              44,
            );
            joyHalo.addColorStop(0, "rgba(254, 243, 199, 0.55)");
            joyHalo.addColorStop(0.5, "rgba(251, 191, 36, 0.22)");
            joyHalo.addColorStop(1, "rgba(251, 191, 36, 0)");
            ctx.fillStyle = joyHalo;
            ctx.beginPath();
            ctx.arc(mx, mcy - 10, 44, 0, Math.PI * 2);
            ctx.fill();
          }

          // Kreslení postavy Molly s orientací (facing = 1 doprava, -1 doleva)
          ctx.save();
          ctx.translate(mx, mcy);
          ctx.scale(mollyFacing * mollyScale, mollyScale);

          // Želvovinový ocas (vychází zezadu z -x)
          const tailSpeed = isJoyful ? 5.8 : isWalking ? 3.4 : 2.2;
          const tailAmp = isJoyful ? 8.5 : isWalking ? 5.0 : 6.5;
          const tailSway = Math.sin(t * tailSpeed) * tailAmp;

          ctx.lineCap = "round";
          ctx.strokeStyle = "#1e1714";
          ctx.lineWidth = 5.2;
          ctx.beginPath();
          ctx.moveTo(-10, 1);
          ctx.bezierCurveTo(
            -22,
            -2 + tailSway * 0.4,
            -25,
            -16 + tailSway,
            -17 + tailSway * 0.6,
            -24,
          );
          ctx.stroke();

          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 3.4;
          ctx.beginPath();
          ctx.moveTo(-19, -8 + tailSway * 0.5);
          ctx.quadraticCurveTo(
            -22,
            -16 + tailSway * 0.8,
            -17 + tailSway * 0.6,
            -24,
          );
          ctx.stroke();

          // Tělo Molly
          ctx.fillStyle = "#1e1714";
          ctx.strokeStyle = "rgba(253, 230, 138, 0.42)";
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.ellipse(0, -4, 12.5, 14.5, 0.08, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.save();
          ctx.beginPath();
          ctx.ellipse(0, -4, 12.1, 14.1, 0.08, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = "#ea580c";
          ctx.beginPath();
          ctx.ellipse(5, -8, 6.8, 5.5, 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.ellipse(-4.5, -1, 6.2, 4.8, -0.25, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fde68a";
          ctx.beginPath();
          ctx.ellipse(-2, -6, 3.8, 4.4, 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Tlapky (zadní a přední s dynamickým krokem a očistou)
          ctx.fillStyle = "#1e1714";
          ctx.beginPath();
          ctx.ellipse(
            -4.5 + legSwingB,
            7.5 - legLiftB,
            3.6,
            2.5,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.ellipse(
            4.2 + legSwingA + (isGrooming ? groomPaw * 0.4 : 0),
            7.5 - legLiftA - groomLift,
            3.6,
            2.5,
            isGrooming ? 0.3 : 0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          // Hlava a obličej Molly
          const mhx = 2;
          const mhy = -19;

          ctx.save();
          ctx.translate(mhx, mhy);
          ctx.rotate(headTilt + watchHeadNod);

          // Ouška
          ctx.fillStyle = "#1e1714";
          ctx.beginPath();
          ctx.moveTo(-9, -3);
          ctx.lineTo(-11, -15);
          ctx.lineTo(-2, -8.5);
          ctx.closePath();
          ctx.fill();

          const earTwitch = isGrooming ? Math.sin(t * 6) * 1.5 : 0;
          ctx.fillStyle = "#ea580c";
          ctx.beginPath();
          ctx.moveTo(2, -8.5);
          ctx.lineTo(11 + earTwitch, -15);
          ctx.lineTo(9, -3);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#1e1714";
          ctx.beginPath();
          ctx.arc(0, 0, 10.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, 10.2, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.moveTo(-0.5, -12);
          ctx.lineTo(12, -12);
          ctx.lineTo(12, 12);
          ctx.lineTo(0.8, 12);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#fde68a";
          ctx.beginPath();
          ctx.ellipse(4, 3, 4.2, 3.2, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Smaragdové oči nebo blažené ^ ^ obloučky
          if (isJoyful || breathingActive) {
            ctx.strokeStyle = "#bef264";
            ctx.lineWidth = 2.0;
            [-4.1, 4.1].forEach((ex) => {
              ctx.beginPath();
              ctx.arc(ex, -0.3, 2.8, Math.PI * 1.15, Math.PI * 1.85);
              ctx.stroke();
            });
          } else {
            [-4.1, 4.1].forEach((ex) => {
              // Levná průsvitná záře místo shadowBlur (ten se počítá na CPU v každém snímku)
              ctx.fillStyle = "rgba(190, 242, 100, 0.3)";
              ctx.beginPath();
              ctx.ellipse(ex, -0.6, 3.9, 3.7, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#84cc16";
              ctx.beginPath();
              ctx.ellipse(ex, -0.6, 2.8, 2.6, 0, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#090d08";
              ctx.beginPath();
              ctx.ellipse(ex, -0.6, 1.15, 1.9, 0, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(ex - 0.8, -1.3, 0.75, 0, Math.PI * 2);
              ctx.fill();
            });
          }

          // Čumáček a vousky
          ctx.fillStyle = "#fb7185";
          ctx.beginPath();
          ctx.moveTo(-1.6, 2.2);
          ctx.lineTo(1.6, 2.2);
          ctx.lineTo(0, 3.9);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = "rgba(254, 243, 199, 0.8)";
          ctx.lineWidth = 0.85;
          [-1, 1].forEach((dir) => {
            [-1, 0, 1].forEach((row) => {
              ctx.beginPath();
              ctx.moveTo(dir * 5, 2.8 + row * 1.3);
              ctx.lineTo(
                dir * 13.5,
                2.1 + row * 2.0 + Math.sin(t * 3.5 + row) * 0.5,
              );
              ctx.stroke();
            });
          });

          ctx.restore(); // Konec rotace hlavy
          ctx.restore(); // Konec transformace těla Molly

          // Zlaté světlušky kroužící kolem Molly
          const headWorldX = mx + 2 * mollyFacing * mollyScale;
          const headWorldY = mcy - 19 * mollyScale;
          for (let fi = 0; fi < 3; fi++) {
            const fa = t * (1.2 + fi * 0.35) + fi * 2.1;
            const fox = headWorldX + Math.cos(fa) * (20 + fi * 6);
            const foy = headWorldY - 6 + Math.sin(fa * 1.4) * 9;
            const fg = ctx.createRadialGradient(fox, foy, 0.5, fox, foy, 8);
            fg.addColorStop(0, "rgba(255, 251, 235, 0.95)");
            fg.addColorStop(0.45, "rgba(251, 191, 36, 0.55)");
            fg.addColorStop(1, "rgba(251, 191, 36, 0)");
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.arc(fox, foy, 8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Srdíčka radosti nad Molly u tůně
          for (let hi = mollyLakeHearts.length - 1; hi >= 0; hi--) {
            const lh = mollyLakeHearts[hi];
            lh.x += lh.vx * k;
            lh.y += lh.vy * k;
            lh.alpha *= Math.pow(0.96, k);
            if (lh.alpha < 0.04) {
              mollyLakeHearts.splice(hi, 1);
              continue;
            }
            const hx = lh.x * width;
            const hy = lh.y * height;
            ctx.save();
            ctx.globalAlpha = lh.alpha;
            ctx.fillStyle = lh.color;
            ctx.beginPath();
            ctx.arc(hx - 2.2, hy, 2.5, 0, Math.PI * 2);
            ctx.arc(hx + 2.2, hy, 2.5, 0, Math.PI * 2);
            ctx.moveTo(hx - 4.5, hy + 1);
            ctx.lineTo(hx, hy + 6);
            ctx.lineTo(hx + 4.5, hy + 1);
            ctx.fill();
            ctx.restore();
          }

          // DOM atributy jen při změně — zápis v každém snímku vynucoval přepočet stylů
          if (canvasEl && !sanctuaryMollyMarked) {
            sanctuaryMollyMarked = true;
            canvasEl.dataset.sanctuaryMolly = "ready";
          }

          // 13. Cascading Stardust, Lantern Embers & Cursor Wake Particles
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          for (let i = burstParticles.length - 1; i >= 0; i--) {
            const bp = burstParticles[i];
            bp.life += k;
            bp.vy += bp.gravity * k;
            bp.x += bp.vx * k;
            bp.y += bp.vy * k;
            bp.vx *= Math.pow(0.984, k);
            bp.vy *= Math.pow(0.986, k);
            const fade = Math.max(0, 1 - bp.life / bp.maxLife);
            if (fade <= 0.01) {
              burstParticles.splice(i, 1);
              continue;
            }
            const tw = 0.72 + 0.28 * Math.sin(bp.life * 0.25 + bp.twinkle);
            const px = bp.x * width;
            const py = bp.y * height;
            const rad = (bp.r * fade + 0.8) * tw;

            ctx.globalAlpha = fade * bp.alpha * 0.38;
            ctx.fillStyle = bp.color;
            ctx.beginPath();
            ctx.arc(px, py, rad * 2.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = fade * bp.alpha;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(px, py, rad * 0.72, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // 14. Warm Bioluminescent Cursor Lantern Aura
          if (pointer.active) {
            const lx = pointer.x * width;
            const ly = pointer.y * height;
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            const lantern = ctx.createRadialGradient(lx, ly, 2, lx, ly, 115);
            lantern.addColorStop(0, "rgba(254, 243, 199, 0.34)");
            lantern.addColorStop(0.4, "rgba(110, 231, 183, 0.12)");
            lantern.addColorStop(1, "rgba(251, 191, 36, 0)");
            ctx.fillStyle = lantern;
            ctx.beginPath();
            ctx.arc(lx, ly, 115, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }
      // Skutečná cena vykreslení snímku (bez čekání na vsync) — pro adaptivní kvalitu
      renderWorkAvg =
        renderWorkAvg * 0.9 + (performance.now() - workStart) * 0.1;
      if (!isOffscreen) {
        rafId = requestAnimationFrame(render);
      }
    }

    let isOffscreen = false;
    let io = null;
    if (typeof IntersectionObserver !== "undefined" && stageWrapEl) {
      io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          if (!entry.isIntersecting) {
            isOffscreen = true;
            cancelAnimationFrame(rafId);
            rafId = 0;
            lastRenderMs = 0;
          } else if (isOffscreen) {
            isOffscreen = false;
            if (!rafId) rafId = requestAnimationFrame(render);
          }
        },
        { threshold: 0.02 },
      );
      io.observe(stageWrapEl);
    }

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      if (typeof window !== "undefined") {
        window.removeEventListener("hashchange", handleHashScroll);
      }
      if (toastTimer) clearTimeout(toastTimer);
    };
  });
</script>

<svelte:head>
  <title
    >Krajina dobra — živé dobré skutky a klidný dech | Akcelerátor altruismu</title
  >
</svelte:head>

<div class="sanctuary-page">
  <!-- =====================================================================
       1. IMMERSIVE KRAJINA DOBRA STAGE
       ===================================================================== -->
  <section class="sanctuary-stage">
    <div class="sanctuary-top">
      <div class="sanctuary-intro">
        <div class="kicker">KRAJINA DOBRA · TICHÉ ÚTOČIŠTĚ</div>
        <h1>
          Krajina, kde svítí <span class="serif-accent">dobré skutky</span>
        </h1>
        <p class="lead">
          Klikni na kterékoliv světlo pro inspiraci na dnešní skutek — nebo
          klikni na hladinu či oblohu a rozsviť ten svůj.
        </p>
        <div
          class="sanctuary-orientation-block"
          role="region"
          aria-label="Klíč ke Krajině dobra"
        >
          <div class="sanctuary-legend-strip">
            <span
              class="legend-chip legend-star"
              title="Klikni na hvězdu na obloze pro tip na ověřený skutek"
            >
              <span class="chip-symbol" aria-hidden="true">
                <AppIcon name="star" size={13} strokeWidth={2} />
              </span>
              <span class="chip-text"
                ><strong>Hvězdy</strong><span class="chip-sub">
                  · Inspirace</span
                ></span
              >
            </span>
            <span
              class="legend-chip legend-lantern"
              title="Dokončený skutek se rozsvítí jako plovoucí lucerna"
            >
              <span class="chip-symbol" aria-hidden="true">
                <AppIcon name="flame" size={13} strokeWidth={2} />
              </span>
              <span class="chip-text"
                ><strong>Lucerny</strong><span class="chip-sub">
                  · Tvé skutky</span
                ></span
              >
            </span>
            <span
              class="legend-chip legend-molly"
              title="Patronka Molly na břehu tůně"
            >
              <span class="chip-symbol chip-symbol-svg" aria-hidden="true">
                <AppIcon name="paw" size={13} class="sanctuary-paw-svg" />
              </span>
              <span class="chip-text"
                ><strong>Molly</strong></span
              >
            </span>

            <details class="sanctuary-guide-toggle">
              <summary
                class="guide-toggle-summary"
                aria-controls="sanctuary-guide-panel"
              >
                <span class="guide-pill-face">
                  <span class="guide-chevron" aria-hidden="true">
                    <AppIcon name="chevron-right" size={13} strokeWidth={2.2} />
                  </span>
                  <span>Jak to funguje</span>
                </span>
              </summary>
            </details>
          </div>

          <div id="sanctuary-guide-panel" class="guide-toggle-panel">
            <div class="guide-steps-grid">
              <div class="guide-step">
                <span class="guide-num">1</span>
                <div>
                  <strong>Vyber si světlo v krajině</strong>
                  <p>
                    Kliknutím na hvězdu na obloze otevřeš ověřený český skutek
                    na 2–15 minut.
                  </p>
                </div>
              </div>
              <div class="guide-step">
                <span class="guide-num">2</span>
                <div>
                  <strong>Udělej dobrý skutek</strong>
                  <p>
                    Pomoz zdarma online, v okolí nebo si zapiš vlastní dobrý
                    skutek do tůně.
                  </p>
                </div>
              </div>
              <div class="guide-step">
                <span class="guide-num">3</span>
                <div>
                  <strong>Rozsviť světlo</strong>
                  <p>
                    Každý skutek přidá do krajiny jedno světlo, které tu zůstane
                    svítit.
                  </p>
                </div>
              </div>
            </div>
            <div class="guide-cta-row">
              <button
                type="button"
                class="guide-action-btn"
                onclick={openRandomInspiringDeed}
              >
                <AppIcon name="sparkles" size={14} strokeWidth={2} />
                <span>Otevřít náhodný skutek na 2 minuty</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FULL-BLEED PAINTERLY ART + 60FPS INTERACTIVE DEED LIGHTS -->
    <div class="sanctuary-canvas-shell canvas-stage">
      <div
        class="atmosphere-controls sanctuary-hud"
        aria-label="Nastavení atmosféry a zvuku"
      >
        <div class="atmo-pill-group" role="group" aria-label="Denní doba">
          <button
            type="button"
            class="atmo-btn"
            class:active={atmosphereMode === "dawn"}
            onclick={() => (atmosphereMode = "dawn")}
            aria-pressed={atmosphereMode === "dawn"}
          >
            <AppIcon name="sunrise" size={15} strokeWidth={2} />
            <span
              ><span class="atmo-prefix">Zlaté</span>
              <span class="atmo-main">svítání</span></span
            >
          </button>
          <button
            type="button"
            class="atmo-btn"
            class:active={atmosphereMode === "night"}
            onclick={() => {
              hasActivatedNight = true;
              atmosphereMode = "night";
            }}
            aria-pressed={atmosphereMode === "night"}
          >
            <AppIcon name="moon" size={15} strokeWidth={2} />
            <span
              ><span class="atmo-prefix">Hvězdná</span>
              <span class="atmo-main">noc</span></span
            >
          </button>
        </div>

        <div class="hud-actions-group">
          <button
            type="button"
            class="explore-deed-btn"
            onclick={openRandomInspiringDeed}
            title="Inspirace náhodným dobrým skutkem"
          >
            <AppIcon name="sparkles" size={15} strokeWidth={2} />
            <span
              ><span class="hud-btn-prefix">Náhodný</span>
              <span class="hud-btn-main">skutek</span></span
            >
          </button>
          <button
            type="button"
            class="sound-btn"
            class:on={soundEnabled}
            onclick={toggleSound}
            title={soundEnabled ? "Vypnout tóny" : "Zapnout jemné tóny"}
            aria-label={soundEnabled ? "Vypnout tóny" : "Zapnout jemné tóny"}
            aria-pressed={soundEnabled}
          >
            <AppIcon
              name={soundEnabled ? "volume-2" : "volume-x"}
              size={15}
              strokeWidth={2}
            />
            <span class="sound-btn-label"
              >{soundEnabled ? "Tóny: zapnuto" : "Jemné tóny"}</span
            >
          </button>
        </div>
      </div>
      <div class="sanctuary-viewport-frame">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          class="sanctuary-viewport"
          bind:this={stageWrapEl}
          onclick={handleStageClick}
          onpointermove={handlePointerMove}
          onpointerleave={handlePointerLeave}
          role="application"
          aria-label="Krajina dobra: výběrem světla zobrazíš konkrétní dobrý skutek, dotykem hladiny nebo oblohy rozsvítíš vlastní skutek"
        >
          <div class="art-parallax-wrap" bind:this={parallaxEl}>
            {#if atmosphereMode === "night" || hasActivatedNight}
              <picture>
                <source
                  type="image/webp"
                  srcset="/art/sanctuary-twilight-800.webp 800w, /art/sanctuary-twilight.webp 1400w"
                  sizes="100vw"
                />
                <img
                  src="/art/sanctuary-twilight.jpg"
                  alt="Šumavské údolí s lesní tůní a světly dobrých skutků"
                  class="art-layer twilight"
                  decoding="async"
                  draggable="false"
                />
              </picture>
            {/if}

            <picture>
              <source
                type="image/webp"
                srcset="/art/sanctuary-dawn-800.webp 800w, /art/sanctuary-dawn.webp 1400w"
                sizes="100vw"
              />
              <img
                src="/art/sanctuary-dawn.jpg"
                alt=""
                aria-hidden="true"
                class="art-layer dawn"
                fetchpriority="high"
                decoding="async"
                style={`opacity: ${dawnLayerOpacity.toFixed(2)};`}
                draggable="false"
              />
            </picture>
          </div>

          <canvas bind:this={canvasEl} class="sanctuary-canvas world-canvas"
          ></canvas>

          <!-- MAGNETIC HOVER TOOLTIP PREVIEW -->
          {#if hoveredLight && (!selectedLight || selectedLight.uid !== hoveredLight.uid)}
            {@const hMeta =
              ELEMENT_MAP[hoveredLight.element] || SANCTUARY_ELEMENTS[3]}
            <div
              class="light-hover-pill"
              style={`left: ${Math.min(86, Math.max(14, hoveredLight.x * 100)).toFixed(1)}%; top: ${Math.max(10, hoveredLight.y * 100 - 6).toFixed(1)}%;`}
            >
              <AppIcon
                name={resolveIconKey(hMeta.icon)}
                size={13}
                strokeWidth={2}
                class={hMeta.icon === "paw" ? "sanctuary-paw-svg" : ""}
              />
              <strong>{cleanTitle(hoveredLight.title)}</strong>
              <span class="hp-hint">· klikni</span>
            </div>
          {/if}

          {#if gentleToast}
            <div class="gentle-toast" role="status">
              {#if gentleToastPaw}
                <AppIcon
                  name="paw"
                  size={14}
                  class="sanctuary-paw-svg toast-paw-svg"
                />
              {/if}
              <span>{gentleToast}</span>
            </div>
          {/if}

          <button
            type="button"
            class="molly-sanctuary-pill"
            onclick={(e) => {
              e.stopPropagation();
              petSanctuaryMolly();
            }}
            title="Pohladit patronku Molly u lesní tůně"
            aria-label="Pohladit patronku Molly"
          >
            <AppIcon name="paw" size={14} class="sanctuary-paw-svg" />
            <span class="molly-pill-label">Pohladit Molly</span>
          </button>
        </div>

        {#if nextSeedToPlant}
          <div class="seed-ceremony-banner">
            <div class="seed-orb" aria-hidden="true">
              <AppIcon name="sparkles" size={16} strokeWidth={2} />
            </div>
            <div class="seed-copy">
              <span class="seed-tag">TVŮJ DOKONČENÝ SKUTEK</span>
              <strong>{cleanTitle(nextSeedToPlant.title)}</strong>
              <span
                >Klikni na oblohu (hvězda) nebo na hladinu (lucerna) a rozsviť
                ho v krajině.</span
              >
            </div>
            <button
              type="button"
              class="seed-auto-btn"
              onclick={(e) => {
                e.stopPropagation();
                plantActiveSeed(nextSeedToPlant, { x: 0.48, y: 0.24 });
                triggerLightBloom(0.48, 0.24, "#fde68a", false, true);
                playChime("sky");
              }}
            >
              <AppIcon name="sparkles" size={14} strokeWidth={2} />
              <span>Rozsvítit hvězdu</span>
            </button>
          </div>
        {/if}

        {#if selectedLight}
          <DeedInspectorModal
            {selectedLight}
            elementMap={ELEMENT_MAP}
            onClose={() => (selectedLight = null)}
            onMarkDone={markDeedLightDone}
          />
        {/if}
      </div>
    </div>

    <!-- SLEEK COMPACT DEED DOCK -->
    <RitualBar
      bind:ritualMode
      bind:ritualInput
      {nextSeedToPlant}
      wishesCount={($sanctuaryWishes || []).length}
      onSubmit={submitRitualBar}
      onQuickDeed={addQuickOfflineDeed}
      onClearWishes={clearSanctuaryWishes}
    />
  </section>

  <!-- =====================================================================
       2. BREATHING EXERCISE — CLEAN PILLS + LUMINOUS LOTUS ORB
       ===================================================================== -->
  <BreathingPacer
    bind:breathingActive
    onBreathWave={(isInhale) => spawnBreathWave(isInhale)}
  />

  <!-- =====================================================================
       3. QUIET BORDERLESS HOPE WHISPER + OPTIONAL COLLAPSED DRAWERS
       ===================================================================== -->
  <section class="quiet-proof" aria-label="Dobrá zpráva z Česka">
    <span class="sec-kicker">DOBRÁ ZPRÁVA Z ČESKA</span>
    <p class="qp-text">
      <strong>{currentProof.title}.</strong>
      {currentProof.realWorldProof}
    </p>
    <div class="qp-actions">
      <button
        type="button"
        class="qp-next"
        onclick={() => (proofIndex = (proofIndex + 1) % HOPE_PROOFS.length)}
      >
        <AppIcon name="refresh-cw" size={14} strokeWidth={2} />
        <span>Další dobrá zpráva</span>
      </button>
      {#if currentProof.sourceUrl}
        <a
          href={currentProof.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="qp-link"
        >
          <span
            >Ověřeno {currentProof.verifiedAt || "2026"} · Zdroj: {currentProof.sourceLabel}</span
          >
          <AppIcon name="arrow-up-right" size={14} strokeWidth={2} />
        </a>
      {/if}
      <a href="/app/guided" class="qp-link">
        <span>Vybrat si dnešní skutek</span>
        <AppIcon name="arrow-right" size={14} strokeWidth={2} />
      </a>
    </div>
  </section>

  <ProgressDashboard
    {activeLights}
    {myDeedsCount}
    {latestStep}
    {inAppBrowserDetected}
  />
</div>

<style>
  .sanctuary-page {
    width: 100%;
    max-width: 1140px;
    margin: 0 auto;
    box-sizing: border-box;
    padding: 0.75rem 1.25rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  /* =========================================================================
     1. IMMERSIVE KRAJINA DOBRA STAGE (EDITORIAL DAYLIGHT)
     ========================================================================= */
  .sanctuary-stage {
    border-radius: 24px;
    padding: 1.25rem 1.4rem 1.15rem;
    background: var(--bg-surface);
    color: var(--ink-primary);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-subtle);
  }

  .sanctuary-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  .sanctuary-intro {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 100%;
    overflow-x: clip;
  }

  .kicker {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: var(--accent-warm-ink, #8f4b0e);
    margin-bottom: 0.24rem;
  }

  h1 {
    margin: 0 0 0.32rem 0;
    font-size: clamp(1.7rem, 2.9vw, 2.3rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: var(--ink-primary);
  }

  h1 .serif-accent {
    color: var(--accent-primary);
    font-weight: 400;
  }

  .lead {
    margin: 0;
    max-width: 58ch;
    color: var(--ink-secondary);
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .sanctuary-canvas-shell {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    max-width: 100%;
  }

  .sanctuary-canvas-shell .atmosphere-controls {
    position: static;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.38rem 0.48rem;
    border-radius: 16px;
    background: var(--bg-subtle);
    border: 1px solid var(--border-subtle);
    box-shadow: none;
    pointer-events: auto;
  }

  .atmo-pill-group {
    display: inline-flex;
    padding: 0.18rem;
    border-radius: 999px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    gap: 0.16rem;
  }

  .atmo-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    border: none;
    border-radius: 999px;
    padding: 0.42rem 0.85rem;
    background: transparent;
    color: var(--ink-secondary);
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition:
      background-color 0.18s ease,
      color 0.18s ease;
    white-space: nowrap;
  }

  .atmo-btn:hover {
    color: var(--ink-primary);
  }

  .atmo-btn.active {
    background: var(--accent-primary);
    color: #ffffff;
    box-shadow: var(--shadow-sm);
  }

  .hud-actions-group {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .explore-deed-btn,
  .sound-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    border: 1px solid var(--border-strong);
    border-radius: 999px;
    padding: 0.42rem 0.85rem;
    background: var(--bg-surface);
    color: var(--ink-primary);
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;
  }

  .explore-deed-btn:hover,
  .sound-btn:hover {
    background: var(--bg-canvas);
    border-color: var(--accent-primary);
  }

  .sound-btn.on {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    color: #ffffff;
  }

  .sanctuary-viewport-frame {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sanctuary-viewport {
    position: relative;
    width: 100%;
    aspect-ratio: auto;
    height: clamp(360px, 45dvh, 430px);
    min-height: 360px;
    max-height: 430px;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    background: #0d241b;
    border: 1px solid var(--border-strong);
    box-shadow: var(--shadow-md);
    user-select: none;
  }

  .art-parallax-wrap {
    position: absolute;
    inset: 0;
    will-change: transform;
    pointer-events: none;
  }

  .art-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    transition: opacity 0.9s var(--ease-gentle);
  }

  .sanctuary-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }

  /* Překryvy nad animovaným plátnem záměrně BEZ backdrop-filter kvůli plynulosti na mobilu */
  .light-hover-pill {
    position: absolute;
    transform: translate(-50%, -100%);
    padding: 0.36rem 0.75rem;
    border-radius: 999px;
    background: rgba(6, 24, 16, 0.94);
    border: 1px solid rgba(253, 230, 138, 0.48);
    color: var(--hero-dawn, #fef3c7);
    font-size: 0.76rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    white-space: nowrap;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
    z-index: 4;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  }

  .light-hover-pill strong {
    overflow: hidden;
    text-overflow: ellipsis;
    color: #ffffff;
  }

  .hp-hint {
    color: var(--bohemian-mist, #e6f0ea);
    font-weight: 700;
  }

  .seed-ceremony-banner {
    position: absolute;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    max-width: 620px;
    margin: 0 auto;
    padding: 0.72rem 1rem;
    border-radius: 16px;
    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 0.8rem;
    z-index: 4;
  }

  .seed-orb {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--accent-warm-tint);
    color: var(--accent-warm-ink, #8f4b0e);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .seed-copy {
    flex: 1;
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    display: flex;
    flex-direction: column;
    gap: 0.08rem;
    font-size: 0.8rem;
    color: var(--ink-secondary);
  }

  .seed-copy strong {
    color: var(--ink-primary);
    overflow-wrap: anywhere;
  }

  .seed-tag {
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--accent-warm-ink, #8f4b0e);
  }

  .seed-auto-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    border: none;
    border-radius: 999px;
    padding: 0.5rem 0.95rem;
    background: var(--accent-primary);
    color: #ffffff;
    font-family: inherit;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.16s ease;
  }

  .seed-auto-btn:hover {
    background: var(--accent-primary-hover);
  }

  .gentle-toast {
    position: absolute;
    top: 0.75rem;
    bottom: auto;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.52rem 1.05rem;
    border-radius: 999px;
    background: rgba(8, 30, 21, 0.95);
    border: 1px solid rgba(253, 230, 138, 0.45);
    color: var(--hero-dawn, #fef3c7);
    font-size: 0.83rem;
    font-weight: 600;
    z-index: 5;
    pointer-events: none;
    text-align: center;
    max-width: calc(100% - 1.5rem);
  }

  /* =========================================================================
     3. QUIET BORDERLESS HOPE WHISPER
     ========================================================================= */
  .quiet-proof {
    text-align: center;
    max-width: 700px;
    margin: 0 auto;
    padding: 0.35rem 0;
  }

  .sec-kicker {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: var(--accent-warm-ink, #8f4b0e);
    margin-bottom: 0.3rem;
  }

  .qp-text {
    margin: 0.25rem 0 0.7rem;
    font-size: 0.96rem;
    line-height: 1.62;
    color: var(--ink-secondary);
  }

  .qp-text strong {
    color: var(--ink-primary);
  }

  .qp-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem 0.9rem;
    flex-wrap: wrap;
    justify-content: center;
    font-size: 0.84rem;
    color: var(--ink-secondary, #3f574a);
  }

  .qp-next {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    background: var(--bg-surface);
    color: var(--ink-secondary);
    font-family: inherit;
    font-weight: 700;
    font-size: 0.84rem;
    cursor: pointer;
    padding: 0.45rem 0.85rem;
    transition:
      border-color 0.16s ease,
      color 0.16s ease;
  }

  .qp-next:hover {
    border-color: var(--accent-primary);
    color: var(--ink-primary);
  }

  .qp-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.45rem 0.75rem;
    border-radius: 999px;
    color: var(--accent-primary);
    font-weight: 800;
    text-decoration: none;
  }

  .qp-link:hover {
    text-decoration: underline;
    background: var(--bg-subtle);
  }

  /* =========================================================================
     SANCTUARY ORIENTATION BLOCK & ONBOARDING (R3)
     ========================================================================= */
  .sanctuary-orientation-block {
    margin-top: 0.6rem;
    display: block;
    max-width: 100%;
    box-sizing: border-box;
  }

  .sanctuary-legend-strip {
    display: flex;
    align-items: center;
    gap: 0.42rem;
    flex-wrap: wrap;
    max-width: 100%;
    box-sizing: border-box;
  }

  .legend-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    min-height: 30px;
    padding: 0.26rem 0.6rem;
    border-radius: 999px;
    background: var(--bg-subtle);
    border: 1px solid var(--border-subtle);
    color: var(--ink-secondary);
    font-size: 0.74rem;
    line-height: 1.2;
    cursor: default;
    user-select: none;
    box-sizing: border-box;
  }

  .legend-chip .chip-symbol {
    font-size: 0.8rem;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .legend-chip.legend-star .chip-symbol {
    color: var(--accent-warm-ink, #8f4b0e);
  }

  .legend-chip.legend-lantern .chip-symbol {
    color: var(--accent-warm-ink, #8f4b0e);
  }

  .legend-chip.legend-molly .chip-symbol {
    color: var(--accent-primary);
  }

  .legend-chip.legend-molly :global(.sanctuary-paw-svg) {
    color: var(--accent-primary);
    filter: none;
  }

  .molly-sanctuary-pill :global(.sanctuary-paw-svg),
  .gentle-toast :global(.sanctuary-paw-svg),
  .light-hover-pill :global(.sanctuary-paw-svg) {
    color: #fde68a;
    flex-shrink: 0;
  }

  :global(.toast-paw-svg) {
    display: inline-block;
    vertical-align: -2px;
    margin-right: 0.28rem;
  }

  .legend-chip .chip-text strong {
    font-weight: 700;
    color: var(--ink-primary);
  }

  .sanctuary-guide-toggle {
    flex: 0 0 auto;
    max-width: 100%;
    box-sizing: border-box;
    margin: -7px 0;
    padding: 0;
    background: transparent;
    border: none;
  }

  .guide-toggle-summary {
    list-style: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    min-width: 44px;
    padding: 0;
    border-radius: 999px;
    background: transparent;
    border: none;
    user-select: none;
    box-sizing: border-box;
  }

  .guide-toggle-summary::-webkit-details-marker {
    display: none;
  }

  .guide-pill-face {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    min-height: 30px;
    padding: 0.26rem 0.64rem;
    border-radius: 999px;
    background: var(--accent-warm-tint);
    border: 1px solid rgba(184, 101, 27, 0.35);
    color: var(--accent-warm-ink, #8f4b0e);
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1.2;
    box-sizing: border-box;
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;
  }

  .guide-toggle-summary:hover .guide-pill-face {
    background: var(--bg-subtle);
    border-color: var(--accent-warm);
  }

  .sanctuary-guide-toggle[open] .guide-pill-face {
    background: var(--bg-subtle);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }

  .guide-chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    color: var(--accent-warm-ink, #8f4b0e);
    transition:
      transform 0.18s ease,
      color 0.18s ease;
  }

  .sanctuary-guide-toggle[open] .guide-chevron {
    transform: rotate(90deg);
    color: var(--accent-primary);
  }

  .guide-toggle-panel {
    display: none;
    width: 100%;
    box-sizing: border-box;
    margin-top: 0.55rem;
    flex-direction: column;
    gap: 0.6rem;
    background: var(--bg-canvas);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    padding: 0.78rem 0.92rem;
  }

  .sanctuary-orientation-block:has(.sanctuary-guide-toggle[open])
    .guide-toggle-panel {
    display: flex;
  }

  .guide-steps-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .guide-step {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    font-size: 0.76rem;
    line-height: 1.38;
    color: var(--ink-secondary);
  }

  .guide-num {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--bg-subtle);
    border: 1px solid var(--border-strong);
    color: var(--accent-primary);
    font-weight: 800;
    font-size: 0.72rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 0.06rem;
  }

  .guide-step strong {
    display: block;
    color: var(--ink-primary);
    font-weight: 700;
    margin-bottom: 0.1rem;
  }

  .guide-step p {
    margin: 0;
    color: var(--ink-secondary);
    font-size: 0.74rem;
  }

  .guide-cta-row {
    margin-top: 0.25rem;
    display: flex;
  }

  .guide-action-btn {
    appearance: none;
    min-height: 44px;
    min-width: 44px;
    border: 1px solid var(--accent-primary);
    background: var(--accent-primary);
    color: #ffffff;
    border-radius: 999px;
    padding: 0.5rem 1rem;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    transition: background-color 0.16s ease;
  }

  .guide-action-btn:hover {
    background: var(--accent-primary-hover);
  }

  .molly-sanctuary-pill {
    position: absolute;
    bottom: 0.75rem;
    left: 0.75rem;
    z-index: 5;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.42rem 0.85rem;
    border-radius: 999px;
    border: 1px solid rgba(253, 230, 138, 0.55);
    background: rgba(10, 30, 21, 0.92);
    color: var(--hero-dawn, #fef3c7);
    font-family: inherit;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition:
      border-color 0.18s ease,
      background-color 0.18s ease;
  }

  .molly-sanctuary-pill:hover {
    border-color: rgba(253, 230, 138, 0.9);
    background: rgba(14, 42, 29, 0.96);
  }

  .molly-pill-label {
    display: inline-flex;
    align-items: center;
    gap: 0;
  }

  @media (max-width: 900px) {
    .sanctuary-stage {
      padding: 1.15rem 1.05rem;
      border-radius: 22px;
    }

    .sanctuary-viewport {
      height: clamp(280px, 44dvh, 380px);
      min-height: 280px;
      max-height: 380px;
    }
  }

  @media (max-width: 760px) {
    .guide-steps-grid {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
  }

  @media (max-width: 680px) {
    .sanctuary-page {
      padding: 0.35rem 0.65rem 2rem;
      gap: 1.15rem;
    }

    .sanctuary-stage {
      padding: 0.6rem 0.65rem 0.78rem;
      border-radius: 18px;
    }

    .sanctuary-top {
      flex-direction: column;
      align-items: stretch;
      gap: 0.35rem;
      margin-bottom: 0.42rem;
    }

    .kicker {
      font-size: 0.64rem;
      margin-bottom: 0.08rem;
    }

    h1 {
      font-size: 1.24rem;
      margin: 0;
    }

    .sanctuary-intro .lead {
      font-size: 0.78rem;
      line-height: 1.32;
      margin: 0.18rem 0 0.35rem;
    }

    .sanctuary-orientation-block {
      margin-top: 0.35rem;
    }

    .sanctuary-legend-strip {
      flex-wrap: nowrap;
      gap: 0.2rem;
    }

    .chip-sub {
      display: none;
    }

    .legend-chip {
      font-size: 0.65rem;
      min-height: 30px;
      padding: 0.22rem 0.36rem;
      gap: 0.2rem;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .sanctuary-guide-toggle {
      margin: -7px 0;
      flex-shrink: 0;
    }

    .guide-toggle-summary {
      min-height: 44px;
      min-width: 44px;
    }

    .guide-pill-face {
      min-height: 30px;
      font-size: 0.65rem;
      padding: 0.22rem 0.44rem;
      gap: 0.2rem;
      white-space: nowrap;
    }

    .guide-action-btn {
      min-height: 44px;
      width: 100%;
      justify-content: center;
    }

    .sanctuary-canvas-shell {
      gap: 0.42rem;
    }

    .sanctuary-canvas-shell .atmosphere-controls {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      flex-wrap: nowrap;
      gap: 0.3rem;
      padding: 0.28rem;
      border-radius: 14px;
    }

    .atmo-pill-group {
      display: inline-flex;
      width: auto;
      box-sizing: border-box;
      flex-shrink: 1;
      min-width: 0;
    }

    .atmo-btn {
      padding: 0.38rem 0.62rem;
      font-size: 0.74rem;
      min-height: 44px;
      min-width: 44px;
    }

    .atmo-prefix,
    .hud-btn-prefix {
      display: none;
    }

    .atmo-main,
    .hud-btn-main {
      text-transform: capitalize;
    }

    .hud-actions-group {
      display: inline-flex;
      width: auto;
      gap: 0.28rem;
      flex-shrink: 0;
      flex-wrap: nowrap;
    }

    .explore-deed-btn {
      padding: 0.38rem 0.68rem;
      font-size: 0.74rem;
      min-height: 44px;
      min-width: 44px;
    }

    .sound-btn {
      width: 44px;
      min-width: 44px;
      min-height: 44px;
      padding: 0;
      position: relative;
    }

    .sound-btn-label {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    .sanctuary-viewport {
      min-height: 300px;
      height: clamp(300px, 44dvh, 360px);
      max-height: 360px;
      aspect-ratio: auto;
      border-radius: 16px;
    }

    .seed-ceremony-banner {
      position: relative !important;
      top: auto !important;
      bottom: auto !important;
      left: auto !important;
      right: auto !important;
      transform: none !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      padding: 0.75rem 0.85rem;
      gap: 0.5rem;
    }

    .seed-ceremony-banner .seed-orb {
      display: none;
    }

    .seed-ceremony-banner .seed-auto-btn {
      width: 100%;
      min-height: 44px;
      text-align: center;
      justify-content: center;
    }

    .molly-sanctuary-pill {
      bottom: 0.45rem;
      left: 0.45rem;
      min-height: 44px;
      min-width: 44px;
      padding: 0.42rem 0.72rem;
      font-size: 0.72rem;
      max-width: calc(100% - 0.9rem);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      box-sizing: border-box;
    }
  }

  @media (max-width: 350px) {
    .sanctuary-legend-strip {
      flex-wrap: wrap;
    }
  }
</style>
