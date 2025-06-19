"""Enhanced main navigation with comprehensive user support and accessibility"""

import streamlit as st
import random
from utils.localization import get_text, get_czech_proverb, get_accessibility_text
from logic.encouragement import get_random_encouragement, get_seasonal_message
from core.session import (track_page_visit, check_inactivity, is_returning_user, 
                         get_user_behavior_insights, toggle_accessibility_feature,
                         get_accessibility_classes, add_user_feedback)
from pages.welcome import show_welcome_page
from pages.assessment import show_assessment_page
from pages.quick_actions import show_quick_actions_page
from pages.impact import show_impact_page
from pages.causes import show_causes_page
from components.emergency_help import render_emergency_widget

def main_navigation():
    """Enhanced main navigation with comprehensive user support and accessibility."""
    language = st.session_state.get('language', 'czech')
    
    # Track page visit
    track_page_visit(st.session_state.current_page)
    
    # Check for inactivity and show appropriate nudges
    inactivity_status = check_inactivity()
    
    # Enhanced sidebar with comprehensive features
    with st.sidebar:
        _render_header_section(language)
        _render_accessibility_controls(language)
        _render_user_stats(language)
        _render_contextual_encouragement(language, inactivity_status)
        _render_navigation_tabs(language)
        _render_help_and_support(language)
        
    # Main content area with accessibility wrapper
    accessibility_classes = get_accessibility_classes()
    if accessibility_classes:
        st.markdown(f'<div class="{accessibility_classes}">', unsafe_allow_html=True)
    
    # Show appropriate page content
    _render_main_content()
    
    if accessibility_classes:
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Always-on crisis widget with enhanced features
    render_emergency_widget(language)
    
    # Show inactivity nudges if needed
    _show_inactivity_nudges(inactivity_status, language)

def _render_header_section(language):
    """Render enhanced header with personalization"""
    st.markdown(f"# {get_text('title', language)}")
    st.markdown(f"*{get_text('subtitle', language)}*")
    
    # Personalized greeting for returning users
    if is_returning_user():
        if st.session_state.user_name:
            greeting = get_text('welcome_back_named', language).format(name=st.session_state.user_name)
        else:
            greeting = get_text('welcome_back_generic', language)
        st.success(f"👋 {greeting}")
    
    # Language switch with accessibility
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🇨🇿 Čeština", 
                    key="lang_cz_sidebar",
                    help=get_accessibility_text('language_switch', 'czech')):
            st.session_state.language = 'czech'
            st.rerun()
    with col2:
        if st.button("🇺🇸 English", 
                    key="lang_en_sidebar",
                    help=get_accessibility_text('language_switch', 'english')):
            st.session_state.language = 'english'
            st.rerun()

def _render_accessibility_controls(language):
    """Render accessibility control panel"""
    with st.expander(f"♿ {get_text('simple_mode', language)}", expanded=False):
        col1, col2 = st.columns(2)
        
        with col1:
            if st.checkbox(get_text('large_text', language), 
                          value=st.session_state.accessibility_mode['large_text'],
                          key="large_text_toggle"):
                toggle_accessibility_feature('large_text')
                st.rerun()
        
        with col2:
            if st.checkbox(get_text('simple_mode', language), 
                          value=st.session_state.accessibility_mode['simple_mode'],
                          key="simple_mode_toggle"):
                toggle_accessibility_feature('simple_mode')
                st.rerun()
        
        # Screen reader hint
        st.caption(get_text('screen_reader_hint', language))

def _render_user_stats(language):
    """Render user statistics with enhanced insights"""
    if st.session_state.total_impact['actions'] > 0:
        st.markdown(f"### 📊 {get_text('my_impact', language)}")
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric(get_text('actions_taken', language), 
                     st.session_state.total_impact['actions'])
        with col2:
            if st.session_state.streak_count > 1:
                st.metric("🔥 Série", st.session_state.streak_count)
        
        # Special streak badge for long streaks
        if st.session_state.streak_count >= 7:
            streak_text = get_text('long_streak_badge', language).format(streak=st.session_state.streak_count)
            st.markdown(f"<div class='streak-indicator'>{streak_text}</div>", unsafe_allow_html=True)
        
        # Multiple actions today celebration
        behavior_insights = get_user_behavior_insights()
        if behavior_insights['multiple_actions_today']:
            st.success(get_text('multiple_actions_celebration', language))

def _render_contextual_encouragement(language, inactivity_status):
    """Render contextual encouragement based on user state"""
    encouragement = None
    
    # Handle inactivity
    if inactivity_status == 'long_inactive':
        encouragement = get_text('long_inactive_nudge', language)
    elif inactivity_status == 'inactive':
        encouragement = get_text('inactive_nudge', language)
    elif st.session_state.total_impact['actions'] == 0:
        encouragement = get_random_encouragement("welcome_messages", language)
    elif st.session_state.total_impact['actions'] < 3:
        encouragement = get_random_encouragement("progress_encouragement", language)
    else:
        encouragement = get_random_encouragement("progress_encouragement", language)
    
    if encouragement:
        st.info(f"💚 {encouragement}")
    
    # Show Czech proverb occasionally for Czech users
    if (language == 'czech' and 
        st.session_state.feature_flags.get('show_proverbs', True) and 
        random.random() < 0.15):
        proverb = get_czech_proverb('help')
        st.markdown(f'<div style="font-style: italic; padding: 8px; background-color: #f0fff0; border-radius: 5px; margin: 10px 0;"><small>🌿 {proverb}</small></div>', unsafe_allow_html=True)
    
    # Seasonal message (occasionally)
    seasonal_msg = get_seasonal_message(language)
    if seasonal_msg and random.random() < 0.2:
        st.markdown(f'<div style="font-style: italic; padding: 8px; background-color: #f0fff0; border-radius: 5px; margin: 10px 0;"><small>🌿 {seasonal_msg}</small></div>', unsafe_allow_html=True)

def _render_navigation_tabs(language):
    """Render enhanced navigation with visual highlighting"""
    st.markdown("---")
    st.markdown(f"### 🧭 {get_text('language', language) if language == 'english' else 'Navigace'}")
    
    # Define pages with enhanced metadata
    pages = {
        f"🧭 {get_text('find_path', language)}": {
            'key': 'assessment',
            'description': 'Najít vaši cestu' if language == 'czech' else 'Find your path',
            'accessibility': get_accessibility_text('navigation_tab', language)
        },
        f"⚡ {get_text('quick_actions', language)}": {
            'key': 'quick_actions', 
            'description': 'Rychlá pomoc' if language == 'czech' else 'Quick help',
            'accessibility': get_accessibility_text('navigation_tab', language)
        },
        f"📊 {get_text('my_impact', language)}": {
            'key': 'impact',
            'description': 'Váš dopad' if language == 'czech' else 'Your impact',
            'accessibility': get_accessibility_text('navigation_tab', language)
        },
        f"🌍 {get_text('explore_causes', language)}": {
            'key': 'causes',
            'description': 'Oblasti pomoci' if language == 'czech' else 'Areas of impact',
            'accessibility': get_accessibility_text('navigation_tab', language)
        },
    }
    
    current_page = st.session_state.get('current_page', 'assessment')
    nav_label = "Navigace" if language == 'czech' else "Navigation"
    
    # Enhanced radio with visual highlighting
    page_labels = list(pages.keys())
    current_index = 0
    
    # Find current page index
    for i, (label, page_info) in enumerate(pages.items()):
        if page_info['key'] == current_page:
            current_index = i
            break
    
    selected_page_label = st.radio(
        nav_label,
        page_labels,
        index=current_index,
        label_visibility="collapsed",
        key="main_navigation",
        help=get_text('keyboard_hint', language)
    )
    
    # Update current page
    selected_page_key = pages[selected_page_label]['key']
    if selected_page_key != current_page:
        st.session_state.current_page = selected_page_key
        st.rerun()

def _render_help_and_support(language):
    """Render help and support section"""
    st.markdown("---")
    
    # Help section
    with st.expander(f"❓ {get_text('need_help', language)}", expanded=False):
        st.markdown(f"**{get_text('how_it_works', language)}:**")
        if language == 'czech':
            st.markdown("""
            1. **Reflexe** - Sdělte nám své hodnoty a možnosti
            2. **Doporučení** - Najdeme akce, které vám sednou  
            3. **Akce** - Udělejte konkrétní krok k pomoci
            4. **Dopad** - Sledujte svůj pozitivní vliv
            """)
        else:
            st.markdown("""
            1. **Reflection** - Share your values and resources
            2. **Recommendations** - We find actions that fit you
            3. **Action** - Take a concrete step to help
            4. **Impact** - Track your positive influence
            """)
        
        # Keyboard navigation help
        st.markdown(f"**{get_text('keyboard_hint', language)}**")
    
    # Contact and feedback
    with st.expander(f"📝 {get_text('contact_feedback', language)}", expanded=False):
        feedback_text = st.text_area(
            "Vaše zpětná vazba:" if language == 'czech' else "Your feedback:",
            placeholder="Sdělte nám své myšlenky..." if language == 'czech' else "Share your thoughts...",
            key="user_feedback_input"
        )
        
        if st.button("Odeslat zpětnou vazbu" if language == 'czech' else "Send feedback"):
            if feedback_text.strip():
                add_user_feedback("general", feedback_text)
                st.success("Děkujeme za zpětnou vazbu!" if language == 'czech' else "Thank you for your feedback!")
                st.session_state.user_feedback_input = ""
                st.rerun()
        
        # Quick feedback buttons
        st.markdown("**Rychlé hodnocení:**" if language == 'czech' else "**Quick rating:**")
        col1, col2, col3 = st.columns(3)
        with col1:
            if st.button("👍", help="Líbí se mi" if language == 'czech' else "I like it"):
                add_user_feedback("rating", "positive")
                st.success("👍")
        with col2:
            if st.button("🤔", help="Nejsem si jistý" if language == 'czech' else "I'm unsure"):
                add_user_feedback("rating", "neutral")
                st.success("🤔")
        with col3:
            if st.button("👎", help="Nelíbí se mi" if language == 'czech' else "I don't like it"):
                add_user_feedback("rating", "negative")
                st.success("👎")

def _render_main_content():
    """Render main content based on current page"""
    current_page = st.session_state.current_page
    
    # Add screen reader navigation landmark
    st.markdown('<main role="main">', unsafe_allow_html=True)
    
    if current_page == 'assessment':
        show_assessment_page()
    elif current_page == 'quick_actions':
        show_quick_actions_page()
    elif current_page == 'impact':
        show_impact_page()
    elif current_page == 'causes':
        show_causes_page()
    else:
        show_assessment_page()
    
    st.markdown('</main>', unsafe_allow_html=True)

def _show_inactivity_nudges(inactivity_status, language):
    """Show appropriate nudges based on inactivity"""
    if inactivity_status == 'long_inactive':
        st.toast(get_text('long_inactive_nudge', language), icon="💚")
    elif inactivity_status == 'inactive':
        st.toast(get_text('inactive_nudge', language), icon="🌱")

def handle_navigation_edge_cases(attempted_action, language):
    """Handle edge cases in navigation"""
    if attempted_action == 'back_from_first':
        st.info(get_text('back_from_first', language))
    elif attempted_action == 'skip_all':
        st.info(get_text('skip_all_fallback', language))
        # Offer simple action
        if st.button(f"⚡ {get_text('get_quick_help', language)}"):
            st.session_state.current_page = 'quick_actions'
            st.rerun()

def show_offline_fallback(language):
    """Show content when app is offline or data fails to load"""
    st.warning(get_text('offline_help', language))
    st.info(get_text('offline_action', language))
    
    # Simple offline actions
    if language == 'czech':
        st.markdown("""
        **Co můžete udělat hned teď:**
        - Zavolejte někomu, koho máte rádi
        - Napište dopis nebo zprávu příteli
        - Usmějte se na souseda
        - Podělte se o jídlo
        """)
    else:
        st.markdown("""
        **What you can do right now:**
        - Call someone you care about
        - Write a letter or message to a friend
        - Smile at a neighbor
        - Share some food
        """)

def show_regional_fallback(language):
    """Show content when few local actions are available"""
    st.info(get_text('few_local_actions', language))
    
    if st.button(get_text('add_local_opportunities', language)):
        # Open feedback form for local suggestions
        with st.form("local_suggestions"):
            suggestion = st.text_area(
                "Jaké místní příležitosti byste chtěli vidět?" if language == 'czech' else "What local opportunities would you like to see?",
                placeholder="Popište akce ve vaší oblasti..." if language == 'czech' else "Describe actions in your area..."
            )
            
            if st.form_submit_button("Odeslat návrh" if language == 'czech' else "Submit suggestion"):
                if suggestion.strip():
                    add_user_feedback("local_suggestion", suggestion)
                    st.success("Děkujeme za návrh!" if language == 'czech' else "Thank you for your suggestion!")

def render_navigation_with_error_handling():
    """Wrapper for main navigation with comprehensive error handling"""
    try:
        main_navigation()
    except Exception as e:
        language = st.session_state.get('language', 'czech')
        st.error(get_text('error_general', language))
        
        # Show fallback content
        show_offline_fallback(language)
        
        # Log error for debugging
        st.session_state.setdefault('app_errors', []).append({
            'error': str(e),
            'page': st.session_state.current_page,
            'timestamp': st.session_state.session_start.isoformat()
        }) 