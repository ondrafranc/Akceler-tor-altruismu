/**
 * Hold-to-Spark micro-ritual on primary buttons.
 */

import { prefersReducedMotion, safeVibrate as vib } from '../../core/device.js';
import { tone } from '../../audio/synthesizer.js';
import { getAudioContext } from '../../audio/audioContext.js';
import { triggerCanvasBurst } from '../canvas/controllerRegistry.js';

/**
 * @typedef {object} HoldSparkParams
 * @property {(() => void) | null} [onReady]
 * @property {string | number | null} [id]
 * @property {string} [surface]
 */

/**
 * @param {HTMLElement | null | undefined} el
 * @param {(() => void) | null} [cb]
 * @returns {(rel?: boolean) => void}
 */
export function startHoldSpark(el, cb) {
  const t0 = performance.now();
  const red = prefersReducedMotion();
  /** @param {string} v */
  const sp = (v) => el?.style?.setProperty('--spark-charge', v);
  let id = 0;
  let d = 0;
  vib([10, 20, 40]);
  const g1 = tone(294, 0.68, 'sine', 0, 0.04, 440);
  const g2 = tone(587, 0.68, 'triangle', 0, 0.024, 880);
  /** @param {number} now */
  const step = (now) => {
    const p = red ? 1 : Math.min(1, (now - t0) / 600);
    sp(p.toFixed(2));
    if (p >= 1 && !d) {
      d = 1;
      el?.classList?.add('spark-ready');
      vib([25, 30, 45]);
      tone(587, 0.34, 'sine', 0, 0.042);
      tone(880, 0.38, 'triangle', 0.04, 0.036);
      tone(1174.66, 0.42, 'sine', 0.08, 0.03);
      triggerCanvasBurst(null, true);
      cb?.();
      return;
    }
    if (p < 1) id = requestAnimationFrame(step);
  };
  id = requestAnimationFrame(step);
  return (rel = false) => {
    cancelAnimationFrame(id);
    sp('0');
    el?.classList?.remove('spark-ready');
    try {
      [g1, g2].forEach((g) =>
        g?.gain.setTargetAtTime(0.0001, getAudioContext()?.currentTime || 0, 0.02)
      );
    } catch { }
    if (rel && performance.now() - t0 < 200) {
      tone(659.25, 0.14);
      triggerCanvasBurst(null, false);
    }
  };
}

/**
 * Svelte action pro Hold-to-Spark rituál na libovolném primárním tlačítku / odkazu
 * @param {HTMLElement} node
 * @param {HoldSparkParams} [params]
 * @returns {{ update: (nextParams: HoldSparkParams) => void, destroy: () => void }}
 */
export function holdSpark(node, params = {}) {
  /** @type {((rel?: boolean) => void) | null} */
  let stopFn = null;
  let currentParams = params;
  node.setAttribute('data-hold-spark', 'true');

  /** @param {PointerEvent} e */
  const onDown = (e) => {
    if (e.button && e.button !== 0) return;
    if (stopFn) stopFn(false);
    stopFn = startHoldSpark(node, () => {
      currentParams?.onReady?.();
    });
  };
  const onUp = () => {
    if (stopFn) {
      stopFn(true);
      stopFn = null;
    }
  };
  const onLeave = () => {
    if (stopFn) {
      stopFn(false);
      stopFn = null;
    }
  };

  node.addEventListener('pointerdown', onDown);
  node.addEventListener('pointerup', onUp);
  node.addEventListener('pointerleave', onLeave);
  node.addEventListener('pointercancel', onLeave);
  node.addEventListener('click', onUp);
  node.addEventListener('blur', onLeave);

  return {
    update(nextParams) {
      currentParams = nextParams;
    },
    destroy() {
      if (stopFn) stopFn(false);
      node.removeEventListener('pointerdown', onDown);
      node.removeEventListener('pointerup', onUp);
      node.removeEventListener('pointerleave', onLeave);
      node.removeEventListener('pointercancel', onLeave);
      node.removeEventListener('click', onUp);
      node.removeEventListener('blur', onLeave);
    }
  };
}
