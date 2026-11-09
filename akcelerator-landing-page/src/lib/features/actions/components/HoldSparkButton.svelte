<script>
  import { startHoldSpark } from '../../../../lib/sensoryEngine.js';
  import { trackEvent } from '../../../../lib/analytics.js';

  export let href = '';
  export let target = '_blank';
  export let rel = 'noopener noreferrer';
  export let className = '';
  export let action = null;
  export let surface = 'action';
  export let dataMollyGuide = false;
  export let text = 'Začít pomáhat';
  export let onStart = null;

  let stopHoldSpark = null;

  function handlePointerDown(e) {
    if (e.button && e.button !== 0) return;
    if (stopHoldSpark) stopHoldSpark(false);
    stopHoldSpark = startHoldSpark(e.currentTarget, () => {
      trackEvent('aa_hold_spark_ready', { id: action?.id, surface });
    });
  }

  function handlePointerEnd(released = false) {
    if (stopHoldSpark) {
      stopHoldSpark(released);
      stopHoldSpark = null;
    }
  }

  function handleClick(e) {
    handlePointerEnd(true);
    if (onStart && action) {
      onStart(action);
    }
  }
  $: fullClass = `btn-studio-primary ${className}`.trim();
</script>

{#if href}
  <a
    {href}
    {target}
    {rel}
    class={fullClass}
    data-hold-spark="true"
    data-molly-guide={dataMollyGuide ? 'true' : undefined}
    on:pointerdown={handlePointerDown}
    on:pointerup={() => handlePointerEnd(true)}
    on:pointerleave={() => handlePointerEnd(false)}
    on:pointercancel={() => handlePointerEnd(false)}
    on:click={handleClick}
  >
    <slot>
      <span>{text}</span>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M7 17L17 7M7 7h10v10" />
      </svg>
    </slot>
  </a>
{:else}
  <button
    type="button"
    class={fullClass}
    data-hold-spark="true"
    data-molly-guide={dataMollyGuide ? 'true' : undefined}
    on:pointerdown={handlePointerDown}
    on:pointerup={() => handlePointerEnd(true)}
    on:pointerleave={() => handlePointerEnd(false)}
    on:pointercancel={() => handlePointerEnd(false)}
    on:click={handleClick}
  >
    <slot>
      <span>{text}</span>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M7 17L17 7M7 7h10v10" />
      </svg>
    </slot>
  </button>
{/if}

<style>
  .btn-studio-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    font-weight: 600;
    padding: 0.65rem 1.25rem;
    border-radius: 999px;
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: #ffffff;
    text-decoration: none;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(5, 150, 105, 0.28);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .btn-studio-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(5, 150, 105, 0.36);
  }

  .btn-studio-primary:active {
    transform: translateY(0);
  }
</style>
