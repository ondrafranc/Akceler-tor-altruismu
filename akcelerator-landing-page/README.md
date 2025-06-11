# 🇨🇿 Akcelerátor Altruismu - Landing Page

An extraordinary, culturally intelligent landing page for the Czech Altruism Accelerator platform. This modern SvelteKit application serves as the emotional and visual gateway to the sophisticated Streamlit-based altruism application.

## 🎯 Project Vision

Transform the moment of empathetic overwhelm into practical Czech solidarity through:
- **Visual Storytelling**: From overwhelm to purposeful action
- **Cultural Authenticity**: Czech pragmatism, humility, and community solidarity  
- **Interactive Experience**: Solidarity garden, regional map
- **Seamless Integration**: Smooth transition to Streamlit application

---

## 🛠 Technology Stack

- **Framework**: SvelteKit (SSR/SSG capable)
- **Styling**: TailwindCSS + Custom Czech Theme CSS Variables
- **Animations**: GSAP with ScrollTrigger, custom Czech-appropriate timing
- **Interactivity**: p5.js for solidarity garden, SVG for regional map
- **Integration**: Streamlit backend connection with real-time data
- **Language**: Bilingual (Czech/English) with cultural adaptation

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Local Development

1. **Clone and Setup:**
```bash
git clone <your-repo-url>
cd akcelerator-landing-page
npm install
```

2. **Start Development Server:**
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

3. **Build for Production:**
```bash
npm run build
npm run preview
```

## 📦 Deploy to Vercel

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect SvelteKit settings

3. **Deploy:**
   - Click "Deploy" 
   - Vercel will build and deploy automatically
   - Your app will be live at `https://your-project.vercel.app`

### Method 2: Vercel CLI

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
# Follow the prompts to configure your project
```

## 🔧 Configuration

### Environment Variables
For production deployment, set these in Vercel Dashboard:

```
STREAMLIT_BASE_URL=https://akcelerator-altruismu.streamlit.app
```

### Vercel Settings
The project includes optimized `vercel.json` and SvelteKit adapter configuration:

- **Framework:** SvelteKit (auto-detected)
- **Build Command:** `npm run build`
- **Output Directory:** `.svelte-kit/output/client` (handled by adapter)
- **Node.js Runtime:** 18.x

### ✅ **Deployment Ready**
- TypeScript configuration issues resolved
- All dependencies properly configured
- Build process tested and working
- Vercel adapter correctly configured
- No quiz remnants or broken links

## 🔗 Integration

### Streamlit Backend
- Production app: `https://akcelerator-altruismu.streamlit.app`
- The landing page CTA button opens the Streamlit app in a new tab
- Includes error handling and fallback dialogs

### Features
- ✅ Responsive Czech-themed design
- ✅ Interactive regional map
- ✅ Solidarity garden visualization
- ✅ Seamless Streamlit integration
- ✅ Loading states and error handling
- ✅ Accessibility features
- ✅ Modern animations with GSAP

## 🛠 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run preview      # Preview production build
npm run lint         # Run linter
```

## 📁 Project Structure

```
akcelerator-landing-page/
├── src/
│   ├── components/
│   │   ├── Hero.svelte              # Hero section with parallax
│   │   ├── SolidarityGarden.svelte  # Interactive p5.js garden
│   │   ├── CzechMap.svelte          # Regional SVG map
│   │   └── CTASection.svelte        # Final call-to-action
│   ├── lib/
│   │   ├── animations.js            # GSAP utilities
│   │   ├── streamlit-integration.js # Backend connection
│   │   └── czech-data.js            # Czech content data
│   ├── styles/
│   │   └── czech-theme.css          # Custom CSS variables
│   └── routes/
│       ├── +layout.svelte           # Global layout
│       └── +page.svelte             # Main landing page
├── static/
│   ├── images/                      # Czech imagery assets
│   └── fonts/                       # Typography files
└── package.json
```

---

## 🎨 Design System - "Czech Forest Wisdom"

### Color Palette
```css
/* Primary - Czech forest green */
--czech-forest: #2E5D31;
--czech-forest-light: #4A7C59;
--czech-forest-dark: #1A3A1D;

/* Secondary - Moravian earth tones */
--moravian-earth: #8B7355;
--bohemian-mist: #E8F2E8;

/* Accent - Gentle warmth */
--warm-stone: #F5F1E8;
--copper-detail: #B08D57;
```

### Typography
- **Headlines**: Inter (strong, modern)
- **Body Text**: Source Sans Pro (readable, friendly)
- **Czech Tone**: Pragmatic, humble, action-oriented

### Animation Philosophy
- **Czech-Appropriate**: Gentle, purposeful, not flashy
- **Timing**: Thoughtful (1.2s), medium (0.4s), quick (0.2s)
- **Easing**: Natural curves, no aggressive bounces

---

## 🏗 Project Structure

```
akcelerator-landing-page/
├── src/
│   ├── components/
│   │   ├── Hero.svelte              # Hero section with parallax
│   │   ├── SolidarityGarden.svelte  # Interactive p5.js garden
│   │   ├── CzechMap.svelte          # Regional SVG map
│   │   └── CTASection.svelte        # Final call-to-action
│   ├── lib/
│   │   ├── animations.js            # GSAP utilities
│   │   ├── streamlit-integration.js # Backend connection
│   │   └── czech-data.js            # Czech content data
│   ├── styles/
│   │   └── czech-theme.css          # Custom CSS variables
│   └── routes/
│       ├── +layout.svelte           # Global layout
│       └── +page.svelte             # Main landing page
├── static/
│   ├── images/                      # Czech imagery assets
│   └── fonts/                       # Typography files
└── package.json
```

---

## 🌟 Key Features

### 1. **Czech Solidarity Garden** 
Interactive visualization where users plant virtual seeds representing real Czech actions. Each seed grows into impact visualization with real-time data from Streamlit backend.

### 2. **Regional Pulse Map**
SVG-based Czech Republic map with interactive regions (Prague, Brno, Ostrava). Clicking reveals local initiatives and launches region-specific Streamlit experience.

### 3. **Cultural Storytelling**
Scroll-based narrative incorporating:
- Václav Havel's philosophy of "living in truth"
- Czech traditions of neighbor helping neighbor
- Modern solidarity examples (Ukrainian refugees, elderly care)

---

## 🔌 Streamlit Integration

### Launch Parameters
```javascript
launchStreamlitApp({
  language: 'czech',
  region: 'prague',
  action: 'douccovani',
  source: 'landing-page'
});
```

### Real-time Data Fetching
```javascript
// Fetch current statistics
const data = await fetchStreamlitData();
// Returns: weeklyActions, activeUsers, regionalStats
```

### Deep Linking
```javascript
// Generate specific section URLs
const url = generateDeepLink('quick-actions', {
  language: 'czech',
  focus: 'tech'
});
```

---

## 🌍 Internationalization

### Language Implementation
- **Czech**: Primary market, authentic cultural adaptation
- **English**: International audience, maintains Czech context
- **Switching**: Seamless with URL persistence and localStorage

### Cultural Adaptations
```javascript
// Czech: Practical, humble tone
"Najdi praktický způsob, jak pomoct"

// English: Direct translation maintaining Czech spirit  
"Find a practical way to help"
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 768px (Czech mobile users priority)
- **Tablet**: 768px - 1024px 
- **Desktop**: 1024px+ (optimal experience)

### Mobile-First Optimizations
- Touch-friendly interactive elements
- Simplified navigation for Czech UX expectations
- Reduced motion for performance

---

## 🎯 Performance & SEO

### Core Web Vitals
- **LCP**: < 2.5s (optimized images, progressive loading)
- **FID**: < 100ms (efficient event handling)
- **CLS**: < 0.1 (stable layout shifts)

### SEO Features
- Czech and English meta tags
- JSON-LD structured data
- Semantic HTML with proper headings
- Open Graph images optimized for Czech social media

---

## 🧪 Testing & Quality

### Testing Strategy
```bash
# Component testing
npm run test

# E2E testing with Playwright
npm run test:e2e

# Czech language testing
npm run test:czech
```

### Accessibility
- WCAG 2.1 AA compliance
- Czech screen reader optimization
- Keyboard navigation
- High contrast mode support

---

## 📈 Analytics & Monitoring

### Key Metrics
- **Engagement**: Time spent, scroll depth
- **Conversion**: Streamlit app launches
- **Regional**: Prague/Brno/Ostrava usage patterns
- **Cultural**: Czech vs English preference

### Czech Market Insights
- Monitor regional preferences

- Measure garden interaction depth
- Analyze seasonal usage patterns

---

## 🤝 Contributing

### Development Guidelines
1. **Czech Cultural Sensitivity**: Test changes with Czech users
2. **Performance First**: Optimize for Czech internet speeds
3. **Accessibility**: Test with Czech assistive technologies
4. **Mobile Priority**: Czech users predominantly mobile

### Code Style
```bash
# Format with Prettier
npm run format

# Lint with ESLint
npm run lint

# Type check with TypeScript
npm run check
```

---

## 📞 Support & Community

### Czech Community
- **Discord**: Czech developers channel
- **GitHub**: Issues in Czech or English
- **Email**: podpora@akcelerator-altruismu.cz

### Documentation
- **Czech**: `/docs/czech/`
- **English**: `/docs/english/`
- **API**: `/docs/api/`

---

## 🏆 Cultural Achievements

This landing page represents a new model for **cultural adaptation in digital platforms**:

### Authentic Czech Values Integration
- **Quiet Strength**: Understated but powerful design
- **Practical Solidarity**: Focus on actionable steps
- **Community Trust**: Local organization partnerships
- **Historical Context**: Václav Havel philosophy integration

### Technical Cultural Intelligence
- **Animation Timing**: Czech-appropriate subtlety
- **Color Psychology**: Forest greens reflecting Czech landscape
- **Typography**: Professional yet humble
- **Interaction Design**: Thoughtful, not aggressive

---

## 📝 License

MIT License - Built with ❤️ for the Czech community

---

**Vývojáři**: Made by developers who understand both cutting-edge web technology and deep Czech cultural values.

**Vision**: Transform Silicon Valley optimism into Czech practical wisdom, creating a uniquely authentic platform for meaningful social action. 

---

**Ready for Production ✅**
This project is configured for zero-config deployment on Vercel. 