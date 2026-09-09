/**
 * @file db/supplier_payment.sql
 * @description PostgreSQL script to create supplier_payments table supporting optional
 *              link to purchase_invoices, payment_mode enum, helpful indexes and a sample seed row.
 *
 * Notes:
 * - Creates enum type supplier_payment_mode ('Cash','Bank','UPI').
 * - Creates supplier_payments table (header-only).
 * - Adds indexes for quick lookups and seed data.
 * - Intended for PostgreSQL (psql).
 */

BEGIN;

-- Create enum for payment mode if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supplier_payment_mode') THEN
    CREATE TYPE supplier_payment_mode AS ENUM ('Cash', 'Bank', 'UPI');
  END IF;
END$$;

-- Create supplier_payments table
CREATE TABLE IF NOT EXISTS supplier_payments (
  id TEXT PRIMARY KEY,
  payment_number TEXT NOT NULL UNIQUE,
  supplier_id TEXT,
  supplier_name TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_mode TEXT NOT NULL DEFAULT 'Invoice by Invoice',
  payment_mode supplier_payment_mode DEFAULT 'Cash',
  amount NUMERIC NOT NULL DEFAULT 0,
  purchase_invoice_id TEXT, -- optional link to purchase_invoices(id)
  remarks TEXT,
  attachment_names TEXT,
  attachment_files TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at DATE DEFAULT CURRENT_DATE
);

ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS invoice_mode TEXT NOT NULL DEFAULT 'Invoice by Invoice';
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS attachment_names TEXT;
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS attachment_files TEXT;

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON supplier_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice_id ON supplier_payments(purchase_invoice_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_organization_id ON supplier_payments(organization_id);

-- Sample seed data
INSERT INTO supplier_payments (id, payment_number, supplier_id, supplier_name, payment_date, payment_mode, amount, purchase_invoice_id, remarks, created_at)
VALUES
('SP-1', 'SP-2026-0001', 'SUP-1', 'Global Supplies Co.', CURRENT_DATE - INTERVAL '5 days', 'Bank', 15000.00, 'PI-1', 'Partial payment for PI-2026-0001', CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;