<section class="content-wrap paths-section" aria-label="Tři cesty k pomoci">
  <div class="section-header">
    <span class="section-overline">JAK SE ZAPOJIT</span>
    <h2>
      Vyber si cestu, která ti <span class="serif-accent">dneska sedí</span>
    </h2>
  </div>

  <div class="bento-paths">
    <a href="/near" class="bento-card">
      <div class="bento-icon-wrap emerald">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.1"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <h3>Pomoc kousek od tebe</h3>
      <p class="bento-desc">
        Útulky, potravinové banky, knihobudky a sousedská místa na mapě ČR — i
        s připravenou zprávou na oslovení.
      </p>
      <span class="bento-cta">Otevřít mapu v&nbsp;okolí&nbsp;→</span>
    </a>

    <a href="/app/guided" class="bento-card">
      <div class="bento-icon-wrap amber">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.1"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      </div>
      <h3>Průvodce podle situace</h3>
      <p class="bento-desc">
        Nevíš, kde začít? Zvol si čas a blízké téma — ukážeme ti jeden
        konkrétní skutek na míru.
      </p>
      <span class="bento-cta">Spustit průvodce&nbsp;→</span>
    </a>

    <a href="/app/online" class="bento-card">
      <div class="bento-icon-wrap forest">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.1"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
      <h3>Drobné skutky na pár minut</h3>
      <p class="bento-desc">
        Rychlá pomoc z mobilu či počítače: naplnění misky v útulku, mapování
        pro Lékaře bez hranic nebo dopis seniorovi.
      </p>
      <span class="bento-cta">Prohlédnout online tipy&nbsp;→</span>
    </a>
  </div>

  <slot />
</section>

<style>
  .paths-section {
    margin-top: 2.5rem;
    margin-bottom: 2.5rem;
  }

  .section-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .section-overline {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #059669;
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.45rem;
  }

  .section-header h2 {
    font-family: var(--font-sans);
    font-size: clamp(1.75rem, 3.2vw, 2.5rem);
    font-weight: 800;
    line-height: 1.18;
    color: var(--text-heading, #111827);
    margin: 0;
  }

  .serif-accent {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
  }

  .bento-paths {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
  }

  .bento-card {
    display: flex;
    flex-direction: column;
    padding: 1.6rem 1.5rem;
    border-radius: 1.25rem;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(16, 185, 129, 0.16);
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .bento-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.38);
  }

  .bento-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.15rem;
  }

  .bento-icon-wrap.emerald {
    background: rgba(16, 185, 129, 0.15);
    color: #059669;
  }

  .bento-icon-wrap.amber {
    background: rgba(245, 158, 11, 0.15);
    color: #d97706;
  }

  .bento-icon-wrap.forest {
    background: rgba(4, 120, 87, 0.15);
    color: #047857;
  }

  .bento-card h3 {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: var(--text-heading, #111827);
  }

  .bento-desc {
    font-size: 0.92rem;
    line-height: 1.48;
    color: var(--text-muted, #4b5563);
    margin: 0 0 1.25rem 0;
    flex-grow: 1;
  }

  .bento-cta {
    font-size: 0.9rem;
    font-weight: 600;
    color: #059669;
    display: inline-flex;
    align-items: center;
  }

  @media (max-width: 860px) {
    .bento-paths {
      grid-template-columns: minmax(0, 1fr);
      gap: 1rem;
    }
  }
</style>

