# Environment Configuration Setup

## Overview

ProofCaptcha sudah dikonfigurasi untuk membaca semua pengaturan dari file `.env` lokal. Anda **tidak perlu** menggunakan Replit Secrets.

## Quick Setup

### 1. Copy Template File

```bash
cp .env.example .env
```

### 2. Edit File `.env`

Buka file `.env` dan isi nilai-nilai yang diperlukan:

```env
# Application Settings
NODE_ENV=development
SESSION_SECRET=generate-random-string-here

# SMTP Email Configuration
SMTP_HOST=webmail.api-server.cloud
SMTP_PORT=587
SMTP_USER=noreply@api-server.cloud
SMTP_PASSWORD=your-actual-smtp-password
SMTP_FROM_EMAIL=noreply@api-server.cloud
SMTP_TLS_REJECT_UNAUTHORIZED=true
SMTP_TLS_SERVERNAME=bekantan.kencang.com

# Database (Optional - jika kosong akan gunakan in-memory storage)
# DATABASE_URL=postgresql://user:password@host:port/database
```

### 3. Generate SESSION_SECRET

Untuk keamanan yang lebih baik, generate random string:

```bash
openssl rand -base64 32
```

## Konfigurasi Yang Diperlukan

### Wajib untuk Production:

1. **SESSION_SECRET** - Secret key untuk enkripsi session
   - Generate dengan: `openssl rand -base64 32`
   - Jangan gunakan nilai default!

2. **SMTP Configuration** - Untuk email verification dan password reset:
   - `SMTP_HOST` - SMTP server host
   - `SMTP_PORT` - Port (587 untuk TLS, 465 untuk SSL)
   - `SMTP_USER` - Username SMTP
   - `SMTP_PASSWORD` - Password SMTP
   - `SMTP_FROM_EMAIL` - Email pengirim
   - `SMTP_TLS_SERVERNAME` - Servername untuk TLS (jika berbeda dari host)

### Optional:

3. **DATABASE_URL** - PostgreSQL connection string
   - Jika tidak diset, aplikasi akan menggunakan in-memory storage (MemStorage)
   - Format: `postgresql://user:password@host:port/database`
   - Replit Database akan otomatis menyediakan variable ini jika database di-provision

## Cara Kerja

1. **Server startup** (`server/index.ts`):
   ```typescript
   import dotenv from "dotenv";
   dotenv.config(); // Memuat .env file
   ```

2. **Membaca nilai**:
   ```typescript
   const secret = process.env.SESSION_SECRET;
   const smtpHost = process.env.SMTP_HOST;
   ```

3. **Fallback values**:
   - Jika variable tidak diset, aplikasi akan menggunakan default atau menampilkan warning
   - Email service akan disabled jika SMTP config tidak lengkap
   - Database akan fallback ke MemStorage jika DATABASE_URL tidak ada

## Keamanan

- ✅ File `.env` sudah ada di `.gitignore` - **tidak akan di-commit**
- ✅ File `.env.example` sebagai template (tanpa nilai sensitif)
- ✅ Gunakan `.env` untuk development
- ✅ Gunakan environment variables untuk production (Replit deployment)

## Testing

Setelah setup `.env`, restart aplikasi:

```bash
npm run dev
```

Cek logs untuk memastikan konfigurasi berhasil dimuat:
- `[EMAIL] Email service initialized successfully` - SMTP OK
- `[STORAGE] Using DatabaseStorage` - Database connected
- Atau `[STORAGE] Falling back to MemStorage` - Menggunakan in-memory

## Troubleshooting

### Email tidak terkirim
- Periksa `SMTP_*` variables di `.env`
- Pastikan `SMTP_PASSWORD` sudah diisi
- Cek `SMTP_TLS_SERVERNAME` sesuai dengan certificate server

### Database error
- Periksa `DATABASE_URL` format nya benar
- Atau hapus `DATABASE_URL` untuk gunakan MemStorage

### Session tidak persist
- Pastikan `SESSION_SECRET` diset (bukan nilai default)
