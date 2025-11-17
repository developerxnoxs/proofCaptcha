# ProofCaptcha

<div align="center">
  <img src="attached_assets/generated_images/ProofCaptcha_shield_logo_98b0f54f.png" alt="Logo ProofCaptcha" width="200"/>
  
  **Sistem CAPTCHA Tingkat Enterprise dengan Enkripsi End-to-End**
  
  Perlindungan bot self-hosted yang mengutamakan privasi dengan keamanan berlapis dan deteksi ancaman canggih
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Security: A+](https://img.shields.io/badge/Security-A%2B-green.svg)](SECURITY.md)
</div>

---

## 📖 Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Fitur Utama](#fitur-utama)
- [Arsitektur](#arsitektur)
- [Mulai Cepat](#mulai-cepat)
  - [Instalasi](#instalasi)
  - [Pengaturan Environment](#pengaturan-environment)
  - [Pengaturan Database](#pengaturan-database)
  - [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Panduan Integrasi](#panduan-integrasi)
  - [Integrasi Frontend](#integrasi-frontend)
  - [Verifikasi Backend](#verifikasi-backend)
- [Tipe Challenge](#tipe-challenge)
- [Preset Keamanan](#preset-keamanan)
- [Referensi API](#referensi-api)
- [Fitur Keamanan](#fitur-keamanan)
- [Dashboard Analitik](#dashboard-analitik)
- [Internasionalisasi](#internasionalisasi)
- [Pengembangan](#pengembangan)
- [Pemecahan Masalah](#pemecahan-masalah)

---

## 🎯 Gambaran Umum

**ProofCaptcha** adalah sistem CAPTCHA tingkat enterprise dengan enkripsi end-to-end yang dirancang untuk melindungi aplikasi dari bot, serangan otomatis, dan ancaman canggih. Berbeda dengan CAPTCHA tradisional, ProofCaptcha menawarkan:

- 🔐 **Enkripsi End-to-End**: ECDH + HKDF + AES-256-GCM dengan kontrol server-side
- 🛡️ **Keamanan Berlapis**: 7+ lapisan keamanan independen
- 🌍 **Dukungan Multi-Bahasa**: Built-in i18n (Inggris, Indonesia)
- 📊 **Analitik Canggih**: Monitoring real-time dengan wawasan geografis
- 🎨 **4 Tipe Challenge**: Grid, Jigsaw, Gesture, Upside-Down
- 🔒 **Mengutamakan Privasi**: Self-hosted, tanpa tracking, tanpa jual data
- ⚙️ **Pengaturan Per-API-Key**: Kontrol keamanan granular per aplikasi

### Mengapa ProofCaptcha?

- ✅ **Lebih Aman**: Enkripsi end-to-end mencegah serangan MITM, replay, dan downgrade
- ✅ **Siap Produksi**: Obfuscation kode, anti-debugger, pencegahan session hijacking
- ✅ **Ramah Developer**: Pengganti drop-in dengan API sederhana dan dokumentasi lengkap
- ✅ **Sangat Dapat Dikonfigurasi**: 5 mode preset (Development, Staging, Balanced, High Security, Low-Friction)
- ✅ **Patuh Privasi**: Siap GDPR, self-hosted, kontrol data penuh

---

## 🚀 Fitur Utama

### Fitur Keamanan
- 🔐 **Enkripsi End-to-End**: Pertukaran kunci ECDH (P-256) + derivasi kunci HKDF + AES-256-GCM
- 🛡️ **Kontrol Enkripsi Server-Side**: Server memaksakan mode enkripsi (mencegah serangan downgrade)
- 🔑 **Manajemen Kunci Berbasis Sesi**: Kunci unik per sesi dengan rotasi otomatis
- 🎯 **Validasi Domain Ketat**: API key terikat pada domain tertentu dengan dukungan wildcard
- ⏱️ **Kedaluwarsa Token Dapat Dikonfigurasi**: Kedaluwarsa token challenge dan verification
- 🚫 **Pencegahan Serangan Replay**: Token sekali pakai dengan tanda tangan HMAC + context binding
- 📊 **Penilaian Risiko Adaptif**: Analisis risiko multi-faktor dengan kesulitan adaptif
- 🤖 **Deteksi Bot Canggih**:
  - Deteksi tool otomasi (Puppeteer, Selenium, Playwright)
  - Analisis perilaku (gerakan mouse, keyboard, pola timing)
  - Fingerprinting canggih (Canvas, WebGL, Audio)
  - Jebakan honeypot
- 🔒 **Perlindungan Anti-Debugger**: Deteksi DevTools berlapis dengan umpan balik premium
- 🎭 **Obfuscation Kode**: Enkripsi RC4, perataan alur kontrol, injeksi kode mati
- 🌐 **Pemblokiran IP & Negara**: Konfigurasi per-API-key dengan dukungan notasi CIDR
- 🛑 **Pemblokiran IP Otomatis**: Blokir sementara untuk perilaku mencurigakan

### Pengalaman Developer
- 📦 **Integrasi Mudah**: 3 baris kode untuk menambahkan CAPTCHA
- 🔄 **Dukungan Auto-Render**: Atribut data untuk integrasi tanpa kode
- 🎨 **4 Tipe Challenge**: Interaktif dan menarik
- 📱 **Desain Responsif**: Dioptimalkan untuk mobile dan desktop
- 🌐 **Multi-Bahasa**: Integrasi i18next (tambahkan bahasa Anda sendiri)
- 📈 **Dashboard Real-Time**: Pantau traffic, tingkat keberhasilan, distribusi geografis
- ⚙️ **Preset Keamanan**: Development, Staging, Balanced, High Security, Low-Friction
- 🔧 **Kontrol Granular**: Konfigurasi kesulitan, timeout, rate limit per API key

### Analitik & Monitoring
- 📊 **Metrik Real-Time**: Challenge, verifikasi, tingkat keberhasilan, waktu penyelesaian
- 🌍 **Analitik Geografis**: Pelacakan traffic tingkat negara dengan data lokasi detail
- 📈 **Wawasan Performa**: Rata-rata waktu penyelesaian, IP unik, distribusi tipe challenge
- 🚨 **Event Keamanan**: IP yang diblokir, percobaan gagal, deteksi otomasi, tingkat ancaman
- 📅 **Data Historis**: Agregasi analitik harian, mingguan, bulanan
- 🎯 **Analitik Per-API-Key**: Analitik terpisah untuk setiap aplikasi

---

## 🏗️ Arsitektur

ProofCaptcha menggunakan proses **verifikasi tiga langkah** dengan **enkripsi end-to-end**:

### Langkah 1: Handshake & Pertukaran Kunci

```
Client                          Server ProofCaptcha
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

### Langkah 2: Pembuatan & Enkripsi Challenge

```
Client                          Server ProofCaptcha
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

### Langkah 3: Verifikasi Solusi

```
Client                          Server ProofCaptcha
  |                               |
  |---(9) Solve Challenge-------->|
  |    (Interaksi user:           |
  |     Pilih grid,               |
  |     Drag jigsaw,              |
  |     Pola gesture,             |
  |     Pilih upside-down)        |
  |                               |
  |---(10) Encrypt Solution------>|
  |    AES-256-GCM encryption:    |
  |    - Data solusi              |
  |    - Waktu penyelesaian       |
  |    - Pola mouse/touch         |
  |    - Metadata perilaku        |
  |                               |
  |---(11) Submit Solution------->|
  |    POST /api/captcha/verify   |
  |    { token: challengeToken,   |
  |      publicKey,               |
  |      encrypted: {             |
  |        ciphertext,            |
  |        iv, tag },             |
  |      encryptedMetadata }      |
  |                               |
  |                               |---(12) Decrypt & Verify
  |                               |    ✓ Dekripsi solusi
  |                               |    ✓ Validasi jawaban
  |                               |    ✓ Cek timing
  |                               |    ✓ Verifikasi signature
  |                               |    ✓ Cek single-use
  |                               |    ✓ Deteksi bot
  |                               |
  |<--(13) Verification Token-----|
  |    { success: true,           |
  |      verificationToken,       |
  |      tokenExpiry }            |
  |                               |
  |---(14) Add to Form----------->|
  |    Hidden input field:        |
  |    proof-captcha-response     |
  |    = verificationToken        |
```

### Langkah 4: Validasi Token Backend (WAJIB)

```
Server Backend Anda          Server ProofCaptcha
     |                            |
     |---(15) Receive Form--------|
     |    Extract token dari:     |
     |    req.body                |
     |    ['proof-captcha-response']
     |                            |
     |---(16) Validate Token----->|
     |    POST /api/captcha/      |
     |         verify-token       |
     |    Headers:                |
     |      Authorization:        |
     |        Bearer sk_secret    |
     |    Body:                   |
     |      { token }             |
     |                            |
     |                            |---(17) Verify Token
     |                            |    ✓ Cek JWT signature
     |                            |    ✓ Cek kedaluwarsa
     |                            |    ✓ Cek single-use
     |                            |    ✓ Validasi domain
     |                            |    ✓ Tandai sebagai terpakai
     |                            |
     |<---(18) Validation Result--|
     |    { success: true/false,  |
     |      data: {               |
     |        challengeId,        |
     |        domain,             |
     |        timestamp,          |
     |        ip } }              |
     |                            |
     |---(19) Process or Reject-->|
     |    Jika sukses: Simpan data|
     |    Jika gagal: Tampil error|
```

**🔒 Sorotan Keamanan:**
- Server SELALU memaksakan enkripsi (mencegah serangan downgrade)
- Perfect forward secrecy (kunci unik per sesi)
- Context binding (kunci terikat pada challenge ID dan domain)
- Tanda tangan HMAC mencegah manipulasi
- Token sekali pakai mencegah serangan replay

**🎯 Memahami Tipe Token:**

ProofCaptcha menggunakan **DUA tipe token berbeda** untuk keamanan yang ditingkatkan:

1. **Challenge Token** (Internal - Client ↔ ProofCaptcha):
   - Dibuat saat challenge dibuat (Langkah 8)
   - Digunakan oleh client untuk submit solusi (Langkah 11)
   - Berisi data challenge terenkripsi
   - Berumur pendek (default: 60 detik)
   - Tidak pernah dikirim ke backend Anda
   - Format: JWT dengan payload terenkripsi

2. **Verification Token** (Public - Client → Backend Anda):
   - Dibuat setelah verifikasi berhasil (Langkah 13)
   - Ditambahkan ke form sebagai `proof-captcha-response` (Langkah 14)
   - Dikirim ke backend Anda untuk validasi (Langkah 16)
   - Berumur pendek (default: 60 detik)
   - Hanya sekali pakai (mencegah serangan replay)
   - Format: JWT yang ditandatangani dengan secret key Anda

**Mengapa Dua Token?**
- **Keamanan**: Memisahkan fase challenge dari validasi backend
- **Privasi**: Jawaban challenge tidak pernah terekspos ke backend Anda
- **Fleksibilitas**: Waktu kedaluwarsa berbeda untuk setiap fase
- **Perlindungan**: Challenge token terenkripsi, verification token ditandatangani

**Ringkasan Alur Token:**
```
Challenge Token → Digunakan client untuk menyelesaikan CAPTCHA
      ↓
Solusi diverifikasi oleh ProofCaptcha
      ↓
Verification Token → Dikirim ke backend ANDA
      ↓
Backend ANDA memvalidasi dengan ProofCaptcha
      ↓
Sukses: Proses form | Gagal: Tolak submission
```

---

## 📦 Mulai Cepat

### Instalasi

1. **Clone Repository**

```bash
git clone https://github.com/your-org/proofcaptcha.git
cd proofcaptcha
```

2. **Install Dependencies**

```bash
npm install
```

### Pengaturan Environment

1. **Copy Template Environment**

```bash
cp .env.example .env
```

2. **Konfigurasi Environment Variables**

Edit `.env` dan atur nilai berikut:

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

**Deskripsi Environment Variable:**

- `SESSION_SECRET`: Secret key untuk enkripsi session cookies
  - **Auto-generate** jika tidak disediakan (64-karakter cryptographically secure random)
  - **Direkomendasikan**: Generate secret permanen dengan `openssl rand -hex 32`
  - **Kritis**: Session menjadi invalid saat restart jika auto-generated
- `DATABASE_URL`: String koneksi PostgreSQL
  - Format: `postgresql://user:password@host:port/database`
  - **Fallback**: In-memory storage jika tidak disediakan (data hilang saat restart)
- `SMTP_*`: Konfigurasi server email
  - Diperlukan untuk verifikasi email dan reset password
  - Pengguna Gmail: Gunakan app-specific passwords
- `TRUST_PROXY`: Set `true` jika di belakang reverse proxy (Nginx, Apache, Cloudflare)

### Pengaturan Database

ProofCaptcha menggunakan PostgreSQL dengan Drizzle ORM.

**Opsi 1: Setup Otomatis (Direkomendasikan)**

```bash
# Setup database dan jalankan migrations
npm run db:push

# Buka Drizzle Studio (visual database explorer)
npm run db:studio
```

**Opsi 2: Migration Manual**

```bash
# Push perubahan schema ke database
npx drizzle-kit push

# Generate file migration
npx drizzle-kit generate
```

### Menjalankan Aplikasi

**Mode Development**

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5000`

**Mode Production**

```bash
# Build dengan obfuscation (direkomendasikan untuk production)
npm run build:obfuscate

# Start production server
npm start
```

**Setup Pertama Kali:**

1. Kunjungi `http://localhost:5000`
2. Klik "Register" untuk membuat akun developer
3. Verifikasi email (cek console jika SMTP tidak dikonfigurasi)
4. Buat API key di dashboard
5. Copy Public Key (`pk_...`) dan Secret Key (`sk_...`)

---

## 🔗 Panduan Integrasi

### Integrasi Frontend

#### Opsi 1: Auto-Render (Termudah - Tanpa Kode)

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
      console.log('CAPTCHA terverifikasi! Token:', token);
      // Token otomatis ditambahkan ke form sebagai 'proof-captcha-response'
      // Form sekarang dapat di-submit
    }
    
    function onCaptchaError(error) {
      console.error('Error CAPTCHA:', error);
      alert('Verifikasi CAPTCHA gagal. Silakan coba lagi.');
    }
  </script>
  
  <!-- Load ProofCaptcha API -->
  <script src="https://your-domain.com/proofCaptcha/api.js" async defer></script>
</body>
</html>
```

**Atribut Data Auto-Render:**

- `data-sitekey` (wajib): Public API key Anda (dimulai dengan `pk_`)
- `data-type`: Tipe challenge - `random`, `grid`, `jigsaw`, `gesture`, `upside_down` (default: `random`)
- `data-callback`: Fungsi dipanggil saat verifikasi berhasil (menerima token)
- `data-expired-callback`: Fungsi dipanggil saat token kadaluwarsa
- `data-error-callback`: Fungsi dipanggil saat error

**Pengiriman Form:**

Ketika auto-render digunakan, verification token otomatis ditambahkan ke form Anda sebagai hidden input field bernama `proof-captcha-response`. Anda dapat mengaksesnya di backend Anda:

```javascript
// Akses token dari form submission
const captchaToken = req.body['proof-captcha-response'];
```

#### Opsi 2: Manual Render (Kontrol Lebih Banyak)

```html
<div id="captcha-container"></div>

<script>
  // Tunggu ProofCaptcha dimuat
  window.onProofCaptchaReady = function() {
    const widgetId = proofCaptcha.render('captcha-container', {
      sitekey: 'pk_your_public_key_here',
      type: 'grid', // atau 'jigsaw', 'gesture', 'upside_down', 'random'
      callback: function(token) {
        console.log('Sukses!', token);
        // Handle token secara manual (misalnya, tambah ke form, kirim via AJAX)
        document.getElementById('captcha-token').value = token;
      },
      'expired-callback': function() {
        console.log('Token kadaluwarsa, challenge direset');
      },
      'error-callback': function(error) {
        console.error('Error:', error);
      }
    });
  };
</script>

<script src="https://your-domain.com/proofCaptcha/api.js" async defer></script>
```

**Opsi Manual Render:**

```javascript
{
  sitekey: string,              // Wajib: Public API key
  type: string,                 // Tipe challenge (default: 'random')
  callback: function(token),    // Callback sukses
  'expired-callback': function(), // Callback token kadaluwarsa
  'error-callback': function(error) // Callback error
}
```

### Verifikasi Backend

⚠️ **KRITIS**: Anda **HARUS** memvalidasi token di backend Anda! Validasi frontend dapat di-bypass oleh penyerang.

**🎯 Alur Validasi Backend:**

1. **Client menyelesaikan CAPTCHA** → menerima `verification token`
2. **Token ditambahkan ke form** → sebagai field `proof-captcha-response`
3. **Form dikirim ke backend ANDA** → token disertakan
4. **Backend ANDA memvalidasi token** → memanggil ProofCaptcha `/api/captcha/verify-token`
5. **ProofCaptcha memverifikasi** → mengembalikan sukses/gagal
6. **Backend ANDA memproses atau menolak** → berdasarkan hasil validasi

**📍 Endpoint Penting:**

| Endpoint | Tujuan | Siapa yang Memanggilnya | Autentikasi |
|----------|--------|------------------------|-------------|
| `/api/captcha/handshake` | Pertukaran kunci ECDH | Client (otomatis) | Public key |
| `/api/captcha/challenge` | Dapatkan challenge | Client (otomatis) | Public key |
| `/api/captcha/verify` | Verifikasi solusi | Client (otomatis) | Challenge token |
| **`/api/captcha/verify-token`** | **Validasi verification token** | **Backend ANDA** | **Secret key (Bearer)** |

⚠️ **Kesalahan Umum:** JANGAN bingung antara `/api/captcha/verify` (client-side, memvalidasi solusi challenge) dengan `/api/captcha/verify-token` (backend-side, memvalidasi verification token untuk backend ANDA).

**✅ Integrasi Backend yang Benar:**
```javascript
// Backend ANDA memvalidasi verification token
const response = await fetch(
  'https://your-domain.com/api/captcha/verify-token',  // ← Endpoint INI
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${YOUR_SECRET_KEY}`  // ← Secret key ANDA
    },
    body: JSON.stringify({ 
      token: verificationToken  // ← Dari form: proof-captcha-response
    })
  }
);
```

**❌ Salah (JANGAN gunakan):**
```javascript
// ❌ SALAH - Endpoint ini hanya untuk penggunaan CLIENT, bukan untuk validasi backend
await fetch('/api/captcha/verify', { ... })
```

#### Contoh Node.js/Express

```javascript
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Secret key Anda dari ProofCaptcha Dashboard
const CAPTCHA_SECRET_KEY = process.env.CAPTCHA_SECRET_KEY;

app.post('/submit-form', async (req, res) => {
  // Ekstrak data dari form
  const { username, email } = req.body;
  
  // Ekstrak ProofCaptcha token
  const captchaToken = req.body['proof-captcha-response'];

  // Validasi token CAPTCHA dengan server ProofCaptcha
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
        error: 'Verifikasi CAPTCHA gagal',
        message: result.error || 'Token CAPTCHA tidak valid'
      });
    }

    // CAPTCHA terverifikasi dengan sukses!
    // Akses data verifikasi
    console.log('Challenge ID:', result.data.challengeId);
    console.log('Domain:', result.data.domain);
    console.log('Timestamp:', result.data.timestamp);

    // Proses form Anda (simpan ke database, kirim email, dll.)
    // ...
    
    res.json({ 
      success: true, 
      message: 'Form berhasil dikirim' 
    });
  } catch (error) {
    console.error('Error verifikasi CAPTCHA:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Gagal memverifikasi CAPTCHA'
    });
  }
});

app.listen(3000, () => {
  console.log('Server berjalan di port 3000');
});
```

#### Contoh PHP

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
        die(json_encode(['error' => 'Token CAPTCHA tidak ada']));
    }
    
    $result = validateProofCaptcha($captchaToken);
    
    if (!$result['success']) {
        http_response_code(400);
        die(json_encode([
            'error' => 'Verifikasi CAPTCHA gagal',
            'message' => $result['error'] ?? 'Token tidak valid'
        ]));
    }
    
    // CAPTCHA terverifikasi! Proses form
    // ...
    
    echo json_encode(['success' => true]);
}
?>
```

#### Contoh Python/Flask

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
        return jsonify({'error': 'Token CAPTCHA tidak ada'}), 400
    
    # Validasi CAPTCHA
    result = validate_proof_captcha(captcha_token)
    
    if not result.get('success'):
        return jsonify({
            'error': 'Verifikasi CAPTCHA gagal',
            'message': result.get('error', 'Token tidak valid')
        }), 400
    
    # CAPTCHA terverifikasi! Proses form
    # ...
    
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(port=3000)
```

---

## 🎮 Tipe Challenge

ProofCaptcha menawarkan 4 tipe challenge interaktif:

### 1. Pilihan Grid
User memilih gambar yang cocok dengan kriteria tertentu (mirip dengan "pilih semua lampu lalu lintas").

**Karakteristik:**
- Antarmuka familiar
- Grid 3x3 dengan 9 opsi
- Pemilihan kategori dinamis
- Penyelesaian cepat (~5-10 detik)
- Ramah mobile

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="grid">
</div>
```

### 2. Puzzle Jigsaw
User menyeret potongan puzzle ke posisi yang benar.

**Karakteristik:**
- Interaktif dan menarik
- Analisis perilaku (pola drag)
- Validasi piksel sempurna
- Dukungan touch dan mouse
- Kesulitan sedang (~10-15 detik)

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="jigsaw">
</div>
```

### 3. Pola Gesture
User menggambar pola pada grid (pola kunci gaya Android).

**Karakteristik:**
- Unik dan sulit diotomasi
- Dukungan touch dan mouse
- Validasi kompleksitas pola
- Engagement user tinggi
- Kesulitan sedang (~8-12 detik)

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="gesture">
</div>
```

### 4. Hewan Terbalik
User mengidentifikasi hewan yang terbalik.

**Karakteristik:**
- Menyenangkan dan menarik
- Challenge kognitif (memerlukan persepsi manusia)
- Berbagai jenis hewan (anjing, kucing, burung, ikan, dll.)
- Penyelesaian cepat (~5-8 detik)
- **Memerlukan enkripsi** (data rotasi terenkripsi)

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="upside_down">
</div>
```

### Random (Direkomendasikan)
Server secara acak memilih tipe challenge untuk variasi.

```html
<div class="proofCaptcha" 
     data-sitekey="YOUR_KEY"
     data-type="random">
</div>
```

---

## ⚙️ Preset Keamanan

ProofCaptcha menawarkan 5 konfigurasi preset untuk berbagai use case:

### 1. Mode Development
**Terbaik untuk**: Development lokal, debugging, testing

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
