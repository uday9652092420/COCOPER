-- ============================================================
-- COCOPER ERP
-- Migration: user_permissions
-- Description: Per-user permissions and relax the user role check.
-- ============================================================

-- 1) Per-user permissions (permission_code format: <module>.<action>)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    permission_code VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_permissions_user
        FOREIGN KEY (user_id)
        REFERENCES organization_users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_user_permission
        UNIQUE (user_id, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user
ON user_permissions (user_id);

-- 2) Drop the restrictive role check so any role created in
--    Roles Master can be assigned to a user.
ALTER TABLE organization_users
DROP CONSTRAINT IF EXISTS organization_users_role_check;
