import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Wallet, MapPin, ArrowLeftRight, TrendingUp, Send, QrCode } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useLocation } from '../contexts/LocationContext';
import { useNavigate } from 'react-router-dom';
import PriceChart from '../components/PriceChart';
import MapboxMap from '../components/MapboxMap';
import UserProfile from '../components/UserProfile';
import ReceiveOverlay from '../components/ReceiveOverlay';
import SendOverlay from '../components/SendOverlay';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
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
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
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

const TopRightIcons = styled.div`
  position: fixed;
  top: 2rem;
  right: 2rem;
  display: flex;
  gap: 0.5rem;
  z-index: 100;
  
  @media (max-width: 768px) {
    top: 1rem;
    right: 5rem; /* Move further left to avoid hamburger menu */
    z-index: 9998; /* High z-index but below hamburger menu */
    pointer-events: auto; /* Ensure clickable */
  }
  
  @media (max-width: 480px) {
    right: 4.5rem; /* Adjust for smaller screens */
    gap: 0.25rem; /* Reduce gap on very small screens */
  }
`;

const IconButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: none;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
  }
`;

const ReceiveIcon = styled(IconButton)`
  &:hover {
    color: #4ade80;
    border-color: #4ade80;
  }
`;

const SendIcon = styled(IconButton)`
  &:hover {
    color: #f59e0b;
    border-color: #f59e0b;
  }
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
    searchRadius,
    showAllUsers,
    getNearbyUsers,
    setSearchRadius,
    setShowAllUsers
  } = useLocation();
  
  const navigate = useNavigate();
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setIsProfileOpen(true);
  };

  const handleCloseProfile = () => {
    setIsProfileOpen(false);
    setSelectedUser(null);
  };

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
      getNearbyUsers(searchRadius, showAllUsers);
    }
  }, [isConnected, isLocationEnabled, serverStatus, getNearbyUsers, searchRadius, showAllUsers]);

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
    <>
      {/* Top Right Icons */}
      {isConnected && (
        <TopRightIcons>
          <ReceiveIcon onClick={() => setIsReceiveOpen(true)} title="Receive XLM">
            <QrCode size={20} />
          </ReceiveIcon>
          <SendIcon onClick={() => setIsSendOpen(true)} title="Send Payment">
            <Send size={20} />
          </SendIcon>
        </TopRightIcons>
      )}

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
          
          {/* Enhanced Location Search Controls */}
          {isLocationEnabled && (
            <>
              <StatItem>
                <StatLabel>Search Mode</StatLabel>
                <StatValue>{showAllUsers ? 'Global' : `${searchRadius} km`}</StatValue>
              </StatItem>
              
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="dashboardShowAllUsers"
                    checked={showAllUsers}
                    onChange={(e) => setShowAllUsers(e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <label htmlFor="dashboardShowAllUsers" style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
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
                      fontSize: '0.9rem'
                    }}
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
                
                <ActionButton 
                  onClick={() => getNearbyUsers(searchRadius, showAllUsers)}
                  style={{ marginTop: '0.5rem', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                  {showAllUsers ? 'Show All Users' : `Search ${searchRadius} km`}
                </ActionButton>
              </div>
            </>
          )}
          
          <ActionButton onClick={() => navigate('/location')}>
            Manage Location
          </ActionButton>
        </CardContent>
      </Card>

      {/* Nearby Users */}
      {isLocationEnabled && (
        <Card>
          <CardHeader>
            <MapPin size={24} />
            <CardTitle>Nearby Users ({nearbyUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {nearbyUsers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {nearbyUsers.slice(0, 5).map((user, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleUserClick(user)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: '600', wordBreak: 'break-all' }}>
                        {user.publicKey.slice(0, 8)}...{user.publicKey.slice(-8)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {user.distance} km away
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {new Date(user.lastSeen).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {nearbyUsers.length > 5 && (
                  <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', padding: '0.5rem' }}>
                    +{nearbyUsers.length - 5} more users
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', padding: '2rem' }}>
                {showAllUsers ? 'No users found globally' : `No users found within ${searchRadius} km`}
              </div>
            )}
            <ActionButton onClick={() => navigate('/location')} style={{ marginTop: '1rem' }}>
              View All Users
            </ActionButton>
          </CardContent>
        </Card>
      )}

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
          {balances.length > 0 ? (
            <>
              {/* Show helpful note if USDC is present */}
              {balances.some(b => b.assetCode === 'USDC' || b.asset === 'USDC') && (
                <div style={{ 
                  background: 'rgba(40, 167, 69, 0.1)', 
                  border: '1px solid rgba(40, 167, 69, 0.3)', 
                  borderRadius: '8px', 
                  padding: '0.75rem', 
                  marginBottom: '1rem',
                  color: '#28a745',
                  fontSize: '0.85rem'
                }}>
                  <strong>💡 USDC Info:</strong> USDC on Stellar testnet is a contract-based asset. 
                  Balances may take a few minutes to update after transactions.
                </div>
              )}
              
              {balances.map((balance, index) => {
                const balanceAmount = parseFloat(balance.balance || '0');
                // Use the assetCode field for cleaner asset name display
                const assetName = balance.assetCode || (balance.asset === 'XLM' || balance.assetType === 'native' ? 'XLM' : balance.asset);
                const isUSDC = assetName === 'USDC';
                
                return (
                  <StatItem key={index}>
                    <StatLabel>
                      {assetName}
                      {isUSDC && (
                        <div style={{ fontSize: '0.75rem', color: '#28a745', fontWeight: '500' }}>
                          Contract Asset
                        </div>
                      )}
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
              })}
            </>
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
                    background: 'rgba(74, 74, 74, 0.2)', 
                    border: '1px solid rgba(74, 74, 74, 0.4)', 
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
                background: 'rgba(74, 74, 74, 0.2)', 
                border: '1px solid rgba(74, 74, 74, 0.4)', 
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

      {/* User Profile Modal */}
      <UserProfile
        isOpen={isProfileOpen}
        onClose={handleCloseProfile}
        user={selectedUser}
      />
      </DashboardContainer>

      {/* Receive Overlay */}
      <ReceiveOverlay
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
      />

      {/* Send Overlay */}
      <SendOverlay
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
      />
    </>
  );
};

export default Dashboard;
