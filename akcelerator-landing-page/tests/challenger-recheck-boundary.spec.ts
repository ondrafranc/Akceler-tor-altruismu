import { test, expect } from '@playwright/test';

test.describe('Challenger M1 Recheck: Boundary Stress Verification', () => {
  const boundaryViewports = [360, 680, 681, 1024, 1025];

  for (const vp of boundaryViewports) {
    test(`Boundary Viewport ${vp}px: verify no horizontal overflow and nav integrity`, async ({ page }) => {
      await page.setViewportSize({ width: vp, height: 800 });
      await page.goto('/');
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

      const boundaryState = await page.evaluate((width) => {
        const doc = document.documentElement;
        const brand = document.querySelector('.nav-capsule a.brand') as HTMLElement | null;
        const dock = document.querySelector('.nav-capsule .molly-pelisek-dock') as HTMLElement | null;
        const toggle = document.querySelector('.nav-capsule button.mobile-nav-toggle') as HTMLElement | null;
        const links = document.querySelector('.nav-links') as HTMLElement | null;
        const pills = Array.from(document.querySelectorAll('.nav-links .nav-pill')) as HTMLElement[];
        const bottomNavCount = document.querySelectorAll('.mobile-bottom-nav').length;

        const linksDisplay = links ? window.getComputedStyle(links).display : 'none';
        const toggleDisplay = toggle ? window.getComputedStyle(toggle).display : 'none';
        const navLinksWrap = links ? window.getComputedStyle(links).flexWrap : '';

        const toRect = (el: HTMLElement | null) => {
          if (!el || window.getComputedStyle(el).display === 'none') return null;
          const r = el.getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
        };

        const overlaps = (
          a: { left: number; top: number; right: number; bottom: number } | null,
          b: { left: number; top: number; right: number; bottom: number } | null
        ) => {
          if (!a || !b) return false;
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          return w > 1.5 && h > 1.5;
        };

        const brandRect = toRect(brand);
        const dockRect = toRect(dock);
        const toggleRect = toRect(toggle);

        let maxPillRight = 0;
        let linksScrollW = 0;
        let linksClientW = 0;
        if (links && linksDisplay !== 'none') {
          linksScrollW = links.scrollWidth;
          linksClientW = links.clientWidth;
          for (const p of pills) {
            const r = p.getBoundingClientRect();
            if (r.right > maxPillRight) maxPillRight = r.right;
          }
        }

        return {
          viewport: width,
          docScrollWidth: doc.scrollWidth,
          hasDocHScroll: doc.scrollWidth > width,
          bottomNavCount,
          linksDisplay,
          toggleDisplay,
          navLinksWrap,
          linksScrollW,
          linksClientW,
          linksOverflowing: linksScrollW > linksClientW,
          maxPillRight,
          brandRect,
          dockRect,
          toggleRect,
          brandDockOverlap: overlaps(brandRect, dockRect),
          brandToggleOverlap: overlaps(brandRect, toggleRect),
          dockToggleOverlap: overlaps(dockRect, toggleRect)
        };
      }, vp);

      console.log(`[Boundary ${vp}px]`, JSON.stringify(boundaryState));

      // Global page overflow and legacy bottom nav MUST NEVER occur
      expect(boundaryState.hasDocHScroll).toBe(false);
      expect(boundaryState.bottomNavCount).toBe(0);

      if (vp <= 1024) {
        // Top-only mobile/tablet header drawer must be active
        expect(boundaryState.linksDisplay).toBe('none');
        expect(boundaryState.toggleDisplay).not.toBe('none');
        expect(boundaryState.toggleRect).not.toBeNull();
        expect(boundaryState.toggleRect!.width).toBeGreaterThanOrEqual(43.5);
        expect(boundaryState.toggleRect!.height).toBeGreaterThanOrEqual(43.5);
        expect(boundaryState.dockRect).not.toBeNull();
        expect(boundaryState.brandDockOverlap).toBe(false);
        expect(boundaryState.brandToggleOverlap).toBe(false);
        expect(boundaryState.dockToggleOverlap).toBe(false);

        const navToggle = page.locator('.mobile-nav-toggle');
        await navToggle.click();
        const drawer = page.locator('#mobile-top-nav-drawer');
        await expect(drawer).toBeVisible();
        await expect(drawer.locator('.mobile-drawer-link')).toHaveCount(6);
        const drawerOverflow = await page.evaluate(
          (width) => document.documentElement.scrollWidth > width,
          vp
        );
        expect(drawerOverflow).toBe(false);
        await page.keyboard.press('Escape');
        await expect(drawer).toBeHidden();
      } else {
        // Desktop top nav links must be visible without wrap or overflow
        expect(boundaryState.toggleDisplay).toBe('none');
        expect(boundaryState.linksDisplay).not.toBe('none');
        expect(boundaryState.navLinksWrap).toBe('nowrap');
        expect(boundaryState.linksOverflowing).toBe(false);
        expect(boundaryState.maxPillRight).toBeLessThanOrEqual(vp);
      }
    });
  }
});
