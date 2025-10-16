import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styled from 'styled-components';
import { useLocation } from '../contexts/LocationContext';
import { useWallet } from '../contexts/WalletContext';
import { Maximize2, Minimize2, User } from 'lucide-react';
import MarkerProfileOverlay from './MarkerProfileOverlay';
import { NFTCollectionOverlay } from './NFTCollectionOverlay';
import { GeoLinkStatus } from './GeoLinkStatus';

const MapContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  padding: 1.5rem;
  color: #FFFFFF;
  height: 500px;
  position: relative;
  overflow: hidden;
                      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  
  @media (max-width: 768px) {
    height: 700px;
    padding: 1rem;
  }
  
  @media (max-width: 480px) {
    height: 650px;
    padding: 0.75rem;
  }
`;

const MapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  z-index: 10;
  position: relative;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

const MapTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    
    /* Hide "Global Map" text on very small screens, keep only icon */
    @media (max-width: 480px) {
      span {
        display: none;
      }
    }
  }
`;

const ViewControls = styled.div`
  display: flex;
  gap: 0.5rem;
  z-index: 10;
  position: relative;
  flex-wrap: wrap;
  align-items: center;
  
  @media (max-width: 768px) {
    gap: 0.25rem;
  }
`;

const LocationButton = styled.button`
  background: rgba(255, 215, 0, 0.2);
  border: none;
  color: #FFD700;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(255, 215, 0, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.7rem;
  }
`;

const ViewButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.1)'};
  border: none;
  color: #FFFFFF;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(255, 215, 0, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.7rem;
  }
`;

const StyleSelect = styled.select`
  background: rgba(255, 215, 0, 0.1);
  border: none;
  color: #FFFFFF;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
  }
  
  option {
    background: #000000;
    color: #FFFFFF;
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.7rem;
  }
`;

const FullscreenButton = styled.button`
  background: rgba(255, 215, 0, 0.1);
  border: none;
  color: #FFFFFF;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem;
    font-size: 0.7rem;
  }
`;

const FullscreenOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  flex-direction: column;
  padding: 1rem;
`;

const FullscreenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  color: white;
`;

const FullscreenTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FullscreenControls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const FullscreenMapWrapper = styled.div`
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: rgba(255, 215, 0, 0.1);
  border: none;
`;

const CloseButton = styled.button`
  background: rgba(255, 215, 0, 0.1);
  border: none;
  color: #FFFFFF;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
  }
`;

const MapWrapper = styled.div`
  height: calc(100% - 80px);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  
  @media (max-width: 768px) {
    height: calc(100% - 100px);
  }
  
  @media (max-width: 480px) {
    height: calc(100% - 90px);
  }
`;

const LocationInfo = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 0.75rem;
  border-radius: 8px;
  color: white;
  font-size: 0.8rem;
  max-width: 250px;
  z-index: 10;
  
  @media (max-width: 768px) {
    bottom: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
    max-width: none;
    font-size: 0.7rem;
  }
`;


type ViewType = 'globe' | 'flat';

type MapStyle = 'satellite' | 'streets' | 'outdoors' | 'light' | 'dark' | 'satellite-streets';

const mapStyles: Record<MapStyle, string> = {
  'satellite': 'mapbox://styles/mapbox/satellite-v9',
  'streets': 'mapbox://styles/mapbox/streets-v12',
  'outdoors': 'mapbox://styles/mapbox/outdoors-v12',
  'light': 'mapbox://styles/mapbox/light-v11',
  'dark': 'mapbox://styles/mapbox/dark-v11',
  'satellite-streets': 'mapbox://styles/mapbox/satellite-streets-v12'
};

// 3D Navigation styles for zoomed-in view
const map3DStyles: Record<MapStyle, string> = {
  'satellite': 'mapbox://styles/mapbox/satellite-v9',
  'streets': 'mapbox://styles/mapbox/streets-v12',
  'outdoors': 'mapbox://styles/mapbox/outdoors-v12',
  'light': 'mapbox://styles/mapbox/light-v11',
  'dark': 'mapbox://styles/mapbox/dark-v11',
  'satellite-streets': 'mapbox://styles/mapbox/satellite-streets-v12'
};

interface MapboxMapProps {
  onFullscreenChange?: (isFullscreen: boolean) => void;
  selectedNFTForZoom?: any;
  isFullscreen?: boolean;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ onFullscreenChange, selectedNFTForZoom, isFullscreen: externalIsFullscreen }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const fullscreenMapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const fullscreenMap = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const fullscreenMarker = useRef<mapboxgl.Marker | null>(null);
  const nearbyMarkers = useRef<mapboxgl.Marker[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('globe');
  const [currentStyle, setCurrentStyle] = useState<MapStyle>('satellite-streets');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [isFullscreenMapInitialized, setIsFullscreenMapInitialized] = useState(false);
  const [selectedMarkerUser, setSelectedMarkerUser] = useState<any>(null);
  const [isMarkerProfileOpen, setIsMarkerProfileOpen] = useState(false);
  const [is3DEnabled, setIs3DEnabled] = useState(false);
  const [isFullscreen3DEnabled, setIsFullscreen3DEnabled] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isNFTCollectionOpen, setIsNFTCollectionOpen] = useState(false);
  const [nftToZoomTo, setNftToZoomTo] = useState<any>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fullscreenUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const styleChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousNFTsRef = useRef<any[]>([]);
  const lastNFTUpdateRef = useRef<number>(0);
  const nftMarkersInitialized = useRef<boolean>(false);
  const nftMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const fullscreenNFTMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const stableNFTsRef = useRef<any[]>([]);
  const { 
    currentLocation, 
    isLocationEnabled, 
    enableLocation, 
    nearbyUsers,
    nearbyNFTs,
    collectNFT,
    searchRadius,
    showAllUsers,
    privacyEnabled,
    getNearbyUsers,
    setSearchRadius,
    setShowAllUsers
  } = useLocation();
  const { publicKey } = useWallet();
  
  const latitude = currentLocation?.latitude;
  const longitude = currentLocation?.longitude;
  
  console.log('MapboxMap - Location data:', {
    currentLocation,
    isLocationEnabled,
    latitude,
    longitude,
    publicKey: publicKey ? `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}` : 'No wallet',
    nearbyUsers: nearbyUsers.length
  });

  // Handle external fullscreen state changes
  useEffect(() => {
    if (externalIsFullscreen !== undefined && externalIsFullscreen !== isFullscreen) {
      console.log('External fullscreen state change:', externalIsFullscreen);
      
      // If closing fullscreen externally, capture and apply view state
      if (!externalIsFullscreen && isFullscreen && fullscreenMap.current) {
        const center = fullscreenMap.current.getCenter();
        const zoom = fullscreenMap.current.getZoom();
        const fullscreenViewState: { center: [number, number]; zoom: number } = {
          center: [center.lng, center.lat] as [number, number],
          zoom: zoom
        };
        console.log('Capturing fullscreen view state (external close):', fullscreenViewState);
        
        // Apply the fullscreen view to the main map
        if (map.current) {
          console.log('Applying fullscreen view to main map (external close):', fullscreenViewState);
          setTimeout(() => {
            if (map.current) {
              map.current.flyTo({
                center: fullscreenViewState.center,
                zoom: fullscreenViewState.zoom,
                duration: 1000 // Smooth transition
              });
            }
          }, 300); // Delay to ensure main map is ready
        }
      }
      
      setIsFullscreen(externalIsFullscreen);
    }
  }, [externalIsFullscreen, isFullscreen]);

  // Function to handle zoom-based style switching and 3D navigation
  const handleZoomBasedStyle = (mapInstance: mapboxgl.Map, isFullscreenMap: boolean = false) => {
    if (!mapInstance || !mapInstance.isStyleLoaded()) return;
    
    const zoom = mapInstance.getZoom();
    const shouldUse3D = zoom >= 12; // Switch to 3D navigation at zoom level 12 and above
    
    // Use separate state for fullscreen map
    const current3DState = isFullscreenMap ? isFullscreen3DEnabled : is3DEnabled;
    
    if (shouldUse3D && !current3DState) {
      console.log(`Switching to 3D navigation mode on ${isFullscreenMap ? 'fullscreen' : 'main'} map`);
      
      try {
        // Check if DEM source exists and is loaded
        const demSource = mapInstance.getSource('mapbox-dem');
        if (demSource && demSource.type === 'raster-dem') {
          mapInstance.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        }
        
        // Add 3D buildings layer if not already present
        if (!mapInstance.getLayer('3d-buildings')) {
          mapInstance.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.6
            }
          });
        }
        
        // Add pitch and bearing for 3D navigation (but keep map interactive)
        mapInstance.easeTo({
          pitch: 45,
          bearing: 0,
          duration: 1000
        });
        
        // Update 3D state
        if (isFullscreenMap) {
          setIsFullscreen3DEnabled(true);
        } else {
          setIs3DEnabled(true);
        }
      } catch (error) {
        console.warn('Error enabling 3D mode:', error);
      }
      
    } else if (!shouldUse3D && current3DState) {
      console.log(`Switching back to 2D view on ${isFullscreenMap ? 'fullscreen' : 'main'} map`);
      
      try {
        // Remove 3D terrain safely
        const currentTerrain = mapInstance.getTerrain();
        if (currentTerrain) {
          mapInstance.setTerrain(null);
        }
        
        // Reset pitch and bearing
        mapInstance.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 1000
        });
        
        // Update 3D state
        if (isFullscreenMap) {
          setIsFullscreen3DEnabled(false);
        } else {
          setIs3DEnabled(false);
        }
      } catch (error) {
        console.warn('Error disabling 3D mode:', error);
      }
    }
  };

  // Function to generate random offset within radius for privacy
  const generatePrivacyOffset = (radiusMeters: number = 30) => {
    // If privacy is disabled, return no offset (precise location)
    if (!privacyEnabled) {
      return { latOffset: 0, lngOffset: 0 };
    }
    
    // Generate random angle and distance within the radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusMeters;
    
    // Convert meters to approximate degrees (rough conversion)
    const latOffset = (distance / 111000) * Math.cos(angle);
    const lngOffset = (distance / (111000 * Math.cos(0))) * Math.sin(angle);
    
    return { latOffset, lngOffset };
  };

  // Debounced update function to prevent excessive updates
  const debouncedUpdateNearbyMarkers = (mapInstance: mapboxgl.Map, markersRef: React.MutableRefObject<mapboxgl.Marker[]>, timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      updateNearbyMarkers(mapInstance, markersRef);
    }, 200); // Reduced to 200ms for faster updates
  };

  // Function to wait for map to be ready
  const waitForMapReady = (mapInstance: mapboxgl.Map, callback: () => void, maxRetries: number = 10) => {
    let retries = 0;
    const checkMap = () => {
      if (!mapInstance || !mapInstance.isStyleLoaded) {
        if (retries < maxRetries) {
          retries++;
          console.log(`Map not ready, retrying... (${retries}/${maxRetries})`);
          setTimeout(checkMap, 200);
        } else {
          console.log('Map not ready after max retries, skipping marker update');
        }
        return;
      }
      callback();
    };
    checkMap();
  };

  // Function to render NFT markers
  const renderNFTMarkers = (mapInstance: mapboxgl.Map, markersRef: React.MutableRefObject<mapboxgl.Marker[]>) => {
    console.log('🎨 renderNFTMarkers called with', nearbyNFTs.length, 'NFTs');
    
    // Clear existing NFT markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Add markers for nearby NFTs
    nearbyNFTs.forEach((nft, index) => {
      if (nft.latitude && nft.longitude) {
        // Construct image URL from server_url + ipfs_hash
        const imageUrl = nft.server_url && nft.ipfs_hash 
          ? `${nft.server_url}${nft.ipfs_hash}` 
          : nft.image_url || 'https://via.placeholder.com/48x48?text=NFT';
        
        const el = document.createElement('div');
        el.className = 'nft-marker';
        el.innerHTML = `
          <div style="
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 0.4rem 0.6rem;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            border: 2px solid #FFD700;
            max-width: 150px;
            word-break: break-all;
            position: relative;
            cursor: pointer;
          ">
            <div style="
              position: absolute;
              top: calc(100% - 12px);
              left: 50%;
              transform: translateX(-50%);
              width: 48px;
              height: 48px;
              background-image: url('${imageUrl}');
              background-size: cover;
              background-repeat: no-repeat;
              background-position: center;
              border-radius: 50%;
              z-index: 10;
              border: 2px solid #FFD700;
            "></div>
            <div style="font-size: 0.6rem; margin-bottom: 0.2rem; opacity: 0.8;">NFT</div>
            <div>${nft.collection_name || 'Unknown NFT'}</div>
            <div style="font-size: 0.6rem; margin-top: 0.2rem; opacity: 0.8;">${Math.round(nft.distance)}m away</div>
            <button 
              class="nft-collect-button" 
              data-nft-index="${index}"
              style="
                position: absolute;
                top: -8px;
                right: -8px;
                width: 24px;
                height: 24px;
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid #FFD700;
                border-radius: 50%;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                z-index: 20;
                transition: all 0.2s ease;
              "
            >
              🎯
            </button>
            <div style="
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid white;
            "></div>
          </div>
        `;

        const nftMarker = new mapboxgl.Marker(el)
          .setLngLat([nft.longitude, nft.latitude])
          .addTo(mapInstance);
        
        // Add click event listener for NFT collection button
        const collectButton = el.querySelector('.nft-collect-button') as HTMLButtonElement;
        if (collectButton) {
          collectButton.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedNFT(nft);
            setIsNFTCollectionOpen(true);
          });
          
          // Add hover effects
          collectButton.addEventListener('mouseenter', () => {
            collectButton.style.background = 'rgba(255, 107, 107, 0.9)';
          });
          
          collectButton.addEventListener('mouseleave', () => {
            collectButton.style.background = 'rgba(0, 0, 0, 0.8)';
          });
        }
        
        // Add click event listener for the main NFT marker to show details
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedNFT(nft);
          setIsNFTCollectionOpen(true);
        });
        
        markersRef.current.push(nftMarker);
      }
    });
  };

  // Function to update nearby user markers with privacy radius
  const updateNearbyMarkers = (mapInstance: mapboxgl.Map, markersRef: React.MutableRefObject<mapboxgl.Marker[]>) => {
    // Check if map instance is valid
    if (!mapInstance || !mapInstance.isStyleLoaded) {
      console.log('Map instance is null or not ready, skipping marker update');
      return;
    }
    
    // Check if map is loaded and ready
    if (!mapInstance.isStyleLoaded()) {
      console.log('Map style not loaded yet, waiting...');
      // Only add listener once to prevent multiple listeners
      const handleStyleLoad = () => {
        console.log('Map style loaded, updating markers...');
        updateNearbyMarkers(mapInstance, markersRef);
        mapInstance.off('styledata', handleStyleLoad);
      };
      mapInstance.on('styledata', handleStyleLoad);
      return;
    }
    
    // Additional check to ensure map is not being destroyed
    if (!mapInstance || mapInstance.getContainer() === null) {
      console.log('Map instance is being destroyed, skipping marker update');
      return;
    }
    
    // Additional check to ensure map is fully ready
    if (!mapInstance.getSource || !mapInstance.addLayer) {
      console.log('Map not fully ready, retrying in 500ms...');
      setTimeout(() => updateNearbyMarkers(mapInstance, markersRef), 500);
      return;
    }
    
    console.log('Map is ready, updating nearby markers...');
    // Clear existing nearby markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Clean up existing privacy radius circles
    for (let i = 0; i < 20; i++) { // Clean up to 20 potential circles
      const sourceId = `privacy-radius-${i}`;
      const layerId = `privacy-radius-layer-${i}`;
      
      if (mapInstance.getSource && mapInstance.getSource(sourceId)) {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.removeLayer(layerId);
        }
        mapInstance.removeSource(sourceId);
      }
    }

    // Add markers for nearby users with privacy offset
    nearbyUsers.forEach((user, index) => {
      if (user.latitude && user.longitude) {
        // Generate privacy offset (100 meters radius for better privacy)
        const { latOffset, lngOffset } = generatePrivacyOffset(100);
        
        // Calculate approximate location within radius
        const approximateLat = user.latitude + latOffset;
        const approximateLng = user.longitude + lngOffset;
        
        console.log(`Privacy offset for user ${index}:`, {
          original: { lat: user.latitude, lng: user.longitude },
          offset: { latOffset, lngOffset },
          approximate: { lat: approximateLat, lng: approximateLng }
        });
        
        const el = document.createElement('div');
        el.className = 'nearby-user-marker';
        el.innerHTML = `
          <div style="
            background: linear-gradient(45deg, #4ade80, #22c55e);
            color: white;
            padding: 0.4rem 0.6rem;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            border: 2px solid #FFD700;
            max-width: 150px;
            word-break: break-all;
            position: relative;
          ">
            <div style="
              position: absolute;
              top: calc(100% - 12px);
              left: 50%;
              transform: translateX(-50%);
              width: 48px;
              height: 48px;
              background-image: url('/stellar-location.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              border-radius: 50%;
              z-index: 10;
            "></div>
            <div style="font-size: 0.6rem; margin-bottom: 0.2rem; opacity: 0.8;">Nearby User</div>
            <div>${user.publicKey.slice(0, 6)}...${user.publicKey.slice(-6)}</div>
            <div style="font-size: 0.6rem; margin-top: 0.2rem; opacity: 0.8;">${user.distance}km away</div>
            <button 
              class="profile-button" 
              data-user-index="${index}"
              style="
                position: absolute;
                top: -8px;
                right: -8px;
                width: 24px;
                height: 24px;
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid #FFD700;
                border-radius: 50%;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                z-index: 20;
                transition: all 0.2s ease;
              "
            >
              👤
            </button>
            <div style="
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid white;
            "></div>
          </div>
        `;

        const userMarker = new mapboxgl.Marker(el)
          .setLngLat([approximateLng, approximateLat])
          .addTo(mapInstance);
        
        // Add click event listener for profile button
        const profileButton = el.querySelector('.profile-button') as HTMLButtonElement;
        if (profileButton) {
          profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedMarkerUser(user);
            setIsMarkerProfileOpen(true);
          });
          
          // Add hover effects
          profileButton.addEventListener('mouseenter', () => {
            profileButton.style.background = 'rgba(74, 222, 128, 0.9)';
          });
          
          profileButton.addEventListener('mouseleave', () => {
            profileButton.style.background = 'rgba(0, 0, 0, 0.8)';
          });
        }
        
        markersRef.current.push(userMarker);
        
        // Add privacy radius circle (optional - can be enabled/disabled)
        // This shows a circle around the approximate location to indicate privacy radius
        console.log(`Adding privacy radius circle for user ${index} at approximate location:`, { approximateLat, approximateLng });
        console.log(`Map instance type:`, mapInstance === map.current ? 'main' : 'fullscreen');
        if (mapInstance.getSource && mapInstance.addLayer) {
          const sourceId = `privacy-radius-${index}`;
          const layerId = `privacy-radius-layer-${index}`;
          
          // Remove existing source and layer if they exist
          if (mapInstance.getSource(sourceId)) {
            if (mapInstance.getLayer(layerId)) {
              mapInstance.removeLayer(layerId);
            }
            mapInstance.removeSource(sourceId);
          }
          
          // Create circle geometry for privacy radius (100 meters for better visibility)
          const radiusInDegrees = 100 / 111000; // Convert 100 meters to degrees
          const circlePoints: [number, number][] = Array.from({ length: 16 }, (_, i) => {
            const angle = (i / 16) * 2 * Math.PI;
            const x = approximateLng + radiusInDegrees * Math.cos(angle);
            const y = approximateLat + radiusInDegrees * Math.sin(angle);
            return [x, y] as [number, number];
          });
          
          const circle: GeoJSON.Feature<GeoJSON.Polygon> = {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [circlePoints]
            },
            properties: {}
          };
          
          try {
            // Add source and layer for privacy radius
            mapInstance.addSource(sourceId, {
              type: 'geojson',
              data: circle
            });
            
            // Add only a simple line layer for the circle outline (no fill to reduce complexity)
            mapInstance.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': '#ff0000',
                'line-width': 3,
                'line-opacity': 0.8
              }
            });
            
            console.log(`Privacy radius circle added for user ${index} at approximate location:`, { approximateLat, approximateLng });
            console.log(`Map instance has source ${sourceId}:`, !!mapInstance.getSource(sourceId));
            console.log(`Map instance has layer ${layerId}:`, !!mapInstance.getLayer(layerId));
          } catch (error) {
            console.error(`Error adding privacy radius circle for user ${index}:`, error);
          }
        }
      }
    });
  };

  useEffect(() => {
    // Use environment variable or fallback to hardcoded token
    const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2VyZ2UzNjl4MzMiLCJhIjoiY20zZHkzb2xoMDA0eTJxcHU4MTNoYjNlaCJ9.Xl6OxzF9td1IgTTeUp526w';
    
    console.log('Mapbox token check:', mapboxToken ? 'Token found' : 'Token not found');
    console.log('Token preview:', mapboxToken ? `${mapboxToken.substring(0, 20)}...` : 'No token');
    
    if (!mapboxToken) {
      console.error('Mapbox token not found. Please check your .env file.');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    if (mapContainer.current && !map.current && !isMapInitialized) {
      // Determine initial center and zoom based on location data
      let initialCenter: [number, number];
      let initialZoom: number;
      
      if (latitude && longitude) {
        // User has location data - center on their location but start zoomed out to show globe
        initialCenter = [longitude, latitude];
        initialZoom = currentView === 'globe' ? 1 : 2;
        console.log('Map initializing with user location:', { latitude, longitude });
      } else {
        // No location data - use default global view
        initialCenter = [0, 0];
        initialZoom = currentView === 'globe' ? 0.5 : 1;
        console.log('Map initializing with default global view');
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyles[currentStyle],
        center: initialCenter,
        zoom: initialZoom,
        projection: currentView === 'globe' ? 'globe' : 'mercator',
        antialias: true
      });

      // Handle style loading errors
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        // Try to fallback to a different style
        if (currentStyle === 'satellite-streets' && map.current) {
          console.log('Falling back to streets style');
          map.current.setStyle('mapbox://styles/mapbox/streets-v12');
        }
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add DEM source for 3D terrain
      map.current.on('load', () => {
        if (!map.current) return;
        
        try {
          // Add DEM source for 3D terrain
          map.current.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
          console.log('DEM source added to main map');
        } catch (error) {
          console.warn('Error adding DEM source to main map:', error);
        }
      });

      // Add zoom event listener for 3D navigation
      map.current.on('zoom', () => {
        if (map.current) {
          // Add small delay to ensure DEM source is loaded
          setTimeout(() => {
            if (map.current) {
              handleZoomBasedStyle(map.current, false);
            }
          }, 100);
        }
      });
      
      // Track user interaction to prevent auto-centering after user has moved the map
      map.current.on('moveend', () => {
        setHasUserInteracted(true);
      });
      
      map.current.on('zoomend', () => {
        setHasUserInteracted(true);
      });

      // Add user location marker if coordinates are available
      if (latitude && longitude && publicKey) {
        // Wait for style to load before adding marker
        const addUserMarker = () => {
          if (!map.current || !map.current.isStyleLoaded()) {
            setTimeout(addUserMarker, 100);
            return;
          }
          
          const el = document.createElement('div');
          el.className = 'wallet-marker';
        el.innerHTML = `
          <div style="
            background: linear-gradient(45deg, #FFD700, #FFA500);
            color: #000000;
            padding: 0.5rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
            border: 2px solid #FFD700;
            max-width: 200px;
            word-break: break-all;
            position: relative;
          ">
            <div style="
              position: absolute;
              top: calc(100% - 12px);
              left: 50%;
              transform: translateX(-50%);
              width: 48px;
              height: 48px;
              background-image: url('/stellar-location.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              border-radius: 50%;
              z-index: 10;
            "></div>
            <div style="font-size: 0.7rem; margin-bottom: 0.25rem; opacity: 0.8;">Your Location</div>
            <div>${publicKey.slice(0, 8)}...${publicKey.slice(-8)}</div>
            <div style="
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 8px solid transparent;
              border-right: 8px solid transparent;
              border-top: 8px solid #FFD700;
            "></div>
          </div>
        `;

        marker.current = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .addTo(map.current);
        
        // Smoothly zoom to the marker location
        map.current.easeTo({
          center: [longitude, latitude],
          zoom: currentView === 'globe' ? 1 : 2,
          duration: 2000
        });
        };
        
        addUserMarker();
      }
      
      // Mark map as initialized
      setIsMapInitialized(true);
      
      // Immediately update markers if nearby users are available
      if (nearbyUsers.length > 0) {
        console.log('Map initialized, immediately updating markers');
        setTimeout(() => {
          updateNearbyMarkers(map.current!, nearbyMarkers);
        }, 100); // Short delay to ensure map is ready
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setIsMapInitialized(false);
      }
    };
  }, [currentView]); // Only reinitialize on view changes, not style changes

  // Handle main map style changes without reinitializing the map
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded() && !isFullscreen) {
      console.log('Changing main map style to:', currentStyle);
      map.current.setStyle(mapStyles[currentStyle]);
    }
  }, [currentStyle, isFullscreen]);

  // Center map on user location when first available (only once)
  useEffect(() => {
    if (map.current && latitude && longitude && publicKey && !hasUserInteracted) {
      console.log('Centering map on user location:', { latitude, longitude });
      map.current.easeTo({
        center: [longitude, latitude],
        zoom: currentView === 'globe' ? 1 : 2,
        duration: 2000
      });
    }
  }, [latitude, longitude, publicKey, currentView, hasUserInteracted]);

  // Handle style changes without recreating the map
  useEffect(() => {
    if (map.current) {
      // Wait for the map to be ready before changing styles
      if (map.current.isStyleLoaded()) {
        map.current.setStyle(mapStyles[currentStyle]);
      } else {
        // If style isn't loaded yet, wait for it
        map.current.on('styledata', () => {
          if (map.current && map.current.isStyleLoaded()) {
            map.current.setStyle(mapStyles[currentStyle]);
          }
        });
      }
    }
  }, [currentStyle]);

  // Function to update user's own marker
  const updateUserMarker = (mapInstance: mapboxgl.Map, markerRef: React.MutableRefObject<mapboxgl.Marker | null>, isFullscreen: boolean = false) => {
    if (!mapInstance || !latitude || !longitude || !publicKey) return;
    
    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    
    // Create new marker with current location
    const el = document.createElement('div');
    el.className = 'wallet-marker';
    el.innerHTML = `
      <div style="
        background: linear-gradient(45deg, #FFD700, #FFA500);
        color: #000000;
        padding: 0.5rem;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
        border: 2px solid #FFD700;
        max-width: 200px;
        word-break: break-all;
        position: relative;
      ">
        <div style="font-size: 0.7rem; margin-bottom: 0.25rem; opacity: 0.8;">Your Location</div>
        <div>${publicKey.slice(0, 8)}...${publicKey.slice(-8)}</div>
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid white;
        "></div>
      </div>
    `;

    markerRef.current = new mapboxgl.Marker(el)
      .setLngLat([longitude, latitude])
      .addTo(mapInstance);
  };

  // Update nearby user markers when nearbyUsers changes
  useEffect(() => {
    console.log('Updating nearby markers, nearbyUsers count:', nearbyUsers.length);
    if (map.current) {
      console.log('Updating main map markers');
      debouncedUpdateNearbyMarkers(map.current, nearbyMarkers, updateTimeoutRef);
    }
    
    // Also update fullscreen map if it exists
    if (fullscreenMap.current) {
      console.log('Updating fullscreen map markers');
      debouncedUpdateNearbyMarkers(fullscreenMap.current, nearbyMarkers, fullscreenUpdateTimeoutRef);
    }
  }, [nearbyUsers]);

  // Update NFT markers when nearbyNFTs changes
  useEffect(() => {
    console.log('🔄 NFT markers useEffect triggered, nearbyNFTs count:', nearbyNFTs.length);
    
    // Check if NFT data has actually changed
    const hasChanged = nearbyNFTs.length !== stableNFTsRef.current.length || 
      nearbyNFTs.some((nft, index) => {
        const prevNFT = stableNFTsRef.current[index];
        return !prevNFT || nft.id !== prevNFT.id || nft.latitude !== prevNFT.latitude || nft.longitude !== prevNFT.longitude;
      });
    
    if (!hasChanged) {
      console.log('🔄 NFT data unchanged, skipping update');
      return;
    }
    
    console.log('🔄 NFT data changed, updating markers');
    stableNFTsRef.current = [...nearbyNFTs];
    lastNFTUpdateRef.current = Date.now();
    nftMarkersInitialized.current = true;
    
    // Only update if we have NFTs and the map is ready
    if (nearbyNFTs.length > 0 && map.current) {
      console.log('🎯 Updating main map NFT markers');
      renderNFTMarkers(map.current, nftMarkersRef);
    }
    
    // Also update fullscreen map if it exists
    if (fullscreenMap.current) {
      console.log('🎯 Updating fullscreen map NFT markers');
      renderNFTMarkers(fullscreenMap.current, fullscreenNFTMarkersRef);
    }
  }, [nearbyNFTs]);

  // Update user's own marker when location changes
  useEffect(() => {
    if (map.current && latitude && longitude && publicKey) {
      console.log('Updating user marker on main map:', { latitude, longitude });
      updateUserMarker(map.current, marker, false);
    }
    
    if (fullscreenMap.current && latitude && longitude && publicKey) {
      console.log('Updating user marker on fullscreen map:', { latitude, longitude });
      updateUserMarker(fullscreenMap.current, fullscreenMarker, true);
    }
  }, [latitude, longitude, publicKey]);

  // Force update markers when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && nearbyUsers.length > 0) {
        console.log('Page became visible, force updating markers');
        if (map.current) {
          setTimeout(() => updateNearbyMarkers(map.current!, nearbyMarkers), 100);
        }
        if (fullscreenMap.current) {
          setTimeout(() => updateNearbyMarkers(fullscreenMap.current!, nearbyMarkers), 100);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [nearbyUsers]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (fullscreenUpdateTimeoutRef.current) {
        clearTimeout(fullscreenUpdateTimeoutRef.current);
      }
      if (styleChangeTimeoutRef.current) {
        clearTimeout(styleChangeTimeoutRef.current);
      }
    };
  }, []);

  // Initialize fullscreen map when fullscreen is opened
  useEffect(() => {
    if (isFullscreen && fullscreenMapContainer.current && !fullscreenMap.current && !isFullscreenMapInitialized) {
      const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2VyZ2UzNjl4MzMiLCJhIjoiY20zZHkzb2xoMDA0eTJxcHU4MTNoYjNlaCJ9.Xl6OxzF9td1IgTTeUp526w';
      
      if (!mapboxToken) {
        console.error('Mapbox token not found. Please check your .env file.');
        return;
      }

      mapboxgl.accessToken = mapboxToken;

      // Determine initial center and zoom based on location data
      let initialCenter: [number, number];
      let initialZoom: number;
      
      if (latitude && longitude) {
        // If user has interacted with the main map, use its current view
        if (hasUserInteracted && map.current) {
          const currentCenter = map.current.getCenter();
          const currentZoom = map.current.getZoom();
          initialCenter = [currentCenter.lng, currentCenter.lat];
          initialZoom = currentZoom;
        } else {
          initialCenter = [longitude, latitude];
          initialZoom = currentView === 'globe' ? 1.5 : 3;
        }
      } else {
        initialCenter = [0, 0];
        initialZoom = currentView === 'globe' ? 1 : 2;
      }

      fullscreenMap.current = new mapboxgl.Map({
        container: fullscreenMapContainer.current,
        style: mapStyles[currentStyle],
        center: initialCenter,
        zoom: initialZoom,
        projection: currentView === 'globe' ? 'globe' : 'mercator',
        antialias: true
      });

      // Add navigation controls
      fullscreenMap.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add DEM source for 3D terrain
      fullscreenMap.current.on('load', () => {
        if (!fullscreenMap.current) return;
        
        try {
          // Add DEM source for 3D terrain
          fullscreenMap.current.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
          console.log('DEM source added to fullscreen map');
        } catch (error) {
          console.warn('Error adding DEM source to fullscreen map:', error);
        }
      });

      // Add zoom event listener for 3D navigation
      fullscreenMap.current.on('zoom', () => {
        if (fullscreenMap.current) {
          // Add small delay to ensure DEM source is loaded
          setTimeout(() => {
            if (fullscreenMap.current) {
              handleZoomBasedStyle(fullscreenMap.current, true);
            }
          }, 100);
        }
      });
      
      // Track user interaction for fullscreen map too
      fullscreenMap.current.on('moveend', () => {
        setHasUserInteracted(true);
      });
      
      fullscreenMap.current.on('zoomend', () => {
        setHasUserInteracted(true);
      });
      
      // Add nearby user markers to fullscreen map
      if (nearbyUsers.length > 0) {
        updateNearbyMarkers(fullscreenMap.current, nearbyMarkers);
      }

      // Add user location marker if coordinates are available
      if (latitude && longitude && publicKey) {
        const el = document.createElement('div');
        el.className = 'wallet-marker';
        el.innerHTML = `
          <div style="
            background: linear-gradient(45deg, #FFD700, #FFA500);
            color: #000000;
            padding: 0.5rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
            border: 2px solid #FFD700;
            max-width: 200px;
            word-break: break-all;
            position: relative;
          ">
            <div style="
              position: absolute;
              top: calc(100% - 12px);
              left: 50%;
              transform: translateX(-50%);
              width: 48px;
              height: 48px;
              background-image: url('/stellar-location.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              border-radius: 50%;
              z-index: 10;
            "></div>
            <div style="font-size: 0.7rem; margin-bottom: 0.25rem; opacity: 0.8;">Your Location</div>
            <div>${publicKey.slice(0, 8)}...${publicKey.slice(-8)}</div>
            <div style="
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 8px solid transparent;
              border-right: 8px solid transparent;
              border-top: 8px solid #FFD700;
            "></div>
          </div>
        `;

        fullscreenMarker.current = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .addTo(fullscreenMap.current);
      }
      
      // Mark fullscreen map as initialized
      setIsFullscreenMapInitialized(true);
      
      // Immediately update markers if nearby users are available
      if (nearbyUsers.length > 0) {
        console.log('Fullscreen map initialized, immediately updating markers');
        setTimeout(() => {
          updateNearbyMarkers(fullscreenMap.current!, nearbyMarkers);
        }, 100); // Short delay to ensure map is ready
      }

      // Immediately update NFT markers if available
      if (nearbyNFTs.length > 0) {
        console.log('Fullscreen map initialized, immediately updating NFT markers');
        setTimeout(() => {
          renderNFTMarkers(fullscreenMap.current!, fullscreenNFTMarkersRef);
        }, 100); // Short delay to ensure map is ready
      }
    }

    return () => {
      if (fullscreenMap.current && !isFullscreen) {
        // Clear NFT markers before removing the map
        fullscreenNFTMarkersRef.current.forEach(marker => marker.remove());
        fullscreenNFTMarkersRef.current = [];
        
        fullscreenMap.current.remove();
        fullscreenMap.current = null;
        fullscreenMarker.current = null;
        setIsFullscreenMapInitialized(false);
      }
    };
  }, [isFullscreen, currentView]); // Only reinitialize on fullscreen/view changes, not style changes

  // Handle zooming to selected NFT when fullscreen map opens
  useEffect(() => {
    if (isFullscreen && fullscreenMap.current && nftToZoomTo && nftToZoomTo.latitude && nftToZoomTo.longitude) {
      console.log('Zooming to selected NFT:', nftToZoomTo);
      
      // Wait for the map to be ready, then zoom to the NFT location
      const zoomToNFT = () => {
        if (fullscreenMap.current) {
          fullscreenMap.current.flyTo({
            center: [nftToZoomTo.longitude, nftToZoomTo.latitude],
            zoom: 18,
            duration: 1000
          });
          // Clear the NFT to zoom to after zooming
          setNftToZoomTo(null);
        }
      };
      
      // If map is already loaded, zoom immediately
      if (fullscreenMap.current.isStyleLoaded()) {
        setTimeout(zoomToNFT, 500); // Small delay to ensure map is ready
      } else {
        // Wait for map to load, then zoom
        fullscreenMap.current.on('load', () => {
          setTimeout(zoomToNFT, 500);
        });
      }
    }
  }, [isFullscreen, nftToZoomTo]);

  // Handle selectedNFTForZoom prop from Dashboard
  useEffect(() => {
    if (selectedNFTForZoom && selectedNFTForZoom.latitude && selectedNFTForZoom.longitude) {
      setNftToZoomTo(selectedNFTForZoom);
    }
  }, [selectedNFTForZoom]);

  // Handle fullscreen style changes without reinitializing the map
  useEffect(() => {
    if (fullscreenMap.current && fullscreenMap.current.isStyleLoaded() && isFullscreen) {
      console.log('Changing fullscreen map style to:', currentStyle);
      fullscreenMap.current.setStyle(mapStyles[currentStyle]);
    }
  }, [currentStyle, isFullscreen]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    
    if (map.current) {
      const newZoom = view === 'globe' ? 1 : 2;
      const newProjection = view === 'globe' ? 'globe' : 'mercator';
      
      map.current.setProjection(newProjection);
      map.current.easeTo({
        zoom: newZoom,
        duration: 1000
      });
      
      // Update markers after view change for both maps
      console.log('View changed, updating markers and user marker on both maps');
      
      // Update main map markers and user marker after transition completes
      setTimeout(() => {
        if (map.current && map.current.isStyleLoaded()) {
          // Update nearby user markers
          if (nearbyUsers.length > 0) {
            updateNearbyMarkers(map.current, nearbyMarkers);
          }
          
          // Update user marker (remove old and add new)
          if (marker.current) {
            marker.current.remove();
            marker.current = null;
          }
          
          if (latitude && longitude && publicKey) {
            const el = document.createElement('div');
            el.className = 'wallet-marker';
            el.innerHTML = `
              <div style="
                background: linear-gradient(45deg, #FFD700, #FFA500);
                color: #000000;
                padding: 0.5rem;
                border-radius: 8px;
                font-size: 0.8rem;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
                border: 2px solid #FFD700;
                max-width: 150px;
                word-break: break-all;
                position: relative;
              ">
                <div style="
                  position: absolute;
                  top: calc(100% - 12px);
                  left: 50%;
                  transform: translateX(-50%);
                  width: 48px;
                  height: 48px;
                  background-image: url('/stellar-location.png');
                  background-size: contain;
                  background-repeat: no-repeat;
                  background-position: center;
                  border-radius: 50%;
                  z-index: 10;
                "></div>
                <div style="font-size: 0.7rem; margin-bottom: 0.2rem; opacity: 0.8;">Your Location</div>
                <div>${publicKey.slice(0, 6)}...${publicKey.slice(-6)}</div>
                <div style="
                  position: absolute;
                  bottom: -6px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 0;
                  height: 0;
                  border-left: 6px solid transparent;
                  border-right: 6px solid transparent;
                  border-top: 6px solid white;
                "></div>
              </div>
            `;
            
            marker.current = new mapboxgl.Marker(el)
              .setLngLat([longitude, latitude])
              .addTo(map.current);
          }
        }
        
        // Update fullscreen map markers if it exists
        if (fullscreenMap.current && fullscreenMap.current.isStyleLoaded()) {
          if (nearbyUsers.length > 0) {
            updateNearbyMarkers(fullscreenMap.current, nearbyMarkers);
          }
          
          // Update fullscreen NFT markers
          if (nearbyNFTs.length > 0) {
            renderNFTMarkers(fullscreenMap.current, fullscreenNFTMarkersRef);
          }
          
          // Update fullscreen user marker
          if (fullscreenMarker.current) {
            fullscreenMarker.current.remove();
            fullscreenMarker.current = null;
          }
          
          if (latitude && longitude && publicKey) {
            const el = document.createElement('div');
            el.className = 'wallet-marker';
            el.innerHTML = `
              <div style="
                background: linear-gradient(45deg, #FFD700, #FFA500);
                color: #000000;
                padding: 0.5rem;
                border-radius: 8px;
                font-size: 0.8rem;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
                border: 2px solid #FFD700;
                max-width: 150px;
                word-break: break-all;
                position: relative;
              ">
                <div style="
                  position: absolute;
                  top: calc(100% - 12px);
                  left: 50%;
                  transform: translateX(-50%);
                  width: 48px;
                  height: 48px;
                  background-image: url('/stellar-location.png');
                  background-size: contain;
                  background-repeat: no-repeat;
                  background-position: center;
                  border-radius: 50%;
                  z-index: 10;
                "></div>
                <div style="font-size: 0.7rem; margin-bottom: 0.2rem; opacity: 0.8;">Your Location</div>
                <div>${publicKey.slice(0, 6)}...${publicKey.slice(-6)}</div>
                <div style="
                  position: absolute;
                  bottom: -6px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 0;
                  height: 0;
                  border-left: 6px solid transparent;
                  border-right: 6px solid transparent;
                  border-top: 6px solid white;
                "></div>
              </div>
            `;
            
            fullscreenMarker.current = new mapboxgl.Marker(el)
              .setLngLat([longitude, latitude])
              .addTo(fullscreenMap.current);
          }
        }
      }, 1200); // Delay to ensure transition is complete
    }
  };

  const handleStyleChange = (style: MapStyle) => {
    setCurrentStyle(style);
    
    // Clear any existing timeout
    if (styleChangeTimeoutRef.current) {
      clearTimeout(styleChangeTimeoutRef.current);
    }
    
    // Debounce marker updates to prevent multiple triggers
    styleChangeTimeoutRef.current = setTimeout(() => {
      if (nearbyUsers.length > 0) {
        console.log('Style changed, updating markers on both maps');
        
        // Update main map markers after style change
        if (map.current && map.current.isStyleLoaded()) {
          updateNearbyMarkers(map.current, nearbyMarkers);
        }
        
        // Update fullscreen map markers if it exists
        if (fullscreenMap.current && fullscreenMap.current.isStyleLoaded()) {
          updateNearbyMarkers(fullscreenMap.current, nearbyMarkers);
          
          // Update fullscreen NFT markers
          if (nearbyNFTs.length > 0) {
            renderNFTMarkers(fullscreenMap.current, fullscreenNFTMarkersRef);
          }
        }
      }
    }, 500); // Debounce delay
  };

  const handleFullscreenToggle = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    onFullscreenChange?.(newFullscreenState);
    
    // If opening fullscreen, sync style and update markers
    if (newFullscreenState) {
      setTimeout(() => {
        if (fullscreenMap.current) {
          console.log('Opening fullscreen - syncing style and updating markers');
          
          // Sync style from main map to fullscreen
          if (fullscreenMap.current.isStyleLoaded()) {
            fullscreenMap.current.setStyle(mapStyles[currentStyle]);
          }
          
          // Update markers
          if (nearbyUsers.length > 0) {
            updateNearbyMarkers(fullscreenMap.current, nearbyMarkers);
          }
          
          // Update NFT markers
          if (nearbyNFTs.length > 0) {
            renderNFTMarkers(fullscreenMap.current, fullscreenNFTMarkersRef);
          }
        }
      }, 500); // Short delay to ensure map is ready
    }
  };

  const handleCloseFullscreen = () => {
    // Capture the fullscreen map's view state before closing
    let fullscreenViewState: { center: [number, number]; zoom: number } | null = null;
    if (fullscreenMap.current) {
      const center = fullscreenMap.current.getCenter();
      const zoom = fullscreenMap.current.getZoom();
      fullscreenViewState = {
        center: [center.lng, center.lat] as [number, number],
        zoom: zoom
      };
      console.log('Capturing fullscreen view state:', fullscreenViewState);
    }
    
    setIsFullscreen(false);
    setIsFullscreenMapInitialized(false);
    onFullscreenChange?.(false);
    
    // Apply the fullscreen view to the main map
    if (map.current && fullscreenViewState) {
      console.log('Applying fullscreen view to main map:', fullscreenViewState);
      setTimeout(() => {
        if (map.current) {
          map.current.flyTo({
            center: fullscreenViewState!.center,
            zoom: fullscreenViewState!.zoom,
            duration: 1000 // Smooth transition
          });
        }
      }, 300); // Delay to ensure main map is ready
    }
    
    // Update markers on main map when returning from fullscreen
    if (map.current && nearbyUsers.length > 0) {
      console.log('Closing fullscreen, updating main map markers');
      setTimeout(() => {
        updateNearbyMarkers(map.current!, nearbyMarkers);
      }, 200); // Short delay to ensure main map is ready
    }
  };

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setIsFullscreenMapInitialized(false);
        onFullscreenChange?.(false);
        
        // Update markers on main map when closing with ESC
        if (map.current && nearbyUsers.length > 0) {
          console.log('ESC key closing fullscreen, updating main map markers');
          setTimeout(() => {
            updateNearbyMarkers(map.current!, nearbyMarkers);
          }, 200); // Short delay to ensure main map is ready
        }
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen, nearbyUsers]);

  // Update main map markers and sync style when fullscreen is closed
  useEffect(() => {
    if (!isFullscreen && map.current) {
      console.log('Fullscreen closed - syncing style and updating main map markers');
      
      // Sync style from fullscreen to main map
      if (map.current.isStyleLoaded()) {
        map.current.setStyle(mapStyles[currentStyle]);
      }
      
      // Update markers
      if (nearbyUsers.length > 0) {
        setTimeout(() => {
          updateNearbyMarkers(map.current!, nearbyMarkers);
        }, 500); // Delay to ensure style sync is complete
      }
    }
  }, [isFullscreen, nearbyUsers, currentStyle]);

  return (
    <>
      <MapContainer>
        <MapHeader>
          <MapTitle>
            🌍 <span>Global Map</span>
          </MapTitle>
          <GeoLinkStatus />
          <ViewControls>
            {/* Map Style and View Controls */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <StyleSelect 
                value={currentStyle} 
                onChange={(e) => handleStyleChange(e.target.value as MapStyle)}
                style={{ minWidth: '140px' }}
              >
                <option value="satellite">🛰️ Satellite</option>
                <option value="streets">🗺️ Streets</option>
                <option value="outdoors">🏔️ Outdoors</option>
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
                <option value="satellite-streets">🛰️ Satellite Streets</option>
              </StyleSelect>
              
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <ViewButton 
                  $active={currentView === 'globe'} 
                  onClick={() => handleViewChange('globe')}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                >
                  🌍
                </ViewButton>
                <ViewButton 
                  $active={currentView === 'flat'} 
                  onClick={() => handleViewChange('flat')}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                >
                  📐
                </ViewButton>
              </div>
              
              <FullscreenButton onClick={handleFullscreenToggle} title="Expand to fullscreen">
                <Maximize2 size={16} />
              </FullscreenButton>
            </div>
            {!isLocationEnabled && (
              <LocationButton onClick={enableLocation}>
                📍 Enable Location
              </LocationButton>
            )}
            {!latitude && !longitude && (
              <LocationButton onClick={() => {
                // Test location - New York City
                const testLocation = {
                  latitude: 40.7128,
                  longitude: -74.0060,
                  timestamp: new Date().toISOString(),
                  ipAddress: ''
                };
                console.log('Using test location:', testLocation);
                
                // Force update the map with test location
                if (map.current) {
                  // Smoothly animate to test location
                  map.current.easeTo({
                    center: [-74.0060, 40.7128],
                    zoom: currentView === 'globe' ? 1 : 2,
                    duration: 2000
                  });
                  
                  // Remove existing marker
                  if (marker.current) {
                    marker.current.remove();
                  }
                  
                  // Add test marker
                  const el = document.createElement('div');
                  el.className = 'wallet-marker';
                  el.innerHTML = `
                    <div style="
                      background: linear-gradient(45deg, #FFD700, #FFA500);
                      color: #000000;
                      padding: 0.5rem;
                      border-radius: 8px;
                      font-size: 0.8rem;
                      font-weight: 600;
                      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
                      border: 2px solid #FFD700;
                      max-width: 200px;
                      word-break: break-all;
                      position: relative;
                    ">
                      <div style="font-size: 0.7rem; margin-bottom: 0.25rem; opacity: 0.8;">Test Location</div>
                      <div>${publicKey ? `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}` : 'No wallet'}</div>
                      <div style="
                        position: absolute;
                        bottom: -8px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 0;
                        height: 0;
                        border-left: 8px solid transparent;
                        border-right: 8px solid transparent;
                        border-top: 8px solid #FFD700;
                      "></div>
                    </div>
                  `;

                  marker.current = new mapboxgl.Marker(el)
                    .setLngLat([-74.0060, 40.7128])
                    .addTo(map.current);
                }
              }}>
                🧪 Test Location
              </LocationButton>
            )}
            
            {/* Location Search Controls */}
            {isLocationEnabled && (latitude && longitude) && (
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                alignItems: 'center', 
                flexWrap: 'wrap',
                marginTop: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      id="mapShowAllUsers"
                      checked={showAllUsers}
                      onChange={(e) => setShowAllUsers(e.target.checked)}
                      style={{ marginRight: '0.25rem', transform: 'scale(0.8)' }}
                    />
                    <label htmlFor="mapShowAllUsers" style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                      Global
                    </label>
                  </div>
                  
                  {!showAllUsers && (
                    <select
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        color: 'white',
                        fontSize: '0.7rem',
                        minWidth: '80px'
                      }}
                    >
                      <option value={1}>1km</option>
                      <option value={5}>5km</option>
                      <option value={10}>10km</option>
                      <option value={25}>25km</option>
                      <option value={50}>50km</option>
                      <option value={100}>100km</option>
                      <option value={250}>250km</option>
                      <option value={500}>500km</option>
                      <option value={1000}>1000km</option>
                    </select>
                  )}
                  
                  <LocationButton 
                    onClick={() => getNearbyUsers(searchRadius, showAllUsers)}
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                  >
                    {showAllUsers ? '🌍 All' : `🔍 ${searchRadius}km`}
                  </LocationButton>
                </div>
              </div>
            )}
          </ViewControls>
        </MapHeader>
        
        <MapWrapper>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          
          {latitude && longitude && (
            <LocationInfo>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    📍 Your Location
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.25rem' }}>
                    {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.25rem' }}>
                    Last updated: {currentLocation?.timestamp ? new Date(currentLocation.timestamp).toLocaleTimeString() : 'Unknown'}
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginLeft: '1rem',
                  minWidth: '80px'
                }}>
                  <div style={{ 
                    color: 'white', 
                    fontSize: '0.6rem', 
                    fontWeight: '500', 
                    marginBottom: '0.1rem', 
                    opacity: 0.8 
                  }}>
                    Powered By
                  </div>
                  <img 
                    src="/StellarLogo.png" 
                    alt="Stellar" 
                    style={{ 
                      width: '60px', 
                      height: '24px', 
                      objectFit: 'contain', 
                      objectPosition: 'center' 
                    }} 
                  />
                </div>
              </div>
            </LocationInfo>
          )}
        </MapWrapper>
      </MapContainer>
      
      {/* Fullscreen Overlay */}
      <FullscreenOverlay $isOpen={isFullscreen}>
        <FullscreenHeader>
          <FullscreenTitle>
            🌍 Global Map
          </FullscreenTitle>
          <FullscreenControls>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <StyleSelect 
                value={currentStyle} 
                onChange={(e) => handleStyleChange(e.target.value as MapStyle)}
                style={{ minWidth: '140px' }}
              >
                <option value="satellite">🛰️ Satellite</option>
                <option value="streets">🗺️ Streets</option>
                <option value="outdoors">🏔️ Outdoors</option>
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
                <option value="satellite-streets">🛰️ Satellite Streets</option>
              </StyleSelect>
              
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <ViewButton 
                  $active={currentView === 'globe'} 
                  onClick={() => handleViewChange('globe')}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                >
                  🌍
                </ViewButton>
                <ViewButton 
                  $active={currentView === 'flat'} 
                  onClick={() => handleViewChange('flat')}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                >
                  📐
                </ViewButton>
              </div>
              
              <CloseButton onClick={handleCloseFullscreen} title="Close fullscreen">
                <Minimize2 size={16} />
              </CloseButton>
            </div>
            
            {/* Fullscreen Location Search Controls */}
            {isLocationEnabled && (latitude && longitude) && (
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                alignItems: 'center', 
                flexWrap: 'wrap',
                marginTop: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      id="fullscreenShowAllUsers"
                      checked={showAllUsers}
                      onChange={(e) => setShowAllUsers(e.target.checked)}
                      style={{ marginRight: '0.25rem', transform: 'scale(0.8)' }}
                    />
                    <label htmlFor="fullscreenShowAllUsers" style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                      Global
                    </label>
                  </div>
                  
                  {!showAllUsers && (
                    <select
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        color: 'white',
                        fontSize: '0.7rem',
                        minWidth: '80px'
                      }}
                    >
                      <option value={1}>1km</option>
                      <option value={5}>5km</option>
                      <option value={10}>10km</option>
                      <option value={25}>25km</option>
                      <option value={50}>50km</option>
                      <option value={100}>100km</option>
                      <option value={250}>250km</option>
                      <option value={500}>500km</option>
                      <option value={1000}>1000km</option>
                    </select>
                  )}
                  
                  <LocationButton 
                    onClick={() => getNearbyUsers(searchRadius, showAllUsers)}
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                  >
                    {showAllUsers ? '🌍 All' : `🔍 ${searchRadius}km`}
                  </LocationButton>
                </div>
              </div>
            )}
          </FullscreenControls>
        </FullscreenHeader>
        
        <FullscreenMapWrapper>
          <div ref={fullscreenMapContainer} style={{ width: '100%', height: '100%' }} />
          
          {latitude && longitude && (
            <LocationInfo>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    📍 Your Location
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.25rem' }}>
                    {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.25rem' }}>
                    Last updated: {currentLocation?.timestamp ? new Date(currentLocation.timestamp).toLocaleTimeString() : 'Unknown'}
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginLeft: '1rem',
                  minWidth: '80px'
                }}>
                  <div style={{ 
                    color: 'white', 
                    fontSize: '0.6rem', 
                    fontWeight: '500', 
                    marginBottom: '0.1rem', 
                    opacity: 0.8 
                  }}>
                    Powered By
                  </div>
                  <img 
                    src="/StellarLogo.png" 
                    alt="Stellar" 
                    style={{ 
                      width: '60px', 
                      height: '24px', 
                      objectFit: 'contain', 
                      objectPosition: 'center' 
                    }} 
                  />
                </div>
              </div>
            </LocationInfo>
          )}
        </FullscreenMapWrapper>
      </FullscreenOverlay>
      
      {/* Marker Profile Overlay */}
      {selectedMarkerUser && (
        <MarkerProfileOverlay
          isOpen={isMarkerProfileOpen}
          onClose={() => {
            setIsMarkerProfileOpen(false);
            setSelectedMarkerUser(null);
          }}
          user={selectedMarkerUser}
        />
      )}

      {/* NFT Collection Overlay */}
      {selectedNFT && (
        <NFTCollectionOverlay
          nft={selectedNFT}
          onCollect={() => {
            collectNFT(selectedNFT);
            setSelectedNFT(null);
            setIsNFTCollectionOpen(false);
          }}
          onClose={() => {
            setSelectedNFT(null);
            setIsNFTCollectionOpen(false);
          }}
          onZoomIn={() => {
            if (selectedNFT.latitude && selectedNFT.longitude) {
              // Set the NFT to zoom to and open fullscreen map
              setNftToZoomTo(selectedNFT);
              setIsFullscreen(true);
              onFullscreenChange?.(true);
              setSelectedNFT(null);
              setIsNFTCollectionOpen(false);
            }
          }}
        />
      )}
    </>
  );
};

export default MapboxMap;
