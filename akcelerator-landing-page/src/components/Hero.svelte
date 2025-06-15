<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { scrollToSection } from '../lib/animations.js';

  import { currentLanguage } from '../lib/stores.js';
  
  let heroContainer;
  let parallaxForest;
  let mainHeading;
  let subHeading;
  let ctaButtons;
  let particleContainer;
  
  let language = 'czech';
  
  // Subscribe to language changes
  currentLanguage.subscribe(value => {
    language = value;
  });
  
  const content = {
    czech: {
      heading: "Pomoc začíná u vás.",
      subheading: "Najděte malý krok, který má význam.",
      description: "Společně měníme svět – soused po sousedovi",
      ctaPrimary: "Najít moji cestu",
      ctaSecondary: "Příběhy inspirace",
      scrollText: "Objevte vaše možnosti"
    },
    english: {
      heading: "Help starts with you.",
      subheading: "Find a small step that matters.",
      description: "Together we make change – neighbor by neighbor",
      ctaPrimary: "Find my path",
      ctaSecondary: "Stories of inspiration",
      scrollText: "Discover your possibilities"
    }
  };
  
  function handleLanguageChange(event) {
    // Animate text change when language switches
    if (typeof window !== 'undefined' && gsap && mainHeading) {
      gsap.to(mainHeading, { 
        opacity: 0, 
        duration: 0.3, 
        ease: "power2.out",
        onComplete: () => {
          gsap.to(mainHeading, { opacity: 1, duration: 0.3 });
        }
      });
    }
  }
  
  function launchAccelerator() {
    // Smooth transition to Streamlit app
    const url = language === 'czech' ? 
      'https://akcelerator-altruismu.streamlit.app?lang=czech' : 
      'https://akcelerator-altruismu.streamlit.app?lang=english';
    
    // Add loading state animation (only on client)
    if (typeof window !== 'undefined' && gsap && ctaButtons) {
      gsap.to(ctaButtons, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          window.open(url, '_blank');
        }
      });
    } else if (typeof window !== 'undefined') {
      // Fallback if GSAP not available
      window.open(url, '_blank');
    }
  }

  function createMagicalParticles() {
    if (!particleContainer) return;

    // Enhanced colors representing hope, nature, and Czech heritage
    const colors = [
      'var(--czech-forest)',
      'var(--czech-forest-light)', 
      'var(--copper-detail)',
      'var(--copper-light)',
      'var(--moravian-earth)',
      'rgba(176, 141, 87, 0.8)',
      'rgba(46, 93, 49, 0.7)',
      'rgba(164, 139, 111, 0.6)',
      'rgba(255, 255, 255, 0.4)',
      'rgba(248, 251, 248, 0.8)'
    ];

    // Generate 60 magical particles for more richness
    for (let i = 0; i < 60; i++) {
      const particle = document.createElement('div');
      particle.className = `floating-particle particle-${i + 1}`;
      
      // Random positioning across the entire hero area
      const left = Math.random() * 95; // 0-95% to avoid edges
      const top = Math.random() * 85; // 0-85% to avoid scroll indicator
      
      // Variable sizes (2-10px for more variety)
      const size = 2 + Math.random() * 8;
      
      // Random color from our enhanced palette
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Random opacity (0.3-0.9 for better layering)
      const opacity = 0.3 + Math.random() * 0.6;
      
      // Apply styles
      particle.style.cssText = `
        position: absolute;
        top: ${top}%;
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        opacity: ${opacity};
        pointer-events: none;
        z-index: 1;
      `;
      
      particleContainer.appendChild(particle);
      
      // Animate each particle with unique timing
      const delay = Math.random() * 5; // Random delay up to 5 seconds
      const duration = 3 + Math.random() * 4; // 3-7 second cycles
      const floatDistance = 10 + Math.random() * 25; // 10-35px movement
      const shimmerDuration = 2 + Math.random() * 5; // 2-7 second shimmer
      
      // Main floating animation
      gsap.to(particle, {
        y: -floatDistance,
        x: (Math.random() - 0.5) * 15, // Slightly more horizontal drift
        duration: duration,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        delay: delay
      });
      
      // Enhanced shimmer/glow effect
      gsap.to(particle, {
        opacity: `+=${0.3 + Math.random() * 0.4}`,
        scale: 1 + Math.random() * 0.4,
        duration: shimmerDuration,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: delay + Math.random() * 2
      });
      
      // Subtle rotation for larger particles
      if (size > 5) {
        gsap.to(particle, {
          rotation: 360,
          duration: 8 + Math.random() * 12,
          ease: "none",
          repeat: -1,
          delay: delay
        });
      }
    }
  }
  
  onMount(() => {
    // Small delay to ensure DOM elements are properly bound
    setTimeout(() => {
      // Ensure elements are available before animating
      if (!mainHeading || !subHeading || !ctaButtons) {
        console.warn('Hero elements not ready for animation');
        return;
      }

      // Create magical particle effect
      createMagicalParticles();

      // GSAP timeline for hero animations
      const tl = gsap.timeline();
    
    // Parallax setup
    gsap.set(parallaxForest, { y: 0 });
    
    // Ensure buttons are visible initially (fallback)
    gsap.set(ctaButtons.children, { opacity: 1, y: 0 });
    
    // Initial animations
    tl.from(mainHeading, {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.3")
    .from(subHeading, {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.4")
    .from(ctaButtons.children, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      onComplete: () => {
        // Ensure buttons are fully visible after animation
        gsap.set(ctaButtons.children, { opacity: 1, y: 0 });
      }
    }, "-=0.2");
    
    // Parallax scroll effect
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;
      gsap.to(parallaxForest, {
        y: rate,
        duration: 0.1,
        ease: "none"
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
    }, 100); // End setTimeout
  });
</script>

<section bind:this={heroContainer} class="parallax-container czech-flex-center">
  <!-- Parallax Background -->
  <div bind:this={parallaxForest} class="parallax-forest"></div>
  
  <!-- Dynamic Particle Container - Enhanced "Glimmer of Hope" Effect -->
  <div bind:this={particleContainer} class="particle-container"></div>
  
  <!-- Main Content -->
  <div class="czech-container czech-text-center relative z-10">
    <div class="hero-content">
      <h1 bind:this={mainHeading} class="czech-heading-xl mb-6">
        {content[language].heading}
      </h1>
      
      <p bind:this={subHeading} class="czech-body-large mb-6 max-w-2xl mx-auto">
        {content[language].subheading}
      </p>
      
      <p class="czech-body mb-8 max-w-xl mx-auto opacity-90">
        {content[language].description}
      </p>
      
      <!-- Enhanced CTA Buttons with Clear Hierarchy -->
      <div bind:this={ctaButtons} class="hero-cta-container">
        <button 
          class="czech-button-primary hero-primary-cta"
          on:click={launchAccelerator}
        >
          <span class="cta-text">{content[language].ctaPrimary}</span>
          <svg class="cta-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        
        <button 
          class="czech-button-secondary hero-secondary-cta"
          on:click={() => scrollToSection('stories')}
        >
          <span class="cta-text">{content[language].ctaSecondary}</span>
        </button>
      </div>
      
      <!-- Enhanced Value Proposition - User-Focused -->
      <div class="hero-value-props">
        <div class="value-prop">
          <div class="prop-icon">💡</div>
          <span class="prop-text">
            {language === 'czech' ? 'Inspirace od lidí jako vy' : 'Inspiration from people like you'}
          </span>
        </div>
        <div class="value-prop">
          <div class="prop-icon">🛡</div>
          <span class="prop-text">
            {language === 'czech' ? 'Bezpečné a ověřené kroky' : 'Safe and trusted steps'}
          </span>
        </div>
        <div class="value-prop">
          <div class="prop-icon">🤝</div>
          <span class="prop-text">
            {language === 'czech' ? 'Začít můžete hned' : 'You can start right now'}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Enhanced Scroll Indicator -->
    <div class="scroll-indicator-container">
      <p class="scroll-text">
        {content[language].scrollText}
      </p>
      <div class="scroll-indicator">
        <div class="scroll-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--czech-forest)" stroke-width="2">
            <path d="M7 13l3 3 7-7M7 6l3 3 7-7"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  /* Hero Content Structure */
  .hero-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 0;
  }
  
  /* Enhanced CTA Container */
  .hero-cta-container {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 3rem;
  }
  
  .hero-primary-cta {
    font-size: 1.1rem;
    padding: 1.25rem 2.5rem;
    border-radius: 14px;
    font-weight: 600;
    box-shadow: 0 4px 20px rgba(46, 93, 49, 0.3);
    transform: scale(1);
    transition: all 0.3s ease;
  }
  
  .hero-primary-cta:hover {
    transform: scale(1.05) translateY(-2px);
    box-shadow: 0 8px 30px rgba(46, 93, 49, 0.4);
  }
  
  .hero-secondary-cta {
    font-size: 1rem;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 500;
    border-width: 2px;
  }
  
  .cta-text {
    margin-right: 0.5rem;
  }
  
  .cta-icon {
    transition: transform 0.3s ease;
  }
  
  .hero-primary-cta:hover .cta-icon {
    transform: translateX(4px);
  }
  
  /* Enhanced Value Propositions */
  .hero-value-props {
    display: flex;
    gap: 2rem;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 2rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .value-prop {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(46, 93, 49, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(46, 93, 49, 0.1);
    transition: all 0.3s ease;
  }
  
  .value-prop:hover {
    transform: translateY(-2px);
    background: rgba(46, 93, 49, 0.08);
    border-color: rgba(46, 93, 49, 0.2);
  }
  
  .prop-icon {
    font-size: 1.3rem;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
  
  .prop-text {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--czech-forest);
    white-space: nowrap;
  }
  
  /* Enhanced Scroll Indicator */
  .scroll-indicator-container {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    z-index: 10;
  }
  
  .scroll-text {
    font-size: 0.9rem;
    color: var(--text-secondary);
    opacity: 0.7;
    margin-bottom: 1rem;
  }
  
  .scroll-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .scroll-arrow {
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    border: 1px solid rgba(46, 93, 49, 0.2);
    animation: bounceGentle 2s ease-in-out infinite;
    transition: all 0.3s ease;
  }
  
  .scroll-arrow:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
  }
  
  @keyframes bounceGentle {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-8px);
    }
    60% {
      transform: translateY(-4px);
    }
  }

  /* Enhanced Particle Effects */
  .particle-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }
  
  :global(.floating-particle) {
    box-shadow: 
      0 0 8px rgba(176, 141, 87, 0.4),
      0 0 16px rgba(46, 93, 49, 0.2),
      0 0 24px rgba(255, 255, 255, 0.1);
    filter: 
      drop-shadow(0 0 4px rgba(176, 141, 87, 0.3))
      drop-shadow(0 0 8px rgba(46, 93, 49, 0.2));
    transition: all 0.3s ease;
  }

  /* Enhanced glow effect for magical feeling */
  :global(.floating-particle):before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
  
  /* Ensure buttons are always visible (enhanced fallback) */
  :global(.czech-button-primary),
  :global(.czech-button-secondary) {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }

  /* Enhanced visual balance */
  .czech-container {
    padding: 2rem;
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  /* Improved typography hierarchy */
  .czech-heading-xl {
    margin-bottom: 2rem;
    text-shadow: 0 2px 8px rgba(46, 93, 49, 0.15);
  }
  
  .czech-body-large {
    margin-bottom: 2rem;
    font-weight: 400;
    opacity: 0.95;
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .hero-content {
      padding: 1rem 0;
    }
    
    .hero-cta-container {
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .hero-primary-cta,
    .hero-secondary-cta {
      width: 100%;
      max-width: 280px;
    }
    
    .hero-primary-cta {
      padding: 1rem 2rem;
      font-size: 1rem;
    }
    
    .hero-secondary-cta {
      padding: 0.875rem 1.75rem;
      font-size: 0.9rem;
    }
    
    .hero-value-props {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      margin-top: 1.5rem;
    }
    
    .value-prop {
      width: 100%;
      max-width: 250px;
      justify-content: center;
    }
    
    .prop-text {
      font-size: 0.85rem;
    }
    
    .czech-container {
      padding: 1rem;
    }
    
    .czech-heading-xl {
      font-size: 2.2rem;
      line-height: 1.2;
      margin-bottom: 1.5rem;
    }
    
    .czech-body-large {
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
    }
    
    .scroll-indicator-container {
      bottom: 1rem;
    }
    
    .scroll-text {
      font-size: 0.8rem;
      margin-bottom: 0.75rem;
    }
    
    /* Reduce particle intensity on mobile for better performance */
    :global(.floating-particle) {
      opacity: 0.6 !important;
      transform: scale(0.8) !important;
    }
  }

  /* Enhanced tablet view */
  @media (max-width: 1024px) and (min-width: 769px) {
    .hero-value-props {
      gap: 1.5rem;
    }
    
    .value-prop {
      flex: 1;
      min-width: 180px;
    }
  }

  /* Reduced motion accessibility */
  @media (prefers-reduced-motion: reduce) {
    :global(.floating-particle) {
      animation: none !important;
      opacity: 0.4 !important;
    }
    
    .bounceGentle {
      animation: none !important;
    }
    
    .scroll-arrow {
      animation: none !important;
    }
    
    .hero-primary-cta:hover {
      transform: none !important;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    :global(.floating-particle) {
      opacity: 0.8 !important;
      filter: none;
      box-shadow: none;
    }
    
    .hero-value-props {
      background: rgba(255, 255, 255, 0.9);
      border: 2px solid var(--czech-forest);
    }
    
    .value-prop {
      border: 2px solid var(--czech-forest);
    }
  }
</style> 