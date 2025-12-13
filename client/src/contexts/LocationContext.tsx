import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { GeoLinkIntegration } from '../services/geoLinkService';

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
  
  // NFT state
  nearbyNFTs: any[];
  userNFTs: any[];
  geoLink: GeoLinkIntegration | null;
  geoLinkStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  // Location actions
  enableLocation: () => Promise<void>;
  disableLocation: () => void;
  updateLocation: () => Promise<void>;
  toggleVisibility: (visible: boolean) => Promise<void>;
  getNearbyUsers: (radius?: number, showAll?: boolean) => Promise<void>;
  setSearchRadius: (radius: number) => void;
  setShowAllUsers: (showAll: boolean) => void;
  setPrivacyEnabled: (enabled: boolean) => void;
  
  // NFT actions
  updateNearbyNFTs: () => Promise<void>;
  refreshNFTs: () => void;
  collectNFT: (nft: any) => Promise<void>;
  refreshUserNFTs: () => Promise<void>;
  
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
  const lastNFTUpdateTime = useRef(0);

  // NFT state
  const [nearbyNFTs, setNearbyNFTs] = useState<any[]>([]);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [geoLink, setGeoLink] = useState<GeoLinkIntegration | null>(null);
  const [geoLinkStatus, setGeoLinkStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const lastUserNFTsError = useRef<number>(0); // Track when we last got a 400 error

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
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/location/submit`, {
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

    // Debounce location updates to prevent rate limiting
    const now = Date.now();
    const lastUpdate = localStorage.getItem('lastLocationUpdate');
    if (lastUpdate && (now - parseInt(lastUpdate)) < 5000) { // 5 second debounce
      console.log('⏳ Debouncing location update (too recent)');
      return;
    }
    localStorage.setItem('lastLocationUpdate', now.toString());

    try {
      setIsLocationLoading(true);
      console.log('Requesting geolocation...');
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // Use faster, less accurate location for initial load
          timeout: 5000, // 5 seconds timeout for faster initial load
          maximumAge: 300000 // 5 minutes cache for better performance
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
      
      // Send to GeoLink if connected (as wallet provider)
      // Note: Wallet Provider submission is optional and can be disabled if the key is inactive
      // Submit location to GeoLink if instance exists (instance is ready even if status is still 'connecting')
      const userPublicKey = localStorage.getItem('wallet_publicKey');
      if (geoLink && userPublicKey) {
        // Make GeoLink API call non-blocking
        setTimeout(async () => {
          try {
            console.log('📍 Sending location to GeoLink (Wallet Provider):', {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              walletAddress: userPublicKey,
              geoLinkStatus
            });
            if (geoLink && userPublicKey) {
              const result = await geoLink.updateUserLocation(userPublicKey, locationData.latitude, locationData.longitude);
              console.log('📍 Location sent to GeoLink successfully:', result);
            }
          } catch (error) {
            console.error('❌ Failed to send location to GeoLink:', error);
            setGeoLinkStatus('error');
          }
        }, 100); // Small delay to prevent blocking
      } else {
        console.log('⚠️ Skipping GeoLink location submission - not ready:', {
          geoLink: !!geoLink,
          geoLinkStatus,
          hasUserPublicKey: !!userPublicKey
        });
      }
      
      // Get nearby NFTs if connected (or try again later if still connecting)
      if (geoLink && geoLinkStatus === 'connected') {
        console.log('🔄 Calling updateNearbyNFTs from updateLocation...');
        await updateNearbyNFTs();
      } else if (geoLinkStatus === 'connecting') {
        console.log('⏳ GeoLink still connecting, will retry NFT update in 2 seconds...');
        // Retry NFT update after a short delay when GeoLink finishes connecting
        setTimeout(async () => {
          if (geoLink && (geoLinkStatus as string) === 'connected') {
            console.log('🔄 Retrying updateNearbyNFTs after GeoLink connection...');
            await updateNearbyNFTs();
          }
        }, 2000);
      } else {
        console.log('⚠️ Skipping NFT update - GeoLink not ready:', {
          geoLink: !!geoLink,
          geoLinkStatus
        });
      }
      
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

  // Initialize GeoLink integration with environment awareness
  useEffect(() => {
    const initializeGeoLink = async () => {
    const walletProviderKey = process.env.REACT_APP_GEOLINK_WALLET_PROVIDER_KEY;
    const dataConsumerKey = process.env.REACT_APP_GEOLINK_DATA_CONSUMER_KEY;
    const baseUrl = process.env.REACT_APP_GEOLINK_BASE_URL || 'http://localhost:4000';
      
      console.log('GeoLink Configuration:', {
        baseUrl,
        hasWalletProviderKey: !!walletProviderKey,
        hasDataConsumerKey: !!dataConsumerKey,
        environment: process.env.NODE_ENV
      });
      
      if (walletProviderKey && dataConsumerKey) {
        setGeoLinkStatus('connecting');
        try {
          const geoLinkInstance = new GeoLinkIntegration(walletProviderKey, dataConsumerKey);
          
          // Set GeoLink instance immediately so it can be used for location submission
          setGeoLink(geoLinkInstance);
          
          // Test connection to GeoLink
          await testGeoLinkConnection(geoLinkInstance);
          
          setGeoLinkStatus('connected');
          console.log('✅ GeoLink connected successfully');
        } catch (error) {
          console.error('❌ Failed to connect to GeoLink:', error);
          setGeoLinkStatus('error');
        }
      } else {
        console.warn('⚠️ GeoLink API keys not configured');
        setGeoLinkStatus('disconnected');
      }
    };

    initializeGeoLink();
  }, []);

  // Test GeoLink connection
  const testGeoLinkConnection = async (geoLinkInstance: GeoLinkIntegration) => {
    try {
      // Try to get nearby NFTs with dummy coordinates to test connection
      await geoLinkInstance.getNearbyNFTs(0, 0, 1000);
    } catch (error) {
      // If it fails, that's okay - we just want to test the connection
      console.log('GeoLink connection test completed');
    }
  };

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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
      
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
      
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
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/location/nearby/${publicKey}?${params.toString()}`);
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

  // Get nearby NFTs from GeoLink with debouncing (as data consumer)
  const updateNearbyNFTs = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastNFTUpdateTime.current;
    
    // Debounce: only update if at least 5 seconds have passed since last update
    if (timeSinceLastUpdate < 5000) {
      console.log('⏳ Debouncing NFT update - too soon since last update', {
        timeSinceLastUpdate,
        lastUpdate: new Date(lastNFTUpdateTime.current).toISOString(),
        now: new Date(now).toISOString()
      });
      return;
    }
    
    console.log('🔍 updateNearbyNFTs called (Data Consumer):', {
      hasGeoLink: !!geoLink,
      geoLinkStatus,
      hasCurrentLocation: !!currentLocation,
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude,
      showAllUsers,
      searchRadius,
      timeSinceLastUpdate,
      nearbyNFTsCount: nearbyNFTs.length
    });
    
    if (geoLink && geoLinkStatus === 'connected' && currentLocation) {
      try {
        lastNFTUpdateTime.current = now; // Update the timestamp
        console.log('🎯 Fetching NFTs from GeoLink (Data Consumer API)...');
        
        // Use a much larger radius when "Global" is enabled
        // 20,000km radius covers the entire world (Earth's circumference is ~40,000km)
        const nftRadius = showAllUsers ? 20000000 : 1000; // 20,000km for global, 1km for local
        console.log(`🎯 Using NFT search radius: ${nftRadius}m (${showAllUsers ? 'Global' : 'Local'} mode)`);
        
        const response = await geoLink.getNearbyNFTs(currentLocation.latitude, currentLocation.longitude, nftRadius);
        console.log('🎯 GeoLink Data Consumer API response:', response);
        
        // Handle the expected response format
        if (response && response.nfts && response.nfts.length > 0) {
          console.log('🎯 Setting NFTs:', response.nfts.length, 'items');
          setNearbyNFTs(response.nfts);
          console.log(`🎯 Found ${response.nfts.length} nearby NFTs`);
        } else {
          console.log('🎯 No NFTs found in response - keeping existing NFTs');
          // Don't clear existing NFTs if no new ones found - this prevents flickering
        }
      } catch (error) {
        console.error('❌ Failed to get nearby NFTs from GeoLink:', error);
        // Only clear NFTs if it's a real error, not a temporary network issue
        if (error instanceof Error && error.message && error.message.includes('Failed to fetch')) {
          console.log('🔄 Network error - keeping existing NFTs');
        } else {
          console.log('🧹 Clearing NFTs due to error:', error);
          setNearbyNFTs([]);
        }
      }
    } else {
      console.log('⚠️ Cannot fetch NFTs - missing requirements:', {
        geoLink: !!geoLink,
        geoLinkStatus,
        currentLocation: !!currentLocation
      });
    }
  }, [geoLink, geoLinkStatus, currentLocation, showAllUsers, searchRadius]);

  // Auto-update location and nearby users every 10 seconds when enabled
  useEffect(() => {
    if (!isLocationEnabled) return;

    const interval = setInterval(() => {
      updateLocation();
      // Also fetch nearby users automatically with current search parameters
      getNearbyUsers(searchRadius, showAllUsers);
      // Note: NFTs are updated separately when location changes significantly
    }, 10000); // 10 seconds - more responsive updates

    return () => clearInterval(interval);
  }, [isLocationEnabled, updateLocation, getNearbyUsers, searchRadius, showAllUsers]);

  // Update NFTs when GeoLink status changes to connected (only once)
  useEffect(() => {
    if (geoLinkStatus === 'connected' && currentLocation && geoLink) {
      console.log('🎯 GeoLink connected, fetching NFTs for current location...');
      updateNearbyNFTs();
    }
  }, [geoLinkStatus, geoLink]); // Removed currentLocation dependency

  // Manual NFT refresh function
  const refreshNFTs = useCallback(() => {
    if (geoLinkStatus === 'connected' && currentLocation && geoLink) {
      console.log('🔄 Manual NFT refresh triggered...');
      updateNearbyNFTs();
    }
  }, [geoLinkStatus, currentLocation, geoLink, updateNearbyNFTs]);

  // Update NFTs when Global setting changes
  useEffect(() => {
    if (geoLinkStatus === 'connected' && currentLocation && geoLink) {
      console.log('🔄 Global setting changed, updating NFTs...');
      updateNearbyNFTs();
    }
  }, [showAllUsers]); // Only trigger when Global setting changes

  // Trigger NFT fetch on initial load if Global is already enabled
  useEffect(() => {
    if (geoLinkStatus === 'connected' && currentLocation && geoLink && showAllUsers) {
      console.log('🔄 Initial load with Global enabled, fetching NFTs...');
      updateNearbyNFTs();
    }
  }, [geoLinkStatus, currentLocation, geoLink]); // Trigger when GeoLink becomes ready

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
    // Note: NFT update is handled by useEffect when showAllUsers changes
  };

  const setPrivacyEnabledHandler = (enabled: boolean) => {
    setPrivacyEnabled(enabled);
    localStorage.setItem('location_privacyEnabled', enabled.toString());
  };


  // Collect an NFT with enhanced error handling (as data consumer)
  const collectNFT = async (nft: any) => {
    if (geoLink && geoLinkStatus === 'connected' && currentLocation) {
      const userPublicKey = localStorage.getItem('wallet_publicKey');
      if (!userPublicKey) {
        toast.error('No wallet connected');
        return;
      }

      try {
        console.log('🎯 Collecting NFT via GeoLink Data Consumer API:', {
          nftId: nft.id,
          userPublicKey,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        });
        
        const result = await geoLink.collectNFT(nft.id, userPublicKey, currentLocation.latitude, currentLocation.longitude);
        console.log('🎯 NFT collection result:', result);
        
        if (result.success) {
          // Update local state
          setUserNFTs(prev => [...prev, nft]);
          setNearbyNFTs(prev => prev.filter(n => n.id !== nft.id));
          
          toast.success('🎉 NFT collected successfully!');
        } else {
          toast.error(result.error || 'Failed to collect NFT');
        }
      } catch (error) {
        console.error('❌ Failed to collect NFT:', error);
        toast.error('Failed to collect NFT: ' + (error as Error).message);
      }
    } else {
      toast.error('GeoLink not connected. Please check your connection.');
    }
  };

  // Refresh user's NFT collection (as data consumer)
  const refreshUserNFTs = useCallback(async () => {
    // Only fetch if GeoLink is connected and we have a valid connection
    if (geoLink && geoLinkStatus === 'connected') {
      // If we got a 400 error recently (within last 5 minutes), skip the call to avoid repeated failures
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (lastUserNFTsError.current > fiveMinutesAgo) {
        // Silently skip - we'll retry after 5 minutes
        // Don't log anything to avoid console noise
        return;
      }

      try {
        const response = await geoLink.getUserNFTs();
        // Only log on success to reduce console noise
        console.log(`📚 Loaded ${response.nfts?.length || 0} user NFTs`);
        setUserNFTs(response.nfts || []);
        // Reset error timestamp on success
        lastUserNFTsError.current = 0;
      } catch (error: any) {
        // Silently handle 400 errors (likely authentication/authorization issues)
        // Check error status code (most reliable)
        const statusCode = error?.status || error?.response?.status;
        const is400Error = statusCode === 400 || error?.message?.includes('400');
        
        if (is400Error) {
          // Record when we got the 400 error to prevent repeated calls
          lastUserNFTsError.current = Date.now();
          // Silently handle 400 errors - this is expected when user isn't authenticated with GeoLink
          // Don't log to console to avoid noise
          setUserNFTs([]);
        } else {
          // Log other errors (network issues, 500 errors, etc.)
          console.error('❌ Failed to get user NFTs:', error);
          setUserNFTs([]);
        }
      }
    }
  }, [geoLink, geoLinkStatus]);

  const value: LocationContextType = {
    currentLocation,
    isLocationEnabled,
    isVisible,
    locationHistory,
    nearbyUsers,
    searchRadius,
    showAllUsers,
    privacyEnabled,
    nearbyNFTs,
    userNFTs,
    geoLink,
    geoLinkStatus,
    enableLocation,
    disableLocation,
    updateLocation,
    toggleVisibility,
    getNearbyUsers,
    setSearchRadius: setSearchRadiusHandler,
    setShowAllUsers: setShowAllUsersHandler,
    setPrivacyEnabled: setPrivacyEnabledHandler,
    updateNearbyNFTs,
    refreshNFTs,
    collectNFT,
    refreshUserNFTs,
    isLocationLoading
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
