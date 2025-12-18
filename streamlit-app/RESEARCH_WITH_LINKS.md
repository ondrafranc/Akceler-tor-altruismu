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


