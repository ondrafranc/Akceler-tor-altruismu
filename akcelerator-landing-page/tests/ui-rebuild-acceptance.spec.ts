import { test, expect, type Page, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Opaque-Box UI/UX Rebuild Acceptance Test Suite
 *
 * Derived strictly from:
 * - ORIGINAL_REQUEST.md (R1-R5 & Acceptance Criteria)
 * - AGENTS.md § 1 & § 2.4
 * - PROJECT.md § Interface Contracts
 *
 * Covers Tiers 1-4 across all 7 routes x 3 viewports (360x800, 375x667, 1440x900).
 */

type RouteSpec = {
  path: string;
  slug: string;
  label: string;
};

type ViewportSpec = {
  name: string;
  width: number;
  height: number;
  isMobile: boolean;
};

type EmojiViolation = {
  kind: 'innerText' | 'textNode' | 'attribute';
  selector: string;
  char: string;
  codePoint: string;
  snippet: string;
};

type CollisionReport = {
  pair: string;
  overlapW: number;
  overlapH: number;
  area: number;
};

type RuntimeErrorBag = {
  consoleErrors: string[];
  pageErrors: string[];
};

const ROUTES: readonly RouteSpec[] = [
  { path: '/', slug: 'home', label: 'Domů' },
  { path: '/app', slug: 'app', label: 'Rozcestník' },
  { path: '/app/guided', slug: 'app-guided', label: 'Průvodce' },
  { path: '/app/online', slug: 'app-online', label: 'Katalog online' },
  { path: '/near', slug: 'near', label: 'V okolí' },
  { path: '/svet', slug: 'svet', label: 'Krajina dobra' },
  { path: '/submit', slug: 'submit', label: 'Přidat místo nebo akci' }
] as const;

const VIEWPORTS: readonly ViewportSpec[] = [
  { name: '360x800', width: 360, height: 800, isMobile: true },
  { name: '375x667', width: 375, height: 667, isMobile: true },
  { name: '1440x900', width: 1440, height: 900, isMobile: false }
] as const;

const NAV_ROUTE_HREFS = ['/', '/app/guided', '/app/online', '/near', '/svet', '/submit'] as const;

const SCREENSHOT_DIR = path.join('test-results', 'rebuild-screenshots');

/**
 * Authoritative Unicode emoji & decorative symbol detector.
 * Closes the 6-glyph gap (✦, ✕, ✓, ▸, ▾, ↻) missed by Extended_Pictographic alone
 * while keeping 0 false positives on Czech diacritics, dashes, quotes, dots, or →/←/↓.
 */
const FORBIDDEN_EMOJI_OR_GLYPH_RE =
  /[\p{Extended_Pictographic}\uFE0F\u200D\u20E3\u2726\u2727\u2728\u2795\u2713\u2714\u2715\u2716\u2605\u2606\u25B8\u25BE\u25B6\u25BC\u21BB\u21BA\u2197\u2139]|[\u{1F1E6}-\u{1F1FF}]{2}|[0-9#*]\uFE0F?\u20E3/u;

const ONE_BY_ONE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

async function setupPageEnvironment(page: Page): Promise<RuntimeErrorBag> {
  const errors: RuntimeErrorBag = {
    consoleErrors: [],
    pageErrors: []
  };

  await page.addInitScript(() => {
    try {
      if (!window.sessionStorage.getItem('__pw_clean_bootstrapped')) {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.sessionStorage.setItem('__pw_clean_bootstrapped', '1');
      }
    } catch {
      // Ignore storage access restriction if any
    }
  });

  // Deterministic CI/offline network handling for map tiles and Vercel edge scripts
  await page.route('https://*.tile.openstreetmap.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: ONE_BY_ONE_PNG })
  );
  await page.route('https://*.basemaps.cartocdn.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: ONE_BY_ONE_PNG })
  );
  await page.route('**/_vercel/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );

  // Safely handle external target="_blank" deeds without navigating away or hitting live internet
  await page.context().route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => {
    const reqUrl = route.request().url();
    if (reqUrl.includes('tile.openstreetmap.org') || reqUrl.includes('basemaps.cartocdn.com')) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: ONE_BY_ONE_PNG });
    }
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html lang="cs"><body>Partner OK</body></html>'
    });
  });

  page.on('popup', (popup) => {
    void popup.close().catch(() => {});
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    errors.pageErrors.push(err.message || String(err));
  });

  return errors;
}

async function gotoHydrated(page: Page, routePath: string): Promise<void> {
  let nearbyLoaded = routePath !== '/near';
  let communityLoaded = routePath !== '/near';

  const onResponse = (res: { url: () => string }) => {
    const u = res.url();
    if (u.includes('/api/nearby')) nearbyLoaded = true;
    if (u.includes('/api/community-nearby')) communityLoaded = true;
  };

  if (routePath === '/near') {
    page.on('response', onResponse);
  }

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(routePath, { waitUntil: 'domcontentloaded' });
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (
        attempt < 2 &&
        (msg.includes('ECONNREFUSED') ||
          msg.includes('ERR_CONNECTION_REFUSED') ||
          msg.includes('ERR_CONNECTION_RESET'))
      ) {
        await page.waitForTimeout(500);
        continue;
      }
      throw err;
    }
  }
  if (lastError) throw lastError;

  await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);

  if (routePath === '/near') {
    const deadline = Date.now() + 5000;
    while ((!nearbyLoaded || !communityLoaded) && Date.now() < deadline) {
      await page.waitForTimeout(100);
    }
    page.off('response', onResponse);
    await page
      .locator('.places-stack .place-card, .places-empty, .leaflet-container')
      .first()
      .waitFor({ state: 'attached', timeout: 5000 })
      .catch(() => {});
  }

  // Wait > 400ms for Molly layout settle and initial canvas diorama paint
  await page.waitForTimeout(450);
}

function assertZeroRuntimeErrors(errors: RuntimeErrorBag, contextLabel: string): void {
  expect(
    errors.pageErrors,
    `[PageError] ${contextLabel}: ${errors.pageErrors.join(' | ')}`
  ).toEqual([]);
  expect(
    errors.consoleErrors,
    `[ConsoleError] ${contextLabel}: ${errors.consoleErrors.join(' | ')}`
  ).toEqual([]);
}

async function scanForbiddenEmojis(page: Page, rootSelector = 'body'): Promise<EmojiViolation[]> {
  return page.evaluate(
    ({ selector, reSource }) => {
      const root = document.querySelector(selector);
      if (!root) return [];

      const reSingle = new RegExp(reSource, 'u');
      const reGlobal = new RegExp(reSource, 'gu');
      const violations: EmojiViolation[] = [];

      function describeEl(el: Element | null): string {
        if (!el) return '(null)';
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const cls =
          typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
            : '';
        return `${tag}${id}${cls}`;
      }

      function isElVisible(el: Element): boolean {
        if (el.closest('details:not([open])') && !el.closest('summary')) return false;
        let cur: Element | null = el;
        while (cur && cur !== document.documentElement) {
          const cs = window.getComputedStyle(cur);
          if (
            cs.display === 'none' ||
            cs.visibility === 'hidden' ||
            parseFloat(cs.opacity) <= 0.01
          ) {
            return false;
          }
          cur = cur.parentElement;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0.5 && rect.height > 0.5;
      }

      function isSrOnlyReachable(el: Element): boolean {
        if (!el.closest('.sr-only')) return false;
        if (el.closest('details:not([open])') && !el.closest('summary')) return false;
        let cur: Element | null = el;
        while (cur && cur !== document.documentElement) {
          const cs = window.getComputedStyle(cur);
          if (cs.display === 'none' || cs.visibility === 'hidden') {
            return false;
          }
          if (!cur.classList.contains('sr-only') && parseFloat(cs.opacity) <= 0.01) {
            return false;
          }
          cur = cur.parentElement;
        }
        return true;
      }

      function collectMatches(
        kind: EmojiViolation['kind'],
        el: Element | null,
        text: string
      ): void {
        if (!text || !reSingle.test(text)) return;
        reGlobal.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = reGlobal.exec(text)) !== null) {
          const ch = match[0];
          // Plain typographic © / ® / ™ are permitted unless paired with emoji variation selector U+FE0F
          if (
            (ch === '\u00A9' || ch === '\u00AE' || ch === '\u2122') &&
            text.charCodeAt(match.index + ch.length) !== 0xfe0f
          ) {
            continue;
          }
          const cp = ch.codePointAt(0) ?? 0;
          violations.push({
            kind,
            selector: describeEl(el),
            char: ch,
            codePoint: 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'),
            snippet: text.trim().slice(0, 80)
          });
        }
      }

      // 1. Rendered innerText on root (excluding third-party .leaflet-control-attribution)
      if (root instanceof HTMLElement) {
        let renderedText = root.innerText || '';
        const attributions = root.querySelectorAll('.leaflet-control-attribution');
        for (const attrEl of attributions) {
          if (attrEl instanceof HTMLElement) {
            const attrText = (attrEl.innerText || '').trim();
            if (attrText) {
              renderedText = renderedText.replace(attrText, '');
            }
          }
        }
        collectMatches('innerText', root, renderedText);
      }

      // 2. Text nodes (excluding svg/script/style/noscript/template & Leaflet attribution; keep reachable .sr-only)
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const parent = node.parentElement;
        if (
          parent &&
          !parent.closest('svg, script, style, noscript, template, .leaflet-control-attribution')
        ) {
          const txt = node.nodeValue || '';
          if (txt.trim() && (isElVisible(parent) || isSrOnlyReachable(parent))) {
            collectMatches('textNode', parent, txt);
          }
        }
        node = walker.nextNode();
      }

      // 3. Visible attributes and interactive element text (excluding Leaflet attribution)
      const attrEls = root.querySelectorAll(
        'button, a, [role="button"], input, textarea, select, summary, [aria-label], [title], img[alt], .leaflet-marker-icon, .leaflet-popup-content'
      );
      for (const el of attrEls) {
        if (el.closest('.leaflet-control-attribution')) continue;
        if (!isElVisible(el) && !isSrOnlyReachable(el)) continue;
        for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) {
          const val = el.getAttribute(attr);
          if (val) collectMatches('attribute', el, val);
        }
        if (
          el instanceof HTMLElement &&
          (el.classList.contains('leaflet-marker-icon') ||
            el.classList.contains('leaflet-popup-content'))
        ) {
          collectMatches('innerText', el, el.innerText || '');
        }
      }

      return violations;
    },
    { selector: rootSelector, reSource: FORBIDDEN_EMOJI_OR_GLYPH_RE.source }
  );
}

async function assertZeroBottomNav(page: Page, contextLabel: string): Promise<void> {
  const bottomNavCheck = await page.evaluate(() => {
    const legacyCount = document.querySelectorAll('.mobile-bottom-nav').length;
    const fixedBottomNavs: string[] = [];
    const navs = document.querySelectorAll('nav, [role="navigation"]');
    for (const nav of navs) {
      const cs = window.getComputedStyle(nav);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.01) {
        continue;
      }
      const r = nav.getBoundingClientRect();
      if (r.width <= 0.5 || r.height <= 0.5) continue;
      if (
        cs.position === 'fixed' &&
        r.bottom >= window.innerHeight - 8 &&
        r.top >= window.innerHeight - 120
      ) {
        fixedBottomNavs.push(`${nav.tagName.toLowerCase()}.${nav.className}`);
      }
    }
    return { legacyCount, fixedBottomNavs };
  });

  expect(bottomNavCheck.legacyCount, `${contextLabel}: .mobile-bottom-nav must not exist`).toBe(0);
  expect(
    bottomNavCheck.fixedBottomNavs,
    `${contextLabel}: no fixed bottom navigation bar allowed`
  ).toEqual([]);
}

async function assertZeroHeaderShield(page: Page, contextLabel: string): Promise<void> {
  const shieldFindings = await page.evaluate(() => {
    const capsule = document.querySelector('header.top-nav .nav-capsule');
    if (!capsule) return ['missing .nav-capsule'];
    const issues: string[] = [];
    const text = capsule instanceof HTMLElement ? capsule.innerText : capsule.textContent || '';
    if (text.includes('🛡️') || text.includes('\u{1F6E1}')) {
      issues.push('shield emoji inside .nav-capsule');
    }
    const shieldEls = capsule.querySelectorAll(
      '.crisis-trigger, .crisis-pill, svg.lucide-shield, svg.lucide-shield-alert, svg.lucide-shield-check, [aria-label*="Krizov" i]'
    );
    if (shieldEls.length > 0) {
      issues.push(`shield/crisis control inside .nav-capsule (${shieldEls.length})`);
    }
    return issues;
  });
  expect(shieldFindings, `${contextLabel}: zero shield icon inside .nav-capsule`).toEqual([]);
}

async function assertZeroOverflow(page: Page, contextLabel: string): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const maxScroll = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
    return {
      hasOverflow: maxScroll > doc.clientWidth + 1,
      scrollWidth: maxScroll,
      clientWidth: doc.clientWidth
    };
  });
  expect(
    overflow.hasOverflow,
    `[Horizontal Overflow] ${contextLabel}: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}`
  ).toBe(false);
}

async function detectHeaderAndMollyCollisions(page: Page): Promise<CollisionReport[]> {
  return page.evaluate(() => {
    type RectBox = { left: number; top: number; right: number; bottom: number; width: number; height: number };

    function isVisible(el: Element | null): el is Element {
      if (!el) return false;
      if (el.closest('details:not([open])') && !el.closest('summary')) return false;
      let cur: Element | null = el;
      while (cur && cur !== document.documentElement) {
        const cs = window.getComputedStyle(cur);
        if (
          cs.display === 'none' ||
          cs.visibility === 'hidden' ||
          parseFloat(cs.opacity) <= 0.01
        ) {
          return false;
        }
        cur = cur.parentElement;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0.5 && r.height > 0.5;
    }

    function intersect(a: RectBox, b: RectBox, tol = 1.5): { overlapW: number; overlapH: number; area: number } | null {
      const overlapW = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapH = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (overlapW > tol && overlapH > tol) {
        return { overlapW, overlapH, area: overlapW * overlapH };
      }
      return null;
    }

    function tagLabel(el: Element): string {
      const id = el.id ? `#${el.id}` : '';
      const cls =
        typeof el.className === 'string' && el.className.trim()
          ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
          : '';
      return `${el.tagName.toLowerCase()}${id}${cls}`;
    }

    const reports: CollisionReport[] = [];

    // 1. Header internals pairwise + containment inside .nav-capsule
    const capsule = document.querySelector('header.top-nav .nav-capsule');
    const mollyDock = document.querySelector('.molly-pelisek-dock');
    let mollyHandledInHeader = false;

    if (capsule && isVisible(capsule)) {
      const capRect = capsule.getBoundingClientRect();
      const headerPeers: Element[] = [];
      for (const sel of [
        'a.brand',
        'button.mobile-nav-toggle',
        'nav.nav-links'
      ]) {
        const el = capsule.querySelector(sel);
        if (el && isVisible(el)) headerPeers.push(el);
      }

      if (mollyDock && isVisible(mollyDock)) {
        const mdRect = mollyDock.getBoundingClientRect();
        if (capsule.contains(mollyDock) || mdRect.top < capRect.bottom + 8) {
          headerPeers.push(mollyDock);
          mollyHandledInHeader = true;
        }
      }

      for (let i = 0; i < headerPeers.length; i++) {
        const a = headerPeers[i];
        const ra = a.getBoundingClientRect();
        const isContained = capsule.contains(a);
        const topOverflow = isContained && ra.top < capRect.top - 2;
        if (
          ra.left < capRect.left - 2 ||
          ra.right > capRect.right + 2 ||
          ra.bottom > capRect.bottom + 3 ||
          topOverflow
        ) {
          reports.push({
            pair: `header-bounds:${tagLabel(a)}`,
            overlapW: Math.max(0, ra.right - capRect.right, capRect.left - ra.left),
            overlapH: Math.max(
              0,
              ra.bottom - capRect.bottom,
              isContained ? capRect.top - ra.top : 0
            ),
            area: 10
          });
        }
        for (let j = i + 1; j < headerPeers.length; j++) {
          const b = headerPeers[j];
          if (a.contains(b) || b.contains(a)) continue;
          const hit = intersect(ra, b.getBoundingClientRect(), 1.5);
          if (hit) {
            reports.push({
              pair: `header:${tagLabel(a)}<->${tagLabel(b)}`,
              ...hit
            });
          }
        }
      }

      const navLinks = capsule.querySelector('nav.nav-links');
      if (navLinks && isVisible(navLinks)) {
        const pills = Array.from(navLinks.querySelectorAll('.nav-pill, a')).filter(isVisible);
        for (let i = 0; i < pills.length; i++) {
          for (let j = i + 1; j < pills.length; j++) {
            if (pills[i].contains(pills[j]) || pills[j].contains(pills[i])) continue;
            const hit = intersect(
              pills[i].getBoundingClientRect(),
              pills[j].getBoundingClientRect(),
              1.5
            );
            if (hit) {
              reports.push({
                pair: `nav-pill:${tagLabel(pills[i])}<->${tagLabel(pills[j])}`,
                ...hit
              });
            }
          }
        }
      }
    }

    // 2. Molly actors & whisper bubbles vs page content / pagination / CTA / crisis
    const mollyActors = Array.from(
      document.querySelectorAll('.molly-roaming-actor, .molly-whisper-bubble, .molly-dock-whisper')
    ).filter(isVisible);
    if (!mollyHandledInHeader && mollyDock && isVisible(mollyDock)) {
      mollyActors.push(mollyDock);
    }

    const targets = Array.from(
      document.querySelectorAll(
        [
          '.instant-card .btn-studio-primary',
          '.instant-card .btn-studio-done',
          '.instant-card .cycle-btn',
          '.instant-card .energy-tab',
          '.instant-card details.how-toggle summary',
          '.instant-card h1',
          '.instant-card h2',
          '.instant-card p',
          '.deck-header-bar',
          '.deck-indicator',
          '.deck-nav-prev',
          '.deck-nav-next',
          '.crisis-trigger',
          'main h1',
          'main button',
          'main a.btn-studio-primary',
          '.site-footer .footer-brand',
          '.site-footer .footer-desc',
          '.site-footer .footer-heading',
          '.map-frame'
        ].join(', ')
      )
    ).filter(isVisible);

    for (const actor of mollyActors) {
      const ra = actor.getBoundingClientRect();
      for (const target of targets) {
        if (actor.contains(target) || target.contains(actor)) continue;
        if (target.closest('.molly-companion-layer')) continue;
        const hit = intersect(ra, target.getBoundingClientRect(), 1.5);
        if (hit) {
          reports.push({
            pair: `molly:${tagLabel(actor)}<->${tagLabel(target)}`,
            ...hit
          });
        }
      }
    }

    return reports;
  });
}

async function assertMobileTouchTargets(page: Page, contextLabel: string): Promise<number> {
  const result = await page.evaluate(() => {
    function isVisible(el: Element): boolean {
      if (el.closest('details:not([open])') && !el.closest('summary')) return false;
      let cur: Element | null = el;
      while (cur && cur !== document.documentElement) {
        const cs = window.getComputedStyle(cur);
        if (
          cs.display === 'none' ||
          cs.visibility === 'hidden' ||
          parseFloat(cs.opacity) <= 0.01
        ) {
          return false;
        }
        cur = cur.parentElement;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0.5 && r.height > 0.5;
    }

    const selector = [
      'button',
      '[role="button"]',
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"])',
      'select',
      'textarea',
      'summary',
      'a.brand',
      'a.nav-pill',
      'a.mobile-drawer-link',
      'a.btn-studio-primary',
      'a.hero-btn',
      'a.fc-btn',
      'a.card',
      'a.q-pill',
      '.energy-tab',
      '.filter-chip',
      '.deck-nav-btn',
      '.molly-dock-pet-btn',
      '.molly-dock-toggle-btn',
      '.crisis-trigger',
      'a'
    ].join(', ');

    const seen = new Set<Element>();
    const failures: Array<{ desc: string; width: number; height: number }> = [];
    let checkedCount = 0;

    for (const el of document.querySelectorAll(selector)) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (!isVisible(el)) continue;
      if (el.closest('.hp') || el.id === 'hp_company') continue;

      // Skip inline prose links inside body copy/lists/footer metadata
      if (
        el.tagName === 'A' &&
        !el.classList.contains('brand') &&
        !el.classList.contains('nav-pill') &&
        !el.classList.contains('mobile-drawer-link') &&
        !el.classList.contains('btn-studio-primary') &&
        !el.classList.contains('hero-btn') &&
        !el.classList.contains('fc-btn') &&
        !el.classList.contains('card') &&
        !el.classList.contains('q-pill') &&
        !el.classList.contains('energy-tab') &&
        !el.classList.contains('filter-chip') &&
        !el.classList.contains('deck-nav-btn') &&
        !el.classList.contains('crisis-trigger') &&
        !el.closest('#mobile-top-nav-drawer') &&
        el.closest('p, li, .footer-links, .verify-meta, .molly-celebration-note')
      ) {
        continue;
      }

      // Leaflet map attribution links are third-party library chrome inside .leaflet-control-attribution
      if (el.closest('.leaflet-control-attribution')) continue;

      checkedCount += 1;
      const r = el.getBoundingClientRect();
      if (r.width < 43.5 || r.height < 43.5) {
        const text = (el instanceof HTMLElement ? el.innerText : el.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 30);
        const cls =
          typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
            : '';
        failures.push({
          desc: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls}("${text}")`,
          width: Math.round(r.width * 10) / 10,
          height: Math.round(r.height * 10) / 10
        });
      }
    }

    return { checkedCount, failures };
  });

  expect(
    result.checkedCount,
    `[Touch Target] ${contextLabel}: expected at least 1 visible interactive control`
  ).toBeGreaterThan(0);
  expect(
    result.failures,
    `[Touch Target < 44x44px] ${contextLabel}: ${JSON.stringify(result.failures)}`
  ).toEqual([]);
  return result.checkedCount;
}

async function assertMobileInputFontSizes(page: Page, contextLabel: string): Promise<number> {
  const result = await page.evaluate(() => {
    function isVisible(el: Element): boolean {
      if (el.closest('details:not([open])') && !el.closest('summary')) return false;
      let cur: Element | null = el;
      while (cur && cur !== document.documentElement) {
        const cs = window.getComputedStyle(cur);
        if (
          cs.display === 'none' ||
          cs.visibility === 'hidden' ||
          parseFloat(cs.opacity) <= 0.01
        ) {
          return false;
        }
        cur = cur.parentElement;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0.5 && r.height > 0.5;
    }

    const failures: Array<{ desc: string; fontSize: number }> = [];
    let checkedCount = 0;
    const fields = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select'
    );
    for (const el of fields) {
      if (el.closest('.hp') || el.id === 'hp_company') continue;
      if (!isVisible(el)) continue;
      checkedCount += 1;
      const fs = parseFloat(window.getComputedStyle(el).fontSize);
      if (Number.isNaN(fs) || fs < 16) {
        const cls =
          typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
            : '';
        failures.push({
          desc: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls}`,
          fontSize: fs
        });
      }
    }
    return { checkedCount, failures };
  });

  expect(
    result.checkedCount,
    `[Input font-size] ${contextLabel}: expected at least 1 visible input/textarea/select`
  ).toBeGreaterThan(0);
  expect(
    result.failures,
    `[Input font-size < 16px] ${contextLabel}: ${JSON.stringify(result.failures)}`
  ).toEqual([]);
  return result.checkedCount;
}

async function assertNoFomoOrJargon(page: Page, routePath: string, contextLabel: string): Promise<void> {
  const check = await page.evaluate(() => {
    const ambientCount = document.querySelectorAll('.ambient-pulse-pill').length;
    const bodyText = document.body.innerText || '';
    const hasLegacyDukazy = /\bDůkazy\s+[ABC]\b/i.test(bodyText);
    const hasLegacySilne = /\bSilné důkazy\b/i.test(bodyText);
    const hasOverenyDopad = bodyText.includes('Ověřený dopad');
    const hasDaylightEvidence = bodyText.includes('Přímý měřitelný účinek');
    return { ambientCount, hasLegacyDukazy, hasLegacySilne, hasOverenyDopad, hasDaylightEvidence };
  });

  expect(check.ambientCount, `${contextLabel}: zero .ambient-pulse-pill`).toBe(0);
  expect(check.hasLegacyDukazy, `${contextLabel}: forbidden "Důkazy A/B/C" jargon`).toBe(false);
  expect(check.hasLegacySilne, `${contextLabel}: forbidden "Silné důkazy" jargon`).toBe(false);
  expect(check.hasOverenyDopad, `${contextLabel}: forbidden "Ověřený dopad" jargon`).toBe(false);
  if (routePath === '/app/online') {
    expect(check.hasDaylightEvidence, `${contextLabel}: must contain "Přímý měřitelný účinek"`).toBe(true);
  }
}

async function clickFirstVisible(locator: Locator): Promise<boolean> {
  const count = await locator.count();
  for (let i = 0; i < count; i++) {
    const item = locator.nth(i);
    if (await item.isVisible()) {
      await item.click();
      return true;
    }
  }
  return false;
}

// ============================================================================
// TIER 1: CORE CONTRACT MATRIX (All 7 Routes x 3 Viewports = 21 Cells)
// ============================================================================

test.describe('Tier 1: Core UI/UX Rebuild Contract Matrix (7 Routes x 3 Viewports)', () => {
  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      test(`T1 [${route.slug} @ ${vp.name}]: 0 emojis, top-only nav, 0 collisions, 0 overflow, 0 errors`, async ({
        page
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const errors = await setupPageEnvironment(page);
        await gotoHydrated(page, route.path);

        const label = `${route.path} @ ${vp.name}`;

        // T1-1: Zero native Unicode emojis / decorative symbols + SVG icon rendering
        const emojiViolations = await scanForbiddenEmojis(page);
        expect(
          emojiViolations,
          `[Emoji/Glyph Violation] ${label}: ${JSON.stringify(emojiViolations)}`
        ).toEqual([]);

        const headerSvgCount = await page.locator('header.top-nav svg').count();
        expect(headerSvgCount, `${label}: header must render SVG icons`).toBeGreaterThan(0);

        // T1-2: Zero .mobile-bottom-nav and zero fixed bottom <nav>
        await assertZeroBottomNav(page, label);

        // T2-7: Zero shield icon inside .nav-capsule
        await assertZeroHeaderShield(page, label);

        // T1-3: Home mobile immediate entry (360x800, 375x667) — title & card above fold, breathable CTA >= 44px
        if (route.path === '/' && vp.isMobile) {
          const foldMetrics = await page.evaluate(() => {
            const header = document.querySelector('header.top-nav');
            const card = document.querySelector('.instant-card');
            const title = document.querySelector('.instant-card .action-title');
            const cta = document.querySelector('.instant-card .btn-studio-primary');
            const how = document.querySelector('.instant-card details.how-toggle') as HTMLDetailsElement | null;
            return {
              headerBottom: header ? header.getBoundingClientRect().bottom : 0,
              cardTop: card ? card.getBoundingClientRect().top : -1,
              cardVisible: Boolean(card && window.getComputedStyle(card).display !== 'none'),
              titleBottom: title ? title.getBoundingClientRect().bottom : 99999,
              ctaBottom: cta ? cta.getBoundingClientRect().bottom : 99999,
              ctaHeight: cta ? cta.getBoundingClientRect().height : 0,
              ctaRight: cta ? cta.getBoundingClientRect().right : 99999,
              ctaVisible: Boolean(cta && cta.getBoundingClientRect().height > 0),
              howExists: Boolean(how),
              howOpen: Boolean(how?.open)
            };
          });

          expect(foldMetrics.cardVisible, `${label}: .instant-card must be visible`).toBe(true);
          expect(foldMetrics.ctaVisible, `${label}: primary CTA must be visible`).toBe(true);
          expect(
            foldMetrics.cardTop,
            `${label}: card top must sit below header bottom`
          ).toBeGreaterThanOrEqual(foldMetrics.headerBottom - 1);
          expect(
            foldMetrics.titleBottom,
            `${label}: card title bottom (${foldMetrics.titleBottom}px) must sit above fold (${vp.height}px)`
          ).toBeLessThanOrEqual(vp.height);
          expect(
            foldMetrics.ctaBottom,
            `${label}: primary CTA bottom (${foldMetrics.ctaBottom}px) must sit above fold (${vp.height}px)`
          ).toBeLessThanOrEqual(vp.height);
          expect(foldMetrics.ctaHeight, `${label}: primary CTA height >= 44px`).toBeGreaterThanOrEqual(44);
          expect(foldMetrics.ctaRight, `${label}: primary CTA right <= viewport width`).toBeLessThanOrEqual(vp.width);
          expect(foldMetrics.howExists, `${label}: details.how-toggle must exist`).toBe(true);
          expect(foldMetrics.howOpen, `${label}: details.how-toggle must start collapsed`).toBe(false);

          const cardSvgCount = await page.locator('.instant-card svg').count();
          expect(cardSvgCount, `${label}: .instant-card must render SVG icons`).toBeGreaterThan(0);
        }

        // T1-4: Zero bounding-box collisions in header & Molly vs page controls
        const collisions = await detectHeaderAndMollyCollisions(page);
        expect(
          collisions,
          `[Collisions] ${label}: ${JSON.stringify(collisions)}`
        ).toEqual([]);

        // T1-5: Zero horizontal overflow & zero console/page errors
        await assertZeroOverflow(page, label);
        assertZeroRuntimeErrors(errors, label);

        // T1-6: No FOMO ambient pills & no Důkazy A/B/C jargon
        await assertNoFomoOrJargon(page, route.path, label);

        // T1-7: Unified 1140px max-width centered container on desktop 1440x900
        if (!vp.isMobile) {
          const layoutMetrics = await page.evaluate((currentPath) => {
            function measure(el: Element | null) {
              if (!el) return null;
              const r = el.getBoundingClientRect();
              const cs = window.getComputedStyle(el);
              return {
                width: Math.round(r.width * 10) / 10,
                left: Math.round(r.left * 10) / 10,
                rightDiff: Math.round((window.innerWidth - r.right) * 10) / 10,
                maxWidth: cs.maxWidth
              };
            }

            const capsule = document.querySelector('header.top-nav .nav-capsule');
            const footerInner = document.querySelector('footer.site-footer .footer-inner');
            const heroInner = currentPath === '/' ? document.querySelector('.hero-inner') : null;
            const homeContentWrap =
              currentPath === '/' ? document.querySelector('.content-wrap') : null;
            const subpageWrap =
              currentPath !== '/' && currentPath !== '/svet'
                ? document.querySelector('main .app-page, main .near-page, main .page, .content-wrap')
                : null;

            return {
              capsule: measure(capsule),
              footerInner: measure(footerInner),
              heroInner: measure(heroInner),
              homeContentWrap: measure(homeContentWrap),
              subpageWrap: measure(subpageWrap)
            };
          }, route.path);

          expect(layoutMetrics.capsule, `${label}: .nav-capsule must exist`).not.toBeNull();
          expect(layoutMetrics.capsule!.width).toBeLessThanOrEqual(1140 + 48);
          expect(
            Math.abs(layoutMetrics.capsule!.left - layoutMetrics.capsule!.rightDiff)
          ).toBeLessThanOrEqual(6);

          expect(layoutMetrics.footerInner, `${label}: .footer-inner must exist`).not.toBeNull();
          expect(layoutMetrics.footerInner!.width).toBeLessThanOrEqual(1140 + 48);
          expect(
            Math.abs(layoutMetrics.footerInner!.left - layoutMetrics.footerInner!.rightDiff)
          ).toBeLessThanOrEqual(6);

          if (route.path === '/') {
            expect(layoutMetrics.heroInner, `${label}: .hero-inner must exist`).not.toBeNull();
            expect(layoutMetrics.heroInner!.width).toBeLessThanOrEqual(1140 + 48);
            expect(
              Math.abs(layoutMetrics.heroInner!.left - layoutMetrics.heroInner!.rightDiff)
            ).toBeLessThanOrEqual(6);

            expect(
              layoutMetrics.homeContentWrap,
              `${label}: .content-wrap must exist`
            ).not.toBeNull();
            expect(layoutMetrics.homeContentWrap!.width).toBeLessThanOrEqual(1140 + 48);
            expect(
              Math.abs(
                layoutMetrics.homeContentWrap!.left - layoutMetrics.homeContentWrap!.rightDiff
              )
            ).toBeLessThanOrEqual(6);
          } else if (route.path !== '/svet') {
            expect(
              layoutMetrics.subpageWrap,
              `${label}: subpage container must exist`
            ).not.toBeNull();
            expect(layoutMetrics.subpageWrap!.width).toBeLessThanOrEqual(1140 + 48);
            expect(
              Math.abs(layoutMetrics.subpageWrap!.left - layoutMetrics.subpageWrap!.rightDiff)
            ).toBeLessThanOrEqual(6);
          }
        }
      });
    }
  }
});

// ============================================================================
// TIER 2: CATEGORY-PARTITION & BOUNDARY VALUE ANALYSIS (BVA)
// ============================================================================

test.describe('Tier 2: Breakpoints, Fold Budget, Touch Targets & Mobile Inputs', () => {
  test('T2-1: Header breakpoint BVA (360, 680, 681, 1024 vs 1025, 1440)', async ({ page }) => {
    const errors = await setupPageEnvironment(page);
    const widths = [360, 680, 681, 1024, 1025, 1440];

    await gotoHydrated(page, '/');

    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(300);

      const label = `breakpoint ${width}px`;
      await assertZeroBottomNav(page, label);
      await assertZeroOverflow(page, label);
      await assertZeroHeaderShield(page, label);

      const state = await page.evaluate(() => {
        const toggle = document.querySelector('button.mobile-nav-toggle');
        const links = document.querySelector('nav.nav-links');
        const mollyDock = document.querySelector('.molly-pelisek-dock');
        const toggleVisible = Boolean(
          toggle &&
            window.getComputedStyle(toggle).display !== 'none' &&
            toggle.getBoundingClientRect().width > 0
        );
        const toggleRect = toggle ? toggle.getBoundingClientRect() : null;
        const linksVisible = Boolean(
          links &&
            window.getComputedStyle(links).display !== 'none' &&
            links.getBoundingClientRect().width > 0
        );
        const linksOverflow = links ? links.scrollWidth > links.clientWidth + 1 : false;
        const linkHrefs = links
          ? Array.from(links.querySelectorAll('a')).map((a) => a.getAttribute('href') || '')
          : [];
        const mollyDisplay = mollyDock ? window.getComputedStyle(mollyDock).display : 'missing';
        return {
          toggleVisible,
          toggleWidth: toggleRect?.width ?? 0,
          toggleHeight: toggleRect?.height ?? 0,
          linksVisible,
          linksOverflow,
          linkHrefs,
          mollyDisplay
        };
      });

      expect(state.mollyDisplay, `${label}: .molly-pelisek-dock must never be display:none`).not.toBe(
        'none'
      );
      expect(state.mollyDisplay, `${label}: .molly-pelisek-dock must exist`).not.toBe('missing');

      const collisions = await detectHeaderAndMollyCollisions(page);
      expect(collisions, `${label}: header collisions ${JSON.stringify(collisions)}`).toEqual([]);

      if (width <= 1024) {
        expect(state.toggleVisible, `${label}: .mobile-nav-toggle must be visible`).toBe(true);
        expect(state.toggleWidth, `${label}: toggle width >= 44`).toBeGreaterThanOrEqual(43.5);
        expect(state.toggleHeight, `${label}: toggle height >= 44`).toBeGreaterThanOrEqual(43.5);
        expect(state.linksVisible, `${label}: desktop .nav-links must be hidden`).toBe(false);
      } else {
        expect(state.toggleVisible, `${label}: .mobile-nav-toggle must be hidden`).toBe(false);
        expect(state.linksVisible, `${label}: desktop .nav-links must be visible`).toBe(true);
        expect(state.linksOverflow, `${label}: .nav-links must not overflow`).toBe(false);
        for (const href of NAV_ROUTE_HREFS) {
          expect(state.linkHrefs, `${label}: desktop nav must contain ${href}`).toContain(href);
        }
      }
    }

    assertZeroRuntimeErrors(errors, 'T2-1');
  });

  test('Header drawer lists six links, fits the viewport and closes on Escape up to 1024px; desktop pills stay on one row at 1025px', async ({ page }) => {
    for (const width of [360, 680, 681, 1024, 1025]) {
      await page.setViewportSize({ width, height: 800 });
      await gotoHydrated(page, '/');
      const label = `header at ${width}px`;

      if (width <= 1024) {
        await page.locator('.mobile-nav-toggle').click();
        const drawer = page.locator('#mobile-top-nav-drawer');
        await expect(drawer, `${label}: drawer opens`).toBeVisible();
        await expect(drawer.locator('.mobile-drawer-link')).toHaveCount(6);
        const drawerOverflow = await page.evaluate(
          (viewportWidth) => document.documentElement.scrollWidth > viewportWidth,
          width
        );
        expect(drawerOverflow, `${label}: open drawer must not widen the page`).toBe(false);
        await page.keyboard.press('Escape');
        await expect(drawer, `${label}: Escape closes the drawer`).toBeHidden();
      } else {
        const desktopLinks = await page.evaluate(() => {
          const links = document.querySelector('.nav-links');
          const pills = Array.from(document.querySelectorAll('.nav-links .nav-pill'));
          return {
            flexWrap: links ? window.getComputedStyle(links).flexWrap : '',
            pillCount: pills.length,
            maxPillRight: Math.max(0, ...pills.map((pill) => pill.getBoundingClientRect().right))
          };
        });
        expect(desktopLinks.flexWrap, `${label}: .nav-links must not wrap`).toBe('nowrap');
        expect(desktopLinks.pillCount, `${label}: nav pills are rendered`).toBeGreaterThan(0);
        expect(desktopLinks.maxPillRight, `${label}: last pill ends inside the viewport`).toBeLessThanOrEqual(width);
      }
    }
  });

  test('T2-2: Compact mobile entry on / at 375x667', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    const fold = await page.evaluate(() => {
      const preview = document.querySelector('.instant-card .deed-preview-stage');
      const title = document.querySelector('.instant-card .action-title');
      const cta = document.querySelector('.instant-card .btn-studio-primary');
      const how = document.querySelector('.instant-card details.how-toggle') as HTMLDetailsElement | null;
      const header = document.querySelector('header.top-nav');
      const card = document.querySelector('.instant-card');
      return {
        previewVisible: Boolean(preview && preview.getBoundingClientRect().height > 0),
        titleBottom: title ? title.getBoundingClientRect().bottom : 9999,
        ctaBottom: cta ? cta.getBoundingClientRect().bottom : 9999,
        ctaHeight: cta ? cta.getBoundingClientRect().height : 0,
        ctaRight: cta ? cta.getBoundingClientRect().right : 9999,
        howExists: Boolean(how),
        howOpen: Boolean(how?.open),
        headerBottom: header ? header.getBoundingClientRect().bottom : 0,
        cardTop: card ? card.getBoundingClientRect().top : -1
      };
    });

    expect(fold.previewVisible).toBe(true);
    expect(fold.howExists).toBe(true);
    expect(fold.howOpen).toBe(false);
    expect(fold.cardTop).toBeGreaterThanOrEqual(fold.headerBottom - 1);
    expect(fold.cardTop).toBeLessThan(667 * 0.6);
    expect(fold.titleBottom).toBeLessThanOrEqual(667);
    expect(fold.ctaBottom).toBeLessThanOrEqual(667);
    expect(fold.ctaHeight).toBeGreaterThanOrEqual(44);
    expect(fold.ctaRight).toBeLessThanOrEqual(375);

    const collisions = await detectHeaderAndMollyCollisions(page);
    expect(collisions).toEqual([]);
    assertZeroRuntimeErrors(errors, 'T2-2');
  });

  test('T2-3: Touch target minimum (>= 44x44px) across all 7 routes on 360x800 & 375x667', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);

    for (const vp of VIEWPORTS.filter((v) => v.isMobile)) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of ROUTES) {
        await gotoHydrated(page, route.path);
        const checked = await assertMobileTouchTargets(page, `${route.path} @ ${vp.name}`);
        expect(checked, `${route.path} @ ${vp.name}: touch targets checked`).toBeGreaterThan(0);
      }
    }

    assertZeroRuntimeErrors(errors, 'T2-3');
  });

  test('T2-4: Mobile input font-size >= 16px across default & conditional drawers/modals', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);

    for (const vp of VIEWPORTS.filter((v) => v.isMobile)) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // /app/guided -> activate walk situation (or open details.local-drawer) so #guided-city-select is visible
      await gotoHydrated(page, '/app/guided');
      const walkCard = page.locator('.situation-card', { hasText: /procházce/i }).first();
      if (await walkCard.isVisible()) {
        await walkCard.click();
      } else {
        const localSummary = page.locator('details.local-drawer > summary').first();
        await expect(localSummary).toBeVisible();
        await localSummary.click();
      }
      await expect(page.locator('#guided-city-select')).toBeVisible();
      const guidedCount = await assertMobileInputFontSizes(
        page,
        `/app/guided (local drawer open) @ ${vp.name}`
      );
      expect(guidedCount).toBeGreaterThan(0);

      // /app/online -> #online-search
      await gotoHydrated(page, '/app/online');
      await expect(page.locator('#online-search')).toBeVisible();
      const onlineCount = await assertMobileInputFontSizes(page, `/app/online @ ${vp.name}`);
      expect(onlineCount).toBeGreaterThan(0);

      // /near -> expand any collapsed filter <details> drawers, then verify #near-location-query & selects
      await gotoHydrated(page, '/near');
      const nearSummaries = page.locator('main details > summary');
      const nearSumCount = await nearSummaries.count();
      for (let i = 0; i < nearSumCount; i++) {
        const s = nearSummaries.nth(i);
        if (await s.isVisible()) {
          const isOpen = await s.evaluate(
            (el) => Boolean((el.parentElement as HTMLDetailsElement | null)?.open)
          );
          if (!isOpen) await s.click();
        }
      }
      await expect(page.locator('#near-location-query')).toBeVisible();
      const nearCount = await assertMobileInputFontSizes(page, `/near @ ${vp.name}`);
      expect(nearCount).toBeGreaterThan(0);

      // /svet -> #ritual-deed-input + ProgressDashboard journal drawer (#backup-code-input)
      await gotoHydrated(page, '/svet');
      await expect(page.locator('#ritual-deed-input')).toBeVisible();
      const drawers = page.locator('.optional-drawers details.calm-drawer > summary');
      const dCount = await drawers.count();
      expect(dCount, `/svet @ ${vp.name}: calm-drawer summaries must exist`).toBeGreaterThan(0);
      const backupInput = page.locator('#backup-code-input');
      if (!(await backupInput.isVisible())) {
        for (let i = 0; i < dCount; i++) {
          await drawers.nth(i).click();
        }
      }
      await expect(backupInput).toBeVisible();
      const svetCount = await assertMobileInputFontSizes(
        page,
        `/svet (journal drawer open) @ ${vp.name}`
      );
      expect(svetCount).toBeGreaterThanOrEqual(2);

      // /submit -> default org inputs + Sousedská akce (#event_url, #event_start, #event_end) + optional-fields (#website, #email)
      await gotoHydrated(page, '/submit');
      const submitOrgCount = await assertMobileInputFontSizes(page, `/submit org @ ${vp.name}`);
      expect(submitOrgCount).toBeGreaterThan(0);
      const eventTab = page.locator('.tab', { hasText: /Sousedská akce/i });
      await expect(eventTab).toBeVisible();
      await eventTab.click();
      await expect(page.locator('#event_url')).toBeVisible();

      const optionalSummary = page.locator('details.optional-fields > summary');
      await expect(optionalSummary).toBeVisible();
      const optOpen = await optionalSummary.evaluate(
        (el) => Boolean((el.parentElement as HTMLDetailsElement | null)?.open)
      );
      if (!optOpen) {
        await optionalSummary.click();
      }
      await expect(page.locator('#website')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      const submitEventCount = await assertMobileInputFontSizes(
        page,
        `/submit event + optional @ ${vp.name}`
      );
      expect(submitEventCount).toBeGreaterThanOrEqual(4);

      // Global FeedbackModal -> #fb-textarea
      await page.locator('button.mobile-nav-toggle').click();
      await page.locator('#mobile-top-nav-drawer').getByRole('button', { name: /Napsat názor/i }).click();
      await expect(page.locator('#fb-textarea')).toBeVisible();
      const fbCount = await assertMobileInputFontSizes(page, `FeedbackModal @ ${vp.name}`);
      expect(fbCount).toBeGreaterThan(0);
      await page.keyboard.press('Escape');
    }

    assertZeroRuntimeErrors(errors, 'T2-4');
  });

  test('T2-5: SwipeDeck pagination boundaries & zero Molly overlap on /', async ({ page }) => {
    const errors = await setupPageEnvironment(page);

    for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/');

      const indicator = page.locator('.deck-indicator').first();
      await expect(indicator).toBeVisible();
      const initialText = (await indicator.innerText()).trim();
      const match = initialText.match(/(\d+)\s*\/\s*(\d+)/);
      expect(match, `Unexpected deck indicator format: "${initialText}"`).not.toBeNull();
      const total = Number(match![2]);
      expect(total).toBeGreaterThan(1);
      expect(Number(match![1])).toBe(1);

      await page.locator('.deck-nav-next').first().click();
      await page.waitForTimeout(200);
      await expect(indicator).toContainText(`2 / ${total}`);

      await page.locator('.deck-nav-prev').first().click();
      await page.waitForTimeout(200);
      await expect(indicator).toContainText(`1 / ${total}`);

      // Wrap backwards from 1 / N -> N / N
      await page.locator('.deck-nav-prev').first().click();
      await page.waitForTimeout(200);
      await expect(indicator).toContainText(`${total} / ${total}`);

      const collisions = await detectHeaderAndMollyCollisions(page);
      expect(collisions, `Deck wrap @ ${vp.name}: ${JSON.stringify(collisions)}`).toEqual([]);

      // Wrap forwards from N / N -> 1 / N (resets deck position cleanly for next viewport)
      await page.locator('.deck-nav-next').first().click();
      await page.waitForTimeout(200);
      await expect(indicator).toContainText(`1 / ${total}`);
    }

    assertZeroRuntimeErrors(errors, 'T2-5');
  });

  test('T2-6: /svet legend strip & stationary "Jak to funguje" toggle invariant', async ({
    page
  }) => {
    const errors = await setupPageEnvironment(page);

    for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/svet');

      const legendStrip = page.locator('.sanctuary-legend-strip');
      await expect(legendStrip).toBeVisible();
      if (!vp.isMobile) {
        const legendBox = await legendStrip.boundingBox();
        expect(legendBox).not.toBeNull();
        expect(legendBox!.height).toBeLessThanOrEqual(52);
      }

      const guideSummary = page.locator('summary.guide-toggle-summary');
      await expect(guideSummary).toBeVisible();
      const beforeBox = await guideSummary.boundingBox();
      expect(beforeBox).not.toBeNull();

      await guideSummary.click();
      await expect(page.locator('#sanctuary-guide-panel')).toBeVisible();

      const afterBox = await guideSummary.boundingBox();
      expect(afterBox).not.toBeNull();
      expect(
        Math.abs(afterBox!.y - beforeBox!.y),
        `Toggle shifted vertically at ${vp.name}`
      ).toBeLessThanOrEqual(2.5);
      expect(
        Math.abs(afterBox!.x - beforeBox!.x),
        `Toggle shifted horizontally at ${vp.name}`
      ).toBeLessThanOrEqual(2.5);

      const emojiViolations = await scanForbiddenEmojis(page);
      expect(emojiViolations).toEqual([]);
    }

    assertZeroRuntimeErrors(errors, 'T2-6');
  });
});

// ============================================================================
// TIER 3: PAIRWISE COMBINATORIAL & INTERACTIVE STATE MATRIX
// ============================================================================

test.describe('Tier 3: Pairwise Interactive State & Component Matrix', () => {
  test('T3-1: (/ x 360x800 x Drawer Open) 6 routes + Crisis + Feedback + navigation', async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    const toggle = page.locator('button.mobile-nav-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const drawer = page.locator('#mobile-top-nav-drawer');
    await expect(drawer).toBeVisible();

    const headerBox = await page.locator('header.top-nav').boundingBox();
    const drawerBox = await drawer.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(drawerBox).not.toBeNull();
    expect(drawerBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 2);

    for (const href of NAV_ROUTE_HREFS) {
      await expect(drawer.locator(`a[href="${href}"]`)).toBeVisible();
    }
    await expect(drawer).toContainText('Tichá opora 24/7');
    await expect(drawer).toContainText('Napsat názor');

    const drawerEmoji = await scanForbiddenEmojis(page, '#mobile-top-nav-drawer');
    expect(drawerEmoji).toEqual([]);
    await assertMobileTouchTargets(page, 'mobile drawer open');
    await assertZeroOverflow(page, 'mobile drawer open');

    await drawer.locator('a[href="/near"]').click();
    await page.waitForURL('**/near');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(drawer).toBeHidden();

    assertZeroRuntimeErrors(errors, 'T3-1');
  });

  test('T3-2: (/ x 375x667 x Two-Phase Card Anticipation -> Payoff)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    const card = page.locator('.instant-card').first();
    await expect(card.locator('canvas.preview-diorama-canvas')).toBeVisible();
    await expect(card.locator('.btn-studio-done')).toHaveCount(0);

    const howToggle = card.locator('details.how-toggle');
    await expect(howToggle).not.toHaveAttribute('open', '');
    await howToggle.locator('summary').click();
    await expect(howToggle).toHaveAttribute('open', '');
    await expect(howToggle).toContainText(/Přímý měřitelný účinek|Doložený přínos|Komunitní smysl/);
    await expect(howToggle).toContainText(/Sdílet odkaz/i);
    await expect(howToggle).toContainText(/Nahlásit chybu/i);

    const detailsEmoji = await scanForbiddenEmojis(page, '.instant-card');
    expect(detailsEmoji).toEqual([]);

    // Start the deed -> unlocks .btn-studio-done and .impact-payoff-canvas
    await card.locator('.btn-studio-primary').click();
    const doneBtn = card.locator('.btn-studio-done');
    await expect(doneBtn).toBeVisible();
    const doneBox = await doneBtn.boundingBox();
    expect(doneBox).not.toBeNull();
    expect(doneBox!.height).toBeGreaterThanOrEqual(43.5);
    await expect(card.locator('canvas.impact-payoff-canvas')).toBeVisible();

    const startedEmoji = await scanForbiddenEmojis(page, '.instant-card');
    expect(startedEmoji).toEqual([]);

    // Complete deed -> unlocks celebration / payoff cleanly
    await doneBtn.click();
    await page.waitForTimeout(300);
    await expect(card.locator('.inline-celebration-card, .molly-celebration-note').first()).toBeVisible();

    const postEmoji = await scanForbiddenEmojis(page);
    expect(postEmoji).toEqual([]);
    await assertZeroOverflow(page, 'T3-2 post-completion');
    assertZeroRuntimeErrors(errors, 'T3-2');
  });

  test('T3-3: (/ x 360x800 x Molly Roaming vs Docked & Whisper)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    const petBtn = page.locator('.molly-dock-pet-btn');
    await expect(petBtn).toBeVisible();
    await petBtn.click();
    await page.waitForTimeout(250);

    const whisper = page.locator('.molly-whisper-bubble, .molly-dock-whisper').first();
    await expect(whisper).toBeVisible();
    const headerBox = await page.locator('header.top-nav').boundingBox();
    const whisperBox = await whisper.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(whisperBox).not.toBeNull();
    expect(whisperBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 2);

    const collisions = await detectHeaderAndMollyCollisions(page);
    expect(collisions).toEqual([]);

    const emoji = await scanForbiddenEmojis(page);
    expect(emoji).toEqual([]);

    // Toggle docked mode ("Pelíšek")
    const dockToggle = page.locator('.molly-dock-toggle-btn');
    await dockToggle.click();
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mode', 'docked');
    const postDockCollisions = await detectHeaderAndMollyCollisions(page);
    expect(postDockCollisions).toEqual([]);

    assertZeroRuntimeErrors(errors, 'T3-3');
  });

  test('T3-4: (/app/online x 360x800 x Filter + Search + Details)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/app/online');

    const evidenceFilter = page.locator('.filter-chip', { hasText: 'Přímý měřitelný účinek' });
    await expect(evidenceFilter).toBeVisible();
    await evidenceFilter.click();

    const search = page.locator('#online-search');
    await search.fill('útulek');
    await page.waitForTimeout(200);

    await assertMobileInputFontSizes(page, 'T3-4 /app/online');
    await assertNoFomoOrJargon(page, '/app/online', 'T3-4 /app/online');
    const emoji = await scanForbiddenEmojis(page);
    expect(emoji).toEqual([]);
    await assertZeroOverflow(page, 'T3-4 /app/online');
    assertZeroRuntimeErrors(errors, 'T3-4');
  });

  test('T3-5: (/app/guided x 375x667 x Situation + City Select + Recommendation)', async ({
    page
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/app/guided');

    const walkBtn = page.locator('.situation-card', { hasText: /procházce/i }).first();
    await walkBtn.click();
    await expect(page.locator('#guided-city-select')).toBeVisible();

    const howToggle = page.locator('#personal-plan details.how-toggle').first();
    if (await howToggle.isVisible()) {
      await howToggle.locator('summary').click();
    }

    await assertMobileInputFontSizes(page, 'T3-5 /app/guided');
    await assertNoFomoOrJargon(page, '/app/guided', 'T3-5 /app/guided');
    const emoji = await scanForbiddenEmojis(page);
    expect(emoji).toEqual([]);
    await assertZeroOverflow(page, 'T3-5 /app/guided');
    assertZeroRuntimeErrors(errors, 'T3-5');
  });

  test('T3-6: (/near x 360x800 x Mobile Controls + Leaflet SVG Pins + PlaceCard)', async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/near');

    // Verify "+ Přidat" and "Sdílet výřez" are accessible on mobile with >= 44x44 targets
    const addLink = page.locator('main a[href="/submit"]', { hasText: /Přidat/i }).first();
    const shareViewBtn = page.locator('main button', { hasText: /Sdílet/i }).first();
    await expect(addLink).toBeVisible();
    await expect(shareViewBtn).toBeVisible();

    const addBox = await addLink.boundingBox();
    const shareBox = await shareViewBtn.boundingBox();
    expect(addBox!.height).toBeGreaterThanOrEqual(43.5);
    expect(shareBox!.height).toBeGreaterThanOrEqual(43.5);

    // Verify list view PlaceCards have 0 emojis
    await expect(page.locator('.place-card').first()).toBeVisible();
    expect(await scanForbiddenEmojis(page)).toEqual([]);

    // Switch to Mapa tab -> verify Leaflet renders SVG pin icons without emojis
    const mapTab = page.locator('.mobile-tabs button', { hasText: /Mapa/i }).first();
    await mapTab.click();
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10_000 });
    await page.locator('.leaflet-marker-icon').first().waitFor({ state: 'attached', timeout: 5000 });

    const markerSvgCount = await page.locator('.leaflet-marker-icon svg').count();
    expect(markerSvgCount, '/near Leaflet markers must use SVG icons').toBeGreaterThan(0);

    const mapEmojis = await scanForbiddenEmojis(page);
    expect(mapEmojis).toEqual([]);
    await assertZeroOverflow(page, 'T3-6 /near map');
    assertZeroRuntimeErrors(errors, 'T3-6');
  });

  test('T3-7: (/svet x 360x800 x Atmosphere Controls + Lake Handover + RitualBar)', async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/svet');

    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-home', 'lake');
    await expect
      .poll(
        async () => {
          return page.evaluate(() => {
            const actor = document.querySelector('.molly-roaming-actor');
            if (!actor) return true;
            const cs = window.getComputedStyle(actor);
            return (
              cs.display === 'none' ||
              cs.visibility === 'hidden' ||
              parseFloat(cs.opacity) <= 0.01
            );
          });
        },
        { timeout: 5000 }
      )
      .toBe(true);

    // Verify .atmosphere-controls presence, touch targets, and non-overlap against legend strip
    await expect(page.locator('.atmosphere-controls')).toBeVisible();
    await expect(page.locator('.sanctuary-legend-strip')).toBeVisible();
    const atmoOverlap = await page.evaluate(() => {
      const atmo = document.querySelector('.atmosphere-controls');
      const legend = document.querySelector('.sanctuary-legend-strip');
      if (!atmo || !legend) return true;
      const a = atmo.getBoundingClientRect();
      const l = legend.getBoundingClientRect();
      return Math.min(a.right, l.right) - Math.max(a.left, l.left) > 1.5 &&
        Math.min(a.bottom, l.bottom) - Math.max(a.top, l.top) > 1.5;
    });
    expect(atmoOverlap).toBe(false);

    await assertMobileTouchTargets(page, 'T3-7 /svet');
    await assertMobileInputFontSizes(page, 'T3-7 /svet');

    // Open DeedInspectorModal via .explore-deed-btn and check for zero emojis
    await page.locator('.explore-deed-btn').click();
    await expect(page.locator('.memory-whisper[role="dialog"]')).toBeVisible();
    expect(await scanForbiddenEmojis(page)).toEqual([]);
    await assertZeroOverflow(page, 'T3-7 /svet modal');
    assertZeroRuntimeErrors(errors, 'T3-7');
  });

  test('T3-8: (/submit x 360x800 x Tabs, Inputs >= 16px & Quick Pills)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/submit');

    await assertMobileInputFontSizes(page, 'T3-8 org');
    await page.locator('.tab', { hasText: /Sousedská akce/i }).click();
    await page.locator('details.optional-fields > summary').click();
    await assertMobileInputFontSizes(page, 'T3-8 event + optional');
    await assertMobileTouchTargets(page, 'T3-8');

    expect(await scanForbiddenEmojis(page)).toEqual([]);
    await assertZeroOverflow(page, 'T3-8');
    assertZeroRuntimeErrors(errors, 'T3-8');
  });

  test('T3-9: (Global Modals x 360x800 x ImmediateHelp & FeedbackModal)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    // 1. ImmediateHelp modal via mobile nav drawer (closes via .close-btn)
    await page.locator('button.mobile-nav-toggle').click();
    await page.locator('#mobile-top-nav-drawer').getByRole('button', { name: /Tichá opora 24\/7/i }).click();
    const crisisDialog = page.locator('[role="dialog"][aria-label*="Krizov" i], .crisis-panel[role="dialog"]').first();
    await expect(crisisDialog).toBeVisible();
    expect(await scanForbiddenEmojis(page)).toEqual([]);
    await assertMobileTouchTargets(page, 'ImmediateHelp modal');
    await assertZeroOverflow(page, 'ImmediateHelp modal');
    await crisisDialog.locator('.close-btn').click();
    await expect(crisisDialog).toBeHidden();

    // 2. FeedbackModal via mobile nav drawer
    await page.locator('button.mobile-nav-toggle').click();
    await page.locator('#mobile-top-nav-drawer').getByRole('button', { name: /Napsat názor/i }).click();
    const fbDialog = page.locator('[role="dialog"][aria-labelledby="fb-title"]');
    await expect(fbDialog).toBeVisible();
    await expect(page.locator('#fb-textarea')).toBeVisible();
    expect(await scanForbiddenEmojis(page)).toEqual([]);
    await assertMobileInputFontSizes(page, 'FeedbackModal');
    await assertMobileTouchTargets(page, 'FeedbackModal');
    await assertZeroOverflow(page, 'FeedbackModal');
    await page.keyboard.press('Escape');
    await expect(fbDialog).toBeHidden();

    assertZeroRuntimeErrors(errors, 'T3-9');
  });

  test('T3-10: (/near x Desktop & Mobile) Zero popup clipping, zero "Jemný podklad" overlap, active sheet outside map', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);

    // 1. Desktop (1440x900 & 1025x800): "Na mapě" and direct pin click keep .leaflet-popup 100% inside .leaflet-container
    //    with zero overlap against .tile-switch-btn ("Jemný podklad") or .leaflet-control-zoom, and .map-active-sheet hidden.
    for (const vp of [
      { width: 1440, height: 900, label: '1440x900' },
      { width: 1025, height: 800, label: '1025x800' }
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/near');
      await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10_000 });
      await page.locator('.leaflet-marker-icon').first().waitFor({ state: 'attached', timeout: 5000 });

      const cards = page.locator('.places-stack .place-card');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThanOrEqual(2);

      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        await cards.nth(i).locator('button', { hasText: 'Na mapě' }).click();
        await page.waitForTimeout(200);

        // The popup of the previous card may still be fading out.
        await expect(page.locator('.leaflet-popup')).toHaveCount(1);
        await expect(page.locator('.leaflet-popup')).toBeVisible();
        await expect(page.locator('.map-active-sheet')).toBeHidden();
        await expect(page.locator('.search-area-btn')).toHaveCount(0);

        const popupGeo = await page.evaluate(() => {
          const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
          const popup = document.querySelector('.leaflet-popup-content-wrapper')?.getBoundingClientRect();
          const closeBtn = document.querySelector('.leaflet-popup-close-button')?.getBoundingClientRect();
          const tileBtn = document.querySelector('.tile-switch-btn')?.getBoundingClientRect();
          const zoomCtrl = document.querySelector('.leaflet-control-zoom')?.getBoundingClientRect();
          if (!container || !popup || !tileBtn || !zoomCtrl) return null;

          const ov = (a: DOMRect, b: DOMRect) =>
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;

          return {
            clippedTop: popup.top < container.top - 1,
            clippedBottom: popup.bottom > container.bottom + 1,
            clippedLeft: popup.left < container.left - 1,
            clippedRight: popup.right > container.right + 1,
            overlapsTileBtn: ov(popup, tileBtn) || Boolean(closeBtn && ov(closeBtn, tileBtn)),
            overlapsZoom: ov(popup, zoomCtrl),
            popupHeight: Math.round(popup.height),
            topMargin: Math.round(popup.top - container.top)
          };
        });

        expect(popupGeo, `${vp.label} card #${i} popup geometry`).not.toBeNull();
        expect(popupGeo!.clippedTop, `${vp.label} card #${i} popup clipped top`).toBe(false);
        expect(popupGeo!.clippedBottom, `${vp.label} card #${i} popup clipped bottom`).toBe(false);
        expect(popupGeo!.clippedLeft, `${vp.label} card #${i} popup clipped left`).toBe(false);
        expect(popupGeo!.clippedRight, `${vp.label} card #${i} popup clipped right`).toBe(false);
        expect(popupGeo!.overlapsTileBtn, `${vp.label} card #${i} popup overlaps Jemný podklad`).toBe(false);
        expect(popupGeo!.overlapsZoom, `${vp.label} card #${i} popup overlaps zoom control`).toBe(false);
      }

      // Direct marker click on map also auto-pans without clipping or overlapping "Jemný podklad"
      // The click is sent to the pin itself: a click by coordinates lands on whatever covers the pin at that
      // moment (the popup of the last card, or the map while it is still panning).
      await page.locator('.leaflet-marker-icon').nth(1).dispatchEvent('click');
      await page.waitForTimeout(350);
      await expect(page.locator('.leaflet-popup')).toHaveCount(1);
      await expect(page.locator('.leaflet-popup')).toBeVisible();
      const markerClickGeo = await page.evaluate(() => {
        const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
        const popup = document.querySelector('.leaflet-popup-content-wrapper')?.getBoundingClientRect();
        const tileBtn = document.querySelector('.tile-switch-btn')?.getBoundingClientRect();
        if (!container || !popup || !tileBtn) return null;
        const overlapsTileBtn =
          Math.min(popup.right, tileBtn.right) - Math.max(popup.left, tileBtn.left) > 1.5 &&
          Math.min(popup.bottom, tileBtn.bottom) - Math.max(popup.top, tileBtn.top) > 1.5;
        return {
          insideContainer:
            popup.top >= container.top - 1 &&
            popup.bottom <= container.bottom + 1 &&
            popup.left >= container.left - 1 &&
            popup.right <= container.right + 1,
          overlapsTileBtn
        };
      });
      expect(markerClickGeo).toEqual({ insideContainer: true, overlapsTileBtn: false });
      expect(await scanForbiddenEmojis(page)).toEqual([]);

      if (vp.width === 1440) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        await cards.first().locator('button', { hasText: 'Na mapě' }).click();
        await page.waitForTimeout(200);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'near-popup__1440x900.png'),
          fullPage: false
        });
      }
    }

    // 2. Mobile & Tablet (820x960, 375x667, 360x800): .map-active-sheet renders cleanly BELOW .leaflet-container
    for (const vp of [
      { width: 820, height: 960, label: '820x960' },
      { width: 375, height: 667, label: '375x667' },
      { width: 360, height: 800, label: '360x800' }
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/near');

      await page.locator('.place-card').first().locator('button', { hasText: 'Na mapě' }).click();
      await page.waitForTimeout(250);

      const sheet = page.locator('.map-active-sheet[aria-label="Vybrané místo na mapě"]');
      await expect(sheet).toBeVisible();
      await expect(page.locator('.leaflet-popup')).toHaveCount(0);

      const mobileGeo = await page.evaluate(() => {
        const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
        const mapFrame = document.querySelector('.map-frame')?.getBoundingClientRect();
        const activeSheet = document.querySelector('.map-active-sheet')?.getBoundingClientRect();
        if (!container || !mapFrame || !activeSheet) return null;
        const overlapsContainer =
          Math.min(activeSheet.right, container.right) - Math.max(activeSheet.left, container.left) > 1 &&
          Math.min(activeSheet.bottom, container.bottom) - Math.max(activeSheet.top, container.top) > 1;
        return {
          overlapsContainer,
          belowMapFrame: activeSheet.top >= mapFrame.bottom - 1
        };
      });

      expect(mobileGeo, `${vp.label} active sheet placement`).toEqual({
        overlapsContainer: false,
        belowMapFrame: true
      });

      // Verify map controls (.tile-switch-btn, .leaflet-container) stay strictly beneath sticky header.top-nav stacking context
      const headerHitOk = await page.evaluate(() => {
        const cap = document.querySelector('header.top-nav .nav-capsule');
        if (!cap) return false;
        const r = cap.getBoundingClientRect();
        const hit = document.elementFromPoint(r.right - 22, r.top + r.height * 0.5);
        return Boolean(hit && cap.contains(hit));
      });
      expect(headerHitOk, `${vp.label} sticky header must remain above map controls`).toBe(true);

      await assertZeroOverflow(page, `T3-10 /near active sheet @ ${vp.label}`);
      if (vp.width <= 680) {
        await assertMobileTouchTargets(page, `T3-10 /near active sheet @ ${vp.label}`);
      }
      if (vp.width === 360) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'near-sheet__360x800.png'),
          fullPage: false
        });
      }
    }

    assertZeroRuntimeErrors(errors, 'T3-10');
  });

  test('T3-11: (Mobile 360x800 & 375x667) Full brand name legibility without ellipsis even with MollyDock tip indicator', async ({
    page
  }) => {
    test.setTimeout(60_000);
    const errors = await setupPageEnvironment(page);

    for (const vp of [
      { width: 360, height: 800, label: '360x800' },
      { width: 375, height: 667, label: '375x667' }
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.evaluate(() => {
        try {
          sessionStorage.removeItem('aa_molly_hints_v1');
        } catch {}
      });
      await gotoHydrated(page, '/submit');

      // Wait until Molly's deferred route tip dot appears inside MollyDock (widest mobile dock state)
      for (let i = 0; i < 20; i++) {
        if ((await page.locator('[data-testid="molly-tip-dot"]').count()) > 0) break;
        await page.waitForTimeout(300);
      }
      await expect(page.locator('[data-testid="molly-tip-dot"]')).toBeVisible();

      const brandMetrics = await page.evaluate(() => {
        const brand = document.querySelector('header.top-nav a.brand') as HTMLElement | null;
        const brandText = document.querySelector('header.top-nav .brand-text') as HTMLElement | null;
        const brandWord = document.querySelector('header.top-nav .brand-word') as HTMLElement | null;
        const brandAccent = document.querySelector('header.top-nav .brand-accent') as HTMLElement | null;
        const dock = document.querySelector('header.top-nav .molly-pelisek-dock') as HTMLElement | null;
        if (!brand || !brandText || !brandWord || !brandAccent || !dock) return null;

        const bRect = brand.getBoundingClientRect();
        const dRect = dock.getBoundingClientRect();
        const textCs = window.getComputedStyle(brandText);
        const wordCs = window.getComputedStyle(brandWord);
        const accentCs = window.getComputedStyle(brandAccent);

        return {
          wordText: brandWord.innerText.trim(),
          accentText: brandAccent.innerText.trim(),
          wordClipped: brandWord.scrollWidth > brandWord.clientWidth + 1,
          accentClipped: brandAccent.scrollWidth > brandAccent.clientWidth + 1,
          textClipped: brandText.scrollWidth > brandText.clientWidth + 1,
          hasEllipsis:
            textCs.textOverflow === 'ellipsis' ||
            wordCs.textOverflow === 'ellipsis' ||
            accentCs.textOverflow === 'ellipsis',
          gapToDock: Math.round((dRect.left - bRect.right) * 10) / 10,
          brandWidth: Math.round(bRect.width * 10) / 10,
          brandHeight: Math.round(bRect.height * 10) / 10
        };
      });

      expect(brandMetrics, `${vp.label} brand metrics`).not.toBeNull();
      expect(brandMetrics!.wordText).toBe('Akcelerátor');
      expect(brandMetrics!.accentText).toBe('altruismu');
      expect(brandMetrics!.wordClipped, `${vp.label} Akcelerátor clipped`).toBe(false);
      expect(brandMetrics!.accentClipped, `${vp.label} altruismu clipped`).toBe(false);
      expect(brandMetrics!.textClipped, `${vp.label} .brand-text clipped`).toBe(false);
      expect(brandMetrics!.hasEllipsis, `${vp.label} must not use ellipsis`).toBe(false);
      expect(brandMetrics!.gapToDock, `${vp.label} positive gap before MollyDock`).toBeGreaterThanOrEqual(4);
      expect(brandMetrics!.brandWidth).toBeGreaterThanOrEqual(44);
      expect(brandMetrics!.brandHeight).toBeGreaterThanOrEqual(44);

      const collisions = await detectHeaderAndMollyCollisions(page);
      expect(collisions, `${vp.label} header collisions with tip dot`).toEqual([]);
      await assertMobileTouchTargets(page, `T3-11 @ ${vp.label}`);
      await assertZeroOverflow(page, `T3-11 @ ${vp.label}`);

      if (vp.width === 360) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'header-tip-dot__360x800.png'),
          fullPage: false
        });
      }
    }

    assertZeroRuntimeErrors(errors, 'T3-11');
  });

  test('T3-12: (/near Race & Interaction Stress) Pin centering > 120ms, slow API & ?place= deep link, manual drag after popup, and keyboard Enter on mobile pin', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);

    // 1. Mobile 360x800: Clicking "Na mapě" must keep active pin centered after > 120ms resizeTimer
    //    and keep .mobile-tabs cleanly below sticky header.top-nav
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/near');
    await page.locator('.place-card').first().locator('button', { hasText: 'Na mapě' }).click();
    await page.waitForTimeout(350);

    const mobilePinCenter = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
      const pin = document.querySelector('.aa-map-pin.is-active')?.getBoundingClientRect();
      const header = document.querySelector('header.top-nav')?.getBoundingClientRect();
      const tabs = document.querySelector('.mobile-tabs')?.getBoundingClientRect();
      if (!container || !pin || !header || !tabs) return null;
      const pinCx = pin.left + pin.width * 0.5;
      const pinCy = pin.top + pin.height * 0.5;
      const mapCx = container.left + container.width * 0.5;
      const mapCy = container.top + container.height * 0.5;
      return {
        dx: Math.round(Math.abs(pinCx - mapCx)),
        dy: Math.round(Math.abs(pinCy - mapCy)),
        tabsBelowHeader: tabs.top >= header.bottom - 3
      };
    });
    expect(mobilePinCenter, '360x800 active pin metrics').not.toBeNull();
    expect(mobilePinCenter!.dx, '360x800 active pin horizontally centered after 350ms').toBeLessThanOrEqual(24);
    expect(mobilePinCenter!.dy, '360x800 active pin vertically centered after 350ms').toBeLessThanOrEqual(24);
    expect(mobilePinCenter!.tabsBelowHeader, '360x800 .mobile-tabs must not be chopped behind sticky header').toBe(true);

    // Pressing Enter on a focused marker on mobile (<= 980px) must NOT open .leaflet-popup
    const secondPin = page.locator('.leaflet-marker-icon').nth(1);
    await secondPin.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    expect(await page.locator('.leaflet-popup').count(), 'Mobile Enter on marker must not open .leaflet-popup').toBe(0);
    await expect(page.locator('.map-active-sheet')).toBeVisible();

    // 2. Desktop 1440x900: Clicking "Na mapě" must NOT swallow the user's subsequent manual map drag
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/near');
    await page.locator('.place-card').first().locator('button', { hasText: 'Na mapě' }).click();
    await page.waitForTimeout(250);
    await expect(page.locator('.leaflet-popup')).toBeVisible();

    const mapBox = await page.locator('.leaflet-container').boundingBox();
    expect(mapBox).not.toBeNull();
    // Drag map ~420px across screen (> 2.5 km in Prague at zoom 15) in a single gesture
    const startX = mapBox!.x + mapBox!.width * 0.78;
    const startY = mapBox!.y + mapBox!.height * 0.65;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let step = 1; step <= 8; step++) {
      await page.mouse.move(startX - step * 52, startY - step * 18, { steps: 2 });
    }
    await page.mouse.up();
    await page.waitForTimeout(250);
    await expect(
      page.locator('.search-area-btn'),
      'Single manual drag after "Na mapě" must reveal "Hledat v této oblasti mapy"'
    ).toBeVisible();

    const searchBtnVsFoot = await page.evaluate(() => {
      const searchBtn = document.querySelector('.search-area-btn')?.getBoundingClientRect();
      const footHint = document.querySelector('.map-foot-hint')?.getBoundingClientRect();
      if (!searchBtn || !footHint) return false;
      return (
        Math.min(searchBtn.right, footHint.right) - Math.max(searchBtn.left, footHint.left) > 1.5 &&
        Math.min(searchBtn.bottom, footHint.bottom) - Math.max(searchBtn.top, footHint.top) > 1.5
      );
    });
    expect(searchBtnVsFoot, '.search-area-btn must never overlap .map-foot-hint').toBe(false);

    // Clicking a visible marker while .search-area-btn is shown must auto-pan popup clear of .search-area-btn
    const inViewMarkerIdx = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
      if (!container) return -1;
      const pins = Array.from(document.querySelectorAll('.leaflet-marker-icon'));
      let bestIdx = -1;
      let maxY = -Infinity;
      pins.forEach((el, idx) => {
        const r = el.getBoundingClientRect();
        if (
          r.left > container.left + 20 &&
          r.right < container.right - 20 &&
          r.top > container.top + 20 &&
          r.bottom < container.bottom - 10 &&
          r.top > maxY
        ) {
          maxY = r.top;
          bestIdx = idx;
        }
      });
      return bestIdx;
    });
    if (inViewMarkerIdx >= 0) {
      await page.locator('.leaflet-marker-icon').nth(inViewMarkerIdx).click({ force: true });
      await page.waitForTimeout(350);
      await expect(page.locator('.leaflet-popup')).toBeVisible();
      const overlapsSearchBtn = await page.evaluate(() => {
        const popup = document.querySelector('.leaflet-popup-content-wrapper')?.getBoundingClientRect();
        const searchBtn = document.querySelector('.search-area-btn')?.getBoundingClientRect();
        if (!popup || !searchBtn) return false;
        return (
          Math.min(popup.right, searchBtn.right) - Math.max(popup.left, searchBtn.left) > 1.5 &&
          Math.min(popup.bottom, searchBtn.bottom) - Math.max(popup.top, searchBtn.top) > 1.5
        );
      });
      expect(overlapsSearchBtn, 'Popup must clear .search-area-btn at bottom of map').toBe(false);
    }

    // 3. Desktop 1440x900 with slow /api/nearby: clicking "Na mapě" before /api/nearby finishes must keep popup centered
    let delayNearby = true;
    const slowHandler = async (route: { continue: () => Promise<void> }) => {
      if (delayNearby) {
        await new Promise((r) => setTimeout(r, 380));
      }
      await route.continue();
    };
    await page.route('**/api/nearby**', slowHandler);
    await page.goto('/near', { waitUntil: 'domcontentloaded' });
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20_000 });
    await page.locator('.leaflet-marker-icon').first().waitFor({ state: 'attached', timeout: 10_000 });
    await page.locator('.place-card').first().locator('button', { hasText: 'Na mapě' }).click();
    await page.waitForTimeout(650);
    delayNearby = false;
    await page.unroute('**/api/nearby**', slowHandler);

    const slowApiGeo = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
      const popup = document.querySelector('.leaflet-popup-content-wrapper')?.getBoundingClientRect();
      const pin = document.querySelector('.aa-map-pin.is-active')?.getBoundingClientRect();
      if (!container || !popup || !pin) return null;
      return {
        popupInside:
          popup.top >= container.top - 1 &&
          popup.bottom <= container.bottom + 1 &&
          popup.left >= container.left - 1 &&
          popup.right <= container.right + 1,
        pinHorizOffset: Math.round(Math.abs(pin.left + pin.width * 0.5 - (container.left + container.width * 0.5)))
      };
    });
    expect(slowApiGeo, 'Slow /api/nearby popup & pin state').not.toBeNull();
    expect(slowApiGeo!.popupInside, 'Slow /api/nearby popup contained inside map').toBe(true);
    expect(
      slowApiGeo!.pinHorizOffset,
      'Slow /api/nearby completion must not zoom/pan away from selected place'
    ).toBeLessThanOrEqual(24);

    // 4. Deep-link /near?place=curated:praha-nadeje on 1440x900 opens centered popup > 200ms after boot
    await gotoHydrated(page, '/near?place=curated%3Apraha-nadeje');
    await page.waitForTimeout(250);
    await expect(page.locator('.leaflet-popup')).toBeVisible();
    const deepLinkGeo = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
      const popup = document.querySelector('.leaflet-popup-content-wrapper')?.getBoundingClientRect();
      if (!container || !popup) return false;
      return (
        popup.top >= container.top - 1 &&
        popup.bottom <= container.bottom + 1 &&
        popup.left >= container.left - 1 &&
        popup.right <= container.right + 1
      );
    });
    expect(deepLinkGeo, 'Deep-link ?place= popup contained inside map').toBe(true);

    assertZeroRuntimeErrors(errors, 'T3-12');
  });

  test('T3-13: (/near Long quickMission, Bottom-Center Marker vs .search-area-btn & Dynamic Resize 1025->360->1280)', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);

    // 1. Seed a community submission with a 420-char quickMission and verify popup containment at 981x800
    await page.setViewportSize({ width: 981, height: 800 });
    await gotoHydrated(page, '/near');
    await page.evaluate(() => {
      const longMission =
        'Přines čisté zimní bundy, rukavice, ponožky, deky, spacáky a trvanlivé potraviny pro lidi bez domova. '.repeat(
          4
        ) + 'Předání probíhá přímo u recepce každý všední den odpoledne bez předchozí registrace.';
      localStorage.setItem(
        'aa_my_pending_submissions_v1',
        JSON.stringify([
          {
            id: 'comm:test-long-mission',
            name: 'Komunitní šatník a nízkoprahové centrum Karlín – dlouhý popis pomoci',
            lat: 50.0915,
            lon: 14.4515,
            kind: 'org',
            category: 'Komunitní šatník',
            address_label: 'Sokolovská 112, Praha 8 - Karlín',
            website: 'https://example.org/satnik',
            quickMission: longMission,
            status: 'pending'
          }
        ])
      );
    });
    await gotoHydrated(page, '/near');
    await page.locator('details.near-filters-drawer > summary.near-filters-summary').click();
    await page.locator('#near-list-filter').fill('Karlín – dlouhý');
    await page.waitForTimeout(150);
    const longCard = page.locator('.place-card', { hasText: 'Karlín – dlouhý' }).first();
    await expect(longCard).toBeVisible();
    await longCard.locator('button', { hasText: 'Na mapě' }).click();
    await page.waitForTimeout(300);

    const longPopupGeo = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
      const popup = document.querySelector('.leaflet-popup-content-wrapper')?.getBoundingClientRect();
      const tileBtn = document.querySelector('.tile-switch-btn')?.getBoundingClientRect();
      const zoomCtrl = document.querySelector('.leaflet-control-zoom')?.getBoundingClientRect();
      if (!container || !popup || !tileBtn || !zoomCtrl) return null;
      const ov = (a: DOMRect, b: DOMRect) =>
        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 &&
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
      return {
        inside:
          popup.top >= container.top - 1 &&
          popup.bottom <= container.bottom + 1 &&
          popup.left >= container.left - 1 &&
          popup.right <= container.right + 1,
        overlapsTile: ov(popup, tileBtn),
        overlapsZoom: ov(popup, zoomCtrl),
        height: Math.round(popup.height)
      };
    });
    expect(longPopupGeo, '981x800 420-char quickMission popup geometry').toEqual({
      inside: true,
      overlapsTile: false,
      overlapsZoom: false,
      height: expect.any(Number)
    });

    // Clear filter and test dynamic resize: 1025 -> 980 -> 360 (city jump to Brno while map hidden) -> 1280
    await page.evaluate(() => localStorage.removeItem('aa_my_pending_submissions_v1'));
    await page.setViewportSize({ width: 1025, height: 800 });
    await gotoHydrated(page, '/near');
    await page.locator('.place-card').first().locator('button', { hasText: 'Na mapě' }).click();
    await expect(page.locator('.leaflet-popup')).toBeVisible();

    await page.setViewportSize({ width: 980, height: 800 });
    await page.waitForTimeout(200);
    await expect(page.locator('.leaflet-popup')).toHaveCount(0);
    await expect(page.locator('.mobile-tabs')).toBeVisible();

    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(150);
    const filtersSummary = page.locator('details.near-filters-drawer > summary.near-filters-summary');
    if (await filtersSummary.isVisible()) {
      const isOpen = await filtersSummary.evaluate((el) => Boolean((el.parentElement as HTMLDetailsElement)?.open));
      if (!isOpen) await filtersSummary.click();
    }
    await page.locator('#near-city-jump').selectOption('brno');
    await page.waitForTimeout(400);

    // Resize back to desktop 1280x900 after changing city while map was display:none
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(350);
    const desktopAfterResize = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
      const activeSheet = document.querySelector('.map-active-sheet');
      const sheetVisible = Boolean(
        activeSheet &&
          window.getComputedStyle(activeSheet).display !== 'none' &&
          activeSheet.getBoundingClientRect().height > 0
      );
      const pinsInView = Array.from(document.querySelectorAll('.leaflet-marker-icon')).filter((el) => {
        if (!container) return false;
        const r = el.getBoundingClientRect();
        return r.right > container.left && r.left < container.right && r.bottom > container.top && r.top < container.bottom;
      }).length;
      return {
        mapWidth: container ? Math.round(container.width) : 0,
        mapHeight: container ? Math.round(container.height) : 0,
        sheetVisible,
        pinsInView
      };
    });
    expect(desktopAfterResize.mapWidth).toBeGreaterThan(400);
    expect(desktopAfterResize.mapHeight).toBeGreaterThanOrEqual(420);
    expect(desktopAfterResize.sheetVisible).toBe(false);
    expect(desktopAfterResize.pinsInView, 'Brno pins visible inside desktop map after resize from hidden mobile list').toBeGreaterThan(0);

    assertZeroRuntimeErrors(errors, 'T3-13');
  });

  test('T3-14: (Header Brand BVA 320px..1024px) Zero ellipsis, zero clipping & zero collision with a dock restored from an old saved record + tip dot + docked/follow state', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);

    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/');
    // A record saved by an older version of the app: its extra fields must still load and are ignored.
    await page.evaluate(() => {
      localStorage.setItem(
        'aa_molly_companion_v1',
        JSON.stringify({
          mode: 'roaming',
          mood: 'happy',
          treatsFedTotal: 128,
          treatsFedToday: 3,
          availableTreats: 2,
          giftDeeds: 8,
          petCount: 5,
          followMouse: true,
          lastDayKey: new Date().toISOString().slice(0, 10)
        })
      );
      localStorage.setItem('aa_molly_follow_mouse', 'true');
      sessionStorage.removeItem('aa_molly_hints_v1');
    });
    await gotoHydrated(page, '/submit');
    for (let i = 0; i < 20; i++) {
      if ((await page.locator('[data-testid="molly-tip-dot"]').count()) > 0) break;
      await page.waitForTimeout(300);
    }
    await expect(page.locator('[data-testid="molly-tip-dot"]')).toBeVisible();
    // Toggle docked ("Procházka" is wider than "Pelíšek"!) while pendingTip remains active!
    await page.locator('.molly-dock-toggle-btn').click();
    await page.waitForTimeout(100);
    await expect(page.locator('[data-testid="molly-tip-dot"]')).toBeVisible();
    // The old record still loads: what it shares with the current shape survives.
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('aa_molly_companion_v1') || '{}').petCount)
    ).toBe(5);

    for (const width of [320, 360, 375, 480, 481, 680, 681, 768, 821, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(200);

      const m = await page.evaluate(() => {
        const brand = document.querySelector('header.top-nav a.brand') as HTMLElement | null;
        const brandText = document.querySelector('header.top-nav .brand-text') as HTMLElement | null;
        const brandWord = document.querySelector('header.top-nav .brand-word') as HTMLElement | null;
        const brandAccent = document.querySelector('header.top-nav .brand-accent') as HTMLElement | null;
        const dock = document.querySelector('header.top-nav .molly-pelisek-dock') as HTMLElement | null;
        if (!brand || !brandText || !brandWord || !brandAccent || !dock) return null;
        const bRect = brand.getBoundingClientRect();
        const dRect = dock.getBoundingClientRect();
        return {
          textClipped: brandText.scrollWidth > brandText.clientWidth + 1,
          wordClipped: brandWord.scrollWidth > brandWord.clientWidth + 1,
          accentClipped: brandAccent.scrollWidth > brandAccent.clientWidth + 1,
          gapToDock: Math.round((dRect.left - bRect.right) * 10) / 10
        };
      });

      expect(m, `${width}px brand metrics`).not.toBeNull();
      expect(m!.textClipped, `${width}px .brand-text clipped/truncated`).toBe(false);
      expect(m!.wordClipped, `${width}px Akcelerátor clipped`).toBe(false);
      expect(m!.accentClipped, `${width}px altruismu clipped`).toBe(false);
      expect(m!.gapToDock, `${width}px gap before MollyDock >= 4px`).toBeGreaterThanOrEqual(4);

      const collisions = await detectHeaderAndMollyCollisions(page);
      expect(collisions, `${width}px header collisions`).toEqual([]);
      if (width <= 480) {
        await assertMobileTouchTargets(page, `T3-14 @ ${width}px`);
      }
      const docOverflow = await page.evaluate(
        () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 1
      );
      expect(docOverflow, `${width}px horizontal overflow`).toBe(false);
    }

    assertZeroRuntimeErrors(errors, 'T3-14');
  });

  test('T3-15: (Desktop 1440x900 & 1280x800 @ scrollY === 0) Roaming Molly immediately visible in initial viewport without scrolling', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);
    const desktopRoutes = ['/', '/app/guided', '/app/online', '/near', '/submit'] as const;

    for (const vp of [
      { width: 1440, height: 900, label: '1440x900' },
      { width: 1280, height: 800, label: '1280x800' }
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const routePath of desktopRoutes) {
        await gotoHydrated(page, routePath);

        const mollyState = await page.evaluate(() => {
          const scrollY = window.scrollY;
          const layer = document.querySelector('.molly-companion-layer');
          const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
          const canvas = actor?.querySelector('canvas') as HTMLCanvasElement | null;
          if (!actor || !canvas) {
            return {
              scrollY,
              mode: layer?.getAttribute('data-molly-mode') ?? 'missing',
              visible: false,
              opacity: 0,
              inViewport: false,
              rect: null
            };
          }
          const cs = window.getComputedStyle(actor);
          const r = actor.getBoundingClientRect();
          const opacity = parseFloat(cs.opacity);
          const visible =
            cs.display !== 'none' &&
            cs.visibility !== 'hidden' &&
            opacity >= 0.8 &&
            !actor.classList.contains('is-docked') &&
            r.width >= 40 &&
            r.height >= 40;
          const inViewport =
            r.left >= -2 &&
            r.top >= -2 &&
            r.right <= window.innerWidth + 2 &&
            r.bottom <= window.innerHeight + 2;
          return {
            scrollY,
            mode: layer?.getAttribute('data-molly-mode') ?? '',
            visible,
            opacity,
            inViewport,
            rect: {
              left: Math.round(r.left),
              top: Math.round(r.top),
              right: Math.round(r.right),
              bottom: Math.round(r.bottom),
              width: Math.round(r.width),
              height: Math.round(r.height)
            }
          };
        });

        expect(mollyState.scrollY, `${routePath} @ ${vp.label}: scrollY must stay 0`).toBe(0);
        expect(mollyState.mode, `${routePath} @ ${vp.label}: default Molly mode`).toBe('roaming');
        expect(
          mollyState.visible,
          `${routePath} @ ${vp.label}: roaming Molly must be immediately visible at scrollY===0 (${JSON.stringify(mollyState)})`
        ).toBe(true);
        expect(
          mollyState.inViewport,
          `${routePath} @ ${vp.label}: roaming Molly must sit inside initial viewport (${JSON.stringify(mollyState)})`
        ).toBe(true);

        const allCollisions = await detectHeaderAndMollyCollisions(page);
        const roamingCollisions =
          vp.width >= 1440
            ? allCollisions
            : allCollisions.filter((c) => !c.pair.startsWith('molly:div.molly-pelisek-dock'));
        expect(roamingCollisions, `${routePath} @ ${vp.label}: Molly collisions`).toEqual([]);
      }
    }

    assertZeroRuntimeErrors(errors, 'T3-15');
  });

  test('T3-16: (/ Reload Persistence) Advancing to 3 / 45 and switching tabs survive page.reload(), while ?action= deep links & fresh starts work', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    const indicator = page.locator('.deck-indicator').first();
    const cardTitle = page.locator('.instant-card h2, .instant-card h3, .instant-card .action-title').first();
    await expect(indicator).toContainText(/^1\s*\/\s*45\b/);

    // Advance twice: 1 / 45 -> 2 / 45 -> 3 / 45
    await page.locator('.deck-nav-next').first().click();
    await page.waitForTimeout(150);
    await page.locator('.deck-nav-next').first().click();
    await page.waitForTimeout(150);
    await expect(indicator).toContainText(/^3\s*\/\s*45\b/);
    const thirdDeedTitle = (await cardTitle.innerText()).trim();
    expect(thirdDeedTitle.length).toBeGreaterThan(3);

    // Reload / -> must stay on 3 / 45 and show the exact same deed
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20_000 });
    await page.waitForTimeout(300);
    await expect(indicator).toContainText(/^3\s*\/\s*45\b/);
    expect((await cardTitle.innerText()).trim()).toBe(thirdDeedTitle);

    // Switch energy tab ("Mám 15 min"), advance to 2nd card, and reload -> preserves tab + position
    const focusTab = page.locator('.energy-tab', { hasText: /15 min/i }).first();
    if (await focusTab.isVisible()) {
      await focusTab.click();
      await page.waitForTimeout(150);
      await page.locator('.deck-nav-next').first().click();
      await page.waitForTimeout(150);
      const focusIndicatorText = (await indicator.innerText()).trim();
      expect(focusIndicatorText).toMatch(/^2\s*\/\s*\d+\b/);
      const focusDeedTitle = (await cardTitle.innerText()).trim();

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20_000 });
      await page.waitForTimeout(300);
      expect((await indicator.innerText()).trim()).toBe(focusIndicatorText);
      expect((await cardTitle.innerText()).trim()).toBe(focusDeedTitle);
    }

    // Explicit deep link /?action=s_barvou_ven MUST override stored state
    await gotoHydrated(page, '/?action=s_barvou_ven');
    await expect(page.locator('.instant-card').first()).toContainText(/S barvou ven/i);

    // Clearing storage returns a fresh session cleanly to 1 / 45
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.removeItem('aa_home_deck_state_v1');
      window.sessionStorage.setItem('__pw_clean_bootstrapped', '1');
    });
    await gotoHydrated(page, '/');
    await expect(indicator).toContainText(/^1\s*\/\s*45\b/);

    assertZeroRuntimeErrors(errors, 'T3-16');
  });

  test('T3-17: (/?action=zvire_v_nouzi & Preview Diorama Sizing) Responsive desktop vs mobile stage, fold budget with pagination, and clean completion', async ({
    page
  }) => {
    const errors = await setupPageEnvironment(page);

    // 1. Mobile breathable preview diorama (360x800 & 375x667): zero .impact-payoff-canvas class,
    //    no HUD overlap, >= 78px canvas height, and accessible CTA + 1 / 45 pagination!
    const mobileHeights: number[] = [];
    for (const vp of [
      { width: 360, height: 800, label: '360x800' },
      { width: 375, height: 667, label: '375x667' }
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/');

      const metrics = await page.evaluate(() => {
        const stage = document.querySelector('.instant-card .deed-preview-stage');
        const cv = document.querySelector('.instant-card canvas.preview-diorama-canvas');
        const hud = document.querySelector('.instant-card .preview-hud');
        const cta = document.querySelector('.instant-card .btn-studio-primary');
        const indicator = document.querySelector('.deck-indicator');
        if (!stage || !cv || !hud || !cta || !indicator) return null;
        const cvR = cv.getBoundingClientRect();
        const hudR = hud.getBoundingClientRect();
        const hudOverlapsCanvas =
          Math.min(hudR.right, cvR.right) - Math.max(hudR.left, cvR.left) > 1 &&
          Math.min(hudR.bottom, cvR.bottom) - Math.max(hudR.top, cvR.top) > 1;
        return {
          stageHeight: Math.round(stage.getBoundingClientRect().height),
          canvasHeight: Math.round(cvR.height),
          hasPayoffClass: cv.classList.contains('impact-payoff-canvas'),
          hasMollyMiniAttr: cv.hasAttribute('data-molly-mini'),
          hudOverlapsCanvas,
          ctaHeight: Math.round(cta.getBoundingClientRect().height),
          ctaRight: Math.round(cta.getBoundingClientRect().right),
          indicatorText: (indicator.textContent || '').trim()
        };
      });

      expect(metrics, `${vp.label} preview metrics`).not.toBeNull();
      expect(metrics!.hasPayoffClass, `${vp.label}: preview canvas must not have .impact-payoff-canvas`).toBe(false);
      expect(metrics!.hasMollyMiniAttr, `${vp.label}: preview canvas must not have data-molly-mini`).toBe(false);
      expect(metrics!.hudOverlapsCanvas, `${vp.label}: .preview-hud must not overlap canvas`).toBe(false);
      expect(metrics!.canvasHeight, `${vp.label}: breathable mobile preview canvas >= 78px`).toBeGreaterThanOrEqual(78);
      expect(metrics!.stageHeight, `${vp.label}: mobile preview stage <= 165px`).toBeLessThanOrEqual(165);
      expect(metrics!.ctaHeight, `${vp.label}: primary CTA >= 44px`).toBeGreaterThanOrEqual(44);
      expect(metrics!.ctaRight, `${vp.label}: primary CTA within viewport width`).toBeLessThanOrEqual(vp.width);
      expect(metrics!.indicatorText).toMatch(/^1\s*\/\s*45\b/);
      mobileHeights.push(metrics!.canvasHeight);
    }

    // 2. Desktop (1440x900) & zvire_v_nouzi end-to-end check: noticeably larger gallery preview stage + clean completion
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/?action=zvire_v_nouzi');

    const card = page.locator('.instant-card').first();
    await expect(card).toContainText(/774\s*155\s*155|zraněné ježky a ptáky/i);

    const desktopPreview = await page.evaluate(() => {
      const stage = document.querySelector('.instant-card .deed-preview-stage');
      const cv = document.querySelector('.instant-card canvas.preview-diorama-canvas') as HTMLCanvasElement | null;
      const hud = document.querySelector('.instant-card .preview-hud');
      if (!stage || !cv || !hud) return null;
      const cvR = cv.getBoundingClientRect();
      const hudR = hud.getBoundingClientRect();
      const hudOverlapsCanvas =
        Math.min(hudR.right, cvR.right) - Math.max(hudR.left, cvR.left) > 1 &&
        Math.min(hudR.bottom, cvR.bottom) - Math.max(hudR.top, cvR.top) > 1;
      return {
        stageHeight: Math.round(stage.getBoundingClientRect().height),
        canvasHeight: Math.round(cvR.height),
        hasPayoffClass: cv.classList.contains('impact-payoff-canvas'),
        hudOverlapsCanvas
      };
    });

    expect(desktopPreview).not.toBeNull();
    expect(desktopPreview!.hasPayoffClass).toBe(false);
    expect(desktopPreview!.hudOverlapsCanvas).toBe(false);
    expect(desktopPreview!.canvasHeight).toBeGreaterThanOrEqual(84);
    expect(desktopPreview!.canvasHeight).toBeGreaterThanOrEqual(Math.max(...mobileHeights));

    // Start & complete zvire_v_nouzi cleanly
    await card.locator('.btn-studio-primary').click();
    const doneBtn = card.locator('.btn-studio-done');
    await expect(doneBtn).toBeVisible();
    await expect(card.locator('canvas.impact-payoff-canvas')).toBeVisible();
    await expect(card.locator('.card-effect-stage')).toContainText(/34 stanic/i);

    await doneBtn.click();
    await expect(card.locator('.inline-celebration-card, .molly-celebration-note').first()).toBeVisible();
    await page.waitForTimeout(1200);
    await page.waitForFunction(
      () => {
        const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
        if (!actor || actor.classList.contains('is-docked')) return true;
        return actor.getAttribute('data-molly-behavior') !== 'WALK_ROAM';
      },
      null,
      { timeout: 4500 }
    );
    await page.waitForTimeout(100);

    expect(await scanForbiddenEmojis(page)).toEqual([]);
    expect(await detectHeaderAndMollyCollisions(page)).toEqual([]);

    // Also verify default '/' deed (click_and_feed) post-done celebration avoidance at 1440x900
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.setItem('__pw_clean_bootstrapped', '1');
    });
    await gotoHydrated(page, '/');
    const homeCard = page.locator('.instant-card').first();
    await homeCard.locator('.btn-studio-primary').click();
    const homeDoneBtn = homeCard.locator('.btn-studio-done');
    await expect(homeDoneBtn).toBeVisible();
    await homeDoneBtn.click();
    await expect(homeCard.locator('.in-situ-celebration')).toBeVisible();
    await page.waitForTimeout(1200);
    await page.waitForFunction(
      () => {
        const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
        if (!actor || actor.classList.contains('is-docked')) return true;
        return actor.getAttribute('data-molly-behavior') !== 'WALK_ROAM';
      },
      null,
      { timeout: 4500 }
    );
    await page.waitForTimeout(100);
    expect(await detectHeaderAndMollyCollisions(page)).toEqual([]);
    assertZeroRuntimeErrors(errors, 'T3-17');
  });

  test('T3-18: (Desktop 1440x900 & 1280x800 Smooth Scroll Motion & Czech Linden Palette) Zero Molly teleport/vertical hop across scroll + settle and zero near-black slabs', async ({
    page
  }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const errors = await setupPageEnvironment(page);

    for (const vp of [
      { width: 1440, height: 900, label: '1440x900' },
      { width: 1280, height: 800, label: '1280x800' }
    ]) {
      await page.goto('about:blank');
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/');

      if (vp.width === 1440) {
        const paletteCheck = await page.evaluate(() => {
          function bgInfo(sel: string) {
            const el = document.querySelector(sel);
            if (!el) return null;
            const cs = window.getComputedStyle(el);
            return {
              bg: cs.backgroundColor,
              bgImg: cs.backgroundImage,
              color: cs.color
            };
          }
          return {
            overline: bgInfo('.hero-overline'),
            brandMark: bgInfo('header.top-nav .brand-mark'),
            pineIcon: bgInfo('.bento-icon-wrap.pine'),
            sanctuaryCard: bgInfo('.sanctuary-portal-card')
          };
        });

        expect(paletteCheck.overline).not.toBeNull();
        expect(paletteCheck.brandMark).not.toBeNull();
        expect(paletteCheck.pineIcon).not.toBeNull();
        expect(paletteCheck.sanctuaryCard).not.toBeNull();
        for (const [key, val] of Object.entries(paletteCheck)) {
          expect(val!.bg, `${key} must not use near-black #11291e`).not.toBe('rgb(17, 41, 30)');
          expect(val!.bg, `${key} must not use near-black #173829`).not.toBe('rgb(23, 56, 41)');
          expect(val!.bgImg, `${key} gradient must not use near-black #11291e`).not.toContain(
            'rgb(17, 41, 30)'
          );
        }
      }

      const initialPolish = await page.evaluate(() => {
        const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
        if (!actor) return null;
        const ar = actor.getBoundingClientRect();
        const range = document.createRange();
        const h2Hits: string[] = [];
        for (const h2 of document.querySelectorAll('main h2')) {
          if (!h2.textContent?.trim()) continue;
          range.selectNodeContents(h2);
          const tr = range.getBoundingClientRect();
          const ow = Math.min(ar.right, tr.right) - Math.max(ar.left, tr.left);
          const oh = Math.min(ar.bottom, tr.bottom) - Math.max(ar.top, tr.top);
          if (ow > 1.5 && oh > 1.5) {
            h2Hits.push(h2.textContent.trim().slice(0, 45));
          }
        }
        return {
          width: Math.round(ar.width),
          height: Math.round(ar.height),
          h2Hits
        };
      });
      expect(initialPolish, `${vp.label}: initial Molly polish metrics`).not.toBeNull();
      expect(
        initialPolish!.width,
        `${vp.label}: natural Molly width at scrollY===0`
      ).toBeGreaterThanOrEqual(vp.width >= 1440 ? 82 : 68);
      expect(
        initialPolish!.height,
        `${vp.label}: natural Molly height at scrollY===0`
      ).toBeGreaterThanOrEqual(vp.width >= 1440 ? 70 : 58);
      expect(
        initialPolish!.h2Hits,
        `${vp.label}: Molly must not sit on top of main h2 heading glyphs at scrollY===0`
      ).toEqual([]);

      const trace = await page.evaluate(async () => {
        const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
        const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
        if (!actor) {
          return { missing: true, initialScrollY: window.scrollY, samples: [] as Array<{
            phase: string;
            t: number;
            scrollY: number;
            x: number;
            y: number;
            opacity: string;
            isDocked: boolean;
            behavior: string;
          }> };
        }

        const samples: Array<{
          phase: string;
          t: number;
          scrollY: number;
          x: number;
          y: number;
          opacity: string;
          isDocked: boolean;
          behavior: string;
        }> = [];

        const record = (phase: string) => {
          const r = actor.getBoundingClientRect();
          const cs = window.getComputedStyle(actor);
          samples.push({
            phase,
            t: Math.round(performance.now()),
            scrollY: Math.round(window.scrollY),
            x: Math.round((r.left + r.width * 0.5) * 10) / 10,
            y: Math.round(r.bottom * 10) / 10,
            opacity: cs.opacity,
            isDocked: actor.classList.contains('is-docked'),
            behavior: actor.getAttribute('data-molly-behavior') || ''
          });
        };

        const initialScrollY = window.scrollY;
        record('initial');

        // 8 smooth scroll increments: window.scrollBy(0, 140) every 80ms
        for (let i = 0; i < 8; i++) {
          window.scrollBy(0, 140);
          await sleep(80);
          record(`scroll-${i + 1}`);
        }

        // Wait >= 350ms after scroll settles, sampling every 50ms (plus finish any calm sidestep walk)
        for (let j = 0; j < 8; j++) {
          await sleep(50);
          record(`settle-${j + 1}`);
        }
        for (let extra = 0; extra < 12; extra++) {
          if (actor.getAttribute('data-molly-behavior') !== 'WALK_ROAM') break;
          await sleep(50);
          record(`walk-finish-${extra + 1}`);
        }

        return { missing: false, initialScrollY, samples };
      });

      expect(trace.missing, `${vp.label}: .molly-roaming-actor must exist`).toBe(false);
      expect(trace.initialScrollY, `${vp.label}: initial scrollY must be 0`).toBe(0);
      expect(trace.samples.length, `${vp.label}: sample count`).toBeGreaterThanOrEqual(17);

      for (const s of trace.samples) {
        expect(s.opacity, `${vp.label} [${s.phase}]: Molly opacity must stay '1'`).toBe('1');
        expect(s.isDocked, `${vp.label} [${s.phase}]: Molly must not enter .is-docked`).toBe(false);
      }

      for (let i = 1; i < trace.samples.length; i++) {
        const prev = trace.samples[i - 1];
        const curr = trace.samples[i];
        const dx = Math.abs(curr.x - prev.x);
        const dy = Math.abs(curr.y - prev.y);
        expect(
          dx,
          `${vp.label} [${prev.phase} -> ${curr.phase}]: |Δx|=${dx.toFixed(1)}px > 45px (teleport detected)`
        ).toBeLessThanOrEqual(45);
        expect(
          dy,
          `${vp.label} [${prev.phase} -> ${curr.phase}]: |Δy|=${dy.toFixed(1)}px > 12px (vertical hop detected)`
        ).toBeLessThanOrEqual(12);
      }

      const allCollisions = await detectHeaderAndMollyCollisions(page);
      const actorCollisions = allCollisions.filter((c) => c.pair.includes('molly-roaming-actor'));
      expect(
        actorCollisions,
        `${vp.label}: zero Molly roaming overlap with interactive controls after settling`
      ).toEqual([]);
      if (vp.width >= 1440) {
        expect(allCollisions, `${vp.label}: zero header/dock/Molly collisions after settling`).toEqual([]);
      }
    }

    assertZeroRuntimeErrors(errors, 'T3-18');
  });

  test('T3-19: (R1 Desktop Hero Forest Backdrop & .hero-wave SVG) 681..1440px top flush, rendered-pixel WCAG contrast, wave match, 1140px align, and mobile hidden', async ({
    page
  }) => {
    test.setTimeout(120_000);
    const errors = await setupPageEnvironment(page);

    for (const vp of [
      { width: 2560, height: 1440, label: '2560x1440' },
      { width: 1920, height: 1080, label: '1920x1080' },
      { width: 1440, height: 900, label: '1440x900' },
      { width: 1280, height: 800, label: '1280x800' },
      { width: 1025, height: 800, label: '1025x800' },
      { width: 1024, height: 768, label: '1024x768' },
      { width: 681, height: 800, label: '681x800' }
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/');

      const layoutMetrics = await page.evaluate(() => {
        const stage = document.querySelector('.hero-stage') as HTMLElement | null;
        const backdrop = document.querySelector('.hero-painted-backdrop') as HTMLElement | null;
        const aurora = document.querySelector('.hero-aurora') as HTMLElement | null;
        const scrim = document.querySelector('.hero-scrim') as HTMLElement | null;
        const firefliesLayer = document.querySelector('.fireflies-layer') as HTMLElement | null;
        const fireflies = Array.from(document.querySelectorAll('.fireflies-layer .firefly'));
        const overline = document.querySelector('.hero-overline') as HTMLElement | null;
        const title = document.querySelector('.hero-title') as HTMLElement | null;
        const serif = document.querySelector('.hero-serif') as HTMLElement | null;
        const lead = document.querySelector('.hero-lead') as HTMLElement | null;
        const leadStrong = document.querySelector('.hero-lead strong') as HTMLElement | null;
        const primaryBtn = document.querySelector('.hero-btn.primary') as HTMLElement | null;
        const sanctuaryBtn = document.querySelector('.sanctuary-hero-btn') as HTMLElement | null;
        const waveSvg = document.querySelector('.hero-wave svg') as SVGElement | null;
        const wavePath = document.querySelector('.hero-wave svg path') as SVGPathElement | null;
        const navCapsule = document.querySelector('header.top-nav .nav-capsule') as HTMLElement | null;
        const heroInner = document.querySelector('.hero-inner') as HTMLElement | null;
        const contentWrap = document.querySelector('.home-sections .content-wrap') as HTMLElement | null;
        const molly = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
        const headerDock = document.querySelector('.molly-pelisek-dock.is-header-dock') as HTMLElement | null;

        if (
          !stage ||
          !backdrop ||
          !aurora ||
          !scrim ||
          !firefliesLayer ||
          !overline ||
          !title ||
          !serif ||
          !lead ||
          !leadStrong ||
          !primaryBtn ||
          !sanctuaryBtn ||
          !waveSvg ||
          !wavePath
        ) {
          return null;
        }

        function tightRect(el: HTMLElement) {
          const range = document.createRange();
          range.selectNodeContents(el);
          const r = range.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) return r;
          return el.getBoundingClientRect();
        }

        const stageCs = window.getComputedStyle(stage);
        const backdropCs = window.getComputedStyle(backdrop);
        const backdropImg = backdrop.querySelector('img');
        const auroraCs = window.getComputedStyle(aurora);
        const scrimCs = window.getComputedStyle(scrim);
        const overlineCs = window.getComputedStyle(overline);
        const titleCs = window.getComputedStyle(title);
        const leadCs = window.getComputedStyle(lead);
        const leadStrongCs = window.getComputedStyle(leadStrong);
        const primaryBtnCs = window.getComputedStyle(primaryBtn);
        const sanctuaryBtnCs = window.getComputedStyle(sanctuaryBtn);
        const wavePathCs = window.getComputedStyle(wavePath);
        const rootSurface = window.getComputedStyle(document.documentElement).getPropertyValue('--surface-page').trim();

        const stageRect = stage.getBoundingClientRect();
        const waveRect = waveSvg.getBoundingClientRect();
        const mollyRect = molly?.getBoundingClientRect();
        const dockRect = headerDock?.getBoundingClientRect();
        const cardRect = document.querySelector('.instant-card')?.getBoundingClientRect();
        const cycleBtn = document.querySelector('.cycle-link') as HTMLElement | null;
        const visibleFireflies = fireflies
          .filter((f) => window.getComputedStyle(f).display !== 'none')
          .map((f) => {
            const r = f.getBoundingClientRect();
            const coveredByCard = cardRect
              ? r.left >= cardRect.left && r.right <= cardRect.right && r.top >= cardRect.top && r.bottom <= cardRect.bottom
              : false;
            const relTopRatio = (r.top - stageRect.top) / Math.max(1, stageRect.height);
            return { coveredByCard, relTopRatio };
          });

        const toRel = (r: DOMRect, insetX = 0, insetY = 0) => ({
          x: Math.max(0, r.left - stageRect.left + insetX),
          y: Math.max(0, r.top - stageRect.top + insetY),
          width: Math.max(1, r.width - insetX * 2),
          height: Math.max(1, r.height - insetY * 2)
        });

        return {
          stageTop: stageRect.top,
          stageWidth: stageRect.width,
          stageHeight: stageRect.height,
          stageBgImg: stageCs.backgroundImage,
          stageBorderBottom: stageCs.borderBottomWidth,
          backdropDisplay: backdropCs.display,
          backdropOpacity: parseFloat(backdropCs.opacity),
          backdropBgImg: backdropImg ? backdropImg.currentSrc || backdropImg.getAttribute('src') || '' : '',
          auroraDisplay: auroraCs.display,
          scrimDisplay: scrimCs.display,
          firefliesDisplay: window.getComputedStyle(firefliesLayer).display,
          fireflyCount: fireflies.length,
          occludedFireflies: visibleFireflies.filter((f) => f.coveredByCard).length,
          upperSkyFireflies: visibleFireflies.filter((f) => !f.coveredByCard && f.relTopRatio < 0.8).length,
          cycleBtnHeight: cycleBtn ? Math.round(cycleBtn.getBoundingClientRect().height) : 0,
          waveWidth: Math.round(waveRect.width),
          waveHeight: Math.round(waveRect.height),
          waveAtBottom: Math.abs(waveRect.bottom - stageRect.bottom) <= 2,
          waveFill: wavePathCs.fill,
          rootSurface,
          navWidth: navCapsule ? Math.round(navCapsule.getBoundingClientRect().width) : 0,
          heroInnerWidth: heroInner ? Math.round(heroInner.getBoundingClientRect().width) : 0,
          contentWidth: contentWrap ? Math.round(contentWrap.getBoundingClientRect().width) : 0,
          scrollY: window.scrollY,
          mollyVisible: Boolean(molly && mollyRect && mollyRect.width >= 40 && mollyRect.bottom <= window.innerHeight + 2),
          headerDockVisible: Boolean(headerDock && dockRect && dockRect.width >= 40 && dockRect.height >= 30),
          colors: {
            overline: overlineCs.color,
            title: titleCs.color,
            lead: leadCs.color,
            leadStrong: leadStrongCs.color,
            primaryBtn: primaryBtnCs.color,
            sanctuaryBtn: sanctuaryBtnCs.color
          },
          rects: {
            overline: toRel(tightRect(overline), 16, 1),
            title: toRel(tightRect(title), 2, 2),
            serif: toRel(tightRect(serif), 2, 2),
            lead: toRel(tightRect(lead), 2, 2),
            leadStrong: toRel(tightRect(leadStrong), 2, 1),
            primaryBtn: toRel(tightRect((primaryBtn.querySelector('span') as HTMLElement | null) || primaryBtn), 1, 1),
            sanctuaryBtn: toRel(tightRect((sanctuaryBtn.querySelector('span') as HTMLElement | null) || sanctuaryBtn), 1, 1)
          }
        };
      });

      expect(layoutMetrics, `${vp.label}: hero metrics`).not.toBeNull();
      expect(layoutMetrics!.stageTop, `${vp.label}: heroStage.top <= 0 (no exposed light strip at y=0)`).toBeLessThanOrEqual(0);
      expect(layoutMetrics!.stageBgImg, `${vp.label}: sunlit forest gradient`).toContain('rgb(14, 51, 35)');
      expect(layoutMetrics!.stageBgImg, `${vp.label}: mid emerald forest gradient`).toContain('rgb(22, 75, 52)');
      expect(layoutMetrics!.stageBorderBottom, `${vp.label}: zero seam border-bottom`).toBe('0px');
      expect(layoutMetrics!.backdropDisplay).not.toBe('none');
      expect(layoutMetrics!.backdropOpacity).toBeGreaterThan(0.3);
      expect(layoutMetrics!.backdropBgImg).toContain('/art/sanctuary-dawn');
      expect(layoutMetrics!.auroraDisplay).not.toBe('none');
      expect(layoutMetrics!.scrimDisplay).not.toBe('none');
      expect(layoutMetrics!.firefliesDisplay).not.toBe('none');
      expect(layoutMetrics!.fireflyCount).toBeGreaterThanOrEqual(7);
      expect(layoutMetrics!.waveHeight).toBeGreaterThanOrEqual(40);
      expect(layoutMetrics!.waveAtBottom).toBe(true);
      expect(layoutMetrics!.waveFill).toBe('rgb(246, 247, 243)');
      expect(layoutMetrics!.rootSurface.toLowerCase()).toBe('#f6f7f3');
      expect(layoutMetrics!.navWidth).toBeLessThanOrEqual(1140);
      expect(layoutMetrics!.heroInnerWidth).toBeLessThanOrEqual(1140);
      expect(layoutMetrics!.contentWidth).toBeLessThanOrEqual(1140);
      expect(layoutMetrics!.scrollY).toBe(0);
      if (vp.width > 1024) {
        expect(layoutMetrics!.mollyVisible, `${vp.label}: Molly visible at scrollY === 0`).toBe(true);
        expect(layoutMetrics!.upperSkyFireflies, `${vp.label}: open sky/lake fireflies visible`).toBeGreaterThanOrEqual(4);
      } else {
        expect(layoutMetrics!.headerDockVisible, `${vp.label}: Molly header dock visible`).toBe(true);
        expect(layoutMetrics!.cycleBtnHeight, `${vp.label}: tablet .cycle-link >= 44px touch target`).toBeGreaterThanOrEqual(44);
      }
      if (vp.width >= 1440) {
        expect(layoutMetrics!.occludedFireflies, `${vp.label}: zero fireflies hidden behind .instant-card`).toBe(0);
      }

      // Sample actual rendered composited background pixels behind each Hero copy/CTA element
      await page.evaluate(() => {
        const s = document.createElement('style');
        s.id = 't319-bg-probe';
        s.textContent = `
          .hero-copy, .hero-copy * {
            color: transparent !important;
            -webkit-text-fill-color: transparent !important;
          }
          .hero-serif {
            background: none !important;
          }
          .hero-overline .live-dot,
          .hero-copy svg {
            opacity: 0 !important;
          }
        `;
        document.head.appendChild(s);
      });

      let stagePngBase64 = '';
      try {
        const stageLoc = page.locator('.hero-stage').first();
        const pngBuf = await stageLoc.screenshot({ type: 'png', animations: 'disabled' });
        stagePngBase64 = pngBuf.toString('base64');
      } finally {
        await page.evaluate(() => {
          document.getElementById('t319-bg-probe')?.remove();
        });
      }

      const pixelContrast = await page.evaluate(
        async ({ pngB64, colors, rects, expectedWidth, expectedHeight }) => {
          function parseRgba(str: string): { r: number; g: number; b: number; a: number } {
            const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
            if (!m) return { r: 0, g: 0, b: 0, a: 1 };
            return {
              r: Number(m[1]),
              g: Number(m[2]),
              b: Number(m[3]),
              a: m[4] !== undefined ? Number(m[4]) : 1
            };
          }
          function compositeOver(fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number }) {
            return {
              r: fg.r * fg.a + bg.r * (1 - fg.a),
              g: fg.g * fg.a + bg.g * (1 - fg.a),
              b: fg.b * fg.a + bg.b * (1 - fg.a)
            };
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
            img.onerror = () => reject(new Error('Failed to decode stage screenshot'));
          });

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Missing 2d canvas context');
          ctx.drawImage(img, 0, 0);

          const scaleX = img.width / Math.max(1, expectedWidth);
          const scaleY = img.height / Math.max(1, expectedHeight);

          function worstCaseContrast(
            rect: { x: number; y: number; width: number; height: number },
            fgColors: Array<{ r: number; g: number; b: number; a: number }>
          ) {
            const x0 = Math.max(0, Math.floor(rect.x * scaleX));
            const y0 = Math.max(0, Math.floor(rect.y * scaleY));
            const w = Math.max(1, Math.min(img.width - x0, Math.ceil(rect.width * scaleX)));
            const h = Math.max(1, Math.min(img.height - y0, Math.ceil(rect.height * scaleY)));
            const data = ctx!.getImageData(x0, y0, w, h).data;
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
            overline: worstCaseContrast(rects.overline, [parseRgba(colors.overline)]),
            title: worstCaseContrast(rects.title, [parseRgba(colors.title)]),
            serif: worstCaseContrast(rects.serif, [
              { r: 253, g: 230, b: 138, a: 1 },
              { r: 187, g: 247, b: 208, a: 1 },
              { r: 254, g: 240, b: 138, a: 1 }
            ]),
            lead: worstCaseContrast(rects.lead, [parseRgba(colors.lead)]),
            leadStrong: worstCaseContrast(rects.leadStrong, [parseRgba(colors.leadStrong)]),
            primaryBtn: worstCaseContrast(rects.primaryBtn, [parseRgba(colors.primaryBtn)]),
            sanctuaryBtn: worstCaseContrast(rects.sanctuaryBtn, [parseRgba(colors.sanctuaryBtn)])
          };
        },
        {
          pngB64: stagePngBase64,
          colors: layoutMetrics!.colors,
          rects: layoutMetrics!.rects,
          expectedWidth: layoutMetrics!.stageWidth,
          expectedHeight: layoutMetrics!.stageHeight
        }
      );

      expect(pixelContrast.overline, `${vp.label}: rendered .hero-overline contrast >= 4.5`).toBeGreaterThanOrEqual(4.5);
      expect(pixelContrast.title, `${vp.label}: rendered .hero-title contrast >= 4.5`).toBeGreaterThanOrEqual(4.5);
      expect(pixelContrast.serif, `${vp.label}: rendered .hero-serif stops contrast >= 4.5`).toBeGreaterThanOrEqual(4.5);
      expect(pixelContrast.lead, `${vp.label}: rendered .hero-lead contrast >= 4.5`).toBeGreaterThanOrEqual(4.5);
      expect(pixelContrast.leadStrong, `${vp.label}: rendered .hero-lead strong contrast >= 4.5`).toBeGreaterThanOrEqual(4.5);
      expect(pixelContrast.primaryBtn, `${vp.label}: rendered .hero-btn.primary contrast >= 4.5`).toBeGreaterThanOrEqual(4.5);
      expect(pixelContrast.sanctuaryBtn, `${vp.label}: rendered .sanctuary-hero-btn contrast >= 4.5`).toBeGreaterThanOrEqual(4.5);

      await assertZeroOverflow(page, `T3-19 ${vp.label}`);
      expect(await scanForbiddenEmojis(page)).toEqual([]);
    }

    // Mobile viewports render compact atmospheric dawn hero strip with painted backdrop & readable claim
    for (const mvp of [
      { width: 360, height: 800, label: '360x800' },
      { width: 375, height: 667, label: '375x667' }
    ]) {
      await page.setViewportSize({ width: mvp.width, height: mvp.height });
      await gotoHydrated(page, '/');
      await expect(page.locator('.hero-painted-backdrop')).toBeVisible();
      await expect(page.locator('.hero-aurora')).toBeVisible();
      await expect(page.locator('.hero-scrim')).toBeVisible();
      await expect(page.locator('.fireflies-layer')).toBeHidden();
      await expect(page.locator('.hero-wave')).toBeVisible();
      await expect(page.locator('.hero-mobile-claim')).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 0));
      const mobHero = await page.evaluate(() => {
        const stage = document.querySelector('.hero-stage') as HTMLElement | null;
        const copy = document.querySelector('.hero-copy');
        const bd = document.querySelector('.hero-painted-backdrop');
        const bdImg = bd ? bd.querySelector('img') : null;
        const claim = document.querySelector('.hero-mobile-claim') as HTMLElement | null;
        if (!stage || !claim) return null;
        const sr = stage.getBoundingClientRect();
        const cr = claim.getBoundingClientRect();
        const cs = window.getComputedStyle(claim);
        const clipHeight = Math.min(Math.ceil(sr.height), 160);
        return {
          copyHeight: copy ? Math.round(copy.getBoundingClientRect().height) : 0,
          backdropBg: bdImg ? bdImg.currentSrc || bdImg.getAttribute('src') || '' : '',
          clip: {
            x: Math.max(0, Math.floor(sr.left)),
            y: Math.max(0, Math.floor(sr.top)),
            width: Math.max(1, Math.floor(sr.width)),
            height: Math.max(1, clipHeight)
          },
          claimColor: cs.color,
          claimRect: {
            x: Math.max(0, cr.left - Math.max(0, Math.floor(sr.left))),
            y: Math.max(0, cr.top - Math.max(0, Math.floor(sr.top))),
            width: Math.max(1, cr.width),
            height: Math.max(1, cr.height)
          }
        };
      });
      expect(mobHero).not.toBeNull();
      expect(mobHero!.copyHeight).toBeGreaterThanOrEqual(72);
      expect(mobHero!.copyHeight).toBeLessThanOrEqual(220);
      expect(mobHero!.backdropBg).toContain('/art/sanctuary-dawn');

      // Empirically assert worst-case WCAG AA pixel contrast >= 4.5:1 for .hero-mobile-claim over actual rendered backdrop
      await page.evaluate(() => {
        const s = document.createElement('style');
        s.id = 't319-mob-bg-probe';
        s.textContent = `
          .hero-copy, .hero-copy * {
            color: transparent !important;
            -webkit-text-fill-color: transparent !important;
            text-shadow: none !important;
          }
          .hero-overline .live-dot,
          .hero-copy svg {
            opacity: 0 !important;
          }
        `;
        document.head.appendChild(s);
      });

      let mobStagePngB64 = '';
      try {
        const pngBuf = await page.screenshot({
          type: 'png',
          animations: 'disabled',
          clip: mobHero!.clip
        });
        mobStagePngB64 = pngBuf.toString('base64');
      } finally {
        await page.evaluate(() => {
          document.getElementById('t319-mob-bg-probe')?.remove();
        });
      }

      const mobClaimMinContrast = await page.evaluate(
        async ({ pngB64, fgColorStr, rect, expectedWidth, expectedHeight }) => {
          const m = fgColorStr.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
          const fgRaw = m
            ? { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] !== undefined ? Number(m[4]) : 1 }
            : { r: 255, g: 255, b: 255, a: 1 };
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
            img.onerror = () => reject(new Error('Failed to decode mobile stage screenshot'));
          });
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Missing 2d canvas context');
          ctx.drawImage(img, 0, 0);
          const scaleX = img.width / Math.max(1, expectedWidth);
          const scaleY = img.height / Math.max(1, expectedHeight);
          const x0 = Math.max(0, Math.floor(rect.x * scaleX));
          const y0 = Math.max(0, Math.floor(rect.y * scaleY));
          const w = Math.max(1, Math.min(img.width - x0, Math.ceil(rect.width * scaleX)));
          const h = Math.max(1, Math.min(img.height - y0, Math.ceil(rect.height * scaleY)));
          const data = ctx.getImageData(x0, y0, w, h).data;
          let minRatio = Infinity;
          for (let i = 0; i < data.length; i += 16) {
            const bg = { r: data[i], g: data[i + 1], b: data[i + 2] };
            const fg = {
              r: fgRaw.r * fgRaw.a + bg.r * (1 - fgRaw.a),
              g: fgRaw.g * fgRaw.a + bg.g * (1 - fgRaw.a),
              b: fgRaw.b * fgRaw.a + bg.b * (1 - fgRaw.a)
            };
            const r = contrastRatio(fg, bg);
            if (r < minRatio) minRatio = r;
          }
          return minRatio;
        },
        {
          pngB64: mobStagePngB64,
          fgColorStr: mobHero!.claimColor,
          rect: mobHero!.claimRect,
          expectedWidth: mobHero!.clip.width,
          expectedHeight: mobHero!.clip.height
        }
      );
      expect(
        mobClaimMinContrast,
        `${mvp.label}: rendered .hero-mobile-claim worst-case contrast >= 4.5`
      ).toBeGreaterThanOrEqual(4.5);

      await assertZeroOverflow(page, `T3-19 ${mvp.label}`);
    }

    assertZeroRuntimeErrors(errors, 'T3-19');
  });

  test('T3-20: (R2 Desktop 1440x900 Deed Preview Warm-Yellow Hover Illumination) Light resting frame, pointer-tracking --spot-x/--spot-y glow, scroll-while-hovered invalidation, CTA priming, and mouseleave reset', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    const stage = page.locator('.instant-card .deed-preview-stage').first();
    const cta = page.locator('.instant-card .btn-studio-primary').first();
    await expect(stage).toBeVisible();
    await expect(cta).toBeVisible();

    // 1. Resting state renders unified radiant emerald sanctuary diorama (no stark white HUD strip) with ::after opacity 0
    const resting = await stage.evaluate((el) => {
      const hud = el.querySelector('.preview-hud') as HTMLElement | null;
      const cs = window.getComputedStyle(el);
      const afterCs = window.getComputedStyle(el, '::after');
      const hudCs = hud ? window.getComputedStyle(hud) : null;
      return {
        isPrimed: el.classList.contains('is-primed'),
        bgImg: cs.backgroundImage,
        borderColor: cs.borderColor,
        boxShadow: cs.boxShadow,
        hudBg: hudCs?.backgroundColor || '',
        afterOpacity: parseFloat(afterCs.opacity),
        afterBgImg: afterCs.backgroundImage
      };
    });
    expect(resting.isPrimed).toBe(false);
    expect(resting.bgImg).toContain('radial-gradient');
    expect(resting.bgImg).toContain('linear-gradient');
    expect(resting.hudBg).toBe('rgba(0, 0, 0, 0)');
    expect(resting.afterOpacity).toBe(0);

    const topLeftCanvasAlpha = await stage.evaluate((el) => {
      const cv = el.querySelector('canvas.preview-diorama-canvas') as HTMLCanvasElement | null;
      const ctx = cv?.getContext('2d');
      return ctx ? ctx.getImageData(2, 2, 1, 1).data[3] : -1;
    });
    expect(topLeftCanvasAlpha).toBe(0);

    // 2. Hover over .deed-preview-stage at two distinct pointer coordinates
    const box = await stage.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width * 0.2, box!.y + box!.height * 0.3, { steps: 4 });
    await page.waitForTimeout(300);

    const hoverLeft = await stage.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      const afterCs = window.getComputedStyle(el, '::after');
      return {
        isPrimed: el.classList.contains('is-primed'),
        spotX: el.style.getPropertyValue('--spot-x'),
        spotY: el.style.getPropertyValue('--spot-y'),
        borderColor: cs.borderColor,
        boxShadow: cs.boxShadow,
        afterOpacity: parseFloat(afterCs.opacity),
        afterBgImg: afterCs.backgroundImage
      };
    });
    expect(hoverLeft.isPrimed).toBe(true);
    expect(parseFloat(hoverLeft.spotX)).toBeLessThan(35);
    expect(hoverLeft.afterOpacity).toBeGreaterThanOrEqual(0.9);
    expect(hoverLeft.afterBgImg).toContain('radial-gradient');
    expect(hoverLeft.afterBgImg).toMatch(/253,\s*230,\s*138|251,\s*191,\s*36/);
    expect(hoverLeft.borderColor).not.toBe(resting.borderColor);
    expect(hoverLeft.boxShadow).toMatch(/251,\s*191,\s*36|180,\s*120,\s*16/);

    await page.mouse.move(box!.x + box!.width * 0.82, box!.y + box!.height * 0.72, { steps: 4 });
    await page.waitForTimeout(80);
    const hoverRight = await stage.evaluate((el) => ({
      isPrimed: el.classList.contains('is-primed'),
      spotX: el.style.getPropertyValue('--spot-x'),
      spotY: el.style.getPropertyValue('--spot-y')
    }));
    expect(hoverRight.isPrimed).toBe(true);
    expect(parseFloat(hoverRight.spotX)).toBeGreaterThan(65);
    expect(parseFloat(hoverRight.spotY)).toBeGreaterThan(55);

    // 2b. Scroll while hovered invalidates cached previewBounds so --spot-y tracks accurately
    await page.evaluate(() => window.scrollTo({ top: 30, behavior: 'instant' }));
    await page.waitForTimeout(60);
    const scrolledBox = await stage.boundingBox();
    expect(scrolledBox).not.toBeNull();
    await page.mouse.move(scrolledBox!.x + scrolledBox!.width * 0.5, scrolledBox!.y + scrolledBox!.height * 0.8, {
      steps: 2
    });
    await page.waitForTimeout(60);
    const hoverAfterScroll = await stage.evaluate((el) => ({
      isPrimed: el.classList.contains('is-primed'),
      spotX: parseFloat(el.style.getPropertyValue('--spot-x')),
      spotY: parseFloat(el.style.getPropertyValue('--spot-y'))
    }));
    expect(hoverAfterScroll.isPrimed).toBe(true);
    expect(hoverAfterScroll.spotX).toBeGreaterThanOrEqual(42);
    expect(hoverAfterScroll.spotX).toBeLessThanOrEqual(58);
    expect(hoverAfterScroll.spotY).toBeGreaterThanOrEqual(72);
    expect(hoverAfterScroll.spotY).toBeLessThanOrEqual(88);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(60);

    // 3. Moving pointer off .deed-preview-stage removes .is-primed and hides glow
    await page.mouse.move(10, 10);
    await page.waitForTimeout(300);
    const afterLeave = await stage.evaluate((el) => ({
      isPrimed: el.classList.contains('is-primed'),
      spotX: el.style.getPropertyValue('--spot-x'),
      afterOpacity: parseFloat(window.getComputedStyle(el, '::after').opacity)
    }));
    expect(afterLeave.isPrimed).toBe(false);
    expect(afterLeave.spotX).toBe('50%');
    expect(afterLeave.afterOpacity).toBe(0);

    // 4. Hovering primary CTA also primes .deed-preview-stage, and leaving resets it
    const ctaBox = await cta.boundingBox();
    expect(ctaBox).not.toBeNull();
    await page.mouse.move(ctaBox!.x + ctaBox!.width * 0.5, ctaBox!.y + ctaBox!.height * 0.5, { steps: 3 });
    await page.waitForTimeout(100);
    expect(await stage.evaluate((el) => el.classList.contains('is-primed'))).toBe(true);

    await page.mouse.move(10, 10);
    await page.waitForTimeout(100);
    expect(await stage.evaluate((el) => el.classList.contains('is-primed'))).toBe(false);

    // 5. Rendered-pixel WCAG >= 4.5:1 contrast on .preview-hud pills across rest, top-right hover, and nudge
    const sampleHudContrast = async () => {
      const hudInfo = await stage.evaluate((el) => {
        const pPill = el.querySelector('.preview-promise-pill') as HTMLElement;
        const sPill = el.querySelector('.preview-status-pill') as HTMLElement;
        const pSpan = pPill.querySelector('span:last-child') as HTMLElement;
        const sSpan = sPill.querySelector('span:last-child') as HTMLElement;
        const sr = el.getBoundingClientRect();
        const pr = pSpan.getBoundingClientRect();
        const stR = sSpan.getBoundingClientRect();
        return {
          sw: Math.round(sr.width),
          sh: Math.round(sr.height),
          pColor: window.getComputedStyle(pPill).color,
          sColor: window.getComputedStyle(sPill).color,
          pTextOverflow: window.getComputedStyle(pSpan).textOverflow,
          sTextOverflow: window.getComputedStyle(sSpan).textOverflow,
          pRect: { x: pr.left - sr.left, y: pr.top - sr.top, w: pr.width, h: pr.height },
          sRect: { x: stR.left - sr.left, y: stR.top - sr.top, w: stR.width, h: stR.height }
        };
      });
      await page.evaluate(() => {
        const s = document.createElement('style');
        s.id = 't320-hud-probe';
        s.textContent = `
          .preview-hud > span > span, .preview-hud svg, .preview-status-dot { color: transparent !important; opacity: 0 !important; }
          .preview-promise-pill, .preview-status-pill { color: transparent !important; }
        `;
        document.head.appendChild(s);
      });
      let buf: Buffer;
      try {
        buf = await stage.screenshot({ type: 'png', animations: 'disabled' });
      } finally {
        await page.evaluate(() => document.getElementById('t320-hud-probe')?.remove());
      }
      return page.evaluate(
        async ({ b64, hudInfo }) => {
          function parseRgb(str: string) {
            const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i)!;
            return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
          }
          function lum(c: { r: number; g: number; b: number }) {
            const lin = (v: number) => {
              const s = v / 255;
              return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
            };
            return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
          }
          function ratio(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }) {
            const l1 = lum(c1);
            const l2 = lum(c2);
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          }
          const img = new Image();
          img.src = `data:image/png;base64,${b64}`;
          await new Promise<void>((res) => (img.onload = () => res()));
          const cv = document.createElement('canvas');
          cv.width = img.width;
          cv.height = img.height;
          const ctx = cv.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const sx = img.width / Math.max(1, hudInfo.sw);
          const sy = img.height / Math.max(1, hudInfo.sh);
          function minContrast(rect: { x: number; y: number; w: number; h: number }, fg: { r: number; g: number; b: number }) {
            const data = ctx.getImageData(
              Math.max(0, Math.floor(rect.x * sx)),
              Math.max(0, Math.floor(rect.y * sy)),
              Math.max(1, Math.floor(rect.w * sx)),
              Math.max(1, Math.floor(rect.h * sy))
            ).data;
            let min = Infinity;
            for (let i = 0; i < data.length; i += 8) {
              const bg = { r: data[i], g: data[i + 1], b: data[i + 2] };
              const r = ratio(fg, bg);
              if (r < min) min = r;
            }
            return min;
          }
          return {
            pTextOverflow: hudInfo.pTextOverflow,
            sTextOverflow: hudInfo.sTextOverflow,
            promise: minContrast(hudInfo.pRect, parseRgb(hudInfo.pColor)),
            status: minContrast(hudInfo.sRect, parseRgb(hudInfo.sColor))
          };
        },
        { b64: buf.toString('base64'), hudInfo }
      );
    };

    const restHud = await sampleHudContrast();
    expect(restHud.pTextOverflow).toBe('ellipsis');
    expect(restHud.sTextOverflow).toBe('ellipsis');
    expect(restHud.promise).toBeGreaterThanOrEqual(4.5);
    expect(restHud.status).toBeGreaterThanOrEqual(4.5);

    await page.mouse.move(box!.x + box!.width * 0.85, box!.y + 16, { steps: 3 });
    await page.waitForTimeout(260);
    const hoverTopRightHud = await sampleHudContrast();
    expect(hoverTopRightHud.promise).toBeGreaterThanOrEqual(4.5);
    expect(hoverTopRightHud.status).toBeGreaterThanOrEqual(4.5);

    await stage.click();
    await page.waitForTimeout(260);
    const nudgedHud = await sampleHudContrast();
    expect(nudgedHud.promise).toBeGreaterThanOrEqual(4.5);
    expect(nudgedHud.status).toBeGreaterThanOrEqual(4.5);

    // 6. Directory cards on /app/online keep block ellipsis on .quick-tags-pill with zero mid-word clipping on 1440x900
    await gotoHydrated(page, '/app/online');
    const dirTags = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.directory-card .quick-tags-pill')).map((el) => {
        const h = el as HTMLElement;
        const cs = window.getComputedStyle(h);
        return {
          display: cs.display,
          textOverflow: cs.textOverflow,
          overflows: h.scrollWidth > h.clientWidth + 1
        };
      })
    );
    expect(dirTags.length).toBeGreaterThanOrEqual(3);
    for (const dt of dirTags) {
      expect(dt.display).toBe('block');
      expect(dt.textOverflow).toBe('ellipsis');
      expect(dt.overflows).toBe(false);
    }

    // Also verify 360x800 wraps .quick-tags-pill cleanly without horizontal clipping
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(120);
    const mobileDirTags = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.directory-card .quick-tags-pill')).map((el) => {
        const h = el as HTMLElement;
        const cs = window.getComputedStyle(h);
        return {
          whiteSpace: cs.whiteSpace,
          overflows: h.scrollWidth > h.clientWidth + 1
        };
      })
    );
    expect(mobileDirTags.length).toBeGreaterThanOrEqual(3);
    for (const mdt of mobileDirTags) {
      expect(mdt.whiteSpace).toBe('normal');
      expect(mdt.overflows).toBe(false);
    }

    assertZeroRuntimeErrors(errors, 'T3-20');
  });
});

// ============================================================================
// TIER 4: REAL-WORLD MOBILE JOURNEY & VISUAL JUDGE SCREENSHOT SUITE
// ============================================================================

test.describe('Tier 4: End-to-End Mobile Journey & Visual Judge Screenshot Capture', () => {
  test('T4-1: First-visit mobile journey (360x800): / deed -> Molly thanks -> /svet pet Molly', async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    const card = page.locator('.instant-card').first();
    const cta = card.locator('.btn-studio-primary');
    await expect(cta).toBeVisible();
    const ctaBox = await cta.boundingBox();
    expect(ctaBox).not.toBeNull();
    expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(800);

    // Cycle to next tip (1 / N -> 2 / N)
    const indicator = page.locator('.deck-indicator').first();
    await expect(indicator).toContainText(/^1\s*\//);
    const cycled = await clickFirstVisible(page.locator('.instant-card .cycle-btn, .deck-nav-next'));
    expect(cycled).toBe(true);
    await page.waitForTimeout(200);
    await expect(indicator).toContainText(/^2\s*\//);

    // Open Jak to funguje, start & complete deed
    await card.locator('details.how-toggle summary').click();
    await expect(card.locator('details.how-toggle')).toContainText(/Přímý měřitelný účinek|Doložený přínos|Komunitní smysl/);
    await cta.click();
    await expect(card.locator('.btn-studio-done')).toBeVisible();
    await card.locator('.btn-studio-done').click();
    await page.waitForTimeout(300);
    await expect(card.locator('.molly-celebration-note')).toContainText('Molly děkuje.');

    // Navigate via mobile top nav drawer to /svet and pet Molly
    await page.locator('button.mobile-nav-toggle').click();
    await page.locator('#mobile-top-nav-drawer a[href="/svet"]').click();
    await page.waitForURL('**/svet');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20_000 });
    await page.waitForTimeout(450);

    const readPetCount = () =>
      page.evaluate(() => Number(JSON.parse(localStorage.getItem('aa_molly_companion_v1') || '{}').petCount) || 0);
    const petsBefore = await readPetCount();
    const mollyPill = page.locator('.molly-sanctuary-pill');
    await expect(mollyPill).toBeVisible();
    await mollyPill.click();
    await page.waitForTimeout(250);

    expect(await readPetCount()).toBe(petsBefore + 1);
    await expect(page.locator('.gentle-toast')).toContainText('Molly');

    expect(await scanForbiddenEmojis(page)).toEqual([]);
    expect(await detectHeaderAndMollyCollisions(page)).toEqual([]);
    await assertZeroOverflow(page, 'T4-1');
    assertZeroRuntimeErrors(errors, 'T4-1');
  });

});
