/**
 * @file src/api/supplierPayment/handlers.ts
 * @description High-level handlers wrapping dataStore operations for supplier payments.
 *
 * These functions are suitable to be used by frontend pages as a mock API.
 */

import type {
  SupplierPayment,
  SupplierPaymentCreatePayload,
  SupplierPaymentUpdatePayload,
} from './types'
import {
  listSupplierPayments,
  getSupplierPayment,
  createSupplierPayment,
  updateSupplierPayment,
  deleteSupplierPayment,
} from './dataStore'

/**
 * @function list
 * @description List all supplier payments.
 */
export const list = async (): Promise<SupplierPayment[]> => {
  return listSupplierPayments()
}

/**
 * @function getById
 * @description Get a single supplier payment by id.
 */
export const getById = async (id: string): Promise<SupplierPayment | undefined> => {
  return getSupplierPayment(id)
}

/**
 * @function add
 * @description Create a new supplier payment.
 */
export const add = async (payload: SupplierPaymentCreatePayload): Promise<SupplierPayment> => {
  if (!payload.paymentNumber) throw new Error('paymentNumber is required')
  if (Number(payload.amount) <= 0) throw new Error('amount must be greater than zero')
  return createSupplierPayment(payload)
}

/**
 * @function edit
 * @description Update an existing supplier payment.
 */
export const edit = async (payload: SupplierPaymentUpdatePayload): Promise<SupplierPayment> => {
  if (!payload.id) throw new Error('id is required for update')
  return updateSupplierPayment(payload)
}

/**
 * @function remove
 * @description Delete a supplier payment by id.
 */
export const remove = async (id: string): Promise<void> => {
  return deleteSupplierPayment(id)
}