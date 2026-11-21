/**
 * Pure data module for Molly's treat catalog and mode mappings.
 * Extracted to eliminate circular dependency between mollyStore.js and sensory catalog/resolvers (M13 / AUDIT #3).
 */

/**
 * @typedef {import('./types/molly.js').MollyFoodType} MollyFoodType
 * @typedef {import('./types/molly.js').MollyTreat} MollyTreat
 */

/** @type {Record<MollyFoodType, MollyTreat>} */
export const MOLLY_TREAT_BY_FOOD = {
  salmon: {
    icon: 'fish',
    name: 'lososová granulka',
    nameAcc: 'lososovou granulku',
    shortLabel: 'Rybka pro Molly',
    color: '#f59e0b',
    foodType: 'salmon'
  },
  milk: {
    icon: 'milk',
    name: 'teplé kočičí mlíčko v misce',
    nameAcc: 'teplé kočičí mlíčko',
    shortLabel: 'Mlíčko pro Molly',
    color: '#fde68a',
    foodType: 'milk'
  },
  tuna: {
    icon: 'fish',
    name: 'rýžový polštářek s tuňákem',
    nameAcc: 'rýžový polštářek s tuňákem',
    shortLabel: 'Voňavé sousto pro Molly',
    color: '#fbbf24',
    foodType: 'tuna'
  },
  catnip: {
    icon: 'leaf',
    name: 'čerstvý lístek šanty kočičí',
    nameAcc: 'čerstvý lístek šanty kočičí',
    shortLabel: 'Lístek šanty pro Molly',
    color: '#4ade80',
    foodType: 'catnip'
  },
  cream: {
    icon: 'heart',
    name: 'smetanový pamlsek a klubíčko',
    nameAcc: 'smetanový pamlsek a klubíčko',
    shortLabel: 'Smetanový pamlsek pro Molly',
    color: '#f472b6',
    foodType: 'cream'
  },
  star_treat: {
    icon: 'sparkles',
    name: 'křupavá hvězdička',
    nameAcc: 'křupavou hvězdičku',
    shortLabel: 'Křupavá hvězdička pro Molly',
    color: '#a78bfa',
    foodType: 'star_treat'
  }
};

/** @type {Record<string, MollyFoodType>} */
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

/**
 * @param {string | { mode?: string | null } | null | undefined} specOrMode
 * @returns {MollyTreat}
 */
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
 * @type {import('./types/molly.js').MollyMilestone[]}
 */
export const MOLLY_MILESTONES = [
  { at: 3, key: 'collar', icon: 'heart', name: 'smaragdový obojek' },
  { at: 10, key: 'bell', icon: 'bell', name: 'zlatý zvoneček' },
  { at: 25, key: 'flower', icon: 'flower-2', name: 'květinová korunka' },
  { at: 50, key: 'star', icon: 'star', name: 'zářivá hvězdička' }
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
  if (!next) return 'Molly už má všechny dárky. Děkuje za každý tvůj skutek.';
  const left = next.at - n;
  const verb = left >= 2 && left <= 4 ? 'chybějí' : 'chybí';
  return `Do dárku „${next.name}“ ${verb} ${left} ${pluralSkutek(left)}.`;
}

/**
 * Viditelný postup k dalšímu dárku (pro ukazatel v pelíšku — tooltip na dotykových zařízeních nejde vidět).
 * @param {number} deeds
 * @returns {{ pct: number, done: number, need: number, icon: string, complete: boolean }}
 */
export function getNextMollyGiftProgress(deeds) {
  const n = Math.max(0, Number(deeds) || 0);
  const idx = MOLLY_MILESTONES.findIndex((m) => n < m.at);
  if (idx === -1) return { pct: 100, done: n, need: n, icon: 'star', complete: true };
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
    icon: 'paw',
    hint: 'Vyber si, kolik máš dnes času — ukážu ti jeden klidný skutek.',
    nudge: 'Tenhle drobný krok zabere jen chvilku.'
  },
  '/app': {
    icon: 'compass',
    hint: 'Vyber si cestu, která ti dnes sedí.',
    nudge: 'Když si nebudeš vědět rady s výběrem, najdeme krok na míru.'
  },
  '/app/guided': {
    icon: 'compass',
    hint: 'Společně najdeme pomoc, která ti dnes nejlépe sedne.',
    nudge: 'Tenhle skutek by ti teď mohl sedět.'
  },
  '/app/online': {
    icon: 'clock',
    hint: 'Tady stačí pár minut z domova. Vyber si jeden krok.',
    nudge: 'Tenhle krok zvládneš v klidu odkudkoliv.'
  },
  '/near': {
    icon: 'map-pin',
    hint: 'Podívej se, kdo potřebuje pomoc kousek od tebe.',
    nudge: 'Můžeš začít tímto místem — je tu i krátký návod.'
  },
  '/svet': {
    icon: 'sparkles',
    hint: 'Tady u lesní tůně odpočívám. Dotykem hladiny rozsvítíš své světlo.',
    nudge: 'Zkus si tu na chvilku klidně vydechnout.'
  },
  '/submit': {
    icon: 'sprout',
    hint: 'Znáš místo, kde se pomáhá? Přidej ho a ukaž cestu dalším.',
    nudge: 'Stačí jen název a adresa, zbytek s péčí ověříme.'
  }
};

/**
 * Pozdrav podle denní doby (lokální čas zařízení).
 * @param {Date} [d]
 */
export function getMollyGreeting(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 10) return 'Dobré ráno.';
  if (h >= 10 && h < 18) return 'Klidný den.';
  if (h >= 18 && h < 23) return 'Dobrý večer.';
  return 'Tichou noc.';
}

/**
 * Vlídná a klidná šeptanda při pohlazení, když uživatel ještě nezískal pamlsek (delayed gratification).
 * Záměrně bez kárání či herních hlášek — Molly vyjadřuje vděčnost za blízkost a jemně
 * směřuje pozornost ke skutečnému dobrému skutku, po kterém si s radostí pochutná na odměně.
 */
export const MOLLY_UNEARNED_PET_WHISPERS = [
  'Mrrr… děkuji za pohlazení. Pamlsek si šetřím za dobrý skutek.',
  'Tvoje blízkost mě těší. Pomoc druhým najdeš i na dvě minuty.',
  'Předu ti pod dlaní. Pamlsky si nechávám na poděkování za skutek.',
  'Mrrr… pohlazení hřeje. Pomoc druhým začíná i maličkostí.',
  'Tichounce předu s tebou. Po dobrém skutku si dám dobrotu.',
  'Děkuji za pohlazení. Čerstvou dobrotu si zasloužím za tvůj skutek.',
  'Mrrr… každý dobrý krok začíná v klidu. Pak si dám odměnu.',
  'Předu s tebou. Na pamlsek se těším po tvém dobrém skutku.'
];

/**
 * Běžná šeptanda při pohlazení, když uživatel pamlsky má nebo se s Molly jen tak mazlí.
 */
export const MOLLY_PET_WHISPERS = [
  'Mrrr… každá drobná laskavost krásně hřeje.',
  'Tichounce předu. Děkuji, že tu dnes jsi.',
  'Mrrr… tvá laskavost zahřeje víc než odpolední slunce.',
  'U lesní tůně v Krajině dobra je klidné místo i pro tebe.',
  'Předu s tebou. Každý malý skutek se počítá.',
  'Mrrr… klidně si na chvilku vydechni, hlídám to tu s tebou.',
  'Děláš svět kolem o kousek vlídnějším místem.',
  'Tvoje pomoc má smysl. I malý krok mění den k lepšímu.'
];


