import { test, expect, type Page } from '@playwright/test';

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
