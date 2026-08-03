/**
 * @file src/api/directSales/handlers.ts
 * @description High-level handlers wrapping dataStore operations for direct sales.
 *
 * These functions are suitable to be used by frontend pages as a mock API.
 */

import type {
  DirectSale,
  DirectSaleCreatePayload,
  DirectSaleUpdatePayload,
} from './types'
import {
  listDirectSales,
  getDirectSale,
  createDirectSale,
  updateDirectSale,
  deleteDirectSale,
} from './dataStore'

/**
 * @function list
 * @description List all direct sales.
 */
export const list = async (): Promise<DirectSale[]> => {
  return listDirectSales()
}

/**
 * @function getById
 * @description Get a single direct sale by id.
 */
export const getById = async (id: string): Promise<DirectSale | undefined> => {
  return getDirectSale(id)
}

/**
 * @function add
 * @description Create a new direct sale.
 */
export const add = async (payload: DirectSaleCreatePayload): Promise<DirectSale> => {
  // Basic validation
  if (!payload.invoiceNo) throw new Error('invoiceNo is required')
  if (payload.items && payload.items.length === 0) {
    // allow header-only sales, but warn (validation left minimal)
  }
  return createDirectSale(payload)
}

/**
 * @function edit
 * @description Update an existing direct sale.
 */
export const edit = async (payload: DirectSaleUpdatePayload): Promise<DirectSale> => {
  if (!payload.id) throw new Error('id is required for update')
  return updateDirectSale(payload)
}

/**
 * @function remove
 * @description Delete a direct sale by id.
 */
export const remove = async (id: string): Promise<void> => {
  return deleteDirectSale(id)
}