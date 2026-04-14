@echo off
setlocal

REM Build, bundle, and install this package globally.
pushd "%~dp0" || (
  echo Failed to switch to script directory.
  exit /b 1
)

REM Avoid Node heap OOM during TypeScript build on large workspaces.
set "DEFAULT_MAX_OLD_SPACE=8192"
if "%NODE_OPTIONS%"=="" (
  set "NODE_OPTIONS=--max-old-space-size=%DEFAULT_MAX_OLD_SPACE%"
) else (
  echo %NODE_OPTIONS% | findstr /C:"--max-old-space-size" >nul
  if errorlevel 1 (
    set "NODE_OPTIONS=%NODE_OPTIONS% --max-old-space-size=%DEFAULT_MAX_OLD_SPACE%"
  )
)
echo Using NODE_OPTIONS=%NODE_OPTIONS%

echo Running build...
call npm run build
if errorlevel 1 goto :error

echo Running bundle...
call npm run bundle
if errorlevel 1 goto :error

echo Installing globally...
call npm link
if errorlevel 1 goto :error

echo Verifying global command...
where mu-cli >nul 2>nul
if errorlevel 1 (
  echo Global link did not expose mu-cli on PATH.
  goto :error
)
call mu-cli --version >nul 2>nul
if errorlevel 1 (
  echo mu-cli command exists but failed to run.
  goto :error
)

echo Done. Global install completed successfully.
popd
exit /b 0

:error
echo Step failed. Aborting.
popd
exit /b 1
