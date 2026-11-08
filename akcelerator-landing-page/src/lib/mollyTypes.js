/**
 * Pure data module for Molly's treat catalog and mode mappings.
 * Extracted to eliminate circular dependency between mollyStore.js and sensoryEngine.js (M13 / AUDIT #3).
 */

export const MOLLY_TREAT_BY_FOOD = {
  salmon: {
    icon: '🐟',
    name: 'lososová granulka',
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
    name: 'křupavá hvězdička',
    shortLabel: '+1 hvězdička pro Molly',
    color: '#a78bfa',
    foodType: 'star_treat'
  }
};

export const MODE_TO_MOLLY_FOOD = {
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

/**
 * Dárky pro Molly za skutečné skutky (ne za klepání do plátna). Každý dárek se natrvalo vykreslí na kočce
 * (obojek → zvoneček → květinová korunka → hvězdička), aby návrat ke skutkům měl viditelnou stopu.
 * Záměrně bez „levelů“ — jde o vděčnost, ne o soutěž.
 */
export const MOLLY_MILESTONES = [
  { at: 3, key: 'collar', icon: '💚', name: 'smaragdový obojek' },
  { at: 10, key: 'bell', icon: '🔔', name: 'zlatý zvoneček' },
  { at: 25, key: 'flower', icon: '🌼', name: 'květinová korunka' },
  { at: 50, key: 'star', icon: '⭐', name: 'zářivá hvězdička' }
];

/**
 * @param {number} total
 * @returns {{ collar: boolean, bell: boolean, flower: boolean, star: boolean }}
 */
export function getMollyAccessories(total) {
  const n = Math.max(0, Number(total) || 0);
  return {
    collar: n >= 3,
    bell: n >= 10,
    flower: n >= 25,
    star: n >= 50
  };
}

/**
 * Vrátí dárek, který byl právě odemčen přechodem z `prevTotal` na `nextTotal`, jinak null.
 * @param {number} prevTotal
 * @param {number} nextTotal
 */
export function getUnlockedMilestone(prevTotal, nextTotal) {
  const a = Math.max(0, Number(prevTotal) || 0);
  const b = Math.max(0, Number(nextTotal) || 0);
  for (let i = MOLLY_MILESTONES.length - 1; i >= 0; i--) {
    const m = MOLLY_MILESTONES[i];
    if (a < m.at && b >= m.at) return m;
  }
  return null;
}

/**
 * České skloňování slova „pamlsek“.
 * @param {number} n
 */
export function pluralPamlsek(n) {
  if (n === 1) return 'pamlsek';
  if (n >= 2 && n <= 4) return 'pamlsky';
  return 'pamlsků';
}

/**
 * České skloňování slova „skutek“.
 * @param {number} n
 */
export function pluralSkutek(n) {
  if (n === 1) return 'skutek';
  if (n >= 2 && n <= 4) return 'skutky';
  return 'skutků';
}

/**
 * Krátký popis dalšího dárku pro tooltip / čtečky obrazovky.
 * Dárky se odemykají jen skutečnými skutky (ne klepáním do plátna).
 * @param {number} deeds
 */
export function describeNextMollyGift(deeds) {
  const n = Math.max(0, Number(deeds) || 0);
  const next = MOLLY_MILESTONES.find((m) => n < m.at);
  if (!next) return 'Molly má všechny dárky. Děkuje za každý tvůj skutek!';
  const left = next.at - n;
  const verb = left >= 2 && left <= 4 ? 'chybějí' : 'chybí';
  return `Do dárku „${next.name}“ ${next.icon} ${verb} ${left} ${pluralSkutek(left)}.`;
}

/**
 * Viditelný postup k dalšímu dárku (pro ukazatel v pelíšku — tooltip na dotykových zařízeních nejde vidět).
 * @param {number} deeds
 * @returns {{ pct: number, done: number, need: number, icon: string, complete: boolean }}
 */
export function getNextMollyGiftProgress(deeds) {
  const n = Math.max(0, Number(deeds) || 0);
  const idx = MOLLY_MILESTONES.findIndex((m) => n < m.at);
  if (idx === -1) return { pct: 100, done: n, need: n, icon: '⭐', complete: true };
  const next = MOLLY_MILESTONES[idx];
  const prevAt = idx > 0 ? MOLLY_MILESTONES[idx - 1].at : 0;
  const span = next.at - prevAt;
  const pct = Math.round(((n - prevAt) / span) * 100);
  return { pct: Math.max(0, Math.min(100, pct)), done: n, need: next.at, icon: next.icon, complete: false };
}

/**
 * Molly jako průvodkyně: jemná nápověda při prvním příchodu na stránku (1× za session)
 * a nabídka hlavního kroku po chvíli nečinnosti (prvek s atributem `data-molly-guide`).
 * @type {Record<string, { icon: string, hint: string, nudge: string }>}
 */
export const MOLLY_ROUTE_GUIDES = {
  '/': {
    icon: '🐾',
    hint: 'Vyber, kolik máš času, a já ti ukážu jeden lehký skutek.',
    nudge: 'Tenhle skutek zabere jen chvilku. Zkusíš ho se mnou?'
  },
  '/app': {
    icon: '🧭',
    hint: 'Vyber si cestu, která ti dnes sedí. Každá vede ke skutečné pomoci.',
    nudge: 'Nevíš, kudy kam? Průvodce ti najde skutek na míru.'
  },
  '/app/guided': {
    icon: '🧭',
    hint: 'Pár otázek a najdu ti skutek přesně na míru.',
    nudge: 'Tenhle skutek ti teď sedí nejvíc. Zkusíš ho?'
  },
  '/app/online': {
    icon: '⏱️',
    hint: 'Tady stačí pár minut a telefon. Vyber si jeden krok.',
    nudge: 'Tenhle krok zvládneš hned teď, odkudkoliv.'
  },
  '/near': {
    icon: '📍',
    hint: 'Podívej se, kdo potřebuje pomoc kousek od tebe.',
    nudge: 'Začni třeba tímhle místem. Jak pomoct, máš napsané přímo na kartě.'
  },
  '/svet': {
    icon: '✨',
    hint: 'Tady u jezera bydlím. Klikni na hladinu a rozsviť své světlo.',
    nudge: 'Zkus se mnou chvilku klidně dýchat.'
  },
  '/submit': {
    icon: '🌱',
    hint: 'Znáš místo, kde se pomáhá? Přidej ho a ukaž cestu dalším.',
    nudge: 'Stačí název a místo. Před zveřejněním to ještě zkontrolujeme.'
  }
};

/**
 * Pozdrav podle denní doby (lokální čas zařízení).
 * @param {Date} [d]
 */
export function getMollyGreeting(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 10) return 'Dobré ráno!';
  if (h >= 10 && h < 18) return 'Ahoj!';
  if (h >= 18 && h < 23) return 'Dobrý večer!';
  return 'Ahoj, noční sovo!';
}

