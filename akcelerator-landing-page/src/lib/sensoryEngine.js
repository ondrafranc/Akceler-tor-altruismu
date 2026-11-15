/**
 * Sensory Engine for Akcelerátor altruismu.
 * Coordinates 2D canvas physics simulations, procedural Web Audio synthesis,
 * device adaptations, and celebratory ceremony rituals.
 *
 * Decomposed into modular domains (audio, core, features) with 100% backward-compatible exports.
 */

import { CLICK_AND_FEED, FREERICE, czPlural as pl } from './data/impactFacts.js';
import {
  MOLLY_TREAT_BY_FOOD,
  MODE_TO_MOLLY_FOOD,
  resolveMollyTreat
} from './mollyTypes.js';

import {
  isSoundMuted,
  toggleSoundMuted,
  getAudioContext
} from './audio/audioContext.js';

import {
  tone,
  noiseBurst
} from './audio/synthesizer.js';

import {
  playSanctuaryChime,
  playCelebrationChord,
  playMollyPurr,
  playMollyCrunch,
  playMollyMeow,
  playPayoffAsmr,
  registerActionSpecResolver
} from './audio/presets.js';

import {
  prefersReducedMotion,
  isLowPowerDevice,
  getCanvasDprCap,
  optimizeCanvasContext,
  frameStep,
  ensureSharedOrientation,
  getSharedOrientationGx,
  sharedOrientationGx,
  safeVibrate,
  safeVibrate as vib
} from './core/device.js';

import {
  savePendingPartnerReturn,
  readPendingPartnerRecord,
  getPendingPartnerReturnRemainingMs,
  consumePendingPartnerReturn,
  checkImmediatePartnerReturn
} from './features/actions/services/partnerReturnService.js';

import {
  fetchAmbientPulse,
  describeAmbientPulse
} from './features/pulse/services/pulseService.js';

export {
  MOLLY_TREAT_BY_FOOD,
  MODE_TO_MOLLY_FOOD,
  resolveMollyTreat,
  isSoundMuted,
  toggleSoundMuted,
  getAudioContext,
  tone,
  noiseBurst,
  playSanctuaryChime,
  playCelebrationChord,
  playMollyPurr,
  playMollyCrunch,
  playMollyMeow,
  playPayoffAsmr,
  prefersReducedMotion,
  isLowPowerDevice,
  getCanvasDprCap,
  optimizeCanvasContext,
  frameStep,
  ensureSharedOrientation,
  getSharedOrientationGx,
  safeVibrate,
  savePendingPartnerReturn,
  getPendingPartnerReturnRemainingMs,
  consumePendingPartnerReturn,
  checkImmediatePartnerReturn,
  fetchAmbientPulse,
  describeAmbientPulse
};

const win = () => typeof window !== 'undefined';
let globalSparkCharge = 0;
const activeControllers = new Set();

/** @type {((action: any, opts?: any) => any) | null} */
let mollySparkNotifier = null;

/**
 * Registers the Molly spark callback without creating a circular top-level import (M13 / AUDIT #3).
 * @param {(action: any, opts?: any) => any} fn
 */
export function registerMollyNotifier(fn) {
  mollySparkNotifier = typeof fn === 'function' ? fn : null;
}


export const isAnimalAction = (a) =>
  /zvirata_utulek_online|donio_utulky|click[-_]and[-_]feed|utulek|útulk|misk/i.test(
    `${a?.id || ''} ${a?.category || ''} ${a?.kind || ''} ${a?.subcategory || ''} ${a?.title || ''} ${a?.name || ''}`
  );

/**
 * Kompletní katalog speciálních 2D fyzikálních a zvukových efektů pro všech 45 mikro-akcí
 * i pro místní organizace na mapě (/near). Každá aktivita má unikátní vizuální scénu.
 */
export const ACTION_EFFECT_CATALOG = {
  zvirata_utulek_online: {
    mode: 'kibble',
    asmr: 'kibble',
    icon: '🐾',
    target: CLICK_AND_FEED.gramsPerClick,
    label: 'Plnění misky v útulku',
    colors: ['#f59e0b', '#fbbf24', '#34d399', '#fde68a'],
    format: (v) => `+${v} g v misce 🐾`
  },
  donio_utulky: {
    mode: 'shelter_care',
    asmr: 'kibble',
    icon: '🐾',
    target: CLICK_AND_FEED.gramsPerClick,
    label: 'Podpora útulku a plná miska',
    colors: ['#f59e0b', '#fbbf24', '#10b981', '#fde68a'],
    format: (v) => `+${v} g v misce a péče 🐾`
  },
  birdlife_ptaci_pasti: {
    mode: 'birds_glass',
    asmr: 'birds',
    icon: '🐦',
    target: 12,
    label: 'Bezpečná skla pro ptáky',
    colors: ['#38bdf8', '#7dd3fc', '#34d399', '#fbbf24'],
    format: (v) =>
      v <= 1
        ? '🐦 +1 nahlášená prosklená plocha'
        : `🐦 +${v} ${pl(v, 'nahlášená prosklená plocha', 'nahlášené prosklené plochy', 'ochranných bodů skla')}`
  },
  strnadi_nareci: {
    mode: 'birds_song',
    asmr: 'strnad',
    icon: '🎶',
    target: 15,
    label: 'Spektrogram zpěvu strnada',
    colors: ['#facc15', '#fde047', '#34d399', '#10b981'],
    format: (v) => `🎶 +${v} s ptačího nářečí`
  },
  zvire_v_nouzi: {
    mode: 'wildlife_rescue',
    asmr: 'birds',
    icon: '🦔',
    target: 34,
    label: 'Pohotovost záchranných stanic',
    colors: ['#fbbf24', '#34d399', '#10b981', '#fde68a'],
    format: (v) => `🦔 ${v} ${pl(v, 'stanice', 'stanice', 'stanic')} v pohotovosti`
  },
  aplikace_zachranka: {
    mode: 'ecg_rescue',
    asmr: 'heartbeat',
    icon: '🚑',
    target: 100,
    label: 'Záchranný puls a lokátor AED',
    colors: ['#fb7185', '#f43f5e', '#34d399', '#38bdf8'],
    format: (v) => `🚑 AED + GPS maják (${v} %)`
  },
  darovani_krve: {
    mode: 'blood_drop',
    asmr: 'heartbeat',
    icon: '🩸',
    target: 3,
    label: 'Kapka krve pro 3 životy',
    colors: ['#f43f5e', '#fb7185', '#fda4af', '#fbbf24'],
    format: (v) => `🩸 Až ${v} ${pl(v, 'zachráněný život', 'zachráněné životy', 'zachráněných životů')}`
  },
  kostni_dren: {
    mode: 'dna_helix',
    asmr: 'crystal',
    icon: '🧬',
    target: 100,
    label: 'Šroubovice naděje ČNRDD',
    colors: ['#a78bfa', '#c084fc', '#38bdf8', '#34d399'],
    format: (v) => `🧬 Shoda v registru (${v} %)`
  },
  daruj_vlasy: {
    mode: 'hair_silk',
    asmr: 'harp',
    icon: '💇‍♀️',
    target: 40,
    label: 'Prameny vlasů na paruku',
    colors: ['#fbbf24', '#f472b6', '#fde68a', '#34d399'],
    format: (v) => `💇‍♀️ +${v} cm vlasů na paruku`
  },
  'nevypusť_dusi': {
    mode: 'mind_wave',
    asmr: 'bowl',
    icon: '🧠',
    target: 5,
    label: 'Vlna duševní opory',
    colors: ['#818cf8', '#c084fc', '#34d399', '#fde68a'],
    format: (v) => `🧠 +${v} ${pl(v, 'krok', 'kroky', 'kroků')} psychické opory`
  },
  opatruj_se_nudz: {
    mode: 'breath_lotus',
    asmr: 'bowl',
    icon: '🧘',
    target: 5,
    label: 'Dechový lotos rovnováhy',
    colors: ['#2dd4bf', '#5eead4', '#a7f3d0', '#fde68a'],
    format: (v) => `🧘 +${v} min klidu mysli`
  },
  s_barvou_ven: {
    mode: 'prism_support',
    asmr: 'harp',
    icon: '🌈',
    target: 7,
    label: 'Spektrum bezpečné opory',
    colors: ['#fb7185', '#fbbf24', '#facc15', '#34d399', '#38bdf8', '#c084fc'],
    format: (v) => `🌈 ${v}/7 tipů pro přijetí`
  },
  wikipedie_cz: {
    mode: 'wiki_ink',
    asmr: 'typewriter',
    icon: '📝',
    target: 1,
    label: 'Oprava v otevřené encyklopedii',
    colors: ['#fde68a', '#34d399', '#38bdf8', '#fbbf24'],
    format: (v) => `📝 +${v} zpřesněný článek`
  },
  amnesty_apel: {
    mode: 'dove_appeal',
    asmr: 'typewriter',
    icon: '✍️',
    target: 1,
    label: 'Holubice a dopis svobody',
    colors: ['#facc15', '#fde047', '#34d399', '#38bdf8'],
    format: (v) => `✍️ +${v} hlas za svobodu`
  },
  cesko_digital_micro: {
    mode: 'code_nodes',
    asmr: 'sonar',
    icon: '💻',
    target: 8,
    label: 'Digitální síť pomoci',
    colors: ['#38bdf8', '#60a5fa', '#34d399', '#fbbf24'],
    format: (v) => `💻 +${v} ${pl(v, 'propojený uzel', 'propojené uzly', 'propojených uzlů')}`
  },
  missing_maps: {
    mode: 'satellite_map',
    asmr: 'sonar',
    icon: '🗺️',
    target: 10,
    label: 'Satelitní mapování budov',
    colors: ['#22d3ee', '#38bdf8', '#34d399', '#fbbf24'],
    format: (v) => `🗺️ +${v}/10 budov v mapě`
  },
  freerice_ryze: {
    mode: 'rice',
    asmr: 'rice',
    icon: '🍚',
    target: FREERICE.grainsPerAnswer * FREERICE.answersPerRound,
    label: 'Zrnka rýže do misky OSN',
    colors: ['#f8fafc', '#fde68a', '#fbbf24', '#38bdf8'],
    format: (v) => `🍚 +${v} ${pl(v, 'zrnko', 'zrnka', 'zrnek')} rýže`
  },
  zooniverse_veda: {
    mode: 'cosmos_science',
    asmr: 'crystal',
    icon: '🔭',
    target: 5,
    label: 'Vesmír a fotopasti Zooniverse',
    colors: ['#38bdf8', '#818cf8', '#f472b6', '#fde047'],
    format: (v) => `🔭 +${v}/5 snímků pro vědu`
  },
  ucime_online: {
    mode: 'tutoring_spark',
    asmr: 'crystal',
    icon: '🧑‍🏫',
    target: 60,
    label: 'Žárovka poznání při doučování',
    colors: ['#fbbf24', '#fde047', '#34d399', '#38bdf8'],
    format: (v) => `🧑‍🏫 +${v} min doučování`
  },
  doucujte_cvt: {
    mode: 'school_pencil',
    asmr: 'crystal',
    icon: '✏️',
    target: 60,
    label: 'Podpora školáka ve vzdělávání',
    colors: ['#34d399', '#6ee7b7', '#fbbf24', '#38bdf8'],
    format: (v) => `✏️ +${v} min podpory školáka`
  },
  letters_seniors: {
    mode: 'senior_letter',
    asmr: 'musicbox',
    icon: '👵',
    target: 1,
    label: 'Dopis a blízkost pro seniora',
    colors: ['#fb923c', '#fde68a', '#f472b6', '#34d399'],
    format: (v) => `👵 +${v} rozhovor proti samotě`
  },
  moudra_sovicka_mobil: {
    mode: 'owl_shield',
    asmr: 'musicbox',
    icon: '🧓',
    target: 1,
    label: 'Digitální štít pro seniora',
    colors: ['#2dd4bf', '#5eead4', '#fbbf24', '#34d399'],
    format: (v) => `🧓 +${v} senior v bezpečí`
  },
  pamet_naroda_vzpominka: {
    mode: 'memory_wave',
    asmr: 'musicbox',
    icon: '🎙️',
    target: 15,
    label: 'Zvuková stopa Paměti národa',
    colors: ['#fbbf24', '#f59e0b', '#fde68a', '#34d399'],
    format: (v) => `🎙️ +${v} min vzpomínek`
  },
  knihobudka_kniha: {
    mode: 'book_booth',
    asmr: 'pages',
    icon: '📚',
    target: 1,
    label: 'Kniha v pouliční knihobudce',
    colors: ['#34d399', '#fbbf24', '#fb7185', '#38bdf8'],
    format: (v) => `📚 +${v} kniha pro sousedy`
  },
  nevyhazujto_sousedum: {
    mode: 'parcel_share',
    asmr: 'pages',
    icon: '📦',
    target: 1,
    label: 'Druhý život věci v sousedství',
    colors: ['#fbbf24', '#fde68a', '#34d399', '#10b981'],
    format: (v) => `📦 +${v} věc poslaná dál`
  },
  trash_hero_uklid: {
    mode: 'eco_cleanup',
    asmr: 'pop_bloom',
    icon: '🧤',
    target: 5,
    label: 'Úklid přírody a rozkvět',
    colors: ['#34d399', '#6ee7b7', '#fbbf24', '#a7f3d0'],
    format: (v) => `🧤 +${v}/5 sebraných kusů`
  },
  remobil_telefon: {
    mode: 'phone_recycle',
    asmr: 'pop_bloom',
    icon: '📱',
    target: 10,
    label: 'Recyklace mobilu přes Remobil',
    colors: ['#34d399', '#6ee7b7', '#fbbf24', '#38bdf8'],
    format: (v) => `📱 +${v} Kč na charitu z mobilu`
  },
  mapko_kompost: {
    mode: 'compost_sprout',
    asmr: 'forest',
    icon: '🌱',
    target: 1,
    label: 'Komunitní kompost a klíčení',
    colors: ['#4ade80', '#34d399', '#fbbf24', '#fde047'],
    format: (v) => `🌱 +${v} živá půda v ulici`
  },
  sazime_budoucnost: {
    mode: 'forest_bloom',
    asmr: 'forest',
    icon: '🌳',
    target: 1,
    label: 'Výsadba stromu v krajině',
    colors: ['#34d399', '#10b981', '#6ee7b7', '#fde68a'],
    format: (v) => `🌳 +${v} strom pro krajinu`
  },
  na_ovoce_strom: {
    mode: 'fruit_tree',
    asmr: 'forest',
    icon: '🍎',
    target: 6,
    label: 'Ovocný strom v mapě Na ovoce',
    colors: ['#fb7185', '#4ade80', '#fde047', '#fbbf24'],
    format: (v) => `🍎 +${v} ${pl(v, 'plod', 'plody', 'plodů')} na stromě`
  },
  inaturalist_priroda: {
    mode: 'butterfly_lens',
    asmr: 'birds',
    icon: '🦋',
    target: 3,
    label: 'Záznam biodiverzity přírody',
    colors: ['#c084fc', '#f472b6', '#34d399', '#fbbf24'],
    format: (v) => `🦋 +${v} ${pl(v, 'určený druh', 'určené druhy', 'určených druhů')} v ČR`
  },
  brontosaurus_vikend: {
    mode: 'campfire_group',
    asmr: 'campfire',
    icon: '⛺',
    target: 1,
    label: 'Táborák a péče o krajinu',
    colors: ['#fb923c', '#fbbf24', '#fde047', '#34d399'],
    format: (v) => `⛺ +${v} víkend pro přírodu`
  },
  inex_workcamp_cr: {
    mode: 'globe_bridge',
    asmr: 'campfire',
    icon: '🎒',
    target: 1,
    label: 'Mezinárodní miniprojekt v ČR',
    colors: ['#38bdf8', '#34d399', '#fbbf24', '#fde047'],
    format: (v) => `🎒 +${v} komunitní projekt`
  },
  estudanky_pramen: {
    mode: 'water_spring',
    asmr: 'water',
    icon: '💧',
    target: 1,
    label: 'Čistý lesní pramen eSTUDÁNKY',
    colors: ['#38bdf8', '#7dd3fc', '#bae6fd', '#34d399'],
    format: (v) => `💧 +${v} vyčištěná studánka`
  },
  potravinova_banka: {
    mode: 'food_bank',
    asmr: 'warmth',
    icon: '🥫',
    target: 25,
    label: 'Zachráněné porce v bance',
    colors: ['#fbbf24', '#f59e0b', '#34d399', '#fb7185'],
    format: (v) => `🥫 +${v} ${pl(v, 'porce', 'porce', 'porcí')} jídla`
  },
  nadeje_jidlo: {
    mode: 'soup_lantern',
    asmr: 'warmth',
    icon: '🍞',
    target: 1,
    label: 'Teplá polévka a noc v teple',
    colors: ['#fb923c', '#fbbf24', '#fde68a', '#34d399'],
    format: (v) => `🍞 Teplá polévka a noc v teple`
  },
  zachran_jidlo_recept: {
    mode: 'zero_waste_pot',
    asmr: 'warmth',
    icon: '🥕',
    target: 1,
    label: 'Zachráněná večeře bez plýtvání',
    colors: ['#fb923c', '#4ade80', '#facc15', '#fde68a'],
    format: (v) => `🥕 +${v} zachráněná večeře`
  },
  nesnezeno_porce: {
    mode: 'bakery_save',
    asmr: 'warmth',
    icon: '🥐',
    target: 1,
    label: 'Zachráněná porce z okolí',
    colors: ['#fbbf24', '#f59e0b', '#34d399', '#fef3c7'],
    format: (v) => `🥐 +${v} zachráněná porce`
  },
  kola_pro_afriku: {
    mode: 'wheels_motion',
    asmr: 'bicycle',
    icon: '🚲',
    target: 1,
    label: 'Jízdní kolo na cestu do školy',
    colors: ['#fbbf24', '#34d399', '#38bdf8', '#fde68a'],
    format: (v) => `🚲 +${v} kolo pro školáka`
  },
  chodci_sobe: {
    mode: 'safe_crosswalk',
    asmr: 'sonar',
    icon: '♿',
    target: 1,
    label: 'Bezpečná ulice bez bariér',
    colors: ['#38bdf8', '#34d399', '#fbbf24', '#6ee7b7'],
    format: (v) => `♿ +${v} opravená bariéra`
  },
  epp_pohybem: {
    mode: 'kinetic_steps',
    asmr: 'pop_bloom',
    icon: '👟',
    target: 100,
    label: 'Pohyb proměněný v body pomoci',
    colors: ['#34d399', '#6ee7b7', '#fbbf24', '#38bdf8'],
    format: (v) => `👟 +${v} ${pl(v, 'bod', 'body', 'bodů')} pohybu`
  },
  krabice_od_bot: {
    mode: 'shoebox_gift',
    asmr: 'harp',
    icon: '🎁',
    target: 1,
    label: 'Radost z Krabice od bot',
    colors: ['#fb7185', '#fbbf24', '#34d399', '#38bdf8'],
    format: (v) => `🎁 +${v} dárek pro dítě`
  },
  dobry_andel: {
    mode: 'angel_wings',
    asmr: 'harp',
    icon: '👼',
    target: 100,
    label: 'Do posledního haléře rodinám',
    colors: ['#fde047', '#fbbf24', '#38bdf8', '#34d399'],
    format: (v) => `👼 ${v} % přímo rodině`,
    staticMetric: true
  },
  charita_dar: {
    mode: 'charity_care',
    asmr: 'harp',
    icon: '💚',
    target: 100,
    label: 'Podpora terénní a hospicové péče',
    colors: ['#34d399', '#10b981', '#fbbf24', '#f472b6'],
    format: (v) => `💚 ${v} % pro terénní péči`,
    staticMetric: true
  },
  znesnaze21_pribeh: {
    mode: 'solidarity_bridge',
    asmr: 'harp',
    icon: '🤝',
    target: 100,
    label: 'Přímá solidarita Znesnáze21',
    colors: ['#2dd4bf', '#34d399', '#fbbf24', '#fb7185'],
    format: (v) => `🤝 ${v} % ověřenému člověku`,
    staticMetric: true
  }
};

Object.values(ACTION_EFFECT_CATALOG).forEach((spec) => {
  spec.mollyTreat = resolveMollyTreat(spec);
});

/**
 * Obecné dobrovolnictví u místní organizace. Sdílí scénu `solidarity_bridge`, ale není v katalogu,
 * aby nepřepsalo vyhledávání podle režimu (MODE_LOOKUP).
 */
const VOLUNTEER_EFFECT_SPEC = {
  mode: 'solidarity_bridge',
  asmr: 'harp',
  icon: '🤲',
  target: 1,
  label: 'Nabídnutá pomocná ruka',
  colors: ['#2dd4bf', '#34d399', '#fbbf24', '#fb7185'],
  format: () => '🤲 +1 nabídnutá pomocná ruka'
};
VOLUNTEER_EFFECT_SPEC.mollyTreat = resolveMollyTreat(VOLUNTEER_EFFECT_SPEC);

const MODE_LOOKUP = Object.values(ACTION_EFFECT_CATALOG).reduce((acc, spec) => {
  acc[spec.mode] = spec;
  return acc;
}, {});

export function resolveActionEffectSpec(action) {
  if (!action) return ACTION_EFFECT_CATALOG.zvirata_utulek_online;
  if (typeof action === 'string') {
    if (ACTION_EFFECT_CATALOG[action]) return ACTION_EFFECT_CATALOG[action];
    if (MODE_LOOKUP[action]) return MODE_LOOKUP[action];
    if (action === 'kibble') return ACTION_EFFECT_CATALOG.zvirata_utulek_online;
  }
  const id = String(action?.id || '').trim();
  if (id && ACTION_EFFECT_CATALOG[id]) {
    return ACTION_EFFECT_CATALOG[id];
  }
  if (action?.mode && MODE_LOOKUP[action.mode]) {
    return MODE_LOOKUP[action.mode];
  }
  if (isAnimalAction(action)) {
    return ACTION_EFFECT_CATALOG.zvirata_utulek_online;
  }
  const hay = `${id} ${action?.category || ''} ${action?.kind || ''} ${action?.subcategory || ''} ${action?.title || ''} ${action?.name || ''} ${(action?.values || []).join(' ')}`.toLowerCase();
  if (/knihobud/.test(hay)) return ACTION_EFFECT_CATALOG.knihobudka_kniha;
  if (/šatník|satnik|oblečen|nevyhazuj/.test(hay)) return ACTION_EFFECT_CATALOG.nevyhazujto_sousedum;
  if (/naděje|nadeje|nocleh|azyl|bezdomov/.test(hay)) return ACTION_EFFECT_CATALOG.nadeje_jidlo;
  if (/potravin|jídlo|jidlo|polévk|banka|food/.test(hay)) return ACTION_EFFECT_CATALOG.potravinova_banka;
  if (/senior|život 90|zivot90|babič|děd|elderly/.test(hay)) return ACTION_EFFECT_CATALOG.letters_seniors;
  if (/ptáč|ptac|strnad|ornitol/.test(hay)) return ACTION_EFFECT_CATALOG.birdlife_ptaci_pasti;
  if (/studánk|pramen|vod/.test(hay)) return ACTION_EFFECT_CATALOG.estudanky_pramen;
  if (/strom|les|sáz|přírod|environment|nature/.test(hay)) return ACTION_EFFECT_CATALOG.sazime_budoucnost;
  if (/krev|dřeň|záchran|nemoc|health/.test(hay)) return ACTION_EFFECT_CATALOG.darovani_krve;
  if (/douč|vzděl|škol|education|knowledge/.test(hay)) return ACTION_EFFECT_CATALOG.ucime_online;
  if (action?.element === 'animals') return ACTION_EFFECT_CATALOG.zvirata_utulek_online;
  if (action?.element === 'nature') return ACTION_EFFECT_CATALOG.sazime_budoucnost;
  if (action?.element === 'knowledge') return ACTION_EFFECT_CATALOG.wikipedie_cz;
  if (action?.element === 'community') return ACTION_EFFECT_CATALOG.letters_seniors;
  if (/komunit|community|soused/.test(hay)) return ACTION_EFFECT_CATALOG.knihobudka_kniha;
  // Místa z mapy (/near) a obecné dobrovolnictví: nabídnutá pomocná ruka, ne „% pro terénní péči“
  if (/dobrovol|volunt/.test(hay) || action?.category === 'ngo') {
    return VOLUNTEER_EFFECT_SPEC;
  }
  return ACTION_EFFECT_CATALOG.charita_dar;
}

export function getActionEffectMeta(action, currentVal, opts = {}) {
  const spec = resolveActionEffectSpec(action);
  const val =
    !spec.staticMetric &&
    !opts.isReturnStrip &&
    typeof currentVal === 'number' &&
    currentVal > 0
      ? Math.min(currentVal, spec.target)
      : spec.target;
  const badge = spec.format(val);
  const isKibble = spec.mode === 'kibble' || spec.mode === 'shelter_care';
  const returnBadge = isKibble ? badge : `${badge} · ✨ Světelná stopa`;
  const mollyTreat = spec.mollyTreat || resolveMollyTreat(spec);
  return {
    ...spec,
    scene: spec.mode,
    value: val,
    badge: opts.isReturnStrip ? returnBadge : badge,
    returnBadge,
    mollyTreat
  };
}


// Connect audio preset resolver to action catalog
registerActionSpecResolver(resolveActionEffectSpec);


export function triggerCanvasBurst(actionOrCanvas = null, superBurst = true) {
  const isBool = typeof superBurst === 'boolean';
  const sb = isBool ? superBurst : true;
  if (actionOrCanvas && typeof actionOrCanvas.__triggerBurst === 'function') {
    actionOrCanvas.__triggerBurst(sb);
    return;
  }
  if (actionOrCanvas && typeof actionOrCanvas === 'object') {
    const targetSpec = resolveActionEffectSpec(actionOrCanvas);
    let matched = false;
    activeControllers.forEach((ctrl) => {
      if (ctrl.spec?.mode === targetSpec.mode) {
        ctrl.triggerBurst?.(sb);
        matched = true;
      }
    });
    if (matched) return;
  }
  activeControllers.forEach((ctrl) => {
    ctrl.triggerBurst?.(sb);
  });
}

export function startHoldSpark(el, cb) {
  const t0 = performance.now();
  const red = prefersReducedMotion();
  const sp = (v) => el?.style?.setProperty('--spark-charge', v);
  let id = 0;
  let d = 0;
  let decayTimer = 0;
  vib([10, 20, 40]);
  const g1 = tone(294, 0.68, 'sine', 0, 0.04, 440);
  const g2 = tone(587, 0.68, 'triangle', 0, 0.024, 880);
  const step = (now) => {
    const p = red ? 1 : Math.min(1, (now - t0) / 600);
    globalSparkCharge = p;
    sp(p.toFixed(2));
    if (p >= 1 && !d) {
      d = 1;
      el?.classList?.add('spark-ready');
      vib([25, 30, 45]);
      tone(587, 0.34, 'sine', 0, 0.042);
      tone(880, 0.38, 'triangle', 0.04, 0.036);
      tone(1174.66, 0.42, 'sine', 0.08, 0.03);
      triggerCanvasBurst(null, true);
      cb?.();
      decayTimer = setTimeout(() => {
        globalSparkCharge = 0;
      }, 450);
      return;
    }
    if (p < 1) id = requestAnimationFrame(step);
  };
  id = requestAnimationFrame(step);
  return (rel = false) => {
    cancelAnimationFrame(id);
    if (decayTimer) clearTimeout(decayTimer);
    globalSparkCharge = 0;
    sp('0');
    el?.classList?.remove('spark-ready');
    try {
      [g1, g2].forEach((g) =>
        g?.gain.setTargetAtTime(0.0001, getAudioContext()?.currentTime || 0, 0.02)
      );
    } catch {}
    if (rel && performance.now() - t0 < 200) {
      tone(659.25, 0.14);
      triggerCanvasBurst(null, false);
    }
  };
}

/**
 * Svelte action pro Hold-to-Spark rituál na libovolném primárním tlačítku / odkazu
 */
export function holdSpark(node, params = {}) {
  let stopFn = null;
  let currentParams = params;
  node.setAttribute('data-hold-spark', 'true');

  const onDown = (e) => {
    if (e.button && e.button !== 0) return;
    if (stopFn) stopFn(false);
    stopFn = startHoldSpark(node, () => {
      currentParams?.onReady?.();
    });
  };
  const onUp = () => {
    if (stopFn) {
      stopFn(true);
      stopFn = null;
    }
  };
  const onLeave = () => {
    if (stopFn) {
      stopFn(false);
      stopFn = null;
    }
  };

  node.addEventListener('pointerdown', onDown);
  node.addEventListener('pointerup', onUp);
  node.addEventListener('pointerleave', onLeave);
  node.addEventListener('pointercancel', onLeave);
  node.addEventListener('click', onUp);
  node.addEventListener('blur', onLeave);

  return {
    update(nextParams) {
      currentParams = nextParams;
    },
    destroy() {
      if (stopFn) stopFn(false);
      node.removeEventListener('pointerdown', onDown);
      node.removeEventListener('pointerup', onUp);
      node.removeEventListener('pointerleave', onLeave);
      node.removeEventListener('pointercancel', onLeave);
      node.removeEventListener('click', onUp);
      node.removeEventListener('blur', onLeave);
    }
  };
}

/**
 * Procedurální Web Audio ASMR syntéza přizpůsobená každému z 18 zvukových profilů
 */

function drawGlow(c, x, y, r, color, alpha = 0.35) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = Math.max(0, Math.min(1, alpha));
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(0.45, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, 6.28);
  c.fill();
  c.restore();
}

function drawHeart(c, x, y, r, color) {
  c.save();
  c.fillStyle = color;
  c.shadowColor = color;
  c.shadowBlur = 8;
  c.beginPath();
  c.moveTo(x, y + r * 0.35);
  c.bezierCurveTo(x - r, y - r * 0.4, x - r * 1.1, y + r * 0.6, x, y + r * 1.25);
  c.bezierCurveTo(x + r * 1.1, y + r * 0.6, x + r, y - r * 0.4, x, y + r * 0.35);
  c.fill();
  c.restore();
}

function drawBird(c, x, y, wing, size, color) {
  c.save();
  c.strokeStyle = color;
  c.shadowColor = color;
  c.shadowBlur = 6;
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - size, y - wing * size * 0.65);
  c.quadraticCurveTo(x - size * 0.4, y - size * 0.42, x, y);
  c.quadraticCurveTo(x + size * 0.4, y - size * 0.42, x + size, y - wing * size * 0.65);
  c.stroke();
  c.restore();
}

function drawStar(c, x, y, r, color) {
  c.save();
  c.fillStyle = color;
  c.shadowColor = color;
  c.shadowBlur = 10;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.36;
    const a = (i * Math.PI) / 4;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
  c.restore();
}

function drawPaw(c, x, y, s, color) {
  c.save();
  c.fillStyle = color;
  c.shadowColor = color;
  c.shadowBlur = 6;
  c.beginPath();
  c.ellipse(x, y + s * 0.25, s * 0.55, s * 0.42, 0, 0, 6.28);
  c.fill();
  [
    [-0.55, -0.35],
    [-0.2, -0.58],
    [0.2, -0.58],
    [0.55, -0.35]
  ].forEach(([dx, dy]) => {
    c.beginPath();
    c.arc(x + dx * s, y + dy * s, s * 0.22, 0, 6.28);
    c.fill();
  });
  c.restore();
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const subP = (p, a, b) => clamp01((p - a) / Math.max(0.0001, b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
};

function drawRoundRect(c, x, y, rw, rh, r) {
  c.beginPath();
  if (typeof c.roundRect === 'function') {
    c.roundRect(x, y, rw, rh, r);
  } else {
    c.rect(x, y, rw, rh);
  }
}

function drawSteam(c, x, y, h, t, col = 'rgba(254, 243, 199, 0.45)') {
  c.save();
  c.strokeStyle = col;
  c.lineWidth = 1.6;
  c.lineCap = 'round';
  for (let s = 0; s < 3; s++) {
    const sx = x - 10 + s * 10;
    const sWave = Math.sin(t * 3 + s * 1.6) * 3.5;
    c.beginPath();
    c.moveTo(sx, y);
    c.quadraticCurveTo(sx + sWave, y - h * 0.5, sx - sWave * 0.4, y - h);
    c.stroke();
  }
  c.restore();
}

function drawFlower(c, x, y, r, colPetal, colCenter) {
  c.save();
  c.fillStyle = colPetal;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    c.beginPath();
    c.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.45, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = colCenter;
  c.beginPath();
  c.arc(x, y, r * 0.35, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/**
 * Procedurální poetická 2-fázová transformace pro všech 45 aktivit.
 * p = 0: klidové očekávání před spuštěním skutku (unikátní výchozí ilustrace pro každou kartu)
 * p -> 1: plynulá geometrická metamorfóza po naplnění skutku (standard sbarvouven.cz)
 */
function drawPoeticDeedScene(c, mode, rawP, t, cx, cy, by, w, h, cs, red, frame, gx, py) {
  c.save();
  const wt = red ? 0 : t;
  const spanX = Math.min(126, w * 0.43);
  // 2fázová brána: náhled (rawP <= 0.14) drží čistý stav Před s jemným třpytem očekávání (prep),
  // zahájení (rawP = 0.25) jemně probudí proces a plný rozkvět (p -> 1) patří až dokončení skutku.
  const prep = clamp01(rawP / 0.25);
  const p = rawP <= 0.15 ? 0 : subP(rawP, 0.16, 1.0);

  if (mode === 'prism_support') {
    // 🌈 S barvou ven: Broušený skleněný hranol rozkládající soustředěný bílý paprsek do 6barevného spektra
    const rainbow = ['#fb7185', '#fb923c', '#facc15', '#34d399', '#38bdf8', '#c084fc'];
    const px0 = cx - 8;
    const apexY = cy - 25;
    const baseY = by - 3;
    const halfB = 26;

    // 1. Příchozí soustředěný bílo-zlatý paprsek zleva na levou stěnu hranolu
    const entryX = px0 - halfB * 0.52;
    const entryY = lerp(apexY, baseY, 0.52);
    const inStartX = cx - spanX - 24;
    const inStartY = entryY + 9;

    const beamGrad = c.createLinearGradient(inStartX, inStartY, entryX, entryY);
    beamGrad.addColorStop(0, 'rgba(254, 249, 195, 0.05)');
    beamGrad.addColorStop(0.35, `rgba(254, 249, 195, ${0.72 + prep * 0.18})`);
    beamGrad.addColorStop(1, '#ffffff');
    c.save();
    c.strokeStyle = beamGrad;
    c.shadowColor = '#fde68a';
    c.shadowBlur = 10;
    c.lineWidth = 3.1 + prep * 0.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(inStartX, inStartY);
    c.lineTo(entryX, entryY);
    c.stroke();
    c.restore();

    drawGlow(c, entryX, entryY, 11 + prep * 5 + p * 6, '#fef08a', 0.34 + prep * 0.14 + p * 0.2);

    // 2. Disperzní duhový vějíř vycházející z pravé stěny hranolu (p: 0 -> 1)
    if (p > 0.01) {
      const fanGlow = easeOut(subP(p, 0.15, 1.0));
      drawGlow(c, px0 + 46, cy - 2, 46 * fanGlow, '#38bdf8', 0.16 * fanGlow);
      rainbow.forEach((col, i) => {
        const beamP = easeOut(subP(p, 0.08 + i * 0.045, 0.86 + i * 0.025));
        if (beamP <= 0.005) return;
        const exitFrac = 0.36 + i * 0.065;
        const exitX = px0 + halfB * exitFrac;
        const exitY = lerp(apexY, baseY, exitFrac);
        const targetX = cx + spanX + 20;
        const spreadY = cy - 23 + i * 8.8 + Math.sin(wt * 2.2 + i * 0.7) * 1.8;
        const curX = lerp(exitX, targetX, beamP);
        const curY = lerp(exitY, spreadY, beamP);

        c.save();
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = col;
        c.shadowColor = col;
        c.shadowBlur = 9;
        c.lineWidth = 2.4 + beamP * 1.1;
        c.globalAlpha = 0.25 + beamP * 0.72;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(exitX, exitY);
        c.lineTo(curX, curY);
        c.stroke();
        c.restore();

        if (beamP > 0.78) {
          const spA = subP(beamP, 0.78, 1.0);
          drawStar(c, lerp(exitX, curX, 0.72 + (i % 2) * 0.14), lerp(exitY, curY, 0.72 + (i % 2) * 0.14), 2.8 * spA, col);
        }
      });
    }

    // 3. Tělo skleněného hranolu s vnitřním lomem světla a broušenou fazetou
    const glassGrad = c.createLinearGradient(px0 - halfB, apexY, px0 + halfB, baseY);
    glassGrad.addColorStop(0, `rgba(224, 242, 254, ${0.24 + p * 0.18})`);
    glassGrad.addColorStop(0.5, `rgba(186, 230, 253, ${0.14 + p * 0.14})`);
    glassGrad.addColorStop(1, `rgba(56, 189, 248, ${0.22 + p * 0.18})`);
    c.fillStyle = glassGrad;
    c.beginPath();
    c.moveTo(px0, apexY);
    c.lineTo(px0 - halfB, baseY);
    c.lineTo(px0 + halfB, baseY);
    c.closePath();
    c.fill();

    // Vnitřní lom paprsku uvnitř krystalu (p = 0 jemný náznak, prep probouzí krystal, p -> 1 plná interní disperze)
    const intP = Math.max(prep * 0.45, easeOut(subP(p, 0, 0.35)));
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      const f = 0.4 + k * 0.13;
      const rx = px0 + halfB * f;
      const ry = lerp(apexY, baseY, f);
      const endIntX = lerp(lerp(entryX, rx, 0.55), rx, intP);
      const endIntY = lerp(lerp(entryY, ry, 0.55), ry, intP);
      c.strokeStyle = k === 0 ? '#fde68a' : k === 1 ? '#ffffff' : '#7dd3fc';
      c.globalAlpha = 0.16 + intP * 0.65;
      c.lineWidth = 1.6 + intP * 0.8;
      c.beginPath();
      c.moveTo(entryX, entryY);
      c.lineTo(endIntX, endIntY);
      c.stroke();
    }
    c.restore();

    // Vnitřní broušená hrana a křišťálový obrys
    c.strokeStyle = `rgba(255, 255, 255, ${0.28 + p * 0.25})`;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(px0, apexY + 7);
    c.lineTo(px0 - halfB + 7, baseY - 4);
    c.lineTo(px0 + halfB - 7, baseY - 4);
    c.closePath();
    c.stroke();

    c.strokeStyle = p > 0.2 ? '#bae6fd' : 'rgba(186, 230, 253, 0.72)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(px0, apexY);
    c.lineTo(px0 - halfB, baseY);
    c.lineTo(px0 + halfB, baseY);
    c.closePath();
    c.stroke();

    if (p > 0.5) {
      drawStar(c, px0, apexY - 2, 4.2 * subP(p, 0.5, 1.0), '#ffffff');
    }
  } else if (mode === 'satellite_map') {
    // 🗺️ Missing Maps / Lékaři bez hranic: Topografický terén s nezmapovanými obrysy -> Satelitní radar mapující budovy a cesty
    const leftX = cx - spanX + 8;
    const rightX = cx + spanX - 8;
    const topY = cy - 24;
    const botY = by - 2;

    // Topografické vrstevnice
    c.strokeStyle = 'rgba(45, 212, 191, 0.14)';
    c.lineWidth = 1;
    for (let r = 0; r < 3; r++) {
      c.beginPath();
      c.ellipse(cx - 18 + r * 16, cy + 2, 76 - r * 18, 22 - r * 4, 0.12, 0, Math.PI * 2);
      c.stroke();
    }

    const buildings = [
      { x: cx - 78, y: cy - 12, bw: 20, bh: 14 },
      { x: cx - 44, y: cy + 6, bw: 22, bh: 15 },
      { x: cx - 10, y: cy - 16, bw: 26, bh: 17, clinic: true },
      { x: cx + 28, y: cy + 4, bw: 20, bh: 14 },
      { x: cx + 60, y: cy - 10, bw: 22, bh: 16 }
    ];

    const sweepOsc = p >= 0.99 && !red ? Math.sin(wt * 1.4) * 10 : 0;
    const scanX = clamp01(p) > 0 ? lerp(leftX + 6, rightX, easeOut(p)) + sweepOsc : leftX + 6;

    // Cesty propojující zmapované budovy
    for (let i = 0; i < buildings.length - 1; i++) {
      const b1 = buildings[i];
      const b2 = buildings[i + 1];
      const roadP = clamp01((scanX - (b1.x + b1.bw * 0.5)) / Math.max(12, b2.x - b1.x));
      c.save();
      c.strokeStyle = roadP > 0 ? `rgba(251, 191, 36, ${0.25 + roadP * 0.6})` : 'rgba(148, 163, 184, 0.18)';
      c.lineWidth = roadP > 0 ? 1.8 : 1;
      if (roadP <= 0) c.setLineDash([3, 3]);
      c.beginPath();
      c.moveTo(b1.x + b1.bw / 2, b1.y + b1.bh / 2);
      c.lineTo(b2.x + b2.bw / 2, b1.y + b1.bh / 2 + (b2.y - b1.y) * Math.max(0.2, roadP));
      c.stroke();
      c.restore();
    }

    // Půdorysy budov (p = 0 čárkované šedé -> po průchodu radaru ostré smaragdové vektory)
    buildings.forEach((b) => {
      const bP = clamp01((scanX - b.x) / 22);
      c.save();
      if (bP <= 0.02) {
        c.setLineDash([3, 3]);
        c.strokeStyle = 'rgba(148, 163, 184, 0.48)';
        c.fillStyle = 'rgba(15, 23, 42, 0.35)';
        c.lineWidth = 1.2;
      } else {
        c.strokeStyle = b.clinic ? '#fde047' : '#6ee7b7';
        c.fillStyle = b.clinic
          ? `rgba(16, 185, 129, ${0.25 + bP * 0.35})`
          : `rgba(16, 185, 129, ${0.18 + bP * 0.3})`;
        c.lineWidth = 1.8;
      }
      c.fillRect(b.x, b.y, b.bw, b.bh);
      c.strokeRect(b.x, b.y, b.bw, b.bh);
      c.restore();

      if (bP > 0.5) {
        const cxB = b.x + b.bw / 2;
        const cyB = b.y + b.bh / 2;
        if (b.clinic) {
          c.fillStyle = '#fde047';
          c.fillRect(cxB - 1.5, cyB - 5, 3, 10);
          c.fillRect(cxB - 5, cyB - 1.5, 10, 3);
          drawGlow(c, cxB, cyB, 16 * bP, '#fde047', 0.35 * bP);
        } else {
          c.fillStyle = '#6ee7b7';
          c.beginPath();
          c.arc(cxB, cyB, 2 * bP, 0, Math.PI * 2);
          c.fill();
        }
      }
    });

    // Radarový paprsek
    const trailW = 28;
    const scanGrad = c.createLinearGradient(scanX - trailW, 0, scanX, 0);
    scanGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
    scanGrad.addColorStop(1, `rgba(52, 211, 153, ${0.18 + p * 0.24})`);
    c.fillStyle = scanGrad;
    c.fillRect(Math.max(leftX, scanX - trailW), topY, trailW, botY - topY);

    c.save();
    c.strokeStyle = '#22d3ee';
    c.shadowColor = '#22d3ee';
    c.shadowBlur = 8;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(scanX, topY - 2);
    c.lineTo(scanX, botY + 2);
    c.stroke();
    c.restore();
  } else if (mode === 'kibble') {
    // 🐾 Zvířata v útulku: Prázdná miska a čekající pejsek -> Parabolický proud granulí, plná miska a vrtící ocásek
    const bowlX = cx + 10;
    const bowlW = 68;
    const bowlH = 16;
    const bowlY = by - 4;

    c.fillStyle = 'rgba(0, 0, 0, 0.42)';
    c.beginPath();
    c.ellipse(bowlX, bowlY + 3, bowlW * 0.56, 5.5, 0, 0, Math.PI * 2);
    c.fill();

    // Pejsek vlevo od misky (sklopená ouška před akcí -> nastražená ouška a radostné vrtění po akci)
    const dogBreath = Math.sin(wt * 2.2) * 1.0;
    const tailWag = Math.sin(wt * (2.0 + p * 6.5)) * (0.12 + p * 0.42);
    const earLift = lerp(-0.48, 0.12, easeOut(p));
    c.save();
    c.translate(cx - 46, bowlY + 1);
    c.save();
    c.translate(-22, -14);
    c.rotate(tailWag);
    c.strokeStyle = '#d97706';
    c.lineWidth = 3.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-7, -9, -11, -17 - p * 3);
    c.stroke();
    c.restore();

    c.fillStyle = '#291d16';
    c.strokeStyle = `rgba(253, 230, 138, ${0.32 + p * 0.35})`;
    c.lineWidth = 1.2;
    c.beginPath();
    c.ellipse(-12, -11 + dogBreath, 13, 8.5, 0.18, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    const headLift = p * 3;
    c.beginPath();
    c.ellipse(1, -21 - headLift + dogBreath * 0.7, 8, 7, -0.05 - p * 0.12, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    c.save();
    c.translate(-3, -25 - headLift + dogBreath * 0.7);
    c.rotate(earLift);
    c.fillStyle = '#d97706';
    c.beginPath();
    c.ellipse(0, 3, 3.2, 5.5, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    c.fillStyle = '#0f0c0a';
    c.beginPath();
    c.arc(8, -20 - headLift + dogBreath * 0.7, 1.9, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fef08a';
    c.beginPath();
    c.arc(3.5, -22.5 - headLift + dogBreath * 0.7, 1.8, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Tělo keramické misky (zadní okraj + vnitřek)
    c.fillStyle = '#1c120b';
    c.beginPath();
    c.ellipse(bowlX, bowlY - bowlH, bowlW / 2, 5.5, 0, 0, Math.PI * 2);
    c.fill();

    // Sypající se parabolický proud granulí a vršící se kopec v misce
    if (p > 0.02) {
      const pourP = subP(p, 0.02, 0.72);
      if (pourP > 0 && pourP < 1) {
        for (let d = 0; d < 8; d++) {
          const dp = (pourP * 2.2 + d * 0.13) % 1;
          const kx = lerp(bowlX + 34, bowlX - 6 + (d % 3) * 6, dp);
          const ky = lerp(cy - 30, bowlY - bowlH - 2, dp * dp);
          c.fillStyle = d % 2 === 0 ? '#fbbf24' : '#d97706';
          c.beginPath();
          c.ellipse(kx, ky, 3.2, 2.3, dp * 2, 0, Math.PI * 2);
          c.fill();
        }
      }

      const fillP = easeOut(subP(p, 0.08, 0.92));
      const kCount = Math.floor(20 * fillP);
      for (let i = 0; i < kCount; i++) {
        const row = Math.floor(i / 7);
        const colIdx = i % 7;
        const rowSpan = 24 - row * 5;
        const kx = bowlX - rowSpan + (colIdx / 6) * rowSpan * 2;
        const ky = bowlY - bowlH - 1 - row * 3.2 + Math.sin(i * 1.7) * 1.1;
        c.fillStyle = i % 2 === 0 ? '#fbbf24' : '#f59e0b';
        c.beginPath();
        c.ellipse(kx, ky, 4.1, 2.9, (i % 4) * 0.35, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(255, 255, 255, 0.42)';
        c.beginPath();
        c.arc(kx - 1.1, ky - 0.9, 0.9, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Přední stěna misky s tlapkou
    const bGrad = c.createLinearGradient(bowlX - bowlW / 2, bowlY - bowlH, bowlX + bowlW / 2, bowlY);
    bGrad.addColorStop(0, '#f59e0b');
    bGrad.addColorStop(1, '#b45309');
    c.fillStyle = bGrad;
    c.strokeStyle = '#fde68a';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(bowlX - bowlW / 2, bowlY - bowlH);
    c.quadraticCurveTo(bowlX - bowlW * 0.45, bowlY, bowlX - bowlW * 0.35, bowlY);
    c.lineTo(bowlX + bowlW * 0.35, bowlY);
    c.quadraticCurveTo(bowlX + bowlW * 0.45, bowlY, bowlX + bowlW / 2, bowlY - bowlH);
    c.ellipse(bowlX, bowlY - bowlH, bowlW / 2, 5.2, 0, 0, Math.PI);
    c.fill();
    c.stroke();
    drawPaw(c, bowlX, bowlY - 6, 4.5, '#fde68a');

    if (p > 0.35) {
      const celP = easeOut(subP(p, 0.35, 1.0));
      drawSteam(c, bowlX, bowlY - bowlH - 10, 15 * celP, wt);
      drawHeart(c, cx - 22, bowlY - 30 - celP * 5 + Math.sin(wt * 3) * 2, 5.8 * celP, '#fbbf24');
    }
  } else if (mode === 'shelter_care') {
    // 🐾 Donio útulky: Chladný přístřešek se schoulenou kočičkou -> Zářící zlatá střecha bezpečí a plná miska
    const roofPeakY = cy - 26;
    const eaveY = cy - 4;
    const bowlX = cx + 18;
    const bowlW = 54;
    const bowlH = 14;
    const bowlY = by - 4;

    const roofP = easeOut(subP(p, 0, 0.65));
    if (roofP > 0.02) {
      const sanctuaryGrad = c.createLinearGradient(cx, roofPeakY, cx, bowlY);
      sanctuaryGrad.addColorStop(0, `rgba(251, 191, 36, ${0.28 * roofP})`);
      sanctuaryGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      c.fillStyle = sanctuaryGrad;
      c.beginPath();
      c.moveTo(cx, roofPeakY);
      c.lineTo(cx + 66, bowlY);
      c.lineTo(cx - 66, bowlY);
      c.closePath();
      c.fill();
    }

    // Střecha útulku
    c.strokeStyle = roofP > 0.1 ? '#fde68a' : 'rgba(148, 163, 184, 0.45)';
    c.lineWidth = 2.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - 62, eaveY);
    c.lineTo(cx, roofPeakY);
    c.lineTo(cx + 62, eaveY);
    c.stroke();

    // Schoulená kočička vlevo -> zvedá hlavičku a ocásek v teple domova
    c.save();
    c.translate(cx - 30, bowlY - 2);
    c.fillStyle = '#1f2937';
    c.strokeStyle = roofP > 0.1 ? '#fbbf24' : 'rgba(148, 163, 184, 0.45)';
    c.lineWidth = 1.3;
    c.beginPath();
    c.ellipse(0, -6, 13, 8, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    const catWake = easeOut(subP(p, 0.2, 0.9));
    const headY = -11 - catWake * 5;
    c.beginPath();
    c.arc(9, headY, 6.2, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    // Ouška
    c.beginPath();
    c.moveTo(5, headY - 4);
    c.lineTo(6, headY - 10);
    c.lineTo(9, headY - 5);
    c.moveTo(10, headY - 5);
    c.lineTo(13, headY - 10);
    c.lineTo(14, headY - 4);
    c.fill();
    c.stroke();
    // Ocásek
    c.strokeStyle = '#fbbf24';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-12, -5);
    c.quadraticCurveTo(-20, -8 - catWake * 10, -15 + Math.sin(wt * 3) * 2, -12 - catWake * 12);
    c.stroke();
    c.restore();

    // Smaragdová miska vpravo
    c.fillStyle = '#0c241b';
    c.beginPath();
    c.ellipse(bowlX, bowlY - bowlH, bowlW / 2, 4.6, 0, 0, Math.PI * 2);
    c.fill();

    if (p > 0.08) {
      const fillP = easeOut(subP(p, 0.08, 0.88));
      const kCount = Math.floor(15 * fillP);
      for (let i = 0; i < kCount; i++) {
        const row = Math.floor(i / 5);
        const kx = bowlX - 16 + (i % 5) * 8;
        const ky = bowlY - bowlH - 1 - row * 2.8;
        c.fillStyle = i % 2 === 0 ? '#fbbf24' : '#fde68a';
        c.beginPath();
        c.ellipse(kx, ky, 3.6, 2.4, (i % 3) * 0.3, 0, Math.PI * 2);
        c.fill();
      }
    }

    const bGrad = c.createLinearGradient(bowlX - bowlW / 2, bowlY - bowlH, bowlX + bowlW / 2, bowlY);
    bGrad.addColorStop(0, '#10b981');
    bGrad.addColorStop(1, '#065f46');
    c.fillStyle = bGrad;
    c.strokeStyle = '#6ee7b7';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(bowlX - bowlW / 2, bowlY - bowlH);
    c.lineTo(bowlX - bowlW * 0.36, bowlY);
    c.lineTo(bowlX + bowlW * 0.36, bowlY);
    c.lineTo(bowlX + bowlW / 2, bowlY - bowlH);
    c.closePath();
    c.fill();
    c.stroke();
    drawPaw(c, bowlX, bowlY - 5.5, 4, '#fde68a');

    if (p > 0.3) {
      const hP = easeOut(subP(p, 0.3, 1.0));
      drawHeart(c, cx, roofPeakY + 14 - Math.sin(wt * 2.8) * 2, 6.5 * hP, '#fde047');
    }
  } else if (mode === 'rice') {
    // 🍚 Freerice: Vzpřímené bledé stéblo a prázdná miska OSN -> Zlatý klas sklánějící se k misce plné rýže
    const bowlX = cx + 22;
    const bowlW = 58;
    const bowlY = by - 3;
    const bend = lerp(0.18, 1.0, easeOut(p));
    const sway = Math.sin(wt * 1.8) * 2;

    // Rýžové stéblo vlevo
    const stX = cx - 48;
    const stY = by - 2;
    const tipX = stX + 12 + bend * 38 + sway;
    const tipY = stY - 46 + bend * 14;
    c.strokeStyle = p > 0.15 ? '#facc15' : 'rgba(163, 230, 53, 0.55)';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(stX, stY);
    c.quadraticCurveTo(stX + 6 + bend * 10, stY - 36, tipX, tipY);
    c.stroke();

    // Lístek stébla
    c.strokeStyle = '#4ade80';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(stX + 4, stY - 14);
    c.quadraticCurveTo(stX - 14, stY - 26, stX - 18, stY - 32);
    c.stroke();

    // Zrnka na klasu
    for (let g = 0; g < 7; g++) {
      const u = 0.42 + g * 0.09;
      const gxP = (1 - u) * (1 - u) * stX + 2 * (1 - u) * u * (stX + 6 + bend * 10) + u * u * tipX;
      const gyP = (1 - u) * (1 - u) * stY + 2 * (1 - u) * u * (stY - 36) + u * u * tipY;
      c.fillStyle = p > 0.15 ? '#fde047' : 'rgba(254, 240, 138, 0.45)';
      c.beginPath();
      c.ellipse(gxP, gyP + (g % 2 === 0 ? -2.5 : 2.5), 3.6, 1.7, -0.3 + bend * 0.5, 0, Math.PI * 2);
      c.fill();
    }

    // Padající zrnka rýže z klasu do misky
    const pourP = subP(p, 0.1, 0.8);
    if (pourP > 0 && pourP < 1) {
      for (let k = 0; k < 7; k++) {
        const dp = (pourP * 2 + k * 0.15) % 1;
        const rx = lerp(tipX, bowlX + (k % 3 - 1) * 7, dp);
        const ry = lerp(tipY, bowlY - 16, dp * dp);
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.ellipse(rx, ry, 3.1, 1.5, dp * 1.4, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Vnitřek misky + kopec bílé rýže
    c.fillStyle = '#0f172a';
    c.beginPath();
    c.ellipse(bowlX, bowlY - 15, bowlW * 0.44, 5, 0, 0, Math.PI * 2);
    c.fill();

    if (p > 0.12) {
      const riceP = easeOut(subP(p, 0.12, 0.95));
      c.fillStyle = '#f8fafc';
      c.beginPath();
      c.ellipse(bowlX, bowlY - 15, bowlW * 0.4 * riceP, 9 * riceP, 0, Math.PI, Math.PI * 2);
      c.fill();
      for (let i = 0; i < Math.floor(16 * riceP); i++) {
        const gxG = bowlX - 16 + ((i * 9 + 3) % 32);
        const gyG = bowlY - 16 - Math.floor(i / 6) * 2.5;
        c.fillStyle = i % 2 === 0 ? '#ffffff' : '#fef3c7';
        c.beginPath();
        c.ellipse(gxG, gyG, 3.4, 1.6, (i % 5) * 0.4, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Modrá miska WFP/OSN
    const unGrad = c.createLinearGradient(bowlX, bowlY - 15, bowlX, bowlY);
    unGrad.addColorStop(0, '#0284c7');
    unGrad.addColorStop(1, '#1e3a8a');
    c.fillStyle = unGrad;
    c.strokeStyle = '#7dd3fc';
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(bowlX, bowlY - 15, bowlW * 0.44, 0, Math.PI);
    c.closePath();
    c.fill();
    c.stroke();

    if (p > 0.45) {
      drawSteam(c, bowlX, bowlY - 24, 14 * subP(p, 0.45, 1.0), wt);
    }
  } else if (mode === 'birds_glass') {
    // 🐦 Bezpečná skla pro ptáky: Zrcadlící neoznačené sklo a ohrožený let -> UV ochranný rastr a bezpečný oblouk nad sklem
    const paneX = cx - 4;
    const paneY = cy - 18;
    const paneW = 78;
    const paneH = 44;

    // Skleněná tabule s odleskem
    c.fillStyle = 'rgba(56, 189, 248, 0.10)';
    c.strokeStyle = p > 0.2 ? '#7dd3fc' : 'rgba(148, 163, 184, 0.45)';
    c.lineWidth = 1.6;
    c.fillRect(paneX, paneY, paneW, paneH);
    c.strokeRect(paneX, paneY, paneW, paneH);

    c.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(paneX + 12, paneY + paneH - 6);
    c.lineTo(paneX + 34, paneY + 6);
    c.stroke();

    // UV ochranné body rozsvěcující se na skle (p: 0 -> 1)
    const dotP = easeOut(subP(p, 0.02, 0.5));
    for (let gxIdx = 0; gxIdx < 5; gxIdx++) {
      for (let gyIdx = 0; gyIdx < 3; gyIdx++) {
        const dx = paneX + 11 + gxIdx * 14;
        const dy = paneY + 10 + gyIdx * 12;
        c.fillStyle =
          dotP > 0.05
            ? (gxIdx + gyIdx) % 2 === 0
              ? `rgba(253, 224, 71, ${0.2 + dotP * 0.8})`
              : `rgba(52, 211, 153, ${0.2 + dotP * 0.8})`
            : 'rgba(148, 163, 184, 0.12)';
        c.beginPath();
        c.arc(dx, dy, 1.1 + dotP * 1.7, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Letová dráha ptáka: p = 0 míří přímo do skla -> p -> 1 zvedá se do bezpečného oblouku nad tabuli
    const arcP = easeOut(subP(p, 0.1, 0.95));
    const startX = cx - 76;
    const startY = cy + 4;
    const endX = lerp(paneX + 6, paneX + paneW + 22, arcP);
    const ctrlX = paneX - 6 + arcP * 26;
    const ctrlY = lerp(cy + 4, paneY - 26, arcP);
    const endY = lerp(cy + 4, paneY - 6, arcP);

    c.save();
    c.setLineDash([4, 3]);
    c.strokeStyle = arcP > 0.2 ? `rgba(110, 231, 183, ${0.35 + arcP * 0.5})` : 'rgba(251, 113, 133, 0.45)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(startX, startY);
    c.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    c.stroke();
    c.restore();

    const u = lerp(0.28, 0.92, arcP);
    const birdX = (1 - u) * (1 - u) * startX + 2 * (1 - u) * u * ctrlX + u * u * endX;
    const birdY = (1 - u) * (1 - u) * startY + 2 * (1 - u) * u * ctrlY + u * u * endY;
    drawBird(c, birdX, birdY, Math.sin(wt * 5.5), 9 + arcP * 2.5, arcP > 0.25 ? '#6ee7b7' : '#cbd5e1');

    if (arcP > 0.6) {
      drawStar(c, birdX - 12, birdY + 4, 3.8 * subP(arcP, 0.6, 1.0), '#fde047');
    }
  } else if (mode === 'birds_song') {
    // 🎶 Nářečí strnadů: Tichý strnad na větvi -> Zpívající zlatý strnad a harmonický spektrogram „di-di-di-dééé“
    const twigY = by - 8;
    const songP = easeOut(p);

    // Větev s lístky
    c.strokeStyle = '#92400e';
    c.lineWidth = 2.8;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - spanX + 12, twigY + 3);
    c.quadraticCurveTo(cx - 34, twigY - 5, cx + 22, twigY + 1);
    c.stroke();
    c.fillStyle = songP > 0.1 ? '#34d399' : '#15803d';
    c.beginPath();
    c.ellipse(cx - 12, twigY - 4, 5.5, 2.5, -0.45, 0, Math.PI * 2);
    c.ellipse(cx + 8, twigY - 2, 5, 2.2, 0.35, 0, Math.PI * 2);
    c.fill();

    // Strnad obecný (žlutá hlavička a hruď, kaštanové křídlo, vykrojený ocásek)
    c.save();
    c.translate(cx - 50, twigY - 3);
    if (songP > 0.15) {
      drawGlow(c, 4, -10, 20 * songP, '#fde047', 0.28 * songP);
    }
    // Nožky
    c.strokeStyle = '#d97706';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-1, -3);
    c.lineTo(-2, 1);
    c.moveTo(3, -3);
    c.lineTo(3, 1);
    c.stroke();
    // Ocásek
    c.strokeStyle = songP > 0.08 ? '#a16207' : '#57534e';
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(-7, -5);
    c.lineTo(-20, 2);
    c.stroke();
    // Tělíčko + křídlo
    c.fillStyle = songP > 0.08 ? '#eab308' : '#78716c';
    c.beginPath();
    c.ellipse(0, -8, 10.5, 6.2, -0.22, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = songP > 0.08 ? '#b45309' : '#57534e';
    c.beginPath();
    c.ellipse(-2, -8, 7.2, 3.6, -0.28, 0, Math.PI * 2);
    c.fill();

    const headLift = prep * 1.0 + songP * 2.5;
    c.fillStyle = songP > 0.08 ? '#fde047' : '#a8a29e';
    c.beginPath();
    c.arc(8, -13.5 - headLift, 5.2, 0, Math.PI * 2);
    c.fill();

    // Zobáček: zavřený -> otevřený při zpěvu
    const beakGap = songP * 2.4 + (songP > 0.3 ? Math.abs(Math.sin(wt * 7)) * 1.1 : 0);
    c.fillStyle = '#f59e0b';
    c.beginPath();
    c.moveTo(12, -14.5 - headLift);
    c.lineTo(18, -15 - headLift - beakGap);
    c.lineTo(12, -13 - headLift);
    c.moveTo(12, -13 - headLift);
    c.lineTo(17.5, -11.5 - headLift + beakGap * 0.6);
    c.lineTo(12, -12 - headLift);
    c.fill();

    c.fillStyle = '#0f172a';
    c.beginPath();
    c.arc(9, -14.5 - headLift, 1.3, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Tichá přerušovaná osa (p = 0) -> 3 staccato tóny „di-di-di“ a vlnící se harmonická stuha „dééé“ (p -> 1)
    const baseSpecY = cy + 3;
    c.save();
    c.setLineDash([3, 4]);
    c.strokeStyle = `rgba(148, 163, 184, ${0.42 * (1 - songP * 0.65)})`;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(cx - 24, baseSpecY);
    c.lineTo(cx + 84, baseSpecY);
    c.stroke();
    c.restore();

    if (songP > 0.02) {
      // 3 krátké staccato impulzy „di-di-di“
      const shortNotes = [
        { x: cx - 20, h: 11, t0: 0.04 },
        { x: cx - 8, h: 14, t0: 0.16 },
        { x: cx + 4, h: 17, t0: 0.28 }
      ];
      shortNotes.forEach((n, idx) => {
        const sP = easeOut(subP(songP, n.t0, n.t0 + 0.32));
        if (sP <= 0) return;
        const nh = (n.h + Math.sin(wt * 6 + idx) * 1.5) * sP;
        c.fillStyle = idx === 2 ? '#6ee7b7' : '#fde047';
        drawRoundRect(c, n.x, baseSpecY - nh * 0.65, 5.5, Math.max(3, nh), 2.8);
        c.fill();
      });

      // Dlouhý nesený tón „dééé“ jako elegantní víceharmonická zvuková stuha (nikoliv těžký obdélník)
      const susP = easeOut(subP(songP, 0.38, 0.96));
      if (susP > 0.02) {
        const sStart = cx + 17;
        const sEnd = lerp(sStart + 4, cx + 82, susP);
        [
          { amp: 7.5, col: '#fde047', w: 2.5, ph: 0 },
          { amp: 4.5, col: '#34d399', w: 1.8, ph: 1.4 }
        ].forEach((wv) => {
          c.strokeStyle = wv.col;
          c.lineWidth = wv.w;
          c.lineCap = 'round';
          c.beginPath();
          for (let i = 0; i <= 20; i++) {
            const u = i / 20;
            const sx = lerp(sStart, sEnd, u);
            const env = Math.sin(u * Math.PI);
            const sy = baseSpecY - 3 + Math.sin(u * 10 - wt * 4.5 + wv.ph) * wv.amp * env * susP;
            if (i === 0) c.moveTo(sx, sy);
            else c.lineTo(sx, sy);
          }
          c.stroke();
        });

        // Drobné vznášející se notové jiskry
        drawStar(c, lerp(sStart, sEnd, 0.65), baseSpecY - 14 * susP, 3.8 * susP, '#fde047');
      }

      // Akustické vlny od zobáčku
      for (let r = 1; r <= 2; r++) {
        c.strokeStyle = `rgba(253, 224, 71, ${(0.45 * songP) / r})`;
        c.lineWidth = 1.3;
        c.beginPath();
        c.arc(cx - 32, twigY - 18, 7 * r + ((wt * 6) % 5), -0.6, 0.5);
        c.stroke();
      }
    }
  } else if (mode === 'wildlife_rescue') {
    // 🦔 Zvíře v nouzi: Pevně schoulené klubíčko ježka v trávě -> Ochranná náruč a rozvinutý spokojený ježek
    const groundY = by - 5;
    const uncurl = easeOut(subP(p, 0.15, 0.95));
    const handP = easeOut(subP(p, 0.02, 0.65));

    // Trsy noční trávy po stranách (čitelný kontext i při p = 0)
    c.strokeStyle = handP > 0.2 ? '#10b981' : 'rgba(52, 211, 153, 0.38)';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    [-38, -32, 32, 38].forEach((gxOff, idx) => {
      c.beginPath();
      c.moveTo(cx + gxOff, groundY + 2);
      c.quadraticCurveTo(cx + gxOff + (idx < 2 ? -3 : 3), groundY - 7, cx + gxOff + (idx % 2 === 0 ? -5 : 5), groundY - 12);
      c.stroke();
    });

    // Ochranné zlatosmaragdové dlaně / kupole záchranné stanice
    if (handP > 0.02) {
      drawGlow(c, cx, groundY - 12, 34 * handP, '#34d399', 0.3 * handP);
      c.strokeStyle = `rgba(110, 231, 183, ${0.35 + handP * 0.55})`;
      c.lineWidth = 2.4;
      [-1, 1].forEach((dir) => {
        c.beginPath();
        c.moveTo(cx + dir * 10, groundY + 2);
        c.quadraticCurveTo(
          cx + dir * (36 * handP + 12),
          groundY - 6,
          cx + dir * (28 * handP + 6),
          groundY - 27 * handP
        );
        c.stroke();
      });
    }

    // Ježek: p = 0 zřetelné dvoubarevné klubíčko bodlinek -> p = 1 vykoukne čumáček, očko a tlapky
    c.save();
    c.translate(cx - uncurl * 4, groundY - 8);
    const spineStart = lerp(0, Math.PI * 0.8, uncurl);
    const spineEnd = lerp(Math.PI * 2, Math.PI * 2.1, uncurl);
    for (let s = 0; s < 16; s++) {
      const a = lerp(spineStart, spineEnd, s / 15);
      const rIn = 8.5;
      const rOut = 15.5 + (s % 2) * 2.6;
      c.fillStyle = s % 2 === 0 ? (uncurl > 0.15 ? '#b45309' : '#a8a29e') : uncurl > 0.15 ? '#fde68a' : '#78716c';
      c.beginPath();
      c.moveTo(Math.cos(a - 0.13) * rIn, Math.sin(a - 0.13) * rIn);
      c.lineTo(Math.cos(a) * rOut, Math.sin(a) * rOut);
      c.lineTo(Math.cos(a + 0.13) * rIn, Math.sin(a + 0.13) * rIn);
      c.closePath();
      c.fill();
    }

    c.fillStyle = uncurl > 0.15 ? '#92400e' : '#57534e';
    c.strokeStyle = 'rgba(253, 230, 138, 0.35)';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(0, 1, 11 + uncurl * 2.5, 8.5, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    if (uncurl > 0.1) {
      const snP = subP(uncurl, 0.1, 1.0);
      c.fillStyle = '#fde68a';
      c.beginPath();
      c.moveTo(6, -4);
      c.quadraticCurveTo(12 * snP + 6, -3, 7 + 12 * snP, 1.5);
      c.quadraticCurveTo(12 * snP + 5, 6, 6, 6.5);
      c.closePath();
      c.fill();

      c.fillStyle = '#0f172a';
      c.beginPath();
      c.arc(7 + 12 * snP, 1.2, 1.7 * snP, 0, Math.PI * 2);
      c.arc(10 * snP + 2.5, -0.8, 1.4 * snP, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    if (p > 0.48) {
      const hP = subP(p, 0.48, 1.0);
      drawHeart(c, cx + 18, groundY - 25 - hP * 4, 5.4 * hP, '#fde047');
    }
  } else if (mode === 'ecg_rescue') {
    // 🚑 Aplikace Záchranka: Slabá křivka a zhasnuté AED -> Živý PQRST srdeční tep a GPS maják AED
    const leftX = cx - spanX + 10;
    const aedX = cx + spanX - 28;
    const ecgEnd = aedX - 22;
    const ecgY = cy + 4;

    // Jemná souřadnicová mřížka
    c.strokeStyle = 'rgba(52, 211, 153, 0.12)';
    c.lineWidth = 1;
    for (let x = leftX; x <= ecgEnd; x += 22) {
      c.beginPath();
      c.moveTo(x, cy - 20);
      c.lineTo(x, by - 4);
      c.stroke();
    }

    // PQRST křivka s plynulou amplitudou (p: 0 -> 1)
    const amp = lerp(0.12, 1.0, easeOut(p));
    const midEcg = (leftX + ecgEnd) * 0.5;
    c.save();
    c.strokeStyle = p > 0.15 ? '#34d399' : 'rgba(244, 63, 94, 0.55)';
    c.shadowColor = p > 0.15 ? '#34d399' : '#f43f5e';
    c.shadowBlur = 4 + p * 7;
    c.lineWidth = 1.8 + p * 1.0;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(leftX, ecgY);
    c.lineTo(midEcg - 28, ecgY);
    c.lineTo(midEcg - 20, ecgY - 6 * amp);
    c.lineTo(midEcg - 13, ecgY);
    c.lineTo(midEcg - 7, ecgY + 9 * amp);
    c.lineTo(midEcg, ecgY - 27 * amp);
    c.lineTo(midEcg + 8, ecgY + 14 * amp);
    c.lineTo(midEcg + 16, ecgY);
    c.lineTo(midEcg + 24, ecgY - 7 * amp);
    c.lineTo(midEcg + 32, ecgY);
    c.lineTo(ecgEnd, ecgY);
    c.stroke();
    c.restore();

    if (p > 0.1) {
      const sweepU = red ? 0.5 : (wt * 0.65) % 1;
      const dotX = lerp(leftX, ecgEnd, sweepU);
      drawGlow(c, midEcg, ecgY - 8 * amp, 18 * p, '#34d399', 0.3 * p);
      c.fillStyle = '#fde047';
      c.beginPath();
      c.arc(dotX, ecgY, 2.4, 0, Math.PI * 2);
      c.fill();
    }

    // AED lokátor s GPS kruhy
    const aedP = easeOut(subP(p, 0.2, 0.95));
    if (aedP > 0.05) {
      for (let r = 1; r <= 2; r++) {
        const rad = 14 + r * 7 * aedP + (red ? 0 : (wt * 8) % 6);
        c.strokeStyle = `rgba(52, 211, 153, ${(0.42 * aedP) / r})`;
        c.lineWidth = 1.3;
        c.beginPath();
        c.arc(aedX, ecgY - 2, rad, 0, Math.PI * 2);
        c.stroke();
      }
    }

    c.fillStyle = aedP > 0.1 ? '#059669' : '#1e293b';
    c.strokeStyle = aedP > 0.1 ? '#6ee7b7' : '#64748b';
    c.lineWidth = 1.6;
    drawRoundRect(c, aedX - 11, ecgY - 13, 22, 22, 5);
    c.fill();
    c.stroke();
    drawHeart(c, aedX, ecgY - 4, 5.5, aedP > 0.1 ? '#fde047' : '#94a3b8');
  } else if (mode === 'blood_drop') {
    // 🩸 Darování krve: 3D rubínová kapka vlevo a 3 tichá srdce vpravo -> 3 pulsující EKG linie života rozsvěcující 3 hřejivá srdce
    const dropX = cx - 58;
    const dropFloat = red ? 0 : Math.sin(wt * 2.2) * 1.1;
    const dropY = cy + dropFloat;
    const lanes = [
      { idx: 0, hx: cx + 46, hy: cy - 20, syOff: -3.4, qrsU: 0.45, heartCol: '#f43f5e', glowCol: '#fbbf24' },
      { idx: 1, hx: cx + 49, hy: cy, syOff: 0, qrsU: 0.51, heartCol: '#f43f5e', glowCol: '#fde047' },
      { idx: 2, hx: cx + 46, hy: cy + 20, syOff: 3.4, qrsU: 0.47, heartCol: '#fb7185', glowCol: '#fbbf24' }
    ];

    const traceTeardropPath = () => {
      c.beginPath();
      c.moveTo(0, -14);
      c.bezierCurveTo(-10.5, 1, -9.8, 12.5, 0, 12.5);
      c.bezierCurveTo(9.8, 12.5, 10.5, 1, 0, -14);
      c.closePath();
    };

    const ecgWaveOffset = (u, qrsCenter, amp) => {
      const loc = (u - (qrsCenter - 0.14)) / 0.28;
      if (loc < 0 || loc > 1) return 0;
      if (loc < 0.16) return -2.1 * Math.sin((loc / 0.16) * Math.PI) * amp;
      if (loc < 0.25) return 0;
      if (loc < 0.33) return lerp(0, 2.8, (loc - 0.25) / 0.08) * amp;
      if (loc < 0.46) return lerp(2.8, -9.4, (loc - 0.33) / 0.13) * amp;
      if (loc < 0.58) return lerp(-9.4, 4.4, (loc - 0.46) / 0.12) * amp;
      if (loc < 0.67) return lerp(4.4, 0, (loc - 0.58) / 0.09) * amp;
      if (loc < 0.75) return 0;
      if (loc < 0.95) return -2.6 * Math.sin(((loc - 0.75) / 0.20) * Math.PI) * amp;
      return 0;
    };

    const buildLaneUs = (qrsCenter, maxU) => {
      const baseSteps = 44;
      const us = [];
      for (let s = 0; s <= baseSteps; s++) {
        const u = s / baseSteps;
        if (u < maxU) us.push(u);
      }
      [0.25, 0.33, 0.46, 0.58, 0.67].forEach((kLoc) => {
        const ku = qrsCenter - 0.14 + kLoc * 0.28;
        if (ku > 0 && ku < maxU) us.push(ku);
      });
      us.push(maxU);
      us.sort((a, b) => a - b);
      return us;
    };

    const sampleLanePoint = (ln, u, amp, sxOverride) => {
      const sx = sxOverride ?? dropX + 11.5;
      const sy = dropY + ln.syOff;
      const ex = ln.hx - 8.2;
      const ey = ln.hy;
      const x = lerp(sx, ex, u);
      const fanT = clamp01(u / 0.32);
      const smoothFan = fanT * fanT * (3 - 2 * fanT);
      const baseY = lerp(sy, ey, smoothFan);
      return { x, y: baseY + ecgWaveOffset(u, ln.qrsU, amp) };
    };

    // Jemná kapkovitá tlaková vlna za rubínovou kapkou (nekříží linie života kružnicí)
    drawGlow(c, dropX, dropY + 1.5, 20 + prep * 4 + p * 8, '#f43f5e', 0.32 + prep * 0.1 + p * 0.22);
    if (p > 0.08) {
      const ringP = easeOut(subP(p, 0.08, 0.88));
      const pulseScale = 1.14 + ringP * 0.22 + (red ? 0 : Math.sin(wt * 3.2) * 0.03 * ringP);
      c.save();
      c.translate(dropX, dropY + 0.5);
      c.scale(pulseScale, pulseScale);
      c.strokeStyle = `rgba(253, 164, 175, ${(0.34 * ringP).toFixed(3)})`;
      c.lineWidth = 1.05 / pulseScale;
      traceTeardropPath();
      c.stroke();
      c.restore();
    }

    lanes.forEach((ln, i) => {
      const lineP = easeOut(subP(p, 0.02 + i * 0.05, 0.64 + i * 0.05));
      const fullUs = buildLaneUs(ln.qrsU, 1.0);

      // 1. Klidové nezapálené EKG dráhy (p = 0 jemný náznak čekajícího pulsu)
      c.save();
      c.setLineDash([2.5, 3]);
      c.strokeStyle = `rgba(148, 163, 184, ${(0.28 + prep * 0.1) * (1 - lineP * 0.65)})`;
      c.lineWidth = 1.25;
      c.lineJoin = 'round';
      c.beginPath();
      fullUs.forEach((u, idx) => {
        const pt = sampleLanePoint(ln, u, 0.48 + prep * 0.14, dropX + 11.5);
        if (idx === 0) c.moveTo(pt.x, pt.y);
        else c.lineTo(pt.x, pt.y);
      });
      c.stroke();
      c.restore();

      // 2. Zářící růžovo-zlato-smaragdové linie života s ostrým QRS vrcholem (p -> 1)
      if (lineP > 0.015) {
        const sx = dropX + 7.5;
        const ex = ln.hx - 7.2;
        const lg = c.createLinearGradient(sx, ln.hy, ex, ln.hy);
        lg.addColorStop(0, '#fb7185');
        lg.addColorStop(0.50, '#fde047');
        lg.addColorStop(1, '#34d399');

        c.save();
        c.strokeStyle = lg;
        c.shadowColor = '#fb7185';
        c.shadowBlur = 5.5 * lineP;
        c.lineWidth = 2.15;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        c.beginPath();
        const activeUs = buildLaneUs(ln.qrsU, lineP);
        activeUs.forEach((u, idx) => {
          const pt = sampleLanePoint(ln, u, 1.0, sx);
          if (idx === 0) c.moveTo(pt.x, pt.y);
          else c.lineTo(pt.x, pt.y);
        });
        c.stroke();
        c.restore();

        if (lineP > ln.qrsU) {
          const peakPt = sampleLanePoint(ln, ln.qrsU - 0.0112, 1.0, sx);
          drawGlow(c, peakPt.x, peakPt.y + 3, Math.max(0.5, 9.5 * subP(lineP, ln.qrsU, 1.0)), '#fde047', 0.22 * lineP);
        }

        if (lineP > 0.82 && !red) {
          const pu = (wt * 0.72 + i * 0.33) % 1;
          const bPt = sampleLanePoint(ln, pu, 1.0, sx);
          c.fillStyle = '#fef08a';
          c.beginPath();
          c.arc(bPt.x, bPt.y, 1.8, 0, Math.PI * 2);
          c.fill();
        }
      }

      // 3. Tři srdce vpravo: p = 0 klidový obrys -> p -> 1 zářící hřejivá bijící srdce
      const hP = easeOut(subP(p, 0.36 + i * 0.08, 0.90 + i * 0.05));
      const rBase = 5.8;
      const hyTop = ln.hy - rBase * 0.55;
      if (hP < 0.95) {
        c.save();
        c.fillStyle = `rgba(15, 23, 42, ${0.38 * (1 - hP)})`;
        c.strokeStyle = `rgba(203, 213, 225, ${(0.5 + prep * 0.12) * (1 - hP * 0.85)})`;
        c.lineWidth = 1.35;
        c.beginPath();
        c.moveTo(ln.hx, hyTop + rBase * 0.35);
        c.bezierCurveTo(ln.hx - rBase, hyTop - rBase * 0.4, ln.hx - rBase * 1.1, hyTop + rBase * 0.6, ln.hx, hyTop + rBase * 1.25);
        c.bezierCurveTo(ln.hx + rBase * 1.1, hyTop + rBase * 0.6, ln.hx + rBase, hyTop - rBase * 0.4, ln.hx, hyTop + rBase * 0.35);
        c.fill();
        c.stroke();
        c.restore();
      }
      if (hP > 0.04) {
        const beat = 1 + (red ? 0 : Math.sin(wt * 4.3 + i * 0.9) * 0.08 * hP);
        const rLit = 6.5 * hP * beat;
        const litTopY = ln.hy - rLit * 0.55;
        drawGlow(c, ln.hx, ln.hy, Math.max(0.5, 16 * hP), ln.glowCol, 0.28 * hP);
        drawGlow(c, ln.hx, ln.hy, Math.max(0.5, 10 * hP), '#f43f5e', 0.22 * hP);
        drawHeart(c, ln.hx, litTopY, rLit, i === 1 ? '#e11d48' : '#f43f5e');
        c.save();
        c.strokeStyle = `rgba(254, 240, 138, ${(0.58 * hP).toFixed(3)})`;
        c.lineWidth = 0.9;
        c.beginPath();
        c.moveTo(ln.hx, litTopY + rLit * 0.35);
        c.bezierCurveTo(ln.hx - rLit, litTopY - rLit * 0.4, ln.hx - rLit * 1.1, litTopY + rLit * 0.6, ln.hx, litTopY + rLit * 1.25);
        c.bezierCurveTo(ln.hx + rLit * 1.1, litTopY + rLit * 0.6, ln.hx + rLit, litTopY - rLit * 0.4, ln.hx, litTopY + rLit * 0.35);
        c.stroke();
        c.restore();
        // Jemný hřejivý odlesk na horním laloku srdce
        c.fillStyle = `rgba(255, 255, 255, ${0.72 * hP})`;
        c.beginPath();
        c.arc(ln.hx - rLit * 0.34, litTopY + rLit * 0.22, Math.max(0.4, 1.25 * hP), 0, Math.PI * 2);
        c.fill();
      }
    });

    // 4. Zářivá 3D rubínová kapka krve vlevo (překrývá počátek linií života pro plynulé vyústění)
    c.save();
    c.translate(dropX, dropY);
    const dropGrad = c.createRadialGradient(-3.2, -1, 1, 0, 2, 14.5);
    dropGrad.addColorStop(0, '#ffe4e6');
    dropGrad.addColorStop(0.28, '#fb7185');
    dropGrad.addColorStop(0.68, '#e11d48');
    dropGrad.addColorStop(1, '#881337');
    c.fillStyle = dropGrad;
    c.strokeStyle = 'rgba(254, 205, 211, 0.56)';
    c.lineWidth = 1;
    traceTeardropPath();
    c.fill();
    c.stroke();

    c.fillStyle = 'rgba(255, 255, 255, 0.76)';
    c.beginPath();
    c.ellipse(-3.3, 1.5, 1.9, 4.1, -0.24, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(253, 224, 71, 0.34)';
    c.beginPath();
    c.arc(3.4, 6.8, 1.3, 0, Math.PI * 2);
    c.fill();
    c.restore();
  } else if (mode === 'dna_helix') {
    // 🧬 Registr kostní dřeně: Dva oddělené nespojené řetězce -> 100% molekulární shoda a sepnutá dvoušroubovice
    const rungs = 15;
    const sep = (1 - easeOut(p)) * 13;
    const spanH = Math.min(82, spanX * 0.72);

    for (let s = 0; s < 2; s++) {
      c.strokeStyle = s === 0 ? '#c084fc' : p > 0.3 ? '#34d399' : '#38bdf8';
      c.lineWidth = 2;
      c.beginPath();
      for (let k = 0; k <= 28; k++) {
        const u = k / 28;
        const x = lerp(cx - spanH, cx + spanH, u);
        const angle = wt * 2.1 + u * Math.PI * 2.6 + (s === 1 ? Math.PI : 0);
        const y = cy + 2 + Math.sin(angle) * 14 + (s === 0 ? -sep : sep);
        if (k === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }

    for (let k = 0; k < rungs; k++) {
      const u = k / (rungs - 1);
      const x = lerp(cx - spanH, cx + spanH, u);
      const angle = wt * 2.1 + u * Math.PI * 2.6;
      const y1 = cy + 2 + Math.sin(angle) * 14 - sep;
      const y2 = cy + 2 + Math.sin(angle + Math.PI) * 14 + sep;
      const zipP = easeOut(subP(p, u * 0.55, u * 0.55 + 0.42));

      const mid1 = lerp(y1, (y1 + y2) * 0.5, 0.32 + zipP * 0.68);
      const mid2 = lerp(y2, (y1 + y2) * 0.5, 0.32 + zipP * 0.68);
      c.strokeStyle = zipP > 0.8 ? 'rgba(253, 224, 71, 0.85)' : 'rgba(167, 139, 250, 0.45)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x, y1);
      c.lineTo(x, mid1);
      c.moveTo(x, y2);
      c.lineTo(x, mid2);
      c.stroke();

      c.fillStyle = '#c084fc';
      c.beginPath();
      c.arc(x, y1, 2.7, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = zipP > 0.5 ? '#34d399' : '#38bdf8';
      c.beginPath();
      c.arc(x, y2, 2.7, 0, Math.PI * 2);
      c.fill();
    }
    if (p > 0.65) {
      drawStar(c, cx, cy - 20, 5.2 * subP(p, 0.65, 1.0), '#fde047');
    }
  } else if (mode === 'hair_silk') {
    // 💇‍♀️ Daruj vlasy: Svázaný cop vlevo -> Hedvábné zlatavě růžové prameny splývající do květinové koruny
    const leftX = cx - 64;
    const rightX = cx + 44;
    const flowP = easeOut(subP(p, 0, 0.82));

    // Hedvábné prameny prodlužující se z copu do koruny
    const curEndX = lerp(leftX + 26, rightX, flowP);
    for (let s = 0; s < 5; s++) {
      c.strokeStyle = s % 2 === 0 ? '#fbbf24' : '#f472b6';
      c.lineWidth = 2.3;
      c.lineCap = 'round';
      c.beginPath();
      for (let step = 0; step <= 24; step++) {
        const u = step / 24;
        const x = lerp(leftX, curEndX, u);
        const bundlePinch = Math.min(1, u * 4);
        const wave = Math.sin(u * 6 - wt * 2.4 + s * 0.65) * (3 + flowP * 8) * bundlePinch;
        const spread = (s - 2) * (1.2 + bundlePinch * (1.5 + flowP * 2.2));
        const y = cy + 2 + wave + spread;
        if (step === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }

    // Zlatá stuha u copu vlevo
    c.fillStyle = '#fde047';
    drawRoundRect(c, leftX + 4, cy - 6, 5, 16, 2);
    c.fill();

    // Květinová koruna / paruka rozkvétající vpravo (p -> 1)
    const crownP = easeOut(subP(p, 0.45, 1.0));
    if (crownP > 0.05) {
      drawGlow(c, rightX - 6, cy + 2, 24 * crownP, '#fde047', 0.3 * crownP);
      drawFlower(c, rightX - 18, cy - 10, 5 * crownP, '#ffffff', '#fde047');
      drawFlower(c, rightX - 4, cy - 14, 6 * crownP, '#fbcfe8', '#f59e0b');
      drawFlower(c, rightX + 8, cy - 8, 4.8 * crownP, '#ffffff', '#34d399');
    }
  } else if (mode === 'mind_wave') {
    // 🧠 Nevypusť duši: Chaotické zašmodrchané klubko myšlenek -> Plynulé rozpletení do klidné harmonické vlny
    const untangle = easeOut(p);
    const pts = 52;
    const waveSpan = Math.min(96, spanX * 0.82);

    // Doprovodné harmonické vlny klidu při rozplétání
    if (untangle > 0.25) {
      const compA = subP(untangle, 0.25, 1.0);
      ['#34d399', '#fde047'].forEach((col, idx) => {
        c.save();
        c.strokeStyle = col;
        c.globalAlpha = 0.55 * compA;
        c.lineWidth = 1.7;
        c.beginPath();
        for (let i = 0; i <= 36; i++) {
          const u = i / 36;
          const x = lerp(cx - waveSpan, cx + waveSpan, u);
          const y = cy + 2 + Math.sin(u * Math.PI * 3 - wt * 2.0 + (idx + 1) * 1.1) * (11 * compA);
          if (i === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
        c.restore();
      });
    }

    // Hlavní spojitá křivka: p = 0 Lissajousův uzel -> p = 1 klidná sinusoida
    const lineGrad = c.createLinearGradient(cx - waveSpan, cy, cx + waveSpan, cy);
    lineGrad.addColorStop(0, '#818cf8');
    lineGrad.addColorStop(0.5, untangle > 0.4 ? '#6ee7b7' : '#a78bfa');
    lineGrad.addColorStop(1, untangle > 0.6 ? '#fde047' : '#818cf8');

    c.strokeStyle = lineGrad;
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i <= pts; i++) {
      const u = i / pts;
      const knotX = cx + Math.cos(u * 21.5 + wt * 0.6) * 23 + Math.sin(u * 35) * 9;
      const knotY = cy + 2 + Math.sin(u * 25.5 + wt * 0.6) * 16 + Math.cos(u * 15) * 6;
      const waveX = lerp(cx - waveSpan, cx + waveSpan, u);
      const waveY = cy + 2 + Math.sin(u * Math.PI * 3 - wt * 2.0) * 12;
      const x = lerp(knotX, waveX, untangle);
      const y = lerp(knotY, waveY, untangle);
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();

    if (untangle > 0.6) {
      drawStar(c, cx, cy - 18, 4.8 * subP(untangle, 0.6, 1.0), '#fde047');
    }
  } else if (mode === 'breath_lotus') {
    // 🧘 Opatruj.se: Zavřené poupě na klidné hladině -> Rozkvetlý 7lístkový lotos s dechovými kruhy
    const baseL = by - 8;
    const bloom = easeOut(p);
    const breath = 1 + Math.sin(wt * 1.6) * 0.06;

    // Kruhy na vodní hladině
    for (let r = 1; r <= 3; r++) {
      const ripR = (18 + r * 14 * (0.4 + bloom * 0.6)) * breath;
      c.strokeStyle = `rgba(45, 212, 191, ${(0.18 + bloom * 0.3) / r})`;
      c.lineWidth = 1.3;
      c.beginPath();
      c.ellipse(cx, baseL + 2, ripR, ripR * 0.22, 0, 0, Math.PI * 2);
      c.stroke();
    }

    if (bloom > 0.15) {
      drawGlow(c, cx, baseL - 14, 28 * bloom, '#fde68a', 0.38 * bloom);
    }

    // 7 okvětních lístků otevírajících se z poupěte
    const angles = [-1.15, -0.78, -0.38, 0, 0.38, 0.78, 1.15];
    angles.forEach((ang, idx) => {
      c.save();
      c.translate(cx, baseL);
      const spread = lerp(0.08, 1.0, bloom) * breath;
      c.rotate(ang * spread);
      c.fillStyle =
        idx === 3 ? '#fde68a' : Math.abs(idx - 3) === 1 ? '#5eead4' : Math.abs(idx - 3) === 2 ? '#2dd4bf' : '#0d9488';
      c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(-7.5, -14, 0, -26 - (idx === 3 ? 3 : 0));
      c.quadraticCurveTo(7.5, -14, 0, 0);
      c.fill();
      c.stroke();
      c.restore();
    });

    if (bloom > 0.5) {
      drawStar(c, cx, baseL - 32, 4.5 * subP(bloom, 0.5, 1.0), '#fde047');
    }
  } else if (mode === 'wiki_ink') {
    // 📝 Wikipedie: Otevřená encyklopedie s chybějícím faktem [?] -> Zlaté plnicí pero dopisující ověřený řádek a hvězdy poznání
    const bkY = cy - 14;
    const bkH = 40;
    const halfW = 46;

    c.fillStyle = '#fffbeb';
    c.strokeStyle = '#f59e0b';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(cx, bkY + 4);
    c.quadraticCurveTo(cx - halfW * 0.5, bkY - 3, cx - halfW, bkY + 1);
    c.lineTo(cx - halfW, bkY + bkH);
    c.quadraticCurveTo(cx - halfW * 0.5, bkY + bkH - 3, cx, bkY + bkH + 3);
    c.quadraticCurveTo(cx + halfW * 0.5, bkY + bkH - 3, cx + halfW, bkY + bkH);
    c.lineTo(cx + halfW, bkY + 1);
    c.quadraticCurveTo(cx + halfW * 0.5, bkY - 3, cx, bkY + 4);
    c.closePath();
    c.fill();
    c.stroke();

    // Hřbet knihy
    c.strokeStyle = 'rgba(217, 119, 6, 0.45)';
    c.beginPath();
    c.moveTo(cx, bkY + 4);
    c.lineTo(cx, bkY + bkH + 3);
    c.stroke();

    // Řádky textu vlevo i vpravo
    for (let r = 0; r < 3; r++) {
      const ly = bkY + 11 + r * 9;
      c.strokeStyle = '#64748b';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(cx - 38, ly);
      c.lineTo(cx - 8, ly);
      c.stroke();
      if (r < 2) {
        c.beginPath();
        c.moveTo(cx + 8, ly);
        c.lineTo(cx + 36, ly);
        c.stroke();
      }
    }

    // Třetí řádek vpravo: p = 0 mezera s otazníkem -> p -> 1 zlaté pero píše smaragdový fakt
    const lineY = bkY + 29;
    const penP = easeOut(subP(p, 0.04, 0.78));
    if (penP < 0.35) {
      c.fillStyle = `rgba(217, 119, 6, ${1 - penP * 2.5})`;
      c.font = 'bold 9px sans-serif';
      c.fillText('[ ? ]', cx + 10, lineY + 3);
    }
    if (penP > 0.02) {
      const writeX = lerp(cx + 8, cx + 38, penP);
      c.strokeStyle = '#10b981';
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(cx + 8, lineY);
      c.lineTo(writeX, lineY);
      c.stroke();

      // Hrot plnicího pera
      c.save();
      c.translate(writeX + 2, lineY - 2);
      c.rotate(-0.65);
      c.fillStyle = '#fbbf24';
      c.strokeStyle = '#78350f';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(5, -3.5);
      c.lineTo(15, -2);
      c.lineTo(15, 2);
      c.lineTo(5, 3.5);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }

    if (p > 0.5) {
      const stP = easeOut(subP(p, 0.5, 1.0));
      drawStar(c, cx, bkY - 8 - stP * 4, 5.8 * stP, '#fde047');
      drawStar(c, cx + 24, bkY - 4 - stP * 3, 4.0 * stP, '#34d399');
    }
  } else if (mode === 'dove_appeal') {
    // ✍️ Amnesty apel: Chladné mříže vězení -> Zlatý tah podpisu rozestupující mříže a vzlétající holubice s ratolestí
    const openP = easeOut(subP(p, 0.1, 0.85));
    const doveRise = easeOut(p);
    const doveY = lerp(cy + 7, cy - 5, doveRise) + Math.sin(wt * 3.2) * 2.0;

    // Silueta holubice s rozepjatými perutěmi (jednotná čistá křivka bez rušivých vnitřních švů)
    c.save();
    c.translate(cx - 2, doveY);
    if (doveRise > 0.15) {
      drawGlow(c, 2, -2, 30 * doveRise, '#fde68a', 0.36 * doveRise);
    }
    const flap = Math.sin(wt * 5.2) * (1.8 + doveRise * 4.5);
    // Zadní peruť
    c.fillStyle = doveRise > 0.12 ? '#e2e8f0' : '#64748b';
    c.beginPath();
    c.moveTo(2, -2);
    c.bezierCurveTo(-4, -15 + flap * 0.7, 6, -21 + flap * 0.7, 11, -15 + flap * 0.7);
    c.quadraticCurveTo(9, -7, 5, -1);
    c.closePath();
    c.fill();

    // Tělo, vějířovitý ocásek, hlavička a hlavní peruť
    c.fillStyle = doveRise > 0.12 ? '#ffffff' : '#94a3b8';
    c.strokeStyle = doveRise > 0.12 ? '#fde047' : 'rgba(148, 163, 184, 0.6)';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(15, -4); // Zobáček
    c.quadraticCurveTo(13, -9, 8, -7); // Hlavička
    c.quadraticCurveTo(4, -5, 1, -3); // Šíje
    c.bezierCurveTo(-12, -19 + flap, -22, -16 + flap, -17, -6 + flap * 0.5); // Přední peruť
    c.quadraticCurveTo(-11, -2, -5, 0);
    c.lineTo(-18, 4); // Horní hrana ocásku
    c.quadraticCurveTo(-16, 8, -12, 8); // Vějíř ocásku
    c.lineTo(-3, 4);
    c.quadraticCurveTo(6, 6, 12, 0); // Hruď
    c.quadraticCurveTo(14, -2, 15, -4);
    c.closePath();
    c.fill();
    c.stroke();

    // Očko holubice
    c.fillStyle = '#0f172a';
    c.beginPath();
    c.arc(10.5, -5, 1.1, 0, Math.PI * 2);
    c.fill();

    // Olivová ratolest v zobáčku (p -> 1)
    if (doveRise > 0.25) {
      const spP = subP(doveRise, 0.25, 0.85);
      c.strokeStyle = '#34d399';
      c.lineWidth = 1.6;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(15, -3.5);
      c.quadraticCurveTo(21, -6, 26, -1);
      c.stroke();
      c.fillStyle = '#4ade80';
      c.beginPath();
      c.ellipse(20.5, -5.5, 2.8 * spP, 1.3 * spP, -0.45, 0, Math.PI * 2);
      c.ellipse(24.5, -2, 2.8 * spP, 1.3 * spP, 0.4, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // Železné mříže: střední pruty se rozestupují a rozplývají do zlatých jisker
    for (let b = -2; b <= 2; b++) {
      const isMid = Math.abs(b) <= 1;
      const spreadX = isMid ? b * openP * 15 : b * openP * 3;
      const bx = cx + b * 15 + spreadX;
      const gapHalf = isMid ? openP * 24 : 0;
      const alpha = isMid ? Math.max(0.05, 1 - openP * 0.95) : 0.68 - openP * 0.32;
      c.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(bx, cy - 23);
      c.lineTo(bx, cy - gapHalf);
      c.moveTo(bx, cy + gapHalf);
      c.lineTo(bx, by - 4);
      c.stroke();
    }

    // Zlatý kaligrafický tah podpisu a jiskry svobody
    if (p > 0.02) {
      const sigP = easeOut(subP(p, 0.02, 0.55));
      c.strokeStyle = '#fde047';
      c.lineWidth = 2.2;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx - 36, by - 9);
      c.quadraticCurveTo(cx - 8, by - 18, lerp(cx - 36, cx + 36, sigP), by - 10);
      c.stroke();
      if (openP > 0.45) {
        drawStar(c, cx + 24, cy - 16, 4.2 * subP(openP, 0.45, 1.0), '#fde047');
      }
    }
  } else if (mode === 'code_nodes') {
    // 💻 Česko.Digital: Zřetelné izolované digitální uzly -> Propojená síť pomoci ve tvaru štítu/srdce s datovými pulsy
    const nodes = [
      [cx - 58, cy - 6],
      [cx - 28, cy - 18],
      [cx, cy - 8],
      [cx + 28, cy - 18],
      [cx + 58, cy - 6],
      [cx - 36, cy + 12],
      [cx, cy + 20],
      [cx + 36, cy + 12]
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 4],
      [1, 5], [2, 6], [3, 7]
    ];

    // Při p = 0 jemné čárkované čekající spoje, aby byla struktura sítě okamžitě čitelná
    c.save();
    c.setLineDash([2, 4]);
    c.strokeStyle = 'rgba(148, 163, 184, 0.24)';
    c.lineWidth = 1.1;
    edges.forEach(([a, b]) => {
      c.beginPath();
      c.moveTo(nodes[a][0], nodes[a][1]);
      c.lineTo(nodes[b][0], nodes[b][1]);
      c.stroke();
    });
    c.restore();

    edges.forEach(([a, b], idx) => {
      const eP = easeOut(subP(p, idx * 0.055, idx * 0.055 + 0.36));
      if (eP <= 0.01) return;
      const [x1, y1] = nodes[a];
      const [x2, y2] = nodes[b];
      const curX = lerp(x1, x2, eP);
      const curY = lerp(y1, y2, eP);
      c.strokeStyle = `rgba(56, 189, 248, ${0.32 + eP * 0.58})`;
      c.lineWidth = 1.9;
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(curX, curY);
      c.stroke();

      if (eP > 0.9 && idx % 3 === 0) {
        const u = red ? 0.5 : (wt * 1.2 + idx * 0.25) % 1;
        c.fillStyle = '#fde047';
        c.beginPath();
        c.arc(lerp(x1, x2, u), lerp(y1, y2, u), 2.2, 0, Math.PI * 2);
        c.fill();
      }
    });

    nodes.forEach(([nx, ny], idx) => {
      const nP = easeOut(subP(p, idx * 0.05, idx * 0.05 + 0.4));
      if (nP > 0.15) {
        drawGlow(c, nx, ny, 11 * nP, '#38bdf8', 0.38 * nP);
      }
      // Vnější prstenec terminálu + středový bod (výrazný i v klidovém stavu p = 0)
      c.fillStyle = '#072016';
      c.strokeStyle = nP > 0.1 ? (idx % 2 === 0 ? '#38bdf8' : '#34d399') : 'rgba(148, 163, 184, 0.72)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(nx, ny, 4.4 + nP * 0.8, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      c.fillStyle = nP > 0.1 ? '#fde047' : 'rgba(203, 213, 225, 0.75)';
      c.beginPath();
      c.arc(nx, ny, 1.7 + nP * 0.8, 0, Math.PI * 2);
      c.fill();
    });
  } else if (mode === 'cosmos_science') {
    // 🔭 Zooniverse: Rozostřený oblak v hledáčku -> Zaostřený zelený zámek, měkká eliptická mlhovina a 3ramenná spirální galaxie se 14 hvězdami
    const focusP = easeOut(p);
    const galY = cy + 2;
    const padX = lerp(46, 38, focusP);
    const padY = lerp(22.5, 19.5, focusP);
    const brLen = 8.5;

    // 1. Měkká eliptická mlhovina uvnitř hledáčku bez ostrého okraje (p = 0 mlhavý oblak -> p -> 1 hluboké pole Hubble/JWST)
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(cx, galY);
    c.rotate(-0.14);
    c.scale(1.9, 0.88);
    const outerNebR = 20.5;
    const nebGrad = c.createRadialGradient(0, 0, 0, 0, 0, outerNebR);
    if (focusP > 0.1) {
      nebGrad.addColorStop(0, `rgba(254, 240, 138, ${(0.32 * focusP).toFixed(3)})`);
      nebGrad.addColorStop(0.28, `rgba(244, 114, 182, ${(0.30 * focusP).toFixed(3)})`);
      nebGrad.addColorStop(0.58, `rgba(56, 189, 248, ${(0.22 * focusP).toFixed(3)})`);
      nebGrad.addColorStop(0.82, `rgba(129, 140, 248, ${(0.11 * focusP).toFixed(3)})`);
      nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      const preA = 0.18 + prep * 0.08;
      nebGrad.addColorStop(0, `rgba(148, 163, 184, ${preA.toFixed(3)})`);
      nebGrad.addColorStop(0.52, `rgba(100, 116, 139, ${(preA * 0.58).toFixed(3)})`);
      nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    c.fillStyle = nebGrad;
    c.beginPath();
    c.arc(0, 0, outerNebR, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 2. Rohové značky hledáčku
    c.strokeStyle = focusP > 0.25 ? '#34d399' : 'rgba(148, 163, 184, 0.55)';
    c.lineWidth = 1.8;
    [
      [-1, -1], [1, -1], [-1, 1], [1, 1]
    ].forEach(([dx, dy]) => {
      const rx = cx + dx * padX;
      const ry = galY + dy * padY;
      c.beginPath();
      c.moveTo(rx, ry - dy * brLen);
      c.lineTo(rx, ry);
      c.lineTo(rx - dx * brLen, ry);
      c.stroke();
    });

    // 3. Hluboké hvězdné pole v rozích hledáčku mimo dráhu ramen (5 polních hvězd + 9 hvězd podél ramen = 14 bodových hvězd)
    const deepFieldStars = [
      { dx: -30.5, dy: -11.8, r: 1.12, col: '#fef08a', spike: true, pre: true },
      { dx: 28.5, dy: -12.4, r: 0.92, col: '#bae6fd', spike: false, pre: true },
      { dx: -26.5, dy: 12.6, r: 0.82, col: '#ffffff', spike: false, pre: false },
      { dx: 31.0, dy: 11.4, r: 1.18, col: '#fde68a', spike: true, pre: true },
      { dx: 12.5, dy: -14.6, r: 0.72, col: '#fbcfe8', spike: false, pre: false }
    ];
    deepFieldStars.forEach((st, idx) => {
      const stP = st.pre ? Math.max(0.24 + prep * 0.1, focusP) : easeOut(subP(focusP, 0.15, 0.85));
      if (stP <= 0.02) return;
      const tw = red ? 1 : 0.8 + 0.2 * Math.sin(wt * 2.8 + idx * 1.4);
      const sx = cx + st.dx;
      const sy = galY + st.dy;
      c.save();
      c.globalAlpha = clamp01(stP * tw);
      c.fillStyle = st.col;
      c.beginPath();
      c.arc(sx, sy, st.r * (0.72 + 0.28 * focusP), 0, Math.PI * 2);
      c.fill();
      if (st.spike && focusP > 0.45) {
        const spLen = 3.2 * subP(focusP, 0.45, 1.0);
        c.strokeStyle = st.col;
        c.lineWidth = 0.8;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(sx - spLen, sy);
        c.lineTo(sx + spLen, sy);
        c.moveTo(sx, sy - spLen);
        c.lineTo(sx, sy + spLen);
        c.stroke();
      }
      c.restore();
    });

    // 4. Zaostřená 3ramenná spirální galaxie a 9 ostrých bodových hvězd podél ramen (celkem 14 hvězd různých velikostí a teplot)
    if (focusP > 0.05) {
      const armStarCols = ['#ffffff', '#fef08a', '#bae6fd', '#fbcfe8', '#fde047'];
      c.save();
      c.lineCap = 'round';
      c.lineJoin = 'round';
      for (let arm = 0; arm < 3; arm++) {
        const armCol = arm === 0 ? '#38bdf8' : arm === 1 ? '#f472b6' : '#a78bfa';
        c.strokeStyle = armCol;
        c.shadowColor = armCol;
        c.shadowBlur = 5.5 * focusP;
        c.globalAlpha = focusP * 0.86;
        c.lineWidth = 1.9;
        c.beginPath();
        for (let k = 0; k <= 20; k++) {
          const u = (k / 20) * focusP;
          const a = wt * 0.55 + (arm * Math.PI * 2) / 3 + u * 3.55;
          const rad = 2 + u * 22.5;
          const sx = cx + Math.cos(a) * rad * 1.22;
          const sy = galY + Math.sin(a) * rad * 0.58;
          if (k === 0) c.moveTo(sx, sy);
          else c.lineTo(sx, sy);
        }
        c.stroke();

        // 3 ostré bodové hvězdy v okolí každého ze 3 ramen (3 × 3 = 9)
        c.shadowBlur = 0;
        for (let sIdx = 0; sIdx < 3; sIdx++) {
          const uStar = 0.28 + sIdx * 0.27;
          const visP = easeOut(subP(focusP, uStar * 0.62, Math.min(1.0, uStar * 0.62 + 0.34)));
          if (visP <= 0.02) continue;
          const aOff = sIdx % 2 === 0 ? 0.2 : -0.22;
          const rOff = sIdx === 1 ? 2.1 : -1.4;
          const a = wt * 0.55 + (arm * Math.PI * 2) / 3 + uStar * 3.55 + aOff;
          const rad = 2 + uStar * 22.5 + rOff;
          const sx = cx + Math.cos(a) * rad * 1.22;
          const sy = galY + Math.sin(a) * rad * 0.58;
          const starIdx = arm * 3 + sIdx;
          const rDot = (0.62 + (starIdx % 3) * 0.22) * visP;
          const tw = red ? 1 : 0.82 + 0.18 * Math.sin(wt * 3.4 + starIdx * 1.1);
          c.globalAlpha = clamp01(visP * tw);
          c.fillStyle = armStarCols[starIdx % armStarCols.length];
          c.beginPath();
          c.arc(sx, sy, Math.max(0.3, rDot), 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();
      drawGlow(c, cx, galY, Math.max(0.5, 11 * focusP), '#fde047', 0.28 * focusP);
      drawStar(c, cx, galY, 6.2 * focusP, '#fde047');
    }
  } else if (mode === 'tutoring_spark') {
    // 🧑‍🏫 Učíme online: Zašmodrchaná čmáranice a zhasnutá žárovka -> Jasná dráha poznání rozsvěcující žárovku
    const sparkP = easeOut(p);
    const bulbX = cx + 38;
    const bulbY = cy - 6;

    // Křivka na tabuli: p = 0 zmatené smyčky -> p = 1 čistá vzestupná trajektorie k žárovce
    c.strokeStyle = sparkP > 0.2 ? '#fde047' : 'rgba(148, 163, 184, 0.55)';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    for (let i = 0; i <= 28; i++) {
      const u = i / 28;
      const sx = lerp(cx - 56, bulbX - 14, u);
      const messyY = cy + 8 + Math.sin(u * 17) * 11 + Math.cos(u * 9) * 5;
      const cleanY = lerp(by - 10, bulbY + 4, Math.pow(u, 0.85));
      const sy = lerp(messyY, cleanY, sparkP);
      if (i === 0) c.moveTo(sx, sy);
      else c.lineTo(sx, sy);
    }
    c.stroke();

    // Žárovka poznání
    const lit = easeOut(subP(p, 0.35, 0.95));
    if (lit > 0.05) {
      drawGlow(c, bulbX, bulbY, 28 * lit, '#fde047', 0.45 * lit);
      for (let r = 0; r < 6; r++) {
        const ra = (r * Math.PI) / 3 - Math.PI * 0.5;
        c.strokeStyle = `rgba(253, 224, 71, ${0.75 * lit})`;
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(bulbX + Math.cos(ra) * 13, bulbY + Math.sin(ra) * 13);
        c.lineTo(bulbX + Math.cos(ra) * (15 + 5 * lit), bulbY + Math.sin(ra) * (15 + 5 * lit));
        c.stroke();
      }
    }

    c.fillStyle = lit > 0.1 ? `rgba(254, 240, 138, ${0.25 + lit * 0.7})` : 'rgba(51, 65, 85, 0.5)';
    c.strokeStyle = lit > 0.1 ? '#fde047' : '#94a3b8';
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(bulbX, bulbY, 9.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = '#94a3b8';
    c.fillRect(bulbX - 4, bulbY + 9, 8, 4.5);
  } else if (mode === 'school_pencil') {
    // ✏️ Doučujte.cz: Sešit s otazníky -> Zlatá tužka kreslící vzestupnou křivku a hvězdy porozumění
    const nbX = cx - 44;
    const nbY = cy - 16;
    const nbW = 88;
    const nbH = 42;

    c.fillStyle = '#063729';
    c.strokeStyle = '#34d399';
    c.lineWidth = 1.6;
    drawRoundRect(c, nbX, nbY, nbW, nbH, 4);
    c.fill();
    c.stroke();

    // Linky v sešitě
    c.strokeStyle = 'rgba(110, 231, 183, 0.16)';
    c.lineWidth = 1;
    for (let l = 1; l <= 3; l++) {
      c.beginPath();
      c.moveTo(nbX + 8, nbY + l * 10);
      c.lineTo(nbX + nbW - 8, nbY + l * 10);
      c.stroke();
    }

    const penP = easeOut(subP(p, 0.04, 0.85));
    if (penP < 0.45) {
      c.fillStyle = `rgba(253, 230, 138, ${(1 - penP * 2) * 0.65})`;
      c.font = 'bold 12px sans-serif';
      c.fillText('?', cx - 22, cy + 8);
      c.fillText('?', cx + 10, cy + 4);
    }

    if (penP > 0.02) {
      const startX = nbX + 12;
      const startY = nbY + nbH - 9;
      const targetX = nbX + nbW - 14;
      const targetY = nbY + 10;
      const curX = lerp(startX, targetX, penP);
      const curY = lerp(startY, targetY, Math.pow(penP, 0.85));

      c.strokeStyle = '#fde047';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(startX, startY);
      c.quadraticCurveTo(lerp(startX, curX, 0.5), startY - 4 * penP, curX, curY);
      c.stroke();

      // Dřevěná tužka na špičce tahu
      c.save();
      c.translate(curX, curY);
      c.rotate(-0.7);
      c.fillStyle = '#fde68a';
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(5, -2.8);
      c.lineTo(5, 2.8);
      c.closePath();
      c.fill();
      c.fillStyle = '#fbbf24';
      c.fillRect(5, -2.8, 13, 5.6);
      c.fillStyle = '#fb7185';
      c.fillRect(18, -2.8, 3.5, 5.6);
      c.restore();
    }

    if (p > 0.55) {
      drawStar(c, nbX + nbW - 14, nbY + 9, 5.5 * subP(p, 0.55, 1.0), '#fde047');
    }
  } else if (mode === 'senior_letter') {
    // 👵 Dopis seniorovi: Zavřená šedá obálka v šeru -> Otevírající se klopa, vysouvající se vřelý dopis a srdce
    const envW = 58;
    const envH = 32;
    const envX = cx - envW / 2;
    const envY = by - envH - 4;
    const flapP = easeOut(subP(p, 0, 0.45));
    const letterP = easeOut(subP(p, 0.25, 0.88));

    if (letterP > 0.05) {
      drawGlow(c, cx, envY, 34 * letterP, '#fbbf24', 0.38 * letterP);
    }

    // Zadní kapsa obálky + otevírající se horní klopa
    c.fillStyle = flapP > 0.2 ? '#fed7aa' : '#475569';
    c.fillRect(envX, envY, envW, envH);

    if (flapP > 0.5) {
      c.fillStyle = '#fdba74';
      c.strokeStyle = '#fb923c';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(envX, envY);
      c.lineTo(cx, envY - 16 * subP(flapP, 0.5, 1.0));
      c.lineTo(envX + envW, envY);
      c.closePath();
      c.fill();
      c.stroke();
    }

    // Vysouvající se psaný dopis
    if (letterP > 0.02) {
      const lTop = envY + 4 - letterP * 18;
      c.fillStyle = '#fffbeb';
      c.strokeStyle = '#fbbf24';
      c.lineWidth = 1.3;
      c.fillRect(envX + 7, lTop, envW - 14, 24);
      c.strokeRect(envX + 7, lTop, envW - 14, 24);
      c.strokeStyle = '#d97706';
      c.lineWidth = 1.2;
      for (let r = 0; r < 2; r++) {
        c.beginPath();
        c.moveTo(envX + 12, lTop + 6 + r * 5);
        c.lineTo(envX + envW - 12, lTop + 6 + r * 5);
        c.stroke();
      }
    }

    // Přední sklady obálky
    c.fillStyle = p > 0.15 ? '#fff7ed' : '#cbd5e1';
    c.strokeStyle = p > 0.15 ? '#fb923c' : '#64748b';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(envX, envY);
    c.lineTo(cx, envY + envH * 0.58);
    c.lineTo(envX + envW, envY);
    c.lineTo(envX + envW, envY + envH);
    c.lineTo(envX, envY + envH);
    c.closePath();
    c.fill();
    c.stroke();

    // Zavřená klopa (p < 0.5)
    if (flapP <= 0.5) {
      c.fillStyle = '#e2e8f0';
      c.strokeStyle = '#64748b';
      c.beginPath();
      c.moveTo(envX, envY);
      c.lineTo(cx, lerp(envY + 17, envY, flapP * 2));
      c.lineTo(envX + envW, envY);
      c.closePath();
      c.fill();
      c.stroke();
    }

    if (p > 0.45) {
      const hP = subP(p, 0.45, 1.0);
      drawHeart(c, cx, envY - 22 - hP * 4, 6 * hP, '#fb7185');
      drawHeart(c, cx + 22, envY - 14 - hP * 3, 4.2 * hP, '#fde047');
    }
  } else if (mode === 'owl_shield') {
    // 🧓 Moudrá Sovička: Telefon obklopený podvodnými vykřičníky -> Ochranná křídla sovy ve tvaru štítu a zelená fajfka
    const shP = easeOut(p);
    const phW = 24;
    const phH = 38;
    const phY = cy - phH / 2 + 2;

    // Varovné phishingové trojúhelníky mizící s příchodem štítu
    if (shP < 0.75) {
      const warnA = (1 - shP * 1.3) * 0.85;
      [-40, 40].forEach((wx, idx) => {
        const wy = cy + (idx === 0 ? -6 : 6);
        c.strokeStyle = `rgba(251, 113, 133, ${Math.max(0, warnA)})`;
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(cx + wx, wy - 7);
        c.lineTo(cx + wx - 7, wy + 6);
        c.lineTo(cx + wx + 7, wy + 6);
        c.closePath();
        c.stroke();
      });
    }

    // Křídla moudré sovy rozvíjející se do ochranného štítu
    if (shP > 0.04) {
      drawGlow(c, cx, cy + 2, 32 * shP, '#2dd4bf', 0.32 * shP);
      const wingW = 14 + shP * 20;
      c.fillStyle = `rgba(45, 212, 191, ${0.18 + shP * 0.22})`;
      c.strokeStyle = '#5eead4';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(cx, phY - 6 * shP);
      c.quadraticCurveTo(cx + wingW, phY + 2, cx + wingW * 0.85, phY + phH * 0.65);
      c.quadraticCurveTo(cx + wingW * 0.4, phY + phH + 7 * shP, cx, phY + phH + 9 * shP);
      c.quadraticCurveTo(cx - wingW * 0.4, phY + phH + 7 * shP, cx - wingW * 0.85, phY + phH * 0.65);
      c.quadraticCurveTo(cx - wingW, phY + 2, cx, phY - 6 * shP);
      c.fill();
      c.stroke();
    }

    // Telefon uprostřed
    c.fillStyle = '#0f172a';
    c.strokeStyle = shP > 0.3 ? '#fde047' : '#94a3b8';
    c.lineWidth = 1.8;
    drawRoundRect(c, cx - phW / 2, phY, phW, phH, 4);
    c.fill();
    c.stroke();

    // Oči sovičky / zelená fajfka bezpečí na displeji
    if (shP < 0.4) {
      c.strokeStyle = '#fb7185';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(cx, phY + 11);
      c.lineTo(cx, phY + 21);
      c.moveTo(cx, phY + 25);
      c.lineTo(cx, phY + 27);
      c.stroke();
    } else {
      const ckP = subP(shP, 0.4, 0.95);
      c.strokeStyle = '#34d399';
      c.lineWidth = 2.6;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(cx - 6, cy + 2);
      c.lineTo(cx - 1.5, cy + 6.5);
      c.lineTo(lerp(cx - 1.5, cx + 7, ckP), lerp(cy + 6.5, cy - 3.5, ckP));
      c.stroke();
    }
  } else if (mode === 'memory_wave') {
    // 🎙️ Paměť národa: Tiché archivní cívky s prověšeným páskem -> Otáčející se zlaté cívky a živá hlasová vlna
    const playP = easeOut(p);
    const rDist = 42;
    const rY = cy + 3;
    const rot = playP > 0.02 ? wt * 2.8 + playP * 4 : 0;

    // Magnetofonový pásek: p = 0 prověšený -> p = 1 napnutý
    const sag = (1 - playP) * 7;
    c.strokeStyle = playP > 0.1 ? '#fbbf24' : 'rgba(148, 163, 184, 0.45)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(cx - rDist, rY - 13);
    c.quadraticCurveTo(cx, rY - 13 + sag, cx + rDist, rY - 13);
    c.stroke();

    // Dvě archivní cívky
    [-rDist, rDist].forEach((dx) => {
      c.fillStyle = 'rgba(15, 23, 42, 0.65)';
      c.strokeStyle = playP > 0.1 ? '#fde047' : '#94a3b8';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(cx + dx, rY, 13, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      for (let s = 0; s < 3; s++) {
        const a = rot + (s * Math.PI * 2) / 3;
        c.beginPath();
        c.moveTo(cx + dx + Math.cos(a) * 3, rY + Math.sin(a) * 3);
        c.lineTo(cx + dx + Math.cos(a) * 11, rY + Math.sin(a) * 11);
        c.stroke();
      }
      c.fillStyle = playP > 0.1 ? '#fbbf24' : '#64748b';
      c.beginPath();
      c.arc(cx + dx, rY, 3, 0, Math.PI * 2);
      c.fill();
    });

    // Hlasová stopa vyprávění uprostřed
    if (playP > 0.05) {
      for (let b = -4; b <= 4; b++) {
        const wave = Math.abs(Math.sin(wt * 3.8 + b * 0.75));
        const bh = (4 + wave * 18) * playP;
        c.fillStyle = Math.abs(b) % 2 === 0 ? '#fde047' : '#34d399';
        drawRoundRect(c, cx + b * 5.2 - 1.6, rY + 2 - bh / 2, 3.2, bh, 1.5);
        c.fill();
      }
      if (playP > 0.6) {
        drawStar(c, cx, cy - 19, 4.5 * subP(playP, 0.6, 1.0), '#fde047');
      }
    }
  } else if (mode === 'book_booth') {
    // 📚 Knihobudka: Zavřená pouliční skříňka s 1 osamělou knihou -> Otevřená dvířka, plné police barevných knih a hvězdy příběhů
    const cabW = 46;
    const cabH = 36;
    const cabX = cx - cabW / 2;
    const cabY = by - cabH - 6;
    const openP = easeOut(subP(p, 0, 0.5));
    const fillP = easeOut(subP(p, 0.18, 0.92));

    // Sloupek a dřevěná skříňka se stříškou
    c.fillStyle = '#78350f';
    c.fillRect(cx - 3, cabY + cabH, 6, 7);
    c.fillStyle = '#1e1b18';
    c.strokeStyle = '#d97706';
    c.lineWidth = 2;
    c.fillRect(cabX, cabY, cabW, cabH);
    c.strokeRect(cabX, cabY, cabW, cabH);

    // Police uprostřed
    c.strokeStyle = '#b45309';
    c.beginPath();
    c.moveTo(cabX + 2, cabY + cabH * 0.52);
    c.lineTo(cabX + cabW - 2, cabY + cabH * 0.52);
    c.stroke();

    // Stříška knihobudky
    c.fillStyle = '#f59e0b';
    c.beginPath();
    c.moveTo(cx - cabW * 0.65, cabY + 1);
    c.lineTo(cx, cabY - 12);
    c.lineTo(cx + cabW * 0.65, cabY + 1);
    c.closePath();
    c.fill();

    // 1 výchozí kniha (p = 0) + 9 přibývajících barevných hřbetů (p -> 1)
    const cols = ['#94a3b8', '#10b981', '#fb7185', '#38bdf8', '#fbbf24', '#a78bfa', '#34d399', '#f97316', '#fde047', '#ec4899'];
    for (let i = 0; i < 10; i++) {
      const bP = i === 0 ? 1 : easeOut(subP(fillP, (i - 1) * 0.08, (i - 1) * 0.08 + 0.35));
      if (bP <= 0.01) continue;
      const shelf = i < 5 ? 0 : 1;
      const idx = i % 5;
      const bx = cabX + 5 + idx * 7.4;
      const shelfBase = shelf === 0 ? cabY + cabH * 0.52 - 1 : cabY + cabH - 2;
      const bh = (11 + (i % 3) * 1.8) * bP;
      c.fillStyle = i === 0 && p < 0.2 ? '#94a3b8' : cols[i];
      c.fillRect(bx, shelfBase - bh, 5.8, bh);
    }

    // Skleněná křídla dvířek otevírající se do stran
    const doorW = (cabW / 2) * lerp(1, 0.38, openP);
    c.fillStyle = 'rgba(186, 230, 253, 0.16)';
    c.strokeStyle = 'rgba(253, 230, 138, 0.65)';
    c.lineWidth = 1.2;
    c.fillRect(cabX - openP * doorW, cabY, doorW, cabH);
    c.strokeRect(cabX - openP * doorW, cabY, doorW, cabH);
    c.fillRect(cabX + cabW - doorW + openP * doorW, cabY, doorW, cabH);
    c.strokeRect(cabX + cabW - doorW + openP * doorW, cabY, doorW, cabH);

    if (p > 0.55) {
      const sP = subP(p, 0.55, 1.0);
      drawStar(c, cx, cabY - 17, 5 * sP, '#fde047');
    }
  } else if (mode === 'parcel_share') {
    // 📦 Nevyhazujto: Dva zhasnuté sousední domky a krabice v koutě -> Rozsvícená okna a balíček letící obloukem k sousedovi
    const hY = by - 4;
    const leftH = cx - 54;
    const rightH = cx + 54;
    const arcP = easeOut(subP(p, 0.08, 0.88));

    [
      { x: leftH, lit: subP(p, 0, 0.25) },
      { x: rightH, lit: subP(p, 0.65, 1.0) }
    ].forEach((house) => {
      c.fillStyle = '#1e293b';
      c.strokeStyle = house.lit > 0.2 ? '#6ee7b7' : '#64748b';
      c.lineWidth = 1.6;
      c.fillRect(house.x - 14, hY - 20, 28, 20);
      c.strokeRect(house.x - 14, hY - 20, 28, 20);
      c.fillStyle = house.lit > 0.2 ? '#059669' : '#334155';
      c.beginPath();
      c.moveTo(house.x - 18, hY - 20);
      c.lineTo(house.x, hY - 33);
      c.lineTo(house.x + 18, hY - 20);
      c.closePath();
      c.fill();
      c.fillStyle = house.lit > 0.1 ? `rgba(253, 224, 71, ${0.25 + house.lit * 0.75})` : '#0f172a';
      c.fillRect(house.x - 5, hY - 14, 10, 9);
    });

    // Tečkovaná dráha sdílení
    if (arcP > 0.02) {
      c.save();
      c.setLineDash([3, 3]);
      c.strokeStyle = 'rgba(52, 211, 153, 0.65)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(leftH + 18, hY - 10);
      c.quadraticCurveTo(cx, hY - 46, lerp(leftH + 18, rightH - 18, arcP), hY - 10);
      c.stroke();
      c.restore();
    }

    // Balíček se stuhou letící od levého k pravému domku
    const u = arcP;
    const pxB = (1 - u) * (1 - u) * (leftH + 20) + 2 * (1 - u) * u * cx + u * u * (rightH - 20);
    const pyB = (1 - u) * (1 - u) * (hY - 8) + 2 * (1 - u) * u * (hY - 48) + u * u * (hY - 8);
    c.save();
    c.translate(pxB, pyB);
    c.rotate(Math.sin(u * Math.PI) * 0.18);
    c.fillStyle = '#fde68a';
    c.strokeStyle = '#d97706';
    c.lineWidth = 1.4;
    c.fillRect(-7, -6, 14, 12);
    c.strokeRect(-7, -6, 14, 12);
    c.fillStyle = '#10b981';
    c.fillRect(-1.8, -6, 3.6, 12);
    c.restore();

    if (p > 0.7) {
      drawHeart(c, cx, hY - 34, 5.5 * subP(p, 0.7, 1.0), '#fde047');
    }
  } else if (mode === 'eco_cleanup') {
    // 🧤 Trash Hero / Ukliďme Česko: Zřetelné odpadky na holé pěšině -> Čistá rozkvetlá louka s vlčími máky, chrpami a motýlkem
    const groundY = by - 3;
    const trashFade = 1 - easeOut(subP(p, 0, 0.52));
    const bloomP = easeOut(subP(p, 0.12, 0.96));

    // Pěšina
    c.strokeStyle = bloomP > 0.25 ? 'rgba(52, 211, 153, 0.5)' : 'rgba(148, 163, 184, 0.35)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 64, groundY);
    c.quadraticCurveTo(cx, groundY - 2, cx + 64, groundY);
    c.stroke();

    if (trashFade > 0.02) {
      c.save();
      c.globalAlpha = trashFade;
      // 1. Nakloněná zmačkaná plechovka vlevo
      c.save();
      c.translate(cx - 40, groundY - 6);
      c.rotate(-0.22);
      c.fillStyle = '#94a3b8';
      c.strokeStyle = '#e2e8f0';
      c.lineWidth = 1.2;
      drawRoundRect(c, -8, -5, 16, 10, 2);
      c.fill();
      c.stroke();
      c.strokeStyle = '#475569';
      c.beginPath();
      c.moveTo(-2, -5);
      c.lineTo(-2, 5);
      c.stroke();
      c.restore();

      // 2. Zmuchlaný obal uprostřed
      c.fillStyle = '#cbd5e1';
      c.strokeStyle = '#64748b';
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(cx - 8, groundY - 1);
      c.lineTo(cx - 4, groundY - 11);
      c.lineTo(cx + 3, groundY - 8);
      c.lineTo(cx + 9, groundY - 12);
      c.lineTo(cx + 11, groundY - 2);
      c.closePath();
      c.fill();
      c.stroke();

      // 3. Odhozená plastová láhev s hrdlem vpravo
      c.save();
      c.translate(cx + 36, groundY - 5);
      c.rotate(0.18);
      c.fillStyle = 'rgba(148, 163, 184, 0.38)';
      c.strokeStyle = '#cbd5e1';
      c.lineWidth = 1.3;
      drawRoundRect(c, -9, -4.5, 16, 9, 3);
      c.fill();
      c.stroke();
      c.fillStyle = '#fb7185';
      c.fillRect(7, -2.5, 4, 5);
      c.restore();
      c.restore();
    }

    if (bloomP > 0.02) {
      // Stébla svěží trávy
      c.strokeStyle = '#10b981';
      c.lineWidth = 1.6;
      for (let g = -6; g <= 6; g++) {
        const gxB = cx + g * 10;
        const gh = (7 + (Math.abs(g) % 3) * 4) * bloomP;
        c.beginPath();
        c.moveTo(gxB, groundY);
        c.quadraticCurveTo(gxB + Math.sin(wt * 2 + g) * 2, groundY - gh * 0.6, gxB + (g % 2 === 0 ? 2 : -2), groundY - gh);
        c.stroke();
      }
      // 5 lučních květů (vlčí máky, chrpy, kopretina)
      const fls = [
        { x: cx - 48, h: 20, col: '#f43f5e', cen: '#1e293b' },
        { x: cx - 24, h: 26, col: '#38bdf8', cen: '#fde047' },
        { x: cx, h: 30, col: '#ffffff', cen: '#f59e0b' },
        { x: cx + 24, h: 25, col: '#f43f5e', cen: '#fde047' },
        { x: cx + 48, h: 21, col: '#38bdf8', cen: '#fde047' }
      ];
      fls.forEach((f, idx) => {
        const fP = easeOut(subP(bloomP, idx * 0.08, idx * 0.08 + 0.65));
        if (fP <= 0.02) return;
        const sway = Math.sin(wt * 2.2 + idx) * 2;
        const fy = groundY - f.h * fP;
        c.strokeStyle = '#34d399';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(f.x, groundY);
        c.quadraticCurveTo(f.x + sway * 0.5, groundY - f.h * 0.5 * fP, f.x + sway, fy);
        c.stroke();
        drawFlower(c, f.x + sway, fy, 5.8 * fP, f.col, f.cen);
      });

      if (bloomP > 0.65) {
        drawBird(c, cx + 14 + Math.sin(wt * 2.5) * 4, groundY - 34, Math.sin(wt * 6), 5.5 * subP(bloomP, 0.65, 1.0), '#fde047');
      }
    }
  } else if (mode === 'phone_recycle') {
    // 📱 Remobil: Prasklý odložený mobil -> Recyklační proud mědi a zlata měnící se v charitativní minci a lístek
    const phX = cx - 28;
    const phY = cy + 2;
    const coinX = cx + 28;
    const recP = easeOut(p);

    // Starý telefon vlevo
    c.fillStyle = '#1e293b';
    c.strokeStyle = recP > 0.2 ? '#34d399' : '#64748b';
    c.lineWidth = 1.8;
    drawRoundRect(c, phX - 12, phY - 19, 24, 38, 4);
    c.fill();
    c.stroke();

    // Prasklina na displeji (p = 0) mizící s recyklací
    if (recP < 0.7) {
      c.strokeStyle = `rgba(148, 163, 184, ${(1 - recP * 1.3) * 0.75})`;
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(phX - 8, phY - 10);
      c.lineTo(phX + 1, phY - 2);
      c.lineTo(phX - 3, phY + 4);
      c.lineTo(phX + 7, phY + 11);
      c.stroke();
    }

    // Recyklační oblouk částic mědi a zlata do mince a zeleného lístku vpravo
    if (recP > 0.04) {
      c.strokeStyle = 'rgba(52, 211, 153, 0.55)';
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(phX + 14, phY - 8);
      c.quadraticCurveTo(cx, phY - 26, lerp(phX + 14, coinX - 10, recP), phY - 6);
      c.stroke();

      for (let k = 0; k < 5; k++) {
        const u = ((recP * 1.4 + k * 0.2 + wt * 0.35) % 1) * Math.min(1, recP * 1.2);
        const mx = (1 - u) * (1 - u) * (phX + 12) + 2 * (1 - u) * u * cx + u * u * coinX;
        const my = (1 - u) * (1 - u) * phY + 2 * (1 - u) * u * (phY - 28) + u * u * phY;
        c.fillStyle = k % 2 === 0 ? '#fbbf24' : '#fb923c';
        c.beginPath();
        c.arc(mx, my, 2.2, 0, Math.PI * 2);
        c.fill();
      }

      const cP = easeOut(subP(recP, 0.35, 1.0));
      if (cP > 0.05) {
        drawGlow(c, coinX, phY + 2, 22 * cP, '#fde047', 0.35 * cP);
        // Zelený lístek vyrůstající za mincí
        c.fillStyle = '#34d399';
        c.beginPath();
        c.ellipse(coinX + 6 * cP, phY - 12 * cP, 7 * cP, 3.6 * cP, -0.6, 0, Math.PI * 2);
        c.fill();
        // Zlatá charitativní mince
        c.fillStyle = '#fde047';
        c.strokeStyle = '#d97706';
        c.lineWidth = 1.6;
        c.beginPath();
        c.arc(coinX, phY + 3, 10 * cP, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        drawHeart(c, coinX, phY + 2, 4.2 * cP, '#d97706');
      }
    }
  } else if (mode === 'compost_sprout') {
    // 🌱 Kompost Mapko: Kopeček živé hlíny se slupkami a semínkem -> Kořínky živin a vyrůstající zlatá slunečnice
    const moundY = by + 1;
    const growP = easeOut(p);

    c.fillStyle = '#5c2d0c';
    c.strokeStyle = '#92400e';
    c.lineWidth = 1.3;
    c.beginPath();
    c.ellipse(cx, moundY, 46, 13, 0, Math.PI, Math.PI * 2);
    c.fill();
    c.stroke();

    // Organické slupky a lístek (p = 0) měnící se ve zlaté živiny a kořínky v půdě
    if (growP < 0.5) {
      const orgA = 1 - growP * 1.85;
      c.strokeStyle = `rgba(251, 146, 60, ${0.85 * orgA})`;
      c.lineWidth = 2.2;
      c.lineCap = 'round';
      c.beginPath();
      c.arc(cx - 15, moundY - 7, 5, 0.2, 2.5);
      c.stroke();
      c.strokeStyle = `rgba(244, 63, 94, ${0.78 * orgA})`;
      c.beginPath();
      c.arc(cx + 14, moundY - 6, 4.5, 0.7, 2.9);
      c.stroke();
      // Spící zlaté semínko v hlíně (žádná rušivá svislá čárka při p = 0!)
      c.fillStyle = `rgba(253, 224, 71, ${0.75 + prep * 0.25})`;
      c.beginPath();
      c.ellipse(cx, moundY - 7, 3.2, 2.0, -0.2, 0, Math.PI * 2);
      c.fill();
    } else {
      c.strokeStyle = 'rgba(253, 224, 71, 0.52)';
      c.lineWidth = 1.3;
      [-15, 0, 15].forEach((rx) => {
        c.beginPath();
        c.moveTo(cx, moundY - 9);
        c.quadraticCurveTo(cx + rx * 0.5, moundY - 5, cx + rx, moundY - 2);
        c.stroke();
      });
    }

    // Klíčící stonek, listy a slunečnice (vyrůstá plynule z nuly po zahájení!)
    if (growP > 0.02) {
      const stemH = growP * 35;
      const sway = Math.sin(wt * 2) * 2 * growP;
      c.strokeStyle = '#4ade80';
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx, moundY - 9);
      c.quadraticCurveTo(cx + sway * 0.5, moundY - 9 - stemH * 0.5, cx + sway, moundY - 9 - stemH);
      c.stroke();

      if (growP > 0.18) {
        const lP = subP(growP, 0.18, 0.75);
        c.fillStyle = '#22c55e';
        c.beginPath();
        c.ellipse(cx - 8.5 * lP, moundY - 9 - stemH * 0.52, 8 * lP, 3.8 * lP, -0.4, 0, Math.PI * 2);
        c.ellipse(cx + 8.5 * lP, moundY - 9 - stemH * 0.52, 8 * lP, 3.8 * lP, 0.4, 0, Math.PI * 2);
        c.fill();
      }

      if (growP > 0.48) {
        const fP = easeOut(subP(growP, 0.48, 1.0));
        const fx = cx + sway;
        const fy = moundY - 9 - stemH;
        drawGlow(c, fx, fy, 18 * fP, '#fde047', 0.32 * fP);
        c.fillStyle = '#fde047';
        for (let k = 0; k < 10; k++) {
          const a = (k * Math.PI * 2) / 10 + wt * 0.3;
          c.beginPath();
          c.ellipse(fx + Math.cos(a) * 6.8 * fP, fy + Math.sin(a) * 6.8 * fP, 4.2 * fP, 2.1 * fP, a, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = '#78350f';
        c.beginPath();
        c.arc(fx, fy, 4.2 * fP, 0, Math.PI * 2);
        c.fill();
      }
    }
  } else if (mode === 'forest_bloom') {
    // 🌳 Sázíme budoucnost: Drobná sazenička na holině mezi pařezy -> Mohutný rozvětvený smaragdový dub
    const groundY = by - 2;
    const treeP = easeOut(p);

    // Dva malé pařezy po stranách na holině
    c.fillStyle = '#5c2d0c';
    c.fillRect(cx - 52, groundY - 5, 9, 5);
    c.fillRect(cx + 44, groundY - 5, 9, 5);

    // Kmen a větve rostoucí ze sazeničky
    const trunkH = lerp(12, 30, treeP);
    c.strokeStyle = '#78350f';
    c.lineWidth = lerp(2.2, 5.5, treeP);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx, groundY);
    c.lineTo(cx, groundY - trunkH);
    c.stroke();

    if (treeP < 0.25) {
      // Dva malé lístky sazeničky (p = 0)
      c.fillStyle = '#4ade80';
      c.beginPath();
      c.ellipse(cx - 5, groundY - trunkH, 5, 2.5, -0.4, 0, Math.PI * 2);
      c.ellipse(cx + 5, groundY - trunkH, 5, 2.5, 0.4, 0, Math.PI * 2);
      c.fill();
    } else {
      const canP = easeOut(subP(treeP, 0.2, 1.0));
      c.lineWidth = 2.6 * canP;
      c.beginPath();
      c.moveTo(cx, groundY - trunkH * 0.65);
      c.lineTo(cx - 14 * canP, groundY - trunkH - 4 * canP);
      c.moveTo(cx, groundY - trunkH * 0.72);
      c.lineTo(cx + 14 * canP, groundY - trunkH - 4 * canP);
      c.stroke();

      const clusters = [
        [0, -10, 16, '#059669'],
        [-15, -4, 12.5, '#10b981'],
        [15, -4, 12.5, '#10b981'],
        [-9, -15, 12, '#34d399'],
        [9, -15, 12, '#34d399'],
        [0, -19, 11, '#6ee7b7']
      ];
      clusters.forEach(([dx, dy, r, col]) => {
        c.fillStyle = col;
        c.beginPath();
        c.arc(cx + dx * canP, groundY - trunkH + dy * canP, r * canP, 0, Math.PI * 2);
        c.fill();
      });
    }
  } else if (mode === 'fruit_tree') {
    // 🍎 Na ovoce: Holé jarní větve a prázdný špendlík -> Zelená koruna s 6 červenými jablky a zlatým mapovým špendlíkem
    const groundY = by - 2;
    const tx = cx - 10;
    const leafP = easeOut(subP(p, 0.02, 0.55));
    const appleP = easeOut(subP(p, 0.35, 0.98));

    // Kmen a holé větve (viditelné při p = 0)
    c.strokeStyle = '#78350f';
    c.lineWidth = 4.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(tx, groundY);
    c.lineTo(tx, groundY - 24);
    c.stroke();
    c.lineWidth = 2.2;
    [
      [-14, -36], [0, -40], [14, -36], [-18, -28], [18, -28]
    ].forEach(([bx, byOff]) => {
      c.beginPath();
      c.moveTo(tx, groundY - 22);
      c.lineTo(tx + bx, groundY + byOff);
      c.stroke();
    });

    if (leafP > 0.02) {
      [
        [0, -34, 15, '#10b981'],
        [-13, -29, 12, '#059669'],
        [13, -29, 12, '#059669'],
        [0, -41, 11, '#34d399']
      ].forEach(([dx, dy, r, col]) => {
        c.fillStyle = col;
        c.beginPath();
        c.arc(tx + dx * leafP, groundY + dy, r * leafP, 0, Math.PI * 2);
        c.fill();
      });
    }

    if (appleP > 0.05) {
      [
        [-10, -28], [10, -28], [0, -39], [-6, -35], [7, -34], [0, -26]
      ].forEach(([ax, ay]) => {
        c.fillStyle = '#f43f5e';
        c.beginPath();
        c.arc(tx + ax, groundY + ay, 3.3 * appleP, 0, Math.PI * 2);
        c.fill();
      });
    }

    // Mapový špendlík Na ovoce vpravo
    const pinX = cx + 38;
    const pinY = cy + 6;
    c.fillStyle = appleP > 0.2 ? '#fbbf24' : 'rgba(148, 163, 184, 0.35)';
    c.strokeStyle = appleP > 0.2 ? '#fde047' : '#64748b';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(pinX, pinY - 8, 7.5, Math.PI * 0.85, Math.PI * 2.15);
    c.lineTo(pinX, pinY + 5);
    c.closePath();
    c.fill();
    c.stroke();
  } else if (mode === 'butterfly_lens') {
    // 🦋 iNaturalist: Kulatá přírodovědecká lupa nad složenou siluetou -> Zaostřený otakárek s prokreslenými křídly a ostruhami
    const lensP = easeOut(p);
    const flap = lerp(0.24, 0.94 + Math.sin(wt * 3.4) * 0.08, lensP);
    const lx = cx - 4;
    const ly = cy + 1;
    const lr = 26;

    // Rukojeť a mosazno-smaragdová obroučka lupy
    c.strokeStyle = '#b45309';
    c.lineWidth = 4.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(lx + 18.5, ly + 18.5);
    c.lineTo(lx + 31, ly + 29);
    c.stroke();

    c.fillStyle = lensP > 0.2 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.07)';
    c.strokeStyle = lensP > 0.2 ? '#34d399' : '#94a3b8';
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(lx, ly, lr, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Ostřicí značky kolem lupy při určení druhu
    if (lensP > 0.25) {
      const fA = subP(lensP, 0.25, 0.85);
      c.strokeStyle = `rgba(110, 231, 183, ${0.7 * fA})`;
      c.lineWidth = 1.5;
      [-1, 1].forEach((dx) => {
        [-1, 1].forEach((dy) => {
          const bx = lx + dx * (lr + 5);
          const byL = ly + dy * (lr - 4);
          c.beginPath();
          c.moveTo(bx, byL - dy * 5);
          c.lineTo(bx, byL);
          c.lineTo(bx - dx * 5, byL);
          c.stroke();
        });
      });
    }

    // Motýl otakárek (špičatá přední křídla + zadní křídla s ostruhou a červenomodrými očky)
    [-1, 1].forEach((dir) => {
      const wSpan = 19 * flap;
      // Zadní křídlo s ostruhou
      c.fillStyle = lensP > 0.15 ? '#fde047' : '#64748b';
      c.strokeStyle = lensP > 0.15 ? '#1e1b4b' : '#475569';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(lx + dir * 1.2, ly + 1);
      c.bezierCurveTo(lx + dir * wSpan * 0.78, ly + 1, lx + dir * wSpan * 0.82, ly + 13, lx + dir * wSpan * 0.45, ly + 15);
      c.lineTo(lx + dir * wSpan * 0.52, ly + 19); // Ostruha otakárka
      c.lineTo(lx + dir * wSpan * 0.3, ly + 15);
      c.quadraticCurveTo(lx + dir * 2, ly + 12, lx + dir * 1.2, ly + 4);
      c.closePath();
      c.fill();
      c.stroke();

      // Přední vznešeně protažené křídlo
      c.fillStyle = lensP > 0.15 ? '#facc15' : '#94a3b8';
      c.beginPath();
      c.moveTo(lx + dir * 1.2, ly - 3);
      c.bezierCurveTo(lx + dir * wSpan * 0.45, ly - 16, lx + dir * wSpan * 1.08, ly - 15, lx + dir * wSpan, ly - 3);
      c.bezierCurveTo(lx + dir * wSpan * 0.9, ly + 4, lx + dir * wSpan * 0.4, ly + 4, lx + dir * 1.2, ly + 1);
      c.closePath();
      c.fill();
      c.stroke();

      // Kresba oček na křídlech při zaostření
      if (lensP > 0.3) {
        c.fillStyle = '#38bdf8';
        c.beginPath();
        c.arc(lx + dir * wSpan * 0.55, ly + 9, 1.9 * lensP, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#f43f5e';
        c.beginPath();
        c.arc(lx + dir * wSpan * 0.35, ly + 11.5, 1.6 * lensP, 0, Math.PI * 2);
        c.fill();
      }
    });

    // Tělíčko a tykadla
    c.fillStyle = '#0f172a';
    drawRoundRect(c, lx - 1.4, ly - 9, 2.8, 19, 1.4);
    c.fill();
    c.strokeStyle = '#fde68a';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(lx, ly - 9);
    c.quadraticCurveTo(lx - 5, ly - 16, lx - 8, ly - 15);
    c.moveTo(lx, ly - 9);
    c.quadraticCurveTo(lx + 5, ly - 16, lx + 8, ly - 15);
    c.stroke();
  } else if (mode === 'campfire_group') {
    // ⛺ Hnutí Brontosaurus: Nezapálené dříví v kamenném kruhu pod tmavými smrky -> Plápolající táborák ozařující les a jiskry
    const fireY = by - 5;
    const fireP = easeOut(p);

    // Siluety smrků po stranách (osvětlené táborákem při p -> 1)
    [-58, -38, 38, 58].forEach((tx, idx) => {
      const th = idx % 2 === 0 ? 32 : 26;
      c.fillStyle = fireP > 0.2 ? '#065f46' : '#0b2219';
      c.beginPath();
      c.moveTo(cx + tx, fireY - th);
      c.lineTo(cx + tx - 11, fireY);
      c.lineTo(cx + tx + 11, fireY);
      c.closePath();
      c.fill();
    });

    if (fireP > 0.03) {
      drawGlow(c, cx, fireY - 14, 42 * fireP, '#fb923c', 0.45 * fireP);
      const flick = Math.sin(wt * 6.5) * 3;
      const fh = 26 * fireP;
      // Vnější oranžový, střední jantarový a vnitřní krémový plamen
      [
        ['#ea580c', 14, fh],
        ['#fbbf24', 10, fh * 0.78],
        ['#fef08a', 6, fh * 0.5]
      ].forEach(([col, rw, rh], idx) => {
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(cx - rw, fireY - 4);
        c.quadraticCurveTo(cx - rw * 0.5, fireY - rh * 0.7, cx + flick * (0.4 + idx * 0.2), fireY - 4 - rh);
        c.quadraticCurveTo(cx + rw * 0.5, fireY - rh * 0.7, cx + rw, fireY - 4);
        c.closePath();
        c.fill();
      });

      // Stoupající jiskry
      for (let e = 0; e < 5; e++) {
        const eu = ((wt * 0.8 + e * 0.22) % 1) * fireP;
        c.fillStyle = '#fde047';
        c.beginPath();
        c.arc(cx + Math.sin(e * 2.3 + wt * 2) * 12, fireY - 12 - eu * 26, 1.4, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Zkřížená polena a kamenný kruh
    c.strokeStyle = '#78350f';
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - 16, fireY - 1);
    c.lineTo(cx + 16, fireY - 7);
    c.moveTo(cx + 16, fireY - 1);
    c.lineTo(cx - 16, fireY - 7);
    c.stroke();

    for (let k = -3; k <= 3; k++) {
      c.fillStyle = '#64748b';
      c.beginPath();
      c.ellipse(cx + k * 6.2, fireY + 1, 3.4, 2.2, 0, 0, Math.PI * 2);
      c.fill();
    }
  } else if (mode === 'globe_bridge') {
    // 🎒 INEX-SDA: Planeta s oddělenými břehy -> Visutý světelný most propojující kontinenty a barevné lucerny
    const brP = easeOut(p);
    const glR = 20;
    const glY = cy + 3;

    // Planeta Země s poledníky
    c.strokeStyle = brP > 0.2 ? '#38bdf8' : 'rgba(148, 163, 184, 0.45)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(cx, glY, glR, 0, Math.PI * 2);
    c.ellipse(cx, glY, 9, glR, 0, 0, Math.PI * 2);
    c.moveTo(cx - glR, glY);
    c.lineTo(cx + glR, glY);
    c.stroke();

    // Dva břehy po stranách
    const leftS = cx - 54;
    const rightS = cx + 54;
    c.fillStyle = '#065f46';
    c.fillRect(leftS - 8, by - 9, 16, 6);
    c.fillRect(rightS - 8, by - 9, 16, 6);

    // Visutý most rozepínající se přes planetu
    if (brP > 0.03) {
      const endBridgeX = lerp(leftS, rightS, brP);
      c.strokeStyle = '#fde047';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(leftS, by - 9);
      c.quadraticCurveTo(lerp(leftS, cx, brP), cy - 26, endBridgeX, by - 9);
      c.stroke();

      const lanternCols = ['#fb7185', '#fbbf24', '#34d399', '#38bdf8', '#c084fc'];
      lanternCols.forEach((col, i) => {
        const u = (i + 1) / 6;
        if (u > brP) return;
        const lx = lerp(leftS, rightS, u);
        const ly = (1 - u) * (1 - u) * (by - 9) + 2 * (1 - u) * u * (cy - 26) + u * u * (by - 9);
        drawGlow(c, lx, ly + 3, 9, col, 0.45);
        c.fillStyle = col;
        c.beginPath();
        c.arc(lx, ly + 3, 2.8, 0, Math.PI * 2);
        c.fill();
      });
    }
  } else if (mode === 'water_spring') {
    // 💧 eSTUDÁNKY: Lesní studánka pod šindelovou stříškou zanesená listím -> Křišťálový pramen, kruhy na vodě a kapradí
    const cleanP = easeOut(p);
    const spP = easeOut(subP(cleanP, 0.05, 0.94));
    const poolY = by - 13;
    const ridgeY = cy - 25.5;
    const eaveY = cy - 6.5;
    const postHalfX = 36.5;
    const eaveHalfX = 46.5;

    const drawMossTuft = (mx, my, scaleM, lit) => {
      c.save();
      c.fillStyle = lit ? '#16a34a' : '#14532d';
      [
        [-2.3, 0.4, 2.5, 1.4],
        [0, -0.3, 2.9, 1.65],
        [2.3, 0.35, 2.4, 1.35]
      ].forEach(([ox, oy, rx, ry]) => {
        c.beginPath();
        c.ellipse(mx + ox * scaleM, my + oy * scaleM, rx * scaleM, ry * scaleM, 0, 0, Math.PI * 2);
        c.fill();
      });
      if (lit) {
        c.fillStyle = '#4ade80';
        [
          [-1.3, -0.2, 1.6, 0.85],
          [1.1, -0.35, 1.8, 0.95]
        ].forEach(([ox, oy, rx, ry]) => {
          c.beginPath();
          c.ellipse(mx + ox * scaleM, my + oy * scaleM, rx * scaleM, ry * scaleM, 0, 0, Math.PI * 2);
          c.fill();
        });
      }
      c.restore();
    };

    // Pomocník pro vykreslení pravého lesního kapradí (zakřivený stonek s 5–6 páry lístků pinnae plynule se zužujícími až ke špičce)
    const drawFernFrond = (dir, baseX, baseY, spanF, riseF, ctrlXF, ctrlYF, pairs, unfurlF, stemCol, leafColA, leafColB, swayX) => {
      const x0 = baseX;
      const y0 = baseY;
      const x1 = baseX + dir * ctrlXF * (0.64 + 0.36 * unfurlF) + swayX * 0.45;
      const y1 = baseY - ctrlYF * (0.58 + 0.42 * unfurlF);
      const x2 = baseX + dir * spanF * (0.52 + 0.48 * unfurlF) + swayX;
      const y2 = baseY - riseF * (0.52 + 0.48 * unfurlF);

      c.save();
      for (let k = 0; k < pairs; k++) {
        const tPair = k / Math.max(1, pairs - 1);
        const u = 0.14 + tPair * 0.76;
        const mu = 1 - u;
        const bx = mu * mu * x0 + 2 * mu * u * x1 + u * u * x2;
        const byPt = mu * mu * y0 + 2 * mu * u * y1 + u * u * y2;
        const dx = 2 * mu * (x1 - x0) + 2 * u * (x2 - x1);
        const dy = 2 * mu * (y1 - y0) + 2 * u * (y2 - y1);
        const len = Math.hypot(dx, dy) || 1;
        const tx = dx / len;
        const ty = dy / len;
        const nx = -ty * dir;
        const ny = tx * dir;

        const env = Math.sin(Math.PI * (0.18 + 0.72 * tPair)) * (1 - 0.24 * tPair);
        const pLen = 10.2 * env * (0.62 + 0.38 * unfurlF);
        const pWid = 2.3 * env * (0.68 + 0.32 * unfurlF);

        [-1, 1].forEach((side) => {
          const vx = tx * 0.58 + nx * side * 0.82;
          const vy = ty * 0.58 + ny * side * 0.82;
          const pxN = -vy;
          const pyN = vx;
          const tipX = bx + vx * pLen;
          const tipY = byPt + vy * pLen;

          c.fillStyle = side === -1 ? leafColA : leafColB;
          c.beginPath();
          c.moveTo(bx, byPt);
          c.quadraticCurveTo(
            bx + vx * pLen * 0.45 + pxN * pWid,
            byPt + vy * pLen * 0.45 + pyN * pWid,
            tipX,
            tipY
          );
          c.quadraticCurveTo(
            bx + vx * pLen * 0.45 - pxN * pWid,
            byPt + vy * pLen * 0.45 - pyN * pWid,
            bx,
            byPt
          );
          c.closePath();
          c.fill();
        });
      }

      // Koncový vrcholový lístek plynule navazující na poslední pár pinnae
      const endDx = x2 - x1;
      const endDy = y2 - y1;
      const endLen = Math.hypot(endDx, endDy) || 1;
      const etx = endDx / endLen;
      const ety = endDy / endLen;
      const tipExt = 5.4 * (0.64 + 0.36 * unfurlF);
      c.fillStyle = leafColA;
      c.beginPath();
      c.moveTo(x2 - etx * 1.2, y2 - ety * 1.2);
      c.quadraticCurveTo(x2 + etx * tipExt * 0.42 - ety * 1.5, y2 + ety * tipExt * 0.42 + etx * 1.5, x2 + etx * tipExt, y2 + ety * tipExt);
      c.quadraticCurveTo(x2 + etx * tipExt * 0.42 + ety * 1.5, y2 + ety * tipExt * 0.42 - etx * 1.5, x2 - etx * 1.2, y2 - ety * 1.2);
      c.closePath();
      c.fill();

      // Pružné vřeteno (stonek) kapradiny
      c.strokeStyle = stemCol;
      c.lineWidth = 1.55;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x0, y0);
      c.quadraticCurveTo(x1, y1, x2, y2);
      c.stroke();
      c.restore();
    };

    // 1. Jemné prosvětlení pod stříškou studánky (p -> 1)
    if (cleanP > 0.04) {
      const roofLight = c.createLinearGradient(cx, ridgeY + 2, cx, poolY + 4);
      roofLight.addColorStop(0, `rgba(253, 230, 138, ${(0.18 * cleanP).toFixed(3)})`);
      roofLight.addColorStop(1, 'rgba(56, 189, 248, 0)');
      c.fillStyle = roofLight;
      c.beginPath();
      c.moveTo(cx, ridgeY + 2);
      c.lineTo(cx + 45, poolY + 2);
      c.lineTo(cx - 45, poolY + 2);
      c.closePath();
      c.fill();
    }

    // 2. Pravé vícečetné lesní kapradí rozvíjející se po obou stranách studánky
    const fernUnfurl = lerp(0.5 + prep * 0.08, 1.0, cleanP);
    [-1, 1].forEach((dir) => {
      const sway = red ? 0 : Math.sin(wt * 1.9 + (dir > 0 ? 1.2 : 0)) * (1.2 + cleanP * 1.6);
      const isLit = cleanP > 0.14;
      // Spodní doprovodný vějíř kapradí (5 párů lístků)
      drawFernFrond(
        dir,
        cx + dir * 41,
        poolY + 6,
        29,
        14,
        14,
        12,
        5,
        fernUnfurl,
        isLit ? '#059669' : '#14532d',
        isLit ? '#10b981' : 'rgba(21, 128, 61, 0.72)',
        isLit ? '#047857' : 'rgba(20, 83, 45, 0.72)',
        sway * 0.7
      );
      // Hlavní vzrostlý vějíř kapradí (6 párů lístků pinnae po každé straně až ke špičce)
      drawFernFrond(
        dir,
        cx + dir * 38,
        poolY + 2,
        39,
        31,
        16,
        24,
        6,
        fernUnfurl,
        isLit ? '#34d399' : '#166534',
        isLit ? '#6ee7b7' : 'rgba(34, 197, 94, 0.62)',
        isLit ? '#10b981' : 'rgba(22, 101, 52, 0.68)',
        sway
      );
    });

    // 3. Zadní oblouk mechové kamenné obruby a vodní hladina (za sloupky stříšky pro věrnou 3D hloubku)
    for (let s = 0; s < 7; s++) {
      const a = Math.PI + (s / 6) * Math.PI;
      const kx = cx + Math.cos(a) * 39.5;
      const ky = poolY + Math.sin(a) * 10.2;
      c.fillStyle = s % 2 === 0 ? '#475569' : '#64748b';
      c.strokeStyle = 'rgba(203, 213, 225, 0.32)';
      c.lineWidth = 0.9;
      c.beginPath();
      c.ellipse(kx, ky, 6.8, 3.8, (s - 3) * 0.08, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      if (s === 1 || s === 5) {
        drawMossTuft(kx + (s === 1 ? 1.5 : -1.5), ky - 2.0, 0.9, cleanP > 0.15);
      }
    }

    // Vnitřní stín studánky + hladina (zakalená podzimní -> křišťálově tyrkysová)
    c.fillStyle = '#0f172a';
    c.beginPath();
    c.ellipse(cx, poolY + 0.5, 36.8, 9.6, 0, 0, Math.PI * 2);
    c.fill();

    const murkyGrad = c.createRadialGradient(cx, poolY, 2, cx, poolY + 1, 36);
    murkyGrad.addColorStop(0, '#332d26');
    murkyGrad.addColorStop(1, '#1c242b');
    c.fillStyle = murkyGrad;
    c.beginPath();
    c.ellipse(cx, poolY + 0.8, 35.2, 8.8, 0, 0, Math.PI * 2);
    c.fill();

    if (cleanP > 0.01) {
      c.save();
      c.globalAlpha = clamp01(cleanP);
      const clearGrad = c.createRadialGradient(cx, poolY - 1, 2, cx, poolY + 1, 36);
      clearGrad.addColorStop(0, '#bae6fd');
      clearGrad.addColorStop(0.42, '#38bdf8');
      clearGrad.addColorStop(0.82, '#0284c7');
      clearGrad.addColorStop(1, '#0369a1');
      c.fillStyle = clearGrad;
      c.beginPath();
      c.ellipse(cx, poolY + 0.8, 35.2, 8.8, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // 4. Soustředné tyrkysové kruhy na hladině
    if (cleanP <= 0.05) {
      c.strokeStyle = `rgba(148, 163, 184, ${(0.22 + prep * 0.14).toFixed(3)})`;
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(cx, poolY + 0.8, 12 + prep * 3, 2.8, 0, 0, Math.PI * 2);
      c.stroke();
    } else {
      for (let rIdx = 0; rIdx < 3; rIdx++) {
        const ph = red ? (rIdx + 0.5) / 3 : (wt * 0.52 + rIdx / 3) % 1;
        const ripRx = 6 + ph * 26 * spP;
        const ripRy = Math.max(1.2, ripRx * 0.23);
        c.strokeStyle = rIdx === 0 ? '#e0f2fe' : '#7dd3fc';
        c.save();
        c.globalAlpha = clamp01((1 - ph * 0.78) * 0.65 * spP);
        c.lineWidth = 1.25;
        c.beginPath();
        c.ellipse(cx, poolY + 0.8, ripRx, ripRy, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
    }

    // 5. Spadané podzimní listí na zakalené vodě (p = 0) odplouvající do stran (p -> 1)
    if (cleanP < 0.72) {
      const leafA = clamp01(1 - cleanP * 1.42);
      const autumnLeaves = [
        { x: -18, y: -1.8, rot: -0.35, col: '#b45309', s: 5.4 },
        { x: -6, y: 2.2, rot: 0.42, col: '#d97706', s: 5.8 },
        { x: 5, y: -2.4, rot: -0.18, col: '#92400e', s: 5.0 },
        { x: 14, y: 1.8, rot: 0.58, col: '#ca8a04', s: 5.5 },
        { x: 22, y: -1.2, rot: -0.48, col: '#c2410c', s: 4.8 }
      ];
      c.save();
      c.globalAlpha = leafA;
      autumnLeaves.forEach((lf) => {
        const drift = 1 + cleanP * 0.92;
        const lx = cx + lf.x * drift;
        const ly = poolY + 0.8 + lf.y;
        c.save();
        c.translate(lx, ly);
        c.rotate(lf.rot + cleanP * (lf.x < 0 ? -0.4 : 0.4));
        c.fillStyle = lf.col;
        c.beginPath();
        c.moveTo(-lf.s, 0);
        c.quadraticCurveTo(0, -lf.s * 0.56, lf.s, 0);
        c.quadraticCurveTo(0, lf.s * 0.56, -lf.s, 0);
        c.closePath();
        c.fill();
        c.strokeStyle = 'rgba(254, 243, 199, 0.38)';
        c.lineWidth = 0.75;
        c.beginPath();
        c.moveTo(-lf.s * 0.75, 0);
        c.lineTo(lf.s * 0.75, 0);
        c.stroke();
        c.restore();
      });
      c.restore();
    }

    // 6. Dřevěná stříška české lesní studánky (dva trámové sloupky na břehu studánky, vzpěry a šindelový štít)
    const postFill = cleanP > 0.15 ? '#92400e' : '#3f2d20';
    const postStroke = cleanP > 0.15 ? '#fbbf24' : 'rgba(148, 163, 184, 0.36)';
    c.save();
    // Vzpěry (tesařské pásky) a vodorovný vazný trám
    c.strokeStyle = cleanP > 0.15 ? '#b45309' : '#4a3525';
    c.lineWidth = 2.3;
    c.lineCap = 'round';
    [-1, 1].forEach((dir) => {
      c.beginPath();
      c.moveTo(cx + dir * postHalfX, eaveY + 9);
      c.lineTo(cx + dir * (postHalfX - 8.5), eaveY + 1.5);
      c.stroke();
    });
    c.fillStyle = cleanP > 0.15 ? '#78350f' : '#332419';
    c.fillRect(cx - postHalfX - 2, eaveY - 0.5, postHalfX * 2 + 4, 3);

    // Dva dřevěné sloupky ukotvené na bočním břehu studánky
    [-1, 1].forEach((dir) => {
      const px = cx + dir * postHalfX - 2.3;
      c.fillStyle = postFill;
      c.strokeStyle = postStroke;
      c.lineWidth = 0.95;
      drawRoundRect(c, px, eaveY, 4.6, poolY + 1.5 - eaveY, 1.2);
      c.fill();
      c.stroke();
    });

    // Vnitřní stín štítu stříšky
    c.fillStyle = cleanP > 0.15 ? '#2b1b10' : '#17120e';
    c.beginPath();
    c.moveTo(cx - eaveHalfX + 3, eaveY + 3);
    c.lineTo(cx, ridgeY + 2);
    c.lineTo(cx + eaveHalfX - 3, eaveY + 3);
    c.closePath();
    c.fill();

    // Šindelová sedlová stříška
    const roofGrad = c.createLinearGradient(cx, ridgeY - 2, cx, eaveY + 6);
    if (cleanP > 0.15) {
      roofGrad.addColorStop(0, '#d97706');
      roofGrad.addColorStop(1, '#92400e');
    } else {
      roofGrad.addColorStop(0, '#573d28');
      roofGrad.addColorStop(1, '#3b291b');
    }
    c.fillStyle = roofGrad;
    c.strokeStyle = cleanP > 0.15 ? '#fde68a' : 'rgba(148, 163, 184, 0.45)';
    c.lineWidth = 1.35;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(cx - eaveHalfX, eaveY + 3.5);
    c.lineTo(cx, ridgeY - 1.5);
    c.lineTo(cx + eaveHalfX, eaveY + 3.5);
    c.lineTo(cx + eaveHalfX - 2.8, eaveY + 6.5);
    c.lineTo(cx, ridgeY + 3.5);
    c.lineTo(cx - eaveHalfX + 2.8, eaveY + 6.5);
    c.closePath();
    c.fill();
    c.stroke();

    // Jemná kresba dřevěných šindelů a vyřezávaná špička ve štítu
    c.strokeStyle = cleanP > 0.15 ? 'rgba(254, 243, 199, 0.34)' : 'rgba(203, 213, 225, 0.16)';
    c.lineWidth = 1;
    [-1, 1].forEach((dir) => {
      for (let sh = 1; sh <= 3; sh++) {
        const u = sh / 4;
        const sx = lerp(cx, cx + dir * eaveHalfX, u);
        const sy = lerp(ridgeY - 1, eaveY + 3.5, u);
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(sx - dir * 2, sy + 2.8);
        c.stroke();
      }
    });
    c.fillStyle = cleanP > 0.15 ? '#fde68a' : '#78716c';
    c.beginPath();
    c.moveTo(cx, ridgeY - 4.5);
    c.lineTo(cx + 2.2, ridgeY - 1.5);
    c.lineTo(cx, ridgeY + 1);
    c.lineTo(cx - 2.2, ridgeY - 1.5);
    c.closePath();
    c.fill();
    c.restore();

    // 7. Vyšší 3obloukový jiskřící křišťálový pramen a stoupající kapky vody (p -> 1)
    if (spP > 0.02) {
      drawGlow(c, cx, poolY - 13, Math.max(0.5, 31 * spP), '#38bdf8', 0.42 * spP);
      const shimmer = red ? 0 : Math.sin(wt * 4.2) * 1.3;

      // Jemný vodní závoj u vývěru pramene
      c.save();
      const veilGrad = c.createLinearGradient(cx, poolY - 26 * spP, cx, poolY + 1);
      veilGrad.addColorStop(0, `rgba(224, 242, 254, ${(0.22 * spP).toFixed(3)})`);
      veilGrad.addColorStop(1, `rgba(125, 211, 252, ${(0.42 * spP).toFixed(3)})`);
      c.fillStyle = veilGrad;
      c.beginPath();
      c.moveTo(cx - 4.5 * spP, poolY + 1);
      c.quadraticCurveTo(cx + shimmer * 0.45, poolY - 27.5 * spP, cx + 4.5 * spP, poolY + 1);
      c.closePath();
      c.fill();
      c.restore();

      // Dva boční parabolické křišťálové oblouky pramene dopadající zpět do tůňky
      [-1, 1].forEach((dir) => {
        c.save();
        c.strokeStyle = '#7dd3fc';
        c.shadowColor = '#38bdf8';
        c.shadowBlur = 6 * spP;
        c.lineWidth = 2.15;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(cx + dir * 1.4, poolY + 0.8);
        c.quadraticCurveTo(
          cx + dir * (12 * spP) + shimmer * 0.25,
          poolY - 37 * spP,
          cx + dir * (23.5 * spP),
          poolY + 1.0
        );
        c.stroke();
        c.restore();
      });

      // Hlavní vyšší středový křišťálový výtrysk pod štítem studánky (čistý jeden proud bez dvojité vidličky)
      const crestX = cx + shimmer * 0.65;
      const crestY = poolY - 27.5 * spP;
      c.save();
      c.strokeStyle = '#e0f2fe';
      c.shadowColor = '#bae6fd';
      c.shadowBlur = 8 * spP;
      c.lineWidth = 2.6;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx, poolY + 1.0);
      c.quadraticCurveTo(cx - shimmer * 0.35, poolY - 15 * spP, crestX, crestY);
      c.stroke();
      c.restore();

      // Stoupající perlivé kapky vody kolem koruny pramene
      const drops = [
        { dx: -13, peak: 20, ph: 0.1 },
        { dx: -5.5, peak: 25, ph: 0.45 },
        { dx: 0, peak: 29.5, ph: 0.78 },
        { dx: 5.8, peak: 24.5, ph: 0.28 },
        { dx: 13.5, peak: 19.5, ph: 0.62 },
        { dx: -19.5, peak: 11.5, ph: 0.85 },
        { dx: 19.5, peak: 11.5, ph: 0.36 }
      ];
      drops.forEach((dr, idx) => {
        const du = red ? 0.65 : (wt * 0.85 + dr.ph) % 1;
        const arcEnv = Math.sin(du * Math.PI);
        const dropR = Math.max(0.4, (1.1 + (idx % 2) * 0.42) * spP * (0.55 + 0.45 * arcEnv));
        const dx = cx + dr.dx * spP * (0.45 + 0.55 * du);
        const dy = poolY - 2 - dr.peak * spP * arcEnv;
        c.fillStyle = idx === 2 ? '#fef9c3' : idx % 2 === 0 ? '#ffffff' : '#bae6fd';
        c.beginPath();
        c.arc(dx, dy, dropR, 0, Math.PI * 2);
        c.fill();
      });

      if (spP > 0.5) {
        drawStar(c, crestX, crestY - 0.5, 4.4 * subP(spP, 0.5, 1.0), '#ffffff');
      }
    }

    // 8. Přední oblouk mechové kamenné obruby (uzavírá hladinu i paty sloupků v prostorovém 3D kamenném věnci)
    for (let s = 0; s < 8; s++) {
      const a = (s / 7) * Math.PI;
      const kx = cx + Math.cos(a) * 39.5;
      const ky = poolY + 0.8 + Math.sin(a) * 10.2;
      const stoneGrad = c.createLinearGradient(kx, ky - 4, kx, ky + 4);
      stoneGrad.addColorStop(0, cleanP > 0.15 ? '#94a3b8' : '#64748b');
      stoneGrad.addColorStop(1, '#334155');
      c.fillStyle = stoneGrad;
      c.strokeStyle = cleanP > 0.15 ? 'rgba(186, 230, 253, 0.45)' : 'rgba(148, 163, 184, 0.35)';
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(kx, ky, 7.1, 4.0, (3.5 - s) * 0.06, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Sametové polštářky lesního mechu kopírující horní oblouk kamenů
      if (s === 1 || s === 3 || s === 6) {
        drawMossTuft(kx + (s === 3 ? 0.8 : -0.8), ky - 2.1, 1.0, cleanP > 0.15);
      }
    }
  } else if (mode === 'food_bank') {
    // 🥫 Potravinová banka: Prázdný dvoupatrový regál -> Police zaplňující se bedýnkami, konzervami a chlebem
    const rx = cx - 42;
    const ry = cy - 16;
    const rw = 84;
    const rh = 42;

    // Konstrukce regálu
    c.strokeStyle = '#d97706';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(rx, ry);
    c.lineTo(rx, ry + rh);
    c.moveTo(rx + rw, ry);
    c.lineTo(rx + rw, ry + rh);
    c.moveTo(rx, ry + rh * 0.5);
    c.lineTo(rx + rw, ry + rh * 0.5);
    c.moveTo(rx, ry + rh);
    c.lineTo(rx + rw, ry + rh);
    c.stroke();

    // Při p = 0 čárkovaný obrys prázdného místa
    if (p < 0.25) {
      c.save();
      c.setLineDash([3, 3]);
      c.strokeStyle = `rgba(148, 163, 184, ${0.45 * (1 - p * 3.5)})`;
      c.lineWidth = 1.2;
      c.strokeRect(rx + 10, ry + 6, 22, 12);
      c.strokeRect(rx + 46, ry + rh * 0.5 + 6, 24, 12);
      c.restore();
    }

    const items = [
      { x: rx + 8, y: ry + rh * 0.5, w: 20, h: 13, col: '#fbbf24' },
      { x: rx + 33, y: ry + rh * 0.5, w: 16, h: 15, col: '#34d399' },
      { x: rx + 54, y: ry + rh * 0.5, w: 22, h: 11, col: '#f59e0b', round: true },
      { x: rx + 8, y: ry + rh, w: 22, h: 14, col: '#fb7185' },
      { x: rx + 35, y: ry + rh, w: 18, h: 15, col: '#38bdf8' },
      { x: rx + 58, y: ry + rh, w: 18, h: 13, col: '#fde047' }
    ];
    items.forEach((it, idx) => {
      const iP = easeOut(subP(p, idx * 0.1, idx * 0.1 + 0.38));
      if (iP <= 0.02) return;
      const curH = it.h * iP;
      c.fillStyle = it.col;
      if (it.round) {
        c.beginPath();
        c.ellipse(it.x + it.w / 2, it.y - 1, (it.w / 2) * iP, curH, 0, Math.PI, Math.PI * 2);
        c.fill();
      } else {
        drawRoundRect(c, it.x, it.y - curH - 1, it.w, curH, 2);
        c.fill();
      }
    });

    if (p > 0.65) {
      drawHeart(c, cx, ry - 6, 5.5 * subP(p, 0.65, 1.0), '#fde047');
    }
  } else if (mode === 'soup_lantern') {
    // 🍞 Naděje: Zhasnutá pouliční lampa v chladném dešti -> Hřejivý kužel lucerny a napařená polévka pod střechou
    const lampX = cx - 36;
    const bowlX = cx + 16;
    const baseS = by - 3;
    const warmP = easeOut(p);

    // Chladný déšť (p = 0) mizící s rozsvícením lucerny
    if (warmP < 0.6) {
      c.strokeStyle = `rgba(148, 163, 184, ${(1 - warmP * 1.5) * 0.45})`;
      c.lineWidth = 1.2;
      for (let r = 0; r < 6; r++) {
        const rxR = cx - 44 + r * 20;
        const ryR = cy - 18 + (r % 2) * 10;
        c.beginPath();
        c.moveTo(rxR, ryR);
        c.lineTo(rxR - 4, ryR + 9);
        c.stroke();
      }
    }

    // Kužel teplého světla z lucerny
    if (warmP > 0.04) {
      const coneGrad = c.createLinearGradient(lampX + 12, cy - 22, bowlX, baseS);
      coneGrad.addColorStop(0, `rgba(253, 224, 71, ${0.42 * warmP})`);
      coneGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      c.fillStyle = coneGrad;
      c.beginPath();
      c.moveTo(lampX + 12, cy - 20);
      c.lineTo(bowlX + 36, baseS);
      c.lineTo(lampX - 10, baseS);
      c.closePath();
      c.fill();
    }

    // Pouliční lampa vlevo
    c.strokeStyle = '#64748b';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(lampX, baseS);
    c.lineTo(lampX, cy - 22);
    c.quadraticCurveTo(lampX, cy - 28, lampX + 12, cy - 24);
    c.stroke();
    c.fillStyle = warmP > 0.1 ? '#fde047' : '#334155';
    c.beginPath();
    c.arc(lampX + 12, cy - 21, 4.2, 0, Math.PI * 2);
    c.fill();

    // Střecha přístřeší a miska s polévkou vpravo
    c.strokeStyle = warmP > 0.2 ? '#fbbf24' : 'rgba(148, 163, 184, 0.4)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(bowlX - 28, cy - 4);
    c.lineTo(bowlX, cy - 18);
    c.lineTo(bowlX + 28, cy - 4);
    c.stroke();

    c.fillStyle = warmP > 0.15 ? '#ea580c' : '#334155';
    c.strokeStyle = warmP > 0.15 ? '#fde68a' : '#64748b';
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(bowlX, baseS - 13, 16, 0, Math.PI);
    c.closePath();
    c.fill();
    c.stroke();

    if (warmP > 0.35) {
      drawSteam(c, bowlX, baseS - 16, 15 * subP(warmP, 0.35, 1.0), wt);
    }
  } else if (mode === 'zero_waste_pot') {
    // 🥕 Zachraň jídlo: Křivá mrkev s natí, rajče a bylinka vedle studeného hrnce -> Oblouk do měděného hrnce a voňavá večeře
    const potY = by - 4;
    const potW = 46;
    const potH = 22;
    const cookP = easeOut(p);
    const inP = easeOut(subP(p, 0, 0.58));

    // Rozpoznatelná „nedokonalá" zelenina na lince skákající obloukem do hrnce
    if (inP < 0.98) {
      const arcPos = (sx, sy, peakOff) => {
        const u = inP;
        return {
          x: (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * ((sx + cx) * 0.5) + u * u * cx,
          y: (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * (potY - peakOff) + u * u * (potY - potH + 2)
        };
      };

      // 1. Křivá mrkev s lístky natě vlevo
      const car = arcPos(cx - 50, potY - 6, 42);
      c.save();
      c.translate(car.x, car.y);
      c.rotate(-0.35 + inP * 1.4);
      c.strokeStyle = '#4ade80';
      c.lineWidth = 1.5;
      c.lineCap = 'round';
      [-0.4, 0, 0.4].forEach((ang) => {
        c.beginPath();
        c.moveTo(-5, 0);
        c.lineTo(-10, ang * 7);
        c.stroke();
      });
      c.fillStyle = '#fb923c';
      c.beginPath();
      c.moveTo(-5, -3.4);
      c.quadraticCurveTo(2, -4.2, 9, 0.8);
      c.quadraticCurveTo(2, 3.8, -5, 3.2);
      c.closePath();
      c.fill();
      c.restore();

      // 2. Zralé rajče se zelenou stopkou vpravo
      const tom = arcPos(cx + 50, potY - 6, 40);
      c.save();
      c.translate(tom.x, tom.y);
      c.rotate(-inP * 1.2);
      c.fillStyle = '#f43f5e';
      c.beginPath();
      c.ellipse(0, 0.5, 5.8, 5.0, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255, 255, 255, 0.35)';
      c.beginPath();
      c.arc(-2, -1.2, 1.5, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#22c55e';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(-3, -4.5);
      c.lineTo(0, -3.2);
      c.lineTo(3, -4.5);
      c.moveTo(0, -6);
      c.lineTo(0, -3);
      c.stroke();
      c.restore();

      // 3. Snítka zelené bylinky nahoře vlevo
      const herb = arcPos(cx - 34, potY - 17, 44);
      c.save();
      c.translate(herb.x, herb.y);
      c.rotate(0.2 + inP * 1.1);
      c.strokeStyle = '#34d399';
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(-4, 3);
      c.quadraticCurveTo(0, 0, 4, -3);
      c.stroke();
      c.fillStyle = '#4ade80';
      c.beginPath();
      c.ellipse(-1, -1.5, 3.2, 1.7, -0.5, 0, Math.PI * 2);
      c.ellipse(2, 1.2, 3.2, 1.7, 0.4, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // Plamínky pod hrncem a měděná záře při vaření
    if (cookP > 0.25) {
      const flP = subP(cookP, 0.25, 1.0);
      drawGlow(c, cx, potY - potH * 0.45, 30 * flP, '#fb923c', 0.36 * flP);
      [-10, 0, 10].forEach((fx, idx) => {
        c.fillStyle = idx === 1 ? '#fde047' : '#fb923c';
        c.beginPath();
        c.arc(cx + fx, potY + 1.5, 2.2 * flP, 0, Math.PI * 2);
        c.fill();
      });
    }

    // Ucha a tělo hrnce (chladná litina -> hřejivý měděný hrnec se zlatým vývarem)
    c.strokeStyle = cookP > 0.2 ? '#fde68a' : '#94a3b8';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx - potW / 2, potY - potH + 7, 4.5, Math.PI * 0.5, Math.PI * 1.5);
    c.stroke();
    c.beginPath();
    c.arc(cx + potW / 2, potY - potH + 7, 4.5, -Math.PI * 0.5, Math.PI * 0.5);
    c.stroke();

    const potGrad = c.createLinearGradient(cx - potW / 2, potY - potH, cx + potW / 2, potY);
    if (cookP > 0.2) {
      potGrad.addColorStop(0, '#f97316');
      potGrad.addColorStop(0.55, '#ea580c');
      potGrad.addColorStop(1, '#9a3412');
    } else {
      potGrad.addColorStop(0, '#475569');
      potGrad.addColorStop(1, '#1e293b');
    }
    c.fillStyle = potGrad;
    drawRoundRect(c, cx - potW / 2, potY - potH, potW, potH, 4);
    c.fill();
    c.stroke();

    // Hladina zlatavé polévky v hrnci
    if (cookP > 0.3) {
      c.fillStyle = '#fbbf24';
      c.beginPath();
      c.ellipse(cx, potY - potH + 1.5, potW * 0.44, 2.6, 0, 0, Math.PI * 2);
      c.fill();
    }

    if (cookP > 0.42) {
      const sP = subP(cookP, 0.42, 1.0);
      drawSteam(c, cx, potY - potH - 4, 15 * sP, wt);
      drawHeart(c, cx, potY - potH - 19, 5.2 * sP, '#fde047');
    }
  } else if (mode === 'bakery_save') {
    // 🥐 Nesnězeno: Hodiny před zavíračkou a složený sáček -> Zachráněný kraftový sáček s křupavou bagetou a croissantem
    const clkX = cx - 44;
    const clkY = cy + 2;
    const bagX = cx + 14;
    const bagY = by - 3;
    const saveP = easeOut(p);

    // Hodiny zavírací doby vlevo s ciferníkem a výsečí zavíračky
    c.fillStyle = '#0f172a';
    c.strokeStyle = saveP > 0.3 ? '#34d399' : '#fb923c';
    c.lineWidth = 1.9;
    c.beginPath();
    c.arc(clkX, clkY, 12.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Výseč „za 5 minut zavíračka" -> smaragdové zachránění
    c.fillStyle = saveP > 0.3 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(251, 146, 60, 0.28)';
    c.beginPath();
    c.moveTo(clkX, clkY);
    c.arc(clkX, clkY, 10.5, -Math.PI * 0.78, -Math.PI * 0.5);
    c.closePath();
    c.fill();

    c.strokeStyle = saveP > 0.3 ? '#6ee7b7' : '#fde68a';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(clkX, clkY);
    c.lineTo(clkX - 5.5, clkY - 4.5);
    c.moveTo(clkX, clkY);
    c.lineTo(clkX, clkY - 8.5);
    c.stroke();

    // Vykukující francouzská bageta s nářezy a lístkový croissant (oddělené úhly bez překryvu)
    const riseP = easeOut(subP(saveP, 0.12, 0.88));
    if (riseP > 0.03) {
      drawGlow(c, bagX, bagY - 25, 28 * riseP, '#fbbf24', 0.36 * riseP);

      // 1. Křupavá bageta vpravo s šikmými pekařskými zářezy
      c.save();
      c.translate(bagX + 9, bagY - 16 - riseP * 11);
      c.rotate(0.34);
      c.fillStyle = '#d97706';
      c.strokeStyle = '#fde68a';
      c.lineWidth = 1.2;
      c.beginPath();
      c.ellipse(0, 0, 5.2, 13.5, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.strokeStyle = '#fef3c7';
      c.lineWidth = 1.1;
      [-5, 0, 5].forEach((sy) => {
        c.beginPath();
        c.moveTo(-2.6, sy - 1.4);
        c.lineTo(2.6, sy + 1.4);
        c.stroke();
      });
      c.restore();

      // 2. Zlatavý půlměsícový croissant vlevo s vrstvením těsta
      c.save();
      c.translate(bagX - 8, bagY - 16 - riseP * 9.5);
      c.rotate(-0.24);
      c.fillStyle = '#fbbf24';
      c.strokeStyle = '#fef08a';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-9.5, 4.5);
      c.quadraticCurveTo(-7, -7.5, 0, -7.5);
      c.quadraticCurveTo(7, -7.5, 9.5, 4.5);
      c.quadraticCurveTo(4.5, -0.5, 0, -0.5);
      c.quadraticCurveTo(-4.5, -0.5, -9.5, 4.5);
      c.closePath();
      c.fill();
      c.stroke();
      c.strokeStyle = '#b45309';
      c.lineWidth = 1;
      [-3.6, 3.6].forEach((cxOff) => {
        c.beginPath();
        c.moveTo(cxOff, -6.2);
        c.quadraticCurveTo(cxOff * 0.85, -3, cxOff * 0.7, -0.6);
        c.stroke();
      });
      c.restore();
    }

    // Kraftový záchranný sáček (p = 0 přehnutý zavřený -> p = 1 teplý otevřený se zoubkovaným okrajem)
    const bagGrad = c.createLinearGradient(bagX - 18, bagY - 21, bagX + 18, bagY);
    if (saveP > 0.15) {
      bagGrad.addColorStop(0, '#d97706');
      bagGrad.addColorStop(1, '#92400e');
    } else {
      bagGrad.addColorStop(0, '#475569');
      bagGrad.addColorStop(1, '#334155');
    }
    c.fillStyle = bagGrad;
    c.strokeStyle = saveP > 0.15 ? '#fde68a' : '#94a3b8';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(bagX - 18, bagY - 20);
    c.lineTo(bagX - 15, bagY);
    c.lineTo(bagX + 15, bagY);
    c.lineTo(bagX + 18, bagY - 20);
    c.closePath();
    c.fill();
    c.stroke();

    if (saveP <= 0.12) {
      // Přehnutá zavřená klopa sáčku před záchranou
      c.fillStyle = '#64748b';
      c.beginPath();
      c.moveTo(bagX - 18, bagY - 20);
      c.lineTo(bagX + 18, bagY - 20);
      c.lineTo(bagX + 15, bagY - 14);
      c.lineTo(bagX - 15, bagY - 14);
      c.closePath();
      c.fill();
    } else if (saveP > 0.5) {
      drawSteam(c, bagX, bagY - 30, 10 * subP(saveP, 0.5, 1.0), wt);
    }
    drawHeart(c, bagX, bagY - 9, 4.4, saveP > 0.2 ? '#34d399' : 'rgba(148, 163, 184, 0.5)');
  } else if (mode === 'wheels_motion') {
    // 🚲 Kola pro Afriku: Zaprášené nehybné kolo ve stínu -> Roztočená kola jedoucí za vycházejícím sluncem ke škole
    const rideP = easeOut(p);
    const roadY = by - 3;
    const sunX = cx + 52;
    const sunY = lerp(roadY + 8, cy - 12, rideP);

    // Vycházející slunce na obzoru a malá škola vpravo
    if (rideP > 0.05) {
      drawGlow(c, sunX, sunY, 26 * rideP, '#fde047', 0.45 * rideP);
      c.fillStyle = '#fde047';
      c.beginPath();
      c.arc(sunX, sunY, 8 * rideP, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = rideP > 0.3 ? '#b45309' : '#334155';
    c.fillRect(cx + 44, roadY - 12, 16, 12);
    c.beginPath();
    c.moveTo(cx + 42, roadY - 12);
    c.lineTo(cx + 52, roadY - 19);
    c.lineTo(cx + 62, roadY - 12);
    c.fill();

    // Cesta
    c.strokeStyle = 'rgba(110, 231, 183, 0.35)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(cx - spanX + 12, roadY);
    c.lineTo(cx + spanX - 12, roadY);
    c.stroke();

    // Jízdní kolo posouvající se vpřed
    const bikeX = cx - 26 + rideP * 18;
    const wy = roadY - 11;
    const wx1 = bikeX - 18;
    const wx2 = bikeX + 18;
    const spin = rideP > 0.02 ? wt * 5 + rideP * 7 : 0;

    [wx1, wx2].forEach((wx) => {
      c.strokeStyle = rideP > 0.15 ? '#6ee7b7' : '#64748b';
      c.lineWidth = 2.1;
      c.beginPath();
      c.arc(wx, wy, 10.5, 0, Math.PI * 2);
      c.stroke();
      c.lineWidth = 1.1;
      for (let s = 0; s < 3; s++) {
        const a = spin + (s * Math.PI) / 3;
        c.beginPath();
        c.moveTo(wx - Math.cos(a) * 9.5, wy - Math.sin(a) * 9.5);
        c.lineTo(wx + Math.cos(a) * 9.5, wy + Math.sin(a) * 9.5);
        c.stroke();
      }
    });

    // Rám, sedlo a řídítka
    c.strokeStyle = rideP > 0.15 ? '#fde047' : '#94a3b8';
    c.lineWidth = 2.2;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(wx1, wy);
    c.lineTo(bikeX - 6, wy - 13);
    c.lineTo(bikeX + 11, wy - 13);
    c.lineTo(bikeX - 2, wy);
    c.closePath();
    c.moveTo(bikeX - 2, wy);
    c.lineTo(bikeX - 8, wy - 17);
    c.moveTo(wx2, wy);
    c.lineTo(bikeX + 10, wy - 18);
    c.lineTo(bikeX + 15, wy - 18);
    c.stroke();
  } else if (mode === 'safe_crosswalk') {
    // ♿ Chodci sobě: Vozíček/kočárek zastavený před ostrým obrubníkem -> Sklopená smaragdová rampa a plynulý přejezd přes zebru
    const streetY = by - 5;
    const curbX = cx - 20;
    const stepH = 14;
    const rampP = easeOut(subP(p, 0, 0.48));
    const glideP = easeOut(subP(p, 0.25, 0.98));

    // Vyvýšený chodník vlevo s ostrým obrubníkem
    c.fillStyle = '#334155';
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 1.5;
    c.fillRect(cx - 76, streetY - stepH, curbX - (cx - 76), stepH);
    c.strokeRect(cx - 76, streetY - stepH, curbX - (cx - 76), stepH);

    // Varovný proužek bariéry na hraně obrubníku (mizí se sklopením rampy)
    if (rampP < 0.85) {
      c.fillStyle = `rgba(251, 146, 60, ${0.85 * (1 - rampP)})`;
      c.fillRect(curbX - 3.5, streetY - stepH, 3.5, stepH);
    }

    // Pruhy přechodu pro chodce vpravo
    for (let s = 0; s < 4; s++) {
      const lit = glideP > s * 0.2;
      c.fillStyle = lit ? '#f8fafc' : 'rgba(203, 213, 225, 0.38)';
      c.fillRect(curbX + 12 + s * 19, streetY - 4, 12, 5);
    }

    // Bezbariérová smaragdová rampa sklápějící se přes schod
    const rampW = 26;
    if (rampP > 0.02) {
      c.fillStyle = '#10b981';
      c.strokeStyle = '#fde047';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(curbX, streetY - stepH);
      c.lineTo(curbX + rampW * rampP, streetY);
      c.lineTo(curbX, streetY);
      c.closePath();
      c.fill();
      c.stroke();
    }

    // Zřetelná silueta vozíčku zastaveného před bariérou (p = 0) -> plynule sjíždějícího přes přechod (p = 1)
    const wheelX = lerp(curbX - 18, curbX + 60, glideP);
    let groundAtWheel = streetY - stepH;
    let tilt = 0;
    if (wheelX > curbX && wheelX < curbX + rampW) {
      const uR = (wheelX - curbX) / rampW;
      groundAtWheel = lerp(streetY - stepH, streetY, uR);
      tilt = Math.atan2(stepH, rampW) * 0.7;
    } else if (wheelX >= curbX + rampW) {
      groundAtWheel = streetY;
    }

    c.save();
    c.translate(wheelX, groundAtWheel);
    c.rotate(tilt);

    const frameCol = rampP > 0.3 ? '#6ee7b7' : '#cbd5e1';
    const wheelCol = rampP > 0.3 ? '#fde047' : '#fb7185';

    // Rám sedadla, opěrky a postava
    c.strokeStyle = frameCol;
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(-4, -18);
    c.lineTo(-4, -9);
    c.lineTo(5, -9);
    c.lineTo(8, -4);
    c.stroke();

    // Hlava sedící postavy
    c.fillStyle = rampP > 0.3 ? '#fde047' : '#cbd5e1';
    c.beginPath();
    c.arc(0.5, -21.5, 2.8, 0, Math.PI * 2);
    c.fill();

    // Přední malé kolečko
    c.strokeStyle = wheelCol;
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(8.5, -2.8, 2.6, 0, Math.PI * 2);
    c.stroke();

    // Zadní hlavní kolo s výpletem
    const spinA = glideP * 8;
    c.lineWidth = 2.1;
    c.beginPath();
    c.arc(-2, -6.5, 6.2, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 1;
    for (let sp = 0; sp < 3; sp++) {
      const a = spinA + (sp * Math.PI) / 3;
      c.beginPath();
      c.moveTo(-2 - Math.cos(a) * 5.2, -6.5 - Math.sin(a) * 5.2);
      c.lineTo(-2 + Math.cos(a) * 5.2, -6.5 + Math.sin(a) * 5.2);
      c.stroke();
    }
    c.restore();

    if (glideP > 0.72) {
      drawStar(c, curbX + 66, streetY - 22, 4.6 * subP(glideP, 0.72, 1.0), '#34d399');
    }
  } else if (mode === 'kinetic_steps') {
    // 👟 EPP Pomáhej pohybem: Klidná dráha a vybitá kapsle -> Kinetické kroky nabíjející baterii pomoci na 100 %
    const kinP = easeOut(p);
    const batX = cx + 42;
    const batY = cy - 15;
    const batW = 22;
    const batH = 34;

    // Běžecká dráha a kinetické oblouky kroků vlevo
    c.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 68, by - 6);
    c.lineTo(cx + 22, by - 6);
    c.stroke();

    for (let s = 0; s < 4; s++) {
      const sP = easeOut(subP(kinP, s * 0.14, s * 0.14 + 0.42));
      const sx = cx - 58 + s * 20;
      c.fillStyle = sP > 0.1 ? '#34d399' : 'rgba(148, 163, 184, 0.35)';
      c.beginPath();
      c.ellipse(sx, by - 9, 5, 2.4, -0.2, 0, Math.PI * 2);
      c.fill();
      if (sP > 0.05) {
        c.strokeStyle = `rgba(253, 224, 71, ${0.75 * sP})`;
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(sx + 8, by - 8, 10 * sP, Math.PI * 1.05, Math.PI * 1.95);
        c.stroke();
      }
    }

    // Energetická kapsle pomoci vpravo
    c.fillStyle = '#0f172a';
    c.strokeStyle = kinP > 0.2 ? '#6ee7b7' : '#64748b';
    c.lineWidth = 1.8;
    c.fillRect(batX + 6, batY - 4, 10, 4);
    drawRoundRect(c, batX, batY, batW, batH, 4);
    c.fill();
    c.stroke();

    const bars = Math.max(1, Math.round(kinP * 5));
    for (let b = 0; b < bars; b++) {
      if (kinP < 0.05 && b > 0) continue;
      c.fillStyle = kinP < 0.05 ? '#475569' : b >= 3 ? '#fde047' : '#34d399';
      c.fillRect(batX + 3, batY + batH - 6 - b * 5.8, batW - 6, 4.2);
    }
    if (kinP > 0.8) {
      drawStar(c, batX + batW / 2, batY - 10, 4.8 * subP(kinP, 0.8, 1.0), '#fde047');
    }
  } else if (mode === 'shoebox_gift') {
    // 🎁 Krabice od bot: Zavřená převázaná krabice -> Rozvázaná stuha, nadzdvižené víko a kužel kouzelných hvězd
    const boxW = 46;
    const boxH = 24;
    const boxY = by - 4;
    const liftP = easeOut(p);

    // Světelný kužel radosti z otevřené krabice
    if (liftP > 0.08) {
      const rayGrad = c.createLinearGradient(cx, boxY - boxH, cx, cy - 28);
      rayGrad.addColorStop(0, `rgba(253, 224, 71, ${0.55 * liftP})`);
      rayGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      c.fillStyle = rayGrad;
      c.beginPath();
      c.moveTo(cx - boxW * 0.42, boxY - boxH);
      c.lineTo(cx - boxW * 0.85, cy - 26);
      c.lineTo(cx + boxW * 0.85, cy - 26);
      c.lineTo(cx + boxW * 0.42, boxY - boxH);
      c.closePath();
      c.fill();

      drawStar(c, cx, boxY - boxH - 14 * liftP, 6.2 * liftP, '#fde047');
      drawStar(c, cx - 18 * liftP, boxY - boxH - 22 * liftP, 4.2 * liftP, '#34d399');
      drawHeart(c, cx + 16 * liftP, boxY - boxH - 19 * liftP, 4.5 * liftP, '#fb7185');
    }

    // Spodní část krabice se svislou stuhou
    c.fillStyle = '#e11d48';
    c.strokeStyle = '#fda4af';
    c.lineWidth = 1.4;
    drawRoundRect(c, cx - boxW / 2, boxY - boxH, boxW, boxH, 3);
    c.fill();
    c.stroke();
    c.fillStyle = '#fde047';
    c.fillRect(cx - 4, boxY - boxH, 8, boxH);

    // Víko krabice s mašlí (p = 0 zavřené -> p -> 1 nadzdvižené a nakloněné)
    c.save();
    c.translate(cx - boxW / 2, boxY - boxH - liftP * 11);
    c.rotate(-liftP * 0.22);
    c.fillStyle = '#fb7185';
    c.strokeStyle = '#fecdd3';
    drawRoundRect(c, -2, -7, boxW + 4, 8, 2);
    c.fill();
    c.stroke();
    c.strokeStyle = '#fde047';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(boxW / 2 - 5, -9, 5, 3, -0.3 - liftP * 0.4, 0, Math.PI * 2);
    c.ellipse(boxW / 2 + 5, -9, 5, 3, 0.3 + liftP * 0.4, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  } else if (mode === 'angel_wings') {
    // 👼 Dobrý anděl: Vychýlené váhy nejistoty se složenými křídly -> 100% dar vyrovnávající váhy a 3vrstvá opeřená andělská křídla
    const angP = easeOut(p);
    const scaleAngle = (1 - angP) * 0.24;
    const wingSpan = 0.26 + angP * 0.74;
    const wingFlap = Math.sin(wt * 2.6) * (1.2 + angP * 2.2);

    if (angP > 0.12) {
      drawGlow(c, cx, cy, 38 * angP, '#fde68a', 0.28 * angP);
    }

    // Vícevrstvá opeřená andělská křídla zvedající se vzhůru a do stran
    [-1, 1].forEach((dir) => {
      for (let tier = 2; tier >= 0; tier--) {
        const tFrac = tier / 2;
        const reachX = (18 + (38 - tier * 7) * wingSpan) * dir;
        const tipY = cy - (18 - tier * 8) * wingSpan + tier * 5 + wingFlap * (1 - tFrac * 0.35);
        const rootY = cy + 2 + tier * 3.5;

        c.fillStyle =
          angP > 0.2
            ? `rgba(255, 255, 255, ${(0.52 + angP * 0.42) * (1 - tier * 0.14)})`
            : `rgba(148, 163, 184, ${0.34 - tier * 0.06})`;
        c.strokeStyle = angP > 0.2 ? (tier === 0 ? '#fde68a' : '#bae6fd') : 'rgba(148, 163, 184, 0.48)';
        c.lineWidth = tier === 0 ? 1.6 : 1.1;

        c.beginPath();
        c.moveTo(cx + dir * 5, rootY);
        c.bezierCurveTo(
          cx + dir * (12 + 16 * wingSpan),
          cy - (16 - tier * 5) * wingSpan + wingFlap,
          cx + reachX * 0.88,
          tipY - 4,
          cx + reachX,
          tipY + 3
        );
        c.quadraticCurveTo(cx + reachX * 0.58, rootY + 9, cx + dir * 5, rootY + 4);
        c.closePath();
        c.fill();
        c.stroke();
      }
    });

    // Svatozář ukotvená k cy (nikoliv pevné y=16, aby nekolidovala s HUD v náhledu)
    c.strokeStyle = angP > 0.2 ? '#fde047' : 'rgba(253, 224, 71, 0.42)';
    c.lineWidth = 1.9;
    c.beginPath();
    c.ellipse(cx, cy - 22, 12.5 + angP * 3, 3.2, 0, 0, Math.PI * 2);
    c.stroke();

    // Váhy rodinného rozpočtu
    const pivotY = cy + 6;
    const beamArm = 30;
    const xL = cx - Math.cos(scaleAngle) * beamArm;
    const yL = pivotY - Math.sin(scaleAngle) * beamArm;
    const xR = cx + Math.cos(scaleAngle) * beamArm;
    const yR = pivotY + Math.sin(scaleAngle) * beamArm;

    c.strokeStyle = angP > 0.35 ? '#fde047' : '#94a3b8';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 13, by - 3);
    c.lineTo(cx + 13, by - 3);
    c.moveTo(cx, by - 3);
    c.lineTo(cx, pivotY);
    c.moveTo(xL, yL);
    c.lineTo(xR, yR);
    c.stroke();

    [
      { x: xL, y: yL },
      { x: xR, y: yR }
    ].forEach((arm) => {
      c.fillStyle = angP > 0.35 ? 'rgba(251, 191, 36, 0.34)' : 'rgba(100, 116, 139, 0.28)';
      c.strokeStyle = angP > 0.35 ? '#fbbf24' : '#94a3b8';
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(arm.x, arm.y + 10.5, 9, 0, Math.PI);
      c.closePath();
      c.fill();
      c.stroke();
    });

    if (angP > 0.05) {
      const coinDrop = Math.max(0, 1 - angP * 1.5) * 13;
      c.fillStyle = '#fde047';
      c.beginPath();
      c.arc(xL, yL + 7.5 - coinDrop, 4.2, 0, Math.PI * 2);
      c.fill();
    }
    drawHeart(c, cx, cy - 4, 4.8 + angP * 2.4, angP > 0.25 ? '#fb7185' : '#fde047');
  } else if (mode === 'charity_care') {
    // 💚 Charita ČR: Zhasnuté 4tabulkové venkovské okénko -> Medově rozsvícený domov pod ochrannou střechou se srdcem péče
    const winW = 38;
    const winH = 30;
    const winY = by - winH - 5;
    const careP = easeOut(p);

    if (careP > 0.08) {
      drawGlow(c, cx, winY + winH / 2, 36 * careP, '#fbbf24', 0.36 * careP);
    }

    // Ochranná střecha domova a terénní péče
    c.strokeStyle = careP > 0.2 ? '#6ee7b7' : 'rgba(148, 163, 184, 0.45)';
    c.lineWidth = 2.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - 34, winY + 2);
    c.lineTo(cx, winY - 14);
    c.lineTo(cx + 34, winY + 2);
    c.stroke();

    // 4 okenní tabulky: p = 0 tmavě břidlicové -> p -> 1 teplé medové světlo
    c.fillStyle = careP > 0.05 ? `rgba(253, 224, 71, ${0.18 + careP * 0.72})` : '#0f172a';
    c.strokeStyle = careP > 0.2 ? '#fde68a' : '#64748b';
    c.lineWidth = 2;
    drawRoundRect(c, cx - winW / 2, winY, winW, winH, 3);
    c.fill();
    c.stroke();

    c.beginPath();
    c.moveTo(cx, winY);
    c.lineTo(cx, winY + winH);
    c.moveTo(cx - winW / 2, winY + winH / 2);
    c.lineTo(cx + winW / 2, winY + winH / 2);
    c.stroke();

    if (careP > 0.3) {
      drawHeart(c, cx, winY - 4 - careP * 3, 6.2 * subP(careP, 0.3, 1.0), '#34d399');
    }
  } else {
    // 🤝 Znesnáze21 / Dobrovolnictví: Rozlomený nedokončený oblouk mezi dvěma břehy -> Světelný most spojující dva lidi
    const brP = easeOut(p);
    const shoreY = by - 5;
    const leftX = cx - 50;
    const rightX = cx + 50;

    // Dva břehy
    c.fillStyle = '#0f2922';
    c.strokeStyle = brP > 0.2 ? '#5eead4' : '#64748b';
    c.lineWidth = 1.8;
    c.fillRect(leftX - 14, shoreY, 22, 6);
    c.strokeRect(leftX - 14, shoreY, 22, 6);
    c.fillRect(rightX - 8, shoreY, 22, 6);
    c.strokeRect(rightX - 8, shoreY, 22, 6);

    // Dvě postavy na březích (zšeřelé -> zlatě osvětlené)
    [leftX - 3, rightX + 3].forEach((fx) => {
      c.fillStyle = brP > 0.5 ? '#fde047' : '#94a3b8';
      c.beginPath();
      c.arc(fx, shoreY - 12, 3.2, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = brP > 0.5 ? '#fde047' : '#94a3b8';
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(fx, shoreY - 8);
      c.lineTo(fx, shoreY - 1);
      c.stroke();
    });

    // Dvě poloviny oblouku rostoucí k sobě až do spojení klenákem uprostřed
    const reach = lerp(0.28, 0.5, brP);
    c.strokeStyle = brP > 0.2 ? '#2dd4bf' : 'rgba(148, 163, 184, 0.5)';
    c.lineWidth = 3.2;
    c.lineCap = 'round';
    [-1, 1].forEach((dir) => {
      c.beginPath();
      for (let s = 0; s <= 16; s++) {
        const u = (s / 16) * reach;
        const tArc = dir === -1 ? u : 1 - u;
        const ax = (1 - tArc) * (1 - tArc) * leftX + 2 * (1 - tArc) * tArc * cx + tArc * tArc * rightX;
        const ay = (1 - tArc) * (1 - tArc) * shoreY + 2 * (1 - tArc) * tArc * (cy - 30) + tArc * tArc * shoreY;
        if (s === 0) c.moveTo(ax, ay);
        else c.lineTo(ax, ay);
      }
      c.stroke();
    });

    // Zlatý klenák a srdce uprostřed spojeného mostu
    if (brP > 0.72) {
      const kP = subP(brP, 0.72, 1.0);
      drawGlow(c, cx, cy - 12, 26 * kP, '#fde047', 0.4 * kP);
      c.fillStyle = '#fde047';
      c.beginPath();
      c.arc(cx, cy - 12, 4.2 * kP, 0, Math.PI * 2);
      c.fill();
      drawHeart(c, cx, cy - 23, 6 * kP, '#fb7185');
    }
  }

  c.restore();
}

/**
 * Poetický 2D Canvas transformační engine s HiDPI škálováním,
 * 2-fázovou metamorfózou (klidná anticipace -> poetické naplnění)
 * a 60fps procedurální scénou pro všech 45 aktivit.
 */
export function mountImpactCanvas(cv, o = {}) {
  const c = optimizeCanvasContext(cv?.getContext?.('2d'));
  if (!c) {
    const noop = () => {};
    noop.setPrimed = () => {};
    return noop;
  }

  const spec = resolveActionEffectSpec(o.action || o.mode || 'kibble');
  const mode = spec.mode;
  const target = spec.target || 25;
  const cs = spec.colors || ['#34d399', '#10b981', '#fbbf24', '#38bdf8'];
  const isPreview = Boolean(o.preview);
  let isPrimed = Boolean(o.primed);
  const h = isPreview ? 86 : 92;
  const cy = isPreview ? h * 0.58 : h * 0.5 + 2;
  const by = isPreview ? h - 7 : h - 11;
  const red = prefersReducedMotion();

  let currentW = isPreview ? 380 : 300;
  let currentCssH =
    cv?.getBoundingClientRect?.()?.height > 28
      ? cv.getBoundingClientRect().height
      : cv?.height || (isPreview ? 86 : 92);
  let gx = 0;
  let py = 0.5;
  let id = 0;
  let frame = 0;
  let idleFrames = 0;
  let lastNow = -1;
  let isRunning = false;
  let isVisible = false;
  let lastReportedVal = -1;
  let isClimax = !isPreview && Boolean(o.climax);
  let peakRatio = isClimax || spec.staticMetric || red ? 1.0 : 0.0;
  let transitionProgress = isPreview
    ? 0.0
    : isClimax
      ? red
        ? 1.0
        : 0.0
      : red
        ? 0.25
        : 0.0;
  let previewP = isPrimed ? 0.14 : 0.0;
  let burstEnergy = isPreview ? 0.0 : isClimax ? 0.9 : 0.35;
  const ripples = [];

  if (!isPreview) {
    ensureSharedOrientation();
  }

  // HiDPI / Retina škálování zachovávající přesný poměr stran bez deformace kruhů a hranolů
  const syncCanvasDpr = () => {
    const rect = cv?.getBoundingClientRect?.();
    const ch = rect?.height > 28 ? rect.height : cv?.height || (isPreview ? 86 : 112);
    currentCssH = ch;
    if (!win() || !cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, getCanvasDprCap());
    const cw = rect?.width > 40 ? rect.width : cv.width || (isPreview ? 380 : 320);
    const minH = isPreview ? 50 : 72;
    const effDpr = Math.max(dpr, minH / Math.max(1, ch));
    const targetW = Math.max(240, Math.round(cw * effDpr));
    const targetH = Math.max(minH, Math.round(ch * effDpr));
    if (cv.width !== targetW || cv.height !== targetH) {
      cv.width = targetW;
      cv.height = targetH;
    }
  };
  syncCanvasDpr();

  let ro = null;
  if (win() && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      const prevW = cv.width;
      const prevH = cv.height;
      syncCanvasDpr();
      if (cv.width !== prevW || cv.height !== prevH) {
        wakeUpLoop();
        fn(true);
      }
    });
    ro.observe(cv);
  }

  // Jemné světlušky v botanické smaragdové scéně (normalizované napříč šířkou plátna)
  const stars = Array.from({ length: isPreview ? 16 : 22 }, (_, i) => ({
    nx: ((i * 53 + 17) % 293) / 293,
    ny: (isPreview ? 0.30 : 0.10) + (((i * 29 + 11) % 100) / 100) * (isPreview ? 0.58 : 0.76),
    r: 0.75 + (i % 3) * 0.45,
    phase: i * 0.7,
    col: i % 2 === 0 ? '#fde68a' : '#6ee7b7'
  }));

  const emitProgress = (ratio) => {
    if (isPreview) return;
    peakRatio = spec.staticMetric ? 1 : Math.max(peakRatio, Math.min(1, ratio || 0));
    const totalVal = Math.max(1, Math.min(target, Math.round(target * peakRatio)));
    if (totalVal !== lastReportedVal) {
      lastReportedVal = totalVal;
      o.onWeightUpdate?.(totalVal, spec.format(totalVal), spec);
    }
  };

  let arcsCount = 0;
  let controller = null;
  let onDown = null;

  if (!isPreview) {
    const mollyTreat = spec.mollyTreat || resolveMollyTreat(spec);
    if (cv?.setAttribute) {
      cv.setAttribute('data-molly-mini', 'ready');
      cv.setAttribute('data-molly-treat', mollyTreat?.foodType || 'salmon');
      cv.setAttribute('data-molly-arcs', '0');
    }

    const triggerBurst = (rx, ry) => {
      transitionProgress = red ? 1.0 : 0.0;
      lastNow = -1;
      isClimax = true;
      burstEnergy = 1.0;
      arcsCount++;
      if (cv?.setAttribute) {
        cv.setAttribute('data-molly-arcs', String(arcsCount));
      }
      const ripX = Number.isFinite(rx) ? rx : currentW / 2;
      const ripY = Number.isFinite(ry) ? ry : cy;
      ripples.push({ x: ripX, y: ripY, r: 4, maxR: 54, alpha: 0.82 });
      emitProgress(1);
      wakeUpLoop();
      if (red) {
        fn(true);
      }
    };

    controller = {
      cv,
      spec,
      triggerBurst,
      getActive: () => isRunning
    };
    activeControllers.add(controller);
    cv.__triggerBurst = triggerBurst;

    if (red || o.climax || spec.staticMetric) {
      emitProgress(1);
    }

    onDown = (e) => {
      const rect = cv.getBoundingClientRect?.();
      const px = rect ? (e.clientX - rect.left) * (currentW / Math.max(1, rect.width)) : currentW / 2;
      const pyLocal = rect ? (e.clientY - rect.top) * (h / Math.max(1, rect.height)) : cy;
      if (!isClimax || transitionProgress >= 0.65) {
        triggerBurst(px, pyLocal);
      } else {
        ripples.push({ x: px, y: pyLocal, r: 3, maxR: 42, alpha: 0.72 });
        burstEnergy = Math.min(1.0, burstEnergy + 0.38);
        wakeUpLoop();
      }
    };
    cv?.addEventListener?.('pointerdown', onDown);
  }

  const scheduleFrame = (cb) =>
    typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : 0;
  const cancelFrame = (handle) => {
    if (handle && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(handle);
    }
  };

  const fn = (force = false, now = undefined) => {
    if (!force && (!isVisible || (!cv.isConnected && cv.parentNode === null))) {
      isRunning = false;
      return;
    }

    let step = 1;
    if (!force) {
      if (typeof now === 'number' && Number.isFinite(now)) {
        if (lastNow >= 0 && now > lastNow) {
          step = frameStep(now - lastNow);
        }
        lastNow = now;
      }
      frame += step;
    }

    let p = 0;
    const targetPreviewP = isPrimed ? 0.14 : 0.0;

    if (isPreview) {
      if (red) {
        previewP = targetPreviewP;
      } else if (!force) {
        previewP += (targetPreviewP - previewP) * Math.min(1, 0.14 * step);
        if (Math.abs(targetPreviewP - previewP) < 0.001) {
          previewP = targetPreviewP;
        }
      }
      p = previewP;
    } else if (isClimax) {
      if (red) {
        transitionProgress = 1.0;
      } else if (!force && transitionProgress < 1.0) {
        transitionProgress = Math.min(1.0, transitionProgress + 0.015 * step);
        emitProgress(transitionProgress);
      }
      // Hladká křivka s gradací: během fade-in karty drží čistý stav „před" a hlavní rozkvět běží přímo před očima
      p = 1 - Math.pow(1 - transitionProgress, 1.85);
    } else {
      if (red) {
        transitionProgress = 0.25;
      } else if (!force && transitionProgress < 0.25) {
        transitionProgress = Math.min(0.25, transitionProgress + 0.0045 * step);
      }
      p = easeOut(transitionProgress / 0.25) * 0.25;
      const initialRamp = red ? 1.0 : Math.min(0.65, Math.max(1, frame) / 75);
      emitProgress(initialRamp);
    }

    if (!isPreview) {
      if (!force) {
        if (burstEnergy > 0.02) {
          burstEnergy *= Math.pow(0.94, step);
        } else {
          burstEnergy = 0;
        }

        for (let i = ripples.length - 1; i >= 0; i--) {
          const rip = ripples[i];
          rip.r += 1.8 * step;
          rip.alpha *= Math.pow(0.92, step);
          if (rip.alpha < 0.02 || rip.r >= rip.maxR) {
            ripples.splice(i, 1);
          }
        }

        const targetGx = getSharedOrientationGx();
        gx += (targetGx - gx) * Math.min(1, 0.08 * step);
      }
    }

    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    const scale = cv.height / h;
    const w = Math.max(240, cv.width / Math.max(0.01, scale));
    currentW = w;
    const cx = w / 2;
    c.scale(scale, scale);

    // Jednotná botanicko-smaragdová scénická kulisa (#113e2b -> #072016 -> #03100b)
    const bgGrad = c.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#113e2b');
    bgGrad.addColorStop(0.56, '#072016');
    bgGrad.addColorStop(1, '#03100b');
    c.fillStyle = bgGrad;
    c.fillRect(0, 0, w, h);

    // Měkká středová záře reagující na proměnu skutku i na hover anticipaci
    const auraAlpha = isPreview ? 0.08 + p * 0.45 : 0.10 + p * 0.16 + burstEnergy * 0.14;
    drawGlow(c, cx, cy + 2, Math.min(96, w * 0.34), cs[0] || '#34d399', auraAlpha);

    // Jemný horizont krajiny u paty scény
    c.fillStyle = 'rgba(2, 12, 8, 0.55)';
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, by + 2);
    c.quadraticCurveTo(cx * 0.55, by - 2, cx, by + 1);
    c.quadraticCurveTo(cx * 1.45, by + 4, w, by + 1);
    c.lineTo(w, h);
    c.closePath();
    c.fill();

    // Světlušky v pozadí
    const time = red ? 0 : frame * 0.025;
    for (const s of stars) {
      const op = red ? 0.32 : 0.18 + 0.42 * (0.5 + 0.5 * Math.sin(time * 1.4 + s.phase));
      c.fillStyle = s.col;
      c.globalAlpha = op;
      c.beginPath();
      c.arc(s.nx * w, s.ny * h, s.r, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1.0;

    // Vykreslení 2fázové poetické scény skutku (v náhledu s dynamickou rezervou pod horními HUD pilulkami i na 52px mobilu)
    if (isPreview) {
      const previewScale = currentCssH <= 62 ? 0.64 : 0.76;
      c.save();
      c.translate(cx, by + 1);
      c.scale(previewScale, previewScale);
      c.translate(-cx, -by);
      drawPoeticDeedScene(c, mode, p, time, cx, cy, by, w, h, cs, red, frame, gx, py);
      c.restore();
    } else {
      drawPoeticDeedScene(c, mode, p, time, cx, cy, by, w, h, cs, red, frame, gx, py);
    }

    // Dotykové kruhy na plátně odměny
    if (!isPreview) {
      for (const rip of ripples) {
        c.save();
        c.beginPath();
        c.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        c.strokeStyle = cs[0] || '#38bdf8';
        c.globalAlpha = rip.alpha;
        c.lineWidth = 1.5;
        c.stroke();
        c.restore();
      }
    }

    c.restore();

    // Automatické uspání smyčky po ustálení animace (nulová spotřeba baterie v klidu)
    const settled = isPreview
      ? Math.abs(previewP - targetPreviewP) < 0.002
      : ripples.length === 0 &&
        burstEnergy <= 0.01 &&
        (isClimax ? transitionProgress >= 1.0 : transitionProgress >= 0.25 && frame > 80);

    if (red && !force) {
      isRunning = false;
      return;
    }

    if (settled) {
      idleFrames += step;
      if (idleFrames > 90 && !force) {
        isRunning = false;
        return;
      }
    } else {
      idleFrames = 0;
    }

    if (isRunning && !force) {
      id = scheduleFrame((nextNow) => fn(false, nextNow));
      if (!id) isRunning = false;
    }
  };

  const wakeUpLoop = () => {
    idleFrames = 0;
    lastNow = -1;
    if (!isRunning && isVisible && !red) {
      isRunning = true;
      id = scheduleFrame((nextNow) => fn(false, nextNow));
      if (!id) isRunning = false;
    }
  };

  let io = null;
  if (win() && typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry?.isIntersecting ?? true;
        if (isVisible) {
          wakeUpLoop();
        } else {
          isRunning = false;
          cancelFrame(id);
        }
      },
      { threshold: 0.05 }
    );
    io.observe(cv);
  } else {
    isVisible = true;
    wakeUpLoop();
  }

  // Okamžité synchronní vykreslení prvního snímku bez čekání na IntersectionObserver
  fn(true);

  const cleanup = () => {
    cancelFrame(id);
    io?.disconnect();
    ro?.disconnect();
    if (!isPreview) {
      if (controller) activeControllers.delete(controller);
      delete cv.__triggerBurst;
      if (onDown) cv?.removeEventListener?.('pointerdown', onDown);
      cv?.removeAttribute?.('data-molly-mini');
      cv?.removeAttribute?.('data-molly-treat');
      cv?.removeAttribute?.('data-molly-arcs');
    }
  };

  cleanup.setPrimed = (val) => {
    const next = Boolean(val);
    if (next !== isPrimed) {
      isPrimed = next;
      wakeUpLoop();
      if (red || !isVisible) {
        fn(true);
      }
    }
  };

  return cleanup;
}

function getActionIdentityKey(p) {
  const action = p?.action !== undefined ? p.action : p;
  const flags = `${Boolean(p?.preview)}:${Boolean(p?.climax)}`;
  if (!action) return `default:${flags}`;
  if (typeof action === 'string') return `${action}:${flags}`;
  return `${action.id || ''}:${action.title || action.name || ''}:${action.category || action.kind || ''}:${p?.mode || ''}:${flags}`;
}

/**
 * Svelte action pro připojení 2D Canvas scény a ASMR zvuku k elementu <canvas>.
 * Chrání před zbytečným restartováním plátna při reaktivních aktualizacích rodičovské komponenty.
 */
export function impactCanvas(node, params = {}) {
  let destroy = null;
  let currentKey = '';
  let currentOnMetric = null;

  const setup = (p) => {
    destroy?.();
    const action = p?.action !== undefined ? p.action : p;
    const isPreview = Boolean(p?.preview);
    currentOnMetric = p?.onMetric || p?.onProgress || p?.onWeightUpdate || null;
    currentKey = getActionIdentityKey(p);
    const shouldPlayOnMount =
      !isPreview && (p?.climax !== undefined ? Boolean(p.climax) : !p?.silent);
    const spec = resolveActionEffectSpec(action);
    if (!isPreview) {
      currentOnMetric?.(spec.target, spec.format(spec.target), spec);
      if (shouldPlayOnMount) {
        playPayoffAsmr(action);
      }
    }
    destroy = mountImpactCanvas(node, {
      action,
      mode: spec.mode,
      preview: isPreview,
      primed: Boolean(p?.primed),
      climax: !isPreview && Boolean(p?.climax),
      onWeightUpdate: isPreview
        ? undefined
        : (val, formatted, s) => {
            currentOnMetric?.(val, formatted, s);
          }
    });
  };

  setup(params);

  return {
    update(nextParams) {
      currentOnMetric =
        nextParams?.onMetric ||
        nextParams?.onProgress ||
        nextParams?.onWeightUpdate ||
        null;
      const nextKey = getActionIdentityKey(nextParams);
      if (nextKey !== currentKey) {
        setup(nextParams);
      } else if (nextParams?.preview) {
        destroy?.setPrimed?.(Boolean(nextParams?.primed));
      }
    },
    destroy() {
      destroy?.();
    }
  };
}

