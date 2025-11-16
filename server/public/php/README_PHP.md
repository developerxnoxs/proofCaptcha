# 🐘 PHP ProofCaptcha Integration

File-file ini untuk **diupload ke server Anda sendiri** (seperti api-server.cloud), bukan di Replit.

---

## 📁 Files

```
php/
├── index.html       ← Form HTML dengan ProofCaptcha widget
├── backend.php      ← PHP backend untuk validasi token
└── README_PHP.md    ← File ini
```

---

## 🚀 Quick Setup (5 Menit)

### Step 1: Download Files

Download kedua file:
- `index.html`
- `backend.php`

Atau download seluruh folder `php`.

---

### Step 2: Konfigurasi index.html

Buka `index.html` dan edit **2 tempat**:

#### A. Ganti Sitekey (Baris ~102)

```html
<!-- CARI BARIS INI -->
<div 
    class="proof-captcha"
    data-sitekey="YOUR_SITEKEY_HERE"  ← GANTI INI!
    data-theme="light"
    data-type="random"
    data-callback="onCaptchaSuccess"
></div>
```

Ganti `YOUR_SITEKEY_HERE` dengan **Sitekey** dari dashboard ProofCaptcha.

**Contoh:**
```html
data-sitekey="pk_abc123def456..."
```

#### B. Ganti Domain Replit (Baris ~161)

```html
<!-- CARI BARIS INI -->
<script src="https://fc9a75ad-...-replit.dev/proofCaptcha/api.js"></script>
```

Jika domain Replit Anda berbeda, ganti dengan domain Anda.

---

### Step 3: Konfigurasi backend.php

Buka `backend.php` dan edit **2 nilai** di bagian konfigurasi (baris 17-22):

```php
<?php
// CARI BAGIAN INI

// 1. Domain Replit ProofCaptcha Server
define('REPLIT_DOMAIN', 'fc9a75ad-...-replit.dev');  // ← Ganti jika perlu

// 2. Secret Key dari dashboard (RAHASIA!)
define('API_SECRET_KEY', 'YOUR_SECRET_KEY_HERE');  // ← GANTI INI!
```

**⚠️ PENTING:**
- **Ganti** `YOUR_SECRET_KEY_HERE` dengan **Secret Key** (bukan Sitekey!)
- Secret Key dimulai dengan `sk_...`
- **JANGAN** share secret key ke publik!

**Contoh:**
```php
define('API_SECRET_KEY', 'sk_xyz789abc123...');
```

---

### Step 4: Upload ke Server

Upload kedua file ke server Anda:

```bash
# Via FTP/SFTP
/var/www/html/php/index.html
/var/www/html/php/backend.php

# Via command line
scp index.html backend.php user@api-server.cloud:/var/www/html/php/
```

**Struktur di server:**
```
api-server.cloud/
└── php/
    ├── index.html
    └── backend.php
```

---

### Step 5: Set Permissions (Jika Perlu)

Pastikan PHP bisa execute `backend.php`:

```bash
chmod 644 index.html
chmod 644 backend.php
```

---

### Step 6: Test!

Buka di browser:
```
https://api-server.cloud/php/index.html
```

**Testing checklist:**
- [ ] Captcha widget muncul
- [ ] Bisa solve captcha (checkbox/puzzle)
- [ ] Form bisa disubmit
- [ ] Dapat response success dari backend
- [ ] Check browser console untuk errors

---

## 🔧 Cara Kerja

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Server (api-server.cloud)            │
│  ┌──────────────┐         ┌──────────────────────────┐     │
│  │ index.html   │   →     │ backend.php              │     │
│  │ (Frontend)   │         │ (Validasi token)         │     │
│  └──────────────┘         └──────────────────────────┘     │
│        ↓                            ↓                        │
│   User solve                   Kirim token                  │
│   captcha                      ke Replit                    │
│        ↓                            ↓                        │
│   Get token ────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                                       ↓
                        ┌──────────────────────────────┐
                        │  Replit ProofCaptcha Server  │
                        │  (Validasi & return result)  │
                        └──────────────────────────────┘
```

**Flow Detail:**

1. **User** buka `https://api-server.cloud/php/index.html`
2. **Frontend** load ProofCaptcha widget dari server Replit
3. **User** solve captcha (klik checkbox atau puzzle)
4. **Frontend** dapat `verificationToken` dari callback
5. **User** submit form → data + token kirim ke `backend.php`
6. **backend.php** validasi token ke `https://[REPLIT]/api/captcha/verify-token`
7. **Replit** return success/failed
8. **backend.php** proses registrasi jika token valid
9. **backend.php** return response ke frontend
10. **Frontend** tampilkan hasil ke user

---

## 🔐 Keamanan

### ✅ DO (Lakukan):

1. **Simpan Secret Key di Environment Variable**
   ```php
   // Production
   define('API_SECRET_KEY', getenv('CAPTCHA_SECRET_KEY'));
   ```

2. **Validasi Input di Backend**
   ```php
   if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
       // Reject
   }
   ```

3. **Use HTTPS**
   ```
   https://api-server.cloud/php/
   ```

4. **Set Proper Domain di API Key**
   - Dashboard → API Keys → Domain: `api-server.cloud`

5. **Enable Error Logging**
   ```php
   error_log('Captcha failed: ' . $error);
   ```

### ❌ DON'T (Jangan):

1. **Jangan commit Secret Key ke Git**
   ```php
   // ❌ WRONG
   define('API_SECRET_KEY', 'sk_real_secret_key_here');
   ```

2. **Jangan validasi token di frontend**
   ```javascript
   // ❌ WRONG - Token harus divalidasi di backend!
   if (token.length > 0) { /* allow submit */ }
   ```

3. **Jangan expose error details ke user**
   ```php
   // ❌ WRONG
   echo "Database error: " . $e->getMessage();
   
   // ✅ CORRECT
   error_log($e->getMessage());
   echo "An error occurred";
   ```

4. **Jangan skip captcha validation**
   ```php
   // ❌ WRONG - Selalu validasi!
   // if (!empty($token)) { /* process without validation */ }
   
   // ✅ CORRECT
   $result = validateCaptcha($token);
   if ($result['success']) { /* process */ }
   ```

---

## 🧪 Testing

### Test 1: Captcha Widget Muncul?

Buka browser console (`F12`):
```javascript
// Cek script loaded
console.log(window.ProofCaptcha);  // Should be object

// Cek widget rendered
document.querySelector('.proof-captcha');  // Should exist
```

### Test 2: Token Validation Works?

Submit form dan check network tab (`F12` → Network):

**Request to backend.php:**
```
POST https://api-server.cloud/php/backend.php
captcha_token: eyJhbGc...
name: John Doe
email: john@example.com
```

**Response should be:**
```json
{
  "success": true,
  "message": "Registrasi berhasil!",
  "data": {...}
}
```

### Test 3: Error Handling Works?

Try to submit **without** solving captcha:
- Should show error: "captcha harus diselesaikan"

Try with **invalid token**:
- Should show error: "Verifikasi CAPTCHA gagal"

---

## 🐛 Troubleshooting

### Captcha Widget Tidak Muncul

**Problem:** Widget kosong atau tidak render

**Solutions:**
1. Check browser console untuk error
2. Pastikan script URL benar:
   ```html
   <script src="https://[REPLIT_DOMAIN]/proofCaptcha/api.js"></script>
   ```
3. Pastikan sitekey benar (pk_...)
4. Check CORS - pastikan domain allowed

---

### Error: "Verifikasi CAPTCHA gagal"

**Problem:** Backend tidak bisa validasi token

**Solutions:**
1. **Check Secret Key**
   ```php
   define('API_SECRET_KEY', 'sk_...');  // Bukan pk_!
   ```

2. **Check Authorization Header**
   ```php
   'Authorization: Bearer ' . API_SECRET_KEY
   ```

3. **Check cURL installed**
   ```bash
   php -m | grep curl
   ```

4. **Enable error logging**
   ```php
   error_log(json_encode($captchaResult));
   ```

5. **Test endpoint directly**
   ```bash
   curl -X POST https://[REPLIT]/api/captcha/verify-token \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer sk_your_key" \
     -d '{"token": "your_token"}'
   ```

---

### Error: "Domain Mismatch"

**Problem:** Domain tidak match dengan API key setting

**Solutions:**
1. Check domain di dashboard API Keys
2. Pastikan match dengan domain server Anda:
   ```
   Dashboard: api-server.cloud
   Server:    api-server.cloud  ✓
   ```
3. Untuk testing, set domain ke `*` (wildcard)

---

### PHP Errors

**Problem:** 500 Internal Server Error

**Solutions:**
1. **Enable PHP error display**
   ```php
   error_reporting(E_ALL);
   ini_set('display_errors', 1);
   ```

2. **Check PHP error log**
   ```bash
   tail -f /var/log/apache2/error.log
   # or
   tail -f /var/log/php-fpm/error.log
   ```

3. **Check file permissions**
   ```bash
   ls -la backend.php  # Should be readable
   ```

---

## 📝 Customization

### Change Form Fields

Edit `index.html`:
```html
<div class="form-group">
    <label for="phone">Phone Number</label>
    <input type="tel" id="phone" name="phone" required>
</div>
```

Edit `backend.php`:
```php
$phone = $_POST['phone'] ?? '';

if (empty($phone)) {
    echo json_encode(['success' => false, 'message' => 'Phone required']);
    exit;
}
```

### Save to Database

Edit `backend.php`:
```php
// After captcha validation success
try {
    $pdo = new PDO('mysql:host=localhost;dbname=mydb', 'user', 'pass');
    $stmt = $pdo->prepare('INSERT INTO users (name, email) VALUES (?, ?)');
    $stmt->execute([$name, $email]);
    
    $userId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'User created',
        'userId' => $userId
    ]);
} catch (PDOException $e) {
    error_log('DB Error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error'
    ]);
}
```

### Send Email After Registration

```php
// After captcha validation success
$to = $email;
$subject = 'Welcome to Our Site';
$message = "Hello $name, welcome!";
$headers = 'From: noreply@api-server.cloud';

if (mail($to, $subject, $message, $headers)) {
    error_log("Welcome email sent to $email");
}
```

### Custom Styling

Edit `index.html` CSS section:
```css
.btn {
    background: #your-brand-color;
}

.card {
    border-radius: 24px;  /* More rounded */
}
```

---

## 📚 Next Steps

1. **Production Checklist:**
   - [ ] Secret key di environment variable
   - [ ] Domain spesifik (bukan `*`)
   - [ ] HTTPS enabled
   - [ ] Error logging setup
   - [ ] Database integration
   - [ ] Email notifications

2. **Advanced Features:**
   - Add rate limiting
   - Add IP blocking for failed attempts
   - Add email verification
   - Add user dashboard
   - Add admin panel

3. **Monitoring:**
   - Track captcha success rate
   - Monitor failed validations
   - Log suspicious activities
   - Setup alerts for errors

---

## 🆘 Need Help?

**Resources:**
- Full documentation: `INTEGRATION_GUIDE.md`
- Quick start: `QUICK_START.md`
- Code examples: `backend-example.js`
- Test page: `test.html`

**Common Issues:**
- Check server error logs
- Check browser console
- Verify API keys
- Test with curl

---

**Happy Coding! 🎉**

Made with ❤️ for PHP Developers
