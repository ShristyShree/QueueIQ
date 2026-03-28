#!/usr/bin/env bash
# ============================================================
#  QueueIQ — Setup Script (Mac / Linux)
#  Run from the repo root: bash scripts/setup.sh
# ============================================================

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

step()  { echo -e "\n${CYAN}>>> $1${NC}"; }
ok()    { echo -e "  ${GREEN}OK${NC}  $1"; }
warn()  { echo -e "  ${YELLOW}WARN${NC}  $1"; }
error() { echo -e "  ${RED}ERROR${NC}  $1"; exit 1; }

echo -e "\n${CYAN}========================================${NC}"
echo -e "${CYAN}   QueueIQ — Setup Script (Mac/Linux)${NC}"
echo -e "${CYAN}========================================${NC}\n"

# ── Backend ───────────────────────────────────────────────────
step "Setting up backend (Flask + PostgreSQL)"
cd "$ROOT/backend"

command -v python3 &>/dev/null || error "Python 3 not found. Install from https://python.org"
ok "Found $(python3 --version)"

if [ ! -d "venv" ]; then
    step "Creating Python virtual environment..."
    python3 -m venv venv
    ok "Virtual environment created"
else
    ok "Virtual environment already exists"
fi

step "Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt -q
ok "Python packages installed"

if [ ! -f ".env" ]; then
    cp .env.example .env
    warn ".env created — edit backend/.env with your DATABASE_URL and JWT_SECRET_KEY"
else
    ok ".env already exists"
fi

# ── Frontend ──────────────────────────────────────────────────
step "Setting up frontend (React + Vite)"
cd "$ROOT/frontend"

command -v node &>/dev/null || error "Node.js not found. Install from https://nodejs.org"
ok "Found Node.js $(node --version)"

step "Installing npm packages..."
npm install --silent
ok "npm packages installed"

if [ ! -f ".env" ]; then
    cp .env.example .env
    ok ".env created (VITE_API_URL=http://localhost:5000)"
else
    ok ".env already exists"
fi

cd "$ROOT"
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   Setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "
Next steps:
  1. Edit ${YELLOW}backend/.env${NC} — set DATABASE_URL and JWT_SECRET_KEY
  2. Run: ${CYAN}bash scripts/db.sh create seed${NC}
  3. Run: ${CYAN}bash scripts/dev.sh${NC}
"
