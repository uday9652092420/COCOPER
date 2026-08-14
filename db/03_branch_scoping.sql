-- ============================================================
-- 03_branch_scoping.sql
-- Migration: make items, gunny bags and bag purchases
-- branch-scoped (in addition to organization scope).
--
-- Adds a nullable branch_id (FK -> branches) to each table.
-- Existing rows keep branch_id = NULL so they remain visible
-- across all branches.
--
-- Run AFTER user_access.sql (branches table) and
-- 01_organization_scoping.sql.
-- ============================================================

BEGIN;

ALTER TABLE items
    ADD COLUMN IF NOT EXISTS branch_id UUID
    REFERENCES branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_items_branch
    ON items (branch_id);

ALTER TABLE gunny_bags
    ADD COLUMN IF NOT EXISTS branch_id UUID
    REFERENCES branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_gunny_bags_branch
    ON gunny_bags (branch_id);

ALTER TABLE bag_purchases
    ADD COLUMN IF NOT EXISTS branch_id UUID
    REFERENCES branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bag_purchases_branch
    ON bag_purchases (branch_id);

COMMIT;
