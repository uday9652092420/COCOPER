import { pool } from '../../config/db.js';
import type { MobileBootstrapBranch } from './mobile.types.js';

interface MobileBootstrapRow {
  user_id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  role: string;
  organization_id: string;
  organization_name: string;
  branch_id: string | null;
  branch_code: string | null;
  branch_name: string | null;
  branch_status: string | null;
  is_default: boolean | null;
}

export interface MobileBootstrapData {
  user: {
    id: string;
    username: string;
    full_name: string | null;
    email: string | null;
    role: string;
  };
  organization: {
    id: string;
    organization_name: string;
  };
  branches: MobileBootstrapBranch[];
  default_branch_id: string | null;
}

export async function getMobileBootstrapRepo(userId: string): Promise<MobileBootstrapData | null> {
  const { rows } = await pool.query<MobileBootstrapRow>(
    `
    SELECT
      ou.id AS user_id,
      ou.username,
      ou.full_name,
      ou.email,
      ou.role,
      o.id AS organization_id,
      o.organization_name,
      b.id AS branch_id,
      b.branch_code,
      b.branch_name,
      b.status AS branch_status,
      ub.is_default
    FROM organization_users ou
    INNER JOIN organizations o
      ON o.id = ou.organization_id
    LEFT JOIN user_branches ub
      ON ub.user_id = ou.id
    LEFT JOIN branches b
      ON b.id = ub.branch_id
      AND b.organization_id = ou.organization_id
      AND b.status = 'ACTIVE'
    WHERE ou.id = $1
      AND LOWER(ou.status) = 'active'
    ORDER BY ub.is_default DESC NULLS LAST, b.branch_name ASC
    `,
    [userId]
  );

  if (rows.length === 0) return null;

  const first = rows[0];
  const branches = rows
    .filter((row) => row.branch_id !== null)
    .map((row) => ({
      id: row.branch_id as string,
      branch_code: row.branch_code,
      branch_name: row.branch_name as string,
      status: row.branch_status as string,
      is_default: row.is_default === true,
    }));

  return {
    user: {
      id: first.user_id,
      username: first.username,
      full_name: first.full_name,
      email: first.email,
      role: first.role,
    },
    organization: {
      id: first.organization_id,
      organization_name: first.organization_name,
    },
    branches,
    default_branch_id: branches.find((branch) => branch.is_default)?.id ?? null,
  };
}