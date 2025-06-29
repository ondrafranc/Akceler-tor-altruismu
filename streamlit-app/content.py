"""
Centralized Content Management for Akcelerátor Altruismu
All user-facing text content in one place for easy editing
"""

# ============================================================================
# JOURNEY FLOW CONTENT
# ============================================================================

JOURNEY_CONTENT = {
    'czech': {
        # Step 1: Welcome
        'welcome': {
            'title': '🌱 Vítejte',
            'subtitle': 'Jste tady, protože vám záleží na světě kolem vás.<br/>To je krásný začátek.',
            'journey_steps': {
                'title': '🧭 Vaše cesta v několika krocích',
                'steps': [
                    '**Pocity** - Jak se teď cítíte?',
                    '**Hodnoty** - Co vám je blízké?',
                    '**Akce** - Najdeme vám konkrétní krok',
                    '**Reflexe** - Jak to bylo?'
                ]
            },
            'start_button': '🌟 Začít mou cestu'
        },
        
        # Step 2: Emotional Check
        'emotional_check': {
            'title': 'Jak se právě teď cítíte?',
            'purpose_intro': 'Pomůže nám to doporučit vám ten nejvhodnější první krok.',
            'emotions': [
                ('overwhelmed', '😰 Zahlcen/a'),
                ('motivated', '💪 Motivován/a'),
                ('uncertain', '🤔 Nejistý/á'),
                ('hopeful', '🌟 Plný/á naděje'),
                ('lost', '😔 Ztracen/a')
            ],
            'thank_you': '💚 Děkujeme za sdílení',
            'continue_button': 'Pokračovat →'
        },
        
        # Step 3: Values Discovery
        'values_discovery': {
            'title': 'Co vám je blízké?',
            'subtitle': 'Vyberte 2-3 oblasti, které vás nejvíce oslovují. Pomůže nám to najít akce, které budou rezonovat s vaším srdcem.',
            'values': [
                ('environment', '🌍 Příroda a klima'),
                ('community', '🏘️ Komunita a sousedé'),
                ('education', '📚 Vzdělání a rozvoj'),
                ('health', '💚 Zdraví a pohoda'),
                ('poverty', '🤝 Pomoc potřebným'),
                ('elderly', '👴 Senioři'),
                ('children', '👶 Děti a mládež'),
                ('animals', '🐾 Zvířata')
            ],
            'guidance': {
                'none_selected': '🌸 Vezměte si čas... Co z toho vás nejvíce oslovuje?',
                'too_many': '💭 To je hodně oblastí! Možná se zkuste zaměřit na ty nejdůležitější?',
                'good_selection': '✨ Krásně! Vybrali jste {count} {area_word}.'
            },
            'continue_button': 'Pokračovat →',
            'min_selection_hint': 'Vyberte alespoň jednu oblast'
        },
        
        # Step 4: Action Selection
        'action_selection': {
            'title': 'Vaše doporučená akce',
            'sample_action': {
                'title': '🌟 Pomoc místní komunitě',
                'description': 'Najděte způsob, jak pomoci ve své lokalitě',
                'impact': 'Posílíte komunitu kolem sebe'
            },
            'start_button': '🚀 Začít tuto akci',
            'completion_message': '🎉 Gratulujeme! Udělali jste něco krásného!',
            'another_action_button': '🔄 Udělat další akci'
        },
        
        # Step headers and navigation
        'navigation': {
            'step_indicator': 'Krok {step} / 8',
            'back_button': '← Zpět',
            'continue_button': 'Pokračovat →'
        }
    },
    
    'english': {
        # Step 1: Welcome
        'welcome': {
            'title': '🌱 Welcome',
            'subtitle': 'You\'re here because you care about the world around you.<br/>That\'s a beautiful beginning.',
            'journey_steps': {
                'title': '🧭 Your journey in a few steps',
                'steps': [
                    '**Feelings** - How do you feel now?',
                    '**Values** - What\'s close to your heart?',
                    '**Action** - We\'ll find you a concrete step',
                    '**Reflection** - How was it?'
                ]
            },
            'start_button': '🌟 Start my journey'
        },
        
        # Step 2: Emotional Check
        'emotional_check': {
            'title': 'How do you feel right now?',
            'purpose_intro': 'This will help us recommend the most suitable first step for you.',
            'emotions': [
                ('overwhelmed', '😰 Overwhelmed'),
                ('motivated', '💪 Motivated'),
                ('uncertain', '🤔 Uncertain'),
                ('hopeful', '🌟 Full of hope'),
                ('lost', '😔 Lost')
            ],
            'thank_you': '💚 Thank you for sharing',
            'continue_button': 'Continue →'
        },
        
        # Step 3: Values Discovery
        'values_discovery': {
            'title': 'What\'s close to your heart?',
            'subtitle': 'Choose 2-3 areas that speak to you most. This will help us find actions that resonate with your heart.',
            'values': [
                ('environment', '🌍 Nature and climate'),
                ('community', '🏘️ Community and neighbors'),
                ('education', '📚 Education and development'),
                ('health', '💚 Health and wellbeing'),
                ('poverty', '🤝 Helping those in need'),
                ('elderly', '👴 Seniors'),
                ('children', '👶 Children and youth'),
                ('animals', '🐾 Animals')
            ],
            'guidance': {
                'none_selected': '🌸 Take your time... What speaks to you most?',
                'too_many': '💭 That\'s quite a few areas! Maybe try focusing on the most important ones?',
                'good_selection': '✨ Beautiful! You\'ve selected {count} area{plural}.'
            },
            'continue_button': 'Continue →',
            'min_selection_hint': 'Select at least one area'
        },
        
        # Step 4: Action Selection
        'action_selection': {
            'title': 'Your recommended action',
            'sample_action': {
                'title': '🌟 Help local community',
                'description': 'Find a way to help in your locality',
                'impact': 'You\'ll strengthen the community around you'
            },
            'start_button': '🚀 Start this action',
            'completion_message': '🎉 Congratulations! You did something beautiful!',
            'another_action_button': '🔄 Do another action'
        },
        
        # Step headers and navigation
        'navigation': {
            'step_indicator': 'Step {step} / 8',
            'back_button': '← Back',
            'continue_button': 'Continue →'
        }
    }
}

# ============================================================================
# EMOTIONAL RESPONSES
# ============================================================================

EMOTIONAL_RESPONSES = {
    'czech': {
        'overwhelmed': [
            'Je naprosto v pořádku cítit se takto. Ten pocit ukazuje, jak moc vám na světě záleží. Nemusíte ho zachránit, stačí najít jeden malý, zvládnutelný krok.',
            'Dýchjte. Jste na správném místě. Tento pocit zahlcení je prvním krokem k smysluplné akci. Pomůžeme vám ho proměnit v něco konkrétního a pozitivního.',
            'Víme, že je toho hodně. Ale právě proto jste tady. Společně najdeme cestu, jak vaši starost proměnit v malou, ale skutečnou pomoc, která vás nebude zahlcovat.'
        ],
        'motivated': [
            'To je fantastická energie! Vaše motivace je cenný zdroj. Pomůžeme vám ji nasměrovat co nejefektivněji, aby vaše pomoc měla skutečný dopad.',
            'Skvělá zpráva! Jste připraveni jednat. To je polovina úspěchu. Nyní společně najdeme tu druhou polovinu – správnou příležitost pro vás.',
            'Vaše odhodlání je nakažlivé. Využijme ho k nalezení akce, která vás nejen potěší, ale také reálně pomůže.'
        ],
        'uncertain': [
            'Nejistota je přirozená. Znamená to, že přemýšlíte a hledáte správnou cestu, místo abyste jednali bezhlavě. To je moudré.',
            'Je naprosto v pořádku nevědět, kde začít. Proto jsme tady. Jsme vaším průvodcem v této nejistotě. První krok uděláme společně.',
            'To, že jste tady i přes nejistotu, ukazuje vaši odvahu. Nemusíte mít hned jasno. Zvědavost a ochota zkusit jeden malý krok jsou dost.'
        ],
        'hopeful': [
            'Naděje je krásný a silný pocit. Je to základ každé pozitivní změny. Jsme tu, abychom vám pomohli ji proměnit v konkrétní činy.',
            'Vaše naděje je inspirující. Je to přesně ta energie, kterou svět potřebuje. Pojďme společně najít nejlepší místo pro její uplatnění.',
            'Skvělé, že máte naději. Držte se jí. Je to váš kompas. Nyní k ní přidáme mapu – konkrétní kroky, jak pomoci.'
        ],
        'lost': [
            'Cítit se ztracený je těžké, ale není to vaše chyba. Někdy se prostě nevíme, kam se obrátit.',
            'Je v pořádku nevědět, co dělat. Mnoho lidí se cítí stejně. Pomůžeme vám najít jeden malý krok.',
            'Ztracený pocit může být začátkem něčeho nového. Nemusíte mít plán, stačí být tady.'
        ]
    },
    
    'english': {
        'overwhelmed': [
            'It\'s completely okay to feel this way. That feeling shows how much you care. You don\'t have to save the world; you just have to find one small, manageable step.',
            'Breathe. You\'re in the right place. This feeling of being overwhelmed is the first step toward meaningful action. We\'ll help you turn it into something concrete and positive.',
            'We know there\'s a lot. That\'s why you\'re here. Together, we\'ll find a way to turn your concern into a small but real act of help that won\'t overwhelm you.'
        ],
        'motivated': [
            'That\'s fantastic energy! Your motivation is a precious resource. We\'ll help you direct it as effectively as possible so your help has a real impact.',
            'Excellent news! You are ready to act. That\'s half the battle won. Now, let\'s find the other half together—the right opportunity for you.',
            'Your determination is contagious. Let\'s use it to find an action that not only feels good to you but also genuinely helps.'
        ],
        'uncertain': [
            'Uncertainty is natural. It means you\'re being thoughtful and looking for the right path instead of acting recklessly. That\'s wise.',
            'It\'s perfectly fine not to know where to start. That\'s why we\'re here. We are your guide in this uncertainty. We\'ll take the first step together.',
            'The fact that you\'re here, despite the uncertainty, shows your courage. You don\'t need to have it all figured out. Curiosity and a willingness to try one small step are enough.'
        ],
        'hopeful': [
            'Hope is a beautiful and powerful feeling. It\'s the foundation of all positive change. We\'re here to help you turn it into concrete actions.',
            'Your hope is inspiring. It\'s exactly the energy the world needs. Let\'s find the best place to apply it together.',
            'It\'s wonderful that you feel hopeful. Hold onto that; it\'s your compass. Now, let\'s add a map to it—specific steps you can take to help.'
        ],
        'lost': [
            'Feeling lost is difficult, but it\'s not your fault. Sometimes we just don\'t know where to turn.',
            'It\'s okay not to know what to do. Many people feel the same way. We\'ll help you find one small step.',
            'Feeling lost can be the beginning of something new. You don\'t need a plan, just being here is enough.'
        ]
    }
}

# ============================================================================
# ENCOURAGEMENT MESSAGES
# ============================================================================

ENCOURAGEMENT_MESSAGES = {
    'czech': {
        'general': [
            'Každý krok má svůj smysl, i když ho nevidíte hned.',
            'Jste na cestě, kterou už prošli jiní před vámi.',
            'Malá rozhodnutí jako tohle tiše mění svět.',
            'Postupně se stáváte někým, kdo pomáhá.'
        ],
        'action_motivation': [
            'Tato akce může být něčím důležitým začátkem.',
            'Malé kroky často vytvářejí větší vlnky.',
            'Každá pomoc má svůj smysl a význam.',
            'Vaše rozhodnutí pomoci mluví o vašem charakteru.'
        ],
        'progress_encouragement': [
            'Každá akce, kterou uděláš, dokazuje, že jednotlivci mohou vytvářet změnu.',
            'Nepomáháš jen ostatním – stáváš se člověkem, kterým chceš být.',
            'Tvoje konzistence v pomáhání buduje lepší svět, akci za akcí.',
            'Ostatní lidé vidí tvůj příklad a inspiruje je to k akci. Jsi vůdce.'
        ]
    },
    
    'english': {
        'general': [
            'Every step has its meaning, even if you don\'t see it immediately.',
            'You\'re on a path others have walked before you.',
            'Small decisions like this quietly change the world.',
            'You\'re gradually becoming someone who helps.'
        ],
        'action_motivation': [
            'This action might become someone\'s important beginning.',
            'Small steps often create bigger ripples.',
            'Every help has its meaning and significance.',
            'Your decision to help speaks about your character.'
        ],
        'progress_encouragement': [
            'Every action you take proves that individuals can create change.',
            'You\'re not just helping others - you\'re becoming the person you want to be.',
            'Your consistency in helping is building a better world, one action at a time.',
            'Other people see your example and get inspired to act. You\'re a leader.'
        ]
    }
}

# ============================================================================
# CRISIS SUPPORT CONTENT
# ============================================================================

CRISIS_SUPPORT = {
    'czech': {
        'gentle_widget': {
            'title': 'Cítíte se přetíženi?',
            'subtitle': 'Nejste sami. Pomoc je vždy na dosah.',
            'help_label': 'Okamžitá pomoc:',
            'crisis_line': 'Linka důvěry: 116 111'
        },
        'comprehensive_help': {
            'title': 'Okamžité kroky v krizi',
            'safety_first': 'Bezpečnost především',
            'contact_help': 'Kontaktujte pomoc',
            'additional_resources': 'Další zdroje podpory',
            'immediate_actions': 'Co můžete udělat hned teď',
            'remember': 'Pamatujte si'
        }
    },
    
    'english': {
        'gentle_widget': {
            'title': 'Feeling overwhelmed?',
            'subtitle': 'You\'re not alone. Help is always within reach.',
            'help_label': 'Immediate help:',
            'crisis_line': 'Crisis line: 116 111'
        },
        'comprehensive_help': {
            'title': 'Immediate steps in crisis',
            'safety_first': 'Safety first',
            'contact_help': 'Contact help',
            'additional_resources': 'Additional support resources',
            'immediate_actions': 'What you can do right now',
            'remember': 'Remember'
        }
    }
}

# ============================================================================
# REFLECTION PROMPTS
# ============================================================================

REFLECTION_PROMPTS = {
    'czech': [
        'Jak se cítíte po tom, co jste udělali?',
        'Co vás na této akci nejvíc překvapilo?',
        'Na jaký dopad jste zatím nejhrdější?',
        'Jak se změnil váš pohled na to, jak dělat rozdíl?',
        'Co byste řekli někomu, kdo si myslí, že je příliš malý na to, aby něco změnil?'
    ],
    
    'english': [
        'How do you feel after what you did?',
        'What surprised you most about this action?',
        'What impact are you most proud of so far?',
        'How has your perspective on making a difference changed?',
        'What would you tell someone who feels too small to make an impact?'
    ]
}

# ============================================================================
# EMOTIONAL MICRO-INTERVENTIONS
# ============================================================================

EMOTIONAL_MICRO_INTERVENTIONS = {
    'czech': {
        'overwhelmed': {
            'pause_text': 'Zastavme se na chvilku...',
            'breathing_guide': 'Zkuste se teď pomalu nadechnout... a pomalu vydechnout. Ještě jednou.',
            'grounding_question': 'Jedna věc, kterou právě teď vidíte kolem sebe:',
            'gentle_transition': 'Jste v bezpečí. Půjdeme pomalu, krok za krokem.',
            'continue_when_ready': '🌱 Pokračovat, až budu připraven/a'
        },
        'motivated': {
            'pause_text': 'Ta energie je krásná...',
            'focus_guide': 'Zkusme ji teď nasměrovat tak, aby měla co největší smysl.',
            'grounding_question': 'Co vás k této motivaci přivedlo?',
            'gentle_transition': 'Společně najdeme způsob, jak tuto energii využít nejlépe.',
            'continue_when_ready': '✨ Pokračovat s touto energií'
        },
        'uncertain': {
            'pause_text': 'Nejistota je přirozená...',
            'acceptance_guide': 'Nemusíte mít hned všechno jasné. Stačí být zvědaví.',
            'grounding_question': 'Co vás přivedlo až sem, i přes nejistotu?',
            'gentle_transition': 'Jeden malý krok je dost. Nemusíme vidět celou cestu.',
            'continue_when_ready': '🤔 Pokračovat v průzkumu'
        },
        'hopeful': {
            'pause_text': 'Naděje je krásný pocit...',
            'nurturing_guide': 'Pojďme ji opatrně proměnit v něco konkrétního.',
            'grounding_question': 'Na co nejvíc doufáte?',
            'gentle_transition': 'Vaše naděje je kompas. Budeme ji následovat.',
            'continue_when_ready': '🌟 Pokračovat s nadějí'
        },
        'lost': {
            'pause_text': 'Cítit se ztracený je těžké...',
            'acceptance_guide': 'Není to vaše chyba. Někdy se prostě nevíme, kam se obrátit.',
            'grounding_question': 'Jedna věc, která vás dnes potěšila:',
            'gentle_transition': 'Nemusíte mít plán. Stačí udělat jeden malý krok.',
            'continue_when_ready': '🧭 Pokračovat pomalu'
        }
    },
    
    'english': {
        'overwhelmed': {
            'pause_text': 'Let\'s pause for a moment...',
            'breathing_guide': 'Try to breathe in slowly now... and breathe out slowly. Once more.',
            'grounding_question': 'One thing you can see around you right now:',
            'gentle_transition': 'You are safe. We\'ll go slowly, step by step.',
            'continue_when_ready': '🌱 Continue when I\'m ready'
        },
        'motivated': {
            'pause_text': 'That energy is beautiful...',
            'focus_guide': 'Let\'s now direct it so it has the greatest meaning.',
            'grounding_question': 'What brought you to this motivation?',
            'gentle_transition': 'Together we\'ll find the best way to use this energy.',
            'continue_when_ready': '✨ Continue with this energy'
        },
        'uncertain': {
            'pause_text': 'Uncertainty is natural...',
            'acceptance_guide': 'You don\'t need to have everything clear right away. It\'s enough to be curious.',
            'grounding_question': 'What brought you here, despite the uncertainty?',
            'gentle_transition': 'One small step is enough. We don\'t need to see the whole path.',
            'continue_when_ready': '🤔 Continue exploring'
        },
        'hopeful': {
            'pause_text': 'Hope is a beautiful feeling...',
            'nurturing_guide': 'Let\'s carefully turn it into something concrete.',
            'grounding_question': 'What do you hope for most?',
            'gentle_transition': 'Your hope is a compass. We\'ll follow it.',
            'continue_when_ready': '🌟 Continue with hope'
        },
        'lost': {
            'pause_text': 'Feeling lost is hard...',
            'acceptance_guide': 'It\'s not your fault. Sometimes we just don\'t know where to turn.',
            'grounding_question': 'One thing that brought you joy today:',
            'gentle_transition': 'You don\'t need a plan. Just taking one small step is enough.',
            'continue_when_ready': '🧭 Continue slowly'
        }
    }
}

# ============================================================================
# JOURNEY TRANSITIONS
# ============================================================================

JOURNEY_TRANSITIONS = {
    'czech': {
        'welcome_to_emotional': {
            'transition_text': 'Začneme jemně, u vašich pocitů...',
            'subtitle': 'Není to test. Je to jen způsob, jak vás lépe poznat.'
        },
        'emotional_to_values': {
            'transition_text': 'Teď, když víme, jak se cítíte...',
            'subtitle': 'Pojďme objevit, co vám je skutečně blízké.'
        },
        'values_to_action': {
            'transition_text': 'Krásně. Teď už víme, kam směřovat...',
            'subtitle': 'Najdeme vám něco konkrétního, co můžete udělat.'
        }
    },
    
    'english': {
        'welcome_to_emotional': {
            'transition_text': 'We\'ll start gently, with your feelings...',
            'subtitle': 'This isn\'t a test. It\'s just a way to get to know you better.'
        },
        'emotional_to_values': {
            'transition_text': 'Now that we know how you feel...',
            'subtitle': 'Let\'s discover what\'s truly close to your heart.'
        },
        'values_to_action': {
            'transition_text': 'Beautiful. Now we know where to direct our efforts...',
            'subtitle': 'We\'ll find you something concrete you can do.'
        }
    }
}

# ============================================================================
# ENHANCED VISUAL ELEMENTS
# ============================================================================

VISUAL_ELEMENTS = {
    'progress_indicators': {
        'czech': [
            '🌱 Začínáme',
            '💚 Naslouchání',
            '🎯 Objevování',
            '✨ Akce'
        ],
        'english': [
            '🌱 Starting',
            '💚 Listening', 
            '🎯 Discovering',
            '✨ Action'
        ]
    },
    
    'step_emotions': {
        'welcome': '🌱',
        'emotional_check': '💚',
        'values_discovery': '🎯',
        'action_selection': '✨'
    }
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_content(path: str, language: str = 'czech', **kwargs):
    """
    Get content from the centralized store
    
    Args:
        path: Dot-separated path like 'journey.welcome.title'
        language: 'czech' or 'english'
        **kwargs: Variables to format into the content
    
    Returns:
        Formatted content string
    """
    try:
        # Navigate through the content structure
        keys = path.split('.')
        content = globals()[keys[0].upper()]
        
        for key in keys[1:]:
            content = content[language][key] if language in content else content[key]
        
        # Format with provided variables
        if isinstance(content, str) and kwargs:
            return content.format(**kwargs)
        
        return content
        
    except (KeyError, TypeError):
        # Fallback to avoid crashes
        return f"[Content missing: {path}]"

def get_emotional_response(emotion_key: str, language: str = 'czech'):
    """Get a random emotional response"""
    import random
    responses = EMOTIONAL_RESPONSES.get(language, {}).get(emotion_key, [])
    return random.choice(responses) if responses else "Cítíme s vámi." if language == 'czech' else "We feel with you."

def get_encouragement(category: str = 'general', language: str = 'czech'):
    """Get a random encouragement message"""
    import random
    messages = ENCOURAGEMENT_MESSAGES.get(language, {}).get(category, [])
    return random.choice(messages) if messages else ""

def get_reflection_prompt(language: str = 'czech'):
    """Get a random reflection prompt"""
    import random
    prompts = REFLECTION_PROMPTS.get(language, [])
    return random.choice(prompts) if prompts else ""

def get_micro_intervention(emotion_key: str, language: str = 'czech'):
    """Get emotional micro-intervention content"""
    return EMOTIONAL_MICRO_INTERVENTIONS.get(language, {}).get(emotion_key, {})

def get_journey_transition(transition_key: str, language: str = 'czech'):
    """Get journey transition content"""
    return JOURNEY_TRANSITIONS.get(language, {}).get(transition_key, {})

def get_visual_element(element_key: str, language: str = 'czech'):
    """Get visual element content"""
    return VISUAL_ELEMENTS.get(element_key, {}).get(language, []) 