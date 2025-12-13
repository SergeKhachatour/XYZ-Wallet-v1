#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String, Symbol, Vec};

    #[test]
    fn test_wallet_creation() {
        let e = Env::default();
        let contract_id = e.register_contract(None, SmartWalletContract);
        let client = SmartWalletContractClient::new(&e, &contract_id);

        // Test basic functionality
        let info = client.get_wallet_info();
        assert_eq!(info.len(), 4);
    }
}
