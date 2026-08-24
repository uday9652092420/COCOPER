/**
 * @file auth.types.ts
 * @description Types for the application authentication module.
 */

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthUserResult {
  id: string;
  username: string;
  full_name: string | null;
  role: string;
  is_super_admin: boolean;
  organization_id: string | null;
}

export interface LoginResult {
  user: AuthUserResult;
  token: string;
  tokenId: string;
  expiresAt: number;
}
