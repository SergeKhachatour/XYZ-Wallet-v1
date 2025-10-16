# XYZ-Wallet GeoLink Integration

This document explains how XYZ-Wallet integrates with GeoLink to provide location-based NFT discovery and collection functionality.

## Overview

XYZ-Wallet now acts as both a data provider and data consumer in the GeoLink ecosystem:

- **Data Provider**: Sends user location data to GeoLink every 10 seconds
- **Data Consumer**: Retrieves nearby NFTs and allows users to collect them

## Features

### 🗺️ Enhanced Map Experience
- **NFT Markers**: Discover NFTs on the map alongside user markers
- **Real-time Updates**: NFTs update automatically as you move
- **Visual Distinction**: NFTs have distinct markers with collection buttons

### 🎯 NFT Collection
- **Location Verification**: Must be within collection radius to collect
- **One-click Collection**: Simple interface for collecting NFTs
- **Collection Tracking**: View your collected NFTs in the wallet

### 🔗 GeoLink Status
- **Connection Status**: Real-time status of GeoLink connection
- **Environment Awareness**: Automatically detects local vs production
- **Error Handling**: Graceful fallback when GeoLink is unavailable

## Environment Configuration

### Local Development
```bash
# Copy the example environment file
cp geolink-env.example .env

# Configure for local GeoLink
REACT_APP_GEOLINK_BASE_URL=http://localhost:3000
REACT_APP_GEOLINK_WALLET_PROVIDER_KEY=your_wallet_provider_key
REACT_APP_GEOLINK_DATA_CONSUMER_KEY=your_data_consumer_key
```

### Azure Production
```bash
# Configure for Azure GeoLink
REACT_APP_GEOLINK_BASE_URL=https://geolink-buavavc6gse5c9fw.westus-01.azurewebsites.net
REACT_APP_GEOLINK_WALLET_PROVIDER_KEY=your_azure_wallet_provider_key
REACT_APP_GEOLINK_DATA_CONSUMER_KEY=your_azure_data_consumer_key
```

## API Integration

### GeoLink Service (`client/src/services/geoLinkService.ts`)
- **updateUserLocation()**: Sends user location to GeoLink
- **getNearbyNFTs()**: Retrieves NFTs near user location
- **collectNFT()**: Collects an NFT with location verification
- **getUserNFTs()**: Gets user's collected NFT collection

### Location Context Enhancement
- **NFT State Management**: Tracks nearby NFTs and user collection
- **GeoLink Status**: Monitors connection status
- **Automatic Updates**: Refreshes NFTs when location changes

## User Experience

### Map Integration
1. **Enable Location**: Users must enable location services
2. **Discover NFTs**: NFTs appear as markers on the map
3. **Collect NFTs**: Click NFT markers to view details and collect
4. **Real-time Updates**: Map updates automatically with new NFTs

### Wallet Integration
1. **View Collection**: See all collected NFTs in wallet
2. **Refresh Collection**: Manually refresh NFT collection
3. **Collection Details**: View NFT metadata and collection info

## Technical Implementation

### Components Added
- `GeoLinkService`: API integration service
- `NFTCollectionOverlay`: NFT collection interface
- `GeoLinkStatus`: Connection status indicator
- Enhanced `MapboxMap`: NFT marker rendering
- Enhanced `Wallet`: NFT collection display

### Context Updates
- **LocationContext**: Added NFT state and functions
- **Automatic Integration**: Seamless integration with existing location features

## Deployment

### Azure App Service Configuration
Add these environment variables in Azure Portal:

```
REACT_APP_GEOLINK_BASE_URL=https://geolink-buavavc6gse5c9fw.westus-01.azurewebsites.net
REACT_APP_GEOLINK_WALLET_PROVIDER_KEY=your_azure_wallet_provider_key
REACT_APP_GEOLINK_DATA_CONSUMER_KEY=your_azure_data_consumer_key
```

### Local Development
1. Start GeoLink server locally
2. Configure environment variables
3. Start XYZ-Wallet development server
4. Enable location services to see NFTs

## Troubleshooting

### Common Issues
1. **No NFTs Showing**: Check GeoLink connection status
2. **Collection Fails**: Ensure you're within collection radius
3. **Location Not Updating**: Verify location permissions

### Debug Information
- Check browser console for GeoLink status messages
- Verify environment variables are set correctly
- Ensure GeoLink server is running and accessible

## Future Enhancements

- **NFT Trading**: Trade NFTs with other users
- **Collection Analytics**: Track collection statistics
- **Custom NFT Creation**: Create and deploy location-based NFTs
- **Social Features**: Share collections and discoveries
