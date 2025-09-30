import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { X, QrCode, Send, User } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

interface MarkerProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    publicKey: string;
    distance: string;
    lastSeen: string;
    status: string;
  };
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
`;

const ProfileHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const ProfileTitle = styled.h2`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

const ProfileSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin: 0;
`;

const PublicKeyDisplay = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  word-break: break-all;
  font-family: monospace;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ActionButton = styled.button`
  flex: 1;
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border-color: rgba(74, 222, 128, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const UserInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
`;

const InfoLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
`;

const InfoValue = styled.span`
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
`;

const MarkerProfileOverlay: React.FC<MarkerProfileOverlayProps> = ({ isOpen, onClose, user }) => {
  const { sendPayment, balances, isLoading } = useWallet();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendPayment = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const success = await sendPayment(user.publicKey, amount, 'XLM', memo);
      
      if (success) {
        setSuccess('Payment sent successfully!');
        setAmount('');
        setMemo('');
        toast.success('Payment sent successfully!');
      } else {
        setError('Failed to send payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to send payment');
    }
  }, [user.publicKey, amount, memo, sendPayment]);

  const handleCopyPublicKey = () => {
    navigator.clipboard.writeText(user.publicKey);
    toast.success('Public key copied to clipboard');
  };

  const handleQRCode = () => {
    // Generate QR code for the user's public key
    const qrData = {
      type: 'stellar_address',
      address: user.publicKey,
      memo: memo || undefined
    };
    
    // For now, just copy the public key
    navigator.clipboard.writeText(user.publicKey);
    toast.success('Public key copied to clipboard');
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <OverlayCard onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>

        <ProfileHeader>
          <ProfileTitle>
            <User size={24} style={{ marginRight: '0.5rem' }} />
            Nearby User
          </ProfileTitle>
          <ProfileSubtitle>
            {user.distance} away • Last seen {user.lastSeen}
          </ProfileSubtitle>
        </ProfileHeader>

        <UserInfo>
          <InfoRow>
            <InfoLabel>Status</InfoLabel>
            <InfoValue>{user.status}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Distance</InfoLabel>
            <InfoValue>{user.distance}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Last Seen</InfoLabel>
            <InfoValue>{user.lastSeen}</InfoValue>
          </InfoRow>
        </UserInfo>

        <PublicKeyDisplay>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
            Public Key:
          </div>
          {user.publicKey}
        </PublicKeyDisplay>

        <ActionButtons>
          <ActionButton onClick={handleQRCode}>
            <QrCode size={18} />
            QR Code
          </ActionButton>
          <ActionButton onClick={() => setIsPaymentOpen(!isPaymentOpen)}>
            <Send size={18} />
            Send Payment
          </ActionButton>
        </ActionButtons>

        {isPaymentOpen && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontSize: '0.9rem' }}>
                Amount (XLM)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontSize: '0.9rem' }}>
                Memo (Optional)
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Payment memo"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            {error && (
              <div style={{ color: '#ff6b6b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ color: '#4ade80', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {success}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleSendPayment}
                disabled={isLoading || !amount}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: 'white',
                  fontWeight: '600',
                  cursor: isLoading || !amount ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !amount ? 0.5 : 1
                }}
              >
                {isLoading ? 'Sending...' : 'Send Payment'}
              </button>
              
              <button
                onClick={() => setIsPaymentOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </OverlayCard>
    </Overlay>
  );
};

export default MarkerProfileOverlay;
