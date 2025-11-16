<?php
/**
 * ProofCaptcha PHP Backend Example
 * 
 * File ini mendemonstrasikan cara memvalidasi token captcha
 * dari frontend ke server Replit menggunakan PHP
 */

// Set header untuk JSON response
header('Content-Type: application/json');

// ============================================
// KONFIGURASI - GANTI DENGAN NILAI ANDA!
// ============================================

// Domain Replit ProofCaptcha Server (tanpa https://)
// Server ini yang akan memvalidasi token captcha
define('REPLIT_DOMAIN', 'fc9a75ad-79f4-4da3-a6eb-c6432598fa48-00-oske09t7hckq.sisko.replit.dev');

// Secret Key dari dashboard ProofCaptcha (RAHASIA!)
// ⚠️ PENTING: Ganti dengan Secret Key Anda!
// Best practice: Gunakan environment variable untuk production
// define('API_SECRET_KEY', getenv('CAPTCHA_SECRET_KEY'));
define('API_SECRET_KEY', 'YOUR_SECRET_KEY_HERE');

// ============================================
// FUNGSI VALIDASI CAPTCHA
// ============================================

/**
 * Validasi token captcha ke server Replit
 * 
 * @param string $token Token dari frontend
 * @return array Response dari server
 */
function validateCaptcha($token) {
    $url = 'https://' . REPLIT_DOMAIN . '/api/captcha/verify-token';
    
    // Prepare request data
    $data = json_encode([
        'token' => $token
    ]);
    
    // Initialize cURL
    $ch = curl_init($url);
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . API_SECRET_KEY
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    // Check for cURL errors
    if ($error) {
        return [
            'success' => false,
            'error' => 'cURL Error: ' . $error
        ];
    }
    
    // Check HTTP response code
    if ($httpCode !== 200) {
        return [
            'success' => false,
            'error' => 'HTTP Error: ' . $httpCode,
            'response' => $response
        ];
    }
    
    // Parse JSON response
    $result = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [
            'success' => false,
            'error' => 'JSON Parse Error: ' . json_last_error_msg()
        ];
    }
    
    return $result;
}

// ============================================
// HANDLE REQUEST
// ============================================

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $captchaToken = $_POST['captcha_token'] ?? '';
    
    // Validate required fields
    if (empty($name) || empty($email) || empty($captchaToken)) {
        echo json_encode([
            'success' => false,
            'message' => 'Semua field harus diisi dan captcha harus diselesaikan'
        ]);
        exit;
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'message' => 'Format email tidak valid'
        ]);
        exit;
    }
    
    // ============================================
    // VALIDASI CAPTCHA (PENTING!)
    // ============================================
    
    $captchaResult = validateCaptcha($captchaToken);
    
    if (!$captchaResult['success']) {
        // Log error untuk debugging
        error_log('Captcha validation failed: ' . json_encode($captchaResult));
        
        echo json_encode([
            'success' => false,
            'message' => 'Verifikasi CAPTCHA gagal. Silakan coba lagi.',
            'error' => $captchaResult['error'] ?? 'Unknown error',
            'debug' => $captchaResult // Hanya untuk development
        ]);
        exit;
    }
    
    // ============================================
    // PROSES REGISTRASI
    // (Captcha sudah valid)
    // ============================================
    
    // Di sini Anda bisa:
    // 1. Simpan ke database
    // 2. Kirim email verifikasi
    // 3. Create user session
    // 4. dll
    
    // Contoh: Simpan ke database (pseudo-code)
    /*
    try {
        $pdo = new PDO('mysql:host=localhost;dbname=mydb', 'username', 'password');
        $stmt = $pdo->prepare('INSERT INTO users (name, email) VALUES (?, ?)');
        $stmt->execute([$name, $email]);
        $userId = $pdo->lastInsertId();
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
        exit;
    }
    */
    
    // Log successful registration
    error_log("New registration: $name ($email) - Captcha verified");
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Registrasi berhasil! Captcha terverifikasi.',
        'data' => [
            'name' => htmlspecialchars($name),
            'email' => htmlspecialchars($email),
            'captcha_verified' => true,
            'captcha_data' => [
                'domain' => $captchaResult['data']['domain'] ?? 'unknown',
                'type' => $captchaResult['data']['type'] ?? 'unknown',
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ]
    ]);
    
} else {
    // Method not allowed
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]);
}
?>
