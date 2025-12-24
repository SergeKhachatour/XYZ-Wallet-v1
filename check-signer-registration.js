/**
 * Quick script to check if a signer is registered on the smart wallet contract
 * 
 * Usage:
 *   node check-signer-registration.js <user_public_key>
 * 
 * Or with environment variables:
 *   USER_PUBLIC_KEY=GDPMUX3X4AXOFWMWW74IOAM4ZM4VHOPJS6ZVXYNENSE447MQSXKJ5OGA \
 *   SMART_WALLET_ID=CAAQTGMXO6VS7HUYH7YLBVSI6T64WWHAPQDR6QEO7EVEOD4CR3H3565U \
 *   node check-signer-registration.js
 */

const StellarSdk = require('@stellar/stellar-sdk');

// Configuration
const SMART_WALLET_ID = process.env.SMART_WALLET_ID || 'CAAQTGMXO6VS7HUYH7YLBVSI6T64WWHAPQDR6QEO7EVEOD4CR3H3565U';
const USER_PUBLIC_KEY = process.env.USER_PUBLIC_KEY || process.argv[2];
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

async function checkSignerRegistration() {
  try {
    if (!USER_PUBLIC_KEY) {
      throw new Error('USER_PUBLIC_KEY is required. Usage: node check-signer-registration.js <user_public_key>');
    }

    console.log('🔍 Checking signer registration...');
    console.log(`   Smart Wallet: ${SMART_WALLET_ID}`);
    console.log(`   User Address: ${USER_PUBLIC_KEY}`);
    console.log('');

    // Connect to Soroban RPC
    const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
    console.log(`✅ Connected to Soroban RPC: ${RPC_URL}`);

    // Create contract instance
    const contract = new StellarSdk.Contract(SMART_WALLET_ID);

    // Create user address ScVal
    const userAddressBytes = StellarSdk.StrKey.decodeEd25519PublicKey(USER_PUBLIC_KEY);
    const userScAddress = StellarSdk.xdr.ScAddress.scAddressTypeAccount(
      StellarSdk.xdr.PublicKey.publicKeyTypeEd25519(userAddressBytes)
    );
    const userScVal = StellarSdk.xdr.ScVal.scvAddress(userScAddress);

    // Check if signer is registered
    console.log('📞 Calling is_signer_registered...');
    const checkOp = contract.call('is_signer_registered', userScVal);

    // Build transaction (read-only simulation)
    const transaction = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account(USER_PUBLIC_KEY, '0'),
      {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE
      }
    )
      .addOperation(checkOp)
      .setTimeout(30)
      .build();

    // Simulate the call
    const result = await server.simulateTransaction(transaction);

    if (result.errorResultXdr) {
      console.error('❌ Simulation error:', result.errorResultXdr);
      process.exit(1);
    }

    if (!result.result || !result.result.retval) {
      console.error('❌ No result from simulation');
      console.error('Result:', JSON.stringify(result, null, 2));
      process.exit(1);
    }

    // Parse result
    let retval = result.result.retval;
    if (typeof retval === 'string') {
      retval = StellarSdk.xdr.ScVal.fromXDR(retval, 'base64');
    }

    let isRegistered = false;
    if (retval && retval.switch) {
      const switchName = retval.switch().name;
      if (switchName === 'scvBool') {
        if (typeof retval.b === 'function') {
          isRegistered = retval.b();
        } else if (retval.value !== undefined) {
          isRegistered = retval.value === true;
        } else if (retval._value !== undefined) {
          isRegistered = retval._value === true;
        } else {
          const boolValue = retval.b;
          isRegistered = boolValue === true || boolValue === 1;
        }
      }
    }

    console.log('');
    if (isRegistered) {
      console.log('✅ Signer IS registered on the smart wallet contract');
      
      // Try to get the passkey pubkey
      console.log('');
      console.log('📞 Getting passkey public key...');
      const getPubkeyOp = contract.call('get_passkey_pubkey', userScVal);
      const getPubkeyTx = new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(USER_PUBLIC_KEY, '0'),
        {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: NETWORK_PASSPHRASE
        }
      )
        .addOperation(getPubkeyOp)
        .setTimeout(30)
        .build();
      
      const pubkeyResult = await server.simulateTransaction(getPubkeyTx);
      if (pubkeyResult.result && pubkeyResult.result.retval) {
        let pubkeyRetval = pubkeyResult.result.retval;
        if (typeof pubkeyRetval === 'string') {
          pubkeyRetval = StellarSdk.xdr.ScVal.fromXDR(pubkeyRetval, 'base64');
        }
        
        if (pubkeyRetval && pubkeyRetval.switch && pubkeyRetval.switch().name === 'scvBytes') {
          const pubkeyBytes = pubkeyRetval.b();
          console.log(`✅ Passkey public key found: ${pubkeyBytes.length} bytes`);
          console.log(`   First bytes: ${pubkeyBytes.slice(0, 10).toString('hex')}...`);
        } else {
          console.log('⚠️  Could not parse passkey public key');
        }
      }
    } else {
      console.log('❌ Signer is NOT registered on the smart wallet contract');
      console.log('');
      console.log('💡 You need to register the signer first. This can be done through:');
      console.log('   1. GeoLink (if configured with the new contract addresses)');
      console.log('   2. The deposit endpoint (it will auto-register if needed)');
      console.log('   3. The /execute-transaction endpoint with register=true');
    }

  } catch (error) {
    console.error('');
    console.error('❌ Error checking signer registration:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run check
checkSignerRegistration();

