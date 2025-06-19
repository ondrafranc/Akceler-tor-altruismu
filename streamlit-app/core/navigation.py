"""Main navigation and page routing"""

import streamlit as st
import random
from utils.localization import get_text
from logic.encouragement import get_random_encouragement, get_seasonal_message
from pages.welcome import show_welcome_page
from pages.assessment import show_assessment_page
from pages.quick_actions import show_quick_actions_page
from pages.impact import show_impact_page
from pages.causes import show_causes_page
from components.emergency_help import render_emergency_widget

def main_navigation():
    """Main navigation with simplified, emotionally clear sidebar and always-on crisis widget."""
    language = st.session_state.get('language', 'czech')

    # Sidebar: navigation, encouragement, language switch, user stats
    with st.sidebar:
        st.markdown(f"# {get_text('title', language)}")
        st.markdown(f"*{get_text('subtitle', language)}*")

        # Language switch
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🇨🇿 Čeština", key="lang_cz_sidebar"):
                st.session_state.language = 'czech'
                st.rerun()
        with col2:
            if st.button("🇺🇸 English", key="lang_en_sidebar"):
                st.session_state.language = 'english'
                st.rerun()

        # User stats (if any actions)
        if st.session_state.total_impact['actions'] > 0:
            st.markdown(f"### 📊 {get_text('my_impact', language)}")
            st.metric(get_text('actions_taken', language), st.session_state.total_impact['actions'])
            if st.session_state.streak_count > 1:
                streak_text = f"🔥 {st.session_state.streak_count} akcí v řadě" if language == 'czech' else f"🔥 {st.session_state.streak_count} day streak"
                st.markdown(f"<span class='streak-indicator'>{streak_text}</span>", unsafe_allow_html=True)

        # Contextual encouragement (only one at a time)
        encouragement = None
        if st.session_state.total_impact['actions'] == 0:
            encouragement = get_random_encouragement("welcome_messages", language)
        elif st.session_state.total_impact['actions'] < 3:
            encouragement = get_random_encouragement("progress_encouragement", language)
        else:
            encouragement = get_random_encouragement("progress_encouragement", language)
        if encouragement:
            st.info(f"💚 {encouragement}")

        # Seasonal message (occasionally)
        seasonal_msg = get_seasonal_message(language)
        if seasonal_msg and random.random() < 0.25:
            st.markdown(f'<div style="font-style: italic; padding: 8px; background-color: #f0fff0; border-radius: 5px; margin: 10px 0;"><small>🌿 {seasonal_msg}</small></div>', unsafe_allow_html=True)

        st.markdown("---")
        st.markdown("### 🧭 Navigace" if language == 'czech' else "### 🧭 Navigation")
        pages = {
            f"🧭 {get_text('find_path', language)}": 'assessment',
            f"⚡ {get_text('quick_actions', language)}": 'quick_actions',
            f"📊 {get_text('my_impact', language)}": 'impact',
            f"🌍 {get_text('explore_causes', language)}": 'causes',
        }
        current_page = st.session_state.get('current_page', 'assessment')
        selected_page = st.radio(
            "",
            list(pages.keys()),
            index=list(pages.values()).index(current_page) if current_page in pages.values() else 0,
            label_visibility="collapsed"
        )
        st.session_state.current_page = pages[selected_page]

    # Main content area
    if st.session_state.current_page == 'assessment':
        show_assessment_page()
    elif st.session_state.current_page == 'quick_actions':
        show_quick_actions_page()
    elif st.session_state.current_page == 'impact':
        show_impact_page()
    elif st.session_state.current_page == 'causes':
        show_causes_page()
    else:
        show_assessment_page()

    # Always-on crisis widget (bottom right)
    render_emergency_widget(language) 