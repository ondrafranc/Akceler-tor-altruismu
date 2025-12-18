<script>
  import { onMount } from 'svelte';
  import { currentLanguage } from '../lib/stores.js';
  import Hero from '../components/Hero.svelte';
  import SolidarityGarden from '../components/SolidarityGarden.svelte';
  import CzechMap from '../components/CzechMap.svelte';
  import ImmediateHelp from '../components/ImmediateHelp.svelte';
  import CTASection from '../components/CTASection.svelte';
  import FeedbackModal from '../components/FeedbackModal.svelte';
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
        launch: "Spustit akcelerátor",
        near: "Mapa v okolí"
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
        launch: "Launch accelerator",
        near: "Near you map"
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
      <a href="/near" class="nav-link">
        {content[language].nav.near}
      </a>
    </div>
    
    <!-- Language Selector & CTA -->
    <div class="nav-actions">
      <button 
        class="nav-cta"
        on:click={() => { window.location.href = '/app'; }}
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
  
  <!-- From Empathy to Action Section - Refined -->
  <section id="from-empathy-to-action" class="czech-section empathy-section">
    <div class="czech-container">
      <!-- POC Disclaimer - Top Left Corner Info Icon -->
      <div class="poc-disclaimer-corner">
        <div class="poc-info-badge" title="This is a POC (Proof of Concept) version of the platform – chci si ověřit koncept a dostat zpětnou vazbu, moc děkuji!">
          <span class="poc-info-icon">ℹ️</span>
          <div class="poc-tooltip">
            This is a POC (Proof of Concept) version of the platform – chci si ověřit koncept a dostat zpětnou vazbu, moc děkuji!
          </div>
        </div>
      </div>

      <h2 class="czech-heading-lg text-center mb-8">Od empatie k akci – česky a prakticky</h2>
      
      <!-- Compact Layout: Explanation and Tiles Side by Side -->
      <div class="empathy-content-wrapper">
        <!-- Left Column: Explanation -->
        <div class="empathy-explanation">
          <p class="czech-body-large mb-4">
            Tato platforma vznikla z poznání, že Češi nechtějí velká gesta a prázdné řeči. Chceme <strong>praktické kroky</strong>, které skutečně pomáhají.
          </p>
          <p class="czech-body mb-6">
            Každý den někdo potřebuje pomoc. Možná je to soused, který se stará o nemocného rodiče. Nebo místní organizace, která hledá dobrovolníky. Někdy stačí jen malá věc – ale jak najít tu správnou příležitost?
          </p>
        </div>
        
        <!-- Right Column: Three Enhanced Story Tiles -->
        <div class="empathy-tiles">
          <div class="story-approach-card">
            <div class="story-approach-header">
              <span class="story-approach-icon">🏠</span>
              <h3 class="story-approach-title">Soused pomáhá sousedovi</h3>
            </div>
            <p class="story-approach-text">Najděte způsoby, jak pomoci přímo ve svém okolí – od nákupů po hlídání dětí.</p>
          </div>
          
          <div class="story-approach-card">
            <div class="story-approach-header">
              <span class="story-approach-icon">✨</span>
              <h3 class="story-approach-title">Malé kroky, velký dopad</h3>
            </div>
            <p class="story-approach-text">Zjistěte, jak i malé činy mohou změnit život druhých a vytvořit lepší komunitu.</p>
          </div>
          
          <div class="story-approach-card">
            <div class="story-approach-header">
              <span class="story-approach-icon">💪</span>
              <h3 class="story-approach-title">Praktická solidarita</h3>
            </div>
            <p class="story-approach-text">Spojte síly s důvěryhodnými organizacemi ve vašem okolí.</p>
          </div>
        </div>
      </div>
      
      <!-- Quote Block - Moved Below Main Text, Above Stats -->
      <div class="quote-section">
        <div class="quote-block-subtle max-w-2xl mx-auto">
          <div class="quote-content">
            <span class="quote-icon">💭</span>
            <blockquote class="quote-text">
              "Když nemůžete pomoci všem, pomozte alespoň jednomu."
            </blockquote>
            <p class="quote-attribution">— Matka Tereza</p>
          </div>
        </div>
      </div>
      
      <!-- Stats Section with Clear Separation -->
      <div class="stats-section">
        <div class="stats-divider"></div>
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-icon">☀️</div>
            <div class="stat-number">12</div>
            <div class="stat-label">akcí tento týden</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">🤝</div>
            <div class="stat-number">234</div>
            <div class="stat-label">aktivních pomocníků</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">📍</div>
            <div class="stat-number">7</div>
            <div class="stat-label">regionů</div>
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
  
  /* Empathy Section Background */
  .empathy-section {
    background: linear-gradient(135deg, rgba(245, 248, 245, 0.6) 0%, rgba(237, 242, 237, 0.3) 100%);
    position: relative;
  }
  
  .empathy-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(212, 231, 212, 0.5) 50%, transparent 100%);
  }
  
  /* POC Disclaimer - Corner Badge Styles */
  .poc-disclaimer-corner {
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
    z-index: 10;
  }
  
  .poc-info-badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255, 243, 205, 0.9);
    border: 2px solid rgba(245, 158, 11, 0.4);
    border-radius: 50%;
    cursor: help;
    transition: all var(--timing-medium) var(--ease-gentle);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
  }
  
  .poc-info-badge:hover {
    background: rgba(255, 243, 205, 1);
    border-color: rgba(245, 158, 11, 0.6);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
  }
  
  .poc-info-icon {
    font-size: 1rem;
    line-height: 1;
  }
  
  .poc-tooltip {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 0.5rem;
    background: rgba(46, 46, 46, 0.95);
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    line-height: 1.4;
    white-space: nowrap;
    max-width: 280px;
    white-space: normal;
    opacity: 0;
    visibility: hidden;
    transition: all var(--timing-medium) var(--ease-gentle);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }
  
  .poc-tooltip::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-bottom-color: rgba(46, 46, 46, 0.95);
  }
  
  .poc-info-badge:hover .poc-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(2px);
  }
  
  /* Quote Section - Subtle Style Below Main Content */
  .quote-section {
    margin: 2rem auto 1.5rem;
    max-width: 4xl;
  }
  
  .quote-block-subtle {
    background: rgba(248, 250, 248, 0.6);
    border: 1px solid rgba(212, 231, 212, 0.4);
    border-radius: 12px;
    padding: 1.5rem 2rem;
    transition: all var(--timing-medium) var(--ease-gentle);
  }
  
  .quote-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
  }
  
  .quote-icon {
    font-size: 1.5rem;
    opacity: 0.7;
  }
  
  .quote-text {
    font-size: 1.1rem;
    font-style: italic;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.5;
  }
  
  .quote-attribution {
    font-size: 0.9rem;
    color: var(--czech-forest);
    font-weight: 500;
    margin: 0;
  }
  
  /* Compact Layout Styles */
  .empathy-content-wrapper {
    display: flex;
    gap: 3rem;
    align-items: flex-start;
    max-width: 6xl;
    margin: 0 auto 2rem;
  }
  
  .empathy-explanation {
    flex: 1;
    max-width: 450px;
    padding-right: 1rem;
  }
  
  .empathy-explanation .czech-body-large,
  .empathy-explanation .czech-body {
    text-align: left;
    margin-bottom: 1rem;
  }
  
  .empathy-tiles {
    flex: 1.5;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    max-width: 500px;
  }
  
  .story-approach-card {
    background: var(--bg-primary);
    border: 1px solid var(--subtle-border);
    border-radius: 16px;
    padding: 1.5rem;
    transition: all var(--timing-medium) var(--ease-gentle);
    box-shadow: 0 2px 8px rgba(46, 93, 49, 0.08);
    border-top: 3px solid transparent;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .story-approach-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(46, 93, 49, 0.15);
    border-top-color: var(--czech-forest-light);
    background: linear-gradient(135deg, var(--bg-primary) 0%, rgba(232, 242, 232, 0.3) 100%);
  }
  
  .story-approach-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .story-approach-icon {
    font-size: 2.2rem;
    flex-shrink: 0;
    line-height: 1;
  }
  
  .story-approach-title {
    font-family: Inter, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--czech-forest);
    margin: 0;
    line-height: 1.3;
  }
  
  .story-approach-text {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0;
    flex-grow: 1;
  }
  
  .stats-section {
    max-width: 4xl;
    margin: 0 auto;
  }
  
  .stats-divider {
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, var(--czech-forest-light) 0%, var(--copper-detail) 100%);
    margin: 0 auto 3rem;
    border-radius: 1px;
  }
  
  .stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    max-width: 3xl;
    margin: 0 auto;
    padding: 2.5rem;
    background: rgba(245, 241, 232, 0.4);
    border-radius: 20px;
    border: 1px solid rgba(212, 231, 212, 0.6);
  }
  
  .stat-item {
    text-align: center;
    padding: 1rem;
    transition: all var(--timing-medium) var(--ease-gentle);
  }
  
  .stat-item:hover {
    transform: translateY(-1px);
  }
  
  .stat-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    display: block;
  }
  
  .stat-number {
    font-family: Inter, sans-serif;
    font-size: 2.25rem;
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
    
    /* POC Disclaimer - Mobile */
    .poc-disclaimer-corner {
      top: 1rem;
      left: 1rem;
    }
    
    .poc-info-badge {
      width: 28px;
      height: 28px;
    }
    
    .poc-info-icon {
      font-size: 0.9rem;
    }
    
    .poc-tooltip {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      margin-top: 0;
      max-width: 280px;
      width: 90vw;
      z-index: 1001;
    }
    
    .poc-tooltip::before {
      display: none;
    }
    
    /* From Empathy to Action - Mobile */
    .quote-section {
      margin: 1.5rem auto 1rem;
    }
    
    .quote-block-subtle {
      padding: 1.25rem 1.5rem;
      margin: 0 1rem;
    }
    
    .quote-text {
      font-size: 1rem;
    }
    
    .quote-attribution {
      font-size: 0.85rem;
    }
    
    /* Mobile: Stack layout vertically */
    .empathy-content-wrapper {
      flex-direction: column;
      gap: 1.5rem;
      margin: 0 auto 1.5rem;
    }
    
    .empathy-explanation {
      max-width: none;
      padding-right: 0;
      text-align: center;
    }
    
    .empathy-explanation .czech-body-large,
    .empathy-explanation .czech-body {
      text-align: center;
      margin-bottom: 1rem;
    }
    
    .empathy-tiles {
      max-width: none;
    }
    
    .story-approach-card {
      padding: 1.25rem;
      height: auto;
    }
    
    .story-approach-header {
      flex-direction: row;
      text-align: left;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .story-approach-icon {
      font-size: 2rem;
    }
    
    .story-approach-title {
      font-size: 1.1rem;
    }
    
    .story-approach-text {
      text-align: left;
      flex-grow: 0;
      font-size: 0.9rem;
    }
    
    .stats-container {
      grid-template-columns: 1fr;
      gap: 1.5rem;
      padding: 2rem 1.5rem;
    }
    
    .stat-number {
      font-size: 2rem;
    }
  }
</style> 