#!/usr/bin/env node

import { readdirSync, statSync, copyFileSync, rmSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);

  files.forEach(file => {
    const filePath = join(dirPath, file);
    
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function getBackupFolders(backupDir) {
  if (!existsSync(backupDir)) {
    return [];
  }
  
  const folders = readdirSync(backupDir)
    .filter(name => {
      const path = join(backupDir, name);
      return statSync(path).isDirectory() && name.startsWith('backup-');
    })
    .map(name => ({
      name,
      path: join(backupDir, name),
      mtime: statSync(join(backupDir, name)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime); // Sort descending (newest first)
  
  return folders;
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function main() {
  const projectRoot = join(__dirname, '..');
  const backupDir = join(projectRoot, 'backup');
  
  console.log('🔄 Proses Restore Source Code dari Backup\n');
  
  // Check if backup folder exists
  if (!existsSync(backupDir)) {
    console.error('❌ Folder backup tidak ditemukan!');
    console.log('💡 Belum ada backup yang tersimpan.');
    process.exit(1);
  }
  
  // Get all backup folders
  const backupFolders = getBackupFolders(backupDir);
  
  if (backupFolders.length === 0) {
    console.error('❌ Tidak ada folder backup yang tersedia!');
    process.exit(1);
  }
  
  console.log(`📦 Ditemukan ${backupFolders.length} backup:\n`);
  
  // Show all backups
  backupFolders.forEach((backup, index) => {
    const date = backup.mtime.toLocaleString('id-ID');
    console.log(`  ${index + 1}. ${backup.name}`);
    console.log(`     Tanggal: ${date}`);
    console.log('');
  });
  
  // Auto-select the newest backup
  const selectedBackup = backupFolders[0];
  
  console.log(`✅ Menggunakan backup terbaru: ${selectedBackup.name}\n`);
  
  // Confirm before restore
  console.log('⚠️  PERINGATAN:');
  console.log('   - Semua file obfuscated akan diganti dengan file original');
  console.log('   - Folder backup akan dihapus setelah restore selesai');
  console.log('   - Proses ini TIDAK BISA dibatalkan!\n');
  
  const answer = await askQuestion('Lanjutkan restore? (yes/no): ');
  
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('❌ Restore dibatalkan.');
    process.exit(0);
  }
  
  console.log('\n🚀 Memulai restore...\n');
  
  // Get all files from backup
  const backupFiles = getAllFiles(selectedBackup.path);
  
  console.log(`📁 Ditemukan ${backupFiles.length} file di backup\n`);
  
  // Restore each file
  let restoredCount = 0;
  
  backupFiles.forEach(backupFilePath => {
    const relativePath = relative(selectedBackup.path, backupFilePath);
    const originalPath = join(projectRoot, relativePath);
    const originalDir = dirname(originalPath);
    
    try {
      // Copy file from backup to original location
      copyFileSync(backupFilePath, originalPath);
      console.log(`✅ Restore: ${relativePath}`);
      restoredCount++;
    } catch (error) {
      console.error(`❌ Error restore ${relativePath}:`, error.message);
    }
  });
  
  console.log(`\n✅ ${restoredCount} file telah di-restore!\n`);
  
  // Delete backup folder
  console.log('🗑️  Menghapus folder backup...\n');
  
  try {
    rmSync(backupDir, { recursive: true, force: true });
    console.log('✅ Folder backup berhasil dihapus!\n');
  } catch (error) {
    console.error('⚠️  Warning: Gagal menghapus folder backup:', error.message);
    console.log('💡 Anda bisa menghapusnya secara manual.\n');
  }
  
  console.log('✨ Restore selesai!');
  console.log('🎉 Semua file telah dikembalikan ke versi original!');
  console.log('');
  console.log('💡 TIP:');
  console.log('   - File terobfuscate telah diganti dengan file original');
  console.log('   - Anda bisa langsung melanjutkan development');
  console.log('   - Jika ingin obfuscate lagi, jalankan: npm run obfuscate:source');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
