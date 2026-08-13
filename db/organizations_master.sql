-- ============================================================
-- COCOPER ERP
-- Migration: 001_organization_master
-- Description: Organization Master for SaaS tenants
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_code VARCHAR(30) NOT NULL,
    organization_name VARCHAR(200) NOT NULL,
    registration_no VARCHAR(100),

    owner_name VARCHAR(150) NOT NULL,

    user_id VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,

    contact_no VARCHAR(30),
    email VARCHAR(200),

    address_line1 VARCHAR(250),
    address_line2 VARCHAR(250),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_organizations_code
        UNIQUE (organization_code),

    CONSTRAINT uq_organizations_user_id
        UNIQUE (user_id),

    CONSTRAINT chk_organizations_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE',
                'SUSPENDED'
            )
        )
);

-- ============================================================
-- Organization Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_organizations_name
ON organizations (organization_name);

CREATE INDEX IF NOT EXISTS idx_organizations_registration_no
ON organizations (registration_no);

CREATE INDEX IF NOT EXISTS idx_organizations_email
ON organizations (email);

CREATE INDEX IF NOT EXISTS idx_organizations_status
ON organizations (status);

CREATE INDEX IF NOT EXISTS idx_organization_users_organization
ON organization_users (organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_users_username
ON organization_users (username);

CREATE INDEX IF NOT EXISTS idx_organization_users_email
ON organization_users (email);

CREATE INDEX IF NOT EXISTS idx_organization_details_gst
ON organization_details (gst_no);

-- ============================================================
-- Organization Triggers
-- ============================================================

DROP TRIGGER IF EXISTS trg_organizations_updated_at
ON organizations;

CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_organization_details_updated_at
ON organization_details;

CREATE TRIGGER trg_organization_details_updated_at
BEFORE UPDATE ON organization_details
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_organization_users_updated_at
ON organization_users;

CREATE TRIGGER trg_organization_users_updated_at
BEFORE UPDATE ON organization_users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Generate Organization Code
-- ============================================================

CREATE OR REPLACE FUNCTION get_next_organization_code()
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
    last_code VARCHAR;
    last_number INTEGER;
BEGIN

    SELECT organization_code
    INTO last_code
    FROM organizations
    WHERE organization_code ~ '^ORG-[0-9]+$'
    ORDER BY created_at DESC
    LIMIT 1;

    IF last_code IS NULL THEN
        RETURN 'ORG-001';
    END IF;

    last_number :=
        CAST(
            regexp_replace(
                last_code,
                '^ORG-',
                ''
            ) AS INTEGER
        );

    RETURN 'ORG-' ||
           LPAD(
               (last_number + 1)::TEXT,
               3,
               '0'
           );

END;
$$;

-- ============================================================
-- Organization Master View
-- ============================================================

CREATE OR REPLACE VIEW vw_organization_master AS
SELECT
    o.id,
    o.organization_code,
    o.organization_name,
    o.registration_no,
    o.owner_name,
    o.user_id,
    o.contact_no,
    o.email,
    o.address_line1,
    o.address_line2,
    o.city,
    o.state,
    o.postal_code,
    o.country,
    o.status,
    o.is_verified,
    o.last_login_at,

    od.gst_no,
    od.pan_no,
    od.cin_no,
    od.website,
    od.logo_url,
    od.contact_person,
    od.alternate_contact_no,
    od.email_secondary,
    od.financial_year_start_month,
    od.timezone,
    od.currency_code,

    o.created_at,
    o.updated_at

FROM organizations o

LEFT JOIN organization_details od
    ON od.organization_id = o.id;