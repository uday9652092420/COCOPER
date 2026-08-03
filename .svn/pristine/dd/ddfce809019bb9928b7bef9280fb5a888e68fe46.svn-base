/**
 * @file handlers.ts
 * @description High-level handlers wrapping dataStore operations for customer receipts.
 *
 * These functions are suitable to be used by frontend pages as a mock API.
 */

import type { CustomerReceiptCreatePayload, CustomerReceiptUpdatePayload, CustomerReceipt } from './types'
import { listCustomerReceipts, getCustomerReceipt, createCustomerReceipt, updateCustomerReceipt, deleteCustomerReceipt } from './dataStore'

/**
 * @function list
 * @description List all customer receipts.
 */
export const list = async (): Promise<CustomerReceipt[]> => {
  return listCustomerReceipts()
}

/**
 * @function getById
 * @description Get a single customer receipt by id.
 */
export const getById = async (id: string): Promise<CustomerReceipt | undefined> => {
  return getCustomerReceipt(id)
}

/**
 * @function add
 * @description Create a new customer receipt.
 */
export const add = async (payload: CustomerReceiptCreatePayload): Promise<CustomerReceipt> => {
  if (!payload.receiptNo) throw new Error('receiptNo is required')
  if (!payload.amount || Number(payload.amount) <= 0) throw new Error('amount must be greater than zero')
  return createCustomerReceipt(payload)
}

/**
 * @function edit
 * @description Update an existing customer receipt.
 */
export const edit = async (id: string, payload: CustomerReceiptUpdatePayload): Promise<CustomerReceipt> => {
  return updateCustomerReceipt(id, payload)
}

/**
 * @function remove
 * @description Delete a customer receipt by id.
 */
export const remove = async (id: string): Promise<void> => {
  return deleteCustomerReceipt(id)
}