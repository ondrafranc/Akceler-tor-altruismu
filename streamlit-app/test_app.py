#!/usr/bin/env python3
"""
Simple test script for Enhanced Akcelerátor Altruismu
Tests core functionality without running Streamlit
"""

import sys
import json
from pathlib import Path

def test_data_loading():
    """Test that all data files load correctly"""
    print("🧪 Testing data loading...")
    
    try:
        # Test Czech encouragement data
        with open('data/czech/encouragement_czech.json', 'r', encoding='utf-8') as f:
            czech_data = json.load(f)
            assert 'welcome_messages' in czech_data
            assert 'emotional_state_responses' in czech_data
            print("✅ Czech encouragement data loads correctly")
        
        # Test Czech actions data
        with open('data/czech/actions_czech.json', 'r', encoding='utf-8') as f:
            actions_data = json.load(f)
            assert 'actions' in actions_data
            print("✅ Czech actions data loads correctly")
            
        # Test Czech causes data
        with open('data/czech/causes_czech.json', 'r', encoding='utf-8') as f:
            causes_data = json.load(f)
            assert 'causes' in causes_data
            print("✅ Czech causes data loads correctly")
            
        return True
        
    except Exception as e:
        print(f"❌ Data loading error: {e}")
        return False

def test_app_imports():
    """Test that app.py imports correctly"""
    print("🧪 Testing app imports...")
    
    try:
        # Add current directory to path
        sys.path.insert(0, str(Path.cwd()))
        
        # Import main functions
        from app import load_encouragement_data, get_text, get_random_encouragement
        
        # Test basic functions
        encouragement_data = load_encouragement_data('czech')
        assert 'welcome_messages' in encouragement_data
        
        title = get_text('title', 'czech')
        assert title is not None
        
        message = get_random_encouragement('welcome_messages', 'czech')
        assert message is not None
        
        print("✅ App imports and basic functions work correctly")
        return True
        
    except Exception as e:
        print(f"❌ App import error: {e}")
        return False

def test_emotional_responses():
    """Test emotional response logic"""
    print("🧪 Testing emotional response logic...")
    
    try:
        from app import load_encouragement_data
        
        # Load data
        data = load_encouragement_data('czech')
        responses = data.get('emotional_state_responses', {})
        
        # Test key emotions exist
        expected_emotions = ['zahlcen', 'frustrován', 'nadějný', 'nejistý']
        for emotion in expected_emotions:
            assert emotion in responses, f"Missing emotion: {emotion}"
            assert len(responses[emotion]) > 0, f"Empty responses for: {emotion}"
        
        print("✅ Emotional response logic works correctly")
        return True
        
    except Exception as e:
        print(f"❌ Emotional response error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Enhanced Akcelerátor Altruismu")
    print("=" * 50)
    
    tests = [
        test_data_loading,
        test_app_imports,
        test_emotional_responses
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            print()
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            print()
    
    print("=" * 50)
    print(f"🏁 Tests completed: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! The app should work correctly.")
        print("🌍 Run the app with: run_app.cmd")
    else:
        print("⚠️ Some tests failed. Check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 