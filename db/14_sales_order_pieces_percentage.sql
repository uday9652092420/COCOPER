-- Persist Pieces % entered on sales-order conversion lines.
ALTER TABLE sales_order_items
  ADD COLUMN IF NOT EXISTS pieces_percentage NUMERIC DEFAULT 0;