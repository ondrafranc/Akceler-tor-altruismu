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
    
    /* Enhanced Card System with better alignment */
    .cause-card {
        border: 1px solid #A8D5A8;
        border-radius: 16px;
        padding: 2rem;
        margin: 1.5rem 0;
        background: linear-gradient(135deg, #F8FDF8 0%, #F0F8F0 100%);
        box-shadow: 0 4px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-top: 3px solid transparent;
        height: 100%; /* Equal height cards */
        display: flex;
        flex-direction: column;
        justify-content: space-between;
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
        height: 100%; /* Equal height cards */
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .action-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
        border-color: #9BC89B;
        border-left-color: #7AB87A;
        background: linear-gradient(135deg, #FBFCFB 0%, #F6F8F6 100%);
    }
    
    /* Enhanced Button System with proper alignment */
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
        width: 100% !important; /* Full width for consistent alignment */
        margin: 0.25rem 0 !important;
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
    
    /* Enhanced CTA section with proper spacing */
    .cta-section {
        background: linear-gradient(135deg, #F5F8F5 0%, #EBF2EB 100%);
        border-radius: 16px;
        padding: 2rem;
        margin: 2rem 0;
        text-align: center;
        border: 1px solid #D4E7D4;
        box-shadow: 0 4px 8px rgba(0,0,0,0.06);
    }
    
    /* Action grid with better alignment */
    .action-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
        align-items: stretch; /* Equal height */
    }
    
    /* Quote box positioned correctly */
    .quote-box {
        background: linear-gradient(135deg, #F5F8F5 0%, #EDF2ED 100%);
        border-left: 3px solid #7AB87A;
        padding: 1.5rem;
        margin: 2rem auto;
        font-style: italic;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        max-width: 600px;
        text-align: center;
        font-size: 1.1rem;
        line-height: 1.6;
    }
    
    /* POC disclaimer badge */
    .poc-badge {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(122, 184, 122, 0.9);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        z-index: 1000;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    /* Emergency help widget positioned correctly */
    .emergency-help {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #FF6B6B;
        color: white;
        padding: 1rem;
        border-radius: 12px;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        max-width: 250px;
    }
    
    /* Progress text styling */
    .progress-text {
        font-size: 0.9rem;
        color: #4A5E4A;
        text-align: center;
        font-weight: 500;
        margin: 1rem 0;
    }
    
    /* Celebration messages */
    .celebration {
        background: linear-gradient(45deg, #7AB87A, #9BC89B);
        color: white;
        padding: 1.2rem;
        border-radius: 10px;
        text-align: center;
        font-weight: 600;
        animation: gentleGlow 1.5s ease-in-out;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        margin: 1rem 0;
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
        margin: 1rem 0;
    }
    
    /* Impact metrics with better alignment */
    .impact-metric {
        text-align: center;
        padding: 1.2rem;
        background: linear-gradient(135deg, #F0F8F0 0%, #E8F2E8 100%);
        border-radius: 12px;
        margin: 0.5rem 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        border: 1px solid #D4E7D4;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    
    /* Success story cards */
    .success-story {
        background: linear-gradient(135deg, #F8FBF8 0%, #F0F6F0 100%);
        border-radius: 10px;
        padding: 1.2rem;
        margin: 1rem 0;
        border: 1px solid #E0EBE0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        height: 100%;
    }
    
    /* Streak indicator */
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
    
    /* Enhanced Layout System with better spacing */
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
        align-items: stretch;
    }
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 2rem 0;
        align-items: stretch;
    }
    
    /* Enhanced form styling */
    .stSelectbox > div > div {
        border-radius: 8px !important;
        border: 2px solid #C4E4C4 !important;
        transition: all 0.3s ease !important;
    }
    .stSelectbox > div > div:focus-within {
        border-color: #7AB87A !important;
        box-shadow: 0 0 0 3px rgba(122, 184, 122, 0.1) !important;
    }
    
    /* Enhanced multiselect */
    .stMultiSelect > div > div {
        border-radius: 8px !important;
        border: 2px solid #C4E4C4 !important;
    }
    .stMultiSelect > div > div:focus-within {
        border-color: #7AB87A !important;
        box-shadow: 0 0 0 3px rgba(122, 184, 122, 0.1) !important;
    }
    
    /* Enhanced radio buttons with proper spacing */
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
        margin: 0.25rem 0 !important;
        display: block !important;
    }
    .stRadio > div > label:hover {
        background: #F0F8F0 !important;
        border-color: #9BC89B !important;
    }
    
    /* Progress bars styling */
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
        .card-grid, .action-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
        }
        .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
        }
        .poc-badge {
            bottom: 80px !important;
            left: 10px !important;
            font-size: 0.7rem !important;
        }
        .emergency-help {
            bottom: 10px !important;
            right: 10px !important;
            max-width: 200px !important;
            padding: 0.75rem !important;
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
    
    /* Animation keyframes */
    @keyframes fadeInDown {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
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
    except (FileNotFoundError, json.JSONDecodeError, UnicodeDecodeError) as e:
        st.warning(f"Causes data file issue for {language}. Using fallback. Error: {str(e)}")
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
    except (FileNotFoundError, json.JSONDecodeError, UnicodeDecodeError) as e:
        st.warning(f"Actions data file issue for {language}. Error: {str(e)}")
        return {}

@st.cache_data
def load_encouragement_data(language='czech'):
    """Load encouragement messages with robust error handling"""
    fallback_data = {
        'czech': {
            "welcome_messages": [
                "Najdi praktický způsob, jak pomoct – krok za krokem.",
                "Každý malý krok pomáhá. Začneme tam, kde se cítíš připraven/a.",
                "Není potřeba měnit svět najednou. Stačí začít tam, kde jsi."
            ],
            "emotional_state_responses": {
                "zahlcen": ["Je normální cítit se zahlcen/a. Problémy jsou veliké, ale lidská schopnost pomáhat také."],
                "frustrován": ["Ta frustrace je energie. Ukazuje, že jsi připraven/a na skutečnou změnu."],
                "nadějný": ["Tvoje naděje je nakažlivá a svět ji právě teď potřebuje."],
                "provinile": ["Pocit viny ukazuje, že tvoje hodnoty jsou v pořádku, ale akce je užitečnější než vina."],
                "motivován": ["Ta energie je zlatá! Pojďme se ujistit, že je směřována tam, kde může mít největší dopad."],
                "nejistý": ["Nevědět, kde začít, je nejupřímnější reakce na složité problémy."]
            },
            "action_completion_celebrations": [
                "Výborně! Právě jsi udělal/a něco praktického pro zlepšení světa.",
                "Dobře! Tahle akce bude mít dopad způsoby, o kterých možná nikdy nebudeš vědět."
            ],
            "progress_encouragement": [
                "Každá akce, kterou uděláš, dokazuje, že jednotlivci mohou vytvářet změnu.",
                "Nepomáháš jen ostatním – stáváš se člověkem, kterým chceš být."
            ]
        },
        'english': {
            "welcome_messages": [
                "Find a practical way to help – step by step.",
                "Every small step helps. Let's start where you feel ready.",
                "No need to change the world all at once. Just start where you are."
            ],
            "emotional_state_responses": {
                "overwhelmed": ["It's normal to feel overwhelmed. Problems are big, but so is human capacity to help."],
                "frustrated": ["That frustration is energy. It shows you're ready for real change."],
                "hopeful": ["Your hope is contagious and the world needs it right now."],
                "guilty": ["Guilt shows your values are right, but action is more useful than guilt."],
                "motivated": ["That energy is golden! Let's make sure it's directed where it can have the biggest impact."],
                "uncertain": ["Not knowing where to start is the most honest response to complex problems."]
            },
            "action_completion_celebrations": [
                "Excellent! You just did something practical to improve the world.",
                "Well done! This action will have impact in ways you may never know."
            ],
            "progress_encouragement": [
                "Every action you take proves that individuals can create change.",
                "You're not just helping others – you're becoming who you want to be."
            ]
        }
    }
    
    try:
        if language == 'czech':
            with open('data/czech/encouragement_czech.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Validate that essential keys exist
                if 'welcome_messages' in data and 'emotional_state_responses' in data:
                    return data
                else:
                    # File exists but missing essential data, use fallback
                    return fallback_data['czech']
        else:
            with open('data/international/encouragement_messages.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'welcome_messages' in data:
                    return data
                else:
                    return fallback_data['english']
                    
    except (FileNotFoundError, json.JSONDecodeError, UnicodeDecodeError, PermissionError):
        # Silently use fallback data without showing error messages
        return fallback_data.get(language, fallback_data['czech'])

# Safer function execution wrapper to prevent tokenization issues
def safe_execute_with_fallback(func, *args, **kwargs):
    """Execute function with fallback for tokenization issues"""
    try:
        return func(*args, **kwargs)
    except Exception as e:
        if "TokenError" in str(e) or "unterminated string literal" in str(e):
            st.error(f"🔧 Detected tokenization issue (Python 3.13 compatibility). Please refresh the page. Error: {str(e)[:100]}...")
            return None
        else:
            raise e

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
    """Main application with enhanced UX/UI - simplified and stable"""
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
    
    # Enhanced Sidebar with simplified styling
    with st.sidebar:
        # Simplified title
        st.markdown(f"## {get_text('title', language)}")
        st.markdown(f"*{get_text('subtitle', language)}*")
        
        # Enhanced user stats - simplified
        if st.session_state.total_impact['actions'] > 0:
            st.markdown(f"### 📊 {get_text('my_impact', language)}")
            
            # Progress metrics in a container
            col1, col2 = st.columns(2)
            with col1:
                st.metric(
                    label=get_text('actions_taken', language), 
                    value=st.session_state.total_impact['actions']
                )
            with col2:
                total_time = st.session_state.total_impact['time']
                time_label = "Času věnováno" if language == 'czech' else "Time spent"
                st.metric(
                    label=time_label, 
                    value=f"{total_time} min"
                )
            
            # Enhanced streak display - simplified
            if st.session_state.streak_count > 1:
                streak_text = f"🔥 **{st.session_state.streak_count} akcí v řadě!**" if language == 'czech' else f"🔥 **{st.session_state.streak_count} day streak!**"
                st.success(streak_text)
            
            st.markdown("---")
    
        # Enhanced contextual encouragement - simplified
        if random.random() < 0.4:  # Slightly more frequent encouragement
            if st.session_state.total_impact['actions'] == 0:
                encouragement = get_random_encouragement("welcome_messages", language)
                st.info(f"💚 {encouragement}")
            elif st.session_state.total_impact['actions'] < 3:
                encouragement = get_random_encouragement("progress_encouragement", language)
                st.success(f"🌟 {encouragement}")
            else:
                encouragement = get_random_encouragement("progress_encouragement", language)
                st.success(f"🎉 {encouragement}")
        
        # Enhanced seasonal message - simplified
        seasonal_msg = get_seasonal_message(language)
        if seasonal_msg and random.random() < 0.3:
            st.info(f"🌿 {seasonal_msg}")
        
        st.markdown("---")
        
        # Enhanced Navigation - simplified
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
    """Enhanced welcome page with fixed UX and cultural adaptation"""
    language = st.session_state.language
    
    # POC Disclaimer Badge (non-intrusive)
    st.markdown(f"""
    <div class="poc-badge">
        {'🚧 Proof of Concept' if language == 'english' else '🚧 Proof of Concept'}
    </div>
    """, unsafe_allow_html=True)
    
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
        
        💡 **Jak to funguje:** Projdete si krátké posouzení, které najde akce přesně pro vaše možnosti a hodnoty.
        """
    else:
        intro_text = """
        🌟 **Welcome to a space where empathy transforms into concrete action.**
        
        This tool helps you find meaningful ways to help others – 
        whether you have 5 minutes or a whole day, live in Prague or the countryside.
        
        💡 **How it works:** Take a brief assessment that finds actions perfectly matched to your resources and values.
        """
    st.markdown(intro_text)
    
    # Quote comes AFTER intro, properly positioned
    seasonal_msg = get_seasonal_message(language)
    if seasonal_msg:
        st.markdown(f"""
        <div class="quote-box">
            <span style="font-size: 1.2em;">🌿</span> {seasonal_msg}
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Enhanced emotional assessment section - simplified and responsive
    if language == 'czech':
        st.markdown("### 💭 Jak se právě cítíš?")
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
        st.markdown("### 💭 How are you feeling right now?")
        st.markdown("*This helps us find the right approach for you*")
        emotional_options = [
            "😔 Overwhelmed by all the problems",
            "😤 Frustrated and want to act", 
            "😊 Hopeful and ready to help",
            "😕 Guilty about not doing enough",
            "🔥 Motivated to make a difference",
            "😐 Uncertain where to start"
        ]
    
    # Enhanced emotional state selector - simplified
    emotional_state = st.radio(
        "Vyberte možnost:" if language == 'czech' else "Choose option:",
        emotional_options,
        key="emotional_state",
        label_visibility="collapsed"
    )
    
    # Enhanced contextual response - more robust
    if emotional_state:
        # Extract emotion key more safely and map to English keys used in JSON
        emotion_parts = emotional_state.split()
        if len(emotion_parts) > 1:
            emotion_key = emotion_parts[1].lower().rstrip('/a').rstrip('ý').rstrip('á')
            # Map Czech emotions to English response keys (as used in JSON)
            emotion_mapping = {
                'zahlcen': 'overwhelmed',
                'frustrován': 'frustrated', 
                'nadějný': 'hopeful',
                'provinile': 'guilty',
                'motivován': 'motivated',
                'nejistý': 'uncertain',
                'overwhelmed': 'overwhelmed',
                'frustrated': 'frustrated',
                'hopeful': 'hopeful', 
                'guilty': 'guilty',
                'motivated': 'motivated',
                'uncertain': 'uncertain'
            }
            
            mapped_emotion = emotion_mapping.get(emotion_key, 'uncertain')
            st.session_state.user_profile['emotional_state'] = mapped_emotion
            
            # Get appropriate response
            encouragement_data = load_encouragement_data(language)
            responses = encouragement_data.get("emotional_state_responses", {}).get(mapped_emotion, [])
            
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
    
    # Enhanced CTA section with better visual hierarchy - simplified
    st.markdown(f"""
    <div class="cta-section">
        <h3 style="margin-bottom: 1rem; color: #2E5D31;">
            {'🚀 Jak chcete začít?' if language == 'czech' else '🚀 How would you like to start?'}
        </h3>
        <p style="color: #5A6B5A; margin-bottom: 1.5rem;">
            {'Vyberte si cestu, která vám vyhovuje:' if language == 'czech' else 'Choose the path that suits you:'}
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # Better CTA layout with proper spacing - responsive
    col_a, col_b = st.columns(2)
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
    
    # Enhanced "Where can I help today?" expandable section - improved layout
    with st.expander(
        "🌍 Zobrazit příležitosti v mém okolí" if language == 'czech' else "🌍 Show opportunities near me",
        expanded=False
    ):
        if language == 'czech':
            st.markdown("""
            **🏠 Praha**
            - **Organizace pro zvířata**: [Voříškoviště](https://voriskoviste.cz) - dobrovolnictví s opuštěnými psy
            - **Pomoc bezdomovcům**: [Naděje](https://www.nadeje.cz) - rozdávání jídla, sociální práce
            - **Podpora vzdělání**: [Učíme online](https://www.ucimeonline.cz) - doučování dětí online
            
            **🏢 Brno**
            - **Senioři**: [Život 90](https://zivot90.cz) - návštěvy, doprovázení k lékaři
            - **Ekologie**: [Lipka](https://lipka.cz) - úklidy parků, výsadba rostlin
            - **Děti v nouzi**: [SOS dětské vesničky](https://www.sos-vesničky.cz)
            
            **🌐 Online z domova**
            - **Krizová pomoc**: [Linka důvěry](https://www.ceska-sprava.cz) - školení dobrovolníků
            - **Překládání**: [Translators without Borders](https://translatorswithoutborders.org)
            - **Vzdělání**: [Khan Academy česky](https://cs.khanacademy.org) - tvorba obsahu
            
            *📝 Poznámka: Toto jsou skutečné organizace. Před zapojením si ověřte aktuální možnosti.*
            """)
        else:
            st.markdown("""
            **🏠 Prague**
            - **Animal welfare**: [Voříškoviště](https://voriskoviste.cz) - volunteering with abandoned dogs
            - **Homeless support**: [Naděje](https://www.nadeje.cz) - food distribution, social work
            - **Education support**: [Učíme online](https://www.ucimeonline.cz) - online tutoring for children
            
            **🏢 Brno**
            - **Senior care**: [Život 90](https://zivot90.cz) - visits, medical accompaniment
            - **Environmental**: [Lipka](https://lipka.cz) - park cleanups, tree planting
            - **Children in need**: [SOS Children's Villages](https://www.sos-vesničky.cz)
            
            **🌐 Online from home**
            - **Crisis support**: [Helpline](https://www.ceska-sprava.cz) - volunteer training
            - **Translation**: [Translators without Borders](https://translatorswithoutborders.org)
            - **Education**: [Khan Academy Czech](https://cs.khanacademy.org) - content creation
            
            *📝 Note: These are real organizations. Please verify current opportunities before getting involved.*
            """)
    
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
    """Enhanced quick actions with immediate real-world connections"""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown('<h1 class="main-header">⚡ Rychlé akce</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">Něco smysluplného, co můžete udělat hned teď</p>', unsafe_allow_html=True)
    else:
        st.markdown('<h1 class="main-header">⚡ Quick Actions</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">Something meaningful you can do right now</p>', unsafe_allow_html=True)
    
    # Time-based filter
    col1, col2, col3 = st.columns(3)
    with col1:
        if language == 'czech':
            time_filter = st.selectbox(
                "Kolik času máte?",
                ["5 minut", "15 minut", "30 minut", "1 hodina", "Cokoliv"]
            )
        else:
            time_filter = st.selectbox(
                "How much time do you have?",
                ["5 minutes", "15 minutes", "30 minutes", "1 hour", "Any time"]
            )
    
    with col2:
        if language == 'czech':
            location_filter = st.selectbox(
                "Kde jste?",
                ["Doma", "Venku", "V práci", "Cestou", "Kdekoli"]
            )
        else:
            location_filter = st.selectbox(
                "Where are you?",
                ["At home", "Outside", "At work", "Traveling", "Anywhere"]
            )
    
    with col3:
        if language == 'czech':
            energy_filter = st.selectbox(
                "Úroveň energie",
                ["Vysoká", "Střední", "Nízká", "Jakákoli"]
            )
        else:
            energy_filter = st.selectbox(
                "Energy level",
                ["High", "Medium", "Low", "Any"]
            )
    
    st.markdown("---")
    
    # Enhanced quick actions with real connections
    if language == 'czech':
        quick_actions = [
            {
                "title": "🌱 Daruj na výsadbu stromů",
                "description": "Jednorázový dar na výsadbu stromu v České republice",
                "time": "2 minuty",
                "location": "Online",
                "energy": "Nízká",
                "impact": "1 strom = 22 kg CO2 ročně",
                "action_link": "https://www.sazka.cz/stromy",
                "instructions": "Klikněte na odkaz, vyberte částku a dokončete dar. Dostanete potvrzení o výsadbě.",
                "category": "Příroda"
            },
            {
                "title": "📚 Daruj použité knihy",
                "description": "Najděte nejbližší knihobudku nebo charitu pro dar knih",
                "time": "15 minut",
                "location": "Venku",
                "energy": "Střední",
                "impact": "Pomůže 3-5 dětem k novým knihám",
                "action_link": "https://www.knihobudky.cz/mapa",
                "instructions": "Najděte knihobudku na mapě, zabalte knihy a odneste je. Vyfotit se můžete pro vlastní radost!",
                "category": "Vzdělání"
            },
            {
                "title": "❤️ Napište povzbudivé dopisy seniorům",
                "description": "Online platforma pro posílání dopisů osamělým seniorům",
                "time": "20 minut",
                "location": "Doma",
                "energy": "Střední",
                "impact": "Rozveselí jednoho seniora na týden",
                "action_link": "https://www.dopisy-seniorum.cz",
                "instructions": "Zaregistrujte se, napište osobní dopis (bez osobních údajů) a odešlete systémem.",
                "category": "Komunita"
            },
            {
                "title": "🥘 Objednejte jídlo pro bezdomovce",
                "description": "Zaplatit teplé jídlo pro osobu bez domova přes aplikaci",
                "time": "5 minut",
                "location": "Kdekoli",
                "energy": "Nízká",
                "impact": "Zajistí teplé jídlo na jeden den",
                "action_link": "https://www.nadeje.cz/daruj-jidlo",
                "instructions": "Otevřete aplikaci Naděje, vyberte 'Daruj jídlo' a zaplaťte. Jídlo bude vydáno v nejbližším centru.",
                "category": "Základní potřeby"
            },
            {
                "title": "🎓 Doučujte dítě online",
                "description": "15minutové doučování matematiky nebo češtiny přes video",
                "time": "30 minut",
                "location": "Doma",
                "energy": "Vysoká",
                "impact": "Pomůže jednomu dítěti pochopit látku",
                "action_link": "https://www.ucimeonline.cz/dobrovolnik",
                "instructions": "Zaregistrujte se jako dobrovolník, projděte si rychlý trénink a připojte se k volné hodině.",
                "category": "Vzdělání"
            },
            {
                "title": "🐕 Pomozte útulku na dálku",
                "description": "Darujte granule nebo hračky pro psy online",
                "time": "10 minut",
                "location": "Online",
                "energy": "Nízká",
                "impact": "Pomůže 5-10 psům na týden",
                "action_link": "https://www.utulekpraha.cz/pomoc",
                "instructions": "Vyberte si věci ze seznamu potřeb útulku a objednejte přímo na jejich adresu.",
                "category": "Zvířata"
            }
        ]
    else:
        quick_actions = [
            {
                "title": "🌱 Donate for tree planting",
                "description": "One-time donation for tree planting in Czech Republic",
                "time": "2 minutes",
                "location": "Online",
                "energy": "Low",
                "impact": "1 tree = 22 kg CO2 annually",
                "action_link": "https://www.sazka.cz/stromy",
                "instructions": "Click the link, choose amount and complete donation. You'll get planting confirmation.",
                "category": "Environment"
            },
            {
                "title": "📚 Donate used books",
                "description": "Find nearest book exchange box or charity for book donation",
                "time": "15 minutes",
                "location": "Outside",
                "energy": "Medium",
                "impact": "Helps 3-5 children access new books",
                "action_link": "https://www.knihobudky.cz/mapa",
                "instructions": "Find book box on map, pack books and deliver them. Photo optional for your own joy!",
                "category": "Education"
            },
            {
                "title": "❤️ Write encouraging letters to seniors",
                "description": "Online platform for sending letters to lonely seniors",
                "time": "20 minutes",
                "location": "At home",
                "energy": "Medium",
                "impact": "Brightens one senior's week",
                "action_link": "https://www.dopisy-seniorum.cz",
                "instructions": "Register, write personal letter (no personal data) and send through system.",
                "category": "Community"
            },
            {
                "title": "🥘 Order food for homeless person",
                "description": "Pay for warm meal for homeless person through app",
                "time": "5 minutes",
                "location": "Anywhere",
                "energy": "Low",
                "impact": "Provides warm meal for one day",
                "action_link": "https://www.nadeje.cz/daruj-jidlo",
                "instructions": "Open Naděje app, select 'Donate food' and pay. Food will be distributed at nearest center.",
                "category": "Basic needs"
            },
            {
                "title": "🎓 Tutor child online",
                "description": "15-minute math or language tutoring via video",
                "time": "30 minutes",
                "location": "At home",
                "energy": "High",
                "impact": "Helps one child understand material",
                "action_link": "https://www.ucimeonline.cz/dobrovolnik",
                "instructions": "Register as volunteer, complete quick training and join available session.",
                "category": "Education"
            },
            {
                "title": "🐕 Help animal shelter remotely",
                "description": "Donate food or toys for dogs online",
                "time": "10 minutes",
                "location": "Online",
                "energy": "Low",
                "impact": "Helps 5-10 dogs per week",
                "action_link": "https://www.utulekpraha.cz/pomoc",
                "instructions": "Choose items from shelter's wish list and order directly to their address.",
                "category": "Animals"
            }
        ]
    
    # Filter actions based on user selection
    filtered_actions = quick_actions.copy()
    
    # Apply filters (simplified for demo)
    if time_filter not in ["Cokoliv", "Any time"]:
        # In real implementation, you'd filter based on actual time requirements
        pass
    
    # Display actions in enhanced grid layout
    st.markdown('<div class="action-grid">', unsafe_allow_html=True)
    
    cols = st.columns(2)
    for i, action in enumerate(filtered_actions):
        with cols[i % 2]:
            st.markdown(f"""
            <div class="action-card">
                <h4>{action['title']}</h4>
                <p style="margin: 0.5rem 0;">{action['description']}</p>
                <div style="margin: 1rem 0;">
                    <span style="background: #E8F5E8; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem; margin-right: 0.5rem;">⏱️ {action['time']}</span>
                    <span style="background: #E8F5E8; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem; margin-right: 0.5rem;">📍 {action['location']}</span>
                    <span style="background: #E8F5E8; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">⚡ {action['energy']}</span>
                </div>
                <div style="background: #F0F8F0; padding: 0.75rem; border-radius: 8px; margin: 1rem 0;">
                    <strong>Dopad:</strong> {action['impact']}
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            col_start, col_details = st.columns([1, 1])
            with col_start:
                if st.button(
                    f"Začít nyní" if language == 'czech' else "Start now",
                    key=f"start_{i}",
                    type="primary",
                    use_container_width=True
                ):
                    st.info(f"🔗 Přesměrování na: {action['action_link']}")
                    st.markdown(f"**Instrukce:** {action['instructions']}")
                    
                    # Track completion
                    if 'quick_actions_completed' not in st.session_state:
                        st.session_state.quick_actions_completed = []
                    st.session_state.quick_actions_completed.append(action['title'])
                    
                    # Celebrate action start
                    celebrate_action_completion(action['title'], action['category'], language)
            
            with col_details:
                if st.button(
                    f"Podrobnosti" if language == 'czech' else "Details",
                    key=f"details_{i}",
                    use_container_width=True
                ):
                    with st.expander(f"Detaily akce: {action['title']}", expanded=True):
                        st.markdown(f"""
                        **Kategorie:** {action['category']}
                        
                        **Instrukce:**
                        {action['instructions']}
                        
                        **Odkaz:** [{action['action_link']}]({action['action_link']})
                        
                        **Proč to má smysl:**
                        Tato akce je navržena tak, aby byla rychlá, ale smysluplná. Každá podobná akce přispívá k větší pozitivní změně.
                        """)
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Emergency help widget
    st.markdown(f"""
    <div class="emergency-help">
        <strong>{'Potřebujete okamžitou pomoc?' if language == 'czech' else 'Need immediate help?'}</strong><br>
        📞 {'Linka bezpečí: 116 111' if language == 'czech' else 'Safety line: 116 111'}<br>
        🆘 {'Krizová intervence: 284 016 666' if language == 'czech' else 'Crisis intervention: 284 016 666'}
    </div>
    """, unsafe_allow_html=True)
    
    # Add summary of completed quick actions
    if hasattr(st.session_state, 'quick_actions_completed') and st.session_state.quick_actions_completed:
        st.markdown("---")
        st.markdown("### 🎉 Dokončené rychlé akce" if language == 'czech' else "### 🎉 Completed Quick Actions")
        for action in st.session_state.quick_actions_completed:
            st.success(f"✅ {action}")
    
    # CTA for full assessment
    st.markdown("---")
    st.markdown(f"""
    <div class="cta-section">
        <h3>{'💡 Chcete personalizovaná doporučení?' if language == 'czech' else '💡 Want personalized recommendations?'}</h3>
        <p>{'Projděte si naše posouzení pro akce přesně na míru vašim hodnotám a možnostem.' if language == 'czech' else 'Take our assessment for actions perfectly matched to your values and resources.'}</p>
    </div>
    """, unsafe_allow_html=True)
    
    if st.button(
        f"🧭 Projít personalizované posouzení" if language == 'czech' else "🧭 Take personalized assessment",
        type="primary",
        use_container_width=True
    ):
        st.session_state.assessment_step = 1
        st.rerun()

def show_impact_page():
    """Enhanced impact tracking with visualizations and motivation"""
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
    
    # Milestone detection and celebration
    milestones_achieved = []
    if actions_count == 1:
        milestones_achieved.append("first_action")
    elif actions_count == 5:
        milestones_achieved.append("five_actions")
    
    if time_contributed >= 600:  # 10 hours
        milestones_achieved.append("ten_hours")
    
    if money_donated > 0:
        milestones_achieved.append("first_donation")
    
    # Show milestone celebrations
    for milestone in milestones_achieved:
        encouragement_data = load_encouragement_data(language)
        milestone_msg = encouragement_data.get("milestone_messages", {}).get(milestone, "")
        if milestone_msg:
            st.balloons()
            st.success(f"🎉 **Milestone dosažen!** {milestone_msg}")
    
    # Enhanced impact visualization
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown(f"""
        <div class="impact-metric">
            <h2 style="color: #7AB87A; margin: 0;">{actions_count}</h2>
            <p style="margin: 0.5rem 0 0 0; font-weight: 600;">
                {'Dokončených akcí' if language == 'czech' else 'Actions Completed'}
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        hours = time_contributed / 60
        st.markdown(f"""
        <div class="impact-metric">
            <h2 style="color: #7AB87A; margin: 0;">{hours:.1f}h</h2>
            <p style="margin: 0.5rem 0 0 0; font-weight: 600;">
                {'Času věnováno' if language == 'czech' else 'Time Contributed'}
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        if language == 'czech':
            money_czk = money_donated * 25  # Rough USD to CZK conversion
            st.markdown(f"""
            <div class="impact-metric">
                <h2 style="color: #7AB87A; margin: 0;">{money_czk:.0f} Kč</h2>
                <p style="margin: 0.5rem 0 0 0; font-weight: 600;">Darováno</p>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
            <div class="impact-metric">
                <h2 style="color: #7AB87A; margin: 0;">${money_donated:.0f}</h2>
                <p style="margin: 0.5rem 0 0 0; font-weight: 600;">Donated</p>
            </div>
            """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Progress towards next milestones
    if language == 'czech':
        st.markdown("### 🎯 Další milníky")
    else:
        st.markdown("### 🎯 Next Milestones")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Actions milestone
        if actions_count < 5:
            progress = actions_count / 5
            remaining = 5 - actions_count
            st.markdown(f"**{'První 5 akcí' if language == 'czech' else 'First 5 Actions'}**")
            st.progress(progress)
            st.markdown(f"{'Zbývá' if language == 'czech' else 'Remaining'}: {remaining}")
        elif actions_count < 10:
            progress = actions_count / 10
            remaining = 10 - actions_count
            st.markdown(f"**{'První 10 akcí' if language == 'czech' else 'First 10 Actions'}**")
            st.progress(progress)
            st.markdown(f"{'Zbývá' if language == 'czech' else 'Remaining'}: {remaining}")
        else:
            st.success(f"✅ {'10+ akcí dokončeno!' if language == 'czech' else '10+ actions completed!'}")
    
    with col2:
        # Time milestone
        if time_contributed < 600:  # Less than 10 hours
            progress = time_contributed / 600
            remaining_hours = (600 - time_contributed) / 60
            st.markdown(f"**{'10 hodin pomoci' if language == 'czech' else '10 Hours of Help'}**")
            st.progress(progress)
            st.markdown(f"{'Zbývá' if language == 'czech' else 'Remaining'}: {remaining_hours:.1f}h")
        else:
            st.success(f"✅ {'10+ hodin dokončeno!' if language == 'czech' else '10+ hours completed!'}")
    
    st.markdown("---")
    
    # Completed actions history
    if st.session_state.actions_completed:
        if language == 'czech':
            st.markdown("### 📜 Historie vašich akcí")
        else:
            st.markdown("### 📜 Your Action History")
        
        for i, action in enumerate(reversed(st.session_state.actions_completed[-10:])):  # Show last 10
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #F8FBF8 0%, #F0F6F0 100%);
                border-left: 4px solid #7AB87A;
                padding: 1rem;
                margin: 0.5rem 0;
                border-radius: 6px;
            ">
                <strong>#{len(st.session_state.actions_completed) - i}</strong> {action}
            </div>
            """, unsafe_allow_html=True)
    else:
        if language == 'czech':
            st.info("🌱 Vaše první akce bude zde! Začněte na stránce rychlých akcí.")
        else:
            st.info("🌱 Your first action will appear here! Start on the quick actions page.")
    
    st.markdown("---")
    
    # Personal impact visualization
    if actions_count > 0:
        if language == 'czech':
            st.markdown("### 🌍 Váš dopad v číslech")
            st.markdown("""
            **Co jste už dokázali:**
            - 🌱 Pomohli jste zlepšit život dalších lidí nebo komunit
            - ⏰ Investovali jste svůj čas do smysluplných aktivit  
            - 💚 Přispěli jste k pozitivním změnám ve společnosti
            - 🌟 Stali jste se příkladem pro ostatní
            """)
            
            # Estimated impact
            if actions_count >= 3:
                estimated_people_helped = actions_count * 2.5  # Rough estimate
                st.markdown(f"""
                **Odhadovaný celkový dopad:**
                - 👥 Pravděpodobně jste pozitivně ovlivnili {estimated_people_helped:.0f} lidí
                - 🌊 Váš příklad mohl inspirovat další {actions_count} lidí k akci
                - 🔄 Vytvořili jste pozitivní spirálu změn ve svém okolí
                """)
        else:
            st.markdown("### 🌍 Your Impact in Numbers")
            st.markdown("""
            **What you've already accomplished:**
            - 🌱 You've helped improve the lives of other people or communities
            - ⏰ You've invested your time in meaningful activities
            - 💚 You've contributed to positive changes in society
            - 🌟 You've become an example for others
            """)
            
            # Estimated impact
            if actions_count >= 3:
                estimated_people_helped = actions_count * 2.5  # Rough estimate
                st.markdown(f"""
                **Estimated Total Impact:**
                - 👥 You've likely positively affected {estimated_people_helped:.0f} people
                - 🌊 Your example may have inspired {actions_count} others to take action
                - 🔄 You've created a positive spiral of change in your community
                """)
    
    # Success stories for inspiration
    if actions_count >= 2:
        st.markdown("---")
        if language == 'czech':
            st.markdown("### 🌟 Inspirace od ostatních")
        else:
            st.markdown("### 🌟 Inspiration from Others")
        
        encouragement_data = load_encouragement_data(language)
        success_stories = encouragement_data.get("success_stories", [])
        
        if success_stories:
            story = random.choice(success_stories)
            st.markdown(f"""
            <div class="success-story">
                <h4>🎯 {story.get('name', 'Anonymní')}</h4>
                <p><strong>Příběh:</strong> {story.get('story', '')}</p>
                <p><strong>Dopad:</strong> {story.get('impact', '')}</p>
                <p><strong>Časový rámec:</strong> {story.get('timeframe', '')}</p>
            </div>
            """, unsafe_allow_html=True)
    
    # Motivational CTA
    st.markdown("---")
    st.markdown(f"""
    <div class="cta-section">
        <h3>{'🚀 Připraveni na další akci?' if language == 'czech' else '🚀 Ready for your next action?'}</h3>
        <p>{'Momentum je klíčový. Každá další akce je snazší než ta předchozí!' if language == 'czech' else 'Momentum is key. Each action gets easier than the last!'}</p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        if st.button(
            f"⚡ {'Rychlé akce' if language == 'czech' else 'Quick Actions'}",
            type="primary",
            use_container_width=True
        ):
            st.session_state.quick_action_requested = True
            st.rerun()
    
    with col2:
        if st.button(
            f"🧭 {'Najít nové příležitosti' if language == 'czech' else 'Find New Opportunities'}",
            use_container_width=True
        ):
            st.session_state.assessment_step = 1
            st.rerun()
    
    # Reflection prompt
    if actions_count >= 1:
        st.markdown("---")
        encouragement_data = load_encouragement_data(language)
        reflection_prompts = encouragement_data.get("reflection_prompts", [])
        
        if reflection_prompts:
            prompt = random.choice(reflection_prompts)
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #F5F8F5 0%, #EDF2ED 100%);
                border: 1px solid #D4E7D4;
                border-radius: 12px;
                padding: 1.5rem;
                margin: 1rem 0;
                text-align: center;
            ">
                <h4 style="color: #2E5D31;">💭 {'Chvilka na zamyšlení' if language == 'czech' else 'Moment for Reflection'}</h4>
                <p style="font-style: italic; font-size: 1.1rem;">{prompt}</p>
            </div>
            """, unsafe_allow_html=True)

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