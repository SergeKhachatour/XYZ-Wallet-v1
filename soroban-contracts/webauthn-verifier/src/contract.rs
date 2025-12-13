//! # WebAuthn Verifier Contract
//!
//! A production-ready verifier contract for WebAuthn (passkey) signature verification.
//! This contract implements the WebAuthn assertion verification procedure as specified
//! in the W3C WebAuthn specification (https://www.w3.org/TR/webauthn-2/).
//!
//! Based on OpenZeppelin's Stellar Contracts implementation:
//! https://github.com/OpenZeppelin/stellar-contracts/tree/main/packages/accounts
//!
//! This contract can be deployed once and used by multiple smart accounts across the
//! network for delegated signature verification.

use soroban_sdk::{contract, contractimpl, contracterror, contracttype, panic_with_error, Bytes, BytesN, Env};

/// Error types for WebAuthn verification operations.
#[contracterror]
#[repr(u32)]
pub enum WebAuthnError {
    /// The signature payload is invalid or has incorrect format.
    SignaturePayloadInvalid = 3110,
    /// The client data exceeds the maximum allowed length.
    ClientDataTooLong = 3111,
    /// Failed to parse JSON from client data.
    JsonParseError = 3112,
    /// The type field in client data is not "webauthn.get".
    TypeFieldInvalid = 3113,
    /// The challenge in client data does not match expected value.
    ChallengeInvalid = 3114,
    /// The authenticator data format is invalid or too short.
    AuthDataFormatInvalid = 3115,
    /// The User Present (UP) bit is not set in authenticator flags.
    PresentBitNotSet = 3116,
    /// The User Verified (UV) bit is not set in authenticator flags.
    VerifiedBitNotSet = 3117,
    /// Invalid relationship between Backup Eligibility and State bits.
    BackupEligibilityAndStateNotSet = 3118,
}

/// Bit 0 of the authenticator data flags: "User Present" bit.
pub const AUTH_DATA_FLAGS_UP: u8 = 0x01;
/// Bit 2 of the authenticator data flags: "User Verified" bit.
pub const AUTH_DATA_FLAGS_UV: u8 = 0x04;
/// Bit 3 of the authenticator data flags: "Backup Eligibility" bit.
pub const AUTH_DATA_FLAGS_BE: u8 = 0x08;
/// Bit 4 of the authenticator data flags: "Backup State" bit.
pub const AUTH_DATA_FLAGS_BS: u8 = 0x10;

/// Max. length of client_data
pub const CLIENT_DATA_MAX_LEN: usize = 1024;
/// Min. length of authenticator_data
pub const AUTHENTICATOR_DATA_MIN_LEN: usize = 37;

/// WebAuthn signature data structure containing all components needed for verification.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct WebAuthnSigData {
    /// The cryptographic signature (64 bytes for secp256r1).
    pub signature: BytesN<64>,
    /// Raw authenticator data from the WebAuthn response.
    pub authenticator_data: Bytes,
    /// Raw client data JSON from the WebAuthn response.
    pub client_data: Bytes,
}

/// Parsed client data JSON structure for WebAuthn authentication.
#[derive(serde::Deserialize)]
pub struct ClientDataJson<'a> {
    /// Base64url-encoded challenge value that must match the signature payload.
    pub challenge: &'a str,
    /// Type of WebAuthn operation, must be "webauthn.get" for authentication.
    #[serde(rename = "type")]
    pub type_field: &'a str,
}

/// Base64 URL encoding alphabet (without padding).
const BASE64_URL_ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/// Encodes bytes to base64url format (without padding).
fn base64_url_encode(dst: &mut [u8], src: &[u8]) {
    let mut di: usize = 0;
    let mut si: usize = 0;
    let n = (src.len() / 3) * 3;

    while si < n {
        let val = (src[si] as usize) << 16 | (src[si + 1] as usize) << 8 | (src[si + 2] as usize);
        dst[di] = BASE64_URL_ALPHABET[val >> 18 & 0x3F];
        dst[di + 1] = BASE64_URL_ALPHABET[val >> 12 & 0x3F];
        dst[di + 2] = BASE64_URL_ALPHABET[val >> 6 & 0x3F];
        dst[di + 3] = BASE64_URL_ALPHABET[val & 0x3F];
        si += 3;
        di += 4;
    }

    let remain = src.len() - si;
    if remain == 0 {
        return;
    }

    let mut val = (src[si] as usize) << 16;
    if remain == 2 {
        val |= (src[si + 1] as usize) << 8;
    }

    dst[di] = BASE64_URL_ALPHABET[val >> 18 & 0x3F];
    dst[di + 1] = BASE64_URL_ALPHABET[val >> 12 & 0x3F];
    if remain == 2 {
        dst[di + 2] = BASE64_URL_ALPHABET[val >> 6 & 0x3F];
    }
}

/// Extracts a fixed-size array from a Bytes object.
fn extract_from_bytes<const N: usize>(e: &Env, data: &Bytes, start: u32) -> Option<BytesN<N>> {
    if start + N as u32 > data.len() {
        return None;
    }

    let slice = data.slice(start..start + N as u32);
    let buf = slice.to_buffer::<N>();
    let mut items = [0u8; N];
    items.copy_from_slice(buf.as_slice());
    Some(BytesN::<N>::from_array(e, &items))
}

/// Validates that the type field in client data matches "webauthn.get".
fn validate_expected_type(e: &Env, client_data_json: &ClientDataJson) {
    let expected_type = soroban_sdk::String::from_str(e, "webauthn.get");
    if soroban_sdk::String::from_str(e, client_data_json.type_field) != expected_type {
        panic_with_error!(e, WebAuthnError::TypeFieldInvalid)
    }
}

/// Validates that the challenge in client data matches the expected signature payload.
fn validate_challenge(e: &Env, client_data_json: &ClientDataJson, signature_payload: &Bytes) {
    let signature_payload_32: BytesN<32> = extract_from_bytes(e, signature_payload, 0)
        .unwrap_or_else(|| panic_with_error!(e, WebAuthnError::SignaturePayloadInvalid));

    // base64 url encoded value of `signature_payload: Hash<32>`
    let mut expected_challenge = [0u8; 43];
    base64_url_encode(&mut expected_challenge, &signature_payload_32.to_array());

    if client_data_json.challenge.as_bytes() != expected_challenge {
        panic_with_error!(e, WebAuthnError::ChallengeInvalid)
    }
}

/// Validates that the User Present (UP) bit is set in authenticator flags.
fn validate_user_present_bit_set(e: &Env, flags: u8) {
    if (flags & AUTH_DATA_FLAGS_UP) == 0 {
        panic_with_error!(e, WebAuthnError::PresentBitNotSet)
    }
}

/// Validates that the User Verified (UV) bit is set in authenticator flags.
fn validate_user_verified_bit_set(e: &Env, flags: u8) {
    if (flags & AUTH_DATA_FLAGS_UV) == 0 {
        panic_with_error!(e, WebAuthnError::VerifiedBitNotSet)
    }
}

/// Validates the relationship between Backup Eligibility (BE) and Backup State (BS) bits.
fn validate_backup_eligibility_and_state(e: &Env, flags: u8) {
    if (flags & AUTH_DATA_FLAGS_BE) == 0 && (flags & AUTH_DATA_FLAGS_BS) != 0 {
        panic_with_error!(e, WebAuthnError::BackupEligibilityAndStateNotSet)
    }
}

#[contract]
pub struct WebauthnVerifierContract;

#[contractimpl]
impl WebauthnVerifierContract {
    /// Performs complete verification of a WebAuthn Authentication Assertion.
    ///
    /// This function implements the WebAuthn assertion verification procedure as
    /// specified in the W3C WebAuthn specification, with blockchain-specific adaptations.
    ///
    /// # Arguments
    ///
    /// * `signature_payload` - The data that was signed (first 32 bytes used as challenge).
    /// * `pub_key` - The public key (65 bytes for secp256r1).
    /// * `sig_data` - WebAuthnSigData containing signature and associated data.
    ///
    /// # Returns
    ///
    /// Returns `true` if verification succeeds.
    ///
    /// # Verification Steps
    ///
    /// 1. Type is "webauthn.get"
    /// 2. Challenge matches the expected value
    /// 3. Cryptographic signature is valid for the given public key
    /// 4. Confirming physical user presence during authentication
    /// 5. Confirming stronger user authentication (biometrics/PIN)
    /// 6. Backup Eligibility (BE) and Backup State (BS) bits relationship is valid
    ///
    /// # Reference
    ///
    /// https://www.w3.org/TR/webauthn-2/#sctn-verifying-assertion
    pub fn verify(
        e: &Env,
        signature_payload: Bytes,
        pub_key: BytesN<65>,
        sig_data: WebAuthnSigData,
    ) -> bool {
        let WebAuthnSigData { signature, authenticator_data, client_data } = sig_data;

        // Validate client data length
        if client_data.len() > CLIENT_DATA_MAX_LEN as u32 {
            panic_with_error!(e, WebAuthnError::ClientDataTooLong)
        }

        // Parse client data JSON
        let client_data_buf = client_data.to_buffer::<CLIENT_DATA_MAX_LEN>();
        let (client_data_json, _): (ClientDataJson, _) =
            serde_json_core::de::from_slice(client_data_buf.as_slice())
                .unwrap_or_else(|_| panic_with_error!(e, WebAuthnError::JsonParseError));

        // Validate type and challenge
        validate_expected_type(&e, &client_data_json);
        validate_challenge(&e, &client_data_json, &signature_payload);

        // Verify authenticator data has sufficient length (37 bytes minimum):
        // - 32 bytes for rpIdHash
        // - 1 byte for flags
        // - 4 bytes for signature counter
        if authenticator_data.len() < AUTHENTICATOR_DATA_MIN_LEN as u32 {
            panic_with_error!(e, WebAuthnError::AuthDataFormatInvalid)
        }

        // Extract flags byte (at position 32)
        let flags = authenticator_data.get(32).expect("32 byte to be present");

        // Validate authenticator flags
        validate_user_present_bit_set(&e, flags);
        validate_user_verified_bit_set(&e, flags);
        validate_backup_eligibility_and_state(&e, flags);

        // Step 19: Compute client data hash
        let client_data_hash = e.crypto().sha256(&client_data);

        // Step 20: Compute message digest = authenticator_data || client_data_hash
        let mut message_digest = authenticator_data.clone();
        message_digest.extend_from_array(&client_data_hash.to_array());

        // Step 21: Verify signature using secp256r1
        let message_hash = e.crypto().sha256(&message_digest);
        e.crypto().secp256r1_verify(&pub_key, &message_hash, &signature);

        true
    }
}
