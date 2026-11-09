<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { page } from '$app/stores';
  import {
    mollyState,
    mollyEvents,
    petMolly,
    toggleMollyPelisek,
    mollyWhisper
  } from '$lib/mollyStore.js';
  import {
    getMollyAccessories,
    describeNextMollyGift,
    getNextMollyGiftProgress,
    MOLLY_ROUTE_GUIDES,
    getMollyGreeting
  } from '$lib/mollyTypes.js';
  import { prefersReducedMotion, frameStep } from '$lib/sensoryEngine.js';
  import { safeGetItem, safeSetItem } from '$lib/utils.js';

  let catCanvas = null;
  let catCtx = null;
  let actorEl = null;
  let treatEl = null;
  let petBtnEl = null;
  let toggleBtnEl = null;
  let rafId = 0;
  let mounted = false;
  const LOGICAL_W = 110;
  const LOGICAL_H = 96;
  // Poslední zapsaná transformace — DOM zapisujeme jen při skutečné změně (žádný layout thrash)
  let lastActorTransform = '';
  // Bublina se šeptandou je MIMO herce (nezmenšuje se s kočkou na mobilu) a umisťuje se v rAF
  let bubbleEl = null;
  let bubbleW = 0;
  let bubbleH = 0;
  let lastBubbleTransform = '';
  // Molly spěchá na volné místo (aby bublina ani kočka nepřekrývaly tlačítka a nadpisy)
  let hurry = false;
  let pendingWhisperMs = 0;
  let relocateTimer = null;
  // Nevyžádaný tip (průvodce), pro který teď není volné místo: zkusíme to znovu, a když ani pak
  // ne, uloží se do pelíšku jako „💬 tip“ — ukáže se až na klepnutí (nic nezakryje sám od sebe).
  /** @type {{ icon?: string, text: string } | null} */
  let pendingTip = null;
  let deferTimer = null;
  let deferTries = 0;
  let lastSeenWhisperTs = 0;
  // Na /svet bydlí Molly u jezera přímo v krajině — toulavá Molly se tam schová (žádné dvě Molly naráz)
  let atHome = false;
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
    if (whisperHideTimer) clearTimeout(whisperHideTimer);
    if (walkArriveSafetyTimer) clearTimeout(walkArriveSafetyTimer);
    pendingWhisperMs = durationMs;
    dockAnchoredBubble = false;
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
    lastBubbleTransform = '';
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
    return area;
  }

  /**
   * Po vykreslení bubliny změří její velikost a když by bublina nebo Molly zakrývaly
   * tlačítko, odkaz, pole formuláře nebo nadpis, najde 100% volné místo.
   */
  async function placeWhisperBubble() {
    await tick();
    if (!activeWhisper || typeof window === 'undefined') return;
    if (!bubbleEl) {
      if (activeWhisper.routePath) {
        markSessionList(HINTS_KEY, activeWhisper.routePath);
      }
      deferTries = 0;
      return;
    }
    bubbleW = bubbleEl.offsetWidth;
    bubbleH = bubbleEl.offsetHeight;
    lastBubbleTransform = '';
    // Nevyžádaný tip průvodce nesmí zakrýt tlačítko/odkaz/pole. Když na spodní linii není
    // volné místo (typicky mobil s kartami přes celou šířku), počkáme a případně ho uložíme do pelíšku.
    if (activeWhisper.guide && !activeWhisper.fromDock && currentState.mode === 'roaming' && !atHome) {
      const spot = findBestSpot({ preferX: posX, withBubble: true, groundOnly: true });
      if (hardBubbleOverlapAt(spot.x) > 35) {
        deferGuideWhisper(activeWhisper);
        return;
      }
    }
    if (activeWhisper.routePath) {
      markSessionList(HINTS_KEY, activeWhisper.routePath);
    }
    deferTries = 0;

    if (activeWhisper.fromDock) {
      bubbleEl.classList.remove('is-travelling');
      if (whisperHideTimer) clearTimeout(whisperHideTimer);
      whisperHideTimer = setTimeout(hideWhisperBubble, pendingWhisperMs || 4800);
      if (currentState.mode === 'roaming' && !atHome) {
        const { vw, vh } = viewportSize();
        const curRaw = scoreSpot(posX, posY, actorScale(vw), vw, collectObstacles(vw, vh, false), false);
        if (curRaw > 20) snapMollyToFreeSpot();
      }
      targetX = posX;
      targetY = posY;
      updateBubbleAnchorMode(posX);
      applyActorTransform();
      return;
    }

    const moving = relocateToFreeSpot(true);
    if (moving && Math.hypot(targetX - posX, targetY - posY) > 18) {
      hurry = true;
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
      bubbleEl.classList.remove('is-travelling');
      if (whisperHideTimer) clearTimeout(whisperHideTimer);
      whisperHideTimer = setTimeout(hideWhisperBubble, pendingWhisperMs || 4200);
    }
    updateBubbleAnchorMode(targetX);
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

    const toDock = currentState.mode === 'docked' || atHome;
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
      icon: treat?.icon || '🐟',
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
    'a[href], button, input, select, textarea, label, summary, [role="button"], [data-molly-guide], h1, h2, h3, h4, .chip, .pill, .cat-pill, .city-chip, .q-pill, .preset-pill, .topic-pill, .filter-chip, .source-chip, .radius-pill, .energy-tab, .ambient-pulse-pill, .mobile-guided-preview-bar, .feedback-pill';
  const MOBILE_MAX_W = 680;

  function viewportSize() {
    return { vw: window.innerWidth || 1280, vh: window.innerHeight || 800 };
  }

  function actorScale(vw) {
    if (vw <= MOBILE_MAX_W) return 0.68;
    if (vw <= 1024) return 0.78;
    return 1;
  }

  /** Svislá „chodníková“ linie, po které Molly chodí (na mobilu sedí přímo na horní hraně spodní navigace). */
  function groundLine(vw, vh) {
    if (vw <= MOBILE_MAX_W) {
      const nav = document.querySelector('.mobile-bottom-nav');
      const top = nav ? nav.getBoundingClientRect().top : 0;
      return Math.round(top > vh * 0.5 ? top - 2 : vh - 60);
    }
    return vh <= 620 ? vh - 12 : vh - 18;
  }

  function dockRect() {
    const el = document.querySelector('.molly-pelisek-dock');
    const r = el?.getBoundingClientRect();
    return r && r.width > 0 ? r : null;
  }

  function roamRange(vw) {
    const s = actorScale(vw);
    const half = 55 * s;
    const c = crisisRect();
    const d = dockRect();
    if (vw <= MOBILE_MAX_W) {
      // Na mobilu chodí Molly v mezeře mezi „Opora 24/7“ (vlevo) a pelíškem (vpravo) s bezpečnostním odstupem
      const right = d && d.left > vw * 0.4 ? Math.floor(d.left - half - 6) : Math.floor(vw - half - 110);
      const left = c && c.right < vw * 0.6 ? Math.ceil(c.right + half + 6) : Math.ceil(half + 10);
      if (right < left) {
        const mid = Math.round((left + right) * 0.5);
        return { minX: mid, maxX: mid };
      }
      return { minX: left, maxX: right };
    }
    // Na desktopu nechodí přes pelíšek vlevo dole ani přes pilulku krizové opory vpravo dole
    const left = d && d.right < vw * 0.45 ? Math.ceil(d.right + half + 10) : Math.ceil(half + 16);
    const right = c && c.left > vw * 0.5 ? Math.floor(c.left - half - 10) : Math.floor(vw - half - 16);
    return { minX: left, maxX: Math.max(left + 40, right) };
  }

  function catRectAt(x, y, s) {
    return { l: x - 43 * s, t: y - 86 * s, r: x + 43 * s, b: y };
  }

  function defaultBubbleRectAt(x, y, s, vw) {
    if (!bubbleW || !bubbleH) return null;
    const left = Math.max(8, Math.min(vw - 8 - bubbleW, Math.round(x - bubbleW / 2)));
    const bottom = y - Math.round(88 * s) - 6;
    const top = Math.max(64, bottom - bubbleH);
    return { l: left, t: top, r: left + bubbleW, b: top + bubbleH };
  }

  function updateBubbleAnchorMode(anchorX) {
    if (!activeWhisper || !bubbleW || !bubbleH) {
      dockAnchoredBubble = false;
      return;
    }
    dockAnchoredBubble = Boolean(
      activeWhisper.fromDock && dockRect() && hardBubbleOverlapAt(anchorX) > 40
    );
  }

  function bubbleRectAt(x, y, s, vw) {
    if (!bubbleW || !bubbleH) return null;
    if (dockAnchoredBubble) {
      const d = dockRect();
      if (d) {
        const left =
          vw <= MOBILE_MAX_W
            ? Math.max(8, Math.min(vw - 8 - bubbleW, Math.round(d.right - bubbleW)))
            : Math.max(8, Math.min(vw - 8 - bubbleW, Math.round(d.left)));
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
    }
    return defaultBubbleRectAt(x, y, s, vw);
  }

  function collectObstacles(vw, vh, fullViewport = false) {
    /** @type {Array<{ l: number, t: number, r: number, b: number, w: number }>} */
    const out = [];
    const zoneTop = fullViewport ? 0 : vh * 0.2;
    const pad = fullViewport ? 3 : 2;
    const topNavEl = document.querySelector('.navbar, .top-nav');
    const topNavRect = topNavEl ? topNavEl.getBoundingClientRect() : null;
    const topNavBottom =
      topNavRect && topNavRect.width > 0 && topNavRect.height > 0 && topNavRect.top <= 16
        ? topNavRect.bottom
        : 0;
    const bottomNavEl = document.querySelector('.mobile-bottom-nav');
    const bottomNavRect =
      bottomNavEl && getComputedStyle(bottomNavEl).display !== 'none'
        ? bottomNavEl.getBoundingClientRect()
        : null;
    const bottomNavTop =
      bottomNavRect && bottomNavRect.width > 0 && bottomNavRect.height > 0 && bottomNavRect.bottom >= vh - 16
        ? bottomNavRect.top
        : vh;

    const nodes = document.querySelectorAll(OBSTACLE_SELECTOR);
    for (const el of nodes) {
      if (el.closest('.molly-companion-layer')) continue;
      if (el.closest('.mobile-bottom-nav, .navbar, .top-nav')) continue;
      const closedDetails = el.closest('details:not([open])');
      if (closedDetails && !el.closest('summary')) continue;
      if (typeof el.checkVisibility === 'function' && !el.checkVisibility()) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const visTop = fullViewport ? Math.max(r.top, topNavBottom) : r.top;
      const visBottom = fullViewport ? Math.min(r.bottom, bottomNavTop) : r.bottom;
      if (visBottom - visTop < 2) continue;
      if (visBottom < zoneTop || visTop > vh || r.right < 0 || r.left > vw) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) continue;
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
      if (bottomNavRect && bottomNavRect.width > 0 && bottomNavRect.height > 0) {
        out.push({
          l: bottomNavRect.left,
          t: bottomNavRect.top - 2,
          r: bottomNavRect.right,
          b: bottomNavRect.bottom,
          w: 4
        });
      }
      if (topNavRect && topNavRect.width > 0 && topNavRect.height > 0) {
        out.push({
          l: topNavRect.left,
          t: topNavRect.top,
          r: topNavRect.right,
          b: topNavRect.bottom + 1,
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

  function findBestBubbleRect(anchorX, anchorY) {
    const { vw } = viewportSize();
    const s = actorScale(vw);
    updateBubbleAnchorMode(anchorX);
    return bubbleRectAt(anchorX, anchorY, s, vw);
  }

  function crisisRect() {
    const els = document.querySelectorAll('.crisis-widget > button, .crisis-mobile-fab');
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return r;
    }
    return null;
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
   * @param {{ preferX?: number, withBubble?: boolean, avoidX?: number | null, obstacles?: any[], groundOnly?: boolean }} [opts]
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
    posX = spot.x;
    posY = spot.y;
    targetX = spot.x;
    targetY = spot.y;
    perchedOnLedge = false;
    lastActorTransform = '';
    if (activeWhisper && bubbleW) {
      updateBubbleAnchorMode(posX);
      lastBubbleTransform = '';
    }
    applyActorTransform();
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
    if (bubbleEl && bubbleEl.classList.contains('is-travelling')) {
      bubbleEl.classList.remove('is-travelling');
      updateBubbleAnchorMode(posX);
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
    const spot = findBestSpot({
      preferX,
      withBubble: Boolean(activeWhisper && bubbleW),
      avoidX: avoidPointer ? pointerX : null
    });
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
    } else if (roll < 0.68) {
      behavior = 'IDLE_SIT';
      behaviorTimer = 3.2 + Math.random() * 2.8;
    } else if (roll < 0.86) {
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

  /**
   * High-DPI Procedural 2D Canvas Tortoiseshell Cat ("Želvovinová kočka Molly")
   * - Velvety dark chocolate-obsidian body (#1e1714) with asymmetric tortoiseshell patches (amber #f59e0b, rust #ea580c, honey #fde68a)
   * - Chimney-blaze face split, pink/terracotta nose, 6 spring-physics whiskers, independent twitching ears
   * - Soft breathing chest, 4 animated walking paws, 6-control-point harmonic Bézier tail
   * - Expressive emerald eyes (#84cc16 / #bef264) tracking pointer or curving into ^ ^ arcs
   */
  function drawMollyCat(ctx, w, h, nowSec) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();

    const cx = w * 0.5;
    const groundY = h - 10;
    const speed = Math.hypot(vx, vy);
    const isWalking = behavior === 'WALK_ROAM' && speed > 0.25;
    const isGrooming = behavior === 'GROOM';
    const isEating = eatTimer > 0 || behavior === 'CATCH_TREAT';
    const isBliss =
      petBlissTimer > 0 ||
      behavior === 'PET_BLISS' ||
      currentState.mood === 'purring' ||
      currentState.mood === 'breathing';
    const isSleeping = currentState.mode === 'docked' || currentState.mood === 'sleeping';

    // Soft warm ground shadow & golden aura
    const shadowGrad = ctx.createRadialGradient(
      cx,
      groundY + 2,
      2,
      cx,
      groundY + 2,
      36
    );
    shadowGrad.addColorStop(
      0,
      isEating || isBliss
        ? 'rgba(251, 191, 36, 0.32)'
        : 'rgba(10, 18, 14, 0.42)'
    );
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, groundY + 2, 34, 7.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(cx, groundY);
    ctx.scale(facing, 1);

    const breathScale =
      currentState.mood === 'breathing'
        ? 1 + Math.sin(nowSec * 1.4) * 0.065
        : 1 + Math.sin(nowSec * 2.4) * 0.025;
    const walkBob = isWalking ? Math.abs(Math.sin(walkCycle * 2)) * -3.2 : 0;
    const leapOffset =
      behavior === 'CATCH_TREAT' && flyingTreat
        ? Math.sin(flyingTreat.p * Math.PI) * -14
        : 0;

    ctx.translate(0, walkBob + leapOffset);

    // 1. 6-Control-Point Harmonic Bézier Tail (Obsidian with amber/rust/honey tortoiseshell rings)
    const tailFreq = isBliss || isEating ? 5.2 : isWalking ? 3.8 : 2.1;
    const tailAmp = isBliss || isEating ? 11 : 7.5;
    const w1 = Math.sin(nowSec * tailFreq) * tailAmp;
    const w2 = Math.cos(nowSec * tailFreq * 0.85 - 0.8) * (tailAmp * 1.15);

    const t0x = -18;
    const t0y = -12;
    const t1x = -34;
    const t1y = -16 + w1 * 0.35;
    const t2x = -44 + w1 * 0.5;
    const t2y = -32 + w2 * 0.5;
    const t3x = -36 + w2 * 0.8;
    const t3y = -48 + w1 * 0.4;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Base obsidian tail
    ctx.strokeStyle = '#1e1714';
    ctx.lineWidth = 8.2;
    ctx.beginPath();
    ctx.moveTo(t0x, t0y);
    ctx.bezierCurveTo(t1x, t1y, t2x, t2y, t3x, t3y);
    ctx.stroke();

    // Rust patch on mid-tail
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 6.4;
    ctx.beginPath();
    ctx.moveTo((t0x + t1x) * 0.5, (t0y + t1y) * 0.5);
    ctx.quadraticCurveTo(t1x, t1y, (t1x + t2x) * 0.5, (t1y + t2y) * 0.5);
    ctx.stroke();

    // Honey-amber tip
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 5.4;
    ctx.beginPath();
    ctx.moveTo((t1x + t2x) * 0.5, (t1y + t2y) * 0.5);
    ctx.quadraticCurveTo(t2x, t2y, t3x, t3y);
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(t3x, t3y, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Back Paws (Animated during walk)
    const legSwingA = isWalking ? Math.sin(walkCycle) * 6.5 : 0;
    const legSwingB = isWalking ? -Math.sin(walkCycle) * 6.5 : 0;

    // Back-left paw (obsidian with rust ankle)
    ctx.fillStyle = '#1e1714';
    ctx.beginPath();
    ctx.ellipse(-13 + legSwingB * 0.7, -3, 5.2, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Back-right paw (amber patch)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(-5 + legSwingA * 0.7, -2.2, 5.2, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Velvety Chocolate-Obsidian Body (#1e1714) with Asymmetric Tortoiseshell Patches
    ctx.save();
    ctx.scale(breathScale, 2 - breathScale);
    ctx.fillStyle = '#1e1714';
    ctx.strokeStyle = 'rgba(253, 230, 138, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (isWalking) {
      ctx.ellipse(-2, -16, 21, 13.5, -0.06, 0, Math.PI * 2);
    } else {
      ctx.ellipse(-2, -17, 18.5, 15.5, -0.15, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    // Clip to body for tortoiseshell mottling (amber #f59e0b, rust #ea580c, honey #fde68a)
    ctx.beginPath();
    if (isWalking) {
      ctx.ellipse(-2, -16, 20.6, 13.1, -0.06, 0, Math.PI * 2);
    } else {
      ctx.ellipse(-2, -17, 18.1, 15.1, -0.15, 0, Math.PI * 2);
    }
    ctx.clip();

    // Rust saddle patch
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(-9, -22, 10, 7.5, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Amber flank patch
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(5, -14, 9.5, 6.8, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Honey chest & shoulder flecks
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(11, -18, 5.8, 7.2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(-14, -11, 6.2, 5.0, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Front Paws (Animated walking or grooming)
    if (isGrooming) {
      // Lifted ginger paw washing cheek
      const lickY = -24 + Math.sin(groomPhase * 7) * 3.2;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(15, lickY, 4.8, 3.4, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(17.5, lickY - 1, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Front-left paw (ginger-amber)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(7 + legSwingA, -2.2, 5.2, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(8.6 + legSwingA, -1.6, 2.4, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Front-right supporting paw (obsidian with honey toes)
    ctx.fillStyle = '#1e1714';
    ctx.beginPath();
    ctx.ellipse(13 + legSwingB, -2, 5.0, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(15 + legSwingB, -1.5, 2.1, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Head with Chimney-Blaze Split & Independent Twitching Ears
    const headX = isWalking ? 13 : 9;
    const headY = isWalking ? -29 : -32;

    // 4B. Dárky za pamlsky: smaragdový obojek + zlatý zvoneček (hlava je kreslí přes horní okraj)
    if (accessories.collar) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.ellipse(headX - 1, headY + 10.5, 9.5, 3.6, 0, 0.05 * Math.PI, 0.95 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(167, 243, 208, 0.85)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.ellipse(headX - 1, headY + 10, 9.5, 3.6, 0, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
    if (accessories.bell) {
      const bellSwing = isWalking ? Math.sin(walkCycle * 2) * 1.2 : Math.sin(nowSec * 2) * 0.4;
      const bx = headX - 1 + bellSwing;
      const bellY = headY + 15.6;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(bx, bellY, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(bx - 0.9, bellY - 0.9, 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(bx - 1.4, bellY + 0.9, 2.8, 0.7);
    }
    const headTilt = isGrooming
      ? 0.16
      : behavior === 'CHASE_FIREFLY'
        ? -0.12
        : Math.sin(nowSec * 1.5) * 0.04;

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(headTilt);

    // Independent ear twitches
    const leftEarTwitch =
      Math.sin(nowSec * 3.1) > 0.9 ? Math.sin(nowSec * 20) * 0.12 : 0;
    const rightEarTwitch =
      Math.cos(nowSec * 2.7) > 0.88 ? Math.cos(nowSec * 19) * -0.14 : 0;

    // Left ear (Obsidian with honey tuft)
    ctx.save();
    ctx.rotate(leftEarTwitch);
    ctx.fillStyle = '#1e1714';
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(-15, -22);
    ctx.lineTo(-3, -13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.moveTo(-10.5, -8);
    ctx.lineTo(-12.8, -18.5);
    ctx.lineTo(-5.2, -12.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Right ear (Rust-amber tortoiseshell)
    ctx.save();
    ctx.rotate(rightEarTwitch);
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(3, -13);
    ctx.lineTo(15, -22);
    ctx.lineTo(12, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.moveTo(5.2, -12.2);
    ctx.lineTo(12.6, -18.5);
    ctx.lineTo(10.2, -8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Rounded head cranium
    ctx.fillStyle = '#1e1714';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14.8, 13.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Signature Chimney-Blaze Split on Face
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, 14.8, 13.2, 0, 0, Math.PI * 2);
    ctx.clip();

    // Right side of face: warm amber (#f59e0b) & rust (#ea580c) blaze
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-0.5, -15);
    ctx.lineTo(16, -15);
    ctx.lineTo(16, 15);
    ctx.lineTo(1.2, 15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(9, -6, 6.5, 5.5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Honey cheek patch & eyebrow spot
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(6.5, 4.5, 5.5, 4.2, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-5.2, -5.8, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. Expressive Emerald Eyes (#84cc16 / #bef264)
    const relPtrX = (pointerX - posX) * facing;
    const relPtrY = pointerY - (posY - 32);
    const gazeAngle = Math.atan2(relPtrY, relPtrX);
    const gazeDist = Math.min(1.8, Math.hypot(relPtrX, relPtrY) / 140);
    const lookDX = Math.cos(gazeAngle) * gazeDist;
    const lookDY = Math.sin(gazeAngle) * gazeDist;

    if (isBliss || isEating || isSleeping || blinkProgress > 0.65) {
      // Blissful ^ ^ arcs or peaceful sleeping eyelids
      ctx.strokeStyle = isSleeping ? '#fde68a' : '#bef264';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      [-5.6, 5.6].forEach((ex) => {
        ctx.beginPath();
        if (isSleeping) {
          ctx.arc(ex, 0.5, 3.4, 0.15 * Math.PI, 0.85 * Math.PI);
        } else {
          ctx.arc(ex, 0.2, 3.5, 1.15 * Math.PI, 1.85 * Math.PI);
        }
        ctx.stroke();
      });
    } else {
      const pupilW =
        behavior === 'CHASE_FIREFLY' || currentState.mood === 'playful'
          ? 2.5
          : 1.75;
      [-5.6, 5.6].forEach((ex) => {
        // Emerald iris with subtle lime glow (levný průsvitný prstenec místo drahého shadowBlur)
        ctx.fillStyle = 'rgba(190, 242, 100, 0.32)';
        ctx.beginPath();
        ctx.ellipse(ex, -0.4, 5.0, 4.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.ellipse(ex, -0.4, 3.8, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner lime ring
        ctx.fillStyle = '#bef264';
        ctx.beginPath();
        ctx.ellipse(ex, -0.4, 2.9, 2.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupil tracking pointer / firefly
        ctx.fillStyle = '#090d08';
        ctx.beginPath();
        ctx.ellipse(
          ex + lookDX,
          -0.4 + lookDY,
          pupilW,
          2.6,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Catchlight specular sparkles
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex - 1.1, -1.6, 1.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + 1.1, 0.8, 0.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 7. Pink/Terracotta Nose & Cute Mouth
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.moveTo(-2.2, 3.2);
    ctx.lineTo(2.2, 3.2);
    ctx.lineTo(0, 5.4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 1.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 5.3);
    ctx.quadraticCurveTo(-2.2, 7.4, -4.0, 6.0);
    ctx.moveTo(0, 5.3);
    ctx.quadraticCurveTo(2.2, 7.4, 4.0, 6.0);
    ctx.stroke();

    if (isEating) {
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, 6.6, 2.1 + Math.sin(nowSec * 22) * 0.8, 0, Math.PI);
      ctx.fill();
    }

    // 8. 6 Spring-Physics Whiskers (3 on each side)
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.85)';
    ctx.lineWidth = 1.0;
    const whiskerSpring = Math.sin(nowSec * (isBliss ? 9 : 3.4)) * 1.4 - vy * 0.35;
    [-1, 1].forEach((dir) => {
      [-1, 0, 1].forEach((row) => {
        const wy0 = 4.4 + row * 1.7;
        const wx0 = dir * 7.2;
        const wx1 = dir * 19.5;
        const wy1 = wy0 + row * 2.2 + whiskerSpring * (row + 1.5) * 0.4;
        ctx.beginPath();
        ctx.moveTo(wx0, wy0);
        ctx.quadraticCurveTo((wx0 + wx1) * 0.5, wy0 - 1.2, wx1, wy1);
        ctx.stroke();
      });
    });

    // 8B. Květinová korunka (dárek za 25 pamlsků) mezi oušky
    if (accessories.flower) {
      const blossoms = [
        [-7.5, -11.2, '#f9a8d4'],
        [-2.6, -13.0, '#fde68a'],
        [2.6, -13.0, '#c4b5fd'],
        [7.5, -11.2, '#f9a8d4']
      ];
      for (const [fx, fy, col] of blossoms) {
        ctx.fillStyle = col;
        for (let pi = 0; pi < 4; pi++) {
          const pa = pi * (Math.PI / 2) + 0.4;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(pa) * 1.5, fy + Math.sin(pa) * 1.5, 1.35, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(fx, fy, 0.95, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore(); // end head

    // 8C. Zářivá hvězdička (dárek za 50 pamlsků) vznášející se nad hlavou
    if (accessories.star) {
      const sx = headX;
      const sy = headY - 25 + Math.sin(nowSec * 1.8) * 1.6;
      ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      for (let si = 0; si < 10; si++) {
        const rad = si % 2 === 0 ? 4.4 : 1.9;
        const a = -Math.PI / 2 + (si * Math.PI) / 5 + nowSec * 0.6;
        const px = sx + Math.cos(a) * rad;
        const py = sy + Math.sin(a) * rad;
        if (si === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    // 9. Floating Firefly when in CHASE_FIREFLY state
    if (firefly) {
      const fx = firefly.x;
      const fy = firefly.y + Math.sin(nowSec * 5 + firefly.phase) * 5;
      const fg = ctx.createRadialGradient(fx, fy, 1, fx, fy, 12);
      fg.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      fg.addColorStop(0.45, 'rgba(251, 191, 36, 0.45)');
      fg.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(fx, fy, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 10. Rising Golden & Pink Hearts when petted or fed
    for (let i = hearts.length - 1; i >= 0; i--) {
      const hItem = hearts[i];
      hItem.x += hItem.vx * frameK;
      hItem.y += hItem.vy * frameK;
      hItem.alpha *= Math.pow(0.96, frameK);
      if (hItem.alpha < 0.05) {
        hearts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = hItem.alpha;
      ctx.fillStyle = hItem.color;
      const r = 4.8 * hItem.scale;
      const hx = hItem.x;
      const hy = hItem.y;
      ctx.beginPath();
      ctx.moveTo(hx, hy + r * 0.35);
      ctx.bezierCurveTo(
        hx - r,
        hy - r * 0.4,
        hx - r * 1.1,
        hy + r * 0.6,
        hx,
        hy + r * 1.25
      );
      ctx.bezierCurveTo(
        hx + r * 1.1,
        hy + r * 0.6,
        hx + r,
        hy - r * 0.4,
        hx,
        hy + r * 0.35
      );
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
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

  function handleWindowResize() {
    if (typeof window === 'undefined') return;
    const { vw, vh } = viewportSize();
    const { minX, maxX } = roamRange(vw);
    perchedOnLedge = false;
    posX = Math.max(minX, Math.min(maxX, posX));
    targetX = Math.max(minX, Math.min(maxX, targetX));
    posY = groundLine(vw, vh);
    targetY = posY;
    lastBubbleTransform = '';
    if (currentState.mode === 'roaming' && !atHome) {
      snapMollyToFreeSpot();
    } else {
      if (activeWhisper && bubbleW) {
        updateBubbleAnchorMode(posX);
      }
      // Poloha se musí propsat i když je smyčka uspaná (pelíšek / reduced motion)
      applyActorTransform();
    }
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

  // Po doscrollování se pod Molly objeví jiný obsah → když teď něco zakrývá, přejde jinam
  function handleWindowScroll() {
    lastInteractionTs = Date.now();
    if (currentState.mode !== 'roaming' || atHome) return;
    if (relocateTimer) clearTimeout(relocateTimer);
    relocateTimer = setTimeout(() => {
      relocateTimer = null;
      const moving = relocateToFreeSpot(Boolean(activeWhisper && bubbleW));
      if (activeWhisper && bubbleW) {
        updateBubbleAnchorMode(targetX);
        lastBubbleTransform = '';
        applyActorTransform();
      }
      if (moving && Math.hypot(targetX - posX, targetY - posY) > 18 && bubbleEl && !activeWhisper?.fromDock) {
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

  /** @param {boolean} [fromDock] — z pelíšku ukážeme zprávu okamžitě na volném místě */
  function triggerPetInteraction(fromDock = false) {
    petBlissTimer = 2.6;
    behavior = 'PET_BLISS';
    behaviorTimer = 2.8;
    spawnHeartBurst(8);
    // Uložený tip z pelíšku: člověk si o něj sám řekl, takže ho Molly teď ukáže okamžitě
    if (fromDock && pendingTip) {
      const tip = pendingTip;
      pendingTip = null;
      petMolly(tip.text, { fromDock: true, icon: tip.icon });
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
  let settleTimer1 = null;
  let settleTimer2 = null;

  // ===================== Molly jako průvodkyně (směrování) =====================
  // 1) Při prvním příchodu na stránku (1× za session) pošeptá, co se tu dá udělat.
  // 2) Když člověk ~16 s nic nedělá, dojde k hlavnímu tlačítku (`[data-molly-guide]`),
  //    jemně ho rozzáří a nabídne ho. Max. 1× na stránku za session, nikdy v pelíšku.
  const HINTS_KEY = 'aa_molly_hints_v1';
  const NUDGES_KEY = 'aa_molly_nudges_v1';
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
      if (!atHome) snapMollyToFreeSpot();
    }, 120);
    settleTimer2 = setTimeout(() => {
      settleTimer2 = null;
      if (!atHome) snapMollyToFreeSpot();
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
      snapMollyToFreeSpot();
      scheduleLayoutSettleSnap();
      ensureLoopRunning();
    }
    scheduleRouteHint(path);
    scheduleIdleNudge();
  }

  onMount(() => {
    mounted = true;
    const { vw, vh } = viewportSize();
    const range = roamRange(vw);
    posX = vw <= MOBILE_MAX_W ? Math.max(range.minX, Math.min(range.maxX, vw * 0.3)) : 340;
    posY = groundLine(vw, vh);
    targetX = posX;
    targetY = posY;
    handleWindowResize();
    snapMollyToFreeSpot();
    scheduleLayoutSettleSnap();

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
        drawMollyCat(catCtx, LOGICAL_W, LOGICAL_H, nowSec);
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
      // Chůzi na volné místo přerušilo pohlazení / krmení → bublinu ukážeme hned
      if (hurry && behavior !== 'WALK_ROAM') onArrived();
      if (currentState.mode === 'roaming' && !reduced && !atHome) {
        behaviorTimer -= dt;
        if (behaviorTimer <= 0 && !hurry) {
          chooseNextBehavior();
        }

        if (behavior === 'WALK_ROAM') {
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
        Boolean(flyingTreat) || eatTimer > 0 || petBlissTimer > 0 || hearts.length > 0;

      // Úspora baterie: když Molly jen sedí/myje se, stačí ~30 fps (pomalé sinusové pohyby
      // vypadají stejně). Chůze, krmení a srdíčka běží na plnou obnovovací frekvenci.
      const canThrottle = !isWalkingNow && !hasActiveTransient && !firefly;
      if (!canThrottle || now - lastRenderTs >= 31) {
        lastRenderTs = now;
        renderCatFrame(nowSec);
      }

      // H4: Pause RAF loop when docked / u jezera (/svet) / reduced-motion with no active transient animation
      if ((currentState.mode === 'docked' || reduced || atHome) && !hasActiveTransient) {
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
      if (ev.type === 'feed' || ev.type === 'spark') {
        launchViewportTreatToMolly(ev.treat);
      } else if (ev.type === 'pet') {
        petBlissTimer = 2.6;
        spawnHeartBurst(7);
      } else if (ev.type === 'wake') {
        behavior = 'WALK_ROAM';
        behaviorTimer = 3.2;
        pickSafeTarget(false);
        spawnHeartBurst(5);
      }
      ensureLoopRunning();
    });

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
  });

  $: nextGiftText = describeNextMollyGift($mollyState.giftDeeds);
  $: giftProgress = getNextMollyGiftProgress($mollyState.giftDeeds);
  $: roamingWhisper = activeWhisper && $mollyState.mode === 'roaming' && !atHome;
  $: dockWhisper = activeWhisper && ($mollyState.mode === 'docked' || atHome);
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
      <span class="treat-emoji">{flyingTreatView.icon}</span>
    </div>
  {/if}

  <!-- Šeptanda: samostatná vrstva (nezmenšuje se s kočkou), polohu zapisuje rAF; klepnutím zmizí -->
  {#if roamingWhisper}
    <button
      bind:this={bubbleEl}
      type="button"
      class="molly-whisper-bubble"
      on:click|stopPropagation={hideWhisperBubble}
      aria-label="Skrýt zprávu od Molly"
      title="Skrýt zprávu"
    >
      <span class="molly-whisper-inner">
        <span class="whisper-icon" aria-hidden="true">{activeWhisper.icon || '🐾'}</span>
        <span class="whisper-text">{activeWhisper.text}</span>
      </span>
    </button>
  {/if}

  <!-- Volně se toulající želvovinová kočka Molly (pointer-events: none, nikdy neblokuje kliknutí) -->
  <div
    bind:this={actorEl}
    class="molly-roaming-actor"
    class:is-docked={$mollyState.mode === 'docked' || atHome}
    aria-hidden="true"
  >
    <canvas
      bind:this={catCanvas}
      class="molly-cat-canvas"
      width="110"
      height="96"
    ></canvas>
  </div>

  <!-- Klidový pelíšek Dock — uživatel má Molly vždy plně pod kontrolou -->
  <div
    class="molly-pelisek-dock"
    class:is-docked={$mollyState.mode === 'docked'}
    role="region"
    aria-label="Patronka Molly a klidový pelíšek"
  >
    {#if dockWhisper}
      <div class="molly-dock-whisper">
        <span>{activeWhisper.icon || '🐾'} {activeWhisper.text}</span>
      </div>
    {/if}

    <button
      bind:this={petBtnEl}
      type="button"
      class="molly-dock-pet-btn"
      class:has-tip={Boolean(pendingTip)}
      on:pointerdown|stopPropagation
      on:click|stopPropagation={() => triggerPetInteraction(true)}
      title={`${pendingTip ? 'Molly má pro tebe laskavý tip. ' : ''}Pohladit kočičku Molly. ${nextGiftText}`}
      aria-label={`${pendingTip ? 'Molly má pro tebe laskavý tip. ' : ''}Pohladit Molly. Darované pamlsky: ${$mollyState.treatsFedTotal}. ${nextGiftText}`}
    >
      {#if pendingTip}
        <span class="molly-tip-dot" aria-hidden="true" data-testid="molly-tip-dot">💬</span>
      {/if}
      <span class="molly-avatar-badge" aria-hidden="true">
        <span class="tortie-ear-left"></span>
        <span class="tortie-ear-right"></span>
        <span class="tortie-face">
          <span class="tortie-eye"></span>
          <span class="tortie-eye"></span>
        </span>
      </span>
      <span class="molly-dock-label">
        <span class="molly-dock-name">Molly</span>
        <strong class="molly-treat-counter" data-testid="molly-treat-count">
          {$mollyState.treatsFedTotal} {$mollyState.lastTreat?.icon || '🐟'}
        </strong>
      </span>
      <!-- Viditelný postup k dalšímu dárku (na dotykových zařízeních se tooltip nezobrazí) -->
      <span
        class="molly-gift-meter"
        class:is-complete={giftProgress.complete}
        aria-hidden="true"
        data-testid="molly-gift-meter"
      >
        <span class="molly-gift-icon">{giftProgress.icon}</span>
        <span class="molly-gift-track"><span class="molly-gift-fill" style="width: {giftProgress.pct}%"></span></span>
      </span>
    </button>

    <button
      bind:this={toggleBtnEl}
      type="button"
      class="molly-dock-toggle-btn"
      on:pointerdown|stopPropagation
      on:click|stopPropagation={toggleMollyPelisek}
      aria-pressed={$mollyState.mode === 'docked'}
      aria-label={$mollyState.mode === 'docked'
        ? 'Pozvat Molly na procházku'
        : 'Dopřát Molly odpočinek v pelíšku'}
      title={$mollyState.mode === 'docked'
        ? 'Pozvat Molly na procházku'
        : 'Dopřát Molly odpočinek v pelíšku'}
    >
      <span aria-hidden="true">{$mollyState.mode === 'docked' ? '✨' : '🧺'}</span>
      <span class="molly-toggle-text">{$mollyState.mode === 'docked' ? 'Procházka' : 'Pelíšek'}</span>
    </button>
  </div>
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

  /* Polohu (levý horní roh) zapisuje applyActorTransform() přímo do style.transform.
     Proto žádné bottom/left/translate v CSS — dřív se sčítaly s inline transformací
     a bublina končila mimo obrazovku (top ≈ 1300 px), takže Molly nebylo vůbec „slyšet“. */
  .molly-whisper-bubble {
    position: absolute;
    top: 0;
    left: 0;
    transform: translate3d(-9999px, 0, 0);
    width: max-content;
    max-width: 230px;
    padding: 6px 11px;
    border-radius: 14px;
    background: rgba(12, 22, 18, 0.94);
    border: 1px solid rgba(251, 191, 36, 0.48);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
    color: #fef3c7;
    font-size: 0.74rem;
    font-weight: 600;
    line-height: 1.3;
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

  .whisper-icon {
    flex-shrink: 0;
    font-size: 0.88rem;
  }

  .whisper-text {
    overflow-wrap: anywhere;
  }

  .molly-flying-treat {
    position: fixed;
    top: -14px;
    left: -14px;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(
      circle,
      rgba(254, 243, 199, 0.95) 0%,
      var(--treat-color, #f59e0b) 68%,
      rgba(245, 158, 11, 0) 100%
    );
    box-shadow: 0 0 18px var(--treat-color, #f59e0b);
    pointer-events: none;
    z-index: 945;
  }

  .treat-emoji {
    font-size: 1rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  }

  /* Klidový pelíšek Dock */
  .molly-pelisek-dock {
    position: fixed;
    bottom: 10px;
    left: 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 5px;
    border-radius: 999px;
    background: rgba(14, 23, 19, 0.9);
    border: 1px solid rgba(251, 191, 36, 0.35);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.38);
    backdrop-filter: blur(10px);
    pointer-events: auto;
    z-index: 941;
    transition: border-color 0.2s ease, transform 0.2s ease;
  }

  .molly-pelisek-dock.is-docked {
    border-color: rgba(52, 211, 153, 0.48);
    background: rgba(12, 26, 20, 0.94);
  }

  .molly-dock-whisper {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    width: max-content;
    max-width: 240px;
    padding: 6px 10px;
    border-radius: 12px;
    background: rgba(12, 22, 18, 0.95);
    border: 1px solid rgba(251, 191, 36, 0.45);
    color: #fef3c7;
    font-size: 0.73rem;
    font-weight: 600;
    pointer-events: none;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
  }

  .molly-dock-pet-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 9px;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: #f8fafc;
    font-family: inherit;
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s ease;
  }

  .molly-dock-pet-btn:hover {
    background: rgba(251, 191, 36, 0.14);
  }

  .molly-dock-pet-btn {
    position: relative;
  }

  /* Molly má odložený tip (nebylo kam ho ukázat, aniž by něco zakryl) */
  .molly-tip-dot {
    position: absolute;
    top: -9px;
    left: 2px;
    font-size: 0.7rem;
    line-height: 1;
    padding: 2px 3px;
    border-radius: 999px;
    background: rgba(251, 191, 36, 0.95);
    box-shadow: 0 0 0 2px rgba(14, 23, 19, 0.9);
    animation: mollyTipBob 2.4s ease-in-out infinite;
  }

  @keyframes mollyTipBob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-2px);
    }
  }

  .molly-avatar-badge {
    position: relative;
    width: 18px;
    height: 16px;
    display: inline-block;
    flex-shrink: 0;
  }

  .tortie-ear-left,
  .tortie-ear-right {
    position: absolute;
    top: 0;
    width: 6px;
    height: 6px;
    border-radius: 2px 5px 0 0;
  }

  .tortie-ear-left {
    left: 1px;
    background: #1e1714;
    border: 1px solid rgba(253, 230, 138, 0.45);
    transform: rotate(-14deg);
  }

  .tortie-ear-right {
    right: 1px;
    background: #ea580c;
    transform: rotate(14deg);
  }

  .tortie-face {
    position: absolute;
    bottom: 0;
    left: 1px;
    right: 1px;
    height: 13px;
    border-radius: 999px;
    background: linear-gradient(90deg, #1e1714 0%, #1e1714 50%, #f59e0b 50%, #ea580c 100%);
    border: 1px solid rgba(253, 230, 138, 0.55);
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0 2px;
  }

  .tortie-eye {
    width: 3.5px;
    height: 3.5px;
    border-radius: 999px;
    background: #bef264;
    box-shadow: 0 0 4px #84cc16;
  }

  .molly-dock-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }

  .molly-treat-counter {
    color: #fde68a;
    font-weight: 800;
    background: rgba(245, 158, 11, 0.16);
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 0.72rem;
  }

  .molly-dock-toggle-btn {
    padding: 4px 9px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: #d1fae5;
    font-family: inherit;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.18s ease, border-color 0.18s ease;
  }

  .molly-dock-toggle-btn:hover {
    background: rgba(52, 211, 153, 0.18);
    border-color: rgba(52, 211, 153, 0.45);
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

  /* Molly ukazuje cestu: jemná zlatá záře kolem hlavního kroku stránky (globální, prvek je v jiné komponentě) */
  :global(.molly-guide-glow) {
    outline: 2px solid rgba(251, 191, 36, 0.85);
    outline-offset: 3px;
    animation: mollyGuidePulse 1.6s ease-in-out 3;
  }

  @keyframes mollyGuidePulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(251, 191, 36, 0.28);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.molly-guide-glow) {
      animation: none;
    }

    .molly-whisper-bubble {
      animation: none;
    }
  }

  @media (min-width: 681px) and (max-width: 1024px) {
    .molly-whisper-bubble {
      max-width: 210px;
    }
  }

  @media (max-width: 680px) {
    .molly-whisper-bubble {
      max-width: 248px;
      padding: 3px 9px;
      font-size: 0.67rem;
      line-height: 1.16;
    }

    .molly-dock-whisper {
      left: auto;
      right: 0;
      max-width: min(240px, calc(100vw - 24px));
    }

    .molly-pelisek-dock {
      left: auto;
      right: 8px;
      bottom: calc(62px + env(safe-area-inset-bottom, 0px));
      transform: scale(0.84);
      transform-origin: bottom right;
      pointer-events: auto;
      opacity: 0.94;
      backdrop-filter: none;
    }

    /* Užší pelíšek (jen ikony + počet + dárek) → méně přeplněný spodní okraj a místo pro Molly
       mezi „Opora 24/7“ a pelíškem. Celý popis zůstává v aria-label. */
    .molly-dock-name,
    .molly-toggle-text {
      display: none;
    }
  }

  @media (max-height: 700px) {
    .molly-pelisek-dock {
      bottom: 6px;
      transform: scale(0.78);
      transform-origin: bottom left;
      pointer-events: auto;
      opacity: 0.92;
    }

    .molly-roaming-actor {
      pointer-events: none;
      opacity: 0.88;
    }
  }

  @media (max-width: 680px) and (max-height: 700px) {
    .molly-pelisek-dock {
      bottom: calc(60px + env(safe-area-inset-bottom, 0px));
      transform-origin: bottom right;
    }
  }
</style>

