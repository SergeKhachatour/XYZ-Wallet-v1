# XYZ Stellar Wallet
<!-- Updated -->
A Stellar wallet application with location services integration, built using the Stellar SDK and Soroswap API.

<!-- Deployment trigger -->

## Features

- **Stellar Wallet**: Create, connect, and manage Stellar accounts on testnet
- **Token Swapping**: Swap tokens using the Soroswap API integration
- **Location Services**: Enable/disable location tracking and visibility to nearby users
- **Real-time Data**: Live balance updates and transaction history
- **Modern UI**: Beautiful, responsive interface with glassmorphism design

## Technology Stack

### Backend
- Node.js with Express
- Stellar SDK for blockchain operations
- Soroswap API integration for token swaps
- Location services API for user positioning

### Frontend
- React with TypeScript
- Styled Components for styling
- React Router for navigation
- Stellar SDK for wallet operations

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd XYZ-Wallet
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   
   **Backend (.env in server directory):**
   ```bash
   cd server
   cp env.example .env
   ```
   
   Edit `.env` file:
   ```
   PORT=5000
   STELLAR_NETWORK=testnet
   STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   SOROSWAP_API_URL=https://api.soroswap.finance
   NODE_ENV=development
   ```
   
   **Frontend (.env in client directory):**
   ```bash
   cd client
   cp env.example .env
   ```
   
   Edit `.env` file:
   ```
   REACT_APP_STELLAR_NETWORK=testnet
   REACT_APP_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   REACT_APP_BACKEND_URL=http://localhost:5000
   ```

## Running the Application

### Development Mode

Start both backend and frontend simultaneously:
```bash
npm run dev
```

Or start them separately:

**Backend:**
```bash
npm run server
```

**Frontend:**
```bash
npm run client
```

### Production Mode

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Start the backend:**
   ```bash
   cd server
   npm start
   ```

## Usage

### Getting Started

1. **Access the application** at `http://localhost:3000`

2. **Create or connect a wallet:**
   - Click "Create New Wallet" to generate a new Stellar account
   - Or click "Connect Existing Wallet" to import an existing secret key
   - **Important**: Save your secret key securely!

3. **Fund your wallet:**
   - Use the Stellar Testnet Friendbot to get test XLM
   - Visit: https://www.stellar.org/laboratory/#account-creator?network=test

### Features Overview

#### Wallet Management
- View account balance and transaction history
- Send payments to other Stellar addresses
- Export wallet data for backup

#### Token Swapping
- Swap between different tokens using Soroswap
- View real-time quotes and price impact
- Execute swaps with optimal routing

#### Location Services
- Enable location tracking (requires browser permission)
- Toggle visibility to nearby users
- View nearby users within configurable radius
- Location history tracking

## API Endpoints

### Wallet Endpoints
- `POST /api/wallet/create-account` - Create new wallet
- `GET /api/wallet/balance/:publicKey` - Get account balance
- `GET /api/wallet/transactions/:publicKey` - Get transaction history
- `POST /api/wallet/create-payment` - Create payment transaction
- `POST /api/wallet/submit-transaction` - Submit transaction

### Location Endpoints
- `POST /api/location/submit` - Submit location data
- `GET /api/location/history/:publicKey` - Get location history
- `POST /api/location/toggle-visibility` - Toggle visibility
- `GET /api/location/nearby/:publicKey` - Get nearby users

### Soroswap Endpoints
- `GET /api/soroswap/tokens` - Get available tokens
- `POST /api/soroswap/quote` - Get swap quote
- `POST /api/soroswap/build` - Build swap transaction
- `POST /api/soroswap/send` - Send swap transaction

## Security Considerations

- **Secret Keys**: Never share your secret key with anyone
- **Testnet Only**: This application is configured for Stellar testnet
- **Location Privacy**: Location data is stored locally and can be toggled off
- **HTTPS**: Use HTTPS in production environments

## Development

### Project Structure
```
XYZ-Wallet/
├── server/                 # Backend Express server
│   ├── routes/            # API route handlers
│   ├── index.js           # Server entry point
│   └── package.json       # Backend dependencies
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app component
│   └── package.json       # Frontend dependencies
└── package.json           # Root package.json
```

### Adding New Features

1. **Backend**: Add new routes in `server/routes/`
2. **Frontend**: Add new pages in `client/src/pages/`
3. **Context**: Use React contexts for state management
4. **Styling**: Use styled-components for consistent styling

## Troubleshooting

### Common Issues

1. **"Failed to fetch balance"**
   - Ensure the wallet is funded with test XLM
   - Check if the public key is correct

2. **"Location services not working"**
   - Grant browser location permissions
   - Ensure HTTPS is used (required for geolocation)

3. **"Swap quote failed"**
   - Check if tokens are available on testnet
   - Verify sufficient balance for the swap

4. **"Connection refused"**
   - Ensure backend server is running on port 5000
   - Check if all dependencies are installed

### Getting Help

- Check the browser console for error messages
- Verify all environment variables are set correctly
- Ensure you're using the latest version of Node.js

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Acknowledgments

- Stellar Development Foundation for the Stellar SDK
- Soroswap for the DEX aggregation API
- React and TypeScript communities
