/**
 * @file labourstaff.repository.ts
 * @description Repository layer for Labour Staff Master.
 */

import { pool } from "../../config/db.js";

import type {
  LabourStaff,
  CreateLabourRequest,
  UpdateLabourRequest,
} from "./labourstaff.types.js";

/**
 * Get all labour staff
 */
export async function listLabourStaffRepository(organizationId?: string | null): Promise<LabourStaff[]> {
  const params: string[] = [];
  let where = "";

  if (organizationId) {
    params.push(organizationId);
    where = "WHERE organization_id = $1 OR organization_id IS NULL";
  }

  const { rows } = await pool.query(
    `
    SELECT
      id,
      labour_name,
      gender,
      contact_number,
      address,
      in_time,
      out_time,
      overtime_5_8,
      overtime_6_8,
      overtime_7_8,
      overtime_7p_9p,
      overtime_7p_10p,
      loading_amount,
      status,
      organization_id,
      created_at
    FROM labours
    ${where}
    ORDER BY created_at DESC, labour_name ASC
    `,
    params
  );

  return rows;
}

/**
 * Get labour by id
 */
export async function getLabourStaffRepository(
  id: string
): Promise<LabourStaff | null> {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      labour_name,
      gender,
      contact_number,
      address,
      in_time,
      out_time,
      overtime_5_8,
      overtime_6_8,
      overtime_7_8,
      overtime_7p_9p,
      overtime_7p_10p,
      loading_amount,
      status,
      organization_id,
      created_at
    FROM labours
    WHERE id = $1
    `,
    [id]
  );

  return rows[0] ?? null;
}

/**
 * Get labour by name
 */
export async function getLabourStaffByNameRepository(
  labourName: string
): Promise<LabourStaff | null> {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM labours
    WHERE LOWER(labour_name) = LOWER($1)
    `,
    [labourName]
  );

  return rows[0] ?? null;
}

/**
 * Create labour
 */
export async function createLabourStaffRepository(
  payload: CreateLabourRequest
): Promise<LabourStaff> {
  const { rows } = await pool.query(
    `
    INSERT INTO labours
    (
      id,
      labour_name,
      gender,
      contact_number,
      address,
      in_time,
      out_time,
      overtime_5_8,
      overtime_6_8,
      overtime_7_8,
      overtime_7p_9p,
      overtime_7p_10p,
      loading_amount,
      status,
      organization_id
    )
    VALUES
    (
      gen_random_uuid()::text,
      $1,$2,$3,$4,$5,$6,
      $7,$8,$9,$10,$11,
      $12,$13,$14
    )
    RETURNING *
    `,
    [
      payload.labour_name,
      payload.gender,
      payload.contact_number,
      payload.address,
      payload.in_time,
      payload.out_time,
      payload.overtime_5_8,
      payload.overtime_6_8,
      payload.overtime_7_8,
      payload.overtime_7p_9p,
      payload.overtime_7p_10p,
      payload.loading_amount,
      payload.status,
      payload.organization_id ?? null,
    ]
  );

  return rows[0];
}

/**
 * Update labour
 */
export async function updateLabourStaffRepository(
  id: string,
  payload: UpdateLabourRequest
): Promise<LabourStaff> {
  const { rows } = await pool.query(
    `
    UPDATE labours
    SET
      labour_name = $1,
      gender = $2,
      contact_number = $3,
      address = $4,
      in_time = $5,
      out_time = $6,
      overtime_5_8 = $7,
      overtime_6_8 = $8,
      overtime_7_8 = $9,
      overtime_7p_9p = $10,
      overtime_7p_10p = $11,
      loading_amount = $12,
      status = $13
    WHERE id = $14
    RETURNING *
    `,
    [
      payload.labour_name,
      payload.gender,
      payload.contact_number,
      payload.address,
      payload.in_time,
      payload.out_time,
      payload.overtime_5_8,
      payload.overtime_6_8,
      payload.overtime_7_8,
      payload.overtime_7p_9p,
      payload.overtime_7p_10p,
      payload.loading_amount,
      payload.status,
      id,
    ]
  );

  return rows[0];
}

/**
 * Delete labour
 */
export async function deleteLabourStaffRepository(
  id: string
): Promise<void> {
  await pool.query(
    `
    DELETE FROM labours
    WHERE id = $1
    `,
    [id]
  );
}