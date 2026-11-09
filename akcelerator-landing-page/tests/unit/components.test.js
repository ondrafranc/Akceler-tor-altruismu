import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcLib = path.resolve(__dirname, '../../src/lib');

function loadComponentSource(subpath) {
  const fullPath = path.resolve(srcLib, subpath);
  return readFileSync(fullPath, 'utf8');
}

describe('Milestone 3: Extracted Feature Components & UI Primitives', () => {
  describe('Actions Feature Components (src/lib/features/actions/components/)', () => {
    it('EvidenceBadge.svelte compiles and contains required tier styling', () => {
      const source = loadComponentSource('features/actions/components/EvidenceBadge.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('evidence-pill');
      expect(source).toContain('tier-A');
      expect(source).toContain('tier-B');
      expect(source).toContain('tier-C');
    });

    it('HoldSparkButton.svelte compiles and preserves critical classes', () => {
      const source = loadComponentSource('features/actions/components/HoldSparkButton.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('btn-studio-primary');
      expect(source).toContain('startHoldSpark');
    });

    it('PartnerReturnModal.svelte compiles and handles return loop', () => {
      const source = loadComponentSource('features/actions/components/PartnerReturnModal.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('impact-payoff-canvas');
      expect(source).toContain('data-surface');
      expect(source).toContain('return-dopamine-strip');
    });

    it('ActionCard.svelte compiles and preserves critical CSS classes', () => {
      const source = loadComponentSource('features/actions/components/ActionCard.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('action-card');
      expect(source).toContain('instant-body');
      expect(source).toContain('action-title');
      expect(source).toContain('card-effect-stage');
      expect(source).toContain('impact-payoff-canvas');
      expect(source).not.toContain('max-width: 320px;');
    });
  });

  describe('Home Feature Components (src/lib/features/home/)', () => {
    it('HeroSection.svelte compiles and contains hero stage and aurora', () => {
      const source = loadComponentSource('features/home/HeroSection.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('hero-stage');
      expect(source).toContain('hero-aurora');
      expect(source).toContain('hero-title');
    });

    it('PathwaysBento.svelte compiles and preserves bento-card selectors', () => {
      const source = loadComponentSource('features/home/PathwaysBento.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('bento-card');
      expect(source).toContain('/near');
      expect(source).toContain('/app/guided');
      expect(source).toContain('/app/online');
    });

    it('CityJumpStrip.svelte compiles and preserves city-strip selector', () => {
      const source = loadComponentSource('features/home/CityJumpStrip.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('city-strip');
      expect(source).toContain('CZECH_CITIES');
    });

    it('SanctuaryTeaser.svelte compiles and links to /svet', () => {
      const source = loadComponentSource('features/home/SanctuaryTeaser.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('href="/svet"');
      expect(source).toContain('href="/svet#dech"');
      expect(source).toContain('sanctuary-portal-card');
      expect(source).toContain('living-lantern');
      expect(source).toContain('living-firefly');
      expect(source).toContain('spw-live-pill');
    });

    it('Krajina dobra (+page.svelte) compiles cleanly and has safe unmount cleanup without ReferenceError', () => {
      const svetPath = path.resolve(__dirname, '../../src/routes/svet/+page.svelte');
      const source = readFileSync(svetPath, 'utf8');
      expect(source).not.toContain('breathInterval');
      expect(source).not.toContain('stopBreathing');
      expect(source).not.toContain('storyDataUrl');
      expect(source).toContain('handleHashScroll');
      expect(source).toContain('targetBreathScale');
    });

    it('HopeCarousel.svelte compiles and preserves quiet-hope selector', () => {
      const source = loadComponentSource('features/home/HopeCarousel.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('quiet-hope');
      expect(source).toContain('qh-stat');
      expect(source).toContain('qh-text');
    });

    it('PortalsDrawer.svelte compiles and contains volunteering platforms', () => {
      const source = loadComponentSource('features/home/PortalsDrawer.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('portals-drawer');
      expect(source).toContain('PORTALS');
    });
  });

  describe('Map Feature Components (src/lib/features/map/components/)', () => {
    it('PlaceCard.svelte compiles and preserves place-card selectors and media queries', () => {
      const source = loadComponentSource('features/map/components/PlaceCard.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('place-card');
      expect(source).toContain('pc-title');
      expect(source).toContain('pc-addr');
      expect(source).toContain('template-drawer');
    });

    it('GeocodeSearch.svelte compiles and preserves #near-city-jump', () => {
      const source = loadComponentSource('features/map/components/GeocodeSearch.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('id="near-city-jump"');
      expect(source).toContain('btn-gps');
      expect(source).toContain('CZECH_CITIES');
    });

    it('CategoryFilters.svelte compiles and preserves filter presets', () => {
      const source = loadComponentSource('features/map/components/CategoryFilters.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('preset-pill');
      expect(source).toContain('radius-pill');
    });

    it('FirstContactModal.svelte compiles with a11y support', () => {
      const source = loadComponentSource('features/map/components/FirstContactModal.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('modal-overlay');
      expect(source).toContain('role="dialog"');
    });

    it('LeafletMap.svelte compiles and enforces SSR window guard', () => {
      const source = loadComponentSource('features/map/components/LeafletMap.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('browser');
      expect(source).toContain('map-canvas');
    });
  });

  describe('Sanctuary Feature Components (src/lib/features/sanctuary/components/)', () => {
    it('DeedInspectorModal.svelte compiles and preserves memory-whisper dialog', () => {
      const source = loadComponentSource('features/sanctuary/components/DeedInspectorModal.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('memory-whisper');
      expect(source).toContain('mw-close');
      expect(source).toContain('mw-btn-done');
      expect(source).toContain('role="dialog"');
    });

    it('RitualBar.svelte compiles and preserves ritual input and quick ideas', () => {
      const source = loadComponentSource('features/sanctuary/components/RitualBar.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('id="ritual-deed-input"');
      expect(source).toContain('ritual-bar');
      expect(source).toContain('quick-ideas-toggle');
      expect(source).toContain('QUICK_OFFLINE_DEEDS');
    });

    it('BreathingPacer.svelte compiles and preserves #dech and 3 breath rhythms', () => {
      const source = loadComponentSource('features/sanctuary/components/BreathingPacer.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('id="dech"');
      expect(source).toContain('breathing-sanctuary');
      expect(source).toContain('calm46');
      expect(source).toContain('box4444');
      expect(source).toContain('sleep478');
      expect(source).toContain('molly-lotus-guardian');
    });

    it('ProgressDashboard.svelte compiles and preserves private journal and backup box', () => {
      const source = loadComponentSource('features/sanctuary/components/ProgressDashboard.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toContain('calm-drawer');
      expect(source).toContain('id="backup-code-input"');
      expect(source).toContain('journal-list');
      expect(source).toContain('story-preview-frame');
    });
  });
});
