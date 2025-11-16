# ProofCaptcha - Advanced Proof-of-Work CAPTCHA System

## Overview

ProofCaptcha is a self-hosted, privacy-first CAPTCHA system designed to protect websites from automated bots using advanced proof-of-work challenges and end-to-end encryption. It combines cryptographic challenges, device fingerprinting, behavioral analysis, and various interactive challenge types to provide robust bot protection. The system includes a developer dashboard for managing API keys, monitoring analytics, and viewing verification logs, alongside a client-side widget library for easy website integration and server-side verification endpoints. Its primary purpose is to offer a secure, privacy-focused alternative to traditional CAPTCHAs, aiming to enhance website security and user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Vite for building, Tailwind CSS with shadcn/ui.
**Key Design Decisions:** Component-based architecture, light/dark mode theme system, client-side encryption using Web Crypto API, a standalone JavaScript widget library similar to reCAPTCHA v2, and support for multiple challenge types (checkbox, slider, grid, jigsaw, gesture, upside-down image).
**Routing Structure:** Includes a marketing home page, developer dashboard, API key management, integration helper, API documentation, activity logs, authentication pages, and a live CAPTCHA demo.

### Backend Architecture

**Technology Stack:** Node.js with Express.js, TypeScript, Drizzle ORM, PostgreSQL (via Neon serverless), Express-session, bcrypt.js, jsonwebtoken.
**Security Layers:**
1.  **Proof-of-Work Challenge System:** SHA-256 based cryptographic challenges with adjustable difficulty, protected by HMAC signatures.
2.  **End-to-End Encryption (E2EE):** ECDH key exchange, HKDF for key derivation, AES-256-GCM for authenticated encryption of challenge data and solutions. Includes security configuration encryption and server-controlled encryption modes.
3.  **Bot Detection & Behavioral Analysis:** User-Agent analysis, device fingerprinting (canvas, WebGL, audio, fonts), request timing analysis, IP-based rate limiting, honeypot fields, and session binding.
4.  **Challenge Types:** A variety of interactive challenges including checkbox, slider, grid selection, jigsaw puzzles, gesture recognition, and upside-down image detection.
5.  **Domain Validation:** API keys are bound to specific domains, enforced via Origin/Referer header validation and HMAC signatures to prevent cross-domain attacks.
**API Endpoints:** Public CAPTCHA API for handshake, challenge generation, and verification; Developer Dashboard API for authentication, API key management, analytics, and verification logs.
**Security Middleware:** CORS, CSRF protection, security headers, rate limiting, IP blocking, and automated cleanup for expired challenges.

### Data Storage

**Database Schema:** PostgreSQL tables for developers, API keys, challenges, verifications, and analytics.
**Storage Strategy:** Challenges have a default 5-minute expiry with hourly cleanup. In-memory caching is used for single-use challenge tokens, ephemeral session keys, IP blocking records, and security events. Analytics are aggregated daily per API key.
**Data Flow:** Client initiates a challenge, an encrypted session is established (if enabled), the client solves the PoW, encrypts the solution, and the server validates it, returning a verification token.

### Authentication & Authorization

**Developer Authentication:** Session-based authentication with bcrypt-hashed passwords and CSRF protection.
**API Key Authentication:** Public sitekey and private secretkey, with optional domain binding.
**Challenge Token Flow:** JWT-based challenge tokens containing encrypted data, domain/API key binding, expiration, and single-use enforcement.

## External Dependencies

### Third-Party Services

-   **Neon Database:** Serverless PostgreSQL hosting, connected via `@neondatabase/serverless`.

### NPM Packages

**Frontend:** `react`, `react-dom`, `wouter`, `@tanstack/react-query`, `@radix-ui/*`, `tailwindcss`, `clsx`, `tailwind-merge`, `date-fns`, `lucide-react`, `zod`.
**Backend:** `express`, `drizzle-orm`, `drizzle-kit`, `bcryptjs`, `jsonwebtoken`, `nanoid`, `express-session`, `cookie-parser`, `cors`, `express-rate-limit`, `ws`, `nodemailer`, `dotenv`.
**Development:** `vite`, `typescript`, `tsx`, `esbuild`, `@replit/vite-plugin-*`.

### Web APIs

-   **Web Crypto API:** For client-side cryptography (ECDH, HKDF, AES-GCM, SHA-256).
-   **Canvas API, WebGL, Audio API:** Used for device fingerprinting.

### Environment Variables

-   `NODE_ENV`: Environment mode (`development`, `production`).
-   `SESSION_SECRET`: Secret for session encryption.
-   `DATABASE_URL`: PostgreSQL connection string.
-   `SMTP_*` variables: SMTP configuration for email service.
-   `SMTP_TLS_SERVERNAME`: TLS servername for certificate validation.
-   `TRUST_PROXY`: Enables trusting proxy headers.
-   `PORT`: Server port.