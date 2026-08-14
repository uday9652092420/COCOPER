/**
 * @file item_master.sql
 * @description PostgreSQL script to create the items master table for ItemMasterPage.
 *
 * Notes:
 * - Creates an enum type for status ('Active','Inactive').
 * - Creates items table with a primary key id (text), unique code and sample rows.
 * - Intended for PostgreSQL (psql).
 */

BEGIN;

-- Create an enum type for item status if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status') THEN
    CREATE TYPE item_status AS ENUM ('Active', 'Inactive');
  END IF;
END$$;

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  uom TEXT,
  status item_status DEFAULT 'Active',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at DATE DEFAULT CURRENT_DATE
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_items_code ON items(code);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_organization ON items(organization_id);
CREATE INDEX IF NOT EXISTS idx_items_branch ON items(branch_id);

-- Sample data
INSERT INTO items (id, code, name, category, uom, status, created_at) VALUES
('IT1', 'IT-1', 'Coconut Premium', 'Fresh', 'Kg', 'Active', CURRENT_DATE - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO items (id, code, name, category, uom, status, created_at) VALUES
('IT2', 'IT-2', 'Medium Coconut', 'Fresh', 'Kg', 'Active', CURRENT_DATE - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO items (id, code, name, category, uom, status, created_at) VALUES
('IT3', 'IT-3', 'Dry Coconut', 'Dry', 'Kg', 'Active', CURRENT_DATE - INTERVAL '120 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;