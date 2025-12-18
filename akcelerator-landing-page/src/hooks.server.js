/**
 * Global security headers for all responses.
 * Complements vercel.json static headers; runs during SSR too.
 */
export async function handle({ event, resolve }) {
  const response = await resolve(event, {
    filterSerializedResponseHeaders: (name) => name.toLowerCase() === 'content-type'
  });

  const headers = new Headers(response.headers);
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-DNS-Prefetch-Control', 'off');
  headers.set('X-Download-Options', 'noopen');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Ensure frame-ancestors matches CSP policy
  const csp = headers.get('Content-Security-Policy');
  if (csp && !/frame-ancestors/.test(csp)) {
    headers.set('Content-Security-Policy', `${csp}; frame-ancestors 'self'`);
  }

  return new Response(response.body, {
    status: response.status,
    headers
  });
}


