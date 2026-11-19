/**
 * Partner Return Service.
 * Tracks when a user opens an external action link (e.g. Click and Feed, Missing Maps, Darujme.cz)
 * and detects when they return to celebrate the completed micro-action.
 */

import { safeGetItem, safeSetItem, AA_PARTNER_RETURN_KEY } from '../../../storage/index.js';

const RK = AA_PARTNER_RETURN_KEY;
const win = () => typeof window !== 'undefined';

/** @typedef {import('../../../types').PartnerReturnState} PartnerReturnRecord */

/** @type {PartnerReturnRecord | null} */
let mem = null;

const sync = (/** @type {PartnerReturnRecord | null} */ r) => {
  mem = r;
  const s = JSON.stringify(r);
  if (win()) {
    safeSetItem(RK, s, 'session');
    safeSetItem(RK, s, 'local');
  }
};

/**
 * Saves a pending external partner visit before navigating out.
 * @param {{ id?: string, title?: string, name?: string, category?: string, kind?: string, values?: string[], [key: string]: unknown } | null | undefined} a Action object
 * @param {string} [surface='home']
 */
export const savePendingPartnerReturn = (a, surface = 'home') =>
  a &&
  sync({
    id: a.id,
    title: a.title || a.name,
    category: a.category || a.kind,
    values: a.values,
    surface,
    ts: Date.now()
  });

/**
 * Reads the pending partner record from in-memory cache or persistent storage.
 * @returns {PartnerReturnRecord | null}
 */
export function readPendingPartnerRecord() {
  let stored = null;
  if (win()) {
    try {
      stored = JSON.parse(
        safeGetItem(RK, 'session') || safeGetItem(RK, 'local') || 'null'
      );
    } catch { }
  }
  return mem || stored;
}

/**
 * Checks whether a pending partner return matches optional surface filtering.
 * @param {PartnerReturnRecord | null | undefined} r
 * @param {{ surfacePrefix?: string, surfaces?: string[], allowEmptySurface?: boolean }} [opts]
 * @returns {boolean}
 */
function matchesSurfaceFilter(r, opts) {
  if (!opts) return true;
  const surface = typeof r?.surface === 'string' ? r.surface : '';
  if (opts.surfacePrefix) {
    if (surface === opts.surfacePrefix || surface.startsWith(`${opts.surfacePrefix}_`)) return true;
    return !surface && Boolean(opts.allowEmptySurface);
  }
  if (Array.isArray(opts.surfaces)) {
    if (surface && opts.surfaces.includes(surface)) return true;
    return !surface && Boolean(opts.allowEmptySurface);
  }
  return true;
}

/**
 * If a pending partner return exists and is younger than `minDelayMs`,
 * returns the remaining milliseconds to wait so the caller can schedule a timer.
 * Note: Under Phase 3 zero-delay specification, minDelayMs defaults to 0 (no artificial wait).
 * @param {number} [minDelayMs=0]
 * @param {{ surfacePrefix?: string, surfaces?: string[], allowEmptySurface?: boolean }} [opts]
 * @returns {number} 0 if none or already eligible/expired
 */
export function getPendingPartnerReturnRemainingMs(minDelayMs = 0, opts = undefined) {
  const r = readPendingPartnerRecord();
  if (!r || r.consumed || !r.ts || !matchesSurfaceFilter(r, opts)) return 0;
  const dt = Date.now() - r.ts;
  if (minDelayMs > 0 && dt >= 0 && dt < minDelayMs) {
    return Math.max(50, minDelayMs - dt + 30);
  }
  return 0;
}

/**
 * Consumes the pending partner return immediately without artificial delay (between 0 and 30 minutes).
 * @param {number} [m=0] Minimum elapsed milliseconds (defaults to 0 for instant celebration)
 * @param {{ surfacePrefix?: string, surfaces?: string[], allowEmptySurface?: boolean }} [opts]
 * @returns {(PartnerReturnRecord & { elapsedMs: number }) | null} Consumed record with elapsedMs, or null if ineligible
 */
export function consumePendingPartnerReturn(m = 0, opts = undefined) {
  const r = readPendingPartnerRecord();
  const dt = r ? Date.now() - (r.ts || 0) : 0;
  if (!r || r.consumed || !matchesSurfaceFilter(r, opts) || dt < m || dt > 18e5) return null;
  sync({ ...r, consumed: 1 });
  return { ...r, consumed: true, elapsedMs: dt };
}

/**
 * Checks and immediately consumes any pending partner return upon tab/window focus.
 * @param {{ surfacePrefix?: string, surfaces?: string[], allowEmptySurface?: boolean }} [opts]
 * @returns {(PartnerReturnRecord & { elapsedMs: number }) | null}
 */
export function checkImmediatePartnerReturn(opts = undefined) {
  return consumePendingPartnerReturn(0, opts);
}
