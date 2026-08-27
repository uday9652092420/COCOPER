-- ============================================================
-- COCOPER ERP
-- Migration: user_access
-- Description: Roles, Branches, Role Permissions and extra
--              columns on organization_users for the User Master.
-- ============================================================

-- 1) Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID,

    role_name VARCHAR(100) NOT NULL,

    description VARCHAR(250),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_roles_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_roles_organization
ON roles (organization_id);

ALTER TABLE roles
ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) Branches
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID,

    branch_code VARCHAR(30),

    branch_name VARCHAR(150) NOT NULL,

    address VARCHAR(250),

    contact_no VARCHAR(30),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_branches_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_branches_organization
ON branches (organization_id);

-- 3) Role permissions (permission codes are a fixed list defined in code)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    role_id UUID NOT NULL,

    permission_code VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_role_permission
        UNIQUE (role_id, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role
ON role_permissions (role_id);

-- 4) Extra columns on organization_users for User Master
ALTER TABLE organization_users
ADD COLUMN IF NOT EXISTS branch_id UUID;

ALTER TABLE organization_users
ADD COLUMN IF NOT EXISTS email VARCHAR(200);

ALTER TABLE organization_users
ADD COLUMN IF NOT EXISTS mobile_no VARCHAR(30);

-- 5) Seed default global roles (visible to all organizations)
INSERT INTO roles (organization_id, role_name, description, status)
SELECT NULL, r.role_name, r.description, 'ACTIVE'
FROM (VALUES
    ('ADMIN', 'Full access administrator'),
    ('MANAGER', 'Manager with operational access'),
    ('STAFF', 'Day-to-day operations staff'),
    ('VIEWER', 'Read-only access')
) AS r(role_name, description)
WHERE NOT EXISTS (
    SELECT 1
    FROM roles
    WHERE roles.organization_id IS NULL
      AND roles.role_name = r.role_name
);
