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
        regions: "Regiony",
        launch: "Spustit akcelerátor"
      },
      sections: {
        story: "Příběh solidarity",
        garden: "Zahrada solidarity",
        map: "Pomoc napříč Českem",
        cta: "Začni pomáhat"
      }
    },
    english: {
      nav: {
        home: "Home",
        how: "How it works",
        regions: "Regions", 
        launch: "Launch accelerator"
      },
      sections: {
        story: "Story of solidarity",
        garden: "Solidarity garden",
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
      <a href="#solidarity-garden" class="nav-link" data-section="solidarity-garden">
        {content[language].sections.garden}
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
  
  <!-- Storytelling Section -->
  <section id="story" class="story-section czech-section">
    <div class="czech-container">
      <div class="story-content">
        <div class="story-text">
          <h2 class="czech-heading-lg mb-6">
            {language === 'czech' 
              ? 'Od empatie k akci – česky a prakticky' 
              : 'From empathy to action – Czech and practical'}
          </h2>
          
          {#if language === 'czech'}
            <div class="story-paragraphs">
              <p class="czech-body-large mb-4">
                Václav Havel říkal: "Naděje není přesvědčení, že se něco povede, 
                ale jistota, že má smysl, bez ohledu na to, jak to dopadne."
              </p>
              <p class="czech-body mb-4">
                Tato platforma vznikla z poznání, že Češi nechtějí velká gesta a prázdné řeči. 
                Chceme <strong>praktické kroky</strong>, které skutečně pomáhají.
              </p>
              <p class="czech-body mb-6">
                Od pomoci sousedům po podporu ukrajinských rodin, od doučování dětí 
                po péči o seniory – každá akce je propojená s důvěryhodnými 
                českými organizacemi.
              </p>
            </div>
          {:else}
            <div class="story-paragraphs">
              <p class="czech-body-large mb-4">
                Václav Havel said: "Hope is not the conviction that something will turn out well, 
                but the certainty that something makes sense, regardless of how it turns out."
              </p>
              <p class="czech-body mb-4">
                This platform was born from understanding that Czechs don't want grand gestures 
                and empty words. We want <strong>practical steps</strong> that truly help.
              </p>
              <p class="czech-body mb-6">
                From helping neighbors to supporting Ukrainian families, from tutoring children 
                to caring for seniors – every action is connected with trustworthy 
                Czech organizations.
              </p>
            </div>
          {/if}
          
          <div class="story-stats">
            <div class="stat-item">
              <div class="stat-number">247</div>
              <div class="stat-label">
                {language === 'czech' ? 'akcí tento týden' : 'actions this week'}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-number">1,834</div>
              <div class="stat-label">
                {language === 'czech' ? 'aktivních lidí' : 'active helpers'}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-number">12</div>
              <div class="stat-label">
                {language === 'czech' ? 'regionů' : 'regions'}
              </div>
            </div>
          </div>
        </div>
        
        <div class="story-visual">
          <div class="visual-elements">
            <div class="element element-1">
              <div class="element-icon">🤝</div>
              <p class="element-text">
                {language === 'czech' ? 'Soused pomáhá sousedovi' : 'Neighbor helps neighbor'}
              </p>
            </div>
            <div class="element element-2">
              <div class="element-icon">🌱</div>
              <p class="element-text">
                {language === 'czech' ? 'Malé kroky, velký dopad' : 'Small steps, big impact'}
              </p>
            </div>
            <div class="element element-3">
              <div class="element-icon">💚</div>
              <p class="element-text">
                {language === 'czech' ? 'Praktická solidarita' : 'Practical solidarity'}
              </p>
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
    padding: 5rem 0;
  }
  
  .story-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
  }
  
  .story-paragraphs {
    margin-bottom: 2rem;
  }
  
  .story-stats {
    display: flex;
    gap: 2rem;
  }
  
  .stat-item {
    text-align: center;
  }
  
  .stat-number {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--czech-forest);
    line-height: 1;
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  .visual-elements {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .element {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--bg-accent);
    border: 1px solid var(--subtle-border);
    border-radius: 12px;
    transition: all var(--timing-medium) var(--ease-gentle);
  }
  
  .element:hover {
    transform: translateX(8px);
    box-shadow: 0 8px 24px rgba(46, 93, 49, 0.1);
  }
  
  .element-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }
  
  .element-text {
    font-weight: 500;
    color: var(--czech-forest);
    margin: 0;
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
    
    .story-content {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    
    .story-stats {
      justify-content: center;
    }
    
    .visual-elements {
      order: -1;
    }
    
    .element {
      flex-direction: column;
      text-align: center;
      padding: 1rem;
    }
  }
</style> 