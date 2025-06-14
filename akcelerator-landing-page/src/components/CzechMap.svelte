<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { currentLanguage } from '../lib/stores.js';
  
  gsap.registerPlugin(ScrollTrigger);
  
  let mapContainer;
  let selectedRegion = null;
  let language = 'czech';
  
  // Subscribe to language changes
  currentLanguage.subscribe(value => {
    language = value;
  });
  
  const regions = {
    prague: {
      name: {
        czech: "Praha",
        english: "Prague"
      },
      title: {
        czech: "Pražská inovace v pomoci",
        english: "Prague Innovation in Helping"
      },
      description: {
        czech: "Tech komunita spojuje síly pro sociální změnu",
        english: "Tech community joins forces for social change"
      },
      stats: {
        czech: "124 akcí tento měsíc",
        english: "124 actions this month"
      },
      actions: {
        czech: [
          "Doučování programování pro děti",
          "IT podpora pro neziskovky",
          "Startupové mentorství"
        ],
        english: [
          "Programming tutoring for children",
          "IT support for nonprofits",
          "Startup mentorship"
        ]
      },
      color: "#4A7C59",
      x: 340,
      y: 180
    },
    brno: {
      name: {
        czech: "Brno",
        english: "Brno"
      },
      title: {
        czech: "Moravská tradice vzájemnosti",
        english: "Moravian Tradition of Solidarity"
      },
      description: {
        czech: "Univerzitní město s bohatou kulturou solidarity",
        english: "University city with rich culture of solidarity"
      },
      stats: {
        czech: "89 akcí tento měsíc",
        english: "89 actions this month"
      },
      actions: {
        czech: [
          "Studentské doučování",
          "Kulturní akce pro seniory",
          "Komunitní zahrady"
        ],
        english: [
          "Student tutoring",
          "Cultural events for seniors",
          "Community gardens"
        ]
      },
      color: "#B08D57",
      x: 380,
      y: 260
    },
    ostrava: {
      name: {
        czech: "Ostrava",
        english: "Ostrava"
      },
      title: {
        czech: "Slezská solidarita",
        english: "Silesian Solidarity"
      },
      description: {
        czech: "Průmyslové město s velkým srdcem",
        english: "Industrial city with a big heart"
      },
      stats: {
        czech: "67 akcí tento měsíc",
        english: "67 actions this month"
      },
      actions: {
        czech: [
          "Podpora horníků v nouzi",
          "Rekvalifikační kurzy",
          "Pomoc ukrajinským rodinám"
        ],
        english: [
          "Support for miners in need",
          "Retraining courses",
          "Help for Ukrainian families"
        ]
      },
      color: "#8B7355",
      x: 450,
      y: 200
    }
  };
  
  const content = {
    czech: {
      title: "Pomoc napříč Českem",
      subtitle: "Každý region má svou jedinečnou kulturu solidarity",
      selectRegion: "Klikni na region a poznej místní iniciativy",
      viewActions: "Zobrazit akce",
      localInitiatives: "Místní iniciativy:",
      clickAnyCity: "Klikni na kterékoli město na mapě",
      historicalContext: {
        neighborHelp: {
          title: "Tradice pomoci sousedům",
          subtitle: "Od moravských brigád po pražské sokolstvo - Čechům pomoc není cizí"
        },
        modernSolidarity: {
          title: "Moderní solidarita",
          subtitle: "Tech komunity, studentské organizace a občanské iniciativy spojují síly"
        },
        practicalApproach: {
          title: "Praktický přístup",
          subtitle: "Méně řečí, více činů - český způsob dělání dobra"
        }
      }
    },
    english: {
      title: "Help Across Czechia",
      subtitle: "Each region has its unique culture of solidarity",
      selectRegion: "Click on a region to discover local initiatives",
      viewActions: "View Actions",
      localInitiatives: "Local initiatives:",
      clickAnyCity: "Click on any city on the map",
      historicalContext: {
        neighborHelp: {
          title: "Tradition of Helping Neighbors",
          subtitle: "From Moravian brigades to Prague sokol movement - helping is not foreign to Czechs"
        },
        modernSolidarity: {
          title: "Modern Solidarity",
          subtitle: "Tech communities, student organizations and civic initiatives join forces"
        },
        practicalApproach: {
          title: "Practical Approach",
          subtitle: "Less talk, more action - the Czech way of doing good"
        }
      }
    }
  };
  
  function selectRegion(regionKey) {
    selectedRegion = regionKey;
    
    // Animate selection (only on client)
    if (typeof document !== 'undefined' && gsap) {
      const pulseElements = document.querySelectorAll('.regional-pulse');
      pulseElements.forEach(el => {
        if (el.dataset.region === regionKey) {
          gsap.to(el, {
            scale: 1.3,
            duration: 0.3,
            ease: "back.out(1.7)"
          });
        } else {
          gsap.to(el, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      });
      
      // Animate info panel
      const infoPanel = document.querySelector('.region-info');
      if (infoPanel) {
        gsap.fromTo(infoPanel, 
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
        );
      }
    }
  }
  
  function openRegionalApp(region) {
    const url = `https://akcelerator-altruismu.streamlit.app?lang=czech&region=${region}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }
  
  onMount(() => {
    // ScrollTrigger animation for map reveal
    gsap.fromTo(mapContainer,
      { opacity: 0, scale: 0.8 },
      {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: mapContainer,
          start: "top 70%",
          end: "bottom 30%",
          toggleActions: "play none none reverse"
        }
      }
    );
    
    // Animate pulses with staggered timing
    gsap.fromTo('.regional-pulse',
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 0.8,
        duration: 0.8,
        stagger: 0.2,
        ease: "back.out(1.7)",
        delay: 0.5,
        scrollTrigger: {
          trigger: mapContainer,
          start: "top 70%"
        }
      }
    );
  });
</script>

<section bind:this={mapContainer} id="czech-map" class="czech-section">
  <div class="czech-container">
    <!-- Header -->
    <div class="czech-text-center mb-12">
      <h2 class="czech-heading-lg mb-4">
        {content[language].title}
      </h2>
      <p class="czech-body-large mb-2 max-w-2xl mx-auto">
        {content[language].subtitle}
      </p>
      <p class="czech-body opacity-70">
        {content[language].selectRegion}
      </p>
    </div>
    
    <!-- Map Container -->
    <div class="map-container">
      <!-- Czech Republic SVG Map -->
      <div class="czech-map-svg">
        <svg viewBox="0 0 800 500" class="w-full h-auto">
          <!-- Simplified Czech Republic outline -->
          <path
            d="M120,200 L180,150 L250,140 L320,160 L380,150 L450,170 L520,160 L580,180 L620,220 L600,280 L550,320 L480,340 L420,350 L360,340 L300,330 L240,320 L180,300 L140,260 Z"
            fill="var(--bohemian-mist)"
            stroke="var(--czech-forest-light)"
            stroke-width="2"
            class="country-outline"
          />
          
          <!-- Regional Pulses -->
          {#each Object.entries(regions) as [key, region]}
            <circle
              cx={region.x}
              cy={region.y}
              r="12"
              fill={region.color}
              class="regional-pulse"
              data-region={key}
              on:click={() => selectRegion(key)}
              on:keydown={(e) => e.key === 'Enter' && selectRegion(key)}
              tabindex="0"
              role="button"
              aria-label={language === 'czech' ? `Vybrat ${region.name[language]}` : `Select ${region.name[language]}`}
            />
            
            <!-- Region Labels -->
            <text
              x={region.x}
              y={region.y + 25}
              text-anchor="middle"
              class="region-label"
              fill="var(--text-primary)"
              font-size="14"
              font-weight="500"
            >
              {region.name[language]}
            </text>
          {/each}
          
          <!-- Connecting Lines (showing solidarity network) -->
          <g class="solidarity-network" opacity="0.3">
            <line x1="340" y1="180" x2="380" y2="260" stroke="var(--czech-forest-light)" stroke-width="1" stroke-dasharray="5,5"/>
            <line x1="380" y1="260" x2="450" y2="200" stroke="var(--czech-forest-light)" stroke-width="1" stroke-dasharray="5,5"/>
            <line x1="340" y1="180" x2="450" y2="200" stroke="var(--czech-forest-light)" stroke-width="1" stroke-dasharray="5,5"/>
          </g>
        </svg>
      </div>
      
      <!-- Region Information Panel -->
      {#if selectedRegion}
        <div class="region-info">
          <div class="info-header">
            <h3 class="czech-heading-md mb-2">
              {regions[selectedRegion].title[language]}
            </h3>
            <p class="czech-body mb-4">
              {regions[selectedRegion].description[language]}
            </p>
            <div class="region-stats">
              <span class="stat-badge">{regions[selectedRegion].stats[language]}</span>
            </div>
          </div>
          
          <div class="regional-actions">
            <h4 class="czech-body font-semibold mb-3">{content[language].localInitiatives}</h4>
            <ul class="action-list">
              {#each regions[selectedRegion].actions[language] as action}
                <li class="action-item">
                  <span class="action-bullet" style="background-color: {regions[selectedRegion].color}"></span>
                  {action}
                </li>
              {/each}
            </ul>
            
            <button 
              class="czech-button-primary mt-4"
              on:click={() => openRegionalApp(selectedRegion)}
            >
              {content[language].viewActions}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      {:else}
        <div class="map-placeholder">
          <div class="placeholder-content">
            <div class="pulse-demo">
              <div class="demo-pulse" style="background-color: var(--czech-forest);"></div>
              <div class="demo-pulse" style="background-color: var(--copper-detail); animation-delay: 0.5s;"></div>
              <div class="demo-pulse" style="background-color: var(--moravian-earth); animation-delay: 1s;"></div>
            </div>
            <p class="czech-body opacity-70 mt-4">
              {content[language].clickAnyCity}
            </p>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Historical Context -->
    <div class="historical-context">
      <div class="context-card">
        <div class="context-icon">🏘️</div>
        <div class="context-text">
          <h4 class="czech-body font-semibold">{content[language].historicalContext.neighborHelp.title}</h4>
          <p class="text-sm opacity-80">
            {content[language].historicalContext.neighborHelp.subtitle}
          </p>
        </div>
      </div>
      
      <div class="context-card">
        <div class="context-icon">🤝</div>
        <div class="context-text">
          <h4 class="czech-body font-semibold">{content[language].historicalContext.modernSolidarity.title}</h4>
          <p class="text-sm opacity-80">
            {content[language].historicalContext.modernSolidarity.subtitle}
          </p>
        </div>
      </div>
      
      <div class="context-card">
        <div class="context-icon">💪</div>
        <div class="context-text">
          <h4 class="czech-body font-semibold">{content[language].historicalContext.practicalApproach.title}</h4>
          <p class="text-sm opacity-80">
            {content[language].historicalContext.practicalApproach.subtitle}
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .map-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    max-width: 1000px;
    margin: 0 auto;
    align-items: start;
  }
  
  .czech-map-svg {
    position: relative;
  }
  
  .country-outline {
    transition: all var(--timing-medium) var(--ease-gentle);
  }
  
  .country-outline:hover {
    fill: var(--warm-stone);
  }
  
  .regional-pulse {
    cursor: pointer;
    transition: all var(--timing-medium) var(--ease-gentle);
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }
  
  .regional-pulse:hover {
    transform: scale(1.2);
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
  }
  
  .regional-pulse:focus {
    outline: 3px solid var(--copper-detail);
    outline-offset: 2px;
  }
  
  .region-label {
    pointer-events: none;
    font-family: 'Inter', sans-serif;
  }
  
  .solidarity-network {
    animation: networkPulse 4s ease-in-out infinite;
  }
  
  @keyframes networkPulse {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.5; }
  }
  
  .region-info {
    background: var(--bg-primary);
    border: 1px solid var(--subtle-border);
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 8px 32px rgba(46, 93, 49, 0.1);
  }
  
  .info-header {
    border-bottom: 1px solid var(--subtle-border);
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .stat-badge {
    background: var(--quiet-celebration);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--czech-forest);
  }
  
  .action-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .action-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    font-size: 0.95rem;
    color: var(--text-secondary);
  }
  
  .action-bullet {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .map-placeholder {
    background: var(--bg-secondary);
    border: 2px dashed var(--subtle-border);
    border-radius: 16px;
    padding: 3rem 2rem;
    text-align: center;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .pulse-demo {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 1rem;
  }
  
  .demo-pulse {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    animation: demoPulse 2s ease-in-out infinite;
  }
  
  @keyframes demoPulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
  
  .historical-context {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-top: 4rem;
  }
  
  .context-card {
    display: flex;
    align-items: start;
    gap: 1rem;
    background: var(--bg-accent);
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid var(--subtle-border);
    transition: all var(--timing-medium) var(--ease-gentle);
  }
  
  .context-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(46, 93, 49, 0.1);
  }
  
  .context-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }
  
  .context-text h4 {
    margin-bottom: 0.5rem;
    color: var(--czech-forest);
  }
  
  /* Mobile Optimizations */
  @media (max-width: 768px) {
    .map-container {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    
    .region-info {
      padding: 1.5rem;
    }
    
    .map-placeholder {
      height: 200px;
      padding: 2rem 1rem;
    }
    
    .historical-context {
      grid-template-columns: 1fr;
      margin-top: 2rem;
    }
    
    .context-card {
      padding: 1rem;
    }
    
    .regional-pulse {
      r: 10;
    }
    
    .region-label {
      font-size: 12px;
    }
  }
  
  /* Tablet adjustments */
  @media (max-width: 1024px) and (min-width: 769px) {
    .map-container {
      gap: 2rem;
    }
  }
</style> 