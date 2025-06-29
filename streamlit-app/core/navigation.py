"""Clean top navigation with hero intro and step-based flow"""

import streamlit as st
from utils.localization import get_text, get_czech_proverb
from logic.encouragement import get_random_encouragement
from core.session import (track_page_visit, check_inactivity, is_returning_user, 
                         toggle_accessibility_feature, add_user_feedback)
from components.emergency_help import render_emergency_widget

def ensure_clean_layout():
    """Ensure completely clean layout with no sidebar remnants"""
    # Hide sidebar completely
    st.markdown("""
    <style>
        /* Hide sidebar completely */
        .css-1d391kg {display: none !important;}
        .css-1cypcdb {display: none !important;}
        .css-17eq0hr {display: none !important;}
        section[data-testid="stSidebar"] {display: none !important;}
        .stSidebar {display: none !important;}
        
        /* Ensure main content uses full width */
        .main .block-container {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            max-width: 100% !important;
        }
    </style>
    """, unsafe_allow_html=True)

def main_navigation():
    """Clean main navigation with top nav bar and hero intro."""
    # Ensure clean layout first
    ensure_clean_layout()
    
    language = st.session_state.get('language', 'czech')
    
    # Track page visit
    track_page_visit(st.session_state.current_page)
    
    # Render top navigation bar
    _render_top_navigation(language)
    
    # Show hero intro for new users or welcome back message
    _render_hero_section(language)
    
    # Show appropriate page content
    _render_main_content()
    
    # Footer with accessibility and feedback
    _render_footer(language)

def _render_top_navigation(language):
    """Render clean top navigation bar"""
    # Create navigation columns
    nav_col1, nav_col2, nav_col3, nav_col4, nav_col5, settings_col = st.columns([1, 1, 1, 1, 1, 1])
    
    current_page = st.session_state.get('current_page', 'assessment')
    
    # Navigation buttons with active state styling
    with nav_col1:
        if st.button("🧭 Cesta" if language == 'czech' else "🧭 Journey", 
                    type="primary" if current_page == 'assessment' else "secondary",
                    use_container_width=True,
                    help="Najděte svou cestu k pomoci" if language == 'czech' else "Find your path to help"):
            st.session_state.current_page = 'assessment'
            st.rerun()
    
    with nav_col2:
        if st.button("⚡ Rychlá pomoc" if language == 'czech' else "⚡ Quick Help", 
                    type="primary" if current_page == 'quick_actions' else "secondary",
                    use_container_width=True,
                    help="Okamžité akce" if language == 'czech' else "Immediate actions"):
            st.session_state.current_page = 'quick_actions'
            st.rerun()
    
    with nav_col3:
        if st.button("📊 Dopad" if language == 'czech' else "📊 Impact", 
                    type="primary" if current_page == 'impact' else "secondary",
                    use_container_width=True,
                    help="Vaše cesta a pokrok" if language == 'czech' else "Your journey and progress"):
            st.session_state.current_page = 'impact'
            st.rerun()
    
    with nav_col4:
        if st.button("🌍 Oblasti" if language == 'czech' else "🌍 Causes", 
                    type="primary" if current_page == 'causes' else "secondary",
                    use_container_width=True,
                    help="Prozkoumejte oblasti pomoci" if language == 'czech' else "Explore areas of help"):
            st.session_state.current_page = 'causes'
            st.rerun()
    
    with nav_col5:
        if st.button("📝 Zpětná vazba" if language == 'czech' else "📝 Feedback", 
                    type="primary" if current_page == 'feedback' else "secondary",
                    use_container_width=True,
                    help="Sdělte nám své myšlenky" if language == 'czech' else "Share your thoughts"):
            st.session_state.current_page = 'feedback'
            st.rerun()
    
    # Settings dropdown in the last column
    with settings_col:
        with st.popover("⚙️ Nastavení" if language == 'czech' else "⚙️ Settings", use_container_width=True):
            _render_settings_panel(language)

def _render_settings_panel(language):
    """Render settings panel in popover"""
    st.markdown("**Jazyk / Language**")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🇨🇿 Čeština", 
                    type="primary" if language == 'czech' else "secondary",
                    use_container_width=True):
            st.session_state.language = 'czech'
            st.rerun()
    with col2:
        if st.button("🇺🇸 English", 
                    type="primary" if language == 'english' else "secondary",
                    use_container_width=True):
            st.session_state.language = 'english'
            st.rerun()
    
    st.markdown("---")
    st.markdown("**Přístupnost / Accessibility**")
    
    # Simple mode toggle
    simple_mode = st.toggle(
        "💡 Jednodušší zobrazení" if language == 'czech' else "💡 Simpler view",
        value=st.session_state.accessibility_mode.get('simple_mode', False),
        help="Zjednodušené rozhraní" if language == 'czech' else "Simplified interface"
    )
    if simple_mode != st.session_state.accessibility_mode.get('simple_mode', False):
        toggle_accessibility_feature('simple_mode')
        st.rerun()
    
    # Large text toggle
    large_text = st.toggle(
        "🔍 Větší text" if language == 'czech' else "🔍 Larger text",
        value=st.session_state.accessibility_mode.get('large_text', False),
        help="Zvětšené písmo" if language == 'czech' else "Enlarged font"
    )
    if large_text != st.session_state.accessibility_mode.get('large_text', False):
        toggle_accessibility_feature('large_text')
        st.rerun()

def _render_hero_section(language):
    """Render hero intro section"""
    # Show different content based on user status
    if is_returning_user() and st.session_state.total_impact.get('actions', 0) > 0:
        _render_welcome_back_section(language)
    else:
        _render_hero_intro(language)

def _render_hero_intro(language):
    """Render hero intro for new users"""
    st.markdown("---")
    
    # Hero container
    hero_container = st.container()
    with hero_container:
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            if language == 'czech':
                st.markdown("""
                <div style="text-align: center; padding: 2rem 0;">
                    <h1 style="color: #2E8B57; margin-bottom: 1rem;">Vítejte</h1>
                    <h3 style="color: #556B2F; font-weight: 300; line-height: 1.6;">
                        Společně můžeme proměnit bezmoc<br/>
                        v proud laskavých činů
                    </h3>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown("""
                <div style="text-align: center; padding: 2rem 0;">
                    <h1 style="color: #2E8B57; margin-bottom: 1rem;">Welcome</h1>
                    <h3 style="color: #556B2F; font-weight: 300; line-height: 1.6;">
                        Together we can turn helplessness<br/>
                        into a ripple of kind actions
                    </h3>
                </div>
                """, unsafe_allow_html=True)

def _render_welcome_back_section(language):
    """Render welcome back section for returning users"""
    st.markdown("---")
    
    actions_count = st.session_state.total_impact.get('actions', 0)
    streak_count = st.session_state.get('streak_count', 0)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if st.session_state.get('user_name'):
            greeting = f"Vítejte zpět, {st.session_state.user_name}!" if language == 'czech' else f"Welcome back, {st.session_state.user_name}!"
        else:
            greeting = "Vítejte zpět!" if language == 'czech' else "Welcome back!"
        
        st.markdown(f"<h2 style='text-align: center; color: #2E8B57;'>👋 {greeting}</h2>", unsafe_allow_html=True)
        
        # Show progress in a clean way
        if actions_count > 0:
            col_a, col_b = st.columns(2)
            with col_a:
                st.metric("Kroky" if language == 'czech' else "Steps", actions_count)
            with col_b:
                if streak_count > 1:
                    st.metric("Série" if language == 'czech' else "Streak", f"{streak_count} 🔥")
        
        # Encouraging message
        encouragement = get_random_encouragement("progress_encouragement", language)
        if encouragement:
            st.info(f"💚 {encouragement}")

def _render_main_content():
    """Render main content based on current page - handled in app.py now"""
    # This function is now handled in app.py
    pass

def _render_feedback_page():
    """Render dedicated feedback page"""
    language = st.session_state.get('language', 'czech')
    
    st.markdown(f"## 📝 {get_text('contact_feedback', language)}")
    
    # Feedback form
    with st.form("feedback_form"):
        feedback_text = st.text_area(
            "Vaše zpětná vazba:" if language == 'czech' else "Your feedback:",
            placeholder="Sdělte nám své myšlenky, návrhy nebo zkušenosti..." if language == 'czech' else "Share your thoughts, suggestions or experiences...",
            height=150
        )
        
        feedback_type = st.selectbox(
            "Typ zpětné vazby:" if language == 'czech' else "Feedback type:",
            ["Obecná zpětná vazba", "Návrh na zlepšení", "Technický problém", "Nový obsah"] if language == 'czech' 
            else ["General feedback", "Improvement suggestion", "Technical issue", "New content"]
        )
        
        submitted = st.form_submit_button("Odeslat zpětnou vazbu" if language == 'czech' else "Send feedback")
        
        if submitted and feedback_text.strip():
            add_user_feedback(feedback_type, feedback_text)
            st.success("Děkujeme za zpětnou vazbu! Velmi si jí vážíme." if language == 'czech' else "Thank you for your feedback! We really appreciate it.")
            st.balloons()
    
    # Quick rating
    st.markdown("---")
    st.markdown("**Rychlé hodnocení aplikace:**" if language == 'czech' else "**Quick app rating:**")
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("👍 Líbí se mi", use_container_width=True):
            add_user_feedback("rating", "positive")
            st.success("Děkujeme! 👍" if language == 'czech' else "Thank you! 👍")
    with col2:
        if st.button("🤔 Nejsem si jistý", use_container_width=True):
            add_user_feedback("rating", "neutral")
            st.success("Díky za upřímnost 🤔" if language == 'czech' else "Thanks for honesty 🤔")
    with col3:
        if st.button("👎 Nelíbí se mi", use_container_width=True):
            add_user_feedback("rating", "negative")
            st.success("Děkujeme za zpětnou vazbu 👎" if language == 'czech' else "Thanks for feedback 👎")

def _render_footer(language):
    """Render footer with additional info and accessibility"""
    st.markdown("---")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.expander("❓ Jak to funguje" if language == 'czech' else "❓ How it works"):
            if language == 'czech':
                st.markdown("""
                1. **Reflexe** - Sdělte nám své hodnoty a možnosti
                2. **Doporučení** - Najdeme akce, které vám sednou  
                3. **Akce** - Udělejte konkrétní krok k pomoci
                4. **Sledování** - Sledujte svou cestu
                """)
            else:
                st.markdown("""
                1. **Reflection** - Share your values and resources
                2. **Recommendations** - We find actions that fit you
                3. **Action** - Take a concrete step to help
                4. **Tracking** - Follow your journey
                """)
    
    with col2:
        if st.expander("🌿 Dnešní moudrost" if language == 'czech' else "🌿 Today's wisdom"):
            proverb = get_czech_proverb('help')
            st.markdown(f"*{proverb}*")
    
    with col3:
        if st.expander("🆘 Potřebujete pomoc?" if language == 'czech' else "🆘 Need help?"):
            st.markdown("**Krizová linka:** 116 111" if language == 'czech' else "**Crisis line:** 116 111")
            st.markdown("**Email:** pomoc@example.com")

def render_navigation_with_error_handling():
    """Wrapper for main navigation with error handling"""
    try:
        main_navigation()
    except Exception as e:
        language = st.session_state.get('language', 'czech')
        st.error("Došlo k chybě. Zkuste obnovit stránku." if language == 'czech' else "An error occurred. Try refreshing the page.")
        
        # Simple fallback
        if st.button("🔄 Obnovit" if language == 'czech' else "🔄 Refresh"):
            st.rerun() 