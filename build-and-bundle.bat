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
echo Installing globally so mu-pilot / mu point to latest dist\cli.js...
call npm install -g . --ignore-scripts
if errorlevel 1 (
  echo Global install failed.
  exit /b 1
)

echo.
echo Build, bundle, and global install finished successfully.
echo.
echo --- How to use ---
echo mu-pilot ^(or mu / autocreator^) — two entry points ^(skills run inside these flows^):
echo   mu-pilot --brainstorm
echo   mu-pilot --prod
echo   mu-pilot --idea "build a task manager"
echo   mu-pilot --idea "build CRM system in Laravel" --approval-mode plan
echo.
echo Interactive terminal ^(TTY^): /brainstorm   /prod
echo.
echo More flags: mu-pilot --help
exit /b 0
