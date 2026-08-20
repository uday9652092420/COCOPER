-- ============================================================
-- 06_purchase_invoice_sales_tables.sql
-- Migration: transaction storage tables for Purchase Orders,
-- Purchase Invoices and Sales Orders (organization-scoped).
--
-- The previous db/purchase_order.sql was a legacy sample schema;
-- these tables are redefined to match the ERP data model
-- (header + lines, organization_id scoping).
--
-- NOTE: drops any legacy purchase_orders / purchase_order_items
-- tables first so the schema is consistent.
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS purchase_invoice_items CASCADE;
DROP TABLE IF EXISTS purchase_invoices CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id TEXT,
  branch_id TEXT,
  warehouse_id TEXT,
  po_date TEXT,
  remarks TEXT,
  status TEXT DEFAULT 'Draft',
  purchase_order_invoice_status BOOLEAN NOT NULL DEFAULT FALSE,
  mode TEXT DEFAULT 'tonage',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (po_number, organization_id)
);

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS purchase_order_invoice_status BOOLEAN NOT NULL DEFAULT FALSE;

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

CREATE INDEX IF NOT EXISTS idx_purchase_orders_org ON purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_po_items_order ON purchase_order_items(purchase_order_id);

-- ============================================================
-- PURCHASE INVOICES
-- ============================================================
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (invoice_no, organization_id)
);

ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS purchase_order_id TEXT REFERENCES purchase_orders(id) ON DELETE SET NULL;

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

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_org ON purchase_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_pi_items_invoice ON purchase_invoice_items(purchase_invoice_id);

-- ============================================================
-- SALES ORDERS
-- ============================================================
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
  total_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (so_number, organization_id)
);

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Draft';

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

CREATE INDEX IF NOT EXISTS idx_sales_orders_org ON sales_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_so_items_order ON sales_order_items(sales_order_id);

COMMIT;
