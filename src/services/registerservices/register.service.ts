/**
 * @file register.service.ts
 * @description API service for COCOPER ERP organization registration.
 */

import { API } from "../../config/api";

/**
 * Payload expected by:
 *
 * POST /api/auth/register
 */
export interface RegisterOrganizationPayload {
  organization_name: string;

  registration_no?: string;

  contact_person_name: string;

  contact_no: string;

  email: string;

  address_line1: string;

  address_line2?: string;

  street?: string;

  city: string;

  pincode: string;

  state: string;

  country: string;

  username: string;

  password: string;
}

/**
 * Organization returned by the backend.
 */
export interface RegisterOrganizationResponse {
  success: boolean;

  message: string;

  details?: {
    errors?: Record<string, string>;
  };

  organization?: {
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

    city: string | null;

    pincode: string | null;

    state: string | null;

    country: string | null;
  };

  /**
   * Initial organization owner.
   */
  user?: {
    id: string;

    user_id: string;

    username: string;

    full_name: string | null;

    role: string;

    status: string;

    is_primary_user: boolean;
  };
}

/**
 * API error structure.
 */
export interface RegisterOrganizationError
  extends Error {
  status?: number;

  details?: {
    errors?: Record<string, string>;
  };
}

/**
 * Register a new organization
 * and initial owner/admin user.
 */
export async function registerOrganization(
  payload: RegisterOrganizationPayload
): Promise<RegisterOrganizationResponse> {
  const response = await fetch(
    `${API}/auth/register`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    }
  );

  const data =
    await response
      .json()
      .catch(() => null);

  /**
   * Handle API errors.
   */
  if (!response.ok) {
    const error =
      new Error(
        data?.message ||
          "Unable to register organization."
      ) as RegisterOrganizationError;

    error.status =
      response.status;

    error.details =
      data?.details;

    throw error;
  }

  return data as RegisterOrganizationResponse;
}