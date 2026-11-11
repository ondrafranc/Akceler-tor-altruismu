<script>
  import {
    getActionEffectMeta,
    impactCanvas,
    triggerCanvasBurst,
    playPayoffAsmr,
    describeAmbientPulse,
    playCelebrationChord,
    safeVibrate
  } from '../../../../lib/sensoryEngine.js';
  import { trackEvent, openBrokenLinkReport } from '../../../../lib/analytics.js';
  import { notifyMollySpark } from '../../../../lib/mollyStore.js';
  import { cleanTitle, stripLeadingEmoji } from '../../../../lib/utils.js';
  import { VALUES } from '../../../data/values.js';
  import EvidenceBadge from './EvidenceBadge.svelte';

  export let action = null;
  export let isStarted = false;
  export let isCompleted = false;
  export let justCompleted = false;
  export let partnerReturnPromptVisible = false;
  export let ambientPulse = null;
  export let soundMuted = false;
  export let showEffectPreview = true;
  export let copiedDirectLink = false;
  export let savedValues = [];
  export let usePersonalValues = false;
  export let variant = 'instant'; // 'instant' | 'directory' | 'compact'
  export let spotlight = false;
  export let className = '';

  export let onStart = null;
  export let onComplete = null;
  export let onShare = null;
  export let onReportBroken = null;
  export let onToggleSound = null;
  export let onTogglePersonalValues = null;
  export let onNextIdea = null;
  export let onDismissReturn = null;
  export let onCloseSession = null;

  let kibbleGrams = 0;
  let sparkBoosted = false;
  let cardCanvasNode = null;
  let lastCelebratedActionId = null;

  $: if (justCompleted && action && action.id !== lastCelebratedActionId) {
    lastCelebratedActionId = action.id;
    try {
      safeVibrate(40);
      playCelebrationChord();
    } catch {}
  }

  function handleWeightUpdate(g) {
    kibbleGrams = g;
  }

  function getSavedValueLabels(ids) {
    if (!ids || !ids.length) return '';
    return VALUES.filter((v) => ids.includes(v.key || v.id))
      .map((v) => stripLeadingEmoji(v.label))
      .slice(0, 2)
      .join(', ');
  }

  function triggerEffectSpark() {
    if (!action) return;
    showEffectPreview = true;
    sparkBoosted = true;
    notifyMollySpark(action, { surface: variant });
    if (cardCanvasNode) {
      triggerCanvasBurst(cardCanvasNode, true);
    } else {
      playPayoffAsmr(action);
    }
    trackEvent('aa_effect_preview_toggle', {
      id: action.id,
      open: true,
      surface: variant
    });
  }

  $: effectMeta = action ? getActionEffectMeta(action, kibbleGrams) : null;
  $: ambientPulseText = describeAmbientPulse(ambientPulse, { inCard: true, actionId: action?.id });
  $: actionTitle = action ? cleanTitle(action.title) : '';
</script>

{#if action}
  <article
    id={action ? `online-card-${action.id}` : undefined}
    class="action-card card instant-body {className}"
    class:directory-card={variant === 'directory'}
    class:spotlight
    class:done-card={isCompleted}
    class:is-done={isCompleted}
  >
    <!-- 1. Standardizovaná hlavička: Čas · Cena · Režim + Třída důkazů A/B/C -->
    <div class="action-meta-line card-meta-top">
      <span class="quick-tags-pill quick-tags-inline">
        {action.quickTagsLabel || '2 min · Zdarma · Online'}
      </span>
      <span class="meta-sep">·</span>
      <EvidenceBadge
        tier={action.impactEvidence || 'B'}
        variant={variant === 'directory' ? 'card' : 'pill'}
        className="card-evidence-badge rec-evidence-pill evidence-pill"
      />
      {#if isCompleted}
        <span class="done-dot done-inline">· ✓ Splněno</span>
      {/if}
      {#if savedValues && savedValues.length > 0 && onTogglePersonalValues}
        <button
          type="button"
          class="personal-values-pill"
          class:active={usePersonalValues}
          on:click={onTogglePersonalValues}
          title="Přizpůsobit podle témat vybraných v průvodci"
        >
          {usePersonalValues ? `✦ Tvoje témata (${getSavedValueLabels(savedValues)})` : '🎯 Moje témata'}
        </button>
      {/if}
    </div>

    <!-- 2. Název příležitosti -->
    <h2 class="action-title card-title rec-title">{actionTitle}</h2>

    <!-- 3. Jasné vysvětlení jednoho konkrétního skutku -->
    <p class="action-desc card-desc rec-desc">{action.desc}</p>

    <!-- 4. Přínos + Partner & Bez registrace -->
    <div class="action-impact-summary card-impact-box rec-impact-block">
      <div class="impact-benefit-line card-benefit-line rec-impact-line">
        <strong>Přínos ({action.impactBasis || 'doložený'}):</strong>
        <span>{action.concreteImpact || action.selfBenefit}</span>
      </div>
      <div class="partner-trust-line card-partner-line rec-partner-line">
        <span>
          {action.registrationRequired
            ? 'Krátká registrace u partnera'
            : 'Bez registrace na našem webu'}
        </span>
        <span>·</span>
        <span>Aktivita probíhá u <strong>{action.org}</strong></span>
      </div>
    </div>

    <!-- 5. Sekundární metadata výhradně v rozbalovacím detailu -->
    <details class="how-toggle steps-inline">
      <summary>ℹ️ Jak to funguje ({action.steps?.length ? `${action.steps.length} ${action.steps.length === 1 ? 'krok' : action.steps.length < 5 ? 'kroky' : 'kroků'}` : 'důkazy a partner'})</summary>
      {#if action.steps?.length}
        <ol class="how-steps clean-steps">
          {#each action.steps as step}
            <li>{step}</li>
          {/each}
        </ol>
      {/if}
      {#if action.impactChain}
        <div class="impact-chain-row rec-impact-chain card-chain-line">
          <span><strong>Aktivita:</strong> {action.impactChain.activity}</span>
          <span class="chain-arrow chain-sep">→</span>
          <span><strong>Výsledek:</strong> {action.impactChain.immediateOutput}</span>
          <span class="chain-arrow chain-sep">→</span>
          <span><strong>Skutečný dopad:</strong> {action.impactChain.realImpact}</span>
        </div>
      {/if}
    </details>

    <!-- 5. In-situ oslava a odměna po dokončení nebo návratu od partnera -->
    {#if justCompleted}
      <div
        class="celebration-card inline-celebration-card in-situ-celebration"
        role="status"
        aria-live="polite"
        data-scene={effectMeta?.scene || 'default'}
      >
        <div class="inline-celebration-head">
          <span class="kicker celebration-kicker">🎉 Skvělá práce! Dobrý skutek je hotový</span>
          {#if effectMeta?.badge}
            <span class="impact-payoff-badge">{effectMeta.badge}</span>
          {/if}
        </div>
        <h3 class="win-title">{actionTitle}</h3>
        <canvas
          class="impact-payoff-canvas"
          width="320"
          height="118"
          use:impactCanvas={{ action, climax: true, onWeightUpdate: handleWeightUpdate }}
          aria-label="Fyzikální vizualizace dopadu dobrého skutku"
        ></canvas>
        <div class="in-situ-affirmation">
          ✨ <strong>Dnes už tvůj dobrý skutek pomáhá.</strong> Můžeš pokračovat dalším drobným skutkem, nebo dnešní seanci s klidem uzavřít.
        </div>
        <div class="return-dopamine-actions in-situ-actions">
          {#if onCloseSession}
            <button
              type="button"
              class="return-dopamine-btn btn-session-close"
              on:click={onCloseSession}
              aria-label="Uzavřít dnešní seanci"
            >
              🌿 Pro dnešek hotovo
            </button>
          {/if}
          {#if onNextIdea}
            <button
              type="button"
              class="return-dopamine-btn btn-next-deed inline-celebration-next"
              on:click={onNextIdea}
              aria-label="Ukázat další doporučený skutek"
            >
              Další dobrý skutek →
            </button>
          {/if}
        </div>
      </div>
    {:else if partnerReturnPromptVisible}
      <div
        class="return-dopamine-strip in-situ-strip"
        role="status"
        aria-live="polite"
        data-scene={effectMeta?.scene || 'default'}
      >
        <div class="inline-celebration-head return-dopamine-head">
          <div class="return-dopamine-text return-dopamine-title">
            ✨ <strong>Vítej zpět!</strong> Povedlo se ti dokončit skutek u partnera?
          </div>
          {#if effectMeta?.badge}
            <span class="impact-payoff-badge">{effectMeta.badge}</span>
          {/if}
        </div>
        <canvas
          class="impact-payoff-canvas"
          width="320"
          height="118"
          use:impactCanvas={{ action, climax: true, onWeightUpdate: handleWeightUpdate }}
          aria-label="Fyzikální vizualizace dopadu dobrého skutku"
        ></canvas>
        <div class="in-situ-affirmation">
          🌿 Každý drobný krok má skutečný význam.
        </div>
        <div class="return-dopamine-actions in-situ-actions">
          <button
            type="button"
            class="return-dopamine-btn btn-return-complete"
            on:click={() => onComplete && onComplete(action)}
          >
            ✓ Ano, mám hotovo
          </button>
          {#if onCloseSession}
            <button
              type="button"
              class="btn-session-close return-dopamine-svet-link"
              on:click={onCloseSession}
            >
              🌿 Pro dnešek hotovo
            </button>
          {:else if onDismissReturn}
            <button
              type="button"
              class="btn-return-dismiss return-dopamine-svet-link"
              on:click={onDismissReturn}
            >
              Později
            </button>
          {/if}
        </div>
      </div>
    {/if}

    {#if !justCompleted}
      <div class="instant-actions actions-row cta-row">
        <a
          href={action.url}
          target="_blank"
          rel="noopener noreferrer"
          class="btn-studio-primary btn-gold-action cta primary"
          data-hold-spark="true"
          data-molly-guide="true"
          on:click={() => onStart && onStart(action)}
        >
          <span>{action.id === 'zvirata_utulek_online' ? '🐾 Nakrmit útulek teď' : (action.cta || 'Začít pomáhat')}</span>
          <svg
            class="cta-arrow-icon"
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
        </a>

        {#if !partnerReturnPromptVisible}
          <button
            type="button"
            class="btn-studio-done btn-done-action cta secondary done-btn"
            class:initiated={isStarted}
            on:click={() => onComplete && onComplete(action)}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{isStarted ? 'Dokončeno' : (action.doneCta || 'Už mám hotovo')}</span>
          </button>
        {/if}
      </div>

      {#if showEffectPreview && !partnerReturnPromptVisible}
        <div
          class="card-effect-stage"
          data-scene={effectMeta?.scene || 'default'}
        >
          <div class="card-effect-head">
            {#if effectMeta?.badge}
              <span class="impact-payoff-badge">{effectMeta.badge}</span>
            {/if}
            <div class="card-effect-controls">
              <button
                type="button"
                class="effect-spark-btn"
                class:active={sparkBoosted}
                on:click={triggerEffectSpark}
                aria-pressed={sparkBoosted}
                aria-label="Spustit interaktivní efekt dopadu"
                title="Klikni pro vlnu dopadu na plátně (nebo klepni přímo do scény)"
              >
                ✨ Impuls
              </button>
              {#if onToggleSound}
                <button
                  type="button"
                  class="sound-mute-btn"
                  on:click={onToggleSound}
                  aria-pressed={soundMuted}
                  aria-label={soundMuted ? 'Zapnout jemné zvuky' : 'Ztlumit zvuky'}
                  title={soundMuted ? 'Zapnout jemné zvuky' : 'Ztlumit zvuky'}
                >
                  {soundMuted ? '🔇' : '🔊'}
                </button>
              {/if}
            </div>
          </div>
          <canvas
            bind:this={cardCanvasNode}
            class="impact-payoff-canvas"
            width="320"
            height="118"
            use:impactCanvas={{ action, climax: false, onWeightUpdate: handleWeightUpdate }}
            aria-label="Fyzikální vizualizace dopadu dobrého skutku"
          ></canvas>
        </div>
      {/if}
    {/if}

    <div class="ambient-pulse-pill" role="status" aria-live="off">
      <span class="ambient-pulse-wave pulse-dot-live" aria-hidden="true"></span>
      <span class="ambient-pulse-dot" aria-hidden="true"></span>
      <span class="ambient-pulse-text pulse-msg-text">{ambientPulseText}</span>
    </div>

    <div class="action-verify-footer card-verify-footer rec-verify-footer">
      <span class="verify-meta">
        Ověřeno: <strong>{action.verifiedLabel}</strong> · Zdroj:
        <a
          href={action.sourceUrl || action.url}
          target="_blank"
          rel="noopener noreferrer"
          class="verify-source-link card-source-link rec-source-link"
        >
          {action.org} ↗
        </a>
      </span>
      <div class="verify-footer-actions card-footer-actions rec-footer-btns">
        {#if onShare}
          <button
            type="button"
            class="direct-link-share-btn mde-share-btn card-broken-btn rec-broken-btn"
            on:click={() => onShare(action)}
            title="Zkopírovat přímý odkaz na tento skutek pro sdílení v diskuzi nebo zprávě"
          >
            {copiedDirectLink ? '✓ Odkaz zkopírován' : '🔗 Sdílet odkaz'}
          </button>
        {/if}
        <button
          type="button"
          class="broken-link-btn mde-broken-btn card-broken-btn rec-broken-btn"
          on:click={() => {
            if (onReportBroken) onReportBroken(action);
            else openBrokenLinkReport({ id: action.id, title: actionTitle, org: action.org, url: action.url });
          }}
        >
          Nahlásit chybu
        </button>
      </div>
    </div>
  </article>
{/if}

<style>
  .instant-body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    max-width: 100%;
  }

  .action-meta-line {
    display: flex;
    align-items: center;
    gap: 0.42rem;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: var(--text-muted, #6b7280);
    margin-bottom: 0.45rem;
  }

  .meta-sep {
    color: var(--text-muted, #9ca3af);
  }

  .quick-tags-pill {
    font-weight: 800;
    color: #0d2e20;
  }

  .personal-values-pill {
    margin-left: auto;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid rgba(16, 185, 129, 0.25);
    background: rgba(236, 253, 245, 0.8);
    color: #065f46;
    font-family: var(--font-sans);
    font-size: 0.76rem;
    font-weight: 700;
    min-height: 44px;
    padding: 0.35rem 0.65rem;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .personal-values-pill.active {
    background: #065f46;
    color: #ffffff;
    border-color: #065f46;
  }

  .action-title {
    font-weight: 800;
    font-size: 1.34rem;
    line-height: 1.25;
    letter-spacing: -0.02em;
    color: #091d14;
    margin: 0 0 0.5rem 0;
  }

  .action-desc {
    color: var(--text-secondary, #374151);
    font-size: 0.94rem;
    line-height: 1.6;
    margin: 0 0 0.95rem 0;
  }

  .action-impact-summary {
    margin: 0 0 0.85rem 0;
    padding-top: 0.55rem;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.84rem;
    line-height: 1.48;
  }

  .impact-benefit-line {
    color: #091d14;
  }

  .impact-benefit-line strong {
    color: #047857;
    margin-right: 0.25rem;
  }

  .partner-trust-line {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: var(--text-muted, #6b7280);
  }

  .partner-trust-line strong {
    color: var(--text-secondary, #374151);
    font-weight: 700;
  }

  .how-toggle {
    margin: 0 0 1.05rem 0;
    font-size: 0.84rem;
    color: var(--text-secondary, #374151);
  }

  .how-toggle summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--forest-800, #064e3b);
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 44px;
    padding: 0.4rem 0.2rem;
    box-sizing: border-box;
  }

  .how-toggle summary::-webkit-details-marker {
    display: none;
  }

  .how-toggle summary::before {
    content: "▸";
    color: var(--emerald-600, #059669);
    transition: transform 0.18s ease;
  }

  .how-toggle[open] summary::before {
    transform: rotate(90deg);
  }

  .how-steps {
    margin: 0.55rem 0 0 1.2rem;
    padding: 0;
    line-height: 1.52;
    color: var(--text-secondary, #374151);
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .impact-chain-row {
    margin-top: 0.6rem;
    padding-top: 0.5rem;
    border-top: 1px dashed rgba(22, 66, 48, 0.14);
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: var(--text-secondary, #374151);
  }

  .chain-arrow {
    color: var(--emerald-600, #059669);
    font-weight: 800;
  }

  .how-details-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.65rem;
    padding-top: 0.55rem;
    border-top: 1px dashed rgba(22, 82, 56, 0.18);
    font-size: 0.8rem;
    line-height: 1.42;
  }

  .mobile-details-extra {
    display: flex;
    flex-direction: column;
  }

  .action-verify-footer {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-top: 0.4rem;
    padding-top: 0.4rem;
    border-top: 1px dashed rgba(22, 66, 48, 0.12);
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  .verify-footer-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .direct-link-share-btn,
  .mde-share-btn {
    border: none;
    background: transparent;
    color: var(--emerald-600, #059669);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  .broken-link-btn,
  .mde-broken-btn {
    border: none;
    background: transparent;
    color: var(--text-muted, #6b7280);
    font-family: var(--font-sans);
    font-size: 0.74rem;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }

  .instant-actions {
    display: flex;
    gap: 0.55rem;
    align-items: center;
    padding-top: 0.25rem;
  }

  .btn-studio-primary {
    --spark-charge: 0;
    position: relative;
    overflow: hidden;
    isolation: isolate;
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.84rem 1.15rem;
    border-radius: 14px;
    background: linear-gradient(135deg, #0d2e20 0%, #1b573e 100%);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.92rem;
    text-decoration: none;
    box-shadow: 0 10px 22px -6px rgba(13, 46, 32, 0.38);
    transition: all 0.2s var(--ease-gentle, ease);
  }

  .btn-studio-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px -6px rgba(13, 46, 32, 0.52);
  }

  .btn-studio-done {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    padding: 0.84rem 1rem;
    border-radius: 14px;
    border: 1px solid rgba(5, 150, 105, 0.28);
    background: #eef7f1;
    color: #065f46;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .btn-studio-done:hover {
    background: #059669;
    color: #ffffff;
  }

  .btn-studio-done.initiated {
    background: #059669;
    color: #ffffff;
    border-color: #059669;
  }

  .card-effect-stage {
    position: relative;
    margin: 0.5rem 0 0.6rem;
    padding: 0;
    border-radius: 18px;
    overflow: hidden;
    background: radial-gradient(circle at 50% 38%, #0e3625 0%, #04140e 100%);
    border: 1px solid rgba(52, 211, 153, 0.38);
    color: #ecfdf5;
    box-shadow:
      0 14px 30px -12px rgba(4, 18, 12, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);
  }

  .card-effect-head {
    position: absolute;
    top: 8px;
    left: 10px;
    right: 10px;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    pointer-events: none;
  }

  .card-effect-head > * {
    pointer-events: auto;
  }

  .card-effect-controls {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .card-effect-stage .impact-payoff-badge {
    background: rgba(5, 20, 14, 0.76);
    color: #fde68a;
    border: 1px solid rgba(251, 191, 36, 0.44);
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .effect-spark-btn,
  .sound-mute-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.24rem;
    padding: 0.22rem 0.52rem;
    border-radius: 999px;
    border: 1px solid rgba(52, 211, 153, 0.38);
    background: rgba(5, 20, 14, 0.74);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #ecfdf5;
    font-family: var(--font-sans);
    font-size: 0.71rem;
    font-weight: 800;
    line-height: 1.2;
    cursor: pointer;
    transition: all 0.16s ease;
    white-space: nowrap;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.24);
  }

  .effect-spark-btn:hover,
  .effect-spark-btn.active,
  .sound-mute-btn:hover {
    background: linear-gradient(135deg, #0d2e20 0%, #174933 100%);
    color: #fde68a;
    border-color: rgba(251, 191, 36, 0.55);
  }

  .impact-payoff-canvas {
    display: block;
    width: 100%;
    max-width: 100%;
    height: 118px;
    border: none;
    border-radius: 0;
    cursor: pointer;
    touch-action: manipulation;
  }

  .celebration-card,
  .return-dopamine-strip {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-bottom: 0.55rem;
    padding: 0.72rem 0.88rem;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(8, 30, 21, 0.96), rgba(16, 54, 38, 0.95));
    border: 1px solid rgba(52, 211, 153, 0.38);
    color: #ecfdf5;
    font-size: 0.84rem;
    line-height: 1.38;
  }

  .inline-celebration-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .inline-celebration-card .kicker {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6ee7b7;
  }

  .inline-celebration-card .win-title {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 800;
    color: #ffffff;
  }

  .impact-payoff-badge {
    font-size: 0.74rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.2);
    color: #a7f3d0;
  }

  .in-situ-affirmation,
  .molly-celebration-note {
    font-size: 0.82rem;
    color: #e6f5ec;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(52, 211, 153, 0.28);
    border-radius: 10px;
    padding: 0.45rem 0.75rem;
    margin: 0.45rem 0;
    line-height: 1.4;
  }

  .return-dopamine-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .return-dopamine-btn {
    appearance: none;
    border: 1px solid rgba(251, 191, 36, 0.5);
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #062015;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 800;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.28);
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .btn-session-close {
    border: 1px solid rgba(52, 211, 153, 0.38);
    background: rgba(6, 78, 59, 0.45);
    color: #a7f3d0;
    box-shadow: 0 2px 8px rgba(6, 78, 59, 0.25);
  }

  .btn-session-close:hover {
    background: rgba(6, 78, 59, 0.7);
    border-color: rgba(52, 211, 153, 0.6);
  }

  .btn-next-deed {
    border: 1px solid rgba(251, 191, 36, 0.5);
  }

  .return-dopamine-svet-link {
    color: #fde68a;
    font-size: 0.82rem;
    font-weight: 800;
    text-decoration: underline;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0.4rem 0.6rem;
  }

  .inline-celebration-next {
    border: 1px solid rgba(251, 191, 36, 0.65);
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #062015;
    padding: 0.5rem 1rem;
    font-family: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .ambient-pulse-pill {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 0.42rem;
    margin-top: 0.38rem;
    padding: 0.15rem 0.05rem;
    border-radius: 0;
    background: transparent;
    border: none;
    color: #2c5540;
    font-size: 0.73rem;
    font-weight: 600;
    line-height: 1.25;
  }

  .ambient-pulse-wave {
    display: none;
  }

  .ambient-pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.65);
    flex-shrink: 0;
  }

  .ambient-pulse-text {
    position: relative;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-verify-footer {
    margin-top: 0.75rem;
    padding-top: 0.6rem;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  .verify-source-link {
    color: var(--forest-800, #064e3b);
    font-weight: 700;
    text-decoration: none;
  }

  .verify-source-link:hover {
    color: var(--emerald-600, #059669);
    text-decoration: underline;
  }

  .verify-footer-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .direct-link-share-btn {
    appearance: none;
    background: none;
    border: none;
    padding: 0;
    color: #047857;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .broken-link-btn {
    border: none;
    background: transparent;
    color: var(--text-muted, #6b7280);
    font-family: var(--font-sans);
    font-size: 0.74rem;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }

  .broken-link-btn:hover {
    color: #b45309;
  }

  @media (min-width: 681px) {
    .instant-body > .instant-actions {
      order: 4;
      margin-bottom: 0.35rem;
    }
    .instant-body > .card-effect-stage,
    .instant-body > :global(.card-effect-stage) {
      order: 5;
      margin: 0.2rem 0 0.45rem;
    }
    .instant-body > .ambient-pulse-pill {
      order: 6;
    }
    .instant-body > .action-verify-footer {
      order: 7;
    }
  }

  .card {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(22, 66, 48, 0.09);
    border-radius: 22px;
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.08));
    padding: 0.88rem 1.08rem;
    display: flex;
    flex-direction: column;
    transition: transform 0.24s var(--ease-gentle, ease), box-shadow 0.24s var(--ease-gentle, ease);
  }

  .card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  }

  .card.spotlight {
    border: 1.5px solid #f59e0b;
    box-shadow: 0 0 0 4px rgba(253, 230, 138, 0.4), var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  }

  @media (max-width: 1024px) {
    .mobile-details-extra {
      display: flex;
      flex-direction: column;
      gap: 0.38rem;
      margin-top: 0.5rem;
      padding-top: 0.45rem;
      border-top: 1px dashed rgba(22, 82, 56, 0.18);
      font-size: 0.76rem;
      line-height: 1.38;
    }

    .mde-row {
      display: flex;
      align-items: center;
      gap: 0.38rem;
      flex-wrap: wrap;
    }

    .mde-verify {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.72rem;
      color: var(--text-muted, #6b7280);
    }
  }

  @media (max-width: 680px) {
    .card {
      padding: 0.65rem 0.85rem;
    }

    .instant-body {
      gap: 0.32rem;
    }

    .action-meta-line {
      font-size: 0.68rem;
      gap: 0.24rem;
      margin-bottom: 0.2rem;
      flex-wrap: wrap;
    }

    .quick-tags-pill {
      padding: 0.12rem 0.4rem;
      font-size: 0.66rem;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.12);
      color: #065f46;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .personal-values-pill {
      min-height: 44px;
      padding: 0.35rem 0.65rem;
      font-size: 0.72rem;
      flex-shrink: 0;
      margin-left: auto;
      box-sizing: border-box;
    }

    .action-title {
      font-size: 1.05rem;
      line-height: 1.18;
      margin: 0.04rem 0 0.18rem 0;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .action-desc {
      font-size: 0.8rem;
      line-height: 1.32;
      margin: 0 0 0.18rem 0;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .action-impact-summary {
      margin: 0 0 0.16rem 0;
      padding-top: 0.3rem;
      gap: 0.14rem;
      font-size: 0.77rem;
      line-height: 1.32;
    }

    .partner-trust-line {
      font-size: 0.73rem;
    }

    .how-toggle {
      margin: 0 0 0.12rem 0;
      padding: 0 0.25rem;
      border-radius: 12px;
    }

    .how-toggle summary {
      font-size: 0.78rem;
      min-height: 44px;
      padding: 0.4rem 0.2rem;
      box-sizing: border-box;
    }

    .card-effect-stage {
      margin: 0.32rem 0 0.36rem;
      border-radius: 14px;
    }

    .card-effect-stage .impact-payoff-canvas,
    .impact-payoff-canvas {
      height: 76px;
    }

    .card-effect-head {
      top: 6px;
      left: 7px;
      right: 7px;
    }

    .card-effect-stage .impact-payoff-badge {
      font-size: 0.66rem;
      padding: 0.14rem 0.44rem;
    }

    .effect-spark-btn,
    .sound-mute-btn {
      font-size: 0.65rem;
      padding: 0.14rem 0.38rem;
    }

    .instant-actions {
      flex-direction: column;
      align-items: stretch;
      padding-top: 0.12rem;
      gap: 0.38rem;
    }

    .btn-studio-primary {
      width: 100%;
      box-sizing: border-box;
      min-height: 52px;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      border-radius: 14px;
    }

    .btn-studio-done {
      width: 100%;
      box-sizing: border-box;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.44rem 0.68rem;
      font-size: 0.78rem;
      border-radius: 12px;
      background: rgba(238, 247, 241, 0.75);
    }

    .ambient-pulse-pill {
      margin-top: 0.35rem;
      padding: 0.26rem 0.52rem;
      font-size: 0.69rem;
    }
  }
</style>
