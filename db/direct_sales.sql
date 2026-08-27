/**
 * @file db/direct_sales.sql
 * @description PostgreSQL script to create direct_sales and direct_sale_items tables,
 *              supporting enums, helpful indexes and seeding sample rows.
 *
 * Notes:
 * - Creates enum type direct_sale_status ('Draft','Posted','Cancelled').
 * - Creates direct_sales (header) and direct_sale_items (lines) tables.
 * - Adds indexes for quick lookups and sample seed data.
 * - Intended for PostgreSQL (psql).
 */

BEGIN;

-- Create enum for direct sale status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'direct_sale_status') THEN
    CREATE TYPE direct_sale_status AS ENUM ('Draft', 'Posted', 'Cancelled');
  END IF;
END$$;

-- Create direct_sales header table
CREATE TABLE IF NOT EXISTS direct_sales (
  id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL UNIQUE,
  organization_id UUID,
  branch_id UUID,
  customer_id TEXT,
  customer_name TEXT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC DEFAULT 0,
  payment_mode TEXT DEFAULT 'Cash',
  reference_no TEXT,
  remarks TEXT,
  status direct_sale_status DEFAULT 'Draft',
  mode TEXT NOT NULL DEFAULT 'tonage',
  created_at DATE DEFAULT CURRENT_DATE
);

-- Create direct_sale_items table (line items)
CREATE TABLE IF NOT EXISTS direct_sale_items (
  id TEXT PRIMARY KEY,
  direct_sale_id TEXT NOT NULL REFERENCES direct_sales(id) ON DELETE CASCADE,
  item_id TEXT,
  item_code TEXT,
  item_name TEXT,
  qty NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  actual_quantity NUMERIC DEFAULT 0,
  rate NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  created_at DATE DEFAULT CURRENT_DATE
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_direct_sales_invoice_no ON direct_sales(invoice_no);
CREATE INDEX IF NOT EXISTS idx_direct_sales_customer_id ON direct_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_direct_sales_date ON direct_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_direct_sale_items_direct_sale_id ON direct_sale_items(direct_sale_id);

CREATE TABLE IF NOT EXISTS direct_sale_gunny_bags (
  id TEXT PRIMARY KEY,
  direct_sale_id TEXT NOT NULL REFERENCES direct_sales(id) ON DELETE CASCADE,
  gunny_bag_id TEXT NOT NULL REFERENCES gunny_bags(id),
  bharthi_type_id TEXT REFERENCES gunny_bag_bharthi_types(id),
  quantity NUMERIC NOT NULL DEFAULT 0,
  rate NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0
);

-- Sample seed data: one sale with two items
INSERT INTO direct_sales (id, invoice_no, customer_id, customer_name, sale_date, total_amount, payment_mode, reference_no, remarks, status, created_at)
VALUES
('DS-1', 'DS-2026-0001', 'CUST-1', 'Apex Traders', CURRENT_DATE - INTERVAL '5 days', 25000.00, 'Cash', NULL, 'Sample direct sale', 'Posted', CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO direct_sale_items (id, direct_sale_id, item_id, item_code, item_name, qty, rate, amount, created_at)
VALUES
('DSI-1', 'DS-1', 'ITM-1', 'ITM-001', 'Basmati Rice 5kg', 10, 1000, 10000, CURRENT_DATE - INTERVAL '5 days'),
('DSI-2', 'DS-1', 'ITM-2', 'ITM-002', 'Broken Rice 10kg', 15, 1000, 15000, CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;