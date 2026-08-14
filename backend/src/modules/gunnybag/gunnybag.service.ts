/**
 * @file gunnybag.service.ts
 * @description Business/service layer for Gunny Bag Master.
 *
 * Handles:
 * - Gunny Bag CRUD
 * - Bharthi child records
 * - Payload validation
 * - Automatic Gunny Bag code generation
 */

import {
  createGunnyBagRepo,
  updateGunnyBagRepo,
  deleteGunnyBagRepo,
  listGunnyBagsRepo,
  getGunnyBagByIdRepo,
  getNextGunnyBagCodeRepo,
  checkGunnyBagUsageRepo,
} from "./gunnybag.repository.js";

import {
  GunnyBagCreateDTO,
} from "./gunnybag.types.js";

import {
  validateGunnyBagPayload,
} from "./gunnybag.validation.js";

/**
 * --------------------------------------------------------------------------
 * Get Next Gunny Bag Code
 * --------------------------------------------------------------------------
 */
export async function getNextGunnyBagCodeService(): Promise<string> {
  return await getNextGunnyBagCodeRepo();
}

/**
 * --------------------------------------------------------------------------
 * Create Gunny Bag
 * --------------------------------------------------------------------------
 *
 * Creates:
 * - Gunny Bag master record
 * - Bharthi child records
 *
 * Example payload:
 *
 * {
 *   code: "GB-001",
 *   name: "Jute Bag",
 *   size: "25x40 cm",
 *   rate_per_bag: 45,
 *   opening_stock: 100,
 *   status: "Active",
 *
 *   bharthi_types: [
 *     {
 *       bharthi: "120",
 *       stock: 30
 *     },
 *     {
 *       bharthi: "150",
 *       stock: 20
 *     },
 *     {
 *       bharthi: "180",
 *       stock: 40
 *     },
 *     {
 *       bharthi: "200",
 *       stock: 10
 *     }
 *   ]
 * }
 *
 * Bharthi codes are generated automatically:
 *
 * 120 -> B120
 * 150 -> B150
 * 180 -> B180
 * 200 -> B200
 */
export async function createGunnyBagService(
  payload: GunnyBagCreateDTO
) {
  /**
   * Generate code when frontend does not provide one.
   */
  if (!payload.code?.trim()) {
    payload.code = await getNextGunnyBagCodeRepo();
  }

  /**
   * Validate parent + child payload.
   */
  const errors = validateGunnyBagPayload(payload);

  if (errors) {
    const error = new Error(
      JSON.stringify(errors)
    );

    throw error;
  }

  /**
   * Repository handles the transaction:
   *
   * Gunny Bag
   *      +
   * Bharthi child records
   */
  return await createGunnyBagRepo(payload);
}

/**
 * --------------------------------------------------------------------------
 * Update Gunny Bag
 * --------------------------------------------------------------------------
 *
 * Updates:
 * - Gunny Bag master
 * - Bharthi child grid
 *
 * The repository replaces the existing Bharthi child rows with the
 * currently submitted grid.
 */
export async function updateGunnyBagService(
  id: string,
  payload: GunnyBagCreateDTO
) {
  /**
   * Check whether Gunny Bag exists.
   */
  const existing =
    await getGunnyBagByIdRepo(id);

  if (!existing) {
    const error = new Error(
      "Gunny Bag not found"
    );

    throw error;
  }

  /**
   * Build complete update payload.
   *
   * Parent values fall back to existing values
   * when they are not supplied.
   */
  const updatedPayload: GunnyBagCreateDTO = {
    code:
      payload.code ?? existing.code,

    name:
      payload.name ?? existing.name,

    size:
      payload.size ?? existing.size,

    rate_per_bag:
      payload.rate_per_bag ??
      existing.rate_per_bag,

    opening_stock:
      payload.opening_stock ??
      existing.opening_stock,

    status:
      payload.status ??
      existing.status,

    /**
     * IMPORTANT:
     *
     * For update, use the submitted Bharthi grid.
     *
     * If the frontend sends no bharthi_types property,
     * preserve the existing child records.
     */
    bharthi_types:
      payload.bharthi_types ??
      existing.bharthi_types?.map(
        (item) => ({
          bharthi: item.bharthi,
          stock: item.stock,
        })
      ),
  };

  /**
   * Validate updated payload.
   */
  const errors =
    validateGunnyBagPayload(
      updatedPayload
    );

  if (errors) {
    const error = new Error(
      JSON.stringify(errors)
    );

    throw error;
  }

  /**
   * Repository updates parent and children
   * inside a single transaction.
   */
  return await updateGunnyBagRepo(
    id,
    updatedPayload
  );
}

/**
 * --------------------------------------------------------------------------
 * List Gunny Bags
 * --------------------------------------------------------------------------
 *
 * Returns Gunny Bags with their Bharthi child records.
 */
export async function listGunnyBagsService(organizationId?: string | null, branchId?: string | null) {
  return await listGunnyBagsRepo(organizationId ?? null, branchId ?? null);
}

/**
 * --------------------------------------------------------------------------
 * Get Single Gunny Bag
 * --------------------------------------------------------------------------
 *
 * Returns:
 *
 * Gunny Bag
 * +
 * Bharthi Types
 */
export async function getGunnyBagService(
  id: string
) {
  const bag =
    await getGunnyBagByIdRepo(id);

  if (!bag) {
    const error = new Error(
      "Gunny Bag not found"
    );

    throw error;
  }

  return bag;
}

/**
 * --------------------------------------------------------------------------
 * Delete Gunny Bag
 * --------------------------------------------------------------------------
 *
 * Before deletion, check whether the Gunny Bag
 * is being used by another module.
 *
 * If it is not used:
 *
 * - Bharthi child records are deleted
 * - Gunny Bag master record is deleted
 */
export async function deleteGunnyBagService(
  id: string
) {
  /**
   * Check parent existence.
   */
  const existing =
    await getGunnyBagByIdRepo(id);

  if (!existing) {
    const error = new Error(
      "Gunny Bag not found"
    );

    throw error;
  }

  /**
   * Check whether this Gunny Bag is already
   * referenced by another business module.
   */
  const usedIn =
    await checkGunnyBagUsageRepo(id);

  if (usedIn.length > 0) {
    const error = new Error(
      `Gunny Bag is used in ${usedIn.join(", ")}`
    );

    throw error;
  }

  /**
   * Repository deletes child + parent
   * transactionally.
   */
  return await deleteGunnyBagRepo(id);
}