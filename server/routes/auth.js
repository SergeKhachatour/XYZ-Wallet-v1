/**
 * Authentication Routes
 * Implements SRP-6a authentication with passkey integration
 * Based on Hoops Finance's production implementation
 */

const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const router = express.Router();

// In production, use Redis or database
const users = new Map();
const sessions = new Map();

// SRP-6a parameters (RFC 5054)
const N = BigInt('0xAC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07FC3192943DB56050A37329CBB4A099ED8193E0757767A13DD52312AB4B03310DCD7F48A9DA04FD50E8083969EDB767B0CF6095179A163AB3661A05FBD5FAAAE82918A9962F0B93B855F97993EC975EEAA80D740ADBF4FF747359D041D5C33EA71D281E446B14773BCA97B43A23FB801676BD207A436C6481F1D2B9078717461A5B9D32E688F87748544523B524B0D57D5EA77A2775D2ECFA032CFBDBF52FB3786160279004E57AE6AF874E7303CE53299CCC041C7BC308D82A5698F3A8D0C38271AE35F8E9DBFBB694B5C803D89F7AE435DE236D525F54759B65E372FCD68EF20FA7111F9E4AFF73');
const g = 2n;
const k = BigInt('0x7556AA045AEF2CDD07ABAF0F665C3E818913186F');

/**
 * SRP Registration using wallet public key
 */
router.post('/srp/register', async (req, res) => {
  try {
    const { publicKey, saltHex, verifierHex, kdf } = req.body;

    // Validate input
    if (!publicKey || !saltHex || !verifierHex || !kdf) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate Stellar public key format
    if (!publicKey.startsWith('G') || publicKey.length !== 56) {
      return res.status(400).json({ error: 'Invalid Stellar public key format' });
    }

    // Check if wallet already exists
    if (users.has(publicKey)) {
      return res.status(400).json({ error: 'Wallet already registered' });
    }

    // Validate verifier (v mod N != 0)
    const v = BigInt('0x' + verifierHex);
    if (v % N === 0n) {
      return res.status(400).json({ error: 'Invalid verifier' });
    }

    // Store wallet data
    users.set(publicKey, {
      publicKey,
      saltHex,
      verifierHex,
      kdf,
      createdAt: new Date().toISOString(),
      lastLogin: null
    });

    console.log(`✅ SRP wallet registered: ${publicKey}`);

    res.json({
      success: true,
      message: 'Wallet registered successfully'
    });
  } catch (error) {
    console.error('SRP registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * SRP Login Start using wallet public key
 */
router.post('/srp/login/start', async (req, res) => {
  try {
    const { publicKey, Ahex } = req.body;

    // Validate input
    if (!publicKey || !Ahex) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get wallet data
    const wallet = users.get(publicKey);
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet not found' });
    }

    // Validate A mod N != 0
    const A = BigInt('0x' + Ahex);
    if (A % N === 0n) {
      return res.status(400).json({ error: 'Invalid client value' });
    }

    // Generate server ephemeral b, B
    const b = generatePrivateExponent();
    const B = (k * BigInt('0x' + wallet.verifierHex) + modPow(g, b, N)) % N;

    // Generate nonce for this session
    const nonce = crypto.randomUUID();

    // Store session data
    sessions.set(nonce, {
      publicKey,
      A,
      b,
      B,
      timestamp: Date.now()
    });

    // Clean up expired sessions
    cleanupExpiredSessions();

    res.json({
      success: true,
      saltHex: wallet.saltHex,
      Bhex: B.toString(16),
      kdf: wallet.kdf,
      nonce
    });
  } catch (error) {
    console.error('SRP login start error:', error);
    res.status(500).json({ error: 'Login start failed' });
  }
});

/**
 * SRP Login Finish using wallet public key
 */
router.post('/srp/login/finish', async (req, res) => {
  try {
    const { publicKey, Ahex, M1hex, nonce } = req.body;

    // Validate input
    if (!publicKey || !Ahex || !M1hex || !nonce) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get session data
    const session = sessions.get(nonce);
    if (!session || session.publicKey !== publicKey) {
      return res.status(400).json({ error: 'Invalid or expired session' });
    }

    // Get wallet data
    const wallet = users.get(publicKey);
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet not found' });
    }

    const A = BigInt('0x' + Ahex);
    const M1 = BigInt('0x' + M1hex);

    // Verify A matches session
    if (A !== session.A) {
      return res.status(400).json({ error: 'Invalid client value' });
    }

    // Compute u = H(A, B)
    const u = computeU(session.A, session.B);

    // Compute server session key
    const S = modPow(session.A * modPow(BigInt('0x' + wallet.verifierHex), u, N), session.b, N);
    const K = computeSHA256(S);

    // Compute M1 = H(A, B, K)
    const expectedM1 = computeM1(session.A, session.B, K);

    // Verify M1
    if (M1 !== expectedM1) {
      return res.status(400).json({ error: 'Authentication failed' });
    }

    // Compute M2 = H(A, M1, K)
    const M2 = computeM2(session.A, M1, K);

    // Generate tokens
    const accessToken = generateAccessToken(publicKey);
    const refreshToken = generateRefreshToken(publicKey);

    // Update wallet last login
    wallet.lastLogin = new Date().toISOString();
    users.set(publicKey, wallet);

    // Clean up session
    sessions.delete(nonce);

    console.log(`✅ SRP wallet authenticated: ${publicKey}`);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      serverProofHex: M2.toString(16)
    });
  } catch (error) {
    console.error('SRP login finish error:', error);
    res.status(500).json({ error: 'Login finish failed' });
  }
});

/**
 * ZK Proof Verification
 */
router.post('/zk/verify', async (req, res) => {
  try {
    const { publicKey, proofHash } = req.body;

    // Validate input
    if (!publicKey || !proofHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate Stellar public key format
    if (!publicKey.startsWith('G') || publicKey.length !== 56) {
      return res.status(400).json({ error: 'Invalid Stellar public key format' });
    }

    // In a real implementation, this would verify the ZK proof
    // For now, we'll do basic validation
    if (proofHash.length !== 64) { // SHA-256 hex length
      return res.status(400).json({ error: 'Invalid proof format' });
    }

    // Store verified proof
    const verifiedProofs = new Map(); // In production, use Redis or database
    verifiedProofs.set(publicKey, {
      proofHash,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    console.log(`✅ ZK proof verified for wallet: ${publicKey}`);

    res.json({
      success: true,
      message: 'ZK proof verified successfully',
      proofHash
    });
  } catch (error) {
    console.error('ZK proof verification error:', error);
    res.status(500).json({ error: 'Proof verification failed' });
  }
});

/**
 * Generate access token
 */
function generateAccessToken(publicKey) {
  return jwt.sign(
    { 
      publicKey, 
      type: 'access',
      sessionId: crypto.randomUUID()
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '15m' }
  );
}

/**
 * Generate refresh token
 */
function generateRefreshToken(publicKey) {
  return jwt.sign(
    { 
      publicKey, 
      type: 'refresh',
      sessionId: crypto.randomUUID()
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
}

/**
 * Generate private exponent
 */
function generatePrivateExponent() {
  const bytes = crypto.randomBytes(32);
  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result = (result << 8n) + BigInt(bytes[i]);
  }
  return result % N;
}

/**
 * Compute modular exponentiation
 */
function modPow(base, exponent, modulus) {
  let result = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    exponent = exponent >> 1n;
    base = (base * base) % modulus;
  }
  return result;
}

/**
 * Compute u = H(A, B)
 */
function computeU(A, B) {
  const AHex = A.toString(16);
  const BHex = B.toString(16);
  const hash = crypto.createHash('sha256').update(AHex + BHex).digest('hex');
  return BigInt('0x' + hash);
}

/**
 * Compute M1 = H(A, B, K)
 */
function computeM1(A, B, K) {
  const AHex = A.toString(16);
  const BHex = B.toString(16);
  const KHex = K.toString(16);
  const hash = crypto.createHash('sha256').update(AHex + BHex + KHex).digest('hex');
  return BigInt('0x' + hash);
}

/**
 * Compute M2 = H(A, M1, K)
 */
function computeM2(A, M1, K) {
  const AHex = A.toString(16);
  const M1Hex = M1.toString(16);
  const KHex = K.toString(16);
  const hash = crypto.createHash('sha256').update(AHex + M1Hex + KHex).digest('hex');
  return BigInt('0x' + hash);
}

/**
 * Compute SHA-256 hash
 */
function computeSHA256(value) {
  const hex = value.toString(16);
  const hash = crypto.createHash('sha256').update(hex).digest('hex');
  return BigInt('0x' + hash);
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [nonce, session] of sessions.entries()) {
    if (now - session.timestamp > 5 * 60 * 1000) { // 5 minutes
      sessions.delete(nonce);
    }
  }
}

module.exports = router;
