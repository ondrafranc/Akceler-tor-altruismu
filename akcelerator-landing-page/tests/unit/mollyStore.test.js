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
import { safeGetItem, safeSetItem } from '$lib/utils.js';

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
      expect(stateWithWhisper.whisper?.icon).toBe('🐾');
      expect(stateWithWhisper.whisper?.text).toContain('Půjdu s tebou');
      expect(safeGetItem(MOLLY_FOLLOW_MOUSE_KEY, 'local')).toBe('true');

      const secondToggle = toggleMollyFollowMouse();
      expect(secondToggle).toBe(false);
      expect(get(followMouse)).toBe(false);

      const stateSecond = get(mollyState);
      expect(stateSecond.followMouse).toBe(false);
      expect(stateSecond.whisper?.icon).toBe('🧺');
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
      expect(afterState.whisper?.icon).toBe('✨');
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
});
