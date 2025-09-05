"""Data loading functions with enhanced error handling"""

import streamlit as st
import json
import os
from pathlib import Path

@st.cache_data
def load_causes_data(language='czech'):
    """Load causes data based on language"""
    try:
        base = Path(__file__).resolve().parent.parent
        data_dir = base / 'data'
        if language == 'czech':
            with open(data_dir / 'czech' / 'causes_czech.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            with open(data_dir / 'international' / 'causes.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
        return data.get('causes', {})
    except (FileNotFoundError, json.JSONDecodeError, UnicodeDecodeError) as e:
        st.warning(f"Causes data file issue for {language}. Using fallback. Error: {str(e)}")
        return {}

@st.cache_data
def load_actions_data(language='czech'):
    """Load actions data based on language"""
    try:
        base = Path(__file__).resolve().parent.parent
        data_dir = base / 'data'
        if language == 'czech':
            with open(data_dir / 'czech' / 'actions_czech.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            with open(data_dir / 'international' / 'actions.json', 'r', encoding='utf-8') as f:
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
                "Dobře! Tahla akce bude mít dopad způsoby, o kterých možná nikdy nebudeš vědět."
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
        base = Path(__file__).resolve().parent.parent
        data_dir = base / 'data'
        if language == 'czech':
            with open(data_dir / 'czech' / 'encouragement_czech.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Validate that essential keys exist
                if 'welcome_messages' in data and 'emotional_state_responses' in data:
                    return data
                else:
                    # File exists but missing essential data, use fallback
                    return fallback_data['czech']
        else:
            with open(data_dir / 'international' / 'encouragement_messages.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'welcome_messages' in data:
                    return data
                else:
                    return fallback_data['english']
                    
    except (FileNotFoundError, json.JSONDecodeError, UnicodeDecodeError, PermissionError):
        # Silently use fallback data without showing error messages
        return fallback_data.get(language, fallback_data['czech'])

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