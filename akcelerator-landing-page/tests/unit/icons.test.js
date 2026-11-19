import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compile } from 'svelte/compiler';
import {
  ICON_KEYS,
  ICON_SVG_INNER,
  isValidIconKey,
  resolveIconKey,
  getSvgIconHtml
} from '$lib/icons/iconRegistry.js';

const ROOT = resolve(process.cwd());
const EMOJI_RE = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\u2600-\u27BF]/u;

const PROJECT_CONTRACT_KEYS = [
  'zap', 'compass', 'clock', 'map-pin', 'trees', 'plus', 'paw', 'fish', 'milk',
  'leaf', 'heart', 'bell', 'star', 'home', 'footprints', 'mouse-pointer',
  'message-circle', 'life-buoy', 'phone', 'alert-triangle', 'x', 'check',
  'share-2', 'coffee', 'info', 'sparkles', 'sun', 'moon', 'waves', 'volume-2',
  'volume-x', 'menu', 'chevron-left', 'chevron-right', 'chevron-down',
  'refresh-cw', 'arrow-up-right', 'target', 'shield-check', 'users',
  'book-open', 'utensils', 'building', 'calendar', 'copy', 'mail',
  'sliders-horizontal', 'search', 'navigation', 'circle-dot'
];

describe('M1 Feature 1: iconRegistry, AppIcon, PageHeader & package.json guardrails', () => {
  it('exports all 50 PROJECT.md contract icon keys plus custom paw and circle-dot fallback', () => {
    for (const key of PROJECT_CONTRACT_KEYS) {
      expect(ICON_KEYS).toContain(key);
      expect(isValidIconKey(key)).toBe(true);
      expect(typeof ICON_SVG_INNER[key]).toBe('string');
      expect(ICON_SVG_INNER[key].length).toBeGreaterThan(10);
    }
    expect(ICON_KEYS.length).toBeGreaterThanOrEqual(96);
  });

  it('resolves unknown, null, and whitespace-padded keys safely', () => {
    expect(resolveIconKey('  PAW  ')).toBe('paw');
    expect(resolveIconKey('nonexistent-icon')).toBe('circle-dot');
    expect(resolveIconKey(null)).toBe('circle-dot');
    expect(resolveIconKey(undefined)).toBe('circle-dot');
    expect(isValidIconKey('nonexistent-icon')).toBe(false);
  });

  it('getSvgIconHtml generates clean <svg> markup without Unicode emojis for every key', () => {
    for (const key of ICON_KEYS) {
      const svg = getSvgIconHtml(key, 18);
      expect(svg.startsWith('<svg ')).toBe(true);
      expect(svg).toContain('width="18"');
      expect(svg).toContain('height="18"');
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain('aria-hidden="true"');
      expect(EMOJI_RE.test(svg)).toBe(false);
    }
    const pawSvg = getSvgIconHtml('paw', 20);
    expect(pawSvg).toContain('app-icon-paw');
    expect(pawSvg).toContain('fill="currentColor"');
  });

  it('compiles AppIcon.svelte and PageHeader.svelte cleanly for SSR', () => {
    for (const relPath of ['src/lib/components/AppIcon.svelte', 'src/lib/components/PageHeader.svelte']) {
      const src = readFileSync(resolve(ROOT, relPath), 'utf8');
      const result = compile(src, { filename: relPath, generate: 'server' });
      expect(result.js.code.length).toBeGreaterThan(100);
      expect(EMOJI_RE.test(src)).toBe(false);
    }
  });

  it('preserves package.json Vercel & toolchain guardrails', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
    expect(pkg.dependencies['@lucide/svelte']).toBeTruthy();
    expect(pkg.engines).toBeUndefined();
    expect(pkg.devDependencies['@types/node']).toBe('^24');
    expect(pkg.allowScripts).toEqual({ 'esbuild@0.28.2': true });
  });
});

describe('M1 Feature 2: Editorial Daylight CSS tokens & invariants', () => {
  it('defines canonical daylight tokens and removes AI-look artifacts', () => {
    const css = readFileSync(resolve(ROOT, 'src/styles/czech-theme.css'), 'utf8');
    expect(css).toContain('--bg-canvas: #f6f7f3;');
    expect(css).toContain('--bg-surface: #ffffff;');
    expect(css).toContain('--bg-subtle: #edf2ee;');
    expect(css).toContain('--border-subtle: #dce3dd;');
    expect(css).toContain('--border-strong: #c2cec5;');
    expect(css).toContain('--ink-primary: #14281d;');
    expect(css).toContain('--ink-secondary: #3f574a;');
    expect(css).toContain('--ink-muted: #516659;');
    expect(css).toContain('--accent-primary: #1b5e42;');
    expect(css).toContain('--accent-primary-hover: #144732;');
    expect(css).toContain('--accent-warm: #b8651b;');
    expect(css).toContain('--accent-warm-ink: #8f4b0e;');
    expect(css).toContain('--accent-warm-tint: #fef6e8;');
    expect(css).toContain('--forest-brook-ink: #1d4f5f;');
    expect(css).toContain('--forest-brook-tint: #eaf2f4;');
    expect(css).toContain('--forest-brook-border: #b8cfd6;');
    expect(css).toContain('--linden-canopy-ink: #2b5938;');
    expect(css).toContain('--moss-olive-ink: #4a5926;');
    expect(css).toContain('--moss-olive-tint: #f2f5e9;');
    expect(css).toContain('--moss-olive-border: #cad4b0;');
    expect(css).toContain('--rowan-ink: #8a3b2c;');
    expect(css).toContain('--rowan-tint: #fbf0ed;');
    expect(css).toContain('--rowan-border: #e5c1b8;');
    expect(css).toContain('--hero-dawn: #fef3c7;');
    expect(css).toContain(':where(a)');
    expect(css).toContain('.app-container');
    expect(css).toContain('.touch-target');
    expect(css).toContain('.page-header');
    expect(css).toContain('font-size: 1rem;');
    expect(css).not.toContain('radial-gradient');
    expect(css).not.toContain('backdrop-filter');
    expect(css).not.toContain('floatFirefly');
    expect(css).not.toContain('pulseBeacon');
    expect(css).not.toContain('shimmerSweep');
    expect(css).not.toContain('↓');
    expect(css).not.toContain('↑');
  });
});
