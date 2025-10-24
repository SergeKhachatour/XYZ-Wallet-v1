// client/src/services/geoLinkService.ts
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
      throw new Error(`GeoLink API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
}
