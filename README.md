# XYZ-Wallet-v1

A comprehensive Stellar wallet application with advanced features including location services, token swapping, and real-time price tracking. Built with React, Node.js, and integrated with Soroswap API for seamless DeFi operations.

## 🌟 Features

### 🔐 Wallet Management
- **Create/Import Wallets**: Generate new Stellar accounts or import existing ones
- **Multi-Asset Support**: Manage XLM and various Stellar tokens (USDC, XRP, etc.)
- **Real-time Balances**: Live balance updates with automatic refresh
- **Transaction History**: Complete transaction tracking with detailed information
- **Account Funding**: Easy testnet account funding with Friendbot integration
- **Wallet Backup**: Secure wallet export and recovery options
- **QR Code Support**: Generate and scan QR codes for addresses
- **Send/Receive**: Full payment functionality with memo support

### 💱 Token Swapping
- **Soroswap Integration**: Advanced DEX aggregation for optimal swap routes
- **Real-time Quotes**: Live price quotes with slippage protection
- **Multi-Token Support**: Swap between various Stellar tokens
- **Price Impact Analysis**: Detailed swap information and fees
- **Transaction Building**: Automated transaction construction and signing
- **Demo Mode**: Safe testing environment for swap functionality
- **Available Tokens**: Dynamic token discovery from Soroswap API

### 📍 Location Services
- **Interactive Maps**: Full-featured Mapbox integration with multiple view modes
- **Geolocation Tracking**: Optional location-based features with privacy controls
- **Nearby Users Discovery**: Find other wallet users in your area with customizable radius
- **Privacy Controls**: Toggle location visibility and tracking
- **Location History**: Track and manage location data
- **Radius Configuration**: Customizable search radius (1km to 1000km) or global search
- **Real-time Updates**: Automatic nearby users updates every 10 seconds
- **Map Styles**: Multiple map styles (satellite, streets, outdoors, light, dark)
- **Fullscreen Maps**: Expandable map view with full functionality
- **User Profiles**: View and interact with nearby users
- **Privacy Radius**: Approximate location display for user privacy

### 📊 Real-time Data
- **Live Price Charts**: Interactive price charts for XLM and other tokens
- **Market Data**: Real-time token prices and market information
- **Server Status**: Backend health monitoring and status indicators
- **Network Information**: Stellar network status and configuration
- **Available Tokens**: Live token discovery from DEX protocols

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first design with desktop optimization
- **Glassmorphism**: Beautiful glass-like UI elements with backdrop blur
- **Dark Theme**: Elegant dark theme with customizable colors
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Accessibility**: WCAG compliant with keyboard navigation support
- **Mobile Optimization**: Enhanced mobile experience with larger map cards
- **Stellar Branding**: Consistent Stellar branding throughout the app

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js framework
- **Stellar SDK** for blockchain operations
- **Soroswap API** for DEX aggregation
- **Axios** for HTTP requests
- **CORS** and **Helmet** for security
- **Morgan** for request logging
- **Rate Limiting** for API protection

### Frontend
- **React 18** with TypeScript
- **Styled Components** for CSS-in-JS styling
- **React Router** for navigation
- **React Hot Toast** for notifications
- **Mapbox GL JS** for interactive maps
- **Stellar SDK** for wallet operations
- **QR Scanner** for address scanning
- **QR Code Generator** for address sharing

### Development Tools
- **Concurrently** for parallel development
- **Nodemon** for backend hot reloading
- **TypeScript** for type safety
- **ESLint** for code quality
- **Cross-env** for environment variables

## 🚀 Quick Start

### 🌐 Live Deployment
**Production URL**: https://xyz-wallet-v1-adh3bjdnguczdmft.westus-01.azurewebsites.net
- ✅ **Fully deployed** with Azure App Service
- ✅ **Soroswap API integration** with authentication
- ✅ **Real-time quotes** and token swapping
- ✅ **Location services** and wallet management
- ✅ **Interactive maps** with fullscreen support
- ✅ **Mobile optimized** with enhanced UX

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SergeKhachatour/XYZ-Wallet-v1.git
   cd XYZ-Wallet-v1
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**

   **Backend (server/.env):**
   ```bash
   cd server
   cp env.example .env
   ```
   
   Edit `server/.env`:
   ```env
   PORT=5001
   STELLAR_NETWORK=testnet
   STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   SOROSWAP_API_URL=https://api.soroswap.finance
   SOROSWAP_API_KEY=your_soroswap_api_key
   NODE_ENV=development
   ```
   
   **Frontend (client/.env):**
   ```bash
   cd client
   cp env.example .env
   ```
   
   Edit `client/.env`:
   ```env
   REACT_APP_STELLAR_NETWORK=testnet
   REACT_APP_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   REACT_APP_BACKEND_URL=http://localhost:5001
   REACT_APP_MAPBOX_TOKEN=your_mapbox_token
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: `http://localhost:3333`
   - Backend API: `http://localhost:5001`

## 🌐 Deployment

### Azure App Service (Recommended)

This project includes automated deployment to Azure App Service via GitHub Actions.

**Setup Instructions:**
1. Fork this repository
2. Set up Azure App Service
3. Configure GitHub Secrets:
   - `AZUREAPPSERVICE_APPNAME`: Your Azure app name
   - `AZURE_WEBAPP_PUBLISH_PROFILE`: Your Azure publish profile
4. Push to master branch to trigger deployment

**Deployment URL:** `https://your-app-name.azurewebsites.net`

### Manual Deployment

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting provider:**
   - Upload the entire project folder
   - Ensure Node.js is installed
   - Set environment variables
   - Start with `npm start`

## 📱 Usage Guide

### Getting Started

1. **Access the Application**
   - Open `http://localhost:3333` in your browser
   - The app will redirect to the dashboard

2. **Create or Connect a Wallet**
   - Click "Create New Wallet" to generate a new Stellar account
   - Or click "Connect Existing Wallet" to import an existing secret key
   - **⚠️ Important**: Save your secret key securely!

3. **Fund Your Wallet**
   - Use the Stellar Testnet Friendbot: https://www.stellar.org/laboratory/#account-creator?network=test
   - Or use the built-in "Fund Account" feature in the wallet

### Dashboard Features

- **Server Status**: Monitor backend connectivity
- **Wallet Overview**: Quick access to wallet functions
- **Price Charts**: Live XLM price tracking
- **Interactive Map**: Global map with location services
- **Recent Activity**: Latest transactions and updates
- **Nearby Users**: Discover and interact with nearby users
- **Token Balances**: View all your token holdings
- **Available Tokens**: See tokens available for swapping

### Wallet Management

- **Balance View**: See all token balances with real-time updates
- **Send Payments**: Transfer tokens to other addresses with QR code support
- **Receive Payments**: Generate QR codes for receiving payments
- **Transaction History**: Complete transaction log with status tracking
- **Account Settings**: Manage wallet preferences and security

### Token Swapping

1. **Select Tokens**: Choose source and destination tokens from available options
2. **Enter Amount**: Specify the amount to swap
3. **Review Quote**: Check price impact, fees, and slippage
4. **Execute Swap**: Confirm and sign the transaction
5. **Demo Mode**: Test swaps safely without real transactions

### Location Services

1. **Enable Location**: Grant browser location permissions
2. **Interactive Maps**: Explore with multiple map styles and views
3. **Find Nearby Users**: Discover other wallet users with customizable search
4. **Privacy Controls**: Manage location visibility and data
5. **User Profiles**: View and interact with nearby users
6. **Real-time Updates**: Automatic updates every 10 seconds

### Map Features

- **Multiple Views**: Globe and flat map projections
- **Map Styles**: Satellite, streets, outdoors, light, dark themes
- **Fullscreen Mode**: Expandable map view
- **User Markers**: See your location and nearby users
- **Privacy Protection**: Approximate location display
- **Mobile Optimized**: Enhanced mobile experience

## 🔌 API Documentation

### Wallet Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wallet/balance/:publicKey` | GET | Get account balance |
| `/api/wallet/transactions/:publicKey` | GET | Get transaction history |
| `/api/wallet/create-payment` | POST | Create payment transaction |
| `/api/wallet/submit-transaction` | POST | Submit signed transaction |
| `/api/wallet/fund-account` | POST | Fund account with test XLM |

### Location Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/location/submit` | POST | Submit location data |
| `/api/location/history/:publicKey` | GET | Get location history |
| `/api/location/toggle-visibility` | POST | Toggle location visibility |
| `/api/location/nearby/:publicKey` | GET | Get nearby users |

### Soroswap Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/soroswap/tokens` | GET | Get available tokens |
| `/api/soroswap/protocols` | GET | Get available protocols |
| `/api/soroswap/quote` | POST | Get swap quote |
| `/api/soroswap/build` | POST | Build swap transaction |

### Health Check

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health status |

## 🔒 Security Features

- **Secret Key Protection**: Keys are stored locally and never transmitted
- **HTTPS Enforcement**: Secure connections in production
- **CORS Configuration**: Proper cross-origin resource sharing
- **Rate Limiting**: API request throttling (1000 requests per minute)
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Secure error messages without sensitive data
- **Privacy Controls**: Location data protection with approximate positioning

## 🎨 UI Components

### Pages
- **Dashboard**: Main overview with cards, map, and navigation
- **Wallet**: Wallet management, transactions, and QR codes
- **Swap**: Token swapping interface with quotes
- **Location**: Location services and nearby users
- **Settings**: Application configuration and about

### Components
- **Header**: Navigation with mobile menu and Stellar branding
- **PriceChart**: Interactive price charts for XLM
- **MapboxMap**: Interactive maps with fullscreen support
- **UserProfile**: Nearby user profiles and interactions
- **SendOverlay**: Send payment interface with QR scanning
- **ReceiveOverlay**: Receive payment interface with QR generation
- **MarkerProfileOverlay**: Map marker user profiles
- **LocationDebugger**: Location services debugging

### Contexts
- **WalletContext**: Global wallet state management
- **LocationContext**: Location services state with 10-second updates

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to fetch balance"**
   - Ensure wallet is funded with test XLM
   - Check public key is correct
   - Verify backend is running

2. **"Location services not working"**
   - Grant browser location permissions
   - Use HTTPS in production
   - Check browser compatibility

3. **"Swap quote failed"**
   - Verify tokens are available on testnet
   - Check sufficient balance
   - Ensure Soroswap API is accessible

4. **"Connection refused"**
   - Ensure backend is running on port 5001
   - Check all dependencies are installed
   - Verify environment variables

5. **"Map not loading"**
   - Check Mapbox token is valid
   - Verify internet connection
   - Check browser console for errors

### Development Issues

1. **Build failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify TypeScript configuration

2. **Hot reload not working**
   - Restart the development server
   - Check file watching permissions
   - Clear browser cache

3. **Mobile map issues**
   - Check responsive design settings
   - Verify mobile viewport configuration
   - Test on actual mobile devices

## 📁 Project Structure

```
XYZ-Wallet-v1/
├── server/                    # Backend Express server
│   ├── routes/               # API route handlers
│   │   ├── wallet.js         # Wallet operations
│   │   ├── location.js       # Location services
│   │   └── soroswap.js       # DEX integration
│   ├── index.js              # Server entry point
│   └── package.json          # Backend dependencies
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── Header.tsx    # Navigation header
│   │   │   ├── PriceChart.tsx # Price charts
│   │   │   ├── MapboxMap.tsx # Interactive maps
│   │   │   ├── SendOverlay.tsx # Send payments
│   │   │   ├── ReceiveOverlay.tsx # Receive payments
│   │   │   ├── UserProfile.tsx # User profiles
│   │   │   └── MarkerProfileOverlay.tsx # Map user profiles
│   │   ├── contexts/         # React contexts
│   │   │   ├── WalletContext.tsx    # Wallet state
│   │   │   └── LocationContext.tsx  # Location state
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.tsx        # Main dashboard
│   │   │   ├── Wallet.tsx           # Wallet management
│   │   │   ├── Swap.tsx             # Token swapping
│   │   │   ├── Location.tsx         # Location services
│   │   │   └── Settings.tsx          # App settings
│   │   ├── App.tsx           # Main app component
│   │   └── index.tsx         # App entry point
│   └── package.json          # Frontend dependencies
├── .github/workflows/        # GitHub Actions
│   └── master_xyz-wallet.yml # Deployment workflow
├── package.json              # Root package.json
├── startup.txt               # Azure startup command
└── web.config                # IIS configuration
```

## 🚀 Development

### Adding New Features

1. **Backend Routes**
   - Add new routes in `server/routes/`
   - Follow existing patterns for error handling
   - Add proper validation and security

2. **Frontend Pages**
   - Create new pages in `client/src/pages/`
   - Use existing styling patterns
   - Implement proper TypeScript types

3. **Components**
   - Build reusable components in `client/src/components/`
   - Use styled-components for styling
   - Follow accessibility guidelines

### Code Style

- **TypeScript**: Use strict typing
- **ESLint**: Follow configured linting rules
- **Styled Components**: Use consistent styling patterns
- **Error Handling**: Implement comprehensive error handling

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **Stellar Development Foundation** for the Stellar SDK
- **Soroswap** for the DEX aggregation API
- **Mapbox** for mapping services
- **React** and **TypeScript** communities
- **Azure** for hosting services

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ for the Stellar ecosystem**