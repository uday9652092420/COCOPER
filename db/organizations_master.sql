-- ============================================================
-- COCOPER ERP — organizations_master.sql
-- Organization Master (SaaS tenants).
-- Matches the live database schema.
-- ============================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_code VARCHAR(30) NOT NULL,
    organization_name VARCHAR(200) NOT NULL,
    registration_no VARCHAR(100),
    owner_name VARCHAR(150),

    contact_no VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_profile_completed BOOLEAN NOT NULL DEFAULT FALSE,

    contact_person_name VARCHAR(150),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    pincode VARCHAR(10),
    state VARCHAR(100),
    country VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT organizations_organization_code_key
        UNIQUE (organization_code),

    CONSTRAINT organizations_status_check
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE',
                'SUSPENDED',
                'Active',
                'Inactive',
                'Suspended'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_organizations_code
    ON organizations (organization_code);

CREATE INDEX IF NOT EXISTS idx_organizations_name
    ON organizations (organization_name);

CREATE INDEX IF NOT EXISTS idx_organizations_registration_no
    ON organizations (registration_no);

CREATE INDEX IF NOT EXISTS idx_organizations_status
    ON organizations (status);

CREATE INDEX IF NOT EXISTS idx_organizations_email
    ON organizations (LOWER(email));