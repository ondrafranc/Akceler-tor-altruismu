<script>
  import { currentLanguage } from '../../lib/stores.js';
  import { trackEvent } from '../../lib/analytics.js';

  let language = 'czech';
  currentLanguage.subscribe((v) => (language = v));

  const UI = {
    czech: {
      back: '← Zpět na mapu',
      title: '➕ Přidat organizaci / akci',
      subtitle: 'Pošlete nám tip. My ověříme a pak se to může objevit na webu.',
      orgTab: '🏛️ Organizace / místo',
      eventTab: '📅 Akce / příležitost',
      name: 'Název',
      category: 'Kategorie (volitelné)',
      website: 'Web (volitelné)',
      email: 'Email (volitelné)',
      phone: 'Telefon (volitelné)',
      desc: 'Krátký popis (volitelné)',
      location: 'Město / PSČ (vyhledat polohu)',
      locationHint: 'Vyberte výsledek – uloží se souřadnice pro mapu.',
      eventUrl: 'Odkaz na přihlášení / detail akce',
      eventStart: 'Začátek (volitelné)',
      eventEnd: 'Konec (volitelné)',
      submit: 'Odeslat ke schválení',
      sending: 'Odesílám…',
      success: 'Díky! Tip jsme přijali. Ověříme a případně přidáme.',
      error: 'Něco se pokazilo. Zkuste to prosím znovu.'
    },
    english: {
      back: '← Back to map',
      title: '➕ Submit an organization / event',
      subtitle: 'Send us a tip. We’ll verify it and then it may appear on the site.',
      orgTab: '🏛️ Organization / place',
      eventTab: '📅 Event / opportunity',
      name: 'Name',
      category: 'Category (optional)',
      website: 'Website (optional)',
      email: 'Email (optional)',
      phone: 'Phone (optional)',
      desc: 'Short description (optional)',
      location: 'Town / ZIP (find location)',
      locationHint: 'Pick a result — we’ll store coordinates for the map.',
      eventUrl: 'Signup / event detail link',
      eventStart: 'Start (optional)',
      eventEnd: 'End (optional)',
      submit: 'Submit for review',
      sending: 'Submitting…',
      success: 'Thanks! We received it. We’ll verify and add if helpful.',
      error: 'Something went wrong. Please try again.'
    }
  };

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

  // Location picker (via /api/geocode)
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

  function safeText(v) {
    return typeof v === 'string' ? v.trim() : '';
  }

  function firstText(v) {
    const s = safeText(v);
    if (!s) return '';
    return s.split(',')[0] || s;
  }

  async function searchLocation() {
    const q = safeText(locationQuery);
    if (!q || q.length < 2) {
      geoStatus = 'error';
      geoMessage = language === 'czech' ? 'Zadejte aspoň 2 znaky.' : 'Enter at least 2 characters.';
      geoResults = [];
      return;
    }

    geoStatus = 'loading';
    geoMessage = language === 'czech' ? 'Hledám…' : 'Searching…';
    geoResults = [];

    try {
      const resp = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=6`);
      const data = await resp.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      geoResults = results;
      if (!results.length) {
        geoStatus = 'error';
        geoMessage = language === 'czech' ? 'Nic jsem nenašel.' : 'No results.';
        return;
      }
      geoStatus = 'ok';
      geoMessage = language === 'czech' ? 'Vyberte výsledek:' : 'Pick a result:';
    } catch {
      geoStatus = 'error';
      geoMessage = UI[language].error;
    }
  }

  function pickLocation(r) {
    lat = typeof r?.lat === 'number' ? r.lat : null;
    lon = typeof r?.lon === 'number' ? r.lon : null;
    addressLabel = safeText(r?.label);
    locationQuery = firstText(addressLabel);
    geoResults = [];
    geoMessage = language === 'czech' ? 'Poloha vybrána.' : 'Location selected.';
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
      submitMessage = language === 'czech' ? 'Vyplňte název.' : 'Please enter a name.';
      return;
    }

    if (lat == null || lon == null) {
      submitStatus = 'error';
      submitMessage = language === 'czech' ? 'Vyberte polohu (město/PSČ) a klikněte na výsledek.' : 'Please select a location.';
      return;
    }

    if (kind === 'event' && !safeText(eventUrl)) {
      submitStatus = 'error';
      submitMessage = language === 'czech' ? 'U akce prosím přidejte odkaz.' : 'Please add an event link.';
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
        submitMessage = data?.error || UI[language].error;
        return;
      }

      submitStatus = 'success';
      submitMessage = UI[language].success;
      trackEvent('aa_submission_sent', { kind });
    } catch {
      submitStatus = 'error';
      submitMessage = UI[language].error;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="page">
  <div class="header">
    <a class="back" href="/near">{UI[language].back}</a>
    <div class="title">{UI[language].title}</div>
    <div class="subtitle">{UI[language].subtitle}</div>
  </div>

  <div class="card">
    <div class="tabs">
      <button class="tab" class:active={kind === 'org'} type="button" on:click={() => (kind = 'org')}>{UI[language].orgTab}</button>
      <button class="tab" class:active={kind === 'event'} type="button" on:click={() => (kind = 'event')}>{UI[language].eventTab}</button>
    </div>

    <form class="form" on:submit|preventDefault={submit}>
      <!-- Honeypot (hidden) -->
      <div class="hp" aria-hidden="true">
        <label for="hp_company">Company</label>
        <input id="hp_company" type="text" bind:value={hp} tabindex="-1" autocomplete="off" />
      </div>

      <div class="grid">
        <div class="field">
          <label for="name">{UI[language].name}</label>
          <input id="name" type="text" bind:value={name} placeholder="Např. Charita Zlín" maxlength="120" />
        </div>

        <div class="field">
          <label for="category">{UI[language].category}</label>
          <input id="category" type="text" bind:value={category} placeholder="např. potraviny, senioři, děti…" maxlength="80" />
        </div>

        <div class="field">
          <label for="website">{UI[language].website}</label>
          <input id="website" type="text" bind:value={website} placeholder="https://…" maxlength="220" />
        </div>

        <div class="field">
          <label for="email">{UI[language].email}</label>
          <input id="email" type="email" bind:value={email} placeholder="info@…" maxlength="120" />
        </div>

        <div class="field">
          <label for="phone">{UI[language].phone}</label>
          <input id="phone" type="tel" bind:value={phone} placeholder="+420 …" maxlength="60" />
        </div>
      </div>

      <div class="field">
        <label for="desc">{UI[language].desc}</label>
        <textarea id="desc" bind:value={description} rows="4" maxlength="600" placeholder="Co dělají? Pro koho? Jak se zapojit?"></textarea>
      </div>

      <div class="field">
        <label for="loc">{UI[language].location}</label>
        <div class="loc-search">
          <input
            id="loc"
            type="text"
            bind:value={locationQuery}
            placeholder="Např. 602 00, Brno, Pardubice…"
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
        <div class="hint">{UI[language].locationHint}</div>

        {#if geoMessage}
          <div class={"banner " + geoStatus} aria-live="polite">{geoMessage}</div>
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
          <div class="picked">✅ Vybráno: <strong>{addressLabel}</strong></div>
        {/if}
      </div>

      {#if kind === 'event'}
        <div class="grid">
          <div class="field wide">
            <label for="event_url">{UI[language].eventUrl}</label>
            <input id="event_url" type="text" bind:value={eventUrl} placeholder="https://…" maxlength="220" />
          </div>
        </div>
        <div class="grid">
          <div class="field">
            <label for="event_start">{UI[language].eventStart}</label>
            <input id="event_start" type="datetime-local" bind:value={eventStartLocal} />
          </div>
          <div class="field">
            <label for="event_end">{UI[language].eventEnd}</label>
            <input id="event_end" type="datetime-local" bind:value={eventEndLocal} />
          </div>
        </div>
      {/if}

      <div class="actions">
        <button class="btn primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? UI[language].sending : UI[language].submit}
        </button>
      </div>

      {#if submitStatus}
        <div class={"banner " + submitStatus} aria-live="polite">{submitMessage}</div>
      {/if}
    </form>
  </div>
</div>

<style>
  .page { max-width: 880px; margin: 0 auto; padding: 1rem 1rem 2rem 1rem; }
  .header { text-align: center; margin-bottom: 1rem; }
  .back { display:inline-block; margin-bottom:0.5rem; color: var(--text-secondary); text-decoration:none; }
  .back:hover { text-decoration: underline; }
  .title { font-family:'Inter',sans-serif; font-weight:900; color: var(--czech-forest); font-size: clamp(1.7rem, 3vw, 2.3rem); }
  .subtitle { color: var(--text-secondary); margin-top:0.35rem; }

  .card {
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(44, 62, 45, 0.12);
    border-radius: 18px;
    box-shadow: 0 10px 28px rgba(0,0,0,0.08);
    padding: 1.05rem;
  }

  .tabs { display:flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.9rem; }
  .tab {
    border-radius: 999px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: rgba(242, 247, 242, 0.8);
    padding: 0.55rem 0.75rem;
    cursor: pointer;
    font-weight: 900;
    color: var(--czech-forest);
  }
  .tab.active { background: var(--czech-forest); color: white; }

  .form { display:flex; flex-direction: column; gap: 0.9rem; }
  .grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; }
  .field { display:flex; flex-direction: column; gap: 0.35rem; }
  .field.wide { grid-column: 1 / -1; }
  label { font-size: 0.9rem; color: var(--text-secondary); }
  input, textarea {
    padding: 0.55rem 0.65rem;
    border-radius: 12px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: white;
    font-family: inherit;
  }
  textarea { resize: vertical; }
  .hint { color: var(--text-secondary); font-size: 0.88rem; margin-top: 0.2rem; }

  .loc-search { display:flex; gap: 0.6rem; align-items:center; flex-wrap: wrap; }
  .loc-search input { flex: 1; min-width: 240px; }

  .geo-results { margin-top: 0.6rem; display:grid; grid-template-columns: 1fr; gap: 0.5rem; }
  .geo-item {
    text-align: left;
    padding: 0.65rem 0.75rem;
    border-radius: 14px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: rgba(255,255,255,0.92);
    cursor: pointer;
  }
  .geo-item:hover { filter: brightness(0.985); }
  .geo-title { display:block; font-weight: 900; color: var(--czech-forest); }
  .geo-sub { display:block; margin-top: 0.15rem; color: var(--text-secondary); font-size: 0.9rem; }
  .picked { margin-top: 0.65rem; color: var(--text-secondary); }

  .actions { display:flex; justify-content: flex-start; margin-top: 0.2rem; }
  .btn {
    border-radius: 12px;
    padding: 0.7rem 0.9rem;
    font-weight: 900;
    cursor: pointer;
    border: 1px solid rgba(44, 62, 45, 0.12);
  }
  .btn.primary { background: var(--czech-forest); color: white; }
  .btn.secondary { background: white; color: var(--czech-forest); }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .banner {
    margin-top: 0.6rem;
    padding: 0.55rem 0.75rem;
    border-radius: 12px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: rgba(242, 247, 242, 0.7);
    color: var(--text-secondary);
    font-size: 0.92rem;
  }
  .banner.error { background: rgba(254, 242, 242, 0.75); border-color: rgba(127, 29, 29, 0.15); }
  .banner.success { background: rgba(236, 253, 245, 0.75); border-color: rgba(6, 95, 70, 0.15); }
  .banner.ok { background: rgba(236, 253, 245, 0.75); border-color: rgba(6, 95, 70, 0.15); }
  .banner.loading { background: rgba(255, 251, 235, 0.8); border-color: rgba(180, 83, 9, 0.14); }

  .hp { display:none; }

  @media (max-width: 820px) {
    .grid { grid-template-columns: 1fr; }
  }
</style>


