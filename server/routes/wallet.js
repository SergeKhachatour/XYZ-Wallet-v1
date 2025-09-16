const express = require('express');
const StellarSdk = require('stellar-sdk');
const { Keypair, Networks, TransactionBuilder, Operation, Asset, Memo } = StellarSdk;
const Server = StellarSdk.Horizon.Server;
const router = express.Router();

// Initialize Stellar server
const server = new Server(process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org');

// Create new wallet account
router.post('/create-account', async (req, res) => {
  try {
    const keypair = Keypair.random();
    
    res.json({
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
      network: process.env.STELLAR_NETWORK || 'testnet'
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account', details: error.message });
  }
});

// Fund account using Stellar Friendbot (testnet only)
router.post('/fund-account', async (req, res) => {
  try {
    const { publicKey } = req.body;
    
    if (!publicKey) {
      return res.status(400).json({ error: 'Public key is required' });
    }

    // Use Stellar Friendbot to fund the account
    const friendbotUrl = `https://friendbot.stellar.org/?addr=${publicKey}`;
    
    const response = await fetch(friendbotUrl);
    const result = await response.json();
    
    if (response.ok) {
      res.json({
        success: true,
        message: 'Account funded successfully with 10,000 XLM',
        transactionHash: result.hash,
        publicKey
      });
    } else {
      res.status(400).json({
        error: 'Failed to fund account',
        details: result.detail || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error funding account:', error);
    res.status(500).json({ error: 'Failed to fund account', details: error.message });
  }
});

// Get account balance
router.get('/balance/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    
    const account = await server.loadAccount(publicKey);
    console.log('Raw Stellar balances:', account.balances);
    
    // For contract-based assets, we need to check the account's data entries
    // Let's also check if there are any contract data entries that might contain USDC balance
    console.log('Account data entries:', account.data);
    
    const balances = account.balances.map(balance => {
      // Map known testnet assets to their proper names
      const assetMap = {
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC': 'XLM',
        'CDWEFYYHMGEZEFC5TBUDXM3IJJ7K7W5BDGE765UIYQEV4JFWDOLSTOEK': 'USDC',
        'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM': 'USDC',
        'XRP': 'XRP'
      };
      
      const assetCode = balance.asset_type === 'native' 
        ? 'XLM' 
        : (assetMap[balance.asset_issuer] || balance.asset_code);
      
      return {
        asset: balance.asset_type === 'native' ? 'XLM' : `${assetCode}:${balance.asset_issuer}`,
        assetType: balance.asset_type,
        assetCode: assetCode,
        assetIssuer: balance.asset_type === 'native' ? null : balance.asset_issuer,
        balance: balance.balance,
        limit: balance.limit || null,
        buyingLiabilities: balance.buying_liabilities || '0',
        sellingLiabilities: balance.selling_liabilities || '0'
      };
    });

    console.log('Processed balances:', balances);

    res.json({
      publicKey,
      balances,
      sequence: account.sequenceNumber(),
      subentryCount: account.subentry_count
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    
    // If account doesn't exist yet, return empty balances
    if (error.message && error.message.includes('Not Found')) {
      res.json({
        publicKey: req.params.publicKey,
        balances: [],
        sequence: '0',
        subentryCount: 0
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch balance', details: error.message });
    }
  }
});

// Get account transactions
router.get('/transactions/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    const { limit = 10, order = 'desc' } = req.query;
    
    const transactions = await server
      .transactions()
      .forAccount(publicKey)
      .order(order)
      .limit(limit)
      .call();

    const formattedTransactions = transactions.records.map(tx => ({
      id: tx.id,
      hash: tx.hash,
      createdAt: tx.created_at,
      sourceAccount: tx.source_account,
      fee: tx.fee_charged,
      operationCount: tx.operation_count,
      successful: tx.successful,
      memo: tx.memo,
      operations: tx.operations
    }));

    res.json({
      publicKey,
      transactions: formattedTransactions,
      next: transactions.next,
      prev: transactions.prev
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    
    // If account doesn't exist yet, return empty transactions
    if (error.message && error.message.includes('Not Found')) {
      res.json({
        publicKey: req.params.publicKey,
        transactions: [],
        next: null,
        prev: null
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
    }
  }
});

// Create payment transaction
router.post('/create-payment', async (req, res) => {
  try {
    const { sourceSecret, destination, amount, asset = 'XLM', memo } = req.body;
    
    if (!sourceSecret || !destination || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sourceKeypair = Keypair.fromSecret(sourceSecret);
    
    // Try to load the account, but handle the case where it doesn't exist yet
    let sourceAccount;
    try {
      sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
    } catch (error) {
      if (error.message && error.message.includes('Not Found')) {
        return res.status(400).json({ 
          error: 'Account not found on Stellar network. Please fund your account first using the Stellar Friendbot or another funded account.',
          details: 'Visit https://www.stellar.org/laboratory/#account-creator?network=testnet to fund your testnet account'
        });
      }
      throw error;
    }

    let paymentAsset;
    if (asset === 'XLM') {
      paymentAsset = Asset.native();
    } else {
      // For custom assets, you would need to provide issuer
      return res.status(400).json({ error: 'Custom assets not implemented yet' });
    }

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: process.env.STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET
    })
    .addOperation(Operation.payment({
      destination,
      asset: paymentAsset,
      amount: amount.toString()
    }))
    .setTimeout(30);

    if (memo) {
      transaction.addMemo(Memo.text(memo));
    }

    const builtTransaction = transaction.build();
    builtTransaction.sign(sourceKeypair);

    res.json({
      xdr: builtTransaction.toXDR(),
      hash: builtTransaction.hash().toString('hex')
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment', details: error.message });
  }
});

// Submit transaction
router.post('/submit-transaction', async (req, res) => {
  try {
    const { xdr } = req.body;
    
    if (!xdr) {
      return res.status(400).json({ error: 'XDR is required' });
    }

    const transaction = StellarSdk.TransactionBuilder.fromXDR(xdr, process.env.STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET);
    const result = await server.submitTransaction(transaction);
    
    res.json({
      hash: result.hash,
      ledger: result.ledger,
      successful: result.successful,
      resultXdr: result.result_xdr
    });
  } catch (error) {
    console.error('Error submitting transaction:', error);
    res.status(500).json({ 
      error: 'Failed to submit transaction', 
      details: error.message,
      response: error.response?.data
    });
  }
});

// Check contract-based asset balance (for USDC)
router.get('/contract-balance/:publicKey/:contractAddress', async (req, res) => {
  try {
    const { publicKey, contractAddress } = req.params;
    
    // For contract-based assets, we need to check the contract's balance for this account
    // This is a simplified approach - in a real implementation, you'd call the contract
    console.log(`Checking contract balance for ${publicKey} on contract ${contractAddress}`);
    
    // For now, let's return a mock response indicating we need to implement contract calls
    res.json({
      publicKey,
      contractAddress,
      balance: '0',
      note: 'Contract balance checking not yet implemented. USDC balance should appear in regular balance check if properly received.'
    });
  } catch (error) {
    console.error('Error checking contract balance:', error);
    res.status(500).json({ 
      error: 'Failed to check contract balance', 
      details: error.message
    });
  }
});

// Get account info
router.get('/account/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    
    const account = await server.loadAccount(publicKey);
    
    res.json({
      publicKey,
      accountId: account.accountId(),
      sequence: account.sequenceNumber(),
      subentryCount: account.subentry_count,
      thresholds: account.thresholds,
      flags: account.flags,
      balances: account.balances,
      signers: account.signers,
      data: account.data
    });
  } catch (error) {
    console.error('Error fetching account info:', error);
    res.status(500).json({ error: 'Failed to fetch account info', details: error.message });
  }
});

module.exports = router;
