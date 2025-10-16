import React from 'react';
import styled from 'styled-components';
import { useLocation } from '../contexts/LocationContext';

export const GeoLinkStatus: React.FC = () => {
  const { geoLinkStatus } = useLocation();

  const getStatusColor = () => {
    switch (geoLinkStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (geoLinkStatus) {
      case 'connected': return '✅ GeoLink Connected';
      case 'connecting': return '🔄 Connecting to GeoLink...';
      case 'error': return '❌ GeoLink Connection Error';
      default: return '⚪ GeoLink Disconnected';
    }
  };

  return (
    <StatusContainer $backgroundColor={getStatusColor()}>
      <StatusText>{getStatusText()}</StatusText>
    </StatusContainer>
  );
};

const StatusContainer = styled.div<{ $backgroundColor: string }>`
  padding: 8px;
  border-radius: 4px;
  margin: 4px;
  background-color: ${props => props.$backgroundColor};
`;

const StatusText = styled.div`
  color: white;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
`;
