@echo off
cd /d "%~dp0"
if not exist "node_modules\vite" (
  echo Installing project dependencies...
  call npm.cmd ci --cache .npm-cache --no-audit --no-fund
  if errorlevel 1 goto failed
)
call npm.cmd run dev -- --host 127.0.0.1 --port 5174 --open
if errorlevel 1 goto failed
exit /b 0
:failed
echo.
echo The game could not start. Check that Node.js 24 and npm are installed.
pause
exit /b 1
