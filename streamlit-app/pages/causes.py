"""Causes page - explore different areas of impact"""

import streamlit as st
from data.loaders import load_causes_data, load_actions_data, load_encouragement_data
from logic.matching import calculate_cause_match
from core.session import get_user_profile
from utils.localization import get_text

def show_causes_page():
    """An inspiring, clear exploration of different areas of impact, with stories and always a next step."""
    language = st.session_state.language
    st.markdown(f'<h1 class="main-header">{get_text("explore_causes", language)}</h1>', unsafe_allow_html=True)
    st.markdown(f'<p class="sub-header">{get_text("subtitle", language)}</p>', unsafe_allow_html=True)
    user_profile = get_user_profile()
    if user_profile.get('values'):
        st.info(f"💡 " + ("Na základě vašich hodnot jsme seřadili tyto oblasti tak, aby pro vás byly co nejrelevantnější." if language == 'czech' else "Based on your values, we've sorted these areas to be most relevant to you."))
    causes_data = load_causes_data(language)
    actions_data = load_actions_data(language)
    encouragement_data = load_encouragement_data(language)
    stories = encouragement_data.get('success_stories', [])
    if not causes_data:
        st.error(get_text('error_loading_causes', language))
        st.info("Zkuste místo toho rychlou pomoc." if language == 'czech' else "Try a quick action instead.")
        if st.button(f"⚡ {get_text('quick_actions', language)}", use_container_width=True):
            st.session_state.quick_action_requested = True
            st.rerun()
        return
    cause_matches = []
    for cause_id, cause_info in causes_data.items():
        match_score = calculate_cause_match(
            user_profile.get('values', []), 
            cause_info.get('values_alignment', [])
        ) if user_profile.get('values') else 0.5
        cause_matches.append((cause_id, cause_info, match_score))
    cause_matches.sort(key=lambda x: x[2], reverse=True)
    for cause_id, cause_info, match_score in cause_matches:
        with st.container():
            _render_cause_card(cause_id, cause_info, match_score, user_profile, actions_data, language, stories)
            st.markdown("---")
    st.markdown(f"""
    <div class="cta-section">
        <h3>{'Zaujala vás některá oblast?' if language == 'czech' else 'Did an area catch your eye?'}</h3>
        <p>{'Začněte rychlou akcí nebo si projděte naši reflexi a najděte si cestu na míru.' if language == 'czech' else 'Start with a quick action or go through our reflection to find a tailored path.'}</p>
    </div>
    """, unsafe_allow_html=True)
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button(f"🧭 {get_text('take_assessment', language)}", type="primary", use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()
    with col2:
        if st.button(f"⚡ {get_text('quick_actions', language)}", use_container_width=True):
            st.session_state.quick_action_requested = True
            st.rerun()
    with col3:
        if st.button("❓" + (" Nejste si jistí?" if language == 'czech' else " Not sure? Let's explore together"), use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()

def _render_cause_card(cause_id, cause_info, match_score, user_profile, actions_data, language, stories):
    """Renders a single, more narrative and visually appealing cause card, with a real story if available."""
    st.markdown(f"## {cause_info.get('emoji', '🎯')} {cause_info.get('title', 'Neznámá oblast')}")
    # Friendly match score text
    if user_profile.get('values'):
        match_percentage = int(match_score * 100)
        if match_score > 0.6:
            match_text = f"Zdá se, že tato oblast silně rezonuje s vašimi hodnotami." if language == 'czech' else "This area seems to resonate strongly with your values."
            st.success(f"💡 {match_text} ({match_percentage}% shoda)")
        else:
            match_text = f"Tato oblast by mohla být pro vás zajímavá." if language == 'czech' else "This might be an interesting area for you."
            st.info(f"💡 {match_text}")
    # Narrative description
    st.markdown(f"*{cause_info.get('description', 'Popis není k dispozici.')}*")
    # Show a real story/testimonial if available
    story = next((s for s in stories if s.get('impact', '').lower().find(cause_info.get('title', '').lower()) != -1), None)
    if story:
        st.markdown(f"""
        <div class='quote-box'>
        <strong>{story.get('name', '')}:</strong> {story.get('story', '')}<br>
        <em>{story.get('impact', '')} ({story.get('timeframe', '')})</em>
        </div>
        """, unsafe_allow_html=True)
    # Show relevant actions
    relevant_actions = [action for action_id, action in actions_data.items() if action.get('cause_id') == cause_id]
    if relevant_actions:
        st.markdown(f"**{'Příklady konkrétních akcí:' if language == 'czech' else 'Examples of concrete actions:'}**")
        cols = st.columns(3)
        for i, action in enumerate(relevant_actions[:3]):
            with cols[i]:
                st.markdown(f"""
                <div class="action-card" style="height: 100%;">
                    <p style="font-size: 0.9em; font-weight: bold;">{action.get('title', 'Neznámá akce')}</p>
                    <p style="font-size: 0.8em;">{action.get('description', '')[:60]}...</p>
                </div>
                """, unsafe_allow_html=True)
                if st.button(get_text('start_action', language), key=f"action_{cause_id}_{action.get('id', 'unknown')}_details"):
                    st.session_state.current_page = 'quick_actions'
                    st.rerun()
    else:
        st.warning("V této oblasti se připravují další akce." if language == 'czech' else "More actions are being prepared for this area.")
    # Expander for more details
    with st.expander(f"Zjistit více o '{cause_info.get('title', 'této oblasti')}'" if language == 'czech' else f"Learn more about '{cause_info.get('title', 'this cause')}'"):
        st.markdown(f"""
        **Proč na tom záleží?**  
        {cause_info.get('why_matters', 'Každá oblast pomoci řeší důležité výzvy a má potenciál zlepšit životy.')}
        
        **Kde se dozvědět více?**
        - Odkaz na relevantní článek nebo zdroj
        - Odkaz na partnerskou organizaci
        """) 