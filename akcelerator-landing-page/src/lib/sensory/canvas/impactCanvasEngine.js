/**
 * Impact Canvas Engine.
 * Manages 2D canvas lifecycle, DPR sync, ResizeObserver, IntersectionObserver,
 * rAF animation loop, auto-sleep/dormancy, touch burst ripples, and poetic deed rendering.
 */

import {
  prefersReducedMotion,
  getCanvasDprCap,
  optimizeCanvasContext,
  frameStep,
  ensureSharedOrientation,
  getSharedOrientationGx
} from '../../core/device.js';
import { resolveMollyTreat } from '../../mollyTypes.js';
import { resolveActionEffectSpec } from '../catalog/catalogResolver.js';
import { easeOut } from '../graphics/math.js';
import { drawGlow } from '../graphics/primitives.js';
import { drawPoeticDeedScene } from '../scenes/poeticDispatcher.js';
import { activeControllers } from './controllerRegistry.js';

const win = () => typeof window !== 'undefined';

export function mountImpactCanvas(cv, o = {}) {
  o = o || {};
  const c = optimizeCanvasContext(cv?.getContext?.('2d'));
  if (!c) {
    const noop = () => { };
    noop.setPrimed = () => { };
    return noop;
  }

  const spec = resolveActionEffectSpec(o.action || o.mode || 'kibble');
  const mode = spec.mode;
  const target = spec.target || 25;
  const cs = spec.colors || ['#34d399', '#10b981', '#fbbf24', '#38bdf8'];
  const isPreview = Boolean(o.preview);
  let isPrimed = Boolean(o.primed);
  const h = isPreview ? 82 : 92;
  const cy = isPreview ? 43 : h * 0.5 + 2;
  const by = isPreview ? h - 8 : h - 11;
  const red = prefersReducedMotion();

  let currentW = isPreview ? 380 : 300;
  let currentCssH =
    cv?.getBoundingClientRect?.()?.height > 28
      ? cv.getBoundingClientRect().height
      : cv?.height || (isPreview ? 92 : 92);
  let gx = 0;
  let py = 0.5;
  let id = 0;
  let frame = 0;
  let idleFrames = 0;
  let lastNow = -1;
  let isRunning = false;
  let isVisible = false;
  let lastReportedVal = -1;
  let isClimax = !isPreview && Boolean(o.climax);
  let peakRatio = isPreview ? 0.0 : 1.0;
  let transitionProgress = isPreview
    ? 0.0
    : isClimax
      ? red
        ? 1.0
        : 0.0
      : red
        ? 0.25
        : 0.0;
  let previewP = isPrimed ? 0.14 : 0.0;
  let burstEnergy = isPreview ? 0.0 : isClimax ? 0.9 : 0.35;
  const ripples = [];

  if (!isPreview) {
    ensureSharedOrientation();
  }

  // HiDPI / Retina škálování zachovávající přesný poměr stran bez deformace kruhů a hranolů
  const syncCanvasDpr = () => {
    const rect = cv?.getBoundingClientRect?.();
    const ch = rect?.height > 28 ? rect.height : cv?.height || (isPreview ? 92 : 112);
    currentCssH = ch;
    if (!win() || !cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, getCanvasDprCap());
    const cw = rect?.width > 40 ? rect.width : cv.width || (isPreview ? 380 : 320);
    const minH = isPreview ? 46 : 72;
    const effDpr = Math.max(dpr, minH / Math.max(1, ch));
    const targetW = Math.max(240, Math.round(cw * effDpr));
    const targetH = Math.max(minH, Math.round(ch * effDpr));
    if (cv.width !== targetW || cv.height !== targetH) {
      cv.width = targetW;
      cv.height = targetH;
    }
  };
  syncCanvasDpr();

  let ro = null;
  if (win() && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      const prevW = cv.width;
      const prevH = cv.height;
      syncCanvasDpr();
      if (cv.width !== prevW || cv.height !== prevH) {
        wakeUpLoop();
        fn(true);
      }
    });
    ro.observe(cv);
  }

  // Jemné světlušky v botanické smaragdové scéně (normalizované napříč šířkou plátna)
  const stars = Array.from({ length: isPreview ? 16 : 22 }, (_, i) => ({
    nx: ((i * 53 + 17) % 293) / 293,
    ny: (isPreview ? 0.14 : 0.10) + (((i * 29 + 11) % 100) / 100) * (isPreview ? 0.70 : 0.76),
    r: 0.75 + (i % 3) * 0.45,
    phase: i * 0.7,
    col: i % 2 === 0 ? '#fde68a' : '#6ee7b7'
  }));

  const emitProgress = (ratio) => {
    if (isPreview) return;
    peakRatio = spec.staticMetric ? 1 : Math.max(peakRatio, Math.min(1, ratio || 0));
    const totalVal = Math.max(1, Math.min(target, Math.round(target * peakRatio)));
    if (totalVal !== lastReportedVal) {
      lastReportedVal = totalVal;
      o.onWeightUpdate?.(totalVal, spec.format(totalVal), spec);
    }
  };

  let arcsCount = 0;
  let controller = null;
  let onDown = null;

  if (!isPreview) {
    const mollyTreat = spec.mollyTreat || resolveMollyTreat(spec);
    if (cv?.setAttribute) {
      cv.setAttribute('data-molly-mini', 'ready');
      cv.setAttribute('data-molly-treat', mollyTreat?.foodType || 'salmon');
      cv.setAttribute('data-molly-arcs', '0');
    }

    const triggerBurst = (rx, ry) => {
      transitionProgress = red ? 1.0 : 0.0;
      lastNow = -1;
      isClimax = true;
      burstEnergy = 1.0;
      arcsCount++;
      if (cv?.setAttribute) {
        cv.setAttribute('data-molly-arcs', String(arcsCount));
      }
      const ripX = Number.isFinite(rx) ? rx : currentW / 2;
      const ripY = Number.isFinite(ry) ? ry : cy;
      ripples.push({ x: ripX, y: ripY, r: 4, maxR: 54, alpha: 0.82 });
      emitProgress(1);
      wakeUpLoop();
      if (red) {
        fn(true);
      }
    };

    controller = {
      cv,
      spec,
      triggerBurst,
      getActive: () => isRunning
    };
    activeControllers.add(controller);
    cv.__triggerBurst = triggerBurst;

    emitProgress(1);

    onDown = (e) => {
      const rect = cv.getBoundingClientRect?.();
      const px = rect ? (e.clientX - rect.left) * (currentW / Math.max(1, rect.width)) : currentW / 2;
      const pyLocal = rect ? (e.clientY - rect.top) * (h / Math.max(1, rect.height)) : cy;
      if (!isClimax || transitionProgress >= 0.65) {
        triggerBurst(px, pyLocal);
      } else {
        ripples.push({ x: px, y: pyLocal, r: 3, maxR: 42, alpha: 0.72 });
        burstEnergy = Math.min(1.0, burstEnergy + 0.38);
        wakeUpLoop();
      }
    };
    cv?.addEventListener?.('pointerdown', onDown);
  }

  const scheduleFrame = (cb) =>
    typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : 0;
  const cancelFrame = (handle) => {
    if (handle && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(handle);
    }
  };

  const fn = (force = false, now = undefined) => {
    if (!force && (!isVisible || (!cv.isConnected && cv.parentNode === null))) {
      isRunning = false;
      return;
    }

    let step = 1;
    if (!force) {
      if (typeof now === 'number' && Number.isFinite(now)) {
        if (lastNow >= 0 && now > lastNow) {
          step = frameStep(now - lastNow);
        }
        lastNow = now;
      }
      frame += step;
    }

    let p = 0;
    const targetPreviewP = isPrimed ? 0.14 : 0.0;

    if (isPreview) {
      if (red) {
        previewP = targetPreviewP;
      } else if (!force) {
        previewP += (targetPreviewP - previewP) * Math.min(1, 0.14 * step);
        if (Math.abs(targetPreviewP - previewP) < 0.001) {
          previewP = targetPreviewP;
        }
      }
      p = previewP;
    } else if (isClimax) {
      if (red) {
        transitionProgress = 1.0;
      } else if (!force && transitionProgress < 1.0) {
        transitionProgress = Math.min(1.0, transitionProgress + 0.015 * step);
        emitProgress(transitionProgress);
      }
      // Hladká křivka s gradací: během fade-in karty drží čistý stav „před" a hlavní rozkvět běží přímo před očima
      p = 1 - Math.pow(1 - transitionProgress, 1.85);
    } else {
      if (red) {
        transitionProgress = 0.25;
      } else if (!force && transitionProgress < 0.25) {
        transitionProgress = Math.min(0.25, transitionProgress + 0.0045 * step);
      }
      p = easeOut(transitionProgress / 0.25) * 0.25;
      emitProgress(1);
    }

    if (!isPreview) {
      if (!force) {
        if (burstEnergy > 0.02) {
          burstEnergy *= Math.pow(0.94, step);
        } else {
          burstEnergy = 0;
        }

        for (let i = ripples.length - 1; i >= 0; i--) {
          const rip = ripples[i];
          rip.r += 1.8 * step;
          rip.alpha *= Math.pow(0.92, step);
          if (rip.alpha < 0.02 || rip.r >= rip.maxR) {
            ripples.splice(i, 1);
          }
        }

        const targetGx = getSharedOrientationGx();
        gx += (targetGx - gx) * Math.min(1, 0.08 * step);
      }
    }

    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    const scale = cv.height / h;
    const w = Math.max(240, cv.width / Math.max(0.01, scale));
    currentW = w;
    const cx = w / 2;
    c.scale(scale, scale);

    // Jednotná botanicko-smaragdová scénická kulisa pro plátno odměny;
    // v režimu preview prosvítá plynulý gradient .deed-preview-stage bez viditelného švu pod .preview-hud
    if (!isPreview) {
      const bgGrad = c.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#113e2b');
      bgGrad.addColorStop(0.56, '#072016');
      bgGrad.addColorStop(1, '#03100b');
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, w, h);
    }

    // Měkká středová záře reagující na proměnu skutku i na hover anticipaci
    const auraAlpha = isPreview ? 0.15 + p * 0.48 : 0.10 + p * 0.16 + burstEnergy * 0.14;
    drawGlow(c, cx, cy + 2, Math.min(104, w * 0.36), cs[0] || '#34d399', auraAlpha);

    // Jemný horizont krajiny u paty scény
    c.fillStyle = 'rgba(2, 12, 8, 0.55)';
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, by + 2);
    c.quadraticCurveTo(cx * 0.55, by - 2, cx, by + 1);
    c.quadraticCurveTo(cx * 1.45, by + 4, w, by + 1);
    c.lineTo(w, h);
    c.closePath();
    c.fill();

    // Světlušky v pozadí
    const time = red ? 0 : frame * 0.025;
    for (const s of stars) {
      const op = red ? 0.32 : 0.18 + 0.42 * (0.5 + 0.5 * Math.sin(time * 1.4 + s.phase));
      c.fillStyle = s.col;
      c.globalAlpha = op;
      c.beginPath();
      c.arc(s.nx * w, s.ny * h, s.r, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1.0;

    // Vykreslení 2fázové poetické scény skutku (responzivní měřítko zvlášť pro galerijní PC a kompaktní mobil)
    if (isPreview) {
      const previewScale = currentCssH < 72 ? 0.88 : 0.96;
      c.save();
      c.translate(cx, by - 1);
      c.scale(previewScale, previewScale);
      c.translate(-cx, -by);
      drawPoeticDeedScene(c, mode, p, time, cx, cy, by, w, h, cs, red, frame, gx, py);
      c.restore();
    } else {
      drawPoeticDeedScene(c, mode, p, time, cx, cy, by, w, h, cs, red, frame, gx, py);
    }

    // Dotykové kruhy na plátně odměny
    if (!isPreview) {
      for (const rip of ripples) {
        c.save();
        c.beginPath();
        c.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        c.strokeStyle = cs[0] || '#38bdf8';
        c.globalAlpha = rip.alpha;
        c.lineWidth = 1.5;
        c.stroke();
        c.restore();
      }
    }

    c.restore();

    // Automatické uspání smyčky po ustálení animace (nulová spotřeba baterie v klidu)
    const settled = isPreview
      ? Math.abs(previewP - targetPreviewP) < 0.002
      : ripples.length === 0 &&
      burstEnergy <= 0.01 &&
      (isClimax ? transitionProgress >= 1.0 : transitionProgress >= 0.25 && frame > 80);

    if (red && !force) {
      isRunning = false;
      return;
    }

    if (settled) {
      idleFrames += step;
      if (idleFrames > 90 && !force) {
        isRunning = false;
        return;
      }
    } else {
      idleFrames = 0;
    }

    if (isRunning && !force) {
      id = scheduleFrame((nextNow) => fn(false, nextNow));
      if (!id) isRunning = false;
    }
  };

  const wakeUpLoop = () => {
    idleFrames = 0;
    lastNow = -1;
    if (!isRunning && isVisible && !red) {
      isRunning = true;
      id = scheduleFrame((nextNow) => fn(false, nextNow));
      if (!id) isRunning = false;
    }
  };

  let io = null;
  if (win() && typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry?.isIntersecting ?? true;
        if (isVisible) {
          wakeUpLoop();
        } else {
          isRunning = false;
          cancelFrame(id);
        }
      },
      { threshold: 0.05 }
    );
    io.observe(cv);
  } else {
    isVisible = true;
    wakeUpLoop();
  }

  // Okamžité synchronní vykreslení prvního snímku bez čekání na IntersectionObserver
  fn(true);

  const cleanup = () => {
    cancelFrame(id);
    io?.disconnect();
    ro?.disconnect();
    if (!isPreview) {
      if (controller) activeControllers.delete(controller);
      delete cv.__triggerBurst;
      if (onDown) cv?.removeEventListener?.('pointerdown', onDown);
      cv?.removeAttribute?.('data-molly-mini');
      cv?.removeAttribute?.('data-molly-treat');
      cv?.removeAttribute?.('data-molly-arcs');
    }
  };

  cleanup.setPrimed = (val) => {
    const next = Boolean(val);
    if (next !== isPrimed) {
      isPrimed = next;
      wakeUpLoop();
      if (red || !isVisible) {
        fn(true);
      }
    }
  };

  return cleanup;
}
