/**
 * @file supplier_master.sql
 * @description PostgreSQL script to create the suppliers master table, enums, indexes and seed sample rows.
 *
 * Notes:
 * - Creates enum types for supplier_type and supplier_status.
 * - Creates suppliers table with unique code and helpful indexes.
 * - Inserts sample rows with ON CONFLICT DO NOTHING for idempotence.
 * - Intended for PostgreSQL (psql).
 */

BEGIN;

-- Create enum for supplier type if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supplier_type') THEN
    CREATE TYPE supplier_type AS ENUM ('Local', 'National', 'International');
  END IF;
END$$;

-- Create enum for supplier status if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supplier_status') THEN
    CREATE TYPE supplier_status AS ENUM ('Active', 'Inactive');
  END IF;
END$$;

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type supplier_type DEFAULT 'Local',
  state TEXT,
  address TEXT,
  mobile TEXT,
  whatsapp TEXT,
  contact_person TEXT,
  contact_person1 TEXT,
  contact_no1 TEXT,
  contact_person2 TEXT,
  contact_no2 TEXT,
  opening_balance NUMERIC DEFAULT 0,
  status supplier_status DEFAULT 'Active',
  created_at DATE DEFAULT CURRENT_DATE
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_state ON suppliers(state);

-- Sample data
INSERT INTO suppliers (id, code, name, type, state, address, mobile, whatsapp, contact_person, opening_balance, status, created_at) VALUES
('SUP-1', 'SUP-001', 'Global Supplies Co.', 'International', 'Karnataka', '10 Export Road, Harbor City', '9000200001', '9000200001', 'Anna', 125000.00, 'Active', CURRENT_DATE - INTERVAL '45 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, code, name, type, state, address, mobile, whatsapp, contact_person, opening_balance, status, created_at) VALUES
('SUP-2', 'SUP-002', 'Local Traders Ltd.', 'Local', 'Tamil Nadu', '2 Market Street, Chennai', '9000200002', '9000200002', 'Kamal', 35000.00, 'Active', CURRENT_DATE - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, code, name, type, state, address, mobile, whatsapp, contact_person, opening_balance, status, created_at) VALUES
('SUP-3', 'SUP-003', 'National Goods Pvt Ltd', 'National', 'Kerala', '5 Trade Avenue, Kochi', '9000200003', '9000200003', 'Leena', 0.00, 'Inactive', CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;