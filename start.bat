@echo off
echo Starting XYZ Stellar Wallet...
echo.

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Failed to install server dependencies
    pause
    exit /b 1
)

echo.
echo Installing client dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo Failed to install client dependencies
    pause
    exit /b 1
)

echo.
echo Setting up environment files...
cd ..\server
if not exist .env (
    copy env.example .env
    echo Created server .env file
)

cd ..\client
if not exist .env (
    copy env.example .env
    echo Created client .env file
)

echo.
echo Setup complete! Starting the application...
cd ..
call npm run dev

pause
