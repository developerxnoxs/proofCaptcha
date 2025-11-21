import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('[COPY] Copying required folders to dist...\n');

// Folders to copy: [source, destination]
const copyTasks = [
  {
    name: 'Static files (test pages, captcha widget)',
    src: path.join(rootDir, 'server', 'public'),
    dest: path.join(rootDir, 'dist', 'public')
  },
  {
    name: 'Uploaded files (avatars, chat media)',
    src: path.join(rootDir, 'public', 'uploads'),
    dest: path.join(rootDir, 'dist', 'public', 'uploads')
  },
  {
    name: 'Assets (captcha images)',
    src: path.join(rootDir, 'attached_assets'),
    dest: path.join(rootDir, 'dist', 'attached_assets')
  }
];

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(
        path.join(src, file),
        path.join(dest, file)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
    console.log('[COPY]   ✓', path.relative(rootDir, dest));
  }
}

let hasErrors = false;

copyTasks.forEach(task => {
  console.log(`[COPY] ${task.name}...`);
  console.log(`[COPY]   From: ${path.relative(rootDir, task.src)}`);
  console.log(`[COPY]   To:   ${path.relative(rootDir, task.dest)}`);
  
  if (!fs.existsSync(task.src)) {
    console.log(`[COPY]   ⚠️  Source not found, skipping: ${path.relative(rootDir, task.src)}`);
    return;
  }
  
  try {
    copyRecursive(task.src, task.dest);
    console.log(`[COPY]   ✓ Copied successfully\n`);
  } catch (error) {
    console.error(`[COPY]   ❌ Error: ${error.message}\n`);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error('[COPY] ❌ Some files failed to copy');
  process.exit(1);
} else {
  console.log('[COPY] ✓ All required folders copied to dist successfully');
}
