#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

console.log('🔧 ProofCaptcha Environment Setup\n');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  File .env already exists!');
  console.log('   If you want to recreate it, please delete the existing file first.');
  console.log('   Or edit it manually based on .env.example\n');
  process.exit(0);
}

// Check if .env.example exists
if (!fs.existsSync(envExamplePath)) {
  console.error('❌ Error: .env.example not found!');
  console.error('   Please make sure you have the .env.example file in the root directory.\n');
  process.exit(1);
}

// Generate secure SESSION_SECRET
const sessionSecret = crypto.randomBytes(32).toString('base64');

// Read .env.example
let envContent = fs.readFileSync(envExamplePath, 'utf8');

// Replace placeholder values
envContent = envContent.replace(
  'SESSION_SECRET=your-secret-key-change-in-production',
  `SESSION_SECRET=${sessionSecret}`
);

// Write to .env
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('✅ Created .env file successfully!\n');
console.log('📝 Next steps:\n');
console.log('   1. Edit .env file and fill in your SMTP credentials:');
console.log('      - SMTP_PASSWORD (required for email functionality)');
console.log('      - Other SMTP_* variables if needed\n');
console.log('   2. Optional: Set DATABASE_URL for PostgreSQL');
console.log('      (Leave empty to use in-memory storage)\n');
console.log('   3. Start the application:');
console.log('      npm run dev\n');
console.log('🔐 Note: A secure SESSION_SECRET has been generated for you.\n');
