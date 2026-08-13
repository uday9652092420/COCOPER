/**
 * @file register.validation.ts
 * @description Validation for COCOPER ERP organization registration.
 */

import type {
  RegisterOrganizationPayload,
} from "./register.types.js";

/**
 * Validation error structure.
 */
export interface RegisterValidationError
  extends Error {
  details: {
    errors: Record<string, string>;
  };
}

/**
 * Validate organization registration payload.
 *
 * @param payload Organization registration payload.
 * @returns true when validation succeeds.
 * @throws RegisterValidationError when validation fails.
 */
export function validateRegisterPayload(
  payload: RegisterOrganizationPayload
): true {
  /**
   * Field-level validation errors.
   */
  const errors: Record<string, string> = {};

  /**
   * Payload
   */
  if (!payload) {
    const error =
      new Error(
        "Registration validation failed."
      ) as RegisterValidationError;

    error.details = {
      errors: {
        payload:
          "Registration data is required.",
      },
    };

    throw error;
  }

  /**
   * Organization Name
   */
  if (
    !payload.organization_name ||
    !String(
      payload.organization_name
    ).trim()
  ) {
    errors.organization_name =
      "Organization name is required.";
  }

  /**
   * Registration Number
   *
   * Optional field.
   * No validation is required when it is empty.
   */
  if (
    payload.registration_no !==
      undefined &&
    payload.registration_no !== null &&
    String(
      payload.registration_no
    ).trim().length > 100
  ) {
    errors.registration_no =
      "Registration number cannot exceed 100 characters.";
  }

  /**
   * Contact Person Name
   */
  if (
    !payload.contact_person_name ||
    !String(
      payload.contact_person_name
    ).trim()
  ) {
    errors.contact_person_name =
      "Contact person name is required.";
  }

  /**
   * Contact Number
   */
  const contactNo = String(
    payload.contact_no ?? ""
  ).trim();

  if (!contactNo) {
    errors.contact_no =
      "Contact number is required.";
  } else if (
    !/^[0-9]{10}$/.test(contactNo)
  ) {
    errors.contact_no =
      "Enter a valid 10 digit contact number.";
  }

  /**
   * Email
   */
  const email = String(
    payload.email ?? ""
  )
    .trim()
    .toLowerCase();

  if (!email) {
    errors.email =
      "Email address is required.";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    errors.email =
      "Enter a valid email address.";
  }

  /**
   * Address Line 1
   */
  if (
    !payload.address_line1 ||
    !String(
      payload.address_line1
    ).trim()
  ) {
    errors.address_line1 =
      "Address Line 1 is required.";
  }

  /**
   * Address Line 2
   *
   * Optional field.
   */

  /**
   * City
   */
  if (
    !payload.city ||
    !String(
      payload.city
    ).trim()
  ) {
    errors.city =
      "City is required.";
  }

  /**
   * Pincode
   */
  const pincode = String(
    payload.pincode ?? ""
  ).trim();

  if (!pincode) {
    errors.pincode =
      "Pincode is required.";
  } else if (
    !/^[0-9]{6}$/.test(pincode)
  ) {
    errors.pincode =
      "Enter a valid 6 digit pincode.";
  }

  /**
   * State
   */
  if (
    !payload.state ||
    !String(
      payload.state
    ).trim()
  ) {
    errors.state =
      "State is required.";
  }

  /**
   * Country
   */
  if (
    !payload.country ||
    !String(
      payload.country
    ).trim()
  ) {
    errors.country =
      "Country is required.";
  }

  /**
   * Username
   */
  const username = String(
    payload.username ?? ""
  ).trim();

  if (!username) {
    errors.username =
      "Username is required.";
  } else if (
    username.length < 3
  ) {
    errors.username =
      "Username must contain at least 3 characters.";
  }

  /**
   * Password
   */
  const password = String(
    payload.password ?? ""
  );

  if (!password) {
    errors.password =
      "Password is required.";
  } else if (
    password.length < 6
  ) {
    errors.password =
      "Password must contain at least 6 characters.";
  }

  /**
   * Throw validation error
   * when one or more fields
   * are invalid.
   */
  if (
    Object.keys(errors).length > 0
  ) {
    const error =
      new Error(
        "Registration validation failed."
      ) as RegisterValidationError;

    error.details = {
      errors,
    };

    throw error;
  }

  return true;
}