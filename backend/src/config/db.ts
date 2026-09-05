
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'Local',
      state TEXT,
      address TEXT,
      mobile TEXT,
      whatsapp TEXT,
      contact_person TEXT,
      contact_person1 TEXT,
      contact_no1 TEXT,
      contact_person2 TEXT,
      contact_no2 TEXT,
      contact_person3 TEXT,
      contact_no3 TEXT,
      credit_limit NUMERIC NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Active',
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      created_at DATE DEFAULT CURRENT_DATE
    )
  `);

  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person1 TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_no1 TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person2 TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_no2 TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person3 TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_no3 TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC NOT NULL DEFAULT 0");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active'");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at DATE DEFAULT CURRENT_DATE");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS mobile TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS code TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS name TEXT");
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS type TEXT");

  // Keep existing installations compatible with organization registration fields.
  await pool.query(
    "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS street VARCHAR(255)"
  );
  await pool.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS uq_organizations_email ON organizations (LOWER(email))"
  );
  await pool.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_organization_code ON customers (organization_id, code) WHERE organization_id IS NOT NULL"
  );
  await pool.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS uq_suppliers_organization_code ON suppliers (organization_id, code) WHERE organization_id IS NOT NULL"
  );
  // Keep existing installations compatible with protected owner roles.
  await pool.query(
    "ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN NOT NULL DEFAULT FALSE"
  );
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_owner_role_per_organization
    ON roles (organization_id)
    WHERE is_system_role = TRUE AND role_name = 'OWNER'
  `);
  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_organization_users_email ON organization_users (LOWER(email))"
  );
  await pool.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS uq_organization_users_email ON organization_users (LOWER(email)) WHERE email IS NOT NULL"
  );
  await pool.query(`
    UPDATE organization_users ou
    SET email = o.email
    FROM organizations o
    WHERE ou.organization_id = o.id
      AND ou.is_primary_user = TRUE
      AND ou.email IS NULL
  `);
  // Keep existing installations compatible with persisted sales-order approval.
  await pool.query(
    "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Draft'"
  );
  await pool.query(
    "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS sales_invoice_status BOOLEAN NOT NULL DEFAULT FALSE"
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gunny_bag_branch_stock (
      id TEXT PRIMARY KEY,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      gunny_bag_id TEXT NOT NULL REFERENCES gunny_bags(id) ON DELETE CASCADE,
      branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      stock NUMERIC NOT NULL DEFAULT 0 CHECK (stock >= 0),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (gunny_bag_id, branch_id)
    )
  `);
  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_gunny_bag_branch_stock_bag ON gunny_bag_branch_stock (gunny_bag_id)"
  );
  await pool.query(
    "ALTER TABLE items ADD COLUMN IF NOT EXISTS branch_wise_stock NUMERIC NOT NULL DEFAULT 0"
  );
  await pool.query("ALTER TABLE direct_sales ADD COLUMN IF NOT EXISTS organization_id UUID");
  await pool.query("ALTER TABLE direct_sales ADD COLUMN IF NOT EXISTS branch_id UUID");
  await pool.query("ALTER TABLE direct_sales ADD COLUMN IF NOT EXISTS sales_order_no TEXT");
  await pool.query("ALTER TABLE direct_sales ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE");
  await pool.query("ALTER TABLE direct_sales ADD COLUMN IF NOT EXISTS outstanding_amount NUMERIC NOT NULL DEFAULT 0");
  await pool.query("ALTER TABLE direct_sales ADD COLUMN IF NOT EXISTS customer_receipt_status BOOLEAN NOT NULL DEFAULT FALSE");
  await pool.query("ALTER TABLE direct_sales ADD COLUMN IF NOT EXISTS gunny_bags_total NUMERIC NOT NULL DEFAULT 0");
  await pool.query("ALTER TABLE direct_sales ADD COLUMN IF NOT EXISTS transportation_charges NUMERIC NOT NULL DEFAULT 0");
  await pool.query("ALTER TABLE direct_sales ADD COLUMN IF NOT EXISTS loading_charges NUMERIC NOT NULL DEFAULT 0");
  await pool.query("ALTER TABLE direct_sales ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'tonage'");
  await pool.query("ALTER TABLE direct_sales ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamp");
  await pool.query("ALTER TABLE direct_sales ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP");
  await pool.query("ALTER TABLE direct_sale_items ADD COLUMN IF NOT EXISTS discount NUMERIC NOT NULL DEFAULT 0");
  await pool.query("ALTER TABLE direct_sale_items ADD COLUMN IF NOT EXISTS actual_quantity NUMERIC NOT NULL DEFAULT 0");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS direct_sale_gunny_bags (
      id TEXT PRIMARY KEY,
      direct_sale_id TEXT NOT NULL REFERENCES direct_sales(id) ON DELETE CASCADE,
      gunny_bag_id TEXT NOT NULL REFERENCES gunny_bags(id),
      bag_bharthi TEXT,
      bharthi_type_id TEXT REFERENCES gunny_bag_bharthi_types(id),
      quantity NUMERIC NOT NULL DEFAULT 0,
      rate NUMERIC NOT NULL DEFAULT 0,
      amount NUMERIC NOT NULL DEFAULT 0
    )
  `);
  await pool.query("ALTER TABLE direct_sale_gunny_bags ADD COLUMN IF NOT EXISTS bag_bharthi TEXT");
    await pool.query("ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS outstanding_amount NUMERIC NOT NULL DEFAULT 0");
    await pool.query("ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS supplier_payment_receipt_status BOOLEAN NOT NULL DEFAULT TRUE");
    await pool.query("UPDATE purchase_invoices SET outstanding_amount = grand_total WHERE outstanding_amount = 0 AND grand_total > 0");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_receipts (
      id TEXT PRIMARY KEY,
      receipt_no TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT,
      receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
      invoice_mode TEXT NOT NULL DEFAULT 'Invoice by Invoice',
      invoice_no TEXT,
      amount NUMERIC NOT NULL DEFAULT 0,
      payment_mode TEXT NOT NULL DEFAULT 'Cash',
      remarks TEXT,
      approved BOOLEAN NOT NULL DEFAULT FALSE,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query("ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS customer_name TEXT");
  await pool.query("ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS receipt_date DATE DEFAULT CURRENT_DATE");
  await pool.query("ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS invoice_mode TEXT NOT NULL DEFAULT 'Invoice by Invoice'");
  await pool.query("ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS invoice_no TEXT");
  await pool.query("ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS amount NUMERIC NOT NULL DEFAULT 0");
  await pool.query("ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'Cash'");
  await pool.query("ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS remarks TEXT");
  await pool.query("ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE");
  await pool.query("ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS attachment_names TEXT");
  await pool.query("ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS attachment_files TEXT");
  await pool.query("ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE");
  await pool.query("ALTER TABLE customer_receipts ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamp");
  await pool.query("ALTER TABLE customer_receipts ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP");
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_receipts_org_receipt_no ON customer_receipts (organization_id, receipt_no) WHERE organization_id IS NOT NULL");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_customer_receipts_customer_id ON customer_receipts(customer_id)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_customer_receipts_date ON customer_receipts(receipt_date)");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS supplier_payments (
      id TEXT PRIMARY KEY,
      payment_number TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      supplier_name TEXT,
      payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      invoice_mode TEXT NOT NULL DEFAULT 'Invoice by Invoice',
      payment_mode TEXT NOT NULL DEFAULT 'Cash',
      amount NUMERIC NOT NULL DEFAULT 0,
      purchase_invoice_id TEXT,
      remarks TEXT,
      approved BOOLEAN NOT NULL DEFAULT FALSE,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
    await pool.query("ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS attachment_names TEXT");
    await pool.query("ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS attachment_files TEXT");
  await pool.query("ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS invoice_mode TEXT NOT NULL DEFAULT 'Invoice by Invoice'");
  await pool.query("ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE");
  await pool.query("ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE");
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_payments_org_number ON supplier_payments (organization_id, payment_number) WHERE organization_id IS NOT NULL");
  console.log("Database connected successfully.");
}
