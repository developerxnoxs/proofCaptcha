import type { Request } from "express";
import type { SecuritySettings } from "@shared/schema";

interface FailedAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

interface RefreshAttempt {
  count: number;
  firstRefresh: number;
  lastRefresh: number;
}

interface BlockedIP {
  blockedAt: number;
  expiresAt: number;
  reason: string;
  failedAttempts: number;
}

class IPBlocker {
  private failedAttempts: Map<string, FailedAttempt> = new Map();
  private refreshAttempts: Map<string, RefreshAttempt> = new Map();
  private blockedIPs: Map<string, BlockedIP> = new Map();
  
  private readonly MAX_ATTEMPTS = 3;
  private readonly BLOCK_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  private readonly ATTEMPT_WINDOW = 10 * 60 * 1000; // 10 minutes window for attempts
  
  private readonly MAX_REFRESH_CLICKS = 3;
  private readonly REFRESH_BLOCK_DURATION = 1 * 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly REFRESH_WINDOW = 5 * 60 * 1000; // 5 minutes window for refresh clicks
  
  constructor() {
    // Clean up expired blocks every 5 minutes
    setInterval(() => this.cleanupExpiredBlocks(), 5 * 60 * 1000);
  }
  
  getClientIP(req: Request): string {
    // SECURITY FIX: Walk through proxy chain to find first public IP
    // This ensures we get the real client IP even in multi-proxy environments like Replit
    let lastSeenPrivateIP: string | null = null;
    
    // Priority 1: Replit-specific header for true client IP
    const replitClientIP = req.headers['x-replit-user-ip'] as string;
    if (replitClientIP && replitClientIP !== 'unknown' && replitClientIP.trim() !== '') {
      const cleanIP = replitClientIP.trim();
      if (!this.isPrivateIP(cleanIP)) {
        console.log(`[IP-BLOCKER] Using x-replit-user-ip (public client): ${cleanIP}`);
        return cleanIP;
      }
      lastSeenPrivateIP = cleanIP;
    }
    
    // Priority 2: Walk through X-Forwarded-For chain to find first public IP
    const xForwardedFor = req.headers['x-forwarded-for'] as string;
    if (xForwardedFor && xForwardedFor !== 'unknown' && xForwardedFor.trim() !== '') {
      const ips = xForwardedFor.split(',').map(ip => ip.trim());
      // Walk through chain to find first public IP (real client)
      for (const ip of ips) {
        if (ip && !this.isPrivateIP(ip)) {
          console.log(`[IP-BLOCKER] Using x-forwarded-for (public client from chain): ${ip}`);
          return ip;
        }
        // Track last private IP as fallback
        if (ip) lastSeenPrivateIP = ip;
      }
      // If all IPs in chain are private, log warning
      console.warn(`[IP-BLOCKER] All IPs in x-forwarded-for are private: ${xForwardedFor}`);
    }
    
    // Priority 3: Express's req.ip which respects trust proxy setting
    if (req.ip && req.ip !== 'unknown' && req.ip.trim() !== '') {
      const ip = req.ip.startsWith('::ffff:') ? req.ip.substring(7) : req.ip;
      if (!this.isPrivateIP(ip)) {
        console.log(`[IP-BLOCKER] Using req.ip (public): ${ip}`);
        return ip;
      }
      // If req.ip is private, save as fallback and continue to other headers
      console.log(`[IP-BLOCKER] Skipping req.ip (private): ${ip}, checking other headers...`);
      lastSeenPrivateIP = ip;
    }
    
    // Priority 4: Cloudflare CF-Connecting-IP
    const cfIP = req.headers['cf-connecting-ip'] as string;
    if (cfIP && cfIP !== 'unknown' && cfIP.trim() !== '') {
      const cleanIP = cfIP.trim();
      if (!this.isPrivateIP(cleanIP)) {
        console.log(`[IP-BLOCKER] Using cf-connecting-ip (public): ${cleanIP}`);
        return cleanIP;
      }
      lastSeenPrivateIP = cleanIP;
    }
    
    // Priority 5: Fallback to direct socket connection
    const socketIP = req.socket.remoteAddress;
    if (socketIP && socketIP !== 'unknown' && socketIP.trim() !== '') {
      const cleanIP = socketIP.startsWith('::ffff:') ? socketIP.substring(7) : socketIP;
      if (!this.isPrivateIP(cleanIP)) {
        console.log(`[IP-BLOCKER] Using socket.remoteAddress (public): ${cleanIP}`);
        return cleanIP;
      }
      lastSeenPrivateIP = cleanIP;
    }
    
    // Last resort: return private IP if that's all we have
    if (lastSeenPrivateIP) {
      console.warn(`[IP-BLOCKER] No public IP found in any header, using last seen private IP: ${lastSeenPrivateIP}`);
      return lastSeenPrivateIP;
    }
    
    console.warn('[IP-BLOCKER] ✗ Could not extract any IP from request');
    return 'unknown';
  }
  
  private isPrivateIP(ip: string): boolean {
    // Check for private IP ranges
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);
    
    // 10.0.0.0 - 10.255.255.255
    if (first === 10) return true;
    
    // 172.16.0.0 - 172.31.255.255
    if (first === 172 && second >= 16 && second <= 31) return true;
    
    // 192.168.0.0 - 192.168.255.255
    if (first === 192 && second === 168) return true;
    
    // 127.0.0.0 - 127.255.255.255 (localhost)
    if (first === 127) return true;
    
    return false;
  }
  
  isBlocked(ip: string): boolean {
    const blocked = this.blockedIPs.get(ip);
    
    if (!blocked) {
      return false;
    }
    
    // Check if block has expired
    if (Date.now() > blocked.expiresAt) {
      this.blockedIPs.delete(ip);
      this.failedAttempts.delete(ip);
      this.refreshAttempts.delete(ip);
      return false;
    }
    
    return true;
  }
  
  getBlockInfo(ip: string): BlockedIP | null {
    const blocked = this.blockedIPs.get(ip);
    
    if (!blocked) {
      return null;
    }
    
    // Check if block has expired
    if (Date.now() > blocked.expiresAt) {
      this.blockedIPs.delete(ip);
      return null;
    }
    
    return blocked;
  }
  
  recordFailedAttempt(ip: string): void {
    const now = Date.now();
    const attempts = this.failedAttempts.get(ip);
    
    if (!attempts) {
      // First failed attempt
      this.failedAttempts.set(ip, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return;
    }
    
    // Check if previous attempts are within the window
    if (now - attempts.firstAttempt > this.ATTEMPT_WINDOW) {
      // Reset counter if outside window
      this.failedAttempts.set(ip, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return;
    }
    
    // Increment counter
    attempts.count++;
    attempts.lastAttempt = now;
    
    // Block IP if reached max attempts
    if (attempts.count >= this.MAX_ATTEMPTS) {
      this.blockIP(ip, attempts.count);
    }
  }
  
  private blockIP(ip: string, failedAttempts: number): void {
    const now = Date.now();
    
    this.blockedIPs.set(ip, {
      blockedAt: now,
      expiresAt: now + this.BLOCK_DURATION,
      reason: `Too many failed verification attempts (${failedAttempts})`,
      failedAttempts,
    });
    
    console.log(`IP ${ip} blocked for 2 hours due to ${failedAttempts} failed attempts`);
  }
  
  getFailureCount(ip: string): number {
    const attempts = this.failedAttempts.get(ip);
    if (!attempts) {
      return 0;
    }
    
    const now = Date.now();
    if (now - attempts.firstAttempt > this.ATTEMPT_WINDOW) {
      return 0;
    }
    
    return attempts.count;
  }
  
  resetAttempts(ip: string): void {
    this.failedAttempts.delete(ip);
    this.refreshAttempts.delete(ip);
  }
  
  recordRefreshClick(ip: string): void {
    const now = Date.now();
    const attempts = this.refreshAttempts.get(ip);
    
    if (!attempts) {
      this.refreshAttempts.set(ip, {
        count: 1,
        firstRefresh: now,
        lastRefresh: now,
      });
      return;
    }
    
    if (now - attempts.firstRefresh > this.REFRESH_WINDOW) {
      this.refreshAttempts.set(ip, {
        count: 1,
        firstRefresh: now,
        lastRefresh: now,
      });
      return;
    }
    
    attempts.count++;
    attempts.lastRefresh = now;
    
    if (attempts.count >= this.MAX_REFRESH_CLICKS) {
      this.blockIPForRefreshAbuse(ip, attempts.count);
    }
  }
  
  private blockIPForRefreshAbuse(ip: string, refreshCount: number): void {
    const now = Date.now();
    
    this.blockedIPs.set(ip, {
      blockedAt: now,
      expiresAt: now + this.REFRESH_BLOCK_DURATION,
      reason: `Too many refresh attempts (${refreshCount})`,
      failedAttempts: 0,
    });
    
    console.log(`IP ${ip} blocked for 1 hour due to ${refreshCount} refresh clicks`);
  }
  
  getRefreshCount(ip: string): number {
    const attempts = this.refreshAttempts.get(ip);
    if (!attempts) {
      return 0;
    }
    
    const now = Date.now();
    if (now - attempts.firstRefresh > this.REFRESH_WINDOW) {
      return 0;
    }
    
    return attempts.count;
  }
  
  manualBlock(ip: string, reason: string, duration?: number): void {
    const now = Date.now();
    const blockDuration = duration || this.BLOCK_DURATION;
    
    this.blockedIPs.set(ip, {
      blockedAt: now,
      expiresAt: now + blockDuration,
      reason,
      failedAttempts: 0,
    });
    
    console.log(`IP ${ip} manually blocked: ${reason}`);
  }
  
  unblock(ip: string): boolean {
    const blocked = this.blockedIPs.delete(ip);
    this.failedAttempts.delete(ip);
    this.refreshAttempts.delete(ip);
    
    if (blocked) {
      console.log(`IP ${ip} unblocked`);
    }
    
    return blocked;
  }
  
  private cleanupExpiredBlocks(): void {
    const now = Date.now();
    let cleaned = 0;
    
    const entries = Array.from(this.blockedIPs.entries());
    for (const [ip, blocked] of entries) {
      if (now > blocked.expiresAt) {
        this.blockedIPs.delete(ip);
        this.failedAttempts.delete(ip);
        this.refreshAttempts.delete(ip);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired IP blocks`);
    }
  }
  
  getStats() {
    return {
      totalBlocked: this.blockedIPs.size,
      totalTracked: this.failedAttempts.size,
      blockedIPs: Array.from(this.blockedIPs.entries()).map(([ip, info]) => ({
        ip,
        ...info,
        remainingTime: Math.max(0, info.expiresAt - Date.now()),
      })),
    };
  }
  
  /**
   * Validate IP address format (supports exact IP, wildcard, CIDR)
   */
  validateIPFormat(ip: string): { valid: boolean; error?: string } {
    const trimmed = ip.trim();
    
    // Check for wildcard pattern (e.g., "192.168.*" or "10.0.*" or "10.*")
    if (trimmed.includes('*')) {
      const parts = trimmed.split('.');
      if (parts.length < 2 || parts.length > 4) {
        return { valid: false, error: `Invalid wildcard IP format (must be like 192.168.*, 10.0.*, or 10.*): ${ip}` };
      }
      
      // Wildcards must appear after at least one valid octet and then replace all remaining octets
      let foundWildcard = false;
      for (const part of parts) {
        if (part === '*') {
          foundWildcard = true;
        } else if (foundWildcard) {
          // After wildcard, only wildcards are allowed (e.g., "192.*.0.1" is NOT valid)
          return { valid: false, error: `Wildcard must replace all remaining octets (e.g., 192.168.* not 192.*.0.1): ${ip}` };
        } else {
          const num = parseInt(part);
          if (isNaN(num) || num < 0 || num > 255) {
            return { valid: false, error: `Invalid octet in wildcard IP: ${ip}` };
          }
        }
      }
      
      if (!foundWildcard) {
        return { valid: false, error: `Wildcard pattern must contain at least one *: ${ip}` };
      }
      
      return { valid: true };
    }
    
    // Check for CIDR notation (e.g., "192.168.1.0/24")
    if (trimmed.includes('/')) {
      const [network, maskStr] = trimmed.split('/');
      const mask = parseInt(maskStr);
      
      // Validate mask bits
      if (isNaN(mask) || mask < 0 || mask > 32) {
        return { valid: false, error: `Invalid CIDR mask bits (must be 0-32): ${ip}` };
      }
      
      // Validate network address
      const parts = network.split('.');
      if (parts.length !== 4) {
        return { valid: false, error: `Invalid network address in CIDR: ${ip}` };
      }
      for (const part of parts) {
        const num = parseInt(part);
        if (isNaN(num) || num < 0 || num > 255) {
          return { valid: false, error: `Invalid octet in CIDR network: ${ip}` };
        }
      }
      return { valid: true };
    }
    
    // Check for exact IP address (e.g., "192.168.1.1")
    const parts = trimmed.split('.');
    if (parts.length !== 4) {
      return { valid: false, error: `Invalid IP address format (must be x.x.x.x): ${ip}` };
    }
    for (const part of parts) {
      const num = parseInt(part);
      if (isNaN(num) || num < 0 || num > 255) {
        return { valid: false, error: `Invalid octet in IP address: ${ip}` };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * Validate country code format (ISO 3166-1 alpha-2)
   */
  validateCountryCode(code: string): { valid: boolean; error?: string } {
    const trimmed = code.trim().toUpperCase();
    
    // ISO 3166-1 alpha-2 codes are exactly 2 uppercase letters
    if (!/^[A-Z]{2}$/.test(trimmed)) {
      return { 
        valid: false, 
        error: `Invalid country code format (must be 2-letter ISO code): ${code}` 
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate arrays of blocked IPs and countries
   */
  validateBlockedLists(
    blockedIps: string[] | undefined, 
    blockedCountries: string[] | undefined
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate blocked IPs
    if (blockedIps && Array.isArray(blockedIps)) {
      for (const ip of blockedIps) {
        const result = this.validateIPFormat(ip);
        if (!result.valid && result.error) {
          errors.push(result.error);
        }
      }
    }
    
    // Validate blocked countries
    if (blockedCountries && Array.isArray(blockedCountries)) {
      for (const country of blockedCountries) {
        const result = this.validateCountryCode(country);
        if (!result.valid && result.error) {
          errors.push(result.error);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Check if IP is in blocked list (supports CIDR notation)
   */
  isIPBlocked(clientIP: string, blockedIps: string[]): boolean {
    if (!blockedIps || blockedIps.length === 0) return false;
    
    // Simple IP matching (exact match or wildcard)
    for (const blockedIP of blockedIps) {
      // Exact match
      if (blockedIP === clientIP) {
        console.log(`[IP-BLOCKER] IP ${clientIP} is blocked (exact match: ${blockedIP})`);
        return true;
      }
      
      // Wildcard match (e.g., "192.168.*" or "10.0.*" or "10.*")
      // Supports wildcards at any position after valid octets
      if (blockedIP.includes('*')) {
        const blockedParts = blockedIP.split('.');
        const clientParts = clientIP.split('.');
        
        // Match each octet until we hit a wildcard
        let matches = true;
        for (let i = 0; i < blockedParts.length; i++) {
          if (blockedParts[i] === '*') {
            // Wildcard matches everything from this point on
            break;
          }
          
          // Check if client has enough octets
          if (i >= clientParts.length) {
            matches = false;
            break;
          }
          
          // Check if this octet matches
          if (blockedParts[i] !== clientParts[i]) {
            matches = false;
            break;
          }
        }
        
        if (matches) {
          console.log(`[IP-BLOCKER] IP ${clientIP} is blocked (wildcard match: ${blockedIP})`);
          return true;
        }
      }
      
      // CIDR notation support (basic implementation for /24, /16, /8)
      if (blockedIP.includes('/')) {
        const [network, maskBits] = blockedIP.split('/');
        const mask = parseInt(maskBits);
        
        // Simple CIDR check for common masks
        if (mask === 24) {
          // Match first 3 octets
          const networkPrefix = network.split('.').slice(0, 3).join('.');
          const clientPrefix = clientIP.split('.').slice(0, 3).join('.');
          if (networkPrefix === clientPrefix) {
            console.log(`[IP-BLOCKER] IP ${clientIP} is blocked (CIDR /24 match: ${blockedIP})`);
            return true;
          }
        } else if (mask === 16) {
          // Match first 2 octets
          const networkPrefix = network.split('.').slice(0, 2).join('.');
          const clientPrefix = clientIP.split('.').slice(0, 2).join('.');
          if (networkPrefix === clientPrefix) {
            console.log(`[IP-BLOCKER] IP ${clientIP} is blocked (CIDR /16 match: ${blockedIP})`);
            return true;
          }
        } else if (mask === 8) {
          // Match first octet
          const networkPrefix = network.split('.')[0];
          const clientPrefix = clientIP.split('.')[0];
          if (networkPrefix === clientPrefix) {
            console.log(`[IP-BLOCKER] IP ${clientIP} is blocked (CIDR /8 match: ${blockedIP})`);
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if country is in blocked list
   */
  isCountryBlocked(countryCode: string | null, blockedCountries: string[]): boolean {
    if (!blockedCountries || blockedCountries.length === 0 || !countryCode) return false;
    
    // Case-insensitive country code matching
    const upperCountryCode = countryCode.toUpperCase();
    const isBlocked = blockedCountries.some(blocked => blocked.toUpperCase() === upperCountryCode);
    
    if (isBlocked) {
      console.log(`[IP-BLOCKER] Country ${countryCode} is blocked`);
    }
    
    return isBlocked;
  }
  
  /**
   * Check if request should be blocked based on security settings
   */
  checkSecurityBlocking(clientIP: string, countryCode: string | null, settings: SecuritySettings | null): { blocked: boolean; reason?: string } {
    if (!settings) return { blocked: false };
    
    // Check IP blocking
    if (settings.blockedIps && settings.blockedIps.length > 0) {
      if (this.isIPBlocked(clientIP, settings.blockedIps)) {
        return {
          blocked: true,
          reason: `Your IP address (${clientIP}) is blocked by this application's security policy.`
        };
      }
    }
    
    // Check country blocking
    if (settings.blockedCountries && settings.blockedCountries.length > 0) {
      if (this.isCountryBlocked(countryCode, settings.blockedCountries)) {
        return {
          blocked: true,
          reason: `Access from your country (${countryCode || 'Unknown'}) is blocked by this application's security policy.`
        };
      }
    }
    
    return { blocked: false };
  }
}

// Singleton instance
export const ipBlocker = new IPBlocker();
