-- ============================================================
-- Organization Users
-- ============================================================

CREATE TABLE IF NOT EXISTS organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    username VARCHAR(100) NOT NULL,

    password_hash TEXT NOT NULL,

    full_name VARCHAR(150),

    email VARCHAR(200),

    mobile_no VARCHAR(30),

    role VARCHAR(50) NOT NULL DEFAULT 'OWNER',

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_organization_users_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_organization_username
        UNIQUE (organization_id, username),

    CONSTRAINT chk_organization_user_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE',
                'LOCKED'
            )
        )
);