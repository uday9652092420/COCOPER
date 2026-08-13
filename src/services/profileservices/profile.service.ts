/**
 * @file profile.service.ts
 * @description API service for the current-user profile module.
 */

import { API } from "../../config/api";
import { getUserHeaders } from "../../utils/apiHeaders";

export interface Profile {
  user_type: "super" | "org";
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  mobile_no: string | null;
  role: string | null;
  organization_id: string | null;
  profile_picture: string | null;
}

export async function getProfile(userId: string, userType: "super" | "org"): Promise<Profile> {
  const response = await fetch(`${API}/profile/me`, {
    headers: getUserHeaders(userId, userType),
  });
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to load profile" }));
  return response.json();
}

export async function updateProfile(
  userId: string,
  userType: "super" | "org",
  payload: { full_name?: string | null; email?: string | null; mobile_no?: string | null; profile_picture?: string | null }
): Promise<Profile> {
  const response = await fetch(`${API}/profile/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getUserHeaders(userId, userType),
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}

export async function changePassword(
  userId: string,
  userType: "super" | "org",
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const response = await fetch(`${API}/profile/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getUserHeaders(userId, userType),
    },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
  const data = await response.json();
  if (!response.ok) throw data;
}
