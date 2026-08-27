-- COCOPER ERP - organization user email login

ALTER TABLE organization_users
ADD COLUMN IF NOT EXISTS email VARCHAR(200);

CREATE INDEX IF NOT EXISTS idx_organization_users_email
ON organization_users (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS uq_organization_users_email
ON organization_users (LOWER(email))
WHERE email IS NOT NULL;

-- Backfill the primary registration user from the organization email.
UPDATE organization_users ou
SET email = o.email
FROM organizations o
WHERE ou.organization_id = o.id
  AND ou.is_primary_user = TRUE
  AND ou.email IS NULL;