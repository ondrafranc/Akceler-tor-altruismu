import { writable } from 'svelte/store';
import { safeText, haversineKm } from './validation.js';

export {
  safeText,
  haversineKm
};

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
/** @type {import('svelte/store').Writable<string | { title?: string, prefill?: string }>} */
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
    feedbackPrefill.set({
      title: prefillOrOpts.title || '💬 Zpětná vazba',
      prefill: prefillOrOpts.prefill || ''
    });
  }
  isFeedbackOpen.set(true);
}

export function closeFeedbackModal() {
  isFeedbackOpen.set(false);
}

export function toggleCrisisModal() {
  isCrisisOpen.update((v) => !v);
}

/**
 * Encodes a compact, portable Base64URL backup code of the user's progress (M18 / AUDIT #26).
 * @param {Record<string, unknown>} payload
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
 * @returns {Record<string, unknown> | null}
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
