<script>
  import { onMount } from 'svelte';
  import {
    trackEvent,
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

  let activeFilter = 'all';
  let searchQuery = '';
  /** @type {string[]} */
  let savedValues = [];
  let copiedId = '';
  let spotlightId = '';
  let visibleLimit = 3;

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
    try {
      const sp = new URLSearchParams(window.location.search);
      const fParam = sp.get('filter');
      if (fParam && FILTERS.some((f) => f.id === fParam)) {
        activeFilter = fParam;
        visibleLimit = 6;
      }
      const s = JSON.parse(localStorage.getItem('aa_values') || localStorage.getItem('aa_guided_values_v2') || '[]');
      if (Array.isArray(s)) savedValues = s;
    } catch {}
  });

  function cleanTitle(str) {
    return String(str || '').replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\s]+/u, '').trim() || str;
  }

  function cleanMeta(str) {
    return String(str || '')
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]/gu, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  async function shareAction(action) {
    const shareText = `Tip na drobný dobrý skutek (${cleanTitle(action.title)} – ${action.org}): ${action.url}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: cleanTitle(action.title),
          text: shareText,
          url: action.url
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        copiedId = action.id;
        setTimeout(() => {
          if (copiedId === action.id) copiedId = '';
        }, 2500);
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
  <title>Online mikro-kroky a drobná pomoc — Akcelerátor altruismu</title>
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
          bind:value={searchQuery}
          placeholder="Hledat: útulek, mapování, ptáci, senioři, studánky…"
          aria-label="Hledat v mikro-krocích"
        />
      </div>
      <button type="button" class="btn-random-spark" on:click={pickRandomSpark}>
        ✨ Náhodný tip
      </button>
    </div>
  </header>

  <div class="filters-bar" role="group" aria-label="Filtrovat mikro-kroky">
    {#each FILTERS as f}
      <button
        type="button"
        class="filter-chip"
        class:active={activeFilter === f.id}
        on:click={() => {
          activeFilter = f.id;
          visibleLimit = 3;
          trackEvent('aa_online_filter', { filter: f.id });
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
      {#each visibleActions as o (o.id)}
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
              Důkazy {o.impactEvidence || 'B'}
            </span>
            {#if isCompleted(o.id)}
              <span class="done-dot">· ✓ Splněno</span>
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

          <!-- 4. Akční tlačítka -->
          <div class="actions-row">
            <a
              class="cta primary"
              href={o.url}
              target="_blank"
              rel="noopener noreferrer"
              on:click={() => {
                markActionStarted(o.id, 'online');
                trackEvent('aa_clickout', { surface: 'online', id: o.id });
              }}
            >
              Začít pomáhat ↗
            </a>
            <button
              type="button"
              class="cta secondary"
              on:click={() =>
                recordSmallWin({
                  id: o.id,
                  title: o.title,
                  surface: 'online'
                })}
            >
              ✓ Hotovo
            </button>
            <button
              type="button"
              class="cta share-btn"
              title="Sdílet odkaz"
              aria-label="Sdílet odkaz"
              on:click={() => shareAction(o)}
            >
              {copiedId === o.id ? '✓' : '↗'}
            </button>
          </div>

          <!-- 5. Patička ověření + Nahlásit nefunkční odkaz -->
          <div class="card-verify-footer">
            <span>
              Ověřeno: <strong>{o.lastVerifiedAt || '11/2026'}</strong> · Zdroj:
              <a
                href={o.sourceUrl || o.url}
                target="_blank"
                rel="noopener noreferrer"
                class="card-source-link"
              >
                {o.org} ↗
              </a>
            </span>
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
          </div>
        </article>
      {/each}
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
    padding: 0.75rem 1.25rem 4rem;
  }

  .header {
    text-align: center;
  }

  .hero-kicker {
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #fde68a;
    margin-bottom: 0.35rem;
  }

  .title {
    font-family: var(--font-sans);
    font-weight: 800;
    color: #ffffff;
    font-size: clamp(2rem, 3.5vw, 2.75rem);
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
    margin: 0.55rem auto 0;
    max-width: 52ch;
    font-size: 0.96rem;
    line-height: 1.58;
  }

  .hero-tools-row {
    margin: 1.2rem auto 0;
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

  .filters-bar {
    display: flex;
    gap: 0.45rem;
    justify-content: center;
    flex-wrap: wrap;
    margin: 1.15rem 0 1.5rem;
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
    border-radius: 24px;
    box-shadow: var(--shadow-sm);
    padding: 1.65rem;
    display: flex;
    flex-direction: column;
    transition: transform 0.24s var(--ease-gentle), box-shadow 0.24s var(--ease-gentle);
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
    margin: 0 0 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.8rem;
    line-height: 1.45;
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
    margin-top: 2rem;
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
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--emerald-600);
    margin-bottom: 0.55rem;
  }

  .card-desc {
    margin: 0 0 0.85rem;
    color: var(--text-secondary);
    line-height: 1.58;
    flex: 1;
    font-size: 0.9rem;
  }

  .steps-inline {
    font-size: 0.82rem;
    color: var(--text-secondary);
    margin-bottom: 0.9rem;
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

  @media (max-width: 640px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
