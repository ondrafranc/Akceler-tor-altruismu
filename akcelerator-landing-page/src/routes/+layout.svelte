<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { inject } from '@vercel/analytics';
  import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
  import ImmediateHelp from '../components/ImmediateHelp.svelte';
  import SmallWinCelebration from '../components/SmallWinCelebration.svelte';
  import FeedbackModal from '../components/FeedbackModal.svelte';
  import '../styles/czech-theme.css';

  const siteMeta = {
    title: 'Akcelerátor altruismu — Pomáháme lidem pomáhat',
    description:
      'Praktický český rozcestník k dobrým skutkům v okolí i z domova. Najdi jeden lehký, ověřený krok pro lidi, zvířata nebo přírodu za pár minut.',
    keywords: 'altruismus, pomoc, dobrovolnictví, mapa pomoci, neziskovky v okolí, dobré skutky'
  };

  $: pathname = $page.url.pathname;

  onMount(() => {
    try {
      inject();
    } catch {}
    try {
      injectSpeedInsights();
    } catch {}
  });
</script>

<svelte:head>
  <title>{siteMeta.title}</title>
  <meta name="title" content={siteMeta.title} />
  <meta name="description" content={siteMeta.description} />
  <meta name="keywords" content={siteMeta.keywords} />
  <meta name="author" content="Akcelerátor altruismu" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://akcelerator-altruismu.cz" />
  <meta property="og:title" content={siteMeta.title} />
  <meta property="og:description" content={siteMeta.description} />
  <meta property="og:image" content="/og-image-czech.jpg" />
  <meta property="og:locale" content="cs_CZ" />

  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/favicon.svg" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="app-shell">
  <header class="top-nav">
    <div class="nav-capsule">
      <a href="/" class="brand">
        <span class="brand-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21V11M12 11C12 7 15.5 4 20 4C20 8.5 17 12 12 12M12 13C12 9.5 9 6.5 4.5 6.5C4.5 10.5 7.5 13.5 12 13.5"
              stroke="url(#brandGrad)"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle cx="19" cy="5" r="2" fill="#FBBF24" />
            <defs>
              <linearGradient id="brandGrad" x1="4" y1="4" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                <stop stop-color="#34D399" />
                <stop offset="1" stop-color="#FBBF24" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span class="brand-text">Akcelerátor <span class="brand-accent">altruismu</span></span>
      </a>

      <nav class="nav-links" aria-label="Hlavní navigace">
        <a href="/" class="nav-pill" class:active={pathname === '/' || pathname === '/app'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span>Rychlý start</span>
        </a>
        <a href="/app/guided" class="nav-pill" class:active={pathname.startsWith('/app/guided')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          <span>Průvodce</span>
        </a>
        <a href="/app/online" class="nav-pill" class:active={pathname.startsWith('/app/online')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          <span>Mikro-kroky</span>
        </a>
        <a href="/near" class="nav-pill" class:active={pathname.startsWith('/near')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>Mapa v okolí</span>
        </a>
        <a href="/svet" class="nav-pill world-pill" class:active={pathname.startsWith('/svet')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/></svg>
          <span>Krajina dobra</span>
        </a>
        <a href="/submit" class="nav-pill add-tip" class:active={pathname.startsWith('/submit')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          <span>Přidat tip</span>
        </a>
      </nav>
    </div>
  </header>

  <main class="main-content">
    <slot />
  </main>

  <footer class="site-footer">
    <div class="footer-glow"></div>
    <div class="footer-inner">
      <div class="footer-col">
        <div class="footer-brand">
          <span class="footer-dot"></span>
          Akcelerátor altruismu
        </div>
        <p class="footer-desc">
          Místo, které lidem usnadňuje pomáhat — druhým, zvířatům i přírodě kolem nás. Vyber si drobný, ověřený krok podle toho, kolik máš zrovna dnes času a sil.
        </p>
        <div class="footer-trust">
          <span>Zdarma a bez účtu</span>
          <span>•</span>
          <span>Ověřené české organizace</span>
          <span>•</span>
          <span>V okolí i z domova</span>
        </div>
      </div>

      <div class="footer-nav-group">
        <div class="footer-heading">Rychlé cesty</div>
        <div class="footer-links">
          <a href="/">Rychlý start</a>
          <a href="/svet">Krajina dobra a dechové zastavení</a>
          <a href="/app/guided">Průvodce podle situace</a>
          <a href="/app/online">Online mikro-kroky</a>
          <a href="/near">Mapa pomoci v okolí</a>
          <a href="/submit">Přidat místní organizaci nebo akci</a>
        </div>
      </div>
    </div>
  </footer>
</div>

<ImmediateHelp />
<SmallWinCelebration />
<FeedbackModal />

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Floating Glassmorphic Capsule Header */
  .top-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 0.75rem 1rem 0.35rem 1rem;
    pointer-events: none;
  }

  .nav-capsule {
    pointer-events: auto;
    max-width: 1180px;
    margin: 0 auto;
    padding: 0.5rem 0.7rem 0.5rem 0.85rem;
    border-radius: 999px;
    background: rgba(252, 254, 251, 0.92);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid rgba(22, 82, 56, 0.14);
    box-shadow:
      0 14px 32px -12px rgba(12, 38, 26, 0.13),
      inset 0 1px 0 rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    text-decoration: none;
    color: #0e281c;
    font-weight: 800;
    font-size: 1.02rem;
    letter-spacing: -0.02em;
  }

  .brand-mark {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.2), rgba(251, 191, 36, 0.16));
    border: 1px solid rgba(5, 150, 105, 0.28);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.14);
  }

  .brand-accent {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: 1.24rem;
    color: #047857;
    letter-spacing: 0.01em;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .nav-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    text-decoration: none;
    color: #2f4b3d;
    font-weight: 600;
    font-size: 0.87rem;
    padding: 0.46rem 0.85rem;
    border-radius: 999px;
    border: 1px solid transparent;
    transition: all 0.2s var(--ease-gentle);
  }

  .nav-pill:hover {
    color: #0b2419;
    background: rgba(16, 185, 129, 0.09);
  }

  .nav-pill.active {
    color: #072317;
    background: linear-gradient(135deg, #bbf7d0 0%, #fef3c7 100%);
    border-color: rgba(5, 150, 105, 0.26);
    font-weight: 700;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.18);
  }

  .nav-pill.world-pill {
    background: rgba(16, 185, 129, 0.09);
    border-color: rgba(5, 150, 105, 0.22);
    color: #065f46;
  }

  .nav-pill.world-pill.active {
    background: linear-gradient(135deg, #bbf7d0 0%, #fef3c7 100%);
    color: #072317;
    border-color: rgba(5, 150, 105, 0.3);
  }

  .nav-pill.add-tip {
    border-color: rgba(22, 82, 56, 0.16);
    color: #1e4633;
    background: rgba(255, 255, 255, 0.65);
  }

  .nav-pill.add-tip.active {
    color: #072317;
  }

  .main-content {
    flex: 1;
  }

  /* Calm Botanical Sage Footer */
  .site-footer {
    position: relative;
    overflow: hidden;
    margin-top: 4rem;
    background: linear-gradient(180deg, #e5efe8 0%, #dbe8df 100%);
    color: #274235;
    padding: 3.25rem 1.25rem 5.5rem 1.25rem;
    border-top: 1px solid rgba(22, 82, 56, 0.13);
  }

  .footer-glow {
    position: absolute;
    top: -120px;
    right: 10%;
    width: 420px;
    height: 240px;
    background: radial-gradient(circle, rgba(254, 243, 199, 0.55) 0%, transparent 70%);
    pointer-events: none;
  }

  .footer-inner {
    position: relative;
    max-width: 1160px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2.5rem;
    flex-wrap: wrap;
  }

  .footer-col {
    max-width: 520px;
  }

  .footer-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    font-weight: 800;
    color: #0e281c;
    font-size: 1.15rem;
    margin-bottom: 0.65rem;
    letter-spacing: -0.02em;
  }

  .footer-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #f59e0b);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.35);
  }

  .footer-desc {
    margin: 0 0 1rem 0;
    color: #365244;
    font-size: 0.94rem;
    line-height: 1.65;
  }

  .footer-trust {
    display: flex;
    gap: 0.55rem;
    flex-wrap: wrap;
    font-size: 0.82rem;
    font-weight: 700;
    color: #047857;
  }

  .footer-nav-group {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .footer-heading {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: #4b6859;
    font-weight: 800;
  }

  .footer-links {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .footer-links a {
    color: #163a2a;
    font-weight: 600;
    font-size: 0.92rem;
    text-decoration: none;
    transition: color 0.15s ease, transform 0.15s ease;
  }

  .footer-links a:hover {
    color: #059669;
    transform: translateX(3px);
  }

  @media (max-width: 820px) {
    .top-nav {
      padding: 0.4rem 0.55rem 0.25rem;
    }
    .nav-capsule {
      border-radius: 20px;
      padding: 0.48rem 0.65rem;
      gap: 0.42rem;
      justify-content: space-between;
    }
    .brand {
      font-size: 0.95rem;
    }
    .brand-mark {
      width: 28px;
      height: 28px;
    }
    .brand-accent {
      font-size: 1.12rem;
    }
    .nav-links {
      width: 100%;
      flex-wrap: nowrap;
      overflow-x: auto;
      justify-content: flex-start;
      gap: 0.3rem;
      padding-bottom: 0.1rem;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }
    .nav-links::-webkit-scrollbar {
      display: none;
    }
    .nav-pill {
      flex-shrink: 0;
      font-size: 0.8rem;
      padding: 0.36rem 0.7rem;
    }
  }
</style>
