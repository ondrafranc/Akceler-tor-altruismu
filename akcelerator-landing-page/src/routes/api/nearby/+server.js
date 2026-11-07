// Nearby places in Czechia (OpenStreetMap via Overpass API + Curated Czech Verified Network)
// Cached in memory and guaranteed to return rich, human-actionable places anywhere in Czechia.

import { json } from '@sveltejs/kit';
import { CURATED_FALLBACK_PLACES } from '$lib/data/czech-actions.js';

/** @type {Map<string, { expiresAt: number, data: any }>} */
const CACHE = new Map();

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
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

function firstText(...vals) {
  for (const v of vals) {
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) return s;
    }
  }
  return null;
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

function buildAddress(tags) {
  const street = firstText(tags['addr:street'], tags['addr:place']);
  const house = firstText(tags['addr:housenumber'], tags['addr:conscriptionnumber'], tags['addr:streetnumber']);
  const city = firstText(tags['addr:city'], tags['addr:town'], tags['addr:village'], tags['addr:hamlet'], tags['addr:suburb']);
  const postcode = firstText(tags['addr:postcode']);

  const line1 = [street, house].filter(Boolean).join(' ');
  const line2 = [postcode, city].filter(Boolean).join(' ');
  const full = [line1, line2].filter(Boolean).join(', ');
  return full || null;
}

function osmUrl(type, id) {
  return `https://www.openstreetmap.org/${type}/${id}`;
}

function deriveSubcategory(tags) {
  const amenity = tags.amenity;
  const office = tags.office;
  const sf = tags.social_facility;

  if (amenity === 'animal_shelter') return 'Útulek pro zvířata';
  if (amenity === 'public_bookcase') return 'Veřejná knihobudka';

  if (amenity === 'food_bank' || sf === 'food_bank') return 'Potravinová banka';
  if (amenity === 'soup_kitchen' || sf === 'soup_kitchen') return 'Výdej jídla';

  if (amenity === 'community_centre') return 'Komunitní centrum';

  if (amenity === 'social_facility') {
    if (sf === 'clothing_bank') return 'Komunitní šatník';
    if (sf === 'shelter') return 'Azylový dům';
    if (sf === 'outreach') return 'Terénní pomoc';
    if (sf === 'day_care') return 'Denní stacionář';
    if (sf === 'nursing_home') return 'Domov pro seniory';
    if (sf === 'group_home') return 'Chráněné bydlení';
    return 'Sociální služba';
  }

  if (office === 'ngo') return 'Nezisková organizace';
  if (office === 'association') return 'Místní spolek';

  return null;
}

function makeOverpassQuery(lat, lon, radiusM, kinds, includeAssociations) {
  const tagSet = new Set();

  for (const k of kinds) {
    if (k === 'ngo') {
      tagSet.add('["office"="ngo"]');
      if (includeAssociations) {
        tagSet.add('["office"="association"]');
      }
    }
    if (k === 'community') {
      tagSet.add('["amenity"="community_centre"]');
      tagSet.add('["amenity"="public_bookcase"]');
      tagSet.add('["amenity"="social_facility"]');
    }
    if (k === 'food') {
      tagSet.add('["amenity"="food_bank"]');
      tagSet.add('["amenity"="soup_kitchen"]');
      tagSet.add('["amenity"="social_facility"]["social_facility"="food_bank"]');
      tagSet.add('["amenity"="social_facility"]["social_facility"="clothing_bank"]');
    }
    if (k === 'animals') {
      tagSet.add('["amenity"="animal_shelter"]');
    }
  }

  if (tagSet.size === 0) {
    tagSet.add('["office"="ngo"]');
    tagSet.add('["amenity"="community_centre"]');
    tagSet.add('["amenity"="public_bookcase"]');
    tagSet.add('["amenity"="animal_shelter"]');
  }

  const deltaLat = radiusM / 111_320;
  const deltaLon = radiusM / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const minLat = (lat - deltaLat).toFixed(5);
  const maxLat = (lat + deltaLat).toFixed(5);
  const minLon = (lon - deltaLon).toFixed(5);
  const maxLon = (lon + deltaLon).toFixed(5);

  const parts = Array.from(tagSet).map((tq) => `nw${tq};`);

  return `[out:json][timeout:3][bbox:${minLat},${minLon},${maxLat},${maxLon}];(${parts.join('')});out center tags 120;`;
}

async function fetchOneOverpass(url, query, timeoutMs = 2200) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
        'user-agent': 'AkceleratorAltruismu/2.5 (SvelteKit; Czech-only)'
      },
      body: query,
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function postOverpass(query) {
  return await Promise.any(OVERPASS_ENDPOINTS.map((url) => fetchOneOverpass(url, query, 2200)));
}

function extractLatLon(el) {
  if (typeof el?.lat === 'number' && typeof el?.lon === 'number') return [el.lat, el.lon];
  if (el?.center && typeof el.center.lat === 'number' && typeof el.center.lon === 'number') return [el.center.lat, el.center.lon];
  return null;
}

function getFallbackPlaces(lat, lon, radiusM, kinds) {
  const activeKinds = kinds.length ? kinds : ['ngo', 'community', 'food', 'animals'];
  const maxKm = Math.max(radiusM / 1000, 15);
  const withDist = CURATED_FALLBACK_PLACES.filter((p) => activeKinds.includes(p.kind))
    .map((p) => ({
      ...p,
      curated: true,
      distanceKm: Math.round(haversineKm(lat, lon, p.lat, p.lon) * 10) / 10
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const withinRadius = withDist.filter((p) => p.distanceKm <= maxKm);
  if (withinRadius.length >= 2) {
    return withinRadius;
  }
  return withDist.slice(0, 6);
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const lat = parseFloatSafe(url.searchParams.get('lat'));
  const lon = parseFloatSafe(url.searchParams.get('lon'));
  const radius = parseIntSafe(url.searchParams.get('radius_m')) ?? 5000;
  const kindsRaw = (url.searchParams.get('kinds') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const includeAssociations = url.searchParams.get('include_associations') === '1';

  if (lat == null || lon == null) {
    return json({ error: 'Missing lat/lon' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }

  const radiusM = clamp(radius, 250, 25_000);
  const kinds = kindsRaw.filter((k) => ['ngo', 'community', 'food', 'animals'].includes(k));

  const cacheKey = `v25:${lat.toFixed(4)}:${lon.toFixed(4)}:${radiusM}:${includeAssociations ? 'a1' : 'a0'}:${kinds.sort().join(',')}`;
  const cached = CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return json(cached.data, {
      headers: { 'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' }
    });
  }

  const query = makeOverpassQuery(lat, lon, radiusM, kinds, includeAssociations);

  try {
    const data = await postOverpass(query);
    const places = [];
    for (const el of data?.elements || []) {
      const ll = extractLatLon(el);
      if (!ll) continue;
      const tags = el.tags || {};
      let name = firstText(tags.name, tags['name:cs'], tags.operator, tags.brand);
      if (!name && tags.amenity === 'public_bookcase') {
        name = 'Veřejná knihobudka';
      }
      // Skip nameless obscure nodes that offer no actionable info for users
      if (!name) continue;

      const website = firstText(tags.website, tags['contact:website'], tags.url);
      const phone = firstText(tags.phone, tags['contact:phone']);
      const email = firstText(tags.email, tags['contact:email']);
      const opening_hours = firstText(tags.opening_hours);
      const description = firstText(tags['description:cs'], tags.description);
      const address = buildAddress(tags);
      const kind =
        tags.amenity === 'animal_shelter'
          ? 'animals'
          : tags.amenity === 'food_bank' ||
              tags.amenity === 'soup_kitchen' ||
              tags.social_facility === 'food_bank' ||
              tags.social_facility === 'soup_kitchen' ||
              tags.social_facility === 'clothing_bank'
            ? 'food'
            : tags.amenity === 'community_centre' ||
                tags.amenity === 'public_bookcase' ||
                tags.amenity === 'social_facility'
              ? 'community'
              : tags.office === 'ngo' || tags.office === 'association'
                ? 'ngo'
                : 'other';
      const subcategory = deriveSubcategory(tags);

      places.push({
        id: `${el.type}:${el.id}`,
        osm_type: el.type,
        osm_id: el.id,
        osm_url: osmUrl(el.type, el.id),
        name,
        lat: ll[0],
        lon: ll[1],
        kind,
        subcategory,
        website,
        address,
        phone,
        email,
        opening_hours,
        description,
        tags
      });
    }

    const curatedNearby = getFallbackPlaces(lat, lon, radiusM, kinds);
    for (const cp of curatedNearby) {
      if (haversineKm(lat, lon, cp.lat, cp.lon) * 1000 <= radiusM) {
        if (!places.some((p) => p.name && cp.name && p.name.toLowerCase().includes(cp.name.slice(0, 12).toLowerCase()))) {
          places.unshift(cp);
        }
      }
    }

    let expandedToNearest = false;
    if (places.length < 2) {
      expandedToNearest = true;
      for (const cp of curatedNearby) {
        if (!places.some((p) => p.id === cp.id || (p.name && cp.name && p.name.toLowerCase().includes(cp.name.slice(0, 12).toLowerCase())))) {
          places.push(cp);
        }
      }
    }

    const payload = { places, radius_m: radiusM, lat, lon, fallback: false, expandedToNearest };
    CACHE.set(cacheKey, { expiresAt: now + 60 * 60 * 1000, data: payload });

    return json(payload, {
      headers: { 'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' }
    });
  } catch {
    const fallbackPlaces = getFallbackPlaces(lat, lon, radiusM, kinds);
    const payload = { places: fallbackPlaces, radius_m: radiusM, lat, lon, fallback: true };
    return json(payload, {
      headers: { 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600' }
    });
  }
}
