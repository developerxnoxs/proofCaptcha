import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('[BUILD] Starting safe production build...');
console.log('[BUILD] Step 1: Building project...\n');

try {
  execSync('vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
    cwd: rootDir,
    stdio: 'inherit',
  });
  
  console.log('\n[BUILD] ✓ Build completed successfully!');
  console.log('[BUILD] Step 2: Verifying build output...\n');
  
  const distPublic = path.join(rootDir, 'dist', 'public');
  const distIndex = path.join(rootDir, 'dist', 'index.js');
  
  if (!fs.existsSync(distPublic)) {
    throw new Error('Frontend build (dist/public) not found!');
  }
  
  if (!fs.existsSync(distIndex)) {
    throw new Error('Backend build (dist/index.js) not found!');
  }
  
  const publicFiles = fs.readdirSync(distPublic);
  if (publicFiles.length === 0) {
    throw new Error('Frontend build is empty!');
  }
  
  console.log('[BUILD] ✓ Build verification passed!');
  console.log(`[BUILD]   - Frontend: ${distPublic} (${publicFiles.length} files)`);
  console.log(`[BUILD]   - Backend: ${distIndex}`);
  console.log('\n[BUILD] Step 3: Backing up and removing TypeScript files...\n');
  
  execSync('node scripts/backup-ts.js', {
    cwd: rootDir,
    stdio: 'inherit',
  });
  
  console.log('\n[BUILD] ✓ Production build complete!');
  console.log('[BUILD] Project is ready for production deployment.');
  console.log('[BUILD] To restore development mode: npm run restore:dev');
  
  process.exit(0);
} catch (error) {
  console.error('\n[BUILD] ✗ Build failed!');
  console.error('[BUILD] Error:', error.message);
  console.error('\n[BUILD] TypeScript files were NOT modified (safe).');
  console.error('[BUILD] Fix the build errors and try again.');
  process.exit(1);
}
