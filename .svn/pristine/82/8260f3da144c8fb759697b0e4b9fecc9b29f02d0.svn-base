/**
 * @file handlers.ts
 * @description High-level handlers wrapping dataStore operations for purchase orders.
 *
 * These functions are suitable to be used by frontend pages as a mock API.
 */

import type {
  PurchaseOrder,
  PurchaseOrderCreatePayload,
  PurchaseOrderUpdatePayload,
} from './types'
import {
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from './dataStore'

/**
 * @function list
 * @description List all purchase orders.
 */
export const list = async (): Promise<PurchaseOrder[]> => {
  return listPurchaseOrders()
}

/**
 * @function getById
 * @description Get a single purchase order by id.
 */
export const getById = async (id: string): Promise<PurchaseOrder | undefined> => {
  return getPurchaseOrder(id)
}

/**
 * @function add
 * @description Create a new purchase order.
 */
export const add = async (payload: PurchaseOrderCreatePayload): Promise<PurchaseOrder> => {
  if (!payload.orderNo) throw new Error('orderNo is required')
  // minimal validation: supplier optional but orderNo required and total items allowed to be empty
  return createPurchaseOrder(payload)
}

/**
 * @function edit
 * @description Update an existing purchase order.
 */
export const edit = async (payload: PurchaseOrderUpdatePayload): Promise<PurchaseOrder> => {
  if (!payload.id) throw new Error('id is required for update')
  return updatePurchaseOrder(payload)
}

/**
 * @function remove
 * @description Delete a purchase order by id.
 */
export const remove = async (id: string): Promise<void> => {
  return deletePurchaseOrder(id)
}