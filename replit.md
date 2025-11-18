# ProofCaptcha

## Overview

ProofCaptcha is an advanced proof-of-work based CAPTCHA system designed to protect websites from automated bots using cryptographic challenges. It offers end-to-end encryption, multiple challenge types, and sophisticated bot detection. The system includes a React-based frontend dashboard for API key management and analytics, an Express backend API for challenge generation and verification, and embeddable JavaScript widgets for integration into third-party websites. Its purpose is to provide modern, privacy-focused bot protection.

## Recent Changes (November 18, 2025)

- **Developer Profile System:** Added comprehensive profile management allowing developers to customize their profiles with display names, company information, website, and bio.
- **Avatar System:** Implemented 5 default SVG avatar templates randomly assigned on registration. Developers can select from templates or upload custom avatars through the Profile page.
- **Real-time Developer Chat:** Added WebSocket-based chat feature for developer collaboration, displaying avatars alongside messages for better visual identification.

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