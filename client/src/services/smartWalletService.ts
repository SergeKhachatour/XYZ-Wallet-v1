// client/src/services/smartWalletService.ts
// Buffer not currently used in this service

export interface SmartWalletConfig {
  contractId: string;
  passkeyPublicKey: string;
  networkPassphrase: string;
  rpcUrl: string;
}

export interface PasskeyCredential {
  id: string;
  publicKey: string; // Base64 encoded
  counter: number;
  deviceType: string;
  createdAt: string;
}

export interface TransactionData {
  destination: string;
  amount: string;
  asset?: string;
  memo?: string;
}

export class SmartWalletService {
  private config: SmartWalletConfig;
  private rpId: string;
  private rpName: string;

  constructor(config: SmartWalletConfig) {
    this.config = config;
    this.rpId = window.location.hostname;
    this.rpName = 'XYZ-Wallet Smart Wallet';
  }

  /**
   * Check if WebAuthn is supported by the browser
   */
  isWebAuthnSupported(): boolean {
    return !!(
      window.PublicKeyCredential &&
      window.navigator.credentials &&
      typeof window.navigator.credentials.create === 'function' &&
      typeof window.navigator.credentials.get === 'function'
    );
  }

  /**
   * Check if passkeys are available on this device
   */
  async isPasskeyAvailable(): Promise<boolean> {
    if (!this.isWebAuthnSupported()) {
      return false;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      console.warn('Passkey availability check failed:', error);
      return false;
    }
  }

  /**
   * Register a new passkey for the smart wallet
   */
  async registerPasskey(userId: string): Promise<PasskeyCredential> {
    if (!this.isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      // Generate a challenge (in production, this should come from your server)
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          id: this.rpId,
          name: this.rpName,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: 'XYZ-Wallet User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Prefer platform authenticators
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create passkey');
      }

      // Extract the credential data
      const response = credential.response as AuthenticatorAttestationResponse;
      const publicKey = this.arrayBufferToBase64(response.getPublicKey()!);
      const credentialId = this.arrayBufferToBase64(credential.rawId);

      return {
        id: credentialId,
        publicKey,
        counter: 0,
        deviceType: this.getDeviceType(),
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Passkey registration failed:', error);
      throw new Error(`Passkey registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Authenticate using an existing passkey
   */
  async authenticatePasskey(credentialId?: string): Promise<{ credentialId: string; signature: string }> {
    if (!this.isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      // Generate a challenge (in production, this should come from your server)
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        rpId: this.rpId,
        userVerification: 'required',
        allowCredentials: credentialId ? [{
          id: this.base64ToArrayBuffer(credentialId),
          type: 'public-key',
        }] : undefined,
      };

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to authenticate with passkey');
      }

      const response = credential.response as AuthenticatorAssertionResponse;
      const signature = this.arrayBufferToBase64(response.signature);
      const credentialIdBase64 = this.arrayBufferToBase64(credential.rawId);

      return {
        credentialId: credentialIdBase64,
        signature,
      };
    } catch (error) {
      console.error('Passkey authentication failed:', error);
      throw new Error(`Passkey authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize the smart wallet contract with a passkey
   */
  async initializeSmartWallet(passkeyCredential: PasskeyCredential): Promise<string> {
    try {
      // Convert base64 public key to BytesN format for the contract
      const publicKeyBytes = this.base64ToArrayBuffer(passkeyCredential.publicKey);
      
      // Call the smart wallet contract's initialize function
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/smart-wallet/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: this.config.contractId,
          passkeyPublicKey: this.arrayBufferToBase64(publicKeyBytes),
          networkPassphrase: this.config.networkPassphrase,
          rpcUrl: this.config.rpcUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize smart wallet: ${response.statusText}`);
      }

      const result = await response.json();
      return result.walletAddress;
    } catch (error) {
      console.error('Smart wallet initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute a transaction using passkey authentication
   */
  async executeTransaction(
    transactionData: TransactionData,
    passkeyCredential: PasskeyCredential
  ): Promise<boolean> {
    try {
      // Authenticate with passkey
      const auth = await this.authenticatePasskey(passkeyCredential.id);
      
      // Create transaction hash (in production, this should be done properly)
      const transactionHash = new Uint8Array(32);
      crypto.getRandomValues(transactionHash);

      // Call the smart wallet contract's execute_transaction function
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/smart-wallet/execute-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: this.config.contractId,
          transactionData: {
            ...transactionData,
            hash: this.arrayBufferToBase64(transactionHash),
          },
          signature: auth.signature,
          passkeyPublicKey: passkeyCredential.publicKey,
          networkPassphrase: this.config.networkPassphrase,
          rpcUrl: this.config.rpcUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Transaction execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Transaction execution failed:', error);
      throw error;
    }
  }

  /**
   * Get smart wallet information
   */
  async getSmartWalletInfo(): Promise<any> {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/smart-wallet/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: this.config.contractId,
          networkPassphrase: this.config.networkPassphrase,
          rpcUrl: this.config.rpcUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get smart wallet info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get smart wallet info:', error);
      throw error;
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Get device type for passkey metadata
   */
  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'iOS';
    } else if (userAgent.includes('android')) {
      return 'Android';
    } else if (userAgent.includes('mac')) {
      return 'macOS';
    } else if (userAgent.includes('windows')) {
      return 'Windows';
    } else {
      return 'Unknown';
    }
  }
}

// Export a factory function to create instances
export const createSmartWalletService = (config: SmartWalletConfig): SmartWalletService => {
  return new SmartWalletService(config);
};
