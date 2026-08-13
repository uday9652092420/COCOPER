/**
 * @file profile.controller.ts
 * @description Controller for the current-user profile module.
 */

import type { NextFunction, Request, Response } from 'express';
import {
  changePassword as changePasswordService,
  getProfile as getProfileService,
  updateProfile as updateProfileService,
} from './profile.service.js';
import { AppError } from '../../utils/AppError.js';

function resolveIdentity(req: Request): { userId: string; userType: 'super' | 'org' } {
  const userId = String(req.header('x-user-id') ?? '');
  const userType = req.header('x-user-type') === 'super' ? 'super' : 'org';

  if (!userId) {
    throw new AppError('User identity is required', 400);
  }

  return { userId, userType };
}

export async function getProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId, userType } = resolveIdentity(req);
    const profile = await getProfileService(userId, userType);

    if (!profile) return next(new AppError('Profile not found', 404));

    return res.status(200).json(profile);
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError('Failed to load profile', 500, { cause: error }));
  }
}

export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId, userType } = resolveIdentity(req);
    const profile = await updateProfileService(userId, userType, req.body);

    if (!profile) return next(new AppError('Profile not found', 404));

    return res.status(200).json(profile);
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError('Failed to update profile', 500, { cause: error }));
  }
}

export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId, userType } = resolveIdentity(req);
    await changePasswordService(userId, userType, req.body);

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError('Failed to change password', 500, { cause: error }));
  }
}
