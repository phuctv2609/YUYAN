# ==============================================================================
# START YUYAN AUTO-SYNC WATCHER
# Launches yuyan-autosync.ps1 as a detached background daemon
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

$cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptFile`" -RepoPath `"$RepoPath`""
$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd }

Start-Sleep -Seconds 2

if (Test-Path $PidFile) {
    $runningPid = Get-Content $PidFile -ErrorAction SilentlyContinue
    Write-Host "YUYAN Auto-Sync successfully started in background (PID: $runningPid)!" -ForegroundColor Green
    Write-Host "Log file: $ToolsDir\autosync.log"
} else {
    Write-Host "Watcher started with Process ID: $($result.ProcessId)." -ForegroundColor Green
}
