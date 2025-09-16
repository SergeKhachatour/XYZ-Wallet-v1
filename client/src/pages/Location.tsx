import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MapPin, Eye, EyeOff, Users, RefreshCw, Navigation } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { useWallet } from '../contexts/WalletContext';

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
    background-color: #667eea;
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
    enableLocation, 
    disableLocation, 
    updateLocation, 
    toggleVisibility, 
    getNearbyUsers,
    isLocationLoading 
  } = useLocation();
  
  const { isConnected } = useWallet();
  
  const [radius, setRadius] = useState(10);

  useEffect(() => {
    if (isLocationEnabled && isConnected) {
      getNearbyUsers(radius);
    }
  }, [isLocationEnabled, isConnected, radius, getNearbyUsers]);

  const handleToggleVisibility = async () => {
    await toggleVisibility(!isVisible);
  };

  const handleGetNearbyUsers = async () => {
    if (isLocationEnabled) {
      await getNearbyUsers(radius);
    }
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
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  color: 'white'
                }}
              >
                <option value={1}>1 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
              </select>
              <Button onClick={handleGetNearbyUsers} disabled={isLocationLoading}>
                <Users size={20} />
                Refresh
              </Button>
            </div>
          </SectionHeader>
          
          {nearbyUsers.length > 0 ? (
            <NearbyUsersList>
              {nearbyUsers.map((user, index) => (
                <NearbyUserItem key={index}>
                  <UserInfo>
                    <UserAddress>{user.publicKey}</UserAddress>
                    <UserDistance>{user.distance} km away</UserDistance>
                    <UserLastSeen>
                      Last seen: {new Date(user.lastSeen).toLocaleString()}
                    </UserLastSeen>
                  </UserInfo>
                  <div style={{ color: '#4ade80', fontSize: '0.8rem' }}>
                    Visible
                  </div>
                </NearbyUserItem>
              ))}
            </NearbyUsersList>
          ) : (
            <EmptyState>
              {isVisible ? 'No nearby users found within the selected radius' : 'Enable visibility to see nearby users'}
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
    </LocationContainer>
  );
};

export default Location;
