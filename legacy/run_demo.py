#!/usr/bin/env python3
"""
Altruism Accelerator - Demo Launcher

This script launches the Altruism Accelerator MVP demo.
Make sure you have the requirements installed before running.
"""

import subprocess
import sys
import os

def check_requirements():
    """Check if required packages are installed"""
    try:
        import streamlit
        print("✅ Streamlit is installed")
        return True
    except ImportError:
        print("❌ Streamlit not found. Installing requirements...")
        return False

def install_requirements():
    """Install required packages"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install requirements")
        return False

def run_app():
    """Run the Streamlit app"""
    print("🚀 Starting Altruism Accelerator...")
    print("📖 Local development: http://localhost:8501")
    print("🌐 Production app: https://akcelerator-altruismu.streamlit.app")
    print("⭐ Launching local version...")
    
    try:
        subprocess.run([sys.executable, "-m", "streamlit", "run", "app.py"])
    except KeyboardInterrupt:
        print("\n\n👋 Thanks for trying Altruism Accelerator!")
        print("💚 Remember: Small actions, when multiplied by millions of people, can transform the world.")

def main():
    print("🌱 Altruism Accelerator - MVP Demo")
    print("Transform overwhelm into meaningful action")
    print("="*40)
    
    # Check if we're in the right directory
    if not os.path.exists("app.py"):
        print("❌ app.py not found. Please run this script from the project directory.")
        return
    
    # Check and install requirements if needed
    if not check_requirements():
        if not install_requirements():
            print("❌ Could not install requirements. Please run: pip install -r requirements.txt")
            return
    
    # Launch the app
    run_app()

if __name__ == "__main__":
    main() 