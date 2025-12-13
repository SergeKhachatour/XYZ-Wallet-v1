import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, ArrowDownCircle, DollarSign, Info } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const OverlayCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  padding: 2rem;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  
  @media (max-width: 1024px) {
    max-width: 600px;
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    max-width: 95%;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
    background: rgba(255, 255, 255, 0.15);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
    background: rgba(255, 255, 255, 0.15);
  }
  
  option {
    background: #1a1a1a;
    color: white;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border: none;
  color: #000000;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  background: rgba(74, 222, 128, 0.2);
  border: 1px solid rgba(74, 222, 128, 0.5);
  color: #86efac;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
`;

const StatusMessage = styled.div`
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: #93c5fd;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &::before {
    content: '⏳';
    font-size: 1.2rem;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const InfoBox = styled.div`
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: #93c5fd;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const BalanceInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const BalanceLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const BalanceValue = styled.span`
  color: white;
  font-weight: 600;
  font-size: 1rem;
`;

interface DepositOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const DepositOverlay: React.FC<DepositOverlayProps> = ({ isOpen, onClose }) => {
  const { publicKey, balances, depositToContract, contractBalance, isLoading } = useWallet();
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('XLM');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState(''); // Status message for current operation
  // No approve step needed - Soroban's require_auth() handles authorization in a single transaction
  const [step, setStep] = useState<'approve' | 'deposit'>('deposit');

  // Reset form when overlay opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setAsset('XLM');
      setError('');
      setSuccess('');
      setStatus('');
      setStep('deposit'); // Skip approve - go directly to deposit
    }
  }, [isOpen]);

  const availableBalance = balances.find(b => 
    (b.asset === 'XLM' || b.assetType === 'native') && asset === 'XLM'
  )?.balance || '0';

  // No approve step needed - Soroban's require_auth() handles authorization in a single transaction
  const handleDeposit = async () => {
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError('');
    setSuccess('');
    setStatus('Preparing deposit transaction...');

    try {
      console.log('🚀 DepositOverlay: Starting deposit...', { amount, asset });
      
      // Use callback to get all status updates from WalletContext
      // Note: toast messages are handled in depositToContract, no need to duplicate here
      const result = await depositToContract(amount, asset, 'deposit', (statusMsg) => {
        setStatus(statusMsg);
      });
      console.log('📊 DepositOverlay: Deposit result:', result);
      setStatus(''); // Clear status message
      
      if (result) {
        const successMsg = 'Deposit successful! Your tokens are now in the smart wallet.';
        setSuccess(successMsg);
        // Toast is already shown in depositToContract, no need to show again
        
        // Refresh balance and close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorMsg = 'Deposit failed. Please check the error message above.';
        console.error('❌ DepositOverlay: Deposit returned false');
        setError(errorMsg);
        // Toast is already shown in depositToContract, no need to duplicate
      }
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || 'Deposit failed - unknown error';
      console.error('❌ DepositOverlay: Deposit error caught:', error);
      console.error('Error details:', {
        message: errorMsg,
        stack: error?.stack,
        name: error?.name
      });
      setStatus(''); // Clear status message
      setError(errorMsg);
      // Toast is already shown in depositToContract, no need to duplicate
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <OverlayCard onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>

        <Header>
          <ArrowDownCircle size={24} color="#FFD700" />
          <Title>Deposit to Smart Wallet</Title>
        </Header>

        <InfoBox>
          <Info size={18} />
          <div>
            <strong>How it works:</strong>
            <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>Approve the contract to transfer tokens (required for all assets including native XLM)</li>
              <li>Deposit tokens into your smart wallet balance</li>
              <li>Use your deposited balance to make payments</li>
            </ol>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <strong>Available Contract Functions:</strong>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.8rem' }}>
                <li><code>deposit</code> - Deposit tokens to smart wallet</li>
                <li><code>execute_payment</code> - Send payment from smart wallet</li>
                <li><code>get_balance</code> - Get user's balance in contract</li>
                <li><code>register_signer</code> - Register passkey signer (auto-called)</li>
                <li><code>is_signer_registered</code> - Check if signer is registered</li>
                <li><code>get_passkey_pubkey</code> - Get registered passkey public key</li>
              </ul>
            </div>
          </div>
        </InfoBox>

        <BalanceInfo>
          <BalanceRow>
            <BalanceLabel>Available Balance:</BalanceLabel>
            <BalanceValue>{parseFloat(availableBalance).toFixed(7)} {asset}</BalanceValue>
          </BalanceRow>
          {contractBalance !== null && (
            <BalanceRow>
              <BalanceLabel>Contract Balance:</BalanceLabel>
              <BalanceValue>{parseFloat(contractBalance).toFixed(7)} {asset}</BalanceValue>
            </BalanceRow>
          )}
        </BalanceInfo>

        <Form onSubmit={(e) => {
          e.preventDefault();
          handleDeposit();
        }}>
          <FormGroup>
            <Label>
              <DollarSign size={16} />
              Amount
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                const pattern = /^\d*\.?\d{0,7}$/;
                if (value === '' || pattern.test(value)) {
                  setAmount(value);
                }
              }}
              placeholder="0.0000000"
              required
            />
            <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Enter amount with up to 7 decimal places
            </small>
          </FormGroup>

          <FormGroup>
            <Label>Asset</Label>
            <Select value={asset} onChange={(e) => setAsset(e.target.value)}>
              <option value="XLM">XLM (Native)</option>
            </Select>
          </FormGroup>

          {status && <StatusMessage>{status}</StatusMessage>}
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <Button
            type="submit"
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
          >
            {isLoading ? (
              'Processing...'
            ) : (
              <>
                <ArrowDownCircle size={20} />
                Deposit Tokens
              </>
            )}
          </Button>
        </Form>
      </OverlayCard>
    </Overlay>
  );
};

export default DepositOverlay;

