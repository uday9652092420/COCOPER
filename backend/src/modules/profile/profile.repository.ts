/**
 * @file profile.repository.ts
 * @description Repository for the current-user profile module.
 */

import { pool } from '../../config/db.js';
import type { ProfileResponse } from './profile.types.js';

export async function getSuperUserProfileRepo(id: string): Promise<ProfileResponse | null> {
  const { rows } = await pool.query(
    `SELECT id, username, full_name, role, profile_picture, 'super' AS user_type, NULL::uuid AS organization_id, NULL::varchar AS email, NULL::varchar AS mobile_no FROM app_users WHERE id = $1`,
    [id]
  );
  if (rows.length === 0) return null;
  return { ...rows[0], user_type: 'super' };
}

export async function getOrgUserProfileRepo(id: string): Promise<ProfileResponse | null> {
  const { rows } = await pool.query(
    `
    SELECT
      ou.id,
      ou.username,
      ou.full_name,
      ou.role,
      ou.organization_id,
      ou.email,
      ou.mobile_no,
      ou.profile_picture
    FROM organization_users ou
    WHERE ou.id = $1
    `,
    [id]
  );
  if (rows.length === 0) return null;
  return { ...rows[0], user_type: 'org' };
}

export async function updateSuperUserProfileRepo(
  id: string,
  fullName: string | null,
  profilePicture: string | null
): Promise<void> {
  await pool.query(
    `UPDATE app_users SET full_name = $2, profile_picture = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [id, fullName, profilePicture]
  );
}

export async function updateOrgUserProfileRepo(
  id: string,
  fullName: string | null,
  email: string | null,
  mobileNo: string | null,
  profilePicture: string | null
): Promise<void> {
  await pool.query(
    `UPDATE organization_users SET full_name = $2, email = $3, mobile_no = $4, profile_picture = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [id, fullName, email, mobileNo, profilePicture]
  );
}

export async function getOrgUserPasswordHashRepo(id: string): Promise<string | null> {
  const { rows } = await pool.query(
    `SELECT password_hash FROM organization_users WHERE id = $1`,
    [id]
  );
  return rows[0]?.password_hash ?? null;
}

export async function updateOrgUserPasswordRepo(id: string, passwordHash: string): Promise<void> {
  await pool.query(
    `UPDATE organization_users SET password_hash = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [id, passwordHash]
  );
}
