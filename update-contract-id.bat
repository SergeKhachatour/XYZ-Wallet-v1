@echo off
echo Updating contract ID in client/.env...
echo.

REM Extract contract ID from contract-addresses.env
for /f "tokens=2 delims==" %%a in ('findstr /C:"REACT_APP_SMART_WALLET_CONTRACT_ID=" contract-addresses.env') do (
    set NEW_CONTRACT_ID=%%a
)

if not defined NEW_CONTRACT_ID (
    echo ERROR: Could not find REACT_APP_SMART_WALLET_CONTRACT_ID in contract-addresses.env
    pause
    exit /b 1
)

echo Found new contract ID: %NEW_CONTRACT_ID%
echo.

REM Update client/.env if it exists
if exist client\.env (
    echo Updating client/.env...
    powershell -Command "(Get-Content client\.env) -replace 'REACT_APP_SMART_WALLET_CONTRACT_ID=.*', 'REACT_APP_SMART_WALLET_CONTRACT_ID=%NEW_CONTRACT_ID%' | Set-Content client\.env"
    echo Contract ID updated in client/.env
) else (
    echo client/.env does not exist. Creating it from contract-addresses.env...
    findstr /C:"REACT_APP_" contract-addresses.env > client\.env
    echo Created client/.env with contract addresses
)

echo.
echo Done! New contract ID: %NEW_CONTRACT_ID%
pause

