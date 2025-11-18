import dotenv from "dotenv";
dotenv.config({ override: true });

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setSecurityHeaders } from "./security-headers";
import { ensureDemoApiKey } from "./init-demo-key";
import { startCleanupTasks } from "./cleanup-tasks";
import { getStorage } from "./storage";
import { runMigrations } from "./migrate";
import { csrfMiddleware } from "./enhancements/csrf-protection";
import { setupChatWebSocket } from "./chat-ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// SECURITY: Auto-generate SESSION_SECRET if not provided
// This ensures sessions are always cryptographically secure
const SESSION_SECRET = (() => {
  const envSecret = process.env.SESSION_SECRET;
  
  // If SESSION_SECRET is provided in environment, validate and use it
  if (envSecret) {
    if (envSecret.length < 32) {
      console.error(
        '\n' +
        '═══════════════════════════════════════════════════════════════\n' +
        '  ⚠️  SECURITY WARNING: SESSION_SECRET TOO SHORT\n' +
        '═══════════════════════════════════════════════════════════════\n' +
        '  Your SESSION_SECRET is less than 32 characters.\n' +
        '  This is INSECURE and may lead to session hijacking.\n' +
        '\n' +
        '  RECOMMENDED: Generate a strong secret:\n' +
        '    openssl rand -hex 32\n' +
        '\n' +
        '  Then set it in your environment:\n' +
        '    SESSION_SECRET=<generated-secret>\n' +
        '═══════════════════════════════════════════════════════════════\n'
      );
    } else {
      console.log('[SECURITY] ✓ Using SESSION_SECRET from environment (strong)');
    }
    return envSecret;
  }
  
  // Auto-generate a cryptographically secure random secret
  const generated = crypto.randomBytes(32).toString('hex');
  
  console.warn(
    '\n' +
    '═══════════════════════════════════════════════════════════════\n' +
    '  ⚠️  AUTO-GENERATED SESSION SECRET\n' +
    '═══════════════════════════════════════════════════════════════\n' +
    '  SESSION_SECRET was not found in environment variables.\n' +
    '  A secure random secret has been auto-generated for this session.\n' +
    '\n' +
    '  ⚠️  IMPORTANT WARNINGS:\n' +
    '  • All user sessions will be INVALIDATED on server restart\n' +
    '  • Users will be logged out when the server restarts\n' +
    '  • This is NOT recommended for production environments\n' +
    '\n' +
    '  📝 FOR PRODUCTION DEPLOYMENT:\n' +
    '  1. Generate a permanent secret:\n' +
    '       openssl rand -hex 32\n' +
    '\n' +
    '  2. Set SESSION_SECRET in your environment:\n' +
    '       SESSION_SECRET=<your-generated-secret>\n' +
    '\n' +
    '  3. Restart the application\n' +
    '\n' +
    '  Generated secret (DO NOT SHARE): ' + generated.substring(0, 16) + '...\n' +
    '═══════════════════════════════════════════════════════════════\n'
  );
  
  return generated;
})();

// Enable trust proxy for proper IP address detection behind proxies/load balancers
app.set('trust proxy', 1);

// SECURITY FIX: Dynamic CORS configuration based on endpoint type
// Public endpoints (CAPTCHA): Allow all origins for integration
// Private endpoints (Dashboard/Auth): Restrict credentials to prevent CSRF
app.use((req, res, next) => {
  // Define public endpoints that need to be accessible from any website
  const publicEndpoints = [
    '/api/captcha/challenge',
    '/api/captcha/verify',
    '/api/captcha/handshake',
    '/api/captcha/verify-token',
    '/api/challenge/verify',
    '/proofCaptcha/api/siteverify',
    '/api/demo/key',
    '/assets',
    '/health'
  ];
  
  // Check if current request is for a public endpoint
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.path.startsWith(endpoint));
  
  if (isPublicEndpoint) {
    // PUBLIC ENDPOINTS: Allow all origins with credentials
    // This is necessary for CAPTCHA widgets embedded in external websites
    cors({
      origin: (origin, callback) => {
        // Allow all origins for public CAPTCHA functionality
        callback(null, origin || true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-CSRF-Token'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    })(req, res, next);
  } else {
    // PRIVATE ENDPOINTS (Dashboard, Auth, Admin): Same-origin only
    // This prevents CSRF attacks from malicious websites
    cors({
      origin: (origin, callback) => {
        // For private endpoints, only allow requests from same origin
        // or allow no credentials for cross-origin requests
        if (!origin) {
          // Same-origin requests (no Origin header) are allowed
          callback(null, true);
          return;
        }
        
        // Parse request origin
        const requestOrigin = new URL(origin);
        const hostHeader = req.headers.host;
        
        // Allow if origin matches the server's host
        if (hostHeader && requestOrigin.host === hostHeader) {
          callback(null, true);
        } else {
          // For cross-origin requests to private endpoints, reject
          // This prevents external sites from accessing dashboard/auth with credentials
          callback(new Error('CORS policy: Private endpoints are not accessible from external origins'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Cookie', 'X-Requested-With'],
      exposedHeaders: ['X-CSRF-Token'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    })(req, res, next);
  }
});

declare module "express-session" {
  interface SessionData {
    developerId?: string;
    developerName?: string;
    developerEmail?: string;
    isEmailVerified?: boolean;
  }
}

// Create session store (default MemoryStore)
const sessionStore = new session.MemoryStore();

// Create session middleware
const sessionMiddleware = session({
  store: sessionStore,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  },
});

app.use(sessionMiddleware);

app.use(cookieParser());
app.use(setSecurityHeaders);

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development' || req.path === '/health') {
    return next();
  }
  
  if (!req.secure) {
    if (req.path.startsWith('/api/captcha')) {
      return res.status(403).json({
        error: 'HTTPS required',
        message: 'This service requires HTTPS for security. Please use https:// instead of http://'
      });
    }
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  
  next();
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// CRITICAL: CSRF middleware MUST run AFTER body parsers
// This ensures req.body is populated before verification
// and headers are available for multipart/form-data requests
app.use((req, res, next) => {
  const publicPaths = [
    '/api/captcha/challenge',
    '/api/captcha/verify',
    '/api/captcha/handshake',
    '/api/challenge/verify',
    '/proofCaptcha/api/siteverify',
    '/api/demo/key'
  ];
  
  const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
  
  if (isPublicPath && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH')) {
    return next();
  }
  
  return csrfMiddleware()(req, res, next);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  let migrationsSuccessful = false;
  
  if (process.env.DATABASE_URL) {
    try {
      console.log('[STARTUP] DATABASE_URL configured, running migrations...');
      await runMigrations();
      migrationsSuccessful = true;
      console.log('[STARTUP] Migrations completed successfully');
    } catch (error) {
      console.error('[STARTUP] Migration failed:', error);
      if (process.env.DATABASE_URL) {
        console.error('[STARTUP] DATABASE_URL is configured but migrations failed!');
        console.error('[STARTUP] The application will continue with fallback storage.');
      }
    }
  } else {
    console.log('[STARTUP] No DATABASE_URL configured, skipping migrations');
  }
  
  console.log('[STARTUP] Initializing storage...');
  await getStorage(migrationsSuccessful);
  console.log('[STARTUP] Storage initialized successfully');
  
  console.log('[STARTUP] Ensuring demo API key exists...');
  await ensureDemoApiKey();
  console.log('[STARTUP] Demo API key initialization complete');
  
  // Serve static files from public directory (for test pages, widget scripts, etc.)
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Serve uploaded files (avatars, etc.)
  app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
  
  // Serve assets (images, etc.) for external api.js widget integration
  app.use('/assets', express.static(path.join(__dirname, '..', 'attached_assets')));
  
  const server = await registerRoutes(app);

  // Setup WebSocket server for chat
  console.log('[STARTUP] Setting up WebSocket server for chat...');
  await setupChatWebSocket(server, SESSION_SECRET, () => sessionStore);
  console.log('[STARTUP] WebSocket server ready');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start automated cleanup tasks
    startCleanupTasks();
  });
})();
