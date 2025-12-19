import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

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
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) return null;
  return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const lat = toNumber(url.searchParams.get('lat'));
  const lon = toNumber(url.searchParams.get('lon'));
  const radiusM = clamp(toNumber(url.searchParams.get('radius_m')) ?? 3000, 250, 25_000);

  if (lat == null || lon == null) {
    return json({ error: 'Missing lat/lon' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return json({ error: 'Missing Supabase env' }, { status: 500, headers: { 'cache-control': 'no-store' } });
  }

  // Bounding box prefilter (cheap)
  const deltaLat = radiusM / 111_320;
  const deltaLon = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));

  const minLat = lat - deltaLat;
  const maxLat = lat + deltaLat;
  const minLon = lon - deltaLon;
  const maxLon = lon + deltaLon;

  const { data, error } = await supabase
    .from('community_submissions')
    .select('id, kind, name, category, description, website, email, phone, address_label, city, postcode, lat, lon, event_url, event_start, event_end')
    .eq('status', 'approved')
    .gte('lat', minLat)
    .lte('lat', maxLat)
    .gte('lon', minLon)
    .lte('lon', maxLon)
    .limit(150);

  if (error) {
    return json({ error: error.message }, { status: 500, headers: { 'cache-control': 'no-store' } });
  }

  const items = [];
  for (const r of data || []) {
    if (typeof r?.lat !== 'number' || typeof r?.lon !== 'number') continue;
    const dKm = haversineKm(lat, lon, r.lat, r.lon);
    if (dKm * 1000 > radiusM) continue;
    items.push({ ...r, distanceKm: Math.round(dKm) });
  }

  items.sort((a, b) => a.distanceKm - b.distanceKm);

  return json(
    { items, lat, lon, radius_m: radiusM },
    {
      headers: {
        // Edge cache is fine: only public approved items.
        'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'
      }
    }
  );
}


