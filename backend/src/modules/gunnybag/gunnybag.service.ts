import {
  createGunnyBagRepo,
  updateGunnyBagRepo,
  deleteGunnyBagRepo,
  listGunnyBagsRepo,
  getGunnyBagByIdRepo,
  getNextGunnyBagCodeRepo,
  checkGunnyBagUsageRepo,
} from "./gunnybag.repository.js";

import { GunnyBagCreateDTO } from "./gunnybag.types.js";
import { validateGunnyBagPayload } from "./gunnybag.validation.js";

/**
 * Get Next Gunny Bag Code
 */
export async function getNextGunnyBagCodeService() {
  return await getNextGunnyBagCodeRepo();
}

/**
 * Create Gunny Bag
 */
export async function createGunnyBagService(
  payload: GunnyBagCreateDTO
) {
  if (!payload.code?.trim()) {
    payload.code = await getNextGunnyBagCodeRepo();
  }

  const errors = validateGunnyBagPayload(payload);

  if (errors) {
    throw new Error(JSON.stringify(errors));
  }

  return await createGunnyBagRepo(payload);
}

/**
 * Update Gunny Bag
 */
export async function updateGunnyBagService(
  id: string,
  payload: GunnyBagCreateDTO
) {
  const existing = await getGunnyBagByIdRepo(id);

  if (!existing) {
    throw new Error("Gunny Bag not found");
  }

  const updatedPayload: GunnyBagCreateDTO = {
    code: payload.code ?? existing.code,
    name: payload.name ?? existing.name,
    size: payload.size ?? existing.size,
    rate_per_bag:
      payload.rate_per_bag ?? existing.rate_per_bag,
    opening_stock:
      payload.opening_stock ?? existing.opening_stock,
    status: payload.status ?? existing.status,
  };

  const errors = validateGunnyBagPayload(updatedPayload);

  if (errors) {
    throw new Error(JSON.stringify(errors));
  }

  return await updateGunnyBagRepo(id, updatedPayload);
}

/**
 * List Gunny Bags
 */
export async function listGunnyBagsService() {
  return await listGunnyBagsRepo();
}

/**
 * Get Single Gunny Bag
 */
export async function getGunnyBagService(id: string) {
  const bag = await getGunnyBagByIdRepo(id);

  if (!bag) {
    throw new Error("Gunny Bag not found");
  }

  return bag;
}

/**
 * Delete Gunny Bag
 */
export async function deleteGunnyBagService(id: string) {
  const usedIn = await checkGunnyBagUsageRepo(id);

  if (usedIn.length) {
    throw new Error(
      `Gunny Bag is used in ${usedIn.join(", ")}`
    );
  }

  return await deleteGunnyBagRepo(id);
}