<script>
  import { onMount } from "svelte";
  import { CZECH_CITIES } from "../../lib/data/czech-actions.js";
  import { recordSmallWin } from "../../lib/progress.js";
  import { trackEvent } from "../../lib/analytics.js";
  import { safeText } from "../../lib/validation.js";
  import { firstText } from "../../lib/utils.js";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import { resolveIconKey } from "$lib/icons/iconRegistry.js";
  import {
    safeGetItem,
    safeSetItem,
    safeRemoveItem,
    AA_SUBMIT_DRAFT_KEY,
    AA_MY_PENDING_SUBMISSIONS_KEY,
  } from "../../lib/storage/index.js";

  const DRAFT_KEY = AA_SUBMIT_DRAFT_KEY;
  const MY_PENDING_KEY = AA_MY_PENDING_SUBMISSIONS_KEY;

  const QUICK_CATEGORIES = [
    { icon: "paw", label: "Zvířata a útulky" },
    { icon: "utensils", label: "Potraviny a šatníky" },
    { icon: "book-open", label: "Knihobudka / druhá šance věcí" },
    { icon: "handshake", label: "Komunita a sousedé" },
    { icon: "users", label: "Senioři" },
    { icon: "sprout", label: "Příroda a úklid" },
  ];

  const TOP_CITIES = CZECH_CITIES.slice(0, 6);

  let kind = "org"; // org | event

  let name = "";
  let category = "";
  let website = "";
  let email = "";
  let phone = "";
  let description = "";

  let eventUrl = "";
  let eventStartLocal = "";
  let eventEndLocal = "";

  let locationQuery = "";
  let geoStatus = "idle";
  let geoMessage = "";
  /** @type {Array<{label: string, lat: number, lon: number}>} */
  let geoResults = [];
  let lat = null;
  let lon = null;
  let addressLabel = "";

  // Spam protection (honeypot + monotonic elapsed time)
  let hp = "";
  const startedAt = Date.now();
  const mountPerfNow =
    typeof performance !== "undefined" ? performance.now() : 0;
  let draftReady = false;

  let isSubmitting = false;
  let submitStatus = null; // null | success | error
  let submitMessage = "";
  let submittedMapUrl = "/near";

  onMount(() => {
    try {
      const rawDraft = safeGetItem(DRAFT_KEY, "session");
      if (rawDraft) {
        const d = JSON.parse(rawDraft);
        if (d && typeof d === "object") {
          if (d.kind === "org" || d.kind === "event") kind = d.kind;
          if (typeof d.name === "string") name = d.name;
          if (typeof d.category === "string") category = d.category;
          if (typeof d.website === "string") website = d.website;
          if (typeof d.email === "string") email = d.email;
          if (typeof d.description === "string") description = d.description;
          if (typeof d.locationQuery === "string")
            locationQuery = d.locationQuery;
          if (typeof d.lat === "number") lat = d.lat;
          if (typeof d.lon === "number") lon = d.lon;
          if (typeof d.addressLabel === "string") addressLabel = d.addressLabel;
          if (typeof d.eventUrl === "string") eventUrl = d.eventUrl;
        }
      }
    } catch {}
    draftReady = true;
  });

  $: if (draftReady && submitStatus !== "success") {
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
        eventUrl,
      }),
      "session",
    );
  }

  function pickQuickCity(city) {
    lat = city.lat;
    lon = city.lon;
    addressLabel = city.name;
    locationQuery = city.name;
    geoResults = [];
    geoStatus = "ok";
    geoMessage = `Vybráno: ${city.name}`;
  }

  async function searchLocation() {
    const q = safeText(locationQuery);
    if (!q || q.length < 2) {
      geoStatus = "error";
      geoMessage = "Zadej aspoň 2 znaky.";
      geoResults = [];
      return;
    }

    geoStatus = "loading";
    geoMessage = "Hledám v ČR…";
    geoResults = [];

    try {
      const resp = await fetch(
        `/api/geocode?q=${encodeURIComponent(q)}&limit=6`,
      );
      const data = await resp.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      geoResults = results;
      if (!results.length) {
        geoStatus = "error";
        geoMessage =
          "Přesnou adresu jsem nenašel – klikni případně na nejbližší město.";
        return;
      }
      geoStatus = "ok";
      geoMessage = "Vyber přesné místo ze seznamu:";
    } catch {
      geoStatus = "error";
      geoMessage =
        "Vyhledávání je dočasně nedostupné – vyber prosím město níže.";
    }
  }

  function pickLocation(r) {
    lat = typeof r?.lat === "number" ? r.lat : null;
    lon = typeof r?.lon === "number" ? r.lon : null;
    addressLabel = safeText(r?.label);
    locationQuery = firstText(addressLabel);
    geoResults = [];
    geoMessage = "Poloha vybrána.";
    geoStatus = "ok";
  }

  function toIsoOrNull(dtLocal) {
    const s = safeText(dtLocal);
    if (!s) return null;
    const d = new Date(s);
    return Number.isFinite(d.getTime()) ? d.toISOString() : null;
  }

  async function submit() {
    submitStatus = null;
    submitMessage = "";

    const n = safeText(name);
    if (!n) {
      submitStatus = "error";
      submitMessage = "Vyplň prosím název místa, spolku nebo akce.";
      return;
    }

    if (lat == null || lon == null) {
      const q = safeText(locationQuery);
      if (q.length >= 2) {
        const matchedCity = CZECH_CITIES.find((c) =>
          c.name.toLowerCase().startsWith(q.toLowerCase()),
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
      submitStatus = "error";
      submitMessage = "Vyhledej obec nebo klikni na nejbližší město.";
      return;
    }

    if (kind === "event" && !safeText(eventUrl)) {
      submitStatus = "error";
      submitMessage = "U akce prosím přidej odkaz na detail nebo událost.";
      return;
    }

    isSubmitting = true;
    try {
      const elapsedMs = Math.max(
        0,
        Math.round(
          (typeof performance !== "undefined" ? performance.now() : 0) -
            mountPerfNow,
        ),
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
        event_url: kind === "event" ? safeText(eventUrl) : null,
        event_start: kind === "event" ? toIsoOrNull(eventStartLocal) : null,
        event_end: kind === "event" ? toIsoOrNull(eventEndLocal) : null,
      };

      const resp = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        submitStatus = "error";
        submitMessage =
          data?.error || "Něco se pokazilo. Zkus to prosím znovu.";
        return;
      }

      if (data?.item) {
        try {
          const existingRaw = safeGetItem(MY_PENDING_KEY, "local");
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          const list = Array.isArray(existing) ? existing : [];
          list.unshift({ ...data.item, pendingModeration: true });
          safeSetItem(
            MY_PENDING_KEY,
            JSON.stringify(list.slice(0, 20)),
            "local",
          );
        } catch {}
      }
      safeRemoveItem(DRAFT_KEY, "session");

      submittedMapUrl = `/near?lat=${lat}&lon=${lon}`;
      submitStatus = "success";
      submitMessage =
        data?.moderationNotice ||
        "Díky! Tip jsme přijali ke kontrole a u tebe na mapě už teď svítí se štítkem „Čeká na schválení“.";
      trackEvent("aa_submission_sent", { kind });
      recordSmallWin({
        id: `submit_${Date.now()}`,
        title: `Přidán sousedský tip: ${n}`,
        surface: "submit",
      });
    } catch {
      submitStatus = "error";
      submitMessage = "Něco se pokazilo. Zkus to prosím znovu.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Přidat místo nebo akci na mapu — Akcelerátor altruismu</title>
</svelte:head>

<div class="page">
  <PageHeader
    class="submit-page-header"
    kicker="SPOLEČNÁ MAPA POMOCI"
    title="Přidej místo nebo akci, "
    titleAccent="kde se dá pomoct"
    subtitle="Víš o útulku, komunitním šatníku, knihobudce nebo sousedské brigádě? Stačí název a obec."
  />

  <div class="submit-layout">
    <!-- CLEAN FOCUSED FORM -->
    <div class="card">
      <div class="tabs">
        <button
          class="tab"
          class:active={kind === "org"}
          type="button"
          on:click={() => (kind = "org")}
        >
          <AppIcon name="map-pin" size={15} strokeWidth={2} />
          <span>Místo / spolek</span>
        </button>
        <button
          class="tab"
          class:active={kind === "event"}
          type="button"
          on:click={() => (kind = "event")}
        >
          <AppIcon name="calendar" size={15} strokeWidth={2} />
          <span>Sousedská akce</span>
        </button>
      </div>

      <form class="form" on:submit|preventDefault={submit}>
        <div class="hp" aria-hidden="true">
          <label for="hp_company">Company</label>
          <input
            id="hp_company"
            name="hp_company"
            type="text"
            bind:value={hp}
            tabindex="-1"
            autocomplete="off"
          />
        </div>

        <div class="name-loc-grid">
          <div class="field">
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
                  geoMessage = "";
                  geoStatus = "idle";
                }}
                on:keydown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchLocation();
                  }
                }}
                disabled={geoStatus === "loading"}
              />
              <button
                class="btn secondary"
                type="button"
                on:click={searchLocation}
                disabled={geoStatus === "loading" ||
                  locationQuery.trim().length < 2}
              >
                {geoStatus === "loading" ? "Hledám…" : "Najít"}
              </button>
            </div>
          </div>

          <div class="loc-extras">
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
                  <button
                    class="geo-item"
                    type="button"
                    on:click={() => pickLocation(r)}
                  >
                    <span class="geo-title">{firstText(r.label)}</span>
                    <span class="geo-sub">{r.label}</span>
                  </button>
                {/each}
              </div>
            {/if}

            {#if lat != null && lon != null && addressLabel}
              <div class="picked">
                <AppIcon name="check" size={15} strokeWidth={2.2} />
                <span>Poloha vybrána: <strong>{addressLabel}</strong></span>
              </div>
            {:else if geoMessage}
              <div class="geo-hint">{geoMessage}</div>
            {/if}
          </div>
        </div>

        <div class="field">
          <label for="desc">Jak se tam dá zapojit? (1–2 věty)</label>
          <textarea
            id="desc"
            name="description"
            autocomplete="off"
            bind:value={description}
            rows="2"
            maxlength="600"
            placeholder="Např. Berou čisté zimní oblečení, nebo mají od 14:00 veřejné venčení psů…"
          ></textarea>
        </div>

        {#if kind === "event"}
          <div class="grid event-fields-box">
            <div class="field wide event-url-field">
              <label for="event_url">Odkaz na událost / detail *</label>
              <input
                id="event_url"
                name="event_url"
                autocomplete="url"
                type="text"
                bind:value={eventUrl}
                placeholder="https://…"
                maxlength="220"
              />
            </div>
            <div class="field">
              <label for="event_start">Začátek (volitelné)</label>
              <input
                id="event_start"
                name="event_start"
                autocomplete="off"
                type="datetime-local"
                bind:value={eventStartLocal}
              />
            </div>
            <div class="field">
              <label for="event_end">Konec (volitelné)</label>
              <input
                id="event_end"
                name="event_end"
                autocomplete="off"
                type="datetime-local"
                bind:value={eventEndLocal}
              />
            </div>
          </div>
        {/if}

        <details class="calm-drawer optional-fields">
          <summary>Doplnit štítek, web nebo kontakt (volitelné)</summary>
          <div class="grid opt-grid">
            <div class="field wide">
              <span class="label" id="category-label">Oblast pomoci</span>
              <div
                class="quick-pills"
                role="group"
                aria-labelledby="category-label"
              >
                {#each QUICK_CATEGORIES as qc}
                  <button
                    type="button"
                    class="q-pill"
                    class:active={category === qc.label}
                    on:click={() => (category = qc.label)}
                  >
                    <AppIcon name={resolveIconKey(qc.icon)} size={14} strokeWidth={2} />
                    <span>{qc.label}</span>
                  </button>
                {/each}
              </div>
            </div>

            <div class="field">
              <label for="website">Web nebo sociální síť</label>
              <input
                id="website"
                name="website"
                autocomplete="url"
                type="text"
                bind:value={website}
                placeholder="https://…"
                maxlength="220"
              />
            </div>

            <div class="field">
              <label for="email">Kontaktní e-mail</label>
              <input
                id="email"
                name="email"
                autocomplete="email"
                type="email"
                bind:value={email}
                placeholder="info@…"
                maxlength="120"
              />
            </div>
          </div>
        </details>

        <div class="actions">
          <button class="btn submit-btn" type="submit" disabled={isSubmitting}>
            <AppIcon name="plus" size={16} strokeWidth={2.2} />
            <span>{isSubmitting ? "Ukládám…" : "Připnout tip na mapu"}</span>
          </button>
        </div>

        {#if submitStatus}
          <div class={"banner " + submitStatus} aria-live="polite">
            <div>{submitMessage}</div>
            {#if submitStatus === "success"}
              <a href={submittedMapUrl} class="map-jump-link">
                <span>Ukázat místo na mapě</span>
                <AppIcon name="arrow-right" size={15} strokeWidth={2} />
              </a>
            {/if}
          </div>
        {/if}
      </form>
    </div>

    <!-- SINGLE CALM SIDEBAR CARD -->
    <aside class="side-note">
      <span class="board-kicker">
        <AppIcon name="leaf" size={14} strokeWidth={2} />
        <span>INSPIRACE Z OKOLÍ</span>
      </span>
      <h3>Co sem lidé nejčastěji přidávají?</h3>
      <ul class="idea-list">
        <li>
          <strong>Menší útulky a depozita</strong>, kde uvítají deky nebo
          vyvenčení psa.
        </li>
        <li>
          <strong>Veřejné knihobudky a poličky pro druhou šanci věcí</strong> na
          nádražích a v parcích.
        </li>
        <li>
          <strong>Komunitní šatníky a potravinové skříňky</strong> pro rodiny v nouzi.
        </li>
        <li>
          <strong>Sousedské úklidy, výsadby stromů</strong> nebo sousedské výměny
          oblečení a věcí.
        </li>
      </ul>
    </aside>
  </div>
</div>

<style>
  .page {
    width: 100%;
    max-width: 1140px;
    margin: 0 auto;
    box-sizing: border-box;
    padding: 0.25rem 1.25rem 2.5rem;
  }

  @media (min-width: 681px) {
    :global(.page-header.submit-page-header) {
      padding: 0.65rem 0 0.7rem;
      margin-bottom: 0.85rem;
    }

    :global(.page-header.submit-page-header .page-header-kicker) {
      margin-bottom: 0.22rem;
    }

    :global(.page-header.submit-page-header .page-header-subtitle) {
      margin-top: 0.28rem;
    }

    .name-loc-grid {
      display: grid;
      grid-template-columns: 0.9fr 1.1fr;
      gap: 0.45rem 0.75rem;
      align-items: end;
    }

    .name-loc-grid .field {
      min-width: 0;
    }

    .name-loc-grid .loc-extras {
      grid-column: 1 / -1;
    }

    .name-loc-grid .loc-search {
      flex-wrap: nowrap;
    }

    .name-loc-grid .loc-search input {
      min-width: 0;
    }
  }

  .submit-layout {
    display: grid;
    grid-template-columns: 1.38fr 0.62fr;
    gap: 1.35rem;
    align-items: start;
  }

  .card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 22px;
    box-shadow: var(--shadow-sm);
    padding: 1.15rem 1.4rem;
  }

  .tabs {
    display: inline-flex;
    gap: 0.3rem;
    padding: 0.26rem;
    border-radius: 999px;
    background: var(--bg-subtle);
    border: 1px solid var(--border-subtle);
    margin-bottom: 0.75rem;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.38rem;
    min-height: 44px;
    min-width: 44px;
    border-radius: 999px;
    border: none;
    background: transparent;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--ink-secondary);
    transition: background-color 0.16s ease, color 0.16s ease;
  }

  .tab:hover {
    color: var(--ink-primary);
  }

  .tab.active {
    background: var(--accent-primary);
    color: #ffffff;
    box-shadow: var(--shadow-sm);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 0.68rem;
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
    gap: 0.28rem;
  }

  .field.wide {
    grid-column: 1 / -1;
  }

  label,
  .label {
    font-size: 0.86rem;
    font-weight: 700;
    color: var(--ink-primary);
  }

  input,
  textarea {
    padding: 0.56rem 0.85rem;
    border-radius: 12px;
    border: 1px solid var(--border-strong);
    background: var(--bg-surface);
    color: var(--ink-primary);
    font-family: inherit;
    font-size: 0.92rem;
    min-height: 44px;
  }

  textarea {
    resize: vertical;
    min-height: 66px;
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
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.14rem;
  }

  .calm-drawer.optional-fields {
    padding: 0.5rem 1rem;
  }

  .q-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.42rem 0.78rem;
    border-radius: 999px;
    border: 1px solid var(--border-subtle);
    background: var(--bg-subtle);
    color: var(--ink-secondary);
    font-family: var(--font-sans);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .q-pill:hover {
    background: var(--bg-surface);
    border-color: var(--accent-primary);
    color: var(--ink-primary);
  }

  .q-pill.active {
    background: var(--accent-primary);
    color: #ffffff;
    border-color: var(--accent-primary);
  }

  .geo-results {
    margin-top: 0.4rem;
    display: grid;
    gap: 0.35rem;
  }

  .geo-item {
    min-height: 44px;
    min-width: 44px;
    text-align: left;
    padding: 0.55rem 0.8rem;
    border-radius: 12px;
    border: 1px solid var(--border-subtle);
    background: var(--bg-surface);
    cursor: pointer;
  }

  .geo-item:hover {
    border-color: var(--accent-primary);
    background: var(--bg-subtle);
  }

  .geo-title {
    display: block;
    font-weight: 800;
    color: var(--ink-primary);
    font-size: 0.88rem;
  }

  .geo-sub {
    display: block;
    font-size: 0.78rem;
    color: var(--ink-secondary, #3f574a);
  }

  .picked {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.25rem;
    color: var(--accent-primary);
    font-size: 0.86rem;
    font-weight: 600;
  }

  .geo-hint {
    margin-top: 0.25rem;
    color: var(--ink-muted);
    font-size: 0.82rem;
  }

  .btn {
    border-radius: 14px;
    padding: 0.72rem 1.15rem;
    font-family: var(--font-sans);
    font-weight: 700;
    cursor: pointer;
    border: 1px solid var(--border-strong);
  }

  .btn.secondary {
    min-height: 44px;
    min-width: 44px;
    background: var(--bg-subtle);
    color: var(--ink-primary);
    padding: 0.62rem 1.05rem;
    border-radius: 12px;
  }

  .btn.secondary:hover:not(:disabled) {
    background: var(--bg-surface);
    border-color: var(--accent-primary);
  }

  .submit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 44px;
    min-width: 44px;
    background: var(--accent-primary);
    border: 1px solid var(--accent-primary);
    color: #ffffff;
    font-size: 0.94rem;
    padding: 0.78rem 1.45rem;
    transition: background-color 0.18s ease;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--accent-primary-hover);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .banner {
    margin-top: 0.4rem;
    padding: 0.75rem 0.95rem;
    border-radius: 12px;
    font-size: 0.88rem;
  }

  .banner.error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
  }

  .banner.success {
    background: var(--bg-subtle);
    border: 1px solid var(--border-strong);
    color: var(--ink-primary);
  }

  .map-jump-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    margin-top: 0.35rem;
    font-weight: 800;
    color: var(--accent-primary);
    text-decoration: none;
  }

  .map-jump-link:hover {
    text-decoration: underline;
  }

  .hp {
    display: none;
  }

  /* Single Calm Sidebar Note */
  .side-note {
    padding: 1.45rem;
    border-radius: 20px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    box-shadow: var(--shadow-sm);
  }

  .board-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #8f4b0e;
  }

  .side-note h3 {
    margin: 0.4rem 0 0.8rem;
    font-size: 1.06rem;
    font-weight: 800;
    color: var(--ink-primary);
  }

  .idea-list {
    margin: 0;
    padding-left: 1.15rem;
    font-size: 0.86rem;
    line-height: 1.6;
    color: var(--ink-secondary);
  }

  .idea-list li {
    margin-bottom: 0.5rem;
  }

  .idea-list strong {
    color: var(--ink-primary);
  }

  @media (min-width: 681px) {
    textarea#desc {
      min-height: 52px;
    }

    .grid.event-fields-box {
      grid-template-columns: 1.3fr 1fr 1fr;
      gap: 0.65rem;
    }

    .event-fields-box .field.event-url-field {
      grid-column: auto;
    }

    .event-fields-box .field {
      min-width: 0;
    }

    .event-fields-box input {
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
      padding: 0.56rem 0.65rem;
    }
  }

  @media (max-width: 920px) {
    .submit-layout {
      grid-template-columns: 1fr;
    }
    .grid,
    .grid.event-fields-box {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .page {
      padding: 0.5rem 0.75rem 2.25rem;
    }

    .submit-layout {
      gap: 1.1rem;
    }

    .submit-layout > * {
      min-width: 0;
      max-width: 100%;
    }

    .card {
      padding: 0.95rem;
      border-radius: 18px;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
    }

    .tabs {
      margin-bottom: 0.75rem;
      max-width: 100%;
    }

    .tab {
      min-height: 44px;
      min-width: 44px;
      box-sizing: border-box;
    }

    .form,
    .name-loc-grid {
      display: flex;
      flex-direction: column;
      gap: 0.72rem;
      min-width: 0;
    }

    .field {
      min-width: 0;
    }

    .loc-search input {
      min-width: 0;
    }

    input,
    textarea {
      font-size: 1rem;
      min-height: 44px;
      padding: 0.58rem 0.78rem;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    textarea {
      min-height: 84px;
    }

    .loc-extras > .quick-pills {
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .q-pill {
      flex: 0 0 auto;
      white-space: nowrap;
      min-height: 44px;
      min-width: 44px;
      padding: 0.42rem 0.78rem;
      box-sizing: border-box;
    }

    .btn,
    .submit-btn {
      min-height: 48px;
      width: 100%;
      box-sizing: border-box;
    }

    .loc-search .btn.secondary {
      width: auto;
      min-height: 44px;
    }
  }
</style>
