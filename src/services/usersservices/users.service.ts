/**
 * @file users.service.ts
 * @description API service for the User Master module.
 */

import { API } from "../../config/api";
import { getOrgHeader } from "../../utils/apiHeaders";

export interface OrgUser {
  id: string;
  organization_id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  mobile_no: string | null;
  role: string;
  branch_id: string | null;
  branch_name: string | null;
  status: string;
  is_primary_user: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPayload {
  organization_id?: string;
  username?: string;
  password?: string;
  full_name?: string | null;
  email?: string | null;
  mobile_no?: string | null;
  role?: string | null;
  branch_id?: string | null;
  status?: string;
}

export async function getUsers(): Promise<OrgUser[]> {
  const response = await fetch(`${API}/users`, { headers: getOrgHeader() });
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to load users" }));
  return response.json();
}

export async function createUser(payload: UserPayload): Promise<OrgUser> {
  const response = await fetch(`${API}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}

export async function updateUser(id: string, payload: Partial<UserPayload>): Promise<OrgUser> {
  const response = await fetch(`${API}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`${API}/users/${id}`, { method: "DELETE" });
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to delete user" }));
}
