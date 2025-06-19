"""Localization utilities for Czech and English support"""

def get_text(key, language='czech'):
    """Get localized text"""
    texts = {
        'czech': {
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
            'actions_taken': 'Akce dokončeny',
            'time_contributed': 'Věnovaný čas',
            'money_donated': 'Darovaná částka',
            'start_action': 'Pustit se do toho',
            'complete_action': 'Dokončit na webu organizace',
            'take_assessment': 'Najít vaši cestu',
            'get_quick_help': 'Ukázat rychlou pomoc',
            'step': 'Krok',
            'assessment_intro_encouragement': "Je skvělé, že jste tady. Udělat první krok je to nejdůležitější.",
            'assessment_values_encouragement': "Děkujeme, že to sdílíte. Vaše hodnoty jsou tím nejlepším kompasem.",
            'assessment_resources_encouragement': "Skoro hotovo. Teď se podívejme, jaké máte možnosti, abychom našli to pravé.",
        },
        'english': {
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
            'actions_taken': 'Actions Taken',
            'time_contributed': 'Time Contributed',
            'money_donated': 'Money Donated',
            'start_action': 'Let\'s do this',
            'complete_action': 'Complete on organization\'s site',
            'take_assessment': 'Find your path',
            'get_quick_help': 'Show me quick help',
            'step': 'Step',
            'assessment_intro_encouragement': "It's wonderful that you're here. Taking the first step is the most important part.",
            'assessment_values_encouragement': "Thank you for sharing this. Your values are the best compass.",
            'assessment_resources_encouragement': "Almost done. Now let's see what your resources are, so we can find what's right for you.",
        }
    }
    return texts.get(language, texts['czech']).get(key, key) 