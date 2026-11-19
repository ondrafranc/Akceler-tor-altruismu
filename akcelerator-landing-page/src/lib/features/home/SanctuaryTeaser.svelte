<script>
  import AppIcon from "$lib/components/AppIcon.svelte";
  import { trackEvent } from "../../analytics.js";
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
          <span>KRAJINA DOBRA · TICHÉ ÚTOČIŠTĚ</span>
        </span>
      </div>
      <h2>
        Podívej se, jak drobné skutky <span class="serif-gold"
          >rozsvěcují krajinu</span
        >
      </h2>
      <p>
        Klidná česká lesní tůň, kde každá lucerna na hladině a hvězda na obloze
        připomíná jeden dobrý skutek. Zastav se na chvíli, rozsviť ten svůj nebo
        si dopřej minutu klidného dechu.
      </p>

      <div class="sanctuary-features-strip" aria-hidden="true">
        <span class="feature-tag">
          <span class="feature-icon"
            ><AppIcon name="flame" size={13} strokeWidth={2} /></span
          >
          <span>Plovoucí lucerny</span>
        </span>
        <span class="feature-tag">
          <span class="feature-icon"
            ><AppIcon name="star" size={13} strokeWidth={2} /></span
          >
          <span>Zářící hvězdy</span>
        </span>
        <span class="feature-tag">
          <span class="feature-icon"
            ><AppIcon name="wind" size={13} strokeWidth={2} /></span
          >
          <span>Klidný dech</span>
        </span>
      </div>

      <div class="sanctuary-cta-row">
        <a
          href="/svet"
          class="sanctuary-open-btn"
          onclick={() => trackEvent("aa_home_portal_svet")}
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
      onclick={() => trackEvent("aa_home_portal_svet_preview")}
    >
      <div class="preview-stage">
        <picture>
          <source srcset="/art/sanctuary-dawn-800.webp" type="image/webp" />
          <img
            src="/art/sanctuary-dawn.jpg"
            alt="Klidná česká lesní tůň za ranního svítání obklopená břízami a smrky"
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
    border-top: 3px solid var(--czech-linden, #256f4e);
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
    color: var(--accent-warm-ink, #8f4b0e);
    text-transform: uppercase;
    background: var(--accent-warm-tint, #fef6e8);
    border: 1px solid rgba(143, 75, 14, 0.24);
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
    color: var(--czech-forest, #1d5c40);
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

  .feature-icon {
    display: inline-flex;
    align-items: center;
    color: var(--czech-forest, #1d5c40);
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
    background: var(--czech-forest, #1d5c40);
    border: 1px solid var(--czech-forest, #1d5c40);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.94rem;
    text-decoration: none;
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
    transition:
      background-color 0.2s var(--ease-gentle),
      border-color 0.2s var(--ease-gentle);
    box-sizing: border-box;
  }

  .sanctuary-open-btn:hover {
    background: var(--czech-forest-hover, #164932);
    border-color: var(--czech-forest-hover, #164932);
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
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease;
  }

  .sanctuary-breath-link:hover {
    background: var(--bohemian-mist, #e6f0ea);
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
    transition:
      transform 0.22s var(--ease-gentle, ease),
      border-color 0.22s ease;
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
    transition:
      background-color 0.18s ease,
      color 0.18s ease,
      border-color 0.18s ease;
  }

  .sanctuary-preview-window:hover .spw-enter {
    background: var(--accent-primary, #1b5e42);
    border-color: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  @media (min-width: 961px) {
    .sanctuary-portal-card {
      background: linear-gradient(
        135deg,
        var(--bohemian-sage, #eef5f0) 0%,
        var(--bohemian-mist, #e6f0ea) 100%
      );
      color: var(--ink-primary, #14281d);
      border: 1px solid var(--border-forest, #c5d9cd);
      border-top: 3px solid var(--czech-linden, #256f4e);
      box-shadow:
        0 12px 30px -12px rgba(24, 62, 44, 0.12),
        0 2px 8px rgba(24, 62, 44, 0.05);
    }

    .stage-kicker {
      background: var(--bg-surface, #ffffff);
      border-color: var(--border-forest, #c5d9cd);
      color: var(--accent-warm-ink, #8f4b0e);
    }

    .sanctuary-copy h2 {
      color: var(--ink-primary, #14281d);
    }

    .serif-gold {
      color: var(--czech-forest, #1d5c40);
    }

    .sanctuary-copy p {
      color: var(--ink-secondary, #3f574a);
    }

    .feature-tag {
      background: var(--bg-surface, #ffffff);
      border-color: var(--border-forest, #c5d9cd);
      color: var(--ink-secondary, #3f574a);
    }

    .feature-icon {
      color: var(--czech-forest, #1d5c40);
    }

    .sanctuary-open-btn {
      background: var(--czech-forest, #1d5c40);
      border-color: var(--czech-forest, #1d5c40);
      color: #ffffff;
    }

    .sanctuary-open-btn:hover {
      background: var(--czech-forest-hover, #164932);
      border-color: var(--czech-forest-hover, #164932);
      color: #ffffff;
    }

    .sanctuary-breath-link {
      background: var(--bg-surface, #ffffff);
      border-color: var(--border-forest-strong, #a7c4b3);
      color: var(--ink-primary, #14281d);
    }

    .sanctuary-breath-link:hover {
      background: var(--bohemian-sage, #eef5f0);
      border-color: var(--czech-linden, #256f4e);
    }

    .breath-icon {
      color: var(--czech-forest, #1d5c40);
    }

    .breath-pill-time {
      background: var(--bohemian-sage, #eef5f0);
      border-color: var(--border-forest, #c5d9cd);
      color: var(--ink-secondary, #3f574a);
    }

    .sanctuary-preview-window {
      border-color: var(--border-forest-strong, #a7c4b3);
      background: var(--bohemian-mist, #e6f0ea);
    }

    .sanctuary-preview-window:hover {
      border-color: var(--czech-linden, #256f4e);
    }

    .spw-live-pill {
      background: rgba(255, 255, 255, 0.95);
      border-color: var(--border-forest, #c5d9cd);
      color: var(--ink-primary, #14281d);
    }

    .live-pulse-dot {
      background: var(--czech-linden, #256f4e);
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
