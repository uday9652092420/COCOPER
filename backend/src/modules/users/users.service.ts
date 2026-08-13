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
  isUsernameExistsRepo,
  listUsersRepo,
  updateUserRepo,
} from './users.repository.js';

export async function listUsers(organizationId?: string | null): Promise<OrgUser[]> {
  return listUsersRepo(organizationId ?? null);
}

export async function getUserById(id: string): Promise<OrgUser | null> {
  return getUserByIdRepo(id);
}

export async function createUser(payload: UserCreateDTO): Promise<OrgUser> {
  const username = String(payload.username).trim();
  const password = String(payload.password ?? '');

  if (!username) throw new AppError('Username is required', 400);
  if (!password || password.length < 6) throw new AppError('Password must be at least 6 characters', 400);

  if (await isUsernameExistsRepo(username)) {
    throw new AppError('Username already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  return createUserRepo(
    {
      organization_id: payload.organization_id,
      username,
      password,
      full_name: payload.full_name ? String(payload.full_name).trim() : null,
      email: payload.email ? String(payload.email).trim().toLowerCase() : null,
      mobile_no: payload.mobile_no ? String(payload.mobile_no).trim() : null,
      role: payload.role ? String(payload.role).trim() : 'STAFF',
      branch_id: payload.branch_id ?? null,
      status: payload.status ?? 'ACTIVE',
    },
    passwordHash
  );
}

export async function updateUser(id: string, payload: UserUpdateDTO): Promise<OrgUser | null> {
  let passwordHash: string | undefined;

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
      email: payload.email ? String(payload.email).trim().toLowerCase() : null,
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
