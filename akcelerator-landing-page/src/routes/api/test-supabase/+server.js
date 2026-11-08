import { json } from '@sveltejs/kit';
import { GET as feedbackGet, POST as feedbackPost } from '../feedback/+server.js';
import { isAuthorizedTestBypass } from '$lib/security.js';

/**
 * Legacy compatibility endpoint (M2 / AUDIT #22).
 * Production diagnostics are stripped; delegates directly to /api/feedback.
 * @type {import('./$types').RequestHandler}
 */
export async function GET(event) {
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'production' &&
    process.env?.VERCEL_ENV === 'production' &&
    !isAuthorizedTestBypass(event.request)
  ) {
    return json({ success: true, status: 'ok' }, { headers: { 'cache-control': 'no-store' } });
  }
  return feedbackGet(event);
}

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
  return feedbackPost(event);
}
