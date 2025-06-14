<script>
  import { onMount } from 'svelte';
  import { currentLanguage } from '../lib/stores.js';
  import { initScrollAnimations, cleanupAnimations } from '../lib/animations.js';
  import { inject } from '@vercel/analytics';
  import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
  import '../styles/czech-theme.css';
  
  // SEO and meta tags
  const siteData = {
    czech: {
      title: 'Akcelerátor altruismu - Praktická cesta k pomoci',
      description: 'Najdi svou cestu od empatie k praktické akci. Připoj se k tisícům Čechů, kteří už pomáhají.',
      keywords: 'altruismus, pomoc, dobrovolnictví, charita, česká solidarita'
    },
    english: {
      title: 'Altruism Accelerator - From Overwhelm to Action',
      description: 'Transform empathetic overwhelm into meaningful action. Join thousands making a difference.',
      keywords: 'altruism, helping, volunteering, charity, social impact'
    }
  };
  
  let language = 'czech';
  
  // Subscribe to language changes
  currentLanguage.subscribe(value => {
    language = value;
    updatePageMeta(value);
  });
  
  function updatePageMeta(lang) {
    if (typeof document !== 'undefined') {
      const data = siteData[lang];
      document.title = data.title;
      
      // Update meta tags
      updateMetaTag('description', data.description);
      updateMetaTag('keywords', data.keywords);
      updateMetaTag('og:title', data.title);
      updateMetaTag('og:description', data.description);
      updateMetaTag('og:locale', lang === 'czech' ? 'cs_CZ' : 'en_US');
    }
  }
  
  function updateMetaTag(name, content) {
    let meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    if (meta) {
      meta.setAttribute('content', content);
    } else {
      meta = document.createElement('meta');
      meta.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    }
  }
  
  onMount(() => {
    // Initialize Vercel Analytics for production deployment tracking
    try {
      inject();
      console.log('✅ Vercel Analytics initialized');
    } catch (error) {
      console.warn('⚠️ Vercel Analytics failed to initialize:', error);
    }

    // Initialize Vercel Speed Insights for performance monitoring
    try {
      injectSpeedInsights();
      console.log('✅ Vercel Speed Insights initialized');
    } catch (error) {
      console.warn('⚠️ Vercel Speed Insights failed to initialize:', error);
    }
    
    // Initialize animations
    initScrollAnimations();
    
    // Initialize language from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const storedLang = localStorage.getItem('preferred-language');
    
    if (urlLang && ['czech', 'english'].includes(urlLang)) {
      currentLanguage.set(urlLang);
    } else if (storedLang) {
      currentLanguage.set(storedLang);
    }
    
    // Save language preference when it changes
    const unsubscribe = currentLanguage.subscribe(lang => {
      localStorage.setItem('preferred-language', lang);
    });
    
    // Google Analytics (if needed)
    if (typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: siteData[language].title,
        page_location: window.location.href,
        custom_map: { custom_parameter_language: language }
      });
    }
    
    // Performance monitoring
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('app_loaded');
    }
    
    // Log environment diagnostics for debugging
    console.log('🔍 Environment Diagnostics:', {
      isProduction: typeof window !== 'undefined' && window.location.hostname !== 'localhost',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
    
    // Cleanup on destroy
    return () => {
      cleanupAnimations();
      unsubscribe();
    };
  });
</script>

<svelte:head>
  <!-- Primary Meta Tags -->
  <title>{siteData[language].title}</title>
  <meta name="title" content={siteData[language].title} />
  <meta name="description" content={siteData[language].description} />
  <meta name="keywords" content={siteData[language].keywords} />
  <meta name="author" content="Akcelerátor altruismu" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://akcelerator-altruismu.cz" />
  <meta property="og:title" content={siteData[language].title} />
  <meta property="og:description" content={siteData[language].description} />
  <meta property="og:image" content="/og-image-czech.jpg" />
  <meta property="og:locale" content={language === 'czech' ? 'cs_CZ' : 'en_US'} />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="https://akcelerator-altruismu.cz" />
  <meta property="twitter:title" content={siteData[language].title} />
  <meta property="twitter:description" content={siteData[language].description} />
  <meta property="twitter:image" content="/og-image-czech.jpg" />
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/favicon-czech.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon-czech.png" />
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;500;600&display=swap" rel="stylesheet" />
  
  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteData[language].title,
      "description": siteData[language].description,
      "url": "https://akcelerator-altruismu.cz",
      "inLanguage": language === 'czech' ? 'cs' : 'en',
      "publisher": {
        "@type": "Organization",
        "name": "Akcelerátor altruismu",
        "description": "Platforma pro praktickou pomoc a solidaritu v České republice"
      }
    })}
  </script>
</svelte:head>

<!-- Global Loading Styles -->
<style>
  :global(html) {
    scroll-behavior: smooth;
    font-family: 'Source Sans Pro', sans-serif;
  }
  
  :global(body) {
    margin: 0;
    padding: 0;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  :global(*) {
    box-sizing: border-box;
  }
  
  /* Loading States */
  :global(.streamlit-loading) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(245, 241, 232, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
  }
  
  :global(.loading-content) {
    text-align: center;
    color: var(--czech-forest);
  }
  
  :global(.loading-spinner) {
    width: 40px;
    height: 40px;
    border: 3px solid var(--subtle-border);
    border-top: 3px solid var(--czech-forest);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  :global(.loading-text) {
    font-size: 1.1rem;
    font-weight: 500;
    margin: 0;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Czech Celebration Styles */
  :global(.czech-celebration) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-primary);
    border: 2px solid var(--czech-forest-light);
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 12px 40px rgba(46, 93, 49, 0.2);
    z-index: 1000;
    max-width: 90vw;
    backdrop-filter: blur(8px);
  }
  
  :global(.celebration-content) {
    color: var(--czech-forest);
  }
  
  :global(.celebration-icon) {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  :global(.celebration-text) {
    font-size: 1.2rem;
    font-weight: 500;
  }
  
  /* Accessibility */
  :global(.sr-only) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  /* Focus styles */
  :global(:focus-visible) {
    outline: 3px solid var(--copper-detail);
    outline-offset: 2px;
  }
  
  /* Smooth transitions for theme changes */
  :global(*) {
    transition: color var(--timing-quick) var(--ease-gentle),
                background-color var(--timing-quick) var(--ease-gentle),
                border-color var(--timing-quick) var(--ease-gentle);
  }
  
  /* Print styles */
  @media print {
    :global(.language-selector),
    :global(.interactive-element) {
      display: none !important;
    }
    
    :global(body) {
      background: white !important;
      color: black !important;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    :global(body) {
      background: white !important;
      color: black !important;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    :global(*) {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    
    :global(html) {
      scroll-behavior: auto;
    }
  }
</style>

<!-- Main Layout -->
<main class="app-container">
  <slot />
</main>

<!-- Analytics and Performance are now handled in the main onMount function --> 