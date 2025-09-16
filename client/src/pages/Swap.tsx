import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ArrowLeftRight, RefreshCw } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SwapContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SwapForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SwapRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`;

const InputGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: end;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-size: 1rem;
  flex: 1;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-size: 1rem;
  min-width: 120px;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
  
  option {
    background: #1a1a1a;
    color: white;
  }
`;

const SwapButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const QuoteInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
`;

const QuoteRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const QuoteLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
`;

const QuoteValue = styled.span`
  font-weight: 600;
  font-family: monospace;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
`;

interface Token {
  name: string;
  contract: string;
  code: string;
  icon: string;
  decimals: number;
}

interface Quote {
  assetIn: string;
  assetOut: string;
  amountIn: string;
  amountOut: string;
  priceImpactPct: string;
  platform: string;
}

const Swap: React.FC = () => {
  const { isConnected, publicKey, balances, refreshBalance, refreshTransactions, secretKey } = useWallet();
  const navigate = useNavigate();
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedTokenIn, setSelectedTokenIn] = useState<string>('');
  const [selectedTokenOut, setSelectedTokenOut] = useState<string>('');
  const [amountIn, setAmountIn] = useState<string>('');
  const [amountOut, setAmountOut] = useState<string>('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingQuote, setIsGettingQuote] = useState(false);

  // Load available tokens
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/soroswap/tokens');
        const data = await response.json();
        
        if (response.ok && data.length > 0) {
          const testnetTokens = data.find((network: any) => network.network === 'testnet');
          if (testnetTokens && testnetTokens.assets) {
            setTokens(testnetTokens.assets);
            // Set default tokens
            const xlmToken = testnetTokens.assets.find((token: Token) => token.code === 'XLM');
            const usdcToken = testnetTokens.assets.find((token: Token) => token.code === 'USDC');
            if (xlmToken) setSelectedTokenIn(xlmToken.contract);
            if (usdcToken) setSelectedTokenOut(usdcToken.contract);
          }
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
        toast.error('Failed to load tokens');
      }
    };

    loadTokens();
  }, []);

  const getQuote = async () => {
    if (!selectedTokenIn || !selectedTokenOut || !amountIn || parseFloat(amountIn) <= 0) return;

    try {
      setIsGettingQuote(true);
      
      const amountInStroops = (parseFloat(amountIn) * 10000000).toString(); // Convert to stroops
      
      // Debug logging
      console.log('Getting quote with:', {
        assetIn: selectedTokenIn,
        assetOut: selectedTokenOut,
        amount: amountInStroops,
        tokenInName: getTokenByContract(selectedTokenIn)?.code,
        tokenOutName: getTokenByContract(selectedTokenOut)?.code
      });
      
      const requestBody = {
        assetIn: selectedTokenIn,
        assetOut: selectedTokenOut,
        amount: amountInStroops,
        tradeType: 'EXACT_IN',
        protocols: ['soroswap', 'aqua'],
        slippageBps: 50
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch('http://localhost:5000/api/soroswap/quote?network=testnet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Quote response received:', data);
        setQuote(data);
        setAmountOut((parseFloat(data.amountOut) / 10000000).toString()); // Convert from stroops
        
        // Show warning if it's a mock quote
        if (data.demo) {
          toast('Demo mode: This is a mock quote. Soroswap API is not accessible.', {
            icon: '⚠️',
            style: {
              background: '#ffc107',
              color: '#000',
            },
          });
        }
        } else {
          // Handle specific error cases
          console.error('Quote request failed:', {
            status: response.status,
            statusText: response.statusText,
            data: data
          });
          
          if (response.status === 400) {
            toast.error(`Bad request: ${data.message || data.error || 'Invalid parameters'}`);
            if (data.suggestion) {
              console.log('Suggestion:', data.suggestion);
            }
          } else if (response.status === 403) {
            toast.error('Soroswap API access denied. Please try again later.');
          } else if (response.status === 404) {
            toast.error(`No swap route found: ${data.message || 'This asset pair is not supported'}`);
            if (data.suggestion) {
              console.log('Suggestion:', data.suggestion);
            }
          } else if (response.status === 429) {
            toast.error('Rate limit exceeded. Please wait a moment and try again.');
          } else if (response.status === 500) {
            toast.error(`Server error: ${data.error || data.message || 'Internal server error'}`);
          } else {
            toast.error(data.message || data.error || 'Failed to get quote');
          }
          setQuote(null);
          setAmountOut('');
        }
    } catch (error) {
      console.error('Error getting quote:', error);
      toast.error('Failed to get quote');
      setQuote(null);
      setAmountOut('');
    } finally {
      setIsGettingQuote(false);
    }
  };

  // Get quote when inputs change (with debouncing)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (selectedTokenIn && selectedTokenOut && amountIn && parseFloat(amountIn) > 0) {
        getQuote();
      } else {
        setQuote(null);
        setAmountOut('');
      }
    }, 1000); // 1 second debounce to avoid rate limiting

    return () => clearTimeout(handler);
  }, [selectedTokenIn, selectedTokenOut, amountIn, getQuote]);

  const executeSwap = async () => {
    if (!quote || !publicKey) return;

    // Check if user has enough balance
    const availableBalance = getBalanceForAsset(selectedTokenIn);
    const requestedAmount = parseFloat(amountIn);
    
    if (requestedAmount > availableBalance) {
      toast.error(`Insufficient balance. You have ${availableBalance.toFixed(7)} ${getTokenByContract(selectedTokenIn)?.code}, but trying to swap ${requestedAmount.toFixed(7)}`);
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('Executing swap with quote:', quote);
      
      // Build transaction
      const buildResponse = await fetch('http://localhost:5000/api/soroswap/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quote: quote,
          from: publicKey,
          to: publicKey,
          network: 'testnet',
          secretKey: secretKey
        }),
      });

      const buildData = await buildResponse.json();
      
      if (!buildResponse.ok) {
        toast.error(buildData.error || 'Failed to build transaction');
        return;
      }

      // Handle the response
      if (buildData.success) {
        console.log('Transaction Hash:', buildData.hash);
        
        // Refresh balances and transactions after successful swap
        // Add a small delay to ensure the transaction is processed on the network
        setTimeout(async () => {
          await refreshBalance();
          await refreshTransactions();
        }, 2000);
        
        // Navigate to transaction completion page with transaction details
        navigate('/transaction-complete', {
          state: {
            transactionHash: buildData.hash,
            swapDetails: buildData.swapDetails,
            note: buildData.note,
            isDemo: buildData.demo
          }
        });
      } else {
        toast.error(buildData.error || 'Failed to execute swap');
      }
      
    } catch (error) {
      console.error('Error executing swap:', error);
      toast.error('Failed to execute swap');
    } finally {
      setIsLoading(false);
    }
  };

  const getTokenByContract = (contract: string) => {
    return tokens.find(token => token.contract === contract);
  };

  const getBalanceForAsset = (assetContract: string) => {
    if (!balances || balances.length === 0) return 0;
    
    // Get the token info to find the asset code
    const token = tokens.find(t => t.contract === assetContract);
    if (!token) return 0;
    
    // For XLM (native asset)
    if (token.code === 'XLM') {
      const xlmBalance = balances.find(b => b.assetType === 'native' || b.assetCode === 'XLM');
      return xlmBalance ? parseFloat(xlmBalance.balance) : 0;
    }
    
    // For other assets, find by asset code (which is what the server returns)
    const assetBalance = balances.find(b => b.assetCode === token.code);
    
    return assetBalance ? parseFloat(assetBalance.balance) : 0;
  };

  if (!isConnected) {
    return (
      <EmptyState>
        <ArrowLeftRight size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2>Connect Your Wallet</h2>
        <p>Please connect your wallet to start swapping tokens</p>
      </EmptyState>
    );
  }

  return (
    <SwapContainer>
      <Section>
        <SectionHeader>
          <SectionTitle>Token Swap</SectionTitle>
          <Button onClick={getQuote} disabled={isGettingQuote}>
            <RefreshCw size={20} />
            Refresh Quote
          </Button>
        </SectionHeader>
        
        <div style={{ 
          background: 'rgba(40, 167, 69, 0.1)', 
          border: '1px solid rgba(40, 167, 69, 0.3)', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginBottom: '1.5rem',
          color: '#28a745'
        }}>
          <strong>✅ Connected:</strong> Soroswap API is connected with your API key. 
          You can get real-time quotes and execute token swaps. The system will attempt to use the real Soroswap API for transaction building, with fallback to custom implementation if needed.
        </div>
        
        <SwapForm>
          <SwapRow>
            <Label>From</Label>
            <InputGroup>
              <Input
                type="number"
                step="0.0000001"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
              />
              <Select
                value={selectedTokenIn}
                onChange={(e) => setSelectedTokenIn(e.target.value)}
              >
                <option value="">Select token</option>
                {tokens.map((token) => (
                  <option key={token.contract} value={token.contract}>
                    {token.code}
                  </option>
                ))}
              </Select>
            </InputGroup>
            {selectedTokenIn && tokens.length > 0 && (
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'rgba(255, 255, 255, 0.7)', 
                marginTop: '0.5rem',
                textAlign: 'right'
              }}>
                Balance: {getBalanceForAsset(selectedTokenIn).toFixed(7)} {getTokenByContract(selectedTokenIn)?.code}
              </div>
            )}
          </SwapRow>

          <SwapRow>
            <Label>To</Label>
            <InputGroup>
              <Input
                type="number"
                step="0.0000001"
                placeholder="0.0"
                value={amountOut}
                readOnly
              />
              <Select
                value={selectedTokenOut}
                onChange={(e) => setSelectedTokenOut(e.target.value)}
              >
                <option value="">Select token</option>
                {tokens.map((token) => (
                  <option key={token.contract} value={token.contract}>
                    {token.code}
                  </option>
                ))}
              </Select>
            </InputGroup>
            {selectedTokenOut && tokens.length > 0 && (
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'rgba(255, 255, 255, 0.7)', 
                marginTop: '0.5rem',
                textAlign: 'right'
              }}>
                Balance: {getBalanceForAsset(selectedTokenOut).toFixed(7)} {getTokenByContract(selectedTokenOut)?.code}
              </div>
            )}
          </SwapRow>

          {quote && (
            <QuoteInfo>
              <QuoteRow>
                <QuoteLabel>Price Impact</QuoteLabel>
                <QuoteValue>{quote.priceImpactPct}%</QuoteValue>
              </QuoteRow>
              <QuoteRow>
                <QuoteLabel>Platform</QuoteLabel>
                <QuoteValue>{quote.platform}</QuoteValue>
              </QuoteRow>
              <QuoteRow>
                <QuoteLabel>Rate</QuoteLabel>
                <QuoteValue>
                  1 {getTokenByContract(selectedTokenIn)?.code} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {getTokenByContract(selectedTokenOut)?.code}
                </QuoteValue>
              </QuoteRow>
            </QuoteInfo>
          )}

          <SwapButton
            type="button"
            onClick={executeSwap}
            disabled={!quote || isLoading || isGettingQuote}
          >
            {isLoading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Executing Swap...
              </>
            ) : isGettingQuote ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Getting Quote...
              </>
            ) : (
              <>
                <ArrowLeftRight size={20} />
                Swap Tokens
              </>
            )}
          </SwapButton>
        </SwapForm>
      </Section>

      {/* Available Tokens */}
      <Section>
        <SectionHeader>
          <SectionTitle>Available Tokens</SectionTitle>
        </SectionHeader>
        
        {tokens.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {tokens.map((token) => (
              <div
                key={token.contract}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <img src={token.icon} alt={token.name} style={{ width: '24px', height: '24px' }} />
                  <span style={{ fontWeight: '600' }}>{token.code}</span>
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                  {token.name}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                  {token.contract.slice(0, 8)}...{token.contract.slice(-8)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>
            Loading available tokens...
          </EmptyState>
        )}
      </Section>
    </SwapContainer>
  );
};

export default Swap;
