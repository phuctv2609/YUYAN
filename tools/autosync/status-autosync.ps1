# ==============================================================================
# STATUS CHECK FOR YUYAN AUTO-SYNC WATCHER
# Displays running state, PID, memory, and latest log lines
# ==============================================================================

param(
    [string]$RepoPath = "C:\Users\Loan\YUYAN",
    [int]$Lines = 15
)

$ToolsDir = "$RepoPath\tools\autosync"
$PidFile = "$ToolsDir\.autosync.pid"
$LogFile = "$ToolsDir\autosync.log"

Write-Host "=== YUYAN AUTO-SYNC STATUS ===" -ForegroundColor Cyan

if (Test-Path $PidFile) {
    $runningPid = Get-Content $PidFile -ErrorAction SilentlyContinue
    $proc = $null
    if ($runningPid) {
        $proc = Get-Process -Id $runningPid -ErrorAction SilentlyContinue
    }
    if ($proc) {
        Write-Host "State: RUNNING (PID: $runningPid)" -ForegroundColor Green
        Write-Host "Process Name: $($proc.ProcessName) | Working Set: $([math]::Round($proc.WorkingSet64/1MB, 2)) MB"
        Write-Host "Start Time: $($proc.StartTime)"
    } else {
        Write-Host "State: STALE PID FILE (PID $runningPid not running)" -ForegroundColor Yellow
    }
} else {
    Write-Host "State: STOPPED (not running)" -ForegroundColor DarkGray
}

if (Test-Path $LogFile) {
    Write-Host "`n--- Recent Log Lines ($LogFile) ---" -ForegroundColor Cyan
    Get-Content $LogFile -Tail $Lines | ForEach-Object {
        if ($_ -match "\[ERROR\]") { Write-Host $_ -ForegroundColor Red }
        elseif ($_ -match "\[WARN\]") { Write-Host $_ -ForegroundColor Yellow }
        elseif ($_ -match "\[SUCCESS\]") { Write-Host $_ -ForegroundColor Green }
        else { Write-Host $_ }
    }
} else {
    Write-Host "No log file found yet." -ForegroundColor DarkGray
}
