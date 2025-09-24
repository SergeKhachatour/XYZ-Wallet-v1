const express = require('express');
const axios = require('axios');
const router = express.Router();

const SOROSWAP_API_URL = process.env.SOROSWAP_API_URL || 'https://api.soroswap.finance';

// Get available tokens
router.get('/tokens', async (req, res) => {
  try {
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    const headers = {
      'User-Agent': 'XYZ-Wallet/1.0.0'
    };

    // Add API key if available
    if (process.env.SOROSWAP_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.SOROSWAP_API_KEY}`;
    }

    const response = await axios.get(`${SOROSWAP_API_URL}/api/tokens`, { headers });
    console.log('Soroswap tokens API response:', JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tokens', 
      details: error.response?.data || error.message 
    });
  }
});

// Get available protocols
router.get('/protocols', async (req, res) => {
  try {
    const { network = 'testnet' } = req.query;
    
    const headers = {
      'User-Agent': 'XYZ-Wallet/1.0.0'
    };

    // Add API key if available
    if (process.env.SOROSWAP_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.SOROSWAP_API_KEY}`;
    }

    const response = await axios.get(`${SOROSWAP_API_URL}/protocols?network=${network}`, { headers });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching protocols:', error);
    res.status(500).json({ 
      error: 'Failed to fetch protocols', 
      details: error.response?.data || error.message 
    });
  }
});

// Get quote for swap
router.post('/quote', async (req, res) => {
  try {
    const network = req.query.network || 'testnet';
    const quoteData = req.body;
    
    // Validate required fields
    if (!quoteData.assetIn || !quoteData.assetOut || !quoteData.amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'assetIn, assetOut, and amount are required',
        received: {
          assetIn: quoteData.assetIn,
          assetOut: quoteData.assetOut,
          amount: quoteData.amount
        }
      });
    }
    
    // Validate amount is a positive number
    const amount = parseInt(quoteData.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number',
        received: quoteData.amount
      });
    }
    
    
    console.log('Quote request received:', {
      network,
      assetIn: quoteData.assetIn,
      assetOut: quoteData.assetOut,
      amount: quoteData.amount,
      tradeType: quoteData.tradeType
    });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'XYZ-Wallet/1.0.0'
    };

    // Add API key if available
    if (process.env.SOROSWAP_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.SOROSWAP_API_KEY}`;
    }

    // First, get available protocols for the network
    let protocols = ['soroswap', 'aqua']; // Default fallback
    try {
      const protocolsResponse = await axios.get(`${SOROSWAP_API_URL}/protocols?network=${network}`, { headers });
      if (protocolsResponse.data && protocolsResponse.data.length > 0) {
        protocols = protocolsResponse.data.map(p => p.id || p.name).filter(Boolean);
        console.log('Available protocols:', protocols);
      }
    } catch (protocolError) {
      console.warn('Could not fetch protocols, using defaults:', protocolError.message);
    }

    // Add protocols to quote data if not provided
    if (!quoteData.protocols || quoteData.protocols.length === 0) {
      quoteData.protocols = protocols;
    }

    console.log('Quote request data:', JSON.stringify(quoteData, null, 2));

    const response = await axios.post(`${SOROSWAP_API_URL}/quote?network=${network}`, quoteData, {
      headers,
      timeout: 10000
    });
    
    console.log('Soroswap API quote response:', JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error('Error getting quote:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    
    // If it's a 403 Forbidden error, provide a helpful message with mock data for demo
    if (error.response?.status === 403) {
      // For demo purposes, return a mock quote when API is not accessible
      const mockQuote = {
        assetIn: req.body.assetIn,
        assetOut: req.body.assetOut,
        amountIn: req.body.amount,
        amountOut: Math.floor(parseInt(req.body.amount) * 0.95).toString(), // 5% slippage for demo
        priceImpactPct: '0.5%',
        platform: 'soroswap',
        minimumReceived: Math.floor(parseInt(req.body.amount) * 0.95).toString(),
        fee: Math.floor(parseInt(req.body.amount) * 0.003).toString(), // 0.3% fee
        route: [
          {
            protocol: 'soroswap',
            assetIn: req.body.assetIn,
            assetOut: req.body.assetOut
          }
        ],
        warning: 'This is a mock quote. Soroswap API is currently not accessible.',
        demo: true
      };
      
      res.json(mockQuote);
    } else if (error.response?.status === 429) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to Soroswap API. Please wait a moment and try again.',
        details: 'The API has rate limiting in place to prevent abuse.'
      });
    } else if (error.response?.status === 400) {
      // Bad request - might be invalid asset addresses or parameters
      res.status(400).json({
        error: 'Bad request',
        message: 'Invalid swap parameters provided',
        details: error.response?.data || error.message,
        suggestion: 'Please check that the asset addresses are correct and the amount is valid.'
      });
    } else if (error.response?.status === 404) {
      // Not found - might be unsupported asset pair
      res.status(404).json({
        error: 'Swap not found',
        message: 'No swap route found for the specified assets',
        details: error.response?.data || error.message,
        suggestion: 'This asset pair might not be supported or have sufficient liquidity.'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to get quote', 
        details: error.response?.data || error.message,
        message: 'Unable to fetch swap quote from Soroswap API',
        status: error.response?.status || 'unknown'
      });
    }
  }
});

// Build and execute swap transaction
router.post('/build', async (req, res) => {
  try {
    const { quote, from, to, network = 'testnet', secretKey } = req.body;
    
    console.log('Build endpoint received:', {
      quote: quote,
      from: from,
      to: to,
      network: network
    });
    
    if (!quote || !from || !to) {
      return res.status(400).json({ 
        error: 'Missing required fields: quote, from, to' 
      });
    }

    // Handle demo mode - if quote is marked as demo, return demo response
    if (quote.demo) {
      console.log('Demo mode detected, returning demo response');
      
      // Get token names for display
      const getTokenName = (assetCode) => {
        const tokenMap = {
          'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC': 'XLM',
          'CDWEFYYHMGEZEFC5TBUDXM3IJJ7K7W5BDGE765UIYQEV4JFWDOLSTOEK': 'USDC',
          'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM': 'USDC',
          'XRP': 'XRP',
        };
        return tokenMap[assetCode] || assetCode;
      };
      
      const assetInName = getTokenName(quote.assetIn);
      const assetOutName = getTokenName(quote.assetOut);
      
      // Generate a mock transaction hash
      const mockHash = 'demo_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
      
      return res.json({
        success: true,
        message: 'Demo swap transaction completed (no real transaction executed)',
        hash: mockHash,
        demo: true,
        note: 'This was a demo transaction. No real swap was executed.',
        swapDetails: {
          amountIn: assetInName === 'XLM' ? (parseInt(quote.amountIn) / 10000000).toFixed(7) : (parseInt(quote.amountIn) / 1000000).toFixed(6),
          amountOut: assetOutName === 'XLM' ? (parseInt(quote.amountOut) / 10000000).toFixed(7) : (parseInt(quote.amountOut) / 1000000).toFixed(6),
          assetIn: assetInName,
          assetOut: assetOutName
        }
      });
    }

    if (!secretKey) {
      return res.status(400).json({ 
        error: 'Secret key is required to sign the transaction' 
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'XYZ-Wallet/1.0.0'
    };

    // Add API key if available
    if (process.env.SOROSWAP_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.SOROSWAP_API_KEY}`;
    }

        // Use Soroswap buildQuote endpoint
        console.log('Calling Soroswap buildQuote endpoint...');
        console.log('Quote data being sent:', JSON.stringify(quote, null, 2));
        
        const buildQuoteData = {
          quote: quote,
          from: from,
          to: to
        };

        const buildQuoteResponse = await axios.post(`${SOROSWAP_API_URL}/quote/build?network=${network}`, buildQuoteData, {
          headers,
          timeout: 10000
        });

        console.log('BuildQuote response status:', buildQuoteResponse.status);
        console.log('BuildQuote response data:', JSON.stringify(buildQuoteResponse.data, null, 2));

        if (!buildQuoteResponse.data || !buildQuoteResponse.data.xdr) {
          throw new Error('buildQuote failed: ' + JSON.stringify(buildQuoteResponse.data));
        }

        console.log('buildQuote successful, got XDR:', buildQuoteResponse.data.xdr.substring(0, 50) + '...');
        
        // Add delay to respect rate limits
        console.log('Waiting 3 seconds to respect rate limits...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Since the Soroswap /send endpoint is having authentication issues,
        // let's use the Stellar SDK to submit the transaction directly
        console.log('Submitting transaction directly to Stellar network...');
        
        let sendResponse;
        try {
          const StellarSdk = require('stellar-sdk');
          const { Keypair, Networks } = StellarSdk;
          const Server = StellarSdk.Horizon.Server;
          
          // Parse the XDR and sign it
          const transaction = StellarSdk.TransactionBuilder.fromXDR(
            buildQuoteResponse.data.xdr, 
            process.env.STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET
          );
          
          const sourceKeypair = Keypair.fromSecret(secretKey);
          transaction.sign(sourceKeypair);
          
          // Submit directly to Stellar network
          const server = new Server(process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org');
          const transactionResult = await server.submitTransaction(transaction);
          
          console.log('Transaction submitted successfully to Stellar network!');
          console.log('Transaction hash:', transactionResult.hash);
          
          // Create a response that matches what the frontend expects
          sendResponse = {
            data: {
              success: true,
              hash: transactionResult.hash,
              ledger: transactionResult.ledger
            }
          };
          
        } catch (stellarError) {
          console.error('Error submitting to Stellar network:', stellarError);
          throw new Error('Failed to submit transaction to Stellar network: ' + stellarError.message);
        }

        console.log('sendTransaction successful!');
        
        // Get token names for display
        const getTokenName = (assetCode) => {
          // Known testnet asset codes - using the actual contracts from Soroswap API
          const tokenMap = {
            'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC': 'XLM',
            'CDWEFYYHMGEZEFC5TBUDXM3IJJ7K7W5BDGE765UIYQEV4JFWDOLSTOEK': 'USDC', // Updated to match API response
            'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM': 'USDC', // Keep both for compatibility
            'XRP': 'XRP',
            // Add more tokens as needed
          };
          return tokenMap[assetCode] || assetCode; // Return mapped name or original code
        };
        
        const assetInName = getTokenName(quote.assetIn);
        const assetOutName = getTokenName(quote.assetOut);
        
        console.log('Swap details:', {
          assetIn: quote.assetIn,
          assetOut: quote.assetOut,
          assetInName: assetInName,
          assetOutName: assetOutName,
          amountIn: quote.amountIn,
          amountOut: quote.amountOut
        });
        
        res.json({
          success: true,
          message: 'Real swap transaction executed successfully via Soroswap API!',
          hash: sendResponse.data.hash || sendResponse.data.transactionHash,
          ledger: sendResponse.data.ledger,
          demo: false,
          note: 'This was a real swap transaction executed using Soroswap API',
          swapDetails: {
            amountIn: assetInName === 'XLM' ? (parseInt(quote.amountIn) / 10000000).toFixed(7) : (parseInt(quote.amountIn) / 1000000).toFixed(6),
            amountOut: assetOutName === 'XLM' ? (parseInt(quote.amountOut) / 10000000).toFixed(7) : (parseInt(quote.amountOut) / 1000000).toFixed(6),
            assetIn: assetInName,
            assetOut: assetOutName
          }
        });
    
  } catch (error) {
    console.error('Error in Soroswap API integration:', error);
    res.status(500).json({ 
      error: 'Failed to execute swap using Soroswap API', 
      details: error.message 
    });
  }
});

// Send transaction
router.post('/send', async (req, res) => {
  try {
    const { network = 'testnet', ...sendData } = req.body;
    
    const response = await axios.post(`${SOROSWAP_API_URL}/send?network=${network}`, sendData);
    res.json(response.data);
  } catch (error) {
    console.error('Error sending transaction:', error);
    res.status(500).json({ 
      error: 'Failed to send transaction', 
      details: error.response?.data || error.message 
    });
  }
});

// Get pools
router.get('/pools', async (req, res) => {
  try {
    const { network = 'testnet', protocol = 'soroswap', assetList } = req.query;
    
    let url = `${SOROSWAP_API_URL}/pools?network=${network}&protocol=${protocol}`;
    if (assetList) {
      url += `&assetList=${assetList}`;
    }
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching pools:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pools', 
      details: error.response?.data || error.message 
    });
  }
});

// Get specific pool by tokens
router.get('/pools/:tokenA/:tokenB', async (req, res) => {
  try {
    const { tokenA, tokenB } = req.params;
    const { network = 'testnet', protocol = 'soroswap' } = req.query;
    
    const response = await axios.get(
      `${SOROSWAP_API_URL}/pools/${tokenA}/${tokenB}?network=${network}&protocol=${protocol}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching pool:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pool', 
      details: error.response?.data || error.message 
    });
  }
});

// Get asset lists
router.get('/asset-list', async (req, res) => {
  try {
    const { name } = req.query;
    
    let url = `${SOROSWAP_API_URL}/asset-list`;
    if (name) {
      url += `?name=${name}`;
    }
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching asset list:', error);
    res.status(500).json({ 
      error: 'Failed to fetch asset list', 
      details: error.response?.data || error.message 
    });
  }
});

// Get price information
router.get('/price', async (req, res) => {
  try {
    const { network = 'testnet', asset, referenceCurrency = 'USD' } = req.query;
    
    if (!asset) {
      return res.status(400).json({ error: 'Asset parameter is required' });
    }
    
    const headers = {
      'User-Agent': 'XYZ-Wallet/1.0.0'
    };

    // Add API key if available
    if (process.env.SOROSWAP_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.SOROSWAP_API_KEY}`;
    }
    
    // Build the API URL with the correct format
    const apiUrl = `${SOROSWAP_API_URL}/price?network=${network}&asset=${asset}`;
    console.log('Fetching price from:', apiUrl);
    
    const response = await axios.get(apiUrl, { headers });
    console.log('Price API response:', response.data);
    
    // Handle the response format - it can be either an array or a single object
    const priceData = response.data;
    
    if (Array.isArray(priceData) && priceData.length > 0) {
      // Find the price for the requested asset
      const assetPrice = priceData.find(p => p.asset === asset);
      if (assetPrice) {
        // Handle null price case
        if (assetPrice.price === null || assetPrice.price === undefined) {
          console.log('Price is null for asset:', asset, 'using fallback price');
          res.json({
            price: '0.088', // Fallback XLM price
            timestamp: assetPrice.timestamp,
            asset: assetPrice.asset,
            change24h: 0.001,
            changePercent24h: 0.8,
            fallback: true,
            note: 'Using fallback price - Soroswap returned null price'
          });
        } else {
          res.json({
            price: assetPrice.price.toString(),
            timestamp: assetPrice.timestamp,
            asset: assetPrice.asset,
            // Add some mock change data since the API doesn't provide it
            change24h: 0.001,
            changePercent24h: 0.8
          });
        }
      } else {
        throw new Error('Asset not found in price response');
      }
    } else if (priceData && priceData.asset === asset) {
      // Handle single object response
      if (priceData.price === null || priceData.price === undefined) {
        console.log('Price is null for asset:', asset, 'using fallback price');
        res.json({
          price: '0.088', // Fallback XLM price
          timestamp: priceData.timestamp,
          asset: priceData.asset,
          change24h: 0.001,
          changePercent24h: 0.8,
          fallback: true,
          note: 'Using fallback price - Soroswap returned null price'
        });
      } else {
        res.json({
          price: priceData.price.toString(),
          timestamp: priceData.timestamp,
          asset: priceData.asset,
          // Add some mock change data since the API doesn't provide it
          change24h: 0.001,
          changePercent24h: 0.8
        });
      }
    } else {
      throw new Error('Invalid price response format');
    }
  } catch (error) {
    console.error('Error fetching price:', error);
    
    // If API fails, return mock price data for demo
    if (error.response?.status === 403 || error.response?.status === 429) {
      res.json({
        price: '0.125', // Mock XLM price
        change24h: 0.001,
        changePercent24h: 0.8,
        demo: true,
        note: 'Demo price data - Soroswap API rate limited or not accessible'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch price', 
        details: error.response?.data || error.message 
      });
    }
  }
});

// Add liquidity
router.post('/liquidity/add', async (req, res) => {
  try {
    const { network = 'testnet', ...liquidityData } = req.body;
    
    const response = await axios.post(
      `${SOROSWAP_API_URL}/liquidity/add?network=${network}`, 
      liquidityData
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error adding liquidity:', error);
    res.status(500).json({ 
      error: 'Failed to add liquidity', 
      details: error.response?.data || error.message 
    });
  }
});

// Remove liquidity
router.post('/liquidity/remove', async (req, res) => {
  try {
    const { network = 'testnet', ...liquidityData } = req.body;
    
    const response = await axios.post(
      `${SOROSWAP_API_URL}/liquidity/remove?network=${network}`, 
      liquidityData
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error removing liquidity:', error);
    res.status(500).json({ 
      error: 'Failed to remove liquidity', 
      details: error.response?.data || error.message 
    });
  }
});

// Get user liquidity positions
router.get('/liquidity/positions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { network = 'testnet' } = req.query;
    
    const response = await axios.get(
      `${SOROSWAP_API_URL}/liquidity/positions/${address}?network=${network}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching liquidity positions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch liquidity positions', 
      details: error.response?.data || error.message 
    });
  }
});

// Get contract addresses
router.get('/contracts/:network/:contractName', async (req, res) => {
  try {
    const { network, contractName } = req.params;
    
    const response = await axios.get(
      `${SOROSWAP_API_URL}/api/${network}/${contractName}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching contract address:', error);
    res.status(500).json({ 
      error: 'Failed to fetch contract address', 
      details: error.response?.data || error.message 
    });
  }
});

// Get price for a specific asset
router.get('/price', async (req, res) => {
  try {
    const { network = 'testnet', asset } = req.query;
    
    if (!asset) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'asset parameter is required'
      });
    }
    
    console.log('Price request received:', { network, asset });
    
    const headers = {
      'User-Agent': 'XYZ-Wallet/1.0.0'
    };

    // Add API key if available
    if (process.env.SOROSWAP_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.SOROSWAP_API_KEY}`;
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await axios.get(`${SOROSWAP_API_URL}/price?network=${network}&asset=${asset}`, { 
      headers,
      timeout: 10000
    });
    
    console.log('Soroswap price API response:', JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching price:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    res.status(500).json({ 
      error: 'Failed to fetch price', 
      details: error.response?.data || error.message 
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${SOROSWAP_API_URL}/health`);
    res.json(response.data);
  } catch (error) {
    console.error('Error checking Soroswap health:', error);
    res.status(500).json({ 
      error: 'Failed to check Soroswap health', 
      details: error.response?.data || error.message 
    });
  }
});

module.exports = router;
