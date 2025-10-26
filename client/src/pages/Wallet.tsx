import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, Send, Download, Upload, RefreshCw, QrCode, Copy, Camera, X } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useLocation } from '../contexts/LocationContext';
import PasskeySetupModal from '../components/PasskeySetupModal';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import QrScanner from 'qr-scanner';

const WalletContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
  
  @media (max-width: 768px) {
    padding: 0 0.5rem;
  }
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border-radius: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 1rem;
    margin-bottom: 1rem;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border: none;
  color: #000000;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  font-size: 0.9rem;
  
  &:hover {
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
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }
  
  @media (min-width: 768px) {
    width: auto;
    font-size: 0.9rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    justify-content: center;
    flex: 1;
  }
`;

const SecondaryButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
  
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const QRCodeImage = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const AddressDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: monospace;
  font-size: 0.9rem;
  word-break: break-all;
  max-width: 100%;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
`;

const CopyButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const QRScannerModal = styled.div`
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
  z-index: 1000;
`;

const QRScannerContainer = styled.div`
  position: relative;
  width: 90%;
  max-width: 500px;
  height: 400px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: 95%;
    height: 350px;
  }
  
  @media (max-width: 480px) {
    width: 98%;
    height: 300px;
  }
`;

const QRScannerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #1a1a1a;
  color: white;
`;

const QRScannerTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const QRScannerVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const QRScannerOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  border: 2px solid #4ade80;
  border-radius: 12px;
  pointer-events: none;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px solid rgba(74, 222, 128, 0.3);
    border-radius: 12px;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const QRScannerInstructions = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ScanButton = styled.button`
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
  }
`;

const Form = styled.form`
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
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-size: 1rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4a4a4a;
    box-shadow: 0 0 0 2px rgba(74, 74, 74, 0.3);
  }
`;

const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4a4a4a;
    box-shadow: 0 0 0 2px rgba(74, 74, 74, 0.3);
  }
`;

const BalanceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const BalanceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const AssetInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const AssetCode = styled.span`
  font-weight: 600;
  font-size: 1.1rem;
`;

const AssetType = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
`;

const AssetBalance = styled.span`
  font-family: monospace;
  font-size: 1.1rem;
  font-weight: 600;
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TransactionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`;

const TransactionInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const TransactionHash = styled.a`
  font-family: monospace;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
  word-break: break-all;
  overflow-wrap: break-word;
  hyphens: auto;
  
  &:hover {
    color: #4ade80;
    text-decoration: underline;
  }
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    line-height: 1.4;
  }
`;

const TransactionDate = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
`;

const TransactionStatus = styled.span<{ $successful: boolean }>`
  color: ${props => props.$successful ? '#4ade80' : '#f87171'};
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    align-self: flex-start;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
`;

const NFTCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
`;

const NFTImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
`;

const NFTInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const NFTName = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
`;

const NFTCollection = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
`;

const NFTDistance = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
`;

const Wallet: React.FC = () => {
  const { 
    isConnected, 
    publicKey, 
    balances, 
    transactions, 
    createAccount, 
    connectAccount, 
    sendPayment,
    fundAccount,
    refreshBalance,
    refreshTransactions,
    isLoading,
    enablePasskey
  } = useWallet();

  const { userNFTs, refreshUserNFTs } = useLocation();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [passkeySetupPublicKey, setPasskeySetupPublicKey] = useState<string>('');
  
  const [connectSecret, setConnectSecret] = useState('');
  const [sendDestination, setSendDestination] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendMemo, setSendMemo] = useState('');
  
  const qrScannerRef = useRef<QrScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (connectSecret.trim()) {
      connectAccount(connectSecret.trim());
      setConnectSecret('');
      setShowConnectForm(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendDestination.trim() && sendAmount.trim()) {
      const success = await sendPayment(sendDestination.trim(), sendAmount.trim(), 'XLM', sendMemo.trim() || undefined);
      if (success) {
        setSendDestination('');
        setSendAmount('');
        setSendMemo('');
        setShowSendForm(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Generate QR code for wallet address
  const generateQRCode = async () => {
    if (publicKey) {
      try {
        const qrDataURL = await QRCode.toDataURL(publicKey, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataURL(qrDataURL);
        setShowQRCode(true);
      } catch (error) {
        console.error('Error generating QR code:', error);
        toast.error('Failed to generate QR code');
      }
    }
  };

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

      // Open the modal first
      setShowQRScanner(true);
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
              setShowQRScanner(false);
              return;
            }
            
            const scanner = new QrScanner(
              videoRef.current,
              (result) => {
                console.log('QR Code detected:', result);
                setSendDestination(result.data);
                setShowQRScanner(false);
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
          } else {
            console.error('Video ref is null');
            toast.error('Video element not found');
            setShowQRScanner(false);
          }
        } catch (scannerError) {
          console.error('Scanner error:', scannerError);
          const errorMessage = scannerError instanceof Error ? scannerError.message : String(scannerError);
          
          if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
            toast.error('Camera permission denied. Please allow camera access and try again.');
          } else if (errorMessage.includes('NotFoundError')) {
            toast.error('No camera found on this device.');
          } else {
            toast.error('Failed to start camera scanner: ' + errorMessage);
          }
          setShowQRScanner(false);
        }
      }, 500); // Increased timeout to ensure modal is rendered
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      toast.error('Failed to start camera. Please check permissions.');
      setShowQRScanner(false);
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

  // Cleanup QR scanner on unmount
  useEffect(() => {
    return () => {
      stopQRScanner();
    };
  }, []);

  // Refresh user NFTs when component mounts
  useEffect(() => {
    if (isConnected) {
      refreshUserNFTs();
    }
  }, [isConnected, refreshUserNFTs]);

  // Handle scanner cleanup when modal closes
  useEffect(() => {
    if (!showQRScanner) {
      stopQRScanner();
    }
  }, [showQRScanner]);

  // Listen for passkey setup events
  useEffect(() => {
    const handlePasskeySetup = (event: CustomEvent) => {
      const { publicKey: newPublicKey } = event.detail;
      setPasskeySetupPublicKey(newPublicKey);
      setShowPasskeySetup(true);
    };

    window.addEventListener('showPasskeySetup', handlePasskeySetup as EventListener);
    
    return () => {
      window.removeEventListener('showPasskeySetup', handlePasskeySetup as EventListener);
    };
  }, []);

  const handlePasskeyEnabled = async (credentialId: string) => {
    console.log('Passkey enabled for wallet:', credentialId);
    toast.success('Passkey authentication enabled!');
  };

  const handlePasskeySkip = () => {
    console.log('Passkey setup skipped');
    toast('You can enable passkey authentication later in Settings');
  };

  if (!isConnected) {
    return (
      <WalletContainer>
        <Section>
          <SectionHeader>
            <SectionTitle>Connect Your Wallet</SectionTitle>
          </SectionHeader>
          
          <ButtonGroup>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus size={20} />
              Create New Wallet
            </Button>
            <SecondaryButton onClick={() => setShowConnectForm(true)}>
              <Upload size={20} />
              Connect Existing Wallet
            </SecondaryButton>
          </ButtonGroup>

          {showCreateForm && (
            <div style={{ marginTop: '2rem' }}>
              <h3>Create New Wallet</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem' }}>
                This will generate a new Stellar wallet. Make sure to save your secret key securely!
              </p>
              <Button onClick={createAccount} disabled={isLoading}>
                Generate New Wallet
              </Button>
            </div>
          )}

          {showConnectForm && (
            <Form onSubmit={handleConnect} style={{ marginTop: '2rem' }}>
              <h3>Connect Existing Wallet</h3>
              <FormGroup>
                <Label>Secret Key</Label>
                <Input
                  type="password"
                  placeholder="Enter your secret key"
                  value={connectSecret}
                  onChange={(e) => setConnectSecret(e.target.value)}
                  required
                />
              </FormGroup>
              <ButtonGroup>
                <Button type="submit" disabled={isLoading}>
                  Connect Wallet
                </Button>
                <SecondaryButton onClick={() => setShowConnectForm(false)}>
                  Cancel
                </SecondaryButton>
              </ButtonGroup>
            </Form>
          )}
        </Section>
      </WalletContainer>
    );
  }

  return (
    <WalletContainer>
      {/* Wallet Info */}
      <Section>
        <SectionHeader>
          <SectionTitle>Wallet Information</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={fundAccount} disabled={isLoading} style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' }}>
              <Plus size={20} />
              Fund Account
            </Button>
            <Button onClick={refreshBalance} disabled={isLoading}>
              <RefreshCw size={20} />
              Refresh
            </Button>
          </div>
        </SectionHeader>
        
        <div style={{ marginBottom: '1rem' }}>
          <Label>Public Key</Label>
          <AddressDisplay>
            <span style={{ flex: 1, wordBreak: 'break-all' }}>{publicKey}</span>
            <Button 
              onClick={() => copyToClipboard(publicKey || '')}
              style={{ padding: '0.5rem', minWidth: 'auto' }}
            >
              <Download size={16} />
            </Button>
          </AddressDisplay>
        </div>
        
        {/* QR Code Section */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Button onClick={generateQRCode}>
              <QrCode size={20} />
              Generate QR Code
            </Button>
          </div>
          
          {showQRCode && qrCodeDataURL && (
            <QRCodeContainer>
              <h3 style={{ margin: 0, textAlign: 'center' }}>Your Wallet Address</h3>
              <QRCodeImage>
                <img src={qrCodeDataURL} alt="Wallet QR Code" style={{ display: 'block' }} />
              </QRCodeImage>
              <AddressDisplay>
                <span style={{ flex: 1 }}>{publicKey}</span>
                <CopyButton onClick={() => copyToClipboard(publicKey || '')}>
                  <Copy size={16} />
                </CopyButton>
              </AddressDisplay>
              <p style={{ 
                textAlign: 'center', 
                fontSize: '0.9rem', 
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0 
              }}>
                Scan this QR code to get your wallet address for receiving payments
              </p>
            </QRCodeContainer>
          )}
        </div>
      </Section>

      {/* Balances */}
      <Section>
        <SectionHeader>
          <SectionTitle>Balances</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={() => setShowSendForm(true)}>
              <Send size={20} />
              Send Payment
            </Button>
          </div>
        </SectionHeader>
        
        {balances.length > 0 ? (
          <BalanceList>
            {balances.map((balance, index) => (
              <BalanceItem key={index}>
                <AssetInfo>
                  <AssetCode>{balance.asset}</AssetCode>
                  <AssetType>{balance.assetType}</AssetType>
                </AssetInfo>
                <AssetBalance>{balance.balance}</AssetBalance>
              </BalanceItem>
            ))}
          </BalanceList>
        ) : (
          <EmptyState>
            No balances found. Your wallet might be new or not funded.
          </EmptyState>
        )}
      </Section>

      {/* Send Payment Form */}
      {showSendForm && (
        <Section>
          <SectionHeader>
            <SectionTitle>Send Payment</SectionTitle>
          </SectionHeader>
          
          <Form onSubmit={handleSend}>
            <FormGroup>
              <Label>Destination Address</Label>
              <InputGroup>
                <Input
                  type="text"
                  placeholder="Enter Stellar address"
                  value={sendDestination}
                  onChange={(e) => setSendDestination(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                <ScanButton
                  type="button"
                  onClick={startQRScanner}
                  title="Scan QR Code"
                >
                  <Camera size={20} />
                </ScanButton>
              </InputGroup>
            </FormGroup>
            
            <FormGroup>
              <Label>Amount (XLM)</Label>
              <Input
                type="number"
                step="0.0000001"
                placeholder="Enter amount"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Memo (Optional)</Label>
              <TextArea
                placeholder="Enter memo"
                value={sendMemo}
                onChange={(e) => setSendMemo(e.target.value)}
              />
            </FormGroup>
            
            <ButtonGroup>
              <Button type="submit" disabled={isLoading}>
                Send Payment
              </Button>
              <SecondaryButton onClick={() => setShowSendForm(false)}>
                Cancel
              </SecondaryButton>
            </ButtonGroup>
          </Form>
        </Section>
      )}

      {/* Recent Transactions */}
      <Section>
        <SectionHeader>
          <SectionTitle>Recent Transactions</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={refreshTransactions} disabled={isLoading}>
              <RefreshCw size={20} />
              Refresh
            </Button>
          </div>
        </SectionHeader>
        
        {transactions.length > 0 ? (
          <TransactionList>
            {transactions.slice(0, 10).map((tx) => (
              <TransactionItem key={tx.id}>
                <TransactionInfo>
                  <TransactionHash 
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on Stellar Expert"
                  >
                    {tx.hash}
                  </TransactionHash>
                  <TransactionDate>
                    {new Date(tx.createdAt).toLocaleString()}
                  </TransactionDate>
                </TransactionInfo>
                <TransactionStatus $successful={tx.successful}>
                  {tx.successful ? 'Success' : 'Failed'}
                </TransactionStatus>
              </TransactionItem>
            ))}
          </TransactionList>
        ) : (
          <EmptyState>
            No transactions found.
          </EmptyState>
        )}
      </Section>

      {/* NFT Collection */}
      <Section>
        <SectionHeader>
          <SectionTitle>My NFT Collection</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={refreshUserNFTs} disabled={isLoading}>
              <RefreshCw size={20} />
              Refresh
            </Button>
          </div>
        </SectionHeader>
        
        {userNFTs.length > 0 ? (
          <div>
            {userNFTs.map((nft, index) => (
              <NFTCard key={nft.id || index}>
                <NFTImage 
                  src={nft.image_url} 
                  alt={nft.name}
                  onError={(e) => {
                    e.currentTarget.src = '/stellar-location.png';
                  }}
                />
                <NFTInfo>
                  <NFTName>{nft.name}</NFTName>
                  <NFTCollection>{nft.collection?.name || 'Unknown Collection'}</NFTCollection>
                  <NFTDistance>Collected at {nft.distance}m from location</NFTDistance>
                </NFTInfo>
              </NFTCard>
            ))}
          </div>
        ) : (
          <EmptyState>
            No NFTs collected yet. Explore the map to discover and collect nearby NFTs!
          </EmptyState>
        )}
      </Section>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScannerModal>
          <QRScannerContainer>
            <QRScannerHeader>
              <QRScannerTitle>Scan QR Code</QRScannerTitle>
              <CloseButton onClick={() => {
                console.log('Closing QR scanner modal');
                stopQRScanner();
                setShowQRScanner(false);
              }}>
                <X size={20} />
              </CloseButton>
            </QRScannerHeader>
            <div style={{ position: 'relative', flex: 1 }}>
              <QRScannerVideo ref={videoRef} />
              <QRScannerOverlay />
              <QRScannerInstructions>
                Position the QR code within the frame
              </QRScannerInstructions>
            </div>
          </QRScannerContainer>
        </QRScannerModal>
      )}

      {/* Passkey Setup Modal */}
      <PasskeySetupModal
        isOpen={showPasskeySetup}
        onClose={() => setShowPasskeySetup(false)}
        onPasskeyEnabled={handlePasskeyEnabled}
        onSkip={handlePasskeySkip}
        publicKey={passkeySetupPublicKey}
      />
    </WalletContainer>
  );
};

export default Wallet;
