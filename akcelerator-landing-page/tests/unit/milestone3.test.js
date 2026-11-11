import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';

import {
  playCelebrationChord
} from '../../src/lib/audio/presets.js';
import * as SensoryEngineBarrel from '../../src/lib/sensoryEngine.js';
import {
  savePendingPartnerReturn,
  readPendingPartnerRecord,
  getPendingPartnerReturnRemainingMs,
  consumePendingPartnerReturn,
  checkImmediatePartnerReturn
} from '../../src/lib/features/actions/services/partnerReturnService.js';
import {
  openOfflineDb,
  enqueueOfflineRequest,
  getPendingRequests,
  removePendingRequest,
  clearOutbox,
  flushOfflineQueue,
  cacheDeedsOffline,
  getCachedDeedsOffline,
  offlineFetch
} from '../../src/lib/offlineSync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcLib = path.resolve(__dirname, '../../src/lib');

function loadSource(subpath) {
  const fullPath = path.resolve(srcLib, subpath);
  return readFileSync(fullPath, 'utf8');
}

describe('Milestone 3: In-Situ Reward, Swipe Deck, Session Closure & Offline PWA', () => {
  beforeEach(async () => {
    await clearOutbox();
  });

  describe('1. In-Situ Audio Synthesis & Celebration Engine', () => {
    it('playCelebrationChord is exported from presets and sensoryEngine barrel', () => {
      expect(typeof playCelebrationChord).toBe('function');
      expect(typeof SensoryEngineBarrel.playCelebrationChord).toBe('function');
      expect(SensoryEngineBarrel.playCelebrationChord).toBe(playCelebrationChord);
    });

    it('playCelebrationChord runs safely without exceptions and without external network audio downloads', () => {
      expect(() => playCelebrationChord()).not.toThrow();
    });

    it('checkImmediatePartnerReturn and partnerReturnService eliminate the artificial 3000ms delay', () => {
      expect(typeof checkImmediatePartnerReturn).toBe('function');
      expect(SensoryEngineBarrel.checkImmediatePartnerReturn).toBe(checkImmediatePartnerReturn);

      // Remaining ms should be 0 by default (no artificial 3000ms delay)
      expect(getPendingPartnerReturnRemainingMs(0)).toBe(0);

      // Save a pending partner visit
      savePendingPartnerReturn({ id: 'click-and-feed', title: 'Click and Feed' });

      // Immediate check should consume without waiting 3000ms
      const immediate = checkImmediatePartnerReturn();
      expect(immediate).toBeDefined();
      expect(immediate?.id).toBe('click-and-feed');
      expect(immediate?.consumed).toBe(true);

      // Once consumed, subsequent checks return null
      expect(checkImmediatePartnerReturn()).toBeNull();
    });
  });

  describe('2. Micro-Deed SwipeDeck Component', () => {
    it('SwipeDeck.svelte compiles cleanly with Svelte compiler', () => {
      const source = loadSource('features/actions/components/SwipeDeck.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();
    });

    it('SwipeDeck.svelte supports horizontal touch gestures with touch-action: pan-y', () => {
      const source = loadSource('features/actions/components/SwipeDeck.svelte');
      expect(source).toContain('touch-action: pan-y');
      expect(source).toContain('on:pointerdown');
      expect(source).toContain('on:pointermove');
      expect(source).toContain('on:pointerup');
      expect(source).toContain('rotate');
    });

    it('SwipeDeck.svelte includes 44x44px accessible previous and next buttons', () => {
      const source = loadSource('features/actions/components/SwipeDeck.svelte');
      expect(source).toContain('deck-nav-btn');
      expect(source).toContain('deck-nav-prev');
      expect(source).toContain('deck-nav-next');
      expect(source).toContain('min-width: 44px');
      expect(source).toContain('min-height: 44px');
      expect(source).toContain('aria-label="Předchozí doporučený skutek"');
      expect(source).toContain('aria-label="Další doporučený skutek"');
    });

    it('SwipeDeck.svelte includes psychological session closure ("Pro dnešek hotovo")', () => {
      const source = loadSource('features/actions/components/SwipeDeck.svelte');
      expect(source).toContain('session-closed-card');
      expect(source).toContain('Pro dnešek máš hotovo.');
      expect(source).toContain('closed-stats-pill');
      expect(source).toContain('closed-btn-reopen');
      expect(source).toContain('aa_done_for_today_');
    });
  });

  describe('3. ActionCard In-Situ Reward & North Star Compliance', () => {
    it('ActionCard.svelte compiles cleanly with Svelte compiler', () => {
      const source = loadSource('features/actions/components/ActionCard.svelte');
      const compiled = compile(source, { generate: 'server' });
      expect(compiled.js.code).toBeDefined();
    });

    it('ActionCard.svelte provides in-situ celebration without forced redirection to /svet', () => {
      const source = loadSource('features/actions/components/ActionCard.svelte');
      // In-situ reward markup present
      expect(source).toContain('in-situ-celebration');
      expect(source).toContain('Skvělá práce!');
      expect(source).toContain('in-situ-affirmation');
      expect(source).toContain('btn-session-close');

      // No forced redirect links to /svet from celebration
      expect(source).not.toContain('class="return-dopamine-btn btn-world"');
      expect(source).not.toContain('Rozsvítit tenhle skutek v Krajině');

      // No references to Molly cat treats
      expect(source).not.toContain('lososová granulka');
      expect(source).not.toContain('Molly ti děkuje');
    });

    it('ActionCard.svelte interactive celebration buttons meet 44x44px touch targets', () => {
      const source = loadSource('features/actions/components/ActionCard.svelte');
      expect(source).toContain('.return-dopamine-btn');
      expect(source).toContain('min-height: 44px');
      expect(source).toContain('min-width: 44px');
    });
  });

  describe('4. Dynamic Imports for Heavy Bundles', () => {
    it('/svet route does not statically import storyCard.js', () => {
      const svetPath = path.resolve(__dirname, '../../src/routes/svet/+page.svelte');
      const source = readFileSync(svetPath, 'utf8');
      expect(source).not.toContain('import { renderStoryCardPng } from "../../lib/storyCard.js";');
      expect(source).not.toContain("from '../../lib/storyCard.js'");
    });

    it('ProgressDashboard.svelte uses dynamic import for storyCard.js', () => {
      const source = loadSource('features/sanctuary/components/ProgressDashboard.svelte');
      expect(source).toContain("await import('../../../storyCard.js')");
      expect(source).not.toContain("import { renderStoryCardPng } from '../../../storyCard.js';");
    });

    it('near/+page.svelte dynamically imports leaflet.css on demand', () => {
      const nearPath = path.resolve(__dirname, '../../src/routes/near/+page.svelte');
      const source = readFileSync(nearPath, 'utf8');
      expect(source).toContain("await import('leaflet/dist/leaflet.css')");
      expect(source).not.toMatch(/^import\s+['"]leaflet\/dist\/leaflet\.css['"]/m);
    });
  });

  describe('5. Offline Storage & Outbox Sync (offlineSync.js)', () => {
    it('enqueues offline requests and retrieves them from the outbox', async () => {
      const id1 = await enqueueOfflineRequest({
        url: '/api/feedback',
        method: 'POST',
        body: { score: 5, note: 'Super zážitek' }
      });
      expect(id1).toBeDefined();

      const pending = await getPendingRequests();
      expect(pending.length).toBeGreaterThanOrEqual(1);
      const found = pending.find((p) => p.url === '/api/feedback');
      expect(found).toBeDefined();
      expect(found.method).toBe('POST');

      // Removing the request
      await removePendingRequest(found.id);
      const remaining = await getPendingRequests();
      expect(remaining.find((p) => p.id === found.id)).toBeUndefined();
    });

    it('clearOutbox empties all pending items', async () => {
      await enqueueOfflineRequest({ url: '/api/pulse', method: 'POST', body: {} });
      await clearOutbox();
      const pending = await getPendingRequests();
      expect(pending.length).toBe(0);
    });

    it('offlineFetch enqueues when offline and returns a 202 queued synthetic response', async () => {
      // Mock network failure / offline via failed fetch or offline state
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      try {
        const res = await offlineFetch('/api/submissions', {
          method: 'POST',
          body: JSON.stringify({ title: 'Nový skutek' })
        });

        expect(res.status).toBe(202);
        const data = await res.json();
        expect(data.offline).toBe(true);
        expect(data.queued).toBe(true);

        const pending = await getPendingRequests();
        expect(pending.some((p) => p.url === '/api/submissions')).toBe(true);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('flushOfflineQueue synchronizes queued requests using fetch', async () => {
      await enqueueOfflineRequest({
        url: '/api/telemetry',
        method: 'POST',
        body: { event: 'small_win' }
      });

      const originalFetch = global.fetch;
      // Mock fetch resolving 200 OK
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

      try {
        const synced = await flushOfflineQueue();
        expect(synced).toBeGreaterThanOrEqual(1);
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/telemetry',
          expect.objectContaining({ method: 'POST' })
        );

        const remaining = await getPendingRequests();
        expect(remaining.find((p) => p.url === '/api/telemetry')).toBeUndefined();
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
