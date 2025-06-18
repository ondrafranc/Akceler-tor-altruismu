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

def main_navigation():
    """Enhanced main function with improved navigation flow"""
    
    # Language selector in header
    col1, col2, col3 = st.columns([7, 1.5, 1.5])
    with col2:
        if st.button("🇨🇿 Čeština", help="Přepnout na češtinu", key="lang_cz"):
            st.session_state.language = 'czech'
            st.rerun()
    with col3:
        if st.button("🇺🇸 English", help="Switch to English", key="lang_en"):
            st.session_state.language = 'english'
            st.rerun()
    
    language = st.session_state.language
    
    # Add a subtle divider
    st.markdown("---")
    
    # Handle quick action request automatically
    if st.session_state.get('quick_action_requested', False):
        # Clear the request flag and show quick actions
        st.session_state.quick_action_requested = False
        st.session_state.current_page = 'quick_actions'
    
    # Enhanced Sidebar with simplified styling
    _render_sidebar(language)
    
    # Show selected page based on current_page state
    current_page = st.session_state.get('current_page', 'welcome')
    
    if current_page == 'welcome':
        show_welcome_page()
    elif current_page == 'assessment':
        show_assessment_page()
    elif current_page == 'quick_actions':
        show_quick_actions_page()
    elif current_page == 'impact':
        show_impact_page()
    elif current_page == 'causes':
        show_causes_page()
    else:
        # Fallback to welcome page
        show_welcome_page()

def _render_sidebar(language):
    """Render the navigation sidebar"""
    
    with st.sidebar:
        # Simplified title
        st.markdown(f"## {get_text('title', language)}")
        st.markdown(f"*{get_text('subtitle', language)}*")
        
        # Enhanced user stats - simplified
        if st.session_state.total_impact['actions'] > 0:
            st.markdown(f"### 📊 {get_text('my_impact', language)}")
            
            # Progress metrics in a container
            col1, col2 = st.columns(2)
            with col1:
                st.metric(
                    label=get_text('actions_taken', language), 
                    value=st.session_state.total_impact['actions']
                )
            with col2:
                total_time = st.session_state.total_impact['time']
                time_label = "Času věnováno" if language == 'czech' else "Time spent"
                st.metric(
                    label=time_label, 
                    value=f"{total_time} min"
                )
            
            # Enhanced streak display - simplified
            if st.session_state.streak_count > 1:
                streak_text = f"🔥 **{st.session_state.streak_count} akcí v řadě!**" if language == 'czech' else f"🔥 **{st.session_state.streak_count} day streak!**"
                st.success(streak_text)
            
            st.markdown("---")
    
        # Enhanced contextual encouragement - simplified
        if random.random() < 0.4:  # Slightly more frequent encouragement
            if st.session_state.total_impact['actions'] == 0:
                encouragement = get_random_encouragement("welcome_messages", language)
                st.info(f"💚 {encouragement}")
            elif st.session_state.total_impact['actions'] < 3:
                encouragement = get_random_encouragement("progress_encouragement", language)
                st.success(f"🌟 {encouragement}")
            else:
                encouragement = get_random_encouragement("progress_encouragement", language)
                st.success(f"🎉 {encouragement}")
        
        # Enhanced seasonal message - simplified
        seasonal_msg = get_seasonal_message(language)
        if seasonal_msg and random.random() < 0.3:
            st.info(f"🌿 {seasonal_msg}")
        
        st.markdown("---")
        
        # Enhanced Navigation - simplified
        st.markdown("### 🧭 Navigace" if language == 'czech' else "### 🧭 Navigation")
        
        # Navigation with enhanced styling and better state management
        pages = {
            f"🏠 {get_text('welcome', language)}": 'welcome',
            f"🧭 {get_text('find_path', language)}": 'assessment',
            f"⚡ {get_text('quick_actions', language)}": 'quick_actions',
            f"📊 {get_text('my_impact', language)}": 'impact',
            f"🌍 {get_text('explore_causes', language)}": 'causes'
        }
        
        # Get current page from session state or default to welcome
        current_page = st.session_state.get('current_page', 'welcome')
        
        # Find the display name for current page
        current_display = None
        for display_name, page_key in pages.items():
            if page_key == current_page:
                current_display = display_name
                break
        
        if current_display is None:
            current_display = list(pages.keys())[0]  # Default to first page
        
        selected_page = st.radio(
            "Vyberte stránku:" if language == 'czech' else "Select page:",
            list(pages.keys()),
            index=list(pages.keys()).index(current_display),
            label_visibility="collapsed"
        )
        
        # Update current page when selection changes
        selected_page_key = pages[selected_page]
        if selected_page_key != current_page:
            st.session_state.current_page = selected_page_key
            st.rerun() 