import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Fingerprint, Shield, Smartphone, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { passkeyService, PasskeyCredential } from '../services/passkeyService';

const PasskeyContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  padding: 2rem;
  color: #FFFFFF;
  transition: transform 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.2);
  }
`;

const PasskeyHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const PasskeyTitle = styled.h2`
  color: #FFFFFF;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const PasskeySubtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin: 0;
`;

const PasskeyStatus = styled.div<{ $status: 'success' | 'error' | 'loading' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  background: ${props => {
    switch (props.$status) {
      case 'success': return 'rgba(34, 197, 94, 0.1)';
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      case 'loading': return 'rgba(59, 130, 246, 0.1)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'success': return 'rgba(34, 197, 94, 0.3)';
      case 'error': return 'rgba(239, 68, 68, 0.3)';
      case 'loading': return 'rgba(59, 130, 246, 0.3)';
      default: return 'rgba(255, 255, 255, 0.3)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'success': return '#22c55e';
      case 'error': return '#ef4444';
      case 'loading': return '#3b82f6';
      default: return '#FFFFFF';
    }
  }};
`;

const PasskeyButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return 'linear-gradient(135deg, #FFD700, #FFA500)';
      case 'danger': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$variant) {
      case 'primary': return 'rgba(255, 215, 0, 0.5)';
      case 'danger': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(255, 255, 255, 0.3)';
    }
  }};
  color: ${props => props.$variant === 'primary' ? '#000000' : '#FFFFFF'};
  padding: 1rem 2rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  width: 100%;
  margin-bottom: 1rem;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PasskeyInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
`;

const PasskeyInfoTitle = styled.h4`
  color: #FFFFFF;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PasskeyInfoText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin: 0;
  line-height: 1.4;
`;

const PasskeyFeature = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
`;

interface PasskeyAuthProps {
  onPasskeyEnabled?: (credentialId: string) => void;
  onPasskeyDisabled?: () => void;
  onAuthenticated?: (credentialId: string) => void;
}

const PasskeyAuth: React.FC<PasskeyAuthProps> = ({ 
  onPasskeyEnabled, 
  onPasskeyDisabled, 
  onAuthenticated 
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isPasskeyEnabled, setIsPasskeyEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | 'loading' | 'info'>('info');
  const [statusMessage, setStatusMessage] = useState('');
  const [storedPasskey, setStoredPasskey] = useState<PasskeyCredential | null>(null);

  useEffect(() => {
    checkPasskeySupport();
    checkPasskeyStatus();
  }, []);

  const checkPasskeySupport = async () => {
    const supported = passkeyService.isSupported();
    setIsSupported(supported);
    
    if (supported) {
      const available = await passkeyService.isAvailable();
      setIsAvailable(available);
      
      if (!available) {
        setStatus('error');
        setStatusMessage('Passkeys are not available on this device. Please use a device with biometric authentication.');
      }
    } else {
      setStatus('error');
      setStatusMessage('WebAuthn is not supported in this browser. Please use a modern browser.');
    }
  };

  const checkPasskeyStatus = async () => {
    const enabled = passkeyService.isPasskeyEnabled();
    setIsPasskeyEnabled(enabled);
    
    if (enabled) {
      const passkeyData = await passkeyService.getStoredPasskeyData();
      setStoredPasskey(passkeyData);
      
      if (passkeyData) {
        setStatus('success');
        setStatusMessage(`Passkey is enabled for ${passkeyData.deviceType} device`);
      }
    }
  };

  const handleRegisterPasskey = async () => {
    if (!isSupported || !isAvailable) {
      return;
    }

    setIsLoading(true);
    setStatus('loading');
    setStatusMessage('Setting up your passkey...');

    try {
      // Generate a unique user ID (in production, this should be from your backend)
      const userId = `xyz-user-${Date.now()}`;
      
      const registration = await passkeyService.registerPasskey(userId);
      
      // Store the passkey data
      await passkeyService.storePasskeyData(registration.credentialId, registration.publicKey);
      
      setIsPasskeyEnabled(true);
      setStatus('success');
      setStatusMessage('Passkey successfully created! You can now use biometric authentication.');
      
      // Refresh stored passkey data
      await checkPasskeyStatus();
      
      onPasskeyEnabled?.(registration.credentialId);
    } catch (error) {
      console.error('Passkey registration failed:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to create passkey');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!isPasskeyEnabled || !storedPasskey) {
      return;
    }

    setIsLoading(true);
    setStatus('loading');
    setStatusMessage('Authenticating with passkey...');

    try {
      const auth = await passkeyService.authenticatePasskey(storedPasskey.id);
      
      setStatus('success');
      setStatusMessage('Authentication successful!');
      
      onAuthenticated?.(auth.credentialId);
    } catch (error) {
      console.error('Passkey authentication failed:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePasskey = async () => {
    setIsLoading(true);
    setStatus('loading');
    setStatusMessage('Disabling passkey...');

    try {
      await passkeyService.disablePasskey();
      
      setIsPasskeyEnabled(false);
      setStoredPasskey(null);
      setStatus('info');
      setStatusMessage('Passkey has been disabled. Secret key authentication will be used.');
      
      onPasskeyDisabled?.();
    } catch (error) {
      console.error('Failed to disable passkey:', error);
      setStatus('error');
      setStatusMessage('Failed to disable passkey');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <PasskeyContainer>
        <PasskeyHeader>
          <PasskeyTitle>
            <AlertCircle size={24} />
            Passkey Not Supported
          </PasskeyTitle>
          <PasskeySubtitle>
            Your browser doesn't support WebAuthn. Please use a modern browser.
          </PasskeySubtitle>
        </PasskeyHeader>
      </PasskeyContainer>
    );
  }

  return (
    <PasskeyContainer>
      <PasskeyHeader>
        <PasskeyTitle>
          <Shield size={24} />
          Secure Authentication
        </PasskeyTitle>
        <PasskeySubtitle>
          Use biometric authentication instead of secret keys
        </PasskeySubtitle>
      </PasskeyHeader>

      <PasskeyStatus $status={status}>
        {status === 'loading' && <Loader size={16} className="animate-spin" />}
        {status === 'success' && <CheckCircle size={16} />}
        {status === 'error' && <AlertCircle size={16} />}
        {status === 'info' && <Shield size={16} />}
        {statusMessage}
      </PasskeyStatus>

      {!isPasskeyEnabled ? (
        <>
          <PasskeyButton 
            $variant="primary" 
            onClick={handleRegisterPasskey}
            disabled={!isAvailable || isLoading}
          >
            <Fingerprint size={20} />
            {isLoading ? 'Setting up...' : 'Enable Passkey Authentication'}
          </PasskeyButton>

          <PasskeyInfo>
            <PasskeyInfoTitle>
              <Smartphone size={16} />
              Why use passkeys?
            </PasskeyInfoTitle>
            <PasskeyFeature>
              <CheckCircle size={12} />
              No secret keys stored in browser
            </PasskeyFeature>
            <PasskeyFeature>
              <CheckCircle size={12} />
              Biometric authentication (Touch ID, Face ID)
            </PasskeyFeature>
            <PasskeyFeature>
              <CheckCircle size={12} />
              Enhanced security and convenience
            </PasskeyFeature>
            <PasskeyFeature>
              <CheckCircle size={12} />
              Works across your devices
            </PasskeyFeature>
          </PasskeyInfo>
        </>
      ) : (
        <>
          <PasskeyButton 
            $variant="primary" 
            onClick={handleAuthenticate}
            disabled={isLoading}
          >
            <Fingerprint size={20} />
            {isLoading ? 'Authenticating...' : 'Authenticate with Passkey'}
          </PasskeyButton>

          <PasskeyButton 
            $variant="danger" 
            onClick={handleDisablePasskey}
            disabled={isLoading}
          >
            <AlertCircle size={20} />
            Disable Passkey
          </PasskeyButton>

          {storedPasskey && (
            <PasskeyInfo>
              <PasskeyInfoTitle>
                <Shield size={16} />
                Passkey Details
              </PasskeyInfoTitle>
              <PasskeyInfoText>
                Device: {storedPasskey.deviceType}<br />
                Created: {new Date(storedPasskey.createdAt).toLocaleDateString()}<br />
                Status: Active and secure
              </PasskeyInfoText>
            </PasskeyInfo>
          )}
        </>
      )}
    </PasskeyContainer>
  );
};

export default PasskeyAuth;
