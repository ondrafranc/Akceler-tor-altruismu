"""Beautiful impact page - your story of meaningful change"""

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
    """Beautiful impact experience - your story of meaningful change"""
    language = st.session_state.language
    track_page_visit('impact')
    
    # Create beautiful, inspiring container
    st.markdown("""
    <div class="impact-container" style="
        background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
        border-radius: 20px;
        padding: 2rem;
        margin: 1rem 0;
        border: 1px solid #d1c4e9;
        box-shadow: 0 4px 20px rgba(156, 39, 176, 0.1);
    ">
    """, unsafe_allow_html=True)
    
    # Get user data
    total_impact = st.session_state.get('total_impact', {'actions': 0, 'estimated_reach': 0})
    behavior_insights = get_user_behavior_insights()
    
    # Beautiful header
    _render_beautiful_header(language, total_impact)
    
    # Show appropriate content based on user's journey stage
    if total_impact['actions'] == 0:
        _show_beautiful_beginning_story(language)
    else:
        _show_beautiful_impact_story(language, total_impact, behavior_insights)
    
    # Always show inspiration and next steps
    _show_beautiful_inspiration_section(language, total_impact)
    
    st.markdown("</div>", unsafe_allow_html=True)

def _render_beautiful_header(language, total_impact):
    """Beautiful header that celebrates the user's journey"""
    
    actions_count = total_impact['actions']
    
    if language == 'czech':
        if actions_count == 0:
            title = "📖 Váš příběh pomoci"
            subtitle = "Každý příběh má svůj začátek – váš čeká na první kapitolu"
        else:
            title = f"📖 Váš příběh pomoci"
            subtitle = f"Už jste napsali {actions_count} {'kapitolu' if actions_count == 1 else 'kapitoly' if actions_count < 5 else 'kapitol'} pozitivní změny"
    else:
        if actions_count == 0:
            title = "📖 Your story of help"
            subtitle = "Every story has its beginning – yours is waiting for the first chapter"
        else:
            title = f"📖 Your story of help"
            subtitle = f"You've already written {actions_count} chapter{'s' if actions_count != 1 else ''} of positive change"
    
    st.markdown(f"""
    <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="
            font-size: 2.5rem;
            color: #6A1B9A;
            margin-bottom: 0.5rem;
            font-weight: 600;
        ">{title}</h1>
        <p style="
            font-size: 1.2rem;
            color: #4A4A4A;
            font-style: italic;
            margin-bottom: 1rem;
            line-height: 1.4;
        ">{subtitle}</p>
    </div>
    """, unsafe_allow_html=True)

def _show_beautiful_beginning_story(language):
    """Beautiful beginning story for new users"""
    
    if language == 'czech':
        st.markdown("""
        ### 🌱 Váš příběh začíná teď
        
        *Představte si, že každá akce pomoci je jako malý kámen hozený do klidné vody. 
        Vytvoří kruhy, které se šíří dál, než můžete vidět.*
        """)
        
        # Beautiful illustration of potential impact
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
            padding: 2rem;
            border-radius: 15px;
            margin: 1.5rem 0;
            text-align: center;
            border: 1px solid #e8f5e8;
        ">
            <h3 style="color: #2E5D31; margin-bottom: 1rem;">Co vás čeká</h3>
            
            <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 1rem;">
                <div style="flex: 1; min-width: 200px;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">🌟</div>
                    <h4 style="color: #2E5D31;">První krok</h4>
                    <p style="color: #5A6B5A;">Vaše první akce pomoci</p>
                </div>
                
                <div style="flex: 1; min-width: 200px;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">🌊</div>
                    <h4 style="color: #2E5D31;">Vlnky změny</h4>
                    <p style="color: #5A6B5A;">Váš dopad se šíří dál</p>
                </div>
                
                <div style="flex: 1; min-width: 200px;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">🌈</div>
                    <h4 style="color: #2E5D31;">Krásný příběh</h4>
                    <p style="color: #5A6B5A;">Každá akce má svůj význam</p>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Encouraging call to action
        st.markdown("""
        ### 💫 Připraveni začít?
        
        *Váš první krok nemusí být velký – stačí, když bude upřímný.*
        """)
        
    else:
        st.markdown("""
        ### 🌱 Your story begins now
        
        *Imagine that every helping action is like a small stone thrown into calm water. 
        It creates circles that spread farther than you can see.*
        """)
        
        # Beautiful illustration of potential impact
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
            padding: 2rem;
            border-radius: 15px;
            margin: 1.5rem 0;
            text-align: center;
            border: 1px solid #e8f5e8;
        ">
            <h3 style="color: #2E5D31; margin-bottom: 1rem;">What awaits you</h3>
            
            <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 1rem;">
                <div style="flex: 1; min-width: 200px;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">🌟</div>
                    <h4 style="color: #2E5D31;">First step</h4>
                    <p style="color: #5A6B5A;">Your first helping action</p>
                </div>
                
                <div style="flex: 1; min-width: 200px;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">🌊</div>
                    <h4 style="color: #2E5D31;">Ripples of change</h4>
                    <p style="color: #5A6B5A;">Your impact spreads further</p>
                </div>
                
                <div style="flex: 1; min-width: 200px;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">🌈</div>
                    <h4 style="color: #2E5D31;">Beautiful story</h4>
                    <p style="color: #5A6B5A;">Every action has meaning</p>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Encouraging call to action
        st.markdown("""
        ### 💫 Ready to begin?
        
        *Your first step doesn't need to be big – it just needs to be sincere.*
        """)
    
    # Beautiful action buttons
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

def _show_beautiful_impact_story(language, total_impact, behavior_insights):
    """Beautiful impact story for users with actions - honest and reflective"""
    
    actions_count = total_impact['actions']
    
    # Beautiful impact summary with honest metrics
    _render_beautiful_impact_summary(language, actions_count, total_impact)
    
    # Story timeline
    _render_beautiful_timeline(language, behavior_insights)
    
    # Milestones and celebrations
    _render_beautiful_milestones(language, actions_count)
    
    # Personal reflections instead of fake impact visualization
    _render_personal_reflections(language, total_impact)

def _render_beautiful_impact_summary(language, actions_count, total_impact):
    """Beautiful summary of user's honest journey - no fake metrics"""
    
    if language == 'czech':
        st.markdown("### ✨ Váš příběh v číslech")
        
        # Calculate authentic metrics
        days_active = _calculate_days_active()
        streak = get_user_streak()
        days_since_start = total_impact.get('days_since_start', 0)
        
        # Beautiful metrics cards with honest language
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #e8f5e8 0%, #d4e7d4 100%);
                padding: 1.5rem;
                border-radius: 15px;
                text-align: center;
                border: 1px solid #c8e6c9;
            ">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🌟</div>
                <h2 style="color: #2E5D31; margin: 0;">{actions_count}</h2>
                <p style="color: #5A6B5A; margin: 0;">kroků na vaší cestě</p>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
                padding: 1.5rem;
                border-radius: 15px;
                text-align: center;
                border: 1px solid #ffcc80;
            ">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🌱</div>
                <h2 style="color: #e65100; margin: 0;">{days_since_start}</h2>
                <p style="color: #5A4A3A; margin: 0;">dní od začátku</p>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
                padding: 1.5rem;
                border-radius: 15px;
                text-align: center;
                border: 1px solid #d1c4e9;
            ">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔥</div>
                <h2 style="color: #6A1B9A; margin: 0;">{streak}</h2>
                <p style="color: #4A4A4A; margin: 0;">dní v řadě</p>
            </div>
            """, unsafe_allow_html=True)
        
    else:
        st.markdown("### ✨ Your story in numbers")
        
        # Calculate authentic metrics
        days_active = _calculate_days_active()
        streak = get_user_streak()
        days_since_start = total_impact.get('days_since_start', 0)
        
        # Beautiful metrics cards with honest language
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #e8f5e8 0%, #d4e7d4 100%);
                padding: 1.5rem;
                border-radius: 15px;
                text-align: center;
                border: 1px solid #c8e6c9;
            ">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🌟</div>
                <h2 style="color: #2E5D31; margin: 0;">{actions_count}</h2>
                <p style="color: #5A6B5A; margin: 0;">steps on your path</p>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
                padding: 1.5rem;
                border-radius: 15px;
                text-align: center;
                border: 1px solid #ffcc80;
            ">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🌱</div>
                <h2 style="color: #e65100; margin: 0;">{days_since_start}</h2>
                <p style="color: #5A4A3A; margin: 0;">days since start</p>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
                padding: 1.5rem;
                border-radius: 15px;
                text-align: center;
                border: 1px solid #d1c4e9;
            ">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔥</div>
                <h2 style="color: #6A1B9A; margin: 0;">{streak}</h2>
                <p style="color: #4A4A4A; margin: 0;">days in a row</p>
            </div>
            """, unsafe_allow_html=True)
    
    # Add honest journey reflection
    journey_description = total_impact.get('journey_description', '')
    if journey_description:
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #f0fff0 0%, #e8f5e8 100%);
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
            margin: 1.5rem 0;
            border: 1px solid #d4e7d4;
        ">
            <div style="color: #2E5D31; font-style: italic; line-height: 1.6; font-size: 1.1rem;">
                💚 {journey_description}
            </div>
        </div>
        """, unsafe_allow_html=True)

def _render_beautiful_timeline(language, behavior_insights):
    """Beautiful timeline of user's helping journey"""
    
    recent_actions = get_recent_actions(days=30)
    
    if not recent_actions:
        return
    
    if language == 'czech':
        st.markdown("### 📅 Vaše cesta pomoci")
        st.markdown("*Každý krok na vaší cestě má svůj příběh*")
    else:
        st.markdown("### 📅 Your helping journey")
        st.markdown("*Every step on your journey has its story*")
    
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
    
    # Beautiful timeline
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
        
        st.markdown(f"""
        <div style="
            background: #fafbfa;
            padding: 1.2rem;
            border-radius: 12px;
            margin: 0.8rem 0;
            border-left: 4px solid #7AB87A;
        ">
            <h4 style="color: #2E5D31; margin-bottom: 0.8rem;">📅 {date_text}</h4>
        """, unsafe_allow_html=True)
        
        for action in actions:
            action_title = action.get('title', 'Akce pomoci')
            st.markdown(f"""
            <div style="
                background: #f0fff0;
                padding: 0.8rem;
                border-radius: 8px;
                margin: 0.5rem 0;
                display: flex;
                align-items: center;
            ">
                <span style="font-size: 1.5rem; margin-right: 0.8rem;">✅</span>
                <span style="color: #2E5D31; font-weight: 500;">{action_title}</span>
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown("</div>", unsafe_allow_html=True)

def _render_beautiful_milestones(language, actions_count):
    """Beautiful milestones and achievements"""
    
    milestones = [
        (1, "🌱", "První krok" if language == 'czech' else "First step"),
        (3, "🌿", "Na správné cestě" if language == 'czech' else "On the right path"),
        (5, "🌳", "Rostoucí dopad" if language == 'czech' else "Growing impact"),
        (10, "🏆", "Skutečný pomocník" if language == 'czech' else "Real helper"),
        (20, "⭐", "Inspirace pro ostatní" if language == 'czech' else "Inspiration for others"),
        (50, "💎", "Mistr pomoci" if language == 'czech' else "Master of help")
    ]
    
    if language == 'czech':
        st.markdown("### 🏆 Vaše milníky")
        st.markdown("*Každý milník je důvodem k oslavě*")
    else:
        st.markdown("### 🏆 Your milestones")
        st.markdown("*Every milestone is a reason to celebrate*")
    
    # Beautiful milestone display
    cols = st.columns(3)
    
    for i, (threshold, emoji, name) in enumerate(milestones):
        with cols[i % 3]:
            is_achieved = actions_count >= threshold
            is_next = not is_achieved and (i == 0 or actions_count >= milestones[i-1][0])
            
            if is_achieved:
                card_style = """
                background: linear-gradient(135deg, #e8f5e8 0%, #d4e7d4 100%);
                border: 2px solid #7AB87A;
                opacity: 1;
                """
                text_color = "#2E5D31"
            elif is_next:
                card_style = """
                background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
                border: 2px solid #FF9800;
                opacity: 1;
                """
                text_color = "#e65100"
            else:
                card_style = """
                background: #f5f5f5;
                border: 2px solid #ddd;
                opacity: 0.6;
                """
                text_color = "#999"
            
            st.markdown(f"""
            <div style="
                {card_style}
                padding: 1.2rem;
                border-radius: 12px;
                text-align: center;
                margin: 0.5rem 0;
                transition: all 0.3s ease;
            ">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">{emoji}</div>
                <h4 style="color: {text_color}; margin-bottom: 0.3rem;">{name}</h4>
                <p style="color: {text_color}; margin: 0; font-size: 0.9rem;">{threshold} {'akcí' if language == 'czech' else 'actions'}</p>
                {'<div style="margin-top: 0.5rem;">✅</div>' if is_achieved else ''}
            </div>
            """, unsafe_allow_html=True)
    
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
        
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #f0fff0 0%, #e8f5e8 100%);
            padding: 1.2rem;
            border-radius: 12px;
            text-align: center;
            margin: 1rem 0;
            border: 1px solid #d4e7d4;
        ">
            <p style="color: #2E5D31; margin-bottom: 0.8rem; font-weight: 500;">{progress_text}</p>
            <div style="
                background: #ddd;
                height: 10px;
                border-radius: 5px;
                overflow: hidden;
            ">
                <div style="
                    background: linear-gradient(90deg, #7AB87A, #4CAF50);
                    height: 100%;
                    width: {progress * 100}%;
                    transition: width 0.3s ease;
                "></div>
            </div>
        </div>
        """, unsafe_allow_html=True)

def _render_personal_reflections(language, total_impact):
    """Show personal reflections instead of fake impact visualization"""
    
    personal_reflections = total_impact.get('personal_reflections', [])
    
    if language == 'czech':
        st.markdown("### 💭 Vaše zamyšlení")
        if personal_reflections:
            st.markdown("*Vaše myšlenky a pocity z cesty pomoci*")
        else:
            st.markdown("*Zatím jste si nezapisovali žádná zamyšlení. Zkuste přidat nějaké při příští akci!*")
    else:
        st.markdown("### 💭 Your reflections")
        if personal_reflections:
            st.markdown("*Your thoughts and feelings from the helping journey*")
        else:
            st.markdown("*You haven't recorded any reflections yet. Try adding some with your next action!*")
    
    if personal_reflections:
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
                
                st.markdown(f"""
                <div style="
                    background: #f9f9f9;
                    padding: 1.2rem;
                    border-radius: 12px;
                    margin: 1rem 0;
                    border-left: 4px solid #9C27B0;
                ">
                    <div style="color: #6A1B9A; font-weight: 500; margin-bottom: 0.5rem;">
                        📅 {formatted_date}
                    </div>
                    <div style="color: #4A4A4A; font-style: italic; line-height: 1.5;">
                        "{reflection_text}"
                    </div>
                </div>
                """, unsafe_allow_html=True)
    
    # Encourage adding reflections
    if language == 'czech':
        st.markdown("""
        <div style="
            background: #f3e5f5;
            padding: 1.2rem;
            border-radius: 12px;
            text-align: center;
            margin: 1.5rem 0;
            border: 1px solid #d1c4e9;
        ">
            <div style="color: #6A1B9A; line-height: 1.5;">
                💡 <strong>Tip:</strong> Při příští akci si zkuste zapsat, jak se cítíte. 
                Vaše myšlenky jsou důležitější než jakákoliv čísla.
            </div>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div style="
            background: #f3e5f5;
            padding: 1.2rem;
            border-radius: 12px;
            text-align: center;
            margin: 1.5rem 0;
            border: 1px solid #d1c4e9;
        ">
            <div style="color: #6A1B9A; line-height: 1.5;">
                💡 <strong>Tip:</strong> Try writing down how you feel with your next action. 
                Your thoughts are more important than any numbers.
            </div>
        </div>
        """, unsafe_allow_html=True)

def _show_beautiful_inspiration_section(language, total_impact):
    """Beautiful inspiration section with encouragement and next steps"""
    
    actions_count = total_impact['actions']
    
    # Get appropriate encouragement
    if actions_count == 0:
        encouragement = get_random_encouragement("first_step_motivation", language)
    elif actions_count < 5:
        encouragement = get_random_encouragement("early_journey", language)
    else:
        encouragement = get_random_encouragement("experienced_helper", language)
    
    if encouragement:
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #f0fff0 0%, #e8f5e8 100%);
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            margin: 2rem 0;
            border: 1px solid #d4e7d4;
        ">
            <div style="color: #2E5D31; font-style: italic; line-height: 1.6; font-size: 1.2rem;">
                💚 {encouragement}
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    # Czech wisdom for inspiration
    if language == 'czech' and random.random() < 0.4:
        proverb = get_czech_proverb('impact')
        if proverb:
            st.markdown(f"""
            <div style="
                background: #f3e5f5;
                padding: 1.5rem;
                border-radius: 12px;
                text-align: center;
                margin: 1.5rem 0;
                font-style: italic;
                color: #6A1B9A;
                border-left: 4px solid #9C27B0;
            ">
                🌿 {proverb}
            </div>
            """, unsafe_allow_html=True)
    
    # Beautiful next steps
    _render_beautiful_next_steps(language, actions_count)

def _render_beautiful_next_steps(language, actions_count):
    """Beautiful next steps section"""
    
    if language == 'czech':
        st.markdown("""
        ### 🌟 Vaše další kroky
        
        *Každý krok na vaší cestě má svůj význam*
        """)
    else:
        st.markdown("""
        ### 🌟 Your next steps
        
        *Every step on your journey has its meaning*
        """)
    
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
                _show_sharing_modal(language, actions_count)

def _show_sharing_modal(language, actions_count):
    """Show beautiful sharing modal"""
    
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
            
            **Chcete inspirovat ostatní?** Sdílejte svůj příběh a ukažte, že pomoc je možná pro každého.
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
            
            **Want to inspire others?** Share your story and show that helping is possible for everyone.
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

def _calculate_days_active():
    """Calculate number of days user has been active"""
    recent_actions = get_recent_actions(days=365)  # Look at full year
    if not recent_actions:
        return 0
    
    dates = set()
    for action in recent_actions:
        completed_at = action.get('completed_at')
        if isinstance(completed_at, str):
            try:
                date = datetime.fromisoformat(completed_at).date()
            except:
                date = datetime.now().date()
        else:
            date = completed_at.date() if completed_at else datetime.now().date()
        dates.add(date)
    
    return len(dates)

def _render_beautiful_impact_visualization(language, total_impact):
    """Replace fake impact visualization with honest journey visualization"""
    
    actions_count = total_impact['actions']
    
    if actions_count == 0:
        return
    
    if language == 'czech':
        st.markdown("### 📊 Vaše cesta v čase")
        st.markdown("*Každý krok má svůj příběh*")
    else:
        st.markdown("### 📊 Your journey over time")
        st.markdown("*Every step has its story*")
    
    # Create honest journey visualization
    recent_actions = get_recent_actions(days=30)
    if recent_actions and len(recent_actions) > 1:
        # Simple timeline of personal growth
        dates = []
        cumulative_actions = []
        
        for i, action in enumerate(recent_actions):
            completed_at = action.get('completed_at')
            if isinstance(completed_at, str):
                try:
                    date = datetime.fromisoformat(completed_at)
                except:
                    date = datetime.now() - timedelta(days=len(recent_actions) - i)
            else:
                date = completed_at if completed_at else datetime.now() - timedelta(days=len(recent_actions) - i)
            
            dates.append(date)
            cumulative_actions.append(i + 1)
        
        fig = px.line(
            x=dates, 
            y=cumulative_actions,
            title="Váš růst v čase" if language == 'czech' else "Your growth over time",
            labels={
                'x': 'Datum' if language == 'czech' else 'Date',
                'y': 'Celkem kroků' if language == 'czech' else 'Total steps'
            }
        )
        
        fig.update_traces(
            line=dict(color='#7AB87A', width=3),
            marker=dict(size=8, color='#2E5D31')
        )
        
        fig.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            height=300
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Add honest interpretation
        if language == 'czech':
            st.markdown("""
            <div style="
                background: #f0fff0;
                padding: 1rem;
                border-radius: 10px;
                text-align: center;
                margin: 1rem 0;
                font-style: italic;
                color: #2E5D31;
            ">
                📈 Graf ukazuje vaši cestu – ne počet lidí, kterým jste pomohli, 
                ale kroky, které jste udělali vy sami.
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style="
                background: #f0fff0;
                padding: 1rem;
                border-radius: 10px;
                text-align: center;
                margin: 1rem 0;
                font-style: italic;
                color: #2E5D31;
            ">
                📈 This chart shows your journey – not the number of people you helped, 
                but the steps you took yourself.
            </div>
            """, unsafe_allow_html=True) 