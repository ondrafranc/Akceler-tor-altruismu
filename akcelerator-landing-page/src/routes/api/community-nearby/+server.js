import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import { LOCAL_COMMUNITY_ITEMS } from '$lib/data/czech-actions.js';
import {
  clamp,
  toFiniteNumber,
  isValidLatLon,
  haversineKm,
  sanitizeHttpUrl,
  sanitizeEmail,
  sanitizePhone,
  setBoundedCache
} from '$lib/security.js';

const CACHE = new Map();
const CACHE_TTL_MS = 1000 * 60 * 10;

function createServerSupabaseClient() {
  if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) return null;
  return createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
}

function sanitizeCommunityRecord(r, dKm) {
  return {
    ...r,
    website: r.website ? sanitizeHttpUrl(r.website) : null,
    event_url: r.event_url ? sanitizeHttpUrl(r.event_url) : null,
    email: r.email ? sanitizeEmail(r.email) : null,
    phone: r.phone ? sanitizePhone(r.phone) : null,
    distanceKm: Math.round(dKm * 10) / 10
  };
}

function getLocalCommunityNearby(lat, lon, radiusM) {
  const maxKm = Math.max(radiusM / 1000, 15);
  const allWithDist = [];
  for (const r of LOCAL_COMMUNITY_ITEMS) {
    if (r?.name === 'Testovací komunitní zahrada Praha') continue;
    if (r?.status === 'pending' || String(r?.id || '').startsWith('comm-local-')) continue;
    if (!isValidLatLon(r?.lat, r?.lon)) continue;
    const dKm = haversineKm(lat, lon, r.lat, r.lon);
    allWithDist.push(sanitizeCommunityRecord(r, dKm));
  }
  allWithDist.sort((a, b) => a.distanceKm - b.distanceKm);
  const within = allWithDist.filter((item) => item.distanceKm <= maxKm);
  return within.length > 0 ? within : allWithDist.slice(0, 3);
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const lat = toFiniteNumber(url.searchParams.get('lat'));
  const lon = toFiniteNumber(url.searchParams.get('lon'));
  const radiusM = clamp(toFiniteNumber(url.searchParams.get('radius_m')) ?? 5000, 250, 25_000);

  if (!isValidLatLon(lat, lon)) {
    return json({ error: 'Invalid or missing lat/lon' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }

  const cacheKey = `comm:v2:${lat.toFixed(2)}:${lon.toFixed(2)}:${radiusM}`;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return json(cached.data, {
      headers: {
        'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'
      }
    });
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

      const queryPromise = supabase
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

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase timeout')), 1800)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (!error && Array.isArray(data)) {
        const items = [];
        for (const r of data) {
          if (r?.name === 'Testovací komunitní zahrada Praha') continue;
          if (!isValidLatLon(r?.lat, r?.lon)) continue;
          const dKm = haversineKm(lat, lon, r.lat, r.lon);
          if (dKm * 1000 > radiusM) continue;
          items.push(sanitizeCommunityRecord(r, dKm));
        }
        for (const loc of getLocalCommunityNearby(lat, lon, radiusM)) {
          if (!items.some((x) => x.name === loc.name)) {
            items.push(loc);
          }
        }
        items.sort((a, b) => a.distanceKm - b.distanceKm);

        const payload = { items, lat, lon, radius_m: radiusM, fallback: false };
        setBoundedCache(CACHE, cacheKey, payload, CACHE_TTL_MS, 250);

        return json(payload, {
          headers: {
            'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'
          }
        });
      }
    } catch {
      // Fall through to local curated community items
    }
  }

  const items = getLocalCommunityNearby(lat, lon, radiusM);
  const fallbackPayload = { items, lat, lon, radius_m: radiusM, fallback: true };
  setBoundedCache(CACHE, cacheKey, fallbackPayload, CACHE_TTL_MS, 250);
  return json(fallbackPayload, {
    headers: {
      'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600'
    }
  });
}
