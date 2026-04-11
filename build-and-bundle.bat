@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\" (
  echo Running npm install ^(node_modules missing^)...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    exit /b 1
  )
  echo.
)

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
echo Running npm run prepare:package...
call npm run prepare:package
if errorlevel 1 (
  echo prepare:package failed.
  exit /b 1
)

echo.
echo Build, bundle, and dist package prep finished successfully.
echo Output: dist\cli.js plus vendor, locales, project-brain-skills, etc.
echo.
echo --- How to use ---
echo mu-pilot ^(or mu / autocreator^) — autopilot-style flags:
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
echo   mu-pilot --frontend-audit
echo   mu-pilot --ready-production
echo   mu-pilot --smart
echo   mu-pilot --skill understand
echo   mu-pilot --skill audit-frontend
echo.
echo Interactive terminal ^(TTY^) — slash commands:
echo   /quality-check   /prod-ready   /full-chain   /frontend-audit
echo   /ready-production   /smart   /skill ^<name^>   /project-hardening
echo   Optional focus: text after /prod-ready or /project-hardening
echo.
echo Run from dist: node dist\cli.js --help
exit /b 0
