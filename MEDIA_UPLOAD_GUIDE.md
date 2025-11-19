# Panduan Upload Media dan Gambar di Chat WebSocket

## Masalah yang Diperbaiki

Berdasarkan riset dari internet tentang cara upload media/gambar di WebSocket React, saya telah memperbaiki beberapa masalah:

### 1. Content Security Policy (CSP) Headers
- ✅ Ditambahkan `blob:` ke `img-src` untuk preview gambar
- ✅ Ditambahkan `ws: wss:` ke `connect-src` untuk koneksi WebSocket

### 2. Directory Upload
- ✅ Otomatis membuat folder `public/uploads/chat-media/` jika belum ada
- ✅ Menambahkan logging untuk tracking upload file

### 3. Arsitektur Upload (Best Practice dari Internet)

Aplikasi ini menggunakan **pendekatan terbaik** untuk upload media di chat:
```
1. Upload file via HTTP POST (/api/chat/upload-media)
   └─> Multer menyimpan file ke disk
   └─> Server return mediaUrl
   
2. Kirim pesan via WebSocket dengan mediaUrl
   └─> WebSocket broadcast ke semua client
   
3. Client lain fetch gambar via HTTP (static serving)
   └─> Tampilkan di chat message
```

**Kenapa pendekatan ini lebih baik?**
- ✅ Tidak membebani WebSocket dengan data binary besar
- ✅ File disimpan permanent di server
- ✅ Browser bisa cache gambar dengan efisien
- ✅ Support file besar (sampai 10MB)

## Cara Menggunakan Upload Media

### 1. Login ke aplikasi
- Buka halaman `/login` atau `/register`
- Login dengan akun developer Anda

### 2. Buka halaman Chat
- Klik menu "Chat" atau buka `/chat`
- Pastikan status koneksi menunjukkan "Live" (hijau)

### 3. Upload Gambar/Media
1. Klik tombol 📎 (Paperclip) di kiri bawah
2. Pilih file (gambar, PDF, dokumen, dll)
3. Preview akan muncul di atas input box
4. Tulis pesan (opsional) atau biarkan default
5. Klik tombol ➤ (Send) untuk kirim

### 4. Media yang Didukung
**Gambar:**
- JPEG, PNG, GIF, WebP

**Dokumen:**
- PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX

**Lainnya:**
- TXT, CSV, ZIP, RAR, 7Z

**Max size:** 10MB per file

## Troubleshooting

### Preview gambar tidak muncul?
- **Solusi:** CSP sudah diperbaiki untuk allow `blob:` URLs
- Clear browser cache dan refresh

### Gambar tidak tampil setelah dikirim?
- **Check:** Buka browser DevTools (F12) → Console
- **Check:** Buka browser DevTools → Network tab
- Lihat apakah request ke `/uploads/chat-media/filename.jpg` sukses (200)
- Jika 404: file mungkin gagal upload, cek server logs

### Media tidak terkirim?
- **Check:** Status koneksi harus "Live" (hijau)
- **Check:** File size harus < 10MB
- **Check:** File type harus didukung
- Lihat error message di toast notification

## Technical Details (untuk Developer)

### Frontend (React)
```typescript
// File preview menggunakan blob URL
const imagePreviewUrl = URL.createObjectURL(file);

// Upload via HTTP
const formData = new FormData();
formData.append('media', selectedMedia);
const response = await fetch('/api/chat/upload-media', {
  method: 'POST',
  body: formData,
  credentials: 'include',
  headers: { 'x-csrf-token': csrfToken }
});

// Kirim via WebSocket
ws.send(JSON.stringify({
  type: 'message',
  payload: {
    content: message,
    mediaUrl: data.media.url,
    mediaType: data.media.type,
    mediaName: data.media.name
  }
}));
```

### Backend (Node.js/Express)
```typescript
// Multer untuk handle upload
const chatMediaStorage = multer.diskStorage({
  destination: 'public/uploads/chat-media',
  filename: Date.now() + '-' + nanoid(10) + ext
});

// Static serving
app.use('/uploads', express.static('public/uploads'));

// WebSocket broadcast
wss.clients.forEach(client => {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({
      type: 'message',
      payload: savedMessage
    }));
  }
});
```

### Security
- ✅ CSRF protection untuk upload
- ✅ File type validation (block HTML, JS, SVG scripts)
- ✅ File size limit (10MB)
- ✅ Unique filename dengan nanoid
- ✅ Content-Disposition: attachment untuk non-image files

## Referensi
Implementasi berdasarkan best practices dari:
- Stack Overflow: "How to send File through Websocket"
- Medium: "Using Web-Sockets for Realtime Image updates"
- MDN Web Docs: "WebSocket binaryType property"

Pendekatan yang digunakan: **HTTP Upload + WebSocket Notification** (recommended untuk production)
