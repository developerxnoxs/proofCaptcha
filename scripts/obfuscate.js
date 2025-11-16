#!/usr/bin/env node

import JavaScriptObfuscator from 'javascript-obfuscator';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Konfigurasi obfuscation untuk API/Backend (Perlindungan Maksimal)
const serverObfuscationConfig = {
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

// Konfigurasi obfuscation untuk Client/Frontend (Lebih ringan agar performa tetap baik)
const clientObfuscationConfig = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 2,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.8,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);

  files.forEach(file => {
    const filePath = join(dirPath, file);
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function obfuscateFile(filePath, outputDir) {
  try {
    const relativePath = relative(outputDir, filePath);
    
    // Deteksi apakah file adalah frontend atau backend
    const isFrontend = relativePath.includes('public/') || 
                       relativePath.includes('assets/') ||
                       relativePath.includes('client/');
    
    const config = isFrontend ? clientObfuscationConfig : serverObfuscationConfig;
    const type = isFrontend ? '🌐 Frontend' : '🔐 Backend';
    
    console.log(`🔒 Mengobfuscate [${type}]: ${relativePath}`);
    
    const code = readFileSync(filePath, 'utf8');
    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, config);
    
    const outputPath = join(outputDir, relativePath);
    const outputDirPath = dirname(outputPath);
    
    if (!existsSync(outputDirPath)) {
      mkdirSync(outputDirPath, { recursive: true });
    }
    
    writeFileSync(outputPath, obfuscationResult.getObfuscatedCode());
    console.log(`✅ Berhasil: ${relativePath}`);
  } catch (error) {
    console.error(`❌ Error mengobfuscate ${filePath}:`, error.message);
  }
}

async function main() {
  const distDir = join(__dirname, '../dist');
  
  if (!existsSync(distDir)) {
    console.error('❌ Folder dist tidak ditemukan. Jalankan "npm run build" terlebih dahulu.');
    process.exit(1);
  }

  console.log('🚀 Memulai proses obfuscation...\n');
  
  // Obfuscate semua file di dist folder
  const allFiles = getAllFiles(distDir);
  
  console.log(`📦 Ditemukan ${allFiles.length} file JavaScript\n`);
  
  allFiles.forEach(file => {
    // Otomatis deteksi dan gunakan konfigurasi yang sesuai
    obfuscateFile(file, distDir);
  });
  
  console.log('\n✨ Obfuscation selesai!');
  console.log('📁 File yang sudah diobfuscate ada di folder: dist/');
  console.log('⚠️  PERHATIAN: File asli telah ditimpa dengan versi obfuscated.');
  console.log('💡 TIP: Simpan backup kode sebelum deploy jika diperlukan.');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
