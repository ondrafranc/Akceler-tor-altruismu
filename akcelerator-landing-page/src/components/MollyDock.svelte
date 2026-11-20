<script module>
  import { writable } from 'svelte/store';
  import { resolveIconKey } from '$lib/icons/iconRegistry.js';

  /**
   * True when the viewport is <= 1024px and the Molly dock sits inline inside .nav-capsule.
   */
  export const isCompactDock = writable(false);

  /**
   * Shared bridge between MollyCompanion and MollyDock so only a single dock instance is mounted at a time.
   * @type {import('svelte/store').Writable<{
   *   pendingTip: { icon?: string, text: string } | null,
   *   activeWhisper: { icon?: string, text: string, ts?: number, guide?: boolean, fromDock?: boolean, fromAutoPark?: boolean, fromPet?: boolean, fromToggle?: boolean, fromUnlock?: boolean, fromCelebration?: boolean } | null,
   *   hasFinePointer: boolean,
   *   atHome: boolean,
   *   isParked: boolean,
   *   forceDockWhisper?: boolean,
   *   onPet: () => void,
   *   onWakeFromPark?: () => void
   * }>}
   */
  export const mollyDockBridge = writable({
    pendingTip: null,
    activeWhisper: null,
    hasFinePointer: false,
    atHome: false,
    isParked: false,
    forceDockWhisper: false,
    onPet: () => {},
    onWakeFromPark: () => {}
  });

  /** @type {Record<string, string>} */
  const LEGACY_MOLLY_ICON_MAP = {
    '🐾': 'paw',
    '🐟': 'fish',
    '🥛': 'milk',
    '🌿': 'leaf',
    '🩷': 'heart',
    '❤️': 'heart',
    '✨': 'sparkles',
    '🌟': 'star',
    '🔔': 'bell',
    '🌸': 'flower-2',
    '💬': 'message-circle',
    '🏡': 'home',
    '🧺': 'armchair',
    '🖱️': 'mouse-pointer'
  };

  /**
   * Normalizes legacy emoji strings or semantic icon keys to a verified IconKey.
   * @param {string | null | undefined} rawIcon
   * @param {import('$lib/icons/iconRegistry.js').IconKey} [fallback='paw']
   * @returns {import('$lib/icons/iconRegistry.js').IconKey}
   */
  export function normalizeMollyIcon(rawIcon, fallback = 'paw') {
    const safeFallback = resolveIconKey(fallback);
    if (typeof rawIcon !== 'string' || !rawIcon.trim()) return safeFallback;
    const mapped = LEGACY_MOLLY_ICON_MAP[rawIcon.trim()] || rawIcon;
    return resolveIconKey(mapped);
  }
</script>

<script>
  import {
    mollyState,
    toggleMollyPelisek,
    toggleMollyFollowMouse
  } from '$lib/mollyStore.js';
  import {
    describeNextMollyGift,
    getNextMollyGiftProgress,
    pluralPamlsek
  } from '$lib/mollyTypes.js';
  import AppIcon from '$lib/components/AppIcon.svelte';

  /**
   * @type {{
   *   variant?: 'floating' | 'header',
   *   compact?: boolean
   * }}
   */
  let { variant = 'floating', compact = false } = $props();

  const nextGiftText = $derived(describeNextMollyGift($mollyState.giftDeeds));
  const giftProgress = $derived(getNextMollyGiftProgress($mollyState.giftDeeds));
  const isUserDocked = $derived($mollyState.mode === 'docked');
  const isAutoParked = $derived(!isUserDocked && Boolean($mollyDockBridge.isParked));
  const isDockedVisual = $derived(
    isUserDocked || $mollyDockBridge.atHome || isAutoParked
  );
  const toggleAriaLabel = $derived(
    isUserDocked
      ? 'Pozvat Molly na procházku'
      : isAutoParked
        ? 'Molly odpočívá v pelíšku — kliknutím ji zkusíš pozvat na procházku'
        : 'Dopřát Molly odpočinek v pelíšku'
  );
  const toggleLabelText = $derived(
    isUserDocked ? 'Procházka' : isAutoParked ? 'V pelíšku' : 'Pelíšek'
  );
  const showDockWhisper = $derived(
    variant === 'floating' &&
      Boolean($mollyDockBridge.activeWhisper) &&
      ($mollyState.mode === 'docked' ||
        $mollyDockBridge.atHome ||
        $mollyDockBridge.isParked ||
        Boolean($mollyDockBridge.forceDockWhisper))
  );
  const treatIconKey = $derived(normalizeMollyIcon($mollyState.lastTreat?.icon, 'fish'));
  const giftIconKey = $derived(normalizeMollyIcon(giftProgress.icon, 'star'));
  const whisperIconKey = $derived(normalizeMollyIcon($mollyDockBridge.activeWhisper?.icon, 'paw'));
  const pendingTreatCount = $derived(Math.max(0, Number($mollyState.availableTreats) || 0));
  const pendingTreatHint = $derived(
    pendingTreatCount > 0
      ? `${pendingTreatCount >= 2 && pendingTreatCount <= 4 ? 'Čekají' : 'Čeká'} ${pendingTreatCount} ${pluralPamlsek(pendingTreatCount)} pro Molly — kliknutím ji nakrmíš. `
      : ''
  );
</script>

<div
  class="molly-pelisek-dock"
  class:is-docked={isDockedVisual}
  class:is-header-dock={variant === 'header'}
  class:is-compact={compact}
  role="region"
  aria-label="Patronka Molly a klidový pelíšek"
>
  {#if showDockWhisper && $mollyDockBridge.activeWhisper}
    <div class="molly-dock-whisper" data-bubble-anchor="dock">
      <span class="dock-whisper-icon" aria-hidden="true">
        <AppIcon name={whisperIconKey} size={13} strokeWidth={2} />
      </span>
      <span class="dock-whisper-text">{$mollyDockBridge.activeWhisper.text}</span>
    </div>
  {/if}

  <button
    type="button"
    class="molly-dock-pet-btn"
    class:has-tip={Boolean($mollyDockBridge.pendingTip)}
    class:has-pending-treat={pendingTreatCount > 0}
    onpointerdown={(e) => e.stopPropagation()}
    onclick={(e) => {
      e.stopPropagation();
      $mollyDockBridge.onPet?.();
    }}
    title={`${pendingTreatHint}${$mollyDockBridge.pendingTip ? 'Molly má pro tebe laskavý tip. ' : ''}Pohladit kočičku Molly. ${nextGiftText}`}
    aria-label={`${pendingTreatHint}${$mollyDockBridge.pendingTip ? 'Molly má pro tebe laskavý tip. ' : ''}Pohladit Molly. Darované pamlsky: ${$mollyState.treatsFedTotal}. ${nextGiftText}`}
  >
    {#if $mollyDockBridge.pendingTip}
      <span class="molly-tip-dot" aria-hidden="true" data-testid="molly-tip-dot">
        <AppIcon name="message-circle" size={11} strokeWidth={2.2} />
      </span>
    {/if}
    <span class="molly-avatar-badge" aria-hidden="true">
      <span class="tortie-ear-left"></span>
      <span class="tortie-ear-right"></span>
      <span class="tortie-face">
        <span class="tortie-eye"></span>
        <span class="tortie-eye"></span>
      </span>
    </span>
    <span class="molly-dock-label">
      <span class="molly-dock-name">Molly</span>
      {#if !$mollyDockBridge.atHome}
        <strong class="molly-treat-counter" data-testid="molly-treat-count">
          <span>{$mollyState.treatsFedTotal}</span>
          <AppIcon name={treatIconKey} size={12} strokeWidth={2} />
        </strong>
        {#if pendingTreatCount > 0}
          <span class="molly-pending-treat-pill" data-testid="molly-pending-treat-count">
            +{pendingTreatCount}
          </span>
        {/if}
      {/if}
    </span>
    {#if !$mollyDockBridge.atHome}
      <span
        class="molly-gift-meter"
        class:is-complete={giftProgress.complete}
        aria-hidden="true"
        data-testid="molly-gift-meter"
      >
        <span class="molly-gift-icon">
          <AppIcon name={giftIconKey} size={12} strokeWidth={2} />
        </span>
        <span class="molly-gift-track">
          <span class="molly-gift-fill" style="width: {giftProgress.pct}%"></span>
        </span>
      </span>
    {/if}
  </button>

  {#if !$mollyDockBridge.atHome}
    <button
      type="button"
      class="molly-dock-toggle-btn"
      class:is-auto-parked={isAutoParked}
      class:is-user-docked={isUserDocked}
      onpointerdown={(e) => e.stopPropagation()}
      onclick={(e) => {
        e.stopPropagation();
        if (isAutoParked && $mollyDockBridge.onWakeFromPark) {
          $mollyDockBridge.onWakeFromPark();
        } else {
          toggleMollyPelisek();
        }
      }}
      aria-pressed={isUserDocked || isAutoParked}
      aria-label={toggleAriaLabel}
      title={toggleAriaLabel}
    >
      <AppIcon
        name={isUserDocked ? 'footprints' : 'armchair'}
        size={14}
        strokeWidth={2}
      />
      <span class="molly-toggle-text">
        {toggleLabelText}
      </span>
    </button>

    {#if $mollyDockBridge.hasFinePointer}
      <button
        type="button"
        class="molly-dock-follow-btn"
        class:is-active={$mollyState.followMouse}
        onpointerdown={(e) => e.stopPropagation()}
        onclick={(e) => {
          e.stopPropagation();
          toggleMollyFollowMouse();
        }}
        aria-pressed={$mollyState.followMouse}
        aria-label={$mollyState.followMouse
          ? 'Vypnout sledování myši'
          : 'Zapnout sledování myši (Molly půjde za kurzorem)'}
        title={$mollyState.followMouse
          ? 'Vypnout sledování myši'
          : 'Zapnout sledování myši (Molly půjde za kurzorem)'}
      >
        <AppIcon
          name={$mollyState.followMouse ? 'paw' : 'mouse-pointer'}
          size={13}
          strokeWidth={2}
        />
        <span class="molly-follow-text">
          {$mollyState.followMouse ? 'Sleduji' : 'Myš'}
        </span>
      </button>
    {/if}
  {/if}
</div>

<style>
  .molly-pelisek-dock {
    position: fixed;
    bottom: 14px;
    left: 14px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--border-strong, #c2cec5);
    box-shadow: 0 4px 16px rgba(18, 42, 30, 0.08);
    pointer-events: auto;
    z-index: 941;
    flex-shrink: 0;
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }

  .molly-pelisek-dock.is-docked {
    background: var(--bg-subtle, #edf2ee);
    border-color: var(--accent-primary, #1b5e42);
  }

  .molly-pelisek-dock.is-header-dock {
    position: static;
    bottom: auto;
    left: auto;
    z-index: auto;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    box-shadow: none;
    padding: 2px;
    gap: 2px;
  }

  .molly-pelisek-dock.is-header-dock.is-docked {
    border-color: var(--accent-primary, #1b5e42);
  }

  .molly-dock-whisper {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    width: max-content;
    max-width: min(248px, calc(100vw - 24px));
    box-sizing: border-box;
    padding: 7px 11px;
    border-radius: 12px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-strong, #c2cec5);
    color: var(--ink-primary, #14281d);
    font-size: 0.76rem;
    font-weight: 600;
    line-height: 1.35;
    display: flex;
    align-items: flex-start;
    gap: 6px;
    pointer-events: none;
    box-shadow: var(--shadow-md, 0 8px 20px -6px rgba(18, 42, 30, 0.08));
  }

  .molly-dock-whisper[data-bubble-anchor='dock']::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 20px;
    width: 8px;
    height: 8px;
    background: var(--bg-surface, #ffffff);
    border-right: 1px solid var(--border-strong, #c2cec5);
    border-bottom: 1px solid var(--border-strong, #c2cec5);
    transform: rotate(45deg);
    pointer-events: none;
  }

  .dock-whisper-icon {
    display: inline-flex;
    align-items: center;
    color: var(--accent-primary, #1b5e42);
    margin-top: 1px;
    flex-shrink: 0;
  }

  .dock-whisper-text {
    overflow-wrap: anywhere;
  }

  .molly-dock-pet-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0.35rem 0.7rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: var(--ink-primary, #14281d);
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.18s ease;
  }

  .molly-dock-pet-btn:hover {
    background: var(--bg-subtle, #edf2ee);
  }

  .is-header-dock .molly-dock-pet-btn:hover {
    background: var(--bg-surface, #ffffff);
  }

  .molly-tip-dot {
    position: static;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--accent-warm-tint, #fef6e8);
    color: var(--accent-warm-ink, #8f4b0e);
    border: 1px solid rgba(143, 75, 14, 0.32);
    flex-shrink: 0;
  }

  .molly-avatar-badge {
    position: relative;
    width: 18px;
    height: 16px;
    display: inline-block;
    flex-shrink: 0;
  }

  .tortie-ear-left,
  .tortie-ear-right {
    position: absolute;
    top: 0;
    width: 6px;
    height: 6px;
    border-radius: 2px 5px 0 0;
  }

  .tortie-ear-left {
    left: 1px;
    background: #1e1714;
    border: 1px solid rgba(184, 101, 27, 0.45);
    transform: rotate(-14deg);
  }

  .tortie-ear-right {
    right: 1px;
    background: #c2410c;
    transform: rotate(14deg);
  }

  .tortie-face {
    position: absolute;
    bottom: 0;
    left: 1px;
    right: 1px;
    height: 13px;
    border-radius: 999px;
    background: linear-gradient(90deg, #1e1714 0%, #1e1714 50%, #d97706 50%, #c2410c 100%);
    border: 1px solid #3f574a;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0 2px;
  }

  .tortie-eye {
    width: 3.5px;
    height: 3.5px;
    border-radius: 999px;
    background: #bef264;
  }

  .molly-dock-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }

  .molly-dock-name {
    color: var(--ink-primary, #14281d);
    font-weight: 700;
  }

  .molly-treat-counter {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--accent-warm-ink, #8f4b0e);
    font-weight: 800;
    background: var(--accent-warm-tint, #fef6e8);
    border: 1px solid rgba(143, 75, 14, 0.24);
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 0.72rem;
    line-height: 1.25;
  }

  .molly-dock-pet-btn.has-pending-treat .molly-treat-counter {
    background: var(--hero-dawn, #fef3c7);
    border-color: var(--accent-warm, #b8651b);
    color: var(--accent-warm-ink, #8f4b0e);
    box-shadow: 0 0 0 2px rgba(184, 101, 27, 0.22);
  }

  .molly-pending-treat-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px 5px;
    border-radius: 999px;
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-size: 0.68rem;
    font-weight: 800;
    line-height: 1.25;
  }

  .molly-gift-meter {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 2px;
  }

  .molly-gift-icon {
    display: inline-flex;
    align-items: center;
    color: var(--accent-warm-ink, #8f4b0e);
  }

  .molly-gift-track {
    width: 24px;
    height: 5px;
    border-radius: 999px;
    background: var(--border-subtle, #dce3dd);
    overflow: hidden;
    display: inline-block;
  }

  .molly-gift-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--accent-primary, #1b5e42);
    transition: width 0.25s ease;
  }

  .molly-dock-toggle-btn,
  .molly-dock-follow-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 0.35rem 0.7rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    border-radius: 999px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    font-family: inherit;
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  }

  .molly-dock-toggle-btn:hover,
  .molly-dock-follow-btn:hover {
    background: var(--bg-subtle, #edf2ee);
    border-color: var(--border-strong, #c2cec5);
  }

  .molly-dock-toggle-btn.is-auto-parked {
    background: var(--accent-warm-tint, #fef6e8);
    border-color: rgba(143, 75, 14, 0.38);
    color: var(--accent-warm-ink, #8f4b0e);
  }

  .molly-dock-toggle-btn.is-auto-parked:hover {
    background: var(--hero-dawn, #fef3c7);
    border-color: rgba(143, 75, 14, 0.55);
  }

  .molly-dock-toggle-btn.is-user-docked {
    background: var(--bohemian-mist, #e6f0ea);
    border-color: var(--czech-forest, #1d5c40);
    color: var(--czech-forest, #1d5c40);
  }

  .molly-dock-toggle-btn.is-user-docked:hover {
    background: var(--bohemian-sage, #eef5f0);
    border-color: var(--czech-forest-hover, #164932);
  }

  .molly-dock-follow-btn.is-active {
    background: var(--accent-warm-tint, #fef6e8);
    border-color: rgba(143, 75, 14, 0.45);
    color: var(--accent-warm-ink, #8f4b0e);
  }

  .molly-pelisek-dock.is-compact .molly-dock-pet-btn,
  .molly-pelisek-dock.is-compact .molly-dock-toggle-btn {
    padding: 0.2rem 0.42rem;
    min-height: 44px;
    min-width: 44px;
  }

  .molly-pelisek-dock.is-compact .molly-dock-name,
  .molly-pelisek-dock.is-compact .molly-gift-meter,
  .molly-pelisek-dock.is-compact .molly-toggle-text,
  .molly-pelisek-dock.is-compact .molly-follow-text,
  .molly-pelisek-dock.is-compact .molly-dock-follow-btn {
    display: none;
  }

  @media (max-width: 820px) {
    .molly-pelisek-dock.is-header-dock .molly-gift-meter,
    .molly-pelisek-dock.is-header-dock .molly-dock-follow-btn {
      display: none !important;
    }
  }

  @media (max-width: 680px) {
    .molly-dock-pet-btn,
    .molly-dock-toggle-btn {
      padding: 0.2rem 0.42rem;
      min-height: 44px;
      min-width: 44px;
    }

    .molly-dock-name,
    .molly-gift-meter,
    .molly-toggle-text,
    .molly-follow-text,
    .molly-dock-follow-btn {
      display: none !important;
    }
  }

  @media (max-width: 480px) {
    .molly-pending-treat-pill {
      display: none !important;
    }

    .molly-pelisek-dock.is-header-dock {
      padding: 1px;
      gap: 2px;
    }

    .molly-pelisek-dock.is-header-dock .molly-dock-pet-btn {
      padding: 0.18rem 0.34rem;
      gap: 4px;
      min-height: 44px;
      min-width: 44px;
    }

    .molly-pelisek-dock.is-header-dock .molly-dock-toggle-btn {
      padding: 0;
      width: 44px;
      height: 44px;
      min-height: 44px;
      min-width: 44px;
    }

    .molly-pelisek-dock.is-header-dock .molly-tip-dot {
      width: 16px;
      height: 16px;
    }

    .molly-pelisek-dock.is-header-dock .molly-treat-counter {
      padding: 1px 5px;
      gap: 2px;
      font-size: 0.7rem;
    }
  }

  @media (max-width: 359px) {
    .molly-pelisek-dock.is-header-dock {
      padding: 1px;
      gap: 1px;
    }

    .molly-pelisek-dock.is-header-dock .molly-dock-pet-btn {
      padding: 0.14rem 0.22rem;
      gap: 3px;
    }

    .molly-pelisek-dock.is-header-dock .molly-tip-dot {
      width: 15px;
      height: 15px;
    }

    .molly-pelisek-dock.is-header-dock .molly-treat-counter {
      padding: 1px 4px;
      gap: 1.5px;
      font-size: 0.66rem;
    }
  }

  @media (min-width: 1025px) and (max-width: 1859px) {
    .molly-pelisek-dock:not(.is-header-dock) {
      left: 6px;
      bottom: 14px;
      gap: 1px;
      padding: 2px;
      max-width: 146px;
    }

    .molly-pelisek-dock:not(.is-header-dock) .molly-dock-pet-btn {
      padding: 0 1px;
      gap: 2px;
      min-height: 44px;
      min-width: 44px;
    }

    .molly-pelisek-dock:not(.is-header-dock) .molly-avatar-badge {
      width: 15px;
      height: 14px;
    }

    .molly-pelisek-dock:not(.is-header-dock) .molly-dock-toggle-btn,
    .molly-pelisek-dock:not(.is-header-dock) .molly-dock-follow-btn {
      padding: 0;
      min-height: 44px;
      min-width: 44px;
    }

    .molly-pelisek-dock:not(.is-header-dock) .molly-dock-label {
      gap: 0;
    }

    .molly-pelisek-dock:not(.is-header-dock) .molly-treat-counter {
      padding: 0 1px;
      gap: 3px;
      font-size: 0.65rem;
      border: none;
    }

    .molly-pelisek-dock:not(.is-header-dock) .molly-tip-dot {
      position: absolute;
      top: 1px;
      right: 1px;
      width: 14px;
      height: 14px;
    }

    .molly-pelisek-dock:not(.is-header-dock) .molly-gift-meter {
      display: none;
    }

    .molly-pelisek-dock:not(.is-header-dock) .molly-dock-name,
    .molly-pelisek-dock:not(.is-header-dock) .molly-toggle-text,
    .molly-pelisek-dock:not(.is-header-dock) .molly-follow-text {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    .molly-pelisek-dock:not(.is-header-dock) .molly-dock-whisper {
      max-width: min(248px, calc(100vw - 24px));
    }
  }

  @media (min-width: 1025px) and (max-height: 700px) {
    .molly-pelisek-dock:not(.is-header-dock) {
      bottom: 8px;
    }
  }
</style>
