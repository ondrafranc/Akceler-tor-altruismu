<script>
  import {
    PORTALS,
    MICRO_ACTIONS,
    CZECH_CITIES,
    CURATED_FALLBACK_PLACES,
    REAL_STORIES,
    HOPE_FACTS,
    recommendActions
  } from '../lib/data/czech-actions.js';
  import {
    recordSmallWin,
    completedSteps
  } from '../lib/progress.js';
  import { trackEvent } from '../lib/analytics.js';

  // 4 jasně odlišené režimy energie na hlavní stránce (každý vrací úplně jiný typ ověřené akce!)
  const HOME_MODES = {
    couch: { timeBucket: '5', mode: 'online', social: 'solo', cost: 'free' },
    focus: { timeBucket: '15', mode: 'online', social: 'solo', cost: 'free' },
    walk: { timeBucket: '15', mode: 'local', social: 'solo', cost: 'free' },
    people: { timeBucket: '45', mode: 'local', social: 'group', cost: 'free' }
  };

  let energyMode = 'couch';
  let suggestionIndex = 0;
  let lastQuickActionId = '';
  let excludeQuickId = '';

  // Interactive Czechia SVG Map Spotlight
  let selectedCityId = 'praha';

  $: activeCity = CZECH_CITIES.find((c) => c.id === selectedCityId) || CZECH_CITIES[0];

  // Haversine helper to show real curated places near the selected city on the Home SVG preview
  function distKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  $: activeCityPlaces = CURATED_FALLBACK_PLACES.map((p) => ({
    ...p,
    d: distKm(activeCity.lat, activeCity.lon, p.lat, p.lon)
  }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3);

  // Project real Czech lat/lon (12.09..18.86 E, 48.55..51.06 N) onto SVG 800x450 canvas
  function projectLon(lon) {
    return 58 + ((lon - 12.09) / (18.86 - 12.09)) * 684;
  }
  function projectLat(lat) {
    return 404 - ((lat - 48.55) / (51.06 - 48.55)) * 352;
  }

  // Realistic geographic border points of the Czech Republic projected onto the same SVG space
  const CZ_BORDER_COORDS = [
    [12.10, 50.32], [12.35, 50.42], [12.65, 50.43], [12.95, 50.45], [13.35, 50.62],
    [13.82, 50.76], [14.05, 50.80], [14.32, 51.02], [14.62, 50.85], [15.03, 50.92],
    [15.28, 50.90], [15.45, 50.78], [15.75, 50.75], [16.05, 50.65], [16.32, 50.62],
    [16.25, 50.40], [16.65, 50.15], [16.88, 50.42], [17.05, 50.38], [17.42, 50.28],
    [17.72, 50.30], [17.65, 50.05], [18.02, 49.98], [18.32, 49.92], [18.58, 49.88],
    [18.85, 49.52], [18.45, 49.40], [18.12, 49.25], [17.92, 49.05], [17.70, 48.92],
    [17.20, 48.82], [16.95, 48.62], [16.55, 48.76], [16.05, 48.78], [15.55, 48.90],
    [15.02, 48.98], [14.72, 48.78], [14.32, 48.58], [13.85, 48.76], [13.45, 48.95],
    [13.05, 49.25], [12.68, 49.48], [12.48, 49.75], [12.38, 50.02], [12.10, 50.32]
  ];

  const czSvgPath =
    'M ' +
    CZ_BORDER_COORDS.map(([lon, lat]) => `${projectLon(lon).toFixed(1)},${projectLat(lat).toFixed(1)}`).join(' L ') +
    ' Z';

  // Decorative GPU-only fireflies in Hero
  const FIREFLIES = [
    { left: '7%', top: '22%', size: 6, delay: '0s', dur: '7s', gold: true },
    { left: '16%', top: '68%', size: 4, delay: '1.2s', dur: '8.5s', gold: false },
    { left: '26%', top: '18%', size: 5, delay: '2.5s', dur: '6.8s', gold: true },
    { left: '38%', top: '76%', size: 7, delay: '0.6s', dur: '9s', gold: true },
    { left: '47%', top: '30%', size: 4, delay: '3.1s', dur: '7.4s', gold: false },
    { left: '55%', top: '14%', size: 6, delay: '1.8s', dur: '8.2s', gold: true },
    { left: '66%', top: '82%', size: 5, delay: '0.4s', dur: '7.8s', gold: false },
    { left: '78%', top: '20%', size: 8, delay: '2.1s', dur: '9.4s', gold: true },
    { left: '88%', top: '58%', size: 5, delay: '1.5s', dur: '6.9s', gold: false },
    { left: '92%', top: '28%', size: 6, delay: '2.9s', dur: '8.1s', gold: true },
    { left: '12%', top: '44%', size: 4, delay: '3.6s', dur: '7.2s', gold: false },
    { left: '42%', top: '52%', size: 5, delay: '1.1s', dur: '8.7s', gold: true }
  ];

  $: activeModeCfg = HOME_MODES[energyMode] || HOME_MODES.couch;

  $: quickPool = recommendActions({
    values: [],
    timeBucket: activeModeCfg.timeBucket,
    cost: activeModeCfg.cost,
    mode: activeModeCfg.mode,
    social: activeModeCfg.social,
    completedIds: ($completedSteps || []).map((s) => s.id),
    excludeIds: excludeQuickId ? [excludeQuickId] : [],
    seed: `home:${energyMode}:${suggestionIndex}`
  });

  $: currentQuickAction = quickPool.length ? quickPool[0] : null;
  $: if (currentQuickAction?.id) {
    lastQuickActionId = currentQuickAction.id;
  }

  function setEnergyMode(mode) {
    if (energyMode === mode) {
      nextQuickIdea();
      return;
    }
    excludeQuickId = lastQuickActionId;
    energyMode = mode;
    suggestionIndex = 0;
    trackEvent('aa_home_energy_mode', { mode });
  }

  function nextQuickIdea() {
    excludeQuickId = lastQuickActionId;
    suggestionIndex += 1;
    trackEvent('aa_home_next_idea', { mode: energyMode, index: suggestionIndex });
  }

  // Strip leading emoji so cards look cleaner when paired with styled badges
  function cleanTitle(str) {
    return String(str || '').replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\s]+/u, '').trim() || str;
  }

  function cleanMeta(str) {
    return String(str || '')
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]/gu, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
</script>

<div class="home-page">
  <!-- =====================================================================
       1. CINEMATIC "FOREST TWILIGHT & GOLDEN DAWN" HERO STAGE
       ===================================================================== -->
  <section class="hero-stage">
    <!-- Atmospheric Painterly Forest Backdrop + Glimmer Fireflies -->
    <div class="hero-painted-backdrop" aria-hidden="true"></div>
    <div class="hero-aurora" aria-hidden="true"></div>
    <div class="hero-grid-lines" aria-hidden="true"></div>
    <div class="fireflies-layer" aria-hidden="true">
      {#each FIREFLIES as f}
        <span
          class="firefly"
          class:gold={f.gold}
          style="left:{f.left}; top:{f.top}; width:{f.size}px; height:{f.size}px; animation-delay:{f.delay}; animation-duration:{f.dur};"
        ></span>
      {/each}
    </div>

    <div class="hero-inner">
      <div class="hero-copy">
        <div class="eyebrow-pill">
          <span class="live-dot"></span>
          <span>Zdarma a bez účtu • {MICRO_ACTIONS.length} ověřených cest, jak pomoct v Česku</span>
        </div>

        <h1 class="hero-title">
          Pomáhat může být lehké.<br />
          <span class="hero-subline">Nemusíš spasit celý svět —</span>
          <span class="hero-serif">stačí jeden dobrý skutek dnes.</span>
        </h1>

        <p class="hero-lead">
          Zvol si podle chuti, kolik máš zrovna teď času a sil. Za pár vteřin uvidíš konkrétní věc, kterou můžeš udělat pro lidi, zvířata nebo přírodu kolem sebe — anebo se zastav v <strong>Krajině dobra</strong>.
        </p>

        <div class="hero-ctas">
          <a
            href="/near"
            class="hero-btn primary"
            on:click={() => trackEvent('aa_launch', { from: 'hero_map' })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>Najít pomoc v mém okolí</span>
            <span class="arrow">→</span>
          </a>

          <a
            href="/app/guided"
            class="hero-btn glass"
            on:click={() => trackEvent('aa_launch', { from: 'hero_guided' })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            <span>Průvodce podle situace</span>
          </a>

          <a
            href="/svet"
            class="hero-btn sanctuary-hero-btn"
            on:click={() => trackEvent('aa_launch', { from: 'hero_svet' })}
          >
            <span>✨ Krajina dobra</span>
          </a>
        </div>

        <div class="hero-metrics">
          <div class="metric">
            <strong>Do 2 min</strong>
            <span>první drobný skutek</span>
          </div>
          <div class="metric-sep"></div>
          <div class="metric">
            <strong>14 krajů</strong>
            <span>místa pomoci po celé ČR</span>
          </div>
          <div class="metric-sep"></div>
          <div class="metric">
            <strong>Ověřeno</strong>
            <span>skutečné české organizace</span>
          </div>
        </div>
      </div>

      <!-- LUMINOUS INTERACTIVE SPARK STUDIO CARD -->
      <div class="instant-card">
        <div class="card-halo" aria-hidden="true"></div>
        <div class="instant-top">
          <div class="studio-head">
            <span class="studio-tag">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Dnešní dobrý skutek
            </span>
            <span class="studio-hint">Vyber, kolik máš času</span>
          </div>

          <div class="energy-tabs" role="tablist" aria-label="Výběr dnešní situace">
            <button
              type="button"
              class="energy-tab"
              class:active={energyMode === 'couch'}
              on:click={() => setEnergyMode('couch')}
            >
              <span class="tab-time">🛋️ 2 min</span>
              <span class="tab-sub">z gauče</span>
            </button>
            <button
              type="button"
              class="energy-tab"
              class:active={energyMode === 'focus'}
              on:click={() => setEnergyMode('focus')}
            >
              <span class="tab-time">💻 15 min</span>
              <span class="tab-sub">hlavou</span>
            </button>
            <button
              type="button"
              class="energy-tab"
              class:active={energyMode === 'walk'}
              on:click={() => setEnergyMode('walk')}
            >
              <span class="tab-time">🌿 Venku</span>
              <span class="tab-sub">procházka</span>
            </button>
            <button
              type="button"
              class="energy-tab"
              class:active={energyMode === 'people'}
              on:click={() => setEnergyMode('people')}
            >
              <span class="tab-time">🤝 S lidmi</span>
              <span class="tab-sub">v partě</span>
            </button>
          </div>
        </div>

        {#if currentQuickAction}
          <div class="instant-body">
            <div class="action-meta-row">
              <span class="meta-pill highlight">{cleanMeta(currentQuickAction.metaLabel)}</span>
              <span class="meta-pill org">{currentQuickAction.org}</span>
            </div>

            <h2 class="action-title">{cleanTitle(currentQuickAction.title)}</h2>
            <p class="action-desc">{currentQuickAction.desc}</p>

            {#if currentQuickAction.selfBenefit}
              <div class="action-self-benefit">
                <span>✨</span>
                <span><strong>Co to dá i tobě:</strong> {currentQuickAction.selfBenefit}</span>
              </div>
            {:else if currentQuickAction.whyItMatters}
              <div class="action-why">
                <span class="why-label">Proč to má smysl</span>
                <p>{currentQuickAction.whyItMatters}</p>
              </div>
            {/if}

            {#if currentQuickAction.reassurance}
              <div class="action-reassurance">
                <span>🛡️</span>
                <span>{currentQuickAction.reassurance}</span>
              </div>
            {/if}

            {#if currentQuickAction.steps?.length}
              <ol class="action-steps">
                {#each currentQuickAction.steps as step, idx}
                  <li>
                    <span class="step-num">{idx + 1}</span>
                    <span class="step-txt">{step}</span>
                  </li>
                {/each}
              </ol>
            {/if}

            <div class="instant-actions">
              <a
                href={currentQuickAction.url}
                target="_blank"
                rel="noopener noreferrer"
                class="btn-studio-primary"
                on:click={() => trackEvent('aa_clickout', { surface: 'home_instant', id: currentQuickAction.id })}
              >
                <span>{currentQuickAction.cta || 'Otevřít projekt'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
              </a>

              <button
                type="button"
                class="btn-studio-done done-btn"
                on:click={() => {
                  recordSmallWin({ id: currentQuickAction.id, title: currentQuickAction.title, surface: 'home_instant' });
                  trackEvent('aa_small_win_done', { surface: 'home_instant', id: currentQuickAction.id });
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Hotovo</span>
              </button>

              <button type="button" class="btn-studio-cycle cycle-btn" on:click={nextQuickIdea} title="Ukázat další ověřený nápad">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                <span>Jiný tip</span>
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Organic Horizon Wave into Warm Stone Page -->
    <div class="hero-wave" aria-hidden="true">
      <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
        <path
          d="M0,40 C320,95 680,-10 1080,48 C1260,74 1370,58 1440,38 L1440,90 L0,90 Z"
          fill="var(--surface-page)"
        />
      </svg>
    </div>
  </section>

  <!-- =====================================================================
       2. THREE ARCHITECTURAL PATHWAYS (BENTO GRID)
       ===================================================================== -->
  <section class="content-wrap paths-section" aria-label="Tři cesty k pomoci">
    <div class="section-header">
      <span class="section-kicker">Jak se zapojit</span>
      <h2>Vyber si cestu, která ti <span class="serif-accent">dneska sedí nejvíc</span></h2>
      <p>Ať máš jen dvě minuty v tramvaji, nebo chuť vyrazit ven mezi lidi, každá cesta vede k ověřeným místům a projektům v Česku.</p>
    </div>

    <div class="bento-paths">
      <!-- PATH 1: MAPA -->
      <article class="bento-card featured-map">
        <div class="bento-accent emerald"></div>
        <div class="bento-icon-wrap emerald">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div class="bento-meta">Ve tvém městě i obci • mapa ČR</div>
        <h3>Pomoc kousek od tebe</h3>
        <p class="bento-desc">
          Útulky, potravinové banky, knihobudky a komunitní centra. U každého místa najdeš <strong>tip, s čím konkrétně pomoct</strong>, i hotovou zprávu na první oslovení.
        </p>
        <div class="bento-whisper">🐾 Útulky • 🥫 Potraviny • 📚 Knihobudky</div>

        <a href="/near" class="bento-link">
          <span>Otevřít mapu v okolí</span>
          <span>→</span>
        </a>
      </article>

      <!-- PATH 2: PRŮVODCE -->
      <article class="bento-card">
        <div class="bento-accent amber"></div>
        <div class="bento-icon-wrap amber">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        </div>
        <div class="bento-meta">Čas + téma • výběr na míru</div>
        <h3>Průvodce podle situace</h3>
        <p class="bento-desc">
          Nevíš, čím začít? Zvol si, kolik máš času a komu chceš pomoct — hned uvidíš <strong>jeden konkrétní skutek krok za krokem</strong>.
        </p>
        <div class="bento-whisper">🛋️ Z domova • 🌿 Na procházce • 🤝 S lidmi</div>

        <a href="/app/guided" class="bento-link">
          <span>Otevřít průvodce</span>
          <span>→</span>
        </a>
      </article>

      <!-- PATH 3: MIKRO-KROKY -->
      <article class="bento-card">
        <div class="bento-accent forest"></div>
        <div class="bento-icon-wrap forest">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <div class="bento-meta">Z mobilu či notebooku • do pár minut</div>
        <h3>Drobné skutky na dálku</h3>
        <p class="bento-desc">
          Když chceš pomoct hned z domova: naplnění misky pro útulek, obkreslení map pro Lékaře bez hranic, dopis seniorovi nebo péče o studánky.
        </p>
        <div class="bento-whisper">⚡ Od 1 minuty • 💸 Zdarma • 🛡️ Ověřené projekty v ČR</div>

        <a href="/app/online" class="bento-link">
          <span>Prohlédnout online mikro-kroky</span>
          <span>→</span>
        </a>
      </article>
    </div>
  </section>

  <!-- =====================================================================
       2B. KRAJINA DOBRA PORTAL (/svet)
       ===================================================================== -->
  <section class="content-wrap sanctuary-portal-section" aria-label="Krajina dobra a dechové zastavení">
    <div class="sanctuary-portal-card">
      <div class="sanctuary-copy">
        <span class="stage-kicker">✨ Krajina dobra • Skutečné skutky a klidný dech</span>
        <h2>Podívej se, jak drobné skutky <span class="serif-gold">rozsvěcují krajinu</span></h2>
        <p>
          Malovaná šumavská tůň ve zlatém svítání, kde každá hvězda na obloze i lucerna na hladině představuje konkrétní pomoc. <strong>Klikni na kterékoliv světlo pro inspiraci na dnešní skutek</strong>, rozsviť si ten svůj nebo si dopřej minutu klidného dechu.
        </p>
        <div class="sanctuary-stats-row">
          <span class="sanc-pill">✨ <strong>Klikací světla</strong> skutečných skutků</span>
          <span class="sanc-pill">🏮 <strong>Rozsviť</strong> i svou dnešní pomoc</span>
          <span class="sanc-pill">🌊 <strong>Dechové zastavení</strong> na nabrání sil</span>
        </div>

        <div class="sanctuary-cta-row">
          <a href="/svet" class="sanctuary-open-btn" on:click={() => trackEvent('aa_home_portal_svet')}>
            <span>✨ Otevřít Krajinu dobra</span>
            <span>→</span>
          </a>
          <a href="/svet#dech" class="sanctuary-breath-link">
            🌊 Rovnou na dechové zastavení
          </a>
        </div>
      </div>

      <a href="/svet" class="sanctuary-preview-window" aria-label="Náhled Krajiny dobra">
        <img src="/art/sanctuary-dawn.jpg" alt="Malovaná česká krajina ve zlatém svítání s lesní tůní a světly dobrých skutků" loading="lazy" />
        <div class="spw-badge">✨ Živé skutky v krajině</div>
      </a>
    </div>
  </section>

  <!-- =====================================================================
       3. INTERACTIVE LIVING CZECHIA MAP SHOWCASE (ALL 14 REGIONS)
       ===================================================================== -->
  <section class="content-wrap map-showcase-section" aria-label="Mapa solidarity napříč Českem">
    <div class="map-stage">
      <div class="map-stage-glow" aria-hidden="true"></div>
      <div class="map-stage-head">
        <div>
          <span class="stage-kicker">Živá síť pomoci • Všech 14 krajů ČR</span>
          <h2>Podívej se, kde všude už <span class="serif-gold">dobro v Česku žije</span></h2>
        </div>
        <p>Klikni na kterékoliv krajské město na mapě a podívej se na ověřená místa v okolí — nebo zadej vlastní obec na plné mapě.</p>
      </div>

      <div class="map-interactive-grid">
        <!-- SVG MAP OF CZECHIA -->
        <div class="cz-svg-card">
          <svg viewBox="0 0 800 450" class="cz-svg" role="img" aria-label="Interaktivní mapa krajských měst České republiky">
            <defs>
              <linearGradient id="czFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(52, 211, 153, 0.16)" />
                <stop offset="55%" stop-color="rgba(16, 185, 129, 0.08)" />
                <stop offset="100%" stop-color="rgba(251, 191, 36, 0.14)" />
              </linearGradient>
              <filter id="glowBeacon" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <!-- Subtle Coordinate Grid -->
            <line x1="80" y1="120" x2="720" y2="120" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4 6" />
            <line x1="80" y1="225" x2="720" y2="225" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4 6" />
            <line x1="80" y1="330" x2="720" y2="330" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4 6" />

            <!-- Czech Republic Silhouette -->
            <path
              d={czSvgPath}
              fill="url(#czFill)"
              stroke="rgba(110, 231, 183, 0.45)"
              stroke-width="2.2"
              stroke-linejoin="round"
            />

            <!-- 13 Regional Capitals Beacons -->
            {#each CZECH_CITIES as city}
              {@const cx = projectLon(city.lon)}
              {@const cy = projectLat(city.lat)}
              {@const isSelected = city.id === selectedCityId}
              <g
                class="city-node"
                class:selected={isSelected}
                transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)})`}
                on:mouseenter={() => (selectedCityId = city.id)}
                on:click={() => (selectedCityId = city.id)}
                on:keydown={(e) => e.key === 'Enter' && (selectedCityId = city.id)}
                tabindex="0"
                role="button"
                aria-label={`Zobrazit organizace ve městě ${city.name}`}
              >
                {#if isSelected}
                  <circle r="22" class="pulse-ring" />
                {/if}
                <circle r={isSelected ? 9 : 6.5} class="beacon-dot" filter="url(#glowBeacon)" />
                <text
                  y={city.id === 'hradec' ? -13 : 20}
                  text-anchor="middle"
                  class="beacon-label"
                >
                  {city.name}
                </text>
              </g>
            {/each}
          </svg>

          <!-- Quick City Pills Bar under SVG -->
          <div class="city-pills-bar">
            {#each CZECH_CITIES as city}
              <button
                type="button"
                class="city-pill-btn"
                class:active={city.id === selectedCityId}
                on:click={() => (selectedCityId = city.id)}
              >
                {city.name}
              </button>
            {/each}
          </div>
        </div>

        <!-- LIVE CITY SPOTLIGHT INSPECTOR -->
        <div class="city-inspector">
          <div class="inspector-head">
            <span class="inspector-badge">Vybraný region</span>
            <h3>{activeCity.name} a okolí</h3>
            <p>Ověřené organizace, kam se můžeš ozvat nebo rovnou zajít:</p>
          </div>

          <div class="inspector-list">
            {#each activeCityPlaces as place}
              <div class="inspector-item">
                <div class="inspector-item-top">
                  <span class="inspector-subcat">{place.subcategory || 'Organizace'}</span>
                  {#if place.d > 1}
                    <span class="inspector-dist">{Math.round(place.d)} km</span>
                  {/if}
                </div>
                <div class="inspector-name">{place.name}</div>
                <p class="inspector-desc">{place.description}</p>
                {#if place.address}
                  <div class="inspector-addr">📍 {place.address}</div>
                {/if}
              </div>
            {/each}
          </div>

          <a
            href={`/near?lat=${activeCity.lat}&lon=${activeCity.lon}&r=${Math.round(activeCity.radius / 1000)}`}
            class="inspector-cta"
            on:click={() => trackEvent('aa_home_city_jump', { city: activeCity.id })}
          >
            <span>Prozkoumat všechna místa v okolí ({activeCity.name})</span>
            <span>→</span>
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- =====================================================================
       4. ANTIDOTE TO DOOMSCROLLING: KINETIC HOPE FACTS (.hope-section)
       ===================================================================== -->
  <section class="content-wrap hope-section" aria-label="Dobré zprávy v číslech">
    <div class="section-header">
      <span class="section-kicker">Dobré zprávy v číslech</span>
      <h2>Kolik pomoci v Česku <span class="serif-accent">každý den vzniká</span></h2>
      <p>O dobrých věcech se mluví méně než o krizích, přitom statisíce lidí v Česku denně pomáhají. Tady jsou ověřená čísla, ke kterým se můžeš přidat:</p>
    </div>

    <div class="hope-bento">
      {#each HOPE_FACTS as hf, i}
        <article class="hope-tile" class:featured={i === 0 || i === 3}>
          <div class="hope-number">{hf.stat}</div>
          <h3 class="hope-title">{hf.title}</h3>
          <p class="hope-detail">{hf.detail}</p>
          <a href={hf.actionHref} class="hope-cta">{hf.actionLabel}</a>
        </article>
      {/each}
    </div>
  </section>

  <!-- =====================================================================
       5. ZKUŠENOSTI OSTATNÍCH
       ===================================================================== -->
  <section class="content-wrap stories-section" aria-label="Zkušenosti lidí z Česka">
    <div class="section-header">
      <span class="section-kicker">Zkušenosti ostatních</span>
      <h2>Jak vypadá <span class="serif-accent">drobná pomoc</span> v běžném týdnu</h2>
      <p>Nemusíš měnit celý svůj rozvrh. Takhle začínají lidé napříč Českem:</p>
    </div>

    <div class="stories-grid">
      {#each REAL_STORIES as st}
        <article class="story-card">
          <div class="quote-mark" aria-hidden="true">“</div>
          <div class="story-tag-pill">{st.tag}</div>
          <p class="story-quote">{st.quote}</p>
          <div class="story-footer">
            <div class="story-author">
              <span class="author-avatar">{st.icon}</span>
              <span class="author-name">{st.person}</span>
            </div>
            <a href={st.ctaHref} class="story-link">{st.ctaLabel}</a>
          </div>
        </article>
      {/each}
    </div>
  </section>

  <!-- =====================================================================
       6. VERIFIED CZECH PORTALS (TUCKED CALMLY) & COMMUNITY INVITE
       ===================================================================== -->
  <section class="content-wrap portals-section" aria-label="Ověřené české portály">
    <details class="calm-drawer home-portals-drawer">
      <summary>Hledáš dlouhodobější dobrovolnictví? Zobrazit 8 ověřených českých platforem</summary>
      <p class="drawer-lead">Rozcestník na osvědčené české dobrovolnické a komunitní projekty, kde si vybereš zapojení podle svého oboru nebo regionu.</p>
      <div class="portals-grid">
        {#each PORTALS as p}
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            class="portal-card"
            on:click={() => trackEvent('aa_clickout', { surface: 'home_portal', id: p.id })}
          >
            <div class="portal-top">
              <h3>{p.title}</h3>
              <span class="ext-icon">↗</span>
            </div>
            <p>{p.desc}</p>
            {#if p.bullets?.length}
              <ul class="portal-bullets">
                {#each p.bullets.slice(0, 2) as b}
                  <li>{b}</li>
                {/each}
              </ul>
            {/if}
          </a>
        {/each}
      </div>
    </details>

    <div class="community-cta-banner">
      <div class="cta-banner-copy">
        <span class="stage-kicker">Tvořme mapu společně</span>
        <h3>Víš o skvělém komunitním místě, útulku nebo sousedské akci ve svém městě?</h3>
        <p>Přidej tip během 60 sekund bez registrace a ukaž ostatním v okolí, kde se dá přiložit ruka k dílu.</p>
      </div>
      <a href="/submit" class="cta-banner-btn">
        <span>Přidat místo nebo akci</span>
        <span>→</span>
      </a>
    </div>
  </section>
</div>

<style>
  .home-page {
    padding-bottom: 1rem;
  }

  /* ==========================================================================
     1. CINEMATIC HERO STAGE
     ========================================================================== */
  .hero-stage {
    position: relative;
    margin-top: -5.4rem;
    padding: 8.2rem 1.25rem 6.5rem 1.25rem;
    background:
      radial-gradient(95% 90% at 78% 22%, rgba(28, 108, 73, 0.85) 0%, transparent 62%),
      radial-gradient(70% 75% at 15% 15%, rgba(251, 191, 36, 0.2) 0%, transparent 58%),
      linear-gradient(160deg, #0b261b 0%, #123a29 48%, #184b35 100%);
    color: #f8faf8;
    overflow: hidden;
  }

  .hero-painted-backdrop {
    position: absolute;
    inset: 0;
    background: url('/art/sanctuary-dawn.jpg') center 42% / cover no-repeat;
    opacity: 0.34;
    mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.78) 55%, rgba(0, 0, 0, 0.92) 100%);
    -webkit-mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.78) 55%, rgba(0, 0, 0, 0.92) 100%);
    filter: saturate(1.1);
    pointer-events: none;
  }

  .hero-aurora {
    position: absolute;
    inset: -20% -10% 0 -10%;
    background:
      radial-gradient(circle at 72% 38%, rgba(52, 211, 153, 0.22) 0%, transparent 42%),
      radial-gradient(circle at 62% 24%, rgba(251, 191, 36, 0.16) 0%, transparent 34%);
    filter: blur(28px);
    pointer-events: none;
  }

  .hero-grid-lines {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
    pointer-events: none;
  }

  .fireflies-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .firefly {
    position: absolute;
    border-radius: 50%;
    background: #6ee7b7;
    box-shadow: 0 0 14px 3px rgba(52, 211, 153, 0.55);
    animation: floatFirefly 8s ease-in-out infinite;
  }

  .firefly.gold {
    background: #fde68a;
    box-shadow: 0 0 16px 4px rgba(251, 191, 36, 0.62);
  }

  .hero-inner {
    position: relative;
    z-index: 2;
    max-width: 1180px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 2.5rem;
    align-items: center;
  }

  .eyebrow-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.42rem 0.9rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(10px);
    color: #d1fae5;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    margin-bottom: 1.25rem;
  }

  .live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 10px #34d399;
  }

  .hero-title {
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: clamp(2.35rem, 4.4vw, 3.85rem);
    line-height: 1.06;
    letter-spacing: -0.035em;
    margin: 0 0 1.25rem 0;
    color: #ffffff;
  }

  .hero-subline {
    display: block;
    font-weight: 700;
    color: rgba(236, 253, 245, 0.9);
    font-size: clamp(1.85rem, 3.3vw, 2.85rem);
    margin-top: 0.25rem;
  }

  .hero-serif {
    display: block;
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: clamp(2.5rem, 4.8vw, 4.15rem);
    line-height: 1.02;
    letter-spacing: 0;
    background: linear-gradient(120deg, #fde68a 0%, #6ee7b7 60%, #fbbf24 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-top: 0.15rem;
  }

  .hero-lead {
    color: rgba(226, 242, 233, 0.84);
    font-size: 1.08rem;
    line-height: 1.68;
    max-width: 560px;
    margin: 0 0 1.75rem 0;
  }

  .hero-ctas {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .hero-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.88rem 1.35rem;
    border-radius: 14px;
    font-weight: 700;
    font-size: 0.96rem;
    text-decoration: none;
    transition: all 0.22s var(--ease-gentle);
  }

  .hero-btn.primary {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #34d399 0%, #fde68a 100%);
    color: #051810;
    box-shadow: 0 14px 32px -6px rgba(52, 211, 153, 0.45);
  }

  .hero-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 38px -6px rgba(52, 211, 153, 0.6);
  }

  .hero-btn.primary .arrow {
    transition: transform 0.2s ease;
  }

  .hero-btn.primary:hover .arrow {
    transform: translateX(4px);
  }

  .hero-btn.glass {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  }

  .hero-btn.glass:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-2px);
  }

  .sanctuary-hero-btn {
    background: rgba(253, 230, 138, 0.13);
    color: #fde68a;
    border: 1px solid rgba(253, 230, 138, 0.38);
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 26px -8px rgba(251, 191, 36, 0.32);
  }

  .sanctuary-hero-btn:hover {
    background: rgba(253, 230, 138, 0.24);
    color: #ffffff;
    transform: translateY(-2px);
  }

  .hero-metrics {
    margin-top: 2rem;
    padding-top: 1.35rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    gap: 1.35rem;
    flex-wrap: wrap;
  }

  .metric {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .metric strong {
    font-size: 1.15rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.02em;
  }

  .metric span {
    font-size: 0.8rem;
    color: rgba(209, 250, 229, 0.7);
  }

  .metric-sep {
    width: 1px;
    height: 28px;
    background: rgba(255, 255, 255, 0.14);
  }

  /* LUMINOUS SPARK STUDIO CARD */
  .instant-card {
    position: relative;
    background: linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 245, 236, 0.97) 100%);
    color: var(--text-primary);
    border-radius: 28px;
    padding: 1.55rem;
    box-shadow:
      0 32px 64px -12px rgba(3, 12, 8, 0.55),
      0 0 0 1px rgba(255, 255, 255, 0.5),
      0 0 48px -10px rgba(52, 211, 153, 0.3);
  }

  .card-halo {
    position: absolute;
    inset: -2px;
    border-radius: 30px;
    background: linear-gradient(135deg, rgba(52, 211, 153, 0.5), rgba(251, 191, 36, 0.4), transparent 65%);
    z-index: -1;
    pointer-events: none;
  }

  .studio-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .studio-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.7rem;
    border-radius: 999px;
    background: #0b2419;
    color: #fde68a;
    font-size: 0.76rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .studio-hint {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .energy-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.35rem;
    padding: 0.32rem;
    border-radius: 16px;
    background: #ebe6d8;
    margin-bottom: 1.05rem;
  }

  .energy-tab {
    border: none;
    border-radius: 12px;
    padding: 0.52rem 0.4rem;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.08rem;
    transition: all 0.2s var(--ease-gentle);
  }

  .energy-tab:hover {
    color: var(--text-primary);
  }

  .energy-tab.active {
    background: #0d281d;
    color: #ffffff;
    box-shadow: 0 6px 16px rgba(9, 29, 20, 0.22);
  }

  .tab-time {
    font-weight: 800;
    font-size: 0.88rem;
    letter-spacing: -0.01em;
  }

  .tab-sub {
    font-size: 0.72rem;
    opacity: 0.78;
    font-weight: 600;
  }

  .energy-tab.active .tab-sub {
    color: #6ee7b7;
    opacity: 1;
  }

  .action-meta-row {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-bottom: 0.65rem;
  }

  .meta-pill {
    font-size: 0.76rem;
    font-weight: 700;
    padding: 0.24rem 0.62rem;
    border-radius: 999px;
    background: rgba(22, 66, 48, 0.07);
    color: var(--czech-forest);
  }

  .meta-pill.org {
    background: rgba(217, 119, 6, 0.11);
    color: #92400e;
  }

  .action-title {
    font-weight: 800;
    font-size: 1.32rem;
    line-height: 1.25;
    letter-spacing: -0.02em;
    color: #091d14;
    margin: 0 0 0.45rem 0;
  }

  .action-desc {
    color: var(--text-secondary);
    font-size: 0.93rem;
    line-height: 1.55;
    margin: 0 0 0.75rem 0;
  }

  .action-self-benefit {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.11) 0%, rgba(251, 191, 36, 0.12) 100%);
    border: 1px solid rgba(16, 185, 129, 0.24);
    border-radius: 14px;
    padding: 0.58rem 0.78rem;
    margin-bottom: 0.65rem;
    font-size: 0.84rem;
    line-height: 1.44;
    color: #0b291d;
  }

  .action-self-benefit strong {
    color: #065f46;
  }

  .action-why {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.09) 0%, rgba(251, 191, 36, 0.1) 100%);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 14px;
    padding: 0.6rem 0.8rem;
    margin-bottom: 0.85rem;
  }

  .why-label {
    display: block;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--emerald-600);
    margin-bottom: 0.15rem;
  }

  .action-why p {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.45;
    color: var(--text-primary);
    font-weight: 500;
  }

  .action-steps {
    list-style: none;
    margin: 0 0 1.05rem 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .action-steps li {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    font-size: 0.86rem;
    line-height: 1.45;
    color: var(--text-primary);
  }

  .step-num {
    flex-shrink: 0;
    width: 21px;
    height: 21px;
    border-radius: 50%;
    background: #0d281d;
    color: #fde68a;
    font-size: 0.74rem;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.08rem;
  }

  .instant-actions {
    display: flex;
    gap: 0.48rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .btn-studio-primary {
    flex: 1;
    min-width: 185px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.78rem 1.05rem;
    border-radius: 14px;
    background: linear-gradient(135deg, #0d2e20 0%, #1b573e 100%);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.9rem;
    text-decoration: none;
    box-shadow: 0 10px 22px -6px rgba(13, 46, 32, 0.45);
    transition: all 0.2s var(--ease-gentle);
  }

  .btn-studio-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px -6px rgba(13, 46, 32, 0.6);
  }

  .btn-studio-done {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    padding: 0.78rem 0.95rem;
    border-radius: 14px;
    border: 1.5px solid rgba(5, 150, 105, 0.35);
    background: rgba(16, 185, 129, 0.12);
    color: #065f46;
    font-weight: 800;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .btn-studio-done:hover {
    background: #059669;
    color: #ffffff;
  }

  .btn-studio-cycle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.78rem 0.85rem;
    border-radius: 14px;
    border: 1px solid rgba(22, 66, 48, 0.15);
    background: #ffffff;
    color: var(--text-secondary);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .btn-studio-cycle:hover {
    border-color: var(--czech-forest);
    color: var(--text-primary);
  }

  .hero-wave {
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    line-height: 0;
    pointer-events: none;
  }

  .hero-wave svg {
    width: 100%;
    height: 68px;
    display: block;
  }

  /* ==========================================================================
     SHARED SECTION TYPOGRAPHY
     ========================================================================== */
  .content-wrap {
    max-width: 1180px;
    margin: 0 auto;
    padding: 3.5rem 1.25rem 0 1.25rem;
  }

  .section-header {
    text-align: center;
    max-width: 720px;
    margin: 0 auto 2.4rem auto;
  }

  .section-kicker {
    display: inline-block;
    padding: 0.3rem 0.8rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.24);
    color: #065f46;
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 0.75rem;
  }

  .section-header h2 {
    font-size: clamp(1.85rem, 3.2vw, 2.75rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.12;
    color: #091d14;
    margin: 0 0 0.75rem 0;
  }

  .section-header h2 .serif-accent {
    font-size: 1.12em;
    color: #145338;
  }

  .section-header p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 1.02rem;
    line-height: 1.6;
  }

  /* ==========================================================================
     2. THREE PATHS BENTO GRID
     ========================================================================== */
  .bento-paths {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
  }

  .bento-card {
    position: relative;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(22, 66, 48, 0.1);
    border-radius: 26px;
    padding: 1.75rem;
    box-shadow: var(--shadow-md);
    display: flex;
    flex-direction: column;
    transition: transform 0.28s var(--ease-gentle), box-shadow 0.28s var(--ease-gentle);
  }

  .bento-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }

  .bento-accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
  }

  .bento-accent.emerald {
    background: linear-gradient(90deg, #10b981, #34d399);
  }
  .bento-accent.amber {
    background: linear-gradient(90deg, #f59e0b, #fde68a);
  }
  .bento-accent.forest {
    background: linear-gradient(90deg, #0d2e20, #10b981);
  }

  .bento-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .bento-icon-wrap.emerald {
    background: rgba(16, 185, 129, 0.13);
    color: #047857;
  }
  .bento-icon-wrap.amber {
    background: rgba(245, 158, 11, 0.15);
    color: #b45309;
  }
  .bento-icon-wrap.forest {
    background: rgba(13, 46, 32, 0.1);
    color: #0d2e20;
  }

  .bento-meta {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 0.35rem;
  }

  .bento-card h3 {
    font-size: 1.32rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #091d14;
    margin: 0 0 0.55rem 0;
  }

  .bento-desc {
    color: var(--text-secondary);
    font-size: 0.94rem;
    line-height: 1.6;
    margin: 0 0 1.1rem 0;
  }

  .bento-whisper {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-muted);
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    background: #f5f2e9;
    margin-bottom: 1.2rem;
  }

  .bento-link {
    margin-top: auto;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.78rem 1rem;
    border-radius: 14px;
    background: #0d281d;
    color: #ffffff;
    font-weight: 700;
    font-size: 0.9rem;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .bento-link:hover {
    background: #164230;
    padding-right: 0.85rem;
  }

  /* ==========================================================================
     3. INTERACTIVE LIVING CZECHIA MAP SHOWCASE
     ========================================================================== */
  .map-stage {
    position: relative;
    overflow: hidden;
    border-radius: 32px;
    padding: 2.6rem 2.2rem;
    background:
      radial-gradient(90% 100% at 15% 15%, rgba(52, 211, 153, 0.22) 0%, transparent 55%),
      radial-gradient(80% 90% at 88% 85%, rgba(251, 191, 36, 0.18) 0%, transparent 55%),
      linear-gradient(155deg, #0d2c1f 0%, #143f2d 55%, #0f3223 100%);
    color: #f8faf8;
    box-shadow: 0 26px 54px -18px rgba(10, 34, 24, 0.22);
  }

  .map-stage-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 2rem;
    flex-wrap: wrap;
    margin-bottom: 1.85rem;
  }

  .stage-kicker {
    display: inline-block;
    font-size: 0.76rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6ee7b7;
    margin-bottom: 0.45rem;
  }

  .map-stage-head h2 {
    margin: 0;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.12;
    color: #ffffff;
  }

  .serif-gold {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: 1.14em;
    color: #fde68a;
  }

  .map-stage-head p {
    margin: 0;
    max-width: 420px;
    color: rgba(214, 235, 224, 0.78);
    font-size: 0.94rem;
    line-height: 1.55;
  }

  .map-interactive-grid {
    display: grid;
    grid-template-columns: 1.25fr 0.85fr;
    gap: 1.5rem;
    align-items: stretch;
  }

  .cz-svg-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 1.1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .cz-svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .city-node {
    cursor: pointer;
    outline: none;
  }

  .beacon-dot {
    fill: #34d399;
    stroke: #061810;
    stroke-width: 2px;
    transition: all 0.22s ease;
  }

  .city-node:hover .beacon-dot,
  .city-node.selected .beacon-dot {
    fill: #fde68a;
  }

  .pulse-ring {
    fill: none;
    stroke: #fde68a;
    stroke-width: 2px;
    animation: pulseBeacon 2.2s ease-out infinite;
  }

  .beacon-label {
    fill: rgba(236, 253, 245, 0.78);
    font-family: var(--font-sans);
    font-size: 11.5px;
    font-weight: 700;
    pointer-events: none;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.85);
  }

  .city-node.selected .beacon-label {
    fill: #fde68a;
    font-weight: 800;
    font-size: 13px;
  }

  .city-pills-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .city-pill-btn {
    padding: 0.28rem 0.62rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(236, 253, 245, 0.82);
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .city-pill-btn:hover {
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
  }

  .city-pill-btn.active {
    background: #fde68a;
    color: #061810;
    border-color: #fde68a;
    font-weight: 800;
  }

  /* Inspector Panel */
  .city-inspector {
    background: rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.13);
    border-radius: 24px;
    padding: 1.45rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .inspector-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: rgba(52, 211, 153, 0.2);
    color: #6ee7b7;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.35rem;
  }

  .inspector-head h3 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 800;
    color: #ffffff;
  }

  .inspector-head p {
    margin: 0.2rem 0 0 0;
    font-size: 0.86rem;
    color: rgba(214, 235, 224, 0.75);
  }

  .inspector-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    flex: 1;
  }

  .inspector-item {
    padding: 0.8rem 0.9rem;
    border-radius: 16px;
    background: rgba(6, 21, 15, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .inspector-item-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.2rem;
  }

  .inspector-subcat {
    font-size: 0.72rem;
    font-weight: 700;
    color: #fde68a;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .inspector-dist {
    font-size: 0.72rem;
    color: rgba(209, 250, 229, 0.65);
  }

  .inspector-name {
    font-weight: 800;
    font-size: 0.95rem;
    color: #ffffff;
    margin-bottom: 0.2rem;
  }

  .inspector-desc {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.45;
    color: rgba(214, 235, 224, 0.78);
  }

  .inspector-addr {
    margin-top: 0.35rem;
    font-size: 0.76rem;
    color: #6ee7b7;
  }

  .inspector-cta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.1rem;
    border-radius: 14px;
    background: linear-gradient(135deg, #34d399 0%, #fde68a 100%);
    color: #061810;
    font-weight: 800;
    font-size: 0.9rem;
    text-decoration: none;
    transition: transform 0.18s ease;
  }

  .inspector-cta:hover {
    transform: translateY(-2px);
  }

  /* ==========================================================================
     4. HOPE FACTS BENTO (.hope-section)
     ========================================================================== */
  .hope-bento {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.15rem;
  }

  .hope-tile {
    background: #ffffff;
    border: 1px solid rgba(22, 66, 48, 0.1);
    border-radius: 24px;
    padding: 1.65rem;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    transition: transform 0.24s var(--ease-gentle), box-shadow 0.24s var(--ease-gentle);
  }

  .hope-tile:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }

  .hope-tile.featured {
    background: linear-gradient(155deg, #0b261b 0%, #143f2d 100%);
    color: #f8faf8;
    border-color: rgba(52, 211, 153, 0.25);
  }

  .hope-number {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: clamp(2.1rem, 3.2vw, 2.85rem);
    line-height: 1.05;
    color: #059669;
    margin-bottom: 0.55rem;
  }

  .hope-tile.featured .hope-number {
    color: #fde68a;
  }

  .hope-title {
    font-size: 1.1rem;
    font-weight: 800;
    line-height: 1.3;
    margin: 0 0 0.5rem 0;
    color: inherit;
  }

  .hope-detail {
    font-size: 0.9rem;
    line-height: 1.58;
    color: var(--text-secondary);
    margin: 0 0 1.1rem 0;
    flex: 1;
  }

  .hope-tile.featured .hope-detail {
    color: rgba(220, 240, 230, 0.82);
  }

  .hope-cta {
    font-size: 0.86rem;
    font-weight: 800;
    color: #059669;
    text-decoration: none;
  }

  .hope-tile.featured .hope-cta {
    color: #6ee7b7;
  }

  .hope-cta:hover {
    text-decoration: underline;
  }

  /* ==========================================================================
     5. EDITORIAL STORIES
     ========================================================================== */
  .stories-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.15rem;
  }

  .story-card {
    position: relative;
    background: linear-gradient(180deg, #ffffff 0%, #faf8f2 100%);
    border: 1px solid rgba(22, 66, 48, 0.1);
    border-radius: 24px;
    padding: 1.65rem;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    transition: transform 0.22s var(--ease-gentle);
  }

  .story-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }

  .quote-mark {
    position: absolute;
    top: 0.7rem;
    right: 1.25rem;
    font-family: var(--font-serif);
    font-size: 4.5rem;
    line-height: 1;
    color: rgba(16, 185, 129, 0.14);
    pointer-events: none;
  }

  .story-tag-pill {
    align-self: flex-start;
    padding: 0.24rem 0.65rem;
    border-radius: 999px;
    background: rgba(245, 158, 11, 0.13);
    color: #92400e;
    font-size: 0.75rem;
    font-weight: 700;
    margin-bottom: 0.8rem;
  }

  .story-quote {
    margin: 0 0 1.2rem 0;
    font-size: 0.95rem;
    line-height: 1.62;
    color: var(--text-primary);
    flex: 1;
  }

  .story-footer {
    padding-top: 0.9rem;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .story-author {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }

  .author-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #ebe6d8;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  .author-name {
    font-weight: 800;
    font-size: 0.88rem;
    color: #091d14;
  }

  .story-link {
    font-size: 0.84rem;
    font-weight: 800;
    color: #059669;
    text-decoration: none;
  }

  .story-link:hover {
    text-decoration: underline;
  }

  /* ==========================================================================
     6. PORTALS & COMMUNITY INVITE BANNER
     ========================================================================== */
  .portals-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }

  .portal-card {
    background: rgba(255, 255, 255, 0.86);
    border: 1px solid rgba(22, 66, 48, 0.1);
    border-radius: 20px;
    padding: 1.3rem;
    text-decoration: none;
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    transition: all 0.2s var(--ease-gentle);
  }

  .portal-card:hover {
    transform: translateY(-4px);
    background: #ffffff;
    border-color: #10b981;
    box-shadow: var(--shadow-md);
  }

  .portal-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.45rem;
  }

  .portal-top h3 {
    margin: 0;
    font-size: 1.02rem;
    font-weight: 800;
    color: #091d14;
  }

  .ext-icon {
    color: #059669;
    font-weight: 800;
  }

  .portal-card p {
    margin: 0 0 0.7rem 0;
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--text-secondary);
    flex: 1;
  }

  .portal-bullets {
    margin: 0;
    padding-left: 1rem;
    font-size: 0.78rem;
    color: var(--text-muted);
    line-height: 1.45;
  }

  .community-cta-banner {
    margin-top: 2.5rem;
    border-radius: 28px;
    padding: 2.2rem 2.4rem;
    background: linear-gradient(135deg, #0b2419 0%, #164230 60%, #1d573f 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    flex-wrap: wrap;
    box-shadow: var(--shadow-lg);
  }

  .cta-banner-copy {
    max-width: 640px;
  }

  .cta-banner-copy h3 {
    margin: 0.2rem 0 0.45rem 0;
    font-size: 1.45rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .cta-banner-copy p {
    margin: 0;
    color: rgba(220, 240, 230, 0.82);
    font-size: 0.95rem;
  }

  .cta-banner-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.95rem 1.45rem;
    border-radius: 14px;
    background: linear-gradient(135deg, #fde68a 0%, #34d399 100%);
    color: #061810;
    font-weight: 800;
    text-decoration: none;
    white-space: nowrap;
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.25);
    transition: transform 0.2s ease;
  }

  .cta-banner-btn:hover {
    transform: translateY(-2px);
  }

  .home-portals-drawer {
    margin-bottom: 1.5rem;
  }

  .drawer-lead {
    margin: 0.5rem 0 1rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .sanctuary-breath-link {
    display: inline-flex;
    align-items: center;
    padding: 0.88rem 1.2rem;
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ecfdf5;
    font-weight: 700;
    font-size: 0.9rem;
    text-decoration: none;
    transition: background 0.2s ease;
  }

  .sanctuary-breath-link:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  .action-reassurance {
    display: flex;
    align-items: flex-start;
    gap: 0.45rem;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    background: #f4f1e8;
    border: 1px solid rgba(22, 66, 48, 0.1);
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1.42;
    margin-bottom: 0.85rem;
  }

  /* ==========================================================================
     2B. SANCTUARY PORTAL BANNER (/svet)
     ========================================================================== */
  .sanctuary-portal-card {
    border-radius: 30px;
    padding: 2.2rem 2.4rem;
    background:
      radial-gradient(80% 100% at 88% 20%, rgba(251, 191, 36, 0.24) 0%, transparent 58%),
      radial-gradient(75% 90% at 12% 85%, rgba(52, 211, 153, 0.22) 0%, transparent 55%),
      linear-gradient(145deg, #061b12 0%, #0f3323 55%, #174933 100%);
    color: #f8faf8;
    display: grid;
    grid-template-columns: 1.25fr 0.85fr;
    align-items: center;
    gap: 2rem;
    box-shadow: var(--shadow-xl);
    border: 1px solid rgba(110, 231, 183, 0.24);
  }

  .sanctuary-copy {
    max-width: 660px;
  }

  .sanctuary-copy h2 {
    margin: 0.15rem 0 0.55rem 0;
    font-size: clamp(1.65rem, 2.8vw, 2.3rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.14;
    color: #ffffff;
  }

  .sanctuary-copy p {
    margin: 0 0 1rem 0;
    color: rgba(224, 242, 232, 0.88);
    font-size: 0.96rem;
    line-height: 1.62;
  }

  .sanctuary-stats-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
  }

  .sanc-pill {
    padding: 0.34rem 0.72rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.09);
    border: 1px solid rgba(255, 255, 255, 0.16);
    font-size: 0.8rem;
    color: #ecfdf5;
  }

  .sanc-pill strong {
    color: #fde68a;
  }

  .sanctuary-cta-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .sanctuary-open-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.95rem 1.45rem;
    border-radius: 16px;
    background: linear-gradient(135deg, #fde68a 0%, #34d399 100%);
    color: #051810;
    font-weight: 800;
    font-size: 0.96rem;
    text-decoration: none;
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.32);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .sanctuary-open-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 36px rgba(0, 0, 0, 0.42);
  }

  .sanctuary-preview-window {
    position: relative;
    display: block;
    border-radius: 22px;
    overflow: hidden;
    border: 1.5px solid rgba(253, 230, 138, 0.42);
    box-shadow:
      0 24px 48px -12px rgba(2, 10, 6, 0.65),
      0 0 36px -8px rgba(251, 191, 36, 0.28);
    aspect-ratio: 16 / 10;
    text-decoration: none;
    transition: transform 0.28s var(--ease-gentle), box-shadow 0.28s var(--ease-gentle);
  }

  .sanctuary-preview-window:hover {
    transform: translateY(-4px) scale(1.015);
    box-shadow:
      0 30px 58px -12px rgba(2, 10, 6, 0.75),
      0 0 46px -6px rgba(253, 230, 138, 0.42);
  }

  .sanctuary-preview-window img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .spw-badge {
    position: absolute;
    right: 0.85rem;
    bottom: 0.85rem;
    padding: 0.42rem 0.85rem;
    border-radius: 999px;
    background: rgba(6, 24, 16, 0.84);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(253, 230, 138, 0.5);
    color: #fde68a;
    font-size: 0.8rem;
    font-weight: 800;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  }

  /* ==========================================================================
     RESPONSIVE BREAKPOINTS
     ========================================================================== */
  @media (max-width: 1024px) {
    .hero-inner,
    .sanctuary-portal-card {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    .bento-paths,
    .hope-bento,
    .stories-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .portals-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .map-interactive-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .hero-stage {
      padding: 6.8rem 0.9rem 4.8rem 0.9rem;
    }
    .energy-tabs {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .sanctuary-portal-card {
      padding: 1.5rem 1.25rem;
    }
    .bento-paths,
    .hope-bento,
    .stories-grid,
    .portals-grid {
      grid-template-columns: 1fr;
    }
    .map-stage {
      padding: 1.6rem 1.1rem;
      border-radius: 24px;
    }
    .community-cta-banner {
      padding: 1.6rem 1.35rem;
    }
  }
</style>
