-- Persist all non-sensitive organization registration fields.
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS street VARCHAR(255);