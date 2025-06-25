"""Beautiful assessment page - gentle guidance to discover your path"""

import streamlit as st
import json
import os
from utils.localization import get_text, get_czech_proverb
from logic.matching import calculate_cause_matches, get_personalized_recommendations
from logic.encouragement import get_random_encouragement, get_emotional_response
from core.session import update_user_profile, track_assessment_progress, track_page_visit
from data.loaders import load_causes_data, load_actions_data

def show_assessment_page():
    """Beautiful assessment experience - like a gentle conversation with a wise guide"""
    language = st.session_state.language
    track_page_visit('assessment')
    
    # Create beautiful, warm container
    st.markdown("""
    <div class="assessment-container" style="
        background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
        border-radius: 20px;
        padding: 2rem;
        margin: 1rem 0;
        border: 1px solid #e8f5e8;
        box-shadow: 0 4px 20px rgba(122, 184, 122, 0.1);
    ">
    """, unsafe_allow_html=True)
    
    # Beautiful header with emotional warmth
    _render_beautiful_assessment_header(language)
    
    # Progress indicator
    current_step = st.session_state.get('assessment_step', 1)
    _render_beautiful_progress(current_step, language)
    
    # Breathing space
    st.markdown("<div style='height: 1rem;'></div>", unsafe_allow_html=True)
    
    # Show appropriate step with beautiful styling
    if current_step == 1:
        _show_beautiful_values_step(language)
    elif current_step == 2:
        _show_beautiful_resources_step(language)
    elif current_step == 3:
        _show_beautiful_preferences_step(language)
    elif current_step == 4:
        _show_beautiful_results(language)
    else:
        # Reset if something goes wrong
        st.session_state.assessment_step = 1
        st.rerun()
    
    st.markdown("</div>", unsafe_allow_html=True)

def _render_beautiful_assessment_header(language):
    """Beautiful header that creates emotional safety and clarity"""
    
    if language == 'czech':
        title = "🧭 Vaše jemná reflexe"
        subtitle = "Společně objevíme, jaký druh pomoci bude odpovídat vašemu srdci"
        guidance = "Není to test – jsou to jen otázky, které vám pomohou lépe se poznat"
    else:
        title = "🧭 Your gentle reflection"
        subtitle = "Together we'll discover what kind of help will match your heart"
        guidance = "This isn't a test – just questions to help you know yourself better"
    
    st.markdown(f"""
    <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="
            font-size: 2.2rem;
            color: #2E5D31;
            margin-bottom: 0.5rem;
            font-weight: 600;
        ">{title}</h1>
        <p style="
            font-size: 1.1rem;
            color: #5A6B5A;
            font-style: italic;
            margin-bottom: 0.5rem;
            line-height: 1.4;
        ">{subtitle}</p>
        <p style="
            font-size: 0.95rem;
            color: #7A8B7A;
            margin: 0;
        ">{guidance}</p>
    </div>
    """, unsafe_allow_html=True)

def _render_beautiful_progress(current_step, language):
    """Beautiful progress indicator that feels encouraging"""
    
    steps = [
        ("🌱", "Hodnoty" if language == 'czech' else "Values"),
        ("⚡", "Možnosti" if language == 'czech' else "Resources"),
        ("🎯", "Preference" if language == 'czech' else "Preferences"),
        ("✨", "Vaše cesta" if language == 'czech' else "Your path")
    ]
    
    # Create beautiful progress bar
    progress_html = """
    <div style="
        background: #f8fdf8;
        padding: 1.5rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        border: 1px solid #e8f5e8;
    ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
    """
    
    for i, (icon, label) in enumerate(steps, 1):
        is_current = i == current_step
        is_completed = i < current_step
        
        if is_current:
            color = "#2E5D31"
            bg_color = "#e8f5e8"
            border_color = "#7AB87A"
            text_weight = "600"
        elif is_completed:
            color = "#7AB87A"
            bg_color = "#d4e7d4"
            border_color = "#7AB87A"
            text_weight = "500"
        else:
            color = "#B8C9B8"
            bg_color = "#f5f5f5"
            border_color = "#ddd"
            text_weight = "400"
        
        progress_html += f"""
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
        ">
            <div style="
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: {bg_color};
                border: 2px solid {border_color};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
                transition: all 0.3s ease;
            ">{icon}</div>
            <span style="
                color: {color};
                font-size: 0.9rem;
                font-weight: {text_weight};
                text-align: center;
            ">{label}</span>
        </div>
        """
        
        # Add connector line (except for last step)
        if i < len(steps):
            line_color = "#7AB87A" if i < current_step else "#ddd"
            progress_html += f"""
            <div style="
                flex: 0.5;
                height: 2px;
                background: {line_color};
                margin: 0 1rem;
                margin-top: -25px;
                transition: all 0.3s ease;
            "></div>
            """
    
    progress_html += """
        </div>
    </div>
    """
    
    st.markdown(progress_html, unsafe_allow_html=True)

def _show_beautiful_values_step(language):
    """Beautiful values step with emotional warmth"""
    
    if language == 'czech':
        st.markdown("""
        ### 🌱 Co je vám nejblíž?
        
        *Vyberte oblasti, které vás oslovují. Není třeba vybrat všechno – jen to, co opravdu rezonuje s vaším srdcem.*
        """)
        
        values_options = [
            ("environment", "🌍 Ochrana přírody a klimatu", "Péče o planetu pro budoucí generace"),
            ("education", "📚 Vzdělání a rozvoj", "Pomoc lidem růst a učit se"),
            ("health", "🏥 Zdraví a pohoda", "Podpora tělesného a duševního zdraví"),
            ("poverty", "🤝 Boj proti chudobě", "Pomoc těm, kteří to nejvíce potřebují"),
            ("community", "🏘️ Komunita a sousedství", "Budování silných místních vazeb"),
            ("human_rights", "⚖️ Lidská práva", "Spravedlnost a rovnost pro všechny"),
            ("animals", "🐾 Ochrana zvířat", "Péče o naše zvířecí společníky"),
            ("elderly", "👴 Senioři", "Podpora a doprovázení starších lidí"),
            ("children", "👶 Děti a mládež", "Investice do budoucnosti mladých"),
            ("arts", "🎨 Kultura a umění", "Obohacování života krásou a kreativitou")
        ]
        
        help_text = "💡 Vyberte 2-5 oblastí, které vás nejvíce oslovují"
    else:
        st.markdown("""
        ### 🌱 What's closest to your heart?
        
        *Choose areas that speak to you. No need to select everything – just what truly resonates with your heart.*
        """)
        
        values_options = [
            ("environment", "🌍 Environment & Climate", "Caring for the planet for future generations"),
            ("education", "📚 Education & Development", "Helping people grow and learn"),
            ("health", "🏥 Health & Wellbeing", "Supporting physical and mental health"),
            ("poverty", "🤝 Fighting Poverty", "Helping those who need it most"),
            ("community", "🏘️ Community & Neighborhood", "Building strong local connections"),
            ("human_rights", "⚖️ Human Rights", "Justice and equality for all"),
            ("animals", "🐾 Animal Protection", "Caring for our animal companions"),
            ("elderly", "👴 Seniors", "Supporting and accompanying older people"),
            ("children", "👶 Children & Youth", "Investing in the future of young people"),
            ("arts", "🎨 Culture & Arts", "Enriching life with beauty and creativity")
        ]
        
        help_text = "💡 Select 2-5 areas that speak to you most"
    
    # Beautiful values grid
    st.markdown(f"<p style='color: #5A6B5A; font-size: 0.9rem; margin-bottom: 1.5rem;'>{help_text}</p>", unsafe_allow_html=True)
    
    # Initialize values if not set
    if 'selected_values' not in st.session_state:
        st.session_state.selected_values = []
    
    # Create beautiful grid layout
    cols = st.columns(2)
    
    for i, (key, title, description) in enumerate(values_options):
        with cols[i % 2]:
            is_selected = key in st.session_state.selected_values
            
            # Beautiful value card
            card_style = f"""
            background: {'linear-gradient(135deg, #e8f5e8 0%, #d4e7d4 100%)' if is_selected else '#fafbfa'};
            border: 2px solid {'#7AB87A' if is_selected else '#e8e8e8'};
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
            """
            
            if st.button(
                f"{title}",
                key=f"value_{key}",
                help=description,
                use_container_width=True
            ):
                if key in st.session_state.selected_values:
                    st.session_state.selected_values.remove(key)
                else:
                    st.session_state.selected_values.append(key)
                st.rerun()
            
            # Show description for selected items
            if is_selected:
                st.markdown(f"""
                <div style="
                    background: #f0fff0;
                    padding: 0.5rem;
                    border-radius: 6px;
                    margin-top: -0.5rem;
                    margin-bottom: 0.8rem;
                    font-size: 0.85rem;
                    color: #2E5D31;
                    font-style: italic;
                ">
                    {description}
                </div>
                """, unsafe_allow_html=True)
    
    # Show gentle guidance
    selected_count = len(st.session_state.selected_values)
    if selected_count == 0:
        if language == 'czech':
            guidance = "🌸 Vezměte si čas... Co z toho vás nejvíce oslovuje?"
        else:
            guidance = "🌸 Take your time... What speaks to you most?"
        
        st.markdown(f"""
        <div style="
            background: #fff3e0;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            margin: 1rem 0;
            color: #e65100;
            font-style: italic;
        ">
            {guidance}
        </div>
        """, unsafe_allow_html=True)
    
    elif selected_count > 7:
        if language == 'czech':
            guidance = "💭 To je hodně oblastí! Možná se zkuste zaměřit na ty nejdůležitější?"
        else:
            guidance = "💭 That's quite a few areas! Maybe try focusing on the most important ones?"
        
        st.markdown(f"""
        <div style="
            background: #fff3e0;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            margin: 1rem 0;
            color: #e65100;
            font-style: italic;
        ">
            {guidance}
        </div>
        """, unsafe_allow_html=True)
    
    else:
        if language == 'czech':
            guidance = f"✨ Krásně! Vybrali jste {selected_count} {'oblast' if selected_count == 1 else 'oblasti' if selected_count < 5 else 'oblastí'}."
        else:
            guidance = f"✨ Beautiful! You've selected {selected_count} area{'s' if selected_count != 1 else ''}."
        
        st.markdown(f"""
        <div style="
            background: #f0fff0;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            margin: 1rem 0;
            color: #2E5D31;
            font-weight: 500;
        ">
            {guidance}
        </div>
        """, unsafe_allow_html=True)
    
    # Beautiful next button
    st.markdown("<div style='height: 1.5rem;'></div>", unsafe_allow_html=True)
    
    col_back, col_next = st.columns([1, 2])
    
    with col_back:
        if st.button("← Zpět" if language == 'czech' else "← Back", use_container_width=True):
            st.session_state.current_page = 'welcome'
            st.rerun()
    
    with col_next:
        if selected_count >= 1:
            if st.button("Pokračovat →" if language == 'czech' else "Continue →", type="primary", use_container_width=True):
                # Save values and move to next step
                update_user_profile({'values': st.session_state.selected_values})
                track_assessment_progress('values_completed', {'selected_count': selected_count})
                st.session_state.assessment_step = 2
                st.rerun()
        else:
            st.button("Vyberte alespoň jednu oblast" if language == 'czech' else "Select at least one area", disabled=True, use_container_width=True)

def _show_beautiful_resources_step(language):
    """Beautiful resources step that feels supportive, not judgmental"""
    
    if language == 'czech':
        st.markdown("""
        ### ⚡ Jaké máte možnosti?
        
        *Každý má jiné možnosti a to je v pořádku. Pomozte nám najít akce, které se hodí do vašeho života.*
        """)
    else:
        st.markdown("""
        ### ⚡ What are your possibilities?
        
        *Everyone has different possibilities and that's okay. Help us find actions that fit your life.*
        """)
    
    # Create two beautiful columns for time and money
    col_time, col_money = st.columns(2, gap="large")
    
    with col_time:
        _render_beautiful_time_section(language)
    
    with col_money:
        _render_beautiful_money_section(language)
    
    # Show encouraging message based on selections
    _show_resources_encouragement(language)
    
    # Navigation buttons
    st.markdown("<div style='height: 2rem;'></div>", unsafe_allow_html=True)
    
    col_back, col_next = st.columns([1, 2])
    
    with col_back:
        if st.button("← Zpět" if language == 'czech' else "← Back", use_container_width=True, key="resources_back"):
            st.session_state.assessment_step = 1
            st.rerun()
    
    with col_next:
        time_selected = st.session_state.get('time_availability') is not None
        money_selected = st.session_state.get('financial_capacity') is not None
        
        if time_selected and money_selected:
            if st.button("Pokračovat →" if language == 'czech' else "Continue →", type="primary", use_container_width=True, key="resources_next"):
                # Save resources and move to next step
                update_user_profile({
                    'time_availability': st.session_state.time_availability,
                    'financial_capacity': st.session_state.financial_capacity
                })
                track_assessment_progress('resources_completed')
                st.session_state.assessment_step = 3
                st.rerun()
        else:
            st.button("Dokončete obě sekce" if language == 'czech' else "Complete both sections", disabled=True, use_container_width=True, key="resources_disabled")

def _render_beautiful_time_section(language):
    """Beautiful time availability section"""
    
    if language == 'czech':
        st.markdown("""
        #### 🕐 Čas
        *Kolik času můžete věnovat pomoci?*
        """)
        
        time_options = [
            ("very_limited", "⏰ Velmi málo", "Pár minut tu a tam"),
            ("limited", "🕐 Občas", "Hodinu týdně"),
            ("moderate", "🕑 Pravidelně", "Několik hodin týdně"),
            ("flexible", "🕒 Flexibilně", "Dle potřeby a nálady"),
            ("committed", "🕓 Hodně", "Několik hodin denně")
        ]
    else:
        st.markdown("""
        #### 🕐 Time
        *How much time can you dedicate to helping?*
        """)
        
        time_options = [
            ("very_limited", "⏰ Very little", "A few minutes here and there"),
            ("limited", "🕐 Occasionally", "An hour per week"),
            ("moderate", "🕑 Regularly", "Several hours per week"),
            ("flexible", "🕒 Flexibly", "As needed and when I feel like it"),
            ("committed", "🕓 A lot", "Several hours daily")
        ]
    
    # Initialize if not set
    if 'time_availability' not in st.session_state:
        st.session_state.time_availability = None
    
    for key, title, description in time_options:
        is_selected = st.session_state.time_availability == key
        
        if st.button(
            title,
            key=f"time_{key}",
            use_container_width=True,
            type="primary" if is_selected else "secondary"
        ):
            st.session_state.time_availability = key
            st.rerun()
        
        if is_selected:
            st.markdown(f"""
            <div style="
                background: #e8f5e8;
                padding: 0.5rem;
                border-radius: 6px;
                margin-top: -0.5rem;
                margin-bottom: 0.5rem;
                font-size: 0.85rem;
                color: #2E5D31;
                font-style: italic;
                text-align: center;
            ">
                {description}
            </div>
            """, unsafe_allow_html=True)

def _render_beautiful_money_section(language):
    """Beautiful financial capacity section that's non-judgmental"""
    
    if language == 'czech':
        st.markdown("""
        #### 💰 Finance
        *Kolik můžete příležitostně darovat?*
        """)
        
        money_options = [
            ("none", "🌱 Žádné", "Čas je můj dar"),
            ("minimal", "☕ Minimální", "Cena kávy (50-200 Kč)"),
            ("modest", "🍕 Skromné", "Cena oběda (200-500 Kč)"),
            ("moderate", "🎬 Střední", "Cena lístku do kina (500-1000 Kč)"),
            ("generous", "📚 Štědré", "Cena knihy (1000+ Kč)")
        ]
    else:
        st.markdown("""
        #### 💰 Finances
        *How much can you occasionally donate?*
        """)
        
        money_options = [
            ("none", "🌱 None", "Time is my gift"),
            ("minimal", "☕ Minimal", "Price of coffee ($2-8)"),
            ("modest", "🍕 Modest", "Price of lunch ($8-20)"),
            ("moderate", "🎬 Moderate", "Price of movie ticket ($20-40)"),
            ("generous", "📚 Generous", "Price of a book ($40+)")
        ]
    
    # Initialize if not set
    if 'financial_capacity' not in st.session_state:
        st.session_state.financial_capacity = None
    
    for key, title, description in money_options:
        is_selected = st.session_state.financial_capacity == key
        
        if st.button(
            title,
            key=f"money_{key}",
            use_container_width=True,
            type="primary" if is_selected else "secondary"
        ):
            st.session_state.financial_capacity = key
            st.rerun()
        
        if is_selected:
            st.markdown(f"""
            <div style="
                background: #e8f5e8;
                padding: 0.5rem;
                border-radius: 6px;
                margin-top: -0.5rem;
                margin-bottom: 0.5rem;
                font-size: 0.85rem;
                color: #2E5D31;
                font-style: italic;
                text-align: center;
            ">
                {description}
            </div>
            """, unsafe_allow_html=True)

def _show_resources_encouragement(language):
    """Show encouraging message based on resource selections"""
    
    time = st.session_state.get('time_availability')
    money = st.session_state.get('financial_capacity')
    
    if time and money:
        if language == 'czech':
            if time == 'very_limited' and money == 'none':
                message = "💚 Perfektní! Existuje spousta způsobů, jak pomoci jen s trochou času a bez peněz."
            elif time in ['committed', 'moderate'] or money in ['generous', 'moderate']:
                message = "✨ Úžasné! S vašimi možnostmi můžete udělat opravdu velký rozdíl."
            else:
                message = "🌟 Skvělé! Každý příspěvek, ať už malý nebo velký, má svůj význam."
        else:
            if time == 'very_limited' and money == 'none':
                message = "💚 Perfect! There are many ways to help with just a little time and no money."
            elif time in ['committed', 'moderate'] or money in ['generous', 'moderate']:
                message = "✨ Amazing! With your resources, you can make a really big difference."
            else:
                message = "🌟 Great! Every contribution, whether small or large, has its meaning."
        
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #f0fff0 0%, #e8f5e8 100%);
            padding: 1.2rem;
            border-radius: 12px;
            text-align: center;
            margin: 1.5rem 0;
            border: 1px solid #d4e7d4;
        ">
            <div style="color: #2E5D31; font-weight: 500;">
                {message}
            </div>
        </div>
        """, unsafe_allow_html=True)

def _show_beautiful_preferences_step(language):
    """Beautiful preferences step for final personalization"""
    
    if language == 'czech':
        st.markdown("""
        ### 🎯 Vaše preference
        
        *Poslední dotazy pro dokonalé doporučení.*
        """)
    else:
        st.markdown("""
        ### 🎯 Your preferences
        
        *Final questions for perfect recommendations.*
        """)
    
    # Create sections for different preference types
    col_left, col_right = st.columns(2, gap="large")
    
    with col_left:
        _render_action_style_preferences(language)
    
    with col_right:
        _render_impact_preferences(language)
    
    # Navigation
    st.markdown("<div style='height: 2rem;'></div>", unsafe_allow_html=True)
    
    col_back, col_next = st.columns([1, 2])
    
    with col_back:
        if st.button("← Zpět" if language == 'czech' else "← Back", use_container_width=True, key="prefs_back"):
            st.session_state.assessment_step = 2
            st.rerun()
    
    with col_next:
        # Check if at least some preferences are set
        has_style = st.session_state.get('action_style') is not None
        has_impact = st.session_state.get('impact_preference') is not None
        
        if has_style or has_impact:  # At least one preference is enough
            if st.button("Zobrazit má doporučení ✨" if language == 'czech' else "Show my recommendations ✨", type="primary", use_container_width=True, key="prefs_next"):
                # Save preferences and move to results
                update_user_profile({
                    'action_style': st.session_state.get('action_style'),
                    'impact_preference': st.session_state.get('impact_preference')
                })
                track_assessment_progress('preferences_completed')
                st.session_state.assessment_step = 4
                st.rerun()
        else:
            if st.button("Vyberte alespoň jednu preferenci" if language == 'czech' else "Select at least one preference", disabled=True, use_container_width=True, key="prefs_disabled"):
                pass

def _render_action_style_preferences(language):
    """Render action style preferences"""
    
    if language == 'czech':
        st.markdown("""
        #### 🎭 Styl akce
        *Jak rádi pomáháte?*
        """)
        
        style_options = [
            ("direct", "🤝 Přímo", "Osobní kontakt s lidmi"),
            ("behind_scenes", "🔧 V zákulisí", "Organizace a logistika"),
            ("digital", "💻 Online", "Pomoc přes internet"),
            ("creative", "🎨 Kreativně", "Umění a kreativní projekty"),
            ("advocacy", "📢 Osvěta", "Šíření povědomí")
        ]
    else:
        st.markdown("""
        #### 🎭 Action style
        *How do you like to help?*
        """)
        
        style_options = [
            ("direct", "🤝 Directly", "Personal contact with people"),
            ("behind_scenes", "🔧 Behind scenes", "Organization and logistics"),
            ("digital", "💻 Online", "Help via internet"),
            ("creative", "🎨 Creatively", "Art and creative projects"),
            ("advocacy", "📢 Advocacy", "Spreading awareness")
        ]
    
    # Initialize if not set
    if 'action_style' not in st.session_state:
        st.session_state.action_style = None
    
    for key, title, description in style_options:
        is_selected = st.session_state.action_style == key
        
        if st.button(
            title,
            key=f"style_{key}",
            use_container_width=True,
            type="primary" if is_selected else "secondary"
        ):
            st.session_state.action_style = key
            st.rerun()
        
        if is_selected:
            st.markdown(f"""
            <div style="
                background: #e8f5e8;
                padding: 0.5rem;
                border-radius: 6px;
                margin-top: -0.5rem;
                margin-bottom: 0.5rem;
                font-size: 0.85rem;
                color: #2E5D31;
                font-style: italic;
                text-align: center;
            ">
                {description}
            </div>
            """, unsafe_allow_html=True)

def _render_impact_preferences(language):
    """Render impact preferences"""
    
    if language == 'czech':
        st.markdown("""
        #### 🌟 Typ dopadu
        *Jaký druh změny vás motivuje?*
        """)
        
        impact_options = [
            ("immediate", "⚡ Okamžitý", "Rychlé, viditelné výsledky"),
            ("long_term", "🌱 Dlouhodobý", "Trvalé systémové změny"),
            ("local", "🏘️ Místní", "Pomoc ve vašem okolí"),
            ("global", "🌍 Globální", "Celosvětové problémy"),
            ("personal", "💝 Osobní", "Individuální příběhy")
        ]
    else:
        st.markdown("""
        #### 🌟 Impact type
        *What kind of change motivates you?*
        """)
        
        impact_options = [
            ("immediate", "⚡ Immediate", "Quick, visible results"),
            ("long_term", "🌱 Long-term", "Lasting systemic changes"),
            ("local", "🏘️ Local", "Help in your area"),
            ("global", "🌍 Global", "Worldwide problems"),
            ("personal", "💝 Personal", "Individual stories")
        ]
    
    # Initialize if not set
    if 'impact_preference' not in st.session_state:
        st.session_state.impact_preference = None
    
    for key, title, description in impact_options:
        is_selected = st.session_state.impact_preference == key
        
        if st.button(
            title,
            key=f"impact_{key}",
            use_container_width=True,
            type="primary" if is_selected else "secondary"
        ):
            st.session_state.impact_preference = key
            st.rerun()
        
        if is_selected:
            st.markdown(f"""
            <div style="
                background: #e8f5e8;
                padding: 0.5rem;
                border-radius: 6px;
                margin-top: -0.5rem;
                margin-bottom: 0.5rem;
                font-size: 0.85rem;
                color: #2E5D31;
                font-style: italic;
                text-align: center;
            ">
                {description}
            </div>
            """, unsafe_allow_html=True)

def _show_beautiful_results(language):
    """Beautiful results page with personalized recommendations"""
    
    # Calculate matches and get recommendations
    causes = load_causes_data(language)
    actions = load_actions_data(language)
    
    if not causes or not actions:
        _show_beautiful_error_state(language)
        return
    
    # Get user profile
    user_profile = {
        'values': st.session_state.get('selected_values', []),
        'time_availability': st.session_state.get('time_availability'),
        'financial_capacity': st.session_state.get('financial_capacity'),
        'action_style': st.session_state.get('action_style'),
        'impact_preference': st.session_state.get('impact_preference')
    }
    
    # Calculate matches
    cause_matches = calculate_cause_matches(user_profile, causes)
    recommendations = get_personalized_recommendations(user_profile, actions, cause_matches)
    
    # Beautiful header
    if language == 'czech':
        st.markdown("""
        ### ✨ Vaše osobní cesta pomoci
        
        *Na základě vašich odpovědí jsme našli akce, které by vám mohly sedět.*
        """)
    else:
        st.markdown("""
        ### ✨ Your personal path of help
        
        *Based on your answers, we found actions that might fit you.*
        """)
    
    # Show beautiful recommendations
    _render_beautiful_recommendations(recommendations, language)
    
    # Show cause matches
    st.markdown("---")
    _render_beautiful_cause_matches(cause_matches, language)
    
    # Beautiful next steps
    st.markdown("---")
    _render_beautiful_next_steps_section(language)

def _render_beautiful_recommendations(recommendations, language):
    """Render beautiful action recommendations"""
    
    if not recommendations:
        if language == 'czech':
            st.warning("Omlouváme se, ale momentálně nemáme doporučení, která by přesně odpovídala vašim preferencím. Zkuste se podívat na rychlé akce nebo oblasti pomoci.")
        else:
            st.warning("Sorry, we don't currently have recommendations that exactly match your preferences. Try looking at quick actions or help areas.")
        return
    
    if language == 'czech':
        st.markdown("#### 🎯 Doporučené akce pro vás")
    else:
        st.markdown("#### 🎯 Recommended actions for you")
    
    # Show top 3-5 recommendations in beautiful cards
    for i, rec in enumerate(recommendations[:5]):
        action = rec['action']
        match_score = rec['match_score']
        
        # Beautiful action card
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
            border: 2px solid #7AB87A;
            border-radius: 15px;
            padding: 1.5rem;
            margin: 1rem 0;
            position: relative;
        ">
            <div style="
                position: absolute;
                top: -10px;
                right: 15px;
                background: #7AB87A;
                color: white;
                padding: 0.3rem 0.8rem;
                border-radius: 15px;
                font-size: 0.8rem;
                font-weight: 600;
            ">
                {match_score}% shoda
            </div>
            
            <h4 style="color: #2E5D31; margin-bottom: 0.5rem;">
                {action.get('icon', '🌟')} {action['title']}
            </h4>
            
            <p style="color: #5A6B5A; margin-bottom: 1rem; line-height: 1.5;">
                {action['description']}
            </p>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
                <span style="
                    background: #e8f5e8;
                    padding: 0.3rem 0.8rem;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    color: #2E5D31;
                ">⏱️ {action.get('time_commitment', 'Flexibilní')}</span>
                
                <span style="
                    background: #e8f5e8;
                    padding: 0.3rem 0.8rem;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    color: #2E5D31;
                ">💰 {action.get('cost', 'Zdarma')}</span>
            </div>
            
            <div style="
                background: #f0fff0;
                padding: 0.8rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                border-left: 3px solid #7AB87A;
            ">
                <strong style="color: #2E5D31;">💫 Dopad:</strong> {action.get('impact', 'Pozitivní změna')}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Action button
        if st.button(f"🚀 Začít: {action['title']}", key=f"action_{i}", use_container_width=True):
            # Track action selection and redirect
            st.session_state.selected_action = action
            st.session_state.current_page = 'quick_actions'
            st.rerun()

def _render_beautiful_cause_matches(cause_matches, language):
    """Render beautiful cause matches"""
    
    if language == 'czech':
        st.markdown("#### 🌍 Oblasti, které vám sedí")
        st.markdown("*Podle vašich hodnot jsme vybrali oblasti, kde můžete udělat největší rozdíl.*")
    else:
        st.markdown("#### 🌍 Areas that fit you")
        st.markdown("*Based on your values, we selected areas where you can make the biggest difference.*")
    
    # Show top matches in a beautiful grid
    cols = st.columns(2)
    
    for i, match in enumerate(cause_matches[:6]):
        cause = match['cause']
        score = match['match_score']
        
        with cols[i % 2]:
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #fafbfa 0%, #f0f8f0 100%);
                border: 1px solid #e8f5e8;
                border-radius: 12px;
                padding: 1.2rem;
                margin-bottom: 1rem;
                text-align: center;
                height: 150px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">
                    {cause.get('icon', '🌟')}
                </div>
                <h5 style="color: #2E5D31; margin-bottom: 0.5rem;">
                    {cause['title']}
                </h5>
                <div style="
                    background: #7AB87A;
                    color: white;
                    padding: 0.2rem 0.6rem;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    margin: 0 auto;
                ">
                    {score}% shoda
                </div>
            </div>
            """, unsafe_allow_html=True)

def _render_beautiful_next_steps_section(language):
    """Beautiful next steps section"""
    
    if language == 'czech':
        st.markdown("""
        ### 🌟 Co dál?
        
        *Vaše cesta začíná právě teď. Vyberte si, jak chcete pokračovat.*
        """)
    else:
        st.markdown("""
        ### 🌟 What's next?
        
        *Your journey starts right now. Choose how you want to continue.*
        """)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("⚡ Rychlé akce" if language == 'czech' else "⚡ Quick actions", use_container_width=True):
            st.session_state.current_page = 'quick_actions'
            st.rerun()
    
    with col2:
        if st.button("🌍 Všechny oblasti" if language == 'czech' else "🌍 All areas", use_container_width=True):
            st.session_state.current_page = 'causes'
            st.rerun()
    
    with col3:
        if st.button("📊 Můj dopad" if language == 'czech' else "📊 My impact", use_container_width=True):
            st.session_state.current_page = 'impact'
            st.rerun()
    
    # Option to retake assessment
    st.markdown("<div style='height: 1rem;'></div>", unsafe_allow_html=True)
    
    if st.button("🔄 Upravit mé odpovědi" if language == 'czech' else "🔄 Edit my answers", use_container_width=True):
        # Reset assessment
        st.session_state.assessment_step = 1
        st.rerun()

def _show_beautiful_error_state(language):
    """Beautiful error state when data can't be loaded"""
    
    if language == 'czech':
        st.markdown("""
        ### 😔 Něco se pokazilo
        
        Omlouváme se, ale momentálně nemůžeme načíst doporučení. 
        Zkuste to prosím znovu nebo se podívejte na rychlé akce.
        """)
    else:
        st.markdown("""
        ### 😔 Something went wrong
        
        Sorry, we can't load recommendations right now. 
        Please try again or check out quick actions.
        """)
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("🔄 Zkusit znovu" if language == 'czech' else "🔄 Try again", use_container_width=True):
            st.rerun()
    
    with col2:
        if st.button("⚡ Rychlé akce" if language == 'czech' else "⚡ Quick actions", use_container_width=True):
            st.session_state.current_page = 'quick_actions'
            st.rerun() 