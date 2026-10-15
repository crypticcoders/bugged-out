@echo off
echo Stopping any running Git Auto-Sync processes...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*auto-sync.ps1*' -and $_.Name -eq 'powershell.exe' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host ('Stopped process ' + $_.ProcessId) }"
echo Auto-Sync stopped.
ping -n 3 127.0.0.1 >nul
