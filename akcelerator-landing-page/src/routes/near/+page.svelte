<script>
  import { onMount } from 'svelte';
  import { currentLanguage } from '../../lib/stores.js';
  import { trackEvent } from '../../lib/analytics.js';

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
  let centerLat = selectedCity.lat;
  let centerLon = selectedCity.lon;
  let radiusKm = 5;
  let kinds = ['ngo', 'community'];
  let includeAssociations = false;
  let query = '';
  let sortBy = 'easy'; // easy | distance | name
  let prefTime = 'any'; // any | 5 | 15 | 45
  let prefSocial = 'any'; // any | solo | group
  /** @type {string[]} */
  let userValues = [];
  /** @type {Set<string>} */
  let boostedKinds = new Set();
  let activePlaceId = null;
  let activeMarkerEl = null;
  let visibleCount = 24;
  let onlyWithWebsite = false;

  let urlSyncEnabled = false;
  let urlSyncTimer;

  let shareStatus = 'idle'; // idle | ok | error
  let shareMessage = '';

  let locationQuery = '';
  let geoStatus = 'idle'; // idle | loading | ok | error
  let geoMessage = '';
  /** @type {Array<{label: string, lat: number, lon: number, type?: string, class?: string}>} */
  let geoResults = [];

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
  let isFetchingCommunity = false;
  let communityError = false;
  /** @type {Array<any>} */
  let communityItems = [];

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

    // Marker clustering (helps when there are many places)
    if (!window.L?.markerClusterGroup) {
      const mcCss = document.createElement('link');
      mcCss.rel = 'stylesheet';
      mcCss.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
      document.head.appendChild(mcCss);

      const mcCss2 = document.createElement('link');
      mcCss2.rel = 'stylesheet';
      mcCss2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
      document.head.appendChild(mcCss2);

      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
      });
    }

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

  function roundCoord(n, digits = 3) {
    if (!Number.isFinite(n)) return null;
    const p = 10 ** digits;
    return Math.round(n * p) / p;
  }

  function readUrlState() {
    if (typeof window === 'undefined') return {};
    const sp = new URLSearchParams(window.location.search);

    const lat = Number(sp.get('lat'));
    const lon = Number(sp.get('lon'));
    const radius_km = Number(sp.get('radius_km'));

    const kindsRaw = (sp.get('kinds') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const kindsFiltered = kindsRaw.filter((k) => ['ngo', 'community', 'food', 'animals'].includes(k));

    const sort = sp.get('sort');
    const time = (sp.get('t') || '').toString();
    const social = (sp.get('social') || '').toString();

    return {
      lat: Number.isFinite(lat) ? lat : null,
      lon: Number.isFinite(lon) ? lon : null,
      radiusKm: Number.isFinite(radius_km) && radius_km >= 1 && radius_km <= 25 ? Math.round(radius_km) : null,
      kinds: kindsFiltered.length ? kindsFiltered : null,
      includeAssociations: sp.get('include_associations') === '1',
      onlyWithWebsite: sp.get('only_web') === '1',
      sortBy:
        sort === 'name' ? 'name' : sort === 'distance' ? 'distance' : sort === 'easy' ? 'easy' : null,
      prefTime: ['any', '5', '15', '45'].includes(time) ? time : null,
      prefSocial: ['any', 'solo', 'group'].includes(social) ? social : null,
      query: (sp.get('q') || '').toString()
    };
  }

  function syncUrl(force = false) {
    if ((!force && !urlSyncEnabled) || typeof window === 'undefined') return;
    if (!Number.isFinite(centerLat) || !Number.isFinite(centerLon)) return;

    const url = new URL(window.location.href);
    const sp = url.searchParams;

    sp.set('lat', String(roundCoord(centerLat, 3)));
    sp.set('lon', String(roundCoord(centerLon, 3)));
    sp.set('radius_km', String(Math.round(radiusKm)));
    sp.set('kinds', Array.isArray(kinds) && kinds.length ? kinds.join(',') : '');

    if (includeAssociations) sp.set('include_associations', '1');
    else sp.delete('include_associations');

    if (onlyWithWebsite) sp.set('only_web', '1');
    else sp.delete('only_web');

    if (sortBy && sortBy !== 'easy') sp.set('sort', sortBy);
    else sp.delete('sort');

    if (prefTime && prefTime !== 'any') sp.set('t', prefTime);
    else sp.delete('t');

    if (prefSocial && prefSocial !== 'any') sp.set('social', prefSocial);
    else sp.delete('social');

    if (query.trim()) sp.set('q', query.trim());
    else sp.delete('q');

    history.replaceState({}, '', url.toString());
  }

  function scheduleUrlSync() {
    if (!urlSyncEnabled) return;
    clearTimeout(urlSyncTimer);
    urlSyncTimer = setTimeout(() => syncUrl(false), 250);
  }

  async function copyShareLink() {
    shareStatus = 'idle';
    shareMessage = '';
    try {
      syncUrl(true);
      const link = window.location.href;
      await navigator.clipboard.writeText(link);
      shareStatus = 'ok';
      shareMessage = 'Odkaz zkopírován. Můžete ho poslat kamarádovi nebo organizaci.';
      trackEvent('aa_share_link', { surface: 'near' });
      setTimeout(() => {
        shareStatus = 'idle';
        shareMessage = '';
      }, 4500);
    } catch (e) {
      shareStatus = 'error';
      shareMessage = 'Nepodařilo se zkopírovat odkaz. Zkuste to prosím znovu.';
    }
  }

  function clearGeocodeUi() {
    geoStatus = 'idle';
    geoMessage = '';
    geoResults = [];
  }

  function firstText(v) {
    const s = safeText(v);
    if (!s) return '';
    return s.split(',')[0] || s;
  }

  async function searchLocation() {
    const q = safeText(locationQuery);
    if (!q) return;
    if (q.length < 2) {
      geoStatus = 'error';
      geoMessage = 'Zadejte aspoň 2 znaky (město nebo PSČ).';
      geoResults = [];
      return;
    }

    geoStatus = 'loading';
    geoMessage = 'Hledám…';
    geoResults = [];
    trackEvent('aa_near_geocode_request', { len: q.length });

    try {
      const resp = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=6`);
      const data = await resp.json();
      const results = Array.isArray(data?.results) ? data.results : [];

      geoResults = results;
      if (!results.length) {
        geoStatus = 'error';
        geoMessage = 'Nic jsem nenašel. Zkuste jiné město/PSČ.';
        return;
      }

      geoStatus = 'ok';
      geoMessage = 'Vyberte výsledek:';
    } catch (e) {
      geoStatus = 'error';
      geoMessage = 'Geokódování se nepovedlo. Zkuste to prosím znovu.';
    }
  }

  async function applyGeocodeResult(r) {
    if (!r || typeof r.lat !== 'number' || typeof r.lon !== 'number') return;
    clearGeocodeUi();
    locationQuery = firstText(r.label);
    setUserLocation(r.lat, r.lon);
    await fetchNearby(r.lat, r.lon);
    trackEvent('aa_near_geocode_apply');
  }

  function emojiForKind(kind) {
    if (kind === 'ngo') return '🏛️';
    if (kind === 'community') return '🏘️';
    if (kind === 'food') return '🍞';
    if (kind === 'animals') return '🐾';
    return '✨';
  }

  function kindLabel(kind) {
    if (kind === 'ngo') return 'Organizace';
    if (kind === 'community') return 'Komunita';
    if (kind === 'food') return 'Potraviny';
    if (kind === 'animals') return 'Zvířata';
    return 'Další';
  }

  function nextStepHint(p) {
    const hasWeb = !!p?.website;
    const hasPhone = !!placePhone(p);
    const hasEmail = !!placeEmail(p);

    if (p?.kind === 'food') return 'Tip: ověřte co přijímají a kdy (potraviny/hygiena).';
    if (p?.kind === 'animals') return 'Tip: často jde o venčení, dočasnou péči nebo dary.';
    if (p?.kind === 'community') return 'Tip: často pomůže výpomoc na akci, doprovod nebo sousedská pomoc.';
    if (p?.kind === 'ngo') {
      if (hasWeb) return 'Tip: na webu hledejte „Jak pomoci“ / dobrovolnictví.';
      if (hasPhone || hasEmail) return 'Tip: krátce zavolejte/napište: „Chci pomoci – co se teď hodí?“';
    }
    return '';
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

  function boostedKindsFromValues(values) {
    const set = new Set();
    if (!Array.isArray(values)) return set;
    for (const v of values) {
      if (v === 'animals') set.add('animals');
      if (v === 'community') set.add('community');
      if (v === 'poverty') {
        set.add('food');
        set.add('community');
        set.add('ngo');
      }
      if (['children', 'elderly', 'health', 'education'].includes(v)) {
        set.add('ngo');
        set.add('community');
      }
      if (v === 'environment') {
        set.add('ngo');
        set.add('community');
      }
    }
    return set;
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  function placeTrustScore(p) {
    let s = 0;
    if (p?.website) s += 0.35;
    if (placePhone(p)) s += 0.12;
    if (placeEmail(p)) s += 0.12;
    if (placeHours(p)) s += 0.08;
    if (placeAddress(p)) s += 0.08;
    if (placeDescription(p)) s += 0.06;
    if (p?.osm_url) s += 0.03;
    return clamp(s, 0, 1);
  }

  function placeEaseScore(p) {
    const d = Number.isFinite(p?.distanceKm) ? p.distanceKm : 9999;
    const distNorm = clamp(d / Math.max(1, radiusKm), 0, 2.5);

    const hasWeb = !!p?.website;
    const hasPhone = !!placePhone(p);
    const hasEmail = !!placeEmail(p);
    const hasAddress = !!placeAddress(p);
    const hasHours = !!placeHours(p);

    const trust = placeTrustScore(p);

    // Lower = better (less effort / higher confidence).
    let score = 0;

    // Distance dominates for in-person actions, but we keep it soft.
    score += distNorm * 0.55;

    // “Trust / clarity” signals reduce uncertainty.
    score += (1 - trust) * 0.35;

    // Contact friction.
    if (hasWeb) score -= 0.12;
    if (!hasWeb && hasPhone) score += 0.07; // calling is more effort than clicking
    if (!hasWeb && !hasEmail && !hasPhone) score += 0.22; // unclear how to act

    // Missing context adds friction.
    if (!hasAddress) score += 0.06;
    if (!hasHours) score += 0.03;

    // Stage 1 preferences (tiny, explainable boosts)
    if (prefTime === '5') {
      if (!hasWeb) score += 1.2;
      else score -= 0.12;
    } else if (prefTime === '15') {
      if (!(hasWeb || hasEmail)) score += 0.6;
    }

    if (prefSocial === 'group') {
      if (p?.kind !== 'community') score += 0.12;
      else score -= 0.05;
    } else if (prefSocial === 'solo') {
      if (p?.kind === 'community') score += 0.08;
    }

    if (boostedKinds?.has(p?.kind)) score -= 0.08;

    return score;
  }

  function whyBadges(p) {
    const show =
      sortBy === 'easy' ||
      prefTime !== 'any' ||
      prefSocial !== 'any' ||
      (boostedKinds && boostedKinds.size > 0);
    if (!show) return [];

    const badges = [];
    const score = placeEaseScore(p);

    if (score <= 0.35) badges.push('⚡ bez námahy');
    else if (score <= 0.75) badges.push('🙂 pár kroků');
    else badges.push('🧱 víc kroků');

    const d = Number.isFinite(p?.distanceKm) ? p.distanceKm : null;
    if (prefTime === '5' && p?.website) badges.push('do 5 min');
    else if (prefTime === '15' && (p?.website || placeEmail(p))) badges.push('do 15 min');

    if (p?.website) badges.push('má web');
    if (d !== null && d <= Math.max(2, Math.round(radiusKm * 0.35))) badges.push('blízko');
    if (placeHours(p)) badges.push('otevírací doba');
    if (boostedKinds?.has(p?.kind)) badges.push('sedí na tvůj výběr');

    return badges.slice(0, 3);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function phoneHref(phone) {
    const p = safeText(phone);
    if (!p) return null;
    // Keep + and digits; drop other chars/spaces
    const normalized = p.replace(/[^\d+]/g, '');
    return normalized ? `tel:${normalized}` : null;
  }

  function emailHref(email) {
    const e = safeText(email);
    if (!e) return null;
    return `mailto:${e}`;
  }

  function directionsHref(p) {
    if (typeof p?.lat !== 'number' || typeof p?.lon !== 'number') return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${p.lat},${p.lon}`)}`;
  }

  function communityEmoji(it) {
    if (it?.kind === 'event') return '📅';
    return '🏛️';
  }

  function communityKindLabel(it) {
    if (it?.kind === 'event') return language === 'czech' ? 'Akce' : 'Event';
    return language === 'czech' ? 'Organizace' : 'Organization';
  }

  function communityWhen(it) {
    const s = safeText(it?.event_start);
    if (!s) return '';
    const d = new Date(s);
    if (!Number.isFinite(d.getTime())) return '';
    try {
      return d.toLocaleString(language === 'czech' ? 'cs-CZ' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  function focusLatLon(lat, lon) {
    if (!map || typeof lat !== 'number' || typeof lon !== 'number') return;
    if (typeof map.flyTo === 'function') map.flyTo([lat, lon], Math.max(map.getZoom(), 15), { duration: 0.55 });
    else map.setView([lat, lon], Math.max(map.getZoom(), 15));
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
    centerLat = lat;
    centerLon = lon;
    if (typeof map.flyTo === 'function') map.flyTo([lat, lon], 13, { duration: 0.55 });
    else map.setView([lat, lon], 13);
    if (userMarker) userMarker.remove();
    userMarker = leaflet.circleMarker([lat, lon], {
      radius: 7,
      color: '#2E5D31',
      fillColor: '#2E5D31',
      fillOpacity: 0.9
    }).addTo(map);

    updateRadiusOverlay(lat, lon);
    scheduleUrlSync();
  }

  function placeDomId(id) {
    return `place-${String(id || '').replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  }

  function scrollToPlace(id) {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(placeDomId(id));
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch {
      el.scrollIntoView();
    }
  }

  function updateActiveMarkerClass() {
    if (activeMarkerEl && typeof activeMarkerEl.classList?.remove === 'function') {
      activeMarkerEl.classList.remove('is-active');
    }
    activeMarkerEl = null;
    if (!activePlaceId) return;
    const m = markerById.get(activePlaceId);
    const el = m?.getElement?.();
    if (!el) return;
    el.classList.add('is-active');
    activeMarkerEl = el;
  }

  function setActivePlace(id, opts = undefined) {
    activePlaceId = id || null;
    if (opts?.scroll) scrollToPlace(activePlaceId);
    updateActiveMarkerClass();
  }

  async function fetchNearby(lat, lon) {
    isFetching = true;
    places = [];
    isFetchingCommunity = true;
    communityError = false;
    communityItems = [];

    // Fetch verified community items in parallel (if table exists)
    const communityPromise = fetch(
      `/api/community-nearby?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radius_m=${encodeURIComponent(
        radiusKm * 1000
      )}`
    )
      .then(async (r) => {
        if (!r.ok) throw new Error(`community ${r.status}`);
        return await r.json();
      })
      .then((d) => {
        communityItems = Array.isArray(d?.items) ? d.items : [];
      })
      .catch(() => {
        communityError = true;
        communityItems = [];
      })
      .finally(() => {
        isFetchingCommunity = false;
      });

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
      trackEvent('aa_near_fetch_error', {
        radius_km: radiusKm,
        kinds: Array.isArray(kinds) ? kinds.join(',') : '',
        include_associations: includeAssociations ? 1 : 0
      });
      // keep empty list
      places = [];
      renderMarkers();
    } finally {
      // ensure community finished too (so UI doesn't flicker between empty/loading)
      await communityPromise.catch(() => {});
      isFetching = false;
    }
  }

  function renderMarkers() {
    if (!map || !leaflet) return;
    if (markersLayer) markersLayer.remove();
    const useCluster = places.length >= 60 && typeof leaflet.markerClusterGroup === 'function';
    markersLayer = useCluster
      ? leaflet.markerClusterGroup({
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 16,
          maxClusterRadius: 52
        })
      : leaflet.layerGroup();
    markersLayer.addTo(map);
    markerById = new Map();
    activeMarkerEl = null;

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
      marker.on('click', () => {
        setActivePlace(p.id, { scroll: true });
      });

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
          <div style="opacity:.85;">~${p.distanceKm} km · ${emojiForKind(p.kind)} ${escapeHtml(kindLabel(p.kind))}${p.subcategory ? ` · ${escapeHtml(p.subcategory)}` : ''}</div>
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

    updateActiveMarkerClass();
  }

  function focusPlace(p) {
    if (!map) return;
    setActivePlace(p?.id || null);
    if (typeof map.flyTo === 'function') map.flyTo([p.lat, p.lon], Math.max(map.getZoom(), 15), { duration: 0.55 });
    else map.setView([p.lat, p.lon], Math.max(map.getZoom(), 15));
    const m = markerById.get(p.id);
    if (m && typeof m.openPopup === 'function') {
      if (markersLayer && typeof markersLayer.zoomToShowLayer === 'function') {
        markersLayer.zoomToShowLayer(m, () => m.openPopup());
      } else {
        m.openPopup();
      }
    }
  }

  async function initMap(initialLat, initialLon) {
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

    const lat = typeof initialLat === 'number' ? initialLat : selectedCity.lat;
    const lon = typeof initialLon === 'number' ? initialLon : selectedCity.lon;
    setUserLocation(lat, lon);
    await fetchNearby(lat, lon);

    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      setUserLocation(lat, lng);
      await fetchNearby(lat, lng);
    });
  }

  async function useGps() {
    gpsStatus = 'requesting';
    gpsMessage = 'Čekám na povolení polohy…';
    trackEvent('aa_near_gps_request');

    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      gpsStatus = 'error';
      gpsMessage = 'Poloha funguje jen na HTTPS. Zvolte město nebo otevřete stránku přes https://';
      trackEvent('aa_near_gps_result', { result: 'error', reason: 'insecure_context' });
      return;
    }

    if (!navigator?.geolocation) {
      gpsStatus = 'error';
      gpsMessage = 'Váš prohlížeč nepodporuje polohu. Zvolte město.';
      trackEvent('aa_near_gps_result', { result: 'error', reason: 'no_geolocation' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        gpsStatus = 'ok';
        gpsMessage = 'Poloha načtena. Hledám místa v okolí…';
        trackEvent('aa_near_gps_result', { result: 'ok' });
        setUserLocation(lat, lon);
        await fetchNearby(lat, lon);
        gpsMessage = 'Hotovo. Klikněte na bod nebo na kartu pro detail.';
      },
      (err) => {
        gpsStatus = 'error';
        trackEvent('aa_near_gps_result', { result: 'error', code: err?.code ?? 0 });
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
    centerLat = center.lat;
    centerLon = center.lng;
    updateRadiusOverlay(center.lat, center.lng);
    await fetchNearby(center.lat, center.lng);
    scheduleUrlSync();
  }

  function loadSavedPrefs() {
    try {
      const raw = localStorage.getItem('aa_prefs_near');
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p?.t && ['any', '5', '15', '45'].includes(p.t)) prefTime = p.t;
      if (p?.social && ['any', 'solo', 'group'].includes(p.social)) prefSocial = p.social;
    } catch {}
  }

  function savePrefs() {
    try {
      localStorage.setItem('aa_prefs_near', JSON.stringify({ t: prefTime, social: prefSocial }));
    } catch {}
  }

  function setPrefTime(v) {
    if (!['any', '5', '15', '45'].includes(v)) return;
    prefTime = v;
    visibleCount = 24;
    savePrefs();
    trackEvent('aa_near_pref_change', { t: prefTime, social: prefSocial });
    scheduleUrlSync();
  }

  function setPrefSocial(v) {
    if (!['any', 'solo', 'group'].includes(v)) return;
    prefSocial = v;
    visibleCount = 24;
    savePrefs();
    trackEvent('aa_near_pref_change', { t: prefTime, social: prefSocial });
    scheduleUrlSync();
  }

  function loadUserValues() {
    try {
      const s = JSON.parse(localStorage.getItem('aa_values') || '[]');
      if (Array.isArray(s)) userValues = s;
    } catch {}
  }

  $: boostedKinds = boostedKindsFromValues(userValues);

  $: filteredPlaces = (() => {
    const q = query.trim().toLowerCase();
    const base = onlyWithWebsite ? places.filter((p) => !!p.website) : places;
    if (!q) return base;
    return base.filter((p) => {
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
    if (sortBy === 'easy') {
      return [...filteredPlaces]
        .map((p) => ({ p, score: placeEaseScore(p) }))
        .sort((a, b) => {
          if (a.score !== b.score) return a.score - b.score;
          const ad = Number.isFinite(a.p?.distanceKm) ? a.p.distanceKm : 9999;
          const bd = Number.isFinite(b.p?.distanceKm) ? b.p.distanceKm : 9999;
          if (ad !== bd) return ad - bd;
          const an = (a.p?.name || '').toString();
          const bn = (b.p?.name || '').toString();
          return an.localeCompare(bn, 'cs', { sensitivity: 'base' });
        })
        .map((x) => x.p);
    }
    return filteredPlaces;
  })();

  $: visiblePlaces = sortedPlaces.slice(0, visibleCount);

  onMount(() => {
    loadSavedPrefs();
    loadUserValues();

    const s = readUrlState();
    if (typeof s.radiusKm === 'number') radiusKm = s.radiusKm;
    if (Array.isArray(s.kinds)) kinds = s.kinds;
    includeAssociations = !!s.includeAssociations;
    onlyWithWebsite = !!s.onlyWithWebsite;
    sortBy = s.sortBy || 'easy';
    if (typeof s.prefTime === 'string') prefTime = s.prefTime;
    if (typeof s.prefSocial === 'string') prefSocial = s.prefSocial;
    query = (s.query || '').toString();

    if (typeof s.lat === 'number' && typeof s.lon === 'number') {
      centerLat = s.lat;
      centerLon = s.lon;
    } else {
      centerLat = selectedCity.lat;
      centerLon = selectedCity.lon;
    }

    initMap(centerLat, centerLon).finally(() => {
      urlSyncEnabled = true;
      scheduleUrlSync();
    });
  });

  $: if (urlSyncEnabled) {
    // Re-sync URL whenever relevant state changes.
    // We only store rounded coordinates (privacy + stable URLs).
    const _key = [
      roundCoord(centerLat, 3),
      roundCoord(centerLon, 3),
      Math.round(radiusKm),
      Array.isArray(kinds) ? kinds.join(',') : '',
      includeAssociations ? 1 : 0,
      onlyWithWebsite ? 1 : 0,
      sortBy,
      prefTime,
      prefSocial,
      query.trim()
    ].join('|');
    if (_key) scheduleUrlSync();
  }
</script>

<div class="near-page">
  <div class="near-header">
    <a class="back" href="/">{UI[language].back}</a>
    <div class="title">{UI[language].title}</div>
    <div class="subtitle">{UI[language].subtitle}</div>
    <div class="steps" aria-label="3 kroky">
      <div class="step"><span class="step-n">1</span><span>Poloha</span></div>
      <div class="step"><span class="step-n">2</span><span>Kategorie</span></div>
      <div class="step"><span class="step-n">3</span><span>Kontakt</span></div>
    </div>
    <div class="header-actions">
      <button class="btn secondary-btn small" type="button" on:click={copyShareLink}>🔗 Zkopírovat odkaz</button>
      <a class="btn secondary-btn small" href="/submit">➕ Přidat organizaci / akci</a>
    </div>
    {#if shareMessage}
      <div class={"share-banner " + shareStatus} aria-live="polite">
        {shareMessage}
      </div>
    {/if}
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

    <div class="row">
      <div class="field wide">
        <label for="near_location">Město / PSČ (hledat)</label>
        <div class="loc-search">
          <input
            id="near_location"
            class="text"
            type="text"
            placeholder="Např. Zlín, 760 01, Jihlava…"
            bind:value={locationQuery}
            on:input={() => {
              if (geoStatus !== 'idle') clearGeocodeUi();
            }}
            on:keydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                searchLocation();
              }
            }}
            disabled={geoStatus === 'loading'}
          />
          <button class="btn secondary-btn" type="button" on:click={searchLocation} disabled={geoStatus === 'loading' || !locationQuery.trim()}>
            {geoStatus === 'loading' ? 'Hledám…' : 'Najít'}
          </button>
        </div>

        {#if geoMessage}
          <div class={"geo-banner " + geoStatus} aria-live="polite">{geoMessage}</div>
        {/if}

        {#if geoResults.length}
          <div class="geo-results">
            {#each geoResults as r}
              <button class="geo-item" type="button" on:click={() => applyGeocodeResult(r)}>
                <span class="geo-title">{firstText(r.label)}</span>
                <span class="geo-sub">{r.label}</span>
              </button>
            {/each}
          </div>
        {/if}
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

  <div class="split">
    <div class="left">
      <div class="map-card card">
        {#if isLoadingMap}
          <div class="loading">{UI[language].loading}</div>
        {/if}
        <div bind:this={mapEl} class="map"></div>
      </div>
    </div>

    <div class="right">
      <div class="results">
        <div class="results-head">
          <div class="section-title">
            {isFetching ? UI[language].fetching : `${filteredPlaces.length} ${language === 'czech' ? 'míst' : 'places'}`}
          </div>
          <div class="results-controls">
            <input class="search" type="search" placeholder="Hledat (název / adresa)" bind:value={query} />
            <select class="sort" bind:value={sortBy}>
              <option value="easy">Nejlehčí</option>
              <option value="distance">Nejblíž</option>
              <option value="name">A–Z</option>
            </select>
            <label class="onlyweb">
              <input type="checkbox" bind:checked={onlyWithWebsite} />
              <span>Pouze s webem</span>
            </label>
          </div>
        </div>

        <div class="prefs-row" aria-label="Lehké přizpůsobení">
          <div class="pref">
            <div class="pref-label">⏱️ Čas</div>
            <div class="kinds pref-chips">
              <label class="chip pref-chip" class:selected={prefTime === 'any'}>
                <input type="radio" name="prefTime" checked={prefTime === 'any'} on:change={() => setPrefTime('any')} />
                <span>Cokoliv</span>
              </label>
              <label class="chip pref-chip" class:selected={prefTime === '5'}>
                <input type="radio" name="prefTime" checked={prefTime === '5'} on:change={() => setPrefTime('5')} />
                <span>5 min</span>
              </label>
              <label class="chip pref-chip" class:selected={prefTime === '15'}>
                <input type="radio" name="prefTime" checked={prefTime === '15'} on:change={() => setPrefTime('15')} />
                <span>15 min</span>
              </label>
              <label class="chip pref-chip" class:selected={prefTime === '45'}>
                <input type="radio" name="prefTime" checked={prefTime === '45'} on:change={() => setPrefTime('45')} />
                <span>45+ min</span>
              </label>
            </div>
          </div>
          <div class="pref">
            <div class="pref-label">👥 Styl</div>
            <div class="kinds pref-chips">
              <label class="chip pref-chip" class:selected={prefSocial === 'any'}>
                <input type="radio" name="prefSocial" checked={prefSocial === 'any'} on:change={() => setPrefSocial('any')} />
                <span>Cokoliv</span>
              </label>
              <label class="chip pref-chip" class:selected={prefSocial === 'solo'}>
                <input type="radio" name="prefSocial" checked={prefSocial === 'solo'} on:change={() => setPrefSocial('solo')} />
                <span>Spíš sám</span>
              </label>
              <label class="chip pref-chip" class:selected={prefSocial === 'group'}>
                <input type="radio" name="prefSocial" checked={prefSocial === 'group'} on:change={() => setPrefSocial('group')} />
                <span>S lidmi</span>
              </label>
            </div>
          </div>
        </div>

        {#if !isFetching && filteredPlaces.length === 0}
          <div class="card empty">{UI[language].nothing}</div>
        {/if}

        <div class="grid places-grid">
          {#each visiblePlaces as p}
            <div
              class={"card place" + (activePlaceId === p.id ? ' is-active' : '')}
              id={placeDomId(p.id)}
              role="group"
              aria-label={placeTitle(p)}
              on:mouseenter={() => setActivePlace(p.id)}
              on:focusin={() => setActivePlace(p.id)}
            >
              <div class="place-title">{placeTitle(p)}</div>

              <div class="badges">
                <span class={"badge kind k-" + (p.kind || 'other')}>{emojiForKind(p.kind)} {kindLabel(p.kind)}</span>
                {#if p.subcategory}
                  <span class="badge sub">{p.subcategory}</span>
                {/if}
              </div>

              {#if whyBadges(p).length}
                <div class="badges why-badges" aria-label="Proč je to výš">
                  {#each whyBadges(p) as w}
                    <span class="badge why">{w}</span>
                  {/each}
                </div>
              {/if}

              <div class="place-meta">
                <span>~{p.distanceKm} km</span>
              </div>

              {#if placeAddress(p)}
                <div class="place-line"><span class="ico">📍</span><span>{placeAddress(p)}</span></div>
              {/if}
              {#if placeHours(p)}
                <div class="place-line"><span class="ico">🕒</span><span>{placeHours(p)}</span></div>
              {/if}
              {#if placePhone(p)}
                <div class="place-line">
                  <span class="ico">📞</span>
                  {#if phoneHref(placePhone(p))}
                    <a class="inline-link" href={phoneHref(placePhone(p))}>{placePhone(p)}</a>
                  {:else}
                    <span>{placePhone(p)}</span>
                  {/if}
                </div>
              {/if}
              {#if placeEmail(p)}
                <div class="place-line">
                  <span class="ico">✉️</span>
                  {#if emailHref(placeEmail(p))}
                    <a class="inline-link" href={emailHref(placeEmail(p))}>{placeEmail(p)}</a>
                  {:else}
                    <span>{placeEmail(p)}</span>
                  {/if}
                </div>
              {/if}
              {#if placeDescription(p)}
                <div class="place-desc">{truncate(placeDescription(p), 160)}</div>
              {/if}
              {#if nextStepHint(p)}
                <div class="place-hint">💡 {nextStepHint(p)}</div>
              {/if}

              <div class="place-actions">
                <button class="action secondary" type="button" on:click={() => focusPlace(p)}>Zobrazit na mapě</button>
                {#if directionsHref(p)}
                  <a
                    class="action secondary"
                    href={directionsHref(p)}
                    target="_blank"
                    rel="noopener"
                    on:click={() => trackEvent('aa_clickout', { surface: 'near', type: 'directions', kind: p.kind || 'other' })}
                  >
                    Trasa →
                  </a>
                {/if}
                {#if p.website}
                  <a
                    class="action primary"
                    href={p.website}
                    target="_blank"
                    rel="noopener"
                    on:click={() => trackEvent('aa_clickout', { surface: 'near', type: 'website', kind: p.kind || 'other' })}
                  >
                    Web →
                  </a>
                {:else if p.osm_url}
                  <a
                    class="action primary"
                    href={p.osm_url}
                    target="_blank"
                    rel="noopener"
                    on:click={() => trackEvent('aa_clickout', { surface: 'near', type: 'osm', kind: p.kind || 'other' })}
                  >
                    Detail (OSM) →
                  </a>
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
        <div class="section-title">{language === 'czech' ? '✅ Ověřené od komunity' : '✅ Community verified'}</div>
        <div class="muted">
          {language === 'czech'
            ? 'Organizace a akce, které nám lidé poslali a my je ručně ověřili.'
            : 'Organizations and events submitted by people and manually verified.'}
        </div>

        {#if isFetchingCommunity}
          <div class="card empty">{language === 'czech' ? 'Načítám…' : 'Loading…'}</div>
        {:else if communityItems.length === 0}
          <div class="card empty">
            {language === 'czech'
              ? 'Zatím tu nic není. Pokud chcete, pošlete tip – ověříme a přidáme.'
              : 'Nothing here yet. You can submit a tip — we’ll verify and add.'}
            <div style="height:0.6rem;"></div>
            <a class="inline-link" href="/submit" on:click={() => trackEvent('aa_submit_open', { from: 'near_community_empty' })}>
              ➕ Přidat organizaci / akci →
            </a>
          </div>
        {:else}
          <div class="grid places-grid">
            {#each communityItems as it}
              <div class="card place">
                <div class="place-title">{communityEmoji(it)} {it.name}</div>

                <div class="badges">
                  <span class="badge kind">✅ Ověřené</span>
                  <span class="badge sub">{communityKindLabel(it)}</span>
                  {#if it.category}
                    <span class="badge sub">{it.category}</span>
                  {/if}
                </div>

                <div class="place-meta">
                  <span>~{it.distanceKm} km</span>
                  {#if it.kind === 'event' && communityWhen(it)}
                    <span class="dot">•</span>
                    <span>{communityWhen(it)}</span>
                  {/if}
                </div>

                {#if it.address_label}
                  <div class="place-line"><span class="ico">📍</span><span>{it.address_label}</span></div>
                {/if}

                {#if it.phone}
                  <div class="place-line">
                    <span class="ico">📞</span>
                    {#if phoneHref(it.phone)}
                      <a class="inline-link" href={phoneHref(it.phone)}>{it.phone}</a>
                    {:else}
                      <span>{it.phone}</span>
                    {/if}
                  </div>
                {/if}
                {#if it.email}
                  <div class="place-line">
                    <span class="ico">✉️</span>
                    {#if emailHref(it.email)}
                      <a class="inline-link" href={emailHref(it.email)}>{it.email}</a>
                    {:else}
                      <span>{it.email}</span>
                    {/if}
                  </div>
                {/if}
                {#if it.description}
                  <div class="place-desc">{truncate(it.description, 160)}</div>
                {/if}

                <div class="place-actions">
                  <button class="action secondary" type="button" on:click={() => focusLatLon(it.lat, it.lon)}>
                    {language === 'czech' ? 'Zobrazit na mapě' : 'Show on map'}
                  </button>

                  {#if it.kind === 'event' && it.event_url}
                    <a
                      class="action primary"
                      href={it.event_url}
                      target="_blank"
                      rel="noopener"
                      on:click={() => trackEvent('aa_clickout', { surface: 'community', type: 'event_url' })}
                    >
                      {language === 'czech' ? 'Detail / přihlášení →' : 'Details / signup →'}
                    </a>
                  {:else if it.website}
                    <a
                      class="action primary"
                      href={it.website}
                      target="_blank"
                      rel="noopener"
                      on:click={() => trackEvent('aa_clickout', { surface: 'community', type: 'website' })}
                    >
                      Web →
                    </a>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if communityError}
          <div class="muted" style="margin-top:0.5rem;">
            {language === 'czech'
              ? 'Pozn.: komunitní tipy nejsou momentálně dostupné (je potřeba nastavit tabulku v Supabase).'
              : 'Note: community tips are not available right now (Supabase table setup required).'}
          </div>
        {/if}
      </div>

      <div class="results">
        <div class="section-title">
          {language === 'czech' ? '✨ Akce a příležitosti (portály)' : '✨ Real opportunities (portals)'}
        </div>
        <div class="grid portals-grid">
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
              <a
                class="link"
                href={src.url}
                target="_blank"
                rel="noopener"
                on:click={() => trackEvent('aa_clickout', { surface: 'near_portals', id: src.id })}
              >
                {language === 'czech' ? 'Otevřít →' : 'Open →'}
              </a>
            </div>
          {/each}
        </div>
      </div>
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
  .steps {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 0.85rem;
  }
  .step {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: rgba(242, 247, 242, 0.75);
    color: var(--text-secondary);
    font-size: 0.92rem;
    font-weight: 700;
  }
  .step-n {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: var(--czech-forest);
    color: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.82rem;
    font-weight: 900;
  }
  .header-actions {
    display: flex;
    gap: 0.6rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 0.85rem;
  }
  .btn.small {
    padding: 0.55rem 0.75rem;
    font-size: 0.92rem;
  }
  .share-banner {
    margin-top: 0.75rem;
    padding: 0.55rem 0.75rem;
    border-radius: 12px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: rgba(242, 247, 242, 0.7);
    color: var(--text-secondary);
    font-size: 0.92rem;
  }
  .share-banner.error { background: rgba(254, 242, 242, 0.75); border-color: rgba(127, 29, 29, 0.15); }
  .share-banner.ok { background: rgba(236, 253, 245, 0.75); border-color: rgba(6, 95, 70, 0.15); }

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
  .loc-search { display:flex; gap: 0.6rem; align-items:center; flex-wrap: wrap; }
  .text {
    flex: 1;
    min-width: 220px;
    padding: 0.55rem 0.65rem;
    border-radius: 12px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: white;
  }
  .geo-banner {
    margin-top: 0.6rem;
    padding: 0.55rem 0.75rem;
    border-radius: 12px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: rgba(242, 247, 242, 0.7);
    color: var(--text-secondary);
    font-size: 0.92rem;
  }
  .geo-banner.error { background: rgba(254, 242, 242, 0.75); border-color: rgba(127, 29, 29, 0.15); }
  .geo-banner.ok { background: rgba(236, 253, 245, 0.75); border-color: rgba(6, 95, 70, 0.15); }
  .geo-banner.loading { background: rgba(255, 251, 235, 0.8); border-color: rgba(180, 83, 9, 0.14); }
  .geo-results {
    margin-top: 0.6rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
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
  .onlyweb { display:flex; gap: 0.45rem; align-items:center; color: var(--text-secondary); font-size: 0.92rem; }
  .onlyweb input { margin: 0; }

  .split {
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: 0.9rem;
    align-items: start;
  }
  .left { position: sticky; top: 88px; }
  .right { min-width: 0; }

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
  .prefs-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
    margin: 0.15rem 0 0.85rem 0;
  }
  .pref {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .pref-label {
    color: var(--text-secondary);
    font-size: 0.92rem;
    font-weight: 900;
  }
  .pref-chips .chip input { display: none; }
  .pref-chips .chip {
    background: rgba(255,255,255,0.92);
  }
  .pref-chips .chip.selected {
    border-color: rgba(46, 93, 49, 0.28);
    background: rgba(46, 93, 49, 0.10);
  }
  .pref-chips .chip.selected span { color: var(--czech-forest); font-weight: 900; }
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
  .places-grid { grid-template-columns: 1fr; }
  .portals-grid { grid-template-columns: 1fr; }
  .place { padding: 0.9rem; }
  .place.is-active {
    border-color: rgba(46, 93, 49, 0.28);
    box-shadow: 0 18px 40px rgba(0,0,0,0.10);
    background: rgba(255,255,255,0.98);
  }
  .place-title { font-weight: 800; color: var(--czech-forest); margin-bottom: 0.25rem; }
  .place-meta { color: var(--text-secondary); font-size: 0.9rem; display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap; }
  .dot { opacity: 0.5; }
  .place-line { margin-top: 0.4rem; color: var(--text-secondary); font-size: 0.92rem; display:flex; gap: 0.45rem; align-items:flex-start; }
  .ico { line-height: 1.2; }
  .inline-link { color: var(--czech-forest); font-weight: 800; text-decoration: none; }
  .inline-link:hover { text-decoration: underline; }
  .place-desc { margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.92rem; line-height: 1.55; }
  .place-hint {
    margin-top: 0.55rem;
    padding: 0.55rem 0.65rem;
    border-radius: 12px;
    border: 1px solid rgba(44, 62, 45, 0.10);
    background: rgba(242, 247, 242, 0.65);
    color: var(--text-secondary);
    font-size: 0.92rem;
    line-height: 1.5;
  }
  .badges { display:flex; gap: 0.45rem; flex-wrap: wrap; margin: 0.35rem 0 0.35rem 0; }
  .why-badges { margin-top: 0; }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: rgba(255,255,255,0.9);
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 800;
  }
  .badge.kind { color: var(--czech-forest); background: rgba(242, 247, 242, 0.85); }
  .badge.sub { background: rgba(255,255,255,0.85); }
  .badge.why { background: rgba(46, 93, 49, 0.06); }
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
    .split { grid-template-columns: 1fr; }
    .left { position: static; }
    .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .map { height: 460px; }
    .places-grid { grid-template-columns: 1fr; }
    .portals-grid { grid-template-columns: 1fr; }
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
    transition: transform 0.12s ease, box-shadow 0.15s ease, background 0.15s ease;
  }
  :global(.place-pin:hover .pin) {
    transform: scale(1.08);
    box-shadow: 0 14px 26px rgba(0,0,0,0.16);
  }
  :global(.place-pin.is-active .pin) {
    transform: scale(1.18);
    box-shadow: 0 0 0 10px rgba(46, 93, 49, 0.14), 0 18px 34px rgba(0,0,0,0.18);
  }
  :global(.place-pin .pin-ngo) { background: rgba(46, 93, 49, 0.08); }
  :global(.place-pin .pin-community) { background: rgba(62, 122, 67, 0.08); }
  :global(.place-pin .pin-food) { background: rgba(180, 83, 9, 0.08); }
  :global(.place-pin .pin-animals) { background: rgba(29, 78, 216, 0.08); }
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

  /* Cluster styling (keeps dense areas readable + playful) */
  :global(.marker-cluster) {
    background: rgba(46, 93, 49, 0.14);
    border: 2px solid rgba(46, 93, 49, 0.18);
    border-radius: 999px;
    box-shadow: 0 14px 26px rgba(0,0,0,0.14);
  }
  :global(.marker-cluster div) {
    background: rgba(255,255,255,0.92);
    color: var(--czech-forest);
    font-weight: 900;
    border-radius: 999px;
    border: 1px solid rgba(44, 62, 45, 0.12);
  }
</style>


