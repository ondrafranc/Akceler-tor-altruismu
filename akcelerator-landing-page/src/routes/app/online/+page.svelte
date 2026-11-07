<script>
  import { onMount } from 'svelte';
  import { trackEvent } from '../../../lib/analytics.js';
  import { MICRO_ACTIONS, VALUES } from '../../../lib/data/czech-actions.js';
  import { recordSmallWin, completedSteps } from '../../../lib/progress.js';

  let activeFilter = 'all';
  let searchQuery = '';
  /** @type {string[]} */
  let savedValues = [];
  let copiedId = '';
  let spotlightId = '';

  // Anti-overwhelm: show only 3 calm cards initially (1 clean row!), expand gently when asked!
  let visibleLimit = 3;

  const FILTERS = [
    { id: 'all', label: '✨ Doporučený výběr' },
    { id: 'free', label: '💸 Zdarma (0 Kč)' },
    { id: 'fast', label: '⚡ Do 5 minut' },
    { id: 'writing', label: '🛋️ Z gauče' },
    { id: 'outdoor', label: '🌿 Na procházce' },
    { id: 'tutoring', label: '💻 Hlavou od PC' },
    { id: 'donation', label: '💚 Drobný dar' }
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

  async function shareAction(action) {
    const shareText = `💡 Tip na malý dobrý skutek (${action.title} – ${action.org}): ${action.url}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: action.title,
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

  function valueLabelsFor(action) {
    return action.values
      .map((k) => VALUES.find((v) => v.key === k)?.shortLabel)
      .filter(Boolean)
      .slice(0, 2);
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
    <div class="hero-kicker">DROBNÉ SKUTKY NA DÁLKU I VENKU • {MICRO_ACTIONS.length} OVĚŘENÝCH PROJEKTŮ</div>
    <h1 class="title">Drobné skutky, které zvládneš <span class="serif-accent">během pár minut</span></h1>
    <p class="subtitle">
      Začínáme třemi ověřenými tipy, ať se ti snadno vybírá. Další si kdykoliv rozbalíš jedním kliknutím nebo si vyfiltruješ přesně to, co tě baví.
    </p>

    <div class="hero-tools-row">
      <div class="search-wrap">
        <input
          type="search"
          bind:value={searchQuery}
          placeholder="Hledat podle slova: útulek, mapování, ptáci, senioři, studánky…"
          aria-label="Hledat v mikro-krocích"
        />
      </div>
      <button type="button" class="btn-random-spark" on:click={pickRandomSpark}>
        ✨ Vybrat náhodný tip
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
        <div
          id={`online-card-${o.id}`}
          class="card"
          class:matched={matchesSavedValues(o)}
          class:spotlight={spotlightId === o.id}
          class:done-card={isCompleted(o.id)}
        >
          <div class="badges">
            {#if isCompleted(o.id)}
              <span class="badge done-b">✓ Vyzkoušeno</span>
            {/if}
            {#if matchesSavedValues(o)}
              <span class="badge match">🎯 Blízké téma</span>
            {/if}
            {#each valueLabelsFor(o) as lbl}
              <span class="badge">{lbl}</span>
            {/each}
          </div>

          <div class="card-title">{o.title}</div>
          <div class="org-name">{o.org}</div>
          <div class="card-desc">{o.desc}</div>

          {#if o.selfBenefit}
            <div class="self-benefit-note">✨ <strong>Co to dá i tobě:</strong> {o.selfBenefit}</div>
          {/if}

          {#if o.reassurance}
            <div class="reassure-note">🛡️ <strong>Bez obav:</strong> {o.reassurance}</div>
          {/if}

          {#if o.steps?.length}
            <details class="steps-details">
              <summary>👣 Jak na to ({o.steps.length} {o.steps.length === 1 ? 'krok' : o.steps.length < 5 ? 'kroky' : 'kroků'})</summary>
              <ol>
                {#each o.steps as step}
                  <li>{step}</li>
                {/each}
              </ol>
            </details>
          {/if}

          <div class="meta">{o.metaLabel}</div>

          <div class="actions-row">
            <a
              class="cta primary"
              href={o.url}
              target="_blank"
              rel="noopener"
              on:click={() => trackEvent('aa_clickout', { surface: 'online', id: o.id })}
            >
              {o.cta || 'Otevřít'} ↗
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
              title="Poslat tip kamarádovi"
              on:click={() => shareAction(o)}
            >
              {copiedId === o.id ? '✓' : '↗'}
            </button>
          </div>
        </div>
      {/each}
    </div>

    {#if remainingCount > 0}
      <div class="calm-more-wrap">
        <button
          type="button"
          class="calm-more-btn"
          on:click={() => (visibleLimit += 6)}
        >
          <span>🌿 Ukázat dalších {Math.min(6, remainingCount)} tipů</span>
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
</div>

<style>
  .page {
    max-width: 1160px;
    margin: 0 auto;
    padding: 0.75rem 1.25rem 4rem;
  }

  .header {
    text-align: center;
  }

  .hero-kicker {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #047857;
    margin-bottom: 0.4rem;
  }

  .title {
    font-family: var(--font-sans);
    font-weight: 800;
    color: #0e281c;
    font-size: clamp(2rem, 3.6vw, 2.85rem);
    margin: 0;
    letter-spacing: -0.03em;
    line-height: 1.12;
  }

  .title .serif-accent {
    color: #059669;
    font-weight: 400;
  }

  .subtitle {
    color: #365244;
    margin: 0.65rem auto 0;
    max-width: 56ch;
    font-size: 0.98rem;
    line-height: 1.6;
  }

  .hero-tools-row {
    margin: 1.25rem auto 0;
    max-width: 680px;
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .search-wrap {
    flex: 1;
    min-width: 240px;
  }

  .search-wrap input {
    width: 100%;
    padding: 0.74rem 1.08rem;
    border-radius: 999px;
    border: 1.5px solid rgba(22, 82, 56, 0.18);
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 8px 20px -10px rgba(14, 40, 28, 0.14);
    color: #0e281c;
    font-family: var(--font-sans);
    font-size: 0.9rem;
  }

  .search-wrap input::placeholder {
    color: #557062;
  }

  .btn-random-spark {
    padding: 0.74rem 1.22rem;
    border-radius: 999px;
    border: 1px solid rgba(18, 56, 40, 0.15);
    background: linear-gradient(135deg, #123828, #1c523a);
    color: #fde68a;
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: 0.86rem;
    cursor: pointer;
    box-shadow: 0 10px 22px -8px rgba(14, 40, 28, 0.25);
    transition: transform 0.18s ease;
  }

  .btn-random-spark:hover {
    transform: translateY(-2px);
  }

  .filters-bar {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
    margin: 1.25rem 0 1.6rem;
  }

  .filter-chip {
    padding: 0.56rem 1rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.1);
    background: rgba(255, 255, 255, 0.92);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.87rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);
  }

  .filter-chip:hover {
    border-color: rgba(16, 185, 129, 0.38);
    background: #ffffff;
    transform: translateY(-1px);
  }

  .filter-chip.active {
    background: var(--forest-850);
    color: #fde68a;
    border-color: var(--forest-850);
  }

  .empty-box {
    text-align: center;
    padding: 2.5rem 1.5rem;
    background: rgba(255, 255, 255, 0.94);
    border-radius: 26px;
    border: 1px solid rgba(22, 66, 48, 0.09);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
  }

  .card {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(22, 66, 48, 0.09);
    border-radius: 24px;
    box-shadow: var(--shadow-sm);
    padding: 1.55rem;
    display: flex;
    flex-direction: column;
    gap: 0.58rem;
    transition: transform 0.24s var(--ease-gentle), box-shadow 0.24s var(--ease-gentle);
  }

  .card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
  }

  .card.spotlight {
    border: 1.5px solid #f59e0b;
    box-shadow: 0 0 0 4px rgba(253, 230, 138, 0.45), var(--shadow-md);
  }

  .badges {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .badge {
    font-size: 0.74rem;
    font-weight: 700;
    padding: 0.22rem 0.6rem;
    border-radius: 999px;
    background: #f3f2ea;
    color: var(--text-secondary);
  }

  .badge.match {
    background: #e8f7ee;
    color: #065f46;
  }

  .badge.done-b {
    background: #ecf5ef;
    color: #164230;
  }

  .card-title {
    font-weight: 800;
    color: var(--text-primary);
    font-size: 1.12rem;
    line-height: 1.3;
    letter-spacing: -0.015em;
  }

  .org-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--emerald-600);
  }

  .card-desc {
    color: var(--text-secondary);
    line-height: 1.58;
    flex: 1;
    font-size: 0.91rem;
  }

  .self-benefit-note {
    font-size: 0.82rem;
    color: #0b3b28;
    background: #eef8f2;
    border-radius: 12px;
    padding: 0.55rem 0.75rem;
    line-height: 1.45;
  }

  .reassure-note {
    font-size: 0.8rem;
    color: #57534e;
    background: #f8f6ef;
    border-radius: 12px;
    padding: 0.5rem 0.75rem;
    line-height: 1.44;
  }

  .steps-details {
    font-size: 0.84rem;
    color: var(--text-secondary);
    background: #faf9f5;
    border: 1px solid rgba(22, 66, 48, 0.08);
    border-radius: 12px;
    padding: 0.5rem 0.78rem;
  }

  .steps-details summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--forest-800);
  }

  .steps-details ol {
    margin: 0.45rem 0 0.15rem 1.15rem;
    padding: 0;
    line-height: 1.5;
  }

  .meta {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  .actions-row {
    display: flex;
    gap: 0.45rem;
    margin-top: 0.35rem;
  }

  .cta {
    border-radius: 13px;
    padding: 0.65rem 0.9rem;
    font-family: inherit;
    font-size: 0.84rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    border: 1px solid transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s ease;
  }

  .cta.primary {
    flex: 1;
    background: var(--forest-850);
    color: #ffffff;
  }

  .cta.primary:hover {
    background: var(--forest-700);
  }

  .cta.secondary {
    background: #ecf7f0;
    color: #0b3b28;
    border-color: rgba(16, 185, 129, 0.24);
  }

  .cta.share-btn {
    background: #f5f3ec;
    color: var(--text-secondary);
  }

  .link-show-all {
    border: none;
    background: transparent;
    color: var(--emerald-600);
    font-family: inherit;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    text-decoration: underline;
    margin-left: 0.35rem;
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
