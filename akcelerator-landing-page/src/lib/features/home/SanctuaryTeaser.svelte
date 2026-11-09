<script>
  import { trackEvent } from '../../analytics.js';
</script>

<section
  class="content-wrap sanctuary-portal-section"
  aria-label="Krajina dobra a dechové zastavení"
>
  <div class="sanctuary-portal-card">
    <div class="sanctuary-copy">
      <span class="stage-kicker">✨ KRAJINA DOBRA · SKUTKY A KLIDNÝ DECH</span>
      <h2>
        Podívej se, jak drobné skutky <span class="serif-gold">rozsvěcují krajinu</span>
      </h2>
      <p>
        Interaktivní malovaná tůň, kde každá hvězda na obloze i lucerna na
        hladině představuje skutečnou pomoc. Klikni na světla pro inspiraci,
        rozsviť svůj dnešní skutek nebo si dopřej minutu klidného dechu.
      </p>

      <div class="sanctuary-cta-row">
        <a
          href="/svet"
          class="sanctuary-open-btn"
          on:click={() => trackEvent("aa_home_portal_svet")}
        >
          <span>✨ Vstoupit do Krajiny dobra</span>
          <span>→</span>
        </a>
        <a href="/svet#dech" class="sanctuary-breath-link">
          🌊 Dechové zastavení
        </a>
      </div>
    </div>

    <a
      href="/svet"
      class="sanctuary-preview-window"
      aria-label="Otevřít Krajinu dobra"
    >
      <img
        src="/art/sanctuary-dawn.jpg"
        alt="Malovaná česká krajina ve zlatém svítání se světly dobrých skutků"
        loading="lazy"
        decoding="async"
      />
      <span class="spw-enter">Vyzkoušet živou krajinu →</span>
    </a>
  </div>
</section>

<style>
  .sanctuary-portal-section {
    margin-top: 2rem;
    margin-bottom: 2.5rem;
  }

  .sanctuary-portal-card {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 2.5rem;
    align-items: center;
    padding: 2.5rem;
    border-radius: 1.5rem;
    background: radial-gradient(120% 120% at 20% 20%, #1e293b 0%, #0f172a 100%);
    color: #f8fafc;
    border: 1px solid rgba(251, 191, 36, 0.25);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.35);
  }

  .stage-kicker {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #fbbf24;
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.65rem;
  }

  .sanctuary-copy h2 {
    font-size: clamp(1.6rem, 2.8vw, 2.3rem);
    font-weight: 800;
    line-height: 1.2;
    margin: 0 0 1rem 0;
    color: #ffffff;
  }

  .serif-gold {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    color: #fde68a;
  }

  .sanctuary-copy p {
    font-size: 0.96rem;
    line-height: 1.55;
    color: #cbd5e1;
    margin: 0 0 1.6rem 0;
  }

  .sanctuary-cta-row {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    flex-wrap: wrap;
  }

  .sanctuary-open-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.4rem;
    border-radius: 999px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: #0f172a;
    font-weight: 700;
    font-size: 0.95rem;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.35);
    transition: transform 0.15s ease;
  }

  .sanctuary-open-btn:hover {
    transform: translateY(-2px);
  }

  .sanctuary-breath-link {
    font-size: 0.92rem;
    color: #93c5fd;
    text-decoration: none;
    font-weight: 600;
  }

  .sanctuary-breath-link:hover {
    text-decoration: underline;
  }

  .sanctuary-preview-window {
    position: relative;
    border-radius: 1rem;
    overflow: hidden;
    display: block;
    aspect-ratio: 16 / 10;
    border: 1px solid rgba(251, 191, 36, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    text-decoration: none;
  }

  .sanctuary-preview-window img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }

  .sanctuary-preview-window:hover img {
    transform: scale(1.04);
  }

  .spw-enter {
    position: absolute;
    bottom: 0.75rem;
    right: 0.75rem;
    padding: 0.4rem 0.85rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(6px);
    color: #fde68a;
    font-size: 0.82rem;
    font-weight: 600;
  }

  @media (max-width: 860px) {
    .sanctuary-portal-card {
      grid-template-columns: minmax(0, 1fr);
      padding: 1.6rem 1.25rem;
      gap: 1.5rem;
    }
  }
</style>

