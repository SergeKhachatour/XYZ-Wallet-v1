import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Bug, RefreshCw, Eye, EyeOff, MapPin, Users, AlertCircle } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { useWallet } from '../contexts/WalletContext';

const DebuggerContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  color: white;
`;

const DebuggerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #4ade80;
`;

const DebugSection = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid #4ade80;
`;

const DebugItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const DebugLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
`;

const DebugValue = styled.span<{ $status?: 'success' | 'error' | 'warning' | 'info' }>`
  color: ${props => {
    if (props.$status === 'success') return '#22c55e';
    if (props.$status === 'error') return '#ef4444';
    if (props.$status === 'warning') return '#f59e0b';
    if (props.$status === 'info') return '#3b82f6';
    return 'white';
  }};
  font-weight: 500;
`;

const ActionButton = styled.button`
  background: rgba(74, 222, 128, 0.2);
  border: 1px solid #4ade80;
  color: #4ade80;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(74, 222, 128, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusIndicator = styled.div<{ $status: 'success' | 'error' | 'warning' | 'info' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    if (props.$status === 'success') return '#22c55e';
    if (props.$status === 'error') return '#ef4444';
    if (props.$status === 'warning') return '#f59e0b';
    if (props.$status === 'info') return '#3b82f6';
    return '#6b7280';
  }};
  margin-right: 0.5rem;
`;

const LocationDebugger: React.FC = () => {
  const [debugData, setDebugData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { 
    currentLocation, 
    isLocationEnabled, 
    isVisible, 
    nearbyUsers,
    updateLocation,
    toggleVisibility,
    getNearbyUsers
  } = useLocation();
  
  const { isConnected, publicKey } = useWallet();

  const clearRateLimits = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/location/debug/clear-rate-limits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      if (result.success) {
        // Re-run diagnostics after clearing rate limits
        await runDiagnostics();
      }
    } catch (error) {
      console.error('Failed to clear rate limits:', error);
    }
  };

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      // Test backend connection
      const healthResponse = await fetch(`${backendUrl}/health`);
      const healthData = await healthResponse.ok ? await healthResponse.json() : null;
      
      // Test location submission
      let locationSubmissionTest = null;
      if (currentLocation) {
        try {
          const submitResponse = await fetch(`${backendUrl}/api/location/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              publicKey,
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              timestamp: currentLocation.timestamp,
              ipAddress: 'debug-test'
            })
          });
          locationSubmissionTest = await submitResponse.json();
        } catch (error) {
          locationSubmissionTest = { error: 'Failed to submit location' };
        }
      }
      
      // Test visibility status
      let visibilityStatus = null;
      if (publicKey) {
        try {
          const visibilityResponse = await fetch(`${backendUrl}/api/location/visibility/${publicKey}`);
          visibilityStatus = await visibilityResponse.json();
        } catch (error) {
          visibilityStatus = { error: 'Failed to get visibility status' };
        }
      }
      
      // Test nearby users
      let nearbyUsersTest = null;
      if (publicKey) {
        try {
          const nearbyResponse = await fetch(`${backendUrl}/api/location/nearby/${publicKey}?showAll=true`);
          nearbyUsersTest = await nearbyResponse.json();
        } catch (error) {
          nearbyUsersTest = { error: 'Failed to get nearby users' };
        }
      }
      
      setDebugData({
        timestamp: new Date().toISOString(),
        backendUrl,
        health: healthData,
        locationSubmission: locationSubmissionTest,
        visibility: visibilityStatus,
        nearbyUsers: nearbyUsersTest,
        clientState: {
          isConnected,
          publicKey,
          currentLocation,
          isLocationEnabled,
          isVisible,
          nearbyUsersCount: nearbyUsers.length
        }
      });
    } catch (error) {
      console.error('Diagnostics failed:', error);
      setDebugData({ error: 'Failed to run diagnostics' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = (value: any, errorKey = 'error'): 'success' | 'error' | 'warning' => {
    if (!value) return 'error';
    if (value[errorKey]) return 'error';
    if (typeof value === 'object' && Object.keys(value).length === 0) return 'warning';
    return 'success';
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <DebuggerContainer>
      <DebuggerHeader>
        <Bug size={20} />
        Location Services Debugger
        <ActionButton onClick={runDiagnostics} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Running...' : 'Refresh'}
        </ActionButton>
      </DebuggerHeader>

      {debugData && (
        <>
          <DebugSection>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4ade80' }}>Client State</h4>
            <DebugItem>
              <DebugLabel>Wallet Connected</DebugLabel>
              <DebugValue $status={isConnected ? 'success' : 'error'}>
                <StatusIndicator $status={isConnected ? 'success' : 'error'} />
                {isConnected ? 'Yes' : 'No'}
              </DebugValue>
            </DebugItem>
            <DebugItem>
              <DebugLabel>Public Key</DebugLabel>
              <DebugValue $status={publicKey ? 'success' : 'error'}>
                {publicKey ? `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}` : 'Not set'}
              </DebugValue>
            </DebugItem>
            <DebugItem>
              <DebugLabel>Location Enabled</DebugLabel>
              <DebugValue $status={isLocationEnabled ? 'success' : 'error'}>
                <StatusIndicator $status={isLocationEnabled ? 'success' : 'error'} />
                {isLocationEnabled ? 'Yes' : 'No'}
              </DebugValue>
            </DebugItem>
            <DebugItem>
              <DebugLabel>Visibility</DebugLabel>
              <DebugValue $status={isVisible ? 'success' : 'warning'}>
                <StatusIndicator $status={isVisible ? 'success' : 'warning'} />
                {isVisible ? 'Visible' : 'Hidden'}
              </DebugValue>
            </DebugItem>
            <DebugItem>
              <DebugLabel>Current Location</DebugLabel>
              <DebugValue $status={currentLocation ? 'success' : 'error'}>
                {currentLocation 
                  ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                  : 'Not available'
                }
              </DebugValue>
            </DebugItem>
            <DebugItem>
              <DebugLabel>Nearby Users Found</DebugLabel>
              <DebugValue $status={nearbyUsers.length > 0 ? 'success' : 'warning'}>
                {nearbyUsers.length} users
              </DebugValue>
            </DebugItem>
          </DebugSection>

          <DebugSection>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4ade80' }}>Backend Connection</h4>
            <DebugItem>
              <DebugLabel>Backend URL</DebugLabel>
              <DebugValue $status="info">{debugData.backendUrl}</DebugValue>
            </DebugItem>
            <DebugItem>
              <DebugLabel>Health Check</DebugLabel>
              <DebugValue $status={getStatus(debugData.health)}>
                <StatusIndicator $status={getStatus(debugData.health)} />
                {debugData.health ? 'Connected' : 'Failed'}
              </DebugValue>
            </DebugItem>
          </DebugSection>

          <DebugSection>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4ade80' }}>Location Submission</h4>
            <DebugItem>
              <DebugLabel>Last Submission</DebugLabel>
              <DebugValue $status={getStatus(debugData.locationSubmission)}>
                {debugData.locationSubmission?.success ? 'Success' : 'Failed'}
              </DebugValue>
            </DebugItem>
            {debugData.locationSubmission?.error && (
              <DebugItem>
                <DebugLabel>Error</DebugLabel>
                <DebugValue $status="error">{debugData.locationSubmission.error}</DebugValue>
              </DebugItem>
            )}
          </DebugSection>

          <DebugSection>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4ade80' }}>Visibility Status</h4>
            <DebugItem>
              <DebugLabel>Server Visibility</DebugLabel>
              <DebugValue $status={debugData.visibility?.isVisible ? 'success' : 'warning'}>
                <StatusIndicator $status={debugData.visibility?.isVisible ? 'success' : 'warning'} />
                {debugData.visibility?.isVisible ? 'Visible' : 'Hidden'}
              </DebugValue>
            </DebugItem>
          </DebugSection>

          <DebugSection>
            <h4 style={{ margin: '0 0 1rem 0', color: '#4ade80' }}>Nearby Users Test</h4>
            <DebugItem>
              <DebugLabel>Global Search</DebugLabel>
              <DebugValue $status={debugData.nearbyUsers?.nearbyUsers?.length > 0 ? 'success' : 'warning'}>
                {debugData.nearbyUsers?.nearbyUsers?.length || 0} users found
              </DebugValue>
            </DebugItem>
            {debugData.nearbyUsers?.nearbyUsers?.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                {debugData.nearbyUsers.nearbyUsers.map((user: any, index: number) => (
                  <div key={index} style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {user.publicKey.slice(0, 8)}...{user.publicKey.slice(-8)} - {user.distance}km
                  </div>
                ))}
              </div>
            )}
          </DebugSection>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <ActionButton onClick={updateLocation}>
              <MapPin size={16} />
              Update Location
            </ActionButton>
            <ActionButton onClick={() => toggleVisibility(!isVisible)}>
              {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              {isVisible ? 'Hide' : 'Show'} Visibility
            </ActionButton>
            <ActionButton onClick={() => getNearbyUsers(10, true)}>
              <Users size={16} />
              Search All Users
            </ActionButton>
            <ActionButton onClick={clearRateLimits} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}>
              <AlertCircle size={16} />
              Clear Rate Limits
            </ActionButton>
          </div>
        </>
      )}
    </DebuggerContainer>
  );
};

export default LocationDebugger;
