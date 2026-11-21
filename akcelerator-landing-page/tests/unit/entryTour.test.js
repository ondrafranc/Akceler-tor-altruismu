import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ENTRY_TOUR_INITIAL_PAUSE_MS,
  ENTRY_TOUR_STEP_MS,
  ENTRY_TOUR_SETTLE_MS,
  ENTRY_TOUR_STEPS,
  ENTRY_TOUR_DURATION_MS,
  ENTRY_TOUR_VIEWPORT_QUERY,
  ENTRY_TOUR_REDUCED_MOTION_QUERY,
  ENTRY_TOUR_INPUT_EVENTS,
  canStartEntryTour,
  createEntryTour
} from '$lib/features/home/entryTour.js';
import {
  AA_HOME_ENTRY_TOUR_SEEN_KEY,
  AA_HOME_DECK_STATE_KEY,
  AA_DONE_FOR_TODAY_PREFIX,
  safeSetItem,
  safeRemoveItem
} from '$lib/storage/index.js';
import { getTodayKey, isDayClosedToday } from '$lib/features/actions/services/dayClosure.js';

/** @typedef {import('$lib/types').HomeEnergyMode} HomeEnergyMode */
/** @typedef {import('$lib/features/home/entryTour.js').EntryTourEligibility} EntryTourEligibility */
/** @typedef {import('$lib/features/home/entryTour.js').EntryTourEndReason} EntryTourEndReason */

/** @type {EntryTourEligibility} */
const CLEAR = {
  viewportEligible: true,
  reducedMotion: false,
  hasDeepLink: false,
  restoredDeckState: false,
  dayClosed: false,
  completionShowing: false,
  documentHidden: false,
  scrolled: false,
  alreadySeen: false
};

/** From the start of the tour until it reports that it has finished. */
const TOUR_END_MS = ENTRY_TOUR_DURATION_MS + ENTRY_TOUR_SETTLE_MS;

/**
 * Source of one function or method in a file, from its name to its closing brace.
 * @param {string} source
 * @param {string} head Text the function starts with, e.g. `function name(` or `onStart: (`.
 * @returns {string}
 */
function bodyOf(source, head) {
  const start = source.indexOf(head);
  if (start === -1) throw new Error(`"${head}" not found`);
  const open = source.indexOf('{', source.indexOf(')', start));
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`"${head}" is never closed`);
}

/** @param {string} relative Path relative to the app root. */
function readSource(relative) {
  return readFileSync(fileURLToPath(new URL(`../../${relative}`, import.meta.url)), 'utf8');
}

/**
 * Tour wired to the (faked) global timers, recording every call it makes outward.
 * @param {{ onSetMode?: (mode: HomeEnergyMode) => void, isHeld?: () => boolean }} [opts]
 */
function makeTour(opts = {}) {
  /** @type {HomeEnergyMode[]} */
  const modes = [];
  /** @type {EntryTourEndReason[]} */
  const ends = [];
  /** @type {string[]} */
  const log = [];
  const tour = createEntryTour({
    setMode: (mode) => {
      modes.push(mode);
      log.push(`mode:${mode}`);
      opts.onSetMode?.(mode);
    },
    isHeld: opts.isHeld,
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle),
    onStart: () => log.push('start'),
    onEnd: (reason) => {
      ends.push(reason);
      log.push(`end:${reason}`);
    }
  });
  return { tour, modes, ends, log };
}

describe('entryTour: tempo and sequence', () => {
  it('walks focus -> walk -> people and comes to rest on couch', () => {
    expect([...ENTRY_TOUR_STEPS]).toEqual(['focus', 'walk', 'people', 'couch']);
  });

  it('keeps a calm tempo: neither value is slideshow-fast', () => {
    expect(ENTRY_TOUR_INITIAL_PAUSE_MS).toBeGreaterThanOrEqual(2500);
    expect(ENTRY_TOUR_STEP_MS).toBeGreaterThanOrEqual(2500);
  });

  it('gives a reach for the card a settle window far shorter than a step', () => {
    expect(ENTRY_TOUR_SETTLE_MS).toBeGreaterThanOrEqual(300);
    expect(ENTRY_TOUR_SETTLE_MS).toBeLessThan(ENTRY_TOUR_STEP_MS / 2);
  });

  it('exposes the time from start to rest for callers that must wait it out', () => {
    expect(ENTRY_TOUR_DURATION_MS).toBe(
      ENTRY_TOUR_INITIAL_PAUSE_MS + (ENTRY_TOUR_STEPS.length - 1) * ENTRY_TOUR_STEP_MS
    );
  });

  it('names the inputs that stop the tour wherever they land', () => {
    expect([...ENTRY_TOUR_INPUT_EVENTS].sort()).toEqual(['keydown', 'pointerdown', 'touchstart', 'wheel']);
  });

  it('names the media queries the page listens to', () => {
    expect(ENTRY_TOUR_REDUCED_MOTION_QUERY).toBe('(prefers-reduced-motion: reduce)');
    const clauses = ENTRY_TOUR_VIEWPORT_QUERY.split(',').map((clause) => clause.trim());
    expect(clauses.length).toBeGreaterThan(0);
    for (const clause of clauses) {
      expect(clause, 'every clause needs the side-by-side width').toContain('min-width');
      expect(clause, 'every clause keeps low windows out').toContain('min-height');
      // The tour is for mouse devices only: a tablet or phone has no hover and no fine pointer.
      expect(clause, `"${clause}" lets a touch device in`).toContain('pointer: fine');
      expect(clause, `"${clause}" lets a touch device in`).toContain('hover: hover');
    }
  });
});

describe('entryTour: canStartEntryTour', () => {
  it('allows the tour only when nothing stands in its way', () => {
    expect(canStartEntryTour(CLEAR)).toBe(true);
  });

  /** @type {Array<keyof EntryTourEligibility>} */
  const blockers = [
    'reducedMotion',
    'hasDeepLink',
    'restoredDeckState',
    'dayClosed',
    'completionShowing',
    'documentHidden',
    'scrolled',
    'alreadySeen'
  ];

  for (const blocker of blockers) {
    it(`refuses when ${blocker} is true`, () => {
      expect(canStartEntryTour({ ...CLEAR, [blocker]: true })).toBe(false);
    });
  }

  it('refuses on a viewport that is not desktop or landscape tablet', () => {
    expect(canStartEntryTour({ ...CLEAR, viewportEligible: false })).toBe(false);
  });
});

describe('entryTour: createEntryTour scheduling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits out the initial pause, then visits each mode once and ends on couch', () => {
    const { tour, modes, ends } = makeTour();
    expect(tour.start(CLEAR)).toBe(true);
    expect(tour.isRunning()).toBe(true);

    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS - 1);
    expect(modes).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(modes).toEqual(['focus']);

    vi.advanceTimersByTime(ENTRY_TOUR_STEP_MS - 1);
    expect(modes).toEqual(['focus']);
    vi.advanceTimersByTime(1);
    expect(modes).toEqual(['focus', 'walk']);

    vi.advanceTimersByTime(ENTRY_TOUR_STEP_MS);
    expect(modes).toEqual(['focus', 'walk', 'people']);
    expect(ends).toEqual([]);

    vi.advanceTimersByTime(ENTRY_TOUR_STEP_MS);
    expect(modes).toEqual(['focus', 'walk', 'people', 'couch']);
    expect(ends, 'the return to rest gets its settle window too').toEqual([]);
    expect(tour.isRunning()).toBe(true);

    vi.advanceTimersByTime(ENTRY_TOUR_SETTLE_MS - 1);
    expect(ends).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(modes).toEqual(['focus', 'walk', 'people', 'couch']);
    expect(ends).toEqual(['finished']);
    expect(tour.isRunning()).toBe(false);
  });

  it('is one tour only: nothing fires after it has come to rest', () => {
    const { tour, modes, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(TOUR_END_MS);
    expect(modes).toHaveLength(ENTRY_TOUR_STEPS.length);
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS * 3);
    expect(modes).toHaveLength(ENTRY_TOUR_STEPS.length);
    expect(ends).toEqual(['finished']);
  });

  it('reports the start before the first step, exactly once', () => {
    const { tour, log } = makeTour();
    tour.start(CLEAR);
    expect(log).toEqual(['start']);
    vi.advanceTimersByTime(TOUR_END_MS);
    expect(log.filter((entry) => entry === 'start')).toHaveLength(1);
    expect(log[0]).toBe('start');
    expect(log.at(-1)).toBe('end:finished');
  });

  it('does nothing at all when the entry is not eligible', () => {
    const { tour, modes, ends, log } = makeTour();
    expect(tour.start({ ...CLEAR, reducedMotion: true })).toBe(false);
    expect(tour.isRunning()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS * 2);
    expect(modes).toEqual([]);
    expect(ends).toEqual([]);
    expect(log).toEqual([]);
  });

  it('gets a single chance: a refused or finished tour cannot be started again', () => {
    const refused = makeTour();
    expect(refused.tour.start({ ...CLEAR, scrolled: true })).toBe(false);
    expect(refused.tour.start(CLEAR)).toBe(false);
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS);
    expect(refused.modes).toEqual([]);

    const finished = makeTour();
    finished.tour.start(CLEAR);
    vi.advanceTimersByTime(TOUR_END_MS);
    expect(finished.tour.start(CLEAR)).toBe(false);
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS);
    expect(finished.modes).toHaveLength(ENTRY_TOUR_STEPS.length);
    expect(finished.log.filter((entry) => entry === 'start')).toHaveLength(1);
  });

  it('ignores a second start while running instead of doubling the timers', () => {
    const { tour, modes } = makeTour();
    expect(tour.start(CLEAR)).toBe(true);
    expect(tour.start(CLEAR)).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS);
    expect(modes).toEqual(['focus', 'walk', 'people', 'couch']);
  });
});

describe('entryTour: stopping', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stopped during the initial pause it never changes the mode', () => {
    const { tour, modes, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS - 50);
    tour.stop('interaction');

    expect(tour.isRunning()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS * 2);
    expect(modes).toEqual([]);
    expect(ends).toEqual(['interaction']);
  });

  it('stopped mid-tour it stays where it is and never fires a late step', () => {
    const { tour, modes, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS + ENTRY_TOUR_STEP_MS);
    expect(modes).toEqual(['focus', 'walk']);

    tour.stop('scroll');
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS * 2);
    expect(modes).toEqual(['focus', 'walk']);
    expect(ends).toEqual(['scroll']);
  });

  it('stays stopped for good: repeated stops and a later start change nothing', () => {
    const { tour, modes, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS);
    tour.stop('visibility');
    tour.stop('interaction');
    tour.stop('destroy');
    expect(tour.start(CLEAR)).toBe(false);
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS * 2);
    expect(modes).toEqual(['focus']);
    expect(ends).toEqual(['visibility']);
  });

  it('stopping a tour that never started is a silent no-op', () => {
    const { tour, ends } = makeTour();
    tour.stop('interaction');
    expect(ends).toEqual([]);
    expect(tour.start(CLEAR)).toBe(true);
  });

  it('schedules nothing further when the mode setter itself stops the tour', () => {
    /** @type {{ stop: (reason: EntryTourEndReason) => void } | null} */
    let handle = null;
    const made = makeTour({
      onSetMode: (mode) => {
        if (mode === 'walk') handle?.stop('deck');
      }
    });
    handle = made.tour;
    made.tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS * 2);
    expect(made.modes).toEqual(['focus', 'walk']);
    expect(made.ends).toEqual(['deck']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never changes a card the visitor is already holding: the first step ends the tour instead', () => {
    const { tour, modes, ends } = makeTour({ isHeld: () => true });
    expect(tour.start(CLEAR)).toBe(true);
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS * 2);
    expect(modes).toEqual([]);
    expect(ends).toEqual(['interaction']);
    expect(tour.isRunning()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(tour.claim()).toBeNull();
  });

  it('asks before every step, so a hold that begins mid-tour stops it on the mode it is showing', () => {
    let held = false;
    let asked = 0;
    const { tour, modes, ends } = makeTour({
      isHeld: () => {
        asked += 1;
        return held;
      }
    });
    tour.start(CLEAR);
    expect(asked, 'the entry state itself is not a step').toBe(0);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS + ENTRY_TOUR_STEP_MS);
    expect(modes).toEqual(['focus', 'walk']);
    expect(asked).toBe(2);

    held = true;
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS * 2);
    expect(modes).toEqual(['focus', 'walk']);
    expect(asked).toBe(3);
    expect(ends).toEqual(['interaction']);
    expect(tour.claim(), 'the mode left on screen is still the one to hand over').toBe('walk');
  });

  it('uses only the injected timer functions and clears the pending handle on stop', () => {
    /** @type {Array<{ id: number, fn: () => void, ms: number }>} */
    const scheduled = [];
    /** @type {number[]} */
    const cleared = [];
    let nextId = 1;
    const globalSetTimeout = vi.spyOn(globalThis, 'setTimeout');
    const tour = createEntryTour({
      setMode: () => {},
      setTimer: (fn, ms) => {
        const id = nextId++;
        scheduled.push({ id, fn, ms });
        return id;
      },
      clearTimer: (id) => {
        cleared.push(id);
      }
    });

    tour.start(CLEAR);
    expect(scheduled.map((entry) => entry.ms)).toEqual([ENTRY_TOUR_INITIAL_PAUSE_MS]);
    scheduled[0].fn();
    expect(scheduled.map((entry) => entry.ms)).toEqual([
      ENTRY_TOUR_INITIAL_PAUSE_MS,
      ENTRY_TOUR_STEP_MS
    ]);

    tour.stop('interaction');
    expect(cleared).toEqual([scheduled[1].id]);
    expect(globalSetTimeout).not.toHaveBeenCalled();

    // A timer the host failed to cancel must still be harmless.
    scheduled[1].fn();
    expect(scheduled).toHaveLength(2);
    globalSetTimeout.mockRestore();
  });
});

describe('entryTour: reaching for the card (stopAtCard and the settle window)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is not settling before the first step, and for a settle window after each one', () => {
    const { tour } = makeTour();
    expect(tour.isSettling()).toBe(false);
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS - 1);
    expect(tour.isSettling()).toBe(false);

    vi.advanceTimersByTime(1);
    expect(tour.isSettling()).toBe(true);
    vi.advanceTimersByTime(ENTRY_TOUR_SETTLE_MS - 1);
    expect(tour.isSettling()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(tour.isSettling()).toBe(false);

    vi.advanceTimersByTime(ENTRY_TOUR_STEP_MS - ENTRY_TOUR_SETTLE_MS);
    expect(tour.isSettling(), 'the next step opens a new window').toBe(true);
  });

  it('keeps settling after a plain stop, so a tap already on its way cannot start the swapped-in card', () => {
    const { tour, modes } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS + 100);
    tour.stop('interaction');
    expect(modes).toEqual(['focus']);
    expect(tour.isSettling()).toBe(true);
    vi.advanceTimersByTime(ENTRY_TOUR_SETTLE_MS);
    expect(tour.isSettling()).toBe(false);
  });

  it('a reach during the initial pause just stops the tour', () => {
    const { tour, modes, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS - 50);
    tour.stopAtCard();
    expect(modes).toEqual([]);
    expect(ends).toEqual(['interaction']);
    expect(tour.claim()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a reach right after the first step was aimed at the entry card: the tour steps back to it', () => {
    const { tour, modes, ends, log } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS + ENTRY_TOUR_SETTLE_MS - 1);
    tour.stopAtCard();

    expect(modes).toEqual(['focus', 'couch']);
    expect(ends).toEqual(['interaction']);
    expect(log.slice(-2), 'the step back happens before the tour reports its end').toEqual([
      'mode:couch',
      'end:interaction'
    ]);
    expect(tour.isRunning()).toBe(false);
    expect(tour.isSettling(), 'the card the visitor aimed at is ready at once').toBe(false);
    expect(tour.claim(), 'the entry card is nothing to hand over').toBeNull();
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS * 2);
    expect(modes).toEqual(['focus', 'couch']);
  });

  it('a reach right after a later step goes back to the mode shown before it, which stays claimable', () => {
    const { tour, modes, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS + ENTRY_TOUR_STEP_MS + 200);
    expect(modes).toEqual(['focus', 'walk']);
    tour.stopAtCard();
    expect(modes).toEqual(['focus', 'walk', 'focus']);
    expect(ends).toEqual(['interaction']);
    expect(tour.claim()).toBe('focus');
    expect(tour.claim()).toBeNull();
  });

  it('a reach once the settle window is over stays on what is showing', () => {
    const { tour, modes, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS + ENTRY_TOUR_SETTLE_MS);
    tour.stopAtCard();
    expect(modes).toEqual(['focus']);
    expect(ends).toEqual(['interaction']);
    expect(tour.claim()).toBe('focus');
  });

  it('a reach right after the return to rest goes back to the last mode of the walk', () => {
    const { tour, modes, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS + ENTRY_TOUR_SETTLE_MS - 1);
    expect(modes).toEqual(['focus', 'walk', 'people', 'couch']);
    tour.stopAtCard();
    expect(modes).toEqual(['focus', 'walk', 'people', 'couch', 'people']);
    expect(ends).toEqual(['interaction']);
    expect(tour.claim()).toBe('people');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('steps back at most once and does nothing on a tour that is over', () => {
    const { tour, modes, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS + 100);
    tour.stopAtCard();
    tour.stopAtCard();
    expect(modes).toEqual(['focus', 'couch']);
    expect(ends).toEqual(['interaction']);

    const stopped = makeTour();
    stopped.tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS + 100);
    stopped.tour.stop('scroll');
    stopped.tour.stopAtCard();
    expect(stopped.modes, 'a tour stopped elsewhere stays where it is').toEqual(['focus']);
    expect(stopped.ends).toEqual(['scroll']);

    const idle = makeTour();
    idle.tour.stopAtCard();
    expect(idle.ends).toEqual([]);
    expect(idle.tour.start(CLEAR)).toBe(true);
  });

  it('reads time only through the injected clock', () => {
    let clock = 1000;
    /** @type {Array<() => void>} */
    const timers = [];
    /** @type {HomeEnergyMode[]} */
    const modes = [];
    const dateNow = vi.spyOn(Date, 'now');
    const tour = createEntryTour({
      setMode: (mode) => {
        modes.push(mode);
      },
      setTimer: (fn) => timers.push(fn),
      clearTimer: () => {},
      now: () => clock
    });
    tour.start(CLEAR);
    timers[0]();
    expect(tour.isSettling()).toBe(true);
    clock += ENTRY_TOUR_SETTLE_MS;
    expect(tour.isSettling()).toBe(false);
    tour.stopAtCard();
    expect(modes).toEqual(['focus']);
    expect(dateNow).not.toHaveBeenCalled();
    dateNow.mockRestore();
  });
});

describe('entryTour: claim (the visitor takes over the deck)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns nothing while the tour has not moved off the entry mode', () => {
    const { tour, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS - 1);
    expect(tour.claim()).toBeNull();
    expect(tour.isRunning()).toBe(false);
    expect(ends).toEqual(['deck']);
  });

  it('stops the tour and hands over the mode it left on screen, once', () => {
    const { tour, modes, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS + ENTRY_TOUR_STEP_MS);
    expect(tour.claim()).toBe('walk');
    expect(tour.claim()).toBeNull();
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS * 2);
    expect(modes).toEqual(['focus', 'walk']);
    expect(ends).toEqual(['deck']);
  });

  it('still hands over the shown mode when something else stopped the tour first', () => {
    const { tour, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_INITIAL_PAUSE_MS);
    tour.stop('interaction');
    expect(tour.claim()).toBe('focus');
    expect(tour.claim()).toBeNull();
    expect(ends).toEqual(['interaction']);
  });

  it('has nothing to hand over once the tour came to rest on its own', () => {
    const { tour } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(TOUR_END_MS);
    expect(tour.claim()).toBeNull();
  });

  it('has nothing to hand over while the return to rest is still settling', () => {
    const { tour, ends } = makeTour();
    tour.start(CLEAR);
    vi.advanceTimersByTime(ENTRY_TOUR_DURATION_MS);
    expect(tour.claim()).toBeNull();
    expect(ends).toEqual(['deck']);
  });

  it('is safe on a tour that never started', () => {
    const { tour, ends } = makeTour();
    expect(tour.claim()).toBeNull();
    expect(ends).toEqual([]);
  });
});

describe('entryTour: storage key and day closure helper', () => {
  it('has its own session key, distinct from the saved deck state', () => {
    expect(typeof AA_HOME_ENTRY_TOUR_SEEN_KEY).toBe('string');
    expect(AA_HOME_ENTRY_TOUR_SEEN_KEY.startsWith('aa_')).toBe(true);
    expect(AA_HOME_ENTRY_TOUR_SEEN_KEY).not.toBe(AA_HOME_DECK_STATE_KEY);
  });

  it('builds the local calendar day key used by the day-closed flag', () => {
    expect(getTodayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(getTodayKey(new Date(2026, 10, 20, 0, 0))).toBe('2026-11-20');
  });

  it('reports the day as closed only while the flag for today is set', () => {
    const key = `${AA_DONE_FOR_TODAY_PREFIX}${getTodayKey()}`;
    safeRemoveItem(key, 'local');
    expect(isDayClosedToday()).toBe(false);
    safeSetItem(key, '1', 'local');
    expect(isDayClosedToday()).toBe(true);
    safeSetItem(key, '0', 'local');
    expect(isDayClosedToday()).toBe(false);
    safeRemoveItem(key, 'local');
  });
});

describe('entryTour: the page wires it passively', () => {
  const pageSource = readSource('src/routes/+page.svelte');
  const FORBIDDEN = [
    'trackEvent',
    'trackFunnel',
    'syncDeckPersistence',
    'saveHomeDeckState',
    'markActionStarted',
    'savePendingPartnerReturn',
    'recordSmallWin'
  ];

  // Analytics is switched off on the dev server the E2E suite runs against, so only the source can show this.
  for (const head of [
    'function showModePassively(',
    'function attachEntryTourGuards(',
    'function startEntryTour(',
    'function stopEntryTourFromControl(',
    'function handleCardClickCapture('
  ]) {
    it(`${head.replace('function ', '').replace('(', '')} records and saves nothing`, () => {
      const body = bodyOf(pageSource, head);
      for (const name of FORBIDDEN) {
        expect(body, `${head} must not call ${name}`).not.toContain(name);
      }
    });
  }

  it('the passive mode setter is the one the tour is given', () => {
    expect(bodyOf(pageSource, 'function startEntryTour(')).toContain('setMode: showModePassively');
  });

  it('holds the idle lure of the card and the guiding of Molly for as long as the tour runs', () => {
    const start = bodyOf(pageSource, 'function startEntryTour(');
    expect(bodyOf(start, 'onStart: (')).toContain('holdMollyGuide()');
    expect(bodyOf(start, 'onEnd: (')).toContain('releaseMollyGuide(');
    expect(pageSource).toContain('idleLure={!entryTourRunning}');

    const molly = readSource('src/components/MollyCompanion.svelte');
    expect(bodyOf(molly, 'function scheduleRouteHint(')).toContain('if (guideHeld) return;');
    expect(bodyOf(molly, 'function scheduleIdleNudge(')).toContain('if (guideHeld) return;');
  });
});
