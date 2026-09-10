-- Replace the single loading amount with separate 10-ton and 20-ton amounts.
ALTER TABLE labours
  ADD COLUMN IF NOT EXISTS loading_10_tons_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loading_20_tons_amount NUMERIC DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'labours' AND column_name = 'loading_amount'
  ) THEN
    EXECUTE 'UPDATE labours SET loading_10_tons_amount = COALESCE(loading_amount, 0) WHERE loading_amount IS NOT NULL';
  END IF;
END $$;

ALTER TABLE labours
  DROP COLUMN IF EXISTS loading_amount;