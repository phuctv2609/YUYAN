# ==============================================================================
# YUYAN INSTANT AUTO-SYNC WATCHER ENGINE
# Windows-compatible PowerShell FileSystemWatcher for automated Git synchronization
# ==============================================================================

param(
    [string]$RepoPath = "C:\Users\Loan\YUYAN",
    [string]$TargetBranch = "main",
    [string]$Remote = "origin",
    [int]$DebounceSeconds = 3
)

$ErrorActionPreference = "Continue"

$ToolsDir = "$RepoPath\tools\autosync"
$LogFile = "$ToolsDir\autosync.log"
$PidFile = "$ToolsDir\.autosync.pid"

if (-not (Test-Path $ToolsDir)) {
    New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null
}

function Log-Message([string]$msg, [string]$level = "INFO") {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] [$level] $msg"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding utf8
}

# 1. Single Instance Check
if (Test-Path $PidFile) {
    $existingPid = Get-Content $PidFile -ErrorAction SilentlyContinue
    if ($existingPid) {
        $proc = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
        if ($proc) {
            Log-Message "Another instance of yuyan-autosync is already running (PID: $existingPid). Exiting." "WARN"
            exit 1
        }
    }
}

$currentPid = $PID
Set-Content -Path $PidFile -Value $currentPid -Encoding utf8

Log-Message "======================================================================"
Log-Message "YUYAN Auto-Sync Watcher Started (PID: $currentPid)"
Log-Message "Repository: $RepoPath | Target Branch: $TargetBranch | Remote: $Remote"
Log-Message "Debounce: $DebounceSeconds s | Log: $LogFile"
Log-Message "======================================================================"

# 2. File Filtering & Security Rules
$IgnoredPatterns = @(
    "\\\.git\\",
    "\\node_modules\\",
    "\\dist\\",
    "\\build\\",
    "\\scratch\\",
    "\\tools\\autosync\\",
    "\\\.temp\\",
    "\\backups\\",
    "\.log$",
    "\.pid$",
    "\.tmp$"
)

$SecretPatterns = @(
    "\.env$",
    "\.env\.",
    "\.key$",
    "\.pem$",
    "id_rsa",
    "id_ed25519"
)

function Is-Ignored([string]$path) {
    foreach ($p in $IgnoredPatterns) {
        if ($path -match $p) { return $true }
    }
    return $false
}

function Is-Secret([string]$path) {
    foreach ($p in $SecretPatterns) {
        if ($path -match $p) { return $true }
    }
    return $false
}

# 3. Synchronize Pending Files
function Invoke-Sync([System.Collections.Generic.HashSet[string]]$changedFiles) {
    if ($changedFiles.Count -eq 0) { return }

    Set-Location $RepoPath

    # Check git merge/rebase status
    if (Test-Path "$RepoPath\.git\MERGE_HEAD") {
        Log-Message "Merge in progress detected. Auto-sync deferred." "WARN"
        return
    }
    if (Test-Path "$RepoPath\.git\rebase-merge" -or Test-Path "$RepoPath\.git\rebase-apply") {
        Log-Message "Rebase in progress detected. Auto-sync deferred." "WARN"
        return
    }

    # Verify branch
    $currentBranch = (git branch --show-current).Trim()
    if ($currentBranch -ne $TargetBranch) {
        Log-Message "Current branch is '$currentBranch', expected '$TargetBranch'. Auto-sync skipped." "WARN"
        return
    }

    # Filter files and check for secrets
    $filesToStage = @()
    foreach ($f in $changedFiles) {
        if (Is-Secret $f) {
            Log-Message "[SECURITY ALERT] Secret-bearing file detected: $f. Entire sync cycle aborted!" "ERROR"
            return
        }
        if (-not (Is-Ignored $f)) {
            $filesToStage += $f
        }
    }

    if ($filesToStage.Count -eq 0) {
        return
    }

    Log-Message "Detected $($filesToStage.Count) changed file(s): $($filesToStage -join ', ')"

    # Stage files safely
    foreach ($f in $filesToStage) {
        if (Test-Path $f) {
            git add -- $f
        } else {
            # File was deleted/renamed
            git rm --cached --ignore-unmatch -- $f 2>$null
            git add -u -- $f 2>$null
        }
    }

    $staged = (git diff --cached --name-only)
    if (-not $staged) {
        Log-Message "No staged changes after filtering. Skipping commit."
        return
    }

    # Verify staged diff for secret tokens
    $diffOutput = (git diff --cached)
    if ($diffOutput -match "AIza[0-9A-Za-z-_]{35}|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9") {
        Log-Message "[SECURITY ALERT] Staged diff contains forbidden secret patterns! Unstaging immediately." "ERROR"
        git reset HEAD 2>$null
        return
    }

    # Commit
    $shortSummary = ($filesToStage | ForEach-Object { Split-Path $_ -Leaf }) -join ", "
    if ($shortSummary.Length -gt 60) {
        $shortSummary = $shortSummary.Substring(0, 57) + "..."
    }
    $commitMsg = "auto(sync): update $shortSummary"
    
    git commit -m $commitMsg 2>&1 | Out-Null
    $commitHash = (git rev-parse --short HEAD).Trim()
    Log-Message "Created local commit [$commitHash]: $commitMsg"

    # Pre-push remote check
    git fetch $Remote $TargetBranch --quiet 2>$null
    $behindCount = (git rev-list "HEAD..$Remote/$TargetBranch" --count 2>$null)
    if ($behindCount -and [int]$behindCount -gt 0) {
        Log-Message "Remote has $behindCount newer commit(s). Manual reconcile required. Skipping push." "WARN"
        return
    }

    # Normal Push with Bounded Retry
    $maxRetries = 2
    $pushed = $false
    for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
        Log-Message "Pushing commit $commitHash to $Remote/$TargetBranch (attempt $attempt)..."
        $pushOutput = (git push $Remote $TargetBranch 2>&1 | Out-String)
        if ($LASTEXITCODE -eq 0) {
            $pushed = $true
            Log-Message "[SUCCESS] Successfully synchronized commit $commitHash to GitHub!"
            break
        } else {
            Log-Message "Push attempt $attempt failed: $($pushOutput.Trim())" "WARN"
            if ($attempt -lt $maxRetries) {
                Start-Sleep -Seconds 3
            }
        }
    }

    if (-not $pushed) {
        Log-Message "Could not push commit $commitHash after $maxRetries attempts. Preserving local commit safely." "ERROR"
    }
}

# 4. FileSystemWatcher Setup
$watcher = New-Item -ItemType Object -TypeName System.IO.FileSystemWatcher
$watcher.Path = $RepoPath
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]'FileName, LastWrite, CreationTime'
$watcher.EnableRaisingEvents = $true

$queue = [System.Collections.Generic.HashSet[string]]::new()
$lastEventTime = [DateTime]::MinValue
$lock = [System.Object]::new()

$action = {
    param($source, $eventArgs)
    $path = $eventArgs.FullPath
    if (-not (Is-Ignored $path)) {
        [System.Threading.Monitor]::Enter($lock)
        try {
            $queue.Add($path) | Out-Null
            $script:lastEventTime = [DateTime]::UtcNow
        } finally {
            [System.Threading.Monitor]::Exit($lock)
        }
    }
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null
Register-ObjectEvent $watcher "Renamed" -Action $action | Out-Null

Log-Message "FileSystemWatcher registered. Listening for file changes..."

try {
    while ($true) {
        Start-Sleep -Milliseconds 500

        $shouldSync = $false
        $batch = @()

        [System.Threading.Monitor]::Enter($lock)
        try {
            if ($queue.Count -gt 0) {
                $elapsed = ([DateTime]::UtcNow - $lastEventTime).TotalSeconds
                if ($elapsed -ge $DebounceSeconds) {
                    $batch = [string[]]$queue
                    $queue.Clear()
                    $shouldSync = $true
                }
            }
        } finally {
            [System.Threading.Monitor]::Exit($lock)
        }

        if ($shouldSync -and $batch.Count -gt 0) {
            $set = [System.Collections.Generic.HashSet[string]]::new([string[]]$batch)
            Invoke-Sync $set
        }
    }
} finally {
    Log-Message "Shutting down watcher..."
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    if (Test-Path $PidFile) {
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }
    Log-Message "YUYAN Auto-Sync Watcher stopped."
}
