#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT/backend"
uvicorn gnat_gui.main:app --reload --port 8000 &
BACKEND_PID=$!

cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
