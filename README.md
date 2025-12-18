# 🇨🇿 Akcelerátor altruismu

**Czech-first, agency-first UX**: make doing good feel *easy* and *real* (one small win at a time).

## What’s in this repo
- **SvelteKit app (primary UX)**: `akcelerator-landing-page/`
- **Streamlit app (legacy during migration)**: `streamlit-app/`

## Main routes (SvelteKit)
- **`/`**: landing page (stories + visuals)
- **`/app`**: start screen (Near / Online / Guided)
- **`/near`**: interactive map + real places (OpenStreetMap/Overpass)
- **`/api/nearby`**: cached Overpass proxy (server-side)

## Local development

### SvelteKit
```bash
cd akcelerator-landing-page
npm ci
npm run dev
```

### Streamlit (optional)
```bash
cd streamlit-app
pip install -r requirements.txt
streamlit run app.py
```

## Product spec
- `CONCEPT_V2.md`


