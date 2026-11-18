/**
 * Action effect spec resolver and metadata provider.
 */

import { resolveMollyTreat } from '../../mollyTypes.js';
import { registerActionSpecResolver } from '../../audio/presets.js';
import {
  ACTION_EFFECT_CATALOG,
  VOLUNTEER_EFFECT_SPEC,
  MODE_LOOKUP
} from './actionCatalog.js';

export { ACTION_EFFECT_CATALOG, VOLUNTEER_EFFECT_SPEC, MODE_LOOKUP };

/** @type {((action: unknown, opts?: unknown) => unknown) | null} */
export let mollySparkNotifier = null;

/**
 * Registers the Molly spark callback without creating a circular top-level import (M13 / AUDIT #3).
 * @param {(action: unknown, opts?: unknown) => unknown} fn
 */
export function registerMollyNotifier(fn) {
  mollySparkNotifier = typeof fn === 'function' ? fn : null;
}

export const isAnimalAction = (a) =>
  /zvirata_utulek_online|donio_utulky|click[-_]and[-_]feed|utulek|útulk|misk/i.test(
    `${a?.id || ''} ${a?.category || ''} ${a?.kind || ''} ${a?.subcategory || ''} ${a?.title || ''} ${a?.name || ''}`
  );

export function resolveActionEffectSpec(action) {
  if (!action) return ACTION_EFFECT_CATALOG.zvirata_utulek_online;
  if (typeof action === 'string') {
    if (ACTION_EFFECT_CATALOG[action]) return ACTION_EFFECT_CATALOG[action];
    if (MODE_LOOKUP[action]) return MODE_LOOKUP[action];
    if (action === 'kibble') return ACTION_EFFECT_CATALOG.zvirata_utulek_online;
  }
  const id = String(action?.id || '').trim();
  if (id && ACTION_EFFECT_CATALOG[id]) {
    return ACTION_EFFECT_CATALOG[id];
  }
  if (action?.mode && MODE_LOOKUP[action.mode]) {
    return MODE_LOOKUP[action.mode];
  }
  if (isAnimalAction(action)) {
    return ACTION_EFFECT_CATALOG.zvirata_utulek_online;
  }
  const hay = `${id} ${action?.category || ''} ${action?.kind || ''} ${action?.subcategory || ''} ${action?.title || ''} ${action?.name || ''} ${(action?.values || []).join(' ')}`.toLowerCase();
  if (/knihobud/.test(hay)) return ACTION_EFFECT_CATALOG.knihobudka_kniha;
  if (/šatník|satnik|oblečen|nevyhazuj/.test(hay)) return ACTION_EFFECT_CATALOG.nevyhazujto_sousedum;
  if (/naděje|nadeje|nocleh|azyl|bezdomov/.test(hay)) return ACTION_EFFECT_CATALOG.nadeje_jidlo;
  if (/potravin|jídlo|jidlo|polévk|banka|food/.test(hay)) return ACTION_EFFECT_CATALOG.potravinova_banka;
  if (/senior|život 90|zivot90|babič|děd|elderly/.test(hay)) return ACTION_EFFECT_CATALOG.letters_seniors;
  if (/ptáč|ptac|strnad|ornitol/.test(hay)) return ACTION_EFFECT_CATALOG.birdlife_ptaci_pasti;
  if (/studánk|pramen|vod/.test(hay)) return ACTION_EFFECT_CATALOG.estudanky_pramen;
  if (/strom|les|sáz|přírod|environment|nature/.test(hay)) return ACTION_EFFECT_CATALOG.sazime_budoucnost;
  if (/krev|dřeň|záchran|nemoc|health/.test(hay)) return ACTION_EFFECT_CATALOG.darovani_krve;
  if (/douč|vzděl|škol|education|knowledge/.test(hay)) return ACTION_EFFECT_CATALOG.ucime_online;
  if (action?.element === 'animals') return ACTION_EFFECT_CATALOG.zvirata_utulek_online;
  if (action?.element === 'nature') return ACTION_EFFECT_CATALOG.sazime_budoucnost;
  if (action?.element === 'knowledge') return ACTION_EFFECT_CATALOG.wikipedie_cz;
  if (action?.element === 'community') return ACTION_EFFECT_CATALOG.letters_seniors;
  if (/komunit|community|soused/.test(hay)) return ACTION_EFFECT_CATALOG.knihobudka_kniha;
  // Místa z mapy (/near) a obecné dobrovolnictví: nabídnutá pomocná ruka, ne „% pro terénní péči“
  if (/dobrovol|volunt/.test(hay) || action?.category === 'ngo') {
    return VOLUNTEER_EFFECT_SPEC;
  }
  return ACTION_EFFECT_CATALOG.charita_dar;
}

export function getActionEffectMeta(action, currentVal, opts = {}) {
  const spec = resolveActionEffectSpec(action);
  const val =
    !spec.staticMetric &&
      !opts.isReturnStrip &&
      typeof currentVal === 'number' &&
      currentVal > 0
      ? Math.min(currentVal, spec.target)
      : spec.target;
  const badge = spec.format(val);
  const isKibble = spec.mode === 'kibble' || spec.mode === 'shelter_care';
  const returnBadge = isKibble ? badge : `${badge} · Světelná stopa`;
  const mollyTreat = spec.mollyTreat || resolveMollyTreat(spec);
  return {
    ...spec,
    scene: spec.mode,
    value: val,
    badge: opts.isReturnStrip ? returnBadge : badge,
    returnBadge,
    mollyTreat
  };
}

// Connect audio preset resolver to action catalog
registerActionSpecResolver(resolveActionEffectSpec);
