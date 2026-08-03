/**
 * @file src/api/supplier/handlers.ts
 * @description Handler wrappers around dataStore to simulate a small API surface for suppliers.
 *
 * Exports:
 * - fetchSuppliers
 * - fetchSupplier
 * - addSupplier
 * - editSupplier
 * - removeSupplier
 *
 * Each function returns a Promise and can be used by frontend code as a mock HTTP client.
 */

import type { Supplier, NewSupplier, UpdateSupplier } from './types'
import * as store from './dataStore'

/**
 * @function fetchSuppliers
 * @description Fetch list of suppliers.
 */
export const fetchSuppliers = async (): Promise<Supplier[]> => {
  return store.listSuppliers()
}

/**
 * @function fetchSupplier
 * @description Fetch a single supplier by id.
 */
export const fetchSupplier = async (id: string): Promise<Supplier | undefined> => {
  return store.getSupplier(id)
}

/**
 * @function addSupplier
 * @description Create a new supplier record.
 */
export const addSupplier = async (payload: NewSupplier): Promise<Supplier> => {
  if (!payload.code || !payload.name) {
    throw new Error('code and name are required')
  }
  return store.createSupplier(payload)
}

/**
 * @function editSupplier
 * @description Update an existing supplier record.
 */
export const editSupplier = async (payload: UpdateSupplier): Promise<Supplier> => {
  if (!payload.id) throw new Error('id is required for update')
  return store.updateSupplier(payload)
}

/**
 * @function removeSupplier
 * @description Delete a supplier by id.
 */
export const removeSupplier = async (id: string): Promise<void> => {
  return store.deleteSupplier(id)
}