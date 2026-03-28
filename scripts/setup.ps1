# ============================================================
#  QueueIQ — Windows PowerShell Setup Script
#  Run from the repo root: .\scripts\setup.ps1
# ============================================================

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Write-Step($msg) {
    Write-Host "`n>>> $msg" -ForegroundColor Cyan
}
function Write-OK($msg) {
    Write-Host "  OK  $msg" -ForegroundColor Green
}
function Write-Warn($msg) {
    Write-Host "  WARN  $msg" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   QueueIQ Setup Script (Windows)"      -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ── BACKEND ──────────────────────────────────────────────────
if (-not $SkipBackend) {
    Write-Step "Setting up backend (Flask + PostgreSQL)"

    Set-Location "$Root\backend"

    # Check Python
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: Python not found. Install from https://python.org" -ForegroundColor Red
        exit 1
    }
    $pyVersion = python --version
    Write-OK "Found $pyVersion"

    # Create venv
    if (-not (Test-Path "venv")) {
        Write-Step "Creating Python virtual environment..."
        python -m venv venv
        Write-OK "Virtual environment created"
    } else {
        Write-OK "Virtual environment already exists"
    }

    # Install requirements
    Write-Step "Installing Python dependencies..."
    & ".\venv\Scripts\pip.exe" install -r requirements.txt --quiet
    Write-OK "Python packages installed"

    # Copy .env if missing
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Warn ".env created from .env.example"
        Write-Warn "IMPORTANT: Edit backend\.env and set DATABASE_URL and JWT_SECRET_KEY"
    } else {
        Write-OK ".env already exists"
    }

    Set-Location $Root
}

# ── FRONTEND ─────────────────────────────────────────────────
if (-not $SkipFrontend) {
    Write-Step "Setting up frontend (React + Vite)"

    Set-Location "$Root\frontend"

    # Check Node
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
        exit 1
    }
    $nodeVersion = node --version
    Write-OK "Found Node.js $nodeVersion"

    # npm install
    Write-Step "Installing npm packages..."
    npm install --silent
    Write-OK "npm packages installed"

    # Copy .env if missing
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-OK ".env created (VITE_API_URL=http://localhost:5000)"
    } else {
        Write-OK ".env already exists"
    }

    Set-Location $Root
}

# ── DONE ─────────────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host @"

Next steps:
  1. Edit backend\.env  — set DATABASE_URL and JWT_SECRET_KEY
  2. Run:  .\scripts\db.ps1 -Create -Seed
  3. Run:  .\scripts\dev.ps1

"@ -ForegroundColor White
