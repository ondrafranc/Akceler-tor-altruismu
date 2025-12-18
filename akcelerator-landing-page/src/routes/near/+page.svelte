<script>
  import { onMount } from 'svelte';
  import { currentLanguage } from '../../lib/stores.js';

  let language = 'czech';
  currentLanguage.subscribe((v) => (language = v));

  // Czech-only data, but we keep EN labels for now (site supports both)
  const UI = {
    czech: {
      title: '🗺️ Pomoc v okolí',
      subtitle: 'Jeden malý krok. Vyberte místo nebo organizaci poblíž vás.',
      back: '← Zpět na úvod',
      useGps: '📍 Použít moji polohu',
      city: 'Město',
      radius: 'Okruh (km)',
      what: 'Co zobrazit',
      kinds: {
        ngo: '🏛️ Organizace / spolky',
        community: '🏘️ Komunitní místa',
        food: '🍞 Potravinová pomoc',
        animals: '🐾 Zvířata'
      },
      loading: 'Načítám mapu…',
      fetching: 'Hledám místa v okolí…',
      nothing: 'Zkuste větší okruh nebo jiné kategorie.',
      disclaimer: 'Data jsou z OpenStreetMap (může být neúplné).'
    },
    english: {
      title: '🗺️ Help near you',
      subtitle: 'One small step. Pick a place or organization near you.',
      back: '← Back to home',
      useGps: '📍 Use my location',
      city: 'City',
      radius: 'Radius (km)',
      what: 'What to show',
      kinds: {
        ngo: '🏛️ NGOs / associations',
        community: '🏘️ Community places',
        food: '🍞 Food aid',
        animals: '🐾 Animals'
      },
      loading: 'Loading map…',
      fetching: 'Searching nearby…',
      nothing: 'Try a bigger radius or different categories.',
      disclaimer: 'Data from OpenStreetMap (may be incomplete).'
    }
  };

  const OPPORTUNITY_SOURCES = [
    {
      id: 'dobrokruh',
      url: 'https://dobrokruh.cz/en/dobrovolnictvi?utm_source=openai',
      czech: {
        title: 'Dobrokruh',
        desc: 'Ověřené dobrovolnické projekty napříč Českem (online i offline).',
        bullets: ['Filtr podle města', 'Krátké i dlouhé zapojení', 'Dobré pro „rychlý start“']
      },
      english: {
        title: 'Dobrokruh',
        desc: 'Verified volunteering projects across Czechia (online and offline).'
      }
    },
    {
      id: 'inex',
      url: 'https://www.inexsda.cz/en/activities/workcamps-in-cz/?utm_source=openai',
      czech: {
        title: 'INEX – workcampy',
        desc: 'Krátké dobrovolnické workcampy v ČR (skvělý “reset” a nový kruh lidí).',
        bullets: ['Víkend až několik týdnů', 'Skupinový zážitek', 'Konkrétní projekty v regionech']
      },
      english: {
        title: 'INEX – workcamps',
        desc: 'Short volunteering workcamps in CZ (good reset + new people).'
      }
    },
    {
      id: 'adra',
      url: 'https://adra.cz/en/homepage/get-involved/become-a-volunteer/?utm_source=openai',
      czech: {
        title: 'ADRA – dobrovolnictví',
        desc: 'Dobrovolnické programy (senioři, děti, nemocnice, sociální podpora).',
        bullets: ['Programy v regionech', 'Dlouhodobější zapojení', 'Silná síť organizací']
      },
      english: {
        title: 'ADRA – volunteering',
        desc: 'Volunteer programs (seniors, kids, hospitals, social support).'
      }
    }
  ];

  const cities = [
    { label: 'Praha', lat: 50.0755, lon: 14.4378 },
    { label: 'Brno', lat: 49.1951, lon: 16.6068 },
    { label: 'Ostrava', lat: 49.8209, lon: 18.2625 },
    { label: 'Plzeň', lat: 49.7384, lon: 13.3736 },
    { label: 'Olomouc', lat: 49.5938, lon: 17.2509 },
    { label: 'Liberec', lat: 50.7671, lon: 15.0562 },
    { label: 'Hradec Králové', lat: 50.2092, lon: 15.8328 },
    { label: 'České Budějovice', lat: 48.9747, lon: 14.4743 },
    { label: 'Ústí nad Labem', lat: 50.6607, lon: 14.0323 }
  ];

  let selectedCity = cities[0];
  let radiusKm = 5;
  let kinds = ['ngo', 'community'];
  let includeAssociations = false;
  let query = '';
  let sortBy = 'distance'; // distance | name
  let visibleCount = 24;

  let gpsStatus = 'idle'; // idle | requesting | ok | error
  let gpsMessage = '';

  let mapEl;
  let map;
  let leaflet;
  let markersLayer;
  let userMarker;
  let radiusCircle;
  /** @type {Map<string, any>} */
  let markerById = new Map();
  let isLoadingMap = true;
  let isFetching = false;
  let places = [];

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  async function loadLeaflet() {
    // Load Leaflet from CDN (keeps deps simple)
    if (window.L) return window.L;

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });

    return window.L;
  }

  function normalizeUrl(url) {
    if (!url) return null;
    const u = String(url).trim();
    if (!u) return null;
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    if (u.startsWith('//')) return `https:${u}`;
    return `https://${u}`;
  }

  function safeText(v) {
    if (typeof v !== 'string') return '';
    return v.trim();
  }

  function truncate(text, max = 180) {
    const t = safeText(text);
    if (!t) return '';
    if (t.length <= max) return t;
    return t.slice(0, max - 1).trimEnd() + '…';
  }

  function placeTitle(p) {
    return p.name || (language === 'czech' ? 'Místo pomoci' : 'Place to help');
  }

  function placeAddress(p) {
    const addr = safeText(p.address);
    if (addr) return addr;
    const t = p.tags || {};
    const street = safeText(t['addr:street'] || t['addr:place']);
    const house = safeText(t['addr:housenumber'] || t['addr:conscriptionnumber'] || t['addr:streetnumber']);
    const city = safeText(t['addr:city'] || t['addr:town'] || t['addr:village'] || t['addr:hamlet'] || t['addr:suburb']);
    const postcode = safeText(t['addr:postcode']);
    const line1 = [street, house].filter(Boolean).join(' ');
    const line2 = [postcode, city].filter(Boolean).join(' ');
    return [line1, line2].filter(Boolean).join(', ');
  }

  function placePhone(p) {
    return safeText(p.phone || p.tags?.phone || p.tags?.['contact:phone']);
  }

  function placeEmail(p) {
    return safeText(p.email || p.tags?.email || p.tags?.['contact:email']);
  }

  function placeHours(p) {
    return safeText(p.opening_hours || p.tags?.opening_hours);
  }

  function placeDescription(p) {
    return safeText(p.description || p.tags?.description);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function updateRadiusOverlay(lat, lon) {
    if (!map || !leaflet) return;

    if (!radiusCircle) {
      radiusCircle = leaflet.circle([lat, lon], {
        radius: radiusKm * 1000,
        color: '#2E5D31',
        weight: 2,
        opacity: 0.55,
        fillColor: '#2E5D31',
        fillOpacity: 0.08
      }).addTo(map);
      return;
    }

    radiusCircle.setLatLng([lat, lon]);
    radiusCircle.setRadius(radiusKm * 1000);
  }

  function setUserLocation(lat, lon) {
    if (!map || !leaflet) return;
    map.setView([lat, lon], 13);
    if (userMarker) userMarker.remove();
    userMarker = leaflet.circleMarker([lat, lon], {
      radius: 7,
      color: '#2E5D31',
      fillColor: '#2E5D31',
      fillOpacity: 0.9
    }).addTo(map);

    updateRadiusOverlay(lat, lon);
  }

  async function fetchNearby(lat, lon) {
    isFetching = true;
    places = [];
    try {
      const resp = await fetch(
        `/api/nearby?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radius_m=${encodeURIComponent(
          radiusKm * 1000
        )}&kinds=${encodeURIComponent(kinds.join(','))}&include_associations=${includeAssociations ? '1' : '0'}`
      );
      const data = await resp.json();
      places = (data?.places || []).map((p) => ({
        ...p,
        website: normalizeUrl(p.website),
        distanceKm: Math.round(haversineKm(lat, lon, p.lat, p.lon))
      }));
      places.sort((a, b) => a.distanceKm - b.distanceKm);
      visibleCount = 24;
      renderMarkers();
    } catch (e) {
      // keep empty list
      places = [];
      renderMarkers();
    } finally {
      isFetching = false;
    }
  }

  function renderMarkers() {
    if (!map || !leaflet) return;
    if (markersLayer) markersLayer.remove();
    markersLayer = leaflet.layerGroup().addTo(map);
    markerById = new Map();

    function emojiForKind(kind) {
      if (kind === 'ngo') return '🏛️';
      if (kind === 'community') return '🏘️';
      if (kind === 'food') return '🍞';
      if (kind === 'animals') return '🐾';
      return '✨';
    }

    for (const p of places.slice(0, 250)) {
      const color =
        p.kind === 'ngo'
          ? '#2E5D31'
          : p.kind === 'community'
            ? '#3E7A43'
            : p.kind === 'food'
              ? '#b45309'
              : p.kind === 'animals'
                ? '#1d4ed8'
                : '#475569';

      const icon = leaflet.divIcon({
        className: 'place-pin',
        html: `<div class="pin pin-${p.kind}" style="border-color:${color}; color:${color}">${emojiForKind(p.kind)}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = leaflet.marker([p.lat, p.lon], { icon, riseOnHover: true });

      markerById.set(p.id, marker);

      const name = escapeHtml(placeTitle(p));
      const addr = escapeHtml(placeAddress(p));
      const hours = escapeHtml(placeHours(p));
      const phone = escapeHtml(placePhone(p));
      const email = escapeHtml(placeEmail(p));
      const desc = escapeHtml(truncate(placeDescription(p), 160));
      const web = p.website ? `<a href="${escapeHtml(p.website)}" target="_blank" rel="noopener">web</a>` : '';
      const osm = p.osm_url ? `<a href="${escapeHtml(p.osm_url)}" target="_blank" rel="noopener">OSM</a>` : '';
      const links = [web, osm].filter(Boolean).join(' · ');

      marker.bindPopup(
        `<div style="max-width:280px;">
          <div style="font-weight:800; margin-bottom:0.25rem;">${name}</div>
          <div style="opacity:.85;">~${p.distanceKm} km · ${escapeHtml(UI[language].kinds[p.kind] || p.kind)}</div>
          ${addr ? `<div style="margin-top:0.35rem;">📍 ${addr}</div>` : ''}
          ${hours ? `<div style="margin-top:0.25rem;">🕒 ${hours}</div>` : ''}
          ${phone ? `<div style="margin-top:0.25rem;">📞 ${phone}</div>` : ''}
          ${email ? `<div style="margin-top:0.25rem;">✉️ ${email}</div>` : ''}
          ${desc ? `<div style="margin-top:0.5rem; opacity:.85;">${desc}</div>` : ''}
          ${links ? `<div style="margin-top:0.5rem;">${links}</div>` : ''}
        </div>`
      );
      marker.addTo(markersLayer);
    }
  }

  function focusPlace(p) {
    if (!map) return;
    map.setView([p.lat, p.lon], Math.max(map.getZoom(), 15));
    const m = markerById.get(p.id);
    if (m && typeof m.openPopup === 'function') m.openPopup();
  }

  async function initMap() {
    leaflet = await loadLeaflet();
    isLoadingMap = false;
    map = leaflet.map(mapEl, { zoomControl: true });

    leaflet
      .tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution:
          '&copy; OpenStreetMap contributors &copy; CARTO'
      })
      .addTo(map);

    setUserLocation(selectedCity.lat, selectedCity.lon);
    await fetchNearby(selectedCity.lat, selectedCity.lon);

    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      setUserLocation(lat, lng);
      await fetchNearby(lat, lng);
    });
  }

  async function useGps() {
    gpsStatus = 'requesting';
    gpsMessage = 'Čekám na povolení polohy…';

    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      gpsStatus = 'error';
      gpsMessage = 'Poloha funguje jen na HTTPS. Zvolte město nebo otevřete stránku přes https://';
      return;
    }

    if (!navigator?.geolocation) {
      gpsStatus = 'error';
      gpsMessage = 'Váš prohlížeč nepodporuje polohu. Zvolte město.';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        gpsStatus = 'ok';
        gpsMessage = 'Poloha načtena. Hledám místa v okolí…';
        setUserLocation(lat, lon);
        await fetchNearby(lat, lon);
        gpsMessage = 'Hotovo. Klikněte na bod nebo na kartu pro detail.';
      },
      (err) => {
        gpsStatus = 'error';
        if (err?.code === 1) gpsMessage = 'Poloha je zablokovaná. Povolte ji v prohlížeči (ikona zámku v adresním řádku).';
        else if (err?.code === 2) gpsMessage = 'Poloha není dostupná (GPS/Wi‑Fi). Zkuste to znovu, nebo vyberte město.';
        else if (err?.code === 3) gpsMessage = 'Poloha trvá moc dlouho. Zkuste to znovu, nebo vyberte město.';
        else gpsMessage = 'Nepodařilo se získat polohu. Zkuste to znovu, nebo vyberte město.';
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
    );
  }

  async function refreshFromMapCenter() {
    if (!map) return;
    const center = map.getCenter();
    updateRadiusOverlay(center.lat, center.lng);
    await fetchNearby(center.lat, center.lng);
  }

  $: filteredPlaces = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return places;
    return places.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const addr = (p.address || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return name.includes(q) || addr.includes(q) || desc.includes(q);
    });
  })();

  $: sortedPlaces = (() => {
    if (sortBy === 'name') {
      return [...filteredPlaces].sort((a, b) => {
        const an = (a.name || '').toString();
        const bn = (b.name || '').toString();
        return an.localeCompare(bn, 'cs', { sensitivity: 'base' });
      });
    }
    return filteredPlaces;
  })();

  $: visiblePlaces = sortedPlaces.slice(0, visibleCount);

  onMount(() => {
    initMap();
  });
</script>

<div class="near-page">
  <div class="near-header">
    <a class="back" href="/">{UI[language].back}</a>
    <div class="title">{UI[language].title}</div>
    <div class="subtitle">{UI[language].subtitle}</div>
  </div>

  <div class="controls card">
    <div class="row">
      <button class="btn" on:click={useGps} disabled={gpsStatus === 'requesting'}>
        {gpsStatus === 'requesting' ? '📍 Zjišťuji polohu…' : UI[language].useGps}
      </button>
      <div class="field">
        <label for="near_city">{UI[language].city}</label>
        <select
          id="near_city"
          bind:value={selectedCity}
          on:change={async () => {
            setUserLocation(selectedCity.lat, selectedCity.lon);
            await fetchNearby(selectedCity.lat, selectedCity.lon);
          }}
        >
          {#each cities as c}
            <option value={c}>{c.label}</option>
          {/each}
        </select>
      </div>
      <div class="field">
        <label for="near_radius">{UI[language].radius}</label>
        <input id="near_radius" type="range" min="1" max="25" step="1" bind:value={radiusKm} on:change={refreshFromMapCenter} />
        <div class="muted">{radiusKm} km</div>
      </div>
    </div>

    {#if gpsMessage}
      <div class={"gps-banner " + gpsStatus} aria-live="polite">
        {gpsMessage}
      </div>
    {/if}

    <div class="row">
      <div class="field wide">
        <div class="field-label">{UI[language].what}</div>
        <div class="kinds">
          {#each Object.keys(UI[language].kinds) as k}
            <label class="chip">
              <input
                type="checkbox"
                checked={kinds.includes(k)}
                on:change={(e) => {
                  if (e.target.checked) kinds = [...kinds, k];
                  else kinds = kinds.filter((x) => x !== k);
                  refreshFromMapCenter();
                }}
              />
              <span>{UI[language].kinds[k]}</span>
            </label>
          {/each}
        </div>
        <label class="assoc">
          <input
            type="checkbox"
            checked={includeAssociations}
            on:change={() => {
              includeAssociations = !includeAssociations;
              refreshFromMapCenter();
            }}
          />
          <span>Zahrnout i obecné spolky (víc výsledků, občas šum)</span>
        </label>
        <div class="muted">{UI[language].disclaimer}</div>
        <div class="muted">Tip: klikněte do mapy pro změnu místa.</div>
      </div>
    </div>
  </div>

  <div class="map-card card">
    {#if isLoadingMap}
      <div class="loading">{UI[language].loading}</div>
    {/if}
    <div bind:this={mapEl} class="map"></div>
  </div>

  <div class="results">
    <div class="results-head">
      <div class="section-title">
        {isFetching ? UI[language].fetching : `${filteredPlaces.length} ${language === 'czech' ? 'míst' : 'places'}`}
      </div>
      <div class="results-controls">
        <input class="search" type="search" placeholder="Hledat (název / adresa)" bind:value={query} />
        <select class="sort" bind:value={sortBy}>
          <option value="distance">Nejblíž</option>
          <option value="name">A–Z</option>
        </select>
      </div>
    </div>

    {#if !isFetching && filteredPlaces.length === 0}
      <div class="card empty">{UI[language].nothing}</div>
    {/if}

    <div class="grid">
      {#each visiblePlaces as p}
        <div class="card place">
          <div class="place-title">{placeTitle(p)}</div>
          <div class="place-meta">
            <span>~{p.distanceKm} km</span>
            <span class="dot">•</span>
            <span>{UI[language].kinds[p.kind] || p.kind}</span>
          </div>

          {#if placeAddress(p)}
            <div class="place-line"><span class="ico">📍</span><span>{placeAddress(p)}</span></div>
          {/if}
          {#if placeHours(p)}
            <div class="place-line"><span class="ico">🕒</span><span>{placeHours(p)}</span></div>
          {/if}
          {#if placePhone(p)}
            <div class="place-line"><span class="ico">📞</span><span>{placePhone(p)}</span></div>
          {/if}
          {#if placeEmail(p)}
            <div class="place-line"><span class="ico">✉️</span><span>{placeEmail(p)}</span></div>
          {/if}
          {#if placeDescription(p)}
            <div class="place-desc">{truncate(placeDescription(p), 160)}</div>
          {/if}

          <div class="place-actions">
            <button class="action secondary" type="button" on:click={() => focusPlace(p)}>Zobrazit na mapě</button>
            {#if p.website}
              <a class="action primary" href={p.website} target="_blank" rel="noopener">Web →</a>
            {:else if p.osm_url}
              <a class="action primary" href={p.osm_url} target="_blank" rel="noopener">Detail (OSM) →</a>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    {#if !isFetching && visibleCount < sortedPlaces.length}
      <div class="more-row">
        <button class="btn secondary-btn" type="button" on:click={() => (visibleCount += 24)}>
          Zobrazit další
        </button>
      </div>
    {/if}
  </div>

  <div class="results">
    <div class="section-title">
      {language === 'czech' ? '✨ Akce a příležitosti (portály)' : '✨ Real opportunities (portals)'}
    </div>
    <div class="grid">
      {#each OPPORTUNITY_SOURCES as src}
        <div class="card place">
          <div class="place-title">{src[language].title}</div>
          <div class="place-meta">
            <span>{src[language].desc}</span>
          </div>
          {#if src[language].bullets}
            <ul class="bullets">
              {#each src[language].bullets as b}
                <li>{b}</li>
              {/each}
            </ul>
          {/if}
          <a class="link" href={src.url} target="_blank" rel="noopener">
            {language === 'czech' ? 'Otevřít →' : 'Open →'}
          </a>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .near-page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 1rem 1rem 2rem 1rem;
  }

  .near-header {
    text-align: center;
    margin-bottom: 1rem;
  }
  .back {
    display: inline-block;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
    text-decoration: none;
  }
  .back:hover { text-decoration: underline; }
  .title {
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    color: var(--czech-forest);
    font-size: clamp(1.8rem, 3vw, 2.4rem);
    line-height: 1.1;
  }
  .subtitle {
    color: var(--text-secondary);
    margin-top: 0.35rem;
  }

  .card {
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(44, 62, 45, 0.12);
    border-radius: 16px;
    box-shadow: 0 10px 28px rgba(0,0,0,0.08);
  }

  .controls { padding: 1rem; margin-bottom: 1rem; }
  .row { display: flex; gap: 0.9rem; flex-wrap: wrap; align-items: end; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; min-width: 180px; }
  .field.wide { flex: 1; min-width: 260px; }
  label, .field-label { font-size: 0.9rem; color: var(--text-secondary); }
  select, input[type="range"] {
    width: 100%;
  }
  select {
    padding: 0.55rem 0.65rem;
    border-radius: 12px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: white;
  }
  .btn {
    padding: 0.7rem 0.9rem;
    border-radius: 12px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: var(--czech-forest);
    color: white;
    font-weight: 700;
    cursor: pointer;
  }
  .btn:hover { filter: brightness(0.95); }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .muted { color: var(--text-secondary); font-size: 0.88rem; }
  .gps-banner {
    margin-top: 0.75rem;
    padding: 0.55rem 0.75rem;
    border-radius: 12px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: rgba(242, 247, 242, 0.7);
    color: var(--text-secondary);
    font-size: 0.92rem;
  }
  .gps-banner.error { background: rgba(254, 242, 242, 0.75); border-color: rgba(127, 29, 29, 0.15); }
  .gps-banner.ok { background: rgba(236, 253, 245, 0.75); border-color: rgba(6, 95, 70, 0.15); }

  .kinds { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .chip {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.45rem 0.6rem;
    border-radius: 999px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: rgba(242, 247, 242, 0.8);
    cursor: pointer;
    user-select: none;
  }
  .chip input { margin: 0; }
  .assoc { display:flex; gap: 0.5rem; align-items:center; margin-top: 0.6rem; color: var(--text-secondary); font-size: 0.92rem; }
  .assoc input { margin: 0; }

  .map-card { overflow: hidden; margin-bottom: 1rem; position: relative; }
  .map {
    height: 520px;
    width: 100%;
  }
  .loading {
    position: absolute;
    z-index: 2;
    top: 12px;
    left: 12px;
    background: rgba(255,255,255,0.9);
    border: 1px solid rgba(44, 62, 45, 0.12);
    border-radius: 999px;
    padding: 0.4rem 0.7rem;
    font-size: 0.92rem;
    color: var(--text-secondary);
  }

  .results { margin-top: 0.75rem; }
  .results-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.4rem;
  }
  .section-title {
    font-weight: 800;
    color: var(--czech-forest);
    margin: 0.5rem 0 0.75rem 0;
    font-family: 'Inter', sans-serif;
  }
  .results-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .search, .sort {
    padding: 0.55rem 0.65rem;
    border-radius: 12px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: white;
  }
  .search { min-width: 240px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.8rem;
  }
  .place { padding: 0.9rem; }
  .place-title { font-weight: 800; color: var(--czech-forest); margin-bottom: 0.25rem; }
  .place-meta { color: var(--text-secondary); font-size: 0.9rem; display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap; }
  .dot { opacity: 0.5; }
  .place-line { margin-top: 0.4rem; color: var(--text-secondary); font-size: 0.92rem; display:flex; gap: 0.45rem; align-items:flex-start; }
  .ico { line-height: 1.2; }
  .place-desc { margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.92rem; line-height: 1.55; }
  .place-actions { display:flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
  .action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.55rem 0.7rem;
    border-radius: 12px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    text-decoration: none;
    font-weight: 800;
    cursor: pointer;
    background: white;
    color: var(--czech-forest);
  }
  .action.primary { background: var(--czech-forest); color: white; }
  .action.secondary:hover { filter: brightness(0.98); }
  .action.primary:hover { filter: brightness(0.95); }
  .link { display: inline-block; margin-top: 0.6rem; color: var(--czech-forest); font-weight: 700; text-decoration: none; }
  .link:hover { text-decoration: underline; }
  .bullets {
    margin: 0.6rem 0 0 1.15rem;
    padding: 0;
    color: var(--text-secondary);
    font-size: 0.92rem;
    line-height: 1.5;
  }
  .empty { padding: 1rem; color: var(--text-secondary); }
  .more-row { display:flex; justify-content:center; margin-top: 0.9rem; }
  .secondary-btn { background: white; color: var(--czech-forest); }

  @media (max-width: 980px) {
    .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .map { height: 460px; }
  }
  @media (max-width: 640px) {
    .grid { grid-template-columns: 1fr; }
    .map { height: 420px; }
    .search { min-width: 100%; }
  }

  /* Leaflet polish (coherent + playful) */
  :global(.place-pin) { background: transparent; border: none; }
  :global(.place-pin .pin) {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: rgba(255,255,255,0.92);
    border: 2px solid rgba(44, 62, 45, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 20px rgba(0,0,0,0.12);
    transform: translateZ(0);
  }
  :global(.leaflet-control-zoom a) {
    border-radius: 10px !important;
    border: 1px solid rgba(44, 62, 45, 0.12) !important;
    color: var(--czech-forest) !important;
    background: rgba(255,255,255,0.92) !important;
    box-shadow: 0 10px 22px rgba(0,0,0,0.08);
  }
  :global(.leaflet-popup-content-wrapper) {
    border-radius: 16px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    box-shadow: 0 16px 34px rgba(0,0,0,0.12);
  }
  :global(.leaflet-popup-tip) {
    box-shadow: 0 16px 34px rgba(0,0,0,0.10);
  }
</style>


