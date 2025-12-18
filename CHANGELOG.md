# Changelog

## [Unreleased]
### Added
- SvelteKit app entry flow: `/app` (Near / Online / Guided)
- Near-you map: `/near`
- Cached Overpass proxy: `/api/nearby`

### Changed
- Landing CTAs now route into the SvelteKit app (no Streamlit embed)
- Permissions-Policy updated to allow geolocation for map UX

### Removed
- Obsolete legacy folders (`legacy/`, old root `src/`)
- Obsolete docs and Streamlit embed/test route (`/test`)
- Generated artifacts now ignored (`.svelte-kit/`, `.vercel/`, etc.)


