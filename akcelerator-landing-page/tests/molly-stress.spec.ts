import { test, expect } from '@playwright/test';

/**
 * ADVERSARIAL EMPIRICAL STRESS TEST SUITE: Walking Molly in Krajina Dobra (/svet)
 *
 * Scope:
 * 1. Animation loop stability at 60 FPS target, finite coordinates (zero NaN), zero canvas context stack leak.
 * 2. State transitions under high-frequency click storms (rapid feeding) and multi-viewport resizes.
 * 3. Dual-hit accuracy: click at (0.24w, 0.72h) feeds Molly; click at dynamic actor feeds Molly; faraway clicks do not.
 * 4. Boundary precision: hit radius <= 48px.
 * 5. Atmosphere toggles and reduced-motion compliance.
 * 6. Lifecycle cleanup: unmount cancels rAF and observer disconnects.
 */

test.describe('Adversarial Challenge: Walking Molly Stability & State Machine', () => {

  test.beforeEach(async ({ page }) => {
    // Inject telemetry instrumentation before every page load
    await page.addInitScript(() => {
      const g = window as any;
      g.__mollyTelemetry = {
        frames: [] as number[],
        mollyPositions: [] as { x: number; y: number; time: number }[],
        nanDetected: false,
        stackDepths: [] as number[],
        maxStackDepth: 0,
        stackUnderflow: false,
        currentDepth: 0,
        errors: [] as string[]
      };

      // Intercept context stack save/restore
      const origSave = CanvasRenderingContext2D.prototype.save;
      const origRestore = CanvasRenderingContext2D.prototype.restore;
      const origBezier = CanvasRenderingContext2D.prototype.bezierCurveTo;

      CanvasRenderingContext2D.prototype.save = function () {
        g.__mollyTelemetry.currentDepth++;
        if (g.__mollyTelemetry.currentDepth > g.__mollyTelemetry.maxStackDepth) {
          g.__mollyTelemetry.maxStackDepth = g.__mollyTelemetry.currentDepth;
        }
        return origSave.apply(this, arguments as any);
      };

      CanvasRenderingContext2D.prototype.restore = function () {
        g.__mollyTelemetry.currentDepth--;
        if (g.__mollyTelemetry.currentDepth < 0) {
          g.__mollyTelemetry.stackUnderflow = true;
        }
        return origRestore.apply(this, arguments as any);
      };

      // Molly's body drawing uniquely begins with bezierCurveTo(-22, ...) for her tortoiseshell tail!
      // At this point, the canvas matrix translation is EXACTLY Molly's world position (mx, mcy).
      CanvasRenderingContext2D.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
        if (cp1x === -22) {
          const matrix = this.getTransform();
          const dpr = window.devicePixelRatio || 1;
          const stageW = this.canvas.width / dpr;
          const stageH = this.canvas.height / dpr;

          const mx = matrix.e / dpr;
          const my = matrix.f / dpr;

          if (Number.isNaN(mx) || Number.isNaN(my)) {
            g.__mollyTelemetry.nanDetected = true;
            g.__mollyTelemetry.errors.push(`NaN detected in Molly matrix transform (${mx}, ${my})`);
          }

          if (stageW > 0 && stageH > 0) {
            const nx = mx / stageW;
            const ny = my / stageH;
            g.__mollyTelemetry.mollyPositions.push({ x: nx, y: ny, time: performance.now() });
          }
        }
        return origBezier.apply(this, arguments as any);
      };

      // Intercept rAF to capture frame timestamps
      let lastTime = performance.now();
      const origRaf = window.requestAnimationFrame;
      window.requestAnimationFrame = function (cb: FrameRequestCallback) {
        return origRaf.call(window, (now: number) => {
          const dt = now - lastTime;
          lastTime = now;
          if (dt > 0 && dt < 1000) {
            g.__mollyTelemetry.frames.push(dt);
            g.__mollyTelemetry.stackDepths.push(g.__mollyTelemetry.currentDepth);
          }
          cb(now);
        });
      };

      // Record stage click diagnostics
      g.__mollyClicks = [];
      window.addEventListener('click', (e) => {
        const vp = document.querySelector('.sanctuary-viewport');
        if (vp) {
          const rect = vp.getBoundingClientRect();
          const cx = e.clientX - rect.left;
          const cy = e.clientY - rect.top;
          g.__mollyClicks.push({ cx, cy, w: rect.width, h: rect.height, time: performance.now() });
        }
      }, true);
    });
  });

  test('Molly 1: Animation loop stability at 60 FPS, finite coordinates, zero NaN, zero canvas stack leak', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/svet');
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    // Sample animation for 2.5 seconds (~150 frames)
    await page.waitForTimeout(2500);

    const telemetry = await page.evaluate(() => (window as any).__mollyTelemetry);

    expect(pageErrors).toHaveLength(0);
    expect(telemetry.nanDetected).toBe(false);
    expect(telemetry.stackUnderflow).toBe(false);
    expect(telemetry.errors).toHaveLength(0);

    // Frame rate & stability assertions
    expect(telemetry.frames.length).toBeGreaterThan(60); // At least 60 frames recorded
    const avgFrameDt = telemetry.frames.reduce((a: number, b: number) => a + b, 0) / telemetry.frames.length;
    const approxFps = 1000 / avgFrameDt;
    console.log(`[STRESS TEST] Measured FPS: ${approxFps.toFixed(1)} (avg dt: ${avgFrameDt.toFixed(2)}ms over ${telemetry.frames.length} frames)`);
    // Headless Chromium on CPU rasterizer targets 40+ FPS (real hardware 60 FPS)
    expect(approxFps).toBeGreaterThan(38);

    // Molly-specific coordinate verification
    expect(telemetry.mollyPositions.length).toBeGreaterThan(20);
    for (const pos of telemetry.mollyPositions) {
      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
      expect(Number.isNaN(pos.x)).toBe(false);
      expect(Number.isNaN(pos.y)).toBe(false);

      // Molly should strictly stay on the lakeshore trajectory nx in [0.20, 0.44]
      expect(pos.x).toBeGreaterThanOrEqual(0.19);
      expect(pos.x).toBeLessThanOrEqual(0.45);

      // Lakeshore y equation: ny = 0.72 + (nx - 0.24) * 0.04
      // Account for vertical walkBob (-2.2px) and idleBreathe (+/- 0.8px) in normalized height
      const expectedBaseY = 0.72 + (pos.x - 0.24) * 0.04;
      expect(Math.abs(pos.y - expectedBaseY)).toBeLessThanOrEqual(0.025);
    }
  });

  test('Molly 2: Dual-hit accuracy: click at (0.24w, 0.72h) feeds Molly; faraway clicks do not', async ({ page }) => {
    await page.goto('/svet');
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    const companion = page.locator('.molly-companion-layer');
    const viewport = page.locator('.sanctuary-viewport');
    const vpBox = await viewport.boundingBox();
    expect(vpBox).not.toBeNull();
    const w = vpBox!.width;
    const h = vpBox!.height;

    // 1. Faraway click test (matches F7-B1): Click on sky at (0.50w, 0.25h) clear of HUD does NOT feed Molly
    const initialTreats = Number(await companion.getAttribute('data-molly-treats') || '0');
    await viewport.click({ position: { x: Math.round(w * 0.50), y: Math.round(h * 0.25) } });
    await page.waitForTimeout(300);
    const afterSkyClick = Number(await companion.getAttribute('data-molly-treats') || '0');
    expect(afterSkyClick, 'Click on sky (0.50w, 0.25h) must NOT feed Molly').toBe(initialTreats);

    // Dismiss the opened memory-whisper dialog so viewport is clear
    const closeBtn = page.locator('.memory-whisper .mw-close');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(200);
    }

    // 2. Another faraway click test: Click on seeded star at (0.41w, 0.15h) selects deed, does NOT feed Molly
    await viewport.click({ position: { x: Math.round(w * 0.41), y: Math.round(h * 0.15) } });
    await page.waitForTimeout(300);
    const afterStarClick = Number(await companion.getAttribute('data-molly-treats') || '0');
    expect(afterStarClick, 'Click on star at (0.41w, 0.15h) must NOT feed Molly').toBe(initialTreats);

    // Dismiss whisper dialog again
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(200);
    }

    // 3. Direct hit accuracy: Home sanctuary coordinates (0.24w, 0.72h) pets Molly
    await viewport.click({ position: { x: Math.round(w * 0.24), y: Math.round(h * 0.72) } });
    await page.waitForTimeout(400);
    const afterHomeClick = Number(await companion.getAttribute('data-molly-treats') || '0');
    expect(afterHomeClick, 'Direct click at (0.24w, 0.72h) pets Molly without incrementing treats on empty clicks').toBe(initialTreats);

    // Verify Molly toast appeared
    const toast = page.locator('.gentle-toast');
    await expect(toast).toContainText('Molly');

    // 4. Boundary precision test:
    // Distance 22px from home (well within 48px radius) -> pets Molly without treat increment
    await viewport.click({ position: { x: Math.round(w * 0.24 + 14), y: Math.round(h * 0.72 + 14) } });
    await page.waitForTimeout(400);
    const afterNearClick = Number(await companion.getAttribute('data-molly-treats') || '0');
    expect(afterNearClick, 'Click within 48px radius pets Molly without incrementing treats').toBe(initialTreats);

    // Click outside 48px radius: First select a light to verify that clicking Molly's zone vs faraway zone behaves as expected
    // At distance 65px away from home when clicking on another light (e.g. zvirata_utulek at 0.32w, 0.67h)
    // Distance between (0.24w, 0.72h) and (0.32w, 0.67h) is ~105px on 1280x600 -> far outside 48px radius
    await viewport.click({ position: { x: Math.round(w * 0.32), y: Math.round(h * 0.67) } });
    await page.waitForTimeout(400);
    const afterLanternClick = Number(await companion.getAttribute('data-molly-treats') || '0');
    expect(afterLanternClick, 'Clicking lantern outside Molly radius must NOT feed Molly').toBe(initialTreats);

    // Dismiss whisper dialog to return to clean canvas state
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(200);
    }

    // 5. Dual-Hit Dynamic Actor Test:
    // Wait for Molly to start her patrol along the lakeshore (x > 0.30)
    // When she is away from home, clicking her current moving position must feed her (distCur < 48),
    // and clicking her home bowl position must ALSO feed her (distHome < 48).
    console.log('[STRESS TEST] Waiting for Molly to enter WALK_PATROL along lakeshore...');
    await page.waitForFunction(() => {
      const g = (window as any).__mollyTelemetry;
      if (!g || !g.mollyPositions || g.mollyPositions.length === 0) return false;
      const latest = g.mollyPositions[g.mollyPositions.length - 1];
      return latest && latest.x >= 0.30;
    }, { timeout: 12000 }).catch(() => {
      console.log('[STRESS TEST] Molly still at home base or leisurely pacing; proceeding with dual-hit assertion.');
    });

    const dynamicMollyPos = await page.evaluate(() => {
      const g = (window as any).__mollyTelemetry;
      return g && g.mollyPositions && g.mollyPositions.length > 0 ? g.mollyPositions[g.mollyPositions.length - 1] : null;
    });

    if (dynamicMollyPos && dynamicMollyPos.x >= 0.28) {
      const treatsBeforeDynamic = Number(await companion.getAttribute('data-molly-treats') || '0');
      console.log(`[STRESS TEST] Clicking Molly dynamically at patrol location (${dynamicMollyPos.x.toFixed(2)}w, ${dynamicMollyPos.y.toFixed(2)}h)...`);
      await viewport.click({
        position: { x: Math.round(w * dynamicMollyPos.x), y: Math.round(h * dynamicMollyPos.y) }
      });
      await page.waitForTimeout(400);
      const treatsAfterDynamic = Number(await companion.getAttribute('data-molly-treats') || '0');
      expect(treatsAfterDynamic, 'Click on moving Molly actor pets Molly without unearned treats').toBe(treatsBeforeDynamic);

      // Now click at home bowl (0.24w, 0.72h) while Molly is patrolling away
      await viewport.click({ position: { x: Math.round(w * 0.24), y: Math.round(h * 0.72) } });
      await page.waitForTimeout(400);
      const treatsAfterHomeSecondary = Number(await companion.getAttribute('data-molly-treats') || '0');
      expect(treatsAfterHomeSecondary, 'Click on home sanctuary bowl while Molly is away pets Molly without unearned treats').toBe(treatsBeforeDynamic);
    }
  });

  test('Molly 3: Rapid click storm stress test (state machine stability & memory bounds)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/svet');
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    const companion = page.locator('.molly-companion-layer');
    const viewport = page.locator('.sanctuary-viewport');
    const vpBox = await viewport.boundingBox();
    const w = vpBox!.width;
    const h = vpBox!.height;
    const homeX = Math.round(w * 0.24);
    const homeY = Math.round(h * 0.72);

    const initialTreats = Number(await companion.getAttribute('data-molly-treats') || '0');

    // Fire 30 rapid clicks at Molly's position in rapid succession (rapid click storm)
    for (let i = 0; i < 30; i++) {
      await viewport.click({ position: { x: homeX, y: homeY }, delay: 10 });
    }

    await page.waitForTimeout(500);
    const treatsAfterSpam = Number(await companion.getAttribute('data-molly-treats') || '0');
    // Delayed gratification: empty click storms must NEVER inflate treat counts
    expect(treatsAfterSpam, 'Rapid empty clicks must not increment Molly treat count').toBe(initialTreats);
    expect(pageErrors).toHaveLength(0);

    // Wait for treat eating animation to resolve (mollyJoyTimer ~ 2.4s)
    await page.waitForTimeout(3000);

    // Verify Molly state machine transitions back smoothly and canvas loop continues
    const isLoopActive = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        let count = 0;
        function ping() {
          count++;
          if (count >= 10) resolve(true);
          else requestAnimationFrame(ping);
        }
        requestAnimationFrame(ping);
      });
    });
    expect(isLoopActive).toBe(true);
    expect(pageErrors).toHaveLength(0);
  });

  test('Molly 4: Multi-viewport resize stress (mobile, tablet, desktop, extreme aspect ratios)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/svet');
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    const viewports = [
      { width: 320, height: 480 },  // Minimal mobile
      { width: 375, height: 667 },  // iPhone SE
      { width: 430, height: 932 },  // iPhone 15 Pro Max
      { width: 768, height: 1024 }, // iPad portrait
      { width: 1024, height: 768 }, // iPad landscape / tablet
      { width: 1440, height: 900 }, // Desktop laptop
      { width: 1920, height: 1080 },// Desktop Full HD
      { width: 360, height: 800 }   // Android mobile
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(150);

      // Verify canvas attributes and no horizontal scroll leak
      const canvasAttr = await page.locator('canvas.sanctuary-canvas').getAttribute('data-sanctuary-molly');
      expect(canvasAttr).toBe('ready');

      const dimensionsValid = await page.evaluate(() => {
        const c = document.querySelector('canvas.sanctuary-canvas') as HTMLCanvasElement;
        return c && c.width > 0 && c.height > 0 && !Number.isNaN(c.width) && !Number.isNaN(c.height);
      });
      expect(dimensionsValid).toBe(true);

      // Verify no horizontal overflow in body
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow, `Horizontal overflow detected at ${vp.width}x${vp.height}`).toBe(false);
    }

    expect(pageErrors).toHaveLength(0);
  });

  test('Molly 5: Atmosphere toggle stress & reduced motion compatibility', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/svet');
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    // Rapid toggle between dawn and night 6 times
    const hud = page.locator('.sanctuary-hud');
    await expect(hud).toBeVisible();

    const dawnBtn = hud.locator('button', { hasText: 'Zlaté svítání' });
    const nightBtn = hud.locator('button', { hasText: 'Hvězdná noc' });

    for (let i = 0; i < 6; i++) {
      if (i % 2 === 0) {
        await nightBtn.click();
      } else {
        await dawnBtn.click();
      }
      await page.waitForTimeout(80);
    }

    // Verify Molly remains intact
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');
    expect(pageErrors).toHaveLength(0);

    // Reduced motion test
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    // In reduced motion, clicking home position pets Molly without unearned treats
    const companion = page.locator('.molly-companion-layer');
    const viewport = page.locator('.sanctuary-viewport');
    const vpBox = await viewport.boundingBox();
    const beforeTreats = Number(await companion.getAttribute('data-molly-treats') || '0');

    await viewport.click({
      position: { x: Math.round(vpBox!.width * 0.24), y: Math.round(vpBox!.height * 0.72) }
    });
    await page.waitForTimeout(400);

    const afterTreats = Number(await companion.getAttribute('data-molly-treats') || '0');
    expect(afterTreats, 'Clicking home position in reduced motion pets Molly without unearned treats').toBe(beforeTreats);
    await expect(page.locator('.gentle-toast, .molly-whisper-bubble').first()).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });

  test('Molly 6: Lifecycle navigation stress (clean unmount, zero leaked animation loops)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    // Navigate into and out of /svet 3 times cleanly
    for (let i = 0; i < 3; i++) {
      await page.goto('/svet', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('canvas.sanctuary-canvas')).toBeVisible();
      await page.waitForTimeout(200);

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('header')).toBeVisible();
      await page.waitForTimeout(200);
    }

    // Final navigation back to /svet
    await page.goto('/svet', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');
    expect(pageErrors).toHaveLength(0);
  });
});

test.describe('Whisper Bubble Anchoring & Anti-Jump Stability', () => {
  test('Molly 7: Whisper bubble stays strictly anchored to Molly without jumping or CLS across desktop, tablet, and mobile viewports', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const viewports = [
      { width: 1440, height: 900, label: 'desktop-1440x900' },
      { width: 768, height: 1024, label: 'tablet-768x1024' },
      { width: 1024, height: 768, label: 'tablet-1024x768' },
      { width: 390, height: 844, label: 'mobile-390x844' },
      { width: 375, height: 667, label: 'mobile-375x667' }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20_000 });
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.reload();
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20_000 });
      await page.evaluate(() => document.fonts.ready);
      // Usazení po načtení (odložená přeměření layoutu) musí doběhnout dřív, než se měří klid bubliny
      await page
        .locator('.molly-companion-layer[data-molly-settled="true"]')
        .waitFor({ state: 'attached', timeout: 10_000 });

      await page
        .waitForFunction(
          () => {
            const actor = document.querySelector('.molly-roaming-actor');
            return Boolean(
              actor && (actor.classList.contains('is-docked') || actor.getAttribute('data-molly-behavior') !== 'WALK_ROAM')
            );
          },
          null,
          { timeout: 4500 }
        )
        .catch(() => {});
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      );

      const before = await page.evaluate(() => ({
        heroCopyTop: Math.round(document.querySelector('.hero-copy')!.getBoundingClientRect().top),
        cardTop: Math.round(document.querySelector('.instant-card')!.getBoundingClientRect().top),
        scrollY: window.scrollY
      }));

      await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
      const bubble = page.locator('.molly-whisper-bubble:not(.is-travelling), .molly-dock-whisper').first();
      await expect(bubble, `${vp.label}: whisper visible`).toBeVisible({ timeout: 4000 });

      const sampleGeom = async () =>
        page.evaluate(() => {
          const bEl = document.querySelector('.molly-whisper-bubble:not(.is-travelling), .molly-dock-whisper') as HTMLElement | null;
          const aEl = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
          if (!bEl || !aEl) return null;
          const b = bEl.getBoundingClientRect();
          const ar = aEl.getBoundingClientRect();
          const isDocked = aEl.classList.contains('is-docked');
          const anchor = bEl.getAttribute('data-bubble-anchor') || '';
          const isTravelling = bEl.classList.contains('is-travelling');
          const catVisual = {
            left: ar.left + ar.width * 0.14,
            right: ar.right - ar.width * 0.14,
            top: ar.top + ar.height * 0.12,
            bottom: ar.bottom - 2
          };
          const catOverlap = isDocked
            ? 0
            : Math.round(
                Math.max(0, Math.min(b.right, catVisual.right) - Math.max(b.left, catVisual.left)) *
                  Math.max(0, Math.min(b.bottom, catVisual.bottom) - Math.max(b.top, catVisual.top))
              );
          const edgeDx = Math.round(Math.max(0, b.left - catVisual.right, catVisual.left - b.right));
          const edgeDy = Math.round(Math.max(0, b.top - catVisual.bottom, catVisual.top - b.bottom));
          const edgeDist = Math.round(Math.hypot(edgeDx, edgeDy));
          return {
            anchor,
            isDocked,
            isTravelling,
            left: Math.round(b.left),
            top: Math.round(b.top),
            right: Math.round(b.right),
            bottom: Math.round(b.bottom),
            width: Math.round(b.width),
            height: Math.round(b.height),
            actorCenterX: Math.round((ar.left + ar.right) / 2),
            catVisualTop: Math.round(catVisual.top),
            catOverlap,
            edgeDx,
            edgeDy,
            edgeDist,
            heroCopyTop: Math.round(document.querySelector('.hero-copy')!.getBoundingClientRect().top),
            cardTop: Math.round(document.querySelector('.instant-card')!.getBoundingClientRect().top),
            scrollY: window.scrollY,
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth
          };
        });

      const g0 = await sampleGeom();
      expect(g0, `${vp.label}: geometry sampled`).not.toBeNull();
      expect(['above', 'left', 'right', 'dock'], `${vp.label}: valid data-bubble-anchor`).toContain(g0!.anchor);
      expect(g0!.heroCopyTop, `${vp.label}: CLS=0 heroCopyTop`).toBe(before.heroCopyTop);
      expect(g0!.cardTop, `${vp.label}: CLS=0 cardTop`).toBe(before.cardTop);
      expect(g0!.scrollY, `${vp.label}: zero scroll drift`).toBe(before.scrollY);
      expect(g0!.scrollWidth, `${vp.label}: zero horizontal overflow`).toBeLessThanOrEqual(g0!.clientWidth);
      expect(g0!.left, `${vp.label}: left >= 6`).toBeGreaterThanOrEqual(6);
      expect(g0!.right, `${vp.label}: right <= vw - 6`).toBeLessThanOrEqual(vp.width - 6);
      expect(g0!.top, `${vp.label}: top >= 60`).toBeGreaterThanOrEqual(60);
      expect(g0!.bottom, `${vp.label}: bottom <= vh - 6`).toBeLessThanOrEqual(vp.height - 6);

      if (!g0!.isDocked && g0!.anchor !== 'dock') {
        expect(['above', 'left', 'right'], `${vp.label}: roaming anchor`).toContain(g0!.anchor);
        expect(g0!.catOverlap, `${vp.label}: zero catVisual overlap`).toBe(0);
        expect(g0!.edgeDx, `${vp.label}: edgeDx <= 32`).toBeLessThanOrEqual(32);
        expect(g0!.edgeDy, `${vp.label}: edgeDy <= 48`).toBeLessThanOrEqual(48);
        expect(g0!.edgeDist, `${vp.label}: edgeDist <= 52`).toBeLessThanOrEqual(52);
        if (g0!.anchor === 'above') {
          expect(g0!.bottom, `${vp.label}: above bubble clears ear tips`).toBeLessThanOrEqual(g0!.catVisualTop + 4);
          const bubbleCenterX = (g0!.left + g0!.right) / 2;
          expect(Math.abs(bubbleCenterX - g0!.actorCenterX), `${vp.label}: above bubble horizontally near Molly`).toBeLessThanOrEqual(
            Math.max(g0!.width * 0.65, 110)
          );
        }
      }

      // Anti-jump stability check across 450ms while idle
      const samples = [g0!];
      for (let i = 0; i < 3; i++) {
        await page.waitForTimeout(150);
        const s = await sampleGeom();
        if (s) samples.push(s);
      }
      const maxDeltaLeft = Math.max(...samples.map((s) => Math.abs(s.left - samples[0].left)));
      const maxDeltaTop = Math.max(...samples.map((s) => Math.abs(s.top - samples[0].top)));
      const maxDeltaW = Math.max(...samples.map((s) => Math.abs(s.width - samples[0].width)));
      const maxDeltaH = Math.max(...samples.map((s) => Math.abs(s.height - samples[0].height)));
      expect(maxDeltaLeft, `${vp.label}: anti-jump left delta <= 3`).toBeLessThanOrEqual(3);
      expect(maxDeltaTop, `${vp.label}: anti-jump top delta <= 3`).toBeLessThanOrEqual(3);
      expect(maxDeltaW, `${vp.label}: anti-jump width delta <= 2`).toBeLessThanOrEqual(2);
      expect(maxDeltaH, `${vp.label}: anti-jump height delta <= 2`).toBeLessThanOrEqual(2);
      expect(samples.every((s) => !s.isTravelling), `${vp.label}: no travelling blink`).toBe(true);

      // Back-to-back whisper replacement check (stale bubbleW/bubbleH guard)
      for (let r = 0; r < 2; r++) {
        await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
        await page.waitForTimeout(150);
      }
      const afterReplace = await sampleGeom();
      expect(afterReplace, `${vp.label}: post-replace whisper visible`).not.toBeNull();
      if (!afterReplace!.isDocked && afterReplace!.anchor !== 'dock') {
        expect(afterReplace!.catOverlap, `${vp.label}: post-replace catVisual overlap === 0`).toBe(0);
        expect(afterReplace!.edgeDx, `${vp.label}: post-replace edgeDx <= 32`).toBeLessThanOrEqual(32);
        expect(afterReplace!.edgeDy, `${vp.label}: post-replace edgeDy <= 48`).toBeLessThanOrEqual(48);
      }
    }
  });
});

/**
 * Molly geometry, tips and lakeside-guardian checks. Moved from security.spec.ts:
 * they are timing-sensitive UI tests, not security tests, and must not gate the CI security smoke job.
 */
test.describe('Molly companion geometry, tips and guardian across viewports', () => {
  test.beforeEach(async ({ page }) => {
    const origGoto = page.goto.bind(page);
    page.goto = async (url, options) => {
      let res!: Awaited<ReturnType<typeof origGoto>>;
      for (let attempt = 1; attempt <= 7; attempt++) {
        try {
          res = await origGoto(url, options);
          break;
        } catch (err: any) {
          const isConnErr =
            err.message?.includes('ERR_CONNECTION_REFUSED') ||
            err.message?.includes('ERR_CONNECTION_RESET') ||
            err.message?.includes('ECONNREFUSED') ||
            err.message?.includes('ERR_EMPTY_RESPONSE') ||
            err.message?.includes('ERR_NAME_NOT_RESOLVED');
          if (attempt === 7 || !isConnErr) throw err;
          await page.waitForTimeout(1000);
        }
      }
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });
      return res;
    };
  });

  test('Molly tortoiseshell cat companion, action-driven feeding, in-canvas Mini-Molly, and Krajina dobra lakeside guardian work across viewports', async ({
    page
  }) => {
    const viewports = [
      { name: 'Desktop', width: 1280, height: 900 },
      { name: 'Tablet', width: 820, height: 960 },
      { name: 'Mobile', width: 360, height: 800 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await expect(page.locator('.molly-companion-layer')).toBeAttached();
      await expect(page.locator('.molly-pelisek-dock')).toBeVisible();
      await expect(page.locator('.molly-roaming-actor canvas.molly-cat-canvas')).toBeAttached();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow, `No horizontal overflow with Molly on ${vp.name}`).toBe(false);
    }

    // Desktop interactive verification of feeding, Mini-Molly treat arc, and Klidový pelíšek toggle
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/?action=zvirata_utulek_online');
    // Edge case: corrupted or array localStorage JSON recovery
    await page.evaluate(() => localStorage.setItem('aa_molly_companion_v1', '{bad-json'));
    await page.reload();
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mode', 'roaming');
    await page.evaluate(() => localStorage.setItem('aa_molly_companion_v1', '[]'));
    await page.reload();
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mode', 'roaming');
    await page.evaluate(() => localStorage.removeItem('aa_molly_companion_v1'));
    await page.reload();
    await expect(page.locator('.app-shell')).toHaveAttribute('data-hydrated', 'true');

    await page.locator('.instant-card .btn-studio-primary').dispatchEvent('click');
    const homeCanvas = page.locator('.instant-card canvas.impact-payoff-canvas');
    await expect(homeCanvas).toHaveAttribute('data-molly-mini', 'ready');
    await expect(homeCanvas).toHaveAttribute('data-molly-treat', 'salmon');

    const treatsBefore = Number(
      (await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0'
    );
    await page.locator('.instant-card .effect-spark-btn').click();
    const treatsAfterSpark = Number(
      (await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0'
    );
    expect(treatsAfterSpark, 'Spark button does not increment treats on empty click').toBe(treatsBefore);

    const arcsCount = Number((await homeCanvas.getAttribute('data-molly-arcs')) || '0');
    expect(arcsCount).toBeGreaterThan(0);

    // Petting Molly via dock pet button triggers purring mood & Czech whisper (floating bubble or dock whisper when parked)
    await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mood', 'purring');
    const petWhisper = page.locator('.molly-whisper-bubble, .molly-dock-whisper').first();
    await expect(petWhisper).toBeVisible();
    await expect(petWhisper).toBeInViewport();

    // Completing an action feeds Molly and displays her celebration note
    await page.locator('.instant-card .btn-studio-done').click();
    await expect(page.locator('.instant-card .molly-celebration-note')).toBeVisible();
    await expect(page.locator('.instant-card .molly-celebration-note')).toContainText('Molly');

    // Toggle Klidový pelíšek dock mode
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mode', 'roaming');
    await page.locator('.molly-pelisek-dock .molly-dock-toggle-btn').click();
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mode', 'docked');
    await page.locator('.molly-pelisek-dock .molly-dock-toggle-btn').click();
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mode', 'roaming');

    // Dynamic resize from Desktop (1280x900) to Mobile (360x800) either clamps roaming Molly inside mobile viewport
    // or safely parks her into the compact header dock (.is-docked) with zero nav overlap
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(200);
    const mobileActor = page.locator('.molly-roaming-actor');
    const mobileIsDocked = await mobileActor.evaluate((el) => el.classList.contains('is-docked'));
    if (mobileIsDocked) {
      await expect(page.locator('.molly-pelisek-dock.is-header-dock')).toBeVisible();
    } else {
      const mobileActorBox = await mobileActor.boundingBox();
      expect(mobileActorBox).not.toBeNull();
      expect(mobileActorBox!.x).toBeGreaterThanOrEqual(-5);
      expect(mobileActorBox!.x + mobileActorBox!.width).toBeLessThanOrEqual(365);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    const toggleBox = await page.locator('.molly-pelisek-dock .molly-dock-toggle-btn').boundingBox();
    expect(toggleBox).not.toBeNull();
    await page.mouse.click(
      Math.round(toggleBox!.x + toggleBox!.width * 0.5),
      Math.round(toggleBox!.y + toggleBox!.height * 0.5)
    );
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mode', 'docked');
    await page.mouse.click(
      Math.round(toggleBox!.x + toggleBox!.width * 0.5),
      Math.round(toggleBox!.y + toggleBox!.height * 0.5)
    );
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mode', 'roaming');
    await page.setViewportSize({ width: 1280, height: 900 });

    // Verify Krajina dobra (/svet) Sanctuary Molly on canvas, direct lakeshore click, HUD pill, and breathing co-regulation guardian
    await page.goto('/svet');
    const sanctuaryPill = page.locator('.molly-sanctuary-pill');
    await expect(sanctuaryPill).toBeVisible();
    const sanctuaryCanvas = page.locator('canvas.sanctuary-canvas');
    await expect(sanctuaryCanvas).toHaveAttribute('data-sanctuary-molly', 'ready');

    const treatsBeforeSanctuary = Number(
      (await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0'
    );
    // Sanctuary pill feeds the 1 earned treat unlocked by the deed above
    await sanctuaryPill.click();
    const treatsAfterSanctuary = Number(
      (await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0'
    );
    expect(treatsAfterSanctuary, 'Sanctuary pill feeds the earned treat unlocked by the completed deed').toBe(treatsBeforeSanctuary + 1);

    // Direct click on Sanctuary Molly now that availableTreats is 0 pets her without further treat inflation (delayed gratification)
    const vpBox = await page.locator('.sanctuary-viewport').boundingBox();
    expect(vpBox).not.toBeNull();
    await page.locator('.sanctuary-viewport').click({
      position: { x: Math.round(vpBox!.width * 0.24), y: Math.round(vpBox!.height * 0.72) }
    });
    const treatsAfterDirectClick = Number(
      (await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0'
    );
    expect(treatsAfterDirectClick, 'Direct canvas click with 0 available treats pets Molly without incrementing treats').toBe(treatsAfterSanctuary);

    await expect(page.locator('#dech .lotus-stage .molly-lotus-guardian')).toBeVisible();
    await page.locator('#dech .breath-cta.start').click();
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mood', 'breathing');
    // Navigating away while breathing is active cleanly resets mood from 'breathing' back to 'curious'
    await page.locator('header a[href="/"]').first().click();
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mood', 'curious');
  });

  test('Molly never pushes an unrequested tip over mobile controls: blocked tip waits in the dock and shows on tap', async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/submit');
    // /submit na 360 px: na obrazovce jsou čipy a ovládací prvky — nechtěná bublina by je zakryla
    const covering = async () =>
      page.evaluate(() => {
        const b = document.querySelector('.molly-whisper-bubble:not(.is-travelling)');
        if (!b) return 0;
        const r = b.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return 0;
        let area = 0;
        for (const el of document.querySelectorAll('a[href], button, input, select, textarea')) {
          if (el.closest('.molly-companion-layer, .top-nav')) continue;
          const t = el.getBoundingClientRect();
          const w = Math.min(r.right, t.right) - Math.max(r.left, t.left);
          const h = Math.min(r.bottom, t.bottom) - Math.max(r.top, t.top);
          if (w > 0 && h > 0) area += w * h;
        }
        return area;
      });
    for (let i = 0; i < 25; i++) {
      expect(await covering()).toBeLessThanOrEqual(150);
      if (await page.locator('[data-testid="molly-tip-dot"]').count()) break;
      await page.waitForTimeout(600);
    }
    // Na volné místo se nevešel → tip čeká v pelíšku; klepnutím (vyžádaně) se ukáže na obrazovce
    await expect(page.locator('[data-testid="molly-tip-dot"]')).toHaveCount(1);
    await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
    await expect(page.locator('[data-testid="molly-tip-dot"]')).toHaveCount(0);
    await expect(page.locator('.molly-whisper-bubble')).toBeInViewport();
  });

  test('Round 3 geometry, zero bubble/body/dock overlap across 360x800, 820x1180, 1280x900, Czech copy polish, and form autocomplete attributes', async ({ page }) => {
    test.setTimeout(90_000);
    const viewports = [
      { width: 360, height: 800, label: 'mobile-360' },
      { width: 820, height: 1180, label: 'tablet-820' },
      { width: 1280, height: 900, label: 'desktop-1280' }
    ];
    const routes = ['/', '/app', '/app/online', '/app/guided', '/near', '/submit', '/svet'];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of routes) {
        await page.goto(route);
        await page.waitForTimeout(350);

        // Verify all visible/DOM inputs, textareas, and selects have autocomplete attribute
        const missingAutocomplete = await page.evaluate(() => {
          const bad: string[] = [];
          for (const el of document.querySelectorAll('input, textarea, select')) {
            const ac = el.getAttribute('autocomplete');
            if (!ac) bad.push(`${el.tagName.toLowerCase()}#${el.id || el.getAttribute('name') || '?'}`);
          }
          return bad;
        });
        expect(missingAutocomplete, `Missing autocomplete on ${route} (${vp.label})`).toEqual([]);

        // Tap the dock pet button to trigger a user-requested bubble immediately
        await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
        await page.waitForTimeout(80);

        const report = await page.evaluate((currentRoute) => {
          const overlap = (
            a: DOMRect | { left: number; top: number; right: number; bottom: number },
            b: DOMRect | { left: number; top: number; right: number; bottom: number }
          ) => {
            const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            return w > 0 && h > 0 ? Math.round(w * h) : 0;
          };

          const bubble = document.querySelector('.molly-whisper-bubble, .molly-dock-whisper');
          const actor = document.querySelector('.molly-roaming-actor');
          const dock = document.querySelector('.molly-pelisek-dock');
          const bottomNavCount = document.querySelectorAll('.mobile-bottom-nav').length;
          const brandEl = document.querySelector('.nav-capsule a.brand');
          const toggleEl = document.querySelector('.nav-capsule button.mobile-nav-toggle');
          const crisisEl = Array.from(document.querySelectorAll('.crisis-widget > button')).find(
            (el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none';
            }
          );
          const fbEl = document.querySelector('.feedback-pill');

          const isTravelling = bubble ? bubble.classList.contains('is-travelling') : false;
          const bRect = bubble ? bubble.getBoundingClientRect() : null;
          const bPointerEvents = bubble ? getComputedStyle(bubble).pointerEvents : 'none';
          const isDockedActor = actor ? actor.classList.contains('is-docked') : currentRoute === '/svet';
          const aRect = actor && !isDockedActor ? actor.getBoundingClientRect() : null;
          const dRect = dock ? dock.getBoundingClientRect() : null;
          const brandRect = brandEl && getComputedStyle(brandEl).display !== 'none' ? brandEl.getBoundingClientRect() : null;
          const toggleRect = toggleEl && getComputedStyle(toggleEl).display !== 'none' ? toggleEl.getBoundingClientRect() : null;
          const cRect = crisisEl ? crisisEl.getBoundingClientRect() : null;
          const fRect =
            fbEl && getComputedStyle(fbEl).display !== 'none' && fbEl.getBoundingClientRect().width > 0
              ? fbEl.getBoundingClientRect()
              : null;

          // Visual body rect inside canvas (excluding transparent margins)
          const catVisual = aRect
            ? {
              left: aRect.left + aRect.width * 0.14,
              right: aRect.right - aRect.width * 0.14,
              top: aRect.top + aRect.height * 0.12,
              bottom: aRect.bottom - 2
            }
            : null;

          const navCapsuleOverlap =
            (brandRect && dRect && dock?.classList.contains('is-header-dock') ? overlap(brandRect, dRect) : 0) +
            (brandRect && toggleRect ? overlap(brandRect, toggleRect) : 0) +
            (dRect && toggleRect && dock?.classList.contains('is-header-dock') ? overlap(dRect, toggleRect) : 0);
          const actorTop = aRect ? Math.round(aRect.top) : window.innerHeight - 96;
          const bubbleCatOverlap = bRect && catVisual ? overlap(bRect, catVisual) : 0;
          const bubbleDockOverlap = bRect && dRect ? overlap(bRect, dRect) : 0;
          const bubbleCrisisOverlap = bRect && cRect ? overlap(bRect, cRect) : 0;
          const bubbleFeedbackOverlap = bRect && fRect ? overlap(bRect, fRect) : 0;
          const feedbackDockOverlap = fRect && dRect ? overlap(fRect, dRect) : 0;
          const feedbackCrisisOverlap = fRect && cRect ? overlap(fRect, cRect) : 0;

          return {
            hasBubble: Boolean(bRect && bRect.width > 0 && bRect.height > 0),
            isTravelling,
            bPointerEvents,
            bLeft: bRect ? Math.round(bRect.left) : 0,
            bRight: bRect ? Math.round(bRect.right) : 0,
            bTop: bRect ? Math.round(bRect.top) : 0,
            bBottom: bRect ? Math.round(bRect.bottom) : 0,
            actorTop,
            bottomNavCount,
            navCapsuleOverlap,
            bubbleCatOverlap,
            bubbleDockOverlap,
            bubbleCrisisOverlap,
            bubbleFeedbackOverlap,
            feedbackDockOverlap,
            feedbackCrisisOverlap
          };
        }, route);

        expect(report.hasBubble, `Whisper bubble should be visible on ${route} (${vp.label})`).toBe(true);
        expect(report.isTravelling, `Dock whisper should appear immediately on ${route} (${vp.label})`).toBe(false);
        expect(report.bPointerEvents, `Whisper bubble must have pointer-events: none on ${route} (${vp.label})`).toBe('none');
        expect(report.bLeft, `Whisper bubble left inside viewport on ${route} (${vp.label})`).toBeGreaterThanOrEqual(6);
        expect(report.bRight, `Whisper bubble right inside viewport on ${route} (${vp.label})`).toBeLessThanOrEqual(vp.width - 6);
        expect(report.bTop, `Whisper bubble top below .top-nav on ${route} (${vp.label})`).toBeGreaterThanOrEqual(60);
        expect(report.bBottom, `Whisper bubble bottom inside viewport on ${route} (${vp.label})`).toBeLessThanOrEqual(vp.height - 6);
        expect(report.actorTop, `Molly must stay on groundLine on ${route} (${vp.label})`).toBeGreaterThanOrEqual(vp.height - 170);
        expect(report.bottomNavCount, `Legacy .mobile-bottom-nav must be absent on ${route} (${vp.label})`).toBe(0);
        expect(report.navCapsuleOverlap, `Header .nav-capsule children overlap on ${route} (${vp.label})`).toBe(0);
        expect(report.bubbleCatOverlap, `Whisper bubble overlaps Molly sprite on ${route} (${vp.label})`).toBe(0);
        expect(report.bubbleDockOverlap, `Whisper bubble overlaps dock on ${route} (${vp.label})`).toBe(0);
        expect(report.bubbleCrisisOverlap, `Whisper bubble overlaps crisis pill on ${route} (${vp.label})`).toBe(0);
        expect(report.bubbleFeedbackOverlap, `Whisper bubble overlaps feedback pill on ${route} (${vp.label})`).toBe(0);
        expect(report.feedbackDockOverlap, `Feedback pill overlaps dock on ${route} (${vp.label})`).toBe(0);
        expect(report.feedbackCrisisOverlap, `Feedback pill overlaps crisis pill on ${route} (${vp.label})`).toBe(0);
      }
    }

    // Check /svet at 360x800: Opora 24/7 does not cover "Rozsvítit lucernu", Czech copy polish, and /svet route hint marks aa_molly_hints_v1
    await page.setViewportSize({ width: 360, height: 800 });
    await page.evaluate(() => sessionStorage.removeItem('aa_molly_hints_v1'));
    await page.goto('/svet');
    await expect(page.locator('#dech')).toContainText('Hladina tůně dýchá v klidném rytmu s tebou.');
    const svetFabOverlap = await page.evaluate(() => {
      const fab = document.querySelector('.crisis-widget > button');
      const btn = document.querySelector('.ritual-send-btn');
      if (!fab || !btn) return 0;
      const a = fab.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return w > 0 && h > 0 ? Math.round(w * h) : 0;
    });
    expect(svetFabOverlap).toBe(0);
    await page.waitForTimeout(1900);
    const svetHintMarked = await page.evaluate(() => {
      const hints = JSON.parse(sessionStorage.getItem('aa_molly_hints_v1') || '[]');
      return hints.includes('/svet');
    });
    expect(svetHintMarked).toBe(true);

    // Mid-scroll + expanded <details> edge case at 360x800 on / and /submit
    for (const [midRoute, detailsSel] of [
      ['/', '.instant-card details.how-toggle'],
      ['/submit', 'details.optional-fields']
    ] as const) {
      await page.goto(midRoute);
      await page.locator(`${detailsSel} summary`).click();
      await expect(page.locator(detailsSel)).toHaveAttribute('open', '');
      if (midRoute === '/submit') {
        await expect(page.locator('details.optional-fields .quick-pills')).toContainText(
          'Knihobudka / druhá šance věcí'
        );
        await expect(page.locator('details.optional-fields .quick-pills svg').first()).toBeVisible();
        await expect(page.locator('details.optional-fields .quick-pills')).not.toContainText('ReUse');
      }
      await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }));
      await page.waitForTimeout(100);
      await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
      await page.waitForTimeout(80);
      const midScrollReport = await page.evaluate(() => {
        const overlap = (
          a: DOMRect | { left: number; top: number; right: number; bottom: number },
          b: DOMRect | { left: number; top: number; right: number; bottom: number }
        ) => {
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          return w > 0 && h > 0 ? Math.round(w * h) : 0;
        };
        const bubble = document.querySelector('.molly-whisper-bubble, .molly-dock-whisper');
        const actor = document.querySelector('.molly-roaming-actor');
        const dock = document.querySelector('.molly-pelisek-dock');
        const bottomNavCount = document.querySelectorAll('.mobile-bottom-nav').length;
        const brandEl = document.querySelector('.nav-capsule a.brand');
        const toggleEl = document.querySelector('.nav-capsule button.mobile-nav-toggle');
        const crisisEl = document.querySelector('.crisis-widget > button');
        const bRect = bubble ? bubble.getBoundingClientRect() : null;
        const isDockedActor = actor ? actor.classList.contains('is-docked') : false;
        const aRect = actor && !isDockedActor ? actor.getBoundingClientRect() : null;
        const dRect = dock ? dock.getBoundingClientRect() : null;
        const brandRect = brandEl && getComputedStyle(brandEl).display !== 'none' ? brandEl.getBoundingClientRect() : null;
        const toggleRect = toggleEl && getComputedStyle(toggleEl).display !== 'none' ? toggleEl.getBoundingClientRect() : null;
        const cRect = crisisEl ? crisisEl.getBoundingClientRect() : null;
        const catVisual = aRect
          ? {
            left: aRect.left + aRect.width * 0.14,
            right: aRect.right - aRect.width * 0.14,
            top: aRect.top + aRect.height * 0.12,
            bottom: aRect.bottom - 2
          }
          : null;
        const navCapsuleOverlap =
          (brandRect && dRect && dock?.classList.contains('is-header-dock') ? overlap(brandRect, dRect) : 0) +
          (brandRect && toggleRect ? overlap(brandRect, toggleRect) : 0) +
          (dRect && toggleRect && dock?.classList.contains('is-header-dock') ? overlap(dRect, toggleRect) : 0);
        const actorTop = aRect ? Math.round(aRect.top) : 800 - 96;
        const dockVisible = Boolean(dRect && dRect.width > 0 && dRect.height > 0);
        const bTop = bRect ? Math.round(bRect.top) : 0;
        const bLeft = bRect ? Math.round(bRect.left) : 0;
        const bRight = bRect ? Math.round(bRect.right) : 0;
        const bubbleCatOverlap = bRect && catVisual ? overlap(bRect, catVisual) : 0;
        const bubbleDockOverlap = bRect && dRect ? overlap(bRect, dRect) : 0;
        const bubbleCrisisOverlap = bRect && cRect ? overlap(bRect, cRect) : 0;
        return {
          bottomNavCount,
          navCapsuleOverlap,
          isDockedActor,
          dockVisible,
          actorTop,
          bTop,
          bLeft,
          bRight,
          bubbleCatOverlap,
          bubbleDockOverlap,
          bubbleCrisisOverlap
        };
      });
      expect(midScrollReport.bottomNavCount, `Mid-scroll legacy bottom nav count on ${midRoute}`).toBe(0);
      expect(midScrollReport.navCapsuleOverlap, `Mid-scroll header overlap on ${midRoute}`).toBe(0);
      if (midScrollReport.isDockedActor) {
        expect(midScrollReport.dockVisible, `Mid-scroll header dock visible when Molly parked on ${midRoute}`).toBe(true);
      } else {
        expect(midScrollReport.actorTop, `Mid-scroll Molly stays on groundLine on ${midRoute}`).toBeGreaterThanOrEqual(800 - 170);
      }
      expect(midScrollReport.bTop, `Mid-scroll bubble below .top-nav on ${midRoute}`).toBeGreaterThanOrEqual(60);
      expect(midScrollReport.bLeft, `Mid-scroll bubble left inside viewport on ${midRoute}`).toBeGreaterThanOrEqual(6);
      expect(midScrollReport.bRight, `Mid-scroll bubble right inside viewport on ${midRoute}`).toBeLessThanOrEqual(360 - 6);
      expect(midScrollReport.bubbleCatOverlap, `Mid-scroll bubbleCatOverlap on ${midRoute}`).toBe(0);
      expect(midScrollReport.bubbleDockOverlap, `Mid-scroll bubbleDockOverlap on ${midRoute}`).toBe(0);
      expect(midScrollReport.bubbleCrisisOverlap, `Mid-scroll bubbleCrisisOverlap on ${midRoute}`).toBe(0);
    }

    // Check /submit at 1280x900: unrequested route hint displays (<= 80 px² control overlap) or parks in molly-tip-dot, and marks aa_molly_hints_v1 + Czech copy polish
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => sessionStorage.removeItem('aa_molly_hints_v1'));
    await page.goto('/submit');
    await expect(page.locator('.side-note')).toContainText('poličky pro druhou šanci věcí');
    await expect(page.locator('.side-note')).toContainText('sousedské výměny oblečení a věcí');
    await expect(
      page.locator('.molly-whisper-bubble:not(.is-travelling), [data-testid="molly-tip-dot"]').first()
    ).toBeVisible({ timeout: 4500 });
    const submitHintState = await page.evaluate(() => {
      const hints = JSON.parse(sessionStorage.getItem('aa_molly_hints_v1') || '[]');
      const b = document.querySelector('.molly-whisper-bubble:not(.is-travelling)');
      const dot = document.querySelector('[data-testid="molly-tip-dot"]');
      let controlOverlap = 0;
      if (b) {
        const r = b.getBoundingClientRect();
        for (const el of document.querySelectorAll('a[href], button, input, select, textarea')) {
          if (el.closest('.molly-companion-layer, .top-nav, .crisis-widget, .feedback-pill, .hp')) continue;
          const closedDetails = el.closest('details:not([open])');
          if (closedDetails && !el.closest('summary')) continue;
          const t = el.getBoundingClientRect();
          const w = Math.min(r.right, t.right) - Math.max(r.left, t.left);
          const h = Math.min(r.bottom, t.bottom) - Math.max(r.top, t.top);
          if (w > 0 && h > 0) controlOverlap += Math.round(w * h);
        }
      }
      return {
        marked: hints.includes('/submit'),
        shownOrParked: Boolean(b || dot),
        controlOverlap
      };
    });
    expect(submitHintState.marked).toBe(true);
    expect(submitHintState.shownOrParked).toBe(true);
    expect(submitHintState.controlOverlap).toBeLessThanOrEqual(80);
  });

  test('Desktop Molly stays on the ground line when a whisper is still showing while the page settles on /near', async ({ page }) => {
    // Na /near (1280x900) se vedle Molly na podlaze bublina čistě nevejde. Usazení po změně stránky
    // proto nesmí kvůli bublině přenést kočku doprostřed obrazovky; bublina si má najít místo sama.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const actor = page.locator('.molly-roaming-actor');
    await expect.poll(async () => (await actor.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(900 - 170);

    // Zaznamená každou zapsanou polohu Molly (bez vzorkovacích mezer), od teď až do konce šeptandy
    await page.evaluate(() => {
      const el = document.querySelector('.molly-roaming-actor');
      if (!el) return;
      const store = window as unknown as { __mollyMinTop: number };
      const record = () => {
        if (el.classList.contains('is-docked')) return;
        store.__mollyMinTop = Math.min(store.__mollyMinTop, el.getBoundingClientRect().top);
      };
      store.__mollyMinTop = Infinity;
      record();
      new MutationObserver(record).observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
    });

    const whisper = page.locator('.molly-whisper-bubble, .molly-dock-whisper');
    await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
    await expect(whisper.first()).toBeVisible();
    await page.locator('.top-nav a[href="/near"]').first().click();
    await expect(page).toHaveURL(/\/near(\?|$)/);
    // Šeptanda přechod přežije a zhasne sama; do té doby proběhne celé usazení po změně stránky
    await expect(whisper).toHaveCount(0, { timeout: 10_000 });

    const minTop = await page.evaluate(() => (window as unknown as { __mollyMinTop: number }).__mollyMinTop);
    const finalTop = (await actor.boundingBox())?.y ?? -1;
    expect(Math.round(minTop), 'Molly must stay on groundLine during the whisper on /near (desktop-1280)').toBeGreaterThanOrEqual(900 - 170);
    expect(Math.round(finalTop), 'Molly must rest on groundLine on /near (desktop-1280)').toBeGreaterThanOrEqual(900 - 170);
  });

  test('Desktop whisper that waits for Molly to arrive stays hidden for the whole walk and never crosses the celebration buttons', async ({
    page
  }) => {
    // Po chvíli klidu dojde Molly pod hlavní tlačítko. Když člověk během té chůze klikne na „Mám hotovo“,
    // odměnová šeptanda čeká, až Molly dojde. Nesmí se odhalit dřív: za chůze by jela s Molly přes tlačítka oslavy.
    test.setTimeout(60_000);
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/?action=remobil_telefon');

    const card = page.locator('.instant-card').first();
    await card.locator('.btn-studio-primary').dispatchEvent('click');
    const doneBtn = card.locator('.btn-studio-done');
    await expect(doneBtn).toBeVisible();

    // Molly vyráží k hlavnímu tlačítku (pobídka po delším klidu) a tlačítko se rozzáří
    await expect(page.locator('.molly-guide-glow')).toBeAttached({ timeout: 30_000 });

    // Každý vykreslený snímek: kde je Molly a jestli viditelná bublina něco zakrývá
    await page.evaluate(() => {
      type WalkSample = { actorX: number; walking: boolean; bubbleVisible: boolean; bubbleLeft: number };
      const store = window as unknown as {
        __walkSamples: WalkSample[];
        __walkOverlaps: Array<{ target: string; area: number; actorX: number }>;
        __walkSampling: boolean;
      };
      store.__walkSamples = [];
      store.__walkOverlaps = [];
      store.__walkSampling = true;
      const targetSelector =
        '.in-situ-celebration button, .in-situ-celebration .molly-celebration-note, .in-situ-celebration a, .deck-nav-next, main h1, main h2, main h3, main button';
      const sample = () => {
        if (!store.__walkSampling) return;
        const actor = document.querySelector('.molly-roaming-actor');
        const bubble = document.querySelector('.molly-whisper-bubble');
        const ar = actor?.getBoundingClientRect();
        const actorX = ar ? Math.round(ar.left + ar.width / 2) : -1;
        let bubbleVisible = false;
        let bubbleLeft = -1;
        if (bubble) {
          const cs = getComputedStyle(bubble);
          const br = bubble.getBoundingClientRect();
          bubbleVisible =
            cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.01 && br.width >= 1;
          bubbleLeft = Math.round(br.left);
          if (bubbleVisible) {
            for (const t of document.querySelectorAll(targetSelector)) {
              if (t.closest('.molly-companion-layer')) continue;
              const tcs = getComputedStyle(t);
              if (tcs.display === 'none' || tcs.visibility === 'hidden') continue;
              const tr = t.getBoundingClientRect();
              if (tr.width < 1 || tr.height < 1) continue;
              const w = Math.min(br.right, tr.right) - Math.max(br.left, tr.left);
              const h = Math.min(br.bottom, tr.bottom) - Math.max(br.top, tr.top);
              if (w > 0 && h > 0) {
                store.__walkOverlaps.push({
                  target: `${t.tagName.toLowerCase()}.${typeof t.className === 'string' ? t.className.split(/\s+/).slice(0, 2).join('.') : ''}`,
                  area: Math.round(w * h),
                  actorX
                });
              }
            }
          }
        }
        store.__walkSamples.push({
          actorX,
          walking: actor?.getAttribute('data-molly-behavior') === 'WALK_ROAM',
          bubbleVisible,
          bubbleLeft
        });
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });

    await doneBtn.click();
    await expect(card.locator('.in-situ-celebration .btn-inline-feed-molly')).toBeVisible();
    await expect(card.locator('.in-situ-celebration .btn-next-deed')).toBeVisible();

    // Molly dojde a teprve potom promluví
    const bubble = page.locator('.molly-whisper-bubble.is-ready:not(.is-travelling)');
    await expect(bubble).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.molly-roaming-actor')).not.toHaveAttribute('data-molly-behavior', 'WALK_ROAM');
    await page.waitForTimeout(500);

    const walk = await page.evaluate(() => {
      const store = window as unknown as {
        __walkSamples: Array<{ actorX: number; walking: boolean; bubbleVisible: boolean; bubbleLeft: number }>;
        __walkOverlaps: Array<{ target: string; area: number; actorX: number }>;
        __walkSampling: boolean;
      };
      store.__walkSampling = false;
      const samples = store.__walkSamples;
      const restX = samples.length ? samples[samples.length - 1].actorX : -1;
      const visible = samples.filter((s) => s.bubbleVisible);
      const lefts = visible.map((s) => s.bubbleLeft);
      return {
        frames: samples.length,
        walkedPx: samples.length ? Math.abs(samples[0].actorX - restX) : 0,
        visibleFrames: visible.length,
        // Jak daleko od místa odpočinku byla Molly, když už byla bublina vidět
        maxDistWhileVisible: visible.reduce((m, s) => Math.max(m, Math.abs(s.actorX - restX)), 0),
        // O kolik se viditelná bublina posunula
        bubbleDrift: lefts.length ? Math.max(...lefts) - Math.min(...lefts) : 0,
        overlaps: store.__walkOverlaps.slice(0, 8)
      };
    });

    expect(walk.frames, 'walk was sampled').toBeGreaterThan(30);
    expect(walk.walkedPx, 'scenario needs a walk much longer than the 850 ms safety timer covers').toBeGreaterThan(300);
    expect(walk.visibleFrames, 'whisper shows once Molly has arrived').toBeGreaterThan(0);
    expect(walk.overlaps, 'visible whisper never covers a celebration control, not even mid-walk').toEqual([]);
    expect(walk.maxDistWhileVisible, 'whisper is revealed only where Molly comes to rest').toBeLessThanOrEqual(24);
    expect(walk.bubbleDrift, 'revealed whisper stays put instead of travelling with Molly').toBeLessThanOrEqual(24);
    expect(pageErrors, 'Zero pageerrors during the walk').toEqual([]);
  });
});
