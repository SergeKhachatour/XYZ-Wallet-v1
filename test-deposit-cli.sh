#!/bin/bash
# Test deposit function via Stellar CLI
# This will help us see the actual contract response

CONTRACT_ID="${1:-CDACXEF4GFCT5DUUVDBAL3X5DE7ROHRQHW7ML6D4F5NVFNH4A2ID2KHG}"
SOURCE_ACCOUNT="${2:-GANOB3BOX23UYI5BBT4QAGY2D2BLB7INGMEVMZJ57O2QCEVQGJHBHDNO}"

echo "🧪 Testing contract functions via CLI..."
echo "Contract ID: $CONTRACT_ID"
echo "Source Account: $SOURCE_ACCOUNT"
echo ""

# First, test get_passkey_pubkey to see if signer is registered
echo "1️⃣ Testing get_passkey_pubkey (check if signer is registered)..."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$SOURCE_ACCOUNT" \
  --network testnet \
  -- \
  get_passkey_pubkey \
  --signer_address "$SOURCE_ACCOUNT"

echo ""
echo ""
echo "2️⃣ Testing get_balance (check current balance)..."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$SOURCE_ACCOUNT" \
  --network testnet \
  -- \
  get_balance \
  --user_address "$SOURCE_ACCOUNT" \
  --asset "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

echo ""
echo ""
echo "✅ Test complete. Check the output above to see:"
echo "   - If signer is registered (get_passkey_pubkey should return bytes, not void)"
echo "   - Current balance (get_balance should return i128)"

