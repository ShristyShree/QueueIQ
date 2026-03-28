# ============================================================
#  QueueIQ — Run Backend Tests (Windows)
#  Run from repo root: .\scripts\test.ps1
# ============================================================

$Root   = Split-Path -Parent $PSScriptRoot
$Pytest = "$Root\backend\venv\Scripts\pytest.exe"

if (-not (Test-Path $Pytest)) {
    Write-Host "ERROR: Backend venv not found. Run .\scripts\setup.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "`n>>> Running backend tests..." -ForegroundColor Cyan
Set-Location "$Root\backend"
& $Pytest tests/ -v
Set-Location $Root
