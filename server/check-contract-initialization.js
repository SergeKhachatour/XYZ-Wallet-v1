/**
 * Check if Smart Wallet Contract is Initialized
 * 
 * This script checks if the smart wallet contract has been initialized
 * by attempting to read the verifier address from instance storage.
 * 
 * Usage:
 *   node check-contract-initialization.js
 * 
 * Or with custom values:
 *   SMART_WALLET_ID=CA7G33NKXPBMSRRKS4PVBCE56OZDXGQCDUEBJ36NX7NS6RXGBSSMNX6P \
 *   SECRET_KEY=your_secret_key \
 *   node check-contract-initialization.js
 */

const StellarSdk = require('@stellar/stellar-sdk');

// Contract addresses (update these if needed)
const SMART_WALLET_ID = process.env.SMART_WALLET_ID || 'CA7G33NKXPBMSRRKS4PVBCE56OZDXGQCDUEBJ36NX7NS6RXGBSSMNX6P';
const SECRET_KEY = process.env.SECRET_KEY || process.env.STELLAR_SECRET_KEY;

// Network configuration
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const RPC_URL = 'https://soroban-testnet.stellar.org';

async function checkInitialization() {
  try {
    if (!SECRET_KEY) {
      throw new Error('SECRET_KEY or STELLAR_SECRET_KEY environment variable is required');
    }

    console.log('🔍 Checking Smart Wallet Contract Initialization...');
    console.log(`   Smart Wallet ID: ${SMART_WALLET_ID}`);
    console.log('');

    // Create keypair from secret
    const keypair = StellarSdk.Keypair.fromSecret(SECRET_KEY);
    const publicKey = keypair.publicKey();
    console.log(`✅ Using account: ${publicKey}`);

    // Connect to Soroban RPC
    const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
    console.log(`✅ Connected to Soroban RPC: ${RPC_URL}`);

    // Get account sequence
    const account = await server.getAccount(publicKey);
    const sequence = account.sequenceNumber();
    console.log(`✅ Account sequence: ${sequence}`);

    // Create contract instance
    const contract = new StellarSdk.Contract(SMART_WALLET_ID);

    // Try to call get_verifier_address to check if initialized
    console.log('📝 Calling get_verifier_address() to check initialization...');
    const getVerifierOp = contract.call('get_verifier_address');

    // Build transaction
    const transaction = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account(publicKey, sequence),
      {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE
      }
    )
      .addOperation(getVerifierOp)
      .setTimeout(30)
      .build();

    // Prepare transaction
    console.log('⏳ Preparing transaction...');
    const preparedTx = await server.prepareTransaction(transaction);
    console.log('✅ Transaction prepared');

    // Simulate transaction (doesn't require signing)
    console.log('🔍 Simulating transaction to check initialization...');
    const simulation = await server.simulateTransaction(preparedTx);

    // Check simulation result
    if (simulation.errorResultXdr) {
      console.log('');
      console.log('❌ Contract appears to NOT be initialized!');
      console.log('   Error:', simulation.errorResultXdr);
      console.log('');
      console.log('💡 Solution: Run the initialization script:');
      console.log(`   SMART_WALLET_ID=${SMART_WALLET_ID} \\`);
      console.log('   WEBAUTHN_VERIFIER_ID=CARLXTWOUIRQVQILCBSA3CNG6QIVO3PIPKF66LDHQXGQGUAAWPFLND3L \\');
      console.log(`   SECRET_KEY=your_secret_key \\`);
      console.log('   node initialize-smart-wallet.js');
      process.exit(1);
    }

    // Try to parse the result
    try {
      let resultScVal;
      if (simulation.result && simulation.result.retval) {
        if (typeof simulation.result.retval === 'string') {
          resultScVal = StellarSdk.xdr.ScVal.fromXDR(simulation.result.retval, 'base64');
        } else {
          resultScVal = simulation.result.retval;
        }

        if (resultScVal && resultScVal.switch) {
          const switchName = resultScVal.switch().name;
          if (switchName === 'scvAddress') {
            const addressBytes = resultScVal.address().contractId();
            const address = StellarSdk.StrKey.encodeContract(addressBytes);
            console.log('');
            console.log('✅ Contract IS initialized!');
            console.log(`   Verifier Address: ${address}`);
            console.log('');
            
            if (address === 'CARLXTWOUIRQVQILCBSA3CNG6QIVO3PIPKF66LDHQXGQGUAAWPFLND3L') {
              console.log('✅ Verifier address matches expected value!');
            } else {
              console.log('⚠️  Verifier address does NOT match expected value!');
              console.log('   Expected: CARLXTWOUIRQVQILCBSA3CNG6QIVO3PIPKF66LDHQXGQGUAAWPFLND3L');
              console.log(`   Got:      ${address}`);
            }
            process.exit(0);
          }
        }
      }
      
      console.log('');
      console.log('⚠️  Could not parse result, but simulation succeeded.');
      console.log('   The contract may be initialized, but we cannot verify the address.');
      console.log('   Full simulation result:', JSON.stringify(simulation, null, 2));
    } catch (parseError) {
      console.log('');
      console.log('⚠️  Error parsing result:', parseError.message);
      console.log('   Full simulation result:', JSON.stringify(simulation, null, 2));
    }

  } catch (error) {
    console.error('');
    console.error('❌ Failed to check contract initialization:');
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Response: ${JSON.stringify(error.response, null, 2)}`);
    }
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run check
checkInitialization();

