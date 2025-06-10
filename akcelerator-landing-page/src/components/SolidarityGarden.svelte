<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { fetchStreamlitData } from '../lib/streamlit-integration.js';
  
  gsap.registerPlugin(ScrollTrigger);
  
  let gardenContainer;
  let p5Instance;
  let gardenCanvas;
  let seedsPlanted = 0;
  let totalCommunityActions = 247;
  
  const actionTypes = {
    tree: {
      name: "Pomoc seniorům",
      color: "#4A7C59",
      growth: "🌳",
      impact: "lidé pomoženi",
      icon: "💚"
    },
    flower: {
      name: "Vzdělávání dětí", 
      color: "#B08D57",
      growth: "🌻",
      impact: "děti doučovány",
      icon: "📚"
    },
    herb: {
      name: "Ochrana přírody",
      color: "#8B7355", 
      growth: "🌿",
      impact: "akce realizovány",
      icon: "🌍"
    },
    mushroom: {
      name: "Krizová pomoc",
      color: "#2E5D31",
      growth: "🍄",
      impact: "lidé podpořeni",
      icon: "💚"
    }
  };
  
  let plantedItems = [];
  let currentLanguage = 'czech';
  
  const content = {
    czech: {
      title: "Zasaď semínko pomoci",
      subtitle: "Každé kliknutí představuje skutečnou akci solidarity",
      instruction: "Klikni na půdu a sleduj, jak roste tvá pomoc",
      counter: "lidí zasadilo semínko tento týden",
      celebration: "Krásně! Tvé semínko pomoci roste!"
    },
    english: {
      title: "Plant a Seed of Help",
      subtitle: "Every click represents real solidarity action",
      instruction: "Click on the soil and watch your help grow",
      counter: "people planted seeds this week",
      celebration: "Beautiful! Your seed of help is growing!"
    }
  };
  
  function createP5Garden() {
    const sketch = (p) => {
      let soil, seeds = [], plants = [];
      let mousePressed = false;
      
      p.setup = () => {
        const canvas = p.createCanvas(800, 400);
        canvas.parent(gardenCanvas);
        
        // Create soil gradient
        soil = p.createGraphics(800, 400);
        for (let i = 0; i < 400; i++) {
          let alpha = p.map(i, 0, 400, 0.1, 0.8);
          soil.fill(139, 115, 85, alpha * 255); // Moravian earth color
          soil.noStroke();
          soil.rect(0, i, 800, 1);
        }
        
        // Add texture dots
        for (let i = 0; i < 200; i++) {
          soil.fill(123, 101, 75, p.random(50, 150));
          soil.circle(p.random(800), p.random(200, 400), p.random(2, 4));
        }
      };
      
      p.draw = () => {
        p.background(245, 241, 232); // Warm stone background
        p.image(soil, 0, 0);
        
        // Draw planted items
        plants.forEach(plant => {
          plant.update();
          plant.display();
        });
        
        // Add gentle wind effect
        let wind = p.sin(p.frameCount * 0.01) * 2;
        plants.forEach(plant => {
          if (plant.grown) {
            plant.x += wind * 0.1;
          }
        });
      };
      
      p.mousePressed = () => {
        if (p.mouseX > 0 && p.mouseX < 800 && p.mouseY > 200 && p.mouseY < 400) {
          plantSeed(p.mouseX, p.mouseY);
        }
      };
      
      class Plant {
        constructor(x, y, type) {
          this.x = x;
          this.y = y;
          this.type = type;
          this.size = 0;
          this.targetSize = p.random(20, 40);
          this.grown = false;
          this.color = actionTypes[type].color;
          this.growth = actionTypes[type].growth;
        }
        
        update() {
          if (this.size < this.targetSize) {
            this.size += 0.5;
          } else {
            this.grown = true;
          }
        }
        
        display() {
          // Draw stem
          p.stroke(74, 124, 89);
          p.strokeWeight(2);
          p.line(this.x, this.y, this.x, this.y - this.size);
          
          // Draw plant top
          p.fill(this.color);
          p.noStroke();
          let topSize = this.size * 0.3;
          p.circle(this.x, this.y - this.size, topSize);
          
          // Add emoji when grown
          if (this.grown && this.size > 30) {
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(16);
            p.text(this.growth, this.x, this.y - this.size);
          }
        }
      }
      
      function plantSeed(x, y) {
        const types = Object.keys(actionTypes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        plants.push(new Plant(x, y, randomType));
        
        // Trigger celebration
        seedsPlanted++;
        showCelebration(randomType);
      }
    };
    
    return new p5(sketch);
  }
  
  function showCelebration(type) {
    const action = actionTypes[type];
    const celebrationEl = document.createElement('div');
    celebrationEl.className = 'seed-celebration';
    celebrationEl.innerHTML = `
      <div class="celebration-content">
        ${action.icon} ${action.name}<br>
        <small>+1 ${action.impact}</small>
      </div>
    `;
    
    gardenContainer.appendChild(celebrationEl);
    
    // Animate celebration
    gsap.fromTo(celebrationEl, 
      { 
        opacity: 0, 
        scale: 0.5, 
        y: 20 
      },
      { 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        duration: 0.5,
        ease: "back.out(1.7)",
        onComplete: () => {
          gsap.to(celebrationEl, {
            opacity: 0,
            scale: 0.8,
            y: -20,
            duration: 0.5,
            delay: 2,
            onComplete: () => celebrationEl.remove()
          });
        }
      }
    );
    
    // Update counter with animation
    gsap.to({ count: totalCommunityActions }, {
      count: totalCommunityActions + 1,
      duration: 1,
      ease: "power2.out",
      onUpdate: function() {
        totalCommunityActions = Math.round(this.targets()[0].count);
      },
      onComplete: () => {
        totalCommunityActions += 1;
      }
    });
  }
  
  onMount(async () => {
    // Fetch real data from Streamlit backend
    try {
      const data = await fetchStreamlitData();
      totalCommunityActions = data.weeklyActions || 247;
    } catch (error) {
      console.log('Using fallback data for garden');
    }
    
    // Initialize p5 garden
    p5Instance = createP5Garden();
    
    // ScrollTrigger animation
    gsap.fromTo(gardenContainer, 
      { 
        opacity: 0,
        y: 50 
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: gardenContainer,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );
    
    return () => {
      if (p5Instance) {
        p5Instance.remove();
      }
    };
  });
</script>

<section bind:this={gardenContainer} id="solidarity-garden" class="czech-section">
  <div class="czech-container">
    <!-- Header -->
    <div class="czech-text-center mb-12">
      <h2 class="czech-heading-lg mb-4">
        {content[currentLanguage].title}
      </h2>
      <p class="czech-body-large mb-2 max-w-2xl mx-auto">
        {content[currentLanguage].subtitle}
      </p>
      <p class="czech-body opacity-70">
        {content[currentLanguage].instruction}
      </p>
    </div>
    
    <!-- Garden Canvas -->
    <div class="garden-wrapper">
      <div bind:this={gardenCanvas} class="garden-canvas"></div>
      
      <!-- Action Type Legend -->
      <div class="action-legend">
        {#each Object.entries(actionTypes) as [key, action]}
          <div class="legend-item">
            <span class="legend-icon">{action.icon}</span>
            <span class="legend-text">{action.name}</span>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Community Counter -->
    <div class="community-stats">
      <div class="stat-circle">
        <div class="stat-number">{totalCommunityActions}</div>
        <div class="stat-label">{content[currentLanguage].counter}</div>
      </div>
      
      {#if seedsPlanted > 0}
        <div class="personal-contribution">
          <span class="czech-body">
            Ty jsi přidal/a: <strong>{seedsPlanted}</strong> semínek
          </span>
        </div>
      {/if}
    </div>
    
    <!-- Václav Havel Quote -->
    <div class="havel-quote">
      <blockquote class="czech-body italic">
        "Naděje není přesvědčení, že něco dopadne dobře, ale jistota, že má něco smysl, 
        bez ohledu na to, jak to dopadne."
      </blockquote>
      <cite class="text-sm opacity-70">— Václav Havel</cite>
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
    box-shadow: 0 8px 32px rgba(46, 93, 49, 0.15);
    background: var(--warm-stone);
  }
  
  .garden-canvas {
    width: 100%;
    height: 400px;
    cursor: crosshair;
    position: relative;
  }
  
  .action-legend {
    display: flex;
    justify-content: space-around;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.9);
    border-top: 1px solid var(--subtle-border);
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
  
  .legend-icon {
    font-size: 1.2rem;
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
  
  .personal-contribution {
    background: var(--quiet-celebration);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    display: inline-block;
    margin-top: 1rem;
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
  
  :global(.seed-celebration) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-primary);
    border: 2px solid var(--czech-forest-light);
    border-radius: 12px;
    padding: 1rem;
    text-align: center;
    box-shadow: 0 8px 24px rgba(46, 93, 49, 0.2);
    z-index: 10;
    pointer-events: none;
  }
  
  :global(.celebration-content) {
    font-weight: 500;
    color: var(--czech-forest);
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    .garden-canvas {
      height: 300px;
    }
    
    .action-legend {
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .legend-item {
      font-size: 0.8rem;
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
  
  /* Responsive canvas */
  @media (max-width: 900px) {
    .garden-wrapper {
      max-width: 100%;
    }
  }
</style> 