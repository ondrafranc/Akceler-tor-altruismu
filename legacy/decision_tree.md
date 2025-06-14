# Altruism Accelerator - Decision Tree System

## Core Decision Framework

### Level 1: Resource Assessment
```
┌─ User enters system ─┐
│                      │
├─ Time Available?     │
│  ├─ < 1 hour/week    ├─→ Micro-actions track
│  ├─ 1-5 hours/week   ├─→ Regular volunteer track
│  └─ 5+ hours/week    ├─→ Deep engagement track
│                      │
├─ Financial Capacity? │
│  ├─ $0               ├─→ Time/skill-based actions
│  ├─ $1-50/month      ├─→ Micro-donation track
│  └─ $50+/month       ├─→ Strategic giving track
│                      │
└─ Skills/Interests?   │
   ├─ Creative/Comm     ├─→ Awareness & advocacy
   ├─ Technical         ├─→ Tech-for-good projects
   ├─ People-focused    ├─→ Direct service
   └─ Research/Analysis ├─→ Strategic support
```

### Level 2: Values-Cause Matching Matrix

#### Primary Values → Cause Categories
```python
VALUES_TO_CAUSES = {
    "reducing_suffering": [
        "global_poverty", "healthcare_access", "mental_health", 
        "disaster_relief", "animal_welfare"
    ],
    "environment": [
        "climate_change", "conservation", "clean_energy", 
        "sustainable_living", "pollution_reduction"
    ],
    "justice": [
        "human_rights", "criminal_justice_reform", "equality", 
        "refugee_support", "political_advocacy"
    ],
    "education": [
        "literacy", "STEM_education", "digital_divide", 
        "early_childhood", "adult_learning"
    ],
    "community": [
        "local_volunteering", "neighborhood_improvement", 
        "cultural_preservation", "social_connection"
    ],
    "opportunities": [
        "job_training", "entrepreneurship", "mentoring", 
        "financial_literacy", "economic_development"
    ],
    "health": [
        "public_health", "healthcare_access", "nutrition", 
        "exercise_programs", "mental_health"
    ]
}
```

### Level 3: Action Type Decision Tree

#### Time-Based Actions
```
IF time_available == "< 1 hour/week":
    RECOMMEND:
    - Daily micro-actions (1-5 min)
    - Monthly donations
    - Social media advocacy
    - Petition signing
    - Mindful consumption choices

IF time_available == "1-5 hours/week":
    RECOMMEND:
    - Weekly volunteering
    - Skill-based projects
    - Event participation
    - Regular donations
    - Learning/training

IF time_available == "5+ hours/week":
    RECOMMEND:
    - Leadership roles
    - Project management
    - Deep skill development
    - Mentoring others
    - Creating new initiatives
```

#### Financial Capacity Actions
```
IF financial_capacity == "$0":
    FOCUS_ON:
    - Time volunteering
    - Skill sharing
    - Awareness raising
    - Peer education
    - Community organizing

IF financial_capacity == "micro" ($1-50/month):
    SUGGEST:
    - Automated small donations
    - Crowdfunding participation
    - Product/service choices
    - Subscription to ethical alternatives

IF financial_capacity == "significant" ($50+/month):
    RECOMMEND:
    - Strategic giving research
    - Effective altruism principles
    - Donor advised funds
    - Direct nonprofit support
    - Impact investing
```

## Sophisticated Matching Algorithm

### Scoring System
```python
def calculate_match_score(user_profile, cause):
    score = 0
    
    # Values alignment (40% weight)
    for value in user_profile['values']:
        if value in cause['aligned_values']:
            score += 40 / len(user_profile['values'])
    
    # Resource compatibility (30% weight)
    if cause['min_time'] <= user_profile['time_available']:
        score += 15
    if cause['min_money'] <= user_profile['financial_capacity']:
        score += 15
    
    # Skills match (20% weight)
    skill_matches = set(user_profile['skills']) & set(cause['helpful_skills'])
    score += (len(skill_matches) / len(cause['helpful_skills'])) * 20
    
    # Geographic relevance (10% weight)
    if cause['location'] in ['global', user_profile['location']]:
        score += 10
    
    return score
```

### Action Recommendation Logic
```python
def recommend_actions(user_profile, selected_causes):
    recommendations = []
    
    for cause in selected_causes:
        # Immediate actions (can do today)
        immediate = filter_actions(
            cause['actions'], 
            time_required="< 30 min",
            complexity="low"
        )
        
        # Weekly commitments
        weekly = filter_actions(
            cause['actions'],
            time_required=user_profile['weekly_time'],
            complexity="medium"
        )
        
        # Growth opportunities
        growth = filter_actions(
            cause['actions'],
            builds_skills=True,
            long_term_impact=True
        )
        
        recommendations.append({
            'cause': cause,
            'immediate': immediate[:2],  # Max 2 immediate actions
            'weekly': weekly[:1],        # 1 weekly commitment
            'growth': growth[:1]         # 1 growth opportunity
        })
    
    return recommendations
```

## Emotional State Considerations

### Overwhelm Response
```
IF emotional_state == "overwhelmed":
    PRIORITIZE:
    - Single, simple action
    - Success-oriented tasks
    - Community connection
    - Guided next steps
    - Celebration of small wins
    
    AVOID:
    - Multiple simultaneous causes
    - Complex decision trees
    - High-stakes commitments
```

### Motivation Amplification
```
IF emotional_state == "motivated":
    SUGGEST:
    - Ambitious but achievable goals
    - Leadership opportunities
    - Skill-building challenges
    - Community organizing
    - Long-term commitments
```

### Guilt Transformation
```
IF emotional_state == "guilty":
    FOCUS_ON:
    - Constructive action channels
    - Education about effective help
    - Sustainable engagement patterns
    - Self-care integration
    - Perspective on systemic issues
```

## Progressive Engagement Model

### Onboarding Path (First 30 days)
```
Week 1: One micro-action daily
Week 2: Add one weekly commitment
Week 3: Connect with community/find buddy
Week 4: Reflect and plan next month
```

### Growth Triggers
```
WHEN user completes 5 actions:
    UNLOCK: Intermediate opportunities

WHEN user donates 3 months consistently:
    SUGGEST: Strategic giving resources

WHEN user volunteers 20 hours:
    OFFER: Leadership development

WHEN user refers 3 friends:
    INVITE: Ambassador program
```

This decision tree transforms the overwhelming question "How can I help?" into a series of manageable, personalized steps that build confidence and create lasting impact. 