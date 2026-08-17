/**
 * @file branches.repository.ts
 * @description Repository for the User Branches module.
 */

import { pool } from '../../config/db.js';
import type { Branch, BranchCreateDTO, BranchUpdateDTO } from './branches.types.js';

const SELECT = `
  SELECT id, organization_id, branch_code, branch_name, address, contact_no, status, created_at, updated_at
  FROM branches
`;

export async function listBranchesRepo(organizationId?: string | null): Promise<Branch[]> {
  const params: string[] = [];
  let where = '';

  if (organizationId) {
    params.push(organizationId);
    where = `WHERE organization_id = $1 OR organization_id IS NULL`;
  }

  const { rows } = await pool.query(
    `${SELECT} ${where} ORDER BY created_at DESC`,
    params
  );
  return rows;
}

export async function getBranchByIdRepo(id: string): Promise<Branch | null> {
  const { rows } = await pool.query(`${SELECT} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/**
 * Derives the branch-code prefix for an organization:
 * first letter of the organization name + "B".
 *
 * Example: "Maiprosoft" -> "MB"
 */
async function getBranchPrefix(organizationId?: string | null): Promise<string> {
  if (!organizationId) {
    return 'BR';
  }

  const { rows } = await pool.query(
    `
    SELECT COALESCE(
      NULLIF(TRIM(organization_name), ''),
      NULLIF(TRIM(organization_code), '')
    ) AS org_label
    FROM organizations
    WHERE id = $1
    `,
    [organizationId]
  );

  const label = String(rows[0]?.org_label ?? '').trim();
  const firstLetter = label.match(/[A-Za-z]/)?.[0];

  return `${(firstLetter ?? 'B').toUpperCase()}B`;
}

export async function getNextBranchCodeRepo(organizationId?: string | null): Promise<string> {
  const prefix = await getBranchPrefix(organizationId);

  // The next sequence number is based on the total number of branches
  // within the selected organization (not across the whole application).
  const countParams: string[] = [];
  let countWhere = '';

  if (organizationId) {
    countParams.push(organizationId);
    countWhere = `WHERE organization_id = $1`;
  }

  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM branches ${countWhere}`,
    countParams
  );

  const total = rows[0]?.total ?? 0;

  return `${prefix}-${String(total + 1).padStart(2, '0')}`;
}

export async function createBranchRepo(payload: BranchCreateDTO): Promise<Branch> {
  const { rows } = await pool.query(
    `
    INSERT INTO branches (organization_id, branch_code, branch_name, address, contact_no, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, organization_id, branch_code, branch_name, address, contact_no, status, created_at, updated_at
    `,
    [
      payload.organization_id ?? null,
      payload.branch_code ?? null,
      payload.branch_name,
      payload.address ?? null,
      payload.contact_no ?? null,
      payload.status ?? 'ACTIVE',
    ]
  );
  return rows[0];
}

export async function updateBranchRepo(id: string, payload: BranchUpdateDTO): Promise<Branch | null> {
  const { rows } = await pool.query(
    `
    UPDATE branches
    SET branch_code = $2, branch_name = $3, address = $4, contact_no = $5, status = $6, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, organization_id, branch_code, branch_name, address, contact_no, status, created_at, updated_at
    `,
    [id, payload.branch_code ?? null, payload.branch_name, payload.address ?? null, payload.contact_no ?? null, payload.status ?? 'ACTIVE']
  );
  return rows[0] ?? null;
}

export async function deleteBranchRepo(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM branches WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getUserBranchesRepo(userId: string): Promise<{ branch_ids: string[]; default_branch_id: string | null }> {
  const { rows } = await pool.query(
    `SELECT branch_id, is_default FROM user_branches WHERE user_id = $1`,
    [userId]
  );

  return {
    branch_ids: rows.map((r) => r.branch_id),
    default_branch_id: rows.find((r) => r.is_default)?.branch_id ?? null,
  };
}

export async function setUserBranchesRepo(
  userId: string,
  branchIds: string[],
  defaultBranchId: string | null
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM user_branches WHERE user_id = $1`, [userId]);

    for (const branchId of branchIds) {
      await client.query(
        `
        INSERT INTO user_branches (user_id, branch_id, is_default)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, branch_id)
        DO UPDATE SET
          is_default = EXCLUDED.is_default,
          updated_at = CURRENT_TIMESTAMP
        `,
        [userId, branchId, branchId === defaultBranchId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
