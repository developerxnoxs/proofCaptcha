import dotenv from "dotenv";
dotenv.config({ override: true });

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Enable trust proxy for proper IP address detection behind proxies/load balancers
app.set('trust proxy', 1);

// Configure CORS - ProofCaptcha harus bisa diakses dari website eksternal manapun
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins untuk public CAPTCHA endpoints
    // Website eksternal perlu bisa menggunakan ProofCaptcha
    callback(null, origin || true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['X-CSRF-Token'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

declare module "express-session" {
  interface SessionData {
    developerId?: string;
    isEmailVerified?: boolean;
  }
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use(cookieParser());
app.use(setSecurityHeaders);

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
  
  // Serve assets (images, etc.) for external api.js widget integration
  app.use('/assets', express.static(path.join(__dirname, '..', 'attached_assets')));
  
  const server = await registerRoutes(app);

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
