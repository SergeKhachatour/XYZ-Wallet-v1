import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { X, MapPin, Clock, Wallet, Eye, EyeOff, Star, Send, DollarSign } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import mapboxgl from 'mapbox-gl';

const ProfileOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ProfileCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  color: white;
  position: relative;
  display: flex;
  flex-direction: column;
  
  @media (min-width: 768px) {
    max-width: 700px;
    width: 80%;
  }
  
  @media (max-width: 768px) {
    max-width: 95%;
    width: 95%;
    max-height: 95vh;
    padding: 1.5rem;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ProfileHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const ProfileAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
  margin: 0 auto 1rem;
  color: white;
`;

const ProfileName = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
`;

const ProfileAddress = styled.div`
  font-family: monospace;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  word-break: break-all;
`;

const ProfileSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-weight: 600;
  font-family: monospace;
`;

const StatusBadge = styled.div<{ $status: 'online' | 'offline' | 'away' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    switch (props.$status) {
      case 'online': return 'rgba(34, 197, 94, 0.2)';
      case 'away': return 'rgba(251, 191, 36, 0.2)';
      case 'offline': return 'rgba(107, 114, 128, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'online': return '#22c55e';
      case 'away': return '#fbbf24';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'online': return 'rgba(34, 197, 94, 0.3)';
      case 'away': return 'rgba(251, 191, 36, 0.3)';
      case 'offline': return 'rgba(107, 114, 128, 0.3)';
      default: return 'rgba(107, 114, 128, 0.3)';
    }
  }};
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PrimaryButton = styled(ActionButton)`
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  
  &:hover {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  }
`;

const MiniMap = styled.div`
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  margin: 1rem 0;
`;

const PaymentForm = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  font-size: 0.9rem;
  
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
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #4ade80;
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
  }
  
  option {
    background: #1a1a1a;
    color: white;
  }
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    publicKey: string;
    latitude: number;
    longitude: number;
    distance: string;
    lastSeen: string;
  } | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, user }) => {
  const [userStatus, setUserStatus] = useState<'online' | 'offline' | 'away'>('offline');
  const [isVisible, setIsVisible] = useState(false);
  const [lastActive, setLastActive] = useState<string>('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAsset, setPaymentAsset] = useState('XLM');
  const [paymentMemo, setPaymentMemo] = useState('');
  const miniMapRef = useRef<HTMLDivElement>(null);
  const miniMapInstance = useRef<mapboxgl.Map | null>(null);

  const { sendPayment, balances } = useWallet();

  useEffect(() => {
    if (user) {
      // Determine status based on last seen time
      const lastSeenDate = new Date(user.lastSeen);
      const now = new Date();
      const timeDiff = now.getTime() - lastSeenDate.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      if (minutesDiff < 5) {
        setUserStatus('online');
      } else if (minutesDiff < 60) {
        setUserStatus('away');
      } else {
        setUserStatus('offline');
      }

      setLastActive(user.lastSeen);
      setIsVisible(true); // Assume visible if they appear in nearby users
    }
  }, [user]);

  // Initialize mini-map
  useEffect(() => {
    if (isOpen && user && miniMapRef.current && !miniMapInstance.current) {
      const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2VyZ2UzNjl4MzMiLCJhIjoiY20zZHkzb2xoMDA0eTJxcHU4MTNoYjNlaCJ9.Xl6OxzF9td1IgTTeUp526w';
      
      if (mapboxToken) {
        mapboxgl.accessToken = mapboxToken;
        
        miniMapInstance.current = new mapboxgl.Map({
          container: miniMapRef.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [user.longitude, user.latitude],
          zoom: 12,
          interactive: false,
          attributionControl: false
        });

        // Add marker for user location
        new mapboxgl.Marker({ color: '#4ade80' })
          .setLngLat([user.longitude, user.latitude])
          .addTo(miniMapInstance.current);
      }
    }

    return () => {
      if (miniMapInstance.current) {
        miniMapInstance.current.remove();
        miniMapInstance.current = null;
      }
    };
  }, [isOpen, user]);

  if (!user) return null;

  // Generate avatar from public key
  const getAvatarText = (publicKey: string) => {
    return publicKey.slice(0, 2).toUpperCase();
  };

  // Generate a simple name from public key
  const getDisplayName = (publicKey: string) => {
    const shortKey = publicKey.slice(0, 8);
    return `User ${shortKey}`;
  };

  const handleSendPayment = async () => {
    if (!user || !paymentAmount) return;
    
    try {
      await sendPayment(user.publicKey, paymentAmount, paymentAsset, paymentMemo);
      setShowPaymentForm(false);
      setPaymentAmount('');
      setPaymentMemo('');
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const handleTogglePaymentForm = () => {
    setShowPaymentForm(!showPaymentForm);
  };

  return (
    <ProfileOverlay $isOpen={isOpen} onClick={onClose}>
      <ProfileCard onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>

        <ProfileHeader>
          <ProfileAvatar>
            {getAvatarText(user.publicKey)}
          </ProfileAvatar>
          <ProfileName>{getDisplayName(user.publicKey)}</ProfileName>
          <ProfileAddress>{user.publicKey}</ProfileAddress>
        </ProfileHeader>

        <ScrollableContent>
          <ProfileSection>
            <SectionTitle>
              <Star size={20} />
              Status
            </SectionTitle>
            <InfoItem>
              <InfoLabel>Status</InfoLabel>
              <StatusBadge $status={userStatus}>
                {userStatus === 'online' && '🟢 Online'}
                {userStatus === 'away' && '🟡 Away'}
                {userStatus === 'offline' && '🔴 Offline'}
              </StatusBadge>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Visibility</InfoLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isVisible ? <Eye size={16} color="#22c55e" /> : <EyeOff size={16} color="#6b7280" />}
                <span style={{ color: isVisible ? '#22c55e' : '#6b7280' }}>
                  {isVisible ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </InfoItem>
          </ProfileSection>

          <ProfileSection>
            <SectionTitle>
              <MapPin size={20} />
              Location
            </SectionTitle>
            <InfoItem>
              <InfoLabel>Distance</InfoLabel>
              <InfoValue>{user.distance} km away</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Last Active</InfoLabel>
              <InfoValue>
                {new Date(user.lastSeen).toLocaleString()}
              </InfoValue>
            </InfoItem>
          </ProfileSection>

          {/* Payment Section - Moved Higher */}
          <ProfileSection>
            <SectionTitle>
              <DollarSign size={20} />
              Send Payment
            </SectionTitle>
            
            {!showPaymentForm ? (
              <PrimaryButton onClick={handleTogglePaymentForm}>
                <Send size={16} />
                Send Payment
              </PrimaryButton>
            ) : (
              <PaymentForm>
                <InputGroup>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </InputGroup>
                
                <InputGroup>
                  <Label>Asset</Label>
                  <Select
                    value={paymentAsset}
                    onChange={(e) => setPaymentAsset(e.target.value)}
                  >
                    <option value="XLM">XLM</option>
                    <option value="USDC">USDC</option>
                  </Select>
                </InputGroup>
                
                <InputGroup>
                  <Label>Memo (Optional)</Label>
                  <Input
                    type="text"
                    placeholder="Payment memo"
                    value={paymentMemo}
                    onChange={(e) => setPaymentMemo(e.target.value)}
                  />
                </InputGroup>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <PrimaryButton onClick={handleSendPayment} disabled={!paymentAmount}>
                    <Send size={16} />
                    Send Payment
                  </PrimaryButton>
                  <ActionButton onClick={handleTogglePaymentForm}>
                    Cancel
                  </ActionButton>
                </div>
              </PaymentForm>
            )}
          </ProfileSection>

          <ProfileSection>
            <SectionTitle>
              <Clock size={20} />
              Activity
            </SectionTitle>
            <InfoItem>
              <InfoLabel>Last Seen</InfoLabel>
              <InfoValue>
                {new Date(user.lastSeen).toLocaleTimeString()}
              </InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Time Since Active</InfoLabel>
              <InfoValue>
                {(() => {
                  const lastSeenDate = new Date(user.lastSeen);
                  const now = new Date();
                  const timeDiff = now.getTime() - lastSeenDate.getTime();
                  const minutes = Math.floor(timeDiff / (1000 * 60));
                  const hours = Math.floor(minutes / 60);
                  const days = Math.floor(hours / 24);
                  
                  if (days > 0) return `${days}d ago`;
                  if (hours > 0) return `${hours}h ago`;
                  if (minutes > 0) return `${minutes}m ago`;
                  return 'Just now';
                })()}
              </InfoValue>
            </InfoItem>
          </ProfileSection>

          {/* Mini Map - Moved to End */}
          <ProfileSection>
            <SectionTitle>
              <MapPin size={20} />
              Location Map
            </SectionTitle>
            <MiniMap>
              <div 
                ref={miniMapRef} 
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              />
            </MiniMap>
          </ProfileSection>
        </ScrollableContent>
      </ProfileCard>
    </ProfileOverlay>
  );
};

export default UserProfile;
