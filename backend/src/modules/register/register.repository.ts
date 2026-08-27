/**
 * @file register.repository.ts
 * @description Repository for COCOPER ERP organization registration.
 */

import { randomUUID } from "crypto";

import { pool } from "../../config/db.js";

import type {
  RegisterOrganizationPayload,
} from "./register.types.js";
import { getAllPermissionCodes } from "../users/permissions.js";

/**
 * Generate next organization code.
 *
 * Examples:
 * ORG-001
 * ORG-002
 * ORG-003
 */
export async function getNextOrganizationCode(
  client: any
): Promise<string> {
  const result = await client.query(`
    SELECT organization_code
    FROM organizations
    WHERE organization_code LIKE 'ORG-%'
    ORDER BY
      CAST(
        SUBSTRING(
          organization_code
          FROM 5
        ) AS INTEGER
      ) DESC
    LIMIT 1
  `);

  if (!result.rows.length) {
    return "ORG-001";
  }

  const lastCode = String(
    result.rows[0].organization_code
  );

  const match = lastCode.match(/(\d+)$/);

  const lastNumber = match
    ? Number(match[1])
    : 0;

  return `ORG-${String(
    lastNumber + 1
  ).padStart(3, "0")}`;
}

/**
 * Check whether username already exists.
 */
export async function isUsernameExists(
  client: any,
  username: string
): Promise<boolean> {
  const result = await client.query(
    `
      SELECT id
      FROM organization_users
      WHERE LOWER(username) = LOWER($1)
      LIMIT 1
    `,
    [username]
  );

  return result.rows.length > 0;
}

/**
 * Check organization email.
 */
export async function isOrganizationEmailExists(
  client: any,
  email: string
): Promise<boolean> {
  const result = await client.query(
    `
      SELECT id
      FROM organizations
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  return result.rows.length > 0;
}

/**
 * Check organization name.
 */
export async function isOrganizationNameExists(
  client: any,
  organizationName: string
): Promise<boolean> {
  const result = await client.query(
    `
      SELECT id
      FROM organizations
      WHERE LOWER(organization_name) = LOWER($1)
      LIMIT 1
    `,
    [organizationName]
  );

  return result.rows.length > 0;
}

/**
 * Create organization + initial owner user.
 *
 * Important:
 * - Organization status must be Active.
 * - Initial user role must be OWNER.
 * - User status must be Active.
 * - user_id is NOT NULL in organization_users.
 * - is_primary_user defaults to true but is explicitly supplied.
 */
export async function createOrganizationRepository(
  payload: RegisterOrganizationPayload,
  passwordHash: string
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /**
     * IDs.
     */
    const organizationId = randomUUID();

    const userId = randomUUID();

    const organizationUserId = randomUUID();

    const ownerRoleId = randomUUID();

    /**
     * Generate organization code.
     */
    const organizationCode =
      await getNextOrganizationCode(client);

    /**
     * Create organization.
     *
     * Actual database columns:
     *
     * organization_code
     * organization_name
     * registration_no
     * contact_no
     * email
     * status
     * is_profile_completed
     * contact_person_name
     * address_line1
     * address_line2
     * city
     * pincode
     * state
     * country
     */
    const organizationResult =
      await client.query(
        `
          INSERT INTO organizations (
            id,
            organization_code,
            organization_name,
            registration_no,
            contact_no,
            email,
            status,
            is_profile_completed,
            created_at,
            updated_at,
            contact_person_name,
            address_line1,
            address_line2,
            street,
            city,
            pincode,
            state,
            country
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            'Active',
            false,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14
          )
          RETURNING
            id,
            organization_code,
            organization_name,
            registration_no,
            owner_name,
            contact_no,
            email,
            address,
            status,
            is_profile_completed,
            created_at,
            updated_at,
            contact_person_name,
            address_line1,
            address_line2,
            street,
            city,
            pincode,
            state,
            country
        `,
        [
          organizationId,

          organizationCode,

          payload.organization_name,

          payload.registration_no ?? null,

          payload.contact_no,

          payload.email,

          payload.contact_person_name,

          payload.address_line1,

          payload.address_line2 ?? null,

          payload.street,

          payload.city,

          payload.pincode,

          payload.state,

          payload.country,
        ]
      );

    await client.query(
      `
        INSERT INTO roles (
          id,
          organization_id,
          role_name,
          description,
          status,
          is_system_role,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          'OWNER',
          'Organization owner with full access',
          'ACTIVE',
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `,
      [ownerRoleId, organizationId]
    );

    const permissionCodes = getAllPermissionCodes();

    await client.query(
      `
        INSERT INTO role_permissions (role_id, permission_code)
        SELECT $1, unnest($2::text[])
        ON CONFLICT (role_id, permission_code) DO NOTHING
      `,
      [ownerRoleId, permissionCodes]
    );

    /**
     * Create initial organization owner.
     *
     * Actual database columns:
     *
     * id
     * organization_id
     * user_id
     * username
     * password_hash
     * full_name
     * role
     * status
     * is_primary_user
     */
    const userResult =
      await client.query(
        `
          INSERT INTO organization_users (
            id,
            organization_id,
            user_id,
            username,
            password_hash,
            full_name,
            email,
            role,
            status,
            is_primary_user,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            'OWNER',
            'Active',
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
          RETURNING
            id,
            user_id,
            username,
            full_name,
            role,
            status,
            is_primary_user
        `,
        [
          organizationUserId,

          organizationId,

          userId,

          payload.username,

          passwordHash,

          payload.contact_person_name,

          payload.email,
        ]
      );

    await client.query(
      `
        INSERT INTO user_permissions (user_id, permission_code)
        SELECT $1, unnest($2::text[])
        ON CONFLICT (user_id, permission_code) DO NOTHING
      `,
      [organizationUserId, permissionCodes]
    );

    /**
     * Commit transaction.
     */
    await client.query("COMMIT");

    return {
      organization:
        organizationResult.rows[0],

      user:
        userResult.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}