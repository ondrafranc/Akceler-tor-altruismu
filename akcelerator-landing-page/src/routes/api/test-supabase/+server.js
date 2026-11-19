import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { GET as feedbackGet, POST as feedbackPost } from '../feedback/+server.js';
import { checkRateLimit, isAuthorizedTestBypass, resolveClientKey } from '$lib/security.js';

/**
 * @param {string | undefined} hostname
 * @returns {boolean}
 */
function isLocalHostname(hostname) {
  const host = (hostname || '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
}

/**
 * Blocks diagnostics endpoint on Vercel deployments (Production and Preview) and non-local
 * non-dev hosts unless authorized with TEST_BYPASS_SECRET (always false in Vercel Production).
 * @param {import('./$types').RequestEvent} event
 * @returns {boolean}
 */
function isAllowedDiagnosticsRequest(event) {
  if (isAuthorizedTestBypass(event.request)) {
    return true;
  }
  const isVercel =
    typeof process !== 'undefined' &&
    (process.env?.VERCEL === '1' ||
      process.env?.VERCEL_ENV === 'production' ||
      process.env?.VERCEL_ENV === 'preview');
  if (isVercel) {
    return false;
  }
  return dev || isLocalHostname(event.url?.hostname);
}

/**
 * Legacy compatibility endpoint (M2 / AUDIT #22).
 * Disabled in Vercel Production/Preview unless authorized; rate-limited on GET.
 * @type {import('./$types').RequestHandler}
 */
export async function GET(event) {
  if (!isAllowedDiagnosticsRequest(event)) {
    return json(
      { success: false, error: 'Not found' },
      { status: 404, headers: { 'cache-control': 'no-store' } }
    );
  }

  const clientKey = resolveClientKey(event.request, event.getClientAddress);
  const rl = checkRateLimit('test-supabase', clientKey, 20, 60_000);
  if (!rl.allowed) {
    return json(
      { success: false, error: 'Too many requests' },
      {
        status: 429,
        headers: { 'cache-control': 'no-store', 'retry-after': String(rl.retryAfterSec) }
      }
    );
  }

  return feedbackGet(/** @type {import('../feedback/$types').RequestEvent} */ (/** @type {unknown} */ (event)));
}

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
  if (!isAllowedDiagnosticsRequest(event)) {
    return json(
      { success: false, error: 'Not found' },
      { status: 404, headers: { 'cache-control': 'no-store' } }
    );
  }
  return feedbackPost(/** @type {import('../feedback/$types').RequestEvent} */ (/** @type {unknown} */ (event)));
}
