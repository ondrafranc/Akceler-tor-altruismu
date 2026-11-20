import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  mollyState,
  followMouse,
  toggleMollyFollowMouse,
  setMollyFollowMouse,
  toggleMollyPelisek,
  unlockMollyTreat,
  feedMolly,
  petMolly,
  notifyMollySpark,
  MOLLY_FOLLOW_MOUSE_KEY,
  MOLLY_STORAGE_KEY
} from '$lib/mollyStore.js';
import {
  MOLLY_TREAT_BY_FOOD,
  MOLLY_MILESTONES,
  MOLLY_ROUTE_GUIDES,
  MOLLY_PET_WHISPERS,
  MOLLY_UNEARNED_PET_WHISPERS,
  pluralPamlsek,
  describeNextMollyGift,
  getMollyGreeting
} from '$lib/mollyTypes.js';
import { safeGetItem, safeSetItem } from '$lib/storage/index.js';

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

  describe('Molly state transitions & delayed gratification integrity', () => {
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

    it('feedMolly honors delayed gratification: refuses treat if none available', () => {
      // Ensure availableTreats is 0
      mollyState.update((s) => ({ ...s, availableTreats: 0, earnedTreatQueue: [] }));

      const res = feedMolly('test_action');
      expect(res.success).toBe(false);
      expect(res.treat).toBeNull();
      expect(get(mollyState).mood).toBe('purring'); // petting fallback
    });

    it('unlockMollyTreat increments availableTreats and queue, enabling feedMolly', () => {
      mollyState.update((s) => ({ ...s, availableTreats: 0, earnedTreatQueue: [] }));

      const unlockRes = unlockMollyTreat({ id: 'good_deed_1', title: 'Pomoc sousedovi' });
      expect(unlockRes.unlocked).toBe(true);
      expect(unlockRes.treat).toBeDefined();

      const stateAfterUnlock = get(mollyState);
      expect(stateAfterUnlock.availableTreats).toBeGreaterThanOrEqual(1);

      const feedRes = feedMolly('good_deed_1');
      expect(feedRes.success).toBe(true);
      expect(feedRes.treat).toBeDefined();
      expect(get(mollyState).mood).toBe('eating');
    });

    it('notifyMollySpark triggers spark animation but NEVER inflates treat counts or gift deeds', () => {
      const beforeState = get(mollyState);
      const beforeTreatsTotal = beforeState.treatsFedTotal;
      const beforeGiftDeeds = beforeState.giftDeeds;
      const beforeAvailable = beforeState.availableTreats;

      const spark = notifyMollySpark({ id: 'spark_action' }, { surface: 'canvas' });
      expect(spark).toBeDefined();

      const afterState = get(mollyState);
      expect(afterState.treatsFedTotal).toBe(beforeTreatsTotal);
      expect(afterState.giftDeeds).toBe(beforeGiftDeeds);
      expect(afterState.availableTreats).toBe(beforeAvailable);
      expect(afterState.whisper?.icon).toBe('sparkles');
    });

    it('petMolly increments petCount and sets purring mood', () => {
      const beforeCount = get(mollyState).petCount;
      petMolly('Laskavé pohlazení');

      const afterState = get(mollyState);
      expect(afterState.petCount).toBe(beforeCount + 1);
      expect(afterState.mood).toBe('purring');
      expect(afterState.whisper?.text).toBe('Laskavé pohlazení');
    });
  });

  describe('M2 Molly Copy Quality, Czech Grammar & Tone Guardrails', () => {
    it('MOLLY_TREAT_BY_FOOD defines accusative nameAcc and feedMolly uses it after "za"', () => {
      for (const [foodKey, treat] of Object.entries(MOLLY_TREAT_BY_FOOD)) {
        expect(treat.name.length, `${foodKey} has name`).toBeGreaterThan(0);
        expect(treat.nameAcc?.length || 0, `${foodKey} has nameAcc`).toBeGreaterThan(0);

        mollyState.update((s) => ({
          ...s,
          availableTreats: 1,
          earnedTreatQueue: [{ ...treat }],
          giftDeeds: 0
        }));

        const res = feedMolly('grammar_test');
        expect(res.success).toBe(true);
        const text = get(mollyState).whisper?.text || '';
        expect(text.toLowerCase()).toContain('děkuji za');
        expect(text).toContain(treat.nameAcc);
        expect(text).not.toContain('za lososová granulka');
        expect(text).not.toContain('za křupavá hvězdička');
        expect(text).not.toContain('za teplé kočičí mlíčko v misce');
      }
    });

    it('milestone whispers use grammatical nominative phrasing ("mě teď zdobí")', () => {
      for (const m of MOLLY_MILESTONES) {
        mollyState.update((s) => ({
          ...s,
          availableTreats: 1,
          earnedTreatQueue: [{ ...MOLLY_TREAT_BY_FOOD.salmon }],
          giftDeeds: m.at - 1
        }));
        feedMolly('milestone_test');
        const text = get(mollyState).whisper?.text || '';
        expect(text).toContain(m.name);
        expect(text).toContain('mě teď zdobí');
        expect(text).not.toContain(`mám ${m.name}`);
      }
    });

    it('pluralPamlsek and describeNextMollyGift follow Czech declension and calm tone', () => {
      expect(pluralPamlsek(1)).toBe('pamlsek');
      expect(pluralPamlsek(2)).toBe('pamlsky');
      expect(pluralPamlsek(4)).toBe('pamlsky');
      expect(pluralPamlsek(5)).toBe('pamlsků');
      expect(pluralPamlsek(0)).toBe('pamlsků');

      const allDone = describeNextMollyGift(50);
      expect(allDone).not.toContain('!');
      expect(allDone.length).toBeGreaterThan(10);
    });

    it('all Molly copy has zero Unicode emoji, zero tildes, zero exclamation marks, and zero banned tokens', () => {
      const collected = [];
      collected.push(...MOLLY_PET_WHISPERS, ...MOLLY_UNEARNED_PET_WHISPERS);
      for (const guide of Object.values(MOLLY_ROUTE_GUIDES)) {
        collected.push(guide.hint, guide.nudge);
      }
      for (const treat of Object.values(MOLLY_TREAT_BY_FOOD)) {
        collected.push(treat.name, treat.nameAcc || '', treat.shortLabel);
      }
      for (const m of MOLLY_MILESTONES) {
        collected.push(m.name);
      }
      for (const h of [0, 7, 13, 20]) {
        collected.push(getMollyGreeting(new Date(2026, 0, 1, h)));
      }
      collected.push(describeNextMollyGift(0), describeNextMollyGift(3), describeNextMollyGift(50));

      // Runtime whispers
      mollyState.update((s) => ({ ...s, availableTreats: 0, earnedTreatQueue: [], giftDeeds: 0 }));
      feedMolly('runtime_0');
      collected.push(get(mollyState).whisper?.text || '');
      unlockMollyTreat({ id: 'runtime_unlock', title: 'Test' });
      collected.push(get(mollyState).whisper?.text || '');
      feedMolly('runtime_1');
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
        'mňamku',
        'zamlsám',
        'odemkla se dobrota',
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

      const unearnedWarmRegex = /mrrr|předu|pohlazení|skutek|skutku|pomoc|pomůžeš|laskavost|klid|děkuji/i;
      const petWarmRegex = /mrrr|předu|pohlazení|skutek|skutku|pomoc|pomůžeš|laskavost|klid|děkuji|tůně|den|svět|kousek/i;
      for (const w of MOLLY_UNEARNED_PET_WHISPERS) {
        expect(w, `Unearned whisper matches DG-3.1/EC-6 warm token: "${w}"`).toMatch(unearnedWarmRegex);
        expect(w.length, `Whisper concise: "${w}"`).toBeLessThanOrEqual(95);
      }
      for (const w of MOLLY_PET_WHISPERS) {
        expect(w, `Pet whisper matches warm token: "${w}"`).toMatch(petWarmRegex);
        expect(w.length, `Whisper concise: "${w}"`).toBeLessThanOrEqual(95);
      }
    });
  });
});
