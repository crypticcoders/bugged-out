@echo off
setlocal
cd /d "%~dp0"
echo ===================================================
echo  Instant Git Sync: crypticcoders/bugged-out
echo ===================================================

git status --short
echo.
set /p msg="Enter commit message (Press Enter for timestamp): "
if "%msg%"=="" (
    for /f "tokens=1-4 delims=/:. " %%a in ("%date% %time%") do set msg=Manual sync: %date% %time%
)

git add -A
git commit -m "%msg%"
git push origin main

echo.
echo Sync finished!
pause
