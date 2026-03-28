# ============================================================
#  QueueIQ — Database Management (Windows)
#  Run from the repo root: .\scripts\db.ps1 [flags]
#
#  Flags:
#    -Create    Create all tables
#    -Seed      Seed hospital data
#    -Migrate   Run pending migrations
#    -Drop      Drop all tables (destructive, asks confirmation)
# ============================================================

param(
    [switch]$Create,
    [switch]$Seed,
    [switch]$Migrate,
    [switch]$Drop
)

$Root    = Split-Path -Parent $PSScriptRoot
$Python  = "$Root\backend\venv\Scripts\python.exe"
$Flask   = "$Root\backend\venv\Scripts\flask.exe"
$BackDir = "$Root\backend"

if (-not (Test-Path $Flask)) {
    Write-Host "ERROR: Backend venv not found. Run .\scripts\setup.ps1 first." -ForegroundColor Red
    exit 1
}

$env:FLASK_APP = "run.py"
Set-Location $BackDir

if ($Create) {
    Write-Host "`n>>> Creating database tables..." -ForegroundColor Cyan
    & $Flask create-db
    Write-Host "  OK  Tables created." -ForegroundColor Green
}

if ($Seed) {
    Write-Host "`n>>> Seeding hospital data..." -ForegroundColor Cyan
    & $Flask seed-db
    Write-Host "  OK  Hospitals seeded." -ForegroundColor Green
}

if ($Migrate) {
    Write-Host "`n>>> Running migrations..." -ForegroundColor Cyan
    & $Flask db migrate
    & $Flask db upgrade
    Write-Host "  OK  Migrations applied." -ForegroundColor Green
}

if ($Drop) {
    $confirm = Read-Host "`nWARNING: This will DELETE all data. Type 'yes' to confirm"
    if ($confirm -eq "yes") {
        Write-Host "`n>>> Dropping all tables..." -ForegroundColor Red
        & $Flask drop-db
        Write-Host "  OK  Tables dropped." -ForegroundColor Yellow
    } else {
        Write-Host "  Cancelled." -ForegroundColor White
    }
}

if (-not ($Create -or $Seed -or $Migrate -or $Drop)) {
    Write-Host @"

Usage: .\scripts\db.ps1 [flags]

Flags:
  -Create    Create all PostgreSQL tables
  -Seed      Seed hospital data (6 hospitals, 18 queue profiles)
  -Migrate   Run pending Flask-Migrate migrations
  -Drop      Drop all tables (asks for confirmation)

Examples:
  .\scripts\db.ps1 -Create -Seed        # First-time setup
  .\scripts\db.ps1 -Migrate             # After model changes
  .\scripts\db.ps1 -Drop                # Reset everything

"@ -ForegroundColor White
}

Set-Location $Root
