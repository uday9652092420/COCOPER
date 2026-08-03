/**
 * @file warehouse_master.sql
 * @description PostgreSQL script to create the warehouses master table for WarehouseMasterPage.
 *
 * Notes:
 * - Creates an enum type for status ('Active','Inactive').
 * - Creates warehouses table with a primary key id (text), unique code and sample rows.
 * - Intended for PostgreSQL (psql).
 */

BEGIN;

-- Create an enum type for warehouse status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'warehouse_status') THEN
    CREATE TYPE warehouse_status AS ENUM ('Active', 'Inactive');
  END IF;
END$$;

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  manager TEXT,
  contact_number TEXT,
  status warehouse_status DEFAULT 'Active',
  created_at DATE DEFAULT CURRENT_DATE
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(code);
CREATE INDEX IF NOT EXISTS idx_warehouses_manager ON warehouses(manager);

-- Sample data
INSERT INTO warehouses (id, code, name, address, manager, contact_number, status, created_at) VALUES
('WH1', 'WH-1', 'Central Warehouse', 'No. 1, Main Road, Coconut City', 'Manager A', '9000012345', 'Active', CURRENT_DATE - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO warehouses (id, code, name, address, manager, contact_number, status, created_at) VALUES
('WH2', 'WH-2', 'North Warehouse', 'No. 2, North Road, Coconut City', 'Manager B', '9000012346', 'Active', CURRENT_DATE - INTERVAL '90 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO warehouses (id, code, name, address, manager, contact_number, status, created_at) VALUES
('WH3', 'WH-3', 'South Warehouse', 'No. 3, South Lane, Coconut City', 'Manager C', '9000012347', 'Inactive', CURRENT_DATE - INTERVAL '150 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;