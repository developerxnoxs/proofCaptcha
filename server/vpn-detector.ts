/**
 * VPN Detection System
 * Detects if the request is coming from a VPN using multiple methods
 * 
 * PRODUCTION SETUP:
 * For production use, set VPN_API_KEY environment variable with your IPQualityScore API key
 * Free tier available at: https://www.ipqualityscore.com/create-account
 * 
 * DEVELOPMENT MODE:
 * Without API key, uses proxycheck.io free tier (limited to 100 checks/day)
 * Sufficient for development and testing
 */

// IPQualityScore response interface
interface IPQSResponse {
  success: boolean;
  vpn?: boolean;
  proxy?: boolean;
  tor?: boolean;
  active_vpn?: boolean;
  active_tor?: boolean;
  fraud_score?: number;
}

// ProxyCheck.io response interface
interface ProxyCheckResponse {
  status: string;
  [ip: string]: any;
}

/**
 * Check if an IP is using VPN/Proxy using IP intelligence API
 * Supports both paid (IPQualityScore) and free (proxycheck.io) services
 * Falls back gracefully if API is unavailable
 */
export async function detectVPN(ipAddress: string): Promise<boolean> {
  // Skip VPN detection for localhost
  if (ipAddress === 'localhost' || ipAddress === '127.0.0.1' || ipAddress === '::1') {
    return false;
  }

  // Try production API first if API key is available
  const apiKey = process.env.VPN_API_KEY;
  
  if (apiKey) {
    try {
      return await checkIPQualityScore(ipAddress, apiKey);
    } catch (error) {
      console.warn('[VPN-DETECTOR] IPQualityScore API failed, falling back to free service:', error);
      // Continue to free service fallback
    }
  }

  // Fallback to free service for development
  try {
    return await checkProxyCheckIO(ipAddress);
  } catch (error) {
    console.warn('[VPN-DETECTOR] All API checks failed:', error);
    return false; // Gracefully fail - don't block users
  }
}

/**
 * Check VPN using IPQualityScore (paid service, production-grade)
 * Requires VPN_API_KEY environment variable
 */
async function checkIPQualityScore(ipAddress: string, apiKey: string): Promise<boolean> {
  const response = await fetch(
    `https://www.ipqualityscore.com/api/json/ip/${apiKey}/${ipAddress}?strictness=0&allow_public_access_points=true`,
    {
      method: 'GET',
      headers: {
        'User-Agent': 'ProofCaptcha/1.0'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    }
  );

  if (!response.ok) {
    throw new Error(`IPQualityScore API returned ${response.status}`);
  }

  const data = await response.json() as IPQSResponse;

  if (!data.success) {
    throw new Error('IPQualityScore API returned success: false');
  }

  // Check multiple VPN/Proxy indicators
  const isVPN = data.vpn === true || data.active_vpn === true;
  const isProxy = data.proxy === true;
  const isTor = data.tor === true || data.active_tor === true;
  
  // High fraud score can also indicate VPN usage
  const highFraudScore = (data.fraud_score || 0) >= 85;

  if (isVPN || isProxy || isTor || highFraudScore) {
    console.info(`[VPN-DETECTOR] VPN/Proxy detected via IPQualityScore for IP ${ipAddress} (vpn:${isVPN}, proxy:${isProxy}, tor:${isTor}, fraud:${data.fraud_score})`);
    return true;
  }

  return false;
}

/**
 * Check VPN using ProxyCheck.io (free service, limited to 100/day)
 * No API key required - suitable for development
 */
async function checkProxyCheckIO(ipAddress: string): Promise<boolean> {
  const response = await fetch(`https://proxycheck.io/v2/${ipAddress}?vpn=1&asn=1`, {
    method: 'GET',
    headers: {
      'User-Agent': 'ProofCaptcha/1.0'
    },
    signal: AbortSignal.timeout(5000) // 5 second timeout
  });

  if (!response.ok) {
    throw new Error(`ProxyCheck.io returned ${response.status}`);
  }

  const data = await response.json() as ProxyCheckResponse;

  if (data.status !== 'ok') {
    throw new Error('ProxyCheck.io returned error status');
  }

  const ipData = data[ipAddress];
  if (!ipData) {
    return false;
  }

  // Check multiple indicators
  const isProxy = ipData.proxy === 'yes';
  const isVPN = ipData.type === 'VPN';

  if (isProxy || isVPN) {
    console.info(`[VPN-DETECTOR] VPN/Proxy detected via ProxyCheck.io for IP ${ipAddress} (type: ${ipData.type || 'proxy'})`);
    return true;
  }

  return false;
}

/**
 * Check IP reputation using basic heuristics
 * This is a fallback method that works without external API calls
 */
export function checkIPReputation(ipAddress: string): {
  isSuspicious: boolean;
  reason?: string;
} {
  // Common VPN/Proxy IP ranges (simplified list)
  // In production, you'd use a comprehensive database
  const suspiciousPatterns = [
    /^45\./, // Common VPN provider range
    /^62\./, // European proxy range
    /^185\./, // Russian/Eastern European VPN
    /^194\./, // Proxy network range
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(ipAddress)) {
      return {
        isSuspicious: true,
        reason: 'IP from known VPN/proxy range'
      };
    }
  }

  return { isSuspicious: false };
}

/**
 * Combined VPN detection using multiple methods
 */
export async function checkVPNStatus(ipAddress: string): Promise<{
  isVPN: boolean;
  method: string;
  details?: string;
}> {
  // Method 1: Check API (IPQualityScore if key available, otherwise ProxyCheck.io)
  try {
    const apiResult = await detectVPN(ipAddress);
    if (apiResult) {
      const method = process.env.VPN_API_KEY ? 'ipqualityscore_api' : 'proxycheck_api';
      const service = process.env.VPN_API_KEY ? 'IPQualityScore' : 'ProxyCheck.io';
      return {
        isVPN: true,
        method,
        details: `VPN/Proxy detected via ${service} API`
      };
    }
  } catch (error) {
    console.warn('[VPN-DETECTOR] API check failed, falling back to heuristics');
  }

  // Method 2: Check IP reputation heuristics (fallback)
  const reputationCheck = checkIPReputation(ipAddress);
  if (reputationCheck.isSuspicious) {
    return {
      isVPN: true,
      method: 'reputation_heuristics',
      details: reputationCheck.reason
    };
  }

  return {
    isVPN: false,
    method: 'clean'
  };
}
