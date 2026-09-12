/**
 * @file labour_attendance.sql
 * @description PostgreSQL script to create labour_attendance table, attendance_status enum,
 *              indexes and seed sample rows for LabourAttendancePage usage.
 *
 * Notes:
 * - Intended for PostgreSQL (psql).
 * - Uses ON CONFLICT DO NOTHING so the script is idempotent.
 */

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
    CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Leave');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS labour_attendance (
  id TEXT PRIMARY KEY,
  labour_id TEXT,
  labour_name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Regular',
  attendance_date DATE NOT NULL,
  shift TEXT NOT NULL DEFAULT 'Morning',
  in_time TEXT,
  out_time TEXT,
  hours NUMERIC NOT NULL DEFAULT 0,
  morning_ot NUMERIC NOT NULL DEFAULT 0,
  evening_ot NUMERIC NOT NULL DEFAULT 0,
  ot_hours NUMERIC NOT NULL DEFAULT 0,
  ot_rate NUMERIC NOT NULL DEFAULT 150,
  loading_10_tons_amount NUMERIC NOT NULL DEFAULT 0,
  loading_20_tons_amount NUMERIC NOT NULL DEFAULT 0,
  total_ot_amount NUMERIC NOT NULL DEFAULT 0,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  payment_group_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'Draft',
  payment_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at DATE DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_labour_attendance_date ON labour_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_labour_attendance_labour_id ON labour_attendance(labour_id);
CREATE INDEX IF NOT EXISTS idx_labour_attendance_payment_group ON labour_attendance(payment_group_id);

COMMIT;