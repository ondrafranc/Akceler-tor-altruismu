import { describe, it, expect } from 'vitest';
import {
  VALUES,
  PORTALS,
  CZECH_CITIES,
  HOPE_FACTS,
  EVIDENCE_TIERS,
  EVIDENCE_METHODOLOGY
} from '$lib/data/czech-actions.js';
import { isValidLatLon, isCzLatLon, sanitizeHttpUrl } from '$lib/security.js';

describe('data integrity: VALUES', () => {
  it('contains expected categories with unique keys and required fields', () => {
    expect(VALUES.length).toBeGreaterThanOrEqual(6);

    const keys = new Set();
    for (const v of VALUES) {
      expect(v.key).toBeDefined();
      expect(typeof v.key).toBe('string');
      expect(keys.has(v.key)).toBe(false);
      keys.add(v.key);

      expect(typeof v.label).toBe('string');
      expect(v.label.length).toBeGreaterThan(0);
      expect(typeof v.shortLabel).toBe('string');
      expect(typeof v.desc).toBe('string');
      expect(Array.isArray(v.mapKinds)).toBe(true);
      expect(v.mapKinds.length).toBeGreaterThan(0);
    }

    expect(keys.has('community')).toBe(true);
    expect(keys.has('environment')).toBe(true);
    expect(keys.has('education')).toBe(true);
    expect(keys.has('health')).toBe(true);
    expect(keys.has('poverty')).toBe(true);
    expect(keys.has('animals')).toBe(true);
  });
});

describe('data integrity: PORTALS', () => {
  it('contains verified portals with valid URLs and descriptions', () => {
    expect(PORTALS.length).toBeGreaterThan(4);

    const ids = new Set();
    for (const portal of PORTALS) {
      expect(portal.id).toBeDefined();
      expect(ids.has(portal.id)).toBe(false);
      ids.add(portal.id);

      expect(typeof portal.title).toBe('string');
      expect(typeof portal.desc).toBe('string');
      expect(Array.isArray(portal.bullets)).toBe(true);
      expect(portal.bullets.length).toBeGreaterThan(0);

      // Verify URL is valid and HTTPS
      const sanitized = sanitizeHttpUrl(portal.url);
      expect(sanitized).not.toBeNull();
      expect(sanitized?.startsWith('https://')).toBe(true);
    }
  });
});

describe('data integrity: CZECH_CITIES', () => {
  it('covers Czech regional hubs with coordinates strictly in Czechia', () => {
    expect(CZECH_CITIES.length).toBeGreaterThanOrEqual(14);

    const ids = new Set();
    for (const city of CZECH_CITIES) {
      expect(city.id).toBeDefined();
      expect(ids.has(city.id)).toBe(false);
      ids.add(city.id);

      expect(typeof city.name).toBe('string');
      expect(typeof city.lat).toBe('number');
      expect(typeof city.lon).toBe('number');
      expect(typeof city.radius).toBe('number');
      expect(city.radius).toBeGreaterThan(0);

      // Must be valid WGS84 and within Czechia borders
      expect(isValidLatLon(city.lat, city.lon)).toBe(true);
      expect(isCzLatLon(city.lat, city.lon)).toBe(true);
    }

    // Verify key regional capitals are present
    const cityNames = CZECH_CITIES.map((c) => c.name);
    expect(cityNames).toContain('Praha');
    expect(cityNames).toContain('Brno');
    expect(cityNames).toContain('Ostrava');
    expect(cityNames).toContain('Plzeň');
  });
});

describe('data integrity: HOPE_FACTS', () => {
  it('provides verified hope facts with valid sources and non-empty stats', () => {
    expect(HOPE_FACTS.length).toBeGreaterThanOrEqual(4);

    const ids = new Set();
    for (const fact of HOPE_FACTS) {
      expect(fact.id).toBeDefined();
      expect(ids.has(fact.id)).toBe(false);
      ids.add(fact.id);

      expect(typeof fact.stat).toBe('string');
      expect(fact.stat.length).toBeGreaterThan(0);
      expect(typeof fact.title).toBe('string');
      expect(typeof fact.detail).toBe('string');
      expect(typeof fact.sourceLabel).toBe('string');
      expect(typeof fact.verifiedAt).toBe('string');
      expect(typeof fact.actionLabel).toBe('string');
      expect(typeof fact.actionHref).toBe('string');

      const sanitizedUrl = sanitizeHttpUrl(fact.sourceUrl);
      expect(sanitizedUrl).not.toBeNull();
      expect(sanitizedUrl?.startsWith('https://')).toBe(true);
    }
  });
});

describe('data integrity: EVIDENCE_TIERS & METHODOLOGY', () => {
  it('defines evidence tiers A, B, and C with descending evidence standards', () => {
    expect(EVIDENCE_TIERS).toBeDefined();
    expect(EVIDENCE_TIERS.A).toBeDefined();
    expect(EVIDENCE_TIERS.B).toBeDefined();
    expect(EVIDENCE_TIERS.C).toBeDefined();

    for (const tierCode of ['A', 'B', 'C']) {
      const tier = EVIDENCE_TIERS[tierCode];
      expect(tier.code).toBe(tierCode);
      expect(tier.tier).toBe(tierCode);
      expect(typeof tier.badge).toBe('string');
      expect(typeof tier.label).toBe('string');
      expect(typeof tier.desc).toBe('string');
    }

    expect(EVIDENCE_METHODOLOGY).toBeDefined();
    expect(typeof EVIDENCE_METHODOLOGY.principle).toBe('string');
    expect(EVIDENCE_METHODOLOGY.principle.length).toBeGreaterThan(20);
  });
});
