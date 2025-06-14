<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  
  gsap.registerPlugin(ScrollTrigger);
  
  let gardenContainer;
  let totalCommunityActions = 247;
  let currentLanguage = 'czech';
  let gardenElements = [];
  let seasonalBackground = '';
  
  // Interactive garden state
  let plantedSeeds = 0;
  let grownTrees = 0;
  let communityFlowers = 0;
  
  // Get current season for dynamic theming
  function getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }
  
  const currentSeason = getCurrentSeason();
  
  const content = {
    czech: {
      title: "Zahrada solidarity",
      subtitle: "Interaktivní vizualizace naší společné pomoci",
      description: "Každá vaše akce zde zaseje semínko naděje. Kliknutím na prvky zahrady můžete sledovat růst naší komunity.",
      counter: "lidí pomohlo tento týden",
      plantSeed: "Zasadit semínko",
      waterPlant: "Zalít rostlinu",
      watchGrow: "Sledovat růst",
      seasonInfo: {
        spring: "🌸 Jarní obnova - čas nových začátků",
        summer: "☀️ Letní energie - čas akcí",
        autumn: "🍂 Podzimní sklizeň - čas díkůvzdání",
        winter: "❄️ Zimní péče - čas solidarity"
      }
    },
    english: {
      title: "Solidarity Garden",
      subtitle: "Interactive visualization of our collective help",
      description: "Every action you take plants a seed of hope here. Click on garden elements to watch our community grow.",
      counter: "people helped this week",
      plantSeed: "Plant a seed",
      waterPlant: "Water plant",
      watchGrow: "Watch grow",
      seasonInfo: {
        spring: "🌸 Spring renewal - time for new beginnings",
        summer: "☀️ Summer energy - time for action", 
        autumn: "🍂 Autumn harvest - time for gratitude",
        winter: "❄️ Winter care - time for solidarity"
      }
    }
  };
  
  // Interactive garden functions
  function plantSeed() {
    plantedSeeds++;
    gsap.fromTo('.seed-' + plantedSeeds, 
      { scale: 0, opacity: 0, y: 20 },
      { 
        scale: 1, 
        opacity: 1, 
        y: 0, 
        duration: 0.8, 
        ease: "back.out(1.7)",
        onComplete: () => {
          // Animate into small plant after 2 seconds
          setTimeout(() => growPlant(plantedSeeds), 2000);
        }
      }
    );
  }
  
  function growPlant(seedId) {
    gsap.to('.seed-' + seedId, {
      scale: 1.5,
      duration: 1.5,
      ease: "power2.out",
      onComplete: () => {
        communityFlowers++;
        // Add sparkle effect
        createSparkles('.seed-' + seedId);
      }
    });
  }
  
  function createSparkles(element) {
    const sparkles = ['✨', '🌟', '💫'];
    for (let i = 0; i < 3; i++) {
      const sparkle = document.createElement('div');
      sparkle.innerHTML = sparkles[Math.floor(Math.random() * sparkles.length)];
      sparkle.className = 'sparkle';
      sparkle.style.position = 'absolute';
      sparkle.style.fontSize = '1.2rem';
      sparkle.style.pointerEvents = 'none';
      
      const container = document.querySelector(element);
      if (container) {
        container.appendChild(sparkle);
        
        gsap.fromTo(sparkle, 
          { 
            x: 0, 
            y: 0, 
            scale: 0, 
            opacity: 1 
          },
          {
            x: (Math.random() - 0.5) * 60,
            y: -50 + (Math.random() * 20),
            scale: 1,
            opacity: 0,
            duration: 2,
            ease: "power2.out",
            onComplete: () => sparkle.remove()
          }
        );
      }
    }
  }
  
  function waterGarden() {
    // Simulate watering effect - grow all existing plants slightly
    gsap.to('.garden-element', {
      scale: 1.1,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut"
    });
    
    // Increase community stats
    totalCommunityActions += Math.floor(Math.random() * 5) + 1;
  }
  
  onMount(() => {
    // Main container animation
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
    
    // Animate garden elements in sequence
    gsap.fromTo('.garden-element',
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        stagger: 0.2,
        ease: "back.out(1.7)",
        delay: 0.5
      }
    );
    
    // Set up hover animations for interactive elements
    const interactiveElements = document.querySelectorAll('.interactive-element');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        gsap.to(element, { scale: 1.1, duration: 0.3, ease: "power2.out" });
      });
      
      element.addEventListener('mouseleave', () => {
        gsap.to(element, { scale: 1, duration: 0.3, ease: "power2.out" });
      });
    });
    
    // Gentle floating animation for garden elements
    gsap.to('.floating-element', {
      y: -10,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.3
    });
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
    
    <!-- Interactive Garden -->
    <div class="garden-wrapper" class:spring={currentSeason === 'spring'} 
         class:summer={currentSeason === 'summer'} 
         class:autumn={currentSeason === 'autumn'} 
         class:winter={currentSeason === 'winter'}>
      
      <!-- Seasonal Header -->
      <div class="seasonal-header">
        <span class="season-indicator">
          {content[currentLanguage].seasonInfo[currentSeason]}
        </span>
      </div>
      
      <div class="garden-canvas">
        <!-- Background landscape -->
        <div class="garden-background">
          <div class="hills"></div>
          <div class="sky"></div>
        </div>
        
        <!-- Interactive Garden Elements -->
        <div class="garden-floor">
          <!-- Trees (representing major community actions) -->
          <div class="garden-element tree interactive-element floating-element" 
               title="Velké komunitní akce">
            🌳
          </div>
          <div class="garden-element tree interactive-element floating-element" 
               title="Vzdělávací programy">
            🌲
          </div>
          
          <!-- Flowers (representing individual actions) -->
          <div class="garden-element flower interactive-element floating-element seed-1" 
               title="Individuální pomoc">
            🌸
          </div>
          <div class="garden-element flower interactive-element floating-element seed-2" 
               title="Dobrovolnictví">
            🌺
          </div>
          <div class="garden-element flower interactive-element floating-element seed-3" 
               title="Dárcovství">
            🌻
          </div>
          
          <!-- Growing plants (dynamic content) -->
          <div class="garden-element sprout interactive-element floating-element" 
               title="Rostoucí iniciativy">
            🌱
          </div>
          <div class="garden-element sprout interactive-element floating-element" 
               title="Nové projekty">
            🌿
          </div>
        </div>
        
        <!-- Interactive Controls -->
        <div class="garden-controls">
          <button class="czech-button-secondary interactive-element" 
                  on:click={plantSeed}>
            🌱 {content[currentLanguage].plantSeed}
          </button>
          <button class="czech-button-secondary interactive-element" 
                  on:click={waterGarden}>
            💧 {content[currentLanguage].waterPlant}
          </button>
        </div>
        
        <!-- Community Stats as Garden Growth -->
        <div class="community-garden-stats">
          <div class="stat-plant">
            <div class="plant-icon">🌳</div>
            <div class="stat-number">{totalCommunityActions}</div>
            <div class="stat-label">{content[currentLanguage].counter}</div>
          </div>
          
          <div class="stat-plant">
            <div class="plant-icon">🌸</div>
            <div class="stat-number">{plantedSeeds + communityFlowers}</div>
            <div class="stat-label">
              {currentLanguage === 'czech' ? 'zasazených semínek' : 'planted seeds'}
            </div>
          </div>
          
          <div class="stat-plant">
            <div class="plant-icon">💚</div>
            <div class="stat-number">{Math.floor(totalCommunityActions / 10)}</div>
            <div class="stat-label">
              {currentLanguage === 'czech' ? 'aktivních komunit' : 'active communities'}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Inspirational Quote (Enhanced) -->
      <div class="havel-quote enhanced-quote">
        <div class="quote-decoration">🌱</div>
        <p class="czech-body italic">
          {currentLanguage === 'czech' 
            ? '"Naděje není přesvědčení, že se něco povede, ale jistota, že má smysl." - Václav Havel'
            : '"Hope is not the conviction that something will turn out well, but the certainty that something makes sense." - Václav Havel'}
        </p>
        <div class="quote-decoration">🌱</div>
      </div>
    </div>
  </div>
</section>

<style>
  .garden-wrapper {
    position: relative;
    max-width: 900px;
    margin: 0 auto;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(46, 93, 49, 0.15);
    background: var(--warm-stone);
    transition: all 0.6s ease;
  }
  
  /* Seasonal Theming */
  .garden-wrapper.spring {
    background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%);
  }
  
  .garden-wrapper.summer {
    background: linear-gradient(135deg, #fff9e6 0%, #f5f0e8 100%);
  }
  
  .garden-wrapper.autumn {
    background: linear-gradient(135deg, #faf5f0 0%, #f0e6d6 100%);
  }
  
  .garden-wrapper.winter {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  }
  
  .seasonal-header {
    text-align: center;
    padding: 1.5rem 2rem 0;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
  }
  
  .season-indicator {
    font-size: 1.1rem;
    color: var(--czech-forest);
    font-weight: 500;
    padding: 0.5rem 1rem;
    background: var(--bg-accent);
    border-radius: 20px;
    border: 1px solid var(--subtle-border);
  }
  
  .garden-canvas {
    position: relative;
    min-height: 400px;
    padding: 2rem;
    overflow: hidden;
  }
  
  .garden-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
  }
  
  .hills {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: linear-gradient(180deg, transparent 0%, var(--bohemian-mist) 100%);
    border-radius: 50% 50% 0 0;
  }
  
  .sky {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(173, 216, 230, 0.3) 0%, transparent 100%);
  }
  
  .garden-floor {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 1.5rem;
    align-items: end;
    padding: 1rem 0;
    min-height: 200px;
  }
  
  .garden-element {
    font-size: 2.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    transform-origin: bottom center;
    position: relative;
  }
  
  .garden-element:hover {
    transform: scale(1.2) translateY(-5px);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  }
  
  .tree {
    font-size: 3rem;
    grid-row: span 2;
  }
  
  .flower {
    font-size: 2rem;
    animation: gentle-sway 3s ease-in-out infinite;
  }
  
  .sprout {
    font-size: 1.8rem;
    opacity: 0.8;
  }
  
  @keyframes gentle-sway {
    0%, 100% { transform: rotate(-2deg); }
    50% { transform: rotate(2deg); }
  }
  
  .garden-controls {
    position: relative;
    z-index: 3;
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 2rem 0;
    flex-wrap: wrap;
  }
  
  .garden-controls button {
    font-size: 0.9rem;
    padding: 0.75rem 1.25rem;
    border-radius: 25px;
    transition: all 0.3s ease;
  }
  
  .garden-controls button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(46, 93, 49, 0.3);
  }
  
  .community-garden-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 16px 16px 0 0;
    margin-top: 2rem;
  }
  
  .stat-plant {
    text-align: center;
    padding: 1rem;
    background: var(--bg-accent);
    border-radius: 12px;
    border: 1px solid var(--subtle-border);
    transition: all 0.3s ease;
  }
  
  .stat-plant:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(46, 93, 49, 0.15);
  }
  
  .plant-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .stat-number {
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--czech-forest);
    line-height: 1;
    margin-bottom: 0.25rem;
  }
  
  .stat-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  .enhanced-quote {
    background: linear-gradient(135deg, var(--bg-accent) 0%, rgba(255, 255, 255, 0.8) 100%);
    border: none;
    border-radius: 16px;
    padding: 2rem;
    margin: 0;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .quote-decoration {
    font-size: 1.5rem;
    opacity: 0.6;
    color: var(--czech-forest);
  }
  
  /* Sparkle animation */
  .sparkle {
    animation: sparkle-fade 2s ease-out forwards;
  }
  
  @keyframes sparkle-fade {
    0% {
      opacity: 1;
      transform: scale(0) rotate(0deg);
    }
    50% {
      opacity: 1;
      transform: scale(1) rotate(180deg);
    }
    100% {
      opacity: 0;
      transform: scale(0) rotate(360deg);
    }
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .garden-canvas {
      padding: 1.5rem 1rem;
      min-height: 300px;
    }
    
    .garden-floor {
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    
    .garden-element {
      font-size: 2rem;
    }
    
    .tree {
      font-size: 2.5rem;
    }
    
    .garden-controls {
      flex-direction: column;
      align-items: center;
    }
    
    .garden-controls button {
      width: 200px;
    }
    
    .community-garden-stats {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 1.5rem;
    }
    
    .enhanced-quote {
      flex-direction: column;
      text-align: center;
      padding: 1.5rem;
    }
  }
  
  @media (max-width: 900px) {
    .garden-wrapper {
      max-width: 100%;
      border-radius: 16px;
    }
  }
</style> 