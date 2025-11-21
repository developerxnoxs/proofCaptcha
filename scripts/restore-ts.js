import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backupDir = path.join(rootDir, '.backup-ts');

function restoreFiles() {
  console.log('[RESTORE] Starting TypeScript files restoration...');

  if (!fs.existsSync(backupDir)) {
    console.error('[RESTORE] Error: Backup directory not found!');
    console.error(`[RESTORE] Expected location: ${backupDir}`);
    process.exit(1);
  }

  const manifestPath = path.join(backupDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('[RESTORE] Error: Backup manifest not found!');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`[RESTORE] Backup created: ${manifest.timestamp}`);
  console.log(`[RESTORE] Files to restore: ${manifest.totalFiles}`);

  let restoredCount = 0;
  let errorCount = 0;

  manifest.files.forEach((relativePath, index) => {
    const backupFilePath = path.join(backupDir, relativePath);
    const targetFilePath = path.join(rootDir, relativePath);
    const targetDir = path.dirname(targetFilePath);

    if (!fs.existsSync(backupFilePath)) {
      console.warn(`[RESTORE] Warning: Backup file not found: ${relativePath}`);
      errorCount++;
      return;
    }

    try {
      fs.mkdirSync(targetDir, { recursive: true });
      
      fs.copyFileSync(backupFilePath, targetFilePath);
      restoredCount++;

      if ((index + 1) % 50 === 0) {
        console.log(`[RESTORE] Progress: ${index + 1}/${manifest.totalFiles} files restored`);
      }
    } catch (error) {
      console.error(`[RESTORE] Error restoring ${relativePath}:`, error.message);
      errorCount++;
    }
  });

  console.log(`[RESTORE] ✓ Complete!`);
  console.log(`[RESTORE] - Restored: ${restoredCount} files`);
  console.log(`[RESTORE] - Errors: ${errorCount} files`);

  const keepBackup = process.argv.includes('--keep-backup');
  
  if (!keepBackup) {
    console.log('[RESTORE] Removing backup directory...');
    try {
      fs.rmSync(backupDir, { recursive: true, force: true });
      console.log('[RESTORE] ✓ Backup directory removed');
    } catch (error) {
      console.error('[RESTORE] Warning: Could not remove backup directory:', error.message);
    }
  } else {
    console.log('[RESTORE] Backup directory kept (--keep-backup flag used)');
  }
}

try {
  restoreFiles();
  process.exit(0);
} catch (error) {
  console.error('[RESTORE] Fatal error:', error);
  process.exit(1);
}
