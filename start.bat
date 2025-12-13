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
call npm install 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [INFO] Server dependency installation had issues (expected on Windows)
    echo [INFO] This is usually due to file locks from @stellar/stellar-base
    echo [INFO] Continuing with existing dependencies - this is safe!
    echo.
    echo [TIP] If you need to update packages:
    echo      1. Stop the server (Ctrl+C)
    echo      2. Close all editors/IDEs
    echo      3. Run: cd server ^&^& Remove-Item -Path "node_modules\@stellar" -Recurse -Force
    echo      4. Run: npm install
    echo.
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

REM Copy contract addresses from contract-addresses.env to client/.env
cd ..
if exist contract-addresses.env (
    echo Updating contract addresses in client/.env...
    powershell -Command "$contractEnv = Get-Content contract-addresses.env | Where-Object { $_ -match '^REACT_APP_' }; $clientEnv = if (Test-Path client\.env) { Get-Content client\.env } else { @() }; $clientEnv = $clientEnv | Where-Object { $_ -notmatch '^REACT_APP_(SMART_WALLET_CONTRACT_ID|WEBAUTHN_VERIFIER_CONTRACT_ID)=' }; $clientEnv += $contractEnv | Where-Object { $_ -match '^REACT_APP_(SMART_WALLET_CONTRACT_ID|WEBAUTHN_VERIFIER_CONTRACT_ID)=' }; $clientEnv | Set-Content client\.env"
    echo Contract addresses updated in client/.env
)
cd client

echo.
echo Setup complete! Starting the application...
cd ..
call npm run dev

pause
