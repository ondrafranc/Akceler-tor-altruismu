<script>
  import { trackEvent } from '$lib/analytics.js';
  import { MICRO_ACTIONS } from '$lib/data/czech-actions.js';

  export let microActionsCount = MICRO_ACTIONS.length;
  export let fireflies = [
    { left: "8%", top: "24%", size: 5, delay: "0s", dur: "7.5s", gold: true },
    { left: "19%", top: "68%", size: 4, delay: "1.4s", dur: "8.8s", gold: false },
    { left: "34%", top: "20%", size: 5, delay: "2.6s", dur: "7.2s", gold: true },
    { left: "48%", top: "74%", size: 6, delay: "0.8s", dur: "9.1s", gold: true },
    { left: "64%", top: "18%", size: 5, delay: "1.9s", dur: "8.3s", gold: false },
    { left: "81%", top: "22%", size: 7, delay: "2.2s", dur: "9.4s", gold: true },
    { left: "90%", top: "60%", size: 5, delay: "1.5s", dur: "7.1s", gold: false },
  ];

  function handleActionAnchorClick(e) {
    if (typeof document !== 'undefined') {
      const target = document.getElementById('dnesni-skutek');
      if (target) {
        if (e && e.preventDefault) e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        trackEvent('aa_hero_mobile_scroll_action', { to: 'dnesni-skutek' });
      }
    }
  }
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

  <div class="hero-inner">
    <div class="hero-copy">
      <div class="hero-overline">
        <span class="live-dot" aria-hidden="true"></span>
        <span>Zdarma a bez účtu · {microActionsCount} ověřených cest v Česku</span>
      </div>

      <h1 class="hero-title">
        Pomáhat může být lehké.
        <span class="hero-serif">Stačí jeden dobrý skutek dnes.</span>
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
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.3"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>Mapa pomoci v okolí</span>
          <span class="arrow" aria-hidden="true">→</span>
        </a>

        <!-- Mobile Visual-First Primary Action Anchor: Smooth scroll to today's deed -->
        <a
          href="#dnesni-skutek"
          class="hero-btn primary hero-btn-mobile"
          on:click={handleActionAnchorClick}
          aria-label="Přejít k dnešnímu doporučenému skutku"
        >
          <span>⚡ Dnešní skutek (2 min) ↓</span>
        </a>

        <!-- Shared Sanctuary Link: Krajina dobra -->
        <a
          href="/svet"
          class="hero-btn sanctuary-hero-btn"
          on:click={() => trackEvent("aa_launch", { from: "hero_svet" })}
        >
          <span>✨ Krajina dobra</span>
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
    margin-top: -5.4rem;
    padding: 8.2rem 1.25rem 6rem;
    background: radial-gradient(
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
    background: radial-gradient(
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
    pointer-events: none;
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

  .hero-inner {
    position: relative;
    z-index: 2;
    max-width: 1140px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
    gap: 2.8rem;
    align-items: center;
  }

  .hero-copy {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .hero-overline {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    color: #a7f3d0;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    margin-bottom: 1rem;
  }

  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 10px #34d399;
  }

  .hero-title {
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: clamp(2.4rem, 4.4vw, 3.85rem);
    line-height: 1.07;
    letter-spacing: -0.035em;
    margin: 0 0 1.15rem 0;
    color: #ffffff;
  }

  .hero-serif {
    display: block;
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: clamp(2.45rem, 4.6vw, 4.05rem);
    line-height: 1.05;
    letter-spacing: 0;
    background: linear-gradient(120deg, #fde68a 0%, #6ee7b7 62%, #fbbf24 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-top: 0.2rem;
  }

  .hero-lead {
    color: rgba(230, 245, 236, 0.86);
    font-size: 1.06rem;
    line-height: 1.65;
    max-width: 48ch;
    margin: 0 0 1.75rem 0;
  }

  .hero-lead strong {
    color: #fde68a;
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
    gap: 0.55rem;
    padding: 0.88rem 1.35rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.94rem;
    text-decoration: none;
    transition: all 0.22s var(--ease-gentle);
    box-sizing: border-box;
  }

  .hero-btn.primary {
    background: linear-gradient(135deg, #34d399 0%, #fde68a 100%);
    color: #051810;
    box-shadow: 0 14px 32px -6px rgba(52, 211, 153, 0.42);
  }

  .hero-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 36px -6px rgba(52, 211, 153, 0.55);
  }

  .hero-btn.primary .arrow {
    transition: transform 0.2s ease;
  }

  .hero-btn.primary:hover .arrow {
    transform: translateX(3px);
  }

  .hero-btn-mobile {
    display: none;
  }

  .hero-btn-desktop {
    display: inline-flex;
  }

  .sanctuary-hero-btn {
    background: rgba(255, 255, 255, 0.1);
    color: #fde68a;
    border: 1px solid rgba(253, 230, 138, 0.36);
    backdrop-filter: blur(10px);
  }

  .sanctuary-hero-btn:hover {
    background: rgba(253, 230, 138, 0.2);
    color: #ffffff;
    transform: translateY(-2px);
  }

  .hero-wave {
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    line-height: 0;
    pointer-events: none;
  }

  .hero-wave svg {
    width: 100%;
    height: 58px;
    display: block;
  }

  @media (max-width: 1024px) {
    .hero-inner {
      grid-template-columns: minmax(0, 1fr);
      gap: 2rem;
    }
  }

  @media (max-width: 680px) {
    .hero-painted-backdrop {
      display: block;
      opacity: 0.44;
      background-position: center 36%;
      mask-image: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.95) 0%,
        rgba(0, 0, 0, 0.85) 60%,
        rgba(0, 0, 0, 0.22) 100%
      );
      -webkit-mask-image: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.95) 0%,
        rgba(0, 0, 0, 0.85) 60%,
        rgba(0, 0, 0, 0.22) 100%
      );
      pointer-events: none;
    }

    .hero-aurora {
      opacity: 0.88;
      filter: blur(30px);
      inset: -15% -15% 10% -15%;
    }

    .hero-stage {
      margin-top: -3.6rem;
      padding: 1.8rem 0.75rem 1.25rem;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }

    .hero-inner {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
      width: 100%;
      max-width: 100%;
    }

    .hero-copy {
      display: none !important;
    }

    .hero-overline {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #a7f3d0;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.015em;
      margin-bottom: 0.85rem;
      background: rgba(16, 185, 129, 0.12);
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      border: 1px solid rgba(52, 211, 153, 0.22);
      backdrop-filter: blur(8px);
      max-width: 100%;
      box-sizing: border-box;
    }

    .hero-overline .live-dot {
      width: 7px;
      height: 7px;
    }

    .hero-title {
      font-size: clamp(2rem, 7.8vw, 2.75rem);
      line-height: 1.1;
      margin: 0 0 0.85rem 0;
      letter-spacing: -0.03em;
      overflow-wrap: break-word;
      color: #ffffff;
      text-shadow: 0 2px 14px rgba(5, 24, 16, 0.5);
    }

    .hero-serif {
      display: block;
      font-size: clamp(2.05rem, 8.2vw, 2.85rem);
      line-height: 1.08;
      margin-top: 0.25rem;
    }

    .hero-lead {
      display: block;
      font-size: clamp(0.96rem, 3.6vw, 1.1rem);
      line-height: 1.58;
      color: rgba(230, 245, 236, 0.92);
      margin: 0 0 1.6rem 0;
      max-width: 44ch;
    }

    .hero-ctas {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
      width: 100%;
      max-width: 380px;
      margin-top: 0.35rem;
    }

    .hero-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.92rem 1.35rem;
      font-size: 0.98rem;
      border-radius: 999px;
      text-align: center;
      box-sizing: border-box;
      width: 100%;
    }

    .hero-btn-desktop {
      display: none !important;
    }

    .hero-btn-mobile {
      display: inline-flex !important;
      font-weight: 800;
      letter-spacing: -0.01em;
      box-shadow: 0 12px 28px -4px rgba(52, 211, 153, 0.45);
    }

    .sanctuary-hero-btn {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(253, 230, 138, 0.38);
      backdrop-filter: blur(10px);
    }
  }

  @media (min-width: 460px) and (max-width: 680px) {
    .hero-ctas {
      flex-direction: row;
      align-items: center;
    }

    .hero-btn {
      flex: 1 1 0;
      width: auto;
    }
  }

  @media (max-width: 360px) {
    .hero-stage {
      padding: 1.4rem 0.5rem 1.15rem;
    }

    .hero-copy {
      padding: 1rem 0.15rem 1.8rem;
    }

    .hero-title {
      font-size: 1.7rem;
    }

    .hero-serif {
      font-size: 1.75rem;
    }

    .hero-lead {
      font-size: 0.88rem;
      line-height: 1.5;
    }

    .hero-overline {
      font-size: 0.74rem;
      padding: 0.28rem 0.55rem;
    }

    .hero-btn {
      padding: 0.82rem 1.1rem;
      font-size: 0.9rem;
    }
  }
</style>
