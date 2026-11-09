<script>
  export let ritualMode = 'water'; // 'water' | 'sky' | 'wave'
  export let ritualInput = '';
  export let nextSeedToPlant = null;
  export let wishesCount = 0;

  export let onSubmit = null;
  export let onSelectMode = null;
  export let onQuickDeed = null;
  export let onClearWishes = null;

  export const QUICK_OFFLINE_DEEDS = [
    { label: '🥣 Miska útulku', title: 'Naplněná miska pro zvířata v útulku', element: 'animals', lightType: 'lantern' },
    { label: '🤝 Pomoc druhému', title: 'Drobná pomoc člověku v mém okolí', element: 'community', lightType: 'wave' },
    { label: '🌿 Sebraný odpadek', title: 'Sebraný odpadek cestou v přírodě či ulici', element: 'nature', lightType: 'lantern' },
    { label: '✦ Tichá inspirace', title: 'Zpráva nebo vlídná myšlenka pro druhého', element: 'care', lightType: 'star' }
  ];

  function handleSubmit() {
    if (onSubmit) onSubmit({ ritualMode, ritualInput });
  }

  function handleModeChange(mode) {
    ritualMode = mode;
    if (onSelectMode) onSelectMode(mode);
  }
</script>

<form class="ritual-bar" on:submit|preventDefault={handleSubmit}>
  <div class="ritual-dock-main">
    <div class="ritual-modes" role="tablist" aria-label="Kam rozsvítit dobrý skutek">
      <button
        type="button"
        class="ritual-pill"
        class:active={ritualMode === 'water'}
        on:click={() => handleModeChange('water')}
      >
        🏮 Lucerna <span class="rp-sub">· Osobní skutek</span>
      </button>
      <button
        type="button"
        class="ritual-pill"
        class:active={ritualMode === 'sky'}
        on:click={() => handleModeChange('sky')}
      >
        ✦ Hvězda <span class="rp-sub">· Inspirace</span>
      </button>
      <button
        type="button"
        class="ritual-pill"
        class:active={ritualMode === 'wave'}
        on:click={() => handleModeChange('wave')}
      >
        〰️ Vlna <span class="rp-sub">· Pomoc druhému</span>
      </button>
    </div>

    <input
      type="text"
      id="ritual-deed-input"
      name="deed"
      autocomplete="off"
      bind:value={ritualInput}
      maxlength="110"
      placeholder="Tvůj dnešní skutek…"
      aria-label="Popis tvého dobrého skutku"
    />

    <button type="submit" class="ritual-send-btn">
      {ritualMode === 'wave'
        ? '〰️ Vyslat vlnu'
        : ritualMode === 'water'
        ? '🏮 Rozsvítit lucernu'
        : '✦ Rozsvítit hvězdu'}
    </button>
  </div>

  {#if !nextSeedToPlant}
    <details class="quick-ideas-toggle" open>
      <summary class="quick-ideas-summary">💡 Rychlé nápady</summary>
      <div class="ritual-whisper-row" aria-label="Rychlé příklady dnešních dobrých skutků">
        {#each QUICK_OFFLINE_DEEDS as qd}
          <button type="button" class="qd-chip" on:click={() => onQuickDeed && onQuickDeed(qd)}>
            {qd.label}
          </button>
        {/each}
        {#if wishesCount > 0}
          <button
            type="button"
            class="ritual-clear-btn"
            on:click={() => onClearWishes && onClearWishes()}
          >
            Vyčistit přidaná
          </button>
        {/if}
      </div>
    </details>
  {/if}
</form>

<style>
  .ritual-bar {
    margin-top: 0.95rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .ritual-dock-main {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.5rem;
    padding: 0.42rem;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
    min-width: 0;
  }

  .ritual-modes {
    display: inline-flex;
    gap: 0.2rem;
    padding: 0.2rem;
    border-radius: 13px;
    background: rgba(4, 16, 11, 0.45);
  }

  .ritual-pill {
    border: none;
    border-radius: 10px;
    padding: 0.42rem 0.75rem;
    background: transparent;
    color: rgba(236, 253, 245, 0.8);
    font-family: inherit;
    font-size: 0.79rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .ritual-pill.active {
    background: rgba(253, 230, 138, 0.22);
    color: #fde68a;
  }

  .ritual-dock-main input {
    min-width: 0;
    width: 100%;
    padding: 0.55rem 0.75rem;
    border: none;
    background: transparent;
    color: #ffffff;
    font-family: inherit;
    font-size: 0.88rem;
  }

  .ritual-dock-main input:focus {
    outline: none;
  }

  .ritual-dock-main input::placeholder {
    color: rgba(226, 242, 233, 0.58);
  }

  .ritual-send-btn {
    border: none;
    border-radius: 12px;
    padding: 0.58rem 1.05rem;
    background: linear-gradient(135deg, #fde68a 0%, #6ee7b7 100%);
    color: #061b12;
    font-family: inherit;
    font-weight: 800;
    font-size: 0.83rem;
    cursor: pointer;
    white-space: nowrap;
    transition: transform 0.16s ease;
  }

  .ritual-send-btn:hover {
    transform: translateY(-1px);
  }

  .quick-ideas-toggle {
    margin-top: 0.4rem;
  }

  .quick-ideas-summary {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.76rem;
    font-weight: 700;
    color: rgba(230, 245, 236, 0.85);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    padding: 0.24rem 0.7rem;
    cursor: pointer;
    user-select: none;
    transition: all 0.16s ease;
  }

  .quick-ideas-summary:hover {
    background: rgba(255, 255, 255, 0.16);
    color: #ffffff;
  }

  .quick-ideas-toggle[open] .quick-ideas-summary {
    margin-bottom: 0.35rem;
  }

  .ritual-whisper-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    padding: 0 0.25rem;
  }

  .qd-chip {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    padding: 0.24rem 0.68rem;
    background: rgba(255, 255, 255, 0.05);
    color: rgba(236, 253, 245, 0.88);
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .qd-chip:hover {
    background: rgba(253, 230, 138, 0.2);
    border-color: rgba(253, 230, 138, 0.45);
    color: #fef3c7;
  }

  .ritual-clear-btn {
    margin-left: auto;
    border: none;
    background: transparent;
    color: rgba(226, 242, 233, 0.62);
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
  }

  @media (max-width: 680px) {
    .ritual-dock-main {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.45rem;
      padding: 0.45rem;
      border-radius: 16px;
    }

    .ritual-modes {
      grid-column: 1 / -1;
      width: 100%;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      overflow: visible;
    }

    .ritual-pill {
      padding: 0.4rem 0.3rem;
      font-size: 0.74rem;
      white-space: nowrap;
      text-align: center;
      justify-content: center;
    }

    .ritual-pill .rp-sub {
      display: none;
    }

    .ritual-dock-main input {
      width: 100%;
      min-width: 0;
      background: rgba(4, 16, 11, 0.35);
      border-radius: 10px;
      padding: 0.55rem 0.7rem;
      box-sizing: border-box;
    }

    .ritual-send-btn {
      white-space: nowrap;
      padding: 0.55rem 0.85rem;
    }

    .quick-ideas-summary {
      min-height: 36px;
      padding: 0.28rem 0.68rem;
      font-size: 0.74rem;
      box-sizing: border-box;
    }

    .ritual-whisper-row {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 2px;
    }

    .ritual-whisper-row::-webkit-scrollbar {
      display: none;
    }

    .qd-chip {
      min-height: 38px;
      display: inline-flex;
      align-items: center;
    }
  }
</style>

