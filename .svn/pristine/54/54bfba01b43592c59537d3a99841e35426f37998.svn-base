/**
 * @file types.ts
 * @description Type definitions for labour API used by the mock implementation.
 */

/**
 * @interface Labour
 * @description Schema for a labour master record.
 */
export interface Labour {
  id: string
  labourName: string
  gender: 'Male' | 'Female'
  contactNumber?: string
  address?: string
  inTime?: string
  outTime?: string
  overtime_5_8: number
  overtime_6_8: number
  overtime_7_8: number
  overtime_7p_9p: number
  overtime_7p_10p: number
  loadingAmount: number
  status: 'Active' | 'Inactive'
  createdAt: string // YYYY-MM-DD
}

/**
 * @interface LabourCreatePayload
 * @description Payload to create a new labour record.
 */
export interface LabourCreatePayload {
  labourName: string
  gender?: 'Male' | 'Female'
  contactNumber?: string
  address?: string
  inTime?: string
  outTime?: string
  overtime_5_8?: number
  overtime_6_8?: number
  overtime_7_8?: number
  overtime_7p_9p?: number
  overtime_7p_10p?: number
  loadingAmount?: number
  status?: 'Active' | 'Inactive'
}

/**
 * @interface LabourUpdatePayload
 * @description Payload to update an existing labour record.
 */
export interface LabourUpdatePayload {
  labourName?: string
  gender?: 'Male' | 'Female'
  contactNumber?: string
  address?: string
  inTime?: string
  outTime?: string
  overtime_5_8?: number
  overtime_6_8?: number
  overtime_7_8?: number
  overtime_7p_9p?: number
  overtime_7p_10p?: number
  loadingAmount?: number
  status?: 'Active' | 'Inactive'
}