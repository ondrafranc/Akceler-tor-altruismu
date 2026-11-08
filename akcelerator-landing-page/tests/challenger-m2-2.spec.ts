import { test, expect } from '@playwright/test';

test.describe('Challenger M2-2: Landscape Controls & Viewport Geometry Stress', () => {

  // =========================================================================
  // TASK 1: Non-wrapping Deed Dock geometry across full desktop range:
  // 1024px, 1080px, 1100px, 1140px, 1280px, 1440px
  // =========================================================================
  const DESKTOP_VIEWPORTS = [
    { width: 1024, height: 768, label: '1024x768 (Desktop min boundary)' },
    { width: 1080, height: 800, label: '1080x800' },
    { width: 1100, height: 900, label: '1100x900' },
    { width: 1140, height: 900, label: '1140x900 (Previous flex wrap threshold)' },
    { width: 1280, height: 800, label: '1280x800 (Standard laptop)' },
    { width: 1440, height: 900, label: '1440x900 (Large desktop)' }
  ];

  for (const vp of DESKTOP_VIEWPORTS) {
    test(`Desktop Deed Dock non-wrapping geometry on ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/svet');
      await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

      const dock = page.locator('.ritual-dock-main');
      await expect(dock).toBeVisible();

      const modes = dock.locator('.ritual-modes');
      const input = dock.locator('#ritual-deed-input');
      const sendBtn = dock.locator('.ritual-send-btn');

      await expect(modes).toBeVisible();
      await expect(input).toBeVisible();
      await expect(sendBtn).toBeVisible();

      // Verify computed CSS grid structure: 3 columns in a single row
      const gridInfo = await dock.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          columnsCount: style.gridTemplateColumns.split(' ').length
        };
      });

      expect(gridInfo.display).toBe('grid');
      expect(gridInfo.columnsCount).toBe(3);

      // Verify geometric alignment: single horizontal row, zero vertical wrapping
      const dockBox = (await dock.boundingBox())!;
      const modesBox = (await modes.boundingBox())!;
      const inputBox = (await input.boundingBox())!;
      const btnBox = (await sendBtn.boundingBox())!;

      expect(dockBox).not.toBeNull();
      expect(modesBox).not.toBeNull();
      expect(inputBox).not.toBeNull();
      expect(btnBox).not.toBeNull();

      // Vertical alignment: all 3 elements must be on the same horizontal row
      // No child should wrap below another child
      expect(btnBox.y, 'Send button must not wrap below input').toBeLessThan(inputBox.y + inputBox.height - 4);
      expect(inputBox.y, 'Input must not wrap below modes').toBeLessThan(modesBox.y + modesBox.height - 4);

      // Vertical centers within 10px alignment
      const modeCenterY = modesBox.y + modesBox.height / 2;
      const inputCenterY = inputBox.y + inputBox.height / 2;
      const btnCenterY = btnBox.y + btnBox.height / 2;
      expect(Math.abs(modeCenterY - inputCenterY)).toBeLessThan(10);
      expect(Math.abs(inputCenterY - btnCenterY)).toBeLessThan(10);

      // Strict horizontal sequence: modes on left, input in middle, button on right
      expect(modesBox.x).toBeLessThan(inputBox.x);
      expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(btnBox.x + 4);
      expect(btnBox.x + btnBox.width).toBeLessThanOrEqual(dockBox.x + dockBox.width + 2);

      // Dock height remains compact (single row, under 65px)
      expect(dockBox.height, 'Dock height must reflect a single row').toBeLessThan(65);

      // Usable input width on desktop
      expect(inputBox.width, 'Input width must be >= 120px on desktop').toBeGreaterThanOrEqual(120);

      // All 3 ritual pills inside .ritual-modes are visible
      const pills = modes.locator('.ritual-pill');
      await expect(pills).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        await expect(pills.nth(i)).toBeVisible();
      }

      // STRESS: Input with 30-char realistic text and 110-char maximum length
      await input.fill('Pomoc sousedce s těžkým nákupem do schodů');
      const boxWithText = (await dock.boundingBox())!;
      expect(boxWithText.height, 'Dock must remain single row with text').toBeLessThan(65);

      await input.fill('A'.repeat(110));
      const boxWithMax = (await dock.boundingBox())!;
      const btnWithMax = (await sendBtn.boundingBox())!;
      expect(boxWithMax.height, 'Dock must remain single row with 110 chars').toBeLessThan(65);
      expect(btnWithMax.y, 'Send button must not wrap with 110 chars').toBeLessThan(inputBox.y + inputBox.height - 4);
    });
  }

  // =========================================================================
  // TASK 2: Zero horizontal overflow on mobile viewports:
  // 320px, 360px, 375px, 390px, 412px, 430px
  // =========================================================================
  const MOBILE_VIEWPORTS = [
    { width: 320, height: 568, label: '320x568 (iPhone SE 1st gen)' },
    { width: 360, height: 800, label: '360x800 (Standard Android)' },
    { width: 375, height: 667, label: '375x667 (iPhone SE 2nd/3rd gen)' },
    { width: 390, height: 844, label: '390x844 (iPhone 12/13/14)' },
    { width: 412, height: 915, label: '412x915 (Samsung Galaxy S20+)' },
    { width: 430, height: 932, label: '430x932 (iPhone 14/15 Pro Max)' }
  ];

  for (const vp of MOBILE_VIEWPORTS) {
    test(`Mobile zero horizontal overflow across states on ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // State A: Default page load on /svet
      await page.goto('/svet');
      await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

      const checkZeroOverflow = async (stateName: string) => {
        const overflow = await page.evaluate(() => {
          const docScroll = document.documentElement.scrollWidth;
          const docClient = document.documentElement.clientWidth;
          const bodyScroll = document.body.scrollWidth;
          const winInner = window.innerWidth;

          // Check if any visible element overflows the viewport horizontally
          const allElements = Array.from(document.querySelectorAll('*'));
          const offenders: { selector: string; right: number; width: number }[] = [];
          for (const el of allElements) {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) continue;
            if (rect.right > winInner + 1.5) {
              offenders.push({
                selector: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : ''}`,
                right: Math.round(rect.right),
                width: Math.round(rect.width)
              });
            }
          }

          return {
            docOverflow: docScroll > docClient,
            bodyOverflow: bodyScroll > winInner,
            docScroll,
            docClient,
            bodyScroll,
            winInner,
            offenders: offenders.slice(0, 5)
          };
        });

        expect(overflow.docOverflow, `Doc horizontal overflow in state ${stateName}: scrollWidth=${overflow.docScroll} > clientWidth=${overflow.docClient}`).toBe(false);
        expect(overflow.bodyOverflow, `Body horizontal overflow in state ${stateName}: bodyScroll=${overflow.bodyScroll} > winInner=${overflow.winInner}`).toBe(false);
        expect(overflow.offenders, `Offending overflowing elements in state ${stateName}: ${JSON.stringify(overflow.offenders)}`).toHaveLength(0);
      };

      await checkZeroOverflow('Initial load');

      // State B: Atmosphere toggle to Hvězdná noc
      const nightBtn = page.locator('.atmo-btn', { hasText: 'Hvězdná noc' });
      await nightBtn.click();
      await checkZeroOverflow('Night atmosphere mode');

      // Switch back to Dawn
      const dawnBtn = page.locator('.atmo-btn', { hasText: 'Zlaté svítání' });
      await dawnBtn.click();
      await checkZeroOverflow('Dawn atmosphere mode');

      // State C: Sound toggle
      const soundBtn = page.locator('.sound-btn');
      await soundBtn.click();
      await checkZeroOverflow('Sound toggled');

      // State D: URL query with long deed title (seed ceremony banner)
      await page.goto(
        '/svet?seed=custom&title=' +
          encodeURIComponent('Mimořádně dlouhý český název dobrého skutku pro zátěžový test přetékání na malém displeji')
      );
      await expect(page.locator('.seed-ceremony-banner')).toBeVisible();
      await checkZeroOverflow('Seed ceremony banner with long title');

      // State E: Active typing in deed dock input on mobile
      const input = page.locator('#ritual-deed-input');
      await input.fill('Tento dobrý skutek testuje mobilní mřížku doku');
      await checkZeroOverflow('Mobile deed dock with typed text');

      // State F: Open memory whisper dialog
      await page.goto('/svet');
      await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');
      const stage = page.locator('.sanctuary-viewport');
      const box = (await stage.boundingBox())!;
      // Estudánky pramen is at x: 0.66, y: 0.66
      await stage.click({ position: { x: Math.round(box.width * 0.66), y: Math.round(box.height * 0.66) } });
      const whisper = page.locator('.memory-whisper');
      if (await whisper.isVisible()) {
        await checkZeroOverflow('Memory whisper dialog open');
      }
    });
  }

  // =========================================================================
  // TASK 3: Light touch selection precision with simulated touch hits
  // with 20px–34px offsets
  // =========================================================================
  test.describe('Light touch selection precision with 20px–34px offsets', () => {

    const TARGET_VIEWPORTS = [
      { width: 320, height: 568, label: '320px mobile' },
      { width: 375, height: 667, label: '375px mobile' },
      { width: 430, height: 932, label: '430px mobile' },
      { width: 1280, height: 800, label: '1280px desktop' }
    ];

    for (const tvp of TARGET_VIEWPORTS) {
      test(`Touch hit radius precision on ${tvp.label}`, async ({ page }) => {
        await page.setViewportSize({ width: tvp.width, height: tvp.height });
        await page.goto('/svet');
        // Wait for Svelte client hydration so click handlers are active
        await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

        const stage = page.locator('.sanctuary-viewport');
        await expect(stage).toBeVisible();
        const stageBox = (await stage.boundingBox())!;
        expect(stageBox).not.toBeNull();

        // Target seed deed: 'birdlife_ptaci_pasti' at x: 0.41, y: 0.15 (Sky star)
        // Downward in +Y direction has 120px+ of empty space to next light (knihobudka at y: 0.74)
        const targetX = Math.round(stageBox.width * 0.41);
        const targetY = Math.round(stageBox.height * 0.15);

        const whisper = page.locator('.memory-whisper');

        // Canonical dismissal: clicking top-left empty corner (20, 20) cleanly toggles selectedLight to null
        const closeWhisperIfOpen = async () => {
          if (await whisper.isVisible()) {
            await stage.click({ position: { x: 20, y: 20 } });
            await expect(whisper).toBeHidden();
          }
        };

        // 1. Baseline: Exact center hit (0px offset) selects target deed light
        await closeWhisperIfOpen();
        await stage.click({ position: { x: targetX, y: targetY } });
        await expect(whisper).toBeVisible();
        expect(await whisper.textContent()).toContain('pták');

        // 2. Offsets within the required 20px–34px range in downward (+Y) direction
        // (completely isolated from any neighbor lights, directly measuring radial hit clamp)
        const ISOLATED_OFFSETS = [
          { dx: 0, dy: 20, desc: '20px offset (lower bound of requirement)' },
          { dx: 0, dy: 24, desc: '24px offset' },
          { dx: 0, dy: 28, desc: '28px offset' },
          { dx: 0, dy: 30, desc: '30px offset' },
          { dx: 0, dy: 32, desc: '32px offset' },
          { dx: 0, dy: 33, desc: '33px offset (within < 34px threshold)' }
        ];

        for (const testCase of ISOLATED_OFFSETS) {
          await closeWhisperIfOpen();
          const clickX = Math.round(targetX + testCase.dx);
          const clickY = Math.round(targetY + testCase.dy);
          await stage.click({ position: { x: clickX, y: clickY } });
          await expect(whisper, `Simulated touch hit with ${testCase.desc} at (${clickX}, ${clickY}) MUST select light`).toBeVisible();
          expect(await whisper.textContent()).toContain('pták');
        }

        // 3. Multi-directional in-range offsets within exclusive Voronoi cell
        const CARDINAL_OFFSETS = [
          { dx: -20, dy: 0, desc: '-20px X offset (towards left sky)' },
          { dx: 20, dy: 0, desc: '+20px X offset' },
          { dx: -24, dy: 0, desc: '-24px X offset' },
          { dx: 14, dy: 14, desc: '~20px diagonal offset' }
        ];

        for (const testCase of CARDINAL_OFFSETS) {
          await closeWhisperIfOpen();
          const clickX = Math.round(targetX + testCase.dx);
          const clickY = Math.round(targetY + testCase.dy);
          await stage.click({ position: { x: clickX, y: clickY } });
          await expect(whisper, `Touch hit with ${testCase.desc} must select a deed light`).toBeVisible();
        }

        // 4. Reliable touch selection at +32px X offset on mobile viewports (<400px width)
        // Between birdlife (x=0.41) and remobil (x=0.62), tapping at +32px from birdlife reliably
        // activates a deed card (either birdlife or remobil depending on exact viewport scaling),
        // proving zero dead zones between lights on mobile screens.
        if (tvp.width <= 375) {
          await closeWhisperIfOpen();
          const clickX = Math.round(targetX + 32);
          const clickY = targetY;
          await stage.click({ position: { x: clickX, y: clickY } });
          await expect(whisper, 'Touch click at +32px between lights must open deed memory whisper').toBeVisible();
        }

        // 5. Out-of-range boundary check (> 34px on mobile viewports)
        // On mobile viewports where hit radius is clamped to 34px, clicks at +36px in isolated +Y direction
        // must NOT select the light (preventing false positive mis-taps)
        if (tvp.width <= 430) {
          await closeWhisperIfOpen();
          const clickX = targetX;
          const clickY = Math.round(targetY + 36);
          await stage.click({ position: { x: clickX, y: clickY } });
          await expect(whisper, 'Touch hit with +36px Y offset (> 34px mobile hit radius) must NOT select light').toBeHidden();
        }
      });
    }
  });
});
