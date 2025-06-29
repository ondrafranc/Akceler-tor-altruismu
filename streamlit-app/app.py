"""
Akcelerátor altruismu - Hlavní vstupní bod
Jemný průvodce transformací empatie v konkrétní akce
"""

import streamlit as st
from config.settings import configure_page
from config.styling import apply_styles
from core.session import initialize_session_state
from core.journey import show_journey_flow
from core.navigation import _render_top_navigation, _render_settings_panel
from components.emergency_help import render_gentle_crisis_support

def main():
    """Hlavní vstupní bod aplikace - s navigací a lineární cestou"""
    
    # Konfigurace stránky
    configure_page()
    
    # Aplikace stylů
    apply_styles()
    
    # Inicializace session state
    initialize_session_state()
    
    # Skrytí všech Streamlit elementů
    _hide_streamlit_elements()
    
    # Top navigation bar
    _render_navigation_bar()
    
    # Main content based on current page/mode
    _render_main_content()
    
    # Jemná krizová podpora (vždy přístupná)
    language = st.session_state.get('language', 'czech')
    render_gentle_crisis_support(language)

def _render_navigation_bar():
    """Render top navigation bar"""
    language = st.session_state.get('language', 'czech')
    
    # Initialize current_page if not set
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'journey'
    
    # Create navigation columns
    nav_col1, nav_col2, nav_col3, nav_col4, nav_col5, settings_col = st.columns([1, 1, 1, 1, 1, 1])
    
    current_page = st.session_state.get('current_page', 'journey')
    
    # Navigation buttons with active state styling
    with nav_col1:
        if st.button("🧭 Cesta" if language == 'czech' else "🧭 Journey", 
                    type="primary" if current_page == 'journey' else "secondary",
                    use_container_width=True,
                    help="Najděte svou cestu k pomoci" if language == 'czech' else "Find your path to help"):
            st.session_state.current_page = 'journey'
            # Reset journey to welcome when clicking journey tab
            st.session_state.journey_step = 'welcome'
            st.rerun()
    
    with nav_col2:
        if st.button("⚡ Rychlá pomoc" if language == 'czech' else "⚡ Quick Help", 
                    type="primary" if current_page == 'quick_actions' else "secondary",
                    use_container_width=True,
                    help="Okamžité akce" if language == 'czech' else "Immediate actions"):
            st.session_state.current_page = 'quick_actions'
            st.rerun()
    
    with nav_col3:
        if st.button("📊 Dopad" if language == 'czech' else "📊 Impact", 
                    type="primary" if current_page == 'impact' else "secondary",
                    use_container_width=True,
                    help="Vaše cesta a pokrok" if language == 'czech' else "Your journey and progress"):
            st.session_state.current_page = 'impact'
            st.rerun()
    
    with nav_col4:
        if st.button("🌍 Oblasti" if language == 'czech' else "🌍 Causes", 
                    type="primary" if current_page == 'causes' else "secondary",
                    use_container_width=True,
                    help="Prozkoumejte oblasti pomoci" if language == 'czech' else "Explore areas of help"):
            st.session_state.current_page = 'causes'
            st.rerun()
    
    with nav_col5:
        if st.button("📝 Zpětná vazba" if language == 'czech' else "📝 Feedback", 
                    type="primary" if current_page == 'feedback' else "secondary",
                    use_container_width=True,
                    help="Sdělte nám své myšlenky" if language == 'czech' else "Share your thoughts"):
            st.session_state.current_page = 'feedback'
            st.rerun()
    
    # Settings dropdown in the last column
    with settings_col:
        with st.popover("⚙️ Nastavení" if language == 'czech' else "⚙️ Settings", use_container_width=True):
            _render_settings_panel(language)

def _render_main_content():
    """Render main content based on current page"""
    current_page = st.session_state.get('current_page', 'journey')
    language = st.session_state.get('language', 'czech')
    
    # Add some spacing after navigation
    st.markdown("<br/>", unsafe_allow_html=True)
    
    # Route to appropriate content
    if current_page == 'journey':
        show_journey_flow()
    elif current_page == 'quick_actions':
        _show_quick_actions_page()
    elif current_page == 'impact':
        _show_impact_page()
    elif current_page == 'causes':
        _show_causes_page()
    elif current_page == 'feedback':
        _show_feedback_page()
    else:
        show_journey_flow()

def _show_quick_actions_page():
    """Quick actions page with real Czech opportunities"""
    language = st.session_state.get('language', 'czech')
    
    if language == 'czech':
        st.markdown("## ⚡ Rychlá pomoc")
        st.markdown("*Okamžité akce, které můžete udělat právě teď*")
    else:
        st.markdown("## ⚡ Quick Help")
        st.markdown("*Immediate actions you can take right now*")
    
    col1, col2 = st.columns(2)
    
    # Quick actions with real Czech organizations
    quick_actions = [
        {
            'title': '🌱 Darovat strom' if language == 'czech' else '🌱 Donate a tree',
            'description': 'Podpořte zalesňování v ČR - 200 Kč zasadí jeden strom' if language == 'czech' else 'Support reforestation in Czech Republic - 200 CZK plants one tree',
            'url': 'https://www.sazimebudoucnost.cz/daruj',
            'time': '2 minuty' if language == 'czech' else '2 minutes'
        },
        {
            'title': '📚 Darovat knihy' if language == 'czech' else '📚 Donate books',
            'description': 'Najděte nejbližší knihobudku a darujte knihy' if language == 'czech' else 'Find the nearest book exchange and donate books',
            'url': 'https://www.knihobudky.cz/mapa',
            'time': '15 minut' if language == 'czech' else '15 minutes'
        },
        {
            'title': '❤️ Napsat dopis seniorovi' if language == 'czech' else '❤️ Write letter to senior',
            'description': 'Potěšte osamělé seniory osobním dopisem' if language == 'czech' else 'Make lonely seniors happy with a personal letter',
            'url': 'https://www.dopisy-seniorum.cz',
            'time': '20 minut' if language == 'czech' else '20 minutes'
        },
        {
            'title': '🥘 Pomoct bezdomovcům' if language == 'czech' else '🥘 Help homeless',
            'description': 'Darujte jídlo přes aplikaci Naděje' if language == 'czech' else 'Donate food through Naděje app',
            'url': 'https://www.nadeje.cz/daruj-jidlo',
            'time': '5 minut' if language == 'czech' else '5 minutes'
        },
        {
            'title': '🎓 Online doučování' if language == 'czech' else '🎓 Online tutoring',
            'description': 'Staňte se online dobrovolníkem pro děti' if language == 'czech' else 'Become online volunteer for children',
            'url': 'https://www.ucimeonline.cz/dobrovolnik',
            'time': '1 hodina týdně' if language == 'czech' else '1 hour per week'
        },
        {
            'title': '🐕 Pomoct útulku' if language == 'czech' else '🐕 Help animal shelter',
            'description': 'Podpořte pražský útulek pro zvířata' if language == 'czech' else 'Support Prague animal shelter',
            'url': 'https://www.utulekpraha.cz/pomoc',
            'time': '3 minuty' if language == 'czech' else '3 minutes'
        }
    ]
    
    for i, action in enumerate(quick_actions):
        with col1 if i % 2 == 0 else col2:
            with st.container():
                st.markdown(f"""
                <div style="
                    background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
                    border: 1px solid #A8D5A8;
                    border-radius: 15px;
                    padding: 1.5rem;
                    margin: 1rem 0;
                    height: 200px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                ">
                    <div>
                        <h4 style="color: #2E5D31; margin-bottom: 0.5rem;">{action['title']}</h4>
                        <p style="color: #5A6B5A; margin-bottom: 1rem; font-size: 0.9rem;">{action['description']}</p>
                    </div>
                    <div>
                        <small style="color: #7AB87A;">⏱️ {action['time']}</small>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                if st.button(f"Začít" if language == 'czech' else "Start", 
                           key=f"action_{i}", use_container_width=True):
                    st.markdown(f"[Otevřít {action['title']}]({action['url']})")
                    st.success("Děkujeme za vaši pomoc! 💚" if language == 'czech' else "Thank you for your help! 💚")

def _show_impact_page():
    """Impact tracking page"""
    language = st.session_state.get('language', 'czech')
    
    if language == 'czech':
        st.markdown("## 📊 Váš dopad")
        st.markdown("*Sledujte svou cestu pomoci*")
    else:
        st.markdown("## 📊 Your Impact")
        st.markdown("*Track your helping journey*")
    
    # Simple impact metrics
    total_actions = st.session_state.get('total_impact', {}).get('actions', 0)
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Kroky" if language == 'czech' else "Steps", total_actions)
    with col2:
        st.metric("Dní od začátku" if language == 'czech' else "Days since start", "1")
    with col3:
        st.metric("Série" if language == 'czech' else "Streak", "1")
    
    if total_actions == 0:
        st.info("Začněte svou cestu v sekci 'Cesta' nebo 'Rychlá pomoc'!" if language == 'czech' 
               else "Start your journey in 'Journey' or 'Quick Help' section!")

def _show_causes_page():
    """Causes exploration page"""
    language = st.session_state.get('language', 'czech')
    
    if language == 'czech':
        st.markdown("## 🌍 Oblasti pomoci")
        st.markdown("*Prozkoumejte různé způsoby, jak můžete pomoci*")
    else:
        st.markdown("## 🌍 Areas of Help")
        st.markdown("*Explore different ways you can help*")
    
    causes = [
        {
            'title': '🌱 Životní prostředí' if language == 'czech' else '🌱 Environment',
            'description': 'Ochrana přírody a boj proti změně klimatu' if language == 'czech' else 'Nature protection and climate change action'
        },
        {
            'title': '📚 Vzdělávání' if language == 'czech' else '📚 Education', 
            'description': 'Podpora vzdělávání a rozvoje' if language == 'czech' else 'Supporting education and development'
        },
        {
            'title': '🏘️ Komunita' if language == 'czech' else '🏘️ Community',
            'description': 'Budování silnějších komunit' if language == 'czech' else 'Building stronger communities'
        },
        {
            'title': '💚 Zdraví' if language == 'czech' else '💚 Health',
            'description': 'Podpora zdraví a pohody' if language == 'czech' else 'Supporting health and wellbeing'
        }
    ]
    
    col1, col2 = st.columns(2)
    for i, cause in enumerate(causes):
        with col1 if i % 2 == 0 else col2:
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
                border: 1px solid #A8D5A8;
                border-radius: 15px;
                padding: 1.5rem;
                margin: 1rem 0;
            ">
                <h4 style="color: #2E5D31; margin-bottom: 0.5rem;">{cause['title']}</h4>
                <p style="color: #5A6B5A; margin-bottom: 0;">{cause['description']}</p>
            </div>
            """, unsafe_allow_html=True)

def _show_feedback_page():
    """Feedback page"""
    language = st.session_state.get('language', 'czech')
    
    if language == 'czech':
        st.markdown("## 📝 Zpětná vazba")
        st.markdown("*Sdělte nám své myšlenky*")
    else:
        st.markdown("## 📝 Feedback")
        st.markdown("*Share your thoughts*")
    
    # Feedback form
    with st.form("feedback_form"):
        feedback_text = st.text_area(
            "Vaše zpětná vazba:" if language == 'czech' else "Your feedback:",
            placeholder="Sdělte nám své myšlenky, návrhy nebo zkušenosti..." if language == 'czech' else "Share your thoughts, suggestions or experiences...",
            height=150
        )
        
        submitted = st.form_submit_button("Odeslat zpětnou vazbu" if language == 'czech' else "Send feedback")
        
        if submitted and feedback_text.strip():
            st.success("Děkujeme za zpětnou vazbu! Velmi si jí vážíme." if language == 'czech' else "Thank you for your feedback! We really appreciate it.")
            st.balloons()

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