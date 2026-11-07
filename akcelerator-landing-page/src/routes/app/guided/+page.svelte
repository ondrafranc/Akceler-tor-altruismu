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
      sub: 'Rychlý skutek z mobilu',
      timeBucket: '5',
      mode: 'online',
      social: 'solo',
      cost: 'free'
    },
    {
      id: 'focus',
      emoji: '💻',
      title: '15 minut u počítače',
      sub: 'Mapování nebo věda z domova',
      timeBucket: '15',
      mode: 'online',
      social: 'solo',
      cost: 'free'
    },
    {
      id: 'walk',
      emoji: '🌿',
      title: 'Při procházce venku',
      sub: 'Užitečná věc cestou v okolí',
      timeBucket: '15',
      mode: 'local',
      social: 'solo',
      cost: 'free'
    },
    {
      id: 'people',
      emoji: '🤝',
      title: 'Mezi lidmi v partě',
      sub: 'Společná akce ve městě či přírodě',
      timeBucket: '45',
      mode: 'local',
      social: 'group',
      cost: 'free'
    },
    {
      id: 'donate',
      emoji: '💚',
      title: 'Poslat drobný dar',
      sub: 'Od 50 Kč přímo na pomoc',
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

  function cleanTitle(str) {
    return String(str || '').replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\s]+/u, '').trim() || str;
  }

  function cleanMeta(str) {
    return String(str || '')
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]/gu, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

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
    }, 500);
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
  <header class="subpage-hero header">
    <div class="hero-kicker">PRŮVODCE NA MÍRU</div>
    <h1 class="title">Jak chceš dneska <span class="serif-accent">pomoct</span>?</h1>
    <p class="subtitle">
      Zvol si, kolik máš zrovna času a jaké téma ti je blízké — hned uvidíš jeden konkrétní, ověřený skutek.
    </p>
  </header>

  <div class="guided-workspace">
    <!-- LEFT: 2 CALM CHOICES -->
    <section class="compass-shell" aria-label="Nastavení průvodce">
      <div class="step-block">
        <div class="block-label">1. Kolik máš zrovna času?</div>

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
        <div class="block-label">2. Blízké téma <span class="opt-tag">(volitelné)</span></div>

        <div class="topic-pills" role="group" aria-label="Výběr tématu pomoci">
          <button
            type="button"
            class="topic-pill"
            class:selected={selectedTopics.length === 0}
            on:click={() => toggleTopic('all')}
          >
            ✨ Cokoliv
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

    <!-- RIGHT: CLEAN FOCUSED RECOMMENDATION (ZERO NESTED COLORED BOXES) -->
    <section id="personal-plan" class="plan-section" class:flash={planFlash} aria-live="polite">
      {#if bestAction}
        <div class="card highlight-card">
          <div class="rec-top-row">
            <div class="rec-meta-line">
              <strong>{bestAction.org}</strong>
              <span>·</span>
              <span>{cleanMeta(bestAction.metaLabel)}</span>
              {#if isDone(bestAction.id)}
                <span class="done-inline">· ✓ Splněno</span>
              {/if}
            </div>

            <button type="button" class="btn-cycle-inline" on:click={cycleRecommendation}>
              ↻ Jiný nápad
            </button>
          </div>

          <h2 class="rec-title">{cleanTitle(bestAction.title)}</h2>
          <p class="rec-desc">{bestAction.desc}</p>

          {#if bestAction.concreteImpact || bestAction.selfBenefit}
            <p class="rec-impact-line">
              {bestAction.concreteImpact || bestAction.selfBenefit}
            </p>
          {/if}

          {#if bestAction.steps?.length}
            <ol class="clean-steps">
              {#each bestAction.steps as step}
                <li>{step}</li>
              {/each}
            </ol>
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
              <span>{bestAction.cta || 'Otevřít projekt'}</span>
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
              ✓ Hotovo
            </button>
          </div>
        </div>
      {/if}

      {#if sideAlternatives.length}
        <details class="calm-drawer alts-drawer">
          <summary>
            <span>Další {sideAlternatives.length} nápady pro tohle nastavení</span>
          </summary>
          <div class="alts-grid">
            {#each sideAlternatives as alt (alt.id)}
              <article class="alt-card">
                <div class="alt-meta">{alt.org} · {cleanMeta(alt.metaLabel)}</div>
                <h4>{cleanTitle(alt.title)}</h4>
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
                    Detail ↑
                  </button>
                </div>
              </article>
            {/each}
          </div>
        </details>
      {/if}
    </section>
  </div>

  <!-- LOCAL PLACES IN YOUR CITY — AUTO-OPENED ONLY FOR WALK / PEOPLE -->
  <details class="calm-drawer local-drawer" bind:open={localDrawerOpen}>
    <summary>
      <span>📍 Místa pro osobní zapojení v okolí města {activeCity.name}</span>
    </summary>

    <section class="local-section" aria-label="Místa v okolí">
      <div class="local-head">
        <h2>Kam se ozvat nebo zajít poblíž města</h2>

        <div class="city-picker-wrap">
          <label for="guided-city-select">Město:</label>
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
          <a href={nearUrl} class="map-jump-link">Celá mapa →</a>
        </div>
      </div>

      <div class="local-grid">
        {#each localMatches as place (place.id)}
          {@const tpl = buildFirstContactTemplate(place)}
          <article class="local-card">
            <div class="lc-top">
              <span>{place.subcategory || 'Místo pomoci'}</span>
              <span class="lc-dist">~{place.distKm} km ({activeCity.name})</span>
            </div>
            <h3>{place.name}</h3>
            <p class="lc-desc">{place.quickMission || place.description}</p>
            {#if place.address}
              <div class="lc-addr">📍 {place.address}</div>
            {/if}

            <div class="lc-actions">
              {#if place.website}
                <a href={place.website} target="_blank" rel="noopener noreferrer" class="lc-btn primary">
                  Web ↗
                </a>
              {/if}
              <button
                type="button"
                class="lc-btn ghost"
                on:click={() => (openTemplateId = openTemplateId === place.id ? null : place.id)}
              >
                💬 Vzor zprávy
              </button>
            </div>

            {#if openTemplateId === place.id}
              <div class="tpl-drawer">
                <pre>{tpl.body}</pre>
                <div class="tpl-btns">
                  <button type="button" on:click={() => copyTemplate(place)}>
                    {copiedTemplateId === place.id ? '✓ Zkopírováno' : '📋 Zkopírovat'}
                  </button>
                  {#if tpl.mailtoUrl}
                    <a href={tpl.mailtoUrl}>✉️ E-mail</a>
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
    font-size: clamp(1.95rem, 3.4vw, 2.65rem);
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
    max-width: 54ch;
    font-size: 0.96rem;
    line-height: 1.58;
  }

  .guided-workspace {
    display: grid;
    grid-template-columns: 0.88fr 1.12fr;
    gap: 1.5rem;
    align-items: start;
  }

  /* COMPASS SHELL */
  .compass-shell {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(22, 82, 56, 0.1);
    border-radius: 26px;
    padding: 1.45rem 1.5rem;
    box-shadow: var(--shadow-sm);
  }

  .block-label {
    font-size: 0.84rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 0.7rem;
  }

  .opt-tag {
    font-weight: 600;
    color: var(--text-muted);
  }

  .situation-grid {
    display: flex;
    flex-direction: column;
    gap: 0.42rem;
  }

  .situation-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-align: left;
    padding: 0.68rem 0.9rem;
    border-radius: 14px;
    background: transparent;
    border: 1px solid rgba(22, 82, 56, 0.09);
    cursor: pointer;
    font-family: var(--font-sans);
    transition: all 0.16s ease;
  }

  .situation-card:hover {
    background: #f5faf7;
    border-color: rgba(16, 185, 129, 0.35);
  }

  .situation-card.active {
    background: #0f3022;
    border-color: #0f3022;
    color: #ffffff;
    box-shadow: 0 8px 18px -8px rgba(9, 29, 20, 0.3);
  }

  .sit-emoji {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .sit-copy {
    display: flex;
    flex-direction: column;
    gap: 0.06rem;
  }

  .sit-title {
    font-weight: 700;
    font-size: 0.88rem;
    color: inherit;
  }

  .sit-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .situation-card.active .sit-sub {
    color: rgba(167, 243, 208, 0.88);
  }

  .divider {
    height: 1px;
    background: rgba(22, 82, 56, 0.08);
    margin: 1.15rem 0;
  }

  .topic-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .topic-pill {
    padding: 0.42rem 0.82rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 82, 56, 0.12);
    background: #f6faf7;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .topic-pill:hover {
    border-color: rgba(16, 185, 129, 0.4);
    background: #ffffff;
  }

  .topic-pill.selected {
    background: #0f3022;
    border-color: #0f3022;
    color: #fde68a;
  }

  /* CLEAN PERSONAL RECOMMENDATION CARD */
  .plan-section {
    position: sticky;
    top: 5.2rem;
  }

  .plan-section.flash .highlight-card {
    box-shadow: 0 22px 44px -14px rgba(16, 185, 129, 0.24), 0 0 0 2px rgba(16, 185, 129, 0.42);
  }

  .highlight-card {
    background: rgba(255, 255, 255, 0.97);
    color: var(--text-primary);
    border-radius: 26px;
    padding: 2rem;
    border: 1px solid rgba(22, 82, 56, 0.11);
    box-shadow: var(--shadow-md);
    transition: box-shadow 0.25s ease;
  }

  .rec-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.65rem;
  }

  .rec-meta-line {
    display: flex;
    align-items: center;
    gap: 0.42rem;
    flex-wrap: wrap;
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .rec-meta-line strong {
    color: var(--emerald-600);
    font-weight: 700;
  }

  .done-inline {
    color: #047857;
    font-weight: 700;
  }

  .btn-cycle-inline {
    border: none;
    background: transparent;
    color: var(--emerald-600);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    padding: 0.2rem 0.45rem;
    border-radius: 8px;
  }

  .btn-cycle-inline:hover {
    background: rgba(16, 185, 129, 0.09);
    color: var(--forest-850);
  }

  .rec-title {
    margin: 0 0 0.55rem;
    font-size: clamp(1.35rem, 2.3vw, 1.7rem);
    font-weight: 800;
    color: #0b2419;
    line-height: 1.22;
    letter-spacing: -0.02em;
  }

  .rec-desc {
    font-size: 0.96rem;
    line-height: 1.62;
    color: var(--text-secondary);
    margin: 0 0 0.95rem;
  }

  .rec-impact-line {
    margin: 0 0 1.1rem;
    padding-left: 0.85rem;
    border-left: 2.5px solid #10b981;
    font-size: 0.88rem;
    line-height: 1.52;
    color: #164230;
    font-weight: 600;
  }

  .clean-steps {
    margin: 0 0 1.35rem;
    padding-left: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .cta-row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .btn-gold-action {
    flex: 1;
    min-width: 190px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.86rem 1.25rem;
    border-radius: 14px;
    background: linear-gradient(135deg, #0f3626 0%, #17523a 100%);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.92rem;
    text-decoration: none;
    box-shadow: 0 10px 22px -6px rgba(15, 54, 38, 0.35);
    transition: transform 0.18s ease;
  }

  .btn-gold-action:hover {
    transform: translateY(-2px);
  }

  .btn-done-action {
    padding: 0.86rem 1.1rem;
    border-radius: 14px;
    border: 1px solid rgba(5, 150, 105, 0.28);
    background: #eef7f1;
    color: #065f46;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .btn-done-action:hover {
    background: #059669;
    color: #ffffff;
  }

  /* ALTERNATIVES */
  .alts-drawer {
    margin-top: 0.9rem;
  }

  .alts-drawer .alts-grid {
    margin-top: 0.85rem;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .alt-card {
    background: #ffffff;
    border: 1px solid rgba(22, 82, 56, 0.09);
    border-radius: 16px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }

  .alt-meta {
    font-size: 0.73rem;
    font-weight: 700;
    color: var(--emerald-600);
    margin-bottom: 0.25rem;
  }

  .alt-card h4 {
    margin: 0 0 0.35rem;
    font-size: 0.92rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .alt-card p {
    margin: 0 0 0.75rem;
    font-size: 0.81rem;
    color: var(--text-secondary);
    line-height: 1.46;
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
    border: none;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
  }

  .alt-detail:hover {
    color: var(--text-primary);
  }

  /* LOCAL PLACES */
  .local-drawer {
    margin-top: 1.35rem;
  }

  .local-section {
    margin-top: 1rem;
    padding-top: 0.9rem;
    border-top: 1px solid rgba(22, 82, 56, 0.09);
  }

  .local-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .local-head h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .city-picker-wrap {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .city-picker-wrap label {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .city-select {
    padding: 0.45rem 0.8rem;
    border-radius: 10px;
    border: 1px solid rgba(22, 82, 56, 0.16);
    background: #ffffff;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.85rem;
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
    border-radius: 18px;
    background: #ffffff;
    border: 1px solid rgba(22, 82, 56, 0.09);
    display: flex;
    flex-direction: column;
  }

  .lc-top {
    display: flex;
    justify-content: space-between;
    gap: 0.4rem;
    font-size: 0.74rem;
    font-weight: 700;
    color: #059669;
    margin-bottom: 0.3rem;
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
    margin: 0 0 0.55rem;
    font-size: 0.83rem;
    color: var(--text-secondary);
    line-height: 1.48;
    flex: 1;
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
    padding: 0.45rem 0.78rem;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 700;
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
    background: #f5f9f6;
    border: 1px solid rgba(22, 82, 56, 0.12);
    color: var(--text-primary);
  }

  .tpl-drawer {
    margin-top: 0.65rem;
    padding-top: 0.65rem;
    border-top: 1px solid rgba(22, 82, 56, 0.09);
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
    padding: 0.35rem 0.68rem;
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
      padding: 1.35rem 1.2rem;
    }
  }
</style>
