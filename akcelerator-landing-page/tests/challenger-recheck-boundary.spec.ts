import { test, expect } from '@playwright/test';

test.describe('Challenger M1 Recheck: Boundary Stress Verification', () => {
  const boundaryViewports = [680, 681, 700, 767, 768];

  for (const vp of boundaryViewports) {
    test(`Boundary Viewport ${vp}px: verify no horizontal overflow and nav integrity`, async ({ page }) => {
      await page.setViewportSize({ width: vp, height: 800 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const boundaryState = await page.evaluate((width) => {
        const doc = document.documentElement;
        const topNav = document.querySelector('.top-nav') as HTMLElement;
        const links = document.querySelector('.nav-links') as HTMLElement;
        const world = document.querySelector('.nav-pill.world-pill') as HTMLElement;
        const bottomNav = document.querySelector('.mobile-bottom-nav') as HTMLElement;

        const isMobile = width <= 680;
        const bottomNavDisplay = bottomNav ? window.getComputedStyle(bottomNav).display : 'none';
        const linksDisplay = links ? window.getComputedStyle(links).display : 'none';

        let worldRight = 0;
        let linksScrollW = 0;
        let linksClientW = 0;

        if (world && linksDisplay !== 'none') {
          const rect = world.getBoundingClientRect();
          worldRight = rect.right;
          linksScrollW = links.scrollWidth;
          linksClientW = links.clientWidth;
        }

        return {
          viewport: width,
          docScrollWidth: doc.scrollWidth,
          hasDocHScroll: doc.scrollWidth > width,
          isMobile,
          bottomNavDisplay,
          linksDisplay,
          linksScrollW,
          linksClientW,
          linksOverflowing: linksScrollW > linksClientW,
          worldRight
        };
      }, vp);

      console.log(`[Boundary ${vp}px]`, JSON.stringify(boundaryState));

      // Global page overflow MUST NEVER occur
      expect(boundaryState.hasDocHScroll).toBe(false);

      if (vp <= 680) {
        // Mobile bottom nav must be active
        expect(boundaryState.bottomNavDisplay).not.toBe('none');
        expect(boundaryState.linksDisplay).toBe('none');
      } else {
        // Tablet/Desktop top nav links must be visible without overflow
        expect(boundaryState.linksDisplay).not.toBe('none');
        expect(boundaryState.linksOverflowing).toBe(false);
        expect(boundaryState.worldRight).toBeLessThanOrEqual(vp);
      }
    });
  }
});
