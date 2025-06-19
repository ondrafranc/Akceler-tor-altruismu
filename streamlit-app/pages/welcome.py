"""Welcome page - the main landing experience"""

import streamlit as st
import random
from utils.localization import get_text
from logic.encouragement import get_random_encouragement, get_seasonal_message, get_emotional_response
from core.session import update_user_profile

def show_welcome_page():
    """A gentle, clear welcome page with grouped emotional check-in and CTAs."""
    language = st.session_state.language
    st.markdown('<div class="content-container">', unsafe_allow_html=True)
    st.markdown(f'<h1 class="main-header">{get_text("title", language)}</h1>', unsafe_allow_html=True)
    st.markdown(f'<p class="sub-header">{get_text("subtitle", language)}</p>', unsafe_allow_html=True)

    # Only one encouragement/quote at a time
    encouragement = get_random_encouragement("welcome_messages", language)
    if encouragement:
        st.info(encouragement)
    else:
        seasonal_msg = get_random_encouragement("inspirational_quotes", language)
        if seasonal_msg:
            st.markdown(f"<div class='quote-box'>\"{seasonal_msg}\"</div>", unsafe_allow_html=True)

    st.markdown("---")
    col_left, col_right = st.columns([2, 2])
    with col_left:
        _render_emotional_assessment(language)
    with col_right:
        _render_cta_section(language)
    st.markdown('</div>', unsafe_allow_html=True)

def _render_emotional_assessment(language):
    """Render a single, clear emotional check-in."""
    if language == 'czech':
        st.markdown("#### Jak se dnes cítíte?")
        emotional_options = [
            ("zahlcen", "😔 Jsem zahlcen/a"),
            ("frustrovan", "😤 Frustrovan/a"),
            ("nadejny", "😊 Nadějný/á"),
            ("provinile", "😕 Provinile"),
            ("motivovan", "🔥 Motivovan/a"),
            ("nejisty", "😐 Nejistý/á")
        ]
        emotional_state = st.radio(
            "",
            [opt[1] for opt in emotional_options],
            key="emotional_state",
            label_visibility="collapsed"
        )
        if emotional_state:
            emotion_key = next((key for key, label in emotional_options if label == emotional_state), "nejisty")
            update_user_profile({'emotional_state': emotion_key})
            response = get_emotional_response(emotion_key, language)
            st.success(f"💬 {response}")
    else:
        st.markdown("#### How are you feeling today?")
        emotional_options = [
            ("overwhelmed", "😔 Overwhelmed"),
            ("frustrated", "😤 Frustrated"),
            ("hopeful", "😊 Hopeful"),
            ("guilty", "😕 Guilty"),
            ("motivated", "🔥 Motivated"),
            ("uncertain", "😐 Uncertain")
        ]
        emotional_state = st.radio(
            "",
            [opt[1] for opt in emotional_options],
            key="emotional_state_en",
            label_visibility="collapsed"
        )
        if emotional_state:
            emotion_key = next((key for key, label in emotional_options if label == emotional_state), "uncertain")
            update_user_profile({'emotional_state': emotion_key})
            response = get_emotional_response(emotion_key, language)
            st.success(f"💬 {response}")

def _render_cta_section(language):
    """Render two clear CTAs, grouped and visually distinct."""
    st.markdown("<div class='cta-section'>", unsafe_allow_html=True)
    col_a, col_b = st.columns(2)
    with col_a:
        if language == 'czech':
            st.markdown("##### Prozkoumat vaši cestu")
            st.markdown("5 minut reflexe pro doporučení na míru.")
        else:
            st.markdown("##### Explore Your Path")
            st.markdown("5 minutes of reflection for tailored recommendations.")
        if st.button(f"🧭 {get_text('take_assessment', language)}", type="primary", use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()
    with col_b:
        if language == 'czech':
            st.markdown("##### Rychlá pomoc")
            st.markdown("Jednoduché akce, které můžete udělat hned.")
        else:
            st.markdown("##### Quick Help")
            st.markdown("Simple actions you can do right now.")
        if st.button(f"⚡ {get_text('get_quick_help', language)}", use_container_width=True):
            st.session_state.quick_action_requested = True
            st.rerun()
    st.markdown("</div>", unsafe_allow_html=True)

# The opportunities section was removed as it's better placed on the 'Explore Causes' page
# to avoid overwhelming the user on the very first page. 