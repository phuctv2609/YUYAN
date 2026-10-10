# ==============================================================================
# REGISTER YUYAN AUTO-SYNC FOR WINDOWS STARTUP
# Creates a Windows Startup shortcut so auto-sync runs automatically on user login
# ==============================================================================

param(
    [string]$RepoPath = "C:\Users\Loan\YUYAN"
)

$StartupFolder = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$ShortcutPath = Join-Path $StartupFolder "YUYAN-AutoSync.lnk"
$StartScript = Join-Path $RepoPath "tools\autosync\start-autosync.ps1"

Write-Host "Registering YUYAN Auto-Sync for Windows Startup..." -ForegroundColor Cyan

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($ShortcutPath)
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$StartScript`""
$shortcut.WorkingDirectory = $RepoPath
$shortcut.Description = "YUYAN Instant Auto-Sync to GitHub"
$shortcut.Save()

if (Test-Path $ShortcutPath) {
    Write-Host "[SUCCESS] Windows Startup shortcut created:" -ForegroundColor Green
    Write-Host "Location: $ShortcutPath"
    Write-Host "Auto-sync will now start automatically whenever you sign into Windows."
} else {
    Write-Host "[ERROR] Failed to create shortcut in $StartupFolder" -ForegroundColor Red
}
