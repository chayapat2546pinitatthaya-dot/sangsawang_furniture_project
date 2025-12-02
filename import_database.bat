@echo off
echo Importing sangsawang_furniture database...
echo.

REM Path to MySQL in XAMPP (adjust if your XAMPP is in different location)
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
set SQL_FILE=c:\Users\chaya\Documents\sangsawang_furniture.sql

REM Check if MySQL exists
if not exist "%MYSQL_PATH%" (
    echo MySQL not found at %MYSQL_PATH%
    echo Please adjust the MYSQL_PATH in this script to match your XAMPP installation
    pause
    exit /b 1
)

REM Import the database
echo Importing SQL file...
"%MYSQL_PATH%" -u root -e "CREATE DATABASE IF NOT EXISTS sangsawang_furniture CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
"%MYSQL_PATH%" -u root sangsawang_furniture < "%SQL_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Database imported successfully!
    echo You can now access it in phpMyAdmin at http://localhost/phpmyadmin
) else (
    echo.
    echo Error importing database. Please check the error messages above.
)

echo.
pause


