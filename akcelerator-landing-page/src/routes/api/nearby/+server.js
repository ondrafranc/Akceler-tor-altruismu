// Nearby places in Czechia (OpenStreetMap via Overpass API)
// This is best-effort and cached to avoid hammering public Overpass instances.

import { json } from '@sveltejs/kit';

/** @type {Map<string, { expiresAt: number, data: any }>} */
const CACHE = new Map();

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter'
];

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function parseFloatSafe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseIntSafe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function makeOverpassQuery(lat, lon, radiusM, kinds) {
  const tagQueries = [];

  for (const k of kinds) {
    if (k === 'ngo') {
      tagQueries.push('["office"="ngo"]');
      tagQueries.push('["office"="association"]');
    }
    if (k === 'community') {
      tagQueries.push('["amenity"="community_centre"]');
      tagQueries.push('["amenity"="social_facility"]');
    }
    if (k === 'food') {
      tagQueries.push('["amenity"="food_bank"]');
      tagQueries.push('["amenity"="social_facility"]["social_facility"="food_bank"]');
    }
    if (k === 'animals') {
      tagQueries.push('["amenity"="animal_shelter"]');
    }
  }

  // Default: show NGO + community
  if (tagQueries.length === 0) {
    tagQueries.push('["office"="ngo"]');
    tagQueries.push('["amenity"="community_centre"]');
  }

  const parts = [];
  for (const tq of tagQueries) {
    parts.push(`node(around:${radiusM},${lat},${lon})${tq};`);
    parts.push(`way(around:${radiusM},${lat},${lon})${tq};`);
    parts.push(`relation(around:${radiusM},${lat},${lon})${tq};`);
  }

  return `[out:json][timeout:25];(${parts.join('')});out center tags 100;`;
}

async function postOverpass(query) {
  let lastErr;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
          // Please replace contact when you have a public email.
          'user-agent': 'AkceleratorAltruismu/1.0 (SvelteKit; Czech-only; contact: none)'
        },
        body: query
      });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('Overpass failed');
}

function extractLatLon(el) {
  if (typeof el?.lat === 'number' && typeof el?.lon === 'number') return [el.lat, el.lon];
  if (el?.center && typeof el.center.lat === 'number' && typeof el.center.lon === 'number') return [el.center.lat, el.center.lon];
  return null;
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const lat = parseFloatSafe(url.searchParams.get('lat'));
  const lon = parseFloatSafe(url.searchParams.get('lon'));
  const radius = parseIntSafe(url.searchParams.get('radius_m')) ?? 3000;
  const kindsRaw = (url.searchParams.get('kinds') || '').split(',').map(s => s.trim()).filter(Boolean);

  if (lat == null || lon == null) {
    return json({ error: 'Missing lat/lon' }, { status: 400 });
  }

  // Czech-only product, but still validate inputs
  const radiusM = clamp(radius, 250, 12_000);
  const kinds = kindsRaw.filter(k => ['ngo', 'community', 'food', 'animals'].includes(k));

  const cacheKey = `${lat.toFixed(4)}:${lon.toFixed(4)}:${radiusM}:${kinds.sort().join(',')}`;
  const cached = CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return json(cached.data);
  }

  const query = makeOverpassQuery(lat, lon, radiusM, kinds);
  const data = await postOverpass(query);

  const places = [];
  for (const el of data?.elements || []) {
    const ll = extractLatLon(el);
    if (!ll) continue;
    const tags = el.tags || {};
    const name = tags.name || tags.operator || tags.brand || null;
    const website = tags.website || tags['contact:website'] || null;
    const kind =
      tags.office === 'ngo' || tags.office === 'association'
        ? 'ngo'
        : tags.amenity === 'community_centre' || tags.amenity === 'social_facility'
          ? 'community'
          : tags.amenity === 'food_bank'
            ? 'food'
            : tags.amenity === 'animal_shelter'
              ? 'animals'
              : 'other';

    places.push({
      id: `${el.type}:${el.id}`,
      name,
      lat: ll[0],
      lon: ll[1],
      kind,
      website,
      tags
    });
  }

  const payload = { places, radius_m: radiusM, lat, lon };
  CACHE.set(cacheKey, { expiresAt: now + 60 * 60 * 1000, data: payload });

  return json(payload);
}


