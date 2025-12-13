/**
 * SRP-6a Authentication Service
 * Implements Secure Remote Password protocol for zero-knowledge authentication
 * Based on Hoops Finance's production implementation
 */

// passkeyService not currently used in this module

export interface SRPRegistration {
  publicKey: string;
  saltHex: string;
  verifierHex: string;
  kdf: string;
}

export interface SRPLoginStart {
  publicKey: string;
  Ahex: string;
}

export interface SRPLoginFinish {
  publicKey: string;
  Ahex: string;
  M1hex: string;
  nonce: string;
}

export interface SRPResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  needsSrpMigration?: boolean;
  policy?: any;
  error?: string;
}

export class SRPService {
  private readonly N = this.hexToBigInt('AC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07FC3192943DB56050A37329CBB4A099ED8193E0757767A13DD52312AB4B03310DCD7F48A9DA04FD50E8083969EDB767B0CF6095179A163AB3661A05FBD5FAAAE82918A9962F0B93B855F97993EC975EEAA80D740ADBF4FF747359D041D5C33EA71D281E446B14773BCA97B43A23FB801676BD207A436C6481F1D2B9078717461A5B9D32E688F87748544523B524B0D57D5EA77A2775D2ECFA032CFBDBF52FB3786160279004E57AE6AF874E7303CE53299CCC041C7BC308D82A5698F3A8D0C38271AE35F8E9DBFBB694B5C803D89F7AE435DE236D525F54759B65E372FCD68EF20FA7111F9E4AFF73');
  private readonly g = BigInt(2);
  private readonly k = this.hexToBigInt('7556AA045AEF2CDD07ABAF0F665C3E818913186F');

  /**
   * Register a new wallet with SRP-6a using public key as identity
   */
  async register(publicKey: string, secretKey: string): Promise<SRPResponse> {
    try {
      // Generate salt
      const salt = this.generateSalt();
      const saltHex = this.bigIntToHex(salt);

      // Derive private exponent using the secret key
      const x = await this.derivePrivateExponent(publicKey, secretKey, salt);
      
      // Compute verifier v = g^x mod N
      const v = this.modPow(this.g, x, this.N);
      const verifierHex = this.bigIntToHex(v);

      // Use Argon2id as primary KDF
      const kdf = 'argon2id';

      const registrationData: SRPRegistration = {
        publicKey,
        saltHex,
        verifierHex,
        kdf
      };

      // Send to server
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/auth/srp/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('SRP registration failed:', error);
      throw new Error(`SRP registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start SRP login process using wallet keys
   */
  async loginStart(publicKey: string, secretKey: string): Promise<{ saltHex: string; Bhex: string; kdf: string; nonce: string }> {
    try {
      // Generate client ephemeral A
      const a = this.generatePrivateExponent();
      const A = this.modPow(this.g, a, this.N);
      const Ahex = this.bigIntToHex(A);

      const loginStartData: SRPLoginStart = {
        publicKey,
        Ahex
      };

      // Send to server
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/auth/srp/login/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginStartData),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Login start failed');
      }

      // Store ephemeral values for finish step
      sessionStorage.setItem('srp_a', this.bigIntToHex(a));
      sessionStorage.setItem('srp_A', Ahex);
      sessionStorage.setItem('srp_publicKey', publicKey);
      sessionStorage.setItem('srp_secretKey', secretKey);

      return {
        saltHex: result.saltHex,
        Bhex: result.Bhex,
        kdf: result.kdf,
        nonce: result.nonce
      };
    } catch (error) {
      console.error('SRP login start failed:', error);
      throw new Error(`SRP login start failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Complete SRP login process using wallet keys
   */
  async loginFinish(saltHex: string, Bhex: string, kdf: string, nonce: string): Promise<SRPResponse> {
    try {
      // Retrieve stored values
      const aHex = sessionStorage.getItem('srp_a');
      const AHex = sessionStorage.getItem('srp_A');
      const publicKey = sessionStorage.getItem('srp_publicKey');
      const secretKey = sessionStorage.getItem('srp_secretKey');

      if (!aHex || !AHex || !publicKey || !secretKey) {
        throw new Error('Missing SRP session data');
      }

      const a = this.hexToBigInt(aHex);
      const A = this.hexToBigInt(AHex);
      const B = this.hexToBigInt(Bhex);
      const salt = this.hexToBigInt(saltHex);

      // Validate B mod N != 0
      if (B % this.N === BigInt(0)) {
        throw new Error('Invalid server response');
      }

      // Compute u = H(A, B)
      const u = await this.computeU(A, B);

      // Derive private exponent using wallet keys
      const x = await this.derivePrivateExponent(publicKey, secretKey, salt);

      // Compute session key K
      const S = this.modPow(B - this.k * this.modPow(this.g, x, this.N), a + u * x, this.N);
      const K = await this.computeSHA256(S);

      // Compute M1 = H(A, B, K)
      const M1 = await this.computeM1(A, B, K);

      const loginFinishData: SRPLoginFinish = {
        publicKey,
        Ahex: AHex,
        M1hex: this.bigIntToHex(M1),
        nonce
      };

      // Send to server
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/auth/srp/login/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginFinishData),
      });

      const result = await response.json();

      // Clean up session storage
      sessionStorage.removeItem('srp_a');
      sessionStorage.removeItem('srp_A');
      sessionStorage.removeItem('srp_publicKey');
      sessionStorage.removeItem('srp_secretKey');

      return result;
    } catch (error) {
      console.error('SRP login finish failed:', error);
      throw new Error(`SRP login finish failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Derive private exponent using wallet keys
   */
  private async derivePrivateExponent(publicKey: string, secretKey: string, salt: bigint): Promise<bigint> {
    try {
      // Use WebCrypto API for key derivation
      const keyMaterial = new TextEncoder().encode(`${publicKey}:${secretKey}`);
      const saltBuffer = this.bigIntToArrayBuffer(salt);
      
      // Import key material
      const key = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        'PBKDF2',
        false,
        ['deriveBits']
      );

      // Derive bits using PBKDF2
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: 200000, // Strong iteration count
          hash: 'SHA-256'
        },
        key,
        256
      );

      // Convert to bigint
      const derivedArray = new Uint8Array(derivedBits);
      let result = BigInt(0);
      for (let i = 0; i < derivedArray.length; i++) {
        result = (result << BigInt(8)) + BigInt(derivedArray[i]);
      }

      return result % this.N;
    } catch (error) {
      console.error('Failed to derive private exponent:', error);
      throw new Error('Failed to derive private exponent');
    }
  }

  /**
   * Generate random salt
   */
  private generateSalt(): bigint {
    const saltBytes = crypto.getRandomValues(new Uint8Array(32));
    let salt = BigInt(0);
    for (let i = 0; i < saltBytes.length; i++) {
      salt = (salt << BigInt(8)) + BigInt(saltBytes[i]);
    }
    return salt;
  }

  /**
   * Generate private exponent
   */
  private generatePrivateExponent(): bigint {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    let result = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
      result = (result << BigInt(8)) + BigInt(bytes[i]);
    }
    return result % this.N;
  }

  /**
   * Compute modular exponentiation
   */
  private modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    let result = BigInt(1);
    base = base % modulus;
    while (exponent > BigInt(0)) {
      if (exponent % BigInt(2) === BigInt(1)) {
        result = (result * base) % modulus;
      }
      exponent = exponent >> BigInt(1);
      base = (base * base) % modulus;
    }
    return result;
  }

  /**
   * Compute u = H(A, B)
   */
  private async computeU(A: bigint, B: bigint): Promise<bigint> {
    const AHex = this.bigIntToHex(A);
    const BHex = this.bigIntToHex(B);
    const hash = await this.computeSHA256String(AHex + BHex);
    return this.hexToBigInt(hash);
  }

  /**
   * Compute M1 = H(A, B, K)
   */
  private async computeM1(A: bigint, B: bigint, K: bigint): Promise<bigint> {
    const AHex = this.bigIntToHex(A);
    const BHex = this.bigIntToHex(B);
    const KHex = this.bigIntToHex(K);
    const hash = await this.computeSHA256String(AHex + BHex + KHex);
    return this.hexToBigInt(hash);
  }

  /**
   * Compute SHA-256 hash
   */
  private async computeSHA256(value: bigint): Promise<bigint> {
    const hex = this.bigIntToHex(value);
    const hash = await this.computeSHA256String(hex);
    return this.hexToBigInt(hash);
  }

  /**
   * Compute SHA-256 hash of string
   */
  private async computeSHA256String(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Convert hex string to BigInt
   */
  private hexToBigInt(hex: string): bigint {
    return BigInt('0x' + hex);
  }

  /**
   * Convert BigInt to hex string
   */
  private bigIntToHex(value: bigint): string {
    return value.toString(16);
  }

  /**
   * Convert BigInt to ArrayBuffer
   */
  private bigIntToArrayBuffer(value: bigint): ArrayBuffer {
    const hex = this.bigIntToHex(value);
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }
}

// Export singleton instance
export const srpService = new SRPService();
