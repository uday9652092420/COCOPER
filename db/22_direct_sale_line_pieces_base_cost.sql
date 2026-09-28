-- Add per-line piece count and derived base cost to Direct Sales details.
-- Base cost is the sales amount divided by pieces; zero pieces yields zero.

BEGIN;

ALTER TABLE direct_sale_items
  ADD COLUMN IF NOT EXISTS pieces NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_cost NUMERIC NOT NULL DEFAULT 0;

UPDATE direct_sale_items
SET base_cost = ROUND(amount / pieces, 2)
WHERE pieces > 0;

COMMIT;
