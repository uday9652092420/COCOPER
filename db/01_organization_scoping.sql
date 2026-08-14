-- ============================================================
-- 01_organization_scoping.sql
-- Migration: make all master modules organization-scoped.
--
-- Adds an organization_id column (nullable, FK -> organizations)
-- to each master table and creates indexes. Existing rows keep
-- organization_id = NULL so they remain globally visible to all
-- organizations (shared/global records).
--
-- Run AFTER organizations table exists.
-- ============================================================

BEGIN;

-- Warehouses
ALTER TABLE warehouses
    ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_warehouses_organization
    ON warehouses (organization_id);

-- Items
ALTER TABLE items
    ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_items_organization
    ON items (organization_id);

-- Gunny Bags
ALTER TABLE gunny_bags
    ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_gunny_bags_organization
    ON gunny_bags (organization_id);

-- Suppliers
ALTER TABLE suppliers
    ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_suppliers_organization
    ON suppliers (organization_id);

-- Customers
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_customers_organization
    ON customers (organization_id);

-- Labour
ALTER TABLE labours
    ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_labours_organization
    ON labours (organization_id);

-- Bag Purchases
ALTER TABLE bag_purchases
    ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_bag_purchases_organization
    ON bag_purchases (organization_id);

-- ============================================================
-- Per-user permissions: rename old action codes to the new
-- canonical action codes (view -> read, add -> create).
-- New actions: read, create, edit, delete, post, approve.
-- ============================================================
UPDATE user_permissions
SET permission_code = replace(permission_code, '.view', '.read')
WHERE permission_code LIKE '%.view';

UPDATE user_permissions
SET permission_code = replace(permission_code, '.add', '.create')
WHERE permission_code LIKE '%.add';

COMMIT;
