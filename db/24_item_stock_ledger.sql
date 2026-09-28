-- Transaction ledger for inventory receipts and issues.

BEGIN;

CREATE TABLE IF NOT EXISTS item_stock_ledger (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  in_quantity_stock NUMERIC,
  out_quantity_stock NUMERIC,
  rate NUMERIC NOT NULL DEFAULT 0,
  stock_type TEXT NOT NULL CHECK (stock_type IN ('Purchase', 'Sales')),
  source_id TEXT NOT NULL,
  source_number TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (stock_type = 'Purchase' AND in_quantity_stock IS NOT NULL AND out_quantity_stock IS NULL)
    OR
    (stock_type = 'Sales' AND out_quantity_stock IS NOT NULL AND in_quantity_stock IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_item_stock_ledger_source_item_type
  ON item_stock_ledger (source_id, item_id, stock_type);
CREATE INDEX IF NOT EXISTS idx_item_stock_ledger_scope_date
  ON item_stock_ledger (organization_id, branch_id, item_id, transaction_date);

COMMIT;
