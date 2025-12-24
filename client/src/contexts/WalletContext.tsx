import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import toast from 'react-hot-toast';
import * as StellarSdk from 'stellar-sdk';
import { passkeyService, PasskeyCredential } from '../services/passkeyService';
// SRP service not currently used - will be implemented for full SRP-6a support
// import { srpService, SRPResponse } from '../services/srpService';
import { zkProofService, ZKProofData } from '../services/zkProofService';
import { encryptionService, KEKDerivationParams } from '../services/encryptionService';
import SecretKeyBackupModal from '../components/SecretKeyBackupModal';

interface WalletContextType {
  // Account state
  publicKey: string | null;
  isConnected: boolean;
  balances: any[];
  transactions: any[];
  
  // Passkey state
  passkeyCredential: PasskeyCredential | null;
  
  // ZK Proof state
  zkProof: ZKProofData | null;
  
  // Backup modal state
  showBackupModal: boolean;
  pendingSecretKey: string | null;
  
  // Contract balance state
  contractBalance: string | null; // Total vault balance
  userStake: string | null; // User's personal stake in the contract
  
  // Wallet actions
  connectWithPasskey: () => Promise<boolean>;
  createWalletWithPasskey: () => Promise<boolean>;
  createWalletWithZKProof: () => Promise<boolean>; // New ZK proof wallet creation
  importWalletFromSecretKey: (secretKey: string) => Promise<boolean>; // Import existing wallet from secret key
  disconnectAccount: () => void;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  
  // Transaction actions
  sendPayment: (destination: string, amount: string, asset?: string, memo?: string, paymentSource?: 'wallet' | 'smart-wallet') => Promise<string | false>;
  fundAccount: () => Promise<boolean>;
  
  // Deposit actions
  depositToContract: (amount: string, asset: string, step: 'approve' | 'deposit', onStatusUpdate?: (status: string) => void) => Promise<boolean>;
  getContractBalance: () => Promise<void>;
  
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
  const [isConnected, setIsConnected] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [passkeyCredential, setPasskeyCredential] = useState<PasskeyCredential | null>(null);
  const [zkProof, setZkProof] = useState<ZKProofData | null>(null);
  
  // Backup modal state
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [pendingSecretKey, setPendingSecretKey] = useState<string | null>(null);
  const [contractBalance, setContractBalance] = useState<string | null>(null); // Total vault balance
  const [userStake, setUserStake] = useState<string | null>(null); // User's personal stake
  const hasLoadedWallet = useRef(false);

  // Handle backup confirmation
  const handleBackupConfirm = async () => {
    if (!pendingSecretKey || !publicKey) return;
    
    try {
      setIsLoading(true);
      toast('Encrypting and storing wallet securely...');
      
      // Derive KEK inputs (temporary: derive from passkey + publicKey)
      // In production, replace with SRP session secret once endpoints are finalized
      const sessionSecret = passkeyCredential?.id || publicKey;
      
      // Encrypt and store secret key with passkey-gated access
      const kekParams: KEKDerivationParams = {
        srpSecret: sessionSecret,
        salt: btoa(publicKey) // deterministic salt; replace with SRP salt later
      };
      
      const encryptedData = await encryptionService.encryptAndStoreSecretKey(
        pendingSecretKey,
        kekParams
      );
      
      // Store encrypted data
      encryptionService.storeEncryptedWalletData(encryptedData);
      
      // Fund the account
      await fundAccount();
      
      // Clear pending data
      setPendingSecretKey(null);
      setShowBackupModal(false);
      
      toast.success('Wallet created and encrypted successfully!');
      
    } catch (error) {
      console.error('Error during backup confirmation:', error);
      toast.error(`Failed to encrypt wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

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
        console.error('Transaction fetch failed:', data);
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
      try {
        // Try to load passkey data
        const passkeyData = await passkeyService.getStoredPasskeyData();
        if (passkeyData) {
          console.log('✅ Loaded passkey data from storage:', { 
            credentialId: passkeyData.id, 
            hasPublicKey: !!passkeyData.publicKey 
          });
          setPasskeyCredential(passkeyData);
          
          // Get the public key associated with this passkey
          const savedPublicKey = localStorage.getItem('wallet_publicKey');
          if (savedPublicKey) {
            console.log('✅ Loaded public key from storage:', savedPublicKey);
            setPublicKey(savedPublicKey);
            setIsConnected(true);
            hasLoadedWallet.current = true;
            
            // Refresh balance and transactions after loading
            // Use setTimeout to ensure state is updated first
            setTimeout(() => {
              refreshBalance();
              refreshTransactions();
              getContractBalance();
            }, 100);
          } else {
            console.warn('⚠️ Passkey data found but no public key in storage - clearing orphaned passkey data');
            // Clear orphaned passkey data since there's no associated wallet
            setPasskeyCredential(null);
            await passkeyService.disablePasskey();
          }
        } else {
          console.log('ℹ️ No passkey data found in storage');
        }
      } catch (error) {
        console.error('❌ Error loading wallet data:', error);
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

  const connectWithPasskey = async (): Promise<boolean> => {
    try {
      if (!passkeyCredential) {
        toast.error('No passkey credential found');
        return false;
      }

      await passkeyService.authenticatePasskey(passkeyCredential.id);
      
      // Get the stored public key (user's actual wallet)
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

  const createWalletWithPasskey = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      toast('Creating wallet with passkey...');
      
      // Generate a new Stellar keypair
      const keypair = StellarSdk.Keypair.random();
      const publicKey = keypair.publicKey();
      const secretKey = keypair.secret();
      
      // Register passkey for this wallet
      const passkeyResult = await passkeyService.registerPasskey(publicKey);
      
      if (passkeyResult && passkeyResult.credentialId && passkeyResult.publicKey) {
        // Store public key immediately
        localStorage.setItem('wallet_publicKey', publicKey);
        
        // Create passkey credential object
        const passkeyCredentialData: PasskeyCredential = {
          id: passkeyResult.credentialId,
          publicKey: passkeyResult.publicKey,
          counter: 0,
          deviceType: navigator.userAgent.includes('iPhone') ? 'iOS' : 'Other',
          createdAt: new Date().toISOString(),
        };
        
        // Store passkey credential in state
        setPasskeyCredential(passkeyCredentialData);
        
        // Store passkey credential to localStorage so it persists across page refreshes
        await passkeyService.storePasskeyData(
          passkeyResult.credentialId,
          passkeyResult.publicKey
        );
        
        setPublicKey(publicKey);
        setIsConnected(true);
        
        // Show backup modal for secret key
        setPendingSecretKey(secretKey);
        setShowBackupModal(true);
        
        return true;
      } else {
        toast.error('Failed to register passkey for wallet');
        return false;
      }
    } catch (error) {
      console.error('Wallet creation failed:', error);
      toast.error(`Wallet creation failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createWalletWithZKProof = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      toast('Creating wallet with zero-knowledge proof...');
      
      // Generate a new Stellar keypair
      const keypair = StellarSdk.Keypair.random();
      const publicKey = keypair.publicKey();
      const secretKey = keypair.secret();
      
      // Generate ZK proof for transaction signing capability
      const zkResult = await zkProofService.generateSigningProof(publicKey, secretKey);
      
      if (zkResult.success && zkResult.proofHash) {
        // Store wallet data
        localStorage.setItem('wallet_publicKey', publicKey);
        localStorage.setItem('wallet_secretKey', secretKey); // Store for ZK proof verification
        
        // Store ZK proof data
        const zkProofData: ZKProofData = {
          publicKey,
          proofHash: zkResult.proofHash,
          challenge: '', // Will be filled by the service
          timestamp: Date.now(),
          nonce: ''
        };
        
        setZkProof(zkProofData);
        setPublicKey(publicKey);
        setIsConnected(true);
        
        toast.success('Wallet created with ZK proof successfully!');
        
        // Fund the account
        await fundAccount();
        
        return true;
      } else {
        toast.error('Failed to generate ZK proof for wallet');
        return false;
      }
    } catch (error) {
      console.error('ZK wallet creation failed:', error);
      toast.error(`ZK wallet creation failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const importWalletFromSecretKey = async (secretKey: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      toast('Importing wallet...');
      
      // Validate and create keypair from secret key
      let keypair: StellarSdk.Keypair;
      try {
        keypair = StellarSdk.Keypair.fromSecret(secretKey);
      } catch (error) {
        console.error('Failed to create keypair from secret key:', error);
        toast.error('Invalid secret key format');
        return false;
      }
      
      const publicKey = keypair.publicKey();
      
      // Check if wallet already exists in localStorage
      const existingPublicKey = localStorage.getItem('wallet_publicKey');
      if (existingPublicKey && existingPublicKey !== publicKey) {
        const confirm = window.confirm(
          'A different wallet is already connected. Importing this wallet will disconnect the current one. Continue?'
        );
        if (!confirm) {
          return false;
        }
        // Clear existing wallet state
        setPublicKey(null);
        setIsConnected(false);
        setBalances([]);
        setTransactions([]);
        setPasskeyCredential(null);
        localStorage.removeItem('wallet_publicKey');
        localStorage.removeItem('passkey_credential');
      }
      
      // Register passkey for this imported wallet
      const passkeyResult = await passkeyService.registerPasskey(publicKey);
      
      if (passkeyResult && passkeyResult.credentialId && passkeyResult.publicKey) {
        // Store public key immediately
        localStorage.setItem('wallet_publicKey', publicKey);
        
        // Create passkey credential object
        const passkeyCredentialData: PasskeyCredential = {
          id: passkeyResult.credentialId,
          publicKey: passkeyResult.publicKey,
          counter: 0,
          deviceType: navigator.userAgent.includes('iPhone') ? 'iOS' : 'Other',
          createdAt: new Date().toISOString(),
        };
        
        // Store passkey credential in state
        setPasskeyCredential(passkeyCredentialData);
        
        // Store passkey credential to localStorage
        await passkeyService.storePasskeyData(
          passkeyResult.credentialId,
          passkeyResult.publicKey
        );
        
        // Encrypt and store the secret key
        const sessionSecret = passkeyCredentialData.id || publicKey;
        const kekParams: KEKDerivationParams = {
          srpSecret: sessionSecret,
          salt: btoa(publicKey)
        };
        
        const encryptedData = await encryptionService.encryptAndStoreSecretKey(
          secretKey,
          kekParams
        );
        
        // Store encrypted data
        encryptionService.storeEncryptedWalletData(encryptedData);
        
        setPublicKey(publicKey);
        setIsConnected(true);
        
        toast.success('Wallet imported successfully!');
        
        // Register signer on smart wallet contract (required for deposits)
        // This happens automatically during first deposit, but we do it here proactively
        try {
          console.log('🔧 Registering signer on smart wallet contract...');
          const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
          const contractId = process.env.REACT_APP_SMART_WALLET_CONTRACT_ID;
          
          if (contractId) {
            // The registration will happen automatically on first deposit attempt
            // We don't need to do it here since it requires WebAuthn authentication
            // which happens during the deposit flow
            console.log('ℹ️ Signer registration will happen automatically on first deposit');
          }
        } catch (regError) {
          console.warn('⚠️ Could not pre-register signer (will happen on first deposit):', regError);
          // This is non-critical - registration will happen on first deposit
        }
        
        // Refresh balance and transactions
        setTimeout(() => {
          refreshBalance();
          refreshTransactions();
          getContractBalance();
        }, 100);
        
        return true;
      } else {
        toast.error('Failed to register passkey for imported wallet');
        return false;
      }
    } catch (error) {
      console.error('Wallet import failed:', error);
      toast.error(`Failed to import wallet: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectAccount = () => {
    setPublicKey(null);
    setIsConnected(false);
    setBalances([]);
    setTransactions([]);
    setPasskeyCredential(null);
    
    // Clear localStorage
    localStorage.removeItem('wallet_publicKey');
    localStorage.removeItem('passkey_credential');
    
    toast.success('Wallet disconnected');
  };

  const sendTraditionalPayment = async (destination: string, amount: string, asset: string = 'XLM', memo?: string): Promise<string | false> => {
    if (!isConnected || !publicKey) {
      toast.error('No wallet connected');
      return false;
    }

    try {
      setIsLoading(true);
      
      // Get user's secret key
      let userSecretKey: string;
      try {
        const encryptedData = encryptionService.getEncryptedWalletData();
        if (encryptedData && passkeyCredential) {
          const sessionSecret = passkeyCredential.id || publicKey;
          const kekParams: KEKDerivationParams = {
            srpSecret: sessionSecret,
            salt: encryptedData.salt || btoa(publicKey)
          };
          userSecretKey = await encryptionService.decryptSecretKey(encryptedData, kekParams);
        } else {
          const storedSecretKey = localStorage.getItem('wallet_secretKey');
          if (!storedSecretKey) {
            toast.error('Wallet secret key not found');
            return false;
          }
          userSecretKey = storedSecretKey;
        }
      } catch (error: any) {
        console.error('Error retrieving secret key:', error);
        toast.error('Failed to retrieve wallet secret key');
        return false;
      }

      // Create Stellar payment transaction
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      const sourceKeypair = StellarSdk.Keypair.fromSecret(userSecretKey);
      let sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

      // Validate destination address
      if (!destination || !destination.startsWith('G')) {
        toast.error('Invalid destination address. Must start with "G"');
        return false;
      }

      // Validate and convert amount to stroops (1 XLM = 10,000,000 stroops)
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error('Invalid amount. Must be a positive number');
        return false;
      }

      const amountInStroops = Math.floor(amountNum * 10000000);
      if (amountInStroops <= 0) {
        toast.error('Amount too small. Minimum is 0.0000001 XLM');
        return false;
      }

      // STELLA'S RECOMMENDED APPROACH: Fully atomic, no intermediate checks
      // Sequence number is set at BUILD time, not submit time
      // Remove ALL delays between build and submit
      
      const maxRetries = 3;
      const BASE_RESERVE_XLM = 0.5;
      const feeInXLM = parseFloat(StellarSdk.BASE_FEE) / 10000000;
      
      // Check recent transactions including failed ones (Stella's recommendation)
      // Failed transactions consume sequence numbers and fees, which could explain issues
      try {
        const recentTransactions = await server.transactions()
          .forAccount(sourceKeypair.publicKey())
          .includeFailed(true) // Include failed transactions (Stella's recommendation)
          .order('desc')
          .limit(20)
          .call();
        
        if (recentTransactions.records.length > 0) {
          const successfulTxs = recentTransactions.records.filter(tx => tx.successful);
          const failedTxs = recentTransactions.records.filter(tx => !tx.successful);
          
          console.log('📋 Recent transactions (including failed):', {
            total: recentTransactions.records.length,
            successful: successfulTxs.length,
            failed: failedTxs.length,
            latest: recentTransactions.records[0] ? {
              hash: recentTransactions.records[0].hash,
              successful: recentTransactions.records[0].successful,
              sequence: (recentTransactions.records[0] as any).source_account_sequence,
              created_at: recentTransactions.records[0].created_at,
              operation_count: recentTransactions.records[0].operation_count
            } : null
          });
          
          // Log failed transactions (they consume sequence numbers and fees)
          if (failedTxs.length > 0) {
            console.warn('⚠️ Found failed transactions that consumed sequence numbers and fees:');
            failedTxs.slice(0, 5).forEach((tx: any) => {
              const txTime = new Date(tx.created_at);
              const now = new Date();
              const secondsAgo = (now.getTime() - txTime.getTime()) / 1000;
              console.warn(`  ❌ Seq: ${tx.source_account_sequence}, Hash: ${tx.hash.substring(0, 16)}..., ${secondsAgo.toFixed(1)}s ago`);
              console.warn(`     View on Stellar Expert: https://stellar.expert/explorer/testnet/tx/${tx.hash}`);
            });
            console.warn(`⚠️ Each failed transaction consumed 0.0000100 XLM in fees (${failedTxs.length} × 0.0000100 = ${(failedTxs.length * 0.00001).toFixed(7)} XLM total)`);
          }
          
          // Check for very recent transactions
          const latestTx = recentTransactions.records[0];
          if (latestTx) {
            const txTime = new Date(latestTx.created_at);
            const now = new Date();
            const secondsAgo = (now.getTime() - txTime.getTime()) / 1000;
            
            if (secondsAgo < 10) {
              console.warn(`⚠️ WARNING: Recent transaction found ${secondsAgo.toFixed(2)} seconds ago. This might cause sequence conflicts.`);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not check recent transactions:', error);
      }
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // STELLA'S RECOMMENDED APPROACH: Load account once, build/sign/submit immediately
          console.log(`🔄 Loading account for atomic transaction${attempt > 0 ? ` (retry ${attempt + 1}/${maxRetries})` : ''}...`);
          const account = await server.loadAccount(sourceKeypair.publicKey());
          
          // Check if destination account exists (for account creation requirement)
          let destinationAccountExists = false;
          try {
            const destAccount = await server.loadAccount(destination);
            destinationAccountExists = true;
            console.log('✅ Destination account exists:', {
              address: destination,
              balance: destAccount.balances.find((b: any) => b.asset_type === 'native')?.balance || '0',
              subentryCount: (destAccount as any).subentry_count || 0
            });
          } catch (destError: any) {
            // Account doesn't exist - payment must be at least BASE_RESERVE_XLM to create it
            if (destError.response?.status === 404) {
              console.log('⚠️ Destination account does not exist - payment will create it');
              if (amountNum < BASE_RESERVE_XLM) {
                const errorMsg = `Payment amount must be at least ${BASE_RESERVE_XLM} XLM to create a new account. You're trying to send ${amountNum} XLM.`;
                console.error('❌', errorMsg);
                toast.error(errorMsg);
                return false;
              }
            } else {
              console.warn('⚠️ Could not check destination account:', destError);
            }
          }
          
          // ONE quick balance check (Stella's recommendation)
          const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
          const available = parseFloat(nativeBalance?.balance || '0');
          const subentryCount = (account as any).subentry_count || 0;
          const reserve = (2 + subentryCount) * BASE_RESERVE_XLM;
          
          // Account for liabilities (Stella's recommendation: account for BOTH buying and selling)
          const buyingLiabilities = nativeBalance && 'buying_liabilities' in nativeBalance 
            ? parseFloat((nativeBalance as any).buying_liabilities || '0') 
            : 0;
          const sellingLiabilities = nativeBalance && 'selling_liabilities' in nativeBalance 
            ? parseFloat((nativeBalance as any).selling_liabilities || '0') 
            : 0;
          
          // Payment operation constraint: available - sellingLiabilities - reserve >= amount + fee
          // Also need to ensure: available - buyingLiabilities >= amount (for buying constraint)
          const sellingConstraint = available - sellingLiabilities - reserve;
          const buyingConstraint = available - buyingLiabilities;
          
          // The payment must satisfy BOTH constraints
          const spendable = Math.min(sellingConstraint, buyingConstraint);
          
          // Check if spendable balance is sufficient
          const required = amountNum + feeInXLM;
          
          // CRITICAL: Log the exact balance calculation for debugging
          const constraintCheck = sellingConstraint >= required;
          const buyingCheck = buyingConstraint >= amountNum;
          const margin = spendable - required;
          
          // Log each value separately for better visibility
          console.log('🔍 Balance calculation details:');
          console.log('  Available balance:', available.toFixed(7), 'XLM');
          console.log('  Selling liabilities:', sellingLiabilities.toFixed(7), 'XLM');
          console.log('  Buying liabilities:', buyingLiabilities.toFixed(7), 'XLM');
          console.log('  Reserve:', reserve.toFixed(7), 'XLM');
          console.log('  Subentry count:', subentryCount);
          console.log('  Selling constraint (available - sellingLiabilities - reserve):', sellingConstraint.toFixed(7), 'XLM');
          console.log('  Buying constraint (available - buyingLiabilities):', buyingConstraint.toFixed(7), 'XLM');
          console.log('  Spendable (min of both constraints):', spendable.toFixed(7), 'XLM');
          console.log('  Payment amount:', amountNum.toFixed(7), 'XLM');
          console.log('  Fee:', feeInXLM.toFixed(7), 'XLM');
          console.log('  Required (payment + fee):', required.toFixed(7), 'XLM');
          console.log('  Margin (spendable - required):', margin.toFixed(7), 'XLM');
          console.log('  Selling constraint check:', constraintCheck ? '✅ PASS' : '❌ FAIL', `(${sellingConstraint.toFixed(7)} >= ${required.toFixed(7)})`);
          console.log('  Buying constraint check:', buyingCheck ? '✅ PASS' : '❌ FAIL', `(${buyingConstraint.toFixed(7)} >= ${amountNum.toFixed(7)})`);
          
          // If constraints fail, log detailed breakdown
          if (!constraintCheck || !buyingCheck) {
            console.error('❌ CONSTRAINT FAILURE DETAILS:', {
              sellingConstraint: sellingConstraint,
              required: required,
              sellingConstraintPass: constraintCheck,
              buyingConstraint: buyingConstraint,
              amountNum: amountNum,
              buyingConstraintPass: buyingCheck,
              availableRaw: available,
              reserveRaw: reserve,
              sellingLiabilitiesRaw: sellingLiabilities,
              buyingLiabilitiesRaw: buyingLiabilities
            });
          }
          
          if (spendable < required) {
            const errorMsg = `Insufficient balance: ${available.toFixed(7)} XLM available, ${buyingLiabilities.toFixed(7)} XLM buying liabilities, ${sellingLiabilities.toFixed(7)} XLM selling liabilities, ${reserve.toFixed(7)} XLM reserve, spendable: ${spendable.toFixed(7)} XLM, need ${required.toFixed(7)} XLM (payment + fee)`;
            console.error('❌ Balance check failed:', errorMsg);
            toast.error(errorMsg);
            return false;
          }
          
          // Additional check: ensure the payment operation constraint is met
          if (sellingConstraint < required) {
            const errorMsg = `Payment constraint not met: available (${available.toFixed(7)}) - sellingLiabilities (${sellingLiabilities.toFixed(7)}) - reserve (${reserve.toFixed(7)}) = ${sellingConstraint.toFixed(7)} XLM < required (${required.toFixed(7)} XLM)`;
            console.error('❌ Payment constraint check failed:', errorMsg);
            toast.error(errorMsg);
            return false;
          }
          
          // Log account state for debugging (including all relevant fields)
          console.log('💰 Account state:', {
            available: available.toFixed(7) + ' XLM',
            buyingLiabilities: buyingLiabilities.toFixed(7) + ' XLM',
            sellingLiabilities: sellingLiabilities.toFixed(7) + ' XLM',
            reserve: reserve.toFixed(7) + ' XLM',
            subentryCount: subentryCount,
            payment: amountNum.toFixed(7) + ' XLM',
            fee: feeInXLM.toFixed(7) + ' XLM',
            required: (amountNum + feeInXLM).toFixed(7) + ' XLM',
            spendable: spendable.toFixed(7) + ' XLM',
            margin: (spendable - amountNum - feeInXLM).toFixed(7) + ' XLM',
            accountSequence: account.sequenceNumber().toString(),
            accountFlags: (account as any).flags,
            numSubEntries: (account as any).num_sub_entries || subentryCount
          });
          
          // Build transaction immediately (Stella's recommendation)
          const accountSequence = account.sequenceNumber();
          console.log('🔨 Building transaction with account sequence:', accountSequence.toString());
          
          const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET
          })
            .addOperation(
              StellarSdk.Operation.payment({
                // CRITICAL: Do NOT set 'source' field - it must use transaction source account
                // If we set source here, op_underfunded would refer to that account, not transaction source!
                destination: destination,
                asset: StellarSdk.Asset.native(),
                // CRITICAL: Operation.payment() expects amount as string in XLM format, NOT stroops!
                // Passing stroops would be interpreted as 330000000 XLM instead of 33 XLM!
                amount: amountNum.toFixed(7) // Format as XLM string with 7 decimal places
              })
            );
          
          // Add memo if provided
          if (memo && memo.trim()) {
            transaction.addMemo(StellarSdk.Memo.text(memo.trim()));
          }
          
          // Stella: Use 180 second timeout (3 minutes)
          const builtTransaction = transaction.setTimeout(180).build();
          
          // Sign immediately
          builtTransaction.sign(sourceKeypair);
          
          // Verify sequence number (Stella's debug check)
          const transactionSequence = builtTransaction.sequence;
          const expectedSequence = BigInt(accountSequence) + BigInt(1);
          const transactionHash = builtTransaction.hash().toString('hex');
          
          console.log('🔨 Transaction built:', {
            accountSequence: accountSequence.toString(),
            transactionSequence: transactionSequence.toString(),
            expectedSequence: expectedSequence.toString(),
            sequenceMatch: BigInt(transactionSequence) === expectedSequence ? '✅' : '❌',
            amount: amountNum.toFixed(7) + ' XLM',
            fee: feeInXLM.toFixed(7) + ' XLM',
            hash: transactionHash
          });
          
          // Stella's debug check: If sequence doesn't match, we have a bug
          if (BigInt(transactionSequence) !== expectedSequence) {
            console.error('❌ CRITICAL: Transaction sequence mismatch!');
            console.error(`  Account sequence: ${accountSequence}`);
            console.error(`  Expected transaction sequence: ${expectedSequence.toString()}`);
            console.error(`  Actual transaction sequence: ${transactionSequence}`);
            console.error('  This indicates a bug - transaction will fail with tx_bad_seq');
            // Don't throw - let Horizon reject it with proper error code
          }
          
          // Submit immediately - NO additional checks between build and submit (Stella's critical requirement)
          // DO NOT reload account or do any checks here - it creates timing windows!
          toast(`Submitting payment transaction${attempt > 0 ? ` (retry ${attempt + 1}/${maxRetries})` : ''}...`);
          console.log('📤 Submitting transaction to Horizon...');
          console.log('📤 Transaction hash:', transactionHash);
          
          // Log transaction envelope for debugging (can be used to check on Stellar Expert)
          const envelopeXdr = builtTransaction.toEnvelope().toXDR('base64');
          console.log('📋 Transaction envelope XDR (for Stellar Expert):', envelopeXdr);
          console.log('📋 Stellar Expert link:', `https://stellar.expert/explorer/testnet/tx/${transactionHash}`);
          
          // Decode XDR to verify operation source account (Stella's CRITICAL check)
          try {
            // Use built transaction directly (easier than decoding XDR)
            const txSourceAccount = builtTransaction.source;
            const feeStroops = typeof builtTransaction.fee === 'string' ? parseInt(builtTransaction.fee) : builtTransaction.fee;
            
            console.log('📋 Transaction verification (Stella\'s check):', {
              transactionSource: txSourceAccount,
              sequenceNumber: builtTransaction.sequence.toString(),
              fee: feeStroops + ' stroops (' + (feeStroops / 10000000).toFixed(7) + ' XLM)',
              operationCount: builtTransaction.operations.length
            });
            
            // CRITICAL: Check if payment operation has a different source account (Stella's diagnosis)
            builtTransaction.operations.forEach((op: any, idx: number) => {
              if (op.type === 'payment') {
                const opSource = op.source || null; // Operation source (if set)
                
                if (opSource && opSource !== txSourceAccount) {
                  console.error(`❌ CRITICAL BUG FOUND: Operation ${idx} has DIFFERENT source account!`);
                  console.error(`  Transaction source: ${txSourceAccount}`);
                  console.error(`  Operation source: ${opSource}`);
                  console.error(`  This will cause op_underfunded because the operation checks the wrong account!`);
                } else {
                  console.log(`✅ Operation ${idx} uses transaction source account (${opSource ? 'explicit match' : 'no explicit source set - correct'})`);
                }
                
                // Log payment details
                // op.amount is in stroops, convert to XLM for display
                const paymentAmountStroops = typeof op.amount === 'string' ? parseFloat(op.amount) : op.amount;
                const paymentAmountXLM = (paymentAmountStroops / 10000000).toFixed(7);
                console.log(`  Payment ${idx} details:`, {
                  destination: op.destination,
                  amount: paymentAmountXLM + ' XLM',
                  amountStroops: paymentAmountStroops,
                  asset: op.asset.code || 'native'
                });
              }
            });
          } catch (decodeError) {
            console.warn('⚠️ Could not verify transaction:', decodeError);
          }
          
          try {
            const result = await server.submitTransaction(builtTransaction);
            
            console.log('✅ Traditional payment successful:', result);
            toast.success('Payment sent successfully!');
            
            // Refresh balances
            setTimeout(async () => {
              await refreshBalance();
            }, 2000);
            
            return result.hash;
          } catch (submitError: any) {
            // Handle 504 timeout (transaction might still be processing)
            if (submitError.response?.status === 504) {
              console.log('⏳ Received 504 timeout, polling for transaction...');
              try {
                for (let i = 0; i < 10; i++) {
                  try {
                    const tx = await server.transactions().transaction(transactionHash).call();
                    console.log(`✅ Transaction found after ${i + 1} attempt(s):`, tx.hash);
                    toast.success('Payment sent successfully!');
                    setTimeout(async () => {
                      await refreshBalance();
                    }, 2000);
                    return tx.hash;
                  } catch (pollError: any) {
                    if (pollError.response?.status === 404) {
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      continue;
                    }
                    throw pollError;
                  }
                }
              } catch (pollError) {
                console.error('❌ Polling failed:', pollError);
                // Re-throw submitError to continue with normal error handling
                throw submitError;
              }
            }
            
            // Re-throw to continue with normal error handling
            throw submitError;
          }
          
        } catch (error: any) {
          const errorResponse = error.response?.data;
          const resultCodes = errorResponse?.extras?.result_codes;
          const transactionCode = resultCodes?.transaction;
          const operations = resultCodes?.operations || [];
          
          // Retry on sequence errors (tx_bad_seq) - Stella's recommendation
          if (transactionCode === 'tx_bad_seq' && attempt < maxRetries - 1) {
            console.warn(`⚠️ Sequence error (tx_bad_seq) on attempt ${attempt + 1}, retrying with fresh account state...`);
            
            // Exponential backoff: 1s, 2s, 4s
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Continue loop to rebuild transaction with fresh account
            continue;
          }
          
          // Handle op_underfunded - check if it's a race condition (Stella's recommendation)
          if (operations.includes('op_underfunded') && attempt < maxRetries - 1) {
            console.warn(`⚠️ op_underfunded error on attempt ${attempt + 1}, checking current balance...`);
            
            try {
              // Reload account to check if balance is actually sufficient
              const currentAccount = await server.loadAccount(sourceKeypair.publicKey());
              const currentNativeBalance = currentAccount.balances.find((b: any) => b.asset_type === 'native');
              const currentAvailable = parseFloat(currentNativeBalance?.balance || '0');
              const currentSubentryCount = (currentAccount as any).subentry_count || 0;
              const currentReserve = (2 + currentSubentryCount) * BASE_RESERVE_XLM;
              const currentBuyingLiabilities = currentNativeBalance && 'buying_liabilities' in currentNativeBalance 
                ? parseFloat((currentNativeBalance as any).buying_liabilities || '0') 
                : 0;
              const currentSellingLiabilities = currentNativeBalance && 'selling_liabilities' in currentNativeBalance 
                ? parseFloat((currentNativeBalance as any).selling_liabilities || '0') 
                : 0;
              
              // Stella's formula: Spendable is the MINIMUM of these constraints
              const currentSpendable = Math.min(
                currentAvailable - currentBuyingLiabilities - currentReserve,
                currentAvailable - currentSellingLiabilities - currentReserve
              );
              
              // Stella's check: spendable >= amount + fee
              if (currentSpendable >= amountNum + feeInXLM) {
                console.log('✅ Balance is sufficient - this is a race condition, retrying...');
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // Retry with fresh account state
              } else {
                // Balance is actually insufficient
                throw new Error(`Insufficient balance: ${currentAvailable.toFixed(7)} XLM available, need ${(amountNum + feeInXLM + currentReserve).toFixed(7)} XLM`);
              }
            } catch (balanceCheckError) {
              // If we can't check balance, assume it's a race condition and retry
              if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`⏳ Waiting ${delay}ms before retry (could not verify balance)...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
            }
          }
          
          // Handle 504 timeout - transaction might still process (Stella's recommendation)
          if (error.response?.status === 504 && attempt < maxRetries - 1) {
            console.warn(`⚠️ 504 timeout on attempt ${attempt + 1}`);
            const delay = 30000 * (attempt + 1); // 30s, 60s, 90s
            console.log(`⏳ Waiting ${delay}ms before retry (transaction might still process)...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // Log full error details (Stella's recommendation)
          console.error('❌ Transaction failed:', {
            transactionCode,
            operations,
            resultCodes: JSON.stringify(resultCodes, null, 2),
            resultXdr: errorResponse?.extras?.result_xdr
          });
          
          // Decode result XDR if available
          if (errorResponse?.extras?.result_xdr) {
            try {
              const resultXdr = StellarSdk.xdr.TransactionResult.fromXDR(errorResponse.extras.result_xdr, 'base64');
              const result = resultXdr.result();
              const resultType = result.switch().name;
              console.error('📋 Decoded result XDR:', {
                resultType,
                feeCharged: resultXdr.feeCharged().toString(),
                operationResults: result.results()?.length || 0
              });
            } catch (xdrError) {
              console.warn('⚠️ Could not decode result XDR:', xdrError);
            }
          }
          
          // Extract user-friendly error message
          let errorMsg = 'Payment failed';
          if (transactionCode === 'tx_bad_seq') {
            errorMsg = 'Transaction sequence number conflict. Please try again.';
          } else if (operations.includes('op_underfunded')) {
            errorMsg = 'Insufficient balance for this transaction. Please check your wallet balance.';
          } else if (operations.includes('op_no_destination')) {
            errorMsg = 'Destination account does not exist. Payment amount must be at least 1.0 XLM to create a new account.';
          } else if (errorResponse?.detail) {
            errorMsg = errorResponse.detail;
          }
          
          toast.error(errorMsg);
          throw error;
        }
      }
      
      throw new Error(`Transaction submission failed after ${maxRetries} attempts`);
    } catch (error: any) {
      console.error('Traditional payment error:', error);
      
      // Extract detailed error message from Horizon response
      let errorMsg = 'Payment failed';
      let errorDetails: any = {};
      
      if (error.response?.data) {
        const data = error.response.data;
        console.error('Horizon error response:', data);
        errorDetails = data;
        
        // Try to extract operation error code
        if (data.extras?.result_codes?.operations) {
          const opError = data.extras.result_codes.operations[0];
          errorMsg = `Operation failed: ${opError}`;
          console.error('Operation result codes:', data.extras.result_codes.operations);
          console.error('Full result codes object:', JSON.stringify(data.extras.result_codes, null, 2));
        } else if (data.extras?.result_codes?.transaction) {
          errorMsg = `Transaction failed: ${data.extras.result_codes.transaction}`;
          console.error('Transaction result code:', data.extras.result_codes.transaction);
          console.error('Full result codes object:', JSON.stringify(data.extras.result_codes, null, 2));
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (data.title) {
          errorMsg = data.title;
        } else if (data.type) {
          errorMsg = data.type;
        }
        
        // Log full extras for debugging
        if (data.extras) {
          console.error('Full extras object:', JSON.stringify(data.extras, null, 2));
          
          // Try to decode result_xdr if available
          if (data.extras.result_xdr) {
            try {
              const resultXdr = StellarSdk.xdr.TransactionResult.fromXDR(data.extras.result_xdr, 'base64');
              const result = resultXdr.result();
              const resultType = result.switch().name;
              const operationResults = result.results()?.map((opResult: any, index: number) => {
                const opCode = opResult.tr().switch().name;
                let opDetails: any = { 
                  index,
                  code: opCode,
                  raw: opResult.tr()
                };
                
                // Try to extract more details based on operation type
                if (opCode === 'opPayment') {
                  try {
                    const paymentResult = opResult.tr().paymentResult();
                    if (paymentResult) {
                      const paymentResultType = paymentResult.switch().name;
                      opDetails.paymentResult = paymentResultType;
                      
                      if (paymentResultType === 'paymentMalformed') {
                        opDetails.error = 'Payment malformed';
                      } else if (paymentResultType === 'paymentUnderfunded') {
                        opDetails.error = 'Payment underfunded - source account lacks sufficient funds';
                        opDetails.details = 'The source account does not have enough balance to complete the payment while maintaining the minimum reserve.';
                      } else if (paymentResultType === 'paymentSrcNoTrust') {
                        opDetails.error = 'Source account does not trust asset';
                      } else if (paymentResultType === 'paymentSrcNotAuthorized') {
                        opDetails.error = 'Source account not authorized';
                      } else if (paymentResultType === 'paymentNoDestination') {
                        opDetails.error = 'Destination account does not exist';
                      } else if (paymentResultType === 'paymentNoTrust') {
                        opDetails.error = 'Destination account does not trust asset';
                      } else if (paymentResultType === 'paymentNotAuthorized') {
                        opDetails.error = 'Destination account not authorized';
                      } else if (paymentResultType === 'paymentLineFull') {
                        opDetails.error = 'Payment line full';
                      } else if (paymentResultType === 'paymentNoIssuer') {
                        opDetails.error = 'Payment issuer does not exist';
                      } else if (paymentResultType === 'paymentSuccess') {
                        opDetails.error = 'Payment succeeded (unexpected - should not be in failed transaction)';
                      }
                    }
                  } catch (paymentError) {
                    console.error('Error extracting payment result details:', paymentError);
                    opDetails.extractionError = paymentError instanceof Error ? paymentError.message : String(paymentError);
                  }
                }
                
                return opDetails;
              });
              
              console.error('🔍 Decoded result_xdr:', {
                feeCharged: resultXdr.feeCharged().toString(),
                feeChargedXLM: (parseInt(resultXdr.feeCharged().toString()) / 10000000).toFixed(7),
                resultType,
                operationResultsCount: operationResults?.length || 0,
                operationResults: operationResults
              });
              
              // Log each operation result separately for better visibility
              if (operationResults && operationResults.length > 0) {
                operationResults.forEach((opResult: any, idx: number) => {
                  console.error(`🔍 Operation ${idx} result:`, JSON.stringify(opResult, null, 2));
                });
              }
            } catch (xdrError) {
              console.error('Error decoding result_xdr:', xdrError);
            }
          }
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      // Check for specific error types and provide user-friendly messages
      if (errorMsg.includes('op_no_trust')) {
        errorMsg = 'Recipient does not trust the asset. They need to add a trustline.';
      } else if (errorMsg.includes('op_no_destination') || errorMsg.includes('destination')) {
        errorMsg = 'Invalid destination address. Please check the recipient address.';
      } else if (errorMsg.includes('op_underfunded') || errorMsg.includes('insufficient') || errorMsg.includes('underfunded')) {
        // Get current account state for debugging when op_underfunded occurs
        // Note: We can't access server, sourceKeypair, amountNum, feeInXLM here as they're in the outer scope
        // So we'll just provide a generic error message
        errorMsg = 'Insufficient balance for this transaction. Please check your wallet balance and ensure you have enough to cover the payment amount, transaction fee, and minimum reserve (1 XLM).';
      } else if (errorMsg.includes('op_low_reserve')) {
        errorMsg = 'Insufficient balance. Account must maintain minimum reserve (1 XLM).';
      } else if (errorMsg.includes('tx_bad_seq')) {
        errorMsg = 'Transaction sequence number error. Please try again.';
      } else if (errorMsg.includes('tx_insufficient_fee')) {
        errorMsg = 'Transaction fee too low. Please try again.';
      }
      
      console.error('Final error message:', errorMsg);
      console.error('Full error details:', errorDetails);
      toast.error(`Payment failed: ${errorMsg}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendPayment = async (destination: string, amount: string, asset: string = 'XLM', memo?: string, paymentSource: 'wallet' | 'smart-wallet' = 'wallet'): Promise<string | false> => {
    if (!isConnected || !publicKey) {
      toast.error('No wallet connected');
      return false;
    }

    console.log('💰 sendPayment called with paymentSource:', paymentSource, 'type:', typeof paymentSource);

    try {
      setIsLoading(true);
      
      // If using wallet balance, do traditional Stellar payment
      if (paymentSource === 'wallet') {
        console.log('💳 Using traditional payment (wallet balance)');
        return await sendTraditionalPayment(destination, amount, asset, memo);
      }
      
      // Otherwise, use smart wallet contract (existing flow)
      console.log('🔐 Using smart wallet payment (contract balance) - will require passkey authentication');
      let userSecretKey: string;
      let authResult: any = null;
      let isZKProofWallet = false;

      // Create transaction data FIRST (before WebAuthn) so we can use it as the challenge
      const amountString = String(amount);
      const timestamp = Date.now();
      const transactionData = {
        source: publicKey,
        destination,
        amount: amountString,
        asset,
        memo,
        timestamp: timestamp
      };
      
      const transactionDataJSON = JSON.stringify(transactionData);
      
      // ALWAYS require passkey authentication if passkey credential exists
      if (passkeyCredential) {
        // Create challenge from first 32 bytes of transaction data (same pattern as deposit)
        // The verifier will base64url-encode these 32 bytes and compare with challenge in clientDataJSON
        const transactionDataBytes = new TextEncoder().encode(transactionDataJSON);
        const challengeBytes = transactionDataBytes.slice(0, 32);
        
        // Pad to 32 bytes if needed
        const paddedChallenge = new Uint8Array(32);
        paddedChallenge.set(challengeBytes, 0);
        
        // Use this challenge for WebAuthn authentication (so it matches what we'll send as signature payload)
        toast('Authenticating with passkey for transaction...');
        console.log('🔐 Requesting passkey authentication with transaction data challenge...');
        authResult = await passkeyService.authenticatePasskey(passkeyCredential.id, paddedChallenge);
        console.log('✅ Passkey authentication result:', {
          credentialId: authResult?.credentialId,
          signatureLength: authResult?.signature?.length || 0,
          signaturePreview: authResult?.signature ? authResult.signature.substring(0, 30) + '...' : 'EMPTY'
        });
        toast.success('Passkey authentication successful!');
        
        // Verify that the challenge in clientDataJSON matches the expected challenge
        if (authResult) {
          const clientDataJSONString = atob(authResult.clientDataJSON);
          const clientData = JSON.parse(clientDataJSONString);
          const challengeBase64Url = clientData.challenge;
          
          // Base64url-encode our challenge to compare (browser-compatible, no Buffer)
          const expectedChallengeBase64Url = btoa(String.fromCharCode(...paddedChallenge))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, ''); // Remove padding for base64url
          
          console.log('📋 Challenge verification for execute_payment:');
          console.log(`  - Expected challenge (base64url from transaction data): ${expectedChallengeBase64Url}`);
          console.log(`  - Actual challenge (base64url from clientDataJSON): ${challengeBase64Url}`);
          console.log(`  - Do they match? ${expectedChallengeBase64Url === challengeBase64Url}`);
          
          if (expectedChallengeBase64Url !== challengeBase64Url) {
            console.error('❌ WebAuthn challenge mismatch for execute_payment! This will cause verification to fail.');
            toast.error('WebAuthn challenge mismatch. Please try again.');
            return false;
          }
          
          console.log('✅ WebAuthn challenge matches expected value for execute_payment.');
        }
        
        // Try to decrypt secret key using passkey-gated encryption
        try {
          const encryptedData = encryptionService.getEncryptedWalletData();
          if (!encryptedData) {
            throw new Error('No encrypted wallet data found');
          }
          
          // Derive KEK inputs (temporary until SRP endpoints are wired)
          const sessionSecret = passkeyCredential?.id || publicKey;
          
          // Decrypt secret key with passkey-gated access
          const kekParams: KEKDerivationParams = {
            srpSecret: sessionSecret,
            salt: btoa(publicKey)
          };
          
          userSecretKey = await encryptionService.decryptSecretKey(encryptedData, kekParams);
          toast('Using passkey-gated encrypted secret key...');
        } catch (error) {
          // If passkey decryption fails, check if we have a ZK proof wallet with stored secret key
          const storedSecretKey = localStorage.getItem('wallet_secretKey');
          if (storedSecretKey) {
            userSecretKey = storedSecretKey;
            isZKProofWallet = true;
            toast('Using ZK proof wallet secret key (passkey encrypted storage not available)...');
          } else {
            throw new Error('Failed to decrypt secret key. Please re-authenticate with your passkey.');
          }
        }
      } else {
        // No passkey available - check for ZK proof wallet
        const storedSecretKey = localStorage.getItem('wallet_secretKey');
        if (storedSecretKey) {
          userSecretKey = storedSecretKey;
          isZKProofWallet = true;
          toast('Using ZK proof wallet for transaction...');
        } else {
          toast.error('No authentication method available. Please create a wallet first.');
          return false;
        }
      }
      
      // Generate ZK proof for this specific transaction (using the transaction data we already created)
      toast('Generating zero-knowledge proof...');
      console.log('💰 Amount conversion:', {
        original: amount,
        type: typeof amount,
        asString: amountString,
        parsed: parseFloat(amountString)
      });
      
      const zkProofResult = await zkProofService.generateSigningProof(
        publicKey, 
        userSecretKey,
        transactionDataJSON
      );
      
      if (!zkProofResult.success || !zkProofResult.proofHash) {
        toast.error('Failed to generate ZK proof for transaction');
        return false;
      }
      
      toast.success('ZK proof generated successfully!');
      
      // Now execute the transaction with the appropriate signature data
      const requestBody = {
        contractId: process.env.REACT_APP_SMART_WALLET_CONTRACT_ID!,
        transactionData: transactionDataJSON, // Send the JSON string directly
        signature: authResult?.signature || '',
        passkeyPublicKey: passkeyCredential?.publicKey || '',
        authenticatorData: authResult?.authenticatorData || '',
        clientDataJSON: authResult?.clientDataJSON || '',
        signaturePayload: transactionDataJSON, // Send full JSON as signature payload (backend will extract first 32 bytes)
        userSecretKey: userSecretKey, // Provide the user's secret key for signing
        // ZK Proof data
        zkProof: {
          proofHash: zkProofResult.proofHash!,
          challenge: zkProofResult.challenge!,
          timestamp: zkProofResult.timestamp!,
          nonce: zkProofResult.nonce!
        },
        networkPassphrase: 'Test SDF Network ; September 2015',
        rpcUrl: 'https://soroban-testnet.stellar.org:443'
      };
      
      // No approve() needed - Soroban's authorization framework handles this in a single transaction
      // The contract uses require_auth() which bundles authorization and execution
      console.log('🚀 Sending smart wallet transaction request:', {
        contractId: requestBody.contractId,
        hasZKProof: !!requestBody.zkProof,
        isZKProofWallet,
        hasPasskey: !!passkeyCredential,
        signatureLength: requestBody.signature?.length || 0,
        signaturePreview: requestBody.signature ? requestBody.signature.substring(0, 30) + '...' : 'EMPTY',
        passkeyPublicKeyLength: requestBody.passkeyPublicKey?.length || 0
      });
      
      const backendUrl = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/smart-wallet/execute-transaction`;
      console.log('📡 Fetching from:', backendUrl);
      
      // Add timeout to fetch request (60 seconds for Soroban transactions)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      let response;
      try {
        response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timeout: The transaction took too long. Please try again.');
        }
        throw fetchError;
      }

      console.log('📥 Backend response status:', response.status);
      console.log('📥 Backend response ok:', response.ok);
      
      let data;
      try {
        const responseText = await response.text();
        console.log('📥 Backend response text length:', responseText.length);
        console.log('📥 Backend response text preview:', responseText.substring(0, 200));
        data = JSON.parse(responseText);
        console.log('📥 Backend response data:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse backend response:', parseError);
        throw new Error(`Failed to parse backend response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      if (response.ok) {
        if (data.success) {
          const txHash = data.transactionHash || data.stellarTransactionHash || data.transactionId;
          const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;
          
          console.log('✅ Smart contract transaction successful:', {
            transactionHash: txHash,
            contractId: data.contractId,
            function: data.function,
            status: data.result?.status,
            explorerUrl: explorerUrl
          });
          
          console.log('🔗 View transaction on Stellar Explorer:', explorerUrl);
          console.log('📋 Transaction hash:', txHash);
          
          // Check if transaction is still pending
          if (data.result?.status === 'PENDING' || data.result?.status === 'TRY_AGAIN_LATER') {
            toast.success(
              `Transaction sent! Hash: ${txHash.substring(0, 16)}... Check console for Explorer link`,
              { duration: 8000 }
            );
          } else if (data.result?.status === 'SUCCESS') {
            toast.success(`Transaction confirmed! Hash: ${txHash.substring(0, 16)}...`, {
              duration: 5000
            });
          } else {
            toast.success(`Transaction executed! Hash: ${txHash.substring(0, 16)}...`, {
              duration: 5000
            });
          }
          
          // Check for refund suggestion (small remaining balance)
          if (data.refundSuggestion && data.refundSuggestion.canRefund) {
            toast(
              `💰 ${data.refundSuggestion.message}`,
              {
                duration: 8000,
                icon: '💰',
              }
            );
            console.log('💰 Refund suggestion:', data.refundSuggestion);
          }
          
          // Wait a bit for transaction to be confirmed before refreshing
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Refresh balances and transactions
          await refreshBalance();
          await getContractBalance(); // Also refresh contract balance after payment
          await refreshTransactions();
          
          // Retry balance refresh after another delay to ensure it's updated
          setTimeout(async () => {
            await refreshBalance();
            await getContractBalance();
          }, 3000);
          
          return data.transactionHash || data.stellarTransactionHash || data.transactionId;
        } else {
          console.error('❌ Smart contract transaction failed:', data);
          toast.error(`Smart wallet transaction failed: ${data.error || 'Unknown error'}`);
          return false;
        }
      } else {
        console.error('❌ Backend request failed:', {
          status: response.status,
          error: data.error || 'Unknown error'
        });
        toast.error(`Smart wallet transaction failed: ${data.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('Smart wallet payment error:', error);
      toast.error(`Smart wallet payment failed: ${error instanceof Error ? error.message : String(error)}`);
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
          publicKey: publicKey
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Account funded successfully!');
        refreshBalance();
        return true;
      } else {
        toast.error(data.error || 'Failed to fund account');
        return false;
      }
    } catch (error) {
      console.error('Error funding account:', error);
      toast.error('Failed to fund account');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getContractBalance = async (): Promise<void> => {
    if (!publicKey || !process.env.REACT_APP_SMART_WALLET_CONTRACT_ID) {
      setContractBalance(null);
      setUserStake(null);
      return;
    }

    try {
      // Fetch both vault balance (total) and user stake (personal) in parallel
      const [vaultResponse, userBalanceResponse] = await Promise.all([
        // Get vault balance (total deposits from all users)
        fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/smart-wallet/get-vault-balance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractId: process.env.REACT_APP_SMART_WALLET_CONTRACT_ID,
            assetAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC', // Native XLM SAC contract address on testnet
            networkPassphrase: 'Test SDF Network ; September 2015',
            rpcUrl: 'https://soroban-testnet.stellar.org:443'
          }),
        }),
        // Get user's personal stake (their deposits)
        fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/smart-wallet/get-balance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractId: process.env.REACT_APP_SMART_WALLET_CONTRACT_ID,
            userAddress: publicKey,
            assetAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC', // Native XLM SAC contract address on testnet
            networkPassphrase: 'Test SDF Network ; September 2015',
            rpcUrl: 'https://soroban-testnet.stellar.org:443'
          }),
        })
      ]);

      const vaultData = await vaultResponse.json();
      const userBalanceData = await userBalanceResponse.json();
      
      console.log('💰 Vault balance response:', {
        success: vaultData.success,
        balance: vaultData.balance,
        balanceInStroops: vaultData.balanceInStroops,
        fullResponse: vaultData
      });
      
      console.log('💰 User stake response:', {
        success: userBalanceData.success,
        balance: userBalanceData.balance,
        balanceInStroops: userBalanceData.balanceInStroops,
        fullResponse: userBalanceData
      });
      
      if (vaultResponse.ok && vaultData.success) {
        const vaultBalance = vaultData.balance || '0';
        console.log('✅ Setting vault balance to:', vaultBalance);
        setContractBalance(vaultBalance);
      } else {
        console.warn('⚠️ Vault balance request failed:', vaultData);
        setContractBalance(null);
      }

      if (userBalanceResponse.ok && userBalanceData.success) {
        const userBalance = userBalanceData.balance || '0';
        console.log('✅ Setting user stake to:', userBalance);
        setUserStake(userBalance);
      } else {
        console.warn('⚠️ User stake request failed:', userBalanceData);
        setUserStake(null);
      }
    } catch (error) {
      console.error('❌ Error getting contract balance:', error);
      setContractBalance(null);
      setUserStake(null);
    }
  };

  const depositToContract = async (
    amount: string, 
    asset: string, 
    step: 'approve' | 'deposit',
    onStatusUpdate?: (status: string) => void
  ): Promise<boolean> => {
    if (!publicKey) {
      toast.error('No wallet connected. Please connect your wallet first.');
      return false;
    }
    
    if (!process.env.REACT_APP_SMART_WALLET_CONTRACT_ID) {
      const errorMsg = 'Smart wallet contract ID not configured. Please set REACT_APP_SMART_WALLET_CONTRACT_ID in your environment variables.';
      console.error('❌', errorMsg);
      toast.error('Smart wallet contract not configured. Please contact support.', { duration: 5000 });
      return false;
    }

    try {
      setIsLoading(true);
      let userSecretKey: string;

      // Try to decrypt secret key using the same pattern as sendPayment
      try {
        const encryptedData = encryptionService.getEncryptedWalletData();
        console.log('🔐 Checking encrypted wallet data...', {
          hasEncryptedData: !!encryptedData,
          hasPasskeyCredential: !!passkeyCredential,
          publicKey
        });
        
        // If we have encrypted data, try to decrypt it
        if (encryptedData) {
          // Try to load passkey credential if not available
          let credentialToUse = passkeyCredential;
          if (!credentialToUse) {
            console.log('⚠️ Passkey credential not in state, trying to load from storage...');
            const passkeyData = await passkeyService.getStoredPasskeyData();
            if (passkeyData) {
              credentialToUse = passkeyData;
              setPasskeyCredential(passkeyData);
              console.log('✅ Loaded passkey credential from storage');
            }
          }
          
          if (credentialToUse) {
            // Check if wrapIv is missing or invalid before attempting decryption
            if (!encryptedData.wrapIv || encryptedData.wrapIv.trim() === '') {
              console.error('❌ Encrypted wallet data is missing or has empty wrapIv - wallet was created before encryption fix');
              console.error('❌ Encrypted data structure:', {
                hasWrappedDEK: !!encryptedData.wrappedDEK,
                hasCiphertext: !!encryptedData.ciphertext,
                hasIv: !!encryptedData.iv,
                hasWrapIv: !!encryptedData.wrapIv,
                wrapIvType: typeof encryptedData.wrapIv,
                wrapIvValue: encryptedData.wrapIv,
                wrapIvLength: encryptedData.wrapIv?.length,
                metadata: encryptedData.metadata
              });
              const errorMsg = 'This wallet was created before encryption improvements and cannot be decrypted. The encryption key cannot be recovered without the wrap IV. Please create a new wallet.';
              toast.error(errorMsg, { duration: 10000 });
              throw new Error(errorMsg);
            }
            
            // Log wrapIv details for debugging
            console.log('🔍 Checking wrapIv:', {
              exists: !!encryptedData.wrapIv,
              type: typeof encryptedData.wrapIv,
              length: encryptedData.wrapIv?.length,
              preview: encryptedData.wrapIv?.substring(0, 20) + '...'
            });
            
            // Derive KEK inputs
            const sessionSecret = credentialToUse.id || publicKey;
            const kekParams: KEKDerivationParams = {
              srpSecret: sessionSecret,
              salt: btoa(publicKey)
            };
            console.log('🔐 Attempting to decrypt secret key with passkey...', {
              hasEncryptedData: !!encryptedData,
              hasPasskeyCredential: !!credentialToUse,
              hasWrapIv: !!encryptedData.wrapIv,
              publicKey
            });
            try {
              userSecretKey = await encryptionService.decryptSecretKey(encryptedData, kekParams);
              console.log('✅ Successfully decrypted secret key');
            } catch (decryptError: any) {
              console.error('❌ Decryption failed:', decryptError);
              // The error message from encryptionService should already be clear
              // Just re-throw it with context if needed
              const errorMsg = decryptError?.message || 'Unknown decryption error';
              if (errorMsg.includes('wrap IV') || errorMsg.includes('wrapIv') || errorMsg.includes('encryption improvements')) {
                // This is already a clear error message, just throw it
                throw new Error(errorMsg);
              }
              // Otherwise, wrap it with more context
              throw new Error(`Failed to decrypt secret key: ${errorMsg}. This wallet may have been created before encryption improvements. Please create a new wallet.`);
            }
          } else {
            throw new Error('Passkey credential not found. Cannot decrypt secret key.');
          }
        } else {
          // No encrypted data - check for plaintext secret key (legacy/fallback)
          const storedSecretKey = localStorage.getItem('wallet_secretKey');
          if (!storedSecretKey) {
            const errorMsg = 'Wallet secret key not found. Please create or connect your wallet first. In incognito mode, you need to create a new wallet.';
            console.error('❌ No encrypted wallet data and no plaintext secret key found');
            console.error('❌ Available localStorage keys:', Object.keys(localStorage));
            toast.error(errorMsg);
            return false;
          }
          console.log('✅ Using stored plaintext secret key from localStorage (legacy)');
          userSecretKey = storedSecretKey;
        }
      } catch (error: any) {
        console.error('❌ Error retrieving secret key:', error);
        
        // Check if this is a wrapIv missing error - show clear message
        const errorMsg = error?.message || 'Unknown error';
        if (errorMsg.includes('wrap IV') || errorMsg.includes('wrapIv') || errorMsg.includes('encryption improvements')) {
          const clearErrorMsg = 'This wallet was created before encryption improvements and cannot be decrypted. Please create a new wallet in incognito mode.';
          console.error('❌ Wallet cannot be decrypted:', errorMsg);
          toast.error(clearErrorMsg, { duration: 8000 });
          return false;
        }
        
        // Final fallback to stored secret key if decryption fails
        const storedSecretKey = localStorage.getItem('wallet_secretKey');
        if (!storedSecretKey) {
          const finalErrorMsg = errorMsg || 'Wallet secret key not found. Please create or connect your wallet first. In incognito mode, you need to create a new wallet.';
          console.error('❌ Wallet secret key not found in localStorage');
          console.error('❌ Available localStorage keys:', Object.keys(localStorage));
          toast.error(finalErrorMsg, { duration: 8000 });
          return false;
        }
        console.log('✅ Using stored secret key from localStorage (fallback)');
        userSecretKey = storedSecretKey;
      }

      // No approve() step needed - Soroban's authorization framework handles this in a single transaction
      // The contract uses require_auth() which bundles authorization and execution
      // Skip directly to deposit
      if (step === 'approve') {
        console.log('ℹ️ Approve step skipped - authorization handled by contract require_auth()');
        // Fall through to deposit
      }
      
      // Deposit tokens - requires WebAuthn signature verification
      console.log('💰 Starting deposit flow...', {
          hasPasskeyCredential: !!passkeyCredential,
          passkeyCredentialId: passkeyCredential?.id,
          publicKey,
          amount,
          asset
        });
        
        // Check for passkey credential
        if (!passkeyCredential) {
          console.error('❌ No passkey credential found. Cannot proceed with deposit.');
          toast.error('Passkey authentication required for deposit. Please create a passkey wallet.');
          return false;
        }
        
        // Create deposit data JSON FIRST (before WebAuthn) so we can use it as the challenge
        // IMPORTANT: Freeze the timestamp BEFORE creating the JSON to ensure consistency
        // The backend will create signaturePayload from this JSON string
        // The verifier will use the first 32 bytes as the challenge
        const timestamp = Date.now();
        const depositData = {
          source: publicKey,
          asset: asset,
          amount: amount,
          action: 'deposit',
          timestamp: timestamp
        };
        
        const depositDataJSON = JSON.stringify(depositData);
        
        // Create challenge from first 32 bytes of deposit data (same as execute_payment)
        // The verifier will base64url-encode these 32 bytes and compare with challenge in clientDataJSON
        const depositDataBytes = new TextEncoder().encode(depositDataJSON);
        const challengeBytes = depositDataBytes.slice(0, 32);
        
        // Pad to 32 bytes if needed
        const paddedChallenge = new Uint8Array(32);
        paddedChallenge.set(challengeBytes, 0);
        
        // Log the exact challenge bytes for debugging
        console.log('🔐 Challenge bytes for WebAuthn (first 32 bytes of deposit data JSON):', {
          depositDataJSON,
          depositDataBytesLength: depositDataBytes.length,
          challengeBytesLength: challengeBytes.length,
          paddedChallengeLength: paddedChallenge.length,
          challengeHex: Array.from(paddedChallenge).map(b => b.toString(16).padStart(2, '0')).join(''),
          challengeBase64: btoa(String.fromCharCode(...paddedChallenge)),
          note: 'This challenge will be base64url-encoded by WebAuthn and must match what the verifier expects'
        });
        
        // Authenticate ONCE with the custom challenge (same pattern as execute_payment)
        let depositAuthResult: any = null;
        try {
          onStatusUpdate?.('Authenticating with passkey...');
          toast('Authenticating with passkey for deposit...');
          console.log('🔐 Requesting passkey authentication with deposit data challenge...');
          depositAuthResult = await passkeyService.authenticatePasskey(
            passkeyCredential.id,
            paddedChallenge
          );
          console.log('✅ Passkey authentication result for deposit:', {
            credentialId: depositAuthResult?.credentialId,
            signatureLength: depositAuthResult?.signature?.length || 0,
            signaturePreview: depositAuthResult?.signature ? depositAuthResult.signature.substring(0, 30) + '...' : 'EMPTY',
            hasAuthenticatorData: !!depositAuthResult?.authenticatorData,
            hasClientDataJSON: !!depositAuthResult?.clientDataJSON
          });
          onStatusUpdate?.('Passkey authentication successful!');
          toast.success('Passkey authentication successful!');
        } catch (authError) {
          console.error('❌ Passkey authentication failed:', authError);
          toast.error(`Passkey authentication failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
          return false;
        }
        
        // Verify the challenge in clientDataJSON matches what we expect
        try {
          const clientDataJSONString = atob(depositAuthResult.clientDataJSON);
          const clientData = JSON.parse(clientDataJSONString);
          const challengeFromClientData = clientData.challenge;
          
          // Base64url-encode our challenge to compare
          const challengeBase64 = btoa(String.fromCharCode(...paddedChallenge))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, ''); // Remove padding for base64url
          
          console.log('🔍 Verifying challenge match:', {
            challengeFromClientData,
            challengeBase64,
            match: challengeFromClientData === challengeBase64,
            note: 'These MUST match for WebAuthn verification to succeed'
          });
          
          if (challengeFromClientData !== challengeBase64) {
            console.error('❌ CRITICAL: Challenge mismatch! WebAuthn verification will fail.');
            console.error('Expected (base64url):', challengeBase64);
            console.error('Got from clientDataJSON (base64url):', challengeFromClientData);
            toast.error('WebAuthn challenge mismatch. Please try again.');
            return false;
          } else {
            console.log('✅ Challenge matches! WebAuthn verification should succeed.');
          }
        } catch (error) {
          console.error('❌ Failed to verify challenge:', error);
          toast.error('Failed to verify WebAuthn challenge. Please try again.');
          return false;
        }
        
        // Send deposit data JSON as signature payload (same as execute_payment)
        const signaturePayload = depositDataJSON;
        
        console.log('📋 Deposit data for signature payload (same pattern as execute_payment):', {
          depositData,
          depositDataJSON,
          signaturePayload,
          challengeLength: paddedChallenge.length,
          challengePreview: Array.from(paddedChallenge.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''),
          note: 'Backend will convert JSON to Buffer, verifier will use first 32 bytes as challenge'
        });
        
        // Validate that we have all required WebAuthn parameters
        console.log('🔍 Validating WebAuthn parameters...', {
          hasSignature: !!depositAuthResult?.signature,
          hasPasskeyPublicKey: !!passkeyCredential?.publicKey,
          hasAuthenticatorData: !!depositAuthResult?.authenticatorData,
          hasClientDataJSON: !!depositAuthResult?.clientDataJSON,
          hasSignaturePayload: !!signaturePayload,
          signatureLength: depositAuthResult?.signature?.length || 0,
          passkeyPublicKeyLength: passkeyCredential?.publicKey?.length || 0
        });
        
        if (!depositAuthResult?.signature || !passkeyCredential?.publicKey || !depositAuthResult?.authenticatorData || !depositAuthResult?.clientDataJSON || !signaturePayload) {
          console.error('❌ Missing WebAuthn parameters:', {
            hasSignature: !!depositAuthResult?.signature,
            hasPasskeyPublicKey: !!passkeyCredential?.publicKey,
            hasAuthenticatorData: !!depositAuthResult?.authenticatorData,
            hasClientDataJSON: !!depositAuthResult?.clientDataJSON,
            hasSignaturePayload: !!signaturePayload,
            depositAuthResult,
            passkeyCredential
          });
          onStatusUpdate?.('Missing WebAuthn authentication data');
          toast.error('Missing WebAuthn authentication data. Please try again.');
          return false;
        }
        
        console.log('✅ All WebAuthn parameters validated. Proceeding with deposit request...');
        onStatusUpdate?.('Sending deposit transaction...');
        
        // Deposit tokens with WebAuthn signature
        const requestBody = {
          contractId: process.env.REACT_APP_SMART_WALLET_CONTRACT_ID,
          userAddress: publicKey,
          assetAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC', // Native XLM SAC contract address
          amount: amount,
          userSecretKey: userSecretKey,
          networkPassphrase: 'Test SDF Network ; September 2015',
          rpcUrl: 'https://soroban-testnet.stellar.org:443',
          // WebAuthn signature parameters (required)
          signature: depositAuthResult.signature,
          passkeyPublicKey: passkeyCredential.publicKey,
          authenticatorData: depositAuthResult.authenticatorData,
          clientDataJSON: depositAuthResult.clientDataJSON,
          signaturePayload: signaturePayload
        };
        
        console.log('💰 Sending deposit request:', {
          contractId: requestBody.contractId,
          userAddress: requestBody.userAddress,
          amount: requestBody.amount,
          hasSignature: !!requestBody.signature,
          hasPasskeyPublicKey: !!requestBody.passkeyPublicKey,
          hasAuthenticatorData: !!requestBody.authenticatorData,
          hasClientDataJSON: !!requestBody.clientDataJSON,
          hasSignaturePayload: !!requestBody.signaturePayload,
          signatureLength: requestBody.signature?.length || 0,
          passkeyPublicKeyLength: requestBody.passkeyPublicKey?.length || 0
        });
        
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/smart-wallet/deposit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          // If response is not JSON, read as text
          const text = await response.text();
          console.error('❌ Deposit request failed - non-JSON response:', {
            status: response.status,
            statusText: response.statusText,
            responseText: text.substring(0, 500)
          });
          toast.error(`Deposit failed: ${response.statusText || 'Server error'}. Check server logs for details.`);
          return false;
        }
        
        if (!response.ok) {
          const errorMessage = data.error || data.message || 'Deposit failed';
          const errorDetails = data.details || data.note || data.message || JSON.stringify(data);
          const explorerUrl = data.explorerUrl;
          
          console.error('❌ Deposit request failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
            details: errorDetails,
            explorerUrl: explorerUrl,
            fullResponse: data
          });
          
          // Build error message with Stellar Explorer link if available
          let fullErrorMessage = errorMessage;
          if (errorDetails && errorDetails !== errorMessage) {
            fullErrorMessage += `\n${errorDetails}`;
          }
          if (explorerUrl) {
            fullErrorMessage += `\n\nCheck transaction: ${explorerUrl}`;
          }
          
          toast.error(fullErrorMessage, {
            duration: 12000
          });
          
          return false;
        }
        
        if (response.ok && data.success) {
          console.log('✅ Deposit successful, transaction hash:', data.transactionHash);
          console.log('📊 Deposit response:', data);
          
          const transactionHash = data.transactionHash;
          const transactionStatus = data.status || 'PENDING';
          
          // Check if status indicates we need to verify manually
          if (transactionStatus === 'PENDING_VERIFICATION') {
            console.error('❌ Deposit status unclear - SDK cannot parse result');
            toast.error(`Deposit verification failed. Please check Stellar Explorer: https://stellar.expert/explorer/testnet/tx/${transactionHash}`, {
              duration: 10000
            });
            return false;
          }
          
          // If transaction is already SUCCESS, skip polling and go straight to balance refresh
          if (transactionStatus === 'SUCCESS') {
            console.log('✅ Transaction already confirmed! Skipping polling...');
            onStatusUpdate?.('Deposit confirmed!');
            toast.success('Deposit confirmed!');
          } else if (transactionStatus === 'NOT_FOUND' || transactionStatus === 'PENDING') {
            console.log('⏳ Transaction is pending, polling for confirmation...');
            onStatusUpdate?.('Waiting for transaction confirmation...');
            onStatusUpdate?.('Waiting for transaction confirmation...');
            toast('Transaction is confirming...', { duration: 3000, icon: '⏳' });
            
            // Poll transaction status using Soroban RPC (not Horizon - Soroban transactions don't appear in Horizon)
            let confirmed = false;
            const rpcUrl = 'https://soroban-testnet.stellar.org:443';
            
            // Faster polling: 1 second intervals, 20 attempts (20 seconds total instead of 30)
            for (let i = 0; i < 20; i++) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              try {
                // Poll Soroban RPC for transaction status
                const rpcResponse = await fetch(rpcUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getTransaction',
                    params: {
                      hash: transactionHash
                    }
                  })
                });
                
                if (rpcResponse.ok) {
                  const rpcData = await rpcResponse.json();
                  
                  if (rpcData.result) {
                    const status = rpcData.result.status;
                    console.log(`📊 Transaction status [${i + 1}/20]:`, status);
                    
                    if (status === 'SUCCESS') {
                      console.log('✅ Transaction confirmed on-chain!');
                      confirmed = true;
                      toast.success('Transaction confirmed!');
                      break;
                    } else if (status === 'FAILED') {
                      const errorMsg = rpcData.result.errorResultXdr || 'Unknown error';
                      console.error('❌ Transaction failed on-chain:', errorMsg);
                      toast.error(`Deposit transaction failed. Check Stellar Explorer: https://stellar.expert/explorer/testnet/tx/${transactionHash}`);
                      return false;
                    } else if (status === 'NOT_FOUND') {
                      console.log(`⏳ Transaction not found yet, attempt ${i + 1}/20`);
                      // NOT_FOUND is normal for recently submitted Soroban transactions
                      // They can take 10-30 seconds to appear in the RPC
                      continue;
                    } else if (status === 'PENDING') {
                      console.log(`⏳ Transaction still pending, attempt ${i + 1}/20`);
                      continue;
                    }
                  } else if (rpcData.error) {
                    console.log(`⏳ RPC error (may be transient): ${rpcData.error.message || JSON.stringify(rpcData.error)}`);
                    continue;
                  }
                }
              } catch (error) {
                console.log(`⏳ Polling transaction status... [${i + 1}/20]`, error);
              }
            }
            
            if (!confirmed) {
              console.warn('⚠️ Transaction still not found after polling. This is normal for Soroban transactions - they can take 10-30 seconds to appear.');
              toast('Transaction submitted successfully. It may take 10-30 seconds to confirm. Balance will update once confirmed. Check Stellar Explorer for status.', {
                duration: 8000,
                icon: '⏳'
              });
              // Still return true since the transaction was successfully submitted
              // The balance will update once the transaction confirms
            }
          }
          
          // Wait a bit more for balance to update after confirmation
          console.log('⏳ Waiting 3 seconds for balance to update...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Refresh contract balance
          console.log('🔄 Refreshing contract balance...');
          await getContractBalance();
          
          // Also refresh native balance
          await refreshBalance();
          
          // Retry balance check after a delay in case balance update is delayed
          console.log('⏳ Scheduling balance refresh retry in 5 seconds...');
          setTimeout(async () => {
            console.log('🔄 Retrying balance refresh...');
            await getContractBalance();
            await refreshBalance();
          }, 5000);
          
          // One more retry after 10 seconds
          setTimeout(async () => {
            console.log('🔄 Final balance refresh retry...');
            await getContractBalance();
            await refreshBalance();
          }, 10000);
          
          return true;
        } else {
          toast.error(data.error || 'Deposit failed');
          return false;
        }
    } catch (error) {
      console.error('❌ Deposit error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      toast.error(`Deposit failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: WalletContextType = {
    // Account state
    publicKey,
    isConnected,
    balances,
    transactions,
    
    // Passkey state
    passkeyCredential,
    
    // ZK Proof state
    zkProof,
    
    // Backup modal state
    showBackupModal,
    pendingSecretKey,
    
    // Contract balance state
    contractBalance,
    userStake,
    
    // Wallet actions
    connectWithPasskey,
    createWalletWithPasskey,
    createWalletWithZKProof,
    importWalletFromSecretKey,
    disconnectAccount,
    refreshBalance,
    refreshTransactions,
    
    // Transaction actions
    sendPayment,
    fundAccount,
    
    // Deposit actions
    depositToContract,
    getContractBalance,
    
    // Loading states
    isLoading,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
      <SecretKeyBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onConfirm={handleBackupConfirm}
        secretKey={pendingSecretKey || ''}
        publicKey={publicKey || ''}
      />
    </WalletContext.Provider>
  );
};