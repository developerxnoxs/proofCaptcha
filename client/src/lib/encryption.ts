/**
 * Client-side encryption library for end-to-end challenge/solution protection
 * 
 * Architecture:
 * 1. ECDH handshake with server establishes session key
 * 2. HKDF derives per-challenge child keys from master
 * 3. AES-256-GCM encrypts/decrypts payloads
 * 
 * Features:
 * - Web Crypto API (ECDH P-256, HKDF, AES-GCM)
 * - Session caching with automatic expiry
 * - Automatic handshake retry on expiration
 * - Graceful fallback to plaintext if encryption unavailable
 */

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  tag: string; // base64
}

export interface HandshakeResponse {
  serverPublicKey: string; // base64
  timestamp: number;
  expiresIn: number; // seconds
  nonce: string;
  signature: string;
}

export interface SessionInfo {
  masterKey: CryptoKey;
  serverPublicKey: ArrayBuffer;
  clientPublicKey: ArrayBuffer;
  clientPrivateKey: CryptoKey;
  timestamp: number;
  expiresAt: number;
  nonce: string;
}

let currentSession: SessionInfo | null = null;

/**
 * Check if Web Crypto API is available
 */
export function isEncryptionAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues !== 'undefined';
}

/**
 * Generate client ECDH key pair using P-256 curve
 * Note: Web Crypto doesn't support X25519, so we use P-256 (secp256r1)
 */
async function generateClientKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256', // Web Crypto standard curve
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );

  return keyPair;
}

/**
 * Export public key to raw format for transmission
 */
async function exportPublicKey(publicKey: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('raw', publicKey);
}

/**
 * Import server's public key from raw format
 */
async function importServerPublicKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

/**
 * Derive shared secret using ECDH
 */
async function deriveSharedSecret(
  clientPrivateKey: CryptoKey,
  serverPublicKey: CryptoKey
): Promise<ArrayBuffer> {
  return await crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: serverPublicKey,
    },
    clientPrivateKey,
    256 // 256 bits
  );
}

/**
 * Derive master session key from ECDH shared secret using HKDF
 * Binds server public key + nonce to prevent small-subgroup attacks
 */
async function deriveMasterKey(
  sharedSecret: ArrayBuffer,
  serverPublicKey: ArrayBuffer,
  serverNonce: string,
  info: string = 'captcha-session-v1'
): Promise<CryptoKey> {
  // Create salt from server public key + nonce
  const encoder = new TextEncoder();
  const nonceBytes = encoder.encode(serverNonce);
  const salt = new Uint8Array(serverPublicKey.byteLength + nonceBytes.length);
  salt.set(new Uint8Array(serverPublicKey), 0);
  salt.set(nonceBytes, serverPublicKey.byteLength);

  // Import shared secret as HKDF key material
  const baseKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    'HKDF',
    false,
    ['deriveKey']
  );

  // Derive master key using HKDF
  const masterKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: encoder.encode(info),
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // MUST be extractable for child key derivation
    ['encrypt', 'decrypt']
  );

  return masterKey;
}

/**
 * Derive per-challenge child key from master session key using HKDF
 */
async function deriveChildKey(
  masterKey: CryptoKey,
  challengeId: string,
  direction: 'encrypt' | 'decrypt'
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  
  // Hash the challenge ID to ensure it's always short (64 hex chars)
  // This prevents HKDF info parameter from exceeding 1024 byte limit
  const challengeIdBuffer = encoder.encode(challengeId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', challengeIdBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const challengeIdHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const info = `captcha-challenge-v1:${direction}:${challengeIdHash}`;

  // Export master key to derive child
  const masterKeyBits = await crypto.subtle.exportKey('raw', masterKey);
  
  // Import as HKDF key
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    masterKeyBits,
    'HKDF',
    false,
    ['deriveKey']
  );

  // Derive child key
  const childKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0), // No salt for child derivation
      info: encoder.encode(info),
    },
    hkdfKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );

  return childKey;
}

/**
 * Encrypt payload using AES-256-GCM
 */
async function encryptPayload(
  plaintext: string | ArrayBuffer,
  key: CryptoKey,
  additionalData?: string
): Promise<EncryptedPayload> {
  // Generate random 96-bit IV (12 bytes) - GCM recommended size
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encoder = new TextEncoder();
  const plaintextBuffer = typeof plaintext === 'string' 
    ? encoder.encode(plaintext)
    : new Uint8Array(plaintext);

  const algorithm: AesGcmParams = {
    name: 'AES-GCM',
    iv: iv,
    tagLength: 128, // 16 bytes auth tag
  };

  // Add authenticated data if provided
  if (additionalData) {
    algorithm.additionalData = encoder.encode(additionalData);
  }

  const ciphertext = await crypto.subtle.encrypt(
    algorithm,
    key,
    plaintextBuffer
  );

  // In AES-GCM, the ciphertext includes the auth tag at the end
  const ciphertextArray = new Uint8Array(ciphertext);
  const ciphertextOnly = ciphertextArray.slice(0, -16); // Remove last 16 bytes (tag)
  const tag = ciphertextArray.slice(-16); // Last 16 bytes

  return {
    ciphertext: arrayBufferToBase64(ciphertextOnly),
    iv: arrayBufferToBase64(iv),
    tag: arrayBufferToBase64(tag),
  };
}

/**
 * Decrypt payload using AES-256-GCM
 */
async function decryptPayload(
  encrypted: EncryptedPayload,
  key: CryptoKey,
  additionalData?: string
): Promise<ArrayBuffer | null> {
  try {
    const iv = base64ToArrayBuffer(encrypted.iv);
    const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);
    const tag = base64ToArrayBuffer(encrypted.tag);

    // Combine ciphertext + tag for AES-GCM
    const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength);
    combined.set(new Uint8Array(ciphertext), 0);
    combined.set(new Uint8Array(tag), ciphertext.byteLength);

    const encoder = new TextEncoder();
    const algorithm: AesGcmParams = {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    };

    if (additionalData) {
      algorithm.additionalData = encoder.encode(additionalData);
    }

    const plaintext = await crypto.subtle.decrypt(
      algorithm,
      key,
      combined
    );

    return plaintext;
  } catch (error) {
    console.error('[ENCRYPTION] Decryption failed:', error);
    return null;
  }
}

/**
 * Perform ECDH handshake with server
 */
export async function performHandshake(publicKey: string, apiBaseUrl: string = ''): Promise<SessionInfo | null> {
  if (!isEncryptionAvailable()) {
    console.warn('[ENCRYPTION] Web Crypto API not available, encryption disabled');
    return null;
  }

  try {
    // Generate client key pair
    const clientKeyPair = await generateClientKeyPair();
    const clientPublicKeyRaw = await exportPublicKey(clientKeyPair.publicKey);

    // Send handshake request
    const response = await fetch(`${apiBaseUrl}/api/captcha/handshake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: publicKey,
        clientPublicKey: arrayBufferToBase64(clientPublicKeyRaw),
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[ENCRYPTION] Handshake failed:', error);
      return null;
    }

    const handshakeData: HandshakeResponse = await response.json();

    // Import server's public key
    const serverPublicKeyRaw = base64ToArrayBuffer(handshakeData.serverPublicKey);
    const serverPublicKey = await importServerPublicKey(serverPublicKeyRaw);

    // Derive shared secret via ECDH
    const sharedSecret = await deriveSharedSecret(clientKeyPair.privateKey, serverPublicKey);

    // Derive master session key via HKDF
    const masterKey = await deriveMasterKey(
      sharedSecret,
      serverPublicKeyRaw,
      handshakeData.nonce
    );

    // Create session info
    const session: SessionInfo = {
      masterKey,
      serverPublicKey: serverPublicKeyRaw,
      clientPublicKey: clientPublicKeyRaw,
      clientPrivateKey: clientKeyPair.privateKey,
      timestamp: handshakeData.timestamp,
      expiresAt: Date.now() + (handshakeData.expiresIn * 1000),
      nonce: handshakeData.nonce,
    };

    // Cache session
    currentSession = session;

    console.log('[ENCRYPTION] Handshake successful, session established');
    return session;
  } catch (error) {
    console.error('[ENCRYPTION] Handshake error:', error);
    return null;
  }
}

/**
 * Get current session or perform new handshake if expired
 */
export async function getOrCreateSession(publicKey: string, apiBaseUrl: string = ''): Promise<SessionInfo | null> {
  // Check if current session is still valid
  if (currentSession && Date.now() < currentSession.expiresAt) {
    return currentSession;
  }

  // Session expired or doesn't exist, perform new handshake
  console.log('[ENCRYPTION] Session expired or missing, performing handshake');
  return await performHandshake(publicKey, apiBaseUrl);
}

/**
 * Clear current session (useful for testing or explicit logout)
 */
export function clearSession(): void {
  currentSession = null;
  console.log('[ENCRYPTION] Session cleared');
}

/**
 * Encrypt challenge data for transmission to server
 */
export async function encryptChallengeData(
  challengeData: any,
  challengeId: string,
  publicKey: string,
  apiBaseUrl: string = ''
): Promise<EncryptedPayload | null> {
  const session = await getOrCreateSession(publicKey, apiBaseUrl);
  if (!session) {
    return null;
  }

  const childKey = await deriveChildKey(session.masterKey, challengeId, 'encrypt');
  const plaintext = JSON.stringify(challengeData);

  return await encryptPayload(plaintext, childKey, challengeId);
}

/**
 * Decrypt solution data from server
 */
export async function decryptSolutionData(
  encrypted: EncryptedPayload,
  challengeId: string,
  publicKey: string,
  apiBaseUrl: string = ''
): Promise<any | null> {
  const session = await getOrCreateSession(publicKey, apiBaseUrl);
  if (!session) {
    return null;
  }

  const childKey = await deriveChildKey(session.masterKey, challengeId, 'encrypt');
  const plaintext = await decryptPayload(encrypted, childKey, challengeId);

  if (!plaintext) {
    return null;
  }

  try {
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plaintext));
  } catch {
    return null;
  }
}

/**
 * Decrypt challenge data received from server
 */
export async function decryptChallengeData(
  encrypted: EncryptedPayload,
  challengeId: string,
  publicKey: string,
  apiBaseUrl: string = ''
): Promise<any | null> {
  const session = await getOrCreateSession(publicKey, apiBaseUrl);
  if (!session) {
    return null;
  }

  const childKey = await deriveChildKey(session.masterKey, challengeId, 'encrypt');
  const plaintext = await decryptPayload(encrypted, childKey, challengeId);

  if (!plaintext) {
    return null;
  }

  try {
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plaintext));
  } catch {
    return null;
  }
}

/**
 * Encrypt solution data for verification
 */
export async function encryptSolutionData(
  solutionData: any,
  challengeId: string,
  publicKey: string,
  apiBaseUrl: string = ''
): Promise<EncryptedPayload | null> {
  const session = await getOrCreateSession(publicKey, apiBaseUrl);
  if (!session) {
    return null;
  }

  const childKey = await deriveChildKey(session.masterKey, challengeId, 'decrypt');
  const plaintext = JSON.stringify(solutionData);

  return await encryptPayload(plaintext, childKey, challengeId);
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
