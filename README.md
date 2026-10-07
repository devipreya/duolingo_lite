# Duolingo Lite (Next.js + FastAPI + SQLite)

A small Duolingo-style app: skill path, lesson player (5 exercise types), hearts, XP, streak,
daily goal, leaderboard and profile. One seeded Spanish course (2 units, 5 skills, 8 exercises each).

## Run
Needs Python 3.10+ and Node 18.17+.

Easiest: Windows `run.bat` · macOS/Linux `./run.sh` → open http://localhost:3000

Manual (2 terminals):
```
cd backend
python -m venv venv
venv\Scripts\activate            # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

cd frontend
npm install
npm run dev
```
The SQLite file `backend/duo.db` is created and seeded on first start (delete it to re-seed).
API docs: http://localhost:8000/docs. API URL for the frontend: `frontend/.env.local`.

## Tech stack
Next.js 14 (TypeScript, App Router, plain CSS) · FastAPI · SQLAlchemy 2 · SQLite

## Features
- Path: lock / unlock progression, completed / available / locked states, "START" bubble
- Lesson: multiple choice, translate (word bank), match pairs, fill in the blank, type the answer; feedback bar, progress bar, wrong answers repeat at the end
- Hearts: -1 per wrong answer, +1 every 30 min, out-of-hearts modal with mocked free refill
- XP: 10 per lesson (+5 if perfect); streak +1 on first lesson of a day, resets after a missed day; daily goal bar
- Leaderboard (seeded users + you), profile stats, mocked gems
- Everything persists per user in SQLite

## Architecture
```
backend/app/  main.py (app+seed)  models.py (schema)  routes.py (API)  logic.py (hearts/streak/XP rules)  seed.py
frontend/     app/ (pages)  components/ (Nav, LessonPlayer, Exercises)  lib/ (api, types, user context)
```

## Database schema
| Table | Columns |
|---|---|
| users | id, name, xp, streak, last_active, hearts, hearts_at, gems, daily_goal, xp_today, xp_today_date |
| units | id, order, title, color |
| skills | id, unit_id → units, order, title, icon |
| lessons | id, skill_id → skills |
| exercises | id, lesson_id → lessons, order, type, prompt, data (JSON), answer (JSON list) |
| user_skill_progress | PK (user_id, skill_id), completed_at – a row = skill completed |

## API (`/api`)
GET `/me` · GET `/path` · GET `/lessons/{id}` · POST `/lessons/{id}/wrong` (lose a heart) ·
POST `/lessons/{id}/complete` (XP, streak, progress) · POST `/hearts/refill` (mock) · GET `/leaderboard`

## Assumptions
- No real login: default learner id 1. Friends, Super, speech, other languages: not included.
- Answers are checked in the browser for simplicity (the lesson payload includes accepted answers).
- Test streaks by sending header `X-Debug-Date: YYYY-MM-DD` to the API (e.g. in /docs "Try it out" is not needed; use curl).
