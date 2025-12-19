import { browser, dev } from '$app/environment';

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


