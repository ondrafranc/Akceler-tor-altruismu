import { writable } from 'svelte/store';
import {
  getActionEffectMeta,
  playMollyPurr,
  playMollyCrunch,
  playMollyMeow
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
  whisper: null // { text, icon, ts }
};

export const MOLLY_PET_WHISPERS = [
  'Mrrr… každá drobná laskavost krásně hřeje.',
  'Předu radostí! Děkuji, že tu dnes jsi.',
  'Mňau ~ u jezera v Krajině dobra už svítí tvoje světýlka.',
  'Mrrr… klidně si na chvilku vydechni, hlídám to tu s tebou.',
  'Tvoje pomoc má smysl. I malý krok mění den k lepšímu.',
  'Mrrr ~ protahuji tlapky a posílám ti klid do dnešního dne.'
];

function isSameDayIso(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return false;
  const todayPrefix = new Date().toISOString().slice(0, 10);
  return isoStr.startsWith(todayPrefix);
}

function loadMollyState() {
  if (typeof window === 'undefined') return { ...DEFAULT_MOLLY_STATE };
  try {
    const raw = localStorage.getItem(MOLLY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MOLLY_STATE };
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
      petCount: state.petCount
    };
    localStorage.setItem(MOLLY_STORAGE_KEY, JSON.stringify(toPersist));
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
    name: 'lososová granulka pro Molly',
    shortLabel: '+1 rybka pro Molly',
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
    text: `Mňam! ${treat.shortLabel} (${treat.name})`,
    ts
  };

  mollyState.update((prev) => {
    const sameDay = isSameDayIso(prev.lastFedIso);
    const next = {
      ...prev,
      mood: 'eating',
      treatsFedTotal: (Number(prev.treatsFedTotal) || 0) + 1,
      treatsFedToday: (sameDay ? Number(prev.treatsFedToday) || 0 : 0) + 1,
      lastFedIso: nowIso,
      lastTreat: treatRecord,
      whisper
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
    name: 'lososová granulka pro Molly',
    shortLabel: '+1 rybka pro Molly',
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
    text: `${treat.shortLabel} · Molly chroupe dobrotu!`,
    ts
  };

  mollyState.update((prev) => {
    const sameDay = isSameDayIso(prev.lastFedIso);
    const next = {
      ...prev,
      mood: 'eating',
      treatsFedTotal: (Number(prev.treatsFedTotal) || 0) + 1,
      treatsFedToday: (sameDay ? Number(prev.treatsFedToday) || 0 : 0) + 1,
      lastFedIso: nowIso,
      lastTreat: treatRecord,
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
 */
export function petMolly(customWhisper) {
  const ts = Date.now();
  let chosenText = customWhisper;

  mollyState.update((prev) => {
    const nextPetCount = (Number(prev.petCount) || 0) + 1;
    if (!chosenText) {
      chosenText =
        MOLLY_PET_WHISPERS[(nextPetCount - 1) % MOLLY_PET_WHISPERS.length];
    }
    const next = {
      ...prev,
      mood: 'purring',
      petCount: nextPetCount,
      whisper: {
        icon: '🐾',
        text: chosenText,
        ts
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
            ? 'Molly se schoulila do klidového pelíšku.'
            : 'Molly vyskočila z pelíšku a jde tě doprovázet!',
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
