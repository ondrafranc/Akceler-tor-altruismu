# 🇨🇿 Akcelerátor Altruismu - LIVE MVP

**Praktická cesta od empatie k akci**

✅ **LIVE MVP DEPLOYED**: https://akcelerator-altruismu.vercel.app  
✅ **Interactive Story Garden**: Real Czech altruism stories with seasonal theming  
✅ **Anonymous Feedback System**: Supabase-powered feedback collection  
✅ **Vercel Analytics**: Production page view tracking  
✅ **Crisis Support**: Immediate help widget with real Czech resources  

A strategic platform designed specifically for Czech users who want to help their community but feel overwhelmed by the options. This live MVP provides personalized guidance through real Czech organizations and culturally adapted content.

## 🧭 Architecture Overview

This platform uses a **dual-architecture** approach combining a beautiful Czech-themed landing page with a powerful backend application engine.

### Core Architecture
- **Frontend**: Beautiful Czech-themed landing page (SvelteKit)
- **Backend**: Streamlit application (modular, launched from landing page)
- **Integration**: User clicks "Spustit akcelerátor" → opens Streamlit with preserved context
- **Persistence**: Supabase stores user feedback and dynamic content
- **Deployment**: GitHub → Vercel (landing) + Streamlit Cloud (or self-hosted Streamlit)

### Folder Structure
- `/akcelerator-landing-page/` → SvelteKit frontend  
- `/streamlit-app/` → Streamlit backend application
- `/legacy/` → Historical development files

### User Journey Flow
1. **Landing Page** → Interactive SvelteKit experience with Story Garden
2. **Story Exploration** → Click garden elements to see real Czech altruism stories
3. **Assessment Launch** → "Spustit akcelerátor" opens Streamlit app with context
4. **Personalized Journey** → Streamlit handles assessment, matching, and guidance
5. **Feedback Loop** → Supabase collects feedback from both components
6. **Crisis Support** → Immediate help widget always accessible

### Key Features

#### 1. Interactive Story Garden
- **Seasonal Theming**: Dynamic backgrounds based on current season
- **Real Stories**: 8 inspiring Czech altruism stories with real names and impacts
- **Clickable Elements**: Trees, flowers, sprouts trigger random story display
- **GSAP Animations**: Growth effects and sparkle particles on interaction
- **Accessibility**: Full keyboard navigation and screen reader support

#### 2. Anonymous Feedback System
- **Supabase Integration**: Stores feedback in production database
- **Privacy-First**: No user identification required
- **Modal Interface**: Accessible feedback collection with proper focus management
- **Data Insights**: Collects valuable user feedback for improvement

#### 3. Crisis Support Widget
- **Real Czech Resources**: Linka bezpečí, SOS Brno, Krizová intervence
- **Fixed Position**: Always accessible crisis support
- **Mobile Responsive**: Works across all device sizes
- **Immediate Help**: Direct links to crisis intervention services

#### 4. Vercel Analytics
- **Page View Tracking**: Automatic production analytics
- **Performance Monitoring**: Deployment and performance insights
- **User Behavior**: Understanding how users interact with the platform

## 📊 Current MVP Status - LIVE & DEPLOYED

### ✅ Completed Features (Production Ready)
✅ **SvelteKit Frontend** deployed on Vercel with Czech/English support  
✅ **Interactive Story Garden** with real Czech altruism stories  
✅ **Seasonal Theming** with dynamic backgrounds and story filtering  
✅ **Anonymous Feedback System** with Supabase integration  
✅ **Vercel Analytics** for production page view tracking  
✅ **Crisis Support Widget** with real Czech resources  
✅ **GSAP Animations** with sparkle effects and growth animations  
✅ **Mobile Responsive Design** with accessibility features  
✅ **Streamlit Integration** for deep recommendation engine  
✅ **Professional Deployment** with GitHub → Vercel workflow  

### 🔄 Enhancement Roadmap (Next Priorities)
🔄 **Regional Customization** (Prague/Brno/Ostrava specific content)  
🔄 **Enhanced Hover Animations** across all components  
🔄 **Language Fallback Improvements** with browser detection  
🔄 **User Accounts** with story preferences and history  
🔄 **Community Features** and local story sharing  

### 🔄 Future Vision (V3+)
🔄 **Mobile App Development**  
🔄 **AI-Enhanced Story Recommendations**  
🔄 **API Partnerships** with Czech organizations  
🔄 **Impact Verification** and measurement tools  

## 🎯 Purpose

**Target Users**: Empathetic individuals (teens to adults) who:
- Feel overwhelmed by world problems
- Want to help but don't know where to start
- Seek inspiration from real success stories
- Want to contribute to their community
- Need emotional support and practical guidance

**Core Goal**: Transform emotional overwhelm into confident action through inspiring stories, community connection, and accessible support resources.

## 🚀 Live Application

### Production URLs
- **Main Application**: https://akcelerator-altruismu.vercel.app
- **Backend Engine**: Streamlit integration for deep recommendations

### Local Development
```bash
# Frontend Development (SvelteKit)
cd akcelerator-landing-page
npm install
npm run dev

# Backend Application (Streamlit)
cd streamlit-app
pip install -r requirements.txt
streamlit run app.py
```

## 🔧 Technical Implementation

### Current Stack
- **Frontend**: SvelteKit (Svelte + Vite)
- **Deployment**: Vercel (GitHub integration)
- **Database**: Supabase (PostgreSQL)
- **Analytics**: Vercel Analytics
- **Animations**: GSAP (GreenSock Animation Platform)
- **Styling**: Custom CSS with Czech-themed design
- **Backend**: Streamlit (Python) for complex recommendation logic

### Data Architecture
- **Story Content**: JSON files (`src/data/success_stories.json`)
- **Feedback Storage**: Supabase PostgreSQL database
- **User Sessions**: Client-side state management
- **Static Assets**: Served via Vercel CDN

### Integration Points
- **Supabase Client**: Environment variable configuration
- **Vercel Analytics**: Automatic injection in production
- **Streamlit Backend**: Deep recommendation engine integration
- **GitHub Workflow**: Automatic deployment on push

## 🎨 Design System

### Czech-Themed Aesthetics
- **Color Palette**: Czech forest greens, warm earth tones
- **Typography**: Inter + Source Sans Pro
- **Philosophy**: Calm, dignified, practical (Czech cultural values)
- **Interactions**: Subtle, meaningful animations

### Accessibility Features
- **Keyboard Navigation**: Full tab order and arrow key support
- **Screen Reader**: ARIA labels and semantic HTML
- **Focus Management**: Proper focus trapping in modals
- **Color Contrast**: WCAG AA compliant color ratios

## 🔐 Privacy & Ethics

### Privacy-First Approach
- **Anonymous Feedback**: No user identification required
- **Minimal Data Collection**: Only essential interaction data
- **Local Storage**: User preferences stored client-side
- **GDPR Compliant**: European privacy standards

### Ethical Considerations
- **Real Stories**: Authentic Czech altruism examples
- **Cultural Sensitivity**: Respectful representation of Czech values
- **Accessibility**: Inclusive design for all users
- **Crisis Support**: Immediate help resources prominently available

## 🌟 Vision & Impact

**Short-term Goal**: Inspire 1,000 Czech users to take their first altruistic action within 6 months through story inspiration.

**Long-term Vision**: Create a network of Czech altruists who support each other through shared stories, community connection, and mutual encouragement.

**Success Story**: "Přečetl jsem si příběhy o tom, jak obyčejní lidé pomáhají, a uvědomil si, že i já můžu něco změnit. Začal jsem dobrovolničit v místní organizaci a cítím se užitečný."

## 🛠 Developer Notes

- **Deployed via GitHub → Vercel** (no local development required)
- **Feedback saved via Supabase** (check environment variables in Vercel settings)
- **Page views tracked with @vercel/analytics** (automatic in production)
- **All builds validated through Vercel auto-deploy**, not `npm run dev`
- **All sensitive .env values injected via Vercel dashboard**
- **Story content managed via JSON files** in `static/` (moved for SSR compatibility)
- **Accessibility testing done via keyboard navigation and screen readers**
- **Mobile-first responsive design** with breakpoint testing

### Environment Variables (Vercel Dashboard)
```bash
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### File Structure
```
/ (Project Root)
├── akcelerator-landing-page/        # SvelteKit Frontend
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── SolidarityGarden.svelte  # Interactive story garden
│   │   │   ├── StoryModal.svelte        # Story display modal
│   │   │   └── FeedbackModal.svelte     # Anonymous feedback
│   │   ├── lib/
│   │   │   └── supabase/
│   │   │       └── client.ts            # Database configuration
│   │   └── routes/
│   │       ├── +layout.svelte           # App layout with analytics
│   │       └── +page.svelte             # Main landing page
│   ├── static/                          # Static assets
│   │   └── success_stories.json         # Czech altruism stories (SSR-safe)
│   └── vercel.json                      # Deployment configuration
├── streamlit-app/                   # Streamlit Backend Engine
│   ├── app.py                       # Main Streamlit application
│   ├── data/                        # Data files for causes, actions
│   │   ├── czech/                   # Czech-localized content
│   │   ├── causes/                  # Cause definitions
│   │   └── content/                 # Encouragement messages
│   ├── .streamlit/                  # Streamlit configuration
│   ├── requirements.txt             # Python dependencies
│   └── README.md                    # Backend documentation
└── legacy/                          # Historical development files
```

---

*Built with love for the Czech altruism community to transform good intentions into meaningful impact through shared stories and mutual support.* 