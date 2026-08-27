/**
 * @file users.service.ts
 * @description Business logic for the User Master module.
 */

import bcrypt from 'bcryptjs';
import { AppError } from '../../utils/AppError.js';
import type { OrgUser, UserCreateDTO, UserUpdateDTO } from './users.types.js';
import {
  createUserRepo,
  deleteUserRepo,
  getUserByIdRepo,
  getUserPermissionsRepo,
  isUsernameExistsRepo,
  isEmailExistsRepo,
  listUsersRepo,
  setUserPermissionsRepo,
  updateUserRepo,
  assignAllPermissionsRepo,
} from './users.repository.js';

export async function listUsers(organizationId?: string | null): Promise<OrgUser[]> {
  return listUsersRepo(organizationId ?? null);
}

export async function getUserById(id: string): Promise<OrgUser | null> {
  return getUserByIdRepo(id);
}

export async function createUser(payload: UserCreateDTO): Promise<OrgUser> {
  const username = String(payload.username).trim();
  const email = String(payload.email ?? '').trim().toLowerCase();
  const password = String(payload.password ?? '');

  if (!username) throw new AppError('Username is required', 400);
  if (!email) throw new AppError('Email is required', 400);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new AppError('Enter a valid email address', 400);
  if (!password || password.length < 6) throw new AppError('Password must be at least 6 characters', 400);

  if (await isUsernameExistsRepo(username)) {
    throw new AppError('Username already exists', 409);
  }
  if (await isEmailExistsRepo(email)) {
    throw new AppError('Email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const created = await createUserRepo(
    {
      organization_id: payload.organization_id,
      username,
      password,
      full_name: payload.full_name ? String(payload.full_name).trim() : null,
      email,
      mobile_no: payload.mobile_no ? String(payload.mobile_no).trim() : null,
      role: payload.role ? String(payload.role).trim() : 'STAFF',
      branch_id: payload.branch_id ?? null,
      status: payload.status ?? 'ACTIVE',
    },
    passwordHash
  );

  // New users start with all permissions by default.
  await assignAllPermissionsRepo(created.id);

  return created;
}

export async function updateUser(id: string, payload: UserUpdateDTO): Promise<OrgUser | null> {
  let passwordHash: string | undefined;
  const email = String(payload.email ?? '').trim().toLowerCase();

  if (!email) throw new AppError('Email is required', 400);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new AppError('Enter a valid email address', 400);
  if (await isEmailExistsRepo(email, id)) {
    throw new AppError('Email already exists', 409);
  }

  if (payload.password) {
    if (String(payload.password).length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }
    passwordHash = await bcrypt.hash(String(payload.password), 12);
  }

  return updateUserRepo(
    id,
    {
      full_name: payload.full_name ? String(payload.full_name).trim() : null,
      email,
      mobile_no: payload.mobile_no ? String(payload.mobile_no).trim() : null,
      role: payload.role ? String(payload.role).trim() : 'STAFF',
      branch_id: payload.branch_id ?? null,
      status: payload.status ?? 'ACTIVE',
    },
    passwordHash
  );
}

export async function deleteUser(id: string): Promise<boolean> {
  return deleteUserRepo(id);
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  return getUserPermissionsRepo(userId);
}

export async function setUserPermissions(userId: string, permissionCodes: string[]): Promise<string[]> {
  const unique = Array.from(new Set(permissionCodes.map((c) => String(c).trim()).filter(Boolean)));
  return setUserPermissionsRepo(userId, unique);
}
