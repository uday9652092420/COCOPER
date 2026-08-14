/**
 * @file labourstaff.types.ts
 * @description Type definitions for Labour Staff module.
 */

/**
 * Labour Gender
 */
export type LabourGender = "Male" | "Female";

/**
 * Labour Status
 */
export type LabourStatus = "Active" | "Inactive";

/**
 * Labour Entity
 */
export interface LabourStaff {
  id: string;

  labour_name: string;
  gender: LabourGender;

  contact_number: string;
  address: string;

  in_time: string;
  out_time: string;

  overtime_5_8: number;
  overtime_6_8: number;
  overtime_7_8: number;
  overtime_7p_9p: number;
  overtime_7p_10p: number;

  loading_amount: number;

  status: LabourStatus;

  created_at: string;

  organization_id?: string | null;
}

/**
 * Create Labour Request
 */
export interface CreateLabourRequest {
  labour_name: string;

  gender: LabourGender;

  contact_number: string;
  address: string;

  in_time: string;
  out_time: string;

  overtime_5_8: number;
  overtime_6_8: number;
  overtime_7_8: number;
  overtime_7p_9p: number;
  overtime_7p_10p: number;

  loading_amount: number;

  status: LabourStatus;

  organization_id?: string | null;
}

/**
 * Update Labour Request
 */
export interface UpdateLabourRequest {
  labour_name?: string;

  gender?: LabourGender;

  contact_number?: string;
  address?: string;

  in_time?: string;
  out_time?: string;

  overtime_5_8?: number;
  overtime_6_8?: number;
  overtime_7_8?: number;
  overtime_7p_9p?: number;
  overtime_7p_10p?: number;

  loading_amount?: number;

  status?: LabourStatus;
}

/**
 * Labour List Response
 */
export interface LabourListResponse {
  success: boolean;
  message: string;
  data: LabourStaff[];
}

/**
 * Single Labour Response
 */
export interface LabourResponse {
  success: boolean;
  message: string;
  data: LabourStaff;
}

/**
 * Common API Response
 */
export interface ApiResponse {
  success: boolean;
  message: string;
}

/**
 * Next Labour Code Response
 */
export interface NextLabourCodeResponse {
  success: boolean;
  message: string;
  data: {
    code: string;
  };
}

export type CreateLabourStaffInput = CreateLabourRequest;

export type UpdateLabourStaffInput = UpdateLabourRequest;