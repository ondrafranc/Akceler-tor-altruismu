import { describe, it, expect } from 'vitest';
import {
  recommendActions,
  calculateMatchScore,
  hashSignature
} from '$lib/features/actions/services/recommendationEngine.js';
import { MICRO_ACTIONS } from '$lib/data/micro-actions.js';

describe('recommendationEngine: scoring & ranking algorithms', () => {
  it('returns all micro-actions ranked and scored descending by default', () => {
    const results = recommendActions();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(MICRO_ACTIONS.length);

    // Verify descending order
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }

    // Verify required properties attached to each result
    const top = results[0];
    expect(top).toHaveProperty('id');
    expect(top).toHaveProperty('title');
    expect(top).toHaveProperty('score');
    expect(top).toHaveProperty('description');
    expect(Array.isArray(top.reasons)).toBe(true);
    expect(top.reasons.length).toBeLessThanOrEqual(3);
  });

  it('prioritizes actions matching selected values', () => {
    const resultsAnimals = recommendActions({ values: ['animals'] });
    const topAnimals = resultsAnimals[0];
    expect(topAnimals.values).toContain('animals');
    expect(topAnimals.reasons).toContain('🎯 přesně pro vybrané téma');

    const resultsEnvironment = recommendActions({ values: ['environment'] });
    const topEnvironment = resultsEnvironment[0];
    expect(topEnvironment.values).toContain('environment');
    expect(topEnvironment.reasons).toContain('🎯 přesně pro vybrané téma');
  });

  it('boosts actions matching the requested time bucket', () => {
    const results5 = recommendActions({ timeBucket: '5' });
    expect(results5[0].timeBucket).toBe('5');
    expect(results5[0].reasons).toContain('⚡ do 5 minut');

    const results15 = recommendActions({ timeBucket: '15' });
    const top15 = results15.find((a) => a.timeBucket === '15');
    expect(top15).toBeDefined();
    expect(top15?.reasons).toContain('⏱️ klidných 10–15 minut');
  });

  it('penalizes financial donations when cost is free', () => {
    const freeResults = recommendActions({ cost: 'free' });
    const freeDonations = freeResults.filter((a) => a.cost === 'donation');

    const donationResults = recommendActions({ cost: 'donation' });
    const boostDonations = donationResults.filter((a) => a.cost === 'donation');

    expect(boostDonations[0].score).toBeGreaterThan(freeDonations[0].score);
  });

  it('respects environment modes (online vs. local vs. home)', () => {
    const online = recommendActions({ mode: 'online' });
    expect(online[0].mode === 'online' || online[0].mode === 'home').toBe(true);

    const local = recommendActions({ mode: 'local' });
    expect(local[0].mode).toBe('local');
    expect(local[0].reasons).toContain('🚶 venku mimo obrazovky');
  });

  it('penalizes completed and excluded actions', () => {
    const base = recommendActions();
    const firstId = base[0].id;

    const withCompleted = recommendActions({ completedIds: [firstId] });
    const penalizedItem = withCompleted.find((a) => a.id === firstId);

    expect(penalizedItem?.score).toBeLessThan(base[0].score);
  });

  it('supports positional arguments signature (capacity, situation, topic, city)', () => {
    const results = recommendActions('5', 'couch', 'animals', 'praha');
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(MICRO_ACTIONS.length);
    expect(results[0].values).toContain('animals');
  });

  it('calculateMatchScore evaluates a single action accurately', () => {
    const action = MICRO_ACTIONS[0];
    const match = calculateMatchScore(action, { values: action.values, timeBucket: action.timeBucket });

    expect(typeof match.score).toBe('number');
    expect(Array.isArray(match.reasons)).toBe(true);
    expect(match.score).toBeGreaterThan(0);

    // Handles null / undefined actions safely
    expect(calculateMatchScore(null).score).toBe(-999);
  });

  it('hashSignature produces deterministic float between 0 and 1', () => {
    const h1 = hashSignature('test-action::seed-123');
    const h2 = hashSignature('test-action::seed-123');
    const h3 = hashSignature('different-key');

    expect(h1).toBe(h2);
    expect(h1).toBeGreaterThanOrEqual(0);
    expect(h1).toBeLessThan(1);
    expect(h1).not.toBe(h3);
  });
});
