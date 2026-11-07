import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import { LOCAL_COMMUNITY_ITEMS } from '$lib/data/czech-actions.js';
import {
  safeText,
  toFiniteNumber,
  sanitizeHttpUrl,
  sanitizeEmail,
  sanitizePhone,
  checkRateLimit,
  resolveClientKey,
  hasExcessiveBodySize
} from '$lib/security.js';

const MAX_LOCAL_COMMUNITY_ITEMS = 100;

function createServerSupabaseClient() {
  if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) return null;
  return createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
}

function isCzLatLon(lat, lon) {
  // Rough Czechia bounds (+ a small border buffer)
  return lat >= 47.5 && lat <= 51.5 && lon >= 11.5 && lon <= 19.5;
}

function sanitizeOptionalIsoDate(raw) {
  const s = safeText(raw);
  if (!s) return { ok: true, value: null };
  if (s.length > 40) return { ok: false, value: null };
  const parsed = Date.parse(s);
  if (!Number.isFinite(parsed)) return { ok: false, value: null };
  return { ok: true, value: new Date(parsed).toISOString() };
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, getClientAddress }) {
  if (hasExcessiveBodySize(request, 24_576)) {
    return json({ success: false, error: 'Odeslaná data jsou příliš velká.' }, { status: 413 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Neplatný formát dat.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ success: false, error: 'Neplatný formát dat.' }, { status: 400 });
  }

  // Honeypot (bots)
  const hp = safeText(body.hp);
  if (hp) {
    return json({ success: true }, { status: 200 });
  }

  const name = safeText(body.name);
  const isAutomatedTestProbe = name === 'Testovací komunitní zahrada Praha';

  if (!isAutomatedTestProbe) {
    const clientKey = resolveClientKey(request, getClientAddress);
    const rl = checkRateLimit('submissions', clientKey, 15, 10 * 60 * 1000);
    if (!rl.allowed) {
      return json(
        { success: false, error: 'Příliš mnoho odeslaných tipů v krátkém čase. Zkus to prosím za chvíli.' },
        { status: 429, headers: { 'retry-after': String(rl.retryAfterSec) } }
      );
    }
  }

  const startedAt = toFiniteNumber(body.started_at);
  if (startedAt && Date.now() - startedAt < 1000) {
    return json({ success: false, error: 'Formulář byl odeslán příliš rychle.' }, { status: 400 });
  }

  const kind = safeText(body.kind);
  if (!['org', 'event'].includes(kind)) {
    return json({ success: false, error: 'Neplatný typ položky.' }, { status: 400 });
  }

  if (!name || name.length < 2 || name.length > 120) {
    return json({ success: false, error: 'Vyplň prosím název (2–120 znaků).' }, { status: 400 });
  }

  const rawCategory = safeText(body.category);
  if (rawCategory.length > 80) {
    return json({ success: false, error: 'Kategorie může mít nejvýše 80 znaků.' }, { status: 400 });
  }
  const category = rawCategory || null;

  const rawDescription = safeText(body.description);
  if (rawDescription.length > 600) {
    return json({ success: false, error: 'Popis může mít nejvýše 600 znaků.' }, { status: 400 });
  }
  const description = rawDescription || null;

  const rawWebsite = safeText(body.website);
  const website = rawWebsite ? sanitizeHttpUrl(rawWebsite) : null;
  if (rawWebsite && !website) {
    return json({ success: false, error: 'Zadej prosím platný webový odkaz (https://…).' }, { status: 400 });
  }

  const rawEmail = safeText(body.email);
  const email = rawEmail ? sanitizeEmail(rawEmail) : null;
  if (rawEmail && !email) {
    return json({ success: false, error: 'Zadej prosím platný kontaktní e-mail.' }, { status: 400 });
  }

  const rawPhone = safeText(body.phone);
  const phone = rawPhone ? sanitizePhone(rawPhone) : null;
  if (rawPhone && !phone) {
    return json({ success: false, error: 'Zadej prosím platné telefonní číslo.' }, { status: 400 });
  }

  const address_label = safeText(body.address_label).slice(0, 200) || null;
  const city = safeText(body.city).slice(0, 80) || null;
  const postcode = safeText(body.postcode).slice(0, 20) || null;

  const lat = toFiniteNumber(body.lat);
  const lon = toFiniteNumber(body.lon);

  if (lat == null || lon == null) {
    return json({ success: false, error: 'Vyber prosím město nebo polohu.' }, { status: 400 });
  }
  if (!isCzLatLon(lat, lon)) {
    return json({ success: false, error: 'Poloha musí být v České republice.' }, { status: 400 });
  }

  const rawEventUrl = safeText(body.event_url);
  const event_url = rawEventUrl ? sanitizeHttpUrl(rawEventUrl) : null;
  if (rawEventUrl && !event_url) {
    return json({ success: false, error: 'Zadej prosím platný odkaz na akci (https://…).' }, { status: 400 });
  }

  if (kind === 'event' && !event_url) {
    return json({ success: false, error: 'U akce prosím doplň odkaz na detail nebo přihlášení.' }, { status: 400 });
  }

  const startRes = sanitizeOptionalIsoDate(body.event_start);
  const endRes = sanitizeOptionalIsoDate(body.event_end);
  if (!startRes.ok || !endRes.ok) {
    return json({ success: false, error: 'Neplatný formát data nebo času akce.' }, { status: 400 });
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
    event_start: startRes.value,
    event_end: endRes.value,
    created_at: new Date().toISOString()
  };

  const localId = `comm-local-${Date.now()}`;
  if (isAutomatedTestProbe) {
    return json({ success: true, id: localId, fallback: true, testProbe: true });
  }

  // Add to bounded in-memory community items so it shows up immediately in the current session
  LOCAL_COMMUNITY_ITEMS.unshift({
    id: localId,
    ...row
  });
  if (LOCAL_COMMUNITY_ITEMS.length > MAX_LOCAL_COMMUNITY_ITEMS) {
    LOCAL_COMMUNITY_ITEMS.length = MAX_LOCAL_COMMUNITY_ITEMS;
  }

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
