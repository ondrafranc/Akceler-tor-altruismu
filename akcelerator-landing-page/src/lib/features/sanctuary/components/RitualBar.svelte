<script>
  import { onMount } from "svelte";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import { resolveIconKey } from "$lib/icons/iconRegistry.js";

  /**
   * @type {{
   *   ritualMode?: string,
   *   ritualInput?: string,
   *   nextSeedToPlant?: unknown,
   *   wishesCount?: number,
   *   onSubmit?: ((payload: { ritualMode: string, ritualInput: string }) => void) | null,
   *   onSelectMode?: ((mode: string) => void) | null,
   *   onQuickDeed?: ((deed: { icon?: string, label: string, title: string, element: string, lightType: string }) => void) | null,
   *   onClearWishes?: (() => void) | null
   * }}
   */
  let {
    ritualMode = $bindable("water"),
    ritualInput = $bindable(""),
    nextSeedToPlant = null,
    wishesCount = 0,
    onSubmit = null,
    onSelectMode = null,
    onQuickDeed = null,
    onClearWishes = null,
  } = $props();

  let quickIdeasOpen = $state(true);

  onMount(() => {
    quickIdeasOpen = true;
  });

  export const QUICK_OFFLINE_DEEDS = [
    {
      icon: "paw",
      label: "Miska útulku",
      title: "Naplněná miska pro zvířata v útulku",
      element: "animals",
      lightType: "lantern",
    },
    {
      icon: "handshake",
      label: "Pomoc druhému",
      title: "Drobná pomoc člověku v mém okolí",
      element: "community",
      lightType: "wave",
    },
    {
      icon: "leaf",
      label: "Sebraný odpadek",
      title: "Sebraný odpadek cestou v přírodě či ulici",
      element: "nature",
      lightType: "lantern",
    },
    {
      icon: "sparkles",
      label: "Tichá inspirace",
      title: "Zpráva nebo vlídná myšlenka pro druhého",
      element: "care",
      lightType: "star",
    },
  ];

  function handleSubmit(event) {
    event?.preventDefault?.();
    if (onSubmit) onSubmit({ ritualMode, ritualInput });
  }

  function handleModeChange(mode) {
    ritualMode = mode;
    if (onSelectMode) onSelectMode(mode);
  }
</script>

<form class="ritual-bar" onsubmit={handleSubmit}>
  <div class="ritual-dock-main">
    <div
      class="ritual-modes"
      role="tablist"
      aria-label="Kam rozsvítit dobrý skutek"
    >
      <button
        type="button"
        role="tab"
        aria-selected={ritualMode === "water"}
        class="ritual-pill"
        class:active={ritualMode === "water"}
        onclick={() => handleModeChange("water")}
      >
        <AppIcon name="flame" size={14} strokeWidth={2} />
        <span>Lucerna</span>
        <span class="rp-sub">· Osobní skutek</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={ritualMode === "sky"}
        class="ritual-pill"
        class:active={ritualMode === "sky"}
        onclick={() => handleModeChange("sky")}
      >
        <AppIcon name="star" size={14} strokeWidth={2} />
        <span>Hvězda</span>
        <span class="rp-sub">· Inspirace</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={ritualMode === "wave"}
        class="ritual-pill"
        class:active={ritualMode === "wave"}
        onclick={() => handleModeChange("wave")}
      >
        <AppIcon name="waves" size={14} strokeWidth={2} />
        <span>Vlna</span>
        <span class="rp-sub">· Pomoc druhému</span>
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
      <AppIcon
        name={ritualMode === "wave"
          ? "waves"
          : ritualMode === "water"
            ? "flame"
            : "star"}
        size={15}
        strokeWidth={2}
      />
      <span>
        {ritualMode === "wave"
          ? "Vyslat vlnu"
          : ritualMode === "water"
            ? "Rozsvítit lucernu"
            : "Rozsvítit hvězdu"}
      </span>
    </button>
  </div>

  {#if !nextSeedToPlant}
    <details class="quick-ideas-toggle" bind:open={quickIdeasOpen}>
      <summary class="quick-ideas-summary">
        <AppIcon name="lightbulb" size={14} strokeWidth={2} />
        <span>Rychlé nápady</span>
      </summary>
      <div
        class="ritual-whisper-row"
        aria-label="Rychlé příklady dnešních dobrých skutků"
      >
        {#each QUICK_OFFLINE_DEEDS as qd}
          <button
            type="button"
            class="qd-chip"
            onclick={() => onQuickDeed && onQuickDeed(qd)}
          >
            <AppIcon name={resolveIconKey(qd.icon)} size={13} strokeWidth={2} />
            <span>{qd.label}</span>
          </button>
        {/each}
        {#if wishesCount > 0}
          <button
            type="button"
            class="ritual-clear-btn"
            onclick={() => onClearWishes && onClearWishes()}
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
    margin-top: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .ritual-dock-main {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.45rem;
    padding: 0.25rem;
    border-radius: 16px;
    background: var(--bg-subtle);
    border: 1px solid var(--border-subtle);
    min-width: 0;
  }

  .ritual-modes {
    display: inline-flex;
    gap: 0.2rem;
    padding: 0.125rem;
    border-radius: 12px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
  }

  .ritual-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.28rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    border: none;
    border-radius: 9px;
    padding: 0.38rem 0.68rem;
    background: transparent;
    color: var(--ink-secondary);
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition:
      background-color 0.16s ease,
      color 0.16s ease;
    white-space: nowrap;
  }

  .ritual-pill:hover {
    color: var(--ink-primary);
  }

  .ritual-pill.active {
    background: var(--accent-primary);
    color: #ffffff;
  }

  .ritual-dock-main input {
    min-width: 0;
    width: 100%;
    min-height: 44px;
    box-sizing: border-box;
    padding: 0.45rem 0.78rem;
    border: 1px solid var(--border-strong);
    border-radius: 11px;
    background: var(--bg-surface);
    color: var(--ink-primary);
    font-family: inherit;
    font-size: 0.9rem;
    transition:
      border-color 0.16s ease,
      box-shadow 0.16s ease;
  }

  .ritual-dock-main input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(27, 94, 66, 0.16);
  }

  .ritual-dock-main input::placeholder {
    color: var(--ink-secondary, #3f574a);
  }

  .ritual-send-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    border: none;
    border-radius: 11px;
    padding: 0.5rem 0.95rem;
    background: var(--accent-primary);
    color: #ffffff;
    font-family: inherit;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.16s ease;
  }

  .ritual-send-btn:hover {
    background: var(--accent-primary-hover);
  }

  .quick-ideas-toggle {
    margin-top: 0.25rem;
  }

  .quick-ideas-toggle:not([open]) .ritual-whisper-row {
    display: none;
  }

  .quick-ideas-summary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--ink-secondary);
    background: var(--bg-subtle);
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    padding: 0.4rem 0.85rem;
    cursor: pointer;
    user-select: none;
    list-style: none;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease,
      color 0.16s ease;
  }

  .quick-ideas-summary::-webkit-details-marker {
    display: none;
  }

  .quick-ideas-summary:hover {
    background: var(--bg-surface);
    border-color: var(--border-strong);
    color: var(--ink-primary);
  }

  .quick-ideas-toggle[open] .quick-ideas-summary {
    margin-bottom: 0.4rem;
  }

  .ritual-whisper-row {
    display: flex;
    align-items: center;
    gap: 0.42rem;
    flex-wrap: wrap;
    padding: 0 0.15rem;
  }

  .qd-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    padding: 0.4rem 0.82rem;
    background: var(--bg-surface);
    color: var(--ink-primary);
    font-family: inherit;
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease;
  }

  .qd-chip:hover {
    background: var(--bg-subtle);
    border-color: var(--accent-primary);
  }

  .ritual-clear-btn {
    margin-left: auto;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--ink-secondary, #3f574a);
    font-family: inherit;
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    padding: 0 0.55rem;
  }

  .ritual-clear-btn:hover {
    color: var(--ink-primary);
  }

  @media (max-width: 1024px) {
    .ritual-dock-main input {
      font-size: 1rem;
    }
  }

  @media (max-width: 900px) {
    .ritual-dock-main {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.45rem;
      padding: 0.45rem;
      border-radius: 16px;
      box-sizing: border-box;
    }

    .ritual-modes {
      grid-column: 1 / -1;
      width: 100%;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      overflow: visible;
    }

    .ritual-pill {
      min-height: 44px;
      min-width: 44px;
      white-space: nowrap;
      text-align: center;
      justify-content: center;
      box-sizing: border-box;
    }

    .ritual-dock-main input {
      width: 100%;
      min-width: 0;
      min-height: 44px;
      font-size: 1rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 0.55rem 0.72rem;
      box-sizing: border-box;
    }

    .ritual-send-btn {
      min-height: 44px;
      min-width: 44px;
      white-space: nowrap;
      padding: 0.55rem 0.9rem;
    }

    .quick-ideas-summary {
      min-height: 44px;
      min-width: 44px;
      padding: 0.42rem 0.85rem;
      font-size: 0.8rem;
      box-sizing: border-box;
    }

    .qd-chip {
      min-height: 44px;
      min-width: 44px;
      padding: 0.42rem 0.8rem;
      box-sizing: border-box;
    }

    .ritual-clear-btn {
      min-height: 44px;
      min-width: 44px;
      display: inline-flex;
      align-items: center;
      padding: 0 0.55rem;
      box-sizing: border-box;
    }
  }

  @media (max-width: 680px) {
    .ritual-pill {
      padding: 0.42rem 0.32rem;
      font-size: 0.75rem;
    }

    .ritual-pill .rp-sub {
      display: none;
    }

    .ritual-whisper-row {
      flex-wrap: wrap;
      overflow: visible;
      padding-bottom: 2px;
    }

    .qd-chip {
      white-space: nowrap;
      flex-shrink: 0;
    }

    .ritual-clear-btn {
      white-space: nowrap;
      flex-shrink: 0;
    }
  }

  @media (max-width: 480px) {
    .ritual-dock-main {
      grid-template-columns: minmax(0, 1fr);
    }

    .ritual-send-btn {
      width: 100%;
    }
  }
</style>
