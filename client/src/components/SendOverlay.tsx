import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { X, Send, User, DollarSign, MessageSquare, QrCode, Camera } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
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
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(74, 222, 128, 0.5);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 222, 128, 0.7);
  }
  
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
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(123, 104, 238, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: #F8FAFC;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #7B68EE;
    box-shadow: 0 0 0 2px rgba(123, 104, 238, 0.2);
  }
  
  &::placeholder {
    color: rgba(248, 250, 252, 0.5);
  }
`;

const Select = styled.select`
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(123, 104, 238, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: #F8FAFC;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #7B68EE;
    box-shadow: 0 0 0 2px rgba(123, 104, 238, 0.2);
  }
  
  option {
    background: #0F172A;
    color: #F8FAFC;
  }
`;

const TextArea = styled.textarea`
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(123, 104, 238, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: #F8FAFC;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #7B68EE;
    box-shadow: 0 0 0 2px rgba(123, 104, 238, 0.2);
  }
  
  &::placeholder {
    color: rgba(248, 250, 252, 0.5);
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border: 1px solid transparent;
  color: #000000;
  padding: 1rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }
`;

const SecondaryButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #FFFFFF;
  padding: 1rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.5);
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const BalanceInfo = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const BalanceText = styled.div`
  color: #10B981;
  font-size: 0.9rem;
  font-weight: 500;
`;

const BalanceRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const BalanceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const BalanceLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
`;

const BalanceValue = styled.span`
  color: #10B981;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: monospace;
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: #EF4444;
  font-size: 0.9rem;
  margin-top: 1rem;
`;

const SuccessMessage = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: #10B981;
  font-size: 0.9rem;
  margin-top: 1rem;
`;

const QRScannerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 2rem;
`;

const ScannerCard = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

const ScannerTitle = styled.h3`
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`;

const ScannerVideo = styled.video`
  width: 100%;
  max-width: 300px;
  height: 300px;
  border-radius: 8px;
  background: #000;
  margin-bottom: 1rem;
`;


const ScannerInstructions = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const ScannerButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const ScannerButton = styled.button`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border: none;
  color: #000000;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ScannerCloseButton = styled(ScannerButton)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #FFFFFF;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.5);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }
`;

const QRButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  margin-left: 0.5rem;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.5);
  }
`;

const SendMaxButton = styled.button`
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-left: 0.5rem;
  
  &:hover {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.6);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

interface SendOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendOverlay: React.FC<SendOverlayProps> = ({ isOpen, onClose }) => {
  const { balances, sendPayment, isLoading, contractBalance, userStake, getContractBalance } = useWallet();
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('XLM');
  const [memo, setMemo] = useState('');
  const [paymentSource, setPaymentSource] = useState<'wallet' | 'smart-wallet'>('wallet');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Reset form and refresh contract balance when overlay opens/closes
  useEffect(() => {
    if (isOpen) {
      setRecipient('');
      setAmount('');
      setAsset('XLM');
      setMemo('');
      setPaymentSource('wallet');
      setError('');
      setSuccess('');
      // Refresh contract balance when overlay opens
      console.log('🔄 SendOverlay opened - refreshing contract balance...');
      getContractBalance().catch(err => {
        console.error('Error refreshing contract balance:', err);
      });
    }
  }, [isOpen, getContractBalance]);

  // Log contract balance changes for debugging
  useEffect(() => {
    if (isOpen) {
      console.log('💰 SendOverlay contract balance:', contractBalance);
    }
  }, [contractBalance, isOpen]);

  // Log paymentSource changes for debugging
  useEffect(() => {
    console.log('🔄 PaymentSource state changed:', paymentSource);
  }, [paymentSource]);

  // Start QR scanner
  const startQRScanner = async () => {
    console.log('Starting QR scanner...');
    
    try {
      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      console.log('Camera available:', hasCamera);
      if (!hasCamera) {
        toast.error('No camera found on this device');
        return;
      }

      // Open the scanner modal
      setIsScannerOpen(true);
      setScannerError('');
      toast('Requesting camera access...');

      // Wait for modal to render, then start scanner
      setTimeout(async () => {
        try {
          console.log('Video ref:', videoRef.current);
          if (videoRef.current) {
            console.log('Creating QrScanner instance...');
            
            // Check if we're on HTTPS or localhost
            const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
            if (!isSecure) {
              toast.error('Camera access requires HTTPS. Please use the secure version of the site.');
              setIsScannerOpen(false);
              return;
            }
            
            const scanner = new QrScanner(
              videoRef.current,
              (result) => {
                console.log('QR Code detected:', result);
                setRecipient(result.data);
                setIsScannerOpen(false);
                stopQRScanner();
                toast.success('Address scanned successfully!');
              },
              {
                highlightScanRegion: true,
                highlightCodeOutline: true,
                preferredCamera: 'environment', // Use back camera on mobile
                maxScansPerSecond: 5,
              }
            );
            
            qrScannerRef.current = scanner;
            console.log('Starting scanner...');
            await scanner.start();
            console.log('Scanner started successfully');
            toast.success('Camera started - position QR code in frame');
          }
        } catch (error) {
          console.error('Error starting scanner:', error);
          toast.error('Failed to start camera. Please check permissions.');
          setScannerError('Failed to start camera. Please check permissions.');
        }
      }, 100);
    } catch (error) {
      console.error('Error checking camera:', error);
      toast.error('Camera access failed');
      setScannerError('Camera access failed');
    }
  };

  // Stop QR scanner
  const stopQRScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
  };

  // Handle scanner open/close
  const openScanner = () => {
    startQRScanner();
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
    stopQRScanner();
    setScannerError('');
  };

  // Cleanup QR scanner on unmount
  useEffect(() => {
    return () => {
      stopQRScanner();
    };
  }, []);

  // Handle scanner cleanup when modal closes
  useEffect(() => {
    if (!isScannerOpen) {
      stopQRScanner();
    }
  }, [isScannerOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!recipient.trim()) {
      setError('Please enter a recipient address');
      return;
    }

    // Log current paymentSource state before submission
    console.log('📤 SendOverlay - About to send payment:', {
      recipient,
      amount,
      amountType: typeof amount,
      amountLength: amount.length,
      asset,
      memo,
      paymentSource,
      paymentSourceType: typeof paymentSource,
      paymentSourceValue: paymentSource === 'smart-wallet' ? 'SMART-WALLET' : 'WALLET',
      selectElementValue: (document.getElementById('paymentSource') as HTMLSelectElement)?.value || 'NOT_FOUND'
    });
    
    // Double-check paymentSource state
    if (paymentSource !== 'wallet' && paymentSource !== 'smart-wallet') {
      console.error('⚠️ Invalid paymentSource value:', paymentSource);
      setError('Invalid payment source selected');
      return;
    }
    
    // Warn if user selected smart-wallet but state is wallet
    const selectElement = document.getElementById('paymentSource') as HTMLSelectElement;
    if (selectElement && selectElement.value === 'smart-wallet' && paymentSource === 'wallet') {
      console.warn('⚠️ Select element shows smart-wallet but state is wallet! Using select element value.');
      setPaymentSource('smart-wallet');
      // Continue with smart-wallet
    }

    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Validate balance for smart wallet payments - check against userStake, not contractBalance
    if (paymentSource === 'smart-wallet') {
      const amountNum = parseFloat(amount);
      const userStakeNum = userStake ? parseFloat(userStake.toString()) : 0;
      
      if (userStakeNum <= 0) {
        setError(`You have no stake in the smart wallet contract. Please deposit funds first.`);
        return;
      }
      
      if (amountNum > userStakeNum) {
        setError(`Insufficient stake. You have ${userStakeNum.toFixed(7)} ${asset} stake, but trying to send ${amountNum.toFixed(7)} ${asset}.`);
        return;
      }
    }

    try {
      const result = await sendPayment(recipient, amount, asset, memo, paymentSource);
      if (result) {
        // Close the overlay first
        onClose();
        
        // Navigate to transaction complete page with transaction details
        navigate('/transaction-complete', {
          state: {
            transactionHash: result, // Use the actual transaction hash
            paymentDetails: {
              recipient,
              amount,
              asset,
              memo
            },
            note: 'Payment sent successfully using smart wallet with passkey authentication!'
          }
        });
      } else {
        setError('Payment failed');
      }
    } catch (error) {
      setError('An error occurred while sending the payment');
    }
  };

  const totalBalance = balances.reduce((sum, balance) => {
    if (balance.asset === 'XLM' || balance.assetType === 'native') {
      return sum + parseFloat(balance.balance || '0');
    }
    return sum;
  }, 0);

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <OverlayCard onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={16} />
        </CloseButton>
        
        <Header>
          <Send size={24} color="#4ade80" />
          <Title>Send Payment</Title>
        </Header>
        
        <Form onSubmit={handleSubmit}>
          <BalanceInfo>
            <BalanceRow>
              <BalanceItem>
                <BalanceLabel>Wallet Balance:</BalanceLabel>
                <BalanceValue>{totalBalance.toFixed(7)} XLM</BalanceValue>
              </BalanceItem>
              <BalanceItem>
                <BalanceLabel>Smart Wallet Balance (Total Vault):</BalanceLabel>
                <BalanceValue>{contractBalance ? parseFloat(contractBalance).toFixed(7) : '0.0000000'} XLM</BalanceValue>
              </BalanceItem>
              {userStake !== null && (
                <BalanceItem>
                  <BalanceLabel>Your Stake in Contract:</BalanceLabel>
                  <BalanceValue style={{ color: '#60a5fa' }}>
                    {parseFloat(userStake).toFixed(7)} XLM
                  </BalanceValue>
                </BalanceItem>
              )}
            </BalanceRow>
          </BalanceInfo>

          <FormGroup>
            <Label htmlFor="paymentSource">
              Payment Source
            </Label>
            <Select
              id="paymentSource"
              value={paymentSource}
              onChange={(e) => {
                const newSource = e.target.value as 'wallet' | 'smart-wallet';
                console.log('🔄 Payment source changed:', { 
                  old: paymentSource, 
                  new: newSource,
                  eventValue: e.target.value,
                  selectElement: e.target
                });
                setPaymentSource(newSource);
                // Force a re-render to ensure state is updated
                console.log('✅ Payment source state updated to:', newSource);
              }}
            >
              <option value="wallet">
                From Wallet Balance ({totalBalance.toFixed(7)} XLM)
              </option>
              <option value="smart-wallet">
                From Smart Wallet Balance ({contractBalance ? parseFloat(contractBalance).toFixed(7) : '0.0000000'} XLM)
              </option>
            </Select>
            <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {paymentSource === 'wallet' 
                ? 'Pay directly from your Stellar wallet balance'
                : 'Pay from your smart wallet contract balance (requires passkey authentication)'}
            </small>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="recipient">
              <User size={16} />
              Recipient Address
            </Label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                id="recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter Stellar address (G...)"
                required
                style={{ flex: 1 }}
              />
              <QRButton onClick={openScanner} title="Scan QR Code">
                <QrCode size={16} />
              </QRButton>
            </div>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="amount">
              <DollarSign size={16} />
              Amount
            </Label>
            <InputGroup>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  // Allow only numbers and decimal point, preserve full precision
                  const value = e.target.value;
                  const pattern = /^\d*\.?\d{0,7}$/;
                  const matchesPattern = pattern.test(value);
                  const hasDecimal = value.includes('.');
                  const decimalIndex = value.indexOf('.');
                  const decimalPart = hasDecimal ? value.substring(decimalIndex + 1) : '';
                  
                  console.log('🔢 Amount input changed:', {
                    rawValue: value,
                    length: value.length,
                    hasDecimal: hasDecimal,
                    decimalIndex: decimalIndex,
                    decimalPart: decimalPart,
                    decimalPartLength: decimalPart.length,
                    matchesPattern: matchesPattern,
                    charCodes: value.split('').map(c => c.charCodeAt(0)) // Debug: check if decimal point (46) is present
                  });
                  
                  // Validate: allow numbers, single decimal point, and up to 7 decimal places
                  // Pattern: optional digits, optional decimal point, up to 7 digits after decimal
                  if (value === '' || matchesPattern) {
                    setAmount(value);
                    console.log('✅ Amount set to:', value, 'Type:', typeof value);
                  } else {
                    console.log('❌ Amount rejected (invalid format):', {
                      value: value,
                      matchesPattern: matchesPattern,
                      pattern: pattern.toString(),
                      charCodes: value.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' ')
                    });
                  }
                }}
                onBlur={(e) => {
                  // Ensure value is preserved on blur
                  console.log('🔢 Amount input blurred, final value:', e.target.value);
                }}
                placeholder="0.0000000"
                required
                style={{ flex: 1 }}
              />
              {paymentSource === 'smart-wallet' && userStake && parseFloat(userStake) > 0 && (
                <SendMaxButton
                  type="button"
                  onClick={() => {
                    // Calculate max sendable amount: userStake - estimated fees
                    // Fees are typically around 0.0001-0.001 XLM for Soroban transactions
                    // We'll reserve 0.001 XLM for safety
                    const userStakeNum = parseFloat(userStake);
                    const estimatedFee = 0.001; // Reserve 0.001 XLM for fees
                    const maxSendable = Math.max(0, userStakeNum - estimatedFee);
                    
                    if (maxSendable > 0) {
                      setAmount(maxSendable.toFixed(7));
                    } else {
                      setError('Insufficient stake to cover transaction fees. Minimum stake required: 0.001 XLM');
                    }
                  }}
                  title={`Send maximum available (${userStake ? (parseFloat(userStake) - 0.001).toFixed(7) : '0'} XLM after fees)`}
                >
                  Send Max
                </SendMaxButton>
              )}
            </InputGroup>
            <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {paymentSource === 'smart-wallet' 
                ? `Enter amount with up to 7 decimal places. Max: ${userStake ? parseFloat(userStake).toFixed(7) : '0.0000000'} XLM (your stake)`
                : 'Enter amount with up to 7 decimal places (e.g., 333.333333)'}
            </small>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="asset">
              Asset
            </Label>
            <Select
              id="asset"
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
            >
              <option value="XLM">XLM (Lumens)</option>
              {balances
                .filter(balance => balance.asset !== 'XLM' && balance.assetType !== 'native')
                .map((balance, index) => (
                  <option key={index} value={balance.assetCode || balance.asset}>
                    {balance.assetCode || balance.asset}
                  </option>
                ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="memo">
              <MessageSquare size={16} />
              Memo (Optional)
            </Label>
            <TextArea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Add a note for this transaction..."
              maxLength={28}
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <ButtonGroup>
            <Button type="submit" disabled={isLoading}>
              <Send size={16} />
              {isLoading ? 'Sending...' : 'Send Payment'}
            </Button>
            <SecondaryButton type="button" onClick={onClose}>
              Cancel
            </SecondaryButton>
          </ButtonGroup>
        </Form>
      </OverlayCard>

      {/* QR Scanner Overlay */}
      {isScannerOpen && (
        <QRScannerContainer>
          <ScannerCard>
            <ScannerTitle>
              <Camera size={20} style={{ marginRight: '0.5rem' }} />
              Scan QR Code
            </ScannerTitle>
            
            <ScannerVideo
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />
            
            <ScannerInstructions>
              Position the QR code within the frame. Scanning happens automatically.
            </ScannerInstructions>
            
            {scannerError && (
              <ErrorMessage style={{ marginBottom: '1rem' }}>
                {scannerError}
              </ErrorMessage>
            )}
            
            <ScannerButtons>
              <ScannerCloseButton onClick={closeScanner}>
                <X size={16} />
                Close
              </ScannerCloseButton>
            </ScannerButtons>
          </ScannerCard>
        </QRScannerContainer>
      )}
    </Overlay>
  );
};

export default SendOverlay;
