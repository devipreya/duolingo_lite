#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/backend"
[ -d venv ] || python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
uvicorn app.main:app --reload --port 8000 &
trap "kill $! 2>/dev/null" EXIT
cd "$ROOT/frontend"
[ -d node_modules ] || npm install
npm run dev
