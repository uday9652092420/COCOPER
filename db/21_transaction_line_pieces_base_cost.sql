-- Add per-line piece count and derived base cost to transaction details.
-- Base cost is the purchase/sale amount divided by pieces; zero pieces yields zero.

BEGIN;

ALTER TABLE purchase_order_items
  ADD COLUMN IF NOT EXISTS pieces NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_cost NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE sales_order_items
  ADD COLUMN IF NOT EXISTS pieces NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_cost NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE purchase_invoice_items
  ADD COLUMN IF NOT EXISTS pieces NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_cost NUMERIC NOT NULL DEFAULT 0;

UPDATE purchase_order_items
SET base_cost = ROUND(purchase_amount / pieces, 2)
WHERE pieces > 0;

UPDATE sales_order_items
SET base_cost = ROUND(sale_amount / pieces, 2)
WHERE pieces > 0;

UPDATE purchase_invoice_items
SET base_cost = ROUND(purchase_amount / pieces, 2)
WHERE pieces > 0;

COMMIT;
