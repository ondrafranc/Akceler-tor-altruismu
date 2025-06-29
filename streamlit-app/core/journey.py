"""
Lineární cesta pomoci - jeden krok za druhým
Jemný průvodce od pocitu bezmoci k smysluplné akci
"""

import streamlit as st
from datetime import datetime
from utils.localization import get_text, get_czech_proverb
from logic.encouragement import get_random_encouragement, get_emotional_response
from core.session import get_user_profile, update_user_profile, track_page_visit
from data.loaders import load_actions_data, load_causes_data

def show_journey_flow():
    """Hlavní lineární tok"""
    
    journey_step = st.session_state.get('journey_step', 'welcome')
    language = st.session_state.get('language', 'czech')
    
    if journey_step == 'welcome':
        _show_welcome_step(language)
    elif journey_step == 'emotional_check':
        _show_emotional_check_step(language)
    elif journey_step == 'values_discovery':
        _show_values_discovery_step(language)
    elif journey_step == 'action_selection':
        _show_action_selection_step(language)
    else:
        st.session_state.journey_step = 'welcome' 
        st.rerun()

def _show_welcome_step(language):
    """Krok 1: Vítání"""
    
    st.markdown("""
    <div style="text-align: center; padding: 3rem 0 2rem 0;">
        <h1 style="color: #2E5D31; font-size: 2.5rem; margin-bottom: 1rem;">
            🌱 Vítejte
        </h1>
        <p style="color: #5A6B5A; font-size: 1.3rem; line-height: 1.6;">
            Jste tady, protože vám záleží na světě kolem vás.<br/>
            To je krásný začátek.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("""
        ### 🧭 Vaše cesta v několika krocích
        
        1. **Pocity** - Jak se teď cítíte?
        2. **Hodnoty** - Co vám je blízké?
        3. **Akce** - Najdeme vám konkrétní krok
        4. **Reflexe** - Jak to bylo?
        """)
        
        if st.button("🌟 Začít mou cestu", use_container_width=True, type="primary"):
            st.session_state.journey_step = 'emotional_check'
            st.rerun()

def _show_emotional_check_step(language):
    """Krok 2: Emocionální check-in"""
    
    st.markdown("""
    <div style="text-align: center; padding: 2rem 0 1rem 0;">
        <h2 style="color: #2E5D31;">Jak se cítíte?</h2>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        emotions = [
            ("overwhelmed", "😰 Zahlcen/a"),
            ("motivated", "💪 Motivován/a"),
            ("uncertain", "🤔 Nejistý/á"),
            ("hopeful", "🌟 Plný/á naděje"),
        ]
        
        for emotion_key, title in emotions:
            if st.button(title, key=f"emotion_{emotion_key}", use_container_width=True):
                st.session_state.emotional_state = emotion_key
                st.success("💚 Děkujeme za sdílení")
                
                if st.button("Pokračovat →", use_container_width=True, type="primary"):
                    st.session_state.journey_step = 'values_discovery'
                    st.rerun()
                break

def _show_values_discovery_step(language):
    """Krok 3: Objevování hodnot"""
    
    st.markdown("""
    <div style="text-align: center; padding: 2rem 0 1rem 0;">
        <h2 style="color: #2E5D31;">Co vám je blízké?</h2>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        values = [
            ("environment", "🌍 Příroda a klima"),
            ("community", "🏘️ Komunita"),
            ("education", "📚 Vzdělání"),
            ("health", "💚 Zdraví"),
            ("poverty", "🤝 Pomoc potřebným"),
            ("children", "👶 Děti"),
        ]
        
        if 'selected_values' not in st.session_state:
            st.session_state.selected_values = []
        
        for key, title in values:
            is_selected = key in st.session_state.selected_values
            button_type = "primary" if is_selected else "secondary"
            
            if st.button(title, key=f"value_{key}", use_container_width=True, type=button_type):
                if key in st.session_state.selected_values:
                    st.session_state.selected_values.remove(key)
                else:
                    st.session_state.selected_values.append(key)
                st.rerun()
        
        if len(st.session_state.selected_values) >= 1:
            if st.button("Najít mou akci →", use_container_width=True, type="primary"):
                st.session_state.journey_step = 'action_selection'
                st.rerun()

def _show_action_selection_step(language):
    """Krok 4: Výběr akce"""
    
    st.markdown("""
    <div style="text-align: center; padding: 2rem 0 1rem 0;">
        <h2 style="color: #2E5D31;">Vaše doporučená akce</h2>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        # Ukázka akce
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
            border: 2px solid #7AB87A;
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
        ">
            <h3 style="color: #2E5D31;">🌟 Pomoc místní komunitě</h3>
            <p style="color: #5A6B5A;">Najděte způsob, jak pomoci ve své lokalitě</p>
            <div style="background: #e8f5e8; padding: 1rem; border-radius: 10px;">
                <strong>💫 Váš dopad:</strong><br>
                Posílíte komunitu kolem sebe
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("🚀 Začít tuto akci", use_container_width=True, type="primary"):
            st.success("🎉 Gratulujeme! Udělali jste něco krásného!")
            
            if st.button("🔄 Udělat další akci", use_container_width=True):
                st.session_state.journey_step = 'emotional_check'
                st.rerun()

def _show_values_discovery_step(language):
    """Krok 3: Objevování hodnot"""
    
    _show_step_header(3, "Co vám je blízké?" if language == 'czech' else "What's close to your heart?", language)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if language == 'czech':
            st.markdown("""
            *Vyberte 2-3 oblasti, které vás nejvíce oslovují. Pomůže nám to najít akce, které budou rezonovat s vaším srdcem.*
            """)
        else:
            st.markdown("""
            *Choose 2-3 areas that speak to you most. This will help us find actions that resonate with your heart.*
            """)
        
        st.markdown("<div style='height: 1.5rem;'></div>", unsafe_allow_html=True)
        
        # Hodnoty/oblasti
        values = [
            ("environment", "🌍 Příroda a klima"),
            ("community", "🏘️ Komunita a sousedé"),
            ("education", "📚 Vzdělání a rozvoj"),
            ("health", "💚 Zdraví a pohoda"),
            ("poverty", "🤝 Pomoc potřebným"),
            ("elderly", "👴 Senioři"),
            ("children", "👶 Děti a mládež"),
            ("animals", "🐾 Zvířata")
        ] if language == 'czech' else [
            ("environment", "🌍 Nature and climate"),
            ("community", "🏘️ Community and neighbors"),
            ("education", "📚 Education and development"),
            ("health", "💚 Health and wellbeing"),
            ("poverty", "🤝 Helping those in need"),
            ("elderly", "👴 Seniors"),
            ("children", "👶 Children and youth"),
            ("animals", "🐾 Animals")
        ]
        
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
        
        # Pokračování
        if len(st.session_state.selected_values) >= 1:
            st.markdown("<div style='height: 1.5rem;'></div>", unsafe_allow_html=True)
            
            if st.button("Pokračovat →" if language == 'czech' else "Continue →", use_container_width=True, type="primary"):
                update_user_profile({'values': st.session_state.selected_values})
                st.session_state.journey_step = 'resources_check'
                st.rerun()
        else:
            st.info("💡 " + ("Vyberte alespoň jednu oblast, která vás oslovuje" if language == 'czech' else "Choose at least one area that speaks to you"))

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
            # Reset journey pro novou akci
            st.session_state.journey_step = 'emotional_check'
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
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
            border: 2px solid #7AB87A;
            border-radius: 15px;
            padding: 2rem;
            margin: 1rem 0;
            text-align: center;
        ">
            <h3 style="color: #2E5D31; margin-bottom: 1rem;">
                {action.get('icon', '🌟')} {action.get('title', 'Akce')}
            </h3>
            
            <p style="color: #5A6B5A; margin-bottom: 1.5rem; line-height: 1.5;">
                {action.get('description', 'Popis akce')}
            </p>
            
            <div style="
                background: #e8f5e8;
                padding: 1rem;
                border-radius: 10px;
                margin-bottom: 1rem;
            ">
                <strong style="color: #2E5D31;">💫 Váš dopad:</strong><br>
                <span style="color: #4A5E4A;">{action.get('impact', 'Pozitivní změna')}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

def _show_alternative_actions(actions, user_profile, language):
    """Zobrazení alternativních akcí"""
    
    with st.expander("🔍 Další možnosti" if language == 'czech' else "🔍 More options", expanded=True):
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