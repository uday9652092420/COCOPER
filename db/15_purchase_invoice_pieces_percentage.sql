-- Persist Pieces % entered on purchase invoice lines.
ALTER TABLE purchase_invoice_items
  ADD COLUMN IF NOT EXISTS pieces_percentage NUMERIC DEFAULT 0;