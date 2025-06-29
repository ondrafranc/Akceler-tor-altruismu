"""
Akcelerátor altruismu - Hlavní vstupní bod
Jemný průvodce transformací empatie v konkrétní akce
"""

import streamlit as st
from config.settings import configure_page
from config.styling import apply_styles
from core.session import initialize_session_state
from core.journey import show_journey_flow
from components.emergency_help import render_gentle_crisis_support

def main():
    """Hlavní vstupní bod aplikace - lineární cesta pomoci"""
    
    # Konfigurace stránky
    configure_page()
    
    # Aplikace stylů
    apply_styles()
    
    # Inicializace session state
    initialize_session_state()
    
    # Skrytí všech Streamlit elementů
    _hide_streamlit_elements()
    
    # Hlavní lineární tok
    show_journey_flow()
    
    # Jemná krizová podpora (vždy přístupná)
    language = st.session_state.get('language', 'czech')
    render_gentle_crisis_support(language)

def _hide_streamlit_elements():
    """Skrytí všech nepotřebných Streamlit elementů"""
    st.markdown("""
    <style>
        /* Skrytí všech Streamlit menu a elementů */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        .stDeployButton {display: none;}
        
        /* Skrytí sidebar úplně */
        .css-1d391kg {display: none !important;}
        .css-1cypcdb {display: none !important;}
        .css-17eq0hr {display: none !important;}
        section[data-testid="stSidebar"] {display: none !important;}
        .stSidebar {display: none !important;}
        
        /* Maximální využití prostoru */
        .main .block-container {
            padding-top: 1rem !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            max-width: 100% !important;
        }
        
        /* Skrytí "Manage app" a podobných */
        .css-1v0mbdj {display: none !important;}
        .css-1rs6os {display: none !important;}
        .css-1vq4p4l {display: none !important;}
    </style>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main() 