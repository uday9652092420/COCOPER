-- Add batch identity and approval state for bulk labour payments.
ALTER TABLE labour_attendance
  ADD COLUMN IF NOT EXISTS payment_group_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Draft',
  ADD COLUMN IF NOT EXISTS payment_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE labour_attendance
  DROP CONSTRAINT IF EXISTS labour_attendance_labour_id_attendance_date_key;

CREATE INDEX IF NOT EXISTS idx_labour_attendance_payment_group
  ON labour_attendance(payment_group_id);