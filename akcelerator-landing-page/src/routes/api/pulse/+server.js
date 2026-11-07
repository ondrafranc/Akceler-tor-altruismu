import { json } from '@sveltejs/kit';
import { CZECH_CITIES } from '$lib/data/czech-actions.js';

const PULSE_TEMPLATES = [
  { actionId: 'zvirata_utulek_online', verb: 'naplnil misku v útulku', icon: '🐾' },
  { actionId: 'missing_maps', verb: 'zmapoval čtvrť pro Lékaře bez hranic', icon: '🗺️' },
  { actionId: 'knihobudka_kniha', verb: 'přidal knížku do veřejné knihobudky', icon: '📚' },
  { actionId: 'birdlife_ptaci_pasti', verb: 'nahlásil skleněnou zastávku v Ptačích pastech', icon: '🐦' },
  { actionId: 'letters_seniors', verb: 'napsal dopis osamělému seniorovi', icon: '✉️' },
  { actionId: 'estudanky_pramen', verb: 'zkontroloval lesní studánku v okolí', icon: '💧' },
  { actionId: 'remobil_telefon', verb: 'poslal starý telefon ze šuplíku přes Remobil', icon: '📱' }
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
  vary: 'v Karlových Varech'
};

function buildPulsePayload(slot = Math.floor(Date.now() / 15000)) {
  const cities = CZECH_CITIES.length ? CZECH_CITIES : [{ id: 'brno', name: 'Brno' }];
  const city = cities[slot % cities.length];
  const tpl = PULSE_TEMPLATES[(slot * 3 + 1) % PULSE_TEMPLATES.length];
  const loc = CITY_LOCATIVES[city.id] || `v ${city.name}`;
  return {
    message: `Před chvílí někdo ${loc} ${tpl.verb}`,
    city: city.name,
    actionId: tpl.actionId,
    icon: tpl.icon,
    ts: Date.now(),
    source: 'edge-pulse'
  };
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request }) {
  const wantsStream =
    url.searchParams.get('stream') === '1' ||
    (request.headers.get('accept') || '').includes('text/event-stream');

  if (wantsStream) {
    const payload = buildPulsePayload();
    const body = `event: pulse\ndata: ${JSON.stringify(payload)}\n\n`;
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform'
      }
    });
  }

  const slot = Number(url.searchParams.get('slot')) || Math.floor(Date.now() / 15000);
  const payload = buildPulsePayload(slot);
  return json(payload, {
    headers: {
      'cache-control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=120'
    }
  });
}

