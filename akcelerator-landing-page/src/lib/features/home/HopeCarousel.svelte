<script>
  import { HOPE_FACTS } from '../../data/czech-actions.js';

  export let hopeIndex = 0;
  export let onNextHope = null;

  $: activeHope = HOPE_FACTS && HOPE_FACTS.length ? HOPE_FACTS[hopeIndex % HOPE_FACTS.length] : null;

  function cycleNext() {
    if (onNextHope) {
      onNextHope();
    } else {
      hopeIndex = (hopeIndex + 1) % (HOPE_FACTS?.length || 1);
    }
  }
</script>

{#if activeHope}
  <div class="quiet-hope">
    <span class="section-overline">
      DOBRÁ ZPRÁVA Z ČESKA · OVĚŘENO {activeHope.verifiedAt || '11/2026'}
    </span>
    <div class="qh-stat">{activeHope.stat}</div>
    <p class="qh-text">
      <strong>{activeHope.title}.</strong>
      {activeHope.detail}
    </p>
    {#if activeHope.sourceUrl}
      <div class="qh-source-row">
        <span>Primární zdroj ({activeHope.verifiedAt || '11/2026'}):</span>
        <a
          href={activeHope.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="qh-source-link"
        >
          {activeHope.sourceLabel || 'Oficiální statistika'} ↗
        </a>
      </div>
    {/if}
    <div class="qh-actions">
      <a href={activeHope.actionHref} class="qh-link">{activeHope.actionLabel}</a>
      <span class="qh-sep">·</span>
      <button type="button" class="qh-next" on:click={cycleNext}>
        ↻ Další důkaz naděje
      </button>
    </div>
  </div>
{/if}

<style>
  .quiet-hope {
    padding: 1.85rem 2rem;
    border-radius: 1.25rem;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(16, 185, 129, 0.2);
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.06);
  }

  .section-overline {
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #059669;
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.65rem;
  }

  .qh-stat {
    font-size: clamp(2rem, 3.8vw, 2.75rem);
    font-weight: 800;
    color: #047857;
    line-height: 1.1;
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
  }

  .qh-text {
    font-size: 1rem;
    line-height: 1.5;
    color: var(--text-heading, #1f2937);
    margin: 0 0 1rem 0;
  }

  .qh-source-row {
    font-size: 0.82rem;
    color: var(--text-muted, #6b7280);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .qh-source-link {
    color: #059669;
    text-decoration: underline;
  }

  .qh-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .qh-link {
    font-size: 0.9rem;
    font-weight: 600;
    color: #059669;
    text-decoration: none;
  }

  .qh-link:hover {
    text-decoration: underline;
  }

  .qh-sep {
    color: #9ca3af;
  }

  .qh-next {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-muted, #4b5563);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .qh-next:hover {
    color: #059669;
  }
</style>

