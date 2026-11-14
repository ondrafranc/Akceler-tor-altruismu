<script>
  import { onDestroy } from 'svelte';
  import {
    getActionEffectMeta,
    impactCanvas,
    triggerCanvasBurst,
    playPayoffAsmr,
    describeAmbientPulse,
    playCelebrationChord,
    safeVibrate,
    startHoldSpark
  } from '../../../../lib/sensoryEngine.js';
  import { trackEvent, openBrokenLinkReport } from '../../../../lib/analytics.js';
  import { notifyMollySpark } from '../../../../lib/mollyStore.js';
  import { cleanTitle, stripLeadingEmoji } from '../../../../lib/utils.js';
  import { VALUES } from '../../../data/values.js';
  import EvidenceBadge from './EvidenceBadge.svelte';

  export let action = null;
  export let isStarted = false;
  export let isCompleted = false;
  export let justCompleted = false;
  export let partnerReturnPromptVisible = false;
  export let ambientPulse = null;
  export let soundMuted = false;
  export let showEffectPreview = false;
  export let copiedDirectLink = false;
  export let savedValues = [];
  export let usePersonalValues = false;
  export let variant = 'instant'; // 'instant' | 'directory' | 'compact'
  export let spotlight = false;
  export let className = '';

  export let onStart = null;
  export let onComplete = null;
  export let onShare = null;
  export let onReportBroken = null;
  export let onToggleSound = null;
  export let onTogglePersonalValues = null;
  export let onNextIdea = null;
  export let onDismissReturn = null;
  export let onCloseSession = null;

  let kibbleGrams = 0;
  let sparkBoosted = false;
  let cardCanvasNode = null;
  let primaryBtnNode = null;
  let stopHoldSpark = null;
  let lastHoldActionId = null;
  let lastCelebratedActionId = null;

  // Interactive anticipation diorama state (zero-reflow cached bounds)
  /** @type {DOMRect | null} */
  let previewBounds = null;
  let previewHovered = false;
  let ctaHovered = false;
  let previewNudged = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let previewNudgeTimer = null;
  let spotX = 50;
  let spotY = 34;
  let tiltX = 0;
  let tiltY = 0;

  function endHoldSpark(released = false) {
    if (stopHoldSpark) {
      stopHoldSpark(released);
      stopHoldSpark = null;
    } else if (primaryBtnNode) {
      primaryBtnNode.style.setProperty('--spark-charge', '0');
      primaryBtnNode.classList.remove('spark-ready');
    }
  }

  function handlePrimaryPointerDown(e) {
    if (e.button && e.button !== 0) return;
    endHoldSpark(false);
    stopHoldSpark = startHoldSpark(e.currentTarget, () => {
      trackEvent('aa_hold_spark_ready', { id: action?.id, surface: variant });
    });
  }

  function handlePreviewPointerEnter(e) {
    previewBounds = e.currentTarget.getBoundingClientRect();
    previewHovered = true;
  }

  function handlePreviewPointerMove(e) {
    if (!previewBounds) return;
    const nx = Math.max(0, Math.min(1, (e.clientX - previewBounds.left) / Math.max(1, previewBounds.width)));
    const ny = Math.max(0, Math.min(1, (e.clientY - previewBounds.top) / Math.max(1, previewBounds.height)));
    spotX = Math.round(nx * 100);
    spotY = Math.round(ny * 100);
    tiltX = Number(((nx - 0.5) * 2).toFixed(2));
    tiltY = Number(((ny - 0.5) * 2).toFixed(2));
  }

  function handlePreviewPointerLeave() {
    previewHovered = false;
    previewBounds = null;
    spotX = 50;
    spotY = 34;
    tiltX = 0;
    tiltY = 0;
  }

  function handlePreviewNudge() {
    previewNudged = false;
    if (previewNudgeTimer) clearTimeout(previewNudgeTimer);
    // Re-trigger nudge pulse cleanly even on repeated taps
    requestAnimationFrame(() => {
      previewNudged = true;
    });
    previewNudgeTimer = setTimeout(() => {
      previewNudged = false;
    }, 1050);
  }

  $: if (action?.id !== lastHoldActionId) {
    lastHoldActionId = action?.id || null;
    endHoldSpark(false);
    previewNudged = false;
    ctaHovered = false;
  }

  onDestroy(() => {
    endHoldSpark(false);
    if (previewNudgeTimer) clearTimeout(previewNudgeTimer);
  });

  $: if (justCompleted && action && action.id !== lastCelebratedActionId) {
    lastCelebratedActionId = action.id;
    try {
      safeVibrate(40);
      playCelebrationChord();
    } catch {}
  }

  function handleWeightUpdate(g) {
    kibbleGrams = g;
  }

  function getSavedValueLabels(ids) {
    if (!ids || !ids.length) return '';
    return VALUES.filter((v) => ids.includes(v.key || v.id))
      .map((v) => stripLeadingEmoji(v.label))
      .slice(0, 2)
      .join(', ');
  }

  function triggerEffectSpark() {
    if (!action) return;
    showEffectPreview = true;
    sparkBoosted = true;
    notifyMollySpark(action, { surface: variant });
    if (cardCanvasNode) {
      triggerCanvasBurst(cardCanvasNode, true);
    } else {
      playPayoffAsmr(action);
    }
    trackEvent('aa_effect_preview_toggle', {
      id: action.id,
      open: true,
      surface: variant
    });
  }

  function getCategoryAura(act, scene = '') {
    if (!act) return null;
    const element = act.element || '';
    const id = act.id || '';
    const values = act.values || [];

    // 1. Přesné určení podle scény a primárního elementu (před fallbackem na sekundární values,
    // aby se např. občanská věda Zooniverse neoznačovala jako „Útulek“)
    if (scene === 'kibble' || scene === 'shelter_care' || id.includes('utulek') || id.includes('utulky') || id.includes('feed')) {
      return { label: 'Útulek a zvířata', shortLabel: 'Útulek', theme: 'animals' };
    }
    if (scene === 'wildlife_rescue' || scene === 'birds_glass' || scene === 'birds_song' || scene === 'butterfly_lens' || element === 'animals') {
      return { label: 'Ptáci a volná příroda', shortLabel: 'Volná příroda', theme: 'wildlife' };
    }
    if (element === 'knowledge' || element === 'science') {
      return { label: 'Věda a poznání', shortLabel: 'Poznání', theme: 'science' };
    }
    if (element === 'nature') {
      return { label: 'Příroda a krajina', shortLabel: 'Příroda', theme: 'nature' };
    }
    if (element === 'community') {
      return { label: 'Blízkost a komunita', shortLabel: 'Komunita', theme: 'community' };
    }
    if (element === 'care') {
      return { label: 'Zdraví a přímá opora', shortLabel: 'Péče a opora', theme: 'care' };
    }

    // 2. Fallback pro vlastní nebo minimální záznamy bez elementu
    if (values.includes('animals') || id.includes('zvirata')) {
      return { label: 'Pomoc zvířatům', shortLabel: 'Zvířata', theme: 'animals' };
    }
    if (values.includes('environment') || values.includes('nature') || values.includes('climate') || id.includes('strom') || id.includes('priroda') || id.includes('ptaci') || id.includes('studank') || id.includes('uklid')) {
      return { label: 'Příroda a krajina', shortLabel: 'Příroda', theme: 'nature' };
    }
    if (values.includes('science') || values.includes('education') || id.includes('maps') || id.includes('veda') || id.includes('wiki') || id.includes('digital')) {
      return { label: 'Věda a poznání', shortLabel: 'Poznání', theme: 'science' };
    }
    if (values.includes('community') || values.includes('elderly') || id.includes('knihobudka') || id.includes('senior') || id.includes('soused')) {
      return { label: 'Blízkost a komunita', shortLabel: 'Komunita', theme: 'community' };
    }
    if (values.includes('health') || values.includes('poverty') || id.includes('zachranka') || id.includes('jidlo') || id.includes('ryze')) {
      return { label: 'Zdraví a přímá opora', shortLabel: 'Péče a opora', theme: 'care' };
    }
    return { label: 'Dobrý skutek', shortLabel: 'Skutek', theme: 'default' };
  }

  function resolvePreviewSceneFamily(scene, auraTheme) {
    if (['kibble', 'shelter_care'].includes(scene)) return 'animals';
    if (scene === 'wildlife_rescue') return 'wildlife';
    if (['birds_glass', 'birds_song', 'butterfly_lens'].includes(scene)) return 'birds';
    if (['satellite_map', 'code_nodes', 'cosmos_science', 'wiki_ink', 'dove_appeal'].includes(scene)) return 'science';
    if (['rice', 'food_bank', 'soup_lantern', 'zero_waste_pot', 'bakery_save'].includes(scene)) return 'nourish';
    if (['forest_bloom', 'compost_sprout', 'fruit_tree', 'eco_cleanup', 'water_spring', 'campfire_group', 'globe_bridge', 'phone_recycle'].includes(scene)) return 'nature';
    if (!scene) {
      if (auraTheme === 'animals') return 'animals';
      if (auraTheme === 'wildlife') return 'wildlife';
      if (auraTheme === 'science') return 'science';
      return 'nature';
    }
    return 'care';
  }

  function buildPreviewCue(act, meta) {
    if (!act) return { promise: '', status: '' };
    const id = act.id || '';
    let promise = meta?.label || 'Ověřený dobrý skutek';
    if (id === 'zvirata_utulek_online') promise = '1 klik zdarma = ~25 g granulí do misky';
    else if (id === 'donio_utulky') promise = 'Plná miska a přímá péče v útulku';
    else if (id === 'zvire_v_nouzi') promise = '774 155 155 · 34 záchranných stanic v ČR';
    else if (id === 'freerice_ryze') promise = '10 zrnek rýže OSN za každou odpověď';
    else if (id === 'missing_maps') promise = '10 zmapovaných střech pro záchranáře';
    else if (id === 'birdlife_ptaci_pasti') promise = 'Bezpečné sklo pro ptáky v tvém okolí';
    else if (id === 'strnadi_nareci') promise = '15 s zpěvu strnada pro české vědce';
    else if (id === 'zooniverse_veda') promise = '5 snímků z fotopastí a vesmíru';
    else if (id === 'wikipedie_cz') promise = '1 zpřesněný článek pro tisíce čtenářů';
    else if (id === 'aplikace_zachranka') promise = 'Přesná GPS a mapa AED v kapse';

    let status = 'Ověřeno · bez účtu';
    if (id === 'zvirata_utulek_online' || id === 'donio_utulky') {
      status = 'Miska čeká prázdná';
    } else if (act.mode === 'online' && act.cost === 'free') {
      status = 'Připraveno · 0 Kč';
    } else if (act.mode === 'local') {
      status = 'Ověřeno · v okolí';
    }
    return { promise, status };
  }

  function cleanPayoffBadge(raw) {
    return raw ? String(raw).replace(/\s*🐾\s*/g, '').trim() : '';
  }

  function hasPawInBadge(raw) {
    return Boolean(raw && String(raw).includes('🐾'));
  }

  $: safeSvgId = (action?.id || 'act').replace(/[^a-zA-Z0-9_-]/g, '_');
  $: effectMeta = action
    ? getActionEffectMeta(action, kibbleGrams, { isReturnStrip: partnerReturnPromptVisible })
    : null;
  $: categoryAura = getCategoryAura(action, effectMeta?.scene);
  $: previewSceneFamily = resolvePreviewSceneFamily(effectMeta?.scene, categoryAura?.theme);
  $: previewCue = buildPreviewCue(action, effectMeta);
  $: showIdleDiorama = variant === 'instant' && !isStarted && !justCompleted && !partnerReturnPromptVisible;
  $: ambientPulseText = describeAmbientPulse(ambientPulse, { inCard: true, actionId: action?.id });
  $: actionTitle = action ? cleanTitle(action.title) : '';
</script>

{#if action}
  <article
    id={action ? `online-card-${action.id}` : undefined}
    class="action-card card instant-body {className}"
    class:directory-card={variant === 'directory'}
    class:has-preview-stage={showIdleDiorama}
    class:spotlight
    class:done-card={isCompleted}
    class:is-done={isCompleted}
  >
    <!-- 0. Živá scéna očekávání (pouze v klidovém stavu před spuštěním akce — nebudí falešný pocit splnění) -->
    {#if showIdleDiorama}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="deed-preview-stage scene-family-{previewSceneFamily}"
        class:is-primed={previewHovered || ctaHovered || previewNudged}
        class:is-nudged={previewNudged}
        style="--spot-x: {spotX}%; --spot-y: {spotY}%; --tilt-x: {tiltX}; --tilt-y: {tiltY};"
        on:pointerenter={handlePreviewPointerEnter}
        on:pointermove={handlePreviewPointerMove}
        on:pointerleave={handlePreviewPointerLeave}
        on:click={handlePreviewNudge}
      >
        <div class="preview-hud">
          <span class="preview-promise-pill">
            <span class="preview-promise-spark" aria-hidden="true">✦</span>
            <span>{previewCue.promise}</span>
          </span>
          <span class="preview-status-pill" class:nudged={previewNudged}>
            <span class="preview-status-dot" aria-hidden="true"></span>
            <span>{previewNudged ? '↓ Spusť tlačítkem níže' : previewCue.status}</span>
          </span>
        </div>

        <svg
          class="preview-diorama-svg"
          viewBox="0 0 380 100"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="beamGrad-{safeSvgId}" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stop-color="#fde68a" stop-opacity="0.34" />
              <stop offset="65%" stop-color="#34d399" stop-opacity="0.12" />
              <stop offset="100%" stop-color="#052e1e" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="bowlGrad-{safeSvgId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fbbf24" />
              <stop offset="100%" stop-color="#b45309" />
            </linearGradient>
            <linearGradient id="groundGrad-{safeSvgId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0e402b" />
              <stop offset="100%" stop-color="#04150e" />
            </linearGradient>
          </defs>

          <!-- Společná hloubková krajina a světlušky -->
          <path d="M0,88 Q92,68 190,78 T380,74 L380,100 L0,100 Z" fill="#092d1e" opacity="0.55" />
          <path d="M0,85 Q95,72 190,81 T380,77 L380,100 L0,100 Z" fill="url(#groundGrad-{safeSvgId})" opacity="0.94" />
          <circle class="diorama-firefly f1" cx="44" cy="48" r="2.1" fill="#fde68a" />
          <circle class="diorama-firefly f2" cx="98" cy="64" r="1.7" fill="#6ee7b7" />
          <circle class="diorama-firefly f3" cx="334" cy="42" r="2" fill="#fde68a" />
          <circle class="diorama-firefly f4" cx="250" cy="56" r="1.5" fill="#6ee7b7" />

          {#if previewSceneFamily === 'animals'}
            <!-- Kužel teplého světla nad čekající prázdnou miskou -->
            <polygon class="diorama-beam" points="144,0 218,0 238,85 124,85" fill="url(#beamGrad-{safeSvgId})" />

            <!-- Vznášející se zlaté granulky s jemnými stopami očekávání -->
            <g class="diorama-floating-cluster">
              <line x1="169" y1="46" x2="172" y2="59" stroke="rgba(253, 230, 138, 0.3)" stroke-width="1" stroke-dasharray="2 2" />
              <line x1="185" y1="41" x2="184" y2="57" stroke="rgba(253, 230, 138, 0.35)" stroke-width="1" stroke-dasharray="2 2" />
              <line x1="198" y1="51" x2="195" y2="61" stroke="rgba(253, 230, 138, 0.28)" stroke-width="1" stroke-dasharray="2 2" />
              <circle cx="169" cy="42" r="4.1" fill="#fbbf24" stroke="#fef3c7" stroke-width="1" />
              <circle cx="185" cy="36" r="4.6" fill="#f59e0b" stroke="#fde68a" stroke-width="1.1" />
              <circle cx="198" cy="47" r="3.9" fill="#fbbf24" stroke="#fef3c7" stroke-width="1" />
              <circle cx="178" cy="51" r="3.6" fill="#fde68a" />
              <circle cx="158" cy="50" r="3.1" fill="#f59e0b" />
            </g>

            <!-- Útulková miska čekající na naplnění -->
            <g class="diorama-focal">
              <ellipse cx="181" cy="87" rx="45" ry="6.5" fill="#03110b" opacity="0.58" />
              <path d="M143,69 L151,86 Q181,92 211,86 L219,69 Z" fill="url(#bowlGrad-{safeSvgId})" stroke="#fde68a" stroke-width="1.2" />
              <ellipse cx="181" cy="69" rx="38" ry="6.8" fill="#1b140d" stroke="#fcd34d" stroke-width="1.3" />
              <ellipse class="bowl-inner-glow" cx="181" cy="69.5" rx="28" ry="4" fill="#fbbf24" opacity="0.2" />
              <!-- Tlapka na misce -->
              <circle cx="181" cy="79.6" r="2.5" fill="#fef3c7" opacity="0.94" />
              <circle cx="176.2" cy="76" r="1.25" fill="#fef3c7" opacity="0.92" />
              <circle cx="181" cy="74.8" r="1.25" fill="#fef3c7" opacity="0.92" />
              <circle cx="185.8" cy="76" r="1.25" fill="#fef3c7" opacity="0.92" />
            </g>

            <!-- Želvovinová kočička s oběma viditelnými oušky a konturovým protisvětlem -->
            <g class="diorama-kitty">
              <ellipse cx="288" cy="88" rx="19" ry="4.5" fill="#03110b" opacity="0.5" />
              <!-- Ocas -->
              <path d="M300,84 C314,83 321,73 317,63" fill="none" stroke="#d97706" stroke-width="3.6" stroke-linecap="round" />
              <path d="M317,63 C316,60 313,59 311,61" fill="none" stroke="#fde68a" stroke-width="2.2" stroke-linecap="round" />
              <!-- Tělo se želvovinovými skvrnami a jemnou konturou -->
              <ellipse cx="288" cy="79.5" rx="13.5" ry="10.2" fill="#1c1613" stroke="rgba(253, 230, 138, 0.34)" stroke-width="1" />
              <ellipse cx="293" cy="77" rx="5.5" ry="4.4" fill="#d97706" opacity="0.82" />
              <ellipse cx="283" cy="83" rx="4.2" ry="3" fill="#f59e0b" opacity="0.65" />
              <ellipse cx="277" cy="87.5" rx="3.3" ry="2" fill="#fef3c7" opacity="0.9" />
              <ellipse cx="284" cy="88" rx="3.3" ry="2" fill="#d97706" opacity="0.9" />
              <!-- Hlava a OBĚ ouška s teplým lemem proti tmavému lesu -->
              <path d="M268,61 L269.5,49.5 L277,57.5 Z" fill="#231b17" stroke="#fbbf24" stroke-width="1.15" stroke-linejoin="round" />
              <path d="M279,57.5 L286.5,49.5 L288,61 Z" fill="#d97706" stroke="#fde68a" stroke-width="1.15" stroke-linejoin="round" />
              <polygon points="270.4,58.5 271.2,52.8 275.2,57.2" fill="#f59e0b" opacity="0.65" />
              <polygon points="280.8,57.2 284.8,52.8 285.6,58.5" fill="#fef3c7" opacity="0.55" />
              <circle cx="278" cy="66.5" r="9.6" fill="#1c1613" stroke="rgba(253, 230, 138, 0.38)" stroke-width="1" />
              <!-- Poloviční želvovinová maska -->
              <path d="M278,56.9 A9.6,9.6 0 0,1 278,76.1 Z" fill="#d97706" opacity="0.82" />
              <!-- Výrazné zlatavé oči sledující misku -->
              <circle cx="274" cy="66.2" r="2.25" fill="#fef08a" />
              <circle cx="281.6" cy="66.2" r="2.25" fill="#fef08a" />
              <circle cx="273.3" cy="66.2" r="0.95" fill="#05150f" />
              <circle cx="280.9" cy="66.2" r="0.95" fill="#05150f" />
              <circle cx="274.5" cy="65.5" r="0.5" fill="#ffffff" />
              <circle cx="282.1" cy="65.5" r="0.5" fill="#ffffff" />
              <!-- Čumáček a fousky -->
              <polygon points="276.6,69.6 279.2,69.6 277.9,71.1" fill="#fda4af" />
              <line x1="264" y1="68" x2="270" y2="68.8" stroke="rgba(254, 243, 199, 0.55)" stroke-width="0.8" stroke-linecap="round" />
              <line x1="264.5" y1="70.8" x2="270.2" y2="70.4" stroke="rgba(254, 243, 199, 0.45)" stroke-width="0.8" stroke-linecap="round" />
            </g>
          {:else if previewSceneFamily === 'wildlife'}
            <!-- Záchrana volně žijících zvířat v přírodě (ježek, ptáček a ochranná aura — bez granulí v misce) -->
            <polygon class="diorama-beam" points="148,0 232,0 252,88 128,88" fill="url(#beamGrad-{safeSvgId})" />
            <!-- Lesní kapradí a keře -->
            <path d="M98,84 Q108,64 124,58 Q116,74 114,84 Z" fill="#10b981" opacity="0.34" />
            <path d="M282,84 Q272,62 256,56 Q264,72 266,84 Z" fill="#34d399" opacity="0.32" />
            <!-- Ochranná záchranná aura -->
            <g class="diorama-floating-cluster">
              <circle cx="190" cy="64" r="28" fill="none" stroke="rgba(253, 230, 138, 0.42)" stroke-width="1.3" stroke-dasharray="4 3" />
              <path d="M190,34 L192,39 L197,41 L192,43 L190,48 L188,43 L183,41 L188,39 Z" fill="#fde68a" />
            </g>
            <!-- Ježeček v bezpečí pod světlem -->
            <g class="diorama-focal">
              <ellipse cx="188" cy="85" rx="26" ry="5" fill="#03110b" opacity="0.5" />
              <path d="M168,82 C168,67 184,61 199,66 C206,68 210,75 212,81 Z" fill="#92400e" stroke="#fde68a" stroke-width="1.2" />
              <path d="M172,74 L175,66 L180,72 L185,64 L189,71 L195,65 L198,73" fill="none" stroke="#fde68a" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M198,72 Q209,73 214,79 Q206,83 197,82 Z" fill="#fde68a" opacity="0.9" />
              <circle cx="206" cy="76.5" r="1.4" fill="#05150f" />
              <circle cx="213.5" cy="78.8" r="1.6" fill="#1f1a17" />
              <!-- Drobný ptáček na větvičce -->
              <path d="M138,54 Q146,45 154,52 Q161,45 168,53" fill="none" stroke="#6ee7b7" stroke-width="2.3" stroke-linecap="round" />
            </g>
          {:else if previewSceneFamily === 'birds'}
            <!-- Bezpečná skla s ochrannými body a letící ptáci -->
            <rect x="68" y="34" width="64" height="48" rx="6" fill="rgba(56, 189, 248, 0.08)" stroke="#7dd3fc" stroke-width="1.2" stroke-dasharray="3 3" />
            <g class="diorama-floating-cluster">
              <circle cx="82" cy="46" r="2.2" fill="#fde68a" />
              <circle cx="100" cy="46" r="2.2" fill="#fde68a" />
              <circle cx="118" cy="46" r="2.2" fill="#fde68a" />
              <circle cx="82" cy="64" r="2.2" fill="#fde68a" />
              <circle cx="100" cy="64" r="2.2" fill="#fde68a" />
              <circle cx="118" cy="64" r="2.2" fill="#fde68a" />
            </g>
            <path d="M148,68 Q210,34 292,52" fill="none" stroke="rgba(110, 231, 183, 0.34)" stroke-width="1.5" stroke-dasharray="4 4" />
            <g class="diorama-focal">
              <path d="M180,56 Q191,42 201,53 Q211,42 222,56" fill="none" stroke="#fde68a" stroke-width="2.8" stroke-linecap="round" />
              <path d="M240,46 Q249,35 257,45 Q265,35 274,46" fill="none" stroke="#6ee7b7" stroke-width="2.4" stroke-linecap="round" />
              <circle cx="298" cy="52" r="10" fill="none" stroke="rgba(253, 230, 138, 0.38)" stroke-width="1.3" />
              <circle cx="298" cy="52" r="18" fill="none" stroke="rgba(52, 211, 153, 0.24)" stroke-width="1.1" />
            </g>
          {:else if previewSceneFamily === 'science'}
            <!-- Satelitní mřížka a obrysy budov / uzlů poznání -->
            <g opacity="0.28" stroke="#34d399" stroke-width="0.8">
              <line x1="70" y1="36" x2="310" y2="36" />
              <line x1="55" y1="58" x2="325" y2="58" />
              <line x1="40" y1="80" x2="340" y2="80" />
              <line x1="120" y1="24" x2="100" y2="92" />
              <line x1="190" y1="24" x2="190" y2="92" />
              <line x1="260" y1="24" x2="280" y2="92" />
            </g>
            <polygon class="diorama-beam" points="154,0 226,0 256,92 124,92" fill="url(#beamGrad-{safeSvgId})" />
            <g class="diorama-focal">
              <rect x="136" y="48" width="26" height="20" rx="2.5" fill="rgba(56, 189, 248, 0.16)" stroke="#38bdf8" stroke-width="1.6" />
              <rect x="176" y="42" width="32" height="24" rx="2.5" fill="rgba(251, 191, 36, 0.2)" stroke="#fde68a" stroke-width="1.8" />
              <rect x="222" y="52" width="24" height="18" rx="2.5" fill="rgba(52, 211, 153, 0.18)" stroke="#6ee7b7" stroke-width="1.6" />
            </g>
            <g class="diorama-floating-cluster">
              <circle cx="192" cy="34" r="3.2" fill="#fde68a" />
              <line x1="149" y1="58" x2="192" y2="54" stroke="#fde68a" stroke-width="1.1" stroke-dasharray="2.5 2.5" />
              <line x1="192" y1="54" x2="234" y2="61" stroke="#6ee7b7" stroke-width="1.1" stroke-dasharray="2.5 2.5" />
            </g>
          {:else if previewSceneFamily === 'nourish'}
            <!-- Teplá miska a darovaná zrnka / porce jídla -->
            <polygon class="diorama-beam" points="152,0 228,0 244,86 136,86" fill="url(#beamGrad-{safeSvgId})" />
            <g class="diorama-floating-cluster">
              <ellipse cx="176" cy="42" rx="4" ry="2.3" transform="rotate(-18 176 42)" fill="#fef3c7" />
              <ellipse cx="191" cy="37" rx="4.2" ry="2.4" transform="rotate(14 191 37)" fill="#fde68a" />
              <ellipse cx="202" cy="46" rx="3.8" ry="2.2" transform="rotate(-12 202 46)" fill="#ffffff" />
              <ellipse cx="184" cy="50" rx="4" ry="2.3" transform="rotate(20 184 50)" fill="#fde68a" />
            </g>
            <g class="diorama-focal">
              <path d="M152,66 A38,24 0 0,0 228,66 Z" fill="url(#bowlGrad-{safeSvgId})" stroke="#fef3c7" stroke-width="1.4" />
              <ellipse cx="190" cy="66" rx="38" ry="6" fill="#fef3c7" opacity="0.9" />
              <path d="M174,56 Q170,46 175,38" fill="none" stroke="rgba(254, 243, 199, 0.55)" stroke-width="1.6" stroke-linecap="round" />
              <path d="M206,56 Q210,46 205,38" fill="none" stroke="rgba(254, 243, 199, 0.55)" stroke-width="1.6" stroke-linecap="round" />
            </g>
          {:else if previewSceneFamily === 'nature'}
            <!-- Živá krajina, studánka a klíčící strom -->
            <polygon class="diorama-beam" points="158,0 222,0 240,88 140,88" fill="url(#beamGrad-{safeSvgId})" />
            <ellipse cx="190" cy="84" rx="46" ry="7" fill="none" stroke="rgba(110, 231, 183, 0.4)" stroke-width="1.3" />
            <ellipse cx="190" cy="84" rx="28" ry="4.2" fill="none" stroke="rgba(253, 230, 138, 0.45)" stroke-width="1.2" />
            <g class="diorama-focal">
              <path d="M190,84 L190,52" stroke="#6ee7b7" stroke-width="3" stroke-linecap="round" />
              <path d="M190,66 Q172,62 170,48 Q184,48 190,62" fill="#34d399" stroke="#a7f3d0" stroke-width="1" />
              <path d="M190,60 Q208,56 210,42 Q196,42 190,56" fill="#10b981" stroke="#fde68a" stroke-width="1" />
            </g>
            <g class="diorama-floating-cluster">
              <circle cx="190" cy="36" r="3.6" fill="#fde68a" />
              <circle cx="168" cy="40" r="2.2" fill="#6ee7b7" />
              <circle cx="214" cy="36" r="2.4" fill="#fde68a" />
            </g>
          {:else}
            <!-- Lidská blízkost, záchrana a solidární most -->
            <polygon class="diorama-beam" points="150,0 230,0 250,88 130,88" fill="url(#beamGrad-{safeSvgId})" />
            <path d="M108,80 Q190,34 272,80" fill="none" stroke="#34d399" stroke-width="2.4" stroke-linecap="round" />
            <path d="M122,82 Q190,46 258,82" fill="none" stroke="rgba(253, 230, 138, 0.5)" stroke-width="1.4" stroke-dasharray="4 4" />
            <circle cx="108" cy="80" r="4.8" fill="#fde68a" />
            <circle cx="272" cy="80" r="4.8" fill="#6ee7b7" />
            <g class="diorama-floating-cluster">
              <circle cx="190" cy="48" r="13" fill="rgba(251, 191, 36, 0.16)" stroke="rgba(253, 230, 138, 0.55)" stroke-width="1.2" />
              <path d="M190,54 C190,54 181,48 181,43.5 C181,40.8 183.2,39 185.6,39 C187.4,39 189,40.1 190,41.6 C191,40.1 192.6,39 194.4,39 C196.8,39 199,40.8 199,43.5 C199,48 190,54 190,54 Z" fill="#fde68a" />
            </g>
          {/if}
        </svg>
      </div>
    {/if}

    <!-- 1. Standardizovaná hlavička: Kategorie · Čas · Cena · Režim -->
    <div class="action-meta-line card-meta-top">
      {#if categoryAura}
        <span class="category-aura-chip category-aura-{categoryAura.theme}" aria-label="Kategorie: {categoryAura.label}">
          <span class="category-aura-icon" aria-hidden="true">
            {#if categoryAura.theme === 'animals'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="7.5" cy="9.5" r="2.3" />
                <circle cx="12" cy="7" r="2.3" />
                <circle cx="16.5" cy="9.5" r="2.3" />
                <path d="M12 12.2c-3.1 0-5.4 2.2-5.4 4.5 0 1.6 1.3 2.6 3 2.6 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.7 0 3-1 3-2.6 0-2.3-2.3-4.5-5.4-4.5Z" />
              </svg>
            {:else if categoryAura.theme === 'wildlife'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 14c3.5-4.5 7-4.5 9-1 2-3.5 5.5-3.5 9 1" />
                <path d="M12 13v5" />
              </svg>
            {:else if categoryAura.theme === 'science'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8" fill="currentColor" stroke="none" />
              </svg>
            {:else if categoryAura.theme === 'community'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            {:else if categoryAura.theme === 'care'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 20.5s-7.5-4.6-9.3-9C1.4 8.2 3.6 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.6 1.1-1.5 2.7-2.6 4.7-2.6 3.7 0 5.9 3.7 4.6 7-1.8 4.4-9.3 9-9.3 9Z" />
              </svg>
            {:else}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            {/if}
          </span>
          <span class="category-aura-label">{categoryAura.shortLabel}</span>
        </span>
      {/if}
      <span class="quick-tags-pill quick-tags-inline">
        {action.quickTagsLabel || '2 min · Zdarma · Online'}
      </span>
      {#if isCompleted}
        <span class="done-dot done-inline">· ✓ Splněno</span>
      {/if}
      {#if savedValues && savedValues.length > 0 && onTogglePersonalValues}
        <button
          type="button"
          class="personal-values-pill"
          class:active={usePersonalValues}
          on:click={onTogglePersonalValues}
          title="Přizpůsobit podle témat vybraných v průvodci"
        >
          {usePersonalValues ? `✦ Tvoje témata (${getSavedValueLabels(savedValues)})` : '🎯 Moje témata'}
        </button>
      {/if}
    </div>

    <!-- 2. Název příležitosti -->
    <h2 class="action-title card-title rec-title">{actionTitle}</h2>

    <!-- 3. Jasné vysvětlení jednoho konkrétního skutku -->
    <p class="action-desc card-desc rec-desc">{action.desc}</p>

    <!-- 4. Přínos (v katalogu viditelný přímo; na instant kartě výhradně v detailu bez duplicity) -->
    {#if variant === 'directory'}
      <div class="action-impact-summary card-impact-box rec-impact-block">
        <div class="impact-benefit-line card-benefit-line rec-impact-line">
          <strong>Přínos ({action.impactBasis || 'doložený'}):</strong>
          <span>{action.concreteImpact || action.selfBenefit}</span>
        </div>
      </div>
    {/if}

    <!-- 5. Sekundární metadata výhradně v rozbalovacím detailu -->
    <details class="how-toggle steps-inline">
      <summary>ℹ️ Jak to funguje ({action.steps?.length ? `${action.steps.length} ${action.steps.length === 1 ? 'krok' : action.steps.length < 5 ? 'kroky' : 'kroků'}` : 'důkazy a partner'})</summary>
      <div class="how-details-content">
        <div class="detail-evidence-line">
          <EvidenceBadge
            tier={action.impactEvidence || 'B'}
            variant={variant === 'directory' ? 'card' : 'pill'}
            className="card-evidence-badge rec-evidence-pill evidence-pill"
          />
        </div>
        <div class="partner-trust-line card-partner-line rec-partner-line">
          <span>
            {action.registrationRequired
              ? 'Krátká registrace u partnera'
              : 'Bez registrace na našem webu'}
          </span>
          <span>·</span>
          <span>Aktivita probíhá u <strong>{action.org}</strong></span>
        </div>
        {#if variant !== 'directory'}
          <div class="impact-benefit-line detail-impact-line">
            <strong>Přínos ({action.impactBasis || 'doložený'}):</strong>
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
            <span><strong>Aktivita:</strong> {action.impactChain.activity}</span>
            <span class="chain-arrow chain-sep">→</span>
            <span><strong>Výsledek:</strong> {action.impactChain.immediateOutput}</span>
            <span class="chain-arrow chain-sep">→</span>
            <span><strong>Skutečný dopad:</strong> {action.impactChain.realImpact}</span>
          </div>
        {/if}
        <div class="mobile-details-extra">
          <div class="mde-verify">
            <span>
              Ověřeno: <strong>{action.verifiedLabel}</strong> · Zdroj:
              <a
                href={action.sourceUrl || action.url}
                target="_blank"
                rel="noopener noreferrer"
                class="verify-source-link"
              >
                {action.org} ↗
              </a>
            </span>
            <div class="mde-row">
              {#if onShare}
                <button
                  type="button"
                  class="mde-share-btn"
                  on:click={() => onShare(action)}
                >
                  {copiedDirectLink ? '✓ Odkaz zkopírován' : '🔗 Sdílet odkaz'}
                </button>
              {/if}
              <button
                type="button"
                class="mde-broken-btn"
                on:click={() => {
                  if (onReportBroken) onReportBroken(action);
                  else openBrokenLinkReport({ id: action.id, title: actionTitle, org: action.org, url: action.url });
                }}
              >
                Nahlásit chybu
              </button>
            </div>
          </div>
        </div>
      </div>
    </details>

    <!-- 6. In-situ oslava a odměna po dokončení nebo návratu od partnera -->
    {#if justCompleted}
      <div
        class="celebration-card inline-celebration-card in-situ-celebration"
        role="status"
        aria-live="polite"
        data-scene={effectMeta?.scene || 'default'}
      >
        <div class="inline-celebration-head">
          <span class="kicker celebration-kicker">🎉 Skvělá práce! Dobrý skutek je hotový</span>
          {#if effectMeta?.badge}
            <span class="impact-payoff-badge">
              <span>{cleanPayoffBadge(effectMeta.badge)}</span>
              {#if hasPawInBadge(effectMeta.badge)}
                <svg class="badge-paw-svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="7.5" cy="9.5" r="2.3" />
                  <circle cx="12" cy="7" r="2.3" />
                  <circle cx="16.5" cy="9.5" r="2.3" />
                  <path d="M12 12.2c-3.1 0-5.4 2.2-5.4 4.5 0 1.6 1.3 2.6 3 2.6 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.7 0 3-1 3-2.6 0-2.3-2.3-4.5-5.4-4.5Z" />
                </svg>
              {/if}
            </span>
          {/if}
        </div>
        <h3 class="win-title">{actionTitle}</h3>
        <canvas
          class="impact-payoff-canvas"
          width="320"
          height="118"
          use:impactCanvas={{ action, climax: true, onWeightUpdate: handleWeightUpdate }}
          aria-label="Fyzikální vizualizace dopadu dobrého skutku"
        ></canvas>
        <div class="in-situ-affirmation">
          ✨ <strong>Dnes už tvůj dobrý skutek pomáhá.</strong> Můžeš pokračovat dalším drobným skutkem, nebo dnešní seanci s klidem uzavřít.
        </div>
        <div class="molly-celebration-note">
          🐾 <strong>Molly má radost!</strong> V <a href="/svet" class="molly-svet-inline-link">Krajině dobra</a> na ni za tvůj skutek čeká zasloužený pamlsek.
        </div>
        <div class="return-dopamine-actions in-situ-actions">
          {#if onCloseSession}
            <button
              type="button"
              class="return-dopamine-btn btn-session-close"
              on:click={onCloseSession}
              aria-label="Uzavřít dnešní seanci"
            >
              🌿 Pro dnešek hotovo
            </button>
          {/if}
          {#if onNextIdea}
            <button
              type="button"
              class="return-dopamine-btn btn-next-deed inline-celebration-next"
              on:click={onNextIdea}
              aria-label="Ukázat další doporučený skutek"
            >
              Další dobrý skutek →
            </button>
          {/if}
        </div>
      </div>
    {:else if partnerReturnPromptVisible}
      <div
        class="return-dopamine-strip in-situ-strip"
        role="status"
        aria-live="polite"
        data-scene={effectMeta?.scene || 'default'}
      >
        <div class="inline-celebration-head return-dopamine-head">
          <div class="return-dopamine-text return-dopamine-title">
            ✨ <strong>Vítej zpět!</strong> Povedlo se ti dokončit skutek u partnera?
          </div>
          {#if effectMeta?.returnBadge || effectMeta?.badge}
            <span class="impact-payoff-badge">
              <span>{cleanPayoffBadge(effectMeta.returnBadge || effectMeta.badge)}</span>
              {#if hasPawInBadge(effectMeta.returnBadge || effectMeta.badge)}
                <svg class="badge-paw-svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="7.5" cy="9.5" r="2.3" />
                  <circle cx="12" cy="7" r="2.3" />
                  <circle cx="16.5" cy="9.5" r="2.3" />
                  <path d="M12 12.2c-3.1 0-5.4 2.2-5.4 4.5 0 1.6 1.3 2.6 3 2.6 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.7 0 3-1 3-2.6 0-2.3-2.3-4.5-5.4-4.5Z" />
                </svg>
              {/if}
            </span>
          {/if}
        </div>
        <canvas
          class="impact-payoff-canvas"
          width="320"
          height="118"
          use:impactCanvas={{ action, climax: true, onWeightUpdate: handleWeightUpdate }}
          aria-label="Fyzikální vizualizace dopadu dobrého skutku"
        ></canvas>
        <div class="in-situ-affirmation">
          🌿 Každý drobný krok má skutečný význam.
        </div>
        <div class="return-dopamine-actions in-situ-actions">
          <button
            type="button"
            class="return-dopamine-btn btn-return-complete"
            on:click={() => onComplete && onComplete(action)}
          >
            ✓ Ano, mám hotovo
          </button>
          {#if onCloseSession}
            <button
              type="button"
              class="btn-session-close return-dopamine-svet-link"
              on:click={onCloseSession}
            >
              🌿 Pro dnešek hotovo
            </button>
          {:else if onDismissReturn}
            <button
              type="button"
              class="btn-return-dismiss return-dopamine-svet-link"
              on:click={onDismissReturn}
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
          target="_blank"
          rel="noopener noreferrer"
          class="btn-studio-primary btn-gold-action cta primary"
          class:cta-nudged={previewNudged}
          data-hold-spark="true"
          data-molly-guide="true"
          on:pointerenter={() => (ctaHovered = true)}
          on:pointerdown={handlePrimaryPointerDown}
          on:pointerup={() => endHoldSpark(true)}
          on:pointerleave={() => {
            ctaHovered = false;
            endHoldSpark(false);
          }}
          on:pointercancel={() => {
            ctaHovered = false;
            endHoldSpark(false);
          }}
          on:click={() => {
            endHoldSpark(true);
            if (onStart) onStart(action);
          }}
        >
          <!-- Vysoce kontrastní zlatavá vektorová ikona místo tmavě fialového OS emoji -->
          {#if categoryAura?.theme === 'animals'}
            <svg class="cta-lead-icon" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="7.5" cy="9.5" r="2.2" />
              <circle cx="12" cy="7" r="2.2" />
              <circle cx="16.5" cy="9.5" r="2.2" />
              <path d="M12 12.2c-3.1 0-5.4 2.2-5.4 4.5 0 1.6 1.3 2.6 3 2.6 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.7 0 3-1 3-2.6 0-2.3-2.3-4.5-5.4-4.5Z" />
            </svg>
          {:else if categoryAura?.theme === 'wildlife'}
            <svg class="cta-lead-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 14c3.5-4.5 7-4.5 9-1 2-3.5 5.5-3.5 9 1" />
              <path d="M12 13v5" />
            </svg>
          {:else if categoryAura?.theme === 'nature'}
            <svg class="cta-lead-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          {:else if categoryAura?.theme === 'care'}
            <svg class="cta-lead-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 20.5s-7.5-4.6-9.3-9C1.4 8.2 3.6 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.6 1.1-1.5 2.7-2.6 4.7-2.6 3.7 0 5.9 3.7 4.6 7-1.8 4.4-9.3 9-9.3 9Z" />
            </svg>
          {:else}
            <svg class="cta-lead-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
            </svg>
          {/if}
          <span>{action.id === 'zvirata_utulek_online' ? 'Nakrmit útulek teď' : (action.cta || 'Začít pomáhat')}</span>
          <svg
            class="cta-arrow-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </a>

        {#if isStarted && !partnerReturnPromptVisible}
          <button
            type="button"
            class="btn-studio-done btn-done-action cta secondary done-btn"
            class:initiated={isStarted}
            on:click={() => onComplete && onComplete(action)}
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
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{action.doneCta || 'Dokončeno'}</span>
          </button>
        {/if}
      </div>

      {#if isStarted && !partnerReturnPromptVisible}
        <div
          class="card-effect-stage"
          data-scene={effectMeta?.scene || 'default'}
        >
          <div class="card-effect-head">
            {#if effectMeta?.badge}
              <span class="impact-payoff-badge">
                <span>{cleanPayoffBadge(effectMeta.badge)}</span>
                {#if hasPawInBadge(effectMeta.badge)}
                  <svg class="badge-paw-svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="7.5" cy="9.5" r="2.3" />
                    <circle cx="12" cy="7" r="2.3" />
                    <circle cx="16.5" cy="9.5" r="2.3" />
                    <path d="M12 12.2c-3.1 0-5.4 2.2-5.4 4.5 0 1.6 1.3 2.6 3 2.6 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.7 0 3-1 3-2.6 0-2.3-2.3-4.5-5.4-4.5Z" />
                  </svg>
                {/if}
              </span>
            {/if}
            <div class="card-effect-controls">
              <button
                type="button"
                class="effect-spark-btn"
                class:active={sparkBoosted}
                on:click={triggerEffectSpark}
                aria-pressed={sparkBoosted}
                aria-label="Spustit interaktivní efekt dopadu"
                title="Klikni pro vlnu dopadu na plátně (nebo klepni přímo do scény)"
              >
                ✨ Impuls
              </button>
              {#if onToggleSound}
                <button
                  type="button"
                  class="sound-mute-btn"
                  on:click={onToggleSound}
                  aria-pressed={soundMuted}
                  aria-label={soundMuted ? 'Zapnout jemné zvuky' : 'Ztlumit zvuky'}
                  title={soundMuted ? 'Zapnout jemné zvuky' : 'Ztlumit zvuky'}
                >
                  {soundMuted ? '🔇' : '🔊'}
                </button>
              {/if}
            </div>
          </div>
          <canvas
            bind:this={cardCanvasNode}
            class="impact-payoff-canvas"
            width="320"
            height="118"
            use:impactCanvas={{ action, climax: false, onWeightUpdate: handleWeightUpdate }}
            aria-label="Fyzikální vizualizace dopadu dobrého skutku"
          ></canvas>
        </div>
      {/if}
    {/if}

    <div class="ambient-pulse-pill" role="status" aria-live="off">
      <span class="ambient-pulse-wave pulse-dot-live" aria-hidden="true"></span>
      <span class="ambient-pulse-dot" aria-hidden="true"></span>
      <span class="ambient-pulse-text pulse-msg-text">{ambientPulseText}</span>
    </div>

    <div class="action-verify-footer card-verify-footer rec-verify-footer">
      <span class="verify-meta">
        Ověřeno: <strong>{action.verifiedLabel}</strong> · Zdroj:
        <a
          href={action.sourceUrl || action.url}
          target="_blank"
          rel="noopener noreferrer"
          class="verify-source-link card-source-link rec-source-link"
        >
          {action.org} ↗
        </a>
      </span>
      <div class="verify-footer-actions card-footer-actions rec-footer-btns">
        {#if onShare}
          <button
            type="button"
            class="direct-link-share-btn mde-share-btn card-broken-btn rec-broken-btn"
            on:click={() => onShare(action)}
            title="Zkopírovat přímý odkaz na tento skutek pro sdílení v diskuzi nebo zprávě"
          >
            {copiedDirectLink ? '✓ Odkaz zkopírován' : 'Sdílet odkaz'}
          </button>
        {/if}
        <button
          type="button"
          class="broken-link-btn mde-broken-btn card-broken-btn rec-broken-btn"
          on:click={() => {
            if (onReportBroken) onReportBroken(action);
            else openBrokenLinkReport({ id: action.id, title: actionTitle, org: action.org, url: action.url });
          }}
        >
          Nahlásit chybu
        </button>
      </div>
    </div>
  </article>
{/if}

<style>
  .instant-body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    max-width: 100%;
  }

  /* =========================================================================
     ŽIVÁ SCÉNA OČEKÁVÁNÍ (IDLE ANTICIPATION DIORAMA)
     ========================================================================= */
  .deed-preview-stage {
    --spot-x: 50%;
    --spot-y: 34%;
    --tilt-x: 0;
    --tilt-y: 0;
    position: relative;
    width: 100%;
    height: 86px;
    margin: 0 0 0.65rem 0;
    border-radius: 16px;
    overflow: hidden;
    cursor: default;
    user-select: none;
    background:
      radial-gradient(
        130px 90px at var(--spot-x) var(--spot-y),
        rgba(253, 230, 138, 0.22) 0%,
        rgba(52, 211, 153, 0.14) 48%,
        transparent 100%
      ),
      radial-gradient(110% 100% at 50% 15%, #124530 0%, #082318 62%, #04130d 100%);
    border: 1px solid rgba(52, 211, 153, 0.32);
    box-shadow:
      0 12px 26px -12px rgba(4, 20, 13, 0.52),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);
    transition: border-color 0.24s ease, box-shadow 0.24s ease, transform 0.22s ease;
  }

  .deed-preview-stage.is-primed {
    border-color: rgba(251, 191, 36, 0.58);
    box-shadow:
      0 14px 30px -10px rgba(6, 28, 19, 0.6),
      0 0 0 2px rgba(251, 191, 36, 0.2),
      inset 0 1px 0 rgba(254, 243, 199, 0.25);
  }

  .deed-preview-stage.is-nudged {
    transform: scale(0.992);
  }

  .preview-hud {
    position: absolute;
    top: 8px;
    left: 9px;
    right: 9px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    pointer-events: none;
  }

  .preview-promise-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    max-width: 68%;
    padding: 0.2rem 0.56rem;
    border-radius: 999px;
    background: rgba(4, 19, 13, 0.72);
    border: 1px solid rgba(253, 230, 138, 0.38);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: #fef3c7;
    font-size: 0.71rem;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview-promise-spark {
    color: #fbbf24;
    flex-shrink: 0;
  }

  .preview-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.18rem 0.5rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.16);
    border: 1px solid rgba(110, 231, 183, 0.3);
    color: #a7f3d0;
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .preview-status-pill.nudged {
    background: rgba(251, 191, 36, 0.24);
    border-color: rgba(253, 230, 138, 0.65);
    color: #fef3c7;
  }

  .preview-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 8px #34d399;
    flex-shrink: 0;
  }

  .preview-status-pill.nudged .preview-status-dot {
    background: #fbbf24;
    box-shadow: 0 0 8px #fbbf24;
  }

  .preview-diorama-svg {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .diorama-beam {
    opacity: 0.72;
    transition: opacity 0.28s ease;
  }

  .deed-preview-stage.is-primed .diorama-beam {
    opacity: 1;
  }

  .diorama-floating-cluster {
    transform: translate3d(calc(var(--tilt-x) * 4px), calc(var(--tilt-y) * 2px), 0);
    animation: previewBob 3.6s ease-in-out infinite;
    transition: transform 0.26s cubic-bezier(0.2, 0.9, 0.3, 1);
  }

  .deed-preview-stage.is-primed .diorama-floating-cluster {
    animation: none;
    transform: translate3d(calc(var(--tilt-x) * 4px), 8px, 0) scale(1.04);
  }

  .diorama-focal {
    transform: translate3d(calc(var(--tilt-x) * -2px), 0, 0);
    transition: transform 0.26s ease;
  }

  .diorama-kitty {
    transform-origin: 286px 84px;
    transition: transform 0.28s ease;
  }

  .deed-preview-stage.is-primed .diorama-kitty {
    transform: translateX(-3px) rotate(-2deg);
  }

  .bowl-inner-glow {
    transition: opacity 0.28s ease;
  }

  .deed-preview-stage.is-primed .bowl-inner-glow {
    opacity: 0.58;
  }

  .diorama-firefly {
    animation: dioramaTwinkle 4.2s ease-in-out infinite;
  }
  .diorama-firefly.f2 { animation-delay: 1.1s; }
  .diorama-firefly.f3 { animation-delay: 2.1s; }
  .diorama-firefly.f4 { animation-delay: 2.9s; }

  @keyframes previewBob {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
  }

  @keyframes dioramaTwinkle {
    0%, 100% { opacity: 0.28; }
    50% { opacity: 0.92; }
  }

  @media (prefers-reduced-motion: reduce) {
    .diorama-floating-cluster,
    .diorama-firefly {
      animation: none;
    }
  }

  /* =========================================================================
     HLAVIČKA KARTY A OBSAH
     ========================================================================= */
  .action-meta-line {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: var(--text-muted, #6b7280);
    margin-bottom: 0.42rem;
  }

  .quick-tags-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.62rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(52, 211, 153, 0.24);
    color: #065f46;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.01em;
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
    background: rgba(251, 191, 36, 0.16);
    border: 1px solid rgba(245, 158, 11, 0.36);
    color: #92400e;
  }

  .category-aura-wildlife {
    background: rgba(20, 184, 166, 0.13);
    border: 1px solid rgba(45, 212, 191, 0.36);
    color: #0f766e;
  }

  .category-aura-nature {
    background: rgba(16, 185, 129, 0.13);
    border: 1px solid rgba(52, 211, 153, 0.35);
    color: #065f46;
  }

  .category-aura-science {
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(96, 165, 250, 0.35);
    color: #1e40af;
  }

  .category-aura-community {
    background: rgba(139, 92, 246, 0.11);
    border: 1px solid rgba(167, 139, 250, 0.34);
    color: #5b21b6;
  }

  .category-aura-care {
    background: rgba(245, 158, 11, 0.13);
    border: 1px solid rgba(251, 191, 36, 0.38);
    color: #9a3412;
  }

  .category-aura-default {
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(52, 211, 153, 0.3);
    color: #065f46;
  }

  .personal-values-pill {
    margin-left: auto;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid rgba(16, 185, 129, 0.25);
    background: rgba(236, 253, 245, 0.8);
    color: #065f46;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    min-height: 44px;
    padding: 0.35rem 0.65rem;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .personal-values-pill.active {
    background: #065f46;
    color: #ffffff;
    border-color: #065f46;
  }

  .action-title {
    font-weight: 800;
    font-size: 1.32rem;
    line-height: 1.23;
    letter-spacing: -0.022em;
    color: #071d14;
    margin: 0 0 0.42rem 0;
  }

  .action-desc {
    color: var(--text-secondary, #374151);
    font-size: 0.93rem;
    line-height: 1.56;
    margin: 0 0 0.55rem 0;
  }

  .action-impact-summary {
    margin: 0 0 0.75rem 0;
    padding-top: 0.5rem;
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

  .detail-evidence-line {
    margin-bottom: 0.15rem;
  }

  .detail-impact-line {
    font-size: 0.79rem;
    line-height: 1.42;
    padding: 0.38rem 0.55rem;
    border-radius: 10px;
    background: rgba(16, 185, 129, 0.06);
    border: 1px solid rgba(16, 185, 129, 0.14);
  }

  .partner-trust-line {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: var(--text-muted, #6b7280);
  }

  .partner-trust-line strong {
    color: var(--text-secondary, #374151);
    font-weight: 700;
  }

  .how-toggle {
    margin: 0 0 0.45rem 0;
    font-size: 0.83rem;
    color: var(--text-secondary, #374151);
  }

  .how-toggle summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--forest-800, #064e3b);
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 44px;
    padding: 0.35rem 0.2rem;
    box-sizing: border-box;
    border-radius: 8px;
    transition: color 0.16s ease;
  }

  .how-toggle summary:hover {
    color: #047857;
  }

  .how-toggle summary::-webkit-details-marker {
    display: none;
  }

  .how-toggle summary::before {
    content: "▸";
    color: var(--emerald-600, #059669);
    transition: transform 0.18s ease;
  }

  .how-toggle[open] summary::before {
    transform: rotate(90deg);
  }

  .how-steps {
    margin: 0.35rem 0 0 1.2rem;
    padding: 0;
    line-height: 1.5;
    color: var(--text-secondary, #374151);
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
  }

  .impact-chain-row {
    margin-top: 0.45rem;
    padding-top: 0.45rem;
    border-top: 1px dashed rgba(22, 66, 48, 0.14);
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: var(--text-secondary, #374151);
  }

  .chain-arrow {
    color: var(--emerald-600, #059669);
    font-weight: 800;
  }

  .how-details-content {
    display: flex;
    flex-direction: column;
    gap: 0.48rem;
    margin-top: 0.35rem;
    padding: 0.65rem 0.75rem;
    border-radius: 14px;
    background: rgba(238, 246, 241, 0.6);
    border: 1px solid rgba(22, 82, 56, 0.1);
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
    min-height: 50px;
    padding: 0.86rem 1.2rem;
    box-sizing: border-box;
    border-radius: 15px;
    background: linear-gradient(135deg, #0b2c1e 0%, #145338 52%, #0d3524 100%);
    color: #ffffff;
    font-weight: 800;
    font-size: 0.95rem;
    letter-spacing: -0.01em;
    text-decoration: none;
    box-shadow:
      0 12px 26px -6px rgba(10, 44, 30, 0.46),
      0 0 0 1px rgba(52, 211, 153, 0.32),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
    transition: transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.2s ease;
  }

  .btn-studio-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.42), rgba(251, 191, 36, 0.48));
    transform-origin: left center;
    transform: scaleX(var(--spark-charge, 0));
    transition: transform 0.06s linear;
    pointer-events: none;
  }

  .btn-studio-primary::after {
    content: '';
    position: absolute;
    top: -50%;
    bottom: -50%;
    left: -60%;
    width: 34%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent);
    transform: rotate(25deg);
    pointer-events: none;
    transition: transform 0.65s ease;
  }

  .btn-studio-primary:hover {
    transform: translateY(-2px);
    box-shadow:
      0 16px 32px -6px rgba(10, 44, 30, 0.56),
      0 0 0 1.5px rgba(251, 191, 36, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.22);
  }

  .btn-studio-primary:hover::after {
    transform: rotate(25deg) translate(390%, 0);
  }

  .btn-studio-primary:active {
    transform: scale(0.985);
  }

  .btn-studio-primary.cta-nudged,
  :global(.btn-studio-primary.spark-ready) {
    box-shadow:
      0 14px 30px -4px rgba(16, 185, 129, 0.5),
      0 0 0 3px rgba(251, 191, 36, 0.68);
  }

  .cta-lead-icon {
    color: #fde68a;
    flex-shrink: 0;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  }

  .cta-arrow-icon {
    color: #a7f3d0;
    flex-shrink: 0;
    transition: transform 0.18s ease;
  }

  .btn-studio-primary:hover .cta-arrow-icon {
    transform: translate(2px, -2px);
    color: #fde68a;
  }

  @media (prefers-reduced-motion: reduce) {
    .btn-studio-primary::after {
      display: none;
    }
  }

  .btn-studio-done {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    min-height: 50px;
    padding: 0.84rem 1rem;
    box-sizing: border-box;
    border-radius: 15px;
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

  .btn-studio-done.initiated {
    background: #059669;
    color: #ffffff;
    border-color: #059669;
  }

  /* =========================================================================
     FYZIKÁLNÍ SCÉNA DOPADU A IN-SITU OSLAVA (PO SPUŠTĚNÍ AKCE)
     ========================================================================= */
  .card-effect-stage {
    position: relative;
    margin: 0.5rem 0 0.55rem;
    padding: 0;
    border-radius: 18px;
    overflow: hidden;
    background: radial-gradient(circle at 50% 38%, #0e3625 0%, #04140e 100%);
    border: 1px solid rgba(52, 211, 153, 0.38);
    color: #ecfdf5;
    box-shadow:
      0 14px 30px -12px rgba(4, 18, 12, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);
  }

  .card-effect-head {
    position: absolute;
    top: 8px;
    left: 10px;
    right: 10px;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    pointer-events: none;
  }

  .card-effect-head > * {
    pointer-events: auto;
  }

  .card-effect-controls {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .card-effect-stage .impact-payoff-badge {
    background: rgba(5, 20, 14, 0.76);
    color: #fde68a;
    border: 1px solid rgba(251, 191, 36, 0.44);
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
    gap: 0.24rem;
    padding: 0.45rem 0.8rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    border-radius: 999px;
    border: 1px solid rgba(52, 211, 153, 0.38);
    background: rgba(5, 20, 14, 0.74);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #ecfdf5;
    font-family: var(--font-sans);
    font-size: 0.71rem;
    font-weight: 800;
    line-height: 1.2;
    cursor: pointer;
    transition: all 0.16s ease;
    white-space: nowrap;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.24);
  }

  .effect-spark-btn:hover,
  .effect-spark-btn.active,
  .sound-mute-btn:hover {
    background: linear-gradient(135deg, #0d2e20 0%, #174933 100%);
    color: #fde68a;
    border-color: rgba(251, 191, 36, 0.55);
  }

  .impact-payoff-canvas {
    display: block;
    width: 100%;
    max-width: 100%;
    height: 118px;
    border: none;
    border-radius: 0;
    cursor: pointer;
    touch-action: manipulation;
  }

  .card-effect-stage,
  .celebration-card,
  .return-dopamine-strip {
    animation: payoffSlideDown 0.32s cubic-bezier(0.18, 0.89, 0.32, 1.15);
  }

  @keyframes payoffSlideDown {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card-effect-stage,
    .celebration-card,
    .return-dopamine-strip {
      animation: none;
    }
  }

  .celebration-card,
  .return-dopamine-strip {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-bottom: 0.55rem;
    padding: 0.72rem 0.88rem;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(8, 30, 21, 0.96), rgba(16, 54, 38, 0.95));
    border: 1px solid rgba(52, 211, 153, 0.38);
    color: #ecfdf5;
    font-size: 0.84rem;
    line-height: 1.38;
    scroll-margin-top: 75px;
    scroll-margin-bottom: 75px;
  }

  .inline-celebration-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .inline-celebration-card .kicker {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6ee7b7;
  }

  .inline-celebration-card .win-title {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 800;
    color: #ffffff;
  }

  .impact-payoff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.26rem;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.2);
    color: #a7f3d0;
  }

  .badge-paw-svg {
    color: #fde68a;
    flex-shrink: 0;
  }

  .in-situ-affirmation,
  .molly-celebration-note {
    font-size: 0.82rem;
    color: #e6f5ec;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(52, 211, 153, 0.28);
    border-radius: 10px;
    padding: 0.45rem 0.75rem;
    margin: 0.45rem 0;
    line-height: 1.4;
  }

  .molly-svet-inline-link {
    color: #fde68a;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .return-dopamine-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .return-dopamine-btn {
    appearance: none;
    border: 1px solid rgba(251, 191, 36, 0.5);
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #062015;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 800;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.28);
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    scroll-margin-top: 75px;
    scroll-margin-bottom: 75px;
  }

  .btn-session-close {
    border: 1px solid rgba(52, 211, 153, 0.38);
    background: rgba(6, 78, 59, 0.45);
    color: #a7f3d0;
    box-shadow: 0 2px 8px rgba(6, 78, 59, 0.25);
  }

  .btn-session-close:hover {
    background: rgba(6, 78, 59, 0.7);
    border-color: rgba(52, 211, 153, 0.6);
  }

  .btn-next-deed {
    border: 1px solid rgba(251, 191, 36, 0.5);
  }

  .return-dopamine-svet-link {
    color: #fde68a;
    font-size: 0.82rem;
    font-weight: 800;
    text-decoration: underline;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0.4rem 0.6rem;
  }

  .inline-celebration-next {
    border: 1px solid rgba(251, 191, 36, 0.65);
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #062015;
    padding: 0.5rem 1rem;
    font-family: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  /* =========================================================================
     ŽIVÝ PULS KOMUNITY A OVĚŘOVACÍ PATIČKA
     ========================================================================= */
  .ambient-pulse-pill {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 0.42rem;
    margin-top: 0.45rem;
    padding: 0.15rem 0.05rem;
    color: #2c5540;
    font-size: 0.73rem;
    font-weight: 600;
    line-height: 1.25;
  }

  .ambient-pulse-wave {
    display: inline-block;
    position: absolute;
    left: 1px;
    top: 50%;
    margin-top: -3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.55);
    animation: pulseRadar 2.4s ease-out infinite;
    pointer-events: none;
  }

  @keyframes pulseRadar {
    0% {
      transform: scale(1);
      opacity: 0.85;
    }
    100% {
      transform: scale(3.4);
      opacity: 0;
    }
  }

  .ambient-pulse-dot {
    position: relative;
    z-index: 1;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.65);
    flex-shrink: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .ambient-pulse-wave {
      animation: none;
      display: none;
    }
  }

  .ambient-pulse-text {
    position: relative;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-verify-footer {
    margin-top: 0.55rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.74rem;
    color: var(--text-muted, #6b7280);
  }

  .verify-source-link {
    color: var(--forest-800, #064e3b);
    font-weight: 700;
    text-decoration: none;
  }

  .verify-source-link:hover {
    color: var(--emerald-600, #059669);
    text-decoration: underline;
  }

  .verify-footer-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .direct-link-share-btn,
  .mde-share-btn {
    appearance: none;
    background: none;
    border: none;
    padding: 0;
    color: #047857;
    font-family: var(--font-sans);
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .broken-link-btn,
  .mde-broken-btn {
    border: none;
    background: transparent;
    color: var(--text-muted, #6b7280);
    font-family: var(--font-sans);
    font-size: 0.73rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    padding: 0;
  }

  .broken-link-btn:hover {
    color: #b45309;
  }

  @media (min-width: 681px) {
    .instant-body > .instant-actions {
      order: 4;
      margin-bottom: 0.25rem;
    }
    .instant-body > .card-effect-stage,
    .instant-body > :global(.card-effect-stage) {
      order: 5;
      margin: 0.2rem 0 0.45rem;
    }
    .instant-body > .ambient-pulse-pill {
      order: 6;
    }
    .instant-body > .action-verify-footer {
      order: 7;
    }
  }

  .card {
    background: linear-gradient(180deg, #ffffff 0%, #f9fcfa 100%);
    border: 1px solid rgba(16, 72, 48, 0.11);
    border-radius: 22px;
    box-shadow: 0 10px 26px -10px rgba(13, 46, 32, 0.08), 0 1px 3px rgba(0, 0, 0, 0.03);
    padding: 0.92rem 1.08rem;
    display: flex;
    flex-direction: column;
    transition: transform 0.24s var(--ease-gentle, ease), box-shadow 0.24s var(--ease-gentle, ease);
  }

  /* Instant varianta žije uvnitř vnější skořápky (.instant-card na / nebo .highlight-card na /app/guided) — žádný vnořený dvojitý rámeček */
  .instant-body:not(.directory-card) {
    padding: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
  }

  .directory-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 32px -8px rgba(13, 46, 32, 0.12), 0 3px 6px rgba(0, 0, 0, 0.06);
  }

  .card.spotlight {
    border: 1.5px solid #f59e0b;
    box-shadow: 0 0 0 4px rgba(253, 230, 138, 0.4), var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  }

  .mobile-details-extra {
    display: none;
  }

  @media (max-width: 1024px) {
    .instant-body:not(.directory-card) > .action-verify-footer {
      display: none;
    }

    .mobile-details-extra {
      display: flex;
      flex-direction: column;
      gap: 0.38rem;
      margin-top: 0.4rem;
      padding-top: 0.42rem;
      border-top: 1px dashed rgba(22, 82, 56, 0.18);
      font-size: 0.76rem;
      line-height: 1.38;
    }

    .mde-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .mde-share-btn,
    .mde-broken-btn {
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.35rem;
      box-sizing: border-box;
    }

    .mde-verify {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.72rem;
      color: var(--text-muted, #6b7280);
    }
  }

  @media (max-width: 680px) {
    .card.directory-card {
      padding: 0.58rem 0.78rem;
      border-radius: 18px;
    }

    .instant-body {
      gap: 0.22rem;
    }

    .deed-preview-stage {
      height: 58px;
      margin: 0 0 0.2rem 0;
      border-radius: 13px;
    }

    .preview-hud {
      top: 5px;
      left: 6px;
      right: 6px;
      gap: 0.25rem;
    }

    .preview-promise-pill {
      max-width: 100%;
      padding: 0.13rem 0.44rem;
      font-size: 0.64rem;
    }

    .preview-status-pill {
      display: none;
    }

    .preview-status-pill.nudged {
      display: inline-flex;
      padding: 0.12rem 0.38rem;
      font-size: 0.61rem;
    }

    .action-meta-line {
      font-size: 0.68rem;
      gap: 0.24rem;
      margin-bottom: 0.08rem;
      flex-wrap: wrap;
    }

    .category-aura-chip {
      padding: 0.12rem 0.42rem;
      font-size: 0.66rem;
      gap: 0.18rem;
    }

    .category-aura-icon {
      font-size: 0.72rem;
    }

    .quick-tags-pill {
      padding: 0.11rem 0.4rem;
      font-size: 0.65rem;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.1);
      color: #065f46;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .personal-values-pill {
      min-height: 44px;
      padding: 0.3rem 0.6rem;
      font-size: 0.71rem;
      flex-shrink: 0;
      margin-left: auto;
      box-sizing: border-box;
    }

    .action-title {
      font-size: 1.03rem;
      line-height: 1.18;
      margin: 0.02rem 0 0.1rem 0;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .action-desc {
      font-size: 0.79rem;
      line-height: 1.3;
      margin: 0 0 0.08rem 0;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .action-impact-summary {
      margin: 0 0 0.14rem 0;
      padding-top: 0.28rem;
      gap: 0.14rem;
      font-size: 0.77rem;
      line-height: 1.32;
    }

    .partner-trust-line {
      font-size: 0.73rem;
    }

    .how-toggle {
      margin: 0;
      padding: 0 0.1rem;
      border-radius: 10px;
    }

    .how-toggle summary {
      font-size: 0.77rem;
      min-height: 44px;
      padding: 0.3rem 0.15rem;
      box-sizing: border-box;
    }

    .card-effect-stage {
      margin: 0.28rem 0 0.32rem;
      border-radius: 14px;
    }

    .celebration-card,
    .return-dopamine-strip {
      padding: 0.55rem 0.75rem;
      gap: 0.35rem;
    }

    .in-situ-affirmation,
    .molly-celebration-note {
      padding: 0.35rem 0.6rem;
      margin: 0.25rem 0;
      font-size: 0.76rem;
      line-height: 1.32;
    }

    .return-dopamine-actions {
      margin-top: 0.35rem;
      gap: 0.45rem;
    }

    .return-dopamine-btn {
      font-size: 0.82rem;
      padding: 0.45rem 0.85rem;
    }

    .card-effect-stage .impact-payoff-canvas,
    .impact-payoff-canvas {
      height: 76px;
    }

    .card-effect-head {
      top: 6px;
      left: 7px;
      right: 7px;
    }

    .card-effect-stage .impact-payoff-badge {
      font-size: 0.66rem;
      padding: 0.14rem 0.44rem;
    }

    .effect-spark-btn,
    .sound-mute-btn {
      font-size: 0.68rem;
      min-height: 44px;
      min-width: 44px;
      padding: 0.25rem 0.55rem;
    }

    .instant-actions {
      flex-direction: column;
      align-items: stretch;
      padding-top: 0.06rem;
      gap: 0.35rem;
    }

    .btn-studio-primary {
      width: 100%;
      box-sizing: border-box;
      min-height: 48px;
      padding: 0.68rem 0.95rem;
      font-size: 0.93rem;
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
      font-size: 0.78rem;
      border-radius: 12px;
      background: rgba(238, 247, 241, 0.75);
    }

    .ambient-pulse-pill {
      margin-top: 0.22rem;
      padding: 0.16rem 0.08rem;
      font-size: 0.68rem;
      align-items: flex-start;
    }

    .ambient-pulse-wave {
      top: 0.28rem;
      margin-top: 0;
      left: 1px;
    }

    .ambient-pulse-dot {
      margin-top: 0.28rem;
    }

    .ambient-pulse-text {
      white-space: normal;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  @media (max-width: 680px) and (max-height: 700px) {
    .deed-preview-stage {
      height: 50px;
      margin-bottom: 0.14rem;
    }
  }
</style>
