<script>
  import { onMount, tick } from 'svelte';
  import 'leaflet/dist/leaflet.css';
  import {
    trackEvent,
    trackFunnel,
    startedActionIds,
    markActionStarted,
    openBrokenLinkReport
  } from '../../lib/analytics.js';
  import {
    PORTALS,
    CZECH_CITIES,
    CURATED_FALLBACK_PLACES,
    buildFirstContactTemplate
  } from '../../lib/data/czech-actions.js';
  import { recordSmallWin } from '../../lib/progress.js';
  import { haversineKm, sanitizeHttpUrl as normalizeUrl, safeText } from '../../lib/security.js';
  import {
    isSoundMuted,
    toggleSoundMuted,
    holdSpark,
    impactCanvas,
    getActionEffectMeta,
    playPayoffAsmr,
    savePendingPartnerReturn,
    consumePendingPartnerReturn,
    fetchAmbientPulse
  } from '../../lib/sensoryEngine.js';

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

  const ALL_KINDS = ['ngo', 'community', 'food', 'animals'];

  const QUICK_TOWNS = [
    ...CZECH_CITIES.map((c) => ({ label: `${c.name}`, lat: c.lat, lon: c.lon })),
    { label: 'Kladno, Středočeský kraj', lat: 50.1473, lon: 14.1028 },
    { label: 'Most, Ústecký kraj', lat: 50.503, lon: 13.6362 },
    { label: 'Opava, Moravskoslezský kraj', lat: 49.9387, lon: 17.9026 },
    { label: 'Frýdek-Místek, Moravskoslezský kraj', lat: 49.6853, lon: 18.3504 },
    { label: 'Havířov, Moravskoslezský kraj', lat: 49.7798, lon: 18.4369 },
    { label: 'Teplice, Ústecký kraj', lat: 50.6404, lon: 13.8245 },
    { label: 'Karviná, Moravskoslezský kraj', lat: 49.854, lon: 18.5417 },
    { label: 'Děčín, Ústecký kraj', lat: 50.7821, lon: 14.2148 },
    { label: 'Chomutov, Ústecký kraj', lat: 50.4605, lon: 13.4178 },
    { label: 'Jablonec nad Nisou, Liberecký kraj', lat: 50.7243, lon: 15.1711 },
    { label: 'Mladá Boleslav, Středočeský kraj', lat: 50.4113, lon: 14.9032 },
    { label: 'Prostějov, Olomoucký kraj', lat: 49.4719, lon: 17.1118 },
    { label: 'Přerov, Olomoucký kraj', lat: 49.4551, lon: 17.4509 },
    { label: 'Tábor, Jihočeský kraj', lat: 49.4144, lon: 14.6578 },
    { label: 'Třebíč, Kraj Vysočina', lat: 49.2149, lon: 15.8817 },
    { label: 'Znojmo, Jihomoravský kraj', lat: 48.8555, lon: 16.0488 },
    { label: 'Kolín, Středočeský kraj', lat: 50.0281, lon: 15.2006 },
    { label: 'Příbram, Středočeský kraj', lat: 49.6899, lon: 14.0104 },
    { label: 'Cheb, Karlovarský kraj', lat: 50.0796, lon: 12.3739 },
    { label: 'Písek, Jihočeský kraj', lat: 49.3088, lon: 14.1475 },
    { label: 'Trutnov, Královéhradecký kraj', lat: 50.561, lon: 15.9127 },
    { label: 'Kroměříž, Zlínský kraj', lat: 49.2979, lon: 17.3931 },
    { label: 'Vsetín, Zlínský kraj', lat: 49.3387, lon: 17.9962 },
    { label: 'Uherské Hradiště, Zlínský kraj', lat: 49.0697, lon: 17.4597 },
    { label: 'Šumperk, Olomoucký kraj', lat: 49.9653, lon: 16.9706 },
    { label: 'Břeclav, Jihomoravský kraj', lat: 48.759, lon: 16.882 },
    { label: 'Hodonín, Jihomoravský kraj', lat: 48.8489, lon: 17.1324 },
    { label: 'Česká Lípa, Liberecký kraj', lat: 50.6855, lon: 14.5376 },
    { label: 'Chrudim, Pardubický kraj', lat: 49.9511, lon: 15.7956 }
  ];

  function normSearchStr(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

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

  function formatDist(km) {
    if (!Number.isFinite(km)) return '';
    if (km < 1) return `${Math.max(100, Math.round(km * 10) * 100)} m`;
    return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  }

  function getInstantCurated(lat, lon, activeKinds = ALL_KINDS) {
    const kList = activeKinds?.length ? activeKinds : ALL_KINDS;
    const allWithDist = CURATED_FALLBACK_PLACES.filter((p) => kList.includes(p.kind))
      .map((p) => {
        const d = haversineKm(lat, lon, p.lat, p.lon);
        return {
          ...p,
          curated: true,
          sourceType: 'verified_org',
          verifiedAt: p.verifiedAt || '11/2026',
          website: normalizeUrl(p.website),
          distanceKm: Math.round(d * 10) / 10
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const near = allWithDist.filter((p) => p.distanceKm <= Math.max(radiusKm, 15));
    return near.length >= 3 ? near : allWithDist.slice(0, 6);
  }

  // Geocode & GPS
  let locationQuery = '';
  let geoStatus = 'idle';
  let geoMessage = '';
  /** @type {Array<{label: string, lat: number, lon: number}>} */
  let geoResults = [];
  let gpsStatus = 'idle';
  let gpsMessage = '';
  let shareMessage = '';

  $: instantTownSuggestions = (() => {
    const q = normSearchStr(locationQuery);
    if (q.length < 2 || geoResults.length > 0) return [];
    return QUICK_TOWNS.filter((t) => {
      const n = normSearchStr(t.label);
      return n.includes(q) && n.split(',')[0] !== q;
    }).slice(0, 5);
  })();

  // Map state
  let mapEl;
  let map = null;
  let leaflet = null;
  let tileLayer = null;
  let tileStyle = 'osm'; // 'osm' | 'voyager'
  let markersLayer = null;
  let userMarker = null;
  let radiusCircle = null;
  /** @type {Map<string, any>} */
  let markerById = new Map();
  /** @type {{ lat: number, lon: number } | null} */
  let pannedCenter = null;
  /** @type {AbortController | null} */
  let nearbyAbortController = null;

  let isLoadingMap = true;
  let mapBootError = '';
  let isFetching = false;
  let isFallbackData = false;
  let isExpandedToNearest = false;

  /**
   * Seed verified places immediately at initialization (including SSR)
   * so the user never sees "0 míst v okolí" on first load.
   * @type {Array<any>}
   */
  let places = getInstantCurated(centerLat, centerLon, kinds);
  /** @type {Array<any>} */
  let communityItems = [];
  let activePlaceId = null;
  let visibleCount = 3;
  let mobileView = 'both'; // 'both' | 'list' | 'map'

  // First-contact template
  let openTemplateId = null;
  let copiedTemplateId = null;
  let copiedPlaceLinkId = null;
  let soundMuted = false;
  let activeEffectPlaceId = null;
  let placeEffectMetric = 0;
  let nearReturnPlace = null;
  let nearReturnMetric = 0;
  let awaitingNearPlace = null;
  let nearLeaveTimestamp = 0;
  let ambientPulseText = 'Před chvílí někdo v Brně naplnil misku v útulku';

  function toPlaceAction(p) {
    if (!p) return null;
    return {
      id: p.id,
      title: p.name || 'Místo pomoci',
      category: p.kind || 'ngo',
      subcategory: p.subcategory || ''
    };
  }

  function handleToggleSound() {
    soundMuted = toggleSoundMuted();
    trackEvent('aa_sound_toggle', { surface: 'near', muted: soundMuted });
  }

  function togglePlaceEffect(p) {
    if (activeEffectPlaceId === p.id) {
      activeEffectPlaceId = null;
      return;
    }
    placeEffectMetric = 0;
    activeEffectPlaceId = p.id;
    playPayoffAsmr(toPlaceAction(p));
    trackEvent('aa_effect_preview_toggle', { surface: 'near', id: p.id });
  }

  function handleStartNearPlace(p) {
    const act = toPlaceAction(p);
    awaitingNearPlace = act;
    nearLeaveTimestamp = Date.now();
    nearReturnPlace = null;
    savePendingPartnerReturn(act, 'near');
    markActionStarted(p.id, 'near_place');
    trackEvent('aa_clickout', { surface: 'near_place', id: p.id });
  }

  $: nearestVerifiedOrgs = CURATED_FALLBACK_PLACES.map((p) => ({
    ...p,
    curated: true,
    verifiedAt: p.verifiedAt || '11/2026',
    website: normalizeUrl(p.website),
    distanceKm: Math.round(haversineKm(centerLat, centerLon, p.lat, p.lon) * 10) / 10
  }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

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
  $: allOutsideRadius =
    filteredPlaces.length > 0 &&
    filteredPlaces.every((p) => (p.distanceKm ?? 0) > radiusKm);

  function setTileLayer(style) {
    if (!map || !leaflet) return;
    tileStyle = style;
    if (tileLayer) tileLayer.remove();

    const isVoyager = style === 'voyager';
    const url = isVoyager
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = isVoyager
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; OpenStreetMap přispěvatelé';

    tileLayer = leaflet.tileLayer(url, {
      maxZoom: 19,
      subdomains: isVoyager ? 'abcd' : ['a', 'b', 'c'],
      keepBuffer: 4,
      updateWhenZooming: false,
      updateWhenIdle: false,
      attribution
    });

    if (isVoyager) {
      let tileErrors = 0;
      tileLayer.on('tileerror', () => {
        tileErrors += 1;
        if (tileErrors >= 3 && tileStyle === 'voyager') {
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
    pannedCenter = null;
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
    if (!markersLayer) {
      markersLayer = leaflet.layerGroup().addTo(map);
    }

    const nextSlice = filteredPlaces.slice(0, 160);
    const nextIds = new Set(nextSlice.map((p) => p.id));

    // Remove only markers that are no longer in filteredPlaces (zero DOM flicker for existing pins!)
    for (const [existingId, existingMarker] of markerById.entries()) {
      if (!nextIds.has(existingId)) {
        markersLayer.removeLayer(existingMarker);
        markerById.delete(existingId);
      }
    }

    for (const p of nextSlice) {
      if (typeof p.lat !== 'number' || typeof p.lon !== 'number') continue;
      if (markerById.has(p.id)) continue;

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

      const safeWeb = normalizeUrl(p.website);
      const webHtml = safeWeb
        ? `<a href="${escapeHtml(safeWeb)}" target="_blank" rel="noopener noreferrer" style="font-weight:800;color:#059669;">Otevřít web ↗</a>`
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

  function mergeCuratedAndApiPlaces(curatedList, apiList) {
    const localCurated = curatedList.filter((c) => (c.distanceKm ?? 999) <= Math.max(radiusKm, 15));
    const seedCurated =
      localCurated.length > 0 || apiList.filter((a) => !!a.website).length >= 2
        ? localCurated
        : curatedList.slice(0, 3);
    const out = [...seedCurated];
    const seenIds = new Set(out.map((c) => c.id));
    const seenNames = new Set(out.map((c) => String(c.name || '').trim().toLowerCase()));

    for (const item of apiList) {
      const normName = String(item.name || '').trim().toLowerCase();
      if (seenIds.has(item.id) || (normName && seenNames.has(normName))) continue;
      const isNearDuplicate = out.some(
        (c) => haversineKm(c.lat, c.lon, item.lat, item.lon) < 0.15 && c.kind === item.kind
      );
      if (isNearDuplicate) continue;
      seenIds.add(item.id);
      if (normName) seenNames.add(normName);
      out.push({
        ...item,
        sourceType: item.curated ? 'verified_org' : 'osm',
        verifiedAt: item.curated ? item.verifiedAt || '11/2026' : null
      });
    }
    return out;
  }

  async function fetchNearby(lat, lon) {
    if (nearbyAbortController) {
      nearbyAbortController.abort();
    }
    const controller = new AbortController();
    nearbyAbortController = controller;

    isFetching = true;
    pannedCenter = null;
    // Always seed all 4 kinds so switching category pills is 0ms in-memory!
    const curatedInstant = getInstantCurated(lat, lon, ALL_KINDS);
    places = curatedInstant;
    syncUrlState(lat, lon);

    const qLat = Number(lat).toFixed(2);
    const qLon = Number(lon).toFixed(2);

    const communityPromise = fetch(
      `/api/community-nearby?lat=${encodeURIComponent(qLat)}&lon=${encodeURIComponent(qLon)}&radius_m=${encodeURIComponent(radiusKm * 1000)}`,
      { signal: controller.signal }
    )
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (!controller.signal.aborted) {
          communityItems = Array.isArray(d?.items) ? d.items : [];
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) communityItems = [];
      });

    try {
      const resp = await fetch(
        `/api/nearby?lat=${encodeURIComponent(qLat)}&lon=${encodeURIComponent(qLon)}&radius_m=${encodeURIComponent(
          radiusKm * 1000
        )}&kinds=${encodeURIComponent(ALL_KINDS.join(','))}&include_associations=${includeAssociations ? '1' : '0'}`,
        { signal: controller.signal }
      );
      if (resp.ok && !controller.signal.aborted) {
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
          places = mergeCuratedAndApiPlaces(curatedInstant, apiPlaces);
        }
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        isFallbackData = true;
      }
    } finally {
      await communityPromise;
      if (!controller.signal.aborted) {
        visibleCount = 3;
        isFetching = false;
      }
    }
  }

  function syncUrlState(lat, lon) {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lat', String(Math.round(lat * 100) / 100));
      url.searchParams.set('lon', String(Math.round(lon * 100) / 100));
      url.searchParams.set('r', String(radiusKm));
      url.searchParams.set('kinds', kinds.join(','));
      history.replaceState({}, '', url.toString());
    } catch {}
  }

  async function selectQuickCity(city) {
    selectedCity = city;
    query = '';
    locationQuery = '';
    geoResults = [];
    geoMessage = '';
    moveMapCenter(city.lat, city.lon, 13);
    await fetchNearby(city.lat, city.lon);
    trackEvent('aa_near_city_pick', { city: city.id });
    trackFunnel('intent_selected', { surface: 'near_city', city: city.id });
  }

  function applyPreset(preset) {
    // 0ms instant in-memory filter — no network call or map wipe needed!
    activePresetId = preset.id;
    query = '';
    kinds = [...preset.kinds];
    onlyWithWebsite = !!preset.onlyWeb;
    visibleCount = 3;
    syncUrlState(centerLat, centerLon);
    trackFunnel('intent_selected', { surface: 'near_preset', preset: preset.id });
  }

  function toggleKind(k) {
    // 0ms instant in-memory filter
    if (kinds.includes(k)) {
      if (kinds.length > 1) kinds = kinds.filter((x) => x !== k);
    } else {
      kinds = [...kinds, k];
    }
    query = '';
    activePresetId = 'custom';
    visibleCount = 3;
    syncUrlState(centerLat, centerLon);
  }

  async function searchPannedArea() {
    if (!pannedCenter) return;
    const { lat, lon } = pannedCenter;
    pannedCenter = null;
    query = '';
    moveMapCenter(lat, lon, map ? map.getZoom() : 13);
    await fetchNearby(lat, lon);
    trackEvent('aa_near_pan_search', { lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 });
  }

  function resetAndExpandSearch() {
    query = '';
    onlyWithWebsite = false;
    activePresetId = 'all';
    kinds = ['ngo', 'community', 'food', 'animals'];
    radiusKm = Math.max(radiusKm, 15);
    updateRadiusOverlay(centerLat, centerLon);
    fetchNearby(centerLat, centerLon);
  }

  async function searchLocation() {
    const q = safeText(locationQuery);
    if (q.length < 2) {
      geoStatus = 'error';
      geoMessage = 'Zadej aspoň 2 znaky (obec, město nebo PSČ).';
      return;
    }
    // Check instant local match first if user presses Enter on a known city name
    const exactLocal = QUICK_TOWNS.find((t) => normSearchStr(t.label.split(',')[0]) === normSearchStr(q));
    if (exactLocal) {
      await pickGeocodeResult(exactLocal);
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
        geoMessage = 'Místo jsme nenašli – zkus název okresu nebo posuň mapu.';
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
      geoMessage = 'Vyhledávání teď neodpovídá – vyber prosím město nahoře nebo posuň mapu.';
    }
  }

  async function pickGeocodeResult(r) {
    if (!r || typeof r.lat !== 'number' || typeof r.lon !== 'number') return;
    query = '';
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
        query = '';
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

  async function sharePlaceLink(p) {
    if (!p || typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/near?place=${encodeURIComponent(p.id)}&lat=${encodeURIComponent(Number(p.lat || centerLat).toFixed(4))}&lon=${encodeURIComponent(Number(p.lon || centerLon).toFixed(4))}`;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        ok = true;
      }
    } catch {}
    if (!ok && navigator.share) {
      try {
        await navigator.share({ title: p.name, url: shareUrl });
        ok = true;
      } catch {}
    }
    copiedPlaceLinkId = p.id;
    setTimeout(() => {
      if (copiedPlaceLinkId === p.id) copiedPlaceLinkId = null;
    }, 2600);
    trackEvent('aa_share_direct_action', { surface: 'near', id: p.id });
  }

  async function setMobileMode(mode) {
    mobileView = mode;
    await tick();
    if (map && mode !== 'list') {
      map.invalidateSize();
    }
  }

  onMount(() => {
    let destroyed = false;
    let resizeTimer = null;
    soundMuted = isSoundMuted();

    const checkNearReturn = () => {
      if (nearReturnPlace) return;
      const elapsedMem = awaitingNearPlace ? Date.now() - nearLeaveTimestamp : 0;
      const persisted = consumePendingPartnerReturn(3000);
      if (elapsedMem >= 3000 || persisted) {
        if (awaitingNearPlace && !persisted) {
          consumePendingPartnerReturn(0);
        }
        const targetId = persisted?.id || awaitingNearPlace?.id;
        const foundPlace = places.find((pl) => pl.id === targetId);
        const resolved = foundPlace
          ? toPlaceAction(foundPlace)
          : awaitingNearPlace || (persisted ? { id: persisted.id, title: persisted.title || 'Místo pomoci', category: persisted.category || 'ngo' } : null);
        if (resolved) {
          nearReturnPlace = resolved;
          nearReturnMetric = 0;
          awaitingNearPlace = null;
          playPayoffAsmr(resolved);
          trackEvent('aa_partner_return_prompt', { surface: 'near', id: resolved.id });
        }
      }
    };

    const onVis = () => {
      if (document.visibilityState === 'visible') checkNearReturn();
    };
    checkNearReturn();

    const pulseTimer = setTimeout(async () => {
      const pulse = await fetchAmbientPulse();
      if (pulse?.message) ambientPulseText = pulse.message;
    }, 300);

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', checkNearReturn);
    window.addEventListener('pageshow', checkNearReturn);

    (async () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const placeP = sp.get('place');
        if (placeP) {
          activePlaceId = placeP;
          const curatedMatch = CURATED_FALLBACK_PLACES.find((c) => c.id === placeP);
          if (curatedMatch) {
            centerLat = curatedMatch.lat;
            centerLon = curatedMatch.lon;
          }
        }
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
        if (Number.isFinite(latP) && Number.isFinite(lonP) && Math.abs(latP) <= 90 && Math.abs(lonP) <= 180 && Math.abs(latP) > 1 && Math.abs(lonP) > 1) {
          centerLat = latP;
          centerLon = lonP;
          const mCity = CZECH_CITIES.find((c) => haversineKm(c.lat, c.lon, latP, lonP) < 12);
          if (mCity) selectedCity = mCity;
        }
      } catch {}

      // Seed curated places BEFORE map finishes mounting so list is instant
      places = getInstantCurated(centerLat, centerLon, ALL_KINDS);

      try {
        const mod = await import('leaflet');
        if (destroyed || !mapEl) return;
        leaflet = mod.default || mod;
        await tick();
        if (destroyed || !mapEl) return;

        map = leaflet.map(mapEl, {
          zoomControl: true,
          scrollWheelZoom: true,
          preferCanvas: true
        });

        setTileLayer('osm');
        moveMapCenter(centerLat, centerLon, 13);
        isLoadingMap = false;

        // Ensure tiles fill container cleanly
        resizeTimer = setTimeout(() => map?.invalidateSize(), 120);

        map.on('moveend', () => {
          if (!map) return;
          const c = map.getCenter();
          const distFromActive = haversineKm(centerLat, centerLon, c.lat, c.lng);
          if (distFromActive >= 1.8) {
            pannedCenter = { lat: c.lat, lon: c.lng };
          } else {
            pannedCenter = null;
          }
        });

        await fetchNearby(centerLat, centerLon);
      } catch {
        if (destroyed) return;
        isLoadingMap = false;
        mapBootError = 'Interaktivní podklad se nepodařilo vykreslit, ale seznam nejbližších ověřených míst níže funguje naplno.';
        await fetchNearby(centerLat, centerLon);
      }
    })();

    return () => {
      destroyed = true;
      clearTimeout(pulseTimer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', checkNearReturn);
      window.removeEventListener('pageshow', checkNearReturn);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (nearbyAbortController) nearbyAbortController.abort();
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
  <header class="subpage-hero near-header">
    <div class="hero-kicker">MAPA POMOCI V OKOLÍ · CELÁ ČR</div>
    <h1 class="title">Kde můžeš pomoct <span class="serif-accent">kousek od sebe</span></h1>
    <p class="subtitle">
      Útulky, veřejné knihobudky, potravinové banky a sousedská místa — i s připravenou zprávou na první oslovení.
    </p>
  </header>

  <!-- UNIFIED SEARCH + FILTER BAR -->
  <div class="controls-card">
    <div class="controls-top">
      <button type="button" class="gps-btn" on:click={useGps} disabled={gpsStatus === 'requesting'}>
        {gpsStatus === 'requesting' ? '📍 Hledám…' : '📍 Moje poloha'}
      </button>

      <div class="search-box">
        <input
          type="text"
          bind:value={locationQuery}
          placeholder="Obec, město nebo PSČ (např. Tábor, Kladno, 779 00)…"
          aria-label="Hledat obec nebo PSČ"
          on:keydown={(e) => e.key === 'Enter' && searchLocation()}
        />
        <button type="button" class="btn-find" on:click={searchLocation}>
          {geoStatus === 'loading' ? 'Hledám…' : 'Najít'}
        </button>
      </div>

      <select
        class="city-jump-select"
        aria-label="Rychlý skok do krajského města"
        on:change={(e) => {
          const found = CZECH_CITIES.find((c) => c.id === e.currentTarget.value);
          if (found) selectQuickCity(found);
        }}
      >
        <option value="">Krajská města…</option>
        {#each CZECH_CITIES as city}
          <option value={city.id} selected={Math.abs(centerLat - city.lat) < 0.05 && Math.abs(centerLon - city.lon) < 0.05}>
            {city.name}
          </option>
        {/each}
      </select>

      <div class="radius-box">
        <label for="r-slider">Okruh <strong>{radiusKm} km</strong></label>
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
    {#if instantTownSuggestions.length > 0}
      <div class="geo-dropdown" role="listbox" aria-label="Rychlý výběr města">
        {#each instantTownSuggestions as t}
          <button type="button" class="geo-opt" on:click={() => pickGeocodeResult(t)}>
            <strong>📍 {t.label.split(',')[0]}</strong>
            <span>{t.label} · okamžitý přesun</span>
          </button>
        {/each}
      </div>
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

    <div class="controls-bottom">
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

      <div class="controls-links">
        <button type="button" class="text-util-btn" on:click={copyShareLink}>
          {shareMessage || '🔗 Sdílet výřez'}
        </button>
        <a href="/submit" class="text-util-link">+ Přidat místo</a>
      </div>
    </div>
  </div>

  {#if isExpandedToNearest || allOutsideRadius}
    <div class="smart-nearest-banner" role="status">
      📍 Přímo v okruhu {radiusKm} km nebyla evidovaná pobočka — ukazujeme nejbližší ověřená místa v tvém regionu.
    </div>
  {/if}

  <!-- MOBILE VIEW SWITCHER -->
  <div class="mobile-tabs" role="tablist" aria-label="Přepnout zobrazení seznamu a mapy">
    <button
      type="button"
      class:active={mobileView === 'both' || mobileView === 'list'}
      on:click={() => setMobileMode('both')}
    >
      📋 Seznam ({filteredPlaces.length})
    </button>
    <button
      type="button"
      class:active={mobileView === 'map'}
      on:click={() => setMobileMode('map')}
    >
      🗺️ Mapa
    </button>
  </div>

  <!-- SPLIT VIEW: INTERACTIVE LEAFLET MAP + CLEAN ACTIONABLE CARDS -->
  <div class="split-layout">
    <div class="map-column" class:hidden-mob={mobileView === 'list'}>
      <div class="map-frame">
        {#if isLoadingMap}
          <div class="map-status-pill">Spouštím mapu…</div>
        {:else if isFetching}
          <div class="map-status-pill">Aktualizuji okolí…</div>
        {/if}

        {#if pannedCenter && !isFetching}
          <button type="button" class="search-area-btn" on:click={searchPannedArea}>
            🔄 Hledat v této oblasti mapy
          </button>
        {/if}

        <div class="map-floating-tools">
          <button
            type="button"
            class="tile-switch-btn"
            on:click={() => setTileLayer(tileStyle === 'voyager' ? 'osm' : 'voyager')}
          >
            {tileStyle === 'voyager' ? '🗺️ Klasická mapa' : '🌿 Jemný podklad'}
          </button>
        </div>

        {#if mapBootError}
          <div class="map-error-box">{mapBootError}</div>
        {/if}

        <div bind:this={mapEl} class="leaflet-canvas" class:map-expanded={mobileView === 'map'}></div>
        <div class="map-foot-hint">
          Posuň mapu kamkoliv po Česku a klikni na „Hledat v této oblasti mapy“.
        </div>
      </div>
    </div>

    <div class="list-column" class:hidden-mob={mobileView === 'map'}>
      <div class="list-toolbar">
        <div class="count-heading">
          <strong>{filteredPlaces.length}</strong> {filteredPlaces.length === 1 ? 'místo v okolí' : filteredPlaces.length >= 2 && filteredPlaces.length <= 4 ? 'místa v okolí' : 'míst v okolí'}
        </div>
        <div class="list-filters">
          {#if places.length > 3 || query.trim().length > 0}
            <input
              type="search"
              class="filter-input"
              placeholder="Hledat v seznamu…"
              bind:value={query}
            />
          {/if}
          <select bind:value={sortBy} class="sort-select" aria-label="Řazení míst">
            <option value="easy">Nejjednodušší start</option>
            <option value="distance">Podle vzdálenosti</option>
            <option value="name">Abecedně A–Z</option>
          </select>
        </div>
      </div>

      {#if nearReturnPlace}
        <div
          class="return-dopamine-strip"
          role="status"
          aria-live="polite"
          data-scene={getActionEffectMeta(nearReturnPlace, nearReturnMetric).scene}
        >
          <div class="return-dopamine-head">
            <span class="return-dopamine-title">
              ✨ Vítej zpět z místa {nearReturnPlace.title}! Povedlo se?
            </span>
            <span class="impact-payoff-badge">
              {getActionEffectMeta(nearReturnPlace, nearReturnMetric, { isReturnStrip: true }).badge}
            </span>
          </div>
          <canvas
            class="impact-payoff-canvas"
            width="300"
            height="92"
            aria-label="Fyzikální vizualizace dopadu dobrého skutku"
            use:impactCanvas={{
              action: nearReturnPlace,
              onProgress: (v) => {
                nearReturnMetric = v;
              }
            }}
          ></canvas>
          <div class="return-dopamine-actions">
            <button
              type="button"
              class="btn-return-complete"
              on:click={() => {
                const done = nearReturnPlace;
                nearReturnPlace = null;
                recordSmallWin({
                  id: done.id,
                  title: `Místní krok: ${done.title}`,
                  category: done.category,
                  surface: 'near'
                });
              }}
            >
              ✓ Hotovo – rozsvítit stopu
            </button>
            <button
              type="button"
              class="btn-return-dismiss"
              on:click={() => (nearReturnPlace = null)}
            >
              Později
            </button>
          </div>
        </div>
      {/if}

      <!-- PLACES CARDS (CLEAN, ZERO BOX-IN-BOX) -->
      <div class="places-stack places-grid">
        {#each visiblePlaces as p, idx (p.id)}
          {@const meta = KIND_META[p.kind] || KIND_META.ngo}
          {@const webUrl = normalizeUrl(p.website)}
          <article
            id={`place-card-${String(p.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`}
            class="place-card"
            class:active={activePlaceId === p.id}
            class:top-pick={idx === 0 && sortBy === 'easy'}
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
                <span class="pc-community-badge">🌱 Komunitní tip</span>
              {:else}
                <span class="pc-osm-badge" title="Veřejný komunitní bod z OpenStreetMap">
                  🗺️ Komunitní bod (OSM)
                </span>
              {/if}
            </div>

            <h3 class="pc-title">{p.name}</h3>

            {#if p.address}
              <div class="pc-addr">📍 {p.address}</div>
            {/if}

            <p class="pc-desc">{p.quickMission || p.description || concreteActionHint(p)}</p>

            <div class="pc-actions">
              {#if webUrl}
                <a
                  href={webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="pc-btn primary"
                  use:holdSpark={{ id: p.id, surface: 'near_place' }}
                  on:click={() => handleStartNearPlace(p)}
                >
                  Web ↗
                </a>
              {/if}

              <button
                type="button"
                class="pc-btn msg"
                on:click={() => {
                  markActionStarted(p.id, 'near_place_msg');
                  openTemplateId = openTemplateId === p.id ? null : p.id;
                }}
              >
                {openTemplateId === p.id ? 'Skrýt zprávu' : '💬 Co napsat'}
              </button>

              <button type="button" class="pc-btn ghost" on:click={() => focusPlaceOnMap(p)}>
                📍 Na mapě
              </button>

              <button
                type="button"
                class="pc-btn ghost effect-spark-btn"
                class:active={activeEffectPlaceId === p.id}
                aria-pressed={activeEffectPlaceId === p.id}
                aria-label="Vyzkoušet interaktivní fyzikální a zvukový efekt místa"
                title="Vyzkoušet interaktivní fyzikální a zvukový efekt místa"
                on:click={() => togglePlaceEffect(p)}
              >
                ✨
              </button>

              <button
                type="button"
                class="pc-btn done"
                class:initiated={Array.isArray($startedActionIds) && $startedActionIds.includes(p.id)}
                on:click={() =>
                  recordSmallWin({
                    id: p.id,
                    title: `Místní krok: ${p.name}`,
                    category: p.kind,
                    surface: 'near'
                  })}
              >
                {Array.isArray($startedActionIds) && $startedActionIds.includes(p.id) ? '✓ Dokončeno' : '✓ Hotovo'}
              </button>
            </div>

            {#if activeEffectPlaceId === p.id}
              {@const placeAction = toPlaceAction(p)}
              <div
                class="card-effect-stage"
                data-scene={getActionEffectMeta(placeAction, placeEffectMetric).scene}
              >
                <div class="card-effect-head">
                  <span class="impact-payoff-badge">
                    {getActionEffectMeta(placeAction, placeEffectMetric).badge}
                  </span>
                  <span class="card-effect-hint">Klepni do plátna pro interakci</span>
                </div>
                <canvas
                  class="impact-payoff-canvas"
                  width="300"
                  height="92"
                  aria-label="Fyzikální vizualizace dopadu dobrého skutku"
                  use:impactCanvas={{
                    action: placeAction,
                    onProgress: (v) => {
                      placeEffectMetric = v;
                    }
                  }}
                ></canvas>
              </div>
            {/if}

            {#if openTemplateId === p.id}
              {@const tpl = buildFirstContactTemplate(p)}
              <div class="template-drawer">
                <div class="td-head">
                  <strong>Vzor krátké zprávy:</strong>
                  {#if p.phone}
                    <span>📞 <a href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}>{p.phone}</a></span>
                  {/if}
                </div>
                <pre class="td-body">{tpl.body}</pre>
                <div class="td-btns">
                  <button type="button" class="pc-btn primary" on:click={() => copyTemplateText(p)}>
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
                {p.curated ? `Zdroj: Ověřený katalog (${p.verifiedAt || '11/2026'})` : 'Zdroj: OpenStreetMap ČR'}
              </span>
              <span class="pc-footer-links">
                <button
                  type="button"
                  class="pc-report-btn pc-share-btn"
                  on:click={() => sharePlaceLink(p)}
                >
                  {copiedPlaceLinkId === p.id ? '✓ Odkaz zkopírován' : '🔗 Sdílet místo'}
                </button>
                ·
                <button
                  type="button"
                  class="pc-report-btn"
                  on:click={() =>
                    openBrokenLinkReport({
                      id: p.id,
                      title: p.name,
                      org: p.subcategory || 'Místo na mapě',
                      url: webUrl || ''
                    })}
                >
                  Nahlásit nefunkční údaj
                </button>
              </span>
            </div>
          </article>
        {:else}
          <div class="near-empty-fallback">
            <h3>V okruhu {radiusKm} km teď neodpovídá žádné místo zvolenému filtru</h3>
            <p>
              {#if query.trim()}
                Hledaný výraz <strong>„{query.trim()}“</strong> v aktuálním výřezu nenašel shodu.
              {:else if onlyWithWebsite}
                V tomto okruhu jsou především komunitní místa bez vlastního webu (např. veřejné knihobudky).
              {:else}
                V menších obcích nemusí být organizace zanesená přímo v OpenStreetMap v okruhu {radiusKm} km.
              {/if}
            </p>
            <div class="near-empty-actions">
              <button type="button" class="pc-btn primary" on:click={resetAndExpandSearch}>
                Rozšířit okruh na 15 km a zrušit filtry
              </button>
              <a href="/app/online" class="pc-btn ghost">
                Zkusit 2minutový skutek online →
              </a>
            </div>

            {#if nearestVerifiedOrgs.length > 0}
              <div class="nearest-verified-box">
                <span class="nv-label">Nejbližší ověřené organizace v regionu:</span>
                <div class="nv-list">
                  {#each nearestVerifiedOrgs as org}
                    <div class="nv-item">
                      <div>
                        <strong>{org.name}</strong>
                        <span class="nv-meta"> · {formatDist(org.distanceKm)} · Ověřeno {org.verifiedAt}</span>
                      </div>
                      <button
                        type="button"
                        class="nv-jump-btn"
                        on:click={() => {
                          query = '';
                          onlyWithWebsite = false;
                          kinds = ['ngo', 'community', 'food', 'animals'];
                          moveMapCenter(org.lat, org.lon, 13);
                          fetchNearby(org.lat, org.lon);
                        }}
                      >
                        Přejít sem →
                      </button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="near-pulse-wrap">
        <div class="ambient-pulse-pill" role="status" aria-live="off">
          <span class="pulse-dot-live" aria-hidden="true"></span>
          <span class="pulse-msg-text">{ambientPulseText}</span>
        </div>
        <button
          type="button"
          class="sound-mute-btn near-sound-btn"
          on:click={handleToggleSound}
          aria-pressed={soundMuted}
          aria-label={soundMuted ? 'Zapnout jemné zvuky' : 'Ztlumit zvuky'}
          title={soundMuted ? 'Zapnout jemné zvuky' : 'Ztlumit zvuky'}
        >
          {soundMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {#if filteredPlaces.length > visibleCount}
        {@const nextBatch = Math.min(6, filteredPlaces.length - visibleCount)}
        <div class="calm-more-wrap near-more-wrap">
          <button type="button" class="calm-more-btn" on:click={() => (visibleCount += 6)}>
            Ukázat {nextBatch === 1 ? 'další 1 místo' : nextBatch <= 4 ? `další ${nextBatch} místa` : `dalších ${nextBatch} míst`} ({filteredPlaces.length - visibleCount} zbývá)
          </button>
          {#if filteredPlaces.length - visibleCount > 6}
            <button type="button" class="near-show-all" on:click={() => (visibleCount = filteredPlaces.length)}>
              Rozbalit všechna místa ({filteredPlaces.length})
            </button>
          {/if}
        </div>
      {/if}

      <!-- COMMUNITY TIPS TUCKED CALMLY -->
      {#if communityItems.length > 0}
        <details class="calm-drawer extra-drawer">
          <summary>🌱 Sousedské tipy od lidí v okolí ({communityItems.length})</summary>
          <div class="ch-list">
            {#each communityItems.slice(0, 4) as ci}
              {@const ciWeb = normalizeUrl(ci.website)}
              {@const ciDist = ci.distanceKm ?? ci.distance_km}
              <div class="ch-item">
                <div class="ch-title-row">
                  <strong>{ci.name}</strong>
                  {#if ciDist != null}
                    <span>{formatDist(ciDist)}</span>
                  {/if}
                </div>
                {#if ci.description}
                  <p>{ci.description}</p>
                {/if}
                <div class="ch-links">
                  {#if ciWeb}
                    <a href={ciWeb} target="_blank" rel="noopener noreferrer">Web ↗</a>
                  {/if}
                  {#if typeof ci.lat === 'number' && typeof ci.lon === 'number'}
                    <button type="button" on:click={() => moveMapCenter(ci.lat, ci.lon, 15)}>Na mapě</button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </details>
      {/if}

      <details class="calm-drawer extra-drawer">
        <summary>Hledáš jednorázovou víkendovku nebo inzerát? (4 portály)</summary>
        <div class="portals-mini-grid">
          {#each PORTALS.slice(0, 4) as portal}
            <a href={portal.url} target="_blank" rel="noopener noreferrer" class="portal-mini">
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
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.75rem 1.25rem 3.5rem;
  }

  .near-header {
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
    font-size: clamp(1.95rem, 3.5vw, 2.75rem);
    line-height: 1.1;
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
    max-width: 54ch;
    font-size: 0.96rem;
    line-height: 1.58;
  }

  /* Controls Card */
  .controls-card {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(22, 66, 48, 0.1);
    border-radius: 24px;
    padding: 1.15rem 1.35rem;
    box-shadow: var(--shadow-sm);
    margin-bottom: 1.2rem;
  }

  .controls-top {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .gps-btn {
    padding: 0.64rem 0.95rem;
    border-radius: 12px;
    background: #eef7f1;
    border: 1px solid rgba(5, 150, 105, 0.28);
    color: #065f46;
    font-family: var(--font-sans);
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.16s ease;
  }

  .gps-btn:hover {
    background: #059669;
    color: #ffffff;
  }

  .search-box {
    flex: 1;
    min-width: 240px;
    display: flex;
    gap: 0.45rem;
  }

  .search-box input {
    flex: 1;
    padding: 0.64rem 0.9rem;
    border-radius: 12px;
    border: 1px solid rgba(22, 66, 48, 0.15);
    font-family: var(--font-sans);
    font-size: 0.88rem;
    background: #ffffff;
  }

  .btn-find {
    padding: 0.64rem 1.05rem;
    border-radius: 12px;
    border: none;
    background: var(--forest-850);
    color: #ffffff;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.86rem;
    cursor: pointer;
  }

  .city-jump-select {
    padding: 0.64rem 0.85rem;
    border-radius: 12px;
    border: 1px solid rgba(22, 66, 48, 0.15);
    background: #ffffff;
    font-family: var(--font-sans);
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--text-primary);
    cursor: pointer;
  }

  .radius-box {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .radius-box input[type='range'] {
    width: 96px;
    accent-color: #059669;
  }

  .info-note {
    margin-top: 0.6rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: #065f46;
  }

  .geo-dropdown {
    margin-top: 0.55rem;
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

  .controls-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 0.85rem;
    padding-top: 0.8rem;
    border-top: 1px solid rgba(22, 66, 48, 0.07);
  }

  .presets-bar {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .preset-pill {
    padding: 0.42rem 0.85rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.1);
    background: #f5f9f6;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.81rem;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .preset-pill:hover {
    border-color: rgba(16, 185, 129, 0.38);
    background: #ffffff;
  }

  .preset-pill.active {
    background: var(--forest-850);
    color: #fde68a;
    border-color: var(--forest-850);
  }

  .controls-links {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-size: 0.8rem;
  }

  .text-util-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0;
  }

  .text-util-btn:hover {
    color: var(--text-primary);
  }

  .text-util-link {
    color: var(--emerald-600);
    font-weight: 800;
    text-decoration: none;
  }

  .text-util-link:hover {
    text-decoration: underline;
  }

  .smart-nearest-banner {
    margin-bottom: 1rem;
    padding: 0.65rem 0.95rem;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(22, 66, 48, 0.1);
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  .mobile-tabs {
    display: none;
    gap: 0.4rem;
    margin-bottom: 0.85rem;
  }

  .mobile-tabs button {
    flex: 1;
    padding: 0.58rem;
    border-radius: 12px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: #ffffff;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.83rem;
    cursor: pointer;
  }

  .mobile-tabs button.active {
    background: var(--forest-850);
    color: #fde68a;
  }

  /* Split Layout */
  .split-layout {
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 1.25rem;
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
    border: 1px solid rgba(22, 66, 48, 0.1);
    box-shadow: var(--shadow-md);
  }

  .leaflet-canvas {
    width: 100%;
    height: 550px;
    background: #e7ece8;
    z-index: 1;
  }

  .map-status-pill {
    position: absolute;
    top: 12px;
    left: 54px;
    z-index: 500;
    padding: 0.34rem 0.78rem;
    border-radius: 999px;
    background: rgba(8, 25, 18, 0.86);
    color: #fde68a;
    font-size: 0.76rem;
    font-weight: 700;
    backdrop-filter: blur(8px);
  }

  .search-area-btn {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 520;
    padding: 0.44rem 0.92rem;
    border-radius: 999px;
    border: 1px solid rgba(16, 185, 129, 0.45);
    background: rgba(8, 25, 18, 0.92);
    color: #fde68a;
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(6, 21, 15, 0.25);
    backdrop-filter: blur(8px);
    white-space: nowrap;
    transition: transform 0.15s ease, background 0.15s ease;
  }

  .search-area-btn:hover {
    transform: translateX(-50%) scale(1.03);
    background: #064e3b;
  }

  .map-floating-tools {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 500;
  }

  .tile-switch-btn {
    padding: 0.36rem 0.75rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.16);
    background: rgba(255, 255, 255, 0.94);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
  }

  .map-foot-hint {
    padding: 0.55rem 0.95rem;
    background: #f8faf8;
    border-top: 1px solid rgba(22, 66, 48, 0.07);
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .map-error-box {
    padding: 0.75rem 1rem;
    background: #fef2f2;
    color: #991b1b;
    font-size: 0.85rem;
  }

  /* List Column */
  .near-sound-btn {
    padding: 0.34rem 0.58rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.14);
    background: rgba(255, 255, 255, 0.92);
    font-size: 0.8rem;
    cursor: pointer;
    flex-shrink: 0;
  }

  .near-pulse-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    margin-top: 0.9rem;
  }

  .list-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
    margin-bottom: 0.8rem;
  }

  .count-heading {
    font-size: 0.95rem;
    color: var(--text-secondary);
  }

  .count-heading strong {
    font-size: 1.15rem;
    color: var(--forest-850);
  }

  .list-filters {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .filter-input,
  .sort-select {
    padding: 0.42rem 0.75rem;
    border-radius: 10px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: rgba(255, 255, 255, 0.92);
    font-family: var(--font-sans);
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  /* Clean Place Cards */
  .places-stack {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .place-card {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(22, 66, 48, 0.09);
    border-radius: 22px;
    padding: 1.25rem 1.35rem;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .place-card:hover,
  .place-card.active {
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: var(--shadow-md);
  }

  .place-card.top-pick {
    border-color: rgba(16, 185, 129, 0.35);
  }

  .pc-meta-top {
    display: flex;
    align-items: center;
    gap: 0.38rem;
    flex-wrap: wrap;
    font-size: 0.76rem;
    color: var(--text-muted);
    margin-bottom: 0.35rem;
  }

  .pc-cat {
    font-weight: 700;
    color: var(--text-secondary);
  }

  .pc-dist {
    font-weight: 700;
    color: var(--emerald-600);
  }

  .pc-verified {
    font-weight: 700;
    color: #0d4a33;
  }

  .pc-osm-badge,
  .pc-community-badge {
    font-weight: 600;
    color: var(--text-muted);
  }

  .pc-verify-footer {
    margin-top: 0.7rem;
    padding-top: 0.55rem;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.73rem;
    color: var(--text-muted);
  }

  .pc-report-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 0.73rem;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }

  .pc-report-btn:hover {
    color: #b45309;
  }

  .near-empty-fallback {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(22, 66, 48, 0.12);
    border-radius: 22px;
    padding: 1.45rem 1.5rem;
    box-shadow: var(--shadow-sm);
  }

  .near-empty-fallback h3 {
    margin: 0 0 0.45rem;
    font-size: 1.08rem;
    font-weight: 800;
    color: var(--forest-850);
  }

  .near-empty-fallback p {
    margin: 0 0 1rem;
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--text-secondary);
  }

  .near-empty-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1.1rem;
  }

  .nearest-verified-box {
    padding-top: 0.85rem;
    border-top: 1px solid rgba(22, 66, 48, 0.09);
  }

  .nv-label {
    display: block;
    font-size: 0.78rem;
    font-weight: 800;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.5rem;
  }

  .nv-list {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .nv-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    flex-wrap: wrap;
    font-size: 0.85rem;
  }

  .nv-meta {
    color: var(--text-muted);
    font-size: 0.78rem;
  }

  .nv-jump-btn {
    border: none;
    background: rgba(16, 185, 129, 0.12);
    color: #065f46;
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.28rem 0.65rem;
    border-radius: 999px;
    cursor: pointer;
  }

  .nv-jump-btn:hover {
    background: #059669;
    color: #ffffff;
  }

  .pc-title {
    margin: 0 0 0.25rem;
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.28;
  }

  .pc-addr {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 0.45rem;
  }

  .pc-desc {
    margin: 0 0 0.85rem;
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.54;
  }

  .pc-actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .pc-btn {
    padding: 0.48rem 0.82rem;
    border-radius: 10px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: #ffffff;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.8rem;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pc-btn.primary {
    background: var(--forest-850);
    border-color: var(--forest-850);
    color: #ffffff;
  }

  .pc-btn.msg {
    background: #f6faf7;
    color: var(--forest-800);
  }

  .pc-btn.ghost {
    background: transparent;
    color: var(--text-secondary);
  }

  .pc-btn.done {
    background: #eef7f1;
    border-color: rgba(5, 150, 105, 0.26);
    color: #065f46;
  }

  .pc-btn.done:hover {
    background: #059669;
    color: #ffffff;
  }

  .template-drawer {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(22, 66, 48, 0.09);
  }

  .td-head {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.4rem;
    font-size: 0.8rem;
    margin-bottom: 0.4rem;
  }

  .td-body {
    margin: 0 0 0.55rem;
    padding: 0.65rem;
    border-radius: 10px;
    background: #f7faf8;
    font-family: var(--font-sans);
    font-size: 0.8rem;
    line-height: 1.48;
    white-space: pre-wrap;
    color: var(--text-secondary);
  }

  .td-btns {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .near-more-wrap {
    margin-top: 1rem;
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

  .extra-drawer {
    margin-top: 0.9rem;
  }

  .ch-list {
    margin-top: 0.75rem;
    display: grid;
    gap: 0.5rem;
  }

  .ch-item {
    padding: 0.65rem 0.8rem;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid rgba(22, 82, 56, 0.08);
    font-size: 0.83rem;
  }

  .ch-title-row {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .ch-item p {
    margin: 0.25rem 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .ch-links {
    display: flex;
    gap: 0.6rem;
    margin-top: 0.25rem;
  }

  .ch-links a,
  .ch-links button {
    font-size: 0.76rem;
    font-weight: 700;
    color: #047857;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
  }

  .portals-mini-grid {
    margin-top: 0.75rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.55rem;
  }

  .portal-mini {
    padding: 0.68rem 0.85rem;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid rgba(22, 66, 48, 0.08);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
  }

  .portal-mini strong {
    font-size: 0.84rem;
    color: #059669;
  }

  .portal-mini span {
    font-size: 0.77rem;
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
    box-shadow: 0 6px 16px rgba(6, 21, 15, 0.24);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    transition: transform 0.15s ease;
  }

  :global(.aa-map-pin .pin-bubble.is-curated) {
    background: #fffef7;
    border: 3px solid #059669;
    box-shadow: 0 8px 20px rgba(6, 21, 15, 0.28), 0 0 0 4px rgba(251, 191, 36, 0.5);
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

  @media (max-width: 680px) {
    .near-page {
      padding: 0.25rem 0.6rem 1.8rem;
    }

    .subpage-hero.near-header {
      padding: 0.45rem 0.75rem;
      margin-bottom: 0.35rem;
      border-radius: 16px;
    }

    .near-header .hero-kicker,
    .near-header .subtitle {
      display: none !important;
    }

    .near-header .title {
      font-size: 1.12rem;
      line-height: 1.15;
      margin: 0;
    }

    .controls-card {
      padding: 0.48rem 0.55rem;
      margin-bottom: 0.35rem;
      border-radius: 14px;
    }

    .controls-top {
      display: flex;
      flex-wrap: nowrap;
      gap: 0.3rem;
    }

    .gps-btn {
      padding: 0.34rem 0.52rem;
      font-size: 0.72rem;
      flex-shrink: 0;
    }

    .search-box {
      min-width: 0;
      flex: 1 1 auto;
      gap: 0.28rem;
    }

    .search-box input {
      min-width: 0;
      padding: 0.34rem 0.5rem;
      font-size: 0.76rem;
    }

    .btn-find {
      padding: 0.34rem 0.55rem;
      font-size: 0.74rem;
      flex-shrink: 0;
    }

    .city-jump-select,
    .radius-box {
      display: none;
    }

    .controls-bottom {
      margin-top: 0.3rem;
      padding-top: 0.28rem;
      gap: 0.28rem;
    }

    .presets-bar {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      gap: 0.26rem;
      width: 100%;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }

    .presets-bar::-webkit-scrollbar {
      display: none;
    }

    .preset-pill {
      flex: 0 0 auto;
      white-space: nowrap;
      padding: 0.26rem 0.54rem;
      font-size: 0.72rem;
    }

    .controls-links {
      display: none;
    }

    .smart-nearest-banner {
      margin-bottom: 0.35rem;
      padding: 0.38rem 0.6rem;
      font-size: 0.74rem;
    }

    .mobile-tabs {
      margin-bottom: 0.32rem;
      gap: 0.3rem;
    }

    .mobile-tabs button {
      padding: 0.3rem 0.55rem;
      font-size: 0.75rem;
      border-radius: 10px;
    }

    .split-layout {
      gap: 0.35rem;
    }

    .leaflet-canvas {
      height: 140px;
    }

    .leaflet-canvas.map-expanded {
      height: 62dvh;
    }

    .map-foot-hint {
      display: none;
    }

    .list-toolbar {
      margin-bottom: 0.3rem;
      padding: 0.05rem 0;
      gap: 0.35rem;
      flex-wrap: nowrap;
    }

    .count-heading {
      font-size: 0.78rem;
      white-space: nowrap;
    }

    .count-heading strong {
      font-size: 0.92rem;
    }

    .list-filters {
      flex-wrap: nowrap;
      gap: 0.28rem;
      min-width: 0;
      flex: 1;
      justify-content: flex-end;
    }

    .filter-input,
    .sort-select {
      padding: 0.28rem 0.45rem;
      font-size: 0.73rem;
      min-width: 0;
    }

    .filter-input {
      max-width: 115px;
    }

    .place-card {
      padding: 0.8rem 0.85rem;
      border-radius: 16px;
    }
  }
</style>
