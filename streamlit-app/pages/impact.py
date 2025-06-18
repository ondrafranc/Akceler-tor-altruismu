"""Impact page - tracking and celebrating user contributions"""

import streamlit as st
from utils.localization import get_text
from logic.tracking import get_milestone_achievements, calculate_estimated_impact
from datetime import datetime, timedelta

def show_impact_page():
    """Enhanced impact tracking with meaningful content even for new users"""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown('<h1 class="main-header">📊 Váš dopad na svět</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">Každá akce má význam. Podívejte se na svůj pokrok!</p>', unsafe_allow_html=True)
    else:
        st.markdown('<h1 class="main-header">📊 Your Impact on the World</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">Every action matters. See your progress!</p>', unsafe_allow_html=True)
    
    # Check for milestones and celebrate
    actions_count = st.session_state.total_impact['actions']
    time_contributed = st.session_state.total_impact['time']
    money_donated = st.session_state.total_impact['money']
    
    milestones = get_milestone_achievements(actions_count, time_contributed, money_donated)
    
    if milestones and not st.session_state.get('milestones_shown', False):
        _show_milestone_celebrations(milestones, language)
        st.session_state.milestones_shown = True
    
    # Main metrics display
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric(
            get_text('actions_taken', language),
            actions_count,
            delta=1 if actions_count > 0 else None
        )
    
    with col2:
        hours = time_contributed // 60
        minutes = time_contributed % 60
        time_display = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        st.metric(
            get_text('time_contributed', language), 
            time_display
        )
    
    with col3:
        if language == 'czech':
            money_display = f"{int(money_donated * 25)} Kč"  # Rough CZK conversion
        else:
            money_display = f"${money_donated:.0f}"
        st.metric(
            get_text('money_donated', language),
            money_display
        )
    
    st.markdown("---")
    
    # Show impact content based on actions taken
    if actions_count == 0:
        _show_getting_started_content(language)
    else:
        _show_impact_details(language, actions_count, time_contributed)

def _show_milestone_celebrations(milestones, language):
    """Show milestone celebration messages"""
    
    for milestone in milestones:
        if milestone == "first_action":
            if language == 'czech':
                st.success("🎉 Gratulujeme k vaší první akci! Každá cesta začíná jedním krokem.")
            else:
                st.success("🎉 Congratulations on your first action! Every journey begins with a single step.")
        elif milestone == "five_actions":
            if language == 'czech':
                st.success("🌟 Úžasné! Dokončili jste 5 akcí. Stanováte se skutečným změnotvorcem!")
            else:
                st.success("🌟 Amazing! You've completed 5 actions. You're becoming a real changemaker!")
        # Add more milestone celebrations as needed

def _show_getting_started_content(language):
    """Show content for users who haven't started any actions yet"""
    
    if language == 'czech':
        st.markdown("""
        ### 🌱 Vaše cesta teprve začíná
        
        Ještě jste neudělali žádnou akci, ale to je v pořádku! Každý velkný dopad začíná malým krokem.
        
        **💡 Věděli jste, že:**
        - Průměrný člověk může ovlivnit životy 80 000 lidí během svého života
        - Jen 5 minut denně věnovaných pomoci může změnit něčí týden
        - Malé akce často inspirují ostatní k vlastním činům
        
        **🚀 Připraveni začít?**
        """)
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("⚡ Rychlé akce (5 min)", type="primary", use_container_width=True):
                st.session_state.quick_action_requested = True
                st.rerun()
        
        with col2:
            if st.button("🧭 Personalizované posouzení", use_container_width=True):
                st.session_state.assessment_step = 1
                st.session_state.current_page = 'assessment'
                st.rerun()
    
    else:
        st.markdown("""
        ### 🌱 Your Journey is Just Beginning
        
        You haven't taken any actions yet, but that's perfectly fine! Every great impact starts with a small step.
        
        **💡 Did you know:**
        - The average person can impact 80,000 lives during their lifetime
        - Just 5 minutes daily of helping can change someone's week
        - Small actions often inspire others to take their own actions
        
        **🚀 Ready to start?**
        """)
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("⚡ Quick Actions (5 min)", type="primary", use_container_width=True):
                st.session_state.quick_action_requested = True
                st.rerun()
        
        with col2:
            if st.button("🧭 Personalized Assessment", use_container_width=True):
                st.session_state.assessment_step = 1
                st.session_state.current_page = 'assessment'
                st.rerun()

def _show_impact_details(language, actions_count, time_contributed):
    """Show detailed impact for users who have taken actions"""
    
    # Calculate estimated impact
    estimated_impact = calculate_estimated_impact(actions_count)
    
    if language == 'czech':
        st.markdown("### 🌟 Váš odhadovaný dopad")
        
        st.markdown(f"""
        Na základě vašich {actions_count} akcí:
        
        - **👥 Lidé ovlivnění:** ~{estimated_impact['people_affected']:.0f} lidí
        - **💫 Multiplikátor inspirace:** {estimated_impact['inspiration_multiplier']}x
        - **🏘️ Komunitní dopad:** {estimated_impact['community_impact_score']}/100
        """)
        
        st.markdown("### 📈 Váš pokrok")
    else:
        st.markdown("### 🌟 Your Estimated Impact")
        
        st.markdown(f"""
        Based on your {actions_count} actions:
        
        - **👥 People Affected:** ~{estimated_impact['people_affected']:.0f} people
        - **💫 Inspiration Multiplier:** {estimated_impact['inspiration_multiplier']}x
        - **🏘️ Community Impact:** {estimated_impact['community_impact_score']}/100
        """)
        
        st.markdown("### 📈 Your Progress")
    
    # Show completed actions if any
    if 'actions_completed' in st.session_state and st.session_state.actions_completed:
        if language == 'czech':
            st.markdown("#### ✅ Dokončené akce")
        else:
            st.markdown("#### ✅ Completed Actions")
        
        for i, action in enumerate(st.session_state.actions_completed[-5:]):  # Show last 5
            timestamp = datetime.fromisoformat(action['timestamp'])
            time_ago = datetime.now() - timestamp
            
            if time_ago.days > 0:
                time_str = f"{time_ago.days} {'dní' if language == 'czech' else 'days'} ago"
            elif time_ago.seconds > 3600:
                hours = time_ago.seconds // 3600
                time_str = f"{hours} {'hodin' if language == 'czech' else 'hours'} ago"
            else:
                minutes = time_ago.seconds // 60
                time_str = f"{minutes} {'minut' if language == 'czech' else 'minutes'} ago"
            
            st.markdown(f"- **{action['title']}** ({action['category']}) - {time_str}")
    
    # Show streak if exists
    if st.session_state.get('streak_count', 0) > 1:
        if language == 'czech':
            st.markdown(f"🔥 **Série akcí:** {st.session_state.streak_count} dní v řadě!")
        else:
            st.markdown(f"🔥 **Action Streak:** {st.session_state.streak_count} days in a row!") 