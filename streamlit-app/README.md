# 🌱 Streamlit app (legacy)

This Streamlit app remains in the repo **temporarily** while we migrate the full UX into SvelteKit (`akcelerator-landing-page/`).

## Run locally
```bash
pip install -r requirements.txt
streamlit run app.py
```

## Notes
- The main UX is now **SvelteKit-first** (`/app`, `/near`).
- Healthcheck: add `?healthz=1` to the Streamlit URL to return `{status: ok}`.