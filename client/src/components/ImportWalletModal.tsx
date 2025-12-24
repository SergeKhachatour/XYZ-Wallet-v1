import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Key, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  color: white;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
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
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
`;

const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-size: 1rem;
  font-family: monospace;
  min-height: 100px;
  resize: vertical;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
`;

const PasswordInput = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const WarningBox = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const WarningText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  line-height: 1.5;
`;

interface ImportWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (secretKey: string) => Promise<boolean>;
}

const ImportWalletModal: React.FC<ImportWalletModalProps> = ({ isOpen, onClose, onImport }) => {
  const [secretKey, setSecretKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!secretKey.trim()) {
      toast.error('Please enter your secret key');
      return;
    }

    // Validate secret key format (Stellar secret keys start with 'S' and are 56 characters)
    const trimmedKey = secretKey.trim();
    
    if (!trimmedKey.startsWith('S') || trimmedKey.length !== 56) {
      toast.error('Invalid secret key format. Stellar secret keys start with "S" and are 56 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      const success = await onImport(trimmedKey);
      if (success) {
        setSecretKey('');
        onClose();
      }
    } catch (error) {
      console.error('Import wallet error:', error);
      toast.error(`Failed to import wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Key size={24} />
            Import Wallet
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <WarningBox>
          <AlertTriangle size={20} style={{ color: '#ffc107', flexShrink: 0, marginTop: '2px' }} />
          <WarningText>
            <strong>Security Warning:</strong> Never share your secret key with anyone. 
            Your secret key will be encrypted and stored securely on this device only.
          </WarningText>
        </WarningBox>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Secret Key</Label>
            <PasswordInput>
              <TextArea
                value={secretKey}
                onChange={(e) => {
                  setSecretKey(e.target.value);
                  // Auto-show when user starts typing
                  if (!showSecretKey && e.target.value.length > 0) {
                    setShowSecretKey(true);
                  }
                }}
                onPaste={(e) => {
                  // Allow default paste behavior, but show the key
                  setShowSecretKey(true);
                }}
                placeholder="Enter your Stellar secret key (starts with S...)"
                required
                style={{ 
                  paddingRight: '3rem',
                  ...(showSecretKey ? {} : {
                    WebkitTextSecurity: 'disc',
                    textSecurity: 'disc'
                  } as React.CSSProperties)
                }}
                autoComplete="off"
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
              >
                {showSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </PasswordToggle>
            </PasswordInput>
          </FormGroup>

          <Button type="submit" disabled={isLoading || !secretKey.trim()}>
            <Key size={20} />
            {isLoading ? 'Importing...' : 'Import Wallet'}
          </Button>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ImportWalletModal;

