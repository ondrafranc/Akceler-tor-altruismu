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
  
  <!-- From Empathy to Action Section - Redesigned -->
  <section id="story" class="story-section czech-section">
    <div class="czech-container">
      <h2 class="czech-heading-lg text-center mb-12">
        {language === 'czech' 
          ? 'Od empatie k akci – česky a prakticky' 
          : 'From empathy to action – Czech and practical'}
      </h2>
      
      <!-- Two Column Layout: Philosophy & Action Boxes -->
      <div class="story-content-grid">
        <!-- Left Column: Philosophy & Quote -->
        <div class="philosophy-column">
          {#if language === 'czech'}
            <!-- Enhanced Mother Teresa Quote -->
            <div class="philosophy-quote">
              <div class="quote-decoration">💝</div>
              <blockquote class="quote-text">
                "Když nemůžete pomoci všem, pomozte alespoň jednomu."
              </blockquote>
              <cite class="quote-author">— Matka Tereza</cite>
            </div>
            
            <div class="philosophy-text">
              <p class="czech-body-large mb-6">
                Tato platforma vznikla z poznání, že Češi nechtějí velká gesta a prázdné řeči. 
                Chceme <strong>praktické kroky</strong>, které skutečně pomáhají.
              </p>
              
              <p class="czech-body">
                Každý den kolem nás někdo potřebuje pomoc. Možná je to soused, který se stará o nemocného rodiče. 
                Nebo místní organizace, která hledá dobrovolníky. Někdy stačí jen malá věc – 
                ale jak najít tu správnou příležitost?
              </p>
            </div>
          {:else}
            <!-- English version -->
            <div class="philosophy-quote">
              <div class="quote-decoration">💝</div>
              <blockquote class="quote-text">
                "If you can't help everyone, help at least one."
              </blockquote>
              <cite class="quote-author">— Mother Teresa</cite>
            </div>
            
            <div class="philosophy-text">
              <p class="czech-body-large mb-6">
                This platform was born from the understanding that Czechs don't want grand gestures and empty speeches. 
                We want <strong>practical steps</strong> that truly help.
              </p>
              
              <p class="czech-body">
                Every day someone around us needs help. Maybe it's a neighbor caring for a sick parent. 
                Or a local organization looking for volunteers. Sometimes just a small thing is enough – 
                but how do you find the right opportunity?
              </p>
            </div>
          {/if}
        </div>

        <!-- Right Column: Action Boxes -->
        <div class="action-boxes-column">
          <div class="action-box">
            <div class="action-icon">🏠</div>
            <h4 class="action-title">
              {language === 'czech' ? 'Soused pomáhá sousedovi' : 'Neighbor helps neighbor'}
            </h4>
            <button class="action-cta" on:click={() => scrollToSection('solidarity-garden')}>
              {language === 'czech' ? 'Zobrazit příběhy' : 'View stories'}
            </button>
          </div>
          
          <div class="action-box">
            <div class="action-icon">✨</div>
            <h4 class="action-title">
              {language === 'czech' ? 'Malé kroky, velký dopad' : 'Small steps, big impact'}
            </h4>
            <button class="action-cta" on:click={() => scrollToSection('solidarity-garden')}>
              {language === 'czech' ? 'Začít hned' : 'Start now'}
            </button>
          </div>
          
          <div class="action-box">
            <div class="action-icon">💪</div>
            <h4 class="action-title">
              {language === 'czech' ? 'Praktická solidarita' : 'Practical solidarity'}
            </h4>
            <button class="action-cta" on:click={() => scrollToSection('solidarity-garden')}>
              {language === 'czech' ? 'Připojit se' : 'Join now'}
            </button>
          </div>
        </div>
      </div>

      <!-- Horizontal Timeline Steps -->
      <div class="timeline-section">
        <h3 class="czech-heading-md text-center mb-10">
          {language === 'czech' ? 'Jak to funguje:' : 'How it works:'}
        </h3>
        
        <div class="timeline-container">
          <div class="timeline-step" data-step="1">
            <div class="timeline-number">1</div>
            <div class="timeline-icon">👤</div>
            <h4 class="timeline-title">
              {language === 'czech' ? 'Řekněte nám o sobě' : 'Tell us about yourself'}
            </h4>
            <p class="timeline-description">
              {language === 'czech' 
                ? 'Stačí pár otázek o tom, co vás zajímá a kolik času máte.' 
                : 'Just a few questions about what interests you and how much time you have.'}
            </p>
          </div>
          
          <div class="timeline-arrow">
            <svg width="50" height="20" viewBox="0 0 50 20" fill="none">
              <path d="M5 10H40M40 10L35 5M40 10L35 15" stroke="var(--copper-detail)" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          
          <div class="timeline-step" data-step="2">
            <div class="timeline-number">2</div>
            <div class="timeline-icon">🎯</div>
            <h4 class="timeline-title">
              {language === 'czech' ? 'Najděte příležitost' : 'Find a meaningful opportunity'}
            </h4>
            <p class="timeline-description">
              {language === 'czech' 
                ? 'Dostanete osobní doporučení akcí, které sedí k vašemu životu.' 
                : 'Get personalized recommendations for actions that fit your life.'}
            </p>
          </div>
          
          <div class="timeline-arrow">
            <svg width="50" height="20" viewBox="0 0 50 20" fill="none">
              <path d="M5 10H40M40 10L35 5M40 10L35 15" stroke="var(--copper-detail)" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          
          <div class="timeline-step" data-step="3">
            <div class="timeline-number">3</div>
            <div class="timeline-icon">🚀</div>
            <h4 class="timeline-title">
              {language === 'czech' ? 'Začněte pomáhat' : 'Start helping'}
            </h4>
            <p class="timeline-description">
              {language === 'czech' 
                ? 'Spojíme vás s důvěryhodnými organizacemi ve vašem okolí.' 
                : 'We connect you with trusted organizations in your area.'}
            </p>
          </div>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="story-stats">
        <div class="stat-item">
          <div class="stat-icon">🌟</div>
          <div class="stat-number">247</div>
          <div class="stat-label">
            {language === 'czech' ? 'akcí tento týden' : 'actions this week'}
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">🤝</div>
          <div class="stat-number">1,834</div>
          <div class="stat-label">
            {language === 'czech' ? 'aktivních pomocníků' : 'active helpers'}
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">📍</div>
          <div class="stat-number">12</div>
          <div class="stat-label">
            {language === 'czech' ? 'regionů' : 'regions'}
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
  
  /* Story Section - Redesigned */
  .story-section {
    padding: 6rem 0;
    background: linear-gradient(135deg, #fafcfa 0%, #f0f6f0 100%);
  }
  
  /* Two Column Layout */
  .story-content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6rem;
    align-items: start;
    margin-bottom: 6rem;
  }
  
  /* Left Column - Philosophy */
  .philosophy-column {
    padding-right: 2rem;
  }
  
  .philosophy-quote {
    background: linear-gradient(135deg, rgba(46, 93, 49, 0.08) 0%, rgba(176, 141, 87, 0.08) 100%);
    border-left: 4px solid var(--czech-forest);
    border-radius: 0 16px 16px 0;
    padding: 2.5rem 3rem;
    margin-bottom: 3rem;
    position: relative;
    box-shadow: 0 6px 20px rgba(46, 93, 49, 0.12);
    backdrop-filter: blur(8px);
  }
  
  .philosophy-quote::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--czech-forest), var(--copper-detail));
  }
  
  .quote-decoration {
    font-size: 1.5rem;
    color: var(--copper-detail);
    display: block;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .quote-text {
    font-size: 1.25rem;
    font-style: italic;
    color: var(--czech-forest);
    line-height: 1.6;
    margin: 0 0 1.5rem 0;
    font-weight: 400;
    text-align: center;
  }
  
  .quote-author {
    display: block;
    text-align: center;
    font-size: 1rem;
    color: var(--text-secondary);
    font-weight: 600;
    font-style: normal;
  }
  
  .philosophy-text {
    line-height: 1.7;
  }
  
  .philosophy-text p {
    margin-bottom: 1.5rem;
  }
  
  /* Right Column - Action Boxes */
  .action-boxes-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-left: 2rem;
  }
  
  .action-box {
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid var(--subtle-border);
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(46, 93, 49, 0.08);
  }
  
  .action-box::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--copper-detail), var(--czech-forest-light));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .action-box:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 12px 28px rgba(46, 93, 49, 0.2);
    background: rgba(255, 255, 255, 0.95);
  }
  
  .action-box:hover::before {
    opacity: 1;
  }
  
  .action-box:hover .action-icon {
    animation: glow 0.6s ease-in-out;
  }
  
  @keyframes glow {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); filter: drop-shadow(0 0 8px rgba(46, 93, 49, 0.4)); }
  }
  
  .action-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    display: block;
    transition: all 0.3s ease;
  }
  
  .action-title {
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--czech-forest);
    margin-bottom: 1.5rem;
    line-height: 1.3;
  }
  
  .action-cta {
    background: var(--copper-detail);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .action-cta:hover {
    background: var(--czech-forest);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 93, 49, 0.3);
  }
  
  /* Horizontal Timeline Section */
  .timeline-section {
    margin: 5rem 0;
    padding: 4rem 0;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 24px;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 24px rgba(46, 93, 49, 0.1);
  }
  
  .timeline-container {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 2rem;
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 2rem;
  }
  
  .timeline-step {
    flex: 1;
    text-align: center;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 16px;
    padding: 2.5rem 1.5rem;
    border: 1px solid var(--subtle-border);
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;
    min-height: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }
  
  .timeline-step::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--czech-forest), var(--copper-detail));
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  
  .timeline-step:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 32px rgba(46, 93, 49, 0.2);
    background: rgba(255, 255, 255, 0.95);
  }
  
  .timeline-step:hover::before {
    opacity: 1;
  }
  
  .timeline-step:hover .timeline-number {
    background: linear-gradient(135deg, var(--copper-detail), var(--czech-forest));
    transform: scale(1.1);
  }
  
  .timeline-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, var(--czech-forest), var(--czech-forest-light));
    color: white;
    border-radius: 50%;
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 1rem;
    box-shadow: 0 6px 16px rgba(46, 93, 49, 0.3);
    transition: all 0.4s ease;
  }
  
  .timeline-icon {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    opacity: 0.8;
  }
  
  .timeline-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--czech-forest);
    margin-bottom: 1rem;
    line-height: 1.3;
  }
  
  .timeline-description {
    font-size: 0.95rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
    flex-grow: 1;
  }
  
  .timeline-arrow {
    display: flex;
    align-items: center;
    margin-top: 140px; /* Center with the timeline steps */
  }
  
  .timeline-arrow svg {
    opacity: 0.7;
    transition: all 0.3s ease;
  }
  
  .timeline-arrow:hover svg {
    opacity: 1;
    transform: translateX(4px);
  }
  
  /* Scroll Animation for Timeline */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .timeline-step {
    animation: fadeInUp 0.6s ease-out;
  }
  
  .timeline-step[data-step="1"] {
    animation-delay: 0.1s;
  }
  
  .timeline-step[data-step="2"] {
    animation-delay: 0.2s;
  }
  
  .timeline-step[data-step="3"] {
    animation-delay: 0.3s;
  }
  
  /* Stats Section - Enhanced */
  .story-stats {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin: 4rem 0 0 0;
    padding: 3rem 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    backdrop-filter: blur(10px);
  }
  
  .stat-item {
    text-align: center;
    padding: 2rem 1.5rem;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 16px;
    border: 1px solid var(--subtle-border);
    transition: all 0.4s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    min-width: 160px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(46, 93, 49, 0.08);
  }
  
  .stat-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--czech-forest), var(--copper-detail));
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  
  .stat-item:hover {
    transform: translateY(-8px) scale(1.05);
    box-shadow: 0 16px 32px rgba(46, 93, 49, 0.2);
    background: rgba(255, 255, 255, 0.95);
  }
  
  .stat-item:hover::before {
    opacity: 1;
  }
  
  .stat-item:hover .stat-icon {
    transform: scale(1.2);
    filter: drop-shadow(0 4px 8px rgba(46, 93, 49, 0.3));
  }
  
  .stat-icon {
    font-size: 2.5rem;
    transition: all 0.4s ease;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
  
  .stat-number {
    font-size: 3rem;
    font-weight: 700;
    color: var(--czech-forest);
    line-height: 1;
    text-shadow: 0 2px 4px rgba(46, 93, 49, 0.1);
  }
  
  .stat-label {
    font-size: 0.95rem;
    color: var(--text-secondary);
    font-weight: 500;
    line-height: 1.3;
    text-align: center;
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
    
    .story-content-grid {
      grid-template-columns: 1fr;
      gap: 3rem;
      margin-bottom: 4rem;
    }
    
    .philosophy-column {
      padding-right: 0;
      order: 1;
    }
    
    .action-boxes-column {
      padding-left: 0;
      order: 2;
      gap: 1rem;
    }
    
    .philosophy-quote {
      padding: 2rem 1.5rem;
      margin-bottom: 2rem;
      border-radius: 0 12px 12px 0;
    }
    
    .quote-text {
      font-size: 1.1rem;
      line-height: 1.5;
    }
    
    .quote-decoration {
      font-size: 1.3rem;
    }
    
    .action-box {
      padding: 1.5rem;
    }
    
    .action-icon {
      font-size: 2rem;
    }
    
    .action-title {
      font-size: 1rem;
    }
    
    .action-cta {
      padding: 0.65rem 1.25rem;
      font-size: 0.85rem;
    }
    
    .timeline-section {
      margin: 3rem 0;
      padding: 2.5rem 1rem;
    }
    
    .timeline-container {
      flex-direction: column;
      gap: 2rem;
      align-items: stretch;
    }
    
    .timeline-step {
      min-height: auto;
      padding: 2rem 1.5rem;
    }
    
    .timeline-number {
      width: 60px;
      height: 60px;
      font-size: 1.5rem;
    }
    
    .timeline-icon {
      font-size: 1.8rem;
    }
    
    .timeline-title {
      font-size: 1.1rem;
    }
    
    .timeline-description {
      font-size: 0.9rem;
    }
    
    .timeline-arrow {
      margin-top: 0;
      justify-content: center;
      transform: rotate(90deg);
    }
    
    .timeline-arrow svg {
      width: 20px;
      height: 40px;
    }
    
    .story-stats {
      flex-direction: column;
      gap: 1.5rem;
      align-items: center;
      margin-top: 3rem;
      padding: 2rem 1rem;
    }
    
    .stat-item {
      padding: 1.5rem;
      width: 100%;
      max-width: 280px;
      min-width: auto;
    }
    
    .stat-number {
      font-size: 2.5rem;
    }
    
    .stat-icon {
      font-size: 2rem;
    }
  }
  
  /* Tablet optimizations */
  @media (max-width: 1024px) and (min-width: 769px) {
    .story-content-grid {
      gap: 4rem;
      margin-bottom: 5rem;
    }
    
    .philosophy-column {
      padding-right: 1rem;
    }
    
    .action-boxes-column {
      padding-left: 1rem;
    }
    
    .philosophy-quote {
      padding: 2rem 2.5rem;
    }
    
    .timeline-section {
      padding: 3rem 1.5rem;
    }
    
    .timeline-container {
      gap: 1.5rem;
    }
    
    .timeline-step {
      padding: 2rem 1.25rem;
    }
    
    .story-stats {
      gap: 2.5rem;
      padding: 2.5rem 1rem;
    }
  }
</style> 