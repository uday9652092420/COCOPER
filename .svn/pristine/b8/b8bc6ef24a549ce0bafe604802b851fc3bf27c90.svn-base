/**
 * @file customer_receipt.sql
 * @description PostgreSQL script to create the customer_receipts table and seed sample receipts.
 *
 * Creates:
 *  - customer_receipts: header records for customer payment receipts
 *
 * Includes helpful indexes and sample seed data.
 */

BEGIN;

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
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS receipt_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS invoice_mode TEXT NOT NULL DEFAULT 'Invoice by Invoice';
ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS invoice_no TEXT;
ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'Cash';
ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE customer_receipts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_customer_receipts_receipt_no ON customer_receipts(receipt_no);
CREATE INDEX IF NOT EXISTS idx_customer_receipts_customer_id ON customer_receipts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_receipts_date ON customer_receipts(receipt_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_receipts_org_receipt_no ON customer_receipts (organization_id, receipt_no) WHERE organization_id IS NOT NULL;

COMMIT;