-- Allow item codes to repeat across organizations while keeping them unique
-- within each organization. Preserve uniqueness for unscoped legacy items.

BEGIN;

ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_items_organization_code
  ON public.items (organization_id, code)
  WHERE organization_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_items_global_code
  ON public.items (code)
  WHERE organization_id IS NULL;

COMMIT;