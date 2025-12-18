"""Streamlit styling: calm, landing-page-aligned, minimal overrides."""

import streamlit as st


def apply_styles() -> None:
    """Apply a calm, landing-page-aligned visual system.

    Important: keep overrides minimal (avoid heavy gradients/animations) to stay stable across Streamlit versions.
    """

    css = """
    <style>
      :root {
        --aa-bg: #F8FBF8;
        --aa-surface: #FFFFFF;
        --aa-surface-2: #F2F7F2;
        --aa-text: #1F2A1F;
        --aa-muted: #516051;
        --aa-border: rgba(44, 62, 45, 0.12);
        --aa-green: #2E5D31;
        --aa-focus: rgba(46, 93, 49, 0.25);
        --aa-radius: 14px;
        --aa-shadow: 0 10px 28px rgba(0,0,0,0.08);
      }

      /* App canvas */
      .stApp {
        background: var(--aa-bg);
        color: var(--aa-text);
      }

      /* Main layout */
      .main .block-container {
        max-width: 1120px;
        padding-top: 1.25rem;
        padding-bottom: 2.25rem;
      }

      /* Typography helpers used around the app */
      .main-header {
        font-size: clamp(2rem, 4vw, 2.6rem);
        color: var(--aa-green);
        text-align: center;
        margin: 0.25rem 0 0.75rem 0;
        font-weight: 750;
        line-height: 1.15;
        text-shadow: none;
      }
      .sub-header {
        font-size: clamp(1.05rem, 2.2vw, 1.2rem);
        color: var(--aa-muted);
        text-align: center;
        margin: 0 0 1.5rem 0;
        font-weight: 450;
        line-height: 1.55;
      }
      .section-header {
        font-size: clamp(1.25rem, 2.6vw, 1.55rem);
        color: var(--aa-green);
        margin: 1.25rem 0 0.75rem 0;
        font-weight: 650;
        border-bottom: 1px solid var(--aa-border);
        padding-bottom: 0.4rem;
      }

      /* Card primitives */
      .cause-card,
      .action-card,
      .cta-section,
      .metric-card {
        background: var(--aa-surface);
        border: 1px solid var(--aa-border);
        border-radius: var(--aa-radius);
        box-shadow: var(--aa-shadow);
      }
      .cause-card { padding: 1.25rem; margin: 0.9rem 0; }
      .action-card { padding: 1.1rem; margin: 0.75rem 0; }
      .cta-section { padding: 1.25rem; margin: 1.25rem 0; text-align: left; }
      .metric-card { padding: 1.1rem; margin: 0.75rem 0; text-align: center; }

      /* Form controls */
      .stSelectbox > div > div,
      .stMultiSelect > div > div,
      .stTextInput input,
      .stTextArea textarea {
        border-radius: 10px !important;
        border: 1px solid var(--aa-border) !important;
        background: var(--aa-surface) !important;
      }

      /* Focus */
      .stButton > button:focus-visible,
      .stSelectbox > div > div:focus-visible,
      .stMultiSelect > div > div:focus-visible,
      .stTextInput input:focus-visible,
      .stTextArea textarea:focus-visible {
        outline: 3px solid var(--aa-focus) !important;
        outline-offset: 2px !important;
      }

      /* Keep Streamlit button theming, only soften radius */
      .stButton > button {
        border-radius: 12px !important;
        font-weight: 650 !important;
        box-shadow: none !important;
        transition: none !important;
      }

      /* Metric containers (light touch; avoids gradients) */
      div[data-testid="stMetric"] {
        background: var(--aa-surface);
        border: 1px solid var(--aa-border);
        border-radius: var(--aa-radius);
        padding: 0.85rem 0.9rem;
        box-shadow: var(--aa-shadow);
      }

      /* Mobile */
      @media (max-width: 768px) {
        .main .block-container { padding-top: 1rem; }
        .stButton > button { min-height: 44px !important; }
      }
    </style>
    """

    st.markdown(css, unsafe_allow_html=True)


