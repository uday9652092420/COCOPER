/**
 * @file users.types.ts
 * @description Types for the User Master module (organization users).
 */

export interface OrgUser {
  id: string;
  organization_id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  mobile_no: string | null;
  role: string;
  branch_id: string | null;
  branch_name: string | null;
  status: string;
  is_primary_user: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreateDTO {
  organization_id: string;
  username: string;
  password: string;
  full_name?: string | null;
  email?: string | null;
  mobile_no?: string | null;
  role?: string | null;
  branch_id?: string | null;
  status?: string;
}

export interface UserUpdateDTO {
  full_name?: string | null;
  email?: string | null;
  mobile_no?: string | null;
  role?: string | null;
  branch_id?: string | null;
  status?: string;
  password?: string | null;
}
