# Bootstrap Founder Account

## Masalah yang Dipecahkan

Sistem ProofCaptcha memiliki 2 role:
- **Founder**: Bisa mengelola developer, database, dan memiliki akses penuh
- **Developer**: User biasa yang bisa membuat API keys dan melihat analytics

Masalahnya, untuk membuat founder pertama kali, tidak ada cara karena:
1. ❌ Registrasi normal selalu membuat role "developer"
2. ❌ Endpoint update role butuh login sebagai founder
3. ❌ Tidak bisa manual update database (tidak aman)

## Solusi: Bootstrap Endpoint

Endpoint khusus `/api/bootstrap/create-founder` yang:
- ✅ Hanya bisa digunakan **SEKALI** (ketika belum ada founder)
- ✅ Otomatis disabled setelah founder pertama dibuat
- ✅ Membuat akun dengan role "founder" dan email sudah terverifikasi
- ✅ Auto-login setelah dibuat

## Cara Menggunakan

### Opsi 1: Via UI (Recommended)

1. Buka browser dan navigasi ke:
   ```
   http://localhost:5000/bootstrap
   ```

2. Isi form dengan:
   - **Full Name**: Nama lengkap Anda
   - **Email**: Email yang akan digunakan untuk login
   - **Password**: Password minimal 8 karakter

3. Klik tombol **"Create Founder Account"**

4. Anda akan otomatis login dan diarahkan ke Founder Dashboard

### Opsi 2: Via API

Jika Anda lebih suka menggunakan API langsung, Anda perlu mendapatkan CSRF token terlebih dahulu:

```bash
# Step 1: Get CSRF token
CSRF_TOKEN=$(curl -s http://localhost:5000/api/security/csrf -c cookies.txt | jq -r '.csrfToken')

# Step 2: Create founder with CSRF token
curl -X POST http://localhost:5000/api/bootstrap/create-founder \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b cookies.txt \
  -d '{
    "email": "founder@example.com",
    "password": "SecurePassword123!",
    "name": "Nama Founder"
  }'
```

Response jika berhasil:
```json
{
  "success": true,
  "message": "Founder account created successfully",
  "developer": {
    "id": "uuid-here",
    "email": "founder@example.com",
    "name": "Nama Founder",
    "role": "founder",
    "isEmailVerified": true
  }
}
```

Response jika sudah ada founder:
```json
{
  "error": "Forbidden",
  "message": "A founder account already exists. This endpoint is disabled."
}
```

## Setelah Bootstrap

Setelah founder pertama dibuat:

1. ✅ Login menggunakan email dan password yang dibuat
2. ✅ Akses Founder Dashboard di `/founder/dashboard`
3. ✅ Kelola developer lain di `/founder/developers`
4. ✅ Akses database operations di `/founder/database`

## Membuat Founder Tambahan

Jika Anda ingin menambahkan founder lain setelah yang pertama:

1. Login sebagai founder yang sudah ada
2. Buka Developer Management (`/founder/developers`)
3. Ubah role developer yang sudah ada dari "developer" menjadi "founder"

## Troubleshooting

### Error: "Email already registered"
Email tersebut sudah terdaftar sebagai developer. Anda bisa:
- Gunakan email lain untuk founder
- Atau login sebagai developer dan promote role-nya melalui founder dashboard

### Error: "A founder account already exists"
Endpoint bootstrap sudah disabled karena sudah ada founder. Gunakan akun founder yang ada untuk login.

### Tidak bisa akses `/bootstrap`
Pastikan server sudah berjalan:
```bash
npm run dev
```

Server harus berjalan di `http://localhost:5000`

## Keamanan

- ✅ Password di-hash dengan bcrypt (cost factor 10)
- ✅ Endpoint otomatis disabled setelah founder pertama
- ✅ Tidak perlu CAPTCHA (karena ini one-time setup)
- ✅ Email otomatis terverifikasi (founder pertama dipercaya)
- ✅ Session langsung dibuat (auto-login)

## File Terkait

- Backend endpoint: `server/routes.ts` (line 340-409)
- Frontend page: `client/src/pages/BootstrapFounder.tsx`
- Route config: `client/src/App.tsx`
- Schema: `shared/schema.ts` (developers table)
