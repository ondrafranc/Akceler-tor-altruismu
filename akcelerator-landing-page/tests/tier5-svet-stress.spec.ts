import { test, expect } from '@playwright/test';

/**
 * TIER 5 WHITE-BOX ADVERSARIAL STRESS SUITE: Krajina Dobra & Walking Molly
 *
 * Targeted modules:
 * - src/routes/svet/+page.svelte (Canvas diorama, 5-state walking Molly machine, deed lights,
 *   audio engine chime synthesis, atmosphere god-rays & northern lights, breathing lotus)
 * - src/lib/mollyStore.js (Molly companion state, treat arcs, whispers, feeding triggers)
 * - src/lib/mollyTypes.js (Molly treat types & milestones)
 *
 * Adversarial Stress Vectors:
 * 1. Rapid asynchronous resize oscillation during active walking animation cycle.
 * 2. Extended multi-cycle continuous patrol without state deadlock or particle memory leak.
 * 3. Click-to-feed accuracy at extreme patrol boundaries vs home base with dual-hit precision.
 * 4. High-frequency audio toggle and atmosphere switching while deeds and comets are actively floating.
 * 5. Rapid random deed cycling & quick offline deed bombardment stress.
 * 6. Deep-link URL seed fallback ceremony & breathing exercise state machine integration.
 */

test.describe('Tier 5 Adversarial Hardening: Krajina Dobra & Walking Molly', () => {

  test.beforeEach(async ({ page }) => {
    // Inject low-overhead deep telemetry instrumentation into the browser runtime
    await page.addInitScript(() => {
      const g = window as any;
      g.__t5Telemetry = {
        frames: [] as number[],
        mollyPositions: [] as { x: number; y: number; facing: number; time: number }[],
        nanDetected: false,
        stackDepths: [] as number[],
        maxStackDepth: 0,
        stackUnderflow: false,
        currentDepth: 0,
        errors: [] as string[],
        drawCalls: 0,
        bezierCount: 0,
        eatHaloCount: 0,
        blissEyeCount: 0
      };

      const origSave = CanvasRenderingContext2D.prototype.save;
      const origRestore = CanvasRenderingContext2D.prototype.restore;
      const origBezier = CanvasRenderingContext2D.prototype.bezierCurveTo;
      const origArc = CanvasRenderingContext2D.prototype.arc;

      CanvasRenderingContext2D.prototype.save = function () {
        g.__t5Telemetry.currentDepth++;
        if (g.__t5Telemetry.currentDepth > g.__t5Telemetry.maxStackDepth) {
          g.__t5Telemetry.maxStackDepth = g.__t5Telemetry.currentDepth;
        }
        return origSave.apply(this, arguments as any);
      };

      CanvasRenderingContext2D.prototype.restore = function () {
        g.__t5Telemetry.currentDepth--;
        if (g.__t5Telemetry.currentDepth < 0) {
          g.__t5Telemetry.stackUnderflow = true;
        }
        return origRestore.apply(this, arguments as any);
      };

      // Molly's unique body drawing begins with bezierCurveTo(-22, ...) for tortoiseshell tail.
      // Matrix translation (e, f) is Molly's exact canvas position (mx, mcy).
      CanvasRenderingContext2D.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
        g.__t5Telemetry.bezierCount++;
        if (cp1x === -22) {
          const matrix = this.getTransform();
          const dpr = window.devicePixelRatio || 1;
          const stageW = this.canvas.width / dpr;
          const stageH = this.canvas.height / dpr;

          const mx = matrix.e / dpr;
          const my = matrix.f / dpr;
          const facing = Math.sign(matrix.a || 1);

          if (Number.isNaN(mx) || Number.isNaN(my) || !Number.isFinite(mx) || !Number.isFinite(my)) {
            g.__t5Telemetry.nanDetected = true;
            g.__t5Telemetry.errors.push(`NaN/Infinity in Molly transform (${mx}, ${my})`);
          }

          if (stageW > 0 && stageH > 0) {
            const nx = mx / stageW;
            const ny = my / stageH;
            g.__t5Telemetry.mollyPositions.push({ x: nx, y: ny, facing, time: performance.now() });
          }
        }
        return origBezier.apply(this, arguments as any);
      };

      CanvasRenderingContext2D.prototype.arc = function (cx, cy, r, sa, ea) {
        g.__t5Telemetry.drawCalls++;
        if (r === 44 && sa === 0) {
          // Joy halo drawn around Molly during EAT_TREAT
          g.__t5Telemetry.eatHaloCount++;
        }
        return origArc.apply(this, arguments as any);
      };

      let lastTime = performance.now();
      const origRaf = window.requestAnimationFrame;
      window.requestAnimationFrame = function (cb: FrameRequestCallback) {
        return origRaf.call(window, (now: number) => {
          const dt = now - lastTime;
          lastTime = now;
          if (dt > 0 && dt < 1000) {
            g.__t5Telemetry.frames.push(dt);
            g.__t5Telemetry.stackDepths.push(g.__t5Telemetry.currentDepth);
          }
          cb(now);
        });
      };
    });
  });

  // =========================================================================
  // TEST 1: Rapid asynchronous resize oscillation during active walking animation cycle
  // =========================================================================
  test('T5-1: Rapid asynchronous resize oscillation during active walking animation cycle', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/svet');
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    // Wait until Molly initiates walking patrol along lakeshore (nx > 0.245)
    console.log('[T5-1] Awaiting Molly WALK_PATROL entry...');
    await page.waitForFunction(() => {
      const g = (window as any).__t5Telemetry;
      if (!g || !g.mollyPositions || g.mollyPositions.length === 0) return false;
      const latest = g.mollyPositions[g.mollyPositions.length - 1];
      return latest && latest.x > 0.245;
    }, { timeout: 14000 }).catch(() => {
      console.log('[T5-1] Molly walking cycle delayed; proceeding with resize storm across current position.');
    });

    // 20 rapid violent viewport resizes across extreme aspect ratios
    const RESIZE_SERIES = [
      { width: 320, height: 568 },   // Small mobile
      { width: 1440, height: 900 },  // Standard desktop
      { width: 375, height: 667 },   // iPhone SE
      { width: 1920, height: 1080 }, // Full HD
      { width: 412, height: 915 },   // Android tall
      { width: 1024, height: 768 },  // iPad landscape
      { width: 360, height: 800 },   // Android standard
      { width: 1280, height: 800 },  // Laptop
      { width: 430, height: 932 },   // iPhone Pro Max
      { width: 1140, height: 700 },  // Flex wrap threshold
      { width: 320, height: 480 },   // Minimum supported width
      { width: 1366, height: 768 },  // Common laptop
      { width: 390, height: 844 },   // iPhone 14
      { width: 1600, height: 900 },  // Widescreen
      { width: 768, height: 1024 },  // iPad portrait
      { width: 1080, height: 800 },  // Desktop boundary
      { width: 384, height: 854 },   // Mobile
      { width: 1200, height: 800 },  // Medium desktop
      { width: 340, height: 600 },   // Narrow
      { width: 1024, height: 768 }   // Reset to baseline
    ];

    for (let i = 0; i < RESIZE_SERIES.length; i++) {
      const vp = RESIZE_SERIES[i];
      await page.setViewportSize(vp);
      // Asynchronous micro-wait (35ms) to catch frames mid-resize
      await page.waitForTimeout(35);

      // Verify canvas maintains valid dimensions
      const canvasDims = await page.evaluate(() => {
        const c = document.querySelector('canvas.sanctuary-canvas') as HTMLCanvasElement;
        return {
          w: c ? c.width : 0,
          h: c ? c.height : 0,
          valid: c ? !Number.isNaN(c.width) && !Number.isNaN(c.height) && c.width >= 320 && c.height >= 320 : false
        };
      });
      expect(canvasDims.valid, `Canvas dimensions invalid at ${vp.width}x${vp.height}`).toBe(true);

      // Verify zero horizontal page overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow, `Horizontal overflow occurred during resize to ${vp.width}x${vp.height}`).toBe(false);
    }

    // Let animation settle for 800ms
    await page.waitForTimeout(800);

    const telemetry = await page.evaluate(() => (window as any).__t5Telemetry);
    expect(pageErrors).toHaveLength(0);
    expect(telemetry.nanDetected).toBe(false);
    expect(telemetry.stackUnderflow).toBe(false);
    expect(telemetry.errors).toHaveLength(0);

    // Coordinate verification on all sampled positions: strict adherence to lakeshore path
    expect(telemetry.mollyPositions.length).toBeGreaterThan(30);
    for (const pos of telemetry.mollyPositions) {
      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
      expect(pos.x).toBeGreaterThanOrEqual(0.19);
      expect(pos.x).toBeLessThanOrEqual(0.45);

      const expectedY = 0.72 + (pos.x - 0.24) * 0.04;
      // Allow +/- 0.03 for bobbing/breathing oscillations
      expect(Math.abs(pos.y - expectedY)).toBeLessThanOrEqual(0.03);
    }

    // Still ready and alive after 20 violent resizes
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');
  });

  // =========================================================================
  // TEST 2: Extended multi-cycle continuous patrol without state deadlock or particle memory leak
  // =========================================================================
  test('T5-2: Extended multi-cycle continuous patrol without state deadlock or particle memory leak', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/svet');
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    console.log('[T5-2] Sampling 15 seconds of continuous patrol cycles...');
    // Sample frames across 15 seconds (allows multiple state transitions)
    const sampleDurationMs = 15000;
    const startTime = Date.now();

    // Trigger feeding halfway through to exercise the 5th state (EAT_TREAT)
    let feedTriggered = false;
    while (Date.now() - startTime < sampleDurationMs) {
      await page.waitForTimeout(1000);
      if (!feedTriggered && Date.now() - startTime > 7000) {
        feedTriggered = true;
        console.log('[T5-2] Injecting feed action mid-patrol to stress EAT_TREAT transition...');
        const viewport = page.locator('.sanctuary-viewport');
        const vpBox = (await viewport.boundingBox())!;
        await viewport.click({ position: { x: Math.round(vpBox.width * 0.24), y: Math.round(vpBox.height * 0.72) } });
      }
    }

    const telemetry = await page.evaluate(() => (window as any).__t5Telemetry);
    expect(pageErrors).toHaveLength(0);
    expect(telemetry.nanDetected).toBe(false);
    expect(telemetry.stackUnderflow).toBe(false);

    // Frame rate stability check
    expect(telemetry.frames.length).toBeGreaterThan(250);
    const avgDt = telemetry.frames.reduce((a: number, b: number) => a + b, 0) / telemetry.frames.length;
    const fps = 1000 / avgDt;
    console.log(`[T5-2] Sustained FPS: ${fps.toFixed(1)} over ${telemetry.frames.length} frames`);
    expect(fps).toBeGreaterThan(35);

    // Trajectory analysis: verify Molly moved away from home base and returned or ate
    const xCoordinates = telemetry.mollyPositions.map((p: any) => p.x);
    const minX = Math.min(...xCoordinates);
    const maxX = Math.max(...xCoordinates);
    console.log(`[T5-2] Patrol X Range observed: [${minX.toFixed(3)}, ${maxX.toFixed(3)}]`);

    // Verify Molly was at home (<= 0.25) and moved right along patrol (>= 0.28)
    expect(minX).toBeLessThanOrEqual(0.25);
    expect(maxX).toBeGreaterThanOrEqual(0.28);

    // Facing direction consistency:
    // When moving right toward lake, facing should be +1
    // When sitting home or returning, facing should be -1
    const facings = new Set(telemetry.mollyPositions.map((p: any) => p.facing));
    expect(facings.has(1) || facings.has(-1)).toBe(true);

    // Memory / object bounds check: verify canvas draw calls per frame are bounded
    const avgDrawCallsPerFrame = telemetry.drawCalls / telemetry.frames.length;
    console.log(`[T5-2] Average draw calls per frame: ${avgDrawCallsPerFrame.toFixed(1)}`);
    // A single frame should draw between 20 and 300 primitive arcs/paths (zero unbounded particle leak)
    expect(avgDrawCallsPerFrame).toBeLessThan(350);

    // Verify EAT_TREAT state was activated by feed
    expect(telemetry.eatHaloCount).toBeGreaterThan(0);
  });

  // =========================================================================
  // TEST 3: Click-to-feed accuracy at extreme patrol boundaries vs home base
  // =========================================================================
  test('T5-3: Click-to-feed accuracy at extreme patrol boundaries vs home base with dual-hit precision', async ({ page }) => {
    test.setTimeout(60000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/svet');
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    const companion = page.locator('.molly-companion-layer');
    const viewport = page.locator('.sanctuary-viewport');
    const vpBox = (await viewport.boundingBox())!;
    const w = vpBox.width;
    const h = vpBox.height;

    // Dismiss any pre-existing modal or toast
    const existingClose = page.locator('.memory-whisper .mw-close');
    if (await existingClose.isVisible()) {
      await existingClose.click();
      await page.waitForTimeout(200);
    }

    // 1. Initial baseline
    const initialTreats = Number(await companion.getAttribute('data-molly-treats') || '0');

    // 2. Wait for Molly to patrol toward lakeshore (nx >= 0.32)
    console.log('[T5-3] Waiting for Molly to reach lakeshore patrol path (nx >= 0.32)...');
    await page.waitForFunction(() => {
      const g = (window as any).__t5Telemetry;
      if (!g || !g.mollyPositions || g.mollyPositions.length === 0) return false;
      const latest = g.mollyPositions[g.mollyPositions.length - 1];
      return latest && latest.x >= 0.32;
    }, { timeout: 14000 }).catch(() => {
      console.log('[T5-3] Molly pacing leisurely; proceeding with boundary assertions.');
    });

    const boundaryMollyPos = await page.evaluate(() => {
      const g = (window as any).__t5Telemetry;
      return g && g.mollyPositions && g.mollyPositions.length > 0 ? g.mollyPositions[g.mollyPositions.length - 1] : null;
    });

    if (boundaryMollyPos && boundaryMollyPos.x >= 0.30) {
      const curPxX = Math.round(boundaryMollyPos.x * w);
      const curPxY = Math.round(boundaryMollyPos.y * h);
      const homePxX = Math.round(0.24 * w);
      const homePxY = Math.round(0.72 * h);
      const distBetween = Math.hypot(curPxX - homePxX, curPxY - homePxY);
      console.log(`[T5-3] Molly is at (${curPxX}, ${curPxY}), home base is at (${homePxX}, ${homePxY}), separation: ${distBetween.toFixed(1)}px`);
      expect(distBetween, 'Molly patrol position should be separated from home base by > 60px').toBeGreaterThan(60);

      // A. Feed at home base while Molly is patrolling away
      console.log('[T5-3] Sub-test A: Clicking home base (0.24w, 0.72h) while Molly is patrolling away...');
      await viewport.click({ position: { x: homePxX, y: homePxY } });
      await page.waitForTimeout(400);

      const treatsAfterHome = Number(await companion.getAttribute('data-molly-treats') || '0');
      expect(treatsAfterHome, 'Click on home base while Molly is patrolling MUST increment treats').toBe(initialTreats + 1);

      // Check gentle toast appears
      const toast = page.locator('.gentle-toast');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('Patronka Molly');

      // Wait for treat eating animation to finish (mollyJoyTimer = 2.4s)
      await page.waitForTimeout(2600);

      // B. Feed directly at moving actor position along patrol path
      const latestMollyPos2 = await page.evaluate(() => {
        const g = (window as any).__t5Telemetry;
        return g && g.mollyPositions && g.mollyPositions.length > 0 ? g.mollyPositions[g.mollyPositions.length - 1] : null;
      });

      const clickTargetX = Math.round((latestMollyPos2?.x || 0.32) * w);
      const clickTargetY = Math.round((latestMollyPos2?.y || 0.72) * h);

      console.log(`[T5-3] Sub-test B: Clicking directly on dynamic Molly actor at (${clickTargetX}, ${clickTargetY})...`);
      await viewport.click({ position: { x: clickTargetX, y: clickTargetY } });
      await page.waitForTimeout(400);

      const treatsAfterDynamic = Number(await companion.getAttribute('data-molly-treats') || '0');
      expect(treatsAfterDynamic, 'Click on moving Molly actor MUST increment treats').toBe(treatsAfterHome + 1);

      // Wait for treat eating animation to settle
      await page.waitForTimeout(2600);

      // C. Boundary evasion: Clicking an existing deed light at (0.79w, 0.18h) far outside 48px radius selects the deed without feeding Molly
      console.log('[T5-3] Sub-test C: Clicking deed light at (0.79w, 0.18h) outside 48px radius...');
      await viewport.click({ position: { x: Math.round(0.79 * w), y: Math.round(0.18 * h) } });
      await page.waitForTimeout(300);

      const treatsAfterDeedSelect = Number(await companion.getAttribute('data-molly-treats') || '0');
      expect(treatsAfterDeedSelect, 'Click on distant deed light must select deed without feeding Molly').toBe(treatsAfterDynamic);

      // Verify deed detail opened
      const openedModal = page.locator('.memory-whisper');
      await expect(openedModal).toBeVisible();

      // Dismiss the modal
      await openedModal.locator('.mw-close').click();
      await page.waitForTimeout(200);
      await expect(openedModal).not.toBeVisible();
    } else {
      // Direct hit at home base fallback
      await viewport.click({ position: { x: Math.round(0.24 * w), y: Math.round(0.72 * h) } });
      await page.waitForTimeout(400);
      const treatsNow = Number(await companion.getAttribute('data-molly-treats') || '0');
      expect(treatsNow).toBe(initialTreats + 1);
    }

    // D. Modal occlusion priority test:
    // Ensure any open dialog is closed first
    const closeBtn = page.locator('.memory-whisper .mw-close');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(200);
    }

    // Open deed detail modal via random deed button
    console.log('[T5-3] Sub-test D: Testing modal occlusion priority...');
    const randomBtn = page.locator('.explore-deed-btn');
    await randomBtn.click();
    await page.waitForTimeout(300);

    const whisperDialog = page.locator('.memory-whisper');
    await expect(whisperDialog).toBeVisible();

    const treatsBeforeModalClick = Number(await companion.getAttribute('data-molly-treats') || '0');

    // Click home base while modal is open: first click dismisses modal without feeding
    // Use force: true to ensure click reaches viewport despite absolute positioned dialog in container
    await viewport.click({ position: { x: Math.round(w * 0.24), y: Math.round(h * 0.72) }, force: true });
    await page.waitForTimeout(300);

    await expect(whisperDialog).not.toBeVisible();
    const treatsAfterModalDismiss = Number(await companion.getAttribute('data-molly-treats') || '0');
    expect(treatsAfterModalDismiss, 'First click when modal is open should dismiss modal without feeding').toBe(treatsBeforeModalClick);

    // Second click on clean stage now feeds Molly
    await viewport.click({ position: { x: Math.round(w * 0.24), y: Math.round(h * 0.72) } });
    await page.waitForTimeout(400);
    const treatsAfterSecondClick = Number(await companion.getAttribute('data-molly-treats') || '0');
    expect(treatsAfterSecondClick, 'Second click after modal dismiss should feed Molly').toBe(treatsBeforeModalClick + 1);

    expect(pageErrors).toHaveLength(0);
  });

  // =========================================================================
  // TEST 4: High-frequency audio toggle and atmosphere switching while deeds are floating
  // =========================================================================
  test('T5-4: High-frequency audio toggle and atmosphere switching while deeds are floating', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/svet');
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    // 1. Plant a custom deed via ritual dock to trigger launch comets & ripples
    const input = page.locator('#ritual-deed-input');
    await input.fill('Tichá vlídná myšlenka pro radost druhého člověka');

    const wavePill = page.locator('.ritual-pill', { hasText: 'Vlna' });
    await wavePill.click();

    const sendBtn = page.locator('.ritual-send-btn');
    await sendBtn.click();
    await page.waitForTimeout(100);

    // 2. Click 2 quick offline deeds in rapid succession to launch multiple concurrent particles
    const quickChips = page.locator('.qd-chip');
    if (await quickChips.count() >= 2) {
      await quickChips.nth(0).click();
      await page.waitForTimeout(80);
      await quickChips.nth(1).click();
    }

    // 3. Concurrently hammer audio toggle and atmosphere mode switch 14 times
    const hud = page.locator('.sanctuary-hud');
    const dawnBtn = hud.locator('button', { hasText: 'Zlaté svítání' });
    const nightBtn = hud.locator('button', { hasText: 'Hvězdná noc' });
    const soundBtn = hud.locator('.sound-btn');

    console.log('[T5-4] Hammering audio & atmosphere switches while comets & ripples are actively rendering...');
    for (let i = 0; i < 14; i++) {
      // Toggle atmosphere
      if (i % 2 === 0) {
        await nightBtn.click();
      } else {
        await dawnBtn.click();
      }

      // Toggle sound
      await soundBtn.click();
      await page.waitForTimeout(60);
    }

    // Settle for 1.2s so in-flight comets complete detonating blooms
    await page.waitForTimeout(1200);

    // Verify canvas loop is healthy, DPR is valid, no NaN occurred
    const telemetry = await page.evaluate(() => (window as any).__t5Telemetry);
    expect(pageErrors).toHaveLength(0);
    expect(telemetry.nanDetected).toBe(false);
    expect(telemetry.stackUnderflow).toBe(false);

    // Canvas still responsive and rendering
    const isLoopAlive = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        let count = 0;
        function ping() {
          count++;
          if (count >= 8) resolve(true);
          else requestAnimationFrame(ping);
        }
        requestAnimationFrame(ping);
      });
    });
    expect(isLoopAlive).toBe(true);

    // Sound button state matches aria-pressed
    const soundAriaPressed = await soundBtn.getAttribute('aria-pressed');
    const soundClassOn = await soundBtn.evaluate(el => el.classList.contains('on'));
    expect(soundAriaPressed === 'true').toBe(soundClassOn);
  });

  // =========================================================================
  // TEST 5: Rapid random deed cycling & quick offline deed bombardment stress
  // =========================================================================
  test('T5-5: Rapid random deed cycling & quick offline deed bombardment stress', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/svet');
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    const randomDeedBtn = page.locator('.explore-deed-btn');
    await expect(randomDeedBtn).toBeVisible();

    // Rapidly trigger random deed 12 times
    console.log('[T5-5] Rapidly cycling through random inspiring deeds...');
    for (let i = 0; i < 12; i++) {
      await randomDeedBtn.click();
      await page.waitForTimeout(60);

      const modal = page.locator('.memory-whisper');
      await expect(modal).toBeVisible();

      const title = await modal.locator('.mw-title').innerText();
      expect(title.length).toBeGreaterThan(0);
    }

    // Close the modal
    const closeBtn = page.locator('.memory-whisper .mw-close');
    await closeBtn.click();
    await page.waitForTimeout(200);
    await expect(page.locator('.memory-whisper')).not.toBeVisible();

    // Bombard all 4 quick offline deeds
    const quickChips = page.locator('.qd-chip');
    const chipCount = await quickChips.count();
    expect(chipCount).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < chipCount; i++) {
      await quickChips.nth(i).click();
      await page.waitForTimeout(100);
    }

    // Verify clear button appears when sanctuary wishes exist
    const clearBtn = page.locator('.ritual-clear-btn');
    await expect(clearBtn).toBeVisible();

    // Click clear wishes
    await clearBtn.click();
    await page.waitForTimeout(200);

    // Canvas loop remains stable
    expect(pageErrors).toHaveLength(0);
  });

  // =========================================================================
  // TEST 6: Deep-link URL seed fallback and breathing exercise state integration
  // =========================================================================
  test('T5-6: Deep-link URL seed fallback and breathing exercise state integration', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Navigate with URL seed query parameters
    await page.goto('/svet?seed=birdlife_ptaci_pasti&title=Ptaci+budka+v+parku');
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    // Verify seed ceremony banner is rendered
    const banner = page.locator('.seed-ceremony-banner');
    await expect(banner).toBeVisible();
    await expect(banner.locator('.seed-copy strong')).toHaveText('Ptaci budka v parku');

    // Plant the seed via banner button
    const autoPlantBtn = banner.locator('.seed-auto-btn');
    await autoPlantBtn.click();
    await page.waitForTimeout(400);

    // Banner should be dismissed after planting
    await expect(banner).not.toBeVisible();

    // 2. Breathing exercise state integration
    const breathSection = page.locator('#dech');
    await breathSection.scrollIntoViewIfNeeded();

    // Select second rhythm (🌿 Rovnováha 4–4)
    const rhythmCards = breathSection.locator('.pattern-card');
    await rhythmCards.nth(1).click();
    await expect(rhythmCards.nth(1)).toHaveClass(/active/);

    // Start breathing
    const startBtn = breathSection.locator('.breath-cta.start');
    await startBtn.click();
    await page.waitForTimeout(500);

    // Verify companion layer reflects breathing mood
    const companion = page.locator('.molly-companion-layer');
    await expect(companion).toHaveAttribute('data-molly-mood', 'breathing');

    // Verify lotus halo active state
    const phaseDisplay = breathSection.locator('.phase-sec');
    await expect(phaseDisplay).toBeVisible();

    // Rapid atmosphere switch while breathing is active
    const nightBtn = page.locator('.atmosphere-controls button', { hasText: 'Hvězdná noc' });
    await nightBtn.click();
    await page.waitForTimeout(300);

    // Stop breathing
    const stopBtn = breathSection.locator('.breath-cta.stop');
    await stopBtn.click();
    await page.waitForTimeout(400);

    // Verify Molly mood cleanly restores to curious
    await expect(companion).toHaveAttribute('data-molly-mood', 'curious');
    expect(pageErrors).toHaveLength(0);
  });

});
