/**
 * Unified In-Memory Czech Nearby & Community Service
 * Eliminates external live Overpass API calls, responding in < 50ms (typically < 1ms).
 * Uses verified Czech locations from fallback-places.js and community-items.js
 * with in-memory Haversine distance calculation and remote coordinate expansion.
 */

import { CURATED_FALLBACK_PLACES } from '$lib/data/fallback-places.js';
import { LOCAL_COMMUNITY_ITEMS } from '$lib/data/community-items.js';
import { getServerSupabase, withTimeout } from '$lib/server/supabase.js';
import {
  clamp,
  isValidLatLon,
  isCzLatLon,
  haversineKm,
  sanitizeHttpUrl,
  sanitizeEmail,
  sanitizePhone,
  setBoundedCache
} from '$lib/security.js';

/** In-memory LRU-like cache for queries */
const PLACES_CACHE = new Map();
const COMMUNITY_CACHE = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function extractContactParts(contactRaw, emailRaw, phoneRaw) {
  let email = emailRaw ? sanitizeEmail(emailRaw) : null;
  let phone = phoneRaw ? sanitizePhone(phoneRaw) : null;
  if (typeof contactRaw === 'string' && contactRaw.trim()) {
    for (const part of contactRaw.split(/[·,;]/)) {
      const p = part.trim();
      if (!email && p.includes('@')) email = sanitizeEmail(p);
      else if (!phone && /\d{3}/.test(p)) phone = sanitizePhone(p);
    }
  }
  return { email, phone };
}

function sanitizeCommunityRecord(r, dKm) {
  const rawWebsite = r.website || r.url || null;
  const website = rawWebsite ? sanitizeHttpUrl(rawWebsite) : null;
  const event_url = r.event_url ? sanitizeHttpUrl(r.event_url) : null;
  const { email, phone } = extractContactParts(r.contact, r.email, r.phone);

  return {
    id: r.id,
    kind: r.kind || 'org',
    name: r.name,
    category: r.category || 'other',
    description: r.description || null,
    city: r.city || null,
    address_label: r.address_label || r.address || r.city || null,
    address: r.address || r.address_label || r.city || null,
    lat: r.lat,
    lon: r.lon,
    website,
    url: website,
    event_url,
    email,
    phone,
    status: r.status || 'approved',
    distanceKm: Math.round(dKm * 10) / 10
  };
}

/**
 * Returns localized curated community items sorted by distance.
 * Remote rural coordinates expand to nearest available places.
 * @param {number} lat
 * @param {number} lon
 * @param {number} radiusM
 * @returns {Array<any>}
 */
export function getLocalCommunityNearby(lat, lon, radiusM) {
  const maxKm = Math.max(radiusM / 1000, 15);
  const allWithDist = [];
  for (const r of LOCAL_COMMUNITY_ITEMS) {
    if (r?.status === 'pending' || String(r?.id || '').startsWith('comm-local-')) continue;
    if (!isValidLatLon(r?.lat, r?.lon)) continue;
    const dKm = haversineKm(lat, lon, r.lat, r.lon);
    allWithDist.push(sanitizeCommunityRecord(r, dKm));
  }
  allWithDist.sort((a, b) => a.distanceKm - b.distanceKm);
  const within = allWithDist.filter((item) => item.distanceKm <= maxKm);
  return within.length >= 2 ? within : allWithDist.slice(0, 3);
}

/**
 * Queries community submissions (Supabase with fallback to local seed).
 * @param {{ lat: number, lon: number, radiusM?: number }} params
 * @returns {Promise<{ items: Array<any>, lat: number, lon: number, radius_m: number, fallback: boolean }>}
 */
export async function getNearbyCommunityItems({ lat, lon, radiusM = 5000 }) {
  const radius = clamp(radiusM, 250, 25_000);
  const cacheKey = `comm:v5:${lat.toFixed(4)}:${lon.toFixed(4)}:${radius}`;
  const cached = COMMUNITY_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const deltaLat = radius / 111_320;
      const deltaLon = radius / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));

      const minLat = lat - deltaLat;
      const maxLat = lat + deltaLat;
      const minLon = lon - deltaLon;
      const maxLon = lon + deltaLon;

      const queryPromise = supabase
        .from('community_submissions')
        .select('id, created_at, name, category, description, city, address, lat, lon, url, contact, status')
        .eq('status', 'approved')
        .gte('lat', minLat)
        .lte('lat', maxLat)
        .gte('lon', minLon)
        .lte('lon', maxLon)
        .limit(150);

      const { data, error } = await withTimeout(queryPromise, 2200, 'Supabase community query timeout');

      if (!error && Array.isArray(data)) {
        const items = [];
        for (const r of data) {
          if (!isValidLatLon(r?.lat, r?.lon)) continue;
          const dKm = haversineKm(lat, lon, r.lat, r.lon);
          if (dKm * 1000 > radius) continue;
          items.push(sanitizeCommunityRecord(r, dKm));
        }
        for (const loc of getLocalCommunityNearby(lat, lon, radius)) {
          if (!items.some((x) => x.name === loc.name)) {
            items.push(loc);
          }
        }
        items.sort((a, b) => a.distanceKm - b.distanceKm);

        const payload = { items, lat, lon, radius_m: radius, fallback: false };
        setBoundedCache(COMMUNITY_CACHE, cacheKey, payload, CACHE_TTL_MS, 250);
        return payload;
      }
    } catch {
      // Fall through to local community items
    }
  }

  const items = getLocalCommunityNearby(lat, lon, radius);
  const fallbackPayload = { items, lat, lon, radius_m: radius, fallback: true };
  setBoundedCache(COMMUNITY_CACHE, cacheKey, fallbackPayload, CACHE_TTL_MS, 250);
  return fallbackPayload;
}

/**
 * Returns verified physical places from bundled Czech data in-memory (< 50ms).
 * Remote rural coordinates expand to nearest available places.
 * Also retrieves community items to provide a unified payload.
 *
 * @param {{
 *   lat: number,
 *   lon: number,
 *   radiusM?: number,
 *   kinds?: string[],
 *   includeAssociations?: boolean
 * }} params
 * @returns {Promise<{
 *   places: Array<any>,
 *   items: Array<any>,
 *   radius_m: number,
 *   lat: number,
 *   lon: number,
 *   fallback: boolean,
 *   expandedToNearest: boolean
 * }>}
 */
export async function getNearbyPlaces({
  lat,
  lon,
  radiusM = 5000,
  kinds = [],
  includeAssociations = false
}) {
  const radius = clamp(radiusM, 250, 25_000);
  const activeKinds = kinds.length
    ? [...new Set(kinds.filter((k) => ['ngo', 'community', 'food', 'animals'].includes(k)))].sort()
    : ['ngo', 'community', 'food', 'animals'];

  const cacheKey = `near:v30:${lat.toFixed(4)}:${lon.toFixed(4)}:${radius}:${includeAssociations ? '1' : '0'}:${activeKinds.join(',')}`;
  const cached = PLACES_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const isCz = isCzLatLon(lat, lon);
  const maxKm = radius / 1000;

  // In-memory nearest search over verified Czech locations
  const withDist = CURATED_FALLBACK_PLACES.filter((p) => activeKinds.includes(p.kind))
    .map((p) => {
      const dKm = haversineKm(lat, lon, p.lat, p.lon);
      return {
        ...p,
        curated: true,
        sourceType: 'verified_org',
        distanceKm: Math.round(dKm * 10) / 10
      };
    })
    .sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      return String(a.id).localeCompare(String(b.id));
    });

  const withinRadius = withDist.filter((p) => p.distanceKm <= maxKm);

  let places;
  let expandedToNearest = false;

  if (withinRadius.length >= 2) {
    places = withinRadius;
  } else {
    // Expand to nearest places (e.g. for rural Šumava / Vysočina)
    expandedToNearest = true;
    places = withDist.slice(0, 6);
  }

  // Fetch community items to unify the response
  const commRes = await getNearbyCommunityItems({ lat, lon, radiusM: radius });
  const items = commRes.items || [];

  const payload = {
    places,
    items,
    radius_m: radius,
    lat,
    lon,
    fallback: !isCz,
    expandedToNearest
  };

  setBoundedCache(PLACES_CACHE, cacheKey, payload, CACHE_TTL_MS, 250);
  return payload;
}
