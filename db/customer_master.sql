/**
 * @file customer_master.sql
 * @description PostgreSQL script to create the customers master table and seed sample rows.
 *
 * Notes:
 * - Creates enum types for customer_type and customer_status.
 * - Creates customers table with additional contact fields and credit limit.
 * - Adds helpful indexes and seed data.
 * - Intended for PostgreSQL.
 */

BEGIN;

-- Create enum for customer type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_type') THEN
    CREATE TYPE customer_type AS ENUM ('Premium', 'Local', 'Red');
  END IF;
END$$;

-- Create enum for status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_status') THEN
    CREATE TYPE customer_status AS ENUM ('Active', 'Inactive');
  END IF;
END$$;

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type customer_type NOT NULL DEFAULT 'Local',
  state TEXT,
  address TEXT,
  mobile TEXT,
  whatsapp TEXT,
  contact_person TEXT,
  contact_person1 TEXT,
  contact_no1 TEXT,
  contact_person2 TEXT,
  contact_no2 TEXT,
  contact_person3 TEXT,
  contact_no3 TEXT,
  credit_limit NUMERIC DEFAULT 0,
  status customer_status DEFAULT 'Active',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at DATE DEFAULT CURRENT_DATE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_organization ON customers(organization_id);

-- Sample data
INSERT INTO customers (id, code, name, type, state, address, mobile, whatsapp, contact_person, contact_person1, contact_no1, contact_person2, contact_no2, contact_person3, contact_no3, credit_limit, status, created_at)
VALUES
('CUST-1', 'CUST-001', 'Apex Traders', 'Premium', 'Karnataka', '12 Market Road, Bangalore', '9000100001', '9000100001', 'Ramesh', 'Sakthi', '9000100101', 'Kumar', '9000100201', 'Gopal', '9000100301', 500000, 'Active', CURRENT_DATE - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, code, name, type, state, address, mobile, whatsapp, contact_person, contact_person1, contact_no1, contact_person2, contact_no2, contact_person3, contact_no3, credit_limit, status, created_at)
VALUES
('CUST-2', 'CUST-002', 'Local Fresh', 'Local', 'Tamil Nadu', '5 Street Lane, Chennai', '9000100002', '9000100002', 'Meena', NULL, NULL, NULL, NULL, NULL, NULL, 20000, 'Active', CURRENT_DATE - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, code, name, type, state, address, mobile, whatsapp, contact_person, contact_person1, contact_no1, contact_person2, contact_no2, contact_person3, contact_no3, credit_limit, status, created_at)
VALUES
('CUST-3', 'CUST-003', 'Red Mart', 'Red', 'Kerala', '9 Harbor Road, Kochi', '9000100003', '9000100003', 'Prakash', NULL, NULL, NULL, NULL, NULL, NULL, 0, 'Active', CURRENT_DATE - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;