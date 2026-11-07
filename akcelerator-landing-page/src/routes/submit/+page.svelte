<script>
  import { CZECH_CITIES, LOCAL_COMMUNITY_ITEMS } from '../../lib/data/czech-actions.js';
  import { recordSmallWin } from '../../lib/progress.js';
  import { trackEvent } from '../../lib/analytics.js';

  const QUICK_CATEGORIES = [
    '🐾 Zvířata a útulky',
    '🥫 Potraviny a šatníky',
    '📚 Knihobudka / Re-use místo',
    '🤝 Komunita a sousedé',
    '👴 Senioři',
    '🌱 Příroda a úklid'
  ];

  let kind = 'org'; // org | event

  let name = '';
  let category = '';
  let website = '';
  let email = '';
  let phone = '';
  let description = '';

  let eventUrl = '';
  let eventStartLocal = '';
  let eventEndLocal = '';

  // Location picker (1-click city OR /api/geocode)
  let locationQuery = '';
  let geoStatus = 'idle'; // idle | loading | ok | error
  let geoMessage = '';
  /** @type {Array<{label: string, lat: number, lon: number}>} */
  let geoResults = [];
  let lat = null;
  let lon = null;
  let addressLabel = '';

  // Spam protection (honeypot + time)
  let hp = '';
  const startedAt = Date.now();

  let isSubmitting = false;
  let submitStatus = null; // null | success | error
  let submitMessage = '';
  let submittedMapUrl = '/near';

  function safeText(v) {
    return typeof v === 'string' ? v.trim() : '';
  }

  function firstText(v) {
    const s = safeText(v);
    if (!s) return '';
    return s.split(',')[0] || s;
  }

  function pickQuickCity(city) {
    lat = city.lat;
    lon = city.lon;
    addressLabel = city.name;
    locationQuery = city.name;
    geoResults = [];
    geoStatus = 'ok';
    geoMessage = `Vybráno město: ${city.name}`;
  }

  async function searchLocation() {
    const q = safeText(locationQuery);
    if (!q || q.length < 2) {
      geoStatus = 'error';
      geoMessage = 'Zadej aspoň 2 znaky.';
      geoResults = [];
      return;
    }

    geoStatus = 'loading';
    geoMessage = 'Hledám přesnou adresu…';
    geoResults = [];

    try {
      const resp = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=6`);
      const data = await resp.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      geoResults = results;
      if (!results.length) {
        geoStatus = 'error';
        geoMessage = 'Přesnou adresu jsem nenašel – můžeš kliknout na nejbližší město výše.';
        return;
      }
      geoStatus = 'ok';
      geoMessage = 'Vyber přesné místo ze seznamu:';
    } catch {
      geoStatus = 'error';
      geoMessage = 'Vyhledávání adresy je dočasně nedostupné – vyber prosím město tlačítkem výše.';
    }
  }

  function pickLocation(r) {
    lat = typeof r?.lat === 'number' ? r.lat : null;
    lon = typeof r?.lon === 'number' ? r.lon : null;
    addressLabel = safeText(r?.label);
    locationQuery = firstText(addressLabel);
    geoResults = [];
    geoMessage = 'Poloha vybrána.';
    geoStatus = 'ok';
  }

  function toIsoOrNull(dtLocal) {
    const s = safeText(dtLocal);
    if (!s) return null;
    const d = new Date(s);
    return Number.isFinite(d.getTime()) ? d.toISOString() : null;
  }

  async function submit() {
    submitStatus = null;
    submitMessage = '';

    const n = safeText(name);
    if (!n) {
      submitStatus = 'error';
      submitMessage = 'Vyplň prosím název místa, spolku nebo akce.';
      return;
    }

    if (lat == null || lon == null) {
      submitStatus = 'error';
      submitMessage = 'Klikni na město nebo vyhledej polohu, ať víme, kam tip umístit na mapě.';
      return;
    }

    if (kind === 'event' && !safeText(eventUrl)) {
      submitStatus = 'error';
      submitMessage = 'U akce prosím přidej odkaz na detail nebo událost.';
      return;
    }

    isSubmitting = true;
    try {
      const payload = {
        hp,
        started_at: startedAt,
        kind,
        name: n,
        category: safeText(category) || null,
        website: safeText(website) || null,
        email: safeText(email) || null,
        phone: safeText(phone) || null,
        description: safeText(description) || null,
        address_label: addressLabel || null,
        city: null,
        postcode: null,
        lat,
        lon,
        event_url: kind === 'event' ? safeText(eventUrl) : null,
        event_start: kind === 'event' ? toIsoOrNull(eventStartLocal) : null,
        event_end: kind === 'event' ? toIsoOrNull(eventEndLocal) : null
      };

      const resp = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        submitStatus = 'error';
        submitMessage = data?.error || 'Něco se pokazilo. Zkus to prosím znovu.';
        return;
      }

      submittedMapUrl = `/near?lat=${lat}&lon=${lon}`;
      submitStatus = 'success';
      submitMessage = 'Díky! Tip jsme uložili a hned pomáhá dalším lidem v okolí.';
      trackEvent('aa_submission_sent', { kind });
      recordSmallWin({ id: `submit_${Date.now()}`, title: `Přidán sousedský tip: ${n}`, surface: 'submit' });
    } catch {
      submitStatus = 'error';
      submitMessage = 'Něco se pokazilo. Zkus to prosím znovu.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Přidat místo nebo akci na mapu — Akcelerátor altruismu</title>
</svelte:head>

<div class="page">
  <header class="subpage-hero header">
    <div class="hero-kicker">TIPY Z TVÉHO OKOLÍ • SPOLEČNÁ MAPA POMOCI</div>
    <h1 class="title">Přidej místo nebo akci, <span class="serif-accent">kde se dá pomoct</span></h1>
    <p class="subtitle">
      Víš o útulku, komunitním šatníku, knihobudce nebo sousedské brigádě? Stačí název a obec — tvůj tip pomůže dalším lidem v okolí.
    </p>
  </header>

  <div class="submit-layout">
    <!-- FORM COLUMN -->
    <div class="card">
      <div class="tabs">
        <button class="tab" class:active={kind === 'org'} type="button" on:click={() => (kind = 'org')}>
          📍 Místo / spolek / knihobudka
        </button>
        <button class="tab" class:active={kind === 'event'} type="button" on:click={() => (kind = 'event')}>
          📅 Sousedská akce / brigáda
        </button>
      </div>

      <form class="form" on:submit|preventDefault={submit}>
        <!-- Honeypot -->
        <div class="hp" aria-hidden="true">
          <label for="hp_company">Company</label>
          <input id="hp_company" type="text" bind:value={hp} tabindex="-1" autocomplete="off" />
        </div>

        <div class="field wide">
          <label for="name">Název místa nebo akce *</label>
          <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="Např. Knihobudka v parku / Útulek Tlapka / Komunitní swap oblečení"
            maxlength="120"
          />
        </div>

        <div class="field">
          <label for="desc">Jak se tam dá zapojit? (lidsky, 1–2 věty)</label>
          <textarea
            id="desc"
            bind:value={description}
            rows="3"
            maxlength="600"
            placeholder="Např. Každé úterý odpoledne berou čisté zimní bundy, nebo mají od 14:00 veřejné venčení psů bez registrace…"
          ></textarea>
        </div>

        <div class="field">
          <label for="loc">Kde to v ČR je? * (1 klikem město, nebo přesná ulice)</label>
          <div class="quick-pills">
            {#each CZECH_CITIES as city}
              <button
                type="button"
                class="q-pill"
                class:active={addressLabel === city.name}
                on:click={() => pickQuickCity(city)}
              >
                📍 {city.name}
              </button>
            {/each}
          </div>

          <div class="loc-search">
            <input
              id="loc"
              type="text"
              bind:value={locationQuery}
              placeholder="Nebo napiš menší obec či ulici (např. Litomyšl, Znojmo, Písek)…"
              on:input={() => {
                geoResults = [];
                geoMessage = '';
                geoStatus = 'idle';
              }}
              on:keydown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  searchLocation();
                }
              }}
              disabled={geoStatus === 'loading'}
            />
            <button class="btn secondary" type="button" on:click={searchLocation} disabled={geoStatus === 'loading' || locationQuery.trim().length < 2}>
              {geoStatus === 'loading' ? 'Hledám…' : 'Najít v ČR'}
            </button>
          </div>

          {#if geoMessage}
            <div class={'banner ' + geoStatus} aria-live="polite">{geoMessage}</div>
          {/if}

          {#if geoResults.length}
            <div class="geo-results">
              {#each geoResults as r}
                <button class="geo-item" type="button" on:click={() => pickLocation(r)}>
                  <span class="geo-title">{firstText(r.label)}</span>
                  <span class="geo-sub">{r.label}</span>
                </button>
              {/each}
            </div>
          {/if}

          {#if lat != null && lon != null && addressLabel}
            <div class="picked">✅ Poloha vybrána: <strong>{addressLabel}</strong></div>
          {/if}
        </div>

        {#if kind === 'event'}
          <div class="grid">
            <div class="field wide">
              <label for="event_url">Odkaz na událost / detail *</label>
              <input id="event_url" type="text" bind:value={eventUrl} placeholder="https://…" maxlength="220" />
            </div>
            <div class="field">
              <label for="event_start">Začátek (volitelné)</label>
              <input id="event_start" type="datetime-local" bind:value={eventStartLocal} />
            </div>
            <div class="field">
              <label for="event_end">Konec (volitelné)</label>
              <input id="event_end" type="datetime-local" bind:value={eventEndLocal} />
            </div>
          </div>
        {/if}

        <details class="calm-drawer optional-fields">
          <summary>Doplnit štítek, web nebo kontaktní e-mail (volitelné)</summary>
          <div class="grid opt-grid">
            <div class="field wide">
              <label for="category">O co jde? (volitelné)</label>
              <input id="category" type="text" bind:value={category} placeholder="Klikni na štítek níže nebo napiš vlastní…" maxlength="80" />
              <div class="quick-pills">
                {#each QUICK_CATEGORIES as qc}
                  <button
                    type="button"
                    class="q-pill"
                    class:active={category === qc}
                    on:click={() => (category = qc)}
                  >
                    {qc}
                  </button>
                {/each}
              </div>
            </div>

            <div class="field">
              <label for="website">Web / FB / Instagram (volitelné)</label>
              <input id="website" type="text" bind:value={website} placeholder="https://…" maxlength="220" />
            </div>

            <div class="field">
              <label for="email">Kontaktní e-mail (volitelné)</label>
              <input id="email" type="email" bind:value={email} placeholder="info@…" maxlength="120" />
            </div>
          </div>
        </details>

        <div class="actions">
          <button class="btn submit-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ukládám…' : '✦ Připnout sousedský tip na mapu'}
          </button>
        </div>

        {#if submitStatus}
          <div class={'banner ' + submitStatus} aria-live="polite">
            <div>{submitMessage}</div>
            {#if submitStatus === 'success'}
              <a href={submittedMapUrl} class="map-jump-link">🗺️ Ukázat místo na mapě →</a>
            {/if}
          </div>
        {/if}
      </form>
    </div>

    <!-- SIDEBAR: LIVE NEIGHBORHOOD INSPIRATION -->
    <aside class="side-board">
      <div class="board-box">
        <span class="board-kicker">🌿 ŽIVÉ PŘÍKLADY Z ČESKA</span>
        <h3>Co sem lidé nejčastěji přidávají?</h3>
        <ul class="idea-list">
          <li>🐾 <strong>Menší útulky a depozita</strong>, kde uvítají staré deky nebo vyvenčení psa.</li>
          <li>📚 <strong>Veřejné knihobudky a ReUse poličky</strong> na nádražích a v parcích.</li>
          <li>🧥 <strong>Komunitní šatníky a potravinové skříňky</strong> pro samoživitele.</li>
          <li>🌳 <strong>Sousedské úklidy potoka, výsadby stromů</strong> nebo studentské swapy.</li>
        </ul>
      </div>

      <div class="board-box light">
        <span class="board-kicker dark">📌 UŽ NA NÁSTĚNCE</span>
        <h3>Ověřené komunitní body</h3>
        <div class="seed-stack">
          {#each LOCAL_COMMUNITY_ITEMS.slice(0, 2) as item}
            <a href={`/near?lat=${item.lat}&lon=${item.lon}&r=8`} class="seed-card">
              <div class="seed-cat">{item.category}</div>
              <strong>{item.name}</strong>
              <span>📍 {item.address_label}</span>
            </a>
          {/each}
        </div>
      </div>
    </aside>
  </div>
</div>

<style>
  .page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0.75rem 1.25rem 3.5rem;
  }

  .header {
    text-align: center;
  }

  .opt-grid {
    margin-top: 0.85rem;
  }

  .hero-kicker {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #047857;
    margin-bottom: 0.35rem;
  }

  .title {
    font-family: var(--font-sans);
    font-weight: 800;
    color: #0e281c;
    font-size: clamp(1.95rem, 3.4vw, 2.75rem);
    margin: 0;
    letter-spacing: -0.03em;
  }

  .title .serif-accent {
    color: #059669;
    font-weight: 400;
  }

  .subtitle {
    color: #365244;
    margin: 0.55rem auto 0;
    max-width: 58ch;
    line-height: 1.55;
  }

  .submit-layout {
    display: grid;
    grid-template-columns: 1.35fr 0.65fr;
    gap: 1.15rem;
    align-items: start;
    margin-top: 1.15rem;
  }

  .card {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(22, 66, 48, 0.12);
    border-radius: 24px;
    box-shadow: var(--shadow-md);
    padding: 1.65rem;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1.1rem;
  }

  .tab {
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.14);
    background: #f5f3eb;
    padding: 0.58rem 1rem;
    cursor: pointer;
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: 0.88rem;
    color: var(--text-primary);
  }

  .tab.active {
    background: #0d2b1f;
    color: #fde68a;
    border-color: #0d2b1f;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 0.95rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .field.wide {
    grid-column: 1 / -1;
  }

  label {
    font-size: 0.88rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  input,
  textarea {
    padding: 0.65rem 0.8rem;
    border-radius: 12px;
    border: 1px solid rgba(22, 66, 48, 0.16);
    background: #ffffff;
    font-family: inherit;
    font-size: 0.92rem;
  }

  textarea {
    resize: vertical;
  }

  .quick-pills {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin-top: 0.2rem;
  }

  .q-pill {
    padding: 0.32rem 0.68rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.14);
    background: #f6f4ec;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
  }

  .q-pill:hover {
    background: #ecfdf5;
    border-color: #059669;
  }

  .q-pill.active {
    background: #0d2b1f;
    color: #fde68a;
    border-color: #0d2b1f;
  }

  .loc-search {
    display: flex;
    gap: 0.55rem;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 0.25rem;
  }

  .loc-search input {
    flex: 1;
    min-width: 220px;
  }

  .geo-results {
    margin-top: 0.5rem;
    display: grid;
    gap: 0.45rem;
  }

  .geo-item {
    text-align: left;
    padding: 0.6rem 0.75rem;
    border-radius: 12px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: #ffffff;
    cursor: pointer;
  }

  .geo-title {
    display: block;
    font-weight: 800;
    color: var(--text-primary);
  }

  .geo-sub {
    display: block;
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .picked {
    margin-top: 0.4rem;
    color: #065f46;
    font-size: 0.9rem;
  }

  .btn {
    border-radius: 14px;
    padding: 0.75rem 1.15rem;
    font-family: var(--font-sans);
    font-weight: 800;
    cursor: pointer;
    border: 1px solid rgba(22, 66, 48, 0.14);
  }

  .btn.secondary {
    background: #ffffff;
    color: var(--text-primary);
  }

  .submit-btn {
    background: linear-gradient(135deg, #123828 0%, #1c523a 100%);
    border: 1.5px solid rgba(251, 191, 36, 0.5);
    color: #fde68a;
    font-size: 0.95rem;
    box-shadow: 0 10px 24px -8px rgba(14, 40, 28, 0.28);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .banner {
    margin-top: 0.5rem;
    padding: 0.65rem 0.85rem;
    border-radius: 12px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: #f5f3eb;
    color: var(--text-secondary);
    font-size: 0.88rem;
  }

  .banner.error {
    background: #fef2f2;
    border-color: rgba(153, 27, 27, 0.2);
    color: #991b1b;
  }

  .banner.success,
  .banner.ok {
    background: #ecfdf5;
    border-color: rgba(6, 95, 70, 0.22);
    color: #065f46;
  }

  .map-jump-link {
    display: inline-block;
    margin-top: 0.4rem;
    font-weight: 800;
    color: #065f46;
  }

  .hp {
    display: none;
  }

  /* Sidebar */
  .side-board {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .board-box {
    padding: 1.35rem;
    border-radius: 22px;
    background: linear-gradient(155deg, #ebf6ef, #f6faf7);
    border: 1px solid rgba(22, 82, 56, 0.14);
    color: #0e281c;
    box-shadow: var(--shadow-sm);
  }

  .board-box.light {
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(22, 66, 48, 0.12);
    color: var(--text-primary);
  }

  .board-kicker {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #047857;
  }

  .board-kicker.dark {
    color: #059669;
  }

  .board-box h3 {
    margin: 0.3rem 0 0.75rem;
    font-size: 1.08rem;
    font-weight: 800;
  }

  .idea-list {
    margin: 0;
    padding-left: 1.15rem;
    font-size: 0.85rem;
    line-height: 1.55;
    color: #2f4b3d;
  }

  .idea-list li {
    margin-bottom: 0.45rem;
  }

  .seed-stack {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .seed-card {
    padding: 0.7rem 0.85rem;
    border-radius: 14px;
    background: #faf9f4;
    border: 1px solid rgba(22, 66, 48, 0.1);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    transition: border-color 0.15s ease;
  }

  .seed-card:hover {
    border-color: #10b981;
  }

  .seed-cat {
    font-size: 0.72rem;
    font-weight: 800;
    color: #059669;
  }

  .seed-card strong {
    font-size: 0.86rem;
    color: var(--text-primary);
  }

  .seed-card span {
    font-size: 0.76rem;
    color: var(--text-secondary);
  }

  @media (max-width: 920px) {
    .submit-layout {
      grid-template-columns: 1fr;
    }
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
