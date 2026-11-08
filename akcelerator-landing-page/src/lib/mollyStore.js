import { writable } from 'svelte/store';
import { safeGetItem, safeSetItem } from './utils.js';
import { resolveMollyTreat, getUnlockedMilestone } from './mollyTypes.js';
import {
  getActionEffectMeta,
  playMollyPurr,
  playMollyCrunch,
  playMollyMeow,
  registerMollyNotifier
} from './sensoryEngine.js';

export const MOLLY_STORAGE_KEY = 'aa_molly_companion_v1';

const DEFAULT_MOLLY_STATE = {
  mode: 'roaming', // 'roaming' | 'docked'
  mood: 'curious', // 'curious' | 'purring' | 'eating' | 'playful' | 'sleeping' | 'breathing'
  treatsFedTotal: 0,
  treatsFedToday: 0,
  lastFedIso: null,
  lastTreat: null, // { icon, name, shortLabel, color, foodType, actionId, ts }
  petCount: 0,
  // Počet SKUTEČNÝCH skutků (dokončený krok / zapsaný skutek v Krajině dobra), za které Molly dostala pamlsek.
  // Jen z nich se odemykají dárky — klepání do plátna a ✨ Impuls dávají pamlsky, ale ne dárky,
  // jinak by šlo „naklikat“ hvězdičku za půl minuty a věta „Díky tvé pomoci…“ by nebyla pravdivá.
  giftDeeds: 0,
  whisper: null // { text, icon, ts }
};

/** Zdroje krmení, které odpovídají skutečnému skutku (viz progress.js). */
const DEED_FEED_SOURCES = new Set(['win', 'sanctuary']);

/**
 * Pro uživatele z doby před dárky: dopočítá skutky z uloženého zápisníku (kroky + skutky v Krajině dobra).
 */
function countStoredDeeds() {
  let n = 0;
  for (const key of ['aa_completed_steps_v2', 'aa_sanctuary_wishes_v1']) {
    try {
      const arr = JSON.parse(safeGetItem(key, 'local') || '[]');
      if (Array.isArray(arr)) n += arr.length;
    } catch {}
  }
  return n;
}

export const MOLLY_PET_WHISPERS = [
  'Mrrr… každá drobná laskavost krásně hřeje.',
  'Předu radostí! Děkuji, že tu dnes jsi.',
  'Mrrr… tvá laskavost zahřeje víc než odpolední slunce.',
  'Mňau ~ u jezera v Krajině dobra už svítí tvoje světýlka.',
  'Tichounce předu s tebou. Každý malý čin se počítá.',
  'Mrrr… klidně si na chvilku vydechni, hlídám to tu s tebou.',
  'Mňau ~ děláš svět o kousek vlídnějším místem.',
  'Tvoje pomoc má smysl. I malý krok mění den k lepšímu.',
  'Mrrr ~ protahuji tlapky a posílám ti klid do dnešního dne.'
];

function localDayKey(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * Porovnává podle LOKÁLNÍHO kalendářního dne. Dříve se srovnával UTC prefix ISO řetězce,
 * takže v Česku se mezi půlnocí a 1–2 h ráno „dnešní“ pamlsky počítaly do včerejška.
 * @param {string | null | undefined} isoStr
 */
function isSameDayIso(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return false;
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return false;
  return localDayKey(d) === localDayKey(new Date());
}

/**
 * Pokud přírůstek pamlsku odemkl nový dárek, vrátí oslavnou šeptandu místo běžné.
 * @param {number} prevTotal
 * @param {number} nextTotal
 * @param {{ icon: string, text: string, ts: number }} fallback
 */
function milestoneWhisperOr(prevTotal, nextTotal, fallback) {
  const m = getUnlockedMilestone(prevTotal, nextTotal);
  if (!m) return fallback;
  return {
    icon: m.icon,
    text: `Mňau, podívej! Díky tvému dobrému skutku mám ${m.name}. Mám z něj velikou radost!`,
    ts: fallback.ts,
    milestone: m.key
  };
}

function loadMollyState() {
  if (typeof window === 'undefined') return { ...DEFAULT_MOLLY_STATE };
  try {
    const raw = safeGetItem(MOLLY_STORAGE_KEY, 'local');
    if (!raw) return { ...DEFAULT_MOLLY_STATE, giftDeeds: countStoredDeeds() };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_MOLLY_STATE };
    }
    const mode = parsed.mode === 'docked' ? 'docked' : 'roaming';
    const treatsFedTotal = Math.max(0, Number(parsed.treatsFedTotal) || 0);
    const lastFedIso = typeof parsed.lastFedIso === 'string' ? parsed.lastFedIso : null;
    const treatsFedToday = isSameDayIso(lastFedIso)
      ? Math.max(0, Number(parsed.treatsFedToday) || 0)
      : 0;
    const lastTreat =
      parsed.lastTreat &&
      typeof parsed.lastTreat === 'object' &&
      !Array.isArray(parsed.lastTreat) &&
      typeof parsed.lastTreat.icon === 'string'
        ? parsed.lastTreat
        : null;
    return {
      ...DEFAULT_MOLLY_STATE,
      mode,
      mood: mode === 'docked' ? 'sleeping' : 'curious',
      treatsFedTotal,
      treatsFedToday,
      lastFedIso,
      lastTreat,
      petCount: Math.max(0, Number(parsed.petCount) || 0),
      giftDeeds: Number.isFinite(Number(parsed.giftDeeds))
        ? Math.max(0, Number(parsed.giftDeeds))
        : countStoredDeeds(),
      whisper: null
    };
  } catch {
    return { ...DEFAULT_MOLLY_STATE };
  }
}

function saveMollyState(state) {
  if (typeof window === 'undefined') return;
  try {
    const toPersist = {
      mode: state.mode,
      mood: state.mood,
      treatsFedTotal: state.treatsFedTotal,
      treatsFedToday: state.treatsFedToday,
      lastFedIso: state.lastFedIso,
      lastTreat: state.lastTreat,
      petCount: state.petCount,
      giftDeeds: Math.max(0, Number(state.giftDeeds) || 0)
    };
    safeSetItem(MOLLY_STORAGE_KEY, JSON.stringify(toPersist), 'local');
  } catch {}
}

export const mollyState = writable({ ...DEFAULT_MOLLY_STATE });
export const mollyEvents = writable(null);

if (typeof window !== 'undefined') {
  mollyState.set(loadMollyState());
}

let moodResetTimer = null;
let lastSparkNotifyTs = 0;

function scheduleMoodReset(delayMs = 3600) {
  if (moodResetTimer) clearTimeout(moodResetTimer);
  moodResetTimer = setTimeout(() => {
    mollyState.update((s) => {
      if (s.mood === 'breathing') return s;
      const nextMood = s.mode === 'docked' ? 'sleeping' : 'curious';
      return { ...s, mood: nextMood };
    });
  }, delayMs);
}

/**
 * Nakrmí želvovinovou kočku Molly tematickou dobrotou podle konkrétního skutku.
 * @param {any} action
 * @param {{ silent?: boolean, source?: string }} [opts]
 */
export function feedMollyFromAction(action, opts = {}) {
  const meta = getActionEffectMeta(action);
  const treat = meta?.mollyTreat || {
    icon: '🐟',
    name: 'lososová granulka',
    shortLabel: 'Rybka pro Molly',
    color: '#f59e0b',
    foodType: 'salmon'
  };
  const nowIso = new Date().toISOString();
  const ts = Date.now();
  const actionId =
    (typeof action === 'string' ? action : action?.id) || 'zvirata_utulek_online';

  const treatRecord = {
    ...treat,
    actionId,
    ts
  };

  const whisper = {
    icon: treat.icon,
    text: `Mňam! Děkuji za ${treat.name}, moc mi chutná.`,
    ts
  };

  const isDeed = DEED_FEED_SOURCES.has(opts?.source || '');

  mollyState.update((prev) => {
    const sameDay = isSameDayIso(prev.lastFedIso);
    const prevTotal = Number(prev.treatsFedTotal) || 0;
    const prevDeeds = Math.max(0, Number(prev.giftDeeds) || 0);
    const nextDeeds = isDeed ? prevDeeds + 1 : prevDeeds;
    const next = {
      ...prev,
      mood: 'eating',
      treatsFedTotal: prevTotal + 1,
      treatsFedToday: (sameDay ? Number(prev.treatsFedToday) || 0 : 0) + 1,
      lastFedIso: nowIso,
      lastTreat: treatRecord,
      giftDeeds: nextDeeds,
      whisper: milestoneWhisperOr(prevDeeds, nextDeeds, whisper)
    };
    saveMollyState(next);
    return next;
  });

  mollyEvents.set({
    type: 'feed',
    treat: treatRecord,
    action,
    source: opts?.source || 'action',
    ts
  });

  if (!opts?.silent) {
    playMollyCrunch();
    setTimeout(() => {
      playMollyPurr(0.95, 0.75);
    }, 260);
  } else {
    playMollyCrunch();
  }

  scheduleMoodReset(4200);
  return treatRecord;
}

/**
 * Zaznamená jiskru / impuls z interaktivního plátna nebo tlačítka ✨ Impuls a pošle Molly pamlsek.
 * @param {any} action
 * @param {{ surface?: string, silentSound?: boolean }} [opts]
 */
export function notifyMollySpark(action, opts = {}) {
  const nowTs = Date.now();
  if (opts?.fromCanvas && nowTs - lastSparkNotifyTs < 450) {
    return null;
  }
  lastSparkNotifyTs = nowTs;
  const meta = getActionEffectMeta(action);
  const treat = meta?.mollyTreat || {
    icon: '🐟',
    name: 'lososová granulka',
    shortLabel: 'Rybka pro Molly',
    color: '#f59e0b',
    foodType: 'salmon'
  };
  const nowIso = new Date().toISOString();
  const ts = Date.now();
  const actionId =
    (typeof action === 'string' ? action : action?.id) || 'zvirata_utulek_online';

  const treatRecord = {
    ...treat,
    actionId,
    ts
  };

  const whisper = {
    icon: treat.icon,
    text: `Cítím tvoji jiskru! Děkuji za voňavou dobrůtku.`,
    ts
  };

  mollyState.update((prev) => {
    const sameDay = isSameDayIso(prev.lastFedIso);
    const prevTotal = Number(prev.treatsFedTotal) || 0;
    const next = {
      ...prev,
      mood: 'eating',
      treatsFedTotal: prevTotal + 1,
      treatsFedToday: (sameDay ? Number(prev.treatsFedToday) || 0 : 0) + 1,
      lastFedIso: nowIso,
      lastTreat: treatRecord,
      // Jiskra z plátna / Impuls není skutek → žádný dárek (viz giftDeeds)
      whisper
    };
    saveMollyState(next);
    return next;
  });

  mollyEvents.set({
    type: 'spark',
    treat: treatRecord,
    action,
    surface: opts?.surface || 'canvas',
    ts
  });

  if (!opts?.silentSound) {
    playMollyCrunch();
  }

  scheduleMoodReset(3400);
  return treatRecord;
}

/**
 * Pohladí Molly — spustí předení, srdíčka a vlídnou českou zprávu.
 * @param {string} [customWhisper]
 * @param {{ suffix?: string, fromDock?: boolean, icon?: string }} [opts] — např. postup k dalšímu dárku (pohlazení v pelíšku na mobilu)
 */
export function petMolly(customWhisper, opts = {}) {
  const ts = Date.now();
  let chosenText = customWhisper;

  mollyState.update((prev) => {
    const nextPetCount = (Number(prev.petCount) || 0) + 1;
    if (!chosenText) {
      chosenText =
        MOLLY_PET_WHISPERS[(nextPetCount - 1) % MOLLY_PET_WHISPERS.length];
    }
    if (opts?.suffix) chosenText = `${chosenText} ${opts.suffix}`;
    const next = {
      ...prev,
      mood: 'purring',
      petCount: nextPetCount,
      whisper: {
        icon: opts?.icon || '🐾',
        text: chosenText,
        ts,
        fromDock: Boolean(opts?.fromDock)
      }
    };
    saveMollyState(next);
    return next;
  });

  playMollyPurr(1.15, 0.85);
  if (Math.random() < 0.35) {
    setTimeout(() => playMollyMeow(), 180);
  }

  mollyEvents.set({
    type: 'pet',
    treat: null,
    action: null,
    whisper: chosenText,
    ts
  });

  scheduleMoodReset(4000);
}

/**
 * Přepne Molly mezi volným touláním po stránce ('roaming') a klidovým pelíškem ('docked').
 */
export function toggleMollyPelisek() {
  const ts = Date.now();
  let nextMode = 'roaming';

  mollyState.update((prev) => {
    nextMode = prev.mode === 'docked' ? 'roaming' : 'docked';
    const next = {
      ...prev,
      mode: nextMode,
      mood: nextMode === 'docked' ? 'sleeping' : 'curious',
      whisper: {
        icon: nextMode === 'docked' ? '🧺' : '🐾',
        text:
          nextMode === 'docked'
            ? 'Zachumlám se do pelíšku a budu tiše odpočívat.'
            : 'Už jsem vzhůru a jdu tě s radostí doprovázet!',
        ts
      }
    };
    saveMollyState(next);
    return next;
  });

  if (nextMode === 'roaming') {
    playMollyMeow();
    mollyEvents.set({ type: 'wake', treat: null, action: null, ts });
  } else {
    playMollyPurr(0.8, 0.6);
  }
  return nextMode;
}

/**
 * Nastaví náladu Molly (např. 'breathing' při dechovém zastavení v /svet#dech).
 * @param {'curious' | 'purring' | 'eating' | 'playful' | 'sleeping' | 'breathing'} mood
 */
export function setMollyMood(mood) {
  mollyState.update((prev) => ({
    ...prev,
    mood: mood === 'curious' && prev.mode === 'docked' ? 'sleeping' : mood
  }));
}

/**
 * Molly něco tiše pošeptá (průvodcovská nápověda) — nemění náladu, počty ani úložiště.
 * @param {string} text
 * @param {string} [icon]
 * @param {{ guide?: boolean, routePath?: string }} [opts]
 */
export function mollyWhisper(text, icon = '🐾', opts = {}) {
  if (!text) return;
  mollyState.update((prev) => ({
    ...prev,
    whisper: {
      icon,
      text,
      ts: Date.now(),
      guide: !!opts?.guide,
      routePath: opts?.routePath || null
    }
  }));
}

registerMollyNotifier(notifyMollySpark);
