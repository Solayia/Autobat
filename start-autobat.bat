@echo off
echo ========================================
echo   AUTOBAT - Demarrage Complet
echo ========================================
echo.

REM Demarrer Docker Desktop
echo [1/5] Demarrage Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
timeout /t 45 /nobreak

REM Verifier Docker
echo [2/5] Verification Docker...
docker --version
if errorlevel 1 (
    echo ERREUR: Docker ne repond pas. Verifiez que Docker Desktop est ouvert.
    pause
    exit /b 1
)

REM Demarrer PostgreSQL
echo [3/5] Demarrage PostgreSQL...
cd /d "%~dp0"
docker-compose up -d
timeout /t 15 /nobreak

REM Creer la base de donnees
echo [4/5] Creation base de donnees...
cd backend
call npm run migrate
if errorlevel 1 (
    echo ERREUR: Migration echouee. Verifiez que PostgreSQL est pret.
    pause
    exit /b 1
)

REM Demarrer le backend
echo [5/5] Demarrage backend...
start "Autobat Backend" cmd /k "npm run dev"

echo.
echo ========================================
echo   AUTOBAT DEMARRE !
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo.
echo Le backend demarre dans une nouvelle fenetre.
echo Le frontend est deja actif depuis Vite.
echo.
pause
