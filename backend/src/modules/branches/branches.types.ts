/**
 * @file branches.types.ts
 * @description Types for the User Branches module.
 */

export interface Branch {
  id: string;
  organization_id: string | null;
  branch_code: string | null;
  branch_name: string;
  address: string | null;
  contact_no: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BranchCreateDTO {
  organization_id?: string | null;
  branch_code?: string | null;
  branch_name: string;
  address?: string | null;
  contact_no?: string | null;
  status?: string;
}

export interface BranchUpdateDTO {
  branch_code?: string | null;
  branch_name: string;
  address?: string | null;
  contact_no?: string | null;
  status?: string;
}
