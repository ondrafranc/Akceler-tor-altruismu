# 🇨🇿 Akcelerator altruismu (SvelteKit)

This package is the **primary UX** (landing + app) built in **SvelteKit**.

## Key routes
- **`/`**: landing page (stories + visuals)
- **`/app`**: start screen (Near / Online / Guided)
- **`/near`**: interactive map + real places (OpenStreetMap/Overpass)
- **`/api/nearby`**: cached Overpass proxy (server-side)

## Local dev
```bash
cd akcelerator-landing-page
npm ci
npm run dev
```

## Deployment (Vercel)
- Root directory: `akcelerator-landing-page`
- Build: `npm run build`
- Optional env vars:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`

## Legacy
`../streamlit-app/` is kept temporarily during migration, but **is no longer the primary UI**.


