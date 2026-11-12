import { writable } from 'svelte/store';
import { safeText, haversineKm } from './validation.js';

export { safeText, haversineKm };

/** @type {Map<string, string>} */
const MEMORY_LOCAL = new Map();
/** @type {Map<string, string>} */
const MEMORY_SESSION = new Map();

/**
 * Safely resolves window.localStorage or window.sessionStorage inside try/catch
 * so browsers with "Block all cookies" or strict In-App WebViews never throw SecurityError (H2).
 * @param {'local' | 'session'} [kind='local']
 * @returns {Storage | null}
 */
function resolveNativeStorage(kind = 'local') {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Checks whether native localStorage is accessible and persistent.
 * @returns {boolean}
 */
export function isStoragePersistent() {
  const s = resolveNativeStorage('local');
  if (!s) return false;
  try {
    const probeKey = '__aa_storage_probe__';
    s.setItem(probeKey, '1');
    s.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely reads a key from localStorage or sessionStorage with in-memory fallback (H2).
 * @param {string} key
 * @param {'local' | 'session'} [kind='local']
 * @returns {string | null}
 */
export function safeGetItem(key, kind = 'local') {
  const mem = kind === 'session' ? MEMORY_SESSION : MEMORY_LOCAL;
  const native = resolveNativeStorage(kind);
  if (native) {
    try {
      const val = native.getItem(key);
      if (val !== null) return val;
    } catch {
      // Fall through to in-memory map
    }
  }
  return mem.has(key) ? (mem.get(key) ?? null) : null;
}

/**
 * Safely writes a key to localStorage or sessionStorage with in-memory fallback (H2).
 * @param {string} key
 * @param {string} value
 * @param {'local' | 'session'} [kind='local']
 */
export function safeSetItem(key, value, kind = 'local') {
  const strVal = String(value);
  const mem = kind === 'session' ? MEMORY_SESSION : MEMORY_LOCAL;
  mem.set(key, strVal);
  const native = resolveNativeStorage(kind);
  if (native) {
    try {
      native.setItem(key, strVal);
    } catch {
      // Stored in memory fallback
    }
  }
}

/**
 * Safely removes a key from localStorage or sessionStorage and in-memory fallback (H2).
 * @param {string} key
 * @param {'local' | 'session'} [kind='local']
 */
export function safeRemoveItem(key, kind = 'local') {
  const mem = kind === 'session' ? MEMORY_SESSION : MEMORY_LOCAL;
  mem.delete(key);
  const native = resolveNativeStorage(kind);
  if (native) {
    try {
      native.removeItem(key);
    } catch {
      // Ignore
    }
  }
}

/**
 * Detects whether the user is browsing inside an ephemeral social-media In-App WebView (M18).
 * @returns {boolean}
 */
export function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Instagram|FBAN|FBAV|FB_IAB|BytedanceWebview| musical_ly|TikTok|LinkedInApp|Line\/|Twitter|MicroMessenger/i.test(
    ua
  );
}

/**
 * Strips leading emoji clusters (including ZWJ sequences like 🧑‍🏫, 💇‍♀️, flags, and skin tones)
 * from an action title (M22 / AUDIT #31).
 * @param {unknown} raw
 * @returns {string}
 */
export function stripLeadingEmoji(raw) {
  return String(raw || '')
    .replace(
      /^(\s*(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}\u2600-\u27BF\uFE0E\uFE0F\u200D\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}])+)+/gu,
      ''
    )
    .trim();
}

/**
 * Alias for stripLeadingEmoji used across UI components (M22 / AUDIT #31).
 * @param {unknown} raw
 * @returns {string}
 */
export function cleanTitle(raw) {
  return stripLeadingEmoji(raw);
}

/**
 * Strips all emoji characters from a metadata string and collapses whitespace (M22).
 * @param {unknown} str
 * @returns {string}
 */
export function cleanMeta(str) {
  return String(str || '')
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D\u2640\u2642]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Normalizes a string for diacritics-insensitive Czech search (M22 / AUDIT #31).
 * @param {unknown} str
 * @returns {string}
 */
export function normSearchStr(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Extracts the first comma-separated segment of a string (M22 / AUDIT #31).
 * @param {unknown} v
 * @returns {string}
 */
export function firstText(v) {
  const s = safeText(v);
  if (!s) return '';
  return (s.split(',')[0] || '').trim();
}

/**
 * Reactive stores for opening/closing FeedbackModal and ImmediateHelp without fragile
 * window CustomEvents during SSR hydration (M21 / AUDIT #30).
 */
export const isFeedbackOpen = writable(false);
export const feedbackPrefill = writable('');
export const isCrisisOpen = writable(false);

/**
 * Opens the FeedbackModal optionally pre-filled with text or { title, prefill }.
 * @param {string | { title?: string, prefill?: string }} [prefillOrOpts='']
 */
export function openFeedbackModal(prefillOrOpts = '') {
  if (typeof prefillOrOpts === 'string' && prefillOrOpts.trim()) {
    feedbackPrefill.set(prefillOrOpts.trim());
  } else if (prefillOrOpts && typeof prefillOrOpts === 'object') {
    feedbackPrefill.set(
      /** @type {any} */ ({
        title: prefillOrOpts.title || '💬 Zpětná vazba',
        prefill: prefillOrOpts.prefill || ''
      })
    );
  }
  isFeedbackOpen.set(true);
}

export function closeFeedbackModal() {
  isFeedbackOpen.set(false);
}

export function toggleCrisisModal() {
  isCrisisOpen.update((v) => !v);
}

export function openCrisisModal() {
  isCrisisOpen.set(true);
}

export function closeCrisisModal() {
  isCrisisOpen.set(false);
}

/**
 * Encodes a compact, portable Base64URL backup code of the user's progress (M18 / AUDIT #26).
 * @param {Record<string, any>} payload
 * @returns {string}
 */
export function exportProgressPasscode(payload) {
  try {
    const jsonStr = JSON.stringify({ v: 1, ...payload });
    const bytes = new TextEncoder().encode(jsonStr);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `AA1-${b64}`;
  } catch {
    return '';
  }
}

/**
 * Decodes a portable Base64URL backup code produced by exportProgressPasscode (M18 / AUDIT #26).
 * @param {string} code
 * @returns {Record<string, any> | null}
 */
export function importProgressPasscode(code) {
  try {
    const cleaned = String(code || '').trim().replace(/^AA1-/i, '');
    if (!cleaned || cleaned.length > 16_384) return null;
    const b64 = cleaned.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const bin = atob(b64 + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}
