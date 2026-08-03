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

-- Create customer_receipts table
CREATE TABLE IF NOT EXISTS customer_receipts (
  id TEXT PRIMARY KEY,
  receipt_no TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  customer_name TEXT,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_mode TEXT DEFAULT 'Cash',
  reference_no TEXT,
  remarks TEXT,
  created_at DATE DEFAULT CURRENT_DATE
);

-- Indexes to speed lookups
CREATE INDEX IF NOT EXISTS idx_customer_receipts_receipt_no ON customer_receipts(receipt_no);
CREATE INDEX IF NOT EXISTS idx_customer_receipts_customer_id ON customer_receipts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_receipts_date ON customer_receipts(receipt_date);

-- Sample data
INSERT INTO customer_receipts (id, receipt_no, customer_id, customer_name, receipt_date, amount, payment_mode, reference_no, remarks, created_at)
VALUES
('CR-1', 'CR-2026-0001', 'CUST-1', 'Apex Traders', CURRENT_DATE - INTERVAL '12 days', 15000.00, 'Cash', NULL, 'Partial payment for INV-1001', CURRENT_DATE - INTERVAL '12 days'),
('CR-2', 'CR-2026-0002', 'CUST-2', 'Local Fresh', CURRENT_DATE - INTERVAL '3 days', 5000.00, 'Online', 'TXN-8899', 'Cleared via bank transfer', CURRENT_DATE - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;