import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect, type Browser, type Page } from '@playwright/test';
import {
  ENTRY_TOUR_INITIAL_PAUSE_MS,
  ENTRY_TOUR_STEP_MS,
  ENTRY_TOUR_SETTLE_MS,
  ENTRY_TOUR_DURATION_MS
} from '../src/lib/features/home/entryTour.js';
import {
  AA_HOME_DECK_STATE_KEY,
  AA_HOME_ENTRY_TOUR_SEEN_KEY,
  AA_FUNNEL_COUNTS_KEY,
  AA_DONE_FOR_TODAY_PREFIX
} from '../src/lib/storage/keys.js';

async function gotoHydrated(page: Page, url: string) {
  await page.goto(url);
  await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });
}

async function stubOsmTiles(page: Page) {
  await page.route('https://*.tile.openstreetmap.org/**', async (route) => {
    try {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          'base64'
        )
      });
    } catch {
      // route closed on navigation
    }
  });
}

const FORBIDDEN_RGBS = [
  'rgb(79, 70, 229)',
  'rgb(225, 29, 72)',
  'rgb(29, 78, 216)',
  'rgb(91, 33, 182)',
  'rgb(4, 120, 87)',
  'rgb(5, 150, 105)',
  'rgb(16, 185, 129)',
  'rgb(52, 211, 153)',
  'rgb(110, 231, 183)',
  'rgb(167, 243, 208)',
  'rgb(15, 118, 110)',
  'rgb(153, 27, 27)',
  'rgb(254, 242, 242)',
  'rgb(0, 0, 238)',
  'rgb(85, 26, 139)',
  'rgb(97, 120, 107)',
  'rgb(44, 82, 130)'
];

test.describe('Desktop Experience Polish Regressions (R1-R5)', () => {
  test('R1: Molly stays continuously visible and roaming across desktop scroll heights on / without overlap', async ({ page }) => {
    test.setTimeout(90_000);

    const viewports = [
      { width: 1280, height: 800 },
      { width: 1265, height: 800 },
      { width: 1200, height: 800 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 }
    ];
    const scrollStops = [0, 80, 150, 220, 300, 380, 430, 550, 700, 1100, 1600];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await gotoHydrated(page, '/');

      for (const y of scrollStops) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' as ScrollBehavior }), y);
        await page.waitForTimeout(240);

        const immediate = await page.evaluate(() => {
          const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
          const dock = document.querySelector('.molly-pelisek-dock') as HTMLElement | null;
          if (!actor || !dock) return null;
          const cs = getComputedStyle(actor);
          const ar = actor.getBoundingClientRect();
          return {
            actorDocked: actor.classList.contains('is-docked'),
            dockDocked: dock.classList.contains('is-docked'),
            opacity: cs.opacity,
            visibility: cs.visibility,
            display: cs.display,
            left: ar.left,
            right: ar.right,
            top: ar.top,
            bottom: ar.bottom,
            width: ar.width,
            vw: window.innerWidth,
            vh: window.innerHeight
          };
        });

        expect(immediate, `${vp.width}x${vp.height} y=${y} immediate`).not.toBeNull();
        expect(immediate!.actorDocked, `${vp.width}x${vp.height} y=${y} actor !is-docked (immediate)`).toBe(false);
        expect(immediate!.dockDocked, `${vp.width}x${vp.height} y=${y} dock !is-docked (immediate)`).toBe(false);
        expect(immediate!.opacity, `${vp.width}x${vp.height} y=${y} opacity`).toBe('1');
        expect(immediate!.visibility, `${vp.width}x${vp.height} y=${y} visibility`).toBe('visible');
        expect(immediate!.display, `${vp.width}x${vp.height} y=${y} display`).not.toBe('none');
        expect(immediate!.left, `${vp.width}x${vp.height} y=${y} left >= 0`).toBeGreaterThanOrEqual(0);
        expect(immediate!.right, `${vp.width}x${vp.height} y=${y} right <= vw`).toBeLessThanOrEqual(immediate!.vw);
        expect(immediate!.top, `${vp.width}x${vp.height} y=${y} top >= 0`).toBeGreaterThanOrEqual(0);
        expect(immediate!.bottom, `${vp.width}x${vp.height} y=${y} bottom <= vh`).toBeLessThanOrEqual(immediate!.vh);
        if (vp.width >= 1440) {
          expect(immediate!.width, `${vp.width}x${vp.height} y=${y} width >= 82`).toBeGreaterThanOrEqual(82);
        }

        await page
          .waitForFunction(
            () => {
              const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
              if (!actor || actor.classList.contains('is-docked')) return true;
              return actor.getAttribute('data-molly-behavior') !== 'WALK_ROAM';
            },
            null,
            { timeout: 3500 }
          )
          .catch(() => {});
        await page.waitForTimeout(120);

        const settled = await page.evaluate(() => {
          const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
          const dock = document.querySelector('.molly-pelisek-dock') as HTMLElement | null;
          if (!actor || !dock) return null;
          const cs = getComputedStyle(actor);
          const ar = actor.getBoundingClientRect();
          const cat = {
            left: ar.left + ar.width * 0.14,
            right: ar.right - ar.width * 0.14,
            top: ar.top + ar.height * 0.12,
            bottom: ar.bottom - 2
          };

          const targets = Array.from(
            document.querySelectorAll('h2, h3, a.bento-card, a.card, .city-strip a, button')
          );
          const overlaps: string[] = [];
          for (const el of targets) {
            if (el.closest('.molly-companion-layer, .molly-pelisek-dock')) continue;
            const closedDetails = el.closest('details:not([open])');
            if (closedDetails && !el.closest('summary')) continue;
            if (typeof (el as HTMLElement).checkVisibility === 'function') {
              if (!(el as HTMLElement).checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
            }
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) continue;
            const w = Math.min(cat.right, r.right) - Math.max(cat.left, r.left);
            const h = Math.min(cat.bottom, r.bottom) - Math.max(cat.top, r.top);
            if (w > 2 && h > 2) {
              overlaps.push(`${el.tagName}.${el.className}(${Math.round(w * h)}px)`);
            }
          }

          return {
            actorDocked: actor.classList.contains('is-docked'),
            dockDocked: dock.classList.contains('is-docked'),
            opacity: cs.opacity,
            visibility: cs.visibility,
            left: ar.left,
            right: ar.right,
            top: ar.top,
            bottom: ar.bottom,
            width: ar.width,
            vw: window.innerWidth,
            vh: window.innerHeight,
            overlaps
          };
        });

        expect(settled, `${vp.width}x${vp.height} y=${y} settled`).not.toBeNull();
        expect(settled!.actorDocked, `${vp.width}x${vp.height} y=${y} actor !is-docked (settled)`).toBe(false);
        expect(settled!.dockDocked, `${vp.width}x${vp.height} y=${y} dock !is-docked (settled)`).toBe(false);
        expect(settled!.opacity, `${vp.width}x${vp.height} y=${y} settled opacity`).toBe('1');
        expect(settled!.visibility, `${vp.width}x${vp.height} y=${y} settled visibility`).toBe('visible');
        expect(settled!.left, `${vp.width}x${vp.height} y=${y} settled left >= 0`).toBeGreaterThanOrEqual(0);
        expect(settled!.right, `${vp.width}x${vp.height} y=${y} settled right <= vw`).toBeLessThanOrEqual(settled!.vw);
        expect(settled!.top, `${vp.width}x${vp.height} y=${y} settled top >= 0`).toBeGreaterThanOrEqual(0);
        expect(settled!.bottom, `${vp.width}x${vp.height} y=${y} settled bottom <= vh`).toBeLessThanOrEqual(settled!.vh);
        if (vp.width >= 1440) {
          expect(settled!.width, `${vp.width}x${vp.height} y=${y} settled width >= 82`).toBeGreaterThanOrEqual(82);
        }
        expect(settled!.overlaps, `${vp.width}x${vp.height} y=${y} overlaps`).toEqual([]);
      }
    }

    // Explicit Pelisek dock toggle still parks and wakes Molly on desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/');
    const toggleBtn = page.locator('.molly-dock-toggle-btn');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await expect(page.locator('.molly-roaming-actor')).toHaveClass(/is-docked/);
    await toggleBtn.click();
    await expect(page.locator('.molly-roaming-actor')).not.toHaveClass(/is-docked/);
  });

  test('R1b: Desktop 1440x900 Molly whisper bubble anchors next to Molly when roaming and renders full-width >= 180px above dock when docked', async ({
    page
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/');
    await page.evaluate(() => document.fonts.ready);

    for (const scrollY of [0, 400]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }), scrollY);
      await page.waitForTimeout(220);
      await page
        .waitForFunction(
          () => {
            const actor = document.querySelector('.molly-roaming-actor');
            return Boolean(actor && !actor.classList.contains('is-docked') && actor.getAttribute('data-molly-behavior') !== 'WALK_ROAM');
          },
          null,
          { timeout: 3500 }
        )
        .catch(() => {});

      await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
      const roamBubble = page.locator('.molly-whisper-bubble:not(.is-travelling)');
      await expect(roamBubble, `1440x900 y=${scrollY}: roaming whisper visible`).toBeVisible({ timeout: 3500 });

      const sampleRoam = async () =>
        page.evaluate(() => {
          const wEl = document.querySelector('.molly-whisper-bubble:not(.is-travelling)') as HTMLElement;
          const aEl = document.querySelector('.molly-roaming-actor') as HTMLElement;
          const b = wEl.getBoundingClientRect();
          const ar = aEl.getBoundingClientRect();
          const catVisual = {
            left: ar.left + ar.width * 0.14,
            right: ar.right - ar.width * 0.14,
            top: ar.top + ar.height * 0.12,
            bottom: ar.bottom - 2
          };
          const catOverlap = Math.round(
            Math.max(0, Math.min(b.right, catVisual.right) - Math.max(b.left, catVisual.left)) *
              Math.max(0, Math.min(b.bottom, catVisual.bottom) - Math.max(b.top, catVisual.top))
          );
          const edgeDx = Math.round(Math.max(0, b.left - catVisual.right, catVisual.left - b.right));
          const edgeDy = Math.round(Math.max(0, b.top - catVisual.bottom, catVisual.top - b.bottom));
          const overlaps: string[] = [];
          for (const el of document.querySelectorAll('h1, h2, h3, a.btn-studio-primary, button')) {
            if (el.closest('.molly-companion-layer, .molly-pelisek-dock')) continue;
            const closedDetails = el.closest('details:not([open])');
            if (closedDetails && !el.closest('summary')) continue;
            if (typeof (el as HTMLElement).checkVisibility === 'function' && !(el as HTMLElement).checkVisibility()) continue;
            const tr = el.getBoundingClientRect();
            const w = Math.min(b.right, tr.right) - Math.max(b.left, tr.left);
            const h = Math.min(b.bottom, tr.bottom) - Math.max(b.top, tr.top);
            if (w > 2 && h > 2) overlaps.push(el.tagName);
          }
          return {
            anchor: wEl.getAttribute('data-bubble-anchor') || '',
            left: Math.round(b.left),
            top: Math.round(b.top),
            catOverlap,
            edgeDx,
            edgeDy,
            edgeDist: Math.round(Math.hypot(edgeDx, edgeDy)),
            overlaps
          };
        });

      const r0 = await sampleRoam();
      expect(['above', 'left', 'right'], `1440x900 y=${scrollY}: roaming anchor`).toContain(r0.anchor);
      expect(r0.catOverlap, `1440x900 y=${scrollY}: catOverlap === 0`).toBe(0);
      expect(r0.edgeDx, `1440x900 y=${scrollY}: edgeDx <= 32`).toBeLessThanOrEqual(32);
      expect(r0.edgeDy, `1440x900 y=${scrollY}: edgeDy <= 48`).toBeLessThanOrEqual(48);
      expect(r0.edgeDist, `1440x900 y=${scrollY}: edgeDist <= 52`).toBeLessThanOrEqual(52);
      expect(r0.overlaps, `1440x900 y=${scrollY}: zero control/heading overlaps`).toEqual([]);

      await page.waitForTimeout(400);
      const r1 = await sampleRoam();
      expect(Math.abs(r1.left - r0.left), `1440x900 y=${scrollY}: stable left`).toBeLessThanOrEqual(3);
      expect(Math.abs(r1.top - r0.top), `1440x900 y=${scrollY}: stable top`).toBeLessThanOrEqual(3);
    }

    // Dock Molly and verify .molly-dock-whisper width >= 180px (no 150px squeeze) and zero overlap with dock
    const toggleBtn = page.locator('.molly-dock-toggle-btn');
    await toggleBtn.click();
    await expect(page.locator('.molly-roaming-actor')).toHaveClass(/is-docked/);
    await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
    const dockWhisper = page.locator('.molly-dock-whisper');
    await expect(dockWhisper).toBeVisible({ timeout: 3000 });

    const dockAudit = await page.evaluate(() => {
      const wEl = document.querySelector('.molly-dock-whisper') as HTMLElement;
      const dEl = document.querySelector('.molly-pelisek-dock') as HTMLElement;
      const wr = wEl.getBoundingClientRect();
      const dr = dEl.getBoundingClientRect();
      const overlap =
        Math.max(0, Math.min(wr.right, dr.right) - Math.max(wr.left, dr.left)) *
        Math.max(0, Math.min(wr.bottom, dr.bottom) - Math.max(wr.top, dr.top));
      return {
        anchor: wEl.getAttribute('data-bubble-anchor') || '',
        width: Math.round(wr.width),
        gapToDock: Math.round(dr.top - wr.bottom),
        overlap: Math.round(overlap)
      };
    });
    expect(dockAudit.anchor).toBe('dock');
    expect(dockAudit.width, 'Desktop .molly-dock-whisper must not squeeze to 150px').toBeGreaterThanOrEqual(180);
    expect(dockAudit.gapToDock).toBeGreaterThanOrEqual(2);
    expect(dockAudit.gapToDock).toBeLessThanOrEqual(24);
    expect(dockAudit.overlap).toBe(0);

    // Wake Molly back up and confirm roaming whisper anchors next to Molly again
    await toggleBtn.click();
    await expect(page.locator('.molly-roaming-actor')).not.toHaveClass(/is-docked/);
    await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
    await expect(page.locator('.molly-whisper-bubble:not(.is-travelling)')).toBeVisible({ timeout: 3500 });
    const wakeDist = await page.evaluate(() => {
      const wEl = document.querySelector('.molly-whisper-bubble:not(.is-travelling)') as HTMLElement;
      const aEl = document.querySelector('.molly-roaming-actor') as HTMLElement;
      const b = wEl.getBoundingClientRect();
      const ar = aEl.getBoundingClientRect();
      const catVisual = {
        left: ar.left + ar.width * 0.14,
        right: ar.right - ar.width * 0.14,
        top: ar.top + ar.height * 0.12,
        bottom: ar.bottom - 2
      };
      const edgeDx = Math.max(0, b.left - catVisual.right, catVisual.left - b.right);
      const edgeDy = Math.max(0, b.top - catVisual.bottom, catVisual.top - b.bottom);
      return Math.round(Math.hypot(edgeDx, edgeDy));
    });
    expect(wakeDist).toBeLessThanOrEqual(52);
  });

  test('R2: Unified Czech forest palette across 6 routes with zero off-brand leaks and >= 4.5:1 contrast', async ({ page }) => {
    test.setTimeout(60_000);
    await stubOsmTiles(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    async function auditPaletteAndContrast(label: string, excludeHeroCopy: boolean) {
      const result = await page.evaluate(
        ({ forbiddenRgbs, skipHeroCopy }) => {
          type RGB = { r: number; g: number; b: number };
          type RGBA = { r: number; g: number; b: number; a: number };

          function parseRgba(str: string): RGBA | null {
            const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
            if (!m) return null;
            return {
              r: Number(m[1]),
              g: Number(m[2]),
              b: Number(m[3]),
              a: m[4] !== undefined ? Number(m[4]) : 1
            };
          }

          function compositeOver(fg: RGBA, bg: RGB): RGB {
            return {
              r: fg.r * fg.a + bg.r * (1 - fg.a),
              g: fg.g * fg.a + bg.g * (1 - fg.a),
              b: fg.b * fg.a + bg.b * (1 - fg.a)
            };
          }

          function relLuminance(c: RGB) {
            const toLin = (v: number) => {
              const s = v / 255;
              return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
            };
            return 0.2126 * toLin(c.r) + 0.7152 * toLin(c.g) + 0.0722 * toLin(c.b);
          }

          function contrastRatio(c1: RGB, c2: RGB) {
            const l1 = relLuminance(c1);
            const l2 = relLuminance(c2);
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          }

          function parseGradientStops(bgImage: string): RGBA[] {
            if (!bgImage || !bgImage.includes('linear-gradient')) return [];
            const matches = bgImage.match(/rgba?\([^)]+\)/gi) || [];
            const stops: RGBA[] = [];
            for (const token of matches) {
              const parsed = parseRgba(token);
              if (parsed && parsed.a > 0.05) stops.push(parsed);
            }
            return stops;
          }

          function resolveBackgroundCandidates(el: Element): RGB[] {
            const chain: Element[] = [];
            let cur: Element | null = el;
            while (cur) {
              chain.unshift(cur);
              cur = cur.parentElement;
            }
            let baseColors: RGB[] = [{ r: 246, g: 247, b: 243 }];
            for (const node of chain) {
              const cs = getComputedStyle(node);
              const bg = parseRgba(cs.backgroundColor);
              const gradStops = parseGradientStops(cs.backgroundImage);
              if (gradStops.length > 0) {
                const next: RGB[] = [];
                for (const base of baseColors) {
                  const bgLayered = bg && bg.a > 0 ? compositeOver(bg, base) : base;
                  for (const stop of gradStops) {
                    next.push(compositeOver(stop, bgLayered));
                  }
                }
                baseColors = next.slice(0, 12);
              } else if (bg && bg.a > 0) {
                baseColors = baseColors.map((base) => compositeOver(bg, base));
              }
            }
            return baseColors;
          }

          const leaks: string[] = [];
          const lowContrast: string[] = [];

          const allElements = Array.from(document.querySelectorAll('*'));
          for (const el of allElements) {
            if (el.closest('[aria-hidden="true"], svg, canvas, .visually-hidden')) continue;
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK' || el.tagName === 'META') continue;
            if (typeof (el as HTMLElement).checkVisibility === 'function') {
              if (!(el as HTMLElement).checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
            }
            const cs = getComputedStyle(el);
            const propsToCheck = [
              cs.color,
              cs.backgroundColor,
              cs.borderTopColor,
              cs.borderRightColor,
              cs.borderBottomColor,
              cs.borderLeftColor,
              cs.outlineColor,
              cs.backgroundImage
            ];
            for (const val of propsToCheck) {
              if (!val) continue;
              for (const forbidden of forbiddenRgbs) {
                if (val.includes(forbidden)) {
                  leaks.push(`${el.tagName}.${el.className}: ${forbidden}`);
                }
              }
            }

            if (skipHeroCopy && el.closest('.hero-copy')) continue;
            const hasDirectText = Array.from(el.childNodes).some(
              (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
            );
            if (!hasDirectText) continue;
            if (el.closest('.deed-preview-stage, .preview-hud, .sanctuary-viewport, .preview-stage')) continue;
            const rect = el.getBoundingClientRect();
            if (rect.width < 1 || rect.height < 1) continue;

            const fgRaw = parseRgba(cs.color);
            if (!fgRaw || fgRaw.a < 0.1) continue;
            const bgs = resolveBackgroundCandidates(el);
            let worstRatio = Infinity;
            for (const bg of bgs) {
              const fg = compositeOver(fgRaw, bg);
              const r = contrastRatio(fg, bg);
              if (r < worstRatio) worstRatio = r;
            }
            if (worstRatio < 4.5) {
              lowContrast.push(`${el.tagName}.${el.className}("${(el.textContent || '').trim().slice(0, 28)}")=${worstRatio.toFixed(2)}`);
            }
          }

          return { leaks, lowContrast };
        },
        { forbiddenRgbs: FORBIDDEN_RGBS, skipHeroCopy: excludeHeroCopy }
      );

      expect(result.leaks, `${label} forbidden RGB leaks`).toEqual([]);
      expect(result.lowContrast, `${label} WCAG >= 4.5:1 failures`).toEqual([]);
    }

    // 1. / (Hero PNG pixel contrast + resting world pill + full page audit)
    await gotoHydrated(page, '/');
    await auditPaletteAndContrast('/ desktop', true);

    const worldPillBg = await page.locator('.nav-pill.world-pill').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(worldPillBg).toBe('rgba(0, 0, 0, 0)');

    const heroMetrics = await page.evaluate(() => {
      const stage = document.querySelector('.hero-stage') as HTMLElement | null;
      if (!stage) return null;
      const sr = stage.getBoundingClientRect();
      function tightRect(el: HTMLElement | null) {
        if (!el) return null;
        const range = document.createRange();
        range.selectNodeContents(el);
        const r = range.getBoundingClientRect();
        return r.width > 0 && r.height > 0 ? r : el.getBoundingClientRect();
      }
      const toRel = (el: HTMLElement | null, insetX = 0, insetY = 0) => {
        const r = tightRect(el);
        if (!r) return null;
        return {
          x: Math.max(0, r.left - sr.left + insetX),
          y: Math.max(0, r.top - sr.top + insetY),
          width: Math.max(1, r.width - insetX * 2),
          height: Math.max(1, r.height - insetY * 2)
        };
      };
      const colorOf = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).color : 'rgb(255, 255, 255)';
      };
      const primaryBtn = document.querySelector('.hero-btn.primary') as HTMLElement | null;
      const sanctuaryBtn = document.querySelector('.sanctuary-hero-btn') as HTMLElement | null;
      return {
        stageWidth: sr.width,
        stageHeight: sr.height,
        rects: {
          overline: toRel(document.querySelector('.hero-overline'), 16, 1),
          title: toRel(document.querySelector('.hero-desktop-heading'), 2, 2),
          serif: toRel(document.querySelector('.hero-serif'), 2, 2),
          lead: toRel(document.querySelector('.hero-lead'), 2, 2),
          leadStrong: toRel(document.querySelector('.hero-lead strong'), 2, 1),
          primaryBtn: toRel((primaryBtn?.querySelector('span') as HTMLElement | null) || primaryBtn, 1, 1),
          sanctuaryBtn: toRel((sanctuaryBtn?.querySelector('span') as HTMLElement | null) || sanctuaryBtn, 1, 1)
        },
        colors: {
          overline: colorOf('.hero-overline'),
          title: colorOf('.hero-desktop-heading'),
          lead: colorOf('.hero-lead'),
          leadStrong: colorOf('.hero-lead strong'),
          primaryBtn: colorOf('.hero-btn.primary'),
          sanctuaryBtn: colorOf('.sanctuary-hero-btn')
        }
      };
    });
    expect(heroMetrics).not.toBeNull();

    await page.evaluate(() => {
      const s = document.createElement('style');
      s.id = 'r2-hero-bg-probe';
      s.textContent = `
        .hero-copy, .hero-copy * {
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
        }
        .hero-serif { background: none !important; }
        .hero-overline .live-dot, .hero-copy svg { opacity: 0 !important; }
      `;
      document.head.appendChild(s);
    });
    let stagePngBase64 = '';
    try {
      const pngBuf = await page.locator('.hero-stage').first().screenshot({ type: 'png', animations: 'disabled' });
      stagePngBase64 = pngBuf.toString('base64');
    } finally {
      await page.evaluate(() => document.getElementById('r2-hero-bg-probe')?.remove());
    }

    const heroContrast = await page.evaluate(
      async ({ pngB64, colors, rects, expectedWidth, expectedHeight }) => {
        function parseRgba(str: string) {
          const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
          if (!m) return { r: 0, g: 0, b: 0, a: 1 };
          return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] !== undefined ? Number(m[4]) : 1 };
        }
        function compositeOver(fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number }) {
          return { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
        }
        function relLuminance(c: { r: number; g: number; b: number }) {
          const toLin = (v: number) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * toLin(c.r) + 0.7152 * toLin(c.g) + 0.0722 * toLin(c.b);
        }
        function contrastRatio(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }) {
          const l1 = relLuminance(c1);
          const l2 = relLuminance(c2);
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        }
        const img = new Image();
        img.src = `data:image/png;base64,${pngB64}`;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to decode hero screenshot'));
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const scaleX = img.width / Math.max(1, expectedWidth);
        const scaleY = img.height / Math.max(1, expectedHeight);

        function worstCase(rect: { x: number; y: number; width: number; height: number } | null, fgColors: Array<{ r: number; g: number; b: number; a: number }>) {
          if (!rect) return 0;
          const x0 = Math.max(0, Math.floor(rect.x * scaleX));
          const y0 = Math.max(0, Math.floor(rect.y * scaleY));
          const w = Math.max(1, Math.min(img.width - x0, Math.ceil(rect.width * scaleX)));
          const h = Math.max(1, Math.min(img.height - y0, Math.ceil(rect.height * scaleY)));
          const data = ctx.getImageData(x0, y0, w, h).data;
          let minRatio = Infinity;
          for (let i = 0; i < data.length; i += 16) {
            const bg = { r: data[i], g: data[i + 1], b: data[i + 2] };
            for (const fgRaw of fgColors) {
              const fg = compositeOver(fgRaw, bg);
              const r = contrastRatio(fg, bg);
              if (r < minRatio) minRatio = r;
            }
          }
          return minRatio;
        }

        return {
          overline: worstCase(rects.overline, [parseRgba(colors.overline)]),
          title: worstCase(rects.title, [parseRgba(colors.title)]),
          serif: worstCase(rects.serif, [
            { r: 253, g: 230, b: 138, a: 1 },
            { r: 187, g: 247, b: 208, a: 1 },
            { r: 254, g: 240, b: 138, a: 1 }
          ]),
          lead: worstCase(rects.lead, [parseRgba(colors.lead)]),
          leadStrong: worstCase(rects.leadStrong, [parseRgba(colors.leadStrong)]),
          primaryBtn: worstCase(rects.primaryBtn, [parseRgba(colors.primaryBtn)]),
          sanctuaryBtn: worstCase(rects.sanctuaryBtn, [parseRgba(colors.sanctuaryBtn)])
        };
      },
      {
        pngB64: stagePngBase64,
        colors: heroMetrics!.colors,
        rects: heroMetrics!.rects,
        expectedWidth: heroMetrics!.stageWidth,
        expectedHeight: heroMetrics!.stageHeight
      }
    );

    expect(heroContrast.overline).toBeGreaterThanOrEqual(4.5);
    expect(heroContrast.title).toBeGreaterThanOrEqual(4.5);
    expect(heroContrast.serif).toBeGreaterThanOrEqual(4.5);
    expect(heroContrast.lead).toBeGreaterThanOrEqual(4.5);
    expect(heroContrast.leadStrong).toBeGreaterThanOrEqual(4.5);
    expect(heroContrast.primaryBtn).toBeGreaterThanOrEqual(4.5);
    expect(heroContrast.sanctuaryBtn).toBeGreaterThanOrEqual(4.5);

    // 2. /app/online (expanded 45 cards + opened .how-toggle + .tier-B forest-brook token check)
    await gotoHydrated(page, '/app/online');
    await page.locator('.link-show-all').click();
    await expect(page.locator('.grid .directory-card')).toHaveCount(45);
    await page.locator('.grid .directory-card details.how-toggle > summary').first().click();
    await expect(page.locator('.grid .directory-card details.how-toggle').first()).toHaveAttribute('open', '');
    await auditPaletteAndContrast('/app/online expanded', false);

    const tierBStyle = await page.locator('.tier-B').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    expect(tierBStyle.bg).toBe('rgb(234, 242, 244)');
    expect(tierBStyle.color).toBe('rgb(29, 79, 95)');

    // 3. /app/guided
    await gotoHydrated(page, '/app/guided');
    await auditPaletteAndContrast('/app/guided', false);

    // 4. /near (with opened details.extra-drawer for a.portal-mini)
    await gotoHydrated(page, '/near');
    await page.locator('details.extra-drawer > summary').click();
    await expect(page.locator('details.extra-drawer')).toHaveAttribute('open', '');
    await auditPaletteAndContrast('/near', false);

    const portalMiniColor = await page.locator('a.portal-mini').first().evaluate((el) => getComputedStyle(el).color);
    expect(portalMiniColor).toBe('rgb(20, 40, 29)');

    // 5. /svet (dawn + night)
    await gotoHydrated(page, '/svet');
    await auditPaletteAndContrast('/svet dawn', false);
    await page.locator('.atmo-btn', { hasText: 'Hvězdná noc' }).click();
    await expect(page.locator('img.art-layer.twilight')).toBeAttached();
    await auditPaletteAndContrast('/svet night', false);

    // 6. /submit (plus triggered client-side .banner.error without network requests)
    await gotoHydrated(page, '/submit');
    await page.locator('#name').fill('Testovací místo');
    await page.locator('#loc').fill('X');
    await page.locator('.submit-btn').click();
    await expect(page.locator('.banner.error')).toBeVisible();
    await auditPaletteAndContrast('/submit error banner', false);
  });

  test('R3: Czech forest dawn and twilight artwork load cleanly across HeroSection, SanctuaryTeaser, and /svet with readable overlays', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/');

    // HeroSection backdrop
    const heroImg = page.locator('picture.hero-painted-backdrop img.hero-backdrop-img');
    await expect(heroImg).toBeVisible();
    await expect.poll(async () => {
      return heroImg.evaluate((el: HTMLImageElement) => ({
        complete: el.complete,
        naturalWidth: el.naturalWidth,
        currentSrc: el.currentSrc
      }));
    }).toEqual(expect.objectContaining({ complete: true }));
    const heroImgData = await heroImg.evaluate((el: HTMLImageElement) => ({
      naturalWidth: el.naturalWidth,
      currentSrc: el.currentSrc
    }));
    expect(heroImgData.naturalWidth).toBeGreaterThan(0);
    expect(heroImgData.currentSrc).toContain('/art/sanctuary-dawn');

    // SanctuaryTeaser lazy image + overlays
    const teaserImg = page.locator('section.sanctuary-portal-section img.preview-bg-img');
    await teaserImg.scrollIntoViewIfNeeded();
    await expect.poll(async () => {
      return teaserImg.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0);
    }).toBe(true);
    const teaserSrc = await teaserImg.evaluate((el: HTMLImageElement) => el.currentSrc);
    expect(teaserSrc).toContain('/art/sanctuary-dawn');

    const teaserOverlayMetrics = await page.evaluate(() => {
      function parseRgba(str: string) {
        const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
        if (!m) return { r: 255, g: 255, b: 255, a: 1 };
        return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] !== undefined ? Number(m[4]) : 1 };
      }
      function relLum(c: { r: number; g: number; b: number }) {
        const toLin = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * toLin(c.r) + 0.7152 * toLin(c.g) + 0.0722 * toLin(c.b);
      }
      function ratio(fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number; a: number }) {
        const bgC = { r: bg.r * bg.a, g: bg.g * bg.a, b: bg.b * bg.a };
        const l1 = relLum(fg);
        const l2 = relLum(bgC);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }
      const win = document.querySelector('.sanctuary-preview-window')!.getBoundingClientRect();
      return ['.spw-live-pill', '.spw-enter'].map((sel) => {
        const el = document.querySelector(sel) as HTMLElement;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          sel,
          inside: r.left >= win.left && r.right <= win.right && r.top >= win.top && r.bottom <= win.bottom,
          visible: r.width > 0 && r.height > 0 && cs.visibility === 'visible' && parseFloat(cs.opacity) > 0.9,
          contrast: ratio(parseRgba(cs.color), parseRgba(cs.backgroundColor))
        };
      });
    });
    for (const item of teaserOverlayMetrics) {
      expect(item.inside, `${item.sel} inside preview`).toBe(true);
      expect(item.visible, `${item.sel} visible`).toBe(true);
      expect(item.contrast, `${item.sel} contrast >= 4.5`).toBeGreaterThanOrEqual(4.5);
    }

    // /svet dawn + twilight night transition + HUD button contrast
    await gotoHydrated(page, '/svet');
    const dawnImg = page.locator('img.art-layer.dawn');
    await expect.poll(async () => dawnImg.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    const dawnData = await dawnImg.evaluate((el: HTMLImageElement) => ({
      src: el.currentSrc,
      opacity: getComputedStyle(el).opacity
    }));
    expect(dawnData.src).toContain('/art/sanctuary-dawn');
    expect(parseFloat(dawnData.opacity)).toBeGreaterThanOrEqual(0.85);

    await page.locator('.atmo-btn', { hasText: 'Hvězdná noc' }).click();
    const twilightImg = page.locator('img.art-layer.twilight');
    await expect(twilightImg).toHaveCount(1);
    await expect.poll(async () => twilightImg.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    const twilightSrc = await twilightImg.evaluate((el: HTMLImageElement) => el.currentSrc);
    expect(twilightSrc).toContain('/art/sanctuary-twilight');
    await expect.poll(async () => dawnImg.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');

    const hudContrasts = await page.evaluate(() => {
      function parseRgba(str: string) {
        const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
        if (!m) return { r: 0, g: 0, b: 0, a: 0 };
        return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] !== undefined ? Number(m[4]) : 1 };
      }
      function comp(fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number }) {
        return { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
      }
      function relLum(c: { r: number; g: number; b: number }) {
        const toLin = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * toLin(c.r) + 0.7152 * toLin(c.g) + 0.0722 * toLin(c.b);
      }
      function effectiveBg(el: Element) {
        const chain: Element[] = [];
        let cur: Element | null = el;
        while (cur) {
          chain.unshift(cur);
          cur = cur.parentElement;
        }
        let bg = { r: 246, g: 247, b: 243 };
        for (const node of chain) {
          const c = parseRgba(getComputedStyle(node).backgroundColor);
          if (c.a > 0) bg = comp(c, bg);
        }
        return bg;
      }
      return Array.from(document.querySelectorAll('.atmo-btn, .explore-deed-btn, .sound-btn, .molly-sanctuary-pill')).map((el) => {
        const cs = getComputedStyle(el);
        const bg = effectiveBg(el);
        const fg = comp(parseRgba(cs.color), bg);
        const l1 = relLum(fg);
        const l2 = relLum(bg);
        const r = el.getBoundingClientRect();
        return {
          text: (el.textContent || '').trim(),
          visible: r.width > 0 && r.height > 0 && cs.visibility === 'visible',
          contrast: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
        };
      });
    });
    expect(hudContrasts.length).toBeGreaterThanOrEqual(4);
    for (const btn of hudContrasts) {
      expect(btn.visible, `${btn.text} visible`).toBe(true);
      expect(btn.contrast, `${btn.text} contrast >= 4.5`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('R4: Dynamic deed-reactive hero copy updates across all 4 energy tabs and deep links on desktop and mobile', async ({ page }) => {
    const expectedModes = [
      {
        index: 0,
        desktopClaim: 'Stačí 2 minuty dnes.',
        mobileClaim: 'Jeden ověřený dobrý skutek na 2 minuty zdarma.'
      },
      {
        index: 1,
        desktopClaim: 'Stačí 15 minut dnes.',
        mobileClaim: 'Smysluplný skutek na 15 minut z domova zdarma.'
      },
      {
        index: 2,
        desktopClaim: 'Stačí krátká procházka dnes.',
        mobileClaim: 'Konkrétní dobrý skutek v tvém okolí bez obrazovek.'
      },
      {
        index: 3,
        desktopClaim: 'Stačí jeden krok s ostatními.',
        mobileClaim: 'Dobrovolnictví a pomoc s lidmi ve tvém okolí.'
      }
    ];

    // Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/');
    const tabs = page.locator('.energy-tabs [role="tab"]');
    await expect(tabs).toHaveCount(4);

    for (const mode of expectedModes) {
      await tabs.nth(mode.index).click();
      await expect(tabs.nth(mode.index)).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('.hero-serif')).toHaveText(mode.desktopClaim);
    }

    await gotoHydrated(page, '/?intent=walk');
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.hero-serif')).toHaveText('Stačí krátká procházka dnes.');

    await gotoHydrated(page, '/?action=s_barvou_ven');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.hero-serif')).toHaveText('Stačí 15 minut dnes.');

    // Mobile 375x667
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoHydrated(page, '/');
    for (const mode of expectedModes) {
      await tabs.nth(mode.index).click();
      await expect(tabs.nth(mode.index)).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('.hero-mobile-claim')).toHaveText(mode.mobileClaim);
    }

    await gotoHydrated(page, '/?intent=walk');
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.hero-mobile-claim')).toHaveText('Konkrétní dobrý skutek v tvém okolí bez obrazovek.');

    await gotoHydrated(page, '/?action=s_barvou_ven');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.hero-mobile-claim')).toHaveText('Smysluplný skutek na 15 minut z domova zdarma.');
  });

  test('R5: /app/online renders standalone cards in a 3-column desktop grid, preserves mobile fold, and avoids double-boxing on /', async ({ page }) => {
    const desktopViewports = [
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 }
    ];

    for (const vp of desktopViewports) {
      await page.setViewportSize(vp);
      await gotoHydrated(page, '/app/online');

      for (const expanded of [false, true]) {
        if (expanded) {
          await page.locator('.link-show-all').click();
          await expect(page.locator('.grid .directory-card')).toHaveCount(45);
          await page.mouse.move(0, 0);
        } else {
          await expect(page.locator('.grid .directory-card')).toHaveCount(3);
        }

        const metrics = await page.evaluate(() => {
          const grid = document.querySelector('.grid') as HTMLElement | null;
          if (!grid) return null;
          const gcs = getComputedStyle(grid);
          const cards = Array.from(grid.querySelectorAll('.directory-card')).map((card) => {
            const cs = getComputedStyle(card);
            return {
              bg: cs.backgroundColor,
              borderTopWidth: cs.borderTopWidth,
              borderTopStyle: cs.borderTopStyle,
              radius: cs.borderTopLeftRadius,
              boxShadow: cs.boxShadow
            };
          });
          const actionBottoms = Array.from(grid.querySelectorAll('.directory-card > .instant-actions')).map((el) =>
            Math.round(el.getBoundingClientRect().bottom)
          );
          return {
            display: gcs.display,
            colCount: gcs.gridTemplateColumns.trim().split(/\s+/).length,
            columnGap: parseFloat(gcs.columnGap),
            rowGap: parseFloat(gcs.rowGap),
            cards,
            actionBottoms,
            overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
          };
        });

        expect(metrics, `${vp.width}x${vp.height} expanded=${expanded}`).not.toBeNull();
        expect(metrics!.display).toBe('grid');
        expect(metrics!.colCount).toBe(3);
        expect(metrics!.columnGap).toBeGreaterThanOrEqual(20);
        expect(metrics!.rowGap).toBeGreaterThanOrEqual(20);
        expect(metrics!.overflowX).toBe(false);

        for (const card of metrics!.cards) {
          expect(card.bg).toBe('rgb(255, 255, 255)');
          expect(card.borderTopWidth).toBe('1px');
          expect(card.borderTopStyle).toBe('solid');
          expect(card.radius).toBe('20px');
          expect(card.boxShadow).not.toBe('none');
        }

        expect(metrics!.actionBottoms.length).toBe(expanded ? 45 : 3);
        for (let i = 0; i < metrics!.actionBottoms.length; i += 3) {
          const row = metrics!.actionBottoms.slice(i, i + 3);
          const delta = Math.max(...row) - Math.min(...row);
          expect(delta, `${vp.width}x${vp.height} row ${i / 3} CTA delta`).toBeLessThanOrEqual(2);
        }
      }
    }

    // Mobile 360x800: first CTA above fold (< 740px) and zero horizontal overflow
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/app/online');
    const firstCtaBox = await page.locator('.grid .card .cta.primary, .grid .card .btn-studio-primary').first().boundingBox();
    expect(firstCtaBox).not.toBeNull();
    expect(firstCtaBox!.y + firstCtaBox!.height).toBeLessThan(740);
    const mobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(mobileOverflow).toBe(false);

    // Home / sanity check: .instant-card .action-card must NOT have .directory-card
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/');
    await expect(page.locator('.instant-card .action-card')).toHaveCount(1);
    await expect(page.locator('.instant-card .action-card.directory-card')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Entry tour on "/": after a calm pause the page walks once through the four
// energy tabs and comes to rest on the first one.
// ---------------------------------------------------------------------------

type Viewport = { width: number; height: number };
type TabChange = { t: number; index: number };
type ShiftRecord = { value: number; startTime: number; hadRecentInput: boolean };
type LayoutShiftEntry = PerformanceEntry & { value: number; hadRecentInput: boolean };
type StageLog = { lure: string[]; stageModes: string[]; mollyMiniReady: boolean };
type IndicatorChange = { live: string | null; liveChanged: boolean };
type Whisper = { t: number; text: string };
type ProbeWindow = Window & {
  __aaTabLog?: TabChange[];
  __aaShifts?: ShiftRecord[];
  __aaShiftObserver?: PerformanceObserver;
  __aaStageLog?: StageLog;
  __aaListeners?: Record<string, number>;
  __aaTourStartAt?: number;
  __aaIndicatorLog?: IndicatorChange[];
  __aaWhispers?: Whisper[];
  __aaReachAt?: number;
};

const TOUR_MODES = [
  { index: 0, claim: 'Stačí 2 minuty dnes.' },
  { index: 1, claim: 'Stačí 15 minut dnes.' },
  { index: 2, claim: 'Stačí krátká procházka dnes.' },
  { index: 3, claim: 'Stačí jeden krok s ostatními.' }
] as const;
const TOUR_ORDER = [1, 2, 3, 0] as const;

/** How much later than scheduled a step may show up on a loaded test machine. */
const TOUR_STEP_SLACK_MS = 2500;
/** A timer may fire a hair early against the page clock. */
const TIMER_EARLY_SLACK_MS = 20;
/** How much the rendering of one step may take longer than that of the next. */
const RENDER_JITTER_SLACK_MS = 400;
/** Long enough for the first step to have happened, had the tour been running. */
const NO_TOUR_WAIT_MS = ENTRY_TOUR_INITIAL_PAUSE_MS + Math.round(ENTRY_TOUR_STEP_MS / 2);
/** Long enough for the next step to have happened, had the tour not been stopped. */
const NO_NEXT_STEP_WAIT_MS = ENTRY_TOUR_STEP_MS + Math.round(ENTRY_TOUR_STEP_MS / 2);

const DESKTOP: Viewport = { width: 1440, height: 900 };
const TABLET_LANDSCAPE: Viewport = { width: 1024, height: 768 };

const STOP_CONTROL_NAME = 'Zastavit automatickou ukázku';
const MOLLY_HOME_HINT = 'Vyber si, kolik máš dnes času';

function todayClosedKey(): string {
  const now = new Date();
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `${AA_DONE_FOR_TODAY_PREFIX}${day}`;
}

/** Records every change of the selected energy tab, with the time it happened. */
async function watchTabs(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as ProbeWindow;
    const log: TabChange[] = [];
    w.__aaTabLog = log;
    const tablist = document.querySelector('.energy-tabs');
    if (!tablist) throw new Error('energy tabs not found');
    const selectedIndex = () =>
      Array.from(tablist.querySelectorAll('[role="tab"]')).findIndex(
        (tab) => tab.getAttribute('aria-selected') === 'true'
      );
    let last = selectedIndex();
    new MutationObserver(() => {
      const next = selectedIndex();
      if (next !== last) {
        last = next;
        log.push({ t: performance.now(), index: next });
      }
    }).observe(tablist, { subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
  });
}

async function readTabLog(page: Page): Promise<TabChange[]> {
  return page.evaluate(() => (window as ProbeWindow).__aaTabLog ?? []);
}

/** Resolves with the next change of the selected tab, as soon as the page has rendered it. */
async function waitForNextTabChange(page: Page): Promise<{ t: number; index: number; ctaHref: string | null }> {
  return page.evaluate(
    () =>
      new Promise<{ t: number; index: number; ctaHref: string | null }>((resolve) => {
        const tablist = document.querySelector('.energy-tabs');
        if (!tablist) throw new Error('energy tabs not found');
        const observer = new MutationObserver(() => {
          observer.disconnect();
          resolve({
            t: performance.now(),
            index: Array.from(tablist.querySelectorAll('[role="tab"]')).findIndex(
              (tab) => tab.getAttribute('aria-selected') === 'true'
            ),
            ctaHref: document.querySelector('.instant-card .btn-studio-primary')?.getAttribute('href') ?? null
          });
        });
        observer.observe(tablist, { subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
      })
  );
}

/** Records the moment the tour starts: it marks itself as seen right before it schedules its first step. */
async function installTourStartProbe(page: Page): Promise<void> {
  await page.addInitScript((seenKey) => {
    const w = window as ProbeWindow;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (this: Storage, key: string, value: string) {
      if (key === seenKey && w.__aaTourStartAt === undefined) w.__aaTourStartAt = performance.now();
      return setItem.call(this, key, value);
    };
  }, AA_HOME_ENTRY_TOUR_SEEN_KEY);
}

/**
 * Records every change of the card counter's text together with its aria-live state. A change is silent
 * for assistive technology only if the region is off and was not switched in the same rendering pass.
 */
async function watchIndicator(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as ProbeWindow;
    const log: IndicatorChange[] = [];
    w.__aaIndicatorLog = log;
    const indicator = document.querySelector('.deck-indicator');
    if (!indicator) throw new Error('deck indicator not found');
    new MutationObserver((records) => {
      if (!records.some((record) => record.type !== 'attributes')) return;
      log.push({
        live: indicator.getAttribute('aria-live'),
        liveChanged: records.some((record) => record.type === 'attributes')
      });
    }).observe(indicator, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-live']
    });
  });
}

async function readIndicatorLog(page: Page): Promise<IndicatorChange[]> {
  return page.evaluate(() => (window as ProbeWindow).__aaIndicatorLog ?? []);
}

/** Records every whisper Molly shows, with the time it appeared. */
async function watchWhispers(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as ProbeWindow;
    const seen: Whisper[] = [];
    w.__aaWhispers = seen;
    const note = () => {
      const text = document.querySelector('.molly-whisper-bubble .whisper-text')?.textContent?.trim();
      if (text && seen[seen.length - 1]?.text !== text) seen.push({ t: performance.now(), text });
    };
    note();
    new MutationObserver(note).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
}

async function readWhispers(page: Page): Promise<Whisper[]> {
  return page.evaluate(() => (window as ProbeWindow).__aaWhispers ?? []);
}

/** Collects layout-shift entries for the whole life of the document. */
async function installShiftProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as ProbeWindow;
    const shifts: ShiftRecord[] = [];
    w.__aaShifts = shifts;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        shifts.push({ value: entry.value, startTime: entry.startTime, hadRecentInput: entry.hadRecentInput });
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
    w.__aaShiftObserver = observer;
  });
}

async function readShiftsSince(page: Page, since: number): Promise<ShiftRecord[]> {
  return page.evaluate((from) => {
    const w = window as ProbeWindow;
    const shifts = w.__aaShifts ?? [];
    for (const entry of (w.__aaShiftObserver?.takeRecords() ?? []) as LayoutShiftEntry[]) {
      shifts.push({ value: entry.value, startTime: entry.startTime, hadRecentInput: entry.hadRecentInput });
    }
    return shifts.filter((shift) => shift.startTime >= from);
  }, since);
}

/** Records every lure state and stage mode the card's scene passes through. */
async function watchStage(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as ProbeWindow;
    const log: StageLog = { lure: [], stageModes: [], mollyMiniReady: false };
    w.__aaStageLog = log;
    const card = document.querySelector('.instant-card');
    if (!card) throw new Error('instant card not found');
    const note = () => {
      const stage = card.querySelector('.deed-stage');
      const lure = stage?.getAttribute('data-preview-lure');
      const mode = stage?.getAttribute('data-stage-mode');
      if (lure && !log.lure.includes(lure)) log.lure.push(lure);
      if (mode && !log.stageModes.includes(mode)) log.stageModes.push(mode);
      if (document.querySelector('[data-molly-mini="ready"]')) log.mollyMiniReady = true;
    };
    note();
    new MutationObserver(note).observe(card, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-preview-lure', 'data-stage-mode', 'data-molly-mini']
    });
  });
}

async function readHomeState(page: Page) {
  return page.evaluate(
    ({ deckKey, seenKey, funnelKey }) => {
      const tabs = Array.from(document.querySelectorAll('.energy-tabs [role="tab"]'));
      const stage = document.querySelector('.instant-card .deed-stage');
      const cta = document.querySelector('.instant-card .btn-studio-primary');
      const ctaRect = cta?.getBoundingClientRect();
      const stageRect = stage?.getBoundingClientRect();
      return {
        selected: tabs
          .map((tab, index) => (tab.getAttribute('aria-selected') === 'true' ? index : -1))
          .filter((index) => index >= 0),
        claim: document.querySelector('.hero-serif')?.textContent?.trim() ?? '',
        title: document.querySelector('.instant-card .action-title')?.textContent?.trim() ?? '',
        indicator: document.querySelector('.deck-step-text')?.textContent?.trim() ?? '',
        indicatorLive: document.querySelector('.deck-indicator')?.getAttribute('aria-live') ?? null,
        scene: stage?.getAttribute('data-scene') ?? null,
        lure: stage?.getAttribute('data-preview-lure') ?? null,
        stageMode: stage?.getAttribute('data-stage-mode') ?? null,
        activeTag: document.activeElement?.tagName ?? null,
        deckState: sessionStorage.getItem(deckKey),
        seen: sessionStorage.getItem(seenKey),
        funnel: localStorage.getItem(funnelKey),
        ctaTop: ctaRect ? ctaRect.top : null,
        ctaBottom: ctaRect ? ctaRect.bottom : null,
        stageTop: stageRect ? stageRect.top : null,
        stageHeight: stageRect ? stageRect.height : null,
        scrollY: window.scrollY
      };
    },
    { deckKey: AA_HOME_DECK_STATE_KEY, seenKey: AA_HOME_ENTRY_TOUR_SEEN_KEY, funnelKey: AA_FUNNEL_COUNTS_KEY }
  );
}

type HomeCase = {
  viewport: Viewport;
  url?: string;
  hasTouch?: boolean;
  reducedMotion?: boolean;
  /** Runs before any page script on every navigation. */
  init?: { fn: (arg: string) => void; arg: string };
  /** Runs in the still empty tab, before "/" is opened. */
  prepare?: (page: Page) => Promise<void>;
};

/** Opens "/" in a context of its own, so each case starts as a fresh browser session. */
async function withFreshHome(
  browser: Browser,
  spec: HomeCase,
  body: (page: Page) => Promise<void>
): Promise<void> {
  const context = await browser.newContext({
    viewport: spec.viewport,
    hasTouch: spec.hasTouch ?? false,
    reducedMotion: spec.reducedMotion ? 'reduce' : 'no-preference'
  });
  try {
    const page = await context.newPage();
    if (spec.init) await page.addInitScript(spec.init.fn, spec.init.arg);
    if (spec.prepare) await spec.prepare(page);
    await gotoHydrated(page, spec.url ?? '/');
    await watchTabs(page);
    await body(page);
  } finally {
    await context.close();
  }
}

/** Waits until the tour has moved to the given tab. */
async function waitForTourStep(page: Page, tabIndex: number, isFirst: boolean): Promise<void> {
  await expect(page.locator('.energy-tabs [role="tab"]').nth(tabIndex)).toHaveAttribute('aria-selected', 'true', {
    timeout: (isFirst ? ENTRY_TOUR_INITIAL_PAUSE_MS : ENTRY_TOUR_STEP_MS) + TOUR_STEP_SLACK_MS
  });
}

/** Waits for a step and lets it settle, so that what follows is a considered choice of the card now showing. */
async function waitForSettledTourStep(page: Page, tabIndex: number, isFirst: boolean): Promise<void> {
  await waitForTourStep(page, tabIndex, isFirst);
  await page.waitForTimeout(ENTRY_TOUR_SETTLE_MS);
}

/**
 * Runs a timing-sensitive case in fresh sessions until the scripted reach lands inside the settle window
 * of a step. The attempt returns false when it came too late to say anything.
 */
async function withReachInSettleWindow(
  browser: Browser,
  spec: HomeCase,
  attempt: (page: Page) => Promise<boolean>
): Promise<void> {
  for (let tries = 0; tries < 3; tries++) {
    let landed = false;
    await withFreshHome(browser, spec, async (page) => {
      landed = await attempt(page);
    });
    if (landed) return;
  }
  throw new Error('the scripted reach never landed inside the settle window');
}

/** Runs the cases a few at a time, so that each page gets its turn well inside the initial pause. */
async function inBatches<T>(items: T[], size: number, run: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(run));
  }
}

test.describe('Home entry tour: one calm walk through the energy tabs', () => {
  for (const vp of [DESKTOP, TABLET_LANDSCAPE, { width: 920, height: 650 }]) {
    test(`ET1 (${vp.width}x${vp.height}): visits all four modes once, rests on the first, shifts nothing and stays passive`, async ({
      page
    }) => {
      test.setTimeout(90_000);
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      await page.setViewportSize(vp);
      await installShiftProbe(page);
      await installTourStartProbe(page);
      await gotoHydrated(page, '/');
      await page.evaluate(() => document.fonts.ready);
      const tourWindowStart = await page.evaluate(() => performance.now());
      await watchTabs(page);
      await watchStage(page);
      await watchIndicator(page);
      await watchWhispers(page);

      const entry = await readHomeState(page);
      expect(entry.selected, 'entry is on the first tab').toEqual([0]);
      expect(entry.claim).toBe(TOUR_MODES[0].claim);
      expect(entry.indicator).toMatch(/^1\s*\/\s*\d+/);
      expect(entry.deckState, 'fresh entry has no saved deck state').toBeNull();
      expect(entry.seen, 'the tour is marked as seen as soon as it starts').toBe('1');
      expect(entry.ctaTop).not.toBeNull();
      expect(entry.stageTop).not.toBeNull();
      await expect(page.getByRole('button', { name: STOP_CONTROL_NAME }), 'a running tour can be stopped by name').toHaveCount(1);

      const scenes: Array<string | null> = [entry.scene];
      const titles: string[] = [entry.title];
      for (const [step, tabIndex] of TOUR_ORDER.entries()) {
        await waitForTourStep(page, tabIndex, step === 0);
        const isRest = step === TOUR_ORDER.length - 1;
        await expect(page.locator('.hero-serif')).toHaveText(TOUR_MODES[tabIndex].claim);

        const shown = await readHomeState(page);
        const label = `${vp.width}x${vp.height} step ${step + 1} (tab ${tabIndex})`;
        expect(shown.selected, `${label}: exactly one tab selected`).toEqual([tabIndex]);
        expect(shown.indicator, `${label}: the mode's first card`).toMatch(/^1\s*\/\s*\d+/);
        expect(shown.stageMode, `${label}: scene stays a preview`).toBe('preview');
        expect(shown.lure, `${label}: remounted card starts at rest`).toBe('rest');
        expect(shown.deckState, `${label}: deck state is not persisted`).toBeNull();
        expect(shown.funnel, `${label}: no funnel event recorded`).toBeNull();
        expect(shown.activeTag, `${label}: focus was not moved`).toBe('BODY');
        expect(shown.scrollY, `${label}: page was not scrolled`).toBe(0);
        // The card is re-created on every step, so the layout-shift probe below cannot see it move.
        expect(shown.stageTop, `${label}: scene stays where it was`).toBe(entry.stageTop);
        expect(shown.stageHeight, `${label}: scene keeps its height`).toBe(entry.stageHeight);
        expect(shown.ctaTop, `${label}: primary CTA stays where it was`).toBe(entry.ctaTop);
        expect(shown.ctaBottom!, `${label}: primary CTA stays above the fold`).toBeLessThanOrEqual(vp.height);
        if (!isRest) {
          expect(shown.indicatorLive, `${label}: passive step is not announced`).toBe('off');
          scenes.push(shown.scene);
          titles.push(shown.title);
        } else {
          expect(shown.scene, `${label}: rest shows the entry scene again`).toBe(entry.scene);
          expect(shown.title, `${label}: rest shows the entry card again`).toBe(entry.title);
        }
      }

      expect(new Set(scenes).size, `four different scenes: ${scenes.join(', ')}`).toBe(4);
      expect(new Set(titles).size, 'four different cards').toBe(4);

      // Tempo as seen in the page: nothing before the initial pause, then one step per interval.
      const tabLog = await readTabLog(page);
      expect(tabLog.map((change) => change.index)).toEqual([...TOUR_ORDER]);
      // The pause counts from the start of the tour, not from the start of navigation.
      const tourStartAt = await page.evaluate(() => (window as ProbeWindow).__aaTourStartAt);
      expect(tourStartAt, 'the tour start was observed').toBeDefined();
      const firstStepAfter = tabLog[0].t - tourStartAt!;
      expect(firstStepAfter, 'first step, counted from the tour start').toBeGreaterThanOrEqual(
        ENTRY_TOUR_INITIAL_PAUSE_MS - TIMER_EARLY_SLACK_MS
      );
      expect(firstStepAfter, 'first step, counted from the tour start').toBeLessThanOrEqual(
        ENTRY_TOUR_INITIAL_PAUSE_MS + TOUR_STEP_SLACK_MS
      );
      // A logged time is the timer plus the rendering of that step, so one gap can fall short by the
      // difference between two renderings.
      for (let i = 1; i < tabLog.length; i++) {
        const gap = tabLog[i].t - tabLog[i - 1].t;
        expect(gap, `gap before step ${i + 1}`).toBeGreaterThanOrEqual(ENTRY_TOUR_STEP_MS - RENDER_JITTER_SLACK_MS);
        expect(gap, `gap before step ${i + 1}`).toBeLessThanOrEqual(ENTRY_TOUR_STEP_MS + TOUR_STEP_SLACK_MS);
      }
      expect(tabLog[tabLog.length - 1].t - tabLog[0].t).toBeGreaterThanOrEqual(
        ENTRY_TOUR_DURATION_MS - ENTRY_TOUR_INITIAL_PAUSE_MS - RENDER_JITTER_SLACK_MS
      );

      // Every step, the return to rest included, changed the counter while it was silent.
      const indicatorLog = await readIndicatorLog(page);
      expect(indicatorLog.length, 'the counter text did change during the tour').toBeGreaterThan(0);
      for (const [i, change] of indicatorLog.entries()) {
        expect(change, `counter change ${i + 1} is not announced`).toEqual({ live: 'off', liveChanged: false });
      }

      // Molly kept her guiding whispers to herself until the tour was over.
      const tourEndedAt = tabLog[tabLog.length - 1].t + ENTRY_TOUR_SETTLE_MS;
      expect(
        (await readWhispers(page)).filter((whisper) => whisper.t <= tourEndedAt),
        'no whisper while the tour was moving'
      ).toEqual([]);

      // Zero layout shift from before the first step until after the last one.
      const shifts = await readShiftsSince(page, tourWindowStart);
      expect(shifts, `${vp.width}x${vp.height}: layout shifts during the tour`).toEqual([]);
      expect(shifts.reduce((sum, shift) => sum + shift.value, 0)).toBe(0);

      // At rest the page is exactly a fresh entry again, with the primary CTA above the fold.
      const rest = await readHomeState(page);
      expect(rest.selected).toEqual([0]);
      expect(rest.claim).toBe(TOUR_MODES[0].claim);
      expect(rest.deckState).toBeNull();
      expect(rest.funnel).toBeNull();
      expect(rest.ctaTop).not.toBeNull();
      expect(rest.ctaTop!).toBeGreaterThanOrEqual(0);
      expect(rest.ctaBottom!, 'primary CTA stays above the fold').toBeLessThanOrEqual(vp.height);
      await expect(page.locator('.deck-indicator')).toHaveAttribute('aria-live', 'polite');
      await expect(page.locator('.tour-stop'), 'the stop control goes with the tour').toHaveCount(0);

      // The preview never primed, teased or played out while the tour was moving.
      const stageDuringTour = await page.evaluate(() => (window as ProbeWindow).__aaStageLog);
      expect(stageDuringTour?.lure).toEqual(['rest']);
      expect(stageDuringTour?.stageModes).toEqual(['preview']);
      expect(stageDuringTour?.mollyMiniReady).toBe(false);

      // Afterwards the card's own idle lure works as before, and the tour never comes back.
      await expect(page.locator('.instant-card .deed-stage')).toHaveAttribute('data-preview-lure', 'idle', {
        timeout: ENTRY_TOUR_STEP_MS + 6000
      });
      expect(await page.locator('[data-molly-mini="ready"]').count()).toBe(0);
      expect((await readTabLog(page)).length, 'no further step after the tour came to rest').toBe(TOUR_ORDER.length);
      expect((await readHomeState(page)).deckState).toBeNull();
      expect(pageErrors).toEqual([]);
    });
  }

  test('ET2: never runs on a phone or a tablet, upright or on its side, nor in a narrow or low window', async ({
    browser
  }) => {
    test.setTimeout(60_000);
    const devices: Array<{ viewport: Viewport; hasTouch?: boolean }> = [
      { viewport: { width: 390, height: 844 } },
      { viewport: { width: 375, height: 667 } },
      { viewport: { width: 768, height: 1024 } },
      // A phone on its side is wide enough for the side-by-side layout, but far too low.
      { viewport: { width: 932, height: 430 }, hasTouch: true },
      // A tablet on its side has the side-by-side layout, but no mouse to stop the tour with.
      { viewport: TABLET_LANDSCAPE, hasTouch: true },
      // A large tablet held upright is wider than the desktop breakpoint.
      { viewport: { width: 1032, height: 1376 }, hasTouch: true }
    ];
    await Promise.all([
      ...devices.map(({ viewport, hasTouch }) =>
        withFreshHome(browser, { viewport, hasTouch }, async (page) => {
          const label = `${viewport.width}x${viewport.height}`;
          const before = await readHomeState(page);
          const mobileClaim = await page.locator('.hero-mobile-claim').textContent();
          await page.waitForTimeout(NO_TOUR_WAIT_MS);
          const after = await readHomeState(page);
          expect(await readTabLog(page), `${label}: no tab change`).toEqual([]);
          expect(after.selected, label).toEqual([0]);
          expect(after.claim, label).toBe(TOUR_MODES[0].claim);
          expect(after.title, label).toBe(before.title);
          expect(await page.locator('.hero-mobile-claim').textContent(), label).toBe(mobileClaim);
          expect(after.indicatorLive, label).toBe('polite');
          expect(after.seen, `${label}: a tour that never started is not marked as seen`).toBeNull();
          expect(after.deckState, label).toBeNull();
          await expect(page.locator('.tour-stop'), `${label}: nothing to stop`).toHaveCount(0);
        })
      ),
      // The same upright shape with a mouse is a desktop window, and that one does get the tour.
      withFreshHome(browser, { viewport: { width: 1032, height: 1376 } }, async (page) => {
        expect((await readHomeState(page)).seen, 'upright desktop window: tour was armed').toBe('1');
        await waitForTourStep(page, 1, true);
      })
    ]);
  });

  test('ET3: does not start with reduced motion, a deep link, restored deck state, a closed day, a hidden tab or a scrolled page', async ({
    browser
  }) => {
    test.setTimeout(60_000);
    const cases: Array<HomeCase & { name: string; expectTab?: number; closedDay?: boolean }> = [
      { name: 'reduced motion', viewport: DESKTOP, reducedMotion: true, expectTab: 0 },
      { name: '?action= deep link', viewport: DESKTOP, url: '/?action=missing_maps', expectTab: 1 },
      { name: '#action= deep link', viewport: DESKTOP, url: '/#action=knihobudka_kniha', expectTab: 2 },
      { name: '?intent= deep link', viewport: DESKTOP, url: '/?intent=people', expectTab: 3 },
      {
        name: 'restored deck state',
        viewport: DESKTOP,
        expectTab: 1,
        init: {
          fn: (key) => {
            sessionStorage.setItem(
              key,
              JSON.stringify({ energyMode: 'focus', actionId: '', index: 0, excludeQuickId: '', usePersonalValues: false })
            );
          },
          arg: AA_HOME_DECK_STATE_KEY
        }
      },
      {
        name: 'closed day',
        viewport: DESKTOP,
        expectTab: 0,
        closedDay: true,
        init: { fn: (key) => localStorage.setItem(key, '1'), arg: todayClosedKey() }
      },
      {
        name: 'hidden tab',
        viewport: DESKTOP,
        expectTab: 0,
        init: {
          fn: () => {
            Object.defineProperty(Document.prototype, 'hidden', { configurable: true, get: () => true });
            Object.defineProperty(Document.prototype, 'visibilityState', { configurable: true, get: () => 'hidden' });
          },
          arg: ''
        }
      },
      { name: 'scrolled page', viewport: DESKTOP, url: '/#dnesni-skutek', expectTab: 0 }
    ];

    await Promise.all(
      cases.map((spec) =>
        withFreshHome(browser, spec, async (page) => {
          if (spec.name === 'scrolled page') {
            expect((await readHomeState(page)).scrollY, 'entry lands scrolled to the anchor').toBeGreaterThan(0);
          }
          if (spec.closedDay) {
            await expect(page.locator('.session-closed-card')).toContainText('Pro dnešek máš hotovo');
          }
          await page.waitForTimeout(NO_TOUR_WAIT_MS);
          const after = await readHomeState(page);
          expect(await readTabLog(page), `${spec.name}: no tab change`).toEqual([]);
          expect(after.selected, spec.name).toEqual([spec.expectTab ?? 0]);
          expect(after.seen, `${spec.name}: not marked as seen`).toBeNull();
        })
      )
    );
  });

  test('ET4: runs at most once per browser session, also for a visitor who arrives from a scrolled subpage', async ({
    page
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(DESKTOP);

    // Arriving by an in-app link from a scrolled subpage is a real entry: the tour runs.
    await gotoHydrated(page, '/app/online');
    await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' as ScrollBehavior }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    await page.locator('.nav-capsule a.brand').click();
    await expect(page.locator('.instant-card .action-title')).toBeVisible();
    await watchTabs(page);
    await waitForTourStep(page, 1, true);
    expect((await readHomeState(page)).seen).toBe('1');

    // Leaving in the middle and coming back does not replay it.
    await page.locator('.nav-capsule a[href="/app/online"]').first().click();
    await expect(page).toHaveURL(/\/app\/online$/);
    await page.locator('.nav-capsule a.brand').click();
    await expect(page.locator('.instant-card .action-title')).toBeVisible();
    await watchTabs(page);
    await page.waitForTimeout(NO_TOUR_WAIT_MS);
    expect(await readTabLog(page), 'no replay after returning to /').toEqual([]);
    expect((await readHomeState(page)).selected).toEqual([0]);

    // Neither does a reload in the same session.
    await page.reload();
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });
    await watchTabs(page);
    await page.waitForTimeout(NO_TOUR_WAIT_MS);
    const afterReload = await readHomeState(page);
    expect(await readTabLog(page), 'no replay after reload').toEqual([]);
    expect(afterReload.selected).toEqual([0]);
    expect(afterReload.deckState).toBeNull();
  });

  test('ET5: any interaction during the initial pause cancels the tour before it moves', async ({ browser }) => {
    test.setTimeout(60_000);
    const cases: Array<HomeCase & { name: string; act: (page: Page) => Promise<void> }> = [
      {
        name: 'pointer enters the card',
        viewport: DESKTOP,
        act: async (page) => {
          await page.locator('.instant-card .action-title').hover();
        }
      },
      {
        // No pointer event tells the page about a pointer that was there before it loaded.
        name: 'pointer already rests on the card when the page loads',
        viewport: DESKTOP,
        prepare: async (page) => {
          await page.mouse.move(1040, 300);
        },
        act: async (page) => {
          expect(await page.locator('.instant-card').evaluate((card) => card.matches(':hover'))).toBe(true);
        }
      },
      {
        name: 'pointer enters the tabs',
        viewport: DESKTOP,
        act: async (page) => {
          await page.locator('.energy-tabs [role="tab"]').nth(3).hover();
        }
      },
      {
        name: 'pointer down on empty hero space',
        viewport: DESKTOP,
        act: async (page) => {
          await page.mouse.click(40, 700);
        }
      },
      {
        name: 'key down',
        viewport: DESKTOP,
        act: async (page) => {
          await page.keyboard.press('Shift');
        }
      },
      {
        name: 'wheel',
        viewport: DESKTOP,
        // Upwards at the very top: nothing can scroll, so only the wheel listener can stop the tour.
        act: async (page) => {
          await page.mouse.move(700, 450);
          await page.mouse.wheel(0, -120);
          expect((await readHomeState(page)).scrollY, 'the wheel scrolled nothing').toBe(0);
        }
      },
      {
        name: 'scripted scroll',
        viewport: DESKTOP,
        act: async (page) => {
          await page.evaluate(() => window.scrollTo({ top: 260, behavior: 'instant' as ScrollBehavior }));
        }
      },
      {
        name: 'focus moves into the hero',
        viewport: DESKTOP,
        act: async (page) => {
          await page.locator('.hero-copy a.hero-btn').first().focus();
        }
      },
      {
        name: 'focus moves into the card',
        viewport: DESKTOP,
        act: async (page) => {
          await page.locator('.instant-card .btn-studio-primary').focus();
        }
      },
      {
        // A laptop with a touchscreen is a mouse device whose visitor may still use a finger. The context
        // cannot have both, so the touch is dispatched: only the tour's own touchstart listener can see it.
        name: 'touch on a touchscreen laptop',
        viewport: DESKTOP,
        act: async (page) => {
          await page.evaluate(() => {
            document.body.dispatchEvent(new Event('touchstart', { bubbles: true }));
          });
        }
      }
    ];

    await inBatches(cases, 5, (spec) =>
      withFreshHome(browser, spec, async (page) => {
        expect((await readHomeState(page)).seen, `${spec.name}: tour was armed`).toBe('1');
        await spec.act(page);
        await page.waitForTimeout(NO_TOUR_WAIT_MS);
        const after = await readHomeState(page);
        expect(await readTabLog(page), `${spec.name}: no tab change`).toEqual([]);
        expect(after.selected, spec.name).toEqual([0]);
        expect(after.claim, spec.name).toBe(TOUR_MODES[0].claim);
        expect(after.indicatorLive, `${spec.name}: announcements are back on`).toBe('polite');
        expect(after.deckState, `${spec.name}: stopping saves nothing`).toBeNull();
      })
    );
  });

  test('ET6: stopped mid-tour it stays on what is showing and never fires a late step', async ({ browser }) => {
    test.setTimeout(90_000);
    const cases: Array<{ name: string; act: (page: Page) => Promise<void> }> = [
      {
        name: 'key down',
        act: async (page) => {
          await page.keyboard.press('Shift');
        }
      },
      {
        name: 'tab becomes hidden',
        act: async (page) => {
          await page.evaluate(() => {
            Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
            Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
            document.dispatchEvent(new Event('visibilitychange'));
          });
        }
      },
      {
        name: 'media changes to reduced motion',
        act: async (page) => {
          await page.emulateMedia({ reducedMotion: 'reduce' });
        }
      },
      {
        name: 'viewport becomes a phone',
        act: async (page) => {
          await page.setViewportSize({ width: 390, height: 844 });
        }
      },
      {
        name: 'viewport becomes a portrait tablet',
        act: async (page) => {
          await page.setViewportSize({ width: 768, height: 1024 });
        }
      }
    ];

    await Promise.all(
      cases.map((spec) =>
        withFreshHome(browser, { viewport: DESKTOP }, async (page) => {
          await waitForTourStep(page, 1, true);
          await spec.act(page);
          await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
          const after = await readHomeState(page);
          expect((await readTabLog(page)).map((change) => change.index), `${spec.name}: only the first step`).toEqual([1]);
          expect(after.selected, spec.name).toEqual([1]);
          expect(after.indicatorLive, spec.name).toBe('polite');
          expect(after.deckState, `${spec.name}: stopping saves nothing`).toBeNull();
          expect(after.funnel, `${spec.name}: stopping records nothing`).toBeNull();
        })
      )
    );
  });

  test('ET7: never overrides what the visitor chose in the deck', async ({ browser }) => {
    test.setTimeout(90_000);
    const tabsOf = (page: Page) => page.locator('.energy-tabs [role="tab"]');
    const savedMode = async (page: Page) => {
      const raw = (await readHomeState(page)).deckState;
      return raw ? (JSON.parse(raw) as { energyMode?: string; index?: number }) : null;
    };

    await Promise.all([
      // A different tab than the one the tour is showing.
      withFreshHome(browser, { viewport: DESKTOP }, async (page) => {
        await waitForSettledTourStep(page, 1, true);
        await tabsOf(page).nth(3).click();
        await expect(tabsOf(page).nth(3)).toHaveAttribute('aria-selected', 'true');
        await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
        expect((await readHomeState(page)).selected).toEqual([3]);
        expect((await readTabLog(page)).map((change) => change.index)).toEqual([1, 3]);
        expect((await savedMode(page))?.energyMode).toBe('people');
        await expect(page.locator('.hero-serif')).toHaveText(TOUR_MODES[3].claim);
      }),

      // The very tab the tour is showing: the visitor keeps this card, it is not skipped.
      withFreshHome(browser, { viewport: DESKTOP }, async (page) => {
        await waitForTourStep(page, 1, true);
        await waitForSettledTourStep(page, 2, false);
        const shown = await readHomeState(page);
        await tabsOf(page).nth(2).click();
        await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
        const after = await readHomeState(page);
        expect(after.selected).toEqual([2]);
        expect(after.title, 'the card the visitor clicked on is kept').toBe(shown.title);
        expect(after.indicator).toMatch(/^1\s*\/\s*\d+/);
        expect((await savedMode(page))?.energyMode).toBe('walk');
        // From now on the active tab behaves as always: another click offers the next tip.
        await tabsOf(page).nth(2).click();
        await expect(page.locator('.deck-step-text')).toHaveText(/^2\s*\/\s*\d+/);
      }),

      // The first tab during the initial pause behaves exactly as without a tour.
      withFreshHome(browser, { viewport: DESKTOP }, async (page) => {
        await tabsOf(page).nth(0).click();
        await expect(page.locator('.deck-step-text')).toHaveText(/^2\s*\/\s*\d+/);
        await page.waitForTimeout(NO_TOUR_WAIT_MS);
        expect((await readHomeState(page)).selected).toEqual([0]);
        await expect(page.locator('.deck-step-text')).toHaveText(/^2\s*\/\s*\d+/);
      }),

      // Next card while the tour is on another mode.
      withFreshHome(browser, { viewport: DESKTOP }, async (page) => {
        await waitForSettledTourStep(page, 1, true);
        await page.locator('.deck-nav-next').click();
        await expect(page.locator('.deck-step-text')).toHaveText(/^2\s*\/\s*\d+/);
        await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
        expect((await readHomeState(page)).selected).toEqual([1]);
        await expect(page.locator('.deck-step-text')).toHaveText(/^2\s*\/\s*\d+/);
        const saved = await savedMode(page);
        expect(saved?.energyMode).toBe('focus');
        expect(saved?.index).toBe(1);
      }),

      // Starting the deed the tour happens to be showing.
      withFreshHome(browser, { viewport: DESKTOP }, async (page) => {
        await page.context().route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
        await waitForSettledTourStep(page, 1, true);
        const shown = await readHomeState(page);
        const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
        await page.locator('.instant-card .btn-studio-primary').click();
        const popup = await popupPromise;
        await popup?.close();
        await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
        const after = await readHomeState(page);
        expect(after.selected).toEqual([1]);
        expect(after.title).toBe(shown.title);
        expect(after.stageMode, 'the started deed left the preview').not.toBe('preview');
        expect((await savedMode(page))?.energyMode).toBe('focus');
      }),

      // A deep link arriving while the tour is running.
      withFreshHome(browser, { viewport: DESKTOP }, async (page) => {
        await waitForTourStep(page, 1, true);
        await page.evaluate(() => {
          window.location.hash = '#action=knihobudka_kniha';
        });
        await expect(tabsOf(page).nth(2)).toHaveAttribute('aria-selected', 'true');
        const linked = await readHomeState(page);
        await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
        const after = await readHomeState(page);
        expect(after.selected).toEqual([2]);
        expect(after.title).toBe(linked.title);
        expect((await readTabLog(page)).map((change) => change.index)).toEqual([1, 2]);
      })
    ]);
  });

  test('ET8: leaves no listeners behind once it is over, stopped or abandoned by navigating away', async ({ browser }) => {
    test.setTimeout(90_000);
    // What the running tour listens to, on top of everything else on the page.
    const TOUR_LISTENERS: Record<string, number> = {
      pointerdown: 1,
      keydown: 1,
      wheel: 1,
      touchstart: 1,
      scroll: 1,
      visibilitychange: 1,
      focusin: 1,
      pointerenter: 1,
      click: 1,
      change: 2
    };
    const WATCHED = Object.keys(TOUR_LISTENERS);

    // Counts listeners currently registered on the global targets the tour listens on.
    const listenerProbe = () => {
      const w = window as ProbeWindow;
      const counts: Record<string, number> = {};
      w.__aaListeners = counts;
      const registry = new WeakMap<EventTarget, Map<string, Set<unknown>>>();
      const isTracked = (target: EventTarget) =>
        target === window ||
        target === document ||
        (typeof MediaQueryList !== 'undefined' && target instanceof MediaQueryList) ||
        (target instanceof Element && target.matches('.instant-card, .hero-copy'));
      const keyOf = (type: string, options?: boolean | AddEventListenerOptions | EventListenerOptions) =>
        `${type}|${typeof options === 'boolean' ? options : Boolean(options?.capture)}`;
      const add = EventTarget.prototype.addEventListener;
      const remove = EventTarget.prototype.removeEventListener;
      EventTarget.prototype.addEventListener = function (
        this: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions
      ) {
        if (listener && isTracked(this)) {
          let byKey = registry.get(this);
          if (!byKey) {
            byKey = new Map();
            registry.set(this, byKey);
          }
          const key = keyOf(type, options);
          let set = byKey.get(key);
          if (!set) {
            set = new Set();
            byKey.set(key, set);
          }
          if (!set.has(listener)) {
            set.add(listener);
            counts[type] = (counts[type] ?? 0) + 1;
          }
        }
        return add.call(this, type, listener, options);
      };
      EventTarget.prototype.removeEventListener = function (
        this: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions
      ) {
        if (listener && isTracked(this)) {
          const set = registry.get(this)?.get(keyOf(type, options));
          if (set?.delete(listener)) counts[type] = (counts[type] ?? 0) - 1;
        }
        return remove.call(this, type, listener, options);
      };
    };

    const readCounts = async (page: Page) => {
      const counts = await page.evaluate(() => (window as ProbeWindow).__aaListeners ?? {});
      return Object.fromEntries(WATCHED.map((type) => [type, counts[type] ?? 0]));
    };

    const open = async (seen: boolean) => {
      const context = await browser.newContext({ viewport: DESKTOP });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.addInitScript(listenerProbe);
      if (seen) {
        await page.addInitScript((key) => sessionStorage.setItem(key, '1'), AA_HOME_ENTRY_TOUR_SEEN_KEY);
      }
      await gotoHydrated(page, '/');
      await watchTabs(page);
      return { context, page, errors };
    };

    const goToSubpage = async (page: Page) => {
      await page.evaluate(() => {
        document.querySelector<HTMLAnchorElement>('.site-footer a[href="/app/online"]')?.click();
      });
      await expect(page).toHaveURL(/\/app\/online$/);
      await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
    };

    type Session = Awaited<ReturnType<typeof open>>;
    type Counts = Record<string, number>;
    const sessions: Session[] = [];
    /** One visit from its own first moment to its end, so no visit waits for another to open. */
    const visit = async <T,>(seen: boolean, flow: (session: Session) => Promise<T>): Promise<T> => {
      const session = await open(seen);
      sessions.push(session);
      return flow(session);
    };
    // A click that was already on its way may still arrive for a moment after the tour has ended.
    const waitForLateClickGuard = (page: Page) => page.waitForTimeout(ENTRY_TOUR_SETTLE_MS + 400);

    try {
      const [noTour, finished, stopped, abandoned, subpageOnly] = await Promise.all([
        // Reference: the same page on which the tour never started.
        visit(true, async ({ page }) => {
          const atEntry: Counts = await readCounts(page);
          await page.waitForTimeout(NO_TOUR_WAIT_MS);
          expect(await readTabLog(page)).toEqual([]);
          return { atEntry, atEnd: (await readCounts(page)) as Counts };
        }),
        // The tour runs to its end.
        visit(false, async ({ page }) => {
          const during: Counts = await readCounts(page);
          expect(await readTabLog(page), 'the listeners were counted while the tour was still waiting').toEqual([]);
          for (const [step, tabIndex] of TOUR_ORDER.entries()) await waitForTourStep(page, tabIndex, step === 0);
          await expect(page.locator('.deck-indicator')).toHaveAttribute('aria-live', 'polite');
          await waitForLateClickGuard(page);
          return { during, atEnd: (await readCounts(page)) as Counts };
        }),
        // The tour is stopped by the visitor.
        visit(false, async ({ page }) => {
          await waitForTourStep(page, 1, true);
          await page.keyboard.press('Shift');
          await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
          expect((await readTabLog(page)).map((change) => change.index)).toEqual([1]);
          return { atEnd: (await readCounts(page)) as Counts };
        }),
        // The visitor leaves "/" in the middle of the tour.
        visit(false, async ({ page }) => {
          await waitForTourStep(page, 1, true);
          await goToSubpage(page);
          return { atEnd: (await readCounts(page)) as Counts };
        }),
        // Reference for the abandoned case: the same journey without a tour.
        visit(true, async ({ page }) => {
          await goToSubpage(page);
          return { atEnd: (await readCounts(page)) as Counts };
        })
      ]);

      // While it runs, the tour adds exactly its own listeners to those of the same page without a tour.
      for (const type of WATCHED) {
        expect(finished.during[type], `${type} listeners while the tour runs`).toBe(
          noTour.atEntry[type] + TOUR_LISTENERS[type]
        );
      }
      expect(finished.atEnd, 'finished tour vs. no tour').toEqual(noTour.atEnd);
      expect(stopped.atEnd, 'stopped tour vs. no tour').toEqual(noTour.atEnd);
      expect(abandoned.atEnd, 'abandoned tour vs. the same journey without a tour').toEqual(subpageOnly.atEnd);
      for (const session of sessions) {
        expect(session.errors).toEqual([]);
      }
    } finally {
      await Promise.all(sessions.map((session) => session.context.close()));
    }
  });

  test('ET9: a reach for the card right after a step is taken as aimed at the card before it', async ({ browser }) => {
    test.setTimeout(120_000);
    const tabsOf = (page: Page) => page.locator('.energy-tabs [role="tab"]');
    const blockPartners = async (page: Page) => {
      const requested: string[] = [];
      await page.context().route(/^https?:\/\/(?!localhost)/, (route) => {
        requested.push(route.request().url());
        return route.abort();
      });
      return requested;
    };
    const savedMode = async (page: Page) => {
      const raw = (await readHomeState(page)).deckState;
      return raw ? (JSON.parse(raw) as { energyMode?: string }).energyMode ?? null : null;
    };
    const startShownDeed = async (page: Page, press: () => Promise<void>) => {
      const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
      await press();
      await (await popupPromise)?.close();
    };

    await Promise.all([
      // The pointer crosses into the card a moment after the card under it was swapped.
      withReachInSettleWindow(browser, { viewport: DESKTOP }, async (page) => {
        await blockPartners(page);
        const entry = await readHomeState(page);
        await watchIndicator(page);
        const card = page.locator('.instant-card');
        const box = (await card.boundingBox())!;
        await card.evaluate((el) => {
          el.addEventListener('pointerenter', () => {
            (window as ProbeWindow).__aaReachAt ??= performance.now();
          });
        });
        // Moving about outside the card stops nothing.
        await page.mouse.move(box.x - 40, box.y + 120);
        const step = await waitForNextTabChange(page);
        await page.mouse.move(box.x + 40, box.y + 120);
        const reachAt = await page.evaluate(() => (window as ProbeWindow).__aaReachAt ?? Infinity);
        if (reachAt - step.t >= ENTRY_TOUR_SETTLE_MS) return false;

        expect(step.index).toBe(1);
        await expect(tabsOf(page).nth(0)).toHaveAttribute('aria-selected', 'true');
        const back = await readHomeState(page);
        expect(back.title, 'the card the visitor was heading for is back').toBe(entry.title);
        expect(back.claim).toBe(TOUR_MODES[0].claim);
        expect(back.deckState, 'stepping back saves nothing').toBeNull();
        expect(back.funnel, 'stepping back records nothing').toBeNull();

        await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
        expect((await readTabLog(page)).map((change) => change.index), 'one step, one step back, nothing more').toEqual([
          1, 0
        ]);
        for (const change of await readIndicatorLog(page)) {
          expect(change, 'neither the step nor the step back is announced').toEqual({ live: 'off', liveChanged: false });
        }
        await expect(page.locator('.deck-indicator')).toHaveAttribute('aria-live', 'polite');

        // The card they aimed at starts on the first click, as their own choice.
        await startShownDeed(page, () => page.locator('.instant-card .btn-studio-primary').click());
        const started = await readHomeState(page);
        expect(started.title).toBe(entry.title);
        expect(started.stageMode, 'the entry deed left the preview').not.toBe('preview');
        expect(await savedMode(page)).toBe('couch');
        return true;
      }),

      // A press lands on the primary button a moment after the card under it was swapped: the pointer
      // arrives and presses in one go, as a quick click or a finger on a touchscreen laptop does.
      withReachInSettleWindow(browser, { viewport: TABLET_LANDSCAPE }, async (page) => {
        const requested = await blockPartners(page);
        const entry = await readHomeState(page);
        const cta = page.locator('.instant-card .btn-studio-primary');
        const box = (await cta.boundingBox())!;
        const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        await page.evaluate(() => {
          window.addEventListener(
            'pointerdown',
            () => {
              (window as ProbeWindow).__aaReachAt ??= performance.now();
            },
            true
          );
        });
        const popups: Page[] = [];
        page.on('popup', (popup) => popups.push(popup));

        const step = await waitForNextTabChange(page);
        await page.mouse.click(point.x, point.y);
        const reachAt = await page.evaluate(() => (window as ProbeWindow).__aaReachAt ?? Infinity);
        if (reachAt - step.t >= ENTRY_TOUR_SETTLE_MS) return false;

        expect(step.index).toBe(1);
        expect(step.ctaHref, 'the swapped-in card has a partner link of its own').toBeTruthy();
        await expect(tabsOf(page).nth(0)).toHaveAttribute('aria-selected', 'true');
        await page.waitForTimeout(ENTRY_TOUR_SETTLE_MS);
        const back = await readHomeState(page);
        expect(back.title, 'the card the press was heading for is back').toBe(entry.title);
        // The press either started the deed it was aimed at or started nothing; never the swapped-in one.
        expect(requested.filter((url) => url.startsWith(step.ctaHref!)), 'the swapped-in partner was never opened').toEqual(
          []
        );
        expect(await savedMode(page), 'the swapped-in mode was never saved as a choice').not.toBe('focus');

        if (back.stageMode === 'preview') {
          expect(popups, 'a press that started nothing opened nothing').toEqual([]);
          expect(back.deckState).toBeNull();
          await startShownDeed(page, () => page.mouse.click(point.x, point.y));
        }
        await Promise.all(popups.map((popup) => popup.close().catch(() => {})));
        const started = await readHomeState(page);
        expect(started.title).toBe(entry.title);
        expect(started.stageMode, 'the entry deed left the preview').not.toBe('preview');
        expect(await savedMode(page)).toBe('couch');
        expect(requested.filter((url) => url.startsWith(step.ctaHref!))).toEqual([]);

        await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
        expect((await readTabLog(page)).map((change) => change.index)).toEqual([1, 0]);
        return true;
      }),

      // An activation that comes with no pointer at all (a screen reader), in the very moment of the swap.
      withFreshHome(browser, { viewport: DESKTOP }, async (page) => {
        const requested = await blockPartners(page);
        const entry = await readHomeState(page);
        const popups: Page[] = [];
        page.on('popup', (popup) => popups.push(popup));
        const activation = await page.evaluate(
          () =>
            new Promise<{ index: number; prevented: boolean }>((resolve) => {
              const tablist = document.querySelector('.energy-tabs');
              if (!tablist) throw new Error('energy tabs not found');
              const observer = new MutationObserver(() => {
                observer.disconnect();
                const cta = document.querySelector('.instant-card .btn-studio-primary');
                if (!cta) throw new Error('primary CTA not found');
                const delivered = cta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                resolve({
                  index: Array.from(tablist.querySelectorAll('[role="tab"]')).findIndex(
                    (tab) => tab.getAttribute('aria-selected') === 'true'
                  ),
                  prevented: !delivered
                });
              });
              observer.observe(tablist, { subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
            })
        );
        expect(activation.index).toBe(1);
        expect(activation.prevented, 'the freshly swapped-in button does not act yet').toBe(true);
        await expect(tabsOf(page).nth(0)).toHaveAttribute('aria-selected', 'true');
        await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
        const after = await readHomeState(page);
        expect((await readTabLog(page)).map((change) => change.index)).toEqual([1, 0]);
        expect(after.title).toBe(entry.title);
        expect(after.stageMode, 'nothing was started').toBe('preview');
        expect(after.deckState).toBeNull();
        expect(after.funnel).toBeNull();
        expect(requested).toEqual([]);
        expect(popups).toEqual([]);
      }),

      // Once the step has settled, a reach stays on what is showing.
      withFreshHome(browser, { viewport: DESKTOP }, async (page) => {
        await waitForSettledTourStep(page, 1, true);
        const shown = await readHomeState(page);
        await page.locator('.instant-card .action-title').hover();
        await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
        const after = await readHomeState(page);
        expect((await readTabLog(page)).map((change) => change.index)).toEqual([1]);
        expect(after.selected).toEqual([1]);
        expect(after.title).toBe(shown.title);
      })
    ]);
  });

  test('ET10: a running tour offers a named stop control to those whose input sends the page no other signal', async ({
    browser
  }) => {
    test.setTimeout(60_000);
    const stopControl = (page: Page) => page.getByRole('button', { name: STOP_CONTROL_NAME });

    await Promise.all([
      // Activated the way a screen reader does it: a click with no pointer and no key behind it.
      withFreshHome(browser, { viewport: DESKTOP }, async (page) => {
        await expect(stopControl(page)).toHaveCount(1);
        expect(
          await page.locator('.tour-stop').evaluate((el) => {
            const tablist = document.querySelector('.energy-tabs');
            return Boolean(tablist && el.compareDocumentPosition(tablist) & Node.DOCUMENT_POSITION_FOLLOWING);
          }),
          'the control comes before the content that changes'
        ).toBe(true);
        await waitForTourStep(page, 1, true);
        await page.locator('.tour-stop').evaluate((el) => (el as HTMLElement).click());
        await expect(stopControl(page)).toHaveCount(0);
        await page.waitForTimeout(NO_NEXT_STEP_WAIT_MS);
        const after = await readHomeState(page);
        expect((await readTabLog(page)).map((change) => change.index), 'it stays on what it was showing').toEqual([1]);
        expect(after.selected).toEqual([1]);
        expect(after.indicatorLive).toBe('polite');
        expect(after.deckState, 'stopping saves nothing').toBeNull();
        expect(after.funnel, 'stopping records nothing').toBeNull();
        expect(after.activeTag, 'focus was not moved for a visitor who had none on the control').toBe('BODY');
      }),

      // With focus on it, it shows itself at full size, and pressing it hands focus to the selected tab.
      withFreshHome(browser, { viewport: DESKTOP }, async (page) => {
        await page.locator('.tour-stop').focus();
        const box = (await page.locator('.tour-stop').boundingBox())!;
        expect(box.height, 'a focused control is a real target').toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
        await expect(stopControl(page), 'focus alone stops nothing').toHaveCount(1);

        await page.keyboard.press('Enter');
        await expect(stopControl(page)).toHaveCount(0);
        expect(
          await page.evaluate(() => ({
            role: document.activeElement?.getAttribute('role') ?? null,
            selected: document.activeElement?.getAttribute('aria-selected') ?? null
          })),
          'focus lands on the selected tab instead of being dropped'
        ).toEqual({ role: 'tab', selected: 'true' });
        await page.waitForTimeout(NO_TOUR_WAIT_MS);
        expect(await readTabLog(page), 'the tour never moved').toEqual([]);
        expect((await readHomeState(page)).deckState).toBeNull();
      })
    ]);
  });

  test('ET11: while the tour runs, the card holds its own idle lure and Molly holds her guiding whisper', async ({
    browser
  }) => {
    test.setTimeout(90_000);
    const cardSource = readFileSync(
      fileURLToPath(new URL('../src/lib/features/actions/components/ActionCard.svelte', import.meta.url)),
      'utf8'
    );
    const idleFirstDelayMs = Number(/const IDLE_FIRST_DELAY_MS = (\d+);/.exec(cardSource)?.[1]);
    expect(idleFirstDelayMs, 'ActionCard still names its first idle delay').toBeGreaterThan(0);
    // Makes the card far more eager than a tour step is long, so a lure that was not held would show.
    const EAGER_LURE_MS = 1500;
    expect(EAGER_LURE_MS).toBeLessThan(ENTRY_TOUR_STEP_MS);
    // Packed as "<from>><to>|<session key to preset, if any>".
    const eagerLure = (packed: string) => {
      const [pair, presetKey] = packed.split('|');
      if (presetKey) sessionStorage.setItem(presetKey, '1');
      const [from, to] = pair.split('>').map(Number);
      const native = window.setTimeout;
      window.setTimeout = ((handler: TimerHandler, timeout?: number, ...rest: unknown[]) =>
        native(handler, timeout === from ? to : timeout, ...rest)) as typeof window.setTimeout;
    };
    const remap = `${idleFirstDelayMs}>${EAGER_LURE_MS}`;
    const stage = (page: Page) => page.locator('.instant-card .deed-stage');

    await Promise.all([
      // Without a tour both show up while a tour would still be running: the lure after its shortened
      // delay, the whisper on its own.
      withFreshHome(
        browser,
        { viewport: DESKTOP, init: { fn: eagerLure, arg: `${remap}|${AA_HOME_ENTRY_TOUR_SEEN_KEY}` } },
        async (page) => {
          await expect(stage(page), 'the shortened delay bites').toHaveAttribute('data-preview-lure', 'idle', {
            timeout: EAGER_LURE_MS + ENTRY_TOUR_STEP_MS
          });
          await expect(page.locator('.molly-whisper-bubble .whisper-text')).toContainText(MOLLY_HOME_HINT, {
            timeout: ENTRY_TOUR_DURATION_MS - EAGER_LURE_MS
          });
          expect(await readTabLog(page)).toEqual([]);
        }
      ),

      withFreshHome(browser, { viewport: DESKTOP, init: { fn: eagerLure, arg: remap } }, async (page) => {
        await watchStage(page);
        await watchWhispers(page);
        for (const [step, tabIndex] of TOUR_ORDER.entries()) await waitForTourStep(page, tabIndex, step === 0);
        const tabLog = await readTabLog(page);
        const tourEndedAt = tabLog[tabLog.length - 1].t + ENTRY_TOUR_SETTLE_MS;

        const stageLog = await page.evaluate(() => (window as ProbeWindow).__aaStageLog);
        expect(stageLog?.lure, 'no card lured on its own during the tour').toEqual(['rest']);
        expect(
          (await readWhispers(page)).filter((whisper) => whisper.t <= tourEndedAt),
          'Molly said nothing during the tour'
        ).toEqual([]);

        // Both come back once the tour is over.
        await expect(stage(page)).toHaveAttribute('data-preview-lure', 'idle', { timeout: EAGER_LURE_MS + 4000 });
        await expect(page.locator('.molly-whisper-bubble .whisper-text')).toContainText(MOLLY_HOME_HINT, {
          timeout: 8000
        });
        expect((await readTabLog(page)).length).toBe(TOUR_ORDER.length);
      })
    ]);
  });
});
