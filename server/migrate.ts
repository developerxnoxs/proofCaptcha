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
  
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('[MIGRATE] Database migrations completed successfully');
  } finally {
    await pool.end();
  }
}
