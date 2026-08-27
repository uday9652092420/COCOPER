/**
 * @file roles.service.ts
 * @description Business logic for the Roles Master module.
 */

import type { Role, RoleCreateDTO, RoleUpdateDTO } from './roles.types.js';
import {
  createRoleRepo,
  deleteRoleRepo,
  getRoleByIdRepo,
  getRolePermissionsRepo,
  listRolesRepo,
  setRolePermissionsRepo,
  updateRoleRepo,
} from './roles.repository.js';

export async function listRoles(organizationId?: string | null): Promise<Role[]> {
  return listRolesRepo(organizationId ?? null);
}

export async function getRoleById(id: string, organizationId?: string | null): Promise<Role | null> {
  return getRoleByIdRepo(id, organizationId);
}

export async function createRole(payload: RoleCreateDTO, organizationId: string): Promise<Role> {
  return createRoleRepo({
    organization_id: organizationId,
    role_name: String(payload.role_name).trim(),
    description: payload.description ?? null,
    status: payload.status ?? 'ACTIVE',
  });
}

export async function updateRole(id: string, payload: RoleUpdateDTO, organizationId?: string | null): Promise<Role | null> {
  return updateRoleRepo(id, {
    role_name: String(payload.role_name).trim(),
    description: payload.description ?? null,
    status: payload.status ?? 'ACTIVE',
  }, organizationId);
}

export async function deleteRole(id: string, organizationId?: string | null): Promise<boolean> {
  return deleteRoleRepo(id, organizationId);
}

export async function getRolePermissions(id: string): Promise<string[]> {
  return getRolePermissionsRepo(id);
}

export async function setRolePermissions(id: string, permissionCodes: string[]): Promise<string[]> {
  const unique = Array.from(new Set(permissionCodes.map((c) => String(c).trim()).filter(Boolean)));
  return setRolePermissionsRepo(id, unique);
}
