@echo off
REM Rebuild both webauthn-verifier and smart-wallet contracts

echo ========================================
echo Rebuilding All Contracts
echo ========================================
echo.

echo [1/2] Building WebAuthn Verifier Contract...
cd soroban-contracts\webauthn-verifier
cargo clean
cargo build --target wasm32-unknown-unknown --release

if %ERRORLEVEL% NEQ 0 (
    echo ❌ WebAuthn Verifier build failed!
    exit /b 1
)

echo ✅ WebAuthn Verifier build successful!
echo 📦 WASM: target\wasm32-unknown-unknown\release\webauthn_verifier.wasm
echo.

cd ..\..

echo [2/2] Building Smart Wallet Contract...
cd soroban-contracts
cargo clean
cargo build --target wasm32-unknown-unknown --release

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Smart Wallet build failed!
    exit /b 1
)

echo ✅ Smart Wallet build successful!
echo 📦 WASM: target\wasm32-unknown-unknown\release\smart_wallet.wasm
echo.

cd ..

echo ========================================
echo ✅ All contracts built successfully!
echo ========================================
echo.
echo 📦 WASM Files Ready for Deployment:
echo.
echo   1. WebAuthn Verifier:
echo      soroban-contracts\webauthn-verifier\target\wasm32-unknown-unknown\release\webauthn_verifier.wasm
echo.
echo   2. Smart Wallet:
echo      soroban-contracts\target\wasm32-unknown-unknown\release\smart_wallet.wasm
echo.
echo 📋 Next Steps:
echo   1. Deploy WebAuthn Verifier first (using Stellar Lab)
echo   2. Deploy Smart Wallet (using Stellar Lab)
echo   3. Initialize Smart Wallet with WebAuthn Verifier address
echo.

