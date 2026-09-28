-- Track piece inventory separately from the existing quantity stock.
-- Existing balances are initialized from saved purchase invoices less sales invoices.

BEGIN;

ALTER TABLE item_branch_stock
  ADD COLUMN IF NOT EXISTS pieces NUMERIC NOT NULL DEFAULT 0 CHECK (pieces >= 0),
  ADD COLUMN IF NOT EXISTS base_cost NUMERIC NOT NULL DEFAULT 0;

WITH purchase_totals AS (
  SELECT
    pi.organization_id,
    pi.branch_id::text AS branch_id,
    pii.item_id,
    SUM(COALESCE(pii.pieces, 0)) AS pieces,
    SUM(COALESCE(pii.purchase_amount, 0)) AS purchase_amount
  FROM purchase_invoices pi
  JOIN purchase_invoice_items pii ON pii.purchase_invoice_id = pi.id
  WHERE pi.organization_id IS NOT NULL
    AND pi.branch_id IS NOT NULL
    AND NULLIF(TRIM(pi.branch_id), '') IS NOT NULL
    AND pii.item_id IS NOT NULL
  GROUP BY pi.organization_id, pi.branch_id, pii.item_id
),
sale_totals AS (
  SELECT
    ds.organization_id,
    ds.branch_id::text AS branch_id,
    dsi.item_id,
    SUM(COALESCE(dsi.pieces, 0)) AS pieces
  FROM direct_sales ds
  JOIN direct_sale_items dsi ON dsi.direct_sale_id = ds.id
  WHERE ds.organization_id IS NOT NULL
    AND ds.branch_id IS NOT NULL
    AND dsi.item_id IS NOT NULL
  GROUP BY ds.organization_id, ds.branch_id, dsi.item_id
),
item_totals AS (
  SELECT
    COALESCE(p.organization_id, s.organization_id) AS organization_id,
    COALESCE(p.branch_id, s.branch_id) AS branch_id,
    COALESCE(p.item_id, s.item_id) AS item_id,
    COALESCE(p.pieces, 0) AS purchased_pieces,
    COALESCE(s.pieces, 0) AS sold_pieces,
    COALESCE(p.purchase_amount, 0) AS purchase_amount
  FROM purchase_totals p
  FULL OUTER JOIN sale_totals s
    ON s.organization_id = p.organization_id
   AND s.branch_id = p.branch_id
   AND s.item_id = p.item_id
)
INSERT INTO item_branch_stock
  (id, organization_id, item_id, item_code, branch_id, branch_name, stock, pieces, base_cost)
SELECT
  'IBS-PIECES-' || md5(t.organization_id::text || t.branch_id::text || t.item_id),
  t.organization_id,
  t.item_id,
  COALESCE(i.code, t.item_id),
  t.branch_id::uuid,
  COALESCE(b.branch_name, ''),
  0,
  GREATEST(t.purchased_pieces - t.sold_pieces, 0),
  CASE WHEN t.purchased_pieces > 0
    THEN ROUND(t.purchase_amount / t.purchased_pieces, 2)
    ELSE 0
  END
FROM item_totals t
JOIN items i ON i.id = t.item_id
JOIN branches b ON b.id::text = t.branch_id
ON CONFLICT (organization_id, item_id, branch_id)
DO UPDATE SET
  pieces = EXCLUDED.pieces,
  base_cost = EXCLUDED.base_cost,
  updated_at = NOW();

COMMIT;
