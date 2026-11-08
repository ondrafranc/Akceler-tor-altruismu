import { json } from '@sveltejs/kit';
import { getServerSupabase, withTimeout } from '$lib/server/supabase.js';
import {
  safeText,
  checkRateLimit,
  resolveClientKey,
  readJsonBodyBounded,
  validateMutationOrigin,
  isAuthorizedTestBypass
} from '$lib/security.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) {
    return json(
      { success: false, error: 'Databázová služba není nakonfigurována.' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }

  try {
    const { error } = await withTimeout(
      supabase.from('feedback').select('id', { count: 'exact', head: true }),
      2500,
      'Supabase health-check timeout'
    );
    if (error) {
      return json(
        { success: false, error: 'Databázová služba je dočasně nedostupná.' },
        { status: 503, headers: { 'cache-control': 'no-store' } }
      );
    }
    return json(
      { success: true, status: 'ok' },
      { headers: { 'cache-control': 'no-store' } }
    );
  } catch {
    return json(
      { success: false, error: 'Databázová služba neodpovídá.' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, url, getClientAddress }) {
  if (!validateMutationOrigin(request, url)) {
    return json(
      { success: false, error: 'Nepovolený původ požadavku.' },
      { status: 403 }
    );
  }

  const isTestBypass = isAuthorizedTestBypass(request);
  if (!isTestBypass) {
    const clientKey = resolveClientKey(request, getClientAddress);
    const rl = checkRateLimit('feedback', clientKey, 25, 10 * 60 * 1000);
    if (!rl.allowed) {
      return json(
        { success: false, error: 'Příliš mnoho zpráv v krátkém čase. Zkus to prosím za chvíli.' },
        { status: 429, headers: { 'retry-after': String(rl.retryAfterSec) } }
      );
    }
  }

  const parsedBody = await readJsonBodyBounded(request, 16_384);
  if (!parsedBody.ok) {
    return json({ success: false, error: parsedBody.error }, { status: parsedBody.status });
  }
  const body = parsedBody.data;

  const textValue = safeText(body.message ?? body.feedback_text ?? body.text);
  if (!textValue) {
    return json({ success: false, error: 'Text zpětné vazby je povinný.' }, { status: 400 });
  }
  if (textValue.length > 1500) {
    return json(
      { success: false, error: 'Zpětná vazba může mít nejvýše 1 500 znaků.' },
      { status: 400 }
    );
  }

  let ratingValue = null;
  if (body.rating !== undefined && body.rating !== null && body.rating !== '') {
    const parsed = Number(body.rating);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
      return json({ success: false, error: 'Hodnocení musí být celé číslo od 1 do 5.' }, { status: 400 });
    }
    ratingValue = parsed;
  }

  const emotionValue = safeText(body.emotion ?? body.category).slice(0, 40);
  const categoryValue =
    emotionValue && ratingValue
      ? `${emotionValue}:${ratingValue}`
      : emotionValue || (ratingValue ? `rating:${ratingValue}` : 'general');

  const pageUrl = safeText(body.page_url ?? body.pageUrl).slice(0, 240) || null;
  const contact = safeText(body.contact ?? body.email).slice(0, 120) || null;
  const userAgent = safeText(request.headers.get('user-agent')).slice(0, 220) || null;

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
    const row = {
      message: textValue,
      category: categoryValue,
      page_url: pageUrl,
      contact,
      user_agent: userAgent,
      status: 'new'
    };

    const { data, error } = await withTimeout(
      supabase.from('feedback').insert([row]).select('id, created_at').single(),
      2800,
      'Supabase feedback insert timeout'
    );

    if (error || !data) {
      return json(
        {
          success: false,
          error: 'Zpětnou vazbu se nepodařilo uložit do databáze. Zkus to prosím za chvíli.'
        },
        { status: 503 }
      );
    }

    return json({
      success: true,
      message: 'Zpětná vazba byla uložena.',
      id: data.id,
      data: [data]
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
