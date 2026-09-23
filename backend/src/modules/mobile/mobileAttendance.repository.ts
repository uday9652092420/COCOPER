import { pool } from '../../config/db.js';
import type { MobileAttendanceBranchScope, MobileAttendanceRecord } from './mobileAttendance.types.js';

interface AttendanceRow extends Omit<MobileAttendanceRecord, 'total_working_hours'> {
  total_working_hours: string | number;
}

export async function resolveAssignedBranchRepo(
  userId: string,
  branchId: string
): Promise<MobileAttendanceBranchScope | null> {
  const { rows } = await pool.query<MobileAttendanceBranchScope>(
    `
    SELECT ou.organization_id, b.id AS branch_id
    FROM organization_users ou
    INNER JOIN user_branches ub ON ub.user_id = ou.id
    INNER JOIN branches b ON b.id = ub.branch_id
    WHERE ou.id = $1
      AND b.id = $2
      AND b.organization_id = ou.organization_id
      AND UPPER(b.status) = 'ACTIVE'
      AND LOWER(ou.status) = 'active'
    LIMIT 1
    `,
    [userId, branchId]
  );
  return rows[0] ?? null;
}

function mapAttendanceRow(row: AttendanceRow): MobileAttendanceRecord {
  return {
    ...row,
    total_working_hours: Number(row.total_working_hours),
    is_working: row.out_time === null,
  };
}

export async function createMobileAttendanceRepo(
  userId: string,
  organizationId: string,
  branchId: string,
  labourName: string
): Promise<MobileAttendanceRecord> {
  const { rows } = await pool.query<AttendanceRow>(
    `
    INSERT INTO mobile_labour_attendance
      (labour_name, user_id, organization_id, branch_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, labour_name, user_id, attendance_date, in_time, out_time,
      total_working_hours, organization_id, branch_id
    `,
    [labourName, userId, organizationId, branchId]
  );
  return mapAttendanceRow(rows[0]);
}

export async function checkoutMobileAttendanceRepo(
  userId: string,
  attendanceId: string
): Promise<MobileAttendanceRecord | null> {
  const { rows } = await pool.query<AttendanceRow>(
    `
    UPDATE mobile_labour_attendance
    SET
      out_time = CURRENT_TIMESTAMP,
      total_working_hours = ROUND((EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - in_time)) / 3600)::numeric, 2),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND user_id = $2
      AND out_time IS NULL
    RETURNING id, labour_name, user_id, attendance_date, in_time, out_time,
      total_working_hours, organization_id, branch_id
    `,
    [attendanceId, userId]
  );
  return rows[0] ? mapAttendanceRow(rows[0]) : null;
}

export async function listMobileAttendanceRepo(
  organizationId: string,
  branchId?: string
): Promise<MobileAttendanceRecord[]> {
  const params: string[] = [organizationId];
  const branchFilter = branchId ? 'AND branch_id = $2' : '';
  if (branchId) params.push(branchId);

  const { rows } = await pool.query<AttendanceRow>(
    `
    SELECT id, labour_name, user_id, attendance_date, in_time, out_time,
      total_working_hours, organization_id, branch_id
    FROM mobile_labour_attendance
    WHERE organization_id = $1 ${branchFilter}
    ORDER BY attendance_date DESC, in_time DESC
    `,
    params
  );
  return rows.map(mapAttendanceRow);
}