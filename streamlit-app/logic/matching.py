"""Advanced matching algorithms for user-action pairing"""

from typing import Dict, List, Any
from data.loaders import load_actions_data

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

def get_personalized_recommendations(user_profile: Dict, language='czech') -> List[Dict]:
    """Get personalized action recommendations based on user profile"""
    actions_data = load_actions_data(language)
    recommendations = []
    
    for action_id, action in actions_data.items():
        score = calculate_advanced_action_score(user_profile, action)
        
        # Only include actions with a reasonable score
        if score > 20:
            recommendation = {
                'id': action_id,
                'title': action.get('title', 'Unknown Action'),
                'description': action.get('description', 'No description available'),
                'score': score,
                'time_estimate': f"{action.get('requirements', {}).get('time_minutes', 5)} minut" if language == 'czech' else f"{action.get('requirements', {}).get('time_minutes', 5)} minutes",
                'impact_potential': action.get('impact', {}).get('metric_description', 'Pozitivní dopad' if language == 'czech' else 'Positive impact'),
                'organization': action.get('organization', {}).get('name', 'Unknown Organization'),
                'website': action.get('organization', {}).get('website', '#')
            }
            recommendations.append(recommendation)
    
    # Sort by score and return top 6 recommendations
    recommendations.sort(key=lambda x: x['score'], reverse=True)
    return recommendations[:6] 