import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
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
  const hasCalledUpdateOnMount = useRef(false);

  const submitLocationToBackend = useCallback(async (locationData: LocationData) => {
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
  }, []);

  const updateLocation = useCallback(async () => {
    console.log('updateLocation called - isLocationEnabled:', isLocationEnabled, 'navigator.geolocation:', !!navigator.geolocation);
    
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }
    
    if (!isLocationEnabled) {
      console.warn('Location not enabled');
      return;
    }

    try {
      setIsLocationLoading(true);
      console.log('Requesting geolocation...');
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000, // 15 seconds timeout
          maximumAge: 60000 // 60 seconds cache to match update interval
        });
      });

      console.log('Geolocation position received:', position.coords);

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString(),
        ipAddress: ''
      };

      console.log('Setting current location:', locationData);
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
          console.warn('Location permission denied');
          toast.error('Location permission denied');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          console.warn('Location unavailable');
          toast.error('Location unavailable');
        }
      } else {
        console.warn('Failed to update location:', error);
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
    
    console.log('Loading location settings from localStorage:', { savedLocationEnabled, savedVisibility });
    
    setIsLocationEnabled(savedLocationEnabled);
    setIsVisible(savedVisibility);
    
    if (savedLocationEnabled) {
      console.log('Location is enabled, will call updateLocation after state update...');
      // We'll call updateLocation in a separate useEffect that depends on isLocationEnabled
    } else {
      console.log('Location is not enabled, skipping updateLocation');
    }
  }, []); // Removed updateLocation dependency to prevent infinite loop

  // Separate effect to call updateLocation when isLocationEnabled becomes true (only on mount)
  useEffect(() => {
    if (isLocationEnabled && !hasCalledUpdateOnMount.current) {
      console.log('isLocationEnabled is now true, calling updateLocation...');
      hasCalledUpdateOnMount.current = true;
      updateLocation();
    }
  }, [isLocationEnabled, updateLocation]);

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

  const getNearbyUsers = useCallback(async (radius: number = 10) => {
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
  }, []);

  // Auto-update location every 60 seconds when enabled to prevent rate limiting
  useEffect(() => {
    if (!isLocationEnabled) return;

    const interval = setInterval(() => {
      updateLocation();
    }, 60000); // 60 seconds - increased interval to prevent rate limiting

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
