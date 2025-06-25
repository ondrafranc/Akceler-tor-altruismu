"""Localization utilities for Czech and English support with authentic, trust-building language"""

def get_text(key, language='czech'):
    """Get localized text with authentic, culturally grounded language that builds trust"""
    texts = {
        'czech': {
            # Core navigation
            'title': '🇨🇿 Akcelerátor altruismu',
            'subtitle': 'Měníme bezmoc v konkrétní pomoc',
            'welcome': 'Úvod',
            'find_path': 'Vaše cesta',
            'quick_actions': 'Rychlá pomoc',
            'my_impact': 'Váš dopad',
            'explore_causes': 'Oblasti pomoci',
            'language': 'Jazyk',
            'czech': 'Čeština',
            'english': 'English',
            
            # Navigation help
            'need_help': 'Potřebujete pomoc?',
            'how_it_works': 'Jak to funguje?',
            'contact_feedback': 'Kontakt a zpětná vazba',
            'help_guide': 'Průvodce aplikací',
            
            # Actions and progress - Authentic language
            'actions_taken': 'Kroky, které jste udělali',
            'time_contributed': 'Čas, který jste věnovali',
            'money_donated': 'Darovaná částka',
            'start_action': 'Pustit se do toho',
            'complete_action': 'Pokračovat na webu organizace',
            'take_assessment': 'Najít vaši cestu',
            'get_quick_help': 'Ukázat rychlou pomoc',
            'step': 'Krok',
            
            # Authentic impact language - No false claims
            'potential_impact': 'Tato akce může být něčím důležitým začátkem',
            'ripple_effect': 'Malé kroky často vytvářejí větší vlnky',
            'path_of_help': 'Jste na cestě, kterou prošli i jiní před vámi',
            'meaningful_step': 'Každý krok má svůj smysl, i když ho nevidíte hned',
            'quiet_change': 'Malá rozhodnutí jako toto tiše mění svět',
            'becoming_helper': 'Postupně se stáváte někým, kdo pomáhá',
            
            # Assessment encouragement - Honest and warm
            'assessment_intro_encouragement': "Je krásné, že jste tady. Už jen to, že o pomoci přemýšlíte, je důležité.",
            'assessment_values_encouragement': "Děkujeme za důvěru. Vaše hodnoty jsou nejlepším kompasem pro cestu dopředu.",
            'assessment_resources_encouragement': "Skoro jsme u konce. Teď najdeme něco, co vám bude sedět a co zvládnete.",
            
            # Welcome page - Authentic greetings
            'welcome_back_named': "Vítejte zpět, {name}! Jak se dnes cítíte?",
            'welcome_back_generic': "Vítejte zpět! Pamatujeme si, kde jste skončili.",
            'inactive_nudge': "Už je to chvíle. Možná je čas na další malý krok, když máte náladu?",
            'emotional_fallback': "I když si nejste jistí svými pocity, můžeme společně najít cestu vpřed.",
            
            # Assessment - Gentle guidance
            'gentle_nudge_values': "Pomůže nám, když vyberete alespoň jednu hodnotu, která vás oslovuje.",
            'gentle_nudge_resources': "Když nám řeknete, co máte k dispozici, najdeme něco realistického.",
            'save_come_back': "Uložit a vrátit se později",
            'inconsistent_check': "Vaše odpovědi se zdají být trochu v rozporu. Chcete je projít znovu?",
            
            # Quick actions - Honest encouragement
            'multiple_actions_celebration': "Vidíme, že jste dnes aktivní! Vaše energie může inspirovat i ostatní. 🌟",
            'no_actions_fit': "Nenašli jsme akci, která by vám úplně sedla. Co byste chtěli dělat?",
            'suggest_action': "Navrhnout akci",
            'tell_us_preference': "Řekněte nám, co vás zajímá",
            'keyboard_hint': "Tip: Použijte Tab pro navigaci a Enter pro výběr",
            
            # Impact page - Honest reflection
            'long_streak_badge': "Úžasná vytrvalost! {streak} dní v řadě! 🔥",
            'share_journey': "Sdílet vaši cestu",
            'download_journey': "Stáhnout souhrn vaší cesty",
            'inactive_gentle_nudge': "Už je to chvíle. Možná je čas na další malý krok?",
            'share_story': "Sdílet váš příběh",
            'reflection_prompt': "Jak se cítíte po tom, co jste udělali?",
            'what_motivated': "Co vás k tomu vedlo?",
            'personal_meaning': "Co pro vás tahle akce znamenala?",
            
            # Causes - Honest exploration
            'explore_but_no_action': "Vidíme, že prozkoumáváte různé oblasti. Pojďme si společně vybrat něco konkrétního.",
            'pick_together': "Vybrat něco společně",
            'no_actions_cause': "V této oblasti zatím nejsou akce. Chcete nějakou navrhnout?",
            'suggest_cause_action': "Navrhnout akci pro tuto oblast",
            'notify_new_actions': "Upozornit na nové akce",
            
            # Crisis widget
            'crisis_guide': "Co dělat v krizi",
            'crisis_help_text': "Pokud jste v krizi, nejste sami. Zde jsou okamžité zdroje pomoci.",
            
            # Authentic fallbacks and empty states
            'offline_help': "I když aplikace nefunguje, stále můžete pomoci kolem sebe.",
            'offline_action': "Zavolejte někomu, koho máte rádi, nebo napište dopis příteli.",
            'few_local_actions': "Ve vaší oblasti je málo akcí. Pomozte nám přidat více místních příležitostí.",
            'add_local_opportunities': "Přidat místní příležitosti",
            'not_sure_fallback': "Nejste si jistí, co dál? Je to v pořádku. Pojďme to prozkoumat společně.",
            'even_thinking_helps': "I jen to, že o pomoci přemýšlíte, je dobrý první krok.",
            
            # Cultural and emotional elements - Authentic Czech wisdom
            'czech_proverb_help': "Říká se: 'Malé ryby také ryba.' I malá pomoc má svůj význam.",
            'mood_tracker': "Jak se právě teď cítíte?",
            'inspire_others': "Inspirovat ostatní",
            'distress_support': "Vidíme, že to může být těžké. Pomoc je na dosah a nejste sami.",
            'small_gestures_matter': "Takové malé gesta postupně mění svět k lepšímu.",
            'path_others_walked': "Jste na cestě, kterou už prošli jiní před vámi – a možná projdou znovu teď.",
            'quiet_impact': "Váš dopad je možná tichý, ale o to trvalejší.",
            
            # Accessibility
            'simple_mode': "Jednoduchý režim",
            'large_text': "Velký text",
            'screen_reader_hint': "Pro čtečky obrazovky: Tato stránka obsahuje interaktivní prvky pro výběr akcí pomoci.",
            'alt_tree_icon': "Ikona stromu",
            'alt_heart_icon': "Ikona srdce",
            'alt_book_icon': "Ikona knihy",
            
            # Navigation states - Gentle guidance
            'back_from_first': "Už jste na začátku! Odtud začíná vaše cesta k pomoci.",
            'skip_all_fallback': "Pojďme zkusit něco jednoduchého společně. Není třeba spěchat.",
            'long_inactive_nudge': "Už je to dlouho. Malý krok může udělat velký rozdíl.",
            'where_you_are': "Jste tady: {current_section}",
            'what_comes_next': "Co přijde dál: {next_step}",
            
            # Success and completion - Honest celebration
            'journey_continues': "Vaše cesta pokračuje! Každý krok má smysl.",
            'community_part': "Jste součástí komunity lidí, kteří chtějí pomáhat.",
            'keep_going': "Pokračovat",
            'action_completed_honest': "Dokončili jste akci. Jak se teď cítíte?",
            'turning_point': "Tahle akce se možná stane něčím zlomovým bodem.",
            'small_decision_big': "Malá rozhodnutí jako tohle tiše formují svět.",
            
            # Error states - Supportive
            'error_loading_causes': "Nepodařilo se načíst oblasti pomoci. Zkuste to prosím později.",
            'error_general': "Něco se pokazilo, ale nevzdávejte to! Zkuste to znovu.",
            'try_again': "Zkusit znovu",
            'technical_issues': "Máme technické potíže, ale vaše záměr je důležitý.",
            
            # Form validation
            'required_field': "Toto pole je povinné",
            'please_select': "Prosím vyberte alespoň jednu možnost",
            'form_incomplete': "Formulář není kompletní",
            
            # Time and date
            'today': "dnes",
            'yesterday': "včera",
            'days_ago': "před {days} dny",
            'hours_ago': "před {hours} hodinami",
            'minutes_ago': "před {minutes} minutami",
            
            # Honest impact language - No fake metrics
            'actions_story': "Vaše {count} {'akce' if count < 5 else 'akcí'} je začátkem příběhu",
            'time_investment': "Věnovali jste {time} času něčemu důležitému",
            'money_contribution': "Darovali jste {amount} – každá koruna má svůj příběh",
            'potential_reach': "Vaše akce se možná dotknou mnoha životů způsobem, který nevidíte",
            'ripple_metaphor': "Jako kamínek hozený do vody – vlnky se šíří dál",
            'meaningful_contribution': "Přispěli jste k něčemu většímu, než jste sami",
            'part_of_movement': "Jste součástí pohybu lidí, kteří chtějí změnu",
        },
        'english': {
            # Core navigation
            'title': '🌱 Altruism Accelerator',
            'subtitle': 'From feeling helpless to hopeful action',
            'welcome': 'Start Here',
            'find_path': 'Your Path',
            'quick_actions': 'Quick Help',
            'my_impact': 'Your Impact',
            'explore_causes': 'Areas of Impact',
            'language': 'Language',
            'czech': 'Čeština',
            'english': 'English',
            
            # Navigation help
            'need_help': 'Need help?',
            'how_it_works': 'How it works',
            'contact_feedback': 'Contact & Feedback',
            'help_guide': 'App Guide',
            
            # Actions and progress - Authentic language
            'actions_taken': 'Steps you\'ve taken',
            'time_contributed': 'Time you\'ve dedicated',
            'money_donated': 'Money donated',
            'start_action': 'Let\'s do this',
            'complete_action': 'Continue on organization\'s site',
            'take_assessment': 'Find your path',
            'get_quick_help': 'Show me quick help',
            'step': 'Step',
            
            # Authentic impact language - No false claims
            'potential_impact': 'This action might become someone\'s important beginning',
            'ripple_effect': 'Small steps often create bigger ripples',
            'path_of_help': 'You\'re on a path others have walked before you',
            'meaningful_step': 'Every step has its meaning, even if you don\'t see it immediately',
            'quiet_change': 'Small decisions like this quietly change the world',
            'becoming_helper': 'You\'re gradually becoming someone who helps',
            
            # Assessment encouragement - Honest and warm
            'assessment_intro_encouragement': "It's beautiful that you're here. Just thinking about helping is important.",
            'assessment_values_encouragement': "Thank you for your trust. Your values are the best compass for the path forward.",
            'assessment_resources_encouragement': "Almost done. Now let's find something that fits you and that you can handle.",
            
            # Welcome page - Authentic greetings
            'welcome_back_named': "Welcome back, {name}! How are you feeling today?",
            'welcome_back_generic': "Welcome back! We remember where you left off.",
            'inactive_nudge': "It's been a while. Maybe it's time for another small step, when you feel like it?",
            'emotional_fallback': "Even if you're unsure about your feelings, we can find a way forward together.",
            
            # Assessment - Gentle guidance
            'gentle_nudge_values': "It helps us when you select at least one value that speaks to you.",
            'gentle_nudge_resources': "When you tell us what you have available, we'll find something realistic.",
            'save_come_back': "Save and come back later",
            'inconsistent_check': "Your answers seem a bit conflicting. Would you like to review them?",
            
            # Quick actions - Honest encouragement
            'multiple_actions_celebration': "We see you're active today! Your energy might inspire others too. 🌟",
            'no_actions_fit': "We couldn't find an action that completely fits you. What would you like to do?",
            'suggest_action': "Suggest an action",
            'tell_us_preference': "Tell us what interests you",
            'keyboard_hint': "Tip: Use Tab to navigate and Enter to select",
            
            # Impact page - Honest reflection
            'long_streak_badge': "Amazing persistence! {streak} days in a row! 🔥",
            'share_journey': "Share your journey",
            'download_journey': "Download your journey summary",
            'inactive_gentle_nudge': "It's been a while. Maybe it's time for another small step?",
            'share_story': "Share your story",
            'reflection_prompt': "How do you feel after what you did?",
            'what_motivated': "What led you to this?",
            'personal_meaning': "What did this action mean to you?",
            
            # Causes - Honest exploration
            'explore_but_no_action': "We see you're exploring different areas. Let's pick something concrete together.",
            'pick_together': "Pick something together",
            'no_actions_cause': "This area doesn't have actions yet. Want to suggest one?",
            'suggest_cause_action': "Suggest an action for this area",
            'notify_new_actions': "Notify me of new actions",
            
            # Crisis widget
            'crisis_guide': "What to do in a crisis",
            'crisis_help_text': "If you're in crisis, you're not alone. Here are immediate help resources.",
            
            # Authentic fallbacks and empty states
            'offline_help': "Even when the app doesn't work, you can still help around you.",
            'offline_action': "Call someone you care about, or write a letter to a friend.",
            'few_local_actions': "Few actions in your area. Help us add more local opportunities.",
            'add_local_opportunities': "Add local opportunities",
            'not_sure_fallback': "Not sure what's next? That's okay. Let's explore together.",
            'even_thinking_helps': "Even just thinking about helping is a good first step.",
            
            # Cultural and emotional elements - Authentic wisdom
            'czech_proverb_help': "As they say: 'Small fish is also fish.' Even small help has its meaning.",
            'mood_tracker': "How are you feeling right now?",
            'inspire_others': "Inspire others",
            'distress_support': "We see this might be difficult. Help is within reach and you're not alone.",
            'small_gestures_matter': "Such small gestures gradually change the world for the better.",
            'path_others_walked': "You're on a path others have walked before you – and maybe will walk again now.",
            'quiet_impact': "Your impact might be quiet, but all the more lasting.",
            
            # Accessibility
            'simple_mode': "Simple mode",
            'large_text': "Large text",
            'screen_reader_hint': "For screen readers: This page contains interactive elements for selecting help actions.",
            'alt_tree_icon': "Tree icon",
            'alt_heart_icon': "Heart icon",
            'alt_book_icon': "Book icon",
            
            # Navigation states - Gentle guidance
            'back_from_first': "You're already at the beginning! This is where your journey to help starts.",
            'skip_all_fallback': "Let's try something simple together. No need to rush.",
            'long_inactive_nudge': "It's been a long time. A small step can make a big difference.",
            'where_you_are': "You are here: {current_section}",
            'what_comes_next': "What comes next: {next_step}",
            
            # Success and completion - Honest celebration
            'journey_continues': "Your journey continues! Every step matters.",
            'community_part': "You're part of a community of people who want to help.",
            'keep_going': "Keep going",
            'action_completed_honest': "You completed an action. How do you feel now?",
            'turning_point': "This action might become someone's turning point.",
            'small_decision_big': "Small decisions like this quietly shape the world.",
            
            # Error states - Supportive
            'error_loading_causes': "Couldn't load areas of impact. Please try again later.",
            'error_general': "Something went wrong, but don't give up! Try again.",
            'try_again': "Try again",
            'technical_issues': "We're having technical issues, but your intention is important.",
            
            # Form validation
            'required_field': "This field is required",
            'please_select': "Please select at least one option",
            'form_incomplete': "Form is incomplete",
            
            # Time and date
            'today': "today",
            'yesterday': "yesterday",
            'days_ago': "{days} days ago",
            'hours_ago': "{hours} hours ago",
            'minutes_ago': "{minutes} minutes ago",
            
            # Honest impact language - No fake metrics
            'actions_story': "Your {count} action{'s' if count != 1 else ''} is the beginning of a story",
            'time_investment': "You dedicated {time} to something important",
            'money_contribution': "You donated {amount} – every dollar has its story",
            'potential_reach': "Your actions might touch many lives in ways you don't see",
            'ripple_metaphor': "Like a stone thrown in water – the ripples spread further",
            'meaningful_contribution': "You contributed to something bigger than yourself",
            'part_of_movement': "You're part of a movement of people who want change",
        }
    }
    return texts.get(language, texts['czech']).get(key, key)

def get_czech_proverb(context='general'):
    """Get contextual Czech proverbs and authentic wisdom"""
    proverbs = {
        'help': [
            "Malé ryby také ryba.",
            "Kapka za kapkou moře udělá.",
            "Dobrý skutek se neztratí.",
            "Co můžeš udělat dnes, neodkládej na zítra."
        ],
        'start': [
            "I ta nejdelší cesta začíná prvním krokem.",
            "Kdo chce, hledá způsoby.",
            "Začátek je půlka všeho."
        ],
        'community': [
            "Jeden za všechny, všichni za jednoho.",
            "V jednotě je síla.",
            "Společně to zvládneme lépe."
        ],
        'persistence': [
            "Trpělivost růže přináší.",
            "Pomalu se chodí daleko.",
            "Cvičení dělá mistra."
        ],
        'impact': [
            "Malé činy, velké srdce.",
            "Co zasadíš, to sklidíš.",
            "Každý má svůj díl práce."
        ],
        'action': [
            "Čin je lepší než tisíc slov.",
            "Kdo nečeká, ten má.",
            "Práce šlechtí člověka."
        ]
    }
    import random
    return random.choice(proverbs.get(context, proverbs['help']))

def get_authentic_celebration(action_count, language='czech'):
    """Get authentic celebration messages without false impact claims"""
    
    if language == 'czech':
        if action_count == 1:
            return [
                "🌱 Úžasné! Udělali jste svůj první krok. Jak se cítíte?",
                "✨ Gratulujeme! Každá cesta začíná prvním krokem.",
                "🌟 Skvělé! Tohle může být začátek něčeho krásného.",
                "💚 Děkujeme! Už jen to, že jste začali, má svůj význam."
            ]
        elif action_count < 5:
            return [
                "🌿 Pokračujete! Vaše kroky mají smysl.",
                "✨ Krásně to rozjíždíte! Jak se při tom cítíte?",
                "🌟 Vidíme, že to myslíte vážně. To je inspirativní.",
                "💚 Vaše vytrvalost je krásná. Pokračujte ve svém tempu."
            ]
        else:
            return [
                "🌳 Už jste na krásné cestě! Co vás k tomu vede?",
                "⭐ Vaše odhodlání je inspirativní pro ostatní.",
                "🏆 Stáváte se někým, kdo skutečně pomáhá.",
                "💎 Vaše akce vytvářejí vlnky, které možná nevidíte."
            ]
    else:
        if action_count == 1:
            return [
                "🌱 Amazing! You took your first step. How does it feel?",
                "✨ Congratulations! Every journey begins with the first step.",
                "🌟 Great! This might be the beginning of something beautiful.",
                "💚 Thank you! Just starting has its own meaning."
            ]
        elif action_count < 5:
            return [
                "🌿 You're continuing! Your steps have meaning.",
                "✨ You're getting into it nicely! How does it feel?",
                "🌟 We see you're serious about this. That's inspiring.",
                "💚 Your persistence is beautiful. Continue at your own pace."
            ]
        else:
            return [
                "🌳 You're on a beautiful path! What drives you to this?",
                "⭐ Your dedication is inspiring to others.",
                "🏆 You're becoming someone who truly helps.",
                "💎 Your actions create ripples you might not see."
            ]

def get_reflection_questions(language='czech'):
    """Get thoughtful reflection questions instead of fake metrics"""
    
    if language == 'czech':
        return [
            "Jak se cítíte po tom, co jste udělali?",
            "Co vás k této akci vedlo?",
            "Co pro vás tahle akce znamenala?",
            "Překvapilo vás něco při této akci?",
            "Chtěli byste udělat něco podobného znovu?",
            "Co byste řekli příteli, který váhá, jestli začít?",
            "Jaký pocit máte teď, když je to za vámi?",
            "Co jste se o sobě dozvěděli?"
        ]
    else:
        return [
            "How do you feel after what you did?",
            "What led you to this action?",
            "What did this action mean to you?",
            "Did anything surprise you during this action?",
            "Would you like to do something similar again?",
            "What would you tell a friend who's hesitating to start?",
            "How do you feel now that it's behind you?",
            "What did you learn about yourself?"
        ]

def format_time_ago(minutes_ago, language='czech'):
    """Format time in a human-friendly way"""
    if minutes_ago < 1:
        return get_text('just_now', language) if language == 'czech' else "just now"
    elif minutes_ago < 60:
        return get_text('minutes_ago', language).format(minutes=int(minutes_ago))
    elif minutes_ago < 1440:  # 24 hours
        hours = int(minutes_ago / 60)
        return get_text('hours_ago', language).format(hours=hours)
    else:
        days = int(minutes_ago / 1440)
        if days == 1:
            return get_text('yesterday', language)
        else:
            return get_text('days_ago', language).format(days=days)

def get_accessibility_text(element_type, language='czech'):
    """Get accessibility-specific text for screen readers"""
    accessibility_texts = {
        'czech': {
            'button_action': "Tlačítko pro spuštění akce",
            'card_interactive': "Interaktivní karta, stiskněte Enter pro výběr",
            'navigation_tab': "Navigační záložka",
            'form_field': "Pole formuláře",
            'progress_indicator': "Indikátor postupu",
            'emergency_widget': "Widget nouzové pomoci",
            'language_switch': "Přepínač jazyka"
        },
        'english': {
            'button_action': "Button to start action",
            'card_interactive': "Interactive card, press Enter to select",
            'navigation_tab': "Navigation tab",
            'form_field': "Form field",
            'progress_indicator': "Progress indicator",
            'emergency_widget': "Emergency help widget",
            'language_switch': "Language switcher"
        }
    }
    return accessibility_texts.get(language, accessibility_texts['czech']).get(element_type, "") 