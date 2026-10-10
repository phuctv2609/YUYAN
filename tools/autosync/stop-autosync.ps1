# ==============================================================================
# STOP YUYAN AUTO-SYNC WATCHER
# Gracefully terminates the running auto-sync background process
# ==============================================================================

param(
    [string]$RepoPath = "C:\Users\Loan\YUYAN"
)

$ToolsDir = "$RepoPath\tools\autosync"
$PidFile = "$ToolsDir\.autosync.pid"

if (-not (Test-Path $PidFile)) {
    Write-Host "No active auto-sync process found (no .autosync.pid file)." -ForegroundColor Yellow
    exit 0
}

$runningPid = Get-Content $PidFile -ErrorAction SilentlyContinue
if (-not $runningPid) {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Write-Host "Empty PID file cleaned up." -ForegroundColor Yellow
    exit 0
}

$proc = Get-Process -Id $runningPid -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "Stopping YUYAN Auto-Sync watcher (PID: $runningPid)..." -ForegroundColor Cyan
    Stop-Process -Id $runningPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
    Write-Host "Auto-Sync watcher stopped successfully." -ForegroundColor Green
} else {
    Write-Host "Process with PID $runningPid is no longer active." -ForegroundColor Yellow
}

if (Test-Path $PidFile) {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}
