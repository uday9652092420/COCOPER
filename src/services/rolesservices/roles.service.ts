/**
 * @file roles.service.ts
 * @description API service for the Roles Master module.
 */

import { API } from "../../config/api";
import { getOrgHeader } from "../../utils/apiHeaders";

export interface Role {
  id: string;
  organization_id: string | null;
  role_name: string;
  description: string | null;
  status: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  permissions: string[];
}

export interface PermissionDef {
  module: string;
  code: string;
  name: string;
}

export interface RolePayload {
  organization_id?: string | null;
  role_name: string;
  description?: string | null;
  status?: string;
}

export async function getPermissions(): Promise<PermissionDef[]> {
  const response = await fetch(`${API}/roles/permissions`);
  if (!response.ok) throw new Error("Failed to load permissions");
  return response.json();
}

export async function getRoles(): Promise<Role[]> {
  const response = await fetch(`${API}/roles`, { headers: getOrgHeader() });
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to load roles" }));
  return response.json();
}

export async function createRole(payload: RolePayload): Promise<Role> {
  const response = await fetch(`${API}/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}

export async function updateRole(id: string, payload: Partial<RolePayload>): Promise<Role> {
  const response = await fetch(`${API}/roles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}

export async function deleteRole(id: string): Promise<void> {
  const response = await fetch(`${API}/roles/${id}`, { method: "DELETE", headers: getOrgHeader() });
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to delete role" }));
}

export async function getRolePermissions(id: string): Promise<string[]> {
  const response = await fetch(`${API}/roles/${id}/permissions`);
  if (!response.ok) throw new Error("Failed to load role permissions");
  return response.json();
}

export async function setRolePermissions(id: string, permissions: string[]): Promise<string[]> {
  const response = await fetch(`${API}/roles/${id}/permissions`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissions }),
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}
