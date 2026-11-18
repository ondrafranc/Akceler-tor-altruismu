<script>
  import { cleanTitle } from "../../../utils.js";
  import { trackEvent } from "../../../analytics.js";
  import { SANCTUARY_ELEMENTS } from "../../../progress.js";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import { resolveIconKey } from "$lib/icons/iconRegistry.js";

  /**
   * @typedef {{
   *   uid?: string,
   *   actionId?: string,
   *   title?: string,
   *   note?: string,
   *   concreteImpact?: string,
   *   orgName?: string,
   *   minutes?: number,
   *   url?: string,
   *   element?: string,
   *   x?: number,
   *   y?: number,
   *   zone?: 'sky' | 'water',
   *   lightType?: string,
   *   isMine?: boolean,
   *   [key: string]: unknown
   * }} InspectorLight
   */

  /** @type {InspectorLight | null} */
  export let selectedLight = null;
  /** @type {Record<string, { title?: string, icon?: string, color?: string, [key: string]: unknown }>} */
  export let elementMap = {};
  /** @type {(() => void) | null} */
  export let onClose = null;
  /** @type {((light: InspectorLight) => void) | null} */
  export let onMarkDone = null;

  /**
   * @param {InspectorLight | null} light
   * @returns {{ icon: string, label: string }}
   */
  function getLightSemanticInfo(light) {
    const lt = light?.lightType || (light?.zone === "sky" ? "star" : "lantern");
    if (lt === "wave") return { icon: "waves", label: "Vlna · Pomoc druhému" };
    if (lt === "star") return { icon: "star", label: "Hvězda · Inspirace" };
    return { icon: "flame", label: "Lucerna · Osobní skutek" };
  }

  function handleClose() {
    if (onClose) onClose();
  }

  function handleDone() {
    if (onMarkDone) onMarkDone(selectedLight);
  }

  $: selMeta =
    (selectedLight && elementMap[selectedLight.element]) ||
    SANCTUARY_ELEMENTS[3];
  $: lightInfo = getLightSemanticInfo(selectedLight);
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
        <AppIcon
          name={resolveIconKey(selMeta.icon)}
          size={13}
          strokeWidth={2}
          class={selMeta.icon === "paw" ? "mw-paw-svg" : ""}
        />
        <span>{selMeta.title} ·</span>
        <AppIcon name={resolveIconKey(lightInfo.icon)} size={13} strokeWidth={2} />
        <span>
          {lightInfo.label}{#if selectedLight.isMine} · Tvůj skutek{/if}
        </span>
      </span>
      <button
        type="button"
        class="mw-close"
        on:click={handleClose}
        aria-label="Zavřít"
      >
        <AppIcon name="x" size={16} strokeWidth={2.2} />
      </button>
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
          on:click={() =>
            trackEvent("aa_world_deed_open", { id: selectedLight.actionId })}
        >
          <span>Udělat tenhle skutek</span>
          <AppIcon name="arrow-up-right" size={15} strokeWidth={2} />
        </a>
      {/if}
      {#if !selectedLight.isMine}
        <button type="button" class="mw-btn-done" on:click={handleDone}>
          <AppIcon name="check" size={15} strokeWidth={2.2} />
          <span>Mám splněno — rozsvítit</span>
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
    width: min(350px, calc(100% - 2rem));
    padding: 1rem 1.1rem;
    border-radius: 18px;
    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
    color: var(--ink-primary);
    z-index: 20;
    box-shadow: var(--shadow-lg);
  }

  .mw-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.45rem;
    margin-bottom: 0.35rem;
  }

  .mw-overline {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem;
    font-size: 0.72rem;
    font-weight: 800;
    color: #8f4b0e;
    letter-spacing: 0.02em;
    line-height: 1.35;
    padding-top: 0.25rem;
  }

  .mw-overline :global(.mw-paw-svg) {
    color: #8f4b0e;
  }

  .mw-close {
    flex-shrink: 0;
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 11px;
    background: transparent;
    color: var(--ink-secondary);
    cursor: pointer;
    margin: -0.35rem -0.35rem 0 0;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .mw-close:hover {
    background: var(--bg-subtle);
    color: var(--ink-primary);
  }

  .mw-title {
    display: block;
    font-size: 0.98rem;
    line-height: 1.32;
    margin-bottom: 0.25rem;
    color: var(--ink-primary);
  }

  .mw-meta {
    font-size: 0.76rem;
    color: var(--ink-muted);
    margin-bottom: 0.4rem;
    display: flex;
    gap: 0.35rem;
  }

  .mw-impact {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.48;
    color: var(--ink-secondary);
  }

  .mw-note {
    margin: 0.35rem 0 0;
    font-size: 0.8rem;
    font-style: italic;
    color: #8f4b0e;
  }

  .mw-actions {
    margin-top: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .mw-btn-link {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.56rem 0.9rem;
    border-radius: 11px;
    background: var(--accent-primary);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.84rem;
    text-decoration: none;
    transition: background-color 0.16s ease;
  }

  .mw-btn-link:hover {
    background: var(--accent-primary-hover);
  }

  .mw-btn-done {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.52rem 0.9rem;
    border-radius: 11px;
    border: 1px solid var(--border-strong);
    background: var(--bg-subtle);
    color: var(--ink-primary);
    font-family: inherit;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    transition: border-color 0.16s ease, background-color 0.16s ease;
  }

  .mw-btn-done:hover {
    background: var(--bg-canvas);
    border-color: var(--accent-primary);
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
