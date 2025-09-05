# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
- Add documentation review cadence and PR template
- Add `.env.example` with PUBLIC_* variables

## [2025-09-04]
### Added
- `PUBLIC_STREAMLIT_BASE_URL` support in landing integration (`streamlit-integration.js`)
- `.env.example` in `akcelerator-landing-page/`
- PR template enforcing doc and env checks
- `CONTRIBUTING.md` outlining documentation process and cadence
- `streamlit-app/.env.example` and `.streamlit/config.toml`
- Healthcheck via `?healthz=1` in `streamlit-app/app.py`
- SvelteKit `hooks.server.js` to set security headers

### Changed
- Supabase test API now uses `PUBLIC_SUPABASE_*` env vars
- `akcelerator-landing-page/VERCEL_PRODUCTION_SETUP.md` sanitized (no real keys/URLs)
- `DEPLOYMENT_INSTRUCTIONS.md` updated to use env-based Streamlit URL
- Root `README.md` env section expanded; fixed Supabase `client.js` path
- Streamlit embed uses `?embed=true` and base URL normalized
- Content-Security-Policy, Permissions-Policy, Referrer-Policy added in `vercel.json`
- Advanced headers added: HSTS, COEP, COOP, CORP, DNS-Prefetch, Download-Options, Permitted-Cross-Domain
- Mirrored advanced headers in `src/hooks.server.js`
- Added root `.gitignore` for env/venv
 - SvelteKit `kit.csp` configured in `svelte.config.js`

### Security
- Removed hardcoded Supabase anon key and project URL from docs
