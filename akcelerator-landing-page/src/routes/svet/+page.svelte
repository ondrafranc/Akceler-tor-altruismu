<script>
  import { onMount } from 'svelte';
  import {
    completedSteps,
    unplantedSteps,
    sanctuaryWishes,
    SANCTUARY_ELEMENTS,
    HOPE_PROOFS,
    recordSmallWin,
    plantStepLight,
    addSanctuaryWish,
    clearSanctuaryWishes,
    saveStepReflection
  } from '../../lib/progress.js';
  import { MICRO_ACTIONS } from '../../lib/data/czech-actions.js';
  import { renderStoryCardPng } from '../../lib/storyCard.js';
  import { trackEvent } from '../../lib/analytics.js';

  /** @type {Record<string, typeof SANCTUARY_ELEMENTS[0]>} */
  const ELEMENT_MAP = Object.fromEntries(SANCTUARY_ELEMENTS.map((e) => [e.key, e]));
  /** @type {Record<string, typeof MICRO_ACTIONS[0]>} */
  const ACTION_BY_ID = Object.fromEntries(MICRO_ACTIONS.map((a) => [a.id, a]));

  // =========================================================================
  // ALWAYS 100% FULL BEAUTY — ZERO LEVELS, CONNECTED TO REAL GOOD DEEDS
  // =========================================================================
  /** @type {'dawn' | 'night'} */
  let atmosphereMode = 'dawn';
  $: dawnLayerOpacity = atmosphereMode === 'dawn' ? 0.88 : 0.14;

  // 8 living deed lights seeded across the sky & lake — each linked to a real Czech micro-action
  const INSPIRING_DEED_SEEDS = [
    { actionId: 'zvirata_utulek_online', element: 'animals', x: 0.24, y: 0.69, zone: 'water' },
    { actionId: 'missing_maps', element: 'care', x: 0.21, y: 0.22, zone: 'sky' },
    { actionId: 'knihobudka_kniha', element: 'community', x: 0.47, y: 0.74, zone: 'water' },
    { actionId: 'birdlife_ptaci_pasti', element: 'nature', x: 0.41, y: 0.16, zone: 'sky' },
    { actionId: 'estudanky_pramen', element: 'nature', x: 0.66, y: 0.66, zone: 'water' },
    { actionId: 'remobil_telefon', element: 'nature', x: 0.62, y: 0.24, zone: 'sky' },
    { actionId: 'letters_seniors', element: 'community', x: 0.79, y: 0.19, zone: 'sky' },
    { actionId: 'trash_hero_uklid', element: 'nature', x: 0.81, y: 0.72, zone: 'water' }
  ];

  const QUICK_OFFLINE_DEEDS = [
    { label: '🥣 Poslal/a jsem misku útulku', title: 'Naplněná miska pro zvířata v útulku', element: 'animals' },
    { label: '🤝 Pomohl/a jsem někomu v okolí', title: 'Drobná pomoc člověku v mém okolí', element: 'community' },
    { label: '🌿 Sebral/a jsem odpadek venku', title: 'Sebraný odpadek cestou v přírodě či ulici', element: 'nature' },
    { label: '💌 Ozval/a jsem se blízkému', title: 'Zpráva nebo zavolání člověku, na kterém záleží', element: 'care' },
    { label: '📦 Poslal/a jsem věc dál', title: 'Darovaná věc, která ještě poslouží druhým', element: 'community' }
  ];

  // =========================================================================
  // REAL DEED LIGHT BAR ON THE LAKE & SKY
  // =========================================================================
  /** @type {'water' | 'sky'} */
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

  // Optional subtle Web Audio API pentatonic chimes (muted by default)
  let soundEnabled = false;
  /** @type {AudioContext | null} */
  let audioCtx = null;

  function ensureAudio() {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
      const Ctx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      const ctx = ensureAudio();
      if (ctx) playChime('water');
    }
  }

  /**
   * Plays a soft, warm harmonic sine/triangle chime (pentatonic scale)
   * @param {'sky' | 'water' | 'breath_in' | 'breath_out'} type
   */
  function playChime(type) {
    if (!soundEnabled) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'sky') {
        const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.055, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.95);
      } else if (type === 'water') {
        const notes = [261.63, 293.66, 329.63, 392.0, 440.0];
        osc.type = 'triangle';
        const base = notes[Math.floor(Math.random() * notes.length)];
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 1.015, now + 0.45);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.05, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.25);
      } else if (type === 'breath_in' || type === 'breath_out') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'breath_in' ? 329.63 : 261.63, now);
        gain.gain.setValueAtTime(0.0008, now);
        gain.gain.exponentialRampToValueAtTime(0.025, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.7);
      }
    } catch {}
  }

  // =========================================================================
  // CALMING BREATHING EXERCISE (3 GENTLE RHYTHMS)
  // =========================================================================
  const BREATH_PATTERNS = [
    {
      id: 'calm46',
      label: '🌊 Úleva od přetížení (4–6)',
      desc: 'Delší výdech než nádech přirozeně zklidní tep a pomůže tělu povolit napětí.',
      inhale: 4,
      hold: 0,
      exhale: 6
    },
    {
      id: 'balance44',
      label: '🌿 Klidná rovnováha (4–4)',
      desc: 'Plynulý, vyrovnaný rytmus pro chvíle, kdy se potřebuješ soustředit a ztišit.',
      inhale: 4,
      hold: 0,
      exhale: 4
    },
    {
      id: 'deep478',
      label: '🌙 Hluboké ztišení (4–7–8)',
      desc: 'Pomalé tempo vhodné večer nebo po náročném dni plném zpráv.',
      inhale: 4,
      hold: 7,
      exhale: 8
    }
  ];

  let selectedBreathId = 'calm46';
  $: activePattern = BREATH_PATTERNS.find((p) => p.id === selectedBreathId) || BREATH_PATTERNS[0];

  let breathingDurationSec = 60;
  let breathingActive = false;
  /** @type {'idle' | 'inhale' | 'hold' | 'exhale' | 'done'} */
  let breathPhase = 'idle';
  let breathPhaseSecLeft = 0;
  let breathSecondsLeft = 60;
  let breathScale = 1;
  let breathInterval = null;

  function startBreathing() {
    stopBreathing(false);
    breathingActive = true;
    breathSecondsLeft = breathingDurationSec;
    let phaseElapsed = 0;
    breathPhase = 'inhale';
    breathPhaseSecLeft = activePattern.inhale;
    breathScale = 1.34;
    playChime('breath_in');
    trackEvent('aa_world_breathing_start', { pattern: activePattern.id, duration: breathingDurationSec });

    breathInterval = setInterval(() => {
      breathSecondsLeft -= 1;
      if (breathSecondsLeft <= 0) {
        stopBreathing(true);
        return;
      }

      phaseElapsed += 1;
      if (breathPhase === 'inhale' && phaseElapsed >= activePattern.inhale) {
        phaseElapsed = 0;
        if (activePattern.hold > 0) {
          breathPhase = 'hold';
          breathPhaseSecLeft = activePattern.hold;
          breathScale = 1.34;
        } else {
          breathPhase = 'exhale';
          breathPhaseSecLeft = activePattern.exhale;
          breathScale = 0.88;
          playChime('breath_out');
        }
      } else if (breathPhase === 'hold' && phaseElapsed >= activePattern.hold) {
        phaseElapsed = 0;
        breathPhase = 'exhale';
        breathPhaseSecLeft = activePattern.exhale;
        breathScale = 0.88;
        playChime('breath_out');
      } else if (breathPhase === 'exhale' && phaseElapsed >= activePattern.exhale) {
        phaseElapsed = 0;
        breathPhase = 'inhale';
        breathPhaseSecLeft = activePattern.inhale;
        breathScale = 1.34;
        playChime('breath_in');
      } else {
        const targetLen =
          breathPhase === 'inhale'
            ? activePattern.inhale
            : breathPhase === 'hold'
            ? activePattern.hold
            : activePattern.exhale;
        breathPhaseSecLeft = Math.max(1, targetLen - phaseElapsed);
      }
    }, 1000);
  }

  function stopBreathing(completed = false) {
    if (breathInterval) clearInterval(breathInterval);
    breathInterval = null;
    breathingActive = false;
    breathScale = 1;
    breathPhase = completed ? 'done' : 'idle';
  }

  // =========================================================================
  // CALM GOOD NEWS CAROUSEL (1 AT A TIME)
  // =========================================================================
  let proofIndex = 0;
  $: currentProof = HOPE_PROOFS[proofIndex % HOPE_PROOFS.length];

  function nextProof() {
    proofIndex = (proofIndex + 1) % HOPE_PROOFS.length;
  }

  // =========================================================================
  // JOURNAL & 9:16 STORY POSTCARD
  // =========================================================================
  let editingUid = null;
  let draftNote = '';
  let storyMode = 'quiet';
  let storyDataUrl = '';
  let storyBlob = null;
  let storyBusy = false;
  let storyCopiedMsg = '';
  let storyDrawerOpen = false;

  $: latestStep = ($completedSteps || [])[($completedSteps || []).length - 1] || null;
  $: nextSeedToPlant = ($unplantedSteps || [])[0] || null;
  $: completedActionIds = new Set(($completedSteps || []).map((s) => s.id));

  function deterministicPos(index, elementKey) {
    const golden = (index * 0.61803398875 + 0.17) % 1;
    const x = 0.14 + golden * 0.72;
    const prefersWater = elementKey === 'community' || (elementKey === 'animals' && index % 2 === 1);
    const y = prefersWater
      ? 0.61 + ((index * 0.29) % 0.2)
      : 0.14 + ((index * 0.23 + 0.07) % 0.29);
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
          zone: /** @type {'sky' | 'water'} */ (pos.zone || (pos.y < 0.53 ? 'sky' : 'water')),
          isMine: true
        };
      }),
    ...($sanctuaryWishes || []).map((w) => ({
      uid: w.uid,
      actionId: '',
      action: null,
      title: w.title,
      note: '',
      concreteImpact: 'Dobrý skutek přidaný přímo do tvé Krajiny dobra.',
      orgName: '',
      minutes: 0,
      url: '',
      element: w.element || 'care',
      x: w.x,
      y: w.y,
      zone: /** @type {'sky' | 'water'} */ (w.zone || (w.y < 0.53 ? 'sky' : 'water')),
      isMine: true
    }))
  ];

  $: activeLights = [...seededDeedLights, ...userLights];
  $: myDeedsCount = userLights.length;

  /** @type {any | null} */
  let selectedLight = null;

  function openRandomInspiringDeed() {
    if (seededDeedLights.length === 0) return;
    const currentIdx = seededDeedLights.findIndex((l) => l?.uid === selectedLight?.uid);
    const next = seededDeedLights[(currentIdx + 1) % seededDeedLights.length];
    if (!next) return;
    selectedLight = next;
    triggerLightBloom(next.x, next.y, ELEMENT_MAP[next.element]?.softColor || '#fde68a', next.zone === 'water');
    playChime(next.zone === 'water' ? 'water' : 'sky');
  }

  function markDeedLightDone(light) {
    if (!light) return;
    if (light.action) {
      const entry = recordSmallWin({
        id: light.action.id,
        title: light.action.title,
        surface: 'svet_landscape',
        element: light.element,
        concreteImpact: light.concreteImpact,
        silent: true
      });
      if (entry) {
        plantStepLight(entry.uid, { x: light.x, y: light.y });
      }
    } else {
      addSanctuaryWish({
        x: light.x,
        y: light.y,
        kind: 'deed',
        title: light.title,
        element: light.element || 'care'
      });
    }
    triggerLightBloom(light.x, light.y, '#fde68a', light.zone === 'water');
    playChime(light.zone === 'water' ? 'water' : 'sky');
    selectedLight = { ...light, isMine: true };
    showGentleToast(`Skvělé! Skutek „${light.title}“ teď v krajině svítí jako tvůj.`);
  }

  function addQuickOfflineDeed(deed) {
    const isWater = ritualMode === 'water';
    const nx = 0.16 + Math.random() * 0.68;
    const ny = isWater ? 0.61 + Math.random() * 0.19 : 0.14 + Math.random() * 0.26;
    const saved = addSanctuaryWish({
      x: nx,
      y: ny,
      kind: 'deed',
      title: deed.title,
      element: deed.element
    });
    selectedLight = null;
    triggerLightBloom(saved.x, saved.y, ELEMENT_MAP[deed.element]?.softColor || '#fde68a', isWater);
    playChime(isWater ? 'water' : 'sky');
    showGentleToast(
      isWater
        ? `Lucerna za skutek „${deed.title}“ se rozsvítila na hladině.`
        : `Hvězda za skutek „${deed.title}“ se rozsvítila na obloze.`
    );
  }

  async function refreshStoryPreview() {
    if (typeof window === 'undefined') return;
    storyBusy = true;
    try {
      const skyStars = activeLights
        .filter((l) => l.zone === 'sky')
        .map((l) => ({
          x: l.x,
          y: l.y,
          color: ELEMENT_MAP[l.element]?.softColor || '#fde68a'
        }));

      const res = await renderStoryCardPng({
        mode: storyMode,
        actionTitle: latestStep?.title || MICRO_ACTIONS[0]?.title,
        stepsCount: Math.max(1, myDeedsCount),
        healPercent: 100,
        stars: skyStars
      });
      storyDataUrl = res.dataUrl;
      storyBlob = res.blob;
    } finally {
      storyBusy = false;
    }
  }

  $: if (typeof window !== 'undefined' && storyDrawerOpen && (storyMode || activeLights.length >= 0)) {
    refreshStoryPreview();
  }

  async function downloadOrShareStory() {
    trackEvent('aa_story_card_share', { mode: storyMode });
    if (!storyBlob) await refreshStoryPreview();
    if (!storyBlob) return;

    const file = new File([storyBlob], 'krajina-dobra.png', { type: 'image/png' });
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Krajina dobra — Akcelerátor altruismu',
          text: 'Jeden malý dobrý skutek dnes stačí.'
        });
        return;
      } catch {}
    }

    const a = document.createElement('a');
    a.href = storyDataUrl;
    a.download = 'krajina-dobra.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    storyCopiedMsg = 'Pohlednice 1080×1920 stažena — můžeš ji poslat dál jako tichou inspiraci.';
    setTimeout(() => (storyCopiedMsg = ''), 4500);
  }

  function startEditNote(step) {
    editingUid = step.uid;
    draftNote = step.note || '';
  }

  function saveNote(uid) {
    saveStepReflection(uid, draftNote.trim());
    editingUid = null;
  }

  // =========================================================================
  // 60FPS FULL-BEAUTY LANDSCAPE CANVAS ENGINE (DEED STARS, LANTERNS, RIPPLES)
  // =========================================================================
  /** @type {HTMLCanvasElement | null} */
  let canvasEl = null;
  /** @type {HTMLDivElement | null} */
  let stageWrapEl = null;
  let pointer = { x: 0.5, y: 0.62, active: false };
  let lastRippleAt = 0;

  /** @type {Array<{ x: number, y: number, vx: number, vy: number, r: number, alpha: number, color: string, life: number, maxLife: number }>} */
  let burstParticles = [];
  /** @type {Array<{ x: number, y: number, rx: number, alpha: number, color: string }>} */
  let waterRipples = [];

  function triggerLightBloom(nx, ny, color = '#fde68a', isWater = false) {
    for (let i = 0; i < 36; i++) {
      const angle = (Math.PI * 2 * i) / 36 + (Math.random() - 0.5) * 0.25;
      const speed = 0.0007 + Math.random() * 0.0032;
      burstParticles.push({
        x: nx,
        y: ny,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isWater ? 0.0008 : 0.0003),
        r: 1.5 + Math.random() * 3.1,
        alpha: 0.92,
        color,
        life: 0,
        maxLife: 58 + Math.random() * 44
      });
    }

    if (isWater || ny >= 0.5) {
      const wy = Math.max(0.57, ny);
      waterRipples.push({ x: nx, y: wy, rx: 4, alpha: 0.78, color });
      setTimeout(() => {
        waterRipples.push({ x: nx, y: wy, rx: 2, alpha: 0.52, color: '#ffffff' });
      }, 220);
    }
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

    const now = performance.now();
    if (ny > 0.56 && now - lastRippleAt > 260) {
      lastRippleAt = now;
      waterRipples.push({ x: nx, y: ny, rx: 3, alpha: 0.28, color: '#fde68a' });
    }
  }

  function handlePointerLeave() {
    pointer.active = false;
  }

  function handleStageClick(e) {
    if (!stageWrapEl) return;
    const rect = stageWrapEl.getBoundingClientRect();
    const nx = Math.max(0.06, Math.min(0.94, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0.07, Math.min(0.88, (e.clientY - rect.top) / rect.height));

    // 1. Check if clicking near an existing deed star or lantern to inspect or perform that deed!
    let closest = null;
    let minDist = 0.055;
    for (const l of activeLights) {
      const dx = l.x - nx;
      const dy = (l.y - ny) * (rect.height / rect.width);
      const d = Math.hypot(dx, dy);
      if (d < minDist) {
        minDist = d;
        closest = l;
      }
    }

    if (closest && !nextSeedToPlant && !ritualInput.trim()) {
      selectedLight = closest;
      triggerLightBloom(closest.x, closest.y, ELEMENT_MAP[closest.element]?.softColor || '#fde68a', closest.zone === 'water');
      playChime(closest.zone === 'water' ? 'water' : 'sky');
      return;
    }

    // 2. If user just arrived with a completed real micro-step, place its light where clicked
    if (nextSeedToPlant) {
      const elMeta = ELEMENT_MAP[nextSeedToPlant.element] || SANCTUARY_ELEMENTS[0];
      const isWater = ny >= 0.53;
      plantStepLight(nextSeedToPlant.uid, { x: nx, y: ny });
      triggerLightBloom(nx, ny, elMeta.softColor, isWater);
      playChime(isWater ? 'water' : 'sky');
      showGentleToast(
        isWater
          ? 'Lucerna za tvůj dobrý skutek pluje na hladině.'
          : 'Hvězda za tvůj dobrý skutek svítí na obloze.'
      );
      return;
    }

    // 3. Otherwise, clicking on water or sky lights a new good deed directly
    const text = ritualInput.trim();
    const clickedWater = ny >= 0.53;
    const yClamped = clickedWater ? Math.max(0.58, ny) : Math.min(0.46, ny);
    const saved = addSanctuaryWish({
      x: nx,
      y: yClamped,
      kind: 'deed',
      title: text || 'Drobný dobrý skutek ze dneška',
      element: clickedWater ? 'community' : 'care'
    });
    ritualInput = '';
    selectedLight = null;
    triggerLightBloom(saved.x, saved.y, clickedWater ? '#fed7aa' : '#fde68a', clickedWater);
    playChime(clickedWater ? 'water' : 'sky');
    showGentleToast(
      clickedWater
        ? 'Nová lucerna za dobrý skutek pluje po hladině.'
        : 'Nová hvězda za dobrý skutek svítí nad údolím.'
    );
  }

  function submitRitualBar() {
    const isWater = ritualMode === 'water';
    const nx = 0.18 + Math.random() * 0.64;
    const ny = isWater ? 0.62 + Math.random() * 0.18 : 0.15 + Math.random() * 0.25;
    const text = ritualInput.trim();
    const saved = addSanctuaryWish({
      x: nx,
      y: ny,
      kind: 'deed',
      title: text || 'Drobný dobrý skutek ze dneška',
      element: isWater ? 'community' : 'care'
    });
    ritualInput = '';
    selectedLight = null;
    triggerLightBloom(saved.x, saved.y, isWater ? '#fed7aa' : '#fde68a', isWater);
    playChime(isWater ? 'water' : 'sky');
    showGentleToast(
      isWater
        ? 'Lucerna za tvůj dobrý skutek vyplula na hladinu.'
        : 'Hvězda za tvůj dobrý skutek se rozsvítila na obloze.'
    );
  }

  onMount(() => {
    let rafId = 0;

    const fireflies = Array.from({ length: 42 }, (_, i) => ({
      x: Math.random(),
      y: 0.44 + Math.random() * 0.52,
      vx: (Math.random() - 0.5) * 0.00038,
      vy: (Math.random() - 0.5) * 0.00024,
      phase: i * 1.37,
      size: 1.6 + (i % 3) * 0.9,
      gold: i % 3 !== 0
    }));

    const ambientStars = Array.from({ length: 58 }, (_, i) => ({
      x: ((i * 73 + 19) % 97) / 97,
      y: ((i * 41 + 7) % 46) / 100 + 0.03,
      r: 0.6 + (i % 3) * 0.45,
      twinkle: i * 0.9
    }));

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!canvasEl || !stageWrapEl) return;
      const rect = stageWrapEl.getBoundingClientRect();
      width = Math.max(320, rect.width);
      height = Math.max(320, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasEl.width = Math.round(width * dpr);
      canvasEl.height = Math.round(height * dpr);
    }

    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro && stageWrapEl) ro.observe(stageWrapEl);

    function render(nowMs) {
      const t = nowMs * 0.001;
      if (canvasEl && width > 0 && height > 0) {
        const ctx = canvasEl.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, width, height);

          const isNight = atmosphereMode === 'night';

          // 1. Gentle Aurora Veil over the hills
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          const auroraAlpha = isNight ? 0.24 : 0.12;
          for (let b = 0; b < 2; b++) {
            const ay = height * (0.15 + b * 0.07) + Math.sin(t * 0.42 + b) * 9;
            const ag = ctx.createLinearGradient(width * 0.12, ay - 35, width * 0.88, ay + 45);
            ag.addColorStop(0, 'rgba(52, 211, 153, 0)');
            ag.addColorStop(0.32, `rgba(52, 211, 153, ${auroraAlpha})`);
            ag.addColorStop(0.68, `rgba(56, 189, 248, ${auroraAlpha * 0.82})`);
            ag.addColorStop(1, 'rgba(192, 132, 252, 0)');
            ctx.fillStyle = ag;
            ctx.beginPath();
            ctx.ellipse(width * 0.5, ay, width * 0.44, 34, Math.sin(t * 0.22 + b) * 0.04, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // 2. Breathing halo over the center of the lake when exercise is active
          if (breathingActive) {
            const pulseR = width * (0.18 + (breathScale - 0.88) * 0.22);
            const bg = ctx.createRadialGradient(
              width * 0.5,
              height * 0.56,
              8,
              width * 0.5,
              height * 0.56,
              pulseR
            );
            bg.addColorStop(0, 'rgba(253, 230, 138, 0.24)');
            bg.addColorStop(0.55, 'rgba(52, 211, 153, 0.1)');
            bg.addColorStop(1, 'rgba(253, 230, 138, 0)');
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.arc(width * 0.5, height * 0.56, pulseR, 0, Math.PI * 2);
            ctx.fill();
          }

          // 3. Soft Twinkling Background Stars
          const starVis = isNight ? 0.82 : 0.36;
          for (const st of ambientStars) {
            const tw = 0.4 + 0.6 * Math.sin(t * 1.4 + st.twinkle);
            ctx.fillStyle = `rgba(255, 250, 235, ${(tw * starVis).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(st.x * width, st.y * height, st.r, 0, Math.PI * 2);
            ctx.fill();
          }

          // 4. Living Deed Constellation (Sky Stars + Water Lanterns)
          const lights = activeLights;
          const skyLights = lights.filter((l) => l.zone === 'sky');
          const waterLights = lights.filter((l) => l.zone === 'water');

          if (skyLights.length >= 2) {
            ctx.save();
            ctx.strokeStyle = 'rgba(253, 230, 138, 0.32)';
            ctx.lineWidth = 1.35;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            for (let i = 0; i < skyLights.length - 1; i++) {
              ctx.moveTo(skyLights[i].x * width, skyLights[i].y * height);
              ctx.lineTo(skyLights[i + 1].x * width, skyLights[i + 1].y * height);
            }
            ctx.stroke();
            ctx.restore();
          }

          // Draw Sky Deed Stars + Mirror Reflections
          for (let i = 0; i < skyLights.length; i++) {
            const st = skyLights[i];
            const sx = st.x * width;
            const sy = st.y * height;
            const meta = ELEMENT_MAP[st.element] || SANCTUARY_ELEMENTS[3];
            const pulse = 1 + 0.12 * Math.sin(t * 2.0 + i * 1.3);
            const isSelected = selectedLight?.uid === st.uid;

            const haloR = (st.isMine ? 30 : 24) * pulse;
            const halo = ctx.createRadialGradient(sx, sy, 1, sx, sy, haloR);
            halo.addColorStop(0, '#ffffff');
            halo.addColorStop(0.28, meta.softColor);
            halo.addColorStop(0.65, meta.glow);
            halo.addColorStop(1, 'rgba(253, 230, 138, 0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
            ctx.fill();

            if (st.isMine || isSelected) {
              ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(253, 230, 138, 0.65)';
              ctx.lineWidth = isSelected ? 1.8 : 1.2;
              ctx.beginPath();
              ctx.arc(sx, sy, 13 * pulse, 0, Math.PI * 2);
              ctx.stroke();
            }

            const flare = (st.isMine ? 9.5 : 8) * pulse;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(sx, sy - flare);
            ctx.lineTo(sx + 2.1, sy - 2.1);
            ctx.lineTo(sx + flare, sy);
            ctx.lineTo(sx + 2.1, sy + 2.1);
            ctx.lineTo(sx, sy + flare);
            ctx.lineTo(sx - 2.1, sy + 2.1);
            ctx.lineTo(sx - flare, sy);
            ctx.lineTo(sx - 2.1, sy - 2.1);
            ctx.closePath();
            ctx.fill();

            const ry = height * (0.61 + (0.48 - Math.min(0.46, st.y)) * 0.44);
            const shimmerX = sx + Math.sin(t * 2.4 + i) * 3.5;
            const rg = ctx.createRadialGradient(shimmerX, ry, 1, shimmerX, ry, 18);
            rg.addColorStop(0, 'rgba(253, 230, 138, 0.34)');
            rg.addColorStop(1, 'rgba(253, 230, 138, 0)');
            ctx.fillStyle = rg;
            ctx.beginPath();
            ctx.ellipse(shimmerX, ry, 16, 5.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Draw Floating Deed Lanterns on the Mirror Lake
          for (let i = 0; i < waterLights.length; i++) {
            const wl = waterLights[i];
            const bobX = wl.x * width + Math.sin(t * 0.85 + i * 1.7) * 5.5;
            const bobY = wl.y * height + Math.cos(t * 1.2 + i * 2.1) * 2.3;
            const meta = ELEMENT_MAP[wl.element] || SANCTUARY_ELEMENTS[2];
            const isSelected = selectedLight?.uid === wl.uid;

            ctx.strokeStyle = wl.isMine || isSelected ? 'rgba(253, 230, 138, 0.55)' : 'rgba(253, 230, 138, 0.28)';
            ctx.lineWidth = isSelected ? 1.8 : 1.1;
            ctx.beginPath();
            ctx.ellipse(bobX, bobY + 4, (wl.isMine ? 18 : 15) + Math.sin(t * 1.8 + i) * 2.5, 4.5, 0, 0, Math.PI * 2);
            ctx.stroke();

            const lanternR = wl.isMine ? 25 : 21;
            const lg = ctx.createRadialGradient(bobX, bobY, 1, bobX, bobY, lanternR);
            lg.addColorStop(0, '#fffbeb');
            lg.addColorStop(0.36, meta.softColor);
            lg.addColorStop(0.75, meta.glow);
            lg.addColorStop(1, 'rgba(251, 146, 60, 0)');
            ctx.fillStyle = lg;
            ctx.beginPath();
            ctx.arc(bobX, bobY, lanternR, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff7ed';
            ctx.beginPath();
            ctx.arc(bobX, bobY - 1, wl.isMine ? 4.8 : 4.1, 0, Math.PI * 2);
            ctx.fill();
          }

          // 5. Concentric Water Ripples
          for (let i = waterRipples.length - 1; i >= 0; i--) {
            const rp = waterRipples[i];
            rp.rx += 0.8;
            rp.alpha *= 0.982;
            if (rp.alpha < 0.02) {
              waterRipples.splice(i, 1);
              continue;
            }
            ctx.strokeStyle = `rgba(253, 230, 138, ${rp.alpha.toFixed(3)})`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(rp.x * width, rp.y * height, rp.rx, rp.rx * 0.28, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // 6. Ambient Fireflies in Foreground Irises & Reeds
          for (const ff of fireflies) {
            ff.x += ff.vx + Math.sin(t * 0.65 + ff.phase) * 0.00018;
            ff.y += ff.vy + Math.cos(t * 0.8 + ff.phase) * 0.00014;
            if (ff.x < 0.02) ff.x = 0.98;
            if (ff.x > 0.98) ff.x = 0.02;
            if (ff.y < 0.4) ff.vy = Math.abs(ff.vy);
            if (ff.y > 0.95) ff.vy = -Math.abs(ff.vy);

            const glowPulse = 0.35 + 0.65 * Math.max(0, Math.sin(t * 1.9 + ff.phase));
            const fx = ff.x * width;
            const fy = ff.y * height;
            const fg = ctx.createRadialGradient(fx, fy, 0.5, fx, fy, ff.size * 5.2);
            if (ff.gold) {
              fg.addColorStop(0, `rgba(254, 243, 199, ${glowPulse.toFixed(3)})`);
              fg.addColorStop(0.45, `rgba(251, 191, 36, ${(glowPulse * 0.42).toFixed(3)})`);
            } else {
              fg.addColorStop(0, `rgba(209, 250, 229, ${glowPulse.toFixed(3)})`);
              fg.addColorStop(0.45, `rgba(52, 211, 153, ${(glowPulse * 0.42).toFixed(3)})`);
            }
            fg.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.arc(fx, fy, ff.size * 5.2, 0, Math.PI * 2);
            ctx.fill();
          }

          // 7. Gentle Bloom Particles
          for (let i = burstParticles.length - 1; i >= 0; i--) {
            const bp = burstParticles[i];
            bp.life += 1;
            bp.x += bp.vx;
            bp.y += bp.vy;
            bp.vx *= 0.982;
            bp.vy *= 0.982;
            const fade = Math.max(0, 1 - bp.life / bp.maxLife);
            if (fade <= 0.01) {
              burstParticles.splice(i, 1);
              continue;
            }
            ctx.fillStyle = bp.color;
            ctx.globalAlpha = fade * bp.alpha;
            ctx.beginPath();
            ctx.arc(bp.x * width, bp.y * height, bp.r * fade + 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          // 8. Soft Warm Cursor Glow
          if (pointer.active) {
            const lx = pointer.x * width;
            const ly = pointer.y * height;
            const lantern = ctx.createRadialGradient(lx, ly, 2, lx, ly, 95);
            lantern.addColorStop(0, 'rgba(254, 243, 199, 0.28)');
            lantern.addColorStop(0.45, 'rgba(251, 191, 36, 0.09)');
            lantern.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = lantern;
            ctx.beginPath();
            ctx.arc(lx, ly, 95, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
      if (breathInterval) clearInterval(breathInterval);
      if (toastTimer) clearTimeout(toastTimer);
    };
  });
</script>

<svelte:head>
  <title>Krajina dobra — živé dobré skutky a klidný dech | Akcelerátor altruismu</title>
</svelte:head>

<div class="sanctuary-page">
  <!-- =====================================================================
       1. KRAJINA DOBRA — FULL SUNLIT BEAUTY CONNECTED TO REAL CZECH DEEDS
       ===================================================================== -->
  <section class="sanctuary-stage">
    <div class="sanctuary-top">
      <div class="sanctuary-intro">
        <div class="kicker">KRAJINA DOBRA • SKUTEČNÉ SKUTKY V ČESKU</div>
        <h1>Krajina, kde svítí <span class="serif-accent">dobré skutky</span></h1>
        <p class="lead">
          Každá hvězda na obloze i lucerna na hladině připomíná konkrétní pomoc lidem, zvířatům nebo přírodě.
          <strong>Klikni na kterékoliv světlo pro inspiraci na dnešní skutek</strong> — nebo sem rozsviť drobnou pomoc, která se dnes povedla tobě.
        </p>
      </div>

      <div class="atmosphere-controls" aria-label="Nastavení atmosféry a zvuku">
        <div class="atmo-pill-group">
          <button
            type="button"
            class="atmo-btn"
            class:active={atmosphereMode === 'dawn'}
            on:click={() => (atmosphereMode = 'dawn')}
          >
            🌅 Zlaté svítání
          </button>
          <button
            type="button"
            class="atmo-btn"
            class:active={atmosphereMode === 'night'}
            on:click={() => (atmosphereMode = 'night')}
          >
            🌌 Hvězdná noc
          </button>
        </div>

        <div class="atmo-sub-row">
          <button type="button" class="explore-deed-btn" on:click={openRandomInspiringDeed}>
            ✨ Náhodný skutek z krajiny
          </button>
          <button type="button" class="sound-btn" class:on={soundEnabled} on:click={toggleSound}>
            {soundEnabled ? '🎐 Tóny tůně: zapnuto' : '🔇 Jemné tóny'}
          </button>
        </div>
      </div>
    </div>

    <!-- FULL-BLEED PAINTERLY ART + 60FPS INTERACTIVE DEED LIGHTS -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      class="sanctuary-viewport"
      bind:this={stageWrapEl}
      on:click={handleStageClick}
      on:pointermove={handlePointerMove}
      on:pointerleave={handlePointerLeave}
      role="application"
      aria-label="Krajina dobra: kliknutím na světlo zobrazíš konkrétní dobrý skutek, kliknutím na hladinu nebo oblohu rozsvítíš vlastní skutek"
    >
      <img
        src="/art/sanctuary-twilight.jpg"
        alt="Šumavské údolí s lesní tůní a světly dobrých skutků"
        class="art-layer twilight"
        draggable="false"
      />

      <img
        src="/art/sanctuary-dawn.jpg"
        alt=""
        aria-hidden="true"
        class="art-layer dawn"
        style={`opacity: ${dawnLayerOpacity.toFixed(2)};`}
        draggable="false"
      />

      <canvas bind:this={canvasEl} class="sanctuary-canvas"></canvas>

      {#if nextSeedToPlant}
        <div class="seed-ceremony-banner">
          <div class="seed-orb" aria-hidden="true">✦</div>
          <div class="seed-copy">
            <span class="seed-tag">TVŮJ DOKONČENÝ SKUTEK</span>
            <strong>{nextSeedToPlant.title}</strong>
            <span>Klikni kamkoliv na oblohu (hvězda) nebo na hladinu (lucerna) a rozsviť ho v krajině.</span>
          </div>
          <button
            type="button"
            class="seed-auto-btn"
            on:click|stopPropagation={() => {
              plantStepLight(nextSeedToPlant.uid, { x: 0.48, y: 0.25 });
              triggerLightBloom(0.48, 0.25, '#fde68a', false);
              playChime('sky');
            }}
          >
            ✨ Rozsvítit hvězdu
          </button>
        </div>
      {/if}

      {#if gentleToast}
        <div class="gentle-toast" role="status">{gentleToast}</div>
      {/if}

      {#if selectedLight}
        {@const selMeta = ELEMENT_MAP[selectedLight.element] || SANCTUARY_ELEMENTS[3]}
        <div
          class="memory-whisper"
          role="dialog"
          aria-label="Detail dobrého skutku"
          tabindex="-1"
          on:click|stopPropagation
          on:keydown|stopPropagation
        >
          <div class="mw-head">
            <div class="mw-badges">
              <span class="mw-badge">{selMeta.icon} {selMeta.title}</span>
              {#if selectedLight.isMine}
                <span class="mw-mine-pill">✦ Tvůj skutek</span>
              {/if}
            </div>
            <button type="button" class="mw-close" on:click={() => (selectedLight = null)} aria-label="Zavřít">✕</button>
          </div>

          <strong class="mw-title">
            {String(selectedLight.title || '').replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\s]+/u, '').trim() || selectedLight.title}
          </strong>

          {#if selectedLight.orgName || selectedLight.minutes}
            <div class="mw-meta">
              {#if selectedLight.minutes}<span>⏱ {selectedLight.minutes} min</span>{/if}
              {#if selectedLight.orgName}<span>• {selectedLight.orgName}</span>{/if}
            </div>
          {/if}

          {#if selectedLight.concreteImpact}
            <div class="mw-impact">{selectedLight.concreteImpact}</div>
          {/if}

          {#if selectedLight.note}
            <p class="mw-note">„{selectedLight.note}“</p>
          {/if}

          <div class="mw-actions">
            {#if selectedLight.url}
              <a
                href={selectedLight.url}
                target="_blank"
                rel="noopener noreferrer"
                class="mw-btn-link"
                on:click={() => trackEvent('aa_world_deed_open', { id: selectedLight.actionId })}
              >
                Udělat tenhle skutek ↗
              </a>
            {/if}
            {#if !selectedLight.isMine}
              <button
                type="button"
                class="mw-btn-done"
                on:click={() => markDeedLightDone(selectedLight)}
              >
                ✓ Mám splněno — rozsvítit jako svůj
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- DEED BAR: ADD AN EVERYDAY REAL GOOD DEED TO WATER OR SKY -->
    <form class="ritual-bar" on:submit|preventDefault={submitRitualBar}>
      <div class="ritual-top-row">
        <div class="ritual-modes" role="tablist" aria-label="Kam rozsvítit dobrý skutek">
          <button
            type="button"
            class="ritual-pill"
            class:active={ritualMode === 'water'}
            on:click={() => (ritualMode = 'water')}
          >
            🏮 Lucerna na hladině
          </button>
          <button
            type="button"
            class="ritual-pill"
            class:active={ritualMode === 'sky'}
            on:click={() => (ritualMode = 'sky')}
          >
            ✦ Hvězda na obloze
          </button>
        </div>

        <span class="ritual-helper">
          Povedlo se ti dnes pomoct offline? Rozsviť si to jedním klikem:
        </span>
      </div>

      <div class="quick-deed-chips" aria-label="Rychlé příklady dnešních dobrých skutků">
        {#each QUICK_OFFLINE_DEEDS as qd}
          <button
            type="button"
            class="qd-chip"
            on:click={() => addQuickOfflineDeed(qd)}
          >
            {qd.label}
          </button>
        {/each}
      </div>

      <div class="ritual-input-row">
        <input
          type="text"
          bind:value={ritualInput}
          maxlength="110"
          placeholder="Nebo napiš vlastní drobný skutek ze dneška (uloží se jen u tebe v prohlížeči)…"
          aria-label="Popis tvého dobrého skutku"
        />
        <button type="submit" class="ritual-send-btn">
          {ritualMode === 'water' ? '🏮 Rozsvítit na hladině' : '✦ Rozsvítit na nebi'}
        </button>
        {#if ($sanctuaryWishes || []).length > 0}
          <button
            type="button"
            class="ritual-clear-btn"
            on:click={() => clearSanctuaryWishes()}
            title="Smazat ručně přidaná světla"
          >
            Vyčistit přidaná světla
          </button>
        {/if}
      </div>
    </form>
  </section>

  <!-- =====================================================================
       2. BREATHING EXERCISE — GENUINE CALM SO YOU HAVE STRENGTH TO HELP
       ===================================================================== -->
  <section id="dech" class="breathing-sanctuary" aria-label="Dechové zastavení pro zklidnění">
    <div class="breath-copy-col">
      <span class="sec-kicker">CHVÍLE KLIDU • NÁVRAT K SOBĚ</span>
      <h2>Dechové zastavení, když <span class="serif-accent">potřebuješ nabrat sílu</span></h2>
      <p class="breath-lead">
        Pomáhat druhým jde snáz, když máš sám/sama z čeho brát. Pomalý, klidný výdech uvolní napětí v ramenou a ztiší roztěkanou hlavu během jediné minuty.
      </p>

      <div class="pattern-list" role="radiogroup" aria-label="Zvolit dechový rytmus">
        {#each BREATH_PATTERNS as pat}
          <button
            type="button"
            class="pattern-card"
            class:active={selectedBreathId === pat.id}
            on:click={() => {
              selectedBreathId = pat.id;
              if (breathingActive) startBreathing();
            }}
          >
            <strong>{pat.label}</strong>
            <span>{pat.desc}</span>
          </button>
        {/each}
      </div>

      <div class="duration-row">
        <span class="dur-lbl">Délka zastavení:</span>
        <button
          type="button"
          class="dur-chip"
          class:active={breathingDurationSec === 60}
          on:click={() => (breathingDurationSec = 60)}
        >
          1 minuta
        </button>
        <button
          type="button"
          class="dur-chip"
          class:active={breathingDurationSec === 120}
          on:click={() => (breathingDurationSec = 120)}
        >
          2 minuty
        </button>
      </div>
    </div>

    <div class="breath-visual-col">
      <div class="lotus-stage">
        <div
          class="lotus-halo outer"
          class:inhale={breathPhase === 'inhale' || breathPhase === 'hold'}
          class:exhale={breathPhase === 'exhale'}
          style={`transition-duration: ${
            breathPhase === 'inhale'
              ? activePattern.inhale
              : breathPhase === 'exhale'
              ? activePattern.exhale
              : 0.6
          }s;`}
        ></div>
        <div
          class="lotus-halo middle"
          class:inhale={breathPhase === 'inhale' || breathPhase === 'hold'}
          class:exhale={breathPhase === 'exhale'}
          style={`transition-duration: ${
            breathPhase === 'inhale'
              ? activePattern.inhale
              : breathPhase === 'exhale'
              ? activePattern.exhale
              : 0.6
          }s;`}
        ></div>
        <div
          class="lotus-core"
          class:inhale={breathPhase === 'inhale' || breathPhase === 'hold'}
          class:exhale={breathPhase === 'exhale'}
          style={`transition-duration: ${
            breathPhase === 'inhale'
              ? activePattern.inhale
              : breathPhase === 'exhale'
              ? activePattern.exhale
              : 0.6
          }s;`}
        >
          {#if breathingActive}
            <span class="phase-sec">{breathPhaseSecLeft} s</span>
          {:else}
            <span class="phase-leaf">🌿</span>
          {/if}
        </div>
      </div>

      <div class="breath-instruction" aria-live="polite">
        {#if breathPhase === 'inhale'}
          <strong>Klidný nádech nosem…</strong>
          <span>Nech vzduch volně klesnout až do břicha ({breathSecondsLeft} s do konce)</span>
        {:else if breathPhase === 'hold'}
          <strong>Krátké spočinutí v klidu…</strong>
          <span>Uvolni čelist a ramena ({breathSecondsLeft} s do konce)</span>
        {:else if breathPhase === 'exhale'}
          <strong>Dlouhý, pomalý výdech ústy…</strong>
          <span>Nech s výdechem odejít přebytečné napětí ({breathSecondsLeft} s do konce)</span>
        {:else if breathPhase === 'done'}
          <strong>Hotovo. Zůstaň ještě vteřinu v tichu.</strong>
          <span>Všimni si, o kolik klidněji teď dýcháš.</span>
        {:else}
          <strong>Dopřej si minutu klidného dechu</strong>
          <span>Hladina tůně výše bude jemně dýchat spolu s tebou.</span>
        {/if}
      </div>

      {#if breathingActive}
        <button type="button" class="breath-cta stop" on:click={() => stopBreathing(false)}>
          Zastavit cvičení
        </button>
      {:else}
        <button type="button" class="breath-cta start" on:click={startBreathing}>
          🌊 Spustit klidný dech ({breathingDurationSec === 60 ? '1 min' : '2 min'})
        </button>
      {/if}
    </div>
  </section>

  <!-- =====================================================================
       3. ONE CALM RAY OF HOPE FROM CZECHIA + DIRECT LINK TO HELP
       ===================================================================== -->
  <section class="calm-hope-card" aria-label="Dobrá zpráva z Česka">
    <div class="chc-left">
      <span class="sec-kicker">DOBRÉ ZPRÁVY Z ČESKA • SKUTEČNÁ POMOC V PRAXI</span>
      <h2>{currentProof.title}</h2>
      <p class="chc-proof">{currentProof.realWorldProof}</p>
      <p class="chc-psych">💡 {currentProof.psychNote}</p>
      <div class="chc-actions">
        <button type="button" class="calm-more-btn" on:click={nextProof}>
          ↻ Další dobrá zpráva z Česka
        </button>
        <a href="/app/guided" class="gentle-step-link">
          Vybrat si svůj dnešní dobrý skutek v průvodci →
        </a>
      </div>
    </div>
  </section>

  <!-- =====================================================================
       4. OPTIONAL COLLAPSIBLE DRAWERS
       ===================================================================== -->
  <div class="optional-drawers">
    <details class="calm-drawer" bind:open={storyDrawerOpen}>
      <summary>
        <span>🎨 Vytvořit si 9:16 pohlednici Krajiny dobra (na tapetu nebo pro přátele)</span>
      </summary>
      <div class="drawer-inner story-studio-inner">
        <p class="drawer-note">
          Vytváří se soukromě přímo v tvém prohlížeči z malované šumavské tůně — můžeš ji poslat dál jako milou inspiraci k dobrému skutku.
        </p>
        <div class="story-mode-tabs">
          <button
            type="button"
            class:active={storyMode === 'quiet'}
            on:click={() => (storyMode = 'quiet')}
          >
            🌿 Klidná pohlednice krajiny
          </button>
          <button
            type="button"
            class:active={storyMode === 'tip'}
            on:click={() => (storyMode = 'tip')}
          >
            💡 S konkrétním tipem na skutek
          </button>
        </div>

        <div class="story-preview-frame">
          {#if storyDataUrl}
            <img src={storyDataUrl} alt="Náhled 9:16 pohlednice Krajiny dobra" class="story-img" />
          {:else}
            <div class="story-loading">Připravuji malovanou pohlednici…</div>
          {/if}
        </div>

        <button type="button" class="story-dl-btn" on:click={downloadOrShareStory} disabled={storyBusy}>
          {storyBusy ? 'Připravuji…' : '↓ Stáhnout / sdílet pohlednici (1080×1920)'}
        </button>
        {#if storyCopiedMsg}
          <p class="story-msg">{storyCopiedMsg}</p>
        {/if}
      </div>
    </details>

    <details class="calm-drawer">
      <summary>
        <span>📖 Soukromý zápisník mých dobrých skutků ({($completedSteps || []).length})</span>
      </summary>
      <div class="drawer-inner">
        <p class="drawer-note">
          Uloženo pouze u tebe v prohlížeči — jako tiché připomenutí chvil, kdy jsi někomu nebo něčemu pomohl/a.
        </p>
        {#if ($completedSteps || []).length === 0}
          <p class="empty-journal">
            Zatím tu není žádný záznam. Až splníš svůj první drobný skutek na úvodu nebo přímo na hladině výše, objeví se tady.
          </p>
        {:else}
          <ul class="journal-list">
            {#each [...$completedSteps].reverse().slice(0, 12) as step (step.uid)}
              {@const meta = ELEMENT_MAP[step.element] || SANCTUARY_ELEMENTS[3]}
              <li class="journal-item">
                <div class="ji-top">
                  <span class="ji-title">{meta.icon} {step.title}</span>
                  <span class="ji-date">{new Date(step.timestamp).toLocaleDateString('cs-CZ')}</span>
                </div>
                {#if editingUid === step.uid}
                  <div class="ji-edit">
                    <input
                      type="text"
                      bind:value={draftNote}
                      placeholder="Krátká poznámka pro sebe (volitelné)"
                      maxlength="220"
                    />
                    <button type="button" on:click={() => saveNote(step.uid)}>Uložit</button>
                  </div>
                {:else if step.note}
                  <p class="ji-note">„{step.note}“</p>
                {:else}
                  <button type="button" class="ji-add-note" on:click={() => startEditNote(step)}>
                    + Připsat poznámku
                  </button>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </details>
  </div>
</div>

<style>
  .sanctuary-page {
    max-width: 1140px;
    margin: 0 auto;
    padding: 0.75rem 1.25rem 4.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.85rem;
  }

  /* =========================================================================
     1. KRAJINA DOBRA STAGE
     ========================================================================= */
  .sanctuary-stage {
    border-radius: 32px;
    padding: 2.1rem 2.1rem 1.65rem;
    background:
      radial-gradient(90% 90% at 80% 10%, rgba(251, 191, 36, 0.16) 0%, transparent 55%),
      linear-gradient(165deg, #0b261b 0%, #123828 55%, #0c291d 100%);
    color: #f8faf8;
    box-shadow: 0 28px 60px -18px rgba(10, 34, 24, 0.24);
    border: 1px solid rgba(167, 243, 208, 0.24);
  }

  .sanctuary-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1.5rem;
    flex-wrap: wrap;
    margin-bottom: 1.35rem;
  }

  .sanctuary-intro {
    max-width: 650px;
  }

  .kicker {
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.11em;
    color: #fde68a;
    margin-bottom: 0.4rem;
  }

  h1 {
    margin: 0 0 0.55rem 0;
    font-size: clamp(1.95rem, 3.5vw, 2.85rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: #ffffff;
  }

  h1 .serif-accent {
    color: #fde68a;
    font-weight: 400;
  }

  .lead {
    margin: 0;
    color: rgba(232, 246, 238, 0.9);
    font-size: 0.98rem;
    line-height: 1.62;
  }

  .lead strong {
    color: #fde68a;
    font-weight: 700;
  }

  .atmosphere-controls {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .atmo-pill-group {
    display: inline-flex;
    padding: 0.26rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.16);
    gap: 0.25rem;
  }

  .atmo-btn {
    border: none;
    border-radius: 999px;
    padding: 0.44rem 0.9rem;
    background: transparent;
    color: rgba(236, 253, 245, 0.85);
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .atmo-btn.active {
    background: linear-gradient(135deg, #fde68a 0%, #6ee7b7 100%);
    color: #061b12;
  }

  .atmo-sub-row {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .explore-deed-btn,
  .sound-btn {
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 999px;
    padding: 0.4rem 0.85rem;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(240, 253, 246, 0.92);
    font-family: inherit;
    font-size: 0.79rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .explore-deed-btn:hover,
  .sound-btn:hover {
    background: rgba(255, 255, 255, 0.16);
  }

  .sound-btn.on {
    background: rgba(52, 211, 153, 0.24);
    border-color: rgba(110, 231, 183, 0.55);
    color: #fde68a;
  }

  .sanctuary-viewport {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    min-height: 340px;
    border-radius: 24px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid rgba(253, 230, 138, 0.3);
    box-shadow: 0 22px 48px -14px rgba(4, 16, 11, 0.58);
    user-select: none;
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

  .seed-ceremony-banner {
    position: absolute;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    max-width: 640px;
    margin: 0 auto;
    padding: 0.75rem 1rem;
    border-radius: 18px;
    background: rgba(8, 30, 21, 0.88);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(253, 230, 138, 0.48);
    display: flex;
    align-items: center;
    gap: 0.8rem;
    z-index: 4;
  }

  .seed-orb {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(253, 230, 138, 0.22);
    color: #fde68a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .seed-copy {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    font-size: 0.8rem;
    color: rgba(236, 253, 245, 0.9);
  }

  .seed-tag {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #fde68a;
  }

  .seed-auto-btn {
    border: none;
    border-radius: 999px;
    padding: 0.5rem 0.9rem;
    background: linear-gradient(135deg, #fde68a 0%, #6ee7b7 100%);
    color: #061b12;
    font-family: inherit;
    font-weight: 800;
    font-size: 0.8rem;
    cursor: pointer;
    white-space: nowrap;
  }

  .gentle-toast {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.55rem 1.1rem;
    border-radius: 999px;
    background: rgba(8, 30, 21, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(253, 230, 138, 0.45);
    color: #fef3c7;
    font-size: 0.85rem;
    font-weight: 600;
    z-index: 5;
    pointer-events: none;
    text-align: center;
    max-width: calc(100% - 2rem);
  }

  .memory-whisper {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    width: min(350px, calc(100% - 2rem));
    padding: 1rem 1.1rem;
    border-radius: 20px;
    background: rgba(8, 30, 21, 0.93);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(253, 230, 138, 0.42);
    color: #f8faf8;
    z-index: 6;
    box-shadow: 0 18px 38px rgba(0, 0, 0, 0.4);
  }

  .mw-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }

  .mw-badges {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .mw-badge {
    font-size: 0.73rem;
    font-weight: 800;
    padding: 0.16rem 0.6rem;
    border-radius: 999px;
    background: rgba(254, 243, 199, 0.94);
    color: #0e281c;
  }

  .mw-mine-pill {
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.14rem 0.5rem;
    border-radius: 999px;
    background: rgba(110, 231, 183, 0.2);
    color: #a7f3d0;
  }

  .mw-close {
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.75);
    cursor: pointer;
    font-size: 0.95rem;
  }

  .mw-title {
    display: block;
    font-size: 0.96rem;
    line-height: 1.35;
    margin-bottom: 0.28rem;
  }

  .mw-meta {
    font-size: 0.76rem;
    color: rgba(209, 250, 229, 0.78);
    margin-bottom: 0.35rem;
    display: flex;
    gap: 0.35rem;
  }

  .mw-impact {
    font-size: 0.81rem;
    line-height: 1.45;
    color: rgba(236, 253, 245, 0.88);
  }

  .mw-note {
    margin: 0.35rem 0 0;
    font-size: 0.82rem;
    font-style: italic;
    color: #fde68a;
  }

  .mw-actions {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.42rem;
  }

  .mw-btn-link {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0.52rem 0.85rem;
    border-radius: 12px;
    background: linear-gradient(135deg, #fde68a 0%, #6ee7b7 100%);
    color: #061b12;
    font-weight: 800;
    font-size: 0.8rem;
    text-decoration: none;
  }

  .mw-btn-done {
    padding: 0.48rem 0.85rem;
    border-radius: 12px;
    border: 1px solid rgba(167, 243, 208, 0.36);
    background: rgba(255, 255, 255, 0.08);
    color: #ecfdf5;
    font-family: inherit;
    font-weight: 700;
    font-size: 0.79rem;
    cursor: pointer;
  }

  .mw-btn-done:hover {
    background: rgba(16, 185, 129, 0.25);
  }

  /* DEED RITUAL BAR */
  .ritual-bar {
    margin-top: 1.05rem;
    padding: 0.95rem 1.05rem;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.13);
    display: flex;
    flex-direction: column;
    gap: 0.68rem;
  }

  .ritual-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .ritual-modes {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .ritual-helper {
    font-size: 0.8rem;
    color: rgba(226, 245, 235, 0.8);
  }

  .ritual-pill {
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 999px;
    padding: 0.38rem 0.85rem;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(236, 253, 245, 0.86);
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .ritual-pill.active {
    background: rgba(253, 230, 138, 0.22);
    border-color: rgba(253, 230, 138, 0.58);
    color: #fde68a;
  }

  .quick-deed-chips {
    display: flex;
    gap: 0.42rem;
    flex-wrap: wrap;
  }

  .qd-chip {
    border: 1px solid rgba(167, 243, 208, 0.24);
    border-radius: 999px;
    padding: 0.34rem 0.78rem;
    background: rgba(16, 185, 129, 0.12);
    color: #ecfdf5;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .qd-chip:hover {
    background: rgba(253, 230, 138, 0.22);
    border-color: rgba(253, 230, 138, 0.5);
    color: #fef3c7;
  }

  .ritual-input-row {
    display: flex;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .ritual-input-row input {
    flex: 1;
    min-width: 220px;
    padding: 0.68rem 1rem;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(5, 20, 14, 0.52);
    color: #ffffff;
    font-family: inherit;
    font-size: 0.88rem;
  }

  .ritual-input-row input::placeholder {
    color: rgba(226, 242, 233, 0.62);
  }

  .ritual-send-btn {
    border: none;
    border-radius: 14px;
    padding: 0.68rem 1.15rem;
    background: linear-gradient(135deg, #fde68a 0%, #6ee7b7 100%);
    color: #061b12;
    font-family: inherit;
    font-weight: 800;
    font-size: 0.86rem;
    cursor: pointer;
    white-space: nowrap;
  }

  .ritual-clear-btn {
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 14px;
    padding: 0.68rem 0.9rem;
    background: transparent;
    color: rgba(226, 242, 233, 0.82);
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  /* =========================================================================
     2. BREATHING SANCTUARY
     ========================================================================= */
  .breathing-sanctuary {
    background: linear-gradient(160deg, #ffffff 0%, #f1f7f2 100%);
    border-radius: 30px;
    padding: 2.35rem;
    border: 1px solid rgba(22, 82, 56, 0.11);
    box-shadow: var(--shadow-md);
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 2.2rem;
    align-items: center;
  }

  .sec-kicker {
    display: inline-block;
    font-size: 0.73rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: var(--emerald-600);
    margin-bottom: 0.35rem;
  }

  .breathing-sanctuary h2,
  .calm-hope-card h2 {
    margin: 0 0 0.65rem 0;
    font-size: clamp(1.6rem, 2.6vw, 2.15rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.16;
    color: var(--text-primary);
  }

  .breathing-sanctuary h2 .serif-accent {
    color: var(--emerald-600);
  }

  .breath-lead {
    margin: 0 0 1.2rem 0;
    color: var(--text-secondary);
    font-size: 0.96rem;
    line-height: 1.62;
  }

  .pattern-list {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    margin-bottom: 1.1rem;
  }

  .pattern-card {
    text-align: left;
    padding: 0.82rem 1rem;
    border-radius: 16px;
    border: 1px solid rgba(22, 82, 56, 0.1);
    background: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
    font-family: inherit;
    transition: all 0.2s var(--ease-gentle);
  }

  .pattern-card strong {
    font-size: 0.92rem;
    color: var(--text-primary);
  }

  .pattern-card span {
    font-size: 0.82rem;
    color: var(--text-secondary);
    line-height: 1.42;
  }

  .pattern-card.active {
    background: #eaf7ef;
    border-color: rgba(16, 185, 129, 0.45);
    box-shadow: 0 8px 22px -10px rgba(16, 185, 129, 0.3);
  }

  .duration-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .dur-lbl {
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .dur-chip {
    padding: 0.38rem 0.85rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 82, 56, 0.15);
    background: #ffffff;
    color: var(--text-secondary);
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
  }

  .dur-chip.active {
    background: #123828;
    color: #fde68a;
    border-color: #123828;
  }

  .breath-visual-col {
    background: radial-gradient(circle at 50% 38%, #184a35 0%, #0e2e20 100%);
    border-radius: 26px;
    padding: 2.1rem 1.5rem;
    color: #f8faf8;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.25rem;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
  }

  .lotus-stage {
    position: relative;
    width: 190px;
    height: 190px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lotus-halo {
    position: absolute;
    border-radius: 50%;
    transition-property: transform, opacity;
    transition-timing-function: ease-in-out;
  }

  .lotus-halo.outer {
    width: 165px;
    height: 165px;
    background: radial-gradient(circle, rgba(52, 211, 153, 0.28) 0%, rgba(253, 230, 138, 0.1) 65%, transparent 100%);
    border: 1px solid rgba(110, 231, 183, 0.32);
    transform: scale(0.86);
    opacity: 0.58;
  }

  .lotus-halo.middle {
    width: 126px;
    height: 126px;
    background: radial-gradient(circle, rgba(253, 230, 138, 0.3) 0%, rgba(52, 211, 153, 0.22) 100%);
    border: 1px solid rgba(253, 230, 138, 0.38);
    transform: scale(0.9);
    opacity: 0.72;
  }

  .lotus-core {
    position: relative;
    z-index: 2;
    width: 84px;
    height: 84px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6ee7b7 0%, #fde68a 100%);
    color: #061b12;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    box-shadow: 0 0 32px rgba(110, 231, 183, 0.45);
    transition-property: transform;
    transition-timing-function: ease-in-out;
  }

  .lotus-halo.outer.inhale {
    transform: scale(1.16);
    opacity: 0.95;
  }
  .lotus-halo.middle.inhale {
    transform: scale(1.18);
    opacity: 0.95;
  }
  .lotus-core.inhale {
    transform: scale(1.18);
  }

  .lotus-halo.outer.exhale,
  .lotus-halo.middle.exhale,
  .lotus-core.exhale {
    transform: scale(0.78);
    opacity: 0.55;
  }
  .lotus-core.exhale {
    opacity: 0.92;
  }

  .phase-sec {
    font-size: 1.22rem;
    font-weight: 800;
  }

  .phase-leaf {
    font-size: 1.65rem;
  }

  .breath-instruction {
    min-height: 3.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.22rem;
  }

  .breath-instruction strong {
    font-size: 1.05rem;
    color: #fde68a;
  }

  .breath-instruction span {
    font-size: 0.84rem;
    color: rgba(232, 246, 238, 0.86);
  }

  .breath-cta {
    border: none;
    border-radius: 999px;
    padding: 0.82rem 1.5rem;
    font-family: inherit;
    font-weight: 800;
    font-size: 0.92rem;
    cursor: pointer;
    transition: transform 0.18s ease;
  }

  .breath-cta.start {
    background: linear-gradient(135deg, #6ee7b7 0%, #fde68a 100%);
    color: #061b12;
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.26);
  }

  .breath-cta.stop {
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.24);
    color: #ffffff;
  }

  .breath-cta:hover {
    transform: translateY(-2px);
  }

  /* =========================================================================
     3. CALM RAY OF HOPE CARD
     ========================================================================= */
  .calm-hope-card {
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(22, 82, 56, 0.1);
    border-radius: 28px;
    padding: 2rem 2.2rem;
    box-shadow: var(--shadow-sm);
  }

  .chc-proof {
    margin: 0 0 0.65rem 0;
    font-size: 0.98rem;
    line-height: 1.62;
    color: var(--text-primary);
  }

  .chc-psych {
    margin: 0 0 1.25rem 0;
    font-size: 0.88rem;
    color: var(--text-secondary);
    background: #eef6f0;
    padding: 0.65rem 0.95rem;
    border-radius: 14px;
  }

  .chc-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .gentle-step-link {
    color: var(--emerald-600);
    font-weight: 700;
    font-size: 0.9rem;
    text-decoration: none;
  }

  .gentle-step-link:hover {
    text-decoration: underline;
  }

  /* =========================================================================
     4. OPTIONAL COLLAPSIBLE DRAWERS
     ========================================================================= */
  .optional-drawers {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .drawer-inner {
    margin-top: 1.1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(22, 82, 56, 0.09);
  }

  .drawer-note {
    margin: 0 0 1rem 0;
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.55;
  }

  .story-studio-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .story-mode-tabs {
    display: inline-flex;
    gap: 0.4rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .story-mode-tabs button {
    padding: 0.48rem 0.95rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 82, 56, 0.15);
    background: #ffffff;
    color: var(--text-secondary);
    font-family: inherit;
    font-weight: 700;
    font-size: 0.84rem;
    cursor: pointer;
  }

  .story-mode-tabs button.active {
    background: #123828;
    color: #fde68a;
    border-color: #123828;
  }

  .story-preview-frame {
    width: 230px;
    aspect-ratio: 9 / 16;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
    border: 1px solid rgba(22, 82, 56, 0.16);
    margin-bottom: 1rem;
    background: #0c291d;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .story-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .story-loading {
    color: #fde68a;
    font-size: 0.82rem;
    padding: 1rem;
  }

  .story-dl-btn {
    border: none;
    border-radius: 999px;
    padding: 0.82rem 1.45rem;
    background: linear-gradient(135deg, #0f3626 0%, #175038 100%);
    color: #fde68a;
    font-family: inherit;
    font-weight: 800;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .story-msg {
    margin-top: 0.6rem;
    font-size: 0.84rem;
    color: var(--emerald-600);
    font-weight: 600;
  }

  .empty-journal {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .journal-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .journal-item {
    padding: 0.85rem 1rem;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid rgba(22, 82, 56, 0.09);
  }

  .ji-top {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.25rem;
  }

  .ji-title {
    font-weight: 700;
    font-size: 0.92rem;
    color: var(--text-primary);
  }

  .ji-date {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .ji-note {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    font-style: italic;
    color: var(--text-secondary);
  }

  .ji-add-note {
    border: none;
    background: transparent;
    padding: 0;
    color: var(--emerald-600);
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  .ji-edit {
    display: flex;
    gap: 0.45rem;
    margin-top: 0.35rem;
  }

  .ji-edit input {
    flex: 1;
    padding: 0.45rem 0.7rem;
    border-radius: 10px;
    border: 1px solid rgba(22, 82, 56, 0.18);
    font-family: inherit;
    font-size: 0.84rem;
  }

  .ji-edit button {
    border: none;
    border-radius: 10px;
    padding: 0.45rem 0.85rem;
    background: #123828;
    color: #fde68a;
    font-family: inherit;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
  }

  @media (max-width: 920px) {
    .breathing-sanctuary {
      grid-template-columns: 1fr;
    }
    .atmosphere-controls,
    .atmo-sub-row {
      align-items: flex-start;
      justify-content: flex-start;
    }
  }

  @media (max-width: 640px) {
    .sanctuary-stage {
      padding: 1.45rem 1.15rem 1.25rem;
      border-radius: 24px;
    }
    .sanctuary-viewport {
      aspect-ratio: 4 / 3;
    }
    .breathing-sanctuary,
    .calm-hope-card {
      padding: 1.5rem 1.25rem;
      border-radius: 24px;
    }
  }
</style>
