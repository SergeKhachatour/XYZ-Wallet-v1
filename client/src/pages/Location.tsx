import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MapPin, Eye, EyeOff, Users, RefreshCw, Navigation, User, Bug, Send } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { useWallet } from '../contexts/WalletContext';
import UserProfile from '../components/UserProfile';
import LocationDebugger from '../components/LocationDebugger';

const LocationContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const Button = styled.button`
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


const DangerButton = styled(Button)`
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  
  &:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  }
`;

const StatusCard = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatusItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
`;

const StatusValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const StatusLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const LocationInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
`;

const LocationRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const LocationLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
`;

const LocationValue = styled.span`
  font-family: monospace;
  font-weight: 600;
`;

const NearbyUsersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NearbyUserItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserAddress = styled.span`
  font-family: monospace;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`;

const UserDistance = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
`;

const UserLastSeen = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: #4a4a4a;
  }
  
  &:checked + span:before {
    transform: translateX(26px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
  
  &:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`;

const Location: React.FC = () => {
  const { 
    currentLocation, 
    isLocationEnabled, 
    isVisible, 
    locationHistory, 
    nearbyUsers,
    searchRadius,
    showAllUsers,
    enableLocation, 
    disableLocation, 
    updateLocation, 
    toggleVisibility, 
    getNearbyUsers,
    setSearchRadius,
    setShowAllUsers,
    isLocationLoading 
  } = useLocation();
  
  const { isConnected } = useWallet();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);

  useEffect(() => {
    if (isLocationEnabled && isConnected) {
      getNearbyUsers(searchRadius, showAllUsers);
    }
  }, [isLocationEnabled, isConnected, searchRadius, showAllUsers, getNearbyUsers]);

  const handleToggleVisibility = async () => {
    await toggleVisibility(!isVisible);
  };

  const handleGetNearbyUsers = async () => {
    if (isLocationEnabled) {
      await getNearbyUsers(searchRadius, showAllUsers);
    }
  };

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setIsProfileOpen(true);
  };

  const handleCloseProfile = () => {
    setIsProfileOpen(false);
    setSelectedUser(null);
  };

  if (!isConnected) {
    return (
      <EmptyState>
        <MapPin size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2>Connect Your Wallet</h2>
        <p>Please connect your wallet to use location services</p>
      </EmptyState>
    );
  }

  return (
    <LocationContainer>
      {/* Location Status */}
      <StatusCard>
        <StatusItem>
          <StatusValue style={{ color: isLocationEnabled ? '#4ade80' : '#f87171' }}>
            {isLocationEnabled ? 'Enabled' : 'Disabled'}
          </StatusValue>
          <StatusLabel>Location Services</StatusLabel>
        </StatusItem>
        
        <StatusItem>
          <StatusValue style={{ color: isVisible ? '#4ade80' : '#f87171' }}>
            {isVisible ? 'Visible' : 'Hidden'}
          </StatusValue>
          <StatusLabel>Visibility Status</StatusLabel>
        </StatusItem>
        
        <StatusItem>
          <StatusValue>{nearbyUsers.length}</StatusValue>
          <StatusLabel>Nearby Users</StatusLabel>
        </StatusItem>
        
        <StatusItem>
          <StatusValue>{locationHistory.length}</StatusValue>
          <StatusLabel>Location History</StatusLabel>
        </StatusItem>
      </StatusCard>

      {/* Location Controls */}
      <Section>
        <SectionHeader>
          <SectionTitle>Location Controls</SectionTitle>
          <Button onClick={() => setShowDebugger(!showDebugger)} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}>
            <Bug size={20} />
            {showDebugger ? 'Hide' : 'Show'} Debug
          </Button>
        </SectionHeader>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {!isLocationEnabled ? (
            <Button onClick={enableLocation} disabled={isLocationLoading}>
              <MapPin size={20} />
              Enable Location Services
            </Button>
          ) : (
            <>
              <Button onClick={updateLocation} disabled={isLocationLoading}>
                <RefreshCw size={20} />
                Update Location
              </Button>
              <DangerButton onClick={disableLocation}>
                <MapPin size={20} />
                Disable Location
              </DangerButton>
            </>
          )}
        </div>

        {isLocationEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <span>Make myself visible to nearby users:</span>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={isVisible}
                onChange={handleToggleVisibility}
                disabled={isLocationLoading}
              />
              <ToggleSlider />
            </ToggleSwitch>
            {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
          </div>
        )}
      </Section>

      {/* Current Location */}
      {currentLocation && (
        <Section>
          <SectionHeader>
            <SectionTitle>Current Location</SectionTitle>
            <Button onClick={updateLocation} disabled={isLocationLoading}>
              <Navigation size={20} />
              Update
            </Button>
          </SectionHeader>
          
          <LocationInfo>
            <LocationRow>
              <LocationLabel>Latitude</LocationLabel>
              <LocationValue>{currentLocation.latitude.toFixed(6)}</LocationValue>
            </LocationRow>
            <LocationRow>
              <LocationLabel>Longitude</LocationLabel>
              <LocationValue>{currentLocation.longitude.toFixed(6)}</LocationValue>
            </LocationRow>
            <LocationRow>
              <LocationLabel>Last Updated</LocationLabel>
              <LocationValue>
                {new Date(currentLocation.timestamp).toLocaleString()}
              </LocationValue>
            </LocationRow>
            <LocationRow>
              <LocationLabel>IP Address</LocationLabel>
              <LocationValue>{currentLocation.ipAddress || 'N/A'}</LocationValue>
            </LocationRow>
          </LocationInfo>
        </Section>
      )}

      {/* Nearby Users */}
      {isLocationEnabled && (
        <Section>
          <SectionHeader>
            <SectionTitle>Nearby Users</SectionTitle>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="showAllUsers"
                  checked={showAllUsers}
                  onChange={(e) => setShowAllUsers(e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                <label htmlFor="showAllUsers" style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                  Show All Users (Global)
                </label>
              </div>
              
              {!showAllUsers && (
                <select
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    color: 'white',
                    minWidth: '120px'
                  }}
                  className="location-select"
                >
                  <option value={1}>1 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                  <option value={250}>250 km</option>
                  <option value={500}>500 km</option>
                  <option value={1000}>1000 km</option>
                </select>
              )}
              
              <Button onClick={handleGetNearbyUsers} disabled={isLocationLoading}>
                <Users size={20} />
                {showAllUsers ? 'Show All' : 'Refresh'}
              </Button>
            </div>
          </SectionHeader>
          
          {nearbyUsers.length > 0 ? (
            <NearbyUsersList>
              {nearbyUsers.map((user, index) => (
                <NearbyUserItem key={index} onClick={() => handleUserClick(user)}>
                  <UserInfo>
                    <UserAddress>{user.publicKey.slice(0, 8)}...{user.publicKey.slice(-8)}</UserAddress>
                    <UserDistance>{user.distance} km away</UserDistance>
                    <UserLastSeen>
                      Last seen: {new Date(user.lastSeen).toLocaleString()}
                    </UserLastSeen>
                  </UserInfo>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserClick(user);
                      }}
                      style={{
                        background: 'rgba(74, 222, 128, 0.2)',
                        border: '1px solid #4ade80',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        color: '#4ade80',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(74, 222, 128, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)';
                      }}
                    >
                      <Send size={12} />
                      Send
                    </button>
                    <div style={{ color: '#4ade80', fontSize: '0.8rem' }}>
                      Visible
                    </div>
                    <User size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                  </div>
                </NearbyUserItem>
              ))}
            </NearbyUsersList>
          ) : (
            <EmptyState>
              {isVisible ? 
                (showAllUsers ? 'No users found globally' : `No nearby users found within ${searchRadius} km`) : 
                'Enable visibility to see nearby users'
              }
            </EmptyState>
          )}
        </Section>
      )}

      {/* Location History */}
      {locationHistory.length > 0 && (
        <Section>
          <SectionHeader>
            <SectionTitle>Location History</SectionTitle>
          </SectionHeader>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {locationHistory.slice(-10).reverse().map((location, index) => (
              <LocationInfo key={index} style={{ marginBottom: '1rem' }}>
                <LocationRow>
                  <LocationLabel>Coordinates</LocationLabel>
                  <LocationValue>
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </LocationValue>
                </LocationRow>
                <LocationRow>
                  <LocationLabel>Timestamp</LocationLabel>
                  <LocationValue>
                    {new Date(location.timestamp).toLocaleString()}
                  </LocationValue>
                </LocationRow>
              </LocationInfo>
            ))}
          </div>
        </Section>
      )}

      {/* Debugger */}
      {showDebugger && <LocationDebugger />}

      {/* User Profile Modal */}
      <UserProfile
        isOpen={isProfileOpen}
        onClose={handleCloseProfile}
        user={selectedUser}
      />
    </LocationContainer>
  );
};

export default Location;
