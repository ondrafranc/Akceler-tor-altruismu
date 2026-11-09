<script>
  import { onMount, tick } from 'svelte';
  import { browser } from '$app/environment';
  import { sanitizeHttpUrl as normalizeUrl } from '../../../security.js';

  export let places = [];
  export let centerLat = 50.0755;
  export let centerLon = 14.4378;
  export let activePlaceId = null;
  export let mobileView = 'list';
  export let tileStyle = 'calm';
  export let isLoadingMap = true;
  export let isFetching = false;
  export let pannedCenter = null;
  export let mapBootError = null;
  export let touchGestureHint = false;
  export let activePlaceObj = null;

  export let onSearchArea = null;
  export let onToggleTileStyle = null;
  export let onSelectPlace = null;
  export let onCloseActiveSheet = null;
  export let onFocusInList = null;

  let mapEl = null;
  let leaflet = null;
  let map = null;
  let markersLayer = null;
  let osmTileLayer = null;
  let isProgrammaticMove = false;
  let destroyed = false;
  let resizeTimer = null;
  let touchHintTimer = null;
  const markerById = new Map();

  const KIND_META = {
    ngo: { emoji: '🏛️', label: 'Neziskovka / spolek', color: '#059669' },
    community: { emoji: '🤝', label: 'Komunita / knihobudka', color: '#0d9488' },
    food: { emoji: '🥫', label: 'Potraviny a šatník', color: '#d97706' },
    animals: { emoji: '🐾', label: 'Zvířata a útulek', color: '#2563eb' }
  };

  function formatDist(km) {
    if (!Number.isFinite(km)) return '';
    if (km < 1) return `${Math.max(100, Math.round(km * 10) * 100)} m`;
    return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`;
  }

  function concreteActionHint(p) {
    if (!p) return '';
    if (p.kind === 'animals') return 'Zavolej a zeptej se na venčení pejsků nebo přines konzervy a pamlsky.';
    if (p.kind === 'food') return 'Přines trvanlivé potraviny, drogerii nebo teplé oblečení.';
    return 'Napiš krátkou zprávu koordinátorovi — ozvou se ti s konkrétní potřebou.';
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildPopupHtml(p) {
    const meta = KIND_META[p.kind] || KIND_META.ngo;
    const safeWeb = p.website ? normalizeUrl(p.website) : '';
    const mapyUrl = `https://mapy.cz/zakladni?x=${p.lon}&y=${p.lat}&z=17&q=${encodeURIComponent(p.name)}`;
    return `<div style="font-family:sans-serif;max-width:260px;line-height:1.4;">
      <div style="font-size:11px;font-weight:700;color:${meta.color};margin-bottom:2px;">
        ${meta.emoji} ${escapeHtml(p.subcategory || meta.label)} · ${formatDist(p.distanceKm)}
      </div>
      <strong style="font-size:14px;color:#111827;display:block;margin-bottom:4px;">${escapeHtml(p.name)}</strong>
      ${p.address ? `<div style="font-size:12px;color:#6b7280;margin-bottom:4px;">📍 ${escapeHtml(p.address)}</div>` : ''}
      <div style="margin-top:6px;display:flex;gap:8px;">
        ${safeWeb ? `<a href="${safeWeb}" target="_blank" rel="noopener noreferrer" style="color:#059669;font-weight:700;font-size:12px;">Web ↗</a>` : ''}
        <a href="${mapyUrl}" target="_blank" rel="noopener noreferrer" style="color:#374151;font-size:12px;">Mapy.cz ↗</a>
      </div>
    </div>`;
  }

  function buildPinHtml(p, isHighlighted) {
    const meta = KIND_META[p.kind] || KIND_META.ngo;
    const border = isHighlighted ? '#10b981' : p.curated ? '#047857' : '#9ca3af';
    return `<div class="pin-bubble ${isHighlighted ? 'is-active' : ''}" style="border: 2px solid ${border}; width: 34px; height: 34px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
      <span style="font-size: 16px;">${meta.emoji}</span>
    </div>`;
  }

  function ensureOsmTileLayer() {
    if (!leaflet || !map) return;
    if (osmTileLayer) {
      map.removeLayer(osmTileLayer);
      osmTileLayer = null;
    }
    const tileUrl =
      tileStyle === 'crisp'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const attr =
      tileStyle === 'crisp'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        : '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    osmTileLayer = leaflet.tileLayer(tileUrl, {
      attribution: attr,
      maxZoom: 19
    });
    osmTileLayer.addTo(map);
  }

  function renderMarkers() {
    if (!map || !leaflet) return;
    if (!markersLayer) {
      markersLayer = leaflet.layerGroup().addTo(map);
    }

    const nextSlice = (places || []).slice(0, 160);
    const nextIds = new Set(nextSlice.map((p) => p.id));

    for (const [existingId, existingMarker] of markerById.entries()) {
      if (!nextIds.has(existingId)) {
        markersLayer.removeLayer(existingMarker);
        markerById.delete(existingId);
      }
    }

    for (const p of nextSlice) {
      if (typeof p.lat !== 'number' || typeof p.lon !== 'number') continue;
      const isHighlighted = p.id === activePlaceId;

      if (markerById.has(p.id)) {
        const existing = markerById.get(p.id);
        existing.setPopupContent(buildPopupHtml(p));
        existing.setZIndexOffset(isHighlighted ? 1000 : p.curated ? 300 : 0);
        continue;
      }

      const icon = leaflet.divIcon({
        className: isHighlighted ? 'aa-map-pin is-active' : 'aa-map-pin',
        html: buildPinHtml(p, isHighlighted),
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = leaflet.marker([p.lat, p.lon], {
        icon,
        riseOnHover: true,
        zIndexOffset: isHighlighted ? 1000 : p.curated ? 300 : 0
      });
      markerById.set(p.id, marker);
      marker.bindPopup(buildPopupHtml(p));

      marker.on('click', () => {
        if (onSelectPlace) onSelectPlace(p);
      });

      marker.addTo(markersLayer);
    }
  }

  export function moveMapCenter(lat, lon, zoom = 13) {
    if (!map) return;
    isProgrammaticMove = true;
    map.setView([lat, lon], zoom, { animate: true });
  }

  export function invalidateSize() {
    if (map) map.invalidateSize();
  }

  export function openPopupFor(id) {
    const m = markerById.get(id);
    if (m) m.openPopup();
  }

  onMount(() => {
    if (!browser || typeof window === 'undefined') return;

    let initMap = async () => {
      try {
        const mod = await import('leaflet');
        if (destroyed || !mapEl) return;
        leaflet = mod.default || mod;
        await tick();
        if (destroyed || !mapEl) return;

        map = leaflet.map(mapEl, {
          zoomControl: true,
          scrollWheelZoom: false,
          preferCanvas: true
        });
        map.on('focus', () => map?.scrollWheelZoom?.enable());
        map.on('blur', () => map?.scrollWheelZoom?.disable());

        const onMapTouchStart = (e) => {
          if (!map || mobileView === 'map') return;
          if (e.touches && e.touches.length === 1) {
            map.dragging?.disable();
            touchGestureHint = true;
            if (touchHintTimer) clearTimeout(touchHintTimer);
            touchHintTimer = setTimeout(() => {
              touchGestureHint = false;
            }, 1800);
          } else if (e.touches && e.touches.length >= 2) {
            map.dragging?.enable();
            touchGestureHint = false;
          }
        };
        const onMapTouchEnd = () => {
          map?.dragging?.enable();
        };
        mapEl.addEventListener('touchstart', onMapTouchStart, { passive: true });
        mapEl.addEventListener('touchend', onMapTouchEnd, { passive: true });

        ensureOsmTileLayer();
        moveMapCenter(centerLat, centerLon, 13);
        isLoadingMap = false;

        resizeTimer = setTimeout(() => {
          map?.invalidateSize();
        }, 120);

        map.on('moveend', () => {
          if (!map) return;
          if (isProgrammaticMove) {
            isProgrammaticMove = false;
            return;
          }
          const c = map.getCenter();
          pannedCenter = { lat: c.lat, lon: c.lng };
        });

        renderMarkers();
      } catch (err) {
        mapBootError = 'Nepodařilo se načíst mapový podklad.';
        isLoadingMap = false;
      }
    };

    initMap();

    return () => {
      destroyed = true;
      if (resizeTimer) clearTimeout(resizeTimer);
      if (touchHintTimer) clearTimeout(touchHintTimer);
      if (map) {
        map.remove();
        map = null;
      }
    };
  });

  $: if (map && tileStyle) {
    ensureOsmTileLayer();
  }

  $: if (map && leaflet && (places || activePlaceId)) {
    renderMarkers();
  }
</script>

<div class="map-column" class:hidden-mob={mobileView === 'list'}>
  <div class="map-frame">
    {#if isLoadingMap}
      <div class="map-status-pill">Spouštím mapu…</div>
    {:else if isFetching}
      <div class="map-status-pill">Aktualizuji okolí…</div>
    {/if}

    {#if pannedCenter && !isFetching}
      <button
        type="button"
        class="search-area-btn"
        class:above-sheet={mobileView === 'map' && !!activePlaceObj}
        on:click={onSearchArea}
      >
        🔄 Hledat v této oblasti mapy
      </button>
    {/if}

    <div class="map-floating-tools">
      <button
        type="button"
        class="tile-switch-btn"
        class:active={tileStyle === 'calm'}
        aria-pressed={tileStyle === 'calm'}
        title={tileStyle === 'calm' ? 'Přepnout na kontrastní mapu' : 'Přepnout na jemný podklad'}
        on:click={onToggleTileStyle}
      >
        {tileStyle === 'calm' ? '🌿 Jemný podklad' : '🗺️ Kontrastní mapa'}
      </button>
    </div>

    {#if mapBootError}
      <div class="map-error-box">{mapBootError}</div>
    {/if}

    {#if touchGestureHint}
      <div class="map-gesture-hint" role="status">
        Posuň mapu dvěma prsty ✌️
      </div>
    {/if}

    <div
      bind:this={mapEl}
      class="leaflet-canvas map-canvas"
      class:is-calm-tiles={tileStyle === 'calm'}
      class:is-crisp-tiles={tileStyle === 'crisp'}
      class:map-expanded={mobileView === 'map'}
    ></div>

    {#if mobileView === 'map' && activePlaceObj}
      {@const activeWeb = normalizeUrl(activePlaceObj.website)}
      <div class="map-active-sheet" role="region" aria-label="Vybrané místo na mapě">
        <div class="mas-top">
          <div>
            <span class="mas-meta">
              {activePlaceObj.subcategory || KIND_META[activePlaceObj.kind]?.label} · {formatDist(activePlaceObj.distanceKm)}
            </span>
            <strong class="mas-title">{activePlaceObj.name}</strong>
          </div>
          <button
            type="button"
            class="mas-close"
            aria-label="Zavřít náhled"
            on:click={onCloseActiveSheet}
          >
            ✕
          </button>
        </div>
        <p class="mas-mission">{concreteActionHint(activePlaceObj)}</p>
        <div class="mas-actions">
          {#if activeWeb}
            <a href={activeWeb} target="_blank" rel="noopener noreferrer" class="pc-btn primary">Web ↗</a>
          {:else}
            <a
              href={`https://mapy.cz/zakladni?x=${activePlaceObj.lon}&y=${activePlaceObj.lat}&z=17&q=${encodeURIComponent(activePlaceObj.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              class="pc-btn primary"
            >
              🧭 Mapy.cz ↗
            </a>
          {/if}
          {#if onFocusInList}
            <button
              type="button"
              class="pc-btn ghost"
              on:click={() => onFocusInList(activePlaceObj)}
            >
              📋 Detail v seznamu
            </button>
          {/if}
        </div>
      </div>
    {/if}

    <div class="map-foot-hint">
      <span>★ Ověřená organizace · 🌱 Komunitní tip · 🗺️ Orientační bod OSM</span>
      <span>Posuň mapu kamkoliv po ČR pro hledání v novém výřezu.</span>
    </div>
  </div>
</div>

<style>
  .map-column {
    position: sticky;
    top: 5rem;
    height: calc(100vh - 6.5rem);
    min-height: 440px;
  }

  .map-frame {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 1.25rem;
    overflow: hidden;
    border: 1px solid rgba(16, 185, 129, 0.22);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  }

  .map-canvas {
    width: 100%;
    height: 100%;
  }

  .map-status-pill {
    position: absolute;
    top: 0.85rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.8);
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .search-area-btn {
    position: absolute;
    top: 0.85rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    background: #059669;
    color: #ffffff;
    font-weight: 700;
    font-size: 0.84rem;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);
  }

  .map-floating-tools {
    position: absolute;
    top: 0.85rem;
    right: 0.85rem;
    z-index: 1000;
  }

  .tile-switch-btn {
    appearance: none;
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.12);
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
  }

  .map-error-box {
    position: absolute;
    bottom: 2rem;
    left: 1rem;
    right: 1rem;
    z-index: 1000;
    padding: 0.75rem;
    border-radius: 8px;
    background: #fee2e2;
    color: #991b1b;
    font-size: 0.82rem;
  }

  .map-gesture-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    padding: 0.65rem 1.25rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.85);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .map-active-sheet {
    position: absolute;
    bottom: 2rem;
    left: 1rem;
    right: 1rem;
    z-index: 1000;
    padding: 1rem;
    border-radius: 1rem;
    background: #ffffff;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.25);
  }

  .mas-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.35rem;
  }

  .mas-meta {
    font-size: 0.76rem;
    color: #059669;
    font-weight: 600;
    display: block;
  }

  .mas-title {
    font-size: 1rem;
    color: #111827;
  }

  .mas-close {
    border: none;
    background: none;
    font-size: 1.1rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0.15rem 0.4rem;
  }

  .mas-mission {
    font-size: 0.82rem;
    color: #374151;
    margin: 0.25rem 0 0.65rem 0;
  }

  .mas-actions {
    display: flex;
    gap: 0.5rem;
  }

  .pc-btn {
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.45rem 0.85rem;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    text-decoration: none;
  }

  .pc-btn.primary {
    background: #059669;
    color: #ffffff;
  }

  .pc-btn.ghost {
    background: #f1f5f9;
    color: #334155;
  }

  .map-foot-hint {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 990;
    padding: 0.4rem 0.85rem;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: space-between;
    font-size: 0.68rem;
    color: #6b7280;
  }

  @media (max-width: 860px) {
    .hidden-mob {
      display: none !important;
    }

    .map-column {
      position: relative;
      top: 0;
      height: 480px;
    }
  }
</style>
