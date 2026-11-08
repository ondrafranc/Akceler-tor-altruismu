/**
 * Global security headers for all SSR and API responses.
 * HTML responses with per-request CSP nonces are marked private/no-store so shared CDNs
 * never serve a static reusable nonce across visitors (H1).
 */
export async function handle({ event, resolve }) {
  const response = await resolve(event, {
    filterSerializedResponseHeaders: (name) => name.toLowerCase() === 'content-type'
  });

  const headers = new Headers(response.headers);
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-DNS-Prefetch-Control', 'off');
  headers.set('X-Download-Options', 'noopen');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  const csp = headers.get('Content-Security-Policy');
  if (csp && !/frame-ancestors/.test(csp)) {
    headers.set('Content-Security-Policy', `${csp}; frame-ancestors 'none'`);
  }

  if (
    event.request.method === 'GET' &&
    response.status === 200 &&
    !event.url.pathname.startsWith('/api/') &&
    !headers.has('cache-control') &&
    (headers.get('content-type') || '').includes('text/html')
  ) {
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  }

  return new Response(response.body, {
    status: response.status,
    headers
  });
}
