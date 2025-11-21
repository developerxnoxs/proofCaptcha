# ProofCaptcha

## Overview

ProofCaptcha is an advanced proof-of-work based CAPTCHA system designed to protect websites from automated bots using cryptographic challenges. It offers end-to-end encryption, multiple challenge types, and sophisticated bot detection. The system includes a React-based frontend dashboard for API key management and analytics, an Express backend API for challenge generation and verification, and embeddable JavaScript widgets for integration into third-party websites. Its purpose is to provide modern, privacy-focused bot protection.

## Recent Changes

### November 21, 2025
- **Bootstrap Founder Account System:** Implemented one-time bootstrap endpoint to create the first founder account, solving the chicken-and-egg problem where founder privileges were required to create founders.
  - **Bootstrap Endpoint:** Added `/api/bootstrap/create-founder` POST endpoint that creates a founder account with auto-verified email
  - **Security:** Endpoint automatically disables itself after the first founder is created - returns 403 Forbidden if a founder already exists
  - **CSRF Protection:** Bootstrap endpoint requires CSRF token - frontend automatically fetches token via `/api/security/csrf` before submission
  - **Auto-Login:** Newly created founder is automatically logged in with full session privileges
  - **Bootstrap Page:** Created `/bootstrap` frontend page at `client/src/pages/BootstrapFounder.tsx` with simple form (email, password, name)
  - **No CAPTCHA Required:** Bootstrap endpoint bypasses CAPTCHA validation since it's a one-time system setup
  - **Usage:** Navigate to `/bootstrap` to create the first founder account when no founders exist in the system
  - **Password Security:** Uses bcrypt hashing with cost factor 10, minimum 8 characters required
  - **Implementation:** Backend at `server/routes.ts` line 340-409, frontend route added to `client/src/App.tsx`
  - **Bug Fix:** Added CSRF token fetch in frontend before form submission to prevent "CSRF token not found" error

### November 20, 2025
- **Encrypted Security Configuration System:** Implemented comprehensive encrypted config delivery to prevent client-side manipulation of security settings.
  - **Server-Side Encryption:** Added `/api/captcha/security-config` endpoint that encrypts API key security settings (antiDebugger, advancedFingerprinting, widgetCustomization, etc.) using ECDH session keys before sending to widget
  - **Session Binding:** Endpoint validates that encryption session is bound to the requested API key (prevents cross-key attacks)
  - **Nonce Replay Protection:** Implemented server-side nonce tracking cache with automatic cleanup to prevent replay attacks
  - **Timestamp Validation:** Client and server validate timestamps with 30-second max skew tolerance to ensure config freshness
  - **Widget Security:** Widget now loads encrypted config before rendering, validates nonce match, and applies safe defaults on any failure
  - **Fail-Safe Rendering:** Widget initialization is fully async - rendering only occurs after config successfully loaded or safe defaults explicitly applied
  - **Security Logging:** Comprehensive logging for replay attack detection, session validation failures, and config loading issues
  - **Memory Management:** Nonce cache expires entries after 5 minutes with periodic cleanup to prevent memory bloat

- **Performance Optimization - Removed Duplicate Security Config Transmission:**
  - **Eliminated Redundancy:** Security config is now loaded ONCE at widget initialization via `/api/captcha/security-config`, not re-transmitted with every challenge request
  - **Reduced Response Size:** Challenge endpoint (`/api/captcha/challenge`) no longer sends ~265 lines of duplicate security config, reducing response payload
  - **Improved Efficiency:** Widget caches security settings after initial load, preventing unnecessary data transfer on each challenge
  - **Server Changes:** Removed security config preparation and encryption from challenge handler in `server/routes.ts`
  - **Frontend Changes:** Removed duplicate security config processing from challenge response handler in `server/public/proofCaptcha/api.js`
  - **Maintained Security:** All security enforcement remains server-side; optimization does not compromise security posture

- **Bug Fix - Theme Setting Override:**
  - **Fixed:** Removed obsolete `theme` field from security config that was overriding `widgetCustomization.forceTheme` setting
  - **Root Cause:** Endpoint was sending both old `theme: apiKey.theme` field and new `widgetCustomization.forceTheme`, causing conflict
  - **Solution:** Removed obsolete `theme` and `domain` fields from `/api/captcha/security-config` response
  - **Impact:** Widget now correctly applies `forceTheme` setting from API key customization (light, dark, or auto)
  - **Note:** Test files use Demo Application API key - change theme settings via dashboard at `/keys` to test different themes

### November 19, 2025
- **Critical Bug Fix - Chat Media Upload:** Fixed CSRF middleware not being invoked correctly in the chat media upload endpoint (`/api/chat/upload-media`). The middleware function `csrfMiddleware` was referenced without calling it with `()`, preventing proper CSRF token validation. This caused file uploads to fail silently. Changed from `csrfMiddleware` to `csrfMiddleware()` in `server/routes.ts` line 4438.

- **Chat UX Improvements:**
  - **Multi-line Input:** Replaced single-line `Input` with `Textarea` component that supports multi-line messages with auto-resize (min 40px, max 120px height)
  - **Keyboard Shortcuts:** Changed from Enter-to-send to Shift+Enter-to-send, allowing plain Enter to create new lines in messages
  - **Delete Button Position:** Fixed delete message button positioning from absolute (`-right-10`) to flex layout for better alignment and responsiveness
  - **Auto-resize Textarea:** Added automatic height adjustment as user types, with reset to default height after sending messages
  - **Updated Placeholder Text:** Changed placeholder to indicate new keyboard shortcut (Shift+Enter to send)

- **WebSocket Performance Optimization:**
  - **Instant Ping/Pong Response:** Moved ping handler to execute BEFORE any async database operations in `server/chat-ws.ts`, reducing latency from 100-1000ms to <10ms for RTT measurements
  - **Eliminated Database Blocking:** Ping messages now short-circuit immediately without waiting for chat message persistence or broadcast operations
  - **Smoothed Latency Display:** Implemented rolling average of last 5 ping samples in frontend to provide stable, non-jumping latency visualization
  - **Performance Impact:** Reduced perceived latency from 100-1000ms to <50ms on strong networks, improving real-time chat experience
  - **Debug Logging:** Added comprehensive latency logging showing both raw RTT and smoothed average values

### November 18, 2025
- **Developer Profile System:** Added comprehensive profile management allowing developers to customize their profiles with display names, company information, website, and bio.
- **Avatar System:** Implemented 10 default PNG avatar presets randomly assigned on registration. Developers can select from templates or upload custom avatars through the Profile page. Avatar files located in `client/public/avatars/`.
- **Real-time Developer Chat with Typing Indicators:** 
  - WebSocket-based chat feature for developer collaboration with real-time message delivery
  - Live typing indicators showing when developers are typing
  - Support for multiple simultaneous typists with avatars and names
  - Intelligent throttling to prevent event spam
  - Automatic cleanup of typing indicators on disconnect
  - Messages appear instantly without page refresh
- **Bug Fixes:** 
  - Fixed avatar preset images not loading by moving files from `public/avatars/` to `client/public/avatars/` to align with Vite's root configuration
  - Optimized Google Fonts loading by reducing from 30+ font families to only Inter and JetBrains Mono
  - Updated Content Security Policy to allow Google Fonts from fonts.googleapis.com and fonts.gstatic.com
  - Updated avatar preset paths from non-existent .svg files to existing .png files (avatar-1.png through avatar-10.png)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite for development and bundling. It leverages Wouter for routing, TanStack Query for server state management, shadcn/ui components for a consistent UI, and Tailwind CSS for styling. Internationalization is supported via i18next (English/Indonesian). The design emphasizes accessible and customizable components with a custom theme supporting light/dark modes. Authentication is session-based, including email verification and password reset, with protected routes managed by middleware.

### Backend Architecture

The backend uses Node.js with Express, TypeScript, and Drizzle ORM for PostgreSQL database interaction (Neon serverless). Key components include:

-   **Challenge Generation System:** Supports multiple proof-of-work challenge types (checkbox, slider, grid, jigsaw, gesture, upside-down, audio) with adaptive difficulty based on risk assessment.
-   **End-to-End Encryption:** Utilizes ECDH for key exchange, HKDF for session key derivation, and AES-256-GCM for payload encryption, with server-controlled encryption modes.
-   **Security Layers:** Incorporates automation detection (headless browsers, Selenium, Puppeteer), advanced device fingerprinting (Canvas, WebGL, audio context), behavioral analysis, and risk scoring. It also features IP blocking, session binding, CSRF protection, honeypot detection, and replay attack prevention.
-   **API Key Management:** Provides public sitekeys and secret keys, with per-key security settings, domain validation, and CORS configuration.
-   **Analytics System:** Collects daily aggregated and country-level analytics, including challenge and verification metrics, for dashboard visualization.

### Data Storage Solutions

The primary database is PostgreSQL (Neon serverless) managed by Drizzle ORM, with schema defined in `shared/schema.ts`. Key tables include `developers`, `api_keys`, `challenges`, `verifications`, `analytics`, `country_analytics`, and `chat_messages`. In-memory caching is used for ephemeral data like session keys, used challenges, IP blocker state, and device fingerprint tracking, with automatic cleanup. An `IStorage` interface allows for flexible storage implementations.

### Authentication and Authorization

Developer authentication uses email/password with bcrypt hashing, email verification, and password reset flows, all secured via Express session middleware. API key authentication involves public sitekeys for client-side widgets and secret keys for server-side verification, with HMAC signatures and domain validation to prevent unauthorized use. Security mechanisms include timing-safe comparisons, domain normalization, challenge expiration, and token binding to session fingerprints.

## External Dependencies

-   **Database:** Neon Serverless PostgreSQL.
-   **Email Service:** Nodemailer for sending verification and password reset emails.
-   **Geolocation:** geoip-lite for IP-based country detection, with fallback to external IP-API.
-   **Frontend Build Tools:** Vite, PostCSS, and Tailwind CSS.
-   **Security Libraries:** Node.js `crypto`, `bcryptjs`, `jsonwebtoken`, `express-rate-limit`, `express-session`, `cookie-parser`.
-   **Migration System:** Drizzle Kit for database migrations.