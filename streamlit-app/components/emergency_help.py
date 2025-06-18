"""Emergency help widget component"""

import streamlit as st
from config.settings import EMERGENCY_CONTACTS

def render_emergency_widget(language='czech'):
    """Render the always-visible emergency help widget"""
    
    if language not in st.session_state:
        language = st.session_state.get('language', 'czech')
    
    contacts = EMERGENCY_CONTACTS.get(language, EMERGENCY_CONTACTS['czech'])
    
    emergency_html = f"""
    <div class="emergency-help">
        <strong>{'Potřebujete okamžitou pomoc?' if language == 'czech' else 'Need immediate help?'}</strong><br>
        📞 {'Linka bezpečí: ' + contacts['safety_line'] if language == 'czech' else 'Safety line: ' + contacts['safety_line']}<br>
        🆘 {'Krizová intervence: ' + contacts['crisis_intervention'] if language == 'czech' else 'Crisis intervention: ' + contacts['crisis_intervention']}
    </div>
    """
    
    st.markdown(emergency_html, unsafe_allow_html=True) 