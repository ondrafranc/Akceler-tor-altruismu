"""Assessment page - personalized path discovery"""

import streamlit as st
from utils.localization import get_text
from logic.encouragement import get_random_encouragement
from core.session import update_user_profile, get_user_profile
from data.loaders import load_causes_data
from logic.matching import calculate_cause_match, get_matching_actions
from logic.tracking import record_action_completion
from logic.encouragement import celebrate_action_completion
from datetime import datetime

def show_assessment_page():
    """A warmer, more narrative assessment experience."""
    language = st.session_state.language
    
    # Use warmer, more narrative headers
    if language == 'czech':
        st.markdown('<h1 class="main-header">Pojďme společně najít vaši cestu</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">Tato reflexe vám pomůže propojit vaše hodnoty s konkrétními, smysluplnými akcemi.</p>', unsafe_allow_html=True)
        steps = ["Vaše Hodnoty", "Vaše Možnosti", "Doporučení pro Vás"]
    else:
        st.markdown('<h1 class="main-header">Let\'s Find Your Path Together</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">This reflection will help connect your values with concrete, meaningful actions.</p>', unsafe_allow_html=True)
        steps = ["Your Values", "Your Resources", "Recommendations for You"]
    
    current_step = st.session_state.get('assessment_step', 0)
    
    if current_step > 0:
        progress = (current_step - 1) / (len(steps) - 1) if len(steps) > 1 else 1.0
        st.progress(progress)
        
        # More contextual encouragement
        if current_step == 1:
            encouragement = get_text('assessment_intro_encouragement', language)
        elif current_step == 2:
            encouragement = get_text('assessment_values_encouragement', language)
        else:
            encouragement = get_text('assessment_resources_encouragement', language)
        st.info(f"✨ {encouragement}")
        
        st.markdown(f'<p class="progress-text">{get_text("step", language)} {current_step} / {len(steps)}: <strong>{steps[current_step-1]}</strong></p>', unsafe_allow_html=True)
    
    if current_step == 0:
        if language == 'czech':
            st.info("👈 Začni posouzení na úvodní stránce!")
        else:
            st.info("👈 Start your assessment from the Welcome page!")
        return
    elif current_step == 1:
        show_values_step()
    elif current_step == 2:
        show_resources_step()
    elif current_step == 3:
        show_recommendations_step()

def show_values_step():
    """Values assessment with Czech adaptation"""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown("### Co je pro vás nejdůležitější?")
        st.markdown("Začněme tím, na čem vám záleží. Vyberte až 3 hodnoty, které s vámi nejvíce rezonují:")
        
        values_options = [
            "🌍 Chránit naši planetu a přírodu",
            "📚 Umožnit vzdělání a růst druhým", 
            "⚖️ Bojovat za spravedlnost a rovné příležitosti",
            "❤️ Zmírňovat utrpení a poskytovat útěchu",
            "🤝 Posilovat komunitu a mezilidské vztahy",
            "💼 Podporovat ekonomickou soběstačnost",
            "🔬 Důvěřovat vědě a podporovat pokrok",
            "🎨 Obohacovat svět kulturou a uměním"
        ]
        help_text = "Vaše hodnoty nám pomohou najít aktivity, které pro vás budou mít hluboký smysl."
    else:
        st.markdown("### What matters most to you?")
        st.markdown("Let's start with what you care about. Choose up to 3 values that resonate most with you:")
        
        values_options = [
            "🌍 Protecting our planet and nature",
            "📚 Enabling education and growth for others", 
            "⚖️ Fighting for justice and equal opportunities",
            "❤️ Easing suffering and providing comfort",
            "🤝 Strengthening community and relationships",
            "💼 Supporting economic self-sufficiency",
            "🔬 Trusting in science and supporting progress",
            "🎨 Enriching the world with culture and arts"
        ]
        help_text = "Your values will help us find activities that feel truly meaningful to you."
    
    selected_values = st.multiselect(
        "Vyber až 3 hodnoty:" if language == 'czech' else "Choose up to 3 values:",
        values_options,
        key="user_values",
        max_selections=3,
        help=help_text
    )
    
    if len(selected_values) > 0:
        if language == 'czech':
            values_text = ', '.join([v.split(' ', 1)[1] for v in selected_values])
            st.success(f"✨ Vybral/a jsi: {values_text}")
        else:
            values_text = ', '.join([v.split(' ', 1)[1] for v in selected_values])
            st.success(f"✨ You selected: {values_text}")
        
        update_user_profile({'values': selected_values})
        
        next_text = "Pokračovat k mým možnostem →" if language == 'czech' else "Continue to My Resources →"
        if st.button(next_text, type="primary"):
            st.session_state.assessment_step = 2
            st.rerun()
    else:
        info_text = "💭 Prosím vyber alespoň jednu hodnotu pro pokračování." if language == 'czech' else "💭 Please select at least one value to continue."
        st.info(info_text)

def show_resources_step():
    """Resources assessment with Czech adaptation"""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown("### Co můžeš přispět?")
    else:
        st.markdown("### What can you contribute?")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if language == 'czech':
            st.markdown("**⏰ Čas k dispozici týdně:**")
            time_options = ["30 minut nebo méně", "1-2 hodiny", "3-5 hodin", "10+ hodin"]
            help_text = "Buď upřímný/á ohledně toho, co je pro tebe udržitelné"
        else:
            st.markdown("**⏰ Time Available per Week:**")
            time_options = ["30 minutes or less", "1-2 hours", "3-5 hours", "10+ hours"]
            help_text = "Be honest about what's sustainable for you"
        
        time_available = st.radio(
            "Kolik času můžeš obvykle věnovat?" if language == 'czech' else "How much time can you typically contribute?",
            time_options,
            key="time_available",
            help=help_text
        )
        
        if language == 'czech':
            st.markdown("**🎯 Dovednosti a zájmy:**")
            skills_options = ["Psaní/Komunikace", "Technologie/Programování", "Učení/Mentoring", 
                            "Plánování akcí", "Výzkum/Analýza", "Tvůrčí umění", "Fyzická práce"]
        else:
            st.markdown("**🎯 Skills & Interests:**")
            skills_options = ["Writing/Communication", "Technology/Programming", "Teaching/Mentoring", 
                            "Event Planning", "Research/Analysis", "Creative Arts", "Physical Labor"]
        
        skills = st.multiselect(
            "V čem jsi dobrý/á nebo co tě zajímá?" if language == 'czech' else "What are you good at or interested in?",
            skills_options,
            key="user_skills"
        )
    
    with col2:
        if language == 'czech':
            st.markdown("**💰 Finanční možnosti:**")
            budget_options = ["Momentálně nic", "Do 250 Kč", "Do 1250 Kč", "2500+ Kč"]
        else:
            st.markdown("**💰 Financial Capacity:**")
            budget_options = ["Nothing right now", "Up to $10", "Up to $50", "$100+"]
        
        financial_capacity = st.radio(
            "Kolik můžeš měsíčně přispět?" if language == 'czech' else "How much can you contribute monthly?",
            budget_options,
            key="financial_capacity"
        )
    
    # Save to profile
    update_user_profile({
        'time_available': time_available,
        'skills': skills,
        'financial_capacity': financial_capacity
    })
    
    col_back, col_next = st.columns(2)
    with col_back:
        back_text = "← Zpět" if language == 'czech' else "← Back"
        if st.button(back_text):
            st.session_state.assessment_step = 1
            st.rerun()
    with col_next:
        next_text = "Najít má doporučení! 🎯" if language == 'czech' else "Find My Recommendations! 🎯"
        if st.button(next_text, type="primary"):
            st.session_state.assessment_step = 3
            st.rerun()

def show_recommendations_step():
    """Enhanced recommendations with advanced matching"""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown('<h1 class="main-header">🎯 Tvoje osobní cesta k dopadu</h1>', unsafe_allow_html=True)
        st.markdown("### 🌟 Na základě tvých hodnot a zdrojů:")
    else:
        st.markdown('<h1 class="main-header">🎯 Your Personalized Path to Impact</h1>', unsafe_allow_html=True)
        st.markdown("### 🌟 Based on your values and resources:")
    
    causes_data = load_causes_data(language)
    user_profile = get_user_profile()
    
    if not causes_data:
        error_text = "Nelze načíst data o oblastech. Zkontrolujte datové soubory." if language == 'czech' else "Unable to load causes data. Please check your data files."
        st.error(error_text)
        return
    
    # Calculate cause matches with advanced algorithm
    cause_matches = []
    for cause_id, cause_info in causes_data.items():
        match_score = calculate_cause_match(
            user_profile.get('values', []), 
            cause_info.get('values_alignment', [])
        )
        cause_matches.append((cause_id, cause_info, match_score))
    
    # Sort by match score
    cause_matches.sort(key=lambda x: x[2], reverse=True)
    
    # Show top 3 matches
    st.markdown('<div class="action-grid">', unsafe_allow_html=True)
    cols = st.columns(len(cause_matches[:3]))
    
    for i, (cause_id, cause_info, match_score) in enumerate(cause_matches[:3]):
        with cols[i]:
            match_percentage = int(match_score * 100)
            st.markdown(f"""
            <div class="cause-card" style="height: 100%;">
                <h3 style="font-size: 1.2rem;">{cause_info.get('emoji', '🎯')} {cause_info.get('title', 'Unknown Cause')}</h3>
                <p><span style="color: #2E5D31; font-weight: bold;">{match_percentage}% shoda</span></p>
                <p style="font-size: 0.9rem;">{cause_info.get('description', 'No description available')}</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Get matching actions
            matching_actions = get_matching_actions(cause_id, user_profile, language)
            
            if matching_actions:
                perfect_text = "**Doporučené akce:**" if language == 'czech' else "**Recommended Actions:**"
                st.markdown(perfect_text)
                
                for action in matching_actions[:1]:  # Show top 1 action per cause
                    _render_recommended_action(action, cause_id, cause_info)
            else:
                no_actions_text = "Nenašli jsme konkrétní akci, ale brzy přidáme další!" if language == 'czech' else "We couldn't find a specific action, but more are coming soon!"
                st.info(no_actions_text)
                
    st.markdown('</div>', unsafe_allow_html=True)

def _render_recommended_action(action, cause_id, cause_info):
    """Renders a single recommended action card, consistent with quick actions."""
    language = st.session_state.language
    requirements = action.get('requirements', {})
    
    if language == 'czech':
        cost_czk = requirements.get('cost_usd', 0) * 25
        req_string = f"⏱️ {requirements.get('time_minutes', 0)} min | 💰 {int(cost_czk)} Kč"
    else:
        req_string = f"⏱️ {requirements.get('time_minutes', 0)} min | 💰 ${requirements.get('cost_usd', 0)}"

    st.markdown(f"""
    <div class="action-card" style="margin-top: 1rem;">
        <h4>{action.get('title', 'Unknown Action')}</h4>
        <p style="margin: 0.5rem 0; font-size: 0.9rem;">{action.get('description', 'No description')}</p>
        <div style="margin: 1rem 0;">
            <span style="background: #E8F5E8; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">{req_string}</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    start_text = get_text('start_action', language)
    if st.button(f"{start_text}", key=f"action_{action.get('id', cause_id)}", type="primary"):
        action_data = {
            'category': cause_id,
            'time_minutes': requirements.get('time_minutes', 5),
            'cost_estimate': requirements.get('cost_usd', 0),
            'source': 'assessment'
        }
        record_action_completion(action.get('title', 'Unknown Action'), action_data, language)
        
        cause_title = cause_info.get('title', 'this cause')
        celebrate_action_completion(action.get('title', 'this action'), cause_title, language)
        
        org_website = action.get('organization', {}).get('website')
        if org_website and org_website != '#':
            complete_text = get_text('complete_action', language)
            st.success(f"Skvělé! [{complete_text}]({org_website})") 