import { json } from '@sveltejs/kit';
import crypto from 'node:crypto';
import { env as privateEnv } from '$env/dynamic/private';
import { getServerSupabase, getAdminSupabase, withTimeout, hashClientKey } from '$lib/server/supabase.js';
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
  isAuthorizedTestBypass,
  safeCompareTokens
} from '$lib/security.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Truncates a string by Unicode code points so 4-byte surrogate pairs are never split
 * and Postgres `char_length()` limits are strictly respected.
 * @param {string} str
 * @param {number} maxCodePoints
 * @returns {string}
 */
function sliceCodePoints(str, maxCodePoints) {
  if (!str) return '';
  return Array.from(str).slice(0, maxCodePoints).join('');
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

  const address_label = sliceCodePoints(safeText(body.address_label ?? body.address), 200) || null;
  const city = sliceCodePoints(safeText(body.city), 80) || null;
  const postcode = sliceCodePoints(safeText(body.postcode), 20) || null;

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
  if (startRes.value && endRes.value && Date.parse(endRes.value) < Date.parse(startRes.value)) {
    return json({ success: false, error: 'Konec akce nemůže být dříve než začátek.' }, { status: 400 });
  }

  const fullAddress = [address_label, postcode].filter(Boolean).join(', ') || city || null;
  const contactStr = [email, phone, sliceCodePoints(safeText(body.contact), 120)].filter(Boolean).join(' · ') || null;
  const effectiveUrl = event_url || website || null;
  const description =
    rawDescription ||
    `${name}${city || address_label ? ` (${city || address_label})` : ''}`;

  const submissionId = crypto.randomUUID();
  const baseDbRow = {
    id: submissionId,
    kind,
    name,
    category,
    description,
    city: sliceCodePoints(city || address_label || '', 80) || null,
    address: fullAddress,
    lat,
    lon,
    url: effectiveUrl,
    contact: contactStr,
    status: 'pending',
    ip_hash: hashClientKey(clientKey)
  };
  const hasEventDates = Boolean(startRes.value || endRes.value);
  const dbRow = hasEventDates
    ? {
        ...baseDbRow,
        ...(startRes.value ? { event_start: startRes.value } : {}),
        ...(endRes.value ? { event_end: endRes.value } : {})
      }
    : baseDbRow;

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
    let { error } = await withTimeout(
      supabase.from('community_submissions').insert([dbRow]),
      2800,
      'Supabase submission insert timeout'
    );

    if (
      error &&
      hasEventDates &&
      (error.code === 'PGRST204' ||
        error.code === '42703' ||
        /event_(start|end)/i.test(error.message || ''))
    ) {
      ({ error } = await withTimeout(
        supabase.from('community_submissions').insert([baseDbRow]),
        2800,
        'Supabase submission fallback insert timeout'
      ));
    }

    if (error) {
      return json(
        {
          success: false,
          error: 'Tip se nepodařilo uložit do databáze. Zkus to prosím za chvíli.'
        },
        { status: 503 }
      );
    }

    const nowIso = new Date().toISOString();

    return json({
      success: true,
      id: submissionId,
      status: 'pending',
      fallback: false,
      moderationNotice:
        'Tvůj tip byl odeslán ke kontrole. Jakmile ověříme kontaktní údaje, zobrazí se na mapě všem. Na tomto zařízení už své místo vidíš s označením „Čeká na schválení“.',
      item: {
        id: submissionId,
        kind,
        name,
        category,
        description,
        city: dbRow.city,
        address_label: fullAddress,
        website: website || effectiveUrl,
        event_url,
        event_start: startRes.value,
        event_end: endRes.value,
        email,
        phone,
        lat,
        lon,
        status: 'pending',
        created_at: nowIso
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
 * Requires header `x-moderator-secret` matching MODERATOR_SECRET strictly.
 * @type {import('./$types').RequestHandler}
 */
export async function PATCH({ request, getClientAddress }) {
  const modSecret = (request.headers.get('x-moderator-secret') || '').trim();
  const expectedSecret = (privateEnv.MODERATOR_SECRET || '').trim();

  if (!modSecret || !expectedSecret || !safeCompareTokens(modSecret, expectedSecret)) {
    return json(
      { success: false, error: 'Neautorizovaný přístup.' },
      { status: 401, headers: { 'cache-control': 'no-store' } }
    );
  }

  const clientKey = resolveClientKey(request, getClientAddress);
  const rl = checkRateLimit('submissions-mod', clientKey, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return json(
      { success: false, error: 'Příliš mnoho pokusů o moderaci. Zkus to prosím později.' },
      {
        status: 429,
        headers: { 'cache-control': 'no-store', 'retry-after': String(rl.retryAfterSec) }
      }
    );
  }

  const ct = (request.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    return json(
      { success: false, error: 'Vyžadován Content-Type application/json.' },
      { status: 415, headers: { 'cache-control': 'no-store' } }
    );
  }

  const parsed = await readJsonBodyBounded(request, 8192);
  if (!parsed.ok) {
    return json(
      { success: false, error: parsed.error },
      { status: parsed.status, headers: { 'cache-control': 'no-store' } }
    );
  }

  const patchData = parsed.data;
  const id = safeText(patchData.id);
  const status = safeText(patchData.status);
  if (!UUID_RE.test(id) || !['approved', 'rejected', 'pending'].includes(status)) {
    return json(
      { success: false, error: 'Chybí platné UUID nebo cílový status.' },
      { status: 400, headers: { 'cache-control': 'no-store' } }
    );
  }

  const supabase = getAdminSupabase();
  if (!supabase) {
    return json(
      { success: false, error: 'Administrátorský přístup k databázi není nakonfigurován.' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }

  try {
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

    if (error?.code === 'PGRST116') {
      return json(
        { success: false, error: 'Záznam s tímto ID nebyl nalezen.' },
        { status: 404, headers: { 'cache-control': 'no-store' } }
      );
    }

    if (error || !data) {
      return json(
        { success: false, error: 'Nepodařilo se změnit stav záznamu.' },
        { status: 500, headers: { 'cache-control': 'no-store' } }
      );
    }

    return json({ success: true, item: data }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return json(
      {
        success: false,
        error: 'Databázová služba momentálně neodpovídá. Zkus to prosím za chvíli.'
      },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
}
