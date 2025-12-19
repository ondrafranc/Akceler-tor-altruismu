<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { trackEvent } from '../lib/analytics.js';
  
  gsap.registerPlugin(ScrollTrigger);
  
  let ctaContainer;
  let currentLanguage = 'czech';
  
  const content = {
    czech: {
      title: "Začni svou cestu k smysluplné pomoci",
      subtitle: "Připoj se k tisícům Čechů, kteří už pomáhají",
      description: "Stačí 5 minut, abys našel/našla svou první akci. Každý krok počítá.",
      primaryCTA: "Spustit akcelerátor",
      secondaryCTA: "Rychlá akce za 2 minuty",
      guarantee: "100% transparentní organizace",
      privacy: "Žádný spam, jen smysluplná pomoc"
    },
    english: {
      title: "Start your journey to meaningful help",
      subtitle: "Join thousands of Czechs who are already helping",
      description: "Just 5 minutes to find your first action. Every step counts.",
      primaryCTA: "Launch accelerator",
      secondaryCTA: "Quick 2-minute action",
      guarantee: "100% transparent organizations",
      privacy: "No spam, just meaningful help"
    }
  };
  
  function launchMainApp() {
    trackEvent('aa_launch', { from: 'cta_section_primary' });
    window.location.href = '/app';
  }
  
  function launchQuickAction() {
    trackEvent('aa_launch', { from: 'cta_section_quick' });
    window.location.href = '/app/online';
  }
  
  onMount(() => {
    // Animate container
    gsap.fromTo(ctaContainer,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ctaContainer,
          start: "top 70%",
          toggleActions: "play none none reverse"
        }
      }
    );
    
    // Floating elements animation
    gsap.to('.floating-element', {
      y: -10,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.2
    });
  });
</script>

<section bind:this={ctaContainer} id="final-cta" class="cta-section">
  <div class="czech-container">
    <!-- Background Elements -->
    <div class="background-elements">
      <div class="floating-element element-1">🌱</div>
      <div class="floating-element element-2">🤝</div>
      <div class="floating-element element-3">💚</div>
      <div class="floating-element element-4">🌍</div>
    </div>
    
    <!-- Main CTA Content -->
    <div class="cta-content">
      <div class="cta-header">
        <h2 class="czech-heading-lg mb-4">
          {content[currentLanguage].title}
        </h2>
        <p class="czech-body-large mb-6 max-w-2xl mx-auto">
          {content[currentLanguage].subtitle}
        </p>
        <p class="czech-body mb-8 max-w-xl mx-auto opacity-80">
          {content[currentLanguage].description}
        </p>
      </div>
      
      <!-- CTA Buttons -->
      <div class="cta-buttons">
        <button class="czech-button-primary cta-primary" on:click={launchMainApp}>
          <span>{content[currentLanguage].primaryCTA}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        
        <button class="czech-button-secondary cta-secondary" on:click={launchQuickAction}>
          {content[currentLanguage].secondaryCTA}
        </button>
      </div>
      
      <!-- Trust indicators -->
      <div class="trust-indicators">
        <div class="guarantee">
          <span class="guarantee-icon">✓</span>
          {content[currentLanguage].guarantee}
        </div>
        <div class="privacy">
          <span class="privacy-icon">🔒</span>
          {content[currentLanguage].privacy}
        </div>
      </div>
      
      <!-- Simple divider line -->
      <div class="section-divider"></div>
    </div>
    
    <!-- Final Encouragement -->
    <div class="final-message">
      <div class="message-content">
        <p class="czech-body italic">
          {currentLanguage === 'czech'
            ? "Teď zrovna stojíš. Někdo jiný leží. To je všechno, co je třeba vědět."
            : "Right now, you're standing. Someone else is not. That's all you need to know."}
        </p>
        
        <div class="hearts">💚 💚 💚</div>
      </div>
    </div>
  </div>
</section>

<style>
  .cta-section {
    background: linear-gradient(135deg, var(--czech-forest-dark) 0%, var(--czech-forest) 100%);
    color: var(--warm-stone);
    padding: 5rem 0;
    position: relative;
    overflow: hidden;
  }
  
  .background-elements {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0.1;
  }
  
  .floating-element {
    position: absolute;
    font-size: 3rem;
  }
  
  .element-1 {
    top: 20%;
    left: 10%;
  }
  
  .element-2 {
    top: 30%;
    right: 15%;
  }
  
  .element-3 {
    bottom: 30%;
    left: 20%;
  }
  
  .element-4 {
    bottom: 20%;
    right: 10%;
  }
  
  .cta-content {
    text-align: center;
    position: relative;
    z-index: 2;
  }
  
  .cta-header h2 {
    color: var(--warm-stone);
  }
  
  .cta-buttons {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    align-items: center;
    margin-bottom: 3rem;
    flex-wrap: wrap;
  }
  
  .cta-primary {
    font-size: 1.2rem;
    padding: 1rem 2rem;
    background: var(--copper-detail);
    box-shadow: 0 4px 20px rgba(176, 141, 87, 0.3);
  }
  
  .cta-primary:hover {
    background: var(--copper-light);
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(176, 141, 87, 0.4);
  }
  
  .cta-secondary {
    border-color: var(--warm-stone);
    color: var(--warm-stone);
  }
  
  .cta-secondary:hover {
    background: var(--warm-stone);
    color: var(--czech-forest);
  }
  
  .trust-indicators {
    display: flex;
    gap: 2rem;
    justify-content: center;
    align-items: center;
    margin-bottom: 3rem;
    flex-wrap: wrap;
  }
  
  .guarantee,
  .privacy {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    opacity: 0.95;
    color: var(--warm-stone);
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .guarantee-icon,
  .privacy-icon {
    color: var(--copper-detail);
    font-weight: bold;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
  
  .section-divider {
    height: 1px;
    background-color: rgba(245, 241, 232, 0.3);
    margin: 3rem 0;
  }
  
  .final-message {
    text-align: center;
  }
  
  .message-content {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    background: rgba(245, 241, 232, 0.15);
    border-radius: 12px;
    border: 1px solid rgba(245, 241, 232, 0.3);
    backdrop-filter: blur(8px);
  }
  
  .message-content p {
    color: var(--warm-stone);
    font-size: 1.1rem;
    line-height: 1.6;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .hearts {
    font-size: 1.5rem;
    margin-top: 1rem;
    opacity: 0.9;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    .cta-section {
      padding: 3rem 0;
    }
    
    .cta-buttons {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .cta-primary,
    .cta-secondary {
      width: 100%;
      max-width: 300px;
      margin: 0 auto;
    }
    
    .trust-indicators {
      flex-direction: column;
      gap: 1rem;
    }
    
    .floating-element {
      font-size: 2rem;
    }
    
    .message-content {
      padding: 1.5rem;
    }
  }
  
  /* Tablet adjustments */
  @media (max-width: 1024px) and (min-width: 769px) {
    .floating-element {
      font-size: 2rem;
    }
  }
</style> 