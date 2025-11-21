import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backupDir = path.join(rootDir, '.backup-ts');

const excludeDirs = [
  'node_modules',
  'dist',
  '.git',
  '.backup-ts',
  '.cache',
  'build',
  'coverage'
];

function shouldExclude(filePath) {
  const relativePath = path.relative(rootDir, filePath);
  return excludeDirs.some(dir => relativePath.startsWith(dir));
}

function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (shouldExclude(filePath)) {
      return;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function backupAndRemoveFiles() {
  console.log('[BACKUP] Starting TypeScript files backup...');
  
  if (fs.existsSync(backupDir)) {
    console.log('[BACKUP] Removing existing backup directory...');
    fs.rmSync(backupDir, { recursive: true, force: true });
  }

  console.log('[BACKUP] Creating backup directory...');
  fs.mkdirSync(backupDir, { recursive: true });

  const tsFiles = getAllTsFiles(rootDir);
  console.log(`[BACKUP] Found ${tsFiles.length} TypeScript files`);

  let backedUpCount = 0;
  let removedCount = 0;

  tsFiles.forEach(filePath => {
    const relativePath = path.relative(rootDir, filePath);
    const backupPath = path.join(backupDir, relativePath);
    const backupFileDir = path.dirname(backupPath);

    fs.mkdirSync(backupFileDir, { recursive: true });
    
    try {
      fs.copyFileSync(filePath, backupPath);
      backedUpCount++;
      
      fs.unlinkSync(filePath);
      removedCount++;
      
      if (backedUpCount % 50 === 0) {
        console.log(`[BACKUP] Progress: ${backedUpCount}/${tsFiles.length} files backed up`);
      }
    } catch (error) {
      console.error(`[BACKUP] Error processing ${relativePath}:`, error.message);
    }
  });

  const manifestPath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalFiles: tsFiles.length,
    backedUp: backedUpCount,
    removed: removedCount,
    files: tsFiles.map(f => path.relative(rootDir, f))
  }, null, 2));

  console.log(`[BACKUP] ✓ Complete!`);
  console.log(`[BACKUP] - Backed up: ${backedUpCount} files`);
  console.log(`[BACKUP] - Removed: ${removedCount} files`);
  console.log(`[BACKUP] - Location: ${backupDir}`);
  console.log(`[BACKUP] - Manifest saved to: ${manifestPath}`);
}

try {
  backupAndRemoveFiles();
  process.exit(0);
} catch (error) {
  console.error('[BACKUP] Fatal error:', error);
  process.exit(1);
}
