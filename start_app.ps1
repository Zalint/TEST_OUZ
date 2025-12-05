# Script de demarrage de l'application de rappels d'evenements
# Executer avec: .\start_app.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Application de Rappels d'Evenements  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration de la base de donnees PostgreSQL
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "bonea2024"
$env:DB_NAME = "event_reminder"
$env:DB_SSL = "false"

# Configuration du serveur
$env:PORT = "3000"
$env:NODE_ENV = "development"

Write-Host "Configuration chargee:" -ForegroundColor Green
Write-Host "   - DB Host: $env:DB_HOST" -ForegroundColor Gray
Write-Host "   - DB Port: $env:DB_PORT" -ForegroundColor Gray
Write-Host "   - DB Name: $env:DB_NAME" -ForegroundColor Gray
Write-Host "   - DB User: $env:DB_USER" -ForegroundColor Gray
Write-Host "   - Server Port: $env:PORT" -ForegroundColor Gray
Write-Host ""

# Verifier si Node.js est installe
Write-Host "Verification de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "Node.js $nodeVersion detecte" -ForegroundColor Green
} catch {
    Write-Host "Node.js n'est pas installe ou n'est pas dans le PATH!" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js depuis https://nodejs.org" -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}
Write-Host ""

# Verifier si les dependances sont installees
Write-Host "Verification des dependances..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances npm..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors de l'installation des dependances!" -ForegroundColor Red
        Read-Host "Appuyez sur Entree pour quitter"
        exit 1
    }
    Write-Host "Dependances installees avec succes" -ForegroundColor Green
} else {
    Write-Host "Dependances deja installees" -ForegroundColor Green
}
Write-Host ""

# Verifier si le port 3000 est utilise et liberer si necessaire
Write-Host "Verification du port $env:PORT..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort $env:PORT -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "Le port $env:PORT est deja utilise" -ForegroundColor Yellow
    Write-Host "Arret des processus existants..." -ForegroundColor Yellow
    
    $portInUse | ForEach-Object {
        $processId = $_.OwningProcess
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "   Processus $processId arrete" -ForegroundColor Green
        } catch {
            Write-Host "   Impossible d'arreter le processus $processId" -ForegroundColor Yellow
        }
    }
    
    # Attendre un peu que le port se libere
    Start-Sleep -Seconds 2
    Write-Host "Port libere" -ForegroundColor Green
} else {
    Write-Host "Port $env:PORT disponible" -ForegroundColor Green
}
Write-Host ""

# Tester la connexion PostgreSQL
Write-Host "Test de connexion a PostgreSQL..." -ForegroundColor Yellow
$env:PGPASSWORD = $env:DB_PASSWORD

# Chercher psql dans les emplacements communs
$psqlPath = $null
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        break
    }
}

if ($psqlPath) {
    try {
        $testConnection = & $psqlPath -U $env:DB_USER -d $env:DB_NAME -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Connexion PostgreSQL reussie" -ForegroundColor Green
        } else {
            Write-Host "Impossible de se connecter a PostgreSQL" -ForegroundColor Yellow
            Write-Host "La base de donnees sera testee au demarrage du serveur" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Impossible de tester la connexion PostgreSQL" -ForegroundColor Yellow
    }
} else {
    Write-Host "psql.exe non trouve, impossible de tester la connexion" -ForegroundColor Yellow
    Write-Host "La base de donnees sera testee au demarrage du serveur" -ForegroundColor Gray
}
Write-Host ""

# Demarrer le serveur
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Demarrage du serveur..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "L'application sera disponible sur:" -ForegroundColor White
Write-Host "   http://localhost:$env:PORT" -ForegroundColor Cyan
Write-Host "   API: http://localhost:$env:PORT/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour arreter le serveur, appuyez sur Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Demarrer Node.js
try {
    node src/server.js
} catch {
    Write-Host ""
    Write-Host "Erreur lors du demarrage du serveur!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}
