"""Causes page - explore different areas of impact"""

import streamlit as st
from data.loaders import load_causes_data, load_actions_data
from logic.matching import calculate_cause_match
from core.session import get_user_profile
from utils.localization import get_text

def show_causes_page():
    """Enhanced causes exploration with visual storytelling and emotional connection"""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown('<h1 class="main-header">🌍 Kde můžeš nejlépe pomoci</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">Objevuj oblasti, kde tvoje pomoc změní životy</p>', unsafe_allow_html=True)
    else:
        st.markdown('<h1 class="main-header">🌍 Where You Can Make the Biggest Difference</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">Discover areas where your help changes lives</p>', unsafe_allow_html=True)
    
    # Show user's potential impact based on their profile
    user_profile = get_user_profile()
    if user_profile.get('values'):
        if language == 'czech':
            st.info(f"💡 Na základě vašich hodnot ({', '.join([v.split(' ', 1)[1] for v in user_profile['values']])}) jsme připravili personalizovaná doporučení níže.")
        else:
            st.info(f"💡 Based on your values ({', '.join([v.split(' ', 1)[1] for v in user_profile['values']])}), we've prepared personalized recommendations below.")
    
    # Load causes data
    causes_data = load_causes_data(language)
    actions_data = load_actions_data(language)
    
    if not causes_data:
        if language == 'czech':
            st.error("Nelze načíst data o oblastech. Zkontrolujte konfiguraci.")
        else:
            st.error("Unable to load causes data. Please check configuration.")
        return
    
    # Calculate matches if user has profile
    cause_matches = []
    if user_profile.get('values'):
        for cause_id, cause_info in causes_data.items():
            match_score = calculate_cause_match(
                user_profile.get('values', []), 
                cause_info.get('values_alignment', [])
            )
            cause_matches.append((cause_id, cause_info, match_score))
        
        # Sort by match score
        cause_matches.sort(key=lambda x: x[2], reverse=True)
        
        if language == 'czech':
            st.markdown("### 🎯 Nejlepší shody pro vás")
        else:
            st.markdown("### 🎯 Best Matches for You")
    else:
        # Show all causes
        cause_matches = [(cause_id, cause_info, 0.5) for cause_id, cause_info in causes_data.items()]
        
        if language == 'czech':
            st.markdown("### 🌟 Všechny oblasti dopadu")
            st.info("💡 Projděte si posouzení pro personalizovaná doporučení!")
        else:
            st.markdown("### 🌟 All Impact Areas")
            st.info("💡 Take the assessment for personalized recommendations!")
    
    # Display causes
    for i, (cause_id, cause_info, match_score) in enumerate(cause_matches):
        with st.container():
            
            # Match percentage display
            if user_profile.get('values'):
                match_percentage = int(match_score * 100)
                match_indicator = f" ({match_percentage}% shoda)" if language == 'czech' else f" ({match_percentage}% match)"
                match_color = "#7AB87A" if match_score > 0.6 else "#5A6B5A"
            else:
                match_indicator = ""
                match_color = "#2E5D31"
            
            # Cause card
            st.markdown(f"""
            <div class="cause-card">
                <h3 style="color: {match_color};">
                    {cause_info.get('emoji', '🎯')} {cause_info.get('title', 'Unknown Cause')}{match_indicator}
                </h3>
                <p style="font-size: 1.1em; color: #5A6B5A; margin-bottom: 1rem;">
                    {cause_info.get('description', 'No description available')}
                </p>
            </div>
            """, unsafe_allow_html=True)
            
            # Quick stats
            col1, col2, col3 = st.columns(3)
            with col1:
                urgency = cause_info.get('urgency_level', 'medium')
                urgency_emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}.get(urgency, '🟡')
                urgency_text = {'high': 'Vysoká', 'medium': 'Střední', 'low': 'Nízká'}.get(urgency, urgency) if language == 'czech' else urgency.title()
                st.markdown(f"**Naléhavost:** {urgency_emoji} {urgency_text}" if language == 'czech' else f"**Urgency:** {urgency_emoji} {urgency_text}")
            
            with col2:
                accessibility = cause_info.get('accessibility', 'medium')
                accessibility_text = {'easy': 'Snadná', 'medium': 'Střední', 'hard': 'Náročná'}.get(accessibility, accessibility) if language == 'czech' else accessibility.title()
                st.markdown(f"**Přístupnost:** {accessibility_text}" if language == 'czech' else f"**Accessibility:** {accessibility_text}")
            
            with col3:
                time_commitment = cause_info.get('time_commitment', 'varies')
                st.markdown(f"**Čas:** {time_commitment}" if language == 'czech' else f"**Time:** {time_commitment}")
            
            # Show relevant actions
            relevant_actions = []
            for action_id, action in actions_data.items():
                if action.get('cause_id') == cause_id:
                    relevant_actions.append(action)
            
            if relevant_actions:
                if language == 'czech':
                    st.markdown(f"**🎯 Konkrétní akce v této oblasti ({len(relevant_actions)}):**")
                else:
                    st.markdown(f"**🎯 Specific Actions in This Area ({len(relevant_actions)}):**")
                
                # Show top 3 actions
                for action in relevant_actions[:3]:
                    col_action, col_button = st.columns([3, 1])
                    
                    with col_action:
                        st.markdown(f"""
                        - **{action.get('title', 'Unknown Action')}**  
                          {action.get('description', 'No description')[:100]}...
                        """)
                    
                    with col_button:
                        if st.button(f"Začít" if language == 'czech' else "Start", key=f"action_{cause_id}_{action.get('id', 'unknown')}"):
                            # Show action details
                            org_website = action.get('organization', {}).get('website')
                            if org_website and org_website != '#':
                                st.success(f"🚀 {'Přesměrování na:' if language == 'czech' else 'Redirecting to:'} {org_website}")
                                st.markdown(f"[{'Dokončit akci' if language == 'czech' else 'Complete Action'}]({org_website})")
                            else:
                                st.info(f"{'Tato akce je připravována...' if language == 'czech' else 'This action is coming soon...'}")
                
                if len(relevant_actions) > 3:
                    if language == 'czech':
                        st.markdown(f"*...a dalších {len(relevant_actions) - 3} akcí*")
                    else:
                        st.markdown(f"*...and {len(relevant_actions) - 3} more actions*")
            else:
                if language == 'czech':
                    st.info("🔄 Akce v této oblasti se připravují. Mezitím zkuste jiné oblasti!")
                else:
                    st.info("🔄 Actions in this area are being prepared. Try other areas in the meantime!")
            
            # Action buttons
            col1, col2 = st.columns(2)
            with col1:
                if st.button(
                    f"📚 {'Zjistit více' if language == 'czech' else 'Learn More'}", 
                    key=f"learn_{cause_id}",
                    use_container_width=True
                ):
                    with st.expander(f"Více o: {cause_info.get('title', 'this cause')}", expanded=True):
                        st.markdown(f"""
                        **{'Proč je důležité:' if language == 'czech' else 'Why it matters:'}**
                        {cause_info.get('why_matters', 'This cause addresses important global challenges.')}
                        
                        **{'Aktuální výzvy:' if language == 'czech' else 'Current challenges:'}**
                        {cause_info.get('current_challenges', 'Various challenges exist in this area.')}
                        
                        **{'Kde se dozvědět více:' if language == 'czech' else 'Where to learn more:'}**
                        {cause_info.get('learning_resources', 'Resources are available online.')}
                        """)
            
            with col2:
                if st.button(
                    f"🎯 {'Získat doporučení' if language == 'czech' else 'Get Recommendations'}", 
                    key=f"recommend_{cause_id}",
                    use_container_width=True
                ):
                    # Navigate to assessment focused on this cause
                    st.session_state.focused_cause = cause_id
                    st.session_state.assessment_step = 1
                    st.session_state.current_page = 'assessment'
                    st.rerun()
            
            st.markdown("---")
    
    # Call to action at the end
    st.markdown(f"""
    <div class="cta-section">
        <h3>{'🚀 Připraveni začít?' if language == 'czech' else '🚀 Ready to Start?'}</h3>
        <p>{'Projděte si naše posouzení pro personalizovaná doporučení, nebo vyzkoušejte rychlé akce.' if language == 'czech' else 'Take our assessment for personalized recommendations, or try quick actions.'}</p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        if st.button(f"🧭 {get_text('take_assessment', language)}", type="primary", use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()
    
    with col2:
        if st.button(f"⚡ {get_text('quick_actions', language)}", use_container_width=True):
            st.session_state.quick_action_requested = True
            st.rerun() 