/**
 * @file profile.service.ts
 * @description Business logic for the current-user profile module.
 */

import bcrypt from 'bcryptjs';
import { AppError } from '../../utils/AppError.js';
import type { PasswordChangePayload, ProfileResponse, ProfileUpdatePayload } from './profile.types.js';
import {
  getOrgUserPasswordHashRepo,
  getOrgUserProfileRepo,
  getSuperUserProfileRepo,
  updateOrgUserPasswordRepo,
  updateOrgUserProfileRepo,
  updateSuperUserProfileRepo,
} from './profile.repository.js';

export async function getProfile(userId: string, userType: 'super' | 'org'): Promise<ProfileResponse | null> {
  if (userType === 'super') return getSuperUserProfileRepo(userId);
  return getOrgUserProfileRepo(userId);
}

export async function updateProfile(
  userId: string,
  userType: 'super' | 'org',
  payload: ProfileUpdatePayload
): Promise<ProfileResponse | null> {
  const fullName = payload.full_name ? String(payload.full_name).trim() : null;
  const profilePicture = payload.profile_picture ?? null;

  if (userType === 'super') {
    await updateSuperUserProfileRepo(userId, fullName, profilePicture);
    return getSuperUserProfileRepo(userId);
  }

  const email = payload.email ? String(payload.email).trim().toLowerCase() : null;
  const mobileNo = payload.mobile_no ? String(payload.mobile_no).trim() : null;

  await updateOrgUserProfileRepo(userId, fullName, email, mobileNo, profilePicture);
  return getOrgUserProfileRepo(userId);
}

export async function changePassword(
  userId: string,
  userType: 'super' | 'org',
  payload: PasswordChangePayload
): Promise<void> {
  if (userType === 'super') {
    throw new AppError('Super user password cannot be changed from the application', 403);
  }

  const oldPassword = String(payload.old_password ?? '');
  const newPassword = String(payload.new_password ?? '');

  if (!newPassword || newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters', 400);
  }

  const currentHash = await getOrgUserPasswordHashRepo(userId);

  if (!currentHash) {
    throw new AppError('User not found', 404);
  }

  const valid = await bcrypt.compare(oldPassword, currentHash);

  if (!valid) {
    throw new AppError('Current password is incorrect', 400);
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await updateOrgUserPasswordRepo(userId, newHash);
}
