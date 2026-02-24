@echo off
title Documentation Updater

:: Always run from the folder where this .bat file lives
cd /d "%~dp0"

echo =====================================================
echo   GitHub Change-Tracker ^& Documentation Updater
echo =====================================================
echo.
echo  This script will:
echo   1. Connect to the client GitHub repo
echo   2. Detect what files changed since last run
echo   3. Write a change log in CHANGELOG_LOG\
echo   4. Update only the changed documentation files
echo.
echo  TIP: You can also run with flags:
echo    run_doc_update.bat --dry-run    (preview only, no files written)
echo    run_doc_update.bat --reset      (reprocess all files from scratch)
echo.

:: Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    echo  [Setup] Activating virtual environment...
    call venv\Scripts\activate.bat
)

echo  Running...
echo.
python update_docs.py %*
echo.
if %errorlevel% equ 0 (
    echo [SUCCESS] Done! Check CHANGELOG_LOG\ for what changed.
) else (
    echo [ERROR] Something went wrong. Check the output above.
)
echo.
pause