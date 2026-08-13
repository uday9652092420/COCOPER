-- ============================================================
-- COCOPER ERP
-- Migration: profile_docs
-- Description: Profile pictures and organization documents.
-- ============================================================

-- Profile picture (base64 data URL) for super users and org users
ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

ALTER TABLE organization_users
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Required documents for an organization (jpg/pdf etc.)
CREATE TABLE IF NOT EXISTS organization_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    doc_type VARCHAR(50) NOT NULL,

    file_name VARCHAR(255),

    mime_type VARCHAR(100),

    file_data TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_organization_documents_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_organization_document
        UNIQUE (organization_id, doc_type)
);

CREATE INDEX IF NOT EXISTS idx_organization_documents_org
ON organization_documents (organization_id);
