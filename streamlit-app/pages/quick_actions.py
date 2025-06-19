"""Enhanced quick actions page with comprehensive user support and celebration features"""

import streamlit as st
import random
from datetime import datetime, timedelta
from utils.localization import get_text, get_accessibility_text
from logic.tracking import record_action_completion, get_user_streak, get_recent_actions
from logic.encouragement import celebrate_action_completion, get_streak_celebration, get_multi_action_celebration
from core.session import (track_page_visit, get_user_behavior_insights, 
                         track_action_pattern, check_action_fatigue,
                         record_user_feedback, get_accessibility_preferences)
from data.loaders import load_actions_data
from components.emergency_help import check_distress_indicators

def show_quick_actions_page():
    """Enhanced quick actions page with comprehensive user support"""
    language = st.session_state.language
    track_page_visit('quick_actions')
    
    # Get user insights and accessibility preferences
    behavior_insights = get_user_behavior_insights()
    accessibility_prefs = get_accessibility_preferences()
    
    st.markdown('<div class="content-container">', unsafe_allow_html=True)
    
    # Enhanced header with personalization
    _render_enhanced_header(language, behavior_insights)
    
    # Check for action fatigue and provide guidance
    fatigue_check = check_action_fatigue()
    if fatigue_check:
        _show_fatigue_guidance(language, fatigue_check)
    
    # Show streak and recent activity
    _show_activity_status(language)
    
    # Load and display actions with enhanced features
    actions_data = load_actions_data(language)
    if actions_data:
        # Filter actions based on user preferences and behavior
        filtered_actions = _filter_actions_for_user(actions_data, behavior_insights)
        
        if filtered_actions:
            _display_enhanced_actions(filtered_actions, language, accessibility_prefs)
        else:
            _show_no_actions_fallback(language)
    else:
        _show_data_error_fallback(language)
    
    # Show action suggestion option
    _show_action_suggestion_option(language)
    
    # Celebration and encouragement section
    _show_celebration_section(language, behavior_insights)
    
    st.markdown('</div>', unsafe_allow_html=True)

def _render_enhanced_header(language, behavior_insights):
    """Render enhanced header with personalization"""
    
    if language == 'czech':
        st.markdown("# ⚡ Rychlá pomoc")
        if behavior_insights.get('is_frequent_user'):
            st.markdown("*Vítejte zpět! Připraveni na další pozitivní krok?*")
        else:
            st.markdown("*Jednoduché akce, které můžete udělat hned teď*")
    else:
        st.markdown("# ⚡ Quick Help")
        if behavior_insights.get('is_frequent_user'):
            st.markdown("*Welcome back! Ready for another positive step?*")
        else:
            st.markdown("*Simple actions you can take right now*")
    
    # Show personalized encouragement
    if behavior_insights.get('completed_actions_today', 0) > 0:
        if language == 'czech':
            st.success(f"🌟 Už jste dnes dokončili {behavior_insights['completed_actions_today']} akcí. Skvělá práce!")
        else:
            st.success(f"🌟 You've already completed {behavior_insights['completed_actions_today']} actions today. Great work!")
    
    # Quick stats for motivation
    total_actions = st.session_state.total_impact.get('actions', 0)
    if total_actions > 0:
        if language == 'czech':
            st.info(f"📊 Celkem jste dokončili {total_actions} akcí pomoci")
        else:
            st.info(f"📊 You've completed {total_actions} helpful actions in total")

def _show_activity_status(language):
    """Show user's activity status and streak"""
    
    streak = get_user_streak()
    recent_actions = get_recent_actions(days=7)
    
    if streak > 1:
        if language == 'czech':
            st.markdown(f'<div class="streak-indicator">🔥 {streak} dní v řadě!</div>', unsafe_allow_html=True)
        else:
            st.markdown(f'<div class="streak-indicator">🔥 {streak} days in a row!</div>', unsafe_allow_html=True)
    
    # Show recent activity encouragement
    if recent_actions:
        if language == 'czech':
            st.caption(f"💚 Tento týden: {len(recent_actions)} akcí")
        else:
            st.caption(f"💚 This week: {len(recent_actions)} actions")

def _show_fatigue_guidance(language, fatigue_info):
    """Show guidance for users showing action fatigue"""
    
    if fatigue_info['level'] == 'high':
        if language == 'czech':
            st.warning("""
            💚 **Možná si zasloužíte pauzu.** Vypadá to, že jste udělali hodně práce. 
            Péče o sebe je také forma pomoci - světu pomáháte víc, když jste v pohodě.
            """)
            suggestion = "Možná zkuste dnes něco jednoduchého nebo si udělejte pauzu."
        else:
            st.warning("""
            💚 **Maybe you deserve a break.** It looks like you've done a lot of work. 
            Self-care is also a form of help - you help the world more when you're well.
            """)
            suggestion = "Maybe try something simple today or take a break."
        
        st.info(suggestion)
        
        # Offer self-care actions
        if st.button("🌿 Ukázat péči o sebe" if language == 'czech' else "🌿 Show self-care", use_container_width=True):
            _show_self_care_actions(language)

def _filter_actions_for_user(actions_data, behavior_insights):
    """Filter actions based on user behavior and preferences"""
    
    user_profile = st.session_state.user_profile
    filtered_actions = []
    
    for action_id, action_info in actions_data.items():
        # Skip if user has done this action recently
        if _user_did_action_recently(action_id):
            continue
        
        # Filter by time commitment
        time_commitment = user_profile.get('time_commitment', 'flexible')
        action_time = action_info.get('requirements', {}).get('time_minutes', 10)
        
        if time_commitment == 'minimal' and action_time > 15:
            continue
        elif time_commitment == 'moderate' and action_time > 60:
            continue
        
        # Filter by financial capacity
        financial_capacity = user_profile.get('financial_capacity', 'flexible')
        action_cost = action_info.get('requirements', {}).get('cost_usd', 0)
        
        if financial_capacity == 'none' and action_cost > 0:
            continue
        elif financial_capacity == 'small' and action_cost > 20:
            continue
        
        # Filter by involvement type
        involvement_type = user_profile.get('involvement_type', 'flexible')
        action_type = action_info.get('type', 'flexible')
        
        if involvement_type != 'flexible' and action_type != 'flexible' and involvement_type != action_type:
            continue
        
        # Add relevance score
        action_info['relevance_score'] = _calculate_action_relevance(action_info, user_profile, behavior_insights)
        filtered_actions.append((action_id, action_info))
    
    # Sort by relevance
    filtered_actions.sort(key=lambda x: x[1]['relevance_score'], reverse=True)
    
    return filtered_actions[:12]  # Show top 12 most relevant actions

def _calculate_action_relevance(action_info, user_profile, behavior_insights):
    """Calculate how relevant an action is for the user"""
    
    score = 0
    
    # Values alignment
    user_values = user_profile.get('values', [])
    action_values = action_info.get('values_alignment', [])
    values_match = len(set(user_values) & set(action_values))
    score += values_match * 10
    
    # Time preference match
    time_commitment = user_profile.get('time_commitment', 'moderate')
    action_time = action_info.get('requirements', {}).get('time_minutes', 10)
    
    if time_commitment == 'minimal' and action_time <= 15:
        score += 5
    elif time_commitment == 'moderate' and 15 < action_time <= 60:
        score += 5
    elif time_commitment in ['significant', 'major'] and action_time > 30:
        score += 5
    
    # Boost for trending/popular actions
    if action_info.get('is_trending'):
        score += 3
    
    # Boost for actions matching recent behavior
    if behavior_insights.get('prefers_online') and action_info.get('type') == 'online':
        score += 3
    elif behavior_insights.get('prefers_offline') and action_info.get('type') == 'offline':
        score += 3
    
    # Seasonal relevance
    current_month = datetime.now().month
    if action_info.get('seasonal_months') and current_month in action_info.get('seasonal_months', []):
        score += 2
    
    return score

def _display_enhanced_actions(filtered_actions, language, accessibility_prefs):
    """Display actions with enhanced accessibility and features"""
    
    if language == 'czech':
        st.markdown("### 🎯 Akce doporučené pro vás")
        st.caption("Vybráno na základě vašich hodnot a možností")
    else:
        st.markdown("### 🎯 Actions recommended for you")
        st.caption("Selected based on your values and capacity")
    
    # Create accessible grid layout
    cols_per_row = 2 if accessibility_prefs.get('simple_layout') else 3
    
    for i in range(0, len(filtered_actions), cols_per_row):
        cols = st.columns(cols_per_row)
        
        for j, col in enumerate(cols):
            if i + j < len(filtered_actions):
                action_id, action_info = filtered_actions[i + j]
                with col:
                    _render_enhanced_action_card(action_id, action_info, language, accessibility_prefs)

def _render_enhanced_action_card(action_id, action_info, language, accessibility_prefs):
    """Render an enhanced action card with accessibility features"""
    
    title = action_info.get('title', 'Unknown Action')
    description = action_info.get('description', 'No description available')
    requirements = action_info.get('requirements', {})
    organization = action_info.get('organization', {})
    
    # Calculate display values
    time_minutes = requirements.get('time_minutes', 5)
    cost_usd = requirements.get('cost_usd', 0)
    
    if language == 'czech':
        cost_czk = cost_usd * 25
        time_text = f"⏰ {time_minutes} min"
        cost_text = f"💰 {int(cost_czk)} Kč" if cost_usd > 0 else "💰 Zdarma"
        impact_text = action_info.get('impact_description_czech', 'Pozitivní dopad')
    else:
        time_text = f"⏰ {time_minutes} min"
        cost_text = f"💰 ${cost_usd}" if cost_usd > 0 else "💰 Free"
        impact_text = action_info.get('impact_description', 'Positive impact')
    
    # Enhanced card with accessibility
    card_class = "action-card"
    if accessibility_prefs.get('high_contrast'):
        card_class += " high-contrast"
    if accessibility_prefs.get('large_text'):
        card_class += " large-text"
    
    # Render card
    st.markdown(f"""
    <div class="{card_class}" role="article" aria-label="{get_accessibility_text('action_card', language)} {title}">
        <h4 style="margin-bottom: 0.5rem;">{title}</h4>
        <p style="margin: 0.5rem 0; font-size: 0.9rem; line-height: 1.4;">{description}</p>
        <div style="margin: 1rem 0;">
            <span style="background: #E8F5E8; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem; margin-right: 0.5rem;">{time_text}</span>
            <span style="background: #E8F5E8; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">{cost_text}</span>
        </div>
        <p style="font-size: 0.8rem; color: #5A6B5A; font-style: italic;">💫 {impact_text}</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Enhanced action button with accessibility
    button_key = f"action_{action_id}_{random.randint(1000, 9999)}"
    button_text = get_text('start_action', language)
    
    if st.button(
        f"🚀 {button_text}",
        key=button_key,
        type="primary",
        use_container_width=True,
        help=f"Spustit akci: {title}" if language == 'czech' else f"Start action: {title}"
    ):
        _handle_action_completion(action_id, action_info, language)

def _handle_action_completion(action_id, action_info, language):
    """Handle action completion with enhanced tracking and celebration"""
    
    # Record the action
    action_data = {
        'category': action_info.get('category', 'quick_action'),
        'time_minutes': action_info.get('requirements', {}).get('time_minutes', 5),
        'cost_estimate': action_info.get('requirements', {}).get('cost_usd', 0),
        'source': 'quick_actions',
        'relevance_score': action_info.get('relevance_score', 0)
    }
    
    record_action_completion(action_info.get('title', 'Unknown Action'), action_data, language)
    track_action_pattern(action_id, 'quick_action')
    
    # Check for multiple actions in session and celebrate accordingly
    session_actions = st.session_state.get('session_actions_count', 0) + 1
    st.session_state.session_actions_count = session_actions
    
    if session_actions >= 3:
        # Special celebration for multiple actions
        celebration_msg = get_multi_action_celebration(session_actions, language)
        st.markdown(f'<div class="celebration">{celebration_msg}</div>', unsafe_allow_html=True)
        
        # Offer to share journey or take a break
        _show_multi_action_options(language, session_actions)
    else:
        # Regular celebration
        celebrate_action_completion(action_info.get('title', 'this action'), 
                                  action_info.get('category', 'helping'), language)
    
    # Check for streak achievements
    streak = get_user_streak()
    if streak > 1:
        streak_msg = get_streak_celebration(streak, language)
        if streak_msg:
            st.success(f"🔥 {streak_msg}")
    
    # Handle organization link
    org_website = action_info.get('organization', {}).get('website')
    if org_website and org_website != '#':
        complete_text = get_text('complete_action', language)
        st.success(f"✨ [{complete_text}]({org_website})")
        
        # Track click-through
        if st.button("📊 Označit jako dokončené" if language == 'czech' else "📊 Mark as completed"):
            st.session_state.total_impact['actions'] += 1
            st.balloons()
    else:
        if language == 'czech':
            st.info("🔧 Tato akce je v přípravě. Děkujeme za váš zájem!")
        else:
            st.info("🔧 This action is in preparation. Thank you for your interest!")

def _show_multi_action_options(language, action_count):
    """Show options after completing multiple actions"""
    
    if language == 'czech':
        st.markdown(f"### 🌟 Úžasné! {action_count} akcí v jednom sezení!")
        st.markdown("Co teď?")
    else:
        st.markdown(f"### 🌟 Amazing! {action_count} actions in one session!")
        st.markdown("What now?")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📖 Sdílet můj příběh" if language == 'czech' else "📖 Share my story", use_container_width=True):
            _show_story_sharing_modal(language, action_count)
    
    with col2:
        if st.button("🏆 Získat odznak" if language == 'czech' else "🏆 Earn badge", use_container_width=True):
            _show_badge_modal(language, action_count)
    
    with col3:
        if st.button("☕ Udělat si pauzu" if language == 'czech' else "☕ Take a break", use_container_width=True):
            _show_break_suggestion(language)

def _show_no_actions_fallback(language):
    """Show fallback when no actions match user preferences"""
    
    if language == 'czech':
        st.info("""
        🤔 **Momentálně nemáme akce, které by přesně seděly vašim preferencím.**
        
        To se stává! Můžete:
        """)
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("💡 Navrhnout akci", use_container_width=True):
                _show_action_suggestion_form(language)
        with col2:
            if st.button("🔄 Zobrazit všechny akce", use_container_width=True):
                st.session_state.show_all_actions = True
                st.rerun()
    else:
        st.info("""
        🤔 **We don't currently have actions that exactly match your preferences.**
        
        This happens! You can:
        """)
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("💡 Suggest an action", use_container_width=True):
                _show_action_suggestion_form(language)
        with col2:
            if st.button("🔄 Show all actions", use_container_width=True):
                st.session_state.show_all_actions = True
                st.rerun()

def _show_data_error_fallback(language):
    """Show fallback when data fails to load"""
    
    if language == 'czech':
        st.error("😔 Omlouváme se, nepodařilo se načíst akce.")
        st.markdown("""
        ### 💚 Ale stále můžete pomoci!
        
        Zde jsou jednoduché akce, které můžete udělat offline:
        
        - 📞 Zavolejte někomu blízkému
        - 🚶 Pomozte sousedovi s nákupem
        - 🌱 Zasaďte rostlinu nebo se postarejte o existující
        - 📚 Darujte knihy místní knihovně
        - ♻️ Roztřiďte odpad navíc
        - 😊 Usmějte se na cizince
        """)
    else:
        st.error("😔 Sorry, we couldn't load the actions.")
        st.markdown("""
        ### 💚 But you can still help!
        
        Here are simple actions you can do offline:
        
        - 📞 Call someone close to you
        - 🚶 Help a neighbor with shopping
        - 🌱 Plant something or care for existing plants
        - 📚 Donate books to local library
        - ♻️ Sort extra recycling
        - 😊 Smile at a stranger
        """)

def _show_action_suggestion_option(language):
    """Show option to suggest new actions"""
    
    with st.expander("💡 Navrhnout novou akci" if language == 'czech' else "💡 Suggest new action", expanded=False):
        _show_action_suggestion_form(language)

def _show_action_suggestion_form(language):
    """Show form for suggesting new actions"""
    
    if language == 'czech':
        st.markdown("**Máte nápad na akci, kterou bychom měli přidat?**")
        
        action_title = st.text_input("Název akce:", placeholder="Např. Darování knih místní knihovně")
        action_description = st.text_area("Popis akce:", placeholder="Krátký popis toho, co akce obnáší...")
        action_time = st.slider("Odhadovaný čas (minuty):", 1, 120, 15)
        action_cost = st.slider("Odhadované náklady (Kč):", 0, 1000, 0)
        
        if st.button("📤 Odeslat návrh", type="primary"):
            suggestion_data = {
                'title': action_title,
                'description': action_description,
                'time_estimate': action_time,
                'cost_estimate': action_cost,
                'language': language,
                'timestamp': datetime.now().isoformat()
            }
            
            record_user_feedback('action_suggestion', suggestion_data)
            st.success("🙏 Děkujeme za váš návrh! Přezkoumáme ho a možná ho přidáme.")
    else:
        st.markdown("**Have an idea for an action we should add?**")
        
        action_title = st.text_input("Action title:", placeholder="E.g., Donate books to local library")
        action_description = st.text_area("Action description:", placeholder="Brief description of what the action involves...")
        action_time = st.slider("Estimated time (minutes):", 1, 120, 15)
        action_cost = st.slider("Estimated cost ($):", 0, 50, 0)
        
        if st.button("📤 Submit suggestion", type="primary"):
            suggestion_data = {
                'title': action_title,
                'description': action_description,
                'time_estimate': action_time,
                'cost_estimate': action_cost,
                'language': language,
                'timestamp': datetime.now().isoformat()
            }
            
            record_user_feedback('action_suggestion', suggestion_data)
            st.success("🙏 Thank you for your suggestion! We'll review it and possibly add it.")

def _show_celebration_section(language, behavior_insights):
    """Show celebration and encouragement section"""
    
    # Show celebrations for recent achievements
    recent_actions = get_recent_actions(days=1)
    if recent_actions:
        if language == 'czech':
            st.markdown("### 🎉 Vaše dnešní úspěchy")
        else:
            st.markdown("### 🎉 Your today's achievements")
        
        for action in recent_actions[-3:]:  # Show last 3
            action_time = action.get('completed_at', datetime.now())
            if isinstance(action_time, str):
                action_time = datetime.fromisoformat(action_time)
            
            time_ago = datetime.now() - action_time
            if time_ago.total_seconds() < 3600:  # Less than 1 hour
                minutes_ago = int(time_ago.total_seconds() / 60)
                time_text = f"před {minutes_ago} minutami" if language == 'czech' else f"{minutes_ago} minutes ago"
            else:
                hours_ago = int(time_ago.total_seconds() / 3600)
                time_text = f"před {hours_ago} hodinami" if language == 'czech' else f"{hours_ago} hours ago"
            
            st.markdown(f'<div class="quiet-celebration">✅ {action.get("title", "Action")} • {time_text}</div>', unsafe_allow_html=True)

def _show_story_sharing_modal(language, action_count):
    """Show modal for sharing user's story"""
    
    if language == 'czech':
        st.markdown(f"""
        ### 📖 Váš příběh pomoci
        
        Dnes jste dokončili {action_count} akcí! To je úžasné.
        
        **Váš dopad:**
        - ✅ {action_count} pozitivních kroků
        - 🌟 Čas věnovaný pomoci: ~{action_count * 10} minut
        - 💚 Jste příkladem pro ostatní
        
        Chcete inspirovat ostatní? Sdílejte svůj příběh!
        """)
    else:
        st.markdown(f"""
        ### 📖 Your helping story
        
        You completed {action_count} actions today! That's amazing.
        
        **Your impact:**
        - ✅ {action_count} positive steps
        - 🌟 Time spent helping: ~{action_count * 10} minutes
        - 💚 You're an example for others
        
        Want to inspire others? Share your story!
        """)

def _show_badge_modal(language, action_count):
    """Show badge earning modal"""
    
    badges = {
        3: ("🌱", "Začátečník" if language == 'czech' else "Beginner"),
        5: ("🌿", "Pomocník" if language == 'czech' else "Helper"),
        10: ("🌳", "Aktivista" if language == 'czech' else "Activist")
    }
    
    earned_badge = None
    for threshold, (emoji, name) in badges.items():
        if action_count >= threshold:
            earned_badge = (emoji, name)
    
    if earned_badge:
        emoji, name = earned_badge
        if language == 'czech':
            st.markdown(f"""
            ### 🏆 Gratulujeme!
            
            Získali jste odznak: **{emoji} {name}**
            
            Dokončili jste {action_count} akcí a ukázali, že vám na světě záleží.
            """)
        else:
            st.markdown(f"""
            ### 🏆 Congratulations!
            
            You earned the badge: **{emoji} {name}**
            
            You completed {action_count} actions and showed you care about the world.
            """)

def _show_break_suggestion(language):
    """Show break suggestion after intensive activity"""
    
    if language == 'czech':
        st.markdown("""
        ### ☕ Čas na pauzu
        
        Udělali jste skvělou práci! Péče o sebe je také důležitá.
        
        **Návrhy na odpočinek:**
        - 🫖 Udělejte si čaj nebo kávu
        - 🚶 Jděte na krátkou procházku
        - 🧘 Zkuste pár minut meditace
        - 📱 Zavolejte někomu blízkému
        - 📚 Přečtěte si něco inspirativního
        
        Vrátíte-li se později, budeme tu pro vás!
        """)
    else:
        st.markdown("""
        ### ☕ Time for a break
        
        You've done great work! Self-care is important too.
        
        **Rest suggestions:**
        - 🫖 Make tea or coffee
        - 🚶 Take a short walk
        - 🧘 Try a few minutes of meditation
        - 📱 Call someone close
        - 📚 Read something inspiring
        
        When you come back later, we'll be here for you!
        """)

def _show_self_care_actions(language):
    """Show self-care focused actions"""
    
    if language == 'czech':
        self_care_actions = [
            "🫖 Udělejte si oblíbený nápoj a vychutnejte si ho pomalu",
            "🌱 Zalévejte rostliny nebo se podívejte na něco zeleného",
            "📱 Napište zprávu někomu, koho máte rádi",
            "🧘 Zhluboka dýchejte 5x (4 vteřiny nádech, 6 výdech)",
            "📝 Napište si 3 věci, za které jste dnes vděční",
            "🎵 Pusťte si oblíbenou písničku",
            "🚶 Udělejte si 5minutovou přestávku venku"
        ]
        st.markdown("### 💚 Péče o sebe")
    else:
        self_care_actions = [
            "🫖 Make your favorite drink and savor it slowly",
            "🌱 Water plants or look at something green",
            "📱 Text someone you care about",
            "🧘 Take 5 deep breaths (4 seconds in, 6 out)",
            "📝 Write down 3 things you're grateful for today",
            "🎵 Play your favorite song",
            "🚶 Take a 5-minute break outside"
        ]
        st.markdown("### 💚 Self-care")
    
    for action in self_care_actions:
        st.markdown(f"- {action}")

def _user_did_action_recently(action_id, days=7):
    """Check if user completed this action recently"""
    recent_actions = get_recent_actions(days)
    return any(action.get('action_id') == action_id for action in recent_actions) 