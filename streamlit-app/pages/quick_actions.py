"""Beautiful quick actions page - your first steps to meaningful impact"""

import streamlit as st
import random
from datetime import datetime
from utils.localization import get_text, get_czech_proverb
from logic.encouragement import get_random_encouragement, get_emotional_response
from logic.tracking import track_action_completion, calculate_impact_estimate, show_honest_celebration, calculate_honest_impact_reflection
from core.session import update_user_profile, track_page_visit, get_user_behavior_insights
from data.loaders import load_actions_data

def show_quick_actions_page():
    """Beautiful quick actions experience - your first meaningful steps"""
    language = st.session_state.language
    track_page_visit('quick_actions')
    
    # Create beautiful, inspiring container
    st.markdown("""
    <div class="quick-actions-container" style="
        background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
        border-radius: 20px;
        padding: 2rem;
        margin: 1rem 0;
        border: 1px solid #ffcc80;
        box-shadow: 0 4px 20px rgba(255, 152, 0, 0.1);
    ">
    """, unsafe_allow_html=True)
    
    # Beautiful header with emotional warmth
    _render_beautiful_header(language)
    
    # Show appropriate content based on user state
    behavior_insights = get_user_behavior_insights()
    
    # Check if user came from assessment with specific recommendation
    if st.session_state.get('selected_action'):
        _show_specific_action_focus(language)
    else:
        _show_beautiful_action_grid(language, behavior_insights)
    
    # Gentle inspiration and encouragement
    _show_gentle_encouragement(language)
    
    st.markdown("</div>", unsafe_allow_html=True)

def _render_beautiful_header(language):
    """Beautiful header that creates immediate motivation"""
    
    if language == 'czech':
        title = "⚡ Rychlé kroky k pomoci"
        subtitle = "Malé akce, které můžete udělat právě teď – každá má svůj význam"
        motivation = "Nemusíte měnit celý svět. Stačí začít tam, kde jste."
    else:
        title = "⚡ Quick steps to help"
        subtitle = "Small actions you can take right now – each one matters"
        motivation = "You don't need to change the whole world. Just start where you are."
    
    st.markdown(f"""
    <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="
            font-size: 2.5rem;
            color: #e65100;
            margin-bottom: 0.5rem;
            font-weight: 600;
        ">{title}</h1>
        <p style="
            font-size: 1.2rem;
            color: #5A4A3A;
            font-style: italic;
            margin-bottom: 0.5rem;
            line-height: 1.4;
        ">{subtitle}</p>
        <p style="
            font-size: 1rem;
            color: #8A6A5A;
            margin: 0;
            font-weight: 500;
        ">{motivation}</p>
    </div>
    """, unsafe_allow_html=True)

def _show_specific_action_focus(language):
    """Show focused view for specific action from assessment"""
    
    action = st.session_state.selected_action
    
    if language == 'czech':
        st.markdown(f"""
        ### 🎯 Vaše doporučená akce
        
        *Na základě vaší reflexe jsme vybrali tuto akci speciálně pro vás.*
        """)
    else:
        st.markdown(f"""
        ### 🎯 Your recommended action
        
        *Based on your reflection, we selected this action especially for you.*
        """)
    
    # Beautiful focused action card
    _render_beautiful_action_card(action, language, is_featured=True)
    
    # Option to see more actions
    st.markdown("<div style='height: 1.5rem;'></div>", unsafe_allow_html=True)
    
    if st.button("🌟 Zobrazit více akcí" if language == 'czech' else "🌟 Show more actions", use_container_width=True):
        st.session_state.selected_action = None
        st.rerun()

def _show_beautiful_action_grid(language, behavior_insights):
    """Beautiful grid of quick actions with emotional appeal"""
    
    # Load actions
    actions = load_actions_data(language)
    if not actions:
        _show_beautiful_error_state(language)
        return
    
    # Filter and sort actions for quick help
    quick_actions = _get_quick_actions(actions, behavior_insights, language)
    
    if language == 'czech':
        st.markdown("""
        ### 🌟 Vyberte si svůj první krok
        
        *Každá akce je navržena tak, abyste mohli začít hned teď, bez složitých příprav.*
        """)
    else:
        st.markdown("""
        ### 🌟 Choose your first step
        
        *Each action is designed so you can start right now, without complex preparations.*
        """)
    
    # Beautiful action grid
    cols = st.columns(2)
    
    for i, action in enumerate(quick_actions[:8]):  # Show top 8 actions
        with cols[i % 2]:
            _render_beautiful_action_card(action, language)
    
    # Show more actions button
    if len(quick_actions) > 8:
        st.markdown("<div style='height: 1rem;'></div>", unsafe_allow_html=True)
        
        if st.button(f"🔍 Zobrazit všech {len(quick_actions)} akcí" if language == 'czech' else f"🔍 Show all {len(quick_actions)} actions", use_container_width=True):
            _show_expanded_actions_view(quick_actions[8:], language)

def _get_quick_actions(actions, behavior_insights, language):
    """Get and sort quick actions based on user behavior"""
    
    # Filter for quick actions (low time commitment, easy to start)
    quick_actions = []
    
    for action in actions:
        # Criteria for quick actions
        time_commitment = action.get('time_commitment', '').lower()
        difficulty = action.get('difficulty', '').lower()
        cost = action.get('cost', '').lower()
        
        is_quick = (
            'minut' in time_commitment or 'minute' in time_commitment or
            'rychl' in time_commitment.lower() or 'quick' in time_commitment.lower() or
            'snadn' in difficulty or 'easy' in difficulty or
            'zdarma' in cost or 'free' in cost or
            action.get('is_quick_action', False)
        )
        
        if is_quick:
            quick_actions.append(action)
    
    # If not enough quick actions found, add more general ones
    if len(quick_actions) < 6:
        for action in actions:
            if action not in quick_actions:
                quick_actions.append(action)
                if len(quick_actions) >= 12:
                    break
    
    # Sort by relevance to user behavior
    if behavior_insights.get('is_action_oriented'):
        # Prioritize immediate impact actions
        quick_actions.sort(key=lambda x: x.get('immediate_impact', False), reverse=True)
    elif behavior_insights.get('is_explorer'):
        # Mix different types
        random.shuffle(quick_actions)
    else:
        # Default order - easiest first
        quick_actions.sort(key=lambda x: x.get('difficulty_score', 1))
    
    return quick_actions

def _render_beautiful_action_card(action, language, is_featured=False):
    """Render a beautiful, inspiring action card"""
    
    # Enhanced styling for featured actions
    if is_featured:
        card_style = """
        background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
        border: 3px solid #FF9800;
        border-radius: 20px;
        padding: 2rem;
        margin: 1rem 0;
        box-shadow: 0 8px 25px rgba(255, 152, 0, 0.2);
        position: relative;
        """
        
        # Add featured badge
        featured_badge = """
        <div style="
            position: absolute;
            top: -10px;
            left: 20px;
            background: #FF9800;
            color: white;
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
        ">
            ⭐ Doporučeno pro vás
        </div>
        """ if language == 'czech' else """
        <div style="
            position: absolute;
            top: -10px;
            left: 20px;
            background: #FF9800;
            color: white;
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
        ">
            ⭐ Recommended for you
        </div>
        """
    else:
        card_style = """
        background: linear-gradient(135deg, #fafbfa 0%, #f0f8f0 100%);
        border: 2px solid #e8f5e8;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
        transition: all 0.3s ease;
        """
        featured_badge = ""
    
    # Action content
    icon = action.get('icon', '🌟')
    title = action.get('title', 'Akce')
    description = action.get('description', 'Popis akce')
    time_commitment = action.get('time_commitment', 'Flexibilní čas')
    cost = action.get('cost', 'Zdarma')
    impact = action.get('impact', 'Pozitivní změna')
    
    # Create unique key for this action
    action_key = f"action_{action.get('id', title.replace(' ', '_'))}"
    
    st.markdown(f"""
    <div style="{card_style}">
        {featured_badge}
        
        <div style="text-align: center; margin-bottom: 1rem;">
            <div style="font-size: 3rem; margin-bottom: 0.5rem;">{icon}</div>
            <h3 style="color: #2E5D31; margin-bottom: 0.5rem; font-weight: 600;">
                {title}
            </h3>
        </div>
        
        <p style="
            color: #5A6B5A; 
            margin-bottom: 1.2rem; 
            line-height: 1.6;
            text-align: center;
        ">
            {description}
        </p>
        
        <div style="
            display: flex; 
            justify-content: space-around; 
            margin-bottom: 1.2rem;
            flex-wrap: wrap;
            gap: 0.5rem;
        ">
            <span style="
                background: #e8f5e8;
                padding: 0.4rem 0.8rem;
                border-radius: 20px;
                font-size: 0.85rem;
                color: #2E5D31;
                font-weight: 500;
            ">⏱️ {time_commitment}</span>
            
            <span style="
                background: #e8f5e8;
                padding: 0.4rem 0.8rem;
                border-radius: 20px;
                font-size: 0.85rem;
                color: #2E5D31;
                font-weight: 500;
            ">💰 {cost}</span>
        </div>
        
        <div style="
            background: #f0fff0;
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 1.2rem;
            border-left: 4px solid #7AB87A;
        ">
            <strong style="color: #2E5D31;">💫 Váš dopad:</strong><br>
            <span style="color: #4A5E4A; font-style: italic;">{impact}</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Beautiful action button
    button_text = f"🚀 Začít: {title}" if language == 'czech' else f"🚀 Start: {title}"
    
    if st.button(button_text, key=action_key, use_container_width=True, type="primary" if is_featured else "secondary"):
        _handle_action_selection(action, language)

def _handle_action_selection(action, language):
    """Handle when user selects an action"""
    
    # Track the action selection
    track_action_completion(action.get('id', action['title']), 'selected')
    
    # Update user profile with action interest
    interests = st.session_state.user_profile.get('action_interests', [])
    action_category = action.get('category', 'general')
    if action_category not in interests:
        interests.append(action_category)
        update_user_profile({'action_interests': interests})
    
    # Show action details and next steps
    _show_action_details_modal(action, language)

def _show_action_details_modal(action, language):
    """Show beautiful action details and next steps"""
    
    with st.expander(f"✨ {action['title']}", expanded=True):
        if language == 'czech':
            st.markdown("### 🎯 Jak začít")
            
            # Show step-by-step guide
            steps = action.get('steps', [
                "Klikněte na odkaz níže",
                "Projděte si informace na webu",
                "Vyberte způsob, jak chcete pomoci",
                "Začněte svou první akci!"
            ])
            
            for i, step in enumerate(steps, 1):
                st.markdown(f"**{i}.** {step}")
            
            st.markdown("### 💚 Proč je to důležité")
            st.markdown(action.get('why_important', 'Každá pomoc má svůj význam a vytváří pozitivní změnu.'))
            
            # Call to action
            st.markdown("### 🚀 Připraveni začít?")
            
        else:
            st.markdown("### 🎯 How to start")
            
            # Show step-by-step guide
            steps = action.get('steps', [
                "Click the link below",
                "Review the information on the website",
                "Choose how you want to help",
                "Start your first action!"
            ])
            
            for i, step in enumerate(steps, 1):
                st.markdown(f"**{i}.** {step}")
            
            st.markdown("### 💚 Why it matters")
            st.markdown(action.get('why_important', 'Every help has its meaning and creates positive change.'))
            
            # Call to action
            st.markdown("### 🚀 Ready to start?")
        
        # Action buttons
        col1, col2 = st.columns(2)
        
        with col1:
            if action.get('url'):
                if st.button("🌐 Přejít na web" if language == 'czech' else "🌐 Go to website", use_container_width=True):
                    st.markdown(f"[Otevřít {action['title']}]({action['url']})")
                    track_action_completion(action.get('id', action['title']), 'visited_website')
        
        with col2:
            if st.button("✅ Označit jako dokončené" if language == 'czech' else "✅ Mark as completed", use_container_width=True):
                _mark_action_completed(action, language)

def _mark_action_completed(action, language):
    """Mark action as completed and show honest celebration"""
    
    # Track completion
    track_action_completion(action.get('id', action['title']), 'completed')
    
    # Update total impact
    if 'total_impact' not in st.session_state:
        st.session_state.total_impact = {'actions': 0}
    
    st.session_state.total_impact['actions'] += 1
    action_count = st.session_state.total_impact['actions']
    
    # Show honest celebration without fake metrics
    show_honest_celebration(action_count, language)
    
    # Show potential meaning instead of fake impact
    reflection = calculate_honest_impact_reflection(action)
    potential_meaning = reflection.get('potential_meaning', '')
    
    if potential_meaning:
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #f0fff0 0%, #e8f5e8 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin: 1rem 0;
            border-left: 4px solid #7AB87A;
        ">
            <div style="color: #2E5D31; line-height: 1.5;">
                💚 {potential_meaning}
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    # Encourage reflection and next steps
    if language == 'czech':
        st.markdown("### 🌱 Co dál?")
        st.markdown("Jak se cítíte po dokončení této akce? Každý krok má svůj význam!")
    else:
        st.markdown("### 🌱 What's next?")
        st.markdown("How do you feel after completing this action? Every step has its meaning!")
    
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🔄 Další akce" if language == 'czech' else "🔄 Another action", use_container_width=True):
            st.rerun()
    with col2:
        if st.button("📖 Můj příběh" if language == 'czech' else "📖 My story", use_container_width=True):
            st.session_state.current_page = 'impact'
            st.rerun()

def _show_expanded_actions_view(additional_actions, language):
    """Show expanded view with more actions"""
    
    with st.expander("🔍 Další akce" if language == 'czech' else "🔍 More actions", expanded=True):
        cols = st.columns(2)
        
        for i, action in enumerate(additional_actions):
            with cols[i % 2]:
                _render_beautiful_action_card(action, language)

def _show_gentle_encouragement(language):
    """Show gentle encouragement and inspiration"""
    
    # Get appropriate encouragement
    encouragement = get_random_encouragement("action_motivation", language)
    
    if encouragement:
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #f0fff0 0%, #e8f5e8 100%);
            padding: 1.5rem;
            border-radius: 15px;
            text-align: center;
            margin: 2rem 0;
            border: 1px solid #d4e7d4;
        ">
            <div style="color: #2E5D31; font-style: italic; line-height: 1.6; font-size: 1.1rem;">
                💚 {encouragement}
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    # Czech wisdom occasionally
    if language == 'czech' and random.random() < 0.3:
        proverb = get_czech_proverb('action')
        if proverb:
            st.markdown(f"""
            <div style="
                background: #fff3e0;
                padding: 1.2rem;
                border-radius: 12px;
                text-align: center;
                margin: 1.5rem 0;
                font-style: italic;
                color: #e65100;
                border-left: 4px solid #FF9800;
            ">
                🌿 {proverb}
            </div>
            """, unsafe_allow_html=True)
    
    # Show gentle next steps
    _show_beautiful_next_steps(language)

def _show_beautiful_next_steps(language):
    """Show beautiful next steps section"""
    
    if language == 'czech':
        st.markdown("""
        ### 🌟 Další kroky na vaší cestě
        
        *Připraveni prozkoumat více možností?*
        """)
    else:
        st.markdown("""
        ### 🌟 Next steps on your journey
        
        *Ready to explore more possibilities?*
        """)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🧭 Najít mou cestu" if language == 'czech' else "🧭 Find my path", use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()
    
    with col2:
        if st.button("🌍 Prozkoumat oblasti" if language == 'czech' else "🌍 Explore areas", use_container_width=True):
            st.session_state.current_page = 'causes'
            st.rerun()
    
    with col3:
        if st.button("📊 Můj dopad" if language == 'czech' else "📊 My impact", use_container_width=True):
            st.session_state.current_page = 'impact'
            st.rerun()

def _show_beautiful_error_state(language):
    """Beautiful error state when actions can't be loaded"""
    
    if language == 'czech':
        st.markdown("""
        ### 😔 Momentálně nemůžeme načíst akce
        
        Omlouváme se za komplikace. Zkuste to prosím znovu nebo se podívejte na oblasti pomoci.
        """)
    else:
        st.markdown("""
        ### 😔 We can't load actions right now
        
        Sorry for the inconvenience. Please try again or check out the help areas.
        """)
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("🔄 Zkusit znovu" if language == 'czech' else "🔄 Try again", use_container_width=True):
            st.rerun()
    
    with col2:
        if st.button("🌍 Oblasti pomoci" if language == 'czech' else "🌍 Help areas", use_container_width=True):
            st.session_state.current_page = 'causes'
            st.rerun() 