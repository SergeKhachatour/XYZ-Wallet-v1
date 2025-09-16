import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import toast from 'react-hot-toast';
import * as StellarSdk from 'stellar-sdk';

interface WalletContextType {
  // Account state
  publicKey: string | null;
  secretKey: string | null;
  isConnected: boolean;
  balances: any[];
  transactions: any[];
  
  // Wallet actions
  createAccount: () => void;
  connectAccount: (secretKey: string) => void;
  disconnectAccount: () => void;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  
  // Transaction actions
  sendPayment: (destination: string, amount: string, asset?: string, memo?: string) => Promise<boolean>;
  fundAccount: () => Promise<boolean>;
  checkUSDCBalance: () => Promise<void>;
  
  // Loading states
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedWallet = useRef(false);

  // Initialize Stellar server (unused but kept for potential future use)
  // const server = new StellarSdk.Horizon.Server(process.env.REACT_APP_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org');

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/wallet/balance/${publicKey}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Balance data received:', data.balances);
        console.log('Full balance response:', data);
        setBalances(data.balances);
      } else {
        console.error('Balance fetch failed:', data);
        toast.error('Failed to fetch balance');
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      
      // Check if it's a connection error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Server is not running. Skipping balance refresh.');
        // Don't show error toast for connection issues - server might be starting up
      } else {
        toast.error('Failed to fetch balance');
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  const refreshTransactions = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/wallet/transactions/${publicKey}?limit=20`);
      const data = await response.json();
      
      if (response.ok) {
        setTransactions(data.transactions);
      } else {
        toast.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      
      // Check if it's a connection error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Server is not running. Skipping transaction refresh.');
        // Don't show error toast for connection issues - server might be starting up
      } else {
        toast.error('Failed to fetch transactions');
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  // Load wallet from localStorage on mount
  useEffect(() => {
    if (hasLoadedWallet.current) return;
    
    const savedPublicKey = localStorage.getItem('wallet_publicKey');
    const savedSecretKey = localStorage.getItem('wallet_secretKey');
    
    if (savedPublicKey && savedSecretKey) {
      setPublicKey(savedPublicKey);
      setSecretKey(savedSecretKey);
      setIsConnected(true);
      hasLoadedWallet.current = true;
    }
  }, []); // Empty dependency array - only run once on mount

  // Refresh data when publicKey changes (but not on initial load)
  useEffect(() => {
    if (publicKey && isConnected && hasLoadedWallet.current) {
      // Use setTimeout to avoid calling functions in dependency array
      setTimeout(() => {
        refreshBalance();
        refreshTransactions();
      }, 0);
    }
  }, [publicKey, isConnected, refreshBalance, refreshTransactions]);

  const createAccount = () => {
    try {
      const keypair = StellarSdk.Keypair.random();
      const newPublicKey = keypair.publicKey();
      const newSecretKey = keypair.secret();
      
      setPublicKey(newPublicKey);
      setSecretKey(newSecretKey);
      setIsConnected(true);
      
      // Save to localStorage
      localStorage.setItem('wallet_publicKey', newPublicKey);
      localStorage.setItem('wallet_secretKey', newSecretKey);
      
      toast.success('New wallet created successfully!');
      
      // Refresh data
      refreshBalance();
      refreshTransactions();
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create wallet');
    }
  };

  const connectAccount = (secretKeyInput: string) => {
    try {
      const keypair = StellarSdk.Keypair.fromSecret(secretKeyInput);
      const newPublicKey = keypair.publicKey();
      
      setPublicKey(newPublicKey);
      setSecretKey(secretKeyInput);
      setIsConnected(true);
      
      // Save to localStorage
      localStorage.setItem('wallet_publicKey', newPublicKey);
      localStorage.setItem('wallet_secretKey', secretKeyInput);
      
      toast.success('Wallet connected successfully!');
      
      // Refresh data
      refreshBalance();
      refreshTransactions();
    } catch (error) {
      console.error('Error connecting account:', error);
      toast.error('Invalid secret key');
    }
  };

  const disconnectAccount = () => {
    setPublicKey(null);
    setSecretKey(null);
    setIsConnected(false);
    setBalances([]);
    setTransactions([]);
    
    // Clear localStorage
    localStorage.removeItem('wallet_publicKey');
    localStorage.removeItem('wallet_secretKey');
    
    toast.success('Wallet disconnected');
  };

  const sendPayment = async (destination: string, amount: string, asset: string = 'XLM', memo?: string): Promise<boolean> => {
    if (!secretKey) {
      toast.error('No wallet connected');
      return false;
    }

    try {
      setIsLoading(true);
      
      // Create payment transaction
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/wallet/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceSecret: secretKey,
          destination,
          amount,
          asset,
          memo
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || 'Failed to create payment');
        return false;
      }

      // Submit transaction
      const submitResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/wallet/submit-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          xdr: data.xdr
        }),
      });

      const submitData = await submitResponse.json();
      
      if (submitResponse.ok) {
        toast.success('Payment sent successfully!');
        refreshBalance();
        refreshTransactions();
        return true;
      } else {
        toast.error(submitData.error || 'Failed to submit payment');
        return false;
      }
    } catch (error) {
      console.error('Error sending payment:', error);
      
      // Check if it's a connection error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        toast.error('Server is not running. Please start the server and try again.');
      } else {
        toast.error('Failed to send payment');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fundAccount = async (): Promise<boolean> => {
    if (!publicKey) {
      toast.error('No wallet connected');
      return false;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/wallet/fund-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: publicKey,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account funded successfully with 10,000 XLM!');
        refreshBalance();
        refreshTransactions();
        return true;
      } else {
        toast.error(`Failed to fund account: ${data.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('Error funding account:', error);
      
      // Check if it's a connection error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        toast.error('Server is not running. Please start the server and try again.');
      } else {
        toast.error('Failed to fund account');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkUSDCBalance = async (): Promise<void> => {
    if (!publicKey) {
      toast.error('No wallet connected');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/wallet/contract-balance/${publicKey}/CDWEFYYHMGEZEFC5TBUDXM3IJJ7K7W5BDGE765UIYQEV4JFWDOLSTOEK`);
      const data = await response.json();

      if (response.ok) {
        toast('USDC is a contract-based asset. Balance should appear automatically after swaps.');
        refreshBalance();
      } else {
        toast.error(`Failed to check USDC balance: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error checking USDC balance:', error);
      toast.error('Failed to check USDC balance');
    } finally {
      setIsLoading(false);
    }
  };

  const value: WalletContextType = {
    publicKey,
    secretKey,
    isConnected,
    balances,
    transactions,
    createAccount,
    connectAccount,
    disconnectAccount,
    refreshBalance,
    refreshTransactions,
    sendPayment,
    fundAccount,
    checkUSDCBalance,
    isLoading
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
