/**
 * Shared AudioContext singleton, gesture-driven unlock, and persistent mute state.
 * Shared across the entire app so all pages and components honor a single mute preference.
 */

import { safeGetItem, safeSetItem } from '../utils.js';

const MK = 'aa_sound_muted';
const win = () => typeof window !== 'undefined';

/** @type {AudioContext | null} */
let ac = null;

/**
 * Checks whether global app sounds are muted by user preference.
 * @returns {boolean}
 */
export const isSoundMuted = () => win() && safeGetItem(MK, 'local') === '1';

/**
 * Resolves or creates the AudioContext singleton and attempts unlock if suspended.
 * Returns null in SSR or when sound is muted.
 * @returns {AudioContext | null}
 */
export function getAudioContext() {
  if (!win() || isSoundMuted()) return null;
  try {
    const AudioCtx = /** @type {any} */ (window).AudioContext || /** @type {any} */ (window).webkitAudioContext;
    if (!AudioCtx) return null;
    ac = ac || new AudioCtx();
    if (ac.state === 'suspended') {
      ac.resume().catch(() => {});
    }
    return ac;
  } catch {
    return null;
  }
}

/**
 * Callback hook for unmute auditory feedback (registered by synthesizer).
 * @type {(() => void) | null}
 */
let unmuteFeedbackHook = null;

/**
 * Registers an auditory feedback callback when sound is unmuted.
 * @param {() => void} hook
 */
export function registerUnmuteFeedbackHook(hook) {
  unmuteFeedbackHook = typeof hook === 'function' ? hook : null;
}

/**
 * Toggles global sound mute preference and saves to local storage.
 * @returns {boolean} true if now muted, false if now unmuted
 */
export const toggleSoundMuted = () => {
  const n = !isSoundMuted();
  safeSetItem(MK, n ? '1' : '0', 'local');
  if (!n && unmuteFeedbackHook) {
    try {
      unmuteFeedbackHook();
    } catch {}
  }
  return n;
};
