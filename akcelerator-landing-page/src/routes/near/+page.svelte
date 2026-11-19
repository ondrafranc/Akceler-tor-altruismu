<script>
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
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
    LOCAL_COMMUNITY_ITEMS,
    buildFirstContactTemplate
  } from '../../lib/data/czech-actions.js';
  import { recordSmallWin } from '../../lib/progress.js';
  import { haversineKm, sanitizeHttpUrl as normalizeUrl, sanitizePhone, safeText } from '../../lib/validation.js';
  import {
    isSoundMuted,
    toggleSoundMuted
  } from '../../lib/audio/audioContext.js';
  import { playPayoffAsmr } from '../../lib/audio/presets.js';
  import {
    savePendingPartnerReturn,
    consumePendingPartnerReturn,
    getPendingPartnerReturnRemainingMs
  } from '../../lib/features/actions/services/partnerReturnService.js';
  import { getActionEffectMeta } from '../../lib/sensory/catalog/catalogResolver.js';
  import { impactCanvas } from '../../lib/sensory/canvas/impactCanvasAction.js';
  import { triggerCanvasBurst } from '../../lib/sensory/canvas/controllerRegistry.js';
  import { notifyMollySpark } from '../../lib/mollyStore.js';
  import { normSearchStr } from '../../lib/utils.js';
  import { safeGetItem, AA_MY_PENDING_SUBMISSIONS_KEY } from '../../lib/storage/index.js';
  import PlaceCard from '../../lib/features/map/components/PlaceCard.svelte';
  import { getPlaceActionHint } from '../../lib/features/map/services/contactTemplates.js';
  import AppIcon from '$lib/components/AppIcon.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { getSvgIconHtml } from '$lib/icons/iconRegistry.js';

  const CATEGORY_PRESETS = [
    { id: 'all', icon: 'sparkles', label: 'Vše smysluplné v okolí', kinds: ['ngo', 'community', 'food', 'animals'], onlyWeb: false },
    { id: 'animals', icon: 'paw', label: 'Útulky a zvířata', kinds: ['animals'], onlyWeb: false },
    { id: 'food', icon: 'utensils', label: 'Jídlo a šatníky', kinds: ['food', 'community'], onlyWeb: false },
    { id: 'community', icon: 'book-open', label: 'Knihobudky a sousedé', kinds: ['community'], onlyWeb: false },
    { id: 'fast', icon: 'zap', label: 'S přímým webem', kinds: ['ngo', 'community', 'food', 'animals'], onlyWeb: true }
  ];

  const SOURCE_FILTERS = [
    { id: 'all', icon: null, label: 'Všechny zdroje' },
    { id: 'verified_org', icon: 'shield-check', label: 'Ověřené organizace' },
    { id: 'community', icon: 'sprout', label: 'Komunitní tipy' },
    { id: 'osm', icon: 'map', label: 'Veřejné mapy a orientační body' }
  ];

  const RADIUS_PRESETS = [2, 5, 8, 15, 25];

  const KIND_META = {
    ngo: { icon: 'building', label: 'Neziskovka / spolek', color: '#1b5e42' },
    community: { icon: 'handshake', label: 'Komunita / knihobudka', color: '#2b5938' },
    food: { icon: 'utensils', label: 'Potraviny a šatník', color: '#8f4b0e' },
    animals: { icon: 'paw', label: 'Zvířata a útulek', color: '#1d4f5f' }
  };

  const ALL_KINDS = ['ngo', 'community', 'food', 'animals'];

  const QUICK_TOWNS = [
    ...CZECH_CITIES.map((c) => ({ label: `${c.name.replace(/\s*\([^)]*\)/g, '')}`, lat: c.lat, lon: c.lon })),
    { label: 'Kladno, Středočeský kraj', lat: 50.1473, lon: 14.1028 },
    { label: 'Tábor, Jihočeský kraj', lat: 49.4144, lon: 14.6578 },
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

  const INITIAL_CITY = CZECH_CITIES[0];
  const DEFAULT_RADIUS_KM = 8;

  let activePresetId = $state('all');
  let sourceFilter = $state('all'); // 'all' | 'verified_org' | 'community' | 'osm'
  let selectedCity = $state(INITIAL_CITY);
  let centerLat = $state(INITIAL_CITY.lat);
  let centerLon = $state(INITIAL_CITY.lon);
  let radiusKm = $state(DEFAULT_RADIUS_KM);
  let kinds = $state([...ALL_KINDS]);
  let onlyWithWebsite = $state(false);
  let query = $state('');
  let sortBy = $state('easy'); // easy | distance | name

  function formatDist(km) {
    if (!Number.isFinite(km)) return '';
    if (km < 1) return `${Math.max(100, Math.round(km * 10) * 100)} m`;
    return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`;
  }

  function isFoodOrClothingPlace(p) {
    if (!p) return false;
    if (p.kind === 'food') return true;
    const text = `${p.name || ''} ${p.subcategory || ''} ${p.description || ''}`.toLowerCase();
    if (/knihobudka|knihovnička|public_bookcase/.test(text)) return false;
    return /šatník|satnik|oblečen|potravin|jídlo|jidlo|oběd|charit|naděje|nadeje|armáda spásy|diakonie|spižírn|lednic/.test(
      text
    );
  }

  function isCommunityNeighborhoodBoosted(p) {
    const text = `${p?.name || ''} ${p?.subcategory || ''} ${p?.description || ''}`.toLowerCase();
    return /knihobudka|knihovnička|reuse|zahrada|soused|dílna|swap|kompost/.test(text);
  }

  function normalizeCommunityItemToPlace(ci, lat, lon) {
    if (!ci || typeof ci.lat !== 'number' || typeof ci.lon !== 'number') return null;
    const text = `${ci.name || ''} ${ci.category || ''} ${ci.description || ''}`.toLowerCase();
    let derivedKind = 'community';
    if (/zvíř|utulek|útulek|pes|kočk/.test(text)) {
      derivedKind = 'animals';
    } else if (/potravin|jídlo|šatník|satnik|lednice|spižírn/.test(text)) {
      derivedKind = 'food';
    } else if (ci.kind === 'org' && /dobrovolnické centrum|nadace|spolek|charita|adra|maltéz/.test(text)) {
      derivedKind = 'ngo';
    }
    const d = haversineKm(lat, lon, ci.lat, ci.lon);
    return {
      id: String(ci.id || `comm:${ci.lat}:${ci.lon}`),
      name: ci.name || 'Sousedský tip',
      lat: ci.lat,
      lon: ci.lon,
      kind: derivedKind,
      subcategory: ci.category || 'Sousedský tip',
      website: normalizeUrl(ci.website || ci.event_url),
      address: ci.address_label || ci.city || null,
      phone: ci.phone || null,
      email: ci.email || null,
      description: ci.description || null,
      quickMission: ci.quickMission || null,
      helpWays: ci.helpWays || null,
      visitMode: ci.visitMode || null,
      curated: false,
      sourceType: 'community',
      pendingModeration: ci.status === 'pending' || Boolean(ci.pendingModeration),
      verifiedAt: null,
      distanceKm: Math.round(d * 10) / 10
    };
  }

  function getMyPendingCommunityItems() {
    try {
      const raw = safeGetItem(AA_MY_PENDING_SUBMISSIONS_KEY, 'local');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function getInstantCurated(lat, lon, activeKinds = ALL_KINDS) {
    const kList = activeKinds?.length ? activeKinds : ALL_KINDS;
    const allCurated = CURATED_FALLBACK_PLACES.filter((p) => kList.includes(p.kind)).map((p) => {
      const d = haversineKm(lat, lon, p.lat, p.lon);
      return {
        ...p,
        curated: true,
        sourceType: 'verified_org',
        verifiedAt: p.verifiedAt || '11/2026',
        website: normalizeUrl(p.website),
        distanceKm: Math.round(d * 10) / 10
      };
    });

    const myPending = getMyPendingCommunityItems();
    const localComm = [...myPending, ...LOCAL_COMMUNITY_ITEMS]
      .map((ci) => normalizeCommunityItemToPlace(ci, lat, lon))
      .filter((item) => item && kList.includes(item.kind));

    const combined = [...allCurated];
    const seenNames = new Set(combined.map((p) => normSearchStr(p.name)));
    for (const comm of localComm) {
      const nName = normSearchStr(comm.name);
      if (seenNames.has(nName)) continue;
      if (combined.some((c) => haversineKm(c.lat, c.lon, comm.lat, comm.lon) < 0.15 && c.kind === comm.kind)) {
        continue;
      }
      seenNames.add(nName);
      combined.push(comm);
    }

    combined.sort((a, b) => a.distanceKm - b.distanceKm);
    return combined;
  }

  // Geocode & GPS
  let locationQuery = $state('');
  let geoStatus = $state('idle');
  let geoMessage = $state('');
  /** @type {Array<{label: string, lat: number, lon: number}>} */
  let geoResults = $state([]);
  let gpsStatus = $state('idle');
  let gpsMessage = $state('');
  let shareMessage = $state('');

  const instantTownSuggestions = $derived.by(() => {
    const q = normSearchStr(locationQuery);
    if (q.length < 2 || geoResults.length > 0) return [];
    return QUICK_TOWNS.filter((t) => {
      const n = normSearchStr(t.label);
      return n.includes(q) && n.split(',')[0] !== q;
    }).slice(0, 5);
  });

  // Map state
  let mapEl = $state();
  let map = $state.raw(null);
  let leaflet = $state.raw(null);
  let tileLayer = null;
  let tileStyle = $state('calm'); // 'calm' | 'crisp'
  let tileFallbackUsed = false;
  let touchGestureHint = $state(false);
  let touchHintTimer = null;
  let markersLayer = null;
  let userMarker = null;
  let radiusCircle = null;
  let userGestureActive = false;
  /** @type {Map<string, { setPopupContent: (c: string) => void, setZIndexOffset: (z: number) => void, getElement?: () => HTMLElement | null, openPopup: () => void, closePopup?: () => void, _aaPopupHtml?: string, [key: string]: unknown }>} */
  let markerById = new Map();
  /** @type {{ lat: number, lon: number } | null} */
  let pannedCenter = $state(null);
  /** @type {AbortController | null} */
  let nearbyAbortController = null;

  let isLoadingMap = $state(true);
  let mapBootError = $state('');
  let isFetching = $state(false);
  let isFallbackData = $state(false);
  let isExpandedToNearest = $state(false);

  /**
   * Seed verified & community places immediately at initialization (including SSR)
   * using module constants to avoid state_referenced_locally warnings.
   * @type {Array<import('$lib/server/nearbyService.js').NearbyPlace>}
   */
  let places = $state(getInstantCurated(INITIAL_CITY.lat, INITIAL_CITY.lon, ALL_KINDS));
  /** @type {Array<import('$lib/server/nearbyService.js').NearbyPlace>} */
  let communityItems = $state([]);
  let activePlaceId = $state(null);
  let hoveredPlaceId = $state(null);
  let visibleCount = $state(3);
  let mobileView = $state('list'); // 'list' | 'map'
  let filtersOpen = $state(false);

  // First-contact template
  let openTemplateId = $state(null);
  let copiedTemplateId = $state(null);
  let copiedPlaceLinkId = $state(null);
  let soundMuted = $state(false);
  let activeEffectPlaceId = $state(null);
  /** @type {Record<string, number>} */
  let placeMetrics = $state({});
  let nearReturnPlace = $state(null);
  let nearReturnMetric = $state(0);
  let awaitingNearPlace = null;
  let nearLeaveTimestamp = 0;

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

  function togglePlaceEffect(p, event) {
    activeEffectPlaceId = p.id;
    const act = toPlaceAction(p);
    notifyMollySpark(act, { surface: 'near' });
    const stage = event?.currentTarget?.closest?.('.card-effect-stage');
    const canvas = stage?.querySelector?.('canvas.impact-payoff-canvas');
    if (canvas) {
      triggerCanvasBurst(canvas, true);
    } else {
      playPayoffAsmr(act);
    }
    trackEvent('aa_effect_preview_toggle', { surface: 'near', id: p.id });
  }

  function handleStartNearPlace(p) {
    const act = toPlaceAction(p);
    awaitingNearPlace = act;
    nearLeaveTimestamp = Date.now();
    nearReturnPlace = null;
    savePendingPartnerReturn(act, 'near');
    markActionStarted(p.id, 'near_place');
  }

  const nearestVerifiedOrgs = $derived.by(() =>
    CURATED_FALLBACK_PLACES.map((p) => ({
      ...p,
      curated: true,
      verifiedAt: p.verifiedAt || '11/2026',
      website: normalizeUrl(p.website),
      distanceKm: Math.round(haversineKm(centerLat, centerLon, p.lat, p.lon) * 10) / 10
    }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3)
  );

  function placeEaseScore(p, currentPreset = activePresetId) {
    let score = (Number.isFinite(p?.distanceKm) ? p.distanceKm : 50) * 0.1;
    if (p?.curated || p?.sourceType === 'verified_org') score -= 0.45;
    if (p?.sourceType === 'community') score -= 0.28;
    if (p?.website) score -= 0.25;
    if (p?.email || p?.phone) score -= 0.15;
    if (p?.description) score -= 0.12;
    if (currentPreset === 'community' && isCommunityNeighborhoodBoosted(p)) {
      score -= 1.35;
    }
    if (currentPreset === 'food' && p?.kind === 'food') {
      score -= 0.65;
    }
    return score;
  }

  function sortPlaceList(list, mode = sortBy, preset = activePresetId) {
    if (mode === 'distance') {
      return [...list].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }
    if (mode === 'name') {
      return [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'cs'));
    }
    return [...list].sort((a, b) => placeEaseScore(a, preset) - placeEaseScore(b, preset));
  }

  const candidatePlaces = $derived.by(() => {
    const q = query.trim().toLowerCase();
    let list = places.filter((p) => {
      if (activePresetId === 'food') {
        return isFoodOrClothingPlace(p);
      }
      return kinds.includes(p.kind || 'ngo');
    });
    if (sourceFilter !== 'all') {
      list = list.filter((p) => (p.sourceType || (p.curated ? 'verified_org' : 'osm')) === sourceFilter);
    }
    if (onlyWithWebsite) {
      list = list.filter((p) => !!p.website);
    }
    if (q) {
      const maxSearchKm = Math.max(radiusKm, 25);
      list = list.filter((p) => {
        if ((p.distanceKm ?? 999) > maxSearchKm) return false;
        const hay = `${p.name || ''} ${p.subcategory || ''} ${p.address || ''} ${p.description || ''} ${p.quickMission || ''}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  });

  const withinRadiusPlaces = $derived.by(() =>
    sortPlaceList(
      candidatePlaces.filter((p) => (p.distanceKm ?? 999) <= radiusKm),
      sortBy,
      activePresetId
    )
  );

  const isRadiusExpanded = $derived(
    !query.trim() &&
      candidatePlaces.length > withinRadiusPlaces.length &&
      withinRadiusPlaces.length < 3
  );

  const filteredPlaces = $derived.by(() => {
    if (query.trim()) return sortPlaceList(candidatePlaces, sortBy, activePresetId);
    if (withinRadiusPlaces.length >= 3) return withinRadiusPlaces;
    const outsideNearest = candidatePlaces
      .filter((p) => (p.distanceKm ?? 999) > radiusKm)
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
      .slice(0, Math.max(0, 3 - withinRadiusPlaces.length));
    return [...withinRadiusPlaces, ...outsideNearest];
  });

  const visiblePlaces = $derived(filteredPlaces.slice(0, visibleCount));
  const allOutsideRadius = $derived(
    filteredPlaces.length > 0 &&
      filteredPlaces.every((p) => (p.distanceKm ?? 0) > radiusKm)
  );
  const activePlaceObj = $derived(
    filteredPlaces.find((p) => p.id === activePlaceId) || places.find((p) => p.id === activePlaceId) || null
  );
  const activeFilterCount = $derived(
    (radiusKm !== DEFAULT_RADIUS_KM ? 1 : 0) +
      (sourceFilter !== 'all' ? 1 : 0) +
      (sortBy !== 'easy' ? 1 : 0) +
      (query.trim() ? 1 : 0)
  );

  function ensureOsmTileLayer() {
    if (!map || !leaflet) return;
    if (tileLayer) return;

    tileLayer = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      detectRetina: false,
      keepBuffer: 4,
      updateWhenZooming: false,
      updateWhenIdle: false,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> přispěvatelé'
    });
    let tileErrCount = 0;
    tileLayer.on('tileerror', () => {
      tileErrCount += 1;
      if (tileErrCount >= 4 && !tileFallbackUsed && tileLayer) {
        tileFallbackUsed = true;
        try {
          tileLayer.setUrl('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png');
        } catch {}
      }
    });
    tileLayer.addTo(map);
  }

  function toggleTileStyle() {
    tileStyle = tileStyle === 'calm' ? 'crisp' : 'calm';
    trackEvent('aa_map_tile_style', { style: tileStyle });
  }

  function updateRadiusOverlay(lat, lon) {
    if (!map || !leaflet) return;
    if (!radiusCircle) {
      radiusCircle = leaflet
        .circle([lat, lon], {
          radius: radiusKm * 1000,
          color: '#1b5e42',
          weight: 2,
          opacity: 0.65,
          fillColor: '#1b5e42',
          fillOpacity: 0.07,
          interactive: false
        })
        .addTo(map);
    } else {
      radiusCircle.setLatLng([lat, lon]);
      radiusCircle.setRadius(radiusKm * 1000);
    }
  }

  function updateUserSearchOverlays(lat, lon) {
    if (!map || !leaflet) return;
    if (userMarker) userMarker.remove();
    userMarker = leaflet
      .circleMarker([lat, lon], {
        radius: 8,
        color: '#ffffff',
        weight: 2.5,
        fillColor: '#1b5e42',
        fillOpacity: 1
      })
      .bindTooltip('Střed hledání', { direction: 'top' })
      .addTo(map);
    updateRadiusOverlay(lat, lon);
  }

  function moveMapCenter(lat, lon, zoom = 13) {
    centerLat = lat;
    centerLon = lon;
    pannedCenter = null;
    if (!map || !leaflet) return;
    userGestureActive = false;
    map.setView([lat, lon], zoom, { animate: true });
    updateUserSearchOverlays(lat, lon);
  }

  function fitMapToFilteredPlaces(animate = true) {
    if (!map || !leaflet) return;
    if (mapEl && (mapEl.clientWidth <= 0 || mapEl.clientHeight <= 0)) return;
    const pts = [[centerLat, centerLon]];
    const topForBounds = filteredPlaces.slice(0, Math.max(visibleCount, 3));
    for (const p of topForBounds) {
      if (typeof p.lat === 'number' && typeof p.lon === 'number') {
        pts.push([p.lat, p.lon]);
      }
    }
    if (pts.length >= 2) {
      try {
        userGestureActive = false;
        const bounds = leaflet.latLngBounds(pts);
        const curZoom = map.getZoom?.();
        const curCenter = map.getCenter?.();
        if (Number.isFinite(curZoom) && curCenter) {
          const targetZoom = Math.min(14, map.getBoundsZoom(bounds, false, leaflet.point(68, 68)));
          const bCenter = bounds.getCenter();
          if (targetZoom === curZoom && haversineKm(curCenter.lat, curCenter.lng, bCenter.lat, bCenter.lng) < 0.05) {
            return;
          }
        }
        map.fitBounds(bounds, { padding: [34, 34], maxZoom: 14, animate });
      } catch {}
    }
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildPinHtml(p, isHighlighted) {
    const meta = KIND_META[p.kind] || KIND_META.ngo;
    const isCurated = !!p.curated || p.sourceType === 'verified_org';
    const isComm = p.sourceType === 'community';
    const badgeHtml = isCurated
      ? `<i class="pin-star" title="Ověřená organizace">${getSvgIconHtml('star', 10, 2.2)}</i>`
      : isComm
        ? `<i class="pin-leaf" title="Komunitní tip">${getSvgIconHtml('sprout', 10, 2.2)}</i>`
        : '';
    return `<div class="pin-bubble ${isCurated ? 'is-curated' : ''} ${isComm ? 'is-community' : ''} ${isHighlighted ? 'is-active' : ''}" style="--pin-color:${meta.color}"><span class="pin-glyph">${getSvgIconHtml(meta.icon, 16, 2)}</span>${badgeHtml}</div>`;
  }

  const POPUP_OPTIONS = {
    maxWidth: 256,
    minWidth: 196,
    offset: [0, -12],
    autoPan: true,
    autoPanPaddingTopLeft: [64, 68],
    autoPanPaddingBottomRight: [20, 76]
  };

  function buildPopupHtml(p) {
    const meta = KIND_META[p.kind] || KIND_META.ngo;
    const safeWeb = normalizeUrl(p.website);
    const mapyUrl = `https://mapy.cz/zakladni?x=${encodeURIComponent(p.lon)}&y=${encodeURIComponent(p.lat)}&z=17&q=${encodeURIComponent(p.name || '')}`;
    const sourceBadgeHtml =
      p.curated || p.sourceType === 'verified_org'
        ? `<span style="display:inline-flex;align-items:center;gap:3px;">${getSvgIconHtml('shield-check', 11, 2)}<span>Ověřená organizace</span></span>`
        : p.sourceType === 'community'
          ? `<span style="display:inline-flex;align-items:center;gap:3px;">${getSvgIconHtml('sprout', 11, 2)}<span>Komunitní tip</span></span>`
          : `<span style="display:inline-flex;align-items:center;gap:3px;">${getSvgIconHtml('map', 11, 2)}<span>OSM</span></span>`;

    const linksHtml = `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px;">
      ${safeWeb ? `<a href="${escapeHtml(safeWeb)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:3px;font-weight:800;font-size:11.5px;color:#1b5e42;text-decoration:none;"><span>Web organizace</span>${getSvgIconHtml('arrow-up-right', 12, 2)}</a>` : ''}
      <a href="${escapeHtml(mapyUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:3px;font-weight:700;font-size:11.5px;color:#14281d;text-decoration:underline;">${getSvgIconHtml('compass', 12, 2)}<span>Navigovat (Mapy.cz)</span>${getSvgIconHtml('arrow-up-right', 12, 2)}</a>
    </div>`;

    return `<div style="font-family:'Plus Jakarta Sans',sans-serif;max-width:228px;line-height:1.36;">
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:3px;padding-right:24px;font-size:10px;font-weight:800;text-transform:uppercase;color:${meta.color};margin-bottom:2px;">
        <span>${escapeHtml(p.subcategory || meta.label)}</span><span>·</span><span>${escapeHtml(formatDist(p.distanceKm))}</span><span>·</span>${sourceBadgeHtml}
      </div>
      <div style="font-weight:800;font-size:13.5px;line-height:1.25;color:#14281d;margin-bottom:3px;padding-right:16px;max-height:3.75em;overflow:hidden;">${escapeHtml(p.name)}</div>
      ${p.address ? `<div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#3f574a;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${getSvgIconHtml('map-pin', 11, 2)}<span style="overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.address)}</span></div>` : ''}
      <div style="font-size:11px;line-height:1.38;background:#edf2ee;border:1px solid #dce3dd;padding:5px 7px;border-radius:8px;color:#14281d;margin:4px 0;max-height:76px;overflow-y:auto;overscroll-behavior:contain;box-sizing:border-box;">
        <strong>Jak pomoct:</strong> ${escapeHtml(getPlaceActionHint(p))}
      </div>
      ${linksHtml}
    </div>`;
  }

  function renderMarkers() {
    if (!map || !leaflet) return;
    if (!markersLayer) {
      markersLayer = leaflet.layerGroup().addTo(map);
    }

    const nextSlice = filteredPlaces.slice(0, 160);
    const nextIds = new Set(nextSlice.map((p) => p.id));

    for (const [existingId, existingMarker] of markerById.entries()) {
      if (!nextIds.has(existingId)) {
        markersLayer.removeLayer(existingMarker);
        markerById.delete(existingId);
      }
    }

    for (const p of nextSlice) {
      if (typeof p.lat !== 'number' || typeof p.lon !== 'number') continue;
      const meta = KIND_META[p.kind] || KIND_META.ngo;
      const pinLabel = `${p.name} — ${p.subcategory || meta.label} (${formatDist(p.distanceKm)})`;
      const isHighlighted = p.id === activePlaceId || p.id === hoveredPlaceId;
      const popupHtml = buildPopupHtml(p);

      if (markerById.has(p.id)) {
        const existing = markerById.get(p.id);
        if (existing._aaPopupHtml !== popupHtml) {
          existing.setPopupContent(popupHtml);
          existing._aaPopupHtml = popupHtml;
        }
        existing.setZIndexOffset(isHighlighted ? 1000 : p.curated ? 300 : 0);
        const iconEl = existing.getElement?.();
        if (iconEl) {
          iconEl.classList.toggle('is-active', isHighlighted);
          iconEl.setAttribute('aria-label', pinLabel);
          iconEl.setAttribute('title', pinLabel);
        }
        const bubble = iconEl?.querySelector?.('.pin-bubble');
        if (bubble) {
          bubble.classList.toggle('is-active', isHighlighted);
        }
        continue;
      }

      const icon = leaflet.divIcon({
        className: isHighlighted ? 'aa-map-pin is-active' : 'aa-map-pin',
        html: buildPinHtml(p, isHighlighted),
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = leaflet.marker([p.lat, p.lon], {
        icon,
        title: pinLabel,
        alt: pinLabel,
        riseOnHover: true,
        zIndexOffset: isHighlighted ? 1000 : p.curated ? 300 : 0
      });
      marker._aaPopupHtml = popupHtml;
      markerById.set(p.id, marker);

      marker.bindPopup(popupHtml, POPUP_OPTIONS);
      marker.off('click');
      marker.off('keypress');

      const handleMarkerActivate = async () => {
        activePlaceId = p.id;
        const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth <= 980;
        const idxInList = filteredPlaces.findIndex((item) => item.id === p.id);
        if (idxInList >= visibleCount) {
          visibleCount = idxInList + 1;
        }
        await tick();
        if (isMobileOrTablet) {
          userGestureActive = false;
          map?.closePopup();
          map?.panTo([p.lat, p.lon], { animate: true });
          const sheetEl = document.querySelector('.near-page .map-active-sheet');
          if (sheetEl) sheetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return;
        }
        userGestureActive = false;
        marker.openPopup();
        const el = document.getElementById(`place-card-${String(p.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };

      marker.on('click', handleMarkerActivate);
      marker.on('keypress', (/** @type {{ originalEvent?: KeyboardEvent }} */ e) => {
        const key = e?.originalEvent?.key;
        if (!key || key === 'Enter' || key === ' ') {
          e?.originalEvent?.preventDefault?.();
          void handleMarkerActivate();
        }
      });

      marker.addTo(markersLayer);
      const addedEl = marker.getElement?.();
      if (addedEl) {
        addedEl.setAttribute('aria-label', pinLabel);
        addedEl.setAttribute('title', pinLabel);
      }
    }
  }

  function setHoveredPlace(id) {
    hoveredPlaceId = id;
    if (!map || !leaflet) return;
    for (const [mId, marker] of markerById.entries()) {
      const isHi = mId === activePlaceId || mId === hoveredPlaceId;
      const pObj = places.find((item) => item.id === mId);
      marker.setZIndexOffset(isHi ? 1000 : pObj?.curated ? 300 : 0);
      const iconEl = marker.getElement?.();
      if (iconEl) iconEl.classList.toggle('is-active', isHi);
      const bubble = iconEl?.querySelector?.('.pin-bubble');
      if (bubble) bubble.classList.toggle('is-active', isHi);
    }
  }

  // Re-render markers whenever filteredPlaces or activePlaceId changes
  $effect(() => {
    if (map && leaflet && (filteredPlaces || activePlaceId)) {
      renderMarkers();
    }
  });

  function mergeCuratedAndApiPlaces(curatedList, apiList, commList = [], lat = centerLat, lon = centerLon) {
    const out = [...curatedList];
    const seenIds = new Set(out.map((c) => c.id));
    const seenNames = new Set(out.map((c) => normSearchStr(c.name)));

    const normalizedComm = (commList || [])
      .map((ci) => normalizeCommunityItemToPlace(ci, lat, lon))
      .filter(Boolean);

    for (const comm of normalizedComm) {
      const normName = normSearchStr(comm.name);
      if (seenIds.has(comm.id) || (normName && seenNames.has(normName))) continue;
      const isNearDuplicate = out.some(
        (c) => haversineKm(c.lat, c.lon, comm.lat, comm.lon) < 0.15 && c.kind === comm.kind
      );
      if (isNearDuplicate) continue;
      seenIds.add(comm.id);
      if (normName) seenNames.add(normName);
      out.push(comm);
    }

    for (const item of apiList) {
      const normName = normSearchStr(item.name);
      if (seenIds.has(item.id) || (normName && seenNames.has(normName))) continue;
      const isNearDuplicate = out.some(
        (c) => haversineKm(c.lat, c.lon, item.lat, item.lon) < 0.15 && c.kind === item.kind
      );
      if (isNearDuplicate) continue;
      seenIds.add(item.id);
      if (normName) seenNames.add(normName);
      out.push({
        ...item,
        sourceType: item.curated ? 'verified_org' : item.sourceType || 'osm',
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

    const qLat = Number(lat).toFixed(4);
    const qLon = Number(lon).toFixed(4);

    let fetchedComm = [];
    const communityPromise = fetch(
      `/api/community-nearby?lat=${encodeURIComponent(qLat)}&lon=${encodeURIComponent(qLon)}&radius_m=${encodeURIComponent(radiusKm * 1000)}`,
      { signal: controller.signal }
    )
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (!controller.signal.aborted) {
          fetchedComm = Array.isArray(d?.items) ? d.items : [];
          communityItems = fetchedComm;
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) communityItems = [];
      });

    let fetchedApiPlaces = [];
    try {
      const resp = await fetch(
        `/api/nearby?lat=${encodeURIComponent(qLat)}&lon=${encodeURIComponent(qLon)}&radius_m=${encodeURIComponent(
          radiusKm * 1000
        )}&kinds=${encodeURIComponent(ALL_KINDS.join(','))}`,
        { signal: controller.signal }
      );
      if (resp.ok && !controller.signal.aborted) {
        const data = await resp.json();
        isFallbackData = !!data?.fallback;
        isExpandedToNearest = !!data?.expandedToNearest;
        fetchedApiPlaces = (data?.places || []).map((p) => {
          const d = haversineKm(lat, lon, p.lat, p.lon);
          return {
            ...p,
            website: normalizeUrl(p.website),
            distanceKm: Math.round(d * 10) / 10
          };
        });
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        isFallbackData = true;
      }
    } finally {
      await communityPromise;
      if (!controller.signal.aborted) {
        places = mergeCuratedAndApiPlaces(curatedInstant, fetchedApiPlaces, fetchedComm, lat, lon);
        isFetching = false;
        await tick();
        if (activePlaceId) {
          const idx = filteredPlaces.findIndex((item) => item.id === activePlaceId);
          if (idx >= 3) {
            visibleCount = idx + 1;
            await tick();
          } else {
            visibleCount = 3;
          }
        } else {
          visibleCount = 3;
        }
        renderMarkers();
        syncMapToActiveOrFiltered();
      }
    }
  }

  function syncUrlState(lat, lon) {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lat', String(Math.round(lat * 10000) / 10000));
      url.searchParams.set('lon', String(Math.round(lon * 10000) / 10000));
      url.searchParams.set('r', String(radiusKm));
      url.searchParams.set('kinds', kinds.join(','));
      goto(url, { replaceState: true, noScroll: true, keepFocus: true });
    } catch {}
  }

  async function selectQuickCity(city) {
    selectedCity = city;
    activePlaceId = null;
    map?.closePopup();
    query = '';
    locationQuery = '';
    geoResults = [];
    geoMessage = '';
    moveMapCenter(city.lat, city.lon, 13);
    await fetchNearby(city.lat, city.lon);
    trackEvent('aa_near_city_pick', { city: city.id });
    trackFunnel('intent_selected', { surface: 'near_city', city: city.id });
  }

  async function setRadiusKm(nextRadius) {
    radiusKm = nextRadius;
    updateRadiusOverlay(centerLat, centerLon);
    await fetchNearby(centerLat, centerLon);
  }

  async function applyPreset(preset) {
    // 0ms instant in-memory filter — no network call or map wipe needed!
    activePresetId = preset.id;
    activePlaceId = null;
    map?.closePopup();
    query = '';
    kinds = [...preset.kinds];
    onlyWithWebsite = !!preset.onlyWeb;
    visibleCount = 3;
    syncUrlState(centerLat, centerLon);
    trackFunnel('intent_selected', { surface: 'near_preset', preset: preset.id });
    await tick();
    fitMapToFilteredPlaces();
  }

  async function setSourceFilter(nextSource) {
    sourceFilter = nextSource;
    activePlaceId = null;
    map?.closePopup();
    visibleCount = 3;
    await tick();
    fitMapToFilteredPlaces();
  }

  async function searchPannedArea() {
    if (!pannedCenter) return;
    const { lat, lon } = pannedCenter;
    pannedCenter = null;
    activePlaceId = null;
    map?.closePopup();
    query = '';
    moveMapCenter(lat, lon, map ? map.getZoom() : 13);
    await fetchNearby(lat, lon);
    trackEvent('aa_near_pan_search', { lat: Math.round(lat * 10000) / 10000, lon: Math.round(lon * 10000) / 10000 });
  }

  function resetAndExpandSearch() {
    activePlaceId = null;
    map?.closePopup();
    query = '';
    onlyWithWebsite = false;
    sourceFilter = 'all';
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
    activePlaceId = null;
    map?.closePopup();
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
        activePlaceId = null;
        map?.closePopup();
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

  function centerMapOnMobilePlace(p) {
    if (!map || !p || typeof p.lat !== 'number' || typeof p.lon !== 'number') return;
    if (resizeTimer) {
      clearTimeout(resizeTimer);
      resizeTimer = null;
    }
    userGestureActive = false;
    map.closePopup();
    try {
      map.stop();
    } catch {}
    const targetZoom = Math.max(map.getZoom() || 13, 15);
    map.setView([p.lat, p.lon], targetZoom, { animate: false });
  }

  function openPlacePopupCenteredOnDesktop(p) {
    if (!map || !leaflet || !p || typeof p.lat !== 'number' || typeof p.lon !== 'number') return;
    if (resizeTimer) {
      clearTimeout(resizeTimer);
      resizeTimer = null;
    }
    userGestureActive = false;
    try {
      map.stop();
    } catch {}
    const targetZoom = Math.max(map.getZoom() || 13, 15);
    const markerPt = map.project([p.lat, p.lon], targetZoom);
    const offsetCenter = map.unproject(leaflet.point(markerPt.x, markerPt.y - 98), targetZoom);
    map.setView(offsetCenter, targetZoom, { animate: false });
    const m = markerById.get(p.id);
    if (m) {
      userGestureActive = false;
      m.openPopup();
    }
  }

  function syncMapToActiveOrFiltered(animate = true) {
    if (!map || !leaflet) return;
    if (mapEl && (mapEl.clientWidth <= 0 || mapEl.clientHeight <= 0)) return;
    const active =
      (activePlaceId &&
        (filteredPlaces.find((item) => item.id === activePlaceId) ||
          places.find((item) => item.id === activePlaceId))) ||
      null;
    if (active) {
      const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth <= 980;
      if (isMobileOrTablet) {
        centerMapOnMobilePlace(active);
      } else {
        openPlacePopupCenteredOnDesktop(active);
      }
      return;
    }
    fitMapToFilteredPlaces(animate);
  }

  async function focusPlaceOnMap(p) {
    if (!p) return;
    activePlaceId = p.id;
    pannedCenter = null;
    const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth <= 980;
    if (isMobileOrTablet && mobileView === 'list') {
      mobileView = 'map';
    }
    await tick();
    if (!map) {
      await initMap();
    }
    if (!map) return;
    map.invalidateSize();
    renderMarkers();
    if (isMobileOrTablet) {
      centerMapOnMobilePlace(p);
      const tabsEl = document.querySelector('.near-page .mobile-tabs');
      const headerRect = document.querySelector('header.top-nav')?.getBoundingClientRect();
      const minTop = (headerRect ? headerRect.bottom : 60) + 6;
      const anchorEl = tabsEl || mapEl?.closest?.('.map-column');
      if (anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        if (rect.top < minTop - 2 || rect.top > window.innerHeight * 0.45) {
          window.scrollBy({ top: rect.top - minTop, behavior: 'auto' });
        }
      }
    } else {
      openPlacePopupCenteredOnDesktop(p);
    }
  }

  async function focusPlaceInList(p) {
    if (!p) return;
    activePlaceId = p.id;
    const idxInList = filteredPlaces.findIndex((item) => item.id === p.id);
    if (idxInList >= visibleCount) {
      visibleCount = idxInList + 1;
    }
    mobileView = 'list';
    await tick();
    const el = document.getElementById(`place-card-${String(p.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function copyTemplateText(place) {
    markActionStarted(place.id, 'near_place_copy');
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
      shareMessage = 'Odkaz na tuhle oblast mapy je zkopírovaný!';
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
    if (mode === 'map') {
      if (!map) {
        await initMap();
      }
      map?.invalidateSize();
      renderMarkers();
      syncMapToActiveOrFiltered();
    }
  }

  let destroyed = false;
  let mapInitializing = false;
  let resizeTimer = null;

  async function initMap() {
    if (map || mapInitializing || destroyed || !mapEl) return;
    mapInitializing = true;
    try {
      await import('leaflet/dist/leaflet.css');
      const mod = await import('leaflet');
      if (destroyed || !mapEl) {
        mapInitializing = false;
        return;
      }
      leaflet = mod.default || mod;
      await tick();
      if (destroyed || !mapEl) {
        mapInitializing = false;
        return;
      }

      map = leaflet.map(mapEl, {
        zoomControl: true,
        scrollWheelZoom: false,
        preferCanvas: true
      });
      map.on('focus', () => map?.scrollWheelZoom?.enable());
      map.on('blur', () => map?.scrollWheelZoom?.disable());
      map.on('autopanstart', () => {
        userGestureActive = false;
      });
      map.on('dragstart', () => {
        userGestureActive = true;
      });
      map.on('popupopen', () => {
        if (typeof window !== 'undefined' && window.innerWidth <= 980) {
          map?.closePopup();
        }
      });

      const onMapWheel = () => {
        userGestureActive = true;
      };
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
      mapEl.addEventListener('wheel', onMapWheel, { passive: true });
      mapEl.addEventListener('touchstart', onMapTouchStart, { passive: true });
      mapEl.addEventListener('touchend', onMapTouchEnd, { passive: true });

      // Resolve final initial view/bounds BEFORE adding the tileLayer so Leaflet never
      // starts and immediately aborts zoom-13 tile requests on boot.
      const activeInit =
        (activePlaceId &&
          (filteredPlaces.find((item) => item.id === activePlaceId) ||
            places.find((item) => item.id === activePlaceId))) ||
        null;
      const isDesktopInit = typeof window !== 'undefined' && window.innerWidth > 980;
      if (activeInit && typeof activeInit.lat === 'number' && typeof activeInit.lon === 'number') {
        const targetZoom = 15;
        if (!isDesktopInit) {
          map.setView([activeInit.lat, activeInit.lon], targetZoom, { animate: false });
        } else {
          const markerPt = map.project([activeInit.lat, activeInit.lon], targetZoom);
          const offsetCenter = map.unproject(leaflet.point(markerPt.x, markerPt.y - 98), targetZoom);
          map.setView(offsetCenter, targetZoom, { animate: false });
        }
      } else {
        const pts = [[centerLat, centerLon]];
        const topForBounds = filteredPlaces.slice(0, Math.max(visibleCount, 3));
        for (const p of topForBounds) {
          if (typeof p.lat === 'number' && typeof p.lon === 'number') {
            pts.push([p.lat, p.lon]);
          }
        }
        let fitted = false;
        if (pts.length >= 2 && mapEl.clientWidth > 0 && mapEl.clientHeight > 0) {
          try {
            userGestureActive = false;
            const bounds = leaflet.latLngBounds(pts);
            map.fitBounds(bounds, { padding: [34, 34], maxZoom: 14, animate: false });
            fitted = true;
          } catch {}
        }
        if (!fitted) {
          map.setView([centerLat, centerLon], 13, { animate: false });
        }
      }

      updateUserSearchOverlays(centerLat, centerLon);
      ensureOsmTileLayer();
      isLoadingMap = false;

      const initW = mapEl.clientWidth;
      const initH = mapEl.clientHeight;
      resizeTimer = setTimeout(() => {
        resizeTimer = null;
        if (!map || !mapEl) return;
        if (mapEl.clientWidth !== initW || mapEl.clientHeight !== initH) {
          userGestureActive = false;
          map.invalidateSize();
          syncMapToActiveOrFiltered(false);
        }
      }, 120);

      map.on('moveend', () => {
        if (!map || !userGestureActive) return;
        userGestureActive = false;
        const c = map.getCenter();
        const distFromActive = haversineKm(centerLat, centerLon, c.lat, c.lng);
        const bounds = map.getBounds?.();
        const visibleWidthKm = bounds
          ? haversineKm(c.lat, bounds.getWest(), c.lat, bounds.getEast())
          : 4;
        const panThresholdKm = Math.min(1.8, Math.max(0.45, visibleWidthKm * 0.42));
        if (distFromActive >= panThresholdKm) {
          pannedCenter = { lat: c.lat, lon: c.lng };
        } else {
          pannedCenter = null;
        }
      });

      renderMarkers();
      if (activeInit && isDesktopInit) {
        const m = markerById.get(activeInit.id);
        if (m) {
          userGestureActive = false;
          m.openPopup();
        }
      }
    } catch {
      if (destroyed) return;
      isLoadingMap = false;
      mapBootError =
        'Interaktivní podklad se nepodařilo vykreslit, ale seznam nejbližších ověřených míst níže funguje naplno.';
    } finally {
      mapInitializing = false;
    }
  }

  onMount(() => {
    destroyed = false;
    let nearReturnTimer = null;
    soundMuted = isSoundMuted();

    const checkNearReturn = () => {
      if (nearReturnPlace) return;
      if (nearReturnTimer) {
        clearTimeout(nearReturnTimer);
        nearReturnTimer = null;
      }
      const elapsedMem = awaitingNearPlace ? Date.now() - nearLeaveTimestamp : 0;
      const persisted = consumePendingPartnerReturn(3000, {
        surfacePrefix: 'near',
        allowEmptySurface: true
      });
      if (elapsedMem >= 3000 || persisted) {
        if (awaitingNearPlace && !persisted) {
          consumePendingPartnerReturn(0, { surfacePrefix: 'near', allowEmptySurface: true });
        }
        const targetId = persisted?.id || awaitingNearPlace?.id;
        const foundPlace = places.find((pl) => pl.id === targetId);
        const resolved = foundPlace
          ? toPlaceAction(foundPlace)
          : awaitingNearPlace ||
            (persisted
              ? { id: persisted.id, title: persisted.title || 'Místo pomoci', category: persisted.category || 'ngo' }
              : null);
        if (resolved) {
          nearReturnPlace = resolved;
          nearReturnMetric = 0;
          awaitingNearPlace = null;
          playPayoffAsmr(resolved);
          trackEvent('aa_partner_return_prompt', { surface: 'near', id: resolved.id });
        }
      } else {
        const remPersisted = getPendingPartnerReturnRemainingMs(3000, {
          surfacePrefix: 'near',
          allowEmptySurface: true
        });
        const remMem = awaitingNearPlace && elapsedMem > 0 ? Math.max(0, 3000 - elapsedMem) : 0;
        const rem = Math.max(remPersisted, remMem);
        if (rem > 0) {
          nearReturnTimer = setTimeout(checkNearReturn, rem + 30);
        }
      }
    };

    const onVis = () => {
      if (document.visibilityState === 'visible') checkNearReturn();
    };
    checkNearReturn();

    let wasDesktop = typeof window !== 'undefined' && window.innerWidth > 980;
    const onWindowResize = () => {
      if (typeof window === 'undefined' || destroyed) return;
      const nowDesktop = window.innerWidth > 980;
      if (nowDesktop) {
        if (!map) {
          void initMap();
        } else {
          map.invalidateSize();
          if (!wasDesktop) {
            renderMarkers();
            syncMapToActiveOrFiltered();
          }
        }
      } else if (map) {
        map.closePopup();
        if (mobileView === 'map') {
          map.invalidateSize();
        }
      }
      wasDesktop = nowDesktop;
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', checkNearReturn);
    window.addEventListener('pageshow', checkNearReturn);
    window.addEventListener('resize', onWindowResize, { passive: true });

    (async () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const placeP = sp.get('place');
        if (placeP) {
          activePlaceId = placeP;
          const curatedMatch =
            CURATED_FALLBACK_PLACES.find((c) => c.id === placeP) ||
            LOCAL_COMMUNITY_ITEMS.find((c) => c.id === placeP);
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

        if (kindsP.length) {
          kinds = kindsP;
          if (kindsP.length === 1 && kindsP[0] === 'animals') activePresetId = 'animals';
          else if (kindsP.length === 1 && kindsP[0] === 'community') activePresetId = 'community';
          else if (kindsP.includes('food') && !kindsP.includes('ngo') && !kindsP.includes('animals')) activePresetId = 'food';
          else if (kindsP.length === 4) activePresetId = 'all';
        }
        if (Number.isFinite(rP) && rP > 0) {
          radiusKm = rP > 100 ? Math.min(25, Math.round(rP / 1000)) : Math.min(25, Math.max(1, Math.round(rP)));
        }
        if (
          Number.isFinite(latP) &&
          Number.isFinite(lonP) &&
          Math.abs(latP) <= 90 &&
          Math.abs(lonP) <= 180 &&
          Math.abs(latP) > 1 &&
          Math.abs(lonP) > 1
        ) {
          centerLat = latP;
          centerLon = lonP;
          const mCity = CZECH_CITIES.find((c) => haversineKm(c.lat, c.lon, latP, lonP) < 12);
          if (mCity) selectedCity = mCity;
        }
      } catch {}

      places = getInstantCurated(centerLat, centerLon, ALL_KINDS);

      const isDesktop = typeof window !== 'undefined' && window.innerWidth > 980;
      if (isDesktop || mobileView === 'map') {
        await initMap();
      } else {
        isLoadingMap = false;
      }

      await fetchNearby(centerLat, centerLon);
      if (activePlaceId) {
        await tick();
        renderMarkers();
        const el = document.getElementById(`place-card-${String(activePlaceId).replace(/[^a-zA-Z0-9_-]/g, '-')}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const targetPlace = places.find((item) => item.id === activePlaceId);
        if (targetPlace && typeof window !== 'undefined' && window.innerWidth > 980) {
          openPlacePopupCenteredOnDesktop(targetPlace);
        }
      }
    })();

    return () => {
      destroyed = true;
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', checkNearReturn);
      window.removeEventListener('pageshow', checkNearReturn);
      window.removeEventListener('resize', onWindowResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (nearReturnTimer) clearTimeout(nearReturnTimer);
      if (touchHintTimer) clearTimeout(touchHintTimer);
      if (nearbyAbortController) nearbyAbortController.abort();
      if (map) {
        try { map.stop(); } catch {}
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
  <PageHeader
    kicker="MAPA POMOCI V OKOLÍ · CELÁ ČR"
    title="Kde můžeš pomoct "
    titleAccent="kousek od sebe"
    subtitle="Ověřené útulky, potravinové banky, šatníky, komunitní zahrady i veřejné knihobudky — s jasným přehledem, jak se zapojit."
    class="near-page-header"
  />

  <!-- UNIFIED SEARCH + FILTER BAR -->
  <div class="controls-card" class:filters-open={filtersOpen}>
    <div class="controls-top search-capsule">
      <button type="button" class="gps-btn" onclick={useGps} disabled={gpsStatus === 'requesting'}>
        <AppIcon name="navigation" size={15} />
        <span>{gpsStatus === 'requesting' ? 'Hledám…' : 'Moje poloha'}</span>
      </button>

      <div class="search-box">
        <input
          type="text"
          id="near-location-query"
          name="location"
          autocomplete="address-level2"
          bind:value={locationQuery}
          placeholder="Obec nebo PSČ (např. Tábor)"
          aria-label="Hledat obec nebo PSČ"
          onkeydown={(e) => e.key === 'Enter' && searchLocation()}
        />
        <button type="button" class="btn-find" onclick={searchLocation}>
          <AppIcon name="search" size={14} />
          <span>{geoStatus === 'loading' ? 'Hledám…' : 'Najít'}</span>
        </button>
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
          <button type="button" class="geo-opt" onclick={() => pickGeocodeResult(t)}>
            <strong><AppIcon name="map-pin" size={14} /><span>{t.label.split(',')[0]}</span></strong>
            <span>{t.label} · okamžitý přesun</span>
          </button>
        {/each}
      </div>
    {/if}
    {#if geoResults.length > 0}
      <div class="geo-dropdown">
        {#each geoResults as r}
          <button type="button" class="geo-opt" onclick={() => pickGeocodeResult(r)}>
            <strong>{r.label.split(',')[0]}</strong>
            <span>{r.label}</span>
          </button>
        {/each}
      </div>
    {/if}

    <div class="controls-presets-row">
      <div class="presets-bar" role="group" aria-label="Co na mapě hledáš">
        {#each CATEGORY_PRESETS as preset}
          <button
            type="button"
            class="preset-pill"
            class:active={activePresetId === preset.id}
            aria-pressed={activePresetId === preset.id}
            onclick={() => applyPreset(preset)}
          >
            <AppIcon name={preset.icon} size={14} />
            <span>{preset.label}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="controls-utility-row">
      <details class="near-filters-drawer" bind:open={filtersOpen}>
        <summary class="near-filters-summary">
          <AppIcon name="sliders-horizontal" size={15} />
          <span>Filtrovat</span>
          {#if activeFilterCount > 0}
            <span class="filter-count-badge" aria-label={`Aktivní filtry: ${activeFilterCount}`}>{activeFilterCount}</span>
          {/if}
        </summary>
        <div class="near-filters-body">
          <select
            id="near-city-jump"
            name="city"
            autocomplete="off"
            class="city-jump-select"
            aria-label="Rychlý skok do krajského města"
            onchange={(e) => {
              const found = CZECH_CITIES.find((c) => c.id === e.currentTarget.value);
              if (found) selectQuickCity(found);
            }}
          >
            <option value="">Krajská města…</option>
            {#each CZECH_CITIES as city}
              <option
                value={city.id}
                selected={Math.abs(centerLat - city.lat) < 0.05 && Math.abs(centerLon - city.lon) < 0.05}
              >
                {city.name}
              </option>
            {/each}
          </select>

          <div class="radius-box" role="group" aria-label="Okruh hledání v kilometrech">
            <span class="radius-label">Okruh:</span>
            <div class="radius-pills">
              {#each RADIUS_PRESETS as rKm}
                <button
                  type="button"
                  class="radius-pill"
                  class:active={radiusKm === rKm}
                  aria-pressed={radiusKm === rKm}
                  onclick={() => setRadiusKm(rKm)}
                >
                  {rKm} km
                </button>
              {/each}
            </div>
          </div>

          <div class="list-filters">
            {#if places.length > 3 || query.trim().length > 0}
              <input
                type="search"
                id="near-list-filter"
                name="q"
                autocomplete="off"
                aria-label="Hledat v seznamu míst"
                class="filter-input"
                placeholder="Hledat v seznamu…"
                bind:value={query}
              />
            {/if}
            <select bind:value={sortBy} id="near-sort" name="sort" autocomplete="off" class="sort-select" aria-label="Řazení míst">
              <option value="easy">Nejjednodušší start</option>
              <option value="distance">Podle vzdálenosti</option>
              <option value="name">Abecedně A–Z</option>
            </select>
          </div>

          <div class="source-tier-bar" role="group" aria-label="Filtrovat podle stupně ověření zdroje">
            {#each SOURCE_FILTERS as sf}
              <button
                type="button"
                class="source-chip"
                class:active={sourceFilter === sf.id}
                aria-pressed={sourceFilter === sf.id}
                onclick={() => setSourceFilter(sf.id)}
              >
                {#if sf.icon}
                  <AppIcon name={sf.icon} size={13} />
                {/if}
                <span>{sf.label}</span>
              </button>
            {/each}
          </div>
        </div>
      </details>

      <div class="controls-links">
        <button
          type="button"
          class="text-util-btn"
          aria-label={shareMessage || 'Sdílet výřez mapy'}
          onclick={copyShareLink}
        >
          <AppIcon name={shareMessage ? 'check' : 'share-2'} size={14} />
          {#if shareMessage}
            <span>{shareMessage}</span>
          {:else}
            <span class="share-label-full">Sdílet výřez</span>
            <span class="share-label-short">Sdílet</span>
          {/if}
        </button>
        <a href="/submit" class="text-util-link">
          <AppIcon name="plus" size={14} />
          <span>Přidat místo</span>
        </a>
      </div>
    </div>
  </div>

  {#if allOutsideRadius || isRadiusExpanded}
    <div class="smart-nearest-banner" role="status">
      <AppIcon name="map-pin" size={15} />
      <span>V okruhu {radiusKm} km jsme našli méně míst — ukazujeme i nejbližší ověřené možnosti v tvém regionu.</span>
    </div>
  {/if}

  <!-- MOBILE & TABLET VIEW SWITCHER -->
  <div class="mobile-tabs" role="tablist" aria-label="Přepnout zobrazení seznamu a mapy">
    <button
      type="button"
      role="tab"
      aria-selected={mobileView === 'list'}
      class:active={mobileView === 'list'}
      onclick={() => setMobileMode('list')}
    >
      <AppIcon name="list" size={15} />
      <span>Seznam ({filteredPlaces.length})</span>
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={mobileView === 'map'}
      class:active={mobileView === 'map'}
      onclick={() => setMobileMode('map')}
    >
      <AppIcon name="map" size={15} />
      <span>Mapa ({filteredPlaces.length})</span>
    </button>
  </div>

  <!-- SPLIT VIEW: INTERACTIVE LEAFLET MAP + CLEAN ACTIONABLE CARDS -->
  <div class="split-layout">
    <div class="map-column" class:hidden-mob={mobileView === 'list'}>
      <div class="map-frame">
        <div class="map-stage">
          {#if isLoadingMap}
            <div class="map-status-pill">Spouštím mapu…</div>
          {:else if isFetching}
            <div class="map-status-pill">Aktualizuji okolí…</div>
          {/if}

          {#if pannedCenter && !isFetching}
            <button
              type="button"
              class="search-area-btn"
              onclick={searchPannedArea}
            >
              <AppIcon name="refresh-cw" size={14} />
              <span>Hledat v této oblasti mapy</span>
            </button>
          {/if}

          <div class="map-floating-tools">
            <button
              type="button"
              class="tile-switch-btn"
              class:active={tileStyle === 'calm'}
              aria-pressed={tileStyle === 'calm'}
              title={tileStyle === 'calm' ? 'Přepnout na kontrastní mapu' : 'Přepnout na jemný podklad'}
              onclick={toggleTileStyle}
            >
              <AppIcon name={tileStyle === 'calm' ? 'leaf' : 'map'} size={14} />
              <span>{tileStyle === 'calm' ? 'Jemný podklad' : 'Kontrastní mapa'}</span>
            </button>
          </div>

          {#if mapBootError}
            <div class="map-error-box">{mapBootError}</div>
          {/if}

          {#if touchGestureHint}
            <div class="map-gesture-hint" role="status">
              Posuň mapu dvěma prsty
            </div>
          {/if}

          <div
            bind:this={mapEl}
            class="leaflet-canvas map-canvas"
            class:is-calm-tiles={tileStyle === 'calm'}
            class:is-crisp-tiles={tileStyle === 'crisp'}
            class:map-expanded={mobileView === 'map'}
          ></div>
        </div>

        <div class="map-foot-hint">
          <span class="legend-group">
            <span class="legend-item"><AppIcon name="star" size={12} /><span>Ověřená organizace</span></span>
            <span aria-hidden="true">·</span>
            <span class="legend-item"><AppIcon name="sprout" size={12} /><span>Komunitní tip</span></span>
            <span aria-hidden="true">·</span>
            <span class="legend-item"><AppIcon name="map" size={12} /><span>Orientační bod OSM</span></span>
          </span>
          <span>Posuň mapu kamkoliv po ČR pro hledání v novém výřezu.</span>
        </div>
      </div>

      {#if mobileView === 'map' && activePlaceObj}
        {@const activeWeb = normalizeUrl(activePlaceObj.website)}
        {@const activePhone = sanitizePhone(activePlaceObj.phone)}
        {@const activeTpl = buildFirstContactTemplate(activePlaceObj)}
        <div class="map-active-sheet" role="region" aria-label="Vybrané místo na mapě">
          <div class="mas-top">
            <div>
              <span class="mas-meta">
                {activePlaceObj.subcategory || KIND_META[activePlaceObj.kind]?.label} · {formatDist(activePlaceObj.distanceKm)}
              </span>
              <strong class="mas-title">{activePlaceObj.name}</strong>
            </div>
            <button type="button" class="mas-close" aria-label="Zavřít náhled" onclick={() => (activePlaceId = null)}>
              <AppIcon name="x" size={16} />
            </button>
          </div>
          <p class="mas-mission">{getPlaceActionHint(activePlaceObj)}</p>
          <div class="mas-actions">
            {#if activeWeb}
              <a
                href={activeWeb}
                target="_blank"
                rel="noopener noreferrer"
                class="near-btn primary"
                onclick={() => handleStartNearPlace(activePlaceObj)}
              >
                <span>Web</span>
                <AppIcon name="arrow-up-right" size={14} />
              </a>
            {/if}
            <a
              href={`https://mapy.cz/zakladni?x=${activePlaceObj.lon}&y=${activePlaceObj.lat}&z=17&q=${encodeURIComponent(activePlaceObj.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              class={activeWeb ? 'near-btn ghost' : 'near-btn primary'}
              onclick={() => handleStartNearPlace(activePlaceObj)}
            >
              <AppIcon name="compass" size={14} />
              <span>Mapy.cz</span>
              <AppIcon name="arrow-up-right" size={14} />
            </a>
            {#if activePhone}
              <a
                href={`tel:${activePhone.replace(/[^\d+]/g, '')}`}
                class="near-btn ghost"
                onclick={() => handleStartNearPlace(activePlaceObj)}
              >
                <AppIcon name="phone" size={14} />
                <span>Zavolat</span>
              </a>
            {/if}
            {#if activeTpl?.mailtoUrl}
              <a
                href={activeTpl.mailtoUrl}
                class="near-btn ghost"
                onclick={() => handleStartNearPlace(activePlaceObj)}
              >
                <AppIcon name="mail" size={14} />
                <span>E-mail</span>
              </a>
            {/if}
            <button type="button" class="near-btn ghost" onclick={() => focusPlaceInList(activePlaceObj)}>
              <AppIcon name="list" size={14} />
              <span>Detail v seznamu</span>
            </button>
          </div>
        </div>
      {/if}
    </div>

    <div class="list-column" class:hidden-mob={mobileView === 'map'}>
      <div class="list-toolbar">
        <div class="count-heading">
          <strong>{filteredPlaces.length}</strong>
          {filteredPlaces.length === 0
            ? 'míst v okolí'
            : filteredPlaces.length === 1
              ? 'místo pomoci v okolí'
              : filteredPlaces.length >= 2 && filteredPlaces.length <= 4
                ? 'místa pomoci v okolí'
                : 'míst pomoci v okolí'}
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
              <AppIcon name="sparkles" size={15} />
              <span>Vítej zpět z místa {nearReturnPlace.title}! Povedlo se?</span>
            </span>
            <span class="impact-payoff-badge">
              {getActionEffectMeta(nearReturnPlace, nearReturnMetric, { isReturnStrip: true }).badge}
            </span>
          </div>
          <canvas
            class="impact-payoff-canvas"
            width="320"
            height="118"
            aria-label="Fyzikální vizualizace dopadu dobrého skutku"
            use:impactCanvas={{
              action: nearReturnPlace,
              climax: true,
              onProgress: (v) => {
                nearReturnMetric = v;
              }
            }}
          ></canvas>
          <div class="return-dopamine-actions">
            <button
              type="button"
              class="btn-return-complete"
              onclick={() => {
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
              <AppIcon name="check" size={15} />
              <span>Hotovo – rozsvítit stopu</span>
            </button>
            <button
              type="button"
              class="btn-return-dismiss"
              onclick={() => (nearReturnPlace = null)}
            >
              Později
            </button>
          </div>
        </div>
      {/if}

      <!-- PLACES CARDS -->
      <div class="places-stack places-grid">
        {#each visiblePlaces as p, idx (p.id)}
          <PlaceCard
            {p}
            {idx}
            isActive={activePlaceId === p.id}
            isTopPick={idx === 0 && sortBy === 'easy'}
            isStarted={Array.isArray($startedActionIds) && $startedActionIds.includes(p.id)}
            {soundMuted}
            {activeEffectPlaceId}
            {openTemplateId}
            {copiedTemplateId}
            {copiedPlaceLinkId}
            placeMetric={placeMetrics[p.id] || 0}
            onMouseEnter={() => setHoveredPlace(p.id)}
            onMouseLeave={() => setHoveredPlace(null)}
            onStart={handleStartNearPlace}
            onDone={(place) =>
              recordSmallWin({
                id: place.id,
                title: `Místní krok: ${place.name}`,
                category: place.kind,
                surface: 'near'
              })}
            onToggleEffect={togglePlaceEffect}
            onToggleSound={handleToggleSound}
            onFocusMap={focusPlaceOnMap}
            onShare={sharePlaceLink}
            onToggleTemplate={(place) => {
              openTemplateId = openTemplateId === place.id ? null : place.id;
            }}
            onCopyTemplate={copyTemplateText}
          />
        {:else}
          <div class="near-empty-fallback">
            <h2>V okruhu {radiusKm} km teď neodpovídá žádné místo zvolenému filtru</h2>
            <p>
              {#if query.trim()}
                Hledaný výraz <strong>„{query.trim()}“</strong> v aktuálním výřezu nenašel shodu.
              {:else if sourceFilter !== 'all'}
                Pro zvolený filtr zdroje zde teď nejsou záznamy — přepni na všechny zdroje nebo rozšiř okruh.
              {:else if onlyWithWebsite}
                V tomto okruhu jsou především komunitní místa bez vlastního webu (např. veřejné knihobudky).
              {:else}
                V menších obcích nemusí být organizace zanesená přímo v okruhu {radiusKm} km.
              {/if}
            </p>
            <div class="near-empty-actions">
              <button type="button" class="near-btn primary" onclick={resetAndExpandSearch}>
                Rozšířit okruh na 15 km a zrušit filtry
              </button>
              <a href="/app/online" class="near-btn ghost">
                <span>Zkusit 2minutový skutek online</span>
                <AppIcon name="arrow-right" size={14} strokeWidth={2} />
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
                        onclick={() => {
                          query = '';
                          onlyWithWebsite = false;
                          sourceFilter = 'all';
                          kinds = ['ngo', 'community', 'food', 'animals'];
                          moveMapCenter(org.lat, org.lon, 13);
                          fetchNearby(org.lat, org.lon);
                        }}
                      >
                        <span>Přejít sem</span>
                        <AppIcon name="arrow-right" size={14} strokeWidth={2} />
                      </button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      {#if filteredPlaces.length > visibleCount}
        {@const nextBatch = Math.min(6, filteredPlaces.length - visibleCount)}
        <div class="calm-more-wrap near-more-wrap">
          <button
            type="button"
            class="calm-more-btn"
            onclick={async () => {
              visibleCount += 6;
              await tick();
              fitMapToFilteredPlaces();
            }}
          >
            Ukázat {nextBatch === 1
              ? 'další 1 místo'
              : nextBatch <= 4
                ? `další ${nextBatch} místa`
                : `dalších ${nextBatch} míst`} ({filteredPlaces.length - visibleCount} zbývá)
          </button>
          {#if filteredPlaces.length - visibleCount > 6}
            <button
              type="button"
              class="near-show-all"
              onclick={async () => {
                visibleCount = filteredPlaces.length;
                await tick();
                fitMapToFilteredPlaces();
              }}
            >
              Rozbalit všechna místa ({filteredPlaces.length})
            </button>
          {/if}
        </div>
      {/if}

      <details class="calm-drawer extra-drawer">
        <summary>Hledáš jednorázovou víkendovku nebo celostátní portál? (4 portály)</summary>
        <div class="portals-mini-grid">
          {#each PORTALS.slice(0, 4) as portal}
            <a href={portal.url} target="_blank" rel="noopener noreferrer" class="portal-mini">
              <strong>
                <span>{portal.title}</span>
                <AppIcon name="arrow-up-right" size={13} />
              </strong>
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
    width: 100%;
    max-width: 1140px;
    margin-inline: auto;
    padding: 0.25rem 1.25rem 3rem;
    box-sizing: border-box;
    overflow-x: clip;
  }

  /* Controls Card */
  .controls-card {
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-forest, #c5d9cd);
    border-radius: 16px;
    padding: 0.72rem 0.9rem;
    box-shadow: var(--shadow-sm);
    margin-bottom: 0.75rem;
    max-width: 100%;
    box-sizing: border-box;
  }

  .controls-top {
    display: flex;
    gap: 0.45rem;
    align-items: center;
    flex-wrap: nowrap;
  }

  .gps-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0.45rem 0.78rem;
    border-radius: 10px;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-strong, #c2cec5);
    color: var(--accent-primary, #1b5e42);
    font-family: var(--font-sans);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    box-sizing: border-box;
    transition: background-color 0.16s ease, color 0.16s ease;
  }

  .gps-btn:hover {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    border-color: var(--accent-primary, #1b5e42);
  }

  .search-box {
    flex: 1;
    min-width: 0;
    display: flex;
    gap: 0.35rem;
  }

  .search-box input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: 0.45rem 0.72rem;
    border-radius: 10px;
    border: 1px solid var(--border-subtle, #dce3dd);
    font-family: var(--font-sans);
    font-size: 0.88rem;
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    box-sizing: border-box;
  }

  .btn-find {
    min-height: 44px;
    min-width: 44px;
    padding: 0.45rem 0.88rem;
    border-radius: 10px;
    border: 1px solid var(--accent-primary, #1b5e42);
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    box-sizing: border-box;
  }

  .btn-find:hover {
    background: var(--accent-primary-hover, #144732);
    border-color: var(--accent-primary-hover, #144732);
  }

  .info-note {
    margin-top: 0.45rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--accent-primary, #1b5e42);
  }

  .geo-dropdown {
    margin-top: 0.45rem;
    display: grid;
    gap: 0.3rem;
  }

  .geo-opt {
    text-align: left;
    min-height: 44px;
    padding: 0.5rem 0.75rem;
    border-radius: 11px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-surface, #ffffff);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
    box-sizing: border-box;
  }

  .geo-opt strong {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--ink-primary, #14281d);
  }

  .geo-opt span {
    font-size: 0.76rem;
    color: var(--ink-muted, #516659);
  }

  .controls-presets-row {
    margin-top: 0.55rem;
    padding-top: 0.55rem;
    border-top: 1px solid var(--border-subtle, #dce3dd);
  }

  .presets-bar {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .preset-pill {
    min-height: 44px;
    min-width: 44px;
    padding: 0.4rem 0.78rem;
    border-radius: 999px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.78rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    box-sizing: border-box;
    transition: background-color 0.16s ease, border-color 0.16s ease;
  }

  .preset-pill:hover {
    border-color: var(--accent-primary, #1b5e42);
    background: var(--bg-surface, #ffffff);
  }

  .preset-pill.active {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    border-color: var(--accent-primary, #1b5e42);
  }

  .controls-utility-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-top: 0.55rem;
    padding-top: 0.55rem;
    border-top: 1px solid var(--border-subtle, #dce3dd);
  }

  .near-filters-drawer {
    flex: 0 0 auto;
    min-width: 0;
  }

  .near-filters-drawer[open] {
    flex: 1 1 560px;
  }

  .near-filters-summary {
    list-style: none;
    min-height: 44px;
    min-width: 44px;
    padding: 0.42rem 0.78rem;
    border-radius: 10px;
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    box-sizing: border-box;
  }

  .near-filters-summary::-webkit-details-marker {
    display: none;
  }

  .filter-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.35rem;
    border-radius: 999px;
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1;
  }

  .near-filters-body {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .city-jump-select {
    min-height: 44px;
    padding: 0.4rem 0.65rem;
    border-radius: 10px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-surface, #ffffff);
    font-family: var(--font-sans);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--ink-primary, #14281d);
    cursor: pointer;
    box-sizing: border-box;
  }

  .radius-box {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    color: var(--ink-secondary, #3f574a);
  }

  .radius-label {
    font-weight: 700;
    white-space: nowrap;
  }

  .radius-pills {
    display: inline-flex;
    gap: 0.22rem;
    background: var(--bg-subtle, #edf2ee);
    padding: 0.18rem;
    border-radius: 999px;
    border: 1px solid var(--border-subtle, #dce3dd);
  }

  .radius-pill {
    min-height: 44px;
    min-width: 44px;
    padding: 0.32rem 0.62rem;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: var(--ink-secondary, #3f574a);
    font-family: var(--font-sans);
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .radius-pill.active {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  .list-filters {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .filter-input {
    min-height: 44px;
    padding: 0.4rem 0.7rem;
    border-radius: 10px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-surface, #ffffff);
    font-family: var(--font-sans);
    font-size: 0.82rem;
    color: var(--ink-primary, #14281d);
    box-sizing: border-box;
  }

  .sort-select {
    min-height: 44px;
    padding: 0.4rem 0.7rem;
    border-radius: 10px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-surface, #ffffff);
    font-family: var(--font-sans);
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--ink-primary, #14281d);
    box-sizing: border-box;
  }

  .source-tier-bar {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
    width: 100%;
  }

  .source-chip {
    min-height: 44px;
    min-width: 44px;
    padding: 0.35rem 0.72rem;
    border-radius: 999px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-secondary, #3f574a);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
    box-sizing: border-box;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .source-chip.active {
    background: var(--accent-primary, #1b5e42);
    border-color: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  .controls-links {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .text-util-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0.42rem 0.75rem;
    border-radius: 10px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-secondary, #3f574a);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.78rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
    box-sizing: border-box;
  }

  .share-label-short {
    display: none;
  }

  .text-util-btn:hover {
    color: var(--ink-primary, #14281d);
    border-color: var(--border-strong, #c2cec5);
  }

  .text-util-link {
    min-height: 44px;
    min-width: 44px;
    padding: 0.42rem 0.78rem;
    border-radius: 10px;
    border: 1px solid var(--accent-primary, #1b5e42);
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.78rem;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    box-sizing: border-box;
  }

  .text-util-link:hover {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  .smart-nearest-banner {
    margin-bottom: 0.65rem;
    padding: 0.5rem 0.85rem;
    border-radius: 12px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    color: var(--ink-secondary, #3f574a);
    font-size: 0.81rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .mobile-tabs {
    display: none;
    gap: 0.4rem;
    margin-bottom: 0.65rem;
  }

  .mobile-tabs button {
    flex: 1;
    min-height: 44px;
    min-width: 44px;
    padding: 0.5rem 0.65rem;
    border-radius: 11px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.84rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    box-sizing: border-box;
  }

  .mobile-tabs button.active {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    border-color: var(--accent-primary, #1b5e42);
  }

  /* Split Layout */
  .split-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.06fr) minmax(0, 0.94fr);
    gap: 1.1rem;
    align-items: start;
  }

  .map-column,
  .list-column {
    min-width: 0;
    max-width: 100%;
  }

  .map-column {
    position: sticky;
    top: 5.5rem;
    scroll-margin-top: 5.25rem;
  }

  .map-frame {
    position: relative;
    z-index: 1;
    isolation: isolate;
    background: var(--bg-surface, #ffffff);
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid var(--border-subtle, #dce3dd);
    box-shadow: var(--shadow-md);
  }

  .map-stage {
    position: relative;
  }

  .leaflet-canvas {
    width: 100%;
    height: 440px;
    background: var(--bg-subtle, #edf2ee);
    z-index: 1;
  }

  .leaflet-canvas.is-calm-tiles :global(.leaflet-tile-pane) {
    filter: saturate(0.76) contrast(0.96) brightness(1.02) hue-rotate(-4deg);
    transition: filter 0.25s ease;
  }

  .leaflet-canvas.is-crisp-tiles :global(.leaflet-tile-pane) {
    filter: saturate(1.06) contrast(1.04);
    transition: filter 0.25s ease;
  }

  .map-status-pill {
    position: absolute;
    top: 12px;
    left: 64px;
    z-index: 500;
    padding: 0.35rem 0.78rem;
    border-radius: 999px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-strong, #c2cec5);
    color: var(--ink-primary, #14281d);
    font-size: 0.74rem;
    font-weight: 700;
    box-shadow: var(--shadow-sm);
    pointer-events: none;
  }

  .search-area-btn {
    position: absolute;
    bottom: 26px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 520;
    min-height: 44px;
    min-width: 44px;
    padding: 0.46rem 0.98rem;
    border-radius: 999px;
    border: 1px solid var(--accent-primary, #1b5e42);
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    box-sizing: border-box;
    transition: background-color 0.15s ease;
  }

  .search-area-btn:hover {
    background: var(--accent-primary-hover, #144732);
  }

  .map-floating-tools {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 500;
  }

  .tile-switch-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0.38rem 0.78rem;
    border-radius: 999px;
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    box-sizing: border-box;
  }

  .tile-switch-btn.active {
    border-color: var(--accent-primary, #1b5e42);
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
  }

  .map-active-sheet {
    position: relative;
    margin-top: 0.65rem;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-strong, #c2cec5);
    border-radius: 16px;
    padding: 0.78rem 0.95rem;
    box-shadow: var(--shadow-md);
  }

  @media (min-width: 981px) {
    .map-active-sheet {
      display: none;
    }
  }

  .mas-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .mas-meta {
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--accent-primary, #1b5e42);
  }

  .mas-title {
    display: block;
    font-size: 0.95rem;
    color: var(--ink-primary, #14281d);
  }

  .mas-close {
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    border-radius: 50%;
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .mas-mission {
    margin: 0.35rem 0 0.55rem;
    font-size: 0.8rem;
    color: var(--ink-secondary, #3f574a);
    line-height: 1.4;
  }

  .mas-actions {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .near-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0.48rem 0.9rem;
    border-radius: 12px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.82rem;
    text-decoration: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    box-sizing: border-box;
  }

  .near-btn.primary {
    background: var(--accent-primary, #1b5e42);
    border-color: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  .near-btn.primary:hover {
    background: var(--accent-primary-hover, #144732);
  }

  .near-btn.ghost {
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    border-color: var(--border-strong, #c2cec5);
  }

  .map-foot-hint {
    padding: 0.55rem 0.85rem;
    background: var(--bg-subtle, #edf2ee);
    border-top: 1px solid var(--border-subtle, #dce3dd);
    font-size: 0.74rem;
    color: var(--ink-secondary, #3f574a);
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .legend-group {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .map-error-box {
    padding: 0.75rem 1rem;
    background: var(--rowan-tint, #fbf0ed);
    border: 1px solid var(--rowan-border, #e5c1b8);
    color: var(--rowan-ink, #8a3b2c);
    font-size: 0.85rem;
  }

  /* List Column */
  .list-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .count-heading {
    font-size: 0.92rem;
    color: var(--ink-secondary, #3f574a);
  }

  .count-heading strong {
    font-size: 1.12rem;
    color: var(--ink-primary, #14281d);
  }

  .return-dopamine-title {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .btn-return-complete {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
  }

  .places-stack {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .map-gesture-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 650;
    background: var(--ink-primary, #14281d);
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.45rem 0.85rem;
    border-radius: 999px;
    pointer-events: none;
  }

  .near-empty-fallback {
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 18px;
    padding: 1.35rem 1.4rem;
    box-shadow: var(--shadow-sm);
  }

  .near-empty-fallback h2 {
    margin: 0 0 0.45rem;
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--ink-primary, #14281d);
  }

  .near-empty-fallback p {
    margin: 0 0 0.95rem;
    font-size: 0.88rem;
    line-height: 1.52;
    color: var(--ink-secondary, #3f574a);
  }

  .near-empty-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .nearest-verified-box {
    padding-top: 0.8rem;
    border-top: 1px solid var(--border-subtle, #dce3dd);
  }

  .nv-label {
    display: block;
    font-size: 0.76rem;
    font-weight: 800;
    color: var(--ink-muted, #516659);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.45rem;
  }

  .nv-list {
    display: flex;
    flex-direction: column;
    gap: 0.42rem;
  }

  .nv-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    flex-wrap: wrap;
    font-size: 0.84rem;
  }

  .nv-meta {
    color: var(--ink-muted, #516659);
    font-size: 0.77rem;
  }

  .nv-jump-btn {
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-weight: 700;
    min-height: 44px;
    min-width: 44px;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    box-sizing: border-box;
  }

  .nv-jump-btn:hover {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  .near-more-wrap {
    margin-top: 0.9rem;
  }

  .near-show-all {
    background: none;
    border: none;
    color: var(--ink-secondary, #3f574a);
    font-family: var(--font-sans);
    font-size: 0.8rem;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
    min-height: 44px;
    min-width: 44px;
    padding: 0.4rem 0.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .extra-drawer {
    margin-top: 0.85rem;
  }

  .portals-mini-grid {
    margin-top: 0.7rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .portal-mini {
    min-height: 44px;
    padding: 0.65rem 0.8rem;
    border-radius: 12px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    color: var(--ink-primary, #14281d);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 0.16rem;
    box-sizing: border-box;
    transition:
      border-color 0.16s ease,
      background-color 0.16s ease;
  }

  .portal-mini:visited {
    color: var(--ink-primary, #14281d);
  }

  .portal-mini:hover {
    border-color: var(--border-forest-strong, #a7c4b3);
    background: var(--bohemian-sage, #eef5f0);
  }

  .portal-mini strong {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.83rem;
    color: var(--accent-primary, #1b5e42);
  }

  .portal-mini span {
    font-size: 0.76rem;
    color: var(--ink-secondary, #3f574a);
    line-height: 1.38;
  }

  /* Custom Leaflet Controls & Pins */
  .map-frame :global(.leaflet-popup-content-wrapper) {
    border-radius: 14px;
    border: 1px solid var(--border-strong, #c2cec5);
    box-shadow: 0 10px 26px -6px rgba(18, 42, 30, 0.18);
    padding: 0;
  }

  .map-frame :global(.leaflet-popup-content) {
    margin: 10px 13px;
    line-height: 1.36;
  }

  .map-frame :global(.leaflet-popup-close-button) {
    top: 6px;
    right: 6px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink-secondary, #3f574a);
    font-size: 18px;
    line-height: 1;
    padding: 0;
    text-decoration: none;
  }

  .map-frame :global(.leaflet-popup-close-button:hover) {
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
  }

  .map-frame :global(.leaflet-control-zoom a) {
    min-width: 44px;
    min-height: 44px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    line-height: 1;
    box-sizing: border-box;
  }

  :global(.aa-map-pin) {
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.aa-map-pin .pin-bubble) {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid var(--pin-color, #1b5e42);
    box-shadow: 0 3px 10px rgba(18, 42, 30, 0.16);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  :global(.aa-map-pin .pin-glyph) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--pin-color, #1b5e42);
  }

  :global(.aa-map-pin .pin-bubble.is-curated) {
    background: var(--accent-warm-tint, #fef6e8);
    border: 2.5px solid var(--accent-primary, #1b5e42);
    box-shadow: 0 4px 12px rgba(18, 42, 30, 0.2);
  }

  :global(.aa-map-pin .pin-bubble.is-community) {
    background: var(--bg-subtle, #edf2ee);
    border: 2px solid var(--linden-canopy-ink, #2b5938);
  }

  :global(.aa-map-pin .pin-bubble.is-active) {
    transform: scale(1.16);
    border-color: var(--ink-primary, #14281d);
    box-shadow: 0 6px 16px rgba(18, 42, 30, 0.28);
  }

  :global(.aa-map-pin .pin-star),
  :global(.aa-map-pin .pin-leaf) {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent-warm-ink, #8f4b0e);
    color: #ffffff;
    font-style: normal;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(18, 42, 30, 0.2);
  }

  :global(.aa-map-pin .pin-leaf) {
    background: var(--accent-primary, #1b5e42);
  }

  :global(.aa-map-pin:hover .pin-bubble) {
    transform: scale(1.14);
  }

  @media (min-width: 981px) {
    .controls-card {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 0.55rem;
    }

    .controls-top {
      grid-column: 1;
      grid-row: 1;
    }

    .controls-utility-row {
      grid-column: 2;
      grid-row: 1;
      margin-top: 0;
      padding-top: 0;
      border-top: none;
      align-items: center;
      flex-wrap: nowrap;
      gap: 0.45rem;
    }

    .controls-card:not(.filters-open) .near-filters-drawer {
      flex: 0 0 auto;
    }

    .controls-card .info-note,
    .controls-card .geo-dropdown,
    .controls-presets-row {
      grid-column: 1 / -1;
    }

    .controls-card.filters-open .controls-utility-row {
      grid-column: 1 / -1;
      grid-row: auto;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-subtle, #dce3dd);
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .controls-card.filters-open .near-filters-drawer {
      flex: 1 1 560px;
    }
  }

  @media (min-width: 981px) and (max-width: 1024px) and (max-height: 820px) {
    .near-page :global(.page-header) {
      padding: 0.48rem 0 0.42rem;
      margin-bottom: 0.45rem;
    }

    .near-page :global(.page-header-kicker) {
      margin-bottom: 0.22rem;
    }

    .near-page :global(.page-header-title) {
      font-size: 1.72rem;
      line-height: 1.12;
    }

    .near-page :global(.page-header-subtitle) {
      margin-top: 0.16rem;
      font-size: 0.88rem;
      line-height: 1.38;
    }

    .controls-card {
      padding: 0.46rem 0.72rem;
      margin-bottom: 0.45rem;
    }

    .controls-presets-row {
      margin-top: 0.34rem;
      padding-top: 0.34rem;
    }

    .controls-card.filters-open .controls-utility-row {
      margin-top: 0.34rem;
      padding-top: 0.34rem;
    }

    .count-heading {
      font-size: 0.86rem;
    }
  }

  @media (max-width: 1024px) {
    .search-box input,
    .city-jump-select,
    .filter-input,
    .sort-select {
      font-size: 1rem;
    }
  }

  @media (max-width: 980px) {
    .mobile-tabs {
      display: flex;
    }
    .hidden-mob {
      display: none !important;
    }
    .split-layout {
      grid-template-columns: minmax(0, 1fr);
    }
    .map-column {
      position: static;
    }
    .leaflet-canvas {
      height: 500px;
    }
    .portals-mini-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .near-page {
      padding: 0.1rem 0.75rem 2rem;
    }

    :global(.near-page-header) {
      padding: 0.2rem 0 0.22rem;
      margin-bottom: 0.28rem;
    }

    :global(.near-page-header .page-header-kicker) {
      margin-bottom: 0.1rem;
    }

    :global(.near-page-header .page-header-subtitle) {
      display: none;
    }

    .controls-card {
      padding: 0.42rem 0.52rem;
      margin-bottom: 0.34rem;
      border-radius: 14px;
    }

    .controls-top {
      flex-wrap: nowrap;
      gap: 0.35rem;
    }

    .gps-btn {
      padding: 0.4rem 0.58rem;
      font-size: 0.76rem;
    }

    .search-box input {
      padding: 0.4rem 0.55rem;
      font-size: 1rem;
    }

    .btn-find {
      padding: 0.4rem 0.65rem;
      font-size: 0.78rem;
    }

    .controls-presets-row {
      margin-top: 0.32rem;
      padding-top: 0.32rem;
    }

    .presets-bar {
      flex-wrap: nowrap;
      overflow-x: auto;
      gap: 0.3rem;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      scroll-snap-type: x mandatory;
      padding-bottom: 0.08rem;
    }

    .presets-bar::-webkit-scrollbar {
      display: none;
    }

    .preset-pill {
      flex: 0 0 auto;
      white-space: nowrap;
      padding: 0.38rem 0.7rem;
      font-size: 0.76rem;
      scroll-snap-align: start;
    }

    .controls-utility-row {
      margin-top: 0.32rem;
      padding-top: 0.32rem;
      gap: 0.28rem;
      align-items: center;
    }

    .near-filters-drawer {
      flex: 0 0 auto;
    }

    .near-filters-summary {
      padding: 0.38rem 0.56rem;
      font-size: 0.75rem;
      gap: 0.26rem;
      white-space: nowrap;
    }

    .near-filters-drawer[open] {
      flex: 1 1 100%;
      width: 100%;
    }

    .near-filters-body {
      flex-direction: column;
      align-items: stretch;
      gap: 0.45rem;
      margin-top: 0.45rem;
    }

    .city-jump-select,
    .filter-input,
    .sort-select {
      font-size: 1rem;
      width: 100%;
      max-width: none;
      min-height: 44px;
    }

    .radius-box {
      width: 100%;
      flex-wrap: wrap;
    }

    .radius-pills {
      display: flex;
      flex: 1;
      width: 100%;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .radius-pill {
      flex: 1 1 auto;
      padding: 0.35rem 0.45rem;
      font-size: 0.75rem;
    }

    .list-filters {
      width: 100%;
      flex-direction: column;
      align-items: stretch;
    }

    .source-tier-bar {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      gap: 0.25rem;
      max-width: 100%;
    }

    .source-tier-bar::-webkit-scrollbar {
      display: none;
    }

    .source-chip {
      flex: 0 0 auto;
      white-space: nowrap;
      font-size: 0.74rem;
    }

    .controls-links {
      margin-left: auto;
      gap: 0.28rem;
    }

    .text-util-btn,
    .text-util-link {
      padding: 0.38rem 0.56rem;
      font-size: 0.75rem;
      gap: 0.26rem;
      white-space: nowrap;
    }

    .smart-nearest-banner {
      margin-bottom: 0.45rem;
      padding: 0.4rem 0.65rem;
      font-size: 0.75rem;
    }

    .mobile-tabs {
      margin-bottom: 0.34rem;
    }

    .split-layout {
      gap: 0.42rem;
    }

    .leaflet-canvas,
    .leaflet-canvas.map-expanded {
      height: min(48dvh, 360px);
      min-height: 260px;
    }

    .search-area-btn {
      bottom: 24px;
      font-size: 0.74rem;
      padding: 0.4rem 0.8rem;
    }

    .map-foot-hint {
      display: none;
    }

    .list-toolbar {
      margin-bottom: 0.28rem;
    }

    .count-heading {
      font-size: 0.82rem;
    }

    .places-stack {
      gap: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .controls-top {
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .search-box {
      flex: 1 1 100%;
      order: 1;
    }

    .gps-btn {
      order: 2;
    }

    .share-label-full {
      display: none;
    }

    .share-label-short {
      display: inline;
    }

    .near-filters-summary,
    .text-util-btn,
    .text-util-link {
      padding: 0.36rem 0.52rem;
      font-size: 0.74rem;
      gap: 0.24rem;
    }
  }
</style>
