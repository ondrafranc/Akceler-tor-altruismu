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
      heading: "Cítíš se zahlcen/a všemi problémy kolem?",
      subheading: "Nejsi v tom sám/sama. A existuje cesta vpřed.",
      description: "Nalezni praktický způsob, jak udělat rozdíl – krok za krokem, společně",
      ctaPrimary: "Najít svou cestu",
      ctaSecondary: "Rychlá pomoc",
      scrollText: "Pokračuj níže pro více inspirace"
    },
    english: {
      heading: "Feeling overwhelmed by the world's problems?",
      subheading: "You're not alone. And there's a path forward.",
      description: "Find practical ways to make a difference – step by step, together",
      ctaPrimary: "Find Your Path",
      ctaSecondary: "I Need Help Now",
      scrollText: "Continue below for more inspiration"
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

    // Colors representing hope, nature, and Czech heritage
    const colors = [
      'var(--czech-forest)',
      'var(--czech-forest-light)', 
      'var(--copper-detail)',
      'var(--copper-light)',
      'var(--moravian-earth)',
      'rgba(176, 141, 87, 0.8)',
      'rgba(46, 93, 49, 0.7)',
      'rgba(164, 139, 111, 0.6)'
    ];

    // Generate 50 magical particles
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = `floating-particle particle-${i + 1}`;
      
      // Random positioning across the entire hero area
      const left = Math.random() * 95; // 0-95% to avoid edges
      const top = Math.random() * 90; // 0-90% to avoid bottom scroll indicator
      
      // Random size (3-8px for variety)
      const size = 3 + Math.random() * 5;
      
      // Random color from our palette
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Random opacity (0.4-0.9 for visibility)
      const opacity = 0.4 + Math.random() * 0.5;
      
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
      const delay = Math.random() * 4; // Random delay up to 4 seconds
      const duration = 4 + Math.random() * 3; // 4-7 second cycles
      const floatDistance = 15 + Math.random() * 20; // 15-35px movement
      const shimmerDuration = 3 + Math.random() * 4; // 3-7 second shimmer
      
      // Main floating animation
      gsap.to(particle, {
        y: -floatDistance,
        x: (Math.random() - 0.5) * 10, // Random horizontal drift
        duration: duration,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        delay: delay
      });
      
      // Shimmer/glow effect
      gsap.to(particle, {
        opacity: `+=${0.2 + Math.random() * 0.3}`,
        scale: 1 + Math.random() * 0.3,
        duration: shimmerDuration,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: delay + Math.random() * 2
      });
      
      // Subtle rotation for some particles
      if (Math.random() > 0.6) {
        gsap.to(particle, {
          rotation: 360,
          duration: 10 + Math.random() * 10,
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
  
  <!-- Dynamic Particle Container - Magical "Glimmer of Hope" Effect -->
  <div bind:this={particleContainer} class="particle-container"></div>
  
  <!-- Main Content -->
  <div class="czech-container czech-text-center relative z-10">
    <h1 bind:this={mainHeading} class="czech-heading-xl mb-6">
      {content[language].heading}
    </h1>
    
    <p bind:this={subHeading} class="czech-body-large mb-4 max-w-2xl mx-auto">
      {content[language].subheading}
    </p>
    
    <p class="czech-body mb-8 max-w-xl mx-auto opacity-80">
      {content[language].description}
    </p>
    
    <!-- CTA Buttons -->
    <div bind:this={ctaButtons} class="flex gap-4 justify-center flex-wrap">
      <button 
        class="czech-button-primary"
        on:click={launchAccelerator}
      >
        <span>{content[language].ctaPrimary}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
      
      <button 
        class="czech-button-secondary"
        on:click={() => scrollToSection('solidarity-garden')}
      >
        {content[language].ctaSecondary}
      </button>
    </div>
    
    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 czech-text-center">
      <p class="czech-body text-sm opacity-60 mb-2">
        {content[language].scrollText}
      </p>
      <div class="scroll-indicator">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--czech-forest)" stroke-width="2">
          <path d="M7 13l3 3 7-7M7 6l3 3 7-7"/>
        </svg>
      </div>
    </div>
  </div>
</section>

<style>
  .scroll-indicator {
    animation: bounceGentle 2s ease-in-out infinite;
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
      0 0 6px rgba(176, 141, 87, 0.4),
      0 0 12px rgba(46, 93, 49, 0.2),
      0 0 18px rgba(255, 255, 255, 0.1);
    filter: 
      drop-shadow(0 0 3px rgba(176, 141, 87, 0.3))
      drop-shadow(0 0 6px rgba(46, 93, 49, 0.2));
    transition: all 0.3s ease;
  }

  /* Enhanced glow effect for magical feeling */
  :global(.floating-particle):before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
  
  /* Ensure buttons are always visible (fallback) */
  :global(.czech-button-primary),
  :global(.czech-button-secondary) {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }

  /* Enhanced visual balance */
  .czech-container {
    padding: 0 2rem;
  }
  
  /* Improved spacing between elements */
  .czech-heading-xl {
    margin-bottom: 2rem;
  }
  
  .czech-body-large {
    margin-bottom: 1.5rem;
  }
  
  /* Better button spacing */
  .flex.gap-4 {
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .flex {
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    
    .czech-container {
      padding: 0 1.5rem;
    }
    
    .czech-heading-xl {
      font-size: 2rem;
      line-height: 1.2;
      margin-bottom: 1.5rem;
    }
    
    .czech-body-large {
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }
    
    /* Reduce particle intensity on mobile for better performance */
    :global(.floating-particle) {
      opacity: 0.6 !important;
      transform: scale(0.8) !important;
    }
  }

  /* Reduced motion accessibility */
  @media (prefers-reduced-motion: reduce) {
    :global(.floating-particle) {
      animation: none !important;
      opacity: 0.3 !important;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    :global(.floating-particle) {
      opacity: 0.8 !important;
      filter: none;
      box-shadow: none;
    }
  }
</style> 