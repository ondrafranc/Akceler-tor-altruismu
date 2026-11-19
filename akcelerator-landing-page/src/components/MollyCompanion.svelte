<script>
  import { onMount, onDestroy, tick as svelteTick } from 'svelte';
  import { page } from '$app/state';
  import {
    mollyState,
    mollyEvents,
    petMolly,
    feedMolly,
    mollyWhisper
  } from '$lib/mollyStore.js';
  import {
    getMollyAccessories,
    describeNextMollyGift,
    MOLLY_ROUTE_GUIDES,
    getMollyGreeting
  } from '$lib/mollyTypes.js';
  import { prefersReducedMotion, frameStep } from '$lib/core/device.js';
  import { playMollyPurr, playMollyMeow } from '$lib/audio/presets.js';
  import { safeGetItem, safeSetItem, AA_MOLLY_HINTS_KEY, AA_MOLLY_NUDGES_KEY } from '$lib/storage/index.js';
  import { drawMollyCat as renderProceduralMollyCat } from '$lib/molly/mollyCatRenderer.js';
  import AppIcon from '$lib/components/AppIcon.svelte';
  import MollyDock, { isCompactDock, mollyDockBridge, normalizeMollyIcon } from './MollyDock.svelte';

  /** @type {HTMLCanvasElement | null} */
  let catCanvas = $state(null);
  /** @type {CanvasRenderingContext2D | null} */
  let catCtx = null;
  /** @type {HTMLDivElement | null} */
  let actorEl = $state(null);
  /** @type {HTMLDivElement | null} */
  let treatEl = $state(null);
  let rafId = 0;
  let mounted = false;
  const LOGICAL_W = 94;
  const LOGICAL_H = 80;
  const CAT_SAFETY_X = 0.25;
  const CAT_SAFETY_TOP = 0.5;
  const CAT_SAFETY_BOTTOM = 0.5;
  // Poslední zapsaná transformace — DOM zapisujeme jen při skutečné změně (žádný layout thrash)
  let lastActorTransform = '';
  let lastActorBehavior = '';
  let activeDesktopScale = 0;
  let targetDesktopScale = 0;
  // Bublina se šeptandou je MIMO herce (nezmenšuje se s kočkou na mobilu) a umisťuje se mimo rAF
  /** @type {HTMLDivElement | null} */
  let bubbleEl = $state(null);
  let bubbleW = 0;
  let bubbleH = 0;
  let lastBubbleTransform = '';
  // Molly svižněji popojde z tlačítka nebo pro bublinu (bez trhavého sprintu a bez teleportů)
  let hurry = false;
  let stepAside = false;
  let urgentStepAside = false;
  let pendingWhisperMs = 0;
  let relocateTimer = null;
  // Nevyžádaný tip (průvodce), pro který teď není volné místo: zkusíme to znovu, a když ani pak
  // ne, uloží se do pelíšku jako nevtíravý indikátor — ukáže se až na klepnutí (nic nezakryje sám od sebe).
  /** @type {{ icon?: string, text: string } | null} */
  let pendingTip = $state(null);
  let deferTimer = null;
  let deferTries = 0;
  let lastSeenWhisperTs = 0;
  // Na /svet bydlí Molly u jezera přímo v krajině — toulavá Molly se tam schová (žádné dvě Molly naráz)
  const atHome = $derived(
    (page.url.pathname || '') === '/svet' || (page.url.pathname || '').startsWith('/svet/')
  );
  // Na přeplněné obrazovce Molly tiše zaparkuje v pelíšku, aniž by měnila uživatelské nastavení režimu
  let crowdedPark = $state(false);
  let lastRenderTs = 0;
  // Krok snímku vůči 60 fps — částice (srdíčka, světluška) běží stejně rychle na 60/120 Hz i při poklesu FPS
  let frameK = 1;
  // Dárky za pamlsky vykreslené přímo na kočce (obojek, zvoneček, korunka, hvězdička)
  let accessories = getMollyAccessories(0);

  // Roaming actor state
  let behavior = 'IDLE_SIT'; // 'WALK_ROAM' | 'IDLE_SIT' | 'GROOM' | 'CHASE_FIREFLY' | 'CATCH_TREAT' | 'PET_BLISS'
  let behaviorTimer = 4.2;
  let posX = 240;
  let posY = 620;
  let targetX = 320;
  let targetY = 620;
  let vx = 0;
  let vy = 0;
  let facing = 1; // 1 = right, -1 = left
  let walkCycle = 0;
  let groomPhase = 0;
  let eatTimer = 0;
  let petBlissTimer = 0;
  let lastAvoidTriggerTs = 0;
  let scrolledOnCurrentRoute = false;

  // Pointer tracking for emerald eyes & button avoidance
  let pointerX = 640;
  let pointerY = 380;
  let followTargetX = 320;
  let followTargetY = 620;
  let lastFollowCalcTs = 0;
  let blinkTimer = 3.6;
  let blinkProgress = 0;
  let hasFinePointer = $state(false);
  let lastPointerMoveTs = 0;

  // Ambient firefly & heart particles around Molly
  let firefly = null; // { x, y, vx, vy, phase, alpha }
  let hearts = []; // { x, y, vy, scale, alpha, color }
  let flyingTreat = null; // { x0, y0, cx, cy, x1, y1, p, icon, color, name }
  /** @type {{ icon: string, color: string, x0: number, y0: number } | null} */
  let flyingTreatView = $state(null); // { icon, color } — jediná reaktivní část letící dobroty
  let lastTreatTransform = '';

  // Whisper bubble visibility
  /** @type {{ icon?: string, text: string, ts?: number, guide?: boolean, fromDock?: boolean, routePath?: string } | null} */
  let activeWhisper = $state(null);
  let whisperHideTimer = null;
  let walkArriveSafetyTimer = null;
  let dockAnchoredBubble = false;
  let bubbleTravelling = $state(false);
  let forceDockWhisper = $state(false);
  let compactInflowWhisper = $state(false);

  let unsubEvents = null;
  let unsubState = null;
  let currentState = {
    mode: 'roaming',
    mood: 'curious',
    treatsFedTotal: 0,
    treatsFedToday: 0,
    availableTreats: 0,
    lastTreat: null,
    petCount: 0,
    whisper: null
  };

  function showWhisperBubble(whisperObj, durationMs = 4200) {
    if (!whisperObj?.text) return;
    activeWhisper = whisperObj;
    bubbleTravelling = Boolean(whisperObj.guide && !whisperObj.fromDock);
    if (whisperHideTimer) clearTimeout(whisperHideTimer);
    if (walkArriveSafetyTimer) clearTimeout(walkArriveSafetyTimer);
    pendingWhisperMs = durationMs;
    dockAnchoredBubble = false;
    forceDockWhisper = false;
    compactInflowWhisper = false;
    whisperHideTimer = setTimeout(hideWhisperBubble, durationMs);
    placeWhisperBubble();
  }

  function hideWhisperBubble() {
    if (whisperHideTimer) clearTimeout(whisperHideTimer);
    if (walkArriveSafetyTimer) clearTimeout(walkArriveSafetyTimer);
    whisperHideTimer = null;
    walkArriveSafetyTimer = null;
    activeWhisper = null;
    bubbleW = 0;
    bubbleH = 0;
    dockAnchoredBubble = false;
    bubbleTravelling = false;
    forceDockWhisper = false;
    compactInflowWhisper = false;
    lastBubbleTransform = '';
    cachedWhisperRectKey = '';
    cachedWhisperRect = null;
  }

  function clearDeferredGuide() {
    if (deferTimer) clearTimeout(deferTimer);
    deferTimer = null;
    deferTries = 0;
  }

  /** Tip průvodce teď nemá kam — zkusíme ho ukázat znovu (obsah se mezitím mohl posunout). */
  function deferGuideWhisper(w) {
    hideWhisperBubble();
    if (deferTimer) clearTimeout(deferTimer);
    deferTries += 1;
    if (deferTries > 1) {
      deferTimer = null;
      deferTries = 0;
      if (w?.routePath) markSessionList(HINTS_KEY, w.routePath);
      if (!pendingTip) {
        pendingTip = { icon: w.icon, text: w.text };
      }
      return;
    }
    deferTimer = setTimeout(() => {
      deferTimer = null;
      if (currentState.mode !== 'roaming' || atHome || document.hidden) return;
      if (activeWhisper) {
        if (w?.routePath) markSessionList(HINTS_KEY, w.routePath);
        if (!pendingTip) {
          pendingTip = { icon: w.icon, text: w.text };
        }
        return;
      }
      showWhisperBubble({ ...w }, 4200);
    }, 1050);
  }

  /**
   * Čistá kontrola překryvu s předměřenými interaktivními prvky stránky (nikdy nečte DOM).
   * @param {number} x
   * @param {number} [y]
   */
  function directControlOverlapAt(x, y) {
    if (cachedControlRects.length === 0) return 0;
    const { vw, vh } = viewportSize();
    const s = actorScale(vw);
    const ay = Number.isFinite(y) ? /** @type {number} */ (y) : groundLine(vw, vh);
    const bub = defaultBubbleRectAt(x, ay, s, vw);
    if (!bub) return 0;
    let area = 0;
    for (const t of cachedControlRects) {
      area += overlapArea(bub, t);
    }
    return area;
  }

  /**
   * Kolik plochy tlačítek/odkazů/polí a nadpisů by bublina zakryla, kdyby Molly stála na (x, y).
   * @param {number} x
   * @param {number} [y]
   */
  function hardBubbleOverlapAt(x, y) {
    const { vw, vh } = viewportSize();
    const s = actorScale(vw);
    const ay = Number.isFinite(y) ? /** @type {number} */ (y) : groundLine(vw, vh);
    const bub = defaultBubbleRectAt(x, ay, s, vw);
    if (!bub) return 0;
    let area = 0;
    for (const o of collectObstacles(vw, vh, false)) {
      area += overlapArea(bub, o);
    }
    return Math.max(area, directControlOverlapAt(x, ay));
  }

  /**
   * Po vykreslení bubliny změří její velikost a když by bublina nebo Molly zakrývaly
   * tlačítko, odkaz, pole formuláře nebo nadpis, najde 100% volné místo.
   */
  async function placeWhisperBubble() {
    await svelteTick();
    if (!activeWhisper || typeof window === 'undefined') return;
    if (!bubbleEl) {
      if (activeWhisper.routePath) {
        markSessionList(HINTS_KEY, activeWhisper.routePath);
      }
      if (
        activeWhisper.guide &&
        !activeWhisper.fromDock &&
        currentState.mode === 'roaming' &&
        !atHome &&
        crowdedPark
      ) {
        if (!pendingTip) {
          pendingTip = { icon: activeWhisper.icon, text: activeWhisper.text };
        }
        hideWhisperBubble();
      }
      deferTries = 0;
      return;
    }
    const { vw, vh } = viewportSize();
    measureLayoutAndObstacles(vw, vh);
    bubbleW = bubbleEl.offsetWidth;
    bubbleH = bubbleEl.offsetHeight;
    lastBubbleTransform = '';
    // Nevyžádaný tip průvodce nesmí zakrýt tlačítko/odkaz/pole. Když na spodní linii není
    // volné místo (typicky mobil s kartami přes celou šířku), počkáme a případně ho uložíme do pelíšku.
    if (activeWhisper.guide && !activeWhisper.fromDock && currentState.mode === 'roaming' && !atHome) {
      if (vw <= MOBILE_MAX_W) {
        const spot = findBestSpot({ preferX: posX, withBubble: true, groundOnly: true });
        if (hardBubbleOverlapAt(spot.x, spot.y) > 35) {
          deferGuideWhisper(activeWhisper);
          return;
        }
      } else {
        const spot = findBestSpot({ preferX: posX, withBubble: true });
        const bestPlaced = findBestWhisperRectWithCost(spot.x, spot.y, actorScale(vw), vw, vh);
        if (hardBubbleOverlapAt(spot.x, spot.y) > 0 && bestPlaced.obsCost > 0) {
          deferGuideWhisper(activeWhisper);
          return;
        }
      }
    }
    if (activeWhisper.routePath) {
      markSessionList(HINTS_KEY, activeWhisper.routePath);
    }
    deferTries = 0;

    if (activeWhisper.fromDock) {
      bubbleTravelling = false;
      bubbleEl.classList.remove('is-travelling');
      if (whisperHideTimer) clearTimeout(whisperHideTimer);
      whisperHideTimer = setTimeout(hideWhisperBubble, pendingWhisperMs || 4800);
      if (currentState.mode === 'roaming' && !atHome) {
        const curRaw = scoreSpot(posX, posY, actorScale(vw), vw, collectObstacles(vw, vh, false), false);
        if (curRaw > 0) {
          relocateToFreeSpot(false);
        }
      }
      updateBubbleAnchorMode(posX, posY);
      evaluateDockWhisperFallback(posX, posY);
      if (
        $isCompactDock &&
        vw <= MOBILE_MAX_W &&
        (activeWhisper.fromDock || currentState.mode === 'docked' || crowdedPark)
      ) {
        const { obsCost } = findBestWhisperRectWithCost(posX, posY, actorScale(vw), vw, vh);
        if (obsCost > 0) {
          compactInflowWhisper = true;
          await svelteTick();
          if (mounted && !atHome) {
            measureLayoutAndObstacles(vw, vh);
            if (currentState.mode === 'roaming') {
              relocateToFreeSpot(false);
            }
          }
        }
      }
      applyActorTransform();
      return;
    }

    const moving = relocateToFreeSpot(true);
    if (moving && Math.hypot(targetX - posX, targetY - posY) > 18) {
      hurry = true;
      stepAside = true;
      bubbleTravelling = true;
      bubbleEl.classList.add('is-travelling');
      if (whisperHideTimer) clearTimeout(whisperHideTimer);
      if (walkArriveSafetyTimer) clearTimeout(walkArriveSafetyTimer);
      walkArriveSafetyTimer = setTimeout(() => {
        walkArriveSafetyTimer = null;
        onArrived();
        applyActorTransform();
      }, 850);
    } else {
      bubbleTravelling = false;
      bubbleEl.classList.remove('is-travelling');
      if (whisperHideTimer) clearTimeout(whisperHideTimer);
      whisperHideTimer = setTimeout(hideWhisperBubble, pendingWhisperMs || 4200);
    }
    updateBubbleAnchorMode(targetX, targetY);
    evaluateDockWhisperFallback(targetX, targetY);
    applyActorTransform();
  }

  function spawnHeartBurst(count = 6) {
    const colors = ['#fbbf24', '#f472b6', '#fde68a', '#34d399'];
    for (let i = 0; i < count; i++) {
      hearts.push({
        x: (Math.random() - 0.5) * 44,
        y: -26 - Math.random() * 16,
        vx: (Math.random() - 0.5) * 0.9,
        vy: -0.75 - Math.random() * 0.65,
        scale: 0.75 + Math.random() * 0.45,
        alpha: 1,
        color: colors[i % colors.length]
      });
    }
    if (hearts.length > 18) {
      hearts = hearts.slice(-18);
    }
  }

  function launchViewportTreatToMolly(treat) {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    let startX = vw * 0.5;
    let startY = vh * 0.44;

    const activeStage = document.querySelector(
      '.card-effect-stage canvas.impact-payoff-canvas, .sanctuary-canvas, .instant-card'
    );
    if (activeStage) {
      const rect = activeStage.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        startX = rect.left + rect.width * 0.5;
        startY = rect.top + rect.height * 0.5;
      }
    }

    const toDock = currentState.mode === 'docked' || atHome || crowdedPark;
    const dockRect = toDock ? document.querySelector('.molly-pelisek-dock')?.getBoundingClientRect() : null;
    const destX = toDock
      ? dockRect
        ? dockRect.left + 22
        : vw <= 680
          ? vw - 65
          : 235
      : posX;
    const destY = toDock
      ? dockRect
        ? dockRect.top + dockRect.height * 0.5
        : vh - 85
      : posY - 22;

    flyingTreat = {
      x0: startX,
      y0: startY,
      cx: (startX + destX) * 0.5,
      cy: Math.max(48, Math.min(startY, destY) - 120),
      x1: destX,
      y1: destY,
      p: 0,
      follow: !toDock,
      icon: normalizeMollyIcon(treat?.icon, 'fish'),
      color: treat?.color || '#f59e0b',
      name: treat?.name || 'lososová granulka'
    };
    // Reaktivní je jen viditelnost a vzhled; poloha se zapisuje přímo do DOM v každém snímku
    flyingTreatView = {
      icon: flyingTreat.icon,
      color: flyingTreat.color,
      x0: Number(startX.toFixed(1)),
      y0: Number(startY.toFixed(1))
    };
    lastTreatTransform = '';

    behavior = 'CATCH_TREAT';
    behaviorTimer = 2.8;
    eatTimer = 1.8;
    spawnHeartBurst(7);
  }

  // ===================== Kde Molly smí stát (nic důležitého nezakrývá) =====================
  // Molly i její bublina jsou pevně umístěné nad stránkou. Vybírá si místo podle toho,
  // co je zrovna pod ní: tlačítka, odkazy, pole formuláře, nadpisy, odstavce ani mapu nikdy nepřekrývá.
  const OBSTACLE_SELECTOR =
    'a[href], button, input, select, textarea, label, summary, [role="button"], [data-molly-guide], h1, h2, h3, h4, p, .hero-overline, .page-header-kicker, .section-overline, .smart-nearest-banner, .count-heading, .deed-preview-stage, .card-effect-stage, .bento-cta, .card-cta, .card-title, .card-overline, .chip, .pill, .cat-pill, .city-chip, .q-pill, .preset-pill, .topic-pill, .filter-chip, .source-chip, .radius-pill, .energy-tab, .mobile-guided-preview-bar, .feedback-pill, .deck-header-bar, .deck-indicator, .deck-nav-btn, .instant-card, .action-card, .place-card, .bento-card, .portal-card, .portal-mini, .nav-capsule, .top-nav, .card, .compass-shell, .highlight-card, .alt-card, .local-card, .side-note, .empty-box, .calm-drawer, .footer-col, .footer-brand, .footer-desc, .footer-heading, .footer-trust, .map-frame, .leaflet-container, .quick-tags-pill, .category-aura-chip, .molly-celebration-note, .legend-chip, .qd-chip';
  const MOBILE_MAX_W = 680;

  function viewportSize() {
    return { vw: window.innerWidth || 1280, vh: window.innerHeight || 800 };
  }

  /**
   * Viditelná šířka bez svislého posuvníku, aby Molly na pravém okraji nezajela pod scrollbar.
   * @param {number} vw
   */
  function clientViewportWidth(vw) {
    if (typeof document === 'undefined') return vw;
    const cw = document.documentElement?.clientWidth || 0;
    return cw > 0 ? Math.min(vw, cw) : vw;
  }

  /**
   * Přirozené cílové měřítko Molly pro danou šířku viewportu (`0.78` na laptopu, `0.92` na širokém PC).
   * @param {number} vw
   * @returns {number}
   */
  function baseActorScale(vw) {
    if (vw <= MOBILE_MAX_W) return 0.72;
    if (vw <= 1365) return 0.78;
    return 0.92;
  }

  /**
   * @param {number} vw
   * @returns {number}
   */
  function actorScale(vw) {
    if (vw <= MOBILE_MAX_W) return 0.72;
    return activeDesktopScale > 0 ? activeDesktopScale : baseActorScale(vw);
  }

  /**
   * @type {{
   *   ts: number,
   *   vw: number,
   *   vh: number,
   *   clientW: number,
   *   groundY: number,
   *   topNavBottom: number,
   *   dock: DOMRect | null,
   *   crisis: DOMRect | null,
   *   feedback: DOMRect | null
   * }}
   */
  let layoutMetricsCache = {
    ts: 0,
    vw: 0,
    vh: 0,
    clientW: 0,
    groundY: 0,
    topNavBottom: 0,
    dock: null,
    crisis: null,
    feedback: null
  };

  /**
   * @typedef {{
   *   l: number,
   *   t: number,
   *   r: number,
   *   b: number,
   *   w: number,
   *   hard: boolean,
   *   heading: boolean,
   *   text: boolean
   * }} MeasuredObstacle
   */

  /** @type {MeasuredObstacle[]} */
  let cachedObstacles = [];
  /** @type {MeasuredObstacle[]} */
  let cachedFullObstacles = [];
  /** @type {Array<{ l: number, t: number, r: number, b: number }>} */
  let cachedControlRects = [];
  let cachedWhisperRectKey = '';
  /** @type {{ l: number, t: number, r: number, b: number } | null} */
  let cachedWhisperRect = null;

  function invalidateLayoutCache() {
    layoutMetricsCache.ts = 0;
    cachedWhisperRectKey = '';
    cachedWhisperRect = null;
  }

  /**
   * Měření překážek a metrik layoutu VÝHRADNĚ mimo requestAnimationFrame smyčku.
   * Spouští se pouze v debouncovaných listenerech na resize, scroll a změnu trasy.
   * @param {number} [vw]
   * @param {number} [vh]
   */
  function measureLayoutAndObstacles(vw, vh) {
    if (typeof document === 'undefined') return;
    if (!vw || !vh) {
      const vs = viewportSize();
      vw = vs.vw;
      vh = vs.vh;
    }
    const clientW = clientViewportWidth(vw);
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const topNavEl = document.querySelector('header.top-nav, .top-nav, .navbar');
    const topNavR = topNavEl ? topNavEl.getBoundingClientRect() : null;
    const topNavBottom =
      topNavR && topNavR.width > 0 && topNavR.height > 0 && topNavR.top <= 16
        ? topNavR.bottom
        : 0;

    const dEl = document.querySelector('.molly-pelisek-dock');
    const dR = dEl?.getBoundingClientRect();
    const dock = dR && dR.width > 0 ? dR : null;

    /** @type {DOMRect | null} */
    let crisis = null;
    const cEls = document.querySelectorAll('.crisis-widget > button');
    for (const el of cEls) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh) {
        crisis = r;
        break;
      }
    }

    const fbEl = document.querySelector('.feedback-pill');
    const fbR = fbEl?.getBoundingClientRect();
    const feedback = fbR && fbR.width > 0 && fbR.height > 0 ? fbR : null;

    let groundY;
    if (vw <= MOBILE_MAX_W) {
      groundY = Math.round(vh - 10);
    } else {
      groundY = vh <= 620 ? vh - 12 : vh - 18;
    }

    layoutMetricsCache = { ts: now, vw, vh, clientW, groundY, topNavBottom, dock, crisis, feedback };
    if (bubbleEl) {
      bubbleW = bubbleEl.offsetWidth;
      bubbleH = bubbleEl.offsetHeight;
    }
    const measured = measureObstaclesPair(vw, vh);
    cachedObstacles = measured.catObstacles;
    cachedFullObstacles = measured.bubbleObstacles;

    /** @type {Array<{ l: number, t: number, r: number, b: number }>} */
    const ctrlRects = [];
    const controls = document.querySelectorAll('a[href], button, input, select, textarea');
    for (const el of controls) {
      if (el.closest('.molly-companion-layer, .molly-pelisek-dock, .top-nav')) continue;
      const t = el.getBoundingClientRect();
      if (t.width <= 0 || t.height <= 0) continue;
      ctrlRects.push({ l: t.left, t: t.top, r: t.right, b: t.bottom });
    }
    cachedControlRects = ctrlRects;
    cachedWhisperRectKey = '';
    cachedWhisperRect = null;
  }

  /**
   * @param {number} vw
   * @param {number} vh
   */
  function ensureLayoutMetrics(vw, vh) {
    if (
      layoutMetricsCache.ts > 0 &&
      layoutMetricsCache.vw === vw &&
      layoutMetricsCache.vh === vh
    ) {
      return layoutMetricsCache;
    }
    let groundY;
    if (vw <= MOBILE_MAX_W) {
      groundY = Math.round(vh - 10);
    } else {
      groundY = vh <= 620 ? vh - 12 : vh - 18;
    }
    return { ...layoutMetricsCache, vw, vh, clientW: clientViewportWidth(vw), groundY };
  }

  /** Svislá „chodníková“ linie u spodního okraje obrazovky. */
  function groundLine(vw, vh) {
    return ensureLayoutMetrics(vw, vh).groundY;
  }

  function dockRect() {
    const { vw, vh } = viewportSize();
    return ensureLayoutMetrics(vw, vh).dock;
  }

  function feedbackRect() {
    const { vw, vh } = viewportSize();
    return ensureLayoutMetrics(vw, vh).feedback;
  }

  /**
   * @param {number} vw
   * @param {number} [scaleOverride]
   */
  function roamRange(vw, scaleOverride) {
    const { vh } = viewportSize();
    const clientW = ensureLayoutMetrics(vw, vh).clientW || vw;
    const s = scaleOverride || actorScale(vw);
    const half = LOGICAL_W * 0.5 * s;
    const c = crisisRect();
    const d = dockRect();
    if (vw <= MOBILE_MAX_W) {
      // Na mobilu je pelíšek nahoře v hlavičce; dole chodí Molly volně s odstupem od případné opory
      const dBottom = d && d.bottom > vh * 0.5 ? d : null;
      const right = dBottom && dBottom.left > vw * 0.4 ? Math.floor(dBottom.left - half - 6) : Math.floor(clientW - half - 8);
      const left = c && c.right < vw * 0.6 ? Math.ceil(c.right + half + 6) : Math.ceil(half + 8);
      if (right < left) {
        const mid = Math.round((left + right) * 0.5);
        return { minX: mid, maxX: mid };
      }
      return { minX: left, maxX: right };
    }
    // Na spodní linii (groundLine) nechodí přes pelíšek vlevo dole ani přes pilulku krizové opory vpravo dole
    const dLeftBottom = d && d.bottom > vh * 0.5 && d.right < vw * 0.45 ? d : null;
    const left = dLeftBottom ? Math.ceil(dLeftBottom.right + half + 8) : Math.ceil(half + 12);
    const right = c && c.left > vw * 0.5 ? Math.floor(c.left - half - 8) : Math.floor(clientW - half - 12);
    return { minX: left, maxX: Math.max(left + 40, right) };
  }

  function catRectAt(x, y, s) {
    const halfW = LOGICAL_W * 0.5 * s + CAT_SAFETY_X;
    const fullH = LOGICAL_H * s + CAT_SAFETY_TOP;
    return { l: x - halfW, t: y - fullH, r: x + halfW, b: y + CAT_SAFETY_BOTTOM };
  }

  function defaultBubbleRectAt(x, y, s, vw) {
    if (!bubbleW || !bubbleH) return null;
    const clientW = clientViewportWidth(vw);
    const left = Math.max(8, Math.min(clientW - 8 - bubbleW, Math.round(x - bubbleW / 2)));
    const bottom = y - Math.round(LOGICAL_H * s) - 6;
    const top = Math.max(64, bottom - bubbleH);
    return { l: left, t: top, r: left + bubbleW, b: top + bubbleH };
  }

  function rectOverlapWithObstaclesAndControls(rect, vw, vh) {
    if (!rect) return 0;
    let area = 0;
    for (const o of collectObstacles(vw, vh, true)) {
      area += overlapArea(rect, o);
    }
    for (const t of cachedControlRects) {
      area += overlapArea(rect, t);
    }
    return area;
  }

  function dockAnchoredBubbleRect(x, y, s, vw) {
    const d = dockRect();
    if (!d || d.top < 96) return null;
    const clientW = clientViewportWidth(vw);
    const left = Math.max(8, Math.min(clientW - 8 - bubbleW, Math.round(d.left)));
    const right = left + bubbleW;
    const cat = catRectAt(x, y, s);
    let bottom = Math.round(d.top - 6);
    if (right > cat.l - 4 && left < cat.r + 4) {
      bottom = Math.min(bottom, Math.floor(cat.t - 6));
    }
    const c = crisisRect();
    if (c && right > c.left - 4 && left < c.right + 4) {
      bottom = Math.min(bottom, Math.floor(c.top - 6));
    }
    const top = Math.max(64, bottom - bubbleH);
    return { l: left, t: top, r: right, b: top + bubbleH };
  }

  function findBestWhisperRectWithCost(x, y, s, vw, vh) {
    if (!bubbleW || !bubbleH) return { rect: null, obsCost: 0 };
    const clientW = ensureLayoutMetrics(vw, vh).clientW || vw;
    const obstacles = collectObstacles(vw, vh, true);
    const { topNavBottom } = ensureLayoutMetrics(vw, vh);
    const minTop =
      topNavBottom > 0
        ? Math.max(60, Math.ceil(topNavBottom + (vw <= MOBILE_MAX_W ? 3 : 8)))
        : 64;
    const maxTop = Math.max(minTop, vh - bubbleH - 8);
    const isParkedOrDock = Boolean(
      activeWhisper?.fromDock ||
      currentState.mode === 'docked' ||
      atHome ||
      crowdedPark
    );
    const catVisible = currentState.mode === 'roaming' && !atHome && !crowdedPark;
    const cat = catVisible ? catRectAt(x, y, s) : null;
    const preferredY = catVisible
      ? Math.max(minTop, Math.min(maxTop, y - Math.round(LOGICAL_H * s) - 8 - bubbleH))
      : minTop;

    const maxBubbleLeft = Math.max(8, clientW - 8 - bubbleW);
    const halfCatW = Math.round(LOGICAL_W * 0.5 * s);
    const candXs = Array.from(
      new Set([
        Math.max(8, Math.min(maxBubbleLeft, Math.round(clientW - 10 - bubbleW))),
        Math.max(8, Math.min(maxBubbleLeft, Math.round((clientW - bubbleW) * 0.5))),
        Math.max(8, Math.min(maxBubbleLeft, Math.round(x - bubbleW * 0.5))),
        Math.max(8, Math.min(maxBubbleLeft, Math.round(x + halfCatW + 10))),
        Math.max(8, Math.min(maxBubbleLeft, Math.round(x - halfCatW - bubbleW - 10))),
        8
      ])
    );

    /** @type {Set<number>} */
    const candYSet = new Set([minTop, maxTop, preferredY]);
    for (let ty = minTop; ty <= maxTop; ty += 6) {
      candYSet.add(ty);
    }
    for (const o of obstacles) {
      const belowObs = Math.ceil(o.b + 2);
      if (belowObs >= minTop && belowObs <= maxTop) candYSet.add(belowObs);
      const aboveObs = Math.floor(o.t - bubbleH - 2);
      if (aboveObs >= minTop && aboveObs <= maxTop) candYSet.add(aboveObs);
    }
    const candYs = Array.from(candYSet);

    let best = null;
    let bestScore = Infinity;
    let bestObsCost = 0;

    const evalCandidates = (xs) => {
      for (const ty of candYs) {
        if (ty < minTop || ty > maxTop) continue;
        for (const lx of xs) {
          const rect = { l: lx, t: ty, r: lx + bubbleW, b: ty + bubbleH };
          let obsCost = 0;
          for (const o of obstacles) {
            const area = overlapArea(rect, o);
            if (area > 0) obsCost += area * o.w;
          }
          for (const t of cachedControlRects) {
            const area = overlapArea(rect, t);
            if (area > 0) obsCost += area * 2;
          }
          if (cat) {
            obsCost += overlapArea(rect, cat) * 4;
          }
          const distPref = isParkedOrDock ? (ty - minTop) * 0.05 : Math.abs(ty - preferredY) * 0.1;
          const score = obsCost * 100 + distPref;
          if (score < bestScore) {
            bestScore = score;
            best = rect;
            bestObsCost = obsCost;
          }
        }
      }
    };

    evalCandidates(candXs);

    if (bestObsCost > 0) {
      const scanXs = [];
      for (let lx = 8; lx <= maxBubbleLeft; lx += 44) {
        if (!candXs.includes(lx)) scanXs.push(lx);
      }
      if (scanXs.length > 0) evalCandidates(scanXs);
    }

    if (best) return { rect: best, obsCost: bestObsCost };
    const fallbackLeft = Math.max(8, Math.min(maxBubbleLeft, Math.round(clientW - 10 - bubbleW)));
    return {
      rect: { l: fallbackLeft, t: minTop, r: fallbackLeft + bubbleW, b: minTop + bubbleH },
      obsCost: 0
    };
  }

  function findBestWhisperRect(x, y, s, vw, vh) {
    return findBestWhisperRectWithCost(x, y, s, vw, vh).rect;
  }

  /**
   * @param {number} anchorX
   * @param {number} [anchorY]
   */
  function updateBubbleAnchorMode(anchorX, anchorY) {
    if (!activeWhisper || !bubbleW || !bubbleH) {
      dockAnchoredBubble = false;
      return;
    }
    const { vw, vh } = viewportSize();
    const ay = Number.isFinite(anchorY) ? /** @type {number} */ (anchorY) : posY;
    if (!activeWhisper.fromDock || !dockRect() || hardBubbleOverlapAt(anchorX, ay) <= 40) {
      dockAnchoredBubble = false;
      return;
    }
    const s = actorScale(vw);
    const cand = dockAnchoredBubbleRect(anchorX, ay, s, vw);
    dockAnchoredBubble = Boolean(cand && rectOverlapWithObstaclesAndControls(cand, vw, vh) <= 0);
  }

  /**
   * @param {number} anchorX
   * @param {number} [anchorY]
   */
  function evaluateDockWhisperFallback(anchorX, anchorY) {
    if (!activeWhisper?.fromDock || $isCompactDock || currentState.mode === 'docked' || atHome || crowdedPark) {
      forceDockWhisper = false;
      return;
    }
    if (dockAnchoredBubble || !bubbleW || !bubbleH) {
      forceDockWhisper = false;
      return;
    }
    const { vw, vh } = viewportSize();
    const ay = Number.isFinite(anchorY) ? /** @type {number} */ (anchorY) : posY;
    if (vw <= 1024 || hardBubbleOverlapAt(anchorX, ay) <= 0) {
      forceDockWhisper = false;
      return;
    }
    const s = actorScale(vw);
    const d = dockRect();
    const cat = catRectAt(anchorX, ay, s);
    if (d) {
      const dockBubW = Math.min(250, bubbleW);
      const dockBubRect = {
        l: d.left,
        t: Math.max(64, d.top - 8 - bubbleH),
        r: d.left + dockBubW,
        b: d.top - 8
      };
      if (overlapArea(dockBubRect, cat) > 0 || rectOverlapWithObstaclesAndControls(dockBubRect, vw, vh) > 0) {
        forceDockWhisper = false;
        return;
      }
    }
    const { obsCost } = findBestWhisperRectWithCost(anchorX, ay, s, vw, vh);
    forceDockWhisper = obsCost > 0;
  }

  function getMemoizedWhisperRect(x, y, s, vw, vh) {
    const key = `${Math.round(x)}|${Math.round(y)}|${s}|${vw}|${vh}|${bubbleW}|${bubbleH}|${layoutMetricsCache.ts}|${currentState.mode}|${atHome ? 1 : 0}|${crowdedPark ? 1 : 0}|${activeWhisper?.fromDock ? 1 : 0}|${activeWhisper?.ts || 0}`;
    if (key === cachedWhisperRectKey && cachedWhisperRect) {
      return cachedWhisperRect;
    }
    const rect = findBestWhisperRect(x, y, s, vw, vh);
    cachedWhisperRectKey = key;
    cachedWhisperRect = rect;
    return rect;
  }

  function bubbleRectAt(x, y, s, vw) {
    if (!bubbleW || !bubbleH) return null;
    const { vh } = viewportSize();
    if ($isCompactDock || vw <= 1024 || crowdedPark) {
      return getMemoizedWhisperRect(x, y, s, vw, vh);
    }
    if (dockAnchoredBubble) {
      const cand = dockAnchoredBubbleRect(x, y, s, vw);
      if (cand) {
        return cand;
      }
      return getMemoizedWhisperRect(x, y, s, vw, vh);
    }
    if (hardBubbleOverlapAt(x, y) > 0) {
      return getMemoizedWhisperRect(x, y, s, vw, vh);
    }
    return defaultBubbleRectAt(x, y, s, vw);
  }

  /**
   * Jediný průchod DOM pro přesné obdélníky překážek kočky i bubliny VÝHRADNĚ mimo rAF.
   * Rozlišuje tvrdé interaktivní překážky (tlačítka, odkazy, vstupy, pelíšek, opora, mapa,
   * primární CTA a texty .instant-card) od měkkého papírového podkladu karet, takže Molly na
   * desktopu vždy přirozeně chodí po klidné spodní podlaze bez poskakování po římsách.
   * @param {number} vw
   * @param {number} vh
   */
  function measureObstaclesPair(vw, vh) {
    /** @type {MeasuredObstacle[]} */
    const catObstacles = [];
    /** @type {MeasuredObstacle[]} */
    const bubbleObstacles = [];
    const isMobile = vw <= MOBILE_MAX_W;
    const bubPad = 3;
    const topNavEl = document.querySelector('.navbar, .top-nav');
    const topNavRect = topNavEl ? topNavEl.getBoundingClientRect() : null;
    const capsuleEl = document.querySelector('.nav-capsule');
    const capsuleRect = capsuleEl ? capsuleEl.getBoundingClientRect() : null;
    const topNavBottom =
      topNavRect && topNavRect.width > 0 && topNavRect.height > 0 && topNavRect.top <= 16
        ? topNavRect.bottom
        : 0;
    const textRange = typeof document.createRange === 'function' ? document.createRange() : null;

    const nodes = document.querySelectorAll(OBSTACLE_SELECTOR);
    for (const el of nodes) {
      if (el.closest('.molly-companion-layer, .molly-pelisek-dock')) continue;
      if (!el.matches('.top-nav, .nav-capsule') && el.closest('.navbar, .top-nav')) continue;
      if (el.matches('.top-nav, .nav-capsule')) continue;
      const closedDetails = el.closest('details:not([open])');
      if (closedDetails && !el.closest('summary')) continue;
      const inAnimatedPayoff = Boolean(
        el.closest('.in-situ-celebration, .celebration-card, .return-dopamine-strip, .card-effect-stage')
      );
      if (typeof el.checkVisibility === 'function') {
        if (!el.checkVisibility({ checkOpacity: !inAnimatedPayoff, checkVisibilityCSS: true })) continue;
      } else {
        const cs = getComputedStyle(el);
        if (
          cs.display === 'none' ||
          cs.visibility === 'hidden' ||
          (!inAnimatedPayoff && Number(cs.opacity) < 0.05)
        ) {
          continue;
        }
      }
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;

      const isBlockCardLink = el.matches(
        'a.bento-card, a.card, a.portal-card, a.portal-mini, a.alt-card, a.local-card'
      );

      let boxLeft = r.left;
      let boxTop = r.top;
      let boxRight = r.right;
      let boxBottom = r.bottom;
      if (
        textRange &&
        (el.matches(
          'h4, p, label, .hero-overline, .section-overline, .page-header-kicker, .count-heading, .bento-cta, .card-cta, .card-title, .card-overline'
        ) ||
          (el.tagName === 'SUMMARY' && !el.closest('.instant-card'))) &&
        !el.closest('.instant-card, .site-footer, button') &&
        (el.tagName === 'SUMMARY' || !el.closest('summary')) &&
        (!el.closest('a[href]') ||
          Boolean(
            el.closest('a.bento-card, a.card, a.portal-card, a.portal-mini, a.alt-card, a.local-card')
          ))
      ) {
        const labelEl = el.tagName === 'SUMMARY' ? el.querySelector('.summary-label') || el : el;
        if (!labelEl.textContent || !labelEl.textContent.trim()) continue;
        textRange.selectNodeContents(labelEl);
        const tr = textRange.getBoundingClientRect();
        if (tr.width >= 2 && tr.height >= 2) {
          boxLeft = tr.left;
          boxTop = tr.top;
          boxRight = tr.right;
          boxBottom = tr.bottom;
        }
      }

      const visTop = Math.max(boxTop, topNavBottom);
      const visBottom = Math.min(boxBottom, vh);
      if (visBottom - visTop < 2) continue;
      if (visBottom < 0 || visTop > vh || boxRight < 0 || boxLeft > vw) continue;

      const isHeading = /^H[1-4]$/.test(el.tagName);
      const inInstantCard = Boolean(el.closest('.instant-card'));
      const isHardDesktopCatTarget =
        el.tagName === 'BUTTON' ||
        el.tagName === 'INPUT' ||
        el.tagName === 'SELECT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'H1' ||
        el.tagName === 'H2' ||
        el.tagName === 'H3' ||
        el.matches('[role="button"]') ||
        el.matches('a[href]') ||
        (inInstantCard && el.matches('h1, h2, p, summary')) ||
        el.matches(
          '.deck-header-bar, .deck-indicator, .deck-nav-btn, .energy-tab, .filter-chip, .source-chip, .radius-pill, .preset-pill, .topic-pill, .chip, .pill, .cat-pill, .city-chip, .q-pill, .mobile-guided-preview-bar, .map-frame, .leaflet-container, .deed-preview-stage, .card-effect-stage, .footer-brand, .footer-desc, .footer-heading, .quick-tags-pill, .category-aura-chip, .molly-celebration-note, .legend-chip, .qd-chip'
        );
      const catHard = isMobile ? true : isHardDesktopCatTarget;
      const isProminentHeading =
        !catHard &&
        el.matches('h2, h3, .section-overline, .page-header-kicker, .count-heading');
      const isSoftText =
        !catHard &&
        !isProminentHeading &&
        (el.tagName === 'SUMMARY' ||
          el.matches(
            'h4, p, label, .hero-overline, .bento-cta, .card-cta, .card-title, .card-overline'
          ));
      const catPadX = catHard ? 1 : isProminentHeading ? 5 : 1;
      const catPadY = catHard ? 1.5 : isProminentHeading ? 3 : 1;
      const catWeight = catHard ? (isHeading ? 1.5 : 2) : isProminentHeading ? 4 : isSoftText ? 2.4 : 0.25;

      const isHardBubbleTarget =
        el.tagName === 'H1' ||
        el.tagName === 'BUTTON' ||
        el.matches(
          'a.btn-studio-primary, .deck-header-bar, .deck-indicator, .deck-nav-btn, .map-frame, .leaflet-container, .crisis-trigger, .footer-brand, .footer-desc, .footer-heading'
        ) ||
        inInstantCard;
      const isSoftCardSurface =
        !isHardBubbleTarget &&
        (isBlockCardLink ||
          (el.matches(
            '.card, .bento-card, .portal-card, .action-card, .place-card, .compass-shell, .highlight-card, .side-note, .empty-box, .calm-drawer, .footer-col'
          ) &&
            !el.matches('a[href], button, summary')));
      const bubWeight = isHardBubbleTarget ? 16 : isSoftCardSurface ? 0.35 : isHeading ? 2.5 : 2;

      catObstacles.push({
        l: boxLeft - catPadX,
        t: visTop - catPadY,
        r: boxRight + catPadX,
        b: visBottom + catPadY,
        w: catWeight,
        hard: catHard,
        heading: isProminentHeading,
        text: isSoftText
      });
      bubbleObstacles.push({
        l: boxLeft - bubPad,
        t: visTop - bubPad,
        r: boxRight + bubPad,
        b: visBottom + bubPad,
        w: bubWeight,
        hard: true,
        heading: false,
        text: false
      });
    }

    if (textRange && document.body) {
      try {
        textRange.setStart(document.body, 0);
        textRange.collapse(true);
      } catch {}
    }

    for (const targetArr of [catObstacles, bubbleObstacles]) {
      if (topNavRect && topNavRect.width > 0 && topNavRect.height > 0) {
        targetArr.push({
          l: topNavRect.left,
          t: topNavRect.top,
          r: topNavRect.right,
          b: topNavRect.bottom + 1,
          w: 4,
          hard: true,
          heading: false,
          text: false
        });
      }
      if (capsuleRect && capsuleRect.width > 0 && capsuleRect.height > 0) {
        targetArr.push({
          l: capsuleRect.left,
          t: capsuleRect.top,
          r: capsuleRect.right,
          b: capsuleRect.bottom + 1,
          w: 4,
          hard: true,
          heading: false,
          text: false
        });
      }
    }

    // Pelíšek patří Molly, ale kočka na něm ve stavu roaming nesedí a bublina ho nesmí zakrýt
    const d = dockRect();
    if (d) {
      catObstacles.push({
        l: d.left - 2,
        t: d.top - 2.5,
        r: d.right + 2,
        b: d.bottom + 2,
        w: 2.5,
        hard: true,
        heading: false,
        text: false
      });
      bubbleObstacles.push({
        l: d.left - 3,
        t: d.top - 3,
        r: d.right + 3,
        b: d.bottom + 3,
        w: 2.5,
        hard: true,
        heading: false,
        text: false
      });
    }
    // Krizová opora i tlačítko zpětné vazby musí zůstat vždy 100% volné
    const c = crisisRect();
    if (c) {
      catObstacles.push({
        l: c.left - 3,
        t: c.top - 3,
        r: c.right + 3,
        b: c.bottom + 3,
        w: 3.5,
        hard: true,
        heading: false,
        text: false
      });
      bubbleObstacles.push({
        l: c.left - 4,
        t: c.top - 4,
        r: c.right + 4,
        b: c.bottom + 4,
        w: 3.5,
        hard: true,
        heading: false,
        text: false
      });
    }
    const fb = feedbackRect();
    if (fb) {
      catObstacles.push({
        l: fb.left - 3,
        t: fb.top - 3,
        r: fb.right + 3,
        b: fb.bottom + 3,
        w: 3.5,
        hard: true,
        heading: false,
        text: false
      });
      bubbleObstacles.push({
        l: fb.left - 4,
        t: fb.top - 4,
        r: fb.right + 4,
        b: fb.bottom + 4,
        w: 3.5,
        hard: true,
        heading: false,
        text: false
      });
    }

    return { catObstacles, bubbleObstacles };
  }

  /**
   * @param {number} _vw
   * @param {number} _vh
   * @param {boolean} [fullViewport]
   * @returns {MeasuredObstacle[]}
   */
  function collectObstacles(_vw, _vh, fullViewport = false) {
    return fullViewport ? cachedFullObstacles : cachedObstacles;
  }

  function findBestBubbleRect(anchorX, anchorY) {
    const { vw } = viewportSize();
    const s = actorScale(vw);
    updateBubbleAnchorMode(anchorX, anchorY);
    return bubbleRectAt(anchorX, anchorY, s, vw);
  }

  function crisisRect() {
    const { vw, vh } = viewportSize();
    return ensureLayoutMetrics(vw, vh).crisis;
  }

  function overlapArea(a, b) {
    const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
    const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
    return w > 0 && h > 0 ? w * h : 0;
  }

  /**
   * Rozklad kolizního skóre na tvrdé překážky (tlačítka, odkazy, vstupy, pelíšek, mapa, CTA)
   * a měkké preference (texty mimo .instant-card a papírové pozadí karet).
   * @param {number} x
   * @param {number} y
   * @param {number} s
   * @param {number} vw
   * @param {MeasuredObstacle[]} obstacles
   * @param {boolean} withBubble
   */
  function scoreSpotBreakdown(x, y, s, vw, obstacles, withBubble) {
    const cat = catRectAt(x, y, s);
    const bub = withBubble ? defaultBubbleRectAt(x, y, s, vw) : null;
    const catArea = Math.max(1, LOGICAL_W * LOGICAL_H * s * s);
    let hard = 0;
    let headingArea = 0;
    let softTextArea = 0;
    let softCardArea = 0;
    for (const o of obstacles) {
      const cArea = overlapArea(cat, o);
      if (cArea > 0) {
        if (o.hard) {
          hard += cArea * o.w;
        } else if (o.heading) {
          headingArea += cArea;
        } else if (o.text) {
          softTextArea += cArea;
        } else {
          softCardArea += cArea;
        }
      }
      if (bub) {
        const bArea = overlapArea(bub, o);
        if (bArea > 0) {
          if (o.hard) {
            hard += bArea * o.w * 1.2;
          } else {
            softTextArea += bArea * 0.35;
          }
        }
      }
    }
    const headingRatio = Math.min(2, headingArea / catArea);
    const headingCost = headingArea > 0 ? 4500 + headingRatio * 2500 : 0;
    const softTextRatio = Math.min(2, softTextArea / catArea);
    const softCardRatio = Math.min(2, softCardArea / catArea);
    const softCost = headingCost + softTextRatio * 95 + softCardRatio * 20;
    return { hard, headingArea, softTextRatio, softCardRatio, softCost };
  }

  /**
   * Tvrdý překryv s interaktivními prvky (0 = 100% bez kolize s tlačítky, odkazy, pelíškem i mapou).
   * @param {number} x
   * @param {number} y
   * @param {number} s
   * @param {number} vw
   * @param {MeasuredObstacle[]} obstacles
   * @param {boolean} withBubble
   */
  function scoreSpot(x, y, s, vw, obstacles, withBubble) {
    return scoreSpotBreakdown(x, y, s, vw, obstacles, withBubble).hard;
  }

  /**
   * Ověří, že klidná procházka z (x0, y0) do (x1, y1) nikde neprochází přes tvrdou překážku.
   * Nikdy se nepoužívá k okamžitému teleportu — pouze k výběru cíle volné procházky.
   * @param {number} x0
   * @param {number} y0
   * @param {number} x1
   * @param {number} y1
   * @param {number} s
   * @param {number} vw
   * @param {MeasuredObstacle[]} obstacles
   */
  function isWalkPathClear(x0, y0, x1, y1, s, vw, obstacles) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    if (dist < 6) return true;
    if (Math.abs(y1 - y0) > 22) return false;
    const steps = Math.min(14, Math.max(2, Math.ceil(dist / 34)));
    for (let i = 1; i < steps; i++) {
      const p = i / steps;
      const mx = x0 + (x1 - x0) * p;
      const my = y0 + (y1 - y0) * p;
      if (scoreSpot(mx, my, s, vw, obstacles, false) > 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Ověří, že přímá cesta mezi (x0, y0) a (x1, y1) neprotíná žádnou tvrdou překážku (včetně svislých přesunů).
   * @param {number} x0
   * @param {number} y0
   * @param {number} x1
   * @param {number} y1
   * @param {number} s
   * @param {number} vw
   * @param {MeasuredObstacle[]} obstacles
   */
  function isStraightPathClear(x0, y0, x1, y1, s, vw, obstacles) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    if (dist < 6) return true;
    const steps = Math.min(20, Math.max(3, Math.ceil(dist / 28)));
    for (let i = 1; i < steps; i++) {
      const p = i / steps;
      const mx = x0 + (x1 - x0) * p;
      const my = y0 + (y1 - y0) * p;
      if (scoreSpot(mx, my, s, vw, obstacles, false) > 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Spočítá, kolik vzorkovacích bodů na přímce mezi (x0, y0) a (x1, y1) protíná tvrdé překážky.
   * @param {number} x0
   * @param {number} y0
   * @param {number} x1
   * @param {number} y1
   * @param {number} s
   * @param {number} vw
   * @param {MeasuredObstacle[]} obstacles
   */
  function pathObstructionSteps(x0, y0, x1, y1, s, vw, obstacles) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    if (dist < 6) return 0;
    const steps = Math.min(20, Math.max(3, Math.ceil(dist / 24)));
    let hits = 0;
    for (let i = 1; i < steps; i++) {
      const p = i / steps;
      const mx = x0 + (x1 - x0) * p;
      const my = y0 + (y1 - y0) * p;
      if (scoreSpot(mx, my, s, vw, obstacles, false) > 0) {
        hits += 1;
      }
    }
    return hits;
  }

  /**
   * Hledá nejklidnější místo pro Molly VÝHRADNĚ na konzistentní podlahové linii `groundLine(vw, vh)`
   * (s jemnou tolerancí u spodního okraje obrazovky, bez 150px svislého pásma a bez skákání po římsách karet).
   * Primárně používá plné přirozené měřítko (`0.78` na laptopu, `0.92` na širokém PC); pouze pokud na
   * husté třísloupcové mřížce na `<= 1365px` (např. `/app/online` nahoře) neexistuje volný bod pro `0.78`,
   * dočasně povolí kompaktní fallback měřítko s nulovou kolizí.
   * @param {{ preferX?: number, preferY?: number, withBubble?: boolean, avoidX?: number | null, obstacles?: MeasuredObstacle[], groundOnly?: boolean, nearbyBias?: boolean, scaleOverride?: number, requireWalkableFrom?: { x: number, y: number } | null, preferClearPathFrom?: { x: number, y: number } | null }} [opts]
   */
  function findBestSpot(opts = {}) {
    const { vw, vh } = viewportSize();
    const metrics = ensureLayoutMetrics(vw, vh);
    const clientW = metrics.clientW || vw;
    const gY = metrics.groundY;
    const obstacles = opts.obstacles || collectObstacles(vw, vh, false);
    const withBubble = Boolean(opts.withBubble);
    const preferX = Number.isFinite(opts.preferX) ? /** @type {number} */ (opts.preferX) : posX;

    if (vw <= MOBILE_MAX_W) {
      const s = 0.72;
      const { minX, maxX } = roamRange(vw, s);
      let best = {
        x: Math.max(minX, Math.min(maxX, preferX)),
        y: gY,
        score: Infinity,
        raw: Infinity,
        scale: s
      };
      for (let x = minX; x <= maxX + 0.1; x += 10) {
        if (
          opts.requireWalkableFrom &&
          !isWalkPathClear(opts.requireWalkableFrom.x, opts.requireWalkableFrom.y, x, gY, s, vw, obstacles)
        ) {
          continue;
        }
        const raw = scoreSpot(x, gY, s, vw, obstacles, withBubble);
        let score = raw * 120 + Math.abs(x - preferX) * 0.45;
        if (Number.isFinite(opts.avoidX) && Math.abs(x - /** @type {number} */ (opts.avoidX)) < 130) {
          score += 6000;
        }
        if (score < best.score) best = { x, y: gY, score, raw, scale: s };
      }
      return best;
    }

    const baseS = opts.scaleOverride || baseActorScale(vw);
    /**
     * @param {number} s
     */
    const searchForScale = (s) => {
      const halfDomW = LOGICAL_W * 0.5 * s;
      const fullMinX = Math.ceil(halfDomW + 1.5);
      const fullMaxX = Math.max(fullMinX, Math.floor(clientW - halfDomW - 1.5));
      const { minX: centralMinX, maxX: centralMaxX } = roamRange(vw, s);

      /** @type {Set<number>} */
      const xSet = new Set([
        fullMinX,
        fullMaxX,
        Math.max(fullMinX, Math.min(fullMaxX, Math.round(preferX))),
        Math.max(fullMinX, Math.min(fullMaxX, Math.round(clientW * 0.55)))
      ]);

      for (let x = fullMinX; x <= Math.min(fullMaxX, fullMinX + 48); x += 4) {
        xSet.add(x);
      }
      for (let x = Math.max(fullMinX, fullMaxX - 48); x <= fullMaxX; x += 4) {
        xSet.add(x);
      }
      for (let x = centralMinX; x <= centralMaxX + 0.1; x += 6) {
        xSet.add(Math.max(fullMinX, Math.min(fullMaxX, Math.round(x))));
      }
      for (let x = fullMinX; x <= fullMaxX + 0.1; x += 12) {
        xSet.add(Math.max(fullMinX, Math.min(fullMaxX, Math.round(x))));
      }
      const candXs = Array.from(xSet);
      const floorYs = opts.groundOnly
        ? [gY]
        : Array.from(
            new Set([
              gY,
              Math.min(vh - 4, gY + 8),
              Math.min(vh - 2, gY + 13),
              Math.min(vh - 1, gY + 16),
              Math.max(96, gY - 6)
            ])
          );
      const distWeight = opts.nearbyBias ? 1.18 : 0.44;

      let best = {
        x: Math.max(fullMinX, Math.min(fullMaxX, preferX)),
        y: gY,
        score: Infinity,
        raw: Infinity,
        scale: s
      };

      for (const y of floorYs) {
        for (const x of candXs) {
          if (
            opts.requireWalkableFrom &&
            !isWalkPathClear(opts.requireWalkableFrom.x, opts.requireWalkableFrom.y, x, y, s, vw, obstacles)
          ) {
            continue;
          }
          const bd = scoreSpotBreakdown(x, y, s, vw, obstacles, withBubble);
          const raw = bd.hard;
          const edgeBias = x < 72 || x > clientW - 72 ? 24 : 0;
          let score =
            raw * 150 +
            bd.softCost +
            Math.abs(x - preferX) * distWeight +
            Math.abs(y - gY) * 2.5 +
            edgeBias;
          if (Number.isFinite(opts.avoidX) && Math.abs(x - /** @type {number} */ (opts.avoidX)) < 130) {
            score += 6000;
          }
          if (score < best.score) {
            best = { x, y, score, raw, scale: s };
          }
        }
      }
      return best;
    };

    const primaryBest = searchForScale(baseS);
    const fallbackScales = [0.68, 0.62, 0.58, 0.54];
    let floorWinner = null;
    if (primaryBest.raw <= 0 || opts.scaleOverride) {
      floorWinner = primaryBest;
    }

    let bestOverall = primaryBest;
    if (!floorWinner) {
      for (const fallbackScale of fallbackScales) {
        const fbBest = searchForScale(fallbackScale);
        if (fbBest.raw <= 0) {
          floorWinner = fbBest;
          break;
        }
        if (
          fbBest.raw < bestOverall.raw ||
          (fbBest.raw === bestOverall.raw && fbBest.score < bestOverall.score)
        ) {
          bestOverall = fbBest;
        }
      }
    }

    const fromPt = opts.preferClearPathFrom;
    const shouldComparePocket =
      vw > 1024 &&
      !opts.groundOnly &&
      (!floorWinner ||
        (fromPt &&
          fromPt.y < gY - 40 &&
          !isStraightPathClear(fromPt.x, fromPt.y, floorWinner.x, floorWinner.y, floorWinner.scale, vw, obstacles)));

    if (floorWinner && !shouldComparePocket) {
      return floorWinner;
    }

    if (vw > 1024 && !opts.groundOnly) {
      const distWeight = opts.nearbyBias ? 1.18 : 0.44;
      const pocketScales = [baseS, ...fallbackScales];
      for (const s of pocketScales) {
        const halfDomW = LOGICAL_W * 0.5 * s;
        const fullMinX = Math.ceil(halfDomW + 1.5);
        const fullMaxX = Math.max(fullMinX, Math.floor(clientW - halfDomW - 1.5));
        const xSet = new Set([
          fullMinX,
          fullMaxX,
          Math.max(fullMinX, Math.min(fullMaxX, Math.round(preferX))),
          Math.max(fullMinX, Math.min(fullMaxX, Math.round(clientW * 0.55)))
        ]);
        for (let x = fullMinX; x <= Math.min(fullMaxX, fullMinX + 48); x += 4) xSet.add(x);
        for (let x = Math.max(fullMinX, fullMaxX - 48); x <= fullMaxX; x += 4) xSet.add(x);
        for (let x = fullMinX; x <= fullMaxX; x += 16) xSet.add(x);
        const candXs = Array.from(xSet);

        const minPocketY = Math.max(
          Math.ceil((metrics.topNavBottom || 64) + LOGICAL_H * s + 6),
          120
        );
        const maxPocketY = Math.max(minPocketY, gY - 12);
        /** @type {number[]} */
        const pocketYs = [];
        for (let y = maxPocketY; y >= minPocketY; y -= 24) {
          pocketYs.push(y);
        }
        if (!pocketYs.includes(minPocketY)) pocketYs.push(minPocketY);

        let pocketBest = {
          x: Math.max(fullMinX, Math.min(fullMaxX, preferX)),
          y: maxPocketY,
          score: Infinity,
          raw: Infinity,
          scale: s
        };
        for (const y of pocketYs) {
          for (const x of candXs) {
            if (
              opts.requireWalkableFrom &&
              !isWalkPathClear(opts.requireWalkableFrom.x, opts.requireWalkableFrom.y, x, y, s, vw, obstacles)
            ) {
              continue;
            }
            const bd = scoreSpotBreakdown(x, y, s, vw, obstacles, withBubble);
            const raw = bd.hard;
            const edgeBias = x < 72 || x > clientW - 72 ? 24 : 0;
            let clearanceBonus = 0;
            if (raw <= 0 && bd.headingArea <= 0) {
              const clearBelow45 =
                y + 45 <= gY && scoreSpot(x, y + 45, s, vw, obstacles, false) <= 0;
              const clearBelow90 =
                clearBelow45 && y + 90 <= gY && scoreSpot(x, y + 90, s, vw, obstacles, false) <= 0;
              const clearAbove30 =
                y - 30 >= minPocketY && scoreSpot(x, y - 30, s, vw, obstacles, false) <= 0;
              clearanceBonus =
                (clearBelow45 ? 140 : 0) + (clearBelow90 ? 140 : 0) + (clearAbove30 ? 80 : 0);
            }
            const pathHits = opts.preferClearPathFrom
              ? pathObstructionSteps(
                  opts.preferClearPathFrom.x,
                  opts.preferClearPathFrom.y,
                  x,
                  y,
                  s,
                  vw,
                  obstacles
                )
              : 0;
            const pathPenalty = pathHits * 260;
            let score =
              raw * 150 +
              bd.softCost +
              Math.abs(x - preferX) * distWeight +
              Math.abs(y - gY) * 0.6 +
              edgeBias +
              pathPenalty -
              clearanceBonus;
            if (Number.isFinite(opts.avoidX) && Math.abs(x - /** @type {number} */ (opts.avoidX)) < 130) {
              score += 6000;
            }
            if (score < pocketBest.score) {
              pocketBest = { x, y, score, raw, scale: s };
            }
          }
        }
        if (pocketBest.raw <= 0) {
          if (floorWinner && fromPt) {
            const pocketHits = pathObstructionSteps(
              fromPt.x,
              fromPt.y,
              pocketBest.x,
              pocketBest.y,
              pocketBest.scale,
              vw,
              obstacles
            );
            const floorHits = pathObstructionSteps(
              fromPt.x,
              fromPt.y,
              floorWinner.x,
              floorWinner.y,
              floorWinner.scale,
              vw,
              obstacles
            );
            if (floorHits < pocketHits || (floorHits === pocketHits && floorHits === 0)) {
              return floorWinner;
            }
          }
          return pocketBest;
        }
        if (
          pocketBest.raw < bestOverall.raw ||
          (pocketBest.raw === bestOverall.raw && pocketBest.score < bestOverall.score)
        ) {
          bestOverall = pocketBest;
        }
      }
    }

    return floorWinner || bestOverall;
  }

  /**
   * Okamžitě umístí Molly na nejlepší volné místo POUZE při prvotním načtení, změně stránky
   * nebo probuzení ze skrytého stavu (`is-docked`), nikdy uprostřed viditelné chůze či scrollu.
   */
  function snapMollyToFreeSpot() {
    if (typeof window === 'undefined' || currentState.mode !== 'roaming' || atHome) return;
    const { vw } = viewportSize();
    const spot = findBestSpot({ preferX: posX, withBubble: false });
    if (spot.raw > 0 && vw <= 1024) {
      crowdedPark = true;
      lastActorTransform = '';
      if (activeWhisper && bubbleW) {
        updateBubbleAnchorMode(posX, posY);
        evaluateDockWhisperFallback(posX, posY);
        lastBubbleTransform = '';
      }
      applyActorTransform();
      return;
    }
    const wasParked = crowdedPark;
    crowdedPark = false;
    if (vw > MOBILE_MAX_W && spot.scale) {
      targetDesktopScale = spot.scale;
      activeDesktopScale = spot.scale;
    }
    posX = spot.x;
    posY = spot.y;
    targetX = spot.x;
    targetY = spot.y;
    followTargetX = spot.x;
    followTargetY = spot.y;
    vx = 0;
    vy = 0;
    if (posX < vw * 0.25) facing = 1;
    else if (posX > vw * 0.75) facing = -1;
    lastActorTransform = '';
    if (activeWhisper && bubbleW) {
      updateBubbleAnchorMode(posX, posY);
      evaluateDockWhisperFallback(posX, posY);
      lastBubbleTransform = '';
    }
    applyActorTransform();
    if (wasParked) {
      ensureLoopRunning();
    }
  }

  /**
   * Když Molly (a případně bublina) po doscrollování nebo změně obsahu zakrývá tlačítko či text,
   * plynule popojde o pár kroků vedle po stejné podlahové linii `groundLine` — nikdy neteleportuje.
   * @param {boolean} withBubble
   * @returns {boolean} true, pokud se Molly vydala plynulou chůzí jinam
   */
  function relocateToFreeSpot(withBubble) {
    if (typeof window === 'undefined' || currentState.mode !== 'roaming' || atHome) return false;
    const { vw, vh } = viewportSize();
    const s = actorScale(vw);
    const obstacles = collectObstacles(vw, vh, false);
    const walking =
      behavior === 'WALK_ROAM' && Math.hypot(targetX - posX, targetY - posY) > 3 && !prefersReducedMotion();
    const baseX = walking ? targetX : posX;
    const baseY = walking ? targetY : posY;
    const gY = groundLine(vw, vh);
    const curOnFloor = Math.abs(baseY - gY) <= 18;
    const hereBd = !crowdedPark
      ? scoreSpotBreakdown(baseX, baseY, s, vw, obstacles, false)
      : { hard: Infinity, headingArea: Infinity, softTextRatio: 1, softCardRatio: 1, softCost: Infinity };

    const catSpot = findBestSpot({
      preferX: baseX,
      preferY: gY,
      withBubble: false,
      obstacles,
      nearbyBias: true,
      preferClearPathFrom: { x: baseX, y: baseY }
    });
    const bubbleSpot = withBubble
      ? findBestSpot({
          preferX: baseX,
          preferY: gY,
          withBubble: true,
          obstacles,
          nearbyBias: true,
          preferClearPathFrom: { x: baseX, y: baseY }
        })
      : catSpot;

    const canAutoPark = vw <= 1024;
    if (catSpot.raw > 0 && (canAutoPark || crowdedPark)) {
      crowdedPark = true;
      applyActorTransform();
      return false;
    }

    const catOnGround = catSpot.raw <= 0 && Math.abs(catSpot.y - gY) <= 18;
    const bubbleKeepsGround = !catOnGround || vw <= 1024 || Math.abs(bubbleSpot.y - gY) <= 18;
    const spot =
      withBubble &&
      bubbleKeepsGround &&
      scoreSpot(bubbleSpot.x, bubbleSpot.y, bubbleSpot.scale || s, vw, obstacles, false) <= 0
        ? bubbleSpot
        : catSpot;

    const wasParked = crowdedPark;
    crowdedPark = false;

    // Když byla Molly schovaná v pelíšku (`wasParked`), vyjde z klidného místa na podlaze
    if (wasParked) {
      if (vw > MOBILE_MAX_W && spot.scale) {
        targetDesktopScale = spot.scale;
        activeDesktopScale = spot.scale;
      }
      posX = spot.x;
      posY = spot.y;
      targetX = spot.x;
      targetY = spot.y;
      followTargetX = spot.x;
      followTargetY = spot.y;
      vx = 0;
      vy = 0;
      if (posX < vw * 0.25) facing = 1;
      else if (posX > vw * 0.75) facing = -1;
      lastActorTransform = '';
      applyActorTransform();
      ensureLoopRunning();
      return false;
    }

    const spotScale = vw > MOBILE_MAX_W && spot.scale ? spot.scale : s;
    const safeCw = ensureLayoutMetrics(vw, vh).clientW || vw;
    const halfDomWAtSpot = LOGICAL_W * 0.5 * spotScale;
    const minXAtSpot = Math.ceil(halfDomWAtSpot + 1.5);
    const maxXAtSpot = Math.max(minXAtSpot, Math.floor(safeCw - halfDomWAtSpot - 1.5));
    const fitsAtSpotScale = baseX >= minXAtSpot && baseX <= maxXAtSpot;
    const bdAtSpotScale =
      Math.abs(spotScale - s) > 0.004
        ? scoreSpotBreakdown(baseX, baseY, spotScale, vw, obstacles, false)
        : hereBd;

    // Pokud na současném místě nepřekrývá žádný ovládací prvek, nadpis ani výrazný text, v klidu zůstane
    const currentIsClean =
      hereBd.hard <= 0 &&
      hereBd.headingArea <= 0 &&
      hereBd.softTextRatio <= 0.18;
    const spotIsGround = Math.abs(spot.y - gY) <= 18;
    const pocketCanStay =
      !curOnFloor &&
      ((!spotIsGround && Math.abs(baseY - spot.y) <= 48) ||
        (spotIsGround && !isStraightPathClear(baseX, baseY, spot.x, spot.y, spotScale, vw, obstacles)));

    if (currentIsClean && (curOnFloor || pocketCanStay)) {
      if (
        vw > MOBILE_MAX_W &&
        spot.scale &&
        Math.abs(spot.scale - targetDesktopScale) > 0.004 &&
        fitsAtSpotScale &&
        bdAtSpotScale.hard <= 0 &&
        bdAtSpotScale.headingArea <= 0 &&
        bdAtSpotScale.softTextRatio <= 0.18
      ) {
        targetDesktopScale = spot.scale;
        ensureLoopRunning();
      }
      return walking;
    }
    if (
      fitsAtSpotScale &&
      spot.raw >= hereBd.hard &&
      hereBd.headingArea <= 0 &&
      Math.hypot(baseX - spot.x, baseY - spot.y) < 8
    ) {
      if (
        vw > MOBILE_MAX_W &&
        spot.scale &&
        Math.abs(spot.scale - targetDesktopScale) > 0.004 &&
        bdAtSpotScale.hard <= 0 &&
        bdAtSpotScale.headingArea <= 0
      ) {
        targetDesktopScale = spot.scale;
        ensureLoopRunning();
      }
      return walking;
    }

    if (vw > MOBILE_MAX_W && spot.scale && Math.abs(spot.scale - targetDesktopScale) > 0.004) {
      targetDesktopScale = spot.scale;
      ensureLoopRunning();
    }

    targetX = spot.x;
    targetY = spot.y;
    followTargetX = spot.x;
    followTargetY = spot.y;

    if (prefersReducedMotion()) {
      if (vw > MOBILE_MAX_W && spot.scale) {
        activeDesktopScale = spot.scale;
      }
      posX = targetX;
      posY = targetY;
      vx = 0;
      vy = 0;
      applyActorTransform();
      return false;
    }

    if (behavior !== 'WALK_ROAM' || Math.hypot(vx, vy) < 2) {
      walkCycle = 0;
    }
    stepAside = true;
    urgentStepAside = hereBd.hard > 0 || hereBd.headingArea > 0;
    behavior = 'WALK_ROAM';
    behaviorTimer = Math.max(4.5, Math.hypot(targetX - posX, targetY - posY) / 55 + 2.0);
    applyActorTransform();
    ensureLoopRunning();
    return true;
  }

  /** Molly došla na místo — teprve teď ukáže bublinu (s plným časem na přečtení). */
  function onArrived() {
    hurry = false;
    stepAside = false;
    urgentStepAside = false;
    if (walkArriveSafetyTimer) {
      clearTimeout(walkArriveSafetyTimer);
      walkArriveSafetyTimer = null;
    }
    if (bubbleTravelling || (bubbleEl && bubbleEl.classList.contains('is-travelling'))) {
      if (
        activeWhisper?.guide &&
        !activeWhisper?.fromDock &&
        currentState.mode === 'roaming' &&
        !atHome &&
        directControlOverlapAt(posX, posY) > 35
      ) {
        const { vw, vh } = viewportSize();
        const shouldDefer =
          vw <= MOBILE_MAX_W ||
          findBestWhisperRectWithCost(posX, posY, actorScale(vw), vw, vh).obsCost > 0;
        if (shouldDefer) {
          deferGuideWhisper(activeWhisper);
          return;
        }
      }
      bubbleTravelling = false;
      bubbleEl?.classList.remove('is-travelling');
      updateBubbleAnchorMode(posX, posY);
      evaluateDockWhisperFallback(posX, posY);
      lastBubbleTransform = '';
      if (activeWhisper && pendingWhisperMs > 0) {
        if (whisperHideTimer) clearTimeout(whisperHideTimer);
        whisperHideTimer = setTimeout(hideWhisperBubble, pendingWhisperMs);
      }
    }
  }

  function pickSafeTarget(avoidPointer = false) {
    if (typeof window === 'undefined') return;
    const { vw, vh } = viewportSize();
    const s = actorScale(vw);
    const obstacles = collectObstacles(vw, vh, false);
    const gY = groundLine(vw, vh);
    const { minX, maxX } = roamRange(vw);

    if (avoidPointer) {
      const escapeDir = posX >= pointerX ? 1 : -1;
      const escapePreferX = Math.max(minX, Math.min(maxX, posX + escapeDir * 150));
      const escapeSpot = findBestSpot({
        preferX: escapePreferX,
        preferY: gY,
        withBubble: Boolean(activeWhisper && bubbleW),
        avoidX: pointerX,
        obstacles,
        nearbyBias: true
      });
      if (escapeSpot.raw <= 0 && Math.abs(escapeSpot.x - posX) >= 12) {
        crowdedPark = false;
        if (vw > MOBILE_MAX_W && escapeSpot.scale) {
          targetDesktopScale = escapeSpot.scale;
        }
        targetX = escapeSpot.x;
        targetY = escapeSpot.y;
        if (behavior !== 'WALK_ROAM' || Math.hypot(vx, vy) < 2) {
          walkCycle = 0;
        }
        stepAside = true;
        behavior = 'WALK_ROAM';
        behaviorTimer = Math.max(3.2, Math.abs(targetX - posX) / 60 + 1.6);
        return;
      }
    }

    // Přirozený kočičí krok (65–195 px kolem současného místa; u úzkého pravého okraje jen klidné přešlápnutí)
    const inRightMargin = vw > 1024 && posX > maxX - 80;
    let dir = facing >= 0 ? 1 : -1;
    if (posX > maxX - 75) dir = -1;
    else if (posX < minX + 75) dir = 1;
    else if (Math.random() < 0.35) dir = -dir;
    const strollDist = inRightMargin ? 16 + Math.random() * 24 : 65 + Math.random() * 130;
    const preferX = Math.max(minX, Math.min(maxX, posX + dir * strollDist));

    const walkableSpot = findBestSpot({
      preferX,
      preferY: gY,
      withBubble: Boolean(activeWhisper && bubbleW),
      obstacles,
      nearbyBias: true,
      requireWalkableFrom: { x: posX, y: posY }
    });

    const walkableBd = scoreSpotBreakdown(walkableSpot.x, walkableSpot.y, walkableSpot.scale || s, vw, obstacles, false);
    if (
      walkableSpot.raw <= 0 &&
      walkableBd.headingArea <= 0 &&
      Math.hypot(walkableSpot.x - posX, walkableSpot.y - posY) >= 16
    ) {
      crowdedPark = false;
      if (vw > MOBILE_MAX_W && walkableSpot.scale) {
        targetDesktopScale = walkableSpot.scale;
      }
      targetX = walkableSpot.x;
      targetY = walkableSpot.y;
      if (behavior !== 'WALK_ROAM' || Math.hypot(vx, vy) < 2) {
        walkCycle = 0;
      }
      stepAside = false;
      behaviorTimer = Math.max(4.5, Math.abs(targetX - posX) / 42 + 2.0);
      return;
    }

    const stayBd = scoreSpotBreakdown(posX, posY, s, vw, obstacles, false);
    if (stayBd.hard <= 0 && stayBd.headingArea <= 0) {
      crowdedPark = false;
      targetX = posX;
      targetY = posY;
      behavior = Math.random() < 0.6 ? 'IDLE_SIT' : 'GROOM';
      behaviorTimer = 3.8 + Math.random() * 2.6;
      return;
    }

    relocateToFreeSpot(Boolean(activeWhisper && bubbleW));
  }

  function chooseNextBehavior() {
    // Sedí-li Molly na tlačítku či odkazu (obsah se mohl změnit bez scrollu), klidně poodejde
    if (relocateToFreeSpot(Boolean(activeWhisper && bubbleW))) {
      hurry = false;
      behavior = 'WALK_ROAM';
      return;
    }
    // Dokud člověk čte zprávu v bublině, Molly klidně sedí nebo se myje (neodchází pryč uprostřed věty)
    if (activeWhisper) {
      behavior = Math.random() < 0.7 ? 'IDLE_SIT' : 'GROOM';
      behaviorTimer = 2.8 + Math.random() * 1.8;
      return;
    }
    const roll = Math.random();
    if (roll < 0.34) {
      behavior = 'WALK_ROAM';
      behaviorTimer = 4.5 + Math.random() * 2.5;
      pickSafeTarget(false);
    } else if (roll < 0.68) {
      behavior = 'IDLE_SIT';
      behaviorTimer = 4.2 + Math.random() * 3.2;
    } else if (roll < 0.86) {
      behavior = 'GROOM';
      behaviorTimer = 3.0 + Math.random() * 2.2;
    } else {
      behavior = 'CHASE_FIREFLY';
      behaviorTimer = 3.4 + Math.random() * 2.0;
      const dir = Math.random() > 0.5 ? 1 : -1;
      firefly = {
        x: dir * (32 + Math.random() * 24),
        y: -30 - Math.random() * 18,
        vx: -dir * 0.35,
        vy: -0.15,
        phase: Math.random() * 6.28,
        alpha: 1
      };
    }
  }

  let resizeTimer = null;
  function handleWindowResize() {
    if (typeof window === 'undefined') return;
    invalidateLayoutCache();
    const { vw, vh } = viewportSize();
    isCompactDock.set(vw <= 1024);
    if (vw > MOBILE_MAX_W) {
      targetDesktopScale = baseActorScale(vw);
      if (crowdedPark || activeDesktopScale <= 0) {
        activeDesktopScale = targetDesktopScale;
      }
    }
    const { minX, maxX } = roamRange(vw);
    const gY = groundLine(vw, vh);
    const minFloorY =
      vw <= MOBILE_MAX_W
        ? gY
        : vw > 1024
          ? Math.max(96, layoutMetricsCache.topNavBottom || 96)
          : Math.max(96, gY - 6);
    const maxFloorY = vw <= MOBILE_MAX_W ? gY : Math.min(vh - 1, gY + 16);
    posX = Math.max(minX, Math.min(maxX, posX));
    targetX = Math.max(minX, Math.min(maxX, targetX));
    posY = Math.max(minFloorY, Math.min(maxFloorY, posY));
    targetY = Math.max(minFloorY, Math.min(maxFloorY, targetY));
    if (bubbleEl) {
      bubbleW = bubbleEl.offsetWidth;
      bubbleH = bubbleEl.offsetHeight;
    }
    lastBubbleTransform = '';
    applyActorTransform();
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      measureLayoutAndObstacles();
      if (bubbleEl) {
        bubbleW = bubbleEl.offsetWidth;
        bubbleH = bubbleEl.offsetHeight;
      }
      const vs = viewportSize();
      const range = roamRange(vs.vw);
      const floorY = groundLine(vs.vw, vs.vh);
      const minFY =
        vs.vw <= MOBILE_MAX_W
          ? floorY
          : vs.vw > 1024
            ? Math.max(96, layoutMetricsCache.topNavBottom || 96)
            : Math.max(96, floorY - 6);
      const maxFY = vs.vw <= MOBILE_MAX_W ? floorY : Math.min(vs.vh - 1, floorY + 16);
      posX = Math.max(range.minX, Math.min(range.maxX, posX));
      targetX = Math.max(range.minX, Math.min(range.maxX, targetX));
      posY = Math.max(minFY, Math.min(maxFY, posY));
      targetY = Math.max(minFY, Math.min(maxFY, targetY));
      lastBubbleTransform = '';
      if (currentState.mode === 'roaming' && !atHome) {
        relocateToFreeSpot(Boolean(activeWhisper && bubbleW));
      }
      if (activeWhisper && bubbleW) {
        updateBubbleAnchorMode(targetX, targetY);
        evaluateDockWhisperFallback(targetX, targetY);
      }
      applyActorTransform();
    }, 60);
  }

  /**
   * Zapíše polohu Molly (a bubliny) přímo do DOM mimo reaktivitu Svelte — dřív se `posX/posY`
   * měnily v šabloně každým snímkem a Svelte přepisoval celý `style` 60× za sekundu (sekání na mobilech).
   */
  function applyActorTransform() {
    if (!actorEl || typeof window === 'undefined') return;
    if (lastActorBehavior !== behavior) {
      lastActorBehavior = behavior;
      actorEl.dataset.mollyBehavior = behavior;
    }
    const vw = window.innerWidth || 1280;
    const s = actorScale(vw);
    const safeCw =
      layoutMetricsCache.vw === vw && layoutMetricsCache.clientW > 0
        ? layoutMetricsCache.clientW
        : vw;
    const halfDomW = LOGICAL_W * 0.5 * s;
    const minSafeX = Math.ceil(halfDomW + 1.5);
    const maxSafeX = Math.max(minSafeX, Math.floor(safeCw - halfDomW - 1.5));
    const drawX = Math.max(minSafeX, Math.min(maxSafeX, posX));
    const tf = `translate3d(${(drawX - LOGICAL_W * 0.5).toFixed(1)}px, ${(posY - LOGICAL_H).toFixed(1)}px, 0)${
      s !== 1 ? ` scale(${s.toFixed(3)})` : ''
    }`;
    if (tf !== lastActorTransform) {
      lastActorTransform = tf;
      actorEl.style.transform = tf;
    }
    if (bubbleEl && bubbleW) {
      const r = bubbleRectAt(posX, posY, s, vw);
      if (r) {
        const btf = `translate3d(${Math.round(r.l)}px, ${Math.round(r.t)}px, 0)`;
        if (btf !== lastBubbleTransform) {
          lastBubbleTransform = btf;
          bubbleEl.style.transform = btf;
        }
      }
    }
  }

  function applyTreatTransform() {
    if (!treatEl || !flyingTreat) return;
    const u = 1 - flyingTreat.p;
    const p = flyingTreat.p;
    const x = u * u * flyingTreat.x0 + 2 * u * p * flyingTreat.cx + p * p * flyingTreat.x1;
    const y = u * u * flyingTreat.y0 + 2 * u * p * flyingTreat.cy + p * p * flyingTreat.y1;
    const tf = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    if (tf !== lastTreatTransform) {
      lastTreatTransform = tf;
      treatEl.style.transform = tf;
    }
  }

  // Po doscrollování se pod Molly objeví jiný obsah -> během samotného scrollu sedí v klidu
  // a teprve po ustálení (debounce) případně plynule popojde o kousek vedle po podlaze.
  function handleWindowScroll() {
    lastInteractionTs = Date.now();
    scrolledOnCurrentRoute = true;
    if (currentState.mode !== 'roaming' || atHome) return;
    if (relocateTimer) clearTimeout(relocateTimer);
    relocateTimer = setTimeout(() => {
      relocateTimer = null;
      measureLayoutAndObstacles();
      const moving = relocateToFreeSpot(Boolean(activeWhisper && bubbleW));
      if (activeWhisper && bubbleW) {
        updateBubbleAnchorMode(targetX, targetY);
        evaluateDockWhisperFallback(targetX, targetY);
        lastBubbleTransform = '';
        applyActorTransform();
      }
      if (moving && Math.hypot(targetX - posX, targetY - posY) > 18 && bubbleEl && !activeWhisper?.fromDock) {
        bubbleTravelling = true;
        bubbleEl.classList.add('is-travelling');
        if (walkArriveSafetyTimer) clearTimeout(walkArriveSafetyTimer);
        walkArriveSafetyTimer = setTimeout(() => {
          walkArriveSafetyTimer = null;
          onArrived();
          applyActorTransform();
        }, 850);
      }
    }, 95);
  }

  function handleWindowPointerMove(e) {
    pointerX = e.clientX;
    pointerY = e.clientY;
    const now = performance.now();
    lastPointerMoveTs = now;
    if ($mollyState.followMouse && hasFinePointer && !prefersReducedMotion() && currentState.mode === 'roaming' && !atHome) {
      if (now - lastFollowCalcTs >= 42) {
        lastFollowCalcTs = now;
        const { vw, vh } = viewportSize();
        const obstacles = collectObstacles(vw, vh, false);
        const floorSpot = findBestSpot({
          preferX: pointerX,
          preferY: groundLine(vw, vh),
          obstacles,
          nearbyBias: true
        });
        if (floorSpot.raw <= 0) {
          crowdedPark = false;
          followTargetX = floorSpot.x;
          followTargetY = floorSpot.y;
        }
      }
      ensureLoopRunning();
    }

    // Když se kurzor blíží k tlačítku, u kterého Molly sedí, klidně uhne (s hysterezí bez kmitání)
    if (currentState.mode === 'roaming' && !atHome && !crowdedPark && e.pointerType !== 'touch') {
      const distToMolly = Math.hypot(pointerX - posX, pointerY - (posY - 24));
      if (
        distToMolly < 88 &&
        now - lastAvoidTriggerTs > 950 &&
        (behavior !== 'WALK_ROAM' || Math.abs(targetX - pointerX) < 110)
      ) {
        const el = e.target;
        if (
          el &&
          typeof el.closest === 'function' &&
          el.closest('button, a, input, select, textarea, [role="button"]') &&
          !el.closest('.molly-pelisek-dock')
        ) {
          lastAvoidTriggerTs = now;
          pickSafeTarget(true);
          ensureLoopRunning();
        }
      }
    }
  }

  function handleWindowPointerDown(e) {
    lastInteractionTs = Date.now();
    const el = e.target;
    if (el && typeof el.closest === 'function') {
      // Native clicks inside .molly-pelisek-dock / bubliny obsluhují jejich vlastní tlačítka
      if (el.closest('.molly-pelisek-dock, .molly-whisper-bubble')) {
        return;
      }
      // Never intercept clicks on any page interactive control or canvas stage
      if (
        el.closest(
          'button, a, input, select, textarea, label, summary, [role="button"], .sanctuary-viewport, canvas.impact-payoff-canvas'
        )
      ) {
        return;
      }
    }

    if (currentState.mode !== 'roaming' || atHome || crowdedPark) return;
    const s = actorScale(window.innerWidth || 1280);
    const dist = Math.hypot(e.clientX - posX, e.clientY - (posY - 24 * s));
    if (dist < 44) {
      triggerPetInteraction(false);
    }
  }

  let ensureLoopRunning = () => {};

  /** @param {boolean} [fromDock] - z pelíšku ukážeme zprávu okamžitě na volném místě */
  function triggerPetInteraction(fromDock = false) {
    // Uložený tip z pelíšku: člověk si o něj sám řekl, takže ho Molly teď ukáže okamžitě
    if (fromDock && pendingTip) {
      petBlissTimer = 2.6;
      behavior = 'PET_BLISS';
      behaviorTimer = 2.8;
      spawnHeartBurst(8);
      const tip = pendingTip;
      pendingTip = null;
      petMolly(tip.text, { fromDock: true, icon: normalizeMollyIcon(tip.icon, 'paw') });
    } else if ((currentState.availableTreats || 0) > 0) {
      feedMolly(fromDock ? 'dock' : 'companion', { fromDock });
    } else {
      petBlissTimer = 2.6;
      behavior = 'PET_BLISS';
      behaviorTimer = 2.8;
      spawnHeartBurst(8);
      const isCompact = typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX_W;
      petMolly(
        undefined,
        fromDock ? { fromDock: true, suffix: isCompact ? '' : nextGiftText } : {}
      );
    }
    ensureLoopRunning();
  }

  let handleVisibilityChange = null;
  let compactDockMql = null;
  let onCompactDockChange = null;
  let pointerFineMql = null;
  let onPointerFineChange = null;
  let settleTimer1 = null;
  let settleTimer2 = null;
  let layoutChangeTimer = null;
  let postAnimationTimer = null;
  let mainResizeObserver = null;

  function schedulePostAnimationRemeasure(delayMs = 320) {
    if (postAnimationTimer) clearTimeout(postAnimationTimer);
    postAnimationTimer = setTimeout(() => {
      postAnimationTimer = null;
      if (!mounted || atHome) return;
      measureLayoutAndObstacles();
      if (bubbleEl) {
        bubbleW = bubbleEl.offsetWidth;
        bubbleH = bubbleEl.offsetHeight;
      }
      if (currentState.mode === 'roaming') {
        relocateToFreeSpot(Boolean(activeWhisper && bubbleW));
      }
      if (activeWhisper && bubbleW) {
        updateBubbleAnchorMode(targetX, targetY);
        evaluateDockWhisperFallback(targetX, targetY);
        lastBubbleTransform = '';
        applyActorTransform();
      }
    }, delayMs);
  }

  // ===================== Molly jako průvodkyně (směrování) =====================
  // 1) Při prvním příchodu na stránku (1× za session) pošeptá, co se tu dá udělat.
  // 2) Když člověk ~16 s nic nedělá, dojde k hlavnímu tlačítku (`[data-molly-guide]`),
  //    jemně ho rozzáří a nabídne ho. Max. 1× na stránku za session, nikdy v pelíšku.
  const HINTS_KEY = AA_MOLLY_HINTS_KEY;
  const NUDGES_KEY = AA_MOLLY_NUDGES_KEY;
  const NUDGE_IDLE_MS = 16000;
  let lastInteractionTs = Date.now();
  let currentPath = '';
  let hintTimer = null;
  let nudgeTimer = null;
  let glowTimer = null;
  let glowEl = null;
  let unsubPage = null;

  function readSessionList(key) {
    try {
      const raw = safeGetItem(key, 'session');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function markSessionList(key, value) {
    const list = readSessionList(key);
    if (!list.includes(value)) {
      list.push(value);
      safeSetItem(key, JSON.stringify(list.slice(-20)), 'session');
    }
  }

  function resolveGuide(path) {
    if (MOLLY_ROUTE_GUIDES[path]) return MOLLY_ROUTE_GUIDES[path];
    const trimmed = path.replace(/\/+$/, '') || '/';
    return MOLLY_ROUTE_GUIDES[trimmed] || null;
  }

  function isAnyModalOpen() {
    return Boolean(document.querySelector('[aria-modal="true"], dialog[open]'));
  }

  function whisperRecentlyShown(ms) {
    return Boolean(activeWhisper && Date.now() - (activeWhisper.ts || 0) < ms);
  }

  function scheduleRouteHint(path) {
    if (hintTimer) clearTimeout(hintTimer);
    const guide = resolveGuide(path);
    if (!guide) return;
    if (readSessionList(HINTS_KEY).includes(path)) return;
    hintTimer = setTimeout(() => {
      hintTimer = null;
      if (path !== currentPath || document.hidden) return;
      // V pelíšku Molly spí — nevyrušujeme. Nepřebíjíme čerstvou zprávu (krmení, pohlazení).
      if (currentState.mode !== 'roaming' || whisperRecentlyShown(3000) || isAnyModalOpen()) {
        return;
      }
      const isFirstHintOfSession = readSessionList(HINTS_KEY).length === 0;
      const text = isFirstHintOfSession ? `${getMollyGreeting()} ${guide.hint}` : guide.hint;
      mollyWhisper(text, guide.icon, { guide: true, routePath: path });
    }, 1700);
  }

  function findGuideTarget() {
    const vh = window.innerHeight || 800;
    const candidates = document.querySelectorAll('[data-molly-guide]');
    for (const el of candidates) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.top > 72 && r.bottom < vh - 24) {
        return { el, rect: r };
      }
    }
    return null;
  }

  function clearGuideGlow() {
    if (glowTimer) clearTimeout(glowTimer);
    glowTimer = null;
    glowEl?.classList?.remove('molly-guide-glow');
    glowEl = null;
  }

  function scheduleIdleNudge() {
    if (nudgeTimer) clearTimeout(nudgeTimer);
    const path = currentPath;
    const guide = resolveGuide(path);
    if (!guide || readSessionList(NUDGES_KEY).includes(path)) return;

    const check = () => {
      nudgeTimer = null;
      if (path !== currentPath) return;
      const idleFor = Date.now() - lastInteractionTs;
      if (idleFor < NUDGE_IDLE_MS) {
        nudgeTimer = setTimeout(check, NUDGE_IDLE_MS - idleFor + 50);
        return;
      }
      if (
        document.hidden ||
        currentState.mode !== 'roaming' ||
        pendingTip ||
        activeWhisper ||
        whisperRecentlyShown(2500) ||
        flyingTreat ||
        isAnyModalOpen()
      ) {
        nudgeTimer = setTimeout(check, 6000);
        return;
      }
      const found = findGuideTarget();
      if (!found) {
        // Hlavní krok není zrovna na obrazovce — zkusíme to po další chvilce klidu (bez scrollování za uživatele)
        lastInteractionTs = Date.now();
        nudgeTimer = setTimeout(check, NUDGE_IDLE_MS);
        return;
      }
      markSessionList(NUDGES_KEY, path);
      guideMollyTo(found.el, found.rect, guide);
    };

    nudgeTimer = setTimeout(check, NUDGE_IDLE_MS);
  }

  function guideMollyTo(el, rect, guide) {
    const ctaCx = rect.left + rect.width * 0.5;
    const ctaCy = rect.top + rect.height * 0.5;
    const { vw } = viewportSize();

    // Molly dojde po spodní „chodníkové“ linii co nejblíž pod tlačítko, ale jen na místo,
    // kde nic nezakrývá. Tlačítko jemně rozzáří.
    const spot = findBestSpot({ preferX: ctaCx, withBubble: false });
    if (spot.raw > 0 && vw <= 1024) {
      crowdedPark = true;
      behavior = 'IDLE_SIT';
      applyActorTransform();
      return;
    }
    const wasParked = crowdedPark;
    crowdedPark = false;
    if (vw > MOBILE_MAX_W && spot.scale) {
      targetDesktopScale = spot.scale;
    }
    targetX = spot.x;
    targetY = spot.y;
    followTargetX = spot.x;
    followTargetY = spot.y;

    // Oči a natočení k tlačítku
    pointerX = ctaCx;
    pointerY = ctaCy;
    if (prefersReducedMotion() || wasParked) {
      posX = targetX;
      posY = targetY;
      vx = 0;
      vy = 0;
      applyActorTransform();
    } else {
      if (behavior !== 'WALK_ROAM' || Math.hypot(vx, vy) < 2) {
        walkCycle = 0;
      }
      behavior = 'WALK_ROAM';
      behaviorTimer = Math.max(5.5, Math.hypot(targetX - posX, targetY - posY) / 50 + 2.0);
      hurry = true;
      stepAside = true;
    }
    if (Math.abs(ctaCx - targetX) > 12) {
      facing = ctaCx >= targetX ? 1 : -1;
    }
    spawnHeartBurst(4);
    ensureLoopRunning();

    clearGuideGlow();
    glowEl = el;
    el.classList.add('molly-guide-glow');
    glowTimer = setTimeout(clearGuideGlow, 5200);

    mollyWhisper(guide.nudge, guide.icon, { guide: true });
  }

  function onUserActivity() {
    lastInteractionTs = Date.now();
  }

  function settleInitialPlacementIfNeeded() {
    if (!mounted || atHome || typeof window === 'undefined') return;
    measureLayoutAndObstacles();
    if (scrolledOnCurrentRoute || window.scrollY > 2) {
      relocateToFreeSpot(Boolean(activeWhisper && bubbleW));
      return;
    }
    const { vw, vh } = viewportSize();
    const s = actorScale(vw);
    const curBd = !crowdedPark
      ? scoreSpotBreakdown(posX, posY, s, vw, collectObstacles(vw, vh, false), false)
      : { hard: Infinity, headingArea: Infinity };
    if (crowdedPark || curBd.hard > 0 || curBd.headingArea > 0) {
      snapMollyToFreeSpot();
    }
  }

  function scheduleLayoutSettleSnap() {
    if (settleTimer1) clearTimeout(settleTimer1);
    if (settleTimer2) clearTimeout(settleTimer2);
    settleTimer1 = setTimeout(() => {
      settleTimer1 = null;
      settleInitialPlacementIfNeeded();
    }, 110);
    settleTimer2 = setTimeout(() => {
      settleTimer2 = null;
      settleInitialPlacementIfNeeded();
    }, 310);
  }

  function handleRouteChange(path) {
    if (!path || path === currentPath) return;
    currentPath = path;
    scrolledOnCurrentRoute = false;
    lastInteractionTs = Date.now();
    clearGuideGlow();
    // Tip patřil předchozí stránce
    clearDeferredGuide();
    pendingTip = null;
    const pathAtHome = path === '/svet' || path.startsWith('/svet/');
    if (!pathAtHome && typeof window !== 'undefined') {
      setTimeout(() => {
        measureLayoutAndObstacles();
        snapMollyToFreeSpot();
        scheduleLayoutSettleSnap();
        ensureLoopRunning();
      }, 50);
    }
    scheduleRouteHint(path);
    scheduleIdleNudge();
  }

  onMount(() => {
    mounted = true;
    scrolledOnCurrentRoute = false;
    measureLayoutAndObstacles();
    const { vw, vh } = viewportSize();
    if (vw > MOBILE_MAX_W) {
      activeDesktopScale = baseActorScale(vw);
      targetDesktopScale = activeDesktopScale;
    }
    const range = roamRange(vw);
    const cw = clientViewportWidth(vw);
    const defaultDesktopX = Math.round(cw - 28);
    posX =
      vw <= MOBILE_MAX_W
        ? Math.max(range.minX, Math.min(range.maxX, vw * 0.3))
        : Math.max(range.minX, Math.min(range.maxX, defaultDesktopX));
    posY = groundLine(vw, vh);
    targetX = posX;
    targetY = posY;
    followTargetX = posX;
    followTargetY = posY;
    snapMollyToFreeSpot();
    scheduleLayoutSettleSnap();
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        settleInitialPlacementIfNeeded();
      });
    }

    let lastTime = performance.now();
    const reduced = prefersReducedMotion();

    const renderCatFrame = (nowSec) => {
      if (!catCanvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(LOGICAL_W * dpr);
      const targetH = Math.round(LOGICAL_H * dpr);
      if (catCanvas.width !== targetW || catCanvas.height !== targetH) {
        catCanvas.width = targetW;
        catCanvas.height = targetH;
        catCtx = null;
      }
      if (!catCtx) catCtx = catCanvas.getContext('2d');
      if (catCtx) {
        catCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderProceduralMollyCat(catCtx, LOGICAL_W, LOGICAL_H, nowSec, {
          vx,
          vy,
          behavior,
          eatTimer,
          petBlissTimer,
          currentState,
          facing,
          walkCycle,
          flyingTreat,
          groomPhase,
          accessories,
          pointerX,
          pointerY,
          posX,
          posY,
          blinkProgress,
          firefly,
          hearts,
          frameK,
          isFollowingMouse: Boolean($mollyState?.followMouse && hasFinePointer && !prefersReducedMotion())
        });
      }
    };

    const tick = (now) => {
      if (typeof document !== 'undefined' && document.hidden) {
        rafId = 0;
        return;
      }
      const rawDtMs = now - lastTime;
      const dt = Math.min(0.06, Math.max(0.008, rawDtMs * 0.001));
      lastTime = now;
      frameK = frameStep(rawDtMs);
      const nowSec = now * 0.001;

      if (eatTimer > 0) eatTimer = Math.max(0, eatTimer - dt);
      if (petBlissTimer > 0) petBlissTimer = Math.max(0, petBlissTimer - dt);

      // Natural eye blink every 3.2 - 5.2s
      blinkTimer -= dt;
      if (blinkTimer <= 0) {
        blinkProgress = Math.min(1, blinkProgress + dt * 9);
        if (blinkProgress >= 1) {
          blinkTimer = 3.2 + Math.random() * 2.2;
          blinkProgress = 0;
        }
      }

      // Flying treat arc update
      if (flyingTreat) {
        flyingTreat.p = Math.min(
          1,
          flyingTreat.p + dt * (reduced ? 3.5 : 1.85)
        );
        // Molly mezitím mohla popojít na volné místo — dobrota letí za ní
        if (flyingTreat.follow) {
          flyingTreat.x1 = posX;
          flyingTreat.y1 = posY - 22;
        }
        applyTreatTransform();
        if (flyingTreat.p >= 1) {
          eatTimer = 1.4;
          spawnHeartBurst(6);
          flyingTreat = null;
          flyingTreatView = null;
        }
      }

      // Roaming physics
      let isWalkingNow = false;
      let isScalingNow = false;
      if (
        typeof window !== 'undefined' &&
        (window.innerWidth || 1280) > MOBILE_MAX_W &&
        targetDesktopScale > 0 &&
        activeDesktopScale > 0 &&
        Math.abs(targetDesktopScale - activeDesktopScale) > 0.002
      ) {
        activeDesktopScale += (targetDesktopScale - activeDesktopScale) * Math.min(1, dt * 5.5);
        if (Math.abs(targetDesktopScale - activeDesktopScale) <= 0.002) {
          activeDesktopScale = targetDesktopScale;
        } else {
          isScalingNow = true;
        }
      }
      // Chůzi na volné místo přerušilo pohlazení / krmení -> bublinu ukážeme hned
      if (hurry && behavior !== 'WALK_ROAM') onArrived();
      if (currentState.mode === 'roaming' && !reduced && !atHome && !crowdedPark) {
        behaviorTimer -= dt;
        if (behaviorTimer <= 0 && !hurry) {
          if (behavior === 'WALK_ROAM' && Math.hypot(targetX - posX, targetY - posY) > 3) {
            targetX = posX;
            targetY = posY;
            stepAside = false;
            behavior = 'IDLE_SIT';
            behaviorTimer = 4.0 + Math.random() * 2.5;
            onArrived();
          } else {
            chooseNextBehavior();
          }
        }

        if ($mollyState.followMouse && hasFinePointer && behavior !== 'CATCH_TREAT' && behavior !== 'PET_BLISS' && !activeWhisper) {
          // Optional Mouse-Follow Mode (R2): gentle spring physics along floor, sitting after 3s idle
          const pointerIdle = now - lastPointerMoveTs > 3000;
          if (pointerIdle) {
            vx *= 0.82;
            vy *= 0.82;
            if (Math.hypot(vx, vy) < 1.5) {
              vx = 0;
              vy = 0;
              behavior = 'IDLE_SIT';
            }
          } else {
            targetX = followTargetX;
            targetY = followTargetY;
            const dx = targetX - posX;
            const dy = targetY - posY;
            const dist = Math.hypot(dx, dy);

            if (dist > 16) {
              if (behavior !== 'WALK_ROAM' && Math.hypot(vx, vy) < 2) {
                walkCycle = 0;
              }
              isWalkingNow = true;
              const desiredVx = (dx / dist) * Math.min(185, dist * 3.0);
              const desiredVy = (dy / dist) * Math.min(48, Math.abs(dy) * 4.0);
              vx += (desiredVx - vx) * Math.min(1, dt * 7.5);
              vy += (desiredVy - vy) * Math.min(1, dt * 7.5);
              posX += vx * dt;
              posY += vy * dt;
              if (Math.abs(dx) > 10 && Math.abs(vx) > 6 && dx * facing < 0) {
                facing = dx >= 0 ? 1 : -1;
              }
              walkCycle += dt * Math.max(2.2, Math.min(11.0, Math.hypot(vx, vy) * 0.095));
              behavior = 'WALK_ROAM';
            } else {
              vx *= 0.76;
              vy *= 0.76;
              if (Math.hypot(vx, vy) < 1.5) {
                vx = 0;
                vy = 0;
                behavior = 'IDLE_SIT';
              }
            }
          }
        } else if (behavior === 'WALK_ROAM') {
          const dx = targetX - posX;
          const dy = targetY - posY;
          const dist = Math.hypot(dx, dy);
          if (dist > 2.5 && !(dist <= 5 && Math.hypot(vx, vy) < 10)) {
            isWalkingNow = true;
            const brisk = stepAside || hurry;
            const maxSpd = urgentStepAside ? 380 : brisk ? 240 : 94;
            const accel = urgentStepAside ? 16.0 : brisk ? 11.0 : 6.8;
            const arrivalSpd = Math.min(maxSpd, dist * (urgentStepAside ? 5.5 : brisk ? 4.2 : 2.6));
            const desiredVx = (dx / dist) * arrivalSpd;
            const maxVy = urgentStepAside ? 135 : brisk ? 115 : 80;
            const desiredVy =
              Math.abs(dy) < 0.5
                ? 0
                : Math.sign(dy) * Math.min(maxVy, Math.max(Math.abs((dy / dist) * arrivalSpd), Math.abs(dy) * 4.5));
            vx += (desiredVx - vx) * Math.min(1, dt * accel);
            vy += (desiredVy - vy) * Math.min(1, dt * accel);
            posX += vx * dt;
            posY += vy * dt;
            if (Math.abs(dx) > 10 && Math.abs(vx) > 6 && dx * facing < 0) {
              facing = dx >= 0 ? 1 : -1;
            }
            walkCycle += dt * Math.max(2.2, Math.min(11.5, Math.hypot(vx, vy) * 0.095));
          } else {
            posX = targetX;
            posY = targetY;
            vx = 0;
            vy = 0;
            behavior = 'IDLE_SIT';
            behaviorTimer = 4.2 + Math.random() * 2.8;
            onArrived();
          }
        } else {
          vx *= 0.82;
          vy *= 0.82;
          if (Math.hypot(vx, vy) < 0.8) {
            vx = 0;
            vy = 0;
          }
          if (behavior === 'GROOM') {
            groomPhase += dt;
          }
          if (behavior === 'CHASE_FIREFLY' && firefly) {
            firefly.x += firefly.vx * frameK;
            firefly.y += Math.sin(nowSec * 4) * 0.35 * frameK;
          } else {
            firefly = null;
          }
        }
      }

      if (typeof window !== 'undefined') {
        const curVw = window.innerWidth || 1280;
        const effScale =
          curVw <= MOBILE_MAX_W
            ? 0.72
            : activeDesktopScale > 0
              ? activeDesktopScale
              : baseActorScale(curVw);
        const safeCw =
          layoutMetricsCache.vw === curVw && layoutMetricsCache.clientW > 0
            ? layoutMetricsCache.clientW
            : curVw;
        const halfDomW = LOGICAL_W * 0.5 * effScale;
        const minSafeX = Math.ceil(halfDomW + 1.5);
        const maxSafeX = Math.max(minSafeX, Math.floor(safeCw - halfDomW - 1.5));
        if (posX < minSafeX) posX = minSafeX;
        else if (posX > maxSafeX) posX = maxSafeX;
      }

      applyActorTransform();

      const hasActiveTransient =
        isScalingNow ||
        Boolean(flyingTreat) ||
        eatTimer > 0 ||
        petBlissTimer > 0 ||
        hearts.length > 0;

      // Úspora baterie: když Molly jen sedí/myje se, stačí ~30 fps (pomalé sinusové pohyby
      // vypadají stejně). Chůze, krmení a srdíčka běží na plnou obnovovací frekvenci.
      const canThrottle = !isWalkingNow && !hasActiveTransient && !firefly;
      if (!canThrottle || now - lastRenderTs >= 31) {
        lastRenderTs = now;
        renderCatFrame(nowSec);
      }

      // H4: Pause RAF loop when docked / parked / u jezera (/svet) / reduced-motion with no active transient animation
      if ((currentState.mode === 'docked' || reduced || atHome || crowdedPark) && !hasActiveTransient) {
        rafId = 0;
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    ensureLoopRunning = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (!rafId) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    /** @type {number | null} */
    let prevAvailableTreats = null;
    unsubState = mollyState.subscribe((val) => {
      currentState = val;
      accessories = getMollyAccessories(val.giftDeeds);
      const nextTreats = Number(val.availableTreats) || 0;
      const treatsIncreased =
        prevAvailableTreats !== null && nextTreats > prevAvailableTreats;
      prevAvailableTreats = nextTreats;
      // Porovnáváme s naposledy ukázanou zprávou (ne s aktivní bublinou) — jinak by každá
      // jiná změna stavu (např. nálada při dýchání) znovu vytáhla už skrytou starou zprávu.
      if (val.whisper && val.whisper.ts !== lastSeenWhisperTs) {
        lastSeenWhisperTs = val.whisper.ts;
        if (!val.whisper.guide) {
          clearDeferredGuide();
        }
        // Nový dárek si zaslouží delší chvilku na přečtení
        showWhisperBubble(val.whisper, val.whisper.milestone ? 6000 : 4200);
        if (val.whisper.milestone) spawnHeartBurst(10);
      }
      if (treatsIncreased && mounted && !atHome && val.mode === 'roaming') {
        svelteTick().then(() => {
          if (!mounted || atHome || currentState.mode !== 'roaming') return;
          measureLayoutAndObstacles();
          relocateToFreeSpot(Boolean(activeWhisper && bubbleW));
          if (activeWhisper && bubbleW) {
            updateBubbleAnchorMode(targetX, targetY);
            evaluateDockWhisperFallback(targetX, targetY);
            lastBubbleTransform = '';
            applyActorTransform();
          }
        });
        schedulePostAnimationRemeasure(320);
      }
      if (val.mode === 'docked') clearGuideGlow();
      ensureLoopRunning();
    });

    unsubEvents = mollyEvents.subscribe((ev) => {
      if (!ev) return;
      if (ev.type === 'feed') {
        launchViewportTreatToMolly(ev.treat);
      } else if (ev.type === 'spark') {
        launchViewportTreatToMolly(ev.treat);
      } else if (ev.type === 'pet') {
        petBlissTimer = 2.6;
        spawnHeartBurst(7);
      } else if (ev.type === 'wake') {
        measureLayoutAndObstacles();
        const curVw = window.innerWidth || 1280;
        const d = dockRect();
        const wakePreferX = d && d.left < curVw * 0.35 ? d.right + 64 : posX;
        const spot = findBestSpot({ preferX: wakePreferX, withBubble: false, nearbyBias: true });
        if (spot.raw > 0 && curVw <= 1024) {
          crowdedPark = true;
          behavior = 'IDLE_SIT';
          applyActorTransform();
          spawnHeartBurst(5);
          return;
        }
        crowdedPark = false;
        if (curVw > MOBILE_MAX_W && spot.scale) {
          targetDesktopScale = spot.scale;
          activeDesktopScale = spot.scale;
        }
        posX = spot.x;
        posY = spot.y;
        targetX = spot.x;
        targetY = spot.y;
        followTargetX = spot.x;
        followTargetY = spot.y;
        vx = 0;
        vy = 0;
        walkCycle = 0;
        if (posX < curVw * 0.25) facing = 1;
        else if (posX > curVw * 0.75) facing = -1;
        behavior = 'WALK_ROAM';
        behaviorTimer = 3.8;
        pickSafeTarget(false);
        applyActorTransform();
        spawnHeartBurst(5);
      }
      ensureLoopRunning();
    });

    if (typeof window !== 'undefined' && window.matchMedia) {
      compactDockMql = window.matchMedia('(max-width: 1024px)');
      isCompactDock.set(compactDockMql.matches);
      onCompactDockChange = (ev) => {
        isCompactDock.set(ev.matches);
        svelteTick().then(() => {
          if (!mounted) return;
          measureLayoutAndObstacles();
          if (bubbleEl) {
            bubbleW = bubbleEl.offsetWidth;
            bubbleH = bubbleEl.offsetHeight;
          }
          const vs = viewportSize();
          const range = roamRange(vs.vw);
          const floorY = groundLine(vs.vw, vs.vh);
          posX = Math.max(range.minX, Math.min(range.maxX, posX));
          targetX = Math.max(range.minX, Math.min(range.maxX, targetX));
          posY = floorY;
          targetY = floorY;
          lastBubbleTransform = '';
          if (currentState.mode === 'roaming' && !atHome) {
            relocateToFreeSpot(Boolean(activeWhisper && bubbleW));
          }
          if (activeWhisper && bubbleW) {
            updateBubbleAnchorMode(targetX, targetY);
            evaluateDockWhisperFallback(targetX, targetY);
          }
          applyActorTransform();
        });
      };
      if (typeof compactDockMql.addEventListener === 'function') {
        compactDockMql.addEventListener('change', onCompactDockChange);
      } else if (typeof compactDockMql.addListener === 'function') {
        compactDockMql.addListener(onCompactDockChange);
      }

      pointerFineMql = window.matchMedia('(pointer: fine)');
      hasFinePointer = pointerFineMql.matches;
      onPointerFineChange = (ev) => {
        hasFinePointer = ev.matches;
      };
      if (typeof pointerFineMql.addEventListener === 'function') {
        pointerFineMql.addEventListener('change', onPointerFineChange);
      } else if (typeof pointerFineMql.addListener === 'function') {
        pointerFineMql.addListener(onPointerFineChange);
      }
    }

    handleRouteChange(page.url.pathname || '/');

    window.addEventListener('pointermove', handleWindowPointerMove, {
      passive: true
    });
    window.addEventListener('pointerdown', handleWindowPointerDown, {
      passive: true
    });
    window.addEventListener('resize', handleWindowResize, {
      passive: true
    });
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('keydown', onUserActivity, { passive: true });
    window.addEventListener('wheel', onUserActivity, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      const mainEl = document.querySelector('main') || document.body;
      if (mainEl) {
        let prevMainH = mainEl.getBoundingClientRect().height;
        mainResizeObserver = new ResizeObserver((entries) => {
          const h = entries[0]?.contentRect?.height ?? 0;
          if (Math.abs(h - prevMainH) > 2) {
            prevMainH = h;
            if (atHome || (currentState.mode !== 'roaming' && !activeWhisper)) return;
            if (layoutChangeTimer) clearTimeout(layoutChangeTimer);
            layoutChangeTimer = setTimeout(() => {
              layoutChangeTimer = null;
              if (!mounted || atHome) return;
              measureLayoutAndObstacles();
              if (bubbleEl) {
                bubbleW = bubbleEl.offsetWidth;
                bubbleH = bubbleEl.offsetHeight;
              }
              if (currentState.mode === 'roaming') {
                relocateToFreeSpot(Boolean(activeWhisper && bubbleW));
              }
              if (activeWhisper && bubbleW) {
                updateBubbleAnchorMode(targetX, targetY);
                evaluateDockWhisperFallback(targetX, targetY);
                lastBubbleTransform = '';
                applyActorTransform();
              }
            }, 25);
            schedulePostAnimationRemeasure(320);
          }
        });
        mainResizeObserver.observe(mainEl);
      }
    }

    handleVisibilityChange = () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else {
        ensureLoopRunning();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    applyActorTransform();
    renderCatFrame(performance.now() * 0.001);
    ensureLoopRunning();
  });

  onDestroy(() => {
    mounted = false;
    if (rafId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(rafId);
    }
    if (whisperHideTimer) clearTimeout(whisperHideTimer);
    if (walkArriveSafetyTimer) clearTimeout(walkArriveSafetyTimer);
    if (relocateTimer) clearTimeout(relocateTimer);
    if (hintTimer) clearTimeout(hintTimer);
    if (nudgeTimer) clearTimeout(nudgeTimer);
    if (deferTimer) clearTimeout(deferTimer);
    if (settleTimer1) clearTimeout(settleTimer1);
    if (settleTimer2) clearTimeout(settleTimer2);
    if (layoutChangeTimer) clearTimeout(layoutChangeTimer);
    if (postAnimationTimer) clearTimeout(postAnimationTimer);
    postAnimationTimer = null;
    if (resizeTimer) clearTimeout(resizeTimer);
    mainResizeObserver?.disconnect();
    mainResizeObserver = null;
    if (typeof document !== 'undefined') clearGuideGlow();
    unsubEvents?.();
    unsubState?.();
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerdown', handleWindowPointerDown);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('keydown', onUserActivity);
      window.removeEventListener('wheel', onUserActivity);
    }
    if (typeof document !== 'undefined' && handleVisibilityChange) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
    if (compactDockMql && onCompactDockChange) {
      if (typeof compactDockMql.removeEventListener === 'function') {
        compactDockMql.removeEventListener('change', onCompactDockChange);
      } else if (typeof compactDockMql.removeListener === 'function') {
        compactDockMql.removeListener(onCompactDockChange);
      }
    }
    if (pointerFineMql && onPointerFineChange) {
      if (typeof pointerFineMql.removeEventListener === 'function') {
        pointerFineMql.removeEventListener('change', onPointerFineChange);
      } else if (typeof pointerFineMql.removeListener === 'function') {
        pointerFineMql.removeListener(onPointerFineChange);
      }
    }
  });

  $effect(() => {
    const p = page.url.pathname || '/';
    if (mounted) {
      handleRouteChange(p);
    }
  });

  const nextGiftText = $derived(describeNextMollyGift($mollyState.giftDeeds));
  const roamingWhisper = $derived(
    activeWhisper &&
      !forceDockWhisper &&
      !compactInflowWhisper &&
      ($isCompactDock || ($mollyState.mode === 'roaming' && !atHome && !crowdedPark))
  );

  $effect(() => {
    mollyDockBridge.set({
      pendingTip,
      activeWhisper,
      hasFinePointer,
      atHome,
      isParked: crowdedPark,
      forceDockWhisper,
      compactInflowWhisper,
      onPet: () => triggerPetInteraction(true)
    });
  });
</script>

<div
  class="molly-companion-layer"
  data-molly-mode={$mollyState.mode}
  data-molly-mood={$mollyState.mood}
  data-molly-treats={$mollyState.treatsFedTotal}
  data-molly-available-treats={$mollyState.availableTreats}
  data-molly-gift-deeds={$mollyState.giftDeeds || 0}
  data-molly-home={atHome ? 'lake' : undefined}
>
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {activeWhisper ? activeWhisper.text : ''}
  </div>
  <!-- Letící dobrota přes obrazovku přímo k Molly (poloha se zapisuje přímo v rAF smyčce) -->
  {#if flyingTreatView}
    <div
      bind:this={treatEl}
      class="molly-flying-treat"
      style="--treat-color: {flyingTreatView.color}; transform: translate3d({flyingTreatView.x0}px, {flyingTreatView.y0}px, 0);"
      aria-hidden="true"
    >
      <span class="treat-icon-wrap">
        <AppIcon name={normalizeMollyIcon(flyingTreatView.icon, 'fish')} size={15} strokeWidth={2} />
      </span>
    </div>
  {/if}

  <!-- Šeptanda: samostatná vrstva (nezmenšuje se s kočkou), polohu zapisuje mimo rAF -->
  {#if roamingWhisper}
    <div
      bind:this={bubbleEl}
      class="molly-whisper-bubble"
      class:is-travelling={bubbleTravelling}
      role="status"
    >
      <span class="molly-whisper-inner">
        <span class="whisper-icon" aria-hidden="true">
          <AppIcon name={normalizeMollyIcon(activeWhisper.icon, 'paw')} size={14} strokeWidth={2} />
        </span>
        <span class="whisper-text">{activeWhisper.text}</span>
      </span>
    </div>
  {/if}

  <!-- Volně se toulající želvovinová kočka Molly (pointer-events: none, nikdy neblokuje kliknutí) -->
  <div
    bind:this={actorEl}
    class="molly-roaming-actor"
    class:is-docked={$mollyState.mode === 'docked' || atHome || crowdedPark}
    aria-hidden="true"
  >
    <canvas
      bind:this={catCanvas}
      class="molly-cat-canvas"
      width={LOGICAL_W}
      height={LOGICAL_H}
    ></canvas>
  </div>

  {#if !$isCompactDock}
    <MollyDock variant="floating" />
  {/if}
</div>

<style>
  .molly-companion-layer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 940;
    overflow: hidden;
  }

  .molly-roaming-actor {
    position: fixed;
    top: 0;
    left: 0;
    width: 94px;
    height: 80px;
    pointer-events: none;
    user-select: none;
    will-change: transform;
    transform-origin: 47px 80px;
    /* Před hydratací mimo obrazovku; skutečnou polohu zapisuje rAF smyčka přímo do style */
    transform: translate3d(-200px, -200px, 0);
    transition: opacity 0.28s ease;
  }

  .molly-roaming-actor.is-docked {
    opacity: 0;
    visibility: hidden;
  }

  .molly-cat-canvas {
    width: 94px;
    height: 80px;
    display: block;
    pointer-events: none;
    /* Bez CSS filter: drop-shadow — plátno se překresluje každý snímek a filtr by se musel
       přepočítávat znovu (drahé hlavně na mobilech). Stín pod kočkou kreslí přímo canvas. */
  }

  /* Polohu (levý horní roh) zapisuje applyActorTransform() přímo do style.transform. */
  .molly-whisper-bubble {
    position: absolute;
    top: 0;
    left: 0;
    transform: translate3d(-9999px, 0, 0);
    width: max-content;
    max-width: 248px;
    padding: 7px 12px;
    border-radius: 14px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-strong, #c2cec5);
    box-shadow: var(--shadow-md, 0 8px 20px -6px rgba(18, 42, 30, 0.08));
    color: var(--ink-primary, #14281d);
    font-size: 0.76rem;
    font-weight: 600;
    line-height: 1.35;
    display: flex;
    align-items: center;
    gap: 6px;
    pointer-events: none;
    transition: opacity 0.2s ease;
    animation: mollyBubbleIn 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Molly ještě jde na volné místo — bublina počká a objeví se až na místě */
  .molly-whisper-bubble:global(.is-travelling) {
    opacity: 0;
    animation: none;
  }

  .molly-whisper-inner {
    display: inline-flex;
    align-items: flex-start;
    gap: 6px;
    text-align: left;
  }

  .whisper-icon {
    flex-shrink: 0;
    color: var(--accent-primary, #1b5e42);
    display: inline-flex;
    align-items: center;
    margin-top: 1px;
  }

  .whisper-text {
    overflow-wrap: anywhere;
  }

  .molly-flying-treat {
    position: fixed;
    top: -14px;
    left: -14px;
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-warm-tint, #fef6e8);
    border: 1.5px solid var(--accent-warm-ink, #8f4b0e);
    color: var(--accent-warm-ink, #8f4b0e);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
    pointer-events: none;
    z-index: 945;
  }

  .treat-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* Jen průhlednost — animace transformace by přebila inline polohu bubliny */
  @keyframes mollyBubbleIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Molly ukazuje cestu: jemné zvýraznění kolem hlavního kroku stránky */
  :global(.molly-guide-glow) {
    outline: 2px solid var(--accent-warm-ink, #8f4b0e);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .molly-whisper-bubble {
      animation: none;
    }
  }

  @media (min-width: 681px) and (max-width: 1024px) {
    .molly-whisper-bubble {
      max-width: 230px;
    }
  }

  @media (max-width: 680px) {
    .molly-whisper-bubble {
      max-width: min(260px, calc(100vw - 20px));
      padding: 6px 10px;
      font-size: 0.74rem;
      line-height: 1.3;
    }
  }

  @media (min-width: 681px) and (max-height: 700px) {
    .molly-roaming-actor {
      pointer-events: none;
      opacity: 0.88;
    }
  }
</style>

