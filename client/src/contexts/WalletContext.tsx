import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import toast from 'react-hot-toast';
import * as StellarSdk from 'stellar-sdk';
import { passkeyService, PasskeyCredential } from '../services/passkeyService';

interface WalletContextType {
  // Account state
  publicKey: string | null;
  secretKey: string | null;
  isConnected: boolean;
  balances: any[];
  transactions: any[];
  
  // Passkey state
  isPasskeyEnabled: boolean;
  passkeyCredential: PasskeyCredential | null;
  
  // Wallet actions
  createAccount: () => void;
  connectAccount: (secretKey: string) => void;
  connectWithPasskey: () => Promise<boolean>;
  disconnectAccount: () => void;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  
  // Passkey actions
  enablePasskey: () => Promise<boolean>;
  disablePasskey: () => Promise<void>;
  
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
  const [isPasskeyEnabled, setIsPasskeyEnabled] = useState(false);
  const [passkeyCredential, setPasskeyCredential] = useState<PasskeyCredential | null>(null);
  const hasLoadedWallet = useRef(false);

  // Initialize Stellar server (unused but kept for potential future use)
  // const server = new StellarSdk.Horizon.Server(process.env.REACT_APP_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org');

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/wallet/balance/${publicKey}`);
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/wallet/transactions/${publicKey}?limit=20`);
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
    
    const loadWalletData = async () => {
      // Check if passkey is enabled first
      const passkeyEnabled = passkeyService.isPasskeyEnabled();
      setIsPasskeyEnabled(passkeyEnabled);
      
      if (passkeyEnabled) {
        // Try to load passkey data
        const passkeyData = await passkeyService.getStoredPasskeyData();
        if (passkeyData) {
          setPasskeyCredential(passkeyData);
          // For passkey wallets, we need to derive the public key from the passkey
          // For now, we'll use a placeholder - in production, this should be derived from the passkey
          const savedPublicKey = localStorage.getItem('wallet_publicKey');
          if (savedPublicKey) {
            setPublicKey(savedPublicKey);
            setIsConnected(true);
            hasLoadedWallet.current = true;
          }
        }
      } else {
        // Fallback to traditional secret key
        const savedPublicKey = localStorage.getItem('wallet_publicKey');
        const savedSecretKey = localStorage.getItem('wallet_secretKey');
        
        if (savedPublicKey && savedSecretKey) {
          setPublicKey(savedPublicKey);
          setSecretKey(savedSecretKey);
          setIsConnected(true);
          hasLoadedWallet.current = true;
        }
      }
    };
    
    loadWalletData();
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

  const connectWithPasskey = async (): Promise<boolean> => {
    try {
      if (!passkeyCredential) {
        toast.error('No passkey credential found');
        return false;
      }

      const auth = await passkeyService.authenticatePasskey(passkeyCredential.id);
      
      // For now, we'll use the stored public key
      // In production, this should be derived from the passkey signature
      const savedPublicKey = localStorage.getItem('wallet_publicKey');
      if (savedPublicKey) {
        setPublicKey(savedPublicKey);
        setIsConnected(true);
        toast.success('Authenticated with passkey successfully!');
        
        // Refresh data
        refreshBalance();
        refreshTransactions();
        return true;
      } else {
        toast.error('No public key found for passkey wallet');
        return false;
      }
    } catch (error) {
      console.error('Passkey authentication failed:', error);
      toast.error('Passkey authentication failed');
      return false;
    }
  };

  const enablePasskey = async (): Promise<boolean> => {
    try {
      if (!publicKey) {
        toast.error('Please create or connect a wallet first');
        return false;
      }

      const userId = `xyz-user-${publicKey.slice(-8)}`;
      const registration = await passkeyService.registerPasskey(userId);
      
      // Store the passkey data
      await passkeyService.storePasskeyData(registration.credentialId, registration.publicKey);
      
      // Update state
      setIsPasskeyEnabled(true);
      setPasskeyCredential({
        id: registration.credentialId,
        publicKey: registration.publicKey,
        counter: 0,
        deviceType: navigator.userAgent.includes('iPhone') ? 'iOS' : 'Other',
        createdAt: new Date().toISOString(),
      });
      
      // Remove secret key from localStorage for security
      localStorage.removeItem('wallet_secretKey');
      setSecretKey(null);
      
      toast.success('Passkey enabled successfully! Your secret key has been removed for security.');
      return true;
    } catch (error) {
      console.error('Failed to enable passkey:', error);
      toast.error('Failed to enable passkey');
      return false;
    }
  };

  const disablePasskey = async (): Promise<void> => {
    try {
      await passkeyService.disablePasskey();
      
      setIsPasskeyEnabled(false);
      setPasskeyCredential(null);
      
      toast.success('Passkey disabled. You can now use secret key authentication.');
    } catch (error) {
      console.error('Failed to disable passkey:', error);
      toast.error('Failed to disable passkey');
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/wallet/create-payment`, {
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
      const submitResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/wallet/submit-transaction`, {
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
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/wallet/fund-account`, {
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
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/wallet/contract-balance/${publicKey}/CDWEFYYHMGEZEFC5TBUDXM3IJJ7K7W5BDGE765UIYQEV4JFWDOLSTOEK`);
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
    isPasskeyEnabled,
    passkeyCredential,
    createAccount,
    connectAccount,
    connectWithPasskey,
    disconnectAccount,
    refreshBalance,
    refreshTransactions,
    enablePasskey,
    disablePasskey,
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
