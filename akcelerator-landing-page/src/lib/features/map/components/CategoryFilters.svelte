<script>
  export let activePresetId = 'all';
  export let radiusKm = 8;
  export let shareMessage = '';
  export let onApplyPreset = null;
  export let onSetRadius = null;
  export let onCopyShare = null;

  export const CATEGORY_PRESETS = [
    { id: 'all', label: '✨ Vše smysluplné v okolí', kinds: ['ngo', 'community', 'food', 'animals'], onlyWeb: false },
    { id: 'animals', label: '🐾 Útulky a zvířata', kinds: ['animals'], onlyWeb: false },
    { id: 'food', label: '🥫 Jídlo a šatníky', kinds: ['food', 'community'], onlyWeb: false },
    { id: 'community', label: '📚 Knihobudky a sousedé', kinds: ['community'], onlyWeb: false },
    { id: 'fast', label: '⚡ S přímým webem', kinds: ['ngo', 'community', 'food', 'animals'], onlyWeb: true }
  ];

  export const RADIUS_PRESETS = [2, 5, 8, 15, 25];
</script>

<div class="controls-bottom">
  <div class="presets-bar" role="group" aria-label="Co na mapě hledáš">
    {#each CATEGORY_PRESETS as preset}
      <button
        type="button"
        class="preset-pill"
        class:active={activePresetId === preset.id}
        on:click={() => onApplyPreset && onApplyPreset(preset)}
      >
        {preset.label}
      </button>
    {/each}
  </div>

  <div class="radius-box" role="group" aria-label="Okruh hledání v kilometrech">
    <span class="radius-label">Okruh:</span>
    <div class="radius-pills">
      {#each RADIUS_PRESETS as rKm}
        <button
          type="button"
          class="radius-pill"
          class:active={radiusKm === rKm}
          on:click={() => onSetRadius && onSetRadius(rKm)}
        >
          {rKm} km
        </button>
      {/each}
    </div>
  </div>

  <div class="controls-links">
    {#if onCopyShare}
      <button type="button" class="text-util-btn" on:click={onCopyShare}>
        {shareMessage || '🔗 Sdílet výřez'}
      </button>
    {/if}
    <a href="/submit" class="text-util-link">+ Přidat místo</a>
  </div>
</div>

<style>
  .controls-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
    flex-wrap: wrap;
    margin-top: 0.85rem;
  }

  .presets-bar {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .preset-pill {
    appearance: none;
    border: 1px solid rgba(16, 185, 129, 0.22);
    background: #ffffff;
    color: var(--text-secondary, #374151);
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.38rem 0.72rem;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .preset-pill:hover {
    border-color: #059669;
    color: #059669;
  }

  .preset-pill.active {
    background: #059669;
    color: #ffffff;
    border-color: #059669;
  }

  .radius-box {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
  }

  .radius-label {
    font-weight: 600;
    color: var(--text-muted, #6b7280);
  }

  .radius-pills {
    display: inline-flex;
    gap: 0.25rem;
  }

  .radius-pill {
    appearance: none;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: #ffffff;
    font-size: 0.76rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .radius-pill.active {
    background: #059669;
    color: #ffffff;
    border-color: #059669;
  }

  .controls-links {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
  }

  .text-util-btn {
    appearance: none;
    border: none;
    background: none;
    color: #059669;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
  }

  .text-util-link {
    color: #059669;
    font-size: 0.82rem;
    font-weight: 600;
    text-decoration: underline;
  }
</style>

