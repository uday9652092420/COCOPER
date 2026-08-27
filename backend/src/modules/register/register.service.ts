/**
 * @file register.service.ts
 * @description Business logic for COCOPER ERP organization registration.
 */

import bcrypt from "bcryptjs";

import type {
  RegisterOrganizationPayload,
} from "./register.types.js";

import {
  createOrganizationRepository,
  isOrganizationEmailExists,
  isOrganizationNameExists,
  isUsernameExists,
} from "./register.repository.js";

import {
  validateRegisterPayload,
} from "./register.validation.js";

export async function registerOrganizationService(
  payload: RegisterOrganizationPayload
) {
  /**
   * Validate request.
   */
  validateRegisterPayload(payload);

  /**
   * Normalize important fields.
   */
  const organizationName =
    String(payload.organization_name).trim();

  const registrationNo =
    payload.registration_no
      ? String(payload.registration_no).trim()
      : null;

  const contactPersonName =
    String(
      payload.contact_person_name
    ).trim();

  const contactNo =
    String(payload.contact_no).trim();

  const email =
    String(payload.email)
      .trim()
      .toLowerCase();

  const addressLine1 =
    String(payload.address_line1).trim();

  const addressLine2 =
    payload.address_line2
      ? String(payload.address_line2).trim()
      : null;

  const street =
    String(payload.street).trim();

  const city =
    String(payload.city).trim();

  const pincode =
    String(payload.pincode).trim();

  const state =
    String(payload.state).trim();

  const country =
    String(payload.country).trim();

  const username =
    String(payload.username).trim();

  /**
   * Check duplicates.
   */
  const { pool } =
    await import("../../config/db.js");

  const client =
    await pool.connect();

  try {
    if (
      await isOrganizationNameExists(
        client,
        organizationName
      )
    ) {
      throw new Error(
        "Organization name already exists."
      );
    }

    if (
      await isOrganizationEmailExists(
        client,
        email
      )
    ) {
      throw new Error(
        "Organization email already exists."
      );
    }

    if (
      await isUsernameExists(
        client,
        username
      )
    ) {
      throw new Error(
        "Username already exists."
      );
    }
  } finally {
    client.release();
  }

  /**
   * Hash password.
   */
  const passwordHash =
    await bcrypt.hash(
      payload.password,
      12
    );

  /**
   * Build normalized payload.
   */
  const normalizedPayload: RegisterOrganizationPayload =
    {
      organization_name:
        organizationName,

      registration_no:
        registrationNo,

      contact_person_name:
        contactPersonName,

      contact_no:
        contactNo,

      email,

      address_line1:
        addressLine1,

      address_line2:
        addressLine2,

      street,

      city,

      pincode,

      state,

      country,

      username,

      password:
        payload.password,
    };

  /**
   * Create organization and owner
   * inside one database transaction.
   */
  return createOrganizationRepository(
    normalizedPayload,
    passwordHash
  );
}