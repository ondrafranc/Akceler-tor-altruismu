import { writable, derived, get } from 'svelte/store';
import { getRandomEncouragement, MICRO_ACTIONS } from './data/czech-actions.js';
import { CLICK_AND_FEED } from './data/impactFacts.js';
import { trackEvent, trackFunnel, hasActionStarted } from './analytics.js';
import {
  feedMollyFromAction,
  unlockMollyTreat,
  mollyState,
  MOLLY_STORAGE_KEY
} from './mollyStore.js';
import {
  safeGetItem,
  safeSetItem,
  stripLeadingEmoji as canonicalStripLeadingEmoji,
  exportProgressPasscode,
  importProgressPasscode
} from './utils.js';

const STORAGE_KEY = 'aa_completed_steps_v2';
const WISHES_STORAGE_KEY = 'aa_sanctuary_wishes_v1';

/**
 * Tři sémantické typy světel v Krajině dobra (/svet):
 * - Lucerna (lantern): Osobní skutek na vodní hladině
 * - Hvězda (star): Inspirace na obloze
 * - Vlna (wave): Pomoc druhému (soustředné kruhy na hladině)
 */
export const LIGHT_TYPES = [
  {
    key: 'lantern',
    icon: '🏮',
    label: 'Lucerna',
    meaning: 'Osobní skutek',
    defaultZone: 'water'
  },
  {
    key: 'star',
    icon: '✦',
    label: 'Hvězda',
    meaning: 'Inspirace',
    defaultZone: 'sky'
  },
  {
    key: 'wave',
    icon: '〰️',
    label: 'Vlna',
    meaning: 'Pomoc druhému',
    defaultZone: 'water'
  }
];

/**
 * Pět přírodních motivů v Krajině dobra (/svet).
 * Krajina je vždy naplno rozsvícená a propojená se skutečnými dobrými skutky.
 */
export const SANCTUARY_ELEMENTS = [
  {
    key: 'animals',
    title: 'Pomoc zvířatům',
    subtitle: 'Útulky, ptáci a volná příroda',
    icon: '🐾',
    color: '#fbbf24',
    softColor: '#fde68a',
    glow: 'rgba(251, 191, 36, 0.55)',
    effectDesc: 'Zlaté světlušky u břehu tůně',
    questLabel: 'Pomoci zvířatům',
    questHref: '/app/guided?topic=animals'
  },
  {
    key: 'nature',
    title: 'Péče o krajinu',
    subtitle: 'Stromy, studánky a čisté okolí',
    icon: '🌿',
    color: '#34d399',
    softColor: '#a7f3d0',
    glow: 'rgba(52, 211, 153, 0.55)',
    effectDesc: 'Smaragdové světlo v korunách stromů',
    questLabel: 'Pomoci přírodě',
    questHref: '/app/guided?topic=environment'
  },
  {
    key: 'community',
    title: 'Blízkost lidem',
    subtitle: 'Sousedé, senioři a místní komunita',
    icon: '🏮',
    color: '#fb923c',
    softColor: '#fed7aa',
    glow: 'rgba(251, 146, 60, 0.55)',
    effectDesc: 'Teplé lucerny na zrcadlové hladině',
    questLabel: 'Pomoci lidem v okolí',
    questHref: '/app/guided?topic=elderly'
  },
  {
    key: 'care',
    title: 'Zdraví a opora',
    subtitle: 'Dárcovství, rodiny v nouzi a duševní opora',
    icon: '💜',
    color: '#c084fc',
    softColor: '#f3e8ff',
    glow: 'rgba(192, 132, 252, 0.55)',
    effectDesc: 'Jasné hvězdy odrážející se ve vodě',
    questLabel: 'Podpořit zdraví a druhé',
    questHref: '/app/guided?topic=health'
  },
  {
    key: 'knowledge',
    title: 'Sdílené poznání',
    subtitle: 'Doučování, mapování a otevřené znalosti',
    icon: '🌌',
    color: '#38bdf8',
    softColor: '#bae6fd',
    glow: 'rgba(56, 189, 248, 0.55)',
    effectDesc: 'Jemná záře nad horským sedlem',
    questLabel: 'Pomoci znalostmi',
    questHref: '/app/guided?topic=education'
  }
];

/**
 * Skutečné příběhy a čísla o pomoci v Česku s primárními zdroji a daty ověření.
 */
export const HOPE_PROOFS = [
  {
    id: 'click_feed',
    title: `Přes ${CLICK_AND_FEED.totalTonnesLabel} tun krmiva pro ${CLICK_AND_FEED.shelters} útulků vyklikaných zdarma`,
    realWorldProof:
      `V českém projektu Click and Feed už lidé bezplatným kliknutím (1 klik = cca ${CLICK_AND_FEED.gramsPerClick} g krmiva od sponzora ${CLICK_AND_FEED.sponsor}) poslali přes ${CLICK_AND_FEED.totalTonnesLabel} tun krmiva do ${CLICK_AND_FEED.shelters} útulků.`,
    psychNote:
      'I patnáctivteřinová pomoc ti připomene, že na světě kolem sebe máš reálný podíl.',
    sourceLabel: 'Click and Feed (Brit)',
    sourceUrl: 'https://clickandfeed.cz/',
    verifiedAt: '11/2026'
  },
  {
    id: 'bird_stops',
    title: 'Bezpečné zastávky pro tisíce ptáků díky fotkám z mobilu',
    realWorldProof:
      'Díky dvouminutovým hlášením kolemjdoucích v projektu Ptačí pasti ČSO už desítky českých obcí bezpečně polepily prosklené zastávky.',
    psychNote:
      'Když si na cestě ven všímáš okolí, pomůžeš přírodě a zároveň příjemně zpomalíš vlastní hlavu.',
    sourceLabel: 'Česká společnost ornitologická – Ptačí pasti',
    sourceUrl: 'https://projekty.birds.cz/ptacipasti/',
    verifiedAt: '11/2026'
  },
  {
    id: 'remobil_drawers',
    title: '221 060 starých mobilů ze šuplíků (2,21 mil. Kč pro charitu)',
    realWorldProof:
      'Lidé v Česku už přes neziskový projekt Remobil odevzdali 221 060 nepotřebných telefonů (10 Kč z každého jde na charitu) — vznikla tak práce pro lidi s hendikepem a úspora surovin.',
    psychNote:
      'Poslat dál jednu nepotřebnou věc z domova uleví prostoru kolem tebe a hned pomůže někomu dalšímu.',
    sourceLabel: 'Remobil z.s. – Oficiální statistiky sběru',
    sourceUrl: 'https://remobil.cz/',
    verifiedAt: '11/2026'
  },
  {
    id: 'marrow_youth',
    title: '170 104 registrovaných dárců dřeně a 2 939 skutečných odběrů',
    realWorldProof:
      'Jednoduchý pětiminutový stěr z úst od dobrovolníků v ČNRDD už umožnil 2 939 odběrů krvetvorných buněk pro vážně nemocné pacienty.',
    psychNote:
      'Většina dobrých věcí kolem nás se děje potichu — i proto je jich mnohem víc, než je vidět ve zprávách.',
    sourceLabel: 'ČNRDD – Aktuální čísla registru',
    sourceUrl: 'https://registr.kostnidren.cz/o-registru/aktualni-cisla/',
    verifiedAt: '09/2026'
  },
  {
    id: 'food_saved',
    title: '17 400 tun zachráněného jídla ročně pro 430 000 lidí v nouzi',
    realWorldProof:
      'České potravinové banky každoročně díky dobrovolníkům zachrání 17 400 tun dobrého jídla pro samoživitele, seniory a rodiny v tísni.',
    psychNote:
      'Podle výzkumů sociálních sítí se každý dobrý skutek přirozeně šíří od člověka k člověku až o tři stupně dál.',
    sourceLabel: 'Česká federace potravinových bank (Výroční zpráva)',
    sourceUrl: 'https://www.potravinovebanky.cz/uploads/dms/pdf/6a2004ae277ef699586774.pdf',
    verifiedAt: '02/2026'
  }
];

// Zpětná kompatibilita pro případné importy
export const WORLD_MILESTONES = HOPE_PROOFS;

/**
 * Odvodí barevný motiv ('animals' | 'nature' | 'community' | 'care' | 'knowledge') pro libovolný krok.
 * @param {any} step
 * @returns {'animals' | 'nature' | 'community' | 'care' | 'knowledge'}
 */
export function inferStepElement(step) {
  if (step?.element && SANCTUARY_ELEMENTS.some((e) => e.key === step.element)) {
    return step.element;
  }

  const catalogMatch = Array.isArray(MICRO_ACTIONS)
    ? MICRO_ACTIONS.find((a) => a.id === step?.id)
    : null;

  if (catalogMatch?.element && SANCTUARY_ELEMENTS.some((e) => e.key === catalogMatch.element)) {
    return /** @type {any} */ (catalogMatch.element);
  }

  const vals = step?.values || catalogMatch?.values || [];
  if (vals.includes('animals') || step?.category === 'animals') return 'animals';
  if (vals.includes('environment')) return 'nature';
  if (vals.includes('elderly') || vals.includes('community') || step?.category === 'community') return 'community';
  if (vals.includes('education')) return 'knowledge';
  if (vals.includes('health') || vals.includes('poverty') || vals.includes('children') || step?.category === 'food') {
    return 'care';
  }

  const t = String(step?.title || '').toLowerCase();
  if (t.includes('útulk') || t.includes('zvíř') || t.includes('ptač') || t.includes('strnad') || t.includes('misk')) {
    return 'animals';
  }
  if (t.includes('strom') || t.includes('les') || t.includes('přírod') || t.includes('odpad') || t.includes('studánk')) {
    return 'nature';
  }
  if (t.includes('senior') || t.includes('knihobud') || t.includes('soused')) {
    return 'community';
  }
  if (t.includes('wikiped') || t.includes('věd') || t.includes('douč') || t.includes('kvíz') || t.includes('apel')) {
    return 'knowledge';
  }
  return 'care';
}

/**
 * Odstraní úvodní emoji (včetně složených ZWJ sekvencí jako 🧑‍🏫 nebo 💇‍♀️) z názvu skutku (M22).
 * @param {string} str
 */
export function stripLeadingEmoji(str) {
  const cleaned = canonicalStripLeadingEmoji(str);
  return cleaned || String(str || '').trim();
}

function loadSteps() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = safeGetItem(STORAGE_KEY, 'local');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => {
      const element = inferStepElement(item);
      return {
        ...item,
        title: stripLeadingEmoji(item?.title || 'Malý dobrý krok'),
        element
      };
    });
  } catch {
    return [];
  }
}

function saveSteps(steps) {
  if (typeof window === 'undefined') return;
  try {
    safeSetItem(STORAGE_KEY, JSON.stringify(steps.slice(-150)), 'local');
  } catch {}
}

function loadWishes() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = safeGetItem(WISHES_STORAGE_KEY, 'local');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      title: stripLeadingEmoji(item?.title || 'Drobný osobní skutek v běžném dni')
    }));
  } catch {
    return [];
  }
}

function saveWishes(list) {
  if (typeof window === 'undefined') return;
  try {
    safeSetItem(WISHES_STORAGE_KEY, JSON.stringify(list.slice(-80)), 'local');
  } catch {}
}

export const completedSteps = writable([]);
export const sanctuaryWishes = writable([]);

if (typeof window !== 'undefined') {
  completedSteps.set(loadSteps());
  sanctuaryWishes.set(loadWishes());
}

export const totalCompletedCount = derived(completedSteps, ($steps) => $steps.length);

export const todayCompletedCount = derived(completedSteps, ($steps) => {
  // Lokální kalendářní den (ne UTC) — v Česku by jinak skutky po půlnoci padaly do včerejška
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  return $steps.filter((s) => {
    if (typeof s?.timestamp !== 'string') return false;
    const d = new Date(s.timestamp);
    return !Number.isNaN(d.getTime()) && `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayKey;
  }).length;
});

/**
 * Kroky, které si uživatel může (pokud chce) umístit do své tůně nebo na oblohu v /svet
 */
export const unplantedSteps = derived(completedSteps, ($steps) =>
  $steps.filter((s) => s?.awaitingPlant === true && !s?.plantedPos)
);

export const elementCounts = derived(completedSteps, ($steps) => {
  /** @type {Record<string, number>} */
  const counts = {
    animals: 0,
    nature: 0,
    community: 0,
    care: 0,
    knowledge: 0
  };
  for (const s of $steps) {
    const el = inferStepElement(s);
    counts[el] = (counts[el] || 0) + 1;
  }
  return counts;
});

/**
 * Útočiště je vždy na 100 % své plné krásy — žádné úrovně ani tlak na výkon!
 */
export const worldHealPercent = derived(totalCompletedCount, () => 100);

export const ripplePeopleCount = derived(totalCompletedCount, ($count) => $count * 3);

/**
 * Stav pro klidný „After done“ modál bez nátlakových ukazatelů
 * @type {import('svelte/store').Writable<{ open: boolean, title: string, message: string, surface: string, element: string, concreteImpact?: string } | null>}
 */
export const activeCelebration = writable(null);

/**
 * Zaznamená dokončený malý krok a otevře klidné, nenátlakové poděkování.
 * @param {{ id?: string, title: string, surface?: string, category?: string, element?: string, concreteImpact?: string, lightType?: 'lantern' | 'star' | 'wave', silent?: boolean }} step
 */
export function recordSmallWin(step, options = {}) {
  const catalogMatch = Array.isArray(MICRO_ACTIONS)
    ? MICRO_ACTIONS.find((a) => a.id === step?.id)
    : null;
  const element = inferStepElement(step || catalogMatch);
  const concreteImpact = step?.concreteImpact || catalogMatch?.concreteImpact || '';
  const stepId = step?.id || 'step';
  const verifiedInitiation = hasActionStarted(stepId);
  const defaultLightType =
    step?.lightType ||
    (catalogMatch?.recipientMacro === 'people' && catalogMatch?.social === 'group' ? 'wave' : 'lantern');

  const cleanedTitle = stripLeadingEmoji(step?.title || 'Malý dobrý krok') || 'Malý dobrý krok';

  const entry = {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    id: stepId,
    title: cleanedTitle,
    surface: step?.surface || 'app',
    category: step?.category || '',
    element,
    concreteImpact,
    lightType: defaultLightType,
    verifiedInitiation,
    awaitingPlant: true,
    plantedPos: null,
    note: '',
    timestamp: new Date().toISOString()
  };

  completedSteps.update((list) => {
    const next = [...list, entry];
    saveSteps(next);
    return next;
  });

  const isSilent = Boolean(step?.silent || options?.silent);
  // Odložená odměna: skutek odemkne 1 pamlsek pro Molly (delayed gratification)
  unlockMollyTreat(catalogMatch || step || entry, {
    reason: 'small_win',
    source: 'win'
  });

  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    fetch('/api/pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id: entry.id, kind: 'completed' })
    }).catch(() => {});
  }

  trackEvent('aa_small_win', {
    surface: entry.surface,
    id: entry.id,
    element,
    verifiedInitiation
  });

  trackFunnel('action_completed_self_reported', {
    id: entry.id,
    surface: entry.surface,
    verified_initiation: verifiedInitiation
  });

  if (
    verifiedInitiation ||
    entry.surface === 'near' ||
    catalogMatch?.mode === 'local' ||
    catalogMatch?.commitment === 'long_term'
  ) {
    trackFunnel('real_world_conversion', {
      id: entry.id,
      surface: entry.surface,
      verified_initiation: verifiedInitiation,
      commitment: catalogMatch?.commitment || 'one_off'
    });
  }

  if (!isSilent) {
    activeCelebration.set({
      open: true,
      id: entry.id,
      category: entry.category,
      title: entry.title,
      message: getRandomEncouragement(),
      surface: entry.surface,
      element,
      concreteImpact
    });
  }

  return entry;
}

/**
 * Uloží souřadnice hvězdy, vodní lucerny nebo vlny v Krajině dobra (/svet).
 * @param {string} uid
 * @param {{ x: number, y: number, lightType?: 'lantern' | 'star' | 'wave' }} pos
 */
export function plantStepLight(uid, pos) {
  const clampedX = Math.max(0.06, Math.min(0.94, Number(pos?.x) || 0.5));
  const clampedY = Math.max(0.07, Math.min(0.88, Number(pos?.y) || 0.28));
  const zone = clampedY < 0.53 ? 'sky' : 'water';
  const lightType = pos?.lightType || (zone === 'sky' ? 'star' : 'lantern');

  completedSteps.update((list) => {
    const next = list.map((item) =>
      item.uid === uid
        ? {
            ...item,
            lightType,
            awaitingPlant: false,
            plantedPos: { x: clampedX, y: clampedY, zone, lightType }
          }
        : item
    );
    saveSteps(next);
    return next;
  });

  trackEvent('aa_world_seed_planted', { zone, lightType });
}

/**
 * Přidá do Krajiny dobra vlastní dobrý skutek (lucerna = osobní skutek, hvězda = inspirace, vlna = pomoc druhému).
 * @param {{ x: number, y: number, kind?: 'deed' | 'gratitude' | 'release' | 'wave' | 'lantern' | 'star', lightType?: 'lantern' | 'star' | 'wave', title?: string, element?: string, concreteImpact?: string }} item
 */
export function addSanctuaryWish(item) {
  const clampedX = Math.max(0.06, Math.min(0.94, Number(item?.x) || 0.5));
  const clampedY = Math.max(0.07, Math.min(0.88, Number(item?.y) || 0.68));
  const explicitType = item?.lightType || (item?.kind === 'wave' ? 'wave' : item?.kind === 'star' ? 'star' : undefined);
  const zone = explicitType === 'star' ? 'sky' : explicitType === 'wave' || explicitType === 'lantern' ? 'water' : clampedY < 0.53 ? 'sky' : 'water';
  const lightType = explicitType || (zone === 'sky' ? 'star' : 'lantern');
  const rawTitle = stripLeadingEmoji(item?.title || '');
  const inferredEl = item?.element || inferStepElement({ title: rawTitle });
  const defaultTitle =
    lightType === 'wave'
      ? 'Vlna pomoci pro druhého člověka'
      : lightType === 'star'
        ? 'Hvězda tiché inspirace'
        : 'Drobný osobní skutek v běžném dni';
  const defaultImpact =
    lightType === 'wave'
      ? 'Pomoc druhému — podpora, která se šíří dál'
      : lightType === 'star'
        ? 'Inspirace pro klidnou všímavost a dobro'
        : 'Osobní dobrý skutek v běžném dni';

  const entry = {
    uid: `deed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind: item?.kind || lightType,
    lightType,
    title: rawTitle || defaultTitle,
    concreteImpact: item?.concreteImpact || defaultImpact,
    element: inferredEl,
    x: clampedX,
    y: clampedY,
    zone,
    timestamp: new Date().toISOString()
  };

  sanctuaryWishes.update((list) => {
    const next = [...list, entry];
    saveWishes(next);
    return next;
  });

  // Odložená odměna: zapsání skutku v Krajině dobra odemkne pamlsek pro Molly
  unlockMollyTreat(
    { id: 'sanctuary_wish', element: entry.element, title: entry.title },
    { reason: 'sanctuary_wish', source: 'sanctuary' }
  );

  return entry;
}

/** Zpětně kompatibilní alias pro addSanctuaryWish */
export const recordSanctuaryWish = addSanctuaryWish;

export function clearSanctuaryWishes() {
  sanctuaryWishes.set([]);
  saveWishes([]);
}

export function saveStepReflection(uid, note) {
  const cleaned = String(note || '').slice(0, 240);
  completedSteps.update((list) => {
    const next = list.map((item) =>
      item.uid === uid ? { ...item, note: cleaned } : item
    );
    saveSteps(next);
    return next;
  });
  if (cleaned.trim().length > 0) {
    trackFunnel('reflection_saved', { uid });
  }
}

export function closeCelebration() {
  activeCelebration.set(null);
}

/**
 * Vytvoří anonymní přenosný kód pro zálohu postupu mimo In-App prohlížeč (M18 / AUDIT #26).
 * Zahrnuje i dostupné pamlsky pro Molly (delayed gratification).
 * @returns {string}
 */
export function createProgressBackupCode() {
  const steps = get(completedSteps).slice(-40);
  const wishes = get(sanctuaryWishes).slice(-30);
  const molly = get(mollyState);
  return exportProgressPasscode({
    s: steps,
    w: wishes,
    m: {
      treatsFedTotal: molly?.treatsFedTotal || 0,
      petCount: molly?.petCount || 0,
      giftDeeds: molly?.giftDeeds || 0,
      availableTreats: molly?.availableTreats || 0
    }
  });
}

/**
 * Obnoví postup z anonymního záložního kódu (M18 / AUDIT #26).
 * @param {string} code
 * @returns {boolean}
 */
export function restoreProgressFromBackupCode(code) {
  const decoded = importProgressPasscode(code);
  if (!decoded) return false;
  if (Array.isArray(decoded.s)) {
    completedSteps.set(decoded.s);
    saveSteps(decoded.s);
  }
  if (Array.isArray(decoded.w)) {
    sanctuaryWishes.set(decoded.w);
    saveWishes(decoded.w);
  }
  if (decoded.m && typeof decoded.m === 'object') {
    mollyState.update((prev) => {
      const next = {
        ...prev,
        treatsFedTotal: Math.max(prev.treatsFedTotal || 0, Number(decoded.m.treatsFedTotal) || 0),
        petCount: Math.max(prev.petCount || 0, Number(decoded.m.petCount) || 0),
        availableTreats: Math.max(prev.availableTreats || 0, Number(decoded.m.availableTreats) || 0),
        giftDeeds: Math.max(
          prev.giftDeeds || 0,
          Number(decoded.m.giftDeeds) || 0,
          // Starší kódy dárky neznaly → aspoň počet obnovených skutků
          (Array.isArray(decoded.s) ? decoded.s.length : 0) + (Array.isArray(decoded.w) ? decoded.w.length : 0)
        )
      };
      safeSetItem(MOLLY_STORAGE_KEY, JSON.stringify(next), 'local');
      return next;
    });
  }
  return true;
}
