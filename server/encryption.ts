import crypto from "crypto";

/**
 * Encryption module for end-to-end challenge/solution protection
 * 
 * Architecture:
 * 1. ECDH handshake establishes per-session master key
 * 2. HKDF derives per-challenge child keys from master
 * 3. AES-256-GCM encrypts/decrypts payloads with unique IVs
 * 
 * Security features:
 * - P-256 (secp256r1) ECDH for Web Crypto API compatibility
 * - HKDF with context binding prevents key reuse
 * - GCM provides authenticated encryption
 * - Unique 96-bit IVs per payload prevent nonce reuse
 * - Constant-time operations where applicable
 */

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  tag: string; // base64 (GCM auth tag)
}

export interface HandshakeResponse {
  serverPublicKey: string; // base64
  timestamp: number;
  expiresIn: number; // seconds
  nonce: string; // server nonce for replay protection
}

export interface SessionKey {
  masterKey: Buffer;
  serverPublicKey: Buffer;
  clientPublicKey: Buffer;
  timestamp: number;
  expiresAt: number;
  nonce: string;
}

/**
 * Generate server ephemeral ECDH key pair
 * Uses P-256 (secp256r1) for Web Crypto API compatibility
 * Note: P-256 is widely supported, NIST-standardized, and provides ~128-bit security
 */
export function generateServerKeyPair(): {
  publicKey: Buffer;
  privateKey: Buffer;
} {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1", // P-256 / secp256r1
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" },
  });

  // Convert SPKI public key to raw format (65 bytes for uncompressed P-256)
  // Client expects raw format from Web Crypto API
  const publicKeyObj = crypto.createPublicKey({
    key: publicKey,
    format: 'der',
    type: 'spki'
  });
  
  const publicKeyRaw = publicKeyObj.export({ format: 'der', type: 'spki' });
  // Extract raw coordinates from SPKI format
  // For P-256: SPKI header is variable, but raw key is always last 65 bytes
  const rawPublicKey = publicKeyRaw.slice(-65);

  return {
    publicKey: Buffer.from(rawPublicKey),
    privateKey: Buffer.from(privateKey),
  };
}

/**
 * Derive shared secret using ECDH
 * @param serverPrivateKey Server's ephemeral private key
 * @param clientPublicKey Client's ephemeral public key
 * @returns Shared secret (raw ECDH output)
 */
export function deriveSharedSecret(
  serverPrivateKey: Buffer,
  clientPublicKey: Buffer
): Buffer {
  const serverKey = crypto.createPrivateKey({
    key: serverPrivateKey,
    format: "der",
    type: "pkcs8",
  });

  // Client sends public key in 'raw' format (65 bytes for P-256)
  // Need to convert to proper format for Node.js crypto
  const clientKey = crypto.createPublicKey({
    key: {
      crv: 'P-256',
      x: clientPublicKey.slice(1, 33).toString('base64url'),
      y: clientPublicKey.slice(33, 65).toString('base64url'),
      kty: 'EC'
    },
    format: 'jwk'
  });

  const sharedSecret = crypto.diffieHellman({
    privateKey: serverKey,
    publicKey: clientKey,
  });

  return Buffer.from(sharedSecret);
}

/**
 * Derive master session key from ECDH shared secret using HKDF
 * Binds server public key + nonce to prevent small-subgroup attacks
 * 
 * @param sharedSecret Raw ECDH output
 * @param serverPublicKey Server's public key for binding
 * @param serverNonce Server nonce for freshness
 * @param info Context string for key separation
 * @returns 32-byte master key for AES-256
 */
export function deriveMasterKey(
  sharedSecret: Buffer,
  serverPublicKey: Buffer,
  serverNonce: string,
  info: string = "captcha-session-v1"
): Buffer {
  // Salt includes server public key + nonce for binding
  const salt = Buffer.concat([
    serverPublicKey,
    Buffer.from(serverNonce, "utf-8"),
  ]);

  const derivedKey = crypto.hkdfSync(
    "sha256",
    sharedSecret,
    salt,
    Buffer.from(info, "utf-8"),
    32 // 256 bits for AES-256
  );

  return Buffer.from(derivedKey);
}

/**
 * Derive per-challenge child key from master session key using HKDF
 * Prevents key reuse across different challenges
 * 
 * @param masterKey Master session key
 * @param challengeId Unique challenge identifier (will be hashed if too long)
 * @param direction "encrypt", "decrypt", or "metadata" for different key derivations
 * @returns 32-byte child key for this specific challenge+direction
 */
export function deriveChildKey(
  masterKey: Buffer,
  challengeId: string,
  direction: "encrypt" | "decrypt" | "metadata" | "config"
): Buffer {
  // Hash the challenge ID to ensure it's always short (64 hex chars)
  // This prevents HKDF info parameter from exceeding 1024 byte limit
  const challengeIdHash = crypto
    .createHash("sha256")
    .update(challengeId)
    .digest("hex");
  
  const info = `captcha-challenge-v1:${direction}:${challengeIdHash}`;

  const derivedKey = crypto.hkdfSync(
    "sha256",
    masterKey,
    Buffer.alloc(0), // No salt needed for child derivation
    Buffer.from(info, "utf-8"),
    32
  );

  return Buffer.from(derivedKey);
}

/**
 * Encrypt payload using AES-256-GCM
 * 
 * @param plaintext Data to encrypt
 * @param key 32-byte encryption key
 * @param additionalData Optional authenticated data (not encrypted but verified)
 * @returns Encrypted payload with IV and auth tag
 */
export function encryptPayload(
  plaintext: string | Buffer,
  key: Buffer,
  additionalData?: string
): EncryptedPayload {
  // Generate random 96-bit IV (12 bytes) - GCM recommended size
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  // Add authenticated data if provided
  if (additionalData) {
    cipher.setAAD(Buffer.from(additionalData, "utf-8"));
  }

  const plaintextBuffer =
    typeof plaintext === "string" ? Buffer.from(plaintext, "utf-8") : plaintext;

  const ciphertext = Buffer.concat([
    cipher.update(plaintextBuffer),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

/**
 * Decrypt payload using AES-256-GCM
 * 
 * @param encrypted Encrypted payload with IV and tag
 * @param key 32-byte decryption key
 * @param additionalData Optional authenticated data (must match encryption)
 * @returns Decrypted plaintext or null if authentication fails
 */
export function decryptPayload(
  encrypted: EncryptedPayload,
  key: Buffer,
  additionalData?: string
): Buffer | null {
  try {
    const iv = Buffer.from(encrypted.iv, "base64");
    const ciphertext = Buffer.from(encrypted.ciphertext, "base64");
    const tag = Buffer.from(encrypted.tag, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

    // Set auth tag for verification
    decipher.setAuthTag(tag);

    // Add authenticated data if provided
    if (additionalData) {
      decipher.setAAD(Buffer.from(additionalData, "utf-8"));
    }

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return plaintext;
  } catch (error) {
    // Authentication failed or invalid ciphertext
    console.error("[ENCRYPTION] Decryption failed:", error);
    return null;
  }
}

/**
 * Generate HMAC signature for handshake transcript
 * Prevents downgrade and replay attacks
 * 
 * @param serverPublicKey Server's ephemeral public key
 * @param clientPublicKey Client's ephemeral public key
 * @param apiPrivateKey API secret key for binding
 * @param timestamp Handshake timestamp
 * @returns HMAC signature
 */
export function signHandshakeTranscript(
  serverPublicKey: Buffer,
  clientPublicKey: Buffer,
  apiPrivateKey: string,
  timestamp: number
): string {
  const hmac = crypto.createHmac("sha256", apiPrivateKey);

  hmac.update(serverPublicKey);
  hmac.update(clientPublicKey);
  hmac.update(Buffer.from(timestamp.toString(), "utf-8"));

  return hmac.digest("hex");
}

/**
 * Verify handshake transcript signature
 * 
 * @param serverPublicKey Server's ephemeral public key
 * @param clientPublicKey Client's ephemeral public key
 * @param apiPrivateKey API secret key
 * @param timestamp Handshake timestamp
 * @param providedSignature Signature to verify
 * @returns True if signature is valid
 */
export function verifyHandshakeTranscript(
  serverPublicKey: Buffer,
  clientPublicKey: Buffer,
  apiPrivateKey: string,
  timestamp: number,
  providedSignature: string
): boolean {
  const expectedSignature = signHandshakeTranscript(
    serverPublicKey,
    clientPublicKey,
    apiPrivateKey,
    timestamp
  );

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(providedSignature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Encrypt challenge data for transmission to client
 * Uses per-challenge child key derived from session master key
 */
export function encryptChallengeData(
  challengeData: any,
  sessionKey: SessionKey,
  challengeId: string
): EncryptedPayload {
  const childKey = deriveChildKey(sessionKey.masterKey, challengeId, "encrypt");
  const plaintext = JSON.stringify(challengeData);

  return encryptPayload(plaintext, childKey, challengeId);
}

/**
 * Encrypt security config to prevent client-side manipulation
 * Uses per-challenge child key with 'config' direction for key separation
 */
export function encryptSecurityConfig(
  securityConfig: any,
  sessionKey: SessionKey,
  challengeId: string
): EncryptedPayload {
  const childKey = deriveChildKey(sessionKey.masterKey, challengeId, "config");
  const plaintext = JSON.stringify(securityConfig);

  return encryptPayload(plaintext, childKey, challengeId);
}

/**
 * Decrypt solution data from client
 * Uses per-challenge child key derived from session master key
 */
export function decryptSolutionData(
  encrypted: EncryptedPayload,
  sessionKey: SessionKey,
  challengeId: string
): any | null {
  const childKey = deriveChildKey(sessionKey.masterKey, challengeId, "decrypt");
  const plaintext = decryptPayload(encrypted, childKey, challengeId);

  if (!plaintext) {
    return null;
  }

  try {
    return JSON.parse(plaintext.toString("utf-8"));
  } catch {
    return null;
  }
}

/**
 * Decrypt verification metadata from client (clientDetections, fingerprint, behavioral data)
 * Uses per-challenge child key derived from session master key with 'metadata' direction
 */
export function decryptVerificationMetadata(
  encrypted: EncryptedPayload,
  sessionKey: SessionKey,
  challengeId: string
): any | null {
  const childKey = deriveChildKey(sessionKey.masterKey, challengeId, "metadata");
  const plaintext = decryptPayload(encrypted, childKey, challengeId);

  if (!plaintext) {
    return null;
  }

  try {
    return JSON.parse(plaintext.toString("utf-8"));
  } catch {
    return null;
  }
}
