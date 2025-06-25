"""Beautiful welcome page - your gentle guide from overwhelm to meaningful action"""

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
    """Beautiful welcome experience - like a gentle Czech mentor guiding users from helplessness to hope"""
    language = st.session_state.language
    track_page_visit('welcome')
    
    # Always show where user is and what comes next
    _show_navigation_guidance(language)
    
    # Create beautiful, inspiring container
    st.markdown("""
    <div class="welcome-container" style="
        background: linear-gradient(135deg, #e8f5e8 0%, #d4e7d4 100%);
        border-radius: 20px;
        padding: 2rem;
        margin: 1rem 0;
        border: 1px solid #c8e6c9;
        box-shadow: 0 4px 20px rgba(46, 93, 49, 0.1);
    ">
    """, unsafe_allow_html=True)
    
    # Beautiful header with authentic greeting
    _render_beautiful_header(language)
    
    # Emotional safety and grounding
    _show_emotional_safety_section(language)
    
    # Feature overview with clear next steps
    _show_beautiful_feature_overview(language)
    
    # Emotional check-in with authentic responses
    _show_beautiful_emotional_checkin(language)
    
    # Success stories modal for inspiration
    _show_success_stories_modal(language)
    
    st.markdown("</div>", unsafe_allow_html=True)

def _show_navigation_guidance(language):
    """Always show users where they are and what comes next"""
    
    if language == 'czech':
        current_section = "Úvodní stránka"
        next_step = "Výběr vaší cesty nebo rychlé pomoci"
    else:
        current_section = "Welcome page"
        next_step = "Choose your path or quick help"
    
    st.markdown(f"""
    <div style="
        background: #f8f9fa;
        padding: 0.8rem 1.2rem;
        border-radius: 10px;
        margin-bottom: 1rem;
        border-left: 4px solid #7AB87A;
        font-size: 0.9rem;
    ">
        <strong>📍 {get_text('where_you_are', language).format(current_section=current_section)}</strong><br>
        <span style="color: #6c757d;">👉 {get_text('what_comes_next', language).format(next_step=next_step)}</span>
    </div>
    """, unsafe_allow_html=True)

def _show_emotional_safety_section(language):
    """Create emotional safety and validate feelings"""
    
    if language == 'czech':
        st.markdown("""
        ### 🌱 Vítejte v bezpečném prostoru
        
        Je krásné, že jste tady. Ať už přicházíte s jakýmikoliv pocity – nejistotou, 
        frustrací, nadšením nebo jen zvědavostí – všechny jsou zde vítané a platné.
        
        **Tady není třeba mít všechno vyřešené. Tady můžeme začít tam, kde právě jste.**
        """)
    else:
        st.markdown("""
        ### 🌱 Welcome to a safe space
        
        It's beautiful that you're here. Whatever feelings you bring – uncertainty, 
        frustration, enthusiasm, or just curiosity – all are welcome and valid here.
        
        **You don't need to have everything figured out here. We can start exactly where you are.**
        """)
    
    # Add gentle fallback for overwhelmed users
    with st.expander("😔 " + ("Cítíte se zahlceni?" if language == 'czech' else "Feeling overwhelmed?"), expanded=False):
        if language == 'czech':
            st.markdown("""
            **To je úplně v pořádku.** Mnoho lidí se tak cítí, když přemýšlí o pomoci ostatním 
            a stavu světa. Jste silnější, než si myslíte.
            
            **Zkuste tohle:**
            - Zhluboka se nadechněte třikrát
            - Připomeňte si, že i malé kroky mají význam
            - Nemusíte zachránit celý svět – stačí začít malým gestem
            
            Když budete připraveni, jsme tu pro vás.
            """)
        else:
            st.markdown("""
            **That's completely okay.** Many people feel this way when thinking about helping others 
            and the state of the world. You're stronger than you think.
            
            **Try this:**
            - Take three deep breaths
            - Remember that even small steps matter
            - You don't have to save the whole world – just start with a small gesture
            
            When you're ready, we're here for you.
            """)
        
        if st.button("🌸 " + ("Zkusit dechové cvičení" if language == 'czech' else "Try breathing exercise")):
            render_breathing_exercise(language)

def _show_beautiful_feature_overview(language):
    """Beautiful feature overview with clear value propositions"""
    
    if language == 'czech':
        st.markdown("### ✨ Co vás zde čeká")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            <div style="
                background: #f0fff0;
                padding: 1.5rem;
                border-radius: 12px;
                margin: 1rem 0;
                border: 1px solid #d4e7d4;
            ">
                <h4 style="color: #2E5D31; margin-bottom: 1rem;">🧭 Najít vaši cestu</h4>
                <p style="color: #5A6B5A; margin-bottom: 1rem;">
                    Krátká reflexe vašich hodnot a možností. Pomůžeme vám najít akce, 
                    které vám budou sedět a které zvládnete.
                </p>
                <p style="color: #7A7A7A; font-size: 0.9rem; font-style: italic;">
                    ⏱️ 3-5 minut • 💚 Zcela dobrovolné
                </p>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown("""
            <div style="
                background: #fff3e0;
                padding: 1.5rem;
                border-radius: 12px;
                margin: 1rem 0;
                border: 1px solid #ffe0b2;
            ">
                <h4 style="color: #e65100; margin-bottom: 1rem;">⚡ Rychlá pomoc</h4>
                <p style="color: #8A6A5A; margin-bottom: 1rem;">
                    Akce, které můžete udělat hned teď, bez dlouhého přemýšlení. 
                    Jednoduché kroky s okamžitým začátkem.
                </p>
                <p style="color: #7A7A7A; font-size: 0.9rem; font-style: italic;">
                    ⏱️ 1-2 minuty • 🚀 Okamžitý start
                </p>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.markdown("### ✨ What awaits you here")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            <div style="
                background: #f0fff0;
                padding: 1.5rem;
                border-radius: 12px;
                margin: 1rem 0;
                border: 1px solid #d4e7d4;
            ">
                <h4 style="color: #2E5D31; margin-bottom: 1rem;">🧭 Find your path</h4>
                <p style="color: #5A6B5A; margin-bottom: 1rem;">
                    Brief reflection on your values and possibilities. We'll help you find actions 
                    that fit you and that you can handle.
                </p>
                <p style="color: #7A7A7A; font-size: 0.9rem; font-style: italic;">
                    ⏱️ 3-5 minutes • 💚 Completely voluntary
                </p>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown("""
            <div style="
                background: #fff3e0;
                padding: 1.5rem;
                border-radius: 12px;
                margin: 1rem 0;
                border: 1px solid #ffe0b2;
            ">
                <h4 style="color: #e65100; margin-bottom: 1rem;">⚡ Quick help</h4>
                <p style="color: #8A6A5A; margin-bottom: 1rem;">
                    Actions you can do right now, without long thinking. 
                    Simple steps with immediate start.
                </p>
                <p style="color: #7A7A7A; font-size: 0.9rem; font-style: italic;">
                    ⏱️ 1-2 minutes • 🚀 Instant start
                </p>
            </div>
            """, unsafe_allow_html=True)
    
    # Clear call-to-action buttons
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("🧭 " + get_text('take_assessment', language), use_container_width=True, type="primary"):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()
    
    with col2:
        if st.button("⚡ " + get_text('get_quick_help', language), use_container_width=True):
            st.session_state.current_page = 'quick_actions'
            st.rerun()

def _show_beautiful_emotional_checkin(language):
    """Beautiful emotional check-in with authentic responses"""
    
    if language == 'czech':
        st.markdown("### 💙 Jak se právě teď cítíte?")
        st.markdown("*Vaše pocity nám pomohou najít to pravé pro vás*")
        
        emotional_options = [
            ("nejisty", "Nejistý/á – nevím, co dělat"),
            ("zahlcen", "Zahlcený/á – je toho na mě moc"),
            ("motivovan", "Motivovaný/á – chci něco změnit"),
            ("skepticky", "Skeptický/á – pochybuji o smyslu"),
            ("nadsen", "Nadšený/á – mám energii pomáhat"),
            ("unaveny", "Unavený/á – ale chci zkusit něco malého"),
            ("zvědavý", "Zvědavý/á – chci se dozvědět víc")
        ]
        
        placeholder = "Vyberte, co nejlépe popisuje vaše pocity..."
    else:
        st.markdown("### 💙 How are you feeling right now?")
        st.markdown("*Your feelings help us find what's right for you*")
        
        emotional_options = [
            ("uncertain", "Uncertain – I don't know what to do"),
            ("overwhelmed", "Overwhelmed – it's too much for me"),
            ("motivated", "Motivated – I want to change something"),
            ("skeptical", "Skeptical – I doubt the meaning"),
            ("enthusiastic", "Enthusiastic – I have energy to help"),
            ("tired", "Tired – but want to try something small"),
            ("curious", "Curious – I want to learn more")
        ]
        
        placeholder = "Select what best describes your feelings..."
    
    # Beautiful emotion selector
    emotional_state = st.selectbox(
        label="emotional_state_hidden",
        options=[""] + [opt[1] for opt in emotional_options],
        index=0,
        placeholder=placeholder,
        label_visibility="collapsed",
        key="beautiful_emotion_select"
    )
    
    if emotional_state:
        # Extract emotion key
        emotion_key = next((key for key, label in emotional_options if label == emotional_state), "nejisty")
        
        # Update profile and track emotional state
        update_user_profile({'emotional_state': emotion_key})
        track_emotional_state(emotion_key, "welcome_page")
        record_mood_check_in(emotion_key, "welcome_assessment")
        
        # Show beautiful, compassionate response
        response = get_emotional_response(emotion_key, language)
        
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #e8f5e8 0%, #d4e7d4 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin: 1rem 0;
            border-left: 4px solid #7AB87A;
        ">
            <div style="color: #2E5D31; line-height: 1.5;">
                💚 {response}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Offer gentle support for difficult emotions
        if emotion_key in ['zahlcen', 'overwhelmed', 'unaveny', 'tired', 'skepticky', 'skeptical']:
            _show_gentle_support(language, emotion_key)

def _show_gentle_support(language, emotion_key):
    """Show gentle support for difficult emotions"""
    
    with st.expander("🤗 " + ("Chcete si promluvit?" if language == 'czech' else "Want to talk?"), expanded=False):
        if language == 'czech':
            if emotion_key in ['zahlcen', 'overwhelmed']:
                st.markdown("""
                **Cítíte se zahlceni? To je naprosto lidské.**
                
                Svět má skutečně mnoho problémů a může se zdát, že jeden člověk nemůže nic změnit. 
                Ale pravda je, že i nejmenší kroky mají svůj smysl.
                
                **Zkuste začít tímto:**
                - Zvolte si jen jednu věc, která vás trápí
                - Najděte jednu malou akci, kterou můžete udělat dnes
                - Pamatujte si: nejste sami, kdo se snaží pomoci
                
                *"Malé ryby také ryba" – i malá pomoc má veliký význam.*
                """)
            elif emotion_key in ['unaveny', 'tired']:
                st.markdown("""
                **Únava je signál, že se staráte.**
                
                Možná už dlouho přemýšlíte o tom, jak pomoci, nebo jste už něco zkoušeli. 
                Únava neznamená, že byste měli přestat – jen že potřebujete najít způsob, 
                který vám bude sedět.
                
                **Možná by vám pomohlo:**
                - Začít s něčím velmi malým (5 minut)
                - Najít něco, co vás baví nebo zajímá
                - Připojit se k někomu, kdo už pomáhá
                
                *Pomoc nemusí být utrpení. Může být radostí.*
                """)
            elif emotion_key in ['skepticky', 'skeptical']:
                st.markdown("""
                **Váš skepticismus je cenný.**
                
                Je dobře, že se ptáte, jestli má pomoc smysl. Ukazuje to, že myslíte kriticky 
                a nechcete jen plýtvat časem na věci, které nefungují.
                
                **Co když zkusíme tohle:**
                - Podívat se na konkrétní příklady, kde pomoc funguje
                - Začít s něčím malým a sledovat výsledky
                - Najít způsob pomoci, který dává smysl právě vám
                
                *Zdravý skepticismus může vést k nejlepší pomoci.*
                """)
        else:
            if emotion_key in ['overwhelmed']:
                st.markdown("""
                **Feeling overwhelmed? That's completely human.**
                
                The world truly has many problems and it might seem like one person can't change anything. 
                But the truth is that even the smallest steps have their meaning.
                
                **Try starting with this:**
                - Choose just one thing that troubles you
                - Find one small action you can do today
                - Remember: you're not alone in trying to help
                
                *"Small fish is also fish" – even small help has great meaning.*
                """)
            elif emotion_key in ['tired']:
                st.markdown("""
                **Tiredness is a signal that you care.**
                
                Maybe you've been thinking about how to help for a long time, or you've already tried something. 
                Tiredness doesn't mean you should stop – just that you need to find a way that fits you.
                
                **Maybe this would help:**
                - Start with something very small (5 minutes)
                - Find something you enjoy or find interesting
                - Join someone who's already helping
                
                *Help doesn't have to be suffering. It can be joy.*
                """)
            elif emotion_key in ['skeptical']:
                st.markdown("""
                **Your skepticism is valuable.**
                
                It's good that you question whether help makes sense. It shows you think critically 
                and don't want to just waste time on things that don't work.
                
                **What if we try this:**
                - Look at concrete examples where help works
                - Start with something small and watch the results
                - Find a way to help that makes sense to you specifically
                
                *Healthy skepticism can lead to the best help.*
                """)

def _show_success_stories_modal(language):
    """Show inspiring success stories modal"""
    
    with st.expander("🌟 " + ("Příběhy inspirace" if language == 'czech' else "Stories of inspiration"), expanded=False):
        if language == 'czech':
            st.markdown("""
            ### Skutečné příběhy lidí, kteří začali malými kroky
            
            **Marie, 34, učitelka z Brna:**
            *"Začala jsem tím, že jsem jednou týdně volala své starší sousedce. 
            Po půl roce jsem zjistila, že pomáhám koordinovat pomoc pro celý dům seniorů. 
            Někdy stačí začít tam, kde jste."*
            
            **Tomáš, 28, programátor z Prahy:**
            *"Myslel jsem si, že musím darovat tisíce korun, abych něco změnil. 
            Pak jsem začal darovat 50 Kč měsíčně a zjistil jsem, že i to má smysl. 
            Teď už daruju víc, ale ten první krok byl nejdůležitější."*
            
            **Anna, 45, maminka ze Zlína:**
            *"Cítila jsem se zahlcená všemi problémy světa. Začala jsem tím, 
            že jsem jednou měsíčně pomáhala v místním útulku. Zjistila jsem, 
            že pomoc mi dává energii, místo aby mi ji brala."*
            
            ---
            
            💡 **Co mají společné:** Všichni začali malými kroky, které jim dávaly smysl. 
            Nikdo nezachránil svět najednou, ale všichni něco změnili.
            """)
        else:
            st.markdown("""
            ### Real stories of people who started with small steps
            
            **Marie, 34, teacher from Brno:**
            *"I started by calling my elderly neighbor once a week. 
            After half a year, I found myself helping coordinate help for the entire senior building. 
            Sometimes it's enough to start where you are."*
            
            **Tomáš, 28, programmer from Prague:**
            *"I thought I had to donate thousands to change anything. 
            Then I started donating 50 CZK monthly and found out even that matters. 
            Now I donate more, but that first step was the most important."*
            
            **Anna, 45, mother from Zlín:**
            *"I felt overwhelmed by all the world's problems. I started by 
            helping at the local shelter once a month. I found out that 
            helping gives me energy instead of taking it away."*
            
            ---
            
            💡 **What they have in common:** Everyone started with small steps that made sense to them. 
            No one saved the world at once, but everyone changed something.
            """)

def _render_beautiful_header(language):
    """Beautiful header that immediately creates emotional safety"""
    
    # Gentle, welcoming title
    if language == 'czech':
        title = "🌱 Vítejte v bezpečném prostoru"
        subtitle = "Zde proměníme pocit bezmoci v konkrétní kroky pomoci"
    else:
        title = "🌱 Welcome to your safe space"
        subtitle = "Here we transform feelings of helplessness into concrete steps of help"
    
    st.markdown(f"""
    <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="
            font-size: 2.5rem;
            color: #2E5D31;
            margin-bottom: 0.5rem;
            font-weight: 600;
            line-height: 1.2;
        ">{title}</h1>
        <p style="
            font-size: 1.2rem;
            color: #5A6B5A;
            font-style: italic;
            margin-bottom: 1.5rem;
            line-height: 1.4;
        ">{subtitle}</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Warm, personalized greeting
    if st.session_state.user_name:
        if language == 'czech':
            greeting = f"Vítejte zpět, {st.session_state.user_name}! 💚"
            message = "Vaše cesta pokračuje tam, kde jste skončili."
        else:
            greeting = f"Welcome back, {st.session_state.user_name}! 💚"
            message = "Your journey continues where you left off."
        
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #e8f5e8 0%, #d4e7d4 100%);
            padding: 1.2rem;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 1.5rem;
            border-left: 4px solid #7AB87A;
        ">
            <h3 style="color: #2E5D31; margin-bottom: 0.5rem;">{greeting}</h3>
            <p style="color: #4A5E4A; margin: 0;">{message}</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Show gentle progress for returning users
        if st.session_state.total_impact['actions'] > 0:
            actions_count = st.session_state.total_impact['actions']
            if language == 'czech':
                progress_msg = f"Už jste dokončili {actions_count} {'akci' if actions_count == 1 else 'akce' if actions_count < 5 else 'akcí'}. Každý krok má smysl."
            else:
                progress_msg = f"You've completed {actions_count} action{'s' if actions_count != 1 else ''}. Every step matters."
            
            st.markdown(f"""
            <div style="
                background: #f0fff0;
                padding: 1rem;
                border-radius: 8px;
                text-align: center;
                margin-bottom: 1rem;
                border: 1px solid #d4edda;
            ">
                <span style="color: #2E5D31;">✨ {progress_msg}</span>
            </div>
            """, unsafe_allow_html=True)

def _show_warm_returning_content(language, inactivity_status):
    """Warm content for returning users"""
    
    if language == 'czech':
        if inactivity_status == 'long_inactive':
            content = """
            ### Někdy potřebujeme pauzu 🌸
            
            Je naprosto v pořádku, že jste si dali čas. Péče o sebe je také forma pomoci.
            Když jste připraveni, jsme tu pro vás – s tím samým porozuměním a bez jakéhokoliv tlaku.
            
            **Vaše pocity jsou platné. Vaše tempo je správné.**
            """
        else:
            content = """
            ### Vaše cesta pokračuje 🌿
            
            Každý krok, který jste udělali, měl význam. Možná jste o tom ani nevěděli, 
            ale vaše akce vytvořily vlnky pomoci, které se šíří dál.
            
            **Jste připraveni na další jemný krok?**
        """
    else:
        if inactivity_status == 'long_inactive':
            content = """
            ### Sometimes we need a pause 🌸
            
            It's completely okay that you took time for yourself. Self-care is also a form of help.
            When you're ready, we're here for you – with the same understanding and without any pressure.
            
            **Your feelings are valid. Your pace is right.**
            """
        else:
            content = """
            ### Your journey continues 🌿
            
            Every step you've taken has had meaning. You might not even know it, 
            but your actions created ripples of help that continue to spread.
            
            **Ready for another gentle step?**
            """
    
    st.markdown(content)

def _show_gentle_first_time_content(language):
    """Gentle, reassuring content for first-time users"""
    
    if language == 'czech':
        st.markdown("""
        ### Jste na správném místě 💚
        
        Pokud se cítíte zahlceni situací ve světě, nejste sami. Tento pocit ukazuje, 
        že vám na ostatních záleží – a to je krásná vlastnost.
        
        **Zde je bezpečno.** Pomůžeme vám najít malé, ale smysluplné kroky, 
        které se hodí do vašeho života a odpovídají vašim hodnotám.
        """)
        
        # Beautiful feature overview
        st.markdown("""
        <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        ">
            <div style="
                background: #fafbfa;
                padding: 1.2rem;
                border-radius: 12px;
                border-left: 3px solid #7AB87A;
                text-align: center;
            ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🧭</div>
                <strong>Jemná reflexe</strong><br>
                <small style="color: #5A6B5A;">5 minut o vašich hodnotách</small>
            </div>
            <div style="
                background: #fafbfa;
                padding: 1.2rem;
                border-radius: 12px;
                border-left: 3px solid #7AB87A;
                text-align: center;
            ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚡</div>
                <strong>Okamžité akce</strong><br>
                <small style="color: #5A6B5A;">Kroky, které můžete udělat hned</small>
            </div>
            <div style="
                background: #fafbfa;
                padding: 1.2rem;
                border-radius: 12px;
                border-left: 3px solid #7AB87A;
                text-align: center;
            ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">💚</div>
                <strong>Podpora</strong><br>
                <small style="color: #5A6B5A;">Na každém kroku vaší cesty</small>
            </div>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        ### You're in the right place 💚
        
        If you feel overwhelmed by the world's situation, you're not alone. This feeling shows 
        that you care about others – and that's a beautiful quality.
        
        **Here is safe.** We'll help you find small but meaningful steps 
        that fit your life and align with your values.
        """)
        
        # Beautiful feature overview
        st.markdown("""
        <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        ">
            <div style="
                background: #fafbfa;
                padding: 1.2rem;
                border-radius: 12px;
                border-left: 3px solid #7AB87A;
                text-align: center;
            ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🧭</div>
                <strong>Gentle reflection</strong><br>
                <small style="color: #5A6B5A;">5 minutes about your values</small>
            </div>
            <div style="
                background: #fafbfa;
                padding: 1.2rem;
                border-radius: 12px;
                border-left: 3px solid #7AB87A;
                text-align: center;
            ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚡</div>
                <strong>Immediate actions</strong><br>
                <small style="color: #5A6B5A;">Steps you can take right now</small>
            </div>
            <div style="
                background: #fafbfa;
                padding: 1.2rem;
                border-radius: 12px;
                border-left: 3px solid #7AB87A;
                text-align: center;
            ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">💚</div>
                <strong>Support</strong><br>
                <small style="color: #5A6B5A;">At every step of your journey</small>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
def _render_heart_section(language, behavior_insights):
    """The heart of the experience - emotional check-in and clear next steps"""
    
    # Create two beautiful columns
    col_left, col_right = st.columns([1, 1], gap="large")
    
    with col_left:
        _render_beautiful_emotional_check_in(language, behavior_insights)
    
    with col_right:
        _render_beautiful_next_steps(language, behavior_insights)

def _render_beautiful_emotional_check_in(language, behavior_insights):
    """Beautiful, compassionate emotional check-in"""
    
    if language == 'czech':
        st.markdown("""
        ### 💝 Jak se dnes cítíte?
        
        *Vaše pocity nám pomohou najít akce, které budou odpovídat vaší energii.*
        """)
        
        emotional_options = [
            ("zahlcen", "😔 Cítím se zahlcen/a"),
            ("frustrovan", "😤 Jsem frustrován/a"),
            ("nadejny", "😊 Mám naději"),
            ("provinile", "😕 Cítím vinu"),
            ("motivovan", "🔥 Jsem motivován/a"),
            ("nejisty", "😐 Nejsem si jistý/á")
        ]
        placeholder = "Vyberte, co je vám nejblíž..."
    else:
        st.markdown("""
        ### 💝 How are you feeling today?
        
        *Your feelings help us find actions that match your energy.*
        """)
        
        emotional_options = [
            ("overwhelmed", "😔 I feel overwhelmed"),
            ("frustrated", "😤 I'm frustrated"),
            ("hopeful", "😊 I have hope"),
            ("guilty", "😕 I feel guilty"),
            ("motivated", "🔥 I'm motivated"),
            ("uncertain", "😐 I'm unsure")
        ]
        placeholder = "Choose what's closest to you..."
    
    # Beautiful emotion selector
    emotional_state = st.selectbox(
        label="emotional_state_hidden",
        options=[""] + [opt[1] for opt in emotional_options],
        index=0,
        placeholder=placeholder,
        label_visibility="collapsed",
        key="beautiful_emotion_select"
    )
    
    if emotional_state:
        # Extract emotion key
        emotion_key = next((key for key, label in emotional_options if label == emotional_state), "nejisty")
        
        # Update profile and track emotional state
        update_user_profile({'emotional_state': emotion_key})
        track_emotional_state(emotion_key, "welcome_page")
        record_mood_check_in(emotion_key, "welcome_assessment")
        
        # Show beautiful, compassionate response
        response = get_emotional_response(emotion_key, language)
        
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #e8f5e8 0%, #d4e7d4 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin: 1rem 0;
            border-left: 4px solid #7AB87A;
        ">
            <div style="color: #2E5D31; line-height: 1.5;">
                💚 {response}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Offer gentle support for difficult emotions
        if emotion_key in ['zahlcen', 'overwhelmed', 'frustrovan', 'frustrated', 'provinile', 'guilty']:
            with st.expander("🤗 Potřebujete chvilku péče?" if language == 'czech' else "🤗 Need a moment of care?", expanded=False):
                if language == 'czech':
                    st.markdown("""
                    **Jemné připomenutí:** Vaše pocity jsou platné a normální. 
                    Mnoho lidí se cítí stejně. Jste odvážní, že jste tady.
                    
                    Možná by vám pomohlo:
                    """)
                else:
                    st.markdown("""
                    **Gentle reminder:** Your feelings are valid and normal. 
                    Many people feel the same way. You're brave for being here.
                    
                    Maybe this would help:
                    """)
                
                col_a, col_b = st.columns(2)
                with col_a:
                    if st.button("🫁 Dýchací cvičení" if language == 'czech' else "🫁 Breathing exercise", use_container_width=True):
                        render_breathing_exercise(language)
                with col_b:
                    if st.button("💚 Péče o sebe" if language == 'czech' else "💚 Self-care", use_container_width=True):
                        show_self_care_suggestions(language)

def _render_beautiful_next_steps(language, behavior_insights):
    """Beautiful, clear next steps with emotional guidance"""
    
    if language == 'czech':
        st.markdown("""
        ### 🌟 Vaše další kroky
        
        *Vyberte si cestu, která se vám teď zdá správná.*
        """)
    else:
        st.markdown("""
        ### 🌟 Your next steps
        
        *Choose the path that feels right to you now.*
        """)
    
    # Personalized recommendations based on behavior
    if behavior_insights.get('is_action_oriented'):
        _show_beautiful_action_oriented_path(language)
    elif behavior_insights.get('is_explorer'):
        _show_beautiful_explorer_path(language)
    elif behavior_insights.get('needs_guidance'):
        _show_beautiful_guided_path(language)
    else:
        _show_beautiful_default_paths(language)
    
    # Gentle additional option
    st.markdown("<div style='height: 1rem;'></div>", unsafe_allow_html=True)
    
    if language == 'czech':
        st.markdown("*Nebo si můžete jen [přečíst skutečné příběhy](#) lidí, kteří začali podobně jako vy.*")
    else:
        st.markdown("*Or you can just [read real stories](#) of people who started similarly to you.*")
    
    if st.button("📖 Příběhy inspirace" if language == 'czech' else "📖 Stories of inspiration", use_container_width=True, key="stories_main"):
        _show_beautiful_success_stories(language)

def _show_beautiful_action_oriented_path(language):
    """Beautiful path for action-oriented users"""
    
    if language == 'czech':
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            text-align: center;
        ">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🚀</div>
            <strong>Cítíme vaši energii!</strong><br>
            <small>Vypadá to, že jste připraveni jednat hned teď.</small>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("⚡ Ukázat mi rychlé akce", type="primary", use_container_width=True):
            st.session_state.current_page = 'quick_actions'
            st.rerun()
        
        st.caption("💡 Nebo si můžete nejdřív projít reflexi pro doporučení na míru")
    else:
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            text-align: center;
        ">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🚀</div>
            <strong>We feel your energy!</strong><br>
            <small>It looks like you're ready to act right now.</small>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("⚡ Show me quick actions", type="primary", use_container_width=True):
            st.session_state.current_page = 'quick_actions'
            st.rerun()
        
        st.caption("💡 Or you can first go through reflection for tailored recommendations")

def _show_beautiful_explorer_path(language):
    """Beautiful path for explorer users"""
    
    if language == 'czech':
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            text-align: center;
        ">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🗺️</div>
            <strong>Rádi prozkoumáváte</strong><br>
            <small>Pojďme se podívat na různé oblasti pomoci.</small>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("🌍 Prozkoumat oblasti pomoci", type="primary", use_container_width=True):
            st.session_state.current_page = 'causes'
            st.rerun()
        
        st.caption("💡 Nebo začněte reflexí pro personalizované doporučení")
    else:
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            text-align: center;
        ">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🗺️</div>
            <strong>You like to explore</strong><br>
            <small>Let's look at different areas of help.</small>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("🌍 Explore areas of help", type="primary", use_container_width=True):
            st.session_state.current_page = 'causes'
            st.rerun()
        
        st.caption("💡 Or start with reflection for personalized recommendations")

def _show_beautiful_guided_path(language):
    """Beautiful path for users who need guidance"""
    
    if language == 'czech':
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            text-align: center;
        ">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🤝</div>
            <strong>Pojďme na to společně</strong><br>
            <small>Krok za krokem najdeme to pravé pro vás.</small>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("🧭 Začít jemnou reflexi", type="primary", use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()
    
        st.caption("💡 Nebo se podívejte na rychlé akce, pokud chcete začít hned")
    else:
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            text-align: center;
        ">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🤝</div>
            <strong>Let's do this together</strong><br>
            <small>Step by step, we'll find what's right for you.</small>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("🧭 Start gentle reflection", type="primary", use_container_width=True):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()

        st.caption("💡 Or look at quick actions if you want to start right away")

def _show_beautiful_default_paths(language):
    """Beautiful default paths for new users"""
    
    if language == 'czech':
        st.markdown("**Dva krásné způsoby, jak začít:**")
        
        # Path 1: Reflection
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #e8f5e8 0%, #d4e7d4 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin: 0.5rem 0;
            border-left: 4px solid #7AB87A;
        ">
            <strong>🧭 Najít vaši cestu</strong><br>
            <small style="color: #5A6B5A;">5 minut jemné reflexe pro doporučení šitá na míru</small>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Začít reflexi", type="primary", use_container_width=True, key="reflection_path"):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()
        
        st.markdown("<div style='height: 0.5rem;'></div>", unsafe_allow_html=True)
        
        # Path 2: Quick actions
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin: 0.5rem 0;
            border-left: 4px solid #FF9800;
        ">
            <strong>⚡ Rychlá pomoc</strong><br>
            <small style="color: #5A6B5A;">Jednoduché akce, které můžete udělat hned teď</small>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Ukázat rychlé akce", use_container_width=True, key="quick_path"):
            st.session_state.current_page = 'quick_actions'
            st.rerun()
    else:
        st.markdown("**Two beautiful ways to begin:**")
        
        # Path 1: Reflection
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #e8f5e8 0%, #d4e7d4 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin: 0.5rem 0;
            border-left: 4px solid #7AB87A;
        ">
            <strong>🧭 Find your path</strong><br>
            <small style="color: #5A6B5A;">5 minutes of gentle reflection for tailored recommendations</small>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Start reflection", type="primary", use_container_width=True, key="reflection_path_en"):
            st.session_state.assessment_step = 1
            st.session_state.current_page = 'assessment'
            st.rerun()
        
        st.markdown("<div style='height: 0.5rem;'></div>", unsafe_allow_html=True)
        
        # Path 2: Quick actions
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            padding: 1.2rem;
            border-radius: 12px;
            margin: 0.5rem 0;
            border-left: 4px solid #FF9800;
        ">
            <strong>⚡ Quick help</strong><br>
            <small style="color: #5A6B5A;">Simple actions you can take right now</small>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Show quick actions", use_container_width=True, key="quick_path_en"):
            st.session_state.current_page = 'quick_actions'
            st.rerun()

def _show_gentle_inspiration(language, returning_user):
    """Gentle inspiration that doesn't overwhelm"""
    
    # Only one piece of inspiration at a time
    if returning_user:
        encouragement = get_random_encouragement("progress_encouragement", language)
    else:
        encouragement = get_random_encouragement("welcome_messages", language)
    
    if encouragement:
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #f0fff0 0%, #e8f5e8 100%);
            padding: 1.2rem;
            border-radius: 12px;
            text-align: center;
            margin: 1.5rem 0;
            border: 1px solid #d4e7d4;
        ">
            <div style="color: #2E5D31; font-style: italic; line-height: 1.5;">
                💚 {encouragement}
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    # Occasional Czech wisdom
    if language == 'czech' and random.random() < 0.2:
        proverb = get_czech_proverb('start')
        st.markdown(f"""
        <div style="
            background: #fafbfa;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            margin: 1rem 0;
            font-style: italic;
            color: #5A6B5A;
            border-left: 3px solid #7AB87A;
        ">
            🌿 {proverb}
        </div>
        """, unsafe_allow_html=True)

def _show_caring_support(language):
    """Caring support for users showing distress"""
    
    st.markdown("---")
    
    if language == 'czech':
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
            margin: 1rem 0;
            border: 1px solid #ffcc80;
        ">
            <h4 style="color: #e65100; margin-bottom: 1rem;">💚 Vidíme, že to může být náročné</h4>
            <p style="color: #5A6B5A; margin-bottom: 1rem;">
                Jste silnější, než si myslíte. Vaše pocity jsou platné a normální.
                Mnoho lidí se cítí stejně – nejste v tom sami.
            </p>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
            margin: 1rem 0;
            border: 1px solid #ffcc80;
        ">
            <h4 style="color: #e65100; margin-bottom: 1rem;">💚 We see this might be challenging</h4>
            <p style="color: #5A6B5A; margin-bottom: 1rem;">
                You're stronger than you think. Your feelings are valid and normal.
                Many people feel the same way – you're not alone in this.
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🫁 Rychlé uklidnění" if language == 'czech' else "🫁 Quick calming", use_container_width=True):
            with st.expander("Dýchací cvičení" if language == 'czech' else "Breathing exercise", expanded=True):
                render_breathing_exercise(language)
    
    with col2:
        if st.button("💚 Péče o sebe" if language == 'czech' else "💚 Self-care", use_container_width=True):
            with st.expander("Okamžitá péče" if language == 'czech' else "Immediate care", expanded=True):
                show_self_care_suggestions(language)

def _show_beautiful_success_stories(language):
    """Beautiful success stories that inspire without overwhelming"""
    
    with st.expander("📖 Příběhy lidí jako jste vy" if language == 'czech' else "📖 Stories of people like you", expanded=True):
        if language == 'czech':
            stories = [
                {
                    "name": "Petra",
                    "story": "Začala s malým darem 200 Kč pro sázení stromů. Dnes koordinuje program udržitelnosti ve své firmě.",
                    "impact": "Inspirovala 500+ kolegů k vlastním ekologickým krokům",
                    "timeframe": "za 6 měsíců",
                    "feeling": "\"Zpočátku jsem se cítila bezmocně. Teď vím, že i malé kroky mají smysl.\""
                },
                {
                    "name": "Tomáš",
                    "story": "Začal doučováním jednoho dítěte přes internet. Inspirovalo ho to stát se učitelem.",
                    "impact": "Dnes pomáhá 30 studentům denně",
                    "timeframe": "za rok",
                    "feeling": "\"Myslel jsem, že nejsem dost dobrý. Ukázalo se, že stačí být jen sám sebou.\""
                },
                {
                    "name": "Marie",
                    "story": "Zorganizovala jeden sousedský večírek. Vyrostla z toho komunita, která si vzájemně pomáhá.",
                    "impact": "50+ domácností se pravidelně setkává a podporuje",
                    "timeframe": "za 8 měsíců",
                    "feeling": "\"Bála jsem se, že nikdo nepřijde. Teď máme krásnou komunitu.\""
                }
            ]
        else:
            stories = [
                {
                    "name": "Sarah",
                    "story": "Started with a small $5 tree donation. Today she coordinates her company's sustainability program.",
                    "impact": "Inspired 500+ colleagues to take their own environmental steps",
                    "timeframe": "in 6 months",
                    "feeling": "\"Initially I felt helpless. Now I know even small steps matter.\""
                },
                {
                    "name": "Marcus",
                    "story": "Started tutoring one child online. It inspired him to become a teacher.",
                    "impact": "Today helps 30 students daily",
                    "timeframe": "in a year",
                    "feeling": "\"I thought I wasn't good enough. Turns out being yourself is enough.\""
                },
                {
                    "name": "Elena",
                    "story": "Organized one neighborhood potluck. It grew into a community that helps each other.",
                    "impact": "50+ households regularly meet and support each other",
                    "timeframe": "in 8 months",
                    "feeling": "\"I was afraid no one would come. Now we have a beautiful community.\""
                }
            ]
        
        for i, story in enumerate(stories):
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #f8fdf8 0%, #f0f8f0 100%);
                padding: 1.5rem;
                border-radius: 12px;
                margin: 1rem 0;
                border-left: 4px solid #7AB87A;
            ">
                <h4 style="color: #2E5D31; margin-bottom: 0.5rem;">🌱 {story['name']}</h4>
                <p style="margin-bottom: 0.8rem; line-height: 1.5;">{story['story']}</p>
                <div style="
                    background: #e8f5e8;
                    padding: 0.8rem;
                    border-radius: 8px;
                    margin-bottom: 0.8rem;
                ">
                    <strong style="color: #2E5D31;">💫 Dopad:</strong> {story['impact']} <em>({story['timeframe']})</em>
                </div>
                <div style="
                    font-style: italic;
                    color: #5A6B5A;
                    text-align: center;
                ">
                    {story['feeling']}
                </div>
            </div>
            """, unsafe_allow_html=True) 