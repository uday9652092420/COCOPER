/**
 * @file organization.repository.ts
 * @description Repository for the Organization Master module.
 */

import { pool } from '../../config/db.js';
import type {
  Organization,
  OrganizationDocument,
  OrganizationDocumentUpsert,
  OrganizationSummary,
  OrganizationUpdatePayload,
} from './organization.types.js';

/**
 * Shared SELECT that joins the base organizations table with the
 * optional organization_details table.
 */
const ORGANIZATION_SELECT = `
  SELECT
    o.id,
    o.organization_code,
    o.organization_name,
    o.registration_no,
    o.owner_name,
    o.contact_no,
    o.email,
    o.address,
    o.status,
    o.is_profile_completed,
    o.contact_person_name,
    o.address_line1,
    o.address_line2,
    o.street,
    o.city,
    o.pincode,
    o.state,
    o.country,
    ou.username AS user_id,
    o.created_at,
    o.updated_at,
    od.gst_no,
    od.pan_no,
    od.cin_no,
    od.website,
    od.logo_url,
    od.contact_person,
    od.alternate_contact_no,
    od.email_secondary,
    COALESCE(od.financial_year_start_month, 4) AS financial_year_start_month,
    COALESCE(od.timezone, 'Asia/Kolkata') AS timezone,
    COALESCE(od.currency_code, 'INR') AS currency_code
  FROM organizations o
  LEFT JOIN organization_details od
    ON od.organization_id = o.id
  LEFT JOIN organization_users ou
    ON ou.organization_id = o.id AND ou.is_primary_user = true
`;

export async function getOrganizationByIdRepo(id: string): Promise<Organization | null> {
  const { rows } = await pool.query(
    `${ORGANIZATION_SELECT} WHERE o.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getLatestOrganizationRepo(): Promise<Organization | null> {
  const { rows } = await pool.query(
    `${ORGANIZATION_SELECT} ORDER BY o.created_at DESC LIMIT 1`
  );
  return rows[0] ?? null;
}

export async function listOrganizationsRepo(): Promise<OrganizationSummary[]> {
  const { rows } = await pool.query(
    `
    SELECT id, organization_code, organization_name
    FROM organizations
    ORDER BY created_at DESC
    `
  );
  return rows;
}

export async function updateOrganizationRepo(
  id: string,
  payload: OrganizationUpdatePayload
): Promise<Organization | null> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orgResult = await client.query(
      `
      UPDATE organizations
      SET
        organization_name = $2,
        registration_no = $3,
        owner_name = $4,
        contact_no = $5,
        email = $6,
        contact_person_name = $7,
        address_line1 = $8,
        address_line2 = $9,
        street = $10,
        city = $11,
        pincode = $12,
        state = $13,
        country = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
      `,
      [
        id,
        payload.organization_name,
        payload.registration_no ?? null,
        payload.owner_name ?? null,
        payload.contact_no,
        payload.email,
        payload.contact_person_name ?? null,
        payload.address_line1 ?? null,
        payload.address_line2 ?? null,
        payload.street ?? null,
        payload.city ?? null,
        payload.pincode ?? null,
        payload.state ?? null,
        payload.country ?? null,
      ]
    );

    if (orgResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `
      INSERT INTO organization_details (
        organization_id,
        gst_no,
        pan_no,
        cin_no,
        website,
        logo_url,
        contact_person,
        alternate_contact_no,
        email_secondary,
        financial_year_start_month,
        timezone,
        currency_code,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (organization_id)
      DO UPDATE SET
        gst_no = EXCLUDED.gst_no,
        pan_no = EXCLUDED.pan_no,
        cin_no = EXCLUDED.cin_no,
        website = EXCLUDED.website,
        logo_url = EXCLUDED.logo_url,
        contact_person = EXCLUDED.contact_person,
        alternate_contact_no = EXCLUDED.alternate_contact_no,
        email_secondary = EXCLUDED.email_secondary,
        financial_year_start_month = EXCLUDED.financial_year_start_month,
        timezone = EXCLUDED.timezone,
        currency_code = EXCLUDED.currency_code,
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        id,
        payload.gst_no ?? null,
        payload.pan_no ?? null,
        payload.cin_no ?? null,
        payload.website ?? null,
        payload.logo_url ?? null,
        payload.contact_person ?? null,
        payload.alternate_contact_no ?? null,
        payload.email_secondary ?? null,
        payload.financial_year_start_month ?? 4,
        payload.timezone ?? 'Asia/Kolkata',
        payload.currency_code ?? 'INR',
      ]
    );

    await client.query(
      `UPDATE organizations SET is_profile_completed = TRUE WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');

    const { rows } = await client.query(
      `${ORGANIZATION_SELECT} WHERE o.id = $1`,
      [id]
    );

    return rows[0] ?? null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listOrganizationDocumentsRepo(organizationId: string): Promise<OrganizationDocument[]> {
  const { rows } = await pool.query(
    `
    SELECT id, organization_id, doc_type, file_name, mime_type, NULL AS file_data, created_at, updated_at
    FROM organization_documents
    WHERE organization_id = $1
    ORDER BY doc_type
    `,
    [organizationId]
  );
  return rows;
}

export async function getOrganizationDocumentRepo(
  organizationId: string,
  docType: string
): Promise<OrganizationDocument | null> {
  const { rows } = await pool.query(
    `
    SELECT id, organization_id, doc_type, file_name, mime_type, file_data, created_at, updated_at
    FROM organization_documents
    WHERE organization_id = $1 AND doc_type = $2
    `,
    [organizationId, docType]
  );
  return rows[0] ?? null;
}

export async function upsertOrganizationDocumentRepo(
  organizationId: string,
  payload: OrganizationDocumentUpsert
): Promise<OrganizationDocument> {
  const { rows } = await pool.query(
    `
    INSERT INTO organization_documents (organization_id, doc_type, file_name, mime_type, file_data)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (organization_id, doc_type)
    DO UPDATE SET
      file_name = EXCLUDED.file_name,
      mime_type = EXCLUDED.mime_type,
      file_data = EXCLUDED.file_data,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, organization_id, doc_type, file_name, mime_type, created_at, updated_at
    `,
    [
      organizationId,
      payload.doc_type,
      payload.file_name ?? null,
      payload.mime_type ?? null,
      payload.file_data ?? null,
    ]
  );
  return { ...rows[0], file_data: null };
}

export async function deleteOrganizationDocumentRepo(
  organizationId: string,
  docType: string
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM organization_documents WHERE organization_id = $1 AND doc_type = $2`,
    [organizationId, docType]
  );
  return (result.rowCount ?? 0) > 0;
}
