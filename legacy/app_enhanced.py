"""
Altruism Accelerator - Enhanced MVP Implementation
A tool to help empathetic people transform overwhelm into meaningful action.
Enhanced with real data integration and "wow moments"
"""

import streamlit as st
import json
import os
import random
from datetime import datetime
import uuid
from typing import Dict, List, Any

# Configure page
st.set_page_config(
    page_title="Altruism Accelerator - Enhanced",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Enhanced CSS for beautiful, warm styling with mobile responsiveness
st.markdown("""
<style>
    .main-header {
        font-size: clamp(1.8rem, 5vw, 2.5rem);
        color: #2E8B57;
        text-align: center;
        margin-bottom: 1rem;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        animation: fadeInDown 0.8s ease-out;
    }
    .sub-header {
        font-size: clamp(1rem, 3vw, 1.2rem);
        color: #708090;
        text-align: center;
        margin-bottom: 2rem;
        font-style: italic;
        animation: fadeIn 1s ease-out 0.3s both;
    }
    .cause-card {
        border: 2px solid #90EE90;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
        background: linear-gradient(135deg, #F0FFF0 0%, #E6F3E6 100%);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        cursor: pointer;
    }
    .cause-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        border-color: #32CD32;
    }
    .action-card {
        border: 1px solid #B0E0E6;
        border-radius: 10px;
        padding: 1rem;
        margin: 0.5rem 0;
        background-color: #F8FFFF;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    .action-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        border-color: #87CEEB;
    }
    .action-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transition: left 0.5s;
    }
    .action-card:hover::before {
        left: 100%;
    }
    .progress-text {
        font-size: 0.9rem;
        color: #556B2F;
        text-align: center;
        animation: fadeIn 0.5s ease-in;
    }
    .celebration {
        background: linear-gradient(45deg, #FFD700, #FFA500, #FF6347, #FFD700);
        background-size: 400% 400%;
        color: white;
        padding: 1.5rem;
        border-radius: 15px;
        text-align: center;
        font-weight: bold;
        animation: rainbowGlow 2s ease-in-out infinite, bounceIn 0.8s;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }
    @keyframes rainbowGlow {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
    }
    @keyframes bounceIn {
        0%, 20%, 40%, 60%, 80% { transform: translateY(0); }
        10% { transform: translateY(-10px); }
        30% { transform: translateY(-5px); }
        50% { transform: translateY(-3px); }
        70% { transform: translateY(-2px); }
    }
    @keyframes fadeInDown {
        from { opacity: 0; transform: translateY(-30px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .quote-box {
        background: linear-gradient(135deg, #F5F5DC 0%, #E6E6DA 100%);
        border-left: 4px solid #32CD32;
        padding: 1rem;
        margin: 1rem 0;
        font-style: italic;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: transform 0.2s ease;
    }
    .quote-box:hover {
        transform: scale(1.02);
    }
    .impact-metric {
        text-align: center;
        padding: 1.5rem;
        background: linear-gradient(135deg, #E8F5E8 0%, #D4F4D4 100%);
        border-radius: 15px;
        margin: 0.5rem 0;
        box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        border: 1px solid #C0E6C0;
    }
    .impact-metric:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.15);
    }
    .success-story {
        background: linear-gradient(135deg, #FFF8DC 0%, #F5F5DC 100%);
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1rem 0;
        border: 1px solid #DDD;
        box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        transition: transform 0.2s ease;
    }
    .success-story:hover {
        transform: scale(1.02);
        box-shadow: 0 5px 12px rgba(0,0,0,0.15);
    }
    
    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .cause-card, .action-card, .impact-metric {
            padding: 1rem;
            margin: 0.5rem 0;
        }
        .celebration {
            padding: 1rem;
            font-size: 0.9rem;
        }
    }
    
    /* Button enhancements */
    .stButton > button {
        transition: all 0.3s ease !important;
        border-radius: 8px !important;
    }
    .stButton > button:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
    }
    
    /* Progress bar styling */
    .stProgress > div > div {
        background: linear-gradient(90deg, #32CD32, #90EE90) !important;
        border-radius: 10px !important;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'user_id' not in st.session_state:
    st.session_state.user_id = f"user_{uuid.uuid4().hex[:8]}"
if 'assessment_step' not in st.session_state:
    st.session_state.assessment_step = 0
if 'user_profile' not in st.session_state:
    st.session_state.user_profile = {}
if 'actions_completed' not in st.session_state:
    st.session_state.actions_completed = []
if 'total_impact' not in st.session_state:
    st.session_state.total_impact = {'actions': 0, 'time': 0, 'money': 0}

# Enhanced data loading functions
@st.cache_data
def load_causes_data():
    """Load causes data from JSON file"""
    try:
        with open('data/causes/causes.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('causes', {})
    except FileNotFoundError:
        st.warning("Causes data file not found. Using fallback data.")
        return {}

@st.cache_data
def load_actions_data():
    """Load actions data from JSON file"""
    try:
        with open('data/causes/actions.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('actions', {})
    except FileNotFoundError:
        st.warning("Actions data file not found.")
        return {}

@st.cache_data
def load_encouragement_data():
    """Load encouragement messages from JSON file"""
    try:
        with open('data/content/encouragement_messages.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"welcome_messages": ["Welcome to Altruism Accelerator!"]}

def get_random_encouragement(category="welcome_messages"):
    """Get a random encouraging message"""
    encouragement_data = load_encouragement_data()
    messages = encouragement_data.get(category, ["You're making a difference!"])
    return random.choice(messages)

def get_emotional_response(emotion):
    """Get contextual response based on emotional state"""
    encouragement_data = load_encouragement_data()
    responses = encouragement_data.get("emotional_state_responses", {}).get(emotion.lower(), [])
    if responses:
        return random.choice(responses)
    return "Your feelings are valid. Let's find a way to help that works for you."

def calculate_cause_match(user_values: List[str], cause_values: List[str]) -> float:
    """Calculate how well a cause matches user values"""
    if not user_values or not cause_values:
        return 0.3  # Default low match
    
    # Convert user values to match cause value format
    user_vals_normalized = []
    for val in user_values:
        if "environment" in val.lower():
            user_vals_normalized.append("environment")
        elif "education" in val.lower():
            user_vals_normalized.append("education")
        elif "justice" in val.lower() or "equality" in val.lower():
            user_vals_normalized.append("justice")
        elif "suffering" in val.lower():
            user_vals_normalized.append("reducing_suffering")
        elif "community" in val.lower():
            user_vals_normalized.append("community")
        elif "opportunities" in val.lower() or "economic" in val.lower():
            user_vals_normalized.append("opportunities")
        elif "health" in val.lower():
            user_vals_normalized.append("health")
    
    overlap = len(set(user_vals_normalized) & set(cause_values))
    return min(overlap / len(user_vals_normalized), 1.0) if user_vals_normalized else 0.3

def get_matching_actions(cause_id: str, user_profile: Dict) -> List[Dict]:
    """Get actions that match user profile from the cause"""
    actions_data = load_actions_data()
    matching_actions = []
    
    for action_id, action in actions_data.items():
        if action.get('cause_id') == cause_id:
            # Check if action fits user constraints
            time_available = user_profile.get('time_available', '30_minutes_or_less')
            financial_capacity = user_profile.get('financial_capacity', '0')
            
            # Parse time constraints
            if 'minutes_or_less' in time_available:
                max_time = 30
            elif '1-2_hours' in time_available:
                max_time = 120
            elif '3-5_hours' in time_available:
                max_time = 300
            else:
                max_time = 600
            
            # Parse financial constraints
            if financial_capacity == '0':
                max_cost = 0
            elif '5-25' in financial_capacity:
                max_cost = 25
            elif '25-100' in financial_capacity:
                max_cost = 100
            else:
                max_cost = 1000
            
            # Check if action fits constraints
            action_time = action.get('requirements', {}).get('time_minutes', 0)
            action_cost = action.get('requirements', {}).get('cost_usd', 0)
            
            if action_time <= max_time and action_cost <= max_cost:
                matching_actions.append(action)
    
    return matching_actions

def celebrate_action_completion(action_title: str, cause_type: str = ""):
    """Enhanced celebration for completed action with personalized messages"""
    encouragement_data = load_encouragement_data()
    celebrations = encouragement_data.get("action_completion_celebrations", [])
    
    # Get a personalized celebration message
    if celebrations:
        base_message = random.choice(celebrations)
        # Customize message with action title
        message = base_message.replace("{action}", action_title).replace("{cause}", cause_type)
    else:
        message = f"🎉 Amazing work completing '{action_title}'!"
    
    st.markdown(f'<div class="celebration">{message}</div>', unsafe_allow_html=True)
    st.balloons()
    
    # Add extra encouragement for milestones
    total_actions = st.session_state.total_impact['actions'] + 1
    if total_actions in [1, 5, 10, 25]:
        milestone_messages = encouragement_data.get("milestone_messages", {})
        if total_actions == 1:
            milestone_msg = milestone_messages.get("first_action", "🏆 You've taken your first step!")
        elif total_actions == 5:
            milestone_msg = milestone_messages.get("five_actions", "🌟 Five actions! You're building momentum!")
        elif total_actions == 10:
            milestone_msg = milestone_messages.get("ten_actions", "🚀 Ten actions! You're becoming a change-maker!")
        else:
            milestone_msg = "🎊 You're on fire! 25 actions and counting!"
        
        st.success(milestone_msg)

def show_random_quote():
    """Display an inspirational quote"""
    encouragement_data = load_encouragement_data()
    quotes = encouragement_data.get("inspirational_quotes", [])
    if quotes:
        quote = random.choice(quotes)
        st.markdown(f'<div class="quote-box">"{quote}"</div>', unsafe_allow_html=True)

def show_success_story():
    """Display a success story"""
    encouragement_data = load_encouragement_data()
    stories = encouragement_data.get("success_stories", [])
    if stories:
        story = random.choice(stories)
        st.markdown(f"""
        <div class="success-story">
            <h4>🌟 Success Story: {story['name']}</h4>
            <p><strong>{story['story']}</strong></p>
            <p><em>Impact: {story['impact']} (in {story['timeframe']})</em></p>
        </div>
        """, unsafe_allow_html=True)

def main():
    # Sidebar with enhanced navigation
    st.sidebar.markdown("# 🌱 Altruism Accelerator Enhanced")
    st.sidebar.markdown("*Transform overwhelm into meaningful action*")
    
    # Show user stats in sidebar if available
    if st.session_state.total_impact['actions'] > 0:
        st.sidebar.markdown("### Your Impact")
        st.sidebar.metric("Actions", st.session_state.total_impact['actions'])
    
    # Contextual encouragement in sidebar
    if random.random() < 0.4:  # 40% chance to show encouragement
        if st.session_state.total_impact['actions'] == 0:
            encouragement = get_random_encouragement("welcome_messages")
        elif st.session_state.total_impact['actions'] < 3:
            encouragement = get_random_encouragement("progress_encouragement")
        else:
            encouragement = get_random_encouragement("community_impact_messages")
        st.sidebar.info(f"💚 {encouragement}")
    
    # Show inspiring quote occasionally
    if random.random() < 0.2:  # 20% chance
        quote = get_random_encouragement("inspirational_quotes")
        st.sidebar.markdown(f'<div style="font-style: italic; padding: 10px; background-color: #f0fff0; border-radius: 5px; border-left: 3px solid #32CD32; margin: 10px 0;"><small>"{quote}"</small></div>', unsafe_allow_html=True)
    
    pages = {
        "🏠 Welcome": show_welcome_page,
        "🧭 Find Your Path": show_assessment_page,
        "⚡ Quick Actions": show_quick_actions_page,
        "📊 My Impact": show_impact_page,
        "🌍 Explore Causes": show_causes_page
    }
    
    selected_page = st.sidebar.radio("Navigate to:", list(pages.keys()))
    
    # Show selected page
    pages[selected_page]()

def show_welcome_page():
    """Enhanced welcome page with dynamic content"""
    st.markdown('<h1 class="main-header">🌱 Enhanced Altruism Accelerator</h1>', unsafe_allow_html=True)
    
    # Random welcome message
    welcome_msg = get_random_encouragement("welcome_messages")
    st.markdown(f'<p class="sub-header">{welcome_msg}</p>', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        # Show random quote
        show_random_quote()
        
        st.markdown("### Ready to make an impact?")
        
        emotional_state = st.radio(
            "Select the emotion that resonates most:",
            ["😔 Overwhelmed by all the problems",
             "😤 Frustrated and want to act", 
             "😊 Hopeful and ready to help",
             "😕 Guilty about not doing enough",
             "🔥 Motivated to make a difference",
             "😐 Uncertain where to start"],
            key="emotional_state"
        )
        
        if emotional_state:
            emotion_key = emotional_state.split()[1].lower()
            st.session_state.user_profile['emotional_state'] = emotion_key
            
            # Get contextual emotional response
            response = get_emotional_response(emotion_key)
            st.success(response)
        
        st.markdown("---")
        
        # Show success story occasionally to inspire action
        if random.random() < 0.5:  # 50% chance for inspiration
            st.markdown("### 💫 Real Impact Stories")
            show_success_story()
        
        col_a, col_b = st.columns(2)
        with col_a:
            if st.button("🧭 Take Full Assessment", type="primary", use_container_width=True):
                st.session_state.assessment_step = 1
                st.rerun()
        
        with col_b:
            if st.button("⚡ Get Quick Help Now", use_container_width=True):
                st.rerun()

def show_assessment_page():
    """Enhanced assessment with better UX"""
    st.markdown('<h1 class="main-header">🧭 Find Your Path to Impact</h1>', unsafe_allow_html=True)
    
    # Progress indicator
    steps = ["Values", "Resources", "Recommendations"]
    current_step = st.session_state.get('assessment_step', 0)
    
    if current_step > 0:
        progress = (current_step - 1) / (len(steps) - 1) if len(steps) > 1 else 1.0
        st.progress(progress)
        
        # Encouraging message for current step
        encouragement = get_random_encouragement("assessment_encouragement")
        st.info(encouragement)
        
        st.markdown(f'<p class="progress-text">Step {current_step} of {len(steps)}: {steps[current_step-1]}</p>', unsafe_allow_html=True)
    
    if current_step == 0:
        st.info("👈 Start your assessment from the Welcome page!")
        return
    elif current_step == 1:
        show_values_step()
    elif current_step == 2:
        show_resources_step()
    elif current_step == 3:
        show_recommendations_step()

def show_values_step():
    """Enhanced values assessment"""
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
    
    selected_values = st.multiselect(
        "Choose up to 3 values:",
        values_options,
        key="user_values",
        max_selections=3,
        help="Your values help us find causes that will feel meaningful to you."
    )
    
    if len(selected_values) > 0:
        st.success(f"✨ You selected: {', '.join([v.split(' ', 1)[1] for v in selected_values])}")
        st.session_state.user_profile['values'] = selected_values
        
        if st.button("Next: Resources", type="primary"):
            st.session_state.assessment_step = 2
            st.rerun()
    else:
        st.info("💭 Please select at least one value to continue.")

def show_resources_step():
    """Enhanced resources assessment"""
    st.markdown("### What can you contribute?")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**⏰ Time Available per Week:**")
        time_available = st.radio(
            "How much time can you typically contribute?",
            ["30 minutes or less", "1-2 hours", "3-5 hours", "10+ hours"],
            key="time_available",
            help="Be honest about what's sustainable for you"
        )
        
        st.markdown("**🎯 Skills & Interests:**")
        skills = st.multiselect(
            "What are you good at or interested in?",
            ["Writing/Communication", "Technology/Programming", "Teaching/Mentoring", 
             "Event Planning", "Research/Analysis", "Creative Arts", "Physical Labor"],
            key="user_skills"
        )
    
    with col2:
        st.markdown("**💰 Financial Capacity:**")
        financial_capacity = st.radio(
            "How much can you donate monthly?",
            ["$0", "$5-25", "$25-100", "$100+"],
            key="financial_capacity",
            help="Every amount makes a difference"
        )
        
        st.markdown("**🌍 Impact Preference:**")
        location_pref = st.selectbox(
            "Do you prefer local or global impact?",
            ["No preference", "Local community", "National issues", "Global causes"],
            key="location_pref"
        )
    
    if time_available and financial_capacity:
        st.session_state.user_profile.update({
            'time_available': time_available.replace(" ", "_").lower(),
            'financial_capacity': financial_capacity.replace("$", "").replace("+", "").lower(),
            'skills': skills,
            'location_preference': location_pref.lower().replace(" ", "_")
        })
        
        col_back, col_next = st.columns(2)
        with col_back:
            if st.button("← Back"):
                st.session_state.assessment_step = 1
                st.rerun()
        with col_next:
            if st.button("Get My Recommendations! 🎯", type="primary"):
                st.session_state.assessment_step = 3
                st.rerun()

def show_recommendations_step():
    """Enhanced recommendations with real data"""
    st.markdown('<h1 class="main-header">🎯 Your Personalized Path to Impact</h1>', unsafe_allow_html=True)
    
    causes_data = load_causes_data()
    user_profile = st.session_state.user_profile
    
    if not causes_data:
        st.error("Unable to load causes data. Please check your data files.")
        return
    
    # Calculate cause matches
    cause_matches = []
    for cause_id, cause_info in causes_data.items():
        match_score = calculate_cause_match(
            user_profile.get('values', []), 
            cause_info.get('values_alignment', [])
        )
        cause_matches.append((cause_id, cause_info, match_score))
    
    # Sort by match score
    cause_matches.sort(key=lambda x: x[2], reverse=True)
    
    st.markdown("### 🌟 Based on your values and resources:")
    
    # Show top 3 matches
    for i, (cause_id, cause_info, match_score) in enumerate(cause_matches[:3]):
        with st.container():
            # Enhanced cause display
            match_percentage = int(match_score * 100)
            st.markdown(f"""
            <div class="cause-card">
                <h3>{cause_info.get('emoji', '🎯')} {cause_info.get('title', 'Unknown Cause')} 
                    <span style="color: #32CD32;">({match_percentage}% match)</span>
                </h3>
                <p>{cause_info.get('description', 'No description available')}</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Get matching actions
            matching_actions = get_matching_actions(cause_id, user_profile)
            
            if matching_actions:
                st.markdown("**✨ Perfect actions for you:**")
                
                for action in matching_actions[:2]:  # Show top 2 actions
                    col1, col2, col3 = st.columns([3, 1, 1])
                    
                    with col1:
                        st.markdown(f"""
                        <div class="action-card">
                            <h4>{action.get('title', 'Unknown Action')}</h4>
                            <p>{action.get('description', 'No description')}</p>
                            <p><em>Impact: {action.get('impact', {}).get('metric_description', 'Positive impact')}</em></p>
                        </div>
                        """, unsafe_allow_html=True)
                    
                    with col2:
                        requirements = action.get('requirements', {})
                        st.markdown(f"⏱️ {requirements.get('time_minutes', 0)} min")
                        st.markdown(f"💰 ${requirements.get('cost_usd', 0)}")
                    
                    with col3:
                        if st.button(f"Start This! 🚀", key=f"action_{action.get('id', i)}"):
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
                            
                            # Show enhanced celebration
                            cause_title = cause_info.get('title', 'this cause')
                            celebrate_action_completion(action.get('title', 'this action'), cause_title)
                            
                            # Show action URL if available
                            org_website = action.get('organization', {}).get('website')
                            if org_website and org_website != '#':
                                st.markdown(f"🔗 [Take Action Now]({org_website})")
                                st.info("✨ Click the link above to complete your action!")
                            
                            # Show next steps suggestion
                            st.markdown("#### 🎯 What's Next?")
                            col_a, col_b, col_c = st.columns(3)
                            with col_a:
                                if st.button("🔄 Try Another Action", key=f"another_{action.get('id')}"):
                                    st.rerun()
                            with col_b:
                                if st.button("📊 See My Impact", key=f"impact_{action.get('id')}"):
                                    st.session_state.selected_page = "📊 My Impact"
                                    st.rerun()
                            with col_c:
                                if st.button("⚡ Quick Actions", key=f"quick_{action.get('id')}"):
                                    st.session_state.selected_page = "⚡ Quick Actions"
                                    st.rerun()
            else:
                st.info("No actions currently match your constraints, but we're always adding more!")
            
            st.markdown("---")
    
    # Save profile button
    col1, col2 = st.columns(2)
    with col1:
        if st.button("← Retake Assessment"):
            st.session_state.assessment_step = 1
            st.rerun()
    with col2:
        if st.button("Save My Profile ✅", type="primary"):
            st.success("Profile saved! You can now track your impact.")
            st.balloons()

def show_quick_actions_page():
    """Enhanced quick actions with real data"""
    st.markdown('<h1 class="main-header">⚡ Quick Impact Right Now</h1>', unsafe_allow_html=True)
    
    # Motivational message
    st.info("🌟 " + get_random_encouragement("progress_encouragement"))
    
    col1, col2 = st.columns(2)
    with col1:
        time_filter = st.selectbox("I have:", ["5 minutes", "15 minutes", "30 minutes", "1 hour"])
    with col2:
        cause_filter = st.selectbox("For:", ["Any cause", "Climate", "Education", "Community", "Health"])
    
    st.markdown("### 🎯 Perfect matches for you:")
    
    # Load and filter quick actions from JSON
    actions_data = load_actions_data()
    quick_actions = []
    
    for action_id, action in actions_data.items():
        requirements = action.get('requirements', {})
        action_time = requirements.get('time_minutes', 0)
        
        # Filter by time
        time_limit = {'5 minutes': 5, '15 minutes': 15, '30 minutes': 30, '1 hour': 60}[time_filter]
        
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
                    st.markdown(f"*Impact: {impact_desc}*")
                with col2:
                    requirements = action.get('requirements', {})
                    st.markdown(f"⏱️ {requirements.get('time_minutes', 0)} min")
                    st.markdown(f"💰 ${requirements.get('cost_usd', 0)}")
                with col3:
                    if st.button("Do This Now", key=f"quick_{action.get('id', 'unknown')}"):
                        # Enhanced celebration with cause context
                        cause_name = action.get('cause_id', 'helping others').replace('_', ' ').title()
                        celebrate_action_completion(action.get('title', 'this action'), cause_name)
                        
                        # Update metrics
                        st.session_state.total_impact['actions'] += 1
                        st.session_state.total_impact['time'] += requirements.get('time_minutes', 0)
                        st.session_state.total_impact['money'] += requirements.get('cost_usd', 0)
                        
                        # Show action link if available
                        org_website = action.get('organization', {}).get('website')
                        if org_website and org_website != '#':
                            st.markdown(f"🔗 [Complete This Action]({org_website})")
                            st.success("Ready to make an impact? Click the link above!")
                        
                        # Encourage continued engagement
                        st.markdown("🌟 **Keep the momentum going!**")
                        if st.button("Find More Quick Actions", key=f"more_quick_{action.get('id')}"):
                            st.rerun()
    else:
        st.warning("No quick actions found for your criteria. Try adjusting your filters!")

def show_impact_page():
    """Enhanced impact tracking with celebrations"""
    st.markdown('<h1 class="main-header">📊 Your Impact Story</h1>', unsafe_allow_html=True)
    
    # Check for milestones
    total_actions = st.session_state.total_impact['actions']
    if total_actions == 1:
        encouragement_data = load_encouragement_data()
        milestone_msg = encouragement_data.get("milestone_messages", {}).get("first_action", "🏆 Great job on your first action!")
        st.markdown(f'<div class="celebration">{milestone_msg}</div>', unsafe_allow_html=True)
        st.balloons()
    
    # Impact metrics
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown('<div class="impact-metric">', unsafe_allow_html=True)
        st.metric("Actions Taken", total_actions, f"+{len(st.session_state.actions_completed)} this session")
        st.markdown('</div>', unsafe_allow_html=True)
    
    with col2:
        st.markdown('<div class="impact-metric">', unsafe_allow_html=True)
        total_time = st.session_state.total_impact['time']
        st.metric("Time Contributed", f"{total_time} min", f"{total_time/60:.1f} hours")
        st.markdown('</div>', unsafe_allow_html=True)
    
    with col3:
        st.markdown('<div class="impact-metric">', unsafe_allow_html=True)
        total_money = st.session_state.total_impact['money']
        st.metric("Money Donated", f"${total_money}", "Creating real change")
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Action history
    if st.session_state.actions_completed:
        st.markdown("### 🌟 Your Journey")
        
        for action in reversed(st.session_state.actions_completed[-5:]):  # Show last 5
            timestamp = datetime.fromisoformat(action['timestamp']).strftime("%m/%d %H:%M")
            st.markdown(f"**{timestamp}** - ✅ {action['title']} (*{action['cause'].replace('_', ' ').title()}*)")
    
    # Community impact
    st.markdown("### 🌍 Community Impact")
    community_messages = [
        "Together, our community has planted 1,247 trees this month! 🌳",
        "We've supported 834 students in their education! 📚", 
        "Our collective action has contributed 3,456 volunteer hours! ⏰",
        "As a community, we've donated $12,345 to effective charities! 💰"
    ]
    
    for msg in random.sample(community_messages, 2):
        st.info(msg)
    
    # Growth suggestions with encouraging context
    st.markdown("### 🚀 Keep Growing Your Impact")
    
    if total_actions == 0:
        st.info("🌱 Ready to take your first step? Every journey begins with a single action.")
    elif total_actions < 3:
        st.info("🌿 You're building great momentum! Consistency creates lasting change.")
    else:
        st.info("🌳 You're becoming a true changemaker! Your actions inspire others.")
    
    col_grow1, col_grow2 = st.columns(2)
    with col_grow1:
        if st.button("🎯 Find My Next Action", type="primary"):
            st.success("Let's find your next meaningful action!")
    with col_grow2:
        if st.button("⚡ Quick Impact Now"):
            st.rerun()

def show_causes_page():
    """Enhanced causes exploration"""
    st.markdown('<h1 class="main-header">🌍 Explore Causes</h1>', unsafe_allow_html=True)
    
    causes_data = load_causes_data()
    
    if not causes_data:
        st.error("Unable to load causes data.")
        return
    
    for cause_id, cause_info in causes_data.items():
        with st.expander(f"{cause_info.get('emoji', '🎯')} {cause_info.get('title', 'Unknown Cause')}"):
            st.markdown(cause_info.get('description', 'No description available'))
            
            # Show some stats
            col1, col2 = st.columns(2)
            with col1:
                urgency = cause_info.get('time_sensitivity', 'ongoing')
                st.markdown(f"**Urgency Level:** {urgency.title()}")
                scope = cause_info.get('geographic_scope', 'varies')
                st.markdown(f"**Geographic Scope:** {scope.title()}")
            
            with col2:
                # Show learning resources if available
                resources = cause_info.get('learning_resources', [])
                if resources:
                    st.markdown("**Learn More:**")
                    for resource in resources[:2]:
                        st.markdown(f"• [{resource.get('title', 'Resource')}]({resource.get('url', '#')})")
            
            # Show success stories
            stories = cause_info.get('success_stories', [])
            if stories:
                story = stories[0]  # Show first story
                st.markdown(f"**Success Story:** {story.get('story', 'Amazing impact achieved!')}")

if __name__ == "__main__":
    main() 