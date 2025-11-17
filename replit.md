# ProofCaptcha

## Overview

ProofCaptcha is an advanced proof-of-work based CAPTCHA system designed to protect websites from automated bots using cryptographic challenges. Unlike traditional image-based CAPTCHAs, ProofCaptcha employs end-to-end encryption, multiple challenge types, and sophisticated bot detection mechanisms to provide modern, privacy-focused bot protection.

The system consists of a React-based frontend dashboard for developers to manage API keys and view analytics, an Express backend API for challenge generation and verification, and embeddable JavaScript widgets for integration into third-party websites.

## Recent Changes

**2024-11-17:** Added branded ProofCaptcha logo to email templates
- Replaced simple icon with full branded SVG logo
- Logo includes:
  - Shield icon with checkmark
  - "ProofCaptcha" text with premium typography
  - "ADVANCED BOT PROTECTION" tagline
  - Glow effect for premium feel
  - Consistent branding across all emails
- Logo is inline SVG (always visible, not blocked by email clients)
- Applied to both verification and password reset emails

**2024-11-17:** Redesigned email templates with modern, professional design
- Updated verification email template with:
  - Modern gradient background and card-based layout
  - Premium visual design with SVG icons and decorative elements
  - Enhanced security notices and user guidance
  - Better mobile responsiveness
  - Professional color scheme with purple gradients
- Updated password reset email template with:
  - Consistent design language with verification email
  - Orange/amber accent colors for reset context
  - Step-by-step action guide
  - Enhanced security warnings
  - Clear call-to-action elements
- Both templates now include:
  - Better typography hierarchy
  - Improved spacing and readability
  - Support email contact information
  - Professional footer with branding
  - Accessibility improvements for various email clients

**2024-11-17:** Fixed bug in forgot password flow where URL query parameters were not being extracted correctly
- Fixed `VerifyResetCodePage.tsx` - Changed from `location.split('?')[1]` to `window.location.search` for email parameter
- Fixed `ResetPasswordPage.tsx` - Changed from `location.split('?')[1]` to `window.location.search` for token parameter
- Issue: wouter's `useLocation()` hook only returns the path, not the query string, causing "Email tidak ditemukan" error even when backend successfully sent verification code

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript
- Vite as build tool and dev server
- Wouter for client-side routing
- TanStack Query for server state management
- shadcn/ui components (Radix UI primitives)
- Tailwind CSS for styling
- i18next for internationalization (English/Indonesian)

**Key Design Decisions:**
- **Component Library:** Uses shadcn/ui (Radix UI) for accessible, customizable UI components following the "New York" style preset
- **State Management:** React Query handles all server state, eliminating the need for Redux/Zustand
- **Routing:** Wouter provides lightweight client-side routing without React Router overhead
- **Theming:** Custom theme system with light/dark modes using CSS variables and Tailwind
- **Build Output:** Compiled to `dist/public` for static file serving by Express

**Authentication Flow:**
- Session-based authentication using Express session middleware
- Email verification system with verification codes
- Password reset functionality with time-limited codes
- Protected routes checked via `requireAuth` middleware

### Backend Architecture

**Technology Stack:**
- Node.js with Express
- TypeScript with ES modules
- Drizzle ORM for database access
- Neon serverless PostgreSQL
- bcrypt for password hashing
- jsonwebtoken for token generation
- nanoid for unique ID generation

**Core Components:**

1. **Challenge Generation System:**
   - Multiple challenge types: checkbox, slider, grid, jigsaw, gesture, upside-down
   - Proof-of-work challenges with adjustable difficulty
   - Adaptive difficulty based on risk assessment
   - Challenge data stored with expiration timestamps

2. **End-to-End Encryption:**
   - ECDH (Elliptic Curve Diffie-Hellman) key exchange using P-256 curve
   - HKDF (HMAC-based Key Derivation Function) for deriving session keys
   - AES-256-GCM for encrypting challenge/solution payloads
   - Server controls encryption mode to prevent downgrade attacks
   - Session-based key caching with automatic rotation

3. **Security Layers:**
   - **Automation Detection:** Detects headless browsers, Selenium, Puppeteer, and other automation frameworks
   - **Device Fingerprinting:** Generates fingerprints from browser characteristics (User-Agent, Accept headers, screen resolution, canvas rendering)
   - **Advanced Fingerprinting:** Canvas, WebGL, and audio context fingerprinting for enhanced bot detection
   - **Behavioral Analysis:** Tracks request patterns, timing, and frequency to identify bot behavior
   - **Risk Scoring:** Calculates risk scores from multiple signals and adjusts challenge difficulty dynamically
   - **IP Blocking:** Automatic blocking after failed attempts with configurable thresholds and durations
   - **Session Binding:** Binds challenge tokens to session fingerprints to prevent token theft
   - **CSRF Protection:** Token-based CSRF protection for state-changing operations
   - **Honeypot Detection:** Invisible form fields to catch automated submissions
   - **Replay Attack Prevention:** Tracks used challenge tokens in memory to prevent reuse

4. **API Key Management:**
   - Public sitekey for client-side widget initialization
   - Secret key for server-side verification
   - Per-key security settings (encryption mode, difficulty, fingerprinting)
   - Domain validation and CORS configuration
   - API key status toggling (active/inactive)

5. **Analytics System:**
   - Daily aggregated analytics per API key
   - Country-level analytics with geolocation
   - Metrics: total challenges, successful/failed verifications, average solve time
   - Time-series data for visualization in dashboard

### Data Storage Solutions

**Primary Database:**
- PostgreSQL (via Neon serverless)
- Drizzle ORM provides type-safe database access
- Schema defined in `shared/schema.ts` with Zod validation

**Database Tables:**
- `developers` - Developer accounts with email verification
- `api_keys` - API credentials and security settings
- `challenges` - Generated challenges with expiration
- `verifications` - Verification attempt logs
- `analytics` - Daily aggregated statistics
- `country_analytics` - Geographic analytics

**In-Memory Caching:**
- Session keys cache (`SessionCache` class) for ephemeral ECDH keys
- Used challenges tracker (Map-based) for replay prevention
- IP blocker state (Map-based) for rate limiting
- Device fingerprint tracking (Map-based)
- Automatic cleanup tasks run periodically to prevent memory leaks

**Storage Abstraction:**
- `IStorage` interface allows swapping between in-memory and database storage
- `DatabaseStorage` implements persistent PostgreSQL storage
- Fallback mechanisms when database is unavailable

### Authentication and Authorization

**Developer Authentication:**
- Email/password registration with bcrypt hashing
- Email verification via verification codes (6 digits)
- Password reset flow with time-limited codes
- Express session-based authentication
- Session secret from environment variable

**API Key Authentication:**
- Public sitekey used in client-side widget
- Secret key used for server-side verification
- HMAC signatures bind challenges to validated domains
- Domain validation prevents unauthorized usage
- CORS configured to allow cross-origin captcha embedding

**Security Mechanisms:**
- Timing-safe comparison for signature verification
- Domain normalization to prevent bypass via case manipulation
- Challenge expiration (default 5 minutes)
- Grace period for network latency (30 seconds)
- Token binding to session fingerprints

### External Dependencies

**Database:**
- Neon Serverless PostgreSQL
- Connection via `DATABASE_URL` environment variable
- WebSocket support for serverless connections

**Email Service:**
- Nodemailer for email delivery
- SMTP configuration via environment variables:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
  - `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`
- Used for verification emails and password reset

**Geolocation:**
- geoip-lite for IP-based country detection
- Fallback to external IP-API service when needed
- Supports mapping IP addresses to country codes

**Frontend Build Tools:**
- Vite for development server and production builds
- Replit-specific plugins for development environment
- PostCSS with Tailwind for CSS processing

**Security Libraries:**
- crypto (Node.js built-in) for cryptographic operations
- bcryptjs for password hashing
- jsonwebtoken for JWT token generation
- express-rate-limit for rate limiting
- express-session for session management
- cookie-parser for cookie handling

**Obfuscation (Optional):**
- javascript-obfuscator for code protection
- Configurable obfuscation for server/client bundles
- Backup/restore scripts for source code

**Migration System:**
- Drizzle Kit for database migrations
- Migrations stored in `migrations/` directory
- Automatic migration execution on startup (production)