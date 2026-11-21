<script>
  import { onMount, onDestroy } from 'svelte';
  import AppIcon from '$lib/components/AppIcon.svelte';
  import ActionCard from './ActionCard.svelte';
  import { safeSetItem, AA_DONE_FOR_TODAY_PREFIX } from '../../../../lib/storage/index.js';
  import { trackEvent } from '../../../../lib/analytics.js';
  import { getTodayKey, isDayClosedToday } from '../services/dayClosure.js';

  // Psychological session closure key prefix: 'aa_done_for_today_'
  const DONE_FOR_TODAY_PREFIX = AA_DONE_FOR_TODAY_PREFIX;
  import { safeVibrate } from '../../../../lib/core/device.js';
  import { playCelebrationChord } from '../../../../lib/audio/presets.js';
  import { todayCompletedCount } from '../../../../lib/progress.js';

  /**
   * @type {{
   *   actions?: Array<import('$lib/types').MicroAction & Record<string, unknown>>,
   *   currentIndex?: number,
   *   isStarted?: boolean,
   *   justCompleted?: boolean,
   *   partnerReturnPromptVisible?: boolean,
   *   soundMuted?: boolean,
   *   copiedDirectLink?: boolean,
   *   savedValues?: string[],
   *   usePersonalValues?: boolean,
   *   variant?: 'instant' | 'directory' | 'compact',
   *   ignoreClosedSession?: boolean,
   *   announceChanges?: boolean,
   *   idleLure?: boolean,
   *   onStart?: ((action: import('$lib/types').MicroAction) => void) | null,
   *   onComplete?: ((action: import('$lib/types').MicroAction) => void) | null,
   *   onShare?: ((action: import('$lib/types').MicroAction) => void) | null,
   *   onReportBroken?: ((action: import('$lib/types').MicroAction) => void) | null,
   *   onToggleSound?: (() => void) | null,
   *   onTogglePersonalValues?: (() => void) | null,
   *   onNextIdea?: (() => void) | null,
   *   onPrevIdea?: (() => void) | null,
   *   onCloseSession?: (() => void) | null,
   *   onReopenSession?: (() => void) | null,
   *   onExitDeepLink?: (() => void) | null
   * }}
   */
  let {
    actions = [],
    currentIndex = $bindable(0),
    isStarted = false,
    justCompleted = false,
    partnerReturnPromptVisible = false,
    soundMuted = false,
    copiedDirectLink = false,
    savedValues = [],
    usePersonalValues = false,
    variant = 'instant',
    ignoreClosedSession = false,
    announceChanges = true,
    idleLure = true,
    onStart = null,
    onComplete = null,
    onShare = null,
    onReportBroken = null,
    onToggleSound = null,
    onTogglePersonalValues = null,
    onNextIdea = null,
    onPrevIdea = null,
    onCloseSession = null,
    onReopenSession = null,
    onExitDeepLink = null
  } = $props();

  let isSessionClosed = $state(false);
  let dragX = $state(0);
  let isDragging = $state(false);
  let isHorizontalGesture = $state(false);
  let suppressNextClick = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let suppressClickTimer = null;
  let startX = 0;
  let startY = 0;
  let startTime = 0;

  const showClosedSummary = $derived(isSessionClosed && !ignoreClosedSession);
  const todayCount = $derived($todayCompletedCount ?? 0);

  const currentAction = $derived(
    actions && actions.length > 0
      ? actions[((currentIndex % actions.length) + actions.length) % actions.length]
      : null
  );

  const totalCards = $derived(actions ? actions.length : 0);
  const displayIndex = $derived(
    totalCards > 0 ? ((currentIndex % totalCards) + totalCards) % totalCards : 0
  );

  onMount(() => {
    if (isDayClosedToday()) {
      isSessionClosed = true;
    }
  });

  function handleCloseSession() {
    isSessionClosed = true;
    try {
      const todayKey = getTodayKey();
      safeSetItem(`${DONE_FOR_TODAY_PREFIX}${todayKey}`, '1', 'local');
      safeVibrate(40);
      playCelebrationChord();
    } catch {}
    trackEvent('aa_session_closed', {
      completedToday: todayCount
    });
    if (onCloseSession) onCloseSession();
  }

  function handleReopenSession() {
    isSessionClosed = false;
    try {
      const todayKey = getTodayKey();
      safeSetItem(`${DONE_FOR_TODAY_PREFIX}${todayKey}`, '0', 'local');
    } catch {}
    trackEvent('aa_session_reopened', {});
    if (onReopenSession) onReopenSession();
  }

  export function nextCard() {
    dragX = 0;
    isDragging = false;
    isHorizontalGesture = false;
    if (onNextIdea) {
      onNextIdea();
    } else if (totalCards > 0) {
      currentIndex = (currentIndex + 1) % totalCards;
    }
  }

  export function prevCard() {
    dragX = 0;
    isDragging = false;
    isHorizontalGesture = false;
    if (onPrevIdea) {
      onPrevIdea();
    } else if (totalCards > 0) {
      currentIndex = (currentIndex - 1 + totalCards) % totalCards;
    }
  }

  /** @param {PointerEvent} e */
  function handlePointerDown(e) {
    if (showClosedSummary || !currentAction) return;
    if (e.button && e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    startTime = Date.now();
    isDragging = true;
    isHorizontalGesture = false;
    dragX = 0;
  }

  /** @param {PointerEvent} e */
  function handlePointerMove(e) {
    if (!isDragging) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      handlePointerUp();
      return;
    }
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!isHorizontalGesture) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) + 5) {
        isHorizontalGesture = true;
      } else if (Math.abs(dy) > 10) {
        // Vertical scroll intent detected; release horizontal drag
        isDragging = false;
        return;
      }
    }

    if (isHorizontalGesture) {
      // Apply elastic damping on excessive drag
      const damp = Math.sign(dx) * Math.min(Math.abs(dx), 160 + Math.abs(dx) * 0.2);
      dragX = damp;
    }
  }

  function handlePointerUp() {
    if (!isDragging) return;
    isDragging = false;
    if (isHorizontalGesture) {
      suppressNextClick = true;
      if (suppressClickTimer) clearTimeout(suppressClickTimer);
      suppressClickTimer = setTimeout(() => {
        suppressNextClick = false;
      }, 120);

      const dt = Math.max(1, Date.now() - startTime);
      const velocity = Math.abs(dragX) / dt;
      if (dragX < -55 || (dragX < -25 && velocity > 0.3)) {
        nextCard();
      } else if (dragX > 55 || (dragX > 25 && velocity > 0.3)) {
        prevCard();
      }
    }
    dragX = 0;
    isHorizontalGesture = false;
  }

  function handlePointerCancel() {
    isDragging = false;
    dragX = 0;
    isHorizontalGesture = false;
  }

  /** @param {MouseEvent} e */
  function handleWrapperClickCapture(e) {
    if (suppressNextClick) {
      suppressNextClick = false;
      if (suppressClickTimer) clearTimeout(suppressClickTimer);
      e.preventDefault();
      e.stopPropagation();
    }
  }

  onDestroy(() => {
    if (suppressClickTimer) clearTimeout(suppressClickTimer);
  });
</script>

<svelte:window onpointerup={handlePointerUp} onpointercancel={handlePointerCancel} />

<div class="swipe-deck-stage" class:session-closed={showClosedSummary}>
  {#if showClosedSummary}
    <!-- =====================================================================
         PSYCHOLOGICAL SESSION CLOSURE ("PRO DNEŠEK HOTOVO")
         ===================================================================== -->
    <div
      class="session-closed-card card"
      role="status"
      aria-live="polite"
    >
      <div class="closed-icon" aria-hidden="true">
        <AppIcon name="leaf" size={28} strokeWidth={1.9} />
      </div>
      <h2 class="closed-title">Pro dnešek máš hotovo.</h2>
      <p class="closed-desc">
        Svět je díky tobě o kousek lepším místem. Můžeš s čistým svědomím odložit telefon a věnovat se svému dni bez pocitu dluhu.
      </p>

      <div class="closed-stats-pill">
        <span class="live-dot" aria-hidden="true"></span>
        <span>Dnes splněno: <strong>{todayCount} {todayCount === 1 ? 'skutek' : todayCount < 5 ? 'skutky' : 'skutků'}</strong></span>
      </div>

      <div class="closed-actions">
        <button
          type="button"
          class="closed-btn closed-btn-reopen"
          onclick={handleReopenSession}
          aria-label="Chci udělat ještě jeden dobrý skutek"
        >
          <AppIcon name="sparkles" size={15} strokeWidth={2} />
          <span>Chci ještě jeden skutek</span>
        </button>
      </div>
    </div>
  {:else}
    <!-- =====================================================================
         MICRO-DEED SWIPE DECK WITH ACCESSIBLE 44x44 NAVIGATION
         ===================================================================== -->
    <div class="deck-container">
      {#if ignoreClosedSession && isSessionClosed}
        <div class="deeplink-exit-row">
          <button
            type="button"
            class="deeplink-exit-btn"
            onclick={() => onExitDeepLink?.()}
          >
            <AppIcon name="arrow-left" size={14} strokeWidth={2.1} />
            <span>Zpět k dnešnímu shrnutí</span>
          </button>
        </div>
      {/if}

      <!-- Gesture Card Shell -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="swipe-card-wrapper"
        style="touch-action: pan-y; transform: translate3d({dragX}px, 0, 0) rotate({dragX * 0.045}deg); transition: {isHorizontalGesture ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)'};"
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointercancel={handlePointerCancel}
        ondragstart={(e) => e.preventDefault()}
        onclickcapture={handleWrapperClickCapture}
      >
        {#if currentAction}
          {#key currentAction.id}
            <ActionCard
              action={currentAction}
              {isStarted}
              {justCompleted}
              {partnerReturnPromptVisible}
              {soundMuted}
              {copiedDirectLink}
              {savedValues}
              {usePersonalValues}
              {variant}
              {idleLure}
              {onStart}
              {onComplete}
              {onShare}
              {onReportBroken}
              {onToggleSound}
              {onTogglePersonalValues}
              onNextIdea={nextCard}
              onCloseSession={handleCloseSession}
            />
          {/key}
        {/if}
      </div>

      <div class="deck-header-bar">
        <button
          type="button"
          class="deck-nav-btn deck-nav-prev"
          onclick={prevCard}
          disabled={totalCards <= 1}
          aria-label="Předchozí doporučený skutek"
          title="Předchozí tip (vlevo)"
        >
          <AppIcon name="chevron-left" size={18} strokeWidth={2.3} />
        </button>

        <div class="deck-indicator" aria-live={announceChanges ? 'polite' : 'off'}>
          <span class="deck-step-text">
            <span class="deck-step-num deck-step-current">{displayIndex + 1}</span>
            /
            <span class="deck-step-num deck-step-total">{totalCards || 1}</span>
          </span>
          <span class="deck-dot-sep" aria-hidden="true">·</span>
          <span class="deck-swipe-hint">
            <AppIcon name="arrow-left" size={12} strokeWidth={2.1} />
            <span>potáhni</span>
            <AppIcon name="arrow-right" size={12} strokeWidth={2.1} />
          </span>
        </div>

        <button
          type="button"
          class="deck-nav-btn deck-nav-next"
          onclick={nextCard}
          disabled={totalCards <= 1}
          aria-label="Další doporučený skutek"
          title="Další tip (vpravo)"
        >
          <AppIcon name="chevron-right" size={18} strokeWidth={2.3} />
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .swipe-deck-stage {
    width: 100%;
    position: relative;
    box-sizing: border-box;
  }

  .deck-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .deeplink-exit-row {
    display: flex;
    justify-content: flex-start;
  }

  .deeplink-exit-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    box-sizing: border-box;
    transition: background-color 0.16s ease, border-color 0.16s ease;
  }

  .deeplink-exit-btn:hover {
    background: var(--bg-surface, #ffffff);
    border-color: var(--accent-primary, #1b5e42);
  }

  .deck-header-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.85rem;
    padding: 0.42rem 0 0;
    margin-top: 0.08rem;
    border-top: 1px solid var(--border-subtle, #dce3dd);
    box-sizing: border-box;
  }

  .deck-nav-btn {
    appearance: none;
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    min-width: 44px;
    min-height: 44px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease,
      transform 0.14s ease;
  }

  .deck-nav-btn:hover:not(:disabled) {
    background: var(--accent-primary, #1b5e42);
    border-color: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  .deck-nav-btn:active:not(:disabled) {
    transform: scale(0.96);
  }

  .deck-nav-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    border-color: transparent;
  }

  .deck-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    padding: 0.28rem 0.72rem;
    border-radius: 999px;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    user-select: none;
  }

  .deck-step-text {
    font-size: 0.8rem;
    font-weight: 800;
    color: var(--ink-primary, #14281d);
    letter-spacing: 0.03em;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  /* Obě čísla mají vyhrazené místo na dvě cifry a lomítko mezi nimi stojí na místě:
     když se mění počet karet v balíčku, počítadlo ani šipky vedle něj se nepohnou. */
  .deck-step-num {
    display: inline-block;
    min-width: 2ch;
  }

  .deck-step-current {
    text-align: right;
  }

  .deck-step-total {
    text-align: left;
  }

  .deck-dot-sep {
    color: var(--ink-muted, #61786b);
    font-weight: 700;
  }

  .deck-swipe-hint {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--ink-secondary, #3f574a);
    letter-spacing: 0.01em;
  }

  .swipe-card-wrapper {
    position: relative;
    width: 100%;
    will-change: transform;
    user-select: none;
  }

  /* =========================================================================
     SESSION CLOSED CARD ("PRO DNEŠEK HOTOVO")
     ========================================================================= */
  .session-closed-card {
    position: relative;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 20px;
    padding: 2rem 1.4rem;
    text-align: center;
    box-shadow: var(--shadow-md, 0 8px 20px -6px rgba(18, 42, 30, 0.08));
    overflow: hidden;
    animation: fadeInScale 0.3s ease-out;
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.98);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .closed-icon {
    width: 54px;
    height: 54px;
    margin: 0 auto 0.75rem;
    border-radius: 50%;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    color: var(--accent-primary, #1b5e42);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .closed-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--ink-primary, #14281d);
    margin: 0 0 0.6rem;
    letter-spacing: -0.02em;
  }

  .closed-desc {
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--ink-secondary, #3f574a);
    max-width: 360px;
    margin: 0 auto 1.25rem;
  }

  .closed-stats-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.48rem;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    padding: 0.38rem 0.88rem;
    border-radius: 999px;
    font-size: 0.86rem;
    color: var(--ink-primary, #14281d);
    margin-bottom: 1.25rem;
  }

  .closed-stats-pill .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-primary, #1b5e42);
    flex-shrink: 0;
  }

  .closed-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }

  .closed-btn {
    appearance: none;
    border: 1px solid var(--accent-primary, #1b5e42);
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-family: inherit;
    font-size: 0.92rem;
    font-weight: 700;
    padding: 0.65rem 1.35rem;
    border-radius: 999px;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.42rem;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .closed-btn:hover {
    background: var(--accent-primary-hover, #144732);
    border-color: var(--accent-primary-hover, #144732);
  }

  @media (hover: hover) and (pointer: fine) {
    .deck-dot-sep,
    .deck-swipe-hint {
      display: none;
    }
  }

  @media (max-width: 680px) {
    .deck-container {
      gap: 0.24rem;
    }

    .deck-header-bar {
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.28rem 0.06rem 0;
      margin-top: 0.04rem;
    }
  }
</style>
