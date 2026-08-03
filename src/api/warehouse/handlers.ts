/**
 * @file handlers.ts
 * @description High-level handlers wrapping dataStore operations. These can be used directly
 *              by frontend pages (e.g., WarehouseMasterPage) as mock API calls.
 *
 * Example:
 *  import * as WarehouseAPI from 'src/api/warehouse/handlers'
 *  const list = await WarehouseAPI.list()
 */

import type { WarehouseCreatePayload, WarehouseUpdatePayload, Warehouse } from './types'
import { listWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse } from './dataStore'

/**
 * @function list
 * @description List all warehouses.
 */
export const list = async (): Promise<Warehouse[]> => {
  return listWarehouses()
}

/**
 * @function getById
 * @description Get a single warehouse by id.
 */
export const getById = async (id: string): Promise<Warehouse | undefined> => {
  return getWarehouse(id)
}

/**
 * @function add
 * @description Create a new warehouse.
 */
export const add = async (payload: WarehouseCreatePayload): Promise<Warehouse> => {
  return createWarehouse(payload)
}

/**
 * @function edit
 * @description Update an existing warehouse.
 */
export const edit = async (id: string, payload: WarehouseUpdatePayload): Promise<Warehouse> => {
  return updateWarehouse(id, payload)
}

/**
 * @function remove
 * @description Delete a warehouse by id.
 */
export const remove = async (id: string): Promise<void> => {
  return deleteWarehouse(id)
}