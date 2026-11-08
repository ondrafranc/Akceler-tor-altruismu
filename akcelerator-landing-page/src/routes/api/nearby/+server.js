// Nearby places in Czechia (OpenStreetMap via Overpass API + Curated Czech Verified Network)
// Cached in bounded memory and guaranteed to return human-actionable places anywhere in Czechia.

import { json } from '@sveltejs/kit';
import { CURATED_FALLBACK_PLACES } from '$lib/data/czech-actions.js';
import {
  clamp,
  toFiniteNumber,
  isValidLatLon,
  isCzLatLon,
  haversineKm,
  safeText,
  sanitizeHttpUrl,
  sanitizeEmail,
  sanitizePhone,
  setBoundedCache,
  checkRateLimit,
  resolveClientKey
} from '$lib/security.js';

/** @type {Map<string, { expiresAt: number, data: any }>} */
const CACHE = new Map();

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

const ALLOWED_OSM_TYPES = new Set(['node', 'way', 'relation']);

function firstText(maxLen, ...vals) {
  for (const v of vals) {
    const s = safeText(v);
    if (s) return maxLen > 0 ? s.slice(0, maxLen) : s;
  }
  return null;
}

function buildAddress(tags) {
  const street = firstText(100, tags['addr:street'], tags['addr:place']);
  const house = firstText(30, tags['addr:housenumber'], tags['addr:conscriptionnumber'], tags['addr:streetnumber']);
  const city = firstText(80, tags['addr:city'], tags['addr:town'], tags['addr:village'], tags['addr:hamlet'], tags['addr:suburb']);
  const postcode = firstText(16, tags['addr:postcode']);

  const line1 = [street, house].filter(Boolean).join(' ');
  const line2 = [postcode, city].filter(Boolean).join(' ');
  const full = [line1, line2].filter(Boolean).join(', ');
  return full || null;
}

function osmUrl(type, id) {
  if (!ALLOWED_OSM_TYPES.has(type) || !Number.isInteger(id) || id <= 0) return null;
  return `https://www.openstreetmap.org/${type}/${id}`;
}

function deriveSubcategory(tags) {
  const amenity = tags.amenity;
  const office = tags.office;
  const sf = tags.social_facility;
  const shop = tags.shop;
  const leisure = tags.leisure;

  if (amenity === 'animal_shelter') return 'Útulek pro zvířata';
  if (amenity === 'public_bookcase') return 'Veřejná knihobudka';
  if (amenity === 'give_box') return 'ReUse skříňka / freeshop';
  if (amenity === 'food_sharing') return 'Sdílená lednice / potravinová skříňka';
  if (shop === 'charity') return 'Charitativní obchod';
  if (leisure === 'garden' && tags['garden:type'] === 'community') return 'Komunitní zahrada';

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
      tagSet.add('["amenity"="give_box"]');
      tagSet.add('["leisure"="garden"]["garden:type"="community"]');
      tagSet.add('["amenity"="social_facility"]');
    }
    if (k === 'food') {
      tagSet.add('["amenity"="food_bank"]');
      tagSet.add('["amenity"="soup_kitchen"]');
      tagSet.add('["amenity"="food_sharing"]');
      tagSet.add('["shop"="charity"]');
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
    tagSet.add('["amenity"="give_box"]');
    tagSet.add('["amenity"="food_sharing"]');
    tagSet.add('["shop"="charity"]');
    tagSet.add('["leisure"="garden"]["garden:type"="community"]');
    tagSet.add('["amenity"="animal_shelter"]');
  }

  const deltaLat = radiusM / 111_320;
  const deltaLon = radiusM / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const minLat = (lat - deltaLat).toFixed(5);
  const maxLat = (lat + deltaLat).toFixed(5);
  const minLon = (lon - deltaLon).toFixed(5);
  const maxLon = (lon + deltaLon).toFixed(5);

  const parts = Array.from(tagSet).map((tq) => `nw${tq};`);

  return `[out:json][timeout:4][bbox:${minLat},${minLon},${maxLat},${maxLon}];(${parts.join('')});out center tags 140;`;
}

async function fetchOneOverpass(url, query, timeoutMs = 3000, sharedSignal = undefined) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const combinedSignal = sharedSignal
    ? AbortSignal.any([sharedSignal, controller.signal])
    : controller.signal;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
        'user-agent':
          'AkceleratorAltruismu/2.5 (https://akcelerator-altruismu.vercel.app; kontakt@akcelerator-altruismu.cz)'
      },
      body: 'data=' + encodeURIComponent(query),
      signal: combinedSignal
    });
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function postOverpass(query) {
  const sharedController = new AbortController();
  try {
    return await Promise.any(
      OVERPASS_ENDPOINTS.map((url) =>
        fetchOneOverpass(url, query, 3000, sharedController.signal)
      )
    );
  } finally {
    sharedController.abort();
  }
}

function extractLatLon(el) {
  if (isValidLatLon(el?.lat, el?.lon)) return [el.lat, el.lon];
  if (el?.center && isValidLatLon(el.center.lat, el.center.lon)) return [el.center.lat, el.center.lon];
  return null;
}

function getFallbackPlaces(lat, lon, radiusM, kinds) {
  const activeKinds = kinds.length ? kinds : ['ngo', 'community', 'food', 'animals'];
  const maxKm = Math.max(radiusM / 1000, 15);
  const withDist = CURATED_FALLBACK_PLACES.filter((p) => activeKinds.includes(p.kind))
    .map((p) => ({
      ...p,
      curated: true,
      sourceType: 'verified_org',
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

  const radiusM = clamp(radius, 250, 25_000);
  const kinds = [...new Set(kindsRaw.filter((k) => ['ngo', 'community', 'food', 'animals'].includes(k)))].sort();

  // Do not proxy out-of-Czechia coordinates to Overpass mirrors (H3)
  if (!isCzLatLon(lat, lon)) {
    const fallbackPlaces = getFallbackPlaces(lat, lon, radiusM, kinds);
    return json(
      { places: fallbackPlaces, radius_m: radiusM, lat, lon, fallback: true, expandedToNearest: true },
      { status: 200, headers: { 'cache-control': 'public, max-age=0, s-maxage=300' } }
    );
  }

  const cacheKey = `v29:${lat.toFixed(4)}:${lon.toFixed(4)}:${radiusM}:${includeAssociations ? 'a1' : 'a0'}:${kinds.join(',')}`;
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

      const rawDistKm = haversineKm(lat, lon, ll[0], ll[1]);
      if (rawDistKm * 1000 > radiusM * 1.05) continue;

      const tags = el.tags || {};
      let name = firstText(160, tags.name, tags['name:cs'], tags.operator, tags.brand);
      if (!name && tags.amenity === 'public_bookcase') {
        name = 'Veřejná knihobudka';
      } else if (!name && tags.amenity === 'give_box') {
        name = 'ReUse skříňka (dej a vezmi)';
      } else if (!name && tags.amenity === 'food_sharing') {
        name = 'Sdílená potravinová skříňka';
      }
      if (!name) continue;

      const rawWebsite = firstText(280, tags.website, tags['contact:website'], tags.url);
      const website = rawWebsite ? sanitizeHttpUrl(rawWebsite) : null;
      const rawPhone = firstText(40, tags.phone, tags['contact:phone']);
      const phone = rawPhone ? sanitizePhone(rawPhone) : null;
      const rawEmail = firstText(120, tags.email, tags['contact:email']);
      const email = rawEmail ? sanitizeEmail(rawEmail) : null;
      const opening_hours = firstText(180, tags.opening_hours);
      const description = firstText(500, tags['description:cs'], tags.description);
      const address = buildAddress(tags);

      // Filter out low-signal administrative social_facility noise unless it has actionable tags or contact info
      const actionableSf = ['food_bank', 'soup_kitchen', 'clothing_bank', 'shelter', 'outreach', 'day_care'];
      if (
        tags.amenity === 'social_facility' &&
        !actionableSf.includes(tags.social_facility || '') &&
        !website &&
        !email &&
        !description
      ) {
        continue;
      }

      const kind =
        tags.amenity === 'animal_shelter'
          ? 'animals'
          : tags.amenity === 'food_bank' ||
              tags.amenity === 'soup_kitchen' ||
              tags.amenity === 'food_sharing' ||
              tags.shop === 'charity' ||
              tags.social_facility === 'food_bank' ||
              tags.social_facility === 'soup_kitchen' ||
              tags.social_facility === 'clothing_bank'
            ? 'food'
            : tags.amenity === 'community_centre' ||
                tags.amenity === 'public_bookcase' ||
                tags.amenity === 'give_box' ||
                (tags.leisure === 'garden' && tags['garden:type'] === 'community') ||
                tags.amenity === 'social_facility'
              ? 'community'
              : tags.office === 'ngo' || tags.office === 'association'
                ? 'ngo'
                : 'other';

      if (kinds.length > 0 && !kinds.includes(kind)) continue;

      const subcategory = deriveSubcategory(tags);
      const isSelfService =
        tags.amenity === 'public_bookcase' ||
        tags.amenity === 'give_box' ||
        tags.amenity === 'food_sharing';

      places.push({
        id: `${el.type}:${el.id}`,
        osm_type: el.type,
        osm_id: el.id,
        osm_url: osmUrl(el.type, el.id),
        name,
        lat: ll[0],
        lon: ll[1],
        distanceKm: Math.round(rawDistKm * 10) / 10,
        kind,
        subcategory,
        website,
        address,
        phone,
        email,
        opening_hours,
        description,
        sourceType: 'osm',
        visitMode: isSelfService ? 'drop_in' : opening_hours ? 'opening_hours' : 'by_agreement',
        helpWays:
          tags.amenity === 'public_bookcase' || tags.amenity === 'give_box' || tags.shop === 'charity'
            ? ['material_dropoff']
            : tags.amenity === 'food_sharing'
              ? ['food_donation']
              : kind === 'food'
                ? ['food_donation', 'material_dropoff']
                : kind === 'animals'
                  ? ['material_dropoff', 'one_off_help']
                  : ['one_off_help', 'regular_volunteering']
      });
    }

    places.sort((a, b) => {
      const scoreA = (a.distanceKm ?? 50) * 0.15 - (a.website ? 0.35 : 0) - (a.description ? 0.2 : 0);
      const scoreB = (b.distanceKm ?? 50) * 0.15 - (b.website ? 0.35 : 0) - (b.description ? 0.2 : 0);
      return scoreA - scoreB;
    });

    const curatedNearby = getFallbackPlaces(lat, lon, radiusM, kinds);
    const isDuplicatePlace = (a, b) => {
      if (!a || !b) return false;
      if (a.id && b.id && a.id === b.id) return true;
      const nA = String(a.name || '').trim().toLowerCase();
      const nB = String(b.name || '').trim().toLowerCase();
      if (nA && nB && nA === nB) return true;
      if (haversineKm(a.lat, a.lon, b.lat, b.lon) < 0.15 && a.kind === b.kind) return true;
      return false;
    };

    const localCuratedToPrepend = [];
    for (const cp of curatedNearby) {
      if (haversineKm(lat, lon, cp.lat, cp.lon) * 1000 <= radiusM) {
        if (!places.some((p) => isDuplicatePlace(p, cp)) && !localCuratedToPrepend.some((p) => isDuplicatePlace(p, cp))) {
          localCuratedToPrepend.push(cp);
        }
      }
    }
    places.unshift(...localCuratedToPrepend);

    let expandedToNearest = false;
    if (places.length < 2) {
      expandedToNearest = true;
      for (const cp of curatedNearby) {
        if (!places.some((p) => isDuplicatePlace(p, cp))) {
          places.push(cp);
        }
      }
    }

    const payload = { places, radius_m: radiusM, lat, lon, fallback: false, expandedToNearest };
    setBoundedCache(CACHE, cacheKey, payload, 60 * 60 * 1000, 250);

    return json(payload, {
      headers: { 'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' }
    });
  } catch {
    const fallbackPlaces = getFallbackPlaces(lat, lon, radiusM, kinds);
    const withinStrictRadius = fallbackPlaces.filter((p) => (p.distanceKm ?? 0) * 1000 <= radiusM);
    const expandedToNearest = withinStrictRadius.length < 2 && fallbackPlaces.some((p) => (p.distanceKm ?? 0) * 1000 > radiusM);
    const payload = { places: fallbackPlaces, radius_m: radiusM, lat, lon, fallback: true, expandedToNearest };
    setBoundedCache(CACHE, cacheKey, payload, 2 * 60 * 1000, 250);
    return json(payload, {
      status: 200,
      headers: { 'cache-control': 'public, max-age=0, s-maxage=120' }
    });
  }
}
