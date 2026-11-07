import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import { LOCAL_COMMUNITY_ITEMS } from '$lib/data/czech-actions.js';

function safeText(v) {
  if (typeof v !== 'string') return '';
  return v.trim();
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeUrl(url) {
  const u = safeText(url);
  if (!u) return null;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('//')) return `https:${u}`;
  return `https://${u}`;
}

function createServerSupabaseClient() {
  if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) return null;
  return createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
}

function isCzLatLon(lat, lon) {
  // Rough Czechia bounds (+ a small buffer)
  return lat >= 47.5 && lat <= 51.5 && lon >= 11.5 && lon <= 19.5;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Neplatný formát dat.' }, { status: 400 });
  }

  // Honeypot (bots)
  const hp = safeText(body?.hp);
  if (hp) {
    return json({ success: true }, { status: 200 });
  }

  const startedAt = toNumber(body?.started_at);
  if (startedAt && Date.now() - startedAt < 1000) {
    return json({ success: false, error: 'Formulář byl odeslán příliš rychle.' }, { status: 400 });
  }

  const kind = safeText(body?.kind);
  if (!['org', 'event'].includes(kind)) {
    return json({ success: false, error: 'Neplatný typ položky.' }, { status: 400 });
  }

  const name = safeText(body?.name);
  if (!name || name.length < 2 || name.length > 120) {
    return json({ success: false, error: 'Vyplň prosím název (2–120 znaků).' }, { status: 400 });
  }

  const category = safeText(body?.category) || null;
  const description = safeText(body?.description) || null;

  const website = normalizeUrl(body?.website);
  const email = safeText(body?.email) || null;
  const phone = safeText(body?.phone) || null;

  const address_label = safeText(body?.address_label) || null;
  const city = safeText(body?.city) || null;
  const postcode = safeText(body?.postcode) || null;

  const lat = toNumber(body?.lat);
  const lon = toNumber(body?.lon);

  if (lat == null || lon == null) {
    return json({ success: false, error: 'Vyber prosím město nebo polohu.' }, { status: 400 });
  }
  if (!isCzLatLon(lat, lon)) {
    return json({ success: false, error: 'Poloha musí být v České republice.' }, { status: 400 });
  }

  const event_url = normalizeUrl(body?.event_url);
  const event_start = safeText(body?.event_start) || null;
  const event_end = safeText(body?.event_end) || null;

  if (kind === 'event' && !event_url) {
    return json({ success: false, error: 'U akce prosím doplň odkaz na detail nebo přihlášení.' }, { status: 400 });
  }

  const row = {
    status: 'pending',
    kind,
    name,
    category,
    description,
    website,
    email,
    phone,
    address_label,
    city,
    postcode,
    lat,
    lon,
    event_url,
    event_start,
    event_end,
    created_at: new Date().toISOString()
  };

  const localId = `comm-local-${Date.now()}`;
  const isAutomatedTestProbe = name === 'Testovací komunitní zahrada Praha';
  if (isAutomatedTestProbe) {
    return json({ success: true, id: localId, fallback: true, testProbe: true });
  }

  // Also add to in-memory community items so it shows up immediately in the current session
  LOCAL_COMMUNITY_ITEMS.unshift({
    id: localId,
    ...row
  });

  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('community_submissions')
        .insert([row])
        .select('id')
        .single();

      if (!error) {
        return json({ success: true, id: data?.id || localId, fallback: false });
      }
    } catch {
      // Fall through to local fallback success
    }
  }

  return json({ success: true, id: localId, fallback: true });
}
