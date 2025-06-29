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
from content import get_content, get_emotional_response as get_content_emotional_response, get_encouragement, get_micro_intervention, get_journey_transition, get_visual_element

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
    """Krok 1: Uvítání s krásným designem"""
    
    welcome_content = get_content('journey_content.welcome', language)
    
    # Beautiful gradient header with responsive typography
    st.markdown(f"""
    <div style="
        background: linear-gradient(135deg, #7AB87A 0%, #5A9B5A 50%, #4A8A4A 100%);
        padding: 3rem 1rem 2rem 1rem;
        border-radius: 0 0 30px 30px;
        text-align: center;
        margin: -1rem -1rem 2rem -1rem;
        box-shadow: 0 8px 25px rgba(122, 184, 122, 0.3);
    ">
        <h1 style="
            color: white; 
            margin: 0; 
            font-size: clamp(2rem, 5vw, 3rem);
            font-weight: 300;
            letter-spacing: -0.02em;
            text-shadow: 0 2px 10px rgba(0,0,0,0.1);
        ">
            {welcome_content['title']}
        </h1>
        <div style="
            color: rgba(255,255,255,0.95); 
            margin-top: 1rem; 
            font-size: clamp(1rem, 3vw, 1.2rem);
            line-height: 1.5;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            font-weight: 300;
        ">
            {welcome_content['subtitle']}
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Centered content with better spacing
    col1, col2, col3 = st.columns([1, 3, 1])
    with col2:
        # Journey preview with enhanced styling
        journey_steps = welcome_content['journey_steps']
        
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
            padding: 2rem;
            border-radius: 20px;
            margin: 2rem 0;
            border: 1px solid #e8f5e8;
            box-shadow: 0 4px 15px rgba(122, 184, 122, 0.1);
        ">
            <h3 style="
                color: #2E5D31; 
                text-align: center; 
                margin-bottom: 1.5rem;
                font-size: 1.3rem;
                font-weight: 500;
            ">
                {journey_steps['title']}
            </h3>
        """, unsafe_allow_html=True)
        
        # Enhanced step visualization
        for i, step in enumerate(journey_steps['steps'], 1):
            st.markdown(f"""
            <div style="
                display: flex;
                align-items: center;
                margin: 1rem 0;
                padding: 1rem;
                background: white;
                border-radius: 12px;
                border-left: 4px solid #7AB87A;
                box-shadow: 0 2px 8px rgba(122, 184, 122, 0.1);
                transition: all 0.3s ease;
            ">
                <div style="
                    background: linear-gradient(135deg, #7AB87A 0%, #5A9B5A 100%);
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-right: 1rem;
                    flex-shrink: 0;
                ">
                    {i}
                </div>
                <div style="
                    color: #2E5D31;
                    font-size: 1rem;
                    line-height: 1.4;
                    flex-grow: 1;
                ">
                    {step}
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown("</div>", unsafe_allow_html=True)
        
        # Time expectation with gentle styling
        st.markdown(f"""
        <div style="
            text-align: center;
            padding: 1.5rem;
            margin: 1.5rem 0;
            color: #5A6B5A;
            font-style: italic;
            background: rgba(122, 184, 122, 0.05);
            border-radius: 15px;
            border: 1px solid rgba(122, 184, 122, 0.1);
        ">
            ⏱️ Celá cesta zabere jen 3-5 minut vašeho času
        </div>
        """ if language == 'czech' else f"""
        <div style="
            text-align: center;
            padding: 1.5rem;
            margin: 1.5rem 0;
            color: #5A6B5A;
            font-style: italic;
            background: rgba(122, 184, 122, 0.05);
            border-radius: 15px;
            border: 1px solid rgba(122, 184, 122, 0.1);
        ">
            ⏱️ The entire journey takes just 3-5 minutes of your time
        </div>
        """, unsafe_allow_html=True)
        
        # Enhanced start button with better spacing
        st.markdown("<div style='height: 2rem;'></div>", unsafe_allow_html=True)
        
        if st.button(
            welcome_content['start_button'], 
            use_container_width=True, 
            type="primary",
            key="welcome_start"
        ):
            st.session_state.journey_step = 'emotional_check'
            st.rerun()

def _show_emotional_check_step(language):
    """Krok 2: Emocionální check-in s mikro-intervencemi"""
    
    emotional_content = get_content('journey_content.emotional_check', language)
    transition = get_journey_transition('welcome_to_emotional', language)
    
    # Jemný přechod
    st.markdown(f"""
    <div style="
        text-align: center; 
        padding: 1rem 0; 
        color: #7AB87A; 
        font-style: italic;
        margin-bottom: 1rem;
    ">
        {transition.get('transition_text', '')}
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown(f"""
    <div style="text-align: center; padding: 1rem 0 2rem 0;">
        <h2 style="color: #2E5D31; margin-bottom: 0.5rem;">{emotional_content['title']}</h2>
        <p style="color: #5A6B5A; font-size: 1rem; margin: 0.5rem 0;">
            {emotional_content.get('purpose_intro', '')}
        </p>
        <p style="color: #7AB87A; font-size: 0.9rem; margin: 0; font-style: italic;">
            {transition.get('subtitle', '')}
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        emotions = emotional_content['emotions']
        
        # Pokud už byla vybrána emoce, zobraz mikro-intervenci
        if 'emotional_state' in st.session_state and 'emotion_intervention_shown' not in st.session_state:
            _show_emotional_micro_intervention(st.session_state.emotional_state, language)
            return
        
        # Jinak zobraz výběr emocí
        st.markdown("""
        <div style="margin-bottom: 1.5rem;">
        """, unsafe_allow_html=True)
        
        for emotion_key, title in emotions:
            if st.button(title, key=f"emotion_{emotion_key}", use_container_width=True):
                st.session_state.emotional_state = emotion_key
                st.session_state.emotion_intervention_shown = False
                st.rerun()
                break
        
        st.markdown("</div>", unsafe_allow_html=True)

def _show_emotional_micro_intervention(emotion_key, language):
    """Zobrazí mikro-intervenci na základě vybrané emoce"""
    
    intervention = get_micro_intervention(emotion_key, language)
    emotional_content = get_content('journey_content.emotional_check', language)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        # Poděkování za sdílení
        st.success(f"💚 {emotional_content['thank_you']}")
        
        # Pauza text
        st.markdown(f"""
        <div style="
            text-align: center;
            padding: 1.5rem;
            background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
            border-radius: 15px;
            margin: 1.5rem 0;
            border-left: 4px solid #7AB87A;
        ">
            <div style="color: #2E5D31; font-size: 1.1rem; font-style: italic; margin-bottom: 1rem;">
                {intervention.get('pause_text', '')}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Specifický průvodce podle emoce
        if emotion_key == 'overwhelmed':
            st.markdown(f"""
            <div style="
                background: #f0f8f0;
                padding: 1.5rem;
                border-radius: 10px;
                margin: 1rem 0;
                text-align: center;
            ">
                <div style="color: #5A6B5A; margin-bottom: 1rem;">
                    {intervention.get('breathing_guide', '')}
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Jednoduchý grounding input
            grounding_input = st.text_input(
                intervention.get('grounding_question', ''),
                placeholder="Například: stůl, okno, rostlina...",
                key="grounding_input"
            )
            
        elif emotion_key in ['motivated', 'hopeful']:
            st.markdown(f"""
            <div style="
                background: #f0f8f0;
                padding: 1.5rem;
                border-radius: 10px;
                margin: 1rem 0;
                text-align: center;
            ">
                <div style="color: #5A6B5A; margin-bottom: 1rem;">
                    {intervention.get('focus_guide', intervention.get('nurturing_guide', ''))}
                </div>
            </div>
            """, unsafe_allow_html=True)
            
        elif emotion_key in ['uncertain', 'lost']:
            st.markdown(f"""
            <div style="
                background: #f0f8f0;
                padding: 1.5rem;
                border-radius: 10px;
                margin: 1rem 0;
                text-align: center;
            ">
                <div style="color: #5A6B5A; margin-bottom: 1rem;">
                    {intervention.get('acceptance_guide', '')}
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        # Jemný přechod k pokračování
        st.markdown(f"""
        <div style="
            text-align: center;
            padding: 1rem;
            margin: 1.5rem 0;
            color: #4A5E4A;
            font-style: italic;
        ">
            {intervention.get('gentle_transition', '')}
        </div>
        """, unsafe_allow_html=True)
        
        # Tlačítko pokračování s personalizovaným textem
        continue_button_text = intervention.get('continue_when_ready', 'Pokračovat →')
        
        if st.button(continue_button_text, use_container_width=True, type="primary", key="continue_after_intervention"):
            st.session_state.emotion_intervention_shown = True
            st.session_state.journey_step = 'values_discovery'
            st.rerun()


def _show_action_selection_step(language):
    """Krok 4: Výběr akce s krásným přechodem"""
    
    action_content = get_content('journey_content.action_selection', language)
    transition = get_journey_transition('values_to_action', language)
    
    # Jemný přechod z hodnot
    st.markdown(f"""
    <div style="
        text-align: center; 
        padding: 1rem 0; 
        color: #7AB87A; 
        font-style: italic;
        margin-bottom: 1rem;
    ">
        {transition.get('transition_text', '')}
    </div>
    """, unsafe_allow_html=True)
    
    # Progress indicators
    progress_indicators = get_visual_element('progress_indicators', language)
    current_step = 3  # 0-indexed
    
    st.markdown(f"""
    <div style="text-align: center; padding: 1rem 0 2rem 0;">
        <div style="margin-bottom: 1rem;">
    """, unsafe_allow_html=True)
    
    cols = st.columns(4)
    for i, indicator in enumerate(progress_indicators):
        with cols[i]:
            if i <= current_step:
                st.markdown(f"""
                <div style="
                    background: #7AB87A;
                    color: white;
                    padding: 0.5rem;
                    border-radius: 10px;
                    text-align: center;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin: 0.25rem;
                ">
                    {indicator}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="
                    background: #E8F2E8;
                    color: #5A6B5A;
                    padding: 0.5rem;
                    border-radius: 10px;
                    text-align: center;
                    font-size: 0.9rem;
                    margin: 0.25rem;
                ">
                    {indicator}
                </div>
                """, unsafe_allow_html=True)
    
    st.markdown(f"""
        </div>
        <h2 style="color: #2E5D31; margin-bottom: 0.5rem;">{action_content['title']}</h2>
        <p style="color: #5A6B5A; font-size: 1rem; margin: 0;">
            {transition.get('subtitle', '')}
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        # Sample action - in a real app this would be matched to user values
        sample_action = action_content['sample_action']
        
        # Enhanced action card with animation-ready styling
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
            border: 2px solid #7AB87A;
            border-radius: 20px;
            padding: 2.5rem;
            text-align: center;
            margin: 2rem 0;
            box-shadow: 0 4px 15px rgba(122, 184, 122, 0.2);
            transition: all 0.3s ease;
        ">
            <h3 style="color: #2E5D31; margin-bottom: 1rem; font-size: 1.5rem;">
                {sample_action['title']}
            </h3>
            <p style="color: #5A6B5A; margin-bottom: 1.5rem; line-height: 1.6; font-size: 1.1rem;">
                {sample_action['description']}
            </p>
            <div style="
                background: linear-gradient(135deg, #e8f5e8 0%, #d4e7d4 100%);
                padding: 1.5rem;
                border-radius: 15px;
                margin-bottom: 1rem;
                border: 1px solid #c4e4c4;
            ">
                <strong style="color: #2E5D31; font-size: 1.1rem;">💫 Váš dopad:</strong><br>
                <span style="color: #4A5E4A; font-size: 1rem; line-height: 1.5; margin-top: 0.5rem; display: block;">
                    {sample_action['impact']}
                </span>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Enhanced button with better spacing
        st.markdown("<div style='height: 1rem;'></div>", unsafe_allow_html=True)
        
        if st.button(action_content['start_button'], use_container_width=True, type="primary", key="start_action"):
            # Beautiful success animation
            st.balloons()
            st.success(f"🎉 {action_content['completion_message']}")
            
            st.markdown("<div style='height: 1rem;'></div>", unsafe_allow_html=True)
            
            # Options for next steps
            col_a, col_b = st.columns(2)
            with col_a:
                if st.button("🔄 Další akce", use_container_width=True):
                    # Reset for new journey
                    if 'emotional_state' in st.session_state:
                        del st.session_state.emotional_state
                    if 'emotion_intervention_shown' in st.session_state:
                        del st.session_state.emotion_intervention_shown
                    if 'selected_values' in st.session_state:
                        del st.session_state.selected_values
                    st.session_state.journey_step = 'welcome'
                    st.rerun()
            
            with col_b:
                if st.button("💚 Sdílet", use_container_width=True):
                    st.info("Děkujeme za vaši pomoc! Každý krok má význam. 🌱")

def _show_values_discovery_step(language):
    """Krok 3: Objevování hodnot s jemným přechodem"""
    
    values_content = get_content('journey_content.values_discovery', language)
    transition = get_journey_transition('emotional_to_values', language)
    
    # Jemný přechod z emocionálního kroku
    st.markdown(f"""
    <div style="
        text-align: center; 
        padding: 1rem 0; 
        color: #7AB87A; 
        font-style: italic;
        margin-bottom: 1rem;
    ">
        {transition.get('transition_text', '')}
    </div>
    """, unsafe_allow_html=True)
    
    # Vylepšená hlavička s progress indikátorem
    progress_indicators = get_visual_element('progress_indicators', language)
    current_step = 2  # 0-indexed
    
    st.markdown(f"""
    <div style="text-align: center; padding: 1rem 0 2rem 0;">
        <div style="margin-bottom: 1rem;">
    """, unsafe_allow_html=True)
    
    # Progress indicators
    cols = st.columns(4)
    for i, indicator in enumerate(progress_indicators):
        with cols[i]:
            if i <= current_step:
                st.markdown(f"""
                <div style="
                    background: #7AB87A;
                    color: white;
                    padding: 0.5rem;
                    border-radius: 10px;
                    text-align: center;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin: 0.25rem;
                ">
                    {indicator}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="
                    background: #E8F2E8;
                    color: #5A6B5A;
                    padding: 0.5rem;
                    border-radius: 10px;
                    text-align: center;
                    font-size: 0.9rem;
                    margin: 0.25rem;
                ">
                    {indicator}
                </div>
                """, unsafe_allow_html=True)
    
    st.markdown(f"""
        </div>
        <h2 style="color: #2E5D31; margin-bottom: 0.5rem;">{values_content['title']}</h2>
        <p style="color: #5A6B5A; font-size: 1rem; margin: 0;">
            {transition.get('subtitle', '')}
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown(f"""
        <div style="
            background: #f8fdf8;
            padding: 1.5rem;
            border-radius: 10px;
            margin: 1rem 0;
            text-align: center;
            border: 1px solid #e8f5e8;
        ">
            <div style="color: #4A5E4A; font-style: italic;">
                {values_content['subtitle']}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
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
            st.info("💡 " + values_content['guidance']['none_selected'])
        elif count > 4:
            st.warning("⚠️ " + values_content['guidance']['too_many'])
        else:
            area_word = "oblast" if count == 1 else "oblasti" if count < 5 else "oblastí"
            st.success(values_content['guidance']['good_selection'].format(count=count, area_word=area_word))
        
        # Pokračování
        if count >= 1:
            st.markdown("<div style='height: 1.5rem;'></div>", unsafe_allow_html=True)
            
            if st.button(values_content['continue_button'], use_container_width=True, type="primary"):
                update_user_profile({'values': st.session_state.selected_values})
                st.session_state.journey_step = 'action_selection'  # Skip resources_check for now
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