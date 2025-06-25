"""Encouragement and motivational messaging with authentic, trust-building language"""

import streamlit as st
import random
from datetime import datetime
from utils.localization import get_text, get_czech_proverb

def get_random_encouragement(context='general', language='czech'):
    """Get random encouragement message based on context with authentic language"""
    
    if language == 'czech':
        encouragements = {
            'general': [
                "Každý krok má svůj smysl, i když ho nevidíte hned.",
                "Jste na cestě, kterou už prošli jiní před vámi.",
                "Malá rozhodnutí jako tohle tiše mění svět.",
                "Postupně se stáváte někým, kdo pomáhá."
            ],
            'first_step_motivation': [
                "I jen to, že o pomoci přemýšlíte, má svůj význam.",
                "Každá cesta začíná prvním krokem.",
                "Nejste sami – mnoho lidí začalo stejně jako vy.",
                "Váš záměr pomoci už je něco krásného."
            ],
            'early_journey': [
                "Vidíme, že to myslíte vážně. To je inspirativní.",
                "Vaše kroky mají smysl, i když jsou malé.",
                "Pomoc se postupně stává součástí vašeho života.",
                "Každý váš krok může být pro někoho důležitý."
            ],
            'experienced_helper': [
                "Stáváte se někým, kdo skutečně mění svět k lepšímu.",
                "Vaše odhodlání je inspirativní pro ostatní.",
                "Jste součástí komunity lidí, kteří chtějí pomáhat.",
                "Vaše akce vytvářejí vlnky, které možná nevidíte."
            ],
            'action_motivation': [
                "Tato akce může být něčím důležitým začátkem.",
                "Malé kroky často vytvářejí větší vlnky.",
                "Každá pomoc má svůj smysl a význam.",
                "Vaše rozhodnutí pomoci mluví o vašem charakteru."
            ]
        }
    else:
        encouragements = {
            'general': [
                "Every step has its meaning, even if you don't see it immediately.",
                "You're on a path others have walked before you.",
                "Small decisions like this quietly change the world.",
                "You're gradually becoming someone who helps."
            ],
            'first_step_motivation': [
                "Even just thinking about helping has its meaning.",
                "Every journey begins with the first step.",
                "You're not alone – many people started just like you.",
                "Your intention to help is already something beautiful."
            ],
            'early_journey': [
                "We see you're serious about this. That's inspiring.",
                "Your steps have meaning, even when they're small.",
                "Help is gradually becoming part of your life.",
                "Each of your steps might be important for someone."
            ],
            'experienced_helper': [
                "You're becoming someone who truly changes the world for the better.",
                "Your dedication is inspiring to others.",
                "You're part of a community of people who want to help.",
                "Your actions create ripples you might not see."
            ],
            'action_motivation': [
                "This action might become someone's important beginning.",
                "Small steps often create bigger ripples.",
                "Every help has its meaning and significance.",
                "Your decision to help speaks about your character."
            ]
        }
    
    context_messages = encouragements.get(context, encouragements['general'])
    return random.choice(context_messages)

def get_seasonal_message(language='czech'):
    """Get seasonal encouragement message"""
    
    month = datetime.now().month
    
    if language == 'czech':
        seasonal_messages = {
            'spring': "Jaro je čas nových začátků. Možná je čas začít i vaši cestu pomoci.",
            'summer': "Léto přináší energii a světlo. Využijte ji k pozitivní změně.",
            'autumn': "Podzim nás učí, že změna může být krásná. Vaše pomoc také.",
            'winter': "I v zimě můžeme být světlem pro ostatní."
        }
    else:
        seasonal_messages = {
            'spring': "Spring is a time of new beginnings. Maybe it's time to start your helping journey too.",
            'summer': "Summer brings energy and light. Use it for positive change.",
            'autumn': "Autumn teaches us that change can be beautiful. So can your help.",
            'winter': "Even in winter, we can be light for others."
        }
    
    if month in [3, 4, 5]:
        season = 'spring'
    elif month in [6, 7, 8]:
        season = 'summer'
    elif month in [9, 10, 11]:
        season = 'autumn'
    else:
        season = 'winter'
    
    return seasonal_messages[season]

def get_emotional_response(emotion_key: str, language='czech') -> str:
    """Get authentic emotional response based on user's emotional state"""
    
    if language == 'czech':
        responses = {
            'nejisty': "Nejistota je úplně přirozená. Nikdo nemusí mít všechno vyřešené hned. Můžeme začít malými kroky.",
            'zahlcen': "Cítit se zahlcený je lidské. Svět má mnoho problémů, ale i malé kroky mají svůj smysl.",
            'motivovan': "Vaše motivace je krásná! Pojďme najít způsob, jak ji proměnit v konkrétní kroky.",
            'skepticky': "Váš skepticismus je cenný. Ukazuje, že myslíte kriticky. Můžeme najít pomoc, která dává smysl.",
            'nadsen': "Vaše nadšení je nádherné! Pojďme ho nasměrovat tam, kde bude mít největší význam.",
            'unaveny': "Únava často znamená, že se staráte. Najdeme něco malého, co vás nebude vyčerpávat.",
            'zvedavy': "Zvědavost je skvělý začátek! Prozkoumejme společně možnosti, které vás zaujmou."
        }
    else:
        responses = {
            'uncertain': "Uncertainty is completely natural. No one has to have everything figured out right away. We can start with small steps.",
            'overwhelmed': "Feeling overwhelmed is human. The world has many problems, but even small steps have their meaning.",
            'motivated': "Your motivation is beautiful! Let's find a way to turn it into concrete steps.",
            'skeptical': "Your skepticism is valuable. It shows you think critically. We can find help that makes sense.",
            'enthusiastic': "Your enthusiasm is wonderful! Let's direct it where it will have the greatest meaning.",
            'tired': "Tiredness often means you care. We'll find something small that won't exhaust you.",
            'curious': "Curiosity is a great start! Let's explore possibilities that interest you together."
        }
    
    return responses.get(emotion_key, responses.get('nejisty' if language == 'czech' else 'uncertain', ''))

def get_milestone_celebration(milestone_type: str, milestone_value: int, language='czech') -> str:
    """Get authentic celebration message for achieving milestones"""
    
    if language == 'czech':
        celebrations = {
            'first_action': "🎉 Gratulujeme k vaší první akci! Každá cesta začíná prvním krokem.",
            'actions_5': "🌟 Pět kroků dokončeno! Vaše pomoc už má svůj příběh.",
            'actions_10': "🔥 Deset kroků! Pomoc se stává součástí vašeho života.",
            'actions_25': "✨ Dvacet pět kroků! Vaše odhodlání je inspirativní.",
            'actions_50': "🏆 Padesát kroků! Jste skutečným pomocníkem!",
            'actions_100': "🎊 Sto kroků! Vaše cesta pomoci je nádherná!",
            'streak_7': "🔥 Týden v řadě! Budujete krásný návyk pomoci.",
            'streak_30': "🌟 Měsíc v řadě! Pomoc je už součástí vašeho života.",
            'time_10_hours': "⏰ Deset hodin věnovaných pomoci! Váš čas má smysl.",
            'money_100': "💰 První větší dar! Každá koruna má svůj příběh."
        }
    else:
        celebrations = {
            'first_action': "🎉 Congratulations on your first action! Every journey begins with the first step.",
            'actions_5': "🌟 Five steps completed! Your help already has its story.",
            'actions_10': "🔥 Ten steps! Help is becoming part of your life.",
            'actions_25': "✨ Twenty-five steps! Your dedication is inspiring.",
            'actions_50': "🏆 Fifty steps! You're a true helper!",
            'actions_100': "🎊 One hundred steps! Your helping journey is beautiful!",
            'streak_7': "🔥 A week in a row! You're building a beautiful habit of helping.",
            'streak_30': "🌟 A month in a row! Help is already part of your life.",
            'time_10_hours': "⏰ Ten hours dedicated to helping! Your time has meaning.",
            'money_100': "💰 First major donation! Every dollar has its story."
        }
    
    # Create specific celebration based on milestone
    if milestone_type == 'actions':
        if milestone_value == 1:
            key = 'first_action'
        elif milestone_value == 5:
            key = 'actions_5'
        elif milestone_value == 10:
            key = 'actions_10'
        elif milestone_value == 25:
            key = 'actions_25'
        elif milestone_value == 50:
            key = 'actions_50'
        elif milestone_value == 100:
            key = 'actions_100'
        else:
            key = 'actions_5'  # fallback
    elif milestone_type == 'streak':
        if milestone_value == 7:
            key = 'streak_7'
        elif milestone_value == 30:
            key = 'streak_30'
        else:
            key = 'streak_7'  # fallback
    elif milestone_type == 'time' and milestone_value >= 10:
        key = 'time_10_hours'
    elif milestone_type == 'money' and milestone_value >= 100:
        key = 'money_100'
    else:
        key = 'first_action'  # fallback
    
    return celebrations.get(key, celebrations['first_action']) 