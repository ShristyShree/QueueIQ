#!/usr/bin/env bash
# ============================================================
#  QueueIQ — Database Management (Mac / Linux)
#  Usage: bash scripts/db.sh [create] [seed] [migrate] [drop]
# ============================================================

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"
source venv/bin/activate
export FLASK_APP=run.py

for cmd in "$@"; do
  case $cmd in
    create)
      echo ">>> Creating tables..."
      flask create-db ;;
    seed)
      echo ">>> Seeding hospital data..."
      flask seed-db ;;
    migrate)
      echo ">>> Running migrations..."
      flask db migrate && flask db upgrade ;;
    drop)
      read -p "WARNING: Delete all data? Type 'yes' to confirm: " confirm
      [[ $confirm == "yes" ]] && flask drop-db || echo "Cancelled." ;;
    *)
      echo "Unknown command: $cmd. Use: create seed migrate drop" ;;
  esac
done
