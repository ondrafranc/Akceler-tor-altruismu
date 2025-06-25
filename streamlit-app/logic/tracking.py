"""Tracking and analytics with honest, reflection-based approach - no artificial impact claims"""

import streamlit as st
from datetime import datetime, timedelta
import random
from utils.localization import get_text, get_authentic_celebration, get_reflection_questions

def record_action_completion(action_id: str, action_title: str, cause: str = "general"):
    """Record action completion with honest tracking"""
    
    # Initialize tracking if not exists
    if 'actions_completed' not in st.session_state:
        st.session_state.actions_completed = []
    
    if 'total_impact' not in st.session_state:
        st.session_state.total_impact = {
            'actions': 0,
            'time': 0,
            'money': 0,
            'first_action_date': None,
            'reflection_notes': []
        }
    
    # Record the action
    action_record = {
        'id': action_id,
        'title': action_title,
        'cause': cause,
        'timestamp': datetime.now().isoformat(),
        'completed_at': datetime.now(),
        'reflection_added': False
    }
    
    st.session_state.actions_completed.append(action_record)
    st.session_state.total_impact['actions'] += 1
    
    # Set first action date
    if st.session_state.total_impact['first_action_date'] is None:
        st.session_state.total_impact['first_action_date'] = datetime.now().isoformat()
    
    # Update streak
    _update_action_streak()

def track_action_completion(action_id: str, completion_type: str):
    """Track action completion with different types (selected, visited_website, completed)"""
    
    # Initialize tracking if not exists
    if 'action_tracking' not in st.session_state:
        st.session_state.action_tracking = {}
    
    if action_id not in st.session_state.action_tracking:
        st.session_state.action_tracking[action_id] = {
            'selected': 0,
            'visited_website': 0,
            'completed': 0,
            'first_selected': None,
            'last_activity': None
        }
    
    # Update tracking
    st.session_state.action_tracking[action_id][completion_type] += 1
    st.session_state.action_tracking[action_id]['last_activity'] = datetime.now().isoformat()
    
    if st.session_state.action_tracking[action_id]['first_selected'] is None:
        st.session_state.action_tracking[action_id]['first_selected'] = datetime.now().isoformat()

def calculate_honest_impact_reflection(action: dict) -> dict:
    """Calculate honest reflection on action potential - no fake metrics"""
    
    # Get action details for honest reflection
    category = action.get('category', 'general')
    time_minutes = action.get('requirements', {}).get('time_minutes', 5)
    
    # Honest reflection on potential meaning
    reflection = {
        'time_invested': time_minutes,
        'category': category,
        'potential_meaning': _get_honest_potential_meaning(category),
        'reflection_prompts': _get_category_reflection_prompts(category),
        'personal_significance': _get_personal_significance_note(category)
    }
    
    return reflection

def _get_honest_potential_meaning(category: str) -> str:
    """Get honest description of potential meaning - no artificial metrics"""
    
    language = st.session_state.get('language', 'czech')
    
    if language == 'czech':
        meanings = {
            'environment': 'Tato akce může být malým krokem k lepšímu prostředí.',
            'education': 'Možná pomůžete někomu na cestě k poznání.',
            'community': 'Vaše akce může posílit komunitu kolem vás.',
            'health': 'Přispíváte k zdraví a pohodě ostatních.',
            'poverty': 'Pomáháte v boji proti chudobě a nespravedlnosti.',
            'animals': 'Staráte se o ty, kteří nemají vlastní hlas.',
            'general': 'Každá pomoc má svůj smysl a význam.'
        }
    else:
        meanings = {
            'environment': 'This action might be a small step toward a better environment.',
            'education': 'You might help someone on their path to knowledge.',
            'community': 'Your action might strengthen the community around you.',
            'health': 'You contribute to the health and well-being of others.',
            'poverty': 'You help in the fight against poverty and injustice.',
            'animals': 'You care for those who don\'t have their own voice.',
            'general': 'Every help has its meaning and significance.'
        }
    
    return meanings.get(category, meanings['general'])

def _get_category_reflection_prompts(category: str) -> list:
    """Get thoughtful reflection prompts for different categories"""
    
    language = st.session_state.get('language', 'czech')
    
    if language == 'czech':
        prompts = {
            'environment': [
                'Jak se cítíte, když pomáháte přírodě?',
                'Co vás motivuje k ochraně prostředí?',
                'Myslíte si, že malé kroky mají význam?'
            ],
            'education': [
                'Co pro vás znamená vzdělávání?',
                'Vzpomínáte si na někoho, kdo vám pomohl učit se?',
                'Jak se cítíte, když můžete předat znalosti dál?'
            ],
            'community': [
                'Co pro vás znamená komunita?',
                'Kdy jste se naposledy cítili součástí něčeho většího?',
                'Jak se cítíte, když pomáháte sousedům?'
            ],
            'general': [
                'Co vás k této akci vedlo?',
                'Jak se teď cítíte?',
                'Co byste řekli příteli, který váhá pomoci?'
            ]
        }
    else:
        prompts = {
            'environment': [
                'How do you feel when helping nature?',
                'What motivates you to protect the environment?',
                'Do you think small steps matter?'
            ],
            'education': [
                'What does education mean to you?',
                'Do you remember someone who helped you learn?',
                'How do you feel when you can pass knowledge forward?'
            ],
            'community': [
                'What does community mean to you?',
                'When did you last feel part of something bigger?',
                'How do you feel when helping neighbors?'
            ],
            'general': [
                'What led you to this action?',
                'How do you feel now?',
                'What would you tell a friend who hesitates to help?'
            ]
        }
    
    return prompts.get(category, prompts['general'])

def _get_personal_significance_note(category: str) -> str:
    """Get note about personal significance - honest and warm"""
    
    language = st.session_state.get('language', 'czech')
    
    if language == 'czech':
        notes = {
            'environment': 'Každý, kdo se stará o přírodu, přispívá k lepší budoucnosti.',
            'education': 'Vzdělávání je dar, který se násobí, když ho předáváme dál.',
            'community': 'Silné komunity vznikají z malých gest vzájemné pomoci.',
            'health': 'Zdraví je základem všeho - vaše pomoc má hluboký smysl.',
            'poverty': 'Spravedlnost začíná u konkrétních kroků jednotlivců.',
            'animals': 'Soucit se zvířaty ukazuje naši lidskost.',
            'general': 'Vaše rozhodnutí pomoci mluví o vašem charakteru.'
        }
    else:
        notes = {
            'environment': 'Everyone who cares for nature contributes to a better future.',
            'education': 'Education is a gift that multiplies when we pass it forward.',
            'community': 'Strong communities grow from small gestures of mutual help.',
            'health': 'Health is the foundation of everything - your help has deep meaning.',
            'poverty': 'Justice begins with concrete steps by individuals.',
            'animals': 'Compassion for animals shows our humanity.',
            'general': 'Your decision to help speaks about your character.'
        }
    
    return notes.get(category, notes['general'])

def calculate_impact_estimate(action: dict) -> int:
    """Return 0 - we don't do fake impact estimates anymore"""
    # We've moved away from artificial impact estimates
    # Instead, we focus on honest reflection and potential meaning
    return 0

def calculate_total_impact(language='czech') -> dict:
    """Calculate honest user journey metrics - no fake impact claims"""
    
    # Get basic metrics
    actions_count = st.session_state.get('total_impact', {}).get('actions', 0)
    time_contributed = st.session_state.get('total_impact', {}).get('time', 0)
    money_donated = st.session_state.get('total_impact', {}).get('money', 0)
    first_action_date = st.session_state.get('total_impact', {}).get('first_action_date')
    
    # Get recent activity
    recent_actions = get_recent_actions(30)  # Last 30 days
    
    # Calculate streak
    current_streak = get_user_streak()
    
    # Calculate days since first action
    days_since_start = 0
    if first_action_date:
        try:
            first_date = datetime.fromisoformat(first_action_date)
            days_since_start = (datetime.now() - first_date).days
        except:
            days_since_start = 0
    
    # Compile honest impact reflection
    total_impact = {
        'actions_completed': actions_count,
        'time_contributed_minutes': time_contributed,
        'time_contributed_hours': round(time_contributed / 60, 1),
        'money_donated': money_donated,
        'current_streak': current_streak,
        'recent_actions_count': len(recent_actions),
        'days_since_start': days_since_start,
        'recent_actions': recent_actions,
        'journey_stage': _get_journey_stage(actions_count),
        'personal_reflections': st.session_state.get('total_impact', {}).get('reflection_notes', [])
    }
    
    # Add milestone achievements
    milestones = get_milestone_achievements(actions_count, time_contributed, money_donated)
    total_impact['milestones'] = milestones
    
    # Add honest journey description
    total_impact['journey_description'] = _get_honest_journey_description(actions_count, days_since_start, language)
    
    return total_impact

def _get_journey_stage(actions_count: int) -> str:
    """Get honest description of user's journey stage"""
    
    if actions_count == 0:
        return 'beginning'
    elif actions_count < 3:
        return 'first_steps'
    elif actions_count < 10:
        return 'building_momentum'
    elif actions_count < 25:
        return 'experienced_helper'
    else:
        return 'dedicated_helper'

def _get_honest_journey_description(actions_count: int, days_since_start: int, language='czech') -> str:
    """Get honest, warm description of user's journey"""
    
    if language == 'czech':
        if actions_count == 0:
            return "Vaše cesta pomoci teprve začíná. I jen to, že jste tady, má svůj význam."
        elif actions_count == 1:
            return f"Udělali jste svůj první krok! To je vždy nejdůležitější moment na každé cestě."
        elif actions_count < 5:
            return f"S {actions_count} akcemi už vidíme, že to myslíte vážně. Každý krok má svůj smysl."
        elif actions_count < 15:
            return f"Vaších {actions_count} akcí ukazuje, že pomoc se stala součástí vašeho života."
        else:
            return f"S {actions_count} akcemi jste se stali někým, kdo skutečně mění svět k lepšímu."
    else:
        if actions_count == 0:
            return "Your helping journey is just beginning. Even being here has its meaning."
        elif actions_count == 1:
            return f"You took your first step! That's always the most important moment on any journey."
        elif actions_count < 5:
            return f"With {actions_count} actions, we can see you're serious about this. Every step matters."
        elif actions_count < 15:
            return f"Your {actions_count} actions show that helping has become part of your life."
        else:
            return f"With {actions_count} actions, you've become someone who truly changes the world for the better."

def get_milestone_achievements(actions_count: int, time_contributed: int, money_donated: float) -> list:
    """Get milestone achievements with honest celebration"""
    
    milestones = []
    
    # Action milestones
    action_milestones = [1, 3, 5, 10, 20, 50, 100]
    for milestone in action_milestones:
        if actions_count >= milestone:
            milestones.append({
                'type': 'actions',
                'value': milestone,
                'achieved': True,
                'date_achieved': _estimate_milestone_date(milestone, actions_count)
            })
    
    # Time milestones (in hours)
    time_hours = time_contributed / 60
    time_milestones = [1, 5, 10, 25, 50, 100]
    for milestone in time_milestones:
        if time_hours >= milestone:
            milestones.append({
                'type': 'time',
                'value': milestone,
                'achieved': True,
                'date_achieved': _estimate_milestone_date(milestone, time_hours)
            })
    
    # Money milestones
    money_milestones = [10, 50, 100, 250, 500, 1000]
    for milestone in money_milestones:
        if money_donated >= milestone:
            milestones.append({
                'type': 'money',
                'value': milestone,
                'achieved': True,
                'date_achieved': _estimate_milestone_date(milestone, money_donated)
            })
    
    return milestones

def _estimate_milestone_date(milestone_value: int, current_value: float) -> str:
    """Estimate when a milestone was achieved"""
    # Simple estimation - this could be improved with actual tracking
    days_ago = max(1, int((current_value - milestone_value) * 7))  # Rough estimate
    estimated_date = datetime.now() - timedelta(days=days_ago)
    return estimated_date.isoformat()

def get_user_streak() -> int:
    """Calculate current streak of consecutive days with actions"""
    
    recent_actions = get_recent_actions(days=30)
    if not recent_actions:
        return 0
    
    # Group actions by date
    action_dates = set()
    for action in recent_actions:
        completed_at = action.get('completed_at')
        if isinstance(completed_at, str):
            try:
                date = datetime.fromisoformat(completed_at).date()
            except:
                continue
        else:
            date = completed_at.date() if completed_at else None
        
        if date:
            action_dates.add(date)
    
    # Calculate streak from today backwards
    streak = 0
    current_date = datetime.now().date()
    
    while current_date in action_dates:
        streak += 1
        current_date -= timedelta(days=1)
    
    return streak

def get_recent_actions(days: int = 7) -> list:
    """Get actions from recent days"""
    
    if 'actions_completed' not in st.session_state:
        return []
    
    cutoff_date = datetime.now() - timedelta(days=days)
    recent_actions = []
    
    for action in st.session_state.actions_completed:
        completed_at = action.get('completed_at')
        if isinstance(completed_at, str):
            try:
                action_date = datetime.fromisoformat(completed_at)
            except:
                continue
        else:
            action_date = completed_at
        
        if action_date and action_date >= cutoff_date:
            recent_actions.append(action)
    
    return sorted(recent_actions, key=lambda x: x.get('completed_at', datetime.now()), reverse=True)

def add_personal_reflection(action_id: str, reflection_text: str):
    """Add personal reflection to an action"""
    
    if 'total_impact' not in st.session_state:
        st.session_state.total_impact = {'reflection_notes': []}
    
    if 'reflection_notes' not in st.session_state.total_impact:
        st.session_state.total_impact['reflection_notes'] = []
    
    reflection = {
        'action_id': action_id,
        'reflection': reflection_text,
        'date': datetime.now().isoformat(),
        'timestamp': datetime.now()
    }
    
    st.session_state.total_impact['reflection_notes'].append(reflection)
    
    # Mark action as having reflection
    for action in st.session_state.get('actions_completed', []):
        if action.get('id') == action_id:
            action['reflection_added'] = True
            break

def get_personal_reflections() -> list:
    """Get all personal reflections"""
    
    return st.session_state.get('total_impact', {}).get('reflection_notes', [])

def _update_action_streak():
    """Update the action streak"""
    
    if 'streak_count' not in st.session_state:
        st.session_state.streak_count = 0
    
    # Simple streak tracking - could be improved
    st.session_state.streak_count = get_user_streak()

def track_emotional_state(emotion_key: str, context: str = "general"):
    """Track emotional state for understanding user journey"""
    
    if 'emotional_tracking' not in st.session_state:
        st.session_state.emotional_tracking = []
    
    emotional_record = {
        'emotion': emotion_key,
        'context': context,
        'timestamp': datetime.now().isoformat(),
        'date': datetime.now()
    }
    
    st.session_state.emotional_tracking.append(emotional_record)

def get_emotional_journey() -> list:
    """Get user's emotional journey over time"""
    
    return st.session_state.get('emotional_tracking', [])

def show_honest_celebration(action_count: int, language='czech'):
    """Show honest celebration without fake impact claims"""
    
    celebrations = get_authentic_celebration(action_count, language)
    celebration_message = random.choice(celebrations)
    
    st.success(celebration_message)
    
    # Add reflection prompt
    reflection_questions = get_reflection_questions(language)
    reflection_question = random.choice(reflection_questions)
    
    with st.expander("💭 " + ("Chvilka na zamyšlení" if language == 'czech' else "A moment for reflection"), expanded=False):
        st.markdown(f"**{reflection_question}**")
        
        reflection_text = st.text_area(
            "Vaše myšlenky" if language == 'czech' else "Your thoughts",
            placeholder="Napište si, co si myslíte..." if language == 'czech' else "Write what you think...",
            key=f"reflection_{action_count}_{datetime.now().timestamp()}"
        )
        
        if reflection_text and st.button("💾 " + ("Uložit zamyšlení" if language == 'czech' else "Save reflection")):
            add_personal_reflection(f"action_{action_count}", reflection_text)
            st.success("💚 " + ("Děkujeme za sdílení!" if language == 'czech' else "Thank you for sharing!"))

def calculate_estimated_impact(actions_count: int) -> dict:
    """Return empty dict - we don't do fake impact estimates anymore"""
    # We've moved away from artificial impact estimates
    return {
        'people_affected': 0,
        'inspiration_multiplier': 0,
        'community_impact_score': 0
    } 