"""Enhanced session state management with comprehensive user behavior tracking"""

import streamlit as st
import uuid
from datetime import datetime, timedelta
from config.settings import DEFAULT_LANGUAGE

def initialize_session_state():
    """Initialize all session state variables with comprehensive tracking"""
    
    # User identification and preferences
    if 'user_id' not in st.session_state:
        st.session_state.user_id = f"user_{uuid.uuid4().hex[:8]}"
    
    if 'user_name' not in st.session_state:
        st.session_state.user_name = None
    
    # Language and navigation
    if 'language' not in st.session_state:
        st.session_state.language = DEFAULT_LANGUAGE
    
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'assessment'
    
    # Assessment progress
    if 'assessment_step' not in st.session_state:
        st.session_state.assessment_step = 1
    
    if 'user_profile' not in st.session_state:
        st.session_state.user_profile = {}
    
    # Impact tracking
    if 'actions_completed' not in st.session_state:
        st.session_state.actions_completed = []
    
    if 'total_impact' not in st.session_state:
        st.session_state.total_impact = {'actions': 0, 'time': 0, 'money': 0}
    
    # Streak tracking
    if 'streak_count' not in st.session_state:
        st.session_state.streak_count = 0
    
    if 'last_action_date' not in st.session_state:
        st.session_state.last_action_date = None
    
    # Activity and behavior tracking
    if 'last_activity' not in st.session_state:
        st.session_state.last_activity = datetime.now()
    
    if 'session_start' not in st.session_state:
        st.session_state.session_start = datetime.now()
    
    if 'page_visits' not in st.session_state:
        st.session_state.page_visits = {}
    
    if 'actions_today' not in st.session_state:
        st.session_state.actions_today = 0
    
    if 'daily_action_date' not in st.session_state:
        st.session_state.daily_action_date = None
    
    # User behavior patterns
    if 'causes_explored' not in st.session_state:
        st.session_state.causes_explored = set()
    
    if 'assessment_attempts' not in st.session_state:
        st.session_state.assessment_attempts = 0
    
    if 'quick_action_views' not in st.session_state:
        st.session_state.quick_action_views = 0
    
    if 'form_abandonments' not in st.session_state:
        st.session_state.form_abandonments = 0
    
    # Accessibility preferences
    if 'accessibility_mode' not in st.session_state:
        st.session_state.accessibility_mode = {
            'simple_mode': False,
            'large_text': False,
            'high_contrast': False,
            'screen_reader': False
        }
    
    # Emotional journey tracking
    if 'emotional_states_history' not in st.session_state:
        st.session_state.emotional_states_history = []
    
    if 'mood_check_ins' not in st.session_state:
        st.session_state.mood_check_ins = []
    
    if 'distress_indicators' not in st.session_state:
        st.session_state.distress_indicators = []
    
    # Feature flags and experiments
    if 'feature_flags' not in st.session_state:
        st.session_state.feature_flags = {
            'show_proverbs': True,
            'enhanced_celebrations': True,
            'detailed_tracking': True,
            'social_features': False
        }
    
    # Feedback and suggestions
    if 'user_feedback' not in st.session_state:
        st.session_state.user_feedback = []
    
    if 'action_suggestions' not in st.session_state:
        st.session_state.action_suggestions = []
    
    # Seasonal challenge placeholder (future feature)
    if 'seasonal_challenge' not in st.session_state:
        st.session_state.seasonal_challenge = None
    
    # Flag used to route directly to quick-actions when requested from CTA
    if 'quick_action_requested' not in st.session_state:
        st.session_state.quick_action_requested = False
    
    # Save states for "come back later" functionality
    if 'saved_states' not in st.session_state:
        st.session_state.saved_states = {}

def track_page_visit(page_name):
    """Track page visits for behavior analysis"""
    if page_name not in st.session_state.page_visits:
        st.session_state.page_visits[page_name] = 0
    st.session_state.page_visits[page_name] += 1
    st.session_state.last_activity = datetime.now()

def track_emotional_state(emotion, context="general"):
    """Track emotional states throughout the journey"""
    emotional_entry = {
        'emotion': emotion,
        'context': context,
        'timestamp': datetime.now().isoformat(),
        'page': st.session_state.current_page
    }
    st.session_state.emotional_states_history.append(emotional_entry)
    
    # Check for distress indicators
    distress_emotions = ['zahlcen', 'overwhelmed', 'frustrated', 'frustrován', 'guilty', 'provinile']
    if emotion in distress_emotions:
        st.session_state.distress_indicators.append(emotional_entry)

def check_inactivity():
    """Check if user has been inactive and return appropriate nudge"""
    if not st.session_state.last_activity:
        return None
    
    time_since_activity = datetime.now() - st.session_state.last_activity
    
    if time_since_activity > timedelta(hours=24):
        return 'long_inactive'
    elif time_since_activity > timedelta(hours=2):
        return 'inactive'
    elif time_since_activity > timedelta(minutes=30):
        return 'short_inactive'
    
    return None

def update_daily_actions():
    """Update daily action count"""
    today = datetime.now().date()
    
    if st.session_state.daily_action_date != today:
        st.session_state.actions_today = 0
        st.session_state.daily_action_date = today
    
    st.session_state.actions_today += 1

def is_returning_user():
    """Check if this is a returning user"""
    return (st.session_state.total_impact['actions'] > 0 or 
            len(st.session_state.page_visits) > 3 or
            st.session_state.assessment_attempts > 0)

def get_user_behavior_insights():
    """Get insights about user behavior patterns"""
    insights = {
        'is_explorer': len(st.session_state.causes_explored) > 2,
        'is_action_oriented': st.session_state.quick_action_views > st.session_state.assessment_attempts,
        'needs_guidance': st.session_state.form_abandonments > 1,
        'is_consistent': st.session_state.streak_count > 3,
        'multiple_actions_today': st.session_state.actions_today > 2,
        'shows_distress': len(st.session_state.distress_indicators) > 0
    }
    return insights

def save_current_state(state_name="default"):
    """Save current assessment/form state for later return"""
    current_state = {
        'assessment_step': st.session_state.assessment_step,
        'user_profile': st.session_state.user_profile.copy(),
        'current_page': st.session_state.current_page,
        'timestamp': datetime.now().isoformat()
    }
    st.session_state.saved_states[state_name] = current_state

def restore_saved_state(state_name="default"):
    """Restore a previously saved state"""
    if state_name in st.session_state.saved_states:
        saved_state = st.session_state.saved_states[state_name]
        st.session_state.assessment_step = saved_state['assessment_step']
        st.session_state.user_profile = saved_state['user_profile']
        st.session_state.current_page = saved_state['current_page']
        return True
    return False

def add_user_feedback(feedback_type, content, context=None):
    """Add user feedback or suggestion"""
    feedback_entry = {
        'type': feedback_type,
        'content': content,
        'context': context or st.session_state.current_page,
        'timestamp': datetime.now().isoformat(),
        'user_profile': st.session_state.user_profile.copy()
    }
    st.session_state.user_feedback.append(feedback_entry)

def suggest_user_action(suggestion):
    """Add a user-suggested action"""
    suggestion_entry = {
        'suggestion': suggestion,
        'page': st.session_state.current_page,
        'user_profile': st.session_state.user_profile.copy(),
        'timestamp': datetime.now().isoformat()
    }
    st.session_state.action_suggestions.append(suggestion_entry)

def toggle_accessibility_feature(feature_name):
    """Toggle accessibility features"""
    if feature_name in st.session_state.accessibility_mode:
        st.session_state.accessibility_mode[feature_name] = not st.session_state.accessibility_mode[feature_name]

def get_accessibility_classes():
    """Get CSS classes based on accessibility preferences"""
    classes = []
    if st.session_state.accessibility_mode['simple_mode']:
        classes.append('simple-mode')
    if st.session_state.accessibility_mode['large_text']:
        classes.append('large-text')
    if st.session_state.accessibility_mode['high_contrast']:
        classes.append('high-contrast')
    return ' '.join(classes)

def record_mood_check_in(mood, context="general"):
    """Record a mood check-in"""
    mood_entry = {
        'mood': mood,
        'context': context,
        'timestamp': datetime.now().isoformat(),
        'page': st.session_state.current_page
    }
    st.session_state.mood_check_ins.append(mood_entry)

def get_journey_summary():
    """Get a comprehensive summary of the user's journey"""
    journey = {
        'session_duration': datetime.now() - st.session_state.session_start,
        'pages_visited': st.session_state.page_visits,
        'actions_completed': len(st.session_state.actions_completed),
        'assessment_progress': st.session_state.assessment_step,
        'emotional_journey': st.session_state.emotional_states_history,
        'causes_explored': list(st.session_state.causes_explored),
        'streak_count': st.session_state.streak_count,
        'total_impact': st.session_state.total_impact,
        'behavior_insights': get_user_behavior_insights()
    }
    return journey

# ---------------------------------------------------------------------------
# Convenience helpers for accessing & updating the in-memory "user_profile".
# The definitions below replace earlier duplicates and should be the ONLY
# implementations inside this module. Keep them lean and side-effect free.
# ---------------------------------------------------------------------------

def get_user_profile():
    """Return a dict with information collected about the current visitor."""
    return st.session_state.get('user_profile', {})

def update_user_profile(updates: dict):
    """Persist *updates* into the user profile stored in session state."""
    if 'user_profile' not in st.session_state:
        st.session_state.user_profile = {}
    st.session_state.user_profile.update(updates)
    
    # Track activity
    st.session_state.last_activity = datetime.now()

def track_assessment_progress(step_name, value):
    """Track progress through assessment steps"""
    st.session_state.assessment_attempts += 1
    st.session_state.last_activity = datetime.now()

def save_assessment_state():
    """Save current assessment state"""
    save_current_state("assessment")

def load_assessment_state():
    """Load saved assessment state"""
    return restore_saved_state("assessment")

def detect_assessment_inconsistencies(profile):
    """Detect potential inconsistencies in assessment responses"""
    inconsistencies = []
    
    # Check for time/financial capacity mismatch
    time_commitment = profile.get('time_commitment', 'minimal')
    financial_capacity = profile.get('financial_capacity', 'none')
    
    if time_commitment == 'major' and financial_capacity == 'none':
        inconsistencies.append({
            'message_czech': "Máte hodně času, ale žádné finanční prostředky - to je v pořádku!",
            'message_english': "You have lots of time but no financial resources - that's perfectly fine!"
        })
    
    return inconsistencies

def track_action_pattern(action_id, action_type):
    """Track user action patterns for behavior analysis"""
    if 'action_patterns' not in st.session_state:
        st.session_state.action_patterns = {}
    
    if action_type not in st.session_state.action_patterns:
        st.session_state.action_patterns[action_type] = []
    
    st.session_state.action_patterns[action_type].append({
        'action_id': action_id,
        'timestamp': datetime.now().isoformat()
    })

def check_action_fatigue():
    """Check if user might be experiencing action fatigue"""
    recent_actions = st.session_state.get('actions_completed', [])
    
    if len(recent_actions) < 5:
        return None
    
    # Check if user completed many actions in short time
    recent_timestamps = [datetime.fromisoformat(action['timestamp']) for action in recent_actions[-5:]]
    time_span = max(recent_timestamps) - min(recent_timestamps)
    
    if time_span < timedelta(hours=2):
        return {'level': 'high', 'reason': 'many_actions_short_time'}
    elif time_span < timedelta(hours=6):
        return {'level': 'moderate', 'reason': 'moderate_activity'}
    
    return None

def record_user_feedback(feedback_type, data):
    """Record user feedback or suggestions"""
    if 'user_feedback' not in st.session_state:
        st.session_state.user_feedback = []
    
    feedback_entry = {
        'type': feedback_type,
        'data': data,
        'timestamp': datetime.now().isoformat(),
        'page': st.session_state.current_page
    }
    st.session_state.user_feedback.append(feedback_entry)

def get_accessibility_preferences():
    """Get user accessibility preferences"""
    return st.session_state.get('accessibility_mode', {
        'simple_layout': False,
        'high_contrast': False,
        'large_text': False,
        'screen_reader': False
    }) 