<script>
  import { buildFirstContactTemplate } from '../../../data/czech-actions.js';
  import { sanitizeHttpUrl as normalizeUrl } from '../../../security.js';
  import {
    getActionEffectMeta,
    impactCanvas,
    holdSpark
  } from '../../../sensoryEngine.js';

  export let p;
  export let idx = 0;
  export let isActive = false;
  export let isTopPick = false;
  export let isStarted = false;
  export let soundMuted = false;
  export let activeEffectPlaceId = null;
  export let openTemplateId = null;
  export let copiedTemplateId = null;
  export let placeMetric = 0;

  export let onMouseEnter = null;
  export let onMouseLeave = null;
  export let onStart = null;
  export let onDone = null;
  export let onToggleEffect = null;
  export let onToggleSound = null;
  export let onFocusMap = null;
  export let onShare = null;
  export let onToggleTemplate = null;
  export let onCopyTemplate = null;

  const KIND_META = {
    ngo: { emoji: '🏛️', label: 'Neziskovka / spolek', color: '#059669' },
    community: { emoji: '🤝', label: 'Komunita / knihobudka', color: '#0d9488' },
    food: { emoji: '🥫', label: 'Potraviny a šatník', color: '#d97706' },
    animals: { emoji: '🐾', label: 'Zvířata a útulek', color: '#2563eb' }
  };

  const HELP_WAY_META = {
    food_donation: { icon: '🥫', label: 'Darovat potraviny' },
    material_dropoff: { icon: '🧥', label: 'Přinést věci / knihy' },
    one_off_help: { icon: '⚡', label: 'Jednorázová výpomoc' },
    regular_volunteering: { icon: '🤝', label: 'Dobrovolnictví' }
  };

  const VISIT_MODE_META = {
    drop_in: { icon: '🟢', label: 'Volně přístupné bez domlouvání' },
    opening_hours: { icon: '🕒', label: 'Otevírací doba' },
    by_agreement: { icon: '📅', label: 'Po domluvě' }
  };

  function formatDist(km) {
    if (!Number.isFinite(km)) return '';
    if (km < 1) return `${Math.max(100, Math.round(km * 10) * 100)} m`;
    return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`;
  }

  function isSelfServicePoint(place) {
    const text = `${place?.name || ''} ${place?.subcategory || ''}`.toLowerCase();
    return (
      /knihobudka|knihovnička|public_bookcase|give_box|reuse skříňka|freeshop|sdílená lednice|food_sharing|potravinová skříňka/.test(
        text
      ) ||
      (place?.visitMode === 'drop_in' && !place?.website && !place?.email && !place?.phone)
    );
  }

  function getPlaceVisitMode(place) {
    if (place.visitMode) return place.visitMode;
    if (isSelfServicePoint(place)) return 'drop_in';
    if (place.openingHours) return 'opening_hours';
    return 'by_agreement';
  }

  function getPlaceHelpWays(place) {
    if (Array.isArray(place.helpWays) && place.helpWays.length > 0) return place.helpWays;
    const ways = [];
    if (place.kind === 'food') ways.push('food_donation');
    if (place.kind === 'community') ways.push('material_dropoff');
    if (place.kind === 'ngo' || place.kind === 'animals') {
      ways.push('one_off_help', 'regular_volunteering');
    }
    return ways.length ? ways : ['one_off_help'];
  }

  function concreteActionHint(place) {
    if (isSelfServicePoint(place)) {
      if (/knihobudka|kni/i.test(place.name || place.subcategory || '')) {
        return 'Přines 1-2 přečtené knížky v dobrém stavu nebo si vyber novou četbu.';
      }
      return 'Vlož trvanlivé potraviny či zachovalé oblečení pro lidi v nouzi.';
    }
    if (place.kind === 'animals') {
      return 'Zavolej a zeptej se na venčení pejsků nebo přines konzervy a pamlsky.';
    }
    if (place.kind === 'food') {
      return 'Přines trvanlivé potraviny, drogerii nebo teplé oblečení.';
    }
    return 'Napiš krátkou zprávu koordinátorovi — ozvou se ti s konkrétní potřebou.';
  }

  $: meta = KIND_META[p?.kind] || KIND_META.ngo;
  $: webUrl = p?.website ? normalizeUrl(p.website) : '';
  $: selfService = isSelfServicePoint(p);
  $: visitMode = VISIT_MODE_META[getPlaceVisitMode(p)] || VISIT_MODE_META.by_agreement;
  $: helpWays = getPlaceHelpWays(p);
  $: placeAction = {
    id: p?.id,
    title: p?.name || 'Místo pomoci',
    category: p?.kind || 'ngo',
    subcategory: p?.subcategory || ''
  };
  $: cardId = `place-card-${String(p?.id || '').replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  $: tpl = p ? buildFirstContactTemplate(p) : null;
  $: effectMeta = getActionEffectMeta(placeAction, placeMetric || 0);
</script>

{#if p}
  <article
    id={cardId}
    class="place-card"
    data-molly-guide={idx === 0 ? 'true' : undefined}
    class:active={isActive}
    class:top-pick={isTopPick}
    on:mouseenter={onMouseEnter}
    on:mouseleave={onMouseLeave}
  >
    <div class="pc-meta-top">
      <span class="pc-cat">{meta.emoji} {p.subcategory || meta.label}</span>
      <span>·</span>
      <span class="pc-dist">{formatDist(p.distanceKm)}</span>
      <span>·</span>
      {#if p.curated || p.sourceType === 'verified_org'}
        <span class="pc-verified" title="Ručně ověřená organizace v ČR">
          ✦ Ověřená organizace · Ověřeno {p.verifiedAt || '11/2026'}
        </span>
      {:else if p.sourceType === 'community'}
        <span class="pc-community-badge" title="Sousedský komunitní tip">
          🌱 Komunitní tip
        </span>
        {#if p.pendingModeration}
          <span>·</span>
          <span class="pc-pending-badge" title="Tvůj tip čeká na schválení moderátorem">
            ⏳ Čeká na schválení
          </span>
        {/if}
      {:else}
        <span class="pc-osm-badge" title="Orientační bod z veřejné mapy OpenStreetMap">
          🗺️ Orientační bod OSM
        </span>
      {/if}
    </div>

    <h3 class="pc-title">{p.name}</h3>

    {#if p.address}
      <div class="pc-addr">📍 {p.address}</div>
    {/if}

    <p class="pc-desc">{p.description || ''}</p>

    <!-- STRUCTURED DECISION CONTEXT: JAK TU MŮŽEŠ POMOCT -->
    <div class="pc-decision-box">
      <div class="pcd-chips">
        <span class="pcd-visit-badge">{visitMode.icon} {visitMode.label}</span>
        {#each helpWays as hw}
          {#if HELP_WAY_META[hw]}
            <span class="pcd-way-chip">{HELP_WAY_META[hw].icon} {HELP_WAY_META[hw].label}</span>
          {/if}
        {/each}
      </div>
      <p class="pcd-mission">
        <strong>Jak tu můžeš pomoct:</strong> {concreteActionHint(p)}
      </p>
    </div>

    <div class="pc-actions">
      {#if webUrl}
        <a
          href={webUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="pc-btn primary"
          use:holdSpark={{ id: p.id, surface: 'near_place' }}
          on:click={() => onStart && onStart(p)}
        >
          Web ↗
        </a>
      {:else if selfService}
        <a
          href={`https://mapy.cz/zakladni?x=${p.lon}&y=${p.lat}&z=17&q=${encodeURIComponent(p.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          class="pc-btn primary"
          use:holdSpark={{ id: p.id, surface: 'near_place' }}
          on:click={() => onStart && onStart(p)}
        >
          🧭 Navigovat (Mapy.cz) ↗
        </a>
      {:else}
        <button
          type="button"
          class="pc-btn msg"
          on:click={() => onToggleTemplate && onToggleTemplate(p)}
        >
          {openTemplateId === p.id ? 'Skrýt zprávu' : '💬 Co napsat'}
        </button>
      {/if}

      <button
        type="button"
        class="pc-btn done"
        class:initiated={isStarted}
        on:click={() => onDone && onDone(p)}
      >
        {isStarted ? '✓ Dokončeno' : '✓ Hotovo'}
      </button>
    </div>

    <div
      class="card-effect-stage"
      data-scene={effectMeta?.scene || 'default'}
    >
      <div class="card-effect-head">
        <span class="impact-payoff-badge">
          {effectMeta?.badge || ''}
        </span>
        <div class="card-effect-controls">
          <button
            type="button"
            class="effect-spark-btn"
            class:active={activeEffectPlaceId === p.id}
            aria-pressed={activeEffectPlaceId === p.id}
            aria-label="Vyzkoušet interaktivní fyzikální a zvukový efekt místa"
            title="Spustit vlnu dopadu na plátně"
            on:click={(e) => onToggleEffect && onToggleEffect(p, e)}
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
        class="impact-payoff-canvas"
        width="320"
        height="68"
        aria-label="Fyzikální vizualizace dopadu dobrého skutku"
        use:impactCanvas={{
          action: placeAction,
          climax: false,
          onProgress: (v) => {
            placeMetric = v;
          }
        }}
      ></canvas>
    </div>

    {#if openTemplateId === p.id && !selfService && tpl}
      <div class="template-drawer">
        <div class="td-head">
          <strong>Vzor krátké zprávy:</strong>
          {#if p.phone}
            <span>📞 <a href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}>{p.phone}</a></span>
          {/if}
        </div>
        <pre class="td-body">{tpl.body}</pre>
        <div class="td-btns">
          <button
            type="button"
            class="pc-btn primary"
            on:click={() => onCopyTemplate && onCopyTemplate(p)}
          >
            {copiedTemplateId === p.id ? '✓ Zkopírováno' : '📋 Zkopírovat text'}
          </button>
          {#if tpl.mailtoUrl}
            <a href={tpl.mailtoUrl} class="pc-btn ghost">✉️ E-mail</a>
          {/if}
          <a
            href={`https://mapy.cz/zakladni?x=${p.lon}&y=${p.lat}&z=16&q=${encodeURIComponent(p.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            class="pc-btn ghost"
          >
            🧭 Mapy.cz ↗
          </a>
        </div>
      </div>
    {/if}

    <div class="pc-verify-footer">
      <span>
        {#if p.curated || p.sourceType === 'verified_org'}
          Zdroj: Ověřený katalog ({p.verifiedAt || '11/2026'})
        {:else if p.sourceType === 'community'}
          Zdroj: Komunitní tip v okolí
        {:else}
          Zdroj: OpenStreetMap ČR — před návštěvou doporučujeme ověřit otevírací dobu
        {/if}
      </span>
      <span class="pc-footer-links">
        {#if webUrl && !selfService}
          <button
            type="button"
            class="pc-report-btn"
            on:click={() => onToggleTemplate && onToggleTemplate(p)}
          >
            {openTemplateId === p.id ? 'Skrýt zprávu' : '💬 Co napsat'}
          </button>
          ·
        {/if}
        {#if onFocusMap}
          <button
            type="button"
            class="pc-report-btn"
            on:click={() => onFocusMap(p)}
          >
            📍 Na mapě
          </button>
          ·
        {/if}
        {#if onShare}
          <button
            type="button"
            class="pc-report-btn pc-share-btn"
            on:click={() => onShare(p)}
          >
            🔗 Sdílet místo
          </button>
        {/if}
      </span>
    </div>
  </article>
{/if}

<style>
  .place-card {
    background: rgba(255, 255, 255, 0.97);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 1.15rem;
    padding: 1.15rem 1.25rem;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    display: flex;
    flex-direction: column;
  }

  .place-card:hover,
  .place-card.active {
    border-color: rgba(16, 185, 129, 0.48);
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.12);
  }

  .place-card.top-pick {
    border-color: rgba(16, 185, 129, 0.35);
    background: linear-gradient(145deg, #ffffff 0%, rgba(240, 253, 244, 0.5) 100%);
  }

  .pc-meta-top {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    font-size: 0.76rem;
    color: var(--text-muted, #6b7280);
    margin-bottom: 0.4rem;
  }

  .pc-cat {
    font-weight: 700;
    color: #059669;
  }

  .pc-dist {
    font-weight: 700;
    color: #065f46;
  }

  .pc-verified {
    color: #047857;
    font-weight: 600;
  }

  .pc-community-badge {
    color: #0d9488;
    font-weight: 600;
  }

  .pc-pending-badge {
    color: #d97706;
    font-weight: 600;
  }

  .pc-osm-badge {
    color: #4b5563;
    font-weight: 500;
  }

  .pc-title {
    margin: 0 0 0.35rem 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-heading, #1f2937);
  }

  .pc-addr {
    font-size: 0.8rem;
    color: var(--text-muted, #6b7280);
    margin-bottom: 0.55rem;
  }

  .pc-desc {
    font-size: 0.88rem;
    line-height: 1.48;
    color: var(--text-secondary, #374151);
    margin: 0 0 0.75rem 0;
  }

  .pc-decision-box {
    background: rgba(240, 253, 244, 0.55);
    border: 1px solid rgba(16, 185, 129, 0.18);
    border-radius: 0.75rem;
    padding: 0.65rem 0.85rem;
    margin-bottom: 0.85rem;
  }

  .pcd-chips {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin-bottom: 0.35rem;
  }

  .pcd-visit-badge,
  .pcd-way-chip {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    background: #ffffff;
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #065f46;
  }

  .pcd-mission {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.4;
    color: var(--text-heading, #1f2937);
  }

  .pcd-mission strong {
    color: #047857;
  }

  .pc-actions {
    display: flex;
    gap: 0.55rem;
    align-items: center;
    margin-bottom: 0.65rem;
    flex-wrap: wrap;
  }

  .pc-btn {
    appearance: none;
    font-family: inherit;
    font-size: 0.84rem;
    font-weight: 600;
    padding: 0.5rem 0.95rem;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .pc-btn.primary {
    background: #059669;
    color: #ffffff;
  }

  .pc-btn.primary:hover {
    background: #047857;
  }

  .pc-btn.msg {
    background: #eef2ff;
    color: #3730a3;
    border: 1px solid rgba(99, 102, 241, 0.25);
  }

  .pc-btn.done {
    background: #eef7f1;
    color: #065f46;
    border: 1px solid rgba(5, 150, 105, 0.25);
  }

  .pc-btn.done.initiated {
    background: #059669;
    color: #ffffff;
  }

  .pc-btn.ghost {
    background: #f1f5f9;
    color: #334155;
  }

  .card-effect-stage {
    margin: 0.5rem 0 0.45rem;
    border-radius: 10px;
    background: rgba(240, 253, 244, 0.5);
    padding: 0.45rem;
    border: 1px solid rgba(16, 185, 129, 0.15);
  }

  .card-effect-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .impact-payoff-badge {
    font-size: 0.72rem;
    font-weight: 700;
    color: #065f46;
  }

  .card-effect-controls {
    display: flex;
    gap: 0.3rem;
  }

  .effect-spark-btn,
  .sound-mute-btn {
    border: 1px solid rgba(16, 185, 129, 0.25);
    background: #ffffff;
    border-radius: 999px;
    padding: 0.15rem 0.45rem;
    font-size: 0.68rem;
    font-weight: 600;
    cursor: pointer;
  }

  .impact-payoff-canvas {
    display: block;
    width: 100%;
    max-width: 320px;
    height: 68px;
    margin: 0 auto;
    border-radius: 6px;
  }

  .template-drawer {
    margin-top: 0.55rem;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 0.75rem;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .td-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.78rem;
    margin-bottom: 0.35rem;
  }

  .td-body {
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 6px;
    padding: 0.65rem;
    font-family: inherit;
    font-size: 0.78rem;
    line-height: 1.42;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0 0 0.55rem 0;
  }

  .td-btns {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .pc-verify-footer {
    margin-top: auto;
    padding-top: 0.55rem;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    font-size: 0.72rem;
    color: var(--text-muted, #6b7280);
    flex-wrap: wrap;
  }

  .pc-footer-links {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .pc-report-btn {
    border: none;
    background: none;
    padding: 0;
    font-size: 0.72rem;
    font-weight: 600;
    color: #059669;
    cursor: pointer;
    text-decoration: underline;
  }

  @media (max-width: 680px) {
    .place-card {
      padding: 0.68rem 0.78rem;
      border-radius: 15px;
      max-width: 100%;
      box-sizing: border-box;
      overflow-wrap: break-word;
    }

    .pc-meta-top {
      font-size: 0.68rem;
      margin-bottom: 0.18rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-wrap: nowrap;
    }

    .pc-title {
      font-size: 0.95rem;
      margin: 0 0 0.14rem;
    }

    .pc-addr {
      font-size: 0.71rem;
      margin-bottom: 0.2rem;
    }

    .pc-desc {
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 0.75rem;
      line-height: 1.32;
      margin-bottom: 0.3rem;
    }

    .pc-decision-box {
      padding: 0.32rem 0.48rem;
      margin-bottom: 0.3rem;
    }

    .pcd-chips {
      gap: 0.2rem;
      margin-bottom: 0.16rem;
    }

    .pcd-mission {
      font-size: 0.73rem;
      line-height: 1.28;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .pc-btn {
      min-height: 40px;
      padding: 0.48rem 0.75rem;
      font-size: 0.78rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      box-sizing: border-box;
    }

    .card-effect-stage {
      margin-top: 0.28rem;
      padding: 0.3rem 0.46rem;
    }

    .place-card :global(.impact-payoff-canvas) {
      height: 48px;
    }

    .pc-verify-footer {
      margin-top: 0.26rem;
      padding-top: 0.22rem;
      font-size: 0.65rem;
    }
  }
</style>
