@echo off
REM ServiceMate Installation Script for Windows
REM This script will help install Java 17, Maven 4.0, and MySQL 8.0

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   ServiceMate - Automated Setup
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if !errorLevel! neq 0 (
    echo ERROR: This script must be run as Administrator
    echo.
    echo Solution:
    echo 1. Right-click on Command Prompt
    echo 2. Select "Run as administrator"
    echo 3. Navigate to this script location
    echo 4. Run: setup.bat
    echo.
    pause
    exit /b 1
)

goto :main

REM Function to check for and install a package using Winget
:installWithWinget
    set "tool_name=%~1"
    set "check_command=%~2"
    set "winget_id=%~3"

    echo.
    echo [STEP] Checking for !tool_name!...
    call %check_command% >nul 2>&1
    if !errorLevel! equ 0 (
        echo ✓ !tool_name! is already installed.
        call %check_command%
    ) else (
        echo ✗ !tool_name! NOT found.
        winget --version >nul 2>&1
        if !errorLevel! equ 0 (
            echo    -> Attempting to install with Winget ^(this may take a few minutes^)...
            winget install --id !winget_id! -e --accept-package-agreements --accept-source-agreements
            if !errorLevel! neq 0 (
                echo ERROR: Winget installation failed for !tool_name!. Please install it manually.
            )
        ) else (
            echo WARNING: Winget not found. Please install !tool_name! manually.
        )
    )
    goto :eof


REM --- Main Installation Steps ---
:main

call :installWithWinget "Java 17" "java -version" "Microsoft.OpenJDK.17"

REM For Maven, try to add common paths before checking
if exist "C:\Program Files\maven\apache-maven-4.0.0\bin" set "PATH=!PATH!;C:\Program Files\maven\apache-maven-4.0.0\bin"
if exist "C:\maven\bin" set "PATH=!PATH!;C:\maven\bin"
call :installWithWinget "Maven 4.0" "mvn -version" "Apache.Maven"

call :installWithWinget "MySQL 8.0" "mysql --version" "Oracle.MySQL.Server.8.0"

REM After installing, MySQL installer needs to be configured manually
mysql --version >nul 2>&1
if !errorLevel! neq 0 (
    echo.
    echo IMPORTANT: MySQL was installed but requires initial configuration.
    echo Please search for "MySQL Installer" in your Start Menu, run it,
    echo and follow the prompts to configure the server and set a root password.
)

echo.
echo ========================================
echo   Verification Check
echo ========================================
echo.

set all_found=1

java -version >nul 2>&1
if !errorLevel! equ 0 (
    echo ✓ Java Found
) else (
    echo ✗ Java NOT Found
    set all_found=0
)

mvn -version >nul 2>&1
if !errorLevel! equ 0 (
    echo ✓ Maven Found
) else (
    set "path_updated_manually=0"
    set "MAVEN_PATH="
    if exist "C:\maven\bin\mvn.cmd" set "MAVEN_PATH=C:\maven\bin"
    if exist "C:\Program Files\maven\apache-maven-4.0.0\bin\mvn.cmd" set "MAVEN_PATH=C:\Program Files\maven\apache-maven-4.0.0\bin"
    
    if defined MAVEN_PATH (
        echo    -> Maven found at !MAVEN_PATH! but not in PATH.
        echo    -> Adding to system PATH permanently...
        powershell -Command "$p=[Environment]::GetEnvironmentVariable('Path', 'Machine'); $mavenPath = '!MAVEN_PATH!'; if (-not (($p -split ';') -contains $mavenPath)) { [Environment]::SetEnvironmentVariable('Path', $p + ';' + $mavenPath, 'Machine'); Write-Host 'SUCCESS: Maven has been added to the system PATH.' -ForegroundColor Green } else { Write-Host 'INFO: Maven is already in the system PATH.' -ForegroundColor Yellow }"
        set "path_updated_manually=1"
    )

    if !path_updated_manually! equ 1 (
        echo.
        echo IMPORTANT: The system PATH was updated.
        echo            You MUST close this window and open a new terminal
        echo            to use the 'mvn' command.
        echo ✓ Maven will be available in a new terminal.
    ) else (
        echo ✗ Maven NOT Found. Please install it or check your PATH.
        set all_found=0
    )
)

mysql --version >nul 2>&1
if !errorLevel! equ 0 (
    echo ✓ MySQL Found
) else (
    set "MYSQL_BIN_PATH="
    REM Search for mysql.exe in the default installation directory and exit loop once found
    if exist "C:\Program Files\MySQL" (
        for /f "delims=" %%F in ('dir /b /s "C:\Program Files\MySQL\mysql.exe" 2^>nul') do (
            for %%D in ("%%F") do set "MYSQL_BIN_PATH=%%~dpD"
            goto :found_mysql_path
        )
    )
    if exist "C:\Program Files (x86)\MySQL" (
        for /f "delims=" %%F in ('dir /b /s "C:\Program Files (x86)\MySQL\mysql.exe" 2^>nul') do (
            for %%D in ("%%F") do set "MYSQL_BIN_PATH=%%~dpD"
            goto :found_mysql_path
        )
    )
    :found_mysql_path

    if defined MYSQL_BIN_PATH (
        set "MYSQL_BIN_PATH=!MYSQL_BIN_PATH:~0,-1!" REM Remove trailing backslash
        echo    -> MySQL found at !MYSQL_BIN_PATH! but not in PATH.
        echo    -> Adding to system PATH permanently...
        powershell -Command "$p=[Environment]::GetEnvironmentVariable('Path', 'Machine'); $mysqlPath = '!MYSQL_BIN_PATH!'; if (-not (($p -split ';') -contains $mysqlPath)) { [Environment]::SetEnvironmentVariable('Path', $p + ';' + $mysqlPath, 'Machine'); Write-Host 'SUCCESS: MySQL has been added to the system PATH.' -ForegroundColor Green } else { Write-Host 'INFO: MySQL is already in the system PATH.' -ForegroundColor Yellow }"

        echo.
        echo IMPORTANT: The system PATH was updated.
        echo            You MUST close this window and open a new terminal
        echo            to use the 'mysql' command.
        echo ✓ MySQL will be available in a new terminal.
    ) else (
        echo ✗ MySQL NOT Found. Please install and configure it manually.
        set all_found=0
    )
)

echo.

if !all_found! equ 1 (
    echo ========================================
    echo   ✓ ALL REQUIREMENTS INSTALLED!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Close this window
    echo 2. Run: run-project.bat
    echo.
) else (
    echo ========================================
    echo   ✗ SOME REQUIREMENTS MISSING
    echo ========================================
    echo.
    echo Please address any errors above. For manual installs,
    echo ensure the tool is added to your system's PATH.
    echo Then run this script again.
    echo.
)

pause
