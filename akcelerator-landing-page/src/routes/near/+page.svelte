<script>
  import { onMount, tick } from 'svelte';
  import 'leaflet/dist/leaflet.css';
  import { trackEvent } from '../../lib/analytics.js';
  import {
    PORTALS,
    CZECH_CITIES,
    CURATED_FALLBACK_PLACES,
    buildFirstContactTemplate
  } from '../../lib/data/czech-actions.js';
  import { recordSmallWin } from '../../lib/progress.js';

  const CATEGORY_PRESETS = [
    { id: 'all', label: '✨ Vše smysluplné v okolí', kinds: ['ngo', 'community', 'food', 'animals'], onlyWeb: false },
    { id: 'animals', label: '🐾 Útulky a zvířata', kinds: ['animals'], onlyWeb: false },
    { id: 'food', label: '🥫 Jídlo a šatníky', kinds: ['food', 'community'], onlyWeb: false },
    { id: 'community', label: '📚 Knihobudky a sousedé', kinds: ['community'], onlyWeb: false },
    { id: 'fast', label: '⚡ S přímým webem', kinds: ['ngo', 'community', 'food', 'animals'], onlyWeb: true }
  ];

  const KIND_META = {
    ngo: { emoji: '🏛️', label: 'Neziskovka / spolek', color: '#059669' },
    community: { emoji: '🤝', label: 'Komunita / knihobudka', color: '#0d9488' },
    food: { emoji: '🥫', label: 'Potraviny a šatník', color: '#d97706' },
    animals: { emoji: '🐾', label: 'Zvířata a útulek', color: '#2563eb' }
  };

  let activePresetId = 'all';
  let selectedCity = CZECH_CITIES[0];
  let centerLat = selectedCity.lat;
  let centerLon = selectedCity.lon;
  let radiusKm = 8;
  let kinds = ['ngo', 'community', 'food', 'animals'];
  let includeAssociations = false;
  let onlyWithWebsite = false;
  let query = '';
  let sortBy = 'easy'; // easy | distance | name

  // Geocode & GPS
  let locationQuery = '';
  let geoStatus = 'idle';
  let geoMessage = '';
  /** @type {Array<{label: string, lat: number, lon: number}>} */
  let geoResults = [];
  let gpsStatus = 'idle';
  let gpsMessage = '';
  let shareMessage = '';

  // Map state
  let mapEl;
  let map = null;
  let leaflet = null;
  let tileLayer = null;
  let tileStyle = 'osm'; // 'osm' | 'hot'
  let markersLayer = null;
  let userMarker = null;
  let radiusCircle = null;
  /** @type {Map<string, any>} */
  let markerById = new Map();

  let isLoadingMap = true;
  let mapBootError = '';
  let isFetching = false;
  let isFallbackData = false;
  let isExpandedToNearest = false;

  /** @type {Array<any>} */
  let places = [];
  /** @type {Array<any>} */
  let communityItems = [];
  let activePlaceId = null;
  let visibleCount = 3;
  let mobileView = 'both'; // 'both' | 'list' | 'map'

  // First-contact template
  let openTemplateId = null;
  let copiedTemplateId = null;

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

  function normalizeUrl(url) {
    if (!url) return null;
    const u = String(url).trim();
    if (!u) return null;
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    if (u.startsWith('//')) return `https:${u}`;
    return `https://${u}`;
  }

  function safeText(v) {
    return typeof v === 'string' ? v.trim() : '';
  }

  function formatDist(km) {
    if (!Number.isFinite(km)) return '';
    if (km < 1) return `${Math.max(100, Math.round(km * 10) * 100)} m`;
    return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  }

  function getInstantCurated(lat, lon, activeKinds) {
    const kList = activeKinds?.length ? activeKinds : ['ngo', 'community', 'food', 'animals'];
    const allWithDist = CURATED_FALLBACK_PLACES.filter((p) => kList.includes(p.kind))
      .map((p) => {
        const d = haversineKm(lat, lon, p.lat, p.lon);
        return {
          ...p,
          curated: true,
          website: normalizeUrl(p.website),
          distanceKm: Math.round(d * 10) / 10
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const near = allWithDist.filter((p) => p.distanceKm <= Math.max(radiusKm, 15));
    return near.length >= 2 ? near : allWithDist.slice(0, 6);
  }

  function concreteActionHint(p) {
    if (p?.quickMission) return p.quickMission;
    const sub = (p?.subcategory || '').toLowerCase();
    if (sub.includes('knihobudka')) {
      return 'Vezmi doma přečtenou knížku a při procházce ji sem dej pro sousedy (0 Kč, bez domlouvání).';
    }
    if (p?.kind === 'animals') {
      return 'Ozvi se krátkou zprávou (tlačítko „Co jim napsat?“): zeptej se na venčení, staré ručníky a deky nebo granule.';
    }
    if (p?.kind === 'food' || sub.includes('šatník')) {
      return 'Daruj trvanlivé jídlo či čisté sezónní oblečení, nebo nabídni dvě hodiny rukou při třídění.';
    }
    if (p?.kind === 'community') {
      return 'Stav se na sousedskou akci, nabídni drobnou výpomoc nebo přines věci do komunitního oběhu.';
    }
    return 'Klikni na „Co jim napsat?“ — připravili jsme krátkou lidskou zprávu, se kterou snadno zjistíš, co se jim teď nejvíc hodí.';
  }

  function placeEaseScore(p) {
    let score = (Number.isFinite(p?.distanceKm) ? p.distanceKm : 50) * 0.08;
    if (p?.curated) score -= 0.45;
    if (p?.website) score -= 0.25;
    if (p?.email || p?.phone) score -= 0.15;
    if (p?.description) score -= 0.12;
    return score;
  }

  $: filteredPlaces = (() => {
    const q = query.trim().toLowerCase();
    let list = places.filter((p) => kinds.includes(p.kind || 'ngo'));
    if (onlyWithWebsite) list = list.filter((p) => !!p.website);
    if (q) {
      list = list.filter((p) => {
        const hay = `${p.name || ''} ${p.subcategory || ''} ${p.address || ''} ${p.description || ''}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (sortBy === 'distance') {
      return [...list].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }
    if (sortBy === 'name') {
      return [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'cs'));
    }
    return [...list].sort((a, b) => placeEaseScore(a) - placeEaseScore(b));
  })();

  $: visiblePlaces = filteredPlaces.slice(0, visibleCount);

  function setTileLayer(style) {
    if (!map || !leaflet) return;
    tileStyle = style;
    if (tileLayer) tileLayer.remove();

    // 100% free, zero-API-key OpenStreetMap & Humanitarian OSM tile servers
    const url =
      style === 'hot'
        ? 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution =
      style === 'hot'
        ? '&copy; OpenStreetMap přispěvatelé, styl Humanitarian OSM'
        : '&copy; OpenStreetMap přispěvatelé';

    tileLayer = leaflet.tileLayer(url, {
      maxZoom: 19,
      subdomains: style === 'hot' ? ['a', 'b', 'c'] : ['a', 'b', 'c'],
      attribution
    });

    if (style === 'hot') {
      let tileErrors = 0;
      tileLayer.on('tileerror', () => {
        tileErrors += 1;
        if (tileErrors >= 3 && tileStyle === 'hot') {
          setTileLayer('osm');
        }
      });
    }
    tileLayer.addTo(map);
  }

  function updateRadiusOverlay(lat, lon) {
    if (!map || !leaflet) return;
    if (!radiusCircle) {
      radiusCircle = leaflet
        .circle([lat, lon], {
          radius: radiusKm * 1000,
          color: '#10b981',
          weight: 2,
          opacity: 0.65,
          fillColor: '#10b981',
          fillOpacity: 0.08
        })
        .addTo(map);
    } else {
      radiusCircle.setLatLng([lat, lon]);
      radiusCircle.setRadius(radiusKm * 1000);
    }
  }

  function moveMapCenter(lat, lon, zoom = 13) {
    centerLat = lat;
    centerLon = lon;
    if (!map || !leaflet) return;
    map.setView([lat, lon], zoom, { animate: true });
    if (userMarker) userMarker.remove();
    userMarker = leaflet
      .circleMarker([lat, lon], {
        radius: 8,
        color: '#ffffff',
        weight: 2.5,
        fillColor: '#059669',
        fillOpacity: 1
      })
      .bindTooltip('Střed hledání', { direction: 'top' })
      .addTo(map);
    updateRadiusOverlay(lat, lon);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderMarkers() {
    if (!map || !leaflet) return;
    if (markersLayer) markersLayer.remove();
    markersLayer = leaflet.layerGroup().addTo(map);
    markerById = new Map();

    for (const p of filteredPlaces.slice(0, 160)) {
      if (typeof p.lat !== 'number' || typeof p.lon !== 'number') continue;
      const meta = KIND_META[p.kind] || KIND_META.ngo;
      const isCurated = !!p.curated;

      const icon = leaflet.divIcon({
        className: 'aa-map-pin',
        html: `<div class="pin-bubble ${isCurated ? 'is-curated' : ''}" style="--pin-color:${meta.color}"><span>${meta.emoji}</span>${isCurated ? '<i class="pin-star">★</i>' : ''}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const marker = leaflet.marker([p.lat, p.lon], { icon, riseOnHover: true });
      markerById.set(p.id, marker);

      const webHtml = p.website
        ? `<a href="${escapeHtml(p.website)}" target="_blank" rel="noopener" style="font-weight:800;color:#059669;">Otevřít web ↗</a>`
        : '';

      marker.bindPopup(
        `<div style="font-family:'Plus Jakarta Sans',sans-serif;max-width:260px;line-height:1.45;">
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:${meta.color};margin-bottom:2px;">
            ${escapeHtml(p.subcategory || meta.label)} • ${escapeHtml(formatDist(p.distanceKm))}
          </div>
          <div style="font-weight:800;font-size:14px;color:#0d2118;margin-bottom:4px;">${escapeHtml(p.name)}</div>
          ${p.address ? `<div style="font-size:12px;color:#3d5247;margin-bottom:4px;">📍 ${escapeHtml(p.address)}</div>` : ''}
          <div style="font-size:12px;background:#ecfdf5;padding:6px 8px;border-radius:8px;color:#065f46;margin:6px 0;">
            💡 ${escapeHtml(concreteActionHint(p))}
          </div>
          ${webHtml}
        </div>`
      );

      marker.on('click', async () => {
        activePlaceId = p.id;
        const idxInList = filteredPlaces.findIndex((item) => item.id === p.id);
        if (idxInList >= visibleCount) {
          visibleCount = idxInList + 1;
          await tick();
        }
        const el = document.getElementById(`place-card-${String(p.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });

      marker.addTo(markersLayer);
    }
  }

  // Re-render markers whenever filteredPlaces changes
  $: if (map && leaflet && filteredPlaces) {
    renderMarkers();
  }

  async function fetchNearby(lat, lon) {
    isFetching = true;
    // 1. Instant zero-wait curated places so map is IMMEDIATELY useful!
    places = getInstantCurated(lat, lon, kinds);
    syncUrlState(lat, lon);

    const communityPromise = fetch(
      `/api/community-nearby?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radius_m=${encodeURIComponent(radiusKm * 1000)}`
    )
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        communityItems = Array.isArray(d?.items) ? d.items : [];
      })
      .catch(() => {
        communityItems = [];
      });

    try {
      const resp = await fetch(
        `/api/nearby?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radius_m=${encodeURIComponent(
          radiusKm * 1000
        )}&kinds=${encodeURIComponent(kinds.join(','))}&include_associations=${includeAssociations ? '1' : '0'}`
      );
      if (resp.ok) {
        const data = await resp.json();
        isFallbackData = !!data?.fallback;
        isExpandedToNearest = !!data?.expandedToNearest;
        const apiPlaces = (data?.places || []).map((p) => {
          const d = haversineKm(lat, lon, p.lat, p.lon);
          return {
            ...p,
            website: normalizeUrl(p.website),
            distanceKm: Math.round(d * 10) / 10
          };
        });
        if (apiPlaces.length > 0) {
          places = apiPlaces;
        }
      }
    } catch {
      isFallbackData = true;
    } finally {
      await communityPromise;
      visibleCount = 3;
      isFetching = false;
    }
  }

  function syncUrlState(lat, lon) {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lat', String(Math.round(lat * 1000) / 1000));
      url.searchParams.set('lon', String(Math.round(lon * 1000) / 1000));
      url.searchParams.set('r', String(radiusKm));
      url.searchParams.set('kinds', kinds.join(','));
      history.replaceState({}, '', url.toString());
    } catch {}
  }

  async function selectQuickCity(city) {
    selectedCity = city;
    locationQuery = '';
    geoResults = [];
    geoMessage = '';
    moveMapCenter(city.lat, city.lon, 13);
    await fetchNearby(city.lat, city.lon);
    trackEvent('aa_near_city_pick', { city: city.id });
  }

  function applyPreset(preset) {
    activePresetId = preset.id;
    kinds = [...preset.kinds];
    onlyWithWebsite = !!preset.onlyWeb;
    fetchNearby(centerLat, centerLon);
  }

  function toggleKind(k) {
    if (kinds.includes(k)) {
      if (kinds.length > 1) kinds = kinds.filter((x) => x !== k);
    } else {
      kinds = [...kinds, k];
    }
    activePresetId = 'custom';
    fetchNearby(centerLat, centerLon);
  }

  async function searchLocation() {
    const q = safeText(locationQuery);
    if (q.length < 2) {
      geoStatus = 'error';
      geoMessage = 'Zadej aspoň 2 znaky (obec, město nebo PSČ).';
      return;
    }
    geoStatus = 'loading';
    geoMessage = 'Hledám místo v Česku…';
    geoResults = [];
    try {
      const resp = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=6`);
      const data = await resp.json();
      const res = Array.isArray(data?.results) ? data.results : [];
      geoResults = res;
      if (!res.length) {
        geoStatus = 'error';
        geoMessage = 'Místo jsme nenašli – zkus název okresu nebo klikni přímo do mapy.';
        return;
      }
      if (res.length === 1) {
        await pickGeocodeResult(res[0]);
      } else {
        geoStatus = 'ok';
        geoMessage = 'Vyber přesné místo:';
      }
    } catch {
      geoStatus = 'error';
      geoMessage = 'Vyhledávání teď neodpovídá – vyber prosím město nahoře nebo klikni do mapy.';
    }
  }

  async function pickGeocodeResult(r) {
    if (!r || typeof r.lat !== 'number' || typeof r.lon !== 'number') return;
    geoResults = [];
    geoStatus = 'idle';
    geoMessage = '';
    locationQuery = r.label.split(',')[0] || r.label;
    moveMapCenter(r.lat, r.lon, 13);
    await fetchNearby(r.lat, r.lon);
  }

  function useGps() {
    if (!navigator?.geolocation) {
      gpsStatus = 'error';
      gpsMessage = 'Prohlížeč nepodporuje GPS polohu – vyber město kliknutím výše.';
      return;
    }
    gpsStatus = 'requesting';
    gpsMessage = 'Čekám na povolení polohy v prohlížeči…';
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        gpsStatus = 'ok';
        gpsMessage = 'Poloha nalezena! Zobrazuji nejbližší místa kolem tebe.';
        moveMapCenter(pos.coords.latitude, pos.coords.longitude, 14);
        await fetchNearby(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        gpsStatus = 'error';
        gpsMessage = 'Poloha nebyla povolena – vyber prosím město ze štítků nebo napiš PSČ.';
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }

  function focusPlaceOnMap(p) {
    activePlaceId = p.id;
    if (mobileView === 'list') {
      mobileView = 'map';
      tick().then(() => map?.invalidateSize());
    }
    if (!map) return;
    map.flyTo([p.lat, p.lon], Math.max(map.getZoom(), 15), { duration: 0.5 });
    const m = markerById.get(p.id);
    if (m) m.openPopup();
  }

  async function copyTemplateText(place) {
    try {
      const tpl = buildFirstContactTemplate(place);
      await navigator.clipboard.writeText(tpl.body);
      copiedTemplateId = place.id;
      setTimeout(() => {
        if (copiedTemplateId === place.id) copiedTemplateId = null;
      }, 2600);
    } catch {}
  }

  async function copyShareLink() {
    try {
      syncUrlState(centerLat, centerLon);
      await navigator.clipboard.writeText(window.location.href);
      shareMessage = '✓ Odkaz na tuhle oblast mapy je zkopírovaný!';
      setTimeout(() => (shareMessage = ''), 3200);
    } catch {}
  }

  async function setMobileMode(mode) {
    mobileView = mode;
    await tick();
    if (map && mode !== 'list') {
      map.invalidateSize();
    }
  }

  onMount(async () => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const latP = Number(sp.get('lat'));
      const lonP = Number(sp.get('lon'));
      const rP = Number(sp.get('radius_km') || sp.get('r'));
      const kindsP = (sp.get('kinds') || '')
        .split(',')
        .map((s) => s.trim())
        .filter((k) => ['ngo', 'community', 'food', 'animals'].includes(k));

      if (kindsP.length) kinds = kindsP;
      if (Number.isFinite(rP) && rP > 0) {
        radiusKm = rP > 100 ? Math.min(25, Math.round(rP / 1000)) : Math.min(25, Math.max(1, Math.round(rP)));
      }
      if (Number.isFinite(latP) && Number.isFinite(lonP) && Math.abs(latP) > 1 && Math.abs(lonP) > 1) {
        centerLat = latP;
        centerLon = lonP;
        const mCity = CZECH_CITIES.find((c) => haversineKm(c.lat, c.lon, latP, lonP) < 12);
        if (mCity) selectedCity = mCity;
      }
    } catch {}

    // Seed curated places BEFORE map finishes mounting so list is instant
    places = getInstantCurated(centerLat, centerLon, kinds);

    try {
      const mod = await import('leaflet');
      leaflet = mod.default || mod;
      await tick();

      map = leaflet.map(mapEl, {
        zoomControl: true,
        scrollWheelZoom: true
      });

      setTileLayer('osm');
      moveMapCenter(centerLat, centerLon, 13);
      isLoadingMap = false;

      // Ensure tiles fill container cleanly
      setTimeout(() => map?.invalidateSize(), 120);

      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        moveMapCenter(lat, lng, map.getZoom());
        await fetchNearby(lat, lng);
      });

      await fetchNearby(centerLat, centerLon);
    } catch (err) {
      isLoadingMap = false;
      mapBootError = 'Interaktivní podklad se nepodařilo vykreslit, ale seznam nejbližších ověřených míst níže funguje naplno.';
      await fetchNearby(centerLat, centerLon);
    }

    return () => {
      if (map) {
        map.remove();
        map = null;
      }
    };
  });
</script>

<svelte:head>
  <title>Mapa pomoci v okolí — Akcelerátor altruismu</title>
</svelte:head>

<div class="near-page">
  <!-- =====================================================================
       HERO HEADER
       ===================================================================== -->
  <div class="subpage-hero near-header">
    <div class="hero-top-bar">
      <div class="hero-top-actions">
        <button type="button" class="hero-pill-btn" on:click={copyShareLink}>
          {shareMessage || '🔗 Sdílet výřez mapy'}
        </button>
        <a class="hero-pill-btn accent" href="/submit">+ Přidat místo v okolí</a>
      </div>
    </div>

    <div class="hero-kicker">MAPA POMOCI V OKOLÍ • VŠECH 14 KRAJŮ ČR</div>
    <h1 class="title">Kde můžeš pomoct <span class="serif-accent">kousek od sebe</span></h1>
    <p class="subtitle">
      Útulky, veřejné knihobudky, potravinové banky, šatníky i sousedská centra. U každého místa vidíš <strong>konkrétní tip, jak se zapojit</strong>, i připravenou zprávu na první oslovení.
    </p>

    <!-- 1-CLICK QUICK CITIES + GPS -->
    <div class="quick-cities" aria-label="Rychlý skok do krajského města">
      <button type="button" class="gps-chip" on:click={useGps} disabled={gpsStatus === 'requesting'}>
        {gpsStatus === 'requesting' ? '📍 Hledám tě…' : '📍 Moje poloha'}
      </button>
      {#each CZECH_CITIES as city}
        <button
          type="button"
          class="city-chip"
          class:active={Math.abs(centerLat - city.lat) < 0.05 && Math.abs(centerLon - city.lon) < 0.05}
          on:click={() => selectQuickCity(city)}
        >
          {city.name}
        </button>
      {/each}
    </div>
  </div>

  <!-- =====================================================================
       SEARCH + CATEGORY PRESETS BAR
       ===================================================================== -->
  <div class="controls-card">
    <div class="controls-top">
      <div class="search-box">
        <input
          type="text"
          bind:value={locationQuery}
          placeholder="Zadej libovolnou obec, čtvrť nebo PSČ v ČR (např. Tábor, Kladno, 779 00)…"
          on:keydown={(e) => e.key === 'Enter' && searchLocation()}
        />
        <button type="button" class="btn-find" on:click={searchLocation}>
          {geoStatus === 'loading' ? 'Hledám…' : 'Najít obec'}
        </button>
      </div>

      <div class="radius-box">
        <label for="r-slider">Okruh: <strong>{radiusKm} km</strong></label>
        <input
          id="r-slider"
          type="range"
          min="2"
          max="25"
          step="1"
          bind:value={radiusKm}
          on:change={() => {
            updateRadiusOverlay(centerLat, centerLon);
            fetchNearby(centerLat, centerLon);
          }}
        />
      </div>
    </div>

    {#if gpsMessage}
      <div class="info-note">{gpsMessage}</div>
    {/if}
    {#if geoMessage}
      <div class="info-note">{geoMessage}</div>
    {/if}
    {#if geoResults.length > 0}
      <div class="geo-dropdown">
        {#each geoResults as r}
          <button type="button" class="geo-opt" on:click={() => pickGeocodeResult(r)}>
            <strong>{r.label.split(',')[0]}</strong>
            <span>{r.label}</span>
          </button>
        {/each}
      </div>
    {/if}

    <div class="presets-bar" role="group" aria-label="Co na mapě hledáš">
      {#each CATEGORY_PRESETS as preset}
        <button
          type="button"
          class="preset-pill"
          class:active={activePresetId === preset.id}
          on:click={() => applyPreset(preset)}
        >
          {preset.label}
        </button>
      {/each}
    </div>

    <details class="fine-drawer">
      <summary>Upřesnit vrstvy mapy ({kinds.length}/4 aktivní)</summary>
      <div class="fine-filters">
        <span class="fine-lbl">Zobrazit vrstvy:</span>
        {#each Object.entries(KIND_META) as [k, meta]}
          <button
            type="button"
            class="layer-toggle"
            class:on={kinds.includes(k)}
            on:click={() => toggleKind(k)}
          >
            <span>{meta.emoji}</span>
            <span>{meta.label}</span>
          </button>
        {/each}
      </div>
    </details>
  </div>

  {#if isExpandedToNearest}
    <div class="smart-nearest-banner" role="status">
      <strong>📍 Nejbližší ověřená místa v tvém regionu:</strong> Přímo v okruhu {radiusKm} km nebyla v mapě evidovaná pobočka, proto jsme ti automaticky vyhledali nejbližší ověřená místa v dojezdové vzdálenosti.
    </div>
  {/if}

  <!-- MOBILE VIEW SWITCHER -->
  <div class="mobile-tabs">
    <button type="button" class:active={mobileView === 'both'} on:click={() => setMobileMode('both')}>Mapa + Seznam</button>
    <button type="button" class:active={mobileView === 'map'} on:click={() => setMobileMode('map')}>Jen velká mapa</button>
    <button type="button" class:active={mobileView === 'list'} on:click={() => setMobileMode('list')}>Seznam ({filteredPlaces.length})</button>
  </div>

  <!-- =====================================================================
       SPLIT VIEW: INTERACTIVE LEAFLET MAP + ACTIONABLE CARDS
       ===================================================================== -->
  <div class="split-layout">
    <div class="map-column" class:hidden-mob={mobileView === 'list'}>
      <div class="map-frame">
        {#if isLoadingMap}
          <div class="map-status-pill">Spouštím interaktivní mapu…</div>
        {:else if isFetching}
          <div class="map-status-pill">Aktualizuji místa v okolí…</div>
        {/if}

        <div class="map-floating-tools">
          <button
            type="button"
            class="tile-switch-btn"
            on:click={() => setTileLayer(tileStyle === 'osm' ? 'hot' : 'osm')}
          >
            {tileStyle === 'osm' ? '🌿 Jemný humanitární podklad' : '🗺️ Klasická podrobná mapa'}
          </button>
        </div>

        {#if mapBootError}
          <div class="map-error-box">{mapBootError}</div>
        {/if}

        <div bind:this={mapEl} class="leaflet-canvas"></div>
        <div class="map-foot-hint">
          💡 Tip: Klikni kamkoliv přímo do mapy — střed hledání se okamžitě přesune na vybranou obec či ulici.
        </div>
      </div>
    </div>

    <div class="list-column" class:hidden-mob={mobileView === 'map'}>
      <div class="list-toolbar">
        <div class="count-heading">
          <strong>{filteredPlaces.length}</strong> {filteredPlaces.length === 1 ? 'místo v okolí' : filteredPlaces.length >= 2 && filteredPlaces.length <= 4 ? 'místa v okolí' : 'míst v okolí'}
        </div>
        <div class="list-filters">
          <input
            type="search"
            class="filter-input"
            placeholder="Filtrovat podle názvu…"
            bind:value={query}
          />
          <select bind:value={sortBy} class="sort-select" aria-label="Řazení míst">
            <option value="easy">Nejjednodušší start</option>
            <option value="distance">Podle vzdálenosti</option>
            <option value="name">Abecedně A–Z</option>
          </select>
        </div>
      </div>

      <!-- COMMUNITY TIPS IN THIS REGION -->
      {#if communityItems.length > 0}
        <div class="community-highlight-box">
          <div class="ch-head">
            <span>🌱 Sousedské a komunitní tipy v okolí ({communityItems.length})</span>
            <a href="/submit">+ Přidat další</a>
          </div>
          <div class="ch-list">
            {#each communityItems.slice(0, 3) as ci}
              <div class="ch-item">
                <div class="ch-title-row">
                  <strong>{ci.name}</strong>
                  {#if ci.distance_km != null}
                    <span>{formatDist(ci.distance_km)}</span>
                  {/if}
                </div>
                {#if ci.description}
                  <p>{ci.description}</p>
                {/if}
                <div class="ch-links">
                  {#if ci.website}
                    <a href={normalizeUrl(ci.website)} target="_blank" rel="noopener">Web ↗</a>
                  {/if}
                  {#if typeof ci.lat === 'number' && typeof ci.lon === 'number'}
                    <button type="button" on:click={() => moveMapCenter(ci.lat, ci.lon, 15)}>Ukázat na mapě</button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- PLACES CARDS -->
      <div class="places-stack">
        {#each visiblePlaces as p, idx (p.id)}
          {@const meta = KIND_META[p.kind] || KIND_META.ngo}
          <article
            id={`place-card-${String(p.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`}
            class="place-card"
            class:active={activePlaceId === p.id}
            class:top-pick={idx === 0 && sortBy === 'easy'}
          >
            <div class="pc-badges">
              {#if p.curated}
                <span class="pc-badge verified">✦ Ověřené místo</span>
              {/if}
              <span class="pc-badge kind">{meta.emoji} {p.subcategory || meta.label}</span>
              <span class="pc-badge dist">{formatDist(p.distanceKm)}</span>
            </div>

            <h3 class="pc-title">{p.name}</h3>

            {#if p.address}
              <div class="pc-meta-line">📍 {p.address}</div>
            {/if}
            {#if p.opening_hours}
              <div class="pc-meta-line">🕒 {p.opening_hours}</div>
            {/if}
            {#if p.description}
              <p class="pc-desc">{p.description}</p>
            {/if}

            <!-- CONCRETE HUMAN MICRO-MISSION -->
            <div class="pc-mission">
              <span class="mission-kicker">Jak tu můžeš pomoct:</span>
              <p>{concreteActionHint(p)}</p>
            </div>

            <div class="pc-actions">
              <button type="button" class="pc-btn map-focus" on:click={() => focusPlaceOnMap(p)}>
                📍 Ukázat na mapě
              </button>

              {#if p.website}
                <a
                  href={p.website}
                  target="_blank"
                  rel="noopener"
                  class="pc-btn primary"
                  on:click={() => trackEvent('aa_clickout', { surface: 'near_place', id: p.id })}
                >
                  Otevřít web ↗
                </a>
              {/if}

              <button
                type="button"
                class="pc-btn msg"
                on:click={() => (openTemplateId = openTemplateId === p.id ? null : p.id)}
              >
                {openTemplateId === p.id ? 'Skrýt zprávu' : '💬 Co jim napsat?'}
              </button>

              <button
                type="button"
                class="pc-btn done"
                on:click={() =>
                  recordSmallWin({
                    id: p.id,
                    title: `Místní krok: ${p.name}`,
                    surface: 'near'
                  })}
              >
                ✓ Splněno
              </button>
            </div>

            {#if openTemplateId === p.id}
              {@const tpl = buildFirstContactTemplate(p)}
              <div class="template-drawer">
                <div class="td-head">
                  <strong>Připravená zpráva na první oslovení (stačí zkopírovat):</strong>
                  {#if p.phone}
                    <span>📞 <a href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}>{p.phone}</a></span>
                  {/if}
                </div>
                <pre class="td-body">{tpl.body}</pre>
                <div class="td-btns">
                  <button type="button" class="pc-btn primary" on:click={() => copyTemplateText(p)}>
                    {copiedTemplateId === p.id ? '✓ Zkopírováno do schránky!' : '📋 Zkopírovat text zprávy'}
                  </button>
                  {#if tpl.mailtoUrl}
                    <a href={tpl.mailtoUrl} class="pc-btn msg">✉️ Otevřít v e-mailu ({p.email})</a>
                  {/if}
                  <a
                    href={`https://mapy.cz/zakladni?x=${p.lon}&y=${p.lat}&z=16&q=${encodeURIComponent(p.name)}`}
                    target="_blank"
                    rel="noopener"
                    class="pc-btn map-focus"
                  >
                    🧭 Trasa na Mapy.cz ↗
                  </a>
                </div>
              </div>
            {/if}
          </article>
        {/each}
      </div>

      {#if filteredPlaces.length > visibleCount}
        {@const nextBatch = Math.min(6, filteredPlaces.length - visibleCount)}
        <div class="calm-more-wrap near-more-wrap">
          <button type="button" class="calm-more-btn" on:click={() => (visibleCount += 6)}>
            Ukázat {nextBatch === 1 ? 'další 1 místo' : nextBatch <= 4 ? `další ${nextBatch} místa` : `dalších ${nextBatch} míst`} v okolí ({filteredPlaces.length - visibleCount} zbývá)
          </button>
          {#if filteredPlaces.length - visibleCount > 6}
            <button type="button" class="near-show-all" on:click={() => (visibleCount = filteredPlaces.length)}>
              Rozbalit všechna místa ({filteredPlaces.length})
            </button>
          {/if}
        </div>
      {/if}

      <!-- REGIONAL PORTALS (Tucked calmly so list isn't overwhelming) -->
      <details class="calm-drawer portals-box">
        <summary>Hledáš jednorázovou víkendovku nebo konkrétní inzerát? (4 portály)</summary>
        <div class="portals-mini-grid">
          {#each PORTALS.slice(0, 4) as portal}
            <a href={portal.url} target="_blank" rel="noopener" class="portal-mini">
              <strong>{portal.title} ↗</strong>
              <span>{portal.desc}</span>
            </a>
          {/each}
        </div>
      </details>
    </div>
  </div>
</div>

<style>
  .near-page {
    max-width: 1220px;
    margin: 0 auto;
    padding: 0.75rem 1.25rem 3.5rem;
  }

  .near-header {
    text-align: center;
    padding: 1.9rem 1.75rem;
  }

  .hero-top-bar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  .hero-top-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .hero-pill-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.42rem 0.92rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 82, 56, 0.16);
    background: rgba(255, 255, 255, 0.9);
    color: #123828;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.82rem;
    text-decoration: none;
    cursor: pointer;
    box-shadow: 0 4px 12px -4px rgba(14, 40, 28, 0.08);
    transition: all 0.16s ease;
  }

  .hero-pill-btn:hover {
    background: #ffffff;
    border-color: rgba(5, 150, 105, 0.38);
  }

  .hero-pill-btn.accent {
    background: #123828;
    color: #fde68a;
    border-color: #123828;
    font-weight: 800;
  }

  .hero-pill-btn.accent:hover {
    background: #1c523a;
  }

  .hero-kicker {
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.11em;
    color: #047857;
    margin-bottom: 0.35rem;
  }

  .title {
    font-family: var(--font-sans);
    font-weight: 800;
    color: #0e281c;
    font-size: clamp(1.95rem, 3.5vw, 2.8rem);
    line-height: 1.1;
    margin: 0;
    letter-spacing: -0.03em;
  }

  .title .serif-accent {
    color: #059669;
    font-weight: 400;
  }

  .subtitle {
    color: #365244;
    margin: 0.55rem auto 1.15rem;
    max-width: 62ch;
    font-size: 0.96rem;
    line-height: 1.55;
  }

  .subtitle strong {
    color: #047857;
  }

  .quick-cities {
    display: flex;
    gap: 0.4rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .gps-chip,
  .city-chip {
    padding: 0.38rem 0.76rem;
    border-radius: 999px;
    font-family: var(--font-sans);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .gps-chip {
    background: #059669;
    border: 1px solid #047857;
    color: #ffffff;
    font-weight: 800;
    box-shadow: 0 4px 12px -4px rgba(5, 150, 105, 0.32);
  }

  .city-chip {
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(22, 82, 56, 0.15);
    color: #163a2a;
  }

  .city-chip:hover {
    background: #ffffff;
    border-color: rgba(5, 150, 105, 0.42);
  }

  .city-chip.active {
    background: #123828;
    border-color: #123828;
    color: #fde68a;
    font-weight: 800;
  }

  /* Controls Card */
  .controls-card {
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(22, 66, 48, 0.1);
    border-radius: 24px;
    padding: 1.15rem 1.3rem;
    box-shadow: var(--shadow-md);
    margin-bottom: 1.15rem;
  }

  .controls-top {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    min-width: 260px;
    display: flex;
    gap: 0.5rem;
  }

  .search-box input {
    flex: 1;
    padding: 0.65rem 0.9rem;
    border-radius: 14px;
    border: 1px solid rgba(22, 66, 48, 0.16);
    font-family: var(--font-sans);
    font-size: 0.9rem;
    background: #faf9f5;
  }

  .btn-find {
    padding: 0.65rem 1.1rem;
    border-radius: 14px;
    border: none;
    background: var(--forest-900);
    color: #ffffff;
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: 0.88rem;
    cursor: pointer;
  }

  .radius-box {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-size: 0.86rem;
    color: var(--text-secondary);
  }

  .radius-box input[type='range'] {
    width: 120px;
    accent-color: #059669;
  }

  .info-note {
    margin-top: 0.6rem;
    padding: 0.45rem 0.75rem;
    border-radius: 10px;
    background: #ecfdf5;
    color: #065f46;
    font-size: 0.84rem;
    font-weight: 600;
  }

  .geo-dropdown {
    margin-top: 0.5rem;
    display: grid;
    gap: 0.35rem;
  }

  .geo-opt {
    text-align: left;
    padding: 0.55rem 0.8rem;
    border-radius: 12px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: #ffffff;
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }

  .geo-opt span {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .presets-bar {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
    margin-top: 0.9rem;
  }

  .preset-pill {
    padding: 0.48rem 0.88rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: #f5f3eb;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.84rem;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .preset-pill.active {
    background: var(--forest-900);
    color: #fde68a;
    border-color: var(--forest-900);
  }

  .fine-drawer {
    margin-top: 0.7rem;
  }

  .fine-drawer summary {
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    user-select: none;
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .fine-drawer summary::-webkit-details-marker {
    display: none;
  }

  .fine-drawer summary::after {
    content: '▾';
    font-size: 0.85rem;
  }

  .fine-drawer[open] summary::after {
    transform: rotate(180deg);
  }

  .fine-filters {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.55rem;
    padding-top: 0.55rem;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
  }

  .fine-lbl {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-muted);
    margin-right: 0.25rem;
  }

  .layer-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.28rem 0.65rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: #ffffff;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    opacity: 0.65;
  }

  .layer-toggle.on {
    opacity: 1;
    background: #ecfdf5;
    border-color: rgba(16, 185, 129, 0.38);
    color: #065f46;
  }

  .smart-nearest-banner {
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 16px;
    background: #fefce8;
    border: 1px solid rgba(217, 119, 6, 0.28);
    color: #78350f;
    font-size: 0.88rem;
  }

  .mobile-tabs {
    display: none;
    gap: 0.4rem;
    margin-bottom: 0.85rem;
  }

  .mobile-tabs button {
    flex: 1;
    padding: 0.6rem;
    border-radius: 12px;
    border: 1px solid rgba(22, 66, 48, 0.14);
    background: #ffffff;
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: 0.84rem;
    cursor: pointer;
  }

  .mobile-tabs button.active {
    background: var(--forest-900);
    color: #fde68a;
  }

  /* Split Layout */
  .split-layout {
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 1.15rem;
    align-items: start;
  }

  .map-column {
    position: sticky;
    top: 84px;
  }

  .map-frame {
    position: relative;
    background: #ffffff;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(22, 66, 48, 0.12);
    box-shadow: var(--shadow-lg);
  }

  .leaflet-canvas {
    width: 100%;
    height: 560px;
    background: #e7ece8;
    z-index: 1;
  }

  .map-status-pill {
    position: absolute;
    top: 12px;
    left: 54px;
    z-index: 500;
    padding: 0.36rem 0.8rem;
    border-radius: 999px;
    background: rgba(8, 25, 18, 0.88);
    color: #fde68a;
    font-size: 0.78rem;
    font-weight: 700;
    backdrop-filter: blur(8px);
  }

  .map-floating-tools {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 500;
  }

  .tile-switch-btn {
    padding: 0.38rem 0.75rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.18);
    background: rgba(255, 255, 255, 0.94);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 0.76rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
  }

  .map-foot-hint {
    padding: 0.6rem 0.95rem;
    background: #faf9f5;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .map-error-box {
    padding: 0.75rem 1rem;
    background: #fef2f2;
    color: #991b1b;
    font-size: 0.85rem;
  }

  /* List Column */
  .list-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
    margin-bottom: 0.85rem;
  }

  .count-heading {
    font-size: 1rem;
    color: var(--text-primary);
  }

  .count-heading strong {
    font-size: 1.2rem;
    color: #059669;
  }

  .list-filters {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .filter-input,
  .sort-select {
    padding: 0.48rem 0.75rem;
    border-radius: 12px;
    border: 1px solid rgba(22, 66, 48, 0.14);
    background: #ffffff;
    font-family: var(--font-sans);
    font-size: 0.84rem;
  }

  .community-highlight-box {
    margin-bottom: 1rem;
    padding: 1rem 1.1rem;
    border-radius: 20px;
    background: linear-gradient(145deg, #eaf6ee, #f4faf6);
    border: 1px solid rgba(16, 185, 129, 0.24);
    color: #0e281c;
  }

  .ch-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;
    font-weight: 800;
    color: #047857;
    margin-bottom: 0.6rem;
  }

  .ch-head a {
    color: #059669;
    text-decoration: none;
  }

  .ch-list {
    display: grid;
    gap: 0.5rem;
  }

  .ch-item {
    padding: 0.65rem 0.8rem;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(22, 82, 56, 0.09);
    font-size: 0.84rem;
  }

  .ch-title-row {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .ch-item p {
    margin: 0.25rem 0;
    font-size: 0.8rem;
    color: #365244;
  }

  .ch-links {
    display: flex;
    gap: 0.6rem;
    margin-top: 0.3rem;
  }

  .ch-links a,
  .ch-links button {
    font-size: 0.76rem;
    font-weight: 800;
    color: #047857;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
  }

  /* Place Cards */
  .places-stack {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .place-card {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(22, 66, 48, 0.11);
    border-radius: 22px;
    padding: 1.15rem 1.25rem;
    box-shadow: var(--shadow-sm);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .place-card:hover,
  .place-card.active {
    border-color: rgba(16, 185, 129, 0.45);
    box-shadow: var(--shadow-md);
  }

  .place-card.top-pick {
    border: 1.5px solid #10b981;
    background: linear-gradient(155deg, #ffffff 0%, #ecfdf5 100%);
  }

  .pc-badges {
    display: flex;
    gap: 0.38rem;
    flex-wrap: wrap;
    margin-bottom: 0.4rem;
  }

  .pc-badge {
    font-size: 0.74rem;
    font-weight: 800;
    padding: 0.18rem 0.55rem;
    border-radius: 999px;
    background: #f4f1e8;
    color: var(--text-secondary);
  }

  .pc-badge.verified {
    background: #0d281d;
    color: #fde68a;
  }

  .pc-badge.dist {
    background: #ecfdf5;
    color: #065f46;
  }

  .pc-title {
    margin: 0 0 0.3rem;
    font-size: 1.08rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.28;
  }

  .pc-meta-line {
    font-size: 0.82rem;
    color: var(--text-secondary);
    margin-bottom: 0.2rem;
  }

  .pc-desc {
    margin: 0.35rem 0 0.55rem;
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .pc-mission {
    margin-top: 0.5rem;
    padding: 0.55rem 0.75rem;
    border-radius: 12px;
    background: #f5f3eb;
    border-left: 3px solid #10b981;
  }

  .mission-kicker {
    display: block;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #059669;
    margin-bottom: 0.1rem;
  }

  .pc-mission p {
    margin: 0;
    font-size: 0.83rem;
    line-height: 1.45;
    color: var(--text-primary);
  }

  .pc-actions {
    margin-top: 0.75rem;
    display: flex;
    gap: 0.42rem;
    flex-wrap: wrap;
  }

  .pc-btn {
    padding: 0.5rem 0.8rem;
    border-radius: 11px;
    border: 1px solid rgba(22, 66, 48, 0.14);
    background: #ffffff;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: 0.81rem;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pc-btn.primary {
    background: var(--forest-900);
    border-color: var(--forest-900);
    color: #ffffff;
  }

  .pc-btn.msg {
    background: #fefce8;
    border-color: rgba(217, 119, 6, 0.28);
    color: #92400e;
  }

  .pc-btn.done {
    background: #ecfdf5;
    border-color: rgba(16, 185, 129, 0.35);
    color: #065f46;
  }

  .template-drawer {
    margin-top: 0.75rem;
    padding: 0.85rem;
    border-radius: 14px;
    background: #faf9f5;
    border: 1px solid rgba(22, 66, 48, 0.14);
  }

  .td-head {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.4rem;
    font-size: 0.82rem;
    margin-bottom: 0.45rem;
  }

  .td-body {
    margin: 0 0 0.6rem;
    padding: 0.65rem;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid rgba(22, 66, 48, 0.1);
    font-family: var(--font-sans);
    font-size: 0.82rem;
    line-height: 1.48;
    white-space: pre-wrap;
  }

  .td-btns {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .near-more-wrap {
    margin-top: 0.95rem;
  }

  .near-show-all {
    background: none;
    border: none;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 0.8rem;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .portals-box {
    margin-top: 1.25rem;
  }

  .portals-mini-grid {
    margin-top: 0.85rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }

  .portal-mini {
    padding: 0.7rem 0.85rem;
    border-radius: 14px;
    background: #faf9f5;
    border: 1px solid rgba(22, 66, 48, 0.09);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .portal-mini strong {
    font-size: 0.86rem;
    color: #059669;
  }

  .portal-mini span {
    font-size: 0.78rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  /* Custom Leaflet Pins */
  :global(.aa-map-pin) {
    background: transparent;
    border: none;
  }

  :global(.aa-map-pin .pin-bubble) {
    position: relative;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #ffffff;
    border: 2.5px solid var(--pin-color, #059669);
    box-shadow: 0 6px 16px rgba(6, 21, 15, 0.26);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    transition: transform 0.15s ease;
  }

  :global(.aa-map-pin .pin-bubble.is-curated) {
    background: #fffef7;
    border: 3px solid #059669;
    box-shadow: 0 8px 20px rgba(6, 21, 15, 0.3), 0 0 0 4px rgba(251, 191, 36, 0.55);
  }

  :global(.aa-map-pin .pin-star) {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #f59e0b;
    color: #ffffff;
    font-style: normal;
    font-size: 9px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
  }

  :global(.aa-map-pin:hover .pin-bubble) {
    transform: scale(1.16);
  }

  @media (max-width: 980px) {
    .mobile-tabs {
      display: flex;
    }
    .hidden-mob {
      display: none !important;
    }
    .split-layout {
      grid-template-columns: 1fr;
    }
    .map-column {
      position: static;
    }
    .leaflet-canvas {
      height: 440px;
    }
    .portals-mini-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
