<script>
  import { onMount } from 'svelte';
  import { currentLanguage } from '../lib/stores.js';
  import Hero from '../components/Hero.svelte';
  import SolidarityGarden from '../components/SolidarityGarden.svelte';
  import CzechMap from '../components/CzechMap.svelte';
  import ImmediateHelp from '../components/ImmediateHelp.svelte';
  import CTASection from '../components/CTASection.svelte';
  import FeedbackModal from '../components/FeedbackModal.svelte';
  import { launchStreamlitApp } from '../lib/streamlit-integration.js';
  import { initScrollAnimations } from '../lib/animations.js';
  
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
  
  function switchLanguage(newLang) {
    currentLanguage.set(newLang);
    
    // Update URL without reload (only on client)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('lang', newLang);
      window.history.replaceState({}, '', url);
    }
  }
  
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
      <div class="language-selector">
        <button 
          class="lang-button {language === 'czech' ? 'active' : ''}"
          on:click={() => switchLanguage('czech')}
          aria-label="Česky"
        >
          🇨🇿
        </button>
        <button 
          class="lang-button {language === 'english' ? 'active' : ''}"
          on:click={() => switchLanguage('english')}
          aria-label="English"
        >
          🇺🇸
        </button>
      </div>
      
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
<div class="landing-page">
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
  
  <!-- Footer -->
  <footer class="czech-footer">
    <div class="czech-container">
      <div class="footer-content">
        <div class="footer-main">
          <div class="footer-logo">
            <div class="logo-icon">🤝</div>
            <span class="logo-text">Akcelerátor altruismu</span>
          </div>
          <p class="footer-description">
            {language === 'czech' 
              ? 'Praktická cesta od empatie k akci. Pomáháme tisícům Čechů najít svou cestu k smysluplné pomoci.'
              : 'Practical path from empathy to action. Helping thousands of Czechs find their way to meaningful help.'}
          </p>
        </div>
        
        <div class="footer-links">
          <div class="footer-section">
            <h4 class="footer-title">
              {language === 'czech' ? 'Platforma' : 'Platform'}
            </h4>
            <ul class="footer-list">
              <li><a href="#how-it-works">{language === 'czech' ? 'Jak to funguje' : 'How it works'}</a></li>
              <li><a href="#privacy">{language === 'czech' ? 'Soukromí' : 'Privacy'}</a></li>
              <li><a href="#about">{language === 'czech' ? 'O projektu' : 'About'}</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h4 class="footer-title">
              {language === 'czech' ? 'Pomoc' : 'Help'}
            </h4>
            <ul class="footer-list">
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#contact">{language === 'czech' ? 'Kontakt' : 'Contact'}</a></li>
              <li><a href="#support">{language === 'czech' ? 'Podpora' : 'Support'}</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h4 class="footer-title">
              {language === 'czech' ? 'Partneři' : 'Partners'}
            </h4>
            <ul class="footer-list">
              <li><a href="https://charita.cz" target="_blank" rel="noopener">Charita ČR</a></li>
              <li><a href="https://dobrovolnik.cz" target="_blank" rel="noopener">Dobrovolník.cz</a></li>
              <li><a href="https://adra.cz" target="_blank" rel="noopener">ADRA</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p class="footer-copyright">
          © 2024 Akcelerátor altruismu. 
          {language === 'czech' 
            ? 'Vytvořeno s láskou pro českou komunitu.'
            : 'Made with love for the Czech community.'}
        </p>
        <div class="footer-meta">
          <a href="#privacy">{language === 'czech' ? 'Ochrana soukromí' : 'Privacy Policy'}</a>
          <span class="divider">•</span>
          <a href="#terms">{language === 'czech' ? 'Podmínky' : 'Terms'}</a>
        </div>
      </div>
    </div>
  </footer>
</div>

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
  
  .language-selector {
    display: flex;
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 2px;
    border: 1px solid var(--subtle-border);
  }
  
  .lang-button {
    background: transparent;
    border: none;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: all var(--timing-medium) var(--ease-gentle);
  }
  
  .lang-button.active {
    background: var(--czech-forest);
    transform: scale(1.1);
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
  

  
  /* Footer Styles */
  .czech-footer {
    background: var(--czech-forest-dark);
    color: var(--warm-stone);
    padding: 3rem 0 1rem;
    margin-top: 4rem;
  }
  
  .footer-content {
    display: grid;
    grid-template-columns: 2fr 3fr;
    gap: 3rem;
    margin-bottom: 2rem;
  }
  
  .footer-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    font-weight: 600;
    font-size: 1.2rem;
  }
  
  .footer-description {
    color: rgba(245, 241, 232, 0.8);
    line-height: 1.6;
    max-width: 400px;
  }
  
  .footer-links {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
  
  .footer-title {
    color: var(--warm-stone);
    font-weight: 600;
    margin-bottom: 1rem;
    font-size: 1rem;
  }
  
  .footer-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .footer-list li {
    margin-bottom: 0.5rem;
  }
  
  .footer-list a {
    color: rgba(245, 241, 232, 0.7);
    text-decoration: none;
    transition: color var(--timing-medium) var(--ease-gentle);
  }
  
  .footer-list a:hover {
    color: var(--warm-stone);
  }
  
  .footer-bottom {
    border-top: 1px solid rgba(245, 241, 232, 0.2);
    padding-top: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
  }
  
  .footer-copyright {
    color: rgba(245, 241, 232, 0.6);
    margin: 0;
  }
  
  .footer-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: rgba(245, 241, 232, 0.6);
  }
  
  .footer-meta a {
    color: rgba(245, 241, 232, 0.7);
    text-decoration: none;
  }
  
  .footer-meta a:hover {
    color: var(--warm-stone);
  }
  
  .divider {
    opacity: 0.5;
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
    
    .footer-content {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    
    .footer-links {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    
    .footer-bottom {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
  }
</style> 