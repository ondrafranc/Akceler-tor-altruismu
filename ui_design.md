# Altruism Accelerator - UI Design & Layout

## Overall Design Philosophy
- **Warm, hopeful aesthetics**: Soft colors, encouraging messaging
- **Progress-oriented**: Clear steps and advancement indicators
- **Non-overwhelming**: One focus per screen, gentle pacing
- **Emotionally intelligent**: Acknowledges feelings, celebrates small wins

## Streamlit App Structure

### Sidebar Navigation
```
🌱 Altruism Accelerator
├── 🏠 Welcome
├── 🧭 Find Your Path
├── ⚡ Quick Actions
├── 📊 My Impact
├── 🌍 Explore Causes
└── 💬 Community
```

## Screen-by-Screen Layout

### 1. Welcome Screen (`pages/welcome.py`)
```
┌─────────────────────────────────────┐
│ 🌱 Welcome to Altruism Accelerator  │
│                                     │
│ "Feeling overwhelmed by the world's │
│ problems? You're not alone. Let's   │
│ find your path to meaningful help." │
│                                     │
│ [How are you feeling today?]        │
│ ○ Overwhelmed  ○ Motivated          │
│ ○ Frustrated   ○ Hopeful           │
│ ○ Guilty       ○ Ready to act      │
│                                     │
│ [Continue to Assessment] [Quick Help]│
└─────────────────────────────────────┘
```

### 2. Assessment Flow (`pages/assessment.py`)

#### Step 1: Values Discovery
```
┌─────────────────────────────────────┐
│ Step 1/4: What matters most to you? │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░ │
│                                     │
│ Select your top 3 values:          │
│ ☐ Reducing suffering              │
│ ☐ Protecting environment          │
│ ☐ Advancing justice               │
│ ☐ Supporting education            │
│ ☐ Building community              │
│ ☐ Creating opportunities          │
│ ☐ Promoting health                │
│ ☐ Preserving culture              │
│                                     │
│           [Next: Resources]         │
└─────────────────────────────────────┘
```

#### Step 2: Resource Inventory
```
┌─────────────────────────────────────┐
│ Step 2/4: What can you contribute?  │
│ ████████████████████░░░░░░░░░░░░░░░ │
│                                     │
│ Time Available:                     │
│ ○ 30 min/week  ○ 1-2 hours/week   │
│ ○ 3-5 hours/week  ○ 10+ hours/week │
│                                     │
│ Financial Capacity:                 │
│ ○ $0  ○ $5-25/month  ○ $25-100/month│
│ ○ $100+/month                      │
│                                     │
│ Skills & Interests:                │
│ ☐ Writing/Communication            │
│ ☐ Technology/Programming           │
│ ☐ Teaching/Mentoring               │
│ ☐ Event planning                   │
│ ☐ Research/Analysis                │
│                                     │
│      [Back]        [Next: Causes]   │
└─────────────────────────────────────┘
```

### 3. Personalized Recommendations (`pages/recommendations.py`)
```
┌─────────────────────────────────────┐
│ Your Personalized Path to Impact    │
│                                     │
│ Based on your values and resources: │
│                                     │
│ 🎯 PRIMARY MATCH                   │
│ Environmental Protection            │
│ "Your tech skills + eco values =   │
│ powerful impact potential"          │
│                                     │
│ Suggested Actions:                  │
│ • [Volunteer] Code for climate apps │
│ • [Donate] $15/month to reforestation│
│ • [Learn] Take sustainability course│
│                                     │
│ 🌟 SECONDARY MATCHES               │
│ - Education Access                  │
│ - Community Building               │
│                                     │
│     [Start These Actions]           │
└─────────────────────────────────────┘
```

### 4. Quick Actions (`pages/quick_actions.py`)
```
┌─────────────────────────────────────┐
│ ⚡ Quick Impact Right Now           │
│                                     │
│ I have: [15 minutes ▼] for [Any cause ▼]│
│                                     │
│ Perfect matches for you:            │
│                                     │
│ 📝 Write encouraging reviews        │
│    for social enterprises           │
│    ⏱ 10 min • 🎯 Community building │
│    [Do This Now]                    │
│                                     │
│ 💰 Micro-donate to clean water     │
│    ⏱ 2 min • 🎯 Health & poverty   │
│    [Do This Now]                    │
│                                     │
│ 📚 Share educational content       │
│    ⏱ 5 min • 🎯 Awareness building │
│    [Do This Now]                    │
└─────────────────────────────────────┘
```

### 5. Impact Dashboard (`pages/impact.py`)
```
┌─────────────────────────────────────┐
│ 📊 Your Impact Story                │
│                                     │
│ This Month: 3 actions taken         │
│ Total Impact: 12 hours, $45 donated │
│                                     │
│ ╭─ Actions Timeline ─╮              │
│ │ ✅ Volunteered 2hrs at food bank  │
│ │ ✅ Donated $15 to education       │
│ │ ✅ Shared climate awareness post  │
│ │ 📅 Upcoming: Beach cleanup        │
│ ╰─────────────────────╯             │
│                                     │
│ 🌍 Community Impact                │
│ Together we've contributed:         │
│ 1,247 volunteer hours this month    │
│                                     │
│ [Plan Next Actions] [Share Progress]│
└─────────────────────────────────────┘
```

## Technical Implementation Notes

### Streamlit Components
- `st.selectbox()` for dropdown selections
- `st.multiselect()` for multiple choice values
- `st.slider()` for time/money ranges
- `st.progress()` for step indicators
- `st.success()`, `st.info()` for encouraging messages
- Custom CSS for warm, hopeful styling

### State Management
- Use `st.session_state` to maintain user progress
- Save user profile to JSON for persistence
- Track actions and impact metrics

### Page Flow Control
- URL parameters for deep linking
- Session-based progress tracking
- "Back" functionality that preserves data 