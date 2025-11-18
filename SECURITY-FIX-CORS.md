# 🔒 Security Fix: CORS Configuration

## 📋 Masalah yang Diperbaiki

**Bug #2: CORS Terlalu Permisif**

### Masalah Sebelumnya:
```typescript
// ❌ BAHAYA: Allow semua origin dengan credentials
app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin || true); // Allow ALL origins
  },
  credentials: true,  // Dengan cookies/session
}));
```

**Risiko Keamanan:**
- Website manapun bisa mengakses API dengan cookies user
- Potensi CSRF attacks meski sudah ada CSRF token
- Developer dashboard bisa diakses dari website eksternal
- Session hijacking jika ada XSS vulnerability

---

## ✅ Solusi yang Diimplementasikan

### Strategi: Dynamic CORS berdasarkan Endpoint Type

**1. Public Endpoints (CAPTCHA)**
```typescript
// ✅ Allow all origins - diperlukan untuk widget CAPTCHA
const publicEndpoints = [
  '/api/captcha/challenge',
  '/api/captcha/verify',
  '/api/captcha/handshake',
  '/proofCaptcha/api/siteverify',
  '/api/demo/key',
  '/assets',
  '/health'
];
```

**Mengapa boleh allow all origins?**
- CAPTCHA widget harus bisa di-embed di website manapun
- Tidak ada data sensitif yang di-expose
- Token verification dilakukan server-side
- Rate limiting tetap aktif

**2. Private Endpoints (Dashboard/Auth)**
```typescript
// ✅ Same-origin only - untuk keamanan maksimal
const privateEndpoints = [
  '/api/auth/*',
  '/api/keys/*',
  '/api/admin/*',
  '/api/security/*'
];
```

**Proteksi:**
- Hanya request dari origin yang sama (same-origin)
- Cross-origin request akan di-reject dengan error
- Mencegah external website mengakses dashboard
- Session cookies tetap aman

---

## 🔍 Cara Kerja Implementasi

### Public Endpoints Flow:
```
External Website → CAPTCHA Widget → /api/captcha/challenge
                                           ↓
                          CORS: Allow (any origin with credentials)
                                           ↓
                                   Challenge Generated
```

### Private Endpoints Flow:
```
External Website → Dashboard API → /api/keys
                                      ↓
                    CORS: Check origin === host header
                                      ↓
                      Match? ✅ Allow : ❌ Reject
```

---

## 🧪 Testing

### Test 1: Public Endpoint (harus allow semua origin)
```bash
# Test dari origin eksternal
curl -H "Origin: https://example.com" \
     -H "Content-Type: application/json" \
     -d '{"sitekey":"pk_xxx","type":"grid"}' \
     https://your-domain.com/api/captcha/challenge

# Expected: Success (200 OK)
```

### Test 2: Private Endpoint dari same-origin
```bash
# Test dari origin yang sama
curl -H "Origin: https://your-domain.com" \
     -H "Cookie: connect.sid=xxx" \
     https://your-domain.com/api/keys

# Expected: Success (200 OK)
```

### Test 3: Private Endpoint dari cross-origin (harus di-reject)
```bash
# Test dari origin eksternal
curl -H "Origin: https://malicious-site.com" \
     -H "Cookie: connect.sid=xxx" \
     https://your-domain.com/api/keys

# Expected: CORS Error
```

---

## 📊 Perbandingan Before/After

| Aspek | Before (Vulnerable) | After (Secure) |
|-------|---------------------|----------------|
| CAPTCHA endpoints | ✅ Allow all origins | ✅ Allow all origins |
| Dashboard endpoints | ❌ Allow all origins | ✅ Same-origin only |
| Auth endpoints | ❌ Allow all origins | ✅ Same-origin only |
| CSRF Protection | ⚠️ Partial | ✅ Complete |
| Session Security | ⚠️ At Risk | ✅ Protected |

---

## 🎯 Manfaat Keamanan

1. **Mencegah CSRF Attacks**
   - External websites tidak bisa access dashboard dengan cookies user
   - Meski CSRF token di-bypass, CORS tetap block

2. **Mencegah Session Hijacking**
   - Session cookies hanya bisa digunakan dari origin yang sama
   - Mengurangi attack surface untuk XSS exploitation

3. **Compliance dengan Security Best Practices**
   - OWASP Top 10 compliance
   - Principle of Least Privilege
   - Defense in Depth

4. **Backward Compatible**
   - CAPTCHA widget tetap berfungsi di semua website
   - Existing integrations tidak terpengaruh
   - Developer dashboard tetap accessible dari aplikasi utama

---

## ⚠️ Important Notes

### Untuk Developer:
- **Frontend harus di-serve dari same-origin dengan backend** untuk akses dashboard
- Jika menggunakan separate domain untuk frontend, tambahkan domain tersebut ke whitelist
- Development mode: localhost tetap allowed

### Untuk Production:
- Pastikan frontend dan backend di-host di domain yang sama atau subdomain
- Contoh: 
  - ✅ `app.proofcaptcha.com` (frontend) → `app.proofcaptcha.com/api` (backend)
  - ✅ `proofcaptcha.com` (frontend) → `api.proofcaptcha.com` (backend - dengan config)
  - ❌ `mywebsite.com` (frontend) → `proofcaptcha.com` (backend - akan di-reject)

---

## 🔧 Customization (Jika Diperlukan)

Jika Anda perlu mengizinkan specific origin untuk private endpoints:

```typescript
// Di server/index.ts, tambahkan ke whitelist
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://your-custom-domain.com'
].filter(Boolean);

// Update logic di private endpoints:
if (!origin) {
  callback(null, true);
  return;
}

if (allowedOrigins.includes(origin) || requestOrigin.host === hostHeader) {
  callback(null, true);
} else {
  callback(new Error('CORS policy: Origin not allowed'));
}
```

---

## ✅ Status

- [x] Bug identified
- [x] Solution implemented
- [x] Tested locally
- [x] Documentation created
- [ ] Production deployment (pending)

---

**Tanggal Fix**: 18 November 2025  
**Severity**: MEDIUM → RESOLVED  
**Impact**: Keamanan dashboard dan authentication endpoints meningkat signifikan
