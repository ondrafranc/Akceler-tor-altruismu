import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { getServerSupabase, withTimeout } from '$lib/server/supabase.js';
import { CZECH_CITIES } from '$lib/data/czech-actions.js';
import {
  safeText,
  checkRateLimit,
  resolveClientKey,
  readJsonBodyBounded,
  validateMutationOrigin
} from '$lib/security.js';

const PULSE_TEMPLATES = [
  {
    actionId: 'zvirata_utulek_online',
    verb: 'naplnil misku v útulku',
    infinitive: 'naplnit misku v útulku jedním klikem',
    icon: '🐾'
  },
  {
    actionId: 'missing_maps',
    verb: 'zmapoval čtvrť pro Lékaře bez hranic',
    infinitive: 'zmapovat čtvrť pro Lékaře bez hranic',
    icon: '🗺️'
  },
  {
    actionId: 'knihobudka_kniha',
    verb: 'přidal knížku do veřejné knihobudky',
    infinitive: 'přidat knížku do veřejné knihobudky',
    icon: '📚'
  },
  {
    actionId: 'birdlife_ptaci_pasti',
    verb: 'nahlásil skleněnou zastávku v Ptačích pastech',
    infinitive: 'nahlásit nebezpečné sklo v Ptačích pastech',
    icon: '🐦'
  },
  {
    actionId: 'letters_seniors',
    verb: 'napsal dopis osamělému seniorovi',
    infinitive: 'napsat dopis osamělému seniorovi',
    icon: '✉️'
  },
  {
    actionId: 'estudanky_pramen',
    verb: 'zkontroloval lesní studánku v okolí',
    infinitive: 'zkontrolovat lesní studánku v okolí',
    icon: '💧'
  },
  {
    actionId: 'remobil_telefon',
    verb: 'poslal starý telefon ze šuplíku přes Remobil',
    infinitive: 'poslat starý telefon ze šuplíku přes Remobil',
    icon: '📱'
  },
  {
    actionId: 'freerice_ryze',
    verb: 'daroval zrnka rýže v kvízu Freerice',
    infinitive: 'darovat zrnka rýže v kvízu Freerice',
    icon: '🍚'
  },
  {
    actionId: 'wikipedie_cz',
    verb: 'doplnil článek na české Wikipedii',
    infinitive: 'doplnit fakt na české Wikipedii',
    icon: '📝'
  },
  {
    actionId: 'sazime_budoucnost',
    verb: 'podpořil výsadbu stromu v krajině',
    infinitive: 'podpořit výsadbu stromu v krajině',
    icon: '🌳'
  },
  {
    actionId: 'darovani_krve',
    verb: 'se objednal na odběr krve v nemocnici',
    infinitive: 'objednat se na odběr krve v nemocnici',
    icon: '🩸'
  },
  {
    actionId: 'zooniverse_veda',
    verb: 'klasifikoval snímek v občanské vědě Zooniverse',
    infinitive: 'klasifikovat snímek v občanské vědě Zooniverse',
    icon: '🔭'
  }
];

const CITY_LOCATIVES = {
  praha: 'v Praze',
  brno: 'v Brně',
  ostrava: 'v Ostravě',
  plzen: 'v Plzni',
  liberec: 'v Liberci',
  olomouc: 'v Olomouci',
  budejovice: 'v Českých Budějovicích',
  hradec: 'v Hradci Králové',
  pardubice: 'v Pardubicích',
  usti: 'v Ústí nad Labem',
  zlin: 've Zlíně',
  jihlava: 'v Jihlavě',
  karlovyvary: 'v Karlových Varech',
  vary: 'v Karlových Varech',
  kladno: 'v Kladně',
  tabor: 'v Táboře',
  most: 'v Mostě',
  opava: 'v Opavě',
  znojmo: 've Znojmě',
  pisek: 'v Písku',
  kolin: 'v Kolíně',
  mladaboleslav: 'v Mladé Boleslavi'
};

/** @type {{ expiresAt: number, data: any } | null} */
let LIVE_PULSE_CACHE = null;

/**
 * Safely normalizes any slot parameter (including negative or extreme numbers) into a non-negative integer (M1).
 * @param {unknown} rawSlot
 * @returns {number}
 */
function normalizeSlot(rawSlot) {
  if (rawSlot === null || rawSlot === undefined || rawSlot === '') {
    return Math.floor(Date.now() / 15000);
  }
  const n = Number(rawSlot);
  if (!Number.isFinite(n)) {
    return Math.floor(Date.now() / 15000);
  }
  const absInt = Math.abs(Math.trunc(n));
  return Number.isSafeInteger(absInt) ? absInt : Math.floor(Date.now() / 15000);
}

function resolveCityLocative(cityRaw) {
  const cleaned = String(cityRaw || 'Brno').replace(/\s*\([^)]*\)/g, '').trim();
  const normKey = cleaned
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  if (CITY_LOCATIVES[normKey]) return { cleanCityName: cleaned, loc: CITY_LOCATIVES[normKey] };
  const matched = CZECH_CITIES.find(
    (c) =>
      c.id === normKey ||
      String(c.name || '')
        .replace(/\s*\([^)]*\)/g, '')
        .trim()
        .toLowerCase() === cleaned.toLowerCase()
  );
  if (matched && CITY_LOCATIVES[matched.id]) {
    const cleanName = String(matched.name).replace(/\s*\([^)]*\)/g, '').trim();
    return { cleanCityName: cleanName, loc: CITY_LOCATIVES[matched.id] };
  }
  return { cleanCityName: cleaned || 'Česku', loc: 'v Česku' };
}

/**
 * Builds an honest inspirational tip when no live event is in the database (H12 / AUDIT #20).
 * @param {number} rawSlot
 */
function buildInspirationPayload(rawSlot = Math.floor(Date.now() / 15000)) {
  const slot = normalizeSlot(rawSlot);
  const cities = CZECH_CITIES.length ? CZECH_CITIES : [{ id: 'brno', name: 'Brno' }];
  const city = cities[slot % cities.length] || { id: 'brno', name: 'Brno' };
  const tpl = PULSE_TEMPLATES[(slot * 3 + 1) % PULSE_TEMPLATES.length] || PULSE_TEMPLATES[0];
  const cleanCityName = String(city.name || 'Brno').replace(/\s*\([^)]*\)/g, '').trim();
  const loc = CITY_LOCATIVES[city.id] || `v ${cleanCityName}`;
  return {
    message: `Tip na dobrý skutek ${loc}: můžeš ${tpl.infinitive}`,
    city: cleanCityName,
    actionId: tpl.actionId,
    icon: tpl.icon,
    ts: Date.now(),
    isLive: false,
    source: 'inspiration'
  };
}

/**
 * Queries real anonymous pulse_events from Supabase (cached for 15s).
 */
async function resolvePulsePayload(rawSlot) {
  const now = Date.now();
  if (LIVE_PULSE_CACHE && LIVE_PULSE_CACHE.expiresAt > now && rawSlot == null) {
    return LIVE_PULSE_CACHE.data;
  }

  const supabase = getServerSupabase();
  if (supabase && rawSlot == null) {
    try {
      const sinceIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await withTimeout(
        supabase
          .from('pulse_events')
          .select('id, created_at, action_id, city, kind')
          .gte('created_at', sinceIso)
          .order('created_at', { ascending: false })
          .limit(5),
        1800,
        'Supabase pulse query timeout'
      );

      if (!error && Array.isArray(data) && data.length > 0) {
        const latest = data[0];
        // Neznámý skutek (např. místo z mapy) NESMÍ spadnout na „naplnil misku v útulku“
        const tpl = PULSE_TEMPLATES.find((t) => t.actionId === latest.action_id) || {
          actionId: latest.action_id,
          verb: 'udělal drobný dobrý skutek',
          icon: '🌱'
        };
        const { cleanCityName, loc } = latest.city
          ? resolveCityLocative(latest.city)
          : { cleanCityName: '', loc: '' };
        const eventTs = Date.parse(latest.created_at) || now;
        const livePayload = {
          message: `${relativeTimeLabel(now - eventTs)} někdo ${loc ? `${loc} ` : ''}${tpl.verb}`,
          city: cleanCityName,
          actionId: tpl.actionId,
          icon: tpl.icon,
          ts: eventTs,
          isLive: true,
          recentCount: data.length,
          source: 'supabase-live'
        };
        LIVE_PULSE_CACHE = { expiresAt: now + 15_000, data: livePayload };
        return livePayload;
      }
    } catch {
      // Fall back to honest inspiration tip
    }
  }

  const fallback = buildInspirationPayload(rawSlot);
  if (rawSlot == null) {
    LIVE_PULSE_CACHE = { expiresAt: now + 15_000, data: fallback };
  }
  return fallback;
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request }) {
  const wantsStream =
    url.searchParams.get('stream') === '1' ||
    (request.headers.get('accept') || '').includes('text/event-stream');

  const rawSlot = url.searchParams.get('slot');
  const payload = await resolvePulsePayload(rawSlot);

  if (wantsStream) {
    const body = `retry: 15000\nevent: pulse\ndata: ${JSON.stringify(payload)}\n\n`;
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform'
      }
    });
  }

  return json(payload, {
    headers: {
      'cache-control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=120'
    }
  });
}

/**
 * Pravdivé časové určení: „Před chvílí“ jen do 10 minut, jinak skutečné stáří události (max. 24 h).
 * @param {number} ageMs
 */
function relativeTimeLabel(ageMs) {
  const min = Math.max(0, Math.round(ageMs / 60000));
  if (min < 10) return 'Před chvílí';
  if (min < 60) return `Před ${min} min`;
  const h = Math.round(min / 60);
  if (h <= 1) return 'Před hodinou';
  return `Před ${h} h`;
}

/**
 * Lokální vývoj a automatické testy nesmí zapisovat do živé tabulky `pulse_events`
 * (jinak se testovací skutek ukáže skutečným lidem jako „Před chvílí někdo…“).
 * Výjimku lze zapnout proměnnou PULSE_ALLOW_DEV_WRITES=1.
 * @param {Request} request
 * @param {URL} url
 */
function isNonProductionTraffic(request, url) {
  if (env.PULSE_ALLOW_DEV_WRITES === '1') return false;
  if (dev) return true;
  const host = (url.hostname || '').toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') return true;
  const ua = request.headers.get('user-agent') || '';
  return /HeadlessChrome|Playwright/i.test(ua);
}

/**
 * Records a real anonymous completed/started action into Supabase `pulse_events` (H12).
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, url, getClientAddress }) {
  if (!validateMutationOrigin(request, url)) {
    return json({ success: false, error: 'Nepovolený původ požadavku.' }, { status: 403 });
  }

  const clientKey = resolveClientKey(request, getClientAddress);
  const rl = checkRateLimit('pulse-post', clientKey, 30, 5 * 60 * 1000);
  if (!rl.allowed) {
    return json({ success: false, error: 'Too many events' }, { status: 429 });
  }

  const parsed = await readJsonBodyBounded(request, 4096);
  if (!parsed.ok) {
    return json({ success: false, error: parsed.error }, { status: parsed.status });
  }

  const actionId = safeText(parsed.data.action_id ?? parsed.data.actionId).slice(0, 80);
  if (!actionId) {
    return json({ success: false, error: 'Chybí action_id.' }, { status: 400 });
  }
  // Bez skutečného města nic nevymýšlíme (dříve se doplňovala „Praha“)
  const city = safeText(parsed.data.city).slice(0, 60) || null;
  const kind = safeText(parsed.data.kind) === 'completed' ? 'completed' : 'click';

  if (isNonProductionTraffic(request, url)) {
    return json({ success: true, skipped: 'non-production' });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return json({ success: false, error: 'Databáze není dostupná.' }, { status: 503 });
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('pulse_events')
        .insert([{ action_id: actionId, city, kind }])
        .select('id, created_at')
        .single(),
      2200,
      'Supabase pulse insert timeout'
    );
    if (error || !data) {
      return json({ success: false, error: 'Uložení selhalo.' }, { status: 503 });
    }
    LIVE_PULSE_CACHE = null;
    return json({ success: true, id: data.id });
  } catch {
    return json({ success: false, error: 'Databáze neodpovídá.' }, { status: 503 });
  }
}
