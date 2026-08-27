-- COCOPER ERP - protected organization owner roles

ALTER TABLE roles
ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN NOT NULL DEFAULT FALSE;

-- Owner roles are organization-specific and must not be removable.
CREATE UNIQUE INDEX IF NOT EXISTS uq_owner_role_per_organization
ON roles (organization_id)
WHERE is_system_role = TRUE AND role_name = 'OWNER';