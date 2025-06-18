"""Welcome page - the main landing experience"""

import streamlit as st
import random
from utils.localization import get_text
from logic.encouragement import get_random_encouragement, get_seasonal_message, get_emotional_response
from core.session import update_user_profile

def show_welcome_page():
    """Enhanced welcome page with fixed UX and cultural adaptation"""
    language = st.session_state.language
    
    # Main content container
    st.markdown('<div class="content-container">', unsafe_allow_html=True)
    
    st.markdown(f'<h1 class="main-header">{get_text("title", language)}</h1>', unsafe_allow_html=True)
    
    welcome_msg = get_random_encouragement("welcome_messages", language)
    st.markdown(f'<p class="sub-header">{welcome_msg}</p>', unsafe_allow_html=True)
    
    # Add a welcoming introduction
    if language == 'czech':
        intro_text = """
        🌟 **Vítejte v prostoru, kde se empatie mění v konkrétní činy.**
        
        Tento nástroj vám pomůže najít smysluplné způsoby, jak pomoci druhým – 
        ať už máte 5 minut nebo celý den, žijete v Praze nebo obklopeni přírodou.
        
        💡 **Jak to funguje:** Projdete si krátké posouzení, které najde akce přesně pro vaše možnosti a hodnoty.
        """
    else:
        intro_text = """
        🌟 **Welcome to a space where empathy transforms into concrete action.**
        
        This tool helps you find meaningful ways to help others – 
        whether you have 5 minutes or a whole day, live in Prague or the countryside.
        
        💡 **How it works:** Take a brief assessment that finds actions perfectly matched to your resources and values.
        """
    st.markdown(intro_text)
    
    # Quote comes AFTER intro, properly positioned
    seasonal_msg = get_seasonal_message(language)
    if seasonal_msg:
        st.markdown(f"""
        <div class="quote-box">
            <span style="font-size: 1.2em;">🌿</span> {seasonal_msg}
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Enhanced emotional assessment section
    _render_emotional_assessment(language)
    
    st.markdown("---")
    
    # Enhanced CTA section
    _render_cta_section(language)
    
    # Enhanced opportunity expandable section
    _render_opportunities_section(language)
    
    # Close content container
    st.markdown('</div>', unsafe_allow_html=True)

def _render_emotional_assessment(language):
    """Render the emotional assessment section"""
    
    if language == 'czech':
        st.markdown("### 💭 Jak se právě cítíš?")
        st.markdown("*Pomůže nám najít správný přístup pro vás*")
        emotional_options = [
            "😔 Zahlcen/a všemi problémy",
            "😤 Frustrován/a a chci jednat", 
            "😊 Nadějný/á a připraven/a pomoci",
            "😕 Provinile kvůli nedělání dost",
            "🔥 Motivován/a něco změnit",
            "😐 Nejistý/á, kde začít"
        ]
    else:
        st.markdown("### 💭 How are you feeling right now?")
        st.markdown("*This helps us better understand what would be most helpful for you right now.*")
        emotional_options = [
            "😔 I'm overwhelmed by the world's problems",
            "😤 I feel frustrated and want to do something",
            "😊 I feel hopeful and am ready to help",
            "😕 I feel like I should be doing more",
            "🔥 I'm motivated to make a change",
            "😐 I'm not sure where to start"
        ]
    
    # Enhanced emotional state selector
    emotional_state = st.radio(
        "Vyberte možnost:" if language == 'czech' else "Choose option:",
        emotional_options,
        key="emotional_state",
        label_visibility="collapsed"
    )
    
    # Enhanced contextual response
    if emotional_state:
        # Extract emotion key more safely and map to English keys used in JSON
        emotion_parts = emotional_state.split()
        if len(emotion_parts) > 1:
            emotion_key = emotion_parts[1].lower().rstrip('/a').rstrip('ý').rstrip('á')
            
            update_user_profile({'emotional_state': emotion_key})
            
            # Get appropriate response
            response = get_emotional_response(emotion_key, language)
            st.success(f"✨ {response}")

def _render_cta_section(language):
    """Render the call-to-action section"""
    
    st.markdown(f"""
    <div class="cta-section">
        <h3 style="margin-bottom: 1rem; color: #2E5D31;">
            {'🚀 Jak chcete začít?' if language == 'czech' else '🚀 How would you like to start?'}
        </h3>
        <p style="color: #5A6B5A; margin-bottom: 1.5rem;">
            {'Vyberte si cestu, která vám vyhovuje:' if language == 'czech' else 'Choose the path that suits you:'}
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # Better CTA layout with proper spacing - responsive
    col_a, col_b = st.columns(2)
    with col_a:
        if st.button(
            f"🧭 {get_text('take_assessment', language)}", 
            type="primary", 
            use_container_width=True,
            help="Získejte personalizovaná doporučení na míru" if language == 'czech' else "Get personalized recommendations tailored to you"
        ):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()
    
    with col_b:
        if st.button(
            f"⚡ {get_text('get_quick_help', language)}", 
            use_container_width=True,
            help="Najděte rychlé akce, které můžete udělat hned teď" if language == 'czech' else "Find quick actions you can do right now"
        ):
            # Navigate to quick actions page
            st.session_state.quick_action_requested = True
            st.rerun()

def _render_opportunities_section(language):
    """Render the local opportunities section"""
    
    with st.expander(
        "🌍 Zobrazit příležitosti v mém okolí" if language == 'czech' else "🌍 Show opportunities near me",
        expanded=False
    ):
        if language == 'czech':
            st.markdown("""
            **🏠 Praha**
            - **Organizace pro zvířata**: [Voříškoviště](https://voriskoviste.cz) - dobrovolnictví s opuštěnými psy
            - **Pomoc bezdomovcům**: [Naděje](https://www.nadeje.cz) - rozdávání jídla, sociální práce
            - **Podpora vzdělání**: [Učíme online](https://www.ucimeonline.cz) - doučování dětí online
            
            **🏢 Brno**
            - **Senioři**: [Život 90](https://zivot90.cz) - návštěvy, doprovázení k lékaři
            - **Ekologie**: [Lipka](https://lipka.cz) - úklidy parků, výsadba rostlin
            - **Děti v nouzi**: [SOS dětské vesničky](https://www.sos-vesničky.cz)
            
            **🌐 Online z domova**
            - **Krizová pomoc**: [Linka důvěry](https://www.ceska-sprava.cz) - školení dobrovolníků
            - **Překládání**: [Translators without Borders](https://translatorswithoutborders.org)
            - **Vzdělání**: [Khan Academy česky](https://cs.khanacademy.org) - tvorba obsahu
            
            *📝 Poznámka: Toto jsou skutečné a ověřené organizace. Doporučujeme si u nich vždy ověřit nejnovější možnosti zapojení.*
            """)
        else:
            st.markdown("""
            **🏠 Prague**
            - **Animal welfare**: [Voříškoviště](https://voriskoviste.cz) - volunteering with abandoned dogs
            - **Homeless support**: [Naděje](https://www.nadeje.cz) - food distribution, social work
            - **Education support**: [Učíme online](https://www.ucimeonline.cz) - online tutoring for children
            
            **🏢 Brno**
            - **Senior care**: [Život 90](https://zivot90.cz) - visits, medical accompaniment
            - **Environmental**: [Lipka](https://lipka.cz) - park cleanups, tree planting
            - **Children in need**: [SOS Children's Villages](https://www.sos-vesničky.cz)
            
            **🌐 Online from home**
            - **Crisis support**: [Helpline](https://www.ceska-sprava.cz) - volunteer training
            - **Translation**: [Translators without Borders](https://translatorswithoutborders.org)
            - **Education**: [Khan Academy Czech](https://cs.khanacademy.org) - content creation
            
            *📝 Note: These are real, verified organizations. We recommend always checking with them for the latest opportunities to get involved.*
            """) 