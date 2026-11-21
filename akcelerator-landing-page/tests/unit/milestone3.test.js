import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';

import {
  playCelebrationChord
} from '../../src/lib/audio/presets.js';
import {
  savePendingPartnerReturn,
  readPendingPartnerRecord,
  getPendingPartnerReturnRemainingMs,
  consumePendingPartnerReturn,
  checkImmediatePartnerReturn
} from '../../src/lib/features/actions/services/partnerReturnService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcLib = path.resolve(__dirname, '../../src/lib');

/** @param {string} subpath */
function loadSource(subpath) {
  const fullPath = path.resolve(srcLib, subpath);
  return readFileSync(fullPath, 'utf8');
}

describe('Milestone 3: In-Situ Reward, Swipe Deck & Session Closure', () => {
  describe('1. In-Situ Audio Synthesis & Celebration Engine', () => {
    it('playCelebrationChord is exported directly from presets', () => {
      expect(typeof playCelebrationChord).toBe('function');
    });

    it('playCelebrationChord runs safely without exceptions and without external network audio downloads', () => {
      expect(() => playCelebrationChord()).not.toThrow();
    });

    it('checkImmediatePartnerReturn and partnerReturnService eliminate the artificial 3000ms delay', () => {
      expect(typeof checkImmediatePartnerReturn).toBe('function');

      // Remaining ms should be 0 by default (no artificial 3000ms delay)
      expect(getPendingPartnerReturnRemainingMs(0)).toBe(0);

      // Save a pending partner visit
      savePendingPartnerReturn({ id: 'click-and-feed', title: 'Click and Feed' });

      // Immediate check should consume without waiting 3000ms
      const immediate = checkImmediatePartnerReturn();
      expect(immediate).toBeDefined();
      expect(immediate?.id).toBe('click-and-feed');
      expect(immediate?.consumed).toBe(true);

      // Once consumed, subsequent checks return null
      expect(checkImmediatePartnerReturn()).toBeNull();
    });
  });

  describe('2. Micro-Deed SwipeDeck Component', () => {
    it('SwipeDeck.svelte compiles cleanly with Svelte compiler', () => {
      const source = loadSource('features/actions/components/SwipeDeck.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();
    });

    it('SwipeDeck.svelte supports horizontal touch gestures with touch-action: pan-y', () => {
      const source = loadSource('features/actions/components/SwipeDeck.svelte');
      expect(source).toContain('touch-action: pan-y');
      expect(source).toContain('onpointerdown');
      expect(source).toContain('onpointermove');
      expect(source).toContain('onpointerup');
      expect(source).toContain('rotate');
      expect(source).toContain('Svět je díky tobě');
      expect(source).not.toContain('Udělal/a');
    });

    it('SwipeDeck.svelte includes 44x44px accessible previous and next buttons', () => {
      const source = loadSource('features/actions/components/SwipeDeck.svelte');
      expect(source).toContain('deck-nav-btn');
      expect(source).toContain('deck-nav-prev');
      expect(source).toContain('deck-nav-next');
      expect(source).toContain('min-width: 44px');
      expect(source).toContain('min-height: 44px');
      expect(source).toContain('aria-label="Předchozí doporučený skutek"');
      expect(source).toContain('aria-label="Další doporučený skutek"');
    });

    it('SwipeDeck.svelte includes psychological session closure ("Pro dnešek hotovo")', () => {
      const source = loadSource('features/actions/components/SwipeDeck.svelte');
      expect(source).toContain('session-closed-card');
      expect(source).toContain('Pro dnešek máš hotovo.');
      expect(source).toContain('closed-stats-pill');
      expect(source).toContain('closed-btn-reopen');
      expect(source).toContain('aa_done_for_today_');
    });
  });

  describe('3. ActionCard In-Situ Reward & North Star Compliance', () => {
    it('ActionCard.svelte compiles cleanly with Svelte compiler', () => {
      const source = loadSource('features/actions/components/ActionCard.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();
    });

    it('ActionCard.svelte provides in-situ celebration without forced redirection to /svet', () => {
      const source = loadSource('features/actions/components/ActionCard.svelte');
      // In-situ reward markup present
      expect(source).toContain('in-situ-celebration');
      expect(source).toContain('Skvělá práce!');
      expect(source).toContain('in-situ-affirmation');
      expect(source).toContain('btn-session-close');

      // No forced redirect links to /svet from celebration
      expect(source).not.toContain('class="return-dopamine-btn btn-world"');
      expect(source).not.toContain('Rozsvítit tenhle skutek v Krajině');

      // No references to Molly cat treats
      expect(source).not.toContain('lososová granulka');
      expect(source).not.toContain('Molly ti děkuje');
    });

    it('ActionCard.svelte interactive celebration buttons meet 44x44px touch targets', () => {
      const source = loadSource('features/actions/components/ActionCard.svelte');
      expect(source).toContain('.return-dopamine-btn');
      expect(source).toContain('min-height: 44px');
      expect(source).toContain('min-width: 44px');
    });
  });

  describe('4. Dynamic Imports for Heavy Bundles', () => {
    it('/svet route does not statically import storyCard.js', () => {
      const svetPath = path.resolve(__dirname, '../../src/routes/svet/+page.svelte');
      const source = readFileSync(svetPath, 'utf8');
      expect(source).not.toContain('import { renderStoryCardPng } from "../../lib/storyCard.js";');
      expect(source).not.toContain("from '../../lib/storyCard.js'");
    });

    it('ProgressDashboard.svelte uses dynamic import for storyCard.js', () => {
      const source = loadSource('features/sanctuary/components/ProgressDashboard.svelte');
      expect(source).toContain("await import('../../../storyCard.js')");
      expect(source).not.toContain("import { renderStoryCardPng } from '../../../storyCard.js';");
    });

    it('near/+page.svelte dynamically imports leaflet.css on demand', () => {
      const nearPath = path.resolve(__dirname, '../../src/routes/near/+page.svelte');
      const source = readFileSync(nearPath, 'utf8');
      expect(source).toContain("await import('leaflet/dist/leaflet.css')");
      expect(source).not.toMatch(/^import\s+['"]leaflet\/dist\/leaflet\.css['"]/m);
    });
  });

  describe('5. Heavy Canvas Modularization & Invariant Guards', () => {
    it('mollyCatRenderer exports drawMollyCat with robust null guards', async () => {
      const { drawMollyCat } = await import('../../src/lib/molly/mollyCatRenderer.js');
      expect(typeof drawMollyCat).toBe('function');

      // Null context guard
      expect(() => drawMollyCat(null, 110, 96, 0, null)).not.toThrow();

      // Null state guard
      const mockCtx = /** @type {CanvasRenderingContext2D} */ (/** @type {unknown} */ ({
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        beginPath: vi.fn(),
        ellipse: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        quadraticCurveTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        closePath: vi.fn(),
        clip: vi.fn(),
        fillRect: vi.fn()
      }));
      expect(() => drawMollyCat(mockCtx, 110, 96, 0, null)).not.toThrow();

      // Normal execution with state
      const mockState = {
        vx: 0,
        vy: 0,
        behavior: 'IDLE_SIT',
        eatTimer: 0,
        petBlissTimer: 0,
        currentState: { mode: 'roaming', mood: 'curious' },
        facing: 1,
        walkCycle: 0,
        flyingTreat: null,
        pouncePhase: 0,
        groomPhase: 0,
        accessories: { collar: true, bell: true, flower: true, star: true },
        pointerX: 100,
        pointerY: 100,
        posX: 50,
        posY: 50,
        blinkProgress: 0,
        firefly: null,
        hearts: [{ x: 10, y: 10, vx: 0, vy: -1, alpha: 0.8, scale: 1, color: '#f59e0b' }],
        frameK: 1,
        isFollowingMouse: false
      };
      expect(() => drawMollyCat(mockCtx, 110, 96, 1.5, mockState)).not.toThrow();
      expect(mockCtx.clearRect).toHaveBeenCalled();
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();

      const rendererSource = readFileSync(path.resolve(__dirname, '../../src/lib/molly/mollyCatRenderer.js'), 'utf8');
      expect(rendererSource).not.toContain('stardust');
      expect(rendererSource).not.toContain('4-point diamond star sparkle');
    });

    it('MollyCompanion.svelte does not contain duplicate drawMollyCat and actively calls renderProceduralMollyCat', () => {
      const source = readFileSync(path.resolve(__dirname, '../../src/components/MollyCompanion.svelte'), 'utf8');
      expect(source).not.toContain('function drawMollyCat(');
      expect(source).not.toContain('molly-chased-star');
      expect(source).not.toContain('stardust');
      expect(source).toContain("import { drawMollyCat as renderProceduralMollyCat } from '$lib/molly/mollyCatRenderer.js';");
      expect(source).toContain('renderProceduralMollyCat(catCtx, LOGICAL_W, LOGICAL_H, nowSec, {');
    });

    it('sanctuaryLakeRenderer functions safely handle null context without throwing', async () => {
      const lakeRenderer = await import('../../src/lib/features/sanctuary/services/sanctuaryLakeRenderer.js');
      expect(() => lakeRenderer.drawLakeMist(null, null)).not.toThrow();
      expect(() => lakeRenderer.drawBreathingPondAura(null, null)).not.toThrow();
      expect(() => lakeRenderer.drawStarLakeReflection(null, null)).not.toThrow();
      expect(() => lakeRenderer.drawWaterRipples(null, null)).not.toThrow();
      expect(() => lakeRenderer.drawLanternWaterReflection(null, null)).not.toThrow();

      // Also safely handle null params
      const mockCtx = /** @type {CanvasRenderingContext2D} */ (/** @type {unknown} */ ({ save: vi.fn(), restore: vi.fn() }));
      expect(() => lakeRenderer.drawLakeMist(mockCtx, null)).not.toThrow();
      expect(() => lakeRenderer.drawBreathingPondAura(mockCtx, null)).not.toThrow();
      expect(() => lakeRenderer.drawStarLakeReflection(mockCtx, null)).not.toThrow();
      expect(() => lakeRenderer.drawWaterRipples(mockCtx, null)).not.toThrow();
      expect(() => lakeRenderer.drawLanternWaterReflection(mockCtx, null)).not.toThrow();
    });

    it('src/lib/sensory/index.js forwarder barrel does not exist', async () => {
      const { existsSync } = await import('node:fs');
      const barrelPath = path.resolve(__dirname, '../../src/lib/sensory/index.js');
      expect(existsSync(barrelPath)).toBe(false);
    });

    it('M3 dead exports and unused CSS are removed and SwipeDeck uses local calendar date', () => {
      const progressSrc = readFileSync(path.resolve(__dirname, '../../src/lib/progress.js'), 'utf8');
      expect(progressSrc).not.toContain('WORLD_MILESTONES');
      expect(progressSrc).not.toContain('worldHealPercent');
      expect(progressSrc).not.toContain('recordSanctuaryWish');

      const holdSparkSrc = readFileSync(path.resolve(__dirname, '../../src/lib/sensory/interaction/holdSpark.js'), 'utf8');
      expect(holdSparkSrc).not.toContain('globalSparkCharge');

      const themeCss = readFileSync(path.resolve(__dirname, '../../src/styles/czech-theme.css'), 'utf8');
      expect(themeCss).not.toContain('.subpage-hero');

      const swipeDeckSrc = loadSource('features/actions/components/SwipeDeck.svelte');
      expect(swipeDeckSrc).not.toContain('toISOString().slice(0, 10)');
      expect(swipeDeckSrc).toContain('todayCompletedCount');
    });
  });
});
