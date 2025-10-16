const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.mapbox.com", "https://*.mapbox.com", "https://horizon-testnet.stellar.org", "https://horizon.stellar.org", "https://soroswap.com", "https://*.soroswap.com", "https://geolink-buavavc6gse5c9fw.westus-01.azurewebsites.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com"],
      workerSrc: ["'self'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      fontSrc: ["'self'", "https://api.mapbox.com"]
    }
  }
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting - more generous for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000 // limit each IP to 1000 requests per minute
});
app.use(limiter);

// Routes
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/location', require('./routes/location'));
app.use('/api/soroswap', require('./routes/soroswap'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    network: process.env.STELLAR_NETWORK || 'testnet',
    nodeEnv: process.env.NODE_ENV,
    currentDir: __dirname,
    buildPath: path.join(__dirname, 'client/build'),
    buildExists: require('fs').existsSync(path.join(__dirname, 'client/build'))
  });
});

// Simple test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Debug environment and paths
console.log('🔍 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', __dirname);
console.log('Looking for React build at:', path.join(__dirname, '../client/build'));

// Always try to serve React app in production environment
const buildPath = path.join(__dirname, '../client/build');
console.log('Build path exists:', require('fs').existsSync(buildPath));

if (require('fs').existsSync(buildPath)) {
  console.log('✅ Serving React app from:', buildPath);
  app.use(express.static(buildPath));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    console.log('📄 Serving React app for route:', req.path);
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  console.warn('⚠️  React build directory not found at:', buildPath);
  console.log('Available directories in server folder:');
  try {
    const files = require('fs').readdirSync(__dirname);
    console.log(files);
  } catch (e) {
    console.log('Could not read directory:', e.message);
  }
  
  // 404 handler for production without build
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'React app not found', 
      buildPath: buildPath,
      exists: require('fs').existsSync(buildPath),
      currentDir: __dirname
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Add error handling for server startup
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 XYZ-Wallet-v1 Backend running on port ${PORT}`);
  console.log(`🌐 Network: ${process.env.STELLAR_NETWORK || 'testnet'}`);
  console.log(`📡 Horizon: ${process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'}`);
  console.log(`📁 Current directory: ${__dirname}`);
  console.log(`📁 React build path: ${path.join(__dirname, 'client/build')}`);
  console.log(`📁 React build exists: ${require('fs').existsSync(path.join(__dirname, 'client/build'))}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 Listening on: 0.0.0.0:${PORT}`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});
