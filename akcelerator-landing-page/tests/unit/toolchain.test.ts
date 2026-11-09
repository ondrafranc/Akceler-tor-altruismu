import { describe, it, expect } from 'vitest';
import * as Security from '$lib/security.js';
import * as Actions from '$lib/data/czech-actions.js';
import * as Utils from '$lib/utils.js';
import * as MollyTypes from '$lib/mollyTypes.js';
import * as ImpactFacts from '$lib/data/impactFacts.js';

describe('Toolchain & Environment Verification (Challenger Probe)', () => {
  it('runs within test environment and has expected Node globals', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(typeof process.cwd).toBe('function');
    expect(typeof Buffer).toBe('function');
    expect(typeof setTimeout).toBe('function');
    expect(typeof fetch).toBe('function');
  });

  it('correctly resolves $lib alias across diverse submodules', () => {
    expect(Security.safeText).toBeDefined();
    expect(Actions.VALUES).toBeDefined();
    expect(Utils.isInAppBrowser).toBeDefined();
    expect(MollyTypes.MOLLY_TREAT_BY_FOOD).toBeDefined();
    expect(ImpactFacts.CLICK_AND_FEED).toBeDefined();
  });

  it('empirically verifies current exports of czech-actions.js', () => {
    // 1. Static curated datasets
    expect(Array.isArray(Actions.VALUES)).toBe(true);
    expect(Array.isArray(Actions.PORTALS)).toBe(true);
    expect(Array.isArray(Actions.CZECH_CITIES)).toBe(true);
    expect(Array.isArray(Actions.HOPE_FACTS)).toBe(true);
    expect(Actions.EVIDENCE_TIERS).toBeDefined();
    expect(Actions.EVIDENCE_METHODOLOGY).toBeDefined();
    expect(Array.isArray(Actions.MICRO_ACTIONS)).toBe(true);
    expect(Array.isArray(Actions.CURATED_FALLBACK_PLACES)).toBe(true);
    expect(Array.isArray(Actions.LOCAL_COMMUNITY_ITEMS)).toBe(true);

    // 2. Business algorithm functions currently exported
    expect(typeof Actions.recommendActions).toBe('function');
    expect(typeof Actions.buildFirstContactTemplate).toBe('function');
    expect(typeof Actions.getRandomEncouragement).toBe('function');
  });

  it('probes recommendActions signature and return shape', () => {
    const recs = Actions.recommendActions({
      timeBucket: '15m',
      values: ['community']
    });
    expect(Array.isArray(recs)).toBe(true);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]).toHaveProperty('id');
    expect(recs[0]).toHaveProperty('title');
  });

  it('probes buildFirstContactTemplate actual return shape', () => {
    const mockPlace = Actions.CURATED_FALLBACK_PLACES[0];
    expect(mockPlace).toBeDefined();

    const template = Actions.buildFirstContactTemplate(mockPlace);
    expect(typeof template).toBe('object');
    expect(template).toHaveProperty('subject');
    expect(template).toHaveProperty('body');
    expect(typeof template.subject).toBe('string');
    expect(typeof template.body).toBe('string');
    expect(template.body.length).toBeGreaterThan(20);
  });
});
