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
  
  onMount(() => {
    // Small delay to ensure DOM elements are properly bound
    setTimeout(() => {
      // Ensure elements are available before animating
      if (!mainHeading || !subHeading || !ctaButtons) {
        console.warn('Hero elements not ready for animation');
        return;
      }

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
    
    // Enhanced floating particles animation with shimmer
    const particles = document.querySelectorAll('.floating-particle');
    particles.forEach((particle, index) => {
      // Main floating movement
      gsap.to(particle, {
        y: -15 - (index % 3) * 5,
        x: (index % 2 === 0 ? 3 : -3),
        duration: 3 + index * 0.3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        delay: index * 0.2
      });
      
      // Shimmer opacity effect
      gsap.to(particle, {
        opacity: `+=${0.1 + (index % 2) * 0.1}`,
        duration: 2.5 + index * 0.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: index * 0.15
      });
    });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
    }, 100); // End setTimeout
  });
</script>

<section bind:this={heroContainer} class="parallax-container czech-flex-center">
  <!-- Parallax Background -->
  <div bind:this={parallaxForest} class="parallax-forest"></div>
  
  <!-- Floating Particles for Community Feeling - Enhanced "Glimmer of Hope" Effect -->
  <div class="floating-particle particle-1" style="position: absolute; top: 20%; left: 10%; width: 5px; height: 5px; background: var(--czech-forest-light); border-radius: 50%; opacity: 0.8;"></div>
  <div class="floating-particle particle-2" style="position: absolute; top: 30%; right: 15%; width: 4px; height: 4px; background: var(--copper-detail); border-radius: 50%; opacity: 0.7;"></div>
  <div class="floating-particle particle-3" style="position: absolute; top: 60%; left: 20%; width: 6px; height: 6px; background: var(--moravian-earth); border-radius: 50%; opacity: 0.8;"></div>
  <div class="floating-particle particle-4" style="position: absolute; top: 40%; right: 25%; width: 4px; height: 4px; background: var(--czech-forest); border-radius: 50%; opacity: 0.9;"></div>
  <div class="floating-particle particle-5" style="position: absolute; top: 15%; right: 30%; width: 3px; height: 3px; background: var(--copper-light); border-radius: 50%; opacity: 0.6;"></div>
  <div class="floating-particle particle-6" style="position: absolute; top: 70%; left: 15%; width: 4px; height: 4px; background: var(--czech-forest-light); border-radius: 50%; opacity: 0.7;"></div>
  <div class="floating-particle particle-7" style="position: absolute; top: 50%; left: 5%; width: 5px; height: 5px; background: var(--copper-detail); border-radius: 50%; opacity: 0.8;"></div>
  <div class="floating-particle particle-8" style="position: absolute; top: 35%; right: 5%; width: 3px; height: 3px; background: var(--moravian-earth); border-radius: 50%; opacity: 0.6;"></div>
  

  
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
  
  .floating-particle {
    animation: float 4s ease-in-out infinite, shimmer 6s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(176, 141, 87, 0.3);
    filter: drop-shadow(0 0 3px rgba(46, 93, 49, 0.2));
  }
  
  /* Individual particle timing to create natural movement */
  .particle-1 { animation-delay: 0s, 0.5s; }
  .particle-2 { animation-delay: 0.8s, 1.2s; }
  .particle-3 { animation-delay: 1.5s, 2.1s; }
  .particle-4 { animation-delay: 2.2s, 0.3s; }
  .particle-5 { animation-delay: 1.1s, 3.2s; }
  .particle-6 { animation-delay: 2.8s, 1.8s; }
  .particle-7 { animation-delay: 0.4s, 2.5s; }
  .particle-8 { animation-delay: 1.9s, 0.7s; }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0) translateX(0);
    }
    25% {
      transform: translateY(-8px) translateX(2px);
    }
    50% {
      transform: translateY(-15px) translateX(-1px);
    }
    75% {
      transform: translateY(-5px) translateX(3px);
    }
  }
  
  @keyframes shimmer {
    0%, 100% {
      opacity: var(--base-opacity, 0.6);
      box-shadow: 0 0 8px rgba(176, 141, 87, 0.3);
    }
    50% {
      opacity: calc(var(--base-opacity, 0.6) + 0.2);
      box-shadow: 0 0 12px rgba(176, 141, 87, 0.5), 0 0 20px rgba(46, 93, 49, 0.3);
    }
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
    
    .floating-particle {
      /* Slightly reduce particle visibility on mobile for cleaner look */
      opacity: 0.6;
    }
  }
</style> 