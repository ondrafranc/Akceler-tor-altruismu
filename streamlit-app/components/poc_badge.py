"""POC badge component for indicating this is a proof of concept"""

import streamlit as st

def render_poc_badge(language='czech'):
    """Render the POC disclaimer badge"""
    
    if language not in st.session_state:
        language = st.session_state.get('language', 'czech')
    
    badge_text = '🚧 Proof of Concept' if language == 'english' else '🚧 Proof of Concept'
    
    poc_html = f"""
    <div class="poc-badge">
        {badge_text}
    </div>
    """
    
    st.markdown(poc_html, unsafe_allow_html=True) 