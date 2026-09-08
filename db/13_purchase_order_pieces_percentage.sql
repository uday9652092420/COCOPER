-- Persist the Pieces % entered for tonnage-percentage purchase orders.
ALTER TABLE purchase_order_items
  ADD COLUMN IF NOT EXISTS pieces_percentage NUMERIC DEFAULT 0;