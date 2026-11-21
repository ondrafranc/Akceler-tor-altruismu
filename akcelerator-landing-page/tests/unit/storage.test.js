import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getStoredItem,
  setStoredItem,
  removeStoredItem,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  resolveNativeStorage,
  AA_COMPLETED_STEPS_KEY,
  AA_SANCTUARY_WISHES_KEY,
  AA_MOLLY_COMPANION_KEY,
  AA_MOLLY_FOLLOW_MOUSE_KEY,
  AA_STARTED_ACTIONS_KEY,
  AA_FUNNEL_COUNTS_KEY,
  AA_USER_TOPICS_KEY,
  AA_VALUES_KEY,
  AA_GUIDED_VALUES_KEY,
  AA_PREFS_NEAR_KEY,
  AA_MY_PENDING_SUBMISSIONS_KEY,
  AA_SUBMIT_DRAFT_KEY,
  AA_SOUND_MUTED_KEY,
  AA_PARTNER_RETURN_KEY,
  AA_DONE_FOR_TODAY_PREFIX,
  AA_MOLLY_HINT_PREFIX,
  AA_MOLLY_HINTS_KEY,
  AA_MOLLY_NUDGES_KEY,
  AA_HOME_DECK_STATE_KEY,
  AA_HOME_ENTRY_TOUR_SEEN_KEY
} from '../../src/lib/storage/index.js';

/** @typedef {{ window?: typeof globalThis.window }} GlobalWithOptionalWindow */

describe('Storage Subsystem Unit Tests (src/lib/storage/)', () => {
  /** @type {typeof globalThis.window | undefined} */
  let prevWindow;

  beforeEach(() => {
    prevWindow = globalThis.window;
  });

  afterEach(() => {
    if (prevWindow === undefined) {
      delete /** @type {GlobalWithOptionalWindow} */ (globalThis).window;
    } else {
      globalThis.window = prevWindow;
    }
    vi.restoreAllMocks();
  });

  describe('1. Canonical Key Registry Integrity', () => {
    it('exports all canonical keys as non-empty strings', () => {
      const keys = [
        AA_COMPLETED_STEPS_KEY,
        AA_SANCTUARY_WISHES_KEY,
        AA_MOLLY_COMPANION_KEY,
        AA_MOLLY_FOLLOW_MOUSE_KEY,
        AA_STARTED_ACTIONS_KEY,
        AA_FUNNEL_COUNTS_KEY,
        AA_USER_TOPICS_KEY,
        AA_VALUES_KEY,
        AA_GUIDED_VALUES_KEY,
        AA_PREFS_NEAR_KEY,
        AA_MY_PENDING_SUBMISSIONS_KEY,
        AA_SUBMIT_DRAFT_KEY,
        AA_SOUND_MUTED_KEY,
        AA_PARTNER_RETURN_KEY,
        AA_MOLLY_HINTS_KEY,
        AA_MOLLY_NUDGES_KEY,
        AA_HOME_DECK_STATE_KEY,
        AA_HOME_ENTRY_TOUR_SEEN_KEY
      ];
      for (const k of keys) {
        expect(typeof k).toBe('string');
        expect(k.length).toBeGreaterThan(0);
        expect(k.startsWith('aa_')).toBe(true);
      }
    });

    it('prefixes terminate with underscore', () => {
      expect(AA_DONE_FOR_TODAY_PREFIX.endsWith('_')).toBe(true);
      expect(AA_MOLLY_HINT_PREFIX.endsWith('_')).toBe(true);
    });

    it('canonical aliases reference the identical underlying functions', () => {
      expect(safeGetItem).toBe(getStoredItem);
      expect(safeSetItem).toBe(setStoredItem);
      expect(safeRemoveItem).toBe(removeStoredItem);
    });
  });

  describe('2. SSR & Headless Node Safety (window === undefined)', () => {
    it('resolveNativeStorage safely returns null when window is undefined', () => {
      delete /** @type {GlobalWithOptionalWindow} */ (globalThis).window;
      expect(resolveNativeStorage('local')).toBeNull();
      expect(resolveNativeStorage('session')).toBeNull();
    });

    it('persists and retrieves in-memory without throwing', () => {
      delete /** @type {GlobalWithOptionalWindow} */ (globalThis).window;
      const testKey = AA_COMPLETED_STEPS_KEY;
      setStoredItem(testKey, JSON.stringify([{ id: 'step-1' }]), 'local');
      expect(getStoredItem(testKey, 'local')).toBe(JSON.stringify([{ id: 'step-1' }]));

      removeStoredItem(testKey, 'local');
      expect(getStoredItem(testKey, 'local')).toBeNull();
    });

    it('returns null for non-existent keys in memory', () => {
      delete /** @type {GlobalWithOptionalWindow} */ (globalThis).window;
      expect(getStoredItem('non_existent_key_xyz', 'local')).toBeNull();
    });

    it('coerces non-string values to string', () => {
      delete /** @type {GlobalWithOptionalWindow} */ (globalThis).window;
      setStoredItem(AA_SOUND_MUTED_KEY, 1, 'local');
      expect(getStoredItem(AA_SOUND_MUTED_KEY, 'local')).toBe('1');
    });
  });

  describe('3. Storage Domain Isolation (local vs session)', () => {
    it('isolates local and session storage values', () => {
      delete /** @type {GlobalWithOptionalWindow} */ (globalThis).window;
      setStoredItem(AA_VALUES_KEY, 'local_data', 'local');
      setStoredItem(AA_VALUES_KEY, 'session_data', 'session');

      expect(getStoredItem(AA_VALUES_KEY, 'local')).toBe('local_data');
      expect(getStoredItem(AA_VALUES_KEY, 'session')).toBe('session_data');

      removeStoredItem(AA_VALUES_KEY, 'session');
      expect(getStoredItem(AA_VALUES_KEY, 'session')).toBeNull();
      expect(getStoredItem(AA_VALUES_KEY, 'local')).toBe('local_data');
    });

    it('defaults kind to local when omitted', () => {
      delete /** @type {GlobalWithOptionalWindow} */ (globalThis).window;
      setStoredItem(AA_USER_TOPICS_KEY, 'default_local');
      expect(getStoredItem(AA_USER_TOPICS_KEY)).toBe('default_local');
      expect(getStoredItem(AA_USER_TOPICS_KEY, 'local')).toBe('default_local');
      expect(getStoredItem(AA_USER_TOPICS_KEY, 'session')).toBeNull();
    });
  });

  describe('4. Browser Native Storage Integration', () => {
    it('interacts with window.localStorage and window.sessionStorage when present', () => {
      const mockStorage = () => {
        const store = new Map();
        return /** @type {Storage} */ (/** @type {unknown} */ ({
          length: 0,
          key: vi.fn(() => null),
          getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
          setItem: vi.fn((k, v) => store.set(k, String(v))),
          removeItem: vi.fn((k) => store.delete(k)),
          clear: vi.fn(() => store.clear())
        }));
      };

      const localMock = mockStorage();
      const sessionMock = mockStorage();
      globalThis.window = /** @type {Window & typeof globalThis} */ (/** @type {unknown} */ ({
        localStorage: localMock,
        sessionStorage: sessionMock
      }));

      expect(resolveNativeStorage('local')).toBe(localMock);
      expect(resolveNativeStorage('session')).toBe(sessionMock);

      setStoredItem(AA_MOLLY_COMPANION_KEY, '{"mood":"purring"}', 'local');
      expect(localMock.setItem).toHaveBeenCalledWith(AA_MOLLY_COMPANION_KEY, '{"mood":"purring"}');
      expect(getStoredItem(AA_MOLLY_COMPANION_KEY, 'local')).toBe('{"mood":"purring"}');

      removeStoredItem(AA_MOLLY_COMPANION_KEY, 'local');
      expect(localMock.removeItem).toHaveBeenCalledWith(AA_MOLLY_COMPANION_KEY);
      expect(getStoredItem(AA_MOLLY_COMPANION_KEY, 'local')).toBeNull();
    });
  });

  describe('5. SecurityError & Cookie-Blocking Resilience', () => {
    it('gracefully degrades to memory when accessing native storage throws SecurityError', () => {
      globalThis.window = /** @type {Window & typeof globalThis} */ (/** @type {unknown} */ ({}));
      Object.defineProperty(globalThis.window, 'localStorage', {
        get() {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        }
      });

      expect(resolveNativeStorage('local')).toBeNull();

      // Does not throw and functions via memory fallback
      expect(() => {
        setStoredItem(AA_SOUND_MUTED_KEY, '1', 'local');
      }).not.toThrow();

      expect(getStoredItem(AA_SOUND_MUTED_KEY, 'local')).toBe('1');
    });
  });

  describe('6. QuotaExceededError & Stale Read Protection', () => {
    it('safely handles QuotaExceededError and prevents reading stale native data', () => {
      const backingMap = new Map();
      backingMap.set(AA_COMPLETED_STEPS_KEY, 'old_stale_value');

      const mockQuotaStorage = /** @type {Storage} */ (/** @type {unknown} */ ({
        length: 0,
        key: vi.fn(() => null),
        clear: vi.fn(),
        getItem: vi.fn((k) => backingMap.get(k) ?? null),
        setItem: vi.fn(() => {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }),
        removeItem: vi.fn((k) => backingMap.delete(k))
      }));

      globalThis.window = /** @type {Window & typeof globalThis} */ (/** @type {unknown} */ ({
        localStorage: mockQuotaStorage
      }));

      // setStoredItem catches QuotaExceededError without throwing
      expect(() => {
        setStoredItem(AA_COMPLETED_STEPS_KEY, 'new_updated_value', 'local');
      }).not.toThrow();

      // getStoredItem must return the NEW value from memory, NOT the stale native value
      expect(getStoredItem(AA_COMPLETED_STEPS_KEY, 'local')).toBe('new_updated_value');
    });
  });

  describe('7. Home Deck State Persistence Key (AA_HOME_DECK_STATE_KEY)', () => {
    it('round-trips serialized HomeDeckState safely in SSR and browser storage', () => {
      delete /** @type {GlobalWithOptionalWindow} */ (globalThis).window;
      const payload = JSON.stringify({
        energyMode: 'focus',
        actionId: 'zvire_v_nouzi',
        index: 2,
        excludeQuickId: '',
        usePersonalValues: false
      });
      safeSetItem(AA_HOME_DECK_STATE_KEY, payload, 'local');
      const restored = safeGetItem(AA_HOME_DECK_STATE_KEY, 'local');
      expect(restored).toBe(payload);
      const parsed = JSON.parse(restored || '{}');
      expect(parsed.energyMode).toBe('focus');
      expect(parsed.actionId).toBe('zvire_v_nouzi');
      expect(parsed.index).toBe(2);
      safeRemoveItem(AA_HOME_DECK_STATE_KEY, 'local');
      expect(safeGetItem(AA_HOME_DECK_STATE_KEY, 'local')).toBeNull();
    });
  });
});
