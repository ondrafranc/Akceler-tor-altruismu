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
    """A gentle, clear assessment experience with grouped steps and clear progress."""
    language = st.session_state.language
    if language == 'czech':
        st.markdown('<h1 class="main-header">Pojďme společně najít vaši cestu</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">Tato krátká reflexe vám pomůže propojit vaše hodnoty s konkrétními, smysluplnými akcemi, které vám budou dávat smysl.</p>', unsafe_allow_html=True)
        steps = ["Na čem vám záleží", "Vaše možnosti", "Doporučení pro vás"]
    else:
        st.markdown('<h1 class="main-header">Let\'s Find Your Path Together</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">This brief reflection will help connect your values with concrete, meaningful actions that feel right for you.</p>', unsafe_allow_html=True)
        steps = ["What You Care About", "Your Resources", "Recommendations For You"]
    current_step = st.session_state.get('assessment_step', 0)
    if current_step > 0:
        progress = (current_step) / len(steps)
        st.progress(progress)
        if current_step == 1:
            encouragement = get_text('assessment_intro_encouragement', language)
        elif current_step == 2:
            encouragement = get_text('assessment_values_encouragement', language)
        else:
            encouragement = get_text('assessment_resources_encouragement', language)
        st.info(f"✨ {encouragement}")
        st.markdown(f'<p class="progress-text">{get_text("step", language)} {current_step} / {len(steps)}: <strong>{steps[current_step-1]}</strong></p>', unsafe_allow_html=True)
    if current_step == 0:
        st.info("👈 " + ("Svou cestu můžete začít na Úvodní stránce!" if language == 'czech' else "You can begin your path on the Start Here page!"))
        return
    elif current_step == 1:
        col1, col2 = st.columns([2, 2])
        with col1:
            show_values_step()
        with col2:
            show_resources_step(show_next=False)
    elif current_step == 2:
        show_resources_step(show_next=True)
    elif current_step == 3:
        show_recommendations_step()

def show_values_step():
    """Values assessment with warmer, more inviting language."""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown("### Co je pro vás v životě nejdůležitější?")
        st.markdown("Začněme tím, co vám dává smysl. Vyberte až 3 hodnoty, které s vámi nejvíce rezonují. Pomůže nám to najít aktivity, které pro vás budou skutečně naplňující.")
        
        values_options = [
            "🌍 Chránit naši planetu a přírodu",
            "❤️ Zmírňovat utrpení a poskytovat útěchu",
            "🤝 Posilovat komunitu a mezilidské vztahy",
            "⚖️ Bojovat za spravedlnost a rovné příležitosti",
            "📚 Umožnit vzdělání a růst druhým",
            "💼 Podporovat ekonomickou soběstačnost",
            "🔬 Důvěřovat vědě a podporovat pokrok",
            "🎨 Obohacovat svět kulturou a uměním"
        ]
        help_text = "Toto není test. Neexistují správné nebo špatné odpovědi, jen vaše vlastní."
    else:
        st.markdown("### What matters most to you in life?")
        st.markdown("Let's start with what gives you meaning. Choose up to 3 values that resonate most with you. This will help us find activities that feel truly fulfilling for you.")
        
        values_options = [
            "🌍 Protecting our planet and nature",
            "❤️ Easing suffering and providing comfort",
            "🤝 Strengthening community and relationships",
            "⚖️ Fighting for justice and equal opportunities",
            "📚 Enabling education and growth for others",
            "💼 Supporting economic self-sufficiency",
            "🔬 Trusting in science and supporting progress",
            "🎨 Enriching the world with culture and arts"
        ]
        help_text = "This isn't a test. There are no right or wrong answers, only your own."
    
    selected_values = st.multiselect(
        "Vyberte až 3 hodnoty:" if language == 'czech' else "Choose up to 3 values:",
        values_options,
        key="user_values",
        max_selections=3,
        help=help_text
    )
    
    if len(selected_values) > 0:
        if language == 'czech':
            values_text = ', '.join([v.split(' ', 1)[1].lower() for v in selected_values])
            st.success(f"✨ Skvělé. Rozumíme, že je pro vás důležité: {values_text}.")
        else:
            values_text = ', '.join([v.split(' ', 1)[1].lower() for v in selected_values])
            st.success(f"✨ Wonderful. We understand that you care about: {values_text}.")
        
        update_user_profile({'values': selected_values})
        
        next_text = "Pokračovat k mým možnostem →" if language == 'czech' else "Continue to My Resources →"
        if st.button(next_text, type="primary"):
            st.session_state.assessment_step = 2
            st.rerun()
    else:
        info_text = "Prosím, vyberte alespoň jednu hodnotu, abychom mohli pokračovat." if language == 'czech' else "Please select at least one value to continue."
        st.info(f"💭 {info_text}")

def show_resources_step(show_next=True):
    """Resources assessment with softer, more realistic framing."""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown("### Jaké jsou vaše reálné možnosti?")
        st.markdown("Každý máme jiné možnosti. Buďme k sobě upřímní, aby pomoc byla udržitelná a přinášela radost, ne stres.")
    else:
        st.markdown("### What are your realistic resources?")
        st.markdown("Everyone's capacity is different. Let's be honest with ourselves so that helping can be sustainable and bring joy, not stress.")

    col1, col2 = st.columns(2)
    
    with col1:
        if language == 'czech':
            st.markdown("**⏰ Kolik času můžete věnovat týdně?**")
            time_options = ["Pár minut, když se najde chvilka", "Asi 1-2 hodiny", "Několik hodin", "Více než 5 hodin"]
            help_text = "I pár minut má smysl. Důležitá je udržitelnost."
        else:
            st.markdown("**⏰ How much time can you offer per week?**")
            time_options = ["A few minutes when I can", "About 1-2 hours", "Several hours", "More than 5 hours"]
            help_text = "Even a few minutes matter. Sustainability is key."
        
        time_available = st.radio(
            "Kolik času můžete obvykle věnovat?" if language == 'czech' else "How much time can you typically contribute?",
            time_options,
            key="time_available",
            help=help_text
        )
        
        if language == 'czech':
            st.markdown("**💪 Jaké dovednosti chcete využít?**")
            skills_options = ["Komunikace s lidmi", "Praktická a fyzická pomoc", "Organizace a plánování", 
                            "Práce na počítači / online", "Kreativní tvorba", "Učení a mentoring"]
            help_text_skills = "Přemýšlejte o tom, co vám jde od ruky nebo co byste se chtěli naučit."
        else:
            st.markdown("**💪 What skills do you want to use?**")
            skills_options = ["Communicating with people", "Practical & physical help", "Organizing & planning", 
                            "Computer / online work", "Creative skills", "Teaching & mentoring"]
            help_text_skills = "Think about what you're good at, or what you'd enjoy doing."
        
        skills = st.multiselect(
            "V čem jsi dobrý/á nebo co tě zajímá?" if language == 'czech' else "What are you good at or interested in?",
            skills_options,
            key="user_skills",
            help=help_text_skills
        )
    
    with col2:
        if language == 'czech':
            st.markdown("**💰 Jaký je váš finanční prostor pro pomoc?**")
            budget_options = ["Momentálně žádný (pomůžu jinak)", "Malá částka (do 250 Kč)", "Střední částka (do 1000 Kč)", "Větší částka (1000+ Kč)"]
            help_text_budget = "Pomoc nemusí být o penězích. Váš čas a energie jsou stejně cenné."
        else:
            st.markdown("**💰 What is your financial space for helping?**")
            budget_options = ["None right now (I'll help other ways)", "A small amount (up to $10)", "A medium amount (up to $50)", "A larger amount ($50+)"]
            help_text_budget = "Helping doesn't have to be about money. Your time and energy are just as valuable."

        financial_capacity = st.radio(
            "Kolik můžete měsíčně přispět?" if language == 'czech' else "How much can you contribute monthly?",
            budget_options,
            key="financial_capacity",
            help=help_text_budget
        )
    
    # Save to profile
    update_user_profile({
        'time_available': time_available,
        'skills': skills,
        'financial_capacity': financial_capacity
    })
    
    if show_next:
        col_back, col_next = st.columns(2)
        with col_back:
            back_text = "← Zpět k hodnotám" if language == 'czech' else "← Back to Values"
            if st.button(back_text):
                st.session_state.assessment_step = 1
                st.rerun()
        with col_next:
            next_text = "Najít má doporučení! 🎯" if language == 'czech' else "Find My Recommendations! 🎯"
            if st.button(next_text, type="primary"):
                st.session_state.assessment_step = 3
                st.rerun()

def show_recommendations_step():
    """Enhanced recommendations with narrative framing."""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown('<h1 class="main-header">Vaše osobní cesta k pomoci</h1>', unsafe_allow_html=True)
        st.markdown("### Na základě toho, na čem vám záleží a jaké máte možnosti, jsme pro vás našli několik směrů. Toto jsou jen návrhy, které vás mají inspirovat.")
    else:
        st.markdown('<h1 class="main-header">Your Personalized Path to Helping</h1>', unsafe_allow_html=True)
        st.markdown("### Based on what you care about and your resources, we've found a few directions for you. These are just suggestions to inspire you.")
    
    causes_data = load_causes_data(language)
    user_profile = get_user_profile()
    
    if not causes_data:
        error_text = "Omlouváme se, nepodařilo se načíst data o oblastech pomoci. Zkuste to prosím později." if language == 'czech' else "We're sorry, we couldn't load the data for areas of impact. Please try again later."
        st.error(error_text)
        return
    
    # Calculate cause matches
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
    top_matches = cause_matches[:3]
    if not top_matches:
        st.warning("Nebyly nalezeny žádné odpovídající oblasti. Prozkoumejte všechny možnosti na stránce 'Oblasti pomoci'.")
        return

    st.markdown('<div class="card-grid">', unsafe_allow_html=True)
    cols = st.columns(len(top_matches))
    
    for i, (cause_id, cause_info, match_score) in enumerate(top_matches):
        with cols[i]:
            match_percentage = int(match_score * 100)
            
            if language == 'czech':
                match_text = f"Shoda s vašimi hodnotami: <strong>{match_percentage}%</strong>"
                card_title = f"{cause_info.get('emoji', '🎯')} {cause_info.get('title', 'Neznámá oblast')}"
            else:
                match_text = f"Match with your values: <strong>{match_percentage}%</strong>"
                card_title = f"{cause_info.get('emoji', '🎯')} {cause_info.get('title', 'Unknown Cause')}"

            st.markdown(f"""
            <div class="cause-card" style="height: 100%;">
                <h3 style="font-size: 1.2rem;">{card_title}</h3>
                <p style="color: #2E5D31; font-weight: bold;">{match_text}</p>
                <p style="font-size: 0.9rem;">{cause_info.get('description', 'Popis není k dispozici.')}</p>
            </div>
            """, unsafe_allow_html=True)
            
            matching_actions = get_matching_actions(cause_id, user_profile, language)
            
            if matching_actions:
                st.markdown(f"**{'První krok by mohl být:' if language == 'czech' else 'A good first step could be:'}**")
                
                for action in matching_actions[:1]:
                    _render_recommended_action(action, cause_id, cause_info)
            else:
                no_actions_text = "Nenašli jsme konkrétní akci, ale brzy přidáme další!" if language == 'czech' else "We couldn't find a specific action, but more are coming soon!"
                st.info(no_actions_text)
                
    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown("---")
    if language == 'czech':
        st.info("Toto jsou jen doporučení. Všechny možnosti si můžete prohlédnout na stránce **'Oblasti pomoci'**.")
    else:
        st.info("These are just recommendations. You can explore all possibilities on the **'Areas of Impact'** page.")


def _render_recommended_action(action, cause_id, cause_info):
    """Renders a single recommended action card, consistent with quick actions."""
    language = st.session_state.language
    requirements = action.get('requirements', {})
    
    if language == 'czech':
        cost_czk = requirements.get('cost_usd', 0) * 25
        req_string = f"⏱️ {requirements.get('time_minutes', '?')} min | 💰 ~{int(cost_czk)} Kč"
    else:
        req_string = f"⏱️ {requirements.get('time_minutes', '?')} min | 💰 ~${requirements.get('cost_usd', 0)}"

    st.markdown(f"""
    <div class="action-card" style="margin-top: 1rem; border-left: 4px solid #7AB87A;">
        <h4>{action.get('title', 'Neznámá akce')}</h4>
        <p style="margin: 0.5rem 0; font-size: 0.9rem;">{action.get('description', 'Bez popisu')}</p>
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
        else:
            st.info("Tato akce je v přípravě. Děkujeme za váš zájem!") 