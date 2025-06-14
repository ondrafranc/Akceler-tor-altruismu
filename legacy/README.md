# Legacy Files Archive

This folder contains historical development files that are no longer part of the active codebase but may be valuable for reference.

## Contents

### Streamlit Prototypes (Pre-SvelteKit)
- `app.py` - Original Streamlit prototype
- `app_enhanced.py` - Enhanced version with animations
- `app_czech_enhanced.py` - Czech-localized version
- `run_demo.py` - Demo script for running prototypes

### Legacy Data Structure
- `data/` - Original data folder structure used by Streamlit prototypes
  - `causes/` - Original cause definitions
  - `content/` - Encouragement messages
  - `czech/` - Czech translations
  - `international/` - International content
  - `users/` - User profile structure

### Planning Documents
- `PHASE_2_COMPLETION_SUMMARY.md` - Historical completion notes
- `PHASE_3_CZECH_ROADMAP.md` - Czech implementation roadmap (completed)
- `decision_tree.md` - Original decision tree logic design
- `data_architecture.md` - File-based data architecture (replaced by Supabase)
- `ai_personalization.md` - AI personalization system design (future feature)
- `ui_design.md` - Streamlit UI design documentation

### Build Scripts
- `build.cmd` - Windows build script for Streamlit
- `build.sh` - Unix build script for Streamlit

## Current Architecture (Live)

The current live system uses:
- **Frontend**: SvelteKit deployed on Vercel
- **Backend**: Streamlit for deep recommendation engine
- **Database**: Supabase for feedback storage
- **Analytics**: Vercel Analytics for page views
- **Features**: Interactive Story Garden, Anonymous Feedback Modal, Seasonal Theming

## Why These Files Are Archived

These files represent the evolution of the project from prototype to production:

1. **Streamlit Prototypes**: The original app was built entirely in Streamlit. While functional, it was replaced with SvelteKit for better UX, mobile responsiveness, and deployment flexibility.

2. **File-Based Data**: The original architecture used JSON files for data storage. This was replaced with Supabase for the feedback system, while maintaining JSON for static content.

3. **Planning Documents**: These contain detailed system designs that were either implemented differently or represent future features not yet built.

## Accessing Legacy Features

If you need to reference the original Streamlit prototypes:
1. Install requirements: `pip install -r ../requirements.txt`  
2. Run prototype: `streamlit run app_czech_enhanced.py`
3. Note: Legacy data paths may need adjustment

## Migration Notes

Key changes from legacy to current system:
- UI framework: Streamlit → SvelteKit
- Deployment: Local/manual → GitHub/Vercel  
- Styling: Streamlit components → Custom CSS/GSAP
- Data: File operations → Supabase integration
- Features: Decision tree → Story garden + feedback system 