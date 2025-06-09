# Altruism Accelerator - Data Architecture

## Design Principles
- **Start Simple**: JSON files for MVP, easy database migration later
- **User Privacy**: Minimal data collection, local storage where possible
- **Scalability**: Structure that supports growth to full database
- **Portability**: User can export their data at any time

## MVP Data Storage Strategy

### File-Based Storage (Phase 1)
```
data/
├── causes/
│   ├── causes.json              # Master cause database
│   ├── actions.json             # Action opportunities database
│   └── organizations.json       # Vetted organizations and links
├── users/
│   ├── profiles/               # Individual user profiles
│   │   ├── user_12345.json     # One file per user
│   │   └── anonymous_xyz.json  # Anonymous/guest users
│   └── sessions/               # Temporary session data
├── content/
│   ├── assessment_questions.json
│   ├── guidance_content.json
│   └── encouragement_messages.json
└── analytics/
    ├── daily_metrics.json
    └── feedback_log.json
```

## Core Data Models

### 1. User Profile Schema
```json
{
  "user_id": "user_12345",
  "created_at": "2024-01-15T10:30:00Z",
  "last_active": "2024-01-20T15:45:00Z",
  "profile": {
    "emotional_state": "motivated",
    "values": ["environment", "education", "community"],
    "resources": {
      "time_per_week": "1-5_hours",
      "financial_monthly": "25-100",
      "skills": ["writing", "technical", "research"],
      "location": "seattle_wa",
      "languages": ["english"]
    },
    "constraints": {
      "mobility": "full",
      "schedule": "flexible_evenings",
      "communication": "email_preferred"
    },
    "preferences": {
      "group_vs_solo": "both",
      "virtual_vs_in_person": "both", 
      "commitment_style": "regular_small",
      "feedback_frequency": "weekly"
    }
  },
  "assessment_history": [
    {
      "date": "2024-01-15T10:30:00Z",
      "type": "initial_assessment",
      "responses": {...},
      "recommendations_generated": [...]
    }
  ],
  "action_history": [
    {
      "action_id": "climate_micro_donation",
      "cause": "climate_change",
      "status": "completed",
      "started_at": "2024-01-16T09:00:00Z",
      "completed_at": "2024-01-16T09:05:00Z",
      "impact_metrics": {
        "time_spent": 5,
        "money_donated": 15,
        "trees_planted": 3
      },
      "user_feedback": {
        "satisfaction": 9,
        "likelihood_to_repeat": 8,
        "effort_level": 2,
        "comments": "Easy and felt meaningful"
      }
    }
  ],
  "growth_tracking": {
    "total_actions": 12,
    "total_time_contributed": 840,  # minutes
    "total_money_donated": 175,
    "skills_developed": ["environmental_awareness"],
    "milestone_achievements": ["first_action", "first_month"],
    "engagement_level": "developing"
  }
}
```

### 2. Causes Database Schema
```json
{
  "causes": {
    "climate_change": {
      "id": "climate_change",
      "title": "Climate Action",
      "description": "Address climate change through individual and collective action",
      "categories": ["environment", "global_issue", "urgent"],
      "values_alignment": ["environment", "future_generations", "science"],
      "impact_metrics": ["CO2_reduced", "renewable_energy_supported", "awareness_raised"],
      "difficulty_levels": ["beginner", "intermediate", "advanced"],
      "geographic_scope": "global",
      "time_sensitivity": "urgent",
      "learning_resources": [
        {
          "title": "Climate Science Basics",
          "url": "https://example.com/climate-basics",
          "type": "article",
          "time_required": 15
        }
      ],
      "success_stories": [
        {
          "story": "Local community reduced emissions by 20%",
          "contributor": "Sarah M.",
          "impact": "Organized neighborhood solar installation"
        }
      ]
    }
  }
}
```

### 3. Actions Database Schema
```json
{
  "actions": {
    "climate_micro_donation": {
      "id": "climate_micro_donation",
      "title": "Plant Trees with One Earth",
      "description": "Support verified reforestation projects with a small monthly donation",
      "cause_id": "climate_change",
      "type": "donation",
      "commitment_type": "one_time",  # one_time, recurring, ongoing
      "requirements": {
        "time_minutes": 5,
        "cost_usd": 5,
        "skills": [],
        "location": "any",
        "age_minimum": 13
      },
      "impact": {
        "direct_beneficiaries": 100,
        "metric_description": "Trees planted per $5 donation",
        "measurement_unit": "trees",
        "measurement_quantity": 1,
        "verification_method": "third_party_certified"
      },
      "user_experience": {
        "complexity": "low",
        "emotional_reward": "concrete_progress",
        "social_aspect": "individual",
        "immediate_feedback": true,
        "progress_tracking": true
      },
      "organization": {
        "name": "One Earth Foundation",
        "website": "https://oneearth.org",
        "charity_rating": "A+",
        "transparency_score": 95
      },
      "next_steps": [
        "set_up_recurring_donation",
        "track_your_forest_growth", 
        "invite_friends_to_join"
      ]
    }
  }
}
```

### 4. Session Tracking Schema
```json
{
  "session_id": "session_abc123",
  "user_id": "user_12345",
  "started_at": "2024-01-20T15:30:00Z",
  "last_activity": "2024-01-20T15:45:00Z",
  "pages_visited": [
    {
      "page": "welcome",
      "timestamp": "2024-01-20T15:30:00Z",
      "time_spent": 120
    },
    {
      "page": "assessment_step_1", 
      "timestamp": "2024-01-20T15:32:00Z",
      "time_spent": 180
    }
  ],
  "actions_taken": [
    {
      "action": "started_assessment",
      "timestamp": "2024-01-20T15:32:00Z",
      "context": {"emotional_state": "motivated"}
    }
  ],
  "current_state": {
    "assessment_progress": 2,
    "recommendations_shown": [],
    "user_responses": {...}
  }
}
```

## Data Management Functions

### 1. User Data Management
```python
import json
import os
from datetime import datetime
import uuid

class UserDataManager:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.users_dir = os.path.join(data_dir, "users", "profiles")
        self.sessions_dir = os.path.join(data_dir, "users", "sessions")
        
    def create_user(self, initial_data=None):
        """Create new user profile"""
        user_id = f"user_{uuid.uuid4().hex[:8]}"
        
        profile = {
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "last_active": datetime.now().isoformat(),
            "profile": initial_data or {},
            "assessment_history": [],
            "action_history": [],
            "growth_tracking": {
                "total_actions": 0,
                "total_time_contributed": 0,
                "total_money_donated": 0,
                "skills_developed": [],
                "milestone_achievements": [],
                "engagement_level": "beginner"
            }
        }
        
        self.save_user(user_id, profile)
        return user_id
    
    def save_user(self, user_id, profile_data):
        """Save user profile to file"""
        profile_data["last_active"] = datetime.now().isoformat()
        
        filepath = os.path.join(self.users_dir, f"{user_id}.json")
        with open(filepath, 'w') as f:
            json.dump(profile_data, f, indent=2)
    
    def load_user(self, user_id):
        """Load user profile from file"""
        filepath = os.path.join(self.users_dir, f"{user_id}.json")
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                return json.load(f)
        return None
    
    def record_action(self, user_id, action_data):
        """Record completed action"""
        profile = self.load_user(user_id)
        if profile:
            profile["action_history"].append(action_data)
            profile["growth_tracking"]["total_actions"] += 1
            self.save_user(user_id, profile)
```

### 2. Content Data Management
```python
class ContentManager:
    def __init__(self, data_dir="data"):
        self.causes_file = os.path.join(data_dir, "causes", "causes.json")
        self.actions_file = os.path.join(data_dir, "causes", "actions.json")
        
    def load_causes(self):
        """Load all causes from file"""
        with open(self.causes_file, 'r') as f:
            return json.load(f)
    
    def load_actions(self, cause_filter=None):
        """Load actions, optionally filtered by cause"""
        with open(self.actions_file, 'r') as f:
            all_actions = json.load(f)
        
        if cause_filter:
            return {
                k: v for k, v in all_actions["actions"].items() 
                if v["cause_id"] == cause_filter
            }
        
        return all_actions["actions"]
    
    def get_actions_for_profile(self, user_profile):
        """Get actions matching user profile"""
        all_actions = self.load_actions()
        matched_actions = []
        
        for action_id, action_data in all_actions.items():
            if self._action_matches_profile(action_data, user_profile):
                matched_actions.append(action_data)
        
        return matched_actions
```

## Migration Strategy

### Phase 1: File-Based (MVP)
- Simple JSON files
- Local file operations
- Easy to inspect and debug
- No database dependencies

### Phase 2: SQLite Database
```sql
-- Core tables for local database
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP,
    last_active TIMESTAMP,
    profile_data JSON
);

CREATE TABLE actions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action_id TEXT,
    cause_id TEXT,
    status TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    impact_data JSON,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Phase 3: Cloud Database
- PostgreSQL for structured data
- Redis for session management
- S3 for static content
- Elasticsearch for content search

## Privacy & Data Protection

### Data Minimization
- Collect only necessary information
- Allow anonymous usage mode
- Regular data cleanup of old sessions

### User Control
- Export functionality from day one
- Clear data deletion process
- Transparent data usage policies

This architecture provides a solid foundation that can evolve from a simple MVP to a sophisticated platform while maintaining user trust and system reliability. 