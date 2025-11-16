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
  const headerToken = req.headers[config.headerName] as string | undefined;
  const bodyToken = req.body?.csrfToken;

  if (!cookieToken) {
    return {
      valid: false,
      error: 'CSRF token not found in cookie',
    };
  }

  const submittedToken = headerToken || bodyToken;

  if (!submittedToken) {
    return {
      valid: false,
      error: 'CSRF token not found in request',
    };
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const submittedBuffer = Buffer.from(submittedToken);
  
  if (cookieBuffer.length !== submittedBuffer.length) {
    return {
      valid: false,
      error: 'CSRF token mismatch',
    };
  }

  try {
    if (!crypto.timingSafeEqual(cookieBuffer, submittedBuffer)) {
      return {
        valid: false,
        error: 'CSRF token mismatch',
      };
    }
  } catch (err) {
    return {
      valid: false,
      error: 'CSRF token validation error',
    };
  }

  return {
    valid: true,
    token: cookieToken,
  };
}

export function csrfMiddleware(config: CSRFConfig = DEFAULT_CSRF_CONFIG) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      const token = createCSRFCookie(res, config);
      (req as any).csrfToken = token;
      return next();
    }

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
    
    const newToken = generateCSRFToken(config.tokenLength);
    res.cookie(config.cookieName, newToken, config.cookieOptions);

    next();
  };
}

export function getCSRFToken(req: Request): string | undefined {
  return (req as any).csrfToken;
}
