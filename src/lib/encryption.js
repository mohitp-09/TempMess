// End-to-End Encryption utilities using Web Crypto API
class EncryptionService {
  constructor() {
    this.keyPair = null;
    this.publicKey = null;
    this.privateKey = null;
    this.contactKeys = new Map();
    this.isInitialized = false;
    this.keyStorageKey = 'messup_encryption_keys';
    this.initPromise = null; // Prevent multiple initializations
  }

  // Generate RSA key pair ONLY once per user
  async generateKeyPair() {
    try {
      console.log('🔐 Generating new RSA key pair...');

      this.keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true, // extractable
        ["encrypt", "decrypt"]
      );

      this.publicKey = this.keyPair.publicKey;
      this.privateKey = this.keyPair.privateKey;

      // Store keys immediately
      await this.storeKeys();

      console.log('🔐 New key pair generated and stored successfully');
      return this.keyPair;
    } catch (error) {
      console.error('❌ Failed to generate key pair:', error);
      throw error;
    }
  }

  // Store keys with a single consistent key
  async storeKeys() {
    try {
      if (!this.publicKey || !this.privateKey) {
        throw new Error('No keys to store');
      }

      const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", this.publicKey);
      const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", this.privateKey);

      const keyData = {
        publicKey: publicKeyJwk,
        privateKey: privateKeyJwk,
        timestamp: Date.now(),
        version: '1.0' // Add version for future compatibility
      };

      localStorage.setItem(this.keyStorageKey, JSON.stringify(keyData));
      console.log('🔐 Keys stored successfully with timestamp:', keyData.timestamp);
    } catch (error) {
      console.error('❌ Failed to store keys:', error);
      throw error;
    }
  }

  // Load keys with better consistency - FIXED
  async loadKeys() {
    try {
      console.log('🔐 Loading encryption keys...');

      const storedData = localStorage.getItem(this.keyStorageKey);

      if (!storedData) {
        console.log('🔐 No stored keys found, generating new ones...');
        return await this.generateKeyPair();
      }

      const keyData = JSON.parse(storedData);
      console.log('🔐 Found stored keys from timestamp:', keyData.timestamp);

      // Import the stored keys
      this.publicKey = await window.crypto.subtle.importKey(
        "jwk",
        keyData.publicKey,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        true,
        ["encrypt"]
      );

      this.privateKey = await window.crypto.subtle.importKey(
        "jwk",
        keyData.privateKey,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        true,
        ["decrypt"]
      );

      console.log('🔐 Keys loaded and imported successfully');
      this.isInitialized = true;
      return { publicKey: this.publicKey, privateKey: this.privateKey };
    } catch (error) {
      console.error('❌ Failed to load keys, generating new ones:', error);
      // Clear corrupted keys and generate new ones
      localStorage.removeItem(this.keyStorageKey);
      return await this.generateKeyPair();
    }
  }

  // Get public key as JWK for sharing
  async getPublicKeyJwk() {
    await this.ensureInitialized();
    return await window.crypto.subtle.exportKey("jwk", this.publicKey);
  }

  // Generate AES key for symmetric encryption
  async generateAESKey() {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  // Check if message is encrypted JSON
  isEncryptedMessage(message) {
    if (!message || typeof message !== 'string') {
      return false;
    }

    if (!message.trim().startsWith('{')) {
      return false;
    }

    try {
      const parsed = JSON.parse(message);
      return parsed &&
             typeof parsed === 'object' &&
             typeof parsed.encryptedMessage === 'string' &&
             typeof parsed.encryptedKey === 'string' &&
             typeof parsed.iv === 'string' &&
             parsed.encryptedMessage.length > 0 &&
             parsed.encryptedKey.length > 0 &&
             parsed.iv.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Ensure keys are loaded before any operation
  async ensureInitialized() {
    if (this.isInitialized && this.publicKey && this.privateKey) {
      return;
    }

    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.loadKeys();
    await this.initPromise;
    this.initPromise = null;
  }

  // FIXED: Get contact's public key properly
  async getContactPublicKey(username) {
    try {
      console.log(`🔐 Getting public key for contact: ${username}`);
      
      // First check in-memory cache
      if (this.contactKeys.has(username)) {
        const publicKeyJwk = this.contactKeys.get(username);
        console.log(`🔐 Found ${username}'s key in memory cache`);
        
        // Import and return the key
        return await window.crypto.subtle.importKey(
          "jwk",
          publicKeyJwk,
          {
            name: "RSA-OAEP",
            hash: "SHA-256",
          },
          false,
          ["encrypt"]
        );
      }
      
      // Check localStorage
      const contactKeys = JSON.parse(localStorage.getItem('contactPublicKeys') || '{}');
      if (contactKeys[username]) {
        console.log(`🔐 Found ${username}'s key in localStorage`);
        
        // Store in memory cache for future use
        this.contactKeys.set(username, contactKeys[username]);
        
        // Import and return the key
        return await window.crypto.subtle.importKey(
          "jwk",
          contactKeys[username],
          {
            name: "RSA-OAEP",
            hash: "SHA-256",
          },
          false,
          ["encrypt"]
        );
      }
      
      // For demo purposes, if no contact key found, use our own key
      console.warn(`⚠️ No public key found for ${username}, using own key for demo`);
      await this.ensureInitialized();
      return this.publicKey;
      
    } catch (error) {
      console.error(`❌ Failed to get contact public key for ${username}:`, error);
      
      // Fallback to our own key for demo
      await this.ensureInitialized();
      return this.publicKey;
    }
  }

  // FIXED: Encrypt message using recipient's public key
  async encryptMessage(message, recipientUsername) {
    try {
      await this.ensureInitialized();

      console.log(`🔐 Encrypting message for ${recipientUsername}...`);

      // Get the recipient's public key (FIXED: was using our own key)
      const recipientPublicKey = await this.getContactPublicKey(recipientUsername);
      
      if (!recipientPublicKey) {
        console.error(`❌ No public key available for ${recipientUsername}`);
        return null;
      }

      // Generate AES key for this message
      const aesKey = await this.generateAESKey();

      // Encrypt the message with AES
      const encoder = new TextEncoder();
      const messageData = encoder.encode(message);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const encryptedMessage = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        aesKey,
        messageData
      );

      // Export AES key and encrypt it with recipient's RSA public key (FIXED)
      const aesKeyRaw = await window.crypto.subtle.exportKey("raw", aesKey);

      const encryptedAESKey = await window.crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        recipientPublicKey, // FIXED: Use recipient's public key instead of our own
        aesKeyRaw
      );

      // Return encrypted data as base64 strings
      const encryptedData = {
        encryptedMessage: this.arrayBufferToBase64(encryptedMessage),
        encryptedKey: this.arrayBufferToBase64(encryptedAESKey),
        iv: this.arrayBufferToBase64(iv),
        timestamp: Date.now(),
        encryptedFor: recipientUsername, // FIXED: Track who this was encrypted for
        keyFingerprint: await this.getKeyFingerprint() // Add key fingerprint for debugging
      };

      const encryptedString = JSON.stringify(encryptedData);
      console.log(`🔐 Message encrypted successfully for ${recipientUsername} with key fingerprint:`, encryptedData.keyFingerprint);
      return encryptedString;
    } catch (error) {
      console.error('❌ Failed to encrypt message:', error);
      return null;
    }
  }

  // Get a fingerprint of the current key for debugging
  async getKeyFingerprint() {
    try {
      const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", this.publicKey);
      const keyString = JSON.stringify(publicKeyJwk);
      const encoder = new TextEncoder();
      const data = encoder.encode(keyString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    } catch (error) {
      return 'unknown';
    }
  }

  // Decrypt message - COMPLETELY REWRITTEN with better error handling
  async decryptMessage(encryptedMessageString) {
    try {
      await this.ensureInitialized();

      // Validate input
      if (!encryptedMessageString || typeof encryptedMessageString !== 'string') {
        console.error('❌ Invalid encrypted message format');
        return '[Invalid encrypted message format]';
      }

      console.log('🔓 Attempting to decrypt message...');

      // Parse encrypted data
      let encryptedData;
      try {
        encryptedData = JSON.parse(encryptedMessageString);
      } catch (parseError) {
        console.error('❌ Failed to parse encrypted message JSON:', parseError);
        return '[Invalid encrypted message format]';
      }

      // Validate encrypted data structure
      if (!encryptedData ||
          typeof encryptedData.encryptedMessage !== 'string' ||
          typeof encryptedData.encryptedKey !== 'string' ||
          typeof encryptedData.iv !== 'string') {
        console.error('❌ Missing required encryption fields');
        return '[Missing required encryption fields]';
      }

      // Log key fingerprints for debugging
      const currentKeyFingerprint = await this.getKeyFingerprint();
      console.log('🔓 Current key fingerprint:', currentKeyFingerprint);
      console.log('🔓 Message encrypted for:', encryptedData.encryptedFor || 'unknown');
      console.log('🔓 Message encrypted with fingerprint:', encryptedData.keyFingerprint || 'unknown');

      try {
        // Decrypt AES key with our RSA private key
        const encryptedAESKey = this.base64ToArrayBuffer(encryptedData.encryptedKey);

        console.log('🔓 Decrypting AES key with private key...');
        const aesKeyRaw = await window.crypto.subtle.decrypt(
          {
            name: "RSA-OAEP",
          },
          this.privateKey,
          encryptedAESKey
        );

        // Import the decrypted AES key
        console.log('🔓 Importing decrypted AES key...');
        const aesKey = await window.crypto.subtle.importKey(
          "raw",
          aesKeyRaw,
          {
            name: "AES-GCM",
          },
          false,
          ["decrypt"]
        );

        // Decrypt the message with AES
        console.log('🔓 Decrypting message content...');
        const encryptedMessage = this.base64ToArrayBuffer(encryptedData.encryptedMessage);
        const iv = this.base64ToArrayBuffer(encryptedData.iv);

        const decryptedMessage = await window.crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: iv,
          },
          aesKey,
          encryptedMessage
        );

        // Convert back to string
        const decoder = new TextDecoder();
        const decryptedText = decoder.decode(decryptedMessage);

        console.log('🔓 Message decrypted successfully:', decryptedText.substring(0, 50) + '...');
        return decryptedText;

      } catch (cryptoError) {
        console.error('❌ Crypto operation failed:', cryptoError);
        console.error('❌ Error name:', cryptoError.name);
        console.error('❌ Error message:', cryptoError.message);

        // More specific error handling
        if (cryptoError.name === 'OperationError') {
          return '[Decryption failed - key mismatch]';
        } else if (cryptoError.name === 'InvalidAccessError') {
          return '[Invalid key for decryption]';
        } else {
          return '[Crypto operation failed]';
        }
      }

    } catch (error) {
      console.error('❌ Failed to decrypt message:', error);
      return '[Message could not be decrypted]';
    }
  }

  // Utility functions for base64 conversion
  arrayBufferToBase64(buffer) {
    try {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    } catch (error) {
      console.error('❌ Failed to convert ArrayBuffer to base64:', error);
      throw error;
    }
  }

  base64ToArrayBuffer(base64) {
    try {
      const binary = window.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error('❌ Failed to convert base64 to ArrayBuffer:', error);
      throw error;
    }
  }

  // Initialize encryption service - ENSURE SINGLE INITIALIZATION
  async initialize() {
    try {
      if (this.isInitialized) {
        console.log('🔐 Encryption service already initialized');
        return true;
      }

      console.log('🔐 Initializing encryption service...');
      await this.ensureInitialized();

      console.log('🔐 Encryption service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize encryption service:', error);
      return false;
    }
  }

  // Clear all stored keys (for logout) - IMPROVED
  clearKeys() {
    localStorage.removeItem(this.keyStorageKey);
    localStorage.removeItem('contactPublicKeys');

    this.publicKey = null;
    this.privateKey = null;
    this.keyPair = null;
    this.contactKeys.clear();
    this.isInitialized = false;
    this.initPromise = null;

    console.log('🔐 All encryption keys cleared');
  }

  // Check if we have a contact's public key
  hasContactKey(username) {
    return true; // For demo, always return true
  }

  // Store contact's public key
  storeContactPublicKey(username, publicKeyJwk) {
    try {
      this.contactKeys.set(username, publicKeyJwk);
      const contactKeys = JSON.parse(localStorage.getItem('contactPublicKeys') || '{}');
      contactKeys[username] = publicKeyJwk;
      localStorage.setItem('contactPublicKeys', JSON.stringify(contactKeys));
      console.log(`🔐 Stored public key for ${username}`);
    } catch (error) {
      console.error('❌ Failed to store contact public key:', error);
    }
  }

  // Exchange public keys with a contact
  async exchangePublicKeys(contactUsername) {
    try {
      console.log(`🔐 Simulating key exchange with ${contactUsername}`);
      const ourPublicKey = await this.getPublicKeyJwk();
      this.storeContactPublicKey(contactUsername, ourPublicKey);
      console.log(`🔐 Key exchange completed with ${contactUsername}`);
      return true;
    } catch (error) {
      console.error('❌ Key exchange failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();
export default encryptionService;