@echo off
REM ServiceMate Project Runner
REM This script sets up the database and runs the project

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

REM Check if Java is installed
java -version >nul 2>&1

if %errorLevel% neq 0 (
    echo ERROR: Java 17 not found
    echo Please run setup.bat first
    pause
    exit /b 1
)

REM Check if Maven is installed
call mvn -version >nul 2>&1

if %errorLevel% neq 0 (
    if exist "C:\maven\bin\mvn.cmd" set "PATH=!PATH!;C:\maven\bin"
    if exist "C:\Program Files\maven\apache-maven-4.0.0\bin\mvn.cmd" set "PATH=!PATH!;C:\Program Files\maven\apache-maven-4.0.0\bin"
)

call mvn -version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Maven not found
    echo Please run setup.bat first
    pause
    exit /b 1
)

REM Check if MySQL is installed
mysql --version >nul 2>&1

if %errorLevel% neq 0 (
    REM Search for mysql.exe in common installation directories.
    REM This is more robust than checking for specific versions.
    if exist "C:\Program Files\MySQL" (
        for /f "delims=" %%F in ('dir /b /s "C:\Program Files\MySQL\mysql.exe" 2^>nul') do (
            set "MYSQL_BIN_FILE=%%F"
            goto :found_mysql_search
        )
    )
    if exist "C:\Program Files (x86)\MySQL" (
        for /f "delims=" %%F in ('dir /b /s "C:\Program Files (x86)\MySQL\mysql.exe" 2^>nul') do (
            set "MYSQL_BIN_FILE=%%F"
            goto :found_mysql_search
        )
    )
)
:found_mysql_search
if defined MYSQL_BIN_FILE (
    for %%A in ("%MYSQL_BIN_FILE%") do set "MYSQL_BIN_DIR=%%~dpA"
    set "PATH=!PATH!;!MYSQL_BIN_DIR!"
)

mysql --version >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ATTENTION] MySQL command not found automatically.
    echo.
    echo We need to know where you installed MySQL.
    echo Look for a folder like: C:\Program Files\MySQL\MySQL Server 8.0\bin
    echo.
    set /p "USER_MYSQL_PATH=Please PASTE the full path to your MySQL 'bin' folder here: "
    set "PATH=!PATH!;!USER_MYSQL_PATH!"
)

echo ✓ All prerequisites found
echo.


REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

echo [STEP 1] Starting MySQL Service...
set "mysql_service_started=0"

REM Try starting common MySQL service names. Default for 8.0 is 'MySQL80'.
REM Newer versions or custom installs might just use 'MySQL'.
net start mysql96 >nul 2>&1
if !errorLevel! equ 0 (
    set "mysql_service_started=1"
) else (
    net start MySQL80 >nul 2>&1
    if !errorLevel! equ 0 (
        set "mysql_service_started=1"
    ) else (
        net start MySQL >nul 2>&1
        if !errorLevel! equ 0 set "mysql_service_started=1"
    )
)

if !mysql_service_started! equ 1 (
    echo ✓ MySQL service started (or already running)
) else (
    echo ! Could not start MySQL service automatically.
    echo.
    echo   Please ensure your MySQL service is running before continuing.
    echo   You can check in the Windows 'Services' application.
    pause
)

echo.

:retry_db_init
    echo [STEP 2] Configuring Database...
    echo.
    set "MYSQL_PASS="
    set /p "MYSQL_PASS=Please enter your MySQL root password and press ENTER: "
    echo.

    echo [STEP 3] Initializing Database...
    cd /d "%SCRIPT_DIR%database"
    set "MYSQL_PWD=!MYSQL_PASS!"
    mysql -u root < servicemate_schema.sql
    set "MYSQL_PWD="

    if !errorLevel! neq 0 (
        echo.
        echo ERROR: Database initialization failed ^(Access Denied^).
        echo.
        echo This is usually due to an incorrect password.
        set /p "RETRY=Would you like to try entering the password again? (Y/N): "
        if /i "!RETRY!"=="Y" (
            goto :retry_db_init
        )
        echo Exiting. Please check your MySQL password and service status.
        pause
        exit /b 1
    )

echo.
echo ✓ Database initialized successfully.
echo.

echo [STEP 4] Configuring Backend...
echo.
set "PROPERTIES_FILE=%SCRIPT_DIR%backend\src\main\resources\application.properties"

if exist "%PROPERTIES_FILE%" (
    echo Updating database password in application.properties...
    powershell -Command "$pass=$env:MYSQL_PASS; (Get-Content -Path '%PROPERTIES_FILE%') -replace '^(spring.datasource.password=).*$', ('$1'+$pass) | Set-Content -Path '%PROPERTIES_FILE%'"
    echo ✓ Backend configured successfully.
) else (
    echo ✗ application.properties not found.
    pause
    exit /b 1
)

echo.
echo [STEP 5] Building Backend (First time may take 3-5 minutes)...
echo.

cd /d "%SCRIPT_DIR%backend"
set "BUILD_SUCCESS=0"
call mvn clean install && set "BUILD_SUCCESS=1"

REM The build may succeed with warnings, which is okay for our purposes. We will proceed.

if !BUILD_SUCCESS! equ 1 (
    echo.
    echo ========================================
    echo   ✓ BUILD SUCCESSFUL
    echo ========================================
    echo.
) else (
    echo.
    echo   ✗ BUILD FAILED
    echo.
)

echo [STEP 5] Starting Spring Boot Application...
echo Waiting for backend to start (10-15 seconds)...
echo.
echo Once you see "Tomcat started on port(s): 8080" the project is running!
echo.
echo Then open your browser to:
echo http://localhost:8080/login.html
echo.
echo   Customer: customer@servicemate.com / 123456
echo   Provider: provider@servicemate.com / 123456
echo   Admin:    admin@servicemate.com    / 123456
echo.
echo Press ENTER to start the application...
pause

if !BUILD_SUCCESS! equ 0 (
    exit /b 1
)

cd /d "%SCRIPT_DIR%backend"
call mvn spring-boot:run

REM When mvn spring-boot:run exits, show this message
echo.
echo ========================================
echo   Application Stopped
echo ========================================
echo.
pause
pause
pause
