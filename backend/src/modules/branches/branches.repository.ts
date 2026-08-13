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
