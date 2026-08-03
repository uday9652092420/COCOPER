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

-- Create enum for attendance status if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
    CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Leave');
  END IF;
END$$;

-- Create labour_attendance table
CREATE TABLE IF NOT EXISTS labour_attendance (
  id TEXT PRIMARY KEY,
  labour_id TEXT NOT NULL,
  attendance_date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'Present',
  in_time TEXT,
  out_time TEXT,
  hours_worked NUMERIC DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  remarks TEXT,
  created_at DATE DEFAULT CURRENT_DATE,
  UNIQUE (labour_id, attendance_date)
);

-- Indexes to speed queries by date and labour
CREATE INDEX IF NOT EXISTS idx_labour_attendance_date ON labour_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_labour_attendance_labour_id ON labour_attendance(labour_id);
CREATE INDEX IF NOT EXISTS idx_labour_attendance_status ON labour_attendance(status);

-- Seed sample data
INSERT INTO labour_attendance (id, labour_id, attendance_date, status, in_time, out_time, hours_worked, overtime_hours, remarks, created_at)
VALUES
('LA-1', 'LABS1', CURRENT_DATE - INTERVAL '2 days', 'Present', '09:00', '18:00', 8, 1, 'Normal day', CURRENT_DATE - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO labour_attendance (id, labour_id, attendance_date, status, in_time, out_time, hours_worked, overtime_hours, remarks, created_at)
VALUES
('LA-2', 'LABS2', CURRENT_DATE - INTERVAL '1 days', 'Leave', NULL, NULL, 0, 0, 'Sick leave', CURRENT_DATE - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO labour_attendance (id, labour_id, attendance_date, status, in_time, out_time, hours_worked, overtime_hours, remarks, created_at)
VALUES
('LA-3', 'LABS1', CURRENT_DATE, 'Present', '09:15', '18:30', 8.25, 0.5, 'Late arrival', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

COMMIT;