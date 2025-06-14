<script>
  import { currentLanguage } from '../lib/stores.js';
  
  let language = 'czech';
  let isExpanded = false;
  
  currentLanguage.subscribe(value => {
    language = value;
  });

  const helpResources = {
    czech: {
      title: "Potřebujete okamžitou pomoc?",
      subtitle: "Důvěryhodné linky a služby dostupné 24/7",
      resources: [
        {
          name: "Linka bezpečí",
          phone: "116 111",
          description: "Pro děti a mladé do 26 let",
          available: "24/7 zdarma"
        },
        {
          name: "Krizová intervence",
          phone: "283 892 772",
          description: "Praha - psychologická pomoc",
          available: "24/7"
        },
        {
          name: "Centrum krizové intervence",
          phone: "241 484 149",
          description: "Ostrava - krizová pomoc",
          available: "24/7"
        },
        {
          name: "SOS linka",
          phone: "596 618 908",
          description: "Brno - psychosociální pomoc",
          available: "24/7"
        },
        {
          name: "Člověk v tísni",
          phone: "775 285 088",
          description: "Sociální poradenství",
          available: "Po-Pá 9-17"
        }
      ],
      toggleText: isExpanded ? "Skrýt linky pomoci" : "Zobrazit linky pomoci",
      emergencyNote: "V akutní nouzi volejte 155 (záchranná služba) nebo 158 (policie)"
    },
    english: {
      title: "Need immediate help?",
      subtitle: "Trusted 24/7 support services",
      resources: [
        {
          name: "Safety Line",
          phone: "116 111",
          description: "For children and youth up to 26",
          available: "24/7 free"
        },
        {
          name: "Crisis Intervention",
          phone: "283 892 772",
          description: "Prague - psychological help",
          available: "24/7"
        },
        {
          name: "Crisis Center",
          phone: "241 484 149",
          description: "Ostrava - crisis support",
          available: "24/7"
        },
        {
          name: "SOS Line",
          phone: "596 618 908",
          description: "Brno - psychosocial help",
          available: "24/7"
        },
        {
          name: "People in Need",
          phone: "775 285 088",
          description: "Social counseling",
          available: "Mon-Fri 9-17"
        }
      ],
      toggleText: isExpanded ? "Hide help lines" : "Show help lines",
      emergencyNote: "For acute emergency call 155 (ambulance) or 158 (police)"
    }
  };

  function toggleHelp() {
    isExpanded = !isExpanded;
  }
</script>

<div class="immediate-help" class:expanded={isExpanded}>
  <div class="help-header" role="button" tabindex="0" on:click={toggleHelp} on:keydown={(e) => e.key === 'Enter' && toggleHelp()}>
    <div class="help-icon">🆘</div>
    <div class="help-text">
      <h4>{helpResources[language].title}</h4>
      <p>{helpResources[language].subtitle}</p>
    </div>
    <button class="toggle-button" aria-label={helpResources[language].toggleText}>
      <svg class="chevron" class:rotated={isExpanded} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>
  </div>
  
  {#if isExpanded}
    <div class="help-content">
      <div class="resources-grid">
        {#each helpResources[language].resources as resource}
          <div class="resource-card">
            <div class="resource-header">
              <strong class="resource-name">{resource.name}</strong>
              <span class="resource-availability">{resource.available}</span>
            </div>
            <a href="tel:{resource.phone}" class="resource-phone">
              📞 {resource.phone}
            </a>
            <p class="resource-description">{resource.description}</p>
          </div>
        {/each}
      </div>
      
      <div class="emergency-note">
        <div class="emergency-icon">⚠️</div>
        <p>{helpResources[language].emergencyNote}</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .immediate-help {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--bg-primary);
    border: 2px solid var(--copper-detail);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(46, 93, 49, 0.15);
    z-index: 50;
    max-width: 400px;
    transition: all var(--timing-medium) var(--ease-gentle);
    backdrop-filter: blur(8px);
  }

  .expanded {
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .help-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    cursor: pointer;
    transition: all var(--timing-quick) var(--ease-gentle);
  }

  .help-header:hover {
    background: var(--bg-accent);
  }

  .help-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .help-text {
    flex: 1;
  }

  .help-text h4 {
    margin: 0 0 0.25rem 0;
    color: var(--czech-forest);
    font-size: 1rem;
    font-weight: 600;
  }

  .help-text p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .toggle-button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--czech-forest);
    transition: transform var(--timing-quick) var(--ease-gentle);
  }

  .chevron {
    transition: transform var(--timing-medium) var(--ease-gentle);
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  .help-content {
    border-top: 1px solid var(--subtle-border);
    padding: 1.5rem;
  }

  .resources-grid {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .resource-card {
    padding: 1rem;
    background: var(--bg-accent);
    border-radius: 8px;
    border: 1px solid var(--subtle-border);
  }

  .resource-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }

  .resource-name {
    color: var(--czech-forest);
    font-size: 0.95rem;
  }

  .resource-availability {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-align: right;
  }

  .resource-phone {
    display: inline-block;
    color: var(--czech-forest);
    text-decoration: none;
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    transition: color var(--timing-quick) var(--ease-gentle);
  }

  .resource-phone:hover {
    color: var(--copper-detail);
  }

  .resource-description {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .emergency-note {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(176, 141, 87, 0.1);
    border-radius: 8px;
    border-left: 4px solid var(--copper-detail);
  }

  .emergency-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .emergency-note p {
    margin: 0;
    color: var(--text-primary);
    font-size: 0.9rem;
    font-weight: 500;
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .immediate-help {
      bottom: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
    }

    .expanded {
      max-width: none;
    }

    .help-header {
      padding: 1rem;
    }

    .help-content {
      padding: 1rem;
    }

    .resources-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .immediate-help,
    .help-header,
    .toggle-button,
    .chevron {
      transition: none;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .immediate-help {
      border-width: 3px;
    }
    
    .resource-card {
      border-width: 2px;
    }
  }
</style> 