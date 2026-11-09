<script>
  import { buildFirstContactTemplate } from '../../../data/czech-actions.js';

  export let place = null;
  export let isOpen = false;
  export let copied = false;
  export let onCopy = null;
  export let onClose = null;

  $: tpl = place ? buildFirstContactTemplate(place) : null;

  function handleKeydown(e) {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && place && tpl}
  <div
    class="modal-overlay"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="contact-modal-title"
    on:click|self={onClose}
    on:keydown|self={handleKeydown}
  >
    <div class="modal-card">
      <div class="modal-header">
        <h3 id="contact-modal-title">💬 Vzor první zprávy pro {place.name}</h3>
        <button
          type="button"
          class="modal-close-btn"
          aria-label="Zavřít"
          on:click={onClose}
        >
          ✕
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-lead">
          Krátká, uctivá a konkrétní zpráva připravená k odeslání e-mailem nebo přes formulář:
        </p>

        <pre class="template-pre">{tpl.body}</pre>

        <div class="modal-contacts">
          {#if place.phone}
            <div class="contact-line">
              <span>Telefon:</span>
              <a href={`tel:${place.phone.replace(/[^\d+]/g, '')}`}>{place.phone}</a>
            </div>
          {/if}
          {#if place.email}
            <div class="contact-line">
              <span>E-mail:</span>
              <a href={`mailto:${place.email}`}>{place.email}</a>
            </div>
          {/if}
        </div>
      </div>

      <div class="modal-actions">
        <button
          type="button"
          class="pc-btn primary"
          on:click={() => onCopy && onCopy(place)}
        >
          {copied ? '✓ Zkopírováno do schránky' : '📋 Zkopírovat zprávu'}
        </button>

        {#if tpl.mailtoUrl}
          <a href={tpl.mailtoUrl} class="pc-btn ghost">✉️ Otevřít e-mail</a>
        {/if}

        <button type="button" class="pc-btn ghost" on:click={onClose}>
          Zavřít
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .modal-card {
    background: #ffffff;
    border-radius: 1.25rem;
    max-width: 540px;
    width: 100%;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(16, 185, 129, 0.2);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.15rem 1.4rem;
    background: #f8fafc;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.08rem;
    font-weight: 700;
    color: var(--text-heading, #1f2937);
  }

  .modal-close-btn {
    border: none;
    background: transparent;
    font-size: 1.1rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
  }

  .modal-close-btn:hover {
    color: #111827;
    background: rgba(0, 0, 0, 0.05);
  }

  .modal-body {
    padding: 1.25rem 1.4rem;
  }

  .modal-lead {
    font-size: 0.88rem;
    color: var(--text-muted, #4b5563);
    margin: 0 0 0.85rem 0;
  }

  .template-pre {
    background: #f1f5f9;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 0.75rem;
    padding: 1rem;
    font-family: inherit;
    font-size: 0.88rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    color: #1e293b;
    margin: 0 0 1rem 0;
    max-height: 220px;
    overflow-y: auto;
  }

  .modal-contacts {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.84rem;
  }

  .contact-line {
    display: flex;
    gap: 0.5rem;
  }

  .contact-line a {
    color: #059669;
    font-weight: 600;
    text-decoration: underline;
  }

  .modal-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.65rem;
    padding: 1rem 1.4rem;
    background: #f8fafc;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }

  .pc-btn {
    font-size: 0.86rem;
    font-weight: 600;
    padding: 0.55rem 1rem;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .pc-btn.primary {
    background: #059669;
    color: #ffffff;
  }

  .pc-btn.primary:hover {
    background: #047857;
  }

  .pc-btn.ghost {
    background: #e2e8f0;
    color: #334155;
  }

  .pc-btn.ghost:hover {
    background: #cbd5e1;
  }
</style>
