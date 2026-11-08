import { json } from '@sveltejs/kit';
import { CZECH_CITIES } from '$lib/data/czech-actions.js';
import {
  clamp,
  safeText,
  isValidLatLon,
  setBoundedCache,
  checkRateLimit,
  resolveClientKey
} from '$lib/security.js';

/** @type {Map<string, { expiresAt: number, data: any }>} */
const CACHE = new Map();
/** @type {Map<string, Promise<any>>} */
const INFLIGHT = new Map();

let LAST_UPSTREAM_TS = 0;

const LOCAL_CZECH_TOWNS = [
  ...CZECH_CITIES.map((c) => ({ label: `${c.name}, Česko`, lat: c.lat, lon: c.lon, type: 'city' })),
  { label: 'Kladno, Středočeský kraj, Česko', lat: 50.1473, lon: 14.1028, type: 'city' },
  { label: 'Most, Ústecký kraj, Česko', lat: 50.503, lon: 13.6362, type: 'city' },
  { label: 'Opava, Moravskoslezský kraj, Česko', lat: 49.9387, lon: 17.9026, type: 'city' },
  { label: 'Frýdek-Místek, Moravskoslezský kraj, Česko', lat: 49.6853, lon: 18.3504, type: 'city' },
  { label: 'Havířov, Moravskoslezský kraj, Česko', lat: 49.7798, lon: 18.4369, type: 'city' },
  { label: 'Teplice, Ústecký kraj, Česko', lat: 50.6404, lon: 13.8245, type: 'city' },
  { label: 'Karviná, Moravskoslezský kraj, Česko', lat: 49.854, lon: 18.5417, type: 'city' },
  { label: 'Děčín, Ústecký kraj, Česko', lat: 50.7821, lon: 14.2148, type: 'city' },
  { label: 'Chomutov, Ústecký kraj, Česko', lat: 50.4605, lon: 13.4178, type: 'city' },
  { label: 'Jablonec nad Nisou, Liberecký kraj, Česko', lat: 50.7243, lon: 15.1711, type: 'city' },
  { label: 'Mladá Boleslav, Středočeský kraj, Česko', lat: 50.4113, lon: 14.9032, type: 'city' },
  { label: 'Prostějov, Olomoucký kraj, Česko', lat: 49.4719, lon: 17.1118, type: 'city' },
  { label: 'Přerov, Olomoucký kraj, Česko', lat: 49.4551, lon: 17.4509, type: 'city' },
  { label: 'Tábor, Jihočeský kraj, Česko', lat: 49.4144, lon: 14.6578, type: 'city' },
  { label: 'Třebíč, Kraj Vysočina, Česko', lat: 49.2149, lon: 15.8817, type: 'city' },
  { label: 'Znojmo, Jihomoravský kraj, Česko', lat: 48.8555, lon: 16.0488, type: 'city' },
  { label: 'Kolín, Středočeský kraj, Česko', lat: 50.0281, lon: 15.2006, type: 'city' },
  { label: 'Příbram, Středočeský kraj, Česko', lat: 49.6899, lon: 14.0104, type: 'city' },
  { label: 'Cheb, Karlovarský kraj, Česko', lat: 50.0796, lon: 12.3739, type: 'city' },
  { label: 'Písek, Jihočeský kraj, Česko', lat: 49.3088, lon: 14.1475, type: 'city' },
  { label: 'Trutnov, Královéhradecký kraj, Česko', lat: 50.561, lon: 15.9127, type: 'city' },
  { label: 'Kroměříž, Zlínský kraj, Česko', lat: 49.2979, lon: 17.3931, type: 'city' },
  { label: 'Vsetín, Zlínský kraj, Česko', lat: 49.3387, lon: 17.9962, type: 'city' },
  { label: 'Uherské Hradiště, Zlínský kraj, Česko', lat: 49.0697, lon: 17.4597, type: 'city' },
  { label: 'Břeclav, Jihomoravský kraj, Česko', lat: 48.759, lon: 16.882, type: 'city' },
  { label: 'Hodonín, Jihomoravský kraj, Česko', lat: 48.8489, lon: 17.1324, type: 'city' },
  { label: 'Česká Lípa, Liberecký kraj, Česko', lat: 50.6855, lon: 14.5376, type: 'city' },
  { label: 'Nový Jičín, Moravskoslezský kraj, Česko', lat: 49.5944, lon: 18.0103, type: 'city' },
  { label: 'Šumperk, Olomoucký kraj, Česko', lat: 49.9653, lon: 16.9706, type: 'city' },
  { label: 'Chrudim, Pardubický kraj, Česko', lat: 49.9511, lon: 15.7956, type: 'city' },
  { label: 'Havlíčkův Brod, Kraj Vysočina, Česko', lat: 49.6078, lon: 15.5807, type: 'city' },
  { label: 'Žďár nad Sázavou, Kraj Vysočina, Česko', lat: 49.5626, lon: 15.9392, type: 'city' },
  { label: 'Jindřichův Hradec, Jihočeský kraj, Česko', lat: 49.144, lon: 15.003, type: 'city' },
  { label: 'Strakonice, Jihočeský kraj, Česko', lat: 49.2614, lon: 13.9024, type: 'city' },
  { label: 'Klatovy, Plzeňský kraj, Česko', lat: 49.3955, lon: 13.2951, type: 'city' },
  { label: 'Sokolov, Karlovarský kraj, Česko', lat: 50.1813, lon: 12.6402, type: 'city' },
  { label: 'Litoměřice, Ústecký kraj, Česko', lat: 50.5335, lon: 14.1319, type: 'city' },
  { label: 'Beroun, Středočeský kraj, Česko', lat: 49.9638, lon: 14.072, type: 'city' },
  { label: 'Benešov, Středočeský kraj, Česko', lat: 49.7816, lon: 14.6869, type: 'city' },
  { label: 'Kutná Hora, Středočeský kraj, Česko', lat: 49.9484, lon: 15.2682, type: 'city' },
  { label: 'Mělník, Středočeský kraj, Česko', lat: 50.3505, lon: 14.4741, type: 'city' },
  { label: 'Náchod, Královéhradecký kraj, Česko', lat: 50.4167, lon: 16.1629, type: 'city' },
  { label: 'Jičín, Královéhradecký kraj, Česko', lat: 50.437, lon: 15.3517, type: 'city' },
  { label: 'Svitavy, Pardubický kraj, Česko', lat: 49.7559, lon: 16.4682, type: 'city' },
  { label: 'Ústí nad Orlicí, Pardubický kraj, Česko', lat: 49.9739, lon: 16.3936, type: 'city' },
  { label: 'Vyškov, Jihomoravský kraj, Česko', lat: 49.2775, lon: 16.999, type: 'city' },
  { label: 'Blansko, Jihomoravský kraj, Česko', lat: 49.3631, lon: 16.6445, type: 'city' }
];

function stripDiacritics(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function searchLocalTowns(q, limit = 5) {
  const normQ = stripDiacritics(q).trim();
  if (!normQ) return [];
  const exactOrPrefix = [];
  const substring = [];
  for (const t of LOCAL_CZECH_TOWNS) {
    const cityPart = stripDiacritics(t.label.split(',')[0]);
    const fullNorm = stripDiacritics(t.label);
    if (cityPart === normQ || cityPart.startsWith(normQ)) {
      exactOrPrefix.push(t);
    } else if (fullNorm.includes(normQ)) {
      substring.push(t);
    }
  }
  return [...exactOrPrefix, ...substring].slice(0, limit);
}

let lastScheduleTime = 0;

async function scheduleNominatimRequest(minIntervalMs = 1100) {
  const now = Date.now();
  const targetTime = Math.max(now, lastScheduleTime + minIntervalMs);
  lastScheduleTime = targetTime;
  const delay = targetTime - now;
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

async function fetchNominatim(q, limit) {
  await scheduleNominatimRequest();

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', q);
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('countrycodes', 'cz');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3200);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'user-agent':
          'AkceleratorAltruismu/2.5 (https://akcelerator-altruismu.vercel.app; kontakt@akcelerator-altruismu.cz)',
        'accept-language': 'cs,en;q=0.3'
      }
    });

    if (!res.ok) throw new Error(`Nominatim ${res.status}`);

    const items = await res.json();
    const results = [];
    for (const it of Array.isArray(items) ? items : []) {
      const lat = Number(it?.lat);
      const lon = Number(it?.lon);
      if (!isValidLatLon(lat, lon)) continue;
      const countryCode = safeText(it?.address?.country_code).toLowerCase();
      if (countryCode && countryCode !== 'cz') continue;

      results.push({
        label: safeText(it?.display_name).slice(0, 220),
        lat,
        lon,
        type: safeText(it?.type).slice(0, 40),
        class: safeText(it?.class).slice(0, 40),
        address: it?.address || null
      });
    }

    if (results.length === 0) {
      return { results: searchLocalTowns(q, limit), fallback: true };
    }

    return { results };
  } finally {
    clearTimeout(timer);
  }
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request, getClientAddress }) {
  const q = safeText(url.searchParams.get('q'));
  const rawLimit = Number(url.searchParams.get('limit') || 5);
  const limit = clamp(Number.isFinite(rawLimit) ? Math.trunc(rawLimit) : 5, 1, 8);

  if (!q || q.length < 2) {
    return json(
      { error: 'Missing query' },
      { status: 400, headers: { 'cache-control': 'no-store' } }
    );
  }

  if (q.length > 120) {
    return json(
      { error: 'Query too long' },
      { status: 400, headers: { 'cache-control': 'no-store' } }
    );
  }

  const clientKey = resolveClientKey(request, getClientAddress);
  const rl = checkRateLimit('geocode', clientKey, 60, 60_000);
  if (!rl.allowed) {
    return json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'cache-control': 'no-store', 'retry-after': String(rl.retryAfterSec) } }
    );
  }

  const key = `${q.toLowerCase()}:${limit}`;
  const now = Date.now();

  const cached = CACHE.get(key);
  if (cached && cached.expiresAt > now) {
    return json(cached.data, {
      headers: {
        'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
      }
    });
  }

  // Zero-latency fast path for known Czech cities/towns (when user isn't typing a postcode/street number)
  if (!/\d/.test(q)) {
    const instantMatches = searchLocalTowns(q, limit);
    const normQ = stripDiacritics(q).trim();
    const hasStrongCityMatch = instantMatches.some((t) => {
      const cityPart = stripDiacritics(t.label.split(',')[0]);
      return cityPart === normQ || (normQ.length >= 3 && cityPart.startsWith(normQ));
    });
    if (hasStrongCityMatch) {
      const fastPayload = { results: instantMatches, instant: true };
      setBoundedCache(CACHE, key, fastPayload, 24 * 60 * 60 * 1000, 300);
      return json(fastPayload, {
        headers: {
          'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
        }
      });
    }
  }

  if (INFLIGHT.has(key)) {
    const data = await INFLIGHT.get(key);
    return json(data, {
      headers: {
        'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
      }
    });
  }

  const p = fetchNominatim(q, limit)
    .then((data) => {
      setBoundedCache(CACHE, key, data, 24 * 60 * 60 * 1000, 300);
      return data;
    })
    .catch(() => {
      const fb = { results: searchLocalTowns(q, limit), fallback: true };
      setBoundedCache(CACHE, key, fb, 10 * 60 * 1000, 300);
      return fb;
    })
    .finally(() => {
      INFLIGHT.delete(key);
    });

  if (INFLIGHT.size < 100) {
    INFLIGHT.set(key, p);
  }

  const data = await p;
  return json(data, {
    headers: {
      'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
    }
  });
}
