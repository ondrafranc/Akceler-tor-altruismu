<script>
  import { impactCanvas, getActionEffectMeta } from '../../../../lib/sensoryEngine.js';
  import { cleanTitle } from '../../../../lib/utils.js';

  export let action = null;
  export let metric = 0;
  export let onComplete = null;
  export let onDismiss = null;
  export let surface = 'home_instant';

  let kibbleGrams = 0;

  function handleWeightUpdate(g) {
    kibbleGrams = g;
    metric = g;
  }

  $: effectMeta = action ? getActionEffectMeta(action, kibbleGrams, { isReturnStrip: true }) : null;
  $: safeTitle = action ? cleanTitle(action.title) : '';
  $: svetHref = action
    ? `/svet?ritual=lantern&seed=${encodeURIComponent(action.id)}&title=${encodeURIComponent(safeTitle)}`
    : '/svet';
</script>

{#if action}
  <div
    class="return-dopamine-strip"
    role="status"
    aria-live="polite"
    data-surface={surface}
    data-scene={effectMeta?.scene || 'default'}
  >
    <div class="inline-celebration-head">
      <div class="return-dopamine-text">
        ✨ <strong>Vítej zpět{action.org ? ` z projektu ${action.org}` : ''}! Povedlo se?</strong> Potvrď svůj dobrý skutek a rozsviť lucernu v Krajině dobra.
      </div>
      {#if effectMeta?.badge}
        <span class="impact-payoff-badge">
          {effectMeta.badge}
        </span>
      {/if}
    </div>

    <canvas
      class="impact-payoff-canvas"
      width="320"
      height="118"
      use:impactCanvas={{ action, climax: true, onWeightUpdate: handleWeightUpdate, onProgress: (v) => { metric = v; } }}
      aria-label="Fyzikální vizualizace dopadu dobrého skutku"
    ></canvas>

    <div class="molly-celebration-note">
      🐾 Za každý dokončený krok čeká na Molly odměna:
      <strong>{effectMeta?.mollyTreat?.name || 'lososová granulka'}</strong>
    </div>

    <div class="return-dopamine-actions">
      <button
        type="button"
        class="return-dopamine-btn"
        on:click={() => onComplete && onComplete(action)}
      >
        ✨ Hotovo – rozsvítit stopu
      </button>

      {#if onDismiss}
        <button
          type="button"
          class="return-dopamine-svet-link"
          on:click={() => onDismiss(action)}
        >
          Později
        </button>
      {:else}
        <a
          href={svetHref}
          class="return-dopamine-svet-link"
        >
          Do Krajiny dobra →
        </a>
      {/if}
    </div>
  </div>
{/if}

<style>
  .return-dopamine-strip {
    margin: 0.85rem 0;
    padding: 1.15rem 1.25rem;
    border-radius: 1rem;
    background: linear-gradient(135deg, rgba(254, 243, 199, 0.45) 0%, rgba(236, 253, 245, 0.55) 100%);
    border: 1.5px solid rgba(245, 158, 11, 0.35);
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.12);
  }

  .inline-celebration-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.65rem;
  }

  .return-dopamine-text {
    font-size: 0.95rem;
    line-height: 1.4;
    color: var(--text-heading, #1f2937);
  }

  .impact-payoff-badge {
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.15);
    color: #065f46;
    white-space: nowrap;
  }

  .impact-payoff-canvas {
    display: block;
    width: 100%;
    max-width: 320px;
    height: 118px;
    margin: 0.5rem auto 0.65rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.6);
  }

  .molly-celebration-note {
    font-size: 0.82rem;
    color: var(--text-muted, #4b5563);
    margin-bottom: 0.75rem;
    text-align: center;
  }

  .return-dopamine-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.85rem;
    flex-wrap: wrap;
  }

  .return-dopamine-btn {
    font-size: 0.9rem;
    font-weight: 600;
    padding: 0.55rem 1.15rem;
    border-radius: 999px;
    background: #059669;
    color: #ffffff;
    border: none;
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(5, 150, 105, 0.25);
    transition: transform 0.15s ease, background-color 0.15s ease;
  }

  .return-dopamine-btn:hover {
    background: #047857;
    transform: translateY(-1px);
  }

  .return-dopamine-svet-link {
    font-size: 0.88rem;
    font-weight: 500;
    color: #059669;
    text-decoration: underline;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
</style>
