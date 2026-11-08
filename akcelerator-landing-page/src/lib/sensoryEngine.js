import { notifyMollySpark } from './mollyStore.js';

const MK = 'aa_sound_muted';
const RK = 'aa_pending_return_v1';
const win = () => typeof window !== 'undefined';
const vib = (v) => {
  try {
    navigator.vibrate?.(v);
  } catch {}
};

let ac = null;
let mem = null;
let lastAsmrTs = 0;
let globalSparkCharge = 0;
const activeControllers = new Set();

const sto = (s, k, v) => {
  try {
    return v === undefined ? s.getItem(k) : s.setItem(k, v);
  } catch {}
};

export const isSoundMuted = () => win() && sto(localStorage, MK) === '1';

export const toggleSoundMuted = () => {
  const n = !isSoundMuted();
  sto(localStorage, MK, n ? '1' : '0');
  if (!n) {
    tone(523.25, 0.22, 'sine', 0, 0.03);
    tone(659.25, 0.28, 'triangle', 0.06, 0.028);
  }
  return n;
};

export const prefersReducedMotion = () =>
  !!(win() && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

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
    target: 25,
    label: 'Plnění misky v útulku',
    colors: ['#f59e0b', '#fbbf24', '#34d399', '#fde68a'],
    format: (v) => `+${v} g v misce 🐾`
  },
  donio_utulky: {
    mode: 'shelter_care',
    asmr: 'kibble',
    icon: '🐾',
    target: 25,
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
    format: (v) => `🐦 +${v} ochranných bodů skla`
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
    format: (v) => `🦔 ${v} stanic v pohotovosti`
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
    format: (v) => `🩸 Až ${v} zachráněné životy`
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
    format: (v) => `🧠 +${v} kroků psychické opory`
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
    format: (v) => `🌈 ${v}/7 tipů přijetí`
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
    format: (v) => `💻 +${v} propojených uzlů`
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
    target: 100,
    label: 'Zrnka rýže do misky OSN',
    colors: ['#f8fafc', '#fde68a', '#fbbf24', '#38bdf8'],
    format: (v) => `🍚 +${v} zrnek rýže`
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
    format: (v) => `🍎 +${v} plodů na stromě`
  },
  inaturalist_priroda: {
    mode: 'butterfly_lens',
    asmr: 'birds',
    icon: '🦋',
    target: 3,
    label: 'Záznam biodiverzity přírody',
    colors: ['#c084fc', '#f472b6', '#34d399', '#fbbf24'],
    format: (v) => `🦋 +${v} určené druhy v ČR`
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
    format: (v) => `🥫 +${v} porcí jídla`
  },
  nadeje_jidlo: {
    mode: 'soup_lantern',
    asmr: 'warmth',
    icon: '🍞',
    target: 1,
    label: 'Teplá polévka a noc v teple',
    colors: ['#fb923c', '#fbbf24', '#fde68a', '#34d399'],
    format: (v) => `🍞 +${v} noc v teple a polévka`
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
    format: (v) => `👟 +${v} bodů pohybu`
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
    format: (v) => `👼 ${v} % přímo rodině`
  },
  charita_dar: {
    mode: 'charity_care',
    asmr: 'harp',
    icon: '💚',
    target: 100,
    label: 'Podpora terénní a hospicové péče',
    colors: ['#34d399', '#10b981', '#fbbf24', '#f472b6'],
    format: (v) => `💚 ${v} % pro terénní péči`
  },
  znesnaze21_pribeh: {
    mode: 'solidarity_bridge',
    asmr: 'harp',
    icon: '🤝',
    target: 100,
    label: 'Přímá solidarita Znesnáze21',
    colors: ['#2dd4bf', '#34d399', '#fbbf24', '#fb7185'],
    format: (v) => `🤝 ${v} % ověřenému člověku`
  }
};

const MOLLY_TREAT_BY_FOOD = {
  salmon: {
    icon: '🐟',
    name: 'lososová granulka pro Molly',
    shortLabel: '+1 rybka pro Molly',
    color: '#f59e0b',
    foodType: 'salmon'
  },
  milk: {
    icon: '🥛',
    name: 'teplé kočičí mlíčko v misce',
    shortLabel: '+1 mlíčko pro Molly',
    color: '#fde68a',
    foodType: 'milk'
  },
  tuna: {
    icon: '🍣',
    name: 'rýžový polštářek s tuňákem',
    shortLabel: '+1 sousto pro Molly',
    color: '#fbbf24',
    foodType: 'tuna'
  },
  catnip: {
    icon: '🌿',
    name: 'čerstvý lístek šanty kočičí',
    shortLabel: '+1 šanta pro Molly',
    color: '#4ade80',
    foodType: 'catnip'
  },
  cream: {
    icon: '🧶',
    name: 'smetanový pamlsek a klubíčko',
    shortLabel: '+1 pamlsek pro Molly',
    color: '#f472b6',
    foodType: 'cream'
  },
  star_treat: {
    icon: '✨',
    name: 'křupavá hvězdička pro Molly',
    shortLabel: '+1 hvězdička pro Molly',
    color: '#a78bfa',
    foodType: 'star_treat'
  }
};

const MODE_TO_MOLLY_FOOD = {
  // Animals
  kibble: 'salmon',
  shelter_care: 'salmon',
  // Birds & wildlife
  birds_glass: 'milk',
  birds_song: 'milk',
  wildlife_rescue: 'milk',
  // Food & solidarity
  rice: 'tuna',
  food_bank: 'tuna',
  soup_lantern: 'tuna',
  zero_waste_pot: 'tuna',
  bakery_save: 'tuna',
  shoebox_gift: 'tuna',
  // Nature & ecology
  forest_bloom: 'catnip',
  fruit_tree: 'catnip',
  water_spring: 'catnip',
  eco_cleanup: 'catnip',
  compost_sprout: 'catnip',
  butterfly_lens: 'catnip',
  campfire_group: 'catnip',
  globe_bridge: 'catnip',
  // Care, seniors, health
  blood_drop: 'cream',
  dna_helix: 'cream',
  ecg_rescue: 'cream',
  hair_silk: 'cream',
  breath_lotus: 'cream',
  mind_wave: 'cream',
  prism_support: 'cream',
  senior_letter: 'cream',
  owl_shield: 'cream',
  angel_wings: 'cream',
  charity_care: 'cream',
  solidarity_bridge: 'cream',
  // Knowledge, science & civic
  satellite_map: 'star_treat',
  cosmos_science: 'star_treat',
  wiki_ink: 'star_treat',
  code_nodes: 'star_treat',
  dove_appeal: 'star_treat',
  book_booth: 'star_treat',
  parcel_share: 'star_treat',
  phone_recycle: 'star_treat',
  tutoring_spark: 'star_treat',
  school_pencil: 'star_treat',
  memory_wave: 'star_treat',
  wheels_motion: 'star_treat',
  safe_crosswalk: 'star_treat',
  kinetic_steps: 'star_treat'
};

export function resolveMollyTreat(specOrMode) {
  const mode =
    typeof specOrMode === 'string'
      ? specOrMode
      : specOrMode?.mode || 'kibble';
  const foodKey = MODE_TO_MOLLY_FOOD[mode] || 'salmon';
  return MOLLY_TREAT_BY_FOOD[foodKey] || MOLLY_TREAT_BY_FOOD.salmon;
}

Object.values(ACTION_EFFECT_CATALOG).forEach((spec) => {
  spec.mollyTreat = resolveMollyTreat(spec);
});

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
  return ACTION_EFFECT_CATALOG.charita_dar;
}

export function getActionEffectMeta(action, currentVal, opts = {}) {
  const spec = resolveActionEffectSpec(action);
  const val =
    typeof currentVal === 'number' && currentVal > 0 ? currentVal : spec.target;
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

function ctx() {
  if (!win() || isSoundMuted()) return null;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  } catch {
    return null;
  }
}

function tone(f, dur = 0.28, tp = 'sine', d = 0, pk = 0.038, ef = 0) {
  const c = ctx();
  if (!c) return null;
  try {
    const t = c.currentTime + d;
    const o = c.createOscillator();
    const o2 = c.createOscillator();
    const g = c.createGain();
    const g2 = c.createGain();
    const r = (p, v, x) => p.linearRampToValueAtTime(v, x);
    o.type = tp;
    o.frequency.value = f;
    o2.type = 'sine';
    o2.frequency.value = f * 2;
    if (ef) {
      r(o.frequency, ef, t + dur * 0.85);
      r(o2.frequency, ef * 2, t + dur * 0.85);
    }
    g.gain.setValueAtTime(0.001, t);
    r(g.gain, pk, t + 0.018);
    r(g.gain, 0.0001, t + dur);
    g2.gain.setValueAtTime(0.0005, t);
    r(g2.gain, pk * 0.22, t + 0.025);
    r(g2.gain, 0.0001, t + dur * 0.9);
    o.connect(g);
    o2.connect(g2);
    g.connect(c.destination);
    g2.connect(c.destination);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.03);
    o2.stop(t + dur + 0.03);
    return g;
  } catch {
    return null;
  }
}

function noiseBurst(dur = 0.03, freq = 1100, q = 5.5, delay = 0, gainPeak = 0.04) {
  const c = ctx();
  if (!c) return;
  try {
    const sr = c.sampleRate;
    const len = Math.max(64, Math.floor(sr * dur));
    const buf = c.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    const flt = c.createBiquadFilter();
    const g = c.createGain();
    src.buffer = buf;
    flt.type = 'bandpass';
    flt.frequency.value = freq;
    flt.Q.value = q;
    g.gain.setValueAtTime(gainPeak, t);
    g.gain.linearRampToValueAtTime(0.0005, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(c.destination);
    src.start(t);
  } catch {}
}

/**
 * Hřejivé procedurální předení želvovinové kočky Molly (27 Hz -> 31 Hz AM modulace 4.2 Hz + nízkopropustný filtr 145 Hz)
 */
export function playMollyPurr(dur = 1.1, intensity = 0.8) {
  if (isSoundMuted()) return;
  const c = ctx();
  if (!c) return;
  try {
    const t = c.currentTime;
    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    const flt = c.createBiquadFilter();
    const env = c.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(27.2, t);
    osc1.frequency.linearRampToValueAtTime(30.8, t + dur * 0.55);
    osc1.frequency.linearRampToValueAtTime(26.5, t + dur);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(54.4, t);
    osc2.frequency.linearRampToValueAtTime(61.2, t + dur * 0.55);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4.2, t);
    lfoGain.gain.setValueAtTime(0.018 * intensity, t);

    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(145, t);
    flt.Q.setValueAtTime(1.6, t);

    const pk = Math.max(0.008, Math.min(0.045, 0.028 * intensity));
    env.gain.setValueAtTime(0.0005, t);
    env.gain.linearRampToValueAtTime(pk, t + 0.14);
    env.gain.setValueAtTime(pk * 0.92, Math.max(t + 0.15, t + dur - 0.18));
    env.gain.linearRampToValueAtTime(0.0001, t + dur);

    lfo.connect(lfoGain);
    lfoGain.connect(env.gain);
    osc1.connect(flt);
    osc2.connect(flt);
    flt.connect(env);
    env.connect(c.destination);

    osc1.start(t);
    osc2.start(t);
    lfo.start(t);
    osc1.stop(t + dur + 0.04);
    osc2.stop(t + dur + 0.04);
    lfo.stop(t + dur + 0.04);

    // Jemný dechový třpyt
    tone(528, Math.min(0.45, dur * 0.4), 'sine', 0.05, 0.012 * intensity, 660);
  } catch {}
}

/**
 * Křupnutí pamlsku pro Molly (3 křupavé mikro-impulsy + spokojené vrknutí)
 */
export function playMollyCrunch() {
  if (isSoundMuted()) return;
  try {
    [0, 0.075, 0.155].forEach((d, i) => {
      noiseBurst(0.022, 1280 + i * 240, 6.2, d, 0.042);
      tone(380 + i * 90, 0.06, 'triangle', d, 0.02);
    });
    tone(587.33, 0.18, 'sine', 0.21, 0.024, 783.99);
  } catch {}
}

/**
 * Melodické mňouknutí Molly (formantová kontura 440 Hz -> 690 Hz -> 590 Hz)
 */
export function playMollyMeow() {
  if (isSoundMuted()) return;
  const c = ctx();
  if (!c) return;
  try {
    const t = c.currentTime;
    const dur = 0.36;
    const osc = c.createOscillator();
    const flt = c.createBiquadFilter();
    const g = c.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(690, t + 0.13);
    osc.frequency.exponentialRampToValueAtTime(590, t + dur);

    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(1150, t);
    flt.Q.setValueAtTime(2.4, t);

    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.032, t + 0.05);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);

    osc.connect(flt);
    flt.connect(g);
    g.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  } catch {}
}

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
        g?.gain.setTargetAtTime(0.0001, ac?.currentTime || 0, 0.02)
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
export function playPayoffAsmr(actionOrMode = 'kibble') {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (now - lastAsmrTs < 80) return;
  lastAsmrTs = now;

  const spec =
    typeof actionOrMode === 'object' && actionOrMode !== null
      ? resolveActionEffectSpec(actionOrMode)
      : ACTION_EFFECT_CATALOG[actionOrMode] ||
        MODE_LOOKUP[actionOrMode] || {
          asmr: actionOrMode === 'kibble' ? 'kibble' : actionOrMode
        };
  const kind = spec.asmr || 'light';

  if (kind === 'kibble') {
    for (let k = 0; k < 12; k++) {
      noiseBurst(0.018, 950 + ((k * 137) % 700), 6.5, k * 0.038, 0.05);
    }
    tone(523.25, 0.35, 'sine', 0.38);
    tone(659.25, 0.35, 'triangle', 0.43);
    tone(783.99, 0.42, 'sine', 0.48);
    return;
  }

  if (kind === 'rice') {
    for (let k = 0; k < 16; k++) {
      noiseBurst(0.012, 1850 + ((k * 193) % 1100), 8.0, k * 0.026, 0.035);
    }
    [587.33, 739.99, 880, 1174.66].forEach((f, i) =>
      tone(f, 0.28, 'sine', 0.34 + i * 0.05, 0.03)
    );
    return;
  }

  if (kind === 'strnad') {
    [1760, 1760, 1760].forEach((f, i) =>
      tone(f, 0.09, 'sine', i * 0.11, 0.03, f * 1.06)
    );
    tone(1480, 0.42, 'triangle', 0.36, 0.035, 1318.5);
    return;
  }

  if (kind === 'birds') {
    tone(1318.5, 0.14, 'sine', 0.02, 0.03, 1760);
    tone(1567.98, 0.16, 'sine', 0.16, 0.03, 2093);
    tone(1760, 0.26, 'triangle', 0.32, 0.028, 1567.98);
    return;
  }

  if (kind === 'heartbeat') {
    tone(68, 0.14, 'sine', 0.02, 0.06, 52);
    tone(86, 0.16, 'sine', 0.18, 0.055, 60);
    tone(523.25, 0.36, 'sine', 0.36, 0.03);
    tone(659.25, 0.4, 'triangle', 0.42, 0.028);
    return;
  }

  if (kind === 'typewriter') {
    for (let k = 0; k < 5; k++) {
      noiseBurst(0.014, 1400 + k * 180, 7.0, k * 0.052, 0.04);
    }
    tone(659.25, 0.28, 'triangle', 0.28, 0.032);
    tone(987.77, 0.36, 'sine', 0.34, 0.032);
    return;
  }

  if (kind === 'sonar') {
    tone(880, 0.14, 'sine', 0.0, 0.03);
    tone(1318.5, 0.18, 'sine', 0.14, 0.03);
    tone(1760, 0.32, 'triangle', 0.28, 0.028);
    return;
  }

  if (kind === 'musicbox') {
    [523.25, 659.25, 783.99, 987.77, 1046.5].forEach((f, i) =>
      tone(f, 0.34, 'triangle', i * 0.07, 0.03)
    );
    return;
  }

  if (kind === 'pages') {
    for (let k = 0; k < 4; k++) {
      noiseBurst(0.04, 800 + k * 240, 3.2, k * 0.068, 0.032);
    }
    tone(523.25, 0.3, 'sine', 0.26, 0.03);
    tone(659.25, 0.36, 'triangle', 0.32, 0.03);
    return;
  }

  if (kind === 'water') {
    tone(580, 0.12, 'sine', 0.02, 0.038, 1240);
    tone(720, 0.14, 'sine', 0.16, 0.035, 1480);
    tone(880, 0.32, 'triangle', 0.32, 0.028, 1568);
    return;
  }

  if (kind === 'forest') {
    noiseBurst(0.22, 620, 1.8, 0.01, 0.026);
    [392, 440, 523.25, 659.25].forEach((f, i) =>
      tone(f, 0.36, 'triangle', 0.06 + i * 0.062, 0.03)
    );
    return;
  }

  if (kind === 'campfire') {
    noiseBurst(0.24, 380, 1.5, 0.0, 0.024);
    for (let k = 0; k < 6; k++) {
      noiseBurst(0.011, 1750 + ((k * 230) % 950), 7.5, 0.03 + k * 0.052, 0.035);
    }
    [329.63, 493.88, 659.25].forEach((f, i) =>
      tone(f, 0.38, 'triangle', 0.1 + i * 0.075, 0.028)
    );
    return;
  }

  if (kind === 'bicycle') {
    for (let k = 0; k < 6; k++) {
      noiseBurst(0.01, 2200, 9.0, k * 0.038, 0.03);
    }
    tone(1046.5, 0.38, 'sine', 0.24, 0.04);
    tone(1567.98, 0.42, 'triangle', 0.3, 0.035);
    return;
  }

  if (kind === 'bowl') {
    tone(432, 0.65, 'sine', 0.0, 0.038);
    tone(648, 0.6, 'triangle', 0.06, 0.025);
    tone(864, 0.5, 'sine', 0.12, 0.016);
    return;
  }

  if (kind === 'harp') {
    [523.25, 587.33, 659.25, 783.99, 880, 1046.5].forEach((f, i) =>
      tone(f, 0.38, i % 2 ? 'triangle' : 'sine', i * 0.048, 0.03)
    );
    return;
  }

  if (kind === 'warmth') {
    noiseBurst(0.16, 480, 2.0, 0.02, 0.022);
    [349.23, 440, 523.25, 659.25].forEach((f, i) =>
      tone(f, 0.38, 'sine', 0.04 + i * 0.062, 0.032)
    );
    return;
  }

  if (kind === 'crystal') {
    [1046.5, 1318.5, 1567.98, 2093].forEach((f, i) =>
      tone(f, 0.36, 'sine', i * 0.055, 0.026)
    );
    tone(783.99, 0.42, 'triangle', 0.02, 0.022);
    return;
  }

  if (kind === 'pop_bloom') {
    [320, 440, 587.33].forEach((f, i) => {
      noiseBurst(0.012, 1600 + i * 300, 6.0, i * 0.08, 0.03);
      tone(f, 0.16, 'sine', i * 0.08, 0.034, f * 2);
    });
    tone(880, 0.3, 'triangle', 0.26, 0.028);
    return;
  }

  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.32, 'sine', i * 0.055));
}

const sync = (r) => {
  mem = r;
  const s = JSON.stringify(r);
  if (win()) {
    sto(sessionStorage, RK, s);
    sto(localStorage, RK, s);
  }
};

export const savePendingPartnerReturn = (a, surface = 'home') =>
  a &&
  sync({
    id: a.id,
    title: a.title || a.name,
    category: a.category || a.kind,
    values: a.values,
    surface,
    ts: Date.now()
  });

export function consumePendingPartnerReturn(m = 3e3) {
  let stored = null;
  if (win()) {
    try {
      stored = JSON.parse(
        sto(sessionStorage, RK) || sto(localStorage, RK) || 'null'
      );
    } catch {}
  }
  const r = mem || stored;
  const dt = r ? Date.now() - (r.ts || 0) : 0;
  if (!r || r.consumed || dt < m || dt > 18e5) return null;
  sync({ ...r, consumed: 1 });
  return { ...r, consumed: true, elapsedMs: dt };
}

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

/**
 * Vykreslí želvovinovou kočičku Mini-Molly na pravé straně interaktivního plátna vedle její zlaté mističky.
 */
function drawCanvasMiniMolly(c, mx, my, bx, byBowl, opts) {
  const {
    t = 0,
    lookX = 150,
    lookY = 46,
    eatTimer = 0,
    treatColor = '#f59e0b',
    treatsCount = 1
  } = opts || {};

  c.save();

  // 1. Zlatem lemovaná mistička pro Molly (bx = w - 48, byBowl = h - 10)
  drawGlow(c, bx, byBowl - 2, 16, treatColor, 0.26 + (eatTimer > 0 ? 0.25 : 0));
  c.fillStyle = '#29211c';
  c.strokeStyle = '#fbbf24';
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(bx - 10, byBowl - 4);
  c.lineTo(bx + 10, byBowl - 4);
  c.lineTo(bx + 7.5, byBowl + 2.5);
  c.lineTo(bx - 7.5, byBowl + 2.5);
  c.closePath();
  c.fill();
  c.stroke();

  // Dobroty v mističce
  const pileCount = Math.min(5, Math.max(2, treatsCount));
  for (let i = 0; i < pileCount; i++) {
    const gx = bx - 5 + i * 2.5;
    const gy = byBowl - 4.8 - (i % 2) * 1.4;
    c.fillStyle = i % 2 === 0 ? treatColor : '#fde68a';
    c.beginPath();
    c.arc(gx, gy, 1.9, 0, Math.PI * 2);
    c.fill();
  }

  // 2. Vícebodový Bézierův ocas (želvovinový s medovou špičkou)
  const tailWag = Math.sin(t * (eatTimer > 0 ? 6.5 : 2.6)) * (eatTimer > 0 ? 6 : 3.5);
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = '#1f1916';
  c.lineWidth = 4.2;
  c.beginPath();
  c.moveTo(mx + 7, my + 4);
  c.bezierCurveTo(
    mx + 16,
    my + 1 + tailWag * 0.4,
    mx + 19,
    my - 10 + tailWag,
    mx + 13 + tailWag * 0.6,
    my - 17
  );
  c.stroke();

  // Zrzavý a medový flíček na ocase
  c.strokeStyle = '#f59e0b';
  c.lineWidth = 2.8;
  c.beginPath();
  c.moveTo(mx + 14, my - 5 + tailWag * 0.5);
  c.quadraticCurveTo(
    mx + 17,
    my - 11 + tailWag * 0.8,
    mx + 13 + tailWag * 0.6,
    my - 17
  );
  c.stroke();
  c.restore();

  // 3. Tělíčko Molly (obsidián #1f1916 s želvovinovými flíčky #f59e0b, #c2410c, #fde68a)
  const bounceY = eatTimer > 0 ? Math.abs(Math.sin(t * 11)) * -2.2 : Math.sin(t * 1.8) * 0.5;
  const cyBody = my + bounceY;

  c.fillStyle = '#1f1916';
  c.strokeStyle = 'rgba(253, 230, 138, 0.35)';
  c.lineWidth = 0.9;
  c.beginPath();
  c.ellipse(mx, cyBody + 1.5, 9.2, 10.8, -0.08, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Želvovinové skvrny na zádech a boku
  c.save();
  c.beginPath();
  c.ellipse(mx, cyBody + 1.5, 9.0, 10.5, -0.08, 0, Math.PI * 2);
  c.clip();

  c.fillStyle = '#c2410c';
  c.beginPath();
  c.ellipse(mx + 3.5, cyBody - 1, 5.2, 4.2, 0.3, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#f59e0b';
  c.beginPath();
  c.ellipse(mx - 3.2, cyBody + 3.2, 4.4, 3.5, -0.25, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#fde68a';
  c.beginPath();
  c.ellipse(mx - 1.5, cyBody + 0.5, 2.6, 3.2, 0.1, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // Tlapky vpředu (jedna zrzavá, druhá tmavá s medovou špičkou)
  c.fillStyle = '#f59e0b';
  c.beginPath();
  c.ellipse(mx - 4.5, my + 10.5, 2.8, 2.0, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#1f1916';
  c.beginPath();
  c.ellipse(mx + 1.5, my + 10.8, 2.8, 2.0, 0, 0, Math.PI * 2);
  c.fill();

  // 4. Hlava Molly s komínovou (chimney-blaze) kresbou
  const hx = mx - 1.2;
  const hy = cyBody - 10.2;

  // Oušká (levé tmavé, pravé zrzavo-terakotové se záškubem)
  const earTwitch = Math.sin(t * 3.7) > 0.88 ? Math.sin(t * 18) * 1.3 : 0;
  c.fillStyle = '#1f1916';
  c.beginPath();
  c.moveTo(hx - 7.2, hy - 2.5);
  c.lineTo(hx - 8.8, hy - 11.5);
  c.lineTo(hx - 1.8, hy - 6.8);
  c.closePath();
  c.fill();

  c.fillStyle = '#c2410c';
  c.beginPath();
  c.moveTo(hx + 1.8, hy - 6.8);
  c.lineTo(hx + 8.6 + earTwitch, hy - 11.5 + earTwitch * 0.5);
  c.lineTo(hx + 7.2, hy - 2.5);
  c.closePath();
  c.fill();

  // Vnitřek oušek
  c.fillStyle = '#fda4af';
  c.beginPath();
  c.moveTo(hx - 6.2, hy - 3.6);
  c.lineTo(hx - 7.3, hy - 9.2);
  c.lineTo(hx - 2.9, hy - 6.0);
  c.closePath();
  c.fill();

  // Hlava — základ + komínové rozdělení
  c.fillStyle = '#1f1916';
  c.beginPath();
  c.arc(hx, hy, 7.8, 0, Math.PI * 2);
  c.fill();

  c.save();
  c.beginPath();
  c.arc(hx, hy, 7.8, 0, Math.PI * 2);
  c.clip();
  // Pravá polovina obličeje jantarovo-zrzavá (typický chimérický blaze želvovinových koček)
  c.fillStyle = '#f59e0b';
  c.beginPath();
  c.moveTo(hx - 0.5, hy - 9);
  c.lineTo(hx + 9, hy - 9);
  c.lineTo(hx + 9, hy + 9);
  c.lineTo(hx + 0.5, hy + 9);
  c.closePath();
  c.fill();

  c.fillStyle = '#fde68a';
  c.beginPath();
  c.ellipse(hx + 2.8, hy + 2.2, 3.2, 2.4, 0.2, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // 5. Zářivé smaragdově-limetkové oči (#84cc16 / #bef264) sledující dění nebo blažené ^ ^ při chroupání
  const dx = Math.max(-1.4, Math.min(1.4, (lookX - hx) * 0.015));
  const dy = Math.max(-1.0, Math.min(1.0, (lookY - hy) * 0.015));

  if (eatTimer > 0) {
    c.strokeStyle = '#bef264';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    [-3.1, 3.1].forEach((ex) => {
      c.beginPath();
      c.arc(hx + ex, hy - 0.2, 2.1, Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
    });
  } else {
    [-3.1, 3.1].forEach((ex) => {
      c.fillStyle = '#84cc16';
      c.shadowColor = '#bef264';
      c.shadowBlur = 4;
      c.beginPath();
      c.ellipse(hx + ex, hy - 0.5, 2.15, 2.0, 0, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;

      // Zornička
      c.fillStyle = '#090d08';
      c.beginPath();
      c.ellipse(hx + ex + dx * 0.55, hy - 0.5 + dy * 0.55, 0.85, 1.45, 0, 0, Math.PI * 2);
      c.fill();

      // Jiskra v oku
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(hx + ex - 0.6, hy - 1.1, 0.55, 0, Math.PI * 2);
      c.fill();
    });
  }

  // Růžovo-terakotový čumáček a tlamička
  c.fillStyle = '#fb7185';
  c.beginPath();
  c.moveTo(hx - 1.3, hy + 1.8);
  c.lineTo(hx + 1.3, hy + 1.8);
  c.lineTo(hx, hy + 3.1);
  c.closePath();
  c.fill();

  if (eatTimer > 0) {
    // Otevřená tlamička při chroupání dobroty
    c.fillStyle = '#f43f5e';
    c.beginPath();
    c.arc(hx, hy + 3.9, 1.4 + Math.sin(t * 24) * 0.5, 0, Math.PI);
    c.fill();
  }

  // 6. Vousky (3 na každé straně)
  c.strokeStyle = 'rgba(254, 243, 199, 0.75)';
  c.lineWidth = 0.7;
  [-1, 1].forEach((dir) => {
    [-1, 0, 1].forEach((row) => {
      c.beginPath();
      c.moveTo(hx + dir * 3.8, hy + 2.2 + row * 1.1);
      c.lineTo(hx + dir * 10.5, hy + 1.5 + row * 1.7 + Math.sin(t * 4 + row) * 0.4);
      c.stroke();
    });
  });

  c.restore();
}

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];

/**
 * Univerzální interaktivní 2D Canvas diorama engine s HiDPI škálováním,
 * 3-fázovým životním cyklem (ambient -> hold-spark charge -> climax supernova)
 * a bohatou světelnou scénou pro všech 45 aktivit.
 */
export function mountImpactCanvas(cv, o = {}) {
  const c = cv?.getContext?.('2d');
  if (!c) return () => {};

  const spec = resolveActionEffectSpec(o.action || o.mode || 'kibble');
  const mode = spec.mode;
  const target = spec.target || 25;
  const cs = spec.colors || ['#34d399', '#10b981', '#fbbf24', '#38bdf8'];
  const w = 300;
  const h = 92;
  const cx = w / 2;
  const cy = h / 2 + 2;
  const red = prefersReducedMotion();
  const by = h - 11;
  const isBowlMode =
    mode === 'kibble' || mode === 'shelter_care' || mode === 'rice';

  let gx = 0;
  let py = 0.5;
  let id = 0;
  let frame = 0;
  let lastReportedVal = -1;
  let burstEnergy = o.climax ? 1.0 : 0.45;
  let isVisible = true;
  let tapCount = 0;
  let bonusUnits = 0;
  let isDragging = false;
  let hasPointer = false;
  let pointerX = cx;
  let pointerY = cy;
  const stepIncrement = Math.max(1, Math.round(target / 5));

  // HiDPI / Retina scaling while keeping aspect-correct uniform 1:1 scene coordinates
  const syncCanvasDpr = () => {
    if (!win() || !cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const rect = cv.getBoundingClientRect?.();
    const cw = rect?.width > 40 ? Math.round(rect.width) : 320;
    const ch = rect?.height > 30 ? Math.round(rect.height) : 112;
    const targetW = Math.max(300, Math.round(cw * dpr));
    const targetH = Math.max(92, Math.round(ch * dpr));
    if (cv.width !== targetW || cv.height !== targetH) {
      cv.width = targetW;
      cv.height = targetH;
    }
  };
  syncCanvasDpr();

  let ro = null;
  if (win() && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      syncCanvasDpr();
    });
    ro.observe(cv);
  }

  // Background twinkling fireflies / bokeh across panoramic stage
  const stars = Array.from({ length: 24 }, (_, i) => ({
    x: (i * 53 + 17) % 520,
    y: 8 + ((i * 29 + 11) % (h - 20)),
    r: 0.9 + (i % 3) * 0.65,
    phase: i * 0.7,
    col: i % 2 === 0 ? '#fde68a' : '#6ee7b7'
  }));

  // Main physics particles
  const ps = Array.from({ length: 36 }, (_, i) => ({
    x: cx + ((i % 7) - 3) * (isBowlMode ? 10 : 18),
    y: red
      ? by - 10 - (i % 4) * 3
      : isBowlMode
        ? -4 - i * 3.6
        : h - 8 - ((i * 11) % (h - 16)),
    vx: ((i % 5) - 2) * 0.42,
    vy: isBowlMode ? 1.45 : -0.6 - (i % 4) * 0.18,
    r: 2.6 + (i % 3) * 0.95,
    phase: i * 0.42,
    c: cs[i % cs.length]
  }));

  // Interactive shockwave rings, treat arcs to Mini-Molly & floating reward popups
  const shockwaves = [
    { x: cx, y: cy, r: 6, maxR: 88, alpha: 0.75, col: cs[0] || '#34d399' }
  ];
  const popups = [];
  const sparks = [];
  const treatArcs = [];
  const mollyTreat = spec.mollyTreat || resolveMollyTreat(spec);
  const mollyX = w - 26;
  const mollyY = h - 16;
  const mollyBowlX = w - 48;
  const mollyBowlY = h - 10;
  let mollyEatTimer = o.climax ? 0.85 : 0;
  let mollyTreatsCount = 1;
  let totalTreatArcsLaunched = 0;

  if (cv) {
    cv.dataset.mollyMini = 'ready';
    cv.dataset.mollyTreat = mollyTreat.foodType;
    cv.dataset.mollyArcs = '0';
  }

  const launchTreatArc = (fromX = cx, fromY = cy, addBonus = false) => {
    totalTreatArcsLaunched++;
    if (cv) {
      cv.dataset.mollyArcs = String(totalTreatArcsLaunched);
    }
    const targetX = w - 32;
    const targetY = h - 20;
    const ctrlX = (fromX + targetX) * 0.5;
    const ctrlY = Math.min(10, Math.min(fromY, targetY) - 28);
    treatArcs.push({
      x0: fromX,
      y0: fromY,
      cx: ctrlX,
      cy: ctrlY,
      x1: targetX,
      y1: targetY,
      p: 0,
      speed: red ? 0.25 : 0.042,
      color: mollyTreat.color || '#f59e0b',
      icon: mollyTreat.icon || '🐟',
      addBonus,
      notified: false
    });
  };

  if (o.climax) {
    launchTreatArc(cx, cy, false);
  }

  const emitProgress = (ratio) => {
    const baseVal = Math.max(1, Math.min(target, Math.round(target * ratio)));
    const totalVal = baseVal + bonusUnits;
    if (totalVal !== lastReportedVal) {
      lastReportedVal = totalVal;
      o.onWeightUpdate?.(totalVal, spec.format(totalVal), spec);
    }
  };

  const spawnBurst = (tx = cx, ty = cy, isSuper = false, addBonus = false) => {
    if (addBonus) {
      bonusUnits += isSuper ? stepIncrement * 2 : stepIncrement;
      emitProgress(1);
    }
    launchTreatArc(tx, ty, addBonus);
    if (addBonus) {
      mollyEatTimer = Math.max(mollyEatTimer, 0.7);
      mollyTreatsCount = Math.min(6, mollyTreatsCount + 1);
      notifyMollySpark(o.action || spec.mode, {
        surface: 'canvas',
        fromCanvas: true
      });
    }
    if (!id && isVisible) {
      id = requestAnimationFrame(fn);
    }
    burstEnergy = Math.min(1.6, burstEnergy + (isSuper ? 1.15 : 0.72));
    shockwaves.push({
      x: tx,
      y: ty,
      r: 4,
      maxR: isSuper ? 128 : 84,
      alpha: 0.92,
      col: isSuper ? '#fde047' : cs[0] || '#34d399'
    });
    if (isSuper) {
      shockwaves.push({
        x: tx,
        y: ty,
        r: 12,
        maxR: 145,
        alpha: 0.7,
        col: '#34d399'
      });
    }
    const count = isSuper ? 24 : 14;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + (frame % 7) * 0.15;
      const spd = (isSuper ? 2.4 : 1.7) + (i % 4) * 0.65;
      sparks.push({
        x: tx,
        y: ty,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.5,
        r: isSuper ? 2.6 + (i % 3) : 2.1 + (i % 2),
        alpha: 1,
        col: cs[i % cs.length] || '#fde047'
      });
    }
    for (let i = 0; i < 8; i++) {
      const p = ps[(frame + i) % ps.length];
      p.x = tx + ((i % 3) - 1) * 7;
      p.y = ty;
      p.vx = Math.cos(i * 0.8) * 2.1;
      p.vy = isBowlMode ? -2.5 : -1.7;
    }
    if (popups.length < 4) {
      const currentTotal = target + bonusUnits;
      const badgeLabel = isSuper
        ? `✨ ${spec.format(currentTotal)}`
        : `${spec.icon || '✨'} +${stepIncrement}`;
      popups.push({
        x: Math.max(24, Math.min(w - 24, tx)),
        y: Math.max(28, Math.min(h - 14, ty - 4)),
        vy: -0.65,
        alpha: 1,
        text: badgeLabel
      });
    }
  };

  const controller = {
    cv,
    spec,
    triggerBurst(superBurst = true) {
      spawnBurst(cx, cy + 4, Boolean(superBurst), true);
      if (superBurst) {
        playPayoffAsmr(spec);
      } else {
        const f = PENTATONIC[tapCount % PENTATONIC.length];
        tone(f, 0.18, 'sine', 0, 0.03);
        tone(f * 1.5, 0.22, 'triangle', 0.03, 0.022);
      }
      tapCount++;
    }
  };
  activeControllers.add(controller);
  cv.__triggerBurst = controller.triggerBurst;

  if (red) emitProgress(1);

  const mapPointerToScene = (e) => {
    const b = cv.getBoundingClientRect();
    if (!b.width || !b.height) return { tx: cx, ty: cy };
    const scale = (cv.height || 92) / h;
    const fullW = Math.max(w, (cv.width || 300) / scale);
    const offsetX = (fullW - w) / 2;
    const tx = ((e.clientX - b.left) / b.width) * fullW - offsetX;
    const ty = ((e.clientY - b.top) / b.height) * h;
    return { tx, ty };
  };

  const onO = (e) => {
    if (typeof e?.gamma === 'number') {
      gx = Math.max(-0.42, Math.min(0.42, e.gamma * 0.01));
    }
  };
  const onP = (e) => {
    const b = cv.getBoundingClientRect();
    if (b.width) {
      gx = ((e.clientX - b.left) / b.width - 0.5) * 0.48;
      py = Math.max(0.1, Math.min(0.9, (e.clientY - b.top) / (b.height || 92)));
      const { tx, ty } = mapPointerToScene(e);
      hasPointer = true;
      pointerX = tx;
      pointerY = ty;
      if (isDragging && frame % 3 === 0) {
        sparks.push({
          x: tx,
          y: ty,
          vx: (Math.random() - 0.5) * 1.8,
          vy: -0.9 - Math.random() * 0.9,
          r: 2.2,
          alpha: 0.95,
          col: cs[frame % cs.length] || '#fde047'
        });
      }
    }
  };
  const onDown = (e) => {
    isDragging = true;
    const { tx, ty } = mapPointerToScene(e);
    hasPointer = true;
    pointerX = tx;
    pointerY = ty;
    spawnBurst(tx, ty, false, true);
    const f = PENTATONIC[tapCount % PENTATONIC.length];
    tone(f, 0.18, 'triangle', 0, 0.028);
    tone(f * 1.25, 0.22, 'sine', 0.04, 0.02);
    tapCount++;
  };
  const onUpOrLeave = () => {
    isDragging = false;
  };

  let io = null;
  if (win() && typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const nowVis = entry.isIntersecting;
          if (nowVis && !isVisible && !red && !id) {
            isVisible = true;
            id = requestAnimationFrame(fn);
          } else {
            isVisible = nowVis;
          }
        }
      },
      { threshold: 0.02 }
    );
    io.observe(cv);
  }

  addEventListener('deviceorientation', onO);
  cv.addEventListener('pointermove', onP);
  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointerup', onUpOrLeave);
  cv.addEventListener('pointerleave', onUpOrLeave);
  cv.addEventListener('pointercancel', onUpOrLeave);

  const fn = () => {
    id = 0;
    frame++;
    const charge = globalSparkCharge;
    burstEnergy = Math.max(0, burstEnergy * 0.94);
    const t = frame * (0.048 + charge * 0.04 + burstEnergy * 0.02);

    // Uniform 1:1 scaling so circles, stars, hearts, and scenes are NEVER squashed/stretched
    const scale = (cv.height || 92) / h;
    const fullW = Math.max(w, (cv.width || 300) / scale);
    const offsetX = (fullW - w) / 2;
    const leftEdge = -offsetX - 2;
    const rightEdge = w + offsetX + 2;

    c.save();
    c.setTransform(scale, 0, 0, scale, offsetX * scale, 0);
    c.clearRect(leftEdge, 0, fullW + 4, h);

    // 1. Hluboké smaragdové nokturno & polární záře (Krajina dobra styl)
    const bgGrad = c.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#04140e');
    bgGrad.addColorStop(0.55, '#092318');
    bgGrad.addColorStop(1, '#0e3625');
    c.fillStyle = bgGrad;
    c.fillRect(leftEdge, 0, fullW + 4, h);

    // Dýchající polární záře v barvách aktivity
    drawGlow(
      c,
      cx + gx * 30 + Math.sin(t * 0.7) * 18,
      cy - 4,
      92 + charge * 30 + burstEnergy * 24,
      cs[0] || '#34d399',
      0.24 + charge * 0.18 + burstEnergy * 0.14
    );
    drawGlow(
      c,
      cx - gx * 24 + Math.cos(t * 0.5) * 24,
      cy + 10,
      66 + charge * 22,
      cs[2] || '#fbbf24',
      0.18 + charge * 0.22 + burstEnergy * 0.16
    );
    if (hasPointer) {
      drawGlow(c, pointerX, pointerY, 28, cs[0] || '#fde047', isDragging ? 0.34 : 0.16);
    }

    // Jemná silueta českých kopců v pozadí a světelná mlha u země
    c.fillStyle = 'rgba(4, 18, 12, 0.52)';
    c.beginPath();
    c.moveTo(leftEdge, h);
    c.lineTo(leftEdge, by - 4);
    c.quadraticCurveTo(cx - 90, by - 16, cx, by - 6);
    c.quadraticCurveTo(cx + 95, by + 2, rightEdge, by - 10);
    c.lineTo(rightEdge, h);
    c.closePath();
    c.fill();

    const floorGrad = c.createLinearGradient(leftEdge + 16, by, rightEdge - 16, by);
    floorGrad.addColorStop(0, 'rgba(52, 211, 153, 0)');
    floorGrad.addColorStop(0.5, 'rgba(110, 231, 183, 0.32)');
    floorGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
    c.fillStyle = floorGrad;
    c.fillRect(leftEdge + 12, by + 1, fullW - 24, 2);

    // 2. Parallaxní hvězdný prach a světlušky v celé šířce panoramatu
    for (let s = 0; s < stars.length; s++) {
      const st = stars[s];
      const sx = leftEdge + ((st.x + gx * (10 + (s % 4) * 4) + fullW) % fullW);
      const sy = st.y + Math.sin(t * 0.9 + st.phase) * 2.2;
      const alpha = 0.25 + 0.55 * Math.abs(Math.sin(t * 1.3 + st.phase));
      c.fillStyle = st.col;
      c.globalAlpha = alpha;
      c.beginPath();
      c.arc(sx, sy, st.r, 0, 6.28);
      c.fill();
    }
    c.globalAlpha = 1;

    // 3. Stage-2 Hold-to-Spark energetický vír při podržení primárního tlačítka
    if (charge > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const ringR = 54 * (1 - charge * 0.55);
      c.strokeStyle = '#fde047';
      c.lineWidth = 1.6 + charge * 2.2;
      c.globalAlpha = 0.35 + charge * 0.55;
      c.beginPath();
      c.arc(cx, cy, ringR, t * 2, t * 2 + Math.PI * 1.45);
      c.stroke();
      c.strokeStyle = '#34d399';
      c.beginPath();
      c.arc(cx, cy, ringR * 0.72, -t * 2.5, -t * 2.5 + Math.PI * 1.35);
      c.stroke();
      c.restore();
    }

    let settledCount = 0;

    // 4. Fyzika částic se světelnou stopou
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const fl = by - 4 - (i % 3) * 2.4;
      if (!red) {
        if (charge > 0.05) {
          // Při nabíjení přitahujeme částice ke středu
          p.vx += (cx - p.x) * 0.012 * charge;
          p.vy += (cy - p.y) * 0.012 * charge;
        }
        if (isBowlMode) {
          p.vx = (p.vx + gx) * 0.92;
          p.vy += 0.42;
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > fl) {
            p.y = fl;
            p.vy *= -0.38;
          }
          if (p.x < 78 || p.x > w - 78) {
            p.x = p.x < 78 ? 78 : w - 78;
            p.vx *= -0.5;
          }
        } else if (mode === 'water_spring' || mode === 'blood_drop') {
          p.x += p.vx + gx * 1.4;
          p.vy += 0.18;
          p.y += p.vy;
          if (p.y > by - 4) {
            p.y = 14 + (i % 3) * 5;
            p.x = cx + ((i % 5) - 2) * 14;
            p.vy = 0.6 + (i % 3) * 0.3;
          }
        } else if (mode === 'cosmos_science') {
          const ang = p.phase + t * 0.7;
          const rad = 14 + ((i * 3.8) % 68);
          p.x = cx + Math.cos(ang) * rad * 1.5 + gx * 28;
          p.y = cy + Math.sin(ang) * (rad * 0.48);
        } else {
          p.vx = (p.vx + gx * 0.6 + Math.sin(t + p.phase) * 0.045) * 0.94;
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < 6) {
            p.y = h - 8;
            p.x = 24 + ((i * 37 + frame) % (w - 48));
          }
          if (p.x < 10) p.x = w - 10;
          if (p.x > w - 10) p.x = 10;
        }
      }

      if (isBowlMode) {
        if (p.y >= by - 22) settledCount++;
        c.fillStyle = p.c;
        c.beginPath();
        if (mode === 'rice') {
          c.ellipse(p.x, p.y, 4.3, 2.1, (i % 5) * 0.3, 0, 6.28);
          c.fill();
        } else {
          c.arc(p.x, p.y, 3.8, 0, 6.28);
          c.fill();
          // Odlesk na granulce
          c.fillStyle = 'rgba(255,255,255,0.45)';
          c.beginPath();
          c.arc(p.x - 1, p.y - 1, 1.2, 0, 6.28);
          c.fill();
        }
      } else {
        settledCount++;
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = p.c;
        c.globalAlpha = 0.78;
        c.beginPath();
        c.arc(p.x, p.y, p.r * (1 + burstEnergy * 0.2), 0, 6.28);
        c.fill();
        c.restore();
      }
    }

    // 5. Unikátní ústřední iluminovaná scéna podle aktivity (všech 45 aktivit)
    c.save();
    const scaleBoost = 1 + charge * 0.08 + burstEnergy * 0.05;
    c.translate(cx, cy);
    c.scale(scaleBoost, scaleBoost);
    c.translate(-cx, -cy);

    if (isBowlMode) {
      emitProgress(settledCount / ps.length);
      if (mode === 'shelter_care') {
        // Zlatá stříška útulku + zářící tlapky nad miskou
        c.strokeStyle = '#fde68a';
        c.shadowColor = '#fbbf24';
        c.shadowBlur = 10;
        c.lineWidth = 2.8;
        c.beginPath();
        c.moveTo(cx - 58, 28);
        c.lineTo(cx, 9);
        c.lineTo(cx + 58, 28);
        c.stroke();
        drawPaw(c, cx - 36, 26, 7.5, '#fbbf24');
        drawPaw(c, cx + 36, 26, 7.5, '#34d399');
      }
      // 3D stínovaná keramická miska
      const bowlGrad = c.createLinearGradient(64, by - 16, 64, by + 5);
      bowlGrad.addColorStop(0, mode === 'rice' ? 'rgba(56, 189, 248, 0.42)' : 'rgba(16, 185, 129, 0.45)');
      bowlGrad.addColorStop(1, mode === 'rice' ? 'rgba(2, 132, 199, 0.85)' : 'rgba(5, 150, 105, 0.88)');
      c.fillStyle = bowlGrad;
      c.strokeStyle = mode === 'rice' ? '#7dd3fc' : '#6ee7b7';
      c.lineWidth = 2.8;
      c.beginPath();
      c.moveTo(64, by - 15);
      c.lineTo(84, by + 4);
      c.lineTo(w - 84, by + 4);
      c.lineTo(w - 64, by - 15);
      c.closePath();
      c.fill();
      c.stroke();
      // Horní elipsa okraje misky
      c.strokeStyle = 'rgba(253, 230, 138, 0.75)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.ellipse(cx, by - 15, w / 2 - 64, 4.2, 0, 0, 6.28);
      c.stroke();
      drawPaw(c, cx, by - 5, 5.2, '#fde68a');
      if (settledCount > 12) {
        drawHeart(c, cx + Math.sin(t * 2) * 12, 22 - Math.abs(Math.sin(t)) * 6, 7.5, '#fbbf24');
        drawHeart(c, cx - 24 + Math.cos(t * 1.7) * 8, 28 - Math.abs(Math.cos(t)) * 5, 5.5, '#fb7185');
      }
    } else {
      const prog = red ? 1 : Math.min(1, frame / 36);
      emitProgress(prog);

      if (mode === 'birds_glass') {
        // Noční okno s UV ochrannými hvězdami a svítícími siluetami ptáků
        c.fillStyle = 'rgba(56, 189, 248, 0.14)';
        c.strokeStyle = '#7dd3fc';
        c.lineWidth = 1.8;
        c.fillRect(46, 14, w - 92, h - 28);
        c.strokeRect(46, 14, w - 92, h - 28);
        for (let gxIdx = 0; gxIdx < 6; gxIdx++) {
          for (let gyIdx = 0; gyIdx < 2; gyIdx++) {
            drawStar(
              c,
              68 + gxIdx * 32,
              30 + gyIdx * 28,
              3.8 + Math.sin(t * 3 + gxIdx + gyIdx) * 0.8,
              (gxIdx + gyIdx) % 2 ? '#38bdf8' : '#fde047'
            );
          }
        }
        for (let b = 0; b < 3; b++) {
          const bx = ((frame * 1.9 + b * 85) % (w - 40)) + 20;
          const byPos = 22 + b * 14 + Math.sin(t * 2 + b) * 5;
          drawBird(c, bx, byPos, Math.sin(t * 4.5 + b), 10 + b * 2, b === 1 ? '#fde047' : '#6ee7b7');
        }
      } else if (mode === 'birds_song') {
        // Zlatý a smaragdový spektrogram zpěvu strnada + zpívající ptáci
        c.strokeStyle = 'rgba(110, 231, 183, 0.24)';
        c.lineWidth = 1;
        for (let l = 0; l < 4; l++) {
          c.beginPath();
          c.moveTo(34, 18 + l * 10);
          c.lineTo(w - 34, 18 + l * 10);
          c.stroke();
        }
        for (let b = 0; b < 17; b++) {
          const bh = 10 + Math.abs(Math.sin(t * 2.9 + b * 0.52)) * 34 * (1 + burstEnergy * 0.3);
          const barGrad = c.createLinearGradient(0, h - 12 - bh, 0, h - 12);
          barGrad.addColorStop(0, '#fde047');
          barGrad.addColorStop(1, b % 2 ? '#10b981' : '#34d399');
          c.fillStyle = barGrad;
          c.fillRect(44 + b * 12.5, h - 12 - bh, 8, bh);
        }
        drawBird(c, cx - 52 + Math.sin(t) * 14, 24, Math.sin(t * 5), 11, '#fde047');
        drawBird(c, cx + 50 + Math.cos(t) * 14, 20, Math.cos(t * 5), 10, '#6ee7b7');
      } else if (mode === 'wildlife_rescue') {
        // Ježek v bezpečí v ochranném smaragdovém biopoli
        for (let r = 1; r <= 3; r++) {
          c.strokeStyle = r === 1 ? 'rgba(253, 224, 71, 0.5)' : 'rgba(52, 211, 153, 0.35)';
          c.lineWidth = 1.6;
          c.beginPath();
          c.arc(cx, cy + 2, 18 + r * 11 + Math.sin(t * 2 + r) * 3, 0, 6.28);
          c.stroke();
        }
        c.fillStyle = '#d97706';
        for (let s = 0; s < 9; s++) {
          const ang = Math.PI + (s / 8) * Math.PI;
          c.beginPath();
          c.moveTo(cx - 6 + Math.cos(ang) * 14, cy + 8 + Math.sin(ang) * 12);
          c.lineTo(cx - 6 + Math.cos(ang) * 24, cy + 8 + Math.sin(ang) * 20);
          c.lineTo(cx - 2 + Math.cos(ang + 0.2) * 14, cy + 8 + Math.sin(ang + 0.2) * 12);
          c.fill();
        }
        c.fillStyle = '#f59e0b';
        c.beginPath();
        c.ellipse(cx - 2, cy + 8, 16, 11, 0, 0, 6.28);
        c.fill();
        c.fillStyle = '#fef3c7';
        c.beginPath();
        c.moveTo(cx + 10, cy + 2);
        c.lineTo(cx + 22, cy + 8);
        c.lineTo(cx + 10, cy + 14);
        c.fill();
        c.fillStyle = '#04140e';
        c.beginPath();
        c.arc(cx + 21, cy + 8, 2.2, 0, 6.28);
        c.arc(cx + 12, cy + 6, 1.8, 0, 6.28);
        c.fill();
        drawHeart(c, cx, 16, 6.5, '#34d399');
      } else if (mode === 'satellite_map') {
        // Satelitní orbitální radar Missing Maps s 3D budovami
        c.strokeStyle = 'rgba(34, 211, 238, 0.24)';
        c.lineWidth = 1;
        for (let x = 28; x < w; x += 32) {
          c.beginPath();
          c.moveTo(x, 8);
          c.lineTo(x, h - 8);
          c.stroke();
        }
        const scanX = red ? w - 36 : ((frame * 3.1) % (w - 56)) + 28;
        // Světelný kužel skeneru
        const scanGrad = c.createLinearGradient(scanX - 36, 0, scanX, 0);
        scanGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
        scanGrad.addColorStop(1, 'rgba(52, 211, 153, 0.36)');
        c.fillStyle = scanGrad;
        c.fillRect(Math.max(20, scanX - 36), 8, 36, h - 16);

        for (let b = 0; b < 6; b++) {
          const bx = 40 + b * 38;
          const byRect = 22 + (b % 2) * 24;
          const active = Math.abs(bx - scanX) < 90 || bx <= scanX || red;
          c.strokeStyle = active ? '#6ee7b7' : 'rgba(148, 163, 184, 0.35)';
          c.fillStyle = active ? 'rgba(16, 185, 129, 0.38)' : 'rgba(30, 41, 59, 0.4)';
          c.lineWidth = active ? 2 : 1;
          c.fillRect(bx, byRect, 24, 18);
          c.strokeRect(bx, byRect, 24, 18);
          if (active) {
            drawStar(c, bx + 12, byRect + 9, 3.2, '#fde047');
          }
        }
        c.strokeStyle = '#22d3ee';
        c.shadowColor = '#22d3ee';
        c.shadowBlur = 10;
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(scanX, 6);
        c.lineTo(scanX, h - 6);
        c.stroke();
      } else if (mode === 'code_nodes') {
        // Digitální neuronová síť Česko.Digital se světelnými pulsy
        const nodes = [
          [cx - 74, cy - 16],
          [cx - 44, cy + 18],
          [cx - 18, cy - 22],
          [cx, cy + 8],
          [cx + 22, cy - 20],
          [cx + 46, cy + 18],
          [cx + 74, cy - 12],
          [cx, cy - 26]
        ];
        c.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        c.lineWidth = 1.8;
        for (let i = 0; i < nodes.length - 1; i++) {
          const [x1, y1] = nodes[i];
          const [x2, y2] = nodes[i + 1];
          c.beginPath();
          c.moveTo(x1, y1);
          c.lineTo(x2, y2);
          c.stroke();
          const pRatio = (t * 0.9 + i * 0.25) % 1;
          drawStar(
            c,
            x1 + (x2 - x1) * pRatio,
            y1 + (y2 - y1) * pRatio,
            4.2,
            '#fde047'
          );
        }
        nodes.forEach(([nx, ny], idx) => {
          const col = idx % 2 === 0 ? '#38bdf8' : '#34d399';
          drawGlow(c, nx + gx * 8, ny, 11, col, 0.5);
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(nx + gx * 8, ny + Math.sin(t * 2 + idx) * 2.5, 4.2, 0, 6.28);
          c.fill();
        });
      } else if (mode === 'safe_crosswalk') {
        // Světelný bezbariérový přechod Chodci sobě
        c.fillStyle = 'rgba(15, 23, 42, 0.45)';
        c.fillRect(42, cy - 14, w - 84, 34);
        for (let s = 0; s < 6; s++) {
          c.fillStyle = 'rgba(248, 250, 252, 0.88)';
          c.fillRect(56 + s * 32, cy - 10, 18, 26);
        }
        c.strokeStyle = '#34d399';
        c.shadowColor = '#34d399';
        c.shadowBlur = 10;
        c.lineWidth = 3.2;
        c.beginPath();
        c.moveTo(46, cy + 4);
        c.quadraticCurveTo(cx, cy - 20, w - 46, cy + 4);
        c.stroke();
        const dotX = 56 + ((frame * 2.2) % (w - 112));
        drawStar(c, dotX, cy - 6, 7.5, '#fde047');
      } else if (mode === 'dna_helix') {
        for (let k = 0; k < 16; k++) {
          const x = 40 + k * 14.5;
          const y1 = cy + Math.sin(t * 2 + k * 0.45) * 22;
          const y2 = cy + Math.sin(t * 2 + k * 0.45 + Math.PI) * 22;
          c.strokeStyle = 'rgba(192, 132, 252, 0.48)';
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(x, y1);
          c.lineTo(x, y2);
          c.stroke();
          c.fillStyle = '#c084fc';
          c.shadowColor = '#c084fc';
          c.shadowBlur = 6;
          c.beginPath();
          c.arc(x, y1, 3.6, 0, 6.28);
          c.fill();
          c.fillStyle = '#34d399';
          c.shadowColor = '#34d399';
          c.beginPath();
          c.arc(x, y2, 3.6, 0, 6.28);
          c.fill();
        }
      } else if (mode === 'ecg_rescue') {
        c.strokeStyle = '#fb7185';
        c.shadowColor = '#f43f5e';
        c.shadowBlur = 12;
        c.lineWidth = 2.8;
        c.beginPath();
        for (let x = 24; x < w - 24; x += 3) {
          const d = Math.abs(x - cx);
          const spike =
            d < 6 ? -28 : d < 12 ? 20 : d < 22 ? -9 * Math.sin(d) : 0;
          const y = cy + 4 + spike + Math.sin(x * 0.08 - t * 3) * 2;
          if (x === 24) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
        drawHeart(c, cx, 16, 9 + Math.sin(t * 4) * 2, '#f43f5e');
      } else if (mode === 'blood_drop') {
        // Zářící rubínová kapka krve + 3 zachráněná srdce
        const dropY = 24 + Math.sin(t * 2.5) * 3;
        drawGlow(c, cx, dropY + 6, 36, '#f43f5e', 0.45);
        const dropGrad = c.createRadialGradient(cx - 4, dropY + 4, 2, cx, dropY + 8, 18);
        dropGrad.addColorStop(0, '#fda4af');
        dropGrad.addColorStop(0.5, '#f43f5e');
        dropGrad.addColorStop(1, '#9f1239');
        c.fillStyle = dropGrad;
        c.beginPath();
        c.moveTo(cx, dropY - 13);
        c.bezierCurveTo(cx - 15, dropY + 4, cx - 13, dropY + 21, cx, dropY + 21);
        c.bezierCurveTo(cx + 13, dropY + 21, cx + 15, dropY + 4, cx, dropY - 13);
        c.fill();
        [-48, 0, 48].forEach((dx, idx) => {
          drawHeart(
            c,
            cx + dx,
            by - 17 - Math.abs(Math.sin(t * 2.2 + idx)) * 5,
            8,
            idx === 1 ? '#fde047' : '#fb7185'
          );
        });
      } else if (mode === 'hair_silk') {
        for (let s = 0; s < 4; s++) {
          c.strokeStyle = s % 2 === 0 ? '#fde047' : '#f472b6';
          c.shadowColor = c.strokeStyle;
          c.shadowBlur = 8;
          c.lineWidth = 3.2;
          c.beginPath();
          for (let x = 34; x <= w - 34; x += 5) {
            const y =
              cy +
              Math.sin(x * 0.06 + t * 2.2 + (s * Math.PI) / 2) * 15 +
              (s - 1.5) * 3.5;
            if (x === 34) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          c.stroke();
        }
        drawHeart(c, cx, cy - 8, 9, '#f472b6');
      } else if (mode === 'mind_wave') {
        [cs[0], cs[1], cs[2], '#fde047'].forEach((col, idx) => {
          c.strokeStyle = col;
          c.shadowColor = col;
          c.shadowBlur = 8;
          c.lineWidth = 2.5;
          c.beginPath();
          for (let x = 16; x <= w - 16; x += 6) {
            const y =
              cy +
              (idx - 1.5) * 6 +
              Math.sin(x * 0.038 + t * 2.1 + idx * 0.8) * (12 + py * 6);
            if (x === 16) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          c.stroke();
        });
      } else if (mode === 'breath_lotus') {
        const breath = 1 + Math.sin(t * 1.6) * 0.2;
        c.strokeStyle = 'rgba(94, 234, 212, 0.55)';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(cx, cy + 2, 26 * breath, 0, 6.28);
        c.stroke();
        [-0.95, -0.48, 0, 0.48, 0.95].forEach((ang, idx) => {
          c.save();
          c.translate(cx, cy + 16);
          c.rotate(ang * breath);
          c.fillStyle = idx === 2 ? '#fde68a' : idx % 2 === 0 ? '#2dd4bf' : '#6ee7b7';
          c.shadowColor = '#5eead4';
          c.shadowBlur = 10;
          c.beginPath();
          c.ellipse(0, -17, 7.5, 17, 0, 0, 6.28);
          c.fill();
          c.restore();
        });
      } else if (mode === 'prism_support') {
        const rainbow = ['#fb7185', '#fbbf24', '#facc15', '#34d399', '#38bdf8', '#c084fc'];
        c.strokeStyle = '#fef08a';
        c.shadowColor = '#fde047';
        c.shadowBlur = 10;
        c.lineWidth = 3.2;
        c.beginPath();
        c.moveTo(28, cy + 8);
        c.lineTo(cx - 12, cy);
        c.stroke();
        rainbow.forEach((col, i) => {
          c.strokeStyle = col;
          c.shadowColor = col;
          c.lineWidth = 2.8;
          c.beginPath();
          c.moveTo(cx + 10, cy - 6 + i * 2.2);
          c.lineTo(w - 28, 16 + i * 10.5 + Math.sin(t * 2 + i) * 2.5);
          c.stroke();
        });
        c.fillStyle = 'rgba(255, 255, 255, 0.92)';
        c.strokeStyle = '#7dd3fc';
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(cx, 16);
        c.lineTo(cx - 22, by - 8);
        c.lineTo(cx + 22, by - 8);
        c.closePath();
        c.fill();
        c.stroke();
      } else if (mode === 'wiki_ink') {
        // Iluminovaná otevřená encyklopedie Wikipedie + zlaté plnicí pero píšící svítící řádky
        drawGlow(c, cx, cy, 56, '#fde68a', 0.34);
        // 3D zakřivené stránky knihy
        const pageGradL = c.createLinearGradient(cx - 52, 18, cx, 18);
        pageGradL.addColorStop(0, '#fef3c7');
        pageGradL.addColorStop(1, '#fffbeb');
        const pageGradR = c.createLinearGradient(cx, 18, cx + 52, 18);
        pageGradR.addColorStop(0, '#fffbeb');
        pageGradR.addColorStop(1, '#fde68a');

        c.strokeStyle = '#f59e0b';
        c.lineWidth = 2;
        // Levá strana
        c.fillStyle = pageGradL;
        c.beginPath();
        c.moveTo(cx, 22);
        c.quadraticCurveTo(cx - 26, 16, cx - 50, 20);
        c.lineTo(cx - 50, 68);
        c.quadraticCurveTo(cx - 26, 64, cx, 70);
        c.closePath();
        c.fill();
        c.stroke();
        // Pravá strana
        c.fillStyle = pageGradR;
        c.beginPath();
        c.moveTo(cx, 22);
        c.quadraticCurveTo(cx + 26, 16, cx + 50, 20);
        c.lineTo(cx + 50, 68);
        c.quadraticCurveTo(cx + 26, 64, cx, 70);
        c.closePath();
        c.fill();
        c.stroke();

        // Řádky encyklopedie — živě se dopisující smaragdovým inkoustem
        for (let r = 0; r < 4; r++) {
          c.strokeStyle = r === 0 ? '#059669' : '#475569';
          c.lineWidth = r === 0 ? 2.2 : 1.6;
          c.beginPath();
          c.moveTo(cx - 42, 30 + r * 9);
          c.lineTo(cx - 8, 30 + r * 9);
          c.stroke();

          c.strokeStyle = r === 3 ? '#10b981' : '#334155';
          const writeLen = r === 3 ? 8 + ((frame * 1.4) % 32) : 34;
          c.beginPath();
          c.moveTo(cx + 8, 30 + r * 9);
          c.lineTo(cx + 8 + writeLen, 30 + r * 9);
          c.stroke();
        }

        // Zlaté plnicí pero se světelnou jiskrou na hrotu
        const penX = cx + 16 + ((frame * 1.4) % 28);
        const penY = 57 + Math.sin(t * 4) * 2.5;
        c.fillStyle = '#059669';
        c.strokeStyle = '#fde047';
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(penX, penY);
        c.lineTo(penX + 9, penY - 18);
        c.lineTo(penX + 16, penY - 11);
        c.closePath();
        c.fill();
        c.stroke();
        drawStar(c, penX, penY, 5.2, '#fde047');
        drawStar(c, cx, 12, 7.5 + Math.sin(t * 3) * 1.5, '#fde047');
      } else if (mode === 'dove_appeal') {
        const dy = cy - 4 + Math.sin(t * 3) * 5;
        c.fillStyle = '#ffffff';
        c.strokeStyle = '#fde047';
        c.shadowColor = '#fde047';
        c.shadowBlur = 10;
        c.lineWidth = 1.8;
        c.beginPath();
        c.ellipse(cx, dy, 19, 9.5, -0.15, 0, 6.28);
        c.fill();
        c.stroke();
        const wingY = dy - 16 - Math.sin(t * 5) * 8;
        c.fillStyle = '#fde047';
        c.beginPath();
        c.moveTo(cx - 6, dy - 2);
        c.quadraticCurveTo(cx - 18, wingY, cx + 9, wingY + 2);
        c.closePath();
        c.fill();
        c.strokeStyle = '#34d399';
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(cx + 18, dy - 2);
        c.lineTo(cx + 32, dy - 9);
        c.stroke();
      } else if (mode === 'cosmos_science') {
        for (let arm = 0; arm < 2; arm++) {
          c.strokeStyle = arm === 0 ? '#38bdf8' : '#f472b6';
          c.shadowColor = c.strokeStyle;
          c.shadowBlur = 8;
          c.lineWidth = 2.4;
          c.beginPath();
          for (let k = 0; k < 28; k++) {
            const a = t * 0.8 + arm * Math.PI + k * 0.22;
            const r = 3 + k * 1.65;
            const sx = cx + Math.cos(a) * r * 1.5;
            const sy = cy + Math.sin(a) * r * 0.65;
            if (k === 0) c.moveTo(sx, sy);
            else c.lineTo(sx, sy);
          }
          c.stroke();
        }
        drawStar(c, cx, cy, 10 + Math.sin(t * 3) * 2, '#fde047');
        c.strokeStyle = 'rgba(110, 231, 183, 0.78)';
        c.lineWidth = 1.5;
        c.strokeRect(cx - 34, cy - 22, 68, 44);
      } else if (mode === 'tutoring_spark') {
        drawGlow(c, cx, cy - 6, 44, '#fde047', 0.45);
        c.fillStyle = '#fde047';
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 2.2;
        c.beginPath();
        c.arc(cx, cy - 6, 16, 0, 6.28);
        c.fill();
        c.stroke();
        c.fillStyle = '#94a3b8';
        c.fillRect(cx - 7, cy + 9, 14, 8);
        for (let r = 0; r < 8; r++) {
          const a = (r * Math.PI) / 4 + t * 0.5;
          c.strokeStyle = '#fde047';
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(cx + Math.cos(a) * 20, cy - 6 + Math.sin(a) * 20);
          c.lineTo(cx + Math.cos(a) * 29, cy - 6 + Math.sin(a) * 29);
          c.stroke();
        }
      } else if (mode === 'school_pencil') {
        c.fillStyle = '#064e3b';
        c.strokeStyle = '#fbbf24';
        c.lineWidth = 2.4;
        c.fillRect(cx - 52, 16, 104, 54);
        c.strokeRect(cx - 52, 16, 104, 54);
        c.strokeStyle = '#6ee7b7';
        c.shadowColor = '#34d399';
        c.shadowBlur = 8;
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(cx - 38, 56);
        c.lineTo(cx - 14, 42);
        c.lineTo(cx + 8, 46);
        c.lineTo(cx + 34, 26);
        c.stroke();
        drawStar(c, cx + 34, 26, 7.5, '#fde047');
      } else if (mode === 'senior_letter') {
        c.fillStyle = '#fffbeb';
        c.strokeStyle = '#fb923c';
        c.lineWidth = 2.2;
        c.fillRect(cx - 32, cy - 10, 64, 38);
        c.strokeRect(cx - 32, cy - 10, 64, 38);
        c.beginPath();
        c.moveTo(cx - 32, cy - 10);
        c.lineTo(cx, cy + 9);
        c.lineTo(cx + 32, cy - 10);
        c.stroke();
        drawHeart(c, cx, cy - 19 - Math.abs(Math.sin(t * 2.4)) * 8, 8.5, '#fb7185');
        drawHeart(c, cx - 19, cy - 12 - Math.abs(Math.cos(t * 2)) * 6, 6, '#fbbf24');
      } else if (mode === 'owl_shield') {
        c.fillStyle = 'rgba(45, 212, 191, 0.24)';
        c.strokeStyle = '#5eead4';
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(cx, 14);
        c.lineTo(cx + 28, 24);
        c.quadraticCurveTo(cx + 26, 62, cx, 76);
        c.quadraticCurveTo(cx - 26, 62, cx - 28, 24);
        c.closePath();
        c.fill();
        c.stroke();
        [-9, 9].forEach((ox) => {
          c.fillStyle = '#ffffff';
          c.strokeStyle = '#fde047';
          c.lineWidth = 1.8;
          c.beginPath();
          c.arc(cx + ox, cy - 2, 7.5, 0, 6.28);
          c.fill();
          c.stroke();
          c.fillStyle = '#04140e';
          c.beginPath();
          c.arc(cx + ox + gx * 4, cy - 2, 3.2, 0, 6.28);
          c.fill();
        });
        c.fillStyle = '#fbbf24';
        c.beginPath();
        c.moveTo(cx - 4, cy + 4);
        c.lineTo(cx + 4, cy + 4);
        c.lineTo(cx, cy + 11);
        c.closePath();
        c.fill();
      } else if (mode === 'memory_wave') {
        for (let b = -8; b <= 8; b++) {
          if (Math.abs(b) < 2) continue;
          const bh = 9 + Math.abs(Math.sin(t * 3 + b * 0.6)) * 28;
          c.fillStyle = Math.abs(b) % 2 ? '#fde047' : '#34d399';
          c.fillRect(cx + b * 11 - 2.5, cy - bh / 2, 5, bh);
        }
        c.fillStyle = '#fbbf24';
        c.strokeStyle = '#fef3c7';
        c.lineWidth = 2;
        c.beginPath();
        if (c.roundRect) c.roundRect(cx - 9, cy - 20, 18, 28, 9);
        else c.rect(cx - 9, cy - 20, 18, 28);
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(cx, cy + 8);
        c.lineTo(cx, by - 4);
        c.moveTo(cx - 12, by - 4);
        c.lineTo(cx + 12, by - 4);
        c.stroke();
      } else if (mode === 'book_booth') {
        c.strokeStyle = '#fbbf24';
        c.fillStyle = 'rgba(254, 243, 199, 0.92)';
        c.lineWidth = 2.4;
        c.fillRect(cx - 26, 28, 52, 46);
        c.strokeRect(cx - 26, 28, 52, 46);
        c.fillStyle = '#f59e0b';
        c.beginPath();
        c.moveTo(cx - 34, 30);
        c.lineTo(cx, 12);
        c.lineTo(cx + 34, 30);
        c.closePath();
        c.fill();
        const bookCols = ['#10b981', '#f43f5e', '#38bdf8', '#d97706', '#8b5cf6'];
        bookCols.forEach((bc, idx) => {
          c.fillStyle = bc;
          c.fillRect(cx - 20 + idx * 8, 38, 6.5, 30);
        });
      } else if (mode === 'parcel_share') {
        c.fillStyle = '#fde68a';
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 2.2;
        c.fillRect(cx - 22, cy - 12, 44, 34);
        c.strokeRect(cx - 22, cy - 12, 44, 34);
        c.strokeStyle = '#34d399';
        c.lineWidth = 2.8;
        c.beginPath();
        c.arc(cx, cy + 4, 33, t, t + Math.PI * 1.35);
        c.stroke();
        drawHeart(c, cx, cy - 2, 7.5, '#10b981');
      } else if (mode === 'eco_cleanup') {
        for (let f = 0; f < 5; f++) {
          const fx = 66 + f * 42;
          const fy = by - 20 - Math.sin(t * 2 + f) * 3;
          c.strokeStyle = '#34d399';
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(fx, by);
          c.lineTo(fx, fy);
          c.stroke();
          c.fillStyle = f % 2 === 0 ? '#6ee7b7' : '#34d399';
          for (let p = 0; p < 5; p++) {
            const a = (p * 6.28) / 5 + t;
            c.beginPath();
            c.arc(fx + Math.cos(a) * 6.5, fy + Math.sin(a) * 6.5, 4, 0, 6.28);
            c.fill();
          }
          c.fillStyle = '#fde047';
          c.beginPath();
          c.arc(fx, fy, 3.8, 0, 6.28);
          c.fill();
        }
      } else if (mode === 'phone_recycle') {
        c.fillStyle = '#f8fafc';
        c.strokeStyle = '#34d399';
        c.lineWidth = 2.4;
        c.beginPath();
        if (c.roundRect) c.roundRect(cx - 14, cy - 22, 28, 46, 5);
        else c.rect(cx - 14, cy - 22, 28, 46);
        c.fill();
        c.stroke();
        drawHeart(c, cx, cy - 6, 7, '#10b981');
        c.strokeStyle = '#6ee7b7';
        c.lineWidth = 2.6;
        c.beginPath();
        c.arc(cx, cy, 33, t * 1.4, t * 1.4 + 4.2);
        c.stroke();
      } else if (mode === 'compost_sprout') {
        c.fillStyle = '#b45309';
        c.beginPath();
        c.ellipse(cx, by + 2, 48, 12, 0, Math.PI, 6.28);
        c.fill();
        const stemH = 30 * Math.min(1, prog + 0.35);
        c.strokeStyle = '#4ade80';
        c.shadowColor = '#4ade80';
        c.shadowBlur = 8;
        c.lineWidth = 3.5;
        c.beginPath();
        c.moveTo(cx, by - 4);
        c.quadraticCurveTo(cx + gx * 12, by - 4 - stemH * 0.5, cx, by - 4 - stemH);
        c.stroke();
        c.fillStyle = '#4ade80';
        c.beginPath();
        c.ellipse(cx - 10, by - 4 - stemH, 10, 5, -0.4, 0, 6.28);
        c.ellipse(cx + 10, by - 4 - stemH, 10, 5, 0.4, 0, 6.28);
        c.fill();
      } else if (mode === 'forest_bloom' || mode === 'fruit_tree') {
        c.strokeStyle = '#d97706';
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(cx, by + 2);
        c.lineTo(cx, cy - 4);
        c.stroke();
        const canopy = [
          [0, -14, 19],
          [-15, -6, 15],
          [15, -6, 15],
          [0, -25, 14]
        ];
        canopy.forEach(([dx, dy, rad], idx) => {
          c.fillStyle = idx % 2 ? '#34d399' : '#10b981';
          c.shadowColor = '#34d399';
          c.shadowBlur = 10;
          c.beginPath();
          c.arc(cx + dx + gx * 8, cy + dy, rad * Math.min(1, prog + 0.3), 0, 6.28);
          c.fill();
        });
        if (mode === 'fruit_tree') {
          [
            [-12, -8],
            [12, -8],
            [0, -20],
            [-6, -18],
            [7, -16],
            [0, -6]
          ].forEach(([ax, ay]) => {
            c.fillStyle = '#fb7185';
            c.shadowColor = '#f43f5e';
            c.beginPath();
            c.arc(cx + ax + gx * 6, cy + ay, 3.8, 0, 6.28);
            c.fill();
          });
        }
      } else if (mode === 'butterfly_lens') {
        const flap = 0.55 + Math.abs(Math.sin(t * 4)) * 0.45;
        c.fillStyle = '#c084fc';
        c.shadowColor = '#c084fc';
        c.shadowBlur = 10;
        c.beginPath();
        c.ellipse(cx - 13 * flap, cy - 6, 15 * flap, 10, -0.3, 0, 6.28);
        c.ellipse(cx + 13 * flap, cy - 6, 15 * flap, 10, 0.3, 0, 6.28);
        c.fill();
        c.fillStyle = '#f472b6';
        c.beginPath();
        c.ellipse(cx - 9 * flap, cy + 7, 10 * flap, 7, 0.3, 0, 6.28);
        c.ellipse(cx + 9 * flap, cy + 7, 10 * flap, 7, -0.3, 0, 6.28);
        c.fill();
        c.fillStyle = '#fde68a';
        c.fillRect(cx - 1.5, cy - 14, 3, 28);
        c.strokeStyle = '#6ee7b7';
        c.lineWidth = 1.8;
        c.strokeRect(cx - 40, 14, 80, h - 28);
      } else if (mode === 'campfire_group') {
        drawGlow(c, cx, by - 18, 42, '#fb923c', 0.5);
        c.fillStyle = '#b45309';
        c.fillRect(cx - 20, by - 5, 40, 5);
        for (let f = 0; f < 3; f++) {
          c.fillStyle = f === 0 ? '#fb923c' : f === 1 ? '#fbbf24' : '#fde047';
          c.beginPath();
          c.arc(
            cx + (f - 1) * 6,
            by - 13 - f * 5 + Math.sin(t * 5 + f) * 2.5,
            12 - f * 2.5,
            0,
            6.28
          );
          c.fill();
        }
      } else if (mode === 'globe_bridge') {
        c.strokeStyle = '#38bdf8';
        c.shadowColor = '#38bdf8';
        c.shadowBlur = 8;
        c.lineWidth = 2.2;
        c.beginPath();
        c.arc(cx, cy, 24, 0, 6.28);
        c.ellipse(cx, cy, 11, 24, 0, 0, 6.28);
        c.moveTo(cx - 24, cy);
        c.lineTo(cx + 24, cy);
        c.stroke();
        drawStar(c, cx - 36, cy - 10, 6.5, '#fde047');
        drawStar(c, cx + 36, cy - 10, 6.5, '#34d399');
      } else if (mode === 'water_spring') {
        for (let r = 0; r < 3; r++) {
          const rx = 18 + ((frame * 1.2 + r * 24) % 74);
          c.strokeStyle = '#7dd3fc';
          c.lineWidth = 1.8;
          c.beginPath();
          c.ellipse(cx, by - 8, rx, rx * 0.28, 0, 0, 6.28);
          c.stroke();
        }
        c.strokeStyle = '#38bdf8';
        c.shadowColor = '#38bdf8';
        c.shadowBlur = 10;
        c.lineWidth = 2.8;
        c.beginPath();
        c.moveTo(cx, by - 8);
        c.quadraticCurveTo(cx - 18, 20, cx - 34, by - 10);
        c.moveTo(cx, by - 8);
        c.quadraticCurveTo(cx + 18, 20, cx + 34, by - 10);
        c.stroke();
      } else if (mode === 'food_bank') {
        c.fillStyle = '#fde68a';
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 2.2;
        c.fillRect(cx - 32, cy, 64, 26);
        c.strokeRect(cx - 32, cy, 64, 26);
        c.fillStyle = '#d97706';
        c.beginPath();
        c.arc(cx - 14, cy, 11, Math.PI, 6.28);
        c.fill();
        c.fillStyle = '#f43f5e';
        c.beginPath();
        c.arc(cx + 4, cy - 4, 7.5, 0, 6.28);
        c.fill();
        c.fillStyle = '#34d399';
        c.fillRect(cx + 14, cy - 12, 12, 12);
        drawHeart(c, cx, 18 - Math.abs(Math.sin(t * 2)) * 4, 7, '#fde047');
      } else if (mode === 'soup_lantern') {
        c.strokeStyle = '#fbbf24';
        c.fillStyle = '#fed7aa';
        c.lineWidth = 2.4;
        c.beginPath();
        c.arc(cx, cy + 6, 22, 0, Math.PI);
        c.closePath();
        c.fill();
        c.stroke();
        [-10, 0, 10].forEach((sx, idx) => {
          c.strokeStyle = '#fde047';
          c.lineWidth = 2.2;
          c.beginPath();
          const sy = cy - 2;
          c.moveTo(cx + sx, sy);
          c.quadraticCurveTo(
            cx + sx + Math.sin(t * 3 + idx) * 6,
            sy - 12,
            cx + sx,
            sy - 24
          );
          c.stroke();
        });
      } else if (mode === 'zero_waste_pot') {
        c.fillStyle = '#fb923c';
        c.strokeStyle = '#fde68a';
        c.lineWidth = 2.2;
        c.fillRect(cx - 24, cy - 2, 48, 28);
        c.strokeRect(cx - 24, cy - 2, 48, 28);
        c.fillStyle = '#f97316';
        c.beginPath();
        c.moveTo(cx - 8, cy - 2);
        c.lineTo(cx, cy - 22);
        c.lineTo(cx + 8, cy - 2);
        c.closePath();
        c.fill();
        c.fillStyle = '#4ade80';
        c.beginPath();
        c.arc(cx, cy - 24, 5.5, 0, 6.28);
        c.fill();
      } else if (mode === 'bakery_save') {
        c.fillStyle = '#fbbf24';
        c.strokeStyle = '#fde68a';
        c.lineWidth = 2.2;
        c.beginPath();
        c.arc(cx, cy + 6, 20, Math.PI * 1.1, Math.PI * 1.9);
        c.quadraticCurveTo(cx + 10, cy + 4, cx + 18, cy + 12);
        c.quadraticCurveTo(cx, cy - 2, cx - 18, cy + 12);
        c.closePath();
        c.fill();
        c.stroke();
        drawStar(c, cx - 24, cy - 12, 6.5, '#fde047');
        drawStar(c, cx + 24, cy - 10, 6.5, '#34d399');
      } else if (mode === 'wheels_motion') {
        const wx1 = cx - 28 + Math.sin(t) * 6;
        const wx2 = cx + 28 + Math.sin(t) * 6;
        const wy = by - 12;
        [wx1, wx2].forEach((wx) => {
          c.strokeStyle = '#6ee7b7';
          c.lineWidth = 2.6;
          c.beginPath();
          c.arc(wx, wy, 13, 0, 6.28);
          c.stroke();
          for (let s = 0; s < 4; s++) {
            const a = t * 3 + (s * Math.PI) / 2;
            c.beginPath();
            c.moveTo(wx - Math.cos(a) * 11, wy - Math.sin(a) * 11);
            c.lineTo(wx + Math.cos(a) * 11, wy + Math.sin(a) * 11);
            c.stroke();
          }
        });
        c.strokeStyle = '#fde047';
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(wx1, wy);
        c.lineTo(cx - 4, wy - 18);
        c.lineTo(wx2, wy);
        c.lineTo(cx + 12, wy - 20);
        c.stroke();
      } else if (mode === 'kinetic_steps') {
        for (let b = 0; b < 8; b++) {
          const bh = Math.min(50, 12 + b * 5 + Math.abs(Math.sin(t * 3 + b)) * 11);
          c.fillStyle = b % 2 ? '#34d399' : '#fde047';
          c.fillRect(68 + b * 21, by - bh, 13, bh);
        }
        drawStar(c, cx + 64, 18, 8, '#fde047');
      } else if (mode === 'shoebox_gift') {
        const lidLift = Math.abs(Math.sin(t * 2.5)) * 6;
        c.fillStyle = '#f43f5e';
        c.fillRect(cx - 24, cy - 2, 48, 28);
        c.fillStyle = '#fde047';
        c.fillRect(cx - 4, cy - 2, 8, 28);
        c.fillStyle = '#fb7185';
        c.fillRect(cx - 27, cy - 10 - lidLift, 54, 9);
        c.strokeStyle = '#fde047';
        c.lineWidth = 2.4;
        c.beginPath();
        c.ellipse(cx - 8, cy - 15 - lidLift, 8, 4, -0.3, 0, 6.28);
        c.ellipse(cx + 8, cy - 15 - lidLift, 8, 4, 0.3, 0, 6.28);
        c.stroke();
        drawStar(c, cx, cy - 25 - lidLift, 7.5, '#fde047');
      } else if (mode === 'angel_wings') {
        const wingFlap = Math.sin(t * 3) * 6;
        c.strokeStyle = '#fde047';
        c.shadowColor = '#fde047';
        c.shadowBlur = 10;
        c.lineWidth = 2.6;
        c.beginPath();
        c.ellipse(cx, 16, 17, 4.5, 0, 0, 6.28);
        c.stroke();
        c.fillStyle = 'rgba(255, 255, 255, 0.94)';
        c.strokeStyle = '#7dd3fc';
        c.lineWidth = 2;
        [-1, 1].forEach((dir) => {
          c.beginPath();
          c.moveTo(cx + dir * 6, cy + 4);
          c.quadraticCurveTo(
            cx + dir * 44,
            cy - 22 + wingFlap,
            cx + dir * 38,
            cy + 16
          );
          c.quadraticCurveTo(cx + dir * 18, cy + 20, cx + dir * 6, cy + 4);
          c.fill();
          c.stroke();
        });
        drawHeart(c, cx, cy - 2, 8.5, '#fde047');
      } else if (mode === 'charity_care') {
        c.strokeStyle = '#6ee7b7';
        c.shadowColor = '#34d399';
        c.shadowBlur = 10;
        c.lineWidth = 3.2;
        c.beginPath();
        c.arc(cx, cy + 4, 25, 0.3, Math.PI - 0.3);
        c.stroke();
        drawHeart(c, cx, cy - 12 + Math.sin(t * 2.5) * 3, 12.5, '#34d399');
      } else {
        c.strokeStyle = '#5eead4';
        c.shadowColor = '#2dd4bf';
        c.shadowBlur = 10;
        c.lineWidth = 3.4;
        c.beginPath();
        c.moveTo(cx - 50, by - 8);
        c.quadraticCurveTo(cx, 12, cx + 50, by - 8);
        c.stroke();
        c.fillStyle = '#fde047';
        c.beginPath();
        c.arc(cx - 50, by - 8, 6, 0, 6.28);
        c.arc(cx + 50, by - 8, 6, 0, 6.28);
        c.fill();
        drawHeart(c, cx, cy - 10 + Math.sin(t * 2.4) * 3, 10, '#fb7185');
      }
    }
    c.restore();

    // 6. Interaktivní rázové vlny, světelné jiskry a plovoucí odměny
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.r += (sw.maxR - sw.r) * 0.12 + 1.4;
      sw.alpha *= 0.91;
      if (sw.alpha < 0.03) {
        shockwaves.splice(i, 1);
        continue;
      }
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = sw.col;
      c.globalAlpha = sw.alpha;
      c.lineWidth = 2.2;
      c.beginPath();
      c.arc(sw.x, sw.y, sw.r, 0, 6.28);
      c.stroke();
      c.restore();
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += 0.08;
      sp.alpha *= 0.92;
      if (sp.alpha < 0.04) {
        sparks.splice(i, 1);
        continue;
      }
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = sp.col;
      c.fillStyle = sp.col;
      c.globalAlpha = sp.alpha;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(sp.x, sp.y);
      c.lineTo(sp.x - sp.vx * 2.4, sp.y - sp.vy * 2.4);
      c.stroke();
      c.beginPath();
      c.arc(sp.x, sp.y, sp.r, 0, 6.28);
      c.fill();
      c.restore();
    }

    for (let i = popups.length - 1; i >= 0; i--) {
      const pop = popups[i];
      pop.y += pop.vy;
      pop.alpha *= 0.965;
      if (pop.alpha < 0.05) {
        popups.splice(i, 1);
        continue;
      }
      c.save();
      c.globalAlpha = Math.min(1, pop.alpha * 1.2);
      c.font = '800 9.5px "Plus Jakarta Sans", sans-serif';
      c.textAlign = 'center';
      c.fillStyle = '#fde047';
      c.shadowColor = 'rgba(4, 20, 14, 0.95)';
      c.shadowBlur = 6;
      c.fillText(pop.text, pop.x, pop.y);
      c.restore();
    }

    // 7. Kvadratická Bézierova parabola pamlsku letícího k Mini-Molly a samotná želvovinová patronka
    if (mollyEatTimer > 0) {
      mollyEatTimer = Math.max(0, mollyEatTimer - 0.022);
    }
    let activeTreatX = hasPointer ? pointerX : cx;
    let activeTreatY = hasPointer ? pointerY : cy;

    for (let i = treatArcs.length - 1; i >= 0; i--) {
      const arc = treatArcs[i];
      arc.p = Math.min(1, arc.p + arc.speed);
      const u = 1 - arc.p;
      const ax = u * u * arc.x0 + 2 * u * arc.p * arc.cx + arc.p * arc.p * arc.x1;
      const ay = u * u * arc.y0 + 2 * u * arc.p * arc.cy + arc.p * arc.p * arc.y1;
      activeTreatX = ax;
      activeTreatY = ay;

      // Světelná stopa za letícím pamlskem
      c.save();
      c.strokeStyle = arc.color;
      c.globalAlpha = 0.45 * (1 - arc.p * 0.4);
      c.lineWidth = 1.6;
      c.setLineDash([2.5, 2.5]);
      c.beginPath();
      c.moveTo(arc.x0, arc.y0);
      c.quadraticCurveTo(arc.cx, arc.cy, ax, ay);
      c.stroke();
      c.restore();

      // Zářící pamlsek v letu
      drawGlow(c, ax, ay, 11, arc.color, 0.55);
      c.save();
      c.fillStyle = arc.color;
      c.strokeStyle = '#fef3c7';
      c.lineWidth = 1.1;
      c.beginPath();
      c.arc(ax, ay, 3.6, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.restore();

      if (arc.p >= 1) {
        mollyEatTimer = 0.7;
        mollyTreatsCount = Math.min(6, mollyTreatsCount + 1);
        playMollyCrunch();
        drawHeart(c, mollyX - 4, mollyY - 22, 4.5, '#fbbf24');
        if (popups.length < 6) {
          popups.push({
            x: mollyX - 10,
            y: mollyY - 22,
            vy: -0.58,
            alpha: 1,
            text: `${mollyTreat.icon} Mňam!`
          });
        }
        treatArcs.splice(i, 1);
      }
    }

    drawCanvasMiniMolly(c, mollyX, mollyY, mollyBowlX, mollyBowlY, {
      t,
      lookX: activeTreatX,
      lookY: activeTreatY,
      eatTimer: mollyEatTimer,
      treatColor: mollyTreat.color || '#f59e0b',
      treatsCount: mollyTreatsCount
    });

    if (mollyEatTimer > 0.15) {
      drawHeart(
        c,
        mollyX - 6 + Math.sin(t * 5) * 3,
        mollyY - 23 - (0.7 - mollyEatTimer) * 10,
        3.6,
        '#fde047'
      );
    }

    c.restore();

    if ((!red || treatArcs.length > 0) && isVisible) {
      id = requestAnimationFrame(fn);
    }
  };

  fn();

  return () => {
    cancelAnimationFrame(id);
    io?.disconnect();
    ro?.disconnect();
    activeControllers.delete(controller);
    delete cv.__triggerBurst;
    removeEventListener('deviceorientation', onO);
    cv.removeEventListener('pointermove', onP);
    cv.removeEventListener('pointerdown', onDown);
    cv.removeEventListener('pointerup', onUpOrLeave);
    cv.removeEventListener('pointerleave', onUpOrLeave);
    cv.removeEventListener('pointercancel', onUpOrLeave);
  };
}

function getActionIdentityKey(p) {
  const action = p?.action !== undefined ? p.action : p;
  if (!action) return 'default';
  if (typeof action === 'string') return action;
  return `${action.id || ''}:${action.title || action.name || ''}:${action.category || action.kind || ''}:${p?.mode || ''}`;
}

/**
 * Svelte action pro připojení 2D Canvas fyziky a ASMR zvuku k libovolnému elementu <canvas>.
 * Chrání před zbytečným restartováním plátna při reaktivních aktualizacích rodičovské komponenty.
 */
export function impactCanvas(node, params = {}) {
  let destroy = null;
  let currentKey = '';
  let currentOnMetric = null;

  const setup = (p) => {
    destroy?.();
    const action = p?.action !== undefined ? p.action : p;
    currentOnMetric = p?.onMetric || p?.onProgress || p?.onWeightUpdate || null;
    currentKey = getActionIdentityKey(p);
    const shouldPlayOnMount =
      p?.climax !== undefined ? Boolean(p.climax) : !p?.silent;
    const spec = resolveActionEffectSpec(action);
    currentOnMetric?.(spec.target, spec.format(spec.target), spec);
    if (shouldPlayOnMount) {
      playPayoffAsmr(action);
    }
    destroy = mountImpactCanvas(node, {
      action,
      mode: spec.mode,
      climax: !!p?.climax,
      onWeightUpdate: (val, formatted, s) => {
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
      }
    },
    destroy() {
      destroy?.();
    }
  };
}

export async function fetchAmbientPulse() {
  try {
    const r = await fetch('/api/pulse');
    if (r.ok) return await r.json();
  } catch {}
  return {
    message: 'Před chvílí někdo v Brně naplnil misku v útulku',
    source: 'local'
  };
}
