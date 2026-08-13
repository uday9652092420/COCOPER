/**
 * @file organization.validation.ts
 * @description Lightweight validation for Organization Master updates.
 */

import type { OrganizationUpdatePayload } from './organization.types.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateOrganizationPayload(
  payload: Partial<OrganizationUpdatePayload>
): Record<string, string> | null {
  const errors: Record<string, string> = {};

  if (!payload.organization_name || String(payload.organization_name).trim() === '') {
    errors.organization_name = 'Organization name is required';
  }

  const contactNo = String(payload.contact_no ?? '').trim();
  if (!contactNo) {
    errors.contact_no = 'Contact number is required';
  } else if (!/^[0-9]{10}$/.test(contactNo)) {
    errors.contact_no = 'Enter a valid 10 digit contact number';
  }

  const email = String(payload.email ?? '').trim().toLowerCase();
  if (!email) {
    errors.email = 'Email address is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (payload.pincode && String(payload.pincode).trim() !== '' && !/^[0-9]{6}$/.test(String(payload.pincode).trim())) {
    errors.pincode = 'Enter a valid 6 digit pincode';
  }

  if (payload.email_secondary && String(payload.email_secondary).trim() !== '' && !EMAIL_REGEX.test(String(payload.email_secondary).trim())) {
    errors.email_secondary = 'Enter a valid secondary email address';
  }

  if (
    payload.financial_year_start_month !== undefined &&
    payload.financial_year_start_month !== null &&
    (payload.financial_year_start_month < 1 || payload.financial_year_start_month > 12)
  ) {
    errors.financial_year_start_month = 'Financial year start month must be between 1 and 12';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
