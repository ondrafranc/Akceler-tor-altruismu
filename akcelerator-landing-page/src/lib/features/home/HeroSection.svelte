<script>
  import AppIcon from '$lib/components/AppIcon.svelte';
  import { trackEvent } from '$lib/analytics.js';
  import { MICRO_ACTIONS } from '$lib/data/czech-actions.js';

  /**
   * @type {{
   *   microActionsCount?: number,
   *   desktopClaimSerif?: string,
   *   mobileClaim?: string,
   *   fireflies?: Array<{ left: string; top: string; size: number; delay: string; dur: string; gold: boolean; sky?: boolean }>,
   *   children?: import('svelte').Snippet
   * }}
   */
  let {
    microActionsCount = MICRO_ACTIONS.length,
    desktopClaimSerif = "Stačí jeden dobrý skutek dnes.",
    mobileClaim = "Jeden ověřený dobrý skutek na 2 minuty zdarma.",
    fireflies = [
      { left: "5%", top: "12.5%", size: 6, delay: "0s", dur: "7.6s", gold: true, sky: true },
      { left: "24%", top: "12%", size: 5, delay: "1.6s", dur: "8.2s", gold: true, sky: true },
      { left: "44%", top: "14%", size: 6, delay: "2.5s", dur: "7.4s", gold: false, sky: true },
      { left: "calc(50% + 38px)", top: "46%", size: 5, delay: "0.9s", dur: "8.5s", gold: true, sky: true },
      { left: "calc(50% - 30px)", top: "73%", size: 6, delay: "0.4s", dur: "9.0s", gold: true, sky: true },
      { left: "12%", top: "86%", size: 6, delay: "1.2s", dur: "8.1s", gold: true, sky: false },
      { left: "31%", top: "87%", size: 5, delay: "2.0s", dur: "7.7s", gold: false, sky: false },
      { left: "95.5%", top: "24%", size: 6, delay: "2.2s", dur: "9.1s", gold: true, sky: false },
      { left: "94%", top: "64%", size: 5, delay: "1.5s", dur: "7.3s", gold: false, sky: false },
    ],
    children
  } = $props();
</script>

<section class="hero-stage">
  <picture class="hero-painted-backdrop" aria-hidden="true">
    <source
      srcset="/art/sanctuary-dawn-800.webp 800w, /art/sanctuary-dawn.webp 1400w"
      sizes="100vw"
      type="image/webp"
    />
    <img
      src="/art/sanctuary-dawn.jpg"
      alt=""
      decoding="async"
      fetchpriority="high"
      class="hero-backdrop-img"
    />
  </picture>
  <div class="hero-aurora" aria-hidden="true"></div>
  <div class="fireflies-layer" aria-hidden="true">
    {#each fireflies as f}
      <span
        class="firefly"
        class:gold={f.gold}
        class:sky-corridor={Boolean(f.sky)}
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
          <span class="hero-serif">{desktopClaimSerif}</span>
        </span>
        <span class="hero-mobile-claim">{mobileClaim}</span>
      </h1>

      <p class="hero-lead">
        Zvol si, kolik máš zrovna času, najdi místo pomoci ve svém okolí nebo
        si na minutu vydechni v <strong>Krajině dobra</strong>.
      </p>

      <div class="hero-ctas">
        <!-- Desktop Secondary Navigation CTA: Near Map (subordinated to instant card CTA) -->
        <a
          href="/near"
          class="hero-btn primary hero-btn-desktop"
          onclick={() => trackEvent("aa_launch", { from: "hero_map" })}
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
          onclick={() => trackEvent("aa_launch", { from: "hero_svet" })}
        >
          <AppIcon name="sparkles" size={17} strokeWidth={2} />
          <span>Krajina dobra</span>
        </a>
      </div>
    </div>

    {@render children?.()}
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
    grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
    gap: 2.5rem;
    align-items: start;
  }

  .hero-painted-backdrop {
    display: block;
    pointer-events: none;
  }

  .hero-backdrop-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 43%;
    display: block;
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
          92% 88% at 78% 24%,
          rgba(38, 144, 97, 0.88) 0%,
          rgba(26, 104, 70, 0.42) 48%,
          transparent 70%
        ),
        radial-gradient(
          68% 74% at 12% 14%,
          rgba(251, 191, 36, 0.3) 0%,
          rgba(52, 211, 153, 0.16) 38%,
          transparent 64%
        ),
        radial-gradient(
          64% 58% at 44% 78%,
          rgba(245, 158, 11, 0.22) 0%,
          transparent 62%
        ),
        linear-gradient(158deg, #0e3323 0%, #164b34 50%, #1e6043 100%);
      color: #f8faf8;
      border-bottom: none;
      overflow: hidden;
    }

    .hero-painted-backdrop {
      position: absolute;
      inset: 0;
      opacity: 0.78;
      mask-image: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.72) 0%,
        rgba(0, 0, 0, 0.94) 48%,
        rgba(0, 0, 0, 1) 100%
      );
      -webkit-mask-image: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.72) 0%,
        rgba(0, 0, 0, 0.94) 48%,
        rgba(0, 0, 0, 1) 100%
      );
      pointer-events: none;
    }

    .hero-aurora {
      position: absolute;
      inset: -18% -10% 0 -10%;
      background:
        radial-gradient(
          circle at 15% 18%,
          rgba(253, 224, 71, 0.22) 0%,
          rgba(52, 211, 153, 0.14) 32%,
          transparent 54%
        ),
        radial-gradient(
          circle at 72% 38%,
          rgba(52, 211, 153, 0.28) 0%,
          transparent 44%
        ),
        radial-gradient(
          circle at 58% 24%,
          rgba(251, 191, 36, 0.24) 0%,
          transparent 36%
        );
      filter: blur(26px);
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
        rgba(7, 26, 17, 0.7) 0%,
        rgba(8, 30, 20, 0.66) 49%,
        rgba(10, 35, 24, 0.24) 61%,
        transparent 75%
      );
    }

    .firefly {
      position: absolute;
      border-radius: 50%;
      background: #6ee7b7;
      box-shadow: 0 0 16px 4px rgba(52, 211, 153, 0.62);
      animation: floatFirefly 8s ease-in-out infinite;
    }

    .firefly.gold {
      background: #fef08a;
      box-shadow: 0 0 18px 5px rgba(251, 191, 36, 0.72);
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
      color: #d1fae5;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .live-dot {
      background: #34d399;
      box-shadow: 0 0 12px 2px rgba(52, 211, 153, 0.85);
    }

    .hero-title {
      font-size: clamp(2.05rem, 3.05vw, 2.85rem);
      line-height: 1.08;
      margin: 0 0 1.1rem 0;
      color: #ffffff;
    }

    .hero-serif {
      font-size: clamp(2.1rem, 3.2vw, 3.02rem);
      line-height: 1.06;
      color: #fde68a;
      background: linear-gradient(118deg, #fde68a 0%, #bbf7d0 54%, #fef08a 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-lead {
      color: #f0fdf4;
      font-size: 1.06rem;
      line-height: 1.65;
      margin: 0 0 1.75rem 0;
    }

    .hero-lead strong {
      color: #fef08a;
    }

    .hero-btn {
      gap: 0.55rem;
      padding: 0.88rem 1.35rem;
    }

    .hero-btn.primary {
      background: rgba(13, 47, 32, 0.74);
      color: #ecfdf5;
      border: 1px solid rgba(110, 231, 183, 0.56);
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 22px -8px rgba(4, 18, 12, 0.3);
    }

    .hero-btn.primary:hover {
      background: rgba(18, 63, 43, 0.84);
      border-color: rgba(167, 243, 208, 0.82);
      color: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 12px 26px -8px rgba(4, 18, 12, 0.42);
    }

    .hero-copy a:focus-visible {
      outline: 2px solid #fef3c7;
      outline-offset: 3px;
      box-shadow: 0 0 0 5px rgba(10, 35, 24, 0.72);
    }

    .sanctuary-hero-btn {
      background: rgba(9, 34, 23, 0.78);
      color: #fef08a;
      border: 1px solid rgba(253, 230, 138, 0.52);
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 22px -8px rgba(4, 18, 12, 0.3);
    }

    .sanctuary-hero-btn:hover {
      background: rgba(16, 58, 40, 0.82);
      border-color: rgba(254, 240, 138, 0.78);
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

  @media (min-width: 1200px) {
    .hero-stage {
      padding-bottom: 6.4rem;
    }

    .hero-copy {
      padding-top: 2rem;
    }
  }

  @media (min-width: 681px) and (max-width: 1024px) {
    .hero-stage {
      margin-top: -4.8rem;
      padding: 6.1rem 1.25rem 5rem;
    }

    .hero-painted-backdrop {
      opacity: 0.56;
    }

    .hero-aurora {
      opacity: 0.72;
    }

    .firefly.sky-corridor {
      display: none;
    }

    .hero-scrim {
      background: linear-gradient(
        180deg,
        rgba(7, 27, 19, 0.62) 0%,
        rgba(9, 33, 23, 0.56) 44%,
        rgba(12, 42, 29, 0.14) 76%,
        transparent 100%
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
    .fireflies-layer {
      display: none;
    }

    .hero-stage {
      position: relative;
      overflow: hidden;
      margin-top: 0;
      padding: 0 0.75rem 0.65rem;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      background: var(--surface-page, #f6f7f3);
      border-bottom: none;
    }

    .hero-painted-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 148px;
      opacity: 0.85;
      mask-image: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.96) 0%,
        rgba(0, 0, 0, 0.82) 64%,
        transparent 100%
      );
      -webkit-mask-image: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.96) 0%,
        rgba(0, 0, 0, 0.82) 64%,
        transparent 100%
      );
      pointer-events: none;
      z-index: 0;
    }

    .hero-backdrop-img {
      object-position: center 42%;
    }

    .hero-aurora {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 140px;
      background: radial-gradient(
        80% 90% at 24% 25%,
        rgba(253, 224, 71, 0.28) 0%,
        rgba(52, 211, 153, 0.16) 55%,
        transparent 100%
      );
      pointer-events: none;
      z-index: 0;
    }

    .hero-scrim {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 148px;
      background: linear-gradient(
        180deg,
        rgba(6, 24, 16, 0.78) 0%,
        rgba(7, 28, 19, 0.7) 68%,
        rgba(246, 247, 243, 0) 100%
      );
      pointer-events: none;
      z-index: 0;
    }

    .hero-wave {
      position: absolute;
      top: 118px;
      left: 0;
      right: 0;
      bottom: auto;
      z-index: 1;
      line-height: 0;
      pointer-events: none;
    }

    .hero-wave svg {
      width: 100%;
      height: 24px;
      display: block;
    }

    .hero-inner {
      position: relative;
      z-index: 2;
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
      width: 100%;
      max-width: 100%;
    }

    .hero-copy {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.42rem 0.45rem 0.34rem;
      margin-bottom: 0.14rem;
      min-height: 74px;
      box-sizing: border-box;
      text-align: center;
    }

    .hero-overline {
      display: inline-flex !important;
      align-items: center;
      gap: 0.38rem;
      padding: 0.14rem 0.54rem;
      margin-bottom: 0.2rem;
      border-radius: 999px;
      background: rgba(9, 34, 23, 0.72);
      border: 1px solid rgba(253, 230, 138, 0.42);
      color: #fef3c7;
      font-size: 0.69rem;
      font-weight: 700;
    }

    .live-dot {
      background: #34d399;
    }

    .hero-desktop-heading,
    .hero-lead,
    .hero-ctas {
      display: none !important;
    }

    .hero-title {
      font-size: clamp(0.98rem, 4.1vw, 1.12rem);
      line-height: 1.24;
      margin: 0;
      letter-spacing: -0.015em;
      overflow-wrap: break-word;
      color: #ffffff;
    }

    .hero-mobile-claim {
      display: block;
      font-size: inherit;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
      line-height: 1.24;
      text-shadow: 0 1px 10px rgba(4, 18, 12, 0.52);
    }
  }

  @media (max-width: 360px) {
    .hero-stage {
      padding: 0 0.5rem 0.85rem;
    }

    .hero-copy {
      padding: 0.52rem 0.35rem 0.45rem;
      margin-bottom: 0.3rem;
    }

    .hero-title,
    .hero-mobile-claim {
      font-size: 0.94rem;
      line-height: 1.22;
    }
  }
</style>
