import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export async function initDb() {
  // Ensure tables are created – you can run migrations here or rely on Drizzle sync
  // For simplicity, we assume migrations will be run manually.
  console.log('Database initialized');
}
