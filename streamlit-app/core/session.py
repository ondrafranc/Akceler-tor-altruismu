"""Session state management"""

import streamlit as st
import uuid
from config.settings import DEFAULT_LANGUAGE

def initialize_session_state():
    """Initialize all session state variables"""
    
    # User identification
    if 'user_id' not in st.session_state:
        st.session_state.user_id = f"user_{uuid.uuid4().hex[:8]}"
    
    # Language and navigation
    if 'language' not in st.session_state:
        st.session_state.language = DEFAULT_LANGUAGE
    
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'welcome'
    
    # Assessment progress
    if 'assessment_step' not in st.session_state:
        st.session_state.assessment_step = 0
    
    if 'user_profile' not in st.session_state:
        st.session_state.user_profile = {}
    
    # Impact tracking
    if 'actions_completed' not in st.session_state:
        st.session_state.actions_completed = []
    
    if 'total_impact' not in st.session_state:
        st.session_state.total_impact = {'actions': 0, 'time': 0, 'money': 0}
    
    # Streak tracking
    if 'streak_count' not in st.session_state:
        st.session_state.streak_count = 0
    
    if 'last_action_date' not in st.session_state:
        st.session_state.last_action_date = None

    # Seasonal challenge placeholder (future feature)
    if 'seasonal_challenge' not in st.session_state:
        st.session_state.seasonal_challenge = None

    # Flag used to route directly to quick-actions when requested from CTA
    if 'quick_action_requested' not in st.session_state:
        st.session_state.quick_action_requested = False

# ---------------------------------------------------------------------------
# Convenience helpers for accessing & updating the in-memory "user_profile".
# The definitions below replace earlier duplicates and should be the ONLY
# implementations inside this module. Keep them lean and side-effect free.
# ---------------------------------------------------------------------------

def get_user_profile():
    """Return a dict with information collected about the current visitor."""
    return st.session_state.get('user_profile', {})

def update_user_profile(updates: dict):
    """Persist *updates* into the user profile stored in session state."""
    if 'user_profile' not in st.session_state:
        st.session_state.user_profile = {}
    st.session_state.user_profile.update(updates) 