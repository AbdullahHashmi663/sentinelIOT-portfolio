@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 22.12 or newer.
  pause
  exit /b 1
)
if not exist "node_modules\" (
  echo Preparing the Sentinel-IoT portfolio...
  call npm install
  if errorlevel 1 (
    echo Dependency setup did not finish.
    pause
    exit /b 1
  )
)
echo.
echo Sentinel-IoT Portfolio: http://127.0.0.1:4173
echo Keep this window open while viewing the portfolio.
echo.
call npm run dev
pause
