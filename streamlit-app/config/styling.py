"""Enhanced CSS styles with comprehensive accessibility and visual improvements"""

import streamlit as st

def apply_styles():
    """Apply enhanced CSS styling with accessibility and comprehensive visual improvements"""
    
    css = """
    <style>
<<<<<<< Current (Your changes)
        /* Enhanced Typography Hierarchy with Accessibility */
        .main-header {
            font-size: clamp(2rem, 5vw, 2.8rem);
            color: #2E5D31;
            text-align: center;
            margin-bottom: 1.5rem;
            font-weight: 700;
            line-height: 1.2;
            text-shadow: 0 2px 4px rgba(46, 93, 49, 0.1);
            animation: fadeInDown 0.6s ease-out;
        }
        .sub-header {
            font-size: clamp(1.1rem, 3vw, 1.3rem);
            color: #5A6B5A;
            text-align: center;
            margin-bottom: 2.5rem;
            font-style: normal;
            font-weight: 400;
            line-height: 1.5;
            animation: fadeIn 0.8s ease-out 0.2s both;
        }
        .section-header {
            font-size: clamp(1.4rem, 4vw, 1.8rem);
            color: #2E5D31;
            margin-bottom: 1.5rem;
            font-weight: 600;
            border-bottom: 2px solid #A8D5A8;
            padding-bottom: 0.5rem;
        }
        
        /* Accessibility Modes */
        .large-text {
            font-size: 1.2em !important;
        }
        .large-text .main-header {
            font-size: clamp(2.4rem, 6vw, 3.4rem) !important;
        }
        .large-text .sub-header {
            font-size: clamp(1.3rem, 4vw, 1.6rem) !important;
        }
        .large-text .section-header {
            font-size: clamp(1.7rem, 5vw, 2.2rem) !important;
        }
        
        .simple-mode {
            line-height: 1.8 !important;
        }
        .simple-mode .cause-card,
        .simple-mode .action-card {
            border: 2px solid #7AB87A !important;
            box-shadow: none !important;
            background: #FAFBFA !important;
        }
        .simple-mode .main-header {
            animation: none !important;
        }
        
        .high-contrast {
            filter: contrast(1.5);
        }
        .high-contrast .cause-card,
        .high-contrast .action-card {
            border: 3px solid #2E5D31 !important;
            background: #FFFFFF !important;
        }
        
        /* Enhanced Navigation with Visual Highlighting */
        .stRadio > div > label {
            padding: 0.75rem 1rem !important;
            border-radius: 8px !important;
            border: 2px solid #C4E4C4 !important;
            background: #FAFBFA !important;
            transition: all 0.3s ease !important;
            cursor: pointer !important;
            margin: 0.25rem 0 !important;
            display: block !important;
            position: relative !important;
        }
        .stRadio > div > label:hover {
            background: #F0F8F0 !important;
            border-color: #9BC89B !important;
            transform: translateX(4px) !important;
        }
        .stRadio > div > label[data-checked="true"] {
            background: linear-gradient(135deg, #7AB87A 0%, #5A9B5A 100%) !important;
            color: white !important;
            border-color: #2E5D31 !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 8px rgba(122, 184, 122, 0.3) !important;
        }
        .stRadio > div > label[data-checked="true"]::before {
            content: "▶ ";
            font-weight: bold;
        }
        
        /* Enhanced Focus States for Keyboard Navigation */
        .stButton > button:focus,
        .stRadio > div > label:focus,
        .stSelectbox > div > div:focus,
        .stMultiSelect > div > div:focus,
        .stTextArea > div > div > textarea:focus,
        .stTextInput > div > div > input:focus {
            outline: 3px solid rgba(122, 184, 122, 0.6) !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 6px rgba(122, 184, 122, 0.2) !important;
        }
        
        /* Enhanced Card System with better alignment */
        .cause-card {
            border: 1px solid #D8E5D8;
            border-radius: 14px;
            padding: 1.5rem;
            margin: 1.25rem 0;
            background: #F8FAF7;
            box-shadow: 0 6px 18px rgba(0,0,0,0.06);
            transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
        }
        .cause-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 24px rgba(0,0,0,0.08);
            border-color: #C7D9C7;
            background: #FFFFFF;
        }
        .cause-card:focus-within {
            outline: 2px solid #7AB87A !important;
            outline-offset: 2px !important;
        }
        
        .action-card {
            border: 1px solid #DFE8DF;
            border-radius: 12px;
            padding: 1.25rem;
            margin: 0.9rem 0;
            background: #FDFEFC;
            transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease;
            box-shadow: 0 3px 10px rgba(0,0,0,0.05);
            border-left: 4px solid transparent;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
        }
        .action-card:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.08);
            border-color: #C9DCC9;
            border-left-color: #6EA86E;
            background: #FFFFFF;
        }
        .action-card:focus-within {
            outline: 2px solid #7AB87A !important;
            outline-offset: 2px !important;
        }
        
        /* Enhanced Button System with Better Accessibility */
        .stButton > button {
            background: #2E5D31 !important;
            color: white !important;
            border: none !important;
            border-radius: 12px !important;
            padding: 0.75rem 1.25rem !important;
            font-weight: 600 !important;
            font-size: 0.95rem !important;
            transition: background 0.2s ease, box-shadow 0.2s ease !important;
            box-shadow: 0 4px 10px rgba(46, 93, 49, 0.18) !important;
            text-transform: none !important;
            letter-spacing: 0.01em !important;
            width: 100% !important;
            margin: 0.25rem 0 !important;
            position: relative !important;
        }
        .stButton > button:hover {
            box-shadow: 0 6px 14px rgba(46, 93, 49, 0.22) !important;
            background: #264C28 !important;
        }
        .stButton > button:active {
            box-shadow: 0 3px 8px rgba(46, 93, 49, 0.2) !important;
        }
        .stButton > button:disabled {
            opacity: 0.6 !important;
            cursor: not-allowed !important;
            transform: none !important;
        }
        
        /* Special button states */
        .stButton > button[data-testid*="primary"] {
            background: linear-gradient(135deg, #2E5D31 0%, #1E4D21 100%) !important;
            box-shadow: 0 4px 8px rgba(46, 93, 49, 0.4) !important;
        }
        .stButton > button[data-testid*="primary"]:hover {
            background: linear-gradient(135deg, #3E6D41 0%, #2E5D31 100%) !important;
            box-shadow: 0 6px 15px rgba(46, 93, 49, 0.5) !important;
        }
        
        /* Enhanced CTA section */
        .cta-section {
            background: linear-gradient(135deg, #F5F8F5 0%, #EBF2EB 100%);
            border-radius: 16px;
            padding: 2rem;
            margin: 2rem 0;
            text-align: center;
            border: 1px solid #D4E7D4;
            box-shadow: 0 4px 8px rgba(0,0,0,0.06);
            position: relative;
        }
        
        /* Action grid with better alignment */
        .action-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
            align-items: stretch;
        }
        
        /* Quote box positioned correctly */
        .quote-box {
            background: linear-gradient(135deg, #F5F8F5 0%, #EDF2ED 100%);
            border-left: 3px solid #7AB87A;
            padding: 1.5rem;
            margin: 2rem auto;
            font-style: italic;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            max-width: 600px;
            text-align: center;
            font-size: 1.1rem;
            line-height: 1.6;
            position: relative;
        }
        .quote-box::before {
            content: '"';
            font-size: 3rem;
            color: #7AB87A;
            position: absolute;
            top: -10px;
            left: 15px;
            line-height: 1;
        }
        
        /* POC disclaimer badge with better positioning */
        .poc-badge {
            position: fixed;
            bottom: 80px;
            left: 20px;
            background: rgba(122, 184, 122, 0.9);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            z-index: 1000;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        .poc-badge:hover {
            transform: scale(1.05);
            background: rgba(122, 184, 122, 1);
        }
        
        /* Gentle emergency help widget */
        .emergency-help-gentle {
            position: fixed;
            bottom: 16px;
            right: 16px;
            background: #FFFFFF;
            color: #2E5D31;
            padding: 0.85rem 1rem;
            border-radius: 12px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 8px 22px rgba(0, 0, 0, 0.10);
            max-width: 260px;
            transition: box-shadow 0.2s ease, transform 0.2s ease;
            border: 1px solid #E3E8E3;
            backdrop-filter: blur(6px);
        }
        .emergency-help-gentle:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 26px rgba(0, 0, 0, 0.12);
        }
        .emergency-help-gentle a {
            color: #2E5D31 !important;
            transition: color 0.15s ease !important;
        }
        .emergency-help-gentle a:hover {
            color: #1E4D21 !important;
            border-bottom-color: #2E5D31 !important;
        }
        
        /* Progress text styling */
        .progress-text {
            font-size: 0.9rem;
            color: #4A5E4A;
            text-align: center;
            font-weight: 500;
            margin: 1rem 0;
        }
        
        /* Enhanced celebration messages */
        .celebration {
            background: linear-gradient(45deg, #7AB87A, #9BC89B);
            color: white;
            padding: 1.2rem;
            border-radius: 10px;
            text-align: center;
            font-weight: 600;
            animation: gentleGlow 1.5s ease-in-out;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            margin: 1rem 0;
            position: relative;
        }
        .celebration::before {
            content: "🎉";
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 1.5rem;
        }
        
        @keyframes gentleGlow {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        
        .quiet-celebration {
            background: linear-gradient(135deg, #E8F5E8 0%, #D4E7D4 100%);
            color: #2E5D31;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            font-weight: 500;
            border-left: 4px solid #7AB87A;
            margin: 1rem 0;
            position: relative;
        }
        .quiet-celebration::before {
            content: "✨";
            position: absolute;
            top: 8px;
            left: 8px;
        }
        
        /* Enhanced impact metrics */
        .impact-metric {
            text-align: center;
            padding: 1.2rem;
            background: linear-gradient(135deg, #F0F8F0 0%, #E8F2E8 100%);
            border-radius: 12px;
            margin: 0.5rem 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            border: 1px solid #D4E7D4;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            transition: all 0.3s ease;
        }
        .impact-metric:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.12);
        }
        
        /* Enhanced success story cards */
        .success-story {
            background: linear-gradient(135deg, #F8FBF8 0%, #F0F6F0 100%);
            border-radius: 10px;
            padding: 1.2rem;
            margin: 1rem 0;
            border: 1px solid #E0EBE0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            height: 100%;
            position: relative;
        }
        .success-story::before {
            content: "💡";
            position: absolute;
            top: 12px;
            right: 12px;
            font-size: 1.2rem;
        }
        
        /* Enhanced streak indicator */
        .streak-indicator {
            background: linear-gradient(45deg, #FF6B35, #F7931E);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            display: inline-block;
            margin: 0.2rem;
            box-shadow: 0 2px 4px rgba(255, 107, 53, 0.3);
            animation: pulseGlow 2s infinite;
        }
        @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 2px 4px rgba(255, 107, 53, 0.3); }
            50% { box-shadow: 0 4px 8px rgba(255, 107, 53, 0.5); }
        }
        
        /* Enhanced Layout System */
        .content-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem 2rem;
        }
        .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
            align-items: stretch;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
            align-items: stretch;
        }
        
        /* Enhanced form styling */
        .stSelectbox > div > div {
            border-radius: 8px !important;
            border: 2px solid #C4E4C4 !important;
            transition: all 0.3s ease !important;
        }
        .stSelectbox > div > div:focus-within {
            border-color: #7AB87A !important;
            box-shadow: 0 0 0 3px rgba(122, 184, 122, 0.1) !important;
        }
        
        /* Enhanced multiselect */
        .stMultiSelect > div > div {
            border-radius: 8px !important;
            border: 2px solid #C4E4C4 !important;
        }
        .stMultiSelect > div > div:focus-within {
            border-color: #7AB87A !important;
            box-shadow: 0 0 0 3px rgba(122, 184, 122, 0.1) !important;
        }
        
        /* Enhanced text inputs */
        .stTextArea > div > div > textarea,
        .stTextInput > div > div > input {
            border-radius: 8px !important;
            border: 2px solid #C4E4C4 !important;
            transition: all 0.3s ease !important;
        }
        .stTextArea > div > div > textarea:focus,
        .stTextInput > div > div > input:focus {
            border-color: #7AB87A !important;
        }
        
        /* Enhanced progress bars styling */
        .stProgress > div > div {
            background: linear-gradient(90deg, #7AB87A 0%, #5A9B5A 100%) !important;
            border-radius: 10px !important;
            height: 8px !important;
        }
        .stProgress > div {
            background-color: #E0EBE0 !important;
            border-radius: 10px !important;
            height: 8px !important;
        }
        
        /* Enhanced expander styling */
        .streamlit-expanderHeader {
            background: linear-gradient(135deg, #F5F8F5 0%, #EBF2EB 100%) !important;
            border-radius: 8px !important;
            border: 1px solid #D4E7D4 !important;
            transition: all 0.3s ease !important;
        }
        .streamlit-expanderHeader:hover {
            background: linear-gradient(135deg, #F0F8F0 0%, #E8F2E8 100%) !important;
            border-color: #9BC89B !important;
        }
        
        /* Toast notifications styling */
        .stToast {
            background: linear-gradient(135deg, #7AB87A 0%, #5A9B5A 100%) !important;
            color: white !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(122, 184, 122, 0.3) !important;
        }
        
        /* Screen reader only content */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        
        /* Skip to content link */
        .skip-link {
            position: absolute;
            top: -40px;
            left: 6px;
            background: #2E5D31;
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 1001;
        }
        .skip-link:focus {
            top: 6px;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .content-container {
                padding: 1rem;
            }
            .main-header {
                font-size: 1.8rem !important;
                margin-bottom: 1rem !important;
            }
            .sub-header {
                font-size: 1rem !important;
                margin-bottom: 1.5rem !important;
            }
            .cause-card, .action-card {
                padding: 1rem !important;
                margin: 0.75rem 0 !important;
            }
            .card-grid, .action-grid {
                grid-template-columns: 1fr !important;
                gap: 1rem !important;
            }
            .stats-grid {
                grid-template-columns: 1fr !important;
                gap: 0.75rem !important;
            }
            .poc-badge {
                bottom: 80px !important;
                left: 10px !important;
                font-size: 0.7rem !important;
            }
            .emergency-help-gentle {
                bottom: 10px !important;
                right: 10px !important;
                max-width: 250px !important;
                padding: 0.75rem !important;
                font-size: 0.8rem !important;
            }
            
            /* Mobile-specific accessibility improvements */
            .stButton > button {
                min-height: 44px !important;
                font-size: 1rem !important;
            }
            .stRadio > div > label {
                min-height: 44px !important;
                padding: 1rem !important;
            }
        }
        
        /* High contrast mode improvements */
        @media (prefers-contrast: high) {
            .cause-card, .action-card {
                border: 3px solid #2E5D31 !important;
                background: #FFFFFF !important;
            }
            .stButton > button {
                border: 2px solid #2E5D31 !important;
            }
            .emergency-help {
                border: 3px solid #FFFFFF !important;
            }
        }
        
        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
            .main-header, .sub-header, .celebration {
                animation: none !important;
            }
            .cause-card:hover, .action-card:hover, .stButton > button:hover {
                transform: none !important;
            }
            .streak-indicator {
                animation: none !important;
            }
        }
        
        /* Enhanced Accessibility */
        .stButton > button:focus-visible,
        .stRadio > div > label:focus-visible {
            outline: 3px solid rgba(122, 184, 122, 0.8) !important;
            outline-offset: 2px !important;
        }
        
        /* Animation keyframes */
        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
=======
      :root {
        --aa-bg: #F8FBF8;
        --aa-surface: #FFFFFF;
        --aa-surface-2: #F2F7F2;
        --aa-text: #1F2A1F;
        --aa-muted: #516051;
        --aa-border: rgba(44, 62, 45, 0.12);
        --aa-green: #2E5D31;
        --aa-focus: rgba(62, 122, 67, 0.35);
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

      /* Card primitives (for the class-based cards) */
      .cause-card,
      .action-card,
      .cta-section {
        background: var(--aa-surface);
        border: 1px solid var(--aa-border);
        border-radius: var(--aa-radius);
        box-shadow: var(--aa-shadow);
      }
      .cause-card { padding: 1.25rem; margin: 0.9rem 0; }
      .action-card { padding: 1.1rem; margin: 0.75rem 0; }
      .cta-section { padding: 1.25rem; margin: 1.25rem 0; text-align: left; }

      /* Form controls: subtle borders */
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

      /* Reduce “button on button” feeling: keep Streamlit defaults, only soften radius */
      .stButton > button {
        border-radius: 12px !important;
        font-weight: 650 !important;
        box-shadow: none !important;
        transition: none !important;
      }

      /* Mobile */
      @media (max-width: 768px) {
        .main .block-container { padding-top: 1rem; }
        .stButton > button { min-height: 44px !important; }
      }
>>>>>>> Incoming (Background Agent changes)
    </style>
    """

    st.markdown(css, unsafe_allow_html=True)