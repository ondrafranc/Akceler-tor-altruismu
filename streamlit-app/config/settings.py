"""Application settings and configuration"""

import streamlit as st

def configure_page():
    """Configure Streamlit page settings"""
    st.set_page_config(
        page_title="Akcelerátor altruismu - Proměňte pocit bezmoci v laskavé činy",
        page_icon="💚",
        layout="wide",
        initial_sidebar_state="collapsed"
    )

# Application constants
DEFAULT_LANGUAGE = 'czech'
DEFAULT_PORT = 8501

# Emergency contact information
EMERGENCY_CONTACTS = {
    'czech': {
        'safety_line': '116 111',
        'crisis_intervention': '284 016 666'
    },
    'english': {
        'safety_line': '116 111',
        'crisis_intervention': '284 016 666'
    }
}

# Real Czech organizations
CZECH_ORGANIZATIONS = {
    'tree_planting': 'https://www.sazimebudoucnost.cz/daruj',
    'book_donations': 'https://www.knihobudky.cz/mapa',
    'senior_letters': 'https://www.dopisy-seniorum.cz',
    'homeless_support': 'https://www.nadeje.cz/daruj-jidlo',
    'online_tutoring': 'https://www.ucimeonline.cz/dobrovolnik',
    'animal_shelter': 'https://www.utulekpraha.cz/pomoc'
} 