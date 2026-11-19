<script>
  import AppIcon from '$lib/components/AppIcon.svelte';
  import { HOPE_FACTS } from '../../data/czech-actions.js';

  /**
   * @type {{
   *   hopeIndex?: number,
   *   onNextHope?: (() => void) | null
   * }}
   */
  let { hopeIndex = 0, onNextHope = null } = $props();

  let localOffset = $state(0);

  $effect(() => {
    hopeIndex;
    localOffset = 0;
  });

  const effectiveIndex = $derived(hopeIndex + localOffset);
  const activeHope = $derived(
    HOPE_FACTS && HOPE_FACTS.length
      ? HOPE_FACTS[((effectiveIndex % HOPE_FACTS.length) + HOPE_FACTS.length) % HOPE_FACTS.length]
      : null
  );

  function cycleNext() {
    if (onNextHope) {
      onNextHope();
    } else {
      localOffset = (localOffset + 1) % (HOPE_FACTS?.length || 1);
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
          <span>{activeHope.sourceLabel || 'Oficiální statistika'}</span>
          <AppIcon name="arrow-up-right" size={14} strokeWidth={2.2} />
        </a>
      </div>
    {/if}
    <div class="qh-actions">
      <a href={activeHope.actionHref} class="qh-link">{activeHope.actionLabel}</a>
      <button type="button" class="qh-next" onclick={cycleNext}>
        <AppIcon name="refresh-cw" size={14} strokeWidth={2.1} />
        <span>Další důkaz naděje</span>
      </button>
    </div>
  </div>
{/if}

<style>
  .quiet-hope {
    padding: 1.75rem 1.85rem;
    border-radius: 18px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    margin-bottom: 1.75rem;
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
  }

  .section-overline {
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--accent-warm-ink, #8f4b0e);
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.55rem;
  }

  .qh-stat {
    font-size: clamp(1.9rem, 3.8vw, 2.65rem);
    font-weight: 800;
    color: var(--accent-primary, #1b5e42);
    line-height: 1.1;
    margin-bottom: 0.45rem;
    letter-spacing: -0.025em;
  }

  .qh-text {
    font-size: 0.98rem;
    line-height: 1.52;
    color: var(--ink-primary, #14281d);
    margin: 0 0 0.85rem 0;
  }

  .qh-source-row {
    font-size: 0.84rem;
    color: var(--ink-muted, #516659);
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .qh-source-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.3rem 0.45rem;
    border-radius: 8px;
    color: var(--accent-primary, #1b5e42);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    box-sizing: border-box;
  }

  .qh-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .qh-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    min-width: 44px;
    padding: 0.45rem 0.95rem;
    border-radius: 999px;
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;
    box-sizing: border-box;
    transition: background-color 0.16s ease;
  }

  .qh-link:hover {
    background: var(--accent-primary-hover, #144732);
  }

  .qh-next {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.38rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink-primary, #14281d);
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    cursor: pointer;
    box-sizing: border-box;
    transition: background-color 0.16s ease, border-color 0.16s ease;
  }

  .qh-next:hover {
    background: var(--bohemian-mist, #e6f0ea);
    border-color: var(--accent-primary, #1b5e42);
  }

  @media (max-width: 680px) {
    .quiet-hope {
      padding: 1.25rem 1.15rem;
    }
  }
</style>
