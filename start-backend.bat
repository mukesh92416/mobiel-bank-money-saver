@echo off
echo Starting MoneySaver Backend...
cd /d "%~dp0backend"
call venv\Scripts\activate
python app.py
pause
