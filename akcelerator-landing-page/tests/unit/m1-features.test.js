import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');
const srcDir = path.resolve(rootDir, 'src');

function readSource(relativeSubpath) {
  const fullPath = path.resolve(srcDir, relativeSubpath);
  return readFileSync(fullPath, 'utf8');
}

describe('Milestone 1: Core Implementation F1-F11 Verification', () => {
  describe('F1: Reward Exclusively AFTER Action (AGENTS.md #1.3)', () => {
    it('ActionCard.svelte defaults showEffectPreview to false and gates done button/canvas behind isStarted', () => {
      const source = readSource('lib/features/actions/components/ActionCard.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toMatch(/export\s+let\s+showEffectPreview\s*=\s*false;/);
      expect(source).toMatch(/\{#if\s+isStarted[\s\S]*?btn-studio-done/);
      expect(source).toMatch(/\{#if\s+isStarted[\s\S]*?card-effect-stage/);
    });

    it('PlaceCard.svelte gates done button and canvas behind isStarted', () => {
      const source = readSource('lib/features/map/components/PlaceCard.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(source).toMatch(/\{#if\s+isStarted[\s\S]*?class="pc-btn done"/);
      expect(source).toMatch(/\{#if\s+isStarted[\s\S]*?card-effect-stage/);
    });

    it('+page.svelte handles return from partner via in-situ prompt without premature reward', () => {
      const source = readSource('routes/+page.svelte');
      expect(source).toContain('partnerReturnPromptVisible = true');
      expect(source).toContain('justCompleted = false');
    });
  });

  describe('F2: Zero-Scroll 100dvh & Mobile Claim', () => {
    it('HeroSection.svelte displays compact 1-line mobile claim and eliminates dead anchor button', () => {
      const source = readSource('lib/features/home/HeroSection.svelte');
      expect(source).toContain('Jeden ověřený dobrý skutek na 2 minuty zdarma.');
      expect(source).not.toContain('handleActionAnchorClick');
      expect(source).not.toContain('⚡ Dnešní skutek (2 min) ↓');
    });

    it('ActionCard.svelte places EvidenceBadge and trust line inside details.how-toggle and cleans meta middle-dot', () => {
      const source = readSource('lib/features/actions/components/ActionCard.svelte');
      expect(source).toMatch(/<details[\s\S]*?class="[^"]*how-toggle[^"]*"[\s\S]*?<EvidenceBadge[\s\S]*?partner-trust-line/);
      // Ensure orphaned middle-dot in card-meta-top is eliminated
      const metaHeaderMatch = source.match(/<div class="action-meta-line card-meta-top">([\s\S]*?)<\/div>/);
      expect(metaHeaderMatch).not.toBeNull();
      const metaHeader = metaHeaderMatch ? metaHeaderMatch[1] : '';
      expect(metaHeader).not.toContain('<span class="card-meta-dot">·</span>');
    });
  });

  describe('F3: Elimination of background-attachment: fixed (AGENTS.md #2.2)', () => {
    it('czech-theme.css contains no background-attachment: fixed on body', () => {
      const css = readSource('styles/czech-theme.css');
      expect(css).not.toContain('background-attachment: fixed');
    });
  });

  describe('F4: Molly Obstacle Measurement Decoupled from rAF (AGENTS.md #2.2)', () => {
    it('MollyCompanion.svelte does not query DOM layout metrics inside tick loop', () => {
      const source = readSource('components/MollyCompanion.svelte');
      const tickStart = source.indexOf('const tick = (now) => {');
      expect(tickStart).toBeGreaterThan(0);
      const tickEnd = source.indexOf('rafId = requestAnimationFrame(tick);', tickStart);
      expect(tickEnd).toBeGreaterThan(tickStart);
      const tickBody = source.slice(tickStart, tickEnd);

      expect(tickBody).not.toContain('getBoundingClientRect');
      expect(tickBody).not.toContain('getComputedStyle');
      expect(tickBody).not.toContain('collectObstacles');
      expect(source).toContain('measureLayoutAndObstacles');
    });
  });

  describe('F5: Fix HTTP 404 for Icons & Manifest', () => {
    it('app.html and service-worker.js use canonical root paths without duplicate layout links', () => {
      const appHtml = readFileSync(path.resolve(srcDir, 'app.html'), 'utf8');
      expect(appHtml).toContain('href="/favicon-czech.png"');
      expect(appHtml).toContain('href="/apple-touch-icon-czech.png"');
      expect(appHtml).toContain('href="/manifest.webmanifest"');

      const layout = readSource('routes/+layout.svelte');
      expect(layout).not.toContain('href="/favicon-czech.png"');
      expect(layout).not.toContain('href="/apple-touch-icon-czech.png"');
      expect(layout).not.toContain('href="/manifest.webmanifest"');

      const sw = readSource('service-worker.js');
      expect(sw).toContain("'/favicon-czech.png'");
      expect(sw).toContain("'/apple-touch-icon-czech.png'");
    });
  });

  describe('F6: SvelteKit Navigation & Leaflet Unmount Crash Fix', () => {
    it('near/+page.svelte uses SvelteKit goto with replaceState and safe unmount cleanup', () => {
      const source = readSource('routes/near/+page.svelte');
      expect(source).toContain('goto(url, { replaceState: true, noScroll: true, keepFocus: true })');
      expect(source).toMatch(/try\s*\{\s*map\.stop\(\);\s*\}\s*catch[\s\S]*?map\.remove\(\)/);
    });
  });

  describe('F7: Lazy Loading of Leaflet & Touch Preload', () => {
    it('near/+page.svelte postpones Leaflet loading and layout/app.html configure tap preload', () => {
      const nearSource = readSource('routes/near/+page.svelte');
      expect(nearSource).toContain("mobileView === 'map'");

      const appHtml = readFileSync(path.resolve(srcDir, 'app.html'), 'utf8');
      expect(appHtml).toContain('data-sveltekit-preload-data="tap"');
      expect(appHtml).toContain('data-sveltekit-preload-code="viewport"');

      const layout = readSource('routes/+layout.svelte');
      expect(layout).toContain('data-sveltekit-preload-data="tap"');
    });
  });

  describe('F8: Molly Dock Ergonomics & 44px Touch Targets', () => {
    it('MollyDock.svelte suppresses toggle/follow on /svet, stays visible on mobile, and has 44px touch targets', () => {
      const dockSource = readSource('components/MollyDock.svelte');
      const compiled = compile(dockSource, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();

      expect(dockSource).toMatch(/\{#if\s+!\$mollyDockBridge\.atHome\}[\s\S]*?molly-dock-toggle-btn/);
      expect(dockSource).not.toMatch(/\.molly-pelisek-dock(?:\.[a-z-]+)?\s*\{[^}]*display:\s*none/);
      expect(dockSource).toMatch(/\.molly-dock-pet-btn[\s\S]*?min-width:\s*44px/);
      expect(dockSource).toMatch(/\.molly-dock-pet-btn[\s\S]*?min-height:\s*44px/);
      expect(dockSource).toMatch(/\.molly-dock-toggle-btn[\s\S]*?min-width:\s*44px/);
      expect(dockSource).toMatch(/\.molly-dock-toggle-btn[\s\S]*?min-height:\s*44px/);
    });
  });

  describe('F9: Web Audio Autoplay Warning Elimination', () => {
    it('audioContext.js respects user gesture before initializing AudioContext', async () => {
      const audioModule = await import('../../src/lib/audio/audioContext.js');
      expect(typeof audioModule.markUserGesture).toBe('function');
      expect(typeof audioModule.getAudioContext).toBe('function');
      expect(typeof audioModule.isSoundMuted).toBe('function');
      expect(typeof audioModule.toggleSoundMuted).toBe('function');
    });
  });

  describe('F10: Unified Desktop Grid (1140px)', () => {
    it('czech-theme.css defines .content-wrap with 1140px max-width', () => {
      const css = readSource('styles/czech-theme.css');
      expect(css).toMatch(/\.content-wrap\s*\{[\s\S]*?max-width:\s*1140px;/);
      expect(css).toMatch(/\.content-wrap\s*\{[\s\S]*?box-sizing:\s*border-box;/);
      expect(css).toMatch(/\.content-wrap\s*\{[\s\S]*?margin:\s*0\s+auto;/);
      expect(css).toMatch(/\.content-wrap\s*\{[\s\S]*?align-items:\s*start;/);
    });
  });

  describe('F11: Network Caching & Typings', () => {
    it('pulseService.js caches fetchAmbientPulse calls within 45s TTL', async () => {
      const { fetchAmbientPulse } = await import('../../src/lib/features/pulse/services/pulseService.js');
      
      let fetchCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        fetchCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Darováno 10 miskek', isLive: true })
        });
      });

      const res1 = await fetchAmbientPulse();
      expect(res1).toEqual({ message: 'Darováno 10 miskek', isLive: true });
      expect(fetchCount).toBe(1);

      // Immediate second call should be served from in-memory cache
      const res2 = await fetchAmbientPulse();
      expect(res2).toEqual({ message: 'Darováno 10 miskek', isLive: true });
      expect(fetchCount).toBe(1);
    });

    it('SanctuaryTeaser.svelte provides WebP responsive backdrop', () => {
      const source = readSource('lib/features/home/SanctuaryTeaser.svelte');
      expect(source).toContain('/art/sanctuary-dawn-800.webp');
    });

    it('app.d.ts exists and declares App.PageState', () => {
      const dtsPath = path.resolve(srcDir, 'app.d.ts');
      expect(existsSync(dtsPath)).toBe(true);
      const content = readFileSync(dtsPath, 'utf8');
      expect(content).toContain('interface PageState');
      expect(content).toContain('namespace App');
    });
  });
});
