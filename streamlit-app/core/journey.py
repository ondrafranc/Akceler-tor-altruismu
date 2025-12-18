"""
Lineární cesta pomoci - jeden krok za druhým
Jemný průvodce od pocitu bezmoci k smysluplné akci
"""

import streamlit as st
from datetime import datetime
from utils.localization import get_text, get_czech_proverb
from logic.encouragement import get_random_encouragement
from logic.matching import calculate_advanced_action_score
from core.session import get_user_profile, update_user_profile, track_page_visit
from data.loaders import load_actions_data, load_causes_data
from content import get_content, get_encouragement, get_journey_transition, get_visual_element
from config.settings import CZECH_ORGANIZATIONS

def show_journey_flow():
    """Hlavní lineární tok"""
    
    journey_step = st.session_state.get('journey_step', 'welcome')
    language = st.session_state.get('language', 'czech')
    
    if journey_step == 'welcome':
        _show_welcome_step(language)
    elif journey_step == 'values_discovery':
        _show_values_discovery_step(language)
    elif journey_step == 'action_selection':
        _show_action_selection_step(language)
    elif journey_step == 'action_completion':
        _show_action_completion_step(language)
    elif journey_step == 'reflection':
        _show_reflection_step(language)
    elif journey_step == 'next_steps':
        _show_next_steps_step(language)
    else:
        st.session_state.journey_step = 'welcome' 
        st.rerun()

def _show_welcome_step(language):
    """Welcome screen: two clear paths (direct org help vs guided journey), calm UI."""
    
    welcome_content = get_content('journey_content.welcome', language)

    st.markdown(f"<div class='main-header'>{welcome_content['title']}</div>", unsafe_allow_html=True)
    st.markdown(f"<div class='sub-header'>{welcome_content['subtitle']}</div>", unsafe_allow_html=True)

    left, right = st.columns(2)

    with left:
        st.markdown(
            f"""
            <div class="cta-section">
              <div style="color:#2E5D31; font-weight:750; font-size:1.05rem; margin-bottom:0.25rem;">
                {'🏛️ Rovnou na organizace' if language=='czech' else '🏛️ Go straight to organizations'}
              </div>
              <div style="color:#516051; margin-bottom:0.75rem;">
                {'Jeden klik a jste na stránce pomoci. Žádné další kroky.' if language=='czech' else 'One click and you’re on the help page. No extra steps.'}
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        # Small curated list (low friction)
        if language == "czech":
            org_links = [
                ("🌳 Sázejme budoucnost", CZECH_ORGANIZATIONS.get("tree_planting")),
                ("✉️ Dopisy seniorům", CZECH_ORGANIZATIONS.get("senior_letters")),
                ("🍞 Naděje (jídlo)", CZECH_ORGANIZATIONS.get("homeless_support")),
            ]
        else:
            org_links = [
                ("🌳 Plant trees", CZECH_ORGANIZATIONS.get("tree_planting")),
                ("✉️ Letters to seniors", CZECH_ORGANIZATIONS.get("senior_letters")),
                ("🍞 Homeless support", CZECH_ORGANIZATIONS.get("homeless_support")),
            ]
        for label, url in org_links:
            if url:
                try:
                    st.link_button(label, url=url, use_container_width=True)
                except Exception:
                    st.markdown(f"[{label}]({url})")

        if st.button("➡️ " + ("Zobrazit další možnosti" if language == "czech" else "See more options"), use_container_width=True, type="secondary", key="welcome_more_orgs"):
            st.session_state.current_page = "quick_actions"
            st.rerun()

    with right:
        st.markdown(
            f"""
            <div class="cta-section">
              <div style="color:#2E5D31; font-weight:750; font-size:1.05rem; margin-bottom:0.25rem;">
                {'🧭 Najít moji cestu (3–5 min)' if language=='czech' else '🧭 Find my way (3–5 min)'}
              </div>
              <div style="color:#516051; margin-bottom:0.75rem;">
                {'Vyberete 1–2 oblasti a my doporučíme konkrétní akci.' if language=='czech' else 'Pick 1–2 areas and we’ll recommend a concrete action.'}
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button(
            welcome_content['start_button'],
            use_container_width=True,
            type="primary",
            key="welcome_start",
        ):
            st.session_state.journey_step = 'values_discovery'
            st.rerun()

def _show_emotional_check_step(language):
    """Deprecated: emotional check removed from flow."""
    return

def _show_emotional_micro_intervention(emotion_key, language):
    """Deprecated: emotional micro-intervention removed from flow."""
    return
    
def _show_action_selection_step(language):
    """Krok 4: Výběr akce s krásným přechodem"""
    
    action_content = get_content('journey_content.action_selection', language)
    has_values = bool(st.session_state.get('selected_values') or get_user_profile().get('values'))
    transition_key = 'values_to_action' if has_values else 'welcome_to_action'
    transition = get_journey_transition(transition_key, language)
    
    st.markdown(f"<div class='main-header'>{action_content['title']}</div>", unsafe_allow_html=True)
    st.markdown(
        f"<div class='sub-header'>{transition.get('subtitle', '')}</div>",
        unsafe_allow_html=True,
    )
    if transition.get("transition_text"):
        st.caption(transition.get("transition_text"))
    
    # Load actions and propose the best match
    actions = load_actions_data(language)
    user_profile = get_user_profile()
    if st.session_state.get('selected_values'):
        user_profile = {**user_profile, 'values': st.session_state.get('selected_values')}
    best_action = _find_best_action(actions, user_profile, language)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        # Small “agency” reminder (teen-friendly, no guilt)
        total_done = len(st.session_state.get("completed_actions", []))
        st.markdown(
            f"""
            <div class="cta-section" style="margin-top:0;">
              <div style="color:#2E5D31; font-weight:700;">
                {("Dnes stačí jeden malý krok." if language=="czech" else "One small step is enough today.")}
              </div>
              <div style="color:#516051;">
                {(
                    f"Celkem dokončeno: {total_done}"
                    if language=="czech"
                    else f"Completed total: {total_done}"
                )}
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        
        if best_action:
            _render_action_card(best_action, language)
            # Direct primary CTA
            url = best_action.get('organization', {}).get('website', best_action.get('url', '#'))
            org_name = best_action.get('organization', {}).get('name', 'organizace')
            if url and url != '#':
                try:
                    st.link_button(("🌐 Přejít na " if language=='czech' else "🌐 Open ") + org_name, url=url, use_container_width=True)
                except Exception:
                    st.markdown(f"[🌐 {( 'Přejít na ' if language=='czech' else 'Open ')}{org_name}]({url})")
            # Mark completed
            done_label = "✅ Hotovo – označit dokončeno" if language=='czech' else "✅ Done – mark completed"
            if st.button(done_label, use_container_width=True, key="journey_done"):
                if 'completed_actions' not in st.session_state:
                    st.session_state.completed_actions = []
                st.session_state.completed_actions.append({
                    'action': best_action,
                    'completed_at': datetime.now()
                })
                st.success("🎉 " + ("Skvělé! Akce označena jako dokončená." if language=='czech' else "Great! Action marked as completed."))
        else:
            st.info("ℹ️ " + ("Zatím nemáme doporučení – zkuste Rychlou pomoc." if language=='czech' else "No recommendation yet – try Quick Help."))

        # Alternatives
        if actions:
            _show_alternative_actions(actions, user_profile, language)

def _show_values_discovery_step(language):
    """Krok 3: Objevování hodnot s jemným přechodem"""
    
    values_content = get_content('journey_content.values_discovery', language)
    came_from_emotional = bool(st.session_state.get('emotional_state'))
    transition_key = 'emotional_to_values' if came_from_emotional else 'welcome_to_values'
    transition = get_journey_transition(transition_key, language)
    
    st.markdown(f"<div class='main-header'>{values_content['title']}</div>", unsafe_allow_html=True)
    st.markdown(f"<div class='sub-header'>{values_content['subtitle']}</div>", unsafe_allow_html=True)
    if transition.get("transition_text"):
        st.caption(transition.get("transition_text"))
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown(
            f"""
            <div class="cta-section" style="margin-top:0;">
              <div style="color:#2E5D31; font-weight:700;">
                {("Vyberte 1–2 oblasti. Když nevíte, stačí 1." if language=="czech" else "Pick 1–2 areas. If unsure, just pick 1.")}
              </div>
              <div style="color:#516051;">
                {("Není to test. Můžete to kdykoli změnit." if language=="czech" else "Not a test. You can change this anytime.")}
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        
        # Hodnoty/oblasti
        values = values_content['values']
        
        # Inicializace selected_values
        if 'selected_values' not in st.session_state:
            st.session_state.selected_values = []
        
        # Grid hodnot
        cols = st.columns(2)
        for i, (key, title) in enumerate(values):
            with cols[i % 2]:
                is_selected = key in st.session_state.selected_values
                button_type = "primary" if is_selected else "secondary"
                
                if st.button(title, key=f"value_{key}", use_container_width=True, type=button_type):
                    if key in st.session_state.selected_values:
                        st.session_state.selected_values.remove(key)
                    else:
                        st.session_state.selected_values.append(key)
                    st.rerun()
        
        # Guidance based on selection
        count = len(st.session_state.selected_values)
        if count == 0:
            msg = "💡 " + values_content["guidance"]["none_selected"]
        elif count > 4:
            msg = "⚠️ " + values_content["guidance"]["too_many"]
        else:
            area_word = "oblast" if count == 1 else "oblasti" if count < 5 else "oblastí"
            msg = values_content["guidance"]["good_selection"].format(count=count, area_word=area_word)
        st.markdown(
            f"<div class='cta-section' style='margin-top:0.75rem;'><div style='color:#516051;'>{msg}</div></div>",
            unsafe_allow_html=True,
        )
        
        # Pokračování / přeskočení
        st.markdown("<div style='height: 1.0rem;'></div>", unsafe_allow_html=True)
        cols_cta = st.columns([1, 1])
        with cols_cta[0]:
            if st.button(values_content['continue_button'], use_container_width=True, type="primary", key="values_continue"):
                update_user_profile({'values': st.session_state.selected_values})
                st.session_state.journey_step = 'action_selection'
                st.rerun()
        with cols_cta[1]:
            if st.button("Přeskočit a zobrazit návrhy" if language == 'czech' else "Skip and see suggestions", use_container_width=True, type="secondary", key="values_skip"):
                update_user_profile({'values': st.session_state.selected_values})
                st.session_state.journey_step = 'action_selection'
                st.rerun()

def _show_resources_check_step(language):
    """Krok 4: Kontrola zdrojů"""
    
    _show_step_header(4, "Jaké máte možnosti?" if language == 'czech' else "What are your possibilities?", language)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if language == 'czech':
            st.markdown("""
            *Každý má jiné možnosti a to je v pořádku. Pomozte nám najít něco, co se vejde do vašeho života.*
            """)
        else:
            st.markdown("""
            *Everyone has different possibilities and that's okay. Help us find something that fits your life.*
            """)
        
        st.markdown("### ⏰ Čas" if language == 'czech' else "### ⏰ Time")
        
        time_options = [
            ("5_minutes", "5 minut"),
            ("15_minutes", "15 minut"),
            ("1_hour", "1 hodina"),
            ("few_hours", "Několik hodin"),
            ("flexible", "Flexibilně")
        ] if language == 'czech' else [
            ("5_minutes", "5 minutes"),
            ("15_minutes", "15 minutes"),
            ("1_hour", "1 hour"),
            ("few_hours", "A few hours"),
            ("flexible", "Flexibly")
        ]
        
        time_choice = st.radio(
            "Kolik času můžete věnovat?" if language == 'czech' else "How much time can you dedicate?",
            options=[key for key, _ in time_options],
            format_func=lambda x: next(label for key, label in time_options if key == x),
            key="time_availability"
        )
        
        st.markdown("### 💰 Finance" if language == 'czech' else "### 💰 Finances")
        
        money_options = [
            ("free", "Zdarma"),
            ("coffee", "Cena kávy (50-200 Kč)"),
            ("lunch", "Cena oběda (200-500 Kč)"),
            ("more", "Více (500+ Kč)")
        ] if language == 'czech' else [
            ("free", "Free"),
            ("coffee", "Price of coffee ($2-8)"),
            ("lunch", "Price of lunch ($8-20)"),
            ("more", "More ($20+)")
        ]
        
        money_choice = st.radio(
            "Kolik můžete příležitostně přispět?" if language == 'czech' else "How much can you occasionally contribute?",
            options=[key for key, _ in money_options],
            format_func=lambda x: next(label for key, label in money_options if key == x),
            key="financial_capacity"
        )
        
        if time_choice and money_choice:
            st.markdown("<div style='height: 1.5rem;'></div>", unsafe_allow_html=True)
            
            if st.button("Najít mou akci →" if language == 'czech' else "Find my action →", use_container_width=True, type="primary"):
                update_user_profile({
                    'time_availability': time_choice,
                    'financial_capacity': money_choice
                })
                st.session_state.journey_step = 'action_selection'
                st.rerun()

def _show_action_completion_step(language):
    """Krok 6: Dokončení akce"""
    
    action = st.session_state.get('selected_action')
    if not action:
        st.session_state.journey_step = 'action_selection'
        st.rerun()
        return
    
    _show_step_header(6, f"Dokončujeme: {action.get('title', 'Akce')}" if language == 'czech' else f"Completing: {action.get('title', 'Action')}", language)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        # Instrukce k akci
        if language == 'czech':
            st.markdown(f"""
            ### 🎯 Jak postupovat
            
            1. **Klikněte na odkaz níže** - otevře se vám stránka organizace
            2. **Projděte si informace** - seznamte se s tím, jak můžete pomoci
            3. **Udělejte první krok** - darujte, registrujte se, nebo začněte pomáhat
            4. **Vraťte se sem** - sdělte nám, jak to dopadlo
            
            ### 💚 Proč je to důležité
            {action.get('why_important', 'Každá pomoc má svůj význam a vytváří pozitivní změnu.')}
            """)
        else:
            st.markdown(f"""
            ### 🎯 How to proceed
            
            1. **Click the link below** - the organization's page will open
            2. **Review the information** - learn how you can help
            3. **Take the first step** - donate, register, or start helping
            4. **Come back here** - tell us how it went
            
            ### 💚 Why it matters
            {action.get('why_important', 'Every help has its meaning and creates positive change.')}
            """)
        
        # Odkaz na akci
        action_url = action.get('url', '#')
        if action_url and action_url != '#':
            if st.button(f"🌐 Přejít na {action.get('organization', 'web organizace')}" if language == 'czech' else f"🌐 Go to {action.get('organization', 'organization website')}", use_container_width=True, type="primary"):
                st.markdown(f"[Otevřít {action.get('title')}]({action_url})")
        
        st.markdown("<div style='height: 1.5rem;'></div>", unsafe_allow_html=True)
        
        # Dokončení
        if st.button("✅ Dokončil/a jsem akci" if language == 'czech' else "✅ I completed the action", use_container_width=True):
            # Uložení dokončené akce
            if 'completed_actions' not in st.session_state:
                st.session_state.completed_actions = []
            
            st.session_state.completed_actions.append({
                'action': action,
                'completed_at': datetime.now(),
                'journey_id': st.session_state.get('journey_id', 'unknown')
            })
            
            # Update total impact
            if 'total_impact' not in st.session_state:
                st.session_state.total_impact = {'actions': 0}
            st.session_state.total_impact['actions'] += 1
            
            st.session_state.journey_step = 'reflection'
            st.rerun()

def _show_reflection_step(language):
    """Krok 7: Reflexe"""
    
    _show_step_header(7, "Jak to bylo?" if language == 'czech' else "How was it?", language)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        # Oslava
        st.success("🎉 " + ("Gratulujeme! Udělali jste něco krásného!" if language == 'czech' else "Congratulations! You did something beautiful!"))
        
        if language == 'czech':
            st.markdown("""
            ### 💭 Chvilka na zamyšlení
            
            *Jak se teď cítíte? Vaše pocity jsou důležitější než jakákoliv čísla.*
            """)
        else:
            st.markdown("""
            ### 💭 A moment for reflection
            
            *How do you feel now? Your feelings are more important than any numbers.*
            """)
        
        # Reflexe
        reflection = st.text_area(
            "Napište si své myšlenky..." if language == 'czech' else "Write your thoughts...",
            placeholder="Jak se cítím po této akci? Co mě překvapilo? Co bych chtěl/a udělat příště?" if language == 'czech' else "How do I feel after this action? What surprised me? What would I like to do next?",
            height=100
        )
        
        if st.button("Pokračovat →" if language == 'czech' else "Continue →", use_container_width=True, type="primary"):
            if reflection.strip():
                # Uložení reflexe
                if 'reflections' not in st.session_state:
                    st.session_state.reflections = []
                
                st.session_state.reflections.append({
                    'text': reflection,
                    'created_at': datetime.now(),
                    'action': st.session_state.get('selected_action', {}).get('title', 'Unknown')
                })
            
            st.session_state.journey_step = 'next_steps'
            st.rerun()

def _show_next_steps_step(language):
    """Krok 8: Další kroky"""
    
    _show_step_header(8, "Co dál?" if language == 'czech' else "What's next?", language)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if language == 'czech':
            st.markdown("""
            ### 🌟 Vaše cesta pokračuje
            
            Udělali jste svůj první krok! To je vždy nejdůležitější moment. 
            
            Můžete:
            """)
        else:
            st.markdown("""
            ### 🌟 Your journey continues
            
            You took your first step! That's always the most important moment.
            
            You can:
            """)
        
        # Možnosti pokračování
        if st.button("🔄 Udělat další akci" if language == 'czech' else "🔄 Do another action", use_container_width=True, type="primary"):
            # Reset journey pro novou akci – začni lehkým výběrem hodnot
            st.session_state.selected_values = []
            if 'user_profile' in st.session_state and isinstance(st.session_state.user_profile, dict):
                st.session_state.user_profile['values'] = []
            st.session_state.journey_step = 'values_discovery'
            st.rerun()
        
        if st.button("📖 Podívat se na mou cestu" if language == 'czech' else "📖 Look at my journey", use_container_width=True):
            _show_journey_summary(language)
        
        if st.button("💚 Sdílet s přáteli" if language == 'czech' else "💚 Share with friends", use_container_width=True):
            _show_sharing_options(language)

def _show_step_header(step_number, title, language):
    """Zobrazení hlavičky kroku"""
    
    st.markdown(f"""
    <div style="text-align: center; padding: 2rem 0 1rem 0;">
        <div style="color: #7AB87A; font-size: 1rem; margin-bottom: 0.5rem;">
            {'Krok' if language == 'czech' else 'Step'} {step_number} / 8
        </div>
        <h2 style="color: #2E5D31; font-size: 2rem; margin-bottom: 1rem;">
            {title}
        </h2>
    </div>
    """, unsafe_allow_html=True)

def _show_gentle_inspiration(language):
    """Jemná inspirace na welcome stránce"""
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        encouragement = get_random_encouragement("welcome", language)
        if encouragement:
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #f0fff0 0%, #e8f5e8 100%);
                padding: 1.5rem;
                border-radius: 15px;
                text-align: center;
                margin: 2rem 0;
                border-left: 4px solid #7AB87A;
            ">
                <div style="color: #2E5D31; font-style: italic; line-height: 1.6;">
                    💚 {encouragement}
                </div>
            </div>
            """, unsafe_allow_html=True)

def _find_best_action(actions, user_profile, language):
    """Najití nejlepší akce pro uživatele"""
    
    # Jednoduchý matching algoritmus
    values = user_profile.get('values', [])
    time_pref = user_profile.get('time_availability', '15_minutes')
    money_pref = user_profile.get('financial_capacity', 'free')
    
    # Filtrování akcí podle preferencí
    suitable_actions = []
    
    for action_id, action in actions.items():
        # Kontrola času
        action_time = action.get('time_requirement', '15_minutes')
        if _time_matches(time_pref, action_time):
            # Kontrola peněz
            action_cost = action.get('cost_requirement', 'free')
            if _cost_matches(money_pref, action_cost):
                # Kontrola hodnot
                action_values = action.get('related_values', [])
                value_match = len(set(values) & set(action_values)) if values and action_values else 0.5
                
                suitable_actions.append((action, value_match))
    
    if suitable_actions:
        # Seřazení podle shody hodnot
        suitable_actions.sort(key=lambda x: x[1], reverse=True)
        return suitable_actions[0][0]
    
    # Fallback - vrátit první dostupnou akci
    return list(actions.values())[0] if actions else None

def _time_matches(user_pref, action_time):
    """Kontrola, zda čas akce odpovídá preferencím uživatele"""
    time_hierarchy = ['5_minutes', '15_minutes', '1_hour', 'few_hours', 'flexible']
    
    try:
        user_index = time_hierarchy.index(user_pref)
        action_index = time_hierarchy.index(action_time)
        return action_index <= user_index
    except ValueError:
        return True  # Fallback

def _cost_matches(user_pref, action_cost):
    """Kontrola, zda cena akce odpovídá preferencím uživatele"""
    cost_hierarchy = ['free', 'coffee', 'lunch', 'more']
    
    try:
        user_index = cost_hierarchy.index(user_pref)
        action_index = cost_hierarchy.index(action_cost)
        return action_index <= user_index
    except ValueError:
        return True  # Fallback

def _render_action_card(action, language):
    """Vykreslení karty akce"""
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        time_req = action.get("requirements", {}).get("time_minutes")
        cost = action.get("requirements", {}).get("cost_usd")
        time_text = f"{int(time_req)} min" if isinstance(time_req, (int, float)) else ""
        cost_text = ("Zdarma" if cost == 0 else f"~{int(cost * 25)} Kč") if isinstance(cost, (int, float)) else ""
        meta = " • ".join([x for x in [time_text, cost_text] if x])

        st.markdown(
            f"""
            <div class="action-card">
              <div style="color:#2E5D31; font-weight:800; font-size:1.1rem; margin-bottom:0.35rem;">
                {action.get('icon', '🌟')} {action.get('title', 'Akce')}
              </div>
              <div style="color:#516051; line-height:1.55; margin-bottom:0.75rem;">
                {action.get('description', 'Popis akce')}
              </div>
              {f"<div style='color:#516051; font-size:0.92rem; margin-bottom:0.75rem;'>{meta}</div>" if meta else ""}
              <div style="background:#F2F7F2; border:1px solid rgba(44, 62, 45, 0.12); padding:0.75rem; border-radius:12px;">
                <div style="color:#2E5D31; font-weight:700; margin-bottom:0.15rem;">
                  {("Proč to pomáhá" if language=="czech" else "Why it helps")}
                </div>
                <div style="color:#516051;">
                  {action.get('impact', 'Pozitivní změna')}
                </div>
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

def _show_alternative_actions(actions, user_profile, language):
    """Zobrazení alternativních akcí"""
    
    with st.expander("🔍 Další možnosti" if language == 'czech' else "🔍 More options", expanded=False):
        # Zobrazit další 3 akce
        action_list = list(actions.values())
        for action in action_list[1:4]:  # Přeskočit první (už byla zobrazena)
            if st.button(f"{action.get('icon', '🌟')} {action.get('title', 'Akce')}", key=f"alt_{action.get('id', 'unknown')}", use_container_width=True):
                st.session_state.selected_action = action
                st.session_state.journey_step = 'action_completion'
                st.rerun()

def _show_journey_summary(language):
    """Zobrazení souhrnu cesty"""
    
    with st.expander("📖 Vaše cesta" if language == 'czech' else "📖 Your journey", expanded=True):
        completed_actions = st.session_state.get('completed_actions', [])
        reflections = st.session_state.get('reflections', [])
        
        if completed_actions:
            st.markdown(f"**{'Dokončené akce:' if language == 'czech' else 'Completed actions:'}** {len(completed_actions)}")
            
            for action_data in completed_actions[-3:]:  # Poslední 3
                action = action_data['action']
                completed_at = action_data['completed_at']
                st.markdown(f"✅ {action.get('title', 'Akce')} - {completed_at.strftime('%d.%m.%Y')}")
        
        if reflections:
            st.markdown("---")
            st.markdown("**Vaše zamyšlení:**" if language == 'czech' else "**Your reflections:**")
            
            for reflection in reflections[-2:]:  # Poslední 2
                st.markdown(f"> *{reflection['text']}*")

def _show_sharing_options(language):
    """Zobrazení možností sdílení"""
    
    with st.expander("💚 Sdílet inspiraci" if language == 'czech' else "💚 Share inspiration", expanded=True):
        actions_count = len(st.session_state.get('completed_actions', []))
        
        if language == 'czech':
            share_text = f"Právě jsem dokončil/a {actions_count} {'akci' if actions_count == 1 else 'akce' if actions_count < 5 else 'akcí'} pomoci! 🌟 Každý malý krok má význam."
        else:
            share_text = f"Just completed {actions_count} helping action{'s' if actions_count != 1 else ''}! 🌟 Every small step matters."
        
        st.code(share_text)
        st.markdown("*Zkopírujte text výše a sdílejte na sociálních sítích*" if language == 'czech' else "*Copy the text above and share on social media*") 