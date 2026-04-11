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
echo mu-pilot ^(or mu / autocreator^) — two entry points ^(skills run inside these flows^):
echo   mu-pilot --brainstorm
echo   mu-pilot --prod
echo.
echo Interactive terminal ^(TTY^): /brainstorm   /prod
echo.
echo More flags: node dist\cli.js --help
exit /b 0
