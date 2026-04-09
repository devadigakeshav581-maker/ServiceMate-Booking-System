@echo off
REM ServiceMate Project Runner
REM This script runs the project using Docker Compose

setlocal enabledelayedexpansion

REM Ensure the script runs from its own directory (critical after UAC elevation)
cd /d "%~dp0"

echo.
echo ========================================
echo   ServiceMate - Project Runner
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if "%errorlevel%" neq "0" (
    echo Requesting administrative privileges...
    REM Using cmd /k ensures the new window stays open if an error occurs
    powershell -Command "Start-Process cmd -ArgumentList '/c %~s0' -Verb RunAs"
    exit /b
)

REM Check if Docker is installed
docker --version >nul 2>&1
if "%errorlevel%" neq "0" (
    echo ERROR: Docker is not installed or not in your PATH.
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Desktop is running
docker info >nul 2>&1
if "%errorlevel%" neq "0" (
    echo ERROR: Docker Desktop is not running or still starting up.
    echo.
    echo Solution: 
    echo 1. Open Docker Desktop from your Start Menu.
    echo 2. Wait for the status bar at the bottom-left to turn GREEN ^("Engine Running"^).
    echo 3. Once green, run this script again.
    echo.
    pause
    exit /b 1
)

echo ✓ Docker Engine is READY (Green Status Detected)
echo.

echo [STEP 1] Stopping any existing containers...
REM Force stop and remove all potential conflicting containers
docker stop servicemate-app servicemate-db servicemate-ui >nul 2>&1
docker rm -f servicemate-app servicemate-db servicemate-ui >nul 2>&1
REM Clean up any dangling networks or orphaned containers from this project
docker network prune -f >nul 2>&1

REM The -v flag removes volumes, ensuring the DB re-initializes with fresh SQL scripts
docker compose -p servicemate down -v --remove-orphans
echo Waiting for resource cleanup...
timeout /t 3 /nobreak >nul
echo.

echo [STEP 2] Cleaning and Building Services...
echo This will build the backend and pull the MySQL image.
echo.

REM Attempt to clean the backend target folder if Maven is available
REM This prevents "Permission Denied" errors caused by host-owned artifacts
pushd backend
call mvn -version >nul 2>&1
if "%errorlevel%" equ "0" (
    echo [INFO] Attempting to build backend on host to cache dependencies...
    call mvn clean package -DskipTests
    if "%errorlevel%" neq "0" (
        echo [WARN] Host build failed. This is usually due to network timeouts.
        echo        Try running 'mvn clean package -DskipTests' inside the backend folder manually.
    )
)
popd

REM Use --build and --force-recreate to ensure a fresh environment
docker compose -p servicemate up --build --force-recreate -d

if "%errorlevel%" neq "0" (
    echo.
    echo ERROR: Docker Compose failed to start.
    echo.
    echo [TIP] If you see "SSL peer shut down", your internet connection is too slow or unstable.
    echo 1. Disable any VPN or Proxy.
    echo 2. Run: docker builder prune -f
    echo 3. Try running this script again.
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
echo http://localhost
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
