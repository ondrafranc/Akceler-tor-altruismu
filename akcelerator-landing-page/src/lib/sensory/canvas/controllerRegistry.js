/**
 * Payoff Canvas Controller Registry.
 * Tracks active canvas payoff instances and routes burst impulses.
 */

import { resolveActionEffectSpec } from '../catalog/catalogResolver.js';

/** @type {Set<import('../../types/sensory.js').ImpactCanvasController>} */
export const activeControllers = new Set();

/**
 * @param {import('../../types/sensory.js').CanvasBurstTarget | null} [actionOrCanvas=null]
 * @param {boolean} [superBurst=true]
 */
export function triggerCanvasBurst(actionOrCanvas = null, superBurst = true) {
  const isBool = typeof superBurst === 'boolean';
  const sb = isBool ? superBurst : true;
  if (actionOrCanvas && typeof actionOrCanvas.__triggerBurst === 'function') {
    actionOrCanvas.__triggerBurst(sb);
    return;
  }
  if (actionOrCanvas && typeof actionOrCanvas === 'object') {
    const targetSpec = resolveActionEffectSpec(actionOrCanvas);
    let matched = false;
    activeControllers.forEach((ctrl) => {
      if (ctrl.spec?.mode === targetSpec.mode) {
        ctrl.triggerBurst?.(sb);
        matched = true;
      }
    });
    if (matched) return;
  }
  activeControllers.forEach((ctrl) => {
    ctrl.triggerBurst?.(sb);
  });
}
