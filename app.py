"""
Altruism Accelerator - MVP Implementation
A tool to help empathetic people transform overwhelm into meaningful action.
"""

import streamlit as st
import json
import os
from datetime import datetime
import uuid
from typing import Dict, List, Any

# Configure page
st.set_page_config(
    page_title="Altruism Accelerator",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for warm, hopeful styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #2E8B57;
        text-align: center;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #708090;
        text-align: center;
        margin-bottom: 2rem;
    }
    .cause-card {
        border: 2px solid #90EE90;
        border-radius: 10px;
        padding: 1rem;
        margin: 1rem 0;
        background-color: #F0FFF0;
    }
    .action-button {
        background-color: #32CD32;
        color: white;
        border: none;
        border-radius: 5px;
        padding: 0.5rem 1rem;
        margin: 0.25rem;
    }
    .progress-text {
        font-size: 0.9rem;
        color: #556B2F;
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

# Data loading functions
@st.cache_data
def load_causes_data():
    """Load causes and actions data"""
    # For MVP, we'll use embedded data
    return {
        "climate_change": {
            "title": "Climate Action",
            "description": "Address climate change through individual and collective action",
            "values": ["environment", "future_generations", "science"],
            "emoji": "🌍",
            "urgency": "high"
        },
        "education": {
            "title": "Education Access", 
            "description": "Improve educational opportunities for underserved communities",
            "values": ["education", "equality", "opportunity"],
            "emoji": "📚",
            "urgency": "medium"
        },
        "community": {
            "title": "Community Building",
            "description": "Strengthen local communities and social connections",
            "values": ["community", "connection", "belonging"],
            "emoji": "🤝", 
            "urgency": "medium"
        },
        "health": {
            "title": "Health & Wellness",
            "description": "Improve health outcomes and access to healthcare",
            "values": ["health", "compassion", "service"],
            "emoji": "❤️",
            "urgency": "high"
        }
    }

@st.cache_data  
def load_actions_data():
    """Load specific actions for each cause"""
    return {
        "climate_change": [
            {
                "id": "climate_donation",
                "title": "Plant Trees Monthly",
                "description": "Support verified reforestation with $10/month",
                "type": "donation",
                "time": 2,
                "cost": 10,
                "impact": "Plants 2 trees per month",
                "url": "https://onetreeplanted.org"
            },
            {
                "id": "energy_audit",
                "title": "Home Energy Audit",
                "description": "Assess and improve your home's energy efficiency",
                "type": "personal_action",
                "time": 60,
                "cost": 0,
                "impact": "Reduce personal carbon footprint by 15%",
                "url": "https://www.energy.gov/energysaver"
            }
        ],
        "education": [
            {
                "id": "literacy_volunteer",
                "title": "Online Reading Tutor",
                "description": "Help a child improve reading skills via video calls",
                "type": "volunteer",
                "time": 30,
                "cost": 0,
                "impact": "Support 1 child's literacy development",
                "url": "https://www.literacyvolunteers.org"
            }
        ],
        "community": [
            {
                "id": "neighbor_connect",
                "title": "Organize Neighborhood Gathering",
                "description": "Host a simple meet-and-greet for your neighbors",
                "type": "organizing",
                "time": 120,
                "cost": 25,
                "impact": "Build connections among 10+ neighbors",
                "url": "#"
            }
        ],
        "health": [
            {
                "id": "mental_health_donation",
                "title": "Support Mental Health Services",
                "description": "Donate to provide therapy for those who can't afford it",
                "type": "donation",
                "time": 3,
                "cost": 25,
                "impact": "Fund 1 therapy session for someone in need",
                "url": "https://www.nami.org"
            }
        ]
    }

def calculate_cause_match(user_values: List[str], cause_values: List[str]) -> float:
    """Calculate how well a cause matches user values"""
    if not user_values:
        return 0.5  # Default moderate match
    
    overlap = len(set(user_values) & set(cause_values))
    return overlap / len(user_values)

def filter_actions_by_resources(actions: List[Dict], time_available: str, budget: str) -> List[Dict]:
    """Filter actions based on user's available time and money"""
    time_limits = {
        "30_min": 30,
        "1-2_hours": 120,
        "3-5_hours": 300,
        "10+_hours": 600
    }
    
    budget_limits = {
        "0": 0,
        "5-25": 25,
        "25-100": 100,
        "100+": 1000
    }
    
    max_time = time_limits.get(time_available, 30)
    max_budget = budget_limits.get(budget, 0)
    
    filtered = []
    for action in actions:
        if action["time"] <= max_time and action["cost"] <= max_budget:
            filtered.append(action)
    
    return filtered

# Main app navigation
def main():
    # Sidebar navigation
    st.sidebar.markdown("# 🌱 Altruism Accelerator")
    st.sidebar.markdown("*Transform overwhelm into meaningful action*")
    
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
    """Welcome and emotional check-in page"""
    st.markdown('<h1 class="main-header">🌱 Welcome to Altruism Accelerator</h1>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Feeling overwhelmed by the world\'s problems? You\'re not alone.<br>Let\'s find your path to meaningful help.</p>', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        st.markdown("### How are you feeling about the world today?")
        
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
            st.session_state.user_profile['emotional_state'] = emotional_state.split()[1]
            
            # Emotional validation and encouragement
            encouragement = {
                "Overwhelmed": "It's natural to feel overwhelmed - the world has big challenges. The good news? Small, consistent actions by many people create massive change. Let's find something manageable for you.",
                "Frustrated": "That frustration shows you care deeply. Let's channel that energy into effective action that matches your passion.",
                "Hopeful": "Your optimism is a superpower! Let's harness that positive energy and direct it where it can make the biggest difference.",
                "Guilty": "Guilt shows your conscience is awake, but action is more helpful than guilt. Let's find sustainable ways you can contribute without burning out.",
                "Motivated": "Amazing! That motivation can move mountains. Let's make sure it's directed toward the most effective actions for your situation.",
                "Uncertain": "Not knowing where to start is completely normal. That's exactly what this tool is for - we'll figure it out together."
            }
            
            emotion_key = emotional_state.split()[1]
            if emotion_key in encouragement:
                st.success(encouragement[emotion_key])
        
        st.markdown("---")
        
        col_a, col_b = st.columns(2)
        with col_a:
            if st.button("🧭 Take Full Assessment", type="primary", use_container_width=True):
                st.session_state.assessment_step = 1
                st.rerun()
        
        with col_b:
            if st.button("⚡ Get Quick Help Now", use_container_width=True):
                st.session_state.page = "quick_actions"
                st.rerun()

def show_assessment_page():
    """Multi-step assessment flow"""
    st.markdown('<h1 class="main-header">🧭 Find Your Path to Impact</h1>', unsafe_allow_html=True)
    
    # Progress indicator
    steps = ["Values", "Resources", "Preferences", "Recommendations"]
    current_step = st.session_state.get('assessment_step', 0)
    
    if current_step > 0:
        progress = (current_step - 1) / (len(steps) - 1)
        st.progress(progress)
        st.markdown(f'<p class="progress-text">Step {current_step} of {len(steps)}: {steps[current_step-1]}</p>', unsafe_allow_html=True)
    
    if current_step == 0 or current_step is None:
        st.info("👈 Start your assessment from the Welcome page!")
        return
    
    elif current_step == 1:
        show_values_step()
    elif current_step == 2:
        show_resources_step()
    elif current_step == 3:
        show_preferences_step()
    elif current_step == 4:
        show_recommendations_step()

def show_values_step():
    """Step 1: Values assessment"""
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
        max_selections=3
    )
    
    if len(selected_values) > 0:
        st.success(f"You selected: {', '.join([v.split(' ', 1)[1] for v in selected_values])}")
        st.session_state.user_profile['values'] = [v.split(' ', 1)[1].lower().replace(' ', '_') for v in selected_values]
        
        if st.button("Next: Resources", type="primary"):
            st.session_state.assessment_step = 2
            st.rerun()
    else:
        st.info("Please select at least one value to continue.")

def show_resources_step():
    """Step 2: Resources assessment"""
    st.markdown("### What can you contribute?")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**Time Available per Week:**")
        time_available = st.radio(
            "How much time can you typically contribute?",
            ["30 minutes or less", "1-2 hours", "3-5 hours", "10+ hours"],
            key="time_available"
        )
        
        st.markdown("**Skills & Interests:**")
        skills = st.multiselect(
            "What are you good at or interested in?",
            ["Writing/Communication", "Technology/Programming", "Teaching/Mentoring", 
             "Event Planning", "Research/Analysis", "Creative Arts", "Physical Labor"],
            key="user_skills"
        )
    
    with col2:
        st.markdown("**Financial Capacity:**")
        financial_capacity = st.radio(
            "How much can you donate monthly?",
            ["$0", "$5-25", "$25-100", "$100+"],
            key="financial_capacity"
        )
        
        st.markdown("**Location & Preferences:**")
        location_pref = st.selectbox(
            "Do you prefer local or global impact?",
            ["No preference", "Local community", "National issues", "Global causes"],
            key="location_pref"
        )
    
    if time_available and financial_capacity:
        st.session_state.user_profile.update({
            'time_available': time_available.replace(" ", "_").lower(),
            'financial_capacity': financial_capacity.replace("$", "").replace("+", "").lower(),
            'skills': [s.lower().replace("/", "_").replace(" ", "_") for s in skills],
            'location_preference': location_pref.lower().replace(" ", "_")
        })
        
        col_back, col_next = st.columns(2)
        with col_back:
            if st.button("← Back"):
                st.session_state.assessment_step = 1
                st.rerun()
        with col_next:
            if st.button("Next: Preferences", type="primary"):
                st.session_state.assessment_step = 3
                st.rerun()

def show_preferences_step():
    """Step 3: Preferences and style"""
    st.markdown("### How do you like to help?")
    
    col1, col2 = st.columns(2)
    
    with col1:
        group_pref = st.radio(
            "Do you prefer working:",
            ["Alone", "In small groups", "In large groups", "No preference"],
            key="group_preference"
        )
        
        commitment_style = st.radio(
            "What commitment style works for you?",
            ["One-time actions", "Regular small commitments", "Deep long-term involvement", "Flexible/varies"],
            key="commitment_style"
        )
    
    with col2:
        interaction_pref = st.radio(
            "Do you prefer:",
            ["Direct service (helping people)", "Behind-the-scenes support", "Advocacy and awareness", "Research and analysis"],
            key="interaction_preference"
        )
        
        feedback_pref = st.radio(
            "How often do you want progress updates?",
            ["Immediately", "Weekly", "Monthly", "Quarterly"],
            key="feedback_preference"
        )
    
    if group_pref and commitment_style and interaction_pref and feedback_pref:
        st.session_state.user_profile.update({
            'group_preference': group_pref.lower().replace(" ", "_"),
            'commitment_style': commitment_style.lower().replace(" ", "_"),
            'interaction_preference': interaction_pref.lower().replace(" ", "_"),
            'feedback_preference': feedback_pref.lower()
        })
        
        col_back, col_next = st.columns(2)
        with col_back:
            if st.button("← Back"):
                st.session_state.assessment_step = 2
                st.rerun()
        with col_next:
            if st.button("Get My Recommendations!", type="primary"):
                st.session_state.assessment_step = 4
                st.rerun()

def show_recommendations_step():
    """Step 4: Personalized recommendations"""
    st.markdown('<h1 class="main-header">🎯 Your Personalized Path to Impact</h1>', unsafe_allow_html=True)
    
    causes_data = load_causes_data()
    actions_data = load_actions_data()
    user_profile = st.session_state.user_profile
    
    # Calculate cause matches
    cause_matches = []
    for cause_id, cause_info in causes_data.items():
        match_score = calculate_cause_match(
            user_profile.get('values', []), 
            cause_info['values']
        )
        cause_matches.append((cause_id, cause_info, match_score))
    
    # Sort by match score
    cause_matches.sort(key=lambda x: x[2], reverse=True)
    
    st.markdown("### Based on your values and resources:")
    
    # Show top 3 matches
    for i, (cause_id, cause_info, match_score) in enumerate(cause_matches[:3]):
        with st.container():
            st.markdown(f"""
            <div class="cause-card">
                <h3>{cause_info['emoji']} {cause_info['title']} (Match: {match_score*100:.0f}%)</h3>
                <p>{cause_info['description']}</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Show relevant actions
            cause_actions = actions_data.get(cause_id, [])
            filtered_actions = filter_actions_by_resources(
                cause_actions,
                user_profile.get('time_available', '30_min'),
                user_profile.get('financial_capacity', '0')
            )
            
            if filtered_actions:
                st.markdown("**Perfect actions for you:**")
                for action in filtered_actions[:2]:  # Show top 2 actions
                    col1, col2, col3 = st.columns([3, 1, 1])
                    with col1:
                        st.markdown(f"**{action['title']}**")
                        st.markdown(f"{action['description']}")
                        st.markdown(f"*Impact: {action['impact']}*")
                    with col2:
                        st.markdown(f"⏱️ {action['time']} min")
                        st.markdown(f"💰 ${action['cost']}")
                    with col3:
                        if st.button(f"Start This", key=f"action_{action['id']}"):
                            st.success("Great choice! Opening resource...")
                            st.markdown(f"[Take Action Now]({action['url']})")
    
    st.markdown("---")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("← Retake Assessment"):
            st.session_state.assessment_step = 1
            st.rerun()
    with col2:
        if st.button("Save My Profile", type="primary"):
            st.success("Profile saved! You can now track your impact.")
            st.balloons()

def show_quick_actions_page():
    """Quick actions for immediate help"""
    st.markdown('<h1 class="main-header">⚡ Quick Impact Right Now</h1>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        time_filter = st.selectbox("I have:", ["5 minutes", "15 minutes", "30 minutes", "1 hour"])
    with col2:
        cause_filter = st.selectbox("For:", ["Any cause", "Climate", "Education", "Community", "Health"])
    
    st.markdown("### Perfect matches for you:")
    
    # Quick action recommendations
    quick_actions = [
        {
            "title": "🌳 Plant Trees with One Click",
            "description": "Donate $5 to plant a tree through verified reforestation",
            "time": "2 minutes",
            "impact": "1 tree planted",
            "category": "Climate"
        },
        {
            "title": "📚 Share Educational Content",
            "description": "Share a post about literacy to raise awareness",
            "time": "3 minutes", 
            "impact": "Reach 50+ people",
            "category": "Education"
        },
        {
            "title": "💌 Write Encouragement Note",
            "description": "Send an encouraging message to someone working in healthcare",
            "time": "5 minutes",
            "impact": "Brighten someone's day",
            "category": "Health"
        }
    ]
    
    for action in quick_actions:
        with st.container():
            col1, col2, col3 = st.columns([3, 1, 1])
            with col1:
                st.markdown(f"**{action['title']}**")
                st.markdown(action['description'])
                st.markdown(f"*Impact: {action['impact']}*")
            with col2:
                st.markdown(f"⏱️ {action['time']}")
                st.markdown(f"🎯 {action['category']}")
            with col3:
                if st.button("Do This Now", key=f"quick_{action['title'][:10]}"):
                    st.success("Action started! Well done! 🎉")

def show_impact_page():
    """User impact tracking and celebration"""
    st.markdown('<h1 class="main-header">📊 Your Impact Story</h1>', unsafe_allow_html=True)
    
    # Mock user data for demonstration
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Actions Taken", "7", "2 this week")
    with col2:
        st.metric("Time Contributed", "4.5 hours", "1.5 hrs this week")
    with col3:
        st.metric("Money Donated", "$85", "$25 this month")
    
    st.markdown("### Your Journey")
    
    # Timeline of actions
    timeline_data = [
        {"date": "2024-01-20", "action": "Planted 3 trees", "cause": "Climate"},
        {"date": "2024-01-18", "action": "Tutored reading online", "cause": "Education"},
        {"date": "2024-01-15", "action": "Donated to mental health", "cause": "Health"},
    ]
    
    for item in timeline_data:
        st.markdown(f"**{item['date']}** - ✅ {item['action']} (*{item['cause']}*)")
    
    st.markdown("### Community Impact")
    st.info("Together, our community has contributed 1,247 volunteer hours this month! 🌟")
    
    st.markdown("### Keep Growing")
    if st.button("Plan Next Actions", type="primary"):
        st.success("Let's find your next meaningful action!")

def show_causes_page():
    """Explore all causes and actions"""
    st.markdown('<h1 class="main-header">🌍 Explore Causes</h1>', unsafe_allow_html=True)
    
    causes_data = load_causes_data()
    
    for cause_id, cause_info in causes_data.items():
        with st.expander(f"{cause_info['emoji']} {cause_info['title']}"):
            st.markdown(cause_info['description'])
            st.markdown(f"**Urgency Level:** {cause_info['urgency'].title()}")
            if st.button(f"Learn More About {cause_info['title']}", key=f"learn_{cause_id}"):
                st.info("Opening detailed information...")

if __name__ == "__main__":
    main() 