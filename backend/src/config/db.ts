
import { Pool } from 'pg';
import { DB_CONFIG } from './env.js';



export const pool = new Pool({
  host: DB_CONFIG.DB_HOST,
  port: Number(DB_CONFIG.DB_PORT),
  database: DB_CONFIG.DB_NAME,
  user: DB_CONFIG.DB_USER,
  password: DB_CONFIG.DB_PASSWORD,
  connectionString: DB_CONFIG.DATABASE_URL,
});

export async function initializeDatabase(): Promise<void> {
  // Only verify database connection
  await pool.query("SELECT 1");
  // Keep existing installations compatible with persisted sales-order approval.
  await pool.query(
    "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Draft'"
  );
  await pool.query(
    "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS branch_id TEXT"
  );
  await pool.query(
    "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS purchase_order_invoice_status BOOLEAN NOT NULL DEFAULT FALSE"
  );
  await pool.query(
    "ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS purchase_order_id TEXT REFERENCES purchase_orders(id) ON DELETE SET NULL"
  );
  await pool.query(
    "ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Draft'"
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_branch_stock (
      id TEXT PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      item_code TEXT NOT NULL,
      branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      branch_name TEXT NOT NULL,
      stock NUMERIC NOT NULL DEFAULT 0 CHECK (stock >= 0),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (organization_id, item_id, branch_id)
    )
  `);
  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_item_branch_stock_org_item ON item_branch_stock (organization_id, item_id)"
  );
  await pool.query(
    "ALTER TABLE items ADD COLUMN IF NOT EXISTS branch_wise_stock NUMERIC NOT NULL DEFAULT 0"
  );
  console.log("Database connected successfully.");
}
