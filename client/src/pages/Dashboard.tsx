import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Wallet, MapPin, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useLocation } from '../contexts/LocationContext';
import { useNavigate } from 'react-router-dom';
import PriceChart from '../components/PriceChart';
import MapboxMap from '../components/MapboxMap';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
  
  /* Make the map span 2 columns on larger screens */
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const MapGridItem = styled.div`
  grid-column: 1 / -1;
  
  @media (min-width: 768px) {
    grid-column: span 2;
  }
  
  @media (min-width: 1200px) {
    grid-column: span 2;
  }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  color: white;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
`;

const StatValue = styled.span`
  font-weight: 600;
  font-family: monospace;
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.8);
`;

const Dashboard: React.FC = () => {
  const { 
    isConnected, 
    balances, 
    transactions, 
    refreshBalance, 
    checkUSDCBalance,
    isLoading 
  } = useWallet();
  
  const { 
    isLocationEnabled, 
    isVisible, 
    currentLocation, 
    nearbyUsers,
    getNearbyUsers 
  } = useLocation();
  
  const navigate = useNavigate();
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);

  // Check server status
  const checkServerStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/health`, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setServerStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setServerStatus('offline');
    }
  };

  // Fetch available tokens
  const fetchAvailableTokens = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/soroswap/tokens`);
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        if (response.status === 429) {
          console.warn('Rate limited, skipping token fetch');
          return;
        }
        throw jsonError;
      }
      
      if (response.ok && data.length > 0) {
        const testnetTokens = data.find((network: any) => network.network === 'testnet');
        if (testnetTokens && testnetTokens.assets) {
          setAvailableTokens(testnetTokens.assets);
        }
      }
    } catch (error) {
      console.warn('Could not fetch available tokens:', error);
    }
  };

  useEffect(() => {
    // Check server status on mount
    checkServerStatus();
    
    // Fetch available tokens
    fetchAvailableTokens();
    
    // Check server status every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isConnected && serverStatus === 'online' && isLocationEnabled) {
      getNearbyUsers();
    }
  }, [isConnected, isLocationEnabled, serverStatus, getNearbyUsers]);

  if (!isConnected) {
    return (
      <EmptyState>
        <Wallet size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2>Welcome to XYZ Wallet</h2>
        <p>Connect or create a wallet to get started</p>
        <ActionButton onClick={() => navigate('/wallet')}>
          Go to Wallet
        </ActionButton>
      </EmptyState>
    );
  }

  const totalBalance = balances.reduce((sum, balance) => {
    // Only sum XLM balances for total
    if (balance.asset === 'XLM' || balance.assetType === 'native') {
      return sum + parseFloat(balance.balance || '0');
    }
    return sum;
  }, 0);

  return (
    <DashboardContainer>
      {/* Server Status */}
      {serverStatus !== 'online' && (
        <Card style={{ 
          background: serverStatus === 'offline' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)',
          border: serverStatus === 'offline' ? '1px solid rgba(220, 53, 69, 0.3)' : '1px solid rgba(255, 193, 7, 0.3)'
        }}>
          <CardHeader>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: serverStatus === 'offline' ? '#dc3545' : '#ffc107',
              marginRight: '0.5rem'
            }} />
            <CardTitle style={{ color: serverStatus === 'offline' ? '#dc3545' : '#ffc107' }}>
              Server {serverStatus === 'offline' ? 'Offline' : 'Checking...'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {serverStatus === 'offline' 
                ? 'The server is not running. Some features may not work properly. Please start the server using the start.bat file.'
                : 'Checking server connection...'
              }
            </div>
            <ActionButton 
              onClick={checkServerStatus} 
              style={{ marginTop: '1rem', background: 'rgba(255, 255, 255, 0.1)' }}
            >
              Retry Connection
            </ActionButton>
          </CardContent>
        </Card>
      )}

      {/* XLM Price Chart */}
      <PriceChart />

      {/* Global Map */}
      <MapGridItem>
        <MapboxMap />
      </MapGridItem>

      {/* Wallet Overview */}
      <Card>
        <CardHeader>
          <Wallet size={24} />
          <CardTitle>Wallet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <StatItem>
            <StatLabel>Total Balance</StatLabel>
            <StatValue>{totalBalance.toFixed(7)} XLM</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Assets</StatLabel>
            <StatValue>{balances.length}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Transactions</StatLabel>
            <StatValue>{transactions.length}</StatValue>
          </StatItem>
          <ActionButton onClick={() => navigate('/wallet')}>
            Manage Wallet
          </ActionButton>
        </CardContent>
      </Card>

      {/* Location Services */}
      <Card>
        <CardHeader>
          <MapPin size={24} />
          <CardTitle>Location Services</CardTitle>
        </CardHeader>
        <CardContent>
          <StatItem>
            <StatLabel>Status</StatLabel>
            <StatValue>{isLocationEnabled ? 'Enabled' : 'Disabled'}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Visibility</StatLabel>
            <StatValue>{isVisible ? 'Visible' : 'Hidden'}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Nearby Users</StatLabel>
            <StatValue>{nearbyUsers.length}</StatValue>
          </StatItem>
          {currentLocation && (
            <StatItem>
              <StatLabel>Current Location</StatLabel>
              <StatValue>
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </StatValue>
            </StatItem>
          )}
          <ActionButton onClick={() => navigate('/location')}>
            Manage Location
          </ActionButton>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <TrendingUp size={24} />
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            transactions.slice(0, 3).map((tx, index) => (
              <StatItem key={tx.id}>
                <StatLabel>
                  {tx.successful ? '✓' : '✗'} {new Date(tx.createdAt).toLocaleDateString()}
                </StatLabel>
                <StatValue>{tx.fee} XLM</StatValue>
              </StatItem>
            ))
          ) : (
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '1rem' }}>
              No transactions yet
            </div>
          )}
          <ActionButton onClick={() => navigate('/wallet')}>
            View All Transactions
          </ActionButton>
        </CardContent>
      </Card>

      {/* Token Balances */}
      <Card>
        <CardHeader>
          <Wallet size={24} />
          <CardTitle>Token Balances</CardTitle>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <ActionButton 
              onClick={refreshBalance} 
              disabled={isLoading}
              style={{ 
                padding: '0.5rem 1rem', 
                fontSize: '0.9rem',
                margin: 0
              }}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </ActionButton>
            <ActionButton 
              onClick={checkUSDCBalance} 
              disabled={isLoading}
              style={{ 
                padding: '0.5rem 1rem', 
                fontSize: '0.9rem',
                margin: 0,
                background: 'rgba(40, 167, 69, 0.8)'
              }}
            >
              Check USDC
            </ActionButton>
          </div>
        </CardHeader>
        <CardContent>
          {/* USDC Information */}
          <div style={{ 
            background: 'rgba(40, 167, 69, 0.1)', 
            border: '1px solid rgba(40, 167, 69, 0.3)', 
            borderRadius: '8px', 
            padding: '1rem', 
            marginBottom: '1rem',
            color: '#28a745',
            fontSize: '0.9rem'
          }}>
            <strong>💡 USDC Note:</strong> USDC on Stellar testnet is a contract-based asset. 
            If you've completed a swap and don't see USDC here, it may take a few minutes to appear. 
            Your successful swap transaction shows you received 9.6319705 USDC.
          </div>
          
          {balances.length > 0 ? (
            balances.map((balance, index) => {
              const balanceAmount = parseFloat(balance.balance || '0');
              // Use the assetCode field for cleaner asset name display
              const assetName = balance.assetCode || (balance.asset === 'XLM' || balance.assetType === 'native' ? 'XLM' : balance.asset);
              
              return (
                <StatItem key={index}>
                  <StatLabel>
                    {assetName}
                    {balance.assetIssuer && (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {balance.assetIssuer.slice(0, 8)}...{balance.assetIssuer.slice(-8)}
                      </div>
                    )}
                  </StatLabel>
                  <StatValue>
                    {balanceAmount > 0 ? balanceAmount.toFixed(7) : '0.0000000'}
                    {balanceAmount === 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                        (No balance)
                      </div>
                    )}
                  </StatValue>
                </StatItem>
              );
            })
          ) : (
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '1rem' }}>
              No token balances found. Try funding your account first.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Tokens for Swapping */}
      <Card>
        <CardHeader>
          <ArrowLeftRight size={24} />
          <CardTitle>Available for Swapping</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
            {availableTokens.length > 0 ? (
              availableTokens.slice(0, 6).map((token, index) => (
                <div 
                  key={token.contract} 
                  style={{ 
                    background: 'rgba(102, 126, 234, 0.1)', 
                    border: '1px solid rgba(102, 126, 234, 0.3)', 
                    borderRadius: '8px', 
                    padding: '0.75rem', 
                    textAlign: 'center' 
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{token.code}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {token.name}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                background: 'rgba(102, 126, 234, 0.1)', 
                border: '1px solid rgba(102, 126, 234, 0.3)', 
                borderRadius: '8px', 
                padding: '0.75rem', 
                textAlign: 'center',
                gridColumn: '1 / -1'
              }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading available tokens...</div>
              </div>
            )}
          </div>
          <ActionButton onClick={() => navigate('/swap')} style={{ marginTop: '1rem', width: '100%' }}>
            Start Swapping
          </ActionButton>
        </CardContent>
      </Card>

    </DashboardContainer>
  );
};

export default Dashboard;
