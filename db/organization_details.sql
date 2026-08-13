-- ============================================================
-- COCOPER ERP
-- Migration: organization_details
-- Description: Additional organization profile information
--              (GST, PAN, CIN, website, contact and preferences)
--
-- Notes:
--   * Base organization information (name, address, contact, etc.)
--     lives in the `organizations` table.
--   * This table holds extra details that are optional at signup
--     and can be maintained later from the Organization Master screen.
-- ============================================================

CREATE TABLE IF NOT EXISTS organization_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    gst_no VARCHAR(50),
    pan_no VARCHAR(50),
    cin_no VARCHAR(100),

    website VARCHAR(250),

    logo_url TEXT,

    contact_person VARCHAR(150),
    alternate_contact_no VARCHAR(30),

    email_secondary VARCHAR(200),

    financial_year_start_month SMALLINT DEFAULT 4,

    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',

    currency_code VARCHAR(10) DEFAULT 'INR',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_organization_details_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_organization_details_organization
        UNIQUE (organization_id),

    CONSTRAINT chk_financial_year_month
        CHECK (
            financial_year_start_month BETWEEN 1 AND 12
        )
);

-- ============================================================
-- Organization Details Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_organization_details_gst
ON organization_details (gst_no);