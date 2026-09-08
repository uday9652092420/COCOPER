-- Persist Pieces % entered on direct sales lines.
ALTER TABLE direct_sale_items
  ADD COLUMN IF NOT EXISTS pieces_percentage NUMERIC DEFAULT 0;