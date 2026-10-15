@echo off
title Git Auto-Sync (bugged-out)
echo Starting Git Auto-Sync in visible console...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\auto-sync.ps1"
pause
