"""Enhanced assessment page with comprehensive UX improvements and user support"""

import streamlit as st
from datetime import datetime
from utils.localization import get_text, get_accessibility_text
from logic.matching import get_personalized_recommendations
from core.session import (update_user_profile, track_assessment_progress, 
                         save_assessment_state, load_assessment_state,
                         track_page_visit, get_user_behavior_insights,
                         detect_assessment_inconsistencies)
from components.emergency_help import check_distress_indicators

def show_assessment_page():
    """Enhanced assessment page with comprehensive UX improvements"""
    language = st.session_state.language
    track_page_visit('assessment')
    
    # Load saved assessment state if available
    load_assessment_state()
    
    st.markdown('<div class="content-container">', unsafe_allow_html=True)
    
    # Enhanced header with progress and support
    _render_assessment_header(language)
    
    # Show assessment based on current step
    if st.session_state.assessment_step == 1:
        _show_values_step(language)
    elif st.session_state.assessment_step == 2:
        _show_resources_step(language)
    elif st.session_state.assessment_step == 3:
        _show_preferences_step(language)
    elif st.session_state.assessment_step == 4:
        _show_confirmation_step(language)
    else:
        _show_complete_assessment(language)
    
    # Always show save and return option
    _show_save_and_return_option(language)
    
    st.markdown('</div>', unsafe_allow_html=True)

def _render_assessment_header(language):
    """Render enhanced assessment header with progress and support"""
    
    if language == 'czech':
        st.markdown("# 🧭 Vaše cesta k pomoci")
        st.markdown("*Krátká reflexe vašich hodnot a možností*")
    else:
        st.markdown("# 🧭 Your Path to Help")
        st.markdown("*Brief reflection on your values and resources*")
    
    # Enhanced progress indicator
    progress = max(0, (st.session_state.assessment_step - 1) / 4)
    st.progress(progress)
    
    progress_text = f"Krok {st.session_state.assessment_step} ze 4" if language == 'czech' else f"Step {st.session_state.assessment_step} of 4"
    st.markdown(f'<p class="progress-text">{progress_text}</p>', unsafe_allow_html=True)
    
    # Reassuring message
    if language == 'czech':
        st.info("💡 **Tip:** Neexistují špatné odpovědi. Můžete se kdykoliv vrátit a změnit své volby.")
    else:
        st.info("💡 **Tip:** There are no wrong answers. You can always go back and change your choices.")

def _show_values_step(language):
    """Enhanced values selection step with better UX"""
    
    if language == 'czech':
        st.markdown("### 💚 Co je pro vás důležité?")
        st.markdown("Vyberte hodnoty, které rezonují s vaším pohledem na svět. Pomůže nám to najít akce, které budou mít pro vás smysl.")
        
        value_options = [
            ("environment", "🌍 Ochrana životního prostředí"),
            ("education", "📚 Vzdělávání a rozvoj"),
            ("health", "🏥 Zdraví a pohoda"),
            ("poverty", "🤝 Boj proti chudobě"),
            ("equality", "⚖️ Rovnost a spravedlnost"),
            ("community", "🏘️ Místní komunita"),
            ("animals", "🐾 Ochrana zvířat"),
            ("technology", "💻 Technologie pro dobro"),
            ("arts", "🎨 Kultura a umění"),
            ("elderly", "👴 Péče o seniory")
        ]
        help_text = "Vyberte 2-5 hodnot, které jsou vám nejblíž"
    else:
        st.markdown("### 💚 What matters to you?")
        st.markdown("Select values that resonate with your worldview. This helps us find actions that will be meaningful to you.")
        
        value_options = [
            ("environment", "🌍 Environmental protection"),
            ("education", "📚 Education and development"),
            ("health", "🏥 Health and wellbeing"),
            ("poverty", "🤝 Fighting poverty"),
            ("equality", "⚖️ Equality and justice"),
            ("community", "🏘️ Local community"),
            ("animals", "🐾 Animal protection"),
            ("technology", "💻 Technology for good"),
            ("arts", "🎨 Culture and arts"),
            ("elderly", "👴 Elder care")
        ]
        help_text = "Select 2-5 values that are closest to you"
    
    # Enhanced multiselect with better styling
    selected_values = st.multiselect(
        "Vaše hodnoty:" if language == 'czech' else "Your values:",
        [opt[1] for opt in value_options],
        default=st.session_state.user_profile.get('values', []),
        help=help_text,
        key="values_multiselect"
    )
    
    # Convert back to keys
    value_keys = [key for key, label in value_options if label in selected_values]
    
    # Gentle validation and guidance
    if len(value_keys) == 0:
        st.info("💭 Zatím jste nevybrali žádné hodnoty. To je v pořádku - můžete pokračovat a vrátit se později." if language == 'czech' else "💭 You haven't selected any values yet. That's okay - you can continue and come back later.")
    elif len(value_keys) == 1:
        st.success("✨ Skvělý začátek! Možná byste chtěli vybrat ještě jednu nebo dvě hodnoty?" if language == 'czech' else "✨ Great start! Perhaps you'd like to select one or two more values?")
    elif len(value_keys) > 5:
        st.warning("🤔 Vybrali jste hodně hodnot. To je skvělé! Možná se zaměřte na 3-5 nejdůležitějších?" if language == 'czech' else "🤔 You've selected many values. That's great! Perhaps focus on the 3-5 most important ones?")
    else:
        st.success(f"💚 Výborně! Vybrali jste {len(value_keys)} hodnot." if language == 'czech' else f"💚 Excellent! You've selected {len(value_keys)} values.")
    
    # Update profile
    update_user_profile({'values': value_keys})
    track_assessment_progress('values', len(value_keys))
    
    # Navigation with enhanced UX
    _show_step_navigation(language, can_proceed=True, current_step=1)

def _show_resources_step(language):
    """Enhanced resources step with better guidance"""
    
    if language == 'czech':
        st.markdown("### ⏰ Kolik času a energie máte?")
        st.markdown("Buďte upřímní - respektujeme vaše možnosti a najdeme akce, které se hodí do vašeho života.")
    else:
        st.markdown("### ⏰ How much time and energy do you have?")
        st.markdown("Be honest - we respect your capacity and will find actions that fit your life.")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if language == 'czech':
            time_options = [
                ("minimal", "5-15 minut týdně"),
                ("moderate", "1-2 hodiny týdně"),
                ("significant", "3-5 hodin týdně"),
                ("major", "Více než 5 hodin týdně")
            ]
            time_commitment = st.radio(
                "Časové možnosti:",
                [opt[1] for opt in time_options],
                index=next((i for i, (key, _) in enumerate(time_options) if key == st.session_state.user_profile.get('time_commitment')), 0),
                help="Vyberte realisticky podle vašeho současného rozvrhu",
                key="time_radio"
            )
        else:
            time_options = [
                ("minimal", "5-15 minutes per week"),
                ("moderate", "1-2 hours per week"),
                ("significant", "3-5 hours per week"),
                ("major", "More than 5 hours per week")
            ]
            time_commitment = st.radio(
                "Time availability:",
                [opt[1] for opt in time_options],
                index=next((i for i, (key, _) in enumerate(time_options) if key == st.session_state.user_profile.get('time_commitment')), 0),
                help="Choose realistically based on your current schedule",
                key="time_radio_en"
            )
    
    with col2:
        if language == 'czech':
            financial_options = [
                ("none", "Pouze čas a dovednosti"),
                ("small", "Do 500 Kč měsíčně"),
                ("moderate", "500-2000 Kč měsíčně"),
                ("significant", "Více než 2000 Kč měsíčně")
            ]
            financial_capacity = st.radio(
                "Finanční možnosti:",
                [opt[1] for opt in financial_options],
                index=next((i for i, (key, _) in enumerate(financial_options) if key == st.session_state.user_profile.get('financial_capacity')), 0),
                help="Žádná částka není příliš malá - každý příspěvek má význam",
                key="financial_radio"
            )
        else:
            financial_options = [
                ("none", "Only time and skills"),
                ("small", "Up to $20 monthly"),
                ("moderate", "$20-80 monthly"),
                ("significant", "More than $80 monthly")
            ]
            financial_capacity = st.radio(
                "Financial capacity:",
                [opt[1] for opt in financial_options],
                index=next((i for i, (key, _) in enumerate(financial_options) if key == st.session_state.user_profile.get('financial_capacity')), 0),
                help="No amount is too small - every contribution matters",
                key="financial_radio_en"
            )
    
    # Convert selections to keys
    time_key = next((key for key, label in time_options if label == time_commitment), "minimal")
    financial_key = next((key for key, label in financial_options if label == financial_capacity), "none")
    
    # Encouraging feedback
    if time_key == "minimal" and financial_key == "none":
        st.success("💚 I malé kroky mají velký dopad! Najdeme akce, které se hodí do vašeho života." if language == 'czech' else "💚 Even small steps have big impact! We'll find actions that fit your life.")
    elif time_key in ["significant", "major"] or financial_key in ["moderate", "significant"]:
        st.success("🌟 Máte skvělé možnosti pomoci! Najdeme pro vás smysluplné projekty." if language == 'czech' else "🌟 You have great capacity to help! We'll find meaningful projects for you.")
    else:
        st.success("✨ Perfektní! Vaše možnosti nám pomohou najít správné akce." if language == 'czech' else "✨ Perfect! Your capacity helps us find the right actions.")
    
    # Update profile
    update_user_profile({
        'time_commitment': time_key,
        'financial_capacity': financial_key
    })
    track_assessment_progress('resources', 2)
    
    # Navigation
    _show_step_navigation(language, can_proceed=True, current_step=2)

def _show_preferences_step(language):
    """Enhanced preferences step with better explanations"""
    
    if language == 'czech':
        st.markdown("### 🎯 Jaký typ pomoci vás přitahuje?")
        st.markdown("Pomůže nám to najít akce, které budou odpovídat vašemu stylu a preferencím.")
    else:
        st.markdown("### 🎯 What type of help appeals to you?")
        st.markdown("This helps us find actions that match your style and preferences.")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if language == 'czech':
            st.markdown("**Způsob pomoci:**")
            action_type_options = [
                ("direct", "🤝 Přímá pomoc lidem"),
                ("indirect", "🌱 Systémové změny"),
                ("both", "🔄 Kombinace obojího")
            ]
            action_type = st.radio(
                "Preferujete:",
                [opt[1] for opt in action_type_options],
                index=next((i for i, (key, _) in enumerate(action_type_options) if key == st.session_state.user_profile.get('action_type')), 2),
                help="Přímá pomoc = konkrétní lidem, Systémové = dlouhodobé změny",
                key="action_type_radio"
            )
        else:
            st.markdown("**Type of help:**")
            action_type_options = [
                ("direct", "🤝 Direct help to people"),
                ("indirect", "🌱 Systemic changes"),
                ("both", "🔄 Combination of both")
            ]
            action_type = st.radio(
                "You prefer:",
                [opt[1] for opt in action_type_options],
                index=next((i for i, (key, _) in enumerate(action_type_options) if key == st.session_state.user_profile.get('action_type')), 2),
                help="Direct = specific people, Systemic = long-term changes",
                key="action_type_radio_en"
            )
    
    with col2:
        if language == 'czech':
            st.markdown("**Způsob zapojení:**")
            involvement_options = [
                ("online", "💻 Online aktivity"),
                ("offline", "🏃 Osobní účast"),
                ("flexible", "🔄 Flexibilní kombinace")
            ]
            involvement = st.radio(
                "Preferujete:",
                [opt[1] for opt in involvement_options],
                index=next((i for i, (key, _) in enumerate(involvement_options) if key == st.session_state.user_profile.get('involvement_type')), 2),
                help="Online = z domova, Offline = fyzická přítomnost",
                key="involvement_radio"
            )
        else:
            st.markdown("**Type of involvement:**")
            involvement_options = [
                ("online", "💻 Online activities"),
                ("offline", "🏃 In-person participation"),
                ("flexible", "🔄 Flexible combination")
            ]
            involvement = st.radio(
                "You prefer:",
                [opt[1] for opt in involvement_options],
                index=next((i for i, (key, _) in enumerate(involvement_options) if key == st.session_state.user_profile.get('involvement_type')), 2),
                help="Online = from home, Offline = physical presence",
                key="involvement_radio_en"
            )
    
    # Convert to keys
    action_key = next((key for key, label in action_type_options if label == action_type), "both")
    involvement_key = next((key for key, label in involvement_options if label == involvement), "flexible")
    
    # Geographic preference
    if language == 'czech':
        st.markdown("**Geografické zaměření:**")
        geographic_options = [
            ("local", "🏘️ Místní komunita"),
            ("national", "🇨🇿 Česká republika"),
            ("global", "🌍 Celosvětově"),
            ("flexible", "🔄 Bez preference")
        ]
        geographic = st.selectbox(
            "Kde chcete pomáhat:",
            [opt[1] for opt in geographic_options],
            index=next((i for i, (key, _) in enumerate(geographic_options) if key == st.session_state.user_profile.get('geographic_focus')), 3),
            help="Vyberte oblast, která vás nejvíce zajímá",
            key="geographic_select"
        )
    else:
        st.markdown("**Geographic focus:**")
        geographic_options = [
            ("local", "🏘️ Local community"),
            ("national", "🇨🇿 Czech Republic"),
            ("global", "🌍 Worldwide"),
            ("flexible", "🔄 No preference")
        ]
        geographic = st.selectbox(
            "Where do you want to help:",
            [opt[1] for opt in geographic_options],
            index=next((i for i, (key, _) in enumerate(geographic_options) if key == st.session_state.user_profile.get('geographic_focus')), 3),
            help="Choose the area that interests you most",
            key="geographic_select_en"
        )
    
    geographic_key = next((key for key, label in geographic_options if label == geographic), "flexible")
    
    # Encouraging message
    st.success("🎯 Skvělé! Vaše preference nám pomohou najít akce přesně pro vás." if language == 'czech' else "🎯 Great! Your preferences help us find actions just for you.")
    
    # Update profile
    update_user_profile({
        'action_type': action_key,
        'involvement_type': involvement_key,
        'geographic_focus': geographic_key
    })
    track_assessment_progress('preferences', 3)
    
    # Navigation
    _show_step_navigation(language, can_proceed=True, current_step=3)

def _show_confirmation_step(language):
    """Enhanced confirmation step with inconsistency checks"""
    
    if language == 'czech':
        st.markdown("### ✅ Shrnutí vašeho profilu")
        st.markdown("Zkontrolujte své odpovědi. Můžete se vrátit a upravit cokoliv.")
    else:
        st.markdown("### ✅ Your Profile Summary")
        st.markdown("Review your answers. You can go back and adjust anything.")
    
    # Show profile summary
    profile = st.session_state.user_profile
    
    # Check for inconsistencies
    inconsistencies = detect_assessment_inconsistencies(profile)
    if inconsistencies:
        _show_inconsistency_check(language, inconsistencies)
    
    # Display profile in a nice format
    col1, col2 = st.columns(2)
    
    with col1:
        if language == 'czech':
            st.markdown("#### 💚 Vaše hodnoty:")
            if profile.get('values'):
                for value in profile['values']:
                    value_labels = {
                        'environment': '🌍 Životní prostředí',
                        'education': '📚 Vzdělávání',
                        'health': '🏥 Zdraví',
                        'poverty': '🤝 Boj proti chudobě',
                        'equality': '⚖️ Rovnost',
                        'community': '🏘️ Komunita',
                        'animals': '🐾 Zvířata',
                        'technology': '💻 Technologie',
                        'arts': '🎨 Umění',
                        'elderly': '👴 Senioři'
                    }
                    st.write(f"- {value_labels.get(value, value)}")
            else:
                st.write("*Žádné hodnoty nevybrány*")
            
            st.markdown("#### ⏰ Vaše možnosti:")
            time_labels = {
                'minimal': '5-15 minut týdně',
                'moderate': '1-2 hodiny týdně',
                'significant': '3-5 hodin týdně',
                'major': 'Více než 5 hodin týdně'
            }
            financial_labels = {
                'none': 'Pouze čas a dovednosti',
                'small': 'Do 500 Kč měsíčně',
                'moderate': '500-2000 Kč měsíčně',
                'significant': 'Více než 2000 Kč měsíčně'
            }
            st.write(f"⏰ **Čas:** {time_labels.get(profile.get('time_commitment'), 'Nevybráno')}")
            st.write(f"💰 **Finance:** {financial_labels.get(profile.get('financial_capacity'), 'Nevybráno')}")
        else:
            st.markdown("#### 💚 Your values:")
            if profile.get('values'):
                for value in profile['values']:
                    value_labels = {
                        'environment': '🌍 Environment',
                        'education': '📚 Education',
                        'health': '🏥 Health',
                        'poverty': '🤝 Poverty',
                        'equality': '⚖️ Equality',
                        'community': '🏘️ Community',
                        'animals': '🐾 Animals',
                        'technology': '💻 Technology',
                        'arts': '🎨 Arts',
                        'elderly': '👴 Elderly'
                    }
                    st.write(f"- {value_labels.get(value, value)}")
            else:
                st.write("*No values selected*")
            
            st.markdown("#### ⏰ Your capacity:")
            time_labels = {
                'minimal': '5-15 minutes per week',
                'moderate': '1-2 hours per week',
                'significant': '3-5 hours per week',
                'major': 'More than 5 hours per week'
            }
            financial_labels = {
                'none': 'Only time and skills',
                'small': 'Up to $20 monthly',
                'moderate': '$20-80 monthly',
                'significant': 'More than $80 monthly'
            }
            st.write(f"⏰ **Time:** {time_labels.get(profile.get('time_commitment'), 'Not selected')}")
            st.write(f"💰 **Finance:** {financial_labels.get(profile.get('financial_capacity'), 'Not selected')}")
    
    with col2:
        if language == 'czech':
            st.markdown("#### 🎯 Vaše preference:")
            action_labels = {
                'direct': '🤝 Přímá pomoc',
                'indirect': '🌱 Systémové změny',
                'both': '🔄 Kombinace'
            }
            involvement_labels = {
                'online': '💻 Online',
                'offline': '🏃 Osobní účast',
                'flexible': '🔄 Flexibilní'
            }
            geographic_labels = {
                'local': '🏘️ Místní',
                'national': '🇨🇿 Národní',
                'global': '🌍 Globální',
                'flexible': '🔄 Flexibilní'
            }
            st.write(f"🎯 **Typ pomoci:** {action_labels.get(profile.get('action_type'), 'Nevybráno')}")
            st.write(f"💻 **Zapojení:** {involvement_labels.get(profile.get('involvement_type'), 'Nevybráno')}")
            st.write(f"🌍 **Oblast:** {geographic_labels.get(profile.get('geographic_focus'), 'Nevybráno')}")
        else:
            st.markdown("#### 🎯 Your preferences:")
            action_labels = {
                'direct': '🤝 Direct help',
                'indirect': '🌱 Systemic changes',
                'both': '🔄 Combination'
            }
            involvement_labels = {
                'online': '💻 Online',
                'offline': '🏃 In-person',
                'flexible': '🔄 Flexible'
            }
            geographic_labels = {
                'local': '🏘️ Local',
                'national': '🇨🇿 National',
                'global': '🌍 Global',
                'flexible': '🔄 Flexible'
            }
            st.write(f"🎯 **Type:** {action_labels.get(profile.get('action_type'), 'Not selected')}")
            st.write(f"💻 **Involvement:** {involvement_labels.get(profile.get('involvement_type'), 'Not selected')}")
            st.write(f"🌍 **Area:** {geographic_labels.get(profile.get('geographic_focus'), 'Not selected')}")
    
    # Completion encouragement
    if profile.get('values') and profile.get('time_commitment'):
        st.success("🎉 Váš profil je kompletní! Připraveni najít vaše doporučené akce?" if language == 'czech' else "🎉 Your profile is complete! Ready to find your recommended actions?")
    else:
        st.info("💭 Můžete pokračovat i s neúplným profilem, ale více informací nám pomůže najít lepší doporučení." if language == 'czech' else "💭 You can continue with an incomplete profile, but more information helps us find better recommendations.")
    
    track_assessment_progress('confirmation', 4)
    
    # Navigation
    _show_step_navigation(language, can_proceed=True, current_step=4, is_final=True)

def _show_complete_assessment(language):
    """Show assessment completion and recommendations"""
    
    if language == 'czech':
        st.markdown("# 🎉 Vaše cesta je připravena!")
        st.markdown("Na základě vašich odpovědí jsme připravili doporučení přesně pro vás.")
    else:
        st.markdown("# 🎉 Your journey is ready!")
        st.markdown("Based on your answers, we've prepared recommendations just for you.")
    
    # Generate recommendations
    try:
        recommendations = get_personalized_recommendations(st.session_state.user_profile, language)
        
        if recommendations:
            if language == 'czech':
                st.success(f"✨ Našli jsme {len(recommendations)} akcí, které by vás mohly zajímat!")
            else:
                st.success(f"✨ We found {len(recommendations)} actions that might interest you!")
            
            # Show top recommendations preview
            for i, rec in enumerate(recommendations[:3]):
                with st.expander(f"🎯 {rec['title']}", expanded=i==0):
                    st.markdown(rec['description'])
                    if rec.get('time_estimate'):
                        st.caption(f"⏰ {rec['time_estimate']}")
                    if rec.get('impact_potential'):
                        st.caption(f"💫 {rec['impact_potential']}")
        else:
            if language == 'czech':
                st.info("🔍 Připravujeme vaše doporučení... Mezitím můžete prozkoumat rychlé akce!")
            else:
                st.info("🔍 Preparing your recommendations... Meanwhile, you can explore quick actions!")
    
    except Exception as e:
        st.error("Omlouváme se, při generování doporučení došlo k chybě." if language == 'czech' else "Sorry, there was an error generating recommendations.")
    
    # Navigation to other sections
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("⚡ Rychlé akce" if language == 'czech' else "⚡ Quick actions", use_container_width=True):
            st.session_state.current_page = 'quick_actions'
            st.rerun()
    with col2:
        if st.button("🌍 Prozkoumat oblasti" if language == 'czech' else "🌍 Explore areas", use_container_width=True):
            st.session_state.current_page = 'causes'
            st.rerun()
    with col3:
        if st.button("📊 Můj dopad" if language == 'czech' else "📊 My impact", use_container_width=True):
            st.session_state.current_page = 'impact'
            st.rerun()

def _show_step_navigation(language, can_proceed=True, current_step=1, is_final=False):
    """Enhanced step navigation with better UX"""
    
    st.markdown("---")
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col1:
        if current_step > 1:
            if st.button("← Zpět" if language == 'czech' else "← Back", use_container_width=True):
                st.session_state.assessment_step = current_step - 1
                st.rerun()
    
    with col2:
        # Save progress automatically
        save_assessment_state()
        
        # Show gentle nudges for incomplete sections
        if not can_proceed:
            st.info("💭 Dokončete tento krok pro pokračování" if language == 'czech' else "💭 Complete this step to continue")
    
    with col3:
        if is_final:
            if st.button("🎉 Dokončit" if language == 'czech' else "🎉 Complete", type="primary", use_container_width=True):
                st.session_state.assessment_step = 5
                st.rerun()
        elif can_proceed:
            if st.button("Pokračovat →" if language == 'czech' else "Continue →", type="primary", use_container_width=True):
                st.session_state.assessment_step = current_step + 1
                st.rerun()

def _show_save_and_return_option(language):
    """Show save and return later option"""
    
    with st.expander("💾 Uložit a vrátit se později" if language == 'czech' else "💾 Save and return later", expanded=False):
        if language == 'czech':
            st.markdown("""
            **Můžete kdykoliv odejít a vrátit se.**
            
            Vaše odpovědi se automaticky ukládají. Když se vrátíte, budete pokračovat tam, kde jste skončili.
            
            Žádný spěch - jde o vaši cestu.
            """)
        else:
            st.markdown("""
            **You can leave anytime and come back.**
            
            Your answers are automatically saved. When you return, you'll continue where you left off.
            
            No rush - this is your journey.
            """)
        
        if st.button("🏠 Vrátit se na úvod" if language == 'czech' else "🏠 Return to welcome", use_container_width=True):
            save_assessment_state()
            st.session_state.current_page = 'welcome'
            st.rerun()

def _show_inconsistency_check(language, inconsistencies):
    """Show gentle inconsistency check"""
    
    if language == 'czech':
        st.warning("🤔 **Malá kontrola:** Všimli jsme si možného nesouladu ve vašich odpovědích.")
    else:
        st.warning("🤔 **Quick check:** We noticed a possible inconsistency in your answers.")
    
    for inconsistency in inconsistencies:
        if language == 'czech':
            st.write(f"• {inconsistency['message_czech']}")
        else:
            st.write(f"• {inconsistency['message_english']}")
    
    if language == 'czech':
        st.info("💡 To je v pořádku! Můžete pokračovat nebo se vrátit a upravit odpovědi. Neexistují špatné volby.")
    else:
        st.info("💡 That's okay! You can continue or go back and adjust your answers. There are no wrong choices.") 