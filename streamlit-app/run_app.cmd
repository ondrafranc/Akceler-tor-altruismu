@echo off
echo 🚀 Starting Enhanced Akcelerátor Altruismu...
echo 💚 Transforming empathy into action...
echo.
echo 🌍 Access at: http://localhost:8501
echo 🛑 Press Ctrl+C to stop
echo.

python -m streamlit run app.py --server.port 8501 --server.enableCORS false --server.enableXsrfProtection false

echo.
echo 🛑 Akcelerátor Altruismu stopped.
echo 💚 Thank you for helping transform empathy into action!
pause 