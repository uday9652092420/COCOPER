/**
 * @file register.types.ts
 * @description Types for COCOPER ERP organization registration.
 */

export interface RegisterOrganizationPayload {
  organization_name: string;

  registration_no?: string | null;

  contact_person_name: string;

  contact_no: string;

  email: string;

  address_line1: string;

  address_line2?: string | null;

  street: string;

  city: string;

  pincode: string;

  state: string;

  country: string;

  username: string;

  password: string;
}

export interface OrganizationRegistrationResponse {
  success: boolean;

  message: string;

  organization: {
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

    created_at: string;

    updated_at: string;

    contact_person_name: string | null;

    address_line1: string | null;

    address_line2: string | null;

    street: string | null;
    city: string | null;

    pincode: string | null;

    state: string | null;

    country: string | null;
  };

  user: {
    id: string;

    user_id: string;

    username: string;

    full_name: string | null;

    role: string;

    status: string;

    is_primary_user: boolean;
  };
}