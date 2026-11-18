<script>
  import AppIcon from '$lib/components/AppIcon.svelte';
  import { trackEvent } from '$lib/analytics.js';
  import { MICRO_ACTIONS } from '$lib/data/czech-actions.js';

  export let microActionsCount = MICRO_ACTIONS.length;
  /** @type {Array<{ left: string; top: string; size: number; delay: string; dur: string; gold: boolean }>} */
  export let fireflies = [
    { left: "8%", top: "24%", size: 5, delay: "0s", dur: "7.5s", gold: true },
    { left: "19%", top: "68%", size: 4, delay: "1.4s", dur: "8.8s", gold: false },
    { left: "34%", top: "20%", size: 5, delay: "2.6s", dur: "7.2s", gold: true },
    { left: "48%", top: "74%", size: 6, delay: "0.8s", dur: "9.1s", gold: true },
    { left: "64%", top: "18%", size: 5, delay: "1.9s", dur: "8.3s", gold: false },
    { left: "81%", top: "22%", size: 7, delay: "2.2s", dur: "9.4s", gold: true },
    { left: "90%", top: "60%", size: 5, delay: "1.5s", dur: "7.1s", gold: false },
  ];
</script>

<section class="hero-stage">
  <div class="hero-painted-backdrop" aria-hidden="true"></div>
  <div class="hero-aurora" aria-hidden="true"></div>
  <div class="fireflies-layer" aria-hidden="true">
    {#each fireflies as f}
      <span
        class="firefly"
        class:gold={f.gold}
        style="left:{f.left}; top:{f.top}; width:{f.size}px; height:{f.size}px; animation-delay:{f.delay}; animation-duration:{f.dur};"
      ></span>
    {/each}
  </div>
  <div class="hero-scrim" aria-hidden="true"></div>

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

  <div class="hero-wave" aria-hidden="true">
    <svg viewBox="0 0 1440 76" preserveAspectRatio="none">
      <path
        d="M0,34 C340,80 700,-4 1080,42 C1260,64 1370,50 1440,32 L1440,76 L0,76 Z"
        fill="var(--surface-page)"
      />
    </svg>
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
    background: #e3f0e8;
    border: 1px solid #bdd8c8;
    color: #195239;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.015em;
    margin-bottom: 1rem;
  }

  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #1f7a52;
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
    color: var(--czech-forest, #1d5c40);
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
    background: var(--czech-forest, #1d5c40);
    color: #ffffff;
    border: 1px solid var(--czech-forest, #1d5c40);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
  }

  .hero-btn.primary:hover {
    background: var(--czech-forest-hover, #164932);
    border-color: var(--czech-forest-hover, #164932);
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
    border: 1px solid var(--border-forest-strong, #a7c4b3);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
  }

  .sanctuary-hero-btn:hover {
    background: var(--bohemian-mist, #e6f0ea);
    border-color: var(--czech-linden, #256f4e);
    color: #195239;
  }

  @media (min-width: 681px) {
    .hero-stage {
      margin-top: -5.4rem;
      padding: 7.35rem 1.25rem 5.5rem;
      background:
        radial-gradient(
          90% 88% at 78% 24%,
          rgba(28, 108, 73, 0.82) 0%,
          transparent 62%
        ),
        radial-gradient(
          65% 70% at 15% 15%,
          rgba(251, 191, 36, 0.18) 0%,
          transparent 58%
        ),
        linear-gradient(160deg, #0b261b 0%, #123a29 50%, #174934 100%);
      color: #f8faf8;
      border-bottom: none;
      overflow: hidden;
    }

    .hero-painted-backdrop {
      position: absolute;
      inset: 0;
      background: url("/art/sanctuary-dawn.jpg") center 42% / cover no-repeat;
      opacity: 0.36;
      mask-image: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.24) 0%,
        rgba(0, 0, 0, 0.8) 58%,
        rgba(0, 0, 0, 0.94) 100%
      );
      -webkit-mask-image: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.24) 0%,
        rgba(0, 0, 0, 0.8) 58%,
        rgba(0, 0, 0, 0.94) 100%
      );
      pointer-events: none;
    }

    .hero-aurora {
      position: absolute;
      inset: -20% -10% 0 -10%;
      background:
        radial-gradient(
          circle at 72% 38%,
          rgba(52, 211, 153, 0.2) 0%,
          transparent 42%
        ),
        radial-gradient(
          circle at 62% 24%,
          rgba(251, 191, 36, 0.15) 0%,
          transparent 34%
        );
      filter: blur(28px);
      pointer-events: none;
    }

    .fireflies-layer {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }

    .hero-scrim {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background: linear-gradient(
        90deg,
        rgba(8, 29, 20, 0.56) 0%,
        rgba(9, 32, 22, 0.62) 54%,
        rgba(10, 35, 24, 0.24) 70%,
        rgba(10, 35, 24, 0.04) 100%
      );
    }

    .firefly {
      position: absolute;
      border-radius: 50%;
      background: #6ee7b7;
      box-shadow: 0 0 14px 3px rgba(52, 211, 153, 0.55);
      animation: floatFirefly 8s ease-in-out infinite;
    }

    .firefly.gold {
      background: #fde68a;
      box-shadow: 0 0 16px 4px rgba(251, 191, 36, 0.62);
    }

    .hero-inner {
      z-index: 2;
      gap: 2.8rem;
    }

    .hero-copy {
      padding-top: 1.15rem;
    }

    .hero-overline {
      gap: 0.55rem;
      padding: 0;
      border-radius: 0;
      background: transparent;
      border: none;
      color: #a7f3d0;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .live-dot {
      background: #34d399;
      box-shadow: 0 0 10px #34d399;
    }

    .hero-title {
      font-size: clamp(2.4rem, 4.4vw, 3.85rem);
      line-height: 1.07;
      margin: 0 0 1.15rem 0;
      color: #ffffff;
    }

    .hero-serif {
      font-size: clamp(2.45rem, 4.6vw, 4.05rem);
      line-height: 1.05;
      color: #fde68a;
      background: linear-gradient(120deg, #fef3c7 0%, #a7f3d0 55%, #fde68a 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-lead {
      color: #eef8f2;
      font-size: 1.06rem;
      line-height: 1.65;
      margin: 0 0 1.75rem 0;
    }

    .hero-lead strong {
      color: #fde68a;
    }

    .hero-btn {
      gap: 0.55rem;
      padding: 0.88rem 1.35rem;
    }

    .hero-btn.primary {
      background: linear-gradient(135deg, #34d399 0%, #fde68a 100%);
      color: #051810;
      border-color: transparent;
      box-shadow: 0 14px 32px -6px rgba(52, 211, 153, 0.42);
    }

    .hero-btn.primary:hover {
      background: linear-gradient(135deg, #34d399 0%, #fde68a 100%);
      border-color: transparent;
      transform: translateY(-2px);
      box-shadow: 0 18px 36px -6px rgba(52, 211, 153, 0.55);
    }

    .sanctuary-hero-btn {
      background: rgba(8, 31, 22, 0.76);
      color: #fde68a;
      border: 1px solid rgba(253, 230, 138, 0.48);
      backdrop-filter: blur(10px);
      box-shadow: none;
    }

    .sanctuary-hero-btn:hover {
      background: rgba(14, 48, 34, 0.82);
      border-color: rgba(253, 230, 138, 0.68);
      color: #ffffff;
      transform: translateY(-2px);
    }

    .hero-wave {
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      z-index: 1;
      line-height: 0;
      pointer-events: none;
    }

    .hero-wave svg {
      width: 100%;
      height: 58px;
      display: block;
    }
  }

  @media (min-width: 681px) and (max-width: 1024px) {
    .hero-stage {
      margin-top: -4.8rem;
      padding: 6.1rem 1.25rem 5rem;
    }

    .hero-painted-backdrop {
      opacity: 0.24;
    }

    .hero-aurora {
      opacity: 0.6;
    }

    .hero-scrim {
      background: linear-gradient(
        180deg,
        rgba(8, 29, 20, 0.72) 0%,
        rgba(9, 32, 22, 0.68) 65%,
        rgba(11, 38, 27, 0.52) 100%
      );
    }
  }

  @keyframes floatFirefly {
    0%, 100% {
      transform: translateY(0px) scale(0.9);
      opacity: 0.35;
    }
    50% {
      transform: translateY(-16px) scale(1.15);
      opacity: 0.95;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .firefly {
      animation: none;
      opacity: 0.65;
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
    .hero-painted-backdrop,
    .hero-aurora,
    .hero-scrim,
    .fireflies-layer,
    .hero-wave {
      display: none;
    }

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
