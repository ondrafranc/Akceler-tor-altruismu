import { json } from '@sveltejs/kit';
import { getNearbyPlaces } from '$lib/server/nearbyService.js';
import {
  toFiniteNumber,
  isValidLatLon,
  checkRateLimit,
  resolveClientKey
} from '$lib/security.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request, getClientAddress }) {
  const lat = toFiniteNumber(url.searchParams.get('lat'));
  const lon = toFiniteNumber(url.searchParams.get('lon'));
  const radiusRaw = toFiniteNumber(url.searchParams.get('radius_m'));
  const radius = radiusRaw !== null ? Math.trunc(radiusRaw) : 5000;
  const kindsRaw = (url.searchParams.get('kinds') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const includeAssociations = url.searchParams.get('include_associations') === '1';

  if (!isValidLatLon(lat, lon)) {
    return json({ error: 'Invalid or missing lat/lon' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }

  const clientKey = resolveClientKey(request, getClientAddress);
  const rl = checkRateLimit('nearby', clientKey, 120, 60_000);
  if (!rl.allowed) {
    return json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'cache-control': 'no-store', 'retry-after': String(rl.retryAfterSec) } }
    );
  }

  const payload = await getNearbyPlaces({
    lat,
    lon,
    radiusM: radius,
    kinds: kindsRaw,
    includeAssociations
  });

  return json(payload, {
    status: 200,
    headers: {
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
