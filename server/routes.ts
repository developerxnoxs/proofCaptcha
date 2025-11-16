import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import path from "path";
import { readFile } from "fs/promises";
import { detectAutomation } from "./automation-detector";
import { ipBlocker } from "./ip-blocker";
import { generateChallengeSignature, verifyChallengeSignature, extractDomainFromRequest, createVerificationToken, verifyVerificationToken, normalizeDomain, getServerOrigin } from "./crypto-utils";
import { generateDeviceFingerprint, trackDeviceFingerprint } from "./device-fingerprint";
import { calculateRiskScore, calculateAdaptiveDifficulty } from "./risk-scoring";
import { analyzeBehavior } from "./behavioral-analysis";
import { markChallengeAsUsed, isChallengeUsed } from "./challenge-tracker";
import { securityMonitor } from "./security-monitor";
import { checkChallengeExpiration, DEFAULT_EXPIRATION_CONFIG } from "./enhancements/token-expiration";
import { generateSessionFingerprint, verifySessionBinding, DEFAULT_SESSION_BINDING_CONFIG } from "./enhancements/session-binding";
import { csrfMiddleware, createCSRFCookie, verifyCSRFToken, getCSRFToken } from "./enhancements/csrf-protection";
import { generateAdvancedFingerprint, compareFingerprints, type AdvancedFingerprint } from "./enhancements/advanced-fingerprint";
import { checkEnhancedHoneypot, ENHANCED_HONEYPOT_CONFIG } from "./enhancements/enhanced-honeypot";
import { sessionCache } from "./session-cache";
import { 
  generateServerKeyPair,
  deriveSharedSecret,
  deriveMasterKey,
  signHandshakeTranscript,
  encryptChallengeData,
  encryptSecurityConfig,
  decryptSolutionData,
  decryptVerificationMetadata,
  type HandshakeResponse,
  type EncryptedPayload
} from "./encryption";
import { generateUpsideDownChallenge, validateUpsideDownSolution, type UpsideDownChallengeData } from "./upside-down-generator";
import { getGeolocationFromIP } from "./geolocation";
import { securitySettingsSchema, DEFAULT_SECURITY_SETTINGS, type SecuritySettings } from "@shared/schema";
import { emailService } from "./email-service";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.developerId) {
    return res.status(401).json({ error: "Unauthorized", message: "Please login first" });
  }
  next();
}

async function requireVerifiedEmail(req: Request, res: Response, next: NextFunction) {
  if (!req.session.developerId) {
    return res.status(401).json({ error: "Unauthorized", message: "Please login first" });
  }
  
  const developer = await storage.getDeveloperById(req.session.developerId);
  if (!developer) {
    return res.status(401).json({ error: "Unauthorized", message: "Account not found" });
  }
  
  if (!developer.isEmailVerified) {
    return res.status(403).json({ 
      error: "Email not verified", 
      message: "Please verify your email before accessing this resource",
      requiresVerification: true
    });
  }
  
  next();
}

// Rate limiter untuk challenge generation
const challengeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 30, // maksimal 30 request per menit
  message: "Too many challenge requests, please try again later",
});

// Rate limiter untuk verification
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 60, // maksimal 60 request per menit
  message: "Too many verification requests, please try again later",
});

// Rate limiter untuk handshake
const handshakeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 20, // maksimal 20 handshake per menit
  message: "Too many handshake requests, please try again later",
});

// ALTCHA-style Proof-of-work utilities
// More efficient than traditional POW - uses exact hash matching instead of prefix search

/**
 * Calculate maxNumber based on difficulty level
 * Uses exponential growth formula for scalable difficulty
 * 
 * Formula: maxNumber = baseNumber * (growthFactor ^ (difficulty - 1))
 * 
 * @param difficulty - Difficulty level (1-10)
 * @returns maxNumber - Maximum search space for POW
 */
function calculateMaxNumber(difficulty: number): number {
  // Clamp difficulty to valid range
  const clampedDifficulty = Math.max(1, Math.min(difficulty, 10));
  
  // Base configuration
  const baseNumber = 50;        // Starting point for difficulty 1
  const growthFactor = 2;       // Exponential growth factor
  
  // Exponential formula: 50 * (2 ^ (difficulty - 1))
  // Difficulty 1: 50
  // Difficulty 2: 100
  // Difficulty 3: 200
  // Difficulty 4: 400
  // Difficulty 5: 800
  // Difficulty 6: 1,600
  // Difficulty 7: 3,200
  // Difficulty 8: 6,400
  // Difficulty 9: 12,800
  // Difficulty 10: 25,600
  const maxNumber = baseNumber * Math.pow(growthFactor, clampedDifficulty - 1);
  
  return Math.floor(maxNumber);
}

function generateChallenge(difficulty: number) {
  // Generate random salt (ALTCHA approach)
  const salt = nanoid(32);
  const timestamp = Date.now();
  
  // Calculate max number dynamically based on difficulty
  const maxNumber = calculateMaxNumber(difficulty);
  
  // Generate secret number (random between 0 and maxNumber)
  const secretNumber = Math.floor(Math.random() * maxNumber);
  
  // Create challenge hash: SHA256(salt + secretNumber)
  const challengeHash = crypto
    .createHash("sha256")
    .update(salt + secretNumber.toString())
    .digest("hex");
  
  // Create HMAC signature for verification
  const hmacKey = JWT_SECRET;
  const signature = crypto
    .createHmac("sha256", hmacKey)
    .update(challengeHash + salt + maxNumber.toString())
    .digest("hex");

  return {
    salt,
    timestamp,
    difficulty,
    maxNumber,
    challengeHash,
    secretNumber, // Store this server-side only, don't send to client
    signature,
  };
}

function verifyProofOfWork(challenge: any, solution: number | string): boolean {
  const { salt, challengeHash, signature, maxNumber } = challenge;
  
  // Convert solution to number if it's a string
  const solutionNumber = typeof solution === 'string' ? parseInt(solution, 10) : solution;
  
  // Validate solution is a valid number
  if (isNaN(solutionNumber)) {
    console.error("[ALTCHA] Invalid solution: not a number");
    return false;
  }
  
  // Verify HMAC signature first
  const hmacKey = JWT_SECRET;
  const expectedSignature = crypto
    .createHmac("sha256", hmacKey)
    .update(challengeHash + salt + maxNumber.toString())
    .digest("hex");
  
  if (signature !== expectedSignature) {
    console.error("[ALTCHA] Invalid signature");
    return false;
  }
  
  // Verify the solution: SHA256(salt + solution) should equal challengeHash
  const solutionHash = crypto
    .createHash("sha256")
    .update(salt + solutionNumber.toString())
    .digest("hex");

  return solutionHash === challengeHash;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== AUTHENTICATION ENDPOINTS ====================

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const honeypotCheck = checkEnhancedHoneypot(req, ENHANCED_HONEYPOT_CONFIG);
      if (honeypotCheck.shouldBlock) {
        console.log(`[HONEYPOT] Bot detected in registration: ${honeypotCheck.details.join(', ')}`);
        const clientIP = ipBlocker.getClientIP(req);
        ipBlocker.recordFailedAttempt(clientIP);
        return res.status(403).json({ 
          error: "Security check failed",
          message: "Suspicious activity detected"
        });
      }

      const schema = z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().min(1, "Name is required"),
        captchaToken: z.string().min(1, "CAPTCHA token is required"),
      });

      const data = schema.parse(req.body);
      
      // Get demo API key to decode verification token
      const demoDeveloper = await storage.getDeveloperByEmail("demo@proofcaptcha.local");
      if (!demoDeveloper) {
        return res.status(500).json({
          error: "System error",
          message: "Demo key not configured",
        });
      }

      const apiKeys = await storage.getApiKeysByDeveloper(demoDeveloper.id);
      const demoKey = apiKeys.find(k => k.name === "Demo Application");
      if (!demoKey) {
        return res.status(500).json({
          error: "System error",
          message: "Demo key not found",
        });
      }

      // Decode verification token (not challenge token)
      const decoded = verifyVerificationToken(data.captchaToken, demoKey.secretkey);
      if (!decoded) {
        return res.status(400).json({
          error: "Invalid CAPTCHA",
          message: "CAPTCHA verification failed. Please try again.",
        });
      }

      // Get the challenge that was verified
      const challenge = await storage.getChallenge(decoded.challengeId);
      if (!challenge) {
        return res.status(400).json({
          error: "Invalid CAPTCHA",
          message: "CAPTCHA verification failed. Please try again.",
        });
      }

      const expirationCheck = checkChallengeExpiration(challenge.createdAt, DEFAULT_EXPIRATION_CONFIG);
      if (!expirationCheck.isValid) {
        return res.status(400).json({
          error: "Invalid CAPTCHA",
          message: expirationCheck.message || "CAPTCHA expired. Please try again.",
        });
      }
      
      if (!challenge.isUsed) {
        return res.status(400).json({
          error: "CAPTCHA not verified",
          message: "Please complete the CAPTCHA challenge first.",
        });
      }

      // Check verification token replay using the same tracker
      const verificationTokenId = `vt_${decoded.challengeId}_${decoded.nonce}`;
      if (isChallengeUsed(verificationTokenId)) {
        console.log(`[SECURITY] Verification token replay attack detected in register: ${verificationTokenId}`);
        return res.status(400).json({
          error: "Invalid CAPTCHA",
          message: "CAPTCHA token already used. Please try again.",
        });
      }
      
      // Mark verification token as used to prevent replay
      markChallengeAsUsed(verificationTokenId);
      
      // Note: Challenge is already marked as used, preventing reuse
      // It will be cleaned up by automated cleanup task
      console.log(`[SECURITY] CAPTCHA token validated for registration: ${data.email}`);
      
      const existingDeveloper = await storage.getDeveloperByEmail(data.email);
      if (existingDeveloper) {
        return res.status(400).json({
          error: "Email already registered",
          message: "An account with this email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      const developer = await storage.createDeveloper({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        isEmailVerified: false,
        verificationCode,
        verificationCodeExpiry,
      });

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(
        developer.email,
        verificationCode,
        developer.name
      );

      if (!emailSent) {
        console.error('[REGISTER] Failed to send verification email');
      }

      // Store developer ID in session but don't mark as fully authenticated
      req.session.developerId = developer.id;
      req.session.isEmailVerified = false;

      res.json({
        success: true,
        requiresVerification: true,
        developer: {
          id: developer.id,
          email: developer.email,
          name: developer.name,
          isEmailVerified: false,
        },
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        error: "Registration failed",
        message: error.message || "Failed to create account"
      });
    }
  });

  // Verify email with code
  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      if (!req.session.developerId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Please login first",
        });
      }

      const schema = z.object({
        code: z.string().length(6, "Verification code must be 6 digits"),
      });

      const data = schema.parse(req.body);

      const developer = await storage.getDeveloperById(req.session.developerId);
      if (!developer) {
        return res.status(404).json({
          error: "Developer not found",
          message: "Account not found",
        });
      }

      if (developer.isEmailVerified) {
        return res.status(400).json({
          error: "Already verified",
          message: "Email is already verified",
        });
      }

      if (!developer.verificationCode || !developer.verificationCodeExpiry) {
        return res.status(400).json({
          error: "No verification code",
          message: "No verification code found. Please request a new one.",
        });
      }

      // Check if code expired
      if (new Date() > developer.verificationCodeExpiry) {
        return res.status(400).json({
          error: "Code expired",
          message: "Verification code has expired. Please request a new one.",
        });
      }

      // Verify code
      if (data.code !== developer.verificationCode) {
        return res.status(400).json({
          error: "Invalid code",
          message: "Verification code is incorrect",
        });
      }

      // Mark as verified
      await storage.verifyDeveloperEmail(developer.id);
      req.session.isEmailVerified = true;

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error: any) {
      console.error("Email verification error:", error);
      res.status(400).json({
        error: "Verification failed",
        message: error.message || "Failed to verify email",
      });
    }
  });

  // Resend verification code
  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    try {
      if (!req.session.developerId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Please login first",
        });
      }

      const developer = await storage.getDeveloperById(req.session.developerId);
      if (!developer) {
        return res.status(404).json({
          error: "Developer not found",
          message: "Account not found",
        });
      }

      if (developer.isEmailVerified) {
        return res.status(400).json({
          error: "Already verified",
          message: "Email is already verified",
        });
      }

      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await storage.updateVerificationCode(developer.id, verificationCode, verificationCodeExpiry);

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(
        developer.email,
        verificationCode,
        developer.name
      );

      if (!emailSent) {
        return res.status(500).json({
          error: "Email failed",
          message: "Failed to send verification email. Please try again.",
        });
      }

      res.json({
        success: true,
        message: "Verification code sent to your email",
      });
    } catch (error: any) {
      console.error("Resend verification error:", error);
      res.status(400).json({
        error: "Resend failed",
        message: error.message || "Failed to resend verification code",
      });
    }
  });

  // Request password reset
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const honeypotCheck = checkEnhancedHoneypot(req, ENHANCED_HONEYPOT_CONFIG);
      if (honeypotCheck.shouldBlock) {
        console.log(`[HONEYPOT] Bot detected in forgot password: ${honeypotCheck.details.join(', ')}`);
        const clientIP = ipBlocker.getClientIP(req);
        ipBlocker.recordFailedAttempt(clientIP);
        return res.status(403).json({ 
          error: "Security check failed",
          message: "Suspicious activity detected"
        });
      }

      const schema = z.object({
        email: z.string().email("Invalid email address"),
        captchaToken: z.string().min(1, "CAPTCHA token is required"),
      });

      const data = schema.parse(req.body);
      
      // Get demo API key to decode verification token
      const demoDeveloper = await storage.getDeveloperByEmail("demo@proofcaptcha.local");
      if (!demoDeveloper) {
        return res.status(500).json({
          error: "System error",
          message: "Demo key not configured",
        });
      }

      const apiKeys = await storage.getApiKeysByDeveloper(demoDeveloper.id);
      const demoKey = apiKeys.find(k => k.name === "Demo Application");
      if (!demoKey) {
        return res.status(500).json({
          error: "System error",
          message: "Demo key not found",
        });
      }

      // Decode verification token
      const decoded = verifyVerificationToken(data.captchaToken, demoKey.secretkey);
      if (!decoded) {
        return res.status(400).json({
          error: "Invalid CAPTCHA",
          message: "CAPTCHA verification failed. Please try again.",
        });
      }

      // Get the challenge that was verified
      const challenge = await storage.getChallenge(decoded.challengeId);
      if (!challenge) {
        return res.status(400).json({
          error: "Invalid CAPTCHA",
          message: "CAPTCHA verification failed. Please try again.",
        });
      }

      const expirationCheck = checkChallengeExpiration(challenge.createdAt, DEFAULT_EXPIRATION_CONFIG);
      if (!expirationCheck.isValid) {
        return res.status(400).json({
          error: "Invalid CAPTCHA",
          message: expirationCheck.message || "CAPTCHA expired. Please try again.",
        });
      }
      
      if (!challenge.isUsed) {
        return res.status(400).json({
          error: "CAPTCHA not verified",
          message: "CAPTCHA must be verified before proceeding",
        });
      }

      // Check if developer exists
      const developer = await storage.getDeveloperByEmail(data.email);
      if (!developer) {
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message: "If the email exists, a reset code will be sent",
        });
      }

      // Generate reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await storage.updateResetPasswordCode(data.email, resetCode, resetCodeExpiry);

      // Send reset email
      const emailSent = await emailService.sendPasswordResetEmail(
        developer.email,
        resetCode,
        developer.name
      );

      if (!emailSent) {
        return res.status(500).json({
          error: "Email failed",
          message: "Failed to send reset email. Please try again.",
        });
      }

      res.json({
        success: true,
        message: "Reset code sent to your email",
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(400).json({
        error: "Request failed",
        message: error.message || "Failed to process request",
      });
    }
  });

  // Reset password with code
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        email: z.string().email("Invalid email address"),
        code: z.string().length(6, "Reset code must be 6 digits"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      });

      const data = schema.parse(req.body);

      // Hash new password
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);

      // Reset password using storage
      const success = await storage.resetPassword(data.email, data.code, hashedPassword);

      if (!success) {
        return res.status(400).json({
          error: "Reset failed",
          message: "Invalid or expired reset code",
        });
      }

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(400).json({
        error: "Reset failed",
        message: error.message || "Failed to reset password",
      });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const honeypotCheck = checkEnhancedHoneypot(req, ENHANCED_HONEYPOT_CONFIG);
      if (honeypotCheck.shouldBlock) {
        console.log(`[HONEYPOT] Bot detected in login: ${honeypotCheck.details.join(', ')}`);
        const clientIP = ipBlocker.getClientIP(req);
        ipBlocker.recordFailedAttempt(clientIP);
        return res.status(403).json({ 
          error: "Security check failed",
          message: "Suspicious activity detected"
        });
      }

      const schema = z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
        captchaToken: z.string().min(1, "CAPTCHA token is required"),
      });

      const data = schema.parse(req.body);
      
      // Get demo API key to decode verification token
      const demoDeveloper = await storage.getDeveloperByEmail("demo@proofcaptcha.local");
      if (!demoDeveloper) {
        return res.status(500).json({
          error: "System error",
          message: "Demo key not configured",
        });
      }

      const apiKeys = await storage.getApiKeysByDeveloper(demoDeveloper.id);
      const demoKey = apiKeys.find(k => k.name === "Demo Application");
      if (!demoKey) {
        return res.status(500).json({
          error: "System error",
          message: "Demo key not found",
        });
      }

      // Decode verification token (not challenge token)
      const decoded = verifyVerificationToken(data.captchaToken, demoKey.secretkey);
      if (!decoded) {
        return res.status(400).json({
          error: "Invalid CAPTCHA",
          message: "CAPTCHA verification failed. Please try again.",
        });
      }

      // Get the challenge that was verified
      const challenge = await storage.getChallenge(decoded.challengeId);
      if (!challenge) {
        return res.status(400).json({
          error: "Invalid CAPTCHA",
          message: "CAPTCHA verification failed. Please try again.",
        });
      }

      const expirationCheck = checkChallengeExpiration(challenge.createdAt, DEFAULT_EXPIRATION_CONFIG);
      if (!expirationCheck.isValid) {
        return res.status(400).json({
          error: "Invalid CAPTCHA",
          message: expirationCheck.message || "CAPTCHA expired. Please try again.",
        });
      }
      
      if (!challenge.isUsed) {
        return res.status(400).json({
          error: "CAPTCHA not verified",
          message: "Please complete the CAPTCHA challenge first.",
        });
      }

      // Check verification token replay using the same tracker
      const verificationTokenId = `vt_${decoded.challengeId}_${decoded.nonce}`;
      if (isChallengeUsed(verificationTokenId)) {
        console.log(`[SECURITY] Verification token replay attack detected in login: ${verificationTokenId}`);
        return res.status(400).json({
          error: "Invalid CAPTCHA",
          message: "CAPTCHA token already used. Please try again.",
        });
      }
      
      // Mark verification token as used to prevent replay
      markChallengeAsUsed(verificationTokenId);
      
      // Note: Challenge is already marked as used, preventing reuse
      // It will be cleaned up by automated cleanup task
      console.log(`[SECURITY] CAPTCHA token validated for login: ${data.email}`);
      
      const developer = await storage.getDeveloperByEmail(data.email);
      if (!developer) {
        return res.status(401).json({
          error: "Invalid credentials",
          message: "Email or password is incorrect",
        });
      }

      const isValidPassword = await bcrypt.compare(data.password, developer.password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: "Invalid credentials",
          message: "Email or password is incorrect",
        });
      }

      req.session.developerId = developer.id;

      res.json({
        success: true,
        developer: {
          id: developer.id,
          email: developer.email,
          name: developer.name,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ 
        error: "Login failed",
        message: error.message || "Failed to login"
      });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", async (req: Request, res: Response) => {
    if (!req.session.developerId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const developer = await storage.getDeveloper(req.session.developerId);
    if (!developer) {
      return res.status(401).json({ error: "Developer not found" });
    }

    res.json({
      id: developer.id,
      email: developer.email,
      name: developer.name,
      isEmailVerified: developer.isEmailVerified,
      csrfToken: getCSRFToken(req),
    });
  });

  app.get("/api/security/csrf", (req: Request, res: Response) => {
    const token = getCSRFToken(req);
    res.json({ csrfToken: token });
  });

  // ==================== PUBLIC DEMO ENDPOINT ====================

  app.get("/api/demo/key", async (req: Request, res: Response) => {
    try {
      const demoDeveloper = await storage.getDeveloperByEmail("demo@proofcaptcha.local");
      if (!demoDeveloper) {
        return res.status(404).json({ error: "Demo key not found" });
      }

      const apiKeys = await storage.getApiKeysByDeveloper(demoDeveloper.id);
      const demoKey = apiKeys.find(k => k.name === "Demo Application");

      if (!demoKey) {
        return res.status(404).json({ error: "Demo key not found" });
      }

      res.json({
        sitekey: demoKey.sitekey,
        publicKey: demoKey.sitekey, // Legacy alias for backward compatibility
        name: demoKey.name,
      });
    } catch (error: any) {
      console.error("Error fetching demo key:", error);
      res.status(500).json({ error: "Failed to fetch demo key" });
    }
  });

  // ==================== DEVELOPER DASHBOARD API ENDPOINTS (Protected) ====================

  app.post("/api/keys", requireVerifiedEmail, async (req: Request, res: Response) => {
    try {
      const honeypotCheck = checkEnhancedHoneypot(req, ENHANCED_HONEYPOT_CONFIG);
      if (honeypotCheck.shouldBlock) {
        console.log(`[HONEYPOT] Bot detected in API key creation: ${honeypotCheck.details.join(', ')}`);
        const clientIP = ipBlocker.getClientIP(req);
        ipBlocker.recordFailedAttempt(clientIP);
        return res.status(403).json({ 
          error: "Security check failed",
          message: "Suspicious activity detected"
        });
      }

      const schema = z.object({
        name: z.string().min(1, "Application name is required"),
        domain: z.string().min(1, "Domain is required"),
        theme: z.enum(["light", "dark", "auto"]).optional().default("light"),
      });

      const data = schema.parse(req.body);
      
      const apiKey = await storage.createApiKey({
        developerId: req.session.developerId!,
        name: data.name,
        domain: data.domain,
        theme: data.theme,
        isActive: true,
      });

      res.json({
        success: true,
        sitekey: apiKey.sitekey,
        secretkey: apiKey.secretkey,
        publicKey: apiKey.sitekey,  // Legacy alias for backward compatibility
        privateKey: apiKey.secretkey, // Legacy alias for backward compatibility
        name: apiKey.name,
        domain: apiKey.domain,
        message: "API keys created successfully. Please save your secretkey securely.",
      });
    } catch (error: any) {
      console.error("API Key creation error:", error);
      res.status(400).json({ 
        error: "Failed to create API keys",
        message: error.message || "Failed to create API keys"
      });
    }
  });

  app.get("/api/keys", requireVerifiedEmail, async (req: Request, res: Response) => {
    try {
      const apiKeys = await storage.getApiKeysByDeveloper(req.session.developerId!);
      res.json(apiKeys);
    } catch (error: any) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.delete("/api/keys/:id", requireVerifiedEmail, async (req: Request, res: Response) => {
    try {
      const apiKey = await storage.getApiKey(req.params.id);
      if (!apiKey || apiKey.developerId !== req.session.developerId) {
        return res.status(404).json({ error: "API key not found" });
      }

      await storage.deleteApiKey(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });

  app.patch("/api/keys/:id/toggle", requireVerifiedEmail, async (req: Request, res: Response) => {
    try {
      const apiKey = await storage.getApiKey(req.params.id);
      if (!apiKey || apiKey.developerId !== req.session.developerId) {
        return res.status(404).json({ error: "API key not found" });
      }

      await storage.updateApiKeyStatus(req.params.id, !apiKey.isActive);
      const updated = await storage.getApiKey(req.params.id);
      res.json(updated);
    } catch (error: any) {
      console.error("Error toggling API key:", error);
      res.status(500).json({ error: "Failed to toggle API key" });
    }
  });

  // Get security settings for an API key
  app.get("/api/keys/:id/settings", requireVerifiedEmail, async (req: Request, res: Response) => {
    try {
      const apiKey = await storage.getApiKey(req.params.id);
      if (!apiKey || apiKey.developerId !== req.session.developerId) {
        return res.status(404).json({ error: "API key not found" });
      }

      // Return settings or default if not set
      const settings = apiKey.settings as SecuritySettings | null;
      res.json(settings || DEFAULT_SECURITY_SETTINGS);
    } catch (error: any) {
      console.error("Error fetching API key settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update security settings for an API key
  app.put("/api/keys/:id/settings", requireVerifiedEmail, async (req: Request, res: Response) => {
    try {
      const apiKey = await storage.getApiKey(req.params.id);
      if (!apiKey || apiKey.developerId !== req.session.developerId) {
        return res.status(404).json({ error: "API key not found" });
      }

      // CRITICAL SECURITY: Validate settings with strict zod schema
      // This prevents manipulation of settings via API
      // .strict() ensures NO extra fields can be passed (rejects unknown fields)
      // Schema enforces min/max values and allowed types
      const validatedSettings = securitySettingsSchema.strict().parse(req.body);
      
      // Extra validation: Explicitly reject any attempt to add domainValidation or encryption fields
      // These are core security features that must NEVER be configurable
      if ('domainValidation' in req.body || 'encryption' in req.body || 'encryptData' in req.body) {
        return res.status(400).json({ 
          error: "Invalid settings",
          message: "Domain validation and encryption cannot be configured. These security features are always enforced."
        });
      }
      
      // IMPORTANT: Domain validation and encryption are ALWAYS ENFORCED
      // These cannot be disabled via settings and are enforced server-side:
      // - Domain validation: Always checked in challenge/verify endpoints
      // - Encryption: Always active in EncryptionManager (progressive enhancement)
      // These critical security features are NOT part of configurable settings
      
      // Additional server-side validation to prevent manipulation
      // Ensure settings are within safe ranges even if zod schema passes
      if (validatedSettings.proofOfWorkDifficulty < 1 || validatedSettings.proofOfWorkDifficulty > 10) {
        return res.status(400).json({ 
          error: "Invalid settings",
          message: "Proof of work difficulty must be between 1 and 10"
        });
      }
      
      if (validatedSettings.rateLimitMaxRequests < 1 || validatedSettings.rateLimitMaxRequests > 1000) {
        return res.status(400).json({ 
          error: "Invalid settings",
          message: "Rate limit max requests must be between 1 and 1000"
        });
      }
      
      if (validatedSettings.challengeTimeoutMs < 10000 || validatedSettings.challengeTimeoutMs > 300000) {
        return res.status(400).json({ 
          error: "Invalid settings",
          message: "Challenge timeout must be between 10 and 300 seconds"
        });
      }
      
      if (validatedSettings.tokenExpiryMs < 30000 || validatedSettings.tokenExpiryMs > 600000) {
        return res.status(400).json({ 
          error: "Invalid settings",
          message: "Token expiry must be between 30 and 600 seconds"
        });
      }
      
      // SECURITY: Validate blocked IPs and countries format
      const blockValidation = ipBlocker.validateBlockedLists(
        validatedSettings.blockedIps,
        validatedSettings.blockedCountries
      );
      
      if (!blockValidation.valid) {
        return res.status(400).json({
          error: "Invalid blocking configuration",
          message: "Some IP addresses or country codes are invalid",
          details: blockValidation.errors
        });
      }
      
      // Normalize blocked data before persisting
      if (validatedSettings.blockedIps) {
        validatedSettings.blockedIps = validatedSettings.blockedIps.map(ip => ip.trim());
      }
      if (validatedSettings.blockedCountries) {
        validatedSettings.blockedCountries = validatedSettings.blockedCountries.map(
          country => country.trim().toUpperCase()
        );
      }
      
      // Update settings in database
      await storage.updateApiKeySettings(req.params.id, validatedSettings);
      
      res.json({
        success: true,
        settings: validatedSettings,
        message: "Settings updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating API key settings:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid settings",
          message: "Some settings values are invalid",
          details: error.errors
        });
      }
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/analytics", requireVerifiedEmail, async (req: Request, res: Response) => {
    try {
      const apiKeys = await storage.getApiKeysByDeveloper(req.session.developerId!);
      const apiKeyIds = apiKeys.map(k => k.id);
      
      const allAnalytics = [];
      for (const apiKeyId of apiKeyIds) {
        const analytics = await storage.getAnalyticsByApiKey(apiKeyId);
        allAnalytics.push(...analytics);
      }
      
      res.json(allAnalytics);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Dashboard statistics endpoint - uses aggregated analytics data for efficiency
  app.get("/api/admin/stats", requireVerifiedEmail, async (req: Request, res: Response) => {
    try {
      const filterApiKeyId = req.query.apiKeyId as string | undefined;
      
      const apiKeys = await storage.getApiKeysByDeveloper(req.session.developerId!);
      
      // If filtering by specific API key, verify ownership
      if (filterApiKeyId) {
        const hasAccess = apiKeys.some(k => k.id === filterApiKeyId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied to this API key" });
        }
      }
      
      // Determine which API keys to aggregate
      const apiKeyIds = filterApiKeyId ? [filterApiKeyId] : apiKeys.map(k => k.id);
      
      // Use analytics data (already aggregated) for all-time totals
      let totalChallenges = 0;
      let successfulVerifications = 0;
      let failedVerifications = 0;
      let totalSolveTime = 0;
      let solveTimeCount = 0;
      const uniqueIpsSet = new Set<string>();
      
      // Fetch all analytics data for selected API keys in parallel
      const analyticsPromises = apiKeyIds.map(apiKeyId => 
        storage.getAnalyticsByApiKey(apiKeyId)
      );
      const allAnalyticsArrays = await Promise.all(analyticsPromises);
      
      // Aggregate all analytics records
      for (const analyticsArray of allAnalyticsArrays) {
        for (const record of analyticsArray) {
          totalChallenges += record.totalChallenges || 0;
          successfulVerifications += record.successfulVerifications || 0;
          failedVerifications += record.failedVerifications || 0;
          
          // Calculate weighted average for solve time
          if (record.averageTimeToSolve !== null && record.successfulVerifications > 0) {
            totalSolveTime += record.averageTimeToSolve * record.successfulVerifications;
            solveTimeCount += record.successfulVerifications;
          }
        }
      }
      
      // Get unique IPs from recent verifications (last 1000)
      const recentVerificationsPromises = apiKeyIds.map(apiKeyId =>
        storage.getVerificationsByApiKey(apiKeyId, 1000)
      );
      const recentVerificationsArrays = await Promise.all(recentVerificationsPromises);
      
      for (const verifications of recentVerificationsArrays) {
        verifications.forEach(v => {
          if (v.ipAddress) uniqueIpsSet.add(v.ipAddress);
        });
      }
      
      const totalVerifications = successfulVerifications + failedVerifications;
      const successRate = totalVerifications > 0 
        ? ((successfulVerifications / totalVerifications) * 100).toFixed(1)
        : "0.0";
      
      const avgTimeToSolve = solveTimeCount > 0
        ? Math.round(totalSolveTime / solveTimeCount)
        : 0;
      
      res.json({
        totalApiKeys: apiKeys.length,
        activeApiKeys: apiKeys.filter(k => k.isActive).length,
        totalVerifications,
        successfulVerifications,
        failedVerifications,
        successRate,
        uniqueIps: uniqueIpsSet.size,
        avgTimeToSolve,
      });
    } catch (error: any) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Time-series data for charts (hourly data for last 24 hours)
  app.get("/api/admin/timeseries", requireVerifiedEmail, async (req: Request, res: Response) => {
    try {
      const filterApiKeyId = req.query.apiKeyId as string | undefined;
      const apiKeys = await storage.getApiKeysByDeveloper(req.session.developerId!);
      
      if (filterApiKeyId) {
        const hasAccess = apiKeys.some(k => k.id === filterApiKeyId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied to this API key" });
        }
      }
      
      const apiKeyIds = filterApiKeyId ? [filterApiKeyId] : apiKeys.map(k => k.id);
      
      // Get verifications for last 24 hours
      const now = Date.now();
      const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
      
      const verificationsPromises = apiKeyIds.map(apiKeyId =>
        storage.getVerificationsByApiKey(apiKeyId, 5000)
      );
      const allVerificationsArrays = await Promise.all(verificationsPromises);
      const allVerifications = allVerificationsArrays.flat();
      
      // Filter to last 24 hours
      const recentVerifications = allVerifications.filter(v => 
        new Date(v.createdAt).getTime() > twentyFourHoursAgo
      );
      
      // Group by hour
      const hourlyData: { [key: string]: { success: number; failed: number; total: number } } = {};
      
      for (let i = 23; i >= 0; i--) {
        const hourTime = now - (i * 60 * 60 * 1000);
        const hourLabel = new Date(hourTime).getHours().toString().padStart(2, '0') + ':00';
        hourlyData[hourLabel] = { success: 0, failed: 0, total: 0 };
      }
      
      recentVerifications.forEach(v => {
        const hour = new Date(v.createdAt).getHours().toString().padStart(2, '0') + ':00';
        if (hourlyData[hour]) {
          hourlyData[hour].total++;
          if (v.success) {
            hourlyData[hour].success++;
          } else {
            hourlyData[hour].failed++;
          }
        }
      });
      
      const timeseriesData = Object.entries(hourlyData).map(([time, data]) => ({
        time,
        success: data.success,
        failed: data.failed,
        total: data.total,
      }));
      
      res.json(timeseriesData);
    } catch (error: any) {
      console.error("Error fetching timeseries data:", error);
      res.status(500).json({ error: "Failed to fetch timeseries data" });
    }
  });

  // Challenge types distribution
  app.get("/api/admin/challenge-types", requireVerifiedEmail, async (req: Request, res: Response) => {
    try {
      const filterApiKeyId = req.query.apiKeyId as string | undefined;
      const apiKeys = await storage.getApiKeysByDeveloper(req.session.developerId!);
      
      if (filterApiKeyId) {
        const hasAccess = apiKeys.some(k => k.id === filterApiKeyId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied to this API key" });
        }
      }
      
      const apiKeyIds = filterApiKeyId ? [filterApiKeyId] : apiKeys.map(k => k.id);
      
      // Get all challenges and filter by API key
      const allChallenges = await storage.getAllChallenges();
      const filteredChallenges = allChallenges.filter(
        (challenge) => challenge.apiKeyId && apiKeyIds.includes(challenge.apiKeyId)
      );
      
      const typeCounts: { [key: string]: number } = {};
      filteredChallenges.forEach((challenge) => {
        typeCounts[challenge.type] = (typeCounts[challenge.type] || 0) + 1;
      });
      
      const distribution = Object.entries(typeCounts).map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value,
      }));
      
      res.json(distribution);
    } catch (error: any) {
      console.error("Error fetching challenge types:", error);
      res.status(500).json({ error: "Failed to fetch challenge types" });
    }
  });

  // Country analytics - verifications by country
  app.get("/api/admin/country-analytics", requireVerifiedEmail, async (req: Request, res: Response) => {
    try {
      const filterApiKeyId = req.query.apiKeyId as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const apiKeys = await storage.getApiKeysByDeveloper(req.session.developerId!);
      
      if (filterApiKeyId) {
        const hasAccess = apiKeys.some(k => k.id === filterApiKeyId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied to this API key" });
        }
      }
      
      const apiKeyIds = filterApiKeyId ? [filterApiKeyId] : apiKeys.map(k => k.id);
      
      // Get all verifications
      const allVerifications = filterApiKeyId 
        ? await storage.getVerificationsByApiKey(filterApiKeyId, 10000)
        : await storage.getRecentVerifications(10000);
      
      // Filter by developer's API keys if "all"
      const verifications = filterApiKeyId
        ? allVerifications
        : allVerifications.filter(v => v.apiKeyId && apiKeyIds.includes(v.apiKeyId));
      
      // Group by country
      const countryStats: {
        [country: string]: {
          country: string;
          countryName: string;
          totalVerifications: number;
          successfulVerifications: number;
          failedVerifications: number;
          uniqueIps: Set<string>;
          totalSolveTime: number;
          solveTimeCount: number;
        }
      } = {};
      
      verifications.forEach(v => {
        const countryCode = v.country || 'Unknown';
        const countryName = v.countryName || 'Unknown';
        
        if (!countryStats[countryCode]) {
          countryStats[countryCode] = {
            country: countryCode,
            countryName: countryName,
            totalVerifications: 0,
            successfulVerifications: 0,
            failedVerifications: 0,
            uniqueIps: new Set(),
            totalSolveTime: 0,
            solveTimeCount: 0,
          };
        }
        
        const stats = countryStats[countryCode];
        stats.totalVerifications++;
        
        if (v.success) {
          stats.successfulVerifications++;
        } else {
          stats.failedVerifications++;
        }
        
        if (v.ipAddress) {
          stats.uniqueIps.add(v.ipAddress);
        }
        
        if (v.timeToSolve) {
          stats.totalSolveTime += v.timeToSolve;
          stats.solveTimeCount++;
        }
      });
      
      // Convert to array and calculate averages
      const countryAnalytics = Object.values(countryStats)
        .map(stats => ({
          country: stats.country,
          countryName: stats.countryName,
          totalVerifications: stats.totalVerifications,
          successfulVerifications: stats.successfulVerifications,
          failedVerifications: stats.failedVerifications,
          successRate: stats.totalVerifications > 0 
            ? ((stats.successfulVerifications / stats.totalVerifications) * 100).toFixed(1) + '%'
            : '0%',
          uniqueIps: stats.uniqueIps.size,
          averageTimeToSolve: stats.solveTimeCount > 0 
            ? Math.round(stats.totalSolveTime / stats.solveTimeCount)
            : null,
        }))
        .sort((a, b) => b.totalVerifications - a.totalVerifications)
        .slice(0, limit);
      
      res.json(countryAnalytics);
    } catch (error: any) {
      console.error("Error fetching country analytics:", error);
      res.status(500).json({ error: "Failed to fetch country analytics" });
    }
  });

  // Geographic distribution for map visualization
  app.get("/api/admin/geo-distribution", requireVerifiedEmail, async (req: Request, res: Response) => {
    try {
      const filterApiKeyId = req.query.apiKeyId as string | undefined;
      const apiKeys = await storage.getApiKeysByDeveloper(req.session.developerId!);
      
      if (filterApiKeyId) {
        const hasAccess = apiKeys.some(k => k.id === filterApiKeyId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied to this API key" });
        }
      }
      
      const apiKeyIds = filterApiKeyId ? [filterApiKeyId] : apiKeys.map(k => k.id);
      
      // Get all verifications
      const allVerifications = filterApiKeyId 
        ? await storage.getVerificationsByApiKey(filterApiKeyId, 10000)
        : await storage.getRecentVerifications(10000);
      
      // Filter by developer's API keys if "all"
      const verifications = filterApiKeyId
        ? allVerifications
        : allVerifications.filter(v => v.apiKeyId && apiKeyIds.includes(v.apiKeyId));
      
      // Group by location (lat/long)
      const locationMap: {
        [key: string]: {
          latitude: string;
          longitude: string;
          city: string | null;
          country: string | null;
          countryName: string | null;
          count: number;
          success: number;
          failed: number;
        }
      } = {};
      
      verifications.forEach(v => {
        if (v.latitude && v.longitude) {
          const key = `${v.latitude},${v.longitude}`;
          
          if (!locationMap[key]) {
            locationMap[key] = {
              latitude: v.latitude,
              longitude: v.longitude,
              city: v.city,
              country: v.country,
              countryName: v.countryName,
              count: 0,
              success: 0,
              failed: 0,
            };
          }
          
          locationMap[key].count++;
          if (v.success) {
            locationMap[key].success++;
          } else {
            locationMap[key].failed++;
          }
        }
      });
      
      const geoDistribution = Object.values(locationMap);
      
      res.json(geoDistribution);
    } catch (error: any) {
      console.error("Error fetching geo distribution:", error);
      res.status(500).json({ error: "Failed to fetch geo distribution" });
    }
  });

  // ==================== PUBLIC API ENDPOINTS ====================

  // PUBLIC: Site Verify Endpoint - untuk developer verify captcha response di backend mereka
  // NOTE: Session fingerprint binding NOT applied here because this is a backend-to-backend call
  // Session binding only works for client-to-server calls (browser to API)
  app.all("/proofCaptcha/api/siteverify", async (req: Request, res: Response) => {
    try {
      const secret = req.method === 'GET' ? req.query.secret as string : req.body.secret;
      const response = req.method === 'GET' ? req.query.response as string : req.body.response;

      if (!secret || !response) {
        return res.json({
          success: false,
          "error-codes": ["missing-input-secret", "missing-input-response"]
        });
      }

      const apiKey = await storage.getApiKeyBySecretkey(secret);
      
      if (!apiKey || !apiKey.isActive) {
        return res.json({
          success: false,
          "error-codes": ["invalid-input-secret"]
        });
      }

      const decoded = verifyVerificationToken(response, secret);
      
      if (!decoded) {
        return res.json({
          success: false,
          "error-codes": ["invalid-input-response"]
        });
      }

      const challenge = await storage.getChallenge(decoded.challengeId);
      
      if (!challenge) {
        return res.json({
          success: false,
          "error-codes": ["timeout-or-duplicate"]
        });
      }

      // IMPORTANT: Verification tokens can be validated even if challenge.isUsed = true
      // because they are separate tokens generated after successful verification.
      // The challenge being "used" means it was verified via /api/captcha/verify,
      // but the verification token itself needs separate replay protection.
      
      // Check if this specific verification token has been used before
      // We'll use a separate tracking mechanism for verification tokens
      const verificationTokenId = `vt_${decoded.challengeId}_${decoded.nonce}`;
      if (isChallengeUsed(verificationTokenId)) {
        console.log(`[SECURITY] Verification token replay attack detected: ${verificationTokenId}`);
        return res.json({
          success: false,
          "error-codes": ["timeout-or-duplicate"]
        });
      }

      // Enhanced token expiration check dengan grace period
      const expirationCheck = checkChallengeExpiration(
        challenge.createdAt,
        DEFAULT_EXPIRATION_CONFIG
      );

      if (!expirationCheck.isValid) {
        console.log(`[SECURITY] Challenge expired in siteverify: ${expirationCheck.message}`);
        return res.json({
          success: false,
          "error-codes": [expirationCheck.errorCode!]
        });
      }

      // Log jika mendekati expiration
      if (expirationCheck.expiresIn! < 60000) {
        console.log(`[WARNING] Challenge near expiration in siteverify: ${Math.floor(expirationCheck.expiresIn! / 1000)}s remaining`);
      }
      
      // NOTE: Session fingerprint binding is intentionally skipped for siteverify
      // because this endpoint is called from developer's backend server, not from the end-user's browser

      // Normalize domains untuk perbandingan yang konsisten (case-insensitive, etc)
      const normalizedApiDomain = apiKey.domain ? normalizeDomain(apiKey.domain) : null;
      const normalizedTokenDomain = normalizeDomain(decoded.domain);
      const normalizedChallengeDomain = normalizeDomain(challenge.validatedDomain);

      // Domain validation: Skip if API key has wildcard domain
      if (normalizedApiDomain && normalizedApiDomain !== "*" && normalizedTokenDomain !== normalizedApiDomain) {
        console.log(`[SECURITY] Domain mismatch in siteverify: Expected ${apiKey.domain}, got ${decoded.domain}`);
        return res.json({
          success: false,
          "error-codes": ["invalid-input-response"]
        });
      }

      // Validate challenge domain matches token domain
      // This is always enforced regardless of API key domain setting
      // This prevents tokens from being used on different domains than where they were issued
      if (normalizedChallengeDomain !== normalizedTokenDomain) {
        console.log(`[SECURITY] Challenge domain mismatch in siteverify: Expected ${challenge.validatedDomain}, got ${decoded.domain}`);
        return res.json({
          success: false,
          "error-codes": ["invalid-input-response"]
        });
      }

      // Mark this verification token as used to prevent replay
      markChallengeAsUsed(verificationTokenId);
      
      // Also mark the challenge as used in database if not already
      // This ensures challenges can't be re-verified after siteverify validation
      if (!challenge.isUsed) {
        await storage.markChallengeAsUsed(challenge.id);
      }

      console.log(`[SECURITY] Verification token validated successfully: ${verificationTokenId}`);

      res.json({
        success: true,
        challenge_ts: new Date(challenge.createdAt).toISOString(),
        hostname: decoded.domain
      });
    } catch (error: any) {
      console.error("Siteverify error:", error);
      res.json({
        success: false,
        "error-codes": ["invalid-input-response"]
      });
    }
  });

  // PUBLIC: Widget Script Endpoint - Serve canonical widget bundle
  app.get("/proofCaptcha/api.js", async (req: Request, res: Response) => {
    try {
      const scriptPath = path.resolve(import.meta.dirname, "public", "api.js");
      const script = await readFile(scriptPath, "utf-8");
      
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // No cache for development
      res.setHeader("Access-Control-Allow-Origin", "*"); // Allow CORS for widget script
      res.send(script);
    } catch (error) {
      console.error("Error serving captcha widget script:", error);
      res.status(500).send("// Error loading ProofCaptcha widget");
    }
  });

  // OLD INLINE WIDGET SCRIPT (DEPRECATED - Keeping for reference, remove later)
  // The canonical widget is now served from server/public/api.js
  /*
  app.get("/proofCaptcha/api.js.OLD", (req: Request, res: Response) => {
    const domain = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : req.protocol + '://' + req.get('host');
    
    const widgetScript = `
(function() {
  'use strict';
  
  var ProofCaptcha = {
    sitekey: null,
    challengeToken: null,
    baseUrl: '${domain}',
    
    init: function() {
      var widgets = document.querySelectorAll('.proof-captcha');
      widgets.forEach(function(widget) {
        ProofCaptcha.sitekey = widget.getAttribute('data-sitekey');
        if (!ProofCaptcha.sitekey) {
          console.error('ProofCaptcha: data-sitekey attribute is required');
          return;
        }
        ProofCaptcha.render(widget);
      });
    },
    
    render: function(container) {
      container.innerHTML = '<div style="border: 1px solid #d3d3d3; border-radius: 3px; padding: 10px; width: 300px; background: #f9f9f9;"><label style="display: flex; align-items: center; cursor: pointer;"><input type="checkbox" id="proof-captcha-checkbox" style="margin-right: 8px;"><span>I\\'m not a robot</span></label><div id="proof-captcha-status" style="margin-top: 5px; font-size: 12px; color: #666;"></div></div>';
      
      var checkbox = container.querySelector('#proof-captcha-checkbox');
      var status = container.querySelector('#proof-captcha-status');
      
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          status.textContent = 'Verifying...';
          ProofCaptcha.getChallenge();
        } else {
          status.textContent = '';
          ProofCaptcha.challengeToken = null;
          var responseInput = document.querySelector('input[name="proof-captcha-response"]');
          if (responseInput) responseInput.remove();
        }
      });
    },
    
    getChallenge: function() {
      fetch(ProofCaptcha.baseUrl + '/api/captcha/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          publicKey: ProofCaptcha.sitekey,
          type: 'checkbox'
        })
      })
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data.error) {
          document.querySelector('#proof-captcha-status').textContent = 'Error: ' + data.error;
          document.querySelector('#proof-captcha-checkbox').checked = false;
          return;
        }
        
        ProofCaptcha.challengeToken = data.token;
        ProofCaptcha.solveChallenge(data.challenge);
      })
      .catch(function(error) {
        console.error('ProofCaptcha error:', error);
        document.querySelector('#proof-captcha-status').textContent = 'Connection error';
        document.querySelector('#proof-captcha-checkbox').checked = false;
      });
    },
    
    solveChallenge: async function(challenge) {
      var solution = await ProofCaptcha.computeProofOfWork(challenge);
      
      fetch(ProofCaptcha.baseUrl + '/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: ProofCaptcha.challengeToken,
          solution: solution
        })
      })
      .then(function(response) { return response.json(); })
      .then(function(data) {
        var status = document.querySelector('#proof-captcha-status');
        if (data.success) {
          status.textContent = 'Verified ✓';
          status.style.color = 'green';
          
          var form = document.querySelector('#proof-captcha-checkbox').closest('form');
          if (form) {
            var existingInput = form.querySelector('input[name="proof-captcha-response"]');
            if (existingInput) existingInput.remove();
            
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'proof-captcha-response';
            input.value = ProofCaptcha.challengeToken;
            form.appendChild(input);
          }
        } else {
          status.textContent = 'Verification failed';
          status.style.color = 'red';
          document.querySelector('#proof-captcha-checkbox').checked = false;
        }
      })
      .catch(function(error) {
        console.error('Verification error:', error);
        document.querySelector('#proof-captcha-status').textContent = 'Verification error';
        document.querySelector('#proof-captcha-checkbox').checked = false;
      });
    },
    
    computeProofOfWork: async function(challenge) {
      var nonce = challenge.nonce;
      var timestamp = challenge.timestamp;
      var difficulty = challenge.difficulty;
      var target = '0'.repeat(difficulty);
      
      for (var i = 0; i < 1000000; i++) {
        var hash = await ProofCaptcha.sha256(nonce + timestamp + i);
        if (hash.startsWith(target)) {
          return i.toString();
        }
      }
      return '0';
    },
    
    sha256: async function(str) {
      var buffer = new TextEncoder().encode(str);
      var hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(function(b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ProofCaptcha.init();
    });
  } else {
    ProofCaptcha.init();
  }
  
  window.ProofCaptcha = ProofCaptcha;
})();
`;

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(widgetScript);
  });
  */

  // REMOVED: Legacy GET-only siteverify endpoint that conflicted with the canonical POST/GET endpoint at line 434
  // The canonical endpoint correctly handles verification tokens from /api/captcha/verify
  // and marks challenges as used to prevent replay attacks
  
  // ==================== ENCRYPTION HANDSHAKE ENDPOINT ====================
  /**
   * ECDH Handshake for establishing encrypted session
   * Returns server's ephemeral public key and establishes shared session key
   */
  app.post("/api/captcha/handshake", handshakeLimiter, async (req: Request, res: Response) => {
    try {
      const clientIP = ipBlocker.getClientIP(req);
      if (ipBlocker.isBlocked(clientIP)) {
        const blockInfo = ipBlocker.getBlockInfo(clientIP);
        const remainingTime = blockInfo ? Math.ceil((blockInfo.expiresAt - Date.now()) / 1000 / 60) : 0;
        
        return res.status(429).json({ 
          error: "IP blocked",
          message: `Your IP has been blocked due to too many failed attempts. Please try again in ${remainingTime} minutes.`,
          remainingTime,
        });
      }

      const { publicKey, clientPublicKey } = req.body;

      if (!publicKey || !clientPublicKey) {
        return res.status(400).json({ 
          error: "Invalid request",
          message: "publicKey and clientPublicKey are required" 
        });
      }

      // Validate API key
      const apiKey = await storage.getApiKeyBySitekey(publicKey);
      if (!apiKey || !apiKey.isActive) {
        return res.status(401).json({ 
          error: "Invalid API key",
          message: "API key is invalid or inactive" 
        });
      }

      // Validate domain (same as challenge endpoint)
      if (!apiKey.domain) {
        return res.status(403).json({ 
          error: "Domain validation failed",
          message: "API key must have a domain restriction configured"
        });
      }

      const origin = req.headers.origin || req.headers.referer;
      if (!origin) {
        return res.status(403).json({ 
          error: "Domain validation failed",
          message: "Origin or Referer header is required"
        });
      }

      const requestDomain = extractDomainFromRequest(req);
      if (!requestDomain) {
        return res.status(403).json({ 
          error: "Domain validation failed",
          message: "Cannot determine request origin"
        });
      }

      if (apiKey.domain !== "*") {
        const allowedDomain = apiKey.domain.replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
        const isMatch = requestDomain === allowedDomain || 
                       requestDomain.endsWith('.' + allowedDomain);
        
        if (!isMatch) {
          return res.status(403).json({ 
            error: "Domain validation failed",
            message: `This API key is restricted to domain: ${allowedDomain}`
          });
        }
      }

      // Get server ephemeral key pair
      const serverKeyPair = sessionCache.getCurrentServerKeyPair();

      // Decode client's public key
      const clientPublicKeyBuffer = Buffer.from(clientPublicKey, 'base64');

      // Perform ECDH to derive shared secret
      const sharedSecret = deriveSharedSecret(
        serverKeyPair.privateKey,
        clientPublicKeyBuffer
      );

      // Generate server nonce for freshness
      const serverNonce = nanoid(32);

      // Derive master session key with binding
      const masterKey = deriveMasterKey(
        sharedSecret,
        serverKeyPair.publicKey,
        serverNonce
      );

      // Generate device fingerprint for session binding
      const deviceFingerprint = generateDeviceFingerprint(req);

      // Store session key
      const sessionKey = {
        masterKey,
        serverPublicKey: serverKeyPair.publicKey,
        clientPublicKey: clientPublicKeyBuffer,
        timestamp: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
        nonce: serverNonce,
      };

      sessionCache.storeSession(
        sessionKey,
        publicKey,
        clientIP,
        deviceFingerprint.id
      );

      // Generate handshake signature for replay protection
      const signature = signHandshakeTranscript(
        serverKeyPair.publicKey,
        clientPublicKeyBuffer,
        apiKey.secretkey,
        sessionKey.timestamp
      );

      // Return handshake response
      const response: HandshakeResponse & { signature: string } = {
        serverPublicKey: serverKeyPair.publicKey.toString('base64'),
        timestamp: sessionKey.timestamp,
        expiresIn: 300, // 5 minutes in seconds
        nonce: serverNonce,
        signature,
      };

      console.log(`[HANDSHAKE] Established session for ${publicKey.substring(0, 12)}... from ${clientIP}`);

      res.json(response);
    } catch (error: any) {
      console.error("[HANDSHAKE] Error:", error);
      res.status(500).json({ 
        error: "Handshake failed",
        message: "Internal server error during key exchange" 
      });
    }
  });

  // Get theme configuration by sitekey (public endpoint for widgets)
  app.get("/api/captcha/config/:sitekey", async (req: Request, res: Response) => {
    try {
      const { sitekey } = req.params;
      
      if (!sitekey) {
        return res.status(400).json({
          error: "Missing sitekey",
          message: "Sitekey parameter is required"
        });
      }

      const apiKey = await storage.getApiKeyBySitekey(sitekey);
      
      if (!apiKey) {
        return res.status(404).json({
          error: "Invalid sitekey",
          message: "No configuration found for this sitekey"
        });
      }

      if (!apiKey.isActive) {
        return res.status(403).json({
          error: "Inactive API key",
          message: "This API key has been deactivated"
        });
      }

      res.json({
        theme: apiKey.theme || 'light',
        domain: apiKey.domain,
      });
    } catch (error: any) {
      console.error("Error fetching captcha config:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to fetch configuration"
      });
    }
  });
  
  // Generate challenge
  app.post("/api/captcha/challenge", challengeLimiter, async (req: Request, res: Response) => {
    try {
      // Decode request body
      let requestBody = req.body;
      if (req.body.data && typeof req.body.data === 'string') {
        try {
          const decodedString = Buffer.from(req.body.data, 'base64').toString('utf-8');
          requestBody = JSON.parse(decodedString);
          console.log('[REQUEST] Decoded request body');
        } catch (decodeError) {
          console.error('[REQUEST] Failed to decode request body:', decodeError);
          return res.status(400).json({ error: "Invalid request format" });
        }
      }
      
      const clientIP = ipBlocker.getClientIP(req);
      
      const isRefresh = requestBody.isRefresh === true;
      
      // Load API key early to access security settings
      const { publicKey } = requestBody;
      if (!publicKey) {
        return res.status(400).json({ error: "Public key is required" });
      }

      const apiKey = await storage.getApiKeyBySitekey(publicKey);
      if (!apiKey || !apiKey.isActive) {
        return res.status(401).json({ error: "Invalid or inactive API key" });
      }

      // Load security settings for this API key
      // CRITICAL SECURITY: Settings are loaded SERVER-SIDE ONLY from database
      // Client CANNOT manipulate or override these settings - they are strictly enforced server-side
      // Domain validation and encryption are ALWAYS enforced regardless of settings
      const settings = (apiKey.settings as SecuritySettings | null) || DEFAULT_SECURITY_SETTINGS;
      console.log(`[SETTINGS] Security settings for ${apiKey.name}: difficulty=${settings.proofOfWorkDifficulty}, fingerprinting=${settings.advancedFingerprinting}`);
      
      // FIXED: Check IP and country blocking
      const geoData = await getGeolocationFromIP(clientIP);
      const blockCheck = ipBlocker.checkSecurityBlocking(clientIP, geoData.country, settings);
      
      if (blockCheck.blocked) {
        console.log(`[SECURITY] Blocked request from IP ${clientIP} / Country ${geoData.country}: ${blockCheck.reason}`);
        return res.status(403).json({
          error: "Access denied",
          message: blockCheck.reason
        });
      }
      
      // Custom rate limiting based on API key settings (if enabled)
      if (settings.ipRateLimiting) {
        const rateLimitKey = `ratelimit:challenge:${clientIP}`;
        const requestCount = (req as any).rateLimit?.current || 0;
        const windowMs = settings.rateLimitWindowMs || 60000;
        const maxRequests = settings.rateLimitMaxRequests || 30;
        
        if (requestCount > maxRequests) {
          return res.status(429).json({
            error: "Rate limit exceeded",
            message: `Too many challenge requests. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`
          });
        }
      }
      
      if (ipBlocker.isBlocked(clientIP)) {
        const blockInfo = ipBlocker.getBlockInfo(clientIP);
        const remainingTime = blockInfo ? Math.ceil((blockInfo.expiresAt - Date.now()) / 1000 / 60) : 0;
        
        return res.status(429).json({ 
          error: "IP blocked",
          message: blockInfo?.reason || `Your IP has been blocked. Please try again in ${remainingTime} minutes.`,
          remainingTime,
          blockExpiresAt: blockInfo?.expiresAt,
        });
      }
      
      if (isRefresh && settings.ipRateLimiting) {
        ipBlocker.recordRefreshClick(clientIP);
        
        if (ipBlocker.isBlocked(clientIP)) {
          const blockInfo = ipBlocker.getBlockInfo(clientIP);
          const remainingTime = blockInfo ? Math.ceil((blockInfo.expiresAt - Date.now()) / 1000 / 60) : 0;
          
          return res.status(429).json({ 
            error: "IP blocked",
            message: blockInfo?.reason || `Your IP has been blocked. Please try again in ${remainingTime} minutes.`,
            remainingTime,
            blockExpiresAt: blockInfo?.expiresAt,
          });
        }
      }

      const automationCheck = settings.automationDetection ? detectAutomation(req) : { isAutomation: false, score: 0, detectedBy: [] };
      const deviceFingerprint = generateDeviceFingerprint(req);
      const behavioralPattern = settings.behavioralAnalysis ? analyzeBehavior(req) : { confidence: 0, isBot: false, patterns: [] };
      
      const advancedFingerprintData = requestBody.advancedFingerprint;
      let advancedFingerprint: AdvancedFingerprint | undefined;
      if (settings.advancedFingerprinting && advancedFingerprintData && typeof advancedFingerprintData === 'object') {
        const maxPayloadSize = 10000;
        const payloadStr = JSON.stringify(advancedFingerprintData);
        
        if (payloadStr.length > maxPayloadSize) {
          console.log(`[SECURITY] Rejected oversized advanced fingerprint payload: ${payloadStr.length} bytes`);
          ipBlocker.recordFailedAttempt(clientIP);
          return res.status(400).json({ 
            error: "Invalid request",
            message: "Request payload too large"
          });
        }
        
        const allowedKeys = ['canvasHash', 'webglHash', 'audioHash', 'fonts', 'screenFingerprint', 
                            'plugins', 'timezone', 'platform', 'hardwareConcurrency', 
                            'deviceMemory', 'colorDepth', 'pixelRatio'];
        
        const hasInvalidKeys = Object.keys(advancedFingerprintData).some(
          key => !allowedKeys.includes(key)
        );
        
        if (hasInvalidKeys) {
          console.log(`[SECURITY] Rejected advanced fingerprint with invalid keys`);
          ipBlocker.recordFailedAttempt(clientIP);
          return res.status(400).json({ 
            error: "Invalid request",
            message: "Invalid fingerprint data"
          });
        }
        
        advancedFingerprint = generateAdvancedFingerprint(advancedFingerprintData);
        console.log(`[SECURITY] Advanced fingerprint collected (confidence: ${advancedFingerprint.confidence}%)`);
      }
      
      const honeypotCheck = checkEnhancedHoneypot(req, ENHANCED_HONEYPOT_CONFIG);
      if (honeypotCheck.shouldBlock) {
        console.log(`[HONEYPOT] Bot detected: ${honeypotCheck.details.join(', ')}`);
        ipBlocker.recordFailedAttempt(clientIP);
        return res.status(403).json({ 
          error: "Security check failed",
          message: "Suspicious activity detected"
        });
      }
      
      trackDeviceFingerprint(deviceFingerprint);

      const ipFailures = ipBlocker.getFailureCount(clientIP);
      const baseRiskScore = calculateRiskScore(
        req,
        automationCheck,
        deviceFingerprint,
        0,
        ipFailures
      );
      
      const totalRiskScore = Math.min(
        baseRiskScore.riskScore + 
        honeypotCheck.riskScore + 
        (advancedFingerprint && !advancedFingerprint.isReliable ? 10 : 0),
        100
      );
      
      const riskAssessment = {
        ...baseRiskScore,
        riskScore: totalRiskScore,
        riskLevel: totalRiskScore > 70 ? 'critical' as const :
                   totalRiskScore > 50 ? 'high' as const :
                   totalRiskScore > 30 ? 'medium' as const :
                   'low' as const
      };

      securityMonitor.logEvent({
        type: "challenge_request",
        ip: clientIP,
        riskLevel: riskAssessment.riskLevel,
        riskScore: riskAssessment.riskScore,
        details: {
          automationScore: automationCheck.score,
          deviceScore: deviceFingerprint.score,
          behavioralScore: behavioralPattern.confidence,
        },
      });

      console.log(`[SECURITY] Challenge request from ${clientIP}: Risk=${riskAssessment.riskLevel} (${riskAssessment.riskScore}), Automation=${automationCheck.score}, Device=${deviceFingerprint.score}, Behavioral=${behavioralPattern.confidence}`);
      
      if (riskAssessment.riskLevel === "critical" || automationCheck.isAutomation || behavioralPattern.isBot) {
        console.log("High-confidence threat detected, blocking request");
        ipBlocker.recordFailedAttempt(clientIP);
        securityMonitor.logEvent({
          type: "threat_blocked",
          ip: clientIP,
          riskLevel: riskAssessment.riskLevel,
          riskScore: riskAssessment.riskScore,
          details: {
            reasons: [...automationCheck.detectedBy, ...deviceFingerprint.signals, ...behavioralPattern.patterns],
          },
        });
        return res.status(403).json({ 
          error: "Security check failed",
          message: "Please use a real browser to access this service"
        });
      }

      const { type, encryptedClientData, requestNonce, protocol: encryptionProtocol } = requestBody;

      // SECURITY: Decrypt client data if encrypted
      let clientDetections: any;
      let fingerprintData: any = {};
      let behavioralData: any = {};
      let isEncrypted = false;

      if (encryptionProtocol === 'encrypted-v1' && encryptedClientData && requestNonce) {
        console.log('[ENCRYPTION] Received encrypted client data, attempting to decrypt...');
        
        // Get session key from cache using API publicKey + client IP + device fingerprint ID
        const sessionKey = sessionCache.getSession(publicKey, clientIP, deviceFingerprint.id);
        
        if (!sessionKey || !sessionKey.masterKey) {
          console.warn('[ENCRYPTION] No valid session found for decryption');
          return res.status(409).json({
            error: "Session expired",
            message: "Encryption session has expired, please refresh and try again"
          });
        }
        
        try {
          // Decrypt client data using session key and requestNonce as challengeId
          const decrypted = await decryptSolutionData(
            encryptedClientData,
            sessionKey,
            requestNonce
          );
          
          if (decrypted) {
            console.log('[ENCRYPTION] Client data decrypted successfully');
            clientDetections = decrypted.clientDetections;
            fingerprintData = decrypted.fingerprint || {};
            behavioralData = decrypted.behavioral || {};
            isEncrypted = true;
          } else {
            console.error('[ENCRYPTION] Decryption failed - invalid payload or key');
            ipBlocker.recordFailedAttempt(clientIP);
            return res.status(400).json({
              error: "Decryption failed",
              message: "Unable to decrypt client data"
            });
          }
        } catch (decryptError) {
          console.error('[ENCRYPTION] Decryption error:', decryptError);
          ipBlocker.recordFailedAttempt(clientIP);
          return res.status(400).json({
            error: "Decryption error",
            message: "Failed to decrypt client data"
          });
        }
      } else {
        // Fallback to plaintext (for browsers without encryption support)
        console.log('[ENCRYPTION] Using plaintext client data (fallback mode)');
        clientDetections = requestBody.clientDetections;
        
        // Collect fingerprint data from individual fields
        fingerprintData = {
          canvasHash: requestBody.canvasHash,
          webglHash: requestBody.webglHash,
          audioHash: requestBody.audioHash,
          fonts: requestBody.fonts,
          screenFingerprint: requestBody.screenFingerprint,
          plugins: requestBody.plugins,
          timezone: requestBody.timezone,
          platform: requestBody.platform,
          hardwareConcurrency: requestBody.hardwareConcurrency,
          deviceMemory: requestBody.deviceMemory,
          colorDepth: requestBody.colorDepth,
          pixelRatio: requestBody.pixelRatio,
        };
        
        behavioralData = {
          mouseMovements: requestBody.mouseMovements,
          keyboardEvents: requestBody.keyboardEvents,
          submissionTime: requestBody.submissionTime,
        };
        
        isEncrypted = false;
      }

      // Log encryption status for security audit (using existing event type)
      if (!isEncrypted) {
        securityMonitor.logEvent({
          type: "challenge_request",
          ip: clientIP,
          riskLevel: "medium",
          riskScore: 10,
          details: {
            encrypted: false,
            protocol: 'plaintext',
            warning: 'Unencrypted client data transmission'
          }
        });
      }

      // Log client-side detections but don't block unless high confidence
      if (clientDetections && Array.isArray(clientDetections) && clientDetections.length > 0) {
        console.log("Client-side automation signals detected:", clientDetections);
        
        // Only block for high-confidence automation signals
        const highConfidenceSignals = ['webdriver', 'webdriver-attribute', 'missing-storage'];
        const hasHighConfidence = clientDetections.some((signal: string) => 
          highConfidenceSignals.includes(signal)
        );
        
        if (hasHighConfidence) {
          ipBlocker.recordFailedAttempt(clientIP);
          return res.status(403).json({ 
            error: "Automation detected",
            message: "Automation tools are not allowed"
          });
        }
      }

      // CRITICAL: ALWAYS enforce domain validation for security
      // Every API key MUST have a domain restriction
      if (!apiKey.domain) {
        return res.status(403).json({ 
          error: "Domain validation failed",
          message: "API key must have a domain restriction configured"
        });
      }

      const origin = req.headers.origin || req.headers.referer;
      if (!origin) {
        return res.status(403).json({ 
          error: "Domain validation failed",
          message: "Origin or Referer header is required"
        });
      }

      // SECURITY: Extract and validate domain from request
      // This will be saved server-side to prevent header spoofing
      const requestDomain = extractDomainFromRequest(req);
      if (!requestDomain) {
        return res.status(403).json({ 
          error: "Domain validation failed",
          message: "Cannot determine request origin"
        });
      }

      // Check if wildcard domain (for demo purposes)
      if (apiKey.domain !== "*") {
        const allowedDomain = apiKey.domain.replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
        
        // Check if domains match (exact match or subdomain)
        const isMatch = requestDomain === allowedDomain || 
                       requestDomain.endsWith('.' + allowedDomain);
        
        if (!isMatch) {
          return res.status(403).json({ 
            error: "Domain validation failed",
            message: `This API key is restricted to domain: ${allowedDomain}. Request from: ${requestDomain}`
          });
        }
      }

      // Determine challenge type - use only types enabled in settings
      const enabledTypes = settings.enabledChallengeTypes;
      let challengeType: string;
      
      if (!type || type === "random") {
        // Random selection from enabled types only
        challengeType = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
      } else if (enabledTypes.includes(type as any)) {
        challengeType = type;
      } else {
        return res.status(400).json({ 
          error: "Invalid challenge type",
          message: `This API key only supports: ${enabledTypes.join(', ')}`
        });
      }

      // Generate challenge based on type with difficulty from settings
      let challengeData: any;
      let baseDifficulty: number;
      let difficulty: number;

      // Use configured proof-of-work difficulty as base
      baseDifficulty = settings.proofOfWorkDifficulty;
      
      // Apply risk-based adaptive difficulty only if enabled in settings
      if (settings.riskAdaptiveDifficulty) {
        difficulty = calculateAdaptiveDifficulty(baseDifficulty, riskAssessment);
      } else {
        difficulty = baseDifficulty;
      }

      if (challengeType === "grid") {
        const gridSize = Math.random() < 0.5 ? 3 : 4;
        const totalCells = gridSize * gridSize;
        
        const emojiOptions = ["🍎", "🍊", "🍋", "🍌", "🍇", "🍓", "🍒", "🍑", "🥝", "🥥", "🍍", "🥭", "🍈", "🍉", "🫐", "🍏"];
        
        const targetEmoji = emojiOptions[Math.floor(Math.random() * emojiOptions.length)];
        const otherEmojis = emojiOptions.filter(e => e !== targetEmoji);
        
        const numTargetCells = gridSize === 3 ? (Math.random() < 0.5 ? 2 : 3) : (Math.random() < 0.5 ? 3 : 4);
        
        const gridEmojis: string[] = [];
        const correctCells: number[] = [];
        
        const targetPositions = new Set<number>();
        while (targetPositions.size < numTargetCells) {
          targetPositions.add(Math.floor(Math.random() * totalCells));
        }
        
        for (let i = 0; i < totalCells; i++) {
          if (targetPositions.has(i)) {
            gridEmojis.push(targetEmoji);
            correctCells.push(i);
          } else {
            gridEmojis.push(otherEmojis[Math.floor(Math.random() * otherEmojis.length)]);
          }
        }
        
        challengeData = {
          ...generateChallenge(difficulty),
          gridSize,
          gridEmojis,
          targetEmojis: [targetEmoji],
          correctCells: correctCells.sort((a, b) => a - b),
        };
      } else if (challengeType === "jigsaw") {
        const pieces = [0, 1, 2, 3];
        const shuffled = [...pieces].sort(() => Math.random() - 0.5);
        challengeData = {
          ...generateChallenge(difficulty),
          pieces: shuffled,
          correctOrder: pieces,
        };
      } else if (challengeType === "gesture") {
        
        // Generate random target position (x, y coordinates)
        // Grid size defines the bounds for the draggable area
        const gridWidth = 300;
        const gridHeight = 300;
        
        // Target position with some padding from edges
        const padding = 40;
        const targetX = Math.floor(Math.random() * (gridWidth - padding * 2)) + padding;
        const targetY = Math.floor(Math.random() * (gridHeight - padding * 2)) + padding;
        
        // Tolerance for matching (in pixels) - adjust based on difficulty
        const tolerance = 15;
        
        // Generate puzzle piece seed for deterministic shape
        const puzzleSeed = Math.floor(Math.random() * 10000);
        
        // Random image from Lorem Picsum (free, no API key, high quality)
        const imageSeed = Math.floor(Math.random() * 1000);
        const puzzleImageUrl = `https://picsum.photos/seed/${imageSeed}/400/400`;
        
        challengeData = {
          ...generateChallenge(difficulty),
          gridSize: { width: gridWidth, height: gridHeight },
          target: { x: targetX, y: targetY },
          tolerance,
          puzzleSeed,
          puzzleImageUrl,
        };
      } else if (challengeType === "upside_down") {
        
        const upsideDownData = generateUpsideDownChallenge();
        
        // Get server origin to convert relative paths to absolute URLs
        const serverOrigin = getServerOrigin(req);
        
        // Convert relative paths to absolute URLs for external website access
        const BACKGROUND_PATHS = [
          '/assets/stock_images/floral_pattern_green_a3b1b488.jpg',
          '/assets/stock_images/floral_pattern_green_7eb03bb9.jpg',
        ];
        
        challengeData = {
          ...generateChallenge(difficulty),
          ...upsideDownData,
          backgroundUrl: new URL(BACKGROUND_PATHS[upsideDownData.backgroundIndex], serverOrigin).toString(),
          animals: upsideDownData.animals.map(a => ({
            ...a,
            path: new URL(a.path, serverOrigin).toString(),
          })),
        };
      } else {
        difficulty = calculateAdaptiveDifficulty(baseDifficulty, riskAssessment);
        challengeData = generateChallenge(difficulty);
      }

      console.log(`[SECURITY] Generated ${challengeType} challenge with adaptive difficulty: ${difficulty} (base: ${baseDifficulty}, risk: ${riskAssessment.riskLevel})`);

      // Create JWT token WITHOUT sensitive data (correctCells, correctOrder)
      // Only include non-sensitive challenge data needed for client-side display
      const clientChallengeData = { ...challengeData };
      delete clientChallengeData.correctCells;
      delete clientChallengeData.correctOrder;
      // For gesture challenges, keep target for UI visualization (user needs to see where to drag)
      // For grid/jigsaw, delete target/correctCells as those are the answers
      if (challengeType !== "gesture") {
        delete clientChallengeData.target;
      }
      // For upside_down challenges, do NOT send rotation data in plaintext mode
      // Rotation will be added later ONLY in encrypted payload
      // This prevents bots from reading which animals are upside-down
      if (challengeType === "upside_down") {
        // Send animal positions, types, and paths, but NOT rotation
        // Rotation will be added in encrypted payload only
        clientChallengeData.animals = (challengeData.animals as any[]).map(a => ({
          id: a.id,
          x: a.x,
          y: a.y,
          animalType: a.animalType,
          path: a.path,
          // No rotation field here - will be added in encrypted mode only
        }));
      }
      // gridEmojis and targetEmoji are safe to send - they're needed for display
      // but correctCells and correctOrder (the answers) must stay in database only

      const token = jwt.sign(
        {
          challengeData: clientChallengeData,
          type: challengeType,
          apiKeyId: apiKey.id,
        },
        JWT_SECRET,
        { expiresIn: `${Math.ceil(settings.challengeTimeoutMs / 1000)}s` }
      );

      // SECURITY: Generate HMAC signature to bind challenge to validated domain
      // This prevents replay attacks and ensures challenge is only valid for the original domain
      const signature = generateChallengeSignature(token, requestDomain, apiKey.secretkey);

      // SECURITY: Generate session fingerprint untuk bind challenge ke session
      const sessionFp = generateSessionFingerprint(req);
      console.log(`[SECURITY] Challenge created with session fingerprint (confidence: ${sessionFp.confidence}%)`);
      
      // SECURITY: Store advanced fingerprint if available
      let advancedFpHash: string | undefined;
      if (advancedFingerprint) {
        advancedFpHash = advancedFingerprint.hash;
        console.log(`[SECURITY] Challenge bound to advanced fingerprint`);
      }

      // Save full challenge data (including correct answers) in database
      // Use timeout from settings instead of hardcoded value
      const expiresAt = new Date(Date.now() + settings.challengeTimeoutMs);
      await storage.createChallenge({
        token,
        difficulty,
        challengeData, // Store complete data with correct answers in DB
        type: challengeType,
        apiKeyId: apiKey.id,
        validatedDomain: requestDomain, // SECURITY: Store validated domain server-side
        signature, // SECURITY: HMAC signature to prevent tampering
        sessionFingerprint: sessionFp.hash, // SECURITY: Session binding to prevent token stealing
        isUsed: false,
        expiresAt,
      });

      // ENCRYPTION: Server-side encryption support determination
      // SECURITY: Server determines encryption based on session existence ONLY
      // Client cannot manipulate this - if session exists, encryption is MANDATORY
      const sessionKey = sessionCache.getSession(
        publicKey,
        clientIP,
        deviceFingerprint.id
      );

      let encryptedChallenge: EncryptedPayload | undefined;
      let protocol: string;

      // CRITICAL: upside_down challenges REQUIRE encryption to prevent answer leakage
      if (challengeType === "upside_down" && !sessionKey) {
        console.error("[UPSIDE_DOWN] Encryption required but no session found");
        return res.status(400).json({
          error: "Encryption required",
          message: "Upside-down challenges require encryption. Please refresh and try again."
        });
      }

      if (sessionKey) {
        // Session exists - encryption is MANDATORY
        // This prevents downgrade attacks - client cannot request plaintext
        console.log(`[ENCRYPTION] Session found for ${publicKey.substring(0, 12)}... - encryption enforced`);
        
        // For upside_down, include rotation in encrypted data
        let dataToEncrypt = clientChallengeData;
        if (challengeType === "upside_down") {
          dataToEncrypt = {
            ...clientChallengeData,
            animals: (challengeData.animals as any[]).map(a => ({
              id: a.id,
              x: a.x,
              y: a.y,
              animalType: a.animalType,
              path: a.path,
              rotation: a.orientation === 'upside_down' ? 180 : 0,
            }))
          };
        }
        
        // Encrypt challenge data
        try {
          encryptedChallenge = encryptChallengeData(
            dataToEncrypt,
            sessionKey,
            token // Use token as challenge ID for key derivation
          );
          
          protocol = "encrypted-v1";
          console.log(`[ENCRYPTION] Challenge data encrypted successfully`);
        } catch (error) {
          console.error("[ENCRYPTION] Failed to encrypt challenge:", error);
          return res.status(500).json({ 
            error: "Encryption failed",
            message: "Cannot encrypt challenge data"
          });
        }
      } else {
        // No session - use plaintext (legacy/transition mode or encryption not available)
        protocol = "plaintext";
        console.log(`[ENCRYPTION] No session found, using plaintext mode`);
      }

      // SECURITY: Prepare security configuration
      const securityConfig = {
        antiDebugger: settings.antiDebugger,
        challengeTimeoutMs: settings.challengeTimeoutMs,
        tokenExpiryMs: settings.tokenExpiryMs,
        advancedFingerprinting: settings.advancedFingerprinting,
        // Note: Domain validation and encryption are ALWAYS enforced server-side
        // and cannot be disabled regardless of these client settings
      };

      // Send to client WITHOUT correct answers
      const response: any = {
        token,
        type: challengeType,
        expiresAt,
        protocol,
      };

      // CRITICAL SECURITY: Encrypt securityConfig to prevent client-side manipulation
      // This prevents attackers from:
      // - Disabling anti-debugger protection
      // - Extending timeouts to bypass time-based defenses
      // - Turning off fingerprinting to avoid detection
      if (sessionKey) {
        // Session exists - encrypt security config (MANDATORY)
        try {
          const encryptedConfig = encryptSecurityConfig(
            securityConfig,
            sessionKey,
            token // Use token as challenge ID for key derivation
          );
          response.encryptedSecurityConfig = encryptedConfig;
          console.log(`[ENCRYPTION] Security config encrypted successfully`);
        } catch (error) {
          console.error("[ENCRYPTION] Failed to encrypt security config:", error);
          return res.status(500).json({ 
            error: "Encryption failed",
            message: "Cannot encrypt security configuration"
          });
        }
      } else {
        // No session - CRITICAL: Do not send sensitive security config in plaintext
        // Send minimal safe defaults only - actual enforcement is always server-side
        response.securityConfig = {
          challengeTimeoutMs: 60000, // Safe default timeout
          tokenExpiryMs: 60000, // Safe default expiry
          // Do NOT send antiDebugger or advancedFingerprinting flags in plaintext
          // These could be manipulated by attackers
        };
        console.warn(`[SECURITY] No session - sending minimal security config (server enforcement still active)`);
      }

      if (encryptedChallenge) {
        response.encrypted = encryptedChallenge;
      } else {
        response.challenge = clientChallengeData;
      }

      // OBFUSCATION: Add base64 encoding layer to hide response structure
      // This prevents casual inspection of response format in network tab
      // and adds an additional layer of obfuscation for security
      const jsonString = JSON.stringify(response);
      const base64Encoded = Buffer.from(jsonString, 'utf-8').toString('base64');
      
      console.log(`[OBFUSCATION] Response encoded (${jsonString.length} -> ${base64Encoded.length} bytes)`);
      
      // Send base64-encoded response
      res.json({
        data: base64Encoded
      });
    } catch (error) {
      console.error("Challenge generation error:", error);
      res.status(500).json({ error: "Failed to generate challenge" });
    }
  });

  // Verify solution
  app.post("/api/captcha/verify", verifyLimiter, async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const clientIP = ipBlocker.getClientIP(req);
      if (ipBlocker.isBlocked(clientIP)) {
        const blockInfo = ipBlocker.getBlockInfo(clientIP);
        const remainingTime = blockInfo ? Math.ceil((blockInfo.expiresAt - Date.now()) / 1000 / 60) : 0;
        
        return res.status(429).json({ 
          success: false,
          error: "IP blocked",
          message: `Your IP has been blocked due to too many failed attempts. Please try again in ${remainingTime} minutes.`,
          remainingTime,
        });
      }

      // Note: We'll load settings after getting the API key from token
      // For now, run basic checks - will be conditionally applied later
      const deviceFingerprint = generateDeviceFingerprint(req);
      
      trackDeviceFingerprint(deviceFingerprint);

      const { token, solution, encrypted, encryptedMetadata, clientDetections, publicKey } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Token is required",
        });
      }

      // ENCRYPTION: Decrypt solution if encrypted
      let decryptedSolution: any;
      
      if (encrypted) {
        // Solution is encrypted - must decrypt it
        if (!publicKey) {
          return res.status(400).json({
            success: false,
            error: "publicKey required for encrypted solution",
          });
        }

        // Get session key
        const sessionKey = sessionCache.getSession(
          publicKey,
          clientIP,
          deviceFingerprint.id
        );

        if (!sessionKey) {
          console.error("[ENCRYPTION] No valid session for encrypted solution");
          return res.status(403).json({
            success: false,
            error: "Invalid session",
            message: "Cannot decrypt solution - session expired or invalid",
          });
        }

        // Decrypt solution
        const decrypted = decryptSolutionData(
          encrypted,
          sessionKey,
          token // Use token as challenge ID
        );

        if (!decrypted) {
          console.error("[ENCRYPTION] Failed to decrypt solution");
          ipBlocker.recordFailedAttempt(clientIP);
          return res.status(400).json({
            success: false,
            error: "Decryption failed",
            message: "Cannot decrypt solution - invalid ciphertext or tampered data",
          });
        }

        decryptedSolution = decrypted;
        console.log(`[ENCRYPTION] Solution decrypted successfully`);
      } else {
        // Plaintext solution (legacy/transition mode)
        if (!solution) {
          return res.status(400).json({
            success: false,
            error: "Solution is required",
          });
        }
        decryptedSolution = solution;
      }

      // Use decryptedSolution for the rest of the verification logic
      const solutionToVerify = decryptedSolution;

      // ENCRYPTION: Decrypt verification metadata if encrypted
      let verificationMetadata: any = {};
      
      if (encryptedMetadata) {
        if (!publicKey) {
          return res.status(400).json({
            success: false,
            error: "publicKey required for encrypted metadata",
          });
        }

        const sessionKey = sessionCache.getSession(
          publicKey,
          clientIP,
          deviceFingerprint.id
        );

        if (!sessionKey) {
          console.error("[ENCRYPTION] No valid session for encrypted metadata");
          return res.status(403).json({
            success: false,
            error: "Invalid session",
            message: "Cannot decrypt metadata - session expired or invalid",
          });
        }

        // Decrypt metadata
        const decryptedMetadata = decryptVerificationMetadata(
          encryptedMetadata,
          sessionKey,
          token
        );

        if (!decryptedMetadata) {
          console.error("[ENCRYPTION] Failed to decrypt verification metadata");
          ipBlocker.recordFailedAttempt(clientIP);
          return res.status(400).json({
            success: false,
            error: "Metadata decryption failed",
            message: "Cannot decrypt metadata - invalid ciphertext or tampered data",
          });
        }

        verificationMetadata = decryptedMetadata;
        console.log(`[ENCRYPTION] Verification metadata decrypted successfully`);
      } else {
        // Plaintext metadata (legacy/transition mode)
        verificationMetadata = {
          clientDetections: req.body.clientDetections,
          canvasHash: req.body.canvasHash,
          webglHash: req.body.webglHash,
          audioHash: req.body.audioHash,
          fonts: req.body.fonts,
          screenFingerprint: req.body.screenFingerprint,
          plugins: req.body.plugins,
          timezone: req.body.timezone,
          platform: req.body.platform,
          hardwareConcurrency: req.body.hardwareConcurrency,
          deviceMemory: req.body.deviceMemory,
          colorDepth: req.body.colorDepth,
          pixelRatio: req.body.pixelRatio,
          mouseMovements: req.body.mouseMovements,
          keyboardEvents: req.body.keyboardEvents,
          submissionTime: req.body.submissionTime
        };
      }

      // Assign behavioral data back to req.body so analyzeBehavior can read it
      req.body.mouseMovements = verificationMetadata.mouseMovements;
      req.body.keyboardEvents = verificationMetadata.keyboardEvents;
      req.body.submissionTime = verificationMetadata.submissionTime;

      // This section moved after API key loading - will be updated later

      // Log client-side detections but don't block unless high confidence
      const clientDetectionsToCheck = verificationMetadata.clientDetections;
      if (clientDetectionsToCheck && Array.isArray(clientDetectionsToCheck) && clientDetectionsToCheck.length > 0) {
        console.log("Client-side automation signals during verification:", clientDetectionsToCheck);
        
        // Only block for high-confidence automation signals
        const highConfidenceSignals = ['webdriver', 'webdriver-attribute', 'missing-storage'];
        const hasHighConfidence = clientDetectionsToCheck.some((signal: string) => 
          highConfidenceSignals.includes(signal)
        );
        
        if (hasHighConfidence) {
          ipBlocker.recordFailedAttempt(clientIP);
          return res.json({
            success: false,
            error: "Automation detected",
          });
        }
      }

      // Verify JWT token and extract API key info
      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.json({
          success: false,
          error: "Invalid or expired token",
        });
      }

      // Check if challenge exists and not used
      const challenge = await storage.getChallengeByToken(token);
      if (!challenge) {
        return res.json({
          success: false,
          error: "Challenge not found",
        });
      }

      // Get API key from the decoded token
      const apiKey = await storage.getApiKey(decoded.apiKeyId);
      if (!apiKey || !apiKey.isActive) {
        return res.status(401).json({
          success: false,
          error: "Invalid or inactive API key",
        });
      }

      // Load security settings for this API key
      // CRITICAL SECURITY: Settings are loaded SERVER-SIDE ONLY from database
      // Client CANNOT manipulate or override these settings
      const settings = (apiKey.settings as SecuritySettings | null) || DEFAULT_SECURITY_SETTINGS;

      // FIXED: Check IP and country blocking
      const geoData = await getGeolocationFromIP(clientIP);
      const blockCheck = ipBlocker.checkSecurityBlocking(clientIP, geoData.country, settings);
      
      if (blockCheck.blocked) {
        console.log(`[SECURITY] Blocked verification from IP ${clientIP} / Country ${geoData.country}: ${blockCheck.reason}`);
        return res.json({
          success: false,
          error: "Access denied",
          message: blockCheck.reason
        });
      }

      // Perform conditional security checks based on settings
      const automationCheck = settings.automationDetection ? detectAutomation(req) : { isAutomation: false, score: 0, detectedBy: [] };
      const behavioralPattern = settings.behavioralAnalysis ? analyzeBehavior(req) : { confidence: 0, isBot: false, patterns: [] };

      const ipFailures = ipBlocker.getFailureCount(clientIP);
      const riskAssessment = calculateRiskScore(
        req,
        automationCheck,
        deviceFingerprint,
        0,
        ipFailures
      );

      console.log(`[SECURITY] Verification from ${clientIP}: Risk=${riskAssessment.riskLevel} (${riskAssessment.riskScore})`);
      
      if (riskAssessment.riskLevel === "critical" || automationCheck.isAutomation || behavioralPattern.isBot) {
        console.log("High-confidence threat detected during verification");
        ipBlocker.recordFailedAttempt(clientIP);
        
        return res.json({
          success: false,
          error: "Security check failed",
          message: "Please use a real browser to access this service"
        });
      }

      // SECURITY: Verify HMAC signature to prevent tampering
      // This ensures the challenge token hasn't been modified and is bound to the original domain
      const isSignatureValid = verifyChallengeSignature(
        token,
        challenge.validatedDomain,
        apiKey.secretkey,
        challenge.signature
      );
      
      if (!isSignatureValid) {
        ipBlocker.recordFailedAttempt(clientIP);
        return res.json({
          success: false,
          error: "Security validation failed",
          message: "Challenge signature is invalid"
        });
      }

      // SECURITY: Verify session fingerprint binding (only if enabled in settings)
      // This prevents token stealing across different devices/browsers
      if (settings.sessionBinding && challenge.sessionFingerprint) {
        const bindingCheck = verifySessionBinding(
          challenge.sessionFingerprint,
          req,
          DEFAULT_SESSION_BINDING_CONFIG
        );
        
        if (!bindingCheck.isValid) {
          console.log(`[SECURITY] Session fingerprint mismatch in verification: ${bindingCheck.reason}`);
          ipBlocker.recordFailedAttempt(clientIP);
          
          securityMonitor.logEvent({
            type: "verification_failure",
            ip: clientIP,
            riskLevel: "high",
            riskScore: 80,
            details: {
              reason: "session_fingerprint_mismatch",
              similarity: bindingCheck.similarity,
            },
          });
          
          return res.json({
            success: false,
            error: "Session validation failed",
            message: "Challenge cannot be verified from this session"
          });
        }
        
        console.log(`[SECURITY] Session fingerprint verified (similarity: ${bindingCheck.similarity?.toFixed(2)})`);
      }

      // SECURITY: Re-validate domain from SERVER-SIDE data
      // We use the validatedDomain that was saved when challenge was created
      // This prevents header spoofing attacks (client can't fake Origin/Referer)
      const requestDomain = extractDomainFromRequest(req);
      if (!requestDomain || requestDomain !== challenge.validatedDomain) {
        ipBlocker.recordFailedAttempt(clientIP);
        return res.json({
          success: false,
          error: "Domain validation failed",
          message: `Challenge was issued for domain: ${challenge.validatedDomain}. Current request from: ${requestDomain || 'unknown'}`
        });
      }

      if (challenge.isUsed || isChallengeUsed(token)) {
        console.log(`[SECURITY] Replay attack attempt detected: Challenge ${token.substring(0, 20)}... already used`);
        ipBlocker.recordFailedAttempt(clientIP);
        securityMonitor.logEvent({
          type: "replay_attack",
          ip: clientIP,
          details: { token: token.substring(0, 30) },
        });
        return res.json({
          success: false,
          error: "Challenge already used",
        });
      }

      const expirationCheck = checkChallengeExpiration(challenge.createdAt, DEFAULT_EXPIRATION_CONFIG);
      if (!expirationCheck.isValid) {
        return res.json({
          success: false,
          error: "Challenge expired",
          message: expirationCheck.message,
        });
      }

      // Verify based on challenge type
      // IMPORTANT: Get correct answers from database, NOT from JWT token
      // This prevents attackers from decoding the JWT to see the answers
      let isValid = false;
      
      if (challenge.type === "grid") {
        // Grid challenge: verify selected cells match correct cells from DATABASE
        // SECURITY: Also verify proof-of-work to prevent ML-based automated solvers
        try {
          const submission = JSON.parse(solutionToVerify);
          
          // Visual challenges send {answer: [...], powSolution: "..."}
          const selectedCells = submission.answer || submission;
          const powSolution = submission.powSolution;
          const correctCells = (challenge.challengeData as any).correctCells;
          
          if (!correctCells || !Array.isArray(correctCells)) {
            throw new Error("Invalid challenge data");
          }
          
          const selectedSet = new Set(selectedCells);
          const correctSet = new Set(correctCells);
          
          // First verify the visual puzzle answer
          isValid = 
            selectedCells.length === correctCells.length &&
            selectedSet.size === correctSet.size &&
            correctCells.every((cell: number) => selectedSet.has(cell));
          
          console.log(`[GRID] Verification: selected=${JSON.stringify(selectedCells)}, correct=${JSON.stringify(correctCells)}, puzzleValid=${isValid}`);
          
          // Then verify proof-of-work to add computational cost for bots
          if (isValid && powSolution) {
            const powValid = verifyProofOfWork(challenge.challengeData, powSolution);
            if (!powValid) {
              console.log(`[GRID] Proof-of-work verification failed`);
              isValid = false;
            }
          } else if (isValid && !powSolution) {
            // PoW is required for defense-in-depth
            console.log(`[GRID] Missing proof-of-work solution`);
            isValid = false;
          }
        } catch (e) {
          console.error("Grid verification error:", e);
          isValid = false;
        }
      } else if (challenge.type === "jigsaw") {
        // Jigsaw challenge: verify piece order from DATABASE
        // SECURITY: Also verify proof-of-work to prevent ML-based automated solvers
        try {
          const submission = JSON.parse(solutionToVerify);
          
          // Visual challenges send {answer: [...], powSolution: "..."}
          const pieceOrder = submission.answer || submission;
          const powSolution = submission.powSolution;
          const correctOrder = (challenge.challengeData as any).correctOrder;
          
          if (!correctOrder) {
            throw new Error("Invalid challenge data");
          }
          
          // First verify the visual puzzle answer
          isValid = 
            pieceOrder.length === correctOrder.length &&
            pieceOrder.every((piece: number, idx: number) => piece === correctOrder[idx]);
          
          console.log(`[JIGSAW] Verification: puzzleValid=${isValid}`);
          
          // Then verify proof-of-work to add computational cost for bots
          if (isValid && powSolution) {
            const powValid = verifyProofOfWork(challenge.challengeData, powSolution);
            if (!powValid) {
              console.log(`[JIGSAW] Proof-of-work verification failed`);
              isValid = false;
            }
          } else if (isValid && !powSolution) {
            // PoW is required for defense-in-depth
            console.log(`[JIGSAW] Missing proof-of-work solution`);
            isValid = false;
          }
        } catch (e) {
          console.error("Jigsaw verification error:", e);
          isValid = false;
        }
      } else if (challenge.type === "gesture") {
        // Gesture challenge: verify x,y coordinates match target within tolerance
        // SECURITY: Also verify proof-of-work to prevent ML-based automated solvers
        try {
          const submission = JSON.parse(solutionToVerify);
          
          // Visual challenges send {answer: {x, y}, powSolution: "..."}
          const submittedPosition = submission.answer || submission;
          const powSolution = submission.powSolution;
          const target = (challenge.challengeData as any).target;
          const tolerance = (challenge.challengeData as any).tolerance || 15;
          
          if (!target || typeof target.x !== 'number' || typeof target.y !== 'number') {
            throw new Error("Invalid challenge data");
          }
          
          if (typeof submittedPosition.x !== 'number' || typeof submittedPosition.y !== 'number') {
            throw new Error("Invalid solution format");
          }
          
          // Calculate Euclidean distance between submitted position and target
          const dx = submittedPosition.x - target.x;
          const dy = submittedPosition.y - target.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // First verify the visual puzzle answer
          isValid = distance <= tolerance;
          
          console.log(`[GESTURE] Verification: submitted=(${submittedPosition.x}, ${submittedPosition.y}), target=(${target.x}, ${target.y}), distance=${distance.toFixed(2)}, tolerance=${tolerance}, puzzleValid=${isValid}`);
          
          // Then verify proof-of-work to add computational cost for bots
          if (isValid && powSolution) {
            const powValid = verifyProofOfWork(challenge.challengeData, powSolution);
            if (!powValid) {
              console.log(`[GESTURE] Proof-of-work verification failed`);
              isValid = false;
            }
          } else if (isValid && !powSolution) {
            // PoW is required for defense-in-depth
            console.log(`[GESTURE] Missing proof-of-work solution`);
            isValid = false;
          }
        } catch (e) {
          console.error("Gesture verification error:", e);
          isValid = false;
        }
      } else if (challenge.type === "upside_down") {
        // Upside-down challenge: verify clicked coordinates match all upside-down animals
        // SECURITY: Also verify proof-of-work to prevent ML-based automated solvers
        try {
          const submission = JSON.parse(solutionToVerify);
          
          // Visual challenges send {answer: {clicks: [...]}, powSolution: "..."}
          const submittedClicks = submission.answer || submission;
          const powSolution = submission.powSolution;
          
          if (!submittedClicks || !submittedClicks.clicks || !Array.isArray(submittedClicks.clicks)) {
            throw new Error("Invalid solution format - expected { clicks: [{x, y}, ...] }");
          }
          
          const challengeData = challenge.challengeData as UpsideDownChallengeData;
          const validationResult = validateUpsideDownSolution(challengeData, submittedClicks.clicks);
          
          // First verify the visual puzzle answer
          isValid = validationResult.valid;
          
          console.log(`[UPSIDE_DOWN] Verification: clicks=${submittedClicks.clicks.length}, puzzleValid=${isValid}, reason=${validationResult.reason || 'success'}`);
          
          if (!isValid && validationResult.details) {
            console.log(`[UPSIDE_DOWN] Details:`, validationResult.details);
          }
          
          // Then verify proof-of-work to add computational cost for bots
          if (isValid && powSolution) {
            const powValid = verifyProofOfWork(challenge.challengeData, powSolution);
            if (!powValid) {
              console.log(`[UPSIDE_DOWN] Proof-of-work verification failed`);
              isValid = false;
            }
          } else if (isValid && !powSolution) {
            // PoW is required for defense-in-depth
            console.log(`[UPSIDE_DOWN] Missing proof-of-work solution`);
            isValid = false;
          }
        } catch (e) {
          console.error("Upside-down verification error:", e);
          isValid = false;
        }
      } else {
        // Checkbox or slider: regular proof-of-work
        isValid = verifyProofOfWork(challenge.challengeData, solutionToVerify);
      }

      const solveTime = Date.now() - startTime;
      
      // Mark challenge as used for auth endpoints (login/register) that check isUsed
      // For external validation via siteverify, use the verificationToken instead
      if (isValid) {
        markChallengeAsUsed(token);
        await storage.markChallengeAsUsed(challenge.id);
      }

      const userAgent = req.headers["user-agent"];
      // Note: geoData already fetched earlier for country blocking check

      await storage.createVerification({
        challengeId: challenge.id,
        apiKeyId: apiKey.id,
        success: isValid,
        ipAddress: clientIP,
        userAgent,
        country: geoData.country,
        countryName: geoData.countryName,
        region: geoData.region,
        city: geoData.city,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        timezone: geoData.timezone,
        timeToSolve: decoded.challengeData.timestamp
          ? Date.now() - decoded.challengeData.timestamp
          : null,
        attemptData: { solution },
      });

      // Update daily analytics aggregates
      await storage.updateDailyAnalytics(apiKey.id);
      await storage.updateDailyCountryAnalytics(apiKey.id);
      
      if (!isValid) {
        ipBlocker.recordFailedAttempt(clientIP);
        securityMonitor.logEvent({
          type: "verification_failure",
          ip: clientIP,
          riskLevel: riskAssessment.riskLevel,
          riskScore: riskAssessment.riskScore,
          details: { solveTime, challengeType: challenge.type },
        });
        console.log(`[SECURITY] Verification failed from ${clientIP} (solve time: ${solveTime}ms)`);
        
        if (ipBlocker.isBlocked(clientIP)) {
          const blockInfo = ipBlocker.getBlockInfo(clientIP);
          const remainingTime = blockInfo ? Math.ceil((blockInfo.expiresAt - Date.now()) / 1000 / 60) : 0;
          
          return res.json({
            success: false,
            message: `Too many failed attempts. Your IP has been blocked for ${remainingTime} minutes.`,
            blocked: true,
            remainingTime,
          });
        }
      } else {
        ipBlocker.resetAttempts(clientIP);
        securityMonitor.logEvent({
          type: "verification_success",
          ip: clientIP,
          riskLevel: riskAssessment.riskLevel,
          riskScore: riskAssessment.riskScore,
          details: { solveTime, challengeType: challenge.type },
        });
        console.log(`[SECURITY] Verification successful from ${clientIP} (solve time: ${solveTime}ms)`);
      }

      const response: any = {
        success: isValid,
        message: isValid ? "Verification successful" : "Invalid proof-of-work solution",
      };

      if (isValid) {
        const verificationToken = createVerificationToken(
          challenge.id,
          apiKey.secretkey,
          {
            domain: challenge.validatedDomain,
            timestamp: Date.now(),
            nonce: nanoid(16),
            fingerprint: JSON.stringify(deviceFingerprint),
          }
        );
        
        response.verificationToken = verificationToken;
      }

      res.json(response);
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({
        success: false,
        error: "Verification failed",
      });
    }
  });

  // ==================== SIMPLIFIED RECAPTCHA-LIKE ENDPOINTS ====================
  
  // Simplified Challenge Creation - for reCAPTCHA-like integration
  app.post("/api/challenge/create", challengeLimiter, async (req: Request, res: Response) => {
    try {
      const { sitekey, type } = req.body;

      if (!sitekey) {
        return res.status(400).json({ error: "Sitekey is required" });
      }

      const apiKey = await storage.getApiKeyBySitekey(sitekey);
      if (!apiKey || !apiKey.isActive) {
        return res.status(401).json({ error: "Invalid or inactive API key" });
      }

      const requestDomain = extractDomainFromRequest(req);
      if (!requestDomain) {
        return res.status(403).json({ 
          error: "Domain validation failed",
          message: "Cannot determine request origin"
        });
      }

      // CRITICAL SECURITY: Domain validation is ALWAYS ENFORCED
      // This CANNOT be disabled via settings - it's a core security feature
      // Validates domain against API key's allowed domain to prevent unauthorized sites from using the sitekey
      if (apiKey.domain && apiKey.domain !== "*") {
        const allowedDomain = apiKey.domain.replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
        
        // Check if domains match (exact match or subdomain)
        const isMatch = requestDomain === allowedDomain || 
                       requestDomain.endsWith('.' + allowedDomain);
        
        if (!isMatch) {
          console.log(`[SECURITY] Domain validation failed in challenge/create: Expected ${allowedDomain}, got ${requestDomain}`);
          return res.status(403).json({ 
            error: "Domain validation failed",
            message: `This sitekey is restricted to domain: ${allowedDomain}`
          });
        }
      }

      // Load security settings for this API key
      // Settings are loaded SERVER-SIDE and cannot be manipulated by client
      const settings = (apiKey.settings as SecuritySettings | null) || DEFAULT_SECURITY_SETTINGS;
      console.log(`[SETTINGS] Using security settings for ${apiKey.name}: difficulty=${settings.proofOfWorkDifficulty}`);

      // FIXED: Check IP and country blocking
      const clientIP = ipBlocker.getClientIP(req);
      const geoData = await getGeolocationFromIP(clientIP);
      const blockCheck = ipBlocker.checkSecurityBlocking(clientIP, geoData.country, settings);
      
      if (blockCheck.blocked) {
        console.log(`[SECURITY] Blocked request from IP ${clientIP} / Country ${geoData.country}: ${blockCheck.reason}`);
        return res.status(403).json({
          error: "Access denied",
          message: blockCheck.reason
        });
      }

      // Generate proof-of-work challenge using configured difficulty
      const difficulty = settings.proofOfWorkDifficulty || 4;
      const challenge = generateChallenge(difficulty);
      
      // Create JWT token with expiration from settings
      const tokenExpirySeconds = Math.floor((settings.tokenExpiryMs || 60000) / 1000);
      const challengeToken = jwt.sign(
        { challenge, type: type || 'checkbox', timestamp: Date.now() },
        JWT_SECRET,
        { expiresIn: `${tokenExpirySeconds}s` }
      );

      // Create HMAC signature
      const signature = generateChallengeSignature(
        challengeToken,
        requestDomain,
        apiKey.secretkey
      );

      // Store challenge in database
      const sessionFp = generateSessionFingerprint(req);
      await storage.createChallenge({
        token: challengeToken,
        difficulty,
        challengeData: challenge,
        type: type || 'checkbox',
        apiKeyId: apiKey.id,
        validatedDomain: requestDomain,
        signature,
        sessionFingerprint: sessionFp.hash,
        isUsed: false,
        expiresAt: new Date(Date.now() + (settings.challengeTimeoutMs || 300000)),
      });

      res.json({
        success: true,
        challenge: {
          token: challengeToken,
          salt: challenge.salt,
          challengeHash: challenge.challengeHash,
          maxNumber: challenge.maxNumber,
          timestamp: challenge.timestamp,
          difficulty: challenge.difficulty,
          signature: challenge.signature,
        },
        // Include security configuration for client-side widget
        // These settings inform the widget which features to enable
        securityConfig: {
          antiDebugger: settings.antiDebugger,
          challengeTimeoutMs: settings.challengeTimeoutMs,
          tokenExpiryMs: settings.tokenExpiryMs,
          advancedFingerprinting: settings.advancedFingerprinting,
          // Note: Domain validation and encryption are ALWAYS enforced server-side
          // and cannot be disabled regardless of these client settings
        }
      });
    } catch (error: any) {
      console.error("Challenge creation error:", error);
      res.status(500).json({ error: "Failed to create challenge" });
    }
  });

  // Simplified Challenge Verification - returns verification token
  app.post("/api/challenge/verify", verifyLimiter, async (req: Request, res: Response) => {
    try {
      const { token, solution } = req.body;

      if (!token || !solution) {
        return res.status(400).json({ 
          success: false,
          error: "Token and solution are required" 
        });
      }

      // Decode JWT token
      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        return res.json({ 
          success: false,
          error: "Invalid or expired token" 
        });
      }

      // Get challenge from database
      const challenge = await storage.getChallengeByToken(token);
      if (!challenge) {
        return res.json({ 
          success: false,
          error: "Challenge not found" 
        });
      }

      // Check if already used
      if (challenge.isUsed) {
        return res.json({ 
          success: false,
          error: "Challenge already used" 
        });
      }

      // Check expiration
      const expirationCheck = checkChallengeExpiration(challenge.createdAt, DEFAULT_EXPIRATION_CONFIG);
      if (!expirationCheck.isValid) {
        return res.json({ 
          success: false,
          error: "Challenge expired",
          message: expirationCheck.message
        });
      }

      // SECURITY: Validate domain from request matches the domain stored in challenge
      // This prevents challenge tokens from being used on different domains
      const requestDomain = extractDomainFromRequest(req);
      if (!requestDomain || requestDomain !== challenge.validatedDomain) {
        console.log(`[SECURITY] Domain validation failed in challenge/verify: Expected ${challenge.validatedDomain}, got ${requestDomain}`);
        return res.json({ 
          success: false,
          error: "Domain validation failed",
          message: "Challenge cannot be verified from this domain"
        });
      }

      // Get API key for additional domain validation
      const apiKey = await storage.getApiKey(challenge.apiKeyId!);
      if (!apiKey) {
        return res.json({ 
          success: false,
          error: "API key not found" 
        });
      }

      // SECURITY: Double-check domain against API key's allowed domain
      if (apiKey.domain && apiKey.domain !== "*") {
        const allowedDomain = apiKey.domain.replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
        const isMatch = requestDomain === allowedDomain || 
                       requestDomain.endsWith('.' + allowedDomain);
        
        if (!isMatch) {
          console.log(`[SECURITY] Domain validation failed against API key: Expected ${allowedDomain}, got ${requestDomain}`);
          return res.json({ 
            success: false,
            error: "Domain validation failed"
          });
        }
      }

      // FIXED: Check IP and country blocking
      const settings = (apiKey.settings as SecuritySettings | null) || DEFAULT_SECURITY_SETTINGS;
      const clientIP = ipBlocker.getClientIP(req);
      const geoData = await getGeolocationFromIP(clientIP);
      const blockCheck = ipBlocker.checkSecurityBlocking(clientIP, geoData.country, settings);
      
      if (blockCheck.blocked) {
        console.log(`[SECURITY] Blocked verification from IP ${clientIP} / Country ${geoData.country}: ${blockCheck.reason}`);
        return res.json({
          success: false,
          error: "Access denied",
          message: blockCheck.reason
        });
      }

      // Verify proof-of-work
      const isValid = verifyProofOfWork(decoded.challenge, solution);

      if (!isValid) {
        return res.json({ 
          success: false,
          error: "Invalid solution" 
        });
      }

      // Mark as used
      await storage.markChallengeAsUsed(challenge.id);

      // Create verification token
      const verificationToken = createVerificationToken(
        challenge.id,
        apiKey.secretkey,
        {
          domain: challenge.validatedDomain,
          timestamp: Date.now(),
          nonce: nanoid(16),
        }
      );

      // Log verification (reuse clientIP and geoData from above)
      await storage.createVerification({
        challengeId: challenge.id,
        apiKeyId: apiKey.id,
        success: true,
        ipAddress: clientIP,
        userAgent: req.headers["user-agent"] || null,
        country: geoData.country,
        countryName: geoData.countryName,
        region: geoData.region,
        city: geoData.city,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        timezone: geoData.timezone,
        timeToSolve: req.body.timeToSolve || null,
        attemptData: { solution },
      });

      // Update daily analytics aggregates
      await storage.updateDailyAnalytics(apiKey.id);
      await storage.updateDailyCountryAnalytics(apiKey.id);

      res.json({
        success: true,
        verificationToken,
        message: "Verification successful"
      });
    } catch (error: any) {
      console.error("Verification error:", error);
      res.status(500).json({ 
        success: false,
        error: "Verification failed" 
      });
    }
  });

  // ==================== SERVER-TO-SERVER TOKEN VERIFICATION ====================
  
  // Rate limiter untuk server-to-server verification
  const serverVerifyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: "Too many verification requests from this server",
    skipSuccessfulRequests: false,
  });
  
  // Endpoint untuk validasi token dari backend server eksternal
  // Ini digunakan oleh backend server customer untuk memvalidasi token captcha
  app.post("/api/captcha/verify-token", serverVerifyLimiter, async (req: Request, res: Response) => {
    try {
      // 1. Validasi Authorization header (API Secret Key)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "API secret key required in Authorization header"
        });
      }
      
      const apiSecretKey = authHeader.substring(7); // Remove "Bearer "
      
      // 2. Validasi API key dari secret
      const apiKey = await storage.getApiKeyBySecretkey(apiSecretKey);
      if (!apiKey || !apiKey.isActive) {
        console.log("[SECURITY] Invalid API secret key attempt");
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Invalid or inactive API secret key"
        });
      }
      
      // 3. Ambil verification token dari request body
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Bad Request",
          message: "Verification token is required"
        });
      }
      
      // 4. Verify verification token
      const verificationResult = verifyVerificationToken(token, apiKey.secretkey);
      
      if (!verificationResult) {
        return res.json({
          success: false,
          error: "Invalid Token",
          message: "Token verification failed or expired"
        });
      }
      
      const { challengeId, domain, timestamp } = verificationResult;
      
      // 5. Check token age (max 5 minutes)
      const tokenAge = Date.now() - timestamp;
      const MAX_TOKEN_AGE = 5 * 60 * 1000; // 5 minutes
      
      if (tokenAge > MAX_TOKEN_AGE) {
        return res.json({
          success: false,
          error: "Token Expired",
          message: "Verification token has expired"
        });
      }
      
      // 6. Get challenge dari database untuk validasi tambahan
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.json({
          success: false,
          error: "Invalid Challenge",
          message: "Challenge not found"
        });
      }
      
      // 7. Validasi challenge sudah digunakan dan berhasil
      if (!challenge.isUsed) {
        console.log("[SECURITY] Token presented but challenge not marked as used");
        return res.json({
          success: false,
          error: "Invalid State",
          message: "Challenge verification incomplete"
        });
      }
      
      // 8. Check challenge expiration
      if (new Date() > challenge.expiresAt) {
        return res.json({
          success: false,
          error: "Challenge Expired",
          message: "Challenge has expired"
        });
      }
      
      // 9. Validate domain matches
      const normalizedChallengeDomain = normalizeDomain(challenge.validatedDomain);
      const normalizedTokenDomain = normalizeDomain(domain);
      
      if (normalizedChallengeDomain !== normalizedTokenDomain) {
        console.log(`[SECURITY] Domain mismatch: challenge=${normalizedChallengeDomain}, token=${normalizedTokenDomain}`);
        return res.json({
          success: false,
          error: "Domain Mismatch",
          message: "Token domain does not match challenge domain"
        });
      }
      
      // 10. Validate API key matches
      if (challenge.apiKeyId !== apiKey.id) {
        console.log("[SECURITY] API key mismatch in token verification");
        return res.json({
          success: false,
          error: "API Key Mismatch",
          message: "Token was not issued for this API key"
        });
      }
      
      // 11. Log successful verification
      const clientIP = ipBlocker.getClientIP(req);
      console.log(`[SERVER-VERIFY] Successful token verification from ${clientIP} for domain ${domain}`);
      
      // 12. Return success dengan minimal data
      res.json({
        success: true,
        data: {
          challengeId: challenge.id,
          domain: challenge.validatedDomain,
          type: challenge.type,
          timestamp: timestamp,
          verified: true
        }
      });
      
    } catch (error: any) {
      console.error("Server-to-server verification error:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Token verification failed"
      });
    }
  });

  // ==================== CAPTCHA WIDGET SCRIPT ====================
  
  // Serve the ProofCaptcha widget JavaScript library (similar to reCAPTCHA api.js)
  app.get("/api/captcha.js", async (req: Request, res: Response) => {
    try {
      const scriptPath = path.resolve(import.meta.dirname, "public", "api.js");
      const script = await readFile(scriptPath, "utf-8");
      
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      res.setHeader("Access-Control-Allow-Origin", "*"); // Allow CORS for widget script
      res.send(script);
    } catch (error) {
      console.error("Error serving captcha widget script:", error);
      res.status(500).send("// Error loading ProofCaptcha widget");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
