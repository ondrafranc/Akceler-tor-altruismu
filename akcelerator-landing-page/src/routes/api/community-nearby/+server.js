import { json } from '@sveltejs/kit';
import { getNearbyCommunityItems } from '$lib/server/nearbyService.js';
import { toFiniteNumber, isValidLatLon } from '$lib/security.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const lat = toFiniteNumber(url.searchParams.get('lat'));
  const lon = toFiniteNumber(url.searchParams.get('lon'));
  const radiusM = toFiniteNumber(url.searchParams.get('radius_m')) ?? 5000;

  if (!isValidLatLon(lat, lon)) {
    return json({ error: 'Invalid or missing lat/lon' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }

  const payload = await getNearbyCommunityItems({ lat, lon, radiusM });

  return json(payload, {
    status: 200,
    headers: {
      'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'
    }
  });
}
