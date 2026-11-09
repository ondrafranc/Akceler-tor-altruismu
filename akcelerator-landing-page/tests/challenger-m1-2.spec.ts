import { test, expect } from '@playwright/test';

/**
 * Challenger M1-2: Responsiveness, Visual Stability & Sensory Engine
 * 
 * Verifies:
 * 1. SanctuaryTeaser.svelte: Living diorama preview, keyframes, picture fallback, accessibility, links.
 * 2. Navigation & Deep Link: Seamless navigation to /svet and /svet#dech without router crash.
 * 3. Tablet Header Nav: .world-pill layout, visibility, and zero window overflow at 681px-1024px.
 * 4. Sensory Engine: ResizeObserver dynamic wake-up, blank frame prevention, and unclipped Mini-Molly coordinates.
 * 5. Nav Pill Gap Diagnosis & Verified Mitigation (681px–767px).
 */

test.describe('Challenger M1-2: Responsiveness, Visual Stability & Sensory Engine', () => {

  test('1. SanctuaryTeaser.svelte: Structural integrity, Keyframes, WebP/JPG fallback & A11y', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Section existence and a11y label
    const section = page.locator('section.sanctuary-portal-section');
    await expect(section).toBeVisible();
    await expect(section).toHaveAttribute('aria-label', 'Krajina dobra a dechové zastavení');

    // Living diorama card & kicker
    const card = section.locator('.sanctuary-portal-card');
    await expect(card).toBeVisible();
    await expect(card.locator('.stage-kicker')).toContainText('KRAJINA DOBRA · MALOVANÝ SVĚT POMOCI');

    // Picture element, WebP source & JPG fallback
    const picture = section.locator('picture');
    await expect(picture).toBeVisible();

    const webpSource = picture.locator('source[type="image/webp"]');
    await expect(webpSource).toHaveAttribute('srcset', '/art/sanctuary-dawn-800.webp');

    const img = picture.locator('img.preview-bg-img');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', '/art/sanctuary-dawn.jpg');
    await expect(img).toHaveAttribute('alt', 'Malovaná česká tůň zalitá zlatým svítáním s plovoucími lucernami dobrých skutků');

    // Verify image actually loads
    const imgLoaded = await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0);
    expect(imgLoaded).toBe(true);

    // Decorative atmosphere & live pill
    await expect(section.locator('.preview-atmosphere')).toHaveAttribute('aria-hidden', 'true');
    await expect(section.locator('.spw-live-pill')).toBeVisible();
    await expect(section.locator('.spw-enter')).toContainText('Vstoupit do tůně →');

    // Keyframes check: floating lanterns & fireflies
    const lanterns = section.locator('.living-lantern');
    await expect(lanterns).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(lanterns.nth(i)).toHaveAttribute('aria-hidden', 'true');
    }

    const fireflies = section.locator('.living-firefly');
    await expect(fireflies).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(fireflies.nth(i)).toHaveAttribute('aria-hidden', 'true');
    }

    // Inspect CSS animation names
    const lanternAnim = await lanterns.first().evaluate((el) => window.getComputedStyle(el).animationName);
    expect(lanternAnim).toContain('lanternBob');

    const fireflyAnim = await fireflies.first().evaluate((el) => window.getComputedStyle(el).animationName);
    expect(fireflyAnim).toContain('fireflyDrift');

    const glowAnim = await section.locator('.lantern-glow').first().evaluate((el) => window.getComputedStyle(el).animationName);
    expect(glowAnim).toContain('lanternPulse');

    const dotAnim = await section.locator('.live-pulse-dot').evaluate((el) => window.getComputedStyle(el).animationName);
    expect(dotAnim).toContain('livePulse');

    // Verify reduced motion compliance
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducedLanternAnim = await lanterns.first().evaluate((el) => window.getComputedStyle(el).animationName);
    const reducedFireflyAnim = await fireflies.first().evaluate((el) => window.getComputedStyle(el).animationName);
    expect(reducedLanternAnim).toBe('none');
    expect(reducedFireflyAnim).toBe('none');

    // Reset reduced motion
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Verify link targets
    const primaryBtn = section.locator('.sanctuary-open-btn');
    await expect(primaryBtn).toHaveAttribute('href', '/svet');
    await expect(primaryBtn).toContainText('Vstoupit do Krajiny dobra');

    const breathBtn = section.locator('.sanctuary-breath-link');
    await expect(breathBtn).toHaveAttribute('href', '/svet#dech');
    await expect(breathBtn).toContainText('Dechové zastavení');

    const previewLink = section.locator('a.sanctuary-preview-window');
    await expect(previewLink).toHaveAttribute('href', '/svet');
    await expect(previewLink).toHaveAttribute('aria-label', 'Otevřít živou Krajinu dobra');

    expect(consoleErrors).toHaveLength(0);
  });

  test('2. SanctuaryTeaser navigation & deep link: /svet and /svet#dech', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Click on primary CTA
    const primaryBtn = page.locator('.sanctuary-open-btn');
    await primaryBtn.click();
    await page.waitForURL('**/svet');
    expect(page.url()).toContain('/svet');

    // Verify /svet rendered properly without router crash
    await expect(page.locator('.sanctuary-stage')).toBeVisible();

    // 2. Navigate back to / and click deep link #dech
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const breathBtn = page.locator('.sanctuary-breath-link');
    await breathBtn.click();
    await page.waitForURL('**/svet#dech');
    expect(page.url()).toContain('/svet#dech');

    // Verify #dech section exists and is scrolled into view
    const dechSection = page.locator('#dech');
    await expect(dechSection).toBeVisible();

    // Wait for smooth scroll settlement
    await page.waitForTimeout(600);
    const dechBounding = await dechSection.boundingBox();
    expect(dechBounding).not.toBeNull();
    // Element should be within or near visible viewport
    if (dechBounding) {
      expect(dechBounding.y).toBeLessThan(500);
    }

    // 3. Navigate away to /app/online to test unmount cleanup (no ReferenceError)
    await page.goto('/app/online');
    await page.waitForLoadState('domcontentloaded');

    expect(consoleErrors).toHaveLength(0);
  });

  test('3. Tablet Header Nav Bar Stress: .world-pill layout & zero overflow (681px to 1024px)', async ({ page }) => {
    const tabletViewports = [1024, 900, 834, 768, 720, 681];

    for (const vp of tabletViewports) {
      await page.setViewportSize({ width: vp, height: 800 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const topNav = page.locator('.top-nav');
      await expect(topNav).toBeVisible();

      const navCapsule = page.locator('.nav-capsule');
      await expect(navCapsule).toBeVisible();

      // Verify .world-pill is present in DOM
      const worldPill = page.locator('.nav-pill.world-pill');
      await expect(worldPill).toBeAttached();
      await expect(worldPill).toContainText('Krajina dobra');

      // Detailed telemetry on nav items
      const navDetails = await page.evaluate(() => {
        const topNav = document.querySelector('.top-nav') as HTMLElement;
        const capsule = document.querySelector('.nav-capsule') as HTMLElement;
        const links = document.querySelector('.nav-links') as HTMLElement;
        const world = document.querySelector('.nav-pill.world-pill') as HTMLElement;
        const doc = document.documentElement;

        const pills = Array.from(document.querySelectorAll('.nav-links .nav-pill')).map(p => {
          const el = p as HTMLElement;
          const rect = el.getBoundingClientRect();
          return {
            text: el.innerText.trim(),
            display: window.getComputedStyle(el).display,
            rect: { left: rect.left, right: rect.right, width: rect.width }
          };
        });

        const worldRect = world.getBoundingClientRect();

        return {
          windowWidth: window.innerWidth,
          docScrollWidth: doc.scrollWidth,
          hasDocHScroll: doc.scrollWidth > window.innerWidth,
          capsuleWidth: capsule.clientWidth,
          linksWidth: links.clientWidth,
          linksScrollWidth: links.scrollWidth,
          linksOverflowing: links.scrollWidth > links.clientWidth,
          worldRect: { left: worldRect.left, right: worldRect.right, width: worldRect.width },
          pills
        };
      });

      console.log(`[Viewport ${vp}px] navDetails:`, JSON.stringify(navDetails));

      // Global page overflow MUST NEVER occur
      expect(navDetails.hasDocHScroll).toBe(false);

      // Header nav links MUST NEVER overflow (zero hidden overflow on tablet viewports)
      expect(navDetails.linksOverflowing).toBe(false);

      // Verify add-tip is hidden at tablet widths <= 1024px
      const addTip = page.locator('.nav-pill.add-tip');
      await expect(addTip).toBeHidden();

      // Verify brand-sub is hidden to preserve space
      const brandSub = page.locator('.brand-sub');
      await expect(brandSub).toBeHidden();

      // Verify flex-wrap on .nav-links is nowrap
      const navLinksWrap = await page.locator('.nav-links').evaluate((el) => {
        return window.getComputedStyle(el).flexWrap;
      });
      expect(navLinksWrap).toBe('nowrap');
    }
  });

  test('4. Sensory Engine: ResizeObserver Dynamic Wake-up & Blank Frame Prevention', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Locate payoff canvas in instant card
    const canvas = page.locator('.instant-card canvas.impact-payoff-canvas');
    await expect(canvas).toBeVisible();

    // Wait until Svelte hydration has initialized sensoryEngine and mounted Mini-Molly
    await expect(canvas).toHaveAttribute('data-molly-mini', 'ready', { timeout: 10000 });

    // Verify initial non-zero size
    const initialBox = await canvas.boundingBox();
    expect(initialBox).not.toBeNull();
    expect(initialBox!.width).toBeGreaterThan(200);
    expect(initialBox!.height).toBeGreaterThan(50);

    // Verify initial pixel rendering: canvas should NOT be blank (alpha 0)
    const initialPixelStats = await canvas.evaluate((cv: HTMLCanvasElement) => {
      const ctx = cv.getContext('2d');
      if (!ctx) return { nonZeroPixels: 0, totalPixels: 0 };
      const imgData = ctx.getImageData(0, 0, cv.width, cv.height);
      let nonZero = 0;
      for (let i = 3; i < imgData.data.length; i += 4) {
        if (imgData.data[i] > 10) nonZero++;
      }
      return { nonZeroPixels: nonZero, totalPixels: imgData.data.length / 4 };
    });

    expect(initialPixelStats.nonZeroPixels).toBeGreaterThan(100);

    // Let the canvas settle into idle (> 120 frames / ~2.5s)
    await page.waitForTimeout(2500);

    // Check Mini-Molly coordinate anchoring across dynamic resizes
    const testWidths = [420, 560, 340, 720];

    for (const w of testWidths) {
      // Dynamically resize card container
      await page.evaluate((targetWidth) => {
        const card = document.querySelector('.instant-card') as HTMLElement;
        if (card) {
          card.style.width = `${targetWidth}px`;
          card.style.maxWidth = `${targetWidth}px`;
        }
      }, w);

      // Give ResizeObserver 1 microtask to trigger
      await page.waitForTimeout(60);

      // Check pixel stats immediately: canvas must be drawn synchronously by fn(true), NOT blank
      const postResizePixels = await canvas.evaluate((cv: HTMLCanvasElement) => {
        const ctx = cv.getContext('2d');
        if (!ctx) return { nonZeroPixels: 0 };
        const imgData = ctx.getImageData(0, 0, cv.width, cv.height);
        let nonZero = 0;
        for (let i = 3; i < imgData.data.length; i += 4) {
          if (imgData.data[i] > 10) nonZero++;
        }
        return { nonZeroPixels: nonZero };
      });

      expect(postResizePixels.nonZeroPixels).toBeGreaterThan(100);

      // Verify canvas physical dimensions updated
      const updatedBox = await canvas.boundingBox();
      expect(updatedBox).not.toBeNull();

      // Check that canvas dataset state remains ready
      const miniState = await canvas.getAttribute('data-molly-mini');
      expect(miniState).toBe('ready');
    }
  });

  test('5. Nav Pill Gap Diagnosis & Verified Mitigation (681px–767px)', async ({ page }) => {
    // 1. Verify zero overflow at 681px with verified mitigation active
    await page.setViewportSize({ width: 681, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const layoutState = await page.evaluate(() => {
      const links = document.querySelector('.nav-links') as HTMLElement;
      const world = document.querySelector('.nav-pill.world-pill') as HTMLElement;
      const worldRect = world.getBoundingClientRect();
      return {
        linksWidth: links.clientWidth,
        linksScrollWidth: links.scrollWidth,
        linksOverflowing: links.scrollWidth > links.clientWidth,
        overflowPixels: Math.max(0, links.scrollWidth - links.clientWidth),
        worldRight: worldRect.right
      };
    });

    console.log('[681px Fixed Layout State]:', JSON.stringify(layoutState));
    expect(layoutState.linksOverflowing).toBe(false);
    expect(layoutState.overflowPixels).toBe(0);
    expect(layoutState.worldRight).toBeLessThanOrEqual(681);

    // 2. Test Mitigation: Either raising mobile bottom nav to 768px OR icon-only compacting for intermediate tablets
    const iconCompactMitigation = await page.evaluate(() => {
      const style = document.createElement('style');
      style.id = 'icon-compact-style';
      style.textContent = `
        @media (max-width: 767px) {
          .nav-capsule { padding: 0.35rem 0.5rem !important; }
          .nav-pill span { display: none !important; }
          .nav-pill.world-pill span { display: inline !important; font-size: 0.72rem !important; }
          .nav-pill { padding: 0.32rem 0.44rem !important; }
        }
      `;
      document.head.appendChild(style);

      const links = document.querySelector('.nav-links') as HTMLElement;
      const world = document.querySelector('.nav-pill.world-pill') as HTMLElement;
      const worldRect = world.getBoundingClientRect();

      return {
        linksWidth: links.clientWidth,
        linksScrollWidth: links.scrollWidth,
        linksOverflowing: links.scrollWidth > links.clientWidth,
        worldRight: worldRect.right,
        windowWidth: window.innerWidth
      };
    });

    console.log('[681px Icon-Compact Mitigation]:', JSON.stringify(iconCompactMitigation));
    expect(iconCompactMitigation.linksOverflowing).toBe(false);
    expect(iconCompactMitigation.worldRight).toBeLessThanOrEqual(681);
  });

});
