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
echo mu-pilot ^(or mu^) - autopilot-style commands:
echo   mu-pilot --brainstorm
echo   mu-pilot --brainstorm "your app idea"
echo   mu-pilot --brainstorm --brownfield
echo   mu-pilot -b "your app idea"
echo   ^(-b is short for --brainstorm^)
echo.
echo   mu-pilot --quality-check
echo   mu-pilot --prod-ready
echo   mu-pilot --prod-ready -p "optional focus text"
echo   mu-pilot --full-chain
echo.
echo Interactive terminal ^(TTY^) - same flows via slash commands:
echo   /quality-check     /prod-ready     /project-hardening     /full-chain
echo   Optional focus: type text after /prod-ready or /project-hardening
exit /b 0
