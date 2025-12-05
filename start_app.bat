@echo off
REM Script de demarrage de l'application de rappels d'evenements
REM Executer avec: start_app.bat

echo ========================================
echo   Application de Rappels d'Evenements  
echo ========================================
echo.

REM Configuration de la base de donnees PostgreSQL
set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=postgres
set DB_PASSWORD=bonea2024
set DB_NAME=event_reminder
set DB_SSL=false

REM Configuration du serveur
set PORT=3000
set NODE_ENV=development

echo Configuration chargee:
echo    - DB Host: %DB_HOST%
echo    - DB Port: %DB_PORT%
echo    - DB Name: %DB_NAME%
echo    - DB User: %DB_USER%
echo    - Server Port: %PORT%
echo.

echo Verification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Erreur: Node.js n'est pas installe ou n'est pas dans le PATH!
    echo Veuillez installer Node.js depuis https://nodejs.org
    pause
    exit /b 1
)
echo Node.js detecte
echo.

echo Verification des dependances...
if not exist "node_modules" (
    echo Installation des dependances npm...
    call npm install
    if %errorlevel% neq 0 (
        echo Erreur lors de l'installation des dependances!
        pause
        exit /b 1
    )
    echo Dependances installees avec succes
) else (
    echo Dependances deja installees
)
echo.

echo ========================================
echo Demarrage du serveur...
echo ========================================
echo.
echo L'application sera disponible sur:
echo    http://localhost:%PORT%
echo    API: http://localhost:%PORT%/api
echo.
echo Pour arreter le serveur, appuyez sur Ctrl+C
echo.
echo ========================================
echo.

REM Demarrer Node.js
node src/server.js

if %errorlevel% neq 0 (
    echo.
    echo Erreur lors du demarrage du serveur!
    pause
    exit /b 1
)

