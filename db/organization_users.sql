-- ============================================================
-- COCOPER ERP — organization_users.sql
-- Organization Users (users who belong to an organization).
-- Matches the live database schema.
-- ============================================================

CREATE TABLE IF NOT EXISTS organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    user_id UUID DEFAULT gen_random_uuid() NOT NULL,

    username VARCHAR(100) NOT NULL,

    password_hash TEXT NOT NULL,

    full_name VARCHAR(150),

    role VARCHAR(30) NOT NULL DEFAULT 'OWNER',

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    is_primary_user BOOLEAN NOT NULL DEFAULT true,

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    branch_id UUID,
    email VARCHAR(200),
    mobile_no VARCHAR(30),
    profile_picture TEXT,

    CONSTRAINT fk_organization_users_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT organization_users_unique_username
        UNIQUE (username),

    CONSTRAINT organization_users_status_check
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE',
                'BLOCKED',
                'Active',
                'Inactive',
                'Blocked'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_organization_users_org
    ON organization_users (organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_users_org_status
    ON organization_users (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_organization_users_username
    ON organization_users (LOWER(username));

CREATE INDEX IF NOT EXISTS idx_organization_users_email
    ON organization_users (LOWER(email));

-- At most one primary user per organization.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_user_per_org
    ON organization_users (organization_id)
    WHERE is_primary_user = true;