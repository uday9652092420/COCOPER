/**
 * @file register.service.ts
 * @description Business logic for organization registration.
 */

import * as bcrypt from "bcryptjs";

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
   * Validate input.
   */
  validateRegisterPayload(payload);

  /**
   * Normalize values.
   */
  const organizationName =
    String(payload.organization_name).trim();

  const email =
    String(payload.email)
      .trim()
      .toLowerCase();

  const username =
    String(payload.username).trim();

  const contactPersonName =
    String(payload.contact_person_name).trim();

  const contactNo =
    String(payload.contact_no).trim();

  /**
   * Get database pool.
   */
  const { pool } =
    await import("../../config/db.js");

  const client =
    await pool.connect();

  try {
    /**
     * Check duplicate organization name.
     */
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

    /**
     * Check duplicate organization email.
     */
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

    /**
     * Check duplicate username.
     */
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
  const normalizedPayload: RegisterOrganizationPayload = {
    ...payload,

    organization_name:
      organizationName,

    contact_person_name:
      contactPersonName,

    contact_no:
      contactNo,

    email,

    username,

    registration_no:
      payload.registration_no
        ? String(
            payload.registration_no
          ).trim()
        : null,

    address_line1:
      String(
        payload.address_line1
      ).trim(),

    address_line2:
      payload.address_line2
        ? String(
            payload.address_line2
          ).trim()
        : null,

    city:
      String(payload.city).trim(),

    pincode:
      String(payload.pincode).trim(),

    state:
      String(payload.state).trim(),

    country:
      String(payload.country).trim(),
  };

  /**
   * Create organization
   * and initial administrator.
   */
  return createOrganizationRepository(
    normalizedPayload,
    passwordHash
  );
}