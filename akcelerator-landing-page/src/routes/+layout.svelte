<script>
  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import { page } from "$app/state";
  import { afterNavigate } from "$app/navigation";
  import { inject } from "@vercel/analytics";
  import { injectSpeedInsights } from "@vercel/speed-insights/sveltekit";
  import ImmediateHelp from "../components/ImmediateHelp.svelte";
  import SmallWinCelebration from "../components/SmallWinCelebration.svelte";
  import FeedbackModal from "../components/FeedbackModal.svelte";
  import MollyCompanion from "../components/MollyCompanion.svelte";
  import MollyDock, {
    isCompactDock,
  } from "../components/MollyDock.svelte";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import { openFeedbackModal, toggleCrisisModal } from "$lib/utils.js";
  import "../styles/czech-theme.css";

  /** @type {{ children?: import('svelte').Snippet }} */
  let { children } = $props();

  const siteMeta = {
    title: "Akcelerátor altruismu — Pomáháme lidem pomáhat",
    description:
      "Praktický český akcelerátor dobrých skutků v okolí i z domova. Pomáháme lidem pomáhat: vyber si jeden lehký, ověřený krok pro lidi, zvířata nebo přírodu za pár minut.",
    keywords:
      "altruismus, pomoc, dobrovolnictví, mapa pomoci, neziskovky v okolí, dobré skutky",
  };

  /** @type {Array<{ href: string, label: string, icon: string, match: (p: string) => boolean, extraClass?: string }>} */
  const NAV_ITEMS = [
    {
      href: "/",
      label: "Rychlý start",
      icon: "zap",
      match: (p) => p === "/",
    },
    {
      href: "/app/guided",
      label: "Průvodce",
      icon: "compass",
      match: (p) => p.startsWith("/app/guided"),
    },
    {
      href: "/app/online",
      label: "Drobné skutky",
      icon: "sun",
      match: (p) => p.startsWith("/app/online"),
    },
    {
      href: "/near",
      label: "Mapa v okolí",
      icon: "map-pin",
      match: (p) => p.startsWith("/near"),
    },
    {
      href: "/svet",
      label: "Krajina dobra",
      icon: "trees",
      match: (p) => p.startsWith("/svet"),
      extraClass: "world-pill",
    },
    {
      href: "/submit",
      label: "Přidat tip",
      icon: "plus",
      match: (p) => p.startsWith("/submit"),
      extraClass: "add-tip",
    },
  ];

  const pathname = $derived(page.url.pathname);
  const originUrl = $derived(page.url.origin || "https://akcelerator-altruismu.cz");
  const canonicalUrl = $derived(`${originUrl}${pathname}`);
  const ogImageUrl = $derived(`${originUrl}/og-image-czech.jpg`);

  let hydrated = $state(false);
  let menuOpen = $state(false);
  let isNarrowMobile = $state(false);
  let drawerTopPx = $state(64);
  /** @type {'none' | 'dark' | 'light'} */
  let topNavShieldMode = $state(/** @type {'none' | 'dark' | 'light'} */ ("none"));
  /** @type {'none' | 'dark' | 'light'} */
  const effectiveTopShield = $derived(pathname !== "/" ? "light" : topNavShieldMode);

  /** @type {HTMLElement | null} */
  let headerEl = $state(null);
  /** @type {HTMLElement | null} */
  let drawerEl = $state(null);

  function syncTopNavShield() {
    if (typeof window === "undefined") return;
    if (pathname !== "/") {
      if (topNavShieldMode !== "light") topNavShieldMode = "light";
      return;
    }
    const sy = window.scrollY || 0;
    if (sy <= 6) {
      if (topNavShieldMode !== "none") topNavShieldMode = "none";
      return;
    }
    const navBottom = headerEl?.getBoundingClientRect().bottom || 62;
    const isNarrow = (window.innerWidth || 1280) <= 680;
    const probeEl = isNarrow
      ? document.querySelector(".hero-wave") || document.querySelector(".hero-painted-backdrop")
      : document.querySelector(".hero-stage");
    let nextMode = /** @type {'dark' | 'light'} */ ("light");
    if (probeEl) {
      const pr = probeEl.getBoundingClientRect();
      if (isNarrow && probeEl.classList.contains("hero-wave")) {
        nextMode = pr.top <= navBottom - 6 ? "light" : "dark";
      } else {
        nextMode = pr.bottom <= navBottom + 4 ? "light" : "dark";
      }
    }
    if (topNavShieldMode !== nextMode) {
      topNavShieldMode = nextMode;
    }
  }

  function updateDrawerTop() {
    if (headerEl) {
      const rect = headerEl.getBoundingClientRect();
      if (rect.bottom > 0) {
        drawerTopPx = Math.ceil(rect.bottom + 6);
      }
    }
  }

  function toggleMenu() {
    if (!menuOpen) {
      updateDrawerTop();
    }
    menuOpen = !menuOpen;
  }

  function closeMenu() {
    menuOpen = false;
  }

  afterNavigate(() => {
    menuOpen = false;
    syncTopNavShield();
  });

  onMount(() => {
    hydrated = true;
    if (!dev) {
      try {
        inject();
      } catch {}
      try {
        injectSpeedInsights();
      } catch {}
    }

    const syncBreakpoints = () => {
      const vw = window.innerWidth || 1280;
      const compact = window.matchMedia
        ? window.matchMedia("(max-width: 1024px)").matches
        : vw <= 1024;
      const narrow = window.matchMedia
        ? window.matchMedia("(max-width: 680px)").matches
        : vw <= 680;
      isCompactDock.set(compact);
      isNarrowMobile = narrow;
      if (!compact && menuOpen) {
        menuOpen = false;
      }
      if (menuOpen) {
        updateDrawerTop();
      }
      syncTopNavShield();
    };

    syncBreakpoints();

    const compactMql = window.matchMedia ? window.matchMedia("(max-width: 1024px)") : null;
    const narrowMql = window.matchMedia ? window.matchMedia("(max-width: 680px)") : null;
    compactMql?.addEventListener?.("change", syncBreakpoints);
    narrowMql?.addEventListener?.("change", syncBreakpoints);
    window.addEventListener("resize", syncBreakpoints, { passive: true });
    window.addEventListener("scroll", syncTopNavShield, { passive: true });

    /** @param {KeyboardEvent} e */
    const onKeyDown = (e) => {
      if (e.key === "Escape" && menuOpen) {
        menuOpen = false;
      }
    };

    /** @param {PointerEvent} e */
    const onPointerDownOutside = (e) => {
      if (!menuOpen) return;
      const target = /** @type {Node | null} */ (e.target);
      if (!target) return;
      if (headerEl?.contains(target) || drawerEl?.contains(target)) return;
      menuOpen = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDownOutside);

    return () => {
      compactMql?.removeEventListener?.("change", syncBreakpoints);
      narrowMql?.removeEventListener?.("change", syncBreakpoints);
      window.removeEventListener("resize", syncBreakpoints);
      window.removeEventListener("scroll", syncTopNavShield);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDownOutside);
    };
  });
</script>

<svelte:head>
  <title>{siteMeta.title}</title>
  <meta name="title" content={siteMeta.title} />
  <meta name="description" content={siteMeta.description} />
  <meta name="keywords" content={siteMeta.keywords} />
  <meta name="author" content="Akcelerátor altruismu" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={siteMeta.title} />
  <meta property="og:description" content={siteMeta.description} />
  <meta property="og:image" content={ogImageUrl} />
  <meta property="og:locale" content="cs_CZ" />

  <link
    rel="preload"
    href="/fonts/plus-jakarta-sans-var-latin-ext.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
  <link
    rel="preload"
    href="/fonts/plus-jakarta-sans-var-latin.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
</svelte:head>

<div
  class="app-shell"
  data-hydrated={hydrated ? "true" : undefined}
>
  <header
    class="top-nav"
    class:is-drawer-open={menuOpen}
    class:shield-light={effectiveTopShield === "light"}
    class:shield-dark={effectiveTopShield === "dark"}
    bind:this={headerEl}
  >
    <div class="nav-capsule">
      <a href="/" class="brand">
        <span class="brand-mark" aria-hidden="true">
          <AppIcon name="sprout" size={18} strokeWidth={2} />
        </span>
        <span class="brand-copy">
          <span class="brand-text"
            ><span class="brand-word">Akcelerátor</span> <span class="brand-accent">altruismu</span></span
          >
          <span class="brand-sub brand-claim">Pomáháme lidem pomáhat</span>
        </span>
      </a>

      {#if $isCompactDock}
        <MollyDock variant="header" compact={isNarrowMobile} />
      {/if}

      <nav class="nav-links" aria-label="Hlavní navigace" data-sveltekit-preload-data="tap">
        {#each NAV_ITEMS as item (item.href)}
          <a
            href={item.href}
            class="nav-pill {item.extraClass || ''}"
            class:active={item.match(pathname)}
          >
            <AppIcon
              name={item.icon}
              size={15}
              strokeWidth={item.href === "/submit" ? 2.2 : 1.95}
            />
            <span>{item.label}</span>
          </a>
        {/each}
      </nav>

      <button
        type="button"
        class="mobile-nav-toggle"
        aria-expanded={menuOpen ? "true" : "false"}
        aria-controls="mobile-top-nav-drawer"
        aria-label={menuOpen ? "Zavřít navigaci" : "Otevřít navigaci"}
        onclick={toggleMenu}
      >
        <AppIcon name={menuOpen ? "x" : "menu"} size={20} strokeWidth={2} />
      </button>
    </div>
  </header>

  {#if menuOpen}
    <div
      class="mobile-drawer-backdrop"
      aria-hidden="true"
      onclick={closeMenu}
    ></div>
    <nav
      bind:this={drawerEl}
      id="mobile-top-nav-drawer"
      class="mobile-top-nav-drawer"
      style="top: {drawerTopPx}px;"
      aria-label="Mobilní navigace"
      data-sveltekit-preload-data="tap"
    >
      <div class="mobile-drawer-routes">
        {#each NAV_ITEMS as item (item.href)}
          <a
            href={item.href}
            class="mobile-drawer-link"
            class:active={item.match(pathname)}
            onclick={closeMenu}
          >
            <span class="drawer-link-icon" aria-hidden="true">
              <AppIcon name={item.icon} size={17} strokeWidth={2} />
            </span>
            <span>{item.label}</span>
          </a>
        {/each}
      </div>

      <div class="mobile-drawer-divider" aria-hidden="true"></div>

      <div class="mobile-drawer-actions">
        <button
          type="button"
          class="mobile-drawer-action is-crisis"
          onclick={() => {
            closeMenu();
            toggleCrisisModal();
          }}
        >
          <AppIcon name="life-buoy" size={17} strokeWidth={2} />
          <span>Tichá opora 24/7</span>
        </button>
        <button
          type="button"
          class="mobile-drawer-action"
          onclick={() => {
            closeMenu();
            openFeedbackModal();
          }}
        >
          <AppIcon name="message-circle" size={17} strokeWidth={2} />
          <span>Napsat názor</span>
        </button>
      </div>
    </nav>
  {/if}

  <main class="main-content">
    {@render children?.()}
  </main>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-col">
        <div class="footer-brand">
          <span class="footer-dot" aria-hidden="true"></span>
          Akcelerátor altruismu ·
          <span class="footer-subbrand">Pomáháme lidem pomáhat</span>
        </div>
        <p class="footer-desc">
          Místo, které lidem usnadňuje přejít od dobrého úmyslu ke skutečné
          pomoci — druhým, zvířatům i přírodě kolem nás. Vyber si drobný,
          ověřený krok podle toho, kolik máš zrovna dnes času a sil.
        </p>
        <div class="footer-trust">
          <span>Zdarma a bez účtu</span>
          <span>Ověřené zdroje a poctivě popsaný dopad</span>
          <span>V okolí i z domova</span>
        </div>
        <ImmediateHelp />
      </div>

      <div class="footer-nav-group">
        <div class="footer-heading">Rychlé cesty</div>
        <div class="footer-links">
          <a href="/">Rychlý start</a>
          <a href="/svet">Krajina dobra a dechové zastavení</a>
          <a href="/app/guided">Průvodce podle situace</a>
          <a href="/app/online">Drobné skutky na pár minut</a>
          <a href="/near">Mapa pomoci v okolí</a>
          <a href="/submit">Přidat místní organizaci nebo akci</a>
        </div>
        <div
          class="footer-calm-actions"
          aria-label="Rychlá opora a zpětná vazba"
        >
          <button
            type="button"
            class="fc-btn fc-crisis"
            onclick={() => toggleCrisisModal()}
            aria-label="Krizové kontakty a okamžitá opora"
          >
            <AppIcon name="life-buoy" size={15} strokeWidth={2} />
            <span>Tichá opora 24/7</span>
          </button>
          <button
            type="button"
            class="fc-btn fc-feedback"
            onclick={() => openFeedbackModal()}
            aria-label="Poslat zpětnou vazbu"
          >
            <AppIcon name="message-circle" size={15} strokeWidth={2} />
            <span>Napsat názor</span>
          </button>
        </div>
      </div>
    </div>
  </footer>
</div>

<SmallWinCelebration />
<FeedbackModal />
<MollyCompanion />

<style>
  .app-shell {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  /* Flat Daylight Editorial Header */
  .top-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    padding: max(0.65rem, env(safe-area-inset-top, 0px))
      max(1.25rem, env(safe-area-inset-right, 0px)) 0.35rem
      max(1.25rem, env(safe-area-inset-left, 0px));
    pointer-events: none;
    overflow: visible;
  }

  .top-nav::before {
    content: "";
    position: absolute;
    inset: 0;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.16s ease;
  }

  .top-nav.shield-light::before {
    opacity: 1;
    background: linear-gradient(
      180deg,
      var(--bg-canvas, #f6f7f3) 0%,
      var(--bg-canvas, #f6f7f3) 78%,
      rgba(246, 247, 243, 0.86) 90%,
      rgba(246, 247, 243, 0) 100%
    );
  }

  .top-nav.shield-dark::before {
    opacity: 1;
    background: linear-gradient(
      180deg,
      rgba(8, 25, 17, 0.98) 0%,
      rgba(8, 25, 17, 0.94) 76%,
      rgba(8, 25, 17, 0.56) 90%,
      rgba(8, 25, 17, 0) 100%
    );
  }

  .top-nav.shield-light .nav-capsule,
  .top-nav.shield-dark .nav-capsule {
    background: #ffffff;
  }

  .top-nav.is-drawer-open {
    z-index: 949;
  }

  .nav-capsule {
    position: relative;
    z-index: 1;
    pointer-events: auto;
    width: 100%;
    max-width: 1140px;
    box-sizing: border-box;
    margin: 0 auto;
    padding: 0.42rem 0.65rem 0.42rem 0.8rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid var(--border-forest, #c5d9cd);
    box-shadow: 0 6px 20px -8px rgba(24, 62, 44, 0.12),
      0 1px 3px rgba(24, 62, 44, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    flex-wrap: nowrap;
    overflow: visible;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    min-height: 44px;
    text-decoration: none;
    color: var(--ink-primary, #14281d);
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: -0.02em;
    flex-shrink: 0;
  }

  .brand-mark {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--bohemian-mist, #e6f0ea);
    border: 1px solid var(--border-forest, #c5d9cd);
    color: var(--czech-forest, #1d5c40);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .brand-accent {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: 1.2rem;
    color: var(--czech-forest, #1d5c40);
    letter-spacing: 0.01em;
  }

  .brand-copy {
    display: inline-flex;
    flex-direction: column;
    line-height: 1.1;
  }

  .brand-sub {
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--ink-secondary, #3f574a);
    letter-spacing: 0.02em;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: nowrap;
  }

  .nav-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    min-height: 44px;
    box-sizing: border-box;
    text-decoration: none;
    color: var(--ink-secondary, #3f574a);
    font-weight: 600;
    font-size: 0.85rem;
    padding: 0.45rem 0.72rem;
    border-radius: 999px;
    border: 1px solid transparent;
    white-space: nowrap;
    transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  }

  .nav-pill:hover {
    color: var(--accent-primary, #1b5e42);
    background: var(--bohemian-sage, #eef5f0);
  }

  .nav-pill.active {
    color: #ffffff;
    background: var(--czech-forest, #1d5c40);
    border-color: var(--czech-forest, #1d5c40);
    font-weight: 700;
  }

  .nav-pill.world-pill {
    color: var(--ink-secondary, #3f574a);
    border-color: transparent;
    background: transparent;
  }

  .nav-pill.world-pill.active {
    background: var(--czech-forest, #1d5c40);
    border-color: var(--czech-forest, #1d5c40);
    color: #ffffff;
  }

  .nav-pill.add-tip {
    border-color: var(--border-forest, #c5d9cd);
    color: var(--ink-primary, #14281d);
    background: var(--bg-surface, #ffffff);
  }

  .nav-pill.add-tip.active {
    background: var(--czech-forest, #1d5c40);
    border-color: var(--czech-forest, #1d5c40);
    color: #ffffff;
  }

  .mobile-nav-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border-radius: 999px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.18s ease, border-color 0.18s ease;
  }

  .mobile-nav-toggle:hover {
    background: var(--bg-surface, #ffffff);
    border-color: var(--border-strong, #c2cec5);
  }

  /* Mobile / Tablet Top-Down Navigation Drawer (rendered outside </header>) */
  .mobile-drawer-backdrop {
    position: fixed;
    inset: 0;
    z-index: 948;
    background: rgba(20, 40, 29, 0.28);
  }

  .mobile-top-nav-drawer {
    position: fixed;
    left: max(0.65rem, env(safe-area-inset-left, 0px));
    right: max(0.65rem, env(safe-area-inset-right, 0px));
    max-width: 540px;
    margin: 0 auto;
    z-index: 950;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-strong, #c2cec5);
    border-radius: 20px;
    box-shadow: var(--shadow-lg, 0 14px 32px -10px rgba(18, 42, 30, 0.11));
    padding: 0.75rem;
    box-sizing: border-box;
    max-height: calc(100dvh - 84px);
    overflow-y: auto;
  }

  .mobile-drawer-routes {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .mobile-drawer-link {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 44px;
    padding: 0.55rem 0.85rem;
    border-radius: 12px;
    text-decoration: none;
    color: var(--ink-primary, #14281d);
    font-weight: 600;
    font-size: 0.94rem;
    box-sizing: border-box;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .mobile-drawer-link:hover {
    background: var(--bg-subtle, #edf2ee);
  }

  .mobile-drawer-link.active {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-weight: 700;
  }

  .drawer-link-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .mobile-drawer-divider {
    height: 1px;
    background: var(--border-subtle, #dce3dd);
    margin: 0.65rem 0.25rem;
  }

  .mobile-drawer-actions {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .mobile-drawer-action {
    appearance: none;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: 100%;
    min-height: 44px;
    padding: 0.55rem 0.85rem;
    border-radius: 12px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
    box-sizing: border-box;
  }

  .mobile-drawer-action.is-crisis {
    background: var(--accent-warm-tint, #fef6e8);
    border-color: rgba(143, 75, 14, 0.28);
    color: var(--accent-warm-ink, #8f4b0e);
  }

  .main-content {
    flex: 1;
  }

  /* Calm Editorial Daylight Footer */
  .site-footer {
    position: relative;
    margin-top: 3.5rem;
    background: var(--bohemian-mist, #e6f0ea);
    color: var(--ink-secondary, #3f574a);
    padding: 2.75rem 1.25rem;
    border-top: 1px solid var(--border-forest, #c5d9cd);
  }

  .footer-inner {
    position: relative;
    width: 100%;
    max-width: 1140px;
    box-sizing: border-box;
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
    flex-wrap: wrap;
    gap: 0.2rem 0.55rem;
    font-weight: 800;
    color: var(--ink-primary, #14281d);
    font-size: 1.12rem;
    margin-bottom: 0.65rem;
    letter-spacing: -0.02em;
  }

  .footer-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--czech-linden, #256f4e);
    flex-shrink: 0;
  }

  .footer-subbrand {
    font-weight: 600;
    color: var(--ink-secondary, #3f574a);
  }

  .footer-desc {
    margin: 0 0 1rem 0;
    color: var(--ink-secondary, #3f574a);
    font-size: 0.94rem;
    line-height: 1.65;
  }

  .footer-trust {
    display: flex;
    gap: 0.4rem 1.1rem;
    flex-wrap: wrap;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--accent-primary, #1b5e42);
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
    color: var(--ink-secondary, #3f574a);
    font-weight: 800;
  }

  .footer-links {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .footer-links a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0.25rem 0;
    box-sizing: border-box;
    color: var(--ink-primary, #14281d);
    font-weight: 600;
    font-size: 0.92rem;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .footer-links a:hover {
    color: var(--accent-primary, #1b5e42);
    text-decoration: underline;
  }

  .footer-calm-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.45rem;
    padding-top: 0.65rem;
    border-top: 1px solid var(--border-forest, #c5d9cd);
  }

  .fc-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    padding: 0.55rem 0.95rem;
    border-radius: 999px;
    border: 1px solid var(--border-forest-strong, #a7c4b3);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    font-family: inherit;
    font-size: 0.84rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    line-height: 1.2;
    white-space: nowrap;
  }

  .fc-btn:hover {
    background: var(--bg-canvas, #f6f7f3);
  }

  .fc-btn.fc-crisis {
    border-color: rgba(143, 75, 14, 0.3);
    background: var(--accent-warm-tint, #fef6e8);
    color: var(--accent-warm-ink, #8f4b0e);
  }

  @media (min-width: 960px) {
    .site-footer {
      background: var(--bohemian-mist, #e6f0ea);
      border-top: 1px solid var(--border-forest, #c5d9cd);
      color: var(--ink-secondary, #3f574a);
    }

    .footer-brand {
      color: var(--ink-primary, #14281d);
    }

    .footer-dot {
      background: var(--czech-linden, #256f4e);
    }

    .footer-subbrand,
    .footer-desc {
      color: var(--ink-secondary, #3f574a);
    }

    .footer-trust {
      color: var(--czech-forest, #1d5c40);
    }

    .footer-heading {
      color: var(--ink-secondary, #3f574a);
    }

    .footer-links a {
      color: var(--ink-primary, #14281d);
    }

    .footer-links a:hover {
      color: var(--czech-forest, #1d5c40);
    }

    .footer-calm-actions {
      border-top-color: var(--border-forest, #c5d9cd);
    }

    .fc-btn {
      border-color: var(--border-forest-strong, #a7c4b3);
    }
  }

  @media (min-width: 1025px) {
    .app-shell {
      border-top: 2px solid var(--czech-linden, #256f4e);
    }

    .nav-capsule {
      background: rgba(255, 255, 255, 0.98);
      border-color: var(--border-forest, #c5d9cd);
      box-shadow: 0 6px 20px -8px rgba(24, 62, 44, 0.09),
        0 1px 3px rgba(24, 62, 44, 0.04);
    }

    .brand-mark {
      background: var(--bohemian-mist, #e6f0ea);
      border-color: var(--border-forest, #c5d9cd);
      color: var(--czech-forest, #1d5c40);
    }

    .nav-pill.world-pill:hover {
      background: var(--bohemian-sage, #eef5f0);
      border-color: transparent;
      color: var(--accent-primary, #1b5e42);
    }

    .nav-pill.world-pill.active:hover {
      background: var(--czech-forest, #1d5c40);
      border-color: var(--czech-forest, #1d5c40);
      color: #ffffff;
    }

    .nav-pill.add-tip:hover {
      background: var(--bohemian-sage, #eef5f0);
      border-color: var(--border-forest-strong, #a7c4b3);
      color: var(--accent-primary, #1b5e42);
    }

    .site-footer {
      padding-bottom: 5.25rem;
    }
  }

  @media (min-width: 1025px) and (max-width: 1160px) {
    .top-nav {
      padding-inline: 0.85rem;
    }

    .nav-capsule {
      padding: 0.38rem 0.55rem 0.38rem 0.7rem;
      gap: 0.45rem;
    }

    .brand {
      font-size: 0.94rem;
      gap: 0.45rem;
    }

    .brand-accent {
      font-size: 1.12rem;
    }

    .nav-links {
      gap: 0.18rem;
    }

    .nav-pill {
      font-size: 0.81rem;
      padding: 0.42rem 0.58rem;
      gap: 0.3rem;
    }
  }

  @media (max-width: 1024px) {
    .top-nav {
      padding: max(0.35rem, env(safe-area-inset-top, 0px))
        max(0.65rem, env(safe-area-inset-right, 0px)) 0.25rem
        max(0.65rem, env(safe-area-inset-left, 0px));
    }

    .nav-capsule {
      padding: 0.25rem 0.45rem 0.25rem 0.65rem;
      gap: 0.4rem;
      flex-wrap: nowrap;
      justify-content: space-between;
    }

    .brand {
      flex: 0 1 auto;
      margin-right: auto;
      min-width: 0;
      overflow: hidden;
      font-size: 0.9rem;
      gap: 0.42rem;
    }

    .brand-copy {
      min-width: 0;
      overflow: hidden;
    }

    .brand-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .brand-mark {
      width: 28px;
      height: 28px;
    }

    .brand-accent {
      font-size: 1.05rem;
    }

    .brand-sub,
    .brand-claim,
    .nav-links {
      display: none !important;
    }

    .mobile-nav-toggle {
      display: inline-flex;
    }
  }

  @media (max-width: 680px) {
    .nav-capsule {
      padding: 0.22rem 0.38rem 0.22rem 0.55rem;
      gap: 0.3rem;
    }

    .brand {
      font-size: 0.86rem;
      gap: 0.36rem;
    }

    .brand-mark {
      width: 26px;
      height: 26px;
    }

    .brand-accent {
      font-size: 1rem;
    }

    .site-footer {
      padding: 2rem 1rem 2.5rem 1rem;
      margin-top: 2.25rem;
    }
  }

  @media (max-width: 480px) {
    .top-nav {
      padding: max(0.35rem, env(safe-area-inset-top, 0px))
        max(0.5rem, env(safe-area-inset-right, 0px)) 0.25rem
        max(0.5rem, env(safe-area-inset-left, 0px));
    }

    .nav-capsule {
      padding: 0.18rem 0.32rem 0.18rem 0.48rem;
      gap: 0.25rem;
    }

    .brand {
      flex: 0 0 auto;
      margin-right: auto;
      overflow: visible;
      gap: 0.34rem;
    }

    .brand-copy {
      overflow: visible;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0;
      line-height: 1.02;
      overflow: visible;
      text-overflow: clip;
      white-space: nowrap;
    }

    .brand-word {
      font-size: 0.8rem;
      font-weight: 800;
      line-height: 1.08;
      letter-spacing: -0.025em;
    }

    .brand-accent {
      font-size: 0.92rem;
      line-height: 1.02;
      letter-spacing: 0.005em;
    }
  }

  @media (max-width: 359px) {
    .top-nav {
      padding: max(0.3rem, env(safe-area-inset-top, 0px))
        max(0.35rem, env(safe-area-inset-right, 0px)) 0.22rem
        max(0.35rem, env(safe-area-inset-left, 0px));
    }

    .nav-capsule {
      padding: 0.16rem 0.25rem 0.16rem 0.38rem;
      gap: 0.18rem;
    }

    .brand {
      gap: 0.25rem;
    }

    .brand-mark {
      width: 22px;
      height: 22px;
    }

    .brand-word {
      font-size: 0.74rem;
    }

    .brand-accent {
      font-size: 0.85rem;
    }
  }
</style>
