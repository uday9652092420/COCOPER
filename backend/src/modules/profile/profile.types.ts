/**
 * @file profile.types.ts
 * @description Types for the current-user profile module.
 */

export interface ProfileResponse {
  user_type: 'super' | 'org';
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  mobile_no: string | null;
  role: string | null;
  organization_id: string | null;
  profile_picture: string | null;
}

export interface ProfileUpdatePayload {
  full_name?: string | null;
  email?: string | null;
  mobile_no?: string | null;
  profile_picture?: string | null;
}

export interface PasswordChangePayload {
  old_password: string;
  new_password: string;
}
