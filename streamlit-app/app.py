"""
Akcelerátor altruismu - Hlavní vstupní bod
Jemný průvodce transformací empatie v konkrétní akce
"""

import streamlit as st
from config.settings import configure_page
from config.styling import apply_styles
from core.session import initialize_session_state
from core.journey import show_journey_flow
from core.navigation import _render_settings_panel
from components.emergency_help import render_gentle_crisis_support
from data.loaders import load_actions_data, load_causes_data
from content import get_content
import json
from datetime import datetime
import math
from typing import Any
import requests

try:
    # Optional dependency for browser geolocation (added to requirements.txt).
    # If unavailable, we fall back to manual city selection.
    from streamlit_geolocation import streamlit_geolocation  # type: ignore
    _HAS_GEOLOCATION = True
except Exception:
    _HAS_GEOLOCATION = False

try:
    import folium  # type: ignore
    from streamlit_folium import st_folium  # type: ignore
    _HAS_FOLIUM = True
except Exception:
    _HAS_FOLIUM = False


@st.cache_data(ttl=60 * 60, show_spinner=False)
def _fetch_osm_places(lat: float, lon: float, radius_m: int, kinds: tuple[str, ...]) -> list[dict[str, Any]]:
    """Fetch nearby places from OpenStreetMap via Overpass API.

    This is best-effort. We intentionally keep it small + cached to avoid hammering public endpoints.
    """

    # Overpass endpoints (try in order)
    endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
    ]

    tag_queries = []
    for k in kinds:
        if k == "ngo":
            tag_queries.append('["office"="ngo"]')
            tag_queries.append('["office"="association"]')
        elif k == "community":
            tag_queries.append('["amenity"="community_centre"]')
            tag_queries.append('["amenity"="social_facility"]')
        elif k == "animals":
            tag_queries.append('["amenity"="animal_shelter"]')
        elif k == "food":
            tag_queries.append('["amenity"="food_bank"]')
            tag_queries.append('["amenity"="social_facility"]["social_facility"="food_bank"]')

    if not tag_queries:
        return []

    parts = []
    for tq in tag_queries:
        parts.append(f'node(around:{radius_m},{lat},{lon}){tq};')
        parts.append(f'way(around:{radius_m},{lat},{lon}){tq};')
        parts.append(f'relation(around:{radius_m},{lat},{lon}){tq};')

    query = "[out:json][timeout:25];(" + "".join(parts) + ");out center tags 80;"

    last_err: Exception | None = None
    for url in endpoints:
        try:
            resp = requests.post(
                url,
                data=query.encode("utf-8"),
                headers={
                    "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
                    "User-Agent": "AkceleratorAltruismu/1.0 (streamlit app; contact: none)",
                },
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            out: list[dict[str, Any]] = []
            for el in data.get("elements", []):
                tags = el.get("tags") or {}
                name = tags.get("name") or tags.get("operator") or tags.get("brand")
                website = tags.get("website") or tags.get("contact:website")
                if "lat" in el and "lon" in el:
                    plat, plon = el["lat"], el["lon"]
                elif "center" in el:
                    plat, plon = el["center"].get("lat"), el["center"].get("lon")
                else:
                    continue
                if plat is None or plon is None:
                    continue
                out.append(
                    {
                        "name": name,
                        "lat": float(plat),
                        "lon": float(plon),
                        "website": website,
                        "tags": tags,
                    }
                )
            return out
        except Exception as e:
            last_err = e
            continue

    if last_err:
        raise last_err
    return []

def main():
    """Hlavní vstupní bod aplikace - s navigací a lineární cestou"""
    
    # Healthcheck endpoint for monitoring and embed checks
    try:
        qp = getattr(st, "query_params", None)
        if qp and (qp.get("healthz") is not None):
            st.write({"status": "ok"})
            return
    except Exception:
        pass

    # Konfigurace stránky
    configure_page()
    
    # Aplikace stylů
    apply_styles()
    
    # Inicializace session state
    initialize_session_state()
    
    # Skrytí všech Streamlit elementů
    _hide_streamlit_elements()
    
    # Inicializace current_page pokud neexistuje - default je 'journey' (Cesta)
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'journey'
    
    # Get language for the entire app
    language = st.session_state.get('language', 'czech')

    # First-visit intro screen: render it as a real page (avoid stacking multiple top bars)
    if _render_first_visit_chooser(language):
        st.stop()

    # Top navigace
    _render_enhanced_navigation(language)

    # Onboarding helper + mini impact can be visually noisy on the Journey welcome screen.
    # Show them only after the user has started the journey.
    if st.session_state.current_page != 'journey' or st.session_state.get('journey_step') != 'welcome':
        _render_onboarding_helper(language)
        _render_mini_impact(language)
    
    # Hlavní obsah na základě vybrané stránky
    if st.session_state.current_page == 'journey':
        show_journey_flow()
    elif st.session_state.current_page == 'quick_actions':
        _show_quick_actions_page(language)
        _render_context_tip(language, tip_key='quick_actions', cta_key='go_to_journey')
    elif st.session_state.current_page == 'impact':
        _show_impact_page(language)
        _render_context_tip(language, tip_key='impact', cta_key='quick_help')
    elif st.session_state.current_page == 'causes':
        _show_causes_page(language)
        _render_context_tip(language, tip_key='causes', cta_key='go_to_journey')
    elif st.session_state.current_page == 'feedback':
        _show_feedback_page(language)
        _render_context_tip(language, tip_key='feedback', cta_key='go_to_journey')
    elif st.session_state.current_page == 'settings':
        _render_settings_panel(language)
    
    # Jemná krizová podpora - vždy přítomná
    render_gentle_crisis_support(language)

def _render_first_visit_chooser(language: str) -> bool:
    """True intro page shown on first visit. Returns True if it rendered (caller should st.stop())."""
    if st.session_state.get('onboarding_completed'):
        return False
    # Only show once per session
    if st.session_state.get('first_visit_prompt_shown'):
        return False
    st.session_state.first_visit_prompt_shown = True

    title = "🌿 Začít pomáhat" if language == "czech" else "🌿 Start helping"
    subtitle = (
        "Vyberte si: rovnou na ověřené organizace, nebo krátký průvodce (3–5 min)."
        if language == "czech"
        else "Choose: go straight to trusted organizations, or a short guide (3–5 min)."
    )
    direct_title = "🏛️ Ověřené organizace" if language == "czech" else "🏛️ Trusted organizations"
    direct_body = (
        "Jeden klik → web organizace. Nejnižší tření."
        if language == "czech"
        else "One click → organization website. Lowest friction."
    )
    guide_title = "🧭 Průvodce (na míru)" if language == "czech" else "🧭 Guided (tailored)"
    guide_body = (
        "Vyberete 1–2 oblasti a my doporučíme konkrétní akci."
        if language == "czech"
        else "Pick 1–2 areas and we’ll recommend a concrete action."
    )

    st.markdown(f"<div class='main-header'>{title}</div>", unsafe_allow_html=True)
    st.markdown(f"<div class='sub-header'>{subtitle}</div>", unsafe_allow_html=True)

    col_a, col_b = st.columns(2)
    with col_a:
        st.markdown(
            f"""
            <div class="cta-section">
              <div style="color:#2E5D31; font-weight:700; font-size:1.05rem; margin-bottom:0.25rem;">{direct_title}</div>
              <div style="color:#516051; margin-bottom:0.75rem;">{direct_body}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("🚀 " + ("Jít rovnou" if language == "czech" else "Go now"), use_container_width=True, type="primary", key="chooser_quick"):
            st.session_state.current_page = 'quick_actions'
            st.session_state.onboarding_completed = True
            st.rerun()

    with col_b:
        st.markdown(
            f"""
            <div class="cta-section">
              <div style="color:#2E5D31; font-weight:700; font-size:1.05rem; margin-bottom:0.25rem;">{guide_title}</div>
              <div style="color:#516051; margin-bottom:0.75rem;">{guide_body}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("🌿 " + ("Najít moji cestu" if language == "czech" else "Find my way"), use_container_width=True, type="secondary", key="chooser_guide"):
            st.session_state.current_page = 'journey'
            st.session_state.journey_step = 'welcome'
            st.session_state.onboarding_completed = True
            st.rerun()

    return True

def _render_onboarding_helper(language: str):
    """Jasná vodítka: kde právě jsem a co je další krok.
    Zobrazuje se na začátku každé stránky, aby bylo hned zřejmé, co dělat.
    """
    journey_step = st.session_state.get('journey_step', 'welcome')

    # Journey flow was simplified (emotional_check removed)
    steps = ['welcome', 'values_discovery', 'action_selection']
    titles_cs = {
        'welcome': 'Vítejte',
        'values_discovery': 'Co je pro vás důležité?',
        'action_selection': 'Vyberte si první akci'
    }
    titles_en = {
        'welcome': 'Welcome',
        'values_discovery': 'What matters to you?',
        'action_selection': 'Pick your first action'
    }

    if journey_step in steps and st.session_state.get('current_page') == 'journey':
        idx = steps.index(journey_step)
        total = len(steps)
        title = (titles_cs if language == 'czech' else titles_en)[journey_step]
        next_step = steps[idx + 1] if idx + 1 < total else None
        next_label = (
            {
                'welcome': 'Pokračovat →',
                'values_discovery': 'Najít moji akci →',
                'action_selection': 'Spustit akci →'
            } if language == 'czech' else {
                'welcome': 'Continue →',
                'values_discovery': 'Find my action →',
                'action_selection': 'Start action →'
            }
        ).get(journey_step, 'Continue →')

        st.markdown(
            f"""
            <div style="
                margin: 0 0 0.75rem 0;
                padding: 0.75rem 0.9rem;
                background: #ffffff;
                border: 1px solid rgba(44, 62, 45, 0.12);
                border-radius: 14px;
                box-shadow: 0 10px 28px rgba(0,0,0,0.08);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.75rem;
                flex-wrap: wrap;
            ">
                <div style="color:#2E5D31; font-weight:650;">
                    {('Krok' if language=='czech' else 'Step')} {idx+1}/{total}: {title}
                </div>
                <div style="color:#516051; font-size:0.92rem;">
                    {('Tip: pokračujte jedním tlačítkem' if language=='czech' else 'Tip: continue with one button')}
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

        col_a, col_b, col_c = st.columns([2, 2, 1])
        with col_b:
            if st.button(next_label, use_container_width=True, type="primary", key="onboarding_next"):
                if next_step:
                    st.session_state.journey_step = next_step
                st.rerun()

def _render_mini_impact(language: str):
    actions_done = len(st.session_state.get('completed_actions', []))
    goal_label = "Cíl dnes: 1 laskavý krok" if language=='czech' else "Today: 1 kind step"
    done_label = f"{actions_done} " + ("akcí celkem" if language=='czech' else "actions total")
    colx, coly, colz = st.columns([2,2,2])
    with colx:
        st.markdown(f"<div class='impact-metric'>{goal_label}</div>", unsafe_allow_html=True)
    with coly:
        st.markdown(f"<div class='impact-metric'>{done_label}</div>", unsafe_allow_html=True)
    with colz:
        # Gentle nudge to quick help when no action done yet
        if actions_done == 0:
            st.button("⚡ " + ("Rychlá pomoc" if language=='czech' else "Quick Help"), use_container_width=True, key="mini_quick", on_click=lambda: _goto('quick_actions'))

def _goto(page_name: str):
    st.session_state.current_page = page_name
    st.rerun()

def _render_context_tip(language: str, tip_key: str, cta_key: str):
    """Small contextual helper bar with a single action.
    tip_key: logical area; cta navigates to relevant next step.
    """
    tips_cs = {
        'quick_actions': 'Tip: Nevíte, co vybrat? Vraťte se k průvodci a najdeme akci na míru.',
        'impact': 'Tip: Udělali jste akci? Zkuste rychlou pomoc a přidejte další krok.',
        'causes': 'Tip: Vyberte oblasti, které jsou vám blízké – poradíme konkrétní kroky.',
        'feedback': 'Tip: Vaše zpětná vazba pomůže ostatním. Děkujeme!'
    }
    tips_en = {
        'quick_actions': "Tip: Not sure what to pick? Return to the guide to get a tailored action.",
        'impact': "Tip: Completed an action? Try Quick Help and add another step.",
        'causes': "Tip: Choose areas that matter to you – we'll recommend concrete steps.",
        'feedback': "Tip: Your feedback helps others. Thank you!"
    }

    cta_cs = {
        'go_to_journey': 'Přejít na průvodce →',
        'quick_help': 'Rychlá pomoc →'
    }
    cta_en = {
        'go_to_journey': 'Go to guide →',
        'quick_help': 'Quick Help →'
    }

    tip = (tips_cs if language == 'czech' else tips_en).get(tip_key)
    cta_label = (cta_cs if language == 'czech' else cta_en).get(cta_key, 'Continue →')

    if not tip:
        return

    st.markdown(
        f"""
        <div style="
            margin: 1rem 0;
            padding: 0.75rem 1rem;
            background: #f6fbf6;
            border: 1px solid #e2efe2;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
        ">
            <div style="color:#2E5D31;">{tip}</div>
        </div>
        """,
        unsafe_allow_html=True
    )

    col1, col2, col3 = st.columns([2, 2, 1])
    with col2:
        if st.button(cta_label, use_container_width=True, key=f"ctx_cta_{tip_key}"):
            if cta_key == 'go_to_journey':
                st.session_state.current_page = 'journey'
            elif cta_key == 'quick_help':
                st.session_state.current_page = 'quick_actions'
            st.rerun()

def _hide_streamlit_elements():
    """Skrytí všech základních Streamlit elementů"""
    st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        .stDeployButton {display: none;}
        .stDecoration {display: none;}
    </style>
    """, unsafe_allow_html=True)

def _render_enhanced_navigation(language):
    """Vylepšená navigace s důrazem na rychlé akce"""
    
    st.markdown("""
    <div style="
        background: #F8FBF8;
        padding: 0.5rem 0;
        margin: -0.5rem -0.5rem 1.25rem -0.5rem;
    ">
        <div style="
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 0.75rem;
        ">
    """, unsafe_allow_html=True)
    
    # Navigation tabs
    cols = st.columns([1, 1, 1.2, 1, 1, 1])
    
    with cols[0]:
        if st.button("🧭 Cesta", use_container_width=True, 
                    type="primary" if st.session_state.current_page == 'journey' else "secondary"):
            st.session_state.current_page = 'journey'
            # Reset journey to welcome when clicking Cesta
            if 'journey_step' in st.session_state:
                st.session_state.journey_step = 'welcome'
            # Clear previous selections for a fresh start
            if 'selected_values' in st.session_state:
                st.session_state.selected_values = []
            if 'user_profile' in st.session_state and isinstance(st.session_state.user_profile, dict):
                st.session_state.user_profile['values'] = []
            st.rerun()
    
    with cols[1]:
        if st.button("📊 Dopad", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'impact' else "secondary"):
            st.session_state.current_page = 'impact'
            st.rerun()
    
    with cols[2]:
        if st.button("⚡ RYCHLÁ POMOC", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'quick_actions' else "secondary", key="quick_actions_btn"):
            st.session_state.current_page = 'quick_actions'
            st.rerun()
    
    with cols[3]:
        if st.button("🌍 Oblasti", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'causes' else "secondary"):
            st.session_state.current_page = 'causes'
            st.rerun()
    
    with cols[4]:
        if st.button("📝 Zpětná vazba", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'feedback' else "secondary"):
            st.session_state.current_page = 'feedback'
            st.rerun()
    
    with cols[5]:
        if st.button("⚙️ Nastavení", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'settings' else "secondary"):
            st.session_state.current_page = 'settings'
            st.rerun()
    
    st.markdown("</div></div>", unsafe_allow_html=True)

def _show_quick_actions_page(language):
    """Stránka rychlých akcí - okamžitá pomoc"""
    
    title = "⚡ Rychlá pomoc" if language == "czech" else "⚡ Quick help"
    subtitle = (
        "Věci, které můžete udělat právě teď. Žádné dlouhé registrace, žádné čekání."
        if language == "czech"
        else "Things you can do right now. No long signup, no waiting."
    )
    st.markdown(f"<div class='main-header'>{title}</div>", unsafe_allow_html=True)
    st.markdown(f"<div class='sub-header'>{subtitle}</div>", unsafe_allow_html=True)
    
    # Filters and progress chip
    st.markdown("""
    <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
      <div style="color:#2E5D31; font-weight:600;">Okamžité akce</div>
      <div style="background:#e8f5e8; border:1px solid #dbe8db; color:#2E5D31; padding:4px 10px; border-radius:999px; font-size:0.9rem;">
        {completed} dokončeno
      </div>
    </div>
    """.format(completed=len(st.session_state.get('completed_actions', []))), unsafe_allow_html=True)

    # Simple geo helpers (Czech city centroids) for “near you”
    CITY_COORDS = {
        "praha": (50.0755, 14.4378),
        "brno": (49.1951, 16.6068),
        "ostrava": (49.8209, 18.2625),
        "plzen": (49.7384, 13.3736),
        "olomouc": (49.5938, 17.2509),
        "liberec": (50.7671, 15.0562),
        "hradec kralove": (50.2092, 15.8328),
        "ceske budejovice": (48.9747, 14.4743),
        "usti nad labem": (50.6607, 14.0323),
    }

    def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0
        p1 = math.radians(lat1)
        p2 = math.radians(lat2)
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
        return 2 * r * math.asin(math.sqrt(a))

    def _norm_place(action: dict) -> str:
        # Some data uses requirements.location, some uses action.location.
        return str(action.get("location") or action.get("requirements", {}).get("location") or "").strip().lower()

    def _extract_city_key(place: str) -> str | None:
        if not place:
            return None
        # Match by containment for simple city tags (praha/brno/ostrava/etc.)
        for k in CITY_COORDS.keys():
            if k in place:
                return k
        return None

    near_label = "V okolí" if language == "czech" else "Near me"
    with st.expander("🎯 " + ("Filtrovat" if language == "czech" else "Filters"), expanded=False):
        colf1, colf2 = st.columns(2)
        with colf1:
            time_filter = st.selectbox(
                "Čas" if language == "czech" else "Time",
                ["Libovolně", "Do 15 min", "Do 1 hod"] if language == "czech" else ["Any", "≤ 15 min", "≤ 1 hour"],
                index=0,
            )
        with colf2:
            location_filter = st.selectbox(
                "Místo" if language == "czech" else "Place",
                ["Kdekoli", "Online", "Praha", "Brno", "Ostrava", near_label]
                if language == "czech"
                else ["Anywhere", "Online", "Prague", "Brno", "Ostrava", near_label],
                index=0,
            )

        if location_filter == near_label:
            st.markdown("<div class='section-header'>📍 " + ( "V okolí" if language=="czech" else "Near you") + "</div>", unsafe_allow_html=True)

            # Keep location in session (so filters don’t reset all the time)
            if "user_location" not in st.session_state:
                st.session_state.user_location = None

            colg1, colg2 = st.columns([2, 1])
            with colg1:
                city_options = ["Praha", "Brno", "Ostrava", "Plzeň", "Olomouc", "Liberec", "Hradec Králové", "České Budějovice", "Ústí nad Labem"]
                city_choice = st.selectbox(
                    "Město" if language == "czech" else "City",
                    ["(vyberte)"] + city_options if language == "czech" else ["(select)"] + city_options,
                    index=0,
                    key="near_city_choice",
                )

            with colg2:
                radius_km = st.slider(
                    "Okruh (km)" if language == "czech" else "Radius (km)",
                    min_value=5,
                    max_value=200,
                    value=25,
                    step=5,
                    key="near_radius_km",
                )

            # Optional browser geolocation (best UX) + manual fallback
            if _HAS_GEOLOCATION:
                if st.button("📍 " + ("Použít moji polohu (GPS)" if language == "czech" else "Use my location (GPS)"), use_container_width=True, key="near_use_gps"):
                    try:
                        loc = streamlit_geolocation()
                        if loc and loc.get("latitude") and loc.get("longitude"):
                            st.session_state.user_location = {"lat": float(loc["latitude"]), "lon": float(loc["longitude"]), "source": "gps"}
                    except Exception:
                        # Silent fallback; user can still choose city
                        pass

            # Manual city selection -> coordinates
            if city_choice and not city_choice.startswith("("):
                norm = (
                    city_choice.lower()
                    .replace("č", "c").replace("ě", "e").replace("š", "s").replace("ř", "r")
                    .replace("ž", "z").replace("ý", "y").replace("á", "a").replace("í", "i")
                    .replace("é", "e").replace("ů", "u").replace("ú", "u").replace("ň", "n")
                    .replace("ď", "d").replace("ť", "t").replace("ó", "o")
                )
                norm = norm.replace("plzeň", "plzen").replace("hradec králové", "hradec kralove").replace("české budějovice", "ceske budejovice").replace("ústí nad labem", "usti nad labem")
                # Normalize spaces
                norm = " ".join(norm.split())
                if norm in CITY_COORDS:
                    lat, lon = CITY_COORDS[norm]
                    st.session_state.user_location = {"lat": lat, "lon": lon, "source": "city"}

    # Load actions data
    try:
        actions_data = load_actions_data(language)
        actions = actions_data
        
        # Filter for quick actions (low time commitment, immediate impact)
        quick_actions = {}
        for key, action in actions.items():
            minutes = action.get('requirements', {}).get('time_minutes', 999)
            commitment = action.get('commitment_type')
            place = _norm_place(action)
            if minutes <= 30 or commitment == 'one_time':
                # Time filter
                if (time_filter == "Do 15 min" or time_filter == "≤ 15 min") and minutes > 15:
                    continue
                if (time_filter == "Do 1 hod" or time_filter == "≤ 1 hour") and minutes > 60:
                    continue
                # Location filter
                if location_filter not in ("Kdekoli", "Anywhere"):
                    lf = str(location_filter).lower()
                    if lf in ("online",):
                        if "online" not in place and place not in ("any", "remote"):
                            continue
                    elif location_filter == near_label:
                        user_loc = st.session_state.get("user_location")
                        if not user_loc:
                            # Without a user location, don't show location-specific results
                            continue
                        city_key = _extract_city_key(place)
                        if not city_key:
                            # If action isn't city-tagged, keep only online/any actions
                            if place not in ("any", "online", "remote"):
                                continue
                        else:
                            lat2, lon2 = CITY_COORDS[city_key]
                            dist = _haversine_km(float(user_loc["lat"]), float(user_loc["lon"]), lat2, lon2)
                            if dist > float(st.session_state.get("near_radius_km", 25)):
                                continue
                            action["_distance_km"] = round(dist)
                    else:
                        if lf == "prague":
                            lf = "praha"
                        if lf not in place:
                            continue
                quick_actions[key] = action
        
        # Sort: if "near me" computed distances, show closest first
        def _sort_key(item: tuple[str, dict]) -> tuple[int, str]:
            _, a = item
            d = a.get("_distance_km")
            return (int(d) if d is not None else 10_000, str(a.get("title", "")))

        items = list(quick_actions.items())
        items.sort(key=_sort_key)

        tab_list, tab_map = st.tabs(
            ["📋 " + ("Seznam" if language == "czech" else "List"), "🗺️ " + ("Mapa" if language == "czech" else "Map")]
        )

        with tab_list:
            cols = st.columns(2)
            for i, (_, action) in enumerate(items):
                with cols[i % 2]:
                    _render_quick_action_card(action, language)

        with tab_map:
            if not _HAS_FOLIUM:
                st.info(
                    "🗺️ "
                    + (
                        "Mapa se načte po nasazení (balíčky folium/streamlit-folium se nainstalují)."
                        if language == "czech"
                        else "Map will work after deploy (folium/streamlit-folium will be installed)."
                    )
                )
            else:
                user_loc = st.session_state.get("user_location")
                center_lat, center_lon = (50.0755, 14.4378)  # Prague default
                if user_loc and user_loc.get("lat") and user_loc.get("lon"):
                    center_lat, center_lon = float(user_loc["lat"]), float(user_loc["lon"])

                # Render map (click to set location)
                m = folium.Map(location=[center_lat, center_lon], zoom_start=12, tiles="CartoDB positron", control_scale=True)
                folium.CircleMarker(
                    location=[center_lat, center_lon],
                    radius=7,
                    color="#2E5D31",
                    fill=True,
                    fill_color="#2E5D31",
                    fill_opacity=0.9,
                    tooltip=("Vaše poloha" if language == "czech" else "Your location"),
                ).add_to(m)

                # Action markers (from app data)
                for _, action in items[:120]:
                    place = _norm_place(action)
                    city_key = _extract_city_key(place)
                    if not city_key:
                        continue
                    lat2, lon2 = CITY_COORDS[city_key]
                    org = action.get("organization", {}).get("name", "")
                    url = action.get("organization", {}).get("website", action.get("url", ""))
                    title_txt = action.get("title", "Akce")
                    popup_parts = [f"<b>{title_txt}</b>"]
                    if org:
                        popup_parts.append(f"<div>{org}</div>")
                    if url and url != "#":
                        popup_parts.append(f"<div><a href='{url}' target='_blank' rel='noopener'>Otevřít odkaz</a></div>")
                    popup_html = "<div style='max-width:260px;'>" + "".join(popup_parts) + "</div>"
                    folium.CircleMarker(
                        location=[lat2, lon2],
                        radius=6,
                        color="#3E7A43",
                        fill=True,
                        fill_color="#3E7A43",
                        fill_opacity=0.7,
                        tooltip=title_txt,
                        popup=folium.Popup(popup_html, max_width=300),
                    ).add_to(m)

                # Real nearby places (OpenStreetMap via Overpass) – optional
                st.markdown("<div class='section-header'>🧭 " + ("Okolí na mapě" if language=="czech" else "Nearby on the map") + "</div>", unsafe_allow_html=True)
                st.caption(
                    "Data jsou z OpenStreetMap (může být neúplné)."
                    if language == "czech"
                    else "Data comes from OpenStreetMap (may be incomplete)."
                )
                colm1, colm2 = st.columns([2, 1])
                with colm1:
                    kinds = st.multiselect(
                        "Co hledat" if language == "czech" else "What to show",
                        options=["ngo", "community", "food", "animals"],
                        default=["ngo", "community"],
                        format_func=lambda x: {
                            "ngo": "🏛️ Organizace / spolky" if language=="czech" else "🏛️ NGOs / associations",
                            "community": "🏘️ Komunitní místa" if language=="czech" else "🏘️ Community places",
                            "food": "🍞 Potravinová pomoc" if language=="czech" else "🍞 Food aid",
                            "animals": "🐾 Zvířata" if language=="czech" else "🐾 Animals",
                        }[x],
                        key="map_kinds",
                    )
                with colm2:
                    radius_km = st.slider(
                        "Okruh (km)" if language == "czech" else "Radius (km)",
                        min_value=1,
                        max_value=25,
                        value=5,
                        step=1,
                        key="map_radius_km",
                    )

                places: list[dict[str, Any]] = []
                if kinds:
                    try:
                        places = _fetch_osm_places(center_lat, center_lon, int(radius_km) * 1000, tuple(kinds))
                    except Exception:
                        places = []

                for p in places[:120]:
                    nm = p.get("name") or ("Místo pomoci" if language == "czech" else "Place to help")
                    w = p.get("website")
                    popup_html = f"<div style='max-width:260px;'><b>{nm}</b>"
                    if w:
                        popup_html += f"<div><a href='{w}' target='_blank' rel='noopener'>web</a></div>"
                    popup_html += "</div>"
                    folium.CircleMarker(
                        location=[p["lat"], p["lon"]],
                        radius=5,
                        color="#2b6cb0",
                        fill=True,
                        fill_color="#2b6cb0",
                        fill_opacity=0.65,
                        tooltip=nm,
                        popup=folium.Popup(popup_html, max_width=300),
                    ).add_to(m)

                st.caption(
                    "Tip: klikněte do mapy a nastavte svou polohu (pro výběr okolí)."
                    if language == "czech"
                    else "Tip: click the map to set your location."
                )
                st_data: dict[str, Any] = st_folium(m, use_container_width=True, height=520) or {}
                last_clicked = st_data.get("last_clicked")
                if last_clicked and last_clicked.get("lat") and last_clicked.get("lng"):
                    st.session_state.user_location = {
                        "lat": float(last_clicked["lat"]),
                        "lon": float(last_clicked["lng"]),
                        "source": "map_click",
                    }
                    st.rerun()

                if places:
                    st.markdown(
                        "<div class='section-header'>📌 "
                        + (f"Nalezeno: {len(places)} míst" if language == "czech" else f"Found: {len(places)} places")
                        + "</div>",
                        unsafe_allow_html=True,
                    )
                    for p in places[:8]:
                        nm = p.get("name") or ("Místo pomoci" if language == "czech" else "Place to help")
                        w = p.get("website")
                        if w:
                            st.link_button(nm, w, use_container_width=True)
                        else:
                            st.markdown(f"- **{nm}**")
                
    except Exception as e:
        st.error(f"Chyba při načítání akcí: {e}")
        
        # Fallback quick actions
        _render_fallback_quick_actions(language)

def _render_quick_action_card(action, language):
    """Render jednotlivé karty rychlých akcí"""
    
    time_req = action.get('requirements', {}).get('time_minutes', 0)
    cost = action.get('requirements', {}).get('cost_usd', 0)
    organization = action.get('organization', {}).get('name', 'Neznámá organizace')
    website = action.get('organization', {}).get('website', action.get('url', '#'))
    
    time_text = f"{time_req} min" if time_req < 60 else f"{time_req//60}h"
    cost_text = "Zdarma" if cost == 0 else f"~{int(cost * 25)} Kč"
    
    distance_km = action.get("_distance_km")
    place = str(action.get("location") or action.get("requirements", {}).get("location") or "").strip()

    # Card UI aligned with global CSS classes
    st.markdown(f"""
    <div class="action-card">
        <div style="color:#2E5D31; font-weight:700; font-size:1.05rem; margin:0 0 0.5rem 0;">
            {action.get('title', 'Bez názvu')}
        </div>
        <div style="color:#516051; margin:0 0 0.9rem 0; line-height:1.5;">
            {action.get('description', 'Popis není k dispozici')}
        </div>
        <div style="display:flex; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; margin-bottom:0.75rem; font-size:0.92rem; color:#516051;">
            <span>⏱️ {time_text}</span>
            <span>💰 {cost_text}</span>
        </div>
        <div style="background:#F2F7F2; border:1px solid rgba(44, 62, 45, 0.12); padding:0.6rem 0.75rem; border-radius:12px; font-size:0.92rem; color:#2E5D31;">
            <strong>{('Organizace' if language=='czech' else 'Organization')}:</strong> {organization}
        </div>
        <div style="margin-top:0.6rem; display:flex; gap:0.5rem; flex-wrap:wrap; font-size:0.9rem; color:#516051;">
          {f"<span>📍 {place}</span>" if place else ""}
          {f"<span>•</span><span>~{distance_km} km</span>" if distance_km is not None else ""}
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Primary CTA: direct link (no extra confirmation)
    if website and website != '#':
        try:
            st.link_button(
                f"🌐 {('Přejít na ' if language=='czech' else 'Open ')}{organization}",
                url=website,
                use_container_width=True
            )
        except Exception:
            st.markdown(f"[🌐 {('Přejít na ' if language=='czech' else 'Open ')}{organization}]({website})")
    else:
        st.info("ℹ️ " + ("Odkaz není k dispozici, zkuste vyhledat organizaci." if language=='czech' else "No link available, please search for the organization."))

    # Secondary CTA: mark as completed
    done_label = "✅ Hotovo – označit dokončeno" if language=='czech' else "✅ Done – mark completed"
    if st.button(done_label, use_container_width=True, key=f"done_{action.get('id','unknown')}"):
        if 'completed_actions' not in st.session_state:
            st.session_state.completed_actions = []
        st.session_state.completed_actions.append({
            'action': action,
            'completed_at': datetime.now()
        })
        st.success("🎉 " + ("Skvělé! Akce označena jako dokončená." if language=='czech' else "Great! Action marked as completed."))

def _render_fallback_quick_actions(language):
    """Záložní rychlé akce pokud se nepodaří načíst data"""
    
    if language == 'czech':
        fallback_actions = [
            {
                'title': '💚 Dar 100 Kč pro Charitu ČR',
                'description': 'Okamžitý příspěvek na pomoc potřebným v České republice',
                'time': '2 min',
                'cost': '100 Kč',
                'url': 'https://www.charita.cz'
            },
            {
                'title': '🩸 Registrace dárce krve',
                'description': 'Zaregistrujte se jako dárce krve a zachraňte životy',
                'time': '5 min',
                'cost': 'Zdarma',
                'url': 'https://www.darcekrve.cz'
            },
            {
                'title': '🌱 Podpis petice za klima',
                'description': 'Podpořte ochranu klimatu jedním kliknutím',
                'time': '1 min',
                'cost': 'Zdarma',
                'url': 'https://www.greenpeace.org/czech'
            },
            {
                'title': '📱 Sdílení na sociálních sítích',
                'description': 'Sdílejte důležitou zprávu a zvyšte povědomí',
                'time': '30 sec',
                'cost': 'Zdarma',
                'url': '#'
            }
        ]
    else:
        fallback_actions = [
            {
                'title': '💚 $10 Donation to Charity',
                'description': 'Immediate contribution to help those in need',
                'time': '2 min',
                'cost': '$10',
                'url': 'https://www.charitynavigator.org'
            },
            {
                'title': '🩸 Blood Donor Registration',
                'description': 'Register as a blood donor and save lives',
                'time': '5 min',
                'cost': 'Free',
                'url': 'https://www.redcross.org'
            }
        ]
    
    cols = st.columns(2)
    for i, action in enumerate(fallback_actions):
        with cols[i % 2]:
            st.markdown(f"""
            <div style="
                background: #f8fdf8;
                border: 1px solid #7AB87A;
                border-radius: 10px;
                padding: 1rem;
                margin: 0.5rem 0;
            ">
                <h4 style="color: #2E5D31; margin-bottom: 0.5rem;">
                    {action['title']}
                </h4>
                <p style="color: #5A6B5A; margin-bottom: 0.5rem; font-size: 0.9rem;">
                    {action['description']}
                </p>
                <div style="font-size: 0.8rem; color: #4A5E4A;">
                    ⏱️ {action['time']} | 💰 {action['cost']}
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            if st.button(f"Začít", key=f"fallback_{i}", use_container_width=True):
                if action['url'] != '#':
                    st.success(f"Přejděte na: {action['url']}")

def _show_causes_page(language):
    """Stránka oblastí pomoci"""
    
    title = "🌍 Oblasti pomoci" if language == "czech" else "🌍 Causes"
    subtitle = (
        "Objevte různé způsoby, jak můžete pomoci. Každá oblast má své specifické potřeby."
        if language == "czech"
        else "Explore different ways you can help."
    )
    st.markdown(f"<div class='main-header'>{title}</div>", unsafe_allow_html=True)
    st.markdown(f"<div class='sub-header'>{subtitle}</div>", unsafe_allow_html=True)
    
    try:
        causes_data = load_causes_data(language)
        causes = causes_data
        
        for cause_id, cause in causes.items():
            _render_cause_card(cause, language)
            
    except Exception as e:
        st.error(f"Chyba při načítání oblastí: {e}")
        # Show fallback causes
        _render_fallback_causes(language)

def _render_cause_card(cause, language):
    """Render karty jednotlivých oblastí"""
    
    st.markdown(f"""
    <div class="cause-card">
      <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
        <div style="font-size:1.6rem;">{cause.get('emoji', '🌟')}</div>
        <div style="color:#2E5D31; font-weight:750; font-size:1.15rem;">{cause.get('title', 'Bez názvu')}</div>
      </div>
      <div style="color:#516051; line-height:1.6;">
        {cause.get('description', 'Popis není k dispozici')}
      </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Success stories
    success_stories = cause.get('success_stories', [])
    if success_stories:
        with st.expander(f"💫 Příběhy úspěchu - {cause.get('title')}"):
            for story in success_stories:
                st.markdown(f"""
                **{story.get('impact', 'Dopad')}** ({story.get('location', 'Neznámé místo')})
                
                _{story.get('story', 'Příběh není k dispozici')}_
                """)

def _render_fallback_causes(language):
    """Fallback causes when data loading fails"""
    
    if language == 'czech':
        fallback_causes = [
            {
                'emoji': '🏠',
                'title': 'Místní komunita',
                'description': 'Pomoc ve vašem okolí - senioři, rodiny v nouzi, sousedé.'
            },
            {
                'emoji': '🌍',
                'title': 'Životní prostředí',
                'description': 'Ochrana přírody, úklidy, udržitelnost.'
            },
            {
                'emoji': '📚',
                'title': 'Vzdělávání',
                'description': 'Doučování, knihy, podpora studentů.'
            }
        ]
    else:
        fallback_causes = [
            {
                'emoji': '🏠',
                'title': 'Local Community',
                'description': 'Help in your area - seniors, families in need, neighbors.'
            },
            {
                'emoji': '🌍',
                'title': 'Environment',
                'description': 'Nature protection, cleanups, sustainability.'
            },
            {
                'emoji': '📚',
                'title': 'Education',
                'description': 'Tutoring, books, student support.'
            }
        ]
    
    for cause in fallback_causes:
        _render_cause_card(cause, language)

def _show_impact_page(language):
    """Stránka dopadu - statistiky a pokrok"""
    
    title = "📊 Váš dopad" if language == "czech" else "📊 Your impact"
    subtitle = (
        "Každá akce má význam. Zde vidíte, co jste už dokázali."
        if language == "czech"
        else "Every action matters. Here’s what you’ve done so far."
    )
    st.markdown(f"<div class='main-header'>{title}</div>", unsafe_allow_html=True)
    st.markdown(f"<div class='sub-header'>{subtitle}</div>", unsafe_allow_html=True)
    
    # Personal stats
    completed_actions = st.session_state.get('completed_actions', [])
    total_actions = len(completed_actions)
    
    # Calculate estimated people helped
    estimated_help = total_actions * 3  # rough estimate

    # Days since first action
    if completed_actions:
        first_action_date = completed_actions[0].get('completed_at')
        if first_action_date:
            days_helping = (datetime.now() - first_action_date).days
        else:
            days_helping = 1
    else:
        days_helping = 0

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Dokončených akcí" if language == "czech" else "Completed actions", total_actions)
    with col2:
        st.metric("Odhadem pomohlo" if language == "czech" else "Estimated helped", f"~{estimated_help}")
    with col3:
        st.metric("Dní pomáháte" if language == "czech" else "Days helping", days_helping)
    
    # Recent actions
    if completed_actions:
        st.markdown("<div class='section-header'>📝 " + ("Vaše poslední akce" if language=="czech" else "Recent actions") + "</div>", unsafe_allow_html=True)
        for action in completed_actions[-3:]:  # Show last 3 actions
            action_data = action.get('action', {})
            completed_at = action.get('completed_at')
            date_str = completed_at.strftime('%d.%m.%Y') if completed_at else 'Neznámé datum'
            
            st.markdown(f"""
            <div class="action-card" style="border-left: 4px solid rgba(46, 93, 49, 0.35);">
                <div style="font-weight:700; color:#2E5D31;">{action_data.get('title', 'Neznámá akce')}</div>
                <div style="color:#516051; font-size:0.92rem;">{('Dokončeno' if language=='czech' else 'Completed')}: {date_str}</div>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.info("🌱 Zatím jste nedokončili žádnou akci. Začněte svou cestu pomocí!")

def _show_feedback_page(language):
    """Stránka zpětné vazby"""
    
    title = "📝 Zpětná vazba" if language == "czech" else "📝 Feedback"
    subtitle = (
        "Pomozte nám vylepšit Akcelerátor altruismu. Vaše zpětná vazba je pro nás cenná."
        if language == "czech"
        else "Help us improve. Your feedback matters."
    )
    st.markdown(f"<div class='main-header'>{title}</div>", unsafe_allow_html=True)
    st.markdown(f"<div class='sub-header'>{subtitle}</div>", unsafe_allow_html=True)
    
    with st.form("feedback_form"):
        st.markdown("### 💭 Jak hodnotíte svou zkušenost?")
        
        rating = st.select_slider(
            "Celkové hodnocení:",
            options=[1, 2, 3, 4, 5],
            value=4,
            format_func=lambda x: "⭐" * x
        )
        
        st.markdown("### 📝 Co funguje dobře?")
        positive = st.text_area(
            "Napište nám, co se vám líbí:",
            placeholder="Co vás nejvíce oslovilo? Která část byla nejužitečnější?"
        )
        
        st.markdown("### 🔧 Co bychom mohli zlepšit?")
        improvement = st.text_area(
            "Napište nám vaše návrhy:",
            placeholder="Co bylo matoucí? Co by pomohlo? Jaké funkce vám chybí?"
        )
        
        submitted = st.form_submit_button("Odeslat zpětnou vazbu", use_container_width=True, type="primary")
        
        if submitted and (positive.strip() or improvement.strip()):
            # Store feedback in session state
            if 'feedback_submissions' not in st.session_state:
                st.session_state.feedback_submissions = []
            
            st.session_state.feedback_submissions.append({
                'rating': rating,
                'positive': positive,
                'improvement': improvement,
                'submitted_at': st.session_state.get('current_time', 'unknown')
            })
            
            st.success("🙏 Děkujeme za vaši zpětnou vazbu! Pomáhá nám vytvářet lepší zážitek pro všechny.")

if __name__ == "__main__":
    main() 