"""
Akcelerátor altruismu - Hlavní vstupní bod
Jemný průvodce transformací empatie v konkrétní akce
"""

import streamlit as st
from config.settings import configure_page
from config.styling import apply_styles
from core.session import initialize_session_state
from core.journey import show_journey_flow
from core.navigation import _render_settings_panel
from components.emergency_help import render_gentle_crisis_support
from data.loaders import load_actions_data, load_causes_data
from content import get_content
import json

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
    
    # Inicializace current_page pokud neexistuje - default je 'journey' (Cesta)
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'journey'
    
    # Get language for the entire app
    language = st.session_state.get('language', 'czech')
    
    # Top navigace
    _render_enhanced_navigation(language)
    
    # Hlavní obsah na základě vybrané stránky
    if st.session_state.current_page == 'journey':
        show_journey_flow()
    elif st.session_state.current_page == 'quick_actions':
        _show_quick_actions_page(language)
    elif st.session_state.current_page == 'impact':
        _show_impact_page(language)
    elif st.session_state.current_page == 'causes':
        _show_causes_page(language)
    elif st.session_state.current_page == 'feedback':
        _show_feedback_page(language)
    elif st.session_state.current_page == 'settings':
        _render_settings_panel(language)
    
    # Jemná krizová podpora - vždy přítomná
    render_gentle_crisis_support(language)

def _hide_streamlit_elements():
    """Skrytí všech základních Streamlit elementů"""
    st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        .stDeployButton {display: none;}
        .stDecoration {display: none;}
    </style>
    """, unsafe_allow_html=True)

def _render_enhanced_navigation(language):
    """Vylepšená navigace s důrazem na rychlé akce"""
    
    st.markdown("""
    <div style="
        background: linear-gradient(135deg, #7AB87A 0%, #6BAD6B 100%);
        padding: 1rem 0;
        margin: -1rem -1rem 2rem -1rem;
        box-shadow: 0 2px 10px rgba(122, 184, 122, 0.3);
    ">
        <div style="
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
        ">
    """, unsafe_allow_html=True)
    
    # Navigation tabs
    cols = st.columns([1, 1, 1.5, 1, 1, 1])
    
    with cols[0]:
        if st.button("🧭 Cesta", use_container_width=True, 
                    type="primary" if st.session_state.current_page == 'journey' else "secondary"):
            st.session_state.current_page = 'journey'
            # Reset journey to welcome when clicking Cesta
            if 'journey_step' in st.session_state:
                st.session_state.journey_step = 'welcome'
            st.rerun()
    
    with cols[1]:
        if st.button("📊 Dopad", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'impact' else "secondary"):
            st.session_state.current_page = 'impact'
            st.rerun()
    
    with cols[2]:
        # Emphasized quick actions button
        st.markdown(f"""
        <style>
        @keyframes pulse {{
            0% {{ transform: scale(1); }}
            50% {{ transform: scale(1.05); }}
            100% {{ transform: scale(1); }}
        }}
        .stButton > button[key="quick_actions_btn"] {{
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
            color: #2E5D31 !important;
            font-weight: 700 !important;
            border: 2px solid #FFD700 !important;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4) !important;
            animation: pulse 2s infinite !important;
        }}
        </style>
        """, unsafe_allow_html=True)
        
        if st.button("⚡ RYCHLÁ POMOC", use_container_width=True,
                    type="primary", key="quick_actions_btn"):
            st.session_state.current_page = 'quick_actions'
            st.rerun()
    
    with cols[3]:
        if st.button("🌍 Oblasti", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'causes' else "secondary"):
            st.session_state.current_page = 'causes'
            st.rerun()
    
    with cols[4]:
        if st.button("📝 Zpětná vazba", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'feedback' else "secondary"):
            st.session_state.current_page = 'feedback'
            st.rerun()
    
    with cols[5]:
        if st.button("⚙️ Nastavení", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'settings' else "secondary"):
            st.session_state.current_page = 'settings'
            st.rerun()
    
    st.markdown("</div></div>", unsafe_allow_html=True)

def _show_quick_actions_page(language):
    """Stránka rychlých akcí - okamžitá pomoc"""
    
    st.markdown("""
    <div style="text-align: center; padding: 2rem 0;">
        <h1 style="color: #2E5D31; margin-bottom: 0.5rem;">⚡ Rychlá pomoc</h1>
        <p style="color: #5A6B5A; font-size: 1.2rem; margin: 0;">
            Věci, které můžete udělat právě teď. Žádné dlouhé registrace, žádné čekání.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # Load actions data
    try:
        actions_data = load_actions_data(language)
        actions = actions_data
        
        # Filter for quick actions (low time commitment, immediate impact)
        quick_actions = {
            key: action for key, action in actions.items()
            if action.get('requirements', {}).get('time_minutes', 999) <= 30
            or action.get('commitment_type') == 'one_time'
        }
        
        # Display quick actions in cards
        cols = st.columns(2)
        for i, (action_id, action) in enumerate(quick_actions.items()):
            with cols[i % 2]:
                _render_quick_action_card(action, language)
                
    except Exception as e:
        st.error(f"Chyba při načítání akcí: {e}")
        
        # Fallback quick actions
        _render_fallback_quick_actions(language)

def _render_quick_action_card(action, language):
    """Render jednotlivé karty rychlých akcí"""
    
    time_req = action.get('requirements', {}).get('time_minutes', 0)
    cost = action.get('requirements', {}).get('cost_usd', 0)
    organization = action.get('organization', {}).get('name', 'Neznámá organizace')
    website = action.get('organization', {}).get('website', '#')
    
    time_text = f"{time_req} min" if time_req < 60 else f"{time_req//60}h"
    cost_text = "Zdarma" if cost == 0 else f"~{int(cost * 25)} Kč"
    
    st.markdown(f"""
    <div style="
        background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
        border: 2px solid #7AB87A;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 4px 15px rgba(122, 184, 122, 0.2);
        transition: transform 0.3s ease;
    " onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
        <h3 style="color: #2E5D31; margin-bottom: 1rem;">
            {action.get('title', 'Bez názvu')}
        </h3>
        <p style="color: #5A6B5A; margin-bottom: 1rem; line-height: 1.5;">
            {action.get('description', 'Popis není k dispozici')}
        </p>
        <div style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            color: #4A5E4A;
        ">
            <span>⏱️ {time_text}</span>
            <span>💰 {cost_text}</span>
        </div>
        <div style="
            background: #e8f5e8;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            color: #2E5D31;
        ">
            <strong>Organizace:</strong> {organization}
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    if st.button(f"🚀 Začít: {action.get('title', 'Akce')}", 
                use_container_width=True, 
                type="primary",
                key=f"quick_{action.get('id', 'unknown')}"):
        if website and website != '#':
            st.success(f"🎉 Skvělé! Přejděte na: {website}")
            st.markdown(f"[Otevřít {organization}]({website})")
        else:
            st.success("🎉 Děkujeme za zájem! Kontaktujte organizaci přímo.")

def _render_fallback_quick_actions(language):
    """Záložní rychlé akce pokud se nepodaří načíst data"""
    
    if language == 'czech':
        fallback_actions = [
            {
                'title': '💚 Dar 100 Kč pro Charitu ČR',
                'description': 'Okamžitý příspěvek na pomoc potřebným v České republice',
                'time': '2 min',
                'cost': '100 Kč',
                'url': 'https://www.charita.cz'
            },
            {
                'title': '🩸 Registrace dárce krve',
                'description': 'Zaregistrujte se jako dárce krve a zachraňte životy',
                'time': '5 min',
                'cost': 'Zdarma',
                'url': 'https://www.darcekrve.cz'
            },
            {
                'title': '🌱 Podpis petice za klima',
                'description': 'Podpořte ochranu klimatu jedním kliknutím',
                'time': '1 min',
                'cost': 'Zdarma',
                'url': 'https://www.greenpeace.org/czech'
            },
            {
                'title': '📱 Sdílení na sociálních sítích',
                'description': 'Sdílejte důležitou zprávu a zvyšte povědomí',
                'time': '30 sec',
                'cost': 'Zdarma',
                'url': '#'
            }
        ]
    else:
        fallback_actions = [
            {
                'title': '💚 $10 Donation to Charity',
                'description': 'Immediate contribution to help those in need',
                'time': '2 min',
                'cost': '$10',
                'url': 'https://www.charitynavigator.org'
            },
            {
                'title': '🩸 Blood Donor Registration',
                'description': 'Register as a blood donor and save lives',
                'time': '5 min',
                'cost': 'Free',
                'url': 'https://www.redcross.org'
            }
        ]
    
    cols = st.columns(2)
    for i, action in enumerate(fallback_actions):
        with cols[i % 2]:
            st.markdown(f"""
            <div style="
                background: #f8fdf8;
                border: 1px solid #7AB87A;
                border-radius: 10px;
                padding: 1rem;
                margin: 0.5rem 0;
            ">
                <h4 style="color: #2E5D31; margin-bottom: 0.5rem;">
                    {action['title']}
                </h4>
                <p style="color: #5A6B5A; margin-bottom: 0.5rem; font-size: 0.9rem;">
                    {action['description']}
                </p>
                <div style="font-size: 0.8rem; color: #4A5E4A;">
                    ⏱️ {action['time']} | 💰 {action['cost']}
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            if st.button(f"Začít", key=f"fallback_{i}", use_container_width=True):
                if action['url'] != '#':
                    st.success(f"Přejděte na: {action['url']}")

def _show_causes_page(language):
    """Stránka oblastí pomoci"""
    
    st.markdown("""
    <div style="text-align: center; padding: 2rem 0;">
        <h1 style="color: #2E5D31; margin-bottom: 0.5rem;">🌍 Oblasti pomoci</h1>
        <p style="color: #5A6B5A; font-size: 1.2rem; margin: 0;">
            Objevte různé způsoby, jak můžete pomoci. Každá oblast má své specifické potřeby.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    try:
        causes_data = load_causes_data(language)
        causes = causes_data
        
        for cause_id, cause in causes.items():
            _render_cause_card(cause, language)
            
    except Exception as e:
        st.error(f"Chyba při načítání oblastí: {e}")
        # Show fallback causes
        _render_fallback_causes(language)

def _render_cause_card(cause, language):
    """Render karty jednotlivých oblastí"""
    
    st.markdown(f"""
    <div style="
        background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
        border: 1px solid #7AB87A;
        border-radius: 15px;
        padding: 2rem;
        margin: 1.5rem 0;
        box-shadow: 0 2px 10px rgba(122, 184, 122, 0.1);
    ">
        <div style="display: flex; align-items: center; margin-bottom: 1rem;">
            <span style="font-size: 2rem; margin-right: 1rem;">{cause.get('emoji', '🌟')}</span>
            <h2 style="color: #2E5D31; margin: 0;">{cause.get('title', 'Bez názvu')}</h2>
        </div>
        <p style="color: #5A6B5A; margin-bottom: 1.5rem; line-height: 1.6; font-size: 1.1rem;">
            {cause.get('description', 'Popis není k dispozici')}
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # Success stories
    success_stories = cause.get('success_stories', [])
    if success_stories:
        with st.expander(f"💫 Příběhy úspěchu - {cause.get('title')}"):
            for story in success_stories:
                st.markdown(f"""
                **{story.get('impact', 'Dopad')}** ({story.get('location', 'Neznámé místo')})
                
                _{story.get('story', 'Příběh není k dispozici')}_
                """)

def _render_fallback_causes(language):
    """Fallback causes when data loading fails"""
    
    if language == 'czech':
        fallback_causes = [
            {
                'emoji': '🏠',
                'title': 'Místní komunita',
                'description': 'Pomoc ve vašem okolí - senioři, rodiny v nouzi, sousedé.'
            },
            {
                'emoji': '🌍',
                'title': 'Životní prostředí',
                'description': 'Ochrana přírody, úklidy, udržitelnost.'
            },
            {
                'emoji': '📚',
                'title': 'Vzdělávání',
                'description': 'Doučování, knihy, podpora studentů.'
            }
        ]
    else:
        fallback_causes = [
            {
                'emoji': '🏠',
                'title': 'Local Community',
                'description': 'Help in your area - seniors, families in need, neighbors.'
            },
            {
                'emoji': '🌍',
                'title': 'Environment',
                'description': 'Nature protection, cleanups, sustainability.'
            },
            {
                'emoji': '📚',
                'title': 'Education',
                'description': 'Tutoring, books, student support.'
            }
        ]
    
    for cause in fallback_causes:
        _render_cause_card(cause, language)

def _show_impact_page(language):
    """Stránka dopadu - statistiky a pokrok"""
    
    st.markdown("""
    <div style="text-align: center; padding: 2rem 0;">
        <h1 style="color: #2E5D31; margin-bottom: 0.5rem;">📊 Váš dopad</h1>
        <p style="color: #5A6B5A; font-size: 1.2rem; margin: 0;">
            Každá akce má význam. Zde vidíte, co jste už dokázali.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # Personal stats
    completed_actions = st.session_state.get('completed_actions', [])
    total_actions = len(completed_actions)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #7AB87A 0%, #6BAD6B 100%);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            margin: 1rem 0;
        ">
            <h2 style="margin: 0; font-size: 3rem;">{total_actions}</h2>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">Dokončených akcí</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        # Calculate estimated people helped
        estimated_help = total_actions * 3  # rough estimate
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #5A9B5A 0%, #4A8A4A 100%);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            margin: 1rem 0;
        ">
            <h2 style="margin: 0; font-size: 3rem;">~{estimated_help}</h2>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">Lidí jste pomohli</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        # Days since first action
        if completed_actions:
            first_action_date = completed_actions[0].get('completed_at')
            if first_action_date:
                from datetime import datetime
                days_helping = (datetime.now() - first_action_date).days
            else:
                days_helping = 1
        else:
            days_helping = 0
            
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #4A8A4A 0%, #3A7A3A 100%);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            margin: 1rem 0;
        ">
            <h2 style="margin: 0; font-size: 3rem;">{days_helping}</h2>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">Dní pomáháte</p>
        </div>
        """, unsafe_allow_html=True)
    
    # Recent actions
    if completed_actions:
        st.markdown("### 📝 Vaše poslední akce")
        for action in completed_actions[-3:]:  # Show last 3 actions
            action_data = action.get('action', {})
            completed_at = action.get('completed_at')
            date_str = completed_at.strftime('%d.%m.%Y') if completed_at else 'Neznámé datum'
            
            st.markdown(f"""
            <div style="
                background: #f8fdf8;
                border-left: 4px solid #7AB87A;
                padding: 1rem;
                margin: 0.5rem 0;
            ">
                <strong>{action_data.get('title', 'Neznámá akce')}</strong><br>
                <small style="color: #5A6B5A;">Dokončeno: {date_str}</small>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.info("🌱 Zatím jste nedokončili žádnou akci. Začněte svou cestu pomocí!")

def _show_feedback_page(language):
    """Stránka zpětné vazby"""
    
    st.markdown("""
    <div style="text-align: center; padding: 2rem 0;">
        <h1 style="color: #2E5D31; margin-bottom: 0.5rem;">📝 Zpětná vazba</h1>
        <p style="color: #5A6B5A; font-size: 1.2rem; margin: 0;">
            Pomozte nám vylepšit Akcelerátor altruismu. Vaše zpětná vazba je pro nás cenná.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    with st.form("feedback_form"):
        st.markdown("### 💭 Jak hodnotíte svou zkušenost?")
        
        rating = st.select_slider(
            "Celkové hodnocení:",
            options=[1, 2, 3, 4, 5],
            value=4,
            format_func=lambda x: "⭐" * x
        )
        
        st.markdown("### 📝 Co funguje dobře?")
        positive = st.text_area(
            "Napište nám, co se vám líbí:",
            placeholder="Co vás nejvíce oslovilo? Která část byla nejužitečnější?"
        )
        
        st.markdown("### 🔧 Co bychom mohli zlepšit?")
        improvement = st.text_area(
            "Napište nám vaše návrhy:",
            placeholder="Co bylo matoucí? Co by pomohlo? Jaké funkce vám chybí?"
        )
        
        submitted = st.form_submit_button("Odeslat zpětnou vazbu", use_container_width=True, type="primary")
        
        if submitted and (positive.strip() or improvement.strip()):
            # Store feedback in session state
            if 'feedback_submissions' not in st.session_state:
                st.session_state.feedback_submissions = []
            
            st.session_state.feedback_submissions.append({
                'rating': rating,
                'positive': positive,
                'improvement': improvement,
                'submitted_at': st.session_state.get('current_time', 'unknown')
            })
            
            st.success("🙏 Děkujeme za vaši zpětnou vazbu! Pomáhá nám vytvářet lepší zážitek pro všechny.")

if __name__ == "__main__":
    main() 