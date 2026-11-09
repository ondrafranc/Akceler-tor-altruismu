<script>
  import { PORTALS } from '../../data/czech-actions.js';
  import { trackEvent } from '../../analytics.js';
</script>

<details class="calm-drawer home-portals-drawer">
  <summary>
    Hledáš dlouhodobější dobrovolnictví? {PORTALS.length} ověřených českých platforem
  </summary>
  <p class="drawer-lead">
    Osvědčené české dobrovolnické a komunitní projekty, kde si vybereš
    zapojení podle oboru nebo regionu.
  </p>
  <div class="portals-grid">
    {#each PORTALS as p}
      <a
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        class="portal-card"
        on:click={() => trackEvent("aa_clickout", { surface: "home_portal", id: p.id })}
      >
        <div class="portal-top">
          <h3>{p.title}</h3>
          <span class="ext-icon">↗</span>
        </div>
        <p>{p.desc}</p>
      </a>
    {/each}
  </div>
</details>

<div class="submit-whisper-row">
  <span>Víš o útulku, knihobudce nebo sousedské akci ve svém městě?</span>
  <a href="/submit">Přidat tip na společnou mapu →</a>
</div>

<style>
  .calm-drawer {
    margin-bottom: 2rem;
    padding: 1.25rem 1.5rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(16, 185, 129, 0.16);
  }

  .calm-drawer summary {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-heading, #111827);
    cursor: pointer;
    user-select: none;
  }

  .drawer-lead {
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--text-muted, #4b5563);
    margin: 0.85rem 0 1.25rem 0;
  }

  .portals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }

  .portal-card {
    display: flex;
    flex-direction: column;
    padding: 1rem 1.15rem;
    border-radius: 0.75rem;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.08);
    text-decoration: none;
    color: inherit;
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .portal-card:hover {
    transform: translateY(-2px);
    border-color: rgba(16, 185, 129, 0.35);
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.08);
  }

  .portal-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }

  .portal-top h3 {
    font-size: 0.98rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-heading, #111827);
  }

  .ext-icon {
    font-size: 0.9rem;
    color: #059669;
  }

  .portal-card p {
    font-size: 0.85rem;
    line-height: 1.4;
    color: var(--text-muted, #4b5563);
    margin: 0;
  }

  .submit-whisper-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.35rem;
    border-radius: 0.85rem;
    background: rgba(16, 185, 129, 0.08);
    border: 1px dashed rgba(16, 185, 129, 0.3);
    font-size: 0.88rem;
    color: var(--text-heading, #1f2937);
    flex-wrap: wrap;
  }

  .submit-whisper-row a {
    color: #047857;
    font-weight: 600;
    text-decoration: none;
  }

  .submit-whisper-row a:hover {
    text-decoration: underline;
  }
</style>

