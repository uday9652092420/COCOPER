-- ============================================================
-- user_branches.sql
-- Maps organization users to branches (many-to-many) and
-- records which of the assigned branches is the default branch.
--
-- Run after user_access.sql (branches + organization_users).
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS user_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_branches_user
        FOREIGN KEY (user_id) REFERENCES organization_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_branches_branch
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_branch UNIQUE (user_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_user_branches_user ON user_branches (user_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_branch ON user_branches (branch_id);

-- At most one default branch per user (partial unique index).
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_branches_one_default
    ON user_branches (user_id)
    WHERE is_default = TRUE;

COMMIT;
