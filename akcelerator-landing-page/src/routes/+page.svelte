<script>
  import { onMount } from 'svelte';
  import { currentLanguage } from '../lib/stores.js';
  import Hero from '../components/Hero.svelte';
  import SolidarityGarden from '../components/SolidarityGarden.svelte';
  import CzechMap from '../components/CzechMap.svelte';
  import ImmediateHelp from '../components/ImmediateHelp.svelte';
  import CTASection from '../components/CTASection.svelte';
  import FeedbackModal from '../components/FeedbackModal.svelte';
  import LanguageToggle from '../components/LanguageToggle.svelte';
  import { launchStreamlitApp } from '../lib/streamlit-integration.js';
  import { initScrollAnimations } from '../lib/animations.js';

  
  /** @type {import('./$types').PageData} */
  export let data;
  
  let language = 'czech';
  
  // Subscribe to language changes
  currentLanguage.subscribe(value => {
    language = value;
  });
  
  const content = {
    czech: {
      nav: {
        home: "Domů",
        how: "Jak to funguje",
        stories: "Příběhy naděje",
        regions: "Regiony",
        launch: "Spustit akcelerátor"
      },
      sections: {
        story: "Od empatie k akci",
        garden: "Příběhy naděje",
        map: "Pomoc napříč Českem",
        cta: "Začni pomáhat"
      }
    },
    english: {
      nav: {
        home: "Home",
        how: "How it works",
        stories: "Stories of Hope",
        regions: "Regions", 
        launch: "Launch accelerator"
      },
      sections: {
        story: "From empathy to action",
        garden: "Stories of Hope",
        map: "Help across Czechia",
        cta: "Start helping"
      }
    }
  };
  
  function scrollToSection(sectionId) {
    if (typeof document !== 'undefined') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }
  
  onMount(() => {
    // Initialize scroll animations
    initScrollAnimations();
    
    // Log Supabase connection status from server
    if (data?.supabaseStatus) {
      console.log('🔗 Supabase Status:', data.supabaseStatus);
      if (data.supabaseStatus.connected) {
        console.log('✅ Supabase connection successful!');
        console.log(`📊 Feedback entries found: ${data.supabaseStatus.feedbackCount}`);
        if (data.supabaseStatus.recentFeedback?.length > 0) {
          console.log('📝 Recent feedback samples:', data.supabaseStatus.recentFeedback.slice(0, 3));
        }
      } else {
        console.error('❌ Supabase connection failed:', data.supabaseStatus.error);
      }
    }
    
    // Add smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.dataset.section;
        scrollToSection(sectionId);
      });
    });
  });
</script>

<!-- Navigation -->
<nav class="czech-nav">
  <div class="nav-container">
    <!-- Logo -->
    <div class="nav-logo">
      <div class="logo-icon">🤝</div>
      <span class="logo-text">
        {language === 'czech' ? 'Akcelerátor altruismu' : 'Altruism Accelerator'}
      </span>
    </div>
    
    <!-- Navigation Links -->
    <div class="nav-links">
      <a href="#hero" class="nav-link" data-section="hero">
        {content[language].nav.home}
      </a>
      <a href="#story" class="nav-link" data-section="story">
        {content[language].sections.story}
      </a>
      <a href="#solidarity-garden" class="nav-link" data-section="solidarity-garden">
        {content[language].nav.stories}
      </a>
      <a href="#czech-map" class="nav-link" data-section="czech-map">
        {content[language].sections.map}
      </a>
    </div>
    
    <!-- Language Selector & CTA -->
    <div class="nav-actions">
      <!-- Unified Language Toggle -->
      <LanguageToggle />
      
      <button 
        class="nav-cta"
        on:click={() => launchStreamlitApp({ language })}
      >
        {content[language].nav.launch}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>
</nav>

<!-- Main Content -->
<main class="landing-page">
  <!-- Hero Section -->
  <Hero />
  
  <!-- From Empathy to Action Section - Enhanced Structure -->
  <section id="story" class="story-section czech-section">
    <div class="czech-container">
      <div class="story-content">
        <div class="story-text">
          <h2 class="czech-heading-lg mb-8 text-center">
            {language === 'czech' 
              ? 'Od empatie k akci – česky a prakticky' 
              : 'From empathy to action – Czech and practical'}
          </h2>
          
          {#if language === 'czech'}
            <div class="story-paragraphs">
              <!-- Inspirational Quote - User-Focused -->
              <div class="havel-quote-hero">
                <div class="quote-decoration">💝</div>
                <blockquote class="quote-content">
                  "Když nemůžete pomoci všem, pomozte alespoň jednomu."
                </blockquote>
                <cite class="quote-attribution">— Matka Tereza</cite>
                <div class="quote-decoration">💝</div>
              </div>
              
              <div class="story-intro">
                <p class="czech-body-large mb-4">
                  Češi nechtějí velká gesta. Chceme <strong>praktické kroky</strong>, které skutečně pomáhají.
                </p>
                <p class="czech-body mb-6">
                  Každá akce začíná u vás. Každý krok má význam. Spojujeme lidi, kteří chtějí pomoci, s konkrétními možnostmi.
                </p>
              </div>
            </div>
          {:else}
            <div class="story-paragraphs">
              <!-- Inspirational Quote - User-Focused -->
              <div class="havel-quote-hero">
                <div class="quote-decoration">💝</div>
                <blockquote class="quote-content">
                  "If you can't help everyone, help just one."
                </blockquote>
                <cite class="quote-attribution">— Mother Teresa</cite>
                <div class="quote-decoration">💝</div>
              </div>
              
              <div class="story-intro">
                <p class="czech-body-large mb-4">
                  Czechs don't want grand gestures. We want <strong>practical steps</strong> that truly help.
                </p>
                <p class="czech-body mb-6">
                  Every action starts with you. Every step matters. We connect people who want to help with concrete opportunities.
                </p>
              </div>
            </div>
          {/if}
          
          <!-- Action Steps - Clear Path -->
          <div class="action-steps">
            <h3 class="czech-heading-md mb-6 text-center">
              {language === 'czech' ? 'Jak to funguje:' : 'How it works:'}
            </h3>
            <div class="steps-grid">
              <div class="step-card">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4 class="step-title">
                    {language === 'czech' ? 'Řekni nám o sobě' : 'Tell us about yourself'}
                  </h4>
                  <p class="step-description">
                    {language === 'czech' ? 'Stačí pár otázek o tom, co tě zajímá a kolik času máš' : 'Just a few questions about what interests you and how much time you have'}
                  </p>
                </div>
              </div>
              <div class="step-card">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4 class="step-title">
                    {language === 'czech' ? 'Najdi svou příležitost' : 'Find your opportunity'}
                  </h4>
                  <p class="step-description">
                    {language === 'czech' ? 'Doporučíme ti konkrétní akce ve tvém okolí' : 'We recommend specific actions in your area'}
                  </p>
                </div>
              </div>
              <div class="step-card">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4 class="step-title">
                    {language === 'czech' ? 'Začni pomáhat' : 'Start helping'}
                  </h4>
                  <p class="step-description">
                    {language === 'czech' ? 'Připoj se k ověřeným organizacím a udělej rozdíl' : 'Join verified organizations and make a difference'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Community Stats -->
          <div class="story-stats">
            <div class="stat-item">
              <div class="stat-icon">🏃‍♀️</div>
              <div class="stat-number">247</div>
              <div class="stat-label">
                {language === 'czech' ? 'akcí tento týden' : 'actions this week'}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">🤝</div>
              <div class="stat-number">1,834</div>
              <div class="stat-label">
                {language === 'czech' ? 'aktivních lidí' : 'active helpers'}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">🗺️</div>
              <div class="stat-number">12</div>
              <div class="stat-label">
                {language === 'czech' ? 'regionů' : 'regions'}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Visual Elements - Improved -->
        <div class="story-visual">
          <div class="visual-elements">
            <div class="element element-1">
              <div class="element-icon">🏠</div>
              <p class="element-text">
                {language === 'czech' ? 'Soused pomáhá sousedovi' : 'Neighbor helps neighbor'}
              </p>
              <button class="element-cta" on:click={() => scrollToSection('solidarity-garden')}>
                {language === 'czech' ? 'Zobrazit příběhy' : 'View stories'}
              </button>
            </div>
            <div class="element element-2">
              <div class="element-icon">✨</div>
              <p class="element-text">
                {language === 'czech' ? 'Malé kroky, velký dopad' : 'Small steps, big impact'}
              </p>
              <button class="element-cta" on:click={() => scrollToSection('solidarity-garden')}>
                {language === 'czech' ? 'Začít hned' : 'Start now'}
              </button>
            </div>
            <div class="element element-3">
              <div class="element-icon">💪</div>
              <p class="element-text">
                {language === 'czech' ? 'Praktická solidarita' : 'Practical solidarity'}
              </p>
              <button class="element-cta" on:click={() => scrollToSection('solidarity-garden')}>
                {language === 'czech' ? 'Připojit se' : 'Join now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  
  <!-- Solidarity Garden Section -->
  <SolidarityGarden />
  
  <!-- Czech Map Section -->
  <CzechMap />
  
  <!-- Final CTA Section -->
  <CTASection />
  
  <!-- Immediate Help - Fixed Position -->
  <ImmediateHelp />
  
  <!-- Feedback Modal - Floating Button -->
  <FeedbackModal />
</main>

<style>
  /* Navigation Styles */
  .czech-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(245, 241, 232, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--subtle-border);
    z-index: 100;
    transition: all var(--timing-medium) var(--ease-gentle);
  }
  
  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 70px;
  }
  
  .nav-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: var(--czech-forest);
    font-weight: 600;
    font-size: 1.1rem;
  }
  
  .logo-icon {
    font-size: 1.5rem;
  }
  
  .nav-links {
    display: flex;
    align-items: center;
    gap: 2rem;
  }
  
  .nav-link {
    text-decoration: none;
    color: var(--text-secondary);
    font-weight: 500;
    transition: color var(--timing-medium) var(--ease-gentle);
    position: relative;
  }
  
  .nav-link:hover,
  .nav-link:focus {
    color: var(--czech-forest);
  }
  
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--copper-detail);
    transition: width var(--timing-medium) var(--ease-gentle);
  }
  
  .nav-link:hover::after {
    width: 100%;
  }
  
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .nav-cta {
    background: var(--czech-forest);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all var(--timing-medium) var(--ease-gentle);
  }
  
  .nav-cta:hover {
    background: var(--czech-forest-dark);
    transform: translateY(-1px);
  }
  
  /* Landing Page Layout */
  .landing-page {
    padding-top: 70px; /* Account for fixed nav */
  }
  
  /* Story Section */
  .story-section {
    padding: 6rem 0;
    background: linear-gradient(135deg, #fafcfa 0%, #f0f6f0 100%);
  }
  
  .story-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5rem;
    align-items: start;
  }
  
  .story-paragraphs {
    margin-bottom: 3rem;
  }
  
  .story-intro {
    text-align: center;
    max-width: 700px;
    margin: 0 auto;
  }
  
  /* Action Steps Section */
  .action-steps {
    margin: 4rem 0;
    padding: 3rem 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    backdrop-filter: blur(10px);
  }
  
  .steps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    max-width: 900px;
    margin: 0 auto;
  }
  
  .step-card {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    border: 1px solid var(--subtle-border);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .step-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(46, 93, 49, 0.15);
    background: rgba(255, 255, 255, 0.95);
  }
  
  .step-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--czech-forest), var(--copper-detail));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .step-card:hover::before {
    opacity: 1;
  }
  
  .step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, var(--czech-forest), var(--czech-forest-light));
    color: white;
    border-radius: 50%;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 12px rgba(46, 93, 49, 0.3);
  }
  
  .step-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--czech-forest);
    margin-bottom: 1rem;
    line-height: 1.3;
  }
  
  .step-description {
    font-size: 0.95rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
  }
  
  /* Enhanced Havel Quote Styling */
  .havel-quote-hero {
    background: linear-gradient(135deg, rgba(46, 93, 49, 0.05) 0%, rgba(176, 141, 87, 0.05) 100%);
    border-left: 4px solid var(--czech-forest);
    border-radius: 0 12px 12px 0;
    padding: 2rem 2.5rem;
    margin: 2rem 0 3rem 0;
    position: relative;
    box-shadow: 0 4px 16px rgba(46, 93, 49, 0.1);
    backdrop-filter: blur(5px);
  }
  
  .havel-quote-hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--czech-forest), var(--copper-detail));
  }
  
  .quote-decoration {
    font-size: 1.2rem;
    color: var(--copper-detail);
    margin: 0 0.5rem;
    display: inline-block;
  }
  
  .quote-content {
    font-size: 1.15rem;
    font-style: italic;
    color: var(--czech-forest);
    line-height: 1.6;
    margin: 1rem 0;
    font-weight: 400;
    text-align: center;
  }
  
  .quote-attribution {
    display: block;
    text-align: center;
    font-size: 0.95rem;
    color: var(--text-secondary);
    font-weight: 500;
    margin-top: 1rem;
    font-style: normal;
  }
  
  .story-stats {
    display: flex;
    gap: 2.5rem;
    margin-top: 2rem;
  }
  
  .stat-item {
    text-align: center;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 12px;
    border: 1px solid var(--subtle-border);
    transition: all 0.3s ease;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .stat-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(46, 93, 49, 0.15);
    background: rgba(255, 255, 255, 0.9);
  }
  
  .stat-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
  
  .stat-number {
    font-size: 2.8rem;
    font-weight: 700;
    color: var(--czech-forest);
    line-height: 1;
    text-shadow: 0 1px 2px rgba(46, 93, 49, 0.1);
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: 500;
    line-height: 1.3;
  }
  
  .visual-elements {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    margin-top: 2rem;
  }
  
  .element {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid var(--subtle-border);
    border-radius: 16px;
    transition: all var(--timing-medium) var(--ease-gentle);
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
  
  .element::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--copper-detail), var(--czech-forest-light));
    opacity: 0;
    transition: opacity var(--timing-medium) var(--ease-gentle);
  }
  
  .element:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 12px 32px rgba(46, 93, 49, 0.2);
    background: rgba(255, 255, 255, 0.95);
  }
  
  .element:hover::before {
    opacity: 1;
  }
  
  .element:hover .element-icon {
    animation: wiggle 0.6s ease-in-out;
  }
  
  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-3deg) scale(1.05); }
    75% { transform: rotate(3deg) scale(1.05); }
  }
  
  .element-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    transition: all 0.3s ease;
  }
  
  .element-text {
    font-weight: 500;
    color: var(--czech-forest);
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.4;
    flex-grow: 1;
  }
  
  .element-cta {
    background: var(--czech-forest);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    align-self: flex-start;
  }
  
  .element-cta:hover {
    background: var(--czech-forest-light);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 93, 49, 0.3);
  }
  
  /* Mobile Responsive */
  @media (max-width: 768px) {
    .nav-container {
      padding: 0 1rem;
      height: 60px;
    }
    
    .nav-links {
      display: none; /* Hide on mobile, show hamburger menu if needed */
    }
    
    .nav-actions {
      gap: 0.5rem;
    }
    
    .landing-page {
      padding-top: 60px;
    }
    
    .story-section {
      padding: 4rem 0;
    }
    
    .story-content {
      grid-template-columns: 1fr;
      gap: 3rem;
    }
    
    .havel-quote-hero {
      padding: 1.5rem 2rem;
      margin: 1.5rem 0 2rem 0;
      border-radius: 0 8px 8px 0;
    }
    
    .quote-content {
      font-size: 1rem;
      line-height: 1.5;
    }
    
    .quote-decoration {
      font-size: 1rem;
    }
    
    .story-stats {
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }
    
    .stat-item {
      padding: 1rem;
      width: 100%;
      max-width: 250px;
    }
    
    .stat-number {
      font-size: 2.2rem;
    }
    
    .action-steps {
      margin: 2rem 0;
      padding: 2rem 1rem;
    }
    
    .steps-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    
    .step-card {
      padding: 1.5rem;
    }
    
    .step-number {
      width: 50px;
      height: 50px;
      font-size: 1.3rem;
    }
    
    .step-title {
      font-size: 1.1rem;
    }
    
    .step-description {
      font-size: 0.9rem;
    }
    
    .visual-elements {
      order: -1;
      gap: 1.5rem;
      margin-top: 0;
    }
    
    .element {
      text-align: center;
      padding: 1.5rem;
      gap: 1rem;
    }
    
    .element:hover {
      transform: translateY(-3px) scale(1);
    }
    
    .element-icon {
      font-size: 2rem;
    }
    
    .element-text {
      font-size: 0.95rem;
    }
    
    .element-cta {
      align-self: center;
      padding: 0.6rem 1.25rem;
      font-size: 0.85rem;
    }
  }
  
  /* Tablet optimizations */
  @media (max-width: 1024px) and (min-width: 769px) {
    .story-content {
      gap: 3.5rem;
    }
    
    .havel-quote-hero {
      padding: 1.75rem 2rem;
    }
    
    .story-stats {
      gap: 2rem;
    }
    
    .visual-elements {
      gap: 2rem;
    }
  }
</style> 