<script>
  import { onMount } from 'svelte';
  import ActionCard from './ActionCard.svelte';
  import { safeGetItem, safeSetItem } from '../../../../lib/utils.js';
  import { trackEvent } from '../../../../lib/analytics.js';
  import { safeVibrate } from '../../../../lib/core/device.js';
  import { playCelebrationChord } from '../../../../lib/audio/presets.js';
  import { completedSteps } from '../../../../lib/progress.js';

  export let actions = [];
  export let currentIndex = 0;
  export let isStarted = false;
  export let justCompleted = false;
  export let partnerReturnPromptVisible = false;
  export let ambientPulse = null;
  export let soundMuted = false;
  export let showEffectPreview = true;
  export let copiedDirectLink = false;
  export let savedValues = [];
  export let usePersonalValues = false;
  export let variant = 'instant';

  export let onStart = null;
  export let onComplete = null;
  export let onShare = null;
  export let onReportBroken = null;
  export let onToggleSound = null;
  export let onTogglePersonalValues = null;
  export let onNextIdea = null;
  export let onPrevIdea = null;
  export let onCloseSession = null;
  export let onReopenSession = null;

  let isSessionClosed = false;
  let dragX = 0;
  let isDragging = false;
  let isHorizontalGesture = false;
  let startX = 0;
  let startY = 0;
  let startTime = 0;

  const getTodayKey = () => new Date().toISOString().slice(0, 10);

  $: todayCount = $completedSteps
    ? Object.keys($completedSteps).length
    : 0;

  $: currentAction = actions && actions.length > 0
    ? actions[((currentIndex % actions.length) + actions.length) % actions.length]
    : null;

  $: totalCards = actions ? actions.length : 0;
  $: displayIndex = totalCards > 0
    ? ((currentIndex % totalCards) + totalCards) % totalCards
    : 0;

  onMount(() => {
    try {
      const todayKey = getTodayKey();
      if (safeGetItem(`aa_done_for_today_${todayKey}`, 'local') === '1') {
        isSessionClosed = true;
      }
    } catch {}
  });

  function handleCloseSession() {
    isSessionClosed = true;
    try {
      const todayKey = getTodayKey();
      safeSetItem(`aa_done_for_today_${todayKey}`, '1', 'local');
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
      safeSetItem(`aa_done_for_today_${todayKey}`, '0', 'local');
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

  function handlePointerDown(e) {
    if (isSessionClosed || !currentAction) return;
    startX = e.clientX;
    startY = e.clientY;
    startTime = Date.now();
    isDragging = true;
    isHorizontalGesture = false;
    dragX = 0;
  }

  function handlePointerMove(e) {
    if (!isDragging) return;
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
</script>

<div class="swipe-deck-stage" class:session-closed={isSessionClosed}>
  {#if isSessionClosed}
    <!-- =====================================================================
         PSYCHOLOGICAL SESSION CLOSURE ("PRO DNEŠEK HOTOVO")
         ===================================================================== -->
    <div
      class="session-closed-card card"
      role="status"
      aria-live="polite"
    >
      <div class="closed-glow" aria-hidden="true"></div>
      <div class="closed-icon" aria-hidden="true">🌿</div>
      <h2 class="closed-title">Pro dnešek máš hotovo.</h2>
      <p class="closed-desc">
        Udělal/a jsi svět o kousek lepším místem. Můžeš s čistým svědomím odložit telefon a věnovat se svému dni bez pocitu dluhu.
      </p>

      <div class="closed-stats-pill">
        <span class="live-dot" aria-hidden="true"></span>
        <span>Dnes splněno: <strong>{todayCount} {todayCount === 1 ? 'skutek' : todayCount < 5 ? 'skutky' : 'skutků'}</strong></span>
      </div>

      <div class="closed-actions">
        <button
          type="button"
          class="closed-btn closed-btn-reopen"
          on:click={handleReopenSession}
          aria-label="Chci udělat ještě jeden dobrý skutek"
        >
          ✨ Chci ještě jeden skutek
        </button>
      </div>
    </div>
  {:else}
    <!-- =====================================================================
         MICRO-DEED SWIPE DECK WITH ACCESSIBLE 44x44 NAVIGATION
         ===================================================================== -->
    <div class="deck-container">
      <div class="deck-header-bar">
        <button
          type="button"
          class="deck-nav-btn deck-nav-prev"
          on:click={prevCard}
          disabled={totalCards <= 1}
          aria-label="Předchozí doporučený skutek"
          title="Předchozí tip (vlevo)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div class="deck-indicator" aria-live="polite">
          <span class="deck-step-text">{displayIndex + 1} / {totalCards || 1}</span>
          <span class="deck-swipe-hint">← potáhni →</span>
        </div>

        <button
          type="button"
          class="deck-nav-btn deck-nav-next"
          on:click={nextCard}
          disabled={totalCards <= 1}
          aria-label="Další doporučený skutek"
          title="Další tip (vpravo)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <!-- Gesture Card Shell -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="swipe-card-wrapper"
        style="touch-action: pan-y; transform: translate3d({dragX}px, 0, 0) rotate({dragX * 0.045}deg); transition: {isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)'};"
        on:pointerdown={handlePointerDown}
        on:pointermove={handlePointerMove}
        on:pointerup={handlePointerUp}
        on:pointercancel={handlePointerCancel}
      >
        {#if currentAction}
          <ActionCard
            action={currentAction}
            {isStarted}
            {justCompleted}
            {partnerReturnPromptVisible}
            {ambientPulse}
            {soundMuted}
            {showEffectPreview}
            {copiedDirectLink}
            {savedValues}
            {usePersonalValues}
            {variant}
            {onStart}
            {onComplete}
            {onShare}
            {onReportBroken}
            {onToggleSound}
            {onTogglePersonalValues}
            onNextIdea={nextCard}
            onCloseSession={handleCloseSession}
          />
        {/if}
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
    gap: 0.5rem;
  }

  .deck-header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.25rem 0.35rem;
    box-sizing: border-box;
  }

  .deck-nav-btn {
    appearance: none;
    border: 1px solid rgba(13, 46, 32, 0.16);
    background: #eef5f0;
    color: #0d2e20;
    min-width: 44px;
    min-height: 44px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(9, 29, 20, 0.08);
  }

  .deck-nav-btn:hover:not(:disabled) {
    background: #0d2e20;
    border-color: #0d2e20;
    color: #ffffff;
  }

  .deck-nav-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    border-color: transparent;
  }

  .deck-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.08rem;
    user-select: none;
  }

  .deck-step-text {
    font-size: 0.84rem;
    font-weight: 800;
    color: #0d2e20;
    letter-spacing: 0.04em;
  }

  .deck-swipe-hint {
    font-size: 0.68rem;
    font-weight: 600;
    color: #2f5e49;
    letter-spacing: 0.02em;
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
    background: linear-gradient(180deg, rgba(6, 40, 28, 0.96) 0%, rgba(4, 24, 17, 0.98) 100%);
    border: 1px solid rgba(52, 211, 153, 0.35);
    border-radius: 20px;
    padding: 2.2rem 1.4rem;
    text-align: center;
    box-shadow: 0 16px 38px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(12px);
    overflow: hidden;
    animation: fadeInScale 0.35s ease-out;
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .closed-glow {
    position: absolute;
    top: -30%;
    left: 20%;
    right: 20%;
    height: 60%;
    background: radial-gradient(circle, rgba(52, 211, 153, 0.22) 0%, transparent 70%);
    pointer-events: none;
  }

  .closed-icon {
    font-size: 2.8rem;
    margin-bottom: 0.75rem;
    filter: drop-shadow(0 4px 12px rgba(52, 211, 153, 0.4));
  }

  .closed-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 0.65rem;
    letter-spacing: -0.02em;
  }

  .closed-desc {
    font-size: 0.98rem;
    line-height: 1.55;
    color: #e6f5ec;
    max-width: 360px;
    margin: 0 auto 1.4rem;
  }

  .closed-stats-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(52, 211, 153, 0.3);
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    font-size: 0.88rem;
    color: #a7f3d0;
    margin-bottom: 1.4rem;
  }

  .closed-stats-pill .live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 8px #34d399;
  }

  .closed-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }

  .closed-btn {
    appearance: none;
    border: 1px solid rgba(52, 211, 153, 0.35);
    background: rgba(16, 185, 129, 0.18);
    color: #a7f3d0;
    font-family: inherit;
    font-size: 0.92rem;
    font-weight: 700;
    padding: 0.65rem 1.4rem;
    border-radius: 999px;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .closed-btn:hover {
    background: rgba(16, 185, 129, 0.32);
    border-color: rgba(52, 211, 153, 0.6);
    color: #ffffff;
  }

  @media (max-width: 680px) {
    .deck-container {
      gap: 0.22rem;
    }

    .deck-header-bar {
      padding: 0 0.15rem 0.05rem;
    }
  }
</style>
