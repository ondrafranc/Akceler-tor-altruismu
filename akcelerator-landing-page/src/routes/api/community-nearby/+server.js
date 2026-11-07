import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import { LOCAL_COMMUNITY_ITEMS } from '$lib/data/czech-actions.js';

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

function createServerSupabaseClient() {
  if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) return null;
  return createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
}

function getLocalCommunityNearby(lat, lon, radiusM) {
  const maxKm = Math.max(radiusM / 1000, 15);
  const allWithDist = [];
  for (const r of LOCAL_COMMUNITY_ITEMS) {
    if (r?.name === 'Testovací komunitní zahrada Praha') continue;
    if (typeof r?.lat !== 'number' || typeof r?.lon !== 'number') continue;
    const dKm = haversineKm(lat, lon, r.lat, r.lon);
    allWithDist.push({ ...r, distanceKm: Math.round(dKm) });
  }
  allWithDist.sort((a, b) => a.distanceKm - b.distanceKm);
  const within = allWithDist.filter((item) => item.distanceKm <= maxKm);
  return within.length > 0 ? within : allWithDist.slice(0, 3);
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const lat = toNumber(url.searchParams.get('lat'));
  const lon = toNumber(url.searchParams.get('lon'));
  const radiusM = clamp(toNumber(url.searchParams.get('radius_m')) ?? 5000, 250, 25_000);

  if (lat == null || lon == null) {
    return json({ error: 'Missing lat/lon' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }

  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      const deltaLat = radiusM / 111_320;
      const deltaLon = radiusM / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));

      const minLat = lat - deltaLat;
      const maxLat = lat + deltaLat;
      const minLon = lon - deltaLon;
      const maxLon = lon + deltaLon;

      const { data, error } = await supabase
        .from('community_submissions')
        .select(
          'id, kind, name, category, description, website, email, phone, address_label, city, postcode, lat, lon, event_url, event_start, event_end'
        )
        .eq('status', 'approved')
        .gte('lat', minLat)
        .lte('lat', maxLat)
        .gte('lon', minLon)
        .lte('lon', maxLon)
        .limit(150);

      if (!error && Array.isArray(data)) {
        const items = [];
        for (const r of data) {
          if (r?.name === 'Testovací komunitní zahrada Praha') continue;
          if (typeof r?.lat !== 'number' || typeof r?.lon !== 'number') continue;
          const dKm = haversineKm(lat, lon, r.lat, r.lon);
          if (dKm * 1000 > radiusM) continue;
          items.push({ ...r, distanceKm: Math.round(dKm) });
        }
        // Merge any local session items as well
        for (const loc of getLocalCommunityNearby(lat, lon, radiusM)) {
          if (!items.some((x) => x.name === loc.name)) {
            items.push(loc);
          }
        }
        items.sort((a, b) => a.distanceKm - b.distanceKm);

        return json(
          { items, lat, lon, radius_m: radiusM, fallback: false },
          {
            headers: {
              'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'
            }
          }
        );
      }
    } catch {
      // Fall through to local curated community items
    }
  }

  const items = getLocalCommunityNearby(lat, lon, radiusM);
  return json(
    { items, lat, lon, radius_m: radiusM, fallback: true },
    {
      headers: {
        'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600'
      }
    }
  );
}
