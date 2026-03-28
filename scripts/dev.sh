#!/usr/bin/env bash
# ============================================================
#  QueueIQ — Start Development Servers (Mac / Linux)
#  Run from the repo root: bash scripts/dev.sh
# ============================================================

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "========================================"
echo "   QueueIQ — Starting Dev Servers"
echo "========================================"
echo ""

# ── Flask backend ─────────────────────────────────────────────
(
  cd "$ROOT/backend"
  echo ">>> Starting Flask API on http://localhost:5000"
  source venv/bin/activate
  python run.py
) &
BACKEND_PID=$!

# ── Vite frontend ─────────────────────────────────────────────
(
  cd "$ROOT/frontend"
  echo ">>> Starting Vite on http://localhost:5173"
  npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "Backend  → http://localhost:5000"
echo "Frontend → http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Wait and clean up on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait
