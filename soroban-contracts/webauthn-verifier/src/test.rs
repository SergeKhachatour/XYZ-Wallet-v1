#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Bytes as _, Bytes, BytesN, Env};

    #[test]
    fn test_verifier_basic() {
        let e = Env::default();
        let contract_id = e.register_contract(None, WebauthnVerifierContract);
        let client = WebauthnVerifierContractClient::new(&e, &contract_id);

        // Test basic verification functionality
        let signature_payload = Bytes::from_slice(&e, b"test_payload");
        let key_data = BytesN::from_array(&e, &[0u8; 65]);
        let sig_data = Bytes::from_slice(&e, b"test_sig_data");
        
        let result = client.verify(&signature_payload, &key_data, &sig_data);
        assert!(result);
    }
}
