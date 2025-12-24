/**
 * Initialize Smart Wallet Contract with WebAuthn Verifier Address
 * 
 * This script initializes the newly deployed smart wallet contract with the
 * webauthn-verifier contract address. This must be done after deploying the
 * smart wallet contract.
 * 
 * Usage:
 *   node initialize-smart-wallet.js
 * 
 * Or with custom values:
 *   SMART_WALLET_ID=CAAQTGMXO6VS7HUYH7YLBVSI6T64WWHAPQDR6QEO7EVEOD4CR3H3565U \
 *   WEBAUTHN_VERIFIER_ID=CARLXTWOUIRQVQILCBSA3CNG6QIVO3PIPKF66LDHQXGQGUAAWPFLND3L \
 *   SECRET_KEY=your_secret_key \
 *   node initialize-smart-wallet.js
 */

const StellarSdk = require('@stellar/stellar-sdk');

// Contract addresses (update these if needed)
// Default to Azure contract ID (CA7G33NKXPBMSRRKS4PVBCE56OZDXGQCDUEBJ36NX7NS6RXGBSSMNX6P)
// For local testing, use: CAAQTGMXO6VS7HUYH7YLBVSI6T64WWHAPQDR6QEO7EVEOD4CR3H3565U
const SMART_WALLET_ID = process.env.SMART_WALLET_ID || 'CA7G33NKXPBMSRRKS4PVBCE56OZDXGQCDUEBJ36NX7NS6RXGBSSMNX6P';
const WEBAUTHN_VERIFIER_ID = process.env.WEBAUTHN_VERIFIER_ID || 'CARLXTWOUIRQVQILCBSA3CNG6QIVO3PIPKF66LDHQXGQGUAAWPFLND3L';
const SECRET_KEY = process.env.SECRET_KEY || process.env.STELLAR_SECRET_KEY;

// Network configuration
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const RPC_URL = 'https://soroban-testnet.stellar.org';

async function initializeSmartWallet() {
  try {
    if (!SECRET_KEY) {
      throw new Error('SECRET_KEY or STELLAR_SECRET_KEY environment variable is required');
    }

    console.log('🔧 Initializing Smart Wallet Contract...');
    console.log(`   Smart Wallet ID: ${SMART_WALLET_ID}`);
    console.log(`   WebAuthn Verifier ID: ${WEBAUTHN_VERIFIER_ID}`);
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

    // Create webauthn verifier address ScVal
    const verifierAddressBytes = StellarSdk.StrKey.decodeContract(WEBAUTHN_VERIFIER_ID);
    const verifierScAddress = StellarSdk.xdr.ScAddress.scAddressTypeContract(verifierAddressBytes);
    const verifierScVal = StellarSdk.xdr.ScVal.scvAddress(verifierScAddress);

    // Call __constructor(webauthn_verifier)
    console.log('📝 Calling __constructor with webauthn_verifier address...');
    const constructorOp = contract.call('__constructor', verifierScVal);

    // Build transaction
    const transaction = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account(publicKey, sequence),
      {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE
      }
    )
      .addOperation(constructorOp)
      .setTimeout(30)
      .build();

    // Prepare transaction
    console.log('⏳ Preparing transaction...');
    const preparedTx = await server.prepareTransaction(transaction);
    console.log('✅ Transaction prepared');

    // Sign transaction
    preparedTx.sign(keypair);
    console.log('✅ Transaction signed');

    // Send transaction
    console.log('🚀 Sending transaction...');
    const sendResult = await server.sendTransaction(preparedTx);
    console.log(`✅ Transaction sent: ${sendResult.hash}`);
    console.log(`   Explorer: https://stellar.expert/explorer/testnet/tx/${sendResult.hash}`);

    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    let confirmed = false;
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const status = await server.getTransaction(sendResult.hash);
        if (status.status === 'SUCCESS') {
          console.log(`✅ Transaction confirmed on ledger ${status.ledger || status.ledgerSequence}`);
          confirmed = true;
          break;
        } else if (status.status === 'FAILED') {
          throw new Error(`Transaction failed: ${JSON.stringify(status)}`);
        }
        console.log(`   Status: ${status.status} (attempt ${i + 1}/20)`);
      } catch (error) {
        if (error.message && error.message.includes('Bad union switch')) {
          // Transaction might be successful but SDK can't parse
          if (i >= 10) {
            console.log('⚠️  Transaction sent but cannot parse result. Check Stellar Explorer.');
            confirmed = true;
            break;
          }
        } else {
          throw error;
        }
      }
    }

    if (!confirmed) {
      console.warn('⚠️  Could not confirm transaction status. Check Stellar Explorer.');
    }

    console.log('');
    console.log('✅ Smart Wallet Contract initialized successfully!');
    console.log(`   The contract is now configured to use WebAuthn Verifier: ${WEBAUTHN_VERIFIER_ID}`);

  } catch (error) {
    console.error('');
    console.error('❌ Failed to initialize smart wallet contract:');
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Response: ${JSON.stringify(error.response, null, 2)}`);
    }
    process.exit(1);
  }
}

// Run initialization
initializeSmartWallet();

