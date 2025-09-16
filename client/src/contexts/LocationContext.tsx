import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  ipAddress: string;
}

interface LocationContextType {
  // Location state
  currentLocation: LocationData | null;
  isLocationEnabled: boolean;
  isVisible: boolean;
  locationHistory: LocationData[];
  nearbyUsers: any[];
  
  // Location actions
  enableLocation: () => Promise<void>;
  disableLocation: () => void;
  updateLocation: () => Promise<void>;
  toggleVisibility: (visible: boolean) => Promise<void>;
  getNearbyUsers: (radius?: number) => Promise<void>;
  
  // Loading states
  isLocationLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const submitLocationToBackend = async (locationData: LocationData) => {
    try {
      const response = await fetch('http://localhost:5000/api/location/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: localStorage.getItem('wallet_publicKey'),
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: locationData.timestamp,
          ipAddress: locationData.ipAddress
        }),
      });

      if (!response.ok) {
        console.error('Failed to submit location to backend');
      }
    } catch (error) {
      console.error('Error submitting location to backend:', error);
      
      // Check if it's a connection error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Server is not running. Location data will be cached locally.');
        // Store location data locally when server is unavailable
        const cachedLocations = JSON.parse(localStorage.getItem('cachedLocations') || '[]');
        cachedLocations.push(locationData);
        localStorage.setItem('cachedLocations', JSON.stringify(cachedLocations));
      }
    }
  };

  const updateLocation = useCallback(async () => {
    if (!navigator.geolocation || !isLocationEnabled) return;

    try {
      setIsLocationLoading(true);
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000, // Increased to 15 seconds
          maximumAge: 10000 // 10 seconds for more frequent updates
        });
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString(),
        ipAddress: ''
      };

      setCurrentLocation(locationData);
      
      // Submit location to backend
      await submitLocationToBackend(locationData);
      
      // Update location history
      setLocationHistory(prev => [...prev.slice(-49), locationData]);
      
    } catch (error) {
      console.error('Error updating location:', error);
      
      // Don't show toast for timeout errors to avoid spam
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.TIMEOUT) {
          console.warn('Location update timed out, will retry on next interval');
        } else if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission denied');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error('Location unavailable');
        }
      } else {
        toast.error('Failed to update location');
      }
    } finally {
      setIsLocationLoading(false);
    }
  }, [isLocationEnabled, submitLocationToBackend]);

  // Load location settings from localStorage on mount
  useEffect(() => {
    const savedLocationEnabled = localStorage.getItem('location_enabled') === 'true';
    const savedVisibility = localStorage.getItem('location_visible') === 'true';
    
    setIsLocationEnabled(savedLocationEnabled);
    setIsVisible(savedVisibility);
    
    if (savedLocationEnabled) {
      updateLocation();
    }
  }, [updateLocation]);

  const enableLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    try {
      setIsLocationLoading(true);
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000, // Increased to 15 seconds
          maximumAge: 300000 // 5 minutes
        });
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString(),
        ipAddress: '' // Will be filled by backend
      };

      setCurrentLocation(locationData);
      setIsLocationEnabled(true);
      
      // Save to localStorage
      localStorage.setItem('location_enabled', 'true');
      
      // Submit location to backend
      await submitLocationToBackend(locationData);
      
      toast.success('Location services enabled');
    } catch (error) {
      console.error('Error enabling location:', error);
      toast.error('Failed to enable location services');
    } finally {
      setIsLocationLoading(false);
    }
  };

  const disableLocation = () => {
    setIsLocationEnabled(false);
    setCurrentLocation(null);
    setLocationHistory([]);
    setNearbyUsers([]);
    
    // Clear localStorage
    localStorage.removeItem('location_enabled');
    localStorage.removeItem('location_visible');
    
    toast.success('Location services disabled');
  };

  const toggleVisibility = async (visible: boolean) => {
    try {
      setIsLocationLoading(true);
      
      const response = await fetch('http://localhost:5000/api/location/toggle-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: localStorage.getItem('wallet_publicKey'),
          isVisible: visible
        }),
      });

      if (response.ok) {
        setIsVisible(visible);
        localStorage.setItem('location_visible', visible.toString());
        toast.success(`Visibility ${visible ? 'enabled' : 'disabled'}`);
      } else {
        toast.error('Failed to update visibility');
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      
      // Check if it's a connection error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Server is not running. Updating visibility locally.');
        setIsVisible(visible);
        localStorage.setItem('location_visible', visible.toString());
        toast.success(`Visibility ${visible ? 'enabled' : 'disabled'} (offline mode)`);
      } else {
        toast.error('Failed to update visibility');
      }
    } finally {
      setIsLocationLoading(false);
    }
  };

  const getNearbyUsers = async (radius: number = 10) => {
    const publicKey = localStorage.getItem('wallet_publicKey');
    if (!publicKey) {
      toast.error('No wallet connected');
      return;
    }

    try {
      setIsLocationLoading(true);
      
      const response = await fetch(`http://localhost:5000/api/location/nearby/${publicKey}?radius=${radius}`);
      const data = await response.json();
      
      if (response.ok) {
        setNearbyUsers(data.nearbyUsers);
      } else {
        toast.error('Failed to fetch nearby users');
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      
      // Check if it's a connection error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Server is not running. Skipping nearby users fetch.');
        setNearbyUsers([]); // Clear nearby users when server is unavailable
      } else {
        toast.error('Failed to fetch nearby users');
      }
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Auto-update location every 15 seconds when enabled for better accuracy
  useEffect(() => {
    if (!isLocationEnabled) return;

    const interval = setInterval(() => {
      updateLocation();
    }, 15000); // 15 seconds - reduced frequency to prevent timeout issues

    return () => clearInterval(interval);
  }, [isLocationEnabled, updateLocation]);

  const value: LocationContextType = {
    currentLocation,
    isLocationEnabled,
    isVisible,
    locationHistory,
    nearbyUsers,
    enableLocation,
    disableLocation,
    updateLocation,
    toggleVisibility,
    getNearbyUsers,
    isLocationLoading
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
