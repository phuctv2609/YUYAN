# ==============================================================================
# UNREGISTER YUYAN AUTO-SYNC FROM WINDOWS STARTUP
# Removes the Windows Startup shortcut
# ==============================================================================

$StartupFolder = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$ShortcutPath = Join-Path $StartupFolder "YUYAN-AutoSync.lnk"

if (Test-Path $ShortcutPath) {
    Remove-Item $ShortcutPath -Force
    Write-Host "[SUCCESS] Windows Startup shortcut removed." -ForegroundColor Green
} else {
    Write-Host "No Windows Startup shortcut found." -ForegroundColor Yellow
}
