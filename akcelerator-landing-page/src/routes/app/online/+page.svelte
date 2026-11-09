<script>
  import { onMount } from 'svelte';
  import {
    trackEvent,
    trackFunnel,
    startedActionIds,
    markActionStarted,
    openBrokenLinkReport
  } from '../../../lib/analytics.js';
  import {
    MICRO_ACTIONS,
    VALUES,
    EVIDENCE_TIERS,
    EVIDENCE_METHODOLOGY
  } from '../../../lib/data/czech-actions.js';
  import { recordSmallWin, completedSteps } from '../../../lib/progress.js';
  import {
    isSoundMuted,
    toggleSoundMuted,
    holdSpark,
    impactCanvas,
    getActionEffectMeta,
    playPayoffAsmr,
    savePendingPartnerReturn,
    consumePendingPartnerReturn,
    getPendingPartnerReturnRemainingMs,
    triggerCanvasBurst,
    fetchAmbientPulse,
    describeAmbientPulse
  } from '../../../lib/sensoryEngine.js';
  import { notifyMollySpark } from '../../../lib/mollyStore.js';
  import { cleanTitle, cleanMeta, safeGetItem } from '../../../lib/utils.js';

  let activeFilter = 'all';
  let searchQuery = '';
  /** @type {string[]} */
  let savedValues = [];
  let copiedId = '';
  let spotlightId = '';
  let visibleLimit = 3;
  let soundMuted = false;
  let activeEffectCardId = '';
  /** @type {Record<string, number>} */
  let cardMetrics = {};
  let returnPromptAction = null;
  let returnMetric = 0;
  let awaitingReturnAction = null;
  let leaveTimestamp = 0;
  /** @type {any} */
  let ambientPulse = null;
  $: ambientPulseText = describeAmbientPulse(ambientPulse, {});

  const FILTERS = [
    { id: 'all', label: '✨ Doporučené' },
    { id: 'free', label: 'Zdarma' },
    { id: 'fast', label: 'Do 5 min' },
    { id: 'writing', label: 'Z gauče' },
    { id: 'outdoor', label: 'Venku' },
    { id: 'tutoring', label: 'U počítače' },
    { id: 'donation', label: 'Drobný dar' },
    { id: 'evidenceA', label: '✦ Důkazy A' }
  ];

  onMount(() => {
    let onlineReturnTimer = null;
    soundMuted = isSoundMuted();
    try {
      const sp = new URLSearchParams(window.location.search);
      const fParam = sp.get('filter');
      if (fParam && FILTERS.some((f) => f.id === fParam)) {
        activeFilter = fParam;
        visibleLimit = 6;
      }
      const actionParam = sp.get('action') || window.location.hash.replace(/^#(?:action=)?/, '');
      if (actionParam) {
        const matched = MICRO_ACTIONS.find(
          (a) => a.id === actionParam || a.id.replace(/_/g, '-') === actionParam
        );
        if (matched) {
          spotlightId = matched.id;
          visibleLimit = MICRO_ACTIONS.length;
        }
      }
      const s = JSON.parse(
        safeGetItem('aa_values', 'local') || safeGetItem('aa_guided_values_v2', 'local') || '[]'
      );
      if (Array.isArray(s)) savedValues = s;
    } catch {}

    const checkPartnerReturn = () => {
      if (returnPromptAction) return;
      if (onlineReturnTimer) {
        clearTimeout(onlineReturnTimer);
        onlineReturnTimer = null;
      }
      const elapsedMem = awaitingReturnAction ? Date.now() - leaveTimestamp : 0;
      const persisted = consumePendingPartnerReturn(3000);
      if (elapsedMem >= 3000 || persisted) {
        if (awaitingReturnAction && !persisted) {
          consumePendingPartnerReturn(0);
        }
        const targetId = persisted?.id || awaitingReturnAction?.id;
        const matched = MICRO_ACTIONS.find((a) => a.id === targetId) || awaitingReturnAction;
        if (matched) {
          returnPromptAction = matched;
          returnMetric = 0;
          awaitingReturnAction = null;
          playPayoffAsmr(matched);
          trackEvent('aa_partner_return_prompt', { surface: 'online', id: matched.id });
        }
      } else {
        const remPersisted = getPendingPartnerReturnRemainingMs(3000);
        const remMem = awaitingReturnAction && elapsedMem > 0 ? Math.max(0, 3000 - elapsedMem) : 0;
        const rem = Math.max(remPersisted, remMem);
        if (rem > 0) {
          onlineReturnTimer = setTimeout(checkPartnerReturn, rem + 30);
        }
      }
    };

    const onVis = () => {
      if (document.visibilityState === 'visible') checkPartnerReturn();
    };
    checkPartnerReturn();

    const pulseTimer = setTimeout(async () => {
      const pulse = await fetchAmbientPulse();
      ambientPulse = pulse;
    }, 300);

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', checkPartnerReturn);
    window.addEventListener('pageshow', checkPartnerReturn);

    return () => {
      clearTimeout(pulseTimer);
      if (onlineReturnTimer) clearTimeout(onlineReturnTimer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', checkPartnerReturn);
      window.removeEventListener('pageshow', checkPartnerReturn);
    };
  });

  function handleToggleSound() {
    soundMuted = toggleSoundMuted();
    trackEvent('aa_sound_toggle', { surface: 'online', muted: soundMuted });
  }

  function toggleCardEffect(action, event) {
    activeEffectCardId = action.id;
    notifyMollySpark(action, { surface: 'online' });
    const stage = event?.currentTarget?.closest?.('.card-effect-stage');
    const canvas = stage?.querySelector?.('canvas.impact-payoff-canvas');
    if (canvas) {
      triggerCanvasBurst(canvas, true);
    } else {
      playPayoffAsmr(action);
    }
    trackEvent('aa_effect_preview_toggle', { surface: 'online', id: action.id });
  }

  function handleStartOnlineAction(action) {
    awaitingReturnAction = action;
    leaveTimestamp = Date.now();
    returnPromptAction = null;
    savePendingPartnerReturn(action, 'online');
    markActionStarted(action.id, 'online');
    trackEvent('aa_clickout', { surface: 'online', id: action.id });
  }

  async function shareAction(action) {
    const directUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/?action=${encodeURIComponent(action.id)}`
        : action.url;
    const shareText = `Tip na drobný dobrý skutek (${cleanTitle(action.title)} – ${action.org}): ${directUrl}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(directUrl);
        copiedId = action.id;
        setTimeout(() => {
          if (copiedId === action.id) copiedId = '';
        }, 2500);
      } else if (navigator.share) {
        await navigator.share({
          title: cleanTitle(action.title),
          text: shareText,
          url: directUrl
        });
      }
      trackEvent('aa_online_share', { id: action.id });
    } catch {}
  }

  function matchesSavedValues(action) {
    if (!savedValues.length) return false;
    return action.values.some((v) => savedValues.includes(v));
  }

  function isCompleted(id) {
    return ($completedSteps || []).some((s) => s.id === id);
  }

  function primaryTopicFor(action) {
    const first = action.values
      .map((k) => VALUES.find((v) => v.key === k)?.shortLabel)
      .filter(Boolean)[0];
    return first || 'Dobrý skutek';
  }

  function pickRandomSpark() {
    const pool = filteredActions.length ? filteredActions : MICRO_ACTIONS;
    const chosenIdx = Math.floor(Math.random() * pool.length);
    const chosen = pool[chosenIdx];
    if (!chosen) return;
    if (chosenIdx >= visibleLimit) {
      visibleLimit = chosenIdx + 3;
    }
    spotlightId = chosen.id;
    trackEvent('aa_online_random_spark', { id: chosen.id });
    setTimeout(() => {
      const el = document.getElementById(`online-card-${chosen.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    setTimeout(() => {
      if (spotlightId === chosen.id) spotlightId = '';
    }, 3200);
  }

  $: filteredActions = MICRO_ACTIONS.filter((a) => {
    if (activeFilter === 'free' && a.cost !== 'free') return false;
    if (activeFilter === 'fast' && a.timeBucket !== '5') return false;
    if (activeFilter === 'writing' && !(a.categoryTag === 'writing' || a.mode === 'home')) return false;
    if (activeFilter === 'outdoor' && a.mode !== 'local') return false;
    if (activeFilter === 'tutoring' && !(a.categoryTag === 'tutoring' || a.categoryTag === 'tech')) return false;
    if (activeFilter === 'donation' && a.cost !== 'donation') return false;
    if (activeFilter === 'evidenceA' && a.impactEvidence !== 'A') return false;

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const hay = `${a.title} ${a.org} ${a.desc} ${a.reassurance || ''} ${a.metaLabel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    const aMatch = matchesSavedValues(a) ? 1 : 0;
    const bMatch = matchesSavedValues(b) ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    return a.timeMinutes - b.timeMinutes;
  });

  $: effectiveLimit = searchQuery.trim() ? Math.max(visibleLimit, 9) : visibleLimit;
  $: visibleActions = filteredActions.slice(0, effectiveLimit);
  $: remainingCount = Math.max(0, filteredActions.length - visibleActions.length);
</script>

<svelte:head>
  <title>Drobné skutky na pár minut — Akcelerátor altruismu</title>
</svelte:head>

<div class="page">
  <header class="subpage-hero header">
    <div class="hero-kicker">DROBNÉ SKUTKY NA DÁLKU I VENKU · {MICRO_ACTIONS.length} OVĚŘENÝCH PROJEKTŮ</div>
    <h1 class="title">Drobné skutky, které zvládneš <span class="serif-accent">během pár minut</span></h1>
    <p class="subtitle">
      Začínáme třemi lehkými tipy — další si kdykoliv rozbalíš nebo vyhledáš podle nálady.
    </p>

    <div class="hero-tools-row">
      <div class="search-wrap">
        <input
          type="search"
          id="online-search"
          name="q"
          autocomplete="off"
          bind:value={searchQuery}
          placeholder="Hledat (útulek, ptáci…)"
          aria-label="Hledat v drobných skutcích (např. útulek, mapování, ptáci, senioři, studánky)"
        />
      </div>
      <button type="button" class="btn-random-spark" on:click={pickRandomSpark}>
        ✨ Náhodný tip
      </button>
    </div>
  </header>

  {#if returnPromptAction}
    <div
      class="return-dopamine-strip"
      role="status"
      aria-live="polite"
      data-scene={getActionEffectMeta(returnPromptAction, returnMetric).scene}
    >
      <div class="return-dopamine-head">
        <span class="return-dopamine-title">
          ✨ Vítej zpět z projektu {cleanTitle(returnPromptAction.title)}! Povedlo se?
        </span>
        <span class="impact-payoff-badge">
          {getActionEffectMeta(returnPromptAction, returnMetric, { isReturnStrip: true }).badge}
        </span>
      </div>
      <canvas
        class="impact-payoff-canvas"
        width="320"
        height="118"
        aria-label="Fyzikální vizualizace dopadu dobrého skutku"
        use:impactCanvas={{
          action: returnPromptAction,
          climax: true,
          onProgress: (v) => {
            returnMetric = v;
          }
        }}
      ></canvas>
      <div class="return-dopamine-actions">
        <button
          type="button"
          class="btn-return-complete"
          on:click={() => {
            const doneAction = returnPromptAction;
            returnPromptAction = null;
            recordSmallWin({
              id: doneAction.id,
              title: doneAction.title,
              surface: 'online'
            });
          }}
        >
          ✓ Hotovo – rozsvítit stopu
        </button>
        <button
          type="button"
          class="btn-return-dismiss"
          on:click={() => (returnPromptAction = null)}
        >
          Později
        </button>
      </div>
    </div>
  {/if}

  <div class="filters-bar filter-toolbar" role="group" aria-label="Filtrovat drobné skutky">
    {#each FILTERS as f}
      <button
        type="button"
        class="filter-chip"
        class:active={activeFilter === f.id}
        on:click={() => {
          activeFilter = f.id;
          visibleLimit = 3;
          trackEvent('aa_online_filter', { filter: f.id });
          trackFunnel('intent_selected', { surface: 'online', filter: f.id });
        }}
      >
        {f.label}
      </button>
    {/each}
  </div>

  {#if filteredActions.length === 0}
    <div class="empty-box">
      <p>Pro hledání „{searchQuery}“ v tomhle filtru nic nesedí.</p>
      <button
        type="button"
        class="cta primary"
        on:click={() => {
          searchQuery = '';
          activeFilter = 'all';
          visibleLimit = 3;
        }}
      >
        Zobrazit doporučený výběr
      </button>
    </div>
  {:else}
    <div class="grid">
      {#each visibleActions as o, oi (o.id)}
        <article
          id={`online-card-${o.id}`}
          class="card"
          class:spotlight={spotlightId === o.id}
          class:done-card={isCompleted(o.id)}
        >
          <!-- 1. Standardizované štítky: Čas · Cena · Režim + Důkazy A/B/C -->
          <div class="card-meta-top">
            <span class="quick-tags-inline">{o.quickTagsLabel || cleanMeta(o.metaLabel)}</span>
            <span>·</span>
            <span
              class="card-evidence-badge tier-{o.impactEvidence || 'B'}"
              title={EVIDENCE_TIERS[o.impactEvidence || 'B']?.desc}
            >
              Důkazy {o.impactEvidence || 'B'} · {EVIDENCE_TIERS[o.impactEvidence || 'B']?.shortLabel}
            </span>
            {#if isCompleted(o.id)}
              <span class="done-dot">✓ Splněno</span>
            {/if}
          </div>

          <!-- 2. Název a popis -->
          <h2 class="card-title">{cleanTitle(o.title)}</h2>
          <p class="card-desc">{o.desc}</p>

          <!-- 3. Přínos + Partner & Bez registrace -->
          <div class="card-impact-box">
            <div class="card-benefit-line">
              <strong>Přínos ({o.impactBasis || 'doložený'}):</strong>
              <span>{o.concreteImpact}</span>
            </div>
            <div class="card-partner-line">
              <span>{o.registrationRequired ? 'Krátká registrace u partnera' : 'Bez registrace na našem webu'}</span>
              <span>·</span>
              <span>Aktivita probíhá u <strong>{o.org}</strong></span>
            </div>
          </div>

          {#if o.steps?.length}
            <details class="steps-inline">
              <summary>Jak se zapojit ({o.steps.length} {o.steps.length === 1 ? 'krok' : o.steps.length < 5 ? 'kroky' : 'kroků'}) a dopad</summary>
              <ol>
                {#each o.steps as step}
                  <li>{step}</li>
                {/each}
              </ol>
              {#if o.impactChain}
                <div class="card-chain-line">
                  <span><strong>Aktivita:</strong> {o.impactChain.activity}</span> →
                  <span><strong>Výsledek:</strong> {o.impactChain.immediateOutput}</span> →
                  <span><strong>Dopad:</strong> {o.impactChain.realImpact}</span>
                </div>
              {/if}
            </details>
          {/if}

          <!-- 4. Akční tlačítka (čisté 2 akce bez přeplácání) -->
          <div class="actions-row">
            <a
              class="cta primary"
              data-molly-guide={oi === 0 ? 'true' : undefined}
              href={o.url}
              target="_blank"
              rel="noopener noreferrer"
              use:holdSpark={{ id: o.id, surface: 'online' }}
              on:click={() => handleStartOnlineAction(o)}
            >
              Začít pomáhat ↗
            </a>
            <button
              type="button"
              class="cta secondary"
              class:initiated={Array.isArray($startedActionIds) && $startedActionIds.includes(o.id)}
              on:click={() =>
                recordSmallWin({
                  id: o.id,
                  title: o.title,
                  surface: 'online'
                })}
            >
              {Array.isArray($startedActionIds) && $startedActionIds.includes(o.id) ? '✓ Dokončeno' : '✓ Hotovo'}
            </button>
          </div>

          {#if oi === 0}
            <div
              class="card-effect-stage"
              data-scene={getActionEffectMeta(o, cardMetrics[o.id] || 0).scene}
            >
              <div class="card-effect-head">
                <span class="impact-payoff-badge">
                  {getActionEffectMeta(o, cardMetrics[o.id] || 0).badge}
                </span>
                <div class="card-effect-controls">
                  <button
                    type="button"
                    class="effect-spark-btn"
                    class:active={activeEffectCardId === o.id}
                    title="Spustit vlnu dopadu na plátně"
                    aria-label="Vyzkoušet interaktivní fyzikální a zvukový efekt aktivity"
                    aria-pressed={activeEffectCardId === o.id}
                    on:click={(e) => toggleCardEffect(o, e)}
                  >
                    ✨ Impuls
                  </button>
                  <button
                    type="button"
                    class="sound-mute-btn"
                    on:click={handleToggleSound}
                    aria-pressed={soundMuted}
                    aria-label={soundMuted ? 'Zapnout jemné zvuky' : 'Ztlumit zvuky'}
                    title={soundMuted ? 'Zapnout jemné zvuky' : 'Ztlumit zvuky'}
                  >
                    {soundMuted ? '🔇' : '🔊'}
                  </button>
                </div>
              </div>
              <canvas
                class="impact-payoff-canvas"
                width="320"
                height="118"
                aria-label="Fyzikální vizualizace dopadu dobrého skutku"
                use:impactCanvas={{
                  action: o,
                  climax: false,
                  onProgress: (v) => {
                    cardMetrics = { ...cardMetrics, [o.id]: v };
                  }
                }}
              ></canvas>
            </div>
          {/if}

          <!-- 5. Patička ověření + Sdílení + Nahlásit nefunkční odkaz -->
          <div class="card-verify-footer">
            <span>
              Ověřeno: <strong>{o.verifiedLabel}</strong> · Zdroj:
              <a
                href={o.sourceUrl || o.url}
                target="_blank"
                rel="noopener noreferrer"
                class="card-source-link"
              >
                {o.org} ↗
              </a>
            </span>
            <span class="card-footer-actions">
              <button
                type="button"
                class="card-broken-btn"
                on:click={() => shareAction(o)}
              >
                {copiedId === o.id ? '✓ Odkaz zkopírován' : '🔗 Sdílet'}
              </button>
              ·
              <button
                type="button"
                class="card-broken-btn"
                on:click={() =>
                  openBrokenLinkReport({
                    id: o.id,
                    title: cleanTitle(o.title),
                    org: o.org,
                    url: o.url
                  })}
              >
                Nahlásit chybu
              </button>
            </span>
          </div>
        </article>
      {/each}
    </div>

    <div class="online-pulse-wrap">
      <div class="ambient-pulse-pill" role="status" aria-live="off">
        <span class="pulse-dot-live" aria-hidden="true"></span>
        <span class="pulse-msg-text">{ambientPulseText}</span>
      </div>
    </div>

    {#if remainingCount > 0}
      <div class="calm-more-wrap">
        <button
          type="button"
          class="calm-more-btn"
          on:click={() => (visibleLimit += 6)}
        >
          <span>Ukázat dalších {Math.min(6, remainingCount)} tipů</span>
        </button>
        <span class="calm-more-hint">
          Zobrazeno {visibleActions.length} z {filteredActions.length} ověřených možností.
          {#if remainingCount > 6}
            <button type="button" class="link-show-all" on:click={() => (visibleLimit = filteredActions.length)}>
              Zobrazit všechny ({filteredActions.length})
            </button>
          {/if}
        </span>
      </div>
    {/if}
  {/if}

  <details class="calm-drawer online-methodology-drawer">
    <summary>⚖️ Jak hodnotíme účinnost a důkazy dopadu (A / B / C)?</summary>
    <div class="om-body">
      <p>{EVIDENCE_METHODOLOGY.intro}</p>
      <div class="om-tiers">
        {#each Object.values(EVIDENCE_TIERS) as t}
          <div><strong>Důkazy {t.tier} ({t.shortLabel}):</strong> {t.desc}</div>
        {/each}
      </div>
      <div class="om-links">
        {#each EVIDENCE_METHODOLOGY.sources as s}
          <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>
        {/each}
      </div>
    </div>
  </details>
</div>

<style>
  .page {
    max-width: 1140px;
    margin: 0 auto;
    padding: 0.45rem 1.25rem 5rem;
  }

  .subpage-hero.header {
    text-align: center;
    padding: 0.85rem 1.4rem !important;
    margin-bottom: 0.45rem !important;
  }

  .hero-kicker {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #fde68a;
    margin-bottom: 0.25rem;
  }

  .title {
    font-family: var(--font-sans);
    font-weight: 800;
    color: #ffffff;
    font-size: clamp(1.65rem, 2.8vw, 2.2rem);
    margin: 0;
    letter-spacing: -0.03em;
    line-height: 1.12;
  }

  .title .serif-accent {
    color: #fde68a;
    font-weight: 400;
  }

  .subtitle {
    color: rgba(236, 248, 241, 0.9);
    margin: 0.28rem auto 0;
    max-width: 52ch;
    font-size: 0.88rem;
    line-height: 1.44;
  }

  .hero-tools-row {
    margin: 0.55rem auto 0;
    max-width: 640px;
    display: flex;
    gap: 0.55rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .search-wrap {
    flex: 1;
    min-width: 240px;
  }

  .search-wrap input {
    width: 100%;
    padding: 0.72rem 1.1rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.96);
    color: #0e281c;
    font-family: var(--font-sans);
    font-size: 0.9rem;
  }

  .search-wrap input::placeholder {
    color: #567063;
  }

  .btn-random-spark {
    padding: 0.72rem 1.15rem;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #fde68a 0%, #6ee7b7 100%);
    color: #062016;
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: 0.86rem;
    cursor: pointer;
    transition: transform 0.18s ease;
  }

  .btn-random-spark:hover {
    transform: translateY(-2px);
  }

  .online-pulse-wrap {
    display: flex;
    justify-content: center;
    margin-top: 0.9rem;
  }

  .filters-bar {
    display: flex;
    gap: 0.4rem;
    justify-content: center;
    flex-wrap: wrap;
    margin: 0.45rem 0 0.65rem;
  }

  .filter-chip {
    padding: 0.5rem 0.95rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.1);
    background: rgba(255, 255, 255, 0.92);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.84rem;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .filter-chip:hover {
    border-color: rgba(16, 185, 129, 0.38);
    background: #ffffff;
  }

  .filter-chip.active {
    background: var(--forest-850);
    color: #fde68a;
    border-color: var(--forest-850);
  }

  .empty-box {
    text-align: center;
    padding: 2.4rem 1.5rem;
    background: rgba(255, 255, 255, 0.94);
    border-radius: 24px;
    border: 1px solid rgba(22, 66, 48, 0.09);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.2rem;
  }

  .card {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(22, 66, 48, 0.09);
    border-radius: 22px;
    box-shadow: var(--shadow-sm);
    padding: 0.88rem 1.08rem;
    display: flex;
    flex-direction: column;
    transition: transform 0.24s var(--ease-gentle), box-shadow 0.24s var(--ease-gentle);
  }

  .card-effect-stage :global(.impact-payoff-canvas) {
    height: 76px;
  }

  .card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
  }

  .card.spotlight {
    border: 1.5px solid #f59e0b;
    box-shadow: 0 0 0 4px rgba(253, 230, 138, 0.4), var(--shadow-md);
  }

  .card-meta-top {
    display: flex;
    align-items: center;
    gap: 0.38rem;
    flex-wrap: wrap;
    font-size: 0.76rem;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
  }

  .topic-label {
    font-weight: 700;
    color: var(--text-secondary);
  }

  .quick-tags-inline {
    font-weight: 800;
    color: var(--forest-850);
  }

  .card-evidence-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.72rem;
    background: #ecfdf5;
    color: #047857;
  }

  .card-evidence-badge.tier-C {
    background: #f8fafc;
    color: #334155;
  }

  .card-impact-box {
    margin: 0 0 0.45rem;
    padding-top: 0.35rem;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.16rem;
    font-size: 0.76rem;
    line-height: 1.38;
  }

  .card-benefit-line strong {
    color: #047857;
  }

  .card-partner-line {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-wrap: wrap;
    font-size: 0.74rem;
    color: var(--text-muted);
  }

  .card-chain-line {
    margin-top: 0.45rem;
    padding-top: 0.4rem;
    border-top: 1px dashed rgba(22, 66, 48, 0.12);
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .card-verify-footer {
    margin-top: 0.7rem;
    padding-top: 0.55rem;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    flex-wrap: wrap;
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  .card-source-link {
    color: var(--forest-800);
    font-weight: 700;
    text-decoration: none;
  }

  .card-source-link:hover {
    color: var(--emerald-600);
    text-decoration: underline;
  }

  .card-broken-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 0.72rem;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }

  .card-broken-btn:hover {
    color: #b45309;
  }

  .online-methodology-drawer {
    margin-top: 1.25rem;
  }

  .om-body {
    margin-top: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.55;
  }

  .om-body p {
    margin: 0;
  }

  .om-tiers {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .om-links {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .om-links a {
    color: var(--emerald-600);
    font-weight: 700;
    text-decoration: none;
  }

  .om-links a:hover {
    text-decoration: underline;
  }

  .done-dot {
    color: #047857;
    font-weight: 700;
    white-space: nowrap;
    padding: 0.05rem 0.45rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.1);
  }

  .card-title {
    margin: 0 0 0.25rem;
    font-weight: 800;
    color: var(--text-primary);
    font-size: 1.15rem;
    line-height: 1.28;
    letter-spacing: -0.015em;
  }

  .org-name {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--emerald-600);
    margin-bottom: 0.32rem;
  }

  .card-desc {
    margin: 0 0 0.48rem;
    color: var(--text-secondary);
    line-height: 1.44;
    flex: 1;
    font-size: 0.84rem;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .steps-inline {
    font-size: 0.78rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .steps-inline summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--forest-800);
    list-style: none;
  }

  .steps-inline summary::-webkit-details-marker {
    display: none;
  }

  .steps-inline summary::before {
    content: '▸ ';
    color: var(--emerald-600);
  }

  .steps-inline[open] summary::before {
    content: '▾ ';
  }

  .steps-inline ol {
    margin: 0.45rem 0 0 1.15rem;
    padding: 0;
    line-height: 1.5;
  }

  .actions-row {
    display: flex;
    gap: 0.45rem;
    align-items: center;
    margin-top: auto;
  }

  .cta {
    border-radius: 12px;
    padding: 0.68rem 0.9rem;
    font-family: inherit;
    font-size: 0.84rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    border: 1px solid transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.16s ease;
  }

  .cta.primary {
    flex: 1;
    background: var(--forest-850);
    color: #ffffff;
  }

  .cta.primary:hover {
    background: var(--czech-forest);
  }

  .cta.secondary {
    background: #eef7f1;
    color: #065f46;
    border-color: rgba(5, 150, 105, 0.24);
  }

  .cta.secondary:hover {
    background: #059669;
    color: #ffffff;
  }

  .cta.share-btn {
    background: transparent;
    color: var(--text-muted);
    border-color: rgba(22, 66, 48, 0.1);
    padding: 0.68rem 0.72rem;
  }

  .cta.share-btn:hover {
    background: #f5f9f6;
    color: var(--text-primary);
  }

  .link-show-all {
    border: none;
    background: transparent;
    color: var(--emerald-600);
    font-family: inherit;
    font-weight: 800;
    font-size: 0.82rem;
    cursor: pointer;
    text-decoration: underline;
    padding: 0 0.25rem;
  }

  @media (max-width: 980px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 681px) and (max-width: 980px) {
    .grid > .card:last-child:nth-child(odd) {
      grid-column: 1 / -1;
      width: 100%;
      max-width: calc(50% - 0.6rem);
      justify-self: center;
    }
  }

  @media (max-width: 640px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .page {
      padding: 0.35rem 0.65rem 2.2rem;
      overflow-x: hidden;
      width: 100%;
      box-sizing: border-box;
    }

    .subpage-hero.header {
      padding: 0.82rem 0.8rem 0.75rem;
      margin-bottom: 0.55rem;
      border-radius: 18px;
    }

    .header .hero-kicker,
    .header .subtitle {
      display: none !important;
    }

    .header .title {
      font-size: 1.2rem;
      line-height: 1.18;
      margin: 0;
    }

    .hero-tools-row {
      margin-top: 0.5rem;
      gap: 0.35rem;
      flex-wrap: nowrap;
    }

    .search-wrap {
      flex: 1;
      min-width: 0;
    }

    .search-wrap input {
      padding: 0.42rem 0.65rem;
      font-size: 0.78rem;
      border-radius: 10px;
    }

    .btn-random-spark {
      padding: 0.42rem 0.65rem;
      font-size: 0.75rem;
      border-radius: 10px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .filters-bar,
    .filter-toolbar {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      justify-content: flex-start;
      gap: 0.38rem;
      margin: 0.35rem 0 0.6rem;
      padding: 0.15rem 1.25rem 0.35rem 0.15rem;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      scroll-snap-type: x mandatory;
      scroll-padding: 0 0.5rem;
      mask-image: linear-gradient(to right, black 0%, black calc(100% - 32px), transparent 100%);
      -webkit-mask-image: linear-gradient(to right, black 0%, black calc(100% - 32px), transparent 100%);
    }

    .filters-bar::-webkit-scrollbar,
    .filter-toolbar::-webkit-scrollbar {
      display: none;
    }

    .filter-chip {
      flex: 0 0 auto;
      white-space: nowrap;
      padding: 0.44rem 0.85rem;
      font-size: 0.8rem;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      scroll-snap-align: start;
      box-sizing: border-box;
    }

    .grid {
      grid-template-columns: 1fr;
      gap: 0.85rem;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    .card {
      padding: 0.88rem 0.88rem;
      border-radius: 16px;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    .card-effect-stage :global(.impact-payoff-canvas) {
      height: 66px;
    }

    .card-meta-top {
      font-size: 0.71rem;
      margin-bottom: 0.28rem;
    }

    .card-title {
      font-size: 1.04rem;
      line-height: 1.22;
      margin: 0 0 0.25rem;
    }

    .card-desc {
      font-size: 0.82rem;
      line-height: 1.38;
      margin: 0 0 0.58rem;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-impact-box {
      padding: 0.48rem 0.6rem;
      margin-bottom: 0.55rem;
      font-size: 0.78rem;
      gap: 0.16rem;
    }

    .steps-inline {
      margin-bottom: 0.55rem;
      font-size: 0.76rem;
    }

    .actions-row {
      gap: 0.45rem;
      padding-top: 0.15rem;
    }

    .cta {
      padding: 0.62rem 0.88rem;
      font-size: 0.82rem;
      min-height: 44px;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .card-verify-footer {
      margin-top: 0.55rem;
      padding-top: 0.44rem;
      font-size: 0.68rem;
    }

    .online-methodology-drawer {
      max-width: 100%;
      box-sizing: border-box;
    }

    .online-pulse-wrap {
      max-width: 100%;
      box-sizing: border-box;
    }

    .ambient-pulse-pill {
      max-width: 100%;
      box-sizing: border-box;
      white-space: normal;
      text-align: center;
    }
  }
</style>
