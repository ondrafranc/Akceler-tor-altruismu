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
        desc: 'Ověřené dobrovolnické projekty napříč Českem (online i offline).'
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
        desc: 'Krátké dobrovolnické workcampy v ČR (skvělý “reset” a nový kruh lidí).'
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
        desc: 'Dobrovolnické programy (senioři, děti, nemocnice, sociální podpora).'
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

  let mapEl;
  let map;
  let leaflet;
  let markersLayer;
  let userMarker;
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
  }

  async function fetchNearby(lat, lon) {
    isFetching = true;
    places = [];
    try {
      const resp = await fetch(
        `/api/nearby?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radius_m=${encodeURIComponent(
          radiusKm * 1000
        )}&kinds=${encodeURIComponent(kinds.join(','))}`
      );
      const data = await resp.json();
      places = (data?.places || []).map((p) => ({
        ...p,
        distanceKm: Math.round(haversineKm(lat, lon, p.lat, p.lon))
      }));
      places.sort((a, b) => a.distanceKm - b.distanceKm);
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

      const marker = leaflet.circleMarker([p.lat, p.lon], {
        radius: 6,
        color,
        fillColor: color,
        fillOpacity: 0.65
      });

      const name = p.name || (language === 'czech' ? 'Místo pomoci' : 'Place to help');
      const web = p.website ? `<div><a href="${p.website}" target="_blank" rel="noopener">web</a></div>` : '';
      marker.bindPopup(`<div style="max-width:260px;"><b>${name}</b>${web}<div>~${p.distanceKm} km</div></div>`);
      marker.addTo(markersLayer);
    }
  }

  async function initMap() {
    leaflet = await loadLeaflet();
    isLoadingMap = false;
    map = leaflet.map(mapEl, { zoomControl: true });

    leaflet
      .tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
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
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLocation(lat, lon);
        await fetchNearby(lat, lon);
      },
      () => {
        // ignore
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function refreshFromMapCenter() {
    if (!map) return;
    const center = map.getCenter();
    await fetchNearby(center.lat, center.lng);
  }

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
      <button class="btn" on:click={useGps}>{UI[language].useGps}</button>
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
        <div class="muted">{UI[language].disclaimer}</div>
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
    <div class="section-title">
      {isFetching ? UI[language].fetching : `${places.length} ${language === 'czech' ? 'míst' : 'places'}`}
    </div>

    {#if !isFetching && places.length === 0}
      <div class="card empty">{UI[language].nothing}</div>
    {/if}

    <div class="grid">
      {#each places.slice(0, 24) as p}
        <div class="card place">
          <div class="place-title">{p.name || (language === 'czech' ? 'Místo pomoci' : 'Place to help')}</div>
          <div class="place-meta">
            <span>~{p.distanceKm} km</span>
            <span class="dot">•</span>
            <span>{UI[language].kinds[p.kind] || p.kind}</span>
          </div>
          {#if p.website}
            <a class="link" href={p.website} target="_blank" rel="noopener">Otevřít web →</a>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div class="results">
    <div class="section-title">
      {language === 'czech' ? '✨ Skutečné příležitosti (portály)' : '✨ Real opportunities (portals)'}
    </div>
    <div class="grid">
      {#each OPPORTUNITY_SOURCES as src}
        <div class="card place">
          <div class="place-title">{src[language].title}</div>
          <div class="place-meta">
            <span>{src[language].desc}</span>
          </div>
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
  .muted { color: var(--text-secondary); font-size: 0.88rem; }

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
  .section-title {
    font-weight: 800;
    color: var(--czech-forest);
    margin: 0.5rem 0 0.75rem 0;
    font-family: 'Inter', sans-serif;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.8rem;
  }
  .place { padding: 0.9rem; }
  .place-title { font-weight: 800; color: var(--czech-forest); margin-bottom: 0.25rem; }
  .place-meta { color: var(--text-secondary); font-size: 0.9rem; display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap; }
  .dot { opacity: 0.5; }
  .link { display: inline-block; margin-top: 0.6rem; color: var(--czech-forest); font-weight: 700; text-decoration: none; }
  .link:hover { text-decoration: underline; }
  .empty { padding: 1rem; color: var(--text-secondary); }

  @media (max-width: 980px) {
    .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .map { height: 460px; }
  }
  @media (max-width: 640px) {
    .grid { grid-template-columns: 1fr; }
    .map { height: 420px; }
  }
</style>


