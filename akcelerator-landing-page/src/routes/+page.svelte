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
  
  <!-- From Empathy to Action Section - Simplified -->
  <section id="from-empathy-to-action" class="czech-section">
    <div class="czech-container">
      <h2 class="czech-heading-lg text-center mb-12">Od empatie k akci – česky a prakticky</h2>
      
      <!-- Quote with Icon -->
      <div class="text-center mb-12">
        <div class="quiet-celebration max-w-2xl mx-auto">
          <div class="flex items-center justify-center gap-4 mb-4">
            <span class="text-3xl">❤️</span>
            <blockquote class="czech-body-large italic">
              "Když nemůžete pomoci všem, pomozte alespoň jednomu."
            </blockquote>
          </div>
          <p class="text-right czech-body font-medium">— Matka Tereza</p>
        </div>
      </div>
      
      <!-- Explanation Paragraph -->
      <div class="max-w-3xl mx-auto text-center mb-16">
        <p class="czech-body-large mb-6">
          Tato platforma vznikla z poznání, že Češi nechtějí velká gesta a prázdné řeči. Chceme <strong>praktické kroky</strong>, které skutečně pomáhají.
        </p>
        <p class="czech-body">
          Každý den slyšíme něco potřebuje pomoc. Možná je to soused, který se stará o nemocného rodiče. Nebo místní organizace, která hledá dobrovolníky. Někdy stačí jen malá věc – ale jak najít tu správnou příležitost?
        </p>
      </div>
      
      <!-- Three Stylized Boxes -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
        <div class="solidarity-card text-center">
          <div class="text-4xl mb-4">🏠</div>
          <h3 class="czech-heading-md mb-3">Soused pomáhá sousedovi</h3>
          <p class="czech-body">Najděte způsoby, jak pomoci přímo ve svém okolí – od nákupů po hlídání dětí.</p>
        </div>
        
        <div class="solidarity-card text-center">
          <div class="text-4xl mb-4">✨</div>
          <h3 class="czech-heading-md mb-3">Malé kroky, velký dopad</h3>
          <p class="czech-body">Zjistěte, jak i malé činy mohou změnit život druhých a vytvořit lepší komunitu.</p>
        </div>
        
        <div class="solidarity-card text-center">
          <div class="text-4xl mb-4">💪</div>
          <h3 class="czech-heading-md mb-3">Praktická solidarita</h3>
          <p class="czech-body">Spojte síly s důvěryhodnými organizacemi ve vašem okolí.</p>
        </div>
      </div>
      
      <!-- Simple Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div class="text-center">
          <div class="text-3xl mb-2">☀️</div>
          <div class="czech-heading-lg text-center">247</div>
          <div class="czech-body">akcí tento týden</div>
        </div>
        
        <div class="text-center">
          <div class="text-3xl mb-2">🤝</div>
          <div class="czech-heading-lg text-center">1,834</div>
          <div class="czech-body">aktivních pomocníků</div>
        </div>
        
        <div class="text-center">
          <div class="text-3xl mb-2">📍</div>
          <div class="czech-heading-lg text-center">12</div>
          <div class="czech-body">regionů</div>
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
  }
</style> 