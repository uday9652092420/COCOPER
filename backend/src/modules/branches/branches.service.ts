/**
 * @file branches.service.ts
 * @description Business logic for the User Branches module.
 */

import type { Branch, BranchCreateDTO, BranchUpdateDTO } from './branches.types.js';
import {
  createBranchRepo,
  deleteBranchRepo,
  getBranchByIdRepo,
  listBranchesRepo,
  updateBranchRepo,
} from './branches.repository.js';

function normalizeCreate(payload: BranchCreateDTO): BranchCreateDTO {
  return {
    organization_id: payload.organization_id ?? null,
    branch_code: payload.branch_code ? String(payload.branch_code).trim() : null,
    branch_name: String(payload.branch_name).trim(),
    address: payload.address ? String(payload.address).trim() : null,
    contact_no: payload.contact_no ? String(payload.contact_no).trim() : null,
    status: payload.status ?? 'ACTIVE',
  };
}

function normalizeUpdate(payload: BranchUpdateDTO): BranchUpdateDTO {
  return {
    branch_code: payload.branch_code ? String(payload.branch_code).trim() : null,
    branch_name: String(payload.branch_name).trim(),
    address: payload.address ? String(payload.address).trim() : null,
    contact_no: payload.contact_no ? String(payload.contact_no).trim() : null,
    status: payload.status ?? 'ACTIVE',
  };
}

export async function listBranches(organizationId?: string | null): Promise<Branch[]> {
  return listBranchesRepo(organizationId ?? null);
}

export async function getBranchById(id: string): Promise<Branch | null> {
  return getBranchByIdRepo(id);
}

export async function createBranch(payload: BranchCreateDTO): Promise<Branch> {
  return createBranchRepo(normalizeCreate(payload));
}

export async function updateBranch(id: string, payload: BranchUpdateDTO): Promise<Branch | null> {
  return updateBranchRepo(id, normalizeUpdate(payload));
}

export async function deleteBranch(id: string): Promise<boolean> {
  return deleteBranchRepo(id);
}
