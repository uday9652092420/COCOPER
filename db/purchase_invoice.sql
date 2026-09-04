/**
 * @file db/purchase_invoice.sql
 * @description PostgreSQL script to create purchase_invoices and purchase_invoice_items tables,
 *              enums, helpful indexes and sample seed rows.
 *
 * Notes:
 *  - Creates enum types for purchase_invoice_status ('Draft','Posted','Cancelled').
 *  - Creates purchase_invoices (header) and purchase_invoice_items (lines).
 *  - Adds indexes for quick lookups and sample seed data.
 *  - Intended for PostgreSQL (psql).
 */

BEGIN;

-- Create enum for purchase invoice status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_invoice_status') THEN
    CREATE TYPE purchase_invoice_status AS ENUM ('Draft', 'Posted', 'Cancelled');
  END IF;
END$$;

-- Create purchase_invoices header table
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL UNIQUE,
  supplier_id TEXT,
  supplier_name TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  freight_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  outstanding_amount NUMERIC NOT NULL DEFAULT 0,
  supplier_payment_receipt_status BOOLEAN NOT NULL DEFAULT TRUE,
  payment_term TEXT,
  due_date DATE,
  remarks TEXT,
  status purchase_invoice_status DEFAULT 'Draft',
  created_at DATE DEFAULT CURRENT_DATE
);

ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS supplier_payment_receipt_status BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS outstanding_amount NUMERIC NOT NULL DEFAULT 0;

-- Create purchase_invoice_items table (line items)
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id TEXT PRIMARY KEY,
  purchase_invoice_id TEXT NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  item_id TEXT,
  item_code TEXT,
  item_name TEXT,
  qty NUMERIC DEFAULT 0,
  rate NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  created_at DATE DEFAULT CURRENT_DATE
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_invoice_no ON purchase_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_date ON purchase_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice_id ON purchase_invoice_items(purchase_invoice_id);

-- Sample seed data
INSERT INTO purchase_invoices (id, invoice_no, supplier_id, supplier_name, invoice_date, total_amount, tax_amount, freight_amount, grand_total, payment_term, due_date, remarks, status, created_at)
VALUES
('PI-1', 'PI-2026-0001', 'SUP-1', 'Global Supplies Co.', CURRENT_DATE - INTERVAL '8 days', 50000.00, 4500.00, 200.00, 54700.00, '30 Days', CURRENT_DATE + INTERVAL '22 days', 'First sample invoice', 'Posted', CURRENT_DATE - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO purchase_invoice_items (id, purchase_invoice_id, item_id, item_code, item_name, qty, rate, amount, created_at)
VALUES
('PII-1', 'PI-1', 'ITM-1', 'ITM-001', 'Basmati Rice 5kg', 20, 1000, 20000, CURRENT_DATE - INTERVAL '8 days'),
('PII-2', 'PI-1', 'ITM-2', 'ITM-002', 'Broken Rice 10kg', 30, 1000, 30000, CURRENT_DATE - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;