import { browser, dev } from '$app/environment';
import { writable, get } from 'svelte/store';
import {
  safeGetItem,
  safeSetItem,
  cleanTitle as canonicalCleanTitle,
  openFeedbackModal
} from './utils.js';

let _track = null;
/** @type {Promise<null | ((name: string, data?: Record<string, any>) => void)> | null} */
let _trackPromise = null;

async function getTrack() {
  if (_track) return _track;
  if (_trackPromise) return _trackPromise;

  _trackPromise = import('@vercel/analytics')
    .then((m) => m.track)
    .catch(() => null)
    .then((t) => {
      _track = t;
      return t;
    });

  return _trackPromise;
}

/**
 * Minimal, privacy-safe analytics helper.
 * - No-ops in dev or during SSR
 * - Avoids capturing lat/lon or other PII
 *
 * @param {string} name
 * @param {Record<string, any>=} data
 */
export function trackEvent(name, data = undefined) {
  if (!browser || dev) return;

  try {
    // If the global `va()` API is available (loaded by Vercel Web Analytics), prefer it.
    if (typeof window?.va === 'function') {
      if (data && Object.keys(data).length) window.va('event', { name, data });
      else window.va('event', { name });
      return;
    }
  } catch {
    // ignore
  }

  // Fallback to importing `track()` from @vercel/analytics
  getTrack().then((t) => {
    try {
      t?.(name, data || {});
    } catch {
      // ignore
    }
  });
}

const STARTED_STORAGE_KEY = 'aa_started_actions_v1';
const FUNNEL_STORAGE_KEY = 'aa_funnel_counts_v1';

function loadStartedIds() {
  if (!browser) return [];
  try {
    const raw =
      safeGetItem(STARTED_STORAGE_KEY, 'session') || safeGetItem(STARTED_STORAGE_KEY, 'local');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveStartedIds(ids) {
  if (!browser) return;
  try {
    const serialized = JSON.stringify(ids.slice(-100));
    safeSetItem(STARTED_STORAGE_KEY, serialized, 'session');
    safeSetItem(STARTED_STORAGE_KEY, serialized, 'local');
  } catch {}
}

/**
 * Reactive list of action IDs where the user genuinely initiated the step
 * (clicked through to the partner organization or copied a contact template).
 * Distinguishes real initiation from blind self-reported clicks (Critique 3.1 & 8.3).
 */
export const startedActionIds = writable(loadStartedIds());

/**
 * Funnel stage counters for product telemetry (Critique 8.3):
 * intent_selected -> recommendation_shown -> action_started -> action_completed_self_reported -> reflection_saved -> real_world_conversion
 */
export const funnelCounts = writable({
  intent_selected: 0,
  recommendation_shown: 0,
  action_started: 0,
  action_completed_self_reported: 0,
  reflection_saved: 0,
  real_world_conversion: 0
});

if (browser) {
  try {
    const raw = safeGetItem(FUNNEL_STORAGE_KEY, 'local');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        funnelCounts.update((curr) => ({ ...curr, ...parsed }));
      }
    }
  } catch {}
}

/**
 * Tracks a product funnel milestone (Critique 8.3).
 * @param {'intent_selected' | 'recommendation_shown' | 'action_started' | 'action_completed_self_reported' | 'reflection_saved' | 'real_world_conversion'} stage
 * @param {Record<string, any>=} data
 */
export function trackFunnel(stage, data = {}) {
  funnelCounts.update((curr) => {
    const next = { ...curr, [stage]: (curr[stage] || 0) + 1 };
    if (browser) {
      try {
        safeSetItem(FUNNEL_STORAGE_KEY, JSON.stringify(next), 'local');
      } catch {}
    }
    return next;
  });

  trackEvent(`aa_funnel_${stage}`, data);
}

/**
 * Records that the user genuinely initiated an action (opened partner URL or copied contact message).
 * @param {string} id
 * @param {(string | Record<string, any>)=} meta
 */
export function markActionStarted(id, meta = {}) {
  if (!id) return;
  startedActionIds.update((list) => {
    if (list.includes(id)) return list;
    const next = [...list, id];
    saveStartedIds(next);
    return next;
  });

  const payload =
    typeof meta === 'string'
      ? { id, surface: meta }
      : meta && typeof meta === 'object'
        ? { id, ...meta }
        : { id };

  trackFunnel('action_started', payload);
  trackEvent('aa_clickout', payload);
}

/**
 * Checks whether an action has been initiated in this browser.
 * @param {string} id
 */
export function hasActionStarted(id) {
  if (!id) return false;
  return get(startedActionIds).includes(id);
}

/**
 * Store to trigger the global FeedbackModal pre-filled with a broken/outdated link report (Critique 7).
 * @type {import('svelte/store').Writable<{ open: boolean, title: string, prefill: string } | null>}
 */
export const feedbackReportRequest = writable(null);

/**
 * Opens the FeedbackModal pre-filled to report a broken link or outdated activity.
 * @param {{ id?: string, title?: string, url?: string, org?: string }} item
 */
export function openBrokenLinkReport(item = {}) {
  const cleaned = canonicalCleanTitle(item?.title || item?.org || 'aktivita') || 'aktivita';
  const urlPart = item?.url ? ` (${item.url})` : '';
  const prefill = `Hlášení k aktivitě „${cleaned}“${urlPart}: odkaz nefunguje nebo jsou informace zastaralé. `;
  feedbackReportRequest.set({
    open: true,
    title: 'Nahlásit nefunkční nebo zastaralý údaj',
    prefill
  });
  openFeedbackModal(prefill);
  trackEvent('aa_report_broken_link', { id: item?.id || cleaned });
}
