-- ============================================================
-- COCOPER ERP - canonical transaction schema for fresh installs
--
-- Creates the tables used by the current backend for Purchase Orders,
-- Purchase Invoices and Sales Orders. This file intentionally does not
-- drop existing tables. Run it only after the organization and master
-- tables are available.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id TEXT,
  branch_id TEXT,
  warehouse_id TEXT,
  po_date TEXT,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  purchase_order_invoice_status BOOLEAN NOT NULL DEFAULT FALSE,
  mode TEXT DEFAULT 'tonage',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (po_number, organization_id)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id TEXT,
  quantity NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  actual_quantity NUMERIC DEFAULT 0,
  purchase_cost NUMERIC DEFAULT 0,
  purchase_amount NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade legacy transaction tables in place when this runner is used against
-- an existing local/R&D database. CREATE TABLE IF NOT EXISTS alone cannot add
-- columns to an already-existing legacy table.
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_number TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS warehouse_id TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_date TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS purchase_order_invoice_status BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'tonage';
ALTER TABLE purchase_orders ALTER COLUMN status TYPE TEXT USING status::text;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'order_no'
  ) THEN
    UPDATE purchase_orders SET po_number = order_no WHERE po_number IS NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'order_date'
  ) THEN
    UPDATE purchase_orders SET po_date = order_date::text WHERE po_date IS NULL;
  END IF;
END $$;

ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS actual_quantity NUMERIC DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS purchase_cost NUMERIC DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS purchase_amount NUMERIC DEFAULT 0;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_order_items' AND column_name = 'qty'
  ) THEN
    UPDATE purchase_order_items SET quantity = qty WHERE quantity IS NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_order_items' AND column_name = 'rate'
  ) THEN
    UPDATE purchase_order_items SET purchase_cost = rate WHERE purchase_cost IS NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_order_items' AND column_name = 'amount'
  ) THEN
    UPDATE purchase_order_items SET purchase_amount = amount WHERE purchase_amount IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_org ON purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_items_order ON purchase_order_items(purchase_order_id);

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id TEXT,
  branch_id TEXT,
  purchase_order_id TEXT REFERENCES purchase_orders(id) ON DELETE SET NULL,
  invoice_date TEXT,
  mode TEXT DEFAULT 'tonage',
  loading_cost NUMERIC DEFAULT 0,
  market_cess NUMERIC DEFAULT 0,
  bags_and_sticks NUMERIC DEFAULT 0,
  freight NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (invoice_no, organization_id)
);

CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id TEXT PRIMARY KEY,
  purchase_invoice_id TEXT NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  item_id TEXT,
  quantity_tons NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  actual_quantity NUMERIC DEFAULT 0,
  purchase_cost NUMERIC DEFAULT 0,
  purchase_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS purchase_order_id TEXT REFERENCES purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS invoice_date TEXT;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'tonage';
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS loading_cost NUMERIC DEFAULT 0;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS market_cess NUMERIC DEFAULT 0;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS bags_and_sticks NUMERIC DEFAULT 0;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS freight NUMERIC DEFAULT 0;
ALTER TABLE purchase_invoices ALTER COLUMN status TYPE TEXT USING status::text;

ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS quantity_tons NUMERIC DEFAULT 0;
ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS actual_quantity NUMERIC DEFAULT 0;
ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS purchase_cost NUMERIC DEFAULT 0;
ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS purchase_amount NUMERIC DEFAULT 0;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_invoice_items' AND column_name = 'qty'
  ) THEN
    UPDATE purchase_invoice_items SET quantity_tons = qty WHERE quantity_tons IS NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_invoice_items' AND column_name = 'rate'
  ) THEN
    UPDATE purchase_invoice_items SET purchase_cost = rate WHERE purchase_cost IS NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_invoice_items' AND column_name = 'amount'
  ) THEN
    UPDATE purchase_invoice_items SET purchase_amount = amount WHERE purchase_amount IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_org ON purchase_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_number ON purchase_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_pi_items_invoice ON purchase_invoice_items(purchase_invoice_id);

CREATE TABLE IF NOT EXISTS sales_orders (
  id TEXT PRIMARY KEY,
  so_number TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id TEXT,
  so_date TEXT,
  remarks TEXT,
  source_po_id TEXT,
  po_number TEXT,
  mode TEXT DEFAULT 'tonage',
  status TEXT NOT NULL DEFAULT 'Draft',
  sales_invoice_status BOOLEAN NOT NULL DEFAULT FALSE,
  total_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (so_number, organization_id)
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id TEXT PRIMARY KEY,
  sales_order_id TEXT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  item_id TEXT,
  quantity NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  actual_quantity NUMERIC DEFAULT 0,
  sale_cost NUMERIC DEFAULT 0,
  sale_amount NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS direct_sale_gunny_bags (
  id TEXT PRIMARY KEY,
  direct_sale_id TEXT NOT NULL REFERENCES direct_sales(id) ON DELETE CASCADE,
  gunny_bag_id TEXT NOT NULL REFERENCES gunny_bags(id),
  bharthi_type_id TEXT REFERENCES gunny_bag_bharthi_types(id),
  quantity NUMERIC NOT NULL DEFAULT 0,
  rate NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_org ON sales_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_number ON sales_orders(so_number);
CREATE INDEX IF NOT EXISTS idx_so_items_order ON sales_order_items(sales_order_id);

COMMIT;
