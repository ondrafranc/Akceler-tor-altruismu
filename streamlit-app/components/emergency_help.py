"""Enhanced emergency help widget with gentle, supportive design"""

import streamlit as st
from config.settings import EMERGENCY_CONTACTS
from utils.localization import get_text, get_accessibility_text

def render_emergency_widget(language='czech'):
    """Render the enhanced always-visible emergency help widget with gentle, supportive design"""
    
    if language not in st.session_state:
        language = st.session_state.get('language', 'czech')
    
    contacts = EMERGENCY_CONTACTS.get(language, EMERGENCY_CONTACTS['czech'])
    
    # Redesigned emergency widget with soft, supportive styling
    emergency_html = f"""
    <div class="emergency-help-gentle" role="complementary" aria-label="{get_accessibility_text('emergency_widget', language)}">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 1.2em; margin-right: 8px;">🤗</span>
            <strong style="color: #5D4E75; font-size: 0.95rem;">{'Cítíte se zahlceni?' if language == 'czech' else 'Feeling overwhelmed?'}</strong>
        </div>
        <p style="color: #6B5B73; font-size: 0.85rem; margin: 8px 0; line-height: 1.4;">
            {'Nejste sami. Pomoc je na dosah.' if language == 'czech' else 'You\'re not alone. Help is within reach.'}
        </p>
        <div style="margin-bottom: 8px;">
            <span style="color: #7A6B8A; font-size: 0.85rem;">📞 {'Linka bezpečí:' if language == 'czech' else 'Safety line:'}</span><br>
            <a href="tel:{contacts['safety_line']}" style="color: #5D4E75; text-decoration: none; font-weight: 600; font-size: 0.9rem; border-bottom: 1px dotted #B8A9C9;">{contacts['safety_line']}</a>
        </div>
        <div style="margin-bottom: 12px;">
            <span style="color: #7A6B8A; font-size: 0.85rem;">🆘 {'Krizová pomoc:' if language == 'czech' else 'Crisis support:'}</span><br>
            <a href="tel:{contacts['crisis_intervention']}" style="color: #5D4E75; text-decoration: none; font-weight: 600; font-size: 0.9rem; border-bottom: 1px dotted #B8A9C9;">{contacts['crisis_intervention']}</a>
        </div>
        <details style="margin-top: 10px;">
            <summary style="cursor: pointer; font-size: 0.8rem; color: #8B7A9B; outline: none;">
                {'▶ Okamžitá podpora' if language == 'czech' else '▶ Immediate support'}
            </summary>
            <div style="margin-top: 10px; font-size: 0.8rem; line-height: 1.4; color: #6B5B73;">
                {'Pokud potřebujete okamžitou pomoc:' if language == 'czech' else 'If you need immediate help:'}
                <ul style="margin: 8px 0; padding-left: 16px; color: #7A6B8A;">
                    <li style="margin: 4px 0;">{'Zavolejte na čísla výše' if language == 'czech' else 'Call the numbers above'}</li>
                    <li style="margin: 4px 0;">{'Najděte bezpečné místo' if language == 'czech' else 'Find a safe place'}</li>
                    <li style="margin: 4px 0;">{'Zhluboka se nadechněte' if language == 'czech' else 'Take deep breaths'}</li>
                    <li style="margin: 4px 0;">{'Kontaktujte blízkou osobu' if language == 'czech' else 'Contact someone close'}</li>
                </ul>
            </div>
        </details>
    </div>
    """
    
    st.markdown(emergency_html, unsafe_allow_html=True)

def show_crisis_support_modal(language='czech'):
    """Show comprehensive crisis support information in a modal"""
    
    with st.expander(f"🆘 {get_text('crisis_guide', language)}", expanded=False):
        st.markdown(f"**{get_text('crisis_help_text', language)}**")
        
        if language == 'czech':
            st.markdown("""
            ### Okamžité kroky v krizi:
            
            1. **Bezpečnost především**
               - Pokud jste v bezprostředním nebezpečí, volejte 112
               - Najděte bezpečné místo
               - Zůstaňte s někým důvěryhodným
            
            2. **Kontaktujte pomoc**
               - 📞 **Linka bezpečí**: 116 111 (24/7, zdarma)
               - 🚨 **Krizová intervence**: 284 016 666
               - 🏥 **Pohotovost**: 155
               - 👮 **Policie**: 158
            
            3. **Další zdroje podpory**
               - **Linka důvěry**: 222 580 697
               - **SOS linka**: 583 782 466
               - **Online chat**: www.linkabezpeci.cz
               - **Centrum krizové intervence**: www.krizova-pomoc.cz
            
            4. **Co můžete udělat hned teď**
               - Zhluboka dýchejte
               - Pijte vodu
               - Kontaktujte blízkou osobu
               - Napište si své pocity
               - Najděte klidné místo
            
            ### Pamatujte si:
            - **Nejste sami** - pomoc je vždy dostupná
            - **Vaše pocity jsou platné** - máte právo na podporu
            - **Krize jsou dočasné** - situace se může zlepšit
            - **Jste silnější, než si myslíte** - dokázali jste to zvládnout už dříve
            """)
        else:
            st.markdown("""
            ### Immediate steps in crisis:
            
            1. **Safety first**
               - If in immediate danger, call 112
               - Find a safe place
               - Stay with someone trustworthy
            
            2. **Contact help**
               - 📞 **Safety line**: 116 111 (24/7, free)
               - 🚨 **Crisis intervention**: 284 016 666
               - 🏥 **Emergency**: 155
               - 👮 **Police**: 158
            
            3. **Additional support resources**
               - **Helpline**: 222 580 697
               - **SOS line**: 583 782 466
               - **Online chat**: www.linkabezpeci.cz
               - **Crisis intervention center**: www.krizova-pomoc.cz
            
            4. **What you can do right now**
               - Breathe deeply
               - Drink water
               - Contact someone close
               - Write down your feelings
               - Find a quiet place
            
            ### Remember:
            - **You're not alone** - help is always available
            - **Your feelings are valid** - you have the right to support
            - **Crises are temporary** - situations can improve
            - **You're stronger than you think** - you've managed before
            """)
        
        # Quick action buttons for crisis
        col1, col2 = st.columns(2)
        with col1:
            if st.button("📞 Zavolat linku bezpečí" if language == 'czech' else "📞 Call safety line"):
                st.markdown(f"**Linka bezpečí: [116 111](tel:116111)**")
                st.success("Klikněte na číslo pro volání" if language == 'czech' else "Click the number to call")
        
        with col2:
            if st.button("💬 Online chat" if language == 'czech' else "💬 Online chat"):
                st.markdown("**[www.linkabezpeci.cz](https://www.linkabezpeci.cz)**")
                st.success("Otevře se v novém okně" if language == 'czech' else "Opens in new window")

def check_distress_indicators(emotional_state, language='czech'):
    """Check for distress indicators and offer additional support"""
    distress_emotions = ['zahlcen', 'overwhelmed', 'frustrated', 'frustrován', 'guilty', 'provinile']
    
    if emotional_state in distress_emotions:
        # Show enhanced support message
        if language == 'czech':
            support_message = """
            💚 **Vidíme, že to může být těžké.** Jste silnější, než si myslíte, a pomoc je na dosah.
            
            Pokud se cítíte zahlceni, zkuste:
            - Zhluboka dýchat (4 vteřiny nádech, 4 výdech)
            - Najít jedno malé pozitivum v dnešním dni
            - Kontaktovat někoho blízkého
            - Udělat malý krok místo velkého skoku
            """
        else:
            support_message = """
            💚 **We see this might be difficult.** You're stronger than you think, and help is within reach.
            
            If you're feeling overwhelmed, try:
            - Deep breathing (4 seconds in, 4 seconds out)
            - Finding one small positive in today
            - Contacting someone close
            - Taking a small step instead of a big leap
            """
        
        st.info(support_message)
        
        # Offer crisis support
        if st.button("🆘 Potřebuji více podpory" if language == 'czech' else "🆘 I need more support"):
            show_crisis_support_modal(language)
        
        return True
    
    return False

def render_breathing_exercise(language='czech'):
    """Render a simple breathing exercise for immediate relief"""
    
    if language == 'czech':
        st.markdown("""
        ### 🫁 Rychlé dýchací cvičení
        
        Pokud se cítíte úzkostni nebo zahlceni, zkuste toto jednoduché cvičení:
        
        1. **Sedněte si pohodlně** a zavřete oči
        2. **Nadechněte se** pomalu nosem na 4 počítání
        3. **Zadržte dech** na 4 počítání  
        4. **Vydechněte** pomalu ústy na 6 počítání
        5. **Opakujte** 5-10x
        
        *Toto cvičení aktivuje váš parasympatický nervový systém a pomáhá uklidnit mysl.*
        """)
    else:
        st.markdown("""
        ### 🫁 Quick breathing exercise
        
        If you're feeling anxious or overwhelmed, try this simple exercise:
        
        1. **Sit comfortably** and close your eyes
        2. **Breathe in** slowly through your nose for 4 counts
        3. **Hold your breath** for 4 counts
        4. **Breathe out** slowly through your mouth for 6 counts
        5. **Repeat** 5-10 times
        
        *This exercise activates your parasympathetic nervous system and helps calm the mind.*
        """)

def show_self_care_suggestions(language='czech'):
    """Show immediate self-care suggestions"""
    
    if language == 'czech':
        suggestions = [
            "☕ Udělejte si čaj nebo kávu a vychutnejte si jí",
            "🚶 Jděte na krátkou procházku, ideálně do přírody",
            "📱 Zavolejte někomu, koho máte rádi",
            "📝 Napište si tři věci, za které jste dnes vděční",
            "🎵 Pusťte si oblíbenou písničku",
            "🛁 Dejte si teplou sprchu nebo koupel",
            "🌱 Podívejte se na něco zeleného - rostlinu nebo strom",
            "🤗 Obejměte někoho"
        ]
        st.markdown("### 💚 Okamžitá péče o sebe")
    else:
        suggestions = [
            "☕ Make tea or coffee and enjoy it slowly",
            "🚶 Take a short walk, even just around the block",
            "📱 Call someone you care about",
            "📝 Write down three things you're grateful for",
            "🎵 Play your favorite song",
            "🛁 Take a warm shower or bath",
            "🌱 Look at something green - a plant or tree",
            "🤗 Hug someone or something soft"
        ]
        st.markdown("### 💚 Immediate self-care")
    
    for suggestion in suggestions:
        st.markdown(f"- {suggestion}")

def render_emergency_contact_card(contact_type, number, description, language='czech'):
    """Render an individual emergency contact card"""
    
    card_html = f"""
    <div style="
        border: 2px solid #FF6B6B; 
        border-radius: 8px; 
        padding: 12px; 
        margin: 8px 0; 
        background: #FFF5F5;
        display: flex;
        align-items: center;
        justify-content: space-between;
    ">
        <div>
            <strong style="color: #D63031;">{contact_type}</strong><br>
            <span style="color: #636e72; font-size: 0.9em;">{description}</span>
        </div>
        <div>
            <a href="tel:{number}" style="
                background: #FF6B6B; 
                color: white; 
                padding: 8px 16px; 
                border-radius: 20px; 
                text-decoration: none; 
                font-weight: bold;
                font-size: 1.1em;
            ">{number}</a>
        </div>
    </div>
    """
    
    st.markdown(card_html, unsafe_allow_html=True) 