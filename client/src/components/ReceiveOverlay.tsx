import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { X, QrCode, Copy, Download, Share } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import QRCode from 'qrcode';

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
  max-width: 500px;
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

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const WalletInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
`;

const InfoValue = styled.span`
  color: white;
  font-weight: 600;
  font-family: monospace;
  font-size: 0.9rem;
  word-break: break-all;
`;

const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  margin: 1rem 0;
`;

const QRCodeImage = styled.img`
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
`;

const QRCodeText = styled.div`
  color: #333;
  font-size: 0.9rem;
  text-align: center;
  max-width: 200px;
  word-break: break-all;
`;

const AddressContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
`;

const AddressText = styled.div`
  color: white;
  font-family: monospace;
  font-size: 0.9rem;
  word-break: break-all;
  margin-bottom: 1rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
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
  flex: 1;
  min-width: 120px;
  justify-content: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled(ActionButton)`
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  
  &:hover {
    box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
  }
`;

const Instructions = styled.div`
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
`;

const InstructionsTitle = styled.h3`
  color: #4ade80;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

const InstructionsText = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
`;

interface ReceiveOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReceiveOverlay: React.FC<ReceiveOverlayProps> = ({ isOpen, onClose }) => {
  const { publicKey, balances } = useWallet();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateQRCode = useCallback(async () => {
    if (!publicKey) return;
    
    setIsGenerating(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(publicKey, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [publicKey]);

  // Generate QR code when component opens
  useEffect(() => {
    if (isOpen && publicKey) {
      generateQRCode();
    }
  }, [isOpen, publicKey, generateQRCode]);

  const copyToClipboard = async () => {
    if (!publicKey) return;
    
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `wallet-address-qr-${Date.now()}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  const shareQRCode = async () => {
    if (!publicKey) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Stellar Wallet Address',
          text: `Send XLM to: ${publicKey}`,
          url: publicKey
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      copyToClipboard();
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
          <QrCode size={24} color="#4ade80" />
          <Title>Receive XLM</Title>
        </Header>
        
        <Content>
          <WalletInfo>
            <InfoRow>
              <InfoLabel>Wallet Address</InfoLabel>
              <InfoValue>{publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Current Balance</InfoLabel>
              <InfoValue>{totalBalance.toFixed(7)} XLM</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Network</InfoLabel>
              <InfoValue>Stellar Testnet</InfoValue>
            </InfoRow>
          </WalletInfo>
          
          <QRCodeContainer>
            {isGenerating ? (
              <div style={{ color: '#333', textAlign: 'center' }}>
                Generating QR Code...
              </div>
            ) : qrCodeDataUrl ? (
              <>
                <QRCodeImage src={qrCodeDataUrl} alt="Wallet QR Code" />
                <QRCodeText>
                  Scan this QR code to send XLM to this wallet
                </QRCodeText>
              </>
            ) : (
              <div style={{ color: '#333', textAlign: 'center' }}>
                Error generating QR code
              </div>
            )}
          </QRCodeContainer>
          
          <AddressContainer>
            <AddressText>
              {publicKey}
            </AddressText>
            <ActionButtons>
              <ActionButton onClick={copyToClipboard} disabled={copied}>
                <Copy size={16} />
                {copied ? 'Copied!' : 'Copy Address'}
              </ActionButton>
              <SecondaryButton onClick={downloadQRCode} disabled={!qrCodeDataUrl}>
                <Download size={16} />
                Download QR
              </SecondaryButton>
              <SecondaryButton onClick={shareQRCode}>
                <Share size={16} />
                Share
              </SecondaryButton>
            </ActionButtons>
          </AddressContainer>
          
          <Instructions>
            <InstructionsTitle>How to receive XLM:</InstructionsTitle>
            <InstructionsText>
              1. Share your wallet address or QR code with the sender<br/>
              2. The sender can scan the QR code or copy the address<br/>
              3. Once the transaction is confirmed, XLM will appear in your wallet<br/>
              4. Transactions typically take 3-5 seconds to confirm on Stellar
            </InstructionsText>
          </Instructions>
        </Content>
      </OverlayCard>
    </Overlay>
  );
};

export default ReceiveOverlay;
