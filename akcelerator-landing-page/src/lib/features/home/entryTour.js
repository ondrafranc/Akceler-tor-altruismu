/**
 * Vstupní prohlídka režimů na `/`: po chvíli klidu stránka jednou projde záložky energie
 * a vrátí se na výchozí. Modul je čistá logika bez DOM a bez Svelte — rozhoduje, zda smí
 * prohlídka začít, drží pořadí kroků, plánuje je a umí je natrvalo zastavit. Časovače,
 * výsledky media dotazů i samotné přepnutí režimu dostává zvenku.
 */

/** @typedef {import('$lib/types').HomeEnergyMode} HomeEnergyMode */

/**
 * Proč prohlídka skončila. `finished` znamená, že došla sama až na výchozí režim.
 * @typedef {'finished' | 'interaction' | 'deck' | 'scroll' | 'visibility' | 'media' | 'destroy'} EntryTourEndReason
 */

/**
 * Stav vstupu na stránku. Prohlídka začne, jen když `viewportEligible` platí a nic dalšího ne.
 * @typedef {Object} EntryTourEligibility
 * @property {boolean} viewportEligible Zařízení s myší a dost širokým i vysokým oknem (`ENTRY_TOUR_VIEWPORT_QUERY`).
 * @property {boolean} reducedMotion Uživatel si přeje omezený pohyb.
 * @property {boolean} hasDeepLink URL nese `?action=`, `#action=` nebo `?intent=`.
 * @property {boolean} restoredDeckState Balíček se obnovil z uloženého stavu relace.
 * @property {boolean} dayClosed Den je uzavřený („Pro dnešek máš hotovo“).
 * @property {boolean} completionShowing Karta ukazuje dokončení, návrat od partnera nebo připnutý skutek.
 * @property {boolean} documentHidden Záložka prohlížeče není vidět.
 * @property {boolean} scrolled Stránka už je odscrollovaná.
 * @property {boolean} alreadySeen Prohlídka v této relaci už jednou začala.
 */

/*
 * Tempo se neopírá o časovače jiných komponent. Dokud prohlídka běží, stránka podrží vlastní pobídku
 * karty (`idleLure` na `SwipeDeck`) i průvodcovské šeptandy Molly (`holdMollyGuide`), takže se pohyby
 * nepotkají, ať jsou jejich prodlevy jakékoli.
 */

/** Klid po vstupu, než se cokoli pohne: dost na přečtení nadpisu, názvu karty a hlavního tlačítka. */
export const ENTRY_TOUR_INITIAL_PAUSE_MS = 3500;

/** Jak dlouho zůstává každý režim na očích: dost na jeho větu v hero, název karty a text tlačítka. */
export const ENTRY_TOUR_STEP_MS = 3500;

/**
 * Chvíle po kroku, kdy návštěvník novou kartu ještě nestihl ani zaznamenat. Sáhne-li v ní po kartě,
 * mířil na tu předchozí: prohlídka se k ní vrátí (`stopAtCard`) a hlavní tlačítko čerstvě vyměněné
 * karty se nespustí (`isSettling`).
 */
export const ENTRY_TOUR_SETTLE_MS = 600;

/** Režimy, které prohlídka postupně ukáže. Vstup je na `couch` a tam se také vrací. */
export const ENTRY_TOUR_STEPS = /** @type {readonly HomeEnergyMode[]} */ (
  Object.freeze(['focus', 'walk', 'people', 'couch'])
);

/** Režim, na kterém prohlídka začíná i končí. */
const ENTRY_TOUR_REST_MODE = ENTRY_TOUR_STEPS[ENTRY_TOUR_STEPS.length - 1];

/**
 * Doba od začátku prohlídky do návratu na výchozí režim. Konec (`finished`) hlásí prohlídka
 * až o `ENTRY_TOUR_SETTLE_MS` později, aby i návrat měl svou chvíli na usazení.
 */
export const ENTRY_TOUR_DURATION_MS =
  ENTRY_TOUR_INITIAL_PAUSE_MS + (ENTRY_TOUR_STEPS.length - 1) * ENTRY_TOUR_STEP_MS;

/**
 * Jen zařízení s myší a rozvržení s kartou vedle textu, kde je vidět hero i scéna karty. Na dotykovém
 * zařízení (telefon i tablet, v jakékoli orientaci) je první ťuknutí zároveň jediným signálem, kterým
 * by návštěvník mohl prohlídku zastavit, a čtečka obrazovky na něm neposílá signál žádný; tam prohlídka
 * neběží vůbec. Nízká okna vyřazuje podmínka výšky.
 */
export const ENTRY_TOUR_VIEWPORT_QUERY =
  '(min-width: 920px) and (min-height: 600px) and (hover: hover) and (pointer: fine)';

export const ENTRY_TOUR_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Vstupy, které prohlídku zastaví, ať míří kamkoli na stránce. */
export const ENTRY_TOUR_INPUT_EVENTS = /** @type {readonly ['pointerdown', 'keydown', 'wheel', 'touchstart']} */ (
  Object.freeze(['pointerdown', 'keydown', 'wheel', 'touchstart'])
);

/**
 * @param {EntryTourEligibility} entry
 * @returns {boolean}
 */
export function canStartEntryTour(entry) {
  return (
    entry.viewportEligible === true &&
    !entry.reducedMotion &&
    !entry.hasDeepLink &&
    !entry.restoredDeckState &&
    !entry.dayClosed &&
    !entry.completionShowing &&
    !entry.documentHidden &&
    !entry.scrolled &&
    !entry.alreadySeen
  );
}

/**
 * @template TimerHandle
 * @typedef {Object} EntryTourDeps
 * @property {(mode: HomeEnergyMode) => void} setMode Pasivně přepne režim (bez ukládání a bez analytiky).
 * @property {() => boolean} [isHeld] Zda má uživatel kartu právě „v ruce“ (typicky na ní spočívá ukazatel,
 *   i když na ni nevstoupil až během prohlídky). Ptá se před každým krokem; kladná odpověď prohlídku ukončí.
 * @property {(fn: () => void, ms: number) => TimerHandle} setTimer
 * @property {(handle: TimerHandle) => void} clearTimer
 * @property {() => number} [now] Hodiny v milisekundách; výchozí je `Date.now`.
 * @property {() => void} [onStart] Volá se jednou, když prohlídka opravdu začne (před prvním krokem).
 * @property {(reason: EntryTourEndReason) => void} [onEnd] Volá se jednou, když prohlídka skončí nebo je zastavena.
 */

/**
 * @typedef {Object} EntryTour
 * @property {(entry: EntryTourEligibility) => boolean} start Jediný pokus o start; vrací, zda prohlídka běží.
 * @property {(reason?: EntryTourEndReason) => void} stop Zastaví prohlídku natrvalo; stránka zůstane, jak je.
 * @property {() => void} stopAtCard Návštěvník sáhl po kartě (ukazatel, dotyk, fokus). Zastaví prohlídku
 *   natrvalo; těsně po kroku (`ENTRY_TOUR_SETTLE_MS`) se nejdřív vrátí na režim, na který mířil.
 * @property {() => boolean} isSettling Zda od posledního kroku ještě neuplynulo `ENTRY_TOUR_SETTLE_MS`.
 *   Platí i po zastavení: kliknutí, které už bylo na cestě, nesmí spustit kartu, kterou nikdo nečetl.
 * @property {() => HomeEnergyMode | null} claim Uživatel přebírá balíček: zastaví prohlídku a vrátí režim,
 *   který po sobě nechala na obrazovce a který si uživatel ještě sám nezvolil (jinak `null`).
 * @property {() => boolean} isRunning
 */

/**
 * @template TimerHandle
 * @param {EntryTourDeps<TimerHandle>} deps
 * @returns {EntryTour}
 */
export function createEntryTour(deps) {
  const { setMode, isHeld, setTimer, clearTimer, onStart, onEnd } = deps;
  const now = deps.now ?? Date.now;

  /** @type {'idle' | 'running' | 'ended'} */
  let phase = 'idle';
  /** @type {{ handle: TimerHandle } | null} */
  let pending = null;
  let stepIndex = 0;
  /** @type {HomeEnergyMode | null} */
  let unclaimedMode = null;
  /**
   * Kdy proběhl poslední krok; `null`, dokud žádný nebyl nebo když ho návštěvník vrátil.
   * @type {number | null}
   */
  let lastStepAt = null;
  /**
   * Režim, který byl na obrazovce před posledním krokem.
   * @type {HomeEnergyMode | null}
   */
  let modeBeforeLastStep = null;

  function isSettling() {
    return lastStepAt !== null && now() - lastStepAt < ENTRY_TOUR_SETTLE_MS;
  }

  /** @param {EntryTourEndReason} reason */
  function end(reason) {
    if (pending) {
      clearTimer(pending.handle);
      pending = null;
    }
    phase = 'ended';
    onEnd?.(reason);
  }

  /** @param {number} delayMs */
  function schedule(delayMs) {
    pending = { handle: setTimer(advance, delayMs) };
  }

  function advance() {
    pending = null;
    if (phase !== 'running') return;
    // Návrat na výchozí režim se usadil; teprve teď je prohlídka u konce.
    if (stepIndex >= ENTRY_TOUR_STEPS.length) {
      end('finished');
      return;
    }
    // Kartu, kterou má uživatel v ruce, prohlídka pod ním nevymění.
    if (isHeld?.()) {
      end('interaction');
      return;
    }

    const mode = ENTRY_TOUR_STEPS[stepIndex];
    modeBeforeLastStep = stepIndex === 0 ? ENTRY_TOUR_REST_MODE : ENTRY_TOUR_STEPS[stepIndex - 1];
    stepIndex += 1;
    const isLast = stepIndex >= ENTRY_TOUR_STEPS.length;
    // Návrat na výchozí režim není nic, co by si uživatel musel „převzít“.
    unclaimedMode = isLast ? null : mode;
    lastStepAt = now();
    setMode(mode);

    // `setMode` mohlo prohlídku samo zastavit (například přes obslužnou funkci balíčku).
    if (phase !== 'running') return;
    schedule(isLast ? ENTRY_TOUR_SETTLE_MS : ENTRY_TOUR_STEP_MS);
  }

  return {
    start(entry) {
      if (phase !== 'idle') return false;
      if (!canStartEntryTour(entry)) {
        phase = 'ended';
        return false;
      }
      phase = 'running';
      onStart?.();
      // Stejně jako `setMode` smí i `onStart` prohlídku rovnou ukončit.
      if (phase !== 'running') return false;
      schedule(ENTRY_TOUR_INITIAL_PAUSE_MS);
      return true;
    },

    stop(reason = 'interaction') {
      if (phase !== 'running') return;
      end(reason);
    },

    stopAtCard() {
      if (phase !== 'running') return;
      if (modeBeforeLastStep !== null && isSettling()) {
        const mode = modeBeforeLastStep;
        modeBeforeLastStep = null;
        // Karta, na kterou návštěvník mířil, je zpět a smí se hned spustit.
        lastStepAt = null;
        unclaimedMode = mode === ENTRY_TOUR_REST_MODE ? null : mode;
        setMode(mode);
        if (phase !== 'running') return;
      }
      end('interaction');
    },

    isSettling,

    claim() {
      if (phase === 'running') end('deck');
      const mode = unclaimedMode;
      unclaimedMode = null;
      return mode;
    },

    isRunning() {
      return phase === 'running';
    }
  };
}
