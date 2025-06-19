"""Impact page - tracking and celebrating user contributions"""

import streamlit as st
from utils.localization import get_text
from logic.tracking import get_milestone_achievements, calculate_estimated_impact
from datetime import datetime, timedelta

def show_impact_page():
    """A page to reflect on the user's impact, as a story with clear milestones and next steps."""
    language = st.session_state.language
    st.markdown(f'<h1 class="main-header">{get_text("my_impact", language)}</h1>', unsafe_allow_html=True)
    st.markdown(f'<p class="sub-header">{get_text("subtitle", language)}</p>', unsafe_allow_html=True)
    actions_count = st.session_state.total_impact['actions']
    if actions_count == 0:
        _show_getting_started_content(language)
    else:
        _show_impact_details(language)

def _show_getting_started_content(language):
    """Show gentle, encouraging content for users who haven't started yet."""
    
    if language == 'czech':
        st.info("""
        ### Vaše první kapitola čeká na napsání.
        
        Prázdná stránka není známkou nečinnosti, ale příležitosti. Jste na začátku cesty, a to je to nejlepší místo, kde začít. Každý velký příběh pomoci začal jedním malým krokem.
        
        **Jste připraveni napsat první větu?**
        """)
    else:
        st.info("""
        ### Your first chapter is waiting to be written.
        
        An empty page isn't a sign of inaction, but of opportunity. You are at the beginning of a journey, and that's the best place to start. Every great story of help began with a single, small step.
        
        **Are you ready to write the first sentence?**
        """)
        
    col1, col2 = st.columns(2)
    with col1:
        if st.button(f"⚡ {get_text('get_quick_help', language)}", type="primary", use_container_width=True):
            st.session_state.quick_action_requested = True
            st.rerun()
    
    with col2:
        if st.button(f"🧭 {get_text('take_assessment', language)}", use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()

def _show_impact_details(language):
    """Show detailed impact with narrative framing, reflection, and always a next step."""
    actions_count = st.session_state.total_impact['actions']
    time_contributed = st.session_state.total_impact['time']
    money_donated = st.session_state.total_impact['money']
    # Main metrics display
    st.markdown("### Vaše shrnutí dopadu" if language == 'czech' else "### Your Impact Summary")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric(get_text('actions_taken', language), actions_count)
    with col2:
        hours = time_contributed // 60
        minutes = time_contributed % 60
        time_display = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        st.metric(get_text('time_contributed', language), time_display)
    with col3:
        if language == 'czech':
            money_display = f"{int(money_donated * 25)} Kč"
        else:
            money_display = f"${money_donated:.0f}"
        st.metric(get_text('money_donated', language), money_display)
    st.markdown("---")
    # Completed Actions Log - "Your Story So Far"
    if 'actions_completed' in st.session_state and st.session_state.actions_completed:
        st.markdown("### Váš příběh pomoci zatím..." if language == 'czech' else "### Your story of help so far...")
        for i, action in enumerate(reversed(st.session_state.actions_completed[-5:])):
            timestamp = datetime.fromisoformat(action['timestamp'])
            time_ago = datetime.now() - timestamp
            if time_ago.days > 1:
                time_str = f"před {time_ago.days} dny" if language == 'czech' else f"{time_ago.days} days ago"
            elif time_ago.days == 1:
                time_str = "včera" if language == 'czech' else "yesterday"
            elif time_ago.seconds > 3600:
                hours = time_ago.seconds // 3600
                time_str = f"před {hours}h" if language == 'czech' else f"{hours}h ago"
            else:
                minutes = max(1, time_ago.seconds // 60)
                time_str = f"před {minutes} min" if language == 'czech' else f"{minutes} min ago"
            st.markdown(f"**{time_str}**: {'Dokončili jste' if language == 'czech' else 'You completed'} **'{action['title']}'** {'v oblasti' if language == 'czech' else 'in'} '{action['category']}'.")
        st.markdown("---")
    # Reflection prompt
    if language == 'czech':
        st.markdown("#### Zamyslete se: Jaký z těchto kroků vám udělal největší radost? Co byste chtěli zkusit příště?")
    else:
        st.markdown("#### Reflect: Which of these steps made you happiest? What would you like to try next?")
    st.markdown("---")
    # Estimated Broader Impact
    estimated_impact = calculate_estimated_impact(actions_count)
    if language == 'czech':
        st.markdown("### Váš možný širší dopad")
        st.markdown(f"""
        I malé akce mají vlnový efekt. Vaše činy mohly:
        - **Inspirovat ostatní:** Vaše odhodlání může motivovat lidi ve vašem okolí.
        - **Přispět k větší změně:** Jste součástí komunity, která společně řeší velké problémy.
        - **Ovlivnit životy:** Odhaduje se, že vaše pomoc se mohla dotknout až **~{estimated_impact['people_affected']:.0f} lidí**.
        *Toto jsou odhady, které vám mají ukázat, že i malé kroky mají velký potenciál.*
        """)
    else:
        st.markdown("### Your Potential Ripple Effect")
        st.markdown(f"""
        Even small actions create waves. Your efforts may have:
        - **Inspired others:** Your commitment can motivate those around you.
        - **Contributed to bigger change:** You are part of a community tackling large problems together.
        - **Affected lives:** It's estimated your help may have touched up to **~{estimated_impact['people_affected']:.0f} people**.
        *These are estimates to show you that even small steps have great potential.*
        """)
    # Check for milestones and celebrate
    milestones = get_milestone_achievements(actions_count, time_contributed, money_donated)
    if milestones:
        _show_milestone_celebrations(milestones, language)
        # Reflection after milestone
        if language == 'czech':
            st.markdown("#### Co byste vzkázali někomu, kdo váhá začít pomáhat?")
        else:
            st.markdown("#### What would you tell someone who hesitates to start helping?")
    # Always a next step
    st.markdown("---")
    col1, col2 = st.columns(2)
    with col1:
        if st.button(f"⚡ {get_text('get_quick_help', language)}", use_container_width=True):
            st.session_state.quick_action_requested = True
            st.rerun()
    with col2:
        if st.button(f"🧭 {get_text('take_assessment', language)}", use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()

def _show_milestone_celebrations(milestones, language):
    """Show milestone celebration messages in a more prominent way."""
    
    milestone_texts = {
        "first_action": (
            "🎉 První krok na vaší cestě!", 
            "Congratulations on the first step of your journey!"
        ),
        "five_actions": (
            "🌟 Skvělé! Už 5 dokončených akcí!",
            "Amazing! You've completed 5 actions!"
        )
    }

    for milestone in milestones:
        if milestone in milestone_texts:
            if language == 'czech':
                st.success(f"**Milník dosažen:** {milestone_texts[milestone][0]}")
            else:
                st.success(f"**Milestone Reached:** {milestone_texts[milestone][1]}") 