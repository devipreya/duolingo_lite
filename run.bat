@echo off
cd /d "%~dp0backend"
if not exist venv ( python -m venv venv )
call venv\Scripts\activate
pip install -q -r requirements.txt
start "backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
cd /d "%~dp0frontend"
if not exist node_modules ( call npm install )
start "frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Open http://localhost:3000
