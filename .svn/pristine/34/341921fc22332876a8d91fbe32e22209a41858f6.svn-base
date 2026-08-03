/**
 * @file types.ts
 * @description Type definitions for Customer Receipt API (mock implementation).
 */

/**
 * @typedef PaymentMode
 * @description Allowed payment modes for a receipt.
 */
export type PaymentMode = 'Cash' | 'Cheque' | 'Online' | 'Credit'

/**
 * @interface CustomerReceipt
 * @description A single customer receipt record.
 */
export interface CustomerReceipt {
  id: string
  receiptNo: string
  customerId?: string
  customerName?: string
  receiptDate: string // YYYY-MM-DD
  amount: number
  paymentMode: PaymentMode
  referenceNo?: string
  remarks?: string
  createdAt: string // YYYY-MM-DD
}

/**
 * @interface CustomerReceiptCreatePayload
 * @description Payload to create a new customer receipt.
 */
export interface CustomerReceiptCreatePayload {
  receiptNo: string
  customerId?: string
  customerName?: string
  receiptDate?: string
  amount: number
  paymentMode?: PaymentMode
  referenceNo?: string
  remarks?: string
}

/**
 * @interface CustomerReceiptUpdatePayload
 * @description Payload to update an existing customer receipt.
 */
export interface CustomerReceiptUpdatePayload {
  customerId?: string
  customerName?: string
  receiptDate?: string
  amount?: number
  paymentMode?: PaymentMode
  referenceNo?: string
  remarks?: string
}