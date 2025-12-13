# XYZ-Wallet-v1

A comprehensive Stellar wallet application with advanced zero-knowledge authentication, location services, token swapping, and real-time price tracking. Built with React, Node.js, and integrated with Soroswap API for seamless DeFi operations.

## 🌟 Features

### 🔐 Advanced Authentication & Security

#### Zero-Knowledge Proof Wallets
- **Cryptographic Proofs**: Generate cryptographic proofs of signing capability without revealing private keys
- **ZK Proof Generation**: Secure proof generation using WebCrypto API
- **Wallet-Based Identity**: Uses Stellar public keys as identity (no email/password required)
- **No Secret Key Exposure**: Private keys never leave the browser

#### Passkey Authentication
- **WebAuthn Integration**: Native WebAuthn API support for biometric authentication
- **Hardware Security**: Face ID, Touch ID, Windows Hello, and hardware security keys
- **Multi-Device Support**: iOS, Android, Windows, macOS compatibility
- **Smart Contract Integration**: Passkey authentication for smart wallet transactions
- **Automatic Registration**: Passkey signer registration on first use

#### SRP-6a Authentication
- **Secure Remote Password**: Zero-knowledge password authentication protocol
- **No Password Transmission**: Passwords never sent over the network
- **Secure Session Management**: JWT tokens for authenticated sessions
- **Wallet-Based Identity**: Uses Stellar public keys as identity

#### Data Protection
- **AES-GCM Encryption**: Military-grade encryption for secret key storage
- **WebCrypto API**: Browser-native cryptographic operations
- **Encrypted Storage**: All sensitive data encrypted with passkey-derived keys
- **Local Storage**: Secret keys stored locally and never transmitted

### 💼 Smart Wallet Contract (Custodial Model)

#### Contract Functions
- **`deposit(user_address, asset, amount)`**: Deposit tokens into the smart wallet contract
  - Transfers tokens from user's wallet to the contract
  - Updates user's tracked balance in contract storage
  - Uses Soroban's `require_auth()` for direct authorization
  - No separate approval step required

- **`execute_payment(signer_address, destination, amount, asset, signature_payload, webauthn_signature, ...)`**: Execute payments from smart wallet
  - Requires passkey authentication via WebAuthn signature verification
  - Transfers tokens from contract to destination
  - Checks user's balance before executing
  - Updates user's tracked balance after payment

- **`get_balance(user_address, asset)`**: Get user's individual stake in the contract
  - Returns user's balance for a specific asset
  - Returns 0 if user has no balance
  - Per-user balance tracking in contract storage

- **`register_signer(signer_address, passkey_pubkey, rp_id_hash)`**: Register passkey signer
  - Stores passkey public key in contract storage
  - Stores relying party ID hash
  - Automatically called on first use

- **`is_signer_registered(signer_address)`**: Check if signer is registered
  - Returns boolean indicating registration status

- **`get_passkey_pubkey(signer_address)`**: Get stored passkey public key
  - Returns the passkey public key for a registered signer

- **`get_verifier_address()`**: Get WebAuthn verifier contract address
  - Returns the address of the WebAuthn verifier contract

- **`get_wallet_info()`**: Get comprehensive wallet information
  - Returns wallet status and configuration details

#### Smart Wallet Features
- **Custodial Model**: Contract physically holds tokens (not just logical accounting)
- **Per-User Balance Tracking**: Each user has their own tracked balance within the shared contract
- **Vault Balance**: Total sum of all deposits from all users
- **User Stake**: Individual user's total deposits within the contract
- **Direct Authorization**: Uses Soroban's `require_auth()` framework (no separate approve step)
- **WebAuthn Verification**: On-chain signature verification for all transactions
- **Multi-User Support**: Multiple users can use the same contract instance

#### Smart Wallet UI Features
- **Deposit Interface**: Easy-to-use deposit overlay with balance display
- **Send Payment**: Send payments from smart wallet with passkey authentication
- **Balance Display**: Shows both user stake and total vault balance
- **Contract Information**: Display contract ID, links to Stellar Lab and Stellar Expert
- **Available Functions**: List of all contract functions with descriptions
- **Send Max**: Automatically calculates maximum sendable amount accounting for fees
- **Refund Suggestions**: Suggests refunds for very small remaining balances

### 🔐 Wallet Management

#### Core Wallet Features
- **Create/Import Wallets**: Generate new Stellar accounts or import existing ones
- **Multi-Asset Support**: Manage XLM and various Stellar tokens (USDC, XRP, etc.)
- **Real-time Balances**: Live balance updates with automatic refresh
- **Transaction History**: Complete transaction tracking with detailed information
- **Account Funding**: Easy testnet account funding with Friendbot integration
- **Wallet Backup**: Secure wallet export and recovery options

#### Payment Features
- **Send Payments**: Transfer tokens to other addresses with QR code support
- **Receive Payments**: Generate QR codes for receiving payments
- **Memo Support**: Add memos to transactions
- **QR Code Scanning**: Scan QR codes to get recipient addresses
- **QR Code Generation**: Generate QR codes for wallet addresses
- **Fee Estimation**: Calculate and display transaction fees
- **Balance Validation**: Check sufficient balance before sending

### 💱 Token Swapping

#### Soroswap Integration
- **DEX Aggregation**: Advanced DEX aggregation for optimal swap routes
- **Real-time Quotes**: Live price quotes with slippage protection
- **Multi-Token Support**: Swap between various Stellar tokens
- **Price Impact Analysis**: Detailed swap information and fees
- **Transaction Building**: Automated transaction construction and signing
- **Demo Mode**: Safe testing environment for swap functionality
- **Available Tokens**: Dynamic token discovery from Soroswap API
- **Protocol Support**: Support for multiple DEX protocols
- **Liquidity Pools**: View and interact with liquidity pools
- **Price Tracking**: Real-time price tracking for tokens

### 📍 Location Services

#### Interactive Maps
- **Mapbox Integration**: Full-featured Mapbox integration with multiple view modes
- **Multiple Map Styles**: Satellite, streets, outdoors, light, dark themes
- **Globe and Flat Views**: Toggle between globe and flat map projections
- **Fullscreen Maps**: Expandable map view with full functionality
- **Mobile Optimized**: Enhanced mobile experience with larger map cards

#### Geolocation Features
- **Geolocation Tracking**: Optional location-based features with privacy controls
- **Nearby Users Discovery**: Find other wallet users in your area with customizable radius
- **Privacy Controls**: Toggle location visibility and tracking
- **Location History**: Track and manage location data
- **Radius Configuration**: Customizable search radius (1km to 1000km) or global search
- **Real-time Updates**: Automatic nearby users updates every 10 seconds
- **User Profiles**: View and interact with nearby users
- **Privacy Radius**: Approximate location display for user privacy
- **Location Debugger**: Debug tools for location services

### 📊 Real-time Data

#### Market Data
- **Live Price Charts**: Interactive price charts for XLM and other tokens
- **Market Information**: Real-time token prices and market information
- **Price Tracking**: XLM price with 24h change percentage
- **Soroswap Integration**: Real-time data from Soroswap API

#### System Status
- **Server Status**: Backend health monitoring and status indicators
- **Network Information**: Stellar network status and configuration
- **Available Tokens**: Live token discovery from DEX protocols
- **Connection Status**: Real-time connection status indicators

### 🎨 Modern UI/UX

#### Design Features
- **Responsive Design**: Mobile-first design with desktop optimization
- **Glassmorphism**: Beautiful glass-like UI elements with backdrop blur
- **Dark Theme**: Elegant dark theme with customizable colors
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Accessibility**: WCAG compliant with keyboard navigation support
- **Stellar Branding**: Consistent Stellar branding throughout the app

#### UI Components
- **Overlays**: Modal overlays for send, receive, and deposit operations
- **Collapsible Sections**: Expandable/collapsible sections for better organization
- **Loading States**: Clear loading indicators for all async operations
- **Error Handling**: User-friendly error messages and validation
- **Success Feedback**: Toast notifications for successful operations
- **Form Validation**: Real-time form validation with helpful error messages

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js framework
- **Stellar SDK** for blockchain operations
- **Soroswap API** for DEX aggregation
- **Soroban RPC** for smart contract interactions
- **JWT** for authentication tokens
- **SRP-6a** for zero-knowledge authentication
- **Axios** for HTTP requests
- **CORS** and **Helmet** for security
- **Morgan** for request logging
- **Rate Limiting** for API protection

### Frontend
- **React 18** with TypeScript (ES2020)
- **Styled Components** for CSS-in-JS styling
- **React Router** for navigation
- **React Hot Toast** for notifications
- **Mapbox GL JS** for interactive maps
- **Stellar SDK** for wallet operations
- **WebAuthn API** for passkey authentication
- **WebCrypto API** for encryption
- **QR Scanner** for address scanning
- **QR Code Generator** for address sharing

### Smart Contracts
- **Rust** for Soroban smart contracts
- **Soroban SDK** for contract development
- **WebAuthn Verifier** for signature verification
- **Token Contracts** (SAC) for asset management

### Development Tools
- **Concurrently** for parallel development
- **Nodemon** for backend hot reloading
- **TypeScript** for type safety
- **ESLint** for code quality
- **Cross-env** for environment variables

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git
- Rust (for smart contract development, optional)
- Soroban CLI (for contract deployment, optional)

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
   SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
   SOROSWAP_API_URL=https://api.soroswap.finance
   SOROSWAP_API_KEY=your_soroswap_api_key
   NODE_ENV=development
   SMART_WALLET_CONTRACT_ID=your_contract_id
   WEBAUTHN_VERIFIER_CONTRACT_ID=your_verifier_contract_id
   GEOLINK_BASE_URL=http://localhost:4000
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
   REACT_APP_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
   REACT_APP_BACKEND_URL=http://localhost:5001
   REACT_APP_MAPBOX_TOKEN=your_mapbox_token
   REACT_APP_SMART_WALLET_CONTRACT_ID=your_contract_id
   REACT_APP_WEBAUTHN_VERIFIER_CONTRACT_ID=your_verifier_contract_id
   REACT_APP_GEOLINK_BASE_URL=http://localhost:4000
   REACT_APP_GEOLINK_WALLET_PROVIDER_KEY=your_wallet_provider_key
   REACT_APP_GEOLINK_DATA_CONSUMER_KEY=your_data_consumer_key
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: `http://localhost:3333`
   - Backend API: `http://localhost:5001`

## 📱 Usage Guide

### Getting Started

1. **Access the Application**
   - Open `http://localhost:3333` in your browser
   - The app will redirect to the dashboard

2. **Create or Connect a Wallet**
   - **ZK Proof Wallet**: Click "Create ZK Proof Wallet" for zero-knowledge authentication
   - **Passkey Wallet**: Click "Create Passkey Wallet" for biometric authentication
   - **Advanced Auth**: Click "Advanced Authentication" for SRP-6a with wallet keys
   - **⚠️ Important**: Save your secret key securely!

3. **Fund Your Wallet**
   - Use the Stellar Testnet Friendbot: https://www.stellar.org/laboratory/#account-creator?network=test
   - Or use the built-in "Fund Account" feature in the wallet

### Dashboard Features

- **Server Status**: Monitor backend connectivity
- **Wallet Overview**: Quick access to wallet functions
- **Price Charts**: Live XLM price tracking with user stake and vault balance
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
- **Smart Wallet**: Deposit tokens, send payments, and view balances

### Smart Wallet Usage

1. **Deposit Tokens**
   - Navigate to Wallet page
   - Click "Deposit" button
   - Enter amount to deposit
   - Confirm deposit (tokens transfer to contract)

2. **Send from Smart Wallet**
   - Click "Send" button on Wallet page
   - Select "Smart Wallet" as source
   - Enter recipient address and amount
   - Authenticate with passkey
   - Transaction executes from contract

3. **View Balances**
   - **User Stake**: Your individual balance in the contract
   - **Vault Balance**: Total balance of all users in the contract
   - Both displayed on Dashboard and Wallet pages

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
| `/api/wallet/account/:publicKey` | GET | Get account details |

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/srp/register` | POST | Register wallet with SRP-6a |
| `/auth/srp/login/start` | POST | Start SRP-6a login process |
| `/auth/srp/login/finish` | POST | Complete SRP-6a login |
| `/auth/zk/verify` | POST | Verify zero-knowledge proof |

### Smart Wallet Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/smart-wallet/execute-transaction` | POST | Execute smart wallet payment |
| `/api/smart-wallet/generate-challenge` | POST | Generate passkey challenge |
| `/api/smart-wallet/verify-passkey` | POST | Verify passkey signature |
| `/api/smart-wallet/initialize` | POST | Initialize smart wallet |
| `/api/smart-wallet/info` | POST | Get wallet information |
| `/api/smart-wallet/balance` | POST | Get user's balance in contract |
| `/api/smart-wallet/deposit` | POST | Deposit tokens to smart wallet |
| `/api/smart-wallet/get-balance` | POST | Get user's stake in contract |
| `/api/smart-wallet/get-vault-balance` | POST | Get total vault balance (all users) |
| `/api/smart-wallet/approve-token` | POST | Approve token for contract (legacy, not needed with custodial model) |
| `/api/smart-wallet/add-policy-signer` | POST | Add multi-signature signer |
| `/api/smart-wallet/remove-policy-signer` | POST | Remove multi-signature signer |
| `/api/smart-wallet/store-zk-proof` | POST | Store zero-knowledge proof |

### Location Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/location/submit` | POST | Submit location data |
| `/api/location/history/:publicKey` | GET | Get location history |
| `/api/location/current/:publicKey` | GET | Get current location |
| `/api/location/toggle-visibility` | POST | Toggle location visibility |
| `/api/location/visibility/:publicKey` | GET | Get visibility status |
| `/api/location/nearby/:publicKey` | GET | Get nearby users |
| `/api/location/debug/clear-rate-limits` | POST | Clear rate limits (debug) |
| `/api/location/debug/visibility-data` | GET | Get visibility data (debug) |

### Soroswap Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/soroswap/tokens` | GET | Get available tokens |
| `/api/soroswap/protocols` | GET | Get available protocols |
| `/api/soroswap/quote` | POST | Get swap quote |
| `/api/soroswap/build` | POST | Build swap transaction |
| `/api/soroswap/send` | POST | Send swap transaction |
| `/api/soroswap/pools` | GET | Get liquidity pools |
| `/api/soroswap/pools/:tokenA/:tokenB` | GET | Get pool for token pair |
| `/api/soroswap/asset-list` | GET | Get asset list |
| `/api/soroswap/price` | GET | Get token price |
| `/api/soroswap/liquidity/add` | POST | Add liquidity |
| `/api/soroswap/liquidity/remove` | POST | Remove liquidity |
| `/api/soroswap/liquidity/positions/:address` | GET | Get liquidity positions |
| `/api/soroswap/contracts/:network/:contractName` | GET | Get contract address |
| `/api/soroswap/health` | GET | Health check |

### Health Check

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health status |

## 🔒 Security Features

### Zero-Knowledge Authentication
- **ZK Proof Generation**: Cryptographic proofs of signing capability without revealing private keys
- **SRP-6a Protocol**: Secure Remote Password for zero-knowledge authentication
- **Passkey Integration**: Hardware-backed biometric authentication
- **Wallet-Based Identity**: Uses Stellar public keys as identity (no email/password)

### Data Protection
- **AES-GCM Encryption**: Military-grade encryption for secret key storage
- **WebCrypto API**: Browser-native cryptographic operations
- **Secret Key Protection**: Keys are stored locally and never transmitted
- **Encrypted Storage**: All sensitive data encrypted with passkey-derived keys

### Network Security
- **HTTPS Enforcement**: Secure connections in production
- **CORS Configuration**: Proper cross-origin resource sharing
- **Rate Limiting**: API request throttling (2000 requests per minute)
- **JWT Tokens**: Secure session management with expiration
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Secure error messages without sensitive data
- **Privacy Controls**: Location data protection with approximate positioning

### Smart Contract Security
- **Deployed Contracts**: Production-ready Soroban smart contracts
- **WebAuthn Verification**: On-chain signature verification
- **Policy Enforcement**: Smart contract-based authorization
- **Multi-Signer Support**: Flexible authentication patterns
- **Custodial Model**: Secure token custody with per-user balance tracking
- **Authorization Framework**: Uses Soroban's `require_auth()` for direct authorization

## 🎨 UI Components

### Pages
- **Dashboard**: Main overview with cards, map, and navigation
- **Wallet**: Wallet management, transactions, and QR codes
- **Swap**: Token swapping interface with quotes
- **Location**: Location services and nearby users
- **Settings**: Application configuration and about
- **TransactionComplete**: Transaction confirmation page

### Components
- **Header**: Navigation with mobile menu and Stellar branding
- **PriceChart**: Interactive price charts for XLM with stake and vault balance
- **MapboxMap**: Interactive maps with fullscreen support
- **UserProfile**: Nearby user profiles and interactions
- **SendOverlay**: Send payment interface with QR scanning
- **ReceiveOverlay**: Receive payment interface with QR generation
- **DepositOverlay**: Deposit tokens to smart wallet interface
- **MarkerProfileOverlay**: Map marker user profiles
- **LocationDebugger**: Location services debugging
- **AuthModal**: Zero-knowledge authentication interface

### Services
- **passkeyService**: WebAuthn passkey registration and authentication
- **srpService**: SRP-6a zero-knowledge authentication
- **zkProofService**: Zero-knowledge proof generation and verification
  - Generates cryptographic proofs of signing capability
  - Stores proofs via backend to GeoLink
  - Verifies proofs during transaction execution
- **geoLinkService**: Location-based NFT discovery and ZK proof storage
  - Wallet Provider API: Sends location data to GeoLink
  - Data Consumer API: Retrieves nearby NFTs
  - ZK Proof Integration: Backend forwards proofs to GeoLink

### Contexts
- **WalletContext**: Global wallet state management with ZK proof support
- **LocationContext**: Location services state with 10-second updates

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

### Smart Contract Deployment

1. **Build Contracts:**
   ```bash
   cd soroban-contracts
   cargo build --target wasm32-unknown-unknown --release
   ```

2. **Deploy Contracts:**
   - Use Stellar Laboratory or Soroban CLI
   - Deploy WebAuthn Verifier contract first
   - Deploy Smart Wallet contract with verifier address
   - Update environment variables with contract IDs

3. **Contract Architecture:**
   - **WebAuthn Verifier**: Handles secp256r1 signature verification
   - **Smart Wallet**: Main contract with deposit, payment, and balance functions
   - **Storage**: Uses Soroban's persistent storage for balances and signer data
   - **Authorization**: Uses `require_auth()` for direct authorization (no approve step)

## 🔗 GeoLink Integration

### Overview

XYZ-Wallet integrates with GeoLink for:
- **ZK Proof Storage**: Stores zero-knowledge proofs for transaction verification
- **Location-Based NFTs**: Discover and collect location-based NFTs
- **Data Provider**: Sends user location data to GeoLink
- **Data Consumer**: Retrieves nearby NFTs and user data

### ZK Proof Storage Flow

1. **Frontend Generation**: ZK proof is generated in the browser using WebCrypto API
2. **Backend Storage**: Proof is sent to backend at `/api/smart-wallet/store-zk-proof`
3. **GeoLink Forwarding**: Backend forwards proof to GeoLink at `http://localhost:4000/api/zk-proof/store`
4. **Verification**: When executing transactions, proofs are verified via GeoLink at `/api/zk-proof/verify`
5. **Fallback**: If GeoLink is unavailable, proofs are stored in-memory as fallback

### GeoLink Configuration

**Backend (`server/.env`):**
```env
GEOLINK_BASE_URL=http://localhost:4000  # Default for local development
```

**Frontend (`client/.env`):**
```env
REACT_APP_GEOLINK_BASE_URL=http://localhost:4000
REACT_APP_GEOLINK_WALLET_PROVIDER_KEY=your_wallet_provider_key
REACT_APP_GEOLINK_DATA_CONSUMER_KEY=your_data_consumer_key
```

### GeoLink Features

#### Location-Based NFTs
- **NFT Discovery**: Find NFTs on the map based on location
- **Collection**: Collect NFTs when within collection radius
- **Real-time Updates**: NFTs update automatically as location changes
- **Collection Tracking**: View collected NFTs in wallet

#### Data Provider Role
- **Location Updates**: Sends user location to GeoLink every 10 seconds
- **Wallet Provider API**: Uses wallet provider key for authentication
- **Automatic Submission**: Location data submitted automatically when available

#### Data Consumer Role
- **Nearby NFTs**: Retrieves NFTs near user location
- **User Data**: Accesses location-based user data
- **Data Consumer API**: Uses data consumer key for authentication

### GeoLink API Endpoints

**ZK Proof Storage:**
- `POST /api/zk-proof/store` - Store ZK proof (called by backend)
- `POST /api/zk-proof/verify` - Verify ZK proof (called by backend)

**Location Services:**
- `POST /api/location/update` - Update user location (wallet provider)
- `GET /api/nft/nearby` - Get nearby NFTs (data consumer)
  - Returns NFTs with dynamic IPFS server URLs
  - Supports custom IPFS gateways per NFT
  - Includes `server_url` and `ipfs_hash` for image URL construction
  - New `associations` field for Workflow 2 NFT metadata
- `POST /api/nft/collect` - Collect NFT (data consumer)
- `GET /api/nft/user-collection` - Get user's NFT collection (data consumer)

**Image URL Construction:**
- The app uses utility functions (`cleanServerUrl` and `constructImageUrl`) to properly construct NFT image URLs
- Handles dynamic IPFS server URLs that may or may not include `/ipfs/` path
- Falls back to public IPFS gateway (`ipfs.io`) if server URL is unavailable
- IPFS hash format improved for Workflow 2 NFTs (no filename appended)

### GeoLink Status

- **Connection Status**: Real-time monitoring of GeoLink connection
- **Environment Detection**: Automatically detects local vs production
- **Error Handling**: Graceful fallback when GeoLink is unavailable
- **Status Indicator**: Visual indicator in UI showing connection status

## 📜 Smart Contract Details

### Contract Structure

The smart wallet contract is written in Rust and compiled to WebAssembly (WASM) for deployment on Soroban.

**Location:** `soroban-contracts/src/contract.rs`

### Core Contract Functions

#### Deposit Function
```rust
pub fn deposit(
    e: &Env,
    user_address: Address,
    asset: Address,
    amount: i128
) -> bool
```
- Transfers tokens from user to contract using `token_client.transfer()`
- Requires user authorization via `user_address.require_auth()`
- Updates user's balance in contract storage
- Returns `true` on success

#### Execute Payment Function
```rust
pub fn execute_payment(
    e: &Env,
    signer_address: Address,
    destination: Address,
    amount: i128,
    asset: Address,
    signature_payload: Bytes,
    webauthn_signature: Bytes,
    webauthn_authenticator_data: Bytes,
    webauthn_client_data: Bytes
) -> bool
```
- Verifies WebAuthn signature via verifier contract
- Checks user's balance before executing
- Transfers tokens from contract to destination
- Updates user's balance after payment
- Returns `true` on success

#### Get Balance Function
```rust
pub fn get_balance(
    e: &Env,
    user_address: Address,
    asset: Address
) -> i128
```
- Returns user's balance for a specific asset
- Returns `0` if user has no balance
- Uses nested Map storage: `Map<Address, Map<Address, i128>>`

#### Register Signer Function
```rust
pub fn register_signer(
    e: &Env,
    signer_address: Address,
    passkey_pubkey: Bytes,
    rp_id_hash: Bytes
) -> bool
```
- Stores passkey public key for signer
- Stores relying party ID hash
- Automatically called on first use
- Returns `true` on success

### Storage Structure

**Balance Storage:**
- Outer Map: `Map<Address, Map<Address, i128>>` - Maps user address to asset balances
- Inner Map: `Map<Address, i128>` - Maps asset address to balance amount

**Signer Storage:**
- Passkey Map: `Map<Address, Bytes>` - Stores passkey public keys
- RP ID Map: `Map<Address, Bytes>` - Stores relying party ID hashes

### Building and Testing

**Build Contract:**
```bash
cd soroban-contracts
cargo build --target wasm32-unknown-unknown --release
```

**Run Tests:**
```bash
cargo test
```

**WASM Output:**
```
target/wasm32-unknown-unknown/release/smart_wallet.wasm
```

### Contract Dependencies

- `soroban-sdk = "23.0.3"` - Soroban SDK
- `token` - Stellar Asset Contract (SAC) client
- OpenZeppelin contracts (for patterns and utilities)

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

6. **"Smart wallet deposit failed"**
   - Verify contract ID is correct
   - Check user has sufficient balance
   - Ensure network is testnet
   - Verify Soroban RPC is accessible

7. **"Passkey authentication failed"**
   - Ensure browser supports WebAuthn
   - Check passkey is registered
   - Verify contract has correct passkey public key

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
│   │   ├── soroswap.js       # DEX integration
│   │   ├── smartWallet.js    # Smart wallet operations
│   │   └── auth.js           # Authentication
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
│   │   │   ├── DepositOverlay.tsx # Deposit tokens
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
├── soroban-contracts/         # Smart contracts
│   ├── src/
│   │   ├── contract.rs       # Smart wallet contract
│   │   └── lib.rs            # Contract library
│   └── Cargo.toml            # Rust dependencies
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

4. **Smart Contracts**
   - Add contract functions in `soroban-contracts/src/contract.rs`
   - Follow Soroban patterns and best practices
   - Add tests for new functions

### Code Style

- **TypeScript**: Use strict typing
- **ESLint**: Follow configured linting rules
- **Styled Components**: Use consistent styling patterns
- **Error Handling**: Implement comprehensive error handling
- **Rust**: Follow Rust conventions and Soroban patterns

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
- **OpenZeppelin** for smart contract patterns

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ for the Stellar ecosystem**
