<script>
  import { CZECH_CITIES } from '../../../data/czech-actions.js';

  export let locationQuery = '';
  export let centerLat = 50.0755;
  export let centerLon = 14.4378;
  export let isLocatingGps = false;
  export let instantTownSuggestions = [];
  export let geoResults = [];
  export let gpsMessage = '';
  export let geoMessage = '';

  export let onInput = null;
  export let onKeydown = null;
  export let onRequestGps = null;
  export let onSelectCity = null;
  export let onPickResult = null;
</script>

<div class="search-row">
  <div class="search-input-wrap">
    <svg
      class="search-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
    <input
      type="search"
      bind:value={locationQuery}
      on:input={onInput}
      on:keydown={onKeydown}
      placeholder="Hledat obec, PSČ nebo ulici v ČR…"
      aria-label="Hledat obec, PSČ nebo ulici v ČR"
      autocomplete="off"
    />
  </div>

  <button
    type="button"
    class="btn-gps"
    disabled={isLocatingGps}
    on:click={onRequestGps}
    title="Zaměřit mou aktuální polohu v ČR"
  >
    {isLocatingGps ? '⏳ Zaměřuji…' : '🎯 Moje poloha'}
  </button>

  <select
    id="near-city-jump"
    class="city-jump-select"
    aria-label="Rychlý skok do krajského města"
    on:change={(e) => {
      const found = CZECH_CITIES.find((c) => c.id === e.currentTarget.value);
      if (found && onSelectCity) onSelectCity(found);
    }}
  >
    <option value="">Krajská města…</option>
    {#each CZECH_CITIES as city}
      <option
        value={city.id}
        selected={Math.abs(centerLat - city.lat) < 0.05 && Math.abs(centerLon - city.lon) < 0.05}
      >
        {city.name}
      </option>
    {/each}
  </select>
</div>

{#if gpsMessage}
  <div class="info-note">{gpsMessage}</div>
{/if}
{#if geoMessage}
  <div class="info-note">{geoMessage}</div>
{/if}

{#if instantTownSuggestions.length > 0}
  <div class="geo-dropdown" role="listbox" aria-label="Rychlý výběr města">
    {#each instantTownSuggestions as t}
      <button
        type="button"
        class="geo-opt"
        on:click={() => onPickResult && onPickResult(t)}
      >
        <strong>📍 {t.label.split(',')[0]}</strong>
        <span>{t.label} · okamžitý přesun</span>
      </button>
    {/each}
  </div>
{/if}

{#if geoResults.length > 0}
  <div class="geo-dropdown">
    {#each geoResults as r}
      <button
        type="button"
        class="geo-opt"
        on:click={() => onPickResult && onPickResult(r)}
      >
        <strong>{r.label.split(',')[0]}</strong>
        <span>{r.label}</span>
      </button>
    {/each}
  </div>
{/if}

<style>
  .search-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .search-input-wrap {
    position: relative;
    flex: 1 1 280px;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.85rem;
    color: var(--text-muted, #9ca3af);
    pointer-events: none;
  }

  .search-input-wrap input {
    width: 100%;
    padding: 0.65rem 1rem 0.65rem 2.35rem;
    border-radius: 999px;
    border: 1px solid rgba(16, 185, 129, 0.25);
    background: #ffffff;
    font-size: 0.92rem;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .search-input-wrap input:focus {
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  }

  .btn-gps {
    appearance: none;
    border: 1px solid rgba(16, 185, 129, 0.35);
    background: rgba(236, 253, 245, 0.85);
    color: #065f46;
    font-family: inherit;
    font-size: 0.86rem;
    font-weight: 600;
    padding: 0.65rem 1rem;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .btn-gps:hover:not(:disabled) {
    background: #059669;
    color: #ffffff;
  }

  .city-jump-select {
    padding: 0.62rem 0.9rem;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.14);
    background: #ffffff;
    font-size: 0.86rem;
    font-weight: 500;
    cursor: pointer;
  }

  .info-note {
    margin-top: 0.4rem;
    font-size: 0.8rem;
    color: var(--text-muted, #6b7280);
    padding: 0.35rem 0.65rem;
    border-radius: 6px;
    background: rgba(243, 244, 246, 0.8);
  }

  .geo-dropdown {
    margin-top: 0.4rem;
    background: #ffffff;
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: 12px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
    max-height: 240px;
    overflow-y: auto;
    z-index: 20;
    position: relative;
  }

  .geo-opt {
    display: flex;
    flex-direction: column;
    width: 100%;
    text-align: left;
    padding: 0.6rem 0.9rem;
    border: none;
    background: transparent;
    cursor: pointer;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    transition: background 0.12s ease;
  }

  .geo-opt:last-child {
    border-bottom: none;
  }

  .geo-opt:hover {
    background: rgba(16, 185, 129, 0.08);
  }

  .geo-opt strong {
    font-size: 0.88rem;
    color: var(--text-heading, #1f2937);
  }

  .geo-opt span {
    font-size: 0.76rem;
    color: var(--text-muted, #6b7280);
  }
</style>

