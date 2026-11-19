/**
 * Svelte action directive for impact canvas.
 * Manages action identity caching and ASMR sound triggering on mount.
 */

import { resolveActionEffectSpec } from '../catalog/catalogResolver.js';
import { playPayoffAsmr } from '../../audio/presets.js';
import { mountImpactCanvas } from './impactCanvasEngine.js';

export function getActionIdentityKey(p) {
  const action = p?.action !== undefined ? p.action : p;
  const flags = `${Boolean(p?.preview)}:${Boolean(p?.climax)}`;
  if (!action) return `default:${flags}`;
  if (typeof action === 'string') return `${action}:${flags}`;
  return `${action.id || ''}:${action.title || action.name || ''}:${action.category || action.kind || ''}:${p?.mode || ''}:${flags}`;
}

/**
 * Svelte action pro připojení 2D Canvas scény a ASMR zvuku k elementu <canvas>.
 * Chrání před zbytečným restartováním plátna při reaktivních aktualizacích rodičovské komponenty.
 */
export function impactCanvas(node, params = {}) {
  let destroy = null;
  let currentKey = '';
  let currentOnMetric = null;

  const setup = (p) => {
    destroy?.();
    const action = p?.action !== undefined ? p.action : p;
    const isPreview = Boolean(p?.preview);
    currentOnMetric = p?.onMetric || p?.onProgress || p?.onWeightUpdate || null;
    currentKey = getActionIdentityKey(p);
    const shouldPlayOnMount =
      !isPreview && (p?.climax !== undefined ? Boolean(p.climax) : !p?.silent);
    const spec = resolveActionEffectSpec(action);
    if (!isPreview) {
      currentOnMetric?.(spec.target, spec.format(spec.target), spec);
      if (shouldPlayOnMount) {
        playPayoffAsmr(action);
      }
    }
    destroy = mountImpactCanvas(node, {
      action,
      mode: spec.mode,
      preview: isPreview,
      primed: Boolean(p?.primed),
      teased: Boolean(p?.teased),
      climax: !isPreview && Boolean(p?.climax),
      onWeightUpdate: isPreview
        ? undefined
        : (val, formatted, s) => {
            currentOnMetric?.(val, formatted, s);
          }
    });
  };

  setup(params);

  return {
    update(nextParams) {
      currentOnMetric =
        nextParams?.onMetric ||
        nextParams?.onProgress ||
        nextParams?.onWeightUpdate ||
        null;
      const nextKey = getActionIdentityKey(nextParams);
      if (nextKey !== currentKey) {
        setup(nextParams);
      } else if (nextParams?.preview) {
        destroy?.setPrimed?.(Boolean(nextParams?.primed));
        destroy?.setTeased?.(Boolean(nextParams?.teased));
      }
    },
    destroy() {
      destroy?.();
    }
  };
}
