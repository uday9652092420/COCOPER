/**
 * @file labour_master.sql
 * @description PostgreSQL script to create the labours master table and seed sample rows.
 *
 * Notes:
 * - Creates enums for gender and status.
 * - Creates labours table with typical fields used by the LabourMasterPage.
 * - Adds helpful indexes and sample data.
 * - Intended for PostgreSQL (psql).
 */

BEGIN;

-- Create enum for gender if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'labour_gender') THEN
    CREATE TYPE labour_gender AS ENUM ('Male', 'Female');
  END IF;
END$$;

-- Create enum for status if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'labour_status') THEN
    CREATE TYPE labour_status AS ENUM ('Active', 'Inactive');
  END IF;
END$$;

-- Create labours table
CREATE TABLE IF NOT EXISTS labours (
  id TEXT PRIMARY KEY,
  labour_name TEXT NOT NULL,
  gender labour_gender NOT NULL DEFAULT 'Male',
  contact_number TEXT,
  address TEXT,
  in_time TEXT,
  out_time TEXT,
  overtime_5_8 NUMERIC DEFAULT 0,
  overtime_6_8 NUMERIC DEFAULT 0,
  overtime_7_8 NUMERIC DEFAULT 0,
  overtime_7p_9p NUMERIC DEFAULT 0,
  overtime_7p_10p NUMERIC DEFAULT 0,
  loading_amount NUMERIC DEFAULT 0,
  status labour_status DEFAULT 'Active',
  created_at DATE DEFAULT CURRENT_DATE
);

-- Indexes to speed lookups
CREATE INDEX IF NOT EXISTS idx_labours_name ON labours(labour_name);
CREATE INDEX IF NOT EXISTS idx_labours_status ON labours(status);
CREATE INDEX IF NOT EXISTS idx_labours_contact ON labours(contact_number);

-- Sample seed data
INSERT INTO labours (id, labour_name, gender, contact_number, address, in_time, out_time, overtime_5_8, overtime_6_8, overtime_7_8, overtime_7p_9p, overtime_7p_10p, loading_amount, status, created_at) VALUES
('LABS1', 'Ram Kumar', 'Male', '980000001', 'No 1, Worker Lane', '09:00', '18:00', 120, 90, 60, 150, 200, 400, 'Active', CURRENT_DATE - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO labours (id, labour_name, gender, contact_number, address, in_time, out_time, overtime_5_8, overtime_6_8, overtime_7_8, overtime_7p_9p, overtime_7p_10p, loading_amount, status, created_at) VALUES
('LABS2', 'Sita Devi', 'Female', '980000002', 'No 2, Worker Lane', '08:30', '17:30', 80, 60, 40, 100, 120, 350, 'Active', CURRENT_DATE - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO labours (id, labour_name, gender, contact_number, address, in_time, out_time, overtime_5_8, overtime_6_8, overtime_7_8, overtime_7p_9p, overtime_7p_10p, loading_amount, status, created_at) VALUES
('LABS3', 'Raju', 'Male', '980000003', 'No 3, Worker Lane', '09:00', '18:00', 50, 40, 30, 60, 80, 200, 'Inactive', CURRENT_DATE - INTERVAL '40 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;