<div align="center">

![ProofCaptcha Logo](attached_assets/generated_images/ProofCaptcha_shield_logo_98b0f54f.png)

# Security Policy & Architecture

### Dokumentasi Keamanan ProofCaptcha

</div>

---

## 📋 Daftar Isi

- [Ringkasan Keamanan](#-ringkasan-keamanan)
- [Reporting Security Vulnerabilities](#-reporting-security-vulnerabilities)
- [Arsitektur Keamanan](#-arsitektur-keamanan)
- [Enkripsi End-to-End](#-enkripsi-end-to-end)
- [Bot Detection System](#-bot-detection-system)
- [Anti-Debugger Protection](#-anti-debugger-protection)
- [Code Obfuscation](#-code-obfuscation)
- [Session Security](#-session-security)
- [API Security](#-api-security)
- [Data Protection](#-data-protection)
- [Compliance & Standards](#-compliance--standards)
- [Security Best Practices](#-security-best-practices)

---

## 🛡️ Ringkasan Keamanan

ProofCaptcha mengimplementasikan arsitektur keamanan berlapis dengan 7 layer proteksi independen:

1. **Domain Validation** - Validasi domain sebelum generate challenge
2. **End-to-End Encryption** - ECDH + HKDF + AES-256-GCM
3. **Bot Detection** - Multi-layer detection dengan 60+ signals
4. **Anti-Debugger** - Multiple techniques untuk prevent debugging
5. **Code Obfuscation** - String encryption & control flow flattening
6. **Session Binding** - Bind tokens ke device fingerprint & IP
7. **CSRF Protection** - Token-based protection untuk mutations

### Keamanan yang SELALU Aktif (Tidak Dapat Dinonaktifkan)

Berikut adalah fitur keamanan core yang **SELALU AKTIF** di server-side:

- ✅ **Domain Validation**: Semua requests divalidasi terhadap allowed domains
- ✅ **End-to-End Encryption**: Dikelola server-side, client tidak bisa disable
- ✅ **Session Management**: Session validation & binding selalu aktif
- ✅ **Token Validation**: Semua tokens diverifikasi dengan JWT
- ✅ **Replay Attack Prevention**: Used tokens tracked & rejected
- ✅ **Challenge Expiration**: Auto-cleanup expired challenges

### Keamanan yang Dapat Dikonfigurasi

Fitur-fitur ini dapat di-enable/disable per API key sesuai kebutuhan:

- ⚙️ Anti-Debugger Protection
- ⚙️ Advanced Fingerprinting (Canvas, WebGL, Audio)
- ⚙️ Session Binding
- ⚙️ CSRF Protection
- ⚙️ IP Rate Limiting
- ⚙️ Automation Detection
- ⚙️ Behavioral Analysis
- ⚙️ Risk Adaptive Difficulty

---

## 🚨 Reporting Security Vulnerabilities

Kami sangat menghargai security researchers yang membantu menjaga keamanan ProofCaptcha.

### Responsible Disclosure Process

1. **JANGAN** membuat public GitHub issue untuk security vulnerabilities
2. Kirim email ke: **security@proofcaptcha.com** dengan:
   - Deskripsi detail vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (jika ada)
3. Kami akan merespons dalam **48 jam**
4. Kami akan bekerja dengan Anda untuk verify dan fix vulnerability
5. Setelah fix deployed, kami akan:
   - Credit Anda di security advisories (kecuali Anda memilih anonymous)
   - Publish security advisory
   - Notify users untuk update

### Vulnerability Severity Levels

**Critical** - Immediate action required
- Remote code execution
- Authentication bypass
- Sensitive data exposure

**High** - Fix dalam 7 hari
- Privilege escalation
- SQL injection
- XSS vulnerabilities

**Medium** - Fix dalam 30 hari
- CSRF vulnerabilities
- Information disclosure
- Denial of Service

**Low** - Fix dalam next release
- Minor security improvements
- Best practice violations

### Bug Bounty Program

Saat ini kami belum memiliki formal bug bounty program, namun kami memberikan:
- Public recognition (jika diinginkan)
- Detailed security advisory credit
- Swag (untuk critical/high severity)

---

## 🏗️ Arsitektur Keamanan

### Multi-Layer Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Layer 7: CSRF Protection                      │ │
│  │         Token validation untuk mutations                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Layer 6: Session Binding                      │ │
│  │         Bind token ke device fingerprint + IP              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Layer 5: Code Obfuscation                     │ │
│  │      String encryption + Control flow flattening           │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Layer 4: Anti-Debugger                        │ │
│  │      Debugger detection & DevTools prevention              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                         Server (Backend)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Layer 3: Bot Detection                        │ │
│  │   Automation + Behavioral + Fingerprinting + Honeypot      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Layer 2: End-to-End Encryption (E2EE)              │ │
│  │    ECDH Key Exchange → HKDF → AES-256-GCM Encryption       │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Layer 1: Domain Validation                    │ │
│  │         Validate origin sebelum generate challenge         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                         │
│              Encrypted at rest, TLS in transit                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Enkripsi End-to-End

ProofCaptcha menggunakan **Progressive Enhancement** approach untuk enkripsi:
- **Jika browser support Web Crypto API**: E2EE digunakan (AES-256-GCM)
- **Jika browser tidak support**: Fallback ke unencrypted (tetap aman via HTTPS)

Server **SELALU MENGONTROL** mode enkripsi untuk mencegah downgrade attacks.

### Cryptographic Protocols

#### 1. Key Exchange - ECDH (Elliptic Curve Diffie-Hellman)

**Curve**: NIST P-256 (secp256r1)

```javascript
// Client-side
const clientKeyPair = await window.crypto.subtle.generateKey(
  {
    name: "ECDH",
    namedCurve: "P-256"
  },
  true,
  ["deriveKey", "deriveBits"]
);

// Export public key untuk dikirim ke server
const clientPublicKeyJwk = await window.crypto.subtle.exportKey(
  "jwk",
  clientKeyPair.publicKey
);
```

**Mengapa ECDH?**
- ✅ Perfect Forward Secrecy (PFS)
- ✅ Setiap session punya unique key
- ✅ Compromise satu session tidak affect sessions lain
- ✅ Lightweight dan fast
- ✅ Well-tested dan widely-supported

#### 2. Key Derivation - HKDF (HMAC-based Key Derivation Function)

```javascript
// Derive shared secret dari ECDH
const sharedSecret = await window.crypto.subtle.deriveBits(
  {
    name: "ECDH",
    public: serverPublicKey
  },
  clientKeyPair.privateKey,
  256 // 256 bits
);

// Derive encryption key menggunakan HKDF
const encryptionKey = await window.crypto.subtle.deriveKey(
  {
    name: "HKDF",
    hash: "SHA-256",
    salt: new Uint8Array(32), // Random salt
    info: new TextEncoder().encode("ProofCaptcha-v1")
  },
  sharedSecret,
  {
    name: "AES-GCM",
    length: 256
  },
  false,
  ["encrypt", "decrypt"]
);
```

**Mengapa HKDF?**
- ✅ Derive cryptographically strong keys dari shared secret
- ✅ Salt mencegah rainbow table attacks
- ✅ Info parameter untuk key separation
- ✅ Recommended oleh NIST SP 800-56C

#### 3. Encryption - AES-256-GCM (Advanced Encryption Standard - Galois/Counter Mode)

```javascript
// Encrypt challenge data
const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
const encrypted = await window.crypto.subtle.encrypt(
  {
    name: "AES-GCM",
    iv: iv,
    tagLength: 128 // 128-bit authentication tag
  },
  encryptionKey,
  plaintext
);

// Result: { encrypted, iv, authTag }
```

**Mengapa AES-256-GCM?**
- ✅ **Authenticated Encryption**: Integrity + Confidentiality dalam satu operation
- ✅ **256-bit key**: Quantum-resistant hingga tahun 2030+
- ✅ **GCM mode**: 
  - Parallel processing (fast)
  - Built-in authentication (mencegah tampering)
  - NIST approved
- ✅ **Authentication Tag**: Deteksi modification/corruption
- ✅ **Industry Standard**: Digunakan TLS 1.3, IPsec, etc

### End-to-End Encryption Flow

```
┌─────────────┐                                    ┌─────────────┐
│   Client    │                                    │   Server    │
└──────┬──────┘                                    └──────┬──────┘
       │                                                  │
       │  1. Request Public Key                          │
       ├─────────────────────────────────────────────────→
       │                                                  │
       │  2. Return Server Public Key (ECDH P-256)       │
       ←─────────────────────────────────────────────────┤
       │                                                  │
       │  3. Generate Client Keypair (ECDH P-256)        │
       ├──┐                                              │
       │  │                                              │
       │←─┘                                              │
       │                                                  │
       │  4. Compute Shared Secret (ECDH)                │
       ├──┐                                              │
       │  │ sharedSecret = ECDH(clientPrivate,           │
       │←─┘              serverPublic)                   │
       │                                                  │
       │  5. Derive Session Key (HKDF-SHA256)            │
       ├──┐                                              │
       │  │ sessionKey = HKDF(sharedSecret,              │
       │←─┘            salt, "ProofCaptcha-v1")          │
       │                                                  │
       │  6. Request Challenge                           │
       │     + Client Public Key                         │
       ├─────────────────────────────────────────────────→
       │                                                  │
       │                      7. Validate Domain         │
       │                      ├──┐                       │
       │                      │←─┘                       │
       │                                                  │
       │                      8. Compute Shared Secret   │
       │                      ├──┐                       │
       │                      │  │ ECDH(serverPrivate,   │
       │                      │←─┘      clientPublic)    │
       │                                                  │
       │                      9. Derive Session Key      │
       │                      ├──┐                       │
       │                      │←─┘ HKDF-SHA256           │
       │                                                  │
       │                      10. Generate Challenge     │
       │                      ├──┐                       │
       │                      │←─┘                       │
       │                                                  │
       │                      11. Encrypt Challenge      │
       │                      ├──┐                       │
       │                      │  │ AES-256-GCM           │
       │                      │←─┘ iv = random(12 bytes) │
       │                                                  │
       │  12. Return Encrypted Challenge                 │
       │      { encrypted, iv, authTag }                 │
       ←─────────────────────────────────────────────────┤
       │                                                  │
       │  13. Decrypt Challenge (AES-256-GCM)            │
       ├──┐                                              │
       │  │ Verify authTag                               │
       │←─┘                                              │
       │                                                  │
       │  14. User Solves Challenge                      │
       ├──┐                                              │
       │←─┘                                              │
       │                                                  │
       │  15. Encrypt Solution (AES-256-GCM)             │
       ├──┐                                              │
       │  │ iv = random(12 bytes)                        │
       │←─┘                                              │
       │                                                  │
       │  16. Submit Encrypted Solution                  │
       │      { token, encrypted, iv, authTag }          │
       ├─────────────────────────────────────────────────→
       │                                                  │
       │                      17. Decrypt Solution       │
       │                      ├──┐                       │
       │                      │  │ AES-256-GCM           │
       │                      │←─┘ Verify authTag        │
       │                                                  │
       │                      18. Verify Solution        │
       │                      ├──┐                       │
       │                      │←─┘                       │
       │                                                  │
       │                      19. Run Bot Detection      │
       │                      ├──┐                       │
       │                      │←─┘                       │
       │                                                  │
       │                      20. Generate JWT Token     │
       │                      ├──┐                       │
       │                      │←─┘                       │
       │                                                  │
       │  21. Return Verification Token                  │
       ←─────────────────────────────────────────────────┤
       │                                                  │
```

### Security Properties

✅ **Confidentiality**: Challenge & solution data terenkripsi dengan AES-256-GCM
✅ **Integrity**: Authentication tags mencegah tampering
✅ **Authentication**: Server & client verify identities via ECDH
✅ **Perfect Forward Secrecy**: Setiap session unique keys
✅ **Replay Protection**: IV unique per encryption, tokens tracked
✅ **Downgrade Protection**: Server controls encryption mode

### Key Management

**Session Keys**:
- Generated per session menggunakan ECDH + HKDF
- Cached di memory dengan automatic rotation
- Never stored permanently
- Auto-expired setelah session ends

**API Keys**:
- Sitekey (public): Safe untuk expose di client-side
- Secret key (private): **NEVER** expose ke client
- Stored dengan bcrypt hashing di database
- Rotatable via dashboard

---

## 🤖 Bot Detection System

ProofCaptcha menggunakan **Multi-Signal Bot Detection** dengan 60+ data points.

### 1. Automation Detection

Mendeteksi automation frameworks dan headless browsers.

**Signals Detected:**
- Headless browsers (Puppeteer, Playwright, Selenium)
- Browser automation drivers (ChromeDriver, GeckoDriver)
- User-Agent patterns (bot, crawler, scraper)
- Missing browser headers (Accept-Language, Accept-Encoding)
- Automation-specific headers (Chrome-Lighthouse, WebDriver)
- DevTools Protocol WebSocket connections

**Detection Logic:**
```javascript
// Score-based system (0-100)
let score = 0;

// High confidence indicators (+40-50 points)
if (userAgent.includes('headless')) score += 50;
if (userAgent.includes('puppeteer')) score += 50;
if (headers['chrome-lighthouse']) score += 30;

// Medium confidence indicators (+15-30 points)
if (!headers['accept-language']) score += 15;
if (!headers['accept-encoding']) score += 15;

// Threshold: score >= 50 = automation detected
const isAutomation = score >= 50;
```

**Response:**
- **Score < 50**: Allow dengan normal difficulty
- **Score 50-80**: Increase difficulty, add behavioral checks
- **Score > 80**: Block atau require additional verification

### 2. Behavioral Analysis

Analisis pola interaksi user untuk identify bot behavior.

**Patterns Analyzed:**

**A. Timing Patterns**
```javascript
// Perfectly timed requests (bot characteristic)
const intervals = [1000, 1000, 1000, 1000]; // Too perfect!
const avgInterval = 1000;
const variance = 0; // Red flag!

if (variance < 100 && avgInterval < 2000) {
  patterns.push('perfectly-timed-requests');
  confidence += 30;
}
```

**B. Request Velocity**
```javascript
// Too fast requests
if (avgInterval < 500) {
  patterns.push('too-fast-requests');
  confidence += 25;
}

// Burst patterns
const recentRequests = timestamps.filter(t => now - t < 10000);
if (recentRequests.length > 10) {
  patterns.push('burst-pattern');
  confidence += 25;
}
```

**C. User-Agent Switching**
```javascript
// Multiple user agents dari same IP (bot characteristic)
if (uniqueUserAgents.size > 3) {
  patterns.push('multiple-user-agents');
  confidence += 20;
}
```

**D. Mouse & Keyboard Telemetry**
```javascript
// Analyzed from frontend submissions
const mouseMovements = telemetry.mouseMovements;
const keyboardEvents = telemetry.keyboardEvents;

// Missing interactions = bot
if (mouseMovements === 0 && keyboardEvents === 0) {
  patterns.push('no-human-interactions');
  confidence += 40;
}

// Robotic movements (linear, no acceleration)
if (isLinearMovement(mouseMovements)) {
  patterns.push('robotic-mouse-movement');
  confidence += 25;
}
```

**Confidence Scoring:**
- **0-30**: Likely human
- **31-60**: Suspicious, increase monitoring
- **61-80**: Likely bot, increase difficulty
- **81-100**: Confirmed bot, block

### 3. Advanced Fingerprinting

Generate unique device fingerprint dari 60+ browser characteristics.

**Components Collected:**

**A. Canvas Fingerprinting** (20 points confidence)
```javascript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.textBaseline = 'top';
ctx.font = '14px Arial';
ctx.fillText('ProofCaptcha', 2, 2);
const canvasHash = sha256(canvas.toDataURL());
```

**B. WebGL Fingerprinting** (20 points confidence)
```javascript
const gl = canvas.getContext('webgl');
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
```

**C. Audio Context Fingerprinting** (15 points confidence)
```javascript
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const analyser = audioContext.createAnalyser();
const compressor = audioContext.createDynamicsCompressor();
// Analyze audio processing characteristics
```

**D. Font Detection** (10 points confidence)
```javascript
const baseFonts = ['monospace', 'sans-serif', 'serif'];
const testFonts = ['Arial', 'Verdana', 'Times New Roman', /* 50+ more */];
// Detect installed fonts via canvas text rendering
```

**E. Screen Fingerprint** (10 points confidence)
```javascript
{
  width: screen.width,
  height: screen.height,
  colorDepth: screen.colorDepth,
  pixelRatio: window.devicePixelRatio,
  availWidth: screen.availWidth,
  availHeight: screen.availHeight
}
```

**F. Browser Characteristics** (25 points total)
```javascript
{
  plugins: navigator.plugins,           // 5 points
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // 5 points
  platform: navigator.platform,         // 5 points
  hardwareConcurrency: navigator.hardwareConcurrency, // 3 points
  deviceMemory: navigator.deviceMemory, // 3 points
  languages: navigator.languages,       // 2 points
  doNotTrack: navigator.doNotTrack     // 2 points
}
```

**Fingerprint Generation:**
```javascript
// Combine all components
const fingerprintString = [
  `canvas:${canvasHash}`,
  `webgl:${webglHash}`,
  `audio:${audioHash}`,
  `fonts:${fontsHash}`,
  `screen:${screenHash}`,
  `platform:${platform}`,
  // ... more components
].join('|');

// Generate final fingerprint
const fingerprint = sha256(fingerprintString);

// Confidence score
const confidence = totalPoints; // 0-100
const isReliable = confidence >= 60;
```

**Uses:**
- Session binding (prevent token theft)
- Detect device spoofing
- Track repeat offenders
- Adaptive difficulty based on device trust

### 4. Honeypot Detection

Invisible form fields untuk catch automated submissions.

**Implementation:**
```html
<!-- Invisible honeypot fields -->
<input 
  type="text" 
  name="email_confirm" 
  value=""
  tabindex="-1"
  autocomplete="off"
  aria-hidden="true"
  style="position:absolute; left:-9999px; width:1px; height:1px; opacity:0;"
/>
```

**Detection Logic:**
```javascript
const honeypotFields = [
  'email_confirm',
  'phone_verify',
  'website',
  'company_name',
  'full_address'
];

const triggeredFields = [];
for (const field of honeypotFields) {
  const value = req.body[field];
  if (value !== undefined && value !== '') {
    triggeredFields.push(field);
  }
}

const isBot = triggeredFields.length > 0;
const confidence = Math.min(triggeredFields.length * 50, 100);
```

**Why Effective:**
- Human users tidak pernah melihat/mengisi fields ini
- Bots otomatis fill semua form fields
- Screen readers skip fields dengan aria-hidden="true"
- 100% accuracy jika triggered

### 5. IP Reputation & Rate Limiting

Track IP addresses dan enforce rate limits.

**Rate Limiting:**
```javascript
// Per-IP rate limiting
const rateLimitConfig = {
  windowMs: 60000,        // 1 minute window
  maxRequests: 30,        // Max 30 requests per window
  skipSuccessfulRequests: false
};

// Sliding window counter
const requestCount = ipRequestHistory.get(clientIP).length;
if (requestCount > rateLimitConfig.maxRequests) {
  return {
    blocked: true,
    reason: 'Rate limit exceeded',
    retryAfter: rateLimitConfig.windowMs
  };
}
```

**IP Blocking:**
```javascript
// Automatic blocking after failed attempts
const failedAttempts = ipFailureHistory.get(clientIP);
if (failedAttempts >= 5) {
  blockIP(clientIP, duration: 3600000); // Block for 1 hour
}

// Manual blocking via dashboard
const blockedIps = apiKeySettings.blockedIps; // CIDR notation support
if (isIPBlocked(clientIP, blockedIps)) {
  return { blocked: true, reason: 'IP blocked by administrator' };
}
```

**Country Blocking:**
```javascript
// GeoIP lookup
const geoData = geoip.lookup(clientIP);
const country = geoData?.country; // ISO code (e.g., "CN", "RU")

const blockedCountries = apiKeySettings.blockedCountries;
if (blockedCountries.includes(country)) {
  return { blocked: true, reason: 'Country blocked' };
}
```

### 6. Risk Scoring

Aggregate semua signals menjadi single risk score (0-100).

**Risk Calculation:**
```javascript
let riskScore = 0;

// Automation detection (weight: 40)
if (automationDetected) {
  riskScore += automationScore * 0.4;
}

// Behavioral analysis (weight: 25)
riskScore += behavioralConfidence * 0.25;

// Fingerprint validity (weight: 15)
if (!fingerprintValid) {
  riskScore += 15;
}

// IP reputation (weight: 10)
riskScore += ipRiskScore * 0.1;

// Honeypot triggered (weight: 10)
if (honeypotTriggered) {
  riskScore += 10;
}

// Final score: 0-100
riskScore = Math.min(riskScore, 100);
```

**Risk Categories:**
- **0-20**: Low risk - Normal difficulty
- **21-40**: Medium risk - Slightly increased difficulty
- **41-60**: High risk - Significantly increased difficulty
- **61-80**: Very high risk - Maximum difficulty + additional checks
- **81-100**: Extreme risk - Block or require manual verification

**Adaptive Difficulty:**
```javascript
if (riskAdaptiveDifficulty enabled) {
  if (riskScore < 20) difficulty = 3;      // Easy
  else if (riskScore < 40) difficulty = 4; // Normal
  else if (riskScore < 60) difficulty = 6; // Hard
  else difficulty = 8;                     // Very Hard
}
```

---

## 🚫 Anti-Debugger Protection

Multiple layers untuk detect dan prevent debugging attempts.

### Layer 1: Debugger Statement Traps

```javascript
setInterval(() => {
  debugger; // Triggers breakpoint jika DevTools open
}, 100);
```

**Detection:**
- Execution pause = DevTools detected
- Automatic response: Clear sensitive data, reload page

### Layer 2: DevTools Detection via Timing

```javascript
const start = performance.now();
debugger;
const end = performance.now();

// Jika DevTools open, execution delayed significantly
if (end - start > 100) {
  // DevTools detected!
  handleDevToolsDetected();
}
```

### Layer 3: Viewport Monitoring

```javascript
// DevTools mengubah window dimensions
const threshold = 160;
const widthThreshold = window.outerWidth - window.innerWidth > threshold;
const heightThreshold = window.outerHeight - window.innerHeight > threshold;

if (widthThreshold || heightThreshold) {
  // DevTools likely open
  handleDevToolsDetected();
}
```

### Layer 4: Console Detection

```javascript
// Detect console.log redirection
const devtools = /./;
devtools.toString = function() {
  // Called ketika console open
  handleDevToolsDetected();
  return '';
};

console.log('%c', devtools);
```

### Layer 5: Function Integrity Checks

```javascript
// Detect function override/tampering
const originalFetch = window.fetch;
setInterval(() => {
  if (window.fetch !== originalFetch) {
    // Function overridden - potential tampering
    handleTampering();
  }
}, 1000);
```

### Response Actions

When debugging detected:
1. ⚠️ **Warning**: Show warning message
2. 🔒 **Clear Data**: Clear sensitive data dari memory
3. 🔄 **Reload**: Force page reload
4. 🚫 **Block**: Block further actions
5. 📊 **Log**: Report ke server untuk analytics

---

## 🔒 Code Obfuscation

Production JavaScript code diobfuscate untuk prevent reverse engineering.

### Obfuscation Techniques

#### 1. Control Flow Flattening

Transform control flow menjadi switch statement yang kompleks.

**Before:**
```javascript
function validateUser(user) {
  if (user.isAdmin) {
    return true;
  } else {
    return false;
  }
}
```

**After:**
```javascript
function validateUser(user) {
  var _0x1a2b = 0;
  while (true) {
    switch (_0x1a2b) {
      case 0:
        if (user.isAdmin) _0x1a2b = 1;
        else _0x1a2b = 2;
        break;
      case 1:
        return true;
      case 2:
        return false;
    }
  }
}
```

#### 2. Dead Code Injection

Inject non-functional code untuk confuse analysis.

```javascript
// Random dead code
var _0x3c4d = function() {
  var _0x5e6f = Math.random();
  if (_0x5e6f > 2) { // Never true
    console.log('dead code');
  }
};
```

#### 3. String Encryption (RC4)

Encrypt string literals menggunakan RC4 cipher.

**Before:**
```javascript
const apiKey = "pk_12345";
```

**After:**
```javascript
const _0x7g8h = "2f8a9b3c4d5e6f7g"; // Encrypted
const apiKey = rc4Decrypt(_0x7g8h, "secretKey");
```

#### 4. Variable Name Mangling

Rename variables ke meaningless names.

**Before:**
```javascript
function calculateRiskScore(userBehavior, ipReputation) {
  const baseScore = 0;
  const riskScore = baseScore + userBehavior + ipReputation;
  return riskScore;
}
```

**After:**
```javascript
function _0xa1b2(_0xc3d4, _0xe5f6) {
  const _0xg7h8 = 0;
  const _0xi9j0 = _0xg7h8 + _0xc3d4 + _0xe5f6;
  return _0xi9j0;
}
```

#### 5. Compact Code

Remove whitespace dan minify.

```javascript
function _0xa1b2(_0xc3d4,_0xe5f6){const _0xg7h8=0;const _0xi9j0=_0xg7h8+_0xc3d4+_0xe5f6;return _0xi9j0;}
```

### Build Process

```bash
# Development (readable)
npm run dev

# Production (obfuscated)
npm run build
```

**Obfuscation Config:**
```javascript
{
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: 2000,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  rotateStringArray: true,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
}
```

### Anti-Tampering

Code includes self-defending mechanisms:

```javascript
// Detect code modification
const originalCode = getOriginalCodeHash();
setInterval(() => {
  const currentCode = getCurrentCodeHash();
  if (currentCode !== originalCode) {
    // Code modified - self-destruct
    destroyApplication();
  }
}, 5000);
```

---

## 🔑 Session Security

### Session Binding

Bind challenge tokens ke session fingerprints untuk prevent token theft.

**Session Fingerprint Components:**
```javascript
const sessionFingerprint = sha256([
  deviceFingerprint,     // 60+ data points
  ipAddress,            // Client IP
  userAgent,            // Browser info
  acceptLanguage,       // Language preference
  timezone             // Timezone
].join('|'));
```

**Validation:**
```javascript
// During verification
const storedFingerprint = challenge.sessionFingerprint;
const currentFingerprint = generateSessionFingerprint(req);

if (storedFingerprint !== currentFingerprint) {
  return {
    success: false,
    error: 'Session mismatch - possible token theft'
  };
}
```

**Security Benefits:**
- ✅ Prevent token theft & replay attacks
- ✅ Detect session hijacking
- ✅ Bind tokens to specific devices
- ✅ Prevent CSRF with stolen tokens

### Session Expiration

```javascript
// Challenge tokens
const CHALLENGE_EXPIRY = 60000; // 1 minute

// Verification tokens
const VERIFICATION_EXPIRY = 60000; // 1 minute

// Automatic cleanup
setInterval(() => {
  cleanupExpiredChallenges();
  cleanupExpiredVerifications();
}, 60000);
```

---

## 🌐 API Security

### 1. Domain Validation

**ALWAYS** validate request origin sebelum generate challenges.

```javascript
// Extract domain from request
const origin = req.headers.origin || req.headers.referer;
const requestDomain = extractDomain(origin);

// Validate against allowed domains
const allowedDomain = apiKey.domain;
if (allowedDomain && requestDomain !== allowedDomain) {
  return {
    success: false,
    error: 'Domain not authorized',
    message: `Requests only allowed from: ${allowedDomain}`
  };
}
```

**Configuration:**
```javascript
// Set allowed domain in dashboard
apiKey.domain = "example.com"; // Only requests from example.com allowed

// Wildcard subdomains (future feature)
apiKey.domain = "*.example.com"; // All subdomains allowed
```

### 2. API Key Security

**Sitekey (Public)**:
- ✅ Safe untuk expose di client-side HTML/JavaScript
- ✅ Used untuk initialize widget
- ✅ Format: `pk_xxxxxxxxxxxxx`

**Secret Key (Private)**:
- ❌ **NEVER** expose ke client-side
- ❌ **NEVER** commit ke Git
- ✅ Store di environment variables
- ✅ Used hanya di backend verification
- ✅ Format: `sk_xxxxxxxxxxxxx`

**Best Practices:**
```bash
# .env file (backend only)
PROOFCAPTCHA_SECRET_KEY=sk_your_secret_key_here

# Never do this!
<script>
  const SECRET_KEY = "sk_xxxxx"; // ❌ EXPOSED!
</script>
```

### 3. HTTPS Enforcement

```javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.protocol !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.hostname + req.url);
  }
  next();
});
```

### 4. Security Headers

```javascript
// Helmet.js security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

### 5. CORS Configuration

```javascript
// Strict CORS policy
app.use(cors({
  origin: function(origin, callback) {
    // Validate origin against API key's allowed domain
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 🗄️ Data Protection

### 1. Password Security

```javascript
// Hashing dengan bcrypt (cost factor 12)
const hashedPassword = await bcrypt.hash(password, 12);

// Verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Security Properties:**
- ✅ Adaptive hashing (cost factor dapat ditingkatkan)
- ✅ Built-in salting
- ✅ Resistant terhadap rainbow tables
- ✅ Slow by design (prevent brute force)

### 2. Token Security

**JWT Tokens:**
```javascript
const token = jwt.sign(
  { 
    challengeId: challenge.id,
    sitekey: apiKey.sitekey,
    timestamp: Date.now()
  },
  apiKey.secretkey,
  { 
    expiresIn: '1m',
    algorithm: 'HS256'
  }
);
```

**Verification:**
```javascript
try {
  const decoded = jwt.verify(token, secretKey);
  // Token valid
} catch (err) {
  // Token invalid/expired
  return { success: false, error: 'Invalid token' };
}
```

### 3. Database Security

**Connection Security:**
```javascript
// SSL/TLS connection
const db = postgres(DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true
  } : false
});
```

**SQL Injection Prevention:**
```javascript
// ✅ GOOD - Parameterized queries
await db.select().from(users).where(eq(users.email, email));

// ❌ BAD - String concatenation
await db.execute(`SELECT * FROM users WHERE email = '${email}'`);
```

### 4. Sensitive Data Handling

**Email Service:**
```javascript
// Never log sensitive data
console.log(`Sending email to: ${email.replace(/./g, '*')}`);

// Use environment variables
const emailConfig = {
  host: process.env.EMAIL_HOST,
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS
};
```

**API Keys:**
```javascript
// Never expose secret keys
console.log(`API Key: ${sitekey}`); // ✅ OK (public key)
console.log(`Secret: ${secretkey.substring(0, 8)}***`); // ✅ OK (masked)
console.log(`Secret: ${secretkey}`); // ❌ NEVER
```

### 5. Data Retention

**Automatic Cleanup:**
```javascript
// Daily cleanup task
cron.schedule('0 0 * * *', async () => {
  // Delete challenges older than 24 hours
  await cleanupExpiredChallenges();
  
  // Delete verifications older than 90 days
  await cleanupOldVerifications();
  
  // Aggregate & archive analytics
  await aggregateAnalytics();
});
```

**Retention Periods:**
- Challenges: 24 hours
- Verifications: 90 days
- Analytics: 1 year (aggregated)
- Developer accounts: Until deletion request

---

## ✅ Compliance & Standards

### GDPR Compliance

ProofCaptcha fully compliant dengan GDPR:

✅ **Right to Access**: Users dapat request data mereka
✅ **Right to Erasure**: Delete account menghapus semua data
✅ **Data Minimization**: Hanya collect data yang necessary
✅ **Purpose Limitation**: Data hanya untuk bot protection
✅ **Transparency**: Clear privacy policy & data usage
✅ **Security**: Encryption at rest & in transit
✅ **Data Portability**: Export data dalam JSON format
✅ **Consent**: Clear opt-in untuk data collection

### Standards Compliance

**Cryptographic Standards:**
- ✅ NIST FIPS 140-2 compliant algorithms
- ✅ NIST SP 800-56C (Key Derivation)
- ✅ NIST SP 800-38D (AES-GCM)
- ✅ RFC 5869 (HKDF)
- ✅ RFC 6090 (ECC)

**Security Best Practices:**
- ✅ OWASP Top 10 protection
- ✅ CWE/SANS Top 25 mitigation
- ✅ NIST Cybersecurity Framework
- ✅ ISO 27001 alignment

---

## 🔧 Security Best Practices

### For Developers Integrating ProofCaptcha

#### 1. Never Expose Secret Keys

```javascript
// ❌ WRONG - Secret key in frontend
<script>
  const secret = "sk_xxxxx";
</script>

// ✅ CORRECT - Secret key in backend only
// .env file
PROOFCAPTCHA_SECRET=sk_xxxxx

// server.js
const secret = process.env.PROOFCAPTCHA_SECRET;
```

#### 2. Always Verify Backend

```javascript
// ❌ WRONG - Trust client-side only
if (captchaCompleted) {
  submitForm(); // Can be bypassed!
}

// ✅ CORRECT - Verify on backend
const response = await fetch('/api/verify', {
  method: 'POST',
  body: JSON.stringify({ captchaToken })
});
```

#### 3. Use HTTPS

```bash
# ❌ WRONG
http://example.com/api/verify

# ✅ CORRECT
https://example.com/api/verify
```

#### 4. Implement Rate Limiting

```javascript
// Backend rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

#### 5. Monitor & Alert

```javascript
// Log failed verifications
if (!verifyResult.success) {
  logger.warn('Failed CAPTCHA verification', {
    ip: clientIP,
    reason: verifyResult.error,
    timestamp: Date.now()
  });
  
  // Alert on suspicious patterns
  if (failureCount > threshold) {
    alertSecurity('Possible bot attack', { ip: clientIP });
  }
}
```

### For ProofCaptcha Administrators

#### 1. Regular Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Security audit
npm audit
npm audit fix
```

#### 2. Security Monitoring

- Monitor failed verification rates
- Track blocked IPs & countries
- Review security logs daily
- Set up alerts untuk anomalies

#### 3. Backup & Recovery

```bash
# Database backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automated daily backups
cron: 0 2 * * * /scripts/backup.sh
```

#### 4. Incident Response Plan

1. **Detection**: Monitor logs & alerts
2. **Containment**: Block attacking IPs
3. **Analysis**: Investigate attack vectors
4. **Recovery**: Restore from backups jika needed
5. **Lessons Learned**: Update defenses

---

## 📞 Security Contact

**Security Team**: security@proofcaptcha.com

**Response Time**: 48 hours untuk initial response

**Supported Languages**: English, Bahasa Indonesia

---

<div align="center">

**Keamanan adalah prioritas utama kami** 🛡️

[Report Vulnerability](mailto:security@proofcaptcha.com) • [Security Updates](https://proofcaptcha.com/security) • [Bug Bounty](https://proofcaptcha.com/bounty)

</div>
