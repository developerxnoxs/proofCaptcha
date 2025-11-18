<div align="center">

![ProofCaptcha Logo](/attached_assets/stock_images/ProofCaptcha_shield_logo_98b0f54f.png)

# ProofCaptcha

### Sistem CAPTCHA Tingkat Enterprise dengan Enkripsi End-to-End

[![Keamanan](https://img.shields.io/badge/Keamanan-Enterprise%20Grade-success)]()
[![Enkripsi](https://img.shields.io/badge/Enkripsi-AES%20256%20GCM-blue)]()
[![Privasi](https://img.shields.io/badge/Privasi-GDPR%20Compliant-green)]()
[![Self-Hosted](https://img.shields.io/badge/Deployment-Self%20Hosted-orange)]()

</div>

---

## 📋 Daftar Isi

- [Tentang ProofCaptcha](#-tentang-proofcaptcha)
- [Fitur Utama](#-fitur-utama)
- [Arsitektur Keamanan](#-arsitektur-keamanan)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Instalasi](#-instalasi)
- [Panduan Integrasi](#-panduan-integrasi)
  - [Integrasi Frontend](#1-integrasi-frontend)
  - [Integrasi Backend](#2-integrasi-backend)
- [Tipe Challenge](#-tipe-challenge)
- [Konfigurasi Keamanan](#-konfigurasi-keamanan)
- [API Documentation](#-api-documentation)
- [Dashboard Developer](#-dashboard-developer)
- [Analytics & Monitoring](#-analytics--monitoring)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)
- [Dukungan](#-dukungan)

---

## 🛡️ Tentang ProofCaptcha

**ProofCaptcha** adalah sistem CAPTCHA modern berbasis proof-of-work yang dirancang untuk melindungi aplikasi web dari bot otomatis dan serangan canggih. Berbeda dengan CAPTCHA tradisional berbasis gambar, ProofCaptcha menggunakan **enkripsi end-to-end**, berbagai tipe challenge, dan mekanisme deteksi bot yang sophisticated untuk memberikan perlindungan bot yang modern dan fokus pada privasi.

### Mengapa ProofCaptcha?

- ✅ **Keamanan Berlapis**: 7 layer keamanan independen untuk perlindungan maksimal
- ✅ **Privasi Terjaga**: Self-hosted solution dengan kepatuhan GDPR
- ✅ **Enkripsi End-to-End**: Semua data challenge dan solution terenkripsi menggunakan AES-256-GCM
- ✅ **Deteksi Bot Canggih**: Multi-layer bot detection dengan fingerprinting dan behavioral analysis
- ✅ **Mudah Diintegrasikan**: API sederhana dengan auto-render support
- ✅ **Analytics Real-time**: Dashboard komprehensif dengan metrics dan visualisasi geografis
- ✅ **Multi-bahasa**: Dukungan untuk Bahasa Indonesia dan Inggris

---

## ⚡ Fitur Utama

### 🔐 Keamanan Enterprise-Grade

#### 1. **Enkripsi End-to-End**
- **ECDH (Elliptic Curve Diffie-Hellman)** dengan kurva P-256 untuk key exchange
- **HKDF (HMAC-based Key Derivation Function)** untuk derivasi session keys
- **AES-256-GCM** untuk authenticated encryption
- Server mengontrol mode enkripsi untuk mencegah downgrade attacks
- Session-based key caching dengan rotasi otomatis

#### 2. **Deteksi Bot Multi-Layer**
- **Automation Detection**: Mendeteksi headless browsers (Puppeteer, Selenium, Playwright)
- **Device Fingerprinting**: 60+ data points (Canvas, WebGL, Audio, Fonts)
- **Behavioral Analysis**: Analisis pola mouse, keyboard, dan timing
- **IP Reputation**: Tracking dan blocking IP dengan riwayat buruk
- **Honeypot Traps**: Field tersembunyi untuk menangkap automated submissions
- **Session Binding**: Binding challenge tokens ke session fingerprints

#### 3. **Anti-Debugger Protection**
- Multiple layer untuk mendeteksi dan menggagalkan DevTools
- Debugger statement traps
- Viewport monitoring
- Timing analysis untuk detecting breakpoints
- Function integrity checks

#### 4. **Code Obfuscation**
- Control flow flattening
- Dead code injection
- String encryption menggunakan RC4
- Variable name mangling
- Anti-tampering protection

### 🎯 Tipe Challenge Beragam

ProofCaptcha menawarkan 5 tipe challenge yang berbeda untuk mencegah bot adaptation:

1. **Random Challenge**: Challenge acak untuk variasi maksimal
2. **Grid Challenge**: Pilih gambar yang sesuai dari grid 3x3
3. **Jigsaw Puzzle**: Geser potongan puzzle ke posisi yang tepat
4. **Gesture Challenge**: Pattern recognition dengan gesture swipe
5. **Upside-Down Challenge**: Identifikasi gambar yang terbalik

### 📊 Dashboard Developer Lengkap

- **Manajemen API Keys**: Buat dan kelola multiple API keys dengan domain restrictions
- **Real-time Analytics**: 
  - Total verifikasi (hari ini, 7 hari, 30 hari)
  - Success rate dan average solve time
  - Grafik trend verifikasi
  - Distribusi geografis (peta dunia interaktif)
  - Top countries dengan metrics detail
- **Security Settings per Key**:
  - Konfigurasi 8+ fitur keamanan
  - IP & Country blocking
  - Rate limiting customization
  - Challenge timeout & token expiry
  - Proof-of-work difficulty adjustment
- **Verification Logs**: History lengkap semua verifikasi attempts

### 🌍 Internationalization

- Dukungan penuh untuk **Bahasa Indonesia** dan **English**
- Mudah ditambahkan bahasa lain melalui i18next
- UI otomatis menyesuaikan dengan preferensi bahasa user

---

## 🏗️ Arsitektur Keamanan

ProofCaptcha mengimplementasikan **7 Layer Keamanan Independen**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Domain Validation                │
│              Validasi domain sebelum generate challenge       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 Layer 2: End-to-End Encryption               │
│        ECDH Key Exchange → HKDF → AES-256-GCM Encryption     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Layer 3: Bot Detection                     │
│   Automation Detection + Behavioral Analysis + Fingerprinting│
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Layer 4: Anti-Debugger                      │
│        Multiple techniques untuk menggagalkan debugging       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Layer 5: Code Obfuscation                  │
│          String encryption + Control flow flattening          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Layer 6: Session Binding                  │
│        Bind tokens ke device fingerprint & IP address         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Layer 7: CSRF Protection                 │
│              Token-based protection untuk mutations           │
└─────────────────────────────────────────────────────────────┘
```

### Alur Keamanan End-to-End

```
Client                          Server
  │                              │
  ├─1. Request Public Key────────→
  │                              │
  ←─2. Return Public Key─────────┤
  │                              │
  ├─3. Generate Client Keypair   │
  │   (ECDH P-256)               │
  │                              │
  ├─4. Derive Shared Secret      │
  │   (ECDH Compute)             │
  │                              │
  ├─5. Derive Session Key        │
  │   (HKDF-SHA256)              │
  │                              │
  ├─6. Request Challenge─────────→
  │   + Client Public Key        │
  │                              │
  │                              ├─7. Validate Domain
  │                              ├─8. Derive Shared Secret
  │                              ├─9. Generate Challenge
  │                              ├─10. Encrypt Challenge Data
  │                              │    (AES-256-GCM)
  │                              │
  ←─11. Return Encrypted─────────┤
  │     Challenge                │
  │                              │
  ├─12. Decrypt Challenge        │
  │     (AES-256-GCM)            │
  │                              │
  ├─13. User Solves Challenge    │
  │                              │
  ├─14. Encrypt Solution─────────→
  │     (AES-256-GCM)            │
  │                              │
  │                              ├─15. Decrypt Solution
  │                              ├─16. Verify Solution
  │                              ├─17. Run Bot Detection
  │                              ├─18. Generate Token (JWT)
  │                              │
  ←─19. Return Verification──────┤
       Token                     │
```

---

## 🛠️ Teknologi yang Digunakan

### Frontend
- **React 18** dengan TypeScript
- **Vite** - Build tool dan dev server
- **Wouter** - Lightweight routing
- **TanStack Query (React Query)** - Server state management
- **shadcn/ui** - Component library (Radix UI primitives)
- **Tailwind CSS** - Utility-first CSS framework
- **i18next** - Internationalization
- **Framer Motion** - Animations
- **Recharts** - Charts dan visualisasi

### Backend
- **Node.js** dengan Express
- **TypeScript** dengan ES modules
- **Drizzle ORM** - Type-safe database access
- **PostgreSQL (Neon)** - Serverless database
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT generation & verification
- **crypto (Node.js)** - Cryptographic operations
- **nodemailer** - Email service

### Security Libraries
- **Web Crypto API** - Client-side cryptography
- **Node.js Crypto** - Server-side cryptography
- **express-rate-limit** - Rate limiting
- **express-session** - Session management
- **helmet** - Security headers

---

## 📦 Instalasi

### Prerequisites

- **Node.js** >= 18.x
- **PostgreSQL** database (atau Neon serverless)
- **npm** atau **yarn**

### Langkah Instalasi

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/proofcaptcha.git
   cd proofcaptcha
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Database**
   
   Buat database PostgreSQL dan catat connection string-nya.

4. **Konfigurasi Environment Variables**
   
   Buat file `.env` di root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:port/database

   # Email Service (untuk verifikasi email developer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@proofcaptcha.com

   # Session Secret
   SESSION_SECRET=your-random-secret-key-here

   # Server
   PORT=5000
   NODE_ENV=production
   ```

5. **Run Database Migration**
   ```bash
   npm run db:migrate
   ```

6. **Build Application**
   ```bash
   npm run build
   ```

7. **Start Server**
   ```bash
   npm start
   ```

   Untuk development:
   ```bash
   npm run dev
   ```

Server akan berjalan di `http://localhost:5000`

---

## 🚀 Panduan Integrasi

ProofCaptcha mudah diintegrasikan ke aplikasi Anda dalam 3 langkah sederhana.

### 1. Integrasi Frontend

#### Metode 1: Auto-Render (Paling Mudah)

Tambahkan script ke HTML Anda:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Form dengan ProofCaptcha</title>
</head>
<body>
  <form id="contact-form">
    <input type="email" name="email" placeholder="Email" required>
    <textarea name="message" placeholder="Pesan Anda" required></textarea>
    
    <!-- ProofCaptcha Widget (Auto-Render) -->
    <div class="proof-captcha"
         data-sitekey="YOUR_SITEKEY_HERE"
         data-theme="light"
         data-type="random"
         data-callback="onCaptchaSuccess"
         data-error-callback="onCaptchaError">
    </div>
    
    <button type="submit">Kirim</button>
  </form>

  <!-- Load ProofCaptcha Script -->
  <script src="https://your-domain.com/proofCaptcha/api.js" async defer></script>
  
  <script>
    function onCaptchaSuccess(token) {
      console.log('CAPTCHA verified:', token);
    }
    
    function onCaptchaError(error) {
      console.error('CAPTCHA error:', error);
    }
    
    document.getElementById('contact-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const token = ProofCaptcha.getResponse();
      if (!token) {
        alert('Mohon selesaikan CAPTCHA terlebih dahulu');
        return;
      }
      
      // Kirim form dengan token
      const formData = new FormData(e.target);
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          message: formData.get('message'),
          captchaToken: token
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Pesan berhasil dikirim!');
      }
    });
  </script>
</body>
</html>
```

#### Metode 2: Manual Render

```html
<div id="captcha-container"></div>

<script src="https://your-domain.com/proofCaptcha/api.js" async defer></script>

<script>
  ProofCaptcha.ready(function() {
    ProofCaptcha.render('captcha-container', {
      sitekey: 'YOUR_SITEKEY_HERE',
      theme: 'light',        // 'light', 'dark', atau 'auto'
      type: 'random',        // 'random', 'grid', 'jigsaw', 'gesture', 'upside_down'
      callback: onCaptchaSuccess,
      'error-callback': onCaptchaError
    });
  });
  
  function onCaptchaSuccess(token) {
    console.log('Token:', token);
  }
  
  function onCaptchaError(error) {
    console.error('Error:', error);
  }
</script>
```

#### Metode 3: React Component

Jika Anda menggunakan React:

```tsx
import { useState } from 'react';
import CaptchaWidget from '@/components/CaptchaWidget';

function ContactForm() {
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      alert('Mohon selesaikan CAPTCHA terlebih dahulu');
      return;
    }

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, captchaToken: token })
    });
    
    const result = await response.json();
    console.log(result);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
        required
      />
      
      <textarea
        value={formData.message}
        onChange={(e) => setFormData({...formData, message: e.target.value})}
        placeholder="Pesan Anda"
        required
      />
      
      {/* ProofCaptcha Widget */}
      <CaptchaWidget
        publicKey="YOUR_SITEKEY_HERE"
        type="random"
        onSuccess={setToken}
        onError={(error) => console.error(error)}
      />
      
      <button type="submit" disabled={!token}>
        Kirim Pesan
      </button>
    </form>
  );
}
```

### 2. Integrasi Backend

**PENTING**: Anda **HARUS** memvalidasi token CAPTCHA di backend untuk keamanan. Validasi client-side saja tidak cukup karena dapat di-bypass oleh bot.

#### Node.js / Express

```javascript
const express = require('express');
const app = express();

app.post('/api/contact', async (req, res) => {
  const { captchaToken, email, message } = req.body;
  
  // Validasi CAPTCHA token
  const verifyResponse = await fetch('https://your-proofcaptcha-domain.com/proofCaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response: captchaToken,
      secret: process.env.PROOFCAPTCHA_SECRET_KEY
    })
  });
  
  const verifyResult = await verifyResponse.json();
  
  if (!verifyResult.success) {
    return res.status(400).json({
      success: false,
      error: 'CAPTCHA verification failed',
      message: verifyResult.error_message
    });
  }
  
  // CAPTCHA valid, proses form
  console.log('Form dari:', email);
  console.log('Pesan:', message);
  console.log('Risk Score:', verifyResult.risk_score);
  
  // Simpan ke database, kirim email, dll
  
  res.json({
    success: true,
    message: 'Pesan berhasil dikirim'
  });
});
```

#### PHP

```php
<?php
// Konfigurasi
define('PROOFCAPTCHA_DOMAIN', 'your-proofcaptcha-domain.com');
define('SECRET_KEY', 'YOUR_SECRET_KEY_HERE');

// Fungsi validasi CAPTCHA
function validateCaptcha($token) {
    $url = 'https://' . PROOFCAPTCHA_DOMAIN . '/proofCaptcha/api/siteverify';
    
    $data = json_encode([
        'response' => $token,
        'secret' => SECRET_KEY
    ]);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
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
    $captchaToken = $_POST['captchaToken'] ?? '';
    $email = $_POST['email'] ?? '';
    $message = $_POST['message'] ?? '';
    
    // Validasi CAPTCHA
    $result = validateCaptcha($captchaToken);
    
    if (!$result['success']) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'CAPTCHA verification failed',
            'message' => $result['error_message'] ?? 'Unknown error'
        ]);
        exit;
    }
    
    // CAPTCHA valid, proses form
    // Simpan ke database, kirim email, dll
    
    echo json_encode([
        'success' => true,
        'message' => 'Pesan berhasil dikirim'
    ]);
}
?>
```

#### Python (Flask)

```python
from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

PROOFCAPTCHA_DOMAIN = 'your-proofcaptcha-domain.com'
SECRET_KEY = os.getenv('PROOFCAPTCHA_SECRET_KEY')

def validate_captcha(token):
    url = f'https://{PROOFCAPTCHA_DOMAIN}/proofCaptcha/api/siteverify'
    
    payload = {
        'response': token,
        'secret': SECRET_KEY
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {'success': False, 'error': str(e)}

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.get_json()
    captcha_token = data.get('captchaToken')
    email = data.get('email')
    message = data.get('message')
    
    # Validasi CAPTCHA
    result = validate_captcha(captcha_token)
    
    if not result.get('success'):
        return jsonify({
            'success': False,
            'error': 'CAPTCHA verification failed',
            'message': result.get('error_message', 'Unknown error')
        }), 400
    
    # CAPTCHA valid, proses form
    print(f'Form dari: {email}')
    print(f'Pesan: {message}')
    print(f'Risk Score: {result.get("risk_score")}')
    
    # Simpan ke database, kirim email, dll
    
    return jsonify({
        'success': True,
        'message': 'Pesan berhasil dikirim'
    })

if __name__ == '__main__':
    app.run(debug=True)
```

### Response Format Siteverify

```json
{
  "success": true,
  "challenge_ts": "2024-11-17T10:30:00.000Z",
  "hostname": "example.com",
  "risk_score": 0.15,
  "security_checks": {
    "automation_detected": false,
    "fingerprint_valid": true,
    "session_valid": true,
    "behavioral_score": 95
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error_code": "invalid-token",
  "error_message": "Token verifikasi tidak valid atau telah kadaluarsa"
}
```

---

## 🎲 Tipe Challenge

### 1. Random Challenge
Challenge acak dipilih dari semua tipe yang tersedia untuk variasi maksimal.

```html
<div class="proof-captcha" data-sitekey="YOUR_SITEKEY" data-type="random"></div>
```

### 2. Grid Challenge
User diminta memilih gambar yang sesuai dari grid 3x3.

```html
<div class="proof-captcha" data-sitekey="YOUR_SITEKEY" data-type="grid"></div>
```

### 3. Jigsaw Puzzle
User menggeser potongan puzzle ke posisi yang tepat.

```html
<div class="proof-captcha" data-sitekey="YOUR_SITEKEY" data-type="jigsaw"></div>
```

### 4. Gesture Challenge
Pattern recognition dengan gesture swipe.

```html
<div class="proof-captcha" data-sitekey="YOUR_SITEKEY" data-type="gesture"></div>
```

### 5. Upside-Down Challenge
Identifikasi gambar yang terbalik dari pilihan yang tersedia.

```html
<div class="proof-captcha" data-sitekey="YOUR_SITEKEY" data-type="upside_down"></div>
```

---

## ⚙️ Konfigurasi Keamanan

Setiap API key dapat dikonfigurasi dengan pengaturan keamanan yang berbeda sesuai kebutuhan aplikasi Anda.

### Fitur Keamanan yang Dapat Dikonfigurasi

| Fitur | Default | Deskripsi |
|-------|---------|-----------|
| **Anti-Debugger** | ✅ Enabled | Mencegah debugging menggunakan DevTools |
| **Advanced Fingerprinting** | ✅ Enabled | Canvas, WebGL, Audio fingerprinting |
| **Session Binding** | ✅ Enabled | Bind token ke device fingerprint |
| **CSRF Protection** | ✅ Enabled | Token-based CSRF protection |
| **IP Rate Limiting** | ✅ Enabled | Batasi requests per IP |
| **Automation Detection** | ✅ Enabled | Deteksi headless browsers & automation tools |
| **Behavioral Analysis** | ✅ Enabled | Analisis pola interaksi user |
| **Risk Adaptive Difficulty** | ✅ Enabled | Sesuaikan difficulty berdasarkan risk score |

### IP & Country Blocking

Blokir IP addresses atau countries tertentu:

```javascript
{
  "blockedIps": ["192.168.1.100", "10.0.0.0/8"],
  "blockedCountries": ["CN", "RU"]  // ISO 3166-1 alpha-2 codes
}
```

### Rate Limiting

Konfigurasi rate limiting per API key:

```javascript
{
  "rateLimitWindowMs": 60000,      // Window dalam milidetik (default: 1 menit)
  "rateLimitMaxRequests": 30       // Max requests per window (default: 30)
}
```

### Timeouts & Expiry

```javascript
{
  "challengeTimeoutMs": 60000,     // Timeout challenge (default: 1 menit)
  "tokenExpiryMs": 60000           // Expiry verification token (default: 1 menit)
}
```

### Proof-of-Work Difficulty

Sesuaikan tingkat kesulitan proof-of-work (1-10):

```javascript
{
  "proofOfWorkDifficulty": 4       // Default: 4 (Medium)
}
```

**Rekomendasi:**
- **1-3**: Low (untuk aplikasi dengan traffic tinggi)
- **4-6**: Medium (balanced antara keamanan dan UX)
- **7-10**: High (untuk aplikasi high-security)

---

## 📖 API Documentation

### Endpoint: Generate Challenge

**POST** `/api/captcha/challenge`

Generate challenge token baru untuk user.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "sitekey": "pk_your_sitekey_here",
  "type": "random",
  "clientPublicKey": "base64_encoded_public_key" // Optional, untuk E2EE
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "challenge": {
    "encrypted": true,
    "data": "encrypted_base64_data",
    "iv": "initialization_vector",
    "authTag": "authentication_tag"
  },
  "expiresAt": "2024-11-17T11:30:00.000Z"
}
```

### Endpoint: Verify Solution

**POST** `/api/captcha/verify`

Verify user's solution untuk challenge.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "challenge_token_from_generate_endpoint",
  "solution": {
    "encrypted": true,
    "data": "encrypted_solution_data",
    "iv": "initialization_vector",
    "authTag": "authentication_tag"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2024-11-17T11:31:00.000Z"
}
```

**Response (Failed):**
```json
{
  "success": false,
  "error": "Invalid solution",
  "message": "The solution provided is incorrect"
}
```

### Endpoint: Siteverify (Backend Verification)

**POST** `/proofCaptcha/api/siteverify`

Verify verification token dari backend Anda.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "response": "verification_token_from_frontend",
  "secret": "your_secret_key_here"
}
```

**Response:**
```json
{
  "success": true,
  "challenge_ts": "2024-11-17T10:30:00.000Z",
  "hostname": "example.com",
  "risk_score": 0.15,
  "security_checks": {
    "automation_detected": false,
    "fingerprint_valid": true,
    "session_valid": true,
    "behavioral_score": 95
  }
}
```

### Error Codes

| Code | Deskripsi |
|------|-----------|
| `missing-input-secret` | Secret key tidak diberikan |
| `invalid-input-secret` | Secret key tidak valid |
| `missing-input-response` | Response token tidak diberikan |
| `invalid-input-response` | Response token tidak valid atau kadaluarsa |
| `bad-request` | Request tidak valid |
| `timeout-or-duplicate` | Token sudah digunakan atau kadaluarsa |

---

## 🎛️ Dashboard Developer

Dashboard ProofCaptcha menyediakan interface lengkap untuk mengelola API keys dan monitoring.

### Fitur Dashboard

#### 1. **Authentication**
- Register dengan email verification
- Login dengan bcrypt password hashing
- Forgot password dengan email reset code
- Session-based authentication

#### 2. **API Key Management**
- Buat multiple API keys untuk berbagai aplikasi
- Generate sitekey (public) dan secret key (private) otomatis
- Domain restrictions untuk keamanan
- Aktifkan/nonaktifkan API keys
- Konfigurasi security settings per key

#### 3. **Real-time Analytics**

**Overview Metrics:**
- Total verifikasi hari ini
- Total verifikasi 7 hari terakhir
- Total verifikasi 30 hari terakhir
- Success rate
- Average solve time

**Trend Charts:**
- Line chart verifikasi harian (7 hari)
- Comparison successful vs failed verifications

**Geographic Distribution:**
- Interactive world map dengan heat visualization
- Top 10 countries dengan metrics:
  - Total verifikasi
  - Success rate
  - Average solve time
  - Unique IPs

#### 4. **Verification Logs**
- History lengkap semua verification attempts
- Filter berdasarkan:
  - Success/Failed
  - Date range
  - Country
  - IP address
- Detail per verification:
  - Timestamp
  - IP address & geolocation
  - User agent
  - Success/failure status
  - Time to solve
  - Risk score
  - Security checks result

#### 5. **Security Settings**

Configure 8+ security features per API key:
- Anti-debugger protection
- Advanced fingerprinting
- Session binding
- CSRF protection
- IP rate limiting
- Automation detection
- Behavioral analysis
- Risk adaptive difficulty

Plus:
- IP blocking (CIDR notation support)
- Country blocking (ISO codes)
- Rate limit configuration
- Proof-of-work difficulty
- Challenge & token timeouts

---

## 📊 Analytics & Monitoring

### Metrics yang Dikumpulkan

1. **Verification Metrics**
   - Total challenges generated
   - Successful verifications
   - Failed verifications
   - Success rate percentage
   - Average time to solve

2. **Geographic Data**
   - Country (ISO code)
   - Country name
   - Region/State
   - City
   - Coordinates (lat/long)
   - Timezone

3. **Security Data**
   - IP addresses
   - User agents
   - Automation detection results
   - Fingerprint validity
   - Session validity
   - Behavioral scores
   - Risk scores

4. **Performance Data**
   - Time to solve per verification
   - Average solve time per country
   - Challenge timeout rate
   - Token expiry rate

### Data Retention

- **Verification Logs**: 90 hari
- **Analytics Aggregates**: 1 tahun
- **Country Analytics**: 1 tahun
- **Challenge Tokens**: Auto-cleanup setelah expired
- **Used Verification Tokens**: Marked sebagai used, cleanup otomatis

---

## 🤝 Kontribusi

Kami menerima kontribusi dari komunitas! Berikut cara berkontribusi:

1. Fork repository ini
2. Buat branch untuk fitur Anda (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan Anda (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

### Guidelines Kontribusi

- Ikuti code style yang sudah ada
- Tulis tests untuk fitur baru
- Update dokumentasi jika diperlukan
- Pastikan semua tests passed sebelum submit PR

---

## 📄 Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

---

## 💬 Dukungan

### Dokumentasi
- **API Documentation**: Lihat halaman `/docs/api` di dashboard
- **Integration Guide**: Lihat halaman `/docs/integration` di dashboard

### Kontak
- **Email**: support@proofcaptcha.com
- **GitHub Issues**: [Report a Bug](https://github.com/yourusername/proofcaptcha/issues)

### Vulnerability Disclosure
Jika Anda menemukan security vulnerability, mohon **JANGAN** buat public issue. Silakan kirim email ke security@proofcaptcha.com dengan detail vulnerability. Kami akan merespons dalam 48 jam.

---

<div align="center">

**Dibuat dengan ❤️ untuk web yang lebih aman**

[Website](https://proofcaptcha.com) • [Dokumentasi](https://docs.proofcaptcha.com) • [Demo](https://demo.proofcaptcha.com)

</div>
