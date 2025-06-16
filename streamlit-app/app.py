"""
Akcelerátor altruismu - Czech Cultural Adaptation + Phase 3 Enhancement
Praktický nástroj pro transformaci empatie v konkrétní akce
Enhanced with language support, Czech cultural adaptation, and advanced features
"""

import streamlit as st
import json
import os
import random
from datetime import datetime, timedelta
import uuid
from typing import Dict, List, Any
import math

# Configure page
st.set_page_config(
    page_title="Akcelerátor altruismu",
    page_icon="🇨🇿",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Enhanced CSS for Czech cultural adaptation - Comprehensive UX/UI Refactor
st.markdown("""
<style>
    /* Enhanced Typography Hierarchy */
    .main-header {
        font-size: clamp(2rem, 5vw, 2.8rem);
        color: #2E5D31;
        text-align: center;
        margin-bottom: 1.5rem;
        font-weight: 700;
        line-height: 1.2;
        text-shadow: 0 2px 4px rgba(46, 93, 49, 0.1);
        animation: fadeInDown 0.6s ease-out;
    }
    .sub-header {
        font-size: clamp(1.1rem, 3vw, 1.3rem);
        color: #5A6B5A;
        text-align: center;
        margin-bottom: 2.5rem;
        font-style: normal;
        font-weight: 400;
        line-height: 1.5;
        animation: fadeIn 0.8s ease-out 0.2s both;
    }
    .section-header {
        font-size: clamp(1.4rem, 4vw, 1.8rem);
        color: #2E5D31;
        margin-bottom: 1.5rem;
        font-weight: 600;
        border-bottom: 2px solid #A8D5A8;
        padding-bottom: 0.5rem;
    }
    /* Enhanced Card System */
    .cause-card {
        border: 1px solid #A8D5A8;
        border-radius: 16px;
        padding: 2rem;
        margin: 1.5rem 0;
        background: linear-gradient(135deg, #F8FDF8 0%, #F0F8F0 100%);
        box-shadow: 0 4px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-top: 3px solid transparent;
    }
    .cause-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.08);
        border-color: #7AB87A;
        border-top-color: #7AB87A;
        background: linear-gradient(135deg, #F9FEF9 0%, #F2F9F2 100%);
    }
    .action-card {
        border: 1px solid #C4E4C4;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1rem 0;
        background: linear-gradient(135deg, #FAFBFA 0%, #F5F7F5 100%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        border-left: 4px solid transparent;
    }
    .action-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
        border-color: #9BC89B;
        border-left-color: #7AB87A;
        background: linear-gradient(135deg, #FBFCFB 0%, #F6F8F6 100%);
    }
    
    /* Enhanced Button System */
    .stButton > button {
        background: linear-gradient(135deg, #7AB87A 0%, #5A9B5A 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 10px !important;
        padding: 0.75rem 1.5rem !important;
        font-weight: 600 !important;
        font-size: 0.95rem !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow: 0 3px 6px rgba(122, 184, 122, 0.3) !important;
        text-transform: none !important;
        letter-spacing: 0.01em !important;
    }
    .stButton > button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 12px rgba(122, 184, 122, 0.4) !important;
        background: linear-gradient(135deg, #8BC88B 0%, #6BAC6B 100%) !important;
    }
    .stButton > button:active {
        transform: translateY(0) !important;
        box-shadow: 0 2px 4px rgba(122, 184, 122, 0.3) !important;
    }
    .progress-text {
        font-size: 0.9rem;
        color: #4A5E4A;
        text-align: center;
        font-weight: 500;
    }
    .celebration {
        background: linear-gradient(45deg, #7AB87A, #9BC89B);
        color: white;
        padding: 1.2rem;
        border-radius: 10px;
        text-align: center;
        font-weight: 600;
        animation: gentleGlow 1.5s ease-in-out;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
    @keyframes gentleGlow {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
    .quiet-celebration {
        background: linear-gradient(135deg, #E8F5E8 0%, #D4E7D4 100%);
        color: #2E5D31;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        font-weight: 500;
        border-left: 4px solid #7AB87A;
    }
    .quote-box {
        background: linear-gradient(135deg, #F5F8F5 0%, #EDF2ED 100%);
        border-left: 3px solid #7AB87A;
        padding: 1rem;
        margin: 1rem 0;
        font-style: italic;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .impact-metric {
        text-align: center;
        padding: 1.2rem;
        background: linear-gradient(135deg, #F0F8F0 0%, #E8F2E8 100%);
        border-radius: 12px;
        margin: 0.5rem 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        border: 1px solid #D4E7D4;
    }
    .success-story {
        background: linear-gradient(135deg, #F8FBF8 0%, #F0F6F0 100%);
        border-radius: 10px;
        padding: 1.2rem;
        margin: 1rem 0;
        border: 1px solid #E0EBE0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    }
    .language-selector {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 1000;
        background: white;
        border-radius: 20px;
        padding: 5px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .streak-indicator {
        background: linear-gradient(45deg, #7AB87A, #5A9B5A);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-block;
        margin: 0.2rem;
    }
    /* Enhanced Layout System */
    .content-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem 2rem;
    }
    .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 2rem 0;
    }
    
    /* Enhanced Progress Indicators */
    .stProgress > div > div {
        background: linear-gradient(90deg, #7AB87A 0%, #5A9B5A 100%) !important;
        border-radius: 10px !important;
        height: 8px !important;
    }
    .stProgress > div {
        background-color: #E0EBE0 !important;
        border-radius: 10px !important;
        height: 8px !important;
    }
    
    /* Enhanced Selectbox and Input Styling */
    .stSelectbox > div > div {
        border-radius: 8px !important;
        border: 2px solid #C4E4C4 !important;
        transition: all 0.3s ease !important;
    }
    .stSelectbox > div > div:focus-within {
        border-color: #7AB87A !important;
        box-shadow: 0 0 0 3px rgba(122, 184, 122, 0.1) !important;
    }
    
    /* Enhanced Multiselect Styling */
    .stMultiSelect > div > div {
        border-radius: 8px !important;
        border: 2px solid #C4E4C4 !important;
    }
    .stMultiSelect > div > div:focus-within {
        border-color: #7AB87A !important;
        box-shadow: 0 0 0 3px rgba(122, 184, 122, 0.1) !important;
    }
    
    /* Enhanced Radio Button Styling */
    .stRadio > div {
        gap: 1rem !important;
    }
    .stRadio > div > label {
        padding: 0.75rem 1rem !important;
        border-radius: 8px !important;
        border: 1px solid #C4E4C4 !important;
        background: #FAFBFA !important;
        transition: all 0.3s ease !important;
        cursor: pointer !important;
    }
    .stRadio > div > label:hover {
        background: #F0F8F0 !important;
        border-color: #9BC89B !important;
    }
    
    /* Responsive Design Improvements */
    @media (max-width: 768px) {
        .content-container {
            padding: 1rem;
        }
        .main-header {
            font-size: 1.8rem !important;
            margin-bottom: 1rem !important;
        }
        .sub-header {
            font-size: 1rem !important;
            margin-bottom: 1.5rem !important;
        }
        .cause-card, .action-card {
            padding: 1rem !important;
            margin: 0.75rem 0 !important;
        }
        .card-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
        }
        .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
        }
    }
    
    /* Enhanced Accessibility */
    .stButton > button:focus {
        outline: 3px solid rgba(122, 184, 122, 0.5) !important;
        outline-offset: 2px !important;
    }
    .cause-card:focus, .action-card:focus {
        outline: 2px solid #7AB87A !important;
        outline-offset: 2px !important;
    }
    
    @keyframes fadeInDown {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes gentleGlow {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'user_id' not in st.session_state:
    st.session_state.user_id = f"user_{uuid.uuid4().hex[:8]}"
if 'language' not in st.session_state:
    st.session_state.language = 'czech'
if 'assessment_step' not in st.session_state:
    st.session_state.assessment_step = 0
if 'user_profile' not in st.session_state:
    st.session_state.user_profile = {}
if 'actions_completed' not in st.session_state:
    st.session_state.actions_completed = []
if 'total_impact' not in st.session_state:
    st.session_state.total_impact = {'actions': 0, 'time': 0, 'money': 0}
if 'streak_count' not in st.session_state:
    st.session_state.streak_count = 0
if 'last_action_date' not in st.session_state:
    st.session_state.last_action_date = None
if 'seasonal_challenge' not in st.session_state:
    st.session_state.seasonal_challenge = None

# Advanced data loading functions with language support
@st.cache_data
def load_causes_data(language='czech'):
    """Load causes data based on language"""
    try:
        if language == 'czech':
            with open('data/czech/causes_czech.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            with open('data/international/causes.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
        return data.get('causes', {})
    except FileNotFoundError:
        st.warning(f"Causes data file not found for {language}. Using fallback.")
        return {}

@st.cache_data
def load_actions_data(language='czech'):
    """Load actions data based on language"""
    try:
        if language == 'czech':
            with open('data/czech/actions_czech.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            with open('data/international/actions.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
        return data.get('actions', {})
    except FileNotFoundError:
        st.warning(f"Actions data file not found for {language}.")
        return {}

@st.cache_data
def load_encouragement_data(language='czech'):
    """Load encouragement messages based on language"""
    try:
        if language == 'czech':
            with open('data/czech/encouragement_czech.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            with open('data/international/encouragement_messages.json', 'r', encoding='utf-8') as f:
                return json.load(f)
    except FileNotFoundError:
        if language == 'czech':
            return {"welcome_messages": ["Vítejte v Akcelerátoru altruismu!"]}
        else:
            return {"welcome_messages": ["Welcome to Altruism Accelerator!"]}

def get_text(key, language='czech'):
    """Get localized text"""
    texts = {
        'czech': {
            'title': '🇨🇿 Akcelerátor altruismu',
            'subtitle': 'Praktické kroky k pomoci druhým',
            'welcome': 'Vítejte',
            'find_path': 'Najít cestu',
            'quick_actions': 'Rychlé akce',
            'my_impact': 'Můj dopad',
            'explore_causes': 'Prozkoumat oblasti',
            'language': 'Jazyk',
            'czech': 'Čeština',
            'english': 'English',
            'actions_taken': 'Provedené akce',
            'time_contributed': 'Čas přispěný',
            'money_donated': 'Darováno',
            'start_action': 'Začít',
            'complete_action': 'Dokončit akci',
            'take_assessment': 'Projít posouzením',
            'get_quick_help': 'Rychlá pomoc',
        },
        'english': {
            'title': '🌱 Altruism Accelerator',
            'subtitle': 'Transform overwhelm into meaningful action',
            'welcome': 'Welcome',
            'find_path': 'Find Your Path',
            'quick_actions': 'Quick Actions',
            'my_impact': 'My Impact',
            'explore_causes': 'Explore Causes',
            'language': 'Language',
            'czech': 'Čeština',
            'english': 'English',
            'actions_taken': 'Actions Taken',
            'time_contributed': 'Time Contributed',
            'money_donated': 'Money Donated',
            'start_action': 'Start This',
            'complete_action': 'Complete Action',
            'take_assessment': 'Take Assessment',
            'get_quick_help': 'Get Quick Help',
        }
    }
    return texts.get(language, texts['czech']).get(key, key)

def get_random_encouragement(category="welcome_messages", language='czech'):
    """Get a random encouraging message"""
    encouragement_data = load_encouragement_data(language)
    messages = encouragement_data.get(category, ["You're making a difference!"])
    return random.choice(messages)

def get_seasonal_message(language='czech'):
    """Get seasonal encouragement message"""
    encouragement_data = load_encouragement_data(language)
    current_month = datetime.now().month
    
    if current_month in [3, 4, 5]:  # Spring
        season = 'spring'
    elif current_month in [6, 7, 8]:  # Summer
        season = 'summer'
    elif current_month in [9, 10, 11]:  # Autumn
        season = 'autumn'
    else:  # Winter
        season = 'winter'
    
    seasonal_messages = encouragement_data.get("czech_seasonal_messages", {}).get(season, [])
    if seasonal_messages:
        return random.choice(seasonal_messages)
    return None

# Advanced matching algorithm - Phase 3 enhancement
def calculate_advanced_action_score(user_profile: Dict, action: Dict) -> float:
    """Advanced multi-factor scoring system"""
    score = 0
    
    # Values alignment (0-40 points)
    values_score = calculate_cause_match(
        user_profile.get('values', []), 
        action.get('cause_values', [])
    ) * 40
    score += values_score
    
    # Resource compatibility (0-30 points)
    time_available = user_profile.get('time_available', '30_minutes_or_less')
    time_limit = {'30 minutes or less': 30, '1-2 hours': 120, '3-5 hours': 300, '10+ hours': 600}
    action_time = action.get('requirements', {}).get('time_minutes', 0)
    
    if action_time <= time_limit.get(time_available, 30):
        score += 20
    
    budget = user_profile.get('financial_capacity', '0')
    budget_limit = {'Nothing right now': 0, 'Up to $10': 10, 'Up to $50': 50, '$100+': 500}
    action_cost = action.get('requirements', {}).get('cost_usd', 0)
    
    if action_cost <= budget_limit.get(budget, 0):
        score += 10
    
    # Emotional state adaptation (0-20 points)
    emotional_state = user_profile.get('emotional_state', 'uncertain')
    action_complexity = action.get('user_experience', {}).get('complexity', 'medium')
    
    if emotional_state in ['overwhelmed', 'uncertain'] and action_complexity == 'low':
        score += 20
    elif emotional_state in ['motivated', 'frustrated'] and action_complexity in ['medium', 'high']:
        score += 15
    else:
        score += 10
    
    # Skill matching (0-10 points)
    user_skills = set(user_profile.get('skills', []))
    action_skills = set(action.get('requirements', {}).get('skills', []))
    skill_overlap = len(user_skills & action_skills)
    score += min(skill_overlap * 3, 10)
    
    return score

def calculate_cause_match(user_values: List[str], cause_values: List[str]) -> float:
    """Calculate how well a cause matches user values"""
    if not user_values or not cause_values:
        return 0.3
    
    # Map Czech values to cause values
    value_mapping = {
        '🌍 Protecting the environment': 'environment',
        '📚 Advancing education': 'education', 
        '⚖️ Promoting justice and equality': 'justice',
        '❤️ Reducing suffering': 'reducing_suffering',
        '🤝 Building community connections': 'community',
        '💼 Creating economic opportunities': 'opportunities',
        '🔬 Supporting scientific progress': 'science',
        '🎨 Preserving culture and arts': 'culture'
    }
    
    user_vals_normalized = []
    for val in user_values:
        mapped_val = value_mapping.get(val)
        if mapped_val:
            user_vals_normalized.append(mapped_val)
    
    if not user_vals_normalized:
        return 0.3
    
    overlap = len(set(user_vals_normalized) & set(cause_values))
    return min(overlap / len(user_vals_normalized), 1.0)

def update_streak():
    """Update action streak - Phase 3 feature"""
    today = datetime.now().date()
    last_date = st.session_state.last_action_date
    
    if last_date is None:
        st.session_state.streak_count = 1
    elif last_date == today:
        # Same day, don't increment
        return
    elif last_date == today - timedelta(days=1):
        # Consecutive day
        st.session_state.streak_count += 1
    else:
        # Streak broken
        st.session_state.streak_count = 1
    
    st.session_state.last_action_date = today

def get_matching_actions(cause_id: str, user_profile: Dict, language='czech') -> List[Dict]:
    """Get actions that match user profile from the cause"""
    actions_data = load_actions_data(language)
    matching_actions = []
    
    for action_id, action in actions_data.items():
        if action.get('cause_id') == cause_id:
            score = calculate_advanced_action_score(user_profile, action)
            matching_actions.append((action, score))
    
    # Sort by score and return top actions
    matching_actions.sort(key=lambda x: x[1], reverse=True)
    return [action for action, score in matching_actions]

def celebrate_action_completion(action_title: str, cause_type: str = "", language='czech'):
    """Enhanced celebration with cultural adaptation"""
    encouragement_data = load_encouragement_data(language)
    celebrations = encouragement_data.get("action_completion_celebrations", [])
    
    if celebrations:
        message = random.choice(celebrations)
        message = message.replace("{action}", action_title).replace("{cause}", cause_type)
    else:
        if language == 'czech':
            message = f"Výborně! Dokončil/a jsi '{action_title}'!"
        else:
            message = f"Amazing work completing '{action_title}'!"
    
    # Czech style: quieter celebration
    if language == 'czech':
        st.markdown(f'<div class="quiet-celebration">{message}</div>', unsafe_allow_html=True)
        # No balloons for Czech - more understated
    else:
        st.markdown(f'<div class="celebration">{message}</div>', unsafe_allow_html=True)
        st.balloons()
    
    # Update streak
    update_streak()
    
    # Show streak achievement
    if st.session_state.streak_count > 1:
        if language == 'czech':
            streak_msg = f"🔥 {st.session_state.streak_count} akcí v řadě!"
        else:
            streak_msg = f"🔥 {st.session_state.streak_count} day streak!"
        st.markdown(f'<span class="streak-indicator">{streak_msg}</span>', unsafe_allow_html=True)

def main():
    """Main application with enhanced UX/UI"""
    # Enhanced Language selector with better styling
    col1, col2, col3 = st.columns([7, 1.5, 1.5])
    with col2:
        if st.button("🇨🇿 Čeština", help="Přepnout na češtinu", key="lang_cz"):
            st.session_state.language = 'czech'
            st.rerun()
    with col3:
        if st.button("🇺🇸 English", help="Switch to English", key="lang_en"):
            st.session_state.language = 'english'
            st.rerun()
    
    language = st.session_state.language
    
    # Add a subtle divider
    st.markdown("---")
    
    # Enhanced Sidebar with better user guidance
    with st.sidebar:
        st.markdown(f"""
        <div class="content-container">
            <h1 class="main-header" style="font-size: 1.5rem; text-align: left; margin-bottom: 0.5rem;">
                {get_text('title', language)}
            </h1>
            <p style="color: #5A6B5A; font-style: italic; margin-bottom: 1.5rem; font-size: 0.9rem;">
                {get_text('subtitle', language)}
            </p>
        </div>
        """, unsafe_allow_html=True)
    
        # Enhanced user stats with better visual hierarchy
        if st.session_state.total_impact['actions'] > 0:
            st.markdown(f"### 📊 {get_text('my_impact', language)}")
            
            # Progress metrics in a container
            with st.container():
                col1, col2 = st.columns(2)
                with col1:
                    st.metric(
                        label=get_text('actions_taken', language), 
                        value=st.session_state.total_impact['actions'],
                        delta=f"+{len(st.session_state.actions_completed)} dnes" if language == 'czech' else f"+{len(st.session_state.actions_completed)} today"
                    )
                with col2:
                    total_time = st.session_state.total_impact['time']
                    time_label = "Času věnováno" if language == 'czech' else "Time spent"
                    st.metric(
                        label=time_label, 
                        value=f"{total_time} min",
                        delta=f"{total_time/60:.1f}h celkem" if language == 'czech' else f"{total_time/60:.1f}h total"
                    )
            
            # Enhanced streak display
            if st.session_state.streak_count > 1:
                streak_text = f"🔥 **{st.session_state.streak_count} akcí v řadě!**" if language == 'czech' else f"🔥 **{st.session_state.streak_count} day streak!**"
                st.success(streak_text)
            
            st.markdown("---")
    
        # Enhanced contextual encouragement
        if random.random() < 0.4:  # Slightly more frequent encouragement
            if st.session_state.total_impact['actions'] == 0:
                encouragement = get_random_encouragement("welcome_messages", language)
                st.info(f"💚 {encouragement}")
            elif st.session_state.total_impact['actions'] < 3:
                encouragement = get_random_encouragement("progress_encouragement", language)
                st.success(f"🌟 {encouragement}")
            else:
                encouragement = get_random_encouragement("community_impact_messages", language)
                st.balloons() if random.random() < 0.1 else None  # Rare celebration
                st.success(f"🎉 {encouragement}")
        
        # Enhanced seasonal message
        seasonal_msg = get_seasonal_message(language)
        if seasonal_msg and random.random() < 0.3:
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #f0fff0 0%, #e8f5e8 100%);
                border-left: 4px solid #7AB87A;
                border-radius: 8px;
                padding: 1rem;
                margin: 1rem 0;
                font-style: italic;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
                <span style="font-size: 1.1em;">🌿</span> {seasonal_msg}
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        # Enhanced Navigation with better visual hierarchy
        st.markdown("### 🧭 Navigace" if language == 'czech' else "### 🧭 Navigation")
        
        # Navigation with enhanced styling
        pages = {
            f"🏠 {get_text('welcome', language)}": show_welcome_page,
            f"🧭 {get_text('find_path', language)}": show_assessment_page,
            f"⚡ {get_text('quick_actions', language)}": show_quick_actions_page,
            f"📊 {get_text('my_impact', language)}": show_impact_page,
            f"🌍 {get_text('explore_causes', language)}": show_causes_page
        }
        
        selected_page = st.radio(
            "Vyberte stránku:" if language == 'czech' else "Select page:",
            list(pages.keys()),
            label_visibility="collapsed"
        )
    
    # Show selected page
    pages[selected_page]()

def show_welcome_page():
    """Enhanced welcome page with better UX and cultural adaptation"""
    language = st.session_state.language
    
    # Main content container
    st.markdown('<div class="content-container">', unsafe_allow_html=True)
    
    st.markdown(f'<h1 class="main-header">{get_text("title", language)}</h1>', unsafe_allow_html=True)
    
    welcome_msg = get_random_encouragement("welcome_messages", language)
    st.markdown(f'<p class="sub-header">{welcome_msg}</p>', unsafe_allow_html=True)
    
    # Add a welcoming introduction
    if language == 'czech':
        intro_text = """
        🌟 **Vítejte v prostoru, kde se empatie mění v konkrétní činy.**
        
        Tento nástroj vám pomůže najít smysluplné způsoby, jak pomoci druhým – 
        ať už máte 5 minut nebo celý den, žijete v Praze nebo obklopeni přírodou.
        """
    else:
        intro_text = """
        🌟 **Welcome to a space where empathy transforms into concrete action.**
        
        This tool helps you find meaningful ways to help others – 
        whether you have 5 minutes or a whole day, live in Prague or the countryside.
        """
    st.markdown(intro_text)
    
    st.markdown("---")
    
    # Enhanced layout with better visual balance
    col1, col2, col3 = st.columns([1, 3, 1])
    
    with col2:
        # Enhanced seasonal message display
        seasonal_msg = get_seasonal_message(language)
        if seasonal_msg:
            st.markdown(f"""
            <div class="quote-box" style="text-align: center; margin: 2rem 0;">
                <span style="font-size: 1.2em;">🌿</span> {seasonal_msg}
            </div>
            """, unsafe_allow_html=True)
        
        # Enhanced emotional assessment section
        if language == 'czech':
            st.markdown('<h3 class="section-header" style="text-align: center;">💭 Jak se právě cítíš?</h3>', unsafe_allow_html=True)
            st.markdown("*Pomůže nám najít správný přístup pro vás*")
            emotional_options = [
                "😔 Zahlcen/a všemi problémy",
                "😤 Frustrován/a a chci jednat", 
                "😊 Nadějný/á a připraven/a pomoci",
                "😕 Provinile kvůli nedělání dost",
                "🔥 Motivován/a něco změnit",
                "😐 Nejistý/á, kde začít"
            ]
        else:
            st.markdown('<h3 class="section-header" style="text-align: center;">💭 How are you feeling right now?</h3>', unsafe_allow_html=True)
            st.markdown("*This helps us find the right approach for you*")
            emotional_options = [
                "😔 Overwhelmed by all the problems",
                "😤 Frustrated and want to act", 
                "😊 Hopeful and ready to help",
                "😕 Guilty about not doing enough",
                "🔥 Motivated to make a difference",
                "😐 Uncertain where to start"
            ]
        
        # Enhanced emotional state selector
        emotional_state = st.radio(
            "Vyberte možnost, která nejlépe vystihuje váš současný stav:" if language == 'czech' else "Choose the option that best describes your current state:",
            emotional_options,
            key="emotional_state",
            label_visibility="collapsed"
        )
        
        # Enhanced contextual response
        if emotional_state:
            emotion_key = emotional_state.split()[1].lower()
            st.session_state.user_profile['emotional_state'] = emotion_key
            
            # Enhanced contextual response with better messaging
            encouragement_data = load_encouragement_data(language)
            responses = encouragement_data.get("emotional_state_responses", {}).get(emotion_key, [])
            if responses:
                response = random.choice(responses)
                st.success(f"✨ {response}")
            else:
                # Fallback encouraging response
                if language == 'czech':
                    fallback_response = "Rozumíme vašim pocitům. Najdeme společně způsob, jak můžete pomoci."
                else:
                    fallback_response = "We understand how you feel. Let's find a way you can help together."
                st.info(f"💚 {fallback_response}")
        
        st.markdown("---")
        
        # Enhanced CTA section with better hierarchy
        if language == 'czech':
            st.markdown("### 🚀 Jak chcete začít?")
            st.markdown("*Vyberte si cestu, která vám vyhovuje:*")
        else:
            st.markdown("### 🚀 How would you like to start?")
            st.markdown("*Choose the path that suits you:*")
        
        # Better CTA layout with spacing
        col_a, col_space, col_b = st.columns([2, 0.5, 2])
        with col_a:
            if st.button(
                f"🧭 {get_text('take_assessment', language)}", 
                type="primary", 
                use_container_width=True,
                help="Získejte personalizovaná doporučení na míru" if language == 'czech' else "Get personalized recommendations tailored to you"
            ):
                st.session_state.assessment_step = 1
                st.rerun()
        
        with col_b:
            if st.button(
                f"⚡ {get_text('get_quick_help', language)}", 
                use_container_width=True,
                help="Najděte rychlé akce, které můžete udělat hned teď" if language == 'czech' else "Find quick actions you can do right now"
            ):
                # Navigate to quick actions page
                st.session_state.quick_action_requested = True
                st.rerun()
    
    # Close content container
    st.markdown('</div>', unsafe_allow_html=True)

def show_assessment_page():
    """Enhanced assessment with Czech cultural adaptation"""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown('<h1 class="main-header">🧭 Najdi svou cestu k dopadu</h1>', unsafe_allow_html=True)
        steps = ["Hodnoty", "Zdroje", "Doporučení"]
    else:
        st.markdown('<h1 class="main-header">🧭 Find Your Path to Impact</h1>', unsafe_allow_html=True)
        steps = ["Values", "Resources", "Recommendations"]
    
    current_step = st.session_state.get('assessment_step', 0)
    
    if current_step > 0:
        progress = (current_step - 1) / (len(steps) - 1) if len(steps) > 1 else 1.0
        st.progress(progress)
        
        encouragement = get_random_encouragement("assessment_encouragement", language)
        st.info(encouragement)
        
        st.markdown(f'<p class="progress-text">Krok {current_step} z {len(steps)}: {steps[current_step-1]}</p>', unsafe_allow_html=True)
    
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
        st.markdown("### Co je pro tebe nejdůležitější?")
        st.markdown("Vyber své 3 hlavní hodnoty, které tě motivují k pomoci:")
        
        values_options = [
            "🌍 Ochrana životního prostředí",
            "📚 Podpora vzdělání", 
            "⚖️ Prosazování spravedlnosti a rovnosti",
            "❤️ Snižování utrpení",
            "🤝 Budování komunitních vztahů",
            "💼 Vytváření ekonomických příležitostí",
            "🔬 Podpora vědeckého pokroku",
            "🎨 Zachování kultury a umění"
        ]
        help_text = "Tvoje hodnoty nám pomůžou najít oblasti, které budou pro tebe smysluplné."
    else:
        st.markdown("### What matters most to you?")
        st.markdown("Select your top 3 values that drive your desire to help:")
        
        values_options = [
            "🌍 Protecting the environment",
            "📚 Advancing education", 
            "⚖️ Promoting justice and equality",
            "❤️ Reducing suffering",
            "🤝 Building community connections",
            "💼 Creating economic opportunities",
            "🔬 Supporting scientific progress",
            "🎨 Preserving culture and arts"
        ]
        help_text = "Your values help us find causes that will feel meaningful to you."
    
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
        
        st.session_state.user_profile['values'] = selected_values
        
        next_text = "Další: Zdroje" if language == 'czech' else "Next: Resources"
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
    st.session_state.user_profile.update({
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
        next_text = "Získat doporučení! 🎯" if language == 'czech' else "Get My Recommendations! 🎯"
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
    user_profile = st.session_state.user_profile
    
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
    for i, (cause_id, cause_info, match_score) in enumerate(cause_matches[:3]):
        with st.container():
            match_percentage = int(match_score * 100)
            st.markdown(f"""
            <div class="cause-card">
                <h3>{cause_info.get('emoji', '🎯')} {cause_info.get('title', 'Unknown Cause')} 
                    <span style="color: #7AB87A;">({match_percentage}% shoda)</span>
                </h3>
                <p>{cause_info.get('description', 'No description available')}</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Get matching actions using advanced algorithm
            matching_actions = get_matching_actions(cause_id, user_profile, language)
            
            if matching_actions:
                perfect_text = "**✨ Perfektní akce pro tebe:**" if language == 'czech' else "**✨ Perfect actions for you:**"
                st.markdown(perfect_text)
                
                for action in matching_actions[:2]:  # Show top 2 actions
                    col1, col2, col3 = st.columns([3, 1, 1])
                    
                    with col1:
                        st.markdown(f"""
                        <div class="action-card">
                            <h4>{action.get('title', 'Unknown Action')}</h4>
                            <p>{action.get('description', 'No description')}</p>
                            <p><em>Dopad: {action.get('impact', {}).get('metric_description', 'Positive impact')}</em></p>
                        </div>
                        """, unsafe_allow_html=True)
                    
                    with col2:
                        requirements = action.get('requirements', {})
                        st.markdown(f"⏱️ {requirements.get('time_minutes', 0)} min")
                        if language == 'czech':
                            cost_czk = requirements.get('cost_usd', 0) * 25  # Rough conversion
                            st.markdown(f"💰 {cost_czk} Kč")
                        else:
                            st.markdown(f"💰 ${requirements.get('cost_usd', 0)}")
                    
                    with col3:
                        start_text = get_text('start_action', language)
                        if st.button(f"{start_text}! 🚀", key=f"action_{action.get('id', i)}"):
                            # Record action completion
                            st.session_state.actions_completed.append({
                                'id': action.get('id'),
                                'title': action.get('title'),
                                'cause': cause_id,
                                'timestamp': datetime.now().isoformat()
                            })
                            
                            # Update impact metrics
                            st.session_state.total_impact['actions'] += 1
                            st.session_state.total_impact['time'] += requirements.get('time_minutes', 0)
                            st.session_state.total_impact['money'] += requirements.get('cost_usd', 0)
                            
                            # Show celebration
                            cause_title = cause_info.get('title', 'this cause')
                            celebrate_action_completion(action.get('title', 'this action'), cause_title, language)
                            
                            # Show action URL
                            org_website = action.get('organization', {}).get('website')
                            if org_website and org_website != '#':
                                complete_text = get_text('complete_action', language)
                                st.markdown(f"🔗 [{complete_text}]({org_website})")
                                success_text = "✨ Klikni na odkaz výše pro dokončení akce!" if language == 'czech' else "✨ Click the link above to complete your action!"
                                st.info(success_text)
            else:
                no_actions_text = "Momentálně nemáme akce, které by odpovídaly tvým omezením, ale neustále přidáváme další!" if language == 'czech' else "No actions currently match your constraints, but we're always adding more!"
                st.info(no_actions_text)
            
            st.markdown("---")

def show_quick_actions_page():
    """Quick actions with Czech adaptation"""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown('<h1 class="main-header">⚡ Rychlý dopad hned teď</h1>', unsafe_allow_html=True)
    else:
        st.markdown('<h1 class="main-header">⚡ Quick Impact Right Now</h1>', unsafe_allow_html=True)
    
    # Motivational message
    encouragement = get_random_encouragement("progress_encouragement", language)
    st.info("🌟 " + encouragement)
    
    col1, col2 = st.columns(2)
    with col1:
        if language == 'czech':
            time_options = ["5 minut", "15 minut", "30 minut", "1 hodina"]
            st.selectbox("Mám:", time_options, key="time_filter")
        else:
            time_options = ["5 minutes", "15 minutes", "30 minutes", "1 hour"]
            st.selectbox("I have:", time_options, key="time_filter")
    
    with col2:
        if language == 'czech':
            cause_options = ["Jakákoli oblast", "Klima", "Vzdělání", "Komunita", "Zdraví"]
            st.selectbox("Pro:", cause_options, key="cause_filter")
        else:
            cause_options = ["Any cause", "Climate", "Education", "Community", "Health"]
            st.selectbox("For:", cause_options, key="cause_filter")
    
    perfect_text = "### 🎯 Perfektní shody pro tebe:" if language == 'czech' else "### 🎯 Perfect matches for you:"
    st.markdown(perfect_text)
    
    # Load and filter quick actions
    actions_data = load_actions_data(language)
    quick_actions = []
    
    time_filter = st.session_state.get('time_filter', time_options[0])
    time_limits = {
        '5 minut': 5, '15 minut': 15, '30 minut': 30, '1 hodina': 60,
        '5 minutes': 5, '15 minutes': 15, '30 minutes': 30, '1 hour': 60
    }
    time_limit = time_limits.get(time_filter, 30)
    
    for action_id, action in actions_data.items():
        requirements = action.get('requirements', {})
        action_time = requirements.get('time_minutes', 0)
        
        if action_time <= time_limit:
            quick_actions.append(action)
    
    # Show actions
    if quick_actions:
        for action in quick_actions[:3]:  # Show top 3
            with st.container():
                col1, col2, col3 = st.columns([3, 1, 1])
                with col1:
                    st.markdown(f"**{action.get('title', 'Unknown Action')}**")
                    st.markdown(action.get('description', 'No description'))
                    impact_desc = action.get('impact', {}).get('metric_description', 'Positive impact')
                    st.markdown(f"*Dopad: {impact_desc}*")
                with col2:
                    requirements = action.get('requirements', {})
                    st.markdown(f"⏱️ {requirements.get('time_minutes', 0)} min")
                    if language == 'czech':
                        cost_czk = requirements.get('cost_usd', 0) * 25
                        st.markdown(f"💰 {cost_czk} Kč")
                    else:
                        st.markdown(f"💰 ${requirements.get('cost_usd', 0)}")
                with col3:
                    button_text = "Udělej to teď" if language == 'czech' else "Do This Now"
                    if st.button(button_text, key=f"quick_{action.get('id', 'unknown')}"):
                        cause_name = action.get('cause_id', 'helping others').replace('_', ' ').title()
                        celebrate_action_completion(action.get('title', 'this action'), cause_name, language)
                        
                        # Update metrics
                        st.session_state.total_impact['actions'] += 1
                        st.session_state.total_impact['time'] += requirements.get('time_minutes', 0)
                        st.session_state.total_impact['money'] += requirements.get('cost_usd', 0)
    else:
        warning_text = "Pro tvá kritéria jsme nenašli žádné rychlé akce. Zkus upravit filtry!" if language == 'czech' else "No quick actions found for your criteria. Try adjusting your filters!"
        st.warning(warning_text)

def show_impact_page():
    """Enhanced impact tracking with Czech adaptation"""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown('<h1 class="main-header">📊 Tvůj příběh dopadu</h1>', unsafe_allow_html=True)
    else:
        st.markdown('<h1 class="main-header">📊 Your Impact Story</h1>', unsafe_allow_html=True)
    
    # Check for milestones
    total_actions = st.session_state.total_impact['actions']
    if total_actions == 1:
        encouragement_data = load_encouragement_data(language)
        milestone_msg = encouragement_data.get("milestone_messages", {}).get("first_action", "🏆 Great job on your first action!")
        if language == 'czech':
            st.markdown(f'<div class="quiet-celebration">{milestone_msg}</div>', unsafe_allow_html=True)
        else:
            st.markdown(f'<div class="celebration">{milestone_msg}</div>', unsafe_allow_html=True)
            st.balloons()
    
    # Impact metrics
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown('<div class="impact-metric">', unsafe_allow_html=True)
        actions_text = get_text('actions_taken', language)
        st.metric(actions_text, total_actions, f"+{len(st.session_state.actions_completed)} this session")
        st.markdown('</div>', unsafe_allow_html=True)
    
    with col2:
        st.markdown('<div class="impact-metric">', unsafe_allow_html=True)
        time_text = get_text('time_contributed', language)
        total_time = st.session_state.total_impact['time']
        if language == 'czech':
            st.metric(time_text, f"{total_time} min", f"{total_time/60:.1f} hodin")
        else:
            st.metric(time_text, f"{total_time} min", f"{total_time/60:.1f} hours")
        st.markdown('</div>', unsafe_allow_html=True)
    
    with col3:
        st.markdown('<div class="impact-metric">', unsafe_allow_html=True)
        money_text = get_text('money_donated', language)
        total_money = st.session_state.total_impact['money']
        if language == 'czech':
            czk_amount = total_money * 25  # Rough conversion
            st.metric(money_text, f"{czk_amount} Kč", "Vytváří skutečnou změnu")
        else:
            st.metric(money_text, f"${total_money}", "Creating real change")
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Show streak
    if st.session_state.streak_count > 1:
        if language == 'czech':
            st.markdown(f'<div class="streak-indicator">🔥 {st.session_state.streak_count} akcí v řadě!</div>', unsafe_allow_html=True)
        else:
            st.markdown(f'<div class="streak-indicator">🔥 {st.session_state.streak_count} day streak!</div>', unsafe_allow_html=True)
    
    # Action history
    if st.session_state.actions_completed:
        if language == 'czech':
            st.markdown("### 🌟 Tvoje cesta")
        else:
            st.markdown("### 🌟 Your Journey")
        
        for action in reversed(st.session_state.actions_completed[-5:]):  # Show last 5
            timestamp = datetime.fromisoformat(action['timestamp']).strftime("%d.%m. %H:%M")
            st.markdown(f"**{timestamp}** - ✅ {action['title']} (*{action['cause'].replace('_', ' ').title()}*)")

def show_causes_page():
    """Causes exploration with Czech adaptation"""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown('<h1 class="main-header">🌍 Prozkoumat oblasti</h1>', unsafe_allow_html=True)
    else:
        st.markdown('<h1 class="main-header">🌍 Explore Causes</h1>', unsafe_allow_html=True)
    
    causes_data = load_causes_data(language)
    
    if not causes_data:
        error_text = "Nelze načíst data o oblastech." if language == 'czech' else "Unable to load causes data."
        st.error(error_text)
        return
    
    for cause_id, cause_info in causes_data.items():
        with st.expander(f"{cause_info.get('emoji', '🎯')} {cause_info.get('title', 'Unknown Cause')}"):
            st.markdown(cause_info.get('description', 'No description available'))
            
            # Show some stats
            col1, col2 = st.columns(2)
            with col1:
                urgency = cause_info.get('time_sensitivity', 'ongoing')
                if language == 'czech':
                    st.markdown(f"**Naléhavost:** {urgency.title()}")
                    scope = cause_info.get('geographic_scope', 'varies')
                    st.markdown(f"**Geografický rozsah:** {scope.title()}")
                else:
                    st.markdown(f"**Urgency Level:** {urgency.title()}")
                    scope = cause_info.get('geographic_scope', 'varies')
                    st.markdown(f"**Geographic Scope:** {scope.title()}")
            
            with col2:
                # Show learning resources
                resources = cause_info.get('learning_resources', [])
                if resources:
                    learn_text = "**Dozvědět se více:**" if language == 'czech' else "**Learn More:**"
                    st.markdown(learn_text)
                    for resource in resources[:2]:
                        st.markdown(f"• [{resource.get('title', 'Resource')}]({resource.get('url', '#')})")

if __name__ == "__main__":
    main() 