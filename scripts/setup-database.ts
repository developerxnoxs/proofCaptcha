#!/usr/bin/env tsx
/**
 * ProofCaptcha Database Setup Script
 * 
 * Script ini membantu setup database PostgreSQL untuk production.
 * Gunakan script ini untuk:
 * - Validasi database connection
 * - Run migrations otomatis
 * - Setup demo data (optional)
 * - Verify database tables
 */

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";
import { generateKeyPair } from "../server/crypto-utils";
import bcrypt from "bcryptjs";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step: string) {
  console.log(`\n${colors.bright}${colors.blue}▶ ${step}${colors.reset}`);
}

function logSuccess(message: string) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message: string) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logWarning(message: string) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

async function checkDatabaseConnection(connectionString: string): Promise<boolean> {
  logStep("Checking database connection...");
  
  try {
    const pool = new Pool({ connectionString });
    const client = await pool.connect();
    
    const result = await client.query('SELECT version()');
    const version = result.rows[0].version;
    
    logSuccess(`Connected to: ${version.split(',')[0]}`);
    
    client.release();
    await pool.end();
    return true;
  } catch (error: any) {
    logError(`Connection failed: ${error.message}`);
    return false;
  }
}

async function runDatabaseMigrations(connectionString: string): Promise<boolean> {
  logStep("Running database migrations...");
  
  try {
    const pool = new Pool({ connectionString });
    const db = drizzle({ client: pool });
    
    await migrate(db, { migrationsFolder: './migrations' });
    
    logSuccess("Migrations completed successfully");
    
    await pool.end();
    return true;
  } catch (error: any) {
    logError(`Migration failed: ${error.message}`);
    return false;
  }
}

async function verifyTables(connectionString: string): Promise<void> {
  logStep("Verifying database tables...");
  
  const pool = new Pool({ connectionString });
  const db = drizzle({ client: pool, schema });
  
  try {
    const tables = ['developers', 'api_keys', 'challenges', 'verifications', 'analytics'];
    
    for (const tableName of tables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tableName]
      );
      
      if (result.rows[0].exists) {
        logSuccess(`Table '${tableName}' exists`);
      } else {
        logWarning(`Table '${tableName}' not found`);
      }
    }
    
    const countResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM developers) as developers,
        (SELECT COUNT(*) FROM api_keys) as api_keys,
        (SELECT COUNT(*) FROM challenges) as challenges,
        (SELECT COUNT(*) FROM verifications) as verifications,
        (SELECT COUNT(*) FROM analytics) as analytics
    `);
    
    const counts = countResult.rows[0];
    console.log(`\n${colors.cyan}Database Statistics:${colors.reset}`);
    console.log(`  Developers: ${counts.developers}`);
    console.log(`  API Keys: ${counts.api_keys}`);
    console.log(`  Challenges: ${counts.challenges}`);
    console.log(`  Verifications: ${counts.verifications}`);
    console.log(`  Analytics: ${counts.analytics}`);
    
  } catch (error: any) {
    logError(`Verification failed: ${error.message}`);
  } finally {
    await pool.end();
  }
}

async function setupDemoData(connectionString: string): Promise<void> {
  logStep("Setting up demo data...");
  
  const pool = new Pool({ connectionString });
  const db = drizzle({ client: pool, schema });
  
  try {
    const existingDev = await db.query.developers.findFirst({
      where: (developers, { eq }) => eq(developers.email, 'demo@proofcaptcha.com')
    });
    
    if (existingDev) {
      logWarning("Demo account already exists");
      await pool.end();
      return;
    }
    
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const [developer] = await db.insert(schema.developers).values({
      email: 'demo@proofcaptcha.com',
      password: hashedPassword,
      name: 'Demo User',
    }).returning();
    
    logSuccess(`Demo developer created: ${developer.email}`);
    
    const { siteKey, secretKey } = generateKeyPair();
    const customSiteKey = 'pk_ab6c4ac2c8976668e6d92fe401386cae18df4c9b4f5193cb140266f6d9546f1c';
    
    const [apiKey] = await db.insert(schema.apiKeys).values({
      developerId: developer.id,
      name: 'Demo API Key',
      sitekey: customSiteKey,
      secretkey: secretKey,
      domain: null,
      isActive: true,
    }).returning();
    
    logSuccess(`Demo API key created: ${apiKey.sitekey}`);
    
  } catch (error: any) {
    logError(`Demo data setup failed: ${error.message}`);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log(`
${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════
  ProofCaptcha Database Setup
  Automated database configuration for production
═══════════════════════════════════════════════════════${colors.reset}
  `);
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    logError("DATABASE_URL environment variable not found!");
    console.log(`
${colors.yellow}Setup Instructions:${colors.reset}

1. Buka Replit Database tool di sidebar
2. Klik "Create a database" 
3. Database credentials akan otomatis tersimpan sebagai environment variables
4. Restart workflow/app Anda
5. Jalankan script ini lagi

Atau, jika Anda sudah punya database di Replit:
- Pastikan environment variables sudah di-set di Secrets
- Restart workflow untuk load variables

${colors.cyan}Dokumentasi:${colors.reset} https://docs.replit.com/hosting/databases/postgresql
    `);
    process.exit(1);
  }
  
  logSuccess("DATABASE_URL found and loaded securely");
  
  const connected = await checkDatabaseConnection(DATABASE_URL);
  if (!connected) {
    logError("Failed to connect to database. Please check your DATABASE_URL");
    process.exit(1);
  }
  
  const migrated = await runDatabaseMigrations(DATABASE_URL);
  if (!migrated) {
    logError("Failed to run migrations");
    process.exit(1);
  }
  
  await verifyTables(DATABASE_URL);
  
  const args = process.argv.slice(2);
  if (args.includes('--with-demo')) {
    await setupDemoData(DATABASE_URL);
  } else {
    logWarning("Demo data skipped (use --with-demo flag to include)");
  }
  
  console.log(`
${colors.bright}${colors.green}═══════════════════════════════════════════════════════
  ✓ Database Setup Complete!
═══════════════════════════════════════════════════════${colors.reset}

${colors.cyan}Next Steps:${colors.reset}
1. Restart your application to use database storage
2. Check that storage logs show "DatabaseStorage" instead of "MemStorage"
3. Register developers and create API keys via the dashboard

${colors.cyan}Useful Commands:${colors.reset}
  npm run db:studio     - Open Drizzle Studio (database GUI)
  npm run db:push       - Push schema changes to database
  npm run setup-db      - Run this setup script again

${colors.yellow}Production Tips:${colors.reset}
- Regular backups dikelola otomatis oleh Replit Database
- Monitor usage di Replit Database dashboard
- Gunakan connection pooling untuk high traffic
- Set up alerts untuk database metrics
  `);
}

main().catch((error) => {
  logError(`Setup failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
