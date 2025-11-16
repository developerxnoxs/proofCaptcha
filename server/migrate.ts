import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

export async function runMigrations(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log('[MIGRATE] No DATABASE_URL found, skipping migrations');
    return;
  }

  console.log('[MIGRATE] Running database migrations...');
  console.log('[MIGRATE] DATABASE_URL configured, connecting to database...');
  
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('[MIGRATE] Database migrations completed successfully');
  } catch (error: any) {
    console.error('[MIGRATE] Migration failed:', error?.message || error);
    throw error;
  } finally {
    await pool.end();
  }
}
