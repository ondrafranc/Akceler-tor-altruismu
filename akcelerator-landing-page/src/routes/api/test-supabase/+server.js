import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import {
  safeText,
  checkRateLimit,
  resolveClientKey,
  hasExcessiveBodySize
} from '$lib/security.js';

const MAX_FEEDBACK_BUFFER = 100;

/** @type {Array<{id: string, text: string, rating: number|null, created_at: string}>} */
const LOCAL_FEEDBACK_BUFFER = [];

function createServerSupabaseClient() {
  if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  return createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('feedback').select('count').limit(1);
      if (!error) {
        return json({
          success: true,
          message: 'Supabase connection working',
          data
        });
      }
    } catch {
      // Fall through to local fallback response
    }
  }

  return json({
    success: true,
    fallback: true,
    message: 'Using local feedback buffer (Supabase offline or not configured)',
    bufferedCount: LOCAL_FEEDBACK_BUFFER.length
  });
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, getClientAddress }) {
  if (hasExcessiveBodySize(request, 16_384)) {
    return json({ success: false, error: 'Zpráva je příliš dlouhá.' }, { status: 413 });
  }

  const clientKey = resolveClientKey(request, getClientAddress);
  const rl = checkRateLimit('feedback', clientKey, 25, 10 * 60 * 1000);
  if (!rl.allowed) {
    return json(
      { success: false, error: 'Příliš mnoho zpráv v krátkém čase. Zkus to prosím za chvíli.' },
      { status: 429, headers: { 'retry-after': String(rl.retryAfterSec) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Neplatný formát požadavku.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ success: false, error: 'Neplatný formát požadavku.' }, { status: 400 });
  }

  try {
    const textValue = safeText(body.feedback_text ?? body.text);
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

    const emotionValue = safeText(body.emotion).slice(0, 40) || null;

    const entry = {
      id: `fb-${Date.now()}`,
      text: textValue,
      rating: ratingValue,
      created_at: new Date().toISOString()
    };

    LOCAL_FEEDBACK_BUFFER.unshift(entry);
    if (LOCAL_FEEDBACK_BUFFER.length > MAX_FEEDBACK_BUFFER) {
      LOCAL_FEEDBACK_BUFFER.length = MAX_FEEDBACK_BUFFER;
    }

    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        let { data, error } = await supabase
          .from('feedback')
          .insert([{ text: textValue, emotion: emotionValue, rating: ratingValue }])
          .select();

        if (error && error.message && error.message.includes('text')) {
          const retry = await supabase
            .from('feedback')
            .insert([{ feedback_text: textValue, emotion: emotionValue, rating: ratingValue }])
            .select();
          data = retry.data;
          error = retry.error;
        }

        if (!error) {
          return json({
            success: true,
            message: 'Zpětná vazba byla uložena.',
            data
          });
        }
      } catch {
        // Fall through to local fallback success
      }
    }

    return json({
      success: true,
      fallback: true,
      message: 'Zpětná vazba byla přijata.',
      data: [entry]
    });
  } catch {
    return json(
      {
        success: false,
        error: 'Chyba při zpracování zpětné vazby.'
      },
      { status: 500 }
    );
  }
}
