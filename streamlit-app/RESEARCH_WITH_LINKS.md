## **MANDATORY RESEARCH COMPLETED** ✅

This file documents the required research phase for:
- “Make the whole app feel like the landing page”
- “Add a beautiful map with real nearby opportunities/organizations”
- “Rewrite Values Discovery + Action Selection in Journey”
- “Choose the best tech for a beautiful map + landing-page feel (Czech-only)”
- “Fix broken Leaflet map tiles in production (blank/gray basemap)”

---

## Local Codebase Analysis

### What we found
- **Landing page already uses SvelteKit + Tailwind** (`akcelerator-landing-page/package.json`) but has **no real map library** dependency yet.
- The “map” on the landing page is currently a **custom illustrated CZ regions component**, not a geospatial map: `akcelerator-landing-page/src/components/CzechMap.svelte`.
- Streamlit Journey steps still had **legacy gradient-heavy UI** in:
  - `streamlit-app/core/journey.py` (`_show_values_discovery_step`, `_show_action_selection_step`, `_render_action_card`)
- Quick Help had only a **basic location dropdown** (Praha/Brno/Ostrava) and the underlying data uses `requirements.location` (not consistently `action.location`).

### Map bug: “tiles are blank / gray”
We found the SvelteKit app was sending **cross-origin isolation headers** that can block loading external tile images/scripts:
- `akcelerator-landing-page/src/hooks.server.js`
  - `Cross-Origin-Embedder-Policy: require-corp`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: same-origin`
- `akcelerator-landing-page/vercel.json` also set the same headers.

Symptom matched the screenshot: **markers render but basemap tiles are gray**.

### Fix implemented
We removed those headers in both places (we still keep CSP + other safe headers).

Files changed:
- `akcelerator-landing-page/src/hooks.server.js` (removed COEP/COOP/CORP)
- `akcelerator-landing-page/vercel.json` (removed COEP/COOP/CORP)

### How that informed implementation
- We leaned on a **calm global CSS design system** (`streamlit-app/config/styling.py`) and removed local gradients in Journey steps.
- For “near you + map”, we ultimately moved the feature into **SvelteKit** (better UI control):
  - `/near` (Leaflet + clean tiles)
  - `/api/nearby` (server-side Overpass proxy + caching)

---

## Internet Research (2025)

🔗 **[Streamlit Theming Documentation](https://docs.streamlit.io/develop/concepts/configuration/theming)**
- **Found via web search:** Official Streamlit theming guide.
- **Key Insights:** Prefer theme-first customization; keep CSS overrides minimal and resilient.
- **Applicable:** Use a calm design system and avoid brittle CSS selectors.

🔗 **[Streamlit “Designing for the user” (Part II)](https://blog.streamlit.io/designing-streamlit-apps-for-the-user-part-ii/?utm_source=openai)**
- **Found via web search:** Streamlit UX guidance.
- **Key Insights:** Reduce cognitive load, create clear hierarchy, one primary CTA.
- **Applicable:** Values → Action flow uses fewer simultaneous CTAs and calmer cards.

🔗 **[Microsoft Streamlit UI Template](https://github.com/microsoft/Streamlit_UI_Template)**
- **Found via web search:** Reference template for polished Streamlit UIs.
- **Key Insights:** Centralize styling and keep UI consistent.
- **Applicable:** Reinforced “design system” approach.

🔗 **[streamlit-geolocation (PyPI)](https://pypi.org/project/streamlit-geolocation/?utm_source=openai)**
- **Found via web search:** Streamlit component for browser geolocation.
- **Key Insights:** Can obtain user lat/lon via the browser.
- **Applicable:** Used as optional enhancement; app still works without it.

🔗 **[streamlit-folium (GitHub)](https://github.com/randyzwitch/streamlit-folium?utm_source=openai)**
- **Found via web search:** Standard approach to embed interactive maps in Streamlit.
- **Key Insights:** Supports click events (`last_clicked`) and full interactive maps.
- **Applicable:** Used for a “beautiful map” inside Streamlit with click-to-set-location.

🔗 **[Dobrokruh – dobrovolnictví](https://dobrokruh.cz/en/dobrovolnictvi?utm_source=openai)**
- **Found via web search:** Czech volunteering portal/app.
- **Key Insights:** Verified projects; good “real opportunities” surface.
- **Applicable:** Linked from `/near` and Guided flow as an opportunities source.

🔗 **[INEX-SDA – Workcamps in CZ](https://www.inexsda.cz/en/activities/workcamps-in-cz/?utm_source=openai)**
- **Found via web search:** Workcamps list for Czech Republic.
- **Key Insights:** Concrete short-term opportunities; good for “reset + community”.
- **Applicable:** Linked as an opportunities source.

🔗 **[ADRA – Become a volunteer](https://adra.cz/en/homepage/get-involved/become-a-volunteer/?utm_source=openai)**
- **Found via web search:** Volunteer programs across CZ.
- **Key Insights:** Real programs (seniors/kids/hospitals/social support).
- **Applicable:** Linked as an opportunities source.

🔗 **[Create a multipage app (Streamlit docs)](https://docs.streamlit.io/get-started/tutorials/create-a-multipage-app)**
- **Found via web search:** Official tutorial.
- **Key Insights:** Organize experiences into clear pages to reduce overwhelm.
- **Applicable:** Informed the “Map vs List” tab split in Quick Help.

🔗 **[7 Visual Debugging Techniques for Web Maps](https://www.maplibrary.org/10248/7-visual-debugging-techniques-for-web-maps/?utm_source=openai)**
- **Found via web search:** Web map debugging checklist (console + network).
- **Key Insights:** Check browser console + network failures (tiles/layers) first.
- **Applicable:** Used to reason about “gray tiles” = blocked/failed tile requests.

🔗 **[How to get Chrome to reload source maps (hard reload)](https://www.codegenes.net/blog/how-to-get-chrome-to-reload-source-maps/?utm_source=openai)**
- **Found via web search:** Browser cache/hard reload guidance.
- **Key Insights:** Hard reload can eliminate cache artifacts while debugging.
- **Applicable:** Useful for validating header/CSP changes after deployment.

---

## Synthesis & Recommendation

- **If you want the landing page feel everywhere**, Streamlit can be improved (we did), but **a full UI match** is best achieved by migrating the “app” into the existing **SvelteKit** project (we started: `/app`, `/near`).
- **For real local data**, OpenStreetMap-derived places are a practical first step. If you want true “opportunities” (events/volunteer slots), we’ll likely need:
  - A dedicated dataset + moderation, or
  - A partner/API (often requires keys, ToS, and ongoing maintenance)

- **For map reliability in production**, avoid cross-origin isolation headers (COEP/COOP/CORP) unless you truly need SharedArrayBuffer; otherwise external tile/CDN resources may be blocked and the basemap will render gray.

---

## Follow-up: make /near more actionable (cards + GPS UX)

### Local codebase changes (what we implemented)
- **Richer place data from Overpass**:
  - `akcelerator-landing-page/src/routes/api/nearby/+server.js` now derives:
    - `address`, `phone`, `email`, `opening_hours`, `description`, `osm_url`
- **Better map UX + card UX**:
  - `akcelerator-landing-page/src/routes/near/+page.svelte` now:
    - Shows **GPS status + clear error messages**
    - Draws a **radius circle** overlay
    - Adds **search + sorting + “show more”**
    - Makes cards **more informational** and adds “Zobrazit na mapě”

Snippet (GPS messaging pattern):
```js
gpsStatus = 'requesting';
gpsMessage = 'Čekám na povolení polohy…';

navigator.geolocation.getCurrentPosition(
  async (pos) => {
    gpsStatus = 'ok';
    gpsMessage = 'Poloha načtena. Hledám místa v okolí…';
    // setUserLocation(...) + fetchNearby(...)
  },
  (err) => {
    gpsStatus = 'error';
    // map error codes to user-facing hints
  },
  { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
);
```

### Internet Research (2025) – map UX & consistency

🔗 **[Consistent design (WCAG supplemental pattern)](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o1p03-consistent-design/?utm_source=openai)**
- **Found via web search:** WCAG supplemental UX pattern.
- **Key Insights:** Consistency reduces cognitive load and improves learnability.
- **Applicable:** Keep map controls, card layout, and CTA wording consistent across map/list.

🔗 **[Interactive Map Web Accessibility Styles Tips](https://help.concept3d.com/hc/en-us/articles/115003617214-Interactive-Map-Web-Accessibility-Styles-Tips?utm_source=openai)**
- **Found via web search:** Map accessibility styling tips.
- **Key Insights:** Clear controls, readable labels, contrast, and accessible interactions matter on maps.
- **Applicable:** Reinforces our focus on readable cards + obvious actions.

🔗 **[The Guide to Map Implementation](https://blog.mapspeople.com/the-guide-to-map-implementation?utm_source=openai)**
- **Found via web search:** Map implementation overview (approaches, tradeoffs).
- **Key Insights:** Pick the approach that maximizes UX control and reliability.
- **Applicable:** Supports SvelteKit-first approach for map-heavy UX.

🔗 **[Making interactive maps in JavaScript](https://bcheung98.medium.com/making-interactive-maps-in-javascript-210f47d59a3a?utm_source=openai)**
- **Found via web search:** JS mapping walkthrough.
- **Key Insights:** Practical JS patterns for interactive maps (tiles, markers, popups).
- **Applicable:** Aligns with Leaflet-based implementation patterns.

🔗 **[Website UX Best Practices — Top 10](https://www.roastmyweb.com/blog/website-ux-best-practices-top-10?utm_source=openai)**
- **Found via web search:** General UX best practices list.
- **Key Insights:** Clear hierarchy, speed, and consistency help users act.
- **Applicable:** Informed the “3-step” header (Poloha → Kategorie → Kontakt) and split map/list layout.

🔗 **[Website layouts that improve user flow](https://webdesign.digital/best-practices-for-website-layouts-that-improve-user-flow/?utm_source=openai)**
- **Found via web search:** Layout & user-flow guidance.
- **Key Insights:** Reduce choices per screen; keep primary action visible.
- **Applicable:** Split view keeps “where am I” (map) and “what do I do” (cards) visible together.


---

## Strategic analysis (Dec 2025): what to do next

### Local Codebase Analysis (current product reality)

**What the app is (implemented):**
- The “core experience” in `CONCEPT_V2.md` is now real as SvelteKit routes:
  - `/app` (3 choices: Near / Online / Guided)
  - `/near` (map + real places)
  - `/app/online` (fast online actions)
  - `/app/guided` (values → next step)

Snippet (the 3-choice “start screen” is the product hub):
```svelte
// akcelerator-landing-page/src/routes/app/+page.svelte
near: { title: '🗺️ V okolí (mapa)', ... href: '/near' },
online: { title: '⚡ Online teď', ... href: '/app/online' },
guided: { title: '🧭 Průvodce (1–2 min)', ... href: '/app/guided' },
```

**Key constraint (reliability):**
- `/api/nearby` is a best-effort Overpass proxy with **in-memory caching**:
```js
// akcelerator-landing-page/src/routes/api/nearby/+server.js
const CACHE = new Map();
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter'
];
```
- On serverless (Vercel), this cache can reset on cold starts → **strategic next step is production-grade caching** (headers + persistent store).

**Key mismatch vs. “Czech-only”:**
- A language store still exists and many pages include EN copy/meta:
```js
// akcelerator-landing-page/src/lib/stores.js
export const currentLanguage = writable('czech');
```

### Internet Research (2025) – strategy enablers

🔗 **[SvelteKit performance](https://svelte.dev/docs/kit/performance?utm_source=openai)**
- **Found via web search:** Official SvelteKit guidance.
- **Key Insights:** Measure and reduce client work; keep the app fast by default.
- **Applicable to Next Steps:** Performance is a core UX feature for “overwhelmed” users; guides us to keep map/list snappy while adding more data.

🔗 **[Sentry for Svelte](https://sentry.io/for/svelte/?utm_source=openai)**
- **Found via web search:** Monitoring product page.
- **Key Insights:** Capture real errors + performance issues in production.
- **Applicable to Next Steps:** Useful once we start adding caching/geocoding/portal integrations (more failure modes).

🔗 **[SvelteKit XSS vulnerability (CVE-2025-32388)](https://www.wiz.io/vulnerability-database/cve/cve-2025-32388?utm_source=openai)**
- **Found via web search:** Security advisory summary.
- **Key Insights:** Keep SvelteKit updated; be careful around URL/search params handling.
- **Applicable to Next Steps:** If we add shareable URLs and more query params to `/near`, we should stay current and sanitize/escape correctly.

🔗 **[Website UX Best Practices — Top 10](https://www.roastmyweb.com/blog/website-ux-best-practices-top-10?utm_source=openai)**
- **Found via web search:** UX best practices overview.
- **Key Insights:** Hierarchy + clarity + speed = action.
- **Applicable to Next Steps:** Reinforces “one primary action” and clean funnel measurement.

🔗 **[Website layouts that improve user flow](https://webdesign.digital/best-practices-for-website-layouts-that-improve-user-flow/?utm_source=openai)**
- **Found via web search:** Layout & flow patterns.
- **Key Insights:** Keep the primary content visible; reduce context switching.
- **Applicable to Next Steps:** Supports keeping split map/list and adding “done” states without adding screens.

### Synthesis & Recommendation (next steps, in order)

1) **Measure the funnel (fastest learning)**
   - Track: Landing → `/app` → (Near/Online/Guided) → click-out (`Web →` / `Trasa →`) → “done”.
   - This tells us what to build next without guessing.

2) **Make it truly Czech-only (reduce cognitive load)**
   - Remove EN surfaces + language store, or hard-lock Czech for now.
   - Keep copy short, teen-friendly, and “stop-anytime” friendly.

3) **Production reliability for `/api/nearby`**
   - Add proper caching headers and/or persistent cache (to survive cold starts).
   - Add graceful backoff + “try again” messaging when Overpass is slow.

4) **Opportunity depth (events/shifts) without heavy integration**
   - Start with: better portal cards + city-filtered links + curated “starter actions”.
   - Only later: API partnerships or ingestion pipelines.

5) **Location UX upgrade**
   - Free-form “search location” (town/ZIP) + better defaults.
   - Keep privacy-first, no account.

---

## Follow-up (Dec 2025): Funnel analytics instrumentation (Vercel Web Analytics)

### Objective
Measure the core promise: **“user reaches a real external action within 2 minutes”**.

### What we implemented (local codebase changes)
- Added a tiny helper that is:
  - **safe in SSR/dev** (no-ops)
  - **privacy-safe** (no lat/lon, no user identifiers)
  - uses the Vercel Web Analytics API when available

Snippet:
```js
// akcelerator-landing-page/src/lib/analytics.js
export function trackEvent(name, data = undefined) {
  // browser-only, dev no-op
  // uses window.va('event', { name, data }) when available
  // falls back to importing track() from @vercel/analytics
}
```

- Instrumented the funnel events:
  - Landing CTAs → **`aa_launch`**
  - `/app` choices → **`aa_app_choice`** (`near|online|guided`)
  - click-outs from `/near` + portals + `/app/online` → **`aa_clickout`**
  - GPS reliability signals on `/near` → **`aa_near_gps_request`**, **`aa_near_gps_result`**
  - Overpass fetch failures on `/near` → **`aa_near_fetch_error`**

### Internet research (implementation API)

🔗 **[Vercel Analytics: Custom Events](https://vercel.com/docs/analytics/custom-events)**
- **Found via Context7 (official Vercel docs):** How to send custom events with `track()` or `va('event', ...)`.
- **Key Insights:** `track('EventName', { ...data })` is supported across frameworks; `va('event', { name, data })` works via the global API.
- **Applicable:** We use a helper that prefers `window.va` and falls back to importing `track()` so events fire reliably.

🔗 **[Vercel Feature Flags integration: Track with flags (client-side)](https://vercel.com/docs/feature-flags/integrate-with-web-analytics)**
- **Found via Context7 (official Vercel docs):** Shows `track()` signature and options object usage.
- **Key Insights:** Confirms the `track()` import path and call shape.
- **Applicable:** Validated our event call style and payload shape.

---

## Follow-up (Dec 2025): `/api/nearby` edge caching (Vercel CDN)

### Why
Overpass is a shared public upstream; caching reduces latency and protects the upstream during spikes.

### What we implemented (local codebase changes)
- We set CDN-focused caching directives on successful `/api/nearby` responses:
  - `s-maxage=3600` (1 hour fresh on CDN)
  - `stale-while-revalidate=86400` (serve stale while refreshing in background)
- We explicitly **do not cache** bad requests:
  - `cache-control: no-store` on missing `lat/lon` (400)

### Internet research (Vercel caching behavior)

🔗 **[Vercel Edge Network caching](https://vercel.com/docs/edge-network/caching)**
- **Found via Context7 (official Vercel docs):** Explains edge caching and headers behavior.
- **Key Insights:** Vercel consumes `s-maxage` + `stale-while-revalidate` at the CDN.
- **Applicable:** Confirms our approach of caching API results at the edge.

🔗 **[Vercel Cache-Control headers](https://vercel.com/docs/headers/cache-control-headers)**
- **Found via Context7 (official Vercel docs):** Details `s-maxage` and `stale-while-revalidate`.
- **Key Insights:** SWR serves cached responses while revalidating asynchronously.
- **Applicable:** Matches our “fast even when Overpass is slow” reliability goal.

---

## Follow-up (Dec 2025): Location search (town/ZIP) + shareable `/near` URLs + community submissions

### Local Codebase Analysis (what we implemented)

**A) Shareable `/near` URLs**
- `/near` now:
  - reads initial state from URL params (`lat`, `lon`, `radius_km`, `kinds`, `include_associations`, `q`, `sort`, `only_web`)
  - keeps the URL updated via `history.replaceState` (rounded coordinates for privacy/stability)
  - exposes a “🔗 Zkopírovat odkaz” CTA

Key snippet:
```js
// akcelerator-landing-page/src/routes/near/+page.svelte
const sp = new URLSearchParams(window.location.search);
history.replaceState({}, '', url.toString());
```

**B) Town/ZIP geocoding (Czech-only)**
- Added `/api/geocode` (Nominatim proxy) with:
  - country restriction (`countrycodes=cz`)
  - caching + inflight de-dupe + simple throttling (best-effort)

Key snippet:
```js
// akcelerator-landing-page/src/routes/api/geocode/+server.js
url.searchParams.set('format', 'jsonv2');
url.searchParams.set('countrycodes', 'cz');
```

**C) “Add your org/event” submission flow**
- New public page: `/submit`
- New endpoint: `POST /api/submissions` → inserts into Supabase table `community_submissions` as `pending`
- New endpoint: `GET /api/community-nearby` → returns **approved** items near current `/near` location
- `/near` now shows an “✅ Ověřené od komunity” section (cards) and a link to submit.

Key snippet:
```js
// akcelerator-landing-page/src/routes/api/submissions/+server.js
await supabase.from('community_submissions').insert([{ status: 'pending', kind, name, lat, lon, ... }])
```

### Internet Research (2025) – links we used

> Note: Web search results were not able to reliably surface official Nominatim policy/docs links in this environment.
> We still used Nominatim best-effort with caching + throttling, and documented the behavior in code/comments.

🔗 **[Google Maps: Full-stack store locator codelab](https://developers.google.com/codelabs/maps-platform/full-stack-store-locator/?utm_source=openai)**
- **Found via web search:** Example of location search + radius patterns (product locator UX).
- **Key Insights:** “location input → geocode → radius results” is a standard UX pattern users understand.
- **Applicable:** Mirrors our “město/PSČ → geocode → nearby results” flow.

🔗 **[ASP.NET: Creating readable URLs (routing)](https://learn.microsoft.com/en-us/aspnet/web-pages/overview/routing/creating-readable-urls-in-aspnet-web-pages-sites?utm_source=openai)**
- **Found via web search:** URL parameterization / readable URL concepts.
- **Key Insights:** URLs can encode state so a page can be re-created from a link.
- **Applicable:** Supports our “shareable /near URL state” approach.

🔗 **[Address geocoding (concept)](https://en.wikipedia.org/wiki/Address_geocoding?utm_source=openai)**
- **Found via web search:** Conceptual overview of geocoding.
- **Key Insights:** Town/ZIP → lat/lon is the foundational operation behind “near me” experiences.
- **Applicable:** Baseline justification for using a geocoder endpoint.

🔗 **[Google Maps URLs – get started](https://developers.google.com/maps/documentation/urls/get-started?utm_source=openai)**
- **Found via web search:** How URL parameters can represent map/search state.
- **Key Insights:** A URL can encode destination/search intent in a shareable way.
- **Applicable:** Reinforced our shareable-link UX pattern (even though we implement it inside our own app).

---

## Bugfix (Dec 2025): `social_facility=soup_kitchen` was misclassified as `community`

### Local Codebase Analysis (verification)

In `akcelerator-landing-page/src/routes/api/nearby/+server.js`, the `kind` logic included:
- `tags.amenity === 'soup_kitchen'` ✅
- `tags.social_facility === 'food_bank'` ✅
- but **missed** `tags.social_facility === 'soup_kitchen'` ❌

This caused elements tagged as `amenity=social_facility` + `social_facility=soup_kitchen` to fall through to `community`, even though `deriveSubcategory()` already treated `sf === 'soup_kitchen'` as “Výdej jídla”.

### Fix implemented

We updated the `kind` classification to include:
- `tags.social_facility === 'soup_kitchen'` → `kind = 'food'`

### Internet Research (2025)

🔗 **[SvelteKit routing](https://svelte.dev/docs/kit/routing?utm_source=openai)**
- **Found via web search:** SvelteKit routing docs.
- **Key Insights:** Confirms server endpoints are implemented in `+server.js`.
- **Applicable:** Used as a reference while patching the API endpoint safely.

🔗 **[SvelteKit load docs](https://svelte.dev/docs/kit/load?utm_source=openai)**
- **Found via web search:** SvelteKit load & server patterns docs.
- **Key Insights:** Reinforces correct server-side handler patterns and error handling.
- **Applicable:** Used as a sanity reference during endpoint changes.

---

## Competitive note (Dec 2025): Dobrokruh.cz similarity — continue or stop?

### Local Codebase Analysis (our intent vs overlap)
- Our concept explicitly treats Dobrokruh as **one of multiple “portals”** (not the whole product):
  - `CONCEPT_V2.md` includes: “Portals: Dobrokruh / INEX / ADRA…”
  - `/near` and `/app/guided` link to Dobrokruh as an opportunity source.

### Internet Research (2025)

🔗 **[Dobrokruh (official site)](https://dobrokruh.cz/en?utm_source=openai)**
- **Found via web search:** Dobrokruh’s product page.
- **Key Insights:** Positions as a broader assistance program; includes volunteering module.
- **Applicable:** Confirms overlap exists, but they’re not “near-me map + micro-action accelerator” by default.

🔗 **[Dobrokruh iOS app listing](https://apps.apple.com/cz/app/dobrokruh/id6451313976?utm_source=openai)**
- **Found via web search:** App Store listing describing features.
- **Key Insights:** Mentions 24/7 professional help + micro-courses + volunteering discovery.
- **Applicable:** Confirms their differentiation is “assistance program + volunteering platform”, while ours is “agency-first <60s action funnel + map + community verified layer”.

### Synthesis & recommendation
- **Continue**, but do **not** try to “out-Dobrokruh Dobrokruh”.
- Treat them as:
  - **a source** (already)
  - and potentially a **partner** later (if we want deeper integration, do it with permission/API rather than scraping).
- Our defensible niche:
  - teen-first “overwhelm → one small win”
  - local **map of places** (OSM) + **community-verified** additions
  - ultra-low friction (no accounts, minimal steps)
  - multi-source (Dobrokruh + INEX + ADRA + other local portals)

---

## AI layer / personalization / ranking / “gentle gamification” (Dec 2025)

### Local Codebase Analysis (what we already have)
- **Signals we can use (privacy-safe):**
  - Click-outs tracked as `aa_clickout` (no PII)
  - `/app` choice tracked as `aa_app_choice`
  - Guided values stored locally: `localStorage['aa_values']`
- **A calm celebration pattern already exists** (gentle modal, not flashy):
  - `akcelerator-landing-page/src/lib/animations.js` creates `.czech-celebration`
  - Global styles are in `akcelerator-landing-page/src/routes/+layout.svelte`

### Internet Research (2025)

🔗 **[IBM: AI personalization](https://www.ibm.com/think/topics/ai-personalization?utm_source=openai)**
- **Found via web search:** Overview of AI personalization.
- **Key Insights:** Personalization can unify signals and tailor experiences.
- **Applicable:** Helps frame what “AI layer” can mean without over-collecting data.

🔗 **[Reuters: Meta to use AI chats to personalize content/ads (Dec 2025)](https://www.reuters.com/business/media-telecom/meta-use-ai-chats-personalize-content-ads-december-2025-10-01/?utm_source=openai)**
- **Found via web search:** 2025 industry trend example.
- **Key Insights:** Modern platforms use interaction signals for personalization.
- **Applicable:** Reinforces that “no effort first” often means implicit signals, not long onboarding.

🔗 **[Monetate: Generative AI + personalization](https://monetate.com/resource/6-ways-generative-ai-personalization-boosts-user-engagement/?utm_source=openai)**
- **Found via web search:** Practical personalization patterns.
- **Key Insights:** Real-time personalization is typically driven by behavioral signals.
- **Applicable:** Supports a staged approach: start with rules, then learn from click-outs.

🔗 **[HumAIne-Chatbot (arXiv)](https://arxiv.org/abs/2509.04303?utm_source=openai)**
- **Found via web search:** Research example of adaptive conversational systems.
- **Key Insights:** Adaptive experiences can be learned over time.
- **Applicable:** If we add an optional “assistant”, keep it opt-in and non-therapeutic.

### Synthesis (recommended staged approach)

1) **Stage 0 — “Modern feed” without AI (ship fast)**
   - Define a clear **friction score** and **trust score** per item (distance, has website/contact, upcoming soon, etc.)
   - Default sorting = “no effort first”.

2) **Stage 1 — Light personalization (still not AI)**
   - Use tiny preference chips (time: 5/15/45; social: solo/group; online vs near).
   - Combine with the existing `aa_values` (localStorage) to boost matching categories.

3) **Stage 2 — Learned ranking (privacy-safe)**
   - Learn from aggregated click-outs (which items users choose) to tune weights.
   - Keep it explainable (“Proč to vidíš?” label like: blízko + má web + odpovídá výběru).

4) **Stage 3 — Optional LLM assistant (only if needed)**
   - Use LLM for **microcopy**: “first message template”, “what to expect”, not emotional diagnosis.
   - Opt-in, with clear boundaries and safety links.

---

## Stage 0 + Stage 1 on `/near` + “cutting-edge map” polish (Dec 2025)

### Local Codebase Analysis (what we will extend)
- The `/near` page already has a clean pipeline we can hook into:
  - `filteredPlaces` → `sortedPlaces` (currently `distance | name`)
  - URL share state is handled via `readUrlState()` + `syncUrl()` and a reactive `_key` (privacy-safe rounded coords)
- Map integration is already structured for map↔list sync:
  - markers created in `renderMarkers()` and stored in `markerById`
  - list cards already call `focusPlace(p)` (currently `map.setView(...)` + popup)

Code pointers (current state):

```js
// akcelerator-landing-page/src/routes/near/+page.svelte
$: sortedPlaces = (() => {
  if (sortBy === 'name') {
    return [...filteredPlaces].sort((a, b) => {
      const an = (a.name || '').toString();
      const bn = (b.name || '').toString();
      return an.localeCompare(bn, 'cs', { sensitivity: 'base' });
    });
  }
  return filteredPlaces;
})();
```

```js
// akcelerator-landing-page/src/routes/near/+page.svelte
function renderMarkers() {
  // ...
  markerById = new Map();
  for (const p of places.slice(0, 250)) {
    const marker = leaflet.marker([p.lat, p.lon], { icon, riseOnHover: true });
    markerById.set(p.id, marker);
    marker.addTo(markersLayer);
  }
}
```

```js
// akcelerator-landing-page/src/routes/near/+page.svelte
function syncUrl(force = false) {
  // ... rounded coords for privacy ...
  if (sortBy && sortBy !== 'distance') sp.set('sort', sortBy);
  else sp.delete('sort');
  // ...
}
```

### Internet Research (2025)

🔗 **[IBM: AI personalization](https://www.ibm.com/think/topics/ai-personalization?utm_source=openai)**
- **Found via web search:** Overview of personalization approaches.
- **Key Insights:** Modern personalization uses small implicit signals; doesn’t require heavy onboarding.
- **Applicable:** Supports Stage 1 “tiny preference chips” + local-only preferences.

🔗 **[Wikipedia: Leaflet (software)](https://en.wikipedia.org/wiki/Leaflet_%28software%29?utm_source=openai)**
- **Found via web search:** Background + positioning of Leaflet as lightweight interactive map library.
- **Key Insights:** Leaflet’s strength is simple interactivity + extensibility.
- **Applicable:** Justifies staying on Leaflet while making the experience feel modern via interactions (highlight, fly-to, map↔list sync).

🔗 **[arXiv: Semantic Zoom and Mini-Maps](https://arxiv.org/abs/2510.00003?utm_source=openai)**
- **Found via web search:** Research reference on semantic zoom patterns.
- **Key Insights:** UX improves when detail and focus adapt to zoom/state.
- **Applicable:** We’ll keep the UI “focused”: active place highlight + gentle transitions instead of adding clutter.

🔗 **[ProfileTree: AI-powered personalisation in web design](https://profiletree.com/ai-powered-personalisation-in-web-design/?utm_source=openai)**
- **Found via web search:** Practical personalization patterns.
- **Key Insights:** Lightweight personalization can be done with minimal explicit input.
- **Applicable:** Reinforces Stage 1 (time/social chips) and explainable ranking.

### Synthesis & implementation decision
- Implement **Stage 0** as a rule-based **ease score**: distance + “trust signals” (web/contact/hours/address) → default sort “Nejlehčí”.
- Implement **Stage 1** as **tiny preference chips** (time + social) + boost from existing `aa_values` (localStorage) without accounts.
- Make the map feel “cutting edge” via **tight map↔list coupling** (hover highlight, marker click scroll, `flyTo` transitions) instead of swapping mapping stacks.

