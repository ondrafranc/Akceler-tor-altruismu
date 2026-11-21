import { writable } from 'svelte/store';
import {
  safeGetItem,
  safeSetItem,
  AA_MOLLY_COMPANION_KEY,
  AA_MOLLY_FOLLOW_MOUSE_KEY
} from './storage/index.js';
import { MOLLY_PET_WHISPERS, MOLLY_DEED_THANKS } from './mollyTypes.js';
import { registerMollyNotifier } from './sensory/catalog/catalogResolver.js';
import { playMollyPurr, playMollyMeow } from './audio/presets.js';

export const MOLLY_STORAGE_KEY = AA_MOLLY_COMPANION_KEY;
export const MOLLY_FOLLOW_MOUSE_KEY = AA_MOLLY_FOLLOW_MOUSE_KEY;
export { MOLLY_PET_WHISPERS, MOLLY_DEED_THANKS };

/**
 * @typedef {import('./types/molly.js').MollyMode} MollyMode
 * @typedef {import('./types/molly.js').MollyWhisper} MollyWhisper
 * @typedef {import('./types/molly.js').MollyState} MollyState
 * @typedef {import('./types/molly.js').MollyActionLike} MollyActionLike
 * @typedef {import('./types/molly.js').MollyEvent} MollyEvent
 */

/** @type {MollyState} */
const DEFAULT_MOLLY_STATE = {
  mode: 'roaming', // 'roaming' | 'docked'
  mood: 'curious', // 'curious' | 'purring' | 'playful' | 'sleeping' | 'breathing'
  followMouse: false, // Volitelné doprovázení kurzoru myši (R2)
  petCount: 0,
  whisper: null // { text, icon, ts }
};

/**
 * Načte uložený stav. Starší záznamy nesou pole, která už neexistují; ta se tiše zahodí.
 * @returns {MollyState}
 */
function loadMollyState() {
  const followFromKey = safeGetItem(MOLLY_FOLLOW_MOUSE_KEY, 'local');
  const initialFollow = followFromKey !== null ? followFromKey === 'true' : false;
  if (typeof window === 'undefined') return { ...DEFAULT_MOLLY_STATE, followMouse: initialFollow };
  try {
    const raw = safeGetItem(MOLLY_STORAGE_KEY, 'local');
    if (!raw) return { ...DEFAULT_MOLLY_STATE, followMouse: initialFollow };
    /** @type {Partial<MollyState> | null} */
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_MOLLY_STATE, followMouse: initialFollow };
    }
    const mode = parsed.mode === 'docked' ? 'docked' : 'roaming';
    const followMouseVal = followFromKey !== null ? followFromKey === 'true' : Boolean(parsed.followMouse);
    return {
      ...DEFAULT_MOLLY_STATE,
      mode,
      mood: mode === 'docked' ? 'sleeping' : 'curious',
      followMouse: followMouseVal,
      petCount: Math.max(0, Number(parsed.petCount) || 0),
      whisper: null
    };
  } catch {
    return { ...DEFAULT_MOLLY_STATE, followMouse: initialFollow };
  }
}

/** @param {MollyState} state */
function saveMollyState(state) {
  try {
    const toPersist = {
      mode: state.mode,
      mood: state.mood,
      followMouse: Boolean(state.followMouse),
      petCount: state.petCount
    };
    safeSetItem(MOLLY_STORAGE_KEY, JSON.stringify(toPersist), 'local');
    safeSetItem(MOLLY_FOLLOW_MOUSE_KEY, state.followMouse ? 'true' : 'false', 'local');
  } catch { }
}

export const mollyState = writable({ ...DEFAULT_MOLLY_STATE });
export const followMouse = writable(false);
export const mollyEvents = writable(/** @type {MollyEvent | null} */ (null));

/**
 * Průvodcovské šeptandy Molly (uvítací tip stránky a dovedení k hlavnímu tlačítku) smí stránka
 * na chvíli podržet, když sama něco předvádí. `dropNudge` platí pro okamžik uvolnění.
 */
export const mollyGuideHold = writable({ held: false, dropNudge: false });

/** Podrží průvodcovské šeptandy Molly, dokud je stránka neuvolní. */
export function holdMollyGuide() {
  mollyGuideHold.set({ held: true, dropNudge: false });
}

/**
 * Uvolní průvodcovské šeptandy; Molly začne počítat klid od této chvíle.
 * @param {{ dropNudge?: boolean }} [opts] `dropNudge` vynechá na této stránce dovedení k hlavnímu
 *   tlačítku (na obrazovce zůstalo něco, co si návštěvník nevybral a k čemu text pobídky nesedí).
 */
export function releaseMollyGuide(opts = {}) {
  mollyGuideHold.set({ held: false, dropNudge: opts.dropNudge === true });
}

const initialLoadedMolly = loadMollyState();
mollyState.set(initialLoadedMolly);
followMouse.set(initialLoadedMolly.followMouse);

/** @type {ReturnType<typeof setTimeout> | null} */
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
 * Molly poděkuje za dokončený skutek, zapsané přání nebo dechové zastavení: krátká šeptanda,
 * spokojené předení a událost `thanks`, na kterou reaguje toulavá Molly. Nic nepočítá a nic neukládá.
 * @param {{ silent?: boolean }} [opts] `silent` vynechá zvuk předení.
 */
export function thankForDeed(opts = {}) {
  const ts = Date.now();
  const text = MOLLY_DEED_THANKS[Math.floor(Math.random() * MOLLY_DEED_THANKS.length)];

  mollyState.update((prev) => ({
    ...prev,
    mood: prev.mode === 'docked' ? 'sleeping' : 'purring',
    whisper: { icon: 'heart', text, ts, fromThanks: true }
  }));

  mollyEvents.set({ type: 'thanks', action: null, ts });

  if (!opts?.silent) playMollyPurr(0.95, 0.75);
  scheduleMoodReset(4200);
}

/**
 * Zaznamená jiskru / impuls z interaktivního plátna nebo tlačítka Impuls.
 * Spustí zvídavou reakci Molly a letící jiskru, kterou Molly chytí. Nic nepočítá.
 *
 * @param {MollyActionLike | string | null | undefined} action
 * @param {{ surface?: string, silentSound?: boolean, fromCanvas?: boolean }} [opts]
 */
export function notifyMollySpark(action, opts = {}) {
  const nowTs = Date.now();
  if (opts?.fromCanvas && nowTs - lastSparkNotifyTs < 450) {
    return null;
  }
  lastSparkNotifyTs = nowTs;
  const ts = Date.now();
  const actionId =
    (typeof action === 'string' ? action : action?.id) || 'spark_impulse';

  const sparkRecord = { icon: 'sparkles', name: 'světelná jiskra', actionId, ts };

  const whisper = {
    icon: 'sparkles',
    text: 'I tichá myšlenka na pomoc umí zahřát.',
    ts
  };

  mollyState.update((prev) => ({
    ...prev,
    mood: prev.mode === 'docked' ? 'sleeping' : 'curious',
    whisper
  }));

  mollyEvents.set({
    type: 'spark',
    spark: sparkRecord,
    action,
    surface: opts?.surface || 'canvas',
    ts
  });

  scheduleMoodReset(3400);
  return sparkRecord;
}

/**
 * Pohladí Molly — spustí předení, srdíčka a vlídnou českou zprávu.
 * @param {string} [customWhisper]
 * @param {{ fromDock?: boolean, icon?: string }} [opts]
 */
export function petMolly(customWhisper, opts = {}) {
  const ts = Date.now();
  let chosenText = customWhisper;

  mollyState.update((prev) => {
    const nextPetCount = (Number(prev.petCount) || 0) + 1;
    if (!chosenText) {
      chosenText = MOLLY_PET_WHISPERS[(nextPetCount - 1) % MOLLY_PET_WHISPERS.length];
    }
    /** @type {MollyState} */
    const next = {
      ...prev,
      mood: 'purring',
      petCount: nextPetCount,
      whisper: {
        icon: opts?.icon || 'paw',
        text: chosenText,
        ts,
        fromDock: Boolean(opts?.fromDock),
        fromPet: true
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
    action: null,
    whisper: chosenText,
    ts
  });

  scheduleMoodReset(4000);
}

/**
 * Přepne Molly mezi volným touláním po stránce ('roaming') a klidovým pelíškem ('docked').
 * @returns {MollyMode}
 */
export function toggleMollyPelisek() {
  const ts = Date.now();
  let nextMode = /** @type {MollyMode} */ ('roaming');

  mollyState.update((prev) => {
    nextMode = prev.mode === 'docked' ? 'roaming' : 'docked';
    /** @type {MollyState} */
    const next = {
      ...prev,
      mode: nextMode,
      mood: nextMode === 'docked' ? 'sleeping' : 'curious',
      whisper: {
        icon: nextMode === 'docked' ? 'home' : 'paw',
        text:
          nextMode === 'docked'
            ? 'Schoulím se do pelíšku a budu tiše odpočívat.'
            : 'Jsem vzhůru a klidně tě tu doprovodím.',
        ts,
        fromToggle: true
      }
    };
    saveMollyState(next);
    return next;
  });

  if (nextMode === 'roaming') {
    playMollyMeow();
    mollyEvents.set({ type: 'wake', action: null, ts });
  } else {
    playMollyPurr(0.8, 0.6);
  }
  return nextMode;
}

/**
 * Nastaví, zda má Molly na desktopu volitelně sledovat kurzor myši (R2).
 * @param {unknown} val
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
        icon: nextVal ? 'paw' : 'home',
        text: nextVal
          ? 'Půjdu s tebou a budu tě tiše doprovázet.'
          : 'Zůstanu na svém klidném místě.',
        ts: Date.now(),
        fromToggle: true
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
 * @param {import('./types/molly.js').MollyMood} mood
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
 * @param {{ guide?: boolean, routePath?: string, fromDock?: boolean, fromAutoPark?: boolean }} [opts]
 */
export function mollyWhisper(text, icon = 'paw', opts = {}) {
  if (!text) return;
  mollyState.update((prev) => ({
    ...prev,
    whisper: {
      icon,
      text,
      ts: Date.now(),
      guide: !!opts?.guide,
      routePath: opts?.routePath || null,
      fromDock: Boolean(opts?.fromDock),
      fromAutoPark: Boolean(opts?.fromAutoPark)
    }
  }));
}

registerMollyNotifier(notifyMollySpark);
