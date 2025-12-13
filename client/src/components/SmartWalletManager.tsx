// client/src/components/SmartWalletManager.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Key, CheckCircle, XCircle, Loader, Fingerprint, Wallet, Users, Settings } from 'lucide-react';
import { createSmartWalletService, SmartWalletConfig, PasskeyCredential, TransactionData } from '../services/smartWalletService';
import toast from 'react-hot-toast';

const SmartWalletContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  color: #FFD700;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;

const StatusCard = styled.div<{ $status: 'active' | 'inactive' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  background: ${props => 
    props.$status === 'active' ? 'rgba(34, 197, 94, 0.1)' :
    props.$status === 'error' ? 'rgba(239, 68, 68, 0.1)' :
    'rgba(156, 163, 175, 0.1)'
  };
  border: 1px solid ${props => 
    props.$status === 'active' ? 'rgba(34, 197, 94, 0.3)' :
    props.$status === 'error' ? 'rgba(239, 68, 68, 0.3)' :
    'rgba(156, 163, 175, 0.3)'
  };
`;

const StatusText = styled.div`
  color: #E5E7EB;
  font-size: 0.9rem;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $primary?: boolean; $danger?: boolean; $disabled?: boolean }>`
  background: ${props => 
    props.$primary ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' :
    props.$danger ? '#DC2626' :
    'rgba(255, 255, 255, 0.1)'
  };
  color: ${props => props.$primary ? '#1A1A2E' : '#FFFFFF'};
  border: ${props => 
    props.$primary ? 'none' :
    props.$danger ? '1px solid #EF4444' :
    '1px solid rgba(255, 255, 255, 0.2)'
  };
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${props => 
      props.$primary ? '0 6px 20px rgba(255, 215, 0, 0.4)' :
      props.$danger ? '0 4px 15px rgba(239, 68, 68, 0.3)' :
      '0 4px 15px rgba(255, 255, 255, 0.2)'
    };
  }

  &:disabled {
    opacity: 0.6;
    transform: none;
    box-shadow: none;
  }
`;

const InfoCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: #9CA3AF;
  font-size: 0.85rem;
`;

const InfoValue = styled.span`
  color: #FFFFFF;
  font-size: 0.85rem;
  font-weight: 500;
`;

const TransactionForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: #E5E7EB;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  color: #FFFFFF;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: #FFD700;
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }

  &::placeholder {
    color: #9CA3AF;
  }
`;

interface SmartWalletManagerProps {
  onSmartWalletCreated?: (walletAddress: string) => void;
  onTransactionExecuted?: (transactionId: string) => void;
}

const SmartWalletManager: React.FC<SmartWalletManagerProps> = ({
  onSmartWalletCreated,
  onTransactionExecuted
}) => {
  const [smartWalletService, setSmartWalletService] = useState<any>(null);
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false);
  const [isPasskeyAvailable, setIsPasskeyAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [smartWalletInfo, setSmartWalletInfo] = useState<any>(null);
  const [passkeyCredential, setPasskeyCredential] = useState<PasskeyCredential | null>(null);
  
  // Transaction form state
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionData>({
    destination: '',
    amount: '',
    asset: 'XLM',
    memo: ''
  });

  useEffect(() => {
    const initializeService = async () => {
      // Initialize smart wallet service with testnet configuration
      const config: SmartWalletConfig = {
        contractId: process.env.REACT_APP_SMART_WALLET_CONTRACT_ID || 'CCZW3BY7WPYEUQRHW4R3JCKZONJN67JCWDJMJAC4QZ57U4GZTXQH5MJR', // Smart wallet contract ID from env
        passkeyPublicKey: '',
        networkPassphrase: 'Test SDF Network ; September 2015',
        rpcUrl: 'https://soroban-testnet.stellar.org:443'
      };

      const service = createSmartWalletService(config);
      setSmartWalletService(service);

      // Check WebAuthn support
      const supported = service.isWebAuthnSupported();
      setIsWebAuthnSupported(supported);

      if (supported) {
        const available = await service.isPasskeyAvailable();
        setIsPasskeyAvailable(available);
      }

      // Check if we have an existing smart wallet
      try {
        const info = await service.getSmartWalletInfo();
        setSmartWalletInfo(info.wallet);
      } catch (error) {
        console.log('No existing smart wallet found');
      }
    };

    initializeService();
  }, []);

  const handleCreateSmartWallet = async () => {
    if (!smartWalletService) return;

    setIsLoading(true);
    try {
      // Register a new passkey
      const userId = `xyz-user-${Date.now()}`;
      const credential = await smartWalletService.registerPasskey(userId);
      setPasskeyCredential(credential);

      // Initialize the smart wallet
      const walletAddress = await smartWalletService.initializeSmartWallet(credential);
      
      // Get wallet info
      const info = await smartWalletService.getSmartWalletInfo();
      setSmartWalletInfo(info.wallet);

      toast.success('Smart wallet created successfully!');
      onSmartWalletCreated?.(walletAddress);
    } catch (error) {
      console.error('Failed to create smart wallet:', error);
      toast.error('Failed to create smart wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteTransaction = async () => {
    if (!smartWalletService || !passkeyCredential) return;

    setIsLoading(true);
    try {
      const success = await smartWalletService.executeTransaction(transactionData, passkeyCredential);
      
      if (success) {
        toast.success('Transaction executed successfully!');
        setShowTransactionForm(false);
        setTransactionData({ destination: '', amount: '', asset: 'XLM', memo: '' });
        onTransactionExecuted?.('mock-transaction-id');
      } else {
        toast.error('Transaction failed');
      }
    } catch (error) {
      console.error('Transaction execution failed:', error);
      toast.error('Transaction execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectExistingWallet = async () => {
    if (!smartWalletService) return;

    setIsLoading(true);
    try {
      // For existing wallets, we would need to authenticate with the stored passkey
      // This is a simplified version
      toast('Connecting to existing smart wallet...');
      
      // In a real implementation, this would:
      // 1. Prompt for passkey authentication
      // 2. Retrieve the stored wallet configuration
      // 3. Load the wallet info
      
      const info = await smartWalletService.getSmartWalletInfo();
      setSmartWalletInfo(info.wallet);
      
      toast.success('Connected to existing smart wallet!');
    } catch (error) {
      console.error('Failed to connect to existing wallet:', error);
      toast.error('Failed to connect to existing wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const canCreateWallet = isWebAuthnSupported && isPasskeyAvailable && !smartWalletInfo && !isLoading;
  const canConnectExisting = !smartWalletInfo && !isLoading;
  const canExecuteTransaction = smartWalletInfo && passkeyCredential && !isLoading;

  return (
    <SmartWalletContainer>
      <Header>
        <Wallet size={24} color="#FFD700" />
        <Title>Smart Wallet (Phase 2)</Title>
      </Header>

      {/* Status Card */}
      <StatusCard $status={smartWalletInfo ? 'active' : 'inactive'}>
        {smartWalletInfo ? (
          <>
            <CheckCircle size={20} color="#22C55E" />
            <StatusText>Smart Wallet Active</StatusText>
          </>
        ) : (
          <>
            <XCircle size={20} color="#9CA3AF" />
            <StatusText>No Smart Wallet Connected</StatusText>
          </>
        )}
      </StatusCard>

      {/* Smart Wallet Info */}
      {smartWalletInfo && (
        <InfoCard>
          <InfoRow>
            <InfoLabel>Wallet Address</InfoLabel>
            <InfoValue>{smartWalletInfo.address}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Balance</InfoLabel>
            <InfoValue>{smartWalletInfo.balance} {smartWalletInfo.asset}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Passkey Enabled</InfoLabel>
            <InfoValue>{smartWalletInfo.passkeyEnabled ? 'Yes' : 'No'}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Policy Signers</InfoLabel>
            <InfoValue>{smartWalletInfo.policySigners?.length || 0}</InfoValue>
          </InfoRow>
        </InfoCard>
      )}

      {/* Action Buttons */}
      <ButtonGroup>
        {!smartWalletInfo && (
          <>
            <ActionButton 
              onClick={handleCreateSmartWallet} 
              $primary 
              disabled={!canCreateWallet}
            >
              {isLoading ? <Loader size={18} className="spinner" /> : <Fingerprint size={18} />}
              Create Smart Wallet
            </ActionButton>
            <ActionButton 
              onClick={handleConnectExistingWallet} 
              disabled={!canConnectExisting}
            >
              <Key size={18} />
              Connect Existing
            </ActionButton>
          </>
        )}
        
        {smartWalletInfo && (
          <>
            <ActionButton 
              onClick={() => setShowTransactionForm(!showTransactionForm)}
              $primary
              disabled={!canExecuteTransaction}
            >
              <Wallet size={18} />
              Send Transaction
            </ActionButton>
            <ActionButton>
              <Users size={18} />
              Manage Signers
            </ActionButton>
            <ActionButton>
              <Settings size={18} />
              Settings
            </ActionButton>
          </>
        )}
      </ButtonGroup>

      {/* Transaction Form */}
      {showTransactionForm && (
        <TransactionForm onSubmit={(e) => { e.preventDefault(); handleExecuteTransaction(); }}>
          <FormGroup>
            <Label>Destination Address</Label>
            <Input
              type="text"
              placeholder="Enter destination address"
              value={transactionData.destination}
              onChange={(e) => setTransactionData({ ...transactionData, destination: e.target.value })}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.0000001"
              placeholder="Enter amount"
              value={transactionData.amount}
              onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Asset</Label>
            <Input
              type="text"
              placeholder="XLM"
              value={transactionData.asset}
              onChange={(e) => setTransactionData({ ...transactionData, asset: e.target.value })}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Memo (Optional)</Label>
            <Input
              type="text"
              placeholder="Enter memo"
              value={transactionData.memo}
              onChange={(e) => setTransactionData({ ...transactionData, memo: e.target.value })}
            />
          </FormGroup>
          
          <ButtonGroup>
            <ActionButton type="submit" $primary disabled={isLoading}>
              {isLoading ? <Loader size={18} className="spinner" /> : <Fingerprint size={18} />}
              Execute Transaction
            </ActionButton>
            <ActionButton type="button" onClick={() => setShowTransactionForm(false)}>
              Cancel
            </ActionButton>
          </ButtonGroup>
        </TransactionForm>
      )}

      {/* WebAuthn Support Info */}
      {!isWebAuthnSupported && (
        <StatusCard $status="error">
          <XCircle size={20} color="#EF4444" />
          <StatusText>Your browser does not support WebAuthn for passkeys.</StatusText>
        </StatusCard>
      )}
      
      {isWebAuthnSupported && !isPasskeyAvailable && (
        <StatusCard $status="error">
          <XCircle size={20} color="#EF4444" />
          <StatusText>Passkeys are not available on this device (e.g., no biometric sensor).</StatusText>
        </StatusCard>
      )}
    </SmartWalletContainer>
  );
};

export default SmartWalletManager;
