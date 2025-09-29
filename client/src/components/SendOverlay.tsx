import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { X, Send, User, DollarSign, MessageSquare, QrCode, Camera } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
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
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  
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
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #4ade80;
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
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
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #4ade80;
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
  }
  
  option {
    background: #2d2d2d;
    color: white;
  }
`;

const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #4ade80;
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  border: none;
  color: white;
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
  margin-top: 1rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const BalanceInfo = styled.div`
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const BalanceText = styled.div`
  color: #4ade80;
  font-size: 0.9rem;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 1rem;
`;

const SuccessMessage = styled.div`
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid rgba(40, 167, 69, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: #28a745;
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
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ScannerCloseButton = styled(ScannerButton)`
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  
  &:hover {
    box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
  }
`;

const QRButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
    background: rgba(255, 255, 255, 0.2);
    border-color: #4ade80;
    color: #4ade80;
  }
`;

interface SendOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendOverlay: React.FC<SendOverlayProps> = ({ isOpen, onClose }) => {
  const { balances, sendPayment, isLoading } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('XLM');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Reset form when overlay opens/closes
  useEffect(() => {
    if (isOpen) {
      setRecipient('');
      setAmount('');
      setAsset('XLM');
      setMemo('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

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

    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      const success = await sendPayment(recipient, amount, asset, memo);
      if (success) {
        setSuccess('Payment sent successfully!');
        // Reset form after successful payment
        setTimeout(() => {
          setRecipient('');
          setAmount('');
          setMemo('');
        }, 2000);
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
            <BalanceText>
              Available Balance: {totalBalance.toFixed(7)} XLM
            </BalanceText>
          </BalanceInfo>

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
            <Input
              id="amount"
              type="number"
              step="0.0000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0000000"
              min="0"
              max={totalBalance}
              required
            />
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
