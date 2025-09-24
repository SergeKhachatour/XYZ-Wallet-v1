import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styled from 'styled-components';
import { useLocation } from '../contexts/LocationContext';
import { useWallet } from '../contexts/WalletContext';
import { Maximize2, Minimize2 } from 'lucide-react';

const MapContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  color: white;
  height: 400px;
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    height: 300px;
    padding: 1rem;
  }
`;

const MapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  z-index: 10;
  position: relative;
`;

const MapTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ViewControls = styled.div`
  display: flex;
  gap: 0.5rem;
  z-index: 10;
  position: relative;
`;

const LocationButton = styled.button`
  background: rgba(0, 212, 255, 0.2);
  border: 1px solid rgba(0, 212, 255, 0.5);
  color: #00d4ff;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(0, 212, 255, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.7rem;
  }
`;

const ViewButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.7rem;
  }
`;

const StyleSelect = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  option {
    background: #1a1a1a;
    color: white;
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.7rem;
  }
`;

const FullscreenButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
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
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const MapWrapper = styled.div`
  height: calc(100% - 60px);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
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

const MapboxMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const fullscreenMapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const fullscreenMap = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const fullscreenMarker = useRef<mapboxgl.Marker | null>(null);
  const nearbyMarkers = useRef<mapboxgl.Marker[]>([]);
  const fullscreenNearbyMarkers = useRef<mapboxgl.Marker[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('globe');
  const [currentStyle, setCurrentStyle] = useState<MapStyle>('satellite-streets');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { currentLocation, isLocationEnabled, enableLocation, nearbyUsers } = useLocation();
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

  // Function to update nearby user markers
  const updateNearbyMarkers = (mapInstance: mapboxgl.Map, markersRef: React.MutableRefObject<mapboxgl.Marker[]>) => {
    // Clear existing nearby markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for nearby users
    nearbyUsers.forEach((user, index) => {
      if (user.latitude && user.longitude) {
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
            border: 2px solid white;
            max-width: 150px;
            word-break: break-all;
            position: relative;
          ">
            <div style="font-size: 0.6rem; margin-bottom: 0.2rem; opacity: 0.8;">Nearby User</div>
            <div>${user.publicKey.slice(0, 6)}...${user.publicKey.slice(-6)}</div>
            <div style="font-size: 0.6rem; margin-top: 0.2rem; opacity: 0.8;">${user.distance}km away</div>
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
          .setLngLat([user.longitude, user.latitude])
          .addTo(mapInstance);
        
        markersRef.current.push(userMarker);
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

    if (mapContainer.current && !map.current) {
      // Determine initial center and zoom based on location data
      let initialCenter: [number, number];
      let initialZoom: number;
      
      if (latitude && longitude) {
        // User has location data - center on their location
        initialCenter = [longitude, latitude];
        initialZoom = currentView === 'globe' ? 3 : 12;
        console.log('Map initializing with user location:', { latitude, longitude });
      } else {
        // No location data - use default global view
        initialCenter = [0, 0];
        initialZoom = currentView === 'globe' ? 1 : 2;
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

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add user location marker if coordinates are available
      if (latitude && longitude && publicKey) {
        const el = document.createElement('div');
        el.className = 'wallet-marker';
        el.innerHTML = `
          <div style="
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            color: white;
            padding: 0.5rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border: 2px solid white;
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

        marker.current = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .addTo(map.current);
        
        // Smoothly zoom to the marker location
        map.current.easeTo({
          center: [longitude, latitude],
          zoom: currentView === 'globe' ? 3 : 12,
          duration: 2000
        });
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude, publicKey, currentView, currentStyle]);

  // Update map when location data becomes available
  useEffect(() => {
    if (map.current && latitude && longitude && publicKey && !marker.current) {
      console.log('Location data became available, adding marker:', { latitude, longitude });
      
      // Center map on user location
      map.current.easeTo({
        center: [longitude, latitude],
        zoom: currentView === 'globe' ? 3 : 12,
        duration: 2000
      });

      // Add marker
      const el = document.createElement('div');
      el.className = 'wallet-marker';
      el.innerHTML = `
        <div style="
          background: linear-gradient(45deg, #00d4ff, #0099cc);
          color: white;
          padding: 0.5rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border: 2px solid white;
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

      marker.current = new mapboxgl.Marker(el)
        .setLngLat([longitude, latitude])
        .addTo(map.current);
    }
  }, [latitude, longitude, publicKey, currentView]);

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

  // Update nearby user markers when nearbyUsers changes
  useEffect(() => {
    if (map.current && nearbyUsers.length > 0) {
      updateNearbyMarkers(map.current, nearbyMarkers);
    }
  }, [nearbyUsers]);

  // Initialize fullscreen map when fullscreen is opened
  useEffect(() => {
    if (isFullscreen && fullscreenMapContainer.current && !fullscreenMap.current) {
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
        initialCenter = [longitude, latitude];
        initialZoom = currentView === 'globe' ? 3 : 12;
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

      // Add user location marker if coordinates are available
      if (latitude && longitude && publicKey) {
        const el = document.createElement('div');
        el.className = 'wallet-marker';
        el.innerHTML = `
          <div style="
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            color: white;
            padding: 0.5rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border: 2px solid white;
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

        fullscreenMarker.current = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .addTo(fullscreenMap.current);
      }
    }

    return () => {
      if (fullscreenMap.current && !isFullscreen) {
        fullscreenMap.current.remove();
        fullscreenMap.current = null;
        fullscreenMarker.current = null;
      }
    };
  }, [isFullscreen, latitude, longitude, publicKey, currentView, currentStyle]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    
    if (map.current) {
      const newZoom = view === 'globe' ? 1 : 10;
      const newProjection = view === 'globe' ? 'globe' : 'mercator';
      
      map.current.setProjection(newProjection);
      map.current.easeTo({
        zoom: newZoom,
        duration: 1000
      });
    }
  };

  const handleStyleChange = (style: MapStyle) => {
    setCurrentStyle(style);
  };

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
  };

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);

  return (
    <>
      <MapContainer>
        <MapHeader>
          <MapTitle>
            🌍 Global Map
          </MapTitle>
          <ViewControls>
            <StyleSelect 
              value={currentStyle} 
              onChange={(e) => handleStyleChange(e.target.value as MapStyle)}
            >
              <option value="satellite">🛰️ Satellite</option>
              <option value="streets">🗺️ Streets</option>
              <option value="outdoors">🏔️ Outdoors</option>
              <option value="light">☀️ Light</option>
              <option value="dark">🌙 Dark</option>
              <option value="satellite-streets">🛰️ Satellite Streets</option>
            </StyleSelect>
            <ViewButton 
              $active={currentView === 'globe'} 
              onClick={() => handleViewChange('globe')}
            >
              🌍 Globe
            </ViewButton>
            <ViewButton 
              $active={currentView === 'flat'} 
              onClick={() => handleViewChange('flat')}
            >
              📐 Flat
            </ViewButton>
            <FullscreenButton onClick={handleFullscreenToggle} title="Expand to fullscreen">
              <Maximize2 size={16} />
            </FullscreenButton>
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
                    zoom: currentView === 'globe' ? 3 : 12,
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
                      background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                      color: white;
                      padding: 0.5rem;
                      border-radius: 8px;
                      font-size: 0.8rem;
                      font-weight: 600;
                      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                      border: 2px solid white;
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
                        border-top: 8px solid white;
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
          </ViewControls>
        </MapHeader>
        
        <MapWrapper>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          
          {latitude && longitude && (
            <LocationInfo>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                📍 Your Location
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.25rem' }}>
                {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.25rem' }}>
                Last updated: {currentLocation?.timestamp ? new Date(currentLocation.timestamp).toLocaleTimeString() : 'Unknown'}
              </div>
            </LocationInfo>
          )}
        </MapWrapper>
      </MapContainer>
      
      {/* Fullscreen Overlay */}
      <FullscreenOverlay $isOpen={isFullscreen}>
        <FullscreenHeader>
          <FullscreenTitle>
            🌍 Global Map - Fullscreen
          </FullscreenTitle>
          <FullscreenControls>
            <StyleSelect 
              value={currentStyle} 
              onChange={(e) => handleStyleChange(e.target.value as MapStyle)}
            >
              <option value="satellite">🛰️ Satellite</option>
              <option value="streets">🗺️ Streets</option>
              <option value="outdoors">🏔️ Outdoors</option>
              <option value="light">☀️ Light</option>
              <option value="dark">🌙 Dark</option>
              <option value="satellite-streets">🛰️ Satellite Streets</option>
            </StyleSelect>
            <ViewButton 
              $active={currentView === 'globe'} 
              onClick={() => handleViewChange('globe')}
            >
              🌍 Globe
            </ViewButton>
            <ViewButton 
              $active={currentView === 'flat'} 
              onClick={() => handleViewChange('flat')}
            >
              📐 Flat
            </ViewButton>
            <CloseButton onClick={handleCloseFullscreen} title="Close fullscreen">
              <Minimize2 size={16} />
            </CloseButton>
          </FullscreenControls>
        </FullscreenHeader>
        
        <FullscreenMapWrapper>
          <div ref={fullscreenMapContainer} style={{ width: '100%', height: '100%' }} />
          
          {latitude && longitude && (
            <LocationInfo>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                📍 Your Location
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.25rem' }}>
                {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.25rem' }}>
                Last updated: {currentLocation?.timestamp ? new Date(currentLocation.timestamp).toLocaleTimeString() : 'Unknown'}
              </div>
            </LocationInfo>
          )}
        </FullscreenMapWrapper>
      </FullscreenOverlay>
    </>
  );
};

export default MapboxMap;
