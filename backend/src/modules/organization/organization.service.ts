/**
 * @file organization.service.ts
 * @description Business logic for the Organization Master module.
 */

import type { Organization, OrganizationDocument, OrganizationDocumentUpsert, OrganizationSummary, OrganizationUpdatePayload } from './organization.types.js';
import {
  deleteOrganizationDocumentRepo,
  getOrganizationByIdRepo,
  getOrganizationDocumentRepo,
  getLatestOrganizationRepo,
  listOrganizationDocumentsRepo,
  listOrganizationsRepo,
  updateOrganizationRepo,
  upsertOrganizationDocumentRepo,
} from './organization.repository.js';

function normalize(payload: OrganizationUpdatePayload): OrganizationUpdatePayload {
  return {
    organization_name: String(payload.organization_name).trim(),
    registration_no: payload.registration_no ? String(payload.registration_no).trim() : null,
    owner_name: payload.owner_name ? String(payload.owner_name).trim() : null,
    contact_no: String(payload.contact_no).trim(),
    email: String(payload.email).trim().toLowerCase(),
    contact_person_name: payload.contact_person_name ? String(payload.contact_person_name).trim() : null,
    address_line1: payload.address_line1 ? String(payload.address_line1).trim() : null,
    address_line2: payload.address_line2 ? String(payload.address_line2).trim() : null,
    city: payload.city ? String(payload.city).trim() : null,
    pincode: payload.pincode ? String(payload.pincode).trim() : null,
    state: payload.state ? String(payload.state).trim() : null,
    country: payload.country ? String(payload.country).trim() : null,
    gst_no: payload.gst_no ? String(payload.gst_no).trim() : null,
    pan_no: payload.pan_no ? String(payload.pan_no).trim() : null,
    cin_no: payload.cin_no ? String(payload.cin_no).trim() : null,
    website: payload.website ? String(payload.website).trim() : null,
    logo_url: payload.logo_url ? String(payload.logo_url).trim() : null,
    contact_person: payload.contact_person ? String(payload.contact_person).trim() : null,
    alternate_contact_no: payload.alternate_contact_no ? String(payload.alternate_contact_no).trim() : null,
    email_secondary: payload.email_secondary ? String(payload.email_secondary).trim().toLowerCase() : null,
    financial_year_start_month: payload.financial_year_start_month ?? 4,
    timezone: payload.timezone ? String(payload.timezone).trim() : 'Asia/Kolkata',
    currency_code: payload.currency_code ? String(payload.currency_code).trim().toUpperCase() : 'INR',
  };
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  return getOrganizationByIdRepo(id);
}

export async function getLatestOrganization(): Promise<Organization | null> {
  return getLatestOrganizationRepo();
}

export async function listOrganizations(): Promise<OrganizationSummary[]> {
  return listOrganizationsRepo();
}

export async function updateOrganization(
  id: string,
  payload: OrganizationUpdatePayload
): Promise<Organization | null> {
  return updateOrganizationRepo(id, normalize(payload));
}

export async function listOrganizationDocuments(organizationId: string): Promise<OrganizationDocument[]> {
  return listOrganizationDocumentsRepo(organizationId);
}

export async function getOrganizationDocument(
  organizationId: string,
  docType: string
): Promise<OrganizationDocument | null> {
  return getOrganizationDocumentRepo(organizationId, docType);
}

export async function upsertOrganizationDocument(
  organizationId: string,
  payload: OrganizationDocumentUpsert
): Promise<OrganizationDocument> {
  return upsertOrganizationDocumentRepo(organizationId, {
    doc_type: String(payload.doc_type).trim(),
    file_name: payload.file_name ? String(payload.file_name).trim() : null,
    mime_type: payload.mime_type ? String(payload.mime_type).trim() : null,
    file_data: payload.file_data ?? null,
  });
}

export async function deleteOrganizationDocument(
  organizationId: string,
  docType: string
): Promise<boolean> {
  return deleteOrganizationDocumentRepo(organizationId, docType);
}
