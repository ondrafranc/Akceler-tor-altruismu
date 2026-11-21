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
import {
  buildFirstContactTemplate,
  getPlaceActionHint
} from '$lib/features/map/services/contactTemplates.js';
import {
  recommendActions,
  calculateMatchScore
} from '$lib/features/actions/services/recommendationEngine.js';

// Barrel re-exporter imports
import * as Barrel from '$lib/data/czech-actions.js';

// Modular sensory and audio imports
import {
  isSoundMuted,
  toggleSoundMuted,
  getAudioContext
} from '$lib/audio/audioContext.js';
import { tone, noiseBurst } from '$lib/audio/synthesizer.js';
import {
  playSanctuaryChime,
  playMollyPurr,
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

  it('exports audio, core, and feature services directly from canonical modules', () => {
    // Audio
    expect(typeof isSoundMuted).toBe('function');
    expect(typeof toggleSoundMuted).toBe('function');
    expect(typeof getAudioContext).toBe('function');
    expect(typeof tone).toBe('function');
    expect(typeof noiseBurst).toBe('function');
    expect(typeof playSanctuaryChime).toBe('function');
    expect(typeof playMollyPurr).toBe('function');
    expect(typeof playMollyMeow).toBe('function');
    expect(typeof playPayoffAsmr).toBe('function');

    // Core device
    expect(typeof prefersReducedMotion).toBe('function');
    expect(typeof isLowPowerDevice).toBe('function');
    expect(typeof getCanvasDprCap).toBe('function');
    expect(typeof optimizeCanvasContext).toBe('function');
    expect(typeof frameStep).toBe('function');
    expect(typeof ensureSharedOrientation).toBe('function');
    expect(typeof getSharedOrientationGx).toBe('function');

    // Feature services
    expect(typeof savePendingPartnerReturn).toBe('function');
    expect(typeof getPendingPartnerReturnRemainingMs).toBe('function');
    expect(typeof consumePendingPartnerReturn).toBe('function');
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

  it('uses natural gender-neutral Czech without /a slashes across all kinds', () => {
    const kinds = ['animals', 'food', 'community', 'ngo'];
    for (const kind of kinds) {
      const tpl = buildFirstContactTemplate({ name: 'Spolek Test', kind, email: 'test@example.cz' });
      expect(tpl.body).not.toMatch(/\p{L}\/a\b/u);
      expect(tpl.body).not.toMatch(/\b(narazil|podpořil|zeptal|mohl)\b/i);
    }
  });

  it('falls back to "vaše organizace" when place.name is whitespace-only', () => {
    const tpl = buildFirstContactTemplate({ name: '   ', kind: 'ngo' });
    expect(tpl.subject).toContain('vaše organizace');
    expect(tpl.body).toContain('(vaše organizace)');
    expect(tpl.body).not.toContain('()');
  });

  it('getPlaceActionHint and buildFirstContactTemplate avoid dog-walking advice for cat-only shelters while keeping it for dog/mixed shelters', () => {
    const catPlace = {
      name: 'Kočičí depozitum Mňau',
      kind: 'animals',
      subcategory: 'Útulek pro kočky'
    };
    const catHint = getPlaceActionHint(catPlace);
    expect(catHint).toContain('konzervy');
    expect(catHint).not.toMatch(/venčen/i);

    const catTemplate = buildFirstContactTemplate(catPlace);
    expect(catTemplate.body).toContain('konzervy');
    expect(catTemplate.body).not.toMatch(/venčen/i);

    const mixedTemplate = buildFirstContactTemplate({
      name: 'Útulek pro psy a kočky Azyl',
      kind: 'animals',
      subcategory: 'Útulek'
    });
    expect(mixedTemplate.body).toContain('venčení');

    const ngoHint = getPlaceActionHint({ name: 'Spolek Pomoc', kind: 'ngo' });
    expect(ngoHint).not.toContain('tlačítko „Co napsat“');
  });

  it('handles Czech cat/dog word boundaries accurately without substring false positives or negatives', () => {
    const catOnlyCases = [
      {
        name: 'Kočičí depozitum Smíchov',
        kind: 'animals',
        subcategory: 'Útulek pro kočky',
        description: 'Sbírka na kočičí kapsičky a stelivo.'
      },
      {
        name: 'Kočičí depozitum Podolí',
        kind: 'animals',
        subcategory: 'Útulek pro kočky',
        description: 'Před návštěvou prosíme psát e-mail nebo SMS a domluvit si psaní zprávy předem.'
      },
      {
        name: 'Kočičí útulek Pustá Polom',
        kind: 'animals',
        subcategory: 'Útulek'
      },
      {
        name: 'Kočičí azyl Pestrý svět',
        kind: 'animals',
        subcategory: 'Depozitum'
      },
      {
        name: 'Kocouří spolek',
        kind: 'animals',
        subcategory: 'Depozitum pro kotě i kocoury'
      }
    ];

    for (const place of catOnlyCases) {
      const hint = getPlaceActionHint(place);
      const tpl = buildFirstContactTemplate(place);
      expect(hint, `${place.name} hint`).toContain('konzervy');
      expect(hint, `${place.name} hint`).not.toMatch(/venčen/i);
      expect(tpl.body, `${place.name} body`).toContain('konzervy');
      expect(tpl.body, `${place.name} body`).not.toMatch(/venčen/i);
    }

    const dogOrGeneralCases = [
      {
        name: 'Útulek pro zvířata — oprava kotců',
        kind: 'animals',
        subcategory: 'Útulek'
      },
      {
        name: 'Zvířecí azyl Kotlina',
        kind: 'animals',
        subcategory: 'Útulek'
      },
      {
        name: 'Útulek Maskot',
        kind: 'animals',
        subcategory: 'Útulek'
      },
      {
        name: 'Azyl pro opuštěná zvířata — nové kotce',
        kind: 'animals',
        subcategory: 'Útulek',
        description: 'Výměna kotců pro psy a další zvířata v kotci.'
      },
      {
        name: 'Útulek pro koťata a štěňata',
        kind: 'animals',
        subcategory: 'Útulek'
      },
      {
        name: 'Kočky a pejsci v nouzi',
        kind: 'animals',
        subcategory: 'Útulek'
      },
      {
        name: 'Azyl pro kočky a fenky',
        kind: 'animals',
        subcategory: 'Útulek'
      }
    ];

    for (const place of dogOrGeneralCases) {
      const hint = getPlaceActionHint(place);
      const tpl = buildFirstContactTemplate(place);
      expect(hint, `${place.name} hint`).toContain('venčení');
      expect(tpl.body, `${place.name} body`).toContain('venčení');
    }

    // Verify all CURATED_FALLBACK_PLACES animal shelters keep expected classification
    const catOnlyCuratedIds = new Set(['curated:praha-utulek-mecholupy', 'curated:praha-psoz-kocky']);
    for (const place of CURATED_FALLBACK_PLACES.filter((p) => p.kind === 'animals')) {
      const tpl = buildFirstContactTemplate(place);
      if (catOnlyCuratedIds.has(place.id)) {
        expect(tpl.body, place.id).not.toMatch(/venčen/i);
      } else {
        expect(tpl.body, place.id).toContain('venčení');
      }
    }
  });

  it('trims userName and userContact and omits signature when both are whitespace-only', () => {
    const place = { name: 'Spolek', kind: 'ngo' };
    const blankTpl = buildFirstContactTemplate(place, '   ', ' \t ');
    expect(blankTpl.body).not.toContain('S pozdravem');

    const paddedBoth = buildFirstContactTemplate(place, '  Jana  ', ' jana@spolek.cz ');
    expect(paddedBoth.body).toMatch(/\n\nS pozdravem,\nJana \(jana@spolek\.cz\)$/);

    const paddedNameOnly = buildFirstContactTemplate(place, '  Jana  ', '   ');
    expect(paddedNameOnly.body).toMatch(/\n\nS pozdravem,\nJana$/);

    const paddedContactOnly = buildFirstContactTemplate(place, '   ', ' jana@spolek.cz ');
    expect(paddedContactOnly.body).toMatch(/\n\nS pozdravem,\n\(jana@spolek\.cz\)$/);
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
