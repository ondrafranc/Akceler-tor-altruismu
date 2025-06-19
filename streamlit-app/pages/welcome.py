"""Welcome page - the main landing experience"""

import streamlit as st
import random
from utils.localization import get_text
from logic.encouragement import get_random_encouragement, get_seasonal_message, get_emotional_response
from core.session import update_user_profile

def show_welcome_page():
    """A warmer, more narrative welcome page to gently guide the user."""
    language = st.session_state.language
    
    st.markdown('<div class="content-container">', unsafe_allow_html=True)
    
    st.markdown(f'<h1 class="main-header">{get_text("title", language)}</h1>', unsafe_allow_html=True)
    st.markdown(f'<p class="sub-header">{get_text("subtitle", language)}</p>', unsafe_allow_html=True)
    
    if language == 'czech':
        intro_text = """
        **Vítejte v bezpečném prostoru, kde vaše pocity mají váhu a vaše touha pomoci může najít směr.**

        Pokud se cítíte zahlceni, bezradní, nebo jen nevíte, kde začít – jste na správném místě. Tento nástroj není o tom, abyste spasili svět. Je o nalezení jednoho malého, praktického kroku, který dnes můžete udělat, a který bude v souladu s vašimi hodnotami a možnostmi.
        """
    else:
        intro_text = """
        **Welcome to a safe space where your feelings are valid and your desire to help can find direction.**

        If you feel overwhelmed, helpless, or just don't know where to start—you are in the right place. This tool isn't about saving the world. It's about finding one small, practical step you can take today that aligns with your values and your capacity.
        """
    st.info(intro_text)
    
    seasonal_msg = get_random_encouragement("inspirational_quotes", language)
    if seasonal_msg:
        st.markdown(f"""
        <div class="quote-box">
            "{seasonal_msg}"
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    _render_emotional_assessment(language)
    
    st.markdown("---")
    
    _render_cta_section(language)
    
    st.markdown('</div>', unsafe_allow_html=True)

def _render_emotional_assessment(language):
    """Render a more empathetic emotional assessment section."""
    
    if language == 'czech':
        st.markdown("### Než začneme, jak se dnes cítíte?")
        st.markdown("Neexistuje správná nebo špatná odpověď. Pomůže nám to pochopit, co by pro vás bylo teď nejužitečnější.")
        emotional_options = [
            ("zahlcen", "😔 Jsem zahlcen/a problémy světa"),
            ("frustrovan", "😤 Cítím frustraci a chci něco dělat"), 
            ("nadejny", "😊 Mám naději a jsem připraven/a pomoci"),
            ("provinile", "😕 Cítím se provinile, že nedělám víc"),
            ("motivovan", "🔥 Jsem motivován/a a chci něco změnit"),
            ("nejisty", "😐 Nevím, kde začít")
        ]
        emotional_state = st.radio(
            "Vyberte, co nejlépe odpovídá vašim pocitům:",
            [opt[1] for opt in emotional_options],
            key="emotional_state",
            label_visibility="collapsed"
        )
        
        if emotional_state:
            emotion_key = ""
            for key, display_text in emotional_options:
                if display_text == emotional_state:
                    emotion_key = key
                    break
            
            update_user_profile({'emotional_state': emotion_key})
            response = get_emotional_response(emotion_key, language)
            st.success(f"💬 {response}")

    else:
        st.markdown("### Before we begin, how are you feeling today?")
        st.markdown("There's no right or wrong answer. This helps us understand what might be most helpful for you right now.")
        emotional_options = [
            ("overwhelmed", "😔 I'm overwhelmed by the world's problems"),
            ("frustrated", "😤 I feel frustrated and want to do something"),
            ("hopeful", "😊 I feel hopeful and am ready to help"),
            ("guilty", "😕 I feel like I should be doing more"),
            ("motivated", "🔥 I'm motivated to make a change"),
            ("uncertain", "😐 I'm not sure where to start")
        ]
        emotional_state = st.radio(
            "Select what best describes your feelings:",
            [opt[1] for opt in emotional_options],
            key="emotional_state_en",
            label_visibility="collapsed"
        )
        
        if emotional_state:
            emotion_key = ""
            for key, display_text in emotional_options:
                if display_text == emotional_state:
                    emotion_key = key
                    break

            update_user_profile({'emotional_state': emotion_key})
            response = get_emotional_response(emotion_key, language)
            st.success(f"💬 {response}")


def _render_cta_section(language):
    """Render a clearer, more inviting call-to-action section."""
    
    if language == 'czech':
        st.markdown("""
        <div class="cta-section">
            <h3 style="margin-bottom: 1rem; color: #2E5D31;">Dvě cesty, jak začít</h3>
            <p style="color: #5A6B5A; margin-bottom: 1.5rem;">Vyberte si tu, která vám teď dává největší smysl.</p>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div class="cta-section">
            <h3 style="margin-bottom: 1rem; color: #2E5D31;">Two Paths to Begin</h3>
            <p style="color: #5A6B5A; margin-bottom: 1.5rem;">Choose the one that feels right for you today.</p>
        </div>
        """, unsafe_allow_html=True)
    
    col_a, col_b = st.columns(2)
    with col_a:
        if language == 'czech':
            st.markdown("#### Prozkoumat vaši cestu")
            st.markdown("Věnujte 5 minut reflexi, abychom vám mohli doporučit akce šité na míru vašim hodnotám.")
        else:
            st.markdown("#### Explore Your Path")
            st.markdown("Spend 5 minutes on a guided reflection to get actions tailored to your unique values.")
        
        if st.button(
            f"🧭 {get_text('take_assessment', language)}", 
            type="primary", 
            use_container_width=True
        ):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()
    
    with col_b:
        if language == 'czech':
            st.markdown("#### Najít rychlou pomoc")
            st.markdown("Podívejte se na seznam jednoduchých, konkrétních akcí, které můžete udělat hned teď.")
        else:
            st.markdown("#### Find Quick Help")
            st.markdown("See a list of simple, concrete actions you can take in the next few minutes.")

        if st.button(
            f"⚡ {get_text('get_quick_help', language)}", 
            use_container_width=True
        ):
            st.session_state.quick_action_requested = True
            st.rerun()

# The opportunities section was removed as it's better placed on the 'Explore Causes' page
# to avoid overwhelming the user on the very first page. 