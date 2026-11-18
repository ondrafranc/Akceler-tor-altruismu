<script>
  import AppIcon from '$lib/components/AppIcon.svelte';
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
          <span class="ext-icon" aria-hidden="true">
            <AppIcon name="arrow-up-right" size={15} strokeWidth={2.2} />
          </span>
        </div>
        <p>{p.desc}</p>
      </a>
    {/each}
  </div>
</details>

<div class="submit-whisper-row">
  <span>Víš o útulku, knihobudce nebo sousedské akci ve svém městě?</span>
  <a href="/submit">
    <span>Přidat tip na společnou mapu</span>
    <AppIcon name="arrow-right" size={14} strokeWidth={2.2} />
  </a>
</div>

<style>
  .home-portals-drawer {
    margin-bottom: 1.5rem;
  }

  .drawer-lead {
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--ink-secondary, #3f574a);
    margin: 0.85rem 0 1.15rem 0;
  }

  .portals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.9rem;
  }

  .portal-card {
    display: flex;
    flex-direction: column;
    padding: 1rem 1.1rem;
    border-radius: 12px;
    background: var(--bg-canvas, #f6f7f3);
    border: 1px solid var(--border-subtle, #dce3dd);
    text-decoration: none;
    color: inherit;
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .portal-card:hover {
    transform: translateY(-2px);
    border-color: var(--accent-primary, #1b5e42);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
  }

  .portal-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  .portal-top h3 {
    font-size: 0.96rem;
    font-weight: 700;
    margin: 0;
    color: var(--ink-primary, #14281d);
  }

  .ext-icon {
    display: inline-flex;
    align-items: center;
    color: var(--accent-primary, #1b5e42);
    flex-shrink: 0;
  }

  .portal-card p {
    font-size: 0.85rem;
    line-height: 1.42;
    color: var(--ink-secondary, #3f574a);
    margin: 0;
  }

  .submit-whisper-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem 1rem;
    padding: 0.9rem 1.2rem;
    border-radius: 14px;
    background: var(--bg-subtle, #edf2ee);
    border: 1px dashed var(--border-strong, #c2cec5);
    font-size: 0.88rem;
    color: var(--ink-primary, #14281d);
    flex-wrap: wrap;
  }

  .submit-whisper-row a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-strong, #c2cec5);
    color: var(--accent-primary, #1b5e42);
    font-weight: 700;
    text-decoration: none;
    box-sizing: border-box;
    transition: border-color 0.16s ease, background-color 0.16s ease;
  }

  .submit-whisper-row a:hover {
    border-color: var(--accent-primary, #1b5e42);
    background: var(--bg-canvas, #f6f7f3);
  }
</style>
