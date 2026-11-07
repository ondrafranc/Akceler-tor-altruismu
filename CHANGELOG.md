# Changelog

## [Unreleased]
### Added
- Unified Czech dataset & recommendation engine (`src/lib/data/czech-actions.js`) migrating the best curated micro-actions, value taxonomy, encouragement messages, and fallback places into SvelteKit
- Smart Guided Experience (`/app/guided`): 3-step selection (values, energy/time, budget) that recommends the #1 concrete action with explainable badges, *"🔄 Zkusit jiný tip"* rotation, and pre-filtered `/near` map links
- Expanded Online Micro-Actions catalog (`/app/online`): 12+ concrete Czech micro-actions with 1-click filters (5 min, 0 Kč, z gauče, online dobrovolnictví, darování)
- Calm "Small Win" celebration & energy protection flow (`SmallWinCelebration.svelte`, `src/lib/progress.js`) with local progress counter and explicit *"🌿 Pro dnešek stačí"* permission to rest
- First-contact assistant (*"💬 Co jim napsat?"*) on `/near` place cards with copyable Czech templates and pre-filled `mailto:` links
- Overpass API resilience in `/api/nearby` (3 endpoints, 12s timeout per endpoint, and curated Czech fallback places when Overpass is overloaded)
- 1-click category presets and mobile view switcher (Map + List / List only / Map only) on `/near`
- SvelteKit app entry flow: `/app` (Near / Online / Guided)
- Near-you map: `/near`
- Cached Overpass proxy: `/api/nearby`

### Changed
- `ImmediateHelp.svelte` crisis help banner moved to global `+layout.svelte` so it is always visible across `/`, `/app/*`, `/near`, and `/submit`
- Cleaned all Czech volunteering portal links (removed `/en/` paths and `?utm_source=openai` parameters)
- Fixed Supabase `feedback` column compatibility (`text` vs `feedback_text`) in `/api/test-supabase`
- Landing CTAs now route into the SvelteKit app (no Streamlit embed)
- Permissions-Policy updated to allow geolocation for map UX

### Removed
- Unused heavy npm dependencies (`three`, `p5`) from `akcelerator-landing-page/package.json`
- Obsolete legacy folders (`legacy/`, old root `src/`)
- Obsolete docs and Streamlit embed/test route (`/test`)
- Generated artifacts now ignored (`.svelte-kit/`, `.vercel/`, etc.)



