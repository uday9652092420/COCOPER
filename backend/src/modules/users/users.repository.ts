/**
 * @file users.repository.ts
 * @description Repository for the User Master module (organization users).
 */

import { pool } from '../../config/db.js';
import type { OrgUser, UserCreateDTO, UserUpdateDTO } from './users.types.js';

const SELECT = `
  SELECT
    ou.id,
    ou.organization_id,
    ou.username,
    ou.full_name,
    ou.email,
    ou.mobile_no,
    ou.role,
    ou.branch_id,
    b.branch_name,
    ou.status,
    ou.is_primary_user,
    ou.last_login_at,
    ou.created_at,
    ou.updated_at
  FROM organization_users ou
  LEFT JOIN branches b ON b.id = ou.branch_id
`;

export async function listUsersRepo(organizationId?: string | null): Promise<OrgUser[]> {
  const params: string[] = [];
  let where = '';

  if (organizationId) {
    params.push(organizationId);
    where = `WHERE ou.organization_id = $1`;
  }

  const { rows } = await pool.query(
    `${SELECT} ${where} ORDER BY ou.created_at DESC`,
    params
  );
  return rows;
}

export async function getUserByIdRepo(id: string): Promise<OrgUser | null> {
  const { rows } = await pool.query(`${SELECT} WHERE ou.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function isUsernameExistsRepo(username: string, excludeId?: string): Promise<boolean> {
  const params: string[] = [username.toLowerCase()];
  let sql = `SELECT id FROM organization_users WHERE LOWER(username) = $1`;
  if (excludeId) {
    params.push(excludeId);
    sql += ` AND id <> $2`;
  }
  sql += ` LIMIT 1`;

  const { rows } = await pool.query(sql, params);
  return rows.length > 0;
}

export async function createUserRepo(payload: UserCreateDTO, passwordHash: string): Promise<OrgUser> {
  const { rows } = await pool.query(
    `
    INSERT INTO organization_users (
      organization_id, username, password_hash, full_name, email, mobile_no, role, branch_id, status, is_primary_user
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)
    RETURNING id
    `,
    [
      payload.organization_id,
      payload.username,
      passwordHash,
      payload.full_name ?? null,
      payload.email ?? null,
      payload.mobile_no ?? null,
      payload.role ?? 'STAFF',
      payload.branch_id ?? null,
      payload.status ?? 'ACTIVE',
    ]
  );

  return getUserByIdRepo(rows[0].id) as Promise<OrgUser>;
}

export async function updateUserRepo(
  id: string,
  payload: UserUpdateDTO,
  passwordHash?: string
): Promise<OrgUser | null> {
  const values: unknown[] = [
    id,
    payload.full_name ?? null,
    payload.email ?? null,
    payload.mobile_no ?? null,
    payload.role ?? 'STAFF',
    payload.branch_id ?? null,
    payload.status ?? 'ACTIVE',
  ];

  let sql = `
    UPDATE organization_users
    SET
      full_name = $2,
      email = $3,
      mobile_no = $4,
      role = $5,
      branch_id = $6,
      status = $7,
      updated_at = CURRENT_TIMESTAMP
  `;

  if (passwordHash) {
    values.push(passwordHash);
    sql += `, password_hash = $8`;
  }

  sql += ` WHERE id = $1`;

  const result = await pool.query(sql, values);

  if ((result.rowCount ?? 0) === 0) return null;

  return getUserByIdRepo(id);
}

export async function deleteUserRepo(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM organization_users WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getUserPermissionsRepo(userId: string): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT permission_code FROM user_permissions WHERE user_id = $1 ORDER BY permission_code`,
    [userId]
  );
  return rows.map((r) => r.permission_code);
}

export async function setUserPermissionsRepo(userId: string, permissionCodes: string[]): Promise<string[]> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM user_permissions WHERE user_id = $1`, [userId]);

    for (const code of permissionCodes) {
      await client.query(
        `INSERT INTO user_permissions (user_id, permission_code) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, code]
      );
    }

    await client.query('COMMIT');

    const { rows } = await client.query(
      `SELECT permission_code FROM user_permissions WHERE user_id = $1 ORDER BY permission_code`,
      [userId]
    );

    return rows.map((r) => r.permission_code);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
