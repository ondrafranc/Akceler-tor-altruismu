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

const sto = (s, k, v) => {
  try {
    return v === undefined ? s.getItem(k) : s.setItem(k, v);
  } catch {}
};

export const isSoundMuted = () => win() && sto(localStorage, MK) === '1';

export const toggleSoundMuted = () => {
  const n = !isSoundMuted();
  sto(localStorage, MK, n ? '1' : '0');
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
    colors: ['#92400e', '#d97706', '#fbbf24', '#059669'],
    format: (v) => `+${v} g v misce 🐾`
  },
  donio_utulky: {
    mode: 'shelter_care',
    asmr: 'kibble',
    icon: '🐾',
    target: 25,
    label: 'Podpora útulku a plná miska',
    colors: ['#b45309', '#f59e0b', '#10b981', '#fde68a'],
    format: (v) => `+${v} g v misce a péče 🐾`
  },
  birdlife_ptaci_pasti: {
    mode: 'birds_glass',
    asmr: 'birds',
    icon: '🐦',
    target: 12,
    label: 'Bezpečná skla pro ptáky',
    colors: ['#0284c7', '#38bdf8', '#10b981', '#fbbf24'],
    format: (v) => `🐦 +${v} ochranných bodů skla`
  },
  strnadi_nareci: {
    mode: 'birds_song',
    asmr: 'strnad',
    icon: '🎶',
    target: 15,
    label: 'Spektrogram zpěvu strnada',
    colors: ['#eab308', '#fde047', '#10b981', '#059669'],
    format: (v) => `🎶 +${v} s ptačího nářečí`
  },
  zvire_v_nouzi: {
    mode: 'wildlife_rescue',
    asmr: 'birds',
    icon: '🦔',
    target: 34,
    label: 'Pohotovost záchranných stanic',
    colors: ['#b45309', '#10b981', '#34d399', '#fbbf24'],
    format: (v) => `🦔 ${v} stanic v pohotovosti`
  },
  aplikace_zachranka: {
    mode: 'ecg_rescue',
    asmr: 'heartbeat',
    icon: '🚑',
    target: 100,
    label: 'Záchranný puls a lokátor AED',
    colors: ['#ef4444', '#f87171', '#10b981', '#38bdf8'],
    format: (v) => `🚑 AED + GPS maják (${v} %)`
  },
  darovani_krve: {
    mode: 'blood_drop',
    asmr: 'heartbeat',
    icon: '🩸',
    target: 3,
    label: 'Kapka krve pro 3 životy',
    colors: ['#dc2626', '#ef4444', '#fca5a5', '#fbbf24'],
    format: (v) => `🩸 Až ${v} zachráněné životy`
  },
  kostni_dren: {
    mode: 'dna_helix',
    asmr: 'crystal',
    icon: '🧬',
    target: 100,
    label: 'Šroubovice naděje ČNRDD',
    colors: ['#8b5cf6', '#c084fc', '#38bdf8', '#34d399'],
    format: (v) => `🧬 Shoda v registru (${v} %)`
  },
  daruj_vlasy: {
    mode: 'hair_silk',
    asmr: 'harp',
    icon: '💇‍♀️',
    target: 40,
    label: 'Prameny vlasů na paruku',
    colors: ['#d97706', '#fbbf24', '#f472b6', '#fde68a'],
    format: (v) => `💇‍♀️ +${v} cm vlasů na paruku`
  },
  'nevypusť_dusi': {
    mode: 'mind_wave',
    asmr: 'bowl',
    icon: '🧠',
    target: 5,
    label: 'Vlna duševní opory',
    colors: ['#6366f1', '#a855f7', '#34d399', '#fde68a'],
    format: (v) => `🧠 +${v} kroků psychické opory`
  },
  opatruj_se_nudz: {
    mode: 'breath_lotus',
    asmr: 'bowl',
    icon: '🧘',
    target: 5,
    label: 'Dechový lotos rovnováhy',
    colors: ['#14b8a6', '#5eead4', '#a7f3d0', '#fde68a'],
    format: (v) => `🧘 +${v} min klidu mysli`
  },
  s_barvou_ven: {
    mode: 'prism_support',
    asmr: 'harp',
    icon: '🌈',
    target: 7,
    label: 'Spektrum bezpečné opory',
    colors: ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#3b82f6', '#8b5cf6'],
    format: (v) => `🌈 ${v}/7 tipů přijetí`
  },
  wikipedie_cz: {
    mode: 'wiki_ink',
    asmr: 'typewriter',
    icon: '📝',
    target: 1,
    label: 'Oprava v otevřené encyklopedii',
    colors: ['#0f172a', '#059669', '#38bdf8', '#fbbf24'],
    format: (v) => `📝 +${v} zpřesněný článek`
  },
  amnesty_apel: {
    mode: 'dove_appeal',
    asmr: 'typewriter',
    icon: '✍️',
    target: 1,
    label: 'Holubice a dopis svobody',
    colors: ['#eab308', '#facc15', '#10b981', '#0f172a'],
    format: (v) => `✍️ +${v} hlas za svobodu`
  },
  cesko_digital_micro: {
    mode: 'code_nodes',
    asmr: 'sonar',
    icon: '💻',
    target: 8,
    label: 'Digitální síť pomoci',
    colors: ['#2563eb', '#38bdf8', '#10b981', '#fbbf24'],
    format: (v) => `💻 +${v} propojených uzlů`
  },
  missing_maps: {
    mode: 'satellite_map',
    asmr: 'sonar',
    icon: '🗺️',
    target: 10,
    label: 'Satelitní mapování budov',
    colors: ['#06b6d4', '#22d3ee', '#10b981', '#fbbf24'],
    format: (v) => `🗺️ +${v}/10 budov v mapě`
  },
  freerice_ryze: {
    mode: 'rice',
    asmr: 'rice',
    icon: '🍚',
    target: 100,
    label: 'Zrnka rýže do misky OSN',
    colors: ['#f8fafc', '#fde68a', '#fbbf24', '#0284c7'],
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
    colors: ['#f59e0b', '#fbbf24', '#10b981', '#38bdf8'],
    format: (v) => `🧑‍🏫 +${v} min doučování`
  },
  doucujte_cvt: {
    mode: 'school_pencil',
    asmr: 'crystal',
    icon: '✏️',
    target: 60,
    label: 'Podpora školáka ve vzdělávání',
    colors: ['#059669', '#34d399', '#fbbf24', '#38bdf8'],
    format: (v) => `✏️ +${v} min podpory školáka`
  },
  letters_seniors: {
    mode: 'senior_letter',
    asmr: 'musicbox',
    icon: '👵',
    target: 1,
    label: 'Dopis a blízkost pro seniora',
    colors: ['#ea580c', '#fb923c', '#fde68a', '#10b981'],
    format: (v) => `👵 +${v} rozhovor proti samotě`
  },
  moudra_sovicka_mobil: {
    mode: 'owl_shield',
    asmr: 'musicbox',
    icon: '🧓',
    target: 1,
    label: 'Digitální štít pro seniora',
    colors: ['#0d9488', '#2dd4bf', '#fbbf24', '#10b981'],
    format: (v) => `🧓 +${v} senior v bezpečí`
  },
  pamet_naroda_vzpominka: {
    mode: 'memory_wave',
    asmr: 'musicbox',
    icon: '🎙️',
    target: 15,
    label: 'Zvuková stopa Paměti národa',
    colors: ['#d97706', '#f59e0b', '#fde68a', '#78350f'],
    format: (v) => `🎙️ +${v} min vzpomínek`
  },
  knihobudka_kniha: {
    mode: 'book_booth',
    asmr: 'pages',
    icon: '📚',
    target: 1,
    label: 'Kniha v pouliční knihobudce',
    colors: ['#059669', '#d97706', '#e11d48', '#2563eb'],
    format: (v) => `📚 +${v} kniha pro sousedy`
  },
  nevyhazujto_sousedum: {
    mode: 'parcel_share',
    asmr: 'pages',
    icon: '📦',
    target: 1,
    label: 'Druhý život věci v sousedství',
    colors: ['#d97706', '#fbbf24', '#10b981', '#047857'],
    format: (v) => `📦 +${v} věc poslaná dál`
  },
  trash_hero_uklid: {
    mode: 'eco_cleanup',
    asmr: 'pop_bloom',
    icon: '🧤',
    target: 5,
    label: 'Úklid přírody a rozkvět',
    colors: ['#10b981', '#34d399', '#fbbf24', '#6ee7b7'],
    format: (v) => `🧤 +${v}/5 sebraných kusů`
  },
  remobil_telefon: {
    mode: 'phone_recycle',
    asmr: 'pop_bloom',
    icon: '📱',
    target: 10,
    label: 'Recyklace mobilu přes Remobil',
    colors: ['#059669', '#34d399', '#f59e0b', '#38bdf8'],
    format: (v) => `📱 +${v} Kč na charitu z mobilu`
  },
  mapko_kompost: {
    mode: 'compost_sprout',
    asmr: 'forest',
    icon: '🌱',
    target: 1,
    label: 'Komunitní kompost a klíčení',
    colors: ['#15803d', '#22c55e', '#854d0e', '#fde047'],
    format: (v) => `🌱 +${v} živá půda v ulici`
  },
  sazime_budoucnost: {
    mode: 'forest_bloom',
    asmr: 'forest',
    icon: '🌳',
    target: 1,
    label: 'Výsadba stromu v krajině',
    colors: ['#047857', '#10b981', '#6ee7b7', '#854d0e'],
    format: (v) => `🌳 +${v} strom pro krajinu`
  },
  na_ovoce_strom: {
    mode: 'fruit_tree',
    asmr: 'forest',
    icon: '🍎',
    target: 6,
    label: 'Ovocný strom v mapě Na ovoce',
    colors: ['#dc2626', '#16a34a', '#fde047', '#854d0e'],
    format: (v) => `🍎 +${v} plodů na stromě`
  },
  inaturalist_priroda: {
    mode: 'butterfly_lens',
    asmr: 'birds',
    icon: '🦋',
    target: 3,
    label: 'Záznam biodiverzity přírody',
    colors: ['#8b5cf6', '#ec4899', '#10b981', '#fbbf24'],
    format: (v) => `🦋 +${v} určené druhy v ČR`
  },
  brontosaurus_vikend: {
    mode: 'campfire_group',
    asmr: 'campfire',
    icon: '⛺',
    target: 1,
    label: 'Táborák a péče o krajinu',
    colors: ['#ea580c', '#f59e0b', '#fde047', '#047857'],
    format: (v) => `⛺ +${v} víkend pro přírodu`
  },
  inex_workcamp_cr: {
    mode: 'globe_bridge',
    asmr: 'campfire',
    icon: '🎒',
    target: 1,
    label: 'Mezinárodní miniprojekt v ČR',
    colors: ['#0284c7', '#10b981', '#f59e0b', '#fde047'],
    format: (v) => `🎒 +${v} komunitní projekt`
  },
  estudanky_pramen: {
    mode: 'water_spring',
    asmr: 'water',
    icon: '💧',
    target: 1,
    label: 'Čistý lesní pramen eSTUDÁNKY',
    colors: ['#0284c7', '#38bdf8', '#7dd3fc', '#10b981'],
    format: (v) => `💧 +${v} vyčištěná studánka`
  },
  potravinova_banka: {
    mode: 'food_bank',
    asmr: 'warmth',
    icon: '🥫',
    target: 25,
    label: 'Zachráněné porce v bance',
    colors: ['#d97706', '#f59e0b', '#10b981', '#dc2626'],
    format: (v) => `🥫 +${v} porcí jídla`
  },
  nadeje_jidlo: {
    mode: 'soup_lantern',
    asmr: 'warmth',
    icon: '🍞',
    target: 1,
    label: 'Teplá polévka a noc v teple',
    colors: ['#ea580c', '#fbbf24', '#fde68a', '#10b981'],
    format: (v) => `🍞 +${v} noc v teple a polévka`
  },
  zachran_jidlo_recept: {
    mode: 'zero_waste_pot',
    asmr: 'warmth',
    icon: '🥕',
    target: 1,
    label: 'Zachráněná večeře bez plýtvání',
    colors: ['#f97316', '#22c55e', '#eab308', '#fde68a'],
    format: (v) => `🥕 +${v} zachráněná večeře`
  },
  nesnezeno_porce: {
    mode: 'bakery_save',
    asmr: 'warmth',
    icon: '🥐',
    target: 1,
    label: 'Zachráněná porce z okolí',
    colors: ['#d97706', '#fbbf24', '#10b981', '#fef3c7'],
    format: (v) => `🥐 +${v} zachráněná porce`
  },
  kola_pro_afriku: {
    mode: 'wheels_motion',
    asmr: 'bicycle',
    icon: '🚲',
    target: 1,
    label: 'Jízdní kolo na cestu do školy',
    colors: ['#d97706', '#10b981', '#0284c7', '#fbbf24'],
    format: (v) => `🚲 +${v} kolo pro školáka`
  },
  chodci_sobe: {
    mode: 'safe_crosswalk',
    asmr: 'sonar',
    icon: '♿',
    target: 1,
    label: 'Bezpečná ulice bez bariér',
    colors: ['#0284c7', '#10b981', '#fbbf24', '#059669'],
    format: (v) => `♿ +${v} opravená bariéra`
  },
  epp_pohybem: {
    mode: 'kinetic_steps',
    asmr: 'pop_bloom',
    icon: '👟',
    target: 100,
    label: 'Pohyb proměněný v body pomoci',
    colors: ['#10b981', '#34d399', '#fbbf24', '#0284c7'],
    format: (v) => `👟 +${v} bodů pohybu`
  },
  krabice_od_bot: {
    mode: 'shoebox_gift',
    asmr: 'harp',
    icon: '🎁',
    target: 1,
    label: 'Radost z Krabice od bot',
    colors: ['#e11d48', '#fbbf24', '#10b981', '#38bdf8'],
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
    colors: ['#059669', '#10b981', '#fbbf24', '#ec4899'],
    format: (v) => `💚 ${v} % pro terénní péči`
  },
  znesnaze21_pribeh: {
    mode: 'solidarity_bridge',
    asmr: 'harp',
    icon: '🤝',
    target: 100,
    label: 'Přímá solidarita Znesnáze21',
    colors: ['#0d9488', '#10b981', '#fbbf24', '#f43f5e'],
    format: (v) => `🤝 ${v} % ověřenému člověku`
  }
};

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
  return {
    ...spec,
    scene: spec.mode,
    value: val,
    badge: opts.isReturnStrip ? returnBadge : badge,
    returnBadge
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

function tone(f, dur = 0.25, tp = 'sine', d = 0, pk = 0.035, ef = 0) {
  const c = ctx();
  if (!c) return null;
  try {
    const t = c.currentTime + d;
    const o = c.createOscillator();
    const g = c.createGain();
    const r = (p, v, x) => p.linearRampToValueAtTime(v, x);
    o.type = tp;
    o.frequency.value = f;
    if (ef) r(o.frequency, ef, t + dur * 0.85);
    g.gain.setValueAtTime(0.001, t);
    r(g.gain, pk, t + 0.02);
    r(g.gain, 0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
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

export function startHoldSpark(el, cb) {
  const t0 = performance.now();
  const red = prefersReducedMotion();
  const sp = (v) => el?.style?.setProperty('--spark-charge', v);
  let id = 0;
  let d = 0;
  vib([10, 20, 40]);
  const g1 = tone(294, 0.68, 'sine', 0, 0.04, 440);
  const g2 = tone(587, 0.68, 'triangle', 0, 0.02, 659);
  const step = (now) => {
    const p = red ? 1 : Math.min(1, (now - t0) / 600);
    sp(p.toFixed(2));
    if (p >= 1 && !d) {
      d = 1;
      el?.classList?.add('spark-ready');
      vib(35);
      tone(587, 0.28);
      tone(880, 0.28, 'triangle');
      cb?.();
      return;
    }
    if (p < 1) id = requestAnimationFrame(step);
  };
  id = requestAnimationFrame(step);
  return (rel = false) => {
    cancelAnimationFrame(id);
    sp('0');
    el?.classList?.remove('spark-ready');
    try {
      [g1, g2].forEach((g) =>
        g?.gain.setTargetAtTime(0.0001, ac?.currentTime || 0, 0.02)
      );
    } catch {}
    if (rel && performance.now() - t0 < 200) tone(659, 0.12);
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
    tone(523, 0.35, 'sine', 0.42);
    tone(784, 0.35, 'triangle', 0.42);
    return;
  }

  if (kind === 'rice') {
    for (let k = 0; k < 16; k++) {
      noiseBurst(0.012, 1850 + ((k * 193) % 1100), 8.0, k * 0.026, 0.035);
    }
    [587, 740, 880, 1175].forEach((f, i) =>
      tone(f, 0.26, 'sine', 0.36 + i * 0.05, 0.03)
    );
    return;
  }

  if (kind === 'strnad') {
    [1760, 1760, 1760].forEach((f, i) =>
      tone(f, 0.09, 'sine', i * 0.11, 0.03, f * 1.06)
    );
    tone(1480, 0.42, 'triangle', 0.36, 0.035, 1318);
    return;
  }

  if (kind === 'birds') {
    tone(1320, 0.14, 'sine', 0.02, 0.03, 1760);
    tone(1568, 0.16, 'sine', 0.16, 0.03, 2093);
    tone(1760, 0.25, 'triangle', 0.32, 0.028, 1568);
    return;
  }

  if (kind === 'heartbeat') {
    tone(68, 0.14, 'sine', 0.02, 0.06, 52);
    tone(86, 0.16, 'sine', 0.18, 0.055, 60);
    tone(523, 0.36, 'sine', 0.38, 0.03);
    tone(659, 0.38, 'triangle', 0.44, 0.028);
    return;
  }

  if (kind === 'typewriter') {
    for (let k = 0; k < 5; k++) {
      noiseBurst(0.014, 1400 + k * 180, 7.0, k * 0.055, 0.04);
    }
    tone(659, 0.28, 'triangle', 0.3, 0.032);
    tone(987, 0.34, 'sine', 0.36, 0.032);
    return;
  }

  if (kind === 'sonar') {
    tone(880, 0.14, 'sine', 0.0, 0.03);
    tone(1318, 0.18, 'sine', 0.15, 0.03);
    tone(1760, 0.3, 'triangle', 0.3, 0.028);
    return;
  }

  if (kind === 'musicbox') {
    [523, 659, 784, 987, 1046].forEach((f, i) =>
      tone(f, 0.32, 'triangle', i * 0.075, 0.03)
    );
    return;
  }

  if (kind === 'pages') {
    for (let k = 0; k < 4; k++) {
      noiseBurst(0.04, 800 + k * 240, 3.2, k * 0.07, 0.032);
    }
    tone(523, 0.3, 'sine', 0.28, 0.03);
    tone(659, 0.34, 'triangle', 0.34, 0.03);
    return;
  }

  if (kind === 'water') {
    tone(580, 0.12, 'sine', 0.02, 0.038, 1240);
    tone(720, 0.14, 'sine', 0.18, 0.035, 1480);
    tone(880, 0.3, 'triangle', 0.34, 0.028, 1568);
    return;
  }

  if (kind === 'forest') {
    noiseBurst(0.22, 620, 1.8, 0.01, 0.026);
    [392, 440, 523, 659].forEach((f, i) =>
      tone(f, 0.36, 'triangle', 0.07 + i * 0.065, 0.03)
    );
    return;
  }

  if (kind === 'campfire') {
    noiseBurst(0.24, 380, 1.5, 0.0, 0.024);
    for (let k = 0; k < 6; k++) {
      noiseBurst(0.011, 1750 + ((k * 230) % 950), 7.5, 0.03 + k * 0.055, 0.035);
    }
    [330, 494, 659].forEach((f, i) =>
      tone(f, 0.38, 'triangle', 0.12 + i * 0.08, 0.028)
    );
    return;
  }

  if (kind === 'bicycle') {
    for (let k = 0; k < 6; k++) {
      noiseBurst(0.01, 2200, 9.0, k * 0.04, 0.03);
    }
    tone(1046, 0.38, 'sine', 0.25, 0.04);
    tone(1568, 0.42, 'triangle', 0.31, 0.035);
    return;
  }

  if (kind === 'bowl') {
    tone(432, 0.65, 'sine', 0.0, 0.038);
    tone(648, 0.6, 'triangle', 0.06, 0.025);
    tone(864, 0.5, 'sine', 0.12, 0.016);
    return;
  }

  if (kind === 'harp') {
    [523, 587, 659, 784, 880, 1046].forEach((f, i) =>
      tone(f, 0.36, i % 2 ? 'triangle' : 'sine', i * 0.05, 0.03)
    );
    return;
  }

  if (kind === 'warmth') {
    noiseBurst(0.16, 480, 2.0, 0.02, 0.022);
    [349, 440, 523, 659].forEach((f, i) =>
      tone(f, 0.38, 'sine', 0.04 + i * 0.065, 0.032)
    );
    return;
  }

  if (kind === 'crystal') {
    [1046, 1318, 1568, 2093].forEach((f, i) =>
      tone(f, 0.34, 'sine', i * 0.06, 0.026)
    );
    tone(784, 0.42, 'triangle', 0.02, 0.022);
    return;
  }

  if (kind === 'pop_bloom') {
    [320, 440, 587].forEach((f, i) => {
      noiseBurst(0.012, 1600 + i * 300, 6.0, i * 0.085, 0.03);
      tone(f, 0.16, 'sine', i * 0.085, 0.034, f * 2);
    });
    tone(880, 0.28, 'triangle', 0.28, 0.028);
    return;
  }

  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, 'sine', i * 0.06));
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

function drawHeart(c, x, y, r, color) {
  c.save();
  c.fillStyle = color;
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
  c.lineWidth = 2.2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - size, y - wing * size * 0.6);
  c.quadraticCurveTo(x - size * 0.4, y - size * 0.4, x, y);
  c.quadraticCurveTo(x + size * 0.4, y - size * 0.4, x + size, y - wing * size * 0.6);
  c.stroke();
  c.restore();
}

function drawStar(c, x, y, r, color) {
  c.save();
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.38;
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
 * Univerzální interaktivní 2D Canvas fyzikální engine s unikátní vektorovou a částicovou scénou
 * pro každou z 45 aktivit v katalogu.
 */
export function mountImpactCanvas(cv, o = {}) {
  const c = cv?.getContext?.('2d');
  if (!c) return () => {};

  const spec = resolveActionEffectSpec(o.action || o.mode || 'kibble');
  const mode = spec.mode;
  const target = spec.target || 25;
  const cs = spec.colors || ['#059669', '#10b981', '#fbbf24', '#38bdf8'];
  const w = cv.width || 300;
  const h = cv.height || 92;
  const cx = w / 2;
  const cy = h / 2;
  const red = prefersReducedMotion();
  const by = h - 12;
  const isBowlMode =
    mode === 'kibble' || mode === 'shelter_care' || mode === 'rice';

  let gx = 0;
  let py = 0.5;
  let id = 0;
  let frame = 0;
  let lastReportedVal = -1;

  const ps = Array.from({ length: 30 }, (_, i) => ({
    x: cx + ((i % 7) - 3) * (isBowlMode ? 11 : 18),
    y: red
      ? by - 10 - (i % 4) * 3
      : isBowlMode
        ? -6 - i * 4.2
        : h - 8 - ((i * 11) % (h - 16)),
    vx: ((i % 5) - 2) * 0.38,
    vy: isBowlMode ? 1.35 : -0.55 - (i % 4) * 0.16,
    r: 2.8 + (i % 3) * 0.9,
    phase: i * 0.42,
    c: cs[i % cs.length]
  }));

  const emitProgress = (ratio) => {
    const clamped = Math.max(1, Math.min(target, Math.round(target * ratio)));
    if (clamped !== lastReportedVal) {
      lastReportedVal = clamped;
      o.onWeightUpdate?.(clamped, spec.format(clamped), spec);
    }
  };

  if (red) emitProgress(1);

  const onO = (e) => {
    if (typeof e?.gamma === 'number') {
      gx = Math.max(-0.38, Math.min(0.38, e.gamma * 0.009));
    }
  };
  const onP = (e) => {
    const b = cv.getBoundingClientRect();
    if (b.width) {
      gx = ((e.clientX - b.left) / b.width - 0.5) * 0.42;
      py = Math.max(0.1, Math.min(0.9, (e.clientY - b.top) / (b.height || 92)));
    }
  };
  const onDown = (e) => {
    const b = cv.getBoundingClientRect();
    const tx = b.width ? ((e.clientX - b.left) / b.width) * w : cx;
    const ty = b.height ? ((e.clientY - b.top) / b.height) * h : cy;
    for (let i = 0; i < 8; i++) {
      const p = ps[(frame + i) % ps.length];
      p.x = tx + ((i % 3) - 1) * 8;
      p.y = ty;
      p.vx = Math.cos(i * 0.8) * 1.8;
      p.vy = isBowlMode ? -2.2 : -1.4;
    }
    tone(587 + (frame % 5) * 65, 0.14, 'triangle', 0, 0.022);
  };

  addEventListener('deviceorientation', onO);
  cv.addEventListener('pointermove', onP);
  cv.addEventListener('pointerdown', onDown);

  const fn = () => {
    frame++;
    const t = frame * 0.045;
    c.clearRect(0, 0, w, h);

    // 1. Jemná atmosférická záře na pozadí
    const grad = c.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(236, 253, 245, 0.45)');
    grad.addColorStop(0.5, 'rgba(254, 243, 199, 0.35)');
    grad.addColorStop(1, 'rgba(209, 250, 229, 0.45)');
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);

    let settledCount = 0;

    // 2. Fyzika částic (granule, rýže, jiskry, kapky, hvězdy, pyl)
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const fl = by - 4 - (i % 3) * 2.2;
      if (!red) {
        if (isBowlMode) {
          p.vx = (p.vx + gx) * 0.92;
          p.vy += 0.42;
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > fl) {
            p.y = fl;
            p.vy *= -0.36;
          }
          if (p.x < 76 || p.x > w - 76) {
            p.x = p.x < 76 ? 76 : w - 76;
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
          const ang = p.phase + t * 0.65;
          const rad = 14 + ((i * 3.8) % 68);
          p.x = cx + Math.cos(ang) * rad * 1.5 + gx * 28;
          p.y = cy + Math.sin(ang) * (rad * 0.48);
        } else {
          p.vx = (p.vx + gx * 0.6 + Math.sin(t + p.phase) * 0.04) * 0.94;
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
          c.ellipse(p.x, p.y, 4.2, 2.1, (i % 5) * 0.3, 0, 6.28);
        } else {
          c.arc(p.x, p.y, 3.6, 0, 6.28);
        }
        c.fill();
      } else {
        settledCount++;
        c.fillStyle = p.c;
        c.globalAlpha = 0.72;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, 6.28);
        c.fill();
        c.globalAlpha = 1;
      }
    }

    // 3. Unikátní ústřední vektorová scéna podle aktivity
    if (isBowlMode) {
      emitProgress(settledCount / ps.length);
      if (mode === 'shelter_care') {
        // Stříška útulku + tlapka nad miskou
        c.strokeStyle = '#b45309';
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(cx - 56, 26);
        c.lineTo(cx, 8);
        c.lineTo(cx + 56, 26);
        c.stroke();
        drawPaw(c, cx - 34, 24, 7.5, '#d97706');
        drawPaw(c, cx + 34, 24, 7.5, '#10b981');
      }
      c.strokeStyle = mode === 'rice' ? '#0284c7' : '#047857';
      c.lineWidth = 3.2;
      c.beginPath();
      c.moveTo(60, by - 15);
      c.lineTo(84, by + 3);
      c.lineTo(w - 84, by + 3);
      c.lineTo(w - 60, by - 15);
      c.stroke();
      if (settledCount > 16) {
        drawHeart(c, cx + Math.sin(t * 2) * 10, 22 - Math.abs(Math.sin(t)) * 6, 6.5, '#f59e0b');
      }
    } else {
      const prog = red ? 1 : Math.min(1, frame / 36);
      emitProgress(prog);

      if (mode === 'birds_glass') {
        // Ochranné UV body na skle + bezpečně letící ptáci
        c.strokeStyle = 'rgba(2, 132, 199, 0.36)';
        c.fillStyle = 'rgba(224, 242, 254, 0.35)';
        c.lineWidth = 1.6;
        c.fillRect(42, 14, w - 84, h - 28);
        c.strokeRect(42, 14, w - 84, h - 28);
        for (let gxIdx = 0; gxIdx < 6; gxIdx++) {
          for (let gyIdx = 0; gyIdx < 2; gyIdx++) {
            c.fillStyle = (gxIdx + gyIdx) % 2 ? '#0284c7' : '#10b981';
            c.beginPath();
            c.arc(66 + gxIdx * 34, 30 + gyIdx * 28, 3.0, 0, 6.28);
            c.fill();
          }
        }
        for (let b = 0; b < 3; b++) {
          const bx = ((frame * 1.9 + b * 85) % (w - 40)) + 20;
          const byPos = 22 + b * 14 + Math.sin(t * 2 + b) * 5;
          drawBird(c, bx, byPos, Math.sin(t * 4.5 + b), 9 + b * 2, '#047857');
        }
      } else if (mode === 'birds_song') {
        // Spektrogram zpěvu strnada obecného + notová osnova a zpívající ptáček
        c.strokeStyle = 'rgba(5, 150, 105, 0.2)';
        c.lineWidth = 1;
        for (let l = 0; l < 4; l++) {
          c.beginPath();
          c.moveTo(34, 18 + l * 10);
          c.lineTo(w - 34, 18 + l * 10);
          c.stroke();
        }
        for (let b = 0; b < 15; b++) {
          const bh = 9 + Math.abs(Math.sin(t * 2.8 + b * 0.52)) * 30;
          c.fillStyle = b % 2 ? '#eab308' : '#10b981';
          c.fillRect(52 + b * 13, h - 14 - bh, 7.5, bh);
        }
        drawBird(c, cx - 50 + Math.sin(t) * 14, 24, Math.sin(t * 5), 11, '#ca8a04');
        drawBird(c, cx + 48 + Math.cos(t) * 14, 20, Math.cos(t * 5), 10, '#047857');
      } else if (mode === 'wildlife_rescue') {
        // Ježek v bezpečí + zelený záchranářský kříž a radarové kruhy
        for (let r = 1; r <= 2; r++) {
          c.strokeStyle = 'rgba(16, 185, 129, 0.28)';
          c.lineWidth = 1.5;
          c.beginPath();
          c.arc(cx, cy, 22 + r * 12 + Math.sin(t * 2 + r) * 3, 0, 6.28);
          c.stroke();
        }
        // Tělo a bodlinky ježka
        c.fillStyle = '#78350f';
        for (let s = 0; s < 9; s++) {
          const ang = Math.PI + (s / 8) * Math.PI;
          c.beginPath();
          c.moveTo(cx - 6 + Math.cos(ang) * 14, cy + 8 + Math.sin(ang) * 12);
          c.lineTo(cx - 6 + Math.cos(ang) * 23, cy + 8 + Math.sin(ang) * 20);
          c.lineTo(cx - 2 + Math.cos(ang + 0.2) * 14, cy + 8 + Math.sin(ang + 0.2) * 12);
          c.fill();
        }
        c.fillStyle = '#b45309';
        c.beginPath();
        c.ellipse(cx - 2, cy + 8, 16, 11, 0, 0, 6.28);
        c.fill();
        c.fillStyle = '#fde68a';
        c.beginPath();
        c.moveTo(cx + 10, cy + 2);
        c.lineTo(cx + 22, cy + 8);
        c.lineTo(cx + 10, cy + 14);
        c.fill();
        c.fillStyle = '#0f172a';
        c.beginPath();
        c.arc(cx + 21, cy + 8, 2.2, 0, 6.28);
        c.arc(cx + 12, cy + 6, 1.8, 0, 6.28);
        c.fill();
        // Záchranářský kříž nahoře
        c.fillStyle = '#10b981';
        c.fillRect(cx - 3, 12, 6, 16);
        c.fillRect(cx - 8, 17, 16, 6);
      } else if (mode === 'satellite_map') {
        // Satelitní mřížka, budovy a skenovací radar Missing Maps
        c.strokeStyle = 'rgba(6, 182, 212, 0.22)';
        c.lineWidth = 1;
        for (let x = 30; x < w; x += 36) {
          c.beginPath();
          c.moveTo(x, 8);
          c.lineTo(x, h - 8);
          c.stroke();
        }
        const scanX = red ? w - 40 : ((frame * 3.2) % (w - 60)) + 30;
        for (let b = 0; b < 6; b++) {
          const bx = 42 + b * 38;
          const byRect = 22 + (b % 2) * 24;
          const active = bx <= scanX || red;
          c.strokeStyle = active ? '#10b981' : 'rgba(15, 23, 42, 0.25)';
          c.fillStyle = active ? 'rgba(16, 185, 129, 0.26)' : 'rgba(148, 163, 184, 0.14)';
          c.lineWidth = active ? 2 : 1;
          c.fillRect(bx, byRect, 24, 18);
          c.strokeRect(bx, byRect, 24, 18);
        }
        c.strokeStyle = '#06b6d4';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(scanX, 6);
        c.lineTo(scanX, h - 6);
        c.stroke();
      } else if (mode === 'code_nodes') {
        // Digitální síť Česko.Digital: 8 propojených uzlů s pulzujícími daty
        const nodes = [
          [cx - 72, cy - 16],
          [cx - 44, cy + 18],
          [cx - 18, cy - 22],
          [cx, cy + 6],
          [cx + 22, cy - 20],
          [cx + 46, cy + 18],
          [cx + 72, cy - 12],
          [cx, cy - 28]
        ];
        c.strokeStyle = 'rgba(37, 99, 235, 0.35)';
        c.lineWidth = 1.8;
        for (let i = 0; i < nodes.length - 1; i++) {
          const [x1, y1] = nodes[i];
          const [x2, y2] = nodes[i + 1];
          c.beginPath();
          c.moveTo(x1, y1);
          c.lineTo(x2, y2);
          c.stroke();
          const pRatio = (t * 0.9 + i * 0.25) % 1;
          c.fillStyle = '#10b981';
          c.beginPath();
          c.arc(x1 + (x2 - x1) * pRatio, y1 + (y2 - y1) * pRatio, 2.4, 0, 6.28);
          c.fill();
        }
        nodes.forEach(([nx, ny], idx) => {
          c.fillStyle = idx % 2 === 0 ? '#2563eb' : '#059669';
          c.beginPath();
          c.arc(nx + gx * 8, ny + Math.sin(t * 2 + idx) * 2.5, 4.8, 0, 6.28);
          c.fill();
        });
      } else if (mode === 'safe_crosswalk') {
        // Bezpečný přechod pro chodce + bezbariérová rampa Chodci sobě
        c.fillStyle = 'rgba(15, 23, 42, 0.16)';
        c.fillRect(44, cy - 14, w - 88, 34);
        for (let s = 0; s < 6; s++) {
          c.fillStyle = '#ffffff';
          c.fillRect(58 + s * 32, cy - 10, 18, 26);
        }
        // Zelený bezbariérový nájezd a plynulá trajektorie
        c.strokeStyle = '#10b981';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(48, cy + 2);
        c.quadraticCurveTo(cx, cy - 18, w - 48, cy + 2);
        c.stroke();
        const dotX = 56 + ((frame * 2.2) % (w - 112));
        c.fillStyle = '#0284c7';
        c.beginPath();
        c.arc(dotX, cy - 6, 6, 0, 6.28);
        c.fill();
      } else if (mode === 'dna_helix') {
        for (let k = 0; k < 16; k++) {
          const x = 40 + k * 14.5;
          const y1 = cy + Math.sin(t * 2 + k * 0.45) * 20;
          const y2 = cy + Math.sin(t * 2 + k * 0.45 + Math.PI) * 20;
          c.strokeStyle = 'rgba(139, 92, 246, 0.35)';
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(x, y1);
          c.lineTo(x, y2);
          c.stroke();
          c.fillStyle = '#8b5cf6';
          c.beginPath();
          c.arc(x, y1, 3.2, 0, 6.28);
          c.fill();
          c.fillStyle = '#10b981';
          c.beginPath();
          c.arc(x, y2, 3.2, 0, 6.28);
          c.fill();
        }
      } else if (mode === 'ecg_rescue') {
        c.strokeStyle = '#ef4444';
        c.lineWidth = 2.4;
        c.beginPath();
        for (let x = 24; x < w - 24; x += 4) {
          const d = Math.abs(x - cx);
          const spike =
            d < 6 ? -26 : d < 12 ? 18 : d < 22 ? -8 * Math.sin(d) : 0;
          const y = cy + spike + Math.sin(x * 0.08 - t * 3) * 2;
          if (x === 24) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
        drawHeart(c, cx, 18, 8 + Math.sin(t * 4) * 1.5, '#ef4444');
      } else if (mode === 'blood_drop') {
        // Kapka krve + 3 zachráněná srdce
        const dropY = 22 + Math.sin(t * 2.5) * 3;
        c.fillStyle = '#dc2626';
        c.beginPath();
        c.moveTo(cx, dropY - 12);
        c.bezierCurveTo(cx - 14, dropY + 4, cx - 12, dropY + 20, cx, dropY + 20);
        c.bezierCurveTo(cx + 12, dropY + 20, cx + 14, dropY + 4, cx, dropY - 12);
        c.fill();
        [-46, 0, 46].forEach((dx, idx) => {
          drawHeart(
            c,
            cx + dx,
            by - 16 - Math.abs(Math.sin(t * 2 + idx)) * 4,
            7.5,
            idx === 1 ? '#ef4444' : '#f87171'
          );
        });
      } else if (mode === 'hair_silk') {
        // Zlaté a růžové hedvábné prameny vlasů splétané do copu + stuha
        for (let s = 0; s < 4; s++) {
          c.strokeStyle = s % 2 === 0 ? '#d97706' : '#f472b6';
          c.lineWidth = 3.2;
          c.beginPath();
          for (let x = 36; x <= w - 36; x += 6) {
            const y =
              cy +
              Math.sin(x * 0.06 + t * 2.2 + (s * Math.PI) / 2) * 14 +
              (s - 1.5) * 3;
            if (x === 36) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          c.stroke();
        }
        drawHeart(c, cx, cy - 6, 8, '#ec4899');
      } else if (mode === 'mind_wave') {
        // Harmonické neuronové vlny duševní pohody
        [cs[0], cs[1], cs[2]].forEach((col, idx) => {
          c.strokeStyle = col;
          c.lineWidth = 2.4;
          c.beginPath();
          for (let x = 16; x <= w - 16; x += 8) {
            const y =
              cy +
              (idx - 1) * 8 +
              Math.sin(x * 0.035 + t * 2 + idx * 0.8) * (10 + py * 6);
            if (x === 16) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          c.stroke();
        });
      } else if (mode === 'breath_lotus') {
        // Dýchající lotosový květ Opatruj.se
        const breath = 1 + Math.sin(t * 1.6) * 0.18;
        c.strokeStyle = 'rgba(20, 184, 166, 0.28)';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(cx, cy + 4, 24 * breath, 0, 6.28);
        c.stroke();
        [-0.9, -0.45, 0, 0.45, 0.9].forEach((ang, idx) => {
          c.save();
          c.translate(cx, cy + 16);
          c.rotate(ang * breath);
          c.fillStyle = idx % 2 === 0 ? '#14b8a6' : '#5eead4';
          c.beginPath();
          c.ellipse(0, -16, 7, 16, 0, 0, 6.28);
          c.fill();
          c.restore();
        });
      } else if (mode === 'prism_support') {
        // Optický hranol rozkládající světlo do duhového spektra S barvou ven
        const rainbow = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#3b82f6', '#8b5cf6'];
        c.strokeStyle = '#fbbf24';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(32, cy + 8);
        c.lineTo(cx - 12, cy);
        c.stroke();
        rainbow.forEach((col, i) => {
          c.strokeStyle = col;
          c.lineWidth = 2.6;
          c.beginPath();
          c.moveTo(cx + 10, cy - 6 + i * 2.2);
          c.lineTo(w - 30, 18 + i * 10 + Math.sin(t * 2 + i) * 2);
          c.stroke();
        });
        c.fillStyle = 'rgba(255, 255, 255, 0.88)';
        c.strokeStyle = '#38bdf8';
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(cx, 18);
        c.lineTo(cx - 20, by - 8);
        c.lineTo(cx + 20, by - 8);
        c.closePath();
        c.fill();
        c.stroke();
      } else if (mode === 'wiki_ink') {
        // Otevřená encyklopedie Wikipedie + plnicí pero píšící řádky a hvězda vědění
        c.fillStyle = '#ffffff';
        c.strokeStyle = '#0f172a';
        c.lineWidth = 2;
        c.fillRect(cx - 44, 20, 42, 48);
        c.fillRect(cx + 2, 20, 42, 48);
        c.strokeRect(cx - 44, 20, 42, 48);
        c.strokeRect(cx + 2, 20, 42, 48);
        for (let r = 0; r < 4; r++) {
          c.strokeStyle = '#64748b';
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(cx - 38, 29 + r * 9);
          c.lineTo(cx - 8, 29 + r * 9);
          c.moveTo(cx + 8, 29 + r * 9);
          c.lineTo(cx + 14 + ((frame + r * 7) % 24), 29 + r * 9);
          c.stroke();
        }
        // Hrot pera
        const penX = cx + 22 + Math.sin(t * 3) * 10;
        const penY = 36 + Math.cos(t * 2) * 8;
        c.fillStyle = '#059669';
        c.beginPath();
        c.moveTo(penX, penY);
        c.lineTo(penX + 8, penY - 16);
        c.lineTo(penX + 14, penY - 10);
        c.closePath();
        c.fill();
        drawStar(c, cx, 14, 6, '#fbbf24');
      } else if (mode === 'dove_appeal') {
        // Holubice svobody Amnesty International nesoucí psaní
        const dy = cy - 4 + Math.sin(t * 3) * 5;
        c.fillStyle = '#ffffff';
        c.strokeStyle = '#0f172a';
        c.lineWidth = 1.8;
        c.beginPath();
        c.ellipse(cx, dy, 18, 9, -0.15, 0, 6.28);
        c.fill();
        c.stroke();
        // Křídla holubice
        const wingY = dy - 14 - Math.sin(t * 5) * 8;
        c.fillStyle = '#facc15';
        c.beginPath();
        c.moveTo(cx - 6, dy - 2);
        c.quadraticCurveTo(cx - 18, wingY, cx + 8, wingY + 2);
        c.closePath();
        c.fill();
        c.stroke();
        // Olivová ratolest v zobáčku
        c.strokeStyle = '#10b981';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(cx + 18, dy - 2);
        c.lineTo(cx + 30, dy - 8);
        c.stroke();
      } else if (mode === 'cosmos_science') {
        // Spirální galaxie Zooniverse + zaměřovací kříž dalekohledu
        for (let arm = 0; arm < 2; arm++) {
          c.strokeStyle = arm === 0 ? 'rgba(56, 189, 248, 0.55)' : 'rgba(244, 114, 182, 0.55)';
          c.lineWidth = 2.2;
          c.beginPath();
          for (let k = 0; k < 28; k++) {
            const a = t * 0.8 + arm * Math.PI + k * 0.22;
            const r = 3 + k * 1.6;
            const sx = cx + Math.cos(a) * r * 1.5;
            const sy = cy + Math.sin(a) * r * 0.65;
            if (k === 0) c.moveTo(sx, sy);
            else c.lineTo(sx, sy);
          }
          c.stroke();
        }
        drawStar(c, cx, cy, 9 + Math.sin(t * 3) * 2, '#fde047');
        // Zaměřovač teleskopu
        c.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        c.lineWidth = 1.5;
        c.strokeRect(cx - 32, cy - 22, 64, 44);
      } else if (mode === 'tutoring_spark') {
        // Rozsvícená žárovka poznání Učíme online s paprsky
        c.fillStyle = '#fde047';
        c.strokeStyle = '#d97706';
        c.lineWidth = 2.2;
        c.beginPath();
        c.arc(cx, cy - 6, 15, 0, 6.28);
        c.fill();
        c.stroke();
        c.fillStyle = '#64748b';
        c.fillRect(cx - 7, cy + 8, 14, 8);
        for (let r = 0; r < 8; r++) {
          const a = (r * Math.PI) / 4 + t * 0.5;
          c.strokeStyle = '#f59e0b';
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(cx + Math.cos(a) * 19, cy - 6 + Math.sin(a) * 19);
          c.lineTo(cx + Math.cos(a) * 27, cy - 6 + Math.sin(a) * 27);
          c.stroke();
        }
      } else if (mode === 'school_pencil') {
        // Školní tabule a tužka kreslící růstovou křivku a hvězdu Doučujte Člověk v tísni
        c.fillStyle = '#064e3b';
        c.strokeStyle = '#b45309';
        c.lineWidth = 2.5;
        c.fillRect(cx - 52, 16, 104, 54);
        c.strokeRect(cx - 52, 16, 104, 54);
        c.strokeStyle = '#34d399';
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(cx - 38, 56);
        c.lineTo(cx - 14, 42);
        c.lineTo(cx + 8, 46);
        c.lineTo(cx + 34, 26);
        c.stroke();
        drawStar(c, cx + 34, 26, 6.5, '#fde047');
      } else if (mode === 'senior_letter') {
        // Otevřená obálka dopisu pro seniora se stoupajícími srdíčky
        c.fillStyle = '#fffbeb';
        c.strokeStyle = '#ea580c';
        c.lineWidth = 2.2;
        c.fillRect(cx - 30, cy - 10, 60, 36);
        c.strokeRect(cx - 30, cy - 10, 60, 36);
        c.beginPath();
        c.moveTo(cx - 30, cy - 10);
        c.lineTo(cx, cy + 8);
        c.lineTo(cx + 30, cy - 10);
        c.stroke();
        drawHeart(c, cx, cy - 18 - Math.abs(Math.sin(t * 2.4)) * 8, 8, '#ea580c');
        drawHeart(c, cx - 18, cy - 12 - Math.abs(Math.cos(t * 2)) * 6, 5.5, '#f59e0b');
      } else if (mode === 'owl_shield') {
        // Moudrá sovička a digitální ochranný štít pro seniora
        c.fillStyle = 'rgba(13, 148, 136, 0.18)';
        c.strokeStyle = '#0d9488';
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(cx, 14);
        c.lineTo(cx + 28, 24);
        c.quadraticCurveTo(cx + 26, 62, cx, 76);
        c.quadraticCurveTo(cx - 26, 62, cx - 28, 24);
        c.closePath();
        c.fill();
        c.stroke();
        // Oči moudré sovičky uvnitř štítu
        [-9, 9].forEach((ox) => {
          c.fillStyle = '#ffffff';
          c.strokeStyle = '#0f172a';
          c.lineWidth = 1.8;
          c.beginPath();
          c.arc(cx + ox, cy - 2, 7.5, 0, 6.28);
          c.fill();
          c.stroke();
          c.fillStyle = '#0f172a';
          c.beginPath();
          c.arc(cx + ox + gx * 4, cy - 2, 3.2, 0, 6.28);
          c.fill();
        });
        c.fillStyle = '#f59e0b';
        c.beginPath();
        c.moveTo(cx - 4, cy + 4);
        c.lineTo(cx + 4, cy + 4);
        c.lineTo(cx, cy + 11);
        c.closePath();
        c.fill();
      } else if (mode === 'memory_wave') {
        // Studiový mikrofon Paměti národa + živé zvukové vlny vzpomínek
        for (let b = -8; b <= 8; b++) {
          if (Math.abs(b) < 2) continue;
          const bh = 8 + Math.abs(Math.sin(t * 3 + b * 0.6)) * 26;
          c.fillStyle = Math.abs(b) % 2 ? '#d97706' : '#f59e0b';
          c.fillRect(cx + b * 11 - 2.5, cy - bh / 2, 5, bh);
        }
        c.fillStyle = '#78350f';
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 2.2;
        c.beginPath();
        c.roundRect?.(cx - 9, cy - 20, 18, 28, 9);
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(cx, cy + 8);
        c.lineTo(cx, by - 4);
        c.moveTo(cx - 12, by - 4);
        c.lineTo(cx + 12, by - 4);
        c.stroke();
      } else if (mode === 'book_booth') {
        // Dřevěná pouliční Knihobudka se stříškou a barevnými knihami
        c.strokeStyle = '#78350f';
        c.fillStyle = '#fef3c7';
        c.lineWidth = 2.4;
        c.fillRect(cx - 26, 28, 52, 46);
        c.strokeRect(cx - 26, 28, 52, 46);
        c.fillStyle = '#b45309';
        c.beginPath();
        c.moveTo(cx - 34, 30);
        c.lineTo(cx, 12);
        c.lineTo(cx + 34, 30);
        c.closePath();
        c.fill();
        const bookCols = ['#059669', '#e11d48', '#2563eb', '#d97706', '#8b5cf6'];
        bookCols.forEach((bc, idx) => {
          c.fillStyle = bc;
          c.fillRect(cx - 20 + idx * 8, 38, 6.5, 30);
        });
      } else if (mode === 'parcel_share') {
        // Sousedský balíček Nevyhazujto s kruhovou šipkou darování dál
        c.fillStyle = '#fde68a';
        c.strokeStyle = '#b45309';
        c.lineWidth = 2.2;
        c.fillRect(cx - 22, cy - 12, 44, 34);
        c.strokeRect(cx - 22, cy - 12, 44, 34);
        c.strokeStyle = '#10b981';
        c.lineWidth = 2.6;
        c.beginPath();
        c.arc(cx, cy + 4, 32, t, t + Math.PI * 1.35);
        c.stroke();
        drawHeart(c, cx, cy - 2, 7, '#059669');
      } else if (mode === 'eco_cleanup') {
        // Trash Hero: 5 květin rozkvétajících na vyčištěné louce
        c.fillStyle = 'rgba(16, 185, 129, 0.25)';
        c.fillRect(24, by, w - 48, 6);
        for (let f = 0; f < 5; f++) {
          const fx = 66 + f * 42;
          const fy = by - 18 - Math.sin(t * 2 + f) * 3;
          c.strokeStyle = '#059669';
          c.lineWidth = 2.2;
          c.beginPath();
          c.moveTo(fx, by);
          c.lineTo(fx, fy);
          c.stroke();
          c.fillStyle = f % 2 === 0 ? '#10b981' : '#34d399';
          for (let p = 0; p < 5; p++) {
            const a = (p * 6.28) / 5 + t;
            c.beginPath();
            c.arc(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6, 3.8, 0, 6.28);
            c.fill();
          }
          c.fillStyle = '#fbbf24';
          c.beginPath();
          c.arc(fx, fy, 3.5, 0, 6.28);
          c.fill();
        }
      } else if (mode === 'phone_recycle') {
        // Recyklace mobilu Remobil: telefon obklopený zeleným recyklačním kruhem a lístky
        c.fillStyle = '#f8fafc';
        c.strokeStyle = '#059669';
        c.lineWidth = 2.4;
        c.beginPath();
        c.roundRect?.(cx - 14, cy - 22, 28, 46, 5);
        c.fill();
        c.stroke();
        c.fillStyle = '#10b981';
        c.beginPath();
        c.arc(cx, cy + 16, 2.5, 0, 6.28);
        c.fill();
        drawHeart(c, cx, cy - 6, 6.5, '#10b981');
        c.strokeStyle = '#34d399';
        c.lineWidth = 2.4;
        c.beginPath();
        c.arc(cx, cy, 32, t * 1.4, t * 1.4 + 4.2);
        c.stroke();
      } else if (mode === 'compost_sprout') {
        // Komunitní kompost Mapko.cz: úrodná půda a klíčící rostlinka se 2 lístky
        c.fillStyle = '#78350f';
        c.beginPath();
        c.ellipse(cx, by + 2, 48, 12, 0, Math.PI, 6.28);
        c.fill();
        const stemH = 28 * Math.min(1, prog + 0.35);
        c.strokeStyle = '#16a34a';
        c.lineWidth = 3.5;
        c.beginPath();
        c.moveTo(cx, by - 4);
        c.quadraticCurveTo(cx + gx * 12, by - 4 - stemH * 0.5, cx, by - 4 - stemH);
        c.stroke();
        c.fillStyle = '#22c55e';
        c.beginPath();
        c.ellipse(cx - 10, by - 4 - stemH, 10, 5, -0.4, 0, 6.28);
        c.ellipse(cx + 10, by - 4 - stemH, 10, 5, 0.4, 0, 6.28);
        c.fill();
      } else if (mode === 'forest_bloom' || mode === 'fruit_tree') {
        // Strom Sázíme budoucnost / Ovocný strom Na ovoce
        c.fillStyle = 'rgba(16, 185, 129, 0.22)';
        c.fillRect(20, by, w - 40, 6);
        c.strokeStyle = '#78350f';
        c.lineWidth = 4.5;
        c.beginPath();
        c.moveTo(cx, by + 2);
        c.lineTo(cx, cy - 4);
        c.stroke();
        const canopy = [
          [0, -14, 18],
          [-14, -6, 14],
          [14, -6, 14],
          [0, -24, 13]
        ];
        canopy.forEach(([dx, dy, rad], idx) => {
          c.fillStyle = idx % 2 ? '#10b981' : '#059669';
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
            c.fillStyle = '#dc2626';
            c.beginPath();
            c.arc(cx + ax + gx * 6, cy + ay, 3.6, 0, 6.28);
            c.fill();
          });
        }
      } else if (mode === 'butterfly_lens') {
        // Motýl v hledáčku iNaturalist
        const flap = 0.55 + Math.abs(Math.sin(t * 4)) * 0.45;
        c.fillStyle = '#8b5cf6';
        c.beginPath();
        c.ellipse(cx - 12 * flap, cy - 6, 14 * flap, 10, -0.3, 0, 6.28);
        c.ellipse(cx + 12 * flap, cy - 6, 14 * flap, 10, 0.3, 0, 6.28);
        c.fill();
        c.fillStyle = '#ec4899';
        c.beginPath();
        c.ellipse(cx - 9 * flap, cy + 7, 10 * flap, 7, 0.3, 0, 6.28);
        c.ellipse(cx + 9 * flap, cy + 7, 10 * flap, 7, -0.3, 0, 6.28);
        c.fill();
        c.fillStyle = '#0f172a';
        c.fillRect(cx - 1.5, cy - 14, 3, 28);
        c.strokeStyle = '#10b981';
        c.lineWidth = 2;
        c.strokeRect(cx - 38, 14, 76, h - 28);
      } else if (mode === 'campfire_group') {
        // Táborák Hnutí Brontosaurus v přírodě
        c.fillStyle = 'rgba(16, 185, 129, 0.22)';
        c.fillRect(20, by, w - 40, 6);
        c.fillStyle = '#78350f';
        c.fillRect(cx - 18, by - 5, 36, 5);
        for (let f = 0; f < 3; f++) {
          c.fillStyle = f === 0 ? '#ea580c' : f === 1 ? '#f59e0b' : '#fde047';
          c.beginPath();
          c.arc(
            cx + (f - 1) * 6,
            by - 12 - f * 5 + Math.sin(t * 5 + f) * 2,
            11 - f * 2.5,
            0,
            6.28
          );
          c.fill();
        }
      } else if (mode === 'globe_bridge') {
        // Mezinárodní workcamp INEX-SDA: glóbus s poledníky a mostem spolupráce
        c.strokeStyle = '#0284c7';
        c.lineWidth = 2.2;
        c.beginPath();
        c.arc(cx, cy, 24, 0, 6.28);
        c.ellipse(cx, cy, 11, 24, 0, 0, 6.28);
        c.moveTo(cx - 24, cy);
        c.lineTo(cx + 24, cy);
        c.stroke();
        drawStar(c, cx - 34, cy - 10, 6, '#f59e0b');
        drawStar(c, cx + 34, cy - 10, 6, '#10b981');
      } else if (mode === 'water_spring') {
        // Lesní studánka s pramenem a kruhy na hladině
        for (let r = 0; r < 3; r++) {
          const rx = 18 + ((frame * 1.2 + r * 24) % 72);
          c.strokeStyle = '#0284c7';
          c.lineWidth = 1.8;
          c.beginPath();
          c.ellipse(cx, by - 8, rx, rx * 0.28, 0, 0, 6.28);
          c.stroke();
        }
        c.strokeStyle = '#38bdf8';
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(cx, by - 8);
        c.quadraticCurveTo(cx - 18, 22, cx - 32, by - 10);
        c.moveTo(cx, by - 8);
        c.quadraticCurveTo(cx + 18, 22, cx + 32, by - 10);
        c.stroke();
      } else if (mode === 'food_bank') {
        // Bedýnka čerstvých potravin Potravinové banky (jablko, chléb, konzerva)
        c.fillStyle = '#fde68a';
        c.strokeStyle = '#b45309';
        c.lineWidth = 2.2;
        c.fillRect(cx - 32, cy, 64, 26);
        c.strokeRect(cx - 32, cy, 64, 26);
        // Bochník chleba, jablko a zelenina v bedýnce
        c.fillStyle = '#d97706';
        c.beginPath();
        c.arc(cx - 14, cy, 11, Math.PI, 6.28);
        c.fill();
        c.fillStyle = '#dc2626';
        c.beginPath();
        c.arc(cx + 4, cy - 4, 7.5, 0, 6.28);
        c.fill();
        c.fillStyle = '#10b981';
        c.fillRect(cx + 14, cy - 12, 12, 12);
        drawHeart(c, cx, 20 - Math.abs(Math.sin(t * 2)) * 4, 6.5, '#ea580c');
      } else if (mode === 'soup_lantern') {
        // Miska teplé polévky со stoupající párou pod střechou Naděje
        c.strokeStyle = '#ea580c';
        c.fillStyle = '#fed7aa';
        c.lineWidth = 2.4;
        c.beginPath();
        c.arc(cx, cy + 6, 22, 0, Math.PI);
        c.closePath();
        c.fill();
        c.stroke();
        [-10, 0, 10].forEach((sx, idx) => {
          c.strokeStyle = '#f59e0b';
          c.lineWidth = 2;
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
        // Hrnec Zachraň jídlo s mrkví a bylinkami
        c.fillStyle = '#f97316';
        c.strokeStyle = '#9a3412';
        c.lineWidth = 2.2;
        c.fillRect(cx - 24, cy - 2, 48, 28);
        c.strokeRect(cx - 24, cy - 2, 48, 28);
        // Mrkev vykukující z hrnce
        c.fillStyle = '#ea580c';
        c.beginPath();
        c.moveTo(cx - 8, cy - 2);
        c.lineTo(cx, cy - 22);
        c.lineTo(cx + 8, cy - 2);
        c.closePath();
        c.fill();
        c.fillStyle = '#22c55e';
        c.beginPath();
        c.arc(cx, cy - 24, 5, 0, 6.28);
        c.fill();
      } else if (mode === 'bakery_save') {
        // Zlatý croissant Nesnězeno s hvězdičkami čerstvosti
        c.fillStyle = '#f59e0b';
        c.strokeStyle = '#b45309';
        c.lineWidth = 2.2;
        c.beginPath();
        c.arc(cx, cy + 6, 20, Math.PI * 1.1, Math.PI * 1.9);
        c.quadraticCurveTo(cx + 10, cy + 4, cx + 18, cy + 12);
        c.quadraticCurveTo(cx, cy - 2, cx - 18, cy + 12);
        c.closePath();
        c.fill();
        c.stroke();
        drawStar(c, cx - 22, cy - 12, 6, '#fbbf24');
        drawStar(c, cx + 22, cy - 10, 6, '#10b981');
      } else if (mode === 'wheels_motion') {
        // Jízdní kolo Kola pro Afriku
        const wx1 = cx - 28 + Math.sin(t) * 6;
        const wx2 = cx + 28 + Math.sin(t) * 6;
        const wy = by - 12;
        [wx1, wx2].forEach((wx) => {
          c.strokeStyle = '#047857';
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
        c.strokeStyle = '#d97706';
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(wx1, wy);
        c.lineTo(cx - 4, wy - 18);
        c.lineTo(wx2, wy);
        c.lineTo(cx + 12, wy - 20);
        c.stroke();
      } else if (mode === 'kinetic_steps') {
        // EPP Pomáhej pohybem: stoupající energetické sloupce a tep pohybu
        for (let b = 0; b < 8; b++) {
          const bh = Math.min(48, 10 + b * 5 + Math.abs(Math.sin(t * 3 + b)) * 10);
          c.fillStyle = b % 2 ? '#10b981' : '#f59e0b';
          c.fillRect(68 + b * 21, by - bh, 13, bh);
        }
        drawStar(c, cx + 64, 20, 7.5, '#fbbf24');
      } else if (mode === 'shoebox_gift') {
        // Krabice od bot s mašlí a nadzvedávajícím se víkem
        const lidLift = Math.abs(Math.sin(t * 2.5)) * 5;
        c.fillStyle = '#e11d48';
        c.fillRect(cx - 24, cy - 2, 48, 28);
        c.fillStyle = '#fbbf24';
        c.fillRect(cx - 4, cy - 2, 8, 28);
        // Víko krabice a mašle
        c.fillStyle = '#be123c';
        c.fillRect(cx - 27, cy - 10 - lidLift, 54, 9);
        c.strokeStyle = '#fbbf24';
        c.lineWidth = 2.4;
        c.beginPath();
        c.ellipse(cx - 8, cy - 15 - lidLift, 8, 4, -0.3, 0, 6.28);
        c.ellipse(cx + 8, cy - 15 - lidLift, 8, 4, 0.3, 0, 6.28);
        c.stroke();
        drawStar(c, cx, cy - 24 - lidLift, 6.5, '#fde047');
      } else if (mode === 'angel_wings') {
        // Andělská křídla a svatozář Dobrý anděl
        const wingFlap = Math.sin(t * 3) * 5;
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 2.6;
        c.beginPath();
        c.ellipse(cx, 18, 16, 4.5, 0, 0, 6.28);
        c.stroke();
        c.fillStyle = 'rgba(255, 255, 255, 0.92)';
        c.strokeStyle = '#38bdf8';
        c.lineWidth = 2;
        [-1, 1].forEach((dir) => {
          c.beginPath();
          c.moveTo(cx + dir * 6, cy + 4);
          c.quadraticCurveTo(
            cx + dir * 42,
            cy - 22 + wingFlap,
            cx + dir * 36,
            cy + 16
          );
          c.quadraticCurveTo(cx + dir * 18, cy + 20, cx + dir * 6, cy + 4);
          c.fill();
          c.stroke();
        });
        drawHeart(c, cx, cy - 2, 8, '#fbbf24');
      } else if (mode === 'charity_care') {
        // Pečující dlaně a srdce Charita ČR
        c.strokeStyle = '#059669';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(cx, cy + 4, 24, 0.3, Math.PI - 0.3);
        c.stroke();
        drawHeart(c, cx, cy - 12 + Math.sin(t * 2.5) * 3, 12, '#10b981');
      } else {
        // Most přímé solidarity Znesnáze21
        c.strokeStyle = '#0d9488';
        c.lineWidth = 3.2;
        c.beginPath();
        c.moveTo(cx - 48, by - 8);
        c.quadraticCurveTo(cx, 14, cx + 48, by - 8);
        c.stroke();
        c.fillStyle = '#0d9488';
        c.beginPath();
        c.arc(cx - 48, by - 8, 6, 0, 6.28);
        c.arc(cx + 48, by - 8, 6, 0, 6.28);
        c.fill();
        drawHeart(c, cx, cy - 10 + Math.sin(t * 2.4) * 3, 9.5, '#f43f5e');
      }
    }

    if (!red) id = requestAnimationFrame(fn);
  };

  fn();

  return () => {
    cancelAnimationFrame(id);
    removeEventListener('deviceorientation', onO);
    cv.removeEventListener('pointermove', onP);
    cv.removeEventListener('pointerdown', onDown);
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
    const silent = !!p?.silent;
    const spec = resolveActionEffectSpec(action);
    currentOnMetric?.(spec.target, spec.format(spec.target), spec);
    if (!silent) {
      playPayoffAsmr(action);
    }
    destroy = mountImpactCanvas(node, {
      action,
      mode: spec.mode,
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
