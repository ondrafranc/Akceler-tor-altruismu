import { describe, it, expect } from 'vitest';

// Atomic imports
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
import { buildFirstContactTemplate } from '$lib/features/map/services/contactTemplates.js';
import {
  recommendActions,
  calculateMatchScore
} from '$lib/features/actions/services/recommendationEngine.js';

// Barrel re-exporter imports
import * as Barrel from '$lib/data/czech-actions.js';

// Sensory Engine barrel and modular imports
import * as SensoryBarrel from '$lib/sensoryEngine.js';
import {
  isSoundMuted,
  toggleSoundMuted,
  getAudioContext
} from '$lib/audio/audioContext.js';
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

describe('data modularization: barrel re-export identity equivalence', () => {
  it('re-exports atomic datasets identically from czech-actions.js', () => {
    expect(Barrel.VALUES).toBe(VALUES);
    expect(Barrel.PORTALS).toBe(PORTALS);
    expect(Barrel.CZECH_CITIES).toBe(CZECH_CITIES);
    expect(Barrel.HOPE_FACTS).toBe(HOPE_FACTS);
    expect(Barrel.EVIDENCE_TIERS).toBe(EVIDENCE_TIERS);
    expect(Barrel.EVIDENCE_METHODOLOGY).toBe(EVIDENCE_METHODOLOGY);
    expect(Barrel.MICRO_ACTIONS).toBe(MICRO_ACTIONS);
    expect(Barrel.CATALOG_LINKS_CHECKED_AT).toBe(CATALOG_LINKS_CHECKED_AT);
    expect(Barrel.REAL_STORIES).toBe(REAL_STORIES);
    expect(Barrel.ENCOURAGEMENT_MESSAGES).toBe(ENCOURAGEMENT_MESSAGES);
    expect(Barrel.getRandomEncouragement).toBe(getRandomEncouragement);
    expect(Barrel.CURATED_FALLBACK_PLACES).toBe(CURATED_FALLBACK_PLACES);
    expect(Barrel.LOCAL_COMMUNITY_ITEMS).toBe(LOCAL_COMMUNITY_ITEMS);
    expect(Barrel.recommendActions).toBe(recommendActions);
    expect(Barrel.calculateMatchScore).toBe(calculateMatchScore);
    expect(Barrel.buildFirstContactTemplate).toBe(buildFirstContactTemplate);
  });

  it('re-exports audio, core, and feature services identically from sensoryEngine.js', () => {
    // Audio
    expect(SensoryBarrel.isSoundMuted).toBe(isSoundMuted);
    expect(SensoryBarrel.toggleSoundMuted).toBe(toggleSoundMuted);
    expect(SensoryBarrel.getAudioContext).toBe(getAudioContext);
    expect(SensoryBarrel.tone).toBe(tone);
    expect(SensoryBarrel.noiseBurst).toBe(noiseBurst);
    expect(SensoryBarrel.playSanctuaryChime).toBe(playSanctuaryChime);
    expect(SensoryBarrel.playMollyPurr).toBe(playMollyPurr);
    expect(SensoryBarrel.playMollyCrunch).toBe(playMollyCrunch);
    expect(SensoryBarrel.playMollyMeow).toBe(playMollyMeow);
    expect(SensoryBarrel.playPayoffAsmr).toBe(playPayoffAsmr);

    // Core device
    expect(SensoryBarrel.prefersReducedMotion).toBe(prefersReducedMotion);
    expect(SensoryBarrel.isLowPowerDevice).toBe(isLowPowerDevice);
    expect(SensoryBarrel.getCanvasDprCap).toBe(getCanvasDprCap);
    expect(SensoryBarrel.optimizeCanvasContext).toBe(optimizeCanvasContext);
    expect(SensoryBarrel.frameStep).toBe(frameStep);
    expect(SensoryBarrel.ensureSharedOrientation).toBe(ensureSharedOrientation);
    expect(SensoryBarrel.getSharedOrientationGx).toBe(getSharedOrientationGx);

    // Feature services
    expect(SensoryBarrel.savePendingPartnerReturn).toBe(savePendingPartnerReturn);
    expect(SensoryBarrel.getPendingPartnerReturnRemainingMs).toBe(getPendingPartnerReturnRemainingMs);
    expect(SensoryBarrel.consumePendingPartnerReturn).toBe(consumePendingPartnerReturn);
    expect(SensoryBarrel.fetchAmbientPulse).toBe(fetchAmbientPulse);
    expect(SensoryBarrel.describeAmbientPulse).toBe(describeAmbientPulse);
  });
});

describe('contactTemplates: buildFirstContactTemplate', () => {
  it('generates customized email templates based on organization kind', () => {
    const animalPlace = { name: 'Útulek Libeň', kind: 'animals', email: 'utulek@liben.cz' };
    const tAnimal = buildFirstContactTemplate(animalPlace);
    expect(tAnimal.subject).toContain('Útulek Libeň');
    expect(tAnimal.body).toContain('venčení');
    expect(tAnimal.mailtoUrl).toContain('mailto:utulek@liben.cz');

    const foodPlace = { name: 'Potravinová banka', kind: 'food', email: 'info@pb.cz' };
    const tFood = buildFirstContactTemplate(foodPlace);
    expect(tFood.subject).toContain('Potravinová banka');
    expect(tFood.body).toContain('potraviny');

    const communityPlace = { name: 'Komunitní centrum', kind: 'community' };
    const tCommunity = buildFirstContactTemplate(communityPlace);
    expect(tCommunity.subject).toContain('Komunitní centrum');
    expect(tCommunity.mailtoUrl).toBeNull(); // No email provided
  });

  it('attaches user signature when userName or userContact is provided', () => {
    const place = { name: 'Charita', kind: 'ngo', email: 'charita@example.cz' };
    const template = buildFirstContactTemplate(place, 'Jan Novák', 'jan@novak.cz');
    expect(template.body).toContain('S pozdravem,\nJan Novák (jan@novak.cz)');
  });
});

describe('pulseService: describeAmbientPulse', () => {
  it('handles in-card and global views with live indicators', () => {
    const livePulse = { message: 'Někdo právě podpořil útulek v Brně', isLive: true, actionId: 'act-1' };

    const inCardMatching = describeAmbientPulse(livePulse, { inCard: true, actionId: 'act-1' });
    expect(inCardMatching).toBe('Někdo právě podpořil útulek v Brně');

    const inCardOther = describeAmbientPulse(livePulse, { inCard: true, actionId: 'act-2' });
    expect(inCardOther).toContain('Mezitím v komunitě:');

    const globalLive = describeAmbientPulse(livePulse);
    expect(globalLive).toContain('V komunitě:');

    expect(describeAmbientPulse(null)).toContain('Až skutek dokončíš');
  });
});

describe('deviceHeuristics: frameStep & low-power', () => {
  it('clamps frameStep properly', () => {
    expect(frameStep(16.667)).toBeCloseTo(1, 2);
    expect(frameStep(0)).toBe(1);
    expect(frameStep(-5)).toBe(1);
    expect(frameStep(100)).toBe(3); // Upper clamp
    expect(frameStep(2)).toBe(0.25); // Lower clamp
  });

  it('safely handles optimizeCanvasContext in non-DOM environment', () => {
    const fakeCtx = { shadowBlur: 15 };
    const optimized = optimizeCanvasContext(fakeCtx);
    expect(optimized).toBe(fakeCtx);
  });
});
