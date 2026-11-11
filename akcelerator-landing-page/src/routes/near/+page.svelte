<script>
  import { onMount, tick } from 'svelte';
  import { replaceState } from '$app/navigation';
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
    getPendingPartnerReturnRemainingMs,
    triggerCanvasBurst,
    fetchAmbientPulse,
    describeAmbientPulse
  } from '../../lib/sensoryEngine.js';
  import { notifyMollySpark } from '../../lib/mollyStore.js';
  import { normSearchStr, safeGetItem } from '../../lib/utils.js';
  import PlaceCard from '../../lib/features/map/components/PlaceCard.svelte';

  const CATEGORY_PRESETS = [
    { id: 'all', label: '✨ Vše smysluplné v okolí', kinds: ['ngo', 'community', 'food', 'animals'], onlyWeb: false },
    { id: 'animals', label: '🐾 Útulky a zvířata', kinds: ['animals'], onlyWeb: false },
    { id: 'food', label: '🥫 Jídlo a šatníky', kinds: ['food', 'community'], onlyWeb: false },
    { id: 'community', label: '📚 Knihobudky a sousedé', kinds: ['community'], onlyWeb: false },
    { id: 'fast', label: '⚡ S přímým webem', kinds: ['ngo', 'community', 'food', 'animals'], onlyWeb: true }
  ];

  const SOURCE_FILTERS = [
    { id: 'all', label: 'Všechny zdroje' },
    { id: 'verified_org', label: '✦ Ověřené organizace' },
    { id: 'community', label: '🌱 Komunitní tipy' },
    { id: 'osm', label: '🗺️ Orientační body OSM' }
  ];

  const RADIUS_PRESETS = [2, 5, 8, 15, 25];

  const KIND_META = {
    ngo: { emoji: '🏛️', label: 'Neziskovka / spolek', color: '#059669' },
    community: { emoji: '🤝', label: 'Komunita / knihobudka', color: '#0d9488' },
    food: { emoji: '🥫', label: 'Potraviny a šatník', color: '#d97706' },
    animals: { emoji: '🐾', label: 'Zvířata a útulek', color: '#2563eb' }
  };

  const HELP_WAY_META = {
    food_donation: { icon: '🥫', label: 'Darovat potraviny' },
    material_dropoff: { icon: '🧥', label: 'Přinést věci / knihy' },
    one_off_help: { icon: '⚡', label: 'Jednorázová výpomoc' },
    regular_volunteering: { icon: '🤝', label: 'Dobrovolnictví' }
  };

  const VISIT_MODE_META = {
    drop_in: { icon: '🟢', label: 'Volně přístupné bez domlouvání' },
    opening_hours: { icon: '🕒', label: 'Otevírací doba' },
    by_agreement: { icon: '📅', label: 'Po domluvě' }
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

  let activePresetId = 'all';
  let sourceFilter = 'all'; // 'all' | 'verified_org' | 'community' | 'osm'
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
    return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`;
  }

  function isSelfServicePoint(p) {
    const text = `${p?.name || ''} ${p?.subcategory || ''}`.toLowerCase();
    return (
      /knihobudka|knihovnička|public_bookcase|give_box|reuse skříňka|freeshop|sdílená lednice|food_sharing|potravinová skříňka/.test(
        text
      ) ||
      (p?.visitMode === 'drop_in' && !p?.website && !p?.email && !p?.phone)
    );
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

  function getPlaceHelpWays(p) {
    if (Array.isArray(p?.helpWays) && p.helpWays.length > 0) {
      return p.helpWays.slice(0, 3);
    }
    if (isSelfServicePoint(p)) {
      const text = `${p?.name || ''} ${p?.subcategory || ''}`.toLowerCase();
      return /potravin|lednice|food/.test(text) ? ['food_donation'] : ['material_dropoff'];
    }
    if (p?.kind === 'animals') return ['material_dropoff', 'one_off_help'];
    if (p?.kind === 'food') return ['food_donation', 'material_dropoff', 'one_off_help'];
    if (p?.kind === 'community') return ['material_dropoff', 'one_off_help'];
    return ['regular_volunteering', 'one_off_help'];
  }

  function getPlaceVisitMode(p) {
    if (p?.visitMode && VISIT_MODE_META[p.visitMode]) return p.visitMode;
    if (isSelfServicePoint(p)) return 'drop_in';
    if (p?.opening_hours || p?.kind === 'food' || p?.kind === 'animals') return 'opening_hours';
    return 'by_agreement';
  }

  function getPlaceDescription(p) {
    if (p?.description) return p.description;
    const sub = p?.subcategory || KIND_META[p?.kind]?.label || 'Místo pomoci v okolí';
    if (isSelfServicePoint(p)) {
      return `${sub} — volně přístupné sousedské místo pro bezplatné sdílení knih nebo věcí.`;
    }
    return `${sub} působící ve tvém okolí${p?.address ? ` (${p.address})` : ''}.`;
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
      const raw = safeGetItem('aa_my_pending_submissions_v1', 'local');
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
  let tileStyle = 'calm'; // 'calm' | 'crisp'
  let tileFallbackUsed = false;
  let touchGestureHint = false;
  let touchHintTimer = null;
  let markersLayer = null;
  let userMarker = null;
  let radiusCircle = null;
  let isProgrammaticMove = false;
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
   * Seed verified & community places immediately at initialization (including SSR)
   * so the user never sees "0 míst v okolí" on first load and distances never jump.
   * @type {Array<any>}
   */
  let places = getInstantCurated(centerLat, centerLon, kinds);
  /** @type {Array<any>} */
  let communityItems = [];
  let activePlaceId = null;
  let hoveredPlaceId = null;
  let visibleCount = 3;
  let mobileView = 'list'; // 'list' | 'map'

  // First-contact template
  let openTemplateId = null;
  let copiedTemplateId = null;
  let copiedPlaceLinkId = null;
  let soundMuted = false;
  let activeEffectPlaceId = null;
  /** @type {Record<string, number>} */
  let placeMetrics = {};
  let nearReturnPlace = null;
  let nearReturnMetric = 0;
  let awaitingNearPlace = null;
  let nearLeaveTimestamp = 0;
  /** @type {any} */
  let ambientPulse = null;
  $: ambientPulseText = describeAmbientPulse(ambientPulse, {});

  function sanitizePulseText(msg) {
    return String(msg || '')
      .replace(/v Kladno\s*\([^)]*\)/gi, 'v Kladně')
      .replace(/v Karlovy Vary/gi, 'v Karlových Varech')
      .replace(/\s*\([^)]*\)/g, '');
  }

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
    if (sub.includes('knihobudka') || isSelfServicePoint(p)) {
      return 'Vezmi doma přečtenou knížku nebo zachovalou věc a při procházce ji sem vlož pro sousedy (0 Kč, bez domlouvání).';
    }
    if (p?.kind === 'animals') {
      return 'Ozvi se krátkou zprávou (tlačítko „Co napsat“): zeptej se na venčení, staré ručníky a deky nebo granule.';
    }
    if (p?.kind === 'food' || sub.includes('šatník')) {
      return 'Daruj trvanlivé jídlo či čisté sezónní oblečení, nebo nabídni dvě hodiny rukou při třídění.';
    }
    if (p?.kind === 'community') {
      return 'Stav se na sousedskou akci, nabídni drobnou výpomoc nebo přines věci do komunitního oběhu.';
    }
    return 'Klikni na „Co napsat“ — připravili jsme krátkou lidskou zprávu, se kterou snadno zjistíš, co se jim teď nejvíc hodí.';
  }

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

  $: candidatePlaces = (() => {
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
  })();

  $: withinRadiusPlaces = sortPlaceList(
    candidatePlaces.filter((p) => (p.distanceKm ?? 999) <= radiusKm),
    sortBy,
    activePresetId
  );

  $: isRadiusExpanded =
    !query.trim() &&
    candidatePlaces.length > withinRadiusPlaces.length &&
    withinRadiusPlaces.length < 3;

  $: filteredPlaces = (() => {
    if (query.trim()) return sortPlaceList(candidatePlaces, sortBy, activePresetId);
    if (withinRadiusPlaces.length >= 3) return withinRadiusPlaces;
    const outsideNearest = candidatePlaces
      .filter((p) => (p.distanceKm ?? 999) > radiusKm)
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
      .slice(0, Math.max(0, 3 - withinRadiusPlaces.length));
    return [...withinRadiusPlaces, ...outsideNearest];
  })();

  $: visiblePlaces = filteredPlaces.slice(0, visibleCount);
  $: allOutsideRadius =
    filteredPlaces.length > 0 &&
    filteredPlaces.every((p) => (p.distanceKm ?? 0) > radiusKm);
  $: activePlaceObj = filteredPlaces.find((p) => p.id === activePlaceId) || places.find((p) => p.id === activePlaceId) || null;

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
          color: '#10b981',
          weight: 2,
          opacity: 0.65,
          fillColor: '#10b981',
          fillOpacity: 0.07,
          interactive: false
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
    isProgrammaticMove = true;
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

  function fitMapToFilteredPlaces() {
    if (!map || !leaflet) return;
    const pts = [[centerLat, centerLon]];
    const topForBounds = filteredPlaces.slice(0, Math.max(visibleCount, 3));
    for (const p of topForBounds) {
      if (typeof p.lat === 'number' && typeof p.lon === 'number') {
        pts.push([p.lat, p.lon]);
      }
    }
    if (pts.length >= 2) {
      try {
        isProgrammaticMove = true;
        const bounds = leaflet.latLngBounds(pts);
        map.fitBounds(bounds, { padding: [34, 34], maxZoom: 14, animate: true });
      } catch {}
    }
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildPinHtml(p, isHighlighted) {
    const meta = KIND_META[p.kind] || KIND_META.ngo;
    const isCurated = !!p.curated || p.sourceType === 'verified_org';
    const isComm = p.sourceType === 'community';
    const badgeHtml = isCurated
      ? '<i class="pin-star" title="Ověřená organizace">★</i>'
      : isComm
        ? '<i class="pin-leaf" title="Komunitní tip">🌱</i>'
        : '';
    return `<div class="pin-bubble ${isCurated ? 'is-curated' : ''} ${isComm ? 'is-community' : ''} ${isHighlighted ? 'is-active' : ''}" style="--pin-color:${meta.color}"><span>${meta.emoji}</span>${badgeHtml}</div>`;
  }

  function buildPopupHtml(p) {
    const meta = KIND_META[p.kind] || KIND_META.ngo;
    const safeWeb = normalizeUrl(p.website);
    const mapyUrl = `https://mapy.cz/zakladni?x=${encodeURIComponent(p.lon)}&y=${encodeURIComponent(p.lat)}&z=17&q=${encodeURIComponent(p.name || '')}`;
    const visitMode = VISIT_MODE_META[getPlaceVisitMode(p)] || VISIT_MODE_META.by_agreement;
    const ways = getPlaceHelpWays(p)
      .map((w) => HELP_WAY_META[w])
      .filter(Boolean)
      .map(
        (m) =>
          `<span style="display:inline-block;font-size:10.5px;font-weight:700;background:#f0fdf4;border:1px solid rgba(5,150,105,0.22);color:#065f46;padding:2px 6px;border-radius:999px;margin:2px 3px 2px 0;">${m.icon} ${escapeHtml(m.label)}</span>`
      )
      .join('');
    const sourceBadge =
      p.curated || p.sourceType === 'verified_org'
        ? '✦ Ověřená organizace'
        : p.sourceType === 'community'
          ? '🌱 Komunitní tip'
          : '🗺️ Orientační bod OSM';

    const linksHtml = `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px;">
      ${safeWeb ? `<a href="${escapeHtml(safeWeb)}" target="_blank" rel="noopener noreferrer" style="font-weight:800;font-size:12px;color:#059669;text-decoration:none;">Web organizace ↗</a>` : ''}
      <a href="${escapeHtml(mapyUrl)}" target="_blank" rel="noopener noreferrer" style="font-weight:700;font-size:12px;color:#0f2d20;text-decoration:underline;">🧭 Navigovat (Mapy.cz) ↗</a>
    </div>`;

    return `<div style="font-family:'Plus Jakarta Sans',sans-serif;max-width:270px;line-height:1.42;">
      <div style="font-size:10.5px;font-weight:800;text-transform:uppercase;color:${meta.color};margin-bottom:2px;">
        ${escapeHtml(p.subcategory || meta.label)} • ${escapeHtml(formatDist(p.distanceKm))} • ${escapeHtml(sourceBadge)}
      </div>
      <div style="font-weight:800;font-size:14px;color:#0d2118;margin-bottom:3px;">${escapeHtml(p.name)}</div>
      ${p.address ? `<div style="font-size:11.5px;color:#3d5247;margin-bottom:4px;">📍 ${escapeHtml(p.address)}</div>` : ''}
      <div style="font-size:11.5px;color:#385245;margin-bottom:5px;">${escapeHtml(getPlaceDescription(p))}</div>
      <div style="margin-bottom:4px;">
        <span style="display:inline-block;font-size:10.5px;font-weight:700;color:#1e4633;margin-right:4px;">${visitMode.icon} ${escapeHtml(visitMode.label)}</span>
        ${ways}
      </div>
      <div style="font-size:11.5px;background:#ecfdf5;padding:6px 8px;border-radius:8px;color:#065f46;margin:5px 0;">
        <strong>Jak tu pomoct:</strong> ${escapeHtml(concreteActionHint(p))}
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
      const isHighlighted = p.id === activePlaceId || p.id === hoveredPlaceId;

      if (markerById.has(p.id)) {
        const existing = markerById.get(p.id);
        existing.setPopupContent(buildPopupHtml(p));
        existing.setZIndexOffset(isHighlighted ? 1000 : p.curated ? 300 : 0);
        const iconEl = existing.getElement?.();
        if (iconEl) {
          iconEl.classList.toggle('is-active', isHighlighted);
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
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const marker = leaflet.marker([p.lat, p.lon], {
        icon,
        riseOnHover: true,
        zIndexOffset: isHighlighted ? 1000 : p.curated ? 300 : 0
      });
      markerById.set(p.id, marker);

      marker.bindPopup(buildPopupHtml(p));

      marker.on('click', async () => {
        activePlaceId = p.id;
        if (typeof window !== 'undefined' && window.innerWidth <= 980) {
          setTimeout(() => map?.closePopup(), 0);
        }
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
  $: if (map && leaflet && (filteredPlaces || activePlaceId)) {
    renderMarkers();
  }

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
        )}&kinds=${encodeURIComponent(ALL_KINDS.join(','))}&include_associations=${includeAssociations ? '1' : '0'}`,
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
        fitMapToFilteredPlaces();
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
      replaceState(url, {});
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

  async function setRadiusKm(nextRadius) {
    radiusKm = nextRadius;
    updateRadiusOverlay(centerLat, centerLon);
    await fetchNearby(centerLat, centerLon);
  }

  async function applyPreset(preset) {
    // 0ms instant in-memory filter — no network call or map wipe needed!
    activePresetId = preset.id;
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
    visibleCount = 3;
    await tick();
    fitMapToFilteredPlaces();
  }

  async function searchPannedArea() {
    if (!pannedCenter) return;
    const { lat, lon } = pannedCenter;
    pannedCenter = null;
    query = '';
    moveMapCenter(lat, lon, map ? map.getZoom() : 13);
    await fetchNearby(lat, lon);
    trackEvent('aa_near_pan_search', { lat: Math.round(lat * 10000) / 10000, lon: Math.round(lon * 10000) / 10000 });
  }

  function resetAndExpandSearch() {
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

  async function focusPlaceOnMap(p) {
    activePlaceId = p.id;
    const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth <= 980;
    if (mobileView === 'list') {
      mobileView = 'map';
      await tick();
      map?.invalidateSize();
    }
    if (!map) return;
    isProgrammaticMove = true;
    map.flyTo([p.lat, p.lon], Math.max(map.getZoom(), 15), { duration: 0.45 });
    if (isMobileOrTablet) {
      map.closePopup();
    } else {
      const m = markerById.get(p.id);
      if (m) m.openPopup();
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
    if (map && mode === 'map') {
      map.invalidateSize();
      fitMapToFilteredPlaces();
    }
  }

  onMount(() => {
    let destroyed = false;
    let resizeTimer = null;
    let nearReturnTimer = null;
    soundMuted = isSoundMuted();

    const checkNearReturn = () => {
      if (nearReturnPlace) return;
      if (nearReturnTimer) {
        clearTimeout(nearReturnTimer);
        nearReturnTimer = null;
      }
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
        const remPersisted = getPendingPartnerReturnRemainingMs(3000);
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

    const pulseTimer = setTimeout(async () => {
      const pulse = await fetchAmbientPulse();
      ambientPulse = pulse;
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

      try {
        await import('leaflet/dist/leaflet.css');
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
          fitMapToFilteredPlaces();
        }, 120);

        map.on('moveend', () => {
          if (!map) return;
          if (isProgrammaticMove) {
            isProgrammaticMove = false;
            return;
          }
          const c = map.getCenter();
          const distFromActive = haversineKm(centerLat, centerLon, c.lat, c.lng);
          if (distFromActive >= 1.8) {
            pannedCenter = { lat: c.lat, lon: c.lng };
          } else {
            pannedCenter = null;
          }
        });

        await fetchNearby(centerLat, centerLon);
        if (activePlaceId) {
          await tick();
          const el = document.getElementById(`place-card-${String(activePlaceId).replace(/[^a-zA-Z0-9_-]/g, '-')}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          const m = markerById.get(activePlaceId);
          if (m) m.openPopup();
        }
      } catch {
        if (destroyed) return;
        isLoadingMap = false;
        mapBootError =
          'Interaktivní podklad se nepodařilo vykreslit, ale seznam nejbližších ověřených míst níže funguje naplno.';
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
      if (nearReturnTimer) clearTimeout(nearReturnTimer);
      if (touchHintTimer) clearTimeout(touchHintTimer);
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
    <div class="near-header-main">
      <div class="hero-kicker">MAPA POMOCI V OKOLÍ · CELÁ ČR</div>
      <h1 class="title">Kde můžeš pomoct <span class="serif-accent">kousek od sebe</span></h1>
    </div>
    <p class="subtitle">
      Ověřené útulky, potravinové banky, šatníky, komunitní zahrady i veřejné knihobudky — s jasným přehledem, jak se zapojit.
    </p>
  </header>

  <!-- UNIFIED SEARCH + FILTER BAR -->
  <div class="controls-card">
    <div class="controls-top search-capsule">
      <button type="button" class="gps-btn" on:click={useGps} disabled={gpsStatus === 'requesting'}>
        {gpsStatus === 'requesting' ? '📍 Hledám…' : '📍 Moje poloha'}
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
          on:keydown={(e) => e.key === 'Enter' && searchLocation()}
        />
        <button type="button" class="btn-find" on:click={searchLocation}>
          {geoStatus === 'loading' ? 'Hledám…' : 'Najít'}
        </button>
      </div>

      <select
        id="near-city-jump"
        name="city"
        autocomplete="off"
        class="city-jump-select"
        aria-label="Rychlý skok do krajského města"
        on:change={(e) => {
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
              on:click={() => setRadiusKm(rKm)}
            >
              {rKm} km
            </button>
          {/each}
        </div>
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

  {#if allOutsideRadius || isRadiusExpanded}
    <div class="smart-nearest-banner" role="status">
      📍 V okruhu {radiusKm} km jsme našli méně míst — ukazujeme i nejbližší ověřené možnosti v tvém regionu.
    </div>
  {/if}

  <!-- MOBILE & TABLET VIEW SWITCHER -->
  <div class="mobile-tabs" role="tablist" aria-label="Přepnout zobrazení seznamu a mapy">
    <button
      type="button"
      role="tab"
      aria-selected={mobileView === 'list'}
      class:active={mobileView === 'list'}
      on:click={() => setMobileMode('list')}
    >
      📋 Seznam ({filteredPlaces.length})
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={mobileView === 'map'}
      class:active={mobileView === 'map'}
      on:click={() => setMobileMode('map')}
    >
      🗺️ Mapa ({filteredPlaces.length})
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
          <button
            type="button"
            class="search-area-btn"
            class:above-sheet={mobileView === 'map' && !!activePlaceObj}
            on:click={searchPannedArea}
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
            on:click={toggleTileStyle}
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
              <button type="button" class="mas-close" aria-label="Zavřít náhled" on:click={() => (activePlaceId = null)}>
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
              <button type="button" class="pc-btn ghost" on:click={() => focusPlaceInList(activePlaceObj)}>
                📋 Detail v seznamu
              </button>
            </div>
          </div>
        {/if}

        <div class="map-foot-hint">
          <span>★ Ověřená organizace · 🌱 Komunitní tip · 🗺️ Orientační bod OSM</span>
          <span>Posuň mapu kamkoliv po ČR pro hledání v novém výřezu.</span>
        </div>
      </div>
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
        <div class="list-filters">
          {#if places.length > 3 || query.trim().length > 0}
            <input
              type="search"
              id="near-list-filter"
              name="q"
              autocomplete="off"
              aria-label="Hledat v seznamu míst"
              class="filter-input"
              placeholder="Hledat…"
              bind:value={query}
            />
          {/if}
          <select bind:value={sortBy} id="near-sort" name="sort" autocomplete="off" class="sort-select" aria-label="Řazení míst">
            <option value="easy">Nejjednodušší start</option>
            <option value="distance">Podle vzdálenosti</option>
            <option value="name">Abecedně A–Z</option>
          </select>
        </div>
      </div>

      <!-- SOURCE TIER FILTER & LEGEND -->
      <div class="source-tier-bar" role="group" aria-label="Filtrovat podle stupně ověření zdroje">
        {#each SOURCE_FILTERS as sf}
          <button
            type="button"
            class="source-chip"
            class:active={sourceFilter === sf.id}
            on:click={() => setSourceFilter(sf.id)}
          >
            {sf.label}
          </button>
        {/each}
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
              markActionStarted(place.id, 'near_place_msg');
              openTemplateId = openTemplateId === place.id ? null : place.id;
            }}
            onCopyTemplate={copyTemplateText}
          />
        {:else}
          <div class="near-empty-fallback">
            <h3>V okruhu {radiusKm} km teď neodpovídá žádné místo zvolenému filtru</h3>
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
                          sourceFilter = 'all';
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
      </div>

      {#if filteredPlaces.length > visibleCount}
        {@const nextBatch = Math.min(6, filteredPlaces.length - visibleCount)}
        <div class="calm-more-wrap near-more-wrap">
          <button
            type="button"
            class="calm-more-btn"
            on:click={async () => {
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
              on:click={async () => {
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
    width: 100%;
    max-width: 1220px;
    margin: 0 auto;
    padding: 0.2rem 1.15rem 3rem;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  /* Compact Subpage Hero so Split Layout starts high above the fold (y ~ 180-230px on Desktop) */
  .subpage-hero.near-header {
    padding: 0.42rem 1rem;
    margin-bottom: 0.35rem;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    text-align: left;
  }

  .near-header-main {
    display: flex;
    flex-direction: column;
    gap: 0.04rem;
  }

  .hero-kicker {
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.11em;
    color: #fde68a;
  }

  .title {
    font-family: var(--font-sans);
    font-weight: 800;
    color: #ffffff;
    font-size: clamp(1.12rem, 1.65vw, 1.38rem);
    line-height: 1.08;
    margin: 0;
    letter-spacing: -0.025em;
  }

  .title .serif-accent {
    color: #fde68a;
    font-weight: 400;
  }

  .subtitle {
    color: rgba(236, 248, 241, 0.9);
    margin: 0;
    max-width: 54ch;
    font-size: 0.76rem;
    line-height: 1.3;
  }

  /* Controls Card */
  .controls-card {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(22, 66, 48, 0.11);
    border-radius: 15px;
    padding: 0.42rem 0.78rem;
    box-shadow: var(--shadow-sm);
    margin-bottom: 0.4rem;
  }

  .controls-top {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .gps-btn {
    padding: 0.32rem 0.66rem;
    border-radius: 9px;
    background: #eef7f1;
    border: 1px solid rgba(5, 150, 105, 0.28);
    color: #065f46;
    font-family: var(--font-sans);
    font-size: 0.77rem;
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
    min-width: 220px;
    display: flex;
    gap: 0.32rem;
  }

  .search-box input {
    flex: 1;
    padding: 0.32rem 0.66rem;
    border-radius: 9px;
    border: 1px solid rgba(22, 66, 48, 0.15);
    font-family: var(--font-sans);
    font-size: 0.79rem;
    background: #ffffff;
  }

  .btn-find {
    padding: 0.32rem 0.76rem;
    border-radius: 9px;
    border: none;
    background: var(--forest-850);
    color: #ffffff;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.77rem;
    cursor: pointer;
  }

  .city-jump-select {
    padding: 0.32rem 0.6rem;
    border-radius: 9px;
    border: 1px solid rgba(22, 66, 48, 0.15);
    background: #ffffff;
    font-family: var(--font-sans);
    font-size: 0.77rem;
    font-weight: 700;
    color: var(--text-primary);
    cursor: pointer;
  }

  .radius-box {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    color: var(--text-secondary);
  }

  .radius-label {
    font-weight: 700;
    white-space: nowrap;
  }

  .radius-pills {
    display: inline-flex;
    gap: 0.22rem;
    background: #f2f7f4;
    padding: 0.18rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.1);
  }

  .radius-pill {
    padding: 0.24rem 0.52rem;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .radius-pill.active {
    background: var(--forest-850);
    color: #fde68a;
  }

  .info-note {
    margin-top: 0.45rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #065f46;
  }

  .geo-dropdown {
    margin-top: 0.45rem;
    display: grid;
    gap: 0.3rem;
  }

  .geo-opt {
    text-align: left;
    padding: 0.48rem 0.75rem;
    border-radius: 11px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: #ffffff;
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }

  .geo-opt span {
    font-size: 0.76rem;
    color: var(--text-muted);
  }

  .controls-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.38rem;
    padding-top: 0.36rem;
    border-top: 1px solid rgba(22, 66, 48, 0.07);
  }

  .presets-bar {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .preset-pill {
    padding: 0.26rem 0.68rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.1);
    background: #f5f9f6;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.76rem;
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
    gap: 0.75rem;
    font-size: 0.78rem;
  }

  .text-util-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.78rem;
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
    margin-bottom: 0.65rem;
    padding: 0.5rem 0.85rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(16, 185, 129, 0.25);
    color: var(--text-secondary);
    font-size: 0.81rem;
    font-weight: 600;
  }

  .mobile-tabs {
    display: none;
    gap: 0.4rem;
    margin-bottom: 0.65rem;
  }

  .mobile-tabs button {
    flex: 1;
    padding: 0.5rem 0.65rem;
    border-radius: 11px;
    border: 1px solid rgba(22, 66, 48, 0.14);
    background: #ffffff;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.81rem;
    cursor: pointer;
  }

  .mobile-tabs button.active {
    background: var(--forest-850);
    color: #fde68a;
    border-color: var(--forest-850);
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
    top: 76px;
  }

  .map-frame {
    position: relative;
    background: #ffffff;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(22, 66, 48, 0.12);
    box-shadow: var(--shadow-md);
  }

  .leaflet-canvas {
    width: 100%;
    height: 390px;
    background: #e7ece8;
    z-index: 1;
  }

  /* Refined CSS Cartographic Filters on Standard OpenStreetMap Tiles */
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
    left: 54px;
    z-index: 500;
    padding: 0.32rem 0.74rem;
    border-radius: 999px;
    background: rgba(8, 25, 18, 0.88);
    color: #fde68a;
    font-size: 0.74rem;
    font-weight: 700;
    backdrop-filter: blur(8px);
    pointer-events: none;
  }

  .search-area-btn {
    position: absolute;
    bottom: 44px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 520;
    padding: 0.46rem 0.95rem;
    border-radius: 999px;
    border: 1px solid rgba(52, 211, 153, 0.55);
    background: rgba(8, 25, 18, 0.94);
    color: #fde68a;
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(6, 21, 15, 0.32);
    backdrop-filter: blur(8px);
    white-space: nowrap;
    transition: transform 0.15s ease, background 0.15s ease;
  }

  .search-area-btn:hover {
    transform: translateX(-50%) scale(1.03);
    background: #064e3b;
  }

  .search-area-btn.above-sheet {
    bottom: 148px;
  }

  .map-floating-tools {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 500;
  }

  .tile-switch-btn {
    padding: 0.34rem 0.72rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.18);
    background: rgba(255, 255, 255, 0.95);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 0.73rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
  }

  .tile-switch-btn.active {
    border-color: rgba(5, 150, 105, 0.42);
    background: #f2fbf6;
    color: #065f46;
  }

  .map-active-sheet {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 540;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(5, 150, 105, 0.35);
    border-radius: 16px;
    padding: 0.75rem 0.9rem;
    box-shadow: 0 14px 32px rgba(6, 21, 15, 0.28);
  }

  .mas-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .mas-meta {
    display: block;
    font-size: 0.71rem;
    font-weight: 700;
    color: var(--emerald-600);
  }

  .mas-title {
    display: block;
    font-size: 0.95rem;
    color: var(--text-primary);
  }

  .mas-close {
    border: none;
    background: #f1f5f3;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    cursor: pointer;
    font-size: 0.75rem;
  }

  .mas-mission {
    margin: 0.35rem 0 0.55rem;
    font-size: 0.79rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .mas-actions {
    display: flex;
    gap: 0.45rem;
  }

  .map-foot-hint {
    padding: 0.48rem 0.85rem;
    background: #f8faf8;
    border-top: 1px solid rgba(22, 66, 48, 0.07);
    font-size: 0.73rem;
    color: var(--text-muted);
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .map-error-box {
    padding: 0.75rem 1rem;
    background: #fef2f2;
    color: #991b1b;
    font-size: 0.85rem;
  }

  /* List Column */
  .near-pulse-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    margin-top: 0.75rem;
  }

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
    color: var(--text-secondary);
  }

  .count-heading strong {
    font-size: 1.12rem;
    color: var(--forest-850);
  }

  .list-filters {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .filter-input {
    padding: 0.38rem 0.68rem;
    border-radius: 10px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: rgba(255, 255, 255, 0.94);
    font-family: var(--font-sans);
    font-size: 0.79rem;
    color: var(--text-primary);
  }

  .sort-select {
    padding: 0.38rem 0.68rem;
    border-radius: 10px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: rgba(255, 255, 255, 0.94);
    font-family: var(--font-sans);
    font-size: 0.79rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  /* Source Tier Bar */
  .source-tier-bar {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
    margin-bottom: 0.55rem;
  }

  .source-chip {
    padding: 0.22rem 0.52rem;
    border-radius: 999px;
    border: 1px solid rgba(22, 66, 48, 0.11);
    background: rgba(255, 255, 255, 0.86);
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 0.71rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .source-chip.active {
    background: #e6f6ee;
    border-color: rgba(5, 150, 105, 0.42);
    color: #064e3b;
  }

  /* Clean Place Cards */
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
    background: rgba(13, 33, 24, 0.86);
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.45rem 0.85rem;
    border-radius: 999px;
    pointer-events: none;
  }

  .pc-btn {
    padding: 0.44rem 0.8rem;
    border-radius: 10px;
    border: 1px solid rgba(22, 66, 48, 0.12);
    background: #ffffff;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.79rem;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pc-btn.primary {
    background: var(--forest-850);
    border-color: var(--forest-850);
    color: #ffffff;
  }

  .pc-btn.ghost {
    background: transparent;
    color: var(--text-secondary);
  }

  .near-empty-fallback {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(22, 66, 48, 0.12);
    border-radius: 20px;
    padding: 1.35rem 1.4rem;
    box-shadow: var(--shadow-sm);
  }

  .near-empty-fallback h3 {
    margin: 0 0 0.45rem;
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--forest-850);
  }

  .near-empty-fallback p {
    margin: 0 0 0.95rem;
    font-size: 0.88rem;
    line-height: 1.52;
    color: var(--text-secondary);
  }

  .near-empty-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .nearest-verified-box {
    padding-top: 0.8rem;
    border-top: 1px solid rgba(22, 66, 48, 0.09);
  }

  .nv-label {
    display: block;
    font-size: 0.76rem;
    font-weight: 800;
    color: var(--text-muted);
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
    color: var(--text-muted);
    font-size: 0.77rem;
  }

  .nv-jump-btn {
    border: none;
    background: rgba(16, 185, 129, 0.12);
    color: #065f46;
    font-family: var(--font-sans);
    font-size: 0.77rem;
    font-weight: 700;
    padding: 0.26rem 0.62rem;
    border-radius: 999px;
    cursor: pointer;
  }

  .nv-jump-btn:hover {
    background: #059669;
    color: #ffffff;
  }

  .near-more-wrap {
    margin-top: 0.9rem;
  }

  .near-show-all {
    background: none;
    border: none;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 0.79rem;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
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
    padding: 0.65rem 0.8rem;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid rgba(22, 66, 48, 0.08);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 0.16rem;
  }

  .portal-mini strong {
    font-size: 0.83rem;
    color: #059669;
  }

  .portal-mini span {
    font-size: 0.76rem;
    color: var(--text-secondary);
    line-height: 1.38;
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
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  :global(.aa-map-pin .pin-bubble.is-curated) {
    background: #fffef7;
    border: 3px solid #059669;
    box-shadow: 0 8px 20px rgba(6, 21, 15, 0.28), 0 0 0 3px rgba(251, 191, 36, 0.45);
  }

  :global(.aa-map-pin .pin-bubble.is-community) {
    background: #f0fdfa;
    border: 2.5px solid #0d9488;
  }

  :global(.aa-map-pin .pin-bubble.is-active) {
    transform: scale(1.22);
    box-shadow: 0 10px 24px rgba(6, 21, 15, 0.38), 0 0 0 5px rgba(16, 185, 129, 0.45);
  }

  :global(.aa-map-pin .pin-star),
  :global(.aa-map-pin .pin-leaf) {
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

  :global(.aa-map-pin .pin-leaf) {
    background: #0d9488;
    font-size: 8px;
  }

  :global(.aa-map-pin:hover .pin-bubble) {
    transform: scale(1.18);
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
      padding: 0.1rem 0.55rem 1.8rem;
      overflow-x: hidden;
      width: 100%;
      box-sizing: border-box;
    }

    .subpage-hero.near-header {
      padding: 0.35rem 0.65rem;
      margin-bottom: 0.22rem;
      border-radius: 14px;
    }

    .near-header .hero-kicker,
    .near-header .subtitle {
      display: none !important;
    }

    .near-header .title {
      font-size: 1.08rem;
      line-height: 1.15;
      margin: 0;
    }

    .controls-card {
      padding: 0.36rem 0.5rem;
      margin-bottom: 0.25rem;
      border-radius: 14px;
      max-width: 100%;
      box-sizing: border-box;
    }

    .controls-top {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      align-items: center;
      width: 100%;
    }

    .gps-btn {
      order: 1;
      flex-shrink: 0;
      padding: 0.38rem 0.58rem;
      font-size: 0.74rem;
      min-height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 9px;
      box-sizing: border-box;
    }

    .search-box {
      order: 2;
      flex: 1 1 140px;
      min-width: 0;
      display: flex;
      gap: 0.25rem;
    }

    .search-box input {
      flex: 1;
      min-width: 0;
      padding: 0.36rem 0.5rem;
      font-size: 0.76rem;
      border-radius: 9px;
      min-height: 36px;
      box-sizing: border-box;
    }

    .btn-find {
      padding: 0.36rem 0.58rem;
      font-size: 0.75rem;
      min-height: 36px;
      flex-shrink: 0;
      border-radius: 9px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }

    .city-jump-select {
      order: 3;
      flex: 0 1 92px;
      min-width: 0;
      max-width: 102px;
      padding: 0.26rem 0.34rem;
      font-size: 0.72rem;
      min-height: 32px;
      border-radius: 9px;
      box-sizing: border-box;
    }

    .radius-box {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin-top: 0.25rem;
    }

    .radius-label {
      display: inline-block;
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--text-secondary);
    }

    .radius-pills {
      display: flex;
      flex: 1;
      width: 100%;
      box-sizing: border-box;
      gap: 0.2rem;
      padding: 0.15rem;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .radius-pill {
      flex: 1 1 0;
      padding: 0.35rem 0.4rem;
      font-size: 0.74rem;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }

    .controls-bottom {
      margin-top: 0.3rem;
      padding-top: 0.28rem;
      gap: 0.25rem;
      min-width: 0;
    }

    .presets-bar {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      gap: 0.28rem;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      scroll-snap-type: x mandatory;
      mask-image: linear-gradient(to right, black 0%, black calc(100% - 28px), transparent 100%);
      -webkit-mask-image: linear-gradient(to right, black 0%, black calc(100% - 28px), transparent 100%);
      padding: 0.1rem 1.1rem 0.2rem 0.05rem;
    }

    .presets-bar::-webkit-scrollbar {
      display: none;
    }

    .preset-pill {
      flex: 0 0 auto;
      white-space: nowrap;
      padding: 0.36rem 0.65rem;
      font-size: 0.75rem;
      min-height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      scroll-snap-align: start;
      box-sizing: border-box;
    }

    .controls-links {
      display: none;
    }

    .smart-nearest-banner {
      margin-bottom: 0.3rem;
      padding: 0.34rem 0.55rem;
      font-size: 0.72rem;
    }

    .mobile-tabs {
      display: flex;
      gap: 0.35rem;
      margin-bottom: 0.45rem;
      background: rgba(22, 66, 48, 0.06);
      padding: 0.22rem;
      border-radius: 14px;
      border: 1px solid rgba(22, 66, 48, 0.1);
      box-sizing: border-box;
    }

    .mobile-tabs button {
      flex: 1;
      min-height: 44px;
      padding: 0.55rem 0.75rem;
      border-radius: 10px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-secondary);
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      transition: all 0.18s ease;
      box-sizing: border-box;
    }

    .mobile-tabs button.active {
      background: var(--forest-850);
      color: #fde68a;
      border-color: var(--forest-850);
      box-shadow: var(--shadow-sm);
    }

    .split-layout {
      gap: 0.3rem;
    }

    .leaflet-canvas,
    .leaflet-canvas.map-expanded {
      height: 58dvh;
      min-height: 340px;
    }

    .search-area-btn {
      bottom: 14px;
      font-size: 0.72rem;
      padding: 0.38rem 0.78rem;
    }

    .map-foot-hint {
      display: none;
    }

    .list-toolbar {
      margin-bottom: 0.25rem;
      padding: 0.04rem 0;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .count-heading {
      font-size: 0.76rem;
      white-space: nowrap;
    }

    .count-heading strong {
      font-size: 0.88rem;
    }

    .list-filters {
      display: flex;
      flex-wrap: nowrap;
      gap: 0.22rem;
      min-width: 0;
      flex: 1;
      justify-content: flex-end;
    }

    .filter-input,
    .sort-select {
      min-height: 44px;
      font-size: 0.74rem;
      border-radius: 8px;
      padding: 0.25rem 0.45rem;
      box-sizing: border-box;
      min-width: 0;
    }

    .filter-input {
      max-width: 85px;
    }

    .sort-select {
      max-width: 145px;
    }

    .source-tier-bar {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      margin-bottom: 0.32rem;
      gap: 0.22rem;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }

    .source-tier-bar::-webkit-scrollbar {
      display: none;
    }

    .source-chip {
      flex: 0 0 auto;
      white-space: nowrap;
      min-height: 44px;
      padding: 0.28rem 0.55rem;
      font-size: 0.72rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }

    .places-stack {
      gap: 0.75rem;
    }

    .pc-btn {
      min-height: 40px;
      padding: 0.48rem 0.75rem;
      font-size: 0.78rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      box-sizing: border-box;
    }
  }
</style>
