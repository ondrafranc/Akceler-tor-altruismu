import { json } from '@sveltejs/kit';

/** @type {Map<string, { expiresAt: number, data: any }>} */
const CACHE = new Map();
/** @type {Map<string, Promise<any>>} */
const INFLIGHT = new Map();

let LAST_UPSTREAM_TS = 0;

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

  const res = await fetch(url.toString(), {
    headers: {
      // Please replace with a public contact email when available.
      'user-agent': 'AkceleratorAltruismu/1.0 (SvelteKit; Czech-only; contact: none)',
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

  return { results };
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


