/**
 * @file roles.types.ts
 * @description Types for the Roles Master module.
 */

export interface Role {
  id: string;
  organization_id: string | null;
  role_name: string;
  description: string | null;
  status: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  permissions: string[];
}

export interface RoleCreateDTO {
  organization_id?: string | null;
  role_name: string;
  description?: string | null;
  status?: string;
}

export interface RoleUpdateDTO {
  role_name: string;
  description?: string | null;
  status?: string;
}
