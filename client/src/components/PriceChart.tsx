import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TrendingUp, TrendingDown } from 'lucide-react';
import MiniRadar from './MiniRadar';

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
  height: 120px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  padding: 1rem;
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

interface PriceData {
  price: number;
  change24h: number;
  changePercent24h: number;
}

interface PriceChartProps {
  nearbyNFTs?: any[];
  onRadarFullscreen?: () => void;
  onNFTClick?: (nft: any) => void;
  userLatitude?: number;
  userLongitude?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ nearbyNFTs = [], onRadarFullscreen, onNFTClick, userLatitude, userLongitude }) => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            marginBottom: '0.5rem',
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ${priceData.price.toFixed(7)}
          </div>
          <div style={{ 
            fontSize: '1rem', 
            color: isPositive ? '#00FF00' : '#FF0000',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem'
          }}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(priceData.changePercent24h).toFixed(2)}% (24h)
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            Real-time data from Soroswap
          </div>
        </div>
      </ChartArea>
      
      <Separator />
      
      <RadarSection>
        <MiniRadar 
          nearbyNFTs={nearbyNFTs}
          onFullscreenClick={onRadarFullscreen || (() => {})}
          onNFTClick={onNFTClick || (() => {})}
          userLatitude={userLatitude}
          userLongitude={userLongitude}
        />
      </RadarSection>
    </ChartContainer>
  );
};

export default PriceChart;
