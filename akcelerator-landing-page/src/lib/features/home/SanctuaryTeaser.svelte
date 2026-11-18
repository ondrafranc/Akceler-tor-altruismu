<script>
  import AppIcon from '$lib/components/AppIcon.svelte';
  import { trackEvent } from '../../analytics.js';
</script>

<section
  class="content-wrap sanctuary-portal-section"
  aria-label="Krajina dobra a dechové zastavení"
>
  <div class="sanctuary-portal-card">
    <div class="sanctuary-copy">
      <div class="sanctuary-kicker-row">
        <span class="stage-kicker">
          <AppIcon name="trees" size={13} strokeWidth={2.1} />
          <span>KRAJINA DOBRA · MALOVANÝ SVĚT POMOCI</span>
        </span>
      </div>
      <h2>
        Podívej se, jak drobné skutky <span class="serif-gold">rozsvěcují krajinu</span>
      </h2>
      <p>
        Interaktivní malovaná tůň, kde každá lucerna na hladině a hvězda na
        obloze představuje skutečnou lidskou pomoc. Vyzkoušej živý svět, rozsviť
        svůj dnešní dobrý skutek nebo si dopřej minutu klidného dechu.
      </p>

      <div class="sanctuary-features-strip" aria-hidden="true">
        <span class="feature-tag">
          <AppIcon name="flame" size={13} strokeWidth={2} />
          <span>Plovoucí lucerny</span>
        </span>
        <span class="feature-tag">
          <AppIcon name="star" size={13} strokeWidth={2} />
          <span>Zářící hvězdy</span>
        </span>
        <span class="feature-tag">
          <AppIcon name="wind" size={13} strokeWidth={2} />
          <span>Klidný dech</span>
        </span>
      </div>

      <div class="sanctuary-cta-row">
        <a
          href="/svet"
          class="sanctuary-open-btn"
          on:click={() => trackEvent("aa_home_portal_svet")}
        >
          <AppIcon name="trees" size={17} strokeWidth={2} />
          <span>Vstoupit do Krajiny dobra</span>
          <span class="btn-arrow" aria-hidden="true">
            <AppIcon name="arrow-right" size={16} strokeWidth={2.2} />
          </span>
        </a>
        <a href="/svet#dech" class="sanctuary-breath-link">
          <span class="breath-icon" aria-hidden="true">
            <AppIcon name="wind" size={16} strokeWidth={2} />
          </span>
          <span>Dechové zastavení</span>
          <span class="breath-pill-time">1–2 min</span>
        </a>
      </div>
    </div>

    <a
      href="/svet"
      class="sanctuary-preview-window"
      aria-label="Otevřít živou Krajinu dobra"
      on:click={() => trackEvent("aa_home_portal_svet_preview")}
    >
      <div class="preview-stage">
        <picture>
          <source srcset="/art/sanctuary-dawn-800.webp" type="image/webp" />
          <img
            src="/art/sanctuary-dawn.jpg"
            alt="Malovaná česká tůň zalitá zlatým svítáním s plovoucími lucernami dobrých skutků"
            loading="lazy"
            decoding="async"
            class="preview-bg-img"
          />
        </picture>

        <!-- Clean editorial corner badge & CTA overlay -->
        <div class="spw-live-pill" aria-hidden="true">
          <span class="live-pulse-dot"></span>
          <span>Živý náhled · Krajina dobra</span>
        </div>
        <span class="spw-enter">
          <span>Vstoupit do tůně</span>
          <AppIcon name="arrow-right" size={14} strokeWidth={2.2} />
        </span>
      </div>
    </a>
  </div>
</section>

<style>
  .sanctuary-portal-section {
    margin-top: 2rem;
    margin-bottom: 2.25rem;
  }

  .sanctuary-portal-card {
    position: relative;
    display: grid;
    grid-template-columns: 1.12fr 0.88fr;
    gap: 2.2rem;
    align-items: center;
    padding: 2.2rem 2.4rem;
    border-radius: 22px;
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-top: 3px solid var(--forest-canopy, #173829);
    box-shadow: var(--shadow-md, 0 8px 20px -6px rgba(18, 42, 30, 0.08));
    overflow: hidden;
  }

  .stage-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--accent-warm, #b8651b);
    text-transform: uppercase;
    background: var(--accent-warm-tint, #fef6e8);
    border: 1px solid rgba(184, 101, 27, 0.24);
    padding: 0.26rem 0.68rem;
    border-radius: 999px;
    margin-bottom: 0.85rem;
  }

  .sanctuary-copy h2 {
    font-size: clamp(1.6rem, 2.7vw, 2.25rem);
    font-weight: 800;
    line-height: 1.2;
    margin: 0 0 0.85rem 0;
    color: var(--ink-primary, #14281d);
    letter-spacing: -0.02em;
  }

  .serif-gold {
    font-family: var(--font-serif, "Georgia", serif);
    font-style: italic;
    font-weight: 400;
    color: var(--accent-primary, #1b5e42);
  }

  .sanctuary-copy p {
    font-size: 0.95rem;
    line-height: 1.58;
    color: var(--ink-secondary, #3f574a);
    margin: 0 0 1.15rem 0;
    max-width: 36rem;
  }

  .sanctuary-features-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-bottom: 1.45rem;
  }

  .feature-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--ink-secondary, #3f574a);
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    padding: 0.22rem 0.58rem;
    border-radius: 999px;
  }

  .sanctuary-cta-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex-wrap: wrap;
  }

  .sanctuary-open-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 44px;
    padding: 0.76rem 1.35rem;
    border-radius: 999px;
    background: var(--accent-primary, #1b5e42);
    border: 1px solid var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.94rem;
    text-decoration: none;
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
    transition: background-color 0.2s var(--ease-gentle), border-color 0.2s var(--ease-gentle);
    box-sizing: border-box;
  }

  .sanctuary-open-btn:hover {
    background: var(--accent-primary-hover, #144732);
    border-color: var(--accent-primary-hover, #144732);
  }

  .sanctuary-open-btn .btn-arrow {
    display: inline-flex;
    align-items: center;
    transition: transform 0.18s ease;
  }

  .sanctuary-open-btn:hover .btn-arrow {
    transform: translateX(3px);
  }

  .sanctuary-breath-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.42rem;
    min-height: 44px;
    padding: 0.7rem 1.1rem;
    border-radius: 999px;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-strong, #c2cec5);
    color: var(--ink-primary, #14281d);
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;
    box-sizing: border-box;
    transition: background-color 0.18s ease, border-color 0.18s ease;
  }

  .sanctuary-breath-link:hover {
    background: #e1eae4;
    border-color: var(--accent-primary, #1b5e42);
  }

  .breath-icon {
    display: inline-flex;
    align-items: center;
    color: var(--accent-primary, #1b5e42);
  }

  .breath-pill-time {
    font-size: 0.72rem;
    padding: 0.12rem 0.45rem;
    border-radius: 999px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    color: var(--ink-secondary, #3f574a);
  }

  /* =========================================================================
     CALM EDITORIAL PREVIEW WINDOW
     ========================================================================= */
  .sanctuary-preview-window {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    display: block;
    min-height: 44px;
    aspect-ratio: 16 / 10.5;
    border: 1px solid var(--border-subtle, #dce3dd);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
    text-decoration: none;
    background: var(--bg-subtle, #edf2ee);
    transition: transform 0.22s var(--ease-gentle, ease), border-color 0.22s ease;
  }

  .sanctuary-preview-window:hover {
    transform: translateY(-2px);
    border-color: var(--accent-primary, #1b5e42);
  }

  .preview-stage {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .preview-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }

  .sanctuary-preview-window:hover .preview-bg-img {
    transform: scale(1.03);
  }

  /* Crisp non-blurred corner overlays */
  .spw-live-pill {
    position: absolute;
    top: 0.7rem;
    left: 0.7rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.26rem 0.65rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid var(--border-subtle, #dce3dd);
    color: var(--ink-primary, #14281d);
    font-size: 0.73rem;
    font-weight: 700;
  }

  .live-pulse-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-primary, #1b5e42);
    flex-shrink: 0;
  }

  .spw-enter {
    position: absolute;
    bottom: 0.7rem;
    right: 0.7rem;
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    padding: 0.4rem 0.85rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid var(--border-strong, #c2cec5);
    color: var(--ink-primary, #14281d);
    font-size: 0.8rem;
    font-weight: 700;
    transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  }

  .sanctuary-preview-window:hover .spw-enter {
    background: var(--accent-primary, #1b5e42);
    border-color: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  @media (min-width: 961px) {
    .sanctuary-portal-card {
      background: var(--forest-deep, #11291e);
      color: #f4f7f3;
      border: 1px solid #224433;
      box-shadow: 0 14px 34px -12px rgba(14, 34, 24, 0.22),
        0 2px 8px rgba(14, 34, 24, 0.08);
    }

    .stage-kicker {
      background: rgba(254, 246, 232, 0.1);
      border-color: rgba(245, 207, 139, 0.32);
      color: #f5cf8b;
    }

    .sanctuary-copy h2 {
      color: #f4f7f3;
    }

    .serif-gold {
      color: #ebc983;
    }

    .sanctuary-copy p {
      color: #d2e1d8;
    }

    .feature-tag {
      background: rgba(231, 239, 234, 0.1);
      border-color: rgba(200, 215, 205, 0.24);
      color: #dfebe4;
    }

    .sanctuary-open-btn {
      background: #e8f1ec;
      border-color: #e8f1ec;
      color: #11291e;
    }

    .sanctuary-open-btn:hover {
      background: #ffffff;
      border-color: #ffffff;
      color: #0c1f16;
    }

    .sanctuary-breath-link {
      background: rgba(255, 255, 255, 0.09);
      border-color: rgba(200, 215, 205, 0.3);
      color: #f3f6f2;
    }

    .sanctuary-breath-link:hover {
      background: rgba(255, 255, 255, 0.16);
      border-color: #9ad4b5;
    }

    .breath-icon {
      color: #9ad4b5;
    }

    .breath-pill-time {
      background: rgba(12, 28, 20, 0.55);
      border-color: rgba(200, 215, 205, 0.26);
      color: #dfebe4;
    }

    .sanctuary-preview-window {
      border-color: rgba(200, 215, 205, 0.28);
      background: #0e2118;
    }

    .sanctuary-preview-window:hover {
      border-color: #9ad4b5;
    }

    .spw-live-pill {
      background: rgba(17, 41, 30, 0.9);
      border-color: rgba(231, 239, 234, 0.26);
      color: #f3f6f2;
    }

    .live-pulse-dot {
      background: #7be0ad;
    }
  }

  @media (max-width: 960px) {
    .sanctuary-portal-card {
      grid-template-columns: minmax(0, 1fr);
      padding: 1.65rem 1.35rem;
      gap: 1.5rem;
    }

    .sanctuary-copy h2 {
      font-size: 1.6rem;
    }
  }

  @media (max-width: 680px) {
    .sanctuary-portal-section {
      margin-top: 1.4rem;
      margin-bottom: 1.75rem;
    }

    .sanctuary-portal-card {
      padding: 1.25rem 1.1rem;
      border-radius: 18px;
    }

    .sanctuary-cta-row {
      flex-direction: column;
      align-items: stretch;
      gap: 0.6rem;
    }

    .sanctuary-open-btn,
    .sanctuary-breath-link {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
      padding: 0.72rem 1rem;
    }

    .sanctuary-preview-window {
      aspect-ratio: 16 / 10;
      border-radius: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sanctuary-preview-window:hover {
      transform: none !important;
    }
  }
</style>
