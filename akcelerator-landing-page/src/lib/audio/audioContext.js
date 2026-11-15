/**
 * Shared AudioContext singleton, gesture-driven unlock, and persistent mute state.
 * Shared across the entire app so all pages and components honor a single mute preference.
 */

import { safeGetItem, safeSetItem, AA_SOUND_MUTED_KEY } from '../storage/index.js';

const MK = AA_SOUND_MUTED_KEY;
const win = () => typeof window !== 'undefined';

/** @type {AudioContext | null} */
let ac = null;
let hasUserGesture = false;

if (win()) {
  const onGesture = () => {
    hasUserGesture = true;
    if (ac && ac.state === 'suspended') {
      ac.resume().catch(() => {});
    }
  };
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach((evt) => {
    window.addEventListener(evt, onGesture, { capture: true, once: true, passive: true });
  });
}

/**
 * Explicitly marks that a user interaction has occurred and unlocks audio.
 */
export function markUserGesture() {
  hasUserGesture = true;
  if (ac && ac.state === 'suspended') {
    ac.resume().catch(() => {});
  }
}

/**
 * Checks whether global app sounds are muted by user preference.
 * @returns {boolean}
 */
export const isSoundMuted = () => win() && safeGetItem(MK, 'local') === '1';

/**
 * Resolves or creates the AudioContext singleton and attempts unlock if suspended.
 * Returns null in SSR, when sound is muted, or before an explicit user gesture.
 * @returns {AudioContext | null}
 */
export function getAudioContext() {
  if (!win() || isSoundMuted() || !hasUserGesture) return null;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
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
  markUserGesture();
  const n = !isSoundMuted();
  safeSetItem(MK, n ? '1' : '0', 'local');
  if (!n && unmuteFeedbackHook) {
    try {
      unmuteFeedbackHook();
    } catch {}
  }
  return n;
};
