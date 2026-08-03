/**
 * @file purchase_order.sql
 * @description PostgreSQL script to create purchase_orders and purchase_order_items tables,
 *              enums, helpful indexes and seed sample rows.
 *
 * Notes:
 *  - Creates enum type purchase_order_status ('Draft','Confirmed','Cancelled').
 *  - Creates purchase_orders (header) and purchase_order_items (lines).
 *  - Adds indexes for quick lookups and sample seed data.
 *  - Intended for PostgreSQL (psql).
 */

BEGIN;

-- Create enum for purchase order status if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_order_status') THEN
    CREATE TYPE purchase_order_status AS ENUM ('Draft', 'Confirmed', 'Cancelled');
  END IF;
END$$;

-- Create purchase_orders header table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  supplier_id TEXT,
  supplier_name TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  freight_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  payment_term TEXT,
  due_date DATE,
  remarks TEXT,
  status purchase_order_status DEFAULT 'Draft',
  created_at DATE DEFAULT CURRENT_DATE
);

-- Create purchase_order_items table (line items)
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id TEXT,
  item_code TEXT,
  item_name TEXT,
  qty NUMERIC DEFAULT 0,
  rate NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  created_at DATE DEFAULT CURRENT_DATE
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_no ON purchase_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON purchase_order_items(purchase_order_id);

-- Sample seed data
INSERT INTO purchase_orders (id, order_no, supplier_id, supplier_name, order_date, total_amount, tax_amount, freight_amount, grand_total, payment_term, due_date, remarks, status, created_at)
VALUES
('PO-1', 'PO-2026-0001', 'SUP-1', 'Global Supplies Co.', CURRENT_DATE - INTERVAL '10 days', 40000.00, 3600.00, 150.00, 43750.00, '30 Days', CURRENT_DATE + INTERVAL '20 days', 'Sample purchase order', 'Confirmed', CURRENT_DATE - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO purchase_order_items (id, purchase_order_id, item_id, item_code, item_name, qty, rate, amount, created_at)
VALUES
('POI-1', 'PO-1', 'ITM-1', 'ITM-001', 'Basmati Rice 5kg', 10, 1000, 10000, CURRENT_DATE - INTERVAL '10 days'),
('POI-2', 'PO-1', 'ITM-2', 'ITM-002', 'Broken Rice 10kg', 30, 1000, 30000, CURRENT_DATE - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;