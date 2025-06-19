"""Enhanced CSS styles with comprehensive accessibility and visual improvements"""

import streamlit as st

def apply_styles():
    """Apply enhanced CSS styling with accessibility and comprehensive visual improvements"""
    
    css = """
    <style>
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
            border: 1px solid #A8D5A8;
            border-radius: 16px;
            padding: 2rem;
            margin: 1.5rem 0;
            background: linear-gradient(135deg, #F8FDF8 0%, #F0F8F0 100%);
            box-shadow: 0 4px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-top: 3px solid transparent;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
        }
        .cause-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.08);
            border-color: #7AB87A;
            border-top-color: #7AB87A;
            background: linear-gradient(135deg, #F9FEF9 0%, #F2F9F2 100%);
        }
        .cause-card:focus-within {
            outline: 2px solid #7AB87A !important;
            outline-offset: 2px !important;
        }
        
        .action-card {
            border: 1px solid #C4E4C4;
            border-radius: 12px;
            padding: 1.5rem;
            margin: 1rem 0;
            background: linear-gradient(135deg, #FAFBFA 0%, #F5F7F5 100%);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
            border-left: 4px solid transparent;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
        }
        .action-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
            border-color: #9BC89B;
            border-left-color: #7AB87A;
            background: linear-gradient(135deg, #FBFCFB 0%, #F6F8F6 100%);
        }
        .action-card:focus-within {
            outline: 2px solid #7AB87A !important;
            outline-offset: 2px !important;
        }
        
        /* Enhanced Button System with Better Accessibility */
        .stButton > button {
            background: linear-gradient(135deg, #7AB87A 0%, #5A9B5A 100%) !important;
            color: white !important;
            border: none !important;
            border-radius: 10px !important;
            padding: 0.75rem 1.5rem !important;
            font-weight: 600 !important;
            font-size: 0.95rem !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 0 3px 6px rgba(122, 184, 122, 0.3) !important;
            text-transform: none !important;
            letter-spacing: 0.01em !important;
            width: 100% !important;
            margin: 0.25rem 0 !important;
            position: relative !important;
        }
        .stButton > button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 12px rgba(122, 184, 122, 0.4) !important;
            background: linear-gradient(135deg, #8BC88B 0%, #6BAC6B 100%) !important;
        }
        .stButton > button:active {
            transform: translateY(0) !important;
            box-shadow: 0 2px 4px rgba(122, 184, 122, 0.3) !important;
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
        
        /* Enhanced emergency help widget */
        .emergency-help {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #FF6B6B 0%, #E55555 100%);
            color: white;
            padding: 1rem;
            border-radius: 12px;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
            max-width: 280px;
            transition: all 0.3s ease;
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .emergency-help:hover {
            transform: scale(1.02);
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
        }
        .emergency-help a {
            color: white !important;
            text-decoration: underline !important;
        }
        .emergency-help a:hover {
            color: #ffeeee !important;
        }
        .emergency-help details summary {
            margin-bottom: 8px;
        }
        .emergency-help details[open] summary {
            margin-bottom: 12px;
            color: #ffdddd;
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
            .emergency-help {
                bottom: 10px !important;
                right: 10px !important;
                max-width: 200px !important;
                padding: 0.75rem !important;
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
    </style>
    """
    
    st.markdown(css, unsafe_allow_html=True) 