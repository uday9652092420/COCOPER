/**
 * @file branches.service.ts
 * @description API service for the User Branches module.
 */

import { API } from "../../config/api";
import { getOrgHeader } from "../../utils/apiHeaders";

export interface Branch {
  id: string;
  organization_id: string | null;
  branch_code: string | null;
  branch_name: string;
  address: string | null;
  contact_no: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BranchPayload {
  organization_id?: string | null;
  branch_code?: string | null;
  branch_name: string;
  address?: string | null;
  contact_no?: string | null;
  status?: string;
}

export async function getBranches(): Promise<Branch[]> {
  const response = await fetch(`${API}/branches`, { headers: getOrgHeader() });
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to load branches" }));
  return response.json();
}

export async function getNextBranchCode(): Promise<string> {
  const response = await fetch(`${API}/branches/next-code`, { headers: getOrgHeader() });
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to generate branch code" }));
  const data = await response.json();
  return data.code;
}

export async function createBranch(payload: BranchPayload): Promise<Branch> {
  const response = await fetch(`${API}/branches`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}

export async function updateBranch(id: string, payload: Partial<BranchPayload>): Promise<Branch> {
  const response = await fetch(`${API}/branches/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}

export async function deleteBranch(id: string): Promise<void> {
  const response = await fetch(`${API}/branches/${id}`, { method: "DELETE" });
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to delete branch" }));
}

export interface UserBranchAssignment {
  branch_ids: string[];
  default_branch_id: string | null;
}

export async function getUserBranches(userId: string): Promise<UserBranchAssignment> {
  const response = await fetch(`${API}/branches/user-branches/${userId}`, {
    headers: getOrgHeader(),
  });
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to load user branches" }));
  return response.json();
}

export async function setUserBranches(
  userId: string,
  payload: { branchIds: string[]; defaultBranchId: string | null }
): Promise<UserBranchAssignment> {
  const response = await fetch(`${API}/branches/user-branches/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}
