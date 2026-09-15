-- Cash & Bank Expenses transaction records.
CREATE TABLE IF NOT EXISTS cash_bank_expenses (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'Bank', 'UPI')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Expenses', 'Income')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_bank_expenses_org_date
  ON cash_bank_expenses (organization_id, expense_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cash_bank_expenses_branch
  ON cash_bank_expenses (organization_id, branch_id);
