import { describe, it, expect } from 'vitest';

// 1. Direct atomic imports
import { VALUES } from '$lib/data/values.js';
import { PORTALS } from '$lib/data/portals.js';
import { CZECH_CITIES } from '$lib/data/cities.js';
import { HOPE_FACTS } from '$lib/data/hope-facts.js';
import { EVIDENCE_TIERS, EVIDENCE_METHODOLOGY } from '$lib/data/evidence.js';
import { MICRO_ACTIONS, CATALOG_LINKS_CHECKED_AT } from '$lib/data/micro-actions.js';
import { REAL_STORIES } from '$lib/data/stories.js';
import { ENCOURAGEMENT_MESSAGES, getRandomEncouragement } from '$lib/data/encouragements.js';
import { CURATED_FALLBACK_PLACES } from '$lib/data/fallback-places.js';
import { LOCAL_COMMUNITY_ITEMS } from '$lib/data/community-items.js';
import {
  recommendActions,
  calculateMatchScore,
  hashSignature
} from '$lib/features/actions/services/recommendationEngine.js';
import { buildFirstContactTemplate } from '$lib/features/map/services/contactTemplates.js';

// 2. Barrel imports
import * as CzechActionsBarrel from '$lib/data/czech-actions.js';
import * as SensoryEngineBarrel from '$lib/sensoryEngine.js';

// 3. Sensory modular components
import { isSoundMuted, toggleSoundMuted, getAudioContext } from '$lib/audio/audioContext.js';
import { tone, noiseBurst } from '$lib/audio/synthesizer.js';
import {
  playSanctuaryChime,
  playMollyPurr,
  playMollyCrunch,
  playMollyMeow,
  playPayoffAsmr
} from '$lib/audio/presets.js';
import {
  prefersReducedMotion,
  isLowPowerDevice,
  getCanvasDprCap,
  optimizeCanvasContext,
  frameStep,
  ensureSharedOrientation,
  getSharedOrientationGx
} from '$lib/core/device.js';
import {
  savePendingPartnerReturn,
  getPendingPartnerReturnRemainingMs,
  consumePendingPartnerReturn
} from '$lib/features/actions/services/partnerReturnService.js';
import {
  fetchAmbientPulse,
  describeAmbientPulse
} from '$lib/features/pulse/services/pulseService.js';

// 4. Security components
import {
  toFiniteNumber,
  sanitizeHttpUrl,
  checkRateLimit,
  safeText,
  isSubmissionTooFast
} from '$lib/security.js';

describe('CHALLENGER M2: Barrel Re-Export Strict Reference Identity (===)', () => {
  it('strictly preserves identical references for all czech-actions.js symbols', () => {
    expect(CzechActionsBarrel.VALUES).toBe(VALUES);
    expect(CzechActionsBarrel.PORTALS).toBe(PORTALS);
    expect(CzechActionsBarrel.CZECH_CITIES).toBe(CZECH_CITIES);
    expect(CzechActionsBarrel.HOPE_FACTS).toBe(HOPE_FACTS);
    expect(CzechActionsBarrel.EVIDENCE_TIERS).toBe(EVIDENCE_TIERS);
    expect(CzechActionsBarrel.EVIDENCE_METHODOLOGY).toBe(EVIDENCE_METHODOLOGY);
    expect(CzechActionsBarrel.MICRO_ACTIONS).toBe(MICRO_ACTIONS);
    expect(CzechActionsBarrel.CATALOG_LINKS_CHECKED_AT).toBe(CATALOG_LINKS_CHECKED_AT);
    expect(CzechActionsBarrel.REAL_STORIES).toBe(REAL_STORIES);
    expect(CzechActionsBarrel.ENCOURAGEMENT_MESSAGES).toBe(ENCOURAGEMENT_MESSAGES);
    expect(CzechActionsBarrel.getRandomEncouragement).toBe(getRandomEncouragement);
    expect(CzechActionsBarrel.CURATED_FALLBACK_PLACES).toBe(CURATED_FALLBACK_PLACES);
    expect(CzechActionsBarrel.LOCAL_COMMUNITY_ITEMS).toBe(LOCAL_COMMUNITY_ITEMS);
    expect(CzechActionsBarrel.recommendActions).toBe(recommendActions);
    expect(CzechActionsBarrel.calculateMatchScore).toBe(calculateMatchScore);
    expect(CzechActionsBarrel.buildFirstContactTemplate).toBe(buildFirstContactTemplate);
  });

  it('strictly preserves identical references for sensoryEngine.js modular services', () => {
    // Audio Context
    expect(SensoryEngineBarrel.isSoundMuted).toBe(isSoundMuted);
    expect(SensoryEngineBarrel.toggleSoundMuted).toBe(toggleSoundMuted);
    expect(SensoryEngineBarrel.getAudioContext).toBe(getAudioContext);

    // Audio Synthesizer
    expect(SensoryEngineBarrel.tone).toBe(tone);
    expect(SensoryEngineBarrel.noiseBurst).toBe(noiseBurst);

    // Audio Presets
    expect(SensoryEngineBarrel.playSanctuaryChime).toBe(playSanctuaryChime);
    expect(SensoryEngineBarrel.playMollyPurr).toBe(playMollyPurr);
    expect(SensoryEngineBarrel.playMollyCrunch).toBe(playMollyCrunch);
    expect(SensoryEngineBarrel.playMollyMeow).toBe(playMollyMeow);
    expect(SensoryEngineBarrel.playPayoffAsmr).toBe(playPayoffAsmr);

    // Core Device
    expect(SensoryEngineBarrel.prefersReducedMotion).toBe(prefersReducedMotion);
    expect(SensoryEngineBarrel.isLowPowerDevice).toBe(isLowPowerDevice);
    expect(SensoryEngineBarrel.getCanvasDprCap).toBe(getCanvasDprCap);
    expect(SensoryEngineBarrel.optimizeCanvasContext).toBe(optimizeCanvasContext);
    expect(SensoryEngineBarrel.frameStep).toBe(frameStep);
    expect(SensoryEngineBarrel.ensureSharedOrientation).toBe(ensureSharedOrientation);
    expect(SensoryEngineBarrel.getSharedOrientationGx).toBe(getSharedOrientationGx);

    // Feature Services
    expect(SensoryEngineBarrel.savePendingPartnerReturn).toBe(savePendingPartnerReturn);
    expect(SensoryEngineBarrel.getPendingPartnerReturnRemainingMs).toBe(getPendingPartnerReturnRemainingMs);
    expect(SensoryEngineBarrel.consumePendingPartnerReturn).toBe(consumePendingPartnerReturn);
    expect(SensoryEngineBarrel.fetchAmbientPulse).toBe(fetchAmbientPulse);
    expect(SensoryEngineBarrel.describeAmbientPulse).toBe(describeAmbientPulse);
  });
});

describe('CHALLENGER M2: Boundary Stress Testing of recommendActions', () => {
  it('handles negative, zero, and huge budget/cost configurations without throwing', () => {
    const negBudget = recommendActions({ cost: -100, budget: -500 });
    expect(Array.isArray(negBudget)).toBe(true);
    expect(negBudget.length).toBe(MICRO_ACTIONS.length);

    const hugeBudget = recommendActions({ cost: 1e9, budget: 1e12 });
    expect(Array.isArray(hugeBudget)).toBe(true);
    expect(hugeBudget.length).toBe(MICRO_ACTIONS.length);

    const freeBudget = recommendActions({ cost: 'free' });
    expect(Array.isArray(freeBudget)).toBe(true);
    expect(freeBudget.length).toBe(MICRO_ACTIONS.length);

    const donationBudget = recommendActions({ cost: 'donation' });
    expect(Array.isArray(donationBudget)).toBe(true);
    expect(donationBudget.length).toBe(MICRO_ACTIONS.length);
  });

  it('handles empty, non-array, and malformed value arrays safely', () => {
    // Empty array
    const emptyVals = recommendActions({ values: [] });
    expect(emptyVals.length).toBe(MICRO_ACTIONS.length);

    // SelectedValues alias empty array
    const emptySelected = recommendActions({ selectedValues: [] });
    expect(emptySelected.length).toBe(MICRO_ACTIONS.length);

    // Array containing null, undefined, numbers, empty strings, nonexistent values
    const dirtyVals = recommendActions({ values: [null, undefined, 42, '', 'fake_topic_xyz'] });
    expect(dirtyVals.length).toBe(MICRO_ACTIONS.length);

    // Non-array values (boolean, object, string, number)
    const boolVals = recommendActions({ values: true });
    expect(boolVals.length).toBe(MICRO_ACTIONS.length);

    const objVals = recommendActions({ values: { animals: true } });
    expect(objVals.length).toBe(MICRO_ACTIONS.length);

    const strVals = recommendActions({ values: 'animals' });
    expect(strVals.length).toBe(MICRO_ACTIONS.length);
  });

  it('handles invalid filter string tokens gracefully (falls back without error)', () => {
    const invalidOptions = recommendActions({
      timeBucket: 'infinite_time',
      mode: 'subterranean',
      cost: 'millions',
      social: 'hivemind',
      commitment: 'generational',
      contactLevel: 'astral_projection',
      recipientMacro: 'extraterrestrial',
      evidenceTier: 'Z_MINUS'
    });

    expect(invalidOptions.length).toBe(MICRO_ACTIONS.length);
    // Every action must have numeric score and reasons array
    for (const action of invalidOptions) {
      expect(typeof action.score).toBe('number');
      expect(Number.isFinite(action.score)).toBe(true);
      expect(Array.isArray(action.reasons)).toBe(true);
      expect(action.reasons.length).toBeLessThanOrEqual(3);
    }
  });

  it('handles undefined, null, and primitive arguments safely', () => {
    expect(recommendActions(undefined).length).toBe(MICRO_ACTIONS.length);
    expect(recommendActions(null).length).toBe(MICRO_ACTIONS.length);
    expect(recommendActions(42).length).toBe(MICRO_ACTIONS.length);
    expect(recommendActions('invalid_str').length).toBe(MICRO_ACTIONS.length);
    expect(recommendActions(true).length).toBe(MICRO_ACTIONS.length);
    expect(recommendActions(() => {}).length).toBe(MICRO_ACTIONS.length);
  });

  it('handles malformed positional arguments safely', () => {
    const pos1 = recommendActions(undefined, undefined, undefined, undefined);
    expect(pos1.length).toBe(MICRO_ACTIONS.length);

    const pos2 = recommendActions('', '', '', '');
    expect(pos2.length).toBe(MICRO_ACTIONS.length);

    const pos3 = recommendActions('45', 'unknown_sit', 'unknown_topic', 'unknown_city');
    expect(pos3.length).toBe(MICRO_ACTIONS.length);

    const pos4 = recommendActions('2', 'couch', 'all', null);
    expect(pos4.length).toBe(MICRO_ACTIONS.length);
  });

  it('does NOT mutate the underlying MICRO_ACTIONS catalog', () => {
    const snapshotBefore = JSON.stringify(MICRO_ACTIONS[0]);
    recommendActions({ values: ['animals'], timeBucket: '5' });
    const snapshotAfter = JSON.stringify(MICRO_ACTIONS[0]);

    expect(snapshotAfter).toBe(snapshotBefore);
    expect(MICRO_ACTIONS[0]).not.toHaveProperty('score');
  });

  it('resists prototype poisoning attacks in prefs object', () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}, "values": ["animals"]}');
    const res = recommendActions(malicious);
    expect(res.length).toBe(MICRO_ACTIONS.length);
    expect(Object.prototype.polluted).toBeUndefined();
  });
});

describe('CHALLENGER M2: Boundary Stress Testing of calculateMatchScore', () => {
  it('handles null, undefined, and empty action inputs safely', () => {
    expect(calculateMatchScore(null)).toEqual({ score: -999, reasons: [] });
    expect(calculateMatchScore(undefined)).toEqual({ score: -999, reasons: [] });
    expect(calculateMatchScore('')).toEqual({ score: -999, reasons: [] });
    expect(calculateMatchScore(0)).toEqual({ score: -999, reasons: [] });

    const emptyActionScore = calculateMatchScore({});
    expect(typeof emptyActionScore.score).toBe('number');
    expect(Number.isFinite(emptyActionScore.score)).toBe(true);
    expect(Array.isArray(emptyActionScore.reasons)).toBe(true);
  });

  it('handles action with missing or corrupted fields', () => {
    const corruptAction = {
      id: 'corrupt_1',
      values: 'not_an_array',
      timeBucket: 12345,
      mode: null,
      cost: undefined,
      social: {},
      commitment: [],
      contactLevel: false
    };

    const res = calculateMatchScore(corruptAction, { values: ['animals'] });
    expect(typeof res.score).toBe('number');
    expect(Number.isFinite(res.score)).toBe(true);
    expect(Array.isArray(res.reasons)).toBe(true);
  });
});

describe('CHALLENGER M2: Security Edge Case Hardening Verification', () => {
  it('strictly rejects non-numeric non-primitive types in toFiniteNumber', () => {
    expect(toFiniteNumber([])).toBeNull();
    expect(toFiniteNumber([42])).toBeNull();
    expect(toFiniteNumber(false)).toBeNull();
    expect(toFiniteNumber(true)).toBeNull();
    expect(toFiniteNumber('   ')).toBeNull();
    expect(toFiniteNumber('\t\r\n')).toBeNull();
    expect(toFiniteNumber(new Date())).toBeNull();
    expect(toFiniteNumber({})).toBeNull();
    expect(toFiniteNumber(NaN)).toBeNull();
    expect(toFiniteNumber(Infinity)).toBeNull();
    expect(toFiniteNumber(-Infinity)).toBeNull();

    // Valid inputs must pass
    expect(toFiniteNumber(0)).toBe(0);
    expect(toFiniteNumber(-0)).toBe(-0);
    expect(toFiniteNumber('0')).toBe(0);
    expect(toFiniteNumber('42')).toBe(42);
    expect(toFiniteNumber('  -15.75  ')).toBe(-15.75);
    expect(toFiniteNumber('1e4')).toBe(10000);
    expect(toFiniteNumber('0x10')).toBe(16);
  });

  it('strictly rejects malformed dot-only and empty-label hostnames in sanitizeHttpUrl', () => {
    expect(sanitizeHttpUrl('https://.com')).toBeNull();
    expect(sanitizeHttpUrl('https://.')).toBeNull();
    expect(sanitizeHttpUrl('https://..')).toBeNull();
    expect(sanitizeHttpUrl('https://...')).toBeNull();
    expect(sanitizeHttpUrl('https://example..com')).toBeNull();
    expect(sanitizeHttpUrl('https://example.com.')).toBeNull();
    expect(sanitizeHttpUrl('https://.example.com')).toBeNull();
    expect(sanitizeHttpUrl('https://a..b.com')).toBeNull();

    // Valid URLs must pass
    expect(sanitizeHttpUrl('https://darujme.cz')).toBe('https://darujme.cz/');
    expect(sanitizeHttpUrl('http://localhost:5173')).toBe('http://localhost:5173/');
    expect(sanitizeHttpUrl('https://sub.domain.example.cz/path?q=1')).toBe('https://sub.domain.example.cz/path?q=1');
  });

  it('strictly enforces immediate rejection on zero and negative rate limits in checkRateLimit', () => {
    const b0 = 'zero_lim_' + Math.random().toString(36).slice(2);
    const r0 = checkRateLimit(b0, 'client_1', 0, 10000);
    expect(r0.allowed).toBe(false);
    expect(r0.retryAfterSec).toBeGreaterThanOrEqual(1);

    const bNeg = 'neg_lim_' + Math.random().toString(36).slice(2);
    const rNeg = checkRateLimit(bNeg, 'client_1', -1, 10000);
    expect(rNeg.allowed).toBe(false);
    expect(rNeg.retryAfterSec).toBeGreaterThanOrEqual(1);
  });

  it('prevents bucket/clientId key collision using ASCII unit separator', () => {
    // Attack scenario: bucket="foo:bar", client="baz" vs bucket="foo", client="bar:baz"
    const pfx = 'sep_' + Math.random().toString(36).slice(2);
    const bucketA = `${pfx}_foo:bar`;
    const clientA = 'baz';
    const bucketB = `${pfx}_foo`;
    const clientB = 'bar:baz';

    // 1 allowed request per key
    const resA1 = checkRateLimit(bucketA, clientA, 1, 10000);
    expect(resA1.allowed).toBe(true);

    // If there is key collision, resB1 would see count=1 and be rejected
    const resB1 = checkRateLimit(bucketB, clientB, 1, 10000);
    expect(resB1.allowed).toBe(true);

    // Subsequent calls to A and B must both be rejected (exhausted their own quota)
    expect(checkRateLimit(bucketA, clientA, 1, 10000).allowed).toBe(false);
    expect(checkRateLimit(bucketB, clientB, 1, 10000).allowed).toBe(false);
  });
});
