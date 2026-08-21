-- Add approval state for purchase invoices.
ALTER TABLE purchase_invoices
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Draft';

UPDATE purchase_invoices
SET status = 'Draft'
WHERE status IS NULL;