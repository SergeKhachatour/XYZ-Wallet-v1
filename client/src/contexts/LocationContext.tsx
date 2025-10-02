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
  searchRadius: number;
  showAllUsers: boolean;
  privacyEnabled: boolean;
  
  // Location actions
  enableLocation: () => Promise<void>;
  disableLocation: () => void;
  updateLocation: () => Promise<void>;
  toggleVisibility: (visible: boolean) => Promise<void>;
  getNearbyUsers: (radius?: number, showAll?: boolean) => Promise<void>;
  setSearchRadius: (radius: number) => void;
  setShowAllUsers: (showAll: boolean) => void;
  setPrivacyEnabled: (enabled: boolean) => void;
  
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
  const [searchRadius, setSearchRadius] = useState(() => {
    const saved = localStorage.getItem('location_searchRadius');
    return saved ? parseInt(saved) : 10;
  });
  const [showAllUsers, setShowAllUsers] = useState(() => {
    const saved = localStorage.getItem('location_showAllUsers');
    return saved === 'true';
  });
  const [privacyEnabled, setPrivacyEnabled] = useState(() => {
    const saved = localStorage.getItem('location_privacyEnabled');
    return saved === 'true' || saved === null; // Default to true (privacy on by default)
  });
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const hasCalledUpdateOnMount = useRef(false);

  const submitLocationToBackend = useCallback(async (locationData: LocationData) => {
    try {
      // Apply privacy offset if privacy is enabled
      let latitude = locationData.latitude;
      let longitude = locationData.longitude;
      
      if (privacyEnabled) {
        // Generate random offset within 100 meters for privacy
        const radiusMeters = 100;
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radiusMeters;
        
        // Convert meters to approximate degrees
        const latOffset = (distance / 111000) * Math.cos(angle);
        const lngOffset = (distance / (111000 * Math.cos(latitude * Math.PI / 180))) * Math.sin(angle);
        
        latitude += latOffset;
        longitude += lngOffset;
      }
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/location/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: localStorage.getItem('wallet_publicKey'),
          latitude: latitude,
          longitude: longitude,
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
  }, [privacyEnabled]);

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
    
    // Sync visibility state with backend if location is enabled
    if (savedLocationEnabled && savedVisibility) {
      console.log('Syncing visibility state with backend on app load...');
      syncVisibilityWithBackend(savedVisibility);
    }
    
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

  const syncVisibilityWithBackend = async (visible: boolean) => {
    try {
      const publicKey = localStorage.getItem('wallet_publicKey');
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      console.log('Syncing visibility with backend:', { publicKey, visible, backendUrl });
      
      const response = await fetch(`${backendUrl}/api/location/toggle-visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey,
          isVisible: visible
        }),
      });

      console.log('Sync visibility response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Sync visibility response data:', data);
        console.log('Visibility state synced with backend successfully');
      } else {
        console.warn('Failed to sync visibility with backend, but continuing...');
      }
    } catch (error) {
      console.error('Error syncing visibility with backend:', error);
      // Don't show error toast for sync, just log it
    }
  };

  const toggleVisibility = async (visible: boolean) => {
    try {
      setIsLocationLoading(true);
      
      const publicKey = localStorage.getItem('wallet_publicKey');
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      console.log('Toggling visibility:', { publicKey, visible, backendUrl });
      
      const response = await fetch(`${backendUrl}/api/location/toggle-visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey,
          isVisible: visible
        }),
      });

      console.log('Visibility response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Visibility response data:', data);
        setIsVisible(visible);
        localStorage.setItem('location_visible', visible.toString());
        toast.success(`Visibility ${visible ? 'enabled' : 'disabled'}`);
      } else {
        const errorData = await response.json();
        console.error('Visibility API error:', errorData);
        toast.error(`Failed to update visibility: ${errorData.error || 'Unknown error'}`);
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

  const getNearbyUsers = useCallback(async (radius: number = 10, showAll: boolean = false) => {
    const publicKey = localStorage.getItem('wallet_publicKey');
    if (!publicKey) {
      toast.error('No wallet connected');
      return;
    }

    try {
      setIsLocationLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (showAll) {
        params.append('showAll', 'true');
      } else {
        params.append('radius', radius.toString());
      }
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/location/nearby/${publicKey}?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setNearbyUsers(data.nearbyUsers || []);
        setSearchRadius(radius);
        setShowAllUsers(showAll);
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

  // Auto-update location and nearby users every 10 seconds when enabled
  useEffect(() => {
    if (!isLocationEnabled) return;

    const interval = setInterval(() => {
      updateLocation();
      // Also fetch nearby users automatically with current search parameters
      getNearbyUsers(searchRadius, showAllUsers);
    }, 10000); // 10 seconds - more responsive updates

    return () => clearInterval(interval);
  }, [isLocationEnabled, updateLocation, getNearbyUsers, searchRadius, showAllUsers]);

  const setSearchRadiusHandler = (radius: number) => {
    setSearchRadius(radius);
    setShowAllUsers(false);
    localStorage.setItem('location_searchRadius', radius.toString());
    localStorage.setItem('location_showAllUsers', 'false');
  };

  const setShowAllUsersHandler = (showAll: boolean) => {
    setShowAllUsers(showAll);
    localStorage.setItem('location_showAllUsers', showAll.toString());
    if (showAll) {
      setSearchRadius(10); // Reset to default when global is on
      localStorage.setItem('location_searchRadius', '10');
    }
  };

  const setPrivacyEnabledHandler = (enabled: boolean) => {
    setPrivacyEnabled(enabled);
    localStorage.setItem('location_privacyEnabled', enabled.toString());
  };

  const value: LocationContextType = {
    currentLocation,
    isLocationEnabled,
    isVisible,
    locationHistory,
    nearbyUsers,
    searchRadius,
    showAllUsers,
    privacyEnabled,
    enableLocation,
    disableLocation,
    updateLocation,
    toggleVisibility,
    getNearbyUsers,
    setSearchRadius: setSearchRadiusHandler,
    setShowAllUsers: setShowAllUsersHandler,
    setPrivacyEnabled: setPrivacyEnabledHandler,
    isLocationLoading
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
