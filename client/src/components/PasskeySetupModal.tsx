import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Fingerprint, CheckCircle, XCircle, Loader, Shield, AlertCircle } from 'lucide-react';
import { passkeyService } from '../services/passkeyService';
import toast from 'react-hot-toast';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    max-width: 90vw;
  }
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: #FFFFFF;
`;

const ModalSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 1rem;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const FeatureIcon = styled.div`
  color: #4CAF50;
  display: flex;
  align-items: center;
`;

const FeatureText = styled.div`
  flex: 1;
  font-size: 0.9rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const PrimaryButton = styled.button<{ $disabled?: boolean }>`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border: none;
  color: #000000;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  opacity: ${props => props.$disabled ? 0.6 : 1};

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }

  &:disabled {
    transform: none;
  }
`;

const SecondaryButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #FFFFFF;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'loading' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  
  ${props => {
    switch (props.$type) {
      case 'success':
        return `
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid rgba(76, 175, 80, 0.3);
          color: #4CAF50;
        `;
      case 'error':
        return `
          background: rgba(244, 67, 54, 0.2);
          border: 1px solid rgba(244, 67, 54, 0.3);
          color: #F44336;
        `;
      case 'loading':
        return `
          background: rgba(33, 150, 243, 0.2);
          border: 1px solid rgba(33, 150, 243, 0.3);
          color: #2196F3;
        `;
      case 'info':
        return `
          background: rgba(255, 193, 7, 0.2);
          border: 1px solid rgba(255, 193, 7, 0.3);
          color: #FFC107;
        `;
    }
  }}
`;

const SecurityNotice = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const SecurityNoticeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #FFC107;
`;

const SecurityNoticeText = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
`;

interface PasskeySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasskeyEnabled: (credentialId: string) => void;
  onSkip: () => void;
  publicKey: string;
}

const PasskeySetupModal: React.FC<PasskeySetupModalProps> = ({
  isOpen,
  onClose,
  onPasskeyEnabled,
  onSkip,
  publicKey
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const checkSupport = async () => {
        const supported = passkeyService.isSupported();
        setIsSupported(supported);
        
        if (supported) {
          const available = await passkeyService.isAvailable();
          setIsAvailable(available);
        }
      };
      
      checkSupport();
    }
  }, [isOpen]);

  const handleEnablePasskey = async () => {
    if (!isSupported || !isAvailable) {
      return;
    }

    setIsLoading(true);
    setStatus('loading');
    setStatusMessage('Setting up your passkey...');

    try {
      const userId = `xyz-user-${publicKey.slice(-8)}`;
      const registration = await passkeyService.registerPasskey(userId);
      
      // Store the passkey data
      await passkeyService.storePasskeyData(registration.credentialId, registration.publicKey);
      
      setStatus('success');
      setStatusMessage('Passkey successfully created! Your secret key has been removed for security.');
      
      toast.success('Passkey authentication enabled!');
      
      // Call the callback after a short delay to show the success message
      setTimeout(() => {
        onPasskeyEnabled(registration.credentialId);
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Passkey registration failed:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to create passkey');
      toast.error('Failed to enable passkey');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    toast('You can enable passkey authentication later in Settings');
    onSkip();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>
            <Shield size={32} style={{ marginBottom: '0.5rem', color: '#FFD700' }} />
            <br />
            Secure Your Wallet
          </ModalTitle>
          <ModalSubtitle>
            Enable passkey authentication for enhanced security
          </ModalSubtitle>
        </ModalHeader>

        <SecurityNotice>
          <SecurityNoticeHeader>
            <AlertCircle size={18} />
            Security Notice
          </SecurityNoticeHeader>
          <SecurityNoticeText>
            When you enable passkey authentication, your secret key will be removed from local storage for enhanced security. 
            You'll use biometric authentication (Touch ID, Face ID, etc.) to access your wallet.
          </SecurityNoticeText>
        </SecurityNotice>

        <FeatureList>
          <FeatureItem>
            <FeatureIcon>
              <Fingerprint size={20} />
            </FeatureIcon>
            <FeatureText>
              <strong>Biometric Authentication</strong><br />
              Use Touch ID, Face ID, or Windows Hello
            </FeatureText>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon>
              <Shield size={20} />
            </FeatureIcon>
            <FeatureText>
              <strong>Enhanced Security</strong><br />
              Secret key removed from device storage
            </FeatureText>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon>
              <CheckCircle size={20} />
            </FeatureIcon>
            <FeatureText>
              <strong>Easy Access</strong><br />
              Quick and secure wallet authentication
            </FeatureText>
          </FeatureItem>
        </FeatureList>

        {status !== 'idle' && (
          <StatusMessage $type={status}>
            {status === 'loading' && <Loader size={18} className="spinner" />}
            {status === 'success' && <CheckCircle size={18} />}
            {status === 'error' && <XCircle size={18} />}
            {statusMessage}
          </StatusMessage>
        )}

        <ButtonGroup>
          <PrimaryButton 
            onClick={handleEnablePasskey}
            $disabled={!isSupported || !isAvailable || isLoading}
          >
            {isLoading ? (
              <>
                <Loader size={18} className="spinner" />
                Setting up...
              </>
            ) : (
              <>
                <Fingerprint size={18} />
                Enable Passkey
              </>
            )}
          </PrimaryButton>
          
          <SecondaryButton onClick={handleSkip}>
            Skip for Now
          </SecondaryButton>
        </ButtonGroup>

        {!isSupported && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <StatusMessage $type="error">
              <XCircle size={18} />
              Your browser doesn't support passkeys
            </StatusMessage>
          </div>
        )}

        {isSupported && !isAvailable && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <StatusMessage $type="info">
              <AlertCircle size={18} />
              No biometric sensor found on this device
            </StatusMessage>
          </div>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default PasskeySetupModal;
