import type { Request, Response, NextFunction } from "express";

export function setSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // CORS headers untuk public API endpoints (agar bisa diakses dari domain lain)
  // ProofCaptcha HARUS bisa diakses dari website eksternal manapun
  const publicEndpoints = [
    '/proofCaptcha/api.js',
    '/proofCaptcha/api/siteverify',
    '/api/captcha/handshake',
    '/api/captcha/challenge',
    '/api/captcha/verify',
    '/api/challenge/verify'
  ];
  
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.path.startsWith(endpoint));
  
  if (isPublicEndpoint) {
    // Allow cross-origin requests untuk public API
    const origin = req.headers.origin || '*';
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-CSRF-Token, X-Requested-With");
    res.setHeader("Access-Control-Expose-Headers", "X-CSRF-Token");
    res.setHeader("Access-Control-Max-Age", "86400");
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
  }

  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  res.setHeader("X-Content-Type-Options", "nosniff");

  // X-Frame-Options: Allow framing untuk widget embedding
  if (isPublicEndpoint) {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
  } else {
    res.setHeader("X-Frame-Options", "DENY");
  }

  res.setHeader("X-XSS-Protection", "1; mode=block");

  // CSP lebih permissive untuk public endpoints
  if (isPublicEndpoint) {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' *; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *; " +
      "worker-src 'self' blob:; " +
      "style-src 'self' 'unsafe-inline' *; " +
      "img-src 'self' data: https: *; " +
      "font-src 'self' data: *; " +
      "connect-src 'self' *; " +
      "frame-ancestors *; " +
      "base-uri 'self'; " +
      "form-action 'self' *"
    );
  } else {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "worker-src 'self' blob:; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
    );
  }

  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );

  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
}
