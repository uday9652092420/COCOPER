-- ============================================================
-- COCOPER ERP
-- Migration: app_users
-- Description: Application-level super users (product owner).
--              These users are NOT linked to any organization and
--              can view data across all registered organizations.
--
-- Note: Super users are seeded directly via SQL (no signup UI).
-- ============================================================

CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    username VARCHAR(100) NOT NULL,

    password_hash TEXT NOT NULL,

    full_name VARCHAR(150),

    role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_app_users_username
        UNIQUE (username),

    CONSTRAINT chk_app_users_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE',
                'LOCKED'
            )
        )
);

-- ============================================================
-- Seed the application owner (super user).
-- Username: Uday
-- Password: Uday123
-- ============================================================

INSERT INTO app_users (
    username,
    password_hash,
    full_name,
    role,
    status
)
VALUES (
    'Uday',
    '$2b$12$Fu/Q1.g1zZzCz1iqErv4n.RFdR25rUY5Ky2sq274VkX6vZLDqaMVG',
    'Uday',
    'SUPER_ADMIN',
    'ACTIVE'
)
ON CONFLICT (username) DO NOTHING;
