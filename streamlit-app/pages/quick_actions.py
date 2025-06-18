"""Quick actions page - immediate meaningful actions"""

import streamlit as st
import re
from datetime import datetime
from config.settings import CZECH_ORGANIZATIONS
from utils.localization import get_text
from logic.tracking import record_action_completion
from logic.encouragement import celebrate_action_completion

def show_quick_actions_page():
    """Enhanced quick actions with immediate real-world connections"""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown('<h1 class="main-header">⚡ Rychlé akce</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">Něco smysluplného, co můžete udělat hned teď</p>', unsafe_allow_html=True)
    else:
        st.markdown('<h1 class="main-header">⚡ Quick Actions</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">Something meaningful you can do right now</p>', unsafe_allow_html=True)
    
    # Time-based filter
    col1, col2, col3 = st.columns(3)
    with col1:
        if language == 'czech':
            time_filter = st.selectbox(
                "Kolik času máte?",
                ["5 minut", "15 minut", "30 minut", "1 hodina", "Cokoliv"]
            )
        else:
            time_filter = st.selectbox(
                "How much time do you have?",
                ["5 minutes", "15 minutes", "30 minutes", "1 hour", "Any time"]
            )
    
    with col2:
        if language == 'czech':
            location_filter = st.selectbox(
                "Kde jste?",
                ["Doma", "Venku", "V práci", "Cestou", "Kdekoli"]
            )
        else:
            location_filter = st.selectbox(
                "Where are you?",
                ["At home", "Outside", "At work", "Traveling", "Anywhere"]
            )
    
    with col3:
        if language == 'czech':
            energy_filter = st.selectbox(
                "Úroveň energie",
                ["Vysoká", "Střední", "Nízká", "Jakákoli"]
            )
        else:
            energy_filter = st.selectbox(
                "Energy level",
                ["High", "Medium", "Low", "Any"]
            )
    
    st.markdown("---")
    
    # Enhanced quick actions with real connections
    quick_actions = _get_quick_actions_data(language)
    
    # Display actions in enhanced grid layout
    st.markdown('<div class="action-grid">', unsafe_allow_html=True)
    
    cols = st.columns(2)
    for i, action in enumerate(quick_actions):
        with cols[i % 2]:
            _render_action_card(action, i, language)
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # CTA for full assessment
    st.markdown("---")
    st.markdown(f"""
    <div class="cta-section">
        <h3>{'💡 Chcete personalizovaná doporučení?' if language == 'czech' else '💡 Want personalized recommendations?'}</h3>
        <p>{'Projděte si naše posouzení pro akce přesně na míru vašim hodnotám a možnostem.' if language == 'czech' else 'Take our assessment for actions perfectly matched to your values and resources.'}</p>
    </div>
    """, unsafe_allow_html=True)
    
    if st.button(
        f"🧭 Projít personalizované posouzení" if language == 'czech' else "🧭 Take personalized assessment",
        type="primary",
        use_container_width=True
    ):
        st.session_state.assessment_step = 1
        st.session_state.current_page = 'assessment'
        st.rerun()

def _get_quick_actions_data(language):
    """Get quick actions data based on language"""
    
    if language == 'czech':
        return [
            {
                "title": "🌱 Daruj na výsadbu stromů",
                "description": "Jednorázový dar na výsadbu stromu v České republice",
                "time": "2 minuty",
                "location": "Online",
                "energy": "Nízká",
                "impact": "1 strom = 22 kg CO2 ročně",
                "action_link": CZECH_ORGANIZATIONS['tree_planting'],
                "instructions": "Klikněte na odkaz, vyberte částku a dokončete dar. Dostanete potvrzení o výsadbě.",
                "category": "Příroda"
            },
            {
                "title": "📚 Darujte použité knihy",
                "description": "Dejte knihám druhý život. Najděte nejbližší knihobudku pro jejich sdílení.",
                "time": "15 minut",
                "location": "Venku",
                "energy": "Střední",
                "impact": "Uděláte radost několika novým čtenářům.",
                "action_link": CZECH_ORGANIZATIONS['book_donations'],
                "instructions": "Najděte knihobudku na mapě, zabalte knihy, které už nepotřebujete, a odneste je tam. Udělejte si radost dobrým skutkem!",
                "category": "Vzdělání"
            },
            {
                "title": "❤️ Potěšte dopisem seniora",
                "description": "Napište online dopis a rozveselte den osamělému seniorovi.",
                "time": "20 minut",
                "location": "Doma",
                "energy": "Střední",
                "impact": "Váš dopis může být pro někoho nejhezčí událostí týdne.",
                "action_link": CZECH_ORGANIZATIONS['senior_letters'],
                "instructions": "Zaregistrujte se na portálu, napište milý a osobní dopis (bez citlivých údajů) a jednoduše ho odešlete systémem.",
                "category": "Komunita"
            },
            {
                "title": "🥘 Kupte teplé jídlo člověku v nouzi",
                "description": "Zaplaťte jednoduše teplé jídlo pro osobu bez domova přes aplikaci.",
                "time": "5 minut",
                "location": "Kdekoli",
                "energy": "Nízká",
                "impact": "Zajistíte někomu základní jistotu – teplé jídlo na jeden den.",
                "action_link": CZECH_ORGANIZATIONS['homeless_support'],
                "instructions": "Otevřete aplikaci Naděje, vyberte možnost 'Darovat jídlo' a zaplaťte. Jídlo bude vydáno v nejbližším centru pomoci.",
                "category": "Základní potřeby"
            },
            {
                "title": "🎓 Věnujte 15 minut doučování",
                "description": "Pomozte dítěti s matematikou nebo češtinou přes krátký videohovor.",
                "time": "30 minut",
                "location": "Doma",
                "energy": "Vysoká",
                "impact": "Vaše chvilka času může někomu pomoci překonat školní překážku.",
                "action_link": CZECH_ORGANIZATIONS['online_tutoring'],
                "instructions": "Zaregistrujte se jako dobrovolník, projděte rychlým úvodem a připojte se k doučování, když máte čas.",
                "category": "Vzdělání"
            },
            {
                "title": "🐕 Pomozte útulku na dálku",
                "description": "Darujte granule nebo hračky pro psy jednoduše online.",
                "time": "10 minut",
                "location": "Online",
                "energy": "Nízká",
                "impact": "Zlepšíte život 5-10 psům, kteří čekají na nový domov.",
                "action_link": CZECH_ORGANIZATIONS['animal_shelter'],
                "instructions": "Podívejte se na seznam potřeb konkrétního útulku a objednejte jim dar přímo na jejich adresu.",
                "category": "Zvířata"
            },
            {
                "title": "🌐 Sdílejte důležitý článek",
                "description": "Rozšiřte povědomí o duševním zdraví sdílením ověřeného článku.",
                "time": "2 minuty",
                "location": "Online",
                "energy": "Nízká",
                "impact": "Pomůžete normalizovat konverzaci o duševním zdraví.",
                "action_link": "https://www.opatruj.se/",
                "instructions": "Klikněte na odkaz, vyberte článek, který s vámi rezonuje, a sdílejte ho na sociálních sítích s krátkým osobním komentářem.",
                "category": "Osvěta"
            }
        ]
    else:
        return [
            {
                "title": "🌱 Donate to Plant a Tree",
                "description": "Support the 'Sázíme budoucnost' project and help restore the Czech landscape.",
                "time": "3 minutes",
                "location": "Online",
                "energy": "Low",
                "impact": "Every tree helps retain water and reduce CO2.",
                "action_link": CZECH_ORGANIZATIONS['tree_planting'],
                "instructions": "Click the link, choose 'I want to donate', select an amount, and securely complete the donation online.",
                "category": "Environment"
            },
            {
                "title": "📚 Donate Used Books",
                "description": "Give your books a second life. Find the nearest public bookshelf to share them.",
                "time": "15 minutes",
                "location": "Outside",
                "energy": "Medium",
                "impact": "You'll bring joy to several new readers.",
                "action_link": CZECH_ORGANIZATIONS['book_donations'],
                "instructions": "Find a public bookshelf on the map, pack the books you no longer need, and drop them off. Enjoy the feeling of a good deed!",
                "category": "Education"
            },
            {
                "title": "❤️ Write a Letter to a Senior",
                "description": "Write an online letter and brighten the day of a lonely senior citizen.",
                "time": "20 minutes",
                "location": "At home",
                "energy": "Medium",
                "impact": "Your letter could be the highlight of someone's week.",
                "action_link": CZECH_ORGANIZATIONS['senior_letters'],
                "instructions": "Register on the portal, write a kind and personal letter (without sensitive data), and simply send it through the system.",
                "category": "Community"
            },
            {
                "title": "🥘 Buy a Meal for Someone in Need",
                "description": "Easily pay for a warm meal for a homeless person through an app.",
                "time": "5 minutes",
                "location": "Anywhere",
                "energy": "Low",
                "impact": "You'll provide someone with a basic necessity – a warm meal for the day.",
                "action_link": CZECH_ORGANIZATIONS['homeless_support'],
                "instructions": "Open the Naděje app, select the 'Donate a meal' option, and make a payment. The meal will be distributed at the nearest help center.",
                "category": "Basic Needs"
            },
            {
                "title": "🎓 Tutor a Child for 15 Minutes",
                "description": "Help a child with math or Czech language via a short video call.",
                "time": "30 minutes",
                "location": "At home",
                "energy": "High",
                "impact": "A moment of your time can help someone overcome a school hurdle.",
                "action_link": CZECH_ORGANIZATIONS['online_tutoring'],
                "instructions": "Register as a volunteer, go through a quick intro, and join a tutoring session when you have time.",
                "category": "Education"
            },
            {
                "title": "🐕 Help a Shelter Remotely",
                "description": "Donate pet food or toys for dogs easily online.",
                "time": "10 minutes",
                "location": "Online",
                "energy": "Low",
                "impact": "You'll improve the lives of 5-10 dogs waiting for a new home.",
                "action_link": CZECH_ORGANIZATIONS['animal_shelter'],
                "instructions": "Look at the needs list of a specific shelter and order a gift for them directly to their address.",
                "category": "Animals"
            },
            {
                "title": "🌐 Share an Important Article",
                "description": "Spread awareness about mental health by sharing a verified article.",
                "time": "2 minutes",
                "location": "Online",
                "energy": "Low",
                "impact": "You'll help normalize the conversation around mental health.",
                "action_link": "https://www.opatruj.se/",
                "instructions": "Click the link, choose an article that resonates with you, and share it on social media with a short personal comment.",
                "category": "Awareness"
            }
        ]

def _render_action_card(action, index, language):
    """Render an individual action card"""
    
    impact_label = "Dopad" if language == 'czech' else "Impact"
    
    st.markdown(f"""
    <div class="action-card">
        <h4>{action['title']}</h4>
        <p style="margin: 0.5rem 0;">{action['description']}</p>
        <div style="margin: 1rem 0;">
            <span style="background: #E8F5E8; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem; margin-right: 0.5rem;">⏱️ {action['time']}</span>
            <span style="background: #E8F5E8; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem; margin-right: 0.5rem;">📍 {action['location']}</span>
            <span style="background: #E8F5E8; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">⚡ {action['energy']}</span>
        </div>
        <div style="background: #F0F8F0; padding: 0.75rem; border-radius: 8px; margin: 1rem 0;">
            <strong>{impact_label}:</strong> {action['impact']}
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    col_start, col_details = st.columns([1, 1])
    with col_start:
        if st.button(
            f"Začít nyní" if language == 'czech' else "Start now",
            key=f"start_{index}",
            type="primary",
            use_container_width=True
        ):
            # Provide immediate feedback and instructions
            st.success(f"🎉 {'Skvělé! Začínáte akci:' if language == 'czech' else 'Great! Starting action:'} {action['title']}")
            
            # Show action link and instructions prominently
            st.markdown(f"""
            <div style="background: #E8F5E8; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #7AB87A;">
                <strong>🔗 {'Pokračujte zde:' if language == 'czech' else 'Continue here:'}</strong><br>
                <a href="{action['action_link']}" target="_blank" style="color: #2E5D31; font-weight: 600;">{action['action_link']}</a>
                
                <br><br><strong>📋 {'Instrukce:' if language == 'czech' else 'Instructions:'}</strong><br>
                {action['instructions']}
                
                <br><br><strong>✨ {'Proč je to důležité:' if language == 'czech' else 'Why this matters:'}</strong><br>
                {'Tato akce je navržena tak, aby byla rychlá, ale smysluplná. Každý podobný čin přispívá k větší pozitivní změně ve světě.' if language == 'czech' else 'This action is designed to be quick but meaningful. Every similar act contributes to greater positive change in the world.'}
            </div>
            """, unsafe_allow_html=True)
            
            # Track action completion
            action_data = {
                'category': action['category'],
                'time_minutes': _extract_time_minutes(action['time']),
                'cost_estimate': 5,  # Default estimate
                'source': 'quick_actions'
            }
            
            record_action_completion(action['title'], action_data, language)
            celebrate_action_completion(action['title'], action['category'], language)
    
    with col_details:
        if st.button(
            f"Podrobnosti" if language == 'czech' else "Details",
            key=f"details_{index}",
            use_container_width=True
        ):
            with st.expander(f"Detaily akce: {action['title']}", expanded=True):
                st.markdown(f"""
                **Kategorie:** {action['category']}
                
                **{'Časová náročnost:' if language == 'czech' else 'Time required:'} ** {action['time']}
                **{'Místo:' if language == 'czech' else 'Location:'} ** {action['location']}
                **{'Úroveň energie:' if language == 'czech' else 'Energy level:'} ** {action['energy']}
                
                **{'Instrukce krok za krokem:' if language == 'czech' else 'Step-by-step instructions:'}**
                {action['instructions']}
                
                **{'Přímý odkaz:' if language == 'czech' else 'Direct link:'}**
                [{action['action_link']}]({action['action_link']})
                
                **{'Očekávaný dopad:' if language == 'czech' else 'Expected impact:'}**
                {action['impact']}
                """)

def _extract_time_minutes(time_str):
    """Extract time in minutes from time string"""
    time_minutes = 5  # Default
    if 'minut' in time_str or 'minute' in time_str:
        time_match = re.search(r'(\d+)', time_str)
        if time_match:
            time_minutes = int(time_match.group(1))
    elif 'hodin' in time_str or 'hour' in time_str:
        time_match = re.search(r'(\d+)', time_str)
        if time_match:
            time_minutes = int(time_match.group(1)) * 60
    return time_minutes 