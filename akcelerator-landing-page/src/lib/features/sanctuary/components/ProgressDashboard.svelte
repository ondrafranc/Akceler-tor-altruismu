<script>
  import {
    completedSteps,
    SANCTUARY_ELEMENTS,
    saveStepReflection,
    createProgressBackupCode,
    restoreProgressFromBackupCode
  } from '../../../progress.js';
  import { MICRO_ACTIONS } from '../../../data/czech-actions.js';
  import { cleanTitle, isInAppBrowser } from '../../../utils.js';
  import { trackEvent } from '../../../analytics.js';

  export let activeLights = [];
  export let myDeedsCount = 0;
  export let latestStep = null;
  export let inAppBrowserDetected = false;

  const ELEMENT_MAP = Object.fromEntries(SANCTUARY_ELEMENTS.map((e) => [e.key, e]));

  let storyDrawerOpen = false;
  let storyMode = 'quiet'; // 'quiet' | 'tip'
  let storyDataUrl = '';
  let storyBlob = null;
  let storyBusy = false;
  let storyCopiedMsg = '';

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

  function startEditNote(step) {
    editingUid = step.uid;
    draftNote = step.note || '';
  }

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
        backupStatusMsg = '✓ Záložní kód zkopírován do schránky.';
        return;
      }
    } catch {}
    backupStatusMsg = 'Záložní kód vygenerován v poli níže — zkopíruj si ho.';
  }

  function handleRestoreBackupCode() {
    const ok = restoreProgressFromBackupCode(backupCodeInput);
    if (ok) {
      backupStatusMsg = `✓ Zápisník obnoven (${($completedSteps || []).length} skutků).`;
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
      <span>🎨 Vytvořit si 9:16 pohlednici Krajiny dobra</span>
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
          🌿 Klidná krajina
        </button>
        <button
          type="button"
          class:active={storyMode === 'tip'}
          on:click={() => (storyMode = 'tip')}
        >
          💡 S tipem na skutek
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
        {storyBusy ? 'Připravuji…' : '↓ Stáhnout pohlednici (1080×1920)'}
      </button>
      {#if storyCopiedMsg}
        <p class="story-msg">{storyCopiedMsg}</p>
      {/if}
    </div>
  </details>

  <details class="calm-drawer">
    <summary>
      <span>📖 Soukromý zápisník mých dobrých skutků ({($completedSteps || []).length})</span>
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
                <span class="ji-title">{meta.icon} {cleanTitle(step.title)}</span>
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
                  + Připsat poznámku
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}

      <div class="backup-box">
        {#if inAppBrowserDetected}
          <p class="inapp-warning">
            ⚠️ Prohlížíš web uvnitř aplikace (Instagram/FB/TikTok), která po zavření maže paměť. Zkopíruj si záložní kód nebo stránku otevři v Safari/Chrome.
          </p>
        {/if}
        <div class="backup-actions">
          <button type="button" class="ji-add-note" on:click={handleCopyBackupCode}>
            🔑 Vygenerovat záložní kód zápisníku
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
    gap: 0.8rem;
  }

  .drawer-inner {
    margin-top: 1rem;
    padding-top: 0.95rem;
    border-top: 1px solid rgba(22, 82, 56, 0.09);
  }

  .drawer-note {
    margin: 0 0 0.95rem 0;
    font-size: 0.86rem;
    color: var(--text-secondary, #374151);
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
    gap: 0.35rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .story-mode-tabs button {
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 82, 56, 0.14);
    background: #ffffff;
    color: var(--text-secondary, #374151);
    font-family: inherit;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
  }

  .story-mode-tabs button.active {
    background: #123828;
    color: #fde68a;
    border-color: #123828;
  }

  .story-preview-frame {
    width: 220px;
    aspect-ratio: 9 / 16;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
    border: 1px solid rgba(22, 82, 56, 0.15);
    margin-bottom: 0.95rem;
    background: #0c291d;
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
    color: rgba(236, 253, 245, 0.78);
    font-size: 0.82rem;
    padding: 1rem;
  }

  .story-dl-btn {
    border: none;
    border-radius: 999px;
    padding: 0.72rem 1.35rem;
    background: linear-gradient(135deg, #0f3626 0%, #1b573e 100%);
    color: #fde68a;
    font-family: inherit;
    font-weight: 800;
    font-size: 0.86rem;
    cursor: pointer;
  }

  .story-msg {
    margin: 0.6rem 0 0;
    font-size: 0.82rem;
    color: var(--emerald-600, #059669);
    font-weight: 600;
  }

  .empty-journal {
    margin: 0;
    font-size: 0.86rem;
    color: var(--text-muted, #6b7280);
  }

  .journal-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }

  .journal-item {
    padding: 0.75rem 0.95rem;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid rgba(22, 82, 56, 0.08);
  }

  .ji-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .ji-title {
    font-weight: 700;
    font-size: 0.88rem;
    color: var(--text-primary, #0c2b1e);
  }

  .ji-date {
    font-size: 0.76rem;
    color: var(--text-muted, #6b7280);
  }

  .ji-note {
    margin: 0.3rem 0 0;
    font-size: 0.82rem;
    color: var(--text-secondary, #374151);
    font-style: italic;
  }

  .ji-add-note {
    margin-top: 0.25rem;
    border: none;
    background: transparent;
    color: var(--emerald-600, #059669);
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
  }

  .ji-edit {
    margin-top: 0.45rem;
    display: flex;
    gap: 0.45rem;
  }

  .ji-edit input {
    flex: 1;
    padding: 0.42rem 0.7rem;
    border-radius: 10px;
    border: 1px solid rgba(22, 82, 56, 0.16);
    font-family: inherit;
    font-size: 0.82rem;
  }

  .ji-edit button {
    padding: 0.42rem 0.8rem;
    border-radius: 10px;
    border: none;
    background: #0f3022;
    color: #ffffff;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
  }

  .backup-box {
    margin-top: 1rem;
    padding-top: 0.95rem;
    border-top: 1px solid rgba(22, 82, 56, 0.09);
  }

  .inapp-warning {
    margin: 0 0 0.8rem 0;
    padding: 0.65rem 0.85rem;
    border-radius: 12px;
    background: #fef3c7;
    border: 1px solid #f59e0b;
    color: #92400e;
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .backup-actions {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
</style>

