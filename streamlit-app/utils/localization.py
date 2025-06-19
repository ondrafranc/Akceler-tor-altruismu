"""Localization utilities for Czech and English support with comprehensive text management"""

def get_text(key, language='czech'):
    """Get localized text with comprehensive coverage for all UI elements"""
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
            
            # Actions and progress
            'actions_taken': 'Akce dokončeny',
            'time_contributed': 'Věnovaný čas',
            'money_donated': 'Darovaná částka',
            'start_action': 'Pustit se do toho',
            'complete_action': 'Dokončit na webu organizace',
            'take_assessment': 'Najít vaši cestu',
            'get_quick_help': 'Ukázat rychlou pomoc',
            'step': 'Krok',
            
            # Assessment encouragement
            'assessment_intro_encouragement': "Je skvělé, že jste tady. Udělat první krok je to nejdůležitější.",
            'assessment_values_encouragement': "Děkujeme, že to sdílíte. Vaše hodnoty jsou tím nejlepším kompasem.",
            'assessment_resources_encouragement': "Skoro hotovo. Teď se podívejme, jaké máte možnosti, abychom našli to pravé.",
            
            # Welcome page enhancements
            'welcome_back_named': "Vítejte zpět, {name}! Pokračujeme ve vaší cestě?",
            'welcome_back_generic': "Vítejte zpět! Pokračujeme tam, kde jste skončili?",
            'inactive_nudge': "Už je to chvíle, co jste byli aktivní. Možná je čas na další malý krok?",
            'emotional_fallback': "I když si nejste jistí svými pocity, můžeme najít způsob, jak pomoct.",
            
            # Assessment improvements
            'gentle_nudge_values': "Vyberte alespoň jednu hodnotu - pomůže nám to najít to pravé pro vás.",
            'gentle_nudge_resources': "Sdílení vašich možností nám pomůže najít realistické akce.",
            'save_come_back': "Uložit a vrátit se později",
            'inconsistent_check': "Vaše odpovědi se zdají být v rozporu. Chcete je ještě jednou projít?",
            
            # Quick actions enhancements
            'multiple_actions_celebration': "Wow! Jste dnes opravdu aktivní! Vaše energie inspiruje ostatní. 🌟",
            'no_actions_fit': "Nenašli jsme akci, která by vám sedla. Řekněte nám, co byste chtěli dělat!",
            'suggest_action': "Navrhnout akci",
            'tell_us_preference': "Řekněte nám, co vás zajímá",
            'keyboard_hint': "Tip: Použijte Tab pro navigaci a Enter pro výběr",
            
            # Impact page enhancements
            'long_streak_badge': "Neuvěřitelná série! {streak} dní v řadě! 🔥",
            'share_journey': "Sdílet vaši cestu",
            'download_journey': "Stáhnout souhrn vaší cesty",
            'inactive_gentle_nudge': "Už je to chvíle. Možná je čas na další malý krok?",
            'share_story': "Sdílet váš příběh",
            
            # Causes enhancements
            'explore_but_no_action': "Vidíme, že prozkoumáváte různé oblasti. Pojďme si společně vybrat něco konkrétního!",
            'pick_together': "Vybrat něco společně",
            'no_actions_cause': "V této oblasti zatím nejsou akce. Chcete navrhnout nějakou?",
            'suggest_cause_action': "Navrhnout akci pro tuto oblast",
            'notify_new_actions': "Upozornit na nové akce",
            
            # Crisis widget enhancements
            'crisis_guide': "Co dělat v krizi",
            'crisis_help_text': "Pokud jste v krizi, nejste sami. Zde jsou okamžité zdroje pomoci.",
            
            # Fallbacks and empty states
            'offline_help': "I když je aplikace offline, stále můžete pomoci!",
            'offline_action': "Zavolejte někomu, koho máte rádi, nebo napište dopis příteli.",
            'few_local_actions': "Ve vaší oblasti je málo akcí. Pomozte nám přidat více místních příležitostí!",
            'add_local_opportunities': "Přidat místní příležitosti",
            
            # Cultural and emotional elements
            'czech_proverb_help': "Jak se říká: 'Malé ryby také ryba.' I malá pomoc má veliký význam.",
            'mood_tracker': "Jak se cítíte teď?",
            'inspire_others': "Inspirovat ostatní",
            'distress_support': "Vidíme, že to může být těžké. Jste silnější, než si myslíte, a pomoc je na dosah.",
            
            # Accessibility
            'simple_mode': "Jednoduchý režim",
            'large_text': "Velký text",
            'screen_reader_hint': "Pro čtečky obrazovky: Tato stránka obsahuje interaktivní prvky pro výběr akcí pomoci.",
            'alt_tree_icon': "Ikona stromu",
            'alt_heart_icon': "Ikona srdce",
            'alt_book_icon': "Ikona knihy",
            
            # Navigation states
            'back_from_first': "Už jste na začátku! Odtud začíná vaše cesta k pomoci.",
            'skip_all_fallback': "Pojďme zkusit něco jednoduchého společně. Není třeba spěchat.",
            'long_inactive_nudge': "Už je to dlouho, co jste byli aktivní. Malý krok může udělat velký rozdíl.",
            
            # Success and completion
            'journey_complete': "Vaše cesta pokračuje! Každý krok má smysl.",
            'community_impact': "Jste součástí komunity, která mění svět k lepšímu.",
            'keep_going': "Pokračovat",
            
            # Error states
            'error_loading_causes': "Nepodařilo se načíst oblasti pomoci. Zkuste to prosím později.",
            'error_general': "Něco se pokazilo, ale nevzdávejte to! Zkuste to znovu.",
            'try_again': "Zkusit znovu",
            
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
            
            # Actions and progress
            'actions_taken': 'Actions Taken',
            'time_contributed': 'Time Contributed',
            'money_donated': 'Money Donated',
            'start_action': 'Let\'s do this',
            'complete_action': 'Complete on organization\'s site',
            'take_assessment': 'Find your path',
            'get_quick_help': 'Show me quick help',
            'step': 'Step',
            
            # Assessment encouragement
            'assessment_intro_encouragement': "It's wonderful that you're here. Taking the first step is the most important part.",
            'assessment_values_encouragement': "Thank you for sharing this. Your values are the best compass.",
            'assessment_resources_encouragement': "Almost done. Now let's see what your resources are, so we can find what's right for you.",
            
            # Welcome page enhancements
            'welcome_back_named': "Welcome back, {name}! Ready to continue your journey?",
            'welcome_back_generic': "Welcome back! Ready to continue where you left off?",
            'inactive_nudge': "It's been a while since you were active. Maybe it's time for another small step?",
            'emotional_fallback': "Even if you're unsure about your feelings, we can find a way to help.",
            
            # Assessment improvements
            'gentle_nudge_values': "Please select at least one value - it helps us find what's right for you.",
            'gentle_nudge_resources': "Sharing your resources helps us find realistic actions for you.",
            'save_come_back': "Save and come back later",
            'inconsistent_check': "Your answers seem to conflict. Would you like to review them?",
            
            # Quick actions enhancements
            'multiple_actions_celebration': "Wow! You're really active today! Your energy inspires others. 🌟",
            'no_actions_fit': "We couldn't find an action that fits you. Tell us what you'd like to do!",
            'suggest_action': "Suggest an action",
            'tell_us_preference': "Tell us what interests you",
            'keyboard_hint': "Tip: Use Tab to navigate and Enter to select",
            
            # Impact page enhancements
            'long_streak_badge': "Incredible streak! {streak} days in a row! 🔥",
            'share_journey': "Share your journey",
            'download_journey': "Download your journey summary",
            'inactive_gentle_nudge': "It's been a while. Maybe it's time for another small step?",
            'share_story': "Share your story",
            
            # Causes enhancements
            'explore_but_no_action': "We see you're exploring different areas. Let's pick something concrete together!",
            'pick_together': "Pick something together",
            'no_actions_cause': "This area doesn't have actions yet. Want to suggest one?",
            'suggest_cause_action': "Suggest an action for this area",
            'notify_new_actions': "Notify me of new actions",
            
            # Crisis widget enhancements
            'crisis_guide': "What to do in a crisis",
            'crisis_help_text': "If you're in crisis, you're not alone. Here are immediate help resources.",
            
            # Fallbacks and empty states
            'offline_help': "Even with the app offline, you can still help!",
            'offline_action': "Call someone you care about, or write a letter to a friend.",
            'few_local_actions': "Few actions in your area. Help us add more local opportunities!",
            'add_local_opportunities': "Add local opportunities",
            
            # Cultural and emotional elements
            'czech_proverb_help': "As they say: 'Small fish is also fish.' Even small help has great meaning.",
            'mood_tracker': "How are you feeling now?",
            'inspire_others': "Inspire others",
            'distress_support': "We see this might be difficult. You're stronger than you think, and help is within reach.",
            
            # Accessibility
            'simple_mode': "Simple mode",
            'large_text': "Large text",
            'screen_reader_hint': "For screen readers: This page contains interactive elements for selecting help actions.",
            'alt_tree_icon': "Tree icon",
            'alt_heart_icon': "Heart icon",
            'alt_book_icon': "Book icon",
            
            # Navigation states
            'back_from_first': "You're already at the beginning! This is where your journey to help starts.",
            'skip_all_fallback': "Let's try something simple together. No need to rush.",
            'long_inactive_nudge': "It's been a long time since you were active. A small step can make a big difference.",
            
            # Success and completion
            'journey_complete': "Your journey continues! Every step matters.",
            'community_impact': "You're part of a community changing the world for the better.",
            'keep_going': "Keep going",
            
            # Error states
            'error_loading_causes': "Couldn't load areas of impact. Please try again later.",
            'error_general': "Something went wrong, but don't give up! Try again.",
            'try_again': "Try again",
            
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
        }
    }
    return texts.get(language, texts['czech']).get(key, key)

def get_czech_proverb(context='general'):
    """Get contextual Czech proverbs and idioms"""
    proverbs = {
        'help': [
            "Malé ryby také ryba.",
            "Kapka za kapkou moře udělá.",
            "Dobrý skutek se neztratí."
        ],
        'start': [
            "I ta nejdelší cesta začíná prvním krokem.",
            "Začíná krásná cesta",
            "Kdo chce, hledá způsoby."
        ],
        'community': [
            "Jeden za všchny.",
            "V jednotě je síla."
        ],
        'persistence': [
            "Trpělivost růže přináší.",
            "Práce šlechtí člověka."
        ]
    }
    import random
    return random.choice(proverbs.get(context, proverbs['help']))

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