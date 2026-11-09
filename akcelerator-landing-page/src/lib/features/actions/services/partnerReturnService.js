/**
 * Partner Return Service.
 * Tracks when a user opens an external action link (e.g. Click and Feed, Missing Maps, Darujme.cz)
 * and detects when they return to celebrate the completed micro-action.
 */

import { safeGetItem, safeSetItem } from '../../../utils.js';

const RK = 'aa_pending_return_v1';
const win = () => typeof window !== 'undefined';

/** @type {any} */
let mem = null;

const sync = (/** @type {any} */ r) => {
  mem = r;
  const s = JSON.stringify(r);
  if (win()) {
    safeSetItem(RK, s, 'session');
    safeSetItem(RK, s, 'local');
  }
};

/**
 * Saves a pending external partner visit before navigating out.
 * @param {any} a Action object
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
 * @returns {any}
 */
export function readPendingPartnerRecord() {
  let stored = null;
  if (win()) {
    try {
      stored = JSON.parse(
        safeGetItem(RK, 'session') || safeGetItem(RK, 'local') || 'null'
      );
    } catch {}
  }
  return mem || stored;
}

/**
 * If a pending partner return exists and is younger than `minDelayMs`,
 * returns the remaining milliseconds to wait so the caller can schedule a timer (M25 / AUDIT #35).
 * @param {number} [minDelayMs=3000]
 * @returns {number} 0 if none or already eligible/expired
 */
export function getPendingPartnerReturnRemainingMs(minDelayMs = 3e3) {
  const r = readPendingPartnerRecord();
  if (!r || r.consumed || !r.ts) return 0;
  const dt = Date.now() - r.ts;
  if (dt >= 0 && dt < minDelayMs) {
    return Math.max(50, minDelayMs - dt + 30);
  }
  return 0;
}

/**
 * Consumes the pending partner return if elapsed time is between minDelay and 30 minutes.
 * @param {number} [m=3000] Minimum elapsed milliseconds
 * @returns {any | null} Consumed record with elapsedMs, or null if ineligible
 */
export function consumePendingPartnerReturn(m = 3e3) {
  const r = readPendingPartnerRecord();
  const dt = r ? Date.now() - (r.ts || 0) : 0;
  if (!r || r.consumed || dt < m || dt > 18e5) return null;
  sync({ ...r, consumed: 1 });
  return { ...r, consumed: true, elapsedMs: dt };
}
