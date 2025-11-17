# ProofCaptcha

<div align="center">
  <img src="attached_assets/generated_images/ProofCaptcha_shield_logo_98b0f54f.png" alt="ProofCaptcha Logo" width="200"/>
  
  **Advanced Proof-of-Work CAPTCHA System**
  
  Self-hosted, privacy-first bot protection with end-to-end encryption and multi-language support
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Security: A+](https://img.shields.io/badge/Security-A%2B-green.svg)](SECURITY.md)
</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Quick Start](#quick-start)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [Integration Guide](#integration-guide)
  - [Frontend Integration](#frontend-integration)
  - [Backend Verification](#backend-verification)
- [Challenge Types](#challenge-types)
- [API Reference](#api-reference)
- [Security Features](#security-features)
- [Advanced Configuration](#advanced-configuration)
- [Obfuscation & Anti-Debugger](#obfuscation--anti-debugger)
- [Analytics Dashboard](#analytics-dashboard)
- [Internationalization (i18n)](#internationalization-i18n)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

**ProofCaptcha** adalah sistem CAPTCHA modern berbasis proof-of-work yang dirancang untuk melindungi website dari bot dan automated attacks. Berbeda dengan CAPTCHA tradisional, ProofCaptcha menawarkan:

- 🔐 **End-to-End Encryption**: Semua challenge dan solution data terenkripsi dengan ECDH + AES-GCM
- 🛡️ **Multi-Layer Security**: Fingerprinting, anti-debugger, behavioral analysis, dan obfuscation
- 🌍 **Multi-Language Support**: Support bahasa Indonesia dan Inggris dengan i18next
- 📊 **Analytics Dashboard**: Monitor traffic, success rate, dan geographic distribution
- 🎨 **4 Challenge Types**: Grid, Jigsaw, Gesture, dan Upside-Down
- 🔒 **Privacy-First**: Self-hosted, tidak melacak pengguna, tidak menjual data

### Mengapa ProofCaptcha?

- ✅ **Lebih Aman**: End-to-end encryption dengan server-side control mencegah downgrade attacks
- ✅ **Lebih Modern**: Interactive challenges yang engaging untuk user
- ✅ **Developer-Friendly**: Easy integration dengan API yang simple dan dokumentasi lengkap
- ✅ **Privacy First**: Self-hosted, kontrol penuh atas data Anda
- ✅ **Production-Ready**: Code obfuscation, anti-debugger, dan security hardening built-in

---

## 🚀 Key Features

### Security Features
- 🔐 **End-to-End Encryption**: ECDH (P-256) + HKDF + AES-256-GCM
- 🛡️ **Server-Side Encryption Control**: Server determines encryption mode, prevents downgrade attacks
- 🔑 **Session-Based Key Management**: Unique encryption keys per session with hourly rotation
- 🎯 **Domain Validation**: API keys tied to specific domains with strict validation
- ⏱️ **Token Expiration**: Configurable challenge and verification token expiry
- 🚫 **Replay Attack Prevention**: Single-use tokens with HMAC signatures
- 📊 **Risk Scoring**: Automated risk analysis of each request
- 🤖 **Bot Detection**: Multi-layer detection (fingerprint, behavior, automation tools)
- 🔒 **Anti-Debugger**: Detects and prevents DevTools usage with premium animations
- 🎭 **Code Obfuscation**: RC4 string encryption, control flow flattening, dead code injection
- 🍯 **Honeypot Detection**: Invisible form fields and timing analysis
- 🌐 **IP & Country Blocking**: Per-API-key IP and country blocking configuration

### Developer Experience
- 📦 **Easy Integration**: 3 lines of code to add CAPTCHA widget
- 🔄 **reCAPTCHA v2 Compatible**: Drop-in replacement API
- 🎨 **4 Challenge Types**: Grid, Jigsaw, Gesture, Upside-Down
- 📱 **Responsive Design**: Mobile and desktop optimized
- 🌐 **Multi-Language**: Built-in i18n with English and Indonesian
- 📈 **Analytics Dashboard**: Real-time traffic monitoring and insights
- ⚙️ **Per-API-Key Settings**: Configure security features for each application
- 🔧 **Flexible Configuration**: Customize difficulty, timeouts, rate limits, and more

### Analytics & Monitoring
- 📊 **Real-Time Dashboard**: Monitor challenges, verifications, success rates
- 🌍 **Geographic Analytics**: Track traffic by country with detailed location data
- 📈 **Performance Metrics**: Average solve time, unique IPs, challenge distribution
- 🚨 **Security Events**: Track blocked IPs, failed attempts, automation detection
- 📅 **Historical Data**: Daily, weekly, monthly analytics aggregation

---

## 🔄 How It Works

ProofCaptcha menggunakan arsitektur three-step verification dengan end-to-end encryption:

### Step 1: Challenge Generation

```
Client                          Server
  |                               |
  |---(1) Request Challenge------>|
  |    POST /api/captcha/challenge|
  |    { publicKey, type }        |
  |                               |
  |                               |---(2) Create Session
  |                               |    Generate ECDH keypair
  |                               |    Derive shared secret (HKDF)
  |                               |
  |<--(3) Encrypted Challenge-----|
  |    { token, encrypted: {      |
  |      ciphertext,              |
  |      iv, authTag } }          |
```

**Security Highlights:**
- Server **ALWAYS** determines encryption mode (prevents client from forcing plaintext)
- ECDH (P-256) for secure key exchange
- HKDF for deriving AES and HMAC keys
- Session fingerprint binding for additional security

### Step 2: Solution Verification

```
Client                          Server
  |                               |
  |---(5) Solve Challenge-------->|
  |    (Proof-of-work,            |
  |     puzzle solution, etc)     |
  |                               |
  |---(6) Encrypt Solution------->|
  |    Using session key          |
  |                               |
  |---(7) Submit Solution-------->|
  |    POST /api/captcha/verify   |
  |    { token, encrypted: {      |
  |      ciphertext, iv,          |
  |      authTag } }              |
  |                               |
  |<--(9) Verification Token------|
  |    { success: true,           |
  |      verificationToken }      |
```

### Step 3: Backend Token Validation

```
Your Backend                 ProofCaptcha Server
     |                            |
     |---(11) Validate Token----->|
     |    POST /api/captcha/      |
     |    verify-token            |
     |    Authorization: Bearer   |
     |    { token }               |
     |                            |
     |<---(13) Success/Fail-------|
     |    { success: true/false } |
```

**⚠️ CRITICAL**: Backend validation adalah **WAJIB**. Frontend validation dapat di-bypass oleh attacker.

---

## 📦 Quick Start

### Installation

1. **Clone Repository**

```bash
git clone https://github.com/your-org/proofcaptcha.git
cd proofcaptcha
```

2. **Install Dependencies**

```bash
npm install
```

### Environment Setup

1. **Copy Environment Template**

```bash
cp .env.example .env
```

2. **Configure Environment Variables**

Edit `.env` dan set nilai berikut:

```bash
# Application Settings
NODE_ENV=development
SESSION_SECRET=your-strong-random-secret-here

# Database (PostgreSQL - Required for production)
DATABASE_URL=postgresql://username:password@host:port/database

# SMTP Email Configuration (Required for email verification)
SMTP_HOST=your-smtp-host.com
SMTP_PORT=465
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=noreply@domain.com

# Optional: TLS Configuration
SMTP_TLS_REJECT_UNAUTHORIZED=true
SMTP_TLS_SERVERNAME=your-smtp-servername.com

# Optional: Trust proxy (if behind reverse proxy)
TRUST_PROXY=true
```

**Environment Variable Descriptions:**

- `SESSION_SECRET`: Secret key untuk enkripsi session cookies. Generate dengan `openssl rand -base64 32`
- `DATABASE_URL`: PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)
- `SMTP_*`: Email server configuration untuk email verification dan password reset
- `TRUST_PROXY`: Set `true` jika aplikasi behind reverse proxy (Nginx, Apache, Cloudflare, dll)

### Database Setup

ProofCaptcha menggunakan PostgreSQL dengan Drizzle ORM.

**Option 1: Setup Database dengan Script (Recommended)**

```bash
# Setup database dan run migrations
npm run setup-db

# Setup database dengan demo data (for testing)
npm run setup-db:demo
```

Script ini akan:
1. Validate database connection
2. Run all migrations automatically
3. Create necessary tables
4. (Optional) Create demo developer account dan API key

**Option 2: Manual Migration**

```bash
# Push schema changes to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Running the Application

**Development Mode**

```bash
npm run dev
```

Application akan berjalan di `http://localhost:5000`

**Production Mode**

```bash
# Build dengan obfuscation (recommended)
npm run build:obfuscate

# Start production server
npm start
```

**Default Credentials (Demo Mode)**

Jika menggunakan `npm run setup-db:demo`, demo account akan dibuat:

```
Email: demo@proofcaptcha.local
Password: demo123
```

Demo API Key juga akan otomatis dibuat dan ditampilkan di console.

---

## 🔗 Integration Guide

### Frontend Integration

#### Option 1: Auto-Render (Easiest)

```html
<!DOCTYPE html>
<html>
<head>
  <title>ProofCaptcha Demo</title>
</head>
<body>
  <form id="myForm" method="POST" action="/submit">
    <input type="text" name="username" placeholder="Username" required>
    <input type="email" name="email" placeholder="Email" required>
    
    <!-- ProofCaptcha Widget -->
    <div class="proofCaptcha" 
         data-sitekey="YOUR_PUBLIC_KEY"
         data-type="random"
         data-callback="onCaptchaSuccess"
         data-error-callback="onCaptchaError">
    </div>
    
    <button type="submit">Submit</button>
  </form>

  <script>
    function onCaptchaSuccess(token) {
      console.log('CAPTCHA verified! Token:', token);
      // Token akan otomatis di-submit dengan form sebagai 'g-recaptcha-response'
    }
    
    function onCaptchaError(error) {
      console.error('CAPTCHA error:', error);
      alert('CAPTCHA verification failed. Please try again.');
    }
  </script>
  
  <!-- Load ProofCaptcha API -->
  <script src="https://your-domain.com/proofCaptcha/api.js" async defer></script>
</body>
</html>
```

#### Option 2: Manual Render

```html
<div id="captcha-container"></div>

<script>
  // Wait for ProofCaptcha to load
  window.onload = function() {
    const widgetId = proofCaptcha.render('captcha-container', {
      sitekey: 'YOUR_PUBLIC_KEY',
      type: 'grid', // or 'jigsaw', 'gesture', 'upside_down', 'random'
      callback: function(token) {
        console.log('Success!', token);
        // Process form submission
      },
      'expired-callback': function() {
        console.log('Token expired, challenge reset');
      },
      'error-callback': function(error) {
        console.error('Error:', error);
      }
    });
  };
</script>
<script src="https://your-domain.com/proofCaptcha/api.js" async defer></script>
```

**Widget Data Attributes:**

- `data-sitekey` (required): Your public API key (starts with `pk_`)
- `data-type`: Challenge type - `random`, `grid`, `jigsaw`, `gesture`, `upside_down`
- `data-callback`: Function name called on success (receives verification token)
- `data-expired-callback`: Function name called when token expires
- `data-error-callback`: Function name called on error

### Backend Verification

⚠️ **CRITICAL**: Anda **WAJIB** memvalidasi token di backend! Frontend validation dapat di-bypass.

#### Node.js/Express Example

```javascript
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/submit-form', async (req, res) => {
  const { username, email, 'g-recaptcha-response': captchaToken } = req.body;

  // Validate CAPTCHA token
  try {
    const verifyResponse = await fetch(
      'https://your-domain.com/api/captcha/verify-token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CAPTCHA_SECRET_KEY}`,
        },
        body: JSON.stringify({ token: captchaToken })
      }
    );

    const result = await verifyResponse.json();

    if (!result.success) {
      return res.status(400).json({ 
        error: 'CAPTCHA verification failed',
        message: result.error || 'Invalid CAPTCHA token'
      });
    }

    // CAPTCHA verified! Process your form
    // ... save to database, send email, etc.
    
    res.json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to verify CAPTCHA'
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

#### PHP Example

```php
<?php
function validateCaptcha($token) {
    $url = 'https://your-domain.com/api/captcha/verify-token';
    $secretKey = getenv('CAPTCHA_SECRET_KEY');
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['token' => $token]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $secretKey
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return ['success' => false, 'error' => 'HTTP Error: ' . $httpCode];
    }
    
    return json_decode($response, true);
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $captchaToken = $_POST['g-recaptcha-response'] ?? '';
    
    if (empty($captchaToken)) {
        die(json_encode(['error' => 'CAPTCHA token missing']));
    }
    
    $result = validateCaptcha($captchaToken);
    
    if (!$result['success']) {
        http_response_code(400);
        die(json_encode([
            'error' => 'CAPTCHA verification failed',
            'message' => $result['error'] ?? 'Invalid token'
        ]));
    }
    
    // CAPTCHA verified! Process form
    // ...
    
    echo json_encode(['success' => true]);
}
?>
```

#### Python/Flask Example

```python
import requests
import os
from flask import Flask, request, jsonify

app = Flask(__name__)

def validate_captcha(token):
    url = 'https://your-domain.com/api/captcha/verify-token'
    secret_key = os.getenv('CAPTCHA_SECRET_KEY')
    
    try:
        response = requests.post(
            url,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {secret_key}'
            },
            json={'token': token},
            timeout=5
        )
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {'success': False, 'error': str(e)}

@app.route('/submit-form', methods=['POST'])
def submit_form():
    data = request.get_json()
    captcha_token = data.get('g-recaptcha-response')
    
    if not captcha_token:
        return jsonify({'error': 'CAPTCHA token missing'}), 400
    
    # Validate CAPTCHA
    result = validate_captcha(captcha_token)
    
    if not result.get('success'):
        return jsonify({
            'error': 'CAPTCHA verification failed',
            'message': result.get('error', 'Invalid token')
        }), 400
    
    # CAPTCHA verified! Process form
    # ...
    
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(port=3000)
```

#### reCAPTCHA v2 Compatible Endpoint

ProofCaptcha juga mendukung reCAPTCHA v2 API untuk backward compatibility:

```javascript
// Using reCAPTCHA v2 compatible endpoint
const response = await fetch(
  'https://your-domain.com/proofCaptcha/api/siteverify',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      secret: process.env.CAPTCHA_SECRET_KEY,
      response: captchaToken
    })
  }
);

const result = await response.json();
// { success: true/false, challenge_ts: "...", hostname: "..." }
```

---

## 🎮 Challenge Types

ProofCaptcha menawarkan 4 tipe challenge yang berbeda:

### 1. **Grid Selection**
User memilih gambar (emoji) yang sesuai kriteria.

**Characteristics:**
- Familiar interface (seperti "pilih semua traffic light")
- 3x3 grid dengan 9 opsi
- Dynamic category selection
- Mobile-friendly

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="grid">
</div>
```

### 2. **Jigsaw Puzzle**
User drag puzzle piece ke posisi yang benar.

**Characteristics:**
- Interactive dan engaging
- Behavioral analysis dari drag pattern
- Pixel-perfect position validation
- Touch and mouse support

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="jigsaw">
</div>
```

### 3. **Gesture Pattern**
User gambar pattern pada grid (seperti Android pattern lock).

**Characteristics:**
- Unique dan sulit di-bot
- Touch dan mouse support
- Pattern complexity validation
- Engaging user experience

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="gesture">
</div>
```

### 4. **Upside-Down Animals**
User identifikasi hewan yang posisinya terbalik.

**Characteristics:**
- Fun dan engaging
- Cognitive challenge (requires human perception)
- Multiple animal types (dog, cat, bird, fish, etc.)
- Fast completion time

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="upside_down">
</div>
```

### **Random** (Recommended)
Server secara random memilih challenge type.

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="random">
</div>
```

---

## 🔧 API Reference

### Client-Side API

#### `proofCaptcha.render(container, options)`

Render CAPTCHA widget ke dalam container element.

**Parameters:**
- `container` (string | HTMLElement): Container element ID atau DOM element
- `options` (object): Configuration options

**Options:**
```javascript
{
  sitekey: string,              // Required: Public API key
  type: string,                 // Challenge type (default: 'random')
  callback: function(token),    // Success callback
  'expired-callback': function(), // Token expired callback
  'error-callback': function(error) // Error callback
}
```

**Returns:** `widgetId` (number)

**Example:**
```javascript
const widgetId = proofCaptcha.render('captcha-container', {
  sitekey: 'pk_abc123...',
  type: 'grid',
  callback: (token) => console.log('Success:', token)
});
```

#### `proofCaptcha.getResponse(widgetId)`

Get verification token dari widget.

**Parameters:**
- `widgetId` (number): Widget ID dari `render()`

**Returns:** Verification token (string) atau `null`

**Example:**
```javascript
const token = proofCaptcha.getResponse(widgetId);
if (token) {
  console.log('Token:', token);
}
```

#### `proofCaptcha.reset(widgetId)`

Reset widget ke initial state.

**Parameters:**
- `widgetId` (number): Widget ID dari `render()`

**Example:**
```javascript
proofCaptcha.reset(widgetId);
```

#### `proofCaptcha.execute(widgetId)`

Manually trigger challenge execution (for invisible mode).

**Parameters:**
- `widgetId` (number): Widget ID dari `render()`

**Example:**
```javascript
proofCaptcha.execute(widgetId);
```

### Server-Side API

#### POST `/api/captcha/verify-token`

Validate verification token dari client.

**Request:**
```bash
curl -X POST https://your-domain.com/api/captcha/verify-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -d '{"token": "verification_token_here"}'
```

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "challengeId": "challenge_abc123",
    "domain": "example.com",
    "timestamp": 1699776000000
  }
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Invalid Token",
  "message": "Token verification failed or expired"
}
```

**Error Codes:**
- `400`: Invalid request or missing token
- `401`: Invalid secret key
- `403`: Token verification failed (expired, invalid signature, replay attack)
- `500`: Internal server error

#### POST `/proofCaptcha/api/siteverify`

reCAPTCHA v2 compatible verification endpoint.

**Request:**
```bash
curl -X POST https://your-domain.com/proofCaptcha/api/siteverify \
  -d "secret=YOUR_SECRET_KEY" \
  -d "response=verification_token_here"
```

**Response:**
```json
{
  "success": true,
  "challenge_ts": "2025-11-17T12:00:00Z",
  "hostname": "example.com"
}
```

#### POST `/api/captcha/challenge`

Generate new challenge (called automatically by widget).

**Request:**
```json
{
  "publicKey": "pk_abc123...",
  "type": "grid",
  "deviceFingerprint": {...}
}
```

**Response:**
```json
{
  "token": "challenge_token",
  "encrypted": {
    "ciphertext": "...",
    "iv": "...",
    "authTag": "..."
  },
  "requiresEncryption": true
}
```

#### POST `/api/captcha/verify`

Verify challenge solution (called automatically by widget).

**Request:**
```json
{
  "token": "challenge_token",
  "encrypted": {
    "ciphertext": "...",
    "iv": "...",
    "authTag": "..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🛡️ Security Features

ProofCaptcha implements multiple layers of security:

### 1. **End-to-End Encryption**

- **ECDH (P-256)**: Secure key exchange without transmitting private keys
- **HKDF**: Key derivation untuk AES dan HMAC keys
- **AES-256-GCM**: Authenticated encryption dengan confidentiality dan integrity
- **Session Binding**: Keys bound to session fingerprints

**Server-Side Control**: Server **ALWAYS** determines encryption mode, preventing client from forcing plaintext (downgrade attack prevention).

### 2. **Multi-Layer Bot Detection**

**Advanced Fingerprinting:**
- Canvas fingerprinting
- WebGL rendering fingerprint
- Audio context fingerprint
- Font detection
- Screen resolution dan color depth
- Timezone dan language
- Platform dan user agent analysis

**Automation Detection:**
- WebDriver detection
- Headless browser detection (Puppeteer, Playwright, Selenium)
- Automation framework signatures
- DevTools detection

**Behavioral Analysis:**
- Mouse movement patterns
- Keyboard timing analysis
- Click/tap patterns
- Form fill timing
- Request frequency analysis

### 3. **Anti-Debugger Protection**

Built-in anti-debugger system dengan multiple detection methods:

- Debugger statement traps
- Console monitoring
- DevTools viewport detection
- Timing-based debugger detection
- Function integrity checks
- Premium "CHEATERS!!" animation mode

**Enable/Disable per API Key:**
```javascript
// Configured in Dashboard > API Keys > Settings
{
  "antiDebugger": true,  // Enable anti-debugger
  "advancedFingerprinting": true
}
```

### 4. **Code Obfuscation**

ProofCaptcha supports multiple levels of code obfuscation for production:

**Backend/API Obfuscation (Maximum Protection):**
- RC4 string encryption
- Control flow flattening
- Dead code injection
- Self-defending code
- Debug protection

**Frontend Obfuscation (Balanced):**
- Base64 string encoding
- Control flow flattening
- Moderate dead code injection
- Better performance

**Build with Obfuscation:**
```bash
npm run build:obfuscate
```

### 5. **Domain Validation**

Strict domain validation untuk prevent unauthorized usage:

- Origin header validation
- Referer header validation
- Domain whitelist per API key
- Wildcard subdomain support

**Example Configuration:**
```
Allowed Domains:
- example.com
- *.example.com (all subdomains)
- localhost (development only)
```

### 6. **Rate Limiting**

Configurable rate limiting per API key:

- Challenge generation rate limit
- Verification attempt rate limit
- Token validation rate limit
- Per-IP rate limiting

**Default Limits:**
- 30 requests per minute per IP
- Configurable via Security Settings

### 7. **IP & Country Blocking**

Block requests by IP address atau country:

```javascript
{
  "blockedIps": [
    "192.168.1.1",
    "10.0.0.0/8"  // CIDR notation supported
  ],
  "blockedCountries": [
    "CN",  // China
    "RU"   // Russia
  ]
}
```

---

## ⚙️ Advanced Configuration

### Per-API-Key Security Settings

Setiap API key dapat memiliki konfigurasi security yang berbeda. Configure via Dashboard > API Keys > Security Settings.

**Available Settings:**

```typescript
{
  // Security Features (Enable/Disable)
  antiDebugger: boolean,              // Anti-debugger protection (default: true)
  advancedFingerprinting: boolean,    // Advanced device fingerprinting (default: true)
  sessionBinding: boolean,            // Session fingerprint binding (default: true)
  csrfProtection: boolean,            // CSRF token validation (default: true)
  ipRateLimiting: boolean,            // IP-based rate limiting (default: true)
  automationDetection: boolean,       // Detect automation tools (default: true)
  behavioralAnalysis: boolean,        // Behavioral pattern analysis (default: true)
  riskAdaptiveDifficulty: boolean,    // Adaptive PoW difficulty (default: true)
  
  // IP and Country Blocking
  blockedIps: string[],               // Array of blocked IPs (CIDR supported)
  blockedCountries: string[],         // Array of ISO country codes
  
  // Proof of Work
  proofOfWorkDifficulty: number,      // 1-10 (default: 4)
  
  // Rate Limiting
  rateLimitWindowMs: number,          // Time window in ms (default: 60000)
  rateLimitMaxRequests: number,       // Max requests per window (default: 30)
  
  // Timeouts
  challengeTimeoutMs: number,         // Challenge expiry (10s-5min, default: 60s)
  tokenExpiryMs: number,              // Token expiry (30s-10min, default: 60s)
  
  // Challenge Types
  enabledChallengeTypes: string[]     // Enabled challenge types
}
```

**Example Configuration:**

```javascript
// High-security configuration for sensitive applications
{
  "antiDebugger": true,
  "advancedFingerprinting": true,
  "sessionBinding": true,
  "automationDetection": true,
  "behavioralAnalysis": true,
  "riskAdaptiveDifficulty": true,
  "proofOfWorkDifficulty": 8,        // Very high difficulty
  "challengeTimeoutMs": 30000,        // 30 seconds
  "tokenExpiryMs": 30000,
  "rateLimitMaxRequests": 10,
  "blockedCountries": ["CN", "RU"],
  "enabledChallengeTypes": ["grid", "jigsaw", "gesture"]
}

// Low-security configuration for internal applications
{
  "antiDebugger": false,
  "advancedFingerprinting": false,
  "automationDetection": false,
  "proofOfWorkDifficulty": 2,
  "challengeTimeoutMs": 300000,       // 5 minutes
  "rateLimitMaxRequests": 100,
  "enabledChallengeTypes": ["grid", "jigsaw"]
}
```

**⚠️ Note:** Core security features (Domain Validation, End-to-End Encryption) are **ALWAYS ENFORCED** dan tidak dapat disabled.

---

## 🎭 Obfuscation & Anti-Debugger

ProofCaptcha includes built-in protection against reverse engineering dan tampering.

### Code Obfuscation

**Build Production dengan Obfuscation:**

```bash
# Build + Obfuscate (Recommended untuk production)
npm run build:obfuscate
```

This will:
1. Build aplikasi dengan Vite dan esbuild
2. Obfuscate backend code dengan maksimum protection (RC4 encryption)
3. Obfuscate frontend code dengan balanced protection (Base64 encoding)

**Obfuscation Features:**

**Backend (Maximum Protection):**
- RC4 String Encryption
- Control Flow Flattening (100%)
- Dead Code Injection (50%)
- Self-Defending Code
- Debug Protection (4s interval)
- Console Output Disabled
- String Array Wrapping (5 layers)

**Frontend (Balanced):**
- Base64 String Encoding
- Control Flow Flattening (50%)
- Dead Code Injection (20%)
- String Array Wrapping (2 layers)
- No debug protection (better performance)

### Source Code Obfuscation (Advanced)

⚠️ **ADVANCED USAGE** - Obfuscate source files directly:

```bash
# Obfuscate source code (with automatic backup)
npm run obfuscate:source

# Restore original source code
npm run restore:source
```

**Warning:**
- Creates backup di `backup/backup-YYYYMMDD-HHMMSS/`
- Obfuscated source code **cannot** be recompiled
- Use only untuk final production deployment
- Always keep backup

### Anti-Debugger Configuration

Anti-debugger dapat di-configure per API key:

**Enable Anti-Debugger:**
```javascript
// In Dashboard > API Keys > Security Settings
{
  "antiDebugger": true
}
```

**Anti-Debugger Features:**
- Debugger trap detection
- Console monitoring
- DevTools viewport detection
- Timing-based detection
- Function integrity checks
- Premium "CHEATERS!!" animation

**For Development:**
Disable anti-debugger untuk development API keys agar tidak mengganggu debugging.

---

## 📊 Analytics Dashboard

ProofCaptcha menyediakan analytics dashboard yang comprehensive:

### Available Metrics

**Overview:**
- Total challenges generated
- Successful verifications
- Failed verifications
- Success rate (%)
- Average solve time
- Unique IPs

**Geographic Analytics:**
- Traffic by country
- Interactive world map
- Country-specific success rates
- Top countries by volume

**Challenge Type Distribution:**
- Breakdown by challenge type
- Success rate per type
- Average solve time per type

**Security Events:**
- Blocked IPs
- Blocked countries
- Automation detection events
- Failed verification attempts

**Time Series:**
- Daily/Weekly/Monthly aggregation
- Trends dan patterns
- Peak usage times

### Accessing Analytics

Navigate to: `https://your-domain.com/dashboard/analytics`

Login dengan developer account untuk melihat analytics semua API keys Anda.

---

## 🌐 Internationalization (i18n)

ProofCaptcha fully supports multi-language dengan i18next.

### Supported Languages

- 🇬🇧 English (en)
- 🇮🇩 Indonesian (id)

### Language Switching

User dapat switch language via UI di homepage dan dashboard.

### Adding New Languages

1. **Add Translation Files**

Create new translation file di `client/src/locales/`:

```
client/src/locales/
  ├── en.json
  ├── id.json
  └── fr.json  # New language
```

2. **Configure i18next**

Update `client/src/i18n.ts`:

```typescript
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      id: { translation: idTranslations },
      fr: { translation: frTranslations }  // Add new language
    },
    lng: 'en',
    fallbackLng: 'en'
  });
```

3. **Update Language Selector**

Update language selector component untuk include new language.

### Translation Keys

All UI text menggunakan translation keys. Example:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.hero.title')}</h1>
      <p>{t('home.hero.subtitle')}</p>
    </div>
  );
}
```

---

## 💻 Development

### Project Structure

```
proofcaptcha/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── lib/              # Utilities (encryption, query client)
│   │   ├── locales/          # i18n translation files
│   │   └── App.tsx           # Main app component
├── server/                    # Backend Express application
│   ├── routes.ts             # API route handlers
│   ├── storage.ts            # Database storage interface
│   ├── encryption.ts         # Server-side encryption
│   ├── crypto-utils.ts       # Cryptographic utilities
│   ├── automation-detector.ts
│   ├── behavioral-analysis.ts
│   ├── device-fingerprint.ts
│   ├── risk-scoring.ts
│   └── public/               # Static files
│       └── proofCaptcha/     # CAPTCHA widget files
│           └── api.js        # Client-side widget API
├── shared/                    # Shared code (types, schemas)
│   └── schema.ts             # Drizzle database schema
├── scripts/                   # Utility scripts
│   ├── setup-database.ts     # Database setup script
│   ├── obfuscate.js          # Obfuscation script
│   ├── obfuscate-source.js   # Source obfuscation
│   └── restore-source.js     # Source restore
├── migrations/                # Database migrations
├── .env.example              # Environment template
├── package.json
├── vite.config.ts
├── drizzle.config.ts
└── README.md
```

### Available Scripts

```bash
# Development
npm run dev                # Start dev server (port 5000)

# Database
npm run db:push            # Push schema changes to database
npm run db:studio          # Open Drizzle Studio (database GUI)
npm run setup-db           # Setup database with migrations
npm run setup-db:demo      # Setup database with demo data

# Build
npm run build              # Build for production
npm run build:obfuscate    # Build + obfuscate code
npm start                  # Start production server

# Obfuscation
npm run obfuscate          # Obfuscate dist/ files
npm run obfuscate:source   # Obfuscate source code (advanced)
npm run restore:source     # Restore from backup

# Type Checking
npm run check              # Run TypeScript type checking
```

### Adding New Challenge Types

1. **Create Challenge Component**

```typescript
// client/src/components/challenges/MyChallenge.tsx
export function MyChallenge({ data, onSuccess, onError }) {
  // Implement challenge UI
  // Call onSuccess(solution) when solved
}
```

2. **Add Server-Side Validation**

```typescript
// server/routes.ts
function validateMyChallenge(solution, challengeData) {
  // Validate solution
  return isValid;
}
```

3. **Register Challenge Type**

Update challenge type enum dan enable in security settings.

### Database Schema Changes

1. **Modify Schema**

Edit `shared/schema.ts`:

```typescript
export const myTable = pgTable("my_table", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // ... columns
});
```

2. **Generate Migration**

```bash
npm run db:push
```

3. **Verify Changes**

```bash
npm run db:studio
```

---

## 🔍 Troubleshooting

### Common Issues

#### "Invalid or inactive API key"

**Cause**: Public key tidak valid atau tidak aktif.

**Solution**:
1. Verify API key di Dashboard > API Keys
2. Ensure key status = "Active"
3. Check key tidak expired
4. Regenerate key jika perlu

#### "Domain validation failed"

**Cause**: Request dari domain yang tidak diizinkan.

**Solution**:
1. Check allowed domains di API key settings
2. Verify `Origin` header match dengan allowed domain
3. Add domain ke whitelist: Dashboard > API Keys > Edit > Allowed Domains
4. Use `*` for development (all domains) - **NOT recommended for production**

#### "Token verification failed or expired"

**Cause**: Token sudah kadaluarsa atau invalid.

**Solution**:
1. Default token expiry: 60 seconds (configurable)
2. Ensure user submits form immediately setelah complete CAPTCHA
3. Implement auto-refresh if needed
4. Check server time synchronization

#### "CAPTCHA widget tidak muncul"

**Cause**: JavaScript error atau network issue.

**Solution**:
1. Open browser console (F12), check for errors
2. Verify `api.js` script loaded correctly (Network tab)
3. Check `data-sitekey` attribute present dan valid
4. Ensure no ad-blockers blocking script
5. Check CSP headers allow script execution

#### "Database connection failed"

**Cause**: Invalid DATABASE_URL atau database tidak accessible.

**Solution**:
1. Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
2. Check database server is running
3. Verify credentials (username, password)
4. Check firewall allows connection
5. Test connection: `npm run setup-db`

#### "Email verification tidak terkirim"

**Cause**: SMTP configuration invalid.

**Solution**:
1. Verify SMTP credentials di `.env`
2. Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
3. Test SMTP connection manually
4. Check spam folder
5. Verify `SMTP_TLS_SERVERNAME` if using custom TLS

### Debug Mode

Enable debug logging untuk development:

```bash
# Set environment variable
NODE_ENV=development npm run dev
```

Check logs di console untuk detailed error messages.

### Getting Help

1. **Check Documentation**: Review this README dan SECURITY.md
2. **Search Issues**: Check existing GitHub issues
3. **Create Issue**: Provide detailed error messages, logs, and steps to reproduce
4. **Discord/Slack**: Join community untuk real-time help (if available)

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

### Development Workflow

1. **Fork the Repository**

```bash
git clone https://github.com/your-username/proofcaptcha.git
cd proofcaptcha
```

2. **Create Feature Branch**

```bash
git checkout -b feature/my-new-feature
```

3. **Install Dependencies**

```bash
npm install
```

4. **Setup Environment**

```bash
cp .env.example .env
# Edit .env dengan config Anda
```

5. **Run Migrations**

```bash
npm run setup-db:demo
```

6. **Start Development Server**

```bash
npm run dev
```

7. **Make Changes**

- Follow existing code style
- Add tests jika applicable
- Update documentation

8. **Test Your Changes**

```bash
npm run check  # Type checking
npm run build  # Verify build works
```

9. **Commit Changes**

```bash
git add .
git commit -m "feat: add new feature"
```

Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.

10. **Push and Create PR**

```bash
git push origin feature/my-new-feature
```

Create Pull Request di GitHub dengan detailed description.

### Code Style

- Use TypeScript untuk type safety
- Follow ESLint configuration
- Use Prettier untuk formatting
- Write meaningful commit messages
- Add comments untuk complex logic
- Update documentation

### Testing

- Manual testing untuk UI changes
- Test di multiple browsers (Chrome, Firefox, Safari)
- Test responsive design (mobile, tablet, desktop)
- Verify backward compatibility

---

## 📄 License

ProofCaptcha is open-source software licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

Built with:
- [React](https://react.dev/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Vite](https://vitejs.dev/) - Build tool
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [i18next](https://www.i18next.com/) - Internationalization
- [Node.js](https://nodejs.org/) - Runtime

---

## 🔐 Security

For security issues and vulnerability disclosure, please see [SECURITY.md](SECURITY.md).

**Do NOT** create public GitHub issues untuk security vulnerabilities.

---

## 📞 Support

- **Documentation**: [README.md](README.md), [SECURITY.md](SECURITY.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/proofcaptcha/issues)
- **Email**: support@proofcaptcha.com (if available)

---

<div align="center">
  Made with ❤️ by the ProofCaptcha Team
  
  **Star ⭐ this repo if you find it helpful!**
</div>
