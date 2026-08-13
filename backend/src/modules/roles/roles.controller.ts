/**
 * @file roles.controller.ts
 * @description Controller for the Roles Master module.
 */

import type { NextFunction, Request, Response } from 'express';
import {
  createRole as createRoleService,
  deleteRole as deleteRoleService,
  getRoleById as getRoleByIdService,
  getRolePermissions as getRolePermissionsService,
  listRoles as listRolesService,
  setRolePermissions as setRolePermissionsService,
  updateRole as updateRoleService,
} from './roles.service.js';
import { AVAILABLE_PERMISSIONS } from './permissions.js';
import { validateRolePayload } from './roles.validation.js';
import { AppError } from '../../utils/AppError.js';

interface RoleParams {
  id: string;
}

function resolveOrganizationId(req: Request): string | undefined {
  return (req.query.organizationId as string | undefined) || req.header('x-organization-id');
}

export async function listPermissionsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    return res.status(200).json(AVAILABLE_PERMISSIONS);
  } catch (error) {
    return next(new AppError('Failed to list permissions', 500, { cause: error }));
  }
}

export async function listRolesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listRolesService(resolveOrganizationId(req));
    return res.status(200).json(rows);
  } catch (error) {
    return next(new AppError('Failed to list roles', 500, { cause: error }));
  }
}

export async function getRoleHandler(
  req: Request<RoleParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const row = await getRoleByIdService(req.params.id);
    if (!row) return next(new AppError('Role not found', 404));
    return res.status(200).json(row);
  } catch (error) {
    return next(new AppError('Failed to retrieve role', 500, { cause: error }));
  }
}

export async function createRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errors = validateRolePayload(req.body);
  if (errors) return next(new AppError('Validation failed', 400, { errors }));

  try {
    const created = await createRoleService(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return next(new AppError('Failed to create role', 500, { cause: error }));
  }
}

export async function updateRoleHandler(
  req: Request<RoleParams>,
  res: Response,
  next: NextFunction
) {
  const errors = validateRolePayload(req.body);
  if (errors) return next(new AppError('Validation failed', 400, { errors }));

  try {
    const updated = await updateRoleService(req.params.id, req.body);
    if (!updated) return next(new AppError('Role not found', 404));
    return res.status(200).json(updated);
  } catch (error) {
    return next(new AppError('Failed to update role', 500, { cause: error }));
  }
}

export async function deleteRoleHandler(
  req: Request<RoleParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const deleted = await deleteRoleService(req.params.id);
    if (!deleted) return next(new AppError('Role not found', 404));
    return res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    return next(new AppError('Failed to delete role', 500, { cause: error }));
  }
}

export async function getRolePermissionsHandler(
  req: Request<RoleParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const codes = await getRolePermissionsService(req.params.id);
    return res.status(200).json(codes);
  } catch (error) {
    return next(new AppError('Failed to retrieve role permissions', 500, { cause: error }));
  }
}

export async function setRolePermissionsHandler(
  req: Request<RoleParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const codes = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
    const updated = await setRolePermissionsService(req.params.id, codes);
    return res.status(200).json(updated);
  } catch (error) {
    return next(new AppError('Failed to update role permissions', 500, { cause: error }));
  }
}
