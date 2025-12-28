// client/src/services/geoLinkService.ts

/**
 * Clean server URL by removing existing /ipfs/ path and protocol
 * @param serverUrl - The server URL from the API response
 * @returns Cleaned base URL with https:// protocol
 */
export function cleanServerUrl(serverUrl: string | null | undefined): string | null {
  if (!serverUrl) return null;
  
  let baseUrl = serverUrl.trim();
  
  // Remove any existing /ipfs/ path and everything after it
  baseUrl = baseUrl.replace(/\/ipfs\/.*$/i, '');
  
  // Remove trailing slashes
  baseUrl = baseUrl.replace(/\/+$/, '');
  
  // Remove protocol if present (we'll add https://)
  baseUrl = baseUrl.replace(/^https?:\/\//i, '');
  
  // Add https:// protocol
  if (baseUrl) {
    return `https://${baseUrl}`;
  }
  
  return null;
}

/**
 * Construct full image URL from server URL and IPFS hash
 * @param serverUrl - The server URL from the API response
 * @param ipfsHash - The IPFS hash from the API response
 * @returns Full image URL or fallback to public IPFS gateway
 */
export function constructImageUrl(serverUrl: string | null | undefined, ipfsHash: string | null | undefined): string {
  if (!ipfsHash) {
    return 'https://via.placeholder.com/200x200?text=NFT';
  }
  
  const baseUrl = cleanServerUrl(serverUrl);
  if (!baseUrl) {
    // Fallback to public IPFS gateway
    return `https://ipfs.io/ipfs/${ipfsHash}`;
  }
  
  return `${baseUrl}/ipfs/${ipfsHash}`;
}

export class GeoLinkIntegration {
  private walletProviderKey: string;
  private dataConsumerKey: string;
  private baseUrl: string;

  constructor(walletProviderKey: string, dataConsumerKey: string) {
    this.walletProviderKey = walletProviderKey;
    this.dataConsumerKey = dataConsumerKey;
    
    // Environment-based base URL configuration
    this.baseUrl = process.env.REACT_APP_GEOLINK_BASE_URL || 'http://localhost:4000';
  }

  // Send user location to GeoLink (as wallet provider)
  async updateUserLocation(publicKey: string, latitude: number, longitude: number) {
    const requestBody = {
      public_key: publicKey,
      blockchain: 'Stellar',
      latitude,
      longitude,
      wallet_type_id: 0
    };
    
    console.log('🔑 GeoLink Wallet Provider API call:', {
      url: `${this.baseUrl}/api/location/update`,
      method: 'POST',
      headers: {
        'X-API-Key': this.walletProviderKey ? `${this.walletProviderKey.substring(0, 8)}...` : 'MISSING',
        'Content-Type': 'application/json'
      },
      body: requestBody,
      fullApiKey: this.walletProviderKey // For debugging - remove in production
    });
    
    // Use X-API-Key header (GeoLink expects this format)
    const response = await fetch(`${this.baseUrl}/api/location/update`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.walletProviderKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('🔑 GeoLink Wallet Provider API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GeoLink API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`GeoLink API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  }

  // Update existing wallet location
  async updateWalletLocation(publicKey: string, latitude: number, longitude: number) {
    const response = await fetch(`${this.baseUrl}/api/locations/update`, {
      method: 'PUT',
      headers: {
        'X-API-Key': this.walletProviderKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude,
        longitude,
        accuracy: 10,
        timestamp: new Date().toISOString(),
        wallet_address: publicKey
      })
    });
    
    if (!response.ok) {
      throw new Error(`GeoLink API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Get wallet location history
  async getWalletLocationHistory(publicKey: string) {
    const response = await fetch(`${this.baseUrl}/api/locations/history?wallet_address=${publicKey}`, {
      method: 'GET',
      headers: {
        'X-API-Key': this.walletProviderKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`GeoLink API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Get nearby NFTs (as data consumer)
  async getNearbyNFTs(latitude: number, longitude: number, radius = 1000) {
    const url = `${this.baseUrl}/api/nft/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
    console.log('🌐 GeoLink API call:', {
      url,
      latitude,
      longitude,
      radius,
      baseUrl: this.baseUrl,
      hasApiKey: !!this.dataConsumerKey
    });
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': this.dataConsumerKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🌐 GeoLink API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`GeoLink API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('🌐 GeoLink API response data:', data);
    return data;
  }

  // Collect an NFT
  async collectNFT(nftId: number, userPublicKey: string, userLatitude: number, userLongitude: number) {
    const response = await fetch(`${this.baseUrl}/api/nft/collect`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.dataConsumerKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nft_id: nftId,
        user_public_key: userPublicKey,
        user_latitude: userLatitude,
        user_longitude: userLongitude
      })
    });
    
    if (!response.ok) {
      throw new Error(`GeoLink API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Get user's collected NFTs
  async getUserNFTs() {
    const response = await fetch(`${this.baseUrl}/api/nft/user-collection`, {
      headers: {
        'X-API-Key': this.dataConsumerKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      // Create error with status code for better error handling
      const error: any = new Error(`GeoLink API error: ${response.status} ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    
    return response.json();
  }

  // Update privacy settings (as wallet provider)
  async updatePrivacySettings(publicKey: string, privacyEnabled: boolean) {
    if (!this.walletProviderKey) {
      throw new Error('Wallet Provider API key is not configured');
    }
    
    if (!publicKey) {
      throw new Error('Public key is required');
    }
    
    // Convert boolean to privacy_level string
    // privacyEnabled = true means "public" (location can be shared)
    // privacyEnabled = false means "private" (location is private)
    const privacyLevel = privacyEnabled ? 'public' : 'private';
    
    const requestBody = {
      public_key: publicKey,
      privacy_level: privacyLevel,
      location_sharing: privacyEnabled
    };
    
    console.log('🔑 GeoLink Privacy Settings API call:', {
      url: `${this.baseUrl}/api/wallet-provider/privacy-settings`,
      method: 'POST',
      headers: {
        'X-API-Key': `${this.walletProviderKey.substring(0, 8)}...`,
        'Content-Type': 'application/json'
      },
      body: requestBody,
      fullApiKey: this.walletProviderKey // For debugging
    });
    
    const response = await fetch(`${this.baseUrl}/api/wallet-provider/privacy-settings`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.walletProviderKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('🔑 GeoLink Privacy Settings API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GeoLink Privacy Settings API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`GeoLink API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  }

  // Update visibility settings (as wallet provider)
  async updateVisibilitySettings(publicKey: string, isVisible: boolean) {
    if (!this.walletProviderKey) {
      throw new Error('Wallet Provider API key is not configured');
    }
    
    if (!publicKey) {
      throw new Error('Public key is required');
    }
    
    // Convert boolean to visibility_level string
    // isVisible = true means "public" (wallet is visible in searches)
    // isVisible = false means "private" (wallet is hidden from searches)
    const visibilityLevel = isVisible ? 'public' : 'private';
    
    const requestBody = {
      public_key: publicKey,
      visibility_level: visibilityLevel,
      show_location: isVisible
    };
    
    const requestBodyString = JSON.stringify(requestBody);
    
    console.log('🔑 GeoLink Visibility Settings API call:', {
      url: `${this.baseUrl}/api/wallet-provider/visibility-settings`,
      method: 'POST',
      headers: {
        'X-API-Key': `${this.walletProviderKey.substring(0, 8)}...`,
        'Content-Type': 'application/json'
      },
      body: requestBody,
      bodyString: requestBodyString,
      publicKey: publicKey,
      visibilityLevel: visibilityLevel,
      isVisible: isVisible,
      fullApiKey: this.walletProviderKey // For debugging
    });
    
    const response = await fetch(`${this.baseUrl}/api/wallet-provider/visibility-settings`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.walletProviderKey,
        'Content-Type': 'application/json'
      },
      body: requestBodyString
    });
    
    console.log('🔑 GeoLink Visibility Settings API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GeoLink Visibility Settings API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`GeoLink API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  }
}
