// Test script to get transaction details and see diagnostic events
const StellarSdk = require('@stellar/stellar-sdk');

const RPC_URL = 'https://soroban-testnet.stellar.org:443';
const TX_HASH = '470956b6e3ebd99bab850935e5bc03ed16df4d88320e49ec54b46990b29aa92f';

// Get SorobanRpcServer (same pattern as smartWallet.js)
let SorobanRpcServer = null;
if (StellarSdk?.SorobanRpc?.Server && typeof StellarSdk.SorobanRpc.Server === 'function') {
  SorobanRpcServer = StellarSdk.SorobanRpc.Server;
} else if (StellarSdk?.rpc?.Server && typeof StellarSdk.rpc.Server === 'function') {
  SorobanRpcServer = StellarSdk.rpc.Server;
}

async function getTransactionDetails() {
  // Use fetch to get raw RPC response (bypass SDK parsing issues)
  try {
    console.log('🔍 Fetching transaction details via RPC...');
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: {
          hash: TX_HASH
        }
      })
    });
    
    const data = await response.json();
    console.log('\n📋 Raw RPC Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.result) {
      console.log('\n📊 Transaction Status:', data.result.status);
      
      // Check for diagnostic events
      if (data.result.events && data.result.events.length > 0) {
        console.log('\n🔍 Diagnostic Events:');
        data.result.events.forEach((event, i) => {
          console.log(`\nEvent ${i + 1}:`);
          if (event.type === 'diagnostic') {
            console.log('  Type: Diagnostic');
            console.log('  Topics:', event.topics);
            console.log('  Data:', event.data);
          } else {
            console.log(JSON.stringify(event, null, 2));
          }
        });
      }
      
      // Check for result
      if (data.result.resultXdr) {
        console.log('\n📊 Transaction Result XDR:', data.result.resultXdr);
        try {
          // Try parsing as InvokeHostFunctionResult
          const invokeResult = StellarSdk.xdr.InvokeHostFunctionResult.fromXDR(data.result.resultXdr, 'base64');
          console.log('InvokeHostFunctionResult:', invokeResult);
          console.log('Result Type:', invokeResult.switch().name);
          
          if (invokeResult.switch().name === 'success') {
            const success = invokeResult.success();
            console.log('Success Result:', success);
            if (success && success.length > 0) {
              const scVal = success[0];
              console.log('ScVal Type:', scVal.switch().name);
              if (scVal.switch().name === 'scvBool') {
                console.log('✅ Boolean Result:', scVal.b());
              } else {
                console.log('ScVal Value:', scVal);
              }
            }
          }
        } catch (e) {
          console.log('Could not parse as InvokeHostFunctionResult:', e.message);
          // Try parsing as ScVal directly
          try {
            const result = StellarSdk.xdr.ScVal.fromXDR(data.result.resultXdr, 'base64');
            console.log('Parsed as ScVal:', result);
            console.log('ScVal Type:', result.switch().name);
          } catch (e2) {
            console.log('Could not parse as ScVal either:', e2.message);
          }
        }
      }
      
      // Parse diagnostic events to see contract logs
      if (data.result.diagnosticEventsXdr && data.result.diagnosticEventsXdr.length > 0) {
        console.log('\n🔍 Parsing Diagnostic Events:');
        data.result.diagnosticEventsXdr.forEach((eventXdr, i) => {
          try {
            const event = StellarSdk.xdr.DiagnosticEvent.fromXDR(eventXdr, 'base64');
            
            if (event.inSuccessfulContractCall()) {
              const call = event.inSuccessfulContractCall();
              const events = call.events();
              
              if (events && events.length > 0) {
                events.forEach((evt, j) => {
                  if (evt.type() === StellarSdk.xdr.ContractEventType.contract()) {
                    const contractEvt = evt.contract();
                    const topics = contractEvt.topics();
                    
                    // Look for fn_call and fn_return events
                    if (topics && topics.length > 0) {
                      try {
                        const topic0 = StellarSdk.xdr.ScVal.fromXDR(topics[0].toXDR('base64'), 'base64');
                        if (topic0.switch().name === 'scvSymbol') {
                          const symbol = topic0.sym().toString();
                          console.log(`\n📋 Event ${i + 1}.${j + 1}: ${symbol}`);
                          
                          if (symbol === 'fn_call' || symbol === 'fn_return') {
                            // Try to extract function name and return value
                            if (topics.length > 1) {
                              const topic1 = StellarSdk.xdr.ScVal.fromXDR(topics[1].toXDR('base64'), 'base64');
                              if (topic1.switch().name === 'scvSymbol') {
                                const fnName = topic1.sym().toString();
                                console.log(`  Function: ${fnName}`);
                              }
                            }
                            
                            // Check data for return value
                            const data = contractEvt.data();
                            if (data) {
                              try {
                                const dataScVal = StellarSdk.xdr.ScVal.fromXDR(data.toXDR('base64'), 'base64');
                                if (symbol === 'fn_return') {
                                  console.log(`  Return Value Type: ${dataScVal.switch().name}`);
                                  if (dataScVal.switch().name === 'scvBool') {
                                    console.log(`  ✅ Return Value: ${dataScVal.b()}`);
                                  } else {
                                    console.log(`  Return Value: ${dataScVal}`);
                                  }
                                }
                              } catch (e) {
                                // Data might not be ScVal
                              }
                            }
                          }
                        }
                      } catch (e) {
                        // Could not parse topic
                      }
                    }
                  }
                });
              }
            }
          } catch (e) {
            // Could not parse event
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

getTransactionDetails();

