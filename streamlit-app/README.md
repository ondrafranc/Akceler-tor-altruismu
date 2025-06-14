# 🚀 Akcelerátor Altruismu - Streamlit Backend

This is the core engine of the Akcelerátor Altruismu platform - a Streamlit application that provides personalized guidance for Czech users wanting to help their community.

## 🎯 Purpose

The Streamlit app is the **backend engine** that powers the user journey from empathy to action. While the SvelteKit landing page provides a beautiful portal, this application handles:

- **Personalized Assessment**: Understanding user values, resources, and preferences
- **Smart Matching**: Connecting users with relevant causes and actions
- **Emotional Guidance**: Providing encouragement and celebrating progress
- **Decision Logic**: Sophisticated algorithms for cause and action recommendations
- **User Journey Management**: Multi-step flows for different user types

## 🏗️ Architecture Role

```
Landing Page (SvelteKit) → [User clicks "Spustit akcelerátor"] → Streamlit App
```

The integration preserves user context and provides a seamless transition from marketing to action.

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application**:
   ```bash
   streamlit run app.py
   ```

3. **Access the App**:
   - Local: http://localhost:8501
   - Production: Deployed on Streamlit Cloud

## 📁 Structure

```
streamlit-app/
├── app.py                 # Main Streamlit application
├── data/                  # Data files for causes, actions, content
│   ├── czech/            # Czech-localized content
│   ├── causes/           # Cause definitions
│   └── content/          # Encouragement messages
├── .streamlit/           # Streamlit configuration
└── requirements.txt      # Python dependencies
```

## 🔗 Integration

The app is designed to:
- Receive parameters from the SvelteKit landing page
- Maintain user context across sessions
- Report back completion status to Supabase
- Provide deep-linking for specific sections

## 🌍 Deployment

- **Development**: Run locally with `streamlit run app.py`
- **Production**: Deploy to Streamlit Cloud or self-hosted infrastructure
- **Integration**: Called from landing page via iframe or direct link

## 🎨 Features

- **Czech-first Design**: Culturally adapted content and flows
- **Seasonal Content**: Dynamic messaging based on time of year
- **Progress Tracking**: User streaks and completion celebration
- **Smart Recommendations**: Advanced matching algorithms
- **Emotional Support**: Encouraging messages throughout the journey 