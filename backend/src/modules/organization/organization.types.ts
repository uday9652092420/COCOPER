/**
 * @file organization.types.ts
 * @description Type definitions for the Organization Master module.
 */

export interface Organization {
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
  street: string | null;
  city: string | null;
  pincode: string | null;
  state: string | null;
  country: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;

  // Additional details (organization_details table)
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

export interface OrganizationSummary {
  id: string;
  organization_code: string;
  organization_name: string;
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

export interface OrganizationDocumentUpsert {
  doc_type: string;
  file_name?: string | null;
  mime_type?: string | null;
  file_data?: string | null;
}

export interface OrganizationUpdatePayload {
  organization_name: string;
  registration_no?: string | null;
  owner_name?: string | null;
  contact_no: string;
  email: string;
  contact_person_name?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  street?: string | null;
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
