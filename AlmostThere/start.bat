@echo off
echo.
echo  ========================================
echo   AlmostThere - Starting Backend Server
echo  ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo  ERROR: .env file not found!
    echo  Please copy .env.example to .env
    echo  and add your Anthropic API key.
    echo.
    pause
    exit /b 1
)

echo  Starting Flask backend at http://localhost:5000
echo  Keep this window open while using the app!
echo.
python app.py
pause
