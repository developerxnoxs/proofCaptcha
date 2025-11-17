# Security Policy

## 🛡️ Overview

ProofCaptcha takes security seriously. This document outlines our comprehensive security architecture, vulnerability disclosure process, and best practices for developers integrating ProofCaptcha into their applications.

**Security Rating: A+**

ProofCaptcha employs **7 independent security layers** with end-to-end encryption, making it one of the most secure CAPTCHA systems available.

---

## 📋 Table of Contents

- [Supported Versions](#supported-versions)
- [Vulnerability Disclosure](#vulnerability-disclosure)
- [Security Architecture](#security-architecture)
  - [End-to-End Encryption](#end-to-end-encryption)
  - [Multi-Layer Bot Detection](#multi-layer-bot-detection)
  - [Anti-Debugger Protection](#anti-debugger-protection)
  - [Code Obfuscation](#code-obfuscation)
  - [Domain Validation](#domain-validation)
  - [Session Management](#session-management)
  - [CSRF Protection](#csrf-protection)
- [Security Features](#security-features)
- [Security Best Practices](#security-best-practices)
- [Known Security Considerations](#known-security-considerations)
- [Security Audit Log](#security-audit-log)

---

## 📦 Supported Versions

We release security updates for the following versions:

| Version | Supported          | End of Support |
| ------- | ------------------ | -------------- |
| 1.0.x   | :white_check_mark: | Active Development |

**Update Policy:**
- Security patches released within 24-48 hours of discovery (critical vulnerabilities)
- Non-critical vulnerabilities addressed in regular releases
- All users notified via security advisories

---

## 🔒 Vulnerability Disclosure

### Reporting a Vulnerability

If you discover a security vulnerability in ProofCaptcha, please report it responsibly:

**DO:**
- ✅ Email security reports to: **security@proofcaptcha.com**
- ✅ Provide detailed description with reproduction steps
- ✅ Include proof-of-concept (code, screenshots, videos)
- ✅ Suggest potential fixes if possible
- ✅ Allow 90 days for fix before public disclosure

**DON'T:**
- ❌ Create public GitHub issues for security vulnerabilities
- ❌ Publicly disclose before fix is available
- ❌ Exploit vulnerabilities maliciously
- ❌ Share vulnerabilities with third parties

### Report Template

```
**Vulnerability Type:**
[e.g., Encryption Bypass, Authentication Bypass, XSS, etc.]

**Affected Component:**
[e.g., Widget API, Challenge Endpoint, Dashboard, etc.]

**Severity:**
[Critical / High / Medium / Low]

**Description:**
[Detailed description of the vulnerability]

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Proof of Concept:**
[Code, screenshots, or video demonstration]

**Impact:**
[Potential consequences if exploited]

**Suggested Fix:**
[Optional: Your recommendations]

**Environment:**
- ProofCaptcha Version: 
- Browser/Client: 
- Operating System: 
```

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Development**:
  - Critical: 24-48 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next regular release
- **Public Disclosure**: After fix deployed + 7 days notice

---

## 🏗️ Security Architecture

ProofCaptcha employs **7 independent security layers** for defense-in-depth:

```
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                     │
├─────────────────────────────────────────────────────────┤
│ Layer 7: CSRF Protection                                │
│ Layer 6: Code Obfuscation & Anti-Debugger               │
│ Layer 5: Domain Validation                              │
│ Layer 4: Session Management                             │
│ Layer 3: Multi-Layer Bot Detection                      │
│ Layer 2: End-to-End Encryption                          │
│ Layer 1: HTTPS Transport Security                       │
└─────────────────────────────────────────────────────────┘
```

---

### End-to-End Encryption

**ALL challenge and solution data is encrypted** using a hybrid encryption scheme that provides:

- **Confidentiality**: AES-256-GCM encryption
- **Integrity**: GMAC authentication tags
- **Forward Secrecy**: Unique keys per session
- **Replay Protection**: HMAC signatures with context binding

#### 1. Key Exchange (ECDH)

**Algorithm:** Elliptic Curve Diffie-Hellman using P-256 curve

**Process:**

```
Client                              Server
  |                                    |
  |---(1) Generate Client Keys---------|
  |    ECDH P-256 keypair              |
  |    privateKey (stays local)        |
  |    publicKey (to server)           |
  |                                    |
  |---(2) POST /api/captcha/handshake->|
  |    { publicKey: clientPubKey }     |
  |                                    |
  |                                    |---(3) Generate Server Keys
  |                                    |    ECDH P-256 keypair
  |                                    |    Derive shared secret
  |                                    |
  |<--(4) Server Public Key + Nonce----|
  |    { serverPublicKey,              |
  |      timestamp,                    |
  |      nonce,                        |
  |      signature }                   |
  |                                    |
  |---(5) Derive Shared Secret---------|
  |    ECDH(clientPrivate, serverPub)  |
  |    = Shared Secret (256-bit)       |
```

**Security Properties:**
- ✅ **Perfect Forward Secrecy**: Each session has unique ephemeral keys
- ✅ **No Private Key Transmission**: Private keys never leave their respective sides
- ✅ **NIST-approved**: P-256 curve (secp256r1) is FIPS 186-4 compliant
- ✅ **Quantum-resistant considerations**: 256-bit security level

#### 2. Key Derivation (HKDF)

**Algorithm:** HKDF-SHA256 (HMAC-based Extract-and-Expand Key Derivation Function)

**Purpose:** Derive cryptographically independent AES and HMAC keys from shared secret

**Parameters:**
```javascript
HKDF-SHA256(
  ikm: sharedSecret,           // Input Key Material
  salt: SHA256(challengeId),   // Unique per challenge
  info: "ProofCaptcha-v1-encrypt-{hashedChallengeId}",
  length: 64 bytes             // 512 bits output
)
```

**Output:**
- First 32 bytes → AES-256 encryption key
- Last 32 bytes → HMAC-SHA256 authentication key

**Security Properties:**
- ✅ **Key Separation**: Independent keys for encryption and authentication
- ✅ **Context Binding**: Keys tied to specific challenge ID
- ✅ **One-way Function**: Cannot derive shared secret from output keys
- ✅ **Collision Resistant**: Based on SHA-256

```
     Shared Secret (256-bit)
            ↓
      HKDF-SHA256
            ↓
    512-bit Output
       ↙        ↘
  AES Key    HMAC Key
  (32 bytes) (32 bytes)
```

#### 3. Data Encryption (AES-GCM)

**Algorithm:** AES-256-GCM (Galois/Counter Mode)

**Encryption Process:**

```javascript
// Challenge Encryption (Server → Client)
const iv = crypto.randomBytes(12);  // 96-bit IV
const aad = challengeId;            // Additional Authenticated Data

const encrypted = AES_256_GCM_Encrypt(
  plaintext: challengeData,
  key: derivedAESKey,
  iv: iv,
  aad: aad
);

// Output: { ciphertext, authTag }
```

**Decryption Process:**

```javascript
// Solution Decryption (Client → Server)
const decrypted = AES_256_GCM_Decrypt(
  ciphertext: encryptedSolution,
  key: derivedAESKey,
  iv: iv,
  aad: challengeId,
  authTag: authTag
);

// Throws error if authentication fails
```

**Security Properties:**
- ✅ **Authenticated Encryption**: Combines confidentiality + integrity
- ✅ **AEAD**: Authenticated Encryption with Associated Data
- ✅ **Tamper Detection**: Authentication tag prevents modification
- ✅ **No Padding Oracle**: GCM mode doesn't use padding
- ✅ **Fast Performance**: Hardware-accelerated on modern CPUs

**What is Encrypted:**
1. **Challenge Data**:
   - Grid: Correct cell positions
   - Jigsaw: Target coordinates
   - Gesture: Correct pattern
   - Upside-Down: Animal rotation angles
2. **Security Configuration**:
   - Anti-debugger settings
   - Timeout values
   - Advanced fingerprinting flags
3. **Solution Metadata**:
   - Solve time
   - Client detections
   - Fingerprint data

#### 4. Server-Side Encryption Control (CRITICAL)

**The Most Important Security Feature**

**Problem (Old Insecure Approach):**
```javascript
// CLIENT controls encryption mode (INSECURE!)
const request = {
  publicKey: "pk_...",
  supportsEncryption: false  // ❌ Client can force plaintext!
};
```

**Solution (ProofCaptcha Secure Approach):**
```javascript
// SERVER determines encryption mode (SECURE!)
function handleChallengeRequest(req) {
  const session = sessionCache.getSession(publicKey, ip, fingerprint);
  
  if (session) {
    // MANDATORY encryption - client CANNOT override
    return encryptedChallenge(session.key);
  } else {
    // Plaintext fallback ONLY if no session exists
    return plaintextChallenge();
  }
}
```

**Security Benefits:**
- ❌ **Prevents Downgrade Attacks**: Client cannot force plaintext mode
- ❌ **Prevents MITM**: Encrypted data cannot be intercepted and modified
- ❌ **Prevents Replay**: Each encrypted payload has unique IV and auth tag
- ✅ **Progressive Enhancement**: Works even if encryption fails on first try

**Attack Scenarios Prevented:**

1. **Downgrade Attack:**
   ```
   Attacker: "I don't support encryption"
   Old System: "OK, here's plaintext" ❌
   ProofCaptcha: "Session exists, encryption MANDATORY" ✅
   ```

2. **Encryption Bypass:**
   ```
   Attacker: Modifies request to set encrypted=false
   Old System: Accepts plaintext ❌
   ProofCaptcha: Server ignores client preference ✅
   ```

3. **Replay Attack:**
   ```
   Attacker: Replays encrypted solution
   Old System: Accepts if signature valid ❌
   ProofCaptcha: Single-use tokens enforced ✅
   ```

#### 5. Two-Token Architecture

**ProofCaptcha uses TWO different tokens for enhanced security:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Token Lifecycle                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CHALLENGE TOKEN (Internal)                              │
│     ┌──────────────────────────────────────┐                │
│     │ • Created: Challenge generation      │                │
│     │ • Purpose: Encrypt challenge data    │                │
│     │ • Lifetime: 60s (configurable)       │                │
│     │ • Usage: Client ↔ ProofCaptcha       │                │
│     │ • Security: JWT + AES-256-GCM        │                │
│     │ • Visibility: NEVER sent to backend  │                │
│     └──────────────────────────────────────┘                │
│                       ↓                                      │
│              User solves challenge                           │
│                       ↓                                      │
│  2. VERIFICATION TOKEN (Public)                             │
│     ┌──────────────────────────────────────┐                │
│     │ • Created: After verification        │                │
│     │ • Purpose: Proof of completion       │                │
│     │ • Lifetime: 60s (configurable)       │                │
│     │ • Usage: Client → Your Backend       │                │
│     │ • Security: JWT signed with secret   │                │
│     │ • Visibility: Sent to YOUR server    │                │
│     └──────────────────────────────────────┘                │
│                       ↓                                      │
│         Your backend validates token                         │
│                       ↓                                      │
│              Form processed or rejected                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Challenge Token Details:**
```typescript
interface ChallengeToken {
  type: 'challenge';
  challengeId: string;        // Unique challenge ID
  apiKeyId: string;           // API key used
  sessionId: string;          // Encryption session
  encrypted: boolean;         // Encryption flag
  createdAt: number;          // Unix timestamp
  expiresAt: number;          // Expiration time
  // Encrypted payload contains:
  // - Challenge answer (grid positions, jigsaw coords, etc.)
  // - Security config (anti-debugger, timeouts)
  // - Risk score requirements
}
```

**Verification Token Details:**
```typescript
interface VerificationToken {
  type: 'verification';
  challengeId: string;        // Original challenge ID
  domain: string;             // Validated domain
  timestamp: number;          // Verification time
  ip: string;                 // Client IP (hashed)
  fingerprint: string;        // Device fingerprint (hashed)
  riskScore: number;          // Calculated risk (0-100)
  solveTime: number;          // Time to complete (ms)
  // Signed with YOUR secret key
  // Single-use enforced
}
```

**Why Two Tokens?**

1. **Security Separation:**
   - Challenge token encrypted with session keys
   - Verification token signed with API secret
   - Different threat models for each phase

2. **Privacy Protection:**
   - Challenge answers NEVER exposed to backend
   - Backend only sees "verified" or "failed"
   - User behavior data stays with ProofCaptcha

3. **Replay Prevention:**
   - Challenge token: Used once to submit solution
   - Verification token: Used once to validate backend
   - Both marked as used after consumption

4. **Flexibility:**
   - Different expiration times possible
   - Challenge can be retried without new verification
   - Backend validation independent of frontend

**Security Properties:**
- ✅ **Challenge token** encrypted end-to-end
- ✅ **Verification token** signed and validated
- ✅ Both tokens single-use only
- ✅ Both tokens time-limited
- ✅ Both tokens domain-bound
- ✅ Cannot reuse tokens across challenges
- ✅ Cannot forge tokens without secret key

---

### Multi-Layer Bot Detection

ProofCaptcha uses **5 independent detection layers** that work simultaneously:

```
┌──────────────────────────────────────────┐
│  Request arrives                         │
├──────────────────────────────────────────┤
│  Layer 1: Advanced Fingerprinting       │ ← Device identification
│  Layer 2: Automation Detection          │ ← Tool detection
│  Layer 3: Behavioral Analysis           │ ← Human vs bot patterns
│  Layer 4: Honeypot Detection            │ ← Trap detection
│  Layer 5: IP Reputation                 │ ← Rate limiting
├──────────────────────────────────────────┤
│  Risk Score Calculation                  │
│  (0-100, threshold: 50 = bot)            │
├──────────────────────────────────────────┤
│  Adaptive Response                       │
│  • Low Risk: Easy challenge              │
│  • Medium Risk: Normal challenge         │
│  • High Risk: Hard challenge             │
│  • Critical Risk: Block request          │
└──────────────────────────────────────────┘
```

#### Layer 1: Advanced Fingerprinting

**60+ data points collected** to create unique device signature:

**Browser Fingerprints:**
```javascript
{
  // Canvas Fingerprint (unique rendering)
  canvas: "hash_of_canvas_rendering",
  
  // WebGL Fingerprint (GPU signature)
  webgl: {
    vendor: "NVIDIA Corporation",
    renderer: "GeForce GTX 1080",
    extensions: [...],
    parameters: {...}
  },
  
  // Audio Context Fingerprint
  audio: "hash_of_audio_oscillator",
  
  // Font Detection
  fonts: ["Arial", "Times New Roman", ...],
  
  // Screen Properties
  screen: {
    width: 1920,
    height: 1080,
    colorDepth: 24,
    pixelRatio: 1
  },
  
  // Browser Properties
  userAgent: "Mozilla/5.0...",
  platform: "Win32",
  language: "en-US",
  timezone: "America/New_York",
  
  // Hardware
  hardwareConcurrency: 8,  // CPU cores
  deviceMemory: 8,         // GB RAM
  touchSupport: false
}
```

**Server-Side Validation:**
```typescript
function validateFingerprint(fingerprint: DeviceFingerprint) {
  const riskScore = 0;
  const flags: string[] = [];
  
  // Detect fingerprint spoofing
  if (isCanvasSpoofed(fingerprint.canvas)) {
    riskScore += 30;
    flags.push("Canvas spoofing detected");
  }
  
  // Detect headless browser signatures
  if (isHeadlessSignature(fingerprint)) {
    riskScore += 50;
    flags.push("Headless browser detected");
  }
  
  // Detect impossible combinations
  if (hasImpossibleCombination(fingerprint)) {
    riskScore += 40;
    flags.push("Impossible hardware combination");
  }
  
  return { isValid: riskScore < 50, riskScore, flags };
}
```

**Detection Capabilities:**
- ✅ Same device tracking across sessions
- ✅ Fingerprint spoofing detection
- ✅ Headless browser identification
- ✅ Virtual machine detection
- ✅ Impossible hardware combinations

#### Layer 2: Automation Detection

**Detects automation tools and frameworks:**

```typescript
function detectAutomation(req: Request): {
  isAutomation: boolean;
  detectedBy: string[];
  score: number;
}
```

**Detection Methods:**

1. **User-Agent Analysis:**
```javascript
const signatures = [
  "HeadlessChrome",      // Puppeteer
  "PhantomJS",           // PhantomJS
  "Selenium",            // Selenium
  "WebDriver",           // WebDriver
  "Playwright",          // Playwright
  "curl",                // cURL
  "python-requests",     // Python requests
  "Postman"              // Postman
];
```

2. **Header Analysis:**
```javascript
// Missing browser headers (bots don't send these)
const requiredHeaders = [
  "accept-language",
  "accept-encoding",
  "sec-fetch-site",
  "sec-fetch-mode"
];

// Automation-specific headers
const automationHeaders = [
  "webdriver",           // Selenium
  "chrome-devtools",     // CDP
  "playwright"           // Playwright
];
```

3. **JavaScript Environment Detection:**
```javascript
// Client-side checks
const isAutomation = (
  navigator.webdriver === true ||
  window.callPhantom !== undefined ||
  window._phantom !== undefined ||
  window.Buffer !== undefined ||  // Node.js
  window.emit !== undefined        // Puppeteer
);
```

**Scoring System:**
```
Headless User-Agent:     +50 points
Automation Framework:    +50 points
Missing Browser Headers:  +5 points each
Automation Headers:      +40 points
Bot Patterns:            +40 points
─────────────────────────────────────
Threshold: 50 points = Bot Detected
```

#### Layer 3: Behavioral Analysis

**Analyzes human-like behavior patterns:**

```typescript
function analyzeBehavior(req: Request): {
  isSuspicious: boolean;
  suspiciousPatterns: string[];
  riskScore: number;
}
```

**Pattern Detection:**

1. **Mouse Movement Analysis:**
```javascript
// Human: Natural curves, acceleration/deceleration
// Bot: Perfect lines, constant velocity

const mousePattern = {
  path: [[x1,y1], [x2,y2], ...],
  velocity: calculateVelocity(path),
  acceleration: calculateAcceleration(path),
  curvature: calculateCurvature(path)
};

if (isTooLinear(mousePattern) || 
    isConstantVelocity(mousePattern)) {
  suspiciousPatterns.push("Bot-like mouse movement");
  riskScore += 20;
}
```

2. **Timing Analysis:**
```javascript
// Human: Variable timing, natural delays
// Bot: Too fast or perfectly timed

const timings = {
  challengeLoadTime: timestamp,
  firstInteraction: timestamp,
  solutionSubmitTime: timestamp,
  totalTime: submitTime - loadTime
};

if (timings.totalTime < 500) {  // Superhuman speed
  suspiciousPatterns.push("Too fast completion");
  riskScore += 30;
}

if (isPerfectTiming(timings)) {
  suspiciousPatterns.push("Perfect timing (bot)");
  riskScore += 25;
}
```

3. **Interaction Patterns:**
```javascript
// Human: Natural variability
// Bot: Repetitive, predictable

if (hasRepetitivePattern(interactions)) {
  suspiciousPatterns.push("Repetitive behavior");
  riskScore += 20;
}

if (missingNaturalErrors(interactions)) {
  suspiciousPatterns.push("No human mistakes");
  riskScore += 15;
}
```

#### Layer 4: Honeypot Detection

**Invisible traps that only bots trigger:**

```typescript
function detectHoneypot(data: any): {
  isHoneypot: boolean;
  triggers: string[];
}
```

**Honeypot Techniques:**

1. **Invisible Form Fields:**
```html
<!-- Hidden from humans via CSS, but bots auto-fill -->
<input type="text" 
       name="email_confirm" 
       style="position:absolute;left:-9999px"
       tabindex="-1"
       autocomplete="off">
```

2. **Timing Traps:**
```javascript
// Form submitted faster than humanly possible
const MIN_FILL_TIME = 2000;  // 2 seconds

if (submitTime - loadTime < MIN_FILL_TIME) {
  triggers.push("Instant form submission");
  isHoneypot = true;
}
```

3. **JavaScript Requirements:**
```javascript
// CAPTCHA REQUIRES JavaScript execution
// Bots using HTTP clients fail here

if (!hasJavaScriptSignature(request)) {
  triggers.push("No JavaScript execution");
  isHoneypot = true;
}
```

#### Layer 5: IP Reputation & Rate Limiting

**Tracks and blocks suspicious IPs:**

```typescript
interface IPReputation {
  ip: string;
  requestCount: number;
  failedAttempts: number;
  successfulSolves: number;
  firstSeen: number;
  lastSeen: number;
  isBlocked: boolean;
  blockExpiry: number;
}
```

**Rate Limits (Configurable per API Key):**
```javascript
{
  challengeGeneration: {
    windowMs: 60000,      // 1 minute
    maxRequests: 30       // 30 challenges/minute
  },
  verification: {
    windowMs: 60000,
    maxRequests: 30       // 30 verifications/minute
  },
  tokenValidation: {
    windowMs: 60000,
    maxRequests: 100      // 100 validations/minute
  }
}
```

**Auto-Blocking:**
```javascript
// Temporary block after 5 failed attempts
if (ip.failedAttempts >= 5) {
  blockIP(ip, duration: 15 * 60 * 1000);  // 15 minutes
}

// Permanent block for malicious patterns
if (hasMaliciousPattern(ip)) {
  blockIP(ip, duration: Infinity);
}
```

**Per-API-Key IP/Country Blocking:**
```json
{
  "blockedIps": [
    "192.168.1.100",      // Single IP
    "10.0.0.0/8",         // CIDR range
    "203.0.113.0/24"      // Subnet
  ],
  "blockedCountries": [
    "KP",                 // North Korea
    "IR"                  // Iran
  ]
}
```

---

### Anti-Debugger Protection

**Prevents reverse engineering and tampering attempts.**

**6 detection layers** that run simultaneously:

#### 1. Debugger Statement Traps

```javascript
// Layer 1: Direct debugger traps
setInterval(() => {
  (function() {return false;})['constructor']('debugger')['call']();
}, Math.random() * 800 + 200);

// Layer 2: Function constructor traps
setInterval(() => {
  const code = Function.prototype.constructor;
  code('debugger')();
}, Math.random() * 1200 + 300);
```

**How it works:**
- Debugger statement halts execution if DevTools open
- Randomized intervals prevent detection bypass
- Multiple traps increase detection reliability

#### 2. Viewport Detection

```javascript
// Detect DevTools by window size changes
function checkViewport() {
  const widthGap = window.outerWidth - window.innerWidth;
  const heightGap = window.outerHeight - window.innerHeight;
  
  // DevTools docked = significant size difference
  if (widthGap > 160 || heightGap > 160) {
    devtoolsOpen = true;
    triggerAntiDebugger();
  }
}

setInterval(checkViewport, 1000);
window.addEventListener('resize', checkViewport);
```

#### 3. Timing-Based Detection

```javascript
// Debugger pauses execution = timing delay
setInterval(() => {
  const start = performance.now();
  debugger;  // Execution pauses here if DevTools open
  const end = performance.now();
  
  if (end - start > 100) {  // 100ms threshold
    devtoolsOpen = true;
    triggerAntiDebugger();
  }
}, 2000);
```

#### 4. Function Integrity Checks

```javascript
// Detect function tampering
const originalConsoleLog = console.log.toString();

setInterval(() => {
  if (console.log.toString() !== originalConsoleLog) {
    // Console has been monkey-patched
    triggerAntiDebugger();
  }
}, 3000);
```

#### 5. toString() Traps

```javascript
// Detect console.log() inspection
const detectObject = {};
Object.defineProperty(detectObject, 'toString', {
  get: function() {
    devtoolsOpen = true;
    triggerAntiDebugger();
    return '';
  }
});

setInterval(() => {
  console.log('%c', detectObject);  // Triggers getter if DevTools open
}, 5000);
```

#### 6. Performance Monitoring

```javascript
// Monitor performance anomalies
setInterval(() => {
  const perfEntries = performance.getEntries();
  
  // Unusual performance signatures indicate debugging
  if (hasUnusualPerformanceProfile(perfEntries)) {
    triggerAntiDebugger();
  }
}, 4000);
```

**Response Actions:**

**Standard Mode:**
```
┌────────────────────────────────┐
│  ⚠️ Debugger Detected          │
│                                │
│  Please close DevTools to      │
│  continue using ProofCaptcha   │
└────────────────────────────────┘
```

**Premium Mode (CHEATERS!! Animation):**
```
┌────────────────────────────────┐
│  🚨 CHEATERS!! 🚨              │
│                                │
│  [Police Car Animation]        │
│  [3D Cracker Icon]             │
│                                │
│  Debugging Detected!           │
│  Stop trying to cheat!         │
└────────────────────────────────┘
```

**Configuration (Per API Key):**
```json
{
  "antiDebugger": true,  // Enable/disable
  "challengeTimeoutMs": 60000,
  "tokenExpiryMs": 60000
}
```

---

### Code Obfuscation

**Protects source code from reverse engineering.**

#### Production Obfuscation

**Features:**
- ✅ **RC4 String Encryption**: All string literals encrypted
- ✅ **Control Flow Flattening**: Scrambled execution flow
- ✅ **Dead Code Injection**: Fake code paths (50% injection rate)
- ✅ **Self-Defending**: Crashes if tampered
- ✅ **Debug Protection**: Anti-debugging mechanisms
- ✅ **Identifier Mangling**: Variables renamed to hex

**Configuration:**
```javascript
const obfuscationConfig = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 1,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.5,
  debugProtection: true,
  debugProtectionInterval: 4000,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 1,
  selfDefending: true,
  identifierNamesGenerator: 'hexadecimal'
};
```

**Build Commands:**
```bash
# Standard build
npm run build

# Build with obfuscation (recommended)
npm run build:obfuscate
```

---

### Domain Validation

**Strict validation ensures CAPTCHA only works on authorized domains.**

**Validation Process:**

```typescript
function validateDomain(
  allowedDomains: string | null,
  origin: string | undefined,
  referer: string | undefined
): {
  isValid: boolean;
  validatedDomain: string | null;
}
```

**Validation Steps:**

1. **Extract Domain:**
```javascript
// Priority: Origin header > Referer header
const domain = extractDomain(origin || referer);
```

2. **Check Against Allowed Domains:**
```javascript
// Single domain
if (allowedDomains === "example.com") {
  return domain === "example.com";
}

// Multiple domains
if (allowedDomains === "example.com,app.example.com") {
  return ["example.com", "app.example.com"].includes(domain);
}

// Wildcard subdomains
if (allowedDomains === "*.example.com") {
  return domain.endsWith(".example.com");
}

// Development mode (allow localhost)
if (NODE_ENV === "development" && domain === "localhost") {
  return true;
}
```

**Configuration Examples:**
```javascript
// Single domain
allowedDomains: "example.com"

// Multiple domains (comma-separated)
allowedDomains: "example.com,app.example.com,staging.example.com"

// Wildcard subdomains
allowedDomains: "*.example.com"

// Allow all (DEVELOPMENT ONLY - NOT for production)
allowedDomains: "*"
```

**Security Benefits:**
- ✅ **CORS Protection**: Only allowed domains can load widget
- ✅ **Token Binding**: Tokens tied to validated domain
- ✅ **Replay Prevention**: Tokens cannot be used cross-domain

---

### Session Management

**Secure session handling with fingerprint binding.**

**Session Structure:**
```typescript
interface Session {
  sessionId: string;
  apiKeyId: string;
  deviceFingerprint: string;
  ipAddress: string;
  createdAt: number;
  lastUsed: number;
  expiresAt: number;
  encryptionKeys: {
    masterKey: CryptoKey;
    serverPublicKey: Buffer;
    clientPublicKey: Buffer;
  };
}
```

**Security Features:**

#### 1. Multi-Factor Binding

Sessions are bound to:
- ✅ **API Key ID** (cannot be used with different keys)
- ✅ **Device Fingerprint** (strict validation)
- ✅ **IP Address** (with /24 subnet tolerance for mobile users)

**Validation:**
```typescript
function validateSession(
  sessionId: string,
  fingerprint: string,
  ip: string
): boolean {
  const session = cache.get(sessionId);
  if (!session) return false;
  
  // Strict fingerprint check
  if (session.deviceFingerprint !== fingerprint) {
    console.warn("Session fingerprint mismatch");
    return false;
  }
  
  // Tolerant IP check (same /24 subnet)
  if (!isSameSubnet(session.ipAddress, ip, 24)) {
    console.warn("Session IP mismatch");
    return false;
  }
  
  // Check expiration
  if (Date.now() > session.expiresAt) {
    console.warn("Session expired");
    return false;
  }
  
  return true;
}
```

#### 2. Automatic Expiration

**Timeouts:**
- **Session Lifetime**: 1 hour (rolling)
- **Challenge Expiry**: 60 seconds (configurable per API key)
- **Token Expiry**: 60 seconds (configurable per API key)
- **Grace Period**: 5 seconds (clock skew tolerance)

**Cleanup:**
```typescript
// Automatic cleanup every 60 seconds
setInterval(() => {
  cleanupExpiredSessions();
  cleanupExpiredChallenges();
  cleanupExpiredHandshakes();
}, 60000);
```

#### 3. Key Rotation

**Automatic rotation:**
- ✅ New encryption keys per session
- ✅ Keys rotated on session expiry
- ✅ No key reuse across sessions
- ✅ Forward secrecy guaranteed

---

### CSRF Protection

**Prevents Cross-Site Request Forgery attacks.**

**Implementation:**
```typescript
// CSRF token generation
app.use(csrfMiddleware());

// Protected endpoints
app.post('/api/keys/create', csrfProtection, async (req, res) => {
  // Verify CSRF token
  // Process request
});
```

**Exempted Endpoints:**
```javascript
// Public CAPTCHA endpoints (no CSRF needed)
const publicEndpoints = [
  '/api/captcha/challenge',
  '/api/captcha/verify',
  '/api/captcha/handshake',
  '/api/captcha/verify-token',
  '/proofCaptcha/api/siteverify'
];
```

---

## 🔐 Security Features

### Core Security Features (Always Enforced)

These features are **ALWAYS ACTIVE** and cannot be disabled:

| Feature | Algorithm/Method | Status |
|---------|------------------|--------|
| End-to-End Encryption | ECDH + HKDF + AES-256-GCM | ✅ Always Active |
| Domain Validation | Origin/Referer + Wildcard | ✅ Always Active |
| Session Management | Fingerprint + IP Binding | ✅ Always Active |
| Token Expiration | JWT + Time Validation | ✅ Always Active |
| Replay Prevention | HMAC + Single-Use Tokens | ✅ Always Active |
| HTTPS Enforcement | TLS 1.2+ (Production) | ✅ Always Active |
| Server Encryption Control | Server-Side Enforcement | ✅ Always Active |

### Configurable Security Features

Configure per API key via Dashboard → Settings:

| Feature | Default | Description |
|---------|---------|-------------|
| **Anti-Debugger** | ON | Multi-layer DevTools detection |
| **Advanced Fingerprinting** | ON | Canvas/WebGL/Audio fingerprints |
| **Automation Detection** | ON | Puppeteer/Selenium/Playwright detection |
| **Behavioral Analysis** | ON | Mouse/keyboard/timing analysis |
| **Risk-Adaptive Difficulty** | ON | Dynamic challenge difficulty |
| **IP Rate Limiting** | ON | Per-IP request limits |
| **Country Blocking** | OFF | Block specific countries |

---

## 🛠️ Security Best Practices

### For Developers Using ProofCaptcha

#### 1. ALWAYS Validate on Backend

**❌ INSECURE (Frontend Only):**
```javascript
// NEVER do this - can be bypassed!
if (proofCaptcha.getResponse()) {
  submitForm();
}
```

**✅ SECURE (Backend Validation):**
```javascript
app.post('/submit', async (req, res) => {
  const token = req.body['proof-captcha-response'];
  
  // ALWAYS validate on backend
  const result = await fetch('https://your-domain.com/api/captcha/verify-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CAPTCHA_SECRET_KEY}`
    },
    body: JSON.stringify({ token })
  });
  
  const validation = await result.json();
  
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid CAPTCHA' });
  }
  
  // Process form
});
```

#### 2. Use Environment Variables for Secrets

**❌ INSECURE:**
```javascript
const SECRET_KEY = 'sk_abc123...'; // Hardcoded - NEVER do this!
```

**✅ SECURE:**
```javascript
const SECRET_KEY = process.env.CAPTCHA_SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error('CAPTCHA_SECRET_KEY not configured');
}

// Never log or expose secret key
```

#### 3. Handle Errors Gracefully

**❌ INSECURE (Leaks Information):**
```javascript
catch (error) {
  res.status(500).json({ error: error.message }); // Exposes internals!
}
```

**✅ SECURE (Generic Errors):**
```javascript
try {
  const result = await validateCaptcha(token);
  
  if (!result.success) {
    return res.status(400).json({ 
      error: 'CAPTCHA verification failed'
      // Don't expose internal error details
    });
  }
} catch (error) {
  console.error('CAPTCHA error:', error); // Log internally
  
  res.status(500).json({ 
    error: 'Internal server error'
    // Generic message to client
  });
}
```

#### 4. Implement Rate Limiting

**✅ RECOMMENDED:**
```javascript
const rateLimit = require('express-rate-limit');

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 submissions per window
  message: 'Too many submissions, please try again later'
});

app.post('/submit', formLimiter, async (req, res) => {
  // Your form handler
});
```

#### 5. Validate Token Expiry

**✅ RECOMMENDED:**
```javascript
app.post('/submit', async (req, res) => {
  const result = await validateCaptcha(token);
  
  if (!result.success) {
    return res.status(400).json({ error: 'CAPTCHA verification failed' });
  }
  
  // Check token age (recommended: < 5 minutes)
  const tokenAge = Date.now() - result.data.timestamp;
  const MAX_TOKEN_AGE = 5 * 60 * 1000;  // 5 minutes
  
  if (tokenAge > MAX_TOKEN_AGE) {
    return res.status(400).json({ error: 'CAPTCHA token too old' });
  }
  
  // Process form
});
```

#### 6. Use HTTPS in Production

**✅ REQUIRED:**
```javascript
// ProofCaptcha enforces HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
    next();
  });
}
```

#### 7. Generate Strong SESSION_SECRET

**✅ REQUIRED:**
```bash
# Generate cryptographically secure session secret
openssl rand -hex 32

# Add to .env
SESSION_SECRET=your_generated_64_char_hex_string
```

---

## ⚠️ Known Security Considerations

### 1. Encryption Fallback Mode

**Issue:** If encryption fails (e.g., old browsers without Web Crypto API), system falls back to plaintext mode.

**Mitigation:**
- ✅ Upside-down challenges REQUIRE encryption (blocked if unavailable)
- ✅ Security-critical settings NOT sent in plaintext mode
- ✅ Server-side bot detection ALWAYS active
- ✅ 99%+ browsers support Web Crypto API

**Impact:** Low (affects <1% of users, minimal security reduction)

### 2. Session Hijacking

**Issue:** If attacker steals session cookie, they could potentially reuse it.

**Mitigation:**
- ✅ Session bound to device fingerprint
- ✅ Session bound to IP subnet
- ✅ Session expires after 1 hour
- ✅ HttpOnly cookies prevent JS access
- ✅ Secure cookies in production (HTTPS only)
- ✅ SameSite cookies prevent CSRF

**Impact:** Very Low (requires multiple attack vectors)

### 3. Client-Side Code Exposure

**Issue:** JavaScript code runs on client and can be inspected.

**Mitigation:**
- ✅ Code obfuscation (RC4 encryption, control flow flattening)
- ✅ Anti-debugger protection (multi-layer detection)
- ✅ Server-side enforcement (client cannot bypass)
- ✅ Encrypted critical data (answers, security config)
- ✅ Self-defending code (crashes if tampered)

**Impact:** Low (attacker gains little useful information)

### 4. Proof-of-Work Bypass

**Issue:** Determined attacker could solve PoW challenges programmatically.

**Mitigation:**
- ✅ Adaptive difficulty (increases for suspicious IPs)
- ✅ Multi-layer bot detection (PoW is just one layer)
- ✅ Behavioral analysis (detects automated solving)
- ✅ Rate limiting (limits attack speed)

**Impact:** Low (requires significant resources, easily detected)

### 5. Challenge Type Prediction

**Issue:** Attacker might predict challenge type to pre-train bots.

**Mitigation:**
- ✅ Random challenge selection (default mode)
- ✅ 4 different challenge types
- ✅ Encrypted answers (attacker can't verify training)
- ✅ Adaptive selection (server chooses based on risk)

**Impact:** Very Low (minimal advantage to attacker)

---

## 📜 Security Audit Log

### Recent Security Enhancements

| Date | Version | Enhancement | Severity |
|------|---------|-------------|----------|
| 2025-11-17 | 1.0.3 | Fixed SESSION_SECRET auto-generation with cryptographically secure random | Critical |
| 2025-11-16 | 1.0.2 | Added server-side encryption control to prevent downgrade attacks | Critical |
| 2025-11-15 | 1.0.1 | Enhanced HMAC signature validation with context binding | High |
| 2025-11-14 | 1.0.0 | Initial release with end-to-end encryption | - |

### Security Review Schedule

- **Code Review**: Weekly
- **Dependency Audit**: Monthly (npm audit)
- **Penetration Testing**: Quarterly (internal)
- **Security Patches**: Within 48 hours of discovery

---

## 🔍 Security Monitoring

### Logs to Monitor

**Authentication:**
```
[AUTH] Login attempt from IP: 192.168.1.100
[AUTH] Failed login (invalid credentials)
[AUTH] Account locked after 5 failed attempts
```

**Security Events:**
```
[SECURITY] Bot detected: Puppeteer signature
[SECURITY] IP blocked: 203.0.113.5 (excessive failures)
[SECURITY] Encryption bypass attempt detected
[SECURITY] Anti-debugger triggered
```

**Anomalies:**
```
[ANOMALY] Unusual request rate from IP: 10.0.0.50
[ANOMALY] Geographic anomaly: US → China in 1 minute
[ANOMALY] Fingerprint spoofing detected
```

---

## 📞 Contact

**Security Issues:** security@proofcaptcha.com

**General Support:** support@proofcaptcha.com

**Bug Reports:** https://github.com/your-org/proofcaptcha/issues

---

<div align="center">
  <p><strong>ProofCaptcha Security Team</strong></p>
  <p>Committed to keeping your applications secure</p>
</div>
