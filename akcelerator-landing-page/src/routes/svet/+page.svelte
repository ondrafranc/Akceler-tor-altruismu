<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
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
    restoreProgressFromBackupCode
  } from '../../lib/progress.js';
  import { MICRO_ACTIONS } from '../../lib/data/czech-actions.js';
  import { renderStoryCardPng } from '../../lib/storyCard.js';
  import { trackEvent } from '../../lib/analytics.js';
  import {
    fetchAmbientPulse,
    describeAmbientPulse,
    playMollyPurr,
    playMollyCrunch,
    playMollyMeow,
    playSanctuaryChime,
    isSoundMuted,
    toggleSoundMuted,
    isLowPowerDevice,
    getCanvasDprCap,
    optimizeCanvasContext,
    frameStep
  } from '../../lib/sensoryEngine.js';
  import {
    mollyState,
    feedMolly,
    feedMollyFromAction,
    unlockMollyTreat,
    petMolly,
    setMollyMood
  } from '../../lib/mollyStore.js';
  import { cleanTitle, isInAppBrowser } from '../../lib/utils.js';
  import DeedInspectorModal from '$lib/features/sanctuary/components/DeedInspectorModal.svelte';
  import RitualBar from '$lib/features/sanctuary/components/RitualBar.svelte';
  import BreathingPacer from '$lib/features/sanctuary/components/BreathingPacer.svelte';
  import ProgressDashboard from '$lib/features/sanctuary/components/ProgressDashboard.svelte';

  /** @type {any} */
  let ambientPulse = null;
  $: ambientPulseText = describeAmbientPulse(ambientPulse, {});

  /** @type {Record<string, typeof SANCTUARY_ELEMENTS[0]>} */
  const ELEMENT_MAP = Object.fromEntries(SANCTUARY_ELEMENTS.map((e) => [e.key, e]));
  /** @type {Record<string, typeof MICRO_ACTIONS[0]>} */
  const ACTION_BY_ID = Object.fromEntries(MICRO_ACTIONS.map((a) => [a.id, a]));

  // =========================================================================
  // ALWAYS 100% FULL BEAUTY — CONNECTED TO REAL GOOD DEEDS
  // =========================================================================
  /** @type {'dawn' | 'night'} */
  let atmosphereMode = 'dawn';
  $: dawnLayerOpacity = atmosphereMode === 'dawn' ? 0.88 : 0.14;

  // 8 living deed lights seeded across the sky & lake — each linked to a real Czech micro-action
  // 3 semantic light types: lantern (Osobní skutek), star (Inspirace), wave (Pomoc druhému)
  const INSPIRING_DEED_SEEDS = [
    { actionId: 'zvirata_utulek_online', element: 'animals', x: 0.32, y: 0.67, zone: 'water', lightType: 'lantern' },
    { actionId: 'missing_maps', element: 'care', x: 0.2, y: 0.21, zone: 'sky', lightType: 'star' },
    { actionId: 'knihobudka_kniha', element: 'community', x: 0.46, y: 0.74, zone: 'water', lightType: 'wave' },
    { actionId: 'birdlife_ptaci_pasti', element: 'nature', x: 0.41, y: 0.15, zone: 'sky', lightType: 'star' },
    { actionId: 'estudanky_pramen', element: 'nature', x: 0.66, y: 0.66, zone: 'water', lightType: 'lantern' },
    { actionId: 'remobil_telefon', element: 'nature', x: 0.62, y: 0.23, zone: 'sky', lightType: 'star' },
    { actionId: 'letters_seniors', element: 'community', x: 0.72, y: 0.26, zone: 'sky', lightType: 'star' },
    { actionId: 'trash_hero_uklid', element: 'nature', x: 0.81, y: 0.72, zone: 'water', lightType: 'wave' }
  ];

  /** @type {'water' | 'sky' | 'wave'} */
  let ritualMode = 'water';
  let ritualInput = '';
  let gentleToast = '';
  let toastTimer = null;

  function showGentleToast(msg) {
    gentleToast = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      gentleToast = '';
    }, 4400);
  }

  // =========================================================================
  // POLYPHONIC HARMONIC SOUNDSCAPE (SHARED AUDIO ENGINE)
  // =========================================================================
  let soundEnabled = false;
  let lastHoverChimeAt = 0;

  function toggleSound() {
    const muted = toggleSoundMuted();
    soundEnabled = !muted;
    if (soundEnabled) {
      playChime('water');
    }
  }

  /**
   * Lush polyphonic pentatonic synthesis delegated to the shared sensoryEngine AudioContext
   * (playSanctuaryChime(freq, dur, wave, delay)).
   * @param {'sky' | 'water' | 'breath_in' | 'breath_out' | 'hover'} type
   */
  function playChime(type) {
    if (!soundEnabled) return;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    if (type === 'hover') {
      playSanctuaryChime(pick([880, 987.77, 1046.5, 1174.66, 1318.51]), 0.55, 'sine', 0);
    } else if (type === 'sky') {
      // Arpeggiated celesta / harp triad
      const base = pick([523.25, 587.33, 659.25]);
      [1, 1.25, 1.5, 2].forEach((mult, idx) => {
        playSanctuaryChime(base * mult, 2.4, idx === 3 ? 'triangle' : 'sine', idx * 0.065);
      });
    } else if (type === 'water') {
      // Warm singing bowl + water harmonic overtone
      const base = pick([261.63, 293.66, 329.63, 392.0]);
      [1, 1.5, 2.01].forEach((mult, idx) => {
        playSanctuaryChime(base * mult, 2.8 - idx * 0.35, idx === 0 ? 'triangle' : 'sine', 0);
      });
    } else if (type === 'breath_in' || type === 'breath_out') {
      const freqs = type === 'breath_in' ? [261.63, 392.0] : [220.0, 329.63];
      freqs.forEach((f) => playSanctuaryChime(f, 3.1, 'sine', 0));
    }
  }

  // =========================================================================
  let breathingActive = false;
  let breathScale = 1;

  // =========================================================================
  // ONE QUIET GOOD NEWS WHISPER
  // =========================================================================
  let proofIndex = 0;
  $: currentProof = HOPE_PROOFS[proofIndex % HOPE_PROOFS.length];

  const ACTION_ALIASES = {
    'click-and-feed': 'zvirata_utulek_online',
    click_and_feed: 'zvirata_utulek_online',
    mapswipe: 'missing_maps'
  };

  function resolveActionFromSeed(rawSeed) {
    if (!rawSeed) return null;
    const cleaned = String(rawSeed).trim();
    if (!cleaned) return null;
    const aliased = ACTION_ALIASES[cleaned.toLowerCase()] || cleaned;
    if (ACTION_BY_ID[aliased]) return ACTION_BY_ID[aliased];
    const normUnder = aliased.replace(/-/g, '_').toLowerCase();
    const normHyphen = aliased.replace(/_/g, '-').toLowerCase();
    return (
      MICRO_ACTIONS.find(
        (a) =>
          a.id.toLowerCase() === normUnder ||
          a.id.toLowerCase().replace(/_/g, '-') === normHyphen
      ) || null
    );
  }

  let urlSeedPlanted = false;
  let lastUrlSeedKey = '';

  $: rawUrlSeed = $page?.url?.searchParams?.get('seed') || '';
  $: rawUrlTitle = $page?.url?.searchParams?.get('title') || '';
  $: currentUrlSeedKey = `${rawUrlSeed}::${rawUrlTitle}`;
  $: if (currentUrlSeedKey !== lastUrlSeedKey) {
    lastUrlSeedKey = currentUrlSeedKey;
    urlSeedPlanted = false;
  }

  function humanizeSeedFallback(raw) {
    const trimmed = cleanTitle(raw);
    if (!trimmed || /^(true|false|\d+|step|seed|custom)$/i.test(trimmed)) {
      return 'Dobrý skutek ze dneška';
    }
    const spaced = trimmed.replace(/[_-]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (!spaced) return 'Dobrý skutek ze dneška';
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  $: urlSeedFallback = (() => {
    if (urlSeedPlanted || (!rawUrlSeed && !rawUrlTitle)) return null;
    const matched = resolveActionFromSeed(rawUrlSeed);
    const baseTitle = rawUrlTitle
      ? cleanTitle(rawUrlTitle)
      : matched?.title
        ? cleanTitle(matched.title)
        : humanizeSeedFallback(rawUrlSeed);
    const resolvedTitle = String(baseTitle || '').slice(0, 110).trim();
    if (!resolvedTitle) return null;
    const resolvedId = matched?.id || rawUrlSeed || 'step';
    return {
      uid: `url-seed-${resolvedId}`,
      id: resolvedId,
      title: resolvedTitle,
      element: inferStepElement(matched || { id: resolvedId, title: resolvedTitle }),
      fromUrlFallback: true
    };
  })();

  $: latestStep = ($completedSteps || [])[($completedSteps || []).length - 1] || null;
  $: nextSeedToPlant = (() => {
    const unplanted = $unplantedSteps || [];
    if (urlSeedFallback) {
      const matchingUnplanted = unplanted.find((s) => s.id === urlSeedFallback.id);
      if (matchingUnplanted) {
        return rawUrlTitle
          ? { ...matchingUnplanted, title: urlSeedFallback.title }
          : matchingUnplanted;
      }
      return urlSeedFallback;
    }
    return unplanted[0] || null;
  })();
  $: completedActionIds = new Set(($completedSteps || []).map((s) => s.id));

  function plantActiveSeed(seed, pos) {
    if (!seed) return;
    urlSeedPlanted = true;
    if (seed.fromUrlFallback) {
      const entry = recordSmallWin({
        id: seed.id,
        title: seed.title,
        element: seed.element,
        surface: 'svet_seed_url',
        silent: true
      });
      if (entry) {
        plantStepLight(entry.uid, pos);
      }
    } else {
      plantStepLight(seed.uid, pos);
    }
  }

  function deterministicPos(index, elementKey) {
    const golden = (index * 0.61803398875 + 0.17) % 1;
    const x = 0.14 + golden * 0.72;
    const prefersWater = elementKey === 'community' || (elementKey === 'animals' && index % 2 === 1);
    const y = prefersWater
      ? 0.61 + ((index * 0.29) % 0.2)
      : 0.14 + ((index * 0.23 + 0.07) % 0.28);
    return { x, y, zone: prefersWater ? 'water' : 'sky' };
  }

  $: seededDeedLights = INSPIRING_DEED_SEEDS.filter((seed) => !completedActionIds.has(seed.actionId))
    .map((seed) => {
      const action = ACTION_BY_ID[seed.actionId];
      if (!action) return null;
      return {
        uid: `seed-${seed.actionId}`,
        actionId: seed.actionId,
        action,
        title: action.title,
        note: '',
        concreteImpact: action.concreteImpact || action.whyItMatters || action.desc,
        orgName: action.org || '',
        minutes: action.timeMinutes || 0,
        url: action.url || '',
        element: seed.element,
        x: seed.x,
        y: seed.y,
        zone: /** @type {'sky' | 'water'} */ (seed.zone),
        lightType: seed.lightType || (seed.zone === 'sky' ? 'star' : 'lantern'),
        isMine: false
      };
    })
    .filter(Boolean);

  $: userLights = [
    ...($completedSteps || [])
      .filter((s) => !s.awaitingPlant || s.plantedPos)
      .map((s, idx) => {
        const pos = s.plantedPos || deterministicPos(idx, s.element);
        const linked = ACTION_BY_ID[s.id] || null;
        const zone = /** @type {'sky' | 'water'} */ (pos.zone || (pos.y < 0.53 ? 'sky' : 'water'));
        return {
          uid: s.uid,
          actionId: s.id,
          action: linked,
          title: s.title,
          note: s.note || '',
          concreteImpact: s.concreteImpact || linked?.concreteImpact || linked?.whyItMatters || '',
          orgName: linked?.org || '',
          minutes: linked?.timeMinutes || 0,
          url: linked?.url || '',
          element: s.element || 'care',
          x: pos.x,
          y: pos.y,
          zone,
          lightType: s.lightType || pos.lightType || (zone === 'sky' ? 'star' : 'lantern'),
          isMine: true
        };
      }),
    ...($sanctuaryWishes || []).map((w) => {
      const zone = /** @type {'sky' | 'water'} */ (w.zone || (w.y < 0.53 ? 'sky' : 'water'));
      return {
        uid: w.uid,
        actionId: '',
        action: null,
        title: w.title,
        note: '',
        concreteImpact: 'Dobrý skutek přidaný do tvé Krajiny dobra.',
        orgName: '',
        minutes: 0,
        url: '',
        element: w.element || 'care',
        x: w.x,
        y: w.y,
        zone,
        lightType: w.lightType || (w.kind === 'wave' ? 'wave' : zone === 'sky' ? 'star' : 'lantern'),
        isMine: true
      };
    })
  ];

  $: activeLights = [...seededDeedLights, ...userLights];
  $: myDeedsCount = userLights.length;

  /** @type {any | null} */
  let selectedLight = null;
  /** @type {any | null} */
  let hoveredLight = null;

  // =========================================================================
  // SPECTACULAR 60FPS INTERACTIVE VISUAL EFFECTS ENGINE
  // =========================================================================
  /** @type {HTMLCanvasElement | null} */
  let canvasEl = null;
  /** @type {HTMLDivElement | null} */
  let stageWrapEl = null;
  /** @type {HTMLDivElement | null} */
  let parallaxEl = null;
  let pointer = { x: 0.5, y: 0.62, active: false, smoothX: 0.5, smoothY: 0.62 };
  let lastRippleAt = 0;
  let lastTrailAt = 0;
  let inAppBrowserDetected = false;

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

  // Patronka Molly u jezera v Krajině dobra (nx = 0.24, ny = 0.72) a její mistička hojnosti (nx = 0.19, ny = 0.73)
  const MOLLY_SANCTUARY_POS = { x: 0.24, y: 0.72 };
  const MOLLY_BOWL_POS = { x: 0.19, y: 0.73 };

  // Trajektorie břehu jezera: nx ≈ 0.20 až 0.44, ny ≈ 0.72 + (nx - 0.24) * 0.04
  function getLakeshoreY(nx) {
    return 0.72 + (nx - 0.24) * 0.04;
  }

  // Stavový automat chodící Molly: 'SIT_HOME' | 'WALK_PATROL' | 'WATCH_LAKE' | 'GROOM' | 'EAT_TREAT'
  let mollyPos = { x: 0.24, y: 0.72 };
  let mollyTargetX = 0.24;
  let mollyBehavior = 'SIT_HOME';
  let mollyStateTimer = 1.6;
  let mollyFacing = -1; // -1 = doleva k mističce / domů, 1 = doprava k jezeru
  let mollyWalkCycle = 0;

  /** @type {Array<{ sx: number, sy: number, cx: number, cy: number, tx: number, ty: number, progress: number, color: string }>} */
  let mollyTreatArcs = [];
  /** @type {Array<{ x: number, y: number, vx: number, vy: number, alpha: number, color: string }>} */
  let mollyLakeHearts = [];
  let mollyJoyTimer = 0;

  function launchSanctuaryTreatArc(fromNx = 0.48, fromNy = 0.34, color = '#fbbf24') {
    const tx = mollyPos.x;
    const ty = mollyPos.y - 0.02;
    if (mollyTreatArcs.length >= 12) {
      mollyTreatArcs.shift();
    }
    mollyTreatArcs.push({
      sx: fromNx,
      sy: fromNy,
      cx: (fromNx + tx) * 0.5,
      cy: Math.max(0.08, Math.min(fromNy, ty) - 0.18),
      tx,
      ty,
      progress: 0,
      color
    });
  }

  function feedSanctuaryMolly(fromNx = 0.36, fromNy = 0.42) {
    if ($mollyState.availableTreats > 0) {
      const res = feedMolly('sanctuary_molly', {
        action: { id: 'zvirata_utulek_online', element: 'animals', title: 'Pamlsek pro patronku Molly u jezera' }
      });
      petMolly('Mrrr… u lesní tůně v Krajině dobra je s tebou krásně!');
      launchSanctuaryTreatArc(fromNx, fromNy, res?.treat?.color || '#fbbf24');
      mollyJoyTimer = 2.4;
      mollyBehavior = 'EAT_TREAT';
      for (let i = 0; i < 8; i++) {
        mollyLakeHearts.push({
          x: mollyPos.x + (Math.random() - 0.5) * 0.04,
          y: mollyPos.y - 0.03 - Math.random() * 0.02,
          vx: (Math.random() - 0.5) * 0.001,
          vy: -0.0012 - Math.random() * 0.001,
          alpha: 1,
          color: i % 2 === 0 ? '#fbbf24' : '#f472b6'
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
        color: '#fde68a',
        lineWidth: 2.0
      });
      showGentleToast('🐾 Patronka Molly spokojeně přede u břehu tůně a chroupe zasloužený pamlsek.');
    } else {
      petMolly();
      mollyJoyTimer = 1.8;
      mollyBehavior = 'PET_BLISS';
      for (let i = 0; i < 6; i++) {
        mollyLakeHearts.push({
          x: mollyPos.x + (Math.random() - 0.5) * 0.04,
          y: mollyPos.y - 0.03 - Math.random() * 0.02,
          vx: (Math.random() - 0.5) * 0.001,
          vy: -0.0012 - Math.random() * 0.001,
          alpha: 1,
          color: '#f472b6'
        });
      }
      if (mollyLakeHearts.length > 32) {
        mollyLakeHearts.splice(0, mollyLakeHearts.length - 32);
      }
      showGentleToast('🐾 Hladíš Molly u břehu tůně. Přede a pamlsky si šetří na další dobrý skutek.');
    }
  }

  function spawnBreathWave(isInhale) {
    waterRipples.push({
      x: 0.5,
      y: 0.68,
      rx: isInhale ? 12 : 24,
      maxRx: 260,
      speed: isInhale ? 1.05 : 0.72,
      alpha: 0.55,
      color: isInhale ? '#6ee7b7' : '#fde68a',
      lineWidth: 2.2
    });
    shockwaves.push({
      x: 0.5,
      y: 0.58,
      r: 14,
      maxR: 210,
      alpha: 0.32,
      color: isInhale ? '#6ee7b7' : '#fde68a',
      isWater: true
    });
  }

  /**
   * Full cinematic bloom + comet/lantern ceremony
   */
  function triggerLightBloom(nx, ny, color = '#fde68a', isWater = false, withLaunchArc = false) {
    if (withLaunchArc) {
      const startX = Math.max(0.12, Math.min(0.88, nx + (Math.random() - 0.5) * 0.18));
      const startY = isWater ? 0.92 : 0.56;
      const ctrlX = (startX + nx) * 0.5 + (Math.random() - 0.5) * 0.14;
      const ctrlY = isWater ? Math.min(startY, ny) - 0.12 : Math.min(startY, ny) - 0.08;
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
        isWater
      });
      launchSanctuaryTreatArc(nx, ny, color || '#fbbf24');
    }

    detonateBloomAt(nx, ny, color, isWater, withLaunchArc ? 0.55 : 1);
  }

  function detonateBloomAt(nx, ny, color = '#fde68a', isWater = false, intensity = 1) {
    const count = Math.round((isWater ? 58 : 72) * intensity);
    const palette = isWater
      ? [color, '#fef3c7', '#6ee7b7', '#fed7aa']
      : [color, '#ffffff', '#fde68a', '#6ee7b7'];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      const speed = (0.0012 + Math.random() * 0.0056) * (0.7 + intensity * 0.35);
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
        twinkle: Math.random() * Math.PI * 2
      });
    }

    // Multi-ring luminous shockwave halos
    shockwaves.push({
      x: nx,
      y: ny,
      r: 4,
      maxR: isWater ? 145 : 175,
      alpha: 0.85 * intensity,
      color: '#ffffff',
      isWater
    });
    shockwaves.push({
      x: nx,
      y: ny,
      r: 10,
      maxR: isWater ? 210 : 240,
      alpha: 0.62 * intensity,
      color,
      isWater
    });

    // If sky star, connect glowing constellation filaments to nearest stars + reflect on pond
    if (!isWater) {
      const skyPeers = activeLights
        .filter((l) => l.zone === 'sky' && Math.hypot(l.x - nx, l.y - ny) > 0.02)
        .sort((a, b) => Math.hypot(a.x - nx, a.y - ny) - Math.hypot(b.x - nx, b.y - ny))
        .slice(0, 3);

      for (const peer of skyPeers) {
        constellationPulses.push({
          x1: nx,
          y1: ny,
          x2: peer.x,
          y2: peer.y,
          progress: 0,
          alpha: 0.9,
          color
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
        lineWidth: 1.6
      });
    }

    // Lush concentric water waves
    if (isWater || ny >= 0.5) {
      const wy = Math.max(0.57, ny);
      const waveColors = ['#ffffff', color, '#6ee7b7', '#fde68a'];
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
            lineWidth: 2.3 - idx * 0.35
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
    triggerLightBloom(next.x, next.y, ELEMENT_MAP[next.element]?.softColor || '#fde68a', next.zone === 'water', false);
    playChime(next.zone === 'water' ? 'water' : 'sky');
  }

  function markDeedLightDone(light) {
    if (!light) return;
    const semanticType = light.lightType || (light.zone === 'sky' ? 'star' : 'lantern');
    if (light.action) {
      const entry = recordSmallWin({
        id: light.action.id,
        title: light.action.title,
        surface: 'svet_landscape',
        element: light.element,
        lightType: semanticType,
        concreteImpact: light.concreteImpact,
        silent: true
      });
      if (entry) {
        plantStepLight(entry.uid, { x: light.x, y: light.y, lightType: semanticType });
      }
    } else {
      addSanctuaryWish({
        x: light.x,
        y: light.y,
        kind: semanticType === 'wave' ? 'wave' : 'deed',
        lightType: semanticType,
        title: light.title,
        element: light.element || 'care'
      });
    }
    triggerLightBloom(light.x, light.y, '#fde68a', light.zone === 'water', true);
    playChime(light.zone === 'water' ? 'water' : 'sky');
    selectedLight = { ...light, isMine: true };
    showGentleToast(
      `Dnes se ti povedlo něco dobrého. Nemusíš dělat nic dalšího. Můžeš si chvíli odpočinout.`
    );
  }

  function addQuickOfflineDeed(deed) {
    const isWater = ritualMode === 'water' || ritualMode === 'wave' || deed.lightType === 'wave';
    const semanticType =
      ritualMode === 'wave'
        ? 'wave'
        : ritualMode === 'sky'
        ? 'star'
        : deed.lightType || 'lantern';
    const nx = 0.16 + Math.random() * 0.68;
    const ny = isWater ? 0.61 + Math.random() * 0.19 : 0.14 + Math.random() * 0.26;
    const saved = addSanctuaryWish({
      x: nx,
      y: ny,
      kind: semanticType === 'wave' ? 'wave' : 'deed',
      lightType: semanticType,
      title: deed.title,
      element: deed.element
    });
    selectedLight = null;
    triggerLightBloom(saved.x, saved.y, ELEMENT_MAP[deed.element]?.softColor || '#fde68a', isWater, true);
    playChime(isWater ? 'water' : 'sky');
    showGentleToast(
      `Dnes se ti povedlo něco dobrého. Nemusíš dělat nic dalšího. Můžeš si chvíli odpočinout.`
    );
  }

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
      if (l.actionId === 'letters_seniors') {
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
        playChime('hover');
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
        color: atmosphereMode === 'night' ? '#6ee7b7' : '#fde68a',
        lineWidth: 1.35
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
        color: ny > 0.54 ? '#6ee7b7' : '#fde68a',
        life: 0,
        maxLife: 34 + Math.random() * 24,
        gravity: -0.00001,
        twinkle: Math.random() * 6.28
      });
    }
  }

  function handlePointerLeave() {
    pointer.active = false;
    hoveredLight = null;
  }

  function handleStageClick(e) {
    if (!stageWrapEl) return;
    const rect = stageWrapEl.getBoundingClientRect();
    const nx = Math.max(0.06, Math.min(0.94, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0.07, Math.min(0.88, (e.clientY - rect.top) / rect.height));

    // Přímé pohlazení / nakrmení patronky Molly na břehu jezera:
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
      feedSanctuaryMolly(nx, Math.max(0.24, ny - 0.16));
      return;
    }

    const closest = findClosestLight(nx, ny, rect.width, rect.height);

    if (closest && selectedLight && closest.uid === selectedLight.uid) {
      selectedLight = null;
      return;
    }

    if (closest && !nextSeedToPlant && !ritualInput.trim()) {
      selectedLight = closest;
      triggerLightBloom(closest.x, closest.y, ELEMENT_MAP[closest.element]?.softColor || '#fde68a', closest.zone === 'water', false);
      playChime(closest.zone === 'water' ? 'water' : 'sky');
      return;
    }

    if (selectedLight) {
      selectedLight = null;
      return;
    }

    if (nextSeedToPlant) {
      const elMeta = ELEMENT_MAP[nextSeedToPlant.element] || SANCTUARY_ELEMENTS[0];
      const isWater = ny >= 0.53;
      const semanticType = !isWater ? 'star' : ritualMode === 'wave' ? 'wave' : 'lantern';
      plantActiveSeed(nextSeedToPlant, { x: nx, y: ny, lightType: semanticType });
      triggerLightBloom(nx, ny, elMeta.softColor, isWater, true);
      playChime(isWater ? 'water' : 'sky');
      showGentleToast(
        'Dnes se ti povedlo něco dobrého. Nemusíš dělat nic dalšího. Můžeš si chvíli odpočinout.'
      );
      return;
    }

    const text = ritualInput.trim();
    if (!text) {
      triggerLightBloom(nx, ny, ny >= 0.53 ? '#fed7aa' : '#fde68a', ny >= 0.53, false);
      playChime(ny >= 0.53 ? 'water' : 'sky');
      return;
    }

    const clickedWater = ny >= 0.53;
    const semanticType = !clickedWater ? 'star' : ritualMode === 'wave' ? 'wave' : 'lantern';
    const yClamped = clickedWater ? Math.max(0.58, ny) : Math.min(0.46, ny);
    const saved = addSanctuaryWish({
      x: nx,
      y: yClamped,
      kind: semanticType === 'wave' ? 'wave' : 'deed',
      lightType: semanticType,
      title: text,
      element: clickedWater ? 'community' : 'care'
    });
    ritualInput = '';
    selectedLight = null;
    triggerLightBloom(saved.x, saved.y, clickedWater ? '#fed7aa' : '#fde68a', clickedWater, true);
    playChime(clickedWater ? 'water' : 'sky');
    showGentleToast(
      'Dnes se ti povedlo něco dobrého. Nemusíš dělat nic dalšího. Můžeš si chvíli odpočinout.'
    );
  }

  function submitRitualBar() {
    const isWater = ritualMode === 'water' || ritualMode === 'wave';
    const semanticType = ritualMode === 'wave' ? 'wave' : ritualMode === 'sky' ? 'star' : 'lantern';
    const nx = 0.18 + Math.random() * 0.64;
    const ny = isWater ? 0.62 + Math.random() * 0.18 : 0.15 + Math.random() * 0.25;
    const text = ritualInput.trim();
    const saved = addSanctuaryWish({
      x: nx,
      y: ny,
      kind: semanticType === 'wave' ? 'wave' : 'deed',
      lightType: semanticType,
      title: text || 'Drobný dobrý skutek ze dneška',
      element: isWater ? 'community' : 'care'
    });
    ritualInput = '';
    selectedLight = null;
    triggerLightBloom(saved.x, saved.y, semanticType === 'wave' ? '#6ee7b7' : isWater ? '#fed7aa' : '#fde68a', isWater, true);
    playChime(isWater ? 'water' : 'sky');
    showGentleToast(
      'Dnes se ti povedlo něco dobrého. Nemusíš dělat nic dalšího. Můžeš si chvíli odpočinout.'
    );
  }

  onMount(() => {
    let rafId = 0;
    inAppBrowserDetected = isInAppBrowser();
    soundEnabled = !isSoundMuted();
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lowPower = isLowPowerDevice();
    const fireflies = Array.from({ length: lowPower ? 30 : 54 }, (_, i) => ({
      x: Math.random(),
      y: 0.36 + Math.random() * 0.58,
      vx: (Math.random() - 0.5) * 0.00042,
      vy: (Math.random() - 0.5) * 0.00028,
      phase: i * 1.37,
      size: 1.5 + (i % 4) * 0.85,
      gold: i % 3 !== 0
    }));

    const ambientStars = Array.from({ length: 78 }, (_, i) => ({
      x: ((i * 73 + 19) % 97) / 97,
      y: ((i * 41 + 5) % 45) / 100 + 0.02,
      r: 0.55 + (i % 3) * 0.48,
      twinkle: i * 0.91
    }));

    const mistClouds = [
      { x: 0.22, y: 0.57, w: 0.38, h: 0.065, speed: 0.00018, phase: 0.4 },
      { x: 0.68, y: 0.61, w: 0.44, h: 0.075, speed: -0.00014, phase: 2.1 },
      { x: 0.45, y: 0.66, w: 0.5, h: 0.06, speed: 0.00012, phase: 4.0 }
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
    let lastParallax = '';
    let lastTreatsAttr = '';

    // Předrenderované sprity světlušek: 1× gradient místo 54 nových gradientů v každém snímku
    function makeGlowSprite(inner, mid) {
      const size = 64;
      const sprite = document.createElement('canvas');
      sprite.width = size;
      sprite.height = size;
      const sctx = sprite.getContext('2d');
      if (sctx) {
        const g = sctx.createRadialGradient(size / 2, size / 2, 0.5, size / 2, size / 2, size / 2);
        g.addColorStop(0, inner);
        g.addColorStop(0.42, mid);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sctx.fillStyle = g;
        sctx.fillRect(0, 0, size, size);
      }
      return sprite;
    }
    const goldFireflySprite = makeGlowSprite('rgba(254, 243, 199, 1)', 'rgba(251, 191, 36, 0.45)');
    const greenFireflySprite = makeGlowSprite('rgba(209, 250, 229, 1)', 'rgba(52, 211, 153, 0.45)');

    function resize() {
      if (!canvasEl || !stageWrapEl) return;
      const rect = stageWrapEl.getBoundingClientRect();
      width = Math.max(320, rect.width);
      height = Math.max(320, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvasEl.width = Math.round(width * dpr);
      canvasEl.height = Math.round(height * dpr);
      // Změna rozměru resetuje stav kontextu; instanci si ponecháme (shadowBlur override drží na objektu)
      ctxCache = ctxCache || optimizeCanvasContext(canvasEl.getContext('2d'));
    }

    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro && stageWrapEl) ro.observe(stageWrapEl);

    // Gentle entrance shimmer when user enters /svet (especially after completing a deed!)
    try {
      const sp = new URLSearchParams(window.location.search);
      const ritualParam = sp.get('ritual');
      if (ritualParam === 'lantern' || ritualParam === 'water') ritualMode = 'water';
      else if (ritualParam === 'star' || ritualParam === 'sky') ritualMode = 'sky';
      else if (ritualParam === 'wave') ritualMode = 'wave';

      if (sp.get('just_lit') === '1' && !reducedMotion) {
        setTimeout(() => {
          triggerLightBloom(0.48, 0.26, '#fde68a', false, true);
        }, 280);
      }
    } catch {}

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

    function render(nowMs) {
      const workStart = performance.now();
      const t = nowMs * 0.001;
      const rawDt = lastRenderMs ? nowMs - lastRenderMs : 16.7;
      lastRenderMs = nowMs;
      // k = 1 při 60 fps; fyzika (mlha, částice, vlny, Molly) tak běží stejně rychle na 60/120 Hz i při poklesu FPS
      const k = frameStep(rawDt);

      // Adaptivní kvalita (jen směrem dolů, max. 1× za 2 s, ignoruje návrat ze skryté záložky).
      // Snižujeme jen když jsou snímky pomalé A zároveň je drahé samotné kreslení — úsporné režimy
      // (iOS Low Power Mode, Android spořič baterie) omezují rAF na 30 fps i u lehké scény, a tam by
      // snížení rozlišení jen zbytečně rozmazalo obraz.
      if (rawDt < 250) {
        slowFrameAvg = slowFrameAvg * 0.94 + rawDt * 0.06;
        if (nowMs > qualityCheckAt && slowFrameAvg > 24 && renderWorkAvg > 9 && dprCap > 1) {
          qualityCheckAt = nowMs + 2000;
          const prevDpr = Math.min(window.devicePixelRatio || 1, dprCap);
          dprCap = Math.max(1, dprCap - 0.5);
          slowFrameAvg = 16.7;
          // Přealokace plátna jen pokud se efektivní rozlišení opravdu změní (DPR 1 monitor nic nezíská)
          if (Math.min(window.devicePixelRatio || 1, dprCap) !== prevDpr) resize();
        }
      }

      // Smooth pointer parallax for painted backdrop layers
      const targetPX = pointer.active ? pointer.x : 0.5 + Math.sin(t * 0.25) * 0.08;
      const targetPY = pointer.active ? pointer.y : 0.5 + Math.cos(t * 0.2) * 0.06;
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
        const ctx = ctxCache || (ctxCache = optimizeCanvasContext(canvasEl.getContext('2d')));
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, width, height);

          const isNight = atmosphereMode === 'night';

          // 1A. DAWN MODE: Soft Feathered Volumetric Golden God-Rays (Zero Hard Polygon Edges)
          if (!isNight) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
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
              const perpGrad = ctx.createLinearGradient(-halfBeamW, 0, halfBeamW, 0);
              const peakAlpha = 0.095 - r * 0.012;
              perpGrad.addColorStop(0, 'rgba(254, 243, 199, 0)');
              perpGrad.addColorStop(0.28, `rgba(253, 230, 138, ${(peakAlpha * 0.52).toFixed(3)})`);
              perpGrad.addColorStop(0.5, `rgba(255, 251, 235, ${peakAlpha.toFixed(3)})`);
              perpGrad.addColorStop(0.72, `rgba(253, 230, 138, ${(peakAlpha * 0.52).toFixed(3)})`);
              perpGrad.addColorStop(1, 'rgba(254, 243, 199, 0)');

              ctx.fillStyle = perpGrad;
              ctx.fillRect(-halfBeamW, 0, halfBeamW * 2, beamLen);
              ctx.restore();
            }
            ctx.restore();
          }

          // 1B. SILKY NORTHERN LIGHTS AURORA CURTAINS (Organic Sine Top & Bottom, Zero Flat Seams)
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          const auroraBase = isNight ? 0.28 : 0.075;
          for (let band = 0; band < 3; band++) {
            const baseY = height * (0.1 + band * 0.062);
            const curtainH = height * (0.13 - band * 0.015);
            const ag = ctx.createLinearGradient(0, baseY - 26, 0, baseY + curtainH + 22);
            ag.addColorStop(0, 'rgba(52, 211, 153, 0)');
            ag.addColorStop(0.26, `rgba(52, 211, 153, ${(auroraBase * (1 - band * 0.16)).toFixed(3)})`);
            ag.addColorStop(0.56, `rgba(56, 189, 248, ${(auroraBase * 0.72).toFixed(3)})`);
            ag.addColorStop(0.78, `rgba(192, 132, 252, ${(isNight ? auroraBase * 0.36 : 0).toFixed(3)})`);
            ag.addColorStop(1, 'rgba(192, 132, 252, 0)');
            ctx.fillStyle = ag;

            ctx.beginPath();
            for (let sx = 0; sx <= width + 32; sx += 32) {
              const wave =
                Math.sin(sx * 0.0055 + t * (0.48 + band * 0.11) + band * 1.7) * 15 +
                Math.cos(sx * 0.01 - t * 0.32 + band) * 7;
              if (sx === 0) ctx.moveTo(0, baseY + wave - 18);
              else ctx.lineTo(sx, baseY + wave - 18);
            }
            for (let sx = width + 32; sx >= 0; sx -= 32) {
              const wave =
                Math.sin(sx * 0.0055 + t * (0.48 + band * 0.11) + band * 1.7) * 15 +
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
              x: fromRight ? 0.65 + Math.random() * 0.28 : 0.08 + Math.random() * 0.28,
              y: 0.05 + Math.random() * 0.14,
              vx: fromRight ? -(0.009 + Math.random() * 0.005) : 0.009 + Math.random() * 0.005,
              vy: 0.0038 + Math.random() * 0.0025,
              len: 68 + Math.random() * 45,
              life: 0,
              maxLife: 46
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
            mg.addColorStop(0.3, `rgba(253, 230, 138, ${(alpha * 0.7).toFixed(3)})`);
            mg.addColorStop(1, 'rgba(253, 230, 138, 0)');
            ctx.strokeStyle = mg;
            ctx.lineWidth = 2.1;
            ctx.lineCap = 'round';
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

          // 4. Drifting Lake Mist Over the Mirror Pond
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          for (const mc of mistClouds) {
            if (!reducedMotion) {
              mc.x += mc.speed * k;
              if (mc.x > 1.25) mc.x = -0.25;
              if (mc.x < -0.25) mc.x = 1.25;
            }
            const mx = mc.x * width;
            const my = mc.y * height + Math.sin(t * 0.5 + mc.phase) * 4;
            const mw = mc.w * width;
            const mh = mc.h * height;
            const mistGrad = ctx.createRadialGradient(mx, my, 4, mx, my, mw * 0.55);
            mistGrad.addColorStop(
              0,
              isNight ? 'rgba(110, 231, 183, 0.085)' : 'rgba(254, 249, 235, 0.13)'
            );
            mistGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = mistGrad;
            ctx.beginPath();
            ctx.ellipse(mx, my, mw * 0.55, mh, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // 5. Breathing Sanctuary Aura on the Pond
          if (breathingActive) {
            const pulseR = width * (0.16 + (breathScale - 0.86) * 0.24);
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const bg = ctx.createRadialGradient(
              width * 0.5,
              height * 0.62,
              8,
              width * 0.5,
              height * 0.62,
              pulseR
            );
            bg.addColorStop(0, 'rgba(253, 230, 138, 0.32)');
            bg.addColorStop(0.5, 'rgba(52, 211, 153, 0.16)');
            bg.addColorStop(1, 'rgba(52, 211, 153, 0)');
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.ellipse(width * 0.5, height * 0.62, pulseR, pulseR * 0.42, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // 6. Living Deed Constellation & Animated Filament Pulses
          const lights = activeLights;
          const skyLights = lights.filter((l) => l.zone === 'sky');
          const waterLights = lights.filter((l) => l.zone === 'water');

          if (skyLights.length >= 2) {
            ctx.save();
            ctx.strokeStyle = isNight ? 'rgba(253, 230, 138, 0.34)' : 'rgba(253, 230, 138, 0.24)';
            ctx.lineWidth = 1.25;
            ctx.setLineDash([4, 7]);
            ctx.beginPath();
            for (let i = 0; i < skyLights.length - 1; i++) {
              ctx.moveTo(skyLights[i].x * width, skyLights[i].y * height);
              ctx.lineTo(skyLights[i + 1].x * width, skyLights[i + 1].y * height);
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
            lg.addColorStop(0, 'rgba(253, 230, 138, 0)');
            lg.addColorStop(1, `rgba(253, 230, 138, ${(cp.alpha * (1 - cp.progress / 1.25)).toFixed(3)})`);
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
            const cx = (inv * inv * cm.sx + 2 * inv * p * cm.cx + p * p * cm.tx) * width;
            const cy = (inv * inv * cm.sy + 2 * inv * p * cm.cy + p * p * cm.ty) * height;

            // Shed sparkling wake embers
            for (let s = 0; s < 2; s++) {
              burstParticles.push({
                x: cx / width + (Math.random() - 0.5) * 0.008,
                y: cy / height + (Math.random() - 0.5) * 0.008,
                vx: (Math.random() - 0.5) * 0.0008,
                vy: 0.0004 + Math.random() * 0.0008,
                r: 1.5 + Math.random() * 2.4,
                alpha: 0.92,
                color: s === 0 ? '#ffffff' : cm.color,
                life: 0,
                maxLife: 28 + Math.random() * 18,
                gravity: 0.00001,
                twinkle: Math.random() * 6.28
              });
            }

            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const cg = ctx.createRadialGradient(cx, cy, 1, cx, cy, 24);
            cg.addColorStop(0, '#ffffff');
            cg.addColorStop(0.35, cm.color);
            cg.addColorStop(1, 'rgba(253, 230, 138, 0)');
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
            ctx.globalCompositeOperation = 'screen';
            const haloR = (st.isMine ? 34 : 26) * pulse;
            const halo = ctx.createRadialGradient(sx, sy, 0.5, sx, sy, haloR);
            halo.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            halo.addColorStop(0.2, meta.glow);
            halo.addColorStop(0.55, 'rgba(253, 230, 138, 0.16)');
            halo.addColorStop(1, 'rgba(253, 230, 138, 0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (st.isMine || isSelected || isHovered) {
              ctx.strokeStyle = isSelected || isHovered ? 'rgba(255, 255, 255, 0.92)' : 'rgba(253, 230, 138, 0.68)';
              ctx.lineWidth = isSelected || isHovered ? 1.8 : 1.25;
              ctx.beginPath();
              ctx.arc(sx, sy, 15 * pulse, 0, Math.PI * 2);
              ctx.stroke();
            }

            // 8-point celestial diffraction starflare
            const flare = (st.isMine ? 13 : 10.5) * pulse;
            ctx.fillStyle = '#ffffff';
            drawStarSpikes(ctx, sx, sy, flare, 2.2 * hScale, 0);
            ctx.fillStyle = 'rgba(254, 243, 199, 0.72)';
            drawStarSpikes(ctx, sx, sy, flare * 0.62, 1.3 * hScale, Math.PI / 4);

            // Shimmering water-stroke column reflection on the pond
            const ry = height * (0.6 + (0.48 - Math.min(0.46, st.y)) * 0.44);
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            for (let row = 0; row < 4; row++) {
              const rowY = ry + row * 4.5;
              const waveX = sx + Math.sin(t * 2.8 + i + row * 1.3) * (3 + row * 1.4);
              const halfW = (13 - row * 2.2) * hScale;
              ctx.strokeStyle = `rgba(253, 230, 138, ${(0.36 - row * 0.07).toFixed(3)})`;
              ctx.lineWidth = 1.6;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(waveX - halfW, rowY);
              ctx.lineTo(waveX + halfW, rowY);
              ctx.stroke();
            }
            ctx.restore();
          }

          // 9. Concentric Bioluminescent Water Ripples
          for (let i = waterRipples.length - 1; i >= 0; i--) {
            const rp = waterRipples[i];
            rp.rx += rp.speed * k;
            const lifeFrac = rp.rx / rp.maxRx;
            if (lifeFrac >= 1 || rp.alpha < 0.015) {
              waterRipples.splice(i, 1);
              continue;
            }
            const curAlpha = rp.alpha * (1 - lifeFrac);
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, curAlpha));
            ctx.strokeStyle = rp.color;
            ctx.lineWidth = rp.lineWidth;
            ctx.beginPath();
            ctx.ellipse(rp.x * width, rp.y * height, rp.rx, rp.rx * 0.29, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

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
              const distPx = Math.hypot((wl.x - rp.x) * width, (wl.y - rp.y) * height * 2.6);
              const diff = Math.abs(distPx - rp.rx);
              if (diff < 18) {
                const amp = (1 - diff / 18) * (1 - rp.rx / rp.maxRx);
                rippleBob -= amp * 4.5;
                rippleTilt += Math.sin(distPx * 0.3) * amp * 0.14;
              }
            }

            const bobX = wl.x * width + Math.sin(t * 0.85 + i * 1.7) * 5.5;
            const bobY = wl.y * height + Math.cos(t * 1.25 + i * 2.1) * 2.4 + rippleBob;
            const meta = ELEMENT_MAP[wl.element] || SANCTUARY_ELEMENTS[2];
            const flicker = 0.94 + 0.06 * Math.sin(t * 7.5 + i * 2.3);

            const depthScale = Math.max(0.76, Math.min(1.18, 0.78 + (wl.y - 0.58) * 1.15));
            const totalScale = hScale * depthScale;

            // Soft translucent warm underwater reflection pool (zero opaque saucer!)
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const poolR = (wl.isMine ? 40 : 32) * totalScale * flicker;
            const pg = ctx.createRadialGradient(bobX, bobY + 6, 1, bobX, bobY + 6, poolR);
            pg.addColorStop(0, 'rgba(255, 251, 235, 0.56)');
            pg.addColorStop(0.28, 'rgba(251, 191, 36, 0.26)');
            pg.addColorStop(0.62, meta.glow.replace(/0\.\d+\)/, '0.14)'));
            pg.addColorStop(1, 'rgba(251, 146, 60, 0)');
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.ellipse(bobX, bobY + 7, poolR, poolR * 0.36, 0, 0, Math.PI * 2);
            ctx.fill();

            // Delicate shimmering reflection strokes below the lantern
            for (let wr = 0; wr < 3; wr++) {
              const wy = bobY + 8 + wr * 3.6 * totalScale;
              const wx = bobX + Math.sin(t * 3.1 + i + wr) * 2.5;
              const ww = (10 - wr * 2.4) * totalScale;
              ctx.strokeStyle = `rgba(254, 243, 199, ${(0.38 - wr * 0.1).toFixed(3)})`;
              ctx.lineWidth = 1.3;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(wx - ww, wy);
              ctx.lineTo(wx + ww, wy);
              ctx.stroke();
            }
            ctx.restore();

            if (wl.lightType === 'wave') {
              // Semantic Wave ("Vlna · Pomoc druhému"): 3 expanding concentric bioluminescent pond rings + droplet core
              ctx.save();
              ctx.translate(bobX, bobY);
              ctx.scale(totalScale, totalScale);

              for (let ringIdx = 0; ringIdx < 3; ringIdx++) {
                const phase = ((t * 0.55 + i * 0.37 + ringIdx * 0.33) % 1);
                const rx = 6 + phase * (wl.isMine ? 24 : 20);
                const ry = rx * 0.38;
                const ringAlpha = (1 - phase) * (wl.isMine || isSelected || isHovered ? 0.78 : 0.48);
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
              dropAura.addColorStop(0, 'rgba(209, 250, 229, 0.92)');
              dropAura.addColorStop(0.5, 'rgba(52, 211, 153, 0.42)');
              dropAura.addColorStop(1, 'rgba(16, 185, 129, 0)');
              ctx.fillStyle = dropAura;
              ctx.beginPath();
              ctx.arc(0, 0, 10, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(0, 0, 2.6 * flicker, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            } else {
              // Gentle water ring around lantern base
              ctx.strokeStyle =
                wl.isMine || isSelected || isHovered
                  ? 'rgba(253, 230, 138, 0.72)'
                  : 'rgba(253, 230, 138, 0.32)';
              ctx.lineWidth = isSelected || isHovered ? 1.6 : 1.05;
              ctx.beginPath();
              ctx.ellipse(
                bobX,
                bobY + 4.5 * totalScale,
                (wl.isMine ? 16 : 13) * totalScale + Math.sin(t * 1.9 + i) * 1.5,
                3.8 * totalScale,
                0,
                0,
                Math.PI * 2
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
              const aura = ctx.createRadialGradient(0, -lh * 0.4, 1, 0, -lh * 0.4, lw * 1.6);
              aura.addColorStop(0, 'rgba(254, 243, 199, 0.55)');
              aura.addColorStop(1, 'rgba(251, 146, 60, 0)');
              ctx.fillStyle = aura;
              ctx.beginPath();
              ctx.arc(0, -lh * 0.4, lw * 1.6, 0, Math.PI * 2);
              ctx.fill();

              // Floating wooden lotus base
              ctx.fillStyle = 'rgba(62, 35, 16, 0.9)';
              ctx.beginPath();
              ctx.ellipse(0, 3.2, lw * 0.86, 2.4, 0, 0, Math.PI * 2);
              ctx.fill();

              // Glowing warm paper lantern body
              const bodyGrad = ctx.createLinearGradient(0, -lh + 3, 0, 3.2);
              bodyGrad.addColorStop(0, '#fde68a');
              bodyGrad.addColorStop(0.5, '#fffbeb');
              bodyGrad.addColorStop(1, '#fb923c');
              ctx.fillStyle = bodyGrad;
              ctx.beginPath();
              ctx.roundRect(-lw * 0.54, -lh + 3, lw * 1.08, lh, 4);
              ctx.fill();

              // Delicate top wooden cap & subtle vertical ribs
              ctx.strokeStyle = 'rgba(120, 66, 24, 0.42)';
              ctx.lineWidth = 0.85;
              ctx.beginPath();
              ctx.moveTo(-lw * 0.22, -lh + 3.5);
              ctx.lineTo(-lw * 0.22, 2.8);
              ctx.moveTo(lw * 0.22, -lh + 3.5);
              ctx.lineTo(lw * 0.22, 2.8);
              ctx.stroke();

              ctx.fillStyle = 'rgba(78, 44, 18, 0.82)';
              ctx.fillRect(-lw * 0.48, -lh + 2.4, lw * 0.96, 1.6);

              // Bright inner candle flame core
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.ellipse(0, -2.2 * flicker, 2.3, 3.9 * flicker, 0, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }
          }

          // 11. Expanding Luminous Shockwaves
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
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
              ctx.ellipse(sw.x * width, sw.y * height, sw.r, sw.r * 0.36, 0, 0, Math.PI * 2);
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

            const breathSync = breathingActive ? 0.55 + (breathScale - 0.86) * 0.9 : 1;
            const glowPulse = (0.3 + 0.7 * Math.max(0, Math.sin(t * 2.0 + ff.phase))) * breathSync;
            const fx = ff.x * width;
            const fy = ff.y * height;
            const fr = ff.size * 5.6;
            ctx.globalAlpha = Math.max(0, Math.min(1, glowPulse));
            ctx.drawImage(ff.gold ? goldFireflySprite : greenFireflySprite, fx - fr, fy - fr, fr * 2, fr * 2);
          }
          ctx.globalAlpha = 1;

          // 12B. Sanctuary Molly — Stavový automat a animace chodící patronky po břehu jezera
          if (mollyJoyTimer > 0) {
            mollyBehavior = 'EAT_TREAT';
            mollyJoyTimer = Math.max(0, mollyJoyTimer - 0.02 * k);
            if (mollyJoyTimer === 0) {
              mollyBehavior = Math.abs(mollyPos.x - 0.24) < 0.03 ? 'SIT_HOME' : 'WALK_PATROL';
              mollyStateTimer = 4.0 + Math.random() * 2.5;
              if (mollyBehavior === 'WALK_PATROL') {
                mollyTargetX = 0.24;
              }
            }
          } else if (!reducedMotion) {
            mollyStateTimer -= 0.016 * k;

            if (mollyBehavior === 'SIT_HOME') {
              mollyFacing = -1;
              if (mollyStateTimer <= 0) {
                mollyBehavior = 'WALK_PATROL';
                mollyTargetX = 0.32 + Math.random() * 0.11;
                mollyFacing = 1;
                mollyStateTimer = 14.0;
              }
            } else if (mollyBehavior === 'WALK_PATROL') {
              const dx = mollyTargetX - mollyPos.x;
              const step = 0.00038 * k;
              mollyFacing = dx >= 0 ? 1 : -1;
              mollyWalkCycle += 0.16 * k;

              if (Math.abs(dx) <= step || mollyStateTimer <= 0) {
                mollyPos.x = mollyTargetX;
                mollyPos.y = getLakeshoreY(mollyPos.x);
                if (Math.abs(mollyPos.x - 0.24) < 0.02) {
                  mollyBehavior = 'SIT_HOME';
                  mollyFacing = -1;
                  mollyStateTimer = 5.0 + Math.random() * 4.0;
                } else {
                  mollyBehavior = Math.random() < 0.65 ? 'WATCH_LAKE' : 'GROOM';
                  mollyFacing = 1;
                  mollyStateTimer = 3.5 + Math.random() * 3.0;
                }
              } else {
                mollyPos.x += Math.sign(dx) * step;
                mollyPos.y = getLakeshoreY(mollyPos.x);
                if (Math.sin(mollyWalkCycle) > 0.96 && waterRipples.length < 18) {
                  waterRipples.push({
                    x: mollyPos.x,
                    y: mollyPos.y + 0.024,
                    rx: 3,
                    maxRx: 28,
                    speed: 0.65,
                    alpha: 0.32,
                    color: '#fde68a',
                    lineWidth: 1.2
                  });
                }
              }
            } else if (mollyBehavior === 'WATCH_LAKE') {
              mollyFacing = 1;
              if (mollyStateTimer <= 0) {
                if (Math.random() < 0.45) {
                  mollyBehavior = 'GROOM';
                  mollyStateTimer = 3.0 + Math.random() * 2.5;
                } else {
                  mollyBehavior = 'WALK_PATROL';
                  mollyTargetX = Math.random() < 0.7 ? 0.24 : 0.20 + Math.random() * 0.22;
                  mollyStateTimer = 14.0;
                }
              }
            } else if (mollyBehavior === 'GROOM') {
              if (mollyStateTimer <= 0) {
                mollyBehavior = 'WALK_PATROL';
                mollyTargetX = 0.24;
                mollyStateTimer = 14.0;
              }
            }
          } else {
            mollyBehavior = 'SIT_HOME';
            mollyPos.x = 0.24;
            mollyPos.y = 0.72;
            mollyFacing = -1;
          }

          const mx = mollyPos.x * width;
          const my = mollyPos.y * height;
          const homeX = MOLLY_SANCTUARY_POS.x * width;
          const homeY = MOLLY_SANCTUARY_POS.y * height;
          const bx = MOLLY_BOWL_POS.x * width;
          const by = MOLLY_BOWL_POS.y * height;
          const treatsTotal = Math.max(1, Number($mollyState?.treatsFedTotal) || 1);
          const mollyScale = Math.min(1.18, Math.max(0.88, width / 800));

          // Letící pamlskové oblouky (Treat Firefly Arcs) ke břehu k Molly
          for (let a = mollyTreatArcs.length - 1; a >= 0; a--) {
            const arc = mollyTreatArcs[a];
            arc.progress = Math.min(1, arc.progress + (reducedMotion ? 0.25 : 0.032) * k);
            const p = arc.progress;
            const u = 1 - p;
            const ax = (u * u * arc.sx + 2 * u * p * arc.cx + p * p * arc.tx) * width;
            const ay = (u * u * arc.sy + 2 * u * p * arc.cy + p * p * arc.ty) * height;

            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.strokeStyle = arc.color || '#fbbf24';
            ctx.globalAlpha = 0.55 * (1 - p * 0.35);
            ctx.lineWidth = 2.0;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(arc.sx * width, arc.sy * height);
            ctx.quadraticCurveTo(arc.cx * width, arc.cy * height, ax, ay);
            ctx.stroke();

            const tg = ctx.createRadialGradient(ax, ay, 1, ax, ay, 18);
            tg.addColorStop(0, '#ffffff');
            tg.addColorStop(0.4, arc.color || '#fbbf24');
            tg.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = tg;
            ctx.beginPath();
            ctx.arc(ax, ay, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (p >= 1) {
              mollyJoyTimer = Math.max(mollyJoyTimer, 1.5);
              playMollyCrunch();
              waterRipples.push({
                x: arc.tx,
                y: arc.ty + 0.035,
                rx: 5,
                maxRx: 82,
                speed: 1.1,
                alpha: 0.65,
                color: '#fde68a',
                lineWidth: 1.8
              });
              mollyTreatArcs.splice(a, 1);
            }
          }

          // Stálý odlesk mističky u kamene
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          const bowlRefl = ctx.createRadialGradient(bx, by + 10, 1, bx, by + 10, 16);
          bowlRefl.addColorStop(0, 'rgba(254, 243, 199, 0.28)');
          bowlRefl.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = bowlRefl;
          ctx.beginPath();
          ctx.ellipse(bx, by + 10, 14, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Dynamický vodní odraz chodící Molly v hladině jezera
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          const reflGlow = ctx.createRadialGradient(mx, my + 24, 2, mx, my + 24, 42 + (mollyJoyTimer > 0 ? 16 : 0));
          reflGlow.addColorStop(0, 'rgba(253, 230, 138, 0.36)');
          reflGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.16)');
          reflGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
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
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(mx + rxOff - rw, ry);
            ctx.lineTo(mx + rxOff + rw, ry);
            ctx.stroke();
          }
          ctx.restore();

          // Mechový jezerní kámen / molo pod Molly a mističkou
          ctx.save();
          const stoneGrad = ctx.createLinearGradient(bx - 18, homeY - 4, homeX + 28, homeY + 14);
          stoneGrad.addColorStop(0, 'rgba(20, 42, 31, 0.92)');
          stoneGrad.addColorStop(0.5, 'rgba(31, 61, 45, 0.95)');
          stoneGrad.addColorStop(1, 'rgba(15, 33, 24, 0.92)');
          ctx.fillStyle = stoneGrad;
          ctx.strokeStyle = 'rgba(110, 231, 183, 0.35)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse((homeX + bx) * 0.5 + 4, homeY + 5, Math.abs(homeX - bx) * 0.65 + 24, 9.5, -0.04, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Zářící porcelánová mistička hojnosti (nx = 0.19, ny = 0.73)
          const bowlGlow = ctx.createRadialGradient(bx, by - 2, 1, bx, by - 2, 20);
          bowlGlow.addColorStop(0, 'rgba(254, 243, 199, 0.65)');
          bowlGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = bowlGlow;
          ctx.beginPath();
          ctx.arc(bx, by - 2, 20, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#29201b';
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(bx - 11, by - 4);
          ctx.lineTo(bx + 11, by - 4);
          ctx.lineTo(bx + 8, by + 3.5);
          ctx.lineTo(bx - 8, by + 3.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          const visibleTreats = Math.min(7, Math.max(2, treatsTotal));
          for (let ti = 0; ti < visibleTreats; ti++) {
            const tx = bx - 6.5 + ti * 2.2;
            const ty = by - 5.2 - (ti % 2) * 1.6;
            ctx.fillStyle = ti % 2 === 0 ? '#f59e0b' : '#fde68a';
            ctx.beginPath();
            ctx.arc(tx, ty, 2.1, 0, Math.PI * 2);
            ctx.fill();
          }

          // Animace a proporce těla Molly
          const isWalking = mollyBehavior === 'WALK_PATROL' && !reducedMotion;
          const isGrooming = mollyBehavior === 'GROOM' && !reducedMotion;
          const isEating = mollyBehavior === 'EAT_TREAT' || mollyJoyTimer > 0;
          const isWatching = mollyBehavior === 'WATCH_LAKE';

          const joyJump = isEating ? Math.abs(Math.sin(t * 9)) * -6.5 : 0;
          const walkBob = isWalking ? Math.abs(Math.sin(mollyWalkCycle * 2)) * -2.2 : 0;
          const idleBreathe = (!isWalking && !isEating) ? Math.sin(t * 1.8) * 0.8 : 0;
          const mcy = my + joyJump + walkBob + idleBreathe;

          const legSwingA = isWalking ? Math.sin(mollyWalkCycle) * 4.5 : 0;
          const legSwingB = isWalking ? -Math.sin(mollyWalkCycle) * 4.5 : 0;
          const legLiftA = isWalking ? Math.max(0, -Math.cos(mollyWalkCycle)) * 2.2 : 0;
          const legLiftB = isWalking ? Math.max(0, Math.cos(mollyWalkCycle)) * 2.2 : 0;
          const groomPaw = isGrooming ? Math.sin(t * 6.5) * 3.5 : 0;
          const groomLift = isGrooming ? 8.0 + Math.abs(groomPaw) : 0;
          const headTilt = isGrooming ? Math.sin(t * 3.2) * 0.12 : 0;
          const watchHeadNod = isWatching ? Math.sin(t * 1.4) * 0.05 : 0;

          if (isEating) {
            const joyHalo = ctx.createRadialGradient(mx, mcy - 10, 2, mx, mcy - 10, 44);
            joyHalo.addColorStop(0, 'rgba(254, 243, 199, 0.55)');
            joyHalo.addColorStop(0.5, 'rgba(251, 191, 36, 0.22)');
            joyHalo.addColorStop(1, 'rgba(251, 191, 36, 0)');
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
          const tailSpeed = isEating ? 5.8 : (isWalking ? 3.4 : 2.2);
          const tailAmp = isEating ? 8.5 : (isWalking ? 5.0 : 6.5);
          const tailSway = Math.sin(t * tailSpeed) * tailAmp;

          ctx.lineCap = 'round';
          ctx.strokeStyle = '#1e1714';
          ctx.lineWidth = 5.2;
          ctx.beginPath();
          ctx.moveTo(-10, 1);
          ctx.bezierCurveTo(
            -22,
            -2 + tailSway * 0.4,
            -25,
            -16 + tailSway,
            -17 + tailSway * 0.6,
            -24
          );
          ctx.stroke();

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3.4;
          ctx.beginPath();
          ctx.moveTo(-19, -8 + tailSway * 0.5);
          ctx.quadraticCurveTo(
            -22,
            -16 + tailSway * 0.8,
            -17 + tailSway * 0.6,
            -24
          );
          ctx.stroke();

          // Tělo Molly
          ctx.fillStyle = '#1e1714';
          ctx.strokeStyle = 'rgba(253, 230, 138, 0.42)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.ellipse(0, -4, 12.5, 14.5, 0.08, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.save();
          ctx.beginPath();
          ctx.ellipse(0, -4, 12.1, 14.1, 0.08, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.ellipse(5, -8, 6.8, 5.5, 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.ellipse(-4.5, -1, 6.2, 4.8, -0.25, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fde68a';
          ctx.beginPath();
          ctx.ellipse(-2, -6, 3.8, 4.4, 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Tlapky (zadní a přední s dynamickým krokem a očistou)
          ctx.fillStyle = '#1e1714';
          ctx.beginPath();
          ctx.ellipse(-4.5 + legSwingB, 7.5 - legLiftB, 3.6, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.ellipse(
            4.2 + legSwingA + (isGrooming ? groomPaw * 0.4 : 0),
            7.5 - legLiftA - groomLift,
            3.6,
            2.5,
            isGrooming ? 0.3 : 0,
            0,
            Math.PI * 2
          );
          ctx.fill();

          // Hlava a obličej Molly
          const mhx = 2;
          const mhy = -19;

          ctx.save();
          ctx.translate(mhx, mhy);
          ctx.rotate(headTilt + watchHeadNod);

          // Ouška
          ctx.fillStyle = '#1e1714';
          ctx.beginPath();
          ctx.moveTo(-9, -3);
          ctx.lineTo(-11, -15);
          ctx.lineTo(-2, -8.5);
          ctx.closePath();
          ctx.fill();

          const earTwitch = isGrooming ? Math.sin(t * 6) * 1.5 : 0;
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.moveTo(2, -8.5);
          ctx.lineTo(11 + earTwitch, -15);
          ctx.lineTo(9, -3);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#1e1714';
          ctx.beginPath();
          ctx.arc(0, 0, 10.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, 10.2, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(-0.5, -12);
          ctx.lineTo(12, -12);
          ctx.lineTo(12, 12);
          ctx.lineTo(0.8, 12);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fde68a';
          ctx.beginPath();
          ctx.ellipse(4, 3, 4.2, 3.2, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Smaragdové oči nebo blažené ^ ^ obloučky
          if (isEating || breathingActive) {
            ctx.strokeStyle = '#bef264';
            ctx.lineWidth = 2.0;
            [-4.1, 4.1].forEach((ex) => {
              ctx.beginPath();
              ctx.arc(ex, -0.3, 2.8, Math.PI * 1.15, Math.PI * 1.85);
              ctx.stroke();
            });
          } else {
            [-4.1, 4.1].forEach((ex) => {
              // Levná průsvitná záře místo shadowBlur (ten se počítá na CPU v každém snímku)
              ctx.fillStyle = 'rgba(190, 242, 100, 0.3)';
              ctx.beginPath();
              ctx.ellipse(ex, -0.6, 3.9, 3.7, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#84cc16';
              ctx.beginPath();
              ctx.ellipse(ex, -0.6, 2.8, 2.6, 0, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#090d08';
              ctx.beginPath();
              ctx.ellipse(ex, -0.6, 1.15, 1.9, 0, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(ex - 0.8, -1.3, 0.75, 0, Math.PI * 2);
              ctx.fill();
            });
          }

          // Čumáček a vousky
          ctx.fillStyle = '#fb7185';
          ctx.beginPath();
          ctx.moveTo(-1.6, 2.2);
          ctx.lineTo(1.6, 2.2);
          ctx.lineTo(0, 3.9);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(254, 243, 199, 0.8)';
          ctx.lineWidth = 0.85;
          [-1, 1].forEach((dir) => {
            [-1, 0, 1].forEach((row) => {
              ctx.beginPath();
              ctx.moveTo(dir * 5, 2.8 + row * 1.3);
              ctx.lineTo(dir * 13.5, 2.1 + row * 2.0 + Math.sin(t * 3.5 + row) * 0.5);
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
            fg.addColorStop(0, 'rgba(255, 251, 235, 0.95)');
            fg.addColorStop(0.45, 'rgba(251, 191, 36, 0.55)');
            fg.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.arc(fox, foy, 8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Srdíčka radosti nad Molly u jezera
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
          if (canvasEl && lastTreatsAttr !== String(treatsTotal)) {
            lastTreatsAttr = String(treatsTotal);
            canvasEl.dataset.sanctuaryMolly = 'ready';
            canvasEl.dataset.mollyTreats = lastTreatsAttr;
          }

          // 13. Cascading Stardust, Lantern Embers & Cursor Wake Particles
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
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
            ctx.fillStyle = '#ffffff';
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
            ctx.globalCompositeOperation = 'screen';
            const lantern = ctx.createRadialGradient(lx, ly, 2, lx, ly, 115);
            lantern.addColorStop(0, 'rgba(254, 243, 199, 0.34)');
            lantern.addColorStop(0.4, 'rgba(110, 231, 183, 0.12)');
            lantern.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = lantern;
            ctx.beginPath();
            ctx.arc(lx, ly, 115, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }
      // Skutečná cena vykreslení snímku (bez čekání na vsync) — pro adaptivní kvalitu
      renderWorkAvg = renderWorkAvg * 0.9 + (performance.now() - workStart) * 0.1;
      if (!isOffscreen) {
        rafId = requestAnimationFrame(render);
      }
    }

    let isOffscreen = false;
    let io = null;
    if (typeof IntersectionObserver !== 'undefined' && stageWrapEl) {
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
        { threshold: 0.02 }
      );
      io.observe(stageWrapEl);
    }

    const pulseTimer = setTimeout(async () => {
      const pulse = await fetchAmbientPulse();
      ambientPulse = pulse;
    }, 300);

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      clearTimeout(pulseTimer);
      if (breathingActive) {
        stopBreathing(false);
      } else if (breathInterval) {
        clearInterval(breathInterval);
      }
      if (toastTimer) clearTimeout(toastTimer);
      if (
        storyDataUrl &&
        storyDataUrl.startsWith('blob:') &&
        typeof URL !== 'undefined' &&
        typeof URL.revokeObjectURL === 'function'
      ) {
        URL.revokeObjectURL(storyDataUrl);
      }
    };
  });
</script>

<svelte:head>
  <title>Krajina dobra — živé dobré skutky a klidný dech | Akcelerátor altruismu</title>
</svelte:head>

<div class="sanctuary-page">
  <!-- =====================================================================
       1. IMMERSIVE KRAJINA DOBRA STAGE
       ===================================================================== -->
  <section class="sanctuary-stage">
    <div class="sanctuary-top">
      <div class="sanctuary-intro">
        <div class="kicker">KRAJINA DOBRA · SKUTEČNÉ SKUTKY V ČESKU</div>
        <h1>Krajina, kde svítí <span class="serif-accent">dobré skutky</span></h1>
        <p class="lead">
          Klikni na kterékoliv světlo pro inspiraci na dnešní skutek — nebo klikni na hladinu či oblohu a rozsviť ten svůj.
        </p>
        <div class="ambient-pulse-pill" role="status" aria-live="off">
          <span class="ambient-pulse-dot" aria-hidden="true"></span>
          <span class="ambient-pulse-text">{ambientPulseText}</span>
        </div>
      </div>
    </div>

    <!-- FULL-BLEED PAINTERLY ART + 60FPS INTERACTIVE DEED LIGHTS -->
    <div class="sanctuary-canvas-shell canvas-stage">
      <div class="atmosphere-controls sanctuary-hud" aria-label="Nastavení atmosféry a zvuku">
        <div class="atmo-pill-group" role="group" aria-label="Denní doba">
          <button
            type="button"
            class="atmo-btn"
            class:active={atmosphereMode === 'dawn'}
            on:click={() => (atmosphereMode = 'dawn')}
            aria-pressed={atmosphereMode === 'dawn'}
          >
            🌅 Zlaté svítání
          </button>
          <button
            type="button"
            class="atmo-btn"
            class:active={atmosphereMode === 'night'}
            on:click={() => (atmosphereMode = 'night')}
            aria-pressed={atmosphereMode === 'night'}
          >
            🌌 Hvězdná noc
          </button>
        </div>

        <div class="hud-actions-group">
          <button
            type="button"
            class="explore-deed-btn"
            on:click={openRandomInspiringDeed}
            title="Inspirace náhodným dobrým skutkem"
          >
            ✨ Náhodný skutek
          </button>
          <button
            type="button"
            class="sound-btn"
            class:on={soundEnabled}
            on:click={toggleSound}
            title={soundEnabled ? 'Vypnout tóny' : 'Zapnout jemné tóny'}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? '🎐 Tóny: zapnuto' : '🔇 Jemné tóny'}
          </button>
        </div>
      </div>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div
        class="sanctuary-viewport"
        bind:this={stageWrapEl}
        on:click={handleStageClick}
        on:pointermove={handlePointerMove}
        on:pointerleave={handlePointerLeave}
        role="application"
        aria-label="Krajina dobra: výběrem světla zobrazíš konkrétní dobrý skutek, dotykem hladiny nebo oblohy rozsvítíš vlastní skutek"
      >
        <div class="art-parallax-wrap" bind:this={parallaxEl}>
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

        <canvas bind:this={canvasEl} class="sanctuary-canvas world-canvas"></canvas>

        <!-- MAGNETIC HOVER TOOLTIP PREVIEW -->
        {#if hoveredLight && (!selectedLight || selectedLight.uid !== hoveredLight.uid)}
          {@const hMeta = ELEMENT_MAP[hoveredLight.element] || SANCTUARY_ELEMENTS[3]}
          <div
            class="light-hover-pill"
            style={`left: ${Math.min(86, Math.max(14, hoveredLight.x * 100)).toFixed(1)}%; top: ${Math.max(10, hoveredLight.y * 100 - 6).toFixed(1)}%;`}
          >
            <span>{hMeta.icon}</span>
            <strong>{cleanTitle(hoveredLight.title)}</strong>
            <span class="hp-hint">· klikni</span>
          </div>
        {/if}

        {#if gentleToast}
          <div class="gentle-toast" role="status">{gentleToast}</div>
        {/if}

        <button
          type="button"
          class="molly-sanctuary-pill"
          on:click|stopPropagation={() => feedSanctuaryMolly(0.24, 0.72)}
          title={$mollyState.availableTreats > 0
            ? "Dát patronce Molly zasloužený pamlsek do mističky u jezera"
            : "Pohladit patronku Molly u jezera"}
          aria-label={$mollyState.availableTreats > 0
            ? "Dát patronce Molly pamlsek"
            : "Pohladit patronku Molly"}
        >
          {#if $mollyState.availableTreats > 0}
            🐾 Dát Molly pamlsek ({$mollyState.availableTreats} {$mollyState.lastTreat?.icon || '🐟'})
          {:else}
            🐾 Pohladit Molly ({$mollyState.treatsFedTotal} {$mollyState.lastTreat?.icon || '🐟'})
          {/if}
        </button>
      </div>

      {#if nextSeedToPlant}
        <div class="seed-ceremony-banner">
          <div class="seed-orb" aria-hidden="true">✦</div>
          <div class="seed-copy">
            <span class="seed-tag">TVŮJ DOKONČENÝ SKUTEK</span>
            <strong>{cleanTitle(nextSeedToPlant.title)}</strong>
            <span>Klikni na oblohu (hvězda) nebo na hladinu (lucerna) a rozsviť ho v krajině.</span>
          </div>
          <button
            type="button"
            class="seed-auto-btn"
            on:click|stopPropagation={() => {
              plantActiveSeed(nextSeedToPlant, { x: 0.48, y: 0.24 });
              triggerLightBloom(0.48, 0.24, '#fde68a', false, true);
              playChime('sky');
            }}
          >
            ✨ Rozsvítit hvězdu
          </button>
        </div>
      {/if}

      {#if selectedLight}
        <DeedInspectorModal
          selectedLight={selectedLight}
          elementMap={ELEMENT_MAP}
          onClose={() => (selectedLight = null)}
          onMarkDone={markDeedLightDone}
        />
      {/if}
    </div>

    <!-- SLEEK COMPACT DEED DOCK -->
    <RitualBar
      bind:ritualMode
      bind:ritualInput
      nextSeedToPlant={nextSeedToPlant}
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
      <strong>{currentProof.title}.</strong> {currentProof.realWorldProof}
    </p>
    <div class="qp-actions">
      <button type="button" class="qp-next" on:click={() => (proofIndex = (proofIndex + 1) % HOPE_PROOFS.length)}>
        ↻ Další dobrá zpráva
      </button>
      {#if currentProof.sourceUrl}
        <span>·</span>
        <a
          href={currentProof.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="qp-link"
        >
          Ověřeno {currentProof.verifiedAt || '2026'} · Zdroj: {currentProof.sourceLabel} ↗
        </a>
      {/if}
      <span>·</span>
      <a href="/app/guided" class="qp-link">Vybrat si dnešní skutek →</a>
    </div>
  </section>

  <ProgressDashboard
    activeLights={activeLights}
    myDeedsCount={myDeedsCount}
    latestStep={unplanted[0] || ($completedSteps || [])[0]}
    inAppBrowserDetected={inAppBrowserDetected}
  />
</div>

<style>
  .sanctuary-page {
    max-width: 1140px;
    margin: 0 auto;
    padding: 0.75rem 1.25rem 4.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* =========================================================================
     1. IMMERSIVE KRAJINA DOBRA STAGE
     ========================================================================= */
  .sanctuary-stage {
    border-radius: 32px;
    padding: 1.15rem 1.45rem 1.05rem;
    background:
      radial-gradient(90% 90% at 80% 10%, rgba(251, 191, 36, 0.16) 0%, transparent 55%),
      linear-gradient(165deg, #092117 0%, #103425 55%, #0b261b 100%);
    color: #f8faf8;
    box-shadow: 0 28px 60px -18px rgba(8, 28, 19, 0.3);
    border: 1px solid rgba(167, 243, 208, 0.2);
  }

  .sanctuary-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.85rem;
  }

  .sanctuary-intro {
    flex: 1 1 auto;
    max-width: 520px;
  }

  .kicker {
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #fde68a;
    margin-bottom: 0.2rem;
  }

  h1 {
    margin: 0 0 0.28rem 0;
    font-size: clamp(1.75rem, 2.9vw, 2.35rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.08;
    color: #ffffff;
  }

  h1 .serif-accent {
    color: #fde68a;
    font-weight: 400;
  }

  .lead {
    margin: 0;
    color: rgba(230, 245, 236, 0.86);
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .sanctuary-canvas-shell .atmosphere-controls {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10;
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    padding: 0.24rem 0.34rem;
    border-radius: 999px;
    background: rgba(5, 20, 14, 0.72);
    border: 1px solid rgba(167, 243, 208, 0.22);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.45);
    flex-shrink: 0;
    pointer-events: none;
  }

  .atmosphere-controls button {
    pointer-events: auto;
  }

  .atmo-pill-group {
    display: inline-flex;
    padding: 0.16rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    gap: 0.14rem;
  }

  .atmo-btn {
    border: none;
    border-radius: 999px;
    padding: 0.36rem 0.72rem;
    background: transparent;
    color: rgba(236, 253, 245, 0.85);
    font-family: inherit;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .atmo-btn.active {
    background: linear-gradient(135deg, #fde68a 0%, #6ee7b7 100%);
    color: #061b12;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }

  .hud-actions-group {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
  }

  .explore-deed-btn,
  .sound-btn {
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 999px;
    padding: 0.36rem 0.72rem;
    background: rgba(255, 255, 255, 0.07);
    color: rgba(240, 253, 246, 0.92);
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .explore-deed-btn:hover,
  .sound-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }

  .sound-btn.on {
    background: rgba(52, 211, 153, 0.22);
    border-color: rgba(110, 231, 183, 0.52);
    color: #fde68a;
  }

  .sanctuary-canvas-shell {
    position: relative;
    max-width: 100%;
    overflow: hidden;
    border-radius: 24px;
  }

  .sanctuary-viewport {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 8.2;
    max-height: 48dvh;
    min-height: 310px;
    border-radius: 24px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid rgba(253, 230, 138, 0.28);
    box-shadow: 0 24px 52px -14px rgba(3, 12, 8, 0.65);
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

  /* Překryvy nad animovaným plátnem záměrně BEZ backdrop-filter: rozmazání by se muselo přepočítat
     v každém snímku plátna (60×/s) a na mobilech způsobovalo sekání. Vyšší krytí pozadí to vyváží. */
  .light-hover-pill {
    position: absolute;
    transform: translate(-50%, -100%);
    padding: 0.36rem 0.75rem;
    border-radius: 999px;
    background: rgba(6, 24, 16, 0.94);
    border: 1px solid rgba(253, 230, 138, 0.48);
    color: #fef3c7;
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
    color: #6ee7b7;
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
    border-radius: 18px;
    background: rgba(8, 30, 21, 0.95);
    border: 1px solid rgba(253, 230, 138, 0.48);
    display: flex;
    align-items: center;
    gap: 0.8rem;
    z-index: 4;
  }

  .seed-orb {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(253, 230, 138, 0.22);
    color: #fde68a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
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
    font-size: 0.79rem;
    color: rgba(236, 253, 245, 0.9);
  }

  .seed-copy strong {
    overflow-wrap: anywhere;
  }

  .seed-tag {
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #fde68a;
  }

  .seed-auto-btn {
    border: none;
    border-radius: 999px;
    padding: 0.48rem 0.9rem;
    background: linear-gradient(135deg, #fde68a 0%, #6ee7b7 100%);
    color: #061b12;
    font-family: inherit;
    font-weight: 800;
    font-size: 0.78rem;
    cursor: pointer;
    white-space: nowrap;
  }

  .gentle-toast {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.52rem 1.1rem;
    border-radius: 999px;
    background: rgba(8, 30, 21, 0.96);
    border: 1px solid rgba(253, 230, 138, 0.48);
    color: #fef3c7;
    font-size: 0.84rem;
    font-weight: 600;
    z-index: 5;
    pointer-events: none;
    text-align: center;
    max-width: calc(100% - 2rem);
  }

  /* =========================================================================
     3. QUIET BORDERLESS HOPE WHISPER
     ========================================================================= */
  .quiet-proof {
    text-align: center;
    max-width: 680px;
    margin: 0 auto;
    padding: 0.35rem 0;
  }

  .qp-text {
    margin: 0.25rem 0 0.7rem;
    font-size: 0.96rem;
    line-height: 1.62;
    color: var(--text-secondary);
  }

  .qp-text strong {
    color: var(--text-primary);
  }

  .qp-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
    justify-content: center;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .qp-next {
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-family: inherit;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    padding: 0;
  }

  .qp-next:hover {
    color: var(--text-primary);
  }

  .qp-link {
    color: var(--emerald-600);
    font-weight: 800;
    text-decoration: none;
  }

  .qp-link:hover {
    text-decoration: underline;
  }

  @media (max-width: 900px) {
    .sanctuary-stage {
      padding: 1.4rem 1.15rem 1.2rem;
      border-radius: 26px;
    }
    .atmosphere-controls {
      align-items: flex-start;
    }
    .sanctuary-viewport {
      aspect-ratio: 4 / 3;
    }
  }

  @media (max-width: 680px) {
    .sanctuary-page {
      padding: 0.35rem 0.6rem 2rem;
      gap: 1.2rem;
    }

    .sanctuary-stage {
      padding: 0.7rem 0.75rem 0.8rem;
      border-radius: 20px;
    }

    .sanctuary-top {
      flex-direction: column;
      align-items: stretch;
      gap: 0.42rem;
      margin-bottom: 0.52rem;
    }

    .kicker {
      font-size: 0.65rem;
      margin-bottom: 0.1rem;
    }

    h1 {
      font-size: 1.32rem;
      margin: 0;
    }

    .sanctuary-intro .lead {
      display: none;
    }

    .sanctuary-canvas-shell .atmosphere-controls {
      top: 8px;
      right: 8px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      background: transparent;
      border: none;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      padding: 0;
      gap: 0.25rem;
      max-width: calc(100% - 16px);
      box-sizing: border-box;
    }

    .atmo-pill-group {
      background: rgba(5, 20, 14, 0.82);
      border: 1px solid rgba(167, 243, 208, 0.22);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 999px;
      padding: 0.12rem;
      gap: 0.1rem;
      max-width: 100%;
      box-sizing: border-box;
    }

    .atmo-btn {
      padding: 0.22rem 0.44rem;
      font-size: 0.68rem;
      white-space: nowrap;
    }

    .hud-actions-group {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      flex-wrap: nowrap;
      max-width: 100%;
    }

    .explore-deed-btn,
    .sound-btn {
      background: rgba(5, 20, 14, 0.82);
      border: 1px solid rgba(167, 243, 208, 0.22);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 999px;
      padding: 0.22rem 0.44rem;
      font-size: 0.68rem;
      white-space: nowrap;
    }

    .sanctuary-canvas-shell {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .sanctuary-viewport {
      min-height: 205px;
      height: 31dvh;
      max-height: 245px;
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
    }

    .seed-ceremony-banner {
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
      text-align: center;
      justify-content: center;
    }

    .molly-sanctuary-pill {
      bottom: 0.55rem;
      left: 0.55rem;
      padding: 0.26rem 0.58rem;
      font-size: 0.68rem;
      max-width: calc(100% - 1.1rem);
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .sanctuary-intro {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

  .ambient-pulse-pill {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-top: 0.55rem;
    padding: 0.32rem 0.72rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.14);
    border: 1px solid rgba(110, 231, 183, 0.28);
    color: #d1fae5;
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    box-sizing: border-box;
  }

  .ambient-pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 8px rgba(52, 211, 153, 0.75);
    flex-shrink: 0;
  }

  .ambient-pulse-text {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .molly-sanctuary-pill {
    position: absolute;
    bottom: 0.85rem;
    left: 0.85rem;
    z-index: 5;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.34rem 0.75rem;
    border-radius: 999px;
    border: 1px solid rgba(251, 191, 36, 0.5);
    background: rgba(8, 28, 19, 0.88);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #fef3c7;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .molly-sanctuary-pill:hover {
    transform: translateY(-1px);
    border-color: rgba(253, 230, 138, 0.85);
    box-shadow: 0 6px 18px rgba(245, 158, 11, 0.3);
  }
</style>
