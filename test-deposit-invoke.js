// Test script to invoke deposit function and see the response
const StellarSdk = require('@stellar/stellar-sdk');

const CONTRACT_ID = 'CDACXEF4GFCT5DUUVDBAL3X5DE7ROHRQHW7ML6D4F5NVFNH4A2ID2KHG';
const USER_ADDRESS = 'GANOB3BOX23UYI5BBT4QAGY2D2BLB7INGMEVMZJ57O2QCEVQGJHBHDNO';
const ASSET_ADDRESS = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const RPC_URL = 'https://soroban-testnet.stellar.org:443';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

async function testGetPasskeyPubkey() {
  console.log('🔍 Testing get_passkey_pubkey...');
  
  const sorobanServer = new StellarSdk.SorobanRpc.Server(RPC_URL);
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  
  // Create user address ScVal
  const userAddressBytes = StellarSdk.StrKey.decodeEd25519PublicKey(USER_ADDRESS);
  const userScAddress = StellarSdk.xdr.ScAddress.scAddressTypeAccount(
    StellarSdk.xdr.PublicKey.publicKeyTypeEd25519(userAddressBytes)
  );
  const userScVal = StellarSdk.xdr.ScVal.scvAddress(userScAddress);
  
  // Create transaction for simulation
  const account = await sorobanServer.getAccount(USER_ADDRESS);
  const getPubkeyOp = contract.call('get_passkey_pubkey', userScVal);
  const tx = new StellarSdk.TransactionBuilder(
    new StellarSdk.Account(USER_ADDRESS, account.sequenceNumber()),
    {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE
    }
  )
    .addOperation(getPubkeyOp)
    .setTimeout(30)
    .build();
  
  const preparedTx = await sorobanServer.prepareTransaction(tx);
  const result = await sorobanServer.simulateTransaction(preparedTx);
  
  console.log('📊 Simulation result:', JSON.stringify(result, null, 2));
  
  if (result.result && result.result.retval) {
    try {
      const retval = StellarSdk.xdr.ScVal.fromXDR(result.result.retval, 'base64');
      console.log('✅ Return value:', retval);
      if (retval.switch && retval.switch().name === 'scvVoid') {
        console.log('❌ Signer is NOT registered (returned void)');
      } else {
        console.log('✅ Signer IS registered!');
        console.log('Passkey pubkey:', retval);
      }
    } catch (e) {
      console.log('⚠️ Could not parse return value:', e.message);
    }
  }
}

async function testGetBalance() {
  console.log('\n🔍 Testing get_balance...');
  
  const sorobanServer = new StellarSdk.SorobanRpc.Server(RPC_URL);
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  
  // Create user address ScVal
  const userAddressBytes = StellarSdk.StrKey.decodeEd25519PublicKey(USER_ADDRESS);
  const userScAddress = StellarSdk.xdr.ScAddress.scAddressTypeAccount(
    StellarSdk.xdr.PublicKey.publicKeyTypeEd25519(userAddressBytes)
  );
  const userScVal = StellarSdk.xdr.ScVal.scvAddress(userScAddress);
  
  // Create asset address ScVal
  const assetAddressBytes = StellarSdk.StrKey.decodeEd25519PublicKey(ASSET_ADDRESS);
  const assetScAddress = StellarSdk.xdr.ScAddress.scAddressTypeContract(
    StellarSdk.xdr.Hash.hashContractId(assetAddressBytes)
  );
  const assetScVal = StellarSdk.xdr.ScVal.scvAddress(assetScAddress);
  
  // Create transaction for simulation
  const account = await sorobanServer.getAccount(USER_ADDRESS);
  const getBalanceOp = contract.call('get_balance', userScVal, assetScVal);
  const tx = new StellarSdk.TransactionBuilder(
    new StellarSdk.Account(USER_ADDRESS, account.sequenceNumber()),
    {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE
    }
  )
    .addOperation(getBalanceOp)
    .setTimeout(30)
    .build();
  
  const preparedTx = await sorobanServer.prepareTransaction(tx);
  const result = await sorobanServer.simulateTransaction(preparedTx);
  
  console.log('📊 Simulation result:', JSON.stringify(result, null, 2));
  
  if (result.result && result.result.retval) {
    try {
      const retval = StellarSdk.xdr.ScVal.fromXDR(result.result.retval, 'base64');
      console.log('✅ Return value:', retval);
      
      // Try to parse as i128
      if (retval.switch && retval.switch().name === 'scvI128') {
        const i128 = retval.i128();
        const lo = i128.lo().toString();
        const hi = i128.hi().toString();
        const balance = BigInt(lo) + (BigInt(hi) << 64n);
        const balanceInXLM = Number(balance) / 10000000;
        console.log(`✅ Balance: ${balanceInXLM} XLM (${balance} stroops)`);
      } else {
        console.log('⚠️ Return value is not i128:', retval.switch().name);
      }
    } catch (e) {
      console.log('⚠️ Could not parse return value:', e.message);
    }
  }
}

async function main() {
  try {
    await testGetPasskeyPubkey();
    await testGetBalance();
  } catch (error) {
    console.error('❌ Error:', error);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

main();

