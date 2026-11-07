import { json } from '@sveltejs/kit';
import { CZECH_CITIES } from '$lib/data/czech-actions.js';

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
  { label: 'Uherské Hradiště, Zlínský kraj, Česko', lat: 49.0697, lon: 17.4597, type: 'city' }
];

function stripDiacritics(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function searchLocalTowns(q, limit = 5) {
  const normQ = stripDiacritics(q);
  return LOCAL_CZECH_TOWNS.filter((t) => stripDiacritics(t.label).includes(normQ)).slice(0, limit);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function safeText(v) {
  if (typeof v !== 'string') return '';
  return v.trim();
}

async function throttleUpstream(minIntervalMs = 1100) {
  const now = Date.now();
  const wait = LAST_UPSTREAM_TS + minIntervalMs - now;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  LAST_UPSTREAM_TS = Date.now();
}

async function fetchNominatim(q, limit) {
  await throttleUpstream();

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
        'user-agent': 'AkceleratorAltruismu/2.0 (SvelteKit; Czech-only)',
        'accept-language': 'cs,en;q=0.3'
      }
    });

    if (!res.ok) throw new Error(`Nominatim ${res.status}`);

    const items = await res.json();
    const results = [];
    for (const it of Array.isArray(items) ? items : []) {
      const lat = Number(it?.lat);
      const lon = Number(it?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const countryCode = safeText(it?.address?.country_code).toLowerCase();
      if (countryCode && countryCode !== 'cz') continue;

      results.push({
        label: safeText(it?.display_name),
        lat,
        lon,
        type: safeText(it?.type),
        class: safeText(it?.class),
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
export async function GET({ url }) {
  const q = safeText(url.searchParams.get('q'));
  const limit = clamp(Number(url.searchParams.get('limit') || 5), 1, 8);

  if (!q || q.length < 2) {
    return json(
      { error: 'Missing query' },
      {
        status: 400,
        headers: { 'cache-control': 'no-store' }
      }
    );
  }

  if (q.length > 120) {
    return json(
      { error: 'Query too long' },
      {
        status: 400,
        headers: { 'cache-control': 'no-store' }
      }
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
      CACHE.set(key, { expiresAt: now + 24 * 60 * 60 * 1000, data });
      return data;
    })
    .catch(() => {
      return { results: searchLocalTowns(q, limit), fallback: true };
    })
    .finally(() => {
      INFLIGHT.delete(key);
    });

  INFLIGHT.set(key, p);

  const data = await p;
  return json(data, {
    headers: {
      'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
    }
  });
}


