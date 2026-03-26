@echo off
REM ServiceMate Project Runner
REM This script runs the project using Docker Compose

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   ServiceMate - Project Runner
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if !errorLevel! neq 0 (
    echo ERROR: This script must be run as Administrator to start services.
    echo.
    echo Solution:
    echo 1. Right-click on Command Prompt or this script
    echo 2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Docker is not installed or not in your PATH.
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Desktop is running
docker info >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Docker Desktop is not running or still starting up.
    echo.
    echo Solution: 
    echo 1. Open Docker Desktop from your Start Menu.
    echo 2. Wait for the status bar at the bottom-left to turn GREEN ("Engine Running").
    echo 3. Once green, run this script again.
    echo.
    pause
    exit /b 1
)

echo ✓ Docker Engine is READY (Green Status Detected)
echo.

echo [STEP 1] Stopping any existing containers...
docker-compose down
echo.

echo [STEP 2] Building and Starting Services...
echo This will build the backend and pull the MySQL image.
echo.

REM Use docker-compose up with --build to ensure latest code is used
docker-compose up --build -d

if !errorLevel! neq 0 (
    echo.
    echo ERROR: Docker Compose failed to start.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✓ SERVICES STARTED IN BACKGROUND
echo ========================================
echo.
echo Waiting for backend to initialize (approx 20-30 seconds)...
echo.
echo Then open your browser to:
echo http://localhost:8080/login.html
echo.
echo   Customer: customer@servicemate.com / 123456
echo   Provider: provider@servicemate.com / 123456
echo   Admin:    admin@servicemate.com    / 123456
echo.
echo [TIP] To see the live logs, run: docker logs -f servicemate-app
echo.
echo Press any key to view the logs now (Ctrl+C to stop viewing)...
pause > nul
docker logs -f servicemate-app

REM When mvn spring-boot:run exits, show this message
echo.
echo ========================================
echo   Docker Session Ended
echo ========================================
