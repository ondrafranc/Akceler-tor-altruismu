import { json } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { getServerSupabase, withTimeout, hashClientKey } from '$lib/server/supabase.js';
import {
  safeText,
  toFiniteNumber,
  isCzLatLon,
  sanitizeHttpUrl,
  sanitizeEmail,
  sanitizePhone,
  checkRateLimit,
  resolveClientKey,
  readJsonBodyBounded,
  validateMutationOrigin,
  isSubmissionTooFast,
  isAuthorizedTestBypass
} from '$lib/security.js';

function sanitizeOptionalIsoDate(raw) {
  const s = safeText(raw);
  if (!s) return { ok: true, value: null };
  if (s.length > 40) return { ok: false, value: null };
  const parsed = Date.parse(s);
  if (!Number.isFinite(parsed)) return { ok: false, value: null };
  return { ok: true, value: new Date(parsed).toISOString() };
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, url, getClientAddress }) {
  if (!validateMutationOrigin(request, url)) {
    return json(
      { success: false, error: 'Nepovolený původ požadavku.' },
      { status: 403 }
    );
  }

  const parsedBody = await readJsonBodyBounded(request, 24_576);
  if (!parsedBody.ok) {
    return json({ success: false, error: parsedBody.error }, { status: parsedBody.status });
  }
  const body = parsedBody.data;

  // Honeypot (bots)
  const hp = safeText(body.hp);
  if (hp) {
    return json({ success: true }, { status: 200 });
  }

  const clientKey = resolveClientKey(request, getClientAddress);
  const isTestBypass = isAuthorizedTestBypass(request);

  if (!isTestBypass) {
    const rl = checkRateLimit('submissions', clientKey, 15, 10 * 60 * 1000);
    if (!rl.allowed) {
      return json(
        { success: false, error: 'Příliš mnoho odeslaných tipů v krátkém čase. Zkus to prosím za chvíli.' },
        { status: 429, headers: { 'retry-after': String(rl.retryAfterSec) } }
      );
    }
  }

  if (isSubmissionTooFast(body)) {
    return json({ success: false, error: 'Formulář byl odeslán příliš rychle.' }, { status: 400 });
  }

  const kind = safeText(body.kind) || 'org';
  if (!['org', 'event'].includes(kind)) {
    return json({ success: false, error: 'Neplatný typ položky.' }, { status: 400 });
  }

  const name = safeText(body.name);
  if (!name || name.length < 2 || name.length > 120) {
    return json({ success: false, error: 'Vyplň prosím název (2–120 znaků).' }, { status: 400 });
  }

  const rawCategory = safeText(body.category);
  if (rawCategory.length > 80) {
    return json({ success: false, error: 'Kategorie může mít nejvýše 80 znaků.' }, { status: 400 });
  }
  const category = rawCategory || 'other';

  const rawDescription = safeText(body.description);
  if (rawDescription.length > 600) {
    return json({ success: false, error: 'Popis může mít nejvýše 600 znaků.' }, { status: 400 });
  }

  const rawWebsite = safeText(body.website ?? body.url);
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

  const address_label = safeText(body.address_label ?? body.address).slice(0, 200) || null;
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

  if (kind === 'event' && !event_url && !website) {
    return json({ success: false, error: 'U akce prosím doplň odkaz na detail nebo přihlášení.' }, { status: 400 });
  }

  const startRes = sanitizeOptionalIsoDate(body.event_start);
  const endRes = sanitizeOptionalIsoDate(body.event_end);
  if (!startRes.ok || !endRes.ok) {
    return json({ success: false, error: 'Neplatný formát data nebo času akce.' }, { status: 400 });
  }

  const fullAddress = [address_label, postcode].filter(Boolean).join(', ') || city || null;
  const contactStr = [email, phone, safeText(body.contact).slice(0, 120)].filter(Boolean).join(' · ') || null;
  const effectiveUrl = event_url || website || null;
  const description =
    rawDescription ||
    `${name}${city || address_label ? ` (${city || address_label})` : ''}`;

  const dbRow = {
    name,
    category,
    description,
    city: city || address_label || null,
    address: fullAddress,
    lat,
    lon,
    url: effectiveUrl,
    contact: contactStr,
    status: 'pending',
    ip_hash: hashClientKey(clientKey)
  };

  const supabase = getServerSupabase();
  if (!supabase) {
    return json(
      {
        success: false,
        error: 'Databázová služba není nakonfigurována. Zkus to prosím později.'
      },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('community_submissions')
        .insert([dbRow])
        .select('id, created_at, status')
        .single(),
      2800,
      'Supabase submission insert timeout'
    );

    if (error || !data) {
      return json(
        {
          success: false,
          error: 'Tip se nepodařilo uložit do databáze. Zkus to prosím za chvíli.'
        },
        { status: 503 }
      );
    }

    return json({
      success: true,
      id: data.id,
      status: data.status || 'pending',
      fallback: false,
      moderationNotice:
        'Tvůj tip byl odeslán ke kontrole. Jakmile ověříme kontaktní údaje, zobrazí se na mapě všem. Na tomto zařízení už své místo vidíš s označením „Čeká na schválení“.',
      item: {
        id: data.id,
        kind,
        name,
        category,
        description,
        city: dbRow.city,
        address_label: fullAddress,
        website: website || effectiveUrl,
        event_url,
        email,
        phone,
        lat,
        lon,
        status: 'pending',
        created_at: data.created_at
      }
    });
  } catch {
    return json(
      {
        success: false,
        error: 'Databázová služba momentálně neodpovídá. Zkus to prosím za chvíli.'
      },
      { status: 503 }
    );
  }
}

/**
 * Moderator endpoint to approve or reject pending community submissions (H11 / AUDIT #17).
 * Requires header `x-moderator-secret` matching MODERATOR_SECRET or SUPABASE_SERVICE_ROLE_KEY.
 * @type {import('./$types').RequestHandler}
 */
export async function PATCH({ request }) {
  const modSecret = (request.headers.get('x-moderator-secret') || '').trim();
  const expectedSecret = (
    privateEnv.MODERATOR_SECRET ||
    privateEnv.SUPABASE_SERVICE_ROLE_KEY ||
    privateEnv.SUPABASE_SECRET_KEY ||
    ''
  ).trim();

  if (!modSecret || !expectedSecret || modSecret !== expectedSecret) {
    return json({ success: false, error: 'Neautorizovaný přístup.' }, { status: 401 });
  }

  const parsed = await readJsonBodyBounded(request, 8192);
  if (!parsed.ok) {
    return json({ success: false, error: parsed.error }, { status: parsed.status });
  }

  const id = safeText(parsed.data.id);
  const status = safeText(parsed.data.status);
  if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
    return json({ success: false, error: 'Chybí platné ID nebo cílový status.' }, { status: 400 });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return json({ success: false, error: 'Databáze není nakonfigurována.' }, { status: 503 });
  }

  const { data, error } = await withTimeout(
    supabase
      .from('community_submissions')
      .update({ status })
      .eq('id', id)
      .select('id, name, status')
      .single(),
    2800,
    'Supabase moderation update timeout'
  );

  if (error || !data) {
    return json({ success: false, error: 'Nepodařilo se změnit stav záznamu.' }, { status: 500 });
  }

  return json({ success: true, item: data });
}
