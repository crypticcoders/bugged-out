@echo off
echo Starting Git Auto-Sync in background...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""%~dp0scripts\auto-sync.ps1""' -WindowStyle Hidden"
echo Git Auto-Sync is now running silently in the background!
echo To stop it, run stop-autosync.bat
timeout /t 3
