import { safeGetItem, AA_DONE_FOR_TODAY_PREFIX } from '../../../storage/index.js';

/**
 * Klíč místního kalendářního dne (`RRRR-MM-DD`), pod kterým se ukládá uzavření dne.
 * @param {Date} [now]
 * @returns {string}
 */
export function getTodayKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Zda si uživatel dnešek už uzavřel („Pro dnešek máš hotovo“).
 * @returns {boolean}
 */
export function isDayClosedToday() {
  try {
    return safeGetItem(`${AA_DONE_FOR_TODAY_PREFIX}${getTodayKey()}`, 'local') === '1';
  } catch {
    return false;
  }
}
