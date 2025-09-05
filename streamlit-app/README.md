# 🌱 Akcelerátor Altruismu

A Czech/English altruistic guide that helps people move from feelings of helplessness to concrete altruistic action through a gentle, step-by-step journey.

## 🚀 Quick Start

### Windows
```cmd
run_app.cmd
```

### Manual
```bash
pip install -r requirements.txt
streamlit run app.py
```

### Environment

Create `.env` from example:

```bash
cp .env.example .env
```

Required variables:

```dotenv
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
# optional: SUPABASE_SERVICE_ROLE_KEY (server only)
```

## ✏️ Editing Content

**All user-facing text is centralized in `content.py`** - edit this file to change any text in the app.

```python
# Edit journey text, emotional responses, encouragement messages
JOURNEY_CONTENT = {
    'czech': { ... },
    'english': { ... }
}
```

## 🧭 User Journey

1. **Welcome** - Warm introduction to the journey
2. **Emotional Check** - "How do you feel?" with empathetic responses  
3. **Values Discovery** - Select areas that matter to you
4. **Action Selection** - Get a recommended action to take

## 🏗️ Architecture

- **Linear journey** - One step at a time, no overwhelming navigation
- **Emotionally sensitive** - Responses adapt to user's emotional state
- **Crisis support** - Always-available gentle help widget
- **Bilingual** - Czech and English support

## 📁 Project Structure

Data files live under `data/` and are loaded via robust relative paths. If files are missing, loaders use safe fallbacks and show gentle notices.

### Troubleshooting
- FileNotFoundError: ensure `data/czech/*.json` and `data/international/*.json` exist, or rely on fallbacks.
- Dependencies: `pip install -r requirements.txt` (Streamlit >= 1.34 required).
- Healthcheck: add `?healthz=1` to the app URL to return `{status: ok}`.

## 🎯 Design Philosophy

- **Emotionally warm but realistic** - No fake enthusiasm
- **Czech-first experience** - Authentic local language
- **Trust-building** - Transparent, no fake numbers
- **Gentle guidance** - Respects user's emotional journey

---

*Transforming feelings of helplessness into meaningful action, one gentle step at a time.* 💚 