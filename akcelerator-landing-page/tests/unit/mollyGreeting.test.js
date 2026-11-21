import { describe, expect, it } from 'vitest';
import { getMollyGreeting } from '$lib/mollyTypes.js';

/** @param {number} hour */
const at = (hour) => getMollyGreeting(new Date(2026, 0, 15, hour, 30));

describe('getMollyGreeting: a calm greeting for every hour of the day', () => {
  it('follows the day: morning, day, evening, night', () => {
    expect(at(5)).toBe('Dobré ráno.');
    expect(at(9)).toBe('Dobré ráno.');
    expect(at(10)).toBe('Klidný den.');
    expect(at(17)).toBe('Klidný den.');
    expect(at(18)).toBe('Dobrý večer.');
    expect(at(22)).toBe('Dobrý večer.');
    expect(at(23)).toBe('Tichou noc.');
    expect(at(0)).toBe('Tichou noc.');
    expect(at(4)).toBe('Tichou noc.');
  });

  it('never shouts: every hour gives a short sentence without an exclamation mark', () => {
    for (let hour = 0; hour < 24; hour++) {
      const greeting = at(hour);
      expect(greeting.length, `hour ${hour}`).toBeGreaterThan(0);
      expect(greeting, `hour ${hour}`).not.toContain('!');
      expect(greeting.endsWith('.'), `hour ${hour}`).toBe(true);
    }
  });
});
