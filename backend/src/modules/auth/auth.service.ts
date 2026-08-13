/**
 * @file auth.service.ts
 * @description Business logic for application authentication.
 */

import bcrypt from 'bcryptjs';
import { AppError } from '../../utils/AppError.js';
import type { LoginPayload, LoginResult } from './auth.types.js';
import {
  findOrgUserByUsername,
  findSuperUserByUsername,
  toAuthUserResult,
  updateOrgUserLastLogin,
  updateSuperUserLastLogin,
} from './auth.repository.js';

export async function loginService(payload: LoginPayload): Promise<LoginResult> {
  const username = String(payload.username ?? '').trim();
  const password = String(payload.password ?? '');

  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  // 1) Check application-level super user (product owner).
  const superUser = await findSuperUserByUsername(username);

  if (superUser) {
    const valid = await bcrypt.compare(password, superUser.password_hash);

    if (valid) {
      await updateSuperUserLastLogin(superUser.id);

      return {
        user: toAuthUserResult(
          superUser.id,
          superUser.username,
          superUser.full_name,
          superUser.role,
          true,
          null
        ),
      };
    }

    throw new AppError('Invalid username or password', 401);
  }

  // 2) Check organization user.
  const orgUser = await findOrgUserByUsername(username);

  if (orgUser) {
    const valid = await bcrypt.compare(password, orgUser.password_hash);

    if (valid) {
      await updateOrgUserLastLogin(orgUser.id);

      return {
        user: toAuthUserResult(
          orgUser.id,
          orgUser.username,
          orgUser.full_name,
          orgUser.role,
          false,
          orgUser.organization_id
        ),
      };
    }
  }

  throw new AppError('Invalid username or password', 401);
}
