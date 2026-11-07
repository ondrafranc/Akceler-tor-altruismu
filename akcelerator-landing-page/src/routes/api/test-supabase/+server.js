import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

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
export async function POST({ request }) {
  try {
    const body = await request.json();
    const textValue = (body.feedback_text || body.text || '').trim();
    const ratingValue = body.rating ? parseInt(body.rating, 10) : null;

    if (!textValue) {
      return json({ success: false, error: 'Text zpětné vazby je povinný.' }, { status: 400 });
    }

    const entry = {
      id: `fb-${Date.now()}`,
      text: textValue,
      rating: ratingValue,
      created_at: new Date().toISOString()
    };
    LOCAL_FEEDBACK_BUFFER.unshift(entry);

    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        let { data, error } = await supabase
          .from('feedback')
          .insert([{ text: textValue, emotion: body.emotion || null, rating: ratingValue }])
          .select();

        if (error && error.message && error.message.includes('text')) {
          const retry = await supabase
            .from('feedback')
            .insert([{ feedback_text: textValue, emotion: body.emotion || null, rating: ratingValue }])
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
  } catch (error) {
    return json(
      {
        success: false,
        error: 'Chyba při zpracování zpětné vazby.',
        details: error.message
      },
      { status: 500 }
    );
  }
}
