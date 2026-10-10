# ==============================================================================
# START YUYAN AUTO-SYNC WATCHER
# Launches yuyan-autosync.ps1 in the background with hidden window and logging
# ==============================================================================

param(
    [string]$RepoPath = "C:\Users\Loan\YUYAN"
)

$ToolsDir = "$RepoPath\tools\autosync"
$PidFile = "$ToolsDir\.autosync.pid"
$ScriptFile = "$ToolsDir\yuyan-autosync.ps1"

if (Test-Path $PidFile) {
    $existingPid = Get-Content $PidFile -ErrorAction SilentlyContinue
    if ($existingPid) {
        $proc = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Auto-Sync is ALREADY RUNNING (PID: $existingPid)." -ForegroundColor Yellow
            Write-Host "Use .\tools\autosync\status-autosync.ps1 to inspect status or .\tools\autosync\stop-autosync.ps1 to stop."
            exit 0
        }
    }
}

Write-Host "Starting YUYAN Auto-Sync background watcher..." -ForegroundColor Cyan

$process = Start-Process powershell.exe -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$ScriptFile`"", "-RepoPath", "`"$RepoPath`"" -WindowStyle Hidden -PassThru

Start-Sleep -Seconds 1

if (Test-Path $PidFile) {
    $runningPid = Get-Content $PidFile -ErrorAction SilentlyContinue
    Write-Host "YUYAN Auto-Sync successfully started in background (PID: $runningPid)!" -ForegroundColor Green
    Write-Host "Log file: $ToolsDir\autosync.log"
} else {
    Write-Host "Watcher started with Process ID: $($process.Id)." -ForegroundColor Green
}
