"""Localization utilities for Czech and English support"""

def get_text(key, language='czech'):
    """Get localized text"""
    texts = {
        'czech': {
            'title': '🇨🇿 Akcelerátor altruismu',
            'subtitle': 'Praktické kroky k pomoci druhým',
            'welcome': 'Vítejte',
            'find_path': 'Najít cestu',
            'quick_actions': 'Rychlé akce',
            'my_impact': 'Můj dopad',
            'explore_causes': 'Prozkoumat oblasti',
            'language': 'Jazyk',
            'czech': 'Čeština',
            'english': 'English',
            'actions_taken': 'Provedené akce',
            'time_contributed': 'Čas přispěný',
            'money_donated': 'Darováno',
            'start_action': 'Začít',
            'complete_action': 'Dokončit akci',
            'take_assessment': 'Projít posouzením',
            'get_quick_help': 'Rychlá pomoc',
            'step': 'Krok',
            'assessment_intro_encouragement': "Skvělé, že jste tady! První krok je nejdůležitější.",
            'assessment_values_encouragement': "Děkujeme za sdílení. Vaše hodnoty jsou skvělým kompasem.",
            'assessment_resources_encouragement': "Téměř hotovo! Teď se podívejme, jaké máte možnosti.",
        },
        'english': {
            'title': '🌱 Altruism Accelerator',
            'subtitle': 'Transform overwhelm into meaningful action',
            'welcome': 'Welcome',
            'find_path': 'Find Your Path',
            'quick_actions': 'Quick Actions',
            'my_impact': 'My Impact',
            'explore_causes': 'Explore Causes',
            'language': 'Language',
            'czech': 'Čeština',
            'english': 'English',
            'actions_taken': 'Actions Taken',
            'time_contributed': 'Time Contributed',
            'money_donated': 'Money Donated',
            'start_action': 'Start This',
            'complete_action': 'Complete Action',
            'take_assessment': 'Take Assessment',
            'get_quick_help': 'Get Quick Help',
            'step': 'Step',
            'assessment_intro_encouragement': "It's great that you're here! The first step is the most important.",
            'assessment_values_encouragement': "Thank you for sharing. Your values are an excellent compass.",
            'assessment_resources_encouragement': "Almost there! Now let's look at what resources you have.",
        }
    }
    return texts.get(language, texts['czech']).get(key, key) 