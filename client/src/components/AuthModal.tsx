/**
 * Authentication Modal Component
 * Implements SRP-6a + Passkey authentication following Hoops Finance patterns
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { Shield, Eye, EyeOff, X } from 'lucide-react';
import { srpService } from '../services/srpService';
import { passkeyService } from '../services/passkeyService';
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
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
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

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 4px;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  color: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.6)'};
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
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

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-size: 1rem;
  transition: all 0.2s ease;
  
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
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PasskeyButton = styled(Button)`
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  
  &:hover {
    box-shadow: 0 8px 24px rgba(74, 222, 128, 0.3);
  }
`;

const InfoText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  text-align: center;
  margin: 0;
`;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authData: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSRPRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsLoading(true);
      toast('Creating secure account...');
      
      const result = await srpService.register(email, password);
      
      if (result.success) {
        toast.success('Account created successfully!');
        onSuccess({ type: 'srp', email, method: 'register' });
        onClose();
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('SRP registration error:', error);
      toast.error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSRPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsLoading(true);
      toast('Authenticating...');
      
      // Start SRP login
      const loginStart = await srpService.loginStart(email, password);
      
      // Complete SRP login
      const result = await srpService.loginFinish(
        loginStart.saltHex,
        loginStart.Bhex,
        loginStart.kdf,
        loginStart.nonce
      );
      
      if (result.success) {
        toast.success('Authentication successful!');
        onSuccess({ 
          type: 'srp', 
          email, 
          method: 'login',
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        });
        onClose();
      } else {
        toast.error(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('SRP login error:', error);
      toast.error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyAuth = async () => {
    try {
      setIsLoading(true);
      toast('Authenticating with passkey...');
      
      const passkeyData = await passkeyService.getStoredPasskeyData();
      if (!passkeyData) {
        toast.error('No passkey found. Please register first.');
        return;
      }

      const authResult = await passkeyService.authenticatePasskey(passkeyData.id);
      
      if (authResult) {
        toast.success('Passkey authentication successful!');
        onSuccess({ 
          type: 'passkey', 
          credentialId: authResult.credentialId,
          method: 'passkey'
        });
        onClose();
      }
    } catch (error) {
      console.error('Passkey authentication error:', error);
      toast.error(`Passkey authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>XYZ-Wallet Authentication</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <TabContainer>
          <Tab 
            $active={activeTab === 'register'} 
            onClick={() => setActiveTab('register')}
          >
            Register
          </Tab>
          <Tab 
            $active={activeTab === 'login'} 
            onClick={() => setActiveTab('login')}
          >
            Login
          </Tab>
        </TabContainer>

        {activeTab === 'register' ? (
          <Form onSubmit={handleSRPRegister}>
            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Password</Label>
              <PasswordInput>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </PasswordToggle>
              </PasswordInput>
            </FormGroup>

            <Button type="submit" disabled={isLoading}>
              <Shield size={20} />
              {isLoading ? 'Creating Account...' : 'Create Secure Account'}
            </Button>

            <InfoText>
              Your password never leaves your device. We use SRP-6a for zero-knowledge authentication.
            </InfoText>
          </Form>
        ) : (
          <Form onSubmit={handleSRPLogin}>
            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Password</Label>
              <PasswordInput>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </PasswordToggle>
              </PasswordInput>
            </FormGroup>

            <Button type="submit" disabled={isLoading}>
              <Shield size={20} />
              {isLoading ? 'Authenticating...' : 'Login Securely'}
            </Button>

            <PasskeyButton type="button" onClick={handlePasskeyAuth} disabled={isLoading}>
              <Shield size={20} />
              {isLoading ? 'Authenticating...' : 'Login with Passkey'}
            </PasskeyButton>

            <InfoText>
              Use your biometric authentication for the fastest and most secure login.
            </InfoText>
          </Form>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default AuthModal;
