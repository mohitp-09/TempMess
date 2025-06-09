// End-to-End Encryption utilities using Web Crypto API
class EncryptionService {
  constructor() {
    this.keyPair = null;
    this.publicKey = null;
    this.privateKey = null;
    this.contactKeys = new Map(); // Store contact public keys in memory
  }

  // Generate RSA key pair for the user
  async generateKeyPair() {
    try {
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

      // Store keys in localStorage
      await this.storeKeys();
      
      console.log('🔐 Key pair generated successfully');
      return this.keyPair;
    } catch (error) {
      console.error('❌ Failed to generate key pair:', error);
      throw error;
    }
  }

  // Store keys in localStorage
  async storeKeys() {
    try {
      const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", this.publicKey);
      const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", this.privateKey);

      localStorage.setItem('userPublicKey', JSON.stringify(publicKeyJwk));
      localStorage.setItem('userPrivateKey', JSON.stringify(privateKeyJwk));
      
      console.log('🔐 Keys stored successfully');
    } catch (error) {
      console.error('❌ Failed to store keys:', error);
      throw error;
    }
  }

  // Load keys from localStorage
  async loadKeys() {
    try {
      const publicKeyJwk = JSON.parse(localStorage.getItem('userPublicKey'));
      const privateKeyJwk = JSON.parse(localStorage.getItem('userPrivateKey'));

      if (!publicKeyJwk || !privateKeyJwk) {
        console.log('🔐 No stored keys found, generating new ones...');
        return await this.generateKeyPair();
      }

      this.publicKey = await window.crypto.subtle.importKey(
        "jwk",
        publicKeyJwk,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        true,
        ["encrypt"]
      );

      this.privateKey = await window.crypto.subtle.importKey(
        "jwk",
        privateKeyJwk,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        true,
        ["decrypt"]
      );

      console.log('🔐 Keys loaded successfully');
      return { publicKey: this.publicKey, privateKey: this.privateKey };
    } catch (error) {
      console.error('❌ Failed to load keys:', error);
      // If loading fails, generate new keys
      return await this.generateKeyPair();
    }
  }

  // Get public key as JWK for sharing
  async getPublicKeyJwk() {
    if (!this.publicKey) {
      await this.loadKeys();
    }
    return await window.crypto.subtle.exportKey("jwk", this.publicKey);
  }

  // Import another user's public key
  async importPublicKey(publicKeyJwk) {
    try {
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
    } catch (error) {
      console.error('❌ Failed to import public key:', error);
      throw error;
    }
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

  // Check if message is encrypted JSON - IMPROVED VALIDATION
  isEncryptedMessage(message) {
    if (!message || typeof message !== 'string') {
      console.log('🔍 Not encrypted: message is not a string or is empty');
      return false;
    }
    
    // Check if it looks like encrypted JSON
    if (!message.trim().startsWith('{')) {
      console.log('🔍 Not encrypted: message does not start with {');
      return false;
    }
    
    try {
      const parsed = JSON.parse(message);
      const isEncrypted = parsed && 
             typeof parsed === 'object' && 
             typeof parsed.encryptedMessage === 'string' && 
             typeof parsed.encryptedKey === 'string' && 
             typeof parsed.iv === 'string' &&
             parsed.encryptedMessage.length > 0 &&
             parsed.encryptedKey.length > 0 &&
             parsed.iv.length > 0;
      
      console.log('🔍 Encryption check result:', isEncrypted);
      if (isEncrypted) {
        console.log('🔍 Found encrypted message with keys:', Object.keys(parsed));
      }
      
      return isEncrypted;
    } catch (error) {
      console.log('🔍 Not encrypted: JSON parse failed:', error.message);
      return false;
    }
  }

  // Encrypt message using hybrid encryption (AES + RSA)
  async encryptMessage(message, recipientUsername) {
    try {
      if (!this.publicKey) {
        await this.loadKeys();
      }

      console.log(`🔐 Encrypting message for ${recipientUsername}...`);

      // Use our own public key for encryption (for demo purposes)
      const encryptionKey = this.publicKey;

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

      // Export AES key and encrypt it with RSA public key
      const aesKeyRaw = await window.crypto.subtle.exportKey("raw", aesKey);
      
      const encryptedAESKey = await window.crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        encryptionKey,
        aesKeyRaw
      );

      // Return encrypted data as base64 strings
      const encryptedData = {
        encryptedMessage: this.arrayBufferToBase64(encryptedMessage),
        encryptedKey: this.arrayBufferToBase64(encryptedAESKey),
        iv: this.arrayBufferToBase64(iv),
        timestamp: Date.now()
      };

      const encryptedString = JSON.stringify(encryptedData);
      console.log('🔐 Message encrypted successfully, length:', encryptedString.length);
      return encryptedString;
    } catch (error) {
      console.error('❌ Failed to encrypt message:', error);
      return null; // Return null to indicate encryption failed
    }
  }

  // Decrypt message - COMPLETELY REWRITTEN TO HANDLE YOUR DATABASE FORMAT
  async decryptMessage(encryptedMessageString) {
    try {
      if (!this.privateKey) {
        console.log('🔓 Loading private key for decryption...');
        await this.loadKeys();
      }

      // Validate input
      if (!encryptedMessageString || typeof encryptedMessageString !== 'string') {
        throw new Error('Invalid encrypted message format - not a string');
      }

      console.log('🔓 Attempting to decrypt message...');
      console.log('🔓 Message preview:', encryptedMessageString.substring(0, 200) + '...');

      // Parse encrypted data
      let encryptedData;
      try {
        encryptedData = JSON.parse(encryptedMessageString);
        console.log('🔓 Successfully parsed JSON, keys found:', Object.keys(encryptedData));
      } catch (parseError) {
        console.error('❌ Failed to parse encrypted message JSON:', parseError);
        return '[Invalid encrypted message format]';
      }

      // Validate encrypted data structure
      if (!encryptedData || 
          typeof encryptedData.encryptedMessage !== 'string' ||
          typeof encryptedData.encryptedKey !== 'string' ||
          typeof encryptedData.iv !== 'string') {
        console.error('❌ Missing required encryption fields:', {
          hasEncryptedMessage: typeof encryptedData.encryptedMessage,
          hasEncryptedKey: typeof encryptedData.encryptedKey,
          hasIv: typeof encryptedData.iv
        });
        return '[Missing required encryption fields]';
      }

      console.log('🔓 All required fields present, proceeding with decryption...');

      try {
        // Decrypt AES key with our RSA private key
        console.log('🔓 Decrypting AES key...');
        const encryptedAESKey = this.base64ToArrayBuffer(encryptedData.encryptedKey);
        
        const aesKeyRaw = await window.crypto.subtle.decrypt(
          {
            name: "RSA-OAEP",
          },
          this.privateKey,
          encryptedAESKey
        );
        console.log('🔓 AES key decrypted successfully');

        // Import the decrypted AES key
        console.log('🔓 Importing AES key...');
        const aesKey = await window.crypto.subtle.importKey(
          "raw",
          aesKeyRaw,
          {
            name: "AES-GCM",
          },
          false,
          ["decrypt"]
        );
        console.log('🔓 AES key imported successfully');

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
        console.log('🔓 Message content decrypted successfully');

        // Convert back to string
        const decoder = new TextDecoder();
        const decryptedText = decoder.decode(decryptedMessage);
        
        console.log('🔓 Final decrypted text:', decryptedText);
        return decryptedText;

      } catch (cryptoError) {
        console.error('❌ Crypto operation failed:', cryptoError);
        
        // Check if this might be a key mismatch issue
        if (cryptoError.name === 'OperationError' || cryptoError.message.includes('decrypt')) {
          console.warn('⚠️ Decryption failed - this message was likely encrypted with a different key');
          return '[Message encrypted with different key - cannot decrypt]';
        }
        
        throw cryptoError;
      }

    } catch (error) {
      console.error('❌ Failed to decrypt message:', error.message);
      console.error('❌ Full error:', error);
      
      // Return a more specific error message based on the error type
      if (error.message.includes('JSON')) {
        return '[Invalid encrypted message format]';
      } else if (error.message.includes('base64')) {
        return '[Invalid message encoding]';
      } else if (error.name === 'OperationError') {
        return '[Decryption failed - wrong key?]';
      } else {
        return '[Message could not be decrypted]';
      }
    }
  }

  // Utility functions for base64 conversion - IMPROVED ERROR HANDLING
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

  // Initialize encryption service
  async initialize() {
    try {
      await this.loadKeys();
      
      // Load contact public keys from localStorage
      this.loadContactKeys();
      
      console.log('🔐 Encryption service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize encryption service:', error);
      return false;
    }
  }

  // Clear all stored keys (for logout)
  clearKeys() {
    localStorage.removeItem('userPublicKey');
    localStorage.removeItem('userPrivateKey');
    localStorage.removeItem('contactPublicKeys');
    this.publicKey = null;
    this.privateKey = null;
    this.keyPair = null;
    this.contactKeys.clear();
    console.log('🔐 All encryption keys cleared');
  }

  // Store contact's public key
  storeContactPublicKey(username, publicKeyJwk) {
    try {
      // Store in memory
      this.contactKeys.set(username, publicKeyJwk);
      
      // Store in localStorage for persistence
      const contactKeys = JSON.parse(localStorage.getItem('contactPublicKeys') || '{}');
      contactKeys[username] = publicKeyJwk;
      localStorage.setItem('contactPublicKeys', JSON.stringify(contactKeys));
      
      console.log(`🔐 Stored public key for ${username}`);
    } catch (error) {
      console.error('❌ Failed to store contact public key:', error);
    }
  }

  // Get contact's public key
  async getContactPublicKey(username) {
    try {
      // For this demo, we'll always return our own public key
      return await this.getPublicKeyJwk();
    } catch (error) {
      console.error('❌ Failed to get contact public key:', error);
      return null;
    }
  }

  // Load all contact keys from localStorage
  loadContactKeys() {
    try {
      const contactKeys = JSON.parse(localStorage.getItem('contactPublicKeys') || '{}');
      Object.entries(contactKeys).forEach(([username, publicKey]) => {
        this.contactKeys.set(username, publicKey);
      });
      console.log(`🔐 Loaded ${this.contactKeys.size} contact public keys`);
    } catch (error) {
      console.error('❌ Failed to load contact keys:', error);
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

  // Get list of contacts with exchanged keys
  getContactsWithKeys() {
    return Array.from(this.contactKeys.keys());
  }

  // Check if we have a contact's public key
  hasContactKey(username) {
    return true; // For demo, always return true
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();
export default encryptionService;