/**
 * @file loading_dispatch.sql
 * @description PostgreSQL script to create loading_dispatch and loading_dispatch_items
 *              tables with enums, helpful indexes and sample seed rows.
 *
 * Notes:
 * - Creates enum type for dispatch_status.
 * - Creates header and items tables, indexes and sample data.
 * - Intended for PostgreSQL (psql).
 */

BEGIN;

-- Create enum for dispatch status if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispatch_status') THEN
    CREATE TYPE dispatch_status AS ENUM ('Pending', 'Dispatched', 'Delivered', 'Cancelled');
  END IF;
END$$;

-- Create loading_dispatch header table
CREATE TABLE IF NOT EXISTS loading_dispatch (
  id TEXT PRIMARY KEY,
  dispatch_no TEXT NOT NULL UNIQUE,
  warehouse_id TEXT,
  warehouse_name TEXT,
  vehicle_no TEXT,
  driver_name TEXT,
  dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_quantity NUMERIC DEFAULT 0,
  total_weight NUMERIC DEFAULT 0,
  status dispatch_status DEFAULT 'Pending',
  remarks TEXT,
  created_at DATE DEFAULT CURRENT_DATE
);

-- Create loading_dispatch_items table (line items)
CREATE TABLE IF NOT EXISTS loading_dispatch_items (
  id TEXT PRIMARY KEY,
  loading_dispatch_id TEXT NOT NULL REFERENCES loading_dispatch(id) ON DELETE CASCADE,
  item_id TEXT,
  item_code TEXT,
  item_name TEXT,
  qty NUMERIC DEFAULT 0,
  weight NUMERIC DEFAULT 0,
  notes TEXT,
  created_at DATE DEFAULT CURRENT_DATE
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_loading_dispatch_no ON loading_dispatch(dispatch_no);
CREATE INDEX IF NOT EXISTS idx_loading_dispatch_date ON loading_dispatch(dispatch_date);
CREATE INDEX IF NOT EXISTS idx_loading_dispatch_status ON loading_dispatch(status);
CREATE INDEX IF NOT EXISTS idx_loading_dispatch_items_dispatch_id ON loading_dispatch_items(loading_dispatch_id);

-- Sample seed data
INSERT INTO loading_dispatch (id, dispatch_no, warehouse_id, warehouse_name, vehicle_no, driver_name, dispatch_date, total_quantity, total_weight, status, remarks, created_at)
VALUES
('LD-1', 'LD-2026-0001', 'WH-1', 'Central Warehouse', 'TN-01-AB-1234', 'Ramesh', CURRENT_DATE - INTERVAL '2 days', 100, 1250.50, 'Dispatched', 'Left at 08:30', CURRENT_DATE - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO loading_dispatch_items (id, loading_dispatch_id, item_id, item_code, item_name, qty, weight, notes, created_at)
VALUES
('LDI-1', 'LD-1', 'ITM-001', 'ITM-001', 'Basmati Rice 5kg', 50, 625.25, '', CURRENT_DATE - INTERVAL '2 days'),
('LDI-2', 'LD-1', 'ITM-002', 'ITM-002', 'Broken Rice 10kg', 50, 625.25, '', CURRENT_DATE - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;