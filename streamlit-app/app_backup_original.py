"""
Akcelerátor altruismu - Main Entry Point
Praktický nástroj pro transformaci empatie v konkrétní akce
"""

import streamlit as st
from config.settings import configure_page
from config.styling import apply_styles
from core.session import initialize_session_state
from core.navigation import main_navigation
from components.emergency_help import render_emergency_widget
from components.poc_badge import render_poc_badge

def main():
    """Main application entry point"""
    # Configure page
    configure_page()
    
    # Apply CSS styles
    apply_styles()
    
    # Initialize session state
    initialize_session_state()
    
    # Run main navigation
    main_navigation()
    
    # Always-visible components
    render_emergency_widget()
    render_poc_badge()

if __name__ == "__main__":
    main() 