@echo off
echo Stopping Pingnom Development Environment...
echo.

echo Stopping Backend API Server (port 8090)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8090 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo Stopping Frontend Mobile App (expo processes)...
tasklist /fi "imagename eq node.exe" /fi "windowtitle eq *expo*" /fo csv | findstr "node.exe" > nul
if not errorlevel 1 (
    taskkill /f /im node.exe /fi "windowtitle eq *expo*" >nul 2>&1
)

echo Stopping Metro Bundler processes...
tasklist /fi "imagename eq node.exe" /fi "windowtitle eq *Metro*" /fo csv | findstr "node.exe" > nul
if not errorlevel 1 (
    taskkill /f /im node.exe /fi "windowtitle eq *Metro*" >nul 2>&1
)

echo.
echo ✅ Development servers stopped.
echo.
echo To restart, run: scripts\dev-start.bat
echo.
pause