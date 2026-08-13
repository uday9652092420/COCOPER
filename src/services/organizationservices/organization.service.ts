/**
 * @file organization.service.ts
 * @description API service for the Organization Master module.
 */

import { API } from "../../config/api";

/**
 * Organization returned by the backend.
 */
export interface OrganizationResponse {
  id: string;
  organization_code: string;
  organization_name: string;
  registration_no: string | null;
  owner_name: string | null;
  contact_no: string;
  email: string;
  address: string | null;
  status: string;
  is_profile_completed: boolean;
  contact_person_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  pincode: string | null;
  state: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;

  gst_no: string | null;
  pan_no: string | null;
  cin_no: string | null;
  website: string | null;
  logo_url: string | null;
  contact_person: string | null;
  alternate_contact_no: string | null;
  email_secondary: string | null;
  financial_year_start_month: number | null;
  timezone: string | null;
  currency_code: string | null;
}

/**
 * Payload for updating an organization.
 */
export interface OrganizationUpdatePayload {
  organization_name: string;
  registration_no?: string | null;
  owner_name?: string | null;
  contact_no: string;
  email: string;
  contact_person_name?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  pincode?: string | null;
  state?: string | null;
  country?: string | null;
  gst_no?: string | null;
  pan_no?: string | null;
  cin_no?: string | null;
  website?: string | null;
  logo_url?: string | null;
  contact_person?: string | null;
  alternate_contact_no?: string | null;
  email_secondary?: string | null;
  financial_year_start_month?: number | null;
  timezone?: string | null;
  currency_code?: string | null;
}

/**
 * Organization id stored locally after registration.
 * Used to scope API calls to the currently logged-in organization.
 */
export const getStoredOrganizationId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cocoper_org_id");
};

export const storeOrganizationId = (id: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("cocoper_org_id", id);
};

/**
 * Organization summary (used by the super-user organization selector).
 */
export interface OrganizationSummary {
  id: string;
  organization_code: string;
  organization_name: string;
}

/**
 * GET /api/organizations
 *
 * Returns all registered organizations (for the super-user selector).
 */
export async function getOrganizations(): Promise<OrganizationSummary[]> {
  const response = await fetch(`${API}/organizations`);

  if (!response.ok) {
    throw await response.json().catch(() => ({ message: "Failed to load organizations" }));
  }

  return response.json();
}

/**
 * GET /api/organizations/me
 *
 * Returns the organization for the currently logged-in user.
 * A super user can pass an explicit organization id.
 */
export async function getCurrentOrganization(
  organizationId?: string | null
): Promise<OrganizationResponse> {
  const headers: Record<string, string> = {};

  const resolvedId = organizationId ?? getStoredOrganizationId();
  if (resolvedId) {
    headers["x-organization-id"] = resolvedId;
  }

  const response = await fetch(`${API}/organizations/me`, { headers });

  if (!response.ok) {
    throw await response.json().catch(() => ({ message: "Failed to load organization" }));
  }

  return response.json();
}

/**
 * GET /api/organizations/:id
 */
export async function getOrganization(id: string): Promise<OrganizationResponse> {
  const response = await fetch(`${API}/organizations/${id}`);

  if (!response.ok) {
    throw await response.json().catch(() => ({ message: "Failed to load organization" }));
  }

  return response.json();
}

/**
 * PUT /api/organizations/:id
 */
export async function updateOrganization(
  id: string,
  payload: OrganizationUpdatePayload
): Promise<OrganizationResponse> {
  const response = await fetch(`${API}/organizations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}

export interface OrganizationDocument {
  id: string;
  organization_id: string;
  doc_type: string;
  file_name: string | null;
  mime_type: string | null;
  file_data: string | null;
  created_at: string;
  updated_at: string;
}

export async function getOrganizationDocuments(organizationId: string): Promise<OrganizationDocument[]> {
  const response = await fetch(`${API}/organizations/${organizationId}/documents`);
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to load documents" }));
  return response.json();
}

export async function getOrganizationDocument(
  organizationId: string,
  docType: string
): Promise<OrganizationDocument> {
  const response = await fetch(`${API}/organizations/${organizationId}/documents/${docType}`);
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to load document" }));
  return response.json();
}

export async function uploadOrganizationDocument(
  organizationId: string,
  docType: string,
  payload: { file_name: string; mime_type: string; file_data: string }
): Promise<OrganizationDocument> {
  const response = await fetch(`${API}/organizations/${organizationId}/documents/${docType}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}

export async function deleteOrganizationDocument(
  organizationId: string,
  docType: string
): Promise<void> {
  const response = await fetch(`${API}/organizations/${organizationId}/documents/${docType}`, {
    method: "DELETE",
  });
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to delete document" }));
}
