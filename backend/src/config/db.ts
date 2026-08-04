import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { DB_CONFIG } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const pool = new Pool({
  host: DB_CONFIG.DB_HOST,
  port: Number(DB_CONFIG.DB_PORT),
  database: DB_CONFIG.DB_NAME,
  user: DB_CONFIG.DB_USER,
  password: DB_CONFIG.DB_PASSWORD,
  connectionString: DB_CONFIG.DATABASE_URL,
});

export async function initializeDatabase(): Promise<void> {
  await pool.query('SELECT 1');

  const sqlPath = path.resolve(__dirname, '../../db/warehouse_master.sql');
  if (!fs.existsSync(sqlPath)) {
    console.warn(`Initialization SQL not found at ${sqlPath}`);
    return;
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
}
