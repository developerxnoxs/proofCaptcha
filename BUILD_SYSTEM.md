# Build System Documentation

## Overview

Sistem build production dengan automated TypeScript backup dan restore untuk switch efisien antara development dan production mode.

## Available Scripts

### Development Mode
```bash
npm run dev
```
Jalankan aplikasi dalam mode development dengan TypeScript langsung menggunakan `tsx`.

### Production Build dengan Backup (Safe Mode)

```bash
npm run build:prod
```
**Apa yang dilakukan (Safe Workflow):**
1. ✓ Build frontend dengan Vite → `dist/public/`
2. ✓ Build backend dengan esbuild → `dist/index.js`
3. ✓ Verify build output (check files exist and valid)
4. ✓ **ONLY IF BUILD SUCCEEDS:** Backup semua file TypeScript (.ts/.tsx) ke folder `.backup-ts/`
5. ✓ **ONLY IF BUILD SUCCEEDS:** Hapus file TypeScript asli dari project
6. ✓ Simpan manifest backup di `.backup-ts/manifest.json`

**Keamanan:**
- ✅ File TypeScript TIDAK AKAN dihapus jika build gagal
- ✅ Build error tidak akan merusak source code Anda
- ✅ Rollback otomatis jika ada masalah

**Setelah build, project hanya berisi:**
- File JavaScript hasil build di folder `dist/`
- File backup TypeScript di folder `.backup-ts/`
- Dependencies di `node_modules/`

### Manual Backup & Restore

#### Backup Manual
```bash
npm run backup:ts
```
Backup semua file TypeScript tanpa melakukan build.

#### Restore Manual
```bash
npm run restore:ts
```
Restore semua file TypeScript dari backup. Backup folder akan dihapus setelah restore.

**Opsi: Keep Backup**
```bash
node scripts/restore-ts.js --keep-backup
```
Restore file TypeScript tapi tetap simpan folder backup.

### Switch ke Development Mode

```bash
npm run restore:dev
```
**Apa yang dilakukan:**
1. ✓ Restore semua file TypeScript dari backup
2. ✓ Hapus folder `.backup-ts/`
3. ✓ Langsung jalankan `npm run dev`

Ini adalah shortcut untuk kembali ke development mode dengan satu command.

### Production Server

```bash
npm run start
# atau
npm run start:prod
```
Jalankan production server dari file build `dist/index.js`.

## Workflow: Development → Production → Development

### 1. Saat Development
```bash
npm run dev
```
Coding dengan TypeScript, hot-reload aktif.

### 2. Build untuk Production
```bash
npm run build:prod
```
Output:
```
[BUILD] Starting safe production build...
[BUILD] Step 1: Building project...

> vite build
... (Vite build output)

> esbuild server/index.ts ...
... (esbuild output)

[BUILD] ✓ Build completed successfully!
[BUILD] Step 2: Verifying build output...

[BUILD] ✓ Build verification passed!
[BUILD]   - Frontend: /path/to/dist/public (42 files)
[BUILD]   - Backend: /path/to/dist/index.js

[BUILD] Step 3: Backing up and removing TypeScript files...

[BACKUP] Starting TypeScript files backup...
[BACKUP] Found 127 TypeScript files
[BACKUP] Progress: 50/127 files backed up
[BACKUP] Progress: 100/127 files backed up
[BACKUP] ✓ Complete!
[BACKUP] - Backed up: 127 files
[BACKUP] - Removed: 127 files
[BACKUP] - Location: /path/to/.backup-ts
[BACKUP] - Manifest saved to: /path/to/.backup-ts/manifest.json

[BUILD] ✓ Production build complete!
[BUILD] Project is ready for production deployment.
[BUILD] To restore development mode: npm run restore:dev
```

**Jika Build Gagal:**
```
[BUILD] Starting safe production build...
[BUILD] Step 1: Building project...

... (error messages) ...

[BUILD] ✗ Build failed!
[BUILD] Error: [error details]

[BUILD] TypeScript files were NOT modified (safe).
[BUILD] Fix the build errors and try again.
```
✅ **Source code Anda tetap aman!**

### 3. Test Production Build
```bash
npm run start:prod
```

### 4. Kembali ke Development
```bash
npm run restore:dev
```
Output:
```
[RESTORE] Starting TypeScript files restoration...
[RESTORE] Backup created: 2025-11-21T20:34:18.000Z
[RESTORE] Files to restore: 127
[RESTORE] Progress: 50/127 files restored
[RESTORE] Progress: 100/127 files restored
[RESTORE] ✓ Complete!
[RESTORE] - Restored: 127 files
[RESTORE] - Errors: 0 files
[RESTORE] Removing backup directory...
[RESTORE] ✓ Backup directory removed

> npm run dev
... (development server starts)
```

## Backup Manifest Structure

File `.backup-ts/manifest.json` berisi informasi backup:

```json
{
  "timestamp": "2025-11-21T20:34:18.625Z",
  "totalFiles": 127,
  "backedUp": 127,
  "removed": 127,
  "files": [
    "server/index.ts",
    "server/routes.ts",
    "client/src/main.tsx",
    "client/src/App.tsx",
    "shared/schema.ts",
    ...
  ]
}
```

## File & Folder Structure

### Sebelum Build Production
```
project/
├── server/
│   ├── index.ts         ← TypeScript files
│   ├── routes.ts
│   └── ...
├── client/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       └── ...
├── shared/
│   └── schema.ts
└── package.json
```

### Setelah Build Production
```
project/
├── dist/                 ← Build output
│   ├── public/          ← Frontend build
│   │   ├── index.html
│   │   ├── assets/
│   │   └── ...
│   └── index.js         ← Backend build
├── .backup-ts/          ← TypeScript backup
│   ├── server/
│   │   ├── index.ts
│   │   └── routes.ts
│   ├── client/
│   │   └── src/
│   ├── shared/
│   │   └── schema.ts
│   └── manifest.json
├── node_modules/
└── package.json
```

### Setelah Restore
Kembali ke struktur seperti "Sebelum Build Production".

## Excluded Directories

Script backup/restore otomatis mengecualikan folder berikut:
- `node_modules/`
- `dist/`
- `.git/`
- `.backup-ts/`
- `.cache/`
- `build/`
- `coverage/`

## Security & Best Practices

### ✅ DO
- Selalu gunakan `npm run build:prod` untuk production build
- Test production build dengan `npm run start:prod` sebelum deploy
- Gunakan `npm run restore:dev` untuk kembali ke development
- Keep backup dengan `--keep-backup` jika ingin safety net

### ❌ DON'T
- Jangan edit file di `.backup-ts/` secara manual
- Jangan commit folder `.backup-ts/` ke Git
- Jangan jalankan production server tanpa build dulu
- Jangan restore tanpa backup yang valid

## Git Integration

Tambahkan ke `.gitignore`:
```gitignore
# Build output
dist/

# TypeScript backup
.backup-ts/
```

## Troubleshooting

### Error: "Backup directory not found"
**Solusi:** Belum pernah jalankan backup. Run `npm run backup:ts` dulu atau `npm run build:prod`.

### Error: "Backup file not found: [file]"
**Solusi:** Backup corrupt atau tidak lengkap. Hapus `.backup-ts/` dan build ulang dari source yang clean.

### Development mode tidak jalan setelah restore
**Solusi:**
```bash
# Clear node_modules dan reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Vite error "Failed to load url"
**Penyebab:** Path resolution issue atau file tidak ditemukan.
**Solusi:** Error ini sudah diperbaiki di `vite.config.ts` terbaru dengan:
- Proper `__dirname` using `fileURLToPath`
- Enhanced `fs.allow` configuration
- Improved error handling di `server/vite.ts`

## Performance Tips

### Build Speed
- TypeScript backup/remove: ~1-2 detik untuk ~100 files
- Vite build: Tergantung ukuran project (biasanya 10-30 detik)
- esbuild backend: Sangat cepat (~1-2 detik)
- Restore: ~1 detik untuk ~100 files

### Optimization
Build production sudah teroptimasi dengan:
- Vite tree-shaking dan code splitting
- esbuild untuk backend (super fast)
- Manifest untuk tracking backup files
- Parallel file operations

## How Backup Works (Transactional & Safe)

### Two-Phase Commit
Backup script menggunakan **transactional workflow** untuk mencegah data loss:

**Phase 1: Copy & Verify**
```
[BACKUP] Phase 1: Copying all files to backup...
- Copy setiap file TypeScript
- Verify file size match (original == backup)
- Abort jika ada yang gagal
- TIDAK DELETE apapun di phase ini
```

**Phase 2: Remove (Only if Phase 1 succeeds)**
```
[BACKUP] Phase 2: Removing original TypeScript files...
- Delete file asli HANYA jika semua backup verified
- Jika Phase 1 gagal, Phase 2 TIDAK akan dijalankan
```

### Safety Guarantees
✅ **No Partial Failures**: All files copied OR none deleted  
✅ **Size Verification**: Each backup verified byte-for-byte  
✅ **Abort on Error**: First error stops entire process  
✅ **Data Integrity**: Source code never orphaned  

## Advanced Usage

### Custom Backup Location
Edit `scripts/backup-ts.js`:
```javascript
const backupDir = path.join(rootDir, 'your-custom-backup-folder');
```

### Exclude Additional Files
Edit `excludeDirs` array di `scripts/backup-ts.js`:
```javascript
const excludeDirs = [
  'node_modules',
  'dist',
  '.git',
  '.backup-ts',
  'your-custom-folder', // Add here
];
```

## Support

Jika ada masalah dengan build system:
1. Check logs dari `npm run build:prod`
2. Verify backup manifest di `.backup-ts/manifest.json`
3. Ensure tidak ada TypeScript errors dengan `npm run check`
4. Contact development team jika masalah persist

---

**Last Updated:** November 21, 2025  
**Version:** 1.0.0
