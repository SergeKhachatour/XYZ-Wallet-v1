import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, MapPin, Clock, Wallet, Eye, EyeOff, MessageCircle, Star } from 'lucide-react';

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
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  color: white;
  position: relative;
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

  const handleSendMessage = () => {
    // TODO: Implement messaging system
    console.log('Send message to:', user.publicKey);
  };

  const handleViewLocation = () => {
    // TODO: Implement location viewing
    console.log('View location for:', user.publicKey);
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
            <InfoLabel>Coordinates</InfoLabel>
            <InfoValue>
              {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
            </InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Last Active</InfoLabel>
            <InfoValue>
              {new Date(user.lastSeen).toLocaleString()}
            </InfoValue>
          </InfoItem>
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

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <ActionButton onClick={handleSendMessage}>
            <MessageCircle size={16} />
            Send Message
          </ActionButton>
          <PrimaryButton onClick={handleViewLocation}>
            <MapPin size={16} />
            View Location
          </PrimaryButton>
        </div>
      </ProfileCard>
    </ProfileOverlay>
  );
};

export default UserProfile;
