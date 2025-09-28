const express = require('express');
const router = express.Router();

// In-memory storage for location data (in production, use a database)
const locationData = new Map();

// Rate limiting for location submissions (prevent spam)
const rateLimitMap = new Map();
const lastSubmissionMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per user (more lenient for testing)
const MIN_INTERVAL_BETWEEN_REQUESTS = 5 * 1000; // Minimum 5 seconds between requests (reduced for testing)

// Rate limiting middleware
const rateLimitMiddleware = (req, res, next) => {
  const publicKey = req.body.publicKey;
  if (!publicKey) {
    return next();
  }

  // Skip rate limiting in development mode
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const now = Date.now();
  
  // Check minimum interval between requests
  const lastSubmission = lastSubmissionMap.get(publicKey);
  if (lastSubmission && (now - lastSubmission) < MIN_INTERVAL_BETWEEN_REQUESTS) {
    const waitTime = Math.ceil((MIN_INTERVAL_BETWEEN_REQUESTS - (now - lastSubmission)) / 1000);
    return res.status(429).json({
      error: 'Request too frequent',
      message: `Please wait ${waitTime} seconds before submitting another location update.`,
      retryAfter: waitTime
    });
  }

  const userRateLimit = rateLimitMap.get(publicKey) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  // Reset counter if window has expired
  if (now > userRateLimit.resetTime) {
    userRateLimit.count = 0;
    userRateLimit.resetTime = now + RATE_LIMIT_WINDOW;
  }

  // Check if user has exceeded rate limit
  if (userRateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many location submissions. Please wait ${Math.ceil((userRateLimit.resetTime - now) / 1000)} seconds before trying again.`,
      retryAfter: Math.ceil((userRateLimit.resetTime - now) / 1000)
    });
  }

  // Increment counter and update last submission time
  userRateLimit.count++;
  rateLimitMap.set(publicKey, userRateLimit);
  lastSubmissionMap.set(publicKey, now);

  next();
};

// Submit location data
router.post('/submit', rateLimitMiddleware, async (req, res) => {
  try {
    const { publicKey, latitude, longitude, timestamp, ipAddress } = req.body;
    
    // Validate required fields
    if (!publicKey || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: publicKey, latitude, longitude' 
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180' 
      });
    }

    const locationEntry = {
      publicKey,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: timestamp || new Date().toISOString(),
      ipAddress: ipAddress || req.ip,
      submittedAt: new Date().toISOString()
    };

    // Store location data
    if (!locationData.has(publicKey)) {
      locationData.set(publicKey, []);
    }
    
    const userLocations = locationData.get(publicKey);
    userLocations.push(locationEntry);
    
    // Keep only last 100 entries per user
    if (userLocations.length > 100) {
      userLocations.splice(0, userLocations.length - 100);
    }

    res.json({
      success: true,
      message: 'Location data submitted successfully',
      data: locationEntry
    });
  } catch (error) {
    console.error('Error submitting location:', error);
    res.status(500).json({ error: 'Failed to submit location data', details: error.message });
  }
});

// Get user's location history
router.get('/history/:publicKey', (req, res) => {
  try {
    const { publicKey } = req.params;
    const { limit = 50 } = req.query;
    
    const userLocations = locationData.get(publicKey) || [];
    const limitedLocations = userLocations.slice(-parseInt(limit));
    
    res.json({
      publicKey,
      locations: limitedLocations,
      totalCount: userLocations.length
    });
  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({ error: 'Failed to fetch location history', details: error.message });
  }
});

// Get current location (latest entry)
router.get('/current/:publicKey', (req, res) => {
  try {
    const { publicKey } = req.params;
    
    const userLocations = locationData.get(publicKey) || [];
    const currentLocation = userLocations[userLocations.length - 1];
    
    if (!currentLocation) {
      return res.status(404).json({ 
        error: 'No location data found for this user' 
      });
    }
    
    res.json({
      publicKey,
      currentLocation
    });
  } catch (error) {
    console.error('Error fetching current location:', error);
    res.status(500).json({ error: 'Failed to fetch current location', details: error.message });
  }
});

// Toggle visibility status
router.post('/toggle-visibility', (req, res) => {
  try {
    const { publicKey, isVisible } = req.body;
    
    if (!publicKey || typeof isVisible !== 'boolean') {
      return res.status(400).json({ 
        error: 'Missing required fields: publicKey, isVisible (boolean)' 
      });
    }

    // Store visibility preference (in production, use a database)
    const visibilityKey = `${publicKey}_visibility`;
    locationData.set(visibilityKey, {
      publicKey,
      isVisible,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Visibility ${isVisible ? 'enabled' : 'disabled'} successfully`,
      data: {
        publicKey,
        isVisible,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error toggling visibility:', error);
    res.status(500).json({ error: 'Failed to toggle visibility', details: error.message });
  }
});

// Get visibility status
router.get('/visibility/:publicKey', (req, res) => {
  try {
    const { publicKey } = req.params;
    const visibilityKey = `${publicKey}_visibility`;
    
    const visibilityData = locationData.get(visibilityKey);
    
    res.json({
      publicKey,
      isVisible: visibilityData ? visibilityData.isVisible : false,
      updatedAt: visibilityData ? visibilityData.updatedAt : null
    });
  } catch (error) {
    console.error('Error fetching visibility status:', error);
    res.status(500).json({ error: 'Failed to fetch visibility status', details: error.message });
  }
});

// Debug endpoint to clear rate limiting (development only)
router.post('/debug/clear-rate-limits', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Debug endpoint only available in development mode' });
  }
  
  try {
    rateLimitMap.clear();
    lastSubmissionMap.clear();
    
    res.json({
      success: true,
      message: 'Rate limits cleared for all users',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing rate limits:', error);
    res.status(500).json({ error: 'Failed to clear rate limits', details: error.message });
  }
});

// Get nearby users (for demonstration - in production, use proper geospatial queries)
router.get('/nearby/:publicKey', (req, res) => {
  try {
    const { publicKey } = req.params;
    const { radius = 10, showAll = false } = req.query; // radius in kilometers, showAll for global search
    
    const userLocations = locationData.get(publicKey) || [];
    const currentLocation = userLocations[userLocations.length - 1];
    
    if (!currentLocation && !showAll) {
      return res.json({
        publicKey,
        nearbyUsers: [],
        currentLocation: null,
        radius: parseFloat(radius),
        showAll: showAll === 'true',
        message: 'No current location found for this user'
      });
    }

    const nearbyUsers = [];
    
    // Check all users for nearby locations
    for (const [key, locations] of locationData.entries()) {
      if (key.endsWith('_visibility')) continue; // Skip visibility entries
      
      const userPublicKey = key;
      if (userPublicKey === publicKey) continue; // Skip self
      
      const userCurrentLocation = locations[locations.length - 1];
      if (!userCurrentLocation) continue;
      
      // Check visibility
      const visibilityKey = `${userPublicKey}_visibility`;
      const visibilityData = locationData.get(visibilityKey);
      if (!visibilityData || !visibilityData.isVisible) continue;
      
      let distance = 0;
      
      if (showAll === 'true') {
        // For global search, include all users regardless of distance
        distance = currentLocation ? calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          userCurrentLocation.latitude,
          userCurrentLocation.longitude
        ) : 0;
      } else {
        // For radius-based search, calculate distance and filter
        distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          userCurrentLocation.latitude,
          userCurrentLocation.longitude
        );
        
        if (distance > parseFloat(radius)) continue;
      }
      
      nearbyUsers.push({
        publicKey: userPublicKey,
        latitude: userCurrentLocation.latitude,
        longitude: userCurrentLocation.longitude,
        distance: distance.toFixed(2),
        lastSeen: userCurrentLocation.timestamp
      });
    }
    
    res.json({
      publicKey,
      currentLocation: currentLocation ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      } : null,
      radius: showAll === 'true' ? 'global' : parseFloat(radius),
      showAll: showAll === 'true',
      nearbyUsers: nearbyUsers.sort((a, b) => a.distance - b.distance)
    });
  } catch (error) {
    console.error('Error fetching nearby users:', error);
    res.status(500).json({ error: 'Failed to fetch nearby users', details: error.message });
  }
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;
