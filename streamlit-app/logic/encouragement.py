"""Encouragement message and emotional support logic"""

import random
import streamlit as st
from datetime import datetime
from data.loaders import load_encouragement_data
from logic.tracking import update_streak

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

def get_emotional_response(emotional_state: str, language='czech') -> str:
    """Get appropriate response for user's emotional state"""
    encouragement_data = load_encouragement_data(language)
    
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
    
    mapped_emotion = emotion_mapping.get(emotional_state, 'uncertain')
    responses = encouragement_data.get("emotional_state_responses", {}).get(mapped_emotion, [])
    
    if responses:
        return random.choice(responses)
    else:
        # Fallback encouraging response
        if language == 'czech':
            return "Rozumíme vašim pocitům. Najdeme společně způsob, jak můžete pomoci."
        else:
            return "We understand how you feel. Let's find a way you can help together."

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