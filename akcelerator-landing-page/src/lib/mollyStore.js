import { writable } from 'svelte/store';
import { safeGetItem, safeSetItem } from './utils.js';
import {
  resolveMollyTreat,
  getUnlockedMilestone,
  MOLLY_PET_WHISPERS,
  MOLLY_UNEARNED_PET_WHISPERS
} from './mollyTypes.js';
import {
  getActionEffectMeta,
  playMollyPurr,
  playMollyCrunch,
  playMollyMeow,
  registerMollyNotifier
} from './sensoryEngine.js';

export const MOLLY_STORAGE_KEY = 'aa_molly_companion_v1';
export const MOLLY_FOLLOW_MOUSE_KEY = 'aa_molly_follow_mouse';
export { MOLLY_PET_WHISPERS, MOLLY_UNEARNED_PET_WHISPERS };

const DEFAULT_MOLLY_STATE = {
  mode: 'roaming', // 'roaming' | 'docked'
  mood: 'curious', // 'curious' | 'purring' | 'eating' | 'playful' | 'sleeping' | 'breathing'
  followMouse: false, // Volitelné doprovázení kurzoru myši (R2)
  treatsFedTotal: 0,
  treatsFedToday: 0,
  availableTreats: 0, // Počet odemčených pamlsků za skutečné altruistické skutky
  earnedTreatQueue: [], // Fronta odemčených pamlsků čekajících na nakrmení
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
const DEED_FEED_SOURCES = new Set(['win', 'sanctuary', 'sanctuary_molly', 'celebration']);

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
  const followFromKey = safeGetItem(MOLLY_FOLLOW_MOUSE_KEY, 'local');
  const initialFollow = followFromKey !== null ? followFromKey === 'true' : false;
  if (typeof window === 'undefined') return { ...DEFAULT_MOLLY_STATE, followMouse: initialFollow };
  try {
    const raw = safeGetItem(MOLLY_STORAGE_KEY, 'local');
    if (!raw) return { ...DEFAULT_MOLLY_STATE, followMouse: initialFollow, giftDeeds: countStoredDeeds() };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_MOLLY_STATE, followMouse: initialFollow };
    }
    const mode = parsed.mode === 'docked' ? 'docked' : 'roaming';
    const followMouseVal = followFromKey !== null ? followFromKey === 'true' : Boolean(parsed.followMouse);
    const treatsFedTotal = Math.max(0, Number(parsed.treatsFedTotal) || 0);
    const lastFedIso = typeof parsed.lastFedIso === 'string' ? parsed.lastFedIso : null;
    const treatsFedToday = isSameDayIso(lastFedIso)
      ? Math.max(0, Number(parsed.treatsFedToday) || 0)
      : 0;
    const availableTreats = Math.max(0, Number(parsed.availableTreats) || 0);
    const earnedTreatQueue = Array.isArray(parsed.earnedTreatQueue)
      ? parsed.earnedTreatQueue.filter((t) => t && typeof t === 'object')
      : [];
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
      followMouse: followMouseVal,
      treatsFedTotal,
      treatsFedToday,
      availableTreats,
      earnedTreatQueue,
      lastFedIso,
      lastTreat,
      petCount: Math.max(0, Number(parsed.petCount) || 0),
      giftDeeds: Number.isFinite(Number(parsed.giftDeeds))
        ? Math.max(0, Number(parsed.giftDeeds))
        : countStoredDeeds(),
      whisper: null
    };
  } catch {
    return { ...DEFAULT_MOLLY_STATE, followMouse: initialFollow };
  }
}

function saveMollyState(state) {
  try {
    const toPersist = {
      mode: state.mode,
      mood: state.mood,
      followMouse: Boolean(state.followMouse),
      treatsFedTotal: state.treatsFedTotal,
      treatsFedToday: state.treatsFedToday,
      availableTreats: Math.max(0, Number(state.availableTreats) || 0),
      earnedTreatQueue: Array.isArray(state.earnedTreatQueue) ? state.earnedTreatQueue.slice(-20) : [],
      lastFedIso: state.lastFedIso,
      lastTreat: state.lastTreat,
      petCount: state.petCount,
      giftDeeds: Math.max(0, Number(state.giftDeeds) || 0)
    };
    safeSetItem(MOLLY_STORAGE_KEY, JSON.stringify(toPersist), 'local');
    safeSetItem(MOLLY_FOLLOW_MOUSE_KEY, state.followMouse ? 'true' : 'false', 'local');
  } catch {}
}

export const mollyState = writable({ ...DEFAULT_MOLLY_STATE });
export const followMouse = writable(false);
export const mollyEvents = writable(null);

const initialLoadedMolly = loadMollyState();
mollyState.set(initialLoadedMolly);
followMouse.set(initialLoadedMolly.followMouse);

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
 * Odemkne 1 zasloužený pamlsek pro Molly za skutečný altruistický skutek (delayed gratification).
 * Pamlsek se přidá do dostupné zásoby (availableTreats) a zařadí do fronty earnedTreatQueue.
 * @param {any} action
 * @param {{ reason?: string, source?: string }} [opts]
 * @returns {{ unlocked: boolean, treat: any }}
 */
export function unlockMollyTreat(action, opts = {}) {
  const meta = getActionEffectMeta(action);
  const treat = meta?.mollyTreat || resolveMollyTreat(action);
  const actionId = (typeof action === 'string' ? action : action?.id) || 'altruism_step';
  const ts = Date.now();

  const treatRecord = {
    ...treat,
    actionId,
    reason: opts?.reason || 'altruistic_action',
    source: opts?.source || 'progress',
    ts
  };

  mollyState.update((prev) => {
    const nextAvailable = (Number(prev.availableTreats) || 0) + 1;
    const currentQueue = Array.isArray(prev.earnedTreatQueue) ? prev.earnedTreatQueue : [];
    const nextQueue = [...currentQueue, treatRecord].slice(-20);
    const next = {
      ...prev,
      availableTreats: nextAvailable,
      earnedTreatQueue: nextQueue,
      whisper: {
        icon: treat.icon || '🐟',
        text: `Mňau! Odemkla se dobrota za tvůj dobrý skutek: ${treat.name}. Můžeš mi ji dát!`,
        ts
      }
    };
    saveMollyState(next);
    return next;
  });

  mollyEvents.set({
    type: 'unlock_treat',
    treat: treatRecord,
    action,
    ts
  });

  return { unlocked: true, treat: treatRecord };
}

/**
 * Nakrmí želvovinovou kočku Molly zaslouženou dobrotou z odemčené zásoby (delayed gratification).
 * Pokud uživatel nemá žádný odemčený pamlsek (availableTreats <= 0), pamlsek se nevydá,
 * čítač pamlsků se nezvýší a Molly se místo toho nechá s láskou pohladit.
 *
 * @param {string | any} [sourceOrAction]
 * @param {{ silent?: boolean, source?: string, action?: any, unearnedWhisper?: string, fromDock?: boolean }} [opts]
 * @returns {{ success: boolean, treat: any }}
 */
export function feedMolly(sourceOrAction = 'action', opts = {}) {
  const action =
    typeof sourceOrAction === 'object' && sourceOrAction !== null
      ? sourceOrAction
      : opts?.action || null;
  const source =
    typeof sourceOrAction === 'string'
      ? sourceOrAction
      : opts?.source || 'action';

  let currentAvailable = 0;
  let earnedQueue = [];
  let prevTotal = 0;
  let prevDeeds = 0;

  mollyState.update((prev) => {
    currentAvailable = Math.max(0, Number(prev.availableTreats) || 0);
    earnedQueue = Array.isArray(prev.earnedTreatQueue) ? [...prev.earnedTreatQueue] : [];
    prevTotal = Math.max(0, Number(prev.treatsFedTotal) || 0);
    prevDeeds = Math.max(0, Number(prev.giftDeeds) || 0);
    return prev;
  });

  // Odložená odměna: bez skutečného skutku nelze pamlsky naklikat naprázdno
  if (currentAvailable <= 0) {
    const unearnedWhisper =
      opts?.unearnedWhisper ||
      'Mrrr… bříško mám klidné a pamlsky si šetřím na oslavu dobrého skutku. Děkuji za pohlazení!';
    petMolly(unearnedWhisper, { icon: '🐾', fromDock: opts?.fromDock });
    return { success: false, treat: null };
  }

  // Spotřebování 1 zaslouženého pamlsku
  const poppedTreat = earnedQueue.shift() || null;
  const meta = action ? getActionEffectMeta(action) : null;
  const treat = poppedTreat || meta?.mollyTreat || {
    icon: '🐟',
    name: 'lososová granulka',
    shortLabel: 'Rybka pro Molly',
    color: '#f59e0b',
    foodType: 'salmon'
  };

  const nowIso = new Date().toISOString();
  const ts = Date.now();
  const actionId =
    treat?.actionId ||
    (action ? (typeof action === 'string' ? action : action?.id) : 'altruism_step');

  const treatRecord = {
    ...treat,
    actionId,
    ts
  };

  const whisper = {
    icon: treat.icon || '🐟',
    text: `Mňam! Děkuji za ${treat.name || 'dobrotu'}, moc mi chutná.`,
    ts
  };

  const nextDeeds = prevDeeds + 1;
  const nextTotal = prevTotal + 1;

  mollyState.update((prev) => {
    const sameDay = isSameDayIso(prev.lastFedIso);
    const nextQueue = Array.isArray(prev.earnedTreatQueue) ? prev.earnedTreatQueue.slice(1) : [];
    const next = {
      ...prev,
      mood: 'eating',
      availableTreats: Math.max(0, (Number(prev.availableTreats) || 0) - 1),
      earnedTreatQueue: nextQueue,
      treatsFedTotal: nextTotal,
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
    source,
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
  return { success: true, treat: treatRecord };
}

/**
 * Zpětně kompatibilní delegace na feedMolly.
 * @param {any} action
 * @param {{ silent?: boolean, source?: string }} [opts]
 */
export function feedMollyFromAction(action, opts = {}) {
  return feedMolly(action, opts);
}

/**
 * Zaznamená jiskru / impuls z interaktivního plátna nebo tlačítka ✨ Impuls.
 * Spustí vizuální a zvukový vjem zvídavosti Molly, ale STRIKTNĚ NEZVYŠUJE počet pamlsků
 * ani dárků (delayed gratification — pamlsky se získávají jen skutečnými skutky).
 *
 * @param {any} action
 * @param {{ surface?: string, silentSound?: boolean, fromCanvas?: boolean }} [opts]
 */
export function notifyMollySpark(action, opts = {}) {
  const nowTs = Date.now();
  if (opts?.fromCanvas && nowTs - lastSparkNotifyTs < 450) {
    return null;
  }
  lastSparkNotifyTs = nowTs;
  const meta = getActionEffectMeta(action);
  const treat = meta?.mollyTreat || resolveMollyTreat(action);
  const ts = Date.now();
  const actionId =
    (typeof action === 'string' ? action : action?.id) || 'spark_impulse';

  const sparkRecord = {
    ...treat,
    icon: '✨',
    name: 'světelná jiskra',
    actionId,
    ts
  };

  const whisper = {
    icon: '✨',
    text: 'Cítím tvoji jiskru! Každá myšlenka na pomoc zahřeje.',
    ts
  };

  mollyState.update((prev) => {
    // Pouze zvídavá reakce kočky; STRIKTNĚ ŽÁDNÉ navyšování treatsFedTotal ani giftDeeds
    return {
      ...prev,
      mood: prev.mode === 'docked' ? 'sleeping' : 'curious',
      whisper
    };
  });

  mollyEvents.set({
    type: 'spark',
    treat: sparkRecord,
    action,
    surface: opts?.surface || 'canvas',
    ts
  });

  scheduleMoodReset(3400);
  return sparkRecord;
}

/**
 * Pohladí Molly — spustí předení, srdíčka a vlídnou českou zprávu.
 * Pokud uživatel nemá žádné odemčené pamlsky, vlídně povzbudí ke skutku (delayed gratification).
 * @param {string} [customWhisper]
 * @param {{ suffix?: string, fromDock?: boolean, icon?: string, unearned?: boolean }} [opts]
 */
export function petMolly(customWhisper, opts = {}) {
  const ts = Date.now();
  let chosenText = customWhisper;

  mollyState.update((prev) => {
    const nextPetCount = (Number(prev.petCount) || 0) + 1;
    const available = Math.max(0, Number(prev.availableTreats) || 0);

    if (!chosenText) {
      if (available <= 0 || opts?.unearned) {
        chosenText =
          MOLLY_UNEARNED_PET_WHISPERS[
            (nextPetCount - 1) % MOLLY_UNEARNED_PET_WHISPERS.length
          ];
      } else {
        chosenText =
          MOLLY_PET_WHISPERS[(nextPetCount - 1) % MOLLY_PET_WHISPERS.length];
      }
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
 * Nastaví, zda má Molly na desktopu volitelně sledovat kurzor myši (R2).
 * @param {boolean} val
 * @returns {boolean}
 */
export function setMollyFollowMouse(val) {
  const boolVal = Boolean(val);
  followMouse.set(boolVal);
  mollyState.update((prev) => {
    const next = {
      ...prev,
      followMouse: boolVal
    };
    saveMollyState(next);
    return next;
  });
  safeSetItem(MOLLY_FOLLOW_MOUSE_KEY, boolVal ? 'true' : 'false', 'local');
  return boolVal;
}

/**
 * Přepne volitelné sledování myši pro Molly (R2).
 * @returns {boolean}
 */
export function toggleMollyFollowMouse() {
  let nextVal = false;
  followMouse.update((curr) => {
    nextVal = !curr;
    return nextVal;
  });
  mollyState.update((prev) => {
    const next = {
      ...prev,
      followMouse: nextVal,
      whisper: {
        icon: nextVal ? '🐾' : '🧺',
        text: nextVal
          ? 'Mňau! Půjdu s tebou a budu tě tiše doprovázet.'
          : 'Zůstanu na svém klidném místě.',
        ts: Date.now()
      }
    };
    saveMollyState(next);
    return next;
  });
  safeSetItem(MOLLY_FOLLOW_MOUSE_KEY, nextVal ? 'true' : 'false', 'local');
  return nextVal;
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
