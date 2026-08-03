/**
 * @file handlers.ts
 * @description High-level handlers wrapping dataStore operations for bag purchases.
 *
 * These functions are suitable to be used by frontend pages as a mock API.
 */

import type { BagPurchaseCreatePayload, BagPurchaseUpdatePayload, BagPurchase } from './types'
import { listBagPurchases, getBagPurchase, createBagPurchase, updateBagPurchase, deleteBagPurchase } from './dataStore'

/**
 * @function list
 * @description List all bag purchases.
 */
export const list = async (): Promise<BagPurchase[]> => {
  return listBagPurchases()
}

/**
 * @function getById
 * @description Get a single bag purchase by id.
 */
export const getById = async (id: string): Promise<BagPurchase | undefined> => {
  return getBagPurchase(id)
}

/**
 * @function add
 * @description Create a new bag purchase.
 */
export const add = async (payload: BagPurchaseCreatePayload): Promise<BagPurchase> => {
  return createBagPurchase(payload)
}

/**
 * @function edit
 * @description Update an existing bag purchase.
 */
export const edit = async (id: string, payload: BagPurchaseUpdatePayload): Promise<BagPurchase> => {
  return updateBagPurchase(id, payload)
}

/**
 * @function remove
 * @description Delete a bag purchase by id.
 */
export const remove = async (id: string): Promise<void> => {
  return deleteBagPurchase(id)
}