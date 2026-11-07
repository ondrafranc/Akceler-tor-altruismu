<script>
  import { onDestroy } from 'svelte';

  let isOpen = false;
  let feedback = '';
  let rating = 0;
  let isSubmitting = false;
  let statusMessage = '';
  let statusType = '';
  let closeTimer = null;

  $: isFormValid = feedback.trim().length > 0;

  const ratingLabels = {
    1: 'Nepomohlo',
    2: 'Trochu pomohlo',
    3: 'Pomohlo',
    4: 'Hodně pomohlo',
    5: 'Skvělé, přesně to jsem potřeboval/a'
  };

  function openModal() {
    isOpen = true;
    statusMessage = '';
    statusType = '';
  }

  function closeModal() {
    isOpen = false;
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
      const resp = await fetch('/api/test-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_text: feedback.trim(),
          rating: rating || undefined
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
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
        <h2 id="fb-title">💬 Zpětná vazba</h2>
        <button type="button" class="close-btn" on:click={closeModal} aria-label="Zavřít">✕</button>
      </div>

      <p class="modal-sub">
        Chybí ti tu nějaká organizace, něco nefunguje nebo máš nápad na zlepšení? Napiš nám anonymně pár slov.
      </p>

      <form on:submit|preventDefault={handleSubmit} class="fb-form">
        <label class="field-label" for="fb-textarea">Tvůj vzkaz</label>
        <textarea
          id="fb-textarea"
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
                ★
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
    bottom: 14px;
    left: 14px;
    z-index: 90;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.85rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 82, 56, 0.16);
    background: rgba(253, 255, 253, 0.94);
    color: #143324;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    box-shadow: 0 10px 24px -8px rgba(12, 38, 26, 0.18);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    transition: all 0.18s ease;
  }

  .feedback-pill:hover {
    background: #ffffff;
    border-color: rgba(5, 150, 105, 0.38);
    color: #065f46;
    transform: translateY(-1px);
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(20, 32, 21, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .modal-card {
    width: 100%;
    max-width: 460px;
    background: white;
    border-radius: 20px;
    border: 1px solid rgba(44, 62, 45, 0.15);
    padding: 1.35rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  }

  .modal-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }

  .modal-head h2 {
    margin: 0;
    font-family: 'Inter', sans-serif;
    font-size: 1.25rem;
    color: var(--czech-forest);
  }

  .close-btn {
    border: none;
    background: rgba(242, 247, 242, 0.9);
    width: 30px;
    height: 30px;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 800;
    color: var(--text-secondary);
  }

  .modal-sub {
    margin: 0 0 1rem 0;
    color: var(--text-secondary);
    font-size: 0.92rem;
    line-height: 1.45;
  }

  .fb-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .field-label {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--czech-forest);
  }

  textarea {
    width: 100%;
    padding: 0.65rem 0.75rem;
    border-radius: 12px;
    border: 1px solid rgba(44, 62, 45, 0.2);
    font-family: inherit;
    font-size: 0.94rem;
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
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .star-btn {
    border: none;
    background: none;
    font-size: 1.45rem;
    color: #d1d5db;
    cursor: pointer;
    padding: 0 0.15rem;
    line-height: 1;
  }

  .star-btn.active {
    color: #f59e0b;
  }

  .rating-text {
    font-size: 0.84rem;
    color: var(--text-secondary);
    margin-left: 0.35rem;
    font-weight: 600;
  }

  .status-box {
    padding: 0.6rem 0.75rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
  }
  .status-box.success {
    background: rgba(236, 253, 245, 0.9);
    color: #065f46;
  }
  .status-box.error {
    background: rgba(254, 242, 242, 0.9);
    color: #991b1b;
  }

  .submit-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    border: none;
    background: var(--czech-forest);
    color: white;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
  }
  .submit-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 520px) {
    .fb-label {
      display: none;
    }
    .feedback-pill {
      padding: 0.5rem 0.65rem;
    }
  }
</style>
