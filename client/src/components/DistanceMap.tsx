import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styled from 'styled-components';
import { useLocation } from '../contexts/LocationContext';

interface DistanceMapProps {
  targetLatitude: number;
  targetLongitude: number;
  radiusMeters?: number;
  showRadius?: boolean;
  height?: string;
}

export const DistanceMap: React.FC<DistanceMapProps> = ({
  targetLatitude,
  targetLongitude,
  radiusMeters,
  showRadius = false,
  height = '200px'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { currentLocation } = useLocation();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Calculate center point - use target as center if we have radius, otherwise midpoint
    const userLat = currentLocation?.latitude || targetLatitude;
    const userLng = currentLocation?.longitude || targetLongitude;
    
    // If we have a radius, center on the target and zoom to show the full radius
    let centerLat: number;
    let centerLng: number;
    let zoom: number;
    
    if (showRadius && radiusMeters) {
      // Center on the target location
      centerLat = targetLatitude;
      centerLng = targetLongitude;
      
      // Calculate zoom level to show the entire radius circle
      // Convert radius from meters to degrees (approximate)
      const radiusInDegrees = radiusMeters / 111000;
      // Calculate zoom level based on radius
      // Larger radius = lower zoom level
      if (radiusMeters > 50000) {
        zoom = 9;
      } else if (radiusMeters > 20000) {
        zoom = 10;
      } else if (radiusMeters > 10000) {
        zoom = 11;
      } else if (radiusMeters > 5000) {
        zoom = 12;
      } else if (radiusMeters > 2000) {
        zoom = 13;
      } else if (radiusMeters > 1000) {
        zoom = 14;
      } else if (radiusMeters > 500) {
        zoom = 15;
      } else {
        zoom = 16;
      }
    } else {
      // No radius, center between user and target
      centerLat = (userLat + targetLatitude) / 2;
      centerLng = (userLng + targetLongitude) / 2;
      
      // Calculate distance to determine zoom level
      const distance = calculateDistance(userLat, userLng, targetLatitude, targetLongitude);
      zoom = distance > 1000 ? 12 : distance > 500 ? 13 : distance > 100 ? 14 : 16;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [centerLng, centerLat],
      zoom: zoom,
      interactive: true,
      attributionControl: false
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add user location marker
      if (currentLocation) {
        const userEl = document.createElement('div');
        userEl.style.cssText = `
          width: 20px;
          height: 20px;
          background: #4ade80;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;
        new mapboxgl.Marker(userEl)
          .setLngLat([userLng, userLat])
          .addTo(map.current);
      }

      // Add target marker
      const targetEl = document.createElement('div');
      targetEl.style.cssText = `
        width: 20px;
        height: 20px;
        background: #8b5cf6;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      `;
      new mapboxgl.Marker(targetEl)
        .setLngLat([targetLongitude, targetLatitude])
        .addTo(map.current);

      // Add dotted line between user and target
      if (currentLocation) {
        const lineId = 'distance-line';
        const lineSourceId = 'distance-line-source';
        
        map.current.addSource(lineSourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[userLng, userLat], [targetLongitude, targetLatitude]]
            },
            properties: {}
          }
        });

        map.current.addLayer({
          id: lineId,
          type: 'line',
          source: lineSourceId,
          paint: {
            'line-color': '#8b5cf6',
            'line-width': 2,
            'line-dasharray': [2, 2],
            'line-opacity': 0.8
          }
        });
      }

      // Add radius circle if requested
      if (showRadius && radiusMeters && map.current) {
        const radiusSourceId = 'radius-source';
        const radiusLayerId = 'radius-layer';
        
        const radiusInDegrees = radiusMeters / 111000;
        const circlePoints: [number, number][] = Array.from({ length: 32 }, (_, i) => {
          const angle = (i / 32) * 2 * Math.PI;
          const x = targetLongitude + radiusInDegrees * Math.cos(angle);
          const y = targetLatitude + radiusInDegrees * Math.sin(angle);
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
        
        map.current.addSource(radiusSourceId, {
          type: 'geojson',
          data: circle
        });
        
        map.current.addLayer({
          id: radiusLayerId,
          type: 'line',
          source: radiusSourceId,
          paint: {
            'line-color': '#ff6b6b',
            'line-width': 2,
            'line-opacity': 0.6
          }
        });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [targetLatitude, targetLongitude, radiusMeters, showRadius, currentLocation]);

  const distance = currentLocation 
    ? calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        targetLatitude,
        targetLongitude
      )
    : 0;

  const isInRange = radiusMeters ? distance <= radiusMeters : false;

  return (
    <MapContainer>
      <MapWrapper ref={mapContainer} style={{ height }} />
      <MapInfo>
        <DistanceInfo>
          <DistanceValue>{Math.round(distance)}m</DistanceValue>
          <DistanceLabel>away</DistanceLabel>
        </DistanceInfo>
        {showRadius && radiusMeters && (
          <RangeStatus $inRange={isInRange}>
            {isInRange ? '✅ In Range' : '❌ Out of Range'}
          </RangeStatus>
        )}
      </MapInfo>
    </MapContainer>
  );
};

const MapContainer = styled.div`
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const MapWrapper = styled.div`
  width: 100%;
  border-radius: 12px;
`;

const MapInfo = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
`;

const DistanceInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const DistanceValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: white;
`;

const DistanceLabel = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
`;

const RangeStatus = styled.div<{ $inRange: boolean }>`
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.$inRange ? '#4ade80' : '#ef4444'};
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;
