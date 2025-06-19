"""Enhanced welcome page with comprehensive user support and personalization"""

import streamlit as st
import random
from datetime import datetime, timedelta
from utils.localization import get_text, get_czech_proverb, get_accessibility_text
from logic.encouragement import get_random_encouragement, get_seasonal_message, get_emotional_response
from core.session import (update_user_profile, track_emotional_state, check_inactivity, 
                         is_returning_user, get_user_behavior_insights, record_mood_check_in,
                         track_page_visit)
from components.emergency_help import check_distress_indicators, render_breathing_exercise, show_self_care_suggestions

def show_welcome_page():
    """Enhanced welcome page with comprehensive personalization and support"""
    language = st.session_state.language
    track_page_visit('welcome')
    
    # Check for returning user and inactivity
    inactivity_status = check_inactivity()
    returning_user = is_returning_user()
    behavior_insights = get_user_behavior_insights()
    
    st.markdown('<div class="content-container">', unsafe_allow_html=True)
    
    # Enhanced header with personalization
    _render_personalized_header(language, returning_user, inactivity_status)
    
    # Show appropriate welcome content based on user state
    if returning_user and inactivity_status:
        _show_returning_user_content(language, inactivity_status)
    else:
        _show_first_time_content(language)
    
    # Enhanced emotional assessment with better UX
    col_left, col_right = st.columns([2, 2])
    with col_left:
        _render_enhanced_emotional_assessment(language, behavior_insights)
    with col_right:
        _render_enhanced_cta_section(language, behavior_insights)
    
    # Show additional support if distress detected
    if behavior_insights.get('shows_distress'):
        _show_distress_support(language)
    
    # Contextual help and inspiration
    _show_contextual_inspiration(language, returning_user)
    
    st.markdown('</div>', unsafe_allow_html=True)

def _render_personalized_header(language, returning_user, inactivity_status):
    """Render personalized header based on user state"""
    
    # Main title and subtitle
    st.markdown(f'<h1 class="main-header">{get_text("title", language)}</h1>', unsafe_allow_html=True)
    st.markdown(f'<p class="sub-header">{get_text("subtitle", language)}</p>', unsafe_allow_html=True)
    
    # Personalized greeting
    if returning_user:
        if st.session_state.user_name:
            greeting = get_text('welcome_back_named', language).format(name=st.session_state.user_name)
        else:
            greeting = get_text('welcome_back_generic', language)
        st.success(f"👋 {greeting}")
        
        # Show progress summary for returning users
        if st.session_state.total_impact['actions'] > 0:
            actions_count = st.session_state.total_impact['actions']
            if language == 'czech':
                progress_msg = f"Už jste dokončili {actions_count} akcí. Skvělá práce!"
            else:
                progress_msg = f"You've completed {actions_count} actions already. Great work!"
            st.info(f"📊 {progress_msg}")
    
    # Inactivity nudges
    if inactivity_status == 'long_inactive':
        st.warning(f"💚 {get_text('long_inactive_nudge', language)}")
    elif inactivity_status == 'inactive':
        st.info(f"🌱 {get_text('inactive_nudge', language)}")

def _show_returning_user_content(language, inactivity_status):
    """Show content tailored for returning users"""
    
    if language == 'czech':
        if inactivity_status == 'long_inactive':
            st.markdown("""
            ### Vítejte zpět! 
            
            Je skvělé, že jste se vrátili. Někdy potřebujeme pauzu, a to je v pořádku. 
            Jste připraveni na další malý krok?
            """)
        else:
            st.markdown("""
            ### Pokračujeme ve vaší cestě
            
            Vaše předchozí kroky byly významné. Každá akce má dopad, který se často 
            projevuje způsoby, o kterých možná ani nevíte.
            """)
    else:
        if inactivity_status == 'long_inactive':
            st.markdown("""
            ### Welcome back!
            
            It's great that you've returned. Sometimes we need a break, and that's okay.
            Ready for another small step?
            """)
        else:
            st.markdown("""
            ### Continuing your journey
            
            Your previous steps were meaningful. Every action has impact that often 
            manifests in ways you might never know about.
            """)

def _show_first_time_content(language):
    """Show content for first-time users"""
    
    if language == 'czech':
        st.info("""
        **Vítejte!** Tento nástroj vás jemně provede od pocitu bezmoci k malým, ale skutečným krokům pomoci. 
        Vše je anonymní, bezpečné a můžete začít kdykoliv – i malý krok má smysl.
        
        **Co můžete čekat:**
        - 🧭 Osobní reflexi vašich hodnot (5 minut)
        - ⚡ Okamžité akce, které můžete udělat hned
        - 📊 Sledování vašeho pozitivního dopadu
        - 💚 Podporu na každém kroku cesty
        """)
    else:
        st.info("""
        **Welcome!** This tool will gently guide you from feeling overwhelmed to small, real steps of help. 
        Everything is anonymous, safe, and you can start anytime—even a small step matters.
        
        **What to expect:**
        - 🧭 Personal reflection on your values (5 minutes)
        - ⚡ Immediate actions you can take right now
        - 📊 Tracking of your positive impact
        - 💚 Support at every step of the journey
        """)

def _render_enhanced_emotional_assessment(language, behavior_insights):
    """Enhanced emotional assessment with better UX and support"""
    
    st.markdown(f"#### {get_text('mood_tracker', language)}")
    st.caption("Proč se ptáme? Vaše nálada nám pomůže doporučit akce, které budou odpovídat vaší energii a potřebám." if language == 'czech' else "Why do we ask? Your mood helps us recommend actions that fit your energy and needs.")
    
    # Simplified emotional options with better descriptions
    if language == 'czech':
        emotional_options = [
            ("zahlcen", "😔 Cítím se zahlcen/a situací ve světě"),
            ("frustrovan", "😤 Jsem frustrován/a, že se nic nemění"),
            ("nadejny", "😊 Mám naději a chci pomoci"),
            ("provinile", "😕 Cítím vinu, že nedělám dost"),
            ("motivovan", "🔥 Jsem motivován/a k akci"),
            ("nejisty", "😐 Nejsem si jistý/á, kde začít")
        ]
        help_text = "Vyberte pocit, který je vám dnes nejblíž. Neexistují špatné odpovědi."
    else:
        emotional_options = [
            ("overwhelmed", "😔 I feel overwhelmed by world situations"),
            ("frustrated", "😤 I'm frustrated that nothing seems to change"),
            ("hopeful", "😊 I have hope and want to help"),
            ("guilty", "😕 I feel guilty for not doing enough"),
            ("motivated", "🔥 I'm motivated to take action"),
            ("uncertain", "😐 I'm unsure where to start")
        ]
        help_text = "Choose the feeling closest to you today. There are no wrong answers."
    
    # Enhanced emotional state selection
    emotional_state = st.radio(
        "Jak se dnes cítíte?" if language == 'czech' else "How are you feeling today?",
        [opt[1] for opt in emotional_options],
        key="emotional_state_enhanced",
        help=help_text,
        label_visibility="visible"
    )
    
    if emotional_state:
        # Extract emotion key
        emotion_key = next((key for key, label in emotional_options if label == emotional_state), "nejisty")
        
        # Update profile and track emotional state
        update_user_profile({'emotional_state': emotion_key})
        track_emotional_state(emotion_key, "welcome_page")
        record_mood_check_in(emotion_key, "welcome_assessment")
        
        # Get and show emotional response
        response = get_emotional_response(emotion_key, language)
        st.success(f"💬 {response}")
        
        # Check for distress and offer additional support
        if check_distress_indicators(emotion_key, language):
            # Additional support was already shown by the function
            pass
        
        # Offer breathing exercise for stress/overwhelm
        if emotion_key in ['zahlcen', 'overwhelmed', 'frustrovan', 'frustrated']:
            with st.expander("🫁 Rychlé uklidnění" if language == 'czech' else "🫁 Quick calming", expanded=False):
                render_breathing_exercise(language)
    
    # Fallback encouragement if no emotion selected
    else:
        fallback_msg = get_text('emotional_fallback', language)
        st.info(f"💭 {fallback_msg}")

def _render_enhanced_cta_section(language, behavior_insights):
    """Enhanced CTA section with personalized recommendations"""
    
    st.markdown("<div class='cta-section'>", unsafe_allow_html=True)
    
    # Personalized recommendations based on behavior
    if behavior_insights.get('is_action_oriented'):
        _show_action_oriented_ctas(language)
    elif behavior_insights.get('is_explorer'):
        _show_explorer_ctas(language)
    elif behavior_insights.get('needs_guidance'):
        _show_guidance_ctas(language)
    else:
        _show_default_ctas(language)
    
    st.markdown("</div>", unsafe_allow_html=True)
    
    # Additional options
    _show_additional_options(language, behavior_insights)

def _show_action_oriented_ctas(language):
    """CTAs for action-oriented users"""
    if language == 'czech':
        st.markdown("##### 🚀 Vypadá to, že jste připraveni jednat!")
        st.markdown("Máte energii pro okamžitou akci. Pojďme najít něco konkrétního.")
    else:
        st.markdown("##### 🚀 Looks like you're ready to act!")
        st.markdown("You have energy for immediate action. Let's find something concrete.")
    
    col_a, col_b = st.columns(2)
    with col_a:
        if st.button(f"⚡ {get_text('get_quick_help', language)}", type="primary", use_container_width=True):
            st.session_state.quick_action_requested = True
            st.rerun()
    with col_b:
        if st.button(f"🎯 Najít přesně to pravé" if language == 'czech' else "🎯 Find exactly the right thing", use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()

def _show_explorer_ctas(language):
    """CTAs for users who like to explore"""
    if language == 'czech':
        st.markdown("##### 🗺️ Rádi prozkoumáváte možnosti")
        st.markdown("Pojďme se podívat na různé oblasti pomoci a najít to, co vás osloví.")
    else:
        st.markdown("##### 🗺️ You like to explore options")
        st.markdown("Let's look at different areas of help and find what speaks to you.")
    
    col_a, col_b = st.columns(2)
    with col_a:
        if st.button(f"🌍 {get_text('explore_causes', language)}", type="primary", use_container_width=True):
            st.session_state.current_page = 'causes'
            st.rerun()
    with col_b:
        if st.button(f"🧭 {get_text('take_assessment', language)}", use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()

def _show_guidance_ctas(language):
    """CTAs for users who need more guidance"""
    if language == 'czech':
        st.markdown("##### 🤝 Pojďme to projít společně")
        st.markdown("Není problém nevědět, kde začít. Krok za krokem najdeme to pravé.")
    else:
        st.markdown("##### 🤝 Let's go through this together")
        st.markdown("It's okay not to know where to start. Step by step, we'll find the right thing.")
    
    col_a, col_b = st.columns(2)
    with col_a:
        if st.button(f"🧭 {get_text('take_assessment', language)}", type="primary", use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()
    with col_b:
        if st.button("📖 Jak to funguje" if language == 'czech' else "📖 How it works", use_container_width=True):
            _show_how_it_works_modal(language)

def _show_default_ctas(language):
    """Default CTAs for new users"""
    if language == 'czech':
        st.markdown("##### Dva způsoby, jak začít")
        st.markdown("Vyberte si cestu, která vám vyhovuje.")
    else:
        st.markdown("##### Two ways to begin")
        st.markdown("Choose the path that suits you.")
    
    col_a, col_b = st.columns(2)
    with col_a:
        st.markdown("**Prozkoumat vaši cestu**" if language == 'czech' else "**Explore Your Path**")
        st.markdown("5 minut reflexe pro doporučení na míru." if language == 'czech' else "5 minutes of reflection for tailored recommendations.")
        if st.button(f"🧭 {get_text('take_assessment', language)}", type="primary", use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()
    with col_b:
        st.markdown("**Rychlá pomoc**" if language == 'czech' else "**Quick Help**")
        st.markdown("Jednoduché akce, které můžete udělat hned." if language == 'czech' else "Simple actions you can do right now.")
        if st.button(f"⚡ {get_text('get_quick_help', language)}", use_container_width=True):
            st.session_state.quick_action_requested = True
            st.rerun()

def _show_additional_options(language, behavior_insights):
    """Show additional options and inspiration"""
    
    # Name collection for personalization (optional)
    if not st.session_state.user_name and not behavior_insights.get('form_abandonments'):
        with st.expander("💭 Osobní přístup" if language == 'czech' else "💭 Personal touch", expanded=False):
            name_input = st.text_input(
                "Jak vám můžeme říkat? (nepovinné)" if language == 'czech' else "What can we call you? (optional)",
                placeholder="Vaše jméno nebo přezdívka..." if language == 'czech' else "Your name or nickname...",
                key="user_name_input"
            )
            if st.button("Uložit" if language == 'czech' else "Save") and name_input.strip():
                st.session_state.user_name = name_input.strip()
                st.success("Děkujeme!" if language == 'czech' else "Thank you!")
                st.rerun()
    
    # Real stories button
    if st.button("📖 Přečíst skutečné příběhy" if language == 'czech' else "📖 See real stories", use_container_width=True):
        _show_success_stories_modal(language)

def _show_contextual_inspiration(language, returning_user):
    """Show contextual inspiration and encouragement"""
    
    # Only one encouragement/quote at a time
    if returning_user:
        encouragement = get_random_encouragement("progress_encouragement", language)
    else:
        encouragement = get_random_encouragement("welcome_messages", language)
    
    if encouragement:
        st.info(f"💚 {encouragement}")
    
    # Czech proverb occasionally
    if language == 'czech' and random.random() < 0.3:
        proverb = get_czech_proverb('start')
        st.markdown(f"<div class='quote-box'>🌿 {proverb}</div>", unsafe_allow_html=True)
    
    # Seasonal message
    seasonal_msg = get_seasonal_message(language)
    if seasonal_msg and random.random() < 0.2:
        st.markdown(f'<div style="font-style: italic; padding: 8px; background-color: #f0fff0; border-radius: 5px; margin: 10px 0;"><small>🌿 {seasonal_msg}</small></div>', unsafe_allow_html=True)

def _show_distress_support(language):
    """Show additional support for users showing distress indicators"""
    
    st.markdown("---")
    
    if language == 'czech':
        st.warning("💚 **Vidíme, že to může být náročné.** Jste silnější, než si myslíte.")
    else:
        st.warning("💚 **We see this might be challenging.** You're stronger than you think.")
    
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🫁 Rychlé uklidnění" if language == 'czech' else "🫁 Quick calming"):
            with st.expander("Dýchací cvičení" if language == 'czech' else "Breathing exercise", expanded=True):
                render_breathing_exercise(language)
    
    with col2:
        if st.button("💚 Péče o sebe" if language == 'czech' else "💚 Self-care"):
            with st.expander("Okamžitá péče" if language == 'czech' else "Immediate care", expanded=True):
                show_self_care_suggestions(language)

def _show_how_it_works_modal(language):
    """Show how the app works"""
    
    with st.expander(f"📖 {get_text('how_it_works', language)}", expanded=True):
        if language == 'czech':
            st.markdown("""
            ### Jak Akcelerátor altruismu funguje
            
            **1. 🧭 Reflexe (5 minut)**
            - Sdělte nám své hodnoty a možnosti
            - Žádné špatné odpovědi, jen vaše pravda
            - Můžete se vrátit a změnit odpovědi kdykoliv
            
            **2. 🎯 Doporučení**
            - Najdeme akce, které sednou vašim hodnotám
            - Respektujeme váš čas a finanční možnosti
            - Všechno je dobrovolné a flexibilní
            
            **3. ⚡ Akce**
            - Vyberte si akci, která vás osloví
            - Odkazy na skutečné organizace
            - Můžete začít malým krokem
            
            **4. 📊 Dopad**
            - Sledujte svůj pozitivní vliv
            - Oslavte své úspěchy
            - Inspirujte ostatní
            
            **Pamatujte:** Jde o vaši cestu. Můžete kdykoliv přestat, začít znovu, nebo změnit směr.
            """)
        else:
            st.markdown("""
            ### How the Altruism Accelerator works
            
            **1. 🧭 Reflection (5 minutes)**
            - Share your values and resources
            - No wrong answers, just your truth
            - You can return and change answers anytime
            
            **2. 🎯 Recommendations**
            - We find actions that match your values
            - We respect your time and financial capacity
            - Everything is voluntary and flexible
            
            **3. ⚡ Action**
            - Choose an action that appeals to you
            - Links to real organizations
            - You can start with a small step
            
            **4. 📊 Impact**
            - Track your positive influence
            - Celebrate your successes
            - Inspire others
            
            **Remember:** This is your journey. You can stop, restart, or change direction anytime.
            """)

def _show_success_stories_modal(language):
    """Show real success stories"""
    
    with st.expander("📖 Skutečné příběhy" if language == 'czech' else "📖 Real stories", expanded=True):
        if language == 'czech':
            stories = [
                {
                    "name": "Petra K.",
                    "story": "Začala s dary 200 Kč pro stromy, teď koordinuje celý program udržitelnosti své firmy",
                    "impact": "Vedla k 500+ klimatickým akcím zaměstnanců",
                    "timeframe": "6 měsíců"
                },
                {
                    "name": "Tomáš H.",
                    "story": "Začal doučováním jednoho dítěte online, inspirovalo ho to stát se učitelem na plný úvazek",
                    "impact": "Teď ovlivňuje 30 studentů denně",
                    "timeframe": "1 rok"
                },
                {
                    "name": "Marie N.",
                    "story": "Zorganizovala jeden sousedský večírek, vybudovala trvalé komunitní spojení",
                    "impact": "Měsíční setkání teď zahrnuje 50+ domácností",
                    "timeframe": "8 měsíců"
                }
            ]
        else:
            stories = [
                {
                    "name": "Sarah M.",
                    "story": "Started with $5 tree donations, now coordinates her company's entire sustainability program",
                    "impact": "Led to 500+ employee climate actions",
                    "timeframe": "6 months"
                },
                {
                    "name": "Marcus T.",
                    "story": "Began tutoring one child online, inspired to become a full-time teacher",
                    "impact": "Now impacts 30 students daily",
                    "timeframe": "1 year"
                },
                {
                    "name": "Elena R.",
                    "story": "Organized one neighborhood potluck, built lasting community connections",
                    "impact": "Monthly gatherings now include 50+ households",
                    "timeframe": "8 months"
                }
            ]
        
        for story in stories:
            st.markdown(f"""
            <div class='success-story'>
            <strong>{story['name']}:</strong> {story['story']}<br>
            <em>💫 {story['impact']} ({story['timeframe']})</em>
            </div>
            """, unsafe_allow_html=True) 