@echo off
setlocal
cd /d "%~dp0"

echo Running npm run build...
call npm run build
if errorlevel 1 (
  echo Build failed.
  exit /b 1
)

echo.
echo Running npm run bundle...
call npm run bundle
if errorlevel 1 (
  echo Bundle failed.
  exit /b 1
)

echo.
echo Build and bundle finished successfully.
echo.
echo --- How to use ---
echo mu-pilot - autopilot-style commands:
echo   mu-pilot --brainstorm
echo   mu-pilot --brainstorm "your app idea"
echo   mu-pilot --brainstorm --brownfield
echo   mu-pilot --quality-check
echo   ^(-b is short for --brainstorm^)
exit /b 0
