#!/bin/bash
# Clean and rebuild the Soroban contract
# Based on Stella's recommendation for complete rebuild

echo "🧹 Cleaning previous build..."
cd soroban-contracts
cargo clean

echo "🔨 Building contract (release mode)..."
cargo build --target wasm32-unknown-unknown --release

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📦 WASM file location:"
    echo "   target/wasm32-unknown-unknown/release/smart_wallet.wasm"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Deploy the contract:"
    echo "      stellar contract deploy \\"
    echo "        --wasm target/wasm32-unknown-unknown/release/smart_wallet.wasm \\"
    echo "        --source YOUR_ACCOUNT \\"
    echo "        --network testnet"
    echo ""
    echo "   2. Verify the contract signature:"
    echo "      stellar contract inspect --id YOUR_CONTRACT_ID --network testnet"
    echo ""
    echo "   3. Test via CLI:"
    echo "      See test-contract-cli.sh"
else
    echo "❌ Build failed!"
    exit 1
fi

