/**
 * Complete catalog of 2D physics and audio effect specifications for all 45 micro-actions.
 */

import { CLICK_AND_FEED, FREERICE, czPlural as pl } from '../../data/impactFacts.js';

/**
 * @typedef {import('../../types/sensory.js').ActionEffectSpec} ActionEffectSpec
 * @typedef {import('../../types/sensory.js').ActionEffectCatalog} ActionEffectCatalog
 */

/** @type {ActionEffectCatalog} */
export const ACTION_EFFECT_CATALOG = {
  zvirata_utulek_online: {
    mode: 'kibble',
    asmr: 'kibble',
    icon: 'paw',
    target: CLICK_AND_FEED.gramsPerClick,
    label: 'Plnění misky v útulku',
    colors: ['#f59e0b', '#fbbf24', '#34d399', '#fde68a'],
    format: (v) => `+${v} g v misce`
  },
  donio_utulky: {
    mode: 'shelter_care',
    asmr: 'kibble',
    icon: 'paw',
    target: 100,
    label: '100 % daru útulku či projektu na Donio',
    colors: ['#f59e0b', '#fbbf24', '#10b981', '#fde68a'],
    format: (v) => `${v} % daru přímo sbírce`,
    staticMetric: true
  },
  birdlife_ptaci_pasti: {
    mode: 'birds_glass',
    asmr: 'birds',
    icon: 'bird',
    target: 12,
    label: 'Bezpečná skla pro ptáky',
    colors: ['#38bdf8', '#7dd3fc', '#34d399', '#fbbf24'],
    format: (v) =>
      v <= 1
        ? '+1 nahlášená prosklená plocha'
        : `+${v} ${pl(v, 'nahlášená prosklená plocha', 'nahlášené prosklené plochy', 'ochranných bodů skla')}`
  },
  strnadi_nareci: {
    mode: 'birds_song',
    asmr: 'strnad',
    icon: 'music',
    target: 15,
    label: 'Spektrogram zpěvu strnada',
    colors: ['#facc15', '#fde047', '#34d399', '#10b981'],
    format: (v) => `+${v} s ptačího nářečí`
  },
  zvire_v_nouzi: {
    mode: 'wildlife_rescue',
    asmr: 'birds',
    icon: 'phone',
    target: 34,
    label: 'Pohotovost záchranných stanic',
    colors: ['#fbbf24', '#34d399', '#10b981', '#fde68a'],
    format: (v) => `${v} ${pl(v, 'stanice', 'stanice', 'stanic')} v pohotovosti`,
    staticMetric: true
  },
  aplikace_zachranka: {
    mode: 'ecg_rescue',
    asmr: 'heartbeat',
    icon: 'ambulance',
    target: 100,
    label: 'Záchranný puls a lokátor AED',
    colors: ['#fb7185', '#f43f5e', '#34d399', '#38bdf8'],
    format: (v) => `AED + GPS maják (${v} %)`
  },
  darovani_krve: {
    mode: 'blood_drop',
    asmr: 'heartbeat',
    icon: 'droplet',
    target: 3,
    label: 'Kapka krve pro 3 životy',
    colors: ['#f43f5e', '#fb7185', '#fda4af', '#fbbf24'],
    format: (v) => `Až ${v} ${pl(v, 'zachráněný život', 'zachráněné životy', 'zachráněných životů')}`
  },
  kostni_dren: {
    mode: 'dna_helix',
    asmr: 'crystal',
    icon: 'dna',
    target: 100,
    label: 'Šroubovice naděje ČNRDD',
    colors: ['#a78bfa', '#c084fc', '#38bdf8', '#34d399'],
    format: (v) => `Shoda v registru (${v} %)`
  },
  daruj_vlasy: {
    mode: 'hair_silk',
    asmr: 'harp',
    icon: 'scissors',
    target: 40,
    label: 'Prameny vlasů na paruku',
    colors: ['#fbbf24', '#f472b6', '#fde68a', '#34d399'],
    format: (v) => `+${v} cm vlasů na paruku`
  },
  'nevypusť_dusi': {
    mode: 'mind_wave',
    asmr: 'bowl',
    icon: 'brain',
    target: 5,
    label: 'Vlna duševní opory',
    colors: ['#818cf8', '#c084fc', '#34d399', '#fde68a'],
    format: (v) => `+${v} ${pl(v, 'krok', 'kroky', 'kroků')} psychické opory`
  },
  opatruj_se_nudz: {
    mode: 'breath_lotus',
    asmr: 'bowl',
    icon: 'flower-2',
    target: 5,
    label: 'Dechový lotos rovnováhy',
    colors: ['#2dd4bf', '#5eead4', '#a7f3d0', '#fde68a'],
    format: (v) => `+${v} min klidu mysli`
  },
  s_barvou_ven: {
    mode: 'prism_support',
    asmr: 'harp',
    icon: 'rainbow',
    target: 7,
    label: 'Spektrum bezpečné opory',
    colors: ['#fb7185', '#fbbf24', '#facc15', '#34d399', '#38bdf8', '#c084fc'],
    format: (v) => `${v}/7 tipů pro přijetí`
  },
  wikipedie_cz: {
    mode: 'wiki_ink',
    asmr: 'typewriter',
    icon: 'pen-line',
    target: 1,
    label: 'Oprava v otevřené encyklopedii',
    colors: ['#fde68a', '#34d399', '#38bdf8', '#fbbf24'],
    format: (v) => `+${v} zpřesněný článek`
  },
  amnesty_apel: {
    mode: 'dove_appeal',
    asmr: 'typewriter',
    icon: 'pen-line',
    target: 1,
    label: 'Holubice a dopis svobody',
    colors: ['#facc15', '#fde047', '#34d399', '#38bdf8'],
    format: (v) => `+${v} hlas za svobodu`
  },
  cesko_digital_micro: {
    mode: 'code_nodes',
    asmr: 'sonar',
    icon: 'laptop',
    target: 8,
    label: 'Digitální síť pomoci',
    colors: ['#38bdf8', '#60a5fa', '#34d399', '#fbbf24'],
    format: (v) => `+${v} ${pl(v, 'propojený uzel', 'propojené uzly', 'propojených uzlů')}`
  },
  missing_maps: {
    mode: 'satellite_map',
    asmr: 'sonar',
    icon: 'map',
    target: 10,
    label: 'Satelitní mapování budov',
    colors: ['#22d3ee', '#38bdf8', '#34d399', '#fbbf24'],
    format: (v) => `+${v}/10 budov v mapě`
  },
  freerice_ryze: {
    mode: 'rice',
    asmr: 'rice',
    icon: 'utensils',
    target: FREERICE.grainsPerAnswer * FREERICE.answersPerRound,
    label: 'Zrnka rýže do misky OSN',
    colors: ['#f8fafc', '#fde68a', '#fbbf24', '#38bdf8'],
    format: (v) => `+${v} ${pl(v, 'zrnko', 'zrnka', 'zrnek')} rýže`
  },
  zooniverse_veda: {
    mode: 'cosmos_science',
    asmr: 'crystal',
    icon: 'telescope',
    target: 5,
    label: 'Vesmír a fotopasti Zooniverse',
    colors: ['#38bdf8', '#818cf8', '#f472b6', '#fde047'],
    format: (v) => `+${v}/5 snímků pro vědu`
  },
  ucime_online: {
    mode: 'tutoring_spark',
    asmr: 'crystal',
    icon: 'graduation-cap',
    target: 60,
    label: 'Žárovka poznání při doučování',
    colors: ['#fbbf24', '#fde047', '#34d399', '#38bdf8'],
    format: (v) => `+${v} min doučování`
  },
  doucujte_cvt: {
    mode: 'school_pencil',
    asmr: 'crystal',
    icon: 'pen-line',
    target: 60,
    label: 'Podpora školáka ve vzdělávání',
    colors: ['#34d399', '#6ee7b7', '#fbbf24', '#38bdf8'],
    format: (v) => `+${v} min podpory školáka`
  },
  letters_seniors: {
    mode: 'senior_letter',
    asmr: 'musicbox',
    icon: 'mail',
    target: 1,
    label: 'Dopis a blízkost pro seniora',
    colors: ['#fb923c', '#fde68a', '#f472b6', '#34d399'],
    format: (v) => `+${v} rozhovor proti samotě`
  },
  moudra_sovicka_mobil: {
    mode: 'owl_shield',
    asmr: 'musicbox',
    icon: 'smartphone',
    target: 1,
    label: 'Digitální štít pro seniora',
    colors: ['#2dd4bf', '#5eead4', '#fbbf24', '#34d399'],
    format: (v) => `+${v} senior v bezpečí`
  },
  pamet_naroda_vzpominka: {
    mode: 'memory_wave',
    asmr: 'musicbox',
    icon: 'mic',
    target: 15,
    label: 'Zvuková stopa Paměti národa',
    colors: ['#fbbf24', '#f59e0b', '#fde68a', '#34d399'],
    format: (v) => `+${v} min vzpomínek`
  },
  knihobudka_kniha: {
    mode: 'book_booth',
    asmr: 'pages',
    icon: 'book-open',
    target: 1,
    label: 'Kniha v pouliční knihobudce',
    colors: ['#34d399', '#fbbf24', '#fb7185', '#38bdf8'],
    format: (v) => `+${v} kniha pro sousedy`
  },
  nevyhazujto_sousedum: {
    mode: 'parcel_share',
    asmr: 'pages',
    icon: 'package',
    target: 1,
    label: 'Druhý život věci v sousedství',
    colors: ['#fbbf24', '#fde68a', '#34d399', '#10b981'],
    format: (v) => `+${v} věc poslaná dál`
  },
  trash_hero_uklid: {
    mode: 'eco_cleanup',
    asmr: 'pop_bloom',
    icon: 'leaf',
    target: 5,
    label: 'Úklid přírody a rozkvět',
    colors: ['#34d399', '#6ee7b7', '#fbbf24', '#a7f3d0'],
    format: (v) => `+${v}/5 sebraných kusů`
  },
  remobil_telefon: {
    mode: 'phone_recycle',
    asmr: 'pop_bloom',
    icon: 'smartphone',
    target: 10,
    label: 'Recyklace mobilu přes Remobil',
    colors: ['#34d399', '#6ee7b7', '#fbbf24', '#38bdf8'],
    format: (v) => `+${v} Kč na charitu z mobilu`
  },
  mapko_kompost: {
    mode: 'compost_sprout',
    asmr: 'forest',
    icon: 'sprout',
    target: 1,
    label: 'Komunitní kompost a klíčení',
    colors: ['#4ade80', '#34d399', '#fbbf24', '#fde047'],
    format: (v) => `+${v} živá půda v ulici`
  },
  sazime_budoucnost: {
    mode: 'forest_bloom',
    asmr: 'forest',
    icon: 'trees',
    target: 1,
    label: 'Výsadba stromu v krajině',
    colors: ['#34d399', '#10b981', '#6ee7b7', '#fde68a'],
    format: (v) => `+${v} strom pro krajinu`
  },
  na_ovoce_strom: {
    mode: 'fruit_tree',
    asmr: 'forest',
    icon: 'apple',
    target: 6,
    label: 'Ovocný strom v mapě Na ovoce',
    colors: ['#fb7185', '#4ade80', '#fde047', '#fbbf24'],
    format: (v) => `+${v} ${pl(v, 'plod', 'plody', 'plodů')} na stromě`
  },
  inaturalist_priroda: {
    mode: 'butterfly_lens',
    asmr: 'birds',
    icon: 'leaf',
    target: 3,
    label: 'Záznam biodiverzity přírody',
    colors: ['#c084fc', '#f472b6', '#34d399', '#fbbf24'],
    format: (v) => `+${v} ${pl(v, 'určený druh', 'určené druhy', 'určených druhů')} v ČR`
  },
  brontosaurus_vikend: {
    mode: 'campfire_group',
    asmr: 'campfire',
    icon: 'tent',
    target: 1,
    label: 'Táborák a péče o krajinu',
    colors: ['#fb923c', '#fbbf24', '#fde047', '#34d399'],
    format: (v) => `+${v} víkend pro přírodu`
  },
  inex_workcamp_cr: {
    mode: 'globe_bridge',
    asmr: 'campfire',
    icon: 'backpack',
    target: 1,
    label: 'Mezinárodní miniprojekt v ČR',
    colors: ['#38bdf8', '#34d399', '#fbbf24', '#fde047'],
    format: (v) => `+${v} komunitní projekt`
  },
  estudanky_pramen: {
    mode: 'water_spring',
    asmr: 'water',
    icon: 'droplet',
    target: 1,
    label: 'Čistý lesní pramen eSTUDÁNKY',
    colors: ['#38bdf8', '#7dd3fc', '#bae6fd', '#34d399'],
    format: (v) => `+${v} vyčištěná studánka`
  },
  potravinova_banka: {
    mode: 'food_bank',
    asmr: 'warmth',
    icon: 'utensils',
    target: 25,
    label: 'Zachráněné porce v bance',
    colors: ['#fbbf24', '#f59e0b', '#34d399', '#fb7185'],
    format: (v) => `+${v} ${pl(v, 'porce', 'porce', 'porcí')} jídla`
  },
  nadeje_jidlo: {
    mode: 'soup_lantern',
    asmr: 'warmth',
    icon: 'flame',
    target: 1,
    label: 'Teplá polévka a noc v teple',
    colors: ['#fb923c', '#fbbf24', '#fde68a', '#34d399'],
    format: () => 'Teplá polévka a noc v teple'
  },
  zachran_jidlo_recept: {
    mode: 'zero_waste_pot',
    asmr: 'warmth',
    icon: 'utensils',
    target: 1,
    label: 'Zachráněná večeře bez plýtvání',
    colors: ['#fb923c', '#4ade80', '#facc15', '#fde68a'],
    format: (v) => `+${v} zachráněná večeře`
  },
  nesnezeno_porce: {
    mode: 'bakery_save',
    asmr: 'warmth',
    icon: 'utensils',
    target: 1,
    label: 'Zachráněná porce z okolí',
    colors: ['#fbbf24', '#f59e0b', '#34d399', '#fef3c7'],
    format: (v) => `+${v} zachráněná porce`
  },
  kola_pro_afriku: {
    mode: 'wheels_motion',
    asmr: 'bicycle',
    icon: 'bike',
    target: 1,
    label: 'Jízdní kolo na cestu do školy',
    colors: ['#fbbf24', '#34d399', '#38bdf8', '#fde68a'],
    format: (v) => `+${v} kolo pro školáka`
  },
  chodci_sobe: {
    mode: 'safe_crosswalk',
    asmr: 'sonar',
    icon: 'accessibility',
    target: 1,
    label: 'Bezpečná ulice bez bariér',
    colors: ['#38bdf8', '#34d399', '#fbbf24', '#6ee7b7'],
    format: (v) => `+${v} opravená bariéra`
  },
  epp_pohybem: {
    mode: 'kinetic_steps',
    asmr: 'pop_bloom',
    icon: 'footprints',
    target: 100,
    label: 'Pohyb proměněný v body pomoci',
    colors: ['#34d399', '#6ee7b7', '#fbbf24', '#38bdf8'],
    format: (v) => `+${v} ${pl(v, 'bod', 'body', 'bodů')} pohybu`
  },
  krabice_od_bot: {
    mode: 'shoebox_gift',
    asmr: 'harp',
    icon: 'gift',
    target: 1,
    label: 'Radost z Krabice od bot',
    colors: ['#fb7185', '#fbbf24', '#34d399', '#38bdf8'],
    format: (v) => `+${v} dárek pro dítě`
  },
  dobry_andel: {
    mode: 'angel_wings',
    asmr: 'harp',
    icon: 'heart',
    target: 100,
    label: 'Do posledního haléře rodinám',
    colors: ['#fde047', '#fbbf24', '#38bdf8', '#34d399'],
    format: (v) => `${v} % přímo rodině`,
    staticMetric: true
  },
  charita_dar: {
    mode: 'charity_care',
    asmr: 'harp',
    icon: 'heart',
    target: 100,
    label: 'Podpora terénní a hospicové péče',
    colors: ['#34d399', '#10b981', '#fbbf24', '#f472b6'],
    format: (v) => `${v} % pro terénní péči`,
    staticMetric: true
  },
  znesnaze21_pribeh: {
    mode: 'solidarity_bridge',
    asmr: 'harp',
    icon: 'handshake',
    target: 100,
    label: 'Přímá solidarita Znesnáze21',
    colors: ['#2dd4bf', '#34d399', '#fbbf24', '#fb7185'],
    format: (v) => `${v} % ověřenému člověku`,
    staticMetric: true
  }
};

/**
 * Obecné dobrovolnictví u místní organizace. Sdílí scénu `solidarity_bridge`, ale není v katalogu,
 * aby nepřepsalo vyhledávání podle režimu (MODE_LOOKUP).
 * @type {ActionEffectSpec}
 */
export const VOLUNTEER_EFFECT_SPEC = {
  mode: 'solidarity_bridge',
  asmr: 'harp',
  icon: 'hand-helping',
  target: 1,
  label: 'Nabídnutá pomocná ruka',
  colors: ['#2dd4bf', '#34d399', '#fbbf24', '#fb7185'],
  format: () => '+1 nabídnutá pomocná ruka'
};

export const MODE_LOOKUP = Object.values(ACTION_EFFECT_CATALOG).reduce((acc, spec) => {
  acc[spec.mode] = spec;
  return acc;
}, /** @type {ActionEffectCatalog} */ ({}));
