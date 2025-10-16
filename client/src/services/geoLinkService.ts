// client/src/services/geoLinkService.ts
export class GeoLinkIntegration {
  private walletProviderKey: string;
  private dataConsumerKey: string;
  private baseUrl: string;

  constructor(walletProviderKey: string, dataConsumerKey: string) {
    this.walletProviderKey = walletProviderKey;
    this.dataConsumerKey = dataConsumerKey;
    
    // Environment-based base URL configuration
    this.baseUrl = process.env.REACT_APP_GEOLINK_BASE_URL || 'https://geolink-buavavc6gse5c9fw.westus-01.azurewebsites.net';
  }

  // Send user location to GeoLink (as wallet provider)
  async updateUserLocation(publicKey: string, latitude: number, longitude: number) {
    const response = await fetch(`${this.baseUrl}/api/locations/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.walletProviderKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude,
        longitude,
        accuracy: 10, // in meters
        timestamp: new Date().toISOString(),
        wallet_address: publicKey,
        device_info: {
          platform: 'mobile',
          version: '1.0.0'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`GeoLink API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Update existing wallet location
  async updateWalletLocation(publicKey: string, latitude: number, longitude: number) {
    const response = await fetch(`${this.baseUrl}/api/locations/update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.walletProviderKey}`,
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
        'Authorization': `Bearer ${this.walletProviderKey}`
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
        'Authorization': `Bearer ${this.dataConsumerKey}`,
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
        'Authorization': `Bearer ${this.dataConsumerKey}`,
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
        'Authorization': `Bearer ${this.dataConsumerKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GeoLink API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
}
