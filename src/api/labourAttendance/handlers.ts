/**
 * @file handlers.ts
 * @description High-level handlers wrapping dataStore operations for labour attendance.
 *
 * These functions are suitable to be used by frontend pages as a mock API.
 */

import type {
  LabourAttendanceCreatePayload,
  LabourAttendanceUpdatePayload,
  LabourAttendance,
} from './types'
import {
  listAttendances,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from './dataStore'

/**
 * @function list
 * @description List all labour attendance records.
 */
export const list = async (): Promise<LabourAttendance[]> => {
  return listAttendances()
}

/**
 * @function getById
 * @description Get a single attendance record by id.
 */
export const getById = async (id: string): Promise<LabourAttendance | undefined> => {
  return getAttendance(id)
}

/**
 * @function add
 * @description Create a new attendance record.
 */
export const add = async (payload: LabourAttendanceCreatePayload): Promise<LabourAttendance> => {
  if (!payload.labourId || !payload.attendanceDate) {
    throw new Error('labourId and attendanceDate are required')
  }
  return createAttendance(payload)
}

/**
 * @function edit
 * @description Update an existing attendance record.
 */
export const edit = async (id: string, payload: LabourAttendanceUpdatePayload): Promise<LabourAttendance> => {
  return updateAttendance(id, payload)
}

/**
 * @function remove
 * @description Delete an attendance record by id.
 */
export const remove = async (id: string): Promise<void> => {
  return deleteAttendance(id)
}