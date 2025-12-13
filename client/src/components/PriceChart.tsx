import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronUp, Radar } from 'lucide-react';
import MiniRadar from './MiniRadar';
import { useWallet } from '../contexts/WalletContext';

const ChartContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  padding: 1.5rem;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ChartTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PriceInfo = styled.div`
  text-align: right;
`;

const CurrentPrice = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  font-family: monospace;
  color: #FFD700;
`;

const PriceChange = styled.div<{ $positive: boolean }>`
  font-size: 0.9rem;
  color: ${props => props.$positive ? '#00FF00' : '#FF0000'};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
`;

const ChartArea = styled.div`
  min-height: 200px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  border: none;
`;

const Separator = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 1rem 0;
`;

const RadarSection = styled.div`
  margin-top: 1rem;
`;

const RadarSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const RadarSectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`;

const RadarToggleButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  transition: all 0.2s ease;
  
  &:hover {
    color: rgba(255, 255, 255, 1);
    transform: scale(1.1);
  }
`;

const RadarContent = styled.div<{ $isExpanded: boolean }>`
  max-height: ${props => props.$isExpanded ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  opacity: ${props => props.$isExpanded ? '1' : '0'};
  transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
`;

const MinimizedRadarPreview = styled.div`
  padding: 0.5rem 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
`;

interface PriceData {
  price: number;
  change24h: number;
  changePercent24h: number;
}

interface PriceChartProps {
  nearbyNFTs?: any[];
  nearbyUsers?: any[];
  onRadarFullscreen?: () => void;
  onNFTClick?: (nft: any) => void;
  onUserClick?: (user: any) => void;
  userLatitude?: number;
  userLongitude?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ nearbyNFTs = [], nearbyUsers = [], onRadarFullscreen, onNFTClick, onUserClick, userLatitude, userLongitude }) => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRadarExpanded, setIsRadarExpanded] = useState(false);
  const { contractBalance, userStake, getContractBalance, isConnected } = useWallet();

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Using Soroswap API for XLM price (using mainnet for real price data)
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/soroswap/price?network=mainnet&asset=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`);
        
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          // Handle non-JSON responses (like "Too many requests" text)
          if (response.status === 429) {
            console.warn('Rate limited, using demo data');
            setPriceData({
              price: 0.125,
              change24h: 0.001,
              changePercent24h: 0.8
            });
            return;
          }
          throw new Error('Invalid response format from server');
        }
        
        if (response.ok && data.price) {
          setPriceData({
            price: parseFloat(data.price),
            change24h: data.change24h || 0,
            changePercent24h: data.changePercent24h || 0
          });
        } else if (response.status === 429) {
          // Rate limited - use demo data
          console.warn('Rate limited, using demo data');
          setPriceData({
            price: 0.125,
            change24h: 0.001,
            changePercent24h: 0.8
          });
        } else {
          console.error('Price API error:', data);
          throw new Error('Price data not available from Soroswap');
        }
      } catch (err) {
        console.error('Error fetching price data:', err);
        setError('Failed to load price data from Soroswap');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceData();
    
    // Refresh price every 15 minutes to avoid rate limiting
    const interval = setInterval(fetchPriceData, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch contract balance when component mounts and wallet is connected
  useEffect(() => {
    if (isConnected) {
      getContractBalance().catch(err => {
        console.error('Error fetching contract balance:', err);
      });
    }
  }, [isConnected, getContractBalance]);

  if (isLoading) {
    return (
      <ChartContainer>
        <ChartHeader>
          <ChartTitle>
            <TrendingUp size={20} />
            XLM Price
          </ChartTitle>
        </ChartHeader>
        <ChartArea>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Loading...</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              Fetching latest price data
            </div>
          </div>
        </ChartArea>
      </ChartContainer>
    );
  }

  if (error || !priceData) {
    return (
      <ChartContainer>
        <ChartHeader>
          <ChartTitle>
            <TrendingUp size={20} />
            XLM Price
          </ChartTitle>
        </ChartHeader>
        <ChartArea>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#FF0000' }}>
              {error || 'Price data unavailable'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              Unable to fetch price data
            </div>
          </div>
        </ChartArea>
      </ChartContainer>
    );
  }

  const isPositive = priceData.changePercent24h >= 0;

  return (
    <ChartContainer>
      <ChartHeader>
        <ChartTitle>
          <TrendingUp size={20} />
          XLM Price
        </ChartTitle>
        <PriceInfo>
          <CurrentPrice>${priceData.price.toFixed(7)}</CurrentPrice>
          <PriceChange $positive={isPositive}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(priceData.changePercent24h).toFixed(2)}% (24h)
          </PriceChange>
        </PriceInfo>
      </ChartHeader>
      <ChartArea>
        <div style={{ textAlign: 'center', width: '100%' }}>
          {isConnected && contractBalance !== null && (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              width: '100%'
            }}>
              {/* User's Personal Stake */}
              {userStake !== null && (
                <div style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '0.5rem'
                  }}>
                    <Wallet size={14} />
                    <span>Your Stake:</span>
                  </div>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600',
                    fontFamily: 'monospace',
                    color: '#60a5fa'
                  }}>
                    {parseFloat(userStake).toFixed(7)} XLM
                  </div>
                </div>
              )}

              {/* Total Vault Balance */}
              <div style={{ 
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '0.5rem'
                }}>
                  <Wallet size={14} />
                  <span>Total Vault Balance:</span>
                </div>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  color: '#10b981'
                }}>
                  {parseFloat(contractBalance).toFixed(7)} XLM
                </div>
                <div style={{ 
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginTop: '0.25rem'
                }}>
                  Sum of all deposits from all users
                </div>
              </div>
            </div>
          )}
        </div>
      </ChartArea>
      
      <Separator />
      
      <RadarSection>
        <RadarSectionHeader onClick={() => setIsRadarExpanded(!isRadarExpanded)}>
          <RadarSectionTitle>
            <Radar size={16} />
            Wallet Radar
          </RadarSectionTitle>
          <RadarToggleButton onClick={(e) => { e.stopPropagation(); setIsRadarExpanded(!isRadarExpanded); }}>
            {isRadarExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </RadarToggleButton>
        </RadarSectionHeader>
        
        {!isRadarExpanded && (
          <MinimizedRadarPreview>
            {nearbyNFTs.length + (nearbyUsers?.length || 0)} items nearby • Click to expand
          </MinimizedRadarPreview>
        )}
        
        <RadarContent $isExpanded={isRadarExpanded}>
          <MiniRadar 
            nearbyNFTs={nearbyNFTs}
            nearbyUsers={nearbyUsers}
            onFullscreenClick={onRadarFullscreen || (() => {})}
            onNFTClick={onNFTClick || (() => {})}
            onUserClick={onUserClick}
            userLatitude={userLatitude}
            userLongitude={userLongitude}
          />
        </RadarContent>
      </RadarSection>
    </ChartContainer>
  );
};

export default PriceChart;
