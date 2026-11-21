<script>
  import {
    completedSteps,
    SANCTUARY_ELEMENTS,
    saveStepReflection,
    createProgressBackupCode,
    restoreProgressFromBackupCode
  } from '../../../progress.js';
  import { MICRO_ACTIONS } from '../../../data/czech-actions.js';
  import { cleanTitle } from '../../../utils.js';
  import { trackEvent } from '../../../analytics.js';
  import AppIcon from '$lib/components/AppIcon.svelte';
  import { resolveIconKey } from '$lib/icons/iconRegistry.js';

  /** @typedef {import('$lib/types/progress').CompletedStep} CompletedStep */
  /**
   * @typedef {{
   *   x: number,
   *   y: number,
   *   zone: 'sky' | 'water',
   *   element: string,
   *   lightType?: string
   * }} DashboardLight
   */

  /** @type {DashboardLight[]} */
  export let activeLights = [];
  export let myDeedsCount = 0;
  /** @type {CompletedStep | null} */
  export let latestStep = null;
  export let inAppBrowserDetected = false;

  const ELEMENT_MAP = Object.fromEntries(SANCTUARY_ELEMENTS.map((e) => [e.key, e]));

  let storyDrawerOpen = false;
  let storyMode = 'quiet'; // 'quiet' | 'tip'
  let storyDataUrl = '';
  /** @type {Blob | null} */
  let storyBlob = null;
  let storyBusy = false;
  let storyCopiedMsg = '';

  /** @type {string | null} */
  let editingUid = null;
  let draftNote = '';
  let backupCodeInput = '';
  let backupStatusMsg = '';

  async function refreshStoryPreview() {
    if (typeof window === 'undefined') return;
    storyBusy = true;
    try {
      const { renderStoryCardPng } = await import('../../../storyCard.js');
      const skyStars = (activeLights || [])
        .filter((l) => l.zone === 'sky')
        .slice(0, 16)
        .map((l) => ({
          x: l.x,
          y: l.y,
          color: ELEMENT_MAP[l.element]?.softColor || '#fde68a',
          lightType: l.lightType || 'star'
        }));

      const res = await renderStoryCardPng({
        mode: storyMode,
        actionTitle: latestStep?.title || MICRO_ACTIONS[0]?.title,
        stepsCount: Math.max(1, myDeedsCount),
        healPercent: 100,
        stars: skyStars
      });
      if (
        storyDataUrl &&
        storyDataUrl.startsWith('blob:') &&
        typeof URL !== 'undefined' &&
        typeof URL.revokeObjectURL === 'function'
      ) {
        URL.revokeObjectURL(storyDataUrl);
      }
      storyDataUrl = res.dataUrl;
      storyBlob = res.blob;
    } finally {
      storyBusy = false;
    }
  }

  async function downloadOrShareStory() {
    trackEvent('aa_story_card_share', { mode: storyMode });
    if (!storyBlob) await refreshStoryPreview();
    if (!storyBlob) return;

    const file = new File([storyBlob], 'krajina-dobra.png', { type: 'image/png' });
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Krajina dobra — Akcelerátor altruismu',
          text: 'Jeden malý dobrý skutek dnes stačí.'
        });
        return;
      } catch {}
    }

    const a = document.createElement('a');
    a.href = storyDataUrl;
    a.download = 'krajina-dobra.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    storyCopiedMsg = 'Pohlednice 1080×1920 stažena — můžeš ji poslat dál jako tichou inspiraci.';
    setTimeout(() => (storyCopiedMsg = ''), 4500);
  }

  /**
   * @param {CompletedStep} step
   */
  function startEditNote(step) {
    editingUid = step.uid;
    draftNote = step.note || '';
  }

  /**
   * @param {string} uid
   */
  function saveNote(uid) {
    saveStepReflection(uid, draftNote.trim());
    editingUid = null;
  }

  async function handleCopyBackupCode() {
    const code = createProgressBackupCode();
    if (!code) return;
    backupCodeInput = code;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        backupStatusMsg = 'Záložní kód zkopírován do schránky.';
        return;
      }
    } catch {}
    backupStatusMsg = 'Záložní kód vygenerován v poli níže — zkopíruj si ho.';
  }

  function handleRestoreBackupCode() {
    const ok = restoreProgressFromBackupCode(backupCodeInput);
    if (ok) {
      backupStatusMsg = `Zápisník obnoven (${($completedSteps || []).length} skutků).`;
      backupCodeInput = '';
    } else {
      backupStatusMsg = 'Kód se nepodařilo přečíst. Zkontroluj prosím celé znění.';
    }
  }

  $: if (typeof window !== 'undefined' && storyDrawerOpen && (storyMode || activeLights.length >= 0)) {
    refreshStoryPreview();
  }
</script>

<div class="optional-drawers">
  <details class="calm-drawer" bind:open={storyDrawerOpen}>
    <summary>
      <span class="drawer-summary-label">
        <AppIcon name="image" size={16} strokeWidth={2} />
        <span>Vytvořit si 9:16 pohlednici Krajiny dobra</span>
      </span>
    </summary>
    <div class="drawer-inner story-studio-inner">
      <p class="drawer-note">
        Vytváří se soukromě přímo ve tvém prohlížeči — můžeš si ji uložit nebo poslat dál jako tichou inspiraci.
      </p>
      <div class="story-mode-tabs">
        <button
          type="button"
          class:active={storyMode === 'quiet'}
          on:click={() => (storyMode = 'quiet')}
        >
          <AppIcon name="leaf" size={14} strokeWidth={2} />
          <span>Klidná krajina</span>
        </button>
        <button
          type="button"
          class:active={storyMode === 'tip'}
          on:click={() => (storyMode = 'tip')}
        >
          <AppIcon name="lightbulb" size={14} strokeWidth={2} />
          <span>S tipem na skutek</span>
        </button>
      </div>

      <div class="story-preview-frame">
        {#if storyDataUrl}
          <img src={storyDataUrl} alt="Náhled 9:16 pohlednice Krajiny dobra" class="story-img" />
        {:else}
          <div class="story-loading">Připravuji pohlednici…</div>
        {/if}
      </div>

      <button type="button" class="story-dl-btn" on:click={downloadOrShareStory} disabled={storyBusy}>
        <AppIcon name="download" size={15} strokeWidth={2} />
        <span>{storyBusy ? 'Připravuji…' : 'Stáhnout pohlednici (1080×1920)'}</span>
      </button>
      {#if storyCopiedMsg}
        <p class="story-msg">{storyCopiedMsg}</p>
      {/if}
    </div>
  </details>

  <details class="calm-drawer">
    <summary>
      <span class="drawer-summary-label">
        <AppIcon name="book-open" size={16} strokeWidth={2} />
        <span>Soukromý zápisník mých dobrých skutků ({($completedSteps || []).length})</span>
      </span>
    </summary>
    <div class="drawer-inner">
      <p class="drawer-note">
        Uloženo pouze u tebe v prohlížeči — jako připomenutí chvil, kdy tvoje pomoc někomu nebo něčemu udělala dobře.
      </p>
      {#if ($completedSteps || []).length === 0}
        <p class="empty-journal">
          Zatím tu není žádný záznam. Až splníš svůj první drobný skutek, objeví se tady.
        </p>
      {:else}
        <ul class="journal-list">
          {#each [...$completedSteps].reverse().slice(0, 12) as step (step.uid)}
            {@const meta = ELEMENT_MAP[step.element] || SANCTUARY_ELEMENTS[3]}
            <li class="journal-item">
              <div class="ji-top">
                <span class="ji-title">
                  <AppIcon name={resolveIconKey(meta.icon)} size={14} strokeWidth={2} />
                  <span>{cleanTitle(step.title)}</span>
                </span>
                <span class="ji-date">{new Date(step.timestamp).toLocaleDateString('cs-CZ')}</span>
              </div>
              {#if editingUid === step.uid}
                <div class="ji-edit">
                  <input
                    type="text"
                    name="journal_note"
                    autocomplete="off"
                    bind:value={draftNote}
                    placeholder="Krátká poznámka pro sebe…"
                    maxlength="220"
                  />
                  <button type="button" on:click={() => saveNote(step.uid)}>Uložit</button>
                </div>
              {:else if step.note}
                <p class="ji-note">„{step.note}“</p>
              {:else}
                <button type="button" class="ji-add-note" on:click={() => startEditNote(step)}>
                  <AppIcon name="plus" size={14} strokeWidth={2} />
                  <span>Připsat poznámku</span>
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}

      <div class="backup-box">
        {#if inAppBrowserDetected}
          <p class="inapp-warning">
            <AppIcon name="alert-triangle" size={15} strokeWidth={2} />
            <span>
              Prohlížíš web uvnitř aplikace (Instagram/FB/TikTok), která po zavření maže paměť. Zkopíruj si záložní kód nebo stránku otevři v Safari/Chrome.
            </span>
          </p>
        {/if}
        <div class="backup-actions">
          <button type="button" class="ji-add-note" on:click={handleCopyBackupCode}>
            <AppIcon name="key-round" size={14} strokeWidth={2} />
            <span>Vygenerovat záložní kód zápisníku</span>
          </button>
          <div class="ji-edit">
            <input
              type="text"
              id="backup-code-input"
              name="backup-code"
              autocomplete="off"
              aria-label="Záložní kód pro obnovu zápisníku"
              bind:value={backupCodeInput}
              placeholder="Vložit záložní kód (AA1-…) pro obnovu na jiném zařízení"
            />
            <button type="button" on:click={handleRestoreBackupCode}>Obnovit</button>
          </div>
          {#if backupStatusMsg}
            <p class="story-msg">{backupStatusMsg}</p>
          {/if}
        </div>
      </div>
    </div>
  </details>
</div>

<style>
  .optional-drawers {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .drawer-summary-label {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .drawer-inner {
    margin-top: 1rem;
    padding-top: 0.95rem;
    border-top: 1px solid var(--border-subtle);
  }

  .drawer-note {
    margin: 0 0 0.95rem 0;
    font-size: 0.86rem;
    color: var(--ink-secondary);
    line-height: 1.55;
  }

  .story-studio-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .story-mode-tabs {
    display: inline-flex;
    gap: 0.4rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .story-mode-tabs button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.5rem 0.95rem;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: var(--bg-surface);
    color: var(--ink-secondary);
    font-family: inherit;
    font-weight: 700;
    font-size: 0.83rem;
    cursor: pointer;
    transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
  }

  .story-mode-tabs button:hover {
    border-color: var(--accent-primary);
    color: var(--ink-primary);
  }

  .story-mode-tabs button.active {
    background: var(--accent-primary);
    color: #ffffff;
    border-color: var(--accent-primary);
  }

  .story-preview-frame {
    width: 220px;
    aspect-ratio: 9 / 16;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-strong);
    margin-bottom: 0.95rem;
    background: var(--ink-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .story-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .story-loading {
    color: rgba(246, 247, 243, 0.85);
    font-size: 0.82rem;
    padding: 1rem;
  }

  .story-dl-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.42rem;
    min-height: 44px;
    min-width: 44px;
    border: none;
    border-radius: 999px;
    padding: 0.68rem 1.35rem;
    background: var(--accent-primary);
    color: #ffffff;
    font-family: inherit;
    font-weight: 700;
    font-size: 0.86rem;
    cursor: pointer;
    transition: background-color 0.16s ease;
  }

  .story-dl-btn:hover:not(:disabled) {
    background: var(--accent-primary-hover);
  }

  .story-msg {
    margin: 0.6rem 0 0;
    font-size: 0.84rem;
    color: var(--accent-primary);
    font-weight: 600;
  }

  .empty-journal {
    margin: 0;
    font-size: 0.86rem;
    color: var(--ink-muted);
  }

  .journal-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }

  .journal-item {
    padding: 0.78rem 0.95rem;
    border-radius: 14px;
    background: var(--bg-canvas);
    border: 1px solid var(--border-subtle);
  }

  .ji-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .ji-title {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    font-weight: 700;
    font-size: 0.88rem;
    color: var(--ink-primary);
  }

  .ji-date {
    font-size: 0.76rem;
    color: var(--ink-secondary, #3f574a);
  }

  .ji-note {
    margin: 0.35rem 0 0;
    font-size: 0.82rem;
    color: var(--ink-secondary);
    font-style: italic;
  }

  .ji-add-note {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    margin-top: 0.35rem;
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    background: var(--bg-subtle);
    color: var(--accent-primary);
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.45rem 0.8rem;
    transition: background-color 0.16s ease, border-color 0.16s ease;
  }

  .ji-add-note:hover {
    background: var(--bg-surface);
    border-color: var(--accent-primary);
  }

  .ji-edit {
    margin-top: 0.45rem;
    display: flex;
    gap: 0.45rem;
    align-items: center;
  }

  .ji-edit input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: 0.48rem 0.75rem;
    border-radius: 10px;
    border: 1px solid var(--border-strong);
    background: var(--bg-surface);
    color: var(--ink-primary);
    font-family: inherit;
    font-size: 0.88rem;
  }

  .ji-edit button {
    min-height: 44px;
    min-width: 44px;
    padding: 0.48rem 0.9rem;
    border-radius: 10px;
    border: none;
    background: var(--accent-primary);
    color: #ffffff;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .ji-edit button:hover {
    background: var(--accent-primary-hover);
  }

  .backup-box {
    margin-top: 1rem;
    padding-top: 0.95rem;
    border-top: 1px solid var(--border-subtle);
  }

  .inapp-warning {
    display: flex;
    align-items: flex-start;
    gap: 0.45rem;
    margin: 0 0 0.8rem 0;
    padding: 0.7rem 0.9rem;
    border-radius: 12px;
    background: var(--accent-warm-tint);
    border: 1px solid rgba(184, 101, 27, 0.35);
    color: var(--ink-primary);
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .backup-actions {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  @media (max-width: 1024px) {
    .ji-edit input {
      font-size: 1rem;
    }
  }

  @media (max-width: 680px) {
    .ji-edit {
      flex-wrap: wrap;
    }

    .ji-edit input {
      width: 100%;
      font-size: 1rem;
      min-height: 44px;
      box-sizing: border-box;
    }

    .ji-edit button {
      min-height: 44px;
    }
  }
</style>
