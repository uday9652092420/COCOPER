/**
 * @file types.ts
 * @description Type definitions for labour attendance API (mock implementation).
 */

/**
 * @interface LabourAttendance
 * @description Represents a single labour attendance record.
 */
export interface LabourAttendance {
  id: string
  labourId: string
  attendanceDate: string // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Leave'
  inTime?: string
  outTime?: string
  hoursWorked: number
  overtimeHours: number
  remarks?: string
  createdAt: string // YYYY-MM-DD
}

/**
 * @interface LabourAttendanceCreatePayload
 * @description Payload used to create a new attendance record.
 */
export interface LabourAttendanceCreatePayload {
  labourId: string
  attendanceDate: string // YYYY-MM-DD
  status?: 'Present' | 'Absent' | 'Leave'
  inTime?: string
  outTime?: string
  hoursWorked?: number
  overtimeHours?: number
  remarks?: string
}

/**
 * @interface LabourAttendanceUpdatePayload
 * @description Payload used to update an existing attendance record.
 */
export interface LabourAttendanceUpdatePayload {
  id: string
  labourId?: string
  attendanceDate?: string // YYYY-MM-DD
  status?: 'Present' | 'Absent' | 'Leave'
  inTime?: string
  outTime?: string
  hoursWorked?: number
  overtimeHours?: number
  remarks?: string
}