<script>
  import { cleanTitle } from '../../../utils.js';
  import { trackEvent } from '../../../analytics.js';
  import { SANCTUARY_ELEMENTS } from '../../../progress.js';

  export let selectedLight = null;
  export let elementMap = {};
  export let onClose = null;
  export let onMarkDone = null;

  function getLightSemanticLabel(light) {
    const lt = light?.lightType || (light?.zone === 'sky' ? 'star' : 'lantern');
    if (lt === 'wave') return '〰️ Vlna · Pomoc druhému';
    if (lt === 'star') return '✦ Hvězda · Inspirace';
    return '🏮 Lucerna · Osobní skutek';
  }

  function handleClose() {
    if (onClose) onClose();
  }

  function handleDone() {
    if (onMarkDone) onMarkDone(selectedLight);
  }

  $: selMeta = (selectedLight && elementMap[selectedLight.element]) || SANCTUARY_ELEMENTS[3];
</script>

{#if selectedLight}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="memory-whisper"
    role="dialog"
    aria-label="Detail dobrého skutku"
    tabindex="-1"
    on:click|stopPropagation
    on:keydown|stopPropagation
  >
    <div class="mw-head">
      <span class="mw-overline">
        {selMeta.icon} {selMeta.title} · {getLightSemanticLabel(selectedLight)}
        {#if selectedLight.isMine} · ✦ Tvůj skutek{/if}
      </span>
      <button type="button" class="mw-close" on:click={handleClose} aria-label="Zavřít">✕</button>
    </div>

    <strong class="mw-title">{cleanTitle(selectedLight.title)}</strong>

    {#if selectedLight.orgName || selectedLight.minutes}
      <div class="mw-meta">
        {#if selectedLight.orgName}<span>{selectedLight.orgName}</span>{/if}
        {#if selectedLight.orgName && selectedLight.minutes}<span>·</span>{/if}
        {#if selectedLight.minutes}<span>{selectedLight.minutes} min</span>{/if}
      </div>
    {/if}

    {#if selectedLight.concreteImpact}
      <p class="mw-impact">{selectedLight.concreteImpact}</p>
    {/if}

    {#if selectedLight.note}
      <p class="mw-note">„{selectedLight.note}“</p>
    {/if}

    <div class="mw-actions">
      {#if selectedLight.url}
        <a
          href={selectedLight.url}
          target="_blank"
          rel="noopener noreferrer"
          class="mw-btn-link"
          on:click={() => trackEvent('aa_world_deed_open', { id: selectedLight.actionId })}
        >
          Udělat tenhle skutek ↗
        </a>
      {/if}
      {#if !selectedLight.isMine}
        <button
          type="button"
          class="mw-btn-done"
          on:click={handleDone}
        >
          ✓ Mám splněno — rozsvítit
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .memory-whisper {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    width: min(340px, calc(100% - 2rem));
    padding: 1.05rem 1.15rem;
    border-radius: 20px;
    background: rgba(7, 26, 18, 0.97);
    border: 1px solid rgba(253, 230, 138, 0.4);
    color: #f8faf8;
    z-index: 6;
    box-shadow: 0 18px 38px rgba(0, 0, 0, 0.45);
  }

  .mw-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  .mw-overline {
    font-size: 0.72rem;
    font-weight: 800;
    color: #fde68a;
    letter-spacing: 0.03em;
  }

  .mw-close {
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.72);
    cursor: pointer;
    font-size: 0.95rem;
  }

  .mw-title {
    display: block;
    font-size: 0.98rem;
    line-height: 1.32;
    margin-bottom: 0.25rem;
  }

  .mw-meta {
    font-size: 0.75rem;
    color: rgba(167, 243, 208, 0.85);
    margin-bottom: 0.4rem;
    display: flex;
    gap: 0.35rem;
  }

  .mw-impact {
    margin: 0;
    font-size: 0.81rem;
    line-height: 1.48;
    color: rgba(236, 253, 245, 0.88);
  }

  .mw-note {
    margin: 0.35rem 0 0;
    font-size: 0.8rem;
    font-style: italic;
    color: #fde68a;
  }

  .mw-actions {
    margin-top: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .mw-btn-link {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0.54rem 0.85rem;
    border-radius: 11px;
    background: linear-gradient(135deg, #fde68a 0%, #6ee7b7 100%);
    color: #061b12;
    font-weight: 800;
    font-size: 0.8rem;
    text-decoration: none;
  }

  .mw-btn-done {
    padding: 0.48rem 0.85rem;
    border-radius: 11px;
    border: 1px solid rgba(167, 243, 208, 0.32);
    background: rgba(255, 255, 255, 0.07);
    color: #ecfdf5;
    font-family: inherit;
    font-weight: 700;
    font-size: 0.78rem;
    cursor: pointer;
  }

  .mw-btn-done:hover {
    background: rgba(16, 185, 129, 0.25);
  }

  @media (max-width: 680px) {
    .memory-whisper {
      position: relative !important;
      top: auto !important;
      bottom: auto !important;
      left: auto !important;
      right: auto !important;
      transform: none !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      box-sizing: border-box;
    }
  }
</style>

