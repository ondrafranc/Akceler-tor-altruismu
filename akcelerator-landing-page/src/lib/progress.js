import { writable, derived } from 'svelte/store';
import { getRandomEncouragement, MICRO_ACTIONS } from './data/czech-actions.js';
import { trackEvent } from './analytics.js';

const STORAGE_KEY = 'aa_completed_steps_v2';
const WISHES_STORAGE_KEY = 'aa_sanctuary_wishes_v1';

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
 * Skutečné příběhy a čísla o pomoci v Česku.
 */
export const HOPE_PROOFS = [
  {
    id: 'click_feed',
    title: 'Stovky tun krmiva z obyčejných kliknutí z domova',
    realWorldProof:
      'V českém projektu Click and Feed už lidé jednoduchým bezplatným kliknutím poslali stovky tun granulí do útulků po celé republice.',
    psychNote:
      'I patnáctivteřinová pomoc ti připomene, že na světě kolem sebe máš reálný podíl.'
  },
  {
    id: 'bird_stops',
    title: 'Bezpečné zastávky pro tisíce ptáků díky fotkám z mobilu',
    realWorldProof:
      'Díky dvouminutovým hlášením kolemjdoucích v projektu Ptačí pasti ČSO už desítky českých obcí bezpečně polepily prosklené zastávky.',
    psychNote:
      'Když si na cestě ven všímáš okolí, pomůžeš přírodě a zároveň příjemně zpomalíš vlastní hlavu.'
  },
  {
    id: 'remobil_drawers',
    title: 'Přes 400 000 starých mobilů ze šuplíků dostalo nový smysl',
    realWorldProof:
      'Lidé v Česku už přes Remobil poslali přes 400 tisíc nepotřebných telefonů — vznikla tak práce pro lidi s hendikepem a podpora pro charitu.',
    psychNote:
      'Poslat dál jednu nepotřebnou věc z domova uleví prostoru kolem tebe a hned pomůže někomu dalšímu.'
  },
  {
    id: 'marrow_youth',
    title: '120 000 mladých lidí v registru dárců kostní dřeně',
    realWorldProof:
      'Jednoduchý pětiminutový stěr z úst od dobrovolníků už v Česku dal druhou šanci na život více než 2 000 vážně nemocným pacientům.',
    psychNote:
      'Většina dobrých věcí kolem nás se děje potichu — i proto je jich mnohem víc, než je vidět ve zprávách.'
  },
  {
    id: 'food_saved',
    title: 'Tisíce tun zachráněného jídla pro rodiny a seniory',
    realWorldProof:
      'České potravinové banky každoročně díky dobrovolníkům zachrání tisíce tun dobrého jídla pro samoživitele, seniory a lidi v tísni.',
    psychNote:
      'Podle výzkumů sociálních sítí se každý dobrý skutek přirozeně šíří od člověka k člověku až o tři stupně dál.'
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

function loadSteps() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      element: inferStepElement(item)
    }));
  } catch {
    return [];
  }
}

function saveSteps(steps) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(steps.slice(-150)));
  } catch {}
}

function loadWishes() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WISHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWishes(list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(list.slice(-80)));
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
  const todayStr = new Date().toISOString().slice(0, 10);
  return $steps.filter((s) => typeof s?.timestamp === 'string' && s.timestamp.startsWith(todayStr)).length;
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
 * @param {{ id?: string, title: string, surface?: string, category?: string, element?: string, concreteImpact?: string }} step
 */
export function recordSmallWin(step) {
  const catalogMatch = Array.isArray(MICRO_ACTIONS)
    ? MICRO_ACTIONS.find((a) => a.id === step?.id)
    : null;
  const element = inferStepElement(step || catalogMatch);
  const concreteImpact = step?.concreteImpact || catalogMatch?.concreteImpact || '';

  const entry = {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    id: step?.id || 'step',
    title: step?.title || 'Malý dobrý krok',
    surface: step?.surface || 'app',
    category: step?.category || '',
    element,
    concreteImpact,
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

  trackEvent('aa_small_win', {
    surface: entry.surface,
    id: entry.id,
    element
  });

  if (!step?.silent) {
    activeCelebration.set({
      open: true,
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
 * Uloží souřadnice hvězdy nebo vodní lucerny v Tichém útočišti (/svet).
 * @param {string} uid
 * @param {{ x: number, y: number }} pos
 */
export function plantStepLight(uid, pos) {
  const clampedX = Math.max(0.06, Math.min(0.94, Number(pos?.x) || 0.5));
  const clampedY = Math.max(0.07, Math.min(0.88, Number(pos?.y) || 0.28));
  const zone = clampedY < 0.53 ? 'sky' : 'water';

  completedSteps.update((list) => {
    const next = list.map((item) =>
      item.uid === uid
        ? {
            ...item,
            awaitingPlant: false,
            plantedPos: { x: clampedX, y: clampedY, zone }
          }
        : item
    );
    saveSteps(next);
    return next;
  });

  trackEvent('aa_world_seed_planted', { zone });
}

/**
 * Přidá do Krajiny dobra vlastní dobrý skutek (na hladinu jako lucernu nebo na oblohu jako hvězdu).
 * @param {{ x: number, y: number, kind?: 'deed' | 'gratitude' | 'release', title?: string, element?: string, concreteImpact?: string }} item
 */
export function addSanctuaryWish(item) {
  const clampedX = Math.max(0.06, Math.min(0.94, Number(item?.x) || 0.5));
  const clampedY = Math.max(0.07, Math.min(0.88, Number(item?.y) || 0.68));
  const zone = clampedY < 0.53 ? 'sky' : 'water';
  const rawTitle = String(item?.title || '').trim();
  const inferredEl = item?.element || inferStepElement({ title: rawTitle });
  const entry = {
    uid: `deed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind: item?.kind || 'deed',
    title:
      rawTitle ||
      (zone === 'water' ? 'Drobná pomoc člověku nebo místu v okolí' : 'Dobrý skutek poslaný dál'),
    concreteImpact: item?.concreteImpact || 'Osobní dobrý skutek v běžném dni',
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

  return entry;
}

export function clearSanctuaryWishes() {
  sanctuaryWishes.set([]);
  saveWishes([]);
}

export function saveStepReflection(uid, note) {
  completedSteps.update((list) => {
    const next = list.map((item) =>
      item.uid === uid ? { ...item, note: String(note || '').slice(0, 240) } : item
    );
    saveSteps(next);
    return next;
  });
}

export function closeCelebration() {
  activeCelebration.set(null);
}
