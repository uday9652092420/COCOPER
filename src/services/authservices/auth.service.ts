/**
 * @file auth.service.ts
 * @description API service for application authentication (login).
 */

import { API } from "../../config/api";

export interface AuthUserResponse {
  id: string;
  username: string;
  fullName: string | null;
  role: string;
  isSuperAdmin: boolean;
  organizationId: string | null;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user: AuthUserResponse;
}

interface LoginRawResponse {
  success: boolean;
  message?: string;
  user: {
    id: string;
    username: string;
    full_name: string | null;
    role: string;
    is_super_admin: boolean;
    organization_id: string | null;
  };
}

/**
 * POST /api/auth/login
 *
 * Authenticates an application super user or an organization user.
 */
export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = (await response.json()) as LoginRawResponse;

  if (!response.ok) {
    throw data;
  }

  return {
    success: data.success,
    message: data.message,
    user: {
      id: data.user.id,
      username: data.user.username,
      fullName: data.user.full_name,
      role: data.user.role,
      isSuperAdmin: data.user.is_super_admin,
      organizationId: data.user.organization_id,
    },
  };
}
