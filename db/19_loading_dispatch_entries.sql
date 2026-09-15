CREATE TABLE IF NOT EXISTS loading_dispatch_entries (
  id TEXT PRIMARY KEY, dispatch_number TEXT NOT NULL, organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL, lorry_number TEXT NOT NULL DEFAULT '', driver_name TEXT NOT NULL DEFAULT '', driver_mobile TEXT NOT NULL DEFAULT '', dispatch_date DATE,
  dispatch_status TEXT NOT NULL DEFAULT 'Draft', invoice_generated BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS loading_dispatch_entry_lines (
  id TEXT PRIMARY KEY, dispatch_id TEXT NOT NULL REFERENCES loading_dispatch_entries(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL, line_date DATE NOT NULL, item_id TEXT NOT NULL, bharthi TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 0, loaded_quantity NUMERIC NOT NULL DEFAULT 0, pending_quantity NUMERIC NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE loading_dispatch_entries
  ADD COLUMN IF NOT EXISTS dispatch_date DATE;