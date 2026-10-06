@echo off
echo ========================================================
echo Campus-Glide GitHub Auto-Pusher
echo ========================================================

:: Check if git is installed
git --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed or not added to your system PATH!
    echo Please install Git from https://git-scm.com/downloads 
    echo Once installed, close this window and try again.
    pause
    exit /b
)

echo [INFO] Git is installed. Initializing repository...
git init

echo [INFO] Adding files to git...
git add .

echo [INFO] Committing code...
git commit -m "Complete MERN College Bus Tracking System"

echo [INFO] Renaming branch to main...
git branch -M main

echo [INFO] Adding remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/sanjay-13-web/Campus-Glide.git

echo [INFO] Pushing code to GitHub...
git push -u origin main

echo ========================================================
echo [SUCCESS] If there were no errors above, your code has been successfully pushed to GitHub!
echo ========================================================
pause
