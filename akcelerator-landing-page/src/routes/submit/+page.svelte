<script>
  import { onMount } from 'svelte';
  import { CZECH_CITIES } from '../../lib/data/czech-actions.js';
  import { recordSmallWin } from '../../lib/progress.js';
  import { trackEvent } from '../../lib/analytics.js';
  import { safeText } from '../../lib/security.js';
  import { firstText, safeGetItem, safeSetItem, safeRemoveItem } from '../../lib/utils.js';

  const DRAFT_KEY = 'aa_submit_draft_v1';
  const MY_PENDING_KEY = 'aa_my_pending_submissions_v1';

  const QUICK_CATEGORIES = [
    '🐾 Zvířata a útulky',
    '🥫 Potraviny a šatníky',
    '📚 Knihobudka / druhá šance věcí',
    '🤝 Komunita a sousedé',
    '👴 Senioři',
    '🌱 Příroda a úklid'
  ];

  const TOP_CITIES = CZECH_CITIES.slice(0, 6);

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

  let locationQuery = '';
  let geoStatus = 'idle';
  let geoMessage = '';
  /** @type {Array<{label: string, lat: number, lon: number}>} */
  let geoResults = [];
  let lat = null;
  let lon = null;
  let addressLabel = '';

  // Spam protection (honeypot + monotonic elapsed time)
  let hp = '';
  const startedAt = Date.now();
  const mountPerfNow = typeof performance !== 'undefined' ? performance.now() : 0;
  let draftReady = false;

  let isSubmitting = false;
  let submitStatus = null; // null | success | error
  let submitMessage = '';
  let submittedMapUrl = '/near';

  onMount(() => {
    try {
      const rawDraft = safeGetItem(DRAFT_KEY, 'session');
      if (rawDraft) {
        const d = JSON.parse(rawDraft);
        if (d && typeof d === 'object') {
          if (d.kind === 'org' || d.kind === 'event') kind = d.kind;
          if (typeof d.name === 'string') name = d.name;
          if (typeof d.category === 'string') category = d.category;
          if (typeof d.website === 'string') website = d.website;
          if (typeof d.email === 'string') email = d.email;
          if (typeof d.description === 'string') description = d.description;
          if (typeof d.locationQuery === 'string') locationQuery = d.locationQuery;
          if (typeof d.lat === 'number') lat = d.lat;
          if (typeof d.lon === 'number') lon = d.lon;
          if (typeof d.addressLabel === 'string') addressLabel = d.addressLabel;
          if (typeof d.eventUrl === 'string') eventUrl = d.eventUrl;
        }
      }
    } catch {}
    draftReady = true;
  });

  $: if (draftReady && submitStatus !== 'success') {
    safeSetItem(
      DRAFT_KEY,
      JSON.stringify({
        kind,
        name,
        category,
        website,
        email,
        description,
        locationQuery,
        lat,
        lon,
        addressLabel,
        eventUrl
      }),
      'session'
    );
  }

  function pickQuickCity(city) {
    lat = city.lat;
    lon = city.lon;
    addressLabel = city.name;
    locationQuery = city.name;
    geoResults = [];
    geoStatus = 'ok';
    geoMessage = `Vybráno: ${city.name}`;
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
    geoMessage = 'Hledám v ČR…';
    geoResults = [];

    try {
      const resp = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=6`);
      const data = await resp.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      geoResults = results;
      if (!results.length) {
        geoStatus = 'error';
        geoMessage = 'Přesnou adresu jsem nenašel – klikni případně na nejbližší město.';
        return;
      }
      geoStatus = 'ok';
      geoMessage = 'Vyber přesné místo ze seznamu:';
    } catch {
      geoStatus = 'error';
      geoMessage = 'Vyhledávání je dočasně nedostupné – vyber prosím město níže.';
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
      const q = safeText(locationQuery);
      if (q.length >= 2) {
        const matchedCity = CZECH_CITIES.find(
          (c) => c.name.toLowerCase().startsWith(q.toLowerCase())
        );
        if (matchedCity) {
          pickQuickCity(matchedCity);
        } else {
          await searchLocation();
          if (geoResults.length > 0) {
            pickLocation(geoResults[0]);
          }
        }
      }
    }

    if (lat == null || lon == null) {
      submitStatus = 'error';
      submitMessage = 'Vyhledej obec nebo klikni na nejbližší město.';
      return;
    }

    if (kind === 'event' && !safeText(eventUrl)) {
      submitStatus = 'error';
      submitMessage = 'U akce prosím přidej odkaz na detail nebo událost.';
      return;
    }

    isSubmitting = true;
    try {
      const elapsedMs = Math.max(
        0,
        Math.round((typeof performance !== 'undefined' ? performance.now() : 0) - mountPerfNow)
      );
      const payload = {
        hp,
        started_at: startedAt,
        elapsed_ms: elapsedMs,
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

      if (data?.item) {
        try {
          const existingRaw = safeGetItem(MY_PENDING_KEY, 'local');
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          const list = Array.isArray(existing) ? existing : [];
          list.unshift({ ...data.item, pendingModeration: true });
          safeSetItem(MY_PENDING_KEY, JSON.stringify(list.slice(0, 20)), 'local');
        } catch {}
      }
      safeRemoveItem(DRAFT_KEY, 'session');

      submittedMapUrl = `/near?lat=${lat}&lon=${lon}`;
      submitStatus = 'success';
      submitMessage =
        data?.moderationNotice ||
        'Díky! Tip jsme přijali ke kontrole a u tebe na mapě už teď svítí se štítkem „Čeká na schválení“.';
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
    <div class="hero-kicker">SPOLEČNÁ MAPA POMOCI</div>
    <h1 class="title">Přidej místo nebo akci, <span class="serif-accent">kde se dá pomoct</span></h1>
    <p class="subtitle">
      Víš o útulku, komunitním šatníku, knihobudce nebo sousedské brigádě? Stačí název a obec.
    </p>
  </header>

  <div class="submit-layout">
    <!-- CLEAN FOCUSED FORM -->
    <div class="card">
      <div class="tabs">
        <button class="tab" class:active={kind === 'org'} type="button" on:click={() => (kind = 'org')}>
          📍 Místo / spolek
        </button>
        <button class="tab" class:active={kind === 'event'} type="button" on:click={() => (kind = 'event')}>
          📅 Sousedská akce
        </button>
      </div>

      <form class="form" on:submit|preventDefault={submit}>
        <div class="hp" aria-hidden="true">
          <label for="hp_company">Company</label>
          <input id="hp_company" name="hp_company" type="text" bind:value={hp} tabindex="-1" autocomplete="off" />
        </div>

        <div class="field wide">
          <label for="name">Název místa nebo akce *</label>
          <input
            id="name"
            name="place_name"
            autocomplete="off"
            data-molly-guide="true"
            type="text"
            bind:value={name}
            placeholder="Např. Knihobudka v parku"
            maxlength="120"
          />
        </div>

        <div class="field loc-field">
          <label for="loc">Kde to je? *</label>
          <div class="loc-search">
            <input
              id="loc"
              name="location_query"
              autocomplete="off"
              type="text"
              bind:value={locationQuery}
              placeholder="Město, obec nebo ulice"
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
              {geoStatus === 'loading' ? 'Hledám…' : 'Najít'}
            </button>
          </div>

          <div class="quick-pills">
            {#each TOP_CITIES as city}
              <button
                type="button"
                class="q-pill"
                class:active={addressLabel === city.name}
                on:click={() => pickQuickCity(city)}
              >
                {city.name}
              </button>
            {/each}
          </div>

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
            <div class="picked">✓ Poloha vybrána: <strong>{addressLabel}</strong></div>
          {:else if geoMessage}
            <div class="geo-hint">{geoMessage}</div>
          {/if}
        </div>

        <div class="field">
          <label for="desc">Jak se tam dá zapojit? (1–2 věty)</label>
          <textarea
            id="desc"
            name="description"
            autocomplete="off"
            bind:value={description}
            rows="3"
            maxlength="600"
            placeholder="Např. Berou čisté zimní oblečení, nebo mají od 14:00 veřejné venčení psů…"
          ></textarea>
        </div>

        {#if kind === 'event'}
          <div class="grid">
            <div class="field wide">
              <label for="event_url">Odkaz na událost / detail *</label>
              <input id="event_url" name="event_url" autocomplete="url" type="text" bind:value={eventUrl} placeholder="https://…" maxlength="220" />
            </div>
            <div class="field">
              <label for="event_start">Začátek (volitelné)</label>
              <input id="event_start" name="event_start" autocomplete="off" type="datetime-local" bind:value={eventStartLocal} />
            </div>
            <div class="field">
              <label for="event_end">Konec (volitelné)</label>
              <input id="event_end" name="event_end" autocomplete="off" type="datetime-local" bind:value={eventEndLocal} />
            </div>
          </div>
        {/if}

        <details class="calm-drawer optional-fields">
          <summary>Doplnit štítek, web nebo kontakt (volitelné)</summary>
          <div class="grid opt-grid">
            <div class="field wide">
              <span class="label" id="category-label">Oblast pomoci</span>
              <div class="quick-pills" role="group" aria-labelledby="category-label">
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
              <label for="website">Web nebo sociální síť</label>
              <input id="website" name="website" autocomplete="url" type="text" bind:value={website} placeholder="https://…" maxlength="220" />
            </div>

            <div class="field">
              <label for="email">Kontaktní e-mail</label>
              <input id="email" name="email" autocomplete="email" type="email" bind:value={email} placeholder="info@…" maxlength="120" />
            </div>
          </div>
        </details>

        <div class="actions">
          <button class="btn submit-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ukládám…' : '✦ Připnout tip na mapu'}
          </button>
        </div>

        {#if submitStatus}
          <div class={'banner ' + submitStatus} aria-live="polite">
            <div>{submitMessage}</div>
            {#if submitStatus === 'success'}
              <a href={submittedMapUrl} class="map-jump-link">Ukázat místo na mapě →</a>
            {/if}
          </div>
        {/if}
      </form>
    </div>

    <!-- SINGLE CALM SIDEBAR CARD -->
    <aside class="side-note">
      <span class="board-kicker">🌿 INSPIRACE Z OKOLÍ</span>
      <h3>Co sem lidé nejčastěji přidávají?</h3>
      <ul class="idea-list">
        <li><strong>Menší útulky a depozita</strong>, kde uvítají deky nebo vyvenčení psa.</li>
        <li><strong>Veřejné knihobudky a poličky pro druhou šanci věcí</strong> na nádražích a v parcích.</li>
        <li><strong>Komunitní šatníky a potravinové skříňky</strong> pro rodiny v nouzi.</li>
        <li><strong>Sousedské úklidy, výsadby stromů</strong> nebo sousedské výměny oblečení a věcí.</li>
      </ul>
    </aside>
  </div>
</div>

<style>
  .page {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0.75rem 1.25rem 3.5rem;
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
    font-size: clamp(1.95rem, 3.4vw, 2.7rem);
    margin: 0;
    letter-spacing: -0.03em;
  }

  .title .serif-accent {
    color: #fde68a;
    font-weight: 400;
  }

  .subtitle {
    color: rgba(236, 248, 241, 0.9);
    margin: 0.55rem auto 0;
    max-width: 52ch;
    line-height: 1.58;
  }

  .submit-layout {
    display: grid;
    grid-template-columns: 1.38fr 0.62fr;
    gap: 1.35rem;
    align-items: start;
  }

  .card {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(22, 66, 48, 0.1);
    border-radius: 26px;
    box-shadow: var(--shadow-sm);
    padding: 1.85rem;
  }

  .tabs {
    display: inline-flex;
    gap: 0.3rem;
    padding: 0.26rem;
    border-radius: 999px;
    background: #eef3ef;
    margin-bottom: 1.35rem;
  }

  .tab {
    border-radius: 999px;
    border: none;
    background: transparent;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--text-secondary);
    transition: all 0.16s ease;
  }

  .tab.active {
    background: #0d2b1f;
    color: #ffffff;
    box-shadow: 0 4px 10px rgba(9, 29, 20, 0.16);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.05rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
  }

  .opt-grid {
    margin-top: 0.85rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.38rem;
  }

  .field.wide {
    grid-column: 1 / -1;
  }

  label,
  .label {
    font-size: 0.86rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  input,
  textarea {
    padding: 0.68rem 0.88rem;
    border-radius: 12px;
    border: 1px solid rgba(22, 66, 48, 0.15);
    background: #ffffff;
    font-family: inherit;
    font-size: 0.92rem;
  }

  textarea {
    resize: vertical;
  }

  .loc-search {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .loc-search input {
    flex: 1;
    min-width: 220px;
  }

  .quick-pills {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin-top: 0.15rem;
  }

  .q-pill {
    padding: 0.3rem 0.68rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.11);
    background: #f5f9f6;
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .q-pill:hover {
    background: #ffffff;
    border-color: rgba(16, 185, 129, 0.4);
    color: var(--text-primary);
  }

  .q-pill.active {
    background: #0d2b1f;
    color: #fde68a;
    border-color: #0d2b1f;
  }

  .geo-results {
    margin-top: 0.4rem;
    display: grid;
    gap: 0.35rem;
  }

  .geo-item {
    text-align: left;
    padding: 0.55rem 0.75rem;
    border-radius: 12px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: #ffffff;
    cursor: pointer;
  }

  .geo-title {
    display: block;
    font-weight: 800;
    color: var(--text-primary);
    font-size: 0.88rem;
  }

  .geo-sub {
    display: block;
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .picked {
    margin-top: 0.25rem;
    color: #065f46;
    font-size: 0.86rem;
    font-weight: 600;
  }

  .geo-hint {
    margin-top: 0.25rem;
    color: var(--text-muted);
    font-size: 0.82rem;
  }

  .btn {
    border-radius: 14px;
    padding: 0.72rem 1.15rem;
    font-family: var(--font-sans);
    font-weight: 700;
    cursor: pointer;
    border: 1px solid rgba(22, 66, 48, 0.14);
  }

  .btn.secondary {
    background: #f5f9f6;
    color: var(--text-primary);
    padding: 0.68rem 1rem;
    border-radius: 12px;
  }

  .submit-btn {
    background: linear-gradient(135deg, #0f3626 0%, #1b573e 100%);
    border: none;
    color: #ffffff;
    font-size: 0.94rem;
    padding: 0.88rem 1.4rem;
    box-shadow: 0 10px 22px -6px rgba(14, 40, 28, 0.32);
    transition: transform 0.18s ease;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .banner {
    margin-top: 0.4rem;
    padding: 0.7rem 0.9rem;
    border-radius: 12px;
    font-size: 0.88rem;
  }

  .banner.error {
    background: #fef2f2;
    color: #991b1b;
  }

  .banner.success {
    background: #ecfdf5;
    color: #065f46;
  }

  .map-jump-link {
    display: inline-block;
    margin-top: 0.35rem;
    font-weight: 800;
    color: #065f46;
  }

  .hp {
    display: none;
  }

  /* Single Calm Sidebar Note */
  .side-note {
    padding: 1.55rem;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(22, 66, 48, 0.09);
  }

  .board-kicker {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: var(--emerald-600);
  }

  .side-note h3 {
    margin: 0.35rem 0 0.8rem;
    font-size: 1.08rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .idea-list {
    margin: 0;
    padding-left: 1.15rem;
    font-size: 0.86rem;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  .idea-list li {
    margin-bottom: 0.5rem;
  }

  .idea-list strong {
    color: var(--text-primary);
  }

  @media (min-width: 681px) {
    .page {
      padding: 0.45rem 1.25rem 5rem;
    }

    .subpage-hero.header {
      padding: 1rem 1.4rem !important;
      margin-bottom: 0.6rem !important;
    }

    .title {
      font-size: clamp(1.75rem, 3vw, 2.3rem);
    }

    .subtitle {
      margin-top: 0.35rem;
      font-size: 0.9rem;
    }

    .card {
      padding: 1.2rem 1.45rem;
    }

    .tabs {
      margin-bottom: 0.8rem;
    }

    .form {
      gap: 0.72rem;
    }

    input,
    textarea {
      padding: 0.52rem 0.78rem;
    }
  }

  @media (max-width: 920px) {
    .submit-layout {
      grid-template-columns: 1fr;
    }
    .grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .page {
      padding: 0.3rem 0.65rem 5rem;
    }

    .subpage-hero.header {
      padding: 0.55rem 0.75rem !important;
      margin-bottom: 0.45rem !important;
      border-radius: 16px;
    }

    .hero-kicker,
    .subtitle {
      display: none !important;
    }

    .title {
      font-size: 1.15rem;
      line-height: 1.18;
    }

    .submit-layout {
      gap: 1.15rem;
    }

    .card {
      padding: 0.9rem 0.95rem;
      border-radius: 18px;
    }

    .tabs {
      margin-bottom: 0.65rem;
    }

    .form {
      gap: 0.68rem;
    }
  }
</style>
