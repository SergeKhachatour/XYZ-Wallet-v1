/**
 * Encryption Service for Passkey-Gated Secret Key Storage
 * 
 * Implements the Hoops Finance model:
 * - KEK (Key Encryption Key) derived from SRP secret + optional passkey hmac-secret
 * - DEK (Data Encryption Key) randomly generated
 * - Secret key encrypted with DEK, DEK wrapped with KEK
 * - No plaintext secret key storage anywhere
 */

export interface EncryptedWalletData {
  wrappedDEK: string; // Base64 encoded wrapped DEK
  ciphertext: string; // Base64 encoded encrypted secret key
  iv: string; // Base64 encoded IV for data encryption
  wrapIv?: string; // Base64 encoded IV for key wrapping (optional, for backward compatibility)
  salt?: string; // Base64 encoded salt used for KEK derivation (required for decryption)
  metadata: {
    algorithm: string;
    keyDerivation: string;
    timestamp: number;
    version: string;
  };
}

export interface KEKDerivationParams {
  srpSecret: string; // SRP session secret
  passkeyHmacSecret?: string; // Optional passkey hmac-secret for stronger coupling
  salt: string; // Random salt for key derivation
}

export class EncryptionService {
  private readonly algorithm = 'AES-GCM';
  private readonly keyLength = 256;
  private readonly ivLength = 12; // 96 bits for GCM
  private readonly version = '1.0.0';

  /**
   * Derive KEK from SRP secret and optional passkey hmac-secret
   * Uses Argon2id (primary) or PBKDF2 (fallback) for memory-hard derivation
   */
  async deriveKEK(params: KEKDerivationParams): Promise<CryptoKey> {
    const { srpSecret, passkeyHmacSecret, salt } = params;
    
    // Combine SRP secret with optional passkey hmac-secret
    const combinedSecret = passkeyHmacSecret 
      ? `${srpSecret}:${passkeyHmacSecret}`
      : srpSecret;
    
    // Convert salt to Uint8Array
    const saltBytes = this.base64ToUint8Array(salt);
    
    try {
      // Try Argon2id first (memory-hard, more secure)
      return await this.deriveKeyWithArgon2id(combinedSecret, saltBytes);
    } catch (error) {
      console.warn('Argon2id not available, falling back to PBKDF2:', error);
      // Fallback to PBKDF2 for older devices
      return await this.deriveKeyWithPBKDF2(combinedSecret, saltBytes);
    }
  }

  /**
   * Derive key using Argon2id (preferred method)
   */
  private async deriveKeyWithArgon2id(secret: string, salt: Uint8Array): Promise<CryptoKey> {
    // For now, use PBKDF2 as Argon2id requires additional WASM library
    // In production, integrate argon2-browser WASM
    return await this.deriveKeyWithPBKDF2(secret, salt);
  }

  /**
   * Derive key using PBKDF2 (fallback method)
   */
  private async deriveKeyWithPBKDF2(secret: string, salt: Uint8Array): Promise<CryptoKey> {
    const secretKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 200000, // Strong iteration count
        hash: 'SHA-256'
      },
      secretKey,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['wrapKey', 'unwrapKey']
    );
  }

  /**
   * Generate a random DEK (Data Encryption Key)
   */
  async generateDEK(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: this.algorithm, length: this.keyLength },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt secret key with DEK
   */
  async encryptSecretKey(secretKey: string, dek: CryptoKey): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
    const plaintext = new TextEncoder().encode(secretKey);
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: this.algorithm, iv: iv },
      dek,
      plaintext
    );
    
    return {
      ciphertext: new Uint8Array(ciphertext),
      iv: iv
    };
  }

  /**
   * Decrypt secret key with DEK
   */
  async decryptSecretKeyWithDEK(ciphertext: Uint8Array, iv: Uint8Array, dek: CryptoKey): Promise<string> {
    const plaintext = await crypto.subtle.decrypt(
      { name: this.algorithm, iv: iv },
      dek,
      ciphertext
    );
    
    return new TextDecoder().decode(plaintext);
  }

  /**
   * Wrap DEK with KEK
   * Note: AES-GCM requires an IV for wrapping operations
   * We generate a random IV for each wrap operation
   */
  async wrapDEK(dek: CryptoKey, kek: CryptoKey, wrapIv?: Uint8Array): Promise<ArrayBuffer> {
    // Generate IV if not provided
    const iv = wrapIv || crypto.getRandomValues(new Uint8Array(this.ivLength));
    
    return await crypto.subtle.wrapKey(
      'raw',
      dek,
      kek,
      { 
        name: this.algorithm,
        iv: iv
      }
    );
  }

  /**
   * Unwrap DEK with KEK
   * Note: The IV used for wrapping must match the IV used for unwrapping
   * Since we generate a random IV for wrapping, we need to store it
   * For now, we'll use a fixed IV or derive it from the wrapped data
   * Actually, for key wrapping, AES-KW is better, but to maintain compatibility,
   * we'll need to store the wrap IV separately or use a deterministic IV
   */
  async unwrapDEK(wrappedDEK: ArrayBuffer, kek: CryptoKey, wrapIv: Uint8Array): Promise<CryptoKey> {
    // wrapIv is now required (checked in decryptSecretKey)
    // This function assumes wrapIv is always provided
    
    try {
      return await crypto.subtle.unwrapKey(
        'raw',
        wrappedDEK,
        kek,
        { 
          name: this.algorithm,
          iv: wrapIv
        },
        { name: this.algorithm, length: this.keyLength },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (unwrapError: any) {
      // Provide a more descriptive error message
      const errorName = unwrapError?.name || 'UnknownError';
      const errorMsg = unwrapError?.message || 'Unknown error';
      
      // Check if it's a common Web Crypto error
      if (errorName === 'OperationError' || errorName === 'InvalidAccessError') {
        throw new Error(`Failed to decrypt wallet encryption key. This wallet may have been created before encryption improvements (missing wrap IV). Please create a new wallet. Original error: ${errorMsg}`);
      }
      
      // Re-throw with more context
      throw new Error(`Failed to unwrap encryption key: ${errorMsg}`);
    }
  }

  /**
   * Encrypt and store secret key with passkey-gated access
   */
  async encryptAndStoreSecretKey(
    secretKey: string,
    kekParams: KEKDerivationParams
  ): Promise<EncryptedWalletData> {
    // Generate random salt for this encryption
    const salt = this.generateSalt();
    
    // Derive KEK
    const kek = await this.deriveKEK({ ...kekParams, salt });
    
    // Generate DEK
    const dek = await this.generateDEK();
    
    // Encrypt secret key with DEK
    const { ciphertext, iv } = await this.encryptSecretKey(secretKey, dek);
    
    // Wrap DEK with KEK (generate IV for wrapping)
    const wrapIv = crypto.getRandomValues(new Uint8Array(this.ivLength));
    const wrappedDEK = await this.wrapDEK(dek, kek, wrapIv);
    
    return {
      wrappedDEK: this.uint8ArrayToBase64(new Uint8Array(wrappedDEK)),
      ciphertext: this.uint8ArrayToBase64(ciphertext),
      iv: this.uint8ArrayToBase64(iv),
      wrapIv: this.uint8ArrayToBase64(wrapIv), // Store wrap IV for unwrapping
      salt: salt, // Store salt for KEK derivation during decryption
      metadata: {
        algorithm: this.algorithm,
        keyDerivation: 'PBKDF2', // or 'Argon2id' when available
        timestamp: Date.now(),
        version: this.version
      }
    };
  }

  /**
   * Decrypt and retrieve secret key with passkey-gated access
   */
  async decryptSecretKey(
    encryptedData: EncryptedWalletData,
    kekParams: KEKDerivationParams
  ): Promise<string> {
    // Check if wrapIv is missing or invalid (wallet created before encryption fix)
    if (!encryptedData.wrapIv || encryptedData.wrapIv.trim() === '') {
      throw new Error('Cannot decrypt wallet: This wallet was created before wrap IV storage was implemented (before encryption fix). The encryption key cannot be recovered without the wrap IV. Please create a new wallet in incognito mode.');
    }

    // Check if salt is missing (wallet created before salt storage was added)
    if (!encryptedData.salt || encryptedData.salt.trim() === '') {
      throw new Error('Cannot decrypt wallet: This wallet was created before salt storage was implemented. The encryption key cannot be recovered without the salt. Please create a new wallet.');
    }

    // Derive KEK using stored salt (not the one from kekParams)
    const kek = await this.deriveKEK({ ...kekParams, salt: encryptedData.salt });

    // Unwrap DEK
    const wrappedDEK = this.base64ToUint8Array(encryptedData.wrappedDEK);
    let wrapIv: Uint8Array;
    try {
      wrapIv = this.base64ToUint8Array(encryptedData.wrapIv);
      // Validate wrapIv length (should be 12 bytes for AES-GCM)
      if (wrapIv.length !== this.ivLength) {
        throw new Error(`Invalid wrap IV length: expected ${this.ivLength} bytes, got ${wrapIv.length}. This wallet may have been created before encryption improvements.`);
      }
    } catch (parseError: any) {
      throw new Error(`Failed to parse wrap IV: ${parseError.message}. This wallet may have been created before encryption improvements. Please create a new wallet.`);
    }
    
    let dek: CryptoKey;
    try {
      dek = await this.unwrapDEK(wrappedDEK.buffer, kek, wrapIv);
    } catch (unwrapError: any) {
      // Provide a clearer error message for decryption failures
      const errorMsg = unwrapError?.message || 'Unknown decryption error';
      if (errorMsg.includes('wrap IV') || errorMsg.includes('wrapIv')) {
        throw unwrapError; // Re-throw if it's already our custom error
      }
      throw new Error(`Failed to decrypt wallet encryption key: ${errorMsg}. This may indicate the wallet was created before encryption improvements. Please create a new wallet.`);
    }

    // Decrypt secret key
    const ciphertext = this.base64ToUint8Array(encryptedData.ciphertext);
    const iv = this.base64ToUint8Array(encryptedData.iv);

    return await this.decryptSecretKeyWithDEK(ciphertext, iv, dek);
  }

  /**
   * Generate a random salt
   */
  private generateSalt(): string {
    const salt = crypto.getRandomValues(new Uint8Array(32));
    return this.uint8ArrayToBase64(salt);
  }

  /**
   * Convert base64 string to Uint8Array
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Convert Uint8Array to base64 string
   */
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Store encrypted wallet data in localStorage
   */
  storeEncryptedWalletData(encryptedData: EncryptedWalletData): void {
    localStorage.setItem('xyz_encrypted_wallet', JSON.stringify(encryptedData));
  }

  /**
   * Retrieve encrypted wallet data from localStorage
   */
  getEncryptedWalletData(): EncryptedWalletData | null {
    const stored = localStorage.getItem('xyz_encrypted_wallet');
    if (!stored) return null;
    
    try {
      return JSON.parse(stored) as EncryptedWalletData;
    } catch (error) {
      console.error('Failed to parse encrypted wallet data:', error);
      return null;
    }
  }

  /**
   * Clear encrypted wallet data
   */
  clearEncryptedWalletData(): void {
    localStorage.removeItem('xyz_encrypted_wallet');
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
