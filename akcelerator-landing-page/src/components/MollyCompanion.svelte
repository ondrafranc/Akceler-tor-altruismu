<script>
  import { onMount, onDestroy, tick as svelteTick } from 'svelte';
  import { page } from '$app/stores';
  import {
    mollyState,
    mollyEvents,
    petMolly,
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

  let catCanvas = null;
  let catCtx = null;
  let actorEl = null;
  let treatEl = null;
  let rafId = 0;
  let mounted = false;
  const LOGICAL_W = 110;
  const LOGICAL_H = 96;
  const CAT_SAFETY_X = 4;
  const CAT_SAFETY_TOP = 6;
  const CAT_SAFETY_BOTTOM = 2;
  // Poslední zapsaná transformace — DOM zapisujeme jen při skutečné změně (žádný layout thrash)
  let lastActorTransform = '';
  // Bublina se šeptandou je MIMO herce (nezmenšuje se s kočkou na mobilu) a umisťuje se mimo rAF
  let bubbleEl = null;
  let bubbleW = 0;
  let bubbleH = 0;
  let lastBubbleTransform = '';
  // Molly spěchá na volné místo (aby bublina ani kočka nepřekrývaly tlačítka a nadpisy)
  let hurry = false;
  let pendingWhisperMs = 0;
  let relocateTimer = null;
  // Nevyžádaný tip (průvodce), pro který teď není volné místo: zkusíme to znovu, a když ani pak
  // ne, uloží se do pelíšku jako nevtíravý indikátor — ukáže se až na klepnutí (nic nezakryje sám od sebe).
  /** @type {{ icon?: string, text: string } | null} */
  let pendingTip = null;
  let deferTimer = null;
  let deferTries = 0;
  let lastSeenWhisperTs = 0;
  // Na /svet bydlí Molly u jezera přímo v krajině — toulavá Molly se tam schová (žádné dvě Molly naráz)
  let atHome = false;
  // Na přeplněné obrazovce Molly tiše zaparkuje v pelíšku, aniž by měnila uživatelské nastavení režimu
  let crowdedPark = false;
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
  let perchedOnLedge = false;

  // Pointer tracking for emerald eyes & button avoidance
  let pointerX = 640;
  let pointerY = 380;
  let blinkTimer = 3.6;
  let blinkProgress = 0;
  let hasFinePointer = false;
  let lastPointerMoveTs = 0;

  // Ambient firefly & heart particles around Molly
  let firefly = null; // { x, y, vx, vy, phase, alpha }
  let hearts = []; // { x, y, vy, scale, alpha, color }
  let flyingTreat = null; // { x0, y0, cx, cy, x1, y1, p, icon, color, name }
  let flyingTreatView = null; // { icon, color } — jediná reaktivní část letící dobroty
  let lastTreatTransform = '';

  // Whisper bubble visibility
  let activeWhisper = null;
  let whisperHideTimer = null;
  let walkArriveSafetyTimer = null;
  let dockAnchoredBubble = false;
  let bubbleTravelling = false;
  let forceDockWhisper = false;

  let unsubEvents = null;
  let unsubState = null;
  let currentState = {
    mode: 'roaming',
    mood: 'curious',
    treatsFedTotal: 0,
    treatsFedToday: 0,
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

  /** Čistá kontrola překryvu s předměřenými interaktivními prvky stránky (nikdy nečte DOM). */
  function directControlOverlapAt(x) {
    if (cachedControlRects.length === 0) return 0;
    const { vw, vh } = viewportSize();
    const s = actorScale(vw);
    const bub = defaultBubbleRectAt(x, groundLine(vw, vh), s, vw);
    if (!bub) return 0;
    let area = 0;
    for (const t of cachedControlRects) {
      area += overlapArea(bub, t);
    }
    return area;
  }

  /** Kolik plochy tlačítek/odkazů/polí a nadpisů by bublina zakryla, kdyby Molly stála na x. */
  function hardBubbleOverlapAt(x) {
    const { vw, vh } = viewportSize();
    const s = actorScale(vw);
    const bub = defaultBubbleRectAt(x, groundLine(vw, vh), s, vw);
    if (!bub) return 0;
    let area = 0;
    for (const o of collectObstacles(vw, vh, false)) {
      area += overlapArea(bub, o);
    }
    return Math.max(area, directControlOverlapAt(x));
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
      const spot = findBestSpot({ preferX: posX, withBubble: true, groundOnly: true });
      if (vw <= MOBILE_MAX_W) {
        if (hardBubbleOverlapAt(spot.x) > 35) {
          deferGuideWhisper(activeWhisper);
          return;
        }
      } else {
        const bestPlaced = findBestWhisperRectWithCost(spot.x, spot.y, actorScale(vw), vw, vh);
        if (hardBubbleOverlapAt(spot.x) > 35 && bestPlaced.obsCost > 35) {
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
        if (curRaw > 20) snapMollyToFreeSpot();
      }
      targetX = posX;
      targetY = posY;
      updateBubbleAnchorMode(posX);
      evaluateDockWhisperFallback(posX);
      applyActorTransform();
      return;
    }

    const moving = relocateToFreeSpot(true);
    if (moving && Math.hypot(targetX - posX, targetY - posY) > 18) {
      hurry = true;
      bubbleTravelling = true;
      bubbleEl.classList.add('is-travelling');
      if (whisperHideTimer) clearTimeout(whisperHideTimer);
      if (walkArriveSafetyTimer) clearTimeout(walkArriveSafetyTimer);
      walkArriveSafetyTimer = setTimeout(() => {
        walkArriveSafetyTimer = null;
        posX = targetX;
        posY = targetY;
        onArrived();
        applyActorTransform();
      }, 320);
    } else {
      bubbleTravelling = false;
      bubbleEl.classList.remove('is-travelling');
      if (whisperHideTimer) clearTimeout(whisperHideTimer);
      whisperHideTimer = setTimeout(hideWhisperBubble, pendingWhisperMs || 4200);
    }
    updateBubbleAnchorMode(targetX);
    evaluateDockWhisperFallback(targetX);
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
      x0: startX.toFixed(1),
      y0: startY.toFixed(1)
    };
    lastTreatTransform = '';

    behavior = 'CATCH_TREAT';
    behaviorTimer = 2.8;
    eatTimer = 1.8;
    spawnHeartBurst(7);
  }

  // ===================== Kde Molly smí stát (nic důležitého nezakrývá) =====================
  // Molly i její bublina jsou pevně umístěné nad stránkou. Dřív sedávaly na nadpisech karet,
  // na tlačítku „Zobrazit krok“ nebo na výběru měst. Teď si Molly vybírá místo podle toho,
  // co je zrovna pod ní: tlačítka, odkazy, pole formuláře a nadpisy se snaží nikdy nepřekrýt.
  const OBSTACLE_SELECTOR =
    'a[href], button, input, select, textarea, label, summary, [role="button"], [data-molly-guide], h1, h2, h3, h4, .chip, .pill, .cat-pill, .city-chip, .q-pill, .preset-pill, .topic-pill, .filter-chip, .source-chip, .radius-pill, .energy-tab, .mobile-guided-preview-bar, .feedback-pill, .deck-header-bar, .deck-indicator, .deck-nav-btn, .instant-card, .action-card, .place-card, .nav-capsule, .top-nav, .card, .compass-shell, .highlight-card, .alt-card, .local-card, .side-note, .empty-box, .calm-drawer, .footer-col, .footer-brand, .footer-desc, .footer-heading, .footer-trust, .map-frame, .leaflet-container';
  const MOBILE_MAX_W = 680;

  function viewportSize() {
    return { vw: window.innerWidth || 1280, vh: window.innerHeight || 800 };
  }

  function actorScale(vw) {
    if (vw <= MOBILE_MAX_W) return 0.68;
    if (vw <= 1024) return 0.78;
    return 1;
  }

  let layoutMetricsCache = {
    ts: 0,
    vw: 0,
    vh: 0,
    groundY: 0,
    topNavBottom: 0,
    dock: null,
    crisis: null
  };

  /** @type {Array<{ l: number, t: number, r: number, b: number, w: number }>} */
  let cachedObstacles = [];
  /** @type {Array<{ l: number, t: number, r: number, b: number, w: number }>} */
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
   */
  function measureLayoutAndObstacles(vw, vh) {
    if (typeof document === 'undefined') return;
    if (!vw || !vh) {
      const vs = viewportSize();
      vw = vs.vw;
      vh = vs.vh;
    }
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

    let crisis = null;
    const cEls = document.querySelectorAll('.crisis-widget > button, .crisis-mobile-fab');
    for (const el of cEls) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        crisis = r;
        break;
      }
    }

    let groundY;
    if (vw <= MOBILE_MAX_W) {
      groundY = Math.round(vh - 10);
    } else {
      groundY = vh <= 620 ? vh - 12 : vh - 18;
    }

    layoutMetricsCache = { ts: now, vw, vh, groundY, topNavBottom, dock, crisis };
    cachedObstacles = measureObstaclesInternal(vw, vh, false);
    cachedFullObstacles = measureObstaclesInternal(vw, vh, true);

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
    return { ...layoutMetricsCache, vw, vh, groundY };
  }

  /** Svislá „chodníková“ linie, po které Molly chodí. */
  function groundLine(vw, vh) {
    return ensureLayoutMetrics(vw, vh).groundY;
  }

  function dockRect() {
    const { vw, vh } = viewportSize();
    return ensureLayoutMetrics(vw, vh).dock;
  }

  function roamRange(vw) {
    const { vh } = viewportSize();
    const s = actorScale(vw);
    const half = 55 * s;
    const c = crisisRect();
    const d = dockRect();
    if (vw <= MOBILE_MAX_W) {
      // Na mobilu je pelíšek nahoře v hlavičce; dole chodí Molly volně s odstupem od případné opory
      const dBottom = d && d.bottom > vh * 0.5 ? d : null;
      const right = dBottom && dBottom.left > vw * 0.4 ? Math.floor(dBottom.left - half - 6) : Math.floor(vw - half - 10);
      const left = c && c.right < vw * 0.6 ? Math.ceil(c.right + half + 6) : Math.ceil(half + 10);
      if (right < left) {
        const mid = Math.round((left + right) * 0.5);
        return { minX: mid, maxX: mid };
      }
      return { minX: left, maxX: right };
    }
    // Na desktopu nechodí přes pelíšek vlevo dole ani přes pilulku krizové opory vpravo dole
    const dLeftBottom = d && d.bottom > vh * 0.5 && d.right < vw * 0.45 ? d : null;
    const left = dLeftBottom ? Math.ceil(dLeftBottom.right + half + 10) : Math.ceil(half + 16);
    const right = c && c.left > vw * 0.5 ? Math.floor(c.left - half - 10) : Math.floor(vw - half - 16);
    return { minX: left, maxX: Math.max(left + 40, right) };
  }

  function catRectAt(x, y, s) {
    const halfW = LOGICAL_W * 0.5 * s + CAT_SAFETY_X;
    const fullH = LOGICAL_H * s + CAT_SAFETY_TOP;
    return { l: x - halfW, t: y - fullH, r: x + halfW, b: y + CAT_SAFETY_BOTTOM };
  }

  function defaultBubbleRectAt(x, y, s, vw) {
    if (!bubbleW || !bubbleH) return null;
    const left = Math.max(8, Math.min(vw - 8 - bubbleW, Math.round(x - bubbleW / 2)));
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
    const left = Math.max(8, Math.min(vw - 8 - bubbleW, Math.round(d.left)));
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
    const obstacles = collectObstacles(vw, vh, true);
    const { topNavBottom } = ensureLayoutMetrics(vw, vh);
    const minTop = topNavBottom > 0 ? Math.ceil(topNavBottom + 8) : 64;
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

    const candXs = Array.from(
      new Set([
        Math.max(8, Math.min(vw - 8 - bubbleW, Math.round(vw - 10 - bubbleW))),
        Math.max(8, Math.min(vw - 8 - bubbleW, Math.round((vw - bubbleW) * 0.5))),
        Math.max(8, Math.min(vw - 8 - bubbleW, Math.round(x - bubbleW * 0.5))),
        8
      ])
    );

    const candYs = [minTop, maxTop, preferredY];
    for (let ty = minTop; ty <= maxTop; ty += 12) {
      candYs.push(ty);
    }

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
            obsCost += overlapArea(rect, cat) * 1.5;
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
      const maxX = Math.max(8, vw - 8 - bubbleW);
      const scanXs = [];
      for (let lx = 8; lx <= maxX; lx += 48) {
        if (!candXs.includes(lx)) scanXs.push(lx);
      }
      if (scanXs.length > 0) evalCandidates(scanXs);
    }

    if (best) return { rect: best, obsCost: bestObsCost };
    const fallbackLeft = Math.max(8, Math.min(vw - 8 - bubbleW, Math.round(vw - 10 - bubbleW)));
    return {
      rect: { l: fallbackLeft, t: minTop, r: fallbackLeft + bubbleW, b: minTop + bubbleH },
      obsCost: 0
    };
  }

  function findBestWhisperRect(x, y, s, vw, vh) {
    return findBestWhisperRectWithCost(x, y, s, vw, vh).rect;
  }

  function updateBubbleAnchorMode(anchorX) {
    if (!activeWhisper || !bubbleW || !bubbleH) {
      dockAnchoredBubble = false;
      return;
    }
    if (!activeWhisper.fromDock || !dockRect() || hardBubbleOverlapAt(anchorX) <= 40) {
      dockAnchoredBubble = false;
      return;
    }
    const { vw, vh } = viewportSize();
    const s = actorScale(vw);
    const cand = dockAnchoredBubbleRect(anchorX, groundLine(vw, vh), s, vw);
    dockAnchoredBubble = Boolean(cand && rectOverlapWithObstaclesAndControls(cand, vw, vh) <= 0);
  }

  function evaluateDockWhisperFallback(anchorX) {
    if (!activeWhisper?.fromDock || $isCompactDock || currentState.mode === 'docked' || atHome || crowdedPark) {
      forceDockWhisper = false;
      return;
    }
    if (dockAnchoredBubble || !bubbleW || !bubbleH) {
      forceDockWhisper = false;
      return;
    }
    const { vw, vh } = viewportSize();
    if (vw <= 1024 || hardBubbleOverlapAt(anchorX) <= 0) {
      forceDockWhisper = false;
      return;
    }
    const s = actorScale(vw);
    const { obsCost } = findBestWhisperRectWithCost(anchorX, groundLine(vw, vh), s, vw, vh);
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
    if (hardBubbleOverlapAt(x) > 0) {
      return getMemoizedWhisperRect(x, y, s, vw, vh);
    }
    return defaultBubbleRectAt(x, y, s, vw);
  }

  function measureObstaclesInternal(vw, vh, fullViewport = false) {
    /** @type {Array<{ l: number, t: number, r: number, b: number, w: number }>} */
    const out = [];
    const zoneTop = fullViewport ? 0 : vh * 0.2;
    const pad = fullViewport ? 3 : 2;
    const topNavEl = document.querySelector('.navbar, .top-nav');
    const topNavRect = topNavEl ? topNavEl.getBoundingClientRect() : null;
    const capsuleEl = document.querySelector('.nav-capsule');
    const capsuleRect = capsuleEl ? capsuleEl.getBoundingClientRect() : null;
    const topNavBottom =
      topNavRect && topNavRect.width > 0 && topNavRect.height > 0 && topNavRect.top <= 16
        ? topNavRect.bottom
        : 0;

    const nodes = document.querySelectorAll(OBSTACLE_SELECTOR);
    for (const el of nodes) {
      if (el.closest('.molly-companion-layer, .molly-pelisek-dock')) continue;
      if (!el.matches('.top-nav, .nav-capsule') && el.closest('.navbar, .top-nav')) continue;
      if (el.matches('.top-nav, .nav-capsule')) continue;
      const closedDetails = el.closest('details:not([open])');
      if (closedDetails && !el.closest('summary')) continue;
      if (typeof el.checkVisibility === 'function') {
        if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      } else {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) continue;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const visTop = fullViewport ? Math.max(r.top, topNavBottom) : r.top;
      const visBottom = fullViewport ? Math.min(r.bottom, vh) : r.bottom;
      if (visBottom - visTop < 2) continue;
      if (visBottom < zoneTop || visTop > vh || r.right < 0 || r.left > vw) continue;
      const isHeading = /^H[1-4]$/.test(el.tagName);
      out.push({
        l: r.left - pad,
        t: visTop - pad,
        r: r.right + pad,
        b: visBottom + pad,
        w: isHeading ? 1.5 : 2
      });
    }
    if (fullViewport) {
      if (topNavRect && topNavRect.width > 0 && topNavRect.height > 0) {
        out.push({
          l: topNavRect.left,
          t: topNavRect.top,
          r: topNavRect.right,
          b: topNavRect.bottom + 1,
          w: 4
        });
      }
      if (capsuleRect && capsuleRect.width > 0 && capsuleRect.height > 0) {
        out.push({
          l: capsuleRect.left,
          t: capsuleRect.top,
          r: capsuleRect.right,
          b: capsuleRect.bottom + 1,
          w: 4
        });
      }
    }
    // Pelíšek patří Molly, ale bublina ho nesmí zakrýt (tlačítka v něm musí jít vždy stisknout)
    const d = dockRect();
    if (d) out.push({ l: d.left - 3, t: d.top - 3, r: d.right + 3, b: d.bottom + 3, w: 2.5 });
    // Krizová opora (Opora 24/7 / Potřebuješ oporu?) nesmí nikdy zmizet pod Molly ani bublinou
    const c = crisisRect();
    if (c) out.push({ l: c.left - 4, t: c.top - 4, r: c.right + 4, b: c.bottom + 4, w: 3.5 });
    return out;
  }

  function collectObstacles(vw, vh, fullViewport = false) {
    return fullViewport ? cachedFullObstacles : cachedObstacles;
  }

  function findBestBubbleRect(anchorX, anchorY) {
    const { vw } = viewportSize();
    const s = actorScale(vw);
    updateBubbleAnchorMode(anchorX);
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

  function scoreSpot(x, y, s, vw, obstacles, withBubble) {
    const cat = catRectAt(x, y, s);
    const bub = withBubble ? defaultBubbleRectAt(x, y, s, vw) : null;
    let score = 0;
    for (const o of obstacles) {
      score += overlapArea(cat, o) * o.w;
      if (bub) score += overlapArea(bub, o) * o.w * 1.2;
    }
    return score;
  }

  /**
   * @param {{ preferX?: number, withBubble?: boolean, avoidX?: number | null, obstacles?: Array<{ l: number, t: number, r: number, b: number, w: number }>, groundOnly?: boolean }} [opts]
   */
  function findBestSpot(opts = {}) {
    const { vw, vh } = viewportSize();
    const s = actorScale(vw);
    const y = groundLine(vw, vh);
    const { minX, maxX } = roamRange(vw);
    const obstacles = opts.obstacles || collectObstacles(vw, vh, false);
    const preferX = Number.isFinite(opts.preferX) ? opts.preferX : posX;
    let best = { x: Math.max(minX, Math.min(maxX, preferX)), y, score: Infinity, raw: Infinity };
    const step = vw <= MOBILE_MAX_W ? 10 : 18;
    for (let x = minX; x <= maxX + 0.1; x += step) {
      const raw = scoreSpot(x, y, s, vw, obstacles, Boolean(opts.withBubble));
      let score = raw * 120 + Math.abs(x - preferX) * 0.4;
      if (Number.isFinite(opts.avoidX) && Math.abs(x - opts.avoidX) < 130) score += 6000;
      if (score < best.score) best = { x, y, score, raw };
    }
    return best;
  }

  /**
   * Okamžitě umístí Molly na nejlepší volné místo bez zdlouhavého přecházení (při načtení a změně stránky).
   */
  function snapMollyToFreeSpot() {
    if (typeof window === 'undefined' || currentState.mode !== 'roaming' || atHome) return;
    const spot = findBestSpot({ preferX: posX, withBubble: false });
    if (spot.raw > 0) {
      crowdedPark = true;
      perchedOnLedge = false;
      lastActorTransform = '';
      if (activeWhisper && bubbleW) {
        updateBubbleAnchorMode(posX);
        evaluateDockWhisperFallback(posX);
        lastBubbleTransform = '';
      }
      applyActorTransform();
      return;
    }
    const wasParked = crowdedPark;
    crowdedPark = false;
    posX = spot.x;
    posY = spot.y;
    targetX = spot.x;
    targetY = spot.y;
    perchedOnLedge = false;
    lastActorTransform = '';
    if (activeWhisper && bubbleW) {
      updateBubbleAnchorMode(posX);
      evaluateDockWhisperFallback(posX);
      lastBubbleTransform = '';
    }
    applyActorTransform();
    if (wasParked) {
      ensureLoopRunning();
    }
  }

  /**
   * Když Molly (a případně bublina) na současném místě něco zakrývá, pošle ji na volnější místo.
   * @param {boolean} withBubble
   * @returns {boolean} true, pokud se Molly vydala jinam
   */
  function relocateToFreeSpot(withBubble) {
    if (typeof window === 'undefined' || currentState.mode !== 'roaming' || atHome) return false;
    const { vw, vh } = viewportSize();
    const s = actorScale(vw);
    const obstacles = collectObstacles(vw, vh, false);
    const walking =
      behavior === 'WALK_ROAM' && Math.hypot(targetX - posX, targetY - posY) > 4 && !prefersReducedMotion();
    const baseX = walking ? targetX : posX;
    const baseY = groundLine(vw, vh);
    const here = scoreSpot(baseX, baseY, s, vw, obstacles, withBubble);
    const spot = findBestSpot({ preferX: baseX, withBubble, obstacles });
    const catSpot = withBubble ? findBestSpot({ preferX: baseX, withBubble: false, obstacles }) : spot;
    if (catSpot.raw > 0) {
      crowdedPark = true;
      applyActorTransform();
      return false;
    }
    const wasParked = crowdedPark;
    crowdedPark = false;
    if (wasParked) {
      ensureLoopRunning();
    }
    if (here <= 0 && Math.abs(baseY - spot.y) < 6) return walking;
    if (spot.raw >= here && Math.abs(baseY - spot.y) < 6) return walking;
    perchedOnLedge = false;
    targetX = spot.x;
    targetY = spot.y;
    if (prefersReducedMotion()) {
      posX = targetX;
      posY = targetY;
      applyActorTransform();
      return false;
    }
    hurry = true;
    behavior = 'WALK_ROAM';
    behaviorTimer = 4;
    ensureLoopRunning();
    return true;
  }

  /** Molly došla na místo — teprve teď ukáže bublinu (s plným časem na přečtení). */
  function onArrived() {
    hurry = false;
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
        directControlOverlapAt(posX) > 35
      ) {
        const { vw, vh } = viewportSize();
        const shouldDefer =
          vw <= MOBILE_MAX_W ||
          findBestWhisperRectWithCost(posX, groundLine(vw, vh), actorScale(vw), vw, vh).obsCost > 35;
        if (shouldDefer) {
          deferGuideWhisper(activeWhisper);
          return;
        }
      }
      bubbleTravelling = false;
      bubbleEl?.classList.remove('is-travelling');
      updateBubbleAnchorMode(posX);
      evaluateDockWhisperFallback(posX);
      lastBubbleTransform = '';
      if (activeWhisper && pendingWhisperMs > 0) {
        if (whisperHideTimer) clearTimeout(whisperHideTimer);
        whisperHideTimer = setTimeout(hideWhisperBubble, pendingWhisperMs);
      }
    }
  }

  function pickSafeTarget(avoidPointer = false) {
    if (typeof window === 'undefined') return;
    const { vw } = viewportSize();
    const { minX, maxX } = roamRange(vw);
    const preferX = minX + Math.random() * Math.max(40, maxX - minX);
    const catSpot = findBestSpot({
      preferX,
      withBubble: false,
      avoidX: avoidPointer ? pointerX : null
    });
    if (catSpot.raw > 0) {
      crowdedPark = true;
      perchedOnLedge = false;
      behavior = 'IDLE_SIT';
      applyActorTransform();
      return;
    }
    const spot =
      activeWhisper && bubbleW
        ? findBestSpot({
            preferX,
            withBubble: true,
            avoidX: avoidPointer ? pointerX : null
          })
        : catSpot;
    crowdedPark = false;
    perchedOnLedge = false;
    targetX = spot.x;
    targetY = spot.y;
  }

  function chooseNextBehavior() {
    // Sedí-li Molly na tlačítku či odkazu (obsah se mohl změnit bez scrollu), nejdřív uhne jinam
    if (relocateToFreeSpot(Boolean(activeWhisper && bubbleW))) {
      hurry = false;
      behavior = 'WALK_ROAM';
      behaviorTimer = Math.max(behaviorTimer, 4);
      return;
    }
    // Dokud člověk čte zprávu v bublině, Molly klidně sedí nebo se myje (neodchází pryč uprostřed věty)
    if (activeWhisper) {
      behavior = Math.random() < 0.7 ? 'IDLE_SIT' : 'GROOM';
      behaviorTimer = 2.6 + Math.random() * 1.8;
      return;
    }
    const roll = Math.random();
    if (roll < 0.42) {
      behavior = 'WALK_ROAM';
      behaviorTimer = 3.5 + Math.random() * 3.0;
      pickSafeTarget(false);
    } else if (roll < 0.66) {
      behavior = 'IDLE_SIT';
      behaviorTimer = 3.2 + Math.random() * 2.8;
    } else if (roll < 0.84) {
      behavior = 'GROOM';
      behaviorTimer = 2.8 + Math.random() * 2.0;
    } else {
      behavior = 'CHASE_FIREFLY';
      behaviorTimer = 3.4 + Math.random() * 2.0;
      const dir = Math.random() > 0.5 ? 1 : -1;
      firefly = {
        x: dir * (36 + Math.random() * 30),
        y: -34 - Math.random() * 24,
        vx: -dir * 0.35,
        vy: -0.15,
        phase: Math.random() * 6.28,
        alpha: 1
      };
    }
  }

  function pointInRect(x, y, rect) {
    return (
      rect &&
      rect.width > 0 &&
      rect.height > 0 &&
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  }

  let resizeTimer = null;
  function handleWindowResize() {
    if (typeof window === 'undefined') return;
    invalidateLayoutCache();
    const { vw, vh } = viewportSize();
    isCompactDock.set(vw <= 1024);
    const { minX, maxX } = roamRange(vw);
    perchedOnLedge = false;
    posX = Math.max(minX, Math.min(maxX, posX));
    targetX = Math.max(minX, Math.min(maxX, targetX));
    posY = groundLine(vw, vh);
    targetY = posY;
    lastBubbleTransform = '';
    applyActorTransform();
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      measureLayoutAndObstacles();
      const vs = viewportSize();
      const r = roamRange(vs.vw);
      posX = Math.max(r.minX, Math.min(r.maxX, posX));
      targetX = Math.max(r.minX, Math.min(r.maxX, targetX));
      posY = groundLine(vs.vw, vs.vh);
      targetY = posY;
      lastBubbleTransform = '';
      if (currentState.mode === 'roaming' && !atHome) {
        snapMollyToFreeSpot();
      } else {
        if (activeWhisper && bubbleW) {
          updateBubbleAnchorMode(posX);
          evaluateDockWhisperFallback(posX);
        }
        applyActorTransform();
      }
    }, 60);
  }

  /**
   * Zapíše polohu Molly (a bubliny) přímo do DOM mimo reaktivitu Svelte — dřív se `posX/posY`
   * měnily v šabloně každým snímkem a Svelte přepisoval celý `style` 60× za sekundu (sekání na mobilech).
   */
  function applyActorTransform() {
    if (!actorEl || typeof window === 'undefined') return;
    const vw = window.innerWidth || 1280;
    const s = actorScale(vw);
    const tf = `translate3d(${(posX - 55).toFixed(1)}px, ${(posY - 96).toFixed(1)}px, 0)${
      s !== 1 ? ` scale(${s})` : ''
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

  // Po doscrollování se pod Molly objeví jiný obsah -> když teď něco zakrývá, přejde jinam
  function handleWindowScroll() {
    lastInteractionTs = Date.now();
    if (currentState.mode !== 'roaming' || atHome) return;
    if (relocateTimer) clearTimeout(relocateTimer);
    relocateTimer = setTimeout(() => {
      relocateTimer = null;
      measureLayoutAndObstacles();
      const moving = relocateToFreeSpot(Boolean(activeWhisper && bubbleW));
      if (activeWhisper && bubbleW) {
        updateBubbleAnchorMode(targetX);
        evaluateDockWhisperFallback(targetX);
        lastBubbleTransform = '';
        applyActorTransform();
      }
      if (moving && Math.hypot(targetX - posX, targetY - posY) > 18 && bubbleEl && !activeWhisper?.fromDock) {
        bubbleTravelling = true;
        bubbleEl.classList.add('is-travelling');
        if (walkArriveSafetyTimer) clearTimeout(walkArriveSafetyTimer);
        walkArriveSafetyTimer = setTimeout(() => {
          walkArriveSafetyTimer = null;
          posX = targetX;
          posY = targetY;
          onArrived();
          applyActorTransform();
        }, 320);
      }
    }, 60);
  }

  function handleWindowPointerMove(e) {
    pointerX = e.clientX;
    pointerY = e.clientY;
    lastPointerMoveTs = performance.now();
    if ($mollyState.followMouse && hasFinePointer && !prefersReducedMotion() && currentState.mode === 'roaming' && !atHome) {
      ensureLoopRunning();
    }

    // Když se kurzor blíží k tlačítku, u kterého Molly sedí, uhne na volné místo
    if (currentState.mode === 'roaming' && !atHome && e.pointerType !== 'touch') {
      const distToMolly = Math.hypot(pointerX - posX, pointerY - (posY - 24));
      if (distToMolly < 92) {
        const el = e.target;
        if (
          el &&
          typeof el.closest === 'function' &&
          el.closest('button, a, input, select, textarea, [role="button"]') &&
          !el.closest('.molly-pelisek-dock')
        ) {
          behavior = 'WALK_ROAM';
          behaviorTimer = 2.4;
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

    if (currentState.mode !== 'roaming' || atHome) return;
    const dist = Math.hypot(e.clientX - posX, e.clientY - (posY - 26));
    if (dist < 44) {
      triggerPetInteraction(false);
    }
  }

  let ensureLoopRunning = () => {};

  /** @param {boolean} [fromDock] - z pelíšku ukážeme zprávu okamžitě na volném místě */
  function triggerPetInteraction(fromDock = false) {
    petBlissTimer = 2.6;
    behavior = 'PET_BLISS';
    behaviorTimer = 2.8;
    spawnHeartBurst(8);
    // Uložený tip z pelíšku: člověk si o něj sám řekl, takže ho Molly teď ukáže okamžitě
    if (fromDock && pendingTip) {
      const tip = pendingTip;
      pendingTip = null;
      petMolly(tip.text, { fromDock: true, icon: normalizeMollyIcon(tip.icon, 'paw') });
    } else {
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
  let mainResizeObserver = null;

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

    // Molly dojde po spodní „chodníkové“ linii co nejblíž pod tlačítko, ale jen na místo,
    // kde nic nezakrývá (dřív stála na obsahu hned pod tlačítkem). Tlačítko jemně rozzáří.
    const spot = findBestSpot({ preferX: ctaCx, withBubble: false });
    if (spot.raw > 0) {
      crowdedPark = true;
      perchedOnLedge = false;
      behavior = 'IDLE_SIT';
      applyActorTransform();
      return;
    }
    crowdedPark = false;
    perchedOnLedge = false;
    targetX = spot.x;
    targetY = spot.y;

    // Oči a natočení k tlačítku
    pointerX = ctaCx;
    pointerY = ctaCy;
    if (prefersReducedMotion()) {
      posX = targetX;
      posY = targetY;
      applyActorTransform();
    } else {
      behavior = 'WALK_ROAM';
      behaviorTimer = 6;
      hurry = true;
    }
    facing = ctaCx >= targetX ? 1 : -1;
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

  function scheduleLayoutSettleSnap() {
    if (settleTimer1) clearTimeout(settleTimer1);
    if (settleTimer2) clearTimeout(settleTimer2);
    settleTimer1 = setTimeout(() => {
      settleTimer1 = null;
      if (!atHome) {
        measureLayoutAndObstacles();
        snapMollyToFreeSpot();
      }
    }, 120);
    settleTimer2 = setTimeout(() => {
      settleTimer2 = null;
      if (!atHome) {
        measureLayoutAndObstacles();
        snapMollyToFreeSpot();
      }
    }, 400);
  }

  function handleRouteChange(path) {
    if (!path || path === currentPath) return;
    currentPath = path;
    lastInteractionTs = Date.now();
    clearGuideGlow();
    // Tip patřil předchozí stránce
    clearDeferredGuide();
    pendingTip = null;
    atHome = path === '/svet' || path.startsWith('/svet/');
    if (!atHome && typeof window !== 'undefined') {
      setTimeout(() => {
        measureLayoutAndObstacles();
        snapMollyToFreeSpot();
        scheduleLayoutSettleSnap();
        ensureLoopRunning();
      }, 60);
    }
    scheduleRouteHint(path);
    scheduleIdleNudge();
  }

  onMount(() => {
    mounted = true;
    measureLayoutAndObstacles();
    const { vw, vh } = viewportSize();
    const range = roamRange(vw);
    posX = vw <= MOBILE_MAX_W ? Math.max(range.minX, Math.min(range.maxX, vw * 0.3)) : 340;
    posY = groundLine(vw, vh);
    targetX = posX;
    targetY = posY;
    snapMollyToFreeSpot();
    scheduleLayoutSettleSnap();
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (mounted && !atHome) {
          measureLayoutAndObstacles();
          snapMollyToFreeSpot();
        }
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
      // Chůzi na volné místo přerušilo pohlazení / krmení -> bublinu ukážeme hned
      if (hurry && behavior !== 'WALK_ROAM') onArrived();
      if (currentState.mode === 'roaming' && !reduced && !atHome && !crowdedPark) {
        behaviorTimer -= dt;
        if (behaviorTimer <= 0 && !hurry) {
          chooseNextBehavior();
        }

        if ($mollyState.followMouse && hasFinePointer && behavior !== 'CATCH_TREAT' && behavior !== 'PET_BLISS' && !activeWhisper) {
          // Optional Mouse-Follow Mode (R2): gentle spring physics, sitting after 3s idle
          const pointerIdle = now - lastPointerMoveTs > 3000;
          if (pointerIdle) {
            vx *= 0.8;
            vy *= 0.8;
            if (Math.abs(vx) < 1.5) {
              vx = 0;
              behavior = 'IDLE_SIT';
            }
          } else {
            const { minX, maxX } = roamRange(vw);
            const clampedX = Math.max(minX, Math.min(maxX, pointerX));
            targetX = clampedX;
            targetY = groundLine(vw, vh);
            const dx = targetX - posX;
            const dist = Math.abs(dx);

            if (dist > 22) {
              isWalkingNow = true;
              const desiredVx = Math.sign(dx) * Math.min(220, dist * 3.5);
              vx += (desiredVx - vx) * Math.min(1, dt * 8.5); // spring damping
              posX += vx * dt;
              facing = dx >= 0 ? 1 : -1; // faces cursor direction
              walkCycle += dt * 11;
              behavior = 'WALK_ROAM';
            } else {
              vx *= 0.72;
              if (Math.abs(vx) < 1.5) {
                vx = 0;
                behavior = 'IDLE_SIT';
              }
            }
          }
        } else if (behavior === 'WALK_ROAM') {
          const dx = targetX - posX;
          const dy = targetY - posY;
          const dist = Math.hypot(dx, dy);
          if (dist > 4) {
            isWalkingNow = true;
            // Spěch na volné místo (bublina čeká) a velké svislé přesuny jsou svižné, běžná procházka pomalá
            const maxSpd = hurry ? 460 : Math.abs(dy) > 60 ? 240 : 88;
            vx = (dx / dist) * Math.min(maxSpd, dist * (hurry ? 6 : 3.2));
            vy = (dy / dist) * Math.min(maxSpd, dist * (hurry ? 6 : 3.2));
            posX += vx * dt;
            posY += vy * dt;
            if (Math.abs(vx) > 2) {
              facing = vx >= 0 ? 1 : -1;
            }
            walkCycle += dt * (hurry ? 14 : 9.5);
          } else {
            vx *= 0.7;
            vy *= 0.7;
            behavior = 'IDLE_SIT';
            behaviorTimer = 3.2;
            onArrived();
          }
        } else {
          vx *= 0.8;
          vy *= 0.8;
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

      applyActorTransform();

      const hasActiveTransient =
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

    unsubState = mollyState.subscribe((val) => {
      currentState = val;
      accessories = getMollyAccessories(val.giftDeeds);
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
        const spot = findBestSpot({ preferX: posX, withBubble: false });
        if (spot.raw > 0) {
          crowdedPark = true;
          perchedOnLedge = false;
          behavior = 'IDLE_SIT';
          applyActorTransform();
          spawnHeartBurst(5);
          return;
        }
        crowdedPark = false;
        behavior = 'WALK_ROAM';
        behaviorTimer = 3.2;
        pickSafeTarget(false);
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
          snapMollyToFreeSpot();
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

    unsubPage = page.subscribe(($p) => {
      handleRouteChange($p?.url?.pathname || '/');
    });

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
            if (atHome || currentState.mode !== 'roaming') return;
            if (layoutChangeTimer) clearTimeout(layoutChangeTimer);
            layoutChangeTimer = setTimeout(() => {
              layoutChangeTimer = null;
              if (!mounted || atHome) return;
              measureLayoutAndObstacles();
              snapMollyToFreeSpot();
              if (activeWhisper && bubbleW) {
                updateBubbleAnchorMode(targetX);
                evaluateDockWhisperFallback(targetX);
                lastBubbleTransform = '';
                applyActorTransform();
              }
            }, 80);
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
    if (rafId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(rafId);
    }
    if (whisperHideTimer) clearTimeout(whisperHideTimer);
    if (walkArriveSafetyTimer) clearTimeout(walkArriveSafetyTimer);
    if (hintTimer) clearTimeout(hintTimer);
    if (nudgeTimer) clearTimeout(nudgeTimer);
    if (deferTimer) clearTimeout(deferTimer);
    if (settleTimer1) clearTimeout(settleTimer1);
    if (settleTimer2) clearTimeout(settleTimer2);
    if (layoutChangeTimer) clearTimeout(layoutChangeTimer);
    if (resizeTimer) clearTimeout(resizeTimer);
    mainResizeObserver?.disconnect();
    mainResizeObserver = null;
    if (typeof document !== 'undefined') clearGuideGlow();
    unsubEvents?.();
    unsubState?.();
    unsubPage?.();
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

  $: nextGiftText = describeNextMollyGift($mollyState.giftDeeds);
  $: roamingWhisper =
    activeWhisper &&
    !forceDockWhisper &&
    ($isCompactDock || ($mollyState.mode === 'roaming' && !atHome && !crowdedPark));
  $: mollyDockBridge.set({
    pendingTip,
    activeWhisper,
    hasFinePointer,
    atHome,
    isParked: crowdedPark,
    forceDockWhisper,
    onPet: () => triggerPetInteraction(true)
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
      width="110"
      height="96"
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
    width: 110px;
    height: 96px;
    pointer-events: none;
    user-select: none;
    will-change: transform;
    transform-origin: 55px 96px;
    /* Před hydratací mimo obrazovku; skutečnou polohu zapisuje rAF smyčka přímo do style */
    transform: translate3d(-200px, -200px, 0);
    transition: opacity 0.28s ease;
  }

  .molly-roaming-actor.is-docked {
    opacity: 0;
    transform: translate3d(-200px, -200px, 0) scale(0.5) !important;
  }

  .molly-cat-canvas {
    width: 110px;
    height: 96px;
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
    border: 1.5px solid #8f4b0e;
    color: #8f4b0e;
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
    outline: 2px solid #8f4b0e;
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

