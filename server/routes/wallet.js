const express = require('express');
const StellarSdk = require('@stellar/stellar-sdk');
const Server = StellarSdk.Horizon.Server;
const router = express.Router();

// Initialize Stellar server
const server = new Server(process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org');

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
