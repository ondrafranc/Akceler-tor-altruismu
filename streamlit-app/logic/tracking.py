"""Impact tracking and streak management"""

import streamlit as st
from datetime import datetime, timedelta

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

def record_action_completion(action_title: str, action_data: dict, language='czech'):
    """Record a completed action and update metrics"""
    
    # Add to completed actions
    action_record = {
        'title': action_title,
        'category': action_data.get('category', 'general'),
        'timestamp': datetime.now().isoformat(),
        'source': action_data.get('source', 'unknown')
    }
    
    if 'actions_completed' not in st.session_state:
        st.session_state.actions_completed = []
    
    st.session_state.actions_completed.append(action_record)
    
    # Update impact metrics
    st.session_state.total_impact['actions'] += 1
    
    # Update time tracking
    time_minutes = action_data.get('time_minutes', 5)
    st.session_state.total_impact['time'] += time_minutes
    
    # Update money tracking for donations
    if 'daruj' in action_title.lower() or 'donate' in action_title.lower():
        st.session_state.total_impact['money'] += action_data.get('cost_estimate', 5)
    
    # Update streak
    update_streak()

def get_milestone_achievements(actions_count: int, time_contributed: int, money_donated: float) -> list:
    """Check for milestone achievements"""
    milestones = []
    
    if actions_count == 1:
        milestones.append("first_action")
    elif actions_count == 5:
        milestones.append("five_actions")
    elif actions_count == 10:
        milestones.append("ten_actions")
    
    if time_contributed >= 600:  # 10 hours
        milestones.append("ten_hours")
    
    if money_donated > 0:
        milestones.append("first_donation")
    
    return milestones

def calculate_estimated_impact(actions_count: int) -> dict:
    """Calculate estimated total impact based on actions"""
    estimated_people_helped = actions_count * 2.5  # Rough estimate
    
    return {
        'people_affected': estimated_people_helped,
        'inspiration_multiplier': actions_count,
        'community_impact_score': min(actions_count * 10, 100)
    }

def get_user_streak():
    """Get current user streak count"""
    return st.session_state.get('streak_count', 0)

def get_recent_actions(days=7):
    """Get actions completed in the last N days"""
    if 'actions_completed' not in st.session_state:
        return []
    
    cutoff_date = datetime.now() - timedelta(days=days)
    recent_actions = []
    
    for action in st.session_state.actions_completed:
        action_date = datetime.fromisoformat(action['timestamp'])
        if action_date >= cutoff_date:
            recent_actions.append(action)
    
    return recent_actions 