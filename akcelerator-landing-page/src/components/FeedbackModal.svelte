<script context="module">
  import { openBrokenLinkReport as _openBrokenLinkReport } from '../lib/analytics.js';
  export const openBrokenLinkReport = _openBrokenLinkReport;
</script>

<script>
  import { onMount, onDestroy } from 'svelte';
  import { feedbackReportRequest } from '../lib/analytics.js';
  import AppIcon from '$lib/components/AppIcon.svelte';
  import {
    cleanTitle,
    isFeedbackOpen,
    feedbackPrefill,
    openFeedbackModal,
    closeFeedbackModal
  } from '../lib/utils.js';

  let modalTitle = 'Zpětná vazba';
  let feedback = '';
  let rating = 0;
  let isSubmitting = false;
  let statusMessage = '';
  let statusType = '';
  let closeTimer = null;

  $: isOpen = $isFeedbackOpen;

  $: if ($feedbackPrefill) {
    const prefillVal = $feedbackPrefill;
    if (typeof prefillVal === 'string') {
      modalTitle = 'Nahlásit nefunkční údaj';
      feedback = prefillVal;
    } else if (typeof prefillVal === 'object' && prefillVal !== null) {
      modalTitle = cleanTitle(prefillVal.title || '') || 'Zpětná vazba';
      if (prefillVal.prefill) {
        feedback = prefillVal.prefill;
      }
    }
    statusMessage = '';
    statusType = '';
    feedbackPrefill.set('');
  }

  $: if ($feedbackReportRequest?.open) {
    openFeedbackModal({
      title: cleanTitle($feedbackReportRequest.title || '') || 'Nahlásit nefunkční údaj',
      prefill: $feedbackReportRequest.prefill || ''
    });
    feedbackReportRequest.set(null);
  }

  $: isFormValid = feedback.trim().length > 0;

  const ratingLabels = {
    1: 'Nepomohlo',
    2: 'Trochu pomohlo',
    3: 'Pomohlo',
    4: 'Hodně pomohlo',
    5: 'Skvělé, přesně tohle se mi hodilo'
  };

  function openModal() {
    openFeedbackModal({ title: 'Zpětná vazba' });
  }

  function closeModal() {
    closeFeedbackModal();
    statusMessage = '';
    statusType = '';
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && isOpen) {
      closeModal();
    }
  }

  async function handleSubmit() {
    if (!isFormValid || isSubmitting) return;
    isSubmitting = true;
    statusMessage = '';

    try {
      const resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_text: feedback.trim(),
          rating: rating || undefined,
          page_url: typeof window !== 'undefined' ? window.location.pathname : '/'
        })
      });
      const data = await resp.json().catch(() => ({}));

      if (resp.ok && data?.success) {
        statusType = 'success';
        statusMessage = 'Děkujeme! Tvoje zpětná vazba nám pomůže web dál zlepšovat.';
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          feedback = '';
          rating = 0;
          closeModal();
        }, 1600);
      } else {
        statusType = 'error';
        statusMessage = data?.error || 'Nepodařilo se odeslat zpětnou vazbu. Zkus to prosím později.';
      }
    } catch {
      statusType = 'error';
      statusMessage = 'Nepodařilo se odeslat zpětnou vazbu.';
    } finally {
      isSubmitting = false;
    }
  }

  onMount(() => {
    const handleOpen = () => {
      openModal();
    };
    window.addEventListener('akcelerator:open-feedback', handleOpen);
    return () => {
      window.removeEventListener('akcelerator:open-feedback', handleOpen);
    };
  });

  onDestroy(() => {
    if (closeTimer) clearTimeout(closeTimer);
  });
</script>

<svelte:window on:keydown={handleKeydown} />

<button
  type="button"
  class="feedback-pill"
  on:click={openModal}
  aria-label="Otevřít formulář zpětné vazby"
>
  <AppIcon name="message-circle" size={15} strokeWidth={2} />
  <span class="fb-label">Zpětná vazba</span>
</button>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="fb-title"
    tabindex="-1"
    on:click|self={closeModal}
  >
    <div class="modal-card">
      <div class="modal-head">
        <h2 id="fb-title" class="modal-title">
          <AppIcon name="message-circle" size={20} strokeWidth={2} />
          <span>{modalTitle}</span>
        </h2>
        <button type="button" class="close-btn" on:click={closeModal} aria-label="Zavřít">
          <AppIcon name="x" size={18} strokeWidth={2} />
        </button>
      </div>

      <p class="modal-sub">
        Chybí ti tu nějaká organizace, něco nefunguje nebo máš nápad na zlepšení? Napiš nám anonymně pár slov.
      </p>

      <form on:submit|preventDefault={handleSubmit} class="fb-form">
        <label class="field-label" for="fb-textarea">Tvůj vzkaz</label>
        <textarea
          id="fb-textarea"
          name="feedback_message"
          autocomplete="off"
          bind:value={feedback}
          rows="4"
          maxlength="1000"
          placeholder="Co ti pomohlo, nebo co bychom měli upravit..."
          disabled={isSubmitting}
          required
        ></textarea>

        <div class="rating-block">
          <span class="field-label">Jak užitečný pro tebe web je? (volitelné)</span>
          <div class="stars">
            {#each [1, 2, 3, 4, 5] as s}
              <button
                type="button"
                class="star-btn"
                class:active={rating >= s}
                on:click={() => (rating = s)}
                aria-label={`${s} z 5 hvězd`}
              >
                <AppIcon name="star" size={22} strokeWidth={1.85} />
              </button>
            {/each}
            {#if rating > 0}
              <span class="rating-text">{ratingLabels[rating]}</span>
            {/if}
          </div>
        </div>

        {#if statusMessage}
          <div class={"status-box " + statusType}>{statusMessage}</div>
        {/if}

        <div class="actions">
          <button type="submit" class="submit-btn" disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? 'Odesílám…' : 'Odeslat zpětnou vazbu'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .feedback-pill {
    position: fixed;
    bottom: 66px;
    right: 14px;
    left: auto;
    z-index: 90;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.42rem;
    min-height: 44px;
    box-sizing: border-box;
    padding: 0.45rem 0.85rem;
    border-radius: 999px;
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.78rem;
    cursor: pointer;
    box-shadow: var(--shadow-md, 0 8px 20px -6px rgba(18, 42, 30, 0.08));
    transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  }

  .feedback-pill:hover {
    background: var(--bg-subtle, #edf2ee);
    border-color: var(--accent-primary, #1b5e42);
    color: var(--accent-primary, #1b5e42);
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1050;
    background: rgba(20, 40, 29, 0.52);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .modal-card {
    width: 100%;
    max-width: 460px;
    background: var(--bg-surface, #ffffff);
    border-radius: 20px;
    border: 1px solid var(--border-subtle, #dce3dd);
    padding: 1.35rem;
    box-sizing: border-box;
    box-shadow: var(--shadow-xl, 0 20px 44px -12px rgba(18, 42, 30, 0.16));
  }

  .modal-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.45rem;
  }

  .modal-head h2,
  .modal-title {
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-family: var(--font-sans);
    font-size: 1.2rem;
    color: var(--ink-primary, #14281d);
  }

  .close-btn {
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-subtle, #edf2ee);
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    cursor: pointer;
    color: var(--ink-secondary, #3f574a);
    flex-shrink: 0;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .close-btn:hover {
    background: var(--border-subtle, #dce3dd);
    color: var(--ink-primary, #14281d);
  }

  .modal-sub {
    margin: 0 0 1rem 0;
    color: var(--ink-secondary, #3f574a);
    font-size: 0.92rem;
    line-height: 1.48;
  }

  .fb-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .field-label {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--ink-primary, #14281d);
  }

  textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 0.65rem 0.75rem;
    border-radius: 12px;
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.45;
    resize: vertical;
  }

  .rating-block {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .stars {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .star-btn {
    border: 1px solid transparent;
    background: transparent;
    color: var(--ink-muted, #61786b);
    cursor: pointer;
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border-radius: 10px;
    transition: color 0.15s ease, background-color 0.15s ease;
  }

  .star-btn:hover {
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
  }

  .star-btn.active {
    color: #8f4b0e;
    background: var(--accent-warm-tint, #fef6e8);
    border-color: rgba(143, 75, 14, 0.24);
  }

  .star-btn.active :global(svg) {
    fill: currentColor;
  }

  .rating-text {
    font-size: 0.84rem;
    color: var(--ink-secondary, #3f574a);
    margin-left: 0.35rem;
    font-weight: 600;
  }

  .status-box {
    padding: 0.65rem 0.8rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .status-box.success {
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
  }

  .status-box.error {
    background: #fef2f2;
    color: #991b1b;
  }

  .submit-btn {
    width: 100%;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    border: none;
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--accent-primary-hover, #144732);
  }

  .submit-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 680px) {
    .feedback-pill {
      display: none !important;
    }

    .modal-backdrop {
      align-items: flex-end;
      padding: 0;
    }

    .modal-card {
      max-width: 100%;
      max-height: 85dvh;
      overflow-y: auto;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      padding: 1.15rem 1.15rem max(1.25rem, env(safe-area-inset-bottom, 0px)) 1.15rem;
    }
  }
</style>
