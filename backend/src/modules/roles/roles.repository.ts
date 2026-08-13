/**
 * @file roles.repository.ts
 * @description Repository for the Roles Master module.
 */

import { pool } from '../../config/db.js';
import type { Role, RoleCreateDTO, RoleUpdateDTO } from './roles.types.js';

interface RoleRow {
  id: string;
  organization_id: string | null;
  role_name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function roleToDTO(row: RoleRow, permissions: string[]): Role {
  return { ...row, permissions };
}

export async function listRolesRepo(organizationId?: string | null): Promise<Role[]> {
  const params: string[] = [];
  let where = '';

  if (organizationId) {
    params.push(organizationId);
    where = `WHERE r.organization_id = $1 OR r.organization_id IS NULL`;
  }

  const { rows } = await pool.query(
    `
    SELECT r.id, r.organization_id, r.role_name, r.description, r.status, r.created_at, r.updated_at,
           COALESCE(array_agg(rp.permission_code) FILTER (WHERE rp.permission_code IS NOT NULL), '{}') AS permissions
    FROM roles r
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    ${where}
    GROUP BY r.id
    ORDER BY r.created_at DESC
    `,
    params
  );

  return rows.map((r) => ({ ...r, permissions: r.permissions }));
}

export async function getRoleByIdRepo(id: string): Promise<Role | null> {
  const { rows } = await pool.query(
    `
    SELECT r.id, r.organization_id, r.role_name, r.description, r.status, r.created_at, r.updated_at,
           COALESCE(array_agg(rp.permission_code) FILTER (WHERE rp.permission_code IS NOT NULL), '{}') AS permissions
    FROM roles r
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    WHERE r.id = $1
    GROUP BY r.id
    `,
    [id]
  );

  if (rows.length === 0) return null;

  return roleToDTO(rows[0], rows[0].permissions);
}

export async function createRoleRepo(payload: RoleCreateDTO): Promise<Role> {
  const { rows } = await pool.query(
    `
    INSERT INTO roles (organization_id, role_name, description, status)
    VALUES ($1, $2, $3, $4)
    RETURNING id, organization_id, role_name, description, status, created_at, updated_at
    `,
    [payload.organization_id ?? null, payload.role_name, payload.description ?? null, payload.status ?? 'ACTIVE']
  );

  return roleToDTO(rows[0], []);
}

export async function updateRoleRepo(id: string, payload: RoleUpdateDTO): Promise<Role | null> {
  const { rows } = await pool.query(
    `
    UPDATE roles
    SET role_name = $2, description = $3, status = $4, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, organization_id, role_name, description, status, created_at, updated_at
    `,
    [id, payload.role_name, payload.description ?? null, payload.status ?? 'ACTIVE']
  );

  if (rows.length === 0) return null;

  const current = await getRoleByIdRepo(id);
  return current ?? roleToDTO(rows[0], []);
}

export async function deleteRoleRepo(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM roles WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function setRolePermissionsRepo(id: string, permissionCodes: string[]): Promise<string[]> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [id]);

    for (const code of permissionCodes) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_code) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [id, code]
      );
    }

    await client.query('COMMIT');

    const { rows } = await client.query(
      `SELECT permission_code FROM role_permissions WHERE role_id = $1 ORDER BY permission_code`,
      [id]
    );

    return rows.map((r) => r.permission_code);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getRolePermissionsRepo(id: string): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT permission_code FROM role_permissions WHERE role_id = $1 ORDER BY permission_code`,
    [id]
  );
  return rows.map((r) => r.permission_code);
}
