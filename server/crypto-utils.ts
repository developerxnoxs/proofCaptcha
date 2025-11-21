import crypto from "crypto";
import jwt from "jsonwebtoken";

/**
 * Generate HMAC signature untuk bind challenge token dengan API private key
 * Ini mencegah replay attack dan memastikan challenge hanya valid untuk domain yang tervalidasi
 */
export function generateChallengeSignature(
  token: string,
  validatedDomain: string,
  privateKey: string
): string {
  const hmac = crypto.createHmac("sha256", privateKey);
  const data = `${token}:${validatedDomain}`;
  hmac.update(data);
  return hmac.digest("hex");
}

/**
 * Verify HMAC signature untuk memastikan challenge belum dimodifikasi
 * dan masih valid untuk domain yang sama
 */
export function verifyChallengeSignature(
  token: string,
  validatedDomain: string,
  privateKey: string,
  providedSignature: string
): boolean {
  const expectedSignature = generateChallengeSignature(token, validatedDomain, privateKey);
  
  // Gunakan timing-safe comparison untuk mencegah timing attack
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(providedSignature)
  );
}

/**
 * Normalize domain untuk perbandingan yang konsisten
 * - Lowercase untuk menghindari bypass case-sensitivity
 * - Remove www. prefix jika ada
 * - Trim whitespace dan trailing dots
 */
export function normalizeDomain(domain: string): string {
  if (!domain) return '';
  
  let normalized = domain.toLowerCase().trim();
  
  // Remove trailing dots
  normalized = normalized.replace(/\.+$/, '');
  
  // Remove www. prefix (optional - bisa disesuaikan per kebutuhan)
  // Uncomment jika ingin www.example.com dianggap sama dengan example.com
  // normalized = normalized.replace(/^www\./, '');
  
  return normalized;
}

/**
 * Extract domain dari request headers dengan fallback chain
 * Ini digunakan untuk validasi domain
 */
export function extractDomainFromRequest(req: any): string | null {
  // Priority order: Origin > Referer > Host
  const origin = req.headers.origin;
  if (origin) {
    try {
      const url = new URL(origin);
      return normalizeDomain(url.hostname);
    } catch {
      // Invalid origin URL
    }
  }

  const referer = req.headers.referer || req.headers.referrer;
  if (referer) {
    try {
      const url = new URL(referer);
      return normalizeDomain(url.hostname);
    } catch {
      // Invalid referer URL
    }
  }

  // Fallback to host header (least reliable)
  const host = req.headers.host;
  if (host) {
    // Remove port if present
    return normalizeDomain(host.split(':')[0]);
  }

  return null;
}

/**
 * Get server origin URL dari request headers
 * Menggunakan x-forwarded-proto dan x-forwarded-host untuk proxy support
 * dengan fallback ke req.protocol dan req.get('host')
 * 
 * Ini digunakan untuk mengubah relative asset paths menjadi absolute URLs
 * agar assets bisa diakses dari external websites
 */
export function getServerOrigin(req: any): string {
  // Support proxy headers (for production behind reverse proxy)
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:5000';
  
  return `${proto}://${host}`;
}

/**
 * Generate siteKey (public) dan secretKey (private) pair untuk developer
 * siteKey: digunakan di frontend, bisa di-expose
 * secretKey: rahasia, digunakan untuk verify di backend
 */
export function generateKeyPair(): { siteKey: string; secretKey: string } {
  const siteKey = `pk_${crypto.randomBytes(32).toString('hex')}`;
  const secretKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
  return { siteKey, secretKey };
}

/**
 * Create encrypted verification token yang dikirim ke developer's backend
 * Token ini berisi challenge ID, timestamp, dan metadata lainnya
 * Encrypted menggunakan secretKey agar hanya owner yang bisa verify
 */
export function createVerificationToken(
  challengeId: string,
  secretKey: string,
  metadata: {
    domain: string;
    timestamp: number;
    nonce: string;
    fingerprint?: string;
  }
): string {
  const payload = {
    cid: challengeId,
    dom: metadata.domain,
    ts: metadata.timestamp,
    nonce: metadata.nonce,
    fp: metadata.fingerprint,
    exp: Math.floor(Date.now() / 1000) + (5 * 60),
  };

  return jwt.sign(payload, secretKey, { algorithm: 'HS256' });
}

/**
 * Verify dan decode verification token menggunakan secretKey
 * Return decoded payload jika valid, null jika invalid/expired
 */
export function verifyVerificationToken(
  token: string,
  secretKey: string
): {
  challengeId: string;
  domain: string;
  timestamp: number;
  nonce: string;
  fingerprint?: string;
} | null {
  try {
    const decoded = jwt.verify(token, secretKey, { algorithms: ['HS256'] }) as any;
    
    return {
      challengeId: decoded.cid,
      domain: decoded.dom,
      timestamp: decoded.ts,
      nonce: decoded.nonce,
      fingerprint: decoded.fp,
    };
  } catch (error) {
    return null;
  }
}

/**
 * NOTE: Challenge data encryption
 * 
 * STATUS: ✅ IMPLEMENTED (November 2025)
 * 
 * Application-level encryption now provides defense-in-depth against:
 * - Misconfigured TLS
 * - MITM proxies that decrypt HTTPS
 * - Intermediate logging/caching
 * - Pattern analysis for solver training
 * 
 * IMPLEMENTATION:
 * ✅ ECDH (X25519) handshake for session key exchange (see server/encryption.ts)
 * ✅ HKDF for master session key + per-challenge child key derivation
 * ✅ AES-256-GCM authenticated encryption for challenge/solution data
 * ✅ Session cache with ephemeral key rotation (hourly) and expiry (5 min)
 * ✅ Downgrade attack prevention: encryption required when session exists
 * ✅ Backward compatibility: plaintext fallback for clients without session
 * 
 * ENDPOINTS:
 * - POST /api/captcha/handshake - ECDH key exchange
 * - POST /api/captcha/challenge - Encrypted challenge delivery (when session exists)
 * - POST /api/captcha/verify - Encrypted solution decryption
 * 
 * For full implementation details, see:
 * - server/encryption.ts - Crypto primitives
 * - server/session-cache.ts - Session management
 * - server/routes.ts - Endpoint integration
 * - SECURITY.md - Threat model and mitigation strategies
 */
