#!/usr/bin/env node

import JavaScriptObfuscator from 'javascript-obfuscator';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, dirname, relative, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Konfigurasi obfuscation maksimal untuk semua file source
const maxObfuscationConfig = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 1,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.5,
  debugProtection: true,
  debugProtectionInterval: 4000,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 5,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['rc4'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 5,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 5,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 1,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

// Folder yang akan di-skip
const skipFolders = [
  'node_modules',
  'dist',
  'backup',
  '.git',
  '.next',
  '.cache',
  'coverage',
  'build',
  '.local'
];

// File yang akan di-skip
const skipFiles = [
  'obfuscate.js',
  'obfuscate-source.js',
  'restore-source.js',
  'setup-database.ts'
];

function shouldSkip(path) {
  const pathParts = path.split('/');
  
  // Skip jika mengandung folder yang di-skip
  for (const folder of skipFolders) {
    if (pathParts.includes(folder)) {
      return true;
    }
  }
  
  // Skip jika nama file ada di daftar skip
  const fileName = pathParts[pathParts.length - 1];
  if (skipFiles.includes(fileName)) {
    return true;
  }
  
  return false;
}

function getAllSourceFiles(dirPath, arrayOfFiles = [], baseDir = dirPath) {
  const files = readdirSync(dirPath);

  files.forEach(file => {
    const filePath = join(dirPath, file);
    const relativePath = relative(baseDir, filePath);
    
    if (shouldSkip(relativePath)) {
      return;
    }
    
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllSourceFiles(filePath, arrayOfFiles, baseDir);
    } else {
      const ext = extname(file);
      if (ext === '.js' || ext === '.mjs' || ext === '.ts') {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

function backupFile(filePath, backupDir, projectRoot) {
  const relativePath = relative(projectRoot, filePath);
  const backupPath = join(backupDir, relativePath);
  const backupDirPath = dirname(backupPath);
  
  if (!existsSync(backupDirPath)) {
    mkdirSync(backupDirPath, { recursive: true });
  }
  
  copyFileSync(filePath, backupPath);
  return backupPath;
}

function obfuscateSourceFile(filePath, projectRoot) {
  try {
    const relativePath = relative(projectRoot, filePath);
    console.log(`🔒 Mengobfuscate: ${relativePath}`);
    
    let code = readFileSync(filePath, 'utf8');
    
    // Jika file TypeScript, kita obfuscate sebagai JavaScript
    // (dalam production, TypeScript sudah di-compile ke JS)
    const ext = extname(filePath);
    
    // Untuk file .ts, kita tambahkan comment bahwa ini obfuscated TypeScript
    if (ext === '.ts') {
      code = `/* Obfuscated TypeScript - Compile to JavaScript before running */\n${code}`;
    }
    
    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, maxObfuscationConfig);
    
    writeFileSync(filePath, obfuscationResult.getObfuscatedCode());
    console.log(`✅ Berhasil: ${relativePath}`);
  } catch (error) {
    console.error(`❌ Error mengobfuscate ${filePath}:`, error.message);
  }
}

async function main() {
  const projectRoot = join(__dirname, '..');
  const backupDir = join(projectRoot, 'backup');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timestampedBackupDir = join(backupDir, `backup-${timestamp}-${Date.now()}`);
  
  console.log('🚀 Memulai proses backup dan obfuscation SOURCE CODE...\n');
  console.log('⚠️  PERHATIAN: File original akan diganti dengan versi obfuscated!');
  console.log('📦 Backup akan disimpan di:', relative(projectRoot, timestampedBackupDir));
  console.log('');
  
  // Buat folder backup
  if (!existsSync(timestampedBackupDir)) {
    mkdirSync(timestampedBackupDir, { recursive: true });
  }
  
  // Dapatkan semua file source
  const allFiles = getAllSourceFiles(projectRoot);
  
  console.log(`📁 Ditemukan ${allFiles.length} file TypeScript/JavaScript\n`);
  
  // Backup semua file terlebih dahulu
  console.log('📋 Step 1/2: Backup semua file...\n');
  let backedUpCount = 0;
  
  allFiles.forEach(file => {
    const relativePath = relative(projectRoot, file);
    console.log(`💾 Backup: ${relativePath}`);
    backupFile(file, timestampedBackupDir, projectRoot);
    backedUpCount++;
  });
  
  console.log(`\n✅ ${backedUpCount} file telah di-backup!\n`);
  
  // Obfuscate semua file
  console.log('📋 Step 2/2: Obfuscate semua file...\n');
  
  allFiles.forEach(file => {
    obfuscateSourceFile(file, projectRoot);
  });
  
  console.log('\n✨ Proses selesai!');
  console.log(`📦 Backup original ada di: ${relative(projectRoot, timestampedBackupDir)}`);
  console.log('🔒 Semua source code telah di-obfuscate!');
  console.log('');
  console.log('⚠️  PENTING:');
  console.log('   - File original telah diganti dengan versi obfuscated');
  console.log('   - Backup original tersimpan di folder backup/');
  console.log('   - Untuk restore, copy kembali dari folder backup/');
  console.log('   - Jangan commit ke Git jika tidak perlu!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
