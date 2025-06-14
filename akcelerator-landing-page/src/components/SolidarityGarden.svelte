<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import StoryModal from './StoryModal.svelte';
  import { currentLanguage } from '../lib/stores.js';
  
  gsap.registerPlugin(ScrollTrigger);
  
  let gardenContainer;
  let totalCommunityActions = 247;
  let language = 'czech';
  let gardenElements = [];
  let seasonalBackground = '';
  
  // Interactive garden state
  let plantedSeeds = 0;
  let grownTrees = 0;
  let communityFlowers = 0;
  
  // Subscribe to language changes
  currentLanguage.subscribe(value => {
    language = value;
  });
  
  // Story modal state
  let isStoryModalOpen = false;
  let currentStory = null;
  
  // No more direct JSON import - we'll fetch it
  let successStories = [];
  let isLoading = true;
  
  // Get current season based on date (only on client)
  function getCurrentSeason() {
    if (typeof window === 'undefined') {
      // Default for SSR
      return 'spring';
    }
    
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }
  
  let currentSeason = 'spring';
  
  const content = {
    czech: {
      title: "Zahrada inspirativních příběhů",
      subtitle: "Objevte skutečné příběhy naděje a solidarity",
      description: "Každá rostlina v této zahradě představuje skutečný příběh pomoce. Kliknutím na rostliny objevíte, jak lidé kolem nás mění svět k lepšímu.",
      callToAction: "🌱 Klikněte na rostliny a objevte příběhy naděje",
      counter: "lidí pomohlo tento týden",
      plantSeed: "Zasadit semínko",
      waterPlant: "Zalít rostlinu",
      watchGrow: "Sledovat růst",
      storyPrompt: "Klikněte pro inspirativní příběh",
      seasonInfo: {
        spring: "🌸 Jarní obnova - čas nových začátků",
        summer: "☀️ Letní energie - čas akcí",
        autumn: "🍂 Podzimní sklizeň - čas díkůvzdání",
        winter: "❄️ Zimní péče - čas solidarity"
      }
    },
    english: {
      title: "Garden of Inspiring Stories",
      subtitle: "Discover real stories of hope and solidarity",
      description: "Every plant in this garden represents a real story of help. Click on the plants to discover how people around us are changing the world for the better.",
      callToAction: "🌱 Click on plants to discover stories of hope",
      counter: "people helped this week",
      plantSeed: "Plant a seed",
      waterPlant: "Water plant",
      watchGrow: "Watch grow",
      storyPrompt: "Click for inspiring story",
      seasonInfo: {
        spring: "🌸 Spring renewal - time for new beginnings",
        summer: "☀️ Summer energy - time for action", 
        autumn: "🍂 Autumn harvest - time for gratitude",
        winter: "❄️ Winter care - time for solidarity"
      }
    }
  };
  
  // Load success stories from static folder
  async function loadSuccessStories() {
    try {
      const response = await fetch('/success_stories.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      successStories = data;
    } catch (error) {
      console.warn('Could not load success stories:', error);
      // Provide fallback stories
      successStories = [
        {
          name: "Marie K.",
          location: "Praha",
          action: "Organizuje komunitní zahradničení",
          impact: "Spojila 50+ sousedů",
          season: ["spring", "summer"]
        }
      ];
    } finally {
      isLoading = false;
    }
  }
  
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
    if (typeof document === 'undefined') return;
    
    for (let i = 0; i < 5; i++) {
      const sparkle = document.createElement('div');
      sparkle.innerHTML = '✨';
      sparkle.className = 'sparkle';
      sparkle.style.position = 'absolute';
      sparkle.style.left = Math.random() * 40 - 20 + 'px';
      sparkle.style.top = Math.random() * 40 - 20 + 'px';
      sparkle.style.pointerEvents = 'none';
      sparkle.style.zIndex = '1000';
      
      const container = element.closest('.garden-floor') || element.parentElement;
      if (container) {
        container.appendChild(sparkle);
        
        // Remove sparkle after animation
        setTimeout(() => sparkle.remove(), 2000);
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
  
  // Show success story when garden element is clicked
  function showSuccessStory(element) {
    if (isLoading || !successStories.length) {
      console.log('Stories not yet loaded or empty');
      return;
    }
    
    // Filter stories by current season
    const seasonalStories = successStories.filter(story => 
      story.season && story.season.includes(currentSeason)
    );
    
    // Fall back to all stories if no seasonal matches
    const availableStories = seasonalStories.length > 0 ? seasonalStories : successStories;
    
    if (availableStories.length === 0) {
      console.log('No stories available');
      return;
    }
    
    // Get random story
    const randomIndex = Math.floor(Math.random() * availableStories.length);
    currentStory = availableStories[randomIndex];
    
    // Show modal
    isStoryModalOpen = true;
    
    // Add visual feedback - sparkle effect (only on client)
    if (typeof window !== 'undefined') {
      createSparkles(element);
      growthAnimation(element);
    }
  }
  
  // Close story modal
  function closeStoryModal() {
    isStoryModalOpen = false;
    currentStory = null;
  }
  
  // Growth animation for clicked element
  function growthAnimation(element) {
    if (typeof window === 'undefined' || !gsap) return;
    
    gsap.fromTo(element, 
      { scale: 1 }, 
      { 
        scale: 1.3, 
        duration: 0.2, 
        ease: "back.out(1.7)",
        yoyo: true,
        repeat: 1
      }
    );
  }
  
  onMount(async () => {
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
    
    // Set current season
    currentSeason = getCurrentSeason();
    
    // Load success stories
    await loadSuccessStories();
    
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
        {content[language].title}
      </h2>
      <p class="czech-body-large mb-6 max-w-2xl mx-auto">
        {content[language].subtitle}
      </p>
      <p class="czech-body mb-6 max-w-3xl mx-auto">
        {content[language].description}
      </p>
      <!-- Clear Call-to-Action -->
      <div class="story-cta-banner">
        <p class="czech-body-large font-semibold text-czech-forest">
          {content[language].callToAction}
        </p>
      </div>
    </div>
    
    <!-- Interactive Garden -->
    <div class="garden-wrapper" class:spring={currentSeason === 'spring'} 
         class:summer={currentSeason === 'summer'} 
         class:autumn={currentSeason === 'autumn'} 
         class:winter={currentSeason === 'winter'}>
      
      <!-- Seasonal Header -->
      <div class="seasonal-header">
        <span class="season-indicator">
          {content[language].seasonInfo[currentSeason]}
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
          <div class="garden-element tree interactive-element floating-element story-trigger" 
               title={content[language].storyPrompt}
               role="button"
               tabindex="0"
               on:click={(e) => showSuccessStory(e.target)}
               on:keydown={(e) => e.key === 'Enter' && showSuccessStory(e.target)}>
            🌳
            <div class="story-tooltip">{content[language].storyPrompt}</div>
          </div>
          <div class="garden-element tree interactive-element floating-element story-trigger" 
               title={content[language].storyPrompt}
               role="button"
               tabindex="0"
               on:click={(e) => showSuccessStory(e.target)}
               on:keydown={(e) => e.key === 'Enter' && showSuccessStory(e.target)}>
            🌲
            <div class="story-tooltip">{content[language].storyPrompt}</div>
          </div>
          
          <!-- Flowers (representing individual actions) -->
          <div class="garden-element flower interactive-element floating-element seed-1 story-trigger" 
               title={content[language].storyPrompt}
               role="button"
               tabindex="0"
               on:click={(e) => showSuccessStory(e.target)}
               on:keydown={(e) => e.key === 'Enter' && showSuccessStory(e.target)}>
            🌸
            <div class="story-tooltip">{content[language].storyPrompt}</div>
          </div>
          <div class="garden-element flower interactive-element floating-element seed-2 story-trigger" 
               title={content[language].storyPrompt}
               role="button"
               tabindex="0"
               on:click={(e) => showSuccessStory(e.target)}
               on:keydown={(e) => e.key === 'Enter' && showSuccessStory(e.target)}>
            🌺
            <div class="story-tooltip">{content[language].storyPrompt}</div>
          </div>
          <div class="garden-element flower interactive-element floating-element seed-3 story-trigger" 
               title={content[language].storyPrompt}
               role="button"
               tabindex="0"
               on:click={(e) => showSuccessStory(e.target)}
               on:keydown={(e) => e.key === 'Enter' && showSuccessStory(e.target)}>
            🌻
            <div class="story-tooltip">{content[language].storyPrompt}</div>
          </div>
          
          <!-- Growing plants (dynamic content) -->
          <div class="garden-element sprout interactive-element floating-element story-trigger" 
               title={content[language].storyPrompt}
               role="button"
               tabindex="0"
               on:click={(e) => showSuccessStory(e.target)}
               on:keydown={(e) => e.key === 'Enter' && showSuccessStory(e.target)}>
            🌱
            <div class="story-tooltip">{content[language].storyPrompt}</div>
          </div>
          <div class="garden-element sprout interactive-element floating-element story-trigger" 
               title={content[language].storyPrompt}
               role="button"
               tabindex="0"
               on:click={(e) => showSuccessStory(e.target)}
               on:keydown={(e) => e.key === 'Enter' && showSuccessStory(e.target)}>
            🌿
            <div class="story-tooltip">{content[language].storyPrompt}</div>
          </div>
        </div>
        
        <!-- Interactive Controls -->
        <div class="garden-controls">
          <button class="czech-button-secondary interactive-element" 
                  on:click={plantSeed}>
            🌱 {content[language].plantSeed}
          </button>
          <button class="czech-button-secondary interactive-element" 
                  on:click={waterGarden}>
            💧 {content[language].waterPlant}
          </button>
        </div>
        
        <!-- Community Stats as Garden Growth -->
        <div class="community-garden-stats">
          <div class="stat-plant">
            <div class="plant-icon">🌳</div>
            <div class="stat-number">{totalCommunityActions}</div>
            <div class="stat-label">{content[language].counter}</div>
          </div>
          
          <div class="stat-plant">
            <div class="plant-icon">🌸</div>
            <div class="stat-number">{plantedSeeds + communityFlowers}</div>
            <div class="stat-label">
              {language === 'czech' ? 'zasazených semínek' : 'planted seeds'}
            </div>
          </div>
          
          <div class="stat-plant">
            <div class="plant-icon">💚</div>
            <div class="stat-number">{Math.floor(totalCommunityActions / 10)}</div>
            <div class="stat-label">
              {language === 'czech' ? 'aktivních komunit' : 'active communities'}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Inspirational Quote (Enhanced) -->
      <div class="havel-quote enhanced-quote">
        <div class="quote-decoration">🌱</div>
        <p class="czech-body italic">
          {language === 'czech' 
            ? '"Naděje není to přesvědčení, že něco dobře dopadne, ale jistota, že má něco smysl – bez ohledu na to, jak to dopadne." - Václav Havel'
            : '"Hope is not the conviction that something will turn out well, but the certainty that something is meaningful – no matter how it turns out." - Václav Havel'}
        </p>
        <div class="quote-decoration">🌱</div>
      </div>
    </div>
  </div>
  
  <!-- Story Modal -->
  <StoryModal 
    isOpen={isStoryModalOpen} 
    story={currentStory} 
    on:close={closeStoryModal}
  />
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
  
  .story-trigger {
    position: relative;
    outline: none;
  }
  
  .story-trigger:focus {
    outline: 2px solid var(--czech-forest);
    outline-offset: 4px;
  }
  
  .story-trigger::after {
    content: '✨';
    position: absolute;
    top: -10px;
    right: -10px;
    font-size: 1rem;
    opacity: 0;
    animation: sparkle-hint 2s ease-in-out infinite;
  }
  
  .story-trigger:hover::after {
    opacity: 1;
    animation: sparkle-pulse 0.5s ease-in-out infinite;
  }
  
  @keyframes sparkle-hint {
    0%, 80%, 100% { opacity: 0; }
    40% { opacity: 0.6; }
  }
  
  @keyframes sparkle-pulse {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.2); opacity: 1; }
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
  
  /* Sparkle animation - Applied dynamically via JavaScript (see createSparkles function) */
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
  
  /* Story-focused enhancements */
  .story-cta-banner {
    background: linear-gradient(135deg, rgba(46, 93, 49, 0.1) 0%, rgba(46, 93, 49, 0.05) 100%);
    border: 2px solid var(--czech-forest-light);
    border-radius: 12px;
    padding: 1rem 2rem;
    margin: 1.5rem auto;
    max-width: 600px;
    text-align: center;
    animation: gentle-pulse 3s ease-in-out infinite;
  }
  
  @keyframes gentle-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  
  .story-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--czech-forest);
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s ease;
    z-index: 1000;
    margin-bottom: 8px;
  }
  
  .story-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: var(--czech-forest);
  }
  
  .story-trigger:hover .story-tooltip,
  .story-trigger:focus .story-tooltip {
    opacity: 1;
    transform: translateX(-50%) translateY(-4px);
  }
  
  @media (max-width: 768px) {
    .story-cta-banner {
      padding: 0.75rem 1rem;
      margin: 1rem auto;
      font-size: 0.9rem;
    }
    
    .story-tooltip {
      font-size: 0.7rem;
      padding: 0.4rem 0.6rem;
    }
  }
</style> 