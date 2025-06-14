<script>
  import { createEventDispatcher } from 'svelte';
  import { currentLanguage } from '../lib/stores.js';
  
  const dispatch = createEventDispatcher();
  
  let language = 'czech';
  let isOpen = false;
  
  // Subscribe to language changes
  currentLanguage.subscribe(value => {
    language = value;
  });
  
  const languages = {
    czech: { code: 'cs', flag: '🇨🇿', name: 'Čeština', shortName: 'CZ', nativeName: 'Čeština' },
    english: { code: 'en', flag: '🇺🇸', name: 'English', shortName: 'EN', nativeName: 'English' }
  };
  
  function toggleDropdown() {
    isOpen = !isOpen;
  }
  
  function selectLanguage(lang) {
    currentLanguage.set(lang);
    isOpen = false;
    
    // Update URL without reload (only on client)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url);
    }
    
    dispatch('languageChange', { language: lang });
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      isOpen = false;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleDropdown();
    }
  }
  
  function handleKeydownOption(event, lang) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectLanguage(lang);
    }
  }
  
  // Close dropdown when clicking outside
  function handleClickOutside(event) {
    if (!event.target.closest('.language-toggle')) {
      isOpen = false;
    }
  }
  
  // Mount click outside listener
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleClickOutside);
  }
</script>

<div class="language-toggle" class:open={isOpen}>
  <button
    class="toggle-button"
    on:click={toggleDropdown}
    on:keydown={handleKeydown}
    aria-label="Vyberte jazyk / Select language"
    aria-expanded={isOpen}
    aria-haspopup="listbox"
  >
    <span class="current-language">
      <span class="flag">{languages[language].flag}</span>
      <span class="code">{languages[language].shortName}</span>
    </span>
    <span class="dropdown-arrow" class:rotated={isOpen}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 4.5l3 3 3-3"/>
      </svg>
    </span>
  </button>
  
  {#if isOpen}
    <div class="dropdown-menu" role="listbox">
      {#each Object.entries(languages) as [key, lang]}
        <button
          class="dropdown-option"
          class:active={language === key}
          on:click={() => selectLanguage(key)}
          on:keydown={(e) => handleKeydownOption(e, key)}
          role="option"
          aria-selected={language === key}
        >
          <span class="flag">{lang.flag}</span>
          <span class="name">{lang.name}</span>
          {#if language === key}
            <span class="checkmark">✓</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .language-toggle {
    position: relative;
    z-index: 1000;
  }
  
  .toggle-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid var(--subtle-border);
    border-radius: 8px;
    cursor: pointer;
    transition: all var(--timing-medium) var(--ease-gentle);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-primary);
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .toggle-button:hover {
    background: rgba(255, 255, 255, 1);
    border-color: var(--czech-forest-light);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .toggle-button:focus {
    outline: 2px solid var(--copper-detail);
    outline-offset: 2px;
  }
  
  .current-language {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .flag {
    font-size: 1.1rem;
  }
  
  .code {
    font-weight: 600;
    color: var(--czech-forest);
  }
  
  .dropdown-arrow {
    display: flex;
    align-items: center;
    transition: transform var(--timing-medium) var(--ease-gentle);
    color: var(--text-secondary);
  }
  
  .dropdown-arrow.rotated {
    transform: rotate(180deg);
  }
  
  /* Dropdown Menu */
  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid var(--subtle-border);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    min-width: 160px;
    backdrop-filter: blur(8px);
    animation: dropdownAppear 0.2s ease-out;
  }
  
  @keyframes dropdownAppear {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .dropdown-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 16px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background-color var(--timing-quick) var(--ease-gentle);
    color: var(--text-primary);
    font-size: 0.9rem;
  }
  
  .dropdown-option:hover {
    background-color: var(--bg-accent);
  }
  
  .dropdown-option:focus {
    background-color: var(--bg-accent);
    outline: none;
  }
  
  .dropdown-option.active {
    background-color: var(--bg-accent);
    color: var(--czech-forest);
    font-weight: 500;
  }
  
  .dropdown-option .name {
    flex: 1;
  }
  
  .checkmark {
    color: var(--czech-forest);
    font-weight: bold;
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    .toggle-button {
      padding: 6px 10px;
      font-size: 0.8rem;
    }
    
    .dropdown-menu {
      min-width: 140px;
    }
    
    .dropdown-option {
      padding: 10px 12px;
      font-size: 0.85rem;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .toggle-button {
      border-width: 2px;
    }
    
    .dropdown-menu {
      border-width: 2px;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .toggle-button,
    .dropdown-arrow,
    .dropdown-option {
      transition: none;
    }
    
    .dropdown-menu {
      animation: none;
    }
  }
</style> 