//! # Smart Wallet Contract
//!
//! A passkey-enabled smart wallet implementation that uses a separate WebAuthn verifier contract.
//! This contract stores a passkey public key and delegates signature verification to the WebAuthn verifier.

use soroban_sdk::{
    contract, contractimpl, contractclient, contracttype, vec, symbol_short,
    Address, Bytes, BytesN, Env, String, Symbol, Vec, Map, token,
};

/// Storage keys for signer data
/// Using Map-based storage following OpenZeppelin patterns
/// Store passkey data in a Map<Address, Bytes> for passkey pubkeys
/// Store rp_id data in a Map<Address, Bytes> for rp_id hashes

const PASSKEY_MAP_KEY: Symbol = symbol_short!("passkeys");
const RP_ID_MAP_KEY: Symbol = symbol_short!("rp_ids");
const BALANCES_MAP_KEY: Symbol = symbol_short!("balances");

/// WebAuthn signature data structure containing all components needed for verification.
/// This matches the structure in the WebAuthn verifier contract.
/// Note: Using Bytes for signature to match SDK limitations, will convert to BytesN<64> internally.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct WebAuthnSigData {
    /// The cryptographic signature (64 bytes for secp256r1).
    /// Using Bytes instead of BytesN<64> because the SDK can't construct BytesN directly.
    pub signature: Bytes,
    /// Raw authenticator data from the WebAuthn response.
    pub authenticator_data: Bytes,
    /// Raw client data JSON from the WebAuthn response.
    pub client_data: Bytes,
}

// WebAuthn verifier contract client interface
// The verifier expects WebAuthnSigDataVerifier directly (not XDR-encoded)
// Note: The verifier's WebAuthnSigData has signature: BytesN<64>, so we need to convert
#[contractclient(name = "WebauthnVerifierClient")]
pub trait WebauthnVerifierTrait {
    fn verify(
        e: &Env,
        signature_payload: &Bytes,
        pub_key: &BytesN<65>,
        sig_data: &WebAuthnSigDataVerifier,
    ) -> bool;
}

/// WebAuthn signature data structure for the verifier contract.
/// This matches the verifier's expected struct with signature: BytesN<64>.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct WebAuthnSigDataVerifier {
    /// The cryptographic signature (64 bytes for secp256r1).
    pub signature: BytesN<64>,
    /// Raw authenticator data from the WebAuthn response.
    pub authenticator_data: Bytes,
    /// Raw client data JSON from the WebAuthn response.
    pub client_data: Bytes,
}

/// WebAuthn signature data passed as a struct (following the pattern from other contracts)
/// This matches the pattern used in other Soroban contracts like Secp256r1Signature
#[contracttype]
pub struct WebAuthnSignatureData {
    pub signature: Bytes,
    pub authenticator_data: Bytes,
    pub client_data: Bytes,
}

#[contract]
pub struct SmartWalletContract;

// Per-address signer data - using individual storage keys for simplicity
// This avoids complex struct serialization issues in Soroban

#[contractimpl]
impl SmartWalletContract {
    /// Initialize the smart wallet with WebAuthn verifier contract address
    pub fn __constructor(e: &Env, webauthn_verifier: Address) {
        // Store the WebAuthn verifier contract address
        e.storage().instance().set(&Symbol::new(e, "verifier"), &webauthn_verifier);
        
        // Log successful initialization
        e.logs().add("Smart wallet initialized", &[
            webauthn_verifier.to_val(),
        ]);
    }

    /// Test function to verify contract can be called
    pub fn test(e: &Env) -> bool {
        e.logs().add("test function called", &[]);
        true
    }

    /// Minimal test with just one Address parameter
    pub fn test_address(e: &Env, addr: Address) -> bool {
        true
    }

    /// Test with Address and Bytes
    pub fn test_address_bytes(e: &Env, addr: Address, data: Bytes) -> bool {
        true
    }

    /// Test with multiple Addresses
    pub fn test_multiple_addresses(e: &Env, addr1: Address, addr2: Address, addr3: Address) -> bool {
        true
    }

    /// Test function with EXACT same signature as execute_payment
    /// This helps isolate if the issue is with the function name or parameters
    pub fn test_execute_payment_signature(
        e: &Env,
        signer_address: Address,
        destination: Address,
        amount: i128,
        asset: Address,
        signature_payload: Bytes,
        webauthn_signature: Bytes,
        webauthn_authenticator_data: Bytes,
        webauthn_client_data: Bytes,
    ) -> bool {
        e.logs().add("test_execute_payment_signature called", &[]);
        e.logs().add("Got signer_address", &[]);
        e.logs().add("Got destination", &[]);
        e.logs().add("Got amount", &[(amount as i32).into()]);
        e.logs().add("Got asset", &[]);
        e.logs().add("Got signature_payload", &[(signature_payload.len() as i32).into()]);
        e.logs().add("Got webauthn_signature", &[(webauthn_signature.len() as i32).into()]);
        e.logs().add("Got webauthn_authenticator_data", &[(webauthn_authenticator_data.len() as i32).into()]);
        e.logs().add("Got webauthn_client_data", &[(webauthn_client_data.len() as i32).into()]);
        e.logs().add("All test parameters received successfully", &[]);
        true
    }

    /// Test function to verify register_signer parameters can be deserialized
    pub fn test_register_signer_signature(
        e: &Env,
        signer_address: Address,
        passkey_pubkey: Bytes,
        rp_id_hash: Bytes,
    ) -> bool {
        e.logs().add("test_register_signer_signature called", &[]);
        e.logs().add("Got signer_address", &[]);
        e.logs().add("Got passkey_pubkey", &[(passkey_pubkey.len() as i32).into()]);
        e.logs().add("Got rp_id_hash", &[(rp_id_hash.len() as i32).into()]);
        e.logs().add("All test parameters received successfully", &[]);
        true
    }

    /// Register a new signer (wallet address) with passkey data
    /// This is called once per wallet when they first connect
    pub fn register_signer(
        e: &Env,
        signer_address: Address,
        passkey_pubkey: Bytes,
        rp_id_hash: Bytes,
    ) -> bool {
        e.logs().add("register_signer called", &[]);
        
        // Validate inputs first (before any storage operations)
        e.logs().add("Validating inputs", &[
            (passkey_pubkey.len() as i32).into(),
            (rp_id_hash.len() as i32).into(),
        ]);
        
        if passkey_pubkey.len() == 0 || rp_id_hash.len() != 32 {
            e.logs().add("Validation failed", &[]);
            return false;
        }

        e.logs().add("Getting passkey map", &[]);
        // Get or create the passkey map
        // Don't use logs inside unwrap_or_else closure - it can cause issues during simulation
        let mut passkey_map: Map<Address, Bytes> = e.storage()
            .persistent()
            .get(&PASSKEY_MAP_KEY)
            .unwrap_or_else(|| Map::new(e));
        
        e.logs().add("Setting passkey in map", &[]);
        passkey_map.set(signer_address.clone(), passkey_pubkey);
        
        e.logs().add("Storing passkey map", &[]);
        e.storage().persistent().set(&PASSKEY_MAP_KEY, &passkey_map);

        e.logs().add("Getting rp_id map", &[]);
        // Get or create the rp_id map
        // Don't use logs inside unwrap_or_else closure - it can cause issues during simulation
        let mut rp_id_map: Map<Address, Bytes> = e.storage()
            .persistent()
            .get(&RP_ID_MAP_KEY)
            .unwrap_or_else(|| Map::new(e));
        
        e.logs().add("Setting rp_id in map", &[]);
        rp_id_map.set(signer_address.clone(), rp_id_hash);
        
        e.logs().add("Storing rp_id map", &[]);
        e.storage().persistent().set(&RP_ID_MAP_KEY, &rp_id_map);

        e.logs().add("register_signer completed successfully", &[]);
        true
    }

    /// Get passkey public key for an address
    pub fn get_passkey_pubkey(e: &Env, signer_address: Address) -> Option<Bytes> {
        let passkey_map: Map<Address, Bytes> = e.storage()
            .persistent()
            .get(&PASSKEY_MAP_KEY)?;
        passkey_map.get(signer_address)
    }

    /// Get user's balance for a specific asset
    /// Returns 0 if the user has no balance for that asset
    pub fn get_balance(e: &Env, user_address: Address, asset: Address) -> i128 {
        let balances_map: Map<Address, Map<Address, i128>> = e.storage()
            .persistent()
            .get(&BALANCES_MAP_KEY)
            .unwrap_or_else(|| Map::new(e));
        
        let user_balances: Map<Address, i128> = match balances_map.get(user_address) {
            Some(balances) => balances,
            None => return 0,
        };
        
        user_balances.get(asset).unwrap_or(0)
    }

    /// Deposit tokens to user's balance in the contract
    /// The user must first approve the contract to transfer tokens on their behalf
    /// Then call this function to deposit tokens into their balance
    /// 
    /// This function requires WebAuthn signature verification to ensure the user
    /// authorized the deposit with their passkey.
    ///
    /// # Arguments
    ///
    /// * `user_address` - The address of the user depositing tokens
    /// * `asset` - The asset contract address (e.g., XLM SAC)
    /// * `amount` - The deposit amount in stroops (1 XLM = 10,000,000 stroops)
    /// * `signature_payload` - The message hash that was signed (first 32 bytes used as challenge)
    /// * `webauthn_signature` - The WebAuthn signature (64 bytes for secp256r1)
    /// * `webauthn_authenticator_data` - Raw authenticator data from the WebAuthn response
    /// * `webauthn_client_data` - Raw client data JSON from the WebAuthn response
    pub fn deposit(
        e: &Env,
        user_address: Address,
        asset: Address,
        amount: i128,
        signature_payload: Bytes,
        webauthn_signature: Bytes,
        webauthn_authenticator_data: Bytes,
        webauthn_client_data: Bytes,
    ) -> bool {
        e.logs().add("deposit called", &[]);
        
        if amount <= 0 {
            e.logs().add("Deposit rejected: Invalid amount", &[
                (amount as i32).into(),
            ]);
            return false;
        }

        // Verify WebAuthn signature (same logic as execute_payment)
        e.logs().add("Getting passkey pubkey for deposit", &[]);
        let passkey_pubkey_bytes = match Self::get_passkey_pubkey(e, user_address.clone()) {
            Some(pubkey) => pubkey,
            None => {
                e.logs().add("Deposit rejected: Signer not registered", &[
                    user_address.to_val(),
                ]);
                return false;
            }
        };

        // Convert passkey public key from Bytes to BytesN<65>
        if passkey_pubkey_bytes.len() != 65 {
            e.logs().add("Deposit rejected: Invalid passkey public key length", &[
                (passkey_pubkey_bytes.len() as i32).into(),
            ]);
            return false;
        }

        let slice = passkey_pubkey_bytes.slice(0..65);
        let buf = slice.to_buffer::<65>();
        let mut pubkey_array = [0u8; 65];
        pubkey_array.copy_from_slice(buf.as_slice());
        let passkey_pubkey: BytesN<65> = BytesN::from_array(e, &pubkey_array);

        // Get the WebAuthn verifier contract address
        let verifier_address = e.storage().instance().get(&Symbol::new(e, "verifier"))
            .unwrap_or(Address::from_string(&String::from_str(e, "CARLXTWOUIRQVQILCBSA3CNG6QIVO3PIPKF66LDHQXGQGUAAWPFLND3L")));

        // Validate signature length
        let sig_len = webauthn_signature.len();
        if sig_len != 64 {
            e.logs().add("Deposit rejected: Invalid signature length", &[
                (sig_len as i32).into(),
            ]);
            return false;
        }
        
        // Extract 64 bytes from Bytes to create BytesN<64>
        let sig_slice = webauthn_signature.slice(0..64);
        let sig_buf = sig_slice.to_buffer::<64>();
        let mut sig_array = [0u8; 64];
        sig_array.copy_from_slice(sig_buf.as_slice());
        let sig_bytesn: BytesN<64> = BytesN::from_array(e, &sig_array);
        
        // Reconstruct WebAuthnSigDataVerifier
        let webauthn_sig_data_verifier = WebAuthnSigDataVerifier {
            signature: sig_bytesn,
            authenticator_data: webauthn_authenticator_data,
            client_data: webauthn_client_data,
        };
        
        // Create verifier client and verify signature
        e.logs().add("Creating verifier client for deposit", &[]);
        let verifier_client = WebauthnVerifierClient::new(e, &verifier_address);
        e.logs().add("Calling verifier.verify for deposit", &[]);
        let is_valid = verifier_client.verify(&signature_payload, &passkey_pubkey, &webauthn_sig_data_verifier);
        e.logs().add("Verifier.verify completed for deposit", &[is_valid.into()]);

        if !is_valid {
            e.logs().add("Deposit rejected: Invalid WebAuthn signature", &[
                user_address.to_val(),
            ]);
            return false;
        }

        e.logs().add("WebAuthn signature verified for deposit", &[]);

        // Require authorization from the user
        // Soroban's authorization framework handles signature verification and replay prevention
        e.logs().add("Requiring authorization from user for deposit", &[
            user_address.to_val(),
        ]);
        user_address.require_auth();
        e.logs().add("User authorization recorded for deposit", &[]);

        // Create token client and check user's token balance
        let token_client = token::Client::new(e, &asset);
        let contract_address = e.current_contract_address();
        
        e.logs().add("Checking user's token balance", &[
            user_address.to_val(),
            asset.to_val(),
        ]);
        
        let user_token_balance = token_client.balance(&user_address);
        e.logs().add("User token balance check", &[
            (user_token_balance as i32).into(),
            (amount as i32).into(),
        ]);
        
        if user_token_balance < amount {
            e.logs().add("Deposit rejected: Insufficient token balance", &[
                user_address.to_val(),
                (user_token_balance as i32).into(),
                (amount as i32).into(),
            ]);
            return false;
        }
        
        e.logs().add("Transferring tokens from user to contract", &[
            user_address.to_val(),
            contract_address.to_val(),
            (amount as i32).into(),
        ]);
        
        // Transfer tokens from user to contract
        // The user is directly transferring their tokens to the contract
        token_client.transfer(&user_address, &contract_address, &amount);
        
        e.logs().add("Token transfer completed, updating logical balance", &[]);

        // Update user's logical balance in the contract
        // We maintain logical balances to track per-user deposits within the contract
        let mut balances_map: Map<Address, Map<Address, i128>> = e.storage()
            .persistent()
            .get(&BALANCES_MAP_KEY)
            .unwrap_or_else(|| Map::new(e));
        
        let mut user_balances: Map<Address, i128> = balances_map
            .get(user_address.clone())
            .unwrap_or_else(|| Map::new(e));
        
        let current_balance = user_balances.get(asset.clone()).unwrap_or(0);
        let new_balance = current_balance + amount;
        user_balances.set(asset.clone(), new_balance);
        balances_map.set(user_address.clone(), user_balances);
        e.storage().persistent().set(&BALANCES_MAP_KEY, &balances_map);

        e.logs().add("Deposit successful", &[
            user_address.to_val(),
            asset.to_val(),
            (amount as i32).into(),
            (new_balance as i32).into(),
        ]);

        true
    }

    /// Execute a payment transaction with WebAuthn signature verification
    /// 
    /// This function verifies the passkey signature using the WebAuthn verifier
    /// before executing the payment.
    ///
    /// # Arguments
    ///
    /// * `signer_address` - The address of the signer (wallet owner)
    /// * `destination` - The destination address for the payment
    /// * `amount` - The payment amount in stroops (1 XLM = 10,000,000 stroops)
    /// * `asset` - The asset address (use native XLM address for XLM)
    /// * `signature_payload` - The message hash that was signed (first 32 bytes used as challenge)
    /// * `webauthn_signature` - The WebAuthn signature (64 bytes for secp256r1)
    /// * `webauthn_authenticator_data` - Raw authenticator data from the WebAuthn response
    /// * `webauthn_client_data` - Raw client data JSON from the WebAuthn response
    ///
    /// # Returns
    ///
    /// Returns `true` if payment executed successfully, `false` otherwise.
    pub fn execute_payment(
        e: &Env,
        signer_address: Address,
        destination: Address,
        amount: i128,
        asset: Address,
        signature_payload: Bytes,
        webauthn_signature: Bytes,
        webauthn_authenticator_data: Bytes,
        webauthn_client_data: Bytes,
    ) -> bool {
        e.logs().add("execute_payment called", &[]);
        
        if amount <= 0 {
            e.logs().add("Payment rejected: Invalid amount", &[
                (amount as i32).into(),
            ]);
            return false;
        }

        // Verify WebAuthn signature (same logic as deposit)
        e.logs().add("Getting passkey pubkey for execute_payment", &[]);
        let passkey_pubkey_bytes = match Self::get_passkey_pubkey(e, signer_address.clone()) {
            Some(pubkey) => pubkey,
            None => {
                e.logs().add("Payment rejected: Signer not registered", &[
                    signer_address.to_val(),
                ]);
                return false;
            }
        };

        // Convert passkey public key from Bytes to BytesN<65>
        if passkey_pubkey_bytes.len() != 65 {
            e.logs().add("Payment rejected: Invalid passkey public key length", &[
                (passkey_pubkey_bytes.len() as i32).into(),
            ]);
            return false;
        }

        let slice = passkey_pubkey_bytes.slice(0..65);
        let buf = slice.to_buffer::<65>();
        let mut pubkey_array = [0u8; 65];
        pubkey_array.copy_from_slice(buf.as_slice());
        let passkey_pubkey: BytesN<65> = BytesN::from_array(e, &pubkey_array);

        // Get the WebAuthn verifier contract address
        let verifier_address = e.storage().instance().get(&Symbol::new(e, "verifier"))
            .unwrap_or(Address::from_string(&String::from_str(e, "CARLXTWOUIRQVQILCBSA3CNG6QIVO3PIPKF66LDHQXGQGUAAWPFLND3L")));

        // Validate signature length
        let sig_len = webauthn_signature.len();
        if sig_len != 64 {
            e.logs().add("Payment rejected: Invalid signature length", &[
                (sig_len as i32).into(),
            ]);
            return false;
        }
        
        // Extract 64 bytes from Bytes to create BytesN<64>
        let sig_slice = webauthn_signature.slice(0..64);
        let sig_buf = sig_slice.to_buffer::<64>();
        let mut sig_array = [0u8; 64];
        sig_array.copy_from_slice(sig_buf.as_slice());
        let sig_bytesn: BytesN<64> = BytesN::from_array(e, &sig_array);
        
        // Reconstruct WebAuthnSigDataVerifier
        let webauthn_sig_data_verifier = WebAuthnSigDataVerifier {
            signature: sig_bytesn,
            authenticator_data: webauthn_authenticator_data,
            client_data: webauthn_client_data,
        };
        
        // Create verifier client and verify signature
        e.logs().add("Creating verifier client for execute_payment", &[]);
        let verifier_client = WebauthnVerifierClient::new(e, &verifier_address);
        e.logs().add("Calling verifier.verify for execute_payment", &[]);
        let is_valid = verifier_client.verify(&signature_payload, &passkey_pubkey, &webauthn_sig_data_verifier);
        e.logs().add("Verifier.verify completed for execute_payment", &[is_valid.into()]);

        if !is_valid {
            e.logs().add("Payment rejected: Invalid WebAuthn signature", &[
                signer_address.to_val(),
            ]);
            return false;
        }

        e.logs().add("WebAuthn signature verified for execute_payment", &[]);

        // User must authorize this payment
        // Even though the contract holds the tokens, we need to verify the user authorizes
        // withdrawing from their logical balance
        e.logs().add("Requiring authorization from user for execute_payment", &[
            signer_address.to_val(),
        ]);
        signer_address.require_auth();
        e.logs().add("User authorization recorded for execute_payment", &[]);

        // Check user's logical balance for this asset
        // The contract tracks per-user balances in storage
        e.logs().add("Checking user's logical balance", &[
            signer_address.to_val(),
            asset.to_val(),
        ]);

        let user_balance = Self::get_balance(e, signer_address.clone(), asset.clone());
        e.logs().add("User balance check", &[
            signer_address.to_val(),
            asset.to_val(),
            (user_balance as i32).into(),
            (amount as i32).into(),
        ]);

        // Validate that user has sufficient deposited balance
        if user_balance < amount {
            e.logs().add("Payment rejected: Insufficient deposited balance", &[
                signer_address.to_val(),
                (user_balance as i32).into(),
                (amount as i32).into(),
            ]);
            return false;
        }
        
        e.logs().add("Balance validation passed", &[
            (user_balance as i32).into(),
            (amount as i32).into(),
        ]);

        // Create token client for the asset
        e.logs().add("Creating token client", &[]);
        let token_client = token::Client::new(e, &asset);
        e.logs().add("Token client created", &[]);
        
        // Custodial model: Contract holds the tokens
        // Transfer directly from contract's balance to destination
        let contract_address = e.current_contract_address();
        e.logs().add("Contract address", &[contract_address.to_val()]);
        
        e.logs().add("Transferring tokens from contract to destination", &[
            contract_address.to_val(),
            destination.to_val(),
            (amount as i32).into(),
        ]);
        
        // Transfer from contract to destination
        // The contract owns the tokens, so it can transfer them directly
        token_client.transfer(&contract_address, &destination, &amount);
        
        // Update user's balance (deduct the transferred amount)
        let mut balances_map: Map<Address, Map<Address, i128>> = e.storage()
            .persistent()
            .get(&BALANCES_MAP_KEY)
            .unwrap_or_else(|| Map::new(e));
        
        let mut user_balances: Map<Address, i128> = balances_map
            .get(signer_address.clone())
            .unwrap_or_else(|| Map::new(e));
        
        let new_balance = user_balance - amount;
        user_balances.set(asset.clone(), new_balance);
        balances_map.set(signer_address.clone(), user_balances);
        e.storage().persistent().set(&BALANCES_MAP_KEY, &balances_map);
        
        e.logs().add("Balance updated", &[
            (new_balance as i32).into(),
        ]);
        e.logs().add("Token transfer completed successfully", &[]);

        // Log the successful payment
        e.logs().add("Payment executed successfully", &[
            signer_address.to_val(),
            destination.to_val(),
            (amount as i32).into(),
            asset.to_val(),
        ]);

        true
    }

    /// Get wallet information
    /// 
    /// Returns basic information about the wallet state.
    pub fn get_wallet_info(e: &Env) -> Vec<String> {
        vec![
            &e,
            String::from_str(e, "Smart Wallet"),
            String::from_str(e, "Per-Address Registration"),
            String::from_str(e, "WebAuthn + ZK Enabled"),
        ]
    }

    /// Check if a signer is registered
    pub fn is_signer_registered(e: &Env, signer_address: Address) -> bool {
        Self::get_passkey_pubkey(e, signer_address).is_some()
    }

    /// Get the WebAuthn verifier contract address
    pub fn get_verifier_address(e: &Env) -> Address {
        e.storage().instance().get(&Symbol::new(e, "verifier"))
            .unwrap_or(Address::from_string(&String::from_str(e, "CARLXTWOUIRQVQILCBSA3CNG6QIVO3PIPKF66LDHQXGQGUAAWPFLND3L")))
    }
}
