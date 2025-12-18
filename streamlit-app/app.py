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
from datetime import datetime

def main():
    """Hlavní vstupní bod aplikace - s navigací a lineární cestou"""
    
    # Healthcheck endpoint for monitoring and embed checks
    try:
        qp = getattr(st, "query_params", None)
        if qp and (qp.get("healthz") is not None):
            st.write({"status": "ok"})
            return
    except Exception:
        pass

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

    # First-visit intro screen: render it as a real page (avoid stacking multiple top bars)
    if _render_first_visit_chooser(language):
        st.stop()

    # Top navigace
    _render_enhanced_navigation(language)

    # Onboarding helper + mini impact can be visually noisy on the Journey welcome screen.
    # Show them only after the user has started the journey.
    if st.session_state.current_page != 'journey' or st.session_state.get('journey_step') != 'welcome':
        _render_onboarding_helper(language)
        _render_mini_impact(language)
    
    # Hlavní obsah na základě vybrané stránky
    if st.session_state.current_page == 'journey':
        show_journey_flow()
    elif st.session_state.current_page == 'quick_actions':
        _show_quick_actions_page(language)
        _render_context_tip(language, tip_key='quick_actions', cta_key='go_to_journey')
    elif st.session_state.current_page == 'impact':
        _show_impact_page(language)
        _render_context_tip(language, tip_key='impact', cta_key='quick_help')
    elif st.session_state.current_page == 'causes':
        _show_causes_page(language)
        _render_context_tip(language, tip_key='causes', cta_key='go_to_journey')
    elif st.session_state.current_page == 'feedback':
        _show_feedback_page(language)
        _render_context_tip(language, tip_key='feedback', cta_key='go_to_journey')
    elif st.session_state.current_page == 'settings':
        _render_settings_panel(language)
    
    # Jemná krizová podpora - vždy přítomná
    render_gentle_crisis_support(language)

def _render_first_visit_chooser(language: str) -> bool:
    """True intro page shown on first visit. Returns True if it rendered (caller should st.stop())."""
    if st.session_state.get('onboarding_completed'):
        return False
    # Only show once per session
    if st.session_state.get('first_visit_prompt_shown'):
        return False
    st.session_state.first_visit_prompt_shown = True

    title = "🌿 Začít pomáhat" if language == "czech" else "🌿 Start helping"
    subtitle = (
        "Vyberte si: rovnou na ověřené organizace, nebo krátký průvodce (3–5 min)."
        if language == "czech"
        else "Choose: go straight to trusted organizations, or a short guide (3–5 min)."
    )
    direct_title = "🏛️ Ověřené organizace" if language == "czech" else "🏛️ Trusted organizations"
    direct_body = (
        "Jeden klik → web organizace. Nejnižší tření."
        if language == "czech"
        else "One click → organization website. Lowest friction."
    )
    guide_title = "🧭 Průvodce (na míru)" if language == "czech" else "🧭 Guided (tailored)"
    guide_body = (
        "Vyberete 1–2 oblasti a my doporučíme konkrétní akci."
        if language == "czech"
        else "Pick 1–2 areas and we’ll recommend a concrete action."
    )

    st.markdown(f"<div class='main-header'>{title}</div>", unsafe_allow_html=True)
    st.markdown(f"<div class='sub-header'>{subtitle}</div>", unsafe_allow_html=True)

    col_a, col_b = st.columns(2)
    with col_a:
        st.markdown(
            f"""
            <div class="cta-section">
              <div style="color:#2E5D31; font-weight:700; font-size:1.05rem; margin-bottom:0.25rem;">{direct_title}</div>
              <div style="color:#516051; margin-bottom:0.75rem;">{direct_body}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("🚀 " + ("Jít rovnou" if language == "czech" else "Go now"), use_container_width=True, type="primary", key="chooser_quick"):
            st.session_state.current_page = 'quick_actions'
            st.session_state.onboarding_completed = True
            st.rerun()

    with col_b:
        st.markdown(
            f"""
            <div class="cta-section">
              <div style="color:#2E5D31; font-weight:700; font-size:1.05rem; margin-bottom:0.25rem;">{guide_title}</div>
              <div style="color:#516051; margin-bottom:0.75rem;">{guide_body}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("🌿 " + ("Najít moji cestu" if language == "czech" else "Find my way"), use_container_width=True, type="secondary", key="chooser_guide"):
            st.session_state.current_page = 'journey'
            st.session_state.journey_step = 'welcome'
            st.session_state.onboarding_completed = True
            st.rerun()

    return True

def _render_onboarding_helper(language: str):
    """Jasná vodítka: kde právě jsem a co je další krok.
    Zobrazuje se na začátku každé stránky, aby bylo hned zřejmé, co dělat.
    """
    journey_step = st.session_state.get('journey_step', 'welcome')

    # Journey flow was simplified (emotional_check removed)
    steps = ['welcome', 'values_discovery', 'action_selection']
    titles_cs = {
        'welcome': 'Vítejte',
        'values_discovery': 'Co je pro vás důležité?',
        'action_selection': 'Vyberte si první akci'
    }
    titles_en = {
        'welcome': 'Welcome',
        'values_discovery': 'What matters to you?',
        'action_selection': 'Pick your first action'
    }

    if journey_step in steps and st.session_state.get('current_page') == 'journey':
        idx = steps.index(journey_step)
        total = len(steps)
        title = (titles_cs if language == 'czech' else titles_en)[journey_step]
        next_step = steps[idx + 1] if idx + 1 < total else None
        next_label = (
            {
                'welcome': 'Pokračovat →',
                'values_discovery': 'Najít moji akci →',
                'action_selection': 'Spustit akci →'
            } if language == 'czech' else {
                'welcome': 'Continue →',
                'values_discovery': 'Find my action →',
                'action_selection': 'Start action →'
            }
        ).get(journey_step, 'Continue →')

        st.markdown(
            f"""
            <div style="
                margin: 0 0 0.75rem 0;
                padding: 0.75rem 0.9rem;
                background: #ffffff;
                border: 1px solid rgba(44, 62, 45, 0.12);
                border-radius: 14px;
                box-shadow: 0 10px 28px rgba(0,0,0,0.08);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.75rem;
                flex-wrap: wrap;
            ">
                <div style="color:#2E5D31; font-weight:650;">
                    {('Krok' if language=='czech' else 'Step')} {idx+1}/{total}: {title}
                </div>
                <div style="color:#516051; font-size:0.92rem;">
                    {('Tip: pokračujte jedním tlačítkem' if language=='czech' else 'Tip: continue with one button')}
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

        col_a, col_b, col_c = st.columns([2, 2, 1])
        with col_b:
            if st.button(next_label, use_container_width=True, type="primary", key="onboarding_next"):
                if next_step:
                    st.session_state.journey_step = next_step
                st.rerun()

def _render_mini_impact(language: str):
    actions_done = len(st.session_state.get('completed_actions', []))
    goal_label = "Cíl dnes: 1 laskavý krok" if language=='czech' else "Today: 1 kind step"
    done_label = f"{actions_done} " + ("akcí celkem" if language=='czech' else "actions total")
    colx, coly, colz = st.columns([2,2,2])
    with colx:
        st.markdown(f"<div class='impact-metric'>{goal_label}</div>", unsafe_allow_html=True)
    with coly:
        st.markdown(f"<div class='impact-metric'>{done_label}</div>", unsafe_allow_html=True)
    with colz:
        # Gentle nudge to quick help when no action done yet
        if actions_done == 0:
            st.button("⚡ " + ("Rychlá pomoc" if language=='czech' else "Quick Help"), use_container_width=True, key="mini_quick", on_click=lambda: _goto('quick_actions'))

def _goto(page_name: str):
    st.session_state.current_page = page_name
    st.rerun()

def _render_context_tip(language: str, tip_key: str, cta_key: str):
    """Small contextual helper bar with a single action.
    tip_key: logical area; cta navigates to relevant next step.
    """
    tips_cs = {
        'quick_actions': 'Tip: Nevíte, co vybrat? Vraťte se k průvodci a najdeme akci na míru.',
        'impact': 'Tip: Udělali jste akci? Zkuste rychlou pomoc a přidejte další krok.',
        'causes': 'Tip: Vyberte oblasti, které jsou vám blízké – poradíme konkrétní kroky.',
        'feedback': 'Tip: Vaše zpětná vazba pomůže ostatním. Děkujeme!'
    }
    tips_en = {
        'quick_actions': "Tip: Not sure what to pick? Return to the guide to get a tailored action.",
        'impact': "Tip: Completed an action? Try Quick Help and add another step.",
        'causes': "Tip: Choose areas that matter to you – we'll recommend concrete steps.",
        'feedback': "Tip: Your feedback helps others. Thank you!"
    }

    cta_cs = {
        'go_to_journey': 'Přejít na průvodce →',
        'quick_help': 'Rychlá pomoc →'
    }
    cta_en = {
        'go_to_journey': 'Go to guide →',
        'quick_help': 'Quick Help →'
    }

    tip = (tips_cs if language == 'czech' else tips_en).get(tip_key)
    cta_label = (cta_cs if language == 'czech' else cta_en).get(cta_key, 'Continue →')

    if not tip:
        return

    st.markdown(
        f"""
        <div style="
            margin: 1rem 0;
            padding: 0.75rem 1rem;
            background: #f6fbf6;
            border: 1px solid #e2efe2;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
        ">
            <div style="color:#2E5D31;">{tip}</div>
        </div>
        """,
        unsafe_allow_html=True
    )

    col1, col2, col3 = st.columns([2, 2, 1])
    with col2:
        if st.button(cta_label, use_container_width=True, key=f"ctx_cta_{tip_key}"):
            if cta_key == 'go_to_journey':
                st.session_state.current_page = 'journey'
            elif cta_key == 'quick_help':
                st.session_state.current_page = 'quick_actions'
            st.rerun()

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
        background: #F8FBF8;
        padding: 0.5rem 0;
        margin: -0.5rem -0.5rem 1.25rem -0.5rem;
    ">
        <div style="
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 0.75rem;
        ">
    """, unsafe_allow_html=True)
    
    # Navigation tabs
    cols = st.columns([1, 1, 1.2, 1, 1, 1])
    
    with cols[0]:
        if st.button("🧭 Cesta", use_container_width=True, 
                    type="primary" if st.session_state.current_page == 'journey' else "secondary"):
            st.session_state.current_page = 'journey'
            # Reset journey to welcome when clicking Cesta
            if 'journey_step' in st.session_state:
                st.session_state.journey_step = 'welcome'
            # Clear previous selections for a fresh start
            if 'selected_values' in st.session_state:
                st.session_state.selected_values = []
            if 'user_profile' in st.session_state and isinstance(st.session_state.user_profile, dict):
                st.session_state.user_profile['values'] = []
            st.rerun()
    
    with cols[1]:
        if st.button("📊 Dopad", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'impact' else "secondary"):
            st.session_state.current_page = 'impact'
            st.rerun()
    
    with cols[2]:
        if st.button("⚡ RYCHLÁ POMOC", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'quick_actions' else "secondary", key="quick_actions_btn"):
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
    
    # Filters and progress chip
    st.markdown("""
    <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
      <div style="color:#2E5D31; font-weight:600;">Okamžité akce</div>
      <div style="background:#e8f5e8; border:1px solid #dbe8db; color:#2E5D31; padding:4px 10px; border-radius:999px; font-size:0.9rem;">
        {completed} dokončeno
      </div>
    </div>
    """.format(completed=len(st.session_state.get('completed_actions', []))), unsafe_allow_html=True)

    with st.expander("🎯 Filtrovat", expanded=False):
        colf1, colf2 = st.columns(2)
        with colf1:
            time_filter = st.selectbox("Čas", ["Libovolně", "Do 15 min", "Do 1 hod"], index=0)
        with colf2:
            location_filter = st.selectbox("Místo", ["Kdekoli", "Online", "Praha", "Brno", "Ostrava"], index=0)

    # Load actions data
    try:
        actions_data = load_actions_data(language)
        actions = actions_data
        
        # Filter for quick actions (low time commitment, immediate impact)
        quick_actions = {}
        for key, action in actions.items():
            minutes = action.get('requirements', {}).get('time_minutes', 999)
            commitment = action.get('commitment_type')
            place = action.get('location', 'online').lower()
            if minutes <= 30 or commitment == 'one_time':
                # Time filter
                if time_filter == "Do 15 min" and minutes > 15:
                    continue
                if time_filter == "Do 1 hod" and minutes > 60:
                    continue
                # Location filter (simple contains)
                if location_filter != "Kdekoli":
                    lf = location_filter.lower()
                    if lf != 'online' and lf not in place:
                        continue
                    if lf == 'online' and 'online' not in place:
                        continue
                quick_actions[key] = action
        
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
    website = action.get('organization', {}).get('website', action.get('url', '#'))
    
    time_text = f"{time_req} min" if time_req < 60 else f"{time_req//60}h"
    cost_text = "Zdarma" if cost == 0 else f"~{int(cost * 25)} Kč"
    
    # Calm card UI: no gradients, no JS hover transforms (Streamlit already handles hover)
    st.markdown(f"""
    <div style="
        background: #ffffff;
        border: 1px solid rgba(44, 62, 45, 0.12);
        border-radius: 14px;
        padding: 1.1rem;
        margin: 0.75rem 0;
        box-shadow: 0 10px 28px rgba(0,0,0,0.08);
    ">
        <div style="color:#2E5D31; font-weight:700; font-size:1.05rem; margin:0 0 0.5rem 0;">
            {action.get('title', 'Bez názvu')}
        </div>
        <div style="color:#516051; margin:0 0 0.9rem 0; line-height:1.5;">
            {action.get('description', 'Popis není k dispozici')}
        </div>
        <div style="display:flex; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; margin-bottom:0.75rem; font-size:0.92rem; color:#516051;">
            <span>⏱️ {time_text}</span>
            <span>💰 {cost_text}</span>
        </div>
        <div style="background:#F2F7F2; border:1px solid rgba(44, 62, 45, 0.12); padding:0.6rem 0.75rem; border-radius:12px; font-size:0.92rem; color:#2E5D31;">
            <strong>Organizace:</strong> {organization}
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Primary CTA: direct link (no extra confirmation)
    if website and website != '#':
        try:
            st.link_button(
                f"🌐 {('Přejít na ' if language=='czech' else 'Open ')}{organization}",
                url=website,
                use_container_width=True
            )
        except Exception:
            st.markdown(f"[🌐 {('Přejít na ' if language=='czech' else 'Open ')}{organization}]({website})")
    else:
        st.info("ℹ️ " + ("Odkaz není k dispozici, zkuste vyhledat organizaci." if language=='czech' else "No link available, please search for the organization."))

    # Secondary CTA: mark as completed
    done_label = "✅ Hotovo – označit dokončeno" if language=='czech' else "✅ Done – mark completed"
    if st.button(done_label, use_container_width=True, key=f"done_{action.get('id','unknown')}"):
        if 'completed_actions' not in st.session_state:
            st.session_state.completed_actions = []
        st.session_state.completed_actions.append({
            'action': action,
            'completed_at': datetime.now()
        })
        st.success("🎉 " + ("Skvělé! Akce označena jako dokončená." if language=='czech' else "Great! Action marked as completed."))

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