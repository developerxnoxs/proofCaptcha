/**
 * Enhanced Token Expiration Management
 * 
 * Menambahkan grace period dan strict expiration checking
 * untuk mencegah token abuse
 */

export interface ExpirationConfig {
  challengeLifetime: number;  // Lifetime challenge dalam ms
  tokenGracePeriod: number;   // Grace period untuk network latency
  strictMode: boolean;        // Strict mode tanpa grace period
}

export const DEFAULT_EXPIRATION_CONFIG: ExpirationConfig = {
  challengeLifetime: 5 * 60 * 1000,  // 5 menit
  tokenGracePeriod: 30 * 1000,       // 30 detik
  strictMode: false,
};

export interface ExpirationCheckResult {
  isValid: boolean;
  errorCode?: string;
  message?: string;
  ageMs?: number;
  expiresIn?: number;
}

/**
 * Check if challenge has expired dengan grace period
 */
export function checkChallengeExpiration(
  createdAt: Date,
  config: ExpirationConfig = DEFAULT_EXPIRATION_CONFIG
): ExpirationCheckResult {
  const now = Date.now();
  const createdAtMs = new Date(createdAt).getTime();
  const ageMs = now - createdAtMs;
  
  // Calculate expiration dengan atau tanpa grace period
  const maxAge = config.strictMode 
    ? config.challengeLifetime
    : config.challengeLifetime + config.tokenGracePeriod;
  
  if (ageMs > maxAge) {
    const expiredBy = ageMs - config.challengeLifetime;
    return {
      isValid: false,
      errorCode: 'timeout-or-duplicate',
      message: `Challenge expired ${Math.ceil(expiredBy / 1000)} seconds ago`,
      ageMs,
      expiresIn: 0,
    };
  }
  
  const expiresInMs = config.challengeLifetime - ageMs;
  return {
    isValid: true,
    ageMs,
    expiresIn: Math.max(0, expiresInMs),
  };
}

/**
 * Check if token akan expire dalam waktu dekat
 */
export function isNearExpiration(
  createdAt: Date,
  warningThresholdMs: number = 60 * 1000, // 1 menit warning
  config: ExpirationConfig = DEFAULT_EXPIRATION_CONFIG
): boolean {
  const now = Date.now();
  const createdAtMs = new Date(createdAt).getTime();
  const ageMs = now - createdAtMs;
  const expiresInMs = config.challengeLifetime - ageMs;
  
  return expiresInMs > 0 && expiresInMs <= warningThresholdMs;
}

/**
 * Get expiration metadata untuk logging/debugging
 */
export function getExpirationMetadata(createdAt: Date, config: ExpirationConfig = DEFAULT_EXPIRATION_CONFIG) {
  const now = Date.now();
  const createdAtMs = new Date(createdAt).getTime();
  const ageMs = now - createdAtMs;
  const expiresInMs = config.challengeLifetime - ageMs;
  
  return {
    createdAt: createdAt.toISOString(),
    ageSeconds: Math.floor(ageMs / 1000),
    expiresInSeconds: Math.floor(Math.max(0, expiresInMs) / 1000),
    isExpired: ageMs > config.challengeLifetime,
    isNearExpiration: expiresInMs > 0 && expiresInMs <= 60000,
    gracePeriodActive: ageMs > config.challengeLifetime && ageMs <= config.challengeLifetime + config.tokenGracePeriod,
  };
}

/**
 * Cleanup expired challenges dari database
 */
export async function cleanupExpiredChallenges(
  getChallenges: () => Promise<Array<{ id: string; createdAt: Date }>>,
  deleteChallenge: (id: string) => Promise<void>,
  config: ExpirationConfig = DEFAULT_EXPIRATION_CONFIG
): Promise<number> {
  const challenges = await getChallenges();
  let deletedCount = 0;
  
  const cleanupThreshold = config.challengeLifetime + config.tokenGracePeriod + (60 * 60 * 1000); // +1 jam buffer
  
  for (const challenge of challenges) {
    const check = checkChallengeExpiration(challenge.createdAt, {
      ...config,
      challengeLifetime: cleanupThreshold,
      strictMode: true,
    });
    
    if (!check.isValid) {
      await deleteChallenge(challenge.id);
      deletedCount++;
    }
  }
  
  return deletedCount;
}

/**
 * Example usage dalam siteverify endpoint:
 * 
 * const expirationCheck = checkChallengeExpiration(challenge.createdAt);
 * if (!expirationCheck.isValid) {
 *   return res.json({
 *     success: false,
 *     "error-codes": [expirationCheck.errorCode],
 *     message: expirationCheck.message
 *   });
 * }
 */
