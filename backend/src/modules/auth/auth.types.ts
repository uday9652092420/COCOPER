/**
 * @file auth.types.ts
 * @description Types for the application authentication module.
 */

export interface LoginPayload {
  email: string;
  password: string;
  /** Mobile clients must explicitly identify themselves for capability checks. */
  client?: 'web' | 'mobile';
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
