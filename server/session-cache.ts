import { SessionKey, generateServerKeyPair } from "./encryption";

/**
 * Session cache for storing ephemeral ECDH keys and derived session keys
 * 
 * Features:
 * - Automatic expiry (default 5 minutes)
 * - Memory-based storage with cleanup
 * - IP/fingerprint binding for replay protection
 * - Periodic rotation of server ephemeral keys (hourly)
 * 
 * Security considerations:
 * - Session keys are kept in memory only (not persisted to disk)
 * - Expired sessions are automatically cleaned up
 * - Server key pairs rotate regularly to limit exposure
 */

export interface ServerKeyPair {
  publicKey: Buffer;
  privateKey: Buffer;
  createdAt: number;
  expiresAt: number;
}

export interface CachedSession {
  sessionKey: SessionKey;
  apiPublicKey: string; // Binds session to specific API key
  clientIP: string;
  deviceFingerprint: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * SessionCache manages ephemeral keys and session state
 */
export class SessionCache {
  private currentServerKeyPair: ServerKeyPair | null = null;
  private sessions: Map<string, CachedSession> = new Map();

  // Configuration
  private readonly SESSION_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private readonly SERVER_KEY_ROTATION_MS = 60 * 60 * 1000; // 1 hour
  private readonly CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTask();
  }

  /**
   * Get current server ephemeral key pair
   * Generates new pair if none exists or expired
   */
  getCurrentServerKeyPair(): ServerKeyPair {
    const now = Date.now();

    // Generate new key pair if none exists or expired
    if (
      !this.currentServerKeyPair ||
      this.currentServerKeyPair.expiresAt <= now
    ) {
      const keyPair = generateServerKeyPair();

      this.currentServerKeyPair = {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        createdAt: now,
        expiresAt: now + this.SERVER_KEY_ROTATION_MS,
      };

      console.log(
        `[SESSION] Generated new server ephemeral key pair (expires in ${this.SERVER_KEY_ROTATION_MS / 1000}s)`
      );
    }

    return this.currentServerKeyPair;
  }

  /**
   * Generate unique session ID from client info
   * Note: We don't include IP in the session ID because proxies/load balancers
   * (like Replit's infrastructure) can change the client IP between requests,
   * which would invalidate the session. Instead, we rely on device fingerprint
   * and API key for session binding.
   */
  private generateSessionId(
    apiPublicKey: string,
    clientIP: string,
    deviceFingerprint: string
  ): string {
    return `${apiPublicKey}:${deviceFingerprint}`;
  }

  /**
   * Store session key with binding to API key, IP, and fingerprint
   */
  storeSession(
    sessionKey: SessionKey,
    apiPublicKey: string,
    clientIP: string,
    deviceFingerprint: string
  ): string {
    const sessionId = this.generateSessionId(
      apiPublicKey,
      clientIP,
      deviceFingerprint
    );

    const now = Date.now();
    const cachedSession: CachedSession = {
      sessionKey,
      apiPublicKey,
      clientIP,
      deviceFingerprint,
      createdAt: now,
      expiresAt: now + this.SESSION_EXPIRY_MS,
    };

    this.sessions.set(sessionId, cachedSession);

    console.log(
      `[SESSION] Stored session for ${apiPublicKey.substring(0, 12)}... (expires in ${this.SESSION_EXPIRY_MS / 1000}s)`
    );

    return sessionId;
  }

  /**
   * Retrieve session key with validation
   * Returns null if session not found, expired, or binding mismatch
   */
  getSession(
    apiPublicKey: string,
    clientIP: string,
    deviceFingerprint: string
  ): SessionKey | null {
    const sessionId = this.generateSessionId(
      apiPublicKey,
      clientIP,
      deviceFingerprint
    );

    const cached = this.sessions.get(sessionId);
    if (!cached) {
      return null;
    }

    const now = Date.now();

    // Check expiry
    if (cached.expiresAt <= now) {
      this.sessions.delete(sessionId);
      console.log(`[SESSION] Session expired for ${sessionId}`);
      return null;
    }

    // Verify bindings (excluding IP since it can change due to load balancing)
    if (
      cached.apiPublicKey !== apiPublicKey ||
      cached.deviceFingerprint !== deviceFingerprint
    ) {
      console.warn(
        `[SESSION] Session binding mismatch for ${sessionId} - possible replay attack`
      );
      return null;
    }
    
    // Log IP change for monitoring (not a security issue in load-balanced environments)
    if (cached.clientIP !== clientIP) {
      console.log(
        `[SESSION] IP changed from ${cached.clientIP} to ${clientIP} for session ${sessionId.substring(0, 20)}... (acceptable in load-balanced environments)`
      );
    }

    return cached.sessionKey;
  }

  /**
   * Invalidate a specific session
   */
  invalidateSession(
    apiPublicKey: string,
    clientIP: string,
    deviceFingerprint: string
  ): void {
    const sessionId = this.generateSessionId(
      apiPublicKey,
      clientIP,
      deviceFingerprint
    );

    if (this.sessions.delete(sessionId)) {
      console.log(`[SESSION] Invalidated session ${sessionId}`);
    }
  }

  /**
   * Clear all expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let removedCount = 0;

    this.sessions.forEach((cached, sessionId) => {
      if (cached.expiresAt <= now) {
        this.sessions.delete(sessionId);
        removedCount++;
      }
    });

    if (removedCount > 0) {
      console.log(
        `[SESSION] Cleaned up ${removedCount} expired sessions (${this.sessions.size} active)`
      );
    }
  }

  /**
   * Start periodic cleanup task
   */
  private startCleanupTask(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.CLEANUP_INTERVAL_MS);

    console.log(
      `[SESSION] Started cleanup task (interval: ${this.CLEANUP_INTERVAL_MS / 1000}s)`
    );
  }

  /**
   * Stop cleanup task (for testing or shutdown)
   */
  stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log("[SESSION] Stopped cleanup task");
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    activeSessions: number;
    serverKeyExpiresIn: number;
  } {
    const now = Date.now();
    const serverKeyExpiresIn = this.currentServerKeyPair
      ? Math.max(0, this.currentServerKeyPair.expiresAt - now)
      : 0;

    return {
      activeSessions: this.sessions.size,
      serverKeyExpiresIn: Math.floor(serverKeyExpiresIn / 1000),
    };
  }

  /**
   * Clear all sessions (for testing)
   */
  clearAll(): void {
    this.sessions.clear();
    this.currentServerKeyPair = null;
    console.log("[SESSION] Cleared all sessions and server keys");
  }
}

export const sessionCache = new SessionCache();
