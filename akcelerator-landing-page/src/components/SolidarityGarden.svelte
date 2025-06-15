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
  
  // Subscribe to language changes
  currentLanguage.subscribe(value => {
    language = value;
  });
  
  // Story modal state
  let isStoryModalOpen = false;
  let currentStory = null;
  
  // Load success stories
  let successStories = [];
  let isLoading = true;
  
  // Get current season based on date (only on client)
  function getCurrentSeason() {
    if (typeof window === 'undefined') {
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
      title: "Příběhy naděje z celého Česka",
      subtitle: "Každý bod na mapě představuje skutečný příběh pomoči",
      description: "Objevte inspirativní příběhy lidí, kteří změnili svět kolem sebe k lepšímu. Kliknutím na jednotlivé prvky se dozvíte více o jejich cestě.",
      callToAction: "Klikněte na ikony pro inspirativní příběhy",
      counter: "lidí pomohlo tento týden",
      exploreStories: "Prozkoumat příběhy",
      discoverMore: "Objevit další",
      storyCategories: {
        community: "Komunitní pomoc",
        individual: "Osobní příběhy", 
        family: "Rodinná solidarita",
        volunteer: "Dobrovolnictví"
      },
      seasonInfo: {
        spring: "🌸 Jarní obnova - nové příběhy naděje",
        summer: "☀️ Letní energie - aktivní pomoc",
        autumn: "🍂 Podzimní sklizeň - vděčnost za dobro",
        winter: "❄️ Zimní péče - teplo lidskosti"
      }
    },
    english: {
      title: "Stories of Hope from All Over Czechia",
      subtitle: "Every point on the map represents a real story of help",
      description: "Discover inspiring stories of people who changed the world around them for the better. Click on individual elements to learn more about their journey.",
      callToAction: "Click on icons for inspiring stories",
      counter: "people helped this week",
      exploreStories: "Explore Stories",
      discoverMore: "Discover More",
      storyCategories: {
        community: "Community Help",
        individual: "Personal Stories",
        family: "Family Solidarity", 
        volunteer: "Volunteering"
      },
      seasonInfo: {
        spring: "🌸 Spring renewal - new stories of hope",
        summer: "☀️ Summer energy - active help",
        autumn: "🍂 Autumn harvest - gratitude for good",
        winter: "❄️ Winter care - warmth of humanity"
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
          category: "community",
          season: ["spring", "summer"]
        },
        {
          name: "Tomáš H.",
          location: "Brno", 
          action: "Pomáhá seniorům s nákupy",
          impact: "Pravidelně pomáhá 15 seniorům",
          category: "individual",
          season: ["autumn", "winter"]
        },
        {
          name: "Anna S.",
          location: "Ostrava",
          action: "Doučuje děti zdarma",
          impact: "Pomohla 30+ dětem se vzděláním", 
          category: "volunteer",
          season: ["spring", "autumn"]
        }
      ];
    } finally {
      isLoading = false;
    }
  }
  
  // Show success story when story element is clicked
  function showSuccessStory(storyData = null) {
    if (isLoading || !successStories.length) {
      console.log('Stories not yet loaded or empty');
      return;
    }
    
    let selectedStory;
    
    if (storyData) {
      selectedStory = storyData;
    } else {
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
      selectedStory = availableStories[randomIndex];
    }
    
    currentStory = selectedStory;
    isStoryModalOpen = true;
  }
  
  // Close story modal
  function closeStoryModal() {
    isStoryModalOpen = false;
    currentStory = null;
  }
  
  // Create gentle pulse animation for story triggers
  function createStoryPulse(element) {
    if (typeof window === 'undefined' || !gsap) return;
    
    gsap.fromTo(element, 
      { scale: 1 }, 
      { 
        scale: 1.1, 
        duration: 0.3, 
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      }
    );
  }
  
  onMount(async () => {
    // Set current season
    currentSeason = getCurrentSeason();
    
    // Load success stories
    await loadSuccessStories();
    
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
    
    // Animate story elements in sequence
    gsap.fromTo('.story-element',
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        stagger: 0.15,
        ease: "back.out(1.7)",
        delay: 0.5
      }
    );
    
    // Gentle floating animation for story elements
    gsap.to('.floating-story', {
      y: -8,
      duration: 2.5,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.4
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
      <p class="czech-body mb-8 max-w-3xl mx-auto">
        {content[language].description}
      </p>
      
      <!-- Clear Call-to-Action -->
      <div class="story-discovery-banner">
        <div class="discovery-icon">📖</div>
        <p class="czech-body-large font-semibold text-czech-forest">
          {content[language].callToAction}
        </p>
      </div>
    </div>
    
    <!-- Story Discovery Map -->
    <div class="story-discovery-wrapper" class:spring={currentSeason === 'spring'} 
         class:summer={currentSeason === 'summer'} 
         class:autumn={currentSeason === 'autumn'} 
         class:winter={currentSeason === 'winter'}>
      
      <!-- Stories Header -->
      <div class="seasonal-header">
        <span class="story-indicator">
          {language === 'czech' ? '✨ Inspirace z terénu' : '✨ Inspiration from the field'}
        </span>
      </div>
      
      <div class="story-canvas">
        <!-- Story Discovery Grid -->
        <div class="story-grid">
          
          <!-- Community Stories -->
          <div class="story-category">
            <h3 class="category-title">{content[language].storyCategories.community}</h3>
            <div class="story-icons">
              <div class="story-element story-trigger floating-story" 
                   title="Klikněte pro příběh komunitní pomoci"
                   role="button"
                   tabindex="0"
                   on:click={() => showSuccessStory(successStories.find(s => s.category === 'community'))}
                   on:keydown={(e) => e.key === 'Enter' && showSuccessStory(successStories.find(s => s.category === 'community'))}>
                <div class="story-icon">🏘️</div>
                <div class="story-preview">Sousedé pomáhají sousedům</div>
              </div>
              
              <div class="story-element story-trigger floating-story" 
                   role="button"
                   tabindex="0"
                   on:click={() => showSuccessStory()}
                   on:keydown={(e) => e.key === 'Enter' && showSuccessStory()}>
                <div class="story-icon">🤝</div>
                <div class="story-preview">Místní iniciativy</div>
              </div>
            </div>
          </div>
          
          <!-- Individual Stories -->
          <div class="story-category">
            <h3 class="category-title">{content[language].storyCategories.individual}</h3>
            <div class="story-icons">
              <div class="story-element story-trigger floating-story" 
                   role="button"
                   tabindex="0"
                   on:click={() => showSuccessStory(successStories.find(s => s.category === 'individual'))}
                   on:keydown={(e) => e.key === 'Enter' && showSuccessStory(successStories.find(s => s.category === 'individual'))}>
                <div class="story-icon">👤</div>
                <div class="story-preview">Osobní cesty pomoci</div>
              </div>
              
              <div class="story-element story-trigger floating-story" 
                   role="button"
                   tabindex="0"
                   on:click={() => showSuccessStory()}
                   on:keydown={(e) => e.key === 'Enter' && showSuccessStory()}>
                <div class="story-icon">💝</div>
                <div class="story-preview">Neočekávané dobro</div>
              </div>
            </div>
          </div>
          
          <!-- Family Stories -->
          <div class="story-category">
            <h3 class="category-title">{content[language].storyCategories.family}</h3>
            <div class="story-icons">
              <div class="story-element story-trigger floating-story" 
                   role="button"
                   tabindex="0"
                   on:click={() => showSuccessStory()}
                   on:keydown={(e) => e.key === 'Enter' && showSuccessStory()}>
                <div class="story-icon">👨‍👩‍👧‍👦</div>
                <div class="story-preview">Rodinná podpora</div>
              </div>
              
              <div class="story-element story-trigger floating-story" 
                   role="button"
                   tabindex="0"
                   on:click={() => showSuccessStory()}
                   on:keydown={(e) => e.key === 'Enter' && showSuccessStory()}>
                <div class="story-icon">🏠</div>
                <div class="story-preview">Domácí péče</div>
              </div>
            </div>
          </div>
          
          <!-- Volunteer Stories -->
          <div class="story-category">
            <h3 class="category-title">{content[language].storyCategories.volunteer}</h3>
            <div class="story-icons">
              <div class="story-element story-trigger floating-story" 
                   role="button"
                   tabindex="0"
                   on:click={() => showSuccessStory(successStories.find(s => s.category === 'volunteer'))}
                   on:keydown={(e) => e.key === 'Enter' && showSuccessStory(successStories.find(s => s.category === 'volunteer'))}>
                <div class="story-icon">🎓</div>
                <div class="story-preview">Vzdělávací podpora</div>
              </div>
              
              <div class="story-element story-trigger floating-story" 
                   role="button"
                   tabindex="0"
                   on:click={() => showSuccessStory()}
                   on:keydown={(e) => e.key === 'Enter' && showSuccessStory()}>
                <div class="story-icon">🌟</div>
                <div class="story-preview">Dobrovolnické projekty</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Community Impact Stats -->
        <div class="impact-stats">
          <div class="stat-item">
            <div class="stat-icon">📚</div>
            <div class="stat-number">{totalCommunityActions}</div>
            <div class="stat-label">{content[language].counter}</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">❤️</div>
            <div class="stat-number">{successStories.length}</div>
            <div class="stat-label">
              {language === 'czech' ? 'zdokumentovaných příběhů' : 'documented stories'}
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">🏘️</div>
            <div class="stat-number">{Math.floor(totalCommunityActions / 10)}</div>
            <div class="stat-label">
              {language === 'czech' ? 'aktivních komunit' : 'active communities'}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Inspirational Quote (Enhanced & Better Aligned) -->
      <div class="havel-quote-enhanced">
        <div class="quote-icon">💝</div>
        <blockquote class="quote-text">
          {language === 'czech' 
            ? '"Malé skutky laskavosti mění svět více než velká slova."'
            : '"Small acts of kindness change the world more than big words."'}
        </blockquote>
        <cite class="quote-author">— Unknown</cite>
        <div class="quote-icon">💝</div>
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
  .story-discovery-wrapper {
    position: relative;
    max-width: 1000px;
    margin: 0 auto;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(46, 93, 49, 0.15);
    background: var(--warm-stone);
    transition: all 0.6s ease;
  }
  
  /* Seasonal Theming */
  .story-discovery-wrapper.spring {
    background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%);
  }
  
  .story-discovery-wrapper.summer {
    background: linear-gradient(135deg, #fff9e6 0%, #f5f0e8 100%);
  }
  
  .story-discovery-wrapper.autumn {
    background: linear-gradient(135deg, #faf5f0 0%, #f0e6d6 100%);
  }
  
  .story-discovery-wrapper.winter {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  }
  
  .seasonal-header {
    text-align: center;
    padding: 1.5rem 2rem 0;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
  }
  
  .story-indicator {
    font-size: 1.1rem;
    color: var(--czech-forest);
    font-weight: 500;
    padding: 0.5rem 1rem;
    background: var(--bg-accent);
    border-radius: 20px;
    border: 1px solid var(--subtle-border);
  }
  
  .story-canvas {
    position: relative;
    padding: 2rem;
    overflow: hidden;
  }
  
  /* Story Discovery Grid */
  .story-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }
  
  .story-category {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid var(--subtle-border);
    transition: all 0.3s ease;
  }
  
  .story-category:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(46, 93, 49, 0.1);
  }
  
  .category-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--czech-forest);
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .story-icons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .story-element {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    text-align: center;
    min-width: 120px;
    position: relative;
    overflow: hidden;
  }
  
  .story-element:hover {
    transform: translateY(-3px);
    border-color: var(--czech-forest-light);
    box-shadow: 0 6px 20px rgba(46, 93, 49, 0.2);
  }
  
  .story-element:focus {
    outline: 2px solid var(--czech-forest);
    outline-offset: 2px;
  }
  
  .story-element::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(176, 141, 87, 0.1), transparent);
    transition: left 0.5s;
  }
  
  .story-element:hover::before {
    left: 100%;
  }
  
  .story-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    display: block;
  }
  
  .story-preview {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 500;
    line-height: 1.3;
  }
  
  /* Impact Stats */
  .impact-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 16px 16px 0 0;
    margin-top: 1rem;
  }
  
  .stat-item {
    text-align: center;
    padding: 1.5rem 1rem;
    background: var(--bg-accent);
    border-radius: 12px;
    border: 1px solid var(--subtle-border);
    transition: all 0.3s ease;
  }
  
  .stat-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(46, 93, 49, 0.15);
  }
  
  .stat-icon {
    font-size: 2.2rem;
    margin-bottom: 0.75rem;
    display: block;
  }
  
  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: var(--czech-forest);
    line-height: 1;
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  /* Enhanced Havel Quote */
  .havel-quote-enhanced {
    background: linear-gradient(135deg, var(--bg-accent) 0%, rgba(255, 255, 255, 0.9) 100%);
    border-radius: 16px;
    padding: 2.5rem;
    margin: 2rem 0 0;
    backdrop-filter: blur(10px);
    text-align: center;
    border: 1px solid var(--subtle-border);
    position: relative;
    overflow: hidden;
  }
  
  .havel-quote-enhanced::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--copper-detail), var(--czech-forest-light), var(--copper-detail));
  }
  
  .quote-icon {
    font-size: 1.5rem;
    color: var(--copper-detail);
    margin: 0 1rem;
  }
  
  .quote-text {
    font-size: 1.1rem;
    font-style: italic;
    color: var(--czech-forest);
    line-height: 1.6;
    margin: 1rem 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    font-weight: 400;
  }
  
  .quote-author {
    display: block;
    font-size: 0.95rem;
    color: var(--text-secondary);
    font-weight: 500;
    margin-top: 1rem;
    font-style: normal;
  }
  
  /* Story Discovery Banner */
  .story-discovery-banner {
    background: linear-gradient(135deg, rgba(46, 93, 49, 0.08) 0%, rgba(46, 93, 49, 0.04) 100%);
    border: 2px solid var(--czech-forest-light);
    border-radius: 12px;
    padding: 1.5rem 2rem;
    margin: 1.5rem auto;
    max-width: 600px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    animation: gentle-pulse 4s ease-in-out infinite;
  }
  
  .discovery-icon {
    font-size: 1.5rem;
    color: var(--czech-forest);
  }
  
  @keyframes gentle-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .story-canvas {
      padding: 1.5rem 1rem;
    }
    
    .story-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    
    .story-category {
      padding: 1rem;
    }
    
    .story-icons {
      gap: 0.75rem;
    }
    
    .story-element {
      min-width: 100px;
      padding: 0.75rem;
    }
    
    .story-icon {
      font-size: 1.5rem;
    }
    
    .story-preview {
      font-size: 0.8rem;
    }
    
    .impact-stats {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 1.5rem;
    }
    
    .stat-item {
      padding: 1rem;
    }
    
    .stat-icon {
      font-size: 1.8rem;
    }
    
    .stat-number {
      font-size: 1.6rem;
    }
    
    .havel-quote-enhanced {
      padding: 1.5rem;
      margin: 1rem 0 0;
    }
    
    .quote-text {
      font-size: 1rem;
    }
    
    .quote-icon {
      display: none;
    }
    
    .story-discovery-banner {
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      margin: 1rem auto;
    }
  }
  
  @media (max-width: 900px) {
    .story-discovery-wrapper {
      max-width: 100%;
      border-radius: 16px;
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .story-element,
    .stat-item,
    .story-category {
      transition: none;
    }
    
    .gentle-pulse,
    .floating-story {
      animation: none;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .story-element,
    .stat-item,
    .story-category {
      border-width: 2px;
    }
    
    .story-element:hover,
    .stat-item:hover {
      border-color: #000;
    }
  }
</style> 