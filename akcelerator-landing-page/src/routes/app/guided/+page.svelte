<script>
  import { onMount } from 'svelte';
  import { trackEvent } from '../../../lib/analytics.js';
  import {
    VALUES,
    CZECH_CITIES,
    CURATED_FALLBACK_PLACES,
    recommendActions,
    buildFirstContactTemplate
  } from '../../../lib/data/czech-actions.js';
  import { recordSmallWin, completedSteps } from '../../../lib/progress.js';

  const SITUATIONS = [
    {
      id: 'couch',
      emoji: '🛋️',
      title: '2 minuty z domova',
      sub: 'Rychlý skutek z mobilu nebo počítače, zdarma',
      timeBucket: '5',
      mode: 'online',
      social: 'solo',
      cost: 'free'
    },
    {
      id: 'focus',
      emoji: '💻',
      title: '15 minut u počítače',
      sub: 'Mapování, občanská věda nebo vytřídění věcí doma',
      timeBucket: '15',
      mode: 'online',
      social: 'solo',
      cost: 'free'
    },
    {
      id: 'walk',
      emoji: '🌿',
      title: 'Při procházce venku',
      sub: 'Spojit čerstvý vzduch s užitečnou věcí v okolí',
      timeBucket: '15',
      mode: 'local',
      social: 'solo',
      cost: 'free'
    },
    {
      id: 'people',
      emoji: '🤝',
      title: 'Mezi lidmi v partě',
      sub: 'Společná výpomoc nebo akce ve městě či přírodě',
      timeBucket: '45',
      mode: 'local',
      social: 'group',
      cost: 'free'
    },
    {
      id: 'donate',
      emoji: '💚',
      title: 'Poslat drobný dar',
      sub: 'Od 50 Kč online přímo na konkrétní pomoc',
      timeBucket: '5',
      mode: 'online',
      social: 'solo',
      cost: 'donation'
    }
  ];

  let activeSituationId = 'couch';
  /** @type {string[]} */
  let selectedTopics = [];
  let cityId = 'praha';
  let rotationSeed = 0;
  let lastShownActionId = '';
  let excludePrevId = '';
  let openTemplateId = null;
  let copiedTemplateId = null;
  let planFlash = false;
  let localDrawerOpen = false;

  $: activeSituation = SITUATIONS.find((s) => s.id === activeSituationId) || SITUATIONS[0];
  $: localDrawerOpen = activeSituationId === 'walk' || activeSituationId === 'people';
  $: completedIds = ($completedSteps || []).map((s) => s.id);

  $: recommendations = recommendActions({
    values: selectedTopics,
    timeBucket: activeSituation.timeBucket,
    cost: activeSituation.cost,
    mode: activeSituation.mode,
    social: activeSituation.social,
    completedIds,
    excludeIds: excludePrevId ? [excludePrevId] : [],
    seed: `${activeSituationId}:${selectedTopics.join(',')}:${rotationSeed}`
  });

  $: bestAction = recommendations[0] || null;
  $: if (bestAction?.id) {
    lastShownActionId = bestAction.id;
  }

  $: sideAlternatives = recommendations.slice(1, 4);
  $: activeCity = CZECH_CITIES.find((c) => c.id === cityId) || CZECH_CITIES[0];

  $: targetMapKinds = (() => {
    const s = new Set();
    for (const vKey of selectedTopics) {
      const found = VALUES.find((v) => v.key === vKey);
      if (found?.mapKinds) {
        for (const mk of found.mapKinds) s.add(mk);
      }
    }
    return s.size ? Array.from(s) : ['animals', 'food', 'community', 'ngo'];
  })();

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  $: localMatches = (() => {
    const withDist = CURATED_FALLBACK_PLACES.map((p) => ({
      ...p,
      distKm: Math.round(haversineKm(activeCity.lat, activeCity.lon, p.lat, p.lon) * 10) / 10,
      kindMatch: targetMapKinds.includes(p.kind) ? 1 : 0
    }));

    const nearby = withDist.filter((p) => p.distKm <= 32);
    const pool = nearby.length >= 2 ? nearby : withDist;

    return pool
      .sort((a, b) => {
        if (b.kindMatch !== a.kindMatch) return b.kindMatch - a.kindMatch;
        return a.distKm - b.distKm;
      })
      .slice(0, 3);
  })();

  $: nearUrl = `/near?lat=${activeCity.lat}&lon=${activeCity.lon}&r=10&kinds=${encodeURIComponent(targetMapKinds.join(','))}`;

  function selectSituation(id) {
    if (activeSituationId === id) {
      cycleRecommendation();
      return;
    }
    excludePrevId = lastShownActionId;
    activeSituationId = id;
    rotationSeed = 0;
    triggerPlanPulse();
    persistPrefs();
    trackEvent('aa_guided_situation', { situation: id });
  }

  function toggleTopic(key) {
    excludePrevId = lastShownActionId;
    if (key === 'all') {
      selectedTopics = [];
    } else if (selectedTopics.includes(key)) {
      selectedTopics = selectedTopics.filter((x) => x !== key);
    } else {
      selectedTopics = [...selectedTopics, key].slice(-2);
    }
    rotationSeed = 0;
    triggerPlanPulse();
    persistPrefs();
    trackEvent('aa_guided_topic_toggle', { topics: selectedTopics.join(',') });
  }

  function cycleRecommendation() {
    excludePrevId = lastShownActionId;
    rotationSeed += 1;
    triggerPlanPulse();
    trackEvent('aa_guided_cycle_tip', { seed: rotationSeed, situation: activeSituationId });
  }

  function promoteAlternative(altAction) {
    excludePrevId = '';
    const idx = recommendations.findIndex((r) => r.id === altAction.id);
    if (idx > 0) {
      rotationSeed += idx;
    } else {
      rotationSeed += 1;
    }
    triggerPlanPulse();
    const el = document.getElementById('personal-plan');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function triggerPlanPulse() {
    planFlash = true;
    setTimeout(() => {
      planFlash = false;
    }, 600);
  }

  function persistPrefs() {
    try {
      localStorage.setItem('aa_values', JSON.stringify(selectedTopics));
      localStorage.setItem('aa_guided_values_v2', JSON.stringify(selectedTopics));
      localStorage.setItem('aa_prefs_near', JSON.stringify({ situation: activeSituationId, cityId }));
    } catch {}
  }

  async function copyTemplate(place) {
    try {
      const tpl = buildFirstContactTemplate(place);
      await navigator.clipboard.writeText(tpl.body);
      copiedTemplateId = place.id;
      setTimeout(() => {
        if (copiedTemplateId === place.id) copiedTemplateId = null;
      }, 2500);
    } catch {}
  }

  function isDone(id) {
    return ($completedSteps || []).some((s) => s.id === id);
  }

  onMount(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const topicParam = sp.get('topic');
      if (topicParam && VALUES.some((v) => v.key === topicParam)) {
        selectedTopics = [topicParam];
        localStorage.setItem('aa_values', JSON.stringify(selectedTopics));
        return;
      }
      const s = JSON.parse(localStorage.getItem('aa_values') || localStorage.getItem('aa_guided_values_v2') || '[]');
      if (Array.isArray(s) && s.length) {
        selectedTopics = s.filter((k) => VALUES.some((v) => v.key === k)).slice(0, 2);
      }
      const nearSaved = JSON.parse(localStorage.getItem('aa_prefs_near') || '{}');
      if (nearSaved?.cityId && CZECH_CITIES.some((c) => c.id === nearSaved.cityId)) {
        cityId = nearSaved.cityId;
      }
    } catch {}
  });
</script>

<svelte:head>
  <title>Průvodce dobrými skutky — Akcelerátor altruismu</title>
</svelte:head>

<div class="page">
  <!-- =====================================================================
       SUNLIT MEADOW EDITORIAL HEADER
       ===================================================================== -->
  <header class="subpage-hero header">
    <div class="hero-kicker">PRŮVODCE DOBRÝMI SKUTKY • NA MÍRU TVÉMU ČASU</div>
    <h1 class="title">Jak chceš dneska <span class="serif-accent">pomoct</span>?</h1>
    <p class="subtitle">
      Vyber si, kolik máš zrovna teď času a jaké téma je ti nejbližší. Hned uvidíš <strong>jeden konkrétní, ověřený skutek</strong>, do kterého se můžeš bez složitého hledání pustit.
    </p>
  </header>

  <!-- =====================================================================
       SIDE-BY-SIDE LIVE COMPASS WORKSPACE (DESKTOP 2-COL, MOBILE STACKED)
       ===================================================================== -->
  <div class="guided-workspace">
    <!-- LEFT: 2 CALM CHOICES -->
    <section class="compass-shell" aria-label="Nastavení průvodce">
      <div class="step-block">
        <div class="block-head">
          <span class="step-badge">1</span>
          <h2>Kolik máš zrovna teď času a sil?</h2>
        </div>

        <div class="situation-grid" role="radiogroup" aria-label="Dnešní situace a kapacita">
          {#each SITUATIONS as s}
            <button
              type="button"
              class="situation-card"
              class:active={activeSituationId === s.id}
              aria-pressed={activeSituationId === s.id}
              on:click={() => selectSituation(s.id)}
            >
              <span class="sit-emoji">{s.emoji}</span>
              <div class="sit-copy">
                <span class="sit-title">{s.title}</span>
                <span class="sit-sub">{s.sub}</span>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <div class="divider"></div>

      <div class="step-block">
        <div class="block-head">
          <span class="step-badge">2</span>
          <h2>Komu nebo čemu chceš pomoct? <span class="opt-tag">(volitelné, max 2)</span></h2>
        </div>

        <div class="topic-pills" role="group" aria-label="Výběr tématu pomoci">
          <button
            type="button"
            class="topic-pill"
            class:selected={selectedTopics.length === 0}
            on:click={() => toggleTopic('all')}
          >
            ✨ Cokoliv užitečného
          </button>
          {#each VALUES as v}
            <button
              type="button"
              class="topic-pill"
              class:selected={selectedTopics.includes(v.key)}
              on:click={() => toggleTopic(v.key)}
            >
              {v.shortLabel || v.label}
            </button>
          {/each}
        </div>
      </div>
    </section>

    <!-- RIGHT: LIVE PERSONAL RECOMMENDATION (#personal-plan) -->
    <section id="personal-plan" class="plan-section" class:flash={planFlash} aria-live="polite">
      {#if bestAction}
        <div class="card highlight-card">
          <div class="rec-header">
            <span class="rec-pill">
              {activeSituation.emoji} {activeSituation.title}
              {#if selectedTopics.length > 0}
                • {selectedTopics.map((k) => VALUES.find((v) => v.key === k)?.shortLabel).filter(Boolean).join(' + ')}
              {/if}
            </span>
            {#if isDone(bestAction.id)}
              <span class="done-tag">✓ Splněno — svítí v Krajině dobra</span>
            {/if}
          </div>

          <h2 class="rec-title">{bestAction.title}</h2>
          <div class="rec-org">Organizace: <strong>{bestAction.org}</strong></div>

          <div class="reasons">
            {#if bestAction.reasons?.length}
              {#each bestAction.reasons as r}
                <span class="reason-badge">{r}</span>
              {/each}
            {/if}
            <span class="reason-badge meta">{bestAction.metaLabel}</span>
          </div>

          <p class="rec-desc">{bestAction.desc}</p>

          <div class="benefit-boxes">
            {#if bestAction.selfBenefit}
              <div class="benefit-box self">
                <strong>✨ Co to přinese i tobě:</strong> {bestAction.selfBenefit}
              </div>
            {/if}
            {#if bestAction.concreteImpact}
              <div class="benefit-box impact">
                <strong>✦ Konkrétní dopad:</strong> {bestAction.concreteImpact}
              </div>
            {/if}
          </div>

          {#if bestAction.reassurance}
            <div class="reassurance-box">
              <strong>🛡️ Prakticky:</strong> {bestAction.reassurance}
            </div>
          {/if}

          {#if bestAction.whyItMatters}
            <div class="why-box">
              <strong>Proč to pomáhá:</strong> {bestAction.whyItMatters}
            </div>
          {/if}

          {#if bestAction.steps?.length}
            <div class="steps-box">
              <div class="steps-title">👣 Jak na to krok za krokem:</div>
              <ol class="steps-list">
                {#each bestAction.steps as step}
                  <li>{step}</li>
                {/each}
              </ol>
            </div>
          {/if}

          <div class="cta-row">
            <a
              class="btn-gold-action"
              href={bestAction.url}
              target="_blank"
              rel="noopener noreferrer"
              on:click={() =>
                trackEvent('aa_clickout', {
                  surface: 'guided_best',
                  id: bestAction.id
                })}
            >
              <span>{bestAction.cta || 'Otevřít a udělat tenhle skutek'}</span>
              <span>↗</span>
            </a>

            <button
              type="button"
              class="btn-done-action"
              on:click={() =>
                recordSmallWin({
                  id: bestAction.id,
                  title: bestAction.title,
                  surface: 'guided'
                })}
            >
              ✓ Mám hotovo
            </button>

            <button type="button" class="btn-next-action" on:click={cycleRecommendation}>
              🔄 Jiný nápad
            </button>
          </div>
        </div>
      {/if}

      <!-- OPTIONAL ALTERNATIVES — COLLAPSED BY DEFAULT -->
      {#if sideAlternatives.length}
        <details class="calm-drawer alts-drawer">
          <summary>
            <span>🌿 Porovnat ještě {sideAlternatives.length} další nápady pro tohle nastavení</span>
          </summary>
          <div class="alts-grid">
            {#each sideAlternatives as alt (alt.id)}
              <article class="alt-card">
                <div class="alt-meta">{alt.metaLabel}</div>
                <h4>{alt.title}</h4>
                <div class="alt-org">{alt.org}</div>
                <p>{alt.desc}</p>
                <div class="alt-actions">
                  <a
                    href={alt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="alt-open"
                    on:click={() => trackEvent('aa_clickout', { surface: 'guided_alt', id: alt.id })}
                  >
                    Otevřít ↗
                  </a>
                  <button type="button" class="alt-detail" on:click={() => promoteAlternative(alt)}>
                    Ukázat postup ↑
                  </button>
                </div>
              </article>
            {/each}
          </div>
        </details>
      {/if}
    </section>
  </div>

  <!-- =====================================================================
       LOCAL PLACES IN YOUR CITY — AUTO-OPENED ONLY FOR WALK / PEOPLE!
       ===================================================================== -->
  <details class="calm-drawer local-drawer" bind:open={localDrawerOpen}>
    <summary>
      <span>📍 Místa pomoci v okolí města {activeCity.name} — {localDrawerOpen ? 'otevřeno pro osobní zapojení venku' : 'zobrazit místa pro osobní návštěvu'}</span>
    </summary>

    <section class="local-section" aria-label="Místa v okolí">
      <div class="local-head">
        <div>
          <span class="sec-kicker">Osobní pomoc v regionu • Hotový vzor první zprávy</span>
          <h2>Kam se můžeš ozvat nebo zajít poblíž města</h2>
        </div>

        <div class="city-picker-wrap">
          <label for="guided-city-select">📍 Nejbližší město:</label>
          <select
            id="guided-city-select"
            bind:value={cityId}
            on:change={persistPrefs}
            class="city-select"
          >
            {#each CZECH_CITIES as c}
              <option value={c.id}>{c.name}</option>
            {/each}
          </select>
          <a href={nearUrl} class="map-jump-link">Otevřít plnou mapu →</a>
        </div>
      </div>

      <div class="local-grid">
        {#each localMatches as place (place.id)}
          {@const tpl = buildFirstContactTemplate(place)}
          <article class="local-card">
            <div class="lc-top">
              <span class="lc-subcat">{place.subcategory || 'Místo pomoci'}</span>
              <span class="lc-dist">~{place.distKm} km ({activeCity.name})</span>
            </div>
            <h3>{place.name}</h3>
            <p class="lc-desc">{place.description}</p>
            {#if place.quickMission}
              <div class="lc-mission">💡 <strong>Jak pomoct:</strong> {place.quickMission}</div>
            {/if}
            {#if place.address}
              <div class="lc-addr">📍 {place.address}</div>
            {/if}

            <div class="lc-actions">
              {#if place.website}
                <a href={place.website} target="_blank" rel="noopener noreferrer" class="lc-btn primary">
                  Web organizace ↗
                </a>
              {/if}
              <button
                type="button"
                class="lc-btn ghost"
                on:click={() => (openTemplateId = openTemplateId === place.id ? null : place.id)}
              >
                💬 Vzor první zprávy
              </button>
            </div>

            {#if openTemplateId === place.id}
              <div class="tpl-drawer">
                <pre>{tpl.body}</pre>
                <div class="tpl-btns">
                  <button type="button" on:click={() => copyTemplate(place)}>
                    {copiedTemplateId === place.id ? '✓ Text zkopírován!' : '📋 Zkopírovat zprávu'}
                  </button>
                  {#if tpl.mailtoUrl}
                    <a href={tpl.mailtoUrl}>✉️ Otevřít v e-mailu</a>
                  {/if}
                </div>
              </div>
            {/if}
          </article>
        {/each}
      </div>
    </section>
  </details>
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
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.11em;
    color: #fde68a;
    margin-bottom: 0.35rem;
  }

  .title {
    font-family: var(--font-sans);
    font-weight: 800;
    color: #ffffff;
    font-size: clamp(1.95rem, 3.4vw, 2.7rem);
    margin: 0;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .title .serif-accent {
    color: #fde68a;
    font-weight: 400;
  }

  .subtitle {
    color: rgba(236, 248, 241, 0.9);
    margin: 0.55rem auto 0;
    max-width: 58ch;
    font-size: 0.96rem;
    line-height: 1.58;
  }

  .subtitle strong {
    color: #a7f3d0;
  }

  /* SIDE-BY-SIDE WORKSPACE */
  .guided-workspace {
    display: grid;
    grid-template-columns: 0.92fr 1.08fr;
    gap: 1.45rem;
    align-items: start;
  }

  /* COMPASS SHELL */
  .compass-shell {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(22, 82, 56, 0.12);
    border-radius: 26px;
    padding: 1.45rem 1.5rem;
    box-shadow: var(--shadow-md);
  }

  .block-head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.8rem;
  }

  .step-badge {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #123828;
    color: #fde68a;
    font-weight: 800;
    font-size: 0.8rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .block-head h2 {
    margin: 0;
    font-size: 1.04rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .opt-tag {
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .situation-grid {
    display: flex;
    flex-direction: column;
    gap: 0.52rem;
  }

  .situation-card {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    text-align: left;
    padding: 0.78rem 0.95rem;
    border-radius: 16px;
    background: #f5f9f6;
    border: 1.5px solid rgba(22, 82, 56, 0.1);
    cursor: pointer;
    font-family: var(--font-sans);
    transition: all 0.18s ease;
  }

  .situation-card:hover {
    border-color: rgba(16, 185, 129, 0.45);
    background: #ffffff;
  }

  .situation-card.active {
    background: linear-gradient(135deg, #e6f7ed 0%, #fef9e7 100%);
    border-color: #059669;
    color: #0b261b;
    box-shadow: 0 8px 20px -10px rgba(5, 150, 105, 0.35);
  }

  .sit-emoji {
    font-size: 1.35rem;
    flex-shrink: 0;
  }

  .sit-copy {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
  }

  .sit-title {
    font-weight: 800;
    font-size: 0.9rem;
    color: #0e281c;
  }

  .sit-sub {
    font-size: 0.77rem;
    line-height: 1.35;
    color: var(--text-secondary);
  }

  .divider {
    height: 1px;
    background: rgba(22, 82, 56, 0.09);
    margin: 1.15rem 0;
  }

  .topic-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .topic-pill {
    padding: 0.48rem 0.88rem;
    border-radius: 999px;
    border: 1.5px solid rgba(22, 82, 56, 0.13);
    background: #f5f9f6;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .topic-pill:hover {
    border-color: rgba(16, 185, 129, 0.45);
    background: #ffffff;
  }

  .topic-pill.selected {
    background: #123828;
    border-color: #123828;
    color: #fde68a;
    box-shadow: 0 6px 14px -4px rgba(18, 56, 40, 0.25);
  }

  /* LIVE PERSONAL PLAN (CALM BRIGHT SAGE-IVORY CARD) */
  .plan-section {
    position: sticky;
    top: 5.2rem;
    transition: transform 0.25s ease;
  }

  .plan-section.flash .highlight-card {
    box-shadow:
      0 22px 44px -14px rgba(16, 185, 129, 0.24),
      0 0 0 2px rgba(16, 185, 129, 0.55);
  }

  .highlight-card {
    background: linear-gradient(165deg, #ffffff 0%, #f3f9f5 100%);
    color: var(--text-primary);
    border-radius: 26px;
    padding: 1.8rem;
    border: 1.5px solid rgba(16, 185, 129, 0.28);
    box-shadow: var(--shadow-lg);
    transition: box-shadow 0.25s ease;
  }

  .rec-header {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.65rem;
  }

  .rec-pill {
    padding: 0.28rem 0.75rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.28);
    color: #065f46;
    font-size: 0.77rem;
    font-weight: 800;
  }

  .done-tag {
    padding: 0.28rem 0.75rem;
    border-radius: 999px;
    background: #fef3c7;
    color: #92400e;
    font-size: 0.77rem;
    font-weight: 800;
  }

  .rec-title {
    margin: 0 0 0.3rem;
    font-size: clamp(1.3rem, 2.2vw, 1.65rem);
    font-weight: 800;
    color: #0e281c;
    line-height: 1.22;
  }

  .rec-org {
    font-size: 0.88rem;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
  }

  .rec-org strong {
    color: #047857;
  }

  .reasons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.85rem;
  }

  .reason-badge {
    padding: 0.24rem 0.64rem;
    border-radius: 999px;
    background: #edf5f0;
    color: #164230;
    font-size: 0.76rem;
    font-weight: 700;
  }

  .reason-badge.meta {
    background: #fef7e0;
    color: #92400e;
  }

  .rec-desc {
    font-size: 0.95rem;
    line-height: 1.58;
    color: var(--text-secondary);
    margin: 0 0 0.9rem;
  }

  .benefit-boxes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 0.55rem;
    margin-bottom: 0.75rem;
  }

  .benefit-box {
    padding: 0.62rem 0.8rem;
    border-radius: 13px;
    font-size: 0.83rem;
    line-height: 1.45;
  }

  .benefit-box.self {
    background: #ecfdf5;
    border: 1px solid rgba(16, 185, 129, 0.22);
    color: #0b2e20;
  }

  .benefit-box.impact {
    background: #fffbeb;
    border: 1px solid rgba(245, 158, 11, 0.25);
    color: #451a03;
  }

  .reassurance-box,
  .why-box {
    padding: 0.62rem 0.85rem;
    border-radius: 13px;
    background: #f5f9f6;
    border: 1px solid rgba(22, 82, 56, 0.09);
    font-size: 0.84rem;
    color: var(--text-secondary);
    margin-bottom: 0.65rem;
    line-height: 1.46;
  }

  .reassurance-box strong,
  .why-box strong {
    color: #0e281c;
  }

  .steps-box {
    padding: 0.88rem 1rem;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid rgba(22, 82, 56, 0.12);
    margin-bottom: 1.15rem;
  }

  .steps-title {
    font-weight: 800;
    font-size: 0.84rem;
    color: #047857;
    margin-bottom: 0.4rem;
  }

  .steps-list {
    margin: 0;
    padding-left: 1.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.86rem;
    color: var(--text-primary);
    line-height: 1.46;
  }

  .cta-row {
    display: flex;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .btn-gold-action {
    flex: 1;
    min-width: 200px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.85rem 1.25rem;
    border-radius: 14px;
    background: linear-gradient(135deg, #0f3626 0%, #17523a 100%);
    color: #ffffff;
    font-weight: 800;
    font-size: 0.9rem;
    text-decoration: none;
    box-shadow: 0 10px 22px -6px rgba(15, 54, 38, 0.35);
    transition: transform 0.18s ease;
  }

  .btn-gold-action:hover {
    transform: translateY(-2px);
  }

  .btn-done-action {
    padding: 0.85rem 1.05rem;
    border-radius: 14px;
    border: 1.5px solid rgba(5, 150, 105, 0.35);
    background: #ecfdf5;
    color: #065f46;
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: 0.86rem;
    cursor: pointer;
  }

  .btn-done-action:hover {
    background: #059669;
    color: #ffffff;
  }

  .btn-next-action {
    padding: 0.85rem 1rem;
    border-radius: 14px;
    border: 1px solid rgba(22, 82, 56, 0.16);
    background: #ffffff;
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .btn-next-action:hover {
    border-color: #059669;
    color: #0e281c;
  }

  /* ALTERNATIVES */
  .alts-drawer {
    margin-top: 0.95rem;
  }

  .alts-drawer .alts-grid {
    margin-top: 0.9rem;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .alt-card {
    background: #ffffff;
    border: 1px solid rgba(22, 82, 56, 0.1);
    border-radius: 18px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-sm);
  }

  .alt-meta {
    font-size: 0.72rem;
    font-weight: 700;
    color: #059669;
    margin-bottom: 0.25rem;
  }

  .alt-card h4 {
    margin: 0 0 0.2rem;
    font-size: 0.9rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .alt-org {
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--text-muted);
    margin-bottom: 0.4rem;
  }

  .alt-card p {
    margin: 0 0 0.75rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.44;
    flex: 1;
  }

  .alt-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.45rem;
  }

  .alt-open {
    font-size: 0.8rem;
    font-weight: 800;
    color: #0f3626;
    text-decoration: none;
  }

  .alt-detail {
    padding: 0.28rem 0.6rem;
    border-radius: 8px;
    border: 1px solid rgba(22, 82, 56, 0.14);
    background: #f5f9f6;
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--text-primary);
    cursor: pointer;
  }

  /* LOCAL PLACES */
  .local-drawer {
    margin-top: 1.4rem;
  }

  .local-drawer .local-section {
    margin-top: 1rem;
  }

  .local-section {
    background: #ffffff;
    border: 1px solid rgba(22, 82, 56, 0.1);
    border-radius: 24px;
    padding: 1.55rem;
    box-shadow: var(--shadow-sm);
  }

  .local-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.2rem;
  }

  .sec-kicker {
    display: block;
    font-size: 0.73rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #059669;
    margin-bottom: 0.2rem;
  }

  .local-head h2 {
    margin: 0;
    font-size: 1.32rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .city-picker-wrap {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .city-picker-wrap label {
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .city-select {
    padding: 0.5rem 0.85rem;
    border-radius: 12px;
    border: 1.5px solid rgba(22, 82, 56, 0.18);
    background: #f5f9f6;
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: 0.88rem;
    color: var(--text-primary);
    cursor: pointer;
  }

  .map-jump-link {
    font-size: 0.84rem;
    font-weight: 800;
    color: #059669;
    text-decoration: none;
  }

  .local-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .local-card {
    padding: 1.15rem;
    border-radius: 20px;
    background: #f5f9f6;
    border: 1px solid rgba(22, 82, 56, 0.09);
    display: flex;
    flex-direction: column;
  }

  .lc-top {
    display: flex;
    justify-content: space-between;
    gap: 0.4rem;
    font-size: 0.74rem;
    font-weight: 800;
    color: #059669;
    margin-bottom: 0.35rem;
  }

  .lc-dist {
    color: var(--text-muted);
  }

  .local-card h3 {
    margin: 0 0 0.35rem;
    font-size: 0.98rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .lc-desc {
    margin: 0 0 0.6rem;
    font-size: 0.83rem;
    color: var(--text-secondary);
    line-height: 1.45;
    flex: 1;
  }

  .lc-mission {
    padding: 0.48rem 0.65rem;
    border-radius: 10px;
    background: #ffffff;
    font-size: 0.78rem;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }

  .lc-addr {
    font-size: 0.76rem;
    color: var(--text-muted);
    margin-bottom: 0.7rem;
  }

  .lc-actions {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .lc-btn {
    padding: 0.45rem 0.75rem;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
    font-family: var(--font-sans);
  }

  .lc-btn.primary {
    background: #123828;
    color: #fde68a;
    border: none;
  }

  .lc-btn.ghost {
    background: #ffffff;
    border: 1px solid rgba(22, 82, 56, 0.16);
    color: var(--text-primary);
  }

  .tpl-drawer {
    margin-top: 0.65rem;
    padding: 0.65rem;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid rgba(22, 82, 56, 0.12);
  }

  .tpl-drawer pre {
    white-space: pre-wrap;
    font-family: var(--font-sans);
    font-size: 0.76rem;
    color: var(--text-secondary);
    margin: 0 0 0.5rem;
    line-height: 1.42;
  }

  .tpl-btns {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .tpl-btns button,
  .tpl-btns a {
    padding: 0.35rem 0.65rem;
    border-radius: 8px;
    border: none;
    background: #065f46;
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
  }

  @media (max-width: 980px) {
    .guided-workspace {
      grid-template-columns: 1fr;
    }
    .plan-section {
      position: static;
    }
    .alts-drawer .alts-grid,
    .local-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .compass-shell,
    .highlight-card {
      padding: 1.25rem 1.1rem;
    }
  }
</style>
