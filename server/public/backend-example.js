/**
 * CONTOH BACKEND VALIDATION untuk API-SERVER.CLOUD
 * 
 * File ini adalah contoh implementasi backend untuk memvalidasi token captcha
 * yang dikirim dari client ke server Replit.
 * 
 * Flow:
 * 1. Client menyelesaikan captcha di browser
 * 2. Client mendapat verificationToken
 * 3. Client kirim form data + verificationToken ke backend Anda (api-server.cloud)
 * 4. Backend Anda validasi token ke server Replit menggunakan endpoint ini
 * 5. Backend Anda proses form jika validasi berhasil
 */

// ============================================================================
// CONTOH MENGGUNAKAN NODE.JS + EXPRESS
// ============================================================================

const express = require('express');
const fetch = require('node-fetch'); // atau gunakan axios
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi - GANTI dengan nilai Anda
const CONFIG = {
  // Domain server Replit Anda
  REPLIT_API_URL: 'https://<REPLIT_DOMAIN>',
  
  // Secret Key dari dashboard Replit (JANGAN SHARE!)
  // Ini berbeda dengan sitekey - ini adalah API secret key
  API_SECRET_KEY: 'your-api-secret-key-here',
  
  // Sitekey Anda (untuk referensi, tidak digunakan di backend)
  SITEKEY: 'your-sitekey-here'
};

/**
 * Endpoint untuk menerima form submission dari client
 */
app.post('/validate-captcha', async (req, res) => {
  try {
    const { name, email, message, captchaToken } = req.body;
    
    // 1. Validasi input dasar
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }
    
    // 2. Validasi captcha token
    if (!captchaToken) {
      return res.status(400).json({
        success: false,
        message: 'Token captcha diperlukan'
      });
    }
    
    // 3. Verifikasi token ke server Replit
    const isValidCaptcha = await verifyCaptchaToken(captchaToken);
    
    if (!isValidCaptcha.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi captcha gagal: ' + isValidCaptcha.error
      });
    }
    
    // 4. Proses data (simpan ke database, kirim email, dll)
    console.log('Form data valid:', { name, email, message });
    console.log('Captcha verification:', isValidCaptcha.data);
    
    // TODO: Simpan ke database atau proses sesuai kebutuhan
    // await saveToDatabase({ name, email, message });
    // await sendEmail({ to: email, subject: 'Terima kasih!', ... });
    
    // 5. Return success response
    res.json({
      success: true,
      message: 'Formulir berhasil dikirim!',
      data: {
        name,
        email,
        // Jangan return captcha token ke client
      }
    });
    
  } catch (error) {
    console.error('Error processing form:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Fungsi untuk memverifikasi token captcha ke server Replit
 * @param {string} verificationToken - Token dari captcha yang sudah diselesaikan
 * @returns {Promise<{success: boolean, error?: string, data?: object}>}
 */
async function verifyCaptchaToken(verificationToken) {
  try {
    const response = await fetch(
      `${CONFIG.REPLIT_API_URL}/api/captcha/verify-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // PENTING: Gunakan API Secret Key untuk autentikasi
          'Authorization': `Bearer ${CONFIG.API_SECRET_KEY}`,
        },
        body: JSON.stringify({
          token: verificationToken,
        })
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Verification failed'
      };
    }
    
    return {
      success: result.success,
      data: result.data || {}
    };
    
  } catch (error) {
    console.error('Error verifying captcha token:', error);
    return {
      success: false,
      error: 'Failed to connect to verification server'
    };
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log('Captcha verification endpoint: POST /validate-captcha');
});


// ============================================================================
// CONTOH MENGGUNAKAN PHP
// ============================================================================
/*
<?php
// validate-captcha.php

// Konfigurasi
define('REPLIT_API_URL', 'https://<REPLIT_DOMAIN>');
define('API_SECRET_KEY', 'your-api-secret-key-here');

// Terima POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Ambil data dari request
$input = json_decode(file_get_contents('php://input'), true);
$name = $input['name'] ?? '';
$email = $input['email'] ?? '';
$message = $input['message'] ?? '';
$captchaToken = $input['captchaToken'] ?? '';

// Validasi input
if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Semua field harus diisi']);
    exit;
}

if (empty($captchaToken)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token captcha diperlukan']);
    exit;
}

// Verifikasi captcha token
$verificationResult = verifyCaptchaToken($captchaToken);

if (!$verificationResult['success']) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Validasi captcha gagal: ' . $verificationResult['error']
    ]);
    exit;
}

// Proses data (simpan ke database, dll)
// ... your business logic here ...

// Return success
echo json_encode([
    'success' => true,
    'message' => 'Formulir berhasil dikirim!'
]);

/**
 * Fungsi untuk memverifikasi token captcha
 */
function verifyCaptchaToken($token) {
    $url = REPLIT_API_URL . '/api/captcha/verify-token';
    
    $data = json_encode(['token' => $token]);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . API_SECRET_KEY
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return [
            'success' => false,
            'error' => 'HTTP error: ' . $httpCode
        ];
    }
    
    $result = json_decode($response, true);
    
    return [
        'success' => $result['success'] ?? false,
        'error' => $result['error'] ?? null,
        'data' => $result['data'] ?? []
    ];
}
?>
*/


// ============================================================================
// CONTOH MENGGUNAKAN PYTHON + FLASK
// ============================================================================
/*
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Konfigurasi
REPLIT_API_URL = 'https://<REPLIT_DOMAIN>'
API_SECRET_KEY = 'your-api-secret-key-here'

@app.route('/validate-captcha', methods=['POST'])
def validate_captcha():
    try:
        # Ambil data dari request
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')
        captcha_token = data.get('captchaToken')
        
        # Validasi input
        if not all([name, email, message]):
            return jsonify({
                'success': False,
                'message': 'Semua field harus diisi'
            }), 400
        
        if not captcha_token:
            return jsonify({
                'success': False,
                'message': 'Token captcha diperlukan'
            }), 400
        
        # Verifikasi captcha token
        is_valid = verify_captcha_token(captcha_token)
        
        if not is_valid['success']:
            return jsonify({
                'success': False,
                'message': f"Validasi captcha gagal: {is_valid.get('error')}"
            }), 400
        
        # Proses data (simpan ke database, dll)
        # ... your business logic here ...
        
        # Return success
        return jsonify({
            'success': True,
            'message': 'Formulir berhasil dikirim!'
        })
        
    except Exception as e:
        print(f'Error processing form: {e}')
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

def verify_captcha_token(token):
    """Verifikasi token captcha ke server Replit"""
    try:
        url = f'{REPLIT_API_URL}/api/captcha/verify-token'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {API_SECRET_KEY}'
        }
        payload = {'token': token}
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code != 200:
            return {
                'success': False,
                'error': f'HTTP error: {response.status_code}'
            }
        
        result = response.json()
        
        return {
            'success': result.get('success', False),
            'error': result.get('error'),
            'data': result.get('data', {})
        }
        
    except Exception as e:
        print(f'Error verifying captcha: {e}')
        return {
            'success': False,
            'error': 'Failed to connect to verification server'
        }

if __name__ == '__main__':
    app.run(port=3000)
*/


// ============================================================================
// TESTING
// ============================================================================
/*
Untuk testing, gunakan curl:

curl -X POST http://localhost:3000/validate-captcha \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello!",
    "captchaToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
*/
