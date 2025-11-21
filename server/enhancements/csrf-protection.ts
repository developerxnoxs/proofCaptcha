import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface CSRFConfig {
  cookieName: string;
  headerName: string;
  tokenLength: number;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
  };
}

export const DEFAULT_CSRF_CONFIG: CSRFConfig = {
  cookieName: 'csrf_token',
  headerName: 'x-csrf-token',
  tokenLength: 32,
  cookieOptions: {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000,
  },
};

export function generateCSRFToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function createCSRFCookie(
  res: Response,
  config: CSRFConfig = DEFAULT_CSRF_CONFIG
): string {
  const token = generateCSRFToken(config.tokenLength);
  
  res.cookie(config.cookieName, token, config.cookieOptions);
  
  return token;
}

export function verifyCSRFToken(
  req: Request,
  config: CSRFConfig = DEFAULT_CSRF_CONFIG
): { valid: boolean; token?: string; error?: string } {
  const cookieToken = req.cookies?.[config.cookieName];
  
  // Normalize header lookup: Express lowercases all headers
  // Handle both string and string[] types from headers
  const rawHeaderToken = req.headers[config.headerName] || req.headers[config.headerName.toLowerCase()];
  const headerToken = Array.isArray(rawHeaderToken) ? rawHeaderToken[0] : rawHeaderToken;
  const bodyToken = req.body?.csrfToken;

  if (!cookieToken) {
    console.log('[CSRF] Token not found in cookie');
    return {
      valid: false,
      error: 'CSRF token not found in cookie',
    };
  }

  // Check header first (works for all content types including multipart/form-data)
  // Then fall back to body (for JSON/URL-encoded requests)
  const submittedToken = headerToken || bodyToken;

  if (!submittedToken) {
    console.log('[CSRF] Token not found in request (checked header and body)');
    return {
      valid: false,
      error: 'CSRF token not found in request',
    };
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const submittedBuffer = Buffer.from(submittedToken);
  
  if (cookieBuffer.length !== submittedBuffer.length) {
    console.log('[CSRF] Token length mismatch');
    return {
      valid: false,
      error: 'CSRF token mismatch',
    };
  }

  try {
    if (!crypto.timingSafeEqual(cookieBuffer, submittedBuffer)) {
      console.log('[CSRF] Token value mismatch');
      return {
        valid: false,
        error: 'CSRF token mismatch',
      };
    }
  } catch (err) {
    console.log('[CSRF] Token validation error:', err);
    return {
      valid: false,
      error: 'CSRF token validation error',
    };
  }

  console.log('[CSRF] Token validated successfully');
  return {
    valid: true,
    token: cookieToken,
  };
}

export function csrfMiddleware(config: CSRFConfig = DEFAULT_CSRF_CONFIG) {
  return (req: Request, res: Response, next: NextFunction) => {
    // For safe methods (GET, HEAD, OPTIONS), generate or reuse existing token
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      // Only create a new token if one doesn't exist
      const existingToken = req.cookies?.[config.cookieName];
      if (!existingToken) {
        const token = createCSRFCookie(res, config);
        (req as any).csrfToken = token;
      } else {
        (req as any).csrfToken = existingToken;
      }
      return next();
    }

    // For mutating methods (POST, PUT, DELETE, PATCH), verify the token
    const verification = verifyCSRFToken(req, config);
    
    if (!verification.valid) {
      console.log(`[CSRF] Token verification failed: ${verification.error}`);
      return res.status(403).json({
        success: false,
        error: 'CSRF token validation failed',
        message: verification.error,
      });
    }

    (req as any).csrfToken = verification.token;
    
    // DON'T rotate token on every request - this causes client/server sync issues
    // The token stays valid for the entire session (controlled by cookie maxAge)
    // Only rotate if the token is about to expire or on security-sensitive operations

    next();
  };
}

export function getCSRFToken(req: Request): string | undefined {
  return (req as any).csrfToken;
}
