"""Clean and responsive impact page - your story of meaningful change"""

import streamlit as st
import random
from datetime import datetime, timedelta
from utils.localization import get_text, get_czech_proverb
from logic.encouragement import get_random_encouragement, get_milestone_celebration
from logic.tracking import get_user_streak, get_recent_actions, calculate_total_impact
from core.session import track_page_visit, get_user_behavior_insights, update_user_profile
import plotly.graph_objects as go
import plotly.express as px

def show_impact_page():
    """Clean and responsive impact experience"""
    language = st.session_state.language
    track_page_visit('impact')
    
    # Get user data
    total_impact = st.session_state.get('total_impact', {'actions': 0, 'estimated_reach': 0})
    behavior_insights = get_user_behavior_insights()
    
    # Header
    _render_header(language, total_impact)
    
    # Main content based on user's journey stage
    if total_impact['actions'] == 0:
        _show_beginning_story(language)
    else:
        _show_impact_story(language, total_impact, behavior_insights)
    
    # Always show next steps
    _show_next_steps(language, total_impact)

def _render_header(language, total_impact):
    """Clean header section"""
    actions_count = total_impact['actions']
    
    # Create centered header
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if language == 'czech':
            if actions_count == 0:
                st.markdown("# 📖 Váš příběh pomoci")
                st.markdown("*Každý příběh má svůj začátek – váš čeká na první kapitolu*")
            else:
                st.markdown("# 📖 Váš příběh pomoci")
                st.markdown(f"*Už jste napsali {actions_count} {'kapitolu' if actions_count == 1 else 'kapitoly' if actions_count < 5 else 'kapitol'} pozitivní změny*")
        else:
            if actions_count == 0:
                st.markdown("# 📖 Your story of help")
                st.markdown("*Every story has its beginning – yours is waiting for the first chapter*")
            else:
                st.markdown("# 📖 Your story of help")
                st.markdown(f"*You've already written {actions_count} chapter{'s' if actions_count != 1 else ''} of positive change*")

def _show_beginning_story(language):
    """Clean beginning story for new users"""
    
    # Welcome section
    st.markdown("---")
    
    if language == 'czech':
        st.markdown("## 🌱 Váš příběh začíná teď")
        st.markdown("*Představte si, že každá akce pomoci je jako malý kámen hozený do klidné vody. Vytvoří kruhy, které se šíří dál, než můžete vidět.*")
    else:
        st.markdown("## 🌱 Your story begins now")
        st.markdown("*Imagine that every helping action is like a small stone thrown into calm water. It creates circles that spread farther than you can see.*")
    
    # What awaits section with clean cards
    st.markdown("### Co vás čeká" if language == 'czech' else "### What awaits you")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        with st.container():
            st.markdown("#### 🌟 První krok" if language == 'czech' else "#### 🌟 First step")
            st.markdown("Vaše první akce pomoci" if language == 'czech' else "Your first helping action")
    
    with col2:
        with st.container():
            st.markdown("#### 🌊 Vlnky změny" if language == 'czech' else "#### 🌊 Ripples of change")
            st.markdown("Váš dopad se šíří dál" if language == 'czech' else "Your impact spreads further")
    
    with col3:
        with st.container():
            st.markdown("#### 🌈 Krásný příběh" if language == 'czech' else "#### 🌈 Beautiful story")
            st.markdown("Každá akce má svůj význam" if language == 'czech' else "Every action has meaning")
    
    # Call to action
    st.markdown("---")
    st.markdown("### 💫 Připraveni začít?" if language == 'czech' else "### 💫 Ready to begin?")
    st.markdown("*Váš první krok nemusí být velký – stačí, když bude upřímný.*" if language == 'czech' else "*Your first step doesn't need to be big – it just needs to be sincere.*")

def _show_impact_story(language, total_impact, behavior_insights):
    """Clean impact story for users with actions"""
    
    actions_count = total_impact['actions']
    
    # Impact summary with clean metrics
    _render_impact_summary(language, actions_count, total_impact)
    
    # Timeline if there are recent actions
    recent_actions = get_recent_actions(days=30)
    if recent_actions:
        _render_timeline(language, recent_actions)
    
    # Milestones
    _render_milestones(language, actions_count)
    
    # Personal reflections
    _render_personal_reflections(language, total_impact)
    
    # Encouragement
    _render_encouragement(language, actions_count)

def _render_impact_summary(language, actions_count, total_impact):
    """Clean impact summary with honest metrics"""
    
    st.markdown("---")
    st.markdown("## ✨ Váš příběh v číslech" if language == 'czech' else "## ✨ Your story in numbers")
    
    # Calculate authentic metrics
    streak = get_user_streak()
    days_since_start = total_impact.get('days_since_start', 0)
    
    # Clean metrics display
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric(
            "🌟 Kroky na cestě" if language == 'czech' else "🌟 Steps on path",
            actions_count
        )
    
    with col2:
        st.metric(
            "🌱 Dní od začátku" if language == 'czech' else "🌱 Days since start",
            days_since_start
        )
    
    with col3:
        st.metric(
            "🔥 Dní v řadě" if language == 'czech' else "🔥 Days in a row",
            streak
        )
    
    # Journey description if available
    journey_description = total_impact.get('journey_description', '')
    if journey_description:
        st.info(f"💚 {journey_description}")

def _render_timeline(language, recent_actions):
    """Clean timeline of recent actions"""
    
    st.markdown("---")
    st.markdown("## 📅 Vaše cesta pomoci" if language == 'czech' else "## 📅 Your helping journey")
    st.markdown("*Každý krok na vaší cestě má svůj příběh*" if language == 'czech' else "*Every step on your journey has its story*")
    
    # Group actions by date
    actions_by_date = {}
    for action in recent_actions[-10:]:  # Show last 10 actions
        completed_at = action.get('completed_at')
        if isinstance(completed_at, str):
            try:
                date = datetime.fromisoformat(completed_at).date()
            except:
                date = datetime.now().date()
        else:
            date = completed_at.date() if completed_at else datetime.now().date()
        
        if date not in actions_by_date:
            actions_by_date[date] = []
        actions_by_date[date].append(action)
    
    # Display timeline with clean containers
    for date, actions in sorted(actions_by_date.items(), reverse=True):
        days_ago = (datetime.now().date() - date).days
        
        if language == 'czech':
            if days_ago == 0:
                date_text = "Dnes"
            elif days_ago == 1:
                date_text = "Včera"
            else:
                date_text = f"Před {days_ago} dny"
        else:
            if days_ago == 0:
                date_text = "Today"
            elif days_ago == 1:
                date_text = "Yesterday"
            else:
                date_text = f"{days_ago} days ago"
        
        with st.container():
            st.markdown(f"### 📅 {date_text}")
            
            for action in actions:
                action_title = action.get('title', 'Akce pomoci')
                st.markdown(f"✅ {action_title}")

def _render_milestones(language, actions_count):
    """Clean milestones display"""
    
    st.markdown("---")
    st.markdown("## 🏆 Vaše milníky" if language == 'czech' else "## 🏆 Your milestones")
    st.markdown("*Každý milník je důvodem k oslavě*" if language == 'czech' else "*Every milestone is a reason to celebrate*")
    
    milestones = [
        (1, "🌱", "První krok" if language == 'czech' else "First step"),
        (3, "🌿", "Na správné cestě" if language == 'czech' else "On the right path"),
        (5, "🌳", "Rostoucí dopad" if language == 'czech' else "Growing impact"),
        (10, "🏆", "Skutečný pomocník" if language == 'czech' else "Real helper"),
        (20, "⭐", "Inspirace pro ostatní" if language == 'czech' else "Inspiration for others"),
        (50, "💎", "Mistr pomoci" if language == 'czech' else "Master of help")
    ]
    
    # Display milestones in rows of 3
    for i in range(0, len(milestones), 3):
        cols = st.columns(3)
        for j, (threshold, emoji, name) in enumerate(milestones[i:i+3]):
            with cols[j]:
                is_achieved = actions_count >= threshold
                
                if is_achieved:
                    st.success(f"{emoji} **{name}** ({threshold} {'akcí' if language == 'czech' else 'actions'}) ✅")
                else:
                    st.info(f"{emoji} **{name}** ({threshold} {'akcí' if language == 'czech' else 'actions'})")
    
    # Show progress to next milestone
    next_milestone = next((m for m in milestones if actions_count < m[0]), None)
    if next_milestone:
        threshold, emoji, name = next_milestone
        remaining = threshold - actions_count
        progress = actions_count / threshold
        
        if language == 'czech':
            progress_text = f"Do dalšího milníku '{name}' vám zbývá {remaining} {'akce' if remaining < 5 else 'akcí'}!"
        else:
            progress_text = f"You need {remaining} more action{'s' if remaining != 1 else ''} to reach '{name}'!"
        
        st.info(progress_text)
        st.progress(progress)

def _render_personal_reflections(language, total_impact):
    """Show personal reflections"""
    
    st.markdown("---")
    st.markdown("## 💭 Vaše zamyšlení" if language == 'czech' else "## 💭 Your reflections")
    
    personal_reflections = total_impact.get('personal_reflections', [])
    
    if personal_reflections:
        st.markdown("*Vaše myšlenky a pocity z cesty pomoci*" if language == 'czech' else "*Your thoughts and feelings from the helping journey*")
        
        # Show recent reflections
        for reflection in personal_reflections[-3:]:  # Show last 3
            reflection_date = reflection.get('date', '')
            reflection_text = reflection.get('reflection', '')
            
            if reflection_date and reflection_text:
                try:
                    date_obj = datetime.fromisoformat(reflection_date)
                    formatted_date = date_obj.strftime("%d.%m.%Y")
                except:
                    formatted_date = reflection_date
                
                with st.container():
                    st.markdown(f"**📅 {formatted_date}**")
                    st.markdown(f"> *{reflection_text}*")
    else:
        st.markdown("*Zatím jste si nezapisovali žádná zamyšlení. Zkuste přidat nějaké při příští akci!*" if language == 'czech' else "*You haven't recorded any reflections yet. Try adding some with your next action!*")
    
    # Encourage adding reflections
    if language == 'czech':
        st.info("💡 **Tip:** Při příští akci si zkuste zapsat, jak se cítíte. Vaše myšlenky jsou důležitější než jakákoliv čísla.")
    else:
        st.info("💡 **Tip:** Try writing down how you feel with your next action. Your thoughts are more important than any numbers.")

def _render_encouragement(language, actions_count):
    """Show encouragement section"""
    
    st.markdown("---")
    
    # Get appropriate encouragement
    if actions_count == 0:
        encouragement = get_random_encouragement("first_step_motivation", language)
    elif actions_count < 5:
        encouragement = get_random_encouragement("early_journey", language)
    else:
        encouragement = get_random_encouragement("experienced_helper", language)
    
    if encouragement:
        st.success(f"💚 {encouragement}")
    
    # Czech wisdom for inspiration
    if language == 'czech' and random.random() < 0.4:
        proverb = get_czech_proverb('impact')
        if proverb:
            st.info(f"🌿 {proverb}")

def _show_next_steps(language, total_impact):
    """Show next steps section"""
    
    st.markdown("---")
    st.markdown("## 🌟 Vaše další kroky" if language == 'czech' else "## 🌟 Your next steps")
    st.markdown("*Každý krok na vaší cestě má svůj význam*" if language == 'czech' else "*Every step on your journey has its meaning*")
    
    actions_count = total_impact['actions']
    
    if actions_count == 0:
        # For new users
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("⚡ Rychlé akce" if language == 'czech' else "⚡ Quick actions", use_container_width=True, type="primary"):
                st.session_state.current_page = 'quick_actions'
                st.rerun()
        
        with col2:
            if st.button("🧭 Najít mou cestu" if language == 'czech' else "🧭 Find my path", use_container_width=True):
                st.session_state.assessment_step = 1
                st.session_state.current_page = 'assessment'
                st.rerun()
    
    else:
        # For users with actions
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("⚡ Další akce" if language == 'czech' else "⚡ More actions", use_container_width=True, type="primary"):
                st.session_state.current_page = 'quick_actions'
                st.rerun()
        
        with col2:
            if st.button("🌍 Prozkoumat oblasti" if language == 'czech' else "🌍 Explore areas", use_container_width=True):
                st.session_state.current_page = 'causes'
                st.rerun()
        
        with col3:
            if st.button("📖 Sdílet příběh" if language == 'czech' else "📖 Share story", use_container_width=True):
                _show_sharing_section(language, actions_count)

def _show_sharing_section(language, actions_count):
    """Show sharing section"""
    
    with st.expander("📖 Sdílet váš příběh pomoci" if language == 'czech' else "📖 Share your helping story", expanded=True):
        if language == 'czech':
            st.markdown(f"""
            ### 🌟 Váš příběh inspirace
            
            Dokončili jste **{actions_count}** {'akci' if actions_count == 1 else 'akce' if actions_count < 5 else 'akcí'} pomoci!
            
            **Váš dopad:**
            - ✅ {actions_count} pozitivních kroků
            - 🌊 Pozitivní vliv na komunitu
            - 💚 Inspirace pro ostatní
            
            *"Malé kroky, velké změny. Každá akce má svůj význam."*
            """)
        else:
            st.markdown(f"""
            ### 🌟 Your inspiration story
            
            You've completed **{actions_count}** helping action{'s' if actions_count != 1 else ''}!
            
            **Your impact:**
            - ✅ {actions_count} positive steps
            - 🌊 Positive influence on community
            - 💚 Inspiration for others
            
            *"Small steps, big changes. Every action has its meaning."*
            """)
        
        # Simple sharing options
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("📱 Sdílet na sociálních sítích" if language == 'czech' else "📱 Share on social media", use_container_width=True):
                if language == 'czech':
                    share_text = f"Právě jsem dokončil/a {actions_count} akcí pomoci prostřednictvím Akcelerátoru altruismu! 🌟 Každý malý krok má význam. #AkceleratorAltruismu #Pomoc"
                else:
                    share_text = f"Just completed {actions_count} helping actions through Altruism Accelerator! 🌟 Every small step matters. #AltruismAccelerator #Helping"
                
                st.code(share_text)
        
        with col2:
            if st.button("📧 Poslat přátelům" if language == 'czech' else "📧 Send to friends", use_container_width=True):
                if language == 'czech':
                    email_text = f"Ahoj! Chtěl/a jsem se podělit o krásnou věc - dokončil/a jsem {actions_count} akcí pomoci a cítím se skvěle! Možná by tě zajímalo také začít: [odkaz na aplikaci]"
                else:
                    email_text = f"Hi! I wanted to share something beautiful - I completed {actions_count} helping actions and feel great! Maybe you'd be interested in starting too: [app link]"
                
                st.code(email_text) 