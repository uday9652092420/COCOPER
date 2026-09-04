BEGIN;

ALTER TABLE direct_sales
  ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE direct_sales
  ADD COLUMN IF NOT EXISTS gunny_bags_total NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE direct_sales
  ADD COLUMN IF NOT EXISTS transportation_charges NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE direct_sales
  ADD COLUMN IF NOT EXISTS loading_charges NUMERIC NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_direct_sales_approved_customer
  ON direct_sales (organization_id, customer_id, approved);

COMMIT;