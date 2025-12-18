## Concept v2: “Agency-first” Altruism Accelerator (Czech-only)

### Who we’re designing for
**A 19-year-old in a doom/helplessness mindset**: low energy, low trust, easily overwhelmed, feels “I’m nothing / it’s too late”.

Goal: **give them agency in under 60 seconds**, with **zero guilt** and a path to a **real-world “small win”**.

---

### Non‑negotiable product principles
- **Agency first**: “You can do one small thing today” (not “you should”).
- **Ultra low friction**: no accounts, no long forms, no lectures.
- **One primary action at a time**: avoid stacked CTAs and clutter.
- **Real-world grounding**: show **real places and real portals** (Czech-only).
- **No emotional interrogation**: support without forcing “how do you feel?” steps.
- **Safety**: always-visible crisis/support links (already present in Streamlit).

---

### The core experience (v2 flow)
**Home (intro)**
- 3 choices:
  1) **🗺️ Near you (map)** → pick a place → open website → done
  2) **⚡ Online now** → 1-click actions → done
  3) **🧭 Guided (60–120s)** → pick 1–2 areas → get 1 recommended action → done

**After “done”**
- **Tiny celebration** (calm, not childish)
- “Want one more?” secondary CTA, plus “Stop here” option (protects energy)

---

### Data strategy (Czech-only, real)
We want **both**:
- **Organizations/places near you** (real map layer)
  - Source: **OpenStreetMap (Overpass)** for NGOs/community centres/food aid/animal shelters
- **Opportunities** (real portals + curated actions)
  - Portals: Dobrokruh / INEX / ADRA (and others we add later)
  - Curated actions: our own dataset links when no structured API exists

---

### Tech decision (best fit)
**SvelteKit (existing landing page) becomes the main UX shell**:
- Best for “landing-page-quality” UI and a beautiful map.
**Streamlit stays temporarily** as the journey/logic engine while we migrate pieces over.

Deliver incrementally:
1) Web-quality **/near** map in SvelteKit (done)
2) Polish “Online now” + “Guided” as SvelteKit pages
3) Sunset Streamlit once parity achieved


