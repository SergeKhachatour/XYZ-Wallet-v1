// Decode diagnostic events to see fn_return value
const StellarSdk = require('@stellar/stellar-sdk');

// The fn_return event XDR from the transaction
const fnReturnXdr = "AAAAAQAAAAAAAAABwCuQvDFFPo6UqMIF7v0ZPxceMD2+xfh8L1tStPwGkD0AAAACAAAAAAAAAAIAAAAPAAAACWZuX3JldHVybgAAAAAAAA8AAAAHZGVwb3NpdAAAAAAAAAAAAA==";

try {
  const event = StellarSdk.xdr.DiagnosticEvent.fromXDR(fnReturnXdr, 'base64');
  console.log('Event Type:', event.switch().name);
  
  if (event.inSuccessfulContractCall()) {
    const call = event.inSuccessfulContractCall();
    const events = call.events();
    
    if (events && events.length > 0) {
      events.forEach((evt, i) => {
        console.log(`\nEvent ${i + 1}:`);
        console.log('Type:', evt.type().name);
        
        if (evt.type() === StellarSdk.xdr.ContractEventType.contract()) {
          const contractEvt = evt.contract();
          const topics = contractEvt.topics();
          const data = contractEvt.data();
          
          console.log('Topics:', topics.length);
          topics.forEach((topic, j) => {
            try {
              const scVal = StellarSdk.xdr.ScVal.fromXDR(topic.toXDR('base64'), 'base64');
              console.log(`  Topic ${j}:`, scVal.switch().name);
              if (scVal.switch().name === 'scvSymbol') {
                console.log(`    Symbol: ${scVal.sym().toString()}`);
              }
            } catch (e) {
              console.log(`  Topic ${j}: Could not parse`);
            }
          });
          
          if (data) {
            try {
              const dataScVal = StellarSdk.xdr.ScVal.fromXDR(data.toXDR('base64'), 'base64');
              console.log('Data Type:', dataScVal.switch().name);
              if (dataScVal.switch().name === 'scvBool') {
                console.log('✅ Return Value (bool):', dataScVal.b());
              } else if (dataScVal.switch().name === 'scvSymbol') {
                console.log('Return Value (symbol):', dataScVal.sym().toString());
              } else {
                console.log('Return Value:', dataScVal);
              }
            } catch (e) {
              console.log('Could not parse data:', e.message);
            }
          }
        }
      });
    }
  }
} catch (error) {
  console.error('Error:', error);
}

