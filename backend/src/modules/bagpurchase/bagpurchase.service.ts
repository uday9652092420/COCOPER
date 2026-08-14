
/**
 * @file bagpurchase.service.ts
 * @description Business logic for Bag Purchase module.
 */

import {
  getNextBagPurchaseNoRepo,
  getBagPurchasesRepo,
  getBagPurchaseRepo,
  createBagPurchaseRepo,
  updateBagPurchaseRepo,
  deleteBagPurchaseRepo,
} from "./bagpurchase.repository.js";




import {
  validateBagPurchasePayload,
} from "./bagpurchase.validation.js";

import type {
  BagPurchaseCreatePayload,
} from "./bagpurchase.types.js";

/**
 * ============================================================
 * Get Next Purchase Number
 * ============================================================
 */
export async function getNextBagPurchaseNoService() {
  return getNextBagPurchaseNoRepo();
}

/**
 * ============================================================
 * Get All Purchases
 * ============================================================
 */
export async function getBagPurchasesService(organizationId?: string | null, branchId?: string | null) {
  return getBagPurchasesRepo(organizationId ?? null, branchId ?? null);
}

/**
 * ============================================================
 * Get Purchase By ID
 * ============================================================
 */
export async function getBagPurchaseService(
  id: string
) {
  const purchase =
    await getBagPurchaseRepo(id);

  if (!purchase) {
    throw new Error(
      "Bag Purchase not found"
    );
  }

  return purchase;
}

/**
 * ============================================================
 * Create Purchase
 * ============================================================
 */
export async function createBagPurchaseService(
  payload: BagPurchaseCreatePayload
) {
  validateBagPurchasePayload(
    payload
  );

  const purchaseNo =
    await getNextBagPurchaseNoRepo();

  return createBagPurchaseRepo(
    purchaseNo,
    payload
  );
}

/**
 * ============================================================
 * Update Purchase
 * ============================================================
 */
export async function updateBagPurchaseService(
  id: string,
  payload: BagPurchaseCreatePayload
) {
  validateBagPurchasePayload(
    payload
  );

  return updateBagPurchaseRepo(
    id,
    payload
  );
}

/**
 * ============================================================
 * Delete Purchase
 * ============================================================
 */
export async function deleteBagPurchaseService(
  id: string
) {
  return deleteBagPurchaseRepo(
    id
  );
}
