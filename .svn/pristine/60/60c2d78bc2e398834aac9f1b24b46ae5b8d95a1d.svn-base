/**
 * @file src/api/purchaseInvoice/handlers.ts
 * @description High-level handlers wrapping dataStore operations for purchase invoices.
 *
 * These functions are suitable to be used by frontend pages as a mock API.
 */

import type {
  PurchaseInvoice,
  PurchaseInvoiceCreatePayload,
  PurchaseInvoiceUpdatePayload,
} from './types'
import {
  listPurchaseInvoices,
  getPurchaseInvoice,
  createPurchaseInvoice,
  updatePurchaseInvoice,
  deletePurchaseInvoice,
} from './dataStore'

/**
 * @function list
 * @description List all purchase invoices.
 */
export const list = async (): Promise<PurchaseInvoice[]> => {
  return listPurchaseInvoices()
}

/**
 * @function getById
 * @description Get a single purchase invoice by id.
 */
export const getById = async (id: string): Promise<PurchaseInvoice | undefined> => {
  return getPurchaseInvoice(id)
}

/**
 * @function add
 * @description Create a new purchase invoice.
 */
export const add = async (payload: PurchaseInvoiceCreatePayload): Promise<PurchaseInvoice> => {
  if (!payload.invoiceNo) throw new Error('invoiceNo is required')
  return createPurchaseInvoice(payload)
}

/**
 * @function edit
 * @description Update an existing purchase invoice.
 */
export const edit = async (payload: PurchaseInvoiceUpdatePayload): Promise<PurchaseInvoice> => {
  if (!payload.id) throw new Error('id is required for update')
  return updatePurchaseInvoice(payload)
}

/**
 * @function remove
 * @description Delete a purchase invoice by id.
 */
export const remove = async (id: string): Promise<void> => {
  return deletePurchaseInvoice(id)
}