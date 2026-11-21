import { test, expect, type Page } from '@playwright/test';

async function gotoHydrated(page: Page, path: string) {
  await page.goto(path);
  await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20_000 });
  await page.waitForTimeout(220);
}

test.describe('M2 Regressions (E2E)', () => {
  test('1. /app/guided isolates AA_PARTNER_RETURN_KEY by surface and id and credits guided_alt/guided_local without crash', async ({
    page
  }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(
        'aa_pending_return_v1',
        JSON.stringify({
          id: 'brontosaurus_vikend',
          title: 'Vyrazit na jednodenní nebo víkendovou akci v přírodě',
          surface: 'home',
          ts: Date.now() - 5000
        })
      );
    });

    await gotoHydrated(page, '/app/guided');
    await expect(page.locator('#personal-plan .return-dopamine-strip')).toHaveCount(0);

    // Home record must remain intact
    const homePending = await page.evaluate(() => localStorage.getItem('aa_pending_return_v1'));
    expect(homePending).not.toBeNull();
    expect(JSON.parse(homePending!).surface).toBe('home');

    // Now simulate guided surface return matching bestAction
    await page.locator('#personal-plan .btn-studio-primary').dispatchEvent('click');
    await page.evaluate(() => {
      const rec = JSON.parse(localStorage.getItem('aa_pending_return_v1') || '{}');
      rec.ts = Date.now() - 3600;
      localStorage.setItem('aa_pending_return_v1', JSON.stringify(rec));
      window.dispatchEvent(new Event('focus'));
    });
    await expect(page.locator('#personal-plan .return-dopamine-strip')).toBeVisible();

    // Standalone strip completion for guided_alt (missing_maps) and guided_local (CURATED_FALLBACK_PLACES item)
    for (const standalone of [
      { id: 'missing_maps', title: 'Missing Maps', surface: 'guided_alt' },
      { id: 'curated:praha-potravinova-banka', title: 'Potravinová banka Praha', surface: 'guided_local' }
    ]) {
      await page.evaluate((entry) => {
        const payload = JSON.stringify({ ...entry, ts: Date.now() - 4500 });
        localStorage.setItem('aa_pending_return_v1', payload);
        sessionStorage.setItem('aa_pending_return_v1', payload);
      }, standalone);

      await gotoHydrated(page, '/app/guided');
      const standaloneStrip = page.locator('#personal-plan > .return-dopamine-strip');
      await expect(standaloneStrip, `${standalone.surface} standalone strip visible`).toBeVisible();
      await standaloneStrip.locator('.btn-return-complete').click();
      await expect(standaloneStrip).toHaveCount(0);

      const completedIds = await page.evaluate(() => {
        const raw = localStorage.getItem('aa_completed_steps_v2');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.map((item) => item?.id) : [];
      });
      expect(completedIds, `${standalone.id} recorded in aa_completed_steps_v2`).toContain(standalone.id);
    }

    expect(pageErrors, 'Zero uncaught pageerrors during guided return completion').toEqual([]);
  });

  test('2. /?action=<id> deep-link does NOT overwrite saved AA_HOME_DECK_STATE_KEY (including .personal-values-pill toggle)', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHydrated(page, '/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('aa_values', JSON.stringify(['animals', 'nature']));
    });
    await gotoHydrated(page, '/');

    // Select focus tab ("Mám 15 min") and advance 3 times to 4 / 8 (index: 3, letters_seniors)
    await page.locator('.energy-tabs [role="tab"]', { hasText: /15 min/i }).click();
    const nextBtn = page.locator('.deck-nav-next');
    for (let i = 0; i < 3; i++) {
      await nextBtn.click();
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(150);
    await expect(page.locator('.deck-indicator')).toContainText(/^4\s*\/\s*8\b/);

    const savedBefore = await page.evaluate(() => sessionStorage.getItem('aa_home_deck_state_v1'));
    expect(savedBefore).not.toBeNull();
    const parsedBefore = JSON.parse(savedBefore!);
    expect(parsedBefore.energyMode).toBe('focus');
    expect(parsedBefore.index).toBe(3);
    expect(parsedBefore.actionId).toBe('letters_seniors');

    // Visit deep link, start & complete it, then toggle .personal-values-pill ("Moje témata")
    await gotoHydrated(page, '/?action=donio_utulky');
    await page.locator('.instant-card .btn-studio-primary').dispatchEvent('click');
    await page.locator('.instant-card .btn-studio-done').click();
    await expect(page.locator('.instant-card .in-situ-celebration')).toBeVisible();

    const valuesPill = page.locator('.instant-card .personal-values-pill');
    await expect(valuesPill).toBeVisible();
    await valuesPill.click();
    await expect(valuesPill).toHaveClass(/active/);

    const savedAfter = await page.evaluate(() => sessionStorage.getItem('aa_home_deck_state_v1'));
    expect(savedAfter).toBe(savedBefore);
    const parsedAfter = JSON.parse(savedAfter!);
    expect(parsedAfter.index).toBe(3);
    expect(parsedAfter.actionId).toBe('letters_seniors');

    // Reloading / within the same session cleanly restores 4 / 8 (letters_seniors)
    await gotoHydrated(page, '/');
    await expect(page.locator('.deck-indicator')).toContainText(/^4\s*\/\s*8\b/);
    await expect(page.locator('.energy-tabs [role="tab"]').nth(1)).toHaveAttribute('aria-selected', 'true');
  });

  test('3. Pre-completion and post-completion reward badges match (no 0.65 drop) and donio_utulky shows 100 %', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const cases = [
      { id: 'potravinova_banka', expected: /25\s/ },
      { id: 'charita_dar', expected: /100\s*%/ },
      { id: 'darovani_krve', expected: /3\s/ },
      { id: 'donio_utulky', expected: /100\s*% daru přímo sbírce/ }
    ];

    for (const c of cases) {
      await gotoHydrated(page, `/?action=${c.id}`);
      await page.locator('.instant-card .btn-studio-primary').dispatchEvent('click');
      await page.waitForTimeout(800);

      const preBadge = await page
        .locator('.instant-card .card-effect-stage .impact-payoff-badge')
        .innerText();
      expect(preBadge, `${c.id} pre-done badge`).toMatch(c.expected);

      await page.locator('.instant-card .btn-studio-done').click();
      const postBadge = await page
        .locator('.instant-card .deed-stage.is-payoff .impact-payoff-badge')
        .innerText();
      expect(postBadge, `${c.id} post-done badge`).toMatch(c.expected);
    }
  });

  test('5. Desktop Molly scroll matrix (0..1600) has zero overlap with headings/cards/chips & floating pills never overlap .deck-nav-next', async ({
    page
  }) => {
    test.setTimeout(60_000);
    for (const vp of [
      { width: 1440, height: 900 },
      { width: 1280, height: 800 },
      { width: 1920, height: 1080 }
    ]) {
      await page.setViewportSize(vp);
      await gotoHydrated(page, '/');

      // Check floating pills never overlap .deck-nav-next or .instant-card (both resting and started)
      for (const started of [false, true]) {
        if (started) {
          const popupPromise = page.context().waitForEvent('page', { timeout: 1200 }).catch(() => null);
          await page.locator('.instant-card .btn-studio-primary').dispatchEvent('click');
          const popup = await popupPromise;
          if (popup) await popup.close().catch(() => {});
          await page.bringToFront();
          await page.waitForTimeout(150);
        }
        const pillOverlaps = await page.evaluate(() => {
          const overlap = (a: DOMRect, b: DOMRect) => {
            const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            return w > 0 && h > 0 ? Math.round(w * h) : 0;
          };
          const navNext = document.querySelector('.deck-nav-next')?.getBoundingClientRect();
          const card = document.querySelector('.instant-card')?.getBoundingClientRect();
          const crisis = document.querySelector('.crisis-pill')?.getBoundingClientRect();
          const fb = document.querySelector('.feedback-pill')?.getBoundingClientRect();
          const results: Record<string, number> = {};
          if (crisis && navNext) results.crisisNav = overlap(crisis, navNext);
          if (crisis && card) results.crisisCard = overlap(crisis, card);
          if (fb && navNext) results.fbNav = overlap(fb, navNext);
          if (fb && card) results.fbCard = overlap(fb, card);
          return results;
        });
        for (const [k, area] of Object.entries(pillOverlaps)) {
          expect(area, `${vp.width}x${vp.height} ${k}`).toBe(0);
        }
      }

      if (vp.width <= 1440) {
        for (const y of [0, 200, 400, 600, 1600]) {
          await page.evaluate(
            (scrollTop) => window.scrollTo({ top: scrollTop, behavior: 'instant' as ScrollBehavior }),
            y
          );
          await page.waitForTimeout(320);
          await page
            .waitForFunction(
              () => {
                const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
                if (!actor || actor.classList.contains('is-docked')) return true;
                return actor.getAttribute('data-molly-behavior') !== 'WALK_ROAM';
              },
              null,
              { timeout: 4500 }
            )
            .catch(() => {});
          await page.waitForTimeout(120);

          const collisions = await page.evaluate(() => {
            const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
            if (!actor || actor.classList.contains('is-docked') || getComputedStyle(actor).display === 'none') {
              return [];
            }
            const ar = actor.getBoundingClientRect();
            const cat = {
              left: ar.left + ar.width * 0.14,
              right: ar.right - ar.width * 0.14,
              top: ar.top + ar.height * 0.12,
              bottom: ar.bottom - 2
            };
            const targets = Array.from(
              document.querySelectorAll(
                'h2, h3, a.bento-card, a.card, .quick-tags-pill, .category-aura-chip, .molly-celebration-note, .legend-chip, .qd-chip, .btn-studio-primary, .deck-nav-next'
              )
            );
            const hits: string[] = [];
            for (const el of targets) {
              if (el.closest('.molly-companion-layer, .molly-pelisek-dock')) continue;
              const cs = getComputedStyle(el);
              if (cs.display === 'none' || cs.visibility === 'hidden') continue;
              const r = el.getBoundingClientRect();
              if (r.width < 2 || r.height < 2) continue;
              const w = Math.min(cat.right, r.right) - Math.max(cat.left, r.left);
              const h = Math.min(cat.bottom, r.bottom) - Math.max(cat.top, r.top);
              if (w > 2 && h > 2) {
                hits.push(`${el.tagName}.${el.className}(${Math.round(w * h)}px)`);
              }
            }
            return hits;
          });

          expect(collisions, `${vp.width}x${vp.height} scrollY=${y}`).toEqual([]);
        }
      }
    }
  });

  test('6. /near pin aria-label/title + mobile 360x800 marker tap scrolls .map-active-sheet into viewport', async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/near');

    await page.locator('.mobile-tabs [role="tab"]', { hasText: /Mapa/i }).click();
    await page.locator('.aa-map-pin').first().waitFor({ state: 'visible', timeout: 15_000 });

    const pinMeta = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.aa-map-pin')).map((el) => ({
        ariaLabel: el.getAttribute('aria-label') || '',
        title: el.getAttribute('title') || ''
      }))
    );
    expect(pinMeta.length).toBeGreaterThan(0);
    for (const pm of pinMeta.slice(0, 15)) {
      expect(pm.ariaLabel.trim().length).toBeGreaterThan(3);
      expect(pm.title.trim().length).toBeGreaterThan(3);
    }

    await page.locator('.aa-map-pin').first().click({ force: true });
    await page.waitForTimeout(550);
    const sheet = page.locator('.map-active-sheet');
    await expect(sheet).toBeVisible();
    const sheetBox = await sheet.boundingBox();
    expect(sheetBox).not.toBeNull();
    expect(sheetBox!.y).toBeLessThan(800);
  });

  test('7. Tablet 768x1024 >= 16px inputs, /submit method=post, >= 44px links, .energy-tabs ARIA, .world-pill untinted, /svet sound OFF', async ({
    page
  }) => {
    // Tablet >= 16px inputs
    await page.setViewportSize({ width: 768, height: 1024 });
    const inputChecks = [
      { route: '/submit', selector: '#name' },
      { route: '/app/online', selector: '#online-search' },
      { route: '/app/guided', selector: '#guided-city-select' },
      { route: '/near', selector: '#near-location-query' },
      { route: '/svet', selector: '#ritual-deed-input' }
    ];
    for (const ic of inputChecks) {
      await gotoHydrated(page, ic.route);
      if (ic.route === '/submit') {
        await expect(page.locator('form.form')).toHaveAttribute('method', /post/i);
      }
      const fs = await page.locator(ic.selector).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(fs, `${ic.route} ${ic.selector} fontSize`).toBeGreaterThanOrEqual(16);
    }

    // /svet default sound OFF
    await page.evaluate(() => localStorage.removeItem('aa_sound_muted_v1'));
    await gotoHydrated(page, '/svet');
    const soundBtn = page.locator('.sound-btn');
    await expect(soundBtn).toHaveAttribute('aria-pressed', 'false');
    await soundBtn.click();
    await expect(soundBtn).toHaveAttribute('aria-pressed', 'true');

    // Desktop .world-pill untinted on / & .energy-tabs ARIA + dynamic claim
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/');
    const worldBg = await page.locator('.nav-pill.world-pill').evaluate((el) => ({
      hasActive: el.classList.contains('active'),
      bg: getComputedStyle(el).backgroundColor
    }));
    expect(worldBg.hasActive).toBe(false);
    expect(worldBg.bg).toBe('rgba(0, 0, 0, 0)');

    const tab1 = page.locator('.energy-tabs [role="tab"]').nth(0);
    const tab2 = page.locator('.energy-tabs [role="tab"]').nth(1);
    await expect(tab1).toHaveAttribute('aria-selected', 'true');
    await expect(tab2).toHaveAttribute('aria-selected', 'false');
    await tab2.click();
    await expect(tab2).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.hero-serif')).toContainText('15 minut');
    const desktopCycleBox = await page.locator('.cycle-link').first().boundingBox();
    expect(desktopCycleBox?.height || 0).toBeGreaterThanOrEqual(43.5);
    expect(desktopCycleBox?.width || 0).toBeGreaterThanOrEqual(43.5);

    // Mobile >= 44px links
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/');
    const footerLinkHeights = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.footer-links a')).map((el) => el.getBoundingClientRect().height)
    );
    for (const h of footerLinkHeights) {
      expect(h).toBeGreaterThanOrEqual(43.5);
    }
    const cycleH = await page.locator('.cycle-link').first().evaluate((el) => el.getBoundingClientRect().height);
    expect(cycleH).toBeGreaterThanOrEqual(43.5);

    await page.locator('.instant-card details.how-toggle summary').click();
    const srcH = await page
      .locator('.instant-card .verify-source-link')
      .first()
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(srcH).toBeGreaterThanOrEqual(43.5);
  });

  test('8. 1440x900 post-done celebration controls (.molly-celebration-note, .btn-next-deed) have 0 px2 Molly overlap across /, potravinova_banka, charita_dar, remobil_telefon', async ({
    page
  }) => {
    test.setTimeout(60_000);
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));
    await page.setViewportSize({ width: 1440, height: 900 });

    const routes = [
      '/',
      '/?action=potravinova_banka',
      '/?action=charita_dar',
      '/?action=remobil_telefon'
    ];

    for (const route of routes) {
      await page.goto('about:blank');
      await gotoHydrated(page, '/');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await gotoHydrated(page, route);

      // Wait for Molly initial settle
      await page
        .waitForFunction(
          () => {
            const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
            if (!actor || actor.classList.contains('is-docked')) return true;
            return actor.getAttribute('data-molly-behavior') !== 'WALK_ROAM';
          },
          null,
          { timeout: 4500 }
        )
        .catch(() => {});

      const card = page.locator('.instant-card').first();
      await card.locator('.btn-studio-primary').dispatchEvent('click');
      const doneBtn = card.locator('.btn-studio-done');
      await expect(doneBtn, `${route}: doneBtn visible`).toBeVisible();

      await page
        .waitForFunction(
          () => {
            const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
            if (!actor || actor.classList.contains('is-docked')) return true;
            return actor.getAttribute('data-molly-behavior') !== 'WALK_ROAM';
          },
          null,
          { timeout: 4500 }
        )
        .catch(() => {});

      await doneBtn.click();
      await expect(card.locator('.in-situ-celebration'), `${route}: celebration visible`).toBeVisible();
      await expect(card.locator('.in-situ-celebration .molly-celebration-note')).toBeVisible();
      await expect(card.locator('.in-situ-celebration .btn-next-deed')).toBeVisible();

      // Wait 1200ms post-done AND wait for WALK_ROAM settle
      await page.waitForTimeout(1200);
      await page
        .waitForFunction(
          () => {
            const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
            if (!actor || actor.classList.contains('is-docked')) return true;
            return actor.getAttribute('data-molly-behavior') !== 'WALK_ROAM';
          },
          null,
          { timeout: 4500 }
        )
        .catch(() => {});
      await page.waitForTimeout(100);

      const audit = await page.evaluate(() => {
        const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
        const bubble = document.querySelector('.molly-whisper-bubble') as HTMLElement | null;
        const cel = document.querySelector('.in-situ-celebration') as HTMLElement | null;
        const celOpacity = cel ? getComputedStyle(cel).opacity : null;
        const buttons = Array.from(document.querySelectorAll('.in-situ-celebration button'));
        const extraTargets = Array.from(
          document.querySelectorAll(
            '.in-situ-celebration .molly-celebration-note, .in-situ-celebration a, .deck-nav-next, main h1, main h2, main h3, main button'
          )
        );
        const overlaps: Array<{ source: string; target: string; area: number }> = [];

        const calcArea = (a: DOMRect, b: DOMRect) => {
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          return w > 0 && h > 0 ? Math.round(w * h * 100) / 100 : 0;
        };

        const checkMover = (label: string, el: HTMLElement | null) => {
          if (!el || el.classList.contains('is-docked')) return;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.01) return;
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) return;
          for (const t of [...buttons, ...extraTargets]) {
            if (t.closest('.molly-companion-layer')) continue;
            const tcs = getComputedStyle(t);
            if (tcs.display === 'none' || tcs.visibility === 'hidden') continue;
            const tr = t.getBoundingClientRect();
            if (tr.width < 1 || tr.height < 1) continue;
            const area = calcArea(r, tr);
            if (area > 0) {
              overlaps.push({
                source: label,
                target: `${t.tagName.toLowerCase()}.${typeof t.className === 'string' ? t.className.split(/\s+/).slice(0, 2).join('.') : ''}`,
                area
              });
            }
          }
        };

        checkMover('molly-roaming-actor', actor);
        checkMover('molly-whisper-bubble', bubble);
        return {
          celOpacity,
          buttonCount: buttons.length,
          overlaps
        };
      });

      expect(audit.buttonCount, `${route}: celebration buttons present`).toBeGreaterThanOrEqual(2);
      expect(Number(audit.celOpacity), `${route}: celebration opacity`).toBeGreaterThan(0.95);
      expect(audit.overlaps, `${route}: zero Molly/bubble overlap with celebration controls`).toEqual([]);
    }

    expect(pageErrors, 'Zero pageerrors during 1440x900 celebration checks').toEqual([]);
  });
});

test.describe('M3 Regressions (E2E)', () => {
  test('M3-1: /?action=<id> overrides closed daily session, preserves local done flag, and "Zpět k dnešnímu shrnutí" returns to summary with local todayCount', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHydrated(page, '/');

    const localTodayKey = await page.evaluate(() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });

    await page.evaluate((todayKey) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(`aa_done_for_today_${todayKey}`, '1');
      localStorage.setItem(
        'aa_completed_steps_v2',
        JSON.stringify([
          { uid: 't1', id: 'zvirata_utulek_online', title: 'Test dnes', timestamp: new Date().toISOString() },
          {
            uid: 't2',
            id: 'missing_maps',
            title: 'Test včera',
            timestamp: new Date(Date.now() - 3 * 86400_000).toISOString()
          }
        ])
      );
    }, localTodayKey);

    await gotoHydrated(page, '/?action=potravinova_banka');
    await expect(page.locator('.session-closed-card')).toHaveCount(0);
    await expect(page.locator('.instant-card .action-title')).toContainText(/potravin/i);

    const doneFlagDuringDeepLink = await page.evaluate(
      (todayKey) => localStorage.getItem(`aa_done_for_today_${todayKey}`),
      localTodayKey
    );
    expect(doneFlagDuringDeepLink).toBe('1');

    const exitBtn = page.locator('.deeplink-exit-btn');
    await expect(exitBtn).toBeVisible();
    await expect(exitBtn).toContainText('Zpět k dnešnímu shrnutí');
    const exitBox = await exitBtn.boundingBox();
    expect(exitBox?.height || 0).toBeGreaterThanOrEqual(44);

    await exitBtn.click();
    await expect(page.locator('.session-closed-card')).toBeVisible();
    await expect(page.locator('.session-closed-card')).toContainText('Svět je díky tobě');
    await expect(page.locator('.session-closed-card')).not.toContainText('Udělal/a');
    await expect(page.locator('.closed-stats-pill')).toContainText('1 skutek');

    // Deep-link on an unclosed day: clicking "Pro dnešek hotovo" must persist aa_done_for_today_<today>='1'
    await page.evaluate((todayKey) => {
      localStorage.removeItem(`aa_done_for_today_${todayKey}`);
      sessionStorage.clear();
    }, localTodayKey);
    await gotoHydrated(page, '/?action=potravinova_banka');
    await page.locator('.instant-card .btn-studio-primary').dispatchEvent('click');
    await page.locator('.instant-card .btn-studio-done').click();
    await page.locator('.instant-card .btn-session-close').click();
    await expect(page.locator('.session-closed-card')).toBeVisible();
    const persistedDoneAfterDeepLinkClose = await page.evaluate(
      (todayKey) => localStorage.getItem(`aa_done_for_today_${todayKey}`),
      localTodayKey
    );
    expect(persistedDoneAfterDeepLinkClose).toBe('1');
    await gotoHydrated(page, '/');
    await expect(page.locator('.session-closed-card')).toBeVisible();
  });

  test('M3-2: Energy tabs show distinct deck counts (45 / 8 / 16 / 9) and fresh session always enters on "couch" even with stale localStorage', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHydrated(page, '/');

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(
        'aa_home_deck_state_v1',
        JSON.stringify({
          energyMode: 'people',
          actionId: 'brontosaurus_vikend',
          index: 0,
          excludeQuickId: '',
          usePersonalValues: false
        })
      );
    });

    await gotoHydrated(page, '/');
    const tabs = page.locator('.energy-tabs [role="tab"]');
    const indicator = page.locator('.deck-indicator');

    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(indicator).toContainText(/^1\s*\/\s*45\b/);

    await tabs.nth(1).click();
    await expect(indicator).toContainText(/^1\s*\/\s*8\b/);

    await tabs.nth(2).click();
    await expect(indicator).toContainText(/^1\s*\/\s*16\b/);

    await tabs.nth(3).click();
    await expect(indicator).toContainText(/^1\s*\/\s*9\b/);
  });

  test('M3-3: 375x667 primary CTA sits cleanly above fold (bottom <= 667), 1-row tabs, zero overflow, zero layout jump, and <details> resets on Next/Prev', async ({
    page
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoHydrated(page, '/');

    const initialFold = await page.evaluate(() => {
      const cta = document.querySelector('.instant-card .btn-studio-primary')!;
      const tabs = Array.from(document.querySelectorAll('.energy-tabs .energy-tab'));
      const card = document.querySelector('.instant-card')!;
      const title = document.querySelector('.instant-card .action-title')!;
      const tabTops = tabs.map((t) => Math.round(t.getBoundingClientRect().top));
      const tabHeights = tabs.map((t) => t.getBoundingClientRect().height);
      return {
        scrollY: window.scrollY,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ctaBottom: cta.getBoundingClientRect().bottom,
        ctaHeight: cta.getBoundingClientRect().height,
        cardTop: card.getBoundingClientRect().top,
        titleTop: title.getBoundingClientRect().top,
        tabTopSpread: Math.max(...tabTops) - Math.min(...tabTops),
        minTabHeight: Math.min(...tabHeights)
      };
    });

    expect(initialFold.scrollY).toBe(0);
    expect(initialFold.overflow).toBe(false);
    expect(initialFold.ctaHeight).toBeGreaterThanOrEqual(44);
    expect(initialFold.ctaBottom).toBeLessThanOrEqual(667);
    expect(initialFold.tabTopSpread).toBeLessThanOrEqual(2);
    expect(initialFold.minTabHeight).toBeGreaterThanOrEqual(44);

    // Open <details>, navigate Next, verify <details> resets to closed
    const howToggle = page.locator('.instant-card details.how-toggle');
    await howToggle.locator('summary').click();
    await expect(howToggle).toHaveAttribute('open', '');
    await page.locator('.deck-nav-next').click();
    await expect(howToggle).not.toHaveAttribute('open', '');
    await page.locator('.deck-nav-prev').click();
    await expect(howToggle).not.toHaveAttribute('open', '');

    // Single morphing stage: zero ~110px layout jump across preview -> active -> payoff
    const beforeTitleTop = await page.locator('.instant-card .action-title').evaluate((el) => el.getBoundingClientRect().top);
    await page.locator('.instant-card .btn-studio-primary').dispatchEvent('click');
    await expect(page.locator('.instant-card .deed-stage[data-stage-mode="active"]')).toBeVisible();
    const activeTitleTop = await page.locator('.instant-card .action-title').evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(activeTitleTop - beforeTitleTop)).toBeLessThanOrEqual(24);
    expect(await page.locator('.instant-card canvas').count()).toBe(1);

    await page.locator('.instant-card .btn-studio-done').click();
    await expect(page.locator('.instant-card .deed-stage[data-stage-mode="payoff"]')).toBeVisible();
    const payoffTitleTop = await page.locator('.instant-card .action-title').evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(payoffTitleTop - activeTitleTop)).toBeLessThanOrEqual(24);
    expect(await page.locator('.instant-card canvas').count()).toBe(1);
    await expect(page.locator('.celebration-card .win-title')).toHaveCount(0);

    // WCAG 2.5.3 Label-in-Name on "Pro dnešek hotovo" + zero banned copy
    const closeBtn = page.locator('.btn-session-close');
    await expect(closeBtn).toBeVisible();
    const closeAria = (await closeBtn.getAttribute('aria-label')) || '';
    expect(closeAria).toContain('Pro dnešek hotovo');
    const cardText = await page.locator('.instant-card').innerText();
    expect(cardText).not.toContain('dnešní seanci');
    expect(cardText).not.toContain('Ověřený dopad');
    expect(cardText).not.toContain('Přínos (');
  });

  test('M3-4: Desktop Hero 2-line H1, WebP <picture>, light :focus-visible ring, Footer, 404 serif dot, Modals a11y & Molly /svet', async ({
    page
  }) => {
    // 1. Desktop Hero checks (1440x900 & 1280x800)
    for (const vp of [
      { width: 1440, height: 900 },
      { width: 1280, height: 800 }
    ]) {
      await page.setViewportSize(vp);
      await gotoHydrated(page, '/');

      const heroCheck = await page.evaluate(() => {
        const h1 = document.querySelector('.hero-title') as HTMLElement | null;
        const desktopSpan = document.querySelector('.hero-desktop-heading') as HTMLElement | null;
        const lineHeight = h1 ? parseFloat(getComputedStyle(h1).lineHeight) : 40;
        const lines = desktopSpan ? Math.round(desktopSpan.getBoundingClientRect().height / lineHeight) : 99;
        const picture = document.querySelector('.hero-painted-backdrop');
        const webpSource = picture?.querySelector('source[type="image/webp"]')?.getAttribute('srcset') || '';
        const imgSrc = picture?.querySelector('img')?.currentSrc || '';
        return { lines, webpSource, imgSrc };
      });
      expect(heroCheck.lines, `${vp.width}x${vp.height} H1 lines`).toBeLessThanOrEqual(2);
      expect(heroCheck.webpSource).toContain('/art/sanctuary-dawn-800.webp');
      expect(heroCheck.imgSrc).toContain('/art/sanctuary-dawn');

      // Focus-visible light ring on desktop hero CTA
      const heroMapLink = page.locator('.hero-copy a[href="/near"]');
      await heroMapLink.focus();
      const focusOutline = await heroMapLink.evaluate((el) => getComputedStyle(el).outlineColor);
      expect(focusOutline).toBe('rgb(254, 243, 199)');
    }

    // 2. Footer single /submit & zero • separators
    expect(await page.locator('footer a[href="/submit"]').count()).toBe(1);
    const trustText = await page.locator('.footer-trust').innerText();
    expect(trustText).not.toContain('•');

    // 3. ImmediateHelp modal: aria-modal, focus-on-open, tel:155/tel:112 >= 44px, Escape restores focus, zero .crisis-mobile-fab
    await expect(page.locator('.crisis-mobile-fab')).toHaveCount(0);
    const crisisTrigger = page.locator('.crisis-trigger');
    await crisisTrigger.focus();
    await crisisTrigger.click();
    const crisisPanel = page.locator('.crisis-panel');
    await expect(crisisPanel).toBeVisible();
    await expect(crisisPanel).toHaveAttribute('aria-modal', 'true');
    const tel155Box = await crisisPanel.locator('a[href="tel:155"]').boundingBox();
    const tel112Box = await crisisPanel.locator('a[href="tel:112"]').boundingBox();
    expect(tel155Box?.height || 0).toBeGreaterThanOrEqual(44);
    expect(tel155Box?.width || 0).toBeGreaterThanOrEqual(44);
    expect(tel112Box?.height || 0).toBeGreaterThanOrEqual(44);
    expect(tel112Box?.width || 0).toBeGreaterThanOrEqual(44);
    const crisisActiveInside = await page.evaluate(() =>
      Boolean(document.querySelector('.crisis-panel')?.contains(document.activeElement))
    );
    expect(crisisActiveInside).toBe(true);
    await page.keyboard.press('Escape');
    await expect(crisisPanel).toBeHidden();
    const restoredCrisis = await page.evaluate(() => ({
      isTrigger: Boolean(document.activeElement?.classList.contains('crisis-trigger')),
      isHiddenMobileToggle: Boolean(document.activeElement?.classList.contains('mobile-nav-toggle'))
    }));
    expect(restoredCrisis.isTrigger).toBe(true);
    expect(restoredCrisis.isHiddenMobileToggle).toBe(false);

    // 4. FeedbackModal: focus moves to #fb-textarea, maxlength=1500, Escape restores focus
    const fbTrigger = page.locator('.fc-feedback');
    await fbTrigger.focus();
    await fbTrigger.click();
    const fbTextarea = page.locator('#fb-textarea');
    await expect(fbTextarea).toBeVisible();
    await expect(fbTextarea).toHaveAttribute('maxlength', '1500');
    await expect(fbTextarea).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(fbTextarea).toBeHidden();
    const restoredFb = await page.evaluate(() => ({
      isTrigger: Boolean(document.activeElement?.classList.contains('fc-feedback')),
      isHiddenMobileToggle: Boolean(document.activeElement?.classList.contains('mobile-nav-toggle'))
    }));
    expect(restoredFb.isTrigger).toBe(true);
    expect(restoredFb.isHiddenMobileToggle).toBe(false);

    // 4b. Mobile drawer (375x667) -> ImmediateHelp & FeedbackModal Escape focus restoration to .mobile-nav-toggle (NOT BODY)
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoHydrated(page, '/');

    await page.locator('button.mobile-nav-toggle').click();
    await page.locator('#mobile-top-nav-drawer').getByRole('button', { name: /Tichá opora 24\/7/i }).click();
    await expect(crisisPanel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(crisisPanel).toBeHidden();
    const mobileCrisisRestore = await page.evaluate(() => ({
      tag: document.activeElement?.tagName || '',
      isNavToggle: Boolean(document.activeElement?.classList.contains('mobile-nav-toggle'))
    }));
    expect(mobileCrisisRestore.tag).not.toBe('BODY');
    expect(mobileCrisisRestore.isNavToggle).toBe(true);

    await page.locator('button.mobile-nav-toggle').click();
    await page.locator('#mobile-top-nav-drawer').getByRole('button', { name: /Napsat názor/i }).click();
    await expect(fbTextarea).toBeVisible();
    await expect(fbTextarea).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(fbTextarea).toBeHidden();
    const mobileFbRestore = await page.evaluate(() => ({
      tag: document.activeElement?.tagName || '',
      isNavToggle: Boolean(document.activeElement?.classList.contains('mobile-nav-toggle'))
    }));
    expect(mobileFbRestore.tag).not.toBe('BODY');
    expect(mobileFbRestore.isNavToggle).toBe(true);

    // 5. 404 trailing period inside .serif-accent
    await gotoHydrated(page, '/nonexistent-404-m3-check');
    await expect(page.locator('.page-header-title .serif-accent')).toContainText('naděje nekončí.');

    // 6. On /svet the dock & sanctuary pill stay visible
    await gotoHydrated(page, '/svet');
    await expect(page.locator('.molly-pelisek-dock')).toBeVisible();
    await expect(page.locator('.molly-sanctuary-pill')).toBeVisible();
  });
});
