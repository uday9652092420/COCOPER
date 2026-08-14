/**
 * @file users.controller.ts
 * @description Controller for the User Master module.
 */

import type { NextFunction, Request, Response } from 'express';
import {
  createUser as createUserService,
  deleteUser as deleteUserService,
  getUserById as getUserByIdService,
  getUserPermissions as getUserPermissionsService,
  listUsers as listUsersService,
  setUserPermissions as setUserPermissionsService,
  updateUser as updateUserService,
} from './users.service.js';
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from './permissions.js';
import { AppError } from '../../utils/AppError.js';

interface UserParams {
  id: string;
}

function resolveOrganizationId(req: Request): string | undefined {
  return (req.query.organizationId as string | undefined) || req.header('x-organization-id');
}

export async function listUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listUsersService(resolveOrganizationId(req));
    return res.status(200).json(rows);
  } catch (error) {
    return next(new AppError('Failed to list users', 500, { cause: error }));
  }
}

export async function getUserHandler(
  req: Request<UserParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const row = await getUserByIdService(req.params.id);
    if (!row) return next(new AppError('User not found', 404));
    return res.status(200).json(row);
  } catch (error) {
    return next(new AppError('Failed to retrieve user', 500, { cause: error }));
  }
}

export async function createUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const created = await createUserService(req.body);
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError('Failed to create user', 500, { cause: error }));
  }
}

export async function updateUserHandler(
  req: Request<UserParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const updated = await updateUserService(req.params.id, req.body);
    if (!updated) return next(new AppError('User not found', 404));
    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError('Failed to update user', 500, { cause: error }));
  }
}

export async function deleteUserHandler(
  req: Request<UserParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const deleted = await deleteUserService(req.params.id);
    if (!deleted) return next(new AppError('User not found', 404));
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return next(new AppError('Failed to delete user', 500, { cause: error }));
  }
}

export async function getPermissionOptionsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    return res.status(200).json({
      modules: PERMISSION_MODULES,
      actions: PERMISSION_ACTIONS,
    });
  } catch (error) {
    return next(new AppError('Failed to load permission options', 500, { cause: error }));
  }
}

export async function getUserPermissionsHandler(
  req: Request<UserParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const codes = await getUserPermissionsService(req.params.id);
    return res.status(200).json(codes);
  } catch (error) {
    return next(new AppError('Failed to retrieve user permissions', 500, { cause: error }));
  }
}

export async function setUserPermissionsHandler(
  req: Request<UserParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const codes = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
    const updated = await setUserPermissionsService(req.params.id, codes);
    return res.status(200).json(updated);
  } catch (error) {
    return next(new AppError('Failed to update user permissions', 500, { cause: error }));
  }
}
