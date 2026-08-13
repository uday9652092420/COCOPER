/**
 * @file roles.validation.ts
 * @description Validation for Roles Master payloads.
 */

import type { RoleCreateDTO } from './roles.types.js';

export function validateRolePayload(payload: Partial<RoleCreateDTO>): Record<string, string> | null {
  const errors: Record<string, string> = {};

  if (!payload.role_name || String(payload.role_name).trim() === '') {
    errors.role_name = 'Role name is required';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
