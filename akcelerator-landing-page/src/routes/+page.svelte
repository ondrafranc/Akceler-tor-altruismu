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
  
  <!-- From Empathy to Action Section - Refined -->
  <section id="from-empathy-to-action" class="czech-section">
    <div class="czech-container">
      <h2 class="czech-heading-lg text-center mb-16">Od empatie k akci – česky a prakticky</h2>
      
      <!-- Quote with Icon -->
      <div class="text-center mb-16">
        <div class="quote-block max-w-2xl mx-auto">
          <div class="flex items-center justify-center gap-4 mb-6">
            <span class="text-3xl">❤️</span>
            <blockquote class="czech-body-large italic">
              "Když nemůžete pomoci všem, pomozte alespoň jednomu."
            </blockquote>
          </div>
          <p class="text-right czech-body font-medium text-green-700">— Matka Tereza</p>
        </div>
      </div>
      
      <!-- Explanation Paragraph -->
      <div class="max-w-3xl mx-auto text-center mb-20">
        <p class="czech-body-large mb-6">
          Tato platforma vznikla z poznání, že Češi nechtějí velká gesta a prázdné řeči. Chceme <strong>praktické kroky</strong>, které skutečně pomáhají.
        </p>
        <p class="czech-body">
          Každý den slyšíme něco potřebuje pomoc. Možná je to soused, který se stará o nemocného rodiče. Nebo místní organizace, která hledá dobrovolníky. Někdy stačí jen malá věc – ale jak najít tu správnou příležitost?
        </p>
      </div>
      
      <!-- Three Enhanced Story Boxes -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-24">
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
      
      <!-- Stats Section with Clear Separation -->
      <div class="stats-section">
        <div class="stats-divider"></div>
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-icon">☀️</div>
            <div class="stat-number">7</div>
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
  
  /* From Empathy to Action Section Styles */
  .quote-block {
    background: var(--bg-accent);
    border-left: 4px solid var(--czech-forest-light);
    padding: 2rem 2.5rem;
    border-radius: 12px;
    transition: all var(--timing-medium) var(--ease-gentle);
  }
  
  .story-approach-card {
    background: var(--bg-primary);
    border: 1px solid var(--subtle-border);
    border-radius: 16px;
    padding: 2rem;
    transition: all var(--timing-medium) var(--ease-gentle);
    box-shadow: 0 2px 8px rgba(46, 93, 49, 0.08);
    border-top: 3px solid transparent;
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
    margin-bottom: 1.25rem;
  }
  
  .story-approach-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
    line-height: 1;
  }
  
  .story-approach-title {
    font-family: Inter, sans-serif;
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--czech-forest);
    margin: 0;
    line-height: 1.3;
  }
  
  .story-approach-text {
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0;
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
    
    /* From Empathy to Action - Mobile */
    .quote-block {
      padding: 1.5rem 2rem;
    }
    
    .story-approach-card {
      padding: 1.5rem;
    }
    
    .story-approach-header {
      flex-direction: column;
      text-align: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    
    .story-approach-title {
      font-size: 1.2rem;
    }
    
    .story-approach-text {
      text-align: center;
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