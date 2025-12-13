import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';

interface SecretKeyBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  secretKey: string;
  publicKey: string;
}

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
  z-index: 10001;
  padding: 1rem;
  overflow-y: auto;
`;

const ModalCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    max-width: 95%;
    border-radius: 12px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  font-size: 1.5rem;
  line-height: 1;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
    transform: scale(1.1);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-between;
  margin-bottom: 1.5rem;
  
  h2 {
    color: #1a1a1a;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    
    @media (max-width: 768px) {
      font-size: 1.25rem;
    }
  }
`;

const WarningBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const WarningHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const WarningIcon = styled.div`
  flex-shrink: 0;
  margin-top: 0.125rem;
  
  svg {
    width: 18px;
    height: 18px;
    color: #dc2626;
  }
`;

const WarningContent = styled.div`
  flex: 1;
  
  h3 {
    color: #991b1b;
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }
  
  p {
    color: #7f1d1d;
    font-size: 0.875rem;
    margin: 0 0 0.5rem 0;
    
    strong {
      font-weight: 600;
    }
  }
  
  ul {
    color: #7f1d1d;
    font-size: 0.875rem;
    margin: 0.5rem 0 0 0;
    padding-left: 1.25rem;
    list-style-type: disc;
    
    li {
      margin: 0.25rem 0;
    }
  }
`;

const InfoBox = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const KeyDisplay = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0.75rem;
  word-break: break-all;
  color: #1f2937;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
  
  @media (max-width: 768px) {
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: #f3f4f6;
  color: #374151;
  
  &:hover:not(:disabled) {
    background: #e5e7eb;
  }
`;

const ConfirmButton = styled(Button)`
  background: #2563eb;
  color: white;
  
  &:hover:not(:disabled) {
    background: #1d4ed8;
  }
  
  &:disabled {
    background: #9ca3af;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  
  input[type="checkbox"] {
    margin-top: 0.125rem;
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }
  
  span {
    color: #374151;
    font-size: 0.875rem;
    line-height: 1.5;
  }
`;

const SecretKeyBackupModal: React.FC<SecretKeyBackupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  secretKey,
  publicKey
}) => {
  const [hasReadWarning, setHasReadWarning] = useState(false);
  const [hasConfirmedBackup, setHasConfirmedBackup] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copyCount, setCopyCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setHasReadWarning(false);
      setHasConfirmedBackup(false);
      setShowSecretKey(false);
      setCopyCount(0);
    }
  }, [isOpen]);

  const handleCopySecretKey = async () => {
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopyCount(prev => prev + 1);
      toast.success('Secret key copied to clipboard');
    } catch (error) {
      console.error('Failed to copy secret key:', error);
      toast.error('Failed to copy secret key');
    }
  };

  const handleConfirm = () => {
    if (!hasReadWarning || !hasConfirmedBackup) {
      toast.error('Please read the warning and confirm you have backed up your secret key');
      return;
    }
    onConfirm();
  };

  if (!isOpen) return null;

  const modalContent = (
    <Overlay
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose} aria-label="Close">
          ×
        </CloseButton>

        <Header>
          <h2>🔐 Backup Your Secret Key</h2>
        </Header>

        <WarningBox>
          <WarningHeader>
            <WarningIcon>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </WarningIcon>
            <WarningContent>
              <h3>Critical Security Warning</h3>
              <p>
                <strong>This is your only chance to see your secret key in plaintext.</strong>
              </p>
              <ul>
                <li>Write down your secret key and store it in a secure location</li>
                <li>Never share your secret key with anyone</li>
                <li>If you lose this key, you will lose access to your wallet forever</li>
                <li>After confirming, the secret key will be encrypted and never shown again</li>
              </ul>
            </WarningContent>
          </WarningHeader>
        </WarningBox>

        <InfoBox>
          <Label>Your Public Key (Safe to Share)</Label>
          <KeyDisplay>{publicKey}</KeyDisplay>
        </InfoBox>

        <InfoBox>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <Label style={{ margin: 0 }}>Your Secret Key (Keep Private!)</Label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowSecretKey(!showSecretKey)}
                style={{
                  fontSize: '0.875rem',
                  color: '#2563eb',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem'
                }}
              >
                {showSecretKey ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={handleCopySecretKey}
                style={{
                  fontSize: '0.875rem',
                  color: '#2563eb',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem'
                }}
              >
                Copy
              </button>
            </div>
          </div>
          <KeyDisplay>{showSecretKey ? secretKey : '•'.repeat(56)}</KeyDisplay>
          {copyCount > 0 && (
            <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.5rem', marginBottom: 0 }}>
              Copied {copyCount} time{copyCount !== 1 ? 's' : ''}
            </p>
          )}
        </InfoBox>

        <CheckboxGroup>
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={hasReadWarning}
              onChange={(e) => setHasReadWarning(e.target.checked)}
            />
            <span>I have read and understand the security warning above</span>
          </CheckboxLabel>

          <CheckboxLabel>
            <input
              type="checkbox"
              checked={hasConfirmedBackup}
              onChange={(e) => setHasConfirmedBackup(e.target.checked)}
            />
            <span>I have securely backed up my secret key and understand I will not see it again</span>
          </CheckboxLabel>
        </CheckboxGroup>

        <ButtonGroup>
          <CancelButton onClick={onClose}>
            Cancel
          </CancelButton>
          <ConfirmButton
            onClick={handleConfirm}
            disabled={!hasReadWarning || !hasConfirmedBackup}
          >
            I Have Backed Up My Key
          </ConfirmButton>
        </ButtonGroup>
      </ModalCard>
    </Overlay>
  );

  // Render modal using portal to ensure it's at the root level
  return createPortal(modalContent, document.body);
};

export default SecretKeyBackupModal;
