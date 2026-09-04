BEGIN;

ALTER TABLE purchase_invoices
  ADD COLUMN IF NOT EXISTS supplier_payment_receipt_status BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE purchase_invoices
  ADD COLUMN IF NOT EXISTS outstanding_amount NUMERIC NOT NULL DEFAULT 0;

UPDATE purchase_invoices
SET outstanding_amount = grand_total
WHERE outstanding_amount = 0 AND grand_total > 0;

COMMIT;