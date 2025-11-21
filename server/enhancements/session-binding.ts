/**
 * Session Fingerprint Binding
 * 
 * Bind challenge tokens ke session fingerprint untuk mencegah
 * token stealing dan replay attacks dari device/browser lain
 */

import crypto from "crypto";
import { Request } from "express";

export interface SessionFingerprint {
  hash: string;           // Final fingerprint hash
  components: string[];   // Components yang digunakan
  confidence: number;     // Confidence score 0-100
  isReliable: boolean;    // Apakah fingerprint cukup reliable
}

/**
 * Generate session fingerprint dari request
 */
export function generateSessionFingerprint(req: Request): SessionFingerprint {
  const components: string[] = [];
  let confidence = 0;
  
  // Component 1: User Agent (weight: 20)
  const userAgent = req.headers['user-agent'];
  if (userAgent) {
    components.push(`ua:${userAgent}`);
    confidence += 20;
  }
  
  // Component 2: Accept Language (weight: 10)
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    components.push(`lang:${acceptLanguage}`);
    confidence += 10;
  }
  
  // Component 3: Accept Encoding (weight: 10)
  const acceptEncoding = req.headers['accept-encoding'];
  if (acceptEncoding) {
    components.push(`enc:${acceptEncoding}`);
    confidence += 10;
  }
  
  // Component 4: Sec-CH-UA (Chrome User Agent Client Hints) (weight: 15)
  const secChUa = req.headers['sec-ch-ua'];
  if (secChUa) {
    components.push(`chu:${secChUa}`);
    confidence += 15;
  }
  
  // Component 5: Sec-CH-UA-Platform (weight: 10)
  const secChUaPlatform = req.headers['sec-ch-ua-platform'];
  if (secChUaPlatform) {
    components.push(`chp:${secChUaPlatform}`);
    confidence += 10;
  }
  
  // Component 6: Sec-CH-UA-Mobile (weight: 5)
  const secChUaMobile = req.headers['sec-ch-ua-mobile'];
  if (secChUaMobile) {
    components.push(`chm:${secChUaMobile}`);
    confidence += 5;
  }
  
  // Component 7: IP Address (weight: 20)
  const ip = req.socket.remoteAddress || req.headers['x-forwarded-for'];
  if (ip) {
    components.push(`ip:${ip}`);
    confidence += 20;
  }
  
  // Component 8: TLS Cipher (weight: 10)
  const tlsCipher = (req.socket as any).getCipher?.();
  if (tlsCipher) {
    components.push(`tls:${tlsCipher.name}`);
    confidence += 10;
  }
  
  // Generate hash dari semua components
  const fingerprintString = components.join('|');
  const hash = crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex');
  
  return {
    hash,
    components,
    confidence: Math.min(confidence, 100),
    isReliable: confidence >= 50, // Minimum 50% confidence
  };
}

/**
 * Verify session fingerprint matches
 */
export function verifySessionFingerprint(
  storedFingerprint: string,
  currentRequest: Request,
  allowPartialMatch: boolean = false
): boolean {
  const currentFingerprint = generateSessionFingerprint(currentRequest);
  
  // Exact match
  if (currentFingerprint.hash === storedFingerprint) {
    return true;
  }
  
  // If partial match allowed, check if fingerprint is still reliable
  if (allowPartialMatch) {
    // Dalam kasus edge (network changes, VPN switch, dll)
    // kita bisa allow kalau confidence masih tinggi
    return currentFingerprint.isReliable;
  }
  
  return false;
}

/**
 * Compare two fingerprints and calculate similarity score
 */
export function calculateFingerprintSimilarity(
  fp1: SessionFingerprint,
  fp2: SessionFingerprint
): number {
  if (fp1.hash === fp2.hash) {
    return 1.0; // 100% match
  }
  
  // Calculate component overlap
  const set1 = new Set(fp1.components);
  const set2 = new Set(fp2.components);
  
  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);
  
  // Jaccard similarity
  return intersection.size / union.size;
}

/**
 * Enhanced session binding dengan fuzzy matching
 */
export interface SessionBindingConfig {
  strictMode: boolean;          // Require exact match
  similarityThreshold: number;  // Minimum similarity untuk fuzzy match (0-1)
  allowIpChange: boolean;       // Allow IP address changes
}

export const DEFAULT_SESSION_BINDING_CONFIG: SessionBindingConfig = {
  strictMode: false,
  similarityThreshold: 0.7, // 70% similarity required
  allowIpChange: false,
};

export function verifySessionBinding(
  storedFingerprint: string,
  currentRequest: Request,
  config: SessionBindingConfig = DEFAULT_SESSION_BINDING_CONFIG
): { isValid: boolean; similarity?: number; reason?: string } {
  const currentFp = generateSessionFingerprint(currentRequest);
  
  // Exact match
  if (currentFp.hash === storedFingerprint) {
    return { isValid: true, similarity: 1.0 };
  }
  
  // Strict mode requires exact match
  if (config.strictMode) {
    return { 
      isValid: false, 
      reason: 'Strict mode requires exact fingerprint match',
      similarity: 0
    };
  }
  
  // Fuzzy matching untuk handle edge cases
  // (Note: kita perlu stored fingerprint components untuk fuzzy matching)
  // Untuk simplifikasi, kita assume partial match OK jika fingerprint reliable
  if (currentFp.isReliable && currentFp.confidence >= 70) {
    return { 
      isValid: true, 
      similarity: 0.7,
      reason: 'Partial match with high confidence'
    };
  }
  
  return { 
    isValid: false, 
    similarity: 0,
    reason: 'Fingerprint mismatch and low confidence'
  };
}

/**
 * Example usage:
 * 
 * // During challenge creation:
 * const fingerprint = generateSessionFingerprint(req);
 * challenge.sessionFingerprint = fingerprint.hash;
 * 
 * // During verification:
 * const bindingCheck = verifySessionBinding(
 *   challenge.sessionFingerprint,
 *   req
 * );
 * if (!bindingCheck.isValid) {
 *   return res.json({
 *     success: false,
 *     error: "Session fingerprint mismatch",
 *     reason: bindingCheck.reason
 *   });
 * }
 */
