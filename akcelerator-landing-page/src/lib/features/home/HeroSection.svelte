<script>
  import AppIcon from '$lib/components/AppIcon.svelte';
  import { trackEvent } from '$lib/analytics.js';
  import { MICRO_ACTIONS } from '$lib/data/czech-actions.js';

  export let microActionsCount = MICRO_ACTIONS.length;
</script>

<section class="hero-stage">
  <div class="hero-inner">
    <div class="hero-copy">
      <div class="hero-overline">
        <span class="live-dot" aria-hidden="true"></span>
        <span>Zdarma a bez účtu · {microActionsCount} ověřených cest v Česku</span>
      </div>

      <h1 class="hero-title">
        <span class="hero-desktop-heading">
          Pomáhat může být lehké.
          <span class="hero-serif">Stačí jeden dobrý skutek dnes.</span>
        </span>
        <span class="hero-mobile-claim">Jeden ověřený dobrý skutek na 2 minuty zdarma.</span>
      </h1>

      <p class="hero-lead">
        Zvol si, kolik máš zrovna času, najdi místo pomoci ve svém okolí nebo
        si na minutu vydechni v <strong>Krajině dobra</strong>.
      </p>

      <div class="hero-ctas">
        <!-- Desktop Primary CTA: Near Map -->
        <a
          href="/near"
          class="hero-btn primary hero-btn-desktop"
          on:click={() => trackEvent("aa_launch", { from: "hero_map" })}
        >
          <AppIcon name="map-pin" size={17} strokeWidth={2.2} />
          <span>Mapa pomoci v okolí</span>
          <span class="arrow" aria-hidden="true">
            <AppIcon name="arrow-right" size={16} strokeWidth={2.2} />
          </span>
        </a>

        <!-- Shared Sanctuary Link: Krajina dobra -->
        <a
          href="/svet"
          class="hero-btn sanctuary-hero-btn"
          on:click={() => trackEvent("aa_launch", { from: "hero_svet" })}
        >
          <AppIcon name="trees" size={17} strokeWidth={2} />
          <span>Krajina dobra</span>
        </a>
      </div>
    </div>

    <slot />
  </div>
</section>

<style>
  .hero-stage {
    position: relative;
    padding: 1.75rem 1.25rem 2rem;
    background: transparent;
    color: var(--ink-primary, #14281d);
    border-bottom: 1px solid var(--border-subtle, #dce3dd);
  }

  .hero-inner {
    position: relative;
    width: 100%;
    max-width: 1140px;
    box-sizing: border-box;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
    gap: 2.5rem;
    align-items: start;
  }

  .hero-copy {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    padding-top: 0.75rem;
  }

  .hero-overline {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.28rem 0.72rem;
    border-radius: 999px;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    color: var(--ink-secondary, #3f574a);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.015em;
    margin-bottom: 1rem;
  }

  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-primary, #1b5e42);
    flex-shrink: 0;
  }

  .hero-title {
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: clamp(2.3rem, 4.2vw, 3.6rem);
    line-height: 1.08;
    letter-spacing: -0.035em;
    margin: 0 0 1.05rem 0;
    color: var(--ink-primary, #14281d);
  }

  .hero-serif {
    display: block;
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: clamp(2.4rem, 4.5vw, 3.85rem);
    line-height: 1.06;
    letter-spacing: 0;
    color: var(--accent-primary, #1b5e42);
    margin-top: 0.2rem;
  }

  .hero-lead {
    color: var(--ink-secondary, #3f574a);
    font-size: 1.04rem;
    line-height: 1.6;
    max-width: 48ch;
    margin: 0 0 1.55rem 0;
  }

  .hero-lead strong {
    color: var(--ink-primary, #14281d);
    font-weight: 700;
  }

  .hero-ctas {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .hero-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 44px;
    padding: 0.78rem 1.3rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.94rem;
    text-decoration: none;
    transition: background-color 0.2s var(--ease-gentle), border-color 0.2s var(--ease-gentle), transform 0.18s ease;
    box-sizing: border-box;
  }

  .hero-btn.primary {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    border: 1px solid var(--accent-primary, #1b5e42);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
  }

  .hero-btn.primary:hover {
    background: var(--accent-primary-hover, #144732);
    border-color: var(--accent-primary-hover, #144732);
  }

  .hero-btn.primary .arrow {
    display: inline-flex;
    align-items: center;
    transition: transform 0.2s ease;
  }

  .hero-btn.primary:hover .arrow {
    transform: translateX(3px);
  }

  .hero-mobile-claim {
    display: none;
  }

  .hero-btn-desktop {
    display: inline-flex;
  }

  .sanctuary-hero-btn {
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    border: 1px solid var(--border-strong, #c2cec5);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
  }

  .sanctuary-hero-btn:hover {
    background: var(--bg-subtle, #edf2ee);
    border-color: var(--accent-primary, #1b5e42);
  }

  @media (min-width: 960px) {
    .hero-stage {
      background: linear-gradient(
        180deg,
        var(--forest-wash, #e7efea) 0%,
        var(--forest-wash-soft, #eef4f0) 56%,
        var(--bg-canvas, #f6f7f3) 100%
      );
      border-bottom-color: var(--border-forest, #c8d7cd);
    }

    .hero-overline {
      background: var(--forest-deep, #11291e);
      border-color: var(--forest-canopy, #173829);
      color: #eef4f0;
    }

    .live-dot {
      background: #7be0ad;
    }

    .hero-btn.primary {
      background: var(--forest-canopy, #173829);
      border-color: var(--forest-deep, #11291e);
    }

    .hero-btn.primary:hover {
      background: var(--forest-deep, #11291e);
      border-color: var(--forest-deep, #11291e);
    }

    .sanctuary-hero-btn {
      border-color: var(--border-forest-strong, #aebfb4);
      color: var(--forest-deep, #11291e);
    }

    .sanctuary-hero-btn:hover {
      background: var(--forest-wash, #e7efea);
      border-color: var(--forest-canopy, #173829);
    }
  }

  @media (max-width: 1024px) {
    .hero-inner {
      grid-template-columns: minmax(0, 1fr);
      gap: 1.75rem;
    }

    .hero-copy {
      padding-top: 0;
    }
  }

  @media (max-width: 680px) {
    .hero-stage {
      margin-top: 0;
      padding: 0.4rem 0.75rem 0.9rem;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      border-bottom: none;
    }

    .hero-inner {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
      width: 100%;
      max-width: 100%;
    }

    .hero-copy {
      display: block;
      margin-bottom: 0.38rem;
      text-align: center;
    }

    .hero-desktop-heading,
    .hero-overline,
    .hero-lead,
    .hero-ctas {
      display: none !important;
    }

    .hero-title {
      font-size: clamp(0.9rem, 3.6vw, 1.04rem);
      line-height: 1.24;
      margin: 0;
      letter-spacing: -0.015em;
      overflow-wrap: break-word;
      color: var(--ink-primary, #14281d);
    }

    .hero-mobile-claim {
      display: block;
      font-size: inherit;
      font-weight: 700;
      color: var(--ink-primary, #14281d);
      margin: 0;
      line-height: 1.24;
    }
  }

  @media (max-width: 360px) {
    .hero-stage {
      padding: 0.35rem 0.5rem 0.85rem;
    }

    .hero-copy {
      padding: 0;
      margin-bottom: 0.3rem;
    }

    .hero-title,
    .hero-mobile-claim {
      font-size: 0.86rem;
      line-height: 1.22;
    }
  }
</style>
