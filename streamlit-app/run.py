#!/usr/bin/env python3
"""
Enhanced Akcelerátor Altruismu - Streamlit Runner
Practical tool for transforming empathy into concrete action

Usage:
    python run.py [--port PORT] [--dev]
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def check_requirements():
    """Check if required packages are installed"""
    try:
        import streamlit
        print(f"✅ Streamlit {streamlit.__version__} detected")
        return True
    except ImportError:
        print("❌ Streamlit not found. Installing requirements...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        return False

def run_streamlit(port=8501, dev_mode=False):
    """Run the enhanced Streamlit application"""
    
    # Ensure we're in the right directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Check if app.py exists
    if not Path("app.py").exists():
        print("❌ app.py not found in current directory")
        sys.exit(1)
    
    # Check if data directory exists
    if not Path("data").exists():
        print("❌ data directory not found")
        sys.exit(1)
    
    print("🚀 Starting Enhanced Akcelerátor Altruismu...")
    print(f"📍 Port: {port}")
    print(f"🔧 Development mode: {'Yes' if dev_mode else 'No'}")
    print("🌍 Access at: http://localhost:{}".format(port))
    print("\n" + "="*50)
    print("🇨🇿 Transforming empathy into action...")
    print("💚 Ready to help Czech users find their path!")
    print("="*50 + "\n")
    
    # Build command
    cmd = [
        sys.executable, "-m", "streamlit", "run", "app.py",
        "--server.port", str(port),
        "--server.enableCORS", "false",
        "--server.enableXsrfProtection", "false"
    ]
    
    if not dev_mode:
        cmd.extend(["--server.headless", "true"])
    
    # Add development specific settings
    if dev_mode:
        cmd.extend([
            "--server.runOnSave", "true",
            "--server.allowRunOnSave", "true"
        ])
    
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping Akcelerátor Altruismu...")
        print("💚 Thank you for helping transform empathy into action!")
    except Exception as e:
        print(f"❌ Error running Streamlit: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(
        description="Enhanced Akcelerátor Altruismu - Streamlit Runner"
    )
    parser.add_argument(
        "--port", 
        type=int, 
        default=8501, 
        help="Port to run Streamlit on (default: 8501)"
    )
    parser.add_argument(
        "--dev", 
        action="store_true", 
        help="Run in development mode with auto-reload"
    )
    parser.add_argument(
        "--check", 
        action="store_true", 
        help="Check if requirements are installed"
    )
    
    args = parser.parse_args()
    
    if args.check:
        if check_requirements():
            print("✅ All requirements are installed!")
        else:
            print("❌ Some requirements are missing. Run without --check to install them.")
        return
    
    # Check and install requirements if needed
    if not check_requirements():
        print("📦 Requirements installed. Starting app...")
    
    # Run the application
    run_streamlit(port=args.port, dev_mode=args.dev)

if __name__ == "__main__":
    main() 