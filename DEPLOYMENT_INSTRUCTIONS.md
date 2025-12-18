# 🚀 Deployment instructions

This repo is **SvelteKit-first** (Vercel). Streamlit is kept **only as legacy** during migration.

## 1) Deploy SvelteKit to Vercel

### Vercel settings
- **Root Directory**: `akcelerator-landing-page`
- **Framework**: SvelteKit
- **Build Command**: `npm run build`
- **Install Command**: default

### Environment variables (optional)
Set these in Vercel if you use Supabase feedback:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

### Smoke-check
- `/` loads
- `/app` loads
- `/near` map renders
- `/api/nearby?lat=50.0755&lon=14.4378&radius_m=1500&kinds=ngo,community` returns JSON

## 2) (Optional) Deploy Streamlit

If you still need the legacy Streamlit app:
- Main file: `streamlit-app/app.py`
- Requirements: `streamlit-app/requirements.txt`


