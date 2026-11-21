import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  mollyState,
  followMouse,
  toggleMollyFollowMouse,
  setMollyFollowMouse,
  toggleMollyPelisek,
  thankForDeed,
  mollyEvents,
  petMolly,
  notifyMollySpark,
  MOLLY_FOLLOW_MOUSE_KEY,
  MOLLY_STORAGE_KEY
} from '$lib/mollyStore.js';
import {
  MOLLY_ROUTE_GUIDES,
  MOLLY_PET_WHISPERS,
  MOLLY_DEED_THANKS,
  getMollyGreeting
} from '$lib/mollyTypes.js';
import { safeGetItem } from '$lib/storage/index.js';

describe('mollyStore Unit Tests (Milestone 3: Follow Mouse & State Transitions)', () => {
  beforeEach(() => {
    // Reset state to a known clean baseline
    setMollyFollowMouse(false);
  });

  describe('followMouse store & persistence (Requirement R2)', () => {
    it('initializes followMouse store and mollyState.followMouse as boolean', () => {
      const currentFollow = get(followMouse);
      const state = get(mollyState);
      expect(typeof currentFollow).toBe('boolean');
      expect(typeof state.followMouse).toBe('boolean');
      expect(currentFollow).toBe(state.followMouse);
    });

    it('setMollyFollowMouse updates both followMouse store and mollyState, and persists to storage', () => {
      const res = setMollyFollowMouse(true);
      expect(res).toBe(true);
      expect(get(followMouse)).toBe(true);
      expect(get(mollyState).followMouse).toBe(true);
      expect(safeGetItem(MOLLY_FOLLOW_MOUSE_KEY, 'local')).toBe('true');

      const resFalse = setMollyFollowMouse(false);
      expect(resFalse).toBe(false);
      expect(get(followMouse)).toBe(false);
      expect(get(mollyState).followMouse).toBe(false);
      expect(safeGetItem(MOLLY_FOLLOW_MOUSE_KEY, 'local')).toBe('false');
    });

    it('toggleMollyFollowMouse inverts current value and attaches Czech whisper', () => {
      setMollyFollowMouse(false);

      const nextVal = toggleMollyFollowMouse();
      expect(nextVal).toBe(true);
      expect(get(followMouse)).toBe(true);

      const stateWithWhisper = get(mollyState);
      expect(stateWithWhisper.followMouse).toBe(true);
      expect(stateWithWhisper.whisper).not.toBeNull();
      expect(stateWithWhisper.whisper?.icon).toBe('paw');
      expect(stateWithWhisper.whisper?.text).toContain('Půjdu s tebou');
      expect(safeGetItem(MOLLY_FOLLOW_MOUSE_KEY, 'local')).toBe('true');

      const secondToggle = toggleMollyFollowMouse();
      expect(secondToggle).toBe(false);
      expect(get(followMouse)).toBe(false);

      const stateSecond = get(mollyState);
      expect(stateSecond.followMouse).toBe(false);
      expect(stateSecond.whisper?.icon).toBe('home');
      expect(stateSecond.whisper?.text).toContain('Zůstanu na svém klidném místě');
      expect(safeGetItem(MOLLY_FOLLOW_MOUSE_KEY, 'local')).toBe('false');
    });

    it('handles non-boolean coercion properly in setMollyFollowMouse', () => {
      setMollyFollowMouse(1);
      expect(get(followMouse)).toBe(true);

      setMollyFollowMouse(0);
      expect(get(followMouse)).toBe(false);

      setMollyFollowMouse('yes');
      expect(get(followMouse)).toBe(true);

      setMollyFollowMouse('');
      expect(get(followMouse)).toBe(false);
    });
  });

  describe('Molly state transitions', () => {
    it('toggleMollyPelisek switches mode between roaming and docked', () => {
      const initialState = get(mollyState);
      const startMode = initialState.mode;

      const newMode = toggleMollyPelisek();
      expect(newMode).not.toBe(startMode);
      expect(get(mollyState).mode).toBe(newMode);

      const revertedMode = toggleMollyPelisek();
      expect(revertedMode).toBe(startMode);
      expect(get(mollyState).mode).toBe(startMode);
    });

    it('notifyMollySpark gives Molly a spark to catch and changes nothing but her whisper and mood', () => {
      const before = get(mollyState);
      /** @type {import('$lib/types').MollyEvent | null} */
      let seen = null;
      const stop = mollyEvents.subscribe((ev) => {
        seen = ev;
      });

      const spark = notifyMollySpark({ id: 'spark_action' }, { surface: 'canvas' });
      stop();

      expect(spark).toMatchObject({ icon: 'sparkles', actionId: 'spark_action' });
      expect(seen).toMatchObject({ type: 'spark', spark: { icon: 'sparkles' }, surface: 'canvas' });
      const after = get(mollyState);
      expect(after.petCount).toBe(before.petCount);
      expect(after.mode).toBe(before.mode);
      expect(after.whisper?.icon).toBe('sparkles');
    });

    it('petMolly increments petCount and sets purring mood', () => {
      const beforeCount = get(mollyState).petCount;
      petMolly('Laskavé pohlazení');

      const afterState = get(mollyState);
      expect(afterState.petCount).toBe(beforeCount + 1);
      expect(afterState.mood).toBe('purring');
      expect(afterState.whisper?.text).toBe('Laskavé pohlazení');
    });

    it('petMolly always answers from MOLLY_PET_WHISPERS', () => {
      for (let i = 0; i < 30; i++) {
        petMolly();
        const text = get(mollyState).whisper?.text || '';
        expect(MOLLY_PET_WHISPERS).toContain(text);
        expect(text).not.toMatch(/pamls|dobrot|odměn/i);
      }
    });
  });

  describe('Thanks for a deed', () => {
    it('thankForDeed shows a thanks whisper from MOLLY_DEED_THANKS and emits a thanks event', () => {
      /** @type {import('$lib/types').MollyEvent | null} */
      let seen = null;
      const stop = mollyEvents.subscribe((ev) => {
        seen = ev;
      });

      thankForDeed({ silent: true });
      stop();

      const whisper = get(mollyState).whisper;
      expect(MOLLY_DEED_THANKS).toContain(whisper?.text);
      expect(whisper?.fromThanks).toBe(true);
      expect(whisper?.icon).toBe('heart');
      expect(seen).toMatchObject({ type: 'thanks' });
    });

    it('thankForDeed changes no counter and saves nothing', () => {
      const before = get(mollyState);
      const savedBefore = safeGetItem(MOLLY_STORAGE_KEY, 'local');

      thankForDeed({ silent: true });

      const after = get(mollyState);
      expect(after.petCount).toBe(before.petCount);
      expect(after.mode).toBe(before.mode);
      expect(after.followMouse).toBe(before.followMouse);
      expect(safeGetItem(MOLLY_STORAGE_KEY, 'local')).toBe(savedBefore);
    });

    it('a docked Molly stays asleep while she thanks', () => {
      if (get(mollyState).mode !== 'docked') toggleMollyPelisek();
      thankForDeed({ silent: true });
      expect(get(mollyState).mood).toBe('sleeping');
      toggleMollyPelisek();
    });

    it('no thanks text mentions food or rewards', () => {
      expect(MOLLY_DEED_THANKS.length).toBeGreaterThanOrEqual(3);
      for (const text of MOLLY_DEED_THANKS) {
        expect(text).not.toMatch(/pamls|dobrot|odměn|mňam/i);
        expect(text.length).toBeLessThanOrEqual(95);
      }
    });
  });

  describe('Saved state from before treats and gifts were removed', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.resetModules();
    });

    /** @param {string} raw */
    async function loadStoreWithSavedState(raw) {
      vi.resetModules();
      // The store reads saved state only in a browser; a bare window is enough to stand in for one.
      vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {} });
      const storage = await import('$lib/storage/index.js');
      storage.safeSetItem(storage.AA_MOLLY_COMPANION_KEY, raw, 'local');
      const store = await import('$lib/mollyStore.js');
      return { storage, store };
    }

    const LEGACY_FIELDS = [
      'treatsFedTotal',
      'treatsFedToday',
      'lastFedIso',
      'availableTreats',
      'earnedTreatQueue',
      'lastTreat',
      'giftDeeds'
    ];

    it('loads a legacy saved state: drops treat and gift fields, keeps mode and petCount', async () => {
      const legacy = {
        mode: 'docked',
        mood: 'eating',
        followMouse: false,
        petCount: 12,
        treatsFedTotal: 128,
        treatsFedToday: 2,
        lastFedIso: '2026-01-01T10:00:00.000Z',
        availableTreats: 3,
        earnedTreatQueue: Array.from({ length: 20 }, (_, i) => ({ icon: '\u{1F41F}', foodType: 'salmon', ts: i })),
        lastTreat: { icon: '\u{1F41F}', name: 'x', foodType: 'salmon' },
        giftDeeds: 27
      };
      const { storage, store } = await loadStoreWithSavedState(JSON.stringify(legacy));

      const state = get(store.mollyState);
      expect(state.mode).toBe('docked');
      expect(state.mood).toBe('sleeping');
      expect(state.petCount).toBe(12);
      for (const field of LEGACY_FIELDS) expect(state, field).not.toHaveProperty(field);

      store.petMolly('test');
      const saved = JSON.parse(storage.safeGetItem(storage.AA_MOLLY_COMPANION_KEY, 'local') || '{}');
      expect(saved.petCount).toBe(13);
      expect(saved.mode).toBe('docked');
      for (const field of LEGACY_FIELDS) expect(saved, field).not.toHaveProperty(field);
    });

    it('survives a corrupted legacy record', async () => {
      const { store } = await loadStoreWithSavedState(
        JSON.stringify({ mode: 'roaming', petCount: 'many', earnedTreatQueue: 'x', giftDeeds: null, lastTreat: 7 })
      );
      const state = get(store.mollyState);
      expect(state.mode).toBe('roaming');
      expect(state.petCount).toBe(0);
    });

    it('survives a record that is not an object', async () => {
      const { store } = await loadStoreWithSavedState('[1,2,3]');
      expect(get(store.mollyState).mode).toBe('roaming');
    });
  });

  describe('Molly Copy Quality, Czech Grammar & Tone Guardrails', () => {
    it('all Molly copy has zero Unicode emoji, zero tildes, zero exclamation marks, and zero banned tokens', () => {
      const collected = [];
      collected.push(...MOLLY_PET_WHISPERS, ...MOLLY_DEED_THANKS);
      for (const guide of Object.values(MOLLY_ROUTE_GUIDES)) {
        collected.push(guide.hint, guide.nudge);
      }
      for (const h of [0, 7, 13, 20]) {
        collected.push(getMollyGreeting(new Date(2026, 0, 1, h)));
      }

      // Runtime whispers
      thankForDeed({ silent: true });
      collected.push(get(mollyState).whisper?.text || '');
      petMolly();
      collected.push(get(mollyState).whisper?.text || '');
      notifyMollySpark({ id: 'runtime_spark' });
      collected.push(get(mollyState).whisper?.text || '');
      toggleMollyPelisek();
      collected.push(get(mollyState).whisper?.text || '');
      toggleMollyPelisek();
      collected.push(get(mollyState).whisper?.text || '');
      toggleMollyFollowMouse();
      collected.push(get(mollyState).whisper?.text || '');
      toggleMollyFollowMouse();
      collected.push(get(mollyState).whisper?.text || '');

      const banned = [
        'malovaná',
        'malovaný',
        'skutečné skutky v česku',
        'tiché útočiště',
        'jezero',
        'jezera',
        'jezeru',
        'jistý',
        'mňamk',
        'pamls',
        'zamlsám',
        'dobrot',
        'dárek',
        'odměn',
        '+1 xp',
        'level'
      ];

      for (const s of collected) {
        expect(s.length).toBeGreaterThan(0);
        expect(/\p{Extended_Pictographic}/u.test(s), `Emoji found in: "${s}"`).toBe(false);
        expect(s, `Tilde found in: "${s}"`).not.toContain('~');
        expect(s, `Exclamation mark found in: "${s}"`).not.toContain('!');
        const lower = s.toLowerCase();
        for (const token of banned) {
          expect(lower, `Banned token "${token}" in: "${s}"`).not.toContain(token);
        }
      }

      const petWarmRegex = /mrrr|předu|pohlazení|skutek|skutku|pomoc|pomůžeš|laskavost|klid|děkuji|tůně|den|svět|kousek/i;
      for (const w of MOLLY_PET_WHISPERS) {
        expect(w, `Pet whisper matches warm token: "${w}"`).toMatch(petWarmRegex);
        expect(w.length, `Whisper concise: "${w}"`).toBeLessThanOrEqual(95);
      }
    });
  });
});
