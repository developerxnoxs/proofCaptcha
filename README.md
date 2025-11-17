# ProofCaptcha

<div align="center">
  <img src="attached_assets/generated_images/ProofCaptcha_shield_logo_98b0f54f.png" alt="ProofCaptcha Logo" width="200"/>
  
  **Enterprise-Grade CAPTCHA System with End-to-End Encryption**
  
  Self-hosted, privacy-first bot protection with multi-layered security and advanced threat detection
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Security: A+](https://img.shields.io/badge/Security-A%2B-green.svg)](SECURITY.md)
</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [Integration Guide](#integration-guide)
  - [Frontend Integration](#frontend-integration)
  - [Backend Verification](#backend-verification)
- [Challenge Types](#challenge-types)
- [Security Presets](#security-presets)
- [API Reference](#api-reference)
- [Security Features](#security-features)
- [Analytics Dashboard](#analytics-dashboard)
- [Internationalization](#internationalization)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**ProofCaptcha** adalah enterprise-grade CAPTCHA system dengan enkripsi end-to-end yang dirancang untuk melindungi aplikasi dari bot, automated attacks, dan advanced threats. Berbeda dengan CAPTCHA tradisional, ProofCaptcha menawarkan:

- 🔐 **End-to-End Encryption**: ECDH + HKDF + AES-256-GCM dengan server-side control
- 🛡️ **Multi-Layer Security**: 7+ independent security layers
- 🌍 **Multi-Language Support**: Built-in i18n (English, Indonesian)
- 📊 **Advanced Analytics**: Real-time monitoring dengan geographic insights
- 🎨 **4 Challenge Types**: Grid, Jigsaw, Gesture, Upside-Down
- 🔒 **Privacy-First**: Self-hosted, no tracking, no data selling
- ⚙️ **Per-API-Key Settings**: Granular security control per application

### Why ProofCaptcha?

- ✅ **More Secure**: End-to-end encryption prevents MITM, replay, and downgrade attacks
- ✅ **Production-Ready**: Code obfuscation, anti-debugger, session hijacking prevention
- ✅ **Developer-Friendly**: Drop-in replacement with simple API and comprehensive docs
- ✅ **Highly Configurable**: 5 preset modes (Development, Staging, Balanced, High Security, Low-Friction)
- ✅ **Privacy Compliant**: GDPR-ready, self-hosted, full data control

---

## 🚀 Key Features

### Security Features
- 🔐 **End-to-End Encryption**: ECDH (P-256) key exchange + HKDF key derivation + AES-256-GCM
- 🛡️ **Server-Side Encryption Control**: Server enforces encryption mode (prevents downgrade attacks)
- 🔑 **Session-Based Key Management**: Unique keys per session with automatic rotation
- 🎯 **Strict Domain Validation**: API keys tied to specific domains with wildcard support
- ⏱️ **Configurable Token Expiration**: Challenge and verification token expiry
- 🚫 **Replay Attack Prevention**: Single-use tokens with HMAC signatures + context binding
- 📊 **Adaptive Risk Scoring**: Multi-factor risk analysis with adaptive difficulty
- 🤖 **Advanced Bot Detection**:
  - Automation tool detection (Puppeteer, Selenium, Playwright)
  - Behavioral analysis (mouse, keyboard, timing patterns)
  - Advanced fingerprinting (Canvas, WebGL, Audio)
  - Honeypot traps
- 🔒 **Anti-Debugger Protection**: Multi-layered DevTools detection with premium feedback
- 🎭 **Code Obfuscation**: RC4 encryption, control flow flattening, dead code injection
- 🌐 **IP & Country Blocking**: Per-API-key configuration with CIDR notation support
- 🛑 **Automatic IP Blocking**: Temporary blocks for suspicious behavior

### Developer Experience
- 📦 **Easy Integration**: 3 lines of code to add CAPTCHA
- 🔄 **Auto-Render Support**: Data attributes for zero-code integration
- 🎨 **4 Challenge Types**: Interactive and engaging
- 📱 **Responsive Design**: Mobile and desktop optimized
- 🌐 **Multi-Language**: i18next integration (add your own languages)
- 📈 **Real-Time Dashboard**: Monitor traffic, success rate, geographic distribution
- ⚙️ **Security Presets**: Development, Staging, Balanced, High Security, Low-Friction
- 🔧 **Granular Control**: Configure difficulty, timeouts, rate limits per API key

### Analytics & Monitoring
- 📊 **Real-Time Metrics**: Challenges, verifications, success rates, solve times
- 🌍 **Geographic Analytics**: Country-level traffic tracking with detailed location data
- 📈 **Performance Insights**: Average solve time, unique IPs, challenge type distribution
- 🚨 **Security Events**: Blocked IPs, failed attempts, automation detection, threat levels
- 📅 **Historical Data**: Daily, weekly, monthly analytics aggregation
- 🎯 **Per-API-Key Analytics**: Separate analytics for each application

---

## 🏗️ Architecture

ProofCaptcha uses a **three-step verification** process with **end-to-end encryption**:

### Step 1: Handshake & Key Exchange

```
Client                          ProofCaptcha Server
  |                               |
  |---(1) ECDH Handshake--------->|
  |    POST /api/captcha/handshake|
  |    { publicKey,               |
  |      clientPublicKey }        |
  |                               |
  |                               |---(2) Generate Server Keys
  |                               |    ECDH keypair (P-256)
  |                               |    Derive shared secret (HKDF)
  |                               |    Create session binding
  |                               |
  |<--(3) Server Public Key-------|
  |    { serverPublicKey,         |
  |      timestamp, nonce,        |
  |      signature }              |
  |                               |
  |---(4) Derive Session Keys-----|
  |    ECDH → Shared Secret       |
  |    HKDF → AES + HMAC Keys     |
```

### Step 2: Challenge Generation & Encryption

```
Client                          ProofCaptcha Server
  |                               |
  |---(5) Request Challenge------>|
  |    POST /api/captcha/challenge|
  |    { publicKey, type,         |
  |      clientDetections }       |
  |                               |
  |                               |---(6) Risk Assessment
  |                               |    Bot detection layers
  |                               |    Adaptive difficulty
  |                               |    Generate challenge
  |                               |
  |                               |---(7) Encrypt Challenge
  |                               |    AES-256-GCM encryption
  |                               |    Encrypt security config
  |                               |
  |<--(8) Encrypted Challenge-----|
  |    { token, protocol,         |
  |      encrypted: {             |
  |        ciphertext, iv,        |
  |        authTag },             |
  |      encryptedSecurityConfig }|
```

### Step 3: Solution Verification

```
Client                          ProofCaptcha Server
  |                               |
  |---(9) Solve Challenge-------->|
  |    (Proof-of-work,            |
  |     puzzle solution)          |
  |                               |
  |---(10) Encrypt Solution------>|
  |    AES-256-GCM using          |
  |    session key                |
  |                               |
  |---(11) Submit Solution------->|
  |    POST /api/captcha/verify   |
  |    { token, publicKey,        |
  |      encrypted: {             |
  |        ciphertext, iv,        |
  |        authTag },             |
  |      encryptedMetadata }      |
  |                               |
  |                               |---(12) Decrypt & Verify
  |                               |    Validate solution
  |                               |    Check signatures
  |                               |    Single-use enforcement
  |                               |
  |<--(13) Verification Token-----|
  |    { success: true,           |
  |      verificationToken,       |
  |      tokenExpiry }            |
```

### Step 4: Backend Token Validation

```
Your Backend                 ProofCaptcha Server
     |                            |
     |---(14) Validate Token----->|
     |    POST /api/captcha/      |
     |    verify-token            |
     |    Authorization: Bearer   |
     |    { token }               |
     |                            |
     |                            |---(15) Verify Token
     |                            |    Check signature
     |                            |    Check expiration
     |                            |    Single-use check
     |                            |
     |<---(16) Validation Result--|
     |    { success: true,        |
     |      data: {               |
     |        challengeId,        |
     |        domain,             |
     |        timestamp } }       |
```

**🔒 Security Highlights:**
- Server ALWAYS enforces encryption (prevents downgrade attacks)
- Perfect forward secrecy (unique keys per session)
- Context binding (keys tied to challenge ID and domain)
- HMAC signatures prevent tampering
- Single-use tokens prevent replay attacks

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

Edit `.env` and set the following values:

```bash
# Application Settings
NODE_ENV=development
PORT=5000

# Session Secret (CRITICAL - Auto-generates if not set)
# Generate with: openssl rand -hex 32
SESSION_SECRET=your-64-character-hex-string-here

# Database (PostgreSQL - Recommended for production)
DATABASE_URL=postgresql://username:password@host:port/database

# SMTP Email Configuration (Required for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=noreply@yourdomain.com

# Optional: TLS Configuration
SMTP_TLS_REJECT_UNAUTHORIZED=true
SMTP_TLS_SERVERNAME=smtp.gmail.com

# Optional: Proxy Configuration
TRUST_PROXY=true
```

**Environment Variable Descriptions:**

- `SESSION_SECRET`: Secret key for encrypting session cookies
  - **Auto-generates** if not provided (64-char cryptographically secure random)
  - **Recommended**: Generate permanent secret with `openssl rand -hex 32`
  - **Critical**: Sessions invalidate on restart if auto-generated
- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - **Fallback**: In-memory storage if not provided (data lost on restart)
- `SMTP_*`: Email server configuration
  - Required for email verification and password reset
  - Gmail users: Use app-specific passwords
- `TRUST_PROXY`: Set `true` if behind reverse proxy (Nginx, Apache, Cloudflare)

### Database Setup

ProofCaptcha uses PostgreSQL with Drizzle ORM.

**Option 1: Automated Setup (Recommended)**

```bash
# Setup database and run migrations
npm run db:push

# Open Drizzle Studio (visual database explorer)
npm run db:studio
```

**Option 2: Manual Migration**

```bash
# Push schema changes to database
npx drizzle-kit push

# Generate migration files
npx drizzle-kit generate
```

### Running the Application

**Development Mode**

```bash
npm run dev
```

Application will run at `http://localhost:5000`

**Production Mode**

```bash
# Build with obfuscation (recommended for production)
npm run build:obfuscate

# Start production server
npm start
```

**First Time Setup:**

1. Visit `http://localhost:5000`
2. Click "Register" to create developer account
3. Verify email (check console if SMTP not configured)
4. Create API key in dashboard
5. Copy Public Key (`pk_...`) and Secret Key (`sk_...`)

---

## 🔗 Integration Guide

### Frontend Integration

#### Option 1: Auto-Render (Easiest - Zero Code)

```html
<!DOCTYPE html>
<html>
<head>
  <title>ProofCaptcha Integration</title>
</head>
<body>
  <form id="myForm" method="POST" action="/submit">
    <input type="text" name="username" placeholder="Username" required>
    <input type="email" name="email" placeholder="Email" required>
    
    <!-- ProofCaptcha Widget - Auto-Render -->
    <div class="proofCaptcha" 
         data-sitekey="pk_your_public_key_here"
         data-type="random"
         data-callback="onCaptchaSuccess"
         data-error-callback="onCaptchaError">
    </div>
    
    <button type="submit">Submit</button>
  </form>

  <script>
    function onCaptchaSuccess(token) {
      console.log('CAPTCHA verified! Token:', token);
      // Token is automatically added to form as 'proof-captcha-response'
      // Form can now be submitted
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

**Auto-Render Data Attributes:**

- `data-sitekey` (required): Your public API key (starts with `pk_`)
- `data-type`: Challenge type - `random`, `grid`, `jigsaw`, `gesture`, `upside_down` (default: `random`)
- `data-callback`: Function called on successful verification (receives token)
- `data-expired-callback`: Function called when token expires
- `data-error-callback`: Function called on error

**Form Submission:**

When auto-render is used, the verification token is automatically added to your form as a hidden input field named `proof-captcha-response`. You can access it in your backend:

```javascript
// Access token from form submission
const captchaToken = req.body['proof-captcha-response'];
```

#### Option 2: Manual Render (More Control)

```html
<div id="captcha-container"></div>

<script>
  // Wait for ProofCaptcha to load
  window.onProofCaptchaReady = function() {
    const widgetId = proofCaptcha.render('captcha-container', {
      sitekey: 'pk_your_public_key_here',
      type: 'grid', // or 'jigsaw', 'gesture', 'upside_down', 'random'
      callback: function(token) {
        console.log('Success!', token);
        // Manually handle token (e.g., add to form, send via AJAX)
        document.getElementById('captcha-token').value = token;
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

**Manual Render Options:**

```javascript
{
  sitekey: string,              // Required: Public API key
  type: string,                 // Challenge type (default: 'random')
  callback: function(token),    // Success callback
  'expired-callback': function(), // Token expired callback
  'error-callback': function(error) // Error callback
}
```

### Backend Verification

⚠️ **CRITICAL**: You **MUST** validate the token on your backend! Frontend validation can be bypassed by attackers.

#### Node.js/Express Example

```javascript
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Your secret key from ProofCaptcha Dashboard
const CAPTCHA_SECRET_KEY = process.env.CAPTCHA_SECRET_KEY;

app.post('/submit-form', async (req, res) => {
  // Extract data from form
  const { username, email } = req.body;
  
  // Extract ProofCaptcha token
  const captchaToken = req.body['proof-captcha-response'];

  // Validate CAPTCHA token with ProofCaptcha server
  try {
    const verifyResponse = await fetch(
      'https://your-domain.com/api/captcha/verify-token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CAPTCHA_SECRET_KEY}`,
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

    // CAPTCHA verified successfully!
    // Access verification data
    console.log('Challenge ID:', result.data.challengeId);
    console.log('Domain:', result.data.domain);
    console.log('Timestamp:', result.data.timestamp);

    // Process your form (save to database, send email, etc.)
    // ...
    
    res.json({ 
      success: true, 
      message: 'Form submitted successfully' 
    });
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
function validateProofCaptcha($token) {
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
    $captchaToken = $_POST['proof-captcha-response'] ?? '';
    
    if (empty($captchaToken)) {
        http_response_code(400);
        die(json_encode(['error' => 'CAPTCHA token missing']));
    }
    
    $result = validateProofCaptcha($captchaToken);
    
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

def validate_proof_captcha(token):
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
    data = request.form if request.form else request.get_json()
    captcha_token = data.get('proof-captcha-response')
    
    if not captcha_token:
        return jsonify({'error': 'CAPTCHA token missing'}), 400
    
    # Validate CAPTCHA
    result = validate_proof_captcha(captcha_token)
    
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

---

## 🎮 Challenge Types

ProofCaptcha offers 4 interactive challenge types:

### 1. Grid Selection
User selects images matching specific criteria (similar to "select all traffic lights").

**Characteristics:**
- Familiar interface
- 3x3 grid with 9 options
- Dynamic category selection
- Fast completion (~5-10 seconds)
- Mobile-friendly

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="grid">
</div>
```

### 2. Jigsaw Puzzle
User drags puzzle piece to correct position.

**Characteristics:**
- Interactive and engaging
- Behavioral analysis (drag patterns)
- Pixel-perfect validation
- Touch and mouse support
- Medium difficulty (~10-15 seconds)

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="jigsaw">
</div>
```

### 3. Gesture Pattern
User draws pattern on grid (Android-style pattern lock).

**Characteristics:**
- Unique and hard to automate
- Touch and mouse support
- Pattern complexity validation
- High user engagement
- Medium difficulty (~8-12 seconds)

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="gesture">
</div>
```

### 4. Upside-Down Animals
User identifies animals that are upside-down.

**Characteristics:**
- Fun and engaging
- Cognitive challenge (requires human perception)
- Multiple animal types (dog, cat, bird, fish, etc.)
- Fast completion (~5-8 seconds)
- **Requires encryption** (rotation data encrypted)

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="upside_down">
</div>
```

### Random (Recommended)
Server randomly selects challenge type for variety.

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="random">
</div>
```

---

## ⚙️ Security Presets

ProofCaptcha offers 5 preset configurations for different use cases:

### 1. Development Mode
**Best for**: Local development, debugging, testing

```json
{
  "antiDebugger": false,
  "advancedFingerprinting": false,
  "automationDetection": false,
  "behavioralAnalysis": false,
  "riskAdaptiveDifficulty": false,
  "proofOfWorkDifficulty": 2,
  "challengeTimeoutMs": 180000,
  "tokenExpiryMs": 180000,
  "rateLimitMaxRequests": 100,
  "enabledChallengeTypes": ["grid"]
}
```

**Benefits:**
- DevTools can be opened
- Long timeout (3 minutes)
- Lenient rate limits
- Low PoW difficulty
- Single predictable challenge type

### 2. Staging/QA Mode
**Best for**: Pre-production testing, QA, UAT

```json
{
  "antiDebugger": false,
  "advancedFingerprinting": true,
  "automationDetection": true,
  "behavioralAnalysis": false,
  "riskAdaptiveDifficulty": true,
  "proofOfWorkDifficulty": 3,
  "challengeTimeoutMs": 120000,
  "tokenExpiryMs": 120000,
  "rateLimitMaxRequests": 50,
  "enabledChallengeTypes": ["grid", "jigsaw"]
}
```

**Benefits:**
- DevTools still available for debugging
- Realistic bot detection
- 2 challenge types for variety
- Moderate timeouts

### 3. Production - Balanced (Recommended)
**Best for**: E-commerce, SaaS, public APIs, contact forms

```json
{
  "antiDebugger": true,
  "advancedFingerprinting": true,
  "automationDetection": true,
  "behavioralAnalysis": true,
  "riskAdaptiveDifficulty": true,
  "proofOfWorkDifficulty": 4,
  "challengeTimeoutMs": 60000,
  "tokenExpiryMs": 60000,
  "rateLimitMaxRequests": 30,
  "enabledChallengeTypes": ["grid", "jigsaw", "gesture"]
}
```

**Benefits:**
- Strong security without being aggressive
- 1 minute timeout (sufficient for normal users)
- 3 challenge types (no upside_down)
- All bot detection active

### 4. Production - High Security
**Best for**: Banking, payments, admin panels, voting systems

```json
{
  "antiDebugger": true,
  "advancedFingerprinting": true,
  "automationDetection": true,
  "behavioralAnalysis": true,
  "riskAdaptiveDifficulty": true,
  "proofOfWorkDifficulty": 6,
  "challengeTimeoutMs": 45000,
  "tokenExpiryMs": 45000,
  "rateLimitMaxRequests": 20,
  "enabledChallengeTypes": ["grid", "jigsaw", "gesture", "upside_down"],
  "blockedCountries": ["KP", "IR"]
}
```

**Benefits:**
- Maximum bot detection
- All 4 challenge types (including hardest)
- Higher PoW difficulty
- Shorter timeouts
- Lower rate limits
- Country blocking

### 5. Low-Friction Mode
**Best for**: Blog comments, feedback forms, newsletters

```json
{
  "antiDebugger": false,
  "advancedFingerprinting": true,
  "automationDetection": true,
  "behavioralAnalysis": false,
  "riskAdaptiveDifficulty": false,
  "proofOfWorkDifficulty": 2,
  "challengeTimeoutMs": 120000,
  "tokenExpiryMs": 120000,
  "rateLimitMaxRequests": 60,
  "enabledChallengeTypes": ["grid"]
}
```

**Benefits:**
- Easiest for users
- Only simple grid challenges
- Long timeout (2 minutes)
- Low PoW difficulty
- High rate limits

**How to Apply Presets:**

1. Login to ProofCaptcha Dashboard
2. Go to API Keys → Select key → Settings
3. Copy-paste preset JSON
4. Click "Save Settings"

---

## 🔧 API Reference

### Client-Side API

#### `proofCaptcha.render(container, options)`

Render CAPTCHA widget into container element.

**Parameters:**
- `container` (string | HTMLElement): Container element ID or DOM element
- `options` (object): Configuration options

**Options:**
```javascript
{
  sitekey: string,              // Required: Public API key (pk_...)
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
  callback: (token) => {
    console.log('Success:', token);
    // Handle token
  }
});
```

#### `proofCaptcha.getResponse(widgetId)`

Get verification token from widget.

**Parameters:**
- `widgetId` (number): Widget ID from `render()`

**Returns:** Verification token (string) or `null`

**Example:**
```javascript
const token = proofCaptcha.getResponse(widgetId);
if (token) {
  // Submit form with token
}
```

#### `proofCaptcha.reset(widgetId)`

Reset widget to initial state.

**Parameters:**
- `widgetId` (number): Widget ID from `render()`

**Example:**
```javascript
proofCaptcha.reset(widgetId);
```

#### `proofCaptcha.execute(widgetId)`

Manually trigger challenge execution.

**Parameters:**
- `widgetId` (number): Widget ID from `render()`

**Example:**
```javascript
proofCaptcha.execute(widgetId);
```

### Server-Side API

#### POST `/api/captcha/verify-token`

Validate verification token from client.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_SECRET_KEY
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

**cURL Example:**
```bash
curl -X POST https://your-domain.com/api/captcha/verify-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_your_secret_key" \
  -d '{"token": "verification_token_here"}'
```

**Error Codes:**
- `400`: Invalid request or missing token
- `401`: Invalid secret key
- `403`: Token verification failed (expired, invalid, replay attack)
- `500`: Internal server error

---

## 🛡️ Security Features

### Core Security Features (Always Enforced)

These features are **ALWAYS ACTIVE** and cannot be disabled:

✅ **End-to-End Encryption** (ECDH + AES-256-GCM)
✅ **Strict Domain Validation** (Origin/Referer checks with wildcard support)
✅ **Session Management** (Fingerprint binding + IP validation)
✅ **Token Expiration** (Time-based validation with grace period)
✅ **Replay Attack Prevention** (HMAC signatures + single-use tokens)
✅ **HTTPS Enforcement** (Production mode)
✅ **Server-Side Encryption Control** (Prevents downgrade attacks)

### Configurable Security Features

Configure per API key via Dashboard → Settings:

⚙️ **Anti-Debugger Protection** (default: ON)
- Detects DevTools usage
- Multi-layered detection (debugger, console, timing, viewport)
- Premium visual feedback

⚙️ **Advanced Fingerprinting** (default: ON)
- Canvas, WebGL, Audio fingerprints
- Device tracking across sessions
- Spoofing detection

⚙️ **Automation Detection** (default: ON)
- Detects Puppeteer, Selenium, Playwright
- User-Agent analysis
- WebDriver detection

⚙️ **Behavioral Analysis** (default: ON)
- Mouse movement patterns
- Keyboard timing analysis
- Click pattern validation

⚙️ **Risk-Adaptive Difficulty** (default: ON)
- Adjusts challenge difficulty based on risk score
- Multi-factor risk assessment
- Progressive challenge complexity

⚙️ **IP Rate Limiting** (default: ON)
- Configurable rate limits per API key
- Auto-blocking for suspicious IPs
- CIDR notation support

⚙️ **Country Blocking** (default: OFF)
- Block specific countries (ISO codes)
- Configurable per API key

---

## 📊 Analytics Dashboard

Access real-time analytics at `https://your-domain.com/dashboard`

### Metrics Available:

**Overview:**
- Total Challenges (24h, 7d, 30d)
- Total Verifications
- Success Rate (%)
- Average Solve Time
- Unique IPs

**Geographic Distribution:**
- Country-level traffic map
- Request counts per country
- Top countries by traffic

**Challenge Types:**
- Distribution by type (Grid, Jigsaw, Gesture, Upside-Down)
- Success rate per type
- Average solve time per type

**Security Events:**
- Blocked IPs count
- Failed attempts
- Automation detection count
- Threat level distribution

**Per-API-Key Analytics:**
- Separate analytics for each application
- Compare performance across API keys

---

## 🌍 Internationalization

ProofCaptcha supports multiple languages via i18next:

**Built-in Languages:**
- English (`en`)
- Indonesian (`id`)

**Add Custom Languages:**

1. Create translation file:
```javascript
// client/src/lib/i18n/locales/es.json
{
  "captcha": {
    "loading": "Cargando...",
    "verify": "Verificar",
    "success": "Verificado",
    // ... more translations
  }
}
```

2. Import in i18n config:
```javascript
// client/src/lib/i18n/config.ts
import es from './locales/es.json';

i18n.addResourceBundle('es', 'translation', es);
```

3. Use language selector:
```javascript
i18n.changeLanguage('es');
```

---

## 🛠️ Development

**Development Mode:**
```bash
npm run dev
```

**Build for Production:**
```bash
# Standard build
npm run build

# Build with obfuscation (recommended)
npm run build:obfuscate
```

**Database Commands:**
```bash
# Push schema to database
npm run db:push

# Open Drizzle Studio
npm run db:studio

# Generate migrations
npx drizzle-kit generate
```

**Code Quality:**
```bash
# TypeScript type checking
npm run type-check

# Lint code
npm run lint
```

---

## 🔧 Troubleshooting

### CAPTCHA Not Loading

**Symptoms:** Widget container remains empty

**Solutions:**
1. Check browser console for errors
2. Verify `data-sitekey` is correct (starts with `pk_`)
3. Ensure script URL is correct: `https://your-domain.com/proofCaptcha/api.js`
4. Check domain is allowed in API key settings
5. Check CORS headers (should allow your domain)

### Verification Always Fails

**Symptoms:** Backend validation returns `success: false`

**Solutions:**
1. Verify secret key is correct (starts with `sk_`)
2. Check token hasn't expired (default: 60 seconds)
3. Ensure backend is using correct endpoint: `/api/captcha/verify-token`
4. Check Authorization header format: `Bearer sk_...`
5. Verify domain matches API key configuration

### Session Secret Warnings

**Symptoms:** Console shows "AUTO-GENERATED SESSION SECRET" warning

**Solution:**
```bash
# Generate permanent secret
openssl rand -hex 32

# Add to .env
SESSION_SECRET=<generated-secret>

# Restart server
npm run dev
```

### Database Connection Errors

**Symptoms:** "Failed to connect to database" errors

**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check PostgreSQL server is running
3. Verify database exists: `createdb proofcaptcha`
4. Check credentials (username, password)
5. Run migrations: `npm run db:push`

### Email Not Sending

**Symptoms:** Email verification not received

**Solutions:**
1. Check SMTP credentials in `.env`
2. For Gmail: Use app-specific passwords
3. Check console logs for SMTP errors
4. Verify `SMTP_FROM_EMAIL` is correct
5. Check spam folder

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

**Security Issues:** Please report security vulnerabilities to security@proofcaptcha.com (see [SECURITY.md](SECURITY.md))

---

## 🙏 Acknowledgments

- Inspired by modern CAPTCHA systems
- Built with love for the open-source community
- Special thanks to all contributors

---

<div align="center">
  <p>Made with ❤️ by the ProofCaptcha Team</p>
  <p>
    <a href="https://github.com/your-org/proofcaptcha">GitHub</a> •
    <a href="https://your-domain.com/docs">Documentation</a> •
    <a href="https://your-domain.com/demo">Live Demo</a>
  </p>
</div>
