# ============================================================
#  QueueIQ — Start Development Servers (Windows)
#  Run from the repo root: .\scripts\dev.ps1
#
#  Opens two PowerShell windows:
#    - Flask API   on http://localhost:5000
#    - Vite dev    on http://localhost:5173
# ============================================================

$Root = Split-Path -Parent $PSScriptRoot

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   QueueIQ — Starting Dev Servers"        -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ── Start Flask backend in a new window ───────────────────────
$backendCmd = @"
Set-Location '$Root\backend'
Write-Host 'Starting Flask API on http://localhost:5000' -ForegroundColor Cyan
& '.\venv\Scripts\python.exe' run.py
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# ── Start Vite frontend in a new window ───────────────────────
$frontendCmd = @"
Set-Location '$Root\frontend'
Write-Host 'Starting Vite dev server on http://localhost:5173' -ForegroundColor Cyan
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "Backend  → http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend → http://localhost:5173" -ForegroundColor Green
Write-Host "`nTwo new PowerShell windows have opened." -ForegroundColor White
Write-Host "Close them to stop the servers.`n" -ForegroundColor White
