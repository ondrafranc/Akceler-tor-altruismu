<script>
  import { trackEvent } from '../../analytics.js';
</script>

<section
  class="content-wrap sanctuary-portal-section"
  aria-label="Krajina dobra a dechové zastavení"
>
  <div class="sanctuary-portal-card">
    <div class="sanctuary-copy">
      <div class="sanctuary-kicker-row">
        <span class="stage-kicker">✨ KRAJINA DOBRA · MALOVANÝ SVĚT POMOCI</span>
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
        <span class="feature-tag">🏮 Plovoucí lucerny</span>
        <span class="feature-tag">✦ Zářící hvězdy</span>
        <span class="feature-tag">🌊 Klidný dech</span>
      </div>

      <div class="sanctuary-cta-row">
        <a
          href="/svet"
          class="sanctuary-open-btn"
          on:click={() => trackEvent("aa_home_portal_svet")}
        >
          <span>✨ Vstoupit do Krajiny dobra</span>
          <span class="btn-arrow" aria-hidden="true">→</span>
        </a>
        <a href="/svet#dech" class="sanctuary-breath-link">
          <span class="breath-icon" aria-hidden="true">🌊</span>
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

        <!-- Ambient golden atmospheric overlay -->
        <div class="preview-atmosphere" aria-hidden="true"></div>

        <!-- Animated living lanterns on the water -->
        <div class="living-lantern lantern-1" aria-hidden="true">
          <span class="lantern-glow"></span>
          <span class="lantern-body">🏮</span>
          <span class="lantern-reflection"></span>
        </div>
        <div class="living-lantern lantern-2" aria-hidden="true">
          <span class="lantern-glow"></span>
          <span class="lantern-body">🏮</span>
          <span class="lantern-reflection"></span>
        </div>
        <div class="living-lantern lantern-3" aria-hidden="true">
          <span class="lantern-glow"></span>
          <span class="lantern-body">🏮</span>
          <span class="lantern-reflection"></span>
        </div>

        <!-- Drifting starlight fireflies -->
        <div class="living-firefly firefly-1" aria-hidden="true"></div>
        <div class="living-firefly firefly-2" aria-hidden="true"></div>
        <div class="living-firefly firefly-3" aria-hidden="true"></div>
        <div class="living-firefly firefly-4" aria-hidden="true"></div>

        <!-- Live badge & CTA overlay -->
        <div class="spw-live-pill" aria-hidden="true">
          <span class="live-pulse-dot"></span>
          <span>Živý náhled · Krajina dobra</span>
        </div>
        <span class="spw-enter">Vstoupit do tůně →</span>
      </div>
    </a>
  </div>
</section>

<style>
  .sanctuary-portal-section {
    margin-top: 2rem;
    margin-bottom: 2.5rem;
  }

  .sanctuary-portal-card {
    position: relative;
    display: grid;
    grid-template-columns: 1.12fr 0.88fr;
    gap: 2.2rem;
    align-items: center;
    padding: 2.4rem 2.6rem;
    border-radius: 1.75rem;
    background:
      radial-gradient(100% 120% at 85% 15%, rgba(251, 191, 36, 0.16) 0%, transparent 60%),
      radial-gradient(80% 90% at 10% 85%, rgba(16, 185, 129, 0.14) 0%, transparent 65%),
      linear-gradient(165deg, #072218 0%, #0d3524 50%, #082419 100%);
    color: #f8fafc;
    border: 1px solid rgba(52, 211, 153, 0.32);
    box-shadow:
      0 20px 45px -12px rgba(4, 20, 14, 0.62),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);
    overflow: hidden;
  }

  .stage-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #fde68a;
    text-transform: uppercase;
    background: rgba(13, 46, 32, 0.72);
    border: 1px solid rgba(251, 191, 36, 0.34);
    padding: 0.24rem 0.65rem;
    border-radius: 999px;
    margin-bottom: 0.85rem;
  }

  .sanctuary-copy h2 {
    font-size: clamp(1.65rem, 2.7vw, 2.35rem);
    font-weight: 800;
    line-height: 1.22;
    margin: 0 0 0.95rem 0;
    color: #ffffff;
    letter-spacing: -0.015em;
  }

  .serif-gold {
    font-family: var(--font-serif, "Georgia", serif);
    font-style: italic;
    font-weight: 400;
    color: #fde68a;
    text-shadow: 0 2px 14px rgba(251, 191, 36, 0.28);
  }

  .sanctuary-copy p {
    font-size: 0.95rem;
    line-height: 1.58;
    color: #d1fae5;
    margin: 0 0 1.25rem 0;
    max-width: 36rem;
  }

  .sanctuary-features-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-bottom: 1.6rem;
  }

  .feature-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.74rem;
    font-weight: 600;
    color: #a7f3d0;
    background: rgba(5, 26, 18, 0.65);
    border: 1px solid rgba(52, 211, 153, 0.25);
    padding: 0.18rem 0.52rem;
    border-radius: 999px;
  }

  .sanctuary-cta-row {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    flex-wrap: wrap;
  }

  .sanctuary-open-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.82rem 1.45rem;
    border-radius: 999px;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 60%, #d97706 100%);
    color: #052014;
    font-weight: 800;
    font-size: 0.94rem;
    text-decoration: none;
    box-shadow:
      0 6px 20px -4px rgba(245, 158, 11, 0.48),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
    transition: all 0.2s var(--ease-gentle, ease);
  }

  .sanctuary-open-btn:hover {
    transform: translateY(-2px);
    box-shadow:
      0 10px 26px -4px rgba(245, 158, 11, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.45);
    color: #04180f;
  }

  .sanctuary-open-btn .btn-arrow {
    transition: transform 0.18s ease;
  }

  .sanctuary-open-btn:hover .btn-arrow {
    transform: translateX(3px);
  }

  .sanctuary-breath-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.72rem 1.15rem;
    border-radius: 999px;
    background: rgba(6, 34, 23, 0.7);
    border: 1px solid rgba(52, 211, 153, 0.35);
    color: #6ee7b7;
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: all 0.2s ease;
  }

  .sanctuary-breath-link:hover {
    background: rgba(16, 68, 47, 0.85);
    border-color: rgba(110, 231, 183, 0.55);
    color: #a7f3d0;
    transform: translateY(-1px);
  }

  .breath-pill-time {
    font-size: 0.72rem;
    padding: 0.1rem 0.42rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.22);
    color: #d1fae5;
  }

  /* =========================================================================
     LIVING DIORAMA PREVIEW WINDOW
     ========================================================================= */
  .sanctuary-preview-window {
    position: relative;
    border-radius: 1.35rem;
    overflow: hidden;
    display: block;
    aspect-ratio: 16 / 10.5;
    border: 1px solid rgba(251, 191, 36, 0.35);
    box-shadow:
      0 12px 30px -8px rgba(0, 0, 0, 0.55),
      0 0 0 1px rgba(52, 211, 153, 0.22);
    text-decoration: none;
    background: #061c14;
    transition: transform 0.24s var(--ease-gentle, ease), box-shadow 0.24s ease;
  }

  .sanctuary-preview-window:hover {
    transform: translateY(-3px) scale(1.01);
    box-shadow:
      0 18px 40px -8px rgba(0, 0, 0, 0.68),
      0 0 24px rgba(251, 191, 36, 0.25);
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
    filter: saturate(1.08) contrast(1.04);
    transition: transform 0.5s ease;
  }

  .sanctuary-preview-window:hover .preview-bg-img {
    transform: scale(1.04);
  }

  .preview-atmosphere {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 50% 42%, transparent 30%, rgba(4, 20, 14, 0.55) 100%),
      linear-gradient(to top, rgba(4, 20, 14, 0.75) 0%, transparent 40%);
    pointer-events: none;
  }

  /* Living floating paper lanterns */
  .living-lantern {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
    will-change: transform;
    animation: lanternBob 3.6s ease-in-out infinite alternate;
  }

  .lantern-body {
    font-size: 1.15rem;
    filter: drop-shadow(0 2px 6px rgba(245, 158, 11, 0.75));
    line-height: 1;
  }

  .lantern-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 22px;
    height: 22px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(251, 191, 36, 0.7) 0%, transparent 70%);
    border-radius: 50%;
    animation: lanternPulse 2.8s ease-in-out infinite alternate;
  }

  .lantern-reflection {
    width: 16px;
    height: 4px;
    margin-top: 2px;
    background: radial-gradient(ellipse, rgba(251, 191, 36, 0.45) 0%, transparent 75%);
    border-radius: 50%;
    filter: blur(1px);
  }

  .lantern-1 {
    bottom: 22%;
    left: 28%;
    animation-duration: 3.4s;
    animation-delay: 0s;
  }

  .lantern-2 {
    bottom: 28%;
    left: 52%;
    font-size: 0.95rem;
    animation-duration: 4.1s;
    animation-delay: -1.2s;
  }

  .lantern-3 {
    bottom: 18%;
    left: 74%;
    font-size: 1.05rem;
    animation-duration: 3.8s;
    animation-delay: -2.3s;
  }

  /* Drifting starlight fireflies */
  .living-firefly {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #fde68a;
    box-shadow: 0 0 8px 2px rgba(253, 230, 138, 0.9);
    pointer-events: none;
    will-change: transform, opacity;
    animation: fireflyDrift 5s ease-in-out infinite;
  }

  .firefly-1 {
    top: 36%;
    left: 20%;
    animation-duration: 5.6s;
    animation-delay: 0s;
  }

  .firefly-2 {
    top: 24%;
    left: 65%;
    width: 4px;
    height: 4px;
    background: #6ee7b7;
    box-shadow: 0 0 8px 2px rgba(110, 231, 183, 0.9);
    animation-duration: 6.2s;
    animation-delay: -1.8s;
  }

  .firefly-3 {
    top: 48%;
    left: 82%;
    animation-duration: 4.8s;
    animation-delay: -3.1s;
  }

  .firefly-4 {
    top: 18%;
    left: 42%;
    width: 3.5px;
    height: 3.5px;
    animation-duration: 5.2s;
    animation-delay: -2.4s;
  }

  @keyframes lanternBob {
    0% {
      transform: translateY(0px) rotate(-1.5deg);
    }
    50% {
      transform: translateY(-4px) rotate(1deg);
    }
    100% {
      transform: translateY(2px) rotate(-0.5deg);
    }
  }

  @keyframes lanternPulse {
    0% {
      opacity: 0.6;
      transform: translate(-50%, -50%) scale(0.9);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.15);
    }
  }

  @keyframes fireflyDrift {
    0%, 100% {
      transform: translate(0px, 0px);
      opacity: 0.35;
    }
    30% {
      transform: translate(8px, -10px);
      opacity: 0.95;
    }
    70% {
      transform: translate(-6px, -18px);
      opacity: 0.65;
    }
  }

  /* Live pill & enter button overlays */
  .spw-live-pill {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.68rem;
    border-radius: 999px;
    background: rgba(6, 26, 18, 0.82);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(52, 211, 153, 0.35);
    color: #d1fae5;
    font-size: 0.74rem;
    font-weight: 700;
  }

  .live-pulse-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 8px #34d399;
    animation: livePulse 2s ease-in-out infinite;
  }

  @keyframes livePulse {
    0%, 100% {
      transform: scale(0.85);
      opacity: 0.65;
    }
    50% {
      transform: scale(1.25);
      opacity: 1;
    }
  }

  .spw-enter {
    position: absolute;
    bottom: 0.75rem;
    right: 0.75rem;
    padding: 0.44rem 0.92rem;
    border-radius: 999px;
    background: rgba(6, 26, 18, 0.84);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(251, 191, 36, 0.45);
    color: #fde68a;
    font-size: 0.82rem;
    font-weight: 700;
    transition: all 0.18s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  }

  .sanctuary-preview-window:hover .spw-enter {
    background: rgba(16, 68, 47, 0.92);
    border-color: rgba(251, 191, 36, 0.75);
    color: #ffffff;
    transform: scale(1.03);
  }

  @media (max-width: 960px) {
    .sanctuary-portal-card {
      grid-template-columns: minmax(0, 1fr);
      padding: 1.8rem 1.4rem;
      gap: 1.6rem;
    }

    .sanctuary-copy h2 {
      font-size: 1.65rem;
    }
  }

  @media (max-width: 680px) {
    .sanctuary-portal-section {
      margin-top: 1.4rem;
      margin-bottom: 1.8rem;
    }

    .sanctuary-portal-card {
      padding: 1.4rem 1.1rem;
      border-radius: 1.35rem;
    }

    .sanctuary-cta-row {
      flex-direction: column;
      align-items: stretch;
      gap: 0.65rem;
    }

    .sanctuary-open-btn,
    .sanctuary-breath-link {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
      padding: 0.75rem 1rem;
    }

    .sanctuary-preview-window {
      aspect-ratio: 16 / 10;
      border-radius: 1.1rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .living-lantern,
    .living-firefly,
    .live-pulse-dot,
    .lantern-glow {
      animation: none !important;
    }
    .sanctuary-open-btn:hover,
    .sanctuary-preview-window:hover {
      transform: none !important;
    }
  }
</style>
