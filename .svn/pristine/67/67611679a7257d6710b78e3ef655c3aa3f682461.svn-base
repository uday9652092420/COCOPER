/**
 * @file bag_purchase.sql
 * @description PostgreSQL script to create tables for bag purchases master and lines.
 *
 * Creates:
 *  - bag_purchases: header records for each bag purchase
 *  - bag_purchase_lines: individual bag lines per purchase
 *
 * Includes helpful indexes and sample seed data.
 */

BEGIN;

-- Create bag_purchases table
CREATE TABLE IF NOT EXISTS bag_purchases (
  id TEXT PRIMARY KEY,
  purchase_no TEXT NOT NULL UNIQUE,
  supplier_id TEXT,
  supplier_name TEXT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC DEFAULT 0,
  remarks TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at DATE DEFAULT CURRENT_DATE
);

-- Create bag_purchase_lines table
CREATE TABLE IF NOT EXISTS bag_purchase_lines (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL REFERENCES bag_purchases(id) ON DELETE CASCADE,
  bag_type_id TEXT,
  bag_code TEXT,
  bharthi NUMERIC,
  quantity NUMERIC DEFAULT 0,
  rate NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0
);

-- Indexes to speed lookups
CREATE INDEX IF NOT EXISTS idx_bag_purchases_purchase_no ON bag_purchases(purchase_no);
CREATE INDEX IF NOT EXISTS idx_bag_purchases_supplier ON bag_purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_bag_purchases_organization ON bag_purchases(organization_id);
CREATE INDEX IF NOT EXISTS idx_bag_purchases_branch ON bag_purchases(branch_id);
CREATE INDEX IF NOT EXISTS idx_bag_purchase_lines_purchase_id ON bag_purchase_lines(purchase_id);

-- Sample data
INSERT INTO bag_purchases (id, purchase_no, supplier_id, supplier_name, purchase_date, total_amount, remarks, created_at)
VALUES
('BP1', 'BP-2026-0001', 'SUP1', 'ABC Bag Suppliers', CURRENT_DATE - INTERVAL '10 days', 45000, 'First sample purchase', CURRENT_DATE - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bag_purchase_lines (id, purchase_id, bag_type_id, bag_code, bharthi, quantity, rate, amount)
VALUES
('BPL1', 'BP1', 'BG1', 'BG-50', 50, 100, 150, 15000),
('BPL2', 'BP1', 'BG2', 'BG-25', 25, 200, 150, 30000)
ON CONFLICT (id) DO NOTHING;

COMMIT;