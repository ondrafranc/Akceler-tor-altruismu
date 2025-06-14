<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { scrollToSection } from '../lib/animations.js';
  import LanguageToggle from './LanguageToggle.svelte';
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
    // GSAP timeline for hero animations
    const tl = gsap.timeline();
    
    // Parallax setup
    gsap.set(parallaxForest, { y: 0 });
    
    // Initial animations
    tl.from('.language-toggle', {
      opacity: 0,
      y: -20,
      duration: 0.6,
      ease: "power2.out"
    })
    .from(mainHeading, {
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
      ease: "power2.out"
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
    
    // Floating particles animation
    const particles = document.querySelectorAll('.floating-particle');
    particles.forEach((particle, index) => {
      gsap.to(particle, {
        y: -20,
        duration: 2 + index * 0.5,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1
      });
    });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });
</script>

<section bind:this={heroContainer} class="parallax-container czech-flex-center">
  <!-- Parallax Background -->
  <div bind:this={parallaxForest} class="parallax-forest"></div>
  
  <!-- Floating Particles for Community Feeling -->
  <div class="floating-particle" style="position: absolute; top: 20%; left: 10%; width: 4px; height: 4px; background: var(--czech-forest-light); border-radius: 50%; opacity: 0.6;"></div>
  <div class="floating-particle" style="position: absolute; top: 30%; right: 15%; width: 3px; height: 3px; background: var(--copper-detail); border-radius: 50%; opacity: 0.4;"></div>
  <div class="floating-particle" style="position: absolute; top: 60%; left: 20%; width: 5px; height: 5px; background: var(--moravian-earth); border-radius: 50%; opacity: 0.5;"></div>
  <div class="floating-particle" style="position: absolute; top: 40%; right: 25%; width: 3px; height: 3px; background: var(--czech-forest); border-radius: 50%; opacity: 0.7;"></div>
  
  <!-- Language Selector -->
  <div class="absolute top-4 right-4 z-10">
    <LanguageToggle on:languageChange={handleLanguageChange} />
  </div>
  
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
    animation: float 3s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    .flex {
      flex-direction: column;
      align-items: center;
    }
    
    .gap-4 {
      gap: 1rem;
    }
  }
</style> 