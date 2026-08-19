-- ============================================================
-- 05_purchase_order_organization_scoping.sql
-- Migration: make purchase orders organization-scoped.
--
-- Adds an organization_id column (nullable, FK -> organizations)
-- to purchase_orders so each organization only sees its own POs.
-- Existing rows keep organization_id = NULL (global/legacy records
-- visible to all organizations, same pattern as other master tables).
--
-- Run AFTER purchase_orders table exists (db/purchase_order.sql).
-- ============================================================

BEGIN;

ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_organization
    ON purchase_orders (organization_id);

COMMIT;
