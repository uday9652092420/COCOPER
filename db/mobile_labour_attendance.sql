-- Mobile labour attendance captured by organization users.

CREATE TABLE IF NOT EXISTS mobile_labour_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    labour_name VARCHAR(200) NOT NULL,
    user_id UUID NOT NULL REFERENCES organization_users(id) ON DELETE RESTRICT,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    in_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    out_time TIMESTAMPTZ,
    total_working_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mobile_labour_attendance_scope
    ON mobile_labour_attendance (organization_id, branch_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_mobile_labour_attendance_user
    ON mobile_labour_attendance (user_id, attendance_date);