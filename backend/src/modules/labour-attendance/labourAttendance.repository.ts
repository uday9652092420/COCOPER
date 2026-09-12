import { pool } from "../../config/db.js";
import type { LabourAttendancePayload } from "./labourAttendance.types.js";

const selectColumns = `
  id,
  labour_id,
  labour_name,
  type,
  TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date,
  shift,
  in_time,
  out_time,
  hours,
  morning_ot,
  evening_ot,
  ot_hours,
  ot_rate,
  loading_10_tons_amount,
  loading_20_tons_amount,
  total_ot_amount,
  organization_id,
  payment_group_id,
  payment_status,
  payment_created_at,
  created_at
`;

export async function listLabourAttendanceRepository(organizationId: string) {
  const { rows } = await pool.query(
    `SELECT ${selectColumns} FROM labour_attendance
     WHERE organization_id = $1
     ORDER BY attendance_date DESC, created_at DESC`,
    [organizationId]
  );
  return rows;
}

export async function createLabourAttendanceRepository(
  payload: LabourAttendancePayload,
  organizationId: string
) {
  const morningOt = Number(payload.morning_ot ?? 0);
  const eveningOt = Number(payload.evening_ot ?? 0);
  const otRate = Number(payload.ot_rate ?? 150);
  const loading10 = Number(payload.loading_10_tons_amount ?? 0);
  const loading20 = Number(payload.loading_20_tons_amount ?? 0);
  const otHours = morningOt + eveningOt;
  const total = otHours * otRate + loading10 + loading20;

  const { rows } = await pool.query(
    `INSERT INTO labour_attendance (
      id, labour_id, labour_name, type, attendance_date, shift,
      in_time, out_time, hours, morning_ot, evening_ot, ot_hours, ot_rate,
      loading_10_tons_amount, loading_20_tons_amount, total_ot_amount, organization_id
      , payment_group_id
    ) VALUES (
      gen_random_uuid()::text, $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) RETURNING ${selectColumns}`,
    [
      payload.labour_id ?? null,
      payload.labour_name,
      payload.type,
      payload.attendance_date,
      payload.shift,
      payload.in_time ?? "09:00",
      payload.out_time ?? "18:00",
      Number(payload.hours ?? 9),
      morningOt,
      eveningOt,
      otHours,
      otRate,
      loading10,
      loading20,
      total,
      organizationId,
      payload.payment_group_id ?? null,
    ]
  );
  return rows[0];
}

export async function updateLabourAttendanceRepository(
  id: string,
  payload: LabourAttendancePayload,
  organizationId: string
) {
  const morningOt = Number(payload.morning_ot ?? 0);
  const eveningOt = Number(payload.evening_ot ?? 0);
  const otRate = Number(payload.ot_rate ?? 150);
  const loading10 = Number(payload.loading_10_tons_amount ?? 0);
  const loading20 = Number(payload.loading_20_tons_amount ?? 0);
  const otHours = morningOt + eveningOt;
  const total = otHours * otRate + loading10 + loading20;

  const { rows } = await pool.query(
    `UPDATE labour_attendance SET
      labour_id = $1, labour_name = $2, type = $3, attendance_date = $4,
      shift = $5, in_time = $6, out_time = $7, hours = $8, morning_ot = $9,
      evening_ot = $10, ot_hours = $11, ot_rate = $12,
      loading_10_tons_amount = $13, loading_20_tons_amount = $14,
      total_ot_amount = $15
     WHERE id = $16 AND organization_id = $17
     RETURNING ${selectColumns}`,
    [
      payload.labour_id ?? null,
      payload.labour_name,
      payload.type,
      payload.attendance_date,
      payload.shift,
      payload.in_time ?? "09:00",
      payload.out_time ?? "18:00",
      Number(payload.hours ?? 9),
      morningOt,
      eveningOt,
      otHours,
      otRate,
      loading10,
      loading20,
      total,
      id,
      organizationId,
    ]
  );
  return rows[0] ?? null;
}

export async function updateLabourAttendanceGroupStatusRepository(groupId: string, organizationId: string, status: "Draft" | "Approved") {
  const { rows } = await pool.query(
    `UPDATE labour_attendance SET payment_status = $1
     WHERE payment_group_id = $2 AND organization_id = $3
     RETURNING ${selectColumns}`,
    [status, groupId, organizationId]
  );
  return rows;
}

export async function deleteLabourAttendanceGroupRepository(groupId: string, organizationId: string) {
  const result = await pool.query(
    `DELETE FROM labour_attendance
     WHERE organization_id = $2
       AND (payment_group_id = $1 OR (payment_group_id IS NULL AND id = $1))`,
    [groupId, organizationId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteLabourAttendanceRepository(id: string, organizationId: string) {
  const result = await pool.query(
    "DELETE FROM labour_attendance WHERE id = $1 AND organization_id = $2",
    [id, organizationId]
  );
  return (result.rowCount ?? 0) > 0;
}
