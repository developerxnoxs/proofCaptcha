# Quick Start Guide

## 🚀 Setup dalam 3 Langkah

### 1. Setup Environment Variables

Jalankan script setup otomatis:

```bash
npm run setup:env
```

Script ini akan:
- Copy template dari `.env.example` ke `.env`
- Generate secure random `SESSION_SECRET` secara otomatis
- Membuat file `.env` siap untuk diedit

**Atau manual** (jika lebih suka):

```bash
cp .env.example .env
```

### 2. Edit Konfigurasi SMTP (Wajib untuk Email)

Buka file `.env` dan isi kredensial SMTP Anda:

```env
SMTP_HOST=webmail.api-server.cloud
SMTP_PORT=587
SMTP_USER=noreply@api-server.cloud
SMTP_PASSWORD=isi-password-anda-disini
SMTP_FROM_EMAIL=noreply@api-server.cloud
SMTP_TLS_SERVERNAME=bekantan.kencang.com
```

> **Penting**: Tanpa SMTP password yang valid, fitur email verification dan password reset tidak akan berfungsi.

### 3. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di: `http://localhost:5000`

## 📋 Konfigurasi Lengkap

Lihat file:
- **`.env.example`** - Template dengan semua variable yang tersedia
- **`ENV-SETUP.md`** - Dokumentasi lengkap semua environment variables

## 🔐 Keamanan

- ✅ File `.env` **tidak akan** di-commit ke Git (sudah ada di `.gitignore`)
- ✅ Gunakan `.env.example` sebagai referensi (tanpa nilai sensitif)
- ✅ `SESSION_SECRET` di-generate secara otomatis (secure random)

## 🗄️ Database (Optional)

Secara default, aplikasi menggunakan **in-memory storage** (MemStorage).

Untuk menggunakan PostgreSQL:

1. Provision database di Replit, atau
2. Set `DATABASE_URL` di `.env`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## 📧 Testing Email

Setelah setup SMTP, test dengan:

1. Register akun baru
2. Cek email untuk verification code
3. Atau test forgot password flow

## ❓ Troubleshooting

### Email tidak terkirim?
- Periksa `SMTP_PASSWORD` sudah diisi
- Cek `SMTP_HOST` dan `SMTP_PORT` benar
- Pastikan `SMTP_TLS_SERVERNAME` sesuai certificate

### Session tidak persist?
- Pastikan `SESSION_SECRET` diset (bukan default value)
- Cek server logs untuk error

### Database error?
- Hapus `DATABASE_URL` dari `.env` untuk gunakan in-memory storage
- Atau cek format connection string benar

## 🔄 Reset Konfigurasi

Jika ingin reset `.env`:

```bash
rm .env
npm run setup:env
```

## 📚 Dokumentasi Lengkap

- `ENV-SETUP.md` - Setup environment variables
- `replit.md` - Dokumentasi lengkap proyek
