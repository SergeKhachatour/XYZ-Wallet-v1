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
  height: 500px;
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    height: 450px;
    padding: 1rem;
  }
  
  @media (max-width: 480px) {
    height: 400px;
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

const MapboxMap: React.FC = () => {
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
  const { 
    currentLocation, 
    isLocationEnabled, 
    enableLocation, 
    nearbyUsers,
    searchRadius,
    showAllUsers,
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

  // Function to generate random offset within radius for privacy
  const generatePrivacyOffset = (radiusMeters: number = 30) => {
    // Generate random angle and distance within the radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusMeters;
    
    // Convert meters to approximate degrees (rough conversion)
    const latOffset = (distance / 111000) * Math.cos(angle);
    const lngOffset = (distance / (111000 * Math.cos(0))) * Math.sin(angle);
    
    return { latOffset, lngOffset };
  };

  // Function to update nearby user markers with privacy radius
  const updateNearbyMarkers = (mapInstance: mapboxgl.Map, markersRef: React.MutableRefObject<mapboxgl.Marker[]>) => {
    // Check if map is loaded and ready
    if (!mapInstance.isStyleLoaded()) {
      console.log('Map style not loaded yet, waiting...');
      mapInstance.on('styledata', () => {
        console.log('Map style loaded, updating markers...');
        updateNearbyMarkers(mapInstance, markersRef);
      });
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
      const lineLayerId = `${layerId}-line`;
      const pulseLayerId = `${layerId}-pulse`;
      
      if (mapInstance.getSource && mapInstance.getSource(sourceId)) {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.removeLayer(layerId);
        }
        if (mapInstance.getLayer(lineLayerId)) {
          mapInstance.removeLayer(lineLayerId);
        }
        if (mapInstance.getLayer(pulseLayerId)) {
          mapInstance.removeLayer(pulseLayerId);
        }
        mapInstance.removeSource(sourceId);
      }
    }

    // Add markers for nearby users with privacy offset
    nearbyUsers.forEach((user, index) => {
      if (user.latitude && user.longitude) {
        // Generate privacy offset (30 meters radius)
        const { latOffset, lngOffset } = generatePrivacyOffset(30);
        
        // Calculate approximate location within radius
        const approximateLat = user.latitude + latOffset;
        const approximateLng = user.longitude + lngOffset;
        
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
            <div style="
              position: absolute;
              top: -8px;
              left: -8px;
              width: 20px;
              height: 20px;
              background-image: url('/stellar-location.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              border-radius: 50%;
              border: 2px solid white;
              z-index: 10;
            "></div>
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
          .setLngLat([approximateLng, approximateLat])
          .addTo(mapInstance);
        
        markersRef.current.push(userMarker);
        
        // Add privacy radius circle (optional - can be enabled/disabled)
        // This shows a circle around the approximate location to indicate privacy radius
        console.log(`Adding privacy radius circle for user ${index} at approximate location:`, { approximateLat, approximateLng });
        if (mapInstance.getSource && mapInstance.addLayer) {
          const sourceId = `privacy-radius-${index}`;
          const layerId = `privacy-radius-layer-${index}`;
          
          // Remove existing source and layer if they exist
          if (mapInstance.getSource(sourceId)) {
            if (mapInstance.getLayer(layerId)) {
              mapInstance.removeLayer(layerId);
            }
            const lineLayerId = `${layerId}-line`;
            const pulseLayerId = `${layerId}-pulse`;
            if (mapInstance.getLayer(lineLayerId)) {
              mapInstance.removeLayer(lineLayerId);
            }
            if (mapInstance.getLayer(pulseLayerId)) {
              mapInstance.removeLayer(pulseLayerId);
            }
            mapInstance.removeSource(sourceId);
          }
          
          // Create circle geometry for privacy radius (100 meters for better visibility)
          const radiusInDegrees = 100 / 111000; // Convert 100 meters to degrees
          const circlePoints: [number, number][] = Array.from({ length: 64 }, (_, i) => {
            const angle = (i / 64) * 2 * Math.PI;
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
            
            // Add fill layer for the circle background
            mapInstance.addLayer({
              id: layerId,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': 'rgba(255, 0, 0, 0.15)',
                'fill-outline-color': 'rgba(255, 0, 0, 0.5)'
              }
            });
            
            // Add line layer for the circle outline with pulsating effect
            const lineLayerId = `${layerId}-line`;
            mapInstance.addLayer({
              id: lineLayerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': '#ff0000',
                'line-width': 4,
                'line-opacity': 0.8
              }
            });
            
            // Add a second pulsating line layer for animation effect
            const pulseLayerId = `${layerId}-pulse`;
            mapInstance.addLayer({
              id: pulseLayerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': '#ff4444',
                'line-width': 2,
                'line-opacity': 0.6,
                'line-dasharray': [2, 2]
              }
            });
            
            console.log(`Privacy radius circle added for user ${index} at approximate location:`, { approximateLat, approximateLng });
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

    if (mapContainer.current && !map.current) {
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
      
      // Track user interaction to prevent auto-centering after user has moved the map
      map.current.on('moveend', () => {
        setHasUserInteracted(true);
      });
      
      map.current.on('zoomend', () => {
        setHasUserInteracted(true);
      });

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
            <div style="
              position: absolute;
              top: -10px;
              left: -10px;
              width: 24px;
              height: 24px;
              background-image: url('/stellar-location.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              border-radius: 50%;
              border: 2px solid white;
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
          zoom: currentView === 'globe' ? 1 : 2,
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
      
      // Only center map on user location if user hasn't interacted with the map yet
      if (!hasUserInteracted) {
        map.current.easeTo({
          center: [longitude, latitude],
          zoom: currentView === 'globe' ? 1 : 2,
          duration: 2000
        });
      }

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

  // Update nearby user markers when nearbyUsers changes
  useEffect(() => {
    if (map.current) {
      updateNearbyMarkers(map.current, nearbyMarkers);
    }
    
    // Also update fullscreen map if it exists
    if (fullscreenMap.current) {
      updateNearbyMarkers(fullscreenMap.current, nearbyMarkers);
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
            <div style="
              position: absolute;
              top: -10px;
              left: -10px;
              width: 24px;
              height: 24px;
              background-image: url('/stellar-location.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              border-radius: 50%;
              border: 2px solid white;
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
      const newZoom = view === 'globe' ? 1 : 2;
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
            🌍 <span>Global Map</span>
          </MapTitle>
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
