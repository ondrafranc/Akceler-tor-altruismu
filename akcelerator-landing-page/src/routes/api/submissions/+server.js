import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

function safeText(v) {
  if (typeof v !== 'string') return '';
  return v.trim();
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
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
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) return null;
  return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
}

function isCzLatLon(lat, lon) {
  // Rough Czechia bounds (+ a small buffer)
  return lat >= 47.5 && lat <= 51.5 && lon >= 11.5 && lon <= 19.5;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return json({ success: false, error: 'Missing Supabase env' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot (bots)
  const hp = safeText(body?.hp);
  if (hp) {
    // Pretend success to discourage bots
    return json({ success: true }, { status: 200 });
  }

  const startedAt = toNumber(body?.started_at);
  if (startedAt && Date.now() - startedAt < 1500) {
    return json({ success: false, error: 'Too fast' }, { status: 400 });
  }

  const kind = safeText(body?.kind);
  if (!['org', 'event'].includes(kind)) {
    return json({ success: false, error: 'Invalid kind' }, { status: 400 });
  }

  const name = safeText(body?.name);
  if (!name || name.length < 2 || name.length > 120) {
    return json({ success: false, error: 'Invalid name' }, { status: 400 });
  }

  const category = safeText(body?.category) || null; // optional, free-text for now
  const description = safeText(body?.description) || null;

  const website = normalizeUrl(body?.website);
  const email = safeText(body?.email) || null;
  const phone = safeText(body?.phone) || null;

  const address_label = safeText(body?.address_label) || null;
  const city = safeText(body?.city) || null;
  const postcode = safeText(body?.postcode) || null;

  const lat = toNumber(body?.lat);
  const lon = toNumber(body?.lon);

  // For now: require coordinates (selected via the built-in geocoder UI)
  if (lat == null || lon == null) {
    return json({ success: false, error: 'Missing location' }, { status: 400 });
  }
  if (!isCzLatLon(lat, lon)) {
    return json({ success: false, error: 'Location outside Czechia' }, { status: 400 });
  }

  const event_url = normalizeUrl(body?.event_url);
  const event_start = safeText(body?.event_start) || null; // ISO string (optional)
  const event_end = safeText(body?.event_end) || null; // ISO string (optional)

  if (kind === 'event' && !event_url) {
    return json({ success: false, error: 'Missing event link' }, { status: 400 });
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

  const { data, error } = await supabase
    .from('community_submissions')
    .insert([row])
    .select('id')
    .single();

  if (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }

  return json({ success: true, id: data?.id || null });
}


