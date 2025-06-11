<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  
  gsap.registerPlugin(ScrollTrigger);
  
  let gardenContainer;
  let totalCommunityActions = 247;
  let currentLanguage = 'czech';
  
  const content = {
    czech: {
      title: "Zahrada solidarity",
      subtitle: "Interaktivní vizualizace vaší pomoci",
      comingSoon: "Již brzy...",
      description: "Zde si budete moci vizuálně sledovat dopad vaší pomoci na komunitu.",
      counter: "lidí pomohlo tento týden"
    },
    english: {
      title: "Solidarity Garden",
      subtitle: "Interactive visualization of your help",
      comingSoon: "Coming soon...",
      description: "Here you'll be able to visually track the impact of your help on the community.",
      counter: "people helped this week"
    }
  };
  
  onMount(() => {
    gsap.fromTo(gardenContainer,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: gardenContainer,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );
  });
</script>

<section bind:this={gardenContainer} id="solidarity-garden" class="czech-section">
  <div class="czech-container">
    <div class="czech-text-center mb-12">
      <h2 class="czech-heading-lg mb-4">
        {content[currentLanguage].title}
      </h2>
      <p class="czech-body-large mb-6 max-w-2xl mx-auto">
        {content[currentLanguage].subtitle}
      </p>
    </div>
    
    <!-- Coming Soon Placeholder -->
    <div class="garden-wrapper">
      <div class="garden-placeholder">
        <div class="placeholder-content">
          <div class="placeholder-icon">🌱</div>
          <h3 class="placeholder-title">{content[currentLanguage].comingSoon}</h3>
          <p class="placeholder-description">
            {content[currentLanguage].description}
          </p>
          
          <!-- Community Stats Preview -->
          <div class="community-stats">
            <div class="stat-circle">
              <div class="stat-number">{totalCommunityActions}</div>
              <div class="stat-label">{content[currentLanguage].counter}</div>
            </div>
          </div>
          
          <!-- Inspirational Quote -->
          <div class="havel-quote">
            <p class="czech-body italic">
              {currentLanguage === 'czech' 
                ? '"Naděje není přesvědčení, že se něco povede, ale jistota, že má smysl." - Václav Havel'
                : '"Hope is not the conviction that something will turn out well, but the certainty that something makes sense." - Václav Havel'}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .garden-wrapper {
    position: relative;
    max-width: 800px;
    margin: 0 auto;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(46, 93, 49, 0.1);
    background: var(--warm-stone);
  }
  
  .garden-placeholder {
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--bg-accent) 0%, var(--bohemian-mist) 100%);
    border: 2px dashed var(--subtle-border);
  }
  
  .placeholder-content {
    text-align: center;
    padding: 3rem 2rem;
    max-width: 500px;
  }
  
  .placeholder-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.7;
  }
  
  .placeholder-title {
    font-size: 1.5rem;
    color: var(--czech-forest);
    margin-bottom: 1rem;
    font-weight: 500;
  }
  
  .placeholder-description {
    color: var(--text-secondary);
    margin-bottom: 2rem;
    line-height: 1.6;
  }
  
  .community-stats {
    text-align: center;
    margin: 2rem 0;
  }
  
  .stat-circle {
    display: inline-block;
    background: var(--bg-accent);
    border: 3px solid var(--czech-forest-light);
    border-radius: 50%;
    width: 120px;
    height: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
  }
  
  .stat-number {
    font-size: 2rem;
    font-weight: 600;
    color: var(--czech-forest);
  }
  
  .stat-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-align: center;
    line-height: 1.2;
  }
  
  .havel-quote {
    background: var(--bg-accent);
    border-left: 4px solid var(--copper-detail);
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    margin-top: 3rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  @media (max-width: 768px) {
    .garden-placeholder {
      min-height: 300px;
    }
    
    .placeholder-content {
      padding: 2rem 1rem;
    }
    
    .stat-circle {
      width: 100px;
      height: 100px;
    }
    
    .stat-number {
      font-size: 1.5rem;
    }
    
    .havel-quote {
      padding: 1rem;
      margin-top: 2rem;
    }
  }
  
  @media (max-width: 900px) {
    .garden-wrapper {
      max-width: 100%;
    }
  }
</style> 