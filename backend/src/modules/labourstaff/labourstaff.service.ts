/**
 * @file labourstaff.service.ts
 * @description Service layer for Labour Staff Master.
 */

import {
  createLabourSchema,
  updateLabourSchema,
} from "./labourstaff.validation.js";

import {
  listLabourStaffRepository,
  getLabourStaffRepository,
  getLabourStaffByNameRepository,
  createLabourStaffRepository,
  updateLabourStaffRepository,
  deleteLabourStaffRepository,
} from "./labourstaff.repository.js";

import type {
  LabourStaff,
  CreateLabourRequest,
  UpdateLabourRequest,
} from "./labourstaff.types.js";

/**
 * List Labour Staff
 */
export async function listLabourStaffService(organizationId?: string | null): Promise<LabourStaff[]> {
  return await listLabourStaffRepository(organizationId ?? null);
}

/**
 * Get Labour By Id
 */
export async function getLabourStaffService(
  id: string
): Promise<LabourStaff> {
  const labour = await getLabourStaffRepository(id);

  if (!labour) {
    throw {
      status: 404,
      message: "Labour not found",
    };
  }

  return labour;
}

/**
 * Create Labour
 */
export async function createLabourStaffService(
   payload: CreateLabourRequest
): Promise<LabourStaff> {
  const validated = createLabourSchema.parse(payload);

  const duplicate = await getLabourStaffByNameRepository(
    validated.labour_name
  );

  if (duplicate) {
    throw {
      status: 409,
      message: "Labour name already exists",
    };
  }

  return await createLabourStaffRepository(validated);
}

/**
 * Update Labour
 */
export async function updateLabourStaffService(
  id: string,
  payload: UpdateLabourRequest
): Promise<LabourStaff> {
  const existing = await getLabourStaffRepository(id);

  if (!existing) {
    throw {
      status: 404,
      message: "Labour not found",
    };
  }

  const validated = updateLabourSchema.parse(payload);

  if (validated.labour_name) {
    const duplicate = await getLabourStaffByNameRepository(
      validated.labour_name
    );

    if (duplicate && duplicate.id !== id) {
      throw {
        status: 409,
        message: "Labour name already exists",
      };
    }
  }

  return await updateLabourStaffRepository(id, validated);
}

/**
 * Delete Labour
 */
export async function deleteLabourStaffService(
  id: string
): Promise<{ message: string }> {
  const existing = await getLabourStaffRepository(id);

  if (!existing) {
    throw {
      status: 404,
      message: "Labour not found",
    };
  }

  await deleteLabourStaffRepository(id);

  return {
    message: "Labour deleted successfully",
  };
}