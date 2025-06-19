"""Quick actions page - immediate meaningful actions"""

import streamlit as st
import re
from datetime import datetime
from config.settings import CZECH_ORGANIZATIONS
from utils.localization import get_text
from logic.tracking import record_action_completion
from logic.encouragement import celebrate_action_completion

def show_quick_actions_page():
    """A page for immediate, meaningful actions, framed as opportunities."""
    language = st.session_state.language
    
    if language == 'czech':
        st.markdown('<h1 class="main-header">⚡ Najděte si svou rychlou pomoc</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">Malé, konkrétní činy, které můžete udělat právě teď, abyste udělali skutečný rozdíl.</p>', unsafe_allow_html=True)
    else:
        st.markdown('<h1 class="main-header">⚡ Find Your Quick Help</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">Small, concrete things you can do right now to make a real difference.</p>', unsafe_allow_html=True)
    
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
    
    if not quick_actions:
        st.warning("Omlouváme se, momentálně nejsou k dispozici žádné rychlé akce.")
        return

    # Display actions in enhanced grid layout
    st.markdown("### Možnosti pomoci")
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
        <h3>{'💡 Hledáte něco osobnějšího?' if language == 'czech' else '💡 Looking for something more personal?'}</h3>
        <p>{'Věnujte 5 minut naší reflexi a my vám najdeme doporučení přesně na míru vašim hodnotám.' if language == 'czech' else 'Take our 5-minute reflection to find recommendations perfectly tailored to your values.'}</p>
    </div>
    """, unsafe_allow_html=True)
    
    if st.button(
        f"🧭 {get_text('take_assessment', language)}",
        type="primary",
        use_container_width=True
    ):
        st.session_state.assessment_step = 1
        st.session_state.current_page = 'assessment'
        st.rerun()

def _get_quick_actions_data(language):
    """Get quick actions data based on language with more evocative text."""
    
    if language == 'czech':
        return [
            {
                "title": "🌱 Darujte strom české krajině",
                "description": "Jednorázovým darem pomůžete zasadit strom tam, kde je to v Česku nejvíce potřeba.",
                "time": "2 min",
                "impact": "Každý strom pomáhá zadržovat vodu v krajině a čistit vzduch.",
                "action_link": CZECH_ORGANIZATIONS['tree_planting'],
                "instructions": "Klikněte na odkaz, vyberte částku a dokončete dar. Je to jednoduchý způsob, jak zanechat trvalou stopu.",
                "category": "Příroda"
            },
            {
                "title": "❤️ Potěšte dopisem osamělého seniora",
                "description": "Napište online dopis a rozveselte den někomu, kdo se cítí sám. Váš čas je ten nejcennější dar.",
                "time": "15 min",
                "impact": "Váš dopis může být pro někoho nejhezčí událostí celého týdne.",
                "action_link": CZECH_ORGANIZATIONS['senior_letters'],
                "instructions": "Zaregistrujte se na portálu, napište milý a osobní dopis (bez citlivých údajů) a jednoduše ho odešlete systémem.",
                "category": "Komunita"
            },
            {
                "title": "📚 Darujte knihu do knihobudky",
                "description": "Dejte svým přečteným knihám druhý život. Najděte nejbližší knihobudku a udělejte radost dalšímu čtenáři.",
                "time": "20 min",
                "impact": "Jedna kniha může inspirovat nebo potěšit desítky lidí.",
                "action_link": CZECH_ORGANIZATIONS['book_donations'],
                "instructions": "Najděte knihobudku na mapě, zabalte knihy, které už nepotřebujete, a odneste je tam.",
                "category": "Vzdělání"
            },
            {
                "title": "🥘 Kupte teplé jídlo člověku v nouzi",
                "description": "Jednoduše zaplaťte teplé jídlo pro osobu bez domova. Je to malý dar s obrovským významem.",
                "time": "3 min",
                "impact": "Zajistíte někomu základní jistotu – teplé jídlo na jeden den.",
                "action_link": CZECH_ORGANIZATIONS['homeless_support'],
                "instructions": "Otevřete odkaz, vyberte možnost 'Darovat jídlo' a zaplaťte. Jídlo bude vydáno v nejbližším centru pomoci.",
                "category": "Základní potřeby"
            },
            {
                "title": "🎓 Věnujte 15 minut online doučování",
                "description": "Pomozte dítěti, které se trápí s učivem, přes krátký videohovor. Vaše znalosti mohou změnit jeho den.",
                "time": "25 min",
                "impact": "Vaše chvilka času může někomu pomoci překonat školní překážku a získat sebevědomí.",
                "action_link": CZECH_ORGANIZATIONS['online_tutoring'],
                "instructions": "Zaregistrujte se jako dobrovolník, projděte rychlým úvodem a připojte se k doučování, když máte čas.",
                "category": "Vzdělání"
            },
            {
                "title": "🐕 Pomozte útulku na dálku",
                "description": "Nemůžete si vzít zvíře domů, ale chcete pomoci? Darujte granule nebo hračky pro psy jednoduše online.",
                "time": "5 min",
                "impact": "Váš malý dar zlepší život psům, kteří čekají na nový domov.",
                "action_link": CZECH_ORGANIZATIONS['animal_shelter'],
                "instructions": "Podívejte se na seznam potřeb konkrétního útulku a objednejte jim dar přímo na jejich adresu.",
                "category": "Zvířata"
            }
        ]
    else: # English actions
        return [
            {
                "title": "🌱 Gift a Tree to the Landscape",
                "description": "With a one-time donation, you help plant a tree where it's most needed in the Czech Republic.",
                "time": "2 min",
                "impact": "Every tree helps retain water in the landscape and cleans the air.",
                "action_link": CZECH_ORGANIZATIONS['tree_planting'],
                "instructions": "Click the link, choose an amount, and complete the donation. It's a simple way to leave a lasting legacy.",
                "category": "Nature"
            },
            {
                "title": "❤️ Brighten a Senior's Day with a Letter",
                "description": "Write an online letter and cheer up someone who feels lonely. Your time is the most precious gift.",
                "time": "15 min",
                "impact": "Your letter could be the highlight of someone's entire week.",
                "action_link": CZECH_ORGANIZATIONS['senior_letters'],
                "instructions": "Register on the portal, write a kind and personal letter (without sensitive data), and simply send it through the system.",
                "category": "Community"
            },
            {
                "title": "📚 Donate a Book to a Public Bookshelf",
                "description": "Give your read books a second life. Find the nearest 'knihobudka' (public bookshelf) and delight the next reader.",
                "time": "20 min",
                "impact": "One book can inspire or delight dozens of people.",
                "action_link": CZECH_ORGANIZATIONS['book_donations'],
                "instructions": "Find a public bookshelf on the map, pack the books you no longer need, and take them there.",
                "category": "Education"
            },
            {
                "title": "🥘 Buy a Warm Meal for a Person in Need",
                "description": "Easily pay for a warm meal for a person without a home. It's a small gift with enormous meaning.",
                "time": "3 min",
                "impact": "You provide someone with a basic certainty—a warm meal for the day.",
                "action_link": CZECH_ORGANIZATIONS['homeless_support'],
                "instructions": "Open the link, select the 'Donate a meal' option, and complete the payment. The meal will be distributed at the nearest help center.",
                "category": "Basic Needs"
            },
            {
                "title": "🎓 Dedicate 15 Minutes to Online Tutoring",
                "description": "Help a child struggling with their studies via a short video call. Your knowledge can change their day.",
                "time": "25 min",
                "impact": "A moment of your time can help a child overcome a school hurdle and gain confidence.",
                "action_link": CZECH_ORGANIZATIONS['online_tutoring'],
                "instructions": "Register as a volunteer, go through a quick intro, and join a tutoring session when you have time.",
                "category": "Education"
            },
            {
                "title": "🐕 Help a Shelter from Afar",
                "description": "Can't take an animal home but want to help? Donate pet food or toys for dogs easily online.",
                "time": "5 min",
                "impact": "Your small gift will improve the lives of dogs waiting for a new home.",
                "action_link": CZECH_ORGANIZATIONS['animal_shelter'],
                "instructions": "Look at the needs list of a specific shelter and order a gift for them directly to their address.",
                "category": "Animals"
            }
        ]

def _render_action_card(action, index, language):
    """Render an individual action card with improved UX and clearer CTAs."""
    
    impact_label = "Váš možný dopad" if language == 'czech' else "Your potential impact"
    
    with st.container():
        st.markdown(f"""
        <div class="action-card">
            <h4>{action['title']}</h4>
            <p style="margin: 0.5rem 0;">{action['description']}</p>
            <div style="margin: 1rem 0;">
                <span style="background: #E8F5E8; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem; margin-right: 0.5rem;">⏱️ {action['time']}</span>
                <span style="background: #E8F5E8; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">📍 Online</span>
                <span style="background: #E8F5E8; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">💪 {action['category']}</span>
            </div>
            <div style="background: #F0F8F0; padding: 0.75rem; border-radius: 8px; margin: 1rem 0; border-left: 3px solid #7AB87A;">
                <strong>{impact_label}:</strong> {action['impact']}
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    if st.button(
        get_text('start_action', language),
        key=f"start_{index}",
        type="primary",
        use_container_width=True
    ):
        st.success(f"🎉 Skvělá volba! Zde jsou další kroky pro '{action['title']}'")
        
        st.markdown(f"""
        <div style="background: #E8F5E8; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #7AB87A;">
            <strong>📋 {'Instrukce' if language == 'czech' else 'Instructions'}:</strong><br>
            {action['instructions']}
            
            <br><br><strong>🔗 {'Pokračujte zde' if language == 'czech' else 'Continue here'}:</strong><br>
            <a href="{action['action_link']}" target="_blank" style="color: #2E5D31; font-weight: 600;">{action['action_link']}</a>
        </div>
        """, unsafe_allow_html=True)
        
        action_data = {
            'category': action['category'],
            'time_minutes': _extract_time_minutes(action['time']),
            'cost_estimate': 0, 
            'source': 'quick_actions'
        }
        
        record_action_completion(action['title'], action_data, language)
        celebrate_action_completion(action['title'], action['category'], language)

def _extract_time_minutes(time_str):
    """Extract time in minutes from a more flexible time string."""
    time_minutes = 5  # Default
    time_match = re.search(r'(\d+)', time_str)
    if time_match:
        time_minutes = int(time_match.group(1))
        if 'hodin' in time_str or 'hour' in time_str:
            time_minutes *= 60
    return time_minutes 