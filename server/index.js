const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.mapbox.com", "https://*.mapbox.com", "https://horizon-testnet.stellar.org", "https://horizon.stellar.org", "https://soroswap.com", "https://*.soroswap.com"],
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
    network: process.env.STELLAR_NETWORK || 'testnet'
  });
});

// Serve static files from the React app build directory (for production)
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  
  // Check if build directory exists
  if (require('fs').existsSync(buildPath)) {
    app.use(express.static(buildPath));
    
    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  } else {
    console.warn('⚠️  React build directory not found. Make sure to run "npm run build" in the client directory.');
    // 404 handler for production without build
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'React app not built. Please run npm run build in client directory.' });
    });
  }
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
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

app.listen(PORT, () => {
  console.log(`🚀 XYZ-Wallet-v1 Backend running on port ${PORT}`);
  console.log(`🌐 Network: ${process.env.STELLAR_NETWORK || 'testnet'}`);
  console.log(`📡 Horizon: ${process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'}`);
});
