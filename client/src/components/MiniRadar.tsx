import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Radar, Maximize2, ZoomIn, ZoomOut, RotateCcw, Users, Image } from 'lucide-react';

const MiniRadarContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  padding: 1rem;
  color: #FFFFFF;
  transition: transform 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  width: 100%;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.2);
  }
`;

const MiniRadarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const MiniRadarTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FullscreenButton = styled.button`
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #FFD700;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: scale(1.05);
  }
`;

const MiniRadarDisplay = styled.div<{ $zoom: number; $panX: number; $panY: number }>`
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(0, 255, 0, 0.1) 0%, transparent 70%);
  transform: scale(${props => props.$zoom}) translate(${props => props.$panX}px, ${props => props.$panY}px);
  transform-origin: center;
  transition: transform 0.1s ease-out;
`;

const MiniRadarSweep = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 50%;
  background: linear-gradient(to top, #00FF00, transparent);
  transform-origin: bottom center;
  animation: radarSweep 3s linear infinite;
  
  @keyframes radarSweep {
    0% { transform: translate(-50%, -100%) rotate(0deg); }
    100% { transform: translate(-50%, -100%) rotate(360deg); }
  }
`;

const MiniRadarCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: #00FF00;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 8px #00FF00;
`;

const MiniNFTRadarPoint = styled.div<{ $angle: number; $distance: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 2px solid #FF6B6B;
  transform: translate(-50%, -50%) rotate(${props => props.$angle}deg) translateY(-${props => props.$distance}px);
  box-shadow: 0 0 8px #FF6B6B;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  overflow: hidden;
  
  &:hover {
    transform: translate(-50%, -50%) rotate(${props => props.$angle}deg) translateY(-${props => props.$distance}px) scale(1.3);
    z-index: 20;
  }
`;

const MiniNFTImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
`;

const MiniRadarInfo = styled.div`
  margin-top: 1rem;
  text-align: center;
`;

const MiniRadarControls = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: center;
`;

const MiniControlButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #FFFFFF;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

const MiniRadarDisplayContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
`;

const NFTCount = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
`;

const NFTDistance = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
`;

const RadarTypeToggle = styled.div`
  display: flex;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.25rem;
`;

const RadarTypeButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(255, 215, 0, 0.2)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
  color: ${props => props.$active ? '#FFD700' : 'rgba(255, 255, 255, 0.7)'};
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  
  &:hover {
    background: ${props => props.$active ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
    transform: scale(1.05);
  }
`;

interface MiniRadarProps {
  nearbyNFTs: any[];
  nearbyUsers?: any[];
  onFullscreenClick: () => void;
  onNFTClick: (nft: any) => void;
  onUserClick?: (user: any) => void;
  userLatitude?: number;
  userLongitude?: number;
}

const MiniRadar: React.FC<MiniRadarProps> = ({ 
  nearbyNFTs, 
  nearbyUsers = [], 
  onFullscreenClick, 
  onNFTClick, 
  onUserClick,
  userLatitude, 
  userLongitude 
}) => {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [radarType, setRadarType] = useState<'nft' | 'wallet'>('nft');
  const radarRef = useRef<HTMLDivElement>(null);

  const calculateRadarPosition = (item: any) => {
    if (!userLatitude || !userLongitude) {
      // Fallback to simple positioning if no user location
      const maxDistance = 100; // meters
      const distance = Math.min(item.distance || 0, maxDistance);
      const radarDistance = (distance / maxDistance) * 50; // Scale to radar size
      const angle = Math.random() * 360;
      return { angle, distance: radarDistance };
    }
    
    // Calculate bearing from user to item (same logic as fullscreen radar)
    const lat1 = userLatitude * Math.PI / 180;
    const lat2 = item.latitude * Math.PI / 180;
    const deltaLng = (item.longitude - userLongitude) * Math.PI / 180;
    
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    const angle = (bearing + 360) % 360;
    
    // Calculate distance (normalized to mini radar display)
    const distance = Math.min(item.distance / 1000, 50); // Max 50px for mini radar display
    
    return { angle, distance };
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
  };

  // Get current data based on radar type
  const currentData = radarType === 'nft' ? nearbyNFTs : nearbyUsers;
  const closestItem = currentData.length > 0 ? currentData.reduce((closest, item) => 
    item.distance < closest.distance ? item : closest
  ) : null;

  // Update data when nearbyNFTs or nearbyUsers change
  useEffect(() => {
    // This ensures the radar updates when new data comes in
  }, [nearbyNFTs, nearbyUsers]);

  return (
    <MiniRadarContainer>
      <MiniRadarHeader>
        <MiniRadarTitle>
          <Radar size={16} />
          {radarType === 'nft' ? 'NFT Radar' : 'Wallet Radar'}
        </MiniRadarTitle>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RadarTypeToggle>
            <RadarTypeButton 
              $active={radarType === 'nft'} 
              onClick={() => setRadarType('nft')}
              title="Show NFT Radar"
            >
              <Image size={12} />
            </RadarTypeButton>
            <RadarTypeButton 
              $active={radarType === 'wallet'} 
              onClick={() => setRadarType('wallet')}
              title="Show Wallet Radar"
            >
              <Users size={12} />
            </RadarTypeButton>
          </RadarTypeToggle>
          <FullscreenButton onClick={onFullscreenClick} title="Open Fullscreen Radar">
            <Maximize2 size={12} />
            Full
          </FullscreenButton>
        </div>
      </MiniRadarHeader>
      
      <MiniRadarDisplayContainer
        ref={radarRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <MiniRadarDisplay $zoom={zoom} $panX={panX} $panY={panY}>
          <MiniRadarSweep />
          <MiniRadarCenter />
                 {currentData.slice(0, 3).map((item, index) => {
                   const { angle, distance } = calculateRadarPosition(item);
                   
                   if (radarType === 'nft') {
                     // NFT display logic
                     const imageUrl = item.server_url && item.ipfs_hash 
                       ? `${item.server_url}${item.ipfs_hash}` 
                       : item.image_url || 'https://via.placeholder.com/48x48?text=NFT';
                     return (
                       <MiniNFTRadarPoint
                         key={`nft-${index}`}
                         $angle={angle}
                         $distance={distance}
                         onClick={() => onNFTClick(item)}
                         title={`${item.collection_name || 'Unknown NFT'} - ${Math.round(item.distance)}m away`}
                       >
                         <MiniNFTImage 
                           src={imageUrl} 
                           alt={item.collection_name || 'NFT'}
                           onError={(e) => {
                             e.currentTarget.src = 'https://via.placeholder.com/48x48?text=NFT';
                           }}
                         />
                       </MiniNFTRadarPoint>
                     );
                   } else {
                     // Wallet display logic
                     return (
                       <MiniNFTRadarPoint
                         key={`wallet-${index}`}
                         $angle={angle}
                         $distance={distance}
                         onClick={() => onUserClick?.(item)}
                         title={`Wallet ${item.publicKey?.slice(0, 8)}... - ${Math.round(item.distance)}m away`}
                       >
                         <div style={{
                           width: '100%',
                           height: '100%',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           background: 'linear-gradient(45deg, #4ade80, #22c55e)',
                           borderRadius: '6px',
                           fontSize: '10px',
                           fontWeight: 'bold',
                           color: 'white'
                         }}>
                           💳
                         </div>
                       </MiniNFTRadarPoint>
                     );
                   }
                 })}
        </MiniRadarDisplay>
      </MiniRadarDisplayContainer>
      
      <MiniRadarControls>
        <MiniControlButton onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={12} />
        </MiniControlButton>
        <MiniControlButton onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={12} />
        </MiniControlButton>
        <MiniControlButton onClick={handleReset} title="Reset View">
          <RotateCcw size={12} />
        </MiniControlButton>
      </MiniRadarControls>
      
      <MiniRadarInfo>
        <NFTCount>
          {currentData.length} {radarType === 'nft' ? 'NFT' : 'Wallet'}{currentData.length !== 1 ? 's' : ''} nearby
        </NFTCount>
        {closestItem && (
          <NFTDistance>
            Closest: {Math.round(closestItem.distance)}m away
          </NFTDistance>
        )}
      </MiniRadarInfo>
    </MiniRadarContainer>
  );
};

export default MiniRadar;
